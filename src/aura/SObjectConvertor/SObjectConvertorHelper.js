({
	fetchSObjects: function(component, event, helper) {
		var getSObjectData = component.get('c.getSObjects');
		getSObjectData.setCallback(this, function(response) {
			var state = response.getState();
			if(state === "SUCCESS") {
				var data = response.getReturnValue();
				var sObjectList = JSON.parse(data);
				sObjectList.unshift('--None--');
				component.set('v.sObjectList', sObjectList);
			} else {
				alert('Unable to fetch SObjects. '+JSON.stringify(response.getError()));
			}
		});
		$A.enqueueAction(getSObjectData);
	},

	fetchSObjectFields: function(component, event, helper) {
		var sObjectName = event.getSource().get('v.value');
		var getSObjectFieldData = component.get('c.getSObjectFieldMap');
		var sObjectFieldMap = component.get('v.sObjectFieldMap');
		var sObjectListName = event.getSource().get('v.name');
		if(sObjectFieldMap==null) {
			sObjectFieldMap = {};
		}
		if(sObjectFieldMap[sObjectName]!=null) {
			if(sObjectListName=='sourceSObject') {
				component.set('v.sourceSObjectFields', sObjectFieldMap[sObjectName]);
			} else {
				component.set('v.destinationSObjectFields', sObjectFieldMap[sObjectName]);			
			}
			console.log('map has data');
		}
		else {
			console.log('data fetched from server');
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
				else {
					alert('Unable to fetch fields. '+JSON.stringify(response.getError()));
				}
			});
			$A.enqueueAction(getSObjectFieldData);
		}	
	},

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
				} else {
					component.searchFocusRemoved();
					console.log('no records found');
				}
			});
			$A.enqueueAction(getRecords);			
		}
		else {
			component.searchFocusRemoved();
			console.log('search text length is less than 2');
		}
	},

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
					component.set('v.failureMap', failureMapList);
					component.set('v.successMap', successMapList);					
				} else if(resultObj.status=='exception') {
					alert(resultObj.message);
				}
			} else {
				alert('Error in connecting with server');
			}
		});
		$A.enqueueAction(convertAction);
	},

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
	    				alert(resultMap.message);
	    			} else if(resultMap.success == 0) {
	    				alert(resultMap.message);
	    			}
	    		} else {
					alert('Error in connecting with server');	    			
	    		}
	    	});
	    	$A.enqueueAction(createMappingAction);
	    }
	},

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
					alert(resultMap.message);
				}
			} else {
				alert('Error in connecting with server');	    							
			}
		});
		$A.enqueueAction(getMappingAction);
	},

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
						alert(resultMap.message);
					}
				} else {
					alert('Error in connecting with server');	    							
				}
			});
			$A.enqueueAction(getMappingAction);			
		}
	}
})