const express = require('express'); 
const app = express();              
const port =  process.env.PORT || 5023;                 
const creds = require('./creds');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const jsforce = require('jsforce');
var service = require('./service/helper');
var request = require('request');

app.get('/test', async (req, res) => {
    let tokenData = await service.getSalesforceAccessToken(creds,request);
    console.log('tokenData::','tokenData');
    fs.appendFileSync('./temp1.json', '42::'+'---------Level 1--------'+ '\n'+JSON.stringify(tokenData));
    let instanceUrl =JSON.parse(tokenData['body'])['instance_url'];
    let access_token = JSON.parse(tokenData['body'])['access_token'];
    console.log('instanceUrl::',instanceUrl);
    console.log('access_token::',access_token);
    const conn = new jsforce.Connection({
        instanceUrl : instanceUrl,
        accessToken : access_token,
        });
      //console.log('userInfo::',userInfo);
    const meta = await conn.sobject('Account').describe();
    console.log('meta::',meta);
    res.json(tokenData);

})
app.get('/deploy', async (req, res) => {      
    const conn = new jsforce.Connection({
        loginUrl: creds.credentials.loginUrl
    });

    try {
        //Consumer Key:	3MVG9ZUGg10Hh224lHMMYUSxknoofYZWGYcv8JBhVwNOzIDu0qtmwoLd1N0FTzTLxzspS0bhO0g4If_CPitng
        //Consumer Secret: 0F7534C34426C09A578529C246F2643D010DD7047EA3C1915087DD88A4FCEB65
        //cereblis--partialsb.sandbox.my.salesforce.com
        //https://test.salesforce.com
        console.log('username::', creds.credentials.username);
        console.log('password::', creds.credentials.password);
        //await conn.login(creds.credentials.username, creds.credentials.password);
        let tokenData = await service.getSalesforceAccessToken(creds,request);
        let instanceUrl =JSON.parse(tokenData['body'])['instance_url'];
        let access_token = JSON.parse(tokenData['body'])['access_token'];
        console.log('instanceUrl::',instanceUrl);
        console.log('access_token::',access_token);
        const conn = new jsforce.Connection({
            instanceUrl : instanceUrl,
            accessToken : access_token,
        });
        //const meta = await conn.sobject('Account').describe();
        //console.log('meta::',meta);
        let txt_file =  fs.readFileSync('./templates/triggerTemplate.txt', 'utf8');
        console.log('txt_file::',txt_file);
        console.log('req.query.objectName::', req.query.objectName);
        let finalObjName = req.query.objectName.toLocaleLowerCase().includes('__c') ? req.query.objectName.toLocaleLowerCase().replace('__c','') : req.query.objectName;
        
        txt_file = txt_file.replace('TriggerName',finalObjName+'Audit_Trigger');
        txt_file = txt_file.replaceAll('sobject',req.query.objectName);
        console.log('txt_file::',txt_file);
        fs.writeFileSync('./components/triggers/'+finalObjName+'Audit_Trigger.trigger', txt_file);
        //createTestclass
        let testCls_file =  fs.readFileSync('./templates/testClassTemplate.txt', 'utf8');
        console.log('testCls_file::',testCls_file);

        testCls_file = testCls_file.replace('TestClassName',finalObjName+'Audit_TriggerTest');
        
        creds.deploymentConfig.runTests =finalObjName+'Audit_TriggerTest';
        let allRefFields =[];let sobjRecord='';
        let levl0_refFileds =  await service.getRefFieldsOfRecord(conn, req.query.objectName, fs, true,[]);
        sobjRecord = levl0_refFileds.sobjRec;
        allRefFields = levl0_refFileds.refFields;
        console.log('allRefFields::',allRefFields);
        console.log('initTestClsStr::',sobjRecord);
        fs.appendFileSync('./temp1.json', '42::'+'---------Level 1--------'+ '\n');
        //get second level of reference fields.
        let dep_lev1_Recs_Qries_all =[];
        for(let refField of allRefFields){
            if(refField['recIds'])
                dep_lev1_Recs_Qries_all.push(service.getRefFieldsOfRecord(conn, refField['ObjAPI'][0], fs, false,refField['recIds']));
        }
        let levl1_refFileds = await Promise.all(dep_lev1_Recs_Qries_all);
        console.log('all levl1_refFileds::', levl1_refFileds);
        
        fs.appendFileSync('./temp1.json', '51::'+'---------Level 2--------'+ '\n');

        let dep_lev2_Recs_Qries_all =[];
        for(let levl1_refFiled of levl1_refFileds){
            let l1_refFields =  levl1_refFiled.refFields;
            console.log('l1_refFields::', JSON.stringify(l1_refFields));
            for(let l1_refField of l1_refFields){
                if(l1_refField['recIds'] && l1_refField['recIds'] != null)
                    dep_lev2_Recs_Qries_all.push(service.getRefFieldsOfRecord(conn, l1_refField['ObjAPI'][0], fs, false,l1_refField['recIds']));
            }
        }
        let levl2_refFileds = (dep_lev2_Recs_Qries_all && dep_lev2_Recs_Qries_all.length >0) ?  await Promise.all(dep_lev2_Recs_Qries_all) :[];
        console.log('all levl2_refFileds::', levl2_refFileds);

        fs.appendFileSync('./temp1.json', '61::'+'---------Level 3--------'+ '\n');

        let dep_lev3_Recs_Qries_all =[];
        for(let levl2_refFiled of levl2_refFileds){
            let l2_refFields =  levl2_refFiled.refFields;
            for(let l2_refField of l2_refFields){
                if(l2_refField['recIds'] && l2_refField['recIds'] != null)
                    dep_lev3_Recs_Qries_all.push(service.getRefFieldsOfRecord(conn, l2_refField['ObjAPI'][0], fs, false,l2_refField['recIds']));
            }
        }
        let levl3_refFileds = (dep_lev3_Recs_Qries_all && dep_lev3_Recs_Qries_all.length >0) ? await Promise.all(dep_lev3_Recs_Qries_all) :[];
        console.log('all levl3_refFileds::', levl3_refFileds);

        fs.appendFileSync('./temp1.json', '73::'+'---------Level 4--------'+ '\n');
        let dep_lev4_Recs_Qries_all =[];
        for(let levl3_refFiled of levl3_refFileds){
            let l3_refFields =  levl3_refFiled.refFields;
            for(let l3_refField of l3_refFields){
            if(l3_refField['recIds'] && l3_refField['recIds'] != null)
                dep_lev4_Recs_Qries_all.push(service.getRefFieldsOfRecord(conn, l3_refField['ObjAPI'][0], fs, false,l3_refField['recIds']));
            }
        }
        let levl4_refFileds = (dep_lev4_Recs_Qries_all && dep_lev4_Recs_Qries_all.length >0) ? await Promise.all(dep_lev4_Recs_Qries_all) :[];
        console.log('all levl4_refFileds::', levl4_refFileds);
        fs.appendFileSync('./temp1.json', '82::'+'---------Level 5--------'+ '\n');
        let dep_lev5_Recs_Qries_all =[];
        for(let levl4_refFiled of levl4_refFileds){
            let l4_refFields =  levl4_refFiled.refFields;
            for(let l4_refField of l4_refFields){
            if(l4_refField['recIds'] && l4_refField['recIds'] != null)
                dep_lev5_Recs_Qries_all.push(service.getRefFieldsOfRecord(conn, l4_refField['ObjAPI'][0], fs, false,l4_refField['recIds']));
            }
        }
        let levl5_refFileds = (dep_lev5_Recs_Qries_all && dep_lev5_Recs_Qries_all.length >0) ? await Promise.all(dep_lev5_Recs_Qries_all) :[];
        console.log('all levl5_refFileds::', levl5_refFileds);
        fs.appendFileSync('./temp1.json', '91::'+'---------Level 6--------'+ '\n');
        let dep_lev6_Recs_Qries_all =[];
        for(let levl5_refFiled of levl5_refFileds){
            let l5_refFields =  levl5_refFiled.refFields;
            for(let l5_refField of l5_refFields){
            if(l5_refField['recIds'] && l5_refField['recIds'] != null)
                dep_lev6_Recs_Qries_all.push(service.getRefFieldsOfRecord(conn, l5_refField['ObjAPI'][0], fs, false,l5_refField['recIds']));
            }
        }
        let levl6_refFileds = (dep_lev6_Recs_Qries_all && dep_lev6_Recs_Qries_all.length >0) ? await Promise.all(dep_lev6_Recs_Qries_all) :[];
        console.log('all levl6_refFileds::', levl6_refFileds);
        fs.appendFileSync('./temp1.json', '91::'+'---------Level 7--------'+ '\n');
        let dep_lev7_Recs_Qries_all =[];
        for(let levl6_refFiled of levl6_refFileds){
            let l6_refFields =  levl6_refFiled.refFields;
            for(let l6_refField of l6_refFields){
            if(l6_refField['recIds'] && l6_refField['recIds'] != null)
                dep_lev7_Recs_Qries_all.push(service.getRefFieldsOfRecord(conn, l6_refField['ObjAPI'][0], fs, false,l6_refField['recIds']));
            }
        }
        let levl7_refFileds = (dep_lev7_Recs_Qries_all && dep_lev7_Recs_Qries_all.length >0) ? await Promise.all(dep_lev7_Recs_Qries_all) :[];
        console.log('all levl7_refFileds::', levl7_refFileds);
        fs.appendFileSync('./temp1.json', '91::'+'---------Level 8--------'+ '\n');
        let dep_lev8_Recs_Qries_all =[];
        for(let levl7_refFiled of levl7_refFileds){
            let l7_refFields =  levl7_refFiled.refFields;
            for(let l7_refField of l7_refFields){
            if(l7_refField['recIds'] && l7_refField['recIds'] != null)
                dep_lev8_Recs_Qries_all.push(service.getRefFieldsOfRecord(conn, l7_refField['ObjAPI'][0], fs, false,l7_refField['recIds']));
            }
        }
        let levl8_refFileds = (dep_lev8_Recs_Qries_all && dep_lev8_Recs_Qries_all.length >0) ? await Promise.all(dep_lev8_Recs_Qries_all) :[];
        console.log('all levl8_refFileds::', levl8_refFileds);
        fs.appendFileSync('./temp1.json', '91::'+'---------Level 9--------'+ '\n');
        let dep_lev9_Recs_Qries_all =[];
        for(let levl8_refFiled of levl8_refFileds){
            let l8_refFields =  levl8_refFiled.refFields;
            for(let l8_refField of l8_refFields){
            if(l8_refField['recIds'] && l8_refField['recIds'] != null)
                dep_lev9_Recs_Qries_all.push(service.getRefFieldsOfRecord(conn, l8_refField['ObjAPI'][0], fs, false,l8_refField['recIds']));
            }
        }
        let levl9_refFileds = (dep_lev9_Recs_Qries_all && dep_lev9_Recs_Qries_all.length >0) ? await Promise.all(dep_lev9_Recs_Qries_all) :[];
        console.log('all levl9_refFileds::', levl9_refFileds);
        fs.appendFileSync('./temp1.json', '91::'+'---------Level 10--------'+ '\n');
        let dep_lev10_Recs_Qries_all =[];
        for(let levl9_refFiled of levl9_refFileds){
            let l9_refFields =  levl9_refFiled.refFields;
            for(let l9_refField of l9_refFields){
            if(l9_refField['recIds'] && l9_refField['recIds'] != null)
                dep_lev10_Recs_Qries_all.push(service.getRefFieldsOfRecord(conn, l9_refField['ObjAPI'][0], fs, false,l9_refField['recIds']));
            }
        }
        let levl10_refFileds = (dep_lev10_Recs_Qries_all && dep_lev10_Recs_Qries_all.length >0) ? await Promise.all(dep_lev10_Recs_Qries_all) :[];
        console.log('all levl10_refFileds::', levl10_refFileds);
        let level_10_testClsTxt=[];
        for(let levl10_refFiled of levl10_refFileds){
            console.log('all levl10_refFiled::', levl10_refFiled['sobjRec']);
            console.log('all levl10_refFiled::', levl10_refFiled['sobjRec']['records']);
            if(levl10_refFiled && levl10_refFiled['sobjRec'] && levl10_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl10_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl10_refFiled['fieldsArr']);
                level_10_testClsTxt.push(service.createTstData(levl10_refFiled['sobjRec'],levl10_refFiled['sobjRec']['records'][0]['attributes']['type'],levl10_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_10_testClsTxt::',JSON.stringify(level_10_testClsTxt));

        let level_9_testClsTxt=[];
        for(let levl9_refFiled of levl9_refFileds){
            console.log('all levl9_refFiled::', levl9_refFiled['sobjRec']);
            console.log('all levl9_refFiled::', levl9_refFiled['sobjRec']['records']);
            if(levl9_refFiled && levl9_refFiled['sobjRec'] && levl9_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl9_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl9_refFiled['fieldsArr']);
                level_9_testClsTxt.push(service.createTstData(levl9_refFiled['sobjRec'],levl9_refFiled['sobjRec']['records'][0]['attributes']['type'],levl9_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_9_testClsTxt::',JSON.stringify(level_9_testClsTxt));

        let level_8_testClsTxt=[];
        for(let levl8_refFiled of levl8_refFileds){
            console.log('all levl8_refFiled::', levl8_refFiled['sobjRec']);
            console.log('all levl8_refFiled::', levl8_refFiled['sobjRec']['records']);
            if(levl8_refFiled && levl8_refFiled['sobjRec'] && levl8_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl8_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl8_refFiled['fieldsArr']);
                level_8_testClsTxt.push(service.createTstData(levl8_refFiled['sobjRec'],levl8_refFiled['sobjRec']['records'][0]['attributes']['type'],levl8_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_8_testClsTxt::',JSON.stringify(level_8_testClsTxt));

        let level_7_testClsTxt=[];
        for(let levl7_refFiled of levl7_refFileds){
            console.log('all levl7_refFiled::', levl7_refFiled['sobjRec']);
            console.log('all levl7_refFiled::', levl7_refFiled['sobjRec']['records']);
            if(levl7_refFiled && levl7_refFiled['sobjRec'] && levl7_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl7_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl7_refFiled['fieldsArr']);
                level_7_testClsTxt.push(service.createTstData(levl7_refFiled['sobjRec'],levl7_refFiled['sobjRec']['records'][0]['attributes']['type'],levl7_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_7_testClsTxt::',JSON.stringify(level_7_testClsTxt));

        let level_6_testClsTxt=[];
        for(let levl6_refFiled of levl6_refFileds){
            console.log('all levl6_refFiled::', levl6_refFiled['sobjRec']);
            console.log('all levl6_refFiled::', levl6_refFiled['sobjRec']['records']);
            if(levl6_refFiled && levl6_refFiled['sobjRec'] && levl6_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl6_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl6_refFiled['fieldsArr']);
                level_6_testClsTxt.push(service.createTstData(levl6_refFiled['sobjRec'],levl6_refFiled['sobjRec']['records'][0]['attributes']['type'],levl6_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_6_testClsTxt::',JSON.stringify(level_6_testClsTxt));

        let level_5_testClsTxt=[];
        for(let levl5_refFiled of levl5_refFileds){
            console.log('all levl5_refFiled::', levl5_refFiled['sobjRec']);
            console.log('all levl5_refFiled::', levl5_refFiled['sobjRec']['records']);
            if(levl5_refFiled && levl5_refFiled['sobjRec'] && levl5_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl5_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl5_refFiled['fieldsArr']);
                level_5_testClsTxt.push(service.createTstData(levl5_refFiled['sobjRec'],levl5_refFiled['sobjRec']['records'][0]['attributes']['type'],levl5_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_5_testClsTxt::',JSON.stringify(level_5_testClsTxt));

        let level_4_testClsTxt=[];
        for(let levl4_refFiled of levl4_refFileds){
            console.log('all levl4_refFiled::', levl4_refFiled['sobjRec']);
            console.log('all levl4_refFiled::', levl4_refFiled['sobjRec']['records']);
            if(levl4_refFiled && levl4_refFiled['sobjRec'] && levl4_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl4_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl4_refFiled['fieldsArr']);
                level_4_testClsTxt.push(service.createTstData(levl4_refFiled['sobjRec'],levl4_refFiled['sobjRec']['records'][0]['attributes']['type'],levl4_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_4_testClsTxt::',JSON.stringify(level_4_testClsTxt));

        let level_3_testClsTxt=[];
        for(let levl3_refFiled of levl3_refFileds){
            console.log('all levl3_refFiled::', levl3_refFiled['sobjRec']);
            console.log('all levl3_refFiled::', levl3_refFiled['sobjRec']['records']);
            if(levl3_refFiled && levl3_refFiled['sobjRec'] && levl3_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl3_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl3_refFiled['fieldsArr']);
                level_3_testClsTxt.push(service.createTstData(levl3_refFiled['sobjRec'],levl3_refFiled['sobjRec']['records'][0]['attributes']['type'],levl3_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_3_testClsTxt::',JSON.stringify(level_3_testClsTxt));

        let level_2_testClsTxt=[];
        for(let levl2_refFiled of levl2_refFileds){
            console.log('all levl2_refFiled::', levl2_refFiled['sobjRec']);
            console.log('all levl2_refFiled::', levl2_refFiled['sobjRec']['records']);
            if(levl2_refFiled && levl2_refFiled['sobjRec'] && levl2_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl2_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl2_refFiled['fieldsArr']);
                level_2_testClsTxt.push(service.createTstData(levl2_refFiled['sobjRec'],levl2_refFiled['sobjRec']['records'][0]['attributes']['type'],levl2_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_2_testClsTxt::',JSON.stringify(level_2_testClsTxt));

        let level_1_testClsTxt=[];
        for(let levl1_refFiled of levl1_refFileds){
            console.log('all levl1_refFiled::', levl1_refFiled['sobjRec']);
            console.log('all levl1_refFiled::', levl1_refFiled['sobjRec']['records']);
            if(levl1_refFiled && levl1_refFiled['sobjRec'] && levl1_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl1_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl1_refFiled['fieldsArr']);
                level_1_testClsTxt.push(service.createTstData(levl1_refFiled['sobjRec'],levl1_refFiled['sobjRec']['records'][0]['attributes']['type'],levl1_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_1_testClsTxt::',JSON.stringify(level_1_testClsTxt));

        let level_0_testClsTxt=[];
        for(let levl0_refFiled of [levl0_refFileds]){
            console.log('all levl0_refFiled::', levl0_refFiled['sobjRec']);
            console.log('all levl0_refFiled::', levl0_refFiled['sobjRec']['records']);
            if(levl0_refFiled && levl0_refFiled['sobjRec'] && levl0_refFiled['sobjRec']['records'].length > 0 ){
                console.log('sobjName::', levl0_refFiled['sobjRec']['records'][0]['attributes']['type']);
                console.log('fieldsarray::', levl0_refFiled['fieldsArr']);
                level_0_testClsTxt.push(service.createTstData(levl0_refFiled['sobjRec'],levl0_refFiled['sobjRec']['records'][0]['attributes']['type'],levl0_refFiled['fieldsArr'] ));
            }
        }
        console.log('level_0_testClsTxt::',JSON.stringify(level_0_testClsTxt));

        let finalArray = level_0_testClsTxt.concat(level_1_testClsTxt,level_2_testClsTxt, level_3_testClsTxt,level_4_testClsTxt,level_5_testClsTxt,level_6_testClsTxt,level_7_testClsTxt,level_8_testClsTxt,level_9_testClsTxt,level_10_testClsTxt);
        fs.appendFileSync('./temp1.json', '\n276::'+'---------finalArray--------'+ '\n'+ JSON.stringify(finalArray));
        let finaltestClassStr= finalArray.reverse().map(x=>x['tstCls']).join('\n');
        let recIds = finalArray.map(x=>x['recId']);
        for(let recId of recIds){
            if( finaltestClassStr.includes('\''+recId+'\'')){
                let arr = finalArray.filter(x=>x.recId ==recId)
                if(arr && arr.length > 0){
                    finaltestClassStr = finaltestClassStr.replace('\''+recId+'\'', arr[0]['var']+'.Id' );
                }
            }
        }
        fs.appendFileSync('./temp1.json', '\n287::'+'---------finalTestclassStr--------'+ '\n'+ finaltestClassStr);

       /*let testCls_dynamicStr  = await service.createTestClassData(conn, req.query.objectName, fs, '',[],0);
        console.log('testCls_dynamicStr::',testCls_dynamicStr);*/
        testCls_file = testCls_file.replaceAll('dynamicCode',finaltestClassStr);
        testCls_file = testCls_file.replace('filedName',levl0_refFileds['fieldsArr'][0]['API']);
        testCls_file = testCls_file.replace('sObjectName',req.query.objectName);
        console.log('testCls_file::',testCls_file);
        fs.writeFileSync('./components/classes/'+finalObjName+'Audit_TriggerTest.cls', testCls_file);

        const zipFile =await service.createMetadataZip(fs,'./package',path,archiver,'./components/triggers','./components/classes');
        const zipContent = fs.readFileSync(zipFile);
        console.log('Starting deployment...');

        
        console.log('creds.deploymentConfig::',creds.deploymentConfig);
        const result = await conn.metadata.deploy(zipContent, creds.deploymentConfig);
        // Poll for deployment status
        let deploymentStatus; let message;
        do {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            deploymentStatus = await conn.metadata.checkDeployStatus(result.id, true);
            console.log(`Deployment Status: ${deploymentStatus.status}`);
            console.log(`Deployment Status: ${deploymentStatus}`);
            message = JSON.stringify(deploymentStatus);
        } while (deploymentStatus.status === 'Pending' || deploymentStatus.status === 'InProgress');

        if (deploymentStatus.success || 1) {
            console.log('Deployment completed successfully!');
            //res.sendFile('index.html', {root: __dirname});  
            //res.render(__dirname + "index.html", {status:deploymentStatus, message :message});
            res.json({status:deploymentStatus});
        } else {
            console.error('Deployment failed');
            //res.sendFile('index.html', {root: __dirname});  
            //res.render(__dirname + "index.html", {status:deploymentStatus, message :message});
            res.json({status:deploymentStatus});
        }
        
    }
    catch (error) {
        console.error('Error during deployment:', error);
    } finally {
        await conn.logout();
        console.log('Logged out of Salesforce');
    }                 
});

app.get('/undeploy', async (req, res) => {      
    const conn = new jsforce.Connection({
        loginUrl: creds.credentials.loginUrl
    });

    try {
        console.log('username::', creds.credentials.username);
        console.log('password::', creds.credentials.password);
        await conn.login(creds.credentials.username, creds.credentials.password);
        console.log('Connected to Salesforce',req.query.triggerName);

        const zipFile =await service.createUndeployMetadataZip(fs,'./package',path,archiver,req.query.triggerName);
        const zipContent = fs.readFileSync(zipFile);
        console.log('Starting deployment...');

        creds.deploymentConfig['testLevel'] ='RunLocalTests';
        delete creds.deploymentConfig.runTests;
        console.log('creds.deploymentConfig::',creds.deploymentConfig);
        const result = await conn.metadata.deploy(zipContent, creds.deploymentConfig);
        // Poll for deployment status
        let deploymentStatus; let message;
        do {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            deploymentStatus = await conn.metadata.checkDeployStatus(result.id, true);
            console.log(`Deployment Status: ${deploymentStatus.status}`);
            console.log(`Deployment Status: ${deploymentStatus}`);
            message = JSON.stringify(deploymentStatus);
        } while (deploymentStatus.status === 'Pending' || deploymentStatus.status === 'InProgress');

        if (deploymentStatus.success || 1) {
            console.log('UnDeployment completed successfully!');
            //res.sendFile('index.html', {root: __dirname});  
            //res.render(__dirname + "index.html", {status:deploymentStatus, message :message});
            res.json({status:deploymentStatus});
        } else {
            console.error('UnDeployment failed');
            //res.sendFile('index.html', {root: __dirname});  
            //res.render(__dirname + "index.html", {status:deploymentStatus, message :message});
            res.json({status:deploymentStatus});
        }
        
    }
    catch (error) {
        console.error('Error during deployment:', error);
    } finally {
        await conn.logout();
        console.log('Logged out of Salesforce');
    }                 
});

app.listen(port, () => { 
    console.log(`Now listening on port ${port}`); 
});
