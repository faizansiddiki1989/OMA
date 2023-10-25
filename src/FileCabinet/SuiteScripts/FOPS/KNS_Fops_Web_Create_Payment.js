/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/record", "N/search","N/https"], (record,search,https) => {

    function onRequest(context){
      log.debug('method',context.request.method)
      if(context.request.method === 'GET'){
            let resp = {
                success: true,
                result: ''
            };
            
            context.response.write(JSON.stringify(resp));
        }
        else if(context.request.method === 'POST') {
            const action = context.request.parameters.action;
            const bodyparam  = context.request.parameters.data;
            log.debug('action',action)
            log.debug('body',bodyparam)
            log.debug('body-type',typeof bodyparam)
            if(action ==='create_payment'){
                try{
                let body = JSON.parse(bodyparam);
                const paymentRecord = record.create({
                    type: record.Type.CUSTOMER_PAYMENT,
                    isDynamic: true
                });
                log.debug('body',body)
                log.debug('body.business',body.business)
                // primary info section
                paymentRecord.setValue({
                    fieldId: 'customform',
                    value: 226
                });
                paymentRecord.setValue({
                    fieldId: 'entity',
                    value: body.customer
                });
                paymentRecord.setValue({
                    fieldId: 'custbody_fops_payment_status',
                    value: 1
                })
                //
                paymentRecord.setValue({
                    fieldId: 'custbody_tax_payer_id_num',
                    value: body.taxnumber
                })
                paymentRecord.setValue({
                    fieldId: 'custbody_rest_tax_bus_id',
                    value: body.business
                })
                paymentRecord.setValue({
                    fieldId: 'custbody_transaction_type',
                    value: 2
                })
                
                //classification section
                paymentRecord.setValue({
                    fieldId: 'department',
                    value: 106
                });
                paymentRecord.setValue({
                    fieldId: 'class',
                    value: 12
                });
                //payment use section
                if(body.month){
                    paymentRecord.setValue({
                        fieldId: 'custbody_tax_month',
                        value: parseInt(body.month)+1
                    });
                    // paymentRecord.setValue({
                    //     fieldId: 'department',
                    //     value: 106
                    // });
                    paymentRecord.setValue({
                        fieldId: 'custbody_tele_amount_1',
                        value: parseFloat(body.primary_revenue)
                    });
                    paymentRecord.setValue({
                        fieldId: 'custbody_paymentperiod',
                        value: 1
                    })
                }else{
                    paymentRecord.setValue({
                        fieldId: 'custbody_quarterly',
                        value: body.quarter
                    });
                    // paymentRecord.setValue({
                    //     fieldId: 'department',
                    //     value: 106
                    // });
                    paymentRecord.setValue({
                        fieldId: 'custbody_quarterly_amount',
                        value: parseFloat(body.primary_revenue)
                    });
                    paymentRecord.setValue({
                        fieldId: 'custbody_paymentperiod',
                        value: 2
                    })
                }
                // revenu payment info section
                paymentRecord.setValue({
                    fieldId: 'custbody_rest_total_rev_add_loc',
                    value: parseFloat(body.totaladdtionalbusiness)
                });
                paymentRecord.setValue({
                    fieldId: 'custbody_provide_expl',
                    value: body.priorPeriodAdjustmentExpl
                });
                paymentRecord.setValue({
                    fieldId: 'custbody_oma_rest_total_revenue',
                    value: parseFloat(body.revenue_amt)
                });
                if(body.balanceapplied){
                    paymentRecord.setValue({
                        fieldId: 'custbody_prevbalance',
                        value: body.balanceapplied
                    });
                    paymentRecord.setValue({
                        fieldId: 'custbody_balance',
                        value: parseFloat(body.balance)
                    });
                }
                paymentRecord.setValue({
                    fieldId: 'custbody_rest_net_sub_tax',
                    value: parseFloat(body.net_revenue)
                });
                paymentRecord.setValue({
                    fieldId: 'custbody_rest_less_collection_fee',
                    value: parseFloat(body.collection_fee)
                });
                paymentRecord.setValue({
                    fieldId: 'custbody_rest_oc_due',
                    value: parseFloat(body.occupation)
                });
                //delinquent payment section
                paymentRecord.setValue({
                    fieldId: 'custbody_rest_penalty',
                    value: parseFloat(body.penality)
                });
                paymentRecord.setValue({
                    fieldId: 'custbody_rest_interest_tax',
                    value: parseFloat(body.interest)
                });
                paymentRecord.setValue({
                    fieldId: 'custbody_rest_late_fee_int',
                    value: parseFloat(body.late_fee_interest)
                });
                paymentRecord.setValue({
                    fieldId: 'custbody_rest_total_occ_enty',
                    value: parseFloat(body.occupation_due_late_fee)
                });
                // apply tab
                paymentRecord.setValue({
                    fieldId: 'payment',
                    value: parseFloat(body.occupation_due_late_fee)
                });
                // payment method tab
                paymentRecord.setValue({
                    fieldId: 'paymentmethod',
                    value: 1
                });

                const paymentRecordId = paymentRecord.save();
                let resp = {
                    success: true,
                    result: paymentRecordId
                };
                
                context.response.write(paymentRecordId);
            }catch(error){
                log.debug('error',error.message)
                context.response.write('{response:true}');
            }

            }
        }else{
          context.response.write('Method not allowed')
        }
    }
    return {
        onRequest: onRequest
    }
})