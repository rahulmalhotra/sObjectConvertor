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
    	CreateRecordWrapper recordWrapper = (CreateRecordWrapper) JSON.deserialize(inputData, CreateRecordWrapper.class);
    	String inputFields = '';
    	for(String sourceObjField : recordWrapper.mapping.keySet()) {
			inputFields+=sourceObjField+', ';
    	}
    	inputFields = inputFields.substring(0, inputFields.length()-2);
    	List<Id> recordIdsForQuery = recordWrapper.recordIdList;
    	String recordsQuery = 'SELECT '+inputFields+' FROM '+recordWrapper.sourceObj+' WHERE Id in :recordIdsForQuery';
    	List<sObject> sourceObjList = Database.query(recordsQuery);
    	System.debug(sourceObjList);
    	return '';
    }
}