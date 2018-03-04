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
            System.debug(recordWrapper.mapping.keySet());
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
            List<Id> saveResultSuccessIds = new List<Id>();
            List<Id> saveResultFailureIds = new List<Id>();
    		List<Database.SaveResult> saveResultList = Database.insert(destinationObjList);
            Map<String, List<Id>> resultIdMap = new Map<String,List<Id>>();
            for(Database.SaveResult saveResult : saveResultList) {
                if(saveResult.isSuccess()) {
                    saveResultSuccessIds.add(saveResult.getId());
                }
                else {
                    saveResultFailureIds.add(saveResult.getId());
                }
            }
            resultIdMap.put('successIds', saveResultSuccessIds);
            resultIdMap.put('failureIds', saveResultFailureIds);
            resultMap.put('status', 'success');
        	resultMap.put('idMap', JSON.serialize(resultIdMap));
            return JSON.serialize(resultMap); 

        } catch(Exception e) {
            resultMap.put('status', 'exception');
            resultMap.put('message', e.getMessage());
            return JSON.serialize(resultMap); 
        }
    }
}