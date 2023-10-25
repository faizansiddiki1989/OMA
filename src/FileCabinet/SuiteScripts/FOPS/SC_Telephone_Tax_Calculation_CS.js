/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 */

/***********************************************************************************
 * File Name  : SC_Telephone_Tax_Calculation_CS.js
 * Purpose    : This script to validate the fields on Customer Payment 
 * Date       : 26th Jan 2023
 * 
 * History
 * Date             Author              Details
 * 29th Jan 2023    Faizan Siddiki      NETSFOPS-108 : Backend Suitelet
 * 25th April 2023  Faizan Siddiki      NETSFOPS-146 : Payment Permission Fix
 *************************************************************************************/

define(["N/record", "N/search", "N/runtime", "N/ui/dialog", "N/https"], 
    function(record, search, runtime, dialog, https){


    var FILECONSTANT = {
        BE_SEARCH_SUITELET_ID : 'customscript_fops_bs_search_reuslts',
        BE_SEARCH_SUITELET_DEPLOYMENT_ID : 'customdeploy_fops_bs_search_reuslts'
    }

    var PAYMENTFORMS = {
        'TELEPHONE' : '203',
        'TOBACCO' : '212',
        'RESTAURANT': '193',
        'HOTEL':'220'
    }

    var FOPS = {
        'DEPARTMENT' : 106,
        'CLASS': 13
    }

    var TRANS_TYPE = {
        MAIL: "1",
        ONLINE: "2"
      };
    
    var PAYMENT_STATUS= {
        'PROCESSED': 2
    }
  

    var exports = {};
    var yymmChange = false;
    var mm = '';
    var yy = ''
    //pageInit
    function pageInit(context) {
        debugger
        var currentRecord = context.currentRecord;
        var formType = currentRecord.getValue({
            fieldId: "customform",
        });
        // alert(formType)
        if (formType == PAYMENTFORMS.TELEPHONE) {
            jQuery("#NS_MENU_ID0-item1,#NS_MENU_ID0-item2,#NS_MENU_ID0-item5").hide();
            //hide invoice list
            // jQuery('#applications_form').next("table.uir-table-block").hide()
            // avoid edit to user when payment made through online
            var userObj = runtime.getCurrentUser();
            var role = userObj.role;
            onloadValidationDisable(currentRecord, context.mode)
            //alert(role)
            console.log(context.mode)
            //NETSFOPS-174 : DEFAULT PAYMENT STATUS BASED ON TRANSACTION TYPE
            if(context.mode == "create"){
                var transType = currentRecord.getValue('custbody_transaction_type');
                if(transType == TRANS_TYPE.MAIL){
                currentRecord.setValue({
                    fieldId: 'custbody_fops_payment_status',
                    value: PAYMENT_STATUS.PROCESSED  //PROCESSED ID
                });
                }
            }
            else if (context.mode == "edit") {

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
                if (tranType == TRANS_TYPE.ONLINE) {
                    var option = {
                        title: "Insufficient Permission",
                        message: "You do not have sufficient permission to change this record. Please contact with Administrator",
                    };
                    //   alert(option.message);
                    // Construct URLSearchParams object instance from current URL querystring.
                    /*  var url = window.location.href;
       var params = url.split("?");
		var param = params[1].split('&');
        var dup,query;
    for(var i=0;i<param.length;i++){
        
    var item = param[i].split('=');
      if(dup){
          
          if(dup !=item[0]){
             if(item[0] == 'e' && item[1] == 'F'){
              query += '&'+item[0]+'='+item[1];
              dup = item[0]
             }else if(item[0] == 'e' && item[1] == 'T'){
               query += '&'+item[0]+'=F';
              dup = item[0]
             }else{
               query += '&'+item[0]+'='+item[1];
              dup = item[0]
             }
          }
      }
      if(!dup){
          query = item[0]+'='+item[1];
          dup = item[0]
              }        
    
}
        //var updateUrl = url.replace("T", "F");
        */
                    //    window.location.href = window.location.origin+'/app/accounting/transactions/transactionlist.nl?Transaction_TYPE=CustPymt';
                }
            }
        }
    }
    //fieldChanged
    function fieldChanged(context) {
        try {
            var currentRecord = context.currentRecord;
            var sublistId = context.sublistId;
            var department = currentRecord.getValue({
                fieldId: "department",
            });
            var deptClass = currentRecord.getValue({
                fieldId: "class",
            });
            var formid = currentRecord.getValue({
                fieldId: "customform",
            });

            //Work only for Telephone Tax form
            if(formid != PAYMENTFORMS.TELEPHONE)
                return true;

            var userObj = runtime.getCurrentUser();
            var role = userObj.role;
            /*log.debug('user role ', role);
            log.debug({
                title: 'field-sublist',
                details: context.fieldId + '-' + context.sublistId
            })
            log.debug({
                title: 'criteria',
                details: department +'-'+ deptClass +'-'+ formid
            })
            var option = {
              title: "Insufficient Permission",
              message:
                "You do not have sufficient permission to change this field. Please contact with Administrator",
            };*/
            //role 3 admin

            if (currentRecord.type == "customerpayment") {
                if (context.fieldId == "custbody_business_id") {
                    try {
                        if (formid == PAYMENTFORMS.TELEPHONE) {
                            if (department == FOPS.DEPARTMENT && deptClass == FOPS.CLASS) {
                                onloadValidationDisable(currentRecord, 'change')
                            } else {
                                var option = {
                                    title: "Error",
                                    message: "please select department as 'FOPS', class as 'Telephone Tax'",
                                };
                                dialog.alert(option);
                            }
                        }
                    } catch (e) {
                        debugger;
                        log.error({
                            title: e.name,
                            details: e.message,
                        });
                    }
                } else if (
                    context.fieldId == "custbody_tele_amount_1" ||
                    context.fieldId == "custbody_paymnt_amount1" ||
                    context.fieldId == "custbody_payment_amount2" ||
                    context.fieldId == "custbody_payment_amount3"
                ) {
                    try {
                        debugger
                        var Btype = currentRecord.getValue({
                            fieldId: "custbody_business_type"
                        });
                        var customer = currentRecord.getValue({
                            fieldId: "customer"
                        });
                        var month1 = currentRecord.getValue({
                            fieldId: 'custbody_tax_month'
                        });
                        // var month2 = currentRecord.getValue({fieldId:'custbody_tele_mnth_month_2'});
                        // var month3 = currentRecord.getValue({fieldId:'custbody_tele_mnthly_month3'});
                        var year = currentRecord.getText({
                            fieldId: 'custbody_tax_year'
                        });
                        //var year2 = currentRecord.getValue({fieldId:'custbody_tele_mnthly_year_2'});
                        //var year3 = currentRecord.getValue({fieldId:'custbody_tele_mnthly_year3'});
                        var amount = currentRecord.getValue({
                            fieldId: 'custbody_tele_amount_1'
                        });
                        //var amount2 = currentRecord.getValue({fieldId:'custbody_tele_mnthly_amount2'});
                        //var amount3 = currentRecord.getValue({fieldId:'custbody_tele_mnthly_amount_3'});

                        var quarterly = currentRecord.getValue({
                            fieldId: 'custbody_quarterly'
                        });
                        var qutamt = currentRecord.getValue({
                            fieldId: 'custbody_paymnt_amount1'
                        });
                        var qutamt2 = currentRecord.getValue({
                            fieldId: 'custbody_payment_amount2'
                        });
                        var qutamt3 = currentRecord.getValue({
                            fieldId: 'custbody_payment_amount3'
                        });
                        var qutyear = currentRecord.getText({
                            fieldId: 'custbody_hotel_year_tax'
                        });
                        log.debug('customer-Btype', customer + '-' + Btype)
                        if (customer && Btype) {
                            var totalrev = 0;
                            if (amount) totalrev = totalrev + amount;
                            // if(amount2) totalrev = totalrev+amount2;
                            // if(amount3) totalrev = totalrev+amount3;

                            if (qutamt) totalrev = totalrev + qutamt;
                            if (qutamt2) totalrev = totalrev + qutamt2;
                            if (qutamt3) totalrev = totalrev + qutamt3;

                            //alert(totalrev)
                            // log.debug('totalrev',totalrev)
                            if (amount && !isNaN(amount)) {
                                if (!(amount > 0 && amount < 10000000)) {
                                    alert(
                                        "Please enter amount greater than 0 and less than 10 million only."
                                    );
                                    return false;
                                }
                            }
                            if (qutamt && !isNaN(qutamt)) {
                                if (!(qutamt > 0 && qutamt < 10000000)) {
                                    alert(
                                        "Please enter amount greater than 0 and less than 10 million only."
                                    );
                                    return false;
                                }
                            }
                            if (qutamt2 && !isNaN(qutamt2)) {
                                if (!(qutamt2 > 0 && qutamt2 < 10000000)) {
                                    alert(
                                        "Please enter amount greater than 0 and less than 10 million only."
                                    );
                                    return false;
                                }
                            }
                            if (qutamt3 && !isNaN(qutamt3)) {
                                if (!(qutamt3 > 0 && qutamt3 < 10000000)) {
                                    alert(
                                        "Please enter amount greater than 0 and less than 10 million only."
                                    );
                                    return false;
                                }
                            }

                            currentRecord.setValue({
                                fieldId: "custbody_oma_rest_total_revenue",
                                value: totalrev,
                                ignoreFieldChange: true
                            });


                            // var revenue = currentRecord.getValue({fieldId: "custbody_oma_rest_total_revenue"}); 
                            //var collectionfee = currentRecord.getValue({fieldId: "custbody_oma_rest_less_coll_fee"}); 
                            //var latefee = currentRecord.getValue({fieldId: "custbody_tel_late_fee_tax"});
                            // var interest = currentRecord.getValue({fieldId: "custbody_tel_tax_late_fee_interest"});



                            // log.debug('price','r-'+revenue+'c-'+collectionfee+'l-'+latefee+'i-'+interest)
                            log.debug('price-m', totalrev)
                            if (!totalrev) {
                                currentRecord.setValue({
                                    fieldId: "custbodytax_tele",
                                    value: 0
                                });
                                currentRecord.setValue({
                                    fieldId: "custbody_oma_rest_net_revenue",
                                    value: 0
                                });
                                currentRecord.setValue({
                                    fieldId: "payment",
                                    value: ''
                                });
                                return false;
                            } else {


                                var totalrevenue = totalrev;
                                log.debug('totalrevenue', totalrevenue)
                                /* if(!(totalrevenue >0 && totalrevenue < 10000000)){
                                   //alert('0')
                                   //alert('Please enter amount greater than 0 and less than 10 million only.')
                                   currentRecord.setValue({
                                     fieldId: "custbody_oma_rest_total_revenue",
                                     value: 0
                                   });
                                   currentRecord.setValue({
                                     fieldId: "custbodytax_tele",
                                     value: 0
                                   });
                                   currentRecord.setValue({
                                     fieldId: "custbody_oma_rest_net_revenue",
                                     value: 0
                                   });
                                   currentRecord.setValue({
                                     fieldId: "payment",
                                     value: '0',
                                     ignoreFieldChange: true
                                   });
                                 return false
                                 } */
                                var fieldLookUp = search.lookupFields({
                                    type: 'customrecord_business_tax_rate',
                                    id: '1',
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
                                var rate = ratepercantage ? ratepercantage : 6.25;
                                var tax = percentage(totalrevenue, rate).toFixed(2);
                                // var finaltax = tax+latefee+interest;
                                //  log.debug('final tax',finaltax)
                                log.debug('tax', tax)
                                currentRecord.setValue({
                                    fieldId: "custbodytax_tele",
                                    value: tax
                                });
                                currentRecord.setValue({
                                    fieldId: "custbody_oma_rest_occupation_tax_due",
                                    value: 0
                                });
                                currentRecord.setValue({
                                    fieldId: "custbody_oma_rest_net_revenue",
                                    value: tax
                                });
                                currentRecord.setValue({
                                    fieldId: "payment",
                                    value: tax
                                });

                            }
                        } else {
                            if (!customer) {
                                alert('Please select Customer.')
                            } else if (Btype) {
                                alert('Please select Business name.')
                            }

                            currentRecord.setValue({
                                fieldId: context.fieldId,
                                value: ''
                            });
                        }

                    } catch (e) {
                        debugger;
                        log.error({
                            title: e.name,
                            details: e.message,
                        });
                    }


                } else if (context.fieldId == "custbody_tax_month" || context.fieldId == "custbody_tax_year") {
                    debugger
                    var y = currentRecord.getText({
                        fieldId: "custbody_tax_year",
                    });
                    var m = currentRecord.getValue({
                        fieldId: "custbody_tax_month",
                    });
                    // alert('mm-'+ mm+'-m-'+m+'-yy-'+yy+ '-y-'+y)
                    if (m != mm) {
                        yymmChange = true;
                    }
                    if (y != yy) {
                        yymmChange = true;
                    }
                } else if (context.fieldId == "payment") {
                    try {
                        var btype = currentRecord.getValue({
                            fieldId: "custbody_business_type",
                        });
                        var payment = currentRecord.getValue({
                            fieldId: "payment",
                        });
                    } catch (e) {
                        debugger;
                        log.error({
                            title: e.name,
                            details: e.message,
                        });
                    }
                } else if (context.fieldId == "customer") {
                    try {
                        var currentRecord = context.currentRecord;
                        var customer = currentRecord.getValue({
                            fieldId: "customer"
                        });
                        var customform = currentRecord.getValue({
                            fieldId: "customform"
                        });
                        if (customform == PAYMENTFORMS.TELEPHONE) {
                            var option = {
                                title: "Error",
                                message: "Please select 'Telephone Tax Customer Payment form' in the 'CUSTOM FORM' drop down.",
                            };
                            // dialog.alert(option);

                            if (customer) {
                                var searchTlephoneTax = search.create({
                                    type: "customrecord_telephone_tax",
                                    filters: [
                                        ["custrecord_restaurant_customer_tax", "anyof", customer],
                                        "AND",
                                        ["isinactive", "is", "F"],
                                    ],
                                    columns: [
                                        search.createColumn({
                                            name: "name",
                                            sort: search.Sort.ASC,
                                            label: "Name",
                                        }),
                                        search.createColumn({
                                            name: "id",
                                            label: "ID"
                                        }),
                                        search.createColumn({
                                            name: "custrecord_conf_tax_id_num",
                                            label: "Confirm Tax Payer Id Number",
                                        }),
                                        search.createColumn({
                                            name: "custrecord_restaurant_customer_tax",
                                            label: "Customer",
                                        }),
                                        search.createColumn({
                                            name: "custrecord_tax_payer_id_num",
                                            label: "Tax Payer Id Number",
                                        }),
                                        search.createColumn({
                                            name: "custrecord_tel_tax_bus_name",
                                            label: "Business Name",
                                        }),
                                        search.createColumn({
                                            name: "custrecord_rest_pay_period",
                                            label: "Payment Period",
                                        }),
                                    ],
                                });
                                var taxes = searchTlephoneTax.runPaged().count;
                                if ((taxes.length = 0 || !taxes || taxes == 0)) {
                                    var option = {
                                        title: "Error",
                                        message: "This customer does not have telephone tax business.",
                                    };
                                    dialog.alert(option);
                                }
                            }
                        }
                    } catch (e) {
                        log.error({
                            title: e.name,
                            details: e.message,
                        });
                    }
                }
            }
        } catch (e) {
            log.error({
                title: e.name,
                details: e.message,
            });
        }
    }

    function percentage(num, per) {
        return (num / 100) * per;
    }
    //saveRecords
    function saveRecord(context) {
        
        //debugger;
        try {
            var monthLevel = {
                1: "January",
                2: "February",
                3: "March",
                4: "April",
                5: "May",
                6: "June",
                7: "July",
                8: "August",
                9: "September",
                10: "October",
                11: "November",
                12: "December",
            };
            var currentRecord = context.currentRecord;

            //Work only for Telephone Tax form
            var formId = currentRecord.getValue({fieldId: "customform"});
            if(formId != PAYMENTFORMS.TELEPHONE)
                return true;

            var bId = currentRecord.getValue({fieldId: "custbody_business_id"});


            if (bId) {
                var telephoneTaxfieldLookUp = search.lookupFields({
                    type: "customrecord_telephone_tax",
                    id: bId,
                    columns: [
                        "custrecord_conf_tax_id_num",
                        "custrecord_rest_pay_period",
                        "custrecord_rest_bues_open_date",
                    ],
                });

                var paymentType =
                    telephoneTaxfieldLookUp.custrecord_rest_pay_period[0].value == "2" ?
                    true :
                    false;
                var amt1 = currentRecord.getValue({
                    fieldId: "custbody_tele_amount_1",
                });
                var month1 = currentRecord.getValue({
                    fieldId: "custbody_tax_month"
                });
                var year1 = currentRecord.getText({
                    fieldId: "custbody_tax_year"
                });
                var amount = 0;
                var paymentInfo = paymentsInDb(bId);
                console.log(paymentInfo);
                if (!paymentType) {
                    //monthly type validation
                    if (!amt1) {
                        alert("Please enter receipts amount");
                        return false;
                    } else {
                        if (!(amt1 > 0 && amt1 < 10000000)) {
                            alert(
                                "Please enter amount greater than 0 and less than 10 million only."
                            );
                            return false;
                        }
                    }
                    if (!month1) {
                        var msge = "Please select month";
                        alert(msge);
                        return false;
                    }

                    if (!year1) {
                        alert("Please select year");
                        return false;
                    }

                    if (amt1 && !isNaN(amt1)) {
                        amount = parseFloat(amt1);
                    }
                    var month = monthLevel[month1];
                    var year = year1; //jQuery('#year'+i).val();
                    if (!context.currentRecord.id || (context.currentRecord.id && yymmChange)) {
                        var yearinDb = paymentInfo[year]; // this.paymentInfo[year];
                        console.log(yearinDb);
                        if (yearinDb) {
                            if (paymentInfo[year].hasOwnProperty(month)) {
                                alert(
                                    'Payment already submitted for the Tax period: "' +
                                    month +
                                    " " +
                                    year +
                                    '"'
                                );
                                return false;
                            }
                        }
                    }
                    // avoid future/back date
                    var currentYear = new Date().getFullYear(),
                        currentmonth = new Date().getMonth(),
                        openDate = telephoneTaxfieldLookUp.custrecord_rest_bues_open_date,
                        openDate = openDate.split("/"),
                        yy = openDate[2],
                        mm = openDate[0];
                    var openMonth = parseInt(mm) - 1;
                    var openYear = parseInt(yy);
                    for (var i = 1; i <= 1; i++) {
                        var m, y;
                        m = month1;
                        y = year1;
                        m = parseInt(m);
                        y = parseInt(y);

                        //avoid back date
                        if (openYear > y || (openYear == y && openMonth > m)) {
                            var msge =
                                'Invalid Tax Period. Please select the period after Business Open Date "' +
                                telephoneTaxfieldLookUp.custrecord_rest_bues_open_date +
                                '".';
                            alert(msge);
                            //jQuery('#month'+i).focus() //
                            return false;
                        }

                        // avoid future date
                        if (currentYear < y || (currentYear == y && m >= currentmonth)) {
                            var msge =
                                "Invalid Tax period, Please select only past tax period!";
                            alert(msge);
                            //  jQuery('#month'+i).focus() //
                            return false;
                        }
                    }

                    // avoid back date , payment should be accept after business open date
                } else {
                    var quarter = currentRecord.getValue({
                        fieldId: "custbody_quarterly",
                    });
                    var qtrAmt1 = currentRecord.getValue({
                        fieldId: "custbody_paymnt_amount1",
                    });
                    var qtrAmt2 = currentRecord.getValue({
                        fieldId: "custbody_payment_amount2",
                    });
                    var qtrAmt3 = currentRecord.getValue({
                        fieldId: "custbody_payment_amount3",
                    });
                    var year1 = currentRecord.getText({
                        fieldId: "custbody_hotel_year_tax",
                    });
                    if (!quarter) {
                        alert("Plase select quarter");
                        return false;
                    }
                    var obj = {
                        1: ["1", "2", "3"],
                        2: ["4", "5", "6"],
                        3: ["7", "8", "9"],
                        4: ["10", "11", "12"],
                    };
                    var month1, month2, month3;
                    var months = obj[quarter];
                    if (qtrAmt1) month1 = parseInt(months[0]);
                    if (qtrAmt2) month2 = parseInt(months[1]);
                    if (qtrAmt3) month3 = parseInt(months[2]);

                    if (!year1) {
                        alert("Please select year");
                        return false;
                    }

                    // avoid future date
                    var today = new Date();
                    var currentQuarter = Math.floor((today.getMonth() + 3) / 3);
                    quarter = parseInt(quarter);
                    var currentYear = today.getFullYear(),
                        currentmonth = today.getMonth(),
                        openDate = telephoneTaxfieldLookUp.custrecord_rest_bues_open_date,
                        openDate = openDate.split("/"),
                        yy = openDate[2],
                        mm = openDate[0];
                    var openMonth = parseInt(mm) - 1;
                    var openYear = parseInt(yy);
                    year1 = parseInt(year1);

                    var openQtr = findQuarter(openMonth);
                    // chck quarter payment eligibility
                    // quarter tax can pay from next quarter cycle not in current or previous date
                    if (
                        year1 == currentYear &&
                        (quarter > currentQuarter || quarter == currentQuarter)
                    ) {
                        var msge =
                            "Invalid Tax period, Please select only past tax period!";
                        alert(msge);
                        return false;
                    }
                    //avoid future date
                    if (year1 > currentYear) {
                        var msge =
                            "Invalid Tax period, Please select only past tax period!";
                        alert(msge);
                        return false;
                    }

                    //avoid back date
                    if (
                        openYear > year1 ||
                        (openYear == year1 && (openQtr > quarter || openQtr == quarter))
                    ) {
                        var msge =
                            'Invalid Tax Period. Please select the period after Business Open Date "' +
                            telephoneTaxfieldLookUp.custrecord_rest_bues_open_date +
                            '".';
                        alert(msge);
                        return false;
                    }

                    if (!qtrAmt1) {
                        alert("Please enter amount 1st month of the quarter");
                        return false;
                    }
                    if (qtrAmt1 && !isNaN(qtrAmt1)) {
                        if (!(qtrAmt1 > 0 && qtrAmt1 < 10000000)) {
                            alert(
                                "Please enter amount greater than 0 and less than 10 million only."
                            );
                            return false;
                        }
                        amount = parseFloat(qtrAmt1);
                    }
                    if (!qtrAmt2) {
                        alert("Please enter amount 2nd month of the quarter");
                        return false;
                    }
                    if (qtrAmt2 && !isNaN(qtrAmt2)) {
                        if (!(qtrAmt2 > 0 && qtrAmt2 < 10000000)) {
                            alert(
                                "Please enter amount greater than 0 and less than 10 million only."
                            );
                            return false;
                        }

                        amount = amount + parseFloat(qtrAmt2);
                    }
                    if (!qtrAmt3) {
                        alert("Please enter amount 3rd month of quarter");
                        return false;
                    }
                    if (qtrAmt3 && !isNaN(qtrAmt3)) {
                        if (!(qtrAmt3 > 0 && qtrAmt3 < 10000000)) {
                            alert(
                                "Please enter amount greater than 0 and less than 10 million only."
                            );
                            return false;
                        }
                        amount = amount + parseFloat(qtrAmt3);
                    }

                    // checking with DB payment if payment is exist or not in the same year and month  each row
                    if (!context.currentRecord.id || (context.currentRecord.id && yymmChange)) {
                        var yearinDb = paymentInfo[year1];
                        console.log(yearinDb);
                        if (yearinDb) {
                            var paymentMonths = "";
                            //alert(months.length);
                            for (var m = 0; m < months.length; m++) {
                                var month = months[m];
                                month = monthLevel[month];
                                // alert(month);
                                var amounts;
                                m == 0 ?
                                    (amounts = qtrAmt1) :
                                    m == 1 ?
                                    (amounts = qtrAmt2) :
                                    (amounts = qtrAmt3);
                                if (amounts && paymentInfo[year1].hasOwnProperty(month)) {
                                    var q = "";
                                    m == 0 ? (q = "") : m == 1 ? (q = 2) : m == 2 ? (q = 3) : "";
                                    //alert('Payment already submitted for the Tax period "'+month + ' '+year1+'"');
                                    var madepayment = month + " " + year1;

                                    if (paymentMonths == "") {
                                        paymentMonths = madepayment;
                                    } else {
                                        paymentMonths += ", " + madepayment;
                                    }
                                }
                            }
                            if (paymentMonths) {
                                alert(
                                    "Payment already made for one/ more months (" +
                                    paymentMonths +
                                    ') within the selected Quarter. Please use "Monthly Payment" option to pay for the months that falls under the same quarter.'
                                );
                                return false;
                            }
                        } //edit

                    }
                }
            }

            return true;
        } catch (e) {
            //debugger;
            log.error({
                title: e.name,
                details: e.message,
            });
        }
    }

    function findQuarter(month) {
        if (month <= 3) {
            return 1;
        } else if (month <= 6) {
            return 2;
        } else if (month <= 9) {
            return 3;
        } else if (month <= 12) {
            return 4;
        } else {
            return false;
        }
    }

    function paymentsInDb(id) {

        var filters = [
            ["type", "anyof", "CustPymt"],
            "AND",
            ["custbody_business_id", "anyof", id],
            "AND",
            ["mainline", "is", "T"],
        ];

        var columns = [
            "trandate",
            "internalid",
            "entity",
            "custbody_oma_rest_net_revenue",
            "custbodytax_tele",
            "custbody_oma_rest_occupation_tax",
            "custbody_oma_rest_total_revenue",
            "custbody_business_type",
            "custbody_transaction_type",
            "postingperiod",
            "custbody_tax_year",
            "custbody_tele_mnthly_year_2",
            "custbody_tele_mnthly_year3",
            "custbody_tax_month",
            "custbody_tele_mnth_month_2",
            "custbody_tele_mnthly_month3",
            "custbody_tele_amount_1",
            "custbody_tele_mnthly_amount2",
            "custbody_tele_mnthly_amount_3",
            "custbody_quarterly",
            "custbody_hotel_year_tax",
            "custbody_paymnt_amount1",
            "custbody_payment_amount2",
            "custbody_payment_amount3"];

        var searchPayment = callSearchSuitelet(filters, columns, 'customerpayment');


        /*var searchPayment = nlapiSearchRecord(
            "customerpayment",
            null,
            [
                ["type", "anyof", "CustPymt"],
                "AND",
                ["custbody_business_id", "anyof", id],
                "AND",
                ["mainline", "is", "T"],
            ],
            [
                new nlobjSearchColumn("trandate"),
                new nlobjSearchColumn("internalid"),
                new nlobjSearchColumn("entity"),
                new nlobjSearchColumn("custbody_oma_rest_net_revenue"),
                new nlobjSearchColumn("custbodytax_tele"),
                new nlobjSearchColumn("custbody_oma_rest_occupation_tax"),
                new nlobjSearchColumn("custbody_oma_rest_total_revenue"),
                new nlobjSearchColumn("custbody_business_type"),
                new nlobjSearchColumn("custbody_transaction_type"),
                new nlobjSearchColumn("postingperiod"),
                new nlobjSearchColumn("custbody_tax_year"),
                new nlobjSearchColumn("custbody_tele_mnthly_year_2"),
                new nlobjSearchColumn("custbody_tele_mnthly_year3"),
                new nlobjSearchColumn("custbody_tax_month"),
                new nlobjSearchColumn("custbody_tele_mnth_month_2"),
                new nlobjSearchColumn("custbody_tele_mnthly_month3"),
                new nlobjSearchColumn("custbody_tele_amount_1"),
                new nlobjSearchColumn("custbody_tele_mnthly_amount2"),
                new nlobjSearchColumn("custbody_tele_mnthly_amount_3"),
                new nlobjSearchColumn("custbody_quarterly"),
                new nlobjSearchColumn("custbody_hotel_year_tax"),
                new nlobjSearchColumn("custbody_paymnt_amount1"),
                new nlobjSearchColumn("custbody_payment_amount2"),
                new nlobjSearchColumn("custbody_payment_amount3"),
            ]
        );*/

        var payment = {
            validation: {},
        };

        if (!searchPayment) return {}
        var data = [];
        searchPayment.forEach(function(result) {
            var typeOfPayment;
            var quarterly = null;
            var monthly = null;
            var hasData = false;

            var quarter = result.custbody_quarterly.text;
            var qtrAmt1 = result.custbody_paymnt_amount1.value;
            var qtrAmt2 = result.custbody_payment_amount2.value;
            var qtrAmt3 = result.custbody_payment_amount3.value;
            var qtrYear = result.custbody_hotel_year_tax.text;

            var monAmt1 = result.custbody_tele_amount_1.value;
            var monAmt2 = result.custbody_tele_mnthly_amount2.value;
            var monAmt3 = result.custbody_tele_mnthly_amount_3.value;
            var month1 = result.custbody_tax_month.value;
            var month2 = result.custbody_tele_mnth_month_2.value;
            var month3 = result.custbody_tele_mnthly_month3.value;
            var monYear1 = result.custbody_tax_year.text;
            var monYear2 = result.custbody_tele_mnthly_year_2.text;
            var monYear3 = result.custbody_tele_mnthly_year3.text;

            /*var quarter = result.getText("custbody_quarterly");
            var qtrAmt1 = result.getValue("custbody_paymnt_amount1");
            var qtrAmt2 = result.getValue("custbody_payment_amount2");
            var qtrAmt3 = result.getValue("custbody_payment_amount3");
            var qtrYear = result.getText("custbody_hotel_year_tax");

            var monAmt1 = result.getValue("custbody_tele_amount_1");
            var monAmt2 = result.getValue("custbody_tele_mnthly_amount2");
            var monAmt3 = result.getValue("custbody_tele_mnthly_amount_3");
            var month1 = result.getValue("custbody_tax_month");
            var month2 = result.getValue("custbody_tele_mnth_month_2");
            var month3 = result.getValue("custbody_tele_mnthly_month3");
            var monYear1 = result.getText("custbody_tax_year");
            var monYear2 = result.getText("custbody_tele_mnthly_year_2");
            var monYear3 = result.getText("custbody_tele_mnthly_year3");*/

            var obj = {
                1: ["1", "2", "3"],
                2: ["4", "5", "6"],
                3: ["7", "8", "9"],
                4: ["10", "11", "12"],
            };
            var monthLevel = {
                1: "January",
                2: "February",
                3: "March",
                4: "April",
                5: "May",
                6: "June",
                7: "July",
                8: "August",
                9: "September",
                10: "October",
                11: "November",
                12: "December",
            };

            if (quarter && qtrYear && (qtrAmt1 || qtrAmt2 || qtrAmt3)) {
                if (!payment.validation.hasOwnProperty(qtrYear)) {
                    payment.validation[qtrYear] = {};
                }

                typeOfPayment = "Quarterly";
                hasData = true;
                var quart = result.custbody_quarterly.value;
                nlapiLogExecution('debug','quart',quart)
                var month = obj[quart];
                nlapiLogExecution('debug','quart',JSON.stringify(month))
                nlapiLogExecution('debug','quart',monthLevel[month[0]])
                if (qtrAmt1) {
                    var m = monthLevel[month[0]];
                    if (!payment.validation[qtrYear].hasOwnProperty(m)) {
                        payment.validation[qtrYear][m] = qtrAmt1;
                    }
                }
                if (qtrAmt2) {
                    var m = monthLevel[month[1]];
                    if (!payment.validation[qtrYear].hasOwnProperty(m)) {
                        payment.validation[qtrYear][m] = qtrAmt2;
                    }
                }
                if (qtrAmt3) {
                    var m = monthLevel[month[2]];
                    if (!payment.validation[qtrYear].hasOwnProperty(m)) {
                        payment.validation[qtrYear][m] = qtrAmt3;
                    }
                }

                // quarterly = str
            } else if (!quarter && monYear1 && month1 && monAmt1) {
                typeOfPayment = "Monthly";
                hasData = true;

                if (monAmt1 && month1 && monYear1) {
                    if (!payment.validation.hasOwnProperty(monYear1)) {
                        payment.validation[monYear1] = {};
                    }
                    var m = monthLevel[month1];
                    if (!payment.validation[monYear1].hasOwnProperty(m)) {
                        payment.validation[monYear1][m] = monAmt1;
                    }
                }
                if (monAmt2 && month2 && monYear2) {
                    if (!payment.validation.hasOwnProperty(monYear2)) {
                        payment.validation[monYear2] = {};
                    }
                    var m = monthLevel[month2];
                    if (!payment.validation[monYear2].hasOwnProperty(m)) {
                        payment.validation[monYear2][m] = monAmt2;
                    }
                }
                if (monAmt3 && month3 && monYear3) {
                    if (!payment.validation.hasOwnProperty(monYear3)) {
                        payment.validation[monYear3] = {};
                    }
                    var m = monthLevel[month3];
                    if (!payment.validation[monYear3].hasOwnProperty(m)) {
                        payment.validation[monYear3][m] = monAmt3;
                    }
                }
            }
        });
        return payment.validation;
    }

        /**NETSFOPS-108**/
        function callSearchSuitelet(filters, columns, recordType) {
            debugger;
            // Prepare the request
            var request = {
                filters: JSON.stringify(filters),
                columns: JSON.stringify(columns),
                recordType: recordType
            };
        
            // Call the Suitelet
            var response = https.post({
                url: '/app/site/hosting/scriptlet.nl?script='+FILECONSTANT.BE_SEARCH_SUITELET_ID+'&deploy='+FILECONSTANT.BE_SEARCH_SUITELET_DEPLOYMENT_ID,
                body: request
            });
        
            // Get the response body
            var responseBody = response.body;
        
            // Parse the response
            var data = JSON.parse(responseBody);
            
            // Use the returned data
            console.log("Search Data: " + JSON.stringify(data));
    
            return data;
        }

    function onloadValidationDisable(currentRecord, onload) {

        var Btype = currentRecord.getField("custbody_business_type");
        var Ttype = currentRecord.getField("custbody_transaction_type");
        var month1 = currentRecord.getField("custbody_tax_month");
        var year = currentRecord.getField("custbody_tax_year");
        var amount = currentRecord.getField("custbody_tele_amount_1");
        var quarterly = currentRecord.getField("custbody_quarterly");
        var qutamt = currentRecord.getField("custbody_paymnt_amount1");
        var qutamt2 = currentRecord.getField("custbody_payment_amount2");
        var qutamt3 = currentRecord.getField("custbody_payment_amount3");
        var qutyear = currentRecord.getField("custbody_hotel_year_tax");
        var qutyear1 = currentRecord.getField("custpage_yearfield_quarterly");
        var year1 = currentRecord.getField("custpage_yearfield_month");
        var business = currentRecord.getValue({
            fieldId: "custbody_business_id",
        });
        // alert('business-'+business)

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
            fieldId: 'custpage_yearfield_month',
            value: 'empty',
            ignoreFieldChange: true
        });

        currentRecord.setValue({
            fieldId: 'custpage_yearfield_quarterly',
            value: 'empty',
            ignoreFieldChange: true
        });
        
        currentRecord.setValue({
            fieldId: 'custpage_custom_year_field',
            value: '',
            ignoreFieldChange: true
        });

        if (business) {
            //Btype.isDisabled = true;
            Ttype.isDisabled = true;
            var fieldLookUp = search.lookupFields({
                type: "customrecord_telephone_tax",
                id: business,
                columns: [
                    "custrecord_conf_tax_id_num",
                    "custrecord_rest_pay_period",
                ],
            });

            // log.debug("fieldLookUp", JSON.stringify(fieldLookUp));
            var taxnumber = fieldLookUp.custrecord_conf_tax_id_num;
            var paymentPeriod =
                fieldLookUp.custrecord_rest_pay_period[0].value;
            log.debug("paymentPeriod", paymentPeriod);
            currentRecord.setValue({
                fieldId: "custbody_tax_payer_id_num",
                value: taxnumber,
                ignoreFieldChange: true,
            });
            if (paymentPeriod == "1") {
                //monthly
                quarterly.isDisabled = true;
                qutamt.isDisabled = true;
                qutamt2.isDisabled = true;
                qutamt3.isDisabled = true;
                qutyear.isDisabled = true;
                qutyear1.isDisabled = true;
                month1.isDisabled = false;
                year.isDisabled = false;
                year1.isDisabled = false;
                amount.isDisabled = false;
            } else {
                // quarterly
                month1.isDisabled = true;
                year.isDisabled = true;
                year1.isDisabled = true;
                amount.isDisabled = true;

                quarterly.isDisabled = false;
                qutamt.isDisabled = false;
                qutamt2.isDisabled = false;
                qutamt3.isDisabled = false;
                qutyear.isDisabled = false;
                qutyear1.isDisabled = false;
            }
        } 
        else {
            // alert('else')
            Btype.isDisabled = true;
            Ttype.isDisabled = true;
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
            qutyear1.isDisabled = true;
            month1.isDisabled = true;
            year.isDisabled = true;
            year1.isDisabled = true;
            amount.isDisabled = true;
            if (onload == 'create') {

                currentRecord.setValue({
                    fieldId: "custbody_business_type",
                    value: 1,
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

    exports.pageInit = pageInit;
    exports.fieldChanged = fieldChanged;
    exports.saveRecord = saveRecord;
    return exports;
});