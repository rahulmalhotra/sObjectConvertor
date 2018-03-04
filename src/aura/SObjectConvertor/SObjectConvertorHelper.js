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
			mapToSend[mapping[i].sourceObj] = mapping[i].destinationObj;
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
					var resultIdObj = JSON.parse(resultObj.idMap);
					var failureIds = resultIdObj.failureIds;
					var successIds = resultIdObj.successIds;
					component.set('v.failureIds', failureIds);
					component.set('v.successIds', successIds);					
				} else if(resultObj.status=='exception') {
					alert(resultObj.message);
				}
			} else {
				alert('Error in connecting with server');
			}
		});
		$A.enqueueAction(convertAction);
	}
})