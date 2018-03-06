({
	getInitialData: function(component, event, helper) {
		helper.fetchSObjects(component, event, helper);
		helper.getSObjectMappingNames(component, event, helper);
	},

	getSObjectFields: function(component, event, helper) {
		helper.fetchSObjectFields(component, event, helper);
	},

	searchFocused: function(component, event, helper) {
		var searchCombobox = component.find('searchCombobox');
		helper.fetchRecords(component, event, helper);
		$A.util.addClass(searchCombobox, 'slds-is-open');
		$A.util.removeClass(searchCombobox, 'slds-combobox-lookup');
	},

	searchFocusRemoved: function(component, event, helper) {
		var searchCombobox = component.find('searchCombobox');
		$A.util.addClass(searchCombobox, 'slds-combobox-lookup');
		$A.util.removeClass(searchCombobox, 'slds-is-open');
	},

	searchBlurred: function(component, event, helper) {
		var searchText = component.find('searchRecord').get('v.value');
		if(searchText!=undefined) {
			if(searchText.length==0) {
				var searchCombobox = component.find('searchCombobox');
				$A.util.addClass(searchCombobox, 'slds-combobox-lookup');
				$A.util.removeClass(searchCombobox, 'slds-is-open');			
			}					
		}
	},

	setSearchValue: function(component, event, helper) {
		var searchText = component.find('searchRecord').get('v.value');
		component.find('searchRecord').set('v.value',event.currentTarget.dataset.record);
		component.find('inputRecordId').set('v.value',event.currentTarget.dataset.recordid);
		component.searchFocusRemoved();
	},

	addRecord: function(component, event, helper) {
		var recordId = component.find('inputRecordId').get('v.value');
		var recordIdList = component.get('v.recordIdList');
		if(recordIdList.indexOf(recordId) == -1 && recordId!=null && recordId!='') {
			recordIdList.push(recordId);
			component.set('v.recordIdList', recordIdList);
		}
	},

	convertRecords: function(component, event, helper) {
		helper.convertRecords(component, event, helper);		
	},

	refreshMap: function(component, event, helper) {
		var sourceSObject = component.find('sourceSObject').get('v.value');
		var destinationSObject = component.find('destinationSObject').get('v.value');
		var recordMap = component.get('v.recordMap');
		if(sourceSObject!=undefined && destinationSObject!=undefined && sourceSObject!='' && destinationSObject!='') {
			if(event.getSource().get('v.name')==undefined) {
				if(recordMap.length==0) {
					component.addRow();
				}
				else {
					component.set('v.recordMap',null);
					component.addRow();
					// Need to code... empty the mapping
				}
			} else {			
				var eventName = event.getSource().get('v.name');
				if(eventName=='selectSourceSObject') {
					// Remove previous value from map and add new value
				} else if(eventName=='selectDestinationSObject') {
					// Remove previous value from map and add new value
				}
			}
		}
	},

	addRow: function(component, event, helper) {
		var recordMap = component.get('v.recordMap');
		var sourceSObjectFields = component.get('v.sourceSObjectFields');
		var destinationSObjectFields = component.get('v.destinationSObjectFields');
		var element = {
			rmak__Source_Sobject_Field__c: sourceSObjectFields[0],
			rmak__Destination_SObject_Field__c: destinationSObjectFields[0]
		};
		if(recordMap==null)
			recordMap = [];
		recordMap.push(element);
		component.set('v.recordMap', recordMap);		
	},

	removeRecordIdFromList: function(component, event, helper) {
		var id = event.getSource().get('v.label');
		var ids = component.get('v.recordIdList');
		var newIds = [];
		for(var i=0;i<ids.length;i++) {
			if(ids[i]!=id) {
				newIds.push(ids[i]);
			}
		}
		component.set('v.recordIdList', newIds);
	},

	saveMapping: function(component, event, helper) {
        var modal = component.find("sobjectMappingModal");
        var modalBackdrop = component.find("sobjectModalBackdrop");
        $A.util.addClass(modal,"slds-fade-in-open");
        $A.util.addClass(modalBackdrop,"slds-backdrop_open");		
	},

    // Function used to close the SObject Mapping modal
    closeModal: function(component, event, helper) {
        var modal = component.find("sobjectMappingModal");
        var modalBackdrop = component.find("sobjectModalBackdrop");
        $A.util.removeClass(modal,"slds-fade-in-open");
        $A.util.removeClass(modalBackdrop,"slds-backdrop_open");
    },

    createMapping: function(component, event, helper) {
		helper.createNewMapping(component, event, helper);
    },

    selectMappingType: function(component, event, helper) {
    	var selectMappingDropdown = component.find('selectMappingDropdown');
    	$A.util.toggleClass(selectMappingDropdown, 'hidden');
    },

    getSObjectMapping: function(component, event, helper) {
    	helper.getSObjectMapping(component, event, helper);
    }
})