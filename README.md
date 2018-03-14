# sObject Convertor

sObject Convertor is a utility application to convert record of one sObject into another sObject in salesforce.

## Getting Started

sObject Convertor can be used to convert one or more records of one sObject to another sObject. 
You can simply map the fields from source sObject to destination sObject. This sObject mapping can be saved and further utilized in future. 

### Prerequisites

There are no such pre-requisites for installing and using this application. 
I still recommend you to use salesforce org with API Version 42.0 or above which I believe you have already, as 
I too have tested this application on that. If you want to download the code in your local system, 
you can do it by the executing the below command or downloading the code directly as a zip file.

```
git clone https://github.com/rahulmalhotra/sObjectConvertor.git
```

### Installing

sObject Convertor is very easy to use. You can install this application in your salesforce org by using the **deploy to salesforce** button
present in the [deployment](#deployment) section of this readme. Installing this will add the following to your org :- 

1. SObjectConvertor - Lightning Component
2. SObjectConvertorApp - Lightning Application
3. SObjectConvertorController - Apex Class

You can open any record detail page in lightning or the homepage and add this application to your page by following the steps below :- 
1. Click on the settings (gear) icon among the icons in the top right corner of your org and click on Edit Page.
2. Search for the component named "SObject Convertor" in the search box on the left.
3. Drag and drop the component to place it on the screen.
4. Save your changes and activate as default if needed.

**sObject Convertor** is now ready for use.

## Deployment

You can deploy sObject Convertor application directly to your org by clicking the button below

<a href="https://githubsfdeploy.herokuapp.com?owner=rahulmalhotra&repo=sObjectConvertor&ref=master">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a>

## Tools and Softwares used

You just need a salesforce org to run this application. 
If you want to make any changes in the code, you can do that by using the developer console provided by Salesforce. 
However I like to use mavensmate to keep a local copy of code on my system too. 
So below are the tools or softwares I use personally :-

* [Mavensmate](https://github.com/joeferraro/MavensMate-Desktop/releases) - Open Source IDE for Salesforce
* [Sublime Text](https://www.sublimetext.com/) - Text Editor (with mavensmate plugin)

## Todo

- [ ] Update previous mapping on save if existing mapping is used.
- [ ] Add validations on the client side to ensure mapping of fields with similar data type.
- [ ] Option to delete the existing mapping.
- [ ] Adding a checkbox to delete the source object while creating destination object.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on code of conduct and the process for submitting pull requests.

## Authors

* **Rahul Malhotra** - [@rahulcoder](https://twitter.com/rahulcoder)

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE.md](LICENSE.md) file for details.
