/************************************************************************
** The following Script is developed by ERP Buddies Inc.,
* a NetSuite Solution Provider.
*
* Company:	   ERP Buddies Inc., www.erpbuddies.com
*              Cloud Solution Partners
* Author:      Karan
*
*
* History
*
* Date          Author        Details
* 17-04-2023    Faizan        Bug Fix
* 18-04-2023    Faizan        Bug Fix
* 19-04-2023    Faizan        Restrict SaveRecord Function to Telephone Tax Form only
* 20-04-2023    Faizan        Previous Balance Issue Resolved
***********************************************************************/
/**
*
*
*@NApiVersion 2.x
*@NScriptType ClientScript
*/
define(['N/url', 'N/search', 'N/currentRecord', 'N/ui/message', 'N/ui/dialog'], function(url, search, currentRecord, message, dialog) {

  var PAYMENTFORMS = {
    'TELEPHONE' : '203',
    'TOBACCO' : '212',
    'RESTAURANT': '193',
    'HOTEL':'220'
  };

  var FOPS = {
    DEPARTMENT : 106,
    CLASS : 12
  };


  function pageInit(context) {
    var objRecord = context.currentRecord;

    var customForm = objRecord.getValue({
      fieldId: 'customform'
    });

    debugger;
    if (customForm == PAYMENTFORMS.TELEPHONE || customForm == PAYMENTFORMS.TOBACCO || customForm == PAYMENTFORMS.HOTEL){
      
      //HIDE SUBLISTS
      var invoiceSublist = objRecord.getSublist({sublistId: 'apply'});
      if(!isEmpty(invoiceSublist))
        invoiceSublist.isDisplay = false;
      

      var creditSublist = objRecord.getSublist({sublistId: 'credit'});
      if(!isEmpty(creditSublist))
        creditSublist.isDisplay = false;

  
      var depositSublist = objRecord.getSublist({sublistId: 'deposit'});
      if(!isEmpty(depositSublist))
        depositSublist.isDisplay = false;

      //DISABLE FIELDS
      log.debug('hide', customForm)
      if (context.mode !== 'create') {
        objRecord.setValue({
          fieldId: 'trandate',
          value: new Date(),
          ignoreFieldChange:true
        });

        var taxPayerID = objRecord.getField({
          fieldId: 'custbody_tax_payer_id_num'
        });
        taxPayerID.isDisabled = true;
      }

      var trandate = objRecord.getField({fieldId: 'trandate'});
      trandate.isDisabled = true;

      var objPayment = objRecord.getField({fieldId: 'payment'});
      objPayment.isDisabled = true;

      var quarterly = objRecord.getField({fieldId: 'custpage_yearfield_quarterly'});
      if(!quarterly)
         quarterly = objRecord.getField({fieldId: 'custbody_quarterly'});

      quarterly.isDisabled = true;

      var month = objRecord.getField({fieldId: 'custpage_yearfield_month'});
      if(!month)
        month = objRecord.getField({fieldId: 'custbody_tax_month'});
      
      month.isDisabled = true;

      // var customer = objRecord.getField({
      //   fieldId: 'customer'
      // });
      //
      //customer.isDisabled = true;

      log.debug('context', context.mode)
      if (context.mode == 'edit') {

        var customFormField = objRecord.getField({
          fieldId: 'customform'
        });
        customFormField.isDisabled = true;

        var customer = objRecord.getField({
          fieldId: 'customer'
        });
        customer.isDisabled = true;

        var postingPeriod = objRecord.getField({
          fieldId: 'postingperiod'
        });
        postingPeriod.isDisabled = true;

        var taxMonth = objRecord.getField({
          fieldId: 'custbody_tax_month'
        });
        taxMonth.isDisabled = true;

        var taxYear = objRecord.getField({
          fieldId: 'custbody_tax_year'
        });
        taxYear.isDisabled = true;

        if(customForm == PAYMENTFORMS.TELEPHONE)
          var businessID = objRecord.getField({
            fieldId: 'custbody_business_id'
          });
        
        else if(customForm == PAYMENTFORMS.RESTAURANT)
          var businessID = objRecord.getField({
            fieldId: 'custbody_rest_tax_bus_id'
          });

        else if(customForm == PAYMENTFORMS.TOBACCO )
          var businessID = objRecord.getField({
            fieldId: 'custbody_tobc_business_id'
          });
        
         else if(customForm == PAYMENTFORMS.HOTEL )
          var businessID = objRecord.getField({
            fieldId: 'custbody_hotel_busniess_name_id'
          });

        businessID.isDisabled = true;

        var grossAmount = objRecord.getField({
          fieldId: 'custbody_tele_amount_1'
        });
        grossAmount.isDisabled = true;
        
        var checkAmount = objRecord.getField({
          fieldId: 'custbody_tele_check_amount'
        });
        checkAmount.isDisabled = true;

        var prevBalance = objRecord.getField({
          fieldId: 'custbody_prevbalance'
        });
        prevBalance.isDisabled = true;

        var payment = objRecord.getField({
          fieldId: 'custbody_paymnt_amount1'
        });
        payment.isDisabled = true;
        
        var payment2 = objRecord.getField({
          fieldId: 'custbody_payment_amount2'
        });
        payment2.isDisabled = true;
        var payment3 = objRecord.getField({
          fieldId: 'custbody_payment_amount3'
        });
        payment3.isDisabled = true;

      }

      if (context.mode == 'view' || context.mode == 'edit') {
        log.debug('Inside View/Edit', 'Inside View/Edit');
        var applyPrevBalance = objRecord.getValue({
          fieldId: 'custbody_prevbalance'
        });
        log.debug('applyPrevBalance', applyPrevBalance);
        if(applyPrevBalance == false){
          var totalBalToBePaid = objRecord.getField({
            fieldId: 'custbody_eb_total_balance_to_be_paid'
          });
          totalBalToBePaid.isDisplay = false;
        }
      }
    }
  }

  function fieldchange(context) {
    var objRecord = context.currentRecord;
    var sublistName = context.sublistId;
    var line = context.line;
    var fieldName = context.fieldId;

    var customForm = objRecord.getValue({
      fieldId: 'customform'
    });

    var taxPayerID = objRecord.getValue({
      fieldId: 'custbody_tax_payer_id_num'
    });

    if(customForm == PAYMENTFORMS.TELEPHONE){
      var newBusiness = objRecord.getValue({
        fieldId: 'custbody_business_id'
      });
    }
    if(customForm == PAYMENTFORMS.RESTAURANT){
      var newBusiness = objRecord.getValue({fieldId: 'custbody_rest_tax_bus_id'});
      var totalPrimaryRev = objRecord.getValue({fieldId: 'custbody_oma_rest_total_revenue'});
      if(isEmpty(totalPrimaryRev)){
        totalPrimaryRev = 0.00;
      }
      var totalNetRev = objRecord.getValue({fieldId: 'custbody_rest_net_sub_tax'});
      if(isEmpty(totalNetRev)){
        totalNetRev = 0.00;
      }
    }


    if (customForm == PAYMENTFORMS.TELEPHONE) {

      if (fieldName === 'custbody_tax_payer_id_num') {

        var taxregex = new RegExp("\\d{2}-\\d{7}$");

        if(taxregex.test(taxPayerID)){

          var ttDetailsJSON = findTeleTaxDetails(taxPayerID);
          log.debug('ttDetailsJSON', ttDetailsJSON);

          if(!isEmpty(ttDetailsJSON)){
            var ttInactive = ttDetailsJSON.ttInactive;
            if(ttInactive){
              var options = {
                title: 'Inactive Business ID',
                message: 'Tax Payer ID associated with an Inactivate Business'
              };

              dialog.alert(options);
              return false;
            }
            else
            {
              var ttBusinessID = ttDetailsJSON.ttBusinessID;
              var ttCustomerID = ttDetailsJSON.ttCustomerID;
              log.debug('ttBusinessID : ttCustomerID', ttBusinessID + " : " + ttCustomerID);

              objRecord.setValue({
                fieldId: 'customer',
                value: ttCustomerID
              });
              objRecord.setValue({
                fieldId: 'custbody_eb_temp_tax_payer_id',
                value: ttBusinessID
              });
            }
          }

          if(isEmpty(ttDetailsJSON)){
            var options = {
              title: 'Invalid Tax Payer ID',
              message: "Tax Payer ID doesn't exist. Please enter an existing Tax Payer ID"
            };

            dialog.alert(options);
            return false;
          }
        }
        else{
          var options = {
            title: 'Tax Payer ID ',
            message: 'Please Enter a Valid Tax Payer ID Format. XX-XXXXXXX'
          };

          dialog.alert(options);
          return false;
        }
      }

      if (fieldName === 'custbody_tele_check_amount') {

        var checkAmount = objRecord.getValue({
          fieldId: 'custbody_tele_check_amount'
        });

        if (!isEmpty(checkAmount) && checkAmount > 0) {

          objRecord.setValue({
            fieldId: 'payment',
            value: checkAmount
          });

          var tax = objRecord.getValue({
            fieldId: 'custbody_oma_rest_net_revenue'
          });

          var remaining = Number(tax) - Number(checkAmount);

          objRecord.setValue({
            fieldId: 'custbody_balance',
            value: remaining.toFixed(2)
          });

        } else {
          objRecord.setValue({
            fieldId: 'payment',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_balance',
            value: ''
          });
        }
      }

      if (fieldName === 'custbody_oma_rest_net_revenue') {
        objRecord.setValue({
          fieldId: 'custbody_tele_check_amount',
          value: ''
        });
        objRecord.setValue({
          fieldId: 'payment',
          value: ''
        });
        objRecord.setValue({
          fieldId: 'custbody_balance',
          value: ''
        });

      }

      if (fieldName === 'custbody_business_id') {
        if (!isEmpty(newBusiness)) {

          var currBalance = search.lookupFields({
            type: 'customrecord_telephone_tax',
            id: newBusiness,
            columns: ['custrecord_balance', 'custrecord_rest_pay_period']
          });

          log.debug('currBalance', currBalance);
          if (isEmpty(currBalance.custrecord_balance) || currBalance.custrecord_balance == '.00') {
            currBalance.custrecord_balance = 0;
          }
          objRecord.setValue({
            fieldId: 'custbody_eb_total_balance_to_be_paid',
            value: currBalance.custrecord_balance
          });

          objRecord.setValue({
            fieldId: 'custbody_paymentperiod',
            value: currBalance.custrecord_rest_pay_period[0].value
          });
          var prevBalance = objRecord.getField({
            fieldId: 'custbody_prevbalance'
          });
          var totalBalanceToBePaid = objRecord.getField({
            fieldId: 'custbody_eb_total_balance_to_be_paid'
          });
          if (currBalance.custrecord_balance == '0.00' || currBalance.custrecord_balance == '0') {
            prevBalance.isDisabled = true;
            totalBalanceToBePaid.isDisplay = false;
          } else {
            prevBalance.isDisabled = false;
            totalBalanceToBePaid.isDisplay = true;
          }
          var paymentPeriod = objRecord.getValue({
            fieldId: 'custbody_paymentperiod'
          });

          if(paymentPeriod == 1){
            var quarterly = objRecord.getField({
              fieldId: 'custpage_yearfield_quarterly'
            });
            quarterly.isDisabled = true;
            var month = objRecord.getField({
              fieldId: 'custpage_yearfield_month'
            });
            month.isDisabled = false;


          }else{
            var quarterly = objRecord.getField({
              fieldId: 'custpage_yearfield_quarterly'
            });
            quarterly.isDisabled = false;
            var month = objRecord.getField({
              fieldId: 'custpage_yearfield_month'
            });
            month.isDisabled = true;
          }


          objRecord.setValue({
            fieldId: 'custbody_tax_month',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_tax_year',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_tele_amount_1',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_quarterly',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_hotel_year_tax',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_paymnt_amount1',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_payment_amount2',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_payment_amount3',
            value: ''
          });

        } else {
          objRecord.setValue({
            fieldId: 'custbody_eb_total_balance_to_be_paid',
            value: ''
          });

        }

      }

      if (fieldName === 'custbody_prevbalance') {

        var check = objRecord.getValue({
          fieldId: 'custbody_prevbalance'
        });

        if (check) {
          var oldBal = search.lookupFields({
            type: 'customrecord_telephone_tax',
            id: newBusiness,
            columns: 'custrecord_balance'
          });

          var oldTax = objRecord.getValue({
            fieldId: 'custbody_oma_rest_net_revenue'
          });

          var newTax = Number(oldBal.custrecord_balance) + Number(oldTax)

          objRecord.setValue({
            fieldId: 'custbody_oma_rest_net_revenue',
            value: newTax.toFixed(2)
          });
        } else {

          var newTax = objRecord.getValue({
            fieldId: 'custbodytax_tele'
          });

          objRecord.setValue({
            fieldId: 'custbody_oma_rest_net_revenue',
            value: newTax.toFixed(2)
          });
        }
      }

      if (fieldName === 'custpage_yearfield_month') {
        var monthYearValue = objRecord.getValue({
          fieldId: 'custpage_yearfield_month',
        });

        objRecord.setValue({
          fieldId: 'custbody_tax_year',
          value: monthYearValue
        });
      }

      if (fieldName === 'custpage_yearfield_quarterly') {
        var quarterYearValue = objRecord.getValue({
          fieldId: 'custpage_yearfield_quarterly',
        });

        objRecord.setValue({
          fieldId: 'custbody_hotel_year_tax',
          value: quarterYearValue
        });
      }
      
      if (fieldName === 'custbody_tele_amount_1'||fieldName === 'custbody_paymnt_amount1'||fieldName === 'custbody_payment_amount2'||fieldName === 'custbody_payment_amount3') {

        objRecord.setValue({
          fieldId: 'custbody_prevbalance',
          value: false
        });
      }

    }

    if (customForm == PAYMENTFORMS.RESTAURANT) {

      if (fieldName === 'custbody_tax_payer_id_num') {

        var taxregex = new RegExp("\\d{2}-\\d{7}$");

        if(!isEmpty(taxregex.test(taxPayerID))){

          var rtDetailsJSON = findRestTaxDetails(taxPayerID);
          log.debug('rtDetailsJSON', rtDetailsJSON);

          if(!isEmpty(rtDetailsJSON)){
            var rtInactive = rtDetailsJSON.rtInactive;
            if(rtInactive){
              var options = {
                title: 'Inactive Business ID',
                message: 'Tax Payer ID associated with an Inactivate Business'
              };

              dialog.alert(options);
              return false;
            }
            else{
              var rtBusinessID = rtDetailsJSON.rtBusinessID;
              var rtCustomerID = rtDetailsJSON.rtCustomerID;
              log.debug('rtBusinessID : rtCustomerID', rtBusinessID + " : " + rtCustomerID);

              objRecord.setValue({
                fieldId: 'customer',
                value: rtCustomerID
              });
              objRecord.setValue({
                fieldId: 'custbody_eb_temp_tax_payer_id',
                value: taxPayerID
              });
            }

          }
          if(isEmpty(rtDetailsJSON)){
            var options = {
              title: 'Invalid Tax Payer ID',
              message: "Tax Payer ID doesn't exist. Please enter an existing Tax Payer ID"
            };

            dialog.alert(options);
            return false;
          }

        }else{
          var options = {
            title: 'Tax Payer ID ',
            message: 'Please Enter a Valid Tax Payer ID Format [XX-XXXXXXX]'
          };

          dialog.alert(options);
          return false;
        }
      }

      /*if (fieldName === 'custbody_tele_check_amount') {

        var checkAmount = objRecord.getValue({
          fieldId: 'custbody_tele_check_amount'
        });

        if (!isEmpty(checkAmount) && checkAmount > 0) {

          objRecord.setValue({
            fieldId: 'payment',
            value: checkAmount
          });

          var tax = objRecord.getValue({
            fieldId: 'custbody_oma_rest_net_revenue'
          });

          var remaining = Number(tax) - Number(checkAmount);

          objRecord.setValue({
            fieldId: 'custbody_balance',
            value: remaining.toFixed(2)
          });

        } else {
          objRecord.setValue({
            fieldId: 'payment',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_balance',
            value: ''
          });
        }
      }*/

      /*if (fieldName === 'custbody_oma_rest_net_revenue') {
        objRecord.setValue({
          fieldId: 'custbody_tele_check_amount',
          value: ''
        });
        objRecord.setValue({
          fieldId: 'payment',
          value: ''
        });
        objRecord.setValue({
          fieldId: 'custbody_balance',
          value: ''
        });

      }*/

      /*
      if (fieldName === 'custbody_rest_tax_bus_id') {

        if (!isEmpty(newBusiness) && !isEmpty(taxPayerID)) {

          var currBalance = search.lookupFields({
            type: 'customrecord_restaurant_tax',
            id: newBusiness,
            columns: ['custrecord_rest_tax_balance', 'custrecord_payment_rest_period']
          });

          log.debug('currBalance', currBalance);
          if (isEmpty(currBalance.custrecord_rest_tax_balance) || currBalance.custrecord_rest_tax_balance == '.00') {
            currBalance.custrecord_rest_tax_balance = 0;
          }
          objRecord.setValue({
            fieldId: 'custbody_eb_total_balance_to_be_paid',
            value: currBalance.custrecord_rest_tax_balance
          });

          objRecord.setValue({
            fieldId: 'custbody_paymentperiod',
            value: currBalance.custrecord_payment_rest_period[0].value
          });
          var prevBalance = objRecord.getField({
            fieldId: 'custbody_prevbalance'
          });
          var totalBalanceToBePaid = objRecord.getField({
            fieldId: 'custbody_eb_total_balance_to_be_paid'
          });
          if (currBalance.custrecord_rest_tax_balance == '0.00' || currBalance.custrecord_rest_tax_balance == '0') {
            prevBalance.isDisabled = true;
            totalBalanceToBePaid.isDisplay = false;
          } else {
            prevBalance.isDisabled = false;
            totalBalanceToBePaid.isDisplay = true;
          }
          var paymentPeriod = objRecord.getValue({
            fieldId: 'custbody_paymentperiod'
          });

          if(paymentPeriod==1){
            var quarterly = objRecord.getField({
              fieldId: 'custpage_yearfield_quarterly'
            });
            quarterly.isDisabled = true;
            var month = objRecord.getField({
              fieldId: 'custpage_yearfield_month'
            });
            month.isDisabled = false;


          }else{
            var quarterly = objRecord.getField({
              fieldId: 'custpage_yearfield_quarterly'
            });
            quarterly.isDisabled = false;
            var month = objRecord.getField({
              fieldId: 'custpage_yearfield_month'
            });
            month.isDisabled = true;
          }


          objRecord.setValue({
            fieldId: 'custbody_tax_month',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_tax_year',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_tele_amount_1',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_quarterly',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_hotel_year_tax',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_paymnt_amount1',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_payment_amount2',
            value: ''
          });
          objRecord.setValue({
            fieldId: 'custbody_payment_amount3',
            value: ''
          });

        } else {
          objRecord.setValue({
            fieldId: 'custbody_eb_total_balance_to_be_paid',
            value: ''
          });

        }

      } */

      if (fieldName === 'custbody_prevbalance') {

        var check = objRecord.getValue({
          fieldId: 'custbody_prevbalance'
        });

        if (check) {
          var oldBal = search.lookupFields({
            type: 'customrecord_telephone_tax',
            id: newBusiness,
            columns: 'custrecord_balance'
          });

          var oldTax = objRecord.getValue({
            fieldId: 'custbody_oma_rest_net_revenue'
          });

          var newTax = Number(oldBal.custrecord_balance) + Number(oldTax)

          objRecord.setValue({
            fieldId: 'custbody_oma_rest_net_revenue',
            value: newTax.toFixed(2)
          });
        } else {

          var newTax = objRecord.getValue({
            fieldId: 'custbodytax_tele'
          });

          objRecord.setValue({
            fieldId: 'custbody_oma_rest_net_revenue',
            value: newTax.toFixed(2)
          });
        }

      }
      if (fieldName === 'custpage_yearfield_month') {
        var monthYearValue = objRecord.getValue({
          fieldId: 'custpage_yearfield_month',
        });

        objRecord.setValue({
          fieldId: 'custbody_tax_year',
          value: monthYearValue
        });
      }
      if (fieldName === 'custpage_yearfield_quarterly') {
        var quarterYearValue = objRecord.getValue({
          fieldId: 'custpage_yearfield_quarterly',
        });

        objRecord.setValue({
          fieldId: 'custbody_hotel_year_tax',
          value: quarterYearValue
        });
      }
      if (fieldName === 'custbody_tele_amount_1'||fieldName === 'custbody_paymnt_amount1'||fieldName === 'custbody_payment_amount2'||fieldName === 'custbody_payment_amount3') {

        objRecord.setValue({
          fieldId: 'custbody_prevbalance',
          value: false
        });
      }

      if (sublistName === 'recmachcustrecord_pd_customer_payment_link' && fieldName === 'custrecord_pd_amount') {

        var addLocAmt = objRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custrecord_pd_amount'});
        log.debug('Additional Location Amount', addLocAmt);
        totalPrimaryRev = totalPrimaryRev + addLocAmt;
        log.debug('totalPrimaryRev', totalPrimaryRev);
        objRecord.setValue({fieldId: 'custbody_rest_net_sub_tax',value: totalPrimaryRev});
      }
    }
  }

  /**
  * Validation function to be executed when record is saved.
  *
  * @param {Object} scriptContext
  * @param {Record} scriptContext.currentRecord - Current form record
  * @returns {boolean} Return true if record is valid
  *
  * @since 2015.2
  */
  function saveRecord(context) {
    log.debug('save', context.currentRecord.isNew)
    var objRecord = context.currentRecord;
    var department = objRecord.getValue({
      fieldId: 'department',
    });

    var customForm = objRecord.getValue({
      fieldId: 'customform'
    });

    if(customForm == PAYMENTFORMS.RESTAURANT || customForm == PAYMENTFORMS.TOBACCO || customForm == PAYMENTFORMS.HOTEL){
      var totalTax = objRecord.getValue({
        fieldId: 'custbody_rest_total_occ_enty',
      });
    }    
    else
      var totalTax = objRecord.getValue({
        fieldId: 'custbody_oma_rest_net_revenue',
      });

    if(department != FOPS.DEPARTMENT) return true
    if (Number(totalTax)<0) {

      var options = {
        title: 'Total Tax Due',
        message: 'Payment not required when Total Tax Due is negative'
      };

      dialog.alert(options);
      return false;
    }else if(Number(totalTax) == 0){
      var option1= {
        title: 'Total Tax Due',
        message: 'Payment not required if the Total Tax Due is zero'
      };

      dialog.alert(option1);
      return false;
    }
    return true;
  }



  function findTeleTaxDetails(taxPayerID) {
    var ttDetailsJSON = {};
    var customrecord_telephone_taxSearchObj = search.create({
      type: "customrecord_telephone_tax",
      filters:
      [
        ["custrecord_tax_payer_id_num","is",taxPayerID]
      ],
      columns:
      [
        search.createColumn({name: "internalid", label: "Internal ID"}),
        search.createColumn({name: "isinactive"}),
        search.createColumn({name: "custrecord_restaurant_customer_tax", label: "Customer"}),
        search.createColumn({name: "custrecord_tax_payer_id_num", label: "Tax Payer Id Number"})
      ]
    });
    var telephoneTaxResults = customrecord_telephone_taxSearchObj.run().getRange({ start: 0, end: 1000 });
    log.debug('telephoneTaxResults', telephoneTaxResults);
    if (telephoneTaxResults != null && telephoneTaxResults.length > 0) {
      var ttBusinessID = telephoneTaxResults[0].getValue({ name: 'internalid' });
      var ttCustomerID = telephoneTaxResults[0].getValue({ name: 'custrecord_restaurant_customer_tax' });
      var ttInactive = telephoneTaxResults[0].getValue({ name: 'isinactive' });
      log.debug('ttBusinessID : ttCustomerID', ttBusinessID + " : " + ttCustomerID);
      ttDetailsJSON.ttBusinessID = ttBusinessID;
      ttDetailsJSON.ttCustomerID = ttCustomerID;
      ttDetailsJSON.ttInactive = ttInactive;
      log.debug('ttDetailsJSON', JSON.stringify(ttDetailsJSON));
      return ttDetailsJSON;
    }
    return null;
  }

  function findRestTaxDetails(taxPayerID) {
    var rtDetailsJSON = {};
    var customrecord_restaurant_taxSearchObj = search.create({
      type: "customrecord_restaurant_tax",
      filters:
      [
        ["custrecord_rest_tax_pay_id_num","is",taxPayerID]
      ],
      columns:
      [
        search.createColumn({name: "internalid", label: "Internal ID"}),
        search.createColumn({name: "isinactive"}),
        search.createColumn({name: "custrecord_rest_cust", label: "Customer"}),
        search.createColumn({name: "custrecord_rest_tax_pay_id_num", label: "Tax Payer Id Number"})
      ]
    });
    var restTaxResults = customrecord_restaurant_taxSearchObj.run().getRange({ start: 0, end: 1000 });
    log.debug('restTaxResults', restTaxResults);
    if (restTaxResults != null && restTaxResults.length > 0) {
      var rtBusinessID = restTaxResults[0].getValue({ name: 'internalid' });
      var rtCustomerID = restTaxResults[0].getValue({ name: 'custrecord_rest_cust' });
      var rtInactive = restTaxResults[0].getValue({ name: 'isinactive' });
      log.debug('rtBusinessID : rtCustomerID', rtBusinessID + " : " + rtCustomerID);
      rtDetailsJSON.rtBusinessID = rtBusinessID;
      rtDetailsJSON.rtCustomerID = rtCustomerID;
      rtDetailsJSON.rtInactive = rtInactive;
      log.debug('rtDetailsJSON', JSON.stringify(rtDetailsJSON));
      return rtDetailsJSON;
    }
    return null;
  }

  function postSourcing(context) {
    debugger;
    var currentRecord = context.currentRecord;
    var fieldName = context.fieldId;
    var customForm = currentRecord.getValue('customform');
    var customerID = currentRecord.getValue('customer');
    var taxPayerID = currentRecord.getValue('custbody_eb_temp_tax_payer_id');
    var businessID = currentRecord.getValue('custbody_business_id');
    log.debug('customerID : taxPayerID', customerID + " : " + taxPayerID);

    if (customForm == PAYMENTFORMS.TELEPHONE ) {
      if (fieldName === 'customer') {

        if(isEmpty(taxPayerID) && !businessID){

          var ttDetailsJSON = findTeleTaxDetails(taxPayerID);
          log.debug('ttDetailsJSON_Customer Post Sourcing', ttDetailsJSON);

          if(!isEmpty(ttDetailsJSON)){
            var ttBusinessID = ttDetailsJSON.ttBusinessID;
            log.debug('ttBusinessID', ttBusinessID);
            currentRecord.setValue({
              fieldId: 'custbody_business_id',
              value: ttBusinessID
            });
          }
        }
        else if(taxPayerID && !businessID)
          currentRecord.setValue({
            fieldId: 'custbody_business_id',
            value: taxPayerID
          });


      }
    }
    if (customForm == PAYMENTFORMS.RESTAURANT) {
      if (fieldName === 'customer') {
        var rtDetailsJSON = findRestTaxDetails(taxPayerID);
        log.debug('rtDetailsJSON_Customer Post Sourcing', ttDetailsJSON);
        if(!isEmpty(rtDetailsJSON)){
          var rtBusinessID = rtDetailsJSON.rtBusinessID;
          log.debug('rtBusinessID', rtBusinessID);
          currentRecord.setValue({
            fieldId: 'custbody_rest_tax_bus_id',
            value: rtBusinessID
          });
        }
      }
    }
  }

  function isEmpty(value) {
    if (value === null) {
      return true;
    } else if (value === undefined) {
      return true;
    } else if (value === '') {
      return true;
    } else if (value === ' ') {
      return true;
    } else if (value === 'null') {
      return true;
    } else {
      return false;
    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldchange,
    postSourcing: postSourcing,
    saveRecord: saveRecord
  }
});