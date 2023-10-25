/**
* @NApiVersion 2.x
* @NModuleScope Public
* @NScriptType ClientScript
*/

/************************************************************************
* File Name : FOPS_CS_Payment_Restaurant_Tax_Calculation.js
* Date      :
* Purpose   : This script will Payment Restaurant Tax Calculation 
*
* History
* Date          Author        Details
* 20-04-2023    Faizan        Fixed Invoice Credit Deposit display Issue
* 20-04-2023    Faizan        Fixed Auto Sourcing Business and Customer based on Tax Payer Id
* 20-04-2023    Faizan        Fixed Payment Status field
* 25-04-2023    Faizan        Fixed Due Date
* 03-05-2023    Faizan        Custom Year Field Logic
***********************************************************************/

define(["N/record", "N/search", "N/runtime", "N/ui/dialog", "N/format"],
  function (record, search, runtime, dialog, format) {

    var PAYMENTFORMS = {
      'TELEPHONE': '203',
      'TOBACCO': '212',
      'RESTAURANT': '193',
      'HOTEL': '220'
    }

    var PAYMENT_PERIOD = {
      MONTHLY: 1,
      QUARTERLY: 2
    }

    var BUSINESSTYPE_RESTAURANT = 2;
    var DUEDATE_MESSAGE = "Please enter valid Tax Period (Year/Quarter/Month) and make sure Due Date populated";

    var exports = {};
    var yymmChange = false;
    var mm = '';
    var yy = '';


    //pageInit
    function pageInit(context) {
      debugger;
      var currentRecord = context.currentRecord;
      var formType = currentRecord.getValue({
        fieldId: "customform",
      });

      // alert(formType)
      if (formType == 193) {


        jQuery("#NS_MENU_ID0-item1,#NS_MENU_ID0-item2,#NS_MENU_ID0-item5").hide();
        //hide invoice list
        // jQuery('#applications_form').next("table.uir-table-block").hide()
        // avoid edit to user when payment made through online


        //HIDE SUBLISTS
        var invoiceSublist = currentRecord.getSublist({ sublistId: 'apply' });
        if (!isEmpty(invoiceSublist))
          invoiceSublist.isDisplay = false;


        var creditSublist = currentRecord.getSublist({ sublistId: 'credit' });
        if (!isEmpty(creditSublist))
          creditSublist.isDisplay = false;


        var depositSublist = currentRecord.getSublist({ sublistId: 'deposit' });
        if (!isEmpty(depositSublist))
          depositSublist.isDisplay = false;

        var userObj = runtime.getCurrentUser();
        var role = userObj.role;
        onloadValidationDisable(currentRecord, context.mode)
        //alert(role)
        console.log(context.mode)
        if (context.mode == "edit") {

          var tranType = currentRecord.getValue({
            fieldId: "custbody_transaction_type",
          });
          yy = currentRecord.getText({
            fieldId: "custbody_tax_year",
          });
          mm = currentRecord.getValue({
            fieldId: "custbody_tax_month",
          });
          console.log(tranType)
          if (tranType == "2") {
            var option = {
              title: "Insufficient Permission",
              message: "You do not have sufficient permission to change this record. Please contact with Administrator",
            };
          }
        }
      }
    }

    //fieldChanged
    function fieldChanged(context) {
      //alert(runtime.executionContext)
      if (runtime.executionContext == 'USERINTERFACE') {

        try {
          var currentRecord = context.currentRecord;
          var sublistId = context.sublistId;
          var department = currentRecord.getValue("department");
          var deptClass = currentRecord.getValue("class");
          var formid = currentRecord.getValue("customform");
          var userObj = runtime.getCurrentUser();
          var fieldName = context.fieldId;
          var role = userObj.role;
          var taxPayerID = currentRecord.getValue('custbody_tax_payer_id_num');

          //RUN ONLY FOR RESTAURANT FORM
          if (formid != PAYMENTFORMS.RESTAURANT)
            return;

          if (fieldName == "custbody_rest_tax_bus_id") {

            if (department == 106 && deptClass == 12) {
              onloadValidationDisable(currentRecord, 'change')

              var Btype = currentRecord.getField('custbody_business_type');
              var Ttype = currentRecord.getField('custbody_transaction_type');
              var business = currentRecord.getValue("custbody_rest_tax_bus_id");
              if (business) {

                // LOOK UP ON RESTAURANT TAX RECORD
                var resTaxRec = search.lookupFields({
                  type: 'customrecord_restaurant_tax',
                  id: business,
                  columns: ['custrecord_rest_tax_balance']
                });

                var balance = resTaxRec.custrecord_rest_tax_balance;

                if (balance == 0 || !balance) {
                  var applyPrebal = currentRecord.getField('custbody_prevbalance');
                  applyPrebal.isDisabled = true
                } 
                else {
                  applyPrebal.isDisabled = false;
                }

                Btype.isDisabled = true
                Ttype.isDisabled = true
                var taxnumber = getTaxId()
                currentRecord.setValue({ fieldId: "custbodyrest_tax_pay_id", value: taxnumber })
                currentRecord.setValue({ fieldId: "custbody_business_type", value: 2 })
                currentRecord.setValue({ fieldId: "custbody_transaction_type", value: 1 })

              } else {
                Btype.isDisabled = false
                Ttype.isDisabled = false
                //currentRecord.setValue({ fieldId: "custbody_tax_payer_id_num", value: '' })
              }
            } else {
              var option = {
                title: "Error",
                message:
                  "please select department as 'FOPS', class as 'Restaurant Tax'",
              };
              dialog.alert(option);
            }

          }
          else if (fieldName === 'custbody_tax_payer_id_num') {

            var taxregex = new RegExp("\\d{2}-\\d{7}$");

            if (taxregex.test(taxPayerID)) {

              var rtDetailsJSON = findRestTaxDetails(taxPayerID);
              log.debug('rtDetailsJSON', rtDetailsJSON);

              if (!isEmpty(rtDetailsJSON)) {
                var rtInactive = rtDetailsJSON.rtInactive;
                if (rtInactive) {
                  var options = {
                    title: 'Inactive Business ID',
                    message: 'Tax Payer ID associated with an Inactivate Business'
                  };

                  dialog.alert(options);
                  return false;
                }
                else {
                  var rtBusinessID = rtDetailsJSON.rtBusinessID;
                  var rtCustomerID = rtDetailsJSON.rtCustomerID;
                  log.debug('rtBusinessID : rtCustomerID', rtBusinessID + " : " + rtCustomerID);

                  currentRecord.setValue({
                    fieldId: 'customer',
                    value: rtCustomerID
                  });
                  currentRecord.setValue({
                    fieldId: 'custbody_eb_temp_tax_payer_id',
                    value: rtBusinessID
                  });
                }
              }

              if (isEmpty(rtDetailsJSON)) {
                var options = {
                  title: 'Invalid Tax Payer ID',
                  message: "Tax Payer ID doesn't exist. Please enter an existing Tax Payer ID"
                };

                dialog.alert(options);
                return false;
              }
            }
            else {
              var options = {
                title: 'Tax Payer ID ',
                message: 'Please Enter a Valid Tax Payer ID Format. XX-XXXXXXX'
              };

              dialog.alert(options);
              return false;
            }
          }
          if (fieldName === 'custbody_prevbalance') {

            var newBusiness = currentRecord.getValue({
              fieldId: 'custbody_rest_tax_bus_id'
            });

            var check = currentRecord.getValue({
              fieldId: 'custbody_prevbalance'
            });

            if (check) {
              var oldBal = search.lookupFields({
                type: 'customrecord_restaurant_tax',
                id: newBusiness,
                columns: 'custrecord_rest_tax_balance'
              });

              var oldTax = currentRecord.getValue({
                fieldId: 'custbody_rest_total_occ_enty'
              });

              var newTax = Number(oldBal.custrecord_rest_tax_balance) + Number(oldTax)

              currentRecord.setValue({
                fieldId: 'custbody_rest_total_occ_enty',
                value: newTax.toFixed(2)
              });

              currentRecord.setValue({
                fieldId: 'custbody_eb_total_balance_to_be_paid',
                value: Number(oldBal.custrecord_rest_tax_balance)
              });


              currentRecord.setValue({
                fieldId: 'custbodytax_tele',
                value: oldTax.toFixed(2)
              });
            } else {

              var newTax = currentRecord.getValue({
                fieldId: 'custbodytax_tele'
              });

              currentRecord.setValue({
                fieldId: 'custbody_rest_total_occ_enty',
                value: newTax.toFixed(2)

              });
            }
          }

          else if (fieldName == "custbody_oma_rest_adj_revenueee") {
            var btype = currentRecord.getValue({
              fieldId: "custbody_business_type",
            });
            if (department == 106 && deptClass == 12 && btype == 2) {
              var revenue = currentRecord.getValue("custbody_oma_rest_total_revenue");
              var adjustAmnt = currentRecord.getValue("custbody_oma_rest_adj_revenue");
              var totalrevenue = revenue + adjustAmnt;

              //GET ALL RESTAURANT TAX RATES
              var BUSINESSTAX_OBJ = getBusinessTaxPercentage();
              var ratepercantage = BUSINESSTAX_OBJ.businesstax;
              var rate = ratepercantage ? ratepercantage : 2.5;
              var lessCollFeeRate = BUSINESSTAX_OBJ.collectionfee?BUSINESSTAX_OBJ.collectionfee : 2;
              
              
              //var ratepercantage = getRatePercantage();
              
              var tax = percentage(totalrevenue, rate);
              var lessCollectionFee = percentage(tax, lessCollFeeRate);
              var occTaxDue = tax - lessCollectionFee;


              //currentRecord.setValue({
              //  fieldId: "custbody_rest_net_sub_tax",
              //  value: totalrevenue,
              //});
              currentRecord.setValue({
                fieldId: "custbody_rest_occ_ordinance_tax",
                value: tax
              });
              currentRecord.setValue({
                fieldId: "custbody_rest_less_collection_fee",
                value: lessCollectionFee
              });
              currentRecord.setValue({
                fieldId: "custbody_rest_oc_due",
                value: occTaxDue
              });
              var getYear = currentRecord.getValue({
                fieldId: "custbody_tax_year",
              });
              var getMonth = currentRecord.getValue({
                fieldId: "custbody_tax_month",
              });

              //GET DIFF BETWEEN DUE DATE & TODAY
              var dueDate = getDueDate(getYear, getMonth);
              var latefee = 0;
              if (dueDate) {
                var penaltyRate = BUSINESSTAX_OBJ.penalty;
                var penalty = percentage(occTaxDue, penaltyRate).toFixed(2);
                currentRecord.setValue({
                  fieldId: "custbody_rest_penalty",
                  value: penalty
                });
                var interest = ((occTaxDue / 100) * dueDate).toFixed(2);
                currentRecord.setValue({
                  fieldId: "custbody_rest_interest_tax",
                  value: interest
                });
                latefee = parseFloat(penalty) + parseFloat(interest);
                currentRecord.setValue({
                  fieldId: "custbody_oma_rest_total_pen_int",
                  value: latefee
                });
              }
              var totaldue = (parseFloat(latefee) + parseFloat(occTaxDue)).toFixed(2);
              currentRecord.setValue({
                fieldId: "custbody_rest_total_occ_enty",
                value: totaldue
              });

              //var includeCharges = parseFloat(totaldue) + parseFloat(charges);

              currentRecord.setValue({
                fieldId: "payment",
                value: totaldue
              });

            } else {
              var option = {
                title: "Error",
                message:
                  "please select department as 'FOPS', class as 'Restaurant Tax'",
              };
              //  dialog.alert(option);
            }
          }
          else if (fieldName == "custpage_custom_year_field") {

            var yearVal = currentRecord.getValue(fieldName);
            currentRecord.setValue({
              fieldId: "custbody_tax_year",
              value: yearVal
            });

          }
          //POPULATE DUE DATE Logic
          else if (fieldName == "custbody_tax_month" ||
            fieldName == "custbody_tax_year" ||
            fieldName == "custbody_quarterly") {


            var paymentYearText = currentRecord.getText("custbody_tax_year");
            var paymentMonthText = currentRecord.getText("custbody_tax_month");
            var paymentQuarterlyText = currentRecord.getText("custbody_quarterly");
            var paymentPeriod = currentRecord.getValue("custbody_paymentperiod");

            console.log('DUE DATE Logic :   paymentYearText:  ' + paymentYearText + '  paymentMonthText: ' + paymentMonthText + '    paymentQuarterlyText : ' + paymentQuarterlyText)
            if (paymentYearText && (paymentMonthText || paymentQuarterlyText)) {
              var dueDate = getPaymentDueDate(paymentMonthText, paymentQuarterlyText, paymentYearText, paymentPeriod);
              if (dueDate)
                currentRecord.setValue({
                  fieldId: "custbody_payment_due_date",
                  value: new Date(dueDate)
                });
              else
                currentRecord.setValue({
                  fieldId: "custbody_payment_due_date",
                  value: ''
                });
            }
          


            currentRecord.setValue({
              fieldId: "custbody_oma_rest_total_revenue",
              value: ''
            });

            currentRecord.setValue({
              fieldId: "custbody_oma_rest_adj_revenue",
              value: ''
            });


          }
          // else if (fieldName == "custbody_rest_total_rev_add_loc" ||
          //   fieldName == "custbody_oma_rest_total_revenue") {
          //     debugger;
          //   var totalrevenueForLoc = currentRecord.getValue('custbody_rest_total_rev_add_loc');
          //   var revenueForpriBus = currentRecord.getValue( 'custbody_oma_rest_total_revenue');

          //   log.debug('GET', 'REVENUE FOR PRIMARY BUSINESS : ' + revenueForpriBus)

          //   var totalAmountValue = totalrevenueForLoc + revenueForpriBus;
          //   log.debug('TOTAL', ' ADD TOTAL AMOUNT : ', totalAmountValue);

          //   log.debug('---- VALUE ----', 'SET VALUE');

          //   currentRecord.setValue({
          //     fieldId: 'custbody_rest_net_sub_tax',
          //     value: totalAmountValue,
          //     ignoreFieldChange: true
          //   });
          // }

          //POPULATE TOTAL REVENUE
          else if (fieldName == "custbody_oma_rest_adj_revenue" ||
            fieldName == "custbody_rest_total_rev_add_loc" ||
            fieldName == "custbody_oma_rest_total_revenue") {

            debugger;
            //var totalRevRec = currentRecord.getValue('custbody_rest_net_sub_tax');
            var paymentYearText = currentRecord.getText("custbody_tax_year");
            var paymentMonthText = currentRecord.getText("custbody_tax_month");
            var paymentQuarterlyText = currentRecord.getText("custbody_quarterly");
            var dueDate = currentRecord.getValue('custbody_payment_due_date');
            var adjusToRevenue = currentRecord.getValue('custbody_oma_rest_adj_revenue');
            var addLocationRev = currentRecord.getValue('custbody_rest_total_rev_add_loc');
            var totalRevenue = currentRecord.getValue('custbody_oma_rest_total_revenue');
            log.debug('GET', ' TOTAL REVENUE RECIEVE :' + totalRevRec);
            if (!dueDate && ((paymentYearText && paymentMonthText) ||(paymentYearText && paymentQuarterlyText ))) {
              currentRecord.setValue({
                fieldId: fieldName,
                value: '',
                ignoreFieldChange: true
              });

              var option = {
                title: "Validation",
                message: DUEDATE_MESSAGE,
              };
              dialog.alert(option);
              return false;
            }

            totalRevValues = Number(adjusToRevenue) + Number(addLocationRev) + Number(totalRevenue);
            log.debug('TOTAL', ' TOTAL BOTH REVENUE VALUE :' + totalRevValues);

            currentRecord.setValue({
              fieldId: 'custbody_rest_net_revenue_cur_month',
              value: totalRevValues.toFixed(2),
              ignoreFieldChange: false
            });
          }
          else if (fieldName == "custbody_rest_net_revenue_cur_month") {
            var totalRevRec = Number(currentRecord.getValue('custbody_rest_net_revenue_cur_month'));
            var occTaxDue = Number(currentRecord.getValue('custbody_rest_oc_due'));
            var taxCalculation = 2.5 / 100 * totalRevRec;
            var taxMonth = currentRecord.getValue('custbody_tax_month');
            var taxYear = currentRecord.getValue('custbody_tax_year');
            var taxQuarter = currentRecord.getValue('custbody_quarterly');
            var dueDate = currentRecord.getValue('custbody_payment_due_date');

            //GET DIFF BETWEEN DUE DATE & TODAY
            //var dueDate = getDueDate(taxYear, taxMonth);
            var latefee = 0;
            if (dueDate) {
              dueDate =  format.parse({
                value: dueDate,
                type: format.Type.DATE
              });
              //var dueDateDiff = getDueDateDifference(dueDate);
              var dueDateDiff = getMonthDifference(dueDate, new Date());
              
              currentRecord.setValue({
                fieldId: 'custbody_rest_occ_ordinance_tax',
                value: taxCalculation.toFixed(2),
                ignoreFieldChange: false
              });

              var collectionFee = 2 / 100 * taxCalculation;
              currentRecord.setValue({
                fieldId: 'custbody_rest_less_collection_fee',
                value: collectionFee.toFixed(2),
                ignoreFieldChange: true
              });

              var restOccupationDue = Number(taxCalculation) - Number(collectionFee);
              currentRecord.setValue({
                fieldId: 'custbody_rest_oc_due',
                value: restOccupationDue.toFixed(2),
                ignoreFieldChange: true
              });


              //PENALTY CALCULATION
              var penaltyAmount = percentage(restOccupationDue, '10').toFixed(2);
              currentRecord.setValue({
                fieldId: "custbody_rest_penalty",
                value: penaltyAmount
              });
              var interest = ((restOccupationDue / 100) * dueDateDiff).toFixed(2);
              currentRecord.setValue({
                fieldId: "custbody_rest_interest_tax",
                value: interest
              });
              latefee = parseFloat(penaltyAmount) + parseFloat(interest);
              currentRecord.setValue({
                fieldId: "custbody_oma_rest_total_pen_int",
                value: latefee
              });

              var totaldue = (parseFloat(latefee) + parseFloat(restOccupationDue)).toFixed(2);
              currentRecord.setValue({
                fieldId: "custbody_rest_total_occ_enty",
                value: totaldue
              });

              currentRecord.setValue({
                fieldId: 'custbodytax_tele',
                value: totaldue
              });
            }
            else if((taxMonth && taxYear) || (taxQuarter && taxYear)){
              currentRecord.setValue({
                fieldId: fieldName,
                value: '',
                ignoreFieldChange: true
              });
              var option = {
                title: "Validation",
                message: DUEDATE_MESSAGE,
              };
              dialog.alert(option);
              return false;
            }
          }

          if (fieldName === 'custbody_tele_check_amount' ||
            fieldName === 'custbody_rest_total_occ_enty') {

            var checkAmount = currentRecord.getValue({
              fieldId: 'custbody_tele_check_amount'
            });

            if (!isEmpty(checkAmount) && checkAmount > 0) {

              currentRecord.setValue({
                fieldId: 'payment',
                value: checkAmount
              });


              var tax = currentRecord.getValue({
                fieldId: 'custbody_rest_total_occ_enty'
              });

              var remaining = Number(tax) - Number(checkAmount);
              currentRecord.setValue({
                fieldId: 'custbody_balance',
                value: remaining.toFixed(2)
              });
            }
            else {
              currentRecord.setValue({
                fieldId: 'payment',
                value: ''
              });

              currentRecord.setValue({
                fieldId: 'custbody_balance',
                value: ''
              });
            }
          }
          else if(fieldName == "custrecord_pd_amount")
          {
            reCalculateAdditionalLocation(currentRecord, true);
          }
          // else if(fieldName == "custbody_rest_occ_ordinance_tax")
          // {
          //   var occupationTax = Number(currentRecord.getValue('custbody_rest_occ_ordinance_tax'));
          //   var collectionFee = 2/100*occupationTax;
          //   currentRecord.setValue({
          //     fieldId: 'custbody_rest_less_collection_fee',
          //     value: collectionFee.toFixed(2),
          //     ignoreFieldChange: true
          //   });

          //   var occupationDue = Number(occupationTax) - Number(collectionFee);
          //   currentRecord.setValue({
          //     fieldId: 'custbody_rest_oc_due',
          //     value: occupationDue.toFixed(2),
          //     ignoreFieldChange: true
          //   });
          // }
        } catch (e) {
          log.error({
            title: e.name,
            details: e.message,
          });
        }
      }
    }

    function postSourcing(context) {
      debugger;
      var currentRecord = context.currentRecord;
      var fieldName = context.fieldId;
      var customForm = currentRecord.getValue('customform');
      var customerID = currentRecord.getValue('customer');
      var taxPayerID = currentRecord.getValue('custbody_eb_temp_tax_payer_id');
      var businessID = currentRecord.getValue('custbody_rest_tax_bus_id');
      log.debug('customerID : taxPayerID', customerID + " : " + taxPayerID);

      if (customForm == PAYMENTFORMS.RESTAURANT) {
        if (fieldName === 'customer') {
          if (isEmpty(taxPayerID) && !businessID) {
            var rtDetailsJSON = findRestTaxDetails(taxPayerID);
            log.debug('rtDetailsJSON_Customer Post Sourcing', rtDetailsJSON);

            if (!isEmpty(rtDetailsJSON)) {
              var rtBusinessID = rtDetailsJSON.rtBusinessID;
              log.debug('rtBusinessID', rtBusinessID);
              currentRecord.setValue({
                fieldId: 'custbody_rest_tax_bus_id',
                value: rtBusinessID
              });
            }
          }
          else if (taxPayerID && !businessID)
            currentRecord.setValue({
              fieldId: 'custbody_rest_tax_bus_id',
              value: taxPayerID
            });
        }
      }
    }

    function getPaymentDueDate(month, quarter, year, period) {
      var filtersArr = [];
      filtersArr = [
        ["custrecord_tax_type", 'is', BUSINESSTYPE_RESTAURANT],
        'AND',
        ["isinactive", "is", false],
        'AND',
        ["custrecord_fops_payemnt_period", "is", period]
      ]

      var paymentDueDateSearch = search.create({
        type: 'customrecordfops_payments_due_dates',
        filters: filtersArr,
        columns: ['custrecord_fops_due_date', 'internalid', 'custrecord_payment_due_year', 'custrecord_tax_period']
      });

      var tempDueDate, tempYear, tempPeriod = '';
      paymentDueDateSearch.run().each(function (result) {

        tempYear = result.getText('custrecord_payment_due_year');
        tempPeriod = result.getValue('custrecord_tax_period');

        if (tempYear == year && (tempPeriod == month || tempPeriod == quarter))
          tempDueDate = result.getValue('custrecord_fops_due_date');

        return true;
      });
      log.debug('getPaymentDueDate', tempDueDate);

      return tempDueDate;
    }


    function findRestTaxDetails(taxPayerID) {
      var rtDetailsJSON = {};
      var customrecord_restaurant_taxSearchObj = search.create({
        type: "customrecord_restaurant_tax",
        filters:
          [
            ["custrecord_rest_tax_pay_id_num", "is", taxPayerID]
          ],
        columns:
          [
            search.createColumn({ name: "internalid", label: "Internal ID" }),
            search.createColumn({ name: "isinactive" }),
            search.createColumn({ name: "custrecord_rest_cust", label: "Customer" }),
            search.createColumn({ name: "custrecord_rest_tax_pay_id_num", label: "Tax Payer Id Number" })
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

    function percentage(num, per) {
      return (num / 100) * per;
    }

    function getDueDateDifference(tempDueDate) {
      var eomDueDate = endOfMonth(tempDueDate);
      var dueMonths = monthDiff(eomDueDate, new Date());
      return dueMonths
    }

    function getMonthDifference(date1, date2) {
      var months;
      months = (date2.getFullYear() - date1.getFullYear()) * 12;
      months -= date1.getMonth();
      months += date2.getMonth();
    
      if (date2.getDate() < date1.getDate()) {
        months--;
      }
    
      return months;
    }

    function getDueDate(yearParam, monthParam) {
      var now = new Date(yearParam, monthParam - 1, 1);
    }

    function monthDiff(dateFrom, dateTo) {
      return dateTo.getMonth() - dateFrom.getMonth() +
        (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
    }
    function endOfMonth(date) {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
    function getTaxId() {
      var fieldLookUp = search.lookupFields({
        type: 'customrecord_restaurant_tax',
        id: business,
        columns: [
          'custrecord_rest_tax_pay_id_num'
        ]
      });
      return fieldLookUp.custrecord_rest_tax_pay_id_num;
    }

    //GET BUSINESS TAX PERCENTAGE
    function getRatePercantage() {
      var fieldLookUp = search.lookupFields({
        type: 'customrecord_business_tax_rate',
        id: BUSINESSTYPE_RESTAURANT,
        columns: [
          'custrecord35'
        ]
      });
      var ratepercantage = fieldLookUp.custrecord35;

      log.debug({
        title: 'rate',
        details: ratepercantage
      });
      ratepercantage = ratepercantage.replace('%', '');
      return ratepercantage
    }

    function onloadValidationDisable(currentRecord, onload) {

      var Btype = currentRecord.getField("custbody_business_type");
      var Ttype = currentRecord.getField("custbody_transaction_type");
      var month1 = currentRecord.getField("custbody_tax_month");
      var year = currentRecord.getField("custbody_tax_year");
      var custYear = currentRecord.getField("custpage_custom_year_field");
      var amount = currentRecord.getField("custbody_tele_amount_1");
      var quarterly = currentRecord.getField("custbody_quarterly");
      var qutamt = currentRecord.getField("custbody_paymnt_amount1");
      var qutamt2 = currentRecord.getField("custbody_payment_amount2");
      var qutamt3 = currentRecord.getField("custbody_payment_amount3");
      var qutyear = currentRecord.getField("custbody_tax_year");  //removed custbody_hotel_year_tax 
      var taxPayerId = currentRecord.getValue("custbody_tax_payer_id_num");

      var business = currentRecord.getValue({
        fieldId: "custbody_rest_tax_bus_id",
      });
      // alert('business-'+business)
      if (business) {
        //Btype.isDisabled = true;
        Ttype.isDisabled = true;
        var fieldLookUp = search.lookupFields({
          type: "customrecord_restaurant_tax",
          id: business,
          columns: [
            "custrecord_rest_tax_pay_id",
            "custrecord_payment_rest_period",
          ]
        });

        // log.debug("fieldLookUp", JSON.stringify(fieldLookUp));
        var taxnumber = fieldLookUp.custrecord_rest_tax_pay_id;
        var paymentPeriod = fieldLookUp.custrecord_payment_rest_period[0].value;
        log.debug("taxnumber : paymentPeriod", taxnumber + " : " + paymentPeriod);
        currentRecord.setValue({
          fieldId: "custbody_tax_payer_id_num",
          value: taxnumber,
          ignoreFieldChange: true,
        });

        currentRecord.setValue({
          fieldId: "custbody_paymentperiod",
          value: paymentPeriod,
          ignoreFieldChange: true,
        });


        if (paymentPeriod == "1") {
          //monthly
          quarterly.isDisabled = true;
          qutamt.isDisabled = true;
          qutamt2.isDisabled = true;
          qutamt3.isDisabled = true;
          qutyear.isDisabled = true;

          month1.isDisabled = false;
          year.isDisabled = false;
          custYear.isDisabled = false;
          amount.isDisabled = false;
        } else {
          // quarterly
          month1.isDisabled = true;
          year.isDisabled = true;
          amount.isDisabled = true;

          quarterly.isDisabled = false;
          custYear.isDisabled = false;
          qutamt.isDisabled = false;
          qutamt2.isDisabled = false;
          qutamt3.isDisabled = false;
          qutyear.isDisabled = false;
        }

      } else {
        // alert('else')
        Btype.isDisabled = true;
        Ttype.isDisabled = true;
        if (!taxPayerId)
          currentRecord.setValue({
            fieldId: "custbody_tax_payer_id_num",
            value: "",
            ignoreFieldChange: true,
          });

        quarterly.isDisabled = true;
        qutamt.isDisabled = true;
        qutamt2.isDisabled = true;
        qutamt3.isDisabled = true;
        qutyear.isDisabled = true;
        month1.isDisabled = true;
        year.isDisabled = true;
        custYear.isDisabled = true;
        amount.isDisabled = true;
        if (onload == 'create') {

          currentRecord.setValue({
            fieldId: "custbody_business_type",
            value: 2,
            ignoreFieldChange: true,
          });
          currentRecord.setValue({
            fieldId: "custbody_transaction_type",
            value: 1,
            ignoreFieldChange: true,
          });
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

    function validateLine(context) {
      var currentRecord = context.currentRecord;
      var formId = currentRecord.getValue('customform');
      //RUN ONLY FOR RESTAURANT FORM
      if (formId != PAYMENTFORMS.RESTAURANT)
        return;

      var sublistId = context.sublistId;

      if (sublistId == "recmachcustrecord_pd_customer_payment_link") {

        var totalAmount = 0, lineAmount = 0;
        var lineCount = currentRecord.getLineCount(sublistId);
        var currentLineIndex = currentRecord.getCurrentSublistIndex({
          sublistId: sublistId
        });


        if (lineCount == currentLineIndex)
          totalAmount = currentRecord.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: "custrecord_pd_amount"
          });

        for (var ln = 0; ln < lineCount; ln++) {
          lineAmount = currentRecord.getSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord_pd_amount',
            line: ln
          });

          totalAmount = Number(totalAmount) + Number(lineAmount);
        }

        // Update the header custom amount field.
        if (totalAmount != 0)
          currentRecord.setValue({
            fieldId: 'custbody_rest_total_rev_add_loc',
            value: Number(totalAmount).toFixed(2),
            ignoreFieldChange: false
          });
      }
      return true;
    }

    //THIS FUNCTION WILL RECALCULLATE THE ADDITONAL LOCATION AMOUNT
    function reCalculateAdditionalLocation(currentRecord, isFieldChange){

      var sublistID = 'recmachcustrecord_pd_customer_payment_link'
      var totalAmount = 0, lineAmount = 0;
      var lineCount = currentRecord.getLineCount(sublistID);
      var currentLineIndex = currentRecord.getCurrentSublistIndex({
        sublistId: sublistID
      });

      if (lineCount == currentLineIndex)
        totalAmount = currentRecord.getCurrentSublistValue({
        sublistId: sublistID,
        fieldId: "custrecord_pd_amount"
        });

      for (var ln = 0; ln < lineCount; ln++) {

        if(ln == currentLineIndex && isFieldChange)
        {
          lineAmount = currentRecord.getCurrentSublistValue({
            sublistId: sublistID,
            fieldId: "custrecord_pd_amount"
            });
        }
        else
          lineAmount = currentRecord.getSublistValue({
            sublistId: sublistID,
            fieldId: 'custrecord_pd_amount',
            line: ln
          });

        totalAmount = Number(totalAmount) + Number(lineAmount);
      }

        // Update the header custom amount field.
        if (totalAmount != 0)
          currentRecord.setValue({
            fieldId: 'custbody_rest_total_rev_add_loc',
            value: Number(totalAmount).toFixed(2),
            ignoreFieldChange: false
          });

    }

    function getBusinessTaxPercentage()
    {
      var filtersArr = [];
      filtersArr = [
        ["custrecord34", 'is', 1],
        'AND',
        ["isinactive", "is", false]
      ]

      var paymentDueDateSearch = search.create({
        type: 'customrecord_business_tax_rate',
        filters: filtersArr,
        columns: ['custrecord35', 'custrecord36', 'custrecord37', 'custrecord_conveniencefee', 'custrecord_fops_business_rate_coll_fee']
      });

      var returnTaxData = {};
      paymentDueDateSearch.run().each(function (result) {
        returnTaxData['businesstax'] = removePercentSign(result.getValue('custrecord35'));
        returnTaxData['interestrate'] = removePercentSign(result.getValue('custrecord36'));
        returnTaxData['penalty'] = removePercentSign(result.getValue('custrecord37'));
        returnTaxData['conveniencefee'] = removePercentSign(result.getValue('custrecord_conveniencefee'));
        returnTaxData['collectionfee'] = removePercentSign(result.getValue('custrecord_fops_business_rate_coll_fee'));
        return false;
      });

      log.debug('getBusinessTaxPercentage', JSON.stringify(returnTaxData));
      return returnTaxData;
    }

    function removePercentSign(tempRate){
      if(tempRate){
        tempRate = tempRate.replace('%', '');
        tempRate = Number(tempRate);
      }
      else
        tempRate = 0;

      return tempRate;
    }

    exports.pageInit = pageInit;
    exports.fieldChanged = fieldChanged;
    exports.postSourcing = postSourcing;
    //exports.validateLine = validateLine;
    return exports;
  });