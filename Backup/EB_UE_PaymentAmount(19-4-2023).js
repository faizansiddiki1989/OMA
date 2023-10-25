/**
 * @description Transforms Employee to Customer when Employee is Verified
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'], function(record, runtime, search, serverWidget) {
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
            } else if (context.type !== context.UserEventType.VIEW) {
				
             
                log.debug('change');
                //Month Year field
                let monthYear = currentForm.getField({
                    id: 'custbody_tax_year'
                });
                let monthYearValue = recCurrent.getValue({
                    fieldId: 'custbody_tax_year',
                });

                // monthYear.updateDisplayType({
                //     displayType: serverWidget.FieldDisplayType.HIDDEN
                // });

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




        } catch (error) {
            log.error({
                title: 'beforeLoad_addButton',
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
        log.debug('newBusiness', newBusiness);
        log.debug('context.type', context.type);

        // Only continue if Employee is verified:

        if (context.type == 'create' || context.type == 'copy') {
    if (isEmpty(newBusiness)) return;

            log.debug('process');
            // Get data:
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
                },
            });

            submitFieldsPromise.then(recID => {
                log.debug('ID', recID);

            }).catch(message => {
                log.error(`Unexpected error in createInvoice()`, message);
            });
        } else if (context.type == 'delete') {
            const recordDelete = context.oldRecord;
            const oldBusiness = recordDelete.getValue('custbody_business_id');
            var apply = recordDelete.getValue('custbody_prevbalance');
            log.debug('delete', apply);
            log.debug('oldBusiness', oldBusiness);
            var oldBal;
            var newBal;
            if (apply == false) {
                var balance = recordDelete.getValue('custbody_balance');
                oldBal = search.lookupFields({
                    type: 'customrecord_telephone_tax',
                    id: oldBusiness,
                    columns: 'custrecord_balance'
                });

                newBal = Number(oldBal.custrecord_balance) - Number(balance);
                log.debug('newBal', newBal);
            }else if (apply == true) {

                oldBal = search.lookupFields({
                    type: 'customrecord_telephone_tax',
                    id: oldBusiness,
                    columns: 'custrecord_balance'
                });
                var prevBalance = recordDelete.getValue('custbody_eb_total_balance_to_be_paid');
                var addBalance = recordDelete.getValue('custbody_balance');
                if (isEmpty(oldBal.custrecord_balance)) {
                    oldBal.custrecord_balance = 0;
                }
                newBal =  Number(oldBal.custrecord_balance) +(Number(prevBalance) - Number(addBalance));
                log.debug('newBal', newBal);
            }

            const submitFieldsPromise = record.submitFields.promise({
                type: 'customrecord_telephone_tax',
                id: oldBusiness,
                values: {
                    'custrecord_balance': newBal
                },
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


    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit
    };

});
