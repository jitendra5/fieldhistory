/*
*  Deployed using Audit API.
**/
@isTest
private class AccountAudit_TriggerTest {
 @isTest
 private static void processTest() {
 Test.startTest();
 
 AuditHistoryTracker__c at = new AuditHistoryTracker__c();
        at.FieldAPI__c ='Name';
        at.SobjectAPI__c ='Account';
        insert at;
 Account nmkN = new Account ();
nmkN.Name = 'Edge Communications';
nmkN.Type = 'Customer - Direct';
nmkN.BillingStreet = '312 Constitution PlaceAustin, TX 78767USA';
nmkN.BillingCity = 'Austin';
nmkN.BillingState = 'TX';
nmkN.ShippingStreet = '312 Constitution PlaceAustin, TX 78767USA';
nmkN.Phone = '5127576000';
nmkN.Fax = '5127579000';
nmkN.AccountNumber = 'CD451796';
nmkN.Website = 'http://edgecomm.com';
nmkN.Sic = '6576';
nmkN.Industry = 'Electronics';
nmkN.AnnualRevenue = 139000000;
nmkN.NumberOfEmployees = 1000;
nmkN.Ownership = 'Public';
nmkN.TickerSymbol = 'EDGE';
nmkN.Description = 'Edge, founded in 1998, is a start-up based in Austin, TX. The company designs and manufactures a device to convert music from one digital format to another. Edge sells its product through retailers and its own website.';
nmkN.Rating = 'Hot';
nmkN.CleanStatus = 'Pending';
nmkN.CustomerPriority__c = 'Medium';
nmkN.SLA__c = 'Silver';
nmkN.Active__c = 'Yes';
nmkN.NumberofLocations__c = 2;
nmkN.UpsellOpportunity__c = 'Maybe';
nmkN.SLASerialNumber__c = '2657';
nmkN.SLAExpirationDate__c = Date.newInstance(2024,11,30);
nmkN.Test_DateTime__c = Datetime.newInstance(2024,10,30,15,15,00);
insert nmkN;

 Test.stopTest();
 }
 }