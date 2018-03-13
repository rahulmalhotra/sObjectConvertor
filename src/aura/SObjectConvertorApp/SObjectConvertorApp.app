<!--
    Copyright (c) 2018 - Present, Rahul Malhotra. All rights reserved.
    Use of this source code is governed by a BSD 3-Clause License that can be found in the LICENSE.md file.
-->

<!-- 
	Application to run sObject convertor app directly from here.
	Success and failure messages will not be visible as they need one app container to run,
	you will see an error message instead of success and failure popups but the functionality will work.
	It's preferred to embed sObject convertor component in any page in lightning to avoid this error.
-->
<aura:application extends="force:slds">
	<!-- Extending slds and calling sObjectConvertor Component -->
    <c:SObjectConvertor />
</aura:application>