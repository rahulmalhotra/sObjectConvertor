/*
    Copyright (c) 2018 - Present, Rahul Malhotra. All rights reserved.
    Use of this source code is governed by a BSD 3-Clause License that can be found in the LICENSE.md file.
*/

({
	// Function to fetch sObject Names from apex controller
	fetchSObjects: function(component, event, helper) {
		var getSObjectData = component.get('c.getSObjects');
		getSObjectData.setCallback(this, function(response) {
			var state = response.getState();
			if(state === "SUCCESS") {
				var data = response.getReturnValue();
				var sObjectList = JSON.parse(data);
				sObjectList.unshift('--None--');
				component.set('v.sObjectList', sObjectList);
			} else if(state === "ERROR") {
				this.showErrorMessage(component, event, helper, response, null);
			}
		});
		$A.enqueueAction(getSObjectData);
	},

	// Function to fetch sObject Fields from the apex controller when an sObject is selected
	fetchSObjectFields: function(component, event, helper) {
		var sObjectName = event.getSource().get('v.value');
		var getSObjectFieldData = component.get('c.getSObjectFieldMap');
		var sObjectFieldMap = component.get('v.sObjectFieldMap');
		var sObjectListName = event.getSource().get('v.name');
		if(sObjectFieldMap==null) {
			sObjectFieldMap = {};
		}
		// Checking if sObjectFieldMap already contains fields for selected sObject
		if(sObjectFieldMap[sObjectName]!=null) {
			if(sObjectListName=='sourceSObject') {
				component.set('v.sourceSObjectFields', sObjectFieldMap[sObjectName]);
			} else {
				component.set('v.destinationSObjectFields', sObjectFieldMap[sObjectName]);			
			}
		}
		else {
			// Fetching fields from server if there is no entry in map for selected sObject
			if(sObjectName!='--None--') {
				getSObjectFieldData.setParams({
					sObjectNames: sObjectName
				});
				getSObjectFieldData.setCallback(this, function(response) {
					var state = response.getState();
					if(state==='SUCCESS') {
						var data = response.getReturnValue();
						var sObjectNewFieldMap = JSON.parse(data);
						sObjectFieldMap[sObjectName] = sObjectNewFieldMap[sObjectName];
						if(sObjectListName=='sourceSObject') {
							component.set('v.sourceSObjectFields', sObjectFieldMap[sObjectName]);
						} else {
							component.set('v.destinationSObjectFields', sObjectFieldMap[sObjectName]);			
						}
						component.set('v.sObjectFieldMap',sObjectFieldMap);
						component.refreshMap();		
					}
					else if(state==='ERROR') {
	    				this.showErrorMessage(component, event, helper, response, null);
					}
				});
				$A.enqueueAction(getSObjectFieldData);				
			} else {
				if(sObjectListName=='sourceSObject') {
					component.set('v.sourceSObjectFields', []);
				} else {
					component.set('v.destinationSObjectFields', []);			
				}				
			}
		}	
	},

	// Function to fetch the records of a particular sObject based on the search text written
	fetchRecords: function(component, event, helper) {
		var sObjectName = component.find('sourceSObject').get('v.value');
		var searchText = component.find('searchRecord').get('v.value');
		var inputData = {
			'name' : sObjectName,
			'searchText' : searchText
		};
		if(searchText.length>=2) {
			var inputDataString = JSON.stringify(inputData);
			var getRecords = component.get('c.getRecords');
			getRecords.setParams({
				inputData: inputDataString
			});
			getRecords.setCallback(this, function(response) {
				var state = response.getState();
				if(state==='SUCCESS') {
					var searchResultString = response.getReturnValue();
					var searchResults = JSON.parse(searchResultString);
					component.set('v.searchResults', searchResults);
					if(searchResults.length==0) {
						component.searchFocusRemoved();
					}
				} else if(state==='ERROR') {
					component.searchFocusRemoved();
    				this.showErrorMessage(component, event, helper, response, null);
				}
			});
			$A.enqueueAction(getRecords);			
		}
		else {
			component.searchFocusRemoved();
		}
	},

	// Function to convert records from source sObject to destination sObject
	convertRecords: function(component, event, helper) {
		var recordIdList = component.get('v.recordIdList');
		var mapping = component.get('v.recordMap');
		var sourceObj = component.find('sourceSObject').get('v.value');
		var destinationObj = component.find('destinationSObject').get('v.value');

		var mapToSend = {};
		for(var i=0;i<mapping.length;i++) {
			mapToSend[mapping[i].rmak__Source_Sobject_Field__c] = mapping[i].rmak__Destination_SObject_Field__c;
		}

		var inputData = {
			recordIdList: recordIdList,
			mapping: mapToSend,
			sourceObj: sourceObj,
			destinationObj: destinationObj
		};
		var inputDataString = JSON.stringify(inputData);
		var convertAction = component.get('c.createRecords');
		convertAction.setParams({
			inputData: inputDataString
		});
		convertAction.setCallback(this, function(response) {
			var state = response.getState();
			if(state==='SUCCESS') {
				var resultString = response.getReturnValue();
				var resultObj = JSON.parse(resultString);
				if(resultObj.status=='success') {
					var successMap = JSON.parse(resultObj.successMap);
					var failureMap = JSON.parse(resultObj.failureMap);
					var failureMapList = [];
					for(var key in failureMap) {
						failureMapList.push({ value: failureMap[key], key: key });
					}
					var successMapList = [];
					for(var key in successMap) {
						successMapList.push({ value: successMap[key], key: key });
					}
					if(failureMapList.length==0) {
						this.showMessage(component, event, helper, 'Success!', 'success', 'Records converted successfully');
					} else {
						this.showMessage(component, event, helper, 'Warning!' ,'warning', 'Records converted partially. Check out the failure messages');
					}
					component.set('v.failureMap', failureMapList);
					component.set('v.successMap', successMapList);					
				} else if(resultObj.status=='exception') {
    				this.showErrorMessage(component, event, helper, null, resultObj.message);
				}
			} else if (state==='ERROR') {
				this.showErrorMessage(component, event, helper, response, null);
			}
		});
		$A.enqueueAction(convertAction);
	},

	// Function to create a new record mapping between two sObjects and save it in custom settings
	createNewMapping: function(component, event, helper) {
    	var field = component.find('sobjectMappingName');
    	if(field.get('v.validity').valid) {
    		var sobjectMappingName = field.get('v.value');
	    	var recordMap = component.get('v.recordMap');
	    	for(var i=0;i<recordMap.length;i++) {
	    		recordMap[i].name = sobjectMappingName.substring(0,25) +' Record '+ i;
	    		recordMap[i].rmak__SObject_Mapping_Name__c = sobjectMappingName;
	    	}
	    	var createMappingAction = component.get('c.createSObjectMapping');
	    	createMappingAction.setParams({
	    		sObjectMappingString: JSON.stringify(recordMap)
	    	});
	    	createMappingAction.setCallback(this, function(response) {
	    		var state = response.getState();
	    		if(state === 'SUCCESS') {
	    			var resultMapString = response.getReturnValue();
	    			var resultMap = JSON.parse(resultMapString);
	    			if(resultMap.success == 1) {
	    				component.closeModal();
	    				this.showMessage(component, event, helper, 'Success!', 'success', resultMap.message);
	    			} else if(resultMap.success == 0) {
	    				this.showErrorMessage(component, event, helper, null, resultMap.message);
	    			}
	    		} else if(state === 'ERROR') {
    				this.showErrorMessage(component, event, helper, response, null);
	    		}
	    	});
	    	$A.enqueueAction(createMappingAction);
	    }
	},

	// Function to get SObject Mapping names from the apex controller
	getSObjectMappingNames: function(component, event, helper) {
		var getMappingAction = component.get('c.fetchSObjectMappingNames');
		getMappingAction.setCallback(this, function(response) {
			var state = response.getState();
			if(state === 'SUCCESS') {
				var resultMapString = response.getReturnValue();
				var resultMap = JSON.parse(resultMapString);
				if(resultMap.success == '1') {
					var sObjectMapNames = JSON.parse(resultMap.message);
					sObjectMapNames.unshift('none');
					component.set('v.sObjectMapNames', sObjectMapNames);
				} else if(resultMap.success == '0') {
    				this.showErrorMessage(component, event, helper, null, resultMap.message);
				}
			} else if(state === 'ERROR') {
				this.showErrorMessage(component, event, helper, response, null);
			}
		});
		$A.enqueueAction(getMappingAction);
	},

	// Function to fetch sObject mapping from server on selection of an existing mapping
	// Working but need to be optimized by saving the mapping on client side
	getSObjectMapping: function(component, event, helper) {
		var sObjectMappingName = event.getSource().get('v.value');
		if(sObjectMappingName!='none') {
			var getMappingAction = component.get('c.fetchSObjectMapping');
			getMappingAction.setParams({
				'sObjectMappingName': sObjectMappingName
			});
			getMappingAction.setCallback(this, function(response) {
				var state = response.getState();
				if(state === 'SUCCESS') {
					var resultMapString = response.getReturnValue();
					var resultMap = JSON.parse(resultMapString);
					if(resultMap.success == '1') {
						component.set('v.recordMap', JSON.parse(resultMap.message));
					} else if(resultMap.success == '0') {
	    				this.showErrorMessage(component, event, helper, null, resultMap.message);
					}
				} else if (state === 'ERROR') {
    				this.showErrorMessage(component, event, helper, response, null);
				}
			});
			$A.enqueueAction(getMappingAction);			
		}
	},

	showMessage: function(component, event, helper, title, type, message) {
	    var toastEvent = $A.get("e.force:showToast");
	    toastEvent.setParams({
	        "title": title,
	        "type": type,
	        "message": message
	    });
	    toastEvent.fire();
	},

	// Function to show error toast
	showErrorMessage: function(component, event, helper, response, message) {
		var errorMessage = 'Unknown Error';
		if(response!=null) {
			var errors = response.getError();
			if (errors && Array.isArray(errors) && errors.length > 0) {
			    errorMessage = errors[0].message;
			}
		} else if (message!=null) {
			errorMessage = message;
		}
	    var toastEvent = $A.get("e.force:showToast");
	    toastEvent.setParams({
	        "title": "Error!",
	        "type": "error",
	        "message": errorMessage
	    });
	    toastEvent.fire();
	}
})