({
	getInitialData: function(component, event, helper) {
		helper.fetchSObjects(component, event, helper);
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
		if(searchText.length==0) {
			var searchCombobox = component.find('searchCombobox');
			$A.util.addClass(searchCombobox, 'slds-combobox-lookup');
			$A.util.removeClass(searchCombobox, 'slds-is-open');			
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
		var recordList = component.get('v.recordList');
		if(recordList.indexOf(recordId) == -1 && recordId!=null && recordId!='') {
			recordList.push(recordId);
			component.set('v.recordList', recordList);
		}
	},

	convertRecords: function(component, event, helper) {
		helper.convertRecords(component, event, helper);		
	}

})