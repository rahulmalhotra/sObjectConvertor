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
						this.refreshMap(component, event, helper);		
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
						this.searchFocusRemoved(component, event, helper);
					}
				} else if(state==='ERROR') {
					this.searchFocusRemoved(component, event, helper);
    				this.showErrorMessage(component, event, helper, response, null);
				}
			});
			$A.enqueueAction(getRecords);			
		}
		else {
			this.searchFocusRemoved(component, event, helper);
		}
	},

	// Function to convert records from source sObject to destination sObject
	convertRecords: function(component, event, helper) {
		var recordIdList = component.get('v.recordIdList');
		var mapping = component.get('v.recordMap');
		var sourceObj = component.find('sourceSObject').get('v.value');
		var destinationObj = component.find('destinationSObject').get('v.value');
		var successIdSet = new Set();

		var mapToSend = {};
		for(var i=0;i<mapping.length;i++) {
			mapToSend[mapping[i].Source_Sobject_Field__c] = mapping[i].Destination_SObject_Field__c;
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
						successIdSet.add(key);
						successMapList.push({ value: successMap[key], key: key });
					}
					if(failureMapList.length==0) {
						this.showMessage(component, event, helper, 'Success!', 'success', 'Records converted successfully');
					} else {
						this.showMessage(component, event, helper, 'Warning!' ,'warning', 'Records converted partially. Check out the failure messages');
					}
					var recordIdListNew = [];
					for(var i=0; i<recordIdList.length; i++) {
						if(!successIdSet.has(recordIdList[i])) {
							recordIdListNew.push(recordIdList[i]);
						}
					}
					component.set('v.recordIdList', recordIdListNew);
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
	upsertMapping: function(component, event, helper) {
    	var field = component.find('sobjectMappingName');
    	if(field.get('v.validity').valid) {
    		var sobjectMappingName = field.get('v.value');
	    	var recordMap = component.get('v.recordMap');
	    	for(var i=0;i<recordMap.length;i++) {
	    		recordMap[i].name = sobjectMappingName.substring(0,25) +' Record '+ i;
	    		recordMap[i].SObject_Mapping_Name__c = sobjectMappingName;
	    	}
	    	var saveMappingAction = component.get('c.saveSObjectMapping');
	    	saveMappingAction.setParams({
	    		sObjectMappingString: JSON.stringify(recordMap)
	    	});
	    	saveMappingAction.setCallback(this, function(response) {
	    		var state = response.getState();
	    		if(state === 'SUCCESS') {
	    			var resultMapString = response.getReturnValue();
	    			var resultMap = JSON.parse(resultMapString);
	    			if(resultMap.success == 1) {
	    				this.closeModal(component, event, helper);
	    				this.getSObjectMappingNames(component, event, helper);
	    				component.set('v.recordMap', null);
	    				this.addRow(component, event, helper);
	    				this.showMessage(component, event, helper, 'Success!', 'success', resultMap.message);
	    			} else if(resultMap.success == 0) {
	    				this.showErrorMessage(component, event, helper, null, resultMap.message);
	    			}
	    		} else if(state === 'ERROR') {
    				this.showErrorMessage(component, event, helper, response, null);
	    		}
	    	});
	    	$A.enqueueAction(saveMappingAction);
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
		} else {
			component.set('v.recordMap', null);
			this.addRow(component, event, helper);
		}
	},

    // Function used to close the sObject Mapping modal
    closeModal: function(component, event, helper) {
        var modal = component.find("sobjectMappingModal");
        var modalBackdrop = component.find("sobjectModalBackdrop");
        $A.util.removeClass(modal,"slds-fade-in-open");
        $A.util.removeClass(modalBackdrop,"slds-backdrop_open");
    },

	// Function to add a new row in recordMap
	addRow: function(component, event, helper) {
		var recordMap = component.get('v.recordMap');
		var sourceSObjectFields = component.get('v.sourceSObjectFields');
		var destinationSObjectFields = component.get('v.destinationSObjectFields');
		var element = {
			Source_Sobject_Field__c: sourceSObjectFields[0],
			Destination_SObject_Field__c: destinationSObjectFields[0]
		};
		if(recordMap==null)
			recordMap = [];
		recordMap.push(element);
		component.set('v.recordMap', recordMap);		
	},

	// Function to refresh the recordMap attribute whenever a new sObject is selected from the dropdown
	refreshMap: function(component, event, helper) {
		var sourceSObject = component.find('sourceSObject').get('v.value');
		var destinationSObject = component.find('destinationSObject').get('v.value');
		var recordMap = component.get('v.recordMap');
		// Refreshing the recordMap only when source and destination sObjet both have valid values
		if(sourceSObject!=undefined && destinationSObject!=undefined && sourceSObject!='' && destinationSObject!='') {
			// refreshMap called from helper when sObject is changed
			if(event.getSource().get('v.name')==undefined) {
				if(recordMap.length==0) {
					this.addRow(component, event, helper);
				}
				else {
					component.set('v.recordMap',null);
					this.addRow(component, event, helper);
					// Need to code... empty the mapping
				}
			} else {
				// refreshMap called when a field value is changed in field row
				// Need to be optimized - no working right now
				var eventName = event.getSource().get('v.name');
				if(eventName=='selectSourceSObject') {

				} else if(eventName=='selectDestinationSObject') {

				}
			}
		}
	},

	// Function to remove search suggestions
	searchFocusRemoved: function(component, event, helper) {
		var searchCombobox = component.find('searchCombobox');
		$A.util.addClass(searchCombobox, 'slds-combobox-lookup');
		$A.util.removeClass(searchCombobox, 'slds-is-open');
	},

	// Function to show message in toast
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