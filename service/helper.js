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
            const res = await conn.describe(sobject);
            let fieldTypes = res.fields.map(x=>x.type);
            console.log('fieldTypes::',fieldTypes);
            let fieldsArr =[];
            for(let field of res.fields){
                if(field.updateable && field.name != 'OwnerId')
                {
                    let obj={}
                    obj['API'] = field.name;
                    obj['Type'] = field.type;
                    obj['Lable'] = field.label;
                    obj['ObjAPI'] = field.referenceTo;
                    fieldsArr.push(obj);
                }
            }
            let soql = '';let queryRes='';
            if(mainRec){
                soql =  'SELECT '+fieldsArr.map(x =>x.API).join() +' FROM '+ sobject +' LIMIT 1' ;
                console.log('135::soql::',soql);
                fs.appendFileSync('./temp1.json','sobject::'+sobject+'\n' +'136::'+soql+ '\n');
                queryRes = await conn.query(soql);
                console.log('queryRes::',queryRes);
                //fs.appendFileSync('./temp1.json'+ '\n'+JSON.stringify(queryRes)+'\n');
                fs.appendFileSync('./temp1.json', soql+ '\n'+' resp:: '+JSON.stringify(queryRes)+'\n RefFields'+JSON.stringify(getRefFiledsObj(queryRes,fieldsArr))+'\nRecCount::'+queryRes['totalSize']+'\n---------------\n');
                //fs.appendFileSync('./temp1.json', getRefFiledsObj(queryRes,fieldsArr)+ '\n'+JSON.stringify(queryRes)+'\n');
                resolve({'sobjRec' : queryRes , 'refFields' : getRefFiledsObj(queryRes,fieldsArr), 'fieldsArr':fieldsArr})
            }
            else{
                console.log('recIds::',recIds);
                console.log('fields::',fieldsArr.map(x =>x.API));
                for(var i in recIds){ recIds[i] = 'id=\''+ recIds[i]+'\''}
                console.log('recIds::',recIds);
                soql =  'SELECT Id,'+fieldsArr.map(x =>x.API).join() +' FROM '+ sobject +' where '+recIds.join(' or ') ;
                console.log('150::soql::',soql);
                
                queryRes = await conn.query(soql);
                console.log('==>queryRes::',queryRes);
                fs.appendFileSync('./temp1.json','sobject::'+sobject+'\n' + '157::'+ soql+ '\n'+' resp:: '+JSON.stringify(queryRes)+'\n RefFields:'+ JSON.stringify(getRefFiledsObj(queryRes,fieldsArr))+'\nRecCount::'+queryRes['totalSize']+'\n---------------\n');
                //fs.appendFileSync('./temp1.json'+ '\n'+JSON.stringify(queryRes)+'\n');
                //fs.appendFileSync('./temp1.json'+ '\n\n');
                //fs.appendFileSync('./temp1.json', getRefFiledsObj(queryRes,fieldsArr)+ '\n'+JSON.stringify(queryRes)+'\n');
                resolve({'sobjRec' : queryRes , 'refFields' : getRefFiledsObj(queryRes,fieldsArr), 'fieldsArr':fieldsArr})
            }
            
            //refFields = getRefFiledsObj(queryRes,fieldsArr);
            //fs.appendFileSync('./temp1.json', refFields+ '\n'+JSON.stringify(queryRes)+'\n');
        })
        //return {'sobjRec' : queryRes , 'refFields' : refFields};
        
    },
    createTstData : function(queryRes, sobject,fieldsArr){
        let instVar = randomString(4);
        let recId='';
        let accApex = sobject +' '+instVar+' = new '+ sobject+' ();\n';
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
                        if(fieldData[0]['Type'] == 'picklist'||fieldData[0]['Type'] == 'text'|| fieldData[0]['Type'] =='string' ||fieldData[0]['Type'] =='id'|| fieldData[0]['Type'] =='reference' ||fieldData[0]['Type'] =='textarea'|| fieldData[0]['Type'] =='address'||fieldData[0]['Type'] =='url'||fieldData[0]['Type'] =='email'){
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
        return {"tstCls" :accApex, "var" : instVar, "recId" :recId};

    },
    createTestClassData : async function(conn, sobject,fs, testCls_dynamicStr,refFields,i) {
        return new Promise(async (resolve,reject)=>{
            sobject = (i==0)? sobject : refFields[i]['ObjAPI'][0];
        if(refFields && refFields.length >0)
            i++;
        const res = await conn.describe(sobject)
        //console.log('res::',res.fields);
        // let fields = res.fields.map(x=>x.name);
        // console.log('fields::',fields);
        fs.appendFileSync('./temp1.json', 'i::'+i+' -- '+sobject+'\n--refFields::'+JSON.stringify(refFields)+ '\n');
        let fieldTypes = res.fields.map(x=>x.type);
        console.log('fieldTypes::',fieldTypes);
        let fieldsArr =[];
        for(let field of res.fields){
            if(field.updateable)
            {
                let obj={}
                obj['API'] = field.name;
                obj['Type'] = field.type;
                obj['Lable'] = field.label;
                obj['ObjAPI'] = field.referenceTo;
                fieldsArr.push(obj);
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
                        if(fieldData[0]['Type'] == 'picklist'||fieldData[0]['Type'] == 'text'|| fieldData[0]['Type'] =='string' ||fieldData[0]['Type'] =='id'|| fieldData[0]['Type'] =='reference' ||fieldData[0]['Type'] =='textarea'|| fieldData[0]['Type'] =='address'||fieldData[0]['Type'] =='url'){
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
function getRefFiledsObj(queryRes,fieldsArr){
    let ref_fields = fieldsArr.filter(x=> (x.Type =='reference' && x.API != 'OwnerId'));
    console.log('ref_fields::',ref_fields);
    //let ref_field_ids =[];
    for(let ref_field of ref_fields)
    {
        //ref_field_ids.push(queryRes.records[0][ref_field['API']]);
        if(queryRes.records[0][ref_field['API']] != null){
            if('recIds' in ref_field)
                ref_field['recIds'].push(queryRes.records[0][ref_field['API']]);
            else
                ref_field['recIds'] = [queryRes.records[0][ref_field['API']]];
        }
    }
    console.log('ref_field_ids::',ref_fields);
    return ref_fields;

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