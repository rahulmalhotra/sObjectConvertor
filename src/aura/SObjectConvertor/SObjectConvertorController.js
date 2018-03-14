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

	// Function to hide the search suggestions when a record is selected
	searchBlurred: function(component, event, helper) {
		var searchText = component.find('searchRecord').get('v.value');
		if(searchText!=undefined) {
			if(searchText.length==0) {
				helper.searchFocusRemoved(component, event, helper);
			}					
		}
	},

	// Function to set a particular record in the search result in the search textbox
	setSearchValue: function(component, event, helper) {
		var searchText = component.find('searchRecord').get('v.value');
		component.find('searchRecord').set('v.value',event.currentTarget.dataset.record);
		component.find('inputRecordId').set('v.value',event.currentTarget.dataset.recordid);
		helper.searchFocusRemoved(component, event, helper);
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
		helper.refreshMap(component, event, helper);
	},

	// Function to add a new row in recordMap
	addRow: function(component, event, helper) {
		helper.addRow(component, event, helper);
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
        var modal = component.find("sobjectMappingModal");
        var modalBackdrop = component.find("sobjectModalBackdrop");
        $A.util.addClass(modal,"slds-fade-in-open");
        $A.util.addClass(modalBackdrop,"slds-backdrop_open");		
	},

    // Function used to close the sObject Mapping modal
    closeModal: function(component, event, helper) {
    	helper.closeModal(component, event, helper);
    },

    // Function used to store newly created mapping
    createMapping: function(component, event, helper) {
		helper.upsertMapping(component, event, helper);
    },

    // Function used to show/hide the existing mapping dropdown based on the selection of mapping type
    toggleSelectMapping: function(component, event, helper) {
    	var selectMappingDropdownDiv = component.find('selectMappingDropdownDiv');
    	if(component.find("selectMappingType").get("v.value")==1) {
    		component.set("v.recordMap", null);
    		helper.addRow(component, event, helper);
    	}
    	$A.util.toggleClass(selectMappingDropdownDiv, 'hidden');
    },

    /*
    	Function to get field Mapping on selection of an existing mapping
    	and set it on the layout
    */
    getSObjectMapping: function(component, event, helper) {
		var sourceSObject = component.find('sourceSObject').get('v.value');
		var destinationSObject = component.find('destinationSObject').get('v.value');
		// Refreshing the recordMap only when source and destination sObjet both have valid values
		if(sourceSObject!=undefined && destinationSObject!=undefined && sourceSObject!='' && destinationSObject!='') {
	    	helper.getSObjectMapping(component, event, helper);
	    }
	    else {
	    	helper.showErrorMessage(component, event, helper, null, 'Please select source and destination objects first');
	    	component.find('selectMappingDropdown').set('v.value',component.get('v.sObjectMapNames')[0]);
	    }
    }
})