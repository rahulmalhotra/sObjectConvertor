/*
	Copyright (c) 2018 - Present, Rahul Malhotra. All rights reserved.
	Use of this source code is governed by a BSD 3-Clause License that can be found in the LICENSE.md file.
*/

({
	// Function to fetch initial data from apex controller when the lightning component is loaded
	getInitialData: function(component, event, helper) {
		helper.fetchSObjects(component, event, helper);
		helper.getSObjectMappingNames(component, event, helper);
	},

	// Function to get fields when a sObject is selected
	getSObjectFields: function(component, event, helper) {
		helper.fetchSObjectFields(component, event, helper);
	},

	// Function to fetch records when text in search Record textbox is changed
	searchFocused: function(component, event, helper) {
		var searchCombobox = component.find('searchCombobox');
		helper.fetchRecords(component, event, helper);
		$A.util.addClass(searchCombobox, 'slds-is-open');
		$A.util.removeClass(searchCombobox, 'slds-combobox-lookup');
	},

	// Function to remove search suggestions
	searchFocusRemoved: function(component, event, helper) {
		var searchCombobox = component.find('searchCombobox');
		$A.util.addClass(searchCombobox, 'slds-combobox-lookup');
		$A.util.removeClass(searchCombobox, 'slds-is-open');
	},

	// Function to hide the search suggestions when a record is selected
	searchBlurred: function(component, event, helper) {
		var searchText = component.find('searchRecord').get('v.value');
		if(searchText!=undefined) {
			if(searchText.length==0) {
				component.searchFocusRemoved(component, event, helper);
			}					
		}
	},

	// Function to set a particular record in the search result in the search textbox
	setSearchValue: function(component, event, helper) {
		var searchText = component.find('searchRecord').get('v.value');
		component.find('searchRecord').set('v.value',event.currentTarget.dataset.record);
		component.find('inputRecordId').set('v.value',event.currentTarget.dataset.recordid);
		component.searchFocusRemoved();
	},

	// Function to add a record selected as a search result to the list of record Ids to be converted
	addRecord: function(component, event, helper) {
		var recordId = component.find('inputRecordId').get('v.value');
		var recordIdList = component.get('v.recordIdList');
		if(recordIdList.indexOf(recordId) == -1 && recordId!=null && recordId!='') {
			recordIdList.push(recordId);
			component.set('v.recordIdList', recordIdList);
		}
	},

	// Function used to convert the selected records from source to destination sObject
	convertRecords: function(component, event, helper) {
		helper.convertRecords(component, event, helper);		
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
					component.addRow();
				}
				else {
					component.set('v.recordMap',null);
					component.addRow();
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

	// Function to add a new row in recordMap
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

	/*
		Function to remove a record from a list of record ids to be converted
		by clicking on the close icon in pill which is displaying the record id
	*/
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

	// Function to save the newly created mapping on the server
	saveMapping: function(component, event, helper) {
		var recordMap = component.get('v.recordMap');
		if(recordMap[0].Id!=undefined && recordMap[0].rmak__SObject_Mapping_Name__c!=undefined) {
			component.find("sobjectMappingName").set("v.value", recordMap[0].rmak__SObject_Mapping_Name__c);
			component.find("sobjectMappingName").set("v.readonly", true);
		} else {
			component.find("sobjectMappingName").set("v.readonly", false);			
		}
        var modal = component.find("sobjectMappingModal");
        var modalBackdrop = component.find("sobjectModalBackdrop");
        $A.util.addClass(modal,"slds-fade-in-open");
        $A.util.addClass(modalBackdrop,"slds-backdrop_open");		
	},

    // Function used to close the sObject Mapping modal
    closeModal: function(component, event, helper) {
        var modal = component.find("sobjectMappingModal");
        var modalBackdrop = component.find("sobjectModalBackdrop");
        $A.util.removeClass(modal,"slds-fade-in-open");
        $A.util.removeClass(modalBackdrop,"slds-backdrop_open");
    },

    // Function used to store newly created mapping
    createMapping: function(component, event, helper) {
		helper.upsertMapping(component, event, helper);
    },

    // Function used to show/hide the existing mapping dropdown based on the selection of mapping type
    toggleSelectMapping: function(component, event, helper) {
    	var selectMappingDropdown = component.find('selectMappingDropdown');
    	$A.util.toggleClass(selectMappingDropdown, 'hidden');
    },

    /*
    	Function to get field Mapping on selection of an existing mapping
    	and set it on the layout
    */
    getSObjectMapping: function(component, event, helper) {
    	helper.getSObjectMapping(component, event, helper);
    }
})