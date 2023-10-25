/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/url', 'N/search', 'N/currentRecord', 'N/ui/message', 'N/ui/dialog'], function(url, search, currentRecord, message, dialog) {

    function saveRecord(context) {
        debugger;
        var objRecord = context.currentRecord;
        var hasDuplicate = '';

        var dueDate = objRecord.getValue({
            fieldId: 'custrecord_fops_due_date'
        });

        var taxYear = objRecord.getText({
            fieldId: 'custpage_yearfield'
        });

        var taxType = objRecord.getValue({
            fieldId: 'custrecord_tax_type'
        });

        var taxPeriod = objRecord.getValue({
            fieldId: 'custpage_taxfield'
        });

        var paymentPeriod = objRecord.getValue({
            fieldId: 'custrecord_fops_payemnt_period'
        });
		if(isEmpty(paymentPeriod)||taxPeriod=='1'||isEmpty(taxType)||isEmpty(taxYear)||isEmpty(dueDate)){
			var options = {
                        title: 'Mandatory Field',
                        message: 'Please populate mandatory fields'
                    };

                    dialog.alert(options);
			return;
		}
		
		if (!isEmpty(dueDate)) {
				
				if(taxPeriod=='1'||isEmpty(paymentPeriod)||isEmpty(taxYear)){
					var options = {
                        title: 'Mandatory Field',
                        message: 'Please populate Year, Payment Period and Tax Period field'
                    };

                    dialog.alert(options);
					objRecord.setValue({
                        fieldId: 'custrecord_fops_due_date',
                        value: ''
                    });
					return;
				}

                var dueMonth = (dueDate.getMonth() + 1);
                var dueYear = dueDate.getFullYear();

                taxPeriod = (taxPeriod - 1);
                log.debug('', taxPeriod + ',' + taxYear + ',' + dueMonth + ',' + dueYear)

                if (Number(taxYear) == Number(dueYear)) {
					log.debug('pasok year',paymentPeriod);
                    if (paymentPeriod == '1') {
						log.debug('Monthly',taxPeriod+','+dueMonth);
                        if (!(Number(taxPeriod) < Number(dueMonth))) {

                            objRecord.setValue({
                                fieldId: 'custrecord_fops_due_date',
                                value: ''
                            });
                            var options = {
                                title: 'Invalid Due Date',
                                message: 'Please Change Due Date'
                            };

                            dialog.alert(options);
							return;
                        }
                    } else {
						if((dueMonth-(taxPeriod*3))<=0){
							 objRecord.setValue({
                                fieldId: 'custrecord_fops_due_date',
                                value: ''
                            });
                            var options = {
                                title: 'Invalid Due Date',
                                message: 'Please Change Due Date'
                            };

                            dialog.alert(options);
							return;
						}
                    }

                } else if (Number(taxYear) > Number(dueYear)){
                    objRecord.setValue({
                        fieldId: 'custrecord_fops_due_date',
                        value: ''
                    });

                    var options = {
                        title: 'Invalid Due Date',
                        message: 'Please Change Due Date'
                    };

                    dialog.alert(options);
					return;
                }

            }
		
        dueDate = (dueDate.getMonth() + 1) + '/' + dueDate.getDate() + '/' + dueDate.getFullYear();
		taxPeriod = objRecord.getText({
            fieldId: 'custpage_taxfield'
        });
		
		taxYear = objRecord.getValue({
            fieldId: 'custpage_yearfield'
        });
        log.debug('test', paymentPeriod + ',' + taxPeriod + ',' + taxType + ',' + taxYear + ',' + dueDate);
		
        var customrecordfops_payments_due_datesSearchObj = search.create({
            type: "customrecordfops_payments_due_dates",
            filters: [
                ["custrecord_payment_due_year", "anyof", taxYear],
                "AND",
                ["custrecord_tax_type", "anyof", taxType],
                "AND",
                ["custrecord_fops_payemnt_period", "anyof", paymentPeriod],
                "AND",
                ["custrecord_tax_period", "is", taxPeriod]
            ],
            columns: [
                search.createColumn({
                    name: "scriptid",
                    sort: search.Sort.ASC,
                    label: "Script ID"
                }),
                search.createColumn({
                    name: "custrecord_payment_due_year",
                    label: "Year"
                }),
                search.createColumn({
                    name: "custrecord_tax_type",
                    label: "Tax Type"
                }),
                search.createColumn({
                    name: "custrecord_fops_payemnt_period",
                    label: "Payment Period"
                })
            ]
        });
		
		if(!objRecord.isNew){
			customrecordfops_payments_due_datesSearchObj.filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.NONEOF,
                    values: objRecord.id
            }));
		}

        customrecordfops_payments_due_datesSearchObj.run().each(function(result) {
            hasDuplicate = result.id
            return true;
        });


        if (hasDuplicate) {
            var url = new URL(window.location.href.split('?')[0]);
            var refreshUrl = url + '?id=' + hasDuplicate+'&rectype=160'
            var confirmMsg = message.create({
                title: '',
                message: 'Duplicate Record found. <a href="' + refreshUrl + '">View the Existing Record</a>.',
                type: message.Type.WARNING
            });
            confirmMsg.show();
            return false;
        } else {
            return true;
        }
    }

    function fieldChanged(scriptContext) {

        var currentRecord = scriptContext.currentRecord;
        var fieldName = scriptContext.fieldId;

        if (fieldName == 'custrecord_fops_due_date') {
            var dueDate = currentRecord.getValue({
                fieldId: 'custrecord_fops_due_date'
            });

            if (!isEmpty(dueDate)) {

                var taxPeriod = currentRecord.getValue({
                    fieldId: 'custpage_taxfield'
                });

                var taxYear = currentRecord.getText({
                    fieldId: 'custpage_yearfield',
                });

                var paymentPeriod = currentRecord.getValue({
                    fieldId: 'custrecord_fops_payemnt_period',
                });
				
				if(taxPeriod=='1'||isEmpty(paymentPeriod)||isEmpty(taxYear)){
					var options = {
                        title: 'Mandatory Field',
                        message: 'Please populate Year, Payment Period and Tax Period field'
                    };

                    dialog.alert(options);
					currentRecord.setValue({
                        fieldId: 'custrecord_fops_due_date',
                        value: ''
                    });
					return;
				}

                var dueMonth = (dueDate.getMonth() + 1);
                var dueYear = dueDate.getFullYear();

                taxPeriod = (taxPeriod - 1);
                log.debug('', taxPeriod + ',' + taxYear + ',' + dueMonth + ',' + dueYear)

                if (Number(taxYear) == Number(dueYear)) {
					log.debug('pasok year',paymentPeriod);
                    if (paymentPeriod == '1') {
						log.debug('Monthly',taxPeriod+','+dueMonth);
                        if (!(Number(taxPeriod) < Number(dueMonth))) {

                            currentRecord.setValue({
                                fieldId: 'custrecord_fops_due_date',
                                value: ''
                            });
                            var options = {
                                title: 'Invalid Due Date',
                                message: 'Please Change Due Date'
                            };

                            dialog.alert(options);
                        }
                    } else {
						if((dueMonth-(taxPeriod*3))<=0){
							 currentRecord.setValue({
                                fieldId: 'custrecord_fops_due_date',
                                value: ''
                            });
                            var options = {
                                title: 'Invalid Due Date',
                                message: 'Please Change Due Date'
                            };

                            dialog.alert(options);
						}
                    }

                } else if (Number(taxYear) > Number(dueYear)){
                    currentRecord.setValue({
                        fieldId: 'custrecord_fops_due_date',
                        value: ''
                    });

                    var options = {
                        title: 'Invalid Due Date',
                        message: 'Please Change Due Date'
                    };

                    dialog.alert(options);
                }

            }

        }
    }

    function isEmpty(value) {
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

    return {
        //fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
});