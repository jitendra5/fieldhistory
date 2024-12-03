/*
*  Deployed using Audit API.
**/
trigger AccountAudit_Trigger on Account (after insert,after update) {
    List<String> fieldLst = new List<String> (); 
    for(AuditHistoryTracker__c aht: [select FieldAPI__c from AuditHistoryTracker__c where SobjectAPI__c = 'Account']){
        fieldLst.add(aht.FieldAPI__c);
    }
    for(Account a : Trigger.new){
        for(String fld : fieldLst)
        {
        if(Trigger.isAfter){
            if(Trigger.isInsert || (Trigger.isUpdate && Trigger.oldMap.get( a.Id ).get(fld) != Trigger.newMap.get( a.Id ).get(fld)) )
            {
                    //post field change to external system
                    //AuditHistoryCtrl.captureFieldChange('Account','fieldName','fieldvalue'); 
            }
        }
        }
    }
}