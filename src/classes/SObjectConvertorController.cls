public class SObjectConvertorController {

    @AuraEnabled
    public static String getSObjects() {
        Map<String, Schema.SObjectType> sObjectMap = Schema.getGlobalDescribe();
        List<String> sObjectList = new List<String>();
        Set<String> sObjectNameSet = sObjectMap.keySet();
        for(String sObjectName: sObjectNameSet) {
        	Schema.DescribeSObjectResult sObjectDescribe = Schema.getGlobalDescribe().get(sObjectName).getDescribe();
        	if(sObjectDescribe.isUpdateable() && sObjectDescribe.isSearchable() && sObjectDescribe.isCreateable()) {
		    	Map<String, Schema.SObjectField> fieldMap = sObjectDescribe.fields.getMap();
		    	List<String> fieldList = new List<String>();
				for(Schema.SObjectField field: fieldMap.values()) {
					Schema.DescribeFieldResult fieldResult = field.getDescribe();
					if(fieldResult.isUpdateable()==true) {
		        		sObjectList.add(sObjectName);
		        		break;
					}
				}
        	}
        }
        return JSON.serialize(sObjectList);
    } 

    @AuraEnabled
    public static String getSObjectFieldMap(List<String> sObjectNames) {
    	Map<String,List<String>> sObjectfieldMap = new Map<String,List<String>>();
    	for(String sObjectName : sObjectNames) {
	    	Schema.SObjectType sObjType = Schema.getGlobalDescribe().get(sObjectName);
	    	Map<String, Schema.SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();
	    	List<String> fieldList = new List<String>();
			for(Schema.SObjectField field: fieldMap.values()) {
				Schema.DescribeFieldResult fieldResult = field.getDescribe();
				if(fieldResult.isUpdateable()==true) {
					fieldList.add(fieldResult.getLocalName());
				}
			}
			sObjectfieldMap.put(sObjectName, fieldList);
    	}
		return JSON.serialize(sObjectfieldMap);
    }

    @AuraEnabled
    public static String getRecords(String inputData) {
    	Map<String, Object> inputDataMap = new Map<String, Object>();
    	inputDataMap = (Map<String, Object>) JSON.deserializeUntyped(inputData);
    	String sObjectName = (String) inputDataMap.get('name');
    	String searchText = (String) inputDataMap.get('searchText');
    	String searchQuery = '';
    	Schema.SObjectType sObjType = Schema.getGlobalDescribe().get(sObjectName);
    	Map<String, Schema.SObjectField> fieldMap = sObjType.getDescribe().fields.getMap();    	
    	if(fieldMap.get('name')!=null) {
	    	searchQuery = 'FIND {'+searchText+'} IN ALL FIELDS RETURNING '+sObjectName+'(Name)';    		
    	} else {
	    	searchQuery = 'FIND {'+searchText+'} IN ALL FIELDS RETURNING '+sObjectName;    		    		
    	}
    	List<List<sObject>> searchList = Search.query(searchQuery);
    	if(searchList.size() == 1) {
			return JSON.serialize(searchList.get(0));
    	}
    	return '';
    }

    private class CreateRecordWrapper {
    	public Map<String, String> mapping {get;set;}
    	public String sourceObj {get;set;}
    	public String destinationObj {get;set;}
    	public List<Id> recordIdList {get;set;}
    }

    @AuraEnabled
    public static String createRecords(String inputData) {

        Map<String, String> resultMap = new Map<String, String>();
        try {
        	CreateRecordWrapper recordWrapper = (CreateRecordWrapper) JSON.deserialize(inputData, CreateRecordWrapper.class);
        	String inputFields = '';
        	for(String sourceObjField : recordWrapper.mapping.keySet()) {
    			inputFields+=sourceObjField+', ';
        	}
        	inputFields = inputFields.substring(0, inputFields.length()-2);
        	List<Id> recordIdsForQuery = recordWrapper.recordIdList;
        	String recordsQuery = 'SELECT '+inputFields+' FROM '+recordWrapper.sourceObj+' WHERE Id in :recordIdsForQuery';
        	Map<Id,sObject> sourceObjMap = new Map<Id,sObject>(Database.query(recordsQuery));
            List<sObject> destinationObjList = new List<sObject>();
            for(Id recordId:recordIdsForQuery) {
                sObject sourceObj = sourceObjMap.get(recordId);
                sObject destinationObj = Schema.getGlobalDescribe().get(recordWrapper.destinationObj).newSObject();
                for(String sourceObjField : recordWrapper.mapping.keySet()) {
                    String destinationObjField = recordWrapper.mapping.get(sourceObjField);
                    destinationObj.put(destinationObjField,sourceObj.get(sourceObjField));
                }
                destinationObjList.add(destinationObj);
            }
            Map<Id, Id> successMap = new Map<Id,Id>();
            Map<Id, String> failureMap = new Map<Id, String>();
    		List<Database.SaveResult> saveResultList = Database.insert(destinationObjList, false);
            Integer i=0;
            for(Database.SaveResult saveResult : saveResultList) {
                if(saveResult.isSuccess()) {
                    successMap.put(recordIdsForQuery.get(i), saveResult.getId());
                }
                else {
                    String error = '';
                    for(Database.Error err : saveResult.getErrors()) {
                        error = error + err.getMessage();
                    }
                    failureMap.put(recordIdsForQuery.get(i), error);
                }
                i++;
            }

            resultMap.put('successMap', JSON.serialize(successMap));
            resultMap.put('failureMap', JSON.serialize(failureMap));
            resultMap.put('status', 'success');
            return JSON.serialize(resultMap); 

        } catch(Exception e) {
            resultMap.put('status', 'exception');
            resultMap.put('message', e.getMessage());
            return JSON.serialize(resultMap); 
        }
    }

    @AuraEnabled
    public static String createSObjectMapping(String sObjectMappingString) {
        List<rmak__SObjectConvertorMapping__c> sObjectMappingList = (List<rmak__SObjectConvertorMapping__c>) JSON.deserialize(sObjectMappingString, List<rmak__SObjectConvertorMapping__c>.class);
        Map<String, String> resultMap = new Map<String, String>();
        System.debug(sObjectMappingList);
        try {
            insert sObjectMappingList;
            resultMap.put('success', '1');
            resultMap.put('message', 'Mapping Saved Successfully');
        } catch(Exception e) {
            resultMap.put('success', '0');
            resultMap.put('message', 'Error in saving mapping:- ' + e.getMessage());
        }
        return JSON.serialize(resultMap);
    }

    @AuraEnabled
    public static String fetchSObjectMappingNames() {
        Map<String, String> resultMap = new Map<String, String>();
        try {
            List<AggregateResult> sObjectMappingList = [SELECT rmak__SObject_Mapping_Name__c FROM rmak__SObjectConvertorMapping__c GROUP BY rmak__SObject_Mapping_Name__c];
            List<String> sObjectMappingNamesList = new List<String>();
            for(AggregateResult agr: sObjectMappingList) {
                sObjectMappingNamesList.add(String.valueOf(agr.get('rmak__SObject_Mapping_Name__c')));
            }
            resultMap.put('success', '1');
            resultMap.put('message', JSON.serialize(sObjectMappingNamesList));
            //List<rmak__SObjectConvertorMapping__c> sObjectMappingList = [SELECT rmak__SObject_Mapping_Name__c, rmak__Source_Sobject_Field__c, rmak__Destination_SObject_Field__c FROM rmak__SObjectConvertorMapping__c ];
            //Map<String, List<rmak__SObjectConvertorMapping__c>> sObjectMappingListMap = new Map<String, List<rmak__SObjectConvertorMapping__c>>();
            //Set<String> mappingNameSet = new Set<String>();
            //for(rmak__SObjectConvertorMapping__c obj: sObjectMappingList) {
            //    if(mappingNameSet.add(obj.rmak__SObject_Mapping_Name__c)) {
            //        List<rmak__SObjectConvertorMapping__c> mappingList = new List<rmak__SObjectConvertorMapping__c>();
            //        mappingList.add(obj);
            //        sObjectMappingListMap.put(obj.rmak__SObject_Mapping_Name__c, mappingList);
            //    } else {
            //        List<rmak__SObjectConvertorMapping__c> mappingList = sObjectMappingListMap.get(obj.rmak__SObject_Mapping_Name__c);
            //        mappingList.add(obj);
            //        sObjectMappingListMap.put(obj.rmak__SObject_Mapping_Name__c, mappingList);
            //    }
            //}
            //resultMap.put('success', '1');
            //resultMap.put('message', JSON.serialize(sObjectMappingListMap));
        } catch(Exception e) {
            resultMap.put('success', '0');
            resultMap.put('message', e.getMessage());
        }
        return JSON.serialize(resultMap);
    }

    @AuraEnabled
    public static String fetchSObjectMapping(String sObjectMappingName) {
        Map<String, String> resultMap = new Map<String, String>();
        try {
            List<rmak__SObjectConvertorMapping__c> sObjectMappingList = [SELECT rmak__Source_Sobject_Field__c, rmak__Destination_SObject_Field__c FROM rmak__SObjectConvertorMapping__c WHERE rmak__SObject_Mapping_Name__c =:sObjectMappingName];
            resultMap.put('success', '1');
            resultMap.put('message', JSON.serialize(sObjectMappingList));
        } catch(Exception e) {
            resultMap.put('success', '0');
            resultMap.put('message', e.getMessage());
        }
        return JSON.serialize(resultMap);
    }
}