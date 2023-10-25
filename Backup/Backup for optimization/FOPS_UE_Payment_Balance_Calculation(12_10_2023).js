/**
 * @description This script will calculate balance and validate Tax Year field
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 **/

/************************************************************************
* File Name : FOPS_UE_Payment_Balance_Calculation.js
* Date      :
* Purpose   : This script will calculate balance and validate Tax Year field 
*
* History
* Date          Author        Details
* 19-04-2023    Faizan        Tax Year field fix 
* 01-05-2023    Faizan        Additional Location logic
* 22-05-2023    Faizan        NETSFOPS-158 : Busniess Name fix for list view
* 25-05-2023    Faizan        NETSFOPS-161 : Update Balance to be Paid
* 10-07-2023    Faizan        Add Tobacco Tax Field Mapping
* 04-08-2023    Faizan        Add Hotel Tax Field Mapping
***********************************************************************/

define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'], function(record, runtime, search, serverWidget) {
    
    const PAYMENTFORMS = {
        'TELEPHONE' : '203',
        'TOBACCO' : '212',
        'RESTAURANT': '193',
        'HOTEL':'220'
    }

    const BUSINESS_FIELD_MAP = {
        '193' :{
            'RECORD_ID' : 'customrecord_restaurant_tax',
            'BALANCE_FIELD' : 'custrecord_rest_tax_balance',
            'BUSINESS_FIELD' : 'custbody_rest_tax_bus_id',
            'BALANCE_UPDATE' : {'custrecord_rest_tax_balance':0},
            'SUBLIST_ID': 'recmachcustrecord_pd_customer_payment_link',
            'SUB_BUSINESSNAME': 'custrecord_pd_restaurant_business_name',
            'SUB_LOCATION': 'custrecord_pd_location',
            'SUB_AMOUNT': 'custrecord_pd_amount'
        },
        '203' :{
            'RECORD_ID' : 'customrecord_telephone_tax',
            'BALANCE_FIELD' : 'custrecord_balance',
            'BUSINESS_FIELD' : 'custbody_business_id',
            'BALANCE_UPDATE' : {'custrecord_balance':0},
            'SUBLIST_ID': '',
            'SUB_LOCATION': '',
            'SUB_AMOUNT': ''

        },
        '220' :{
            'RECORD_ID' : 'customrecord_hotel_motel_tax',
            'BALANCE_FIELD' : 'custrecord_hotel_balance_to_be_paid',
            'BUSINESS_FIELD' : 'custbody_hotel_busniess_name_id',
            'BALANCE_UPDATE' : {'custrecord_hotel_balance_to_be_paid':0},
            'SUBLIST_ID': '',
            'SUB_LOCATION': '',
            'SUB_AMOUNT': ''

        },
        '212' :{
            'RECORD_ID' : 'customrecord_tobacco_tax',
            'BALANCE_FIELD' : 'custrecord_tobc_tax_balance_to_be_paid',
            'BUSINESS_FIELD' : 'custbody_tobc_business_id',
            'BALANCE_UPDATE' : {'custrecord_tobc_tax_balance_to_be_paid':0},
            'SUBLIST_ID': 'recmachcustrecord_tobc_location_custmer_payment',
            'SUB_BUSINESSNAME': 'custrecord_tobc_location_business_name',
            'SUB_LOCATION': 'custrecord_tobc_payment_location',
            'SUB_AMOUNT': 'custrecord_tobc_location_amount'
        }
    };
    
    function beforeLoad(context) {
        try {
            const currentForm = context.form;
            const recCurrent = context.newRecord;


            log.debug('context.type', context.type);
            if (context.type == context.UserEventType.VIEW) {

                const recordForm = search.lookupFields({
                    type: recCurrent.type,
                    id: recCurrent.id,
                    columns: 'customform'
                });

                if(recordForm.customform[0].value == PAYMENTFORMS.RESTAURANT 
                    || recordForm.customform[0].value == PAYMENTFORMS.TOBACCO
                    || recordForm.customform[0].value == PAYMENTFORMS.HOTEL)
                    currentForm.clientScriptFileId = 45962;
                
                log.debug('formcustom', recordForm.customform[0].value);
                if (recordForm.customform[0].value == '203' || recordForm.customform[0].value == '212' || recordForm.customform[0].value == '220' || recordForm.customform[0].value == '193'|| recordForm.customform[0].value == '226') {

                    const invoice = currentForm.getSublist({
                        id: 'apply'
                    });
                    if (!isEmpty(invoice)) {
                        invoice.displayType = serverWidget.SublistDisplayType.HIDDEN;
                    }

                    const credit = currentForm.getSublist({
                        id: 'credit'
                    });
                    if (!isEmpty(credit)) {
                        credit.displayType = serverWidget.SublistDisplayType.HIDDEN;
                    }

                    const deposit = currentForm.getSublist({
                        id: 'deposit'
                    });
                    if (!isEmpty(deposit)) {
                        deposit.displayType = serverWidget.SublistDisplayType.HIDDEN;
                    }

                    const applyPrevBalance = recCurrent.getValue({
                        fieldId: 'custbody_prevbalance'
                    });
                    log.debug('applyPrevBalance', applyPrevBalance);
                    if(applyPrevBalance == false){
                      let totalBalToBePaid = currentForm.getField({
                        id: 'custbody_eb_total_balance_to_be_paid'
                      });
                      totalBalToBePaid.updateDisplayType({
                          displayType: serverWidget.FieldDisplayType.HIDDEN
                      });
                    }
                }
            } 
            else if (context.type !== context.UserEventType.VIEW) {				
             
                log.debug('Create or Update');
                let formId = recCurrent.getValue('customform');

                //Month Year field
                let taxYearField = currentForm.getField({
                    id: 'custbody_tax_year'
                });
                let monthYearValue = recCurrent.getValue({
                    fieldId: 'custbody_tax_year',
                });

                
                if(formId == PAYMENTFORMS.TELEPHONE)
                {
                    taxYearField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
    
                    let monthYearField = currentForm.addField({
                        id: 'custpage_yearfield_month',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Tax Year'
                    });
    
                    //Quarterly Year field
                    let quarterYear = currentForm.getField({
                        id: 'custbody_hotel_year_tax'
                    });
                    let quarterYearValue = recCurrent.getValue({
                        fieldId: 'custbody_hotel_year_tax',
                    });
    
                    quarterYear.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
    
                    let quarterYearField = currentForm.addField({
                        id: 'custpage_yearfield_quarterly',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Year'
                    });
                    monthYearField.addSelectOption({
                        value: 'empty',
                        text: ''
                    });
                    quarterYearField.addSelectOption({
                        value: 'empty',
                        text: ''
                    });
    
                    var mySearch = search.load({
                        id: 'customsearch_taxyears'
                    });
    
                    mySearch.run().each(function(result) {
                        var id = result.id;
    
                        var name = result.getValue({
                            name: 'name'
                        });
                        var selected = false;
    
                        if (monthYearValue == id) {
                            selected = true;
                        }
                        monthYearField.addSelectOption({
                            value: result.id,
                            text: name,
                            isSelected: selected
                        });
    
                        var selectedQuarter = false;
                        if (quarterYearValue == id) {
                            selectedQuarter = true;
                        }
                        quarterYearField.addSelectOption({
                            value: result.id,
                            text: name,
                            isSelected: selectedQuarter
                        });
    
                        return true;
                    });
    
                    currentForm.insertField({
                        field: monthYearField,
                        nextfield: 'custbody_tele_amount_1'
                    });
    
                    currentForm.insertField({
                        field: quarterYearField,
                        nextfield: 'custbody_paymnt_amount1'
                    });
    
                    addNewYear();

                }
                else if(formId == PAYMENTFORMS.RESTAURANT || formId == PAYMENTFORMS.TOBACCO || formId == PAYMENTFORMS.HOTEL)
                {
                    var selectedYear = recCurrent.getValue({
                        fieldId: 'custbody_tax_year',
                    });
                    
                    taxYearField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    var yearJsonArray = taxYearField.getSelectOptions({
                        filter : '0',
                        operator : 'greaterthan'
                    });

                    //CREATE CUSTOM YEAR FIELD
                    let customYearField = currentForm.addField({
                        id: 'custpage_custom_year_field',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Year'
                    });
                    customYearField.addSelectOption({
                        value: '',
                        text: ''
                    });

                    for(var i = yearJsonArray.length; i > 0; i--)
                    {
                        let selected = false;
                        if(selectedYear == yearJsonArray[i-1].value)
                            selected = true;

                            customYearField.addSelectOption({
                                value: yearJsonArray[i-1].value,
                                text: yearJsonArray[i-1].text,
                                isSelected : selected
                            });
                    }
                    
                    currentForm.insertField({
                        field: customYearField,
                        nextfield: 'custbody_quarterly'
                    });                  
                   
                    //Additional Location Logic
                    let busiRecObj = BUSINESS_FIELD_MAP[formId];
                    if(busiRecObj.SUBLIST_ID)
                    {
                        const resSublist = currentForm.getSublist({
                            sublistId: busiRecObj.SUBLIST_ID,
                            id:busiRecObj.SUBLIST_ID
                        });
                        log.debug('SUBLIST', ' GET SUBLIST ON RESTURANT CUSTOMER PAYMENT : ' + resSublist);
                        
                        const pd_businessid_field = resSublist.getField({
                            id: busiRecObj.SUB_BUSINESSNAME
                        });
    
                        pd_businessid_field.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                    }
                }
            }
        } catch (error) {
            log.error({
                title: 'beforeLoad',
                details: error.message
            });
        }
    }

    function beforeSubmit(context) {
        try {
            const currentForm = context.form;
            const recCurrent = context.newRecord;
            let monthValue = recCurrent.getValue({
                fieldId: 'custpage_yearfield_month',
            });
            if (monthValue !== 'empty') {
                recCurrent.setValue({
                    fieldId: 'custpage_yearfield_month',
                    value: monthValue
                });
            }

            let quarterValue = recCurrent.getValue({
                fieldId: 'custpage_yearfield_quarterly',
            });

            if (quarterValue !== 'empty') {
                recCurrent.setValue({
                    fieldId: 'custpage_yearfield_quarterly',
                    value: quarterValue
                });
            }

            //NETSFOPS-158
            let formId = recCurrent.getValue('customform');
            let recordMapObj = BUSINESS_FIELD_MAP[formId];
            let businessNameText = recCurrent.getValue('custbody_omh_business_name_text');
            log.debug('BEFORE SUBMIT', 'formId : '+formId+'   businessNameText : '+businessNameText+'   recordMapObj : '+recordMapObj );
            if(!businessNameText && recordMapObj){
                let businessId = recCurrent.getValue(recordMapObj.BUSINESS_FIELD);
                log.debug('BEFORE SUBMIT', 'businessId : '+businessId);

                let fieldLookUp = search.lookupFields({
                    type: recordMapObj.RECORD_ID,
                    id: businessId,
                    columns: 'name'
                  });
                let businessName = fieldLookUp.name;

                log.debug('beforeSubmit : Business Name ', businessName );
                if(businessName)
                    recCurrent.setValue('custbody_omh_business_name_text', businessName);
            }

            if(formId == PAYMENTFORMS.RESTAURANT || formId == PAYMENTFORMS.TOBACCO){

                let busiRecObj = BUSINESS_FIELD_MAP[formId];
                    

                let sublistCount = recCurrent.getLineCount({
                    sublistId: busiRecObj.SUBLIST_ID
                });
                log.debug('BEFORE SUBMIT', 'sublistCount : '+sublistCount);

                //REMOVE BLANK LINE ON PAYMENT
                if(sublistCount == 1){

                    let lineLocation = recCurrent.getSublistValue({
                        sublistId: busiRecObj.SUBLIST_ID,
                        fieldId: busiRecObj.SUB_LOCATION,
                        line: 0
                    });

                    let lineAmount = recCurrent.getSublistValue({
                        sublistId: busiRecObj.SUBLIST_ID,
                        fieldId: busiRecObj.SUB_AMOUNT,
                        line: 0
                    });
                
                    if(!lineLocation && !lineAmount)
                        recCurrent.removeLine({
                            sublistId: busiRecObj.SUBLIST_ID,
                            line: 0,
                            ignoreRecalc: true
                        });
                }
            }
        } 
        catch (error) {
            log.error({
                title: 'beforeSubmit',
                details: error.message
            });
        }
    }

    /**
     * @function afterSubmit Function to be executed after record is submitted to server.
     * @param {Object} context
     * @param {Record} context.newRecord  Record as submitted to server
     * @param {Record} context.oldRecord  Record as loaded from server
     * @param {String} context.type  The type of UE with which the record is being accessed (create, copy, edit)
     */

    function afterSubmit(context) {
        const recordObject = context.newRecord;
        const newBusiness = recordObject.getValue('custbody_business_id');
        const currentForm = recordObject.getValue('customform');
        log.debug('AFTER SUBMIT ', 'newBusiness  : '+newBusiness+'  TYPE :  '+context.type);

        // Only continue if Employee is verified:
        if (context.type == 'create' || context.type == 'copy') {
            

            //NETSFOPS-161 : UPDATE RESTAURENT RECORD WITH BALANCE
            if(currentForm == PAYMENTFORMS.RESTAURANT || currentForm == PAYMENTFORMS.HOTEL || currentForm == PAYMENTFORMS.TOBACCO)
                updateBusinessRecord(recordObject);
            else{
                if (isEmpty(newBusiness)) return;

                log.debug('process');
                var tax = recordObject.getValue('custbody_oma_rest_net_revenue');
                var checkAmount = recordObject.getValue('custbody_tele_check_amount');

                var apply = recordObject.getValue('custbody_prevbalance');
                log.debug('apply', apply);
                var oldBal;
                var newBal;
                if (apply == false) {
                    oldBal = search.lookupFields({
                        type: 'customrecord_telephone_tax',
                        id: newBusiness,
                        columns: 'custrecord_balance'
                    });
                    if (isEmpty(oldBal.custrecord_balance)) {
                        oldBal.custrecord_balance = 0;
                    }
                    newBal = Number(tax) - Number(checkAmount) + Number(oldBal.custrecord_balance);
                    log.debug('newBal', newBal);
                }else if (apply == true) {

                    newBal = Number(tax) - Number(checkAmount);
                    log.debug('newBal', newBal);
                }


                // Update Business record:
                const submitFieldsPromise = record.submitFields.promise({
                    type: 'customrecord_telephone_tax',
                    id: newBusiness,
                    values: {
                        'custrecord_balance': newBal
                    }
                });

                submitFieldsPromise.then(recID => {
                    log.debug('ID', recID);

                }).catch(message => {
                    log.error(`Unexpected error in createInvoice()`, message);
                });

            }

        } else if (context.type == 'delete') {
            log.debug('DELETE TRIGGER', 'START');

            const recordDelete = context.oldRecord;
            const formId = recordDelete.getValue('customform');
            let recordMapObj = BUSINESS_FIELD_MAP[formId];
            const oldBusiness = recordDelete.getValue(recordMapObj.BUSINESS_FIELD);
            var apply = recordDelete.getValue('custbody_prevbalance');
            
            log.debug('DELETE TRIGGER', 'formId : '+formId+'  oldBusiness : '+oldBusiness+'   apply : '+apply +'   recordMapObj : '+JSON.stringify(recordMapObj));

            var oldBal;
            var newBal;
            if (apply == false) {
                var balance = recordDelete.getValue('custbody_balance');
                oldBal = search.lookupFields({
                    type: recordMapObj.RECORD_ID,
                    id: oldBusiness,
                    columns: recordMapObj.BALANCE_FIELD
                });

                newBal = Number(oldBal[recordMapObj.BALANCE_FIELD]) - Number(balance);
                log.debug('newBal', newBal);
            }
            else if (apply == true) {

                oldBal = search.lookupFields({
                    type: recordMapObj.RECORD_ID,
                    id: oldBusiness,
                    columns: recordMapObj.BALANCE_FIELD
                });
                var prevBalance = recordDelete.getValue('custbody_eb_total_balance_to_be_paid');
                var addBalance = recordDelete.getValue('custbody_balance');
                if (isEmpty(oldBal[recordMapObj.BALANCE_FIELD])) {
                    oldBal[recordMapObj.BALANCE_FIELD] = 0;
                }
                newBal =  Number(oldBal[recordMapObj.BALANCE_FIELD]) +(Number(prevBalance) - Number(addBalance));
                log.debug('newBal', newBal);
            }

            recordMapObj.BALANCE_UPDATE[recordMapObj.BALANCE_FIELD] = newBal;

            const submitFieldsPromise = record.submitFields.promise({
                type: recordMapObj.RECORD_ID,
                id: oldBusiness,
                values: recordMapObj.BALANCE_UPDATE,
            });

            submitFieldsPromise.then(recID => {
                log.debug('ID', recID);

            }).catch(message => {
                log.error(`Unexpected error in createInvoice()`, message);
            });
        }
    }

    let isEmpty = (value) => {
        if (value === null) {
            return true;
        } else if (value === undefined) {
            return true;
        } else if (value === "") {
            return true;
        } else if (value === " ") {
            return true;
        } else if (value === "null") {
            return true;
        } else {
            return false;
        }
    }

    let addNewYear = () => {
        //Add new Year in custom record
        let todayDate = new Date();
        if (todayDate.getMonth() == '10') {

            let validateYear = todayDate.getFullYear() + 1;
            log.debug('todayDate.getFullYear()', todayDate.getFullYear());
            let customrecord_payment_due_yearsSearchObj = search.create({
                type: 'customrecord_fops_business_year',
                filters: [
                    ['name', 'is', validateYear.toString()]
                ],
                columns: [
                    search.createColumn({
                        name: 'name',
                        sort: search.Sort.DESC,
                        label: 'Name'
                    })
                ]
            });
            let searchResultCount = customrecord_payment_due_yearsSearchObj.runPaged().count;

            if (searchResultCount == 0) {
                let objRecord = record.create({
                    type: 'customrecord_fops_business_year',
                    isDynamic: true
                });

                objRecord.setValue({
                    fieldId: 'name',
                    value: validateYear.toString()
                });

                objRecord.save();

            }
        }
    }

    //UPDATE BUSINESS RECORD WITH BALANCE
    function updateBusinessRecord(recObj){

        let formId = recObj.getValue('customform');
        let isPrevApplied = recObj.getValue('custbody_prevbalance');
        let balance = recObj.getValue('custbody_balance');
        let finalBalance = 0;
        var recordMapObj = BUSINESS_FIELD_MAP[formId];
        log.debug('AFTERSUBMIT - updateBusinessRecord ', 'formId : '+formId+'  isPrevApplied :'+isPrevApplied+'  balance : '+balance)
        let businessId = recObj.getValue(recordMapObj.BUSINESS_FIELD);
        let updateFields = {};
        if(!isPrevApplied){
            let fieldLookUp = search.lookupFields({
                type: recordMapObj.RECORD_ID,
                id: businessId,
                columns: [recordMapObj.BALANCE_FIELD, 'name']
            });
            let restBalance = fieldLookUp[recordMapObj.BALANCE_FIELD];
            finalBalance = Number(restBalance) + Number(balance);
        }
        else
            finalBalance = balance;

        recordMapObj.BALANCE_UPDATE[recordMapObj.BALANCE_FIELD] = finalBalance;
           
        //UPDATE BALANCE
        log.debug('updateBusinessRecord', 'updateFields : '+JSON.stringify(updateFields)+'    Business ID : '+businessId);
        record.submitFields({
            type: recordMapObj.RECORD_ID,
            id: businessId,
            values: recordMapObj.BALANCE_UPDATE                 
        });
    }

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit
    };

});
