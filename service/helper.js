module.exports = {
    createUndeployMetadataZip: async function (fs,tempDirectory,path,archiver,TriggerName) {
        if (!fs.existsSync(tempDirectory)) {
            fs.mkdirSync(tempDirectory);
        }
    
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(path.join(tempDirectory, 'package.zip'));
            const archive = archiver('zip', { zlib: { level: 9 } });
    
            output.on('close', () => {
                console.log(`Deployment package created (${archive.pointer()} bytes)`);
                resolve(path.join(tempDirectory, 'package.zip'));
            });
    
            archive.on('error', reject);
            archive.pipe(output);
    
            // Generate package.xml
            const packageXml = `<?xml version="1.0" encoding="UTF-8"?>
    <Package xmlns="http://soap.sforce.com/2006/04/metadata">
        <version>61.0</version>
    </Package>`;
            archive.append(packageXml, { name: 'package.xml' });
    
            // Add destructiveChanges.xml to the archive
            const destructiveChangesXml = `<?xml version="1.0" encoding="utf-8"?>
            <Package xmlns="http://soap.sforce.com/2006/04/metadata">
                 <types>
                      <members>${TriggerName}</members>
                      <name>ApexTrigger</name>
                 </types>
            <version>61.0</version>
            </Package>`;
            archive.append(destructiveChangesXml, { name: 'destructiveChanges.xml' });
    
            archive.finalize();
        });
    },
    getSalesforceAccessToken : async function(creds,request){
        //const myHeaders = new Headers();
        //myHeaders.append("Cookie", "BrowserId=AbHvaA39Ee-dMYOqR4NQ2Q; CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1");
        return new Promise((resolve,reject)=>{
            /*const requestOptions = {
                method: "GET",
                //headers: myHeaders,
                //redirect: "follow"
                };
                fetch(url, requestOptions)
                .then((response) => response.text())
                .then((result) => {console.log(result);resolve(result)})
                .catch((error) => {console.error(error);reject(error);});*/
                let url ='https://cereblis--partialsb.sandbox.my.salesforce.com/services/oauth2/token?grant_type=client_credentials&client_id='+creds.credentials.clientId+'&client_secret='+creds.credentials.clientSecret;
                
                var options = {
                'method': 'GET',
                'url': url,
                'headers': {
                    //'Cookie': 'BrowserId=AbHvaA39Ee-dMYOqR4NQ2Q; CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1'
                }
                };
                request(options, function (error, response) {
                if (error) {
                    console.log('error');
                    resolve(error);
                }
                if(response){
                    console.log('response');
                    resolve(response);
                }
                
                });

        })
        
    },
    createMetadataZip: async function (fs,tempDirectory,path,archiver,triggerDirectory,apexDirectory) {
        if (!fs.existsSync(tempDirectory)) {
            fs.mkdirSync(tempDirectory);
        }
    
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(path.join(tempDirectory, 'package.zip'));
            const archive = archiver('zip', { zlib: { level: 9 } });
    
            output.on('close', () => {
                console.log(`Deployment package created (${archive.pointer()} bytes)`);
                resolve(path.join(tempDirectory, 'package.zip'));
            });
    
            archive.on('error', reject);
            archive.pipe(output);
    
            const addFilesToPackageXml = (directory, fileExtension) => {
                return fs
                    .readdirSync(directory)
                    .filter(file => path.extname(file).toLowerCase() === fileExtension)
                    .map(file => `<members>${path.basename(file, fileExtension)}</members>`)
                    .join('\n        ');
            };
    
            // Generate package.xml
            const packageXml = `<?xml version="1.0" encoding="UTF-8"?>
    <Package xmlns="http://soap.sforce.com/2006/04/metadata">
        <types>
            <name>ApexClass</name>
            ${addFilesToPackageXml(apexDirectory, '.cls')}
        </types>
        <types>
            <name>ApexTrigger</name>
            ${addFilesToPackageXml(triggerDirectory, '.trigger')}
        </types>
        <version>61.0</version>
    </Package>`;
    
            archive.append(packageXml, { name: 'package.xml' });
    
            // Add Apex classes and triggers to the archive
            fs.readdirSync(apexDirectory)
                .filter(file => path.extname(file).toLowerCase() === '.cls')
                .forEach(file => {
                    const className = path.basename(file, '.cls');
                    const classContent = fs.readFileSync(path.join(apexDirectory, file), 'utf8');
                    archive.append(classContent, { name: `classes/${file}` });
    
                    const metaXml = `<?xml version="1.0" encoding="UTF-8"?>
    <ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
        <apiVersion>62.0</apiVersion>
        <status>Active</status>
    </ApexClass>`;
                    archive.append(metaXml, { name: `classes/${className}.cls-meta.xml` });
                });
    
            fs.readdirSync(triggerDirectory)
                .filter(file => path.extname(file).toLowerCase() === '.trigger')
                .forEach(file => {
                    const triggerName = path.basename(file, '.trigger');
                    const triggerContent = fs.readFileSync(path.join(triggerDirectory, file), 'utf8');
                    archive.append(triggerContent, { name: `triggers/${file}` });
    
                    const metaXml = `<?xml version="1.0" encoding="UTF-8"?>
    <ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata">
        <apiVersion>61.0</apiVersion>
        <status>Active</status>
    </ApexTrigger>`;
                    archive.append(metaXml, { name: `triggers/${triggerName}.trigger-meta.xml` });
                });
    
            archive.finalize();
        });
    },
    getRefFieldsOfRecord: async function(conn, sobject,fs, mainRec, recIds) {
        return new Promise(async (resolve,reject)=>{
            // const field_perms = await conn.sobject("FieldPermissions").find({ SObjectType: sobject, PermissionsEdit : true, PermissionsRead :true, 'Parent.Profile.Name' :'System Administrator' })
            // console.log('field_perms::',field_perms);
            // let fieldAPIs = field_perms.map(x=>x['Field'].replace(sobject+'.', ''));
            const res = await conn.describe(sobject);
            let fieldTypes = res.fields.map(x=>x.type);
            console.log('fieldTypes::',fieldTypes);
            let fieldsArr =[];
            for(let field of res.fields){
                if(field.updateable == true)
                {
                    if(field.createable && field.name != 'OwnerId' && field.name !='CTMS__eDOA_Completion__c' && field.name !='RecordTypeId' && !field.name.includes('__pc')){
                        let obj={}
                        obj['API'] = field.name;
                        obj['Type'] = field.type;
                        obj['Lable'] = field.label;
                        obj['ObjAPI'] = field.referenceTo;
                        if( !(field.referenceTo.includes("Organization") || field.referenceTo.includes("Profile") || field.referenceTo.includes("User"))){
                            if(sobject  =='CTMS__Program__c' || sobject == 'CTMS__Clinical_Site__c'){
                                if(!(field.referenceTo.includes("CTMS__Study_Team__c")))
                                    fieldsArr.push(obj);
                            }
                            else{
                                fieldsArr.push(obj);
                            }
                        }
                    }
                }
                else{
                    if(field.nillable == false && field.createable && field.name != 'OwnerId' && field.name !='CTMS__eDOA_Completion__c' && field.name !='RecordTypeId' && !field.name.includes('__pc')){
                        let obj={}
                        obj['API'] = field.name;
                        obj['Type'] = field.type;
                        obj['Lable'] = field.label;
                        obj['ObjAPI'] = field.referenceTo;
                        if(!(field.referenceTo.includes("Organization") || field.referenceTo.includes("Profile") || field.referenceTo.includes("User")))
                            fieldsArr.push(obj);
                    }
                }
            }
            let soql = '';let queryRes='';
            if(mainRec){
                soql =  'SELECT Id, '+fieldsArr.map(x =>x.API).join() +' FROM '+ sobject +' LIMIT 1' ;
                console.log('135::soql::',soql);
                fs.appendFileSync('./temp1.json','sobject::'+sobject+'\n' +'173::'+soql+ '\n');
                queryRes = await conn.query(soql);
                console.log('queryRes::',queryRes);
                if(queryRes['totalSize'] ==0){
                    reject('No data found for the sobject..');
                }
                //fs.appendFileSync('./temp1.json'+ '\n'+JSON.stringify(queryRes)+'\n');
                fs.appendFileSync('./temp1.json', soql+ '\n'+' resp:: '+JSON.stringify(queryRes)+'\n RefFields'+JSON.stringify(getRefFiledsObj(queryRes,fieldsArr))+'\nRecCount::'+queryRes['totalSize']+'\n---------------\n');
                //fs.appendFileSync('./temp1.json', getRefFiledsObj(queryRes,fieldsArr)+ '\n'+JSON.stringify(queryRes)+'\n');
                resolve({'sobjRec' : queryRes , 'refFields' : getRefFiledsObj(queryRes,fieldsArr), 'fieldsArr':fieldsArr, 'refMap' :getRefFiledsMap(queryRes,fieldsArr)})
            }
            else{
                console.log('recIds::',recIds);
                console.log('fields::',fieldsArr.map(x =>x.API));
                for(var i in recIds){ recIds[i] = 'id=\''+ recIds[i]+'\''}
                console.log('recIds::',recIds);
                //fs.appendFileSync('./temp1.json','\n 206recIds::'+ JSON.stringify(recIds)+'\n');
                let allFields =fieldsArr.map(x =>x.API).join() ;
                if(allFields)
                    soql =  'SELECT Id,'+allFields +' FROM '+ sobject +' where '+recIds.join(' or ') ;
                else
                    soql = 'SELECT Id '+' FROM '+ sobject +' where '+recIds.join(' or ') ;
                console.log('150::soql::',soql);
                
                queryRes = await conn.query(soql);
                console.log('==>queryRes::',queryRes);
                fs.appendFileSync('./temp1.json','sobject::'+sobject+'::'+recIds.join(' or ')+'\n' + '157::'+ soql+ '\n'+' resp:: '+JSON.stringify(queryRes)+'\n RefFields:'+ JSON.stringify(getRefFiledsObj(queryRes,fieldsArr))+'\nRecCount::'+queryRes['totalSize']+'\n---------------\n');
                //fs.appendFileSync('./temp1.json'+ '\n'+JSON.stringify(queryRes)+'\n');
                //fs.appendFileSync('./temp1.json'+ '\n\n');
                //fs.appendFileSync('./temp1.json', getRefFiledsObj(queryRes,fieldsArr)+ '\n'+JSON.stringify(queryRes)+'\n');
                resolve({'sobjRec' : queryRes , 'refFields' : getRefFiledsObj(queryRes,fieldsArr), 'fieldsArr':fieldsArr,'refMap' :getRefFiledsMap(queryRes,fieldsArr)})
            }
            
            //refFields = getRefFiledsObj(queryRes,fieldsArr);
            //fs.appendFileSync('./temp1.json', refFields+ '\n'+JSON.stringify(queryRes)+'\n');
        })
        //return {'sobjRec' : queryRes , 'refFields' : refFields};
        
    },
    compareArrays : function (recIds, idmap){
        let arr=[];
        for(let recId of recIds){
            if( recId in idmap &&  idmap[recId] == false){
                arr.push(recId);
            }
        }
        return arr;
    },
    createTstData : function(queryRes, sobject,fieldsArr,level){
        let instVar = randomString(4);
        let recId='';
        let accApex = '//'+level+'\n' +sobject +' '+instVar+' = new '+ sobject+' ();\n';
        for(let rec of queryRes.records){
            for(let key in rec){
                recId = rec['Id'];
                if(key !='attributes' && rec[key] != null && key != 'Id' )
                    {
                        console.log('key::',key);
                        console.log('fieldsArr::',fieldsArr);
                        let fieldData = fieldsArr.filter(x=>x.API == key);
                        console.log('fieldData::',fieldData);
                        let temp ='';
                        if(fieldData[0]['Type'] == 'multipicklist'||fieldData[0]['Type'] == 'picklist'||fieldData[0]['Type'] == 'text'|| fieldData[0]['Type'] =='string' ||fieldData[0]['Type'] =='id'|| fieldData[0]['Type'] =='reference' ||fieldData[0]['Type'] =='textarea'||fieldData[0]['Type'] =='url'||fieldData[0]['Type'] =='email'){
                            console.log('key val::',rec[key]);
                            let val = rec[key].replace(/(\r\n|\n|\r)/gm, "");
                            temp =  instVar+'.'+key +' = \''+ val.replaceAll(/'/g, '') +'\';\n';
                        }
                        else if(fieldData[0]['Type'] == 'address'){
                            for(let keyId in rec[key]){
                                //temp = instVar+'.'+keyId +' = \''+ rec[key][keyId] +'\';\n';
                            }
                        }
                        else if(fieldData[0]['Type'] == 'date'){
                            let dateStr = rec[key].split('-');
                            console.log('dateStr::',dateStr);
                            temp = instVar+'.'+key +' = Date.newInstance('+dateStr[0] +',' +dateStr[1]+','+dateStr[2]+');\n';
                        }
                        else if(fieldData[0]['Type'] == 'phone'){
                            let phoneStr = rec[key].replace('(','').replace(')','').replace('-','').replace(' ','');
                            console.log('phoneStr::',phoneStr);
                            temp = instVar+'.'+key +' = \''+ phoneStr +'\';\n';
                        }
                        else if(fieldData[0]['Type'] == 'datetime'){
                            let dateTimeStr = rec[key].replace('T','-').replaceAll(':','-').split('.')[0].split('-');
                            console.log('dateTimeStr::',dateTimeStr);
                            temp = instVar+'.'+key +' = Datetime.newInstance('+dateTimeStr[0]+','+ dateTimeStr[1]+','+ dateTimeStr[2]+','+ dateTimeStr[3]+','+ dateTimeStr[4]+','+ dateTimeStr[5] +');\n';
                        }
                        else
                            temp =  instVar+'.'+key +' = '+ rec[key] +';\n';
                        accApex += temp;
                    }
            }
        }
        accApex += 'insert '+instVar+';\n';
        return {"tstCls" :accApex, "var" : instVar, "recId" :recId};

    },
    reorderTstClsData(finalFinalArray,fs){
        fs.appendFileSync('./temp1.json', '\n299::'+'---------finalFinalArray init--------'+ '\n'+ JSON.stringify(finalFinalArray.length));
        let tempObjs =[];
        let obj={}
        let finaltestClassStr= finalFinalArray.reverse().map(x=>x['tstCls']);
        let allInsVars= finalFinalArray.reverse().map(x=>x['var']);
        let allrecIds= finalFinalArray.reverse().map(x=>x['recId']);
        fs.appendFileSync('./temp1.json', '\n299::'+'---------allrecIds--------'+ '\n'+ JSON.stringify(allrecIds));
        for(let arr of finalFinalArray){
            obj[arr['recId']] = arr['var']+'.Id';
        }
        fs.appendFileSync('./temp1.json', '\n299::'+'---------obj--------'+ '\n'+ JSON.stringify(obj));
        for(let arr of finalFinalArray){
            for(let recId of allrecIds){
                if(arr['tstCls'].includes(recId)){
                    arr['tstCls'] = arr['tstCls'].replace('\''+recId+'\'',obj[recId]);
                }
            }
        }
        fs.appendFileSync('./temp1.json', '\n299::'+'---------finalFinalArray modified--------'+ '\n'+ JSON.stringify(finalFinalArray));

        for(let arr of finalFinalArray){
            let instVarArr=[];
            for(let instVar of allInsVars){
                if(arr['tstCls'].includes(instVar+'.Id'))
                {
                    instVarArr.push(instVar+'.Id');
                }
            }
            arr['vars'] = instVarArr;
        }
        fs.appendFileSync('./temp1.json', '\n299::'+'---------tempObjs--------'+ '\n'+ JSON.stringify(finalFinalArray));
        finalFinalArray.sort((a,b) => (a['vars'].length > b['vars'].length) ? 1 : ((b['vars'].length > a['vars'].length) ? -1 : 0))
        fs.appendFileSync('./temp1.json', '\n299::'+'---------FinaltempObjs--------'+ '\n'+ JSON.stringify(finalFinalArray));
        let dependency_0 = finalFinalArray.filter(x=>x['vars'].length ==0);
        fs.appendFileSync('./temp1.json', '\n299::'+'---------dependency_0--------'+ '\n'+ JSON.stringify(dependency_0));
        let non_0_dependency = finalFinalArray.filter(x=>x['vars'].length !=0);
        fs.appendFileSync('./temp1.json', '\n299::'+'---------non_0_dependency--------'+ '\n'+ JSON.stringify(non_0_dependency));
        let dependency_0_vars =dependency_0.map(x=>x['var']+'.Id');
        fs.appendFileSync('./temp1.json', '\n299::'+'---------dependency_0_vars--------'+ '\n'+ JSON.stringify(dependency_0_vars));
        let non_0_dependency_Remain =[];
        for(let arr of non_0_dependency){
            console.log('arr[\'vars\']::',arr['vars']);
            let count =0;
            for(let var1 of arr['vars']){
                if(dependency_0_vars.includes(var1)){
                    count++;
                }
            }
            if(count == arr['vars'].length){
                dependency_0.push(arr);
            }
            else{
                non_0_dependency_Remain.push(arr);
            }
        }
        fs.appendFileSync('./temp1.json', '\n299::'+'---------dependency_00--------'+ '\n'+ JSON.stringify(dependency_0));
        fs.appendFileSync('./temp1.json', '\n299::'+'---------non_0_dependency_Remain--------'+ '\n'+ JSON.stringify(non_0_dependency_Remain));
        let non_1_dependency=[];
        if(non_0_dependency_Remain && non_0_dependency_Remain.length >0){
            dependency_0_vars = dependency_0.map(x=>x['var']+'.Id');
            fs.appendFileSync('./temp1.json', '\n348::'+'---------dependency_0_vars--------'+ '\n'+ JSON.stringify(dependency_0_vars));
        
            for(let arr of non_0_dependency_Remain){
                console.log('arr[\'vars\']::',arr['vars']);
                let count =0;
                for(let var1 of arr['vars']){
                    if(dependency_0_vars.includes(var1)){
                        count++;
                    }
                }
                if(count == arr['vars'].length){
                    dependency_0.push(arr);
                }
                else{
                    non_1_dependency.push(arr);
                }
            }
        }
        fs.appendFileSync('./temp1.json', '\n299::'+'---------non_1_dependency--------'+ '\n'+ JSON.stringify(non_1_dependency));
        let non_1_dependency_Remain=[];
        if(non_1_dependency && non_1_dependency.length >0){
            dependency_0_vars = dependency_0.map(x=>x['var']+'.Id');
            fs.appendFileSync('./temp1.json', '\n348::'+'---------dependency_0_vars--------'+ '\n'+ JSON.stringify(dependency_0_vars));
        
            for(let arr of non_1_dependency){
                console.log('arr[\'vars\']::',arr['vars']);
                let count =0;
                for(let var1 of arr['vars']){
                    if(dependency_0_vars.includes(var1)){
                        count++;
                    }
                }
                if(count == arr['vars'].length){
                    dependency_0.push(arr);
                }
                else{
                    non_1_dependency_Remain.push(arr);
                }
            }
        }
        fs.appendFileSync('./temp1.json', '\n299::'+'---------non_1_dependency_Remain--------'+ '\n'+ JSON.stringify(non_1_dependency_Remain));
        
        let non_2_dependency=[];
        if(non_1_dependency_Remain && non_1_dependency_Remain.length >0){
            dependency_0_vars = dependency_0.map(x=>x['var']+'.Id');
            fs.appendFileSync('./temp1.json', '\n348::'+'---------dependency_0_vars--------'+ '\n'+ JSON.stringify(dependency_0_vars));
        
            for(let arr of non_1_dependency_Remain){
                console.log('arr[\'vars\']::',arr['vars']);
                let count =0;
                for(let var1 of arr['vars']){
                    if(dependency_0_vars.includes(var1)){
                        count++;
                    }
                }
                if(count == arr['vars'].length){
                    dependency_0.push(arr);
                }
                else{
                    non_2_dependency.push(arr);
                }
            }
        }
        fs.appendFileSync('./temp1.json', '\n299::'+'---------non_2_dependency--------'+ '\n'+ JSON.stringify(non_2_dependency));
        
        fs.appendFileSync('./temp1.json', '\n299::'+'---------seq_depends--------'+ '\n'+ JSON.stringify(dependency_0));
        
        return dependency_0;
    },
    createTestClassData : async function(conn, sobject,fs, testCls_dynamicStr,refFields,i) {
        return new Promise(async (resolve,reject)=>{
            sobject = (i==0)? sobject : refFields[i]['ObjAPI'][0];
        if(refFields && refFields.length >0)
            i++;
        const field_perms = await conn.sobject("FieldPermissions").find({ SObjectType: sobject, PermissionsEdit : true, PermissionsRead :true, 'Parent.Profile.Name' :'System Administrator' })
        console.log('field_perms::',field_perms);
        let fieldAPIs = field_perms.map(x=>x.Field.replace(sobject+'.', ''));

        const res = await conn.describe(sobject)
        //console.log('res::',res.fields);
        // let fields = res.fields.map(x=>x.name);
        // console.log('fields::',fields);
        fs.appendFileSync('./temp1.json', 'i::'+i+' -- '+sobject+'\n--refFields::'+JSON.stringify(refFields)+ '\n');
        let fieldTypes = res.fields.map(x=>x.type);
        console.log('fieldTypes::',fieldTypes);
        let fieldsArr =[];
        for(let field of res.fields){
            if( field.updateable == true)
            {
                if(field.createable && field.name !='CTMS__eDOA_Completion__c' && field.name !='ownerId'  && field.name !='RecordTypeId')
                    {
                        let obj={}
                        obj['API'] = field.name;
                        obj['Type'] = field.type;
                        obj['Lable'] = field.label;
                        obj['ObjAPI'] = field.referenceTo;
                        fieldsArr.push(obj);
                    }
            }
            else {
                if(field.nillable== false && field.createable && field.name !='CTMS__eDOA_Completion__c' && field.name !='ownerId'  && field.name !='RecordTypeId')
                {
                    if(field.createable && field.name !='CTMS__eDOA_Completion__c' && field.name !='ownerId'  && field.name !='RecordTypeId')
                        {
                            let obj={}
                            obj['API'] = field.name;
                            obj['Type'] = field.type;
                            obj['Lable'] = field.label;
                            obj['ObjAPI'] = field.referenceTo;
                            fieldsArr.push(obj);
                        }
                }
            }
        }
        let soql = (i==0)? 'SELECT '+fieldsArr.map(x =>x.API).join() +' FROM '+ sobject +' LIMIT 1' : 'SELECT '+fieldsArr.map(x =>x.API).join() +' FROM '+ refFields[i]['ObjAPI'][0] +' where id IN '+getRecIds(refFields[i]['recIds'])+'';
        console.log('soql::',soql);
        const queryRes = await conn.query(soql);
        console.log('queryRes::',queryRes);
        refFields = getRefFiledsObj(queryRes,fieldsArr);
        fs.appendFileSync('./temp1.json', soql+ '\n'+JSON.stringify(queryRes)+'\n');
        let instVar = randomString(4);
        let accApex = sobject +' '+instVar+' = new '+ sobject+' ();\n';
        for(let rec of queryRes.records){
            for(let key in rec){
                if(key !='attributes' && rec[key] != null )
                    {
                        console.log('rec[key]::',rec[key]);
                        let fieldData = fieldsArr.filter(x=>x.API == key);
                        console.log('fieldData::',fieldData);
                        let temp ='';
                        if(fieldData[0]['Type'] == 'multipicklist'||fieldData[0]['Type'] == 'picklist'||fieldData[0]['Type'] == 'text'|| fieldData[0]['Type'] =='string' ||fieldData[0]['Type'] =='id'|| fieldData[0]['Type'] =='reference' ||fieldData[0]['Type'] =='textarea'|| fieldData[0]['Type'] =='address'||fieldData[0]['Type'] =='url'){
                            let val = rec[key].replace(/(\r\n|\n|\r)/gm, "");
                            temp =  instVar+'.'+key +' = \''+ val +'\';\n';
                        }
                        else if(fieldData[0]['Type'] == 'date'){
                            let dateStr = rec[key].split('-');
                            console.log('dateStr::',dateStr);
                            temp = instVar+'.'+key +' = Date.newInstance('+dateStr[0] +',' +dateStr[1]+','+dateStr[2]+');\n';
                        }
                        else if(fieldData[0]['Type'] == 'phone'){
                            let phoneStr = rec[key].replace('(','').replace(')','').replace('-','').replace(' ','');
                            console.log('phoneStr::',phoneStr);
                            temp = instVar+'.'+key +' = \''+ phoneStr +'\';\n';
                        }
                        else if(fieldData[0]['Type'] == 'datetime'){
                            let dateTimeStr = rec[key].replace('T','-').replaceAll(':','-').split('.')[0].split('-');
                            console.log('dateTimeStr::',dateTimeStr);
                            temp = instVar+'.'+key +' = Datetime.newInstance('+dateTimeStr[0]+','+ dateTimeStr[1]+','+ dateTimeStr[2]+','+ dateTimeStr[3]+','+ dateTimeStr[4]+','+ dateTimeStr[5] +');\n';
                        }
                        else
                            temp =  instVar+'.'+key +' = '+ rec[key] +';\n';
                        accApex += temp;
                    }
            }
        }
        accApex += 'insert '+instVar+';\n';
        testCls_dynamicStr =  testCls_dynamicStr + accApex;
        //return accApex;
        fs.appendFileSync('./temp1.json', soql+ '\n'+'current i::'+i+','+refFields.length+'\n');
        if(refFields && refFields.length >0 && i < refFields.length){
            return this.createTestClassData(conn, sobject,fs, testCls_dynamicStr,refFields,i);
        }
        else{
            console.log('inside else..');
            resolve(testCls_dynamicStr);
        }
        })
    },
  };
   function  randomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}
/*function getIndex(varname, arr){
    let indexToReturn =0;
    for(let i= 0;i< arr.length ;i++){
        if(arr[i]['var']+'.Id' == varname){
            indexToReturn = i;
            break;
        }
    }
    return indexToReturn;
}*/
function getRefFiledsObj(queryRes,fieldsArr){
    let ref_fields = fieldsArr.filter(x=> (x.Type =='reference' && x.API != 'OwnerId'));
    console.log('ref_fields::',ref_fields);
    //let ref_field_ids =[]; 
    for(let ref_field of ref_fields)
    {
        let refIdsSet= new Set();
        //ref_field_ids.push(queryRes.records[0][ref_field['API']]);
        if(queryRes.records && queryRes.totalSize >0){
            if(queryRes.records[0][ref_field['API']] != null){
                refIdsSet.add(queryRes.records[0][ref_field['API']]);
                ref_field['recIds'] = Array.from(refIdsSet);
                /*if('recIds' in ref_field)
                    ref_field['recIds'].push(queryRes.records[0][ref_field['API']]);
                else
                    ref_field['recIds'] = [queryRes.records[0][ref_field['API']]];*/
            }
        }
    }
    console.log('ref_field_ids::',ref_fields);
    return ref_fields;
}
function getRefFiledsMap(queryRes,fieldsArr){
    let ref_fields = fieldsArr.filter(x=> (x.Type =='reference' && x.API != 'OwnerId'));
    console.log('ref_fields::',ref_fields);
    let obj ={};
    for(let ref_field of ref_fields)
    {
        //ref_field_ids.push(queryRes.records[0][ref_field['API']]);
        if(queryRes.records && queryRes.totalSize >0){
            if(queryRes.records[0][ref_field['API']] != null){
                if('recIds' in ref_field){
                    for(let rec of ref_field['recIds']){
                        //obj[rec] = ref_field['API'];
                        obj[rec] = false;
                    }
                }
            }
        }
    }
    console.log('obj::',obj);
    return obj;
}
function getRecIds(recIds){
    let retStr='(';
    for(let rec of recIds){
        retStr = retStr + '\''+rec+'\','
    }
    retStr = retStr.endsWith(',')? retStr.substring(0, retStr.length - 1): retStr;
    retStr =retStr+')';
    return retStr;

}