/**
* @NApiVersion 2.x
* @NModuleScope Public
* @NScriptType ClientScript
*/

/************************************************************************
* File Name : FOPS_CS_Tax_Payment_Details.js
* Date      :
* Purpose   : This script will validate the Payment Details creations
*
* History
* Date          Author                Details
* 18-07-2023    Faizan Siddiki        Initial Version
***********************************************************************/

define(["N/record", "N/search", "N/runtime", "N/ui/dialog", "N/format", "N/https"],
  function (record, search, runtime, dialog, format, https) {

    var exports = {};
    var FILECONSTANT = {
      RECORD:{
        TAX_RECORDID : 'customrecord_tobacco_tax',
        FIELD_PAYERID : 'custrecord_tobc_tax_pay_id',
        FIELD_PERIOD : 'custrecord_tobc_mail_pay_per_tax',
        FIELD_BALANCE: 'custrecord_tobc_tax_balance_to_be_paid'
      },
      BE_SEARCH_SUITELET_ID: 'customscript_fops_bs_search_reuslts',
      BE_SEARCH_SUITELET_DEPLOYMENT_ID: 'customdeploy_fops_bs_search_reuslts',
      PERIOD : {
        MONTHLY: 1,
        QUARTERLY: 2
      },
      MESSAGE: {
        DUPLICATE_LOCATION: "Please select unique location.",
        EXIST_ZEROPAYMENT : "There is a zero payment record already exist for the selected payment period. Please delete the record before submitting another payment"
      }
    };

    //pageInit
    function pageInit(context) {
      debugger;

      var currentRecord = context.currentRecord;
      var formType = currentRecord.getValue({
        fieldId: "customform",
      });

      if(context.mode == 'create'){
        var urlParameters = getAllURLParameters();
        if(urlParameters.custrecord_tobc_location_business_name)
        {
          var businessField = currentRecord.getField('custrecord_tobc_additional_business_id');
          businessField.isDisabled = true;

          currentRecord.setValue({
            fieldId: 'custrecord_tobc_additional_business_id',
            value: urlParameters.custrecord_tobc_location_business_name,
            ignoreFieldChange: true,
            forceSyncSourcing: true
          });

        }
        else if(urlParameters.custrecord_pd_restaurant_business_name){
          var businessField = currentRecord.getField('custrecord_business_id');
          businessField.isDisabled = true;

          currentRecord.setValue({
            fieldId: 'custrecord_business_id',
            value: urlParameters.custrecord_pd_restaurant_business_name,
            ignoreFieldChange: true,
            forceSyncSourcing: true
          });
        }
      }
    }

    //GET ALL PARAMETERS
    function getAllURLParameters() {
      var urlParams = {};
      var queryParams = window.location.search.substring(1).split('&');
      
      for (var i = 0; i < queryParams.length; i++) {
        var param = queryParams[i].split('=');
        var paramName = decodeURIComponent(param[0]);
        var paramValue = decodeURIComponent(param[1] || '');
        
        if (paramName.length !== 0) {
          urlParams[paramName] = paramValue;
        }
      }
      
      return urlParams;
    }

    exports.pageInit = pageInit;
    return exports;
  });