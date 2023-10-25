/**
 * @description This script will create void Journal Entry and apply it to Customer Payment
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 **/

/************************************************************************
* File Name : FOPS_UE_Void_Customer_Payments.js
* Date      :
* Purpose   : This script will create void Journal Entry and apply it to Customer Payment
*
* History
* Date          Author        Details
* 02-08-2023    Faizan        Initial Version 
***********************************************************************/

define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'], function(record, runtime, search, serverWidget) {
    
    const PAYMENTFORMS = {
        'TELEPHONE' : '203',
        'TOBACCO' : '212',
        'RESTAURANT': '193',
        'HOTEL':'220'
    }

    const STATUS_VOID = '5';
    const TRANSACTION_MAILIN = '1';
    const FORMS_JEVOID = '233';
    const ACCOUNT_UNDEPOSITED = '115';
    
    const BUSINESS_FIELD_MAP = {
        '193' :{
            'RECORD_ID' : 'customrecord_restaurant_tax',
            'BALANCE_FIELD' : 'custrecord_rest_tax_balance',
            'BUSINESS_FIELD' : 'custbody_rest_tax_bus_id'
        },
        '203' :{
            'RECORD_ID' : 'customrecord_telephone_tax',
            'BALANCE_FIELD' : 'custrecord_balance',
            'BUSINESS_FIELD' : 'custbody_business_id',
        },
        '220' :{
            'RECORD_ID' : 'customrecord_hotel_motel_tax',
            'BALANCE_FIELD' : 'custrecord_hotel_balance_to_be_paid',
            'BUSINESS_FIELD' : 'custbody_hotel_busniess_name_id',
        },
        '212' :{
            'RECORD_ID' : 'customrecord_tobacco_tax',
            'BALANCE_FIELD' : 'custrecord_tobc_tax_balance_to_be_paid',
            'BUSINESS_FIELD' : 'custbody_tobc_business_id'
        }
    };
    

    function voidCP_AfterSubmit(context) {
        try {
            log.debug('AFTER SUBMIT', 'TRIGGERED');

            const newRec = context.newRecord;
            let newRecId = newRec.id;            
            let newStatus = newRec.getValue('custbody_fops_payment_status');
            let newTransactionType = newRec.getValue('custbody_transaction_type');

            const oldRecord = context.oldRecord;
            let oldStatus = oldRecord.getValue('custbody_fops_payment_status');
            log.debug('AFTER SUBMIT', '  oldStatus : ' + oldStatus + ' newStatus : ' + newStatus+'   newTransactionType : '+newTransactionType);

            if (oldStatus != STATUS_VOID && newStatus == STATUS_VOID && newTransactionType == TRANSACTION_MAILIN ) 
            {
                let customerPaymentId = newRec.getValue('tranid');
                let payAmount = newRec.getValue('payment');
                let customer = newRec.getValue('customer');
                let arAccount = newRec.getValue('aracct');
                let account = newRec.getValue('account'); 
                let formId = newRec.getValue('customform');
                if(!account)
                    account = ACCOUNT_UNDEPOSITED;

                let headerClass = newRec.getValue('class');
                let hearderDepartment = newRec.getValue('department');

                //GET BUSINESS BALANCE
                let dynamicRecObj = BUSINESS_FIELD_MAP[formId];
                let customerPayBal = newRec.getValue('custbody_balance');
                let businessName = newRec.getValue(dynamicRecObj.BUSINESS_FIELD);
                let lookupOnBusinessRec = search.lookupFields({
                    type: dynamicRecObj.RECORD_ID,
                    id: businessName,
                    columns: [dynamicRecObj.BALANCE_FIELD]
                });

                let balaceToBePaid = lookupOnBusinessRec[dynamicRecObj.BALANCE_FIELD];
                log.debug('AFTER SUBMIT', ' BALACE TO BE PAID : ' + balaceToBePaid);

                // CALCULATE UPDATE BALANCE
                let updatedBalance = Number(balaceToBePaid) - Number(customerPayBal);
                log.debug('AFTER SUBMIT', 'UPDATE BALANCE : ' + updatedBalance);


                log.debug('AFTER SUBMIT', ' CUSTOMER PAYMENT ID : ' + customerPaymentId + ' PAYMENT AMOUNT : ' + payAmount + ' CUSTOMER : ' + customer + ' A/R ACCOUNT : ' + arAccount + ' ACCOUNT : ' + account+'  headerClass : '+headerClass+'  hearderDepartment : '+hearderDepartment);

                // CREATE JOURNAL ENTRY
                var journalEntry = record.create({
                    type: 'journalentry'
                });

                // SET FIELDS VALUES ON JOURNAL ENTRY FORM
                journalEntry.setValue({
                    fieldId: 'customform',
                    value: FORMS_JEVOID,
                    ignoreFieldChange: true
                });

                journalEntry.setValue({
                    fieldId: 'trandate',
                    value: new Date(),
                    ignoreFieldChange: true
                });

                journalEntry.setValue({
                    fieldId: 'memo',
                    value: 'VOID JOURNAL : CUSTOMER PAYMENT - ' + customerPaymentId,
                    ignoreFieldChange: true
                });

                journalEntry.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    line: 0,
                    value: account
                });

                journalEntry.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    line: 0,
                    value: payAmount
                });

                journalEntry.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    line: 0,
                    value: customer
                });

                journalEntry.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    line: 0,
                    value: headerClass
                });

                journalEntry.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    line: 0,
                    value: hearderDepartment
                });

                // ADD DEBIT LINE
                journalEntry.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    line: 1,
                    value: arAccount
                });


                journalEntry.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    line: 1,
                    value: payAmount
                });

                journalEntry.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    line: 1,
                    value: customer
                });

                journalEntry.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    line: 1,
                    value: headerClass
                });

                journalEntry.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    line: 1,
                    value: hearderDepartment
                });

                let JEID = journalEntry.save();
                log.debug('JOURNAL ENTRY', 'Created : Internal ID - '+JEID);

                // LOAD CUSTOMER PAYMENT
                var custPaymentObj = record.load({
                    type: 'customerpayment',
                    id: newRecId,
                    isDynamic: false
                });
                
                let lineCount = custPaymentObj.getLineCount('apply');
                let applyTranId = '';
                let isTranApplied = false;
                for(var i = 0; i < lineCount; i++)
                {
                    isTranApplied = custPaymentObj.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        line: i
                    });

                    applyTranId = custPaymentObj.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'internalid',
                        line : i
                    });

                    log.debug('AFTER SUBMIT',' APPLY SUBLIST : isTranApplied : ' + isTranApplied+'  applyTranId : '+applyTranId+' Line : '+i);

                    if(isTranApplied)   
                    {
                        custPaymentObj.setSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            line : i,
                            value : false
                        });
                    }
                    
                    if(applyTranId == JEID)
                    {
                        custPaymentObj.setSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            line : i,
                            value : true
                        });
                    }
                }

                var updateCustomerPay = custPaymentObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('UPDATE CUSTOMER PAYMENT',updateCustomerPay);

                var balanceField = dynamicRecObj.BALANCE_FIELD;

                // SUBMIT FIELD BALANCE TO BE PAID ON THE BUSINESS RECORD 
                record.submitFields({
                    type: dynamicRecObj.RECORD_ID,
                    id: businessName,
                    values: {
                        [balanceField] : updatedBalance
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            }

        } catch (error) {
            log.error('AFTER SUBMIT', error.toString());
        }
    }
    
    return {
        afterSubmit : voidCP_AfterSubmit
    };

});
