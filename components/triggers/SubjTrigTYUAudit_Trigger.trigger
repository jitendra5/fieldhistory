/*
*  Deployed using Audit API.
**/
trigger SubjTrigTYUAudit_Trigger on CTMS__Subject__c (after insert,after update) {
    List<String> fieldLst = new List<String> (); 
    for(AuditHistoryTracker__c aht: [select FieldAPI__c from AuditHistoryTracker__c where SobjectAPI__c = 'CTMS__Subject__c']){
        fieldLst.add(aht.FieldAPI__c);
    }
    for(CTMS__Subject__c a : Trigger.new){
        for(String fld : fieldLst)
        {
        if(Trigger.isAfter){
            if(Trigger.isInsert )
            {
                    //post field change to external system
                    AuditHistoryCtrl.captureFieldChange('CTMS__Subject__c',fld,null,(String) Trigger.newMap.get( a.Id ).get(fld)); 
            }
            if((Trigger.isUpdate && Trigger.oldMap.get( a.Id ).get(fld) != Trigger.newMap.get( a.Id ).get(fld)) )
            {
                    //post field change to external system
                    AuditHistoryCtrl.captureFieldChange('CTMS__Subject__c',fld,(String) Trigger.oldMap.get( a.Id ).get(fld),(String) Trigger.newMap.get( a.Id ).get(fld)); 
            }
        }
        }
    }
}