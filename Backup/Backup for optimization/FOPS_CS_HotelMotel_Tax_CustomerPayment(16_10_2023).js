/**
* @NApiVersion 2.x
* @NModuleScope Public
* @NScriptType ClientScript
*/

/************************************************************************
* File Name : FOPS_CS_HotelMotel_Tax_CustomerPayment.js
* Date      :
* Purpose   : This script will Payment Hotel/Motal Tax Calculation 
*
* History
* Date          Author                Details
* 24-07-2023    Faizan Siddiki        Initial Version
***********************************************************************/

define(["N/record", "N/search", "N/runtime", "N/ui/dialog", "N/format", "N/https"],
  function (record, search, runtime, dialog, format, https) {

    var PAYMENTFORMS = {
      'TELEPHONE': '203',
      'TOBACCO': '212',
      'RESTAURANT': '193',
      'HOTEL': '220'
    };

    var BUSINESSOBJECT = {};
    

    var CLASS_HOTEL = 15;
    var DEPARTMENT_HOTEL = 106;
    var FILECONSTANT = {
      RECORD:{
        TAX_RECORDID : 'customrecord_hotel_motel_tax',
        FIELD_PAYERID : 'custrecord_hotel_taxpayer_id',
        FIELD_PERIOD :'custrecord_hotel_payment_period',
        FIELD_BALANCE: 'custrecord_hotel_balance_to_be_paid'
      },
      BE_SEARCH_SUITELET_ID: 'customscript_fops_bs_search_reuslts',
      BE_SEARCH_SUITELET_DEPLOYMENT_ID: 'customdeploy_fops_bs_search_reuslts',
      PERIOD : {
        MONTHLY: 1,
        QUARTERLY: 2
      },
      MESSAGE: {
        DUPLICATE_LOCATION: "Please select unique location.",
        DUEDATE: "Please enter valid Tax Period (Year/Quarter/Month) and make sure Due Date populated.",
        ADDLOCATION: 'Total Revenue for Additional Locations and the total of Amount on line level below (Additional Business Location tab) does not match. Please correct and submit again.',
        PAYMENTEXIST: 'Payment already submitted for the selected Tax period.',
        INACTIVEBUSINESS: 'Tax Payer ID associated with an Inactivate Business.',
        ID_EXIST: "Tax Payer ID doesn't exist. Please enter an existing Tax Payer ID.",
        ID_FORMAT: 'Please Enter a Valid Tax Payer ID Format. XX-XXXXXXX',
        YEARPERIOD: 'Please select valid Tax Year and Period first.',
        INSUFF_PERMISSION: "You do not have sufficient permission to change this record. Please contact with Administrator",
        VALIDATE_ADDLOCATION:"Please provide Location and Amount on line level.",
        ADDLOCATION_HELP:'* Please use the "Additional Business Location" tab at the bottom to add the revenue for the selected Tax Period.',
        PREVIOUSBALANCE: "Please provide Revenue details before applying previous balance.",
        MAILIN_PAYSTATUS: "Payment status for Mailin transaction should either be Processed or Declined.",
        RESTRICT_LINEEDIT : "You are not allowed to make any financial changes on existing Payments.",
        LESSTHAN_BUSINESSOPEN : 'Invalid Tax Period. Please select the period after Business Open Date ',
        EXIST_ZEROPAYMENT : "There is a zero payment record already exist for the selected payment period. Please delete the record before submitting another payment"
        
      }
    };

    var BUSINESSTYPE_HOTEL = 4;
    var exports = {};
    var TRANS_TYPE = {
      MAIL: "1",
      ONLINE: "2"
    };

    //pageInit
    function pageInit(context) {
      debugger;
      var currentRecord = context.currentRecord;
      var formType = currentRecord.getValue({
        fieldId: "customform",
      });
    }

    //fieldChanged
    function FOPSHMfieldChanged(context) {
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
          var taxPayerID = currentRecord.getValue('custbody_tax_payer_id_num');

          //RUN ONLY FOR RESTAURANT FORM
          if (formid != PAYMENTFORMS.HOTEL)
            return;

          var fieldVal = currentRecord.getValue(fieldName);
          console.log("Tobacco Form Script Triggered");

          //NETSFOPS-174 : VALIDATE VALUE CHANGE FOR PAYMENT STATUS
          if (fieldName == 'custbody_fops_payment_status') {

            var paymentStatus = currentRecord.getValue('custbody_fops_payment_status');
            if(["2","4"].indexOf(paymentStatus) == -1){
              var option = {
                title: "Insufficient Permission",
                message: FILECONSTANT.MESSAGE.MAILIN_PAYSTATUS,
              };
              dialog.alert(option);
              
              currentRecord.setValue({
                fieldId: 'custbody_fops_payment_status',
                value: '',
                ignoreFieldChange: true
              });
              return false;
            }
          }

          if (fieldName == "custbody_hotel_busniess_name_id") {

            if (department == DEPARTMENT_HOTEL && deptClass == CLASS_HOTEL) {
              onloadValidationDisable(currentRecord, 'change')

              var Btype = currentRecord.getField('custbody_business_type');
              var Ttype = currentRecord.getField('custbody_transaction_type');
              var business = currentRecord.getValue("custbody_hotel_busniess_name_id");
              if (business) {

                Btype.isDisabled = true;
                Ttype.isDisabled = true;
                currentRecord.setValue({ fieldId: "custbody_transaction_type", value: 1 });
                currentRecord.setValue({ fieldId: "custbody_fops_payment_status", value: 2 });

                //UPDATE CUSTOM LOCATION FIELD DROPDOWN
                //updateSelectOptions(business, currentRecord);
              } 
              else {
                Btype.isDisabled = false;
                Ttype.isDisabled = false;
                //updateSelectOptions(business, currentRecord);
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

              var rtDetailsJSON = findTaxDetails(taxPayerID);
              log.debug('rtDetailsJSON', rtDetailsJSON);

              if (!isEmpty(rtDetailsJSON)) {
                var rtInactive = rtDetailsJSON.rtInactive;
                if (rtInactive) {
                  var options = {
                    title: 'Inactive Business ID',
                    message: FILECONSTANT.MESSAGE.INACTIVEBUSINESS
                  };

                  dialog.alert(options);
                  return false;
                }
                else 
                {
                  var rtBusinessID = rtDetailsJSON.rtBusinessID;
                  var rtCustomerID = rtDetailsJSON.rtCustomerID;
                  var rtBalance = rtDetailsJSON.rtBalance;
                  var rtBusiName = rtDetailsJSON.rtBusinessName;
                  log.debug('rtBusinessID : rtCustomerID', rtBusinessID + " : " + rtCustomerID+'   rtBalance : '+rtBalance+'  rtBusiName : '+rtBusiName);

                  currentRecord.setValue({
                    fieldId: 'customer',
                    value: rtCustomerID
                  });

                  currentRecord.setValue({
                    fieldId: 'custbody_eb_total_balance_to_be_paid',
                    value: rtBalance
                  });

                  currentRecord.setValue({
                    fieldId: 'custbody_eb_temp_tax_payer_id',
                    value: rtBusinessID
                  });

                  currentRecord.setValue({
                    fieldId: 'custbody_omh_business_name_text',
                    value: rtBusiName
                  });                  
                }
              }

              if (isEmpty(rtDetailsJSON)) {
                var options = {
                  title: 'Invalid Tax Payer ID',
                  message: FILECONSTANT.MESSAGE.ID_EXIST
                };

                dialog.alert(options);
                return false;
              }
            }
            else {
              var options = {
                title: 'Tax Payer ID ',
                message: FILECONSTANT.MESSAGE.ID_FORMAT
              };

              dialog.alert(options);
              return false;
            }
          }
          if (fieldName === 'custbody_prevbalance') {

            var newBusiness = currentRecord.getValue({
              fieldId: 'custbody_hotel_busniess_name_id'
            });

            var check = currentRecord.getValue({
              fieldId: 'custbody_prevbalance'
            });

            var occupationTaxDue = currentRecord.getValue({ 
              fieldId: 'custbody_rest_oc_due'
            });

            if (check && occupationTaxDue) {
              var oldBal = currentRecord.getValue('custbody_eb_total_balance_to_be_paid');
              if(!oldBal){
                var oldBal = search.lookupFields({
                  type: FILECONSTANT.RECORD.TAX_RECORDID,
                  id: newBusiness,
                  columns: 'custrecord_hotel_balance_to_be_paid'
                });  
                oldBal = oldBal.custrecord_hotel_balance_to_be_paid;
              }
              
              var oldTax = currentRecord.getValue({
                fieldId: 'custbody_rest_total_occ_enty'
              });

              var newTax = Number(oldBal) + Number(oldTax)

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
                value: oldTax.toFixed(2),
                ignoreFieldChange: true
              });
            } else if(check && !occupationTaxDue) {
              
              var option = {
                title: "Validation",
                message: FILECONSTANT.MESSAGE.PREVIOUSBALANCE,
              };
              dialog.alert(option);

              currentRecord.setValue({
                fieldId: fieldName,
                value: false,
                ignoreFieldChange: true
              });
              return false;
            }
            else {

              var newTax = currentRecord.getValue({
                fieldId: 'custbodytax_tele'
              });

              currentRecord.setValue({
                fieldId: 'custbody_rest_total_occ_enty',
                value: newTax.toFixed(2)

              });
            }
          }

          if (fieldName === 'custbody_omh_waive_off_late_fee') {
            retriggerTaxCalculation(currentRecord);
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


            var paymentYearText = currentRecord.getText("custpage_custom_year_field");
            var paymentMonthText = currentRecord.getText("custbody_tax_month");
            var paymentMonth = currentRecord.getValue("custbody_tax_month");
            var paymentQuarterlyText = currentRecord.getText("custbody_quarterly");
            var paymentQuarterly = currentRecord.getValue("custbody_quarterly");
            var paymentPeriod = currentRecord.getValue("custbody_paymentperiod");

            console.log('DUE DATE Logic :   paymentYearText:  ' + paymentYearText + '  paymentMonthText: ' + paymentMonthText + '    paymentQuarterlyText : ' + paymentQuarterlyText)
            if (paymentYearText && (paymentMonthText || paymentQuarterlyText)) {

              var dueDate = getPaymentDueDate(paymentMonthText, paymentQuarterlyText, paymentYearText, paymentPeriod);
              if (dueDate){
                var isValidOpen = validateBusinessOpenDate(new Date(BUSINESSOBJECT.rtOpenDate),paymentYearText, paymentMonth, paymentQuarterly);
                if(isValidOpen)
                {
                  dialog.alert({ 'title': 'Restricted', 'message': FILECONSTANT.MESSAGE.LESSTHAN_BUSINESSOPEN + BUSINESSOBJECT.rtOpenDate });
                  return false;
                }

                currentRecord.setValue({
                  fieldId: "custbody_payment_due_date",
                  value: new Date(dueDate),
                  ignoreFieldChange: true
                });                
              }
              else{

                currentRecord.setValue({
                  fieldId: "custbody_payment_due_date",
                  value: ''
                });

                var option = {
                  title: "Validation",
                  message: FILECONSTANT.MESSAGE.DUEDATE,
                };
                dialog.alert(option);
                return false;
              }

                            
              //VALIDATE EXISTING PAYMENT
              var paymentYear = currentRecord.getValue('custpage_custom_year_field');
              var paymentMonth = currentRecord.getValue('custbody_tax_month');
              var paymentQuarter = currentRecord.getValue('custbody_quarterly');
              var businessID = currentRecord.getValue('custbody_hotel_busniess_name_id');

              //GET TARGET MONTHS AND QUARTERS
              var targetQuarter = [];
              var targetMonth = [];
              if(paymentMonth)
              {
                targetQuarter = getQuarter(paymentMonth);
                targetMonth.push(Number(paymentMonth));
              }
              else if(paymentQuarter)
              {
                targetQuarter = Number(paymentQuarter);
                targetMonth = getMonthsInQuarter(paymentQuarter);
              }

              //VALIDATE EXISTING PAYMENT
              var searchPayment = getCustomerPayments(businessID, paymentYear);
              console.log('searchPayment : ' + JSON.stringify(searchPayment));
          
              if(searchPayment.length > 0)
              {
                var isPaymentExist = validateExistingPayments(searchPayment, targetMonth, Number(targetQuarter));
                console.log('isPaymentExist : ' + isPaymentExist);
                if(isPaymentExist)
                {
               
                  dialog.alert({ 'title': 'Payment Exist', 'message': FILECONSTANT.MESSAGE.PAYMENTEXIST });
                  currentRecord.setValue({
                    fieldId: 'custbody_payment_due_date',
                    value: '',
                    ignoreFieldChange: true
                  });

                  currentRecord.setValue({
                    fieldId: fieldName,
                    value: '',
                    ignoreFieldChange: true
                  });

                  if(fieldName == 'custbody_tax_year' || fieldName == 'custpage_custom_year_field')
                  {
                    currentRecord.setValue({
                      fieldId: 'custbody_tax_year',
                      value: '',
                      ignoreFieldChange: true
                    });
  
                    currentRecord.setValue({
                      fieldId: 'custpage_custom_year_field',
                      value: '',
                      ignoreFieldChange: true
                    });
                  }                  
                  return false;
                }
              }

              //VALIDATE EXISTING ZERO PAYMENT
              var searchZeroPayment = getZeroPayments(businessID, paymentYear);
              console.log('searchZeroPayment : ' + JSON.stringify(searchZeroPayment));

              if (searchZeroPayment.length > 0) {
                var isPaymentExist = validateExistingPayments(searchZeroPayment, Number(targetMonth), Number(targetQuarter));
                if(isPaymentExist)
                {
                  dialog.alert({ 'title': 'Payment Exist', 'message': FILECONSTANT.MESSAGE.EXIST_ZEROPAYMENT });
                  currentRecord.setValue({
                    fieldId: fieldName,
                    value: '',
                    ignoreFieldChange: true
                  });
  
                  if(fieldName == "custbody_tax_year" || fieldName == "custpage_custom_year_field"){
                    currentRecord.setValue({
                      fieldId: 'custbody_tax_year',
                      value: '',
                      ignoreFieldChange: true
                    });
                    currentRecord.setValue({
                      fieldId: 'custpage_custom_year_field',
                      value: '',
                      ignoreFieldChange: true
                    });
                  }
  
                  return false;
                }
              }

              //RETRIGGER CALCULATION
              retriggerTaxCalculation(currentRecord);
            }
          }


          //POPULATE TOTAL REVENUE
          else if (fieldName == "custbody_oma_rest_adj_revenue" ||
            fieldName == "custbody_oma_rest_total_revenue" ||
            fieldName == 'custbody_hotel_revenue_notsujt_tax') {

            debugger;
            //var totalRevRec = currentRecord.getValue('custbody_rest_net_sub_tax');
            var paymentYearText = currentRecord.getText("custbody_tax_year");
            if(!paymentYearText){
              paymentYearText = currentRecord.getText("custpage_custom_year_field");
              var paymentYear = currentRecord.getValue("custpage_custom_year_field");
              if(paymentYear)
                currentRecord.setValue({
                  fieldId: "custbody_tax_year",
                  value: paymentYear,
                  ignoreFieldChange: true
                });
            }
            var paymentMonthText = currentRecord.getText("custbody_tax_month");
            var paymentQuarterlyText = currentRecord.getText("custbody_quarterly");
            var paymentPeriod = currentRecord.getValue('custbody_paymentperiod');
            var dueDate = currentRecord.getValue('custbody_payment_due_date');
            var adjusToRevenue = currentRecord.getValue('custbody_oma_rest_adj_revenue');
            var totalRevenue = currentRecord.getValue('custbody_oma_rest_total_revenue');
            var revNotSubjected = currentRecord.getValue('custbody_hotel_revenue_notsujt_tax');
            log.debug('GET', ' TOTAL REVENUE RECIEVE :' + totalRevRec+ '     revNotSubjected : '+revNotSubjected);
            
            if (!dueDate && ((paymentYearText && paymentMonthText) || (paymentYearText && paymentQuarterlyText))) {
              currentRecord.setValue({
                fieldId: fieldName,
                value: '',
                ignoreFieldChange: true
              });

              var option = {
                title: "Validation",
                message: FILECONSTANT.MESSAGE.DUEDATE,
              };
              dialog.alert(option);
              return false;
            }

            if ((!paymentYearText) || (paymentPeriod == FILECONSTANT.PERIOD.QUARTERLY && !paymentQuarterlyText)
                || (paymentPeriod == FILECONSTANT.PERIOD.MONTHLY && !paymentMonthText)) {

              var option = {
                title: "Validation",
                message: FILECONSTANT.MESSAGE.YEARPERIOD,
              };
              dialog.alert(option);

              currentRecord.setValue({
                fieldId: fieldName,
                value: '',
                ignoreFieldChange: true
              });
              return false;
            }

            totalRevValues = Number(adjusToRevenue) + Number(totalRevenue) - Number(revNotSubjected);
            log.debug('TOTAL', ' TOTAL BOTH REVENUE VALUE :' + totalRevValues);

            currentRecord.setValue({
              fieldId: 'custbody_rest_net_revenue_cur_month',
              value: totalRevValues.toFixed(2),
              ignoreFieldChange: false
            });

            //NETSFOPS-171 : UPDATE HIDDEN FIELD FOR SCA 
            var netRevToTax = Number(totalRevenue);
            currentRecord.setValue({
              fieldId: 'custbody_rest_net_sub_tax',
              value: netRevToTax.toFixed(2),
              ignoreFieldChange: true
            });
          }
          else if (fieldName == "custbody_rest_net_revenue_cur_month") {
            var totalRevRec = Number(currentRecord.getValue('custbody_rest_net_revenue_cur_month'));
            var occTaxDue = Number(currentRecord.getValue('custbody_rest_oc_due'));
            var taxCalculation = 0;
            var taxMonth = currentRecord.getValue('custbody_tax_month');
            var taxYear = currentRecord.getValue('custbody_tax_year');
            if(!taxYear){
              taxYear = currentRecord.getValue('custpage_custom_year_field');
              if(taxYear)
                currentRecord.setValue({
                  fieldId: 'custbody_tax_year',
                  value: taxYear,
                  ignoreFieldChange: true
                });
            }
             

            var taxQuarter = currentRecord.getValue('custbody_quarterly');
            var dueDate = currentRecord.getValue('custbody_payment_due_date');

            //GET DIFF BETWEEN DUE DATE & TODAY
            //var dueDate = getDueDate(taxYear, taxMonth);
            var latefee = 0;
            if (dueDate) {
              dueDate = format.parse({
                value: dueDate,
                type: format.Type.DATE
              });
              //var dueDateDiff = getDueDateDifference(dueDate);

              //GET ALL RESTAURANT TAX RATES
              var BUSINESSTAX_OBJ = getBusinessTaxPercentage(BUSINESSTYPE_HOTEL);
              var ratepercantage = BUSINESSTAX_OBJ.businesstax;
              var rate = ratepercantage ? ratepercantage : 2.5;
              taxCalculation = percentage(totalRevRec, rate);

              currentRecord.setValue({
                fieldId: 'custbody_rest_occ_ordinance_tax',
                value: taxCalculation.toFixed(2),
                ignoreFieldChange: true
              });

              var lessCollFeeRate = BUSINESSTAX_OBJ.collectionfee ? BUSINESSTAX_OBJ.collectionfee : 2;
              var collectionFee = percentage(taxCalculation, lessCollFeeRate);
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

              //NETSFOPS-164
              var todayDate = new Date();
              todayDate.setHours(0,0,0,0);
              dueDate.setHours(0,0,0,0);

              //WAIVE OFF PENALTY & LATE FEE IF FLAG IS TRUE
              var waiveOffPenalty = currentRecord.getValue('custbody_omh_waive_off_late_fee');
              if (dueDate.getTime() < todayDate.getTime() && !waiveOffPenalty) {
                var dueDateDiff = getDueDateMonthDiff(dueDate);

                //INTEREST CALCULATION
                var interestRate = BUSINESSTAX_OBJ.interestrate;
                var interestAmount = percentage(restOccupationDue, interestRate);
                var interestTotal = (interestAmount * dueDateDiff).toFixed(2);

                //PENALTY CALCULATION
                var interestPlusOccAmount = parseFloat(interestTotal) + parseFloat(restOccupationDue);
                var penaltyAmount = percentage(interestPlusOccAmount, BUSINESSTAX_OBJ.penalty).toFixed(2);
                currentRecord.setValue({
                  fieldId: "custbody_rest_penalty",
                  value: penaltyAmount
                });

                currentRecord.setValue({
                  fieldId: "custbody_rest_interest_tax",
                  value: interestTotal
                });

                latefee = parseFloat(penaltyAmount) + parseFloat(interestTotal);
                currentRecord.setValue({
                  fieldId: "custbody_oma_rest_total_pen_int",
                  value: latefee.toFixed(2)
                });
              }

              //ZERO OUT PENALTY & LATE FEE IF FLAG IS TRUE 
              if(waiveOffPenalty || dueDate.getTime() >= todayDate.getTime()){
                currentRecord.setValue({
                  fieldId: "custbody_rest_penalty",
                  value: 0
                });
                currentRecord.setValue({
                  fieldId: "custbody_rest_interest_tax",
                  value: 0
                });
                currentRecord.setValue({
                  fieldId: "custbody_oma_rest_total_pen_int",
                  value: 0
                });
              }
              var totaldue = (parseFloat(latefee) + parseFloat(restOccupationDue)).toFixed(2);
              var hiddenOldTotalDue = totaldue;//NETSFOPS-166              
              var isPreviousApplied = currentRecord.getValue('custbody_prevbalance');
              if(isPreviousApplied){
                var oldBalance = Number(currentRecord.getValue('custbody_eb_total_balance_to_be_paid'));
                totaldue = (Number(totaldue) + oldBalance);
              }

              currentRecord.setValue({
                fieldId: "custbody_rest_total_occ_enty",
                value: Number(totaldue).toFixed(2)
              });

              currentRecord.setValue({
                fieldId: 'custbodytax_tele',
                value: hiddenOldTotalDue,
                ignoreFieldChange: true
              });
            }
            else if ((taxMonth && taxYear) || (taxQuarter && taxYear)) {
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
                value: checkAmount,
                ignoreFieldChange:false
              });


              var tax = currentRecord.getValue({
                fieldId: 'custbody_rest_total_occ_enty'
              });

              var remaining = Number(tax) - Number(checkAmount);
              currentRecord.setValue({
                fieldId: 'custbody_balance',
                value: remaining.toFixed(2),
                ignoreFieldChange:true
              });
            }
            else {
              currentRecord.setValue({
                fieldId: 'payment',
                value: '',
                ignoreFieldChange:false
              });

              currentRecord.setValue({
                fieldId: 'custbody_balance',
                value: '',
                ignoreFieldChange:true
              });
            }
          }
          else if (fieldName == "custrecord_tobc_location_amount") {
            //reCalculateAdditionalLocation(currentRecord, true);
          }
          else if (fieldName == "custrecord_tobc_payment_location") {
            var sublistID = 'recmachcustrecord_tobc_location_custmer_payment'
            var lineCount = currentRecord.getLineCount(sublistID);
            var currentLineIndex = currentRecord.getCurrentSublistIndex({
              sublistId: sublistID
            });

            var lineAddLoc = '';
            var isDuplicate = false;

            var selectedAddLoc = currentRecord.getCurrentSublistValue({
              sublistId: sublistID,
              fieldId: fieldName
            });

            for (var ln = 0; ln < lineCount; ln++) {
              lineAddLoc = currentRecord.getSublistValue({
                sublistId: sublistID,
                fieldId: fieldName,
                line: ln
              });

              if (lineAddLoc == selectedAddLoc && lineAddLoc &&currentLineIndex != ln)
                isDuplicate = true;
            }

            if (isDuplicate) {
              currentRecord.setCurrentSublistValue({
                sublistId: sublistID,
                fieldId: fieldName,
                value: '',
                ignoreFieldChange: false
              });

              var option = {
                title: "Validation",
                message: FILECONSTANT.MESSAGE.DUPLICATE_LOCATION,
              };
              dialog.alert(option);
              return false;

            }
          }
        }
        catch (e) {
          log.error({
            title: e.name,
            details: e.message,
          });
        }
      }
    }

    //CHECK BUSINESS OPEN DATE
    function validateBusinessOpenDate(tempBusiOpDate,tempPayYear, tempPayMonth, tempPayQuarter)
    {
      var returnStatus = false;
      var busiOpnYear = tempBusiOpDate.getFullYear();
      var busiOpnMonth = tempBusiOpDate.getMonth()+1;
      console.log('Saved Record :  tempBusiOpDate : '+tempBusiOpDate+'  busiOpnYear : '+busiOpnYear+'  busiOpnMonth : '+busiOpnMonth);
      
      if(Number(tempPayYear) < busiOpnYear){
        returnStatus = true;
      }
      else if(tempPayQuarter && Number(tempPayYear) == busiOpnYear){

        var busiOpnQuarter =  Math.floor((tempBusiOpDate.getMonth() + 3) / 3);
        if(busiOpnQuarter > Number(tempPayQuarter)){
          returnStatus = true;
        }
      }
      else if(tempPayMonth && Number(tempPayYear) == busiOpnYear){
        if(Number(tempPayMonth) < busiOpnMonth){
          returnStatus = true;
        }
      }
      return returnStatus;
    }

    function FOPSHMpostSourcing(context) {
      debugger;
      var currentRecord = context.currentRecord;
      var fieldName = context.fieldId;
      var customForm = currentRecord.getValue('customform');
      var customerID = currentRecord.getValue('customer');
      var taxPayerID = currentRecord.getValue('custbody_eb_temp_tax_payer_id');            
      var businessID = currentRecord.getValue('custbody_hotel_busniess_name_id');
      log.debug('customerID : taxPayerID', customerID + " : " + taxPayerID);

      if (customForm == PAYMENTFORMS.HOTEL) {

        if (fieldName === 'customer') {
          if (taxPayerID && !businessID) {
            if(!BUSINESSOBJECT.rtBusinessID)
                BUSINESSOBJECT = findTaxDetails(taxPayerID);
            log.debug('BUSINESSOBJECT  Customer Post Sourcing', BUSINESSOBJECT);

            if (!isEmpty(BUSINESSOBJECT)) {
              var rtBusinessID = BUSINESSOBJECT.rtBusinessID;
              log.debug('rtBusinessID', rtBusinessID);
              currentRecord.setValue({
                fieldId: 'custbody_hotel_busniess_name_id',
                value: rtBusinessID
              });

              var rtBalance = BUSINESSOBJECT.rtBalance;
              currentRecord.setValue({
                fieldId: 'custbody_eb_total_balance_to_be_paid',
                value: rtBalance,              
                ignoreFieldChange: false
              });
            }
          }
          else if (taxPayerID && !businessID)
            currentRecord.setValue({
              fieldId: 'custbody_hotel_busniess_name_id',
              value: taxPayerID
            });
        }
      }
    }

    function getPaymentDueDate(month, quarter, year, period) {

      if(quarter)
        quarter = quarter.replace(/-|\s/g,"");

      var filtersArr = [];
      filtersArr = [
        ["custrecord_tax_type", 'is', BUSINESSTYPE_HOTEL],
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
        if(tempPeriod)
          tempPeriod = tempPeriod.replace(/-|\s/g,"");

        if (tempYear == year && (tempPeriod == month || tempPeriod == quarter))
          tempDueDate = result.getValue('custrecord_fops_due_date');

        return true;
      });
      log.debug('getPaymentDueDate', tempDueDate);

      return tempDueDate;
    }

    //VALIDATE HOTEL TAX
    function findTaxDetails(taxPayerID) {
      var rtDetailsJSON = {};
      var customrecord_taxSearchObj = search.create({
        type: FILECONSTANT.RECORD.TAX_RECORDID,
        filters:
          [
            [FILECONSTANT.RECORD.FIELD_PAYERID, "is", taxPayerID],
            'AND',
            ["isinactive", "is", false]
          ],
        columns:
          [
            search.createColumn({ name: "internalid", label: "Internal ID" }),
            search.createColumn({ name: "isinactive" }),
            search.createColumn({ name: "custrecord_hotel_mail_bussines_open_date" }),
            search.createColumn({ name: "custrecord_hotel_customer", label: "Customer" }),
            search.createColumn({ name: FILECONSTANT.RECORD.FIELD_PAYERID, label: "Tax Payer Id Number" }),
            search.createColumn({ name: FILECONSTANT.RECORD.FIELD_BALANCE}),
            search.createColumn({ name: "name"})
          ]
      });

      var restTaxResults = customrecord_taxSearchObj.run().getRange({ start: 0, end: 1000 });
      log.debug('restTaxResults', restTaxResults);

      if (restTaxResults != null && restTaxResults.length > 0) {
        var rtBusinessID = restTaxResults[0].getValue({ name: 'internalid' });
        var rtCustomerID = restTaxResults[0].getValue({ name: 'custrecord_hotel_customer' });
        var rtInactive = restTaxResults[0].getValue({ name: 'isinactive' });
        var rtOpenDate = restTaxResults[0].getValue({ name: 'custrecord_hotel_mail_bussines_open_date' });
        log.debug('rtBusinessID : rtCustomerID', rtBusinessID + " : " + rtCustomerID);
        rtDetailsJSON.rtBusinessName = restTaxResults[0].getValue('name');
        rtDetailsJSON.rtBusinessID = rtBusinessID;
        rtDetailsJSON.rtCustomerID = rtCustomerID;
        rtDetailsJSON.rtInactive = rtInactive;
        rtDetailsJSON.rtOpenDate = rtOpenDate;
        rtDetailsJSON.rtBalance = restTaxResults[0].getValue({ name: FILECONSTANT.RECORD.FIELD_BALANCE });
        log.debug('rtDetailsJSON', JSON.stringify(rtDetailsJSON));

        BUSINESSOBJECT = rtDetailsJSON;
        return rtDetailsJSON;
      }
      return null;
    }

    function taxNumberFormat(e) {
      var key = e.charCode || e.keyCode || 0;
      var text = jQuery(e.currentTarget);
      if (key !== 8 && key !== 9) {
          if (text.val() && text.val().length === 2) {
              text.val(text.val() + '-');
          }
      }
      return (key == 8 || key == 9 || key == 46 || (key >= 48 && key <= 57) || (key >= 96 && key <= 105));
    }

    function updateSelectOptions(business, currentRecord) {
      if (business) {
        var lineC = currentRecord.getLineCount('recmachcustrecord_tobc_location_custmer_payment');
        if (lineC < 1) {
          currentRecord.selectNewLine({
            sublistId: 'recmachcustrecord_tobc_location_custmer_payment'
          });
          currentRecord.setCurrentSublistValue({
            sublistId: 'recmachcustrecord_tobc_location_custmer_payment',
            fieldId: 'custrecord_tobc_location_business_name',
            value: business,
            ignoreFieldChange: false,
            forceSyncSourcing: true
          });
        }
      }
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
        months++;
      }

      return months;
    }

    function getDueDate(yearParam, monthParam) {
      var now = new Date(yearParam, monthParam - 1, 1);
    }

    function monthDiff(dateFrom, dateTo) {
      return dateTo.getMonth() - dateFrom.getMonth() +
        (12 * (dateTo.getFullYear() - dateFrom.getFullYear()));
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

    function onloadValidationDisable(currentRecord, onload) {

      if(onload == 'edit')
        return;

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

      //BLANK OUT THE PERIOD FIELDS
      currentRecord.setValue({
        fieldId: 'custbody_quarterly',
        value: '',
        ignoreFieldChange: true
      });

      currentRecord.setValue({
        fieldId: 'custbody_tax_year',
        value: '',
        ignoreFieldChange: true
      });

      currentRecord.setValue({
        fieldId: 'custbody_tax_month',
        value: '',
        ignoreFieldChange: true
      });

      currentRecord.setValue({
        fieldId: 'custpage_custom_year_field',
        value: '',
        ignoreFieldChange: true
      });

      var business = currentRecord.getValue("custbody_hotel_busniess_name_id");

      if (business) {
        Btype.isDisabled = true;
        Ttype.isDisabled = true;
        var fieldLookUp = search.lookupFields({
          type: FILECONSTANT.RECORD.TAX_RECORDID,
          id: business,
          columns: [
            FILECONSTANT.RECORD.FIELD_PAYERID,
            FILECONSTANT.RECORD.FIELD_PERIOD,
            FILECONSTANT.RECORD.FIELD_BALANCE
          ]
        });

        // log.debug("fieldLookUp", JSON.stringify(fieldLookUp));
        var taxnumber = fieldLookUp[FILECONSTANT.RECORD.FIELD_PAYERID];
        var paymentPeriod = fieldLookUp[FILECONSTANT.RECORD.FIELD_PERIOD][0].value;
        var restBalance = fieldLookUp[FILECONSTANT.RECORD.FIELD_BALANCE];
        log.debug("taxnumber : paymentPeriod", taxnumber + " : " + paymentPeriod+"    restBalance : "+restBalance);

        currentRecord.setValue({
          fieldId: "custbody_tax_payer_id_num",
          value: taxnumber,
          ignoreFieldChange: true,
        });

        currentRecord.setValue({
          fieldId: "custbody_paymentperiod",
          value: paymentPeriod,
          ignoreFieldChange: true
        });

        var applyPrebal = currentRecord.getField('custbody_prevbalance');
        if (restBalance == 0 || !restBalance || Number(restBalance) == 0 || restBalance == 0.00)
          applyPrebal.isDisabled = true
        else
          applyPrebal.isDisabled = false;


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
        if(custYear)
          custYear.isDisabled = true;
        amount.isDisabled = true;
        if (onload == 'create') {
          currentRecord.setValue({
            fieldId: "custbody_business_type",
            value: BUSINESSTYPE_HOTEL,
            ignoreFieldChange: true,
          });
          currentRecord.setValue({
            fieldId: "custbody_transaction_type",
            value: 1,
            ignoreFieldChange: true,
          });
          currentRecord.setValue({
            fieldId: "custbody_fops_payment_status",
            value: 2,
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

    function validateDelete(context) {
      var currentRecord = context.currentRecord;
      var formId = currentRecord.getValue('customform');
      //RUN ONLY FOR RESTAURANT FORM
      if (formId != PAYMENTFORMS.HOTEL)
        return;

      var sublistId = context.sublistId;

      if (sublistId == "recmachcustrecord_tobc_location_custmer_payment") {

        var internalId = currentRecord.id;
        if (internalId ) {
          dialog.alert({ 'title': 'Restricted', 'message': FILECONSTANT.MESSAGE.RESTRICT_LINEEDIT });
          return false;
        }
        var totalAmount = currentRecord.getValue('custbody_rest_total_rev_add_loc'); 
        var lineAmount = currentRecord.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: "custrecord_tobc_location_amount"
          });


          totalAmount = Number(totalAmount) - Number(lineAmount);

        // Update the header custom amount field.
        currentRecord.setValue({
            fieldId: 'custbody_rest_total_rev_add_loc',
            value: Number(totalAmount).toFixed(2),
            ignoreFieldChange: false
          });
      }
      return true;
    }

    //THIS FUNCTION WILL ZERO ALL THE VALUES SO USER CAN RE-ENTER THE AMOUNTS
    function retriggerTaxCalculation(currentRecord)
    {
      var tempNetRevAmount = Number(currentRecord.getValue('custbody_rest_net_revenue_cur_month')); 
            currentRecord.setValue({
              fieldId: "custbody_rest_net_revenue_cur_month",
              value: tempNetRevAmount
            });
    }

    //THIS FUNCTION WILL RECALCULLATE THE ADDITONAL LOCATION AMOUNT
    function reCalculateAdditionalLocation(currentRecord, isFieldChange) {

      var sublistID = 'recmachcustrecord_tobc_location_custmer_payment'
      var totalAmount = 0, lineAmount = 0;
      var lineCount = currentRecord.getLineCount(sublistID);
      var currentLineIndex = currentRecord.getCurrentSublistIndex({
        sublistId: sublistID
      });

      if (lineCount == currentLineIndex)
        totalAmount = currentRecord.getCurrentSublistValue({
          sublistId: sublistID,
          fieldId: "custrecord_tobc_location_amount"
        });

      for (var ln = 0; ln < lineCount; ln++) {

        if (ln == currentLineIndex && isFieldChange) {
          lineAmount = currentRecord.getCurrentSublistValue({
            sublistId: sublistID,
            fieldId: "custrecord_tobc_location_amount"
          });
        }
        else
          lineAmount = currentRecord.getSublistValue({
            sublistId: sublistID,
            fieldId: 'custrecord_tobc_location_amount',
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

    function getBusinessTaxPercentage(taxType) {
      var filtersArr = [];
      filtersArr = [
        ["custrecord34", 'is', taxType],
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

    function removePercentSign(tempRate) {
      if (tempRate) {
        tempRate = tempRate.replace('%', '');
        tempRate = Number(tempRate);
      }
      else
        tempRate = 0;

      return tempRate;
    }

    function FOPSHMSaveRecord(context) {
      try 
      {
        debugger;
        var currentRecord = context.currentRecord;
        var custForm = currentRecord.getValue('customform');
        if (custForm == PAYMENTFORMS.HOTEL) {

          var busiTobaccoText = currentRecord.getText('custbody_hotel_busniess_name_id');
          currentRecord.setValue({
            fieldId: 'custbody_omh_business_name_text',
            value: busiTobaccoText,
            ignoreFieldChange: true
          });

          //CHECK BUSINESS OPEN DATE
          var businessOpenDate = new Date(BUSINESSOBJECT.rtOpenDate);
          var tranDate = currentRecord.getValue('custbody_payment_due_date');
          businessOpenDate.setHours(0,0,0,0);
          tranDate.setHours(0,0,0,0);
          console.log('Saved Record :  businessOpenDate : '+businessOpenDate+'  tranDate : '+tranDate);
          
          var paymentYearText = currentRecord.getText("custpage_custom_year_field");
          var paymentMonth = currentRecord.getValue("custbody_tax_month");
          var paymentQuarterly = currentRecord.getValue("custbody_quarterly");

          var isValidOpen = validateBusinessOpenDate(new Date(BUSINESSOBJECT.rtOpenDate),paymentYearText, paymentMonth, paymentQuarterly);
          if(isValidOpen)
          {
            dialog.alert({ 'title': 'Restricted', 'message': FILECONSTANT.MESSAGE.LESSTHAN_BUSINESSOPEN + BUSINESSOBJECT.rtOpenDate });
            return false;
          }

          return true;
        }
      }
      catch (excep) {
        console.log(excep.toString());
      }
      return true;
    }

    function FOPSlineInit(context) {
      var currentRecord = context.currentRecord;
      var sublistName = context.sublistId;
      var custForm = currentRecord.getValue('customform');
      if (custForm != PAYMENTFORMS.TOBACCO)
        return true;

      if (sublistName === 'recmachcustrecord_tobc_location_custmer_payment') {


        //addOptionsToSublistField(context);

        var businessId = currentRecord.getValue('custbody_hotel_busniess_name_id');
        var lineLocation = currentRecord.getCurrentSublistValue({
          sublistId: sublistName,
          fieldId: 'custrecord_tobc_payment_location'
        });

        var currRecLineCount = currentRecord.getLineCount(sublistName);
        var lineIndex = currentRecord.getCurrentSublistIndex({
          sublistId: sublistName
        })

        if (businessId) //&& lineIndex >= currRecLineCount
          currentRecord.setCurrentSublistValue({
            sublistId: sublistName,
            fieldId: 'custrecord_tobc_location_business_name',
            value: businessId
          });
          
        // else if(!lineLocation)
        //   currentRecord.setCurrentSublistValue({
        //     sublistId: sublistName,
        //     fieldId: 'custrecord_tobc_location_business_name',
        //     value: ''
        //   });
      }
    }

    function addOptionsToSublistField(context) {
      var currentRecord = context.currentRecord;
      var sublistFieldId = 'custpage_custom_item_field'; // Replace with the internal ID of the scripted sublist select field
    
      // Define the options you want to add
      var optionsToAdd = [
        { value: 'option1', text: 'Option 1' },
        { value: 'option2', text: 'Option 2' },
        // Add more options as needed
      ];
    
      // Get the line number of the current line being initialized
      //var line = context.line;
      var line = currentRecord.getCurrentSublistIndex({
        sublistId: 'recmachcustrecord_tobc_location_custmer_payment' // Replace with the internal ID of the sublist
      });

      // Get the sublist field object
      var sublistField = currentRecord.getSublistField({
        sublistId: 'recmachcustrecord_tobc_location_custmer_payment', // Replace with the internal ID of the sublist
        fieldId: sublistFieldId,
        line: line // Use the line number to specify the line where you want to add the options
      });
    
      // Add options to the sublist select field
      optionsToAdd.forEach(function (option) {
        sublistField.selectNewOption({
          value: option.value,
          text: option.text
        });
      });
    }

    function validateLine(context) {
      var currentRecord = context.currentRecord;
      var formId = currentRecord.getValue('customform');
      //RUN ONLY FOR RESTAURANT FORM
      if (formId != PAYMENTFORMS.TOBACCO)
        return true;
      
      var sublistId = context.sublistId;
      if (sublistId == "recmachcustrecord_tobc_location_custmer_payment") {
        var internalId = currentRecord.id;
        if (internalId ) {
          dialog.alert({ 'title': 'Restricted', 'message': FILECONSTANT.MESSAGE.RESTRICT_LINEEDIT });
          return false;
        }

        var paymentYearText = currentRecord.getText("custbody_tax_year");
        if(!paymentYearText)
          paymentYearText = currentRecord.getText("custpage_custom_year_field");
        
        var paymentMonthText = currentRecord.getText("custbody_tax_month");
        var paymentQuarterlyText = currentRecord.getText("custbody_quarterly");
        var paymentPeriod = currentRecord.getValue('custbody_paymentperiod');


        //VALIDATE PAYMENT PERIODD
        if ((!paymentYearText) || (paymentPeriod == FILECONSTANT.PERIOD.QUARTERLY && !paymentQuarterlyText)
        || (paymentPeriod == FILECONSTANT.PERIOD.MONTHLY && !paymentMonthText)) {
          var option = {
            title: "Validation",
            message: FILECONSTANT.MESSAGE.YEARPERIOD,
          };
          dialog.alert(option);
          return false;
        }

        var currLinelocation = currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: "custrecord_tobc_payment_location"
        });
        var currLineAmount = currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: "custrecord_tobc_location_amount"
        });

        var lineCount = currentRecord.getLineCount(sublistId);
        if(lineCount == 0 && !currLinelocation && !currLineAmount)
        {
            //if(!currLinelocation && ( !currLineAmount || currLineAmount <= 0))
            // currentRecord.removeLine({
            //   sublistId: sublistId,
            //   line: 0
            // });
            //REMOVE LINE
        }
        else if((!currLinelocation && currLineAmount) || ( currLinelocation && (!currLineAmount || currLineAmount <= 0 ))){
          dialog.alert({ 'title': 'Please provide value', 'message': FILECONSTANT.MESSAGE.VALIDATE_ADDLOCATION });
          return false;
        }

        var totalAmount = 0, lineAmount = 0;
        var lineCount = currentRecord.getLineCount(sublistId);
        var currentLineIndex = currentRecord.getCurrentSublistIndex({
          sublistId: sublistId
        });

        var currentLineAmount = currentRecord.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: "custrecord_tobc_location_amount"
          });
        
        var totalHeaderAmount = Number(currentRecord.getValue('custbody_rest_total_rev_add_loc'));
          
        if( lineCount > currentLineIndex){
          var oldCurrentLineAmount = currentRecord.getSublistValue({
            sublistId: sublistId,
            fieldId: 'custrecord_tobc_location_amount',
            line: currentLineIndex
          });

          totalAmount = Number(totalHeaderAmount) - Number(oldCurrentLineAmount) + Number(currentLineAmount);
        }
        else
        {
          totalAmount = totalHeaderAmount + currentLineAmount;      
        }

        // Update the header custom amount field.
        if (totalAmount > 0)
          currentRecord.setValue({
            fieldId: 'custbody_rest_total_rev_add_loc',
            value: Number(totalAmount).toFixed(2),
            ignoreFieldChange: false
          });
      }
      return true;
    }

    function getDueDateMonthDiff(dueDate){
      var endofMonth  = endOfMonth(dueDate);
      var duedate = dueDate.getDate(); 
      var dueMonths = monthDiff(endofMonth,new Date(),duedate);
      console.log(dueMonths)
      return dueMonths
    }

    //GET CUSTOMER PAYMENTS
    function getCustomerPayments(businessID, paymentYear)
    {
      var returnData = [];
      var paymentSearchObj = search.create({
        type: 'customerpayment',
        filters: [
          ["mainline","is","T"],
          "AND",
          ["custbody_hotel_busniess_name_id","anyof", businessID],
          "AND",
          ["custbody_tax_year","is", paymentYear]
        ],
        columns: ["trandate", "internalid","custbody_tax_year", "custbody_tax_month", "custbody_quarterly"]
       });

      paymentSearchObj.run().each(function(result){ 
        returnData.push({
          internalid: result.getValue({name: 'internalid'}),
          month: Number(result.getValue({name: 'custbody_tax_month'})),
          quarter: Number(result.getValue({name: 'custbody_quarterly'})),
          monthText: result.getText({name: 'custbody_tax_month'}),
          quarterText: result.getText({name: 'custbody_quarterly'})
        });
        return true;
      });
      return returnData;
    }

    /**GET PAYMENT FROM ZERO PAYMENT RECORD**/
    function getZeroPayments(businessID, paymentYear)
    {
      var returnData = [];
      var zeroSearchObj = search.create({
        type: 'customrecord_zero_balance_cust_payment',
        filters: [
          ["isinactive","is",false],
          "AND",
          ["custrecord_fops_zerobalance_busines_type","anyof", BUSINESSTYPE_HOTEL],
          "AND",
          ["custrecord_fops_zerobalance_hotel_id","anyof",businessID],
          "AND",
          ["custrecord_fops_zerobalance_year","anyof", paymentYear]
        ],
        columns: ['internalid', 'custrecord_fops_zerobalance_month', 'custrecord_fops_zerobalance_quarterly']
      });

      var zeroSearchResultCount = zeroSearchObj.runPaged().count;
      if(zeroSearchResultCount > 0)
      {
        zeroSearchObj.run().each(function(result){ 
          returnData.push({
            internalid: result.getValue({name: 'internalid'}),
            month: Number(result.getValue({name: 'custrecord_fops_zerobalance_month'})),
            quarter: Number(result.getValue({name: 'custrecord_fops_zerobalance_quarterly'})),
            monthText: result.getText({name: 'custrecord_fops_zerobalance_month'}),
            quarterText: result.getText({name: 'custrecord_fops_zerobalance_quarterly'})
          });
          return true;
        });
        return returnData;
      }
      return [];
    }

    /** VALIDATE EXISTING PAYMENTS **/
    function validateExistingPayments(dataObj, targetMonth, targetQuarter)
    {
      // Check if the input matches any existing quarter
      var matchingQuarter = dataObj.filter(function(item) {
        return item.quarter === targetQuarter;
      });
      
      if (matchingQuarter.length > 0) {
        return matchingQuarter[0].quarterText;
      }

      // Check if the input matches any existing month
      var matchingMonth = dataObj.filter(function(item) {
        return targetMonth.indexOf(item.month) !== -1;
      });

      if (matchingMonth.length > 0) {
        return matchingMonth[0].monthText;
      }

      return false;

    }

    function getQuarter(month) {
      if (isNaN(month) || month < 1 || month > 12) {
        throw new Error('Invalid month. Please provide a number between 1 and 12.');
      }
    
      return Math.ceil(month / 3);
    }

    function getMonthsInQuarter(quarter) {
      if (isNaN(quarter) || quarter < 1 || quarter > 4) {
        throw new Error('Invalid quarter. Please provide a number between 1 and 4.');
      }
      var months = [];
      var startMonth = (quarter - 1) * 3 + 1;
      var endMonth = startMonth + 2;
      for (var i = startMonth; i <= endMonth; i++) {
        months.push(i);
      }
      return months;
    }

    function endOfMonth(date)
    {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    function monthDiff(dateFrom, dateTo, duedate) {
      if(duedate == dateTo.getDate() && dateTo.getMonth() == dateFrom.getMonth() && dateTo.getFullYear() == dateFrom.getFullYear()){
        return 0
      }
      var months = dateTo.getMonth() - dateFrom.getMonth() + (12 * (dateTo.getFullYear() - dateFrom.getFullYear()));
      var day = 0;
      if(duedate < dateFrom.getDate()){
        day = 1
      }
      var total = months+ day;
      return total
    }

    exports.pageInit = pageInit;
    exports.fieldChanged = FOPSHMfieldChanged;
    exports.postSourcing = FOPSHMpostSourcing;
    exports.saveRecord = FOPSHMSaveRecord;
    exports.lineInit = FOPSlineInit;
    exports.validateLine = validateLine;
    exports.validateDelete = validateDelete;
    return exports;
  });