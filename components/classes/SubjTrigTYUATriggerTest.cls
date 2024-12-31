/*
*  Deployed using Audit API.
**/
@isTest
private class SubjTrigTYUATriggerTest {
 @isTest
 private static void processTest() {
 Test.startTest();
 
 AuditHistoryTracker__c at = new AuditHistoryTracker__c();
        at.FieldAPI__c ='CTMS__Age_1__c';
        at.SobjectAPI__c ='CTMS__Subject__c';
        insert at;
 //level1
CTMS__Clinical_Site__c TbUS = new CTMS__Clinical_Site__c ();
TbUS.CTMS__Amount_Earned_To_Date__c = 0;
TbUS.CTMS__Completed__c = 0;
TbUS.CTMS__Country__c = 'USA';
TbUS.CTMS__Currency_Code__c = 'USD';
TbUS.CTMS__Early_Terminated__c = 0;
TbUS.CTMS__Early_Terminations__c = 0;
TbUS.CTMS__Enrolled__c = 0;
TbUS.CTMS__Investigator_First_Name__c = 'Roland';
TbUS.CTMS__Investigator_Last_Name__c = 'Asper';
TbUS.CTMS__No_Subject_Info_Flag__c = false;
TbUS.CTMS__Planned__c = 0;
TbUS.CTMS__Randomized__c = 0;
TbUS.CTMS__Re_Screened__c = 0;
TbUS.CTMS__Region_No_Site_Info_Flag__c = false;
TbUS.CTMS__Regions_Required_Flag__c = false;
TbUS.CTMS__Screen_Failures__c = 0;
TbUS.CTMS__Screened__c = 0;
TbUS.CTMS__Site_Name__c = 'Ohio General Hospital';
TbUS.CTMS__Site_Number__c = 'US-001';
TbUS.CTMS__Status__c = 'Qualified';
TbUS.Actual_Site_Identification_Date__c = Date.newInstance(2023,05,31);
TbUS.Actual_IRB_Approval_Date__c = Date.newInstance(2023,06,05);
TbUS.Total_PD__c = 1;
TbUS.Total_AE__c = 0;
TbUS.Site_Monitoring_change__c = false;
TbUS.CTMS__Enroll_Subjects__c = false;
TbUS.Activation_Actual_Date__c = Date.newInstance(2023,05,03);
TbUS.KRI_Generated__c = true;
TbUS.Risk_Created__c = false;
TbUS.Site_Address__c = 'Hospital Drive, Newark, OH, United States, 43055';
TbUS.CTMS__Archived__c = false;
TbUS.CTMS__Locked__c = false;
insert TbUS;

//level0
CTMS__Subject__c YPpL = new CTMS__Subject__c ();
YPpL.CTMS__Eligible_Flag__c = false;
YPpL.CTMS__Protocol_Deviation__c = false;
YPpL.CTMS__Protocol_Violation__c = false;
YPpL.CTMS__Region_No_Site_Info_Flag__c = false;
YPpL.CTMS__Regions_Required_Flag__c = false;
YPpL.CTMS__Screen_Date__c = Date.newInstance(2024,12,28);
YPpL.CTMS__Site_Name__c = 'Ohio General Hospital';
YPpL.CTMS__Site_No_Subject_Info_Flag__c = false;
YPpL.CTMS__Site_Number__c = 'US-001';
YPpL.CTMS__Site__c = TbUS.Id;
YPpL.CTMS__Subject_Number__c = 'FIG-US-001-003';
YPpL.CTMS__X28_day_CRF_expected__c = false;
YPpL.CTMS__X6_month_CRF_expected__c = false;
YPpL.Subject_Status__c = 'Screening';
YPpL.Randomized__c = false;
YPpL.Portal_User_Created__c = false;
YPpL.CTMS__Hard_Lock_Data__c = false;
YPpL.CTMS__Soft_Lock_Data__c = false;
YPpL.Total_PDs__c = 0;
insert YPpL;

 Test.stopTest();
 }
 }