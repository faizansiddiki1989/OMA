/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 */
define(["N/record", "N/search", "N/runtime", "N/ui/dialog"], function (
  record,
  search,
  runtime,
  dialog
) {

  var FILECONSTANT = {
    PAYMENTFORMS: {
      'TELEPHONE': '203',
      'TOBACCO': '212',
      'RESTAURANT': '193',
      'HOTEL': '220'
    },
    TRANS_TYPE: {
      'MAIL': 1,
      'ONLINE': 2
    },
    TOBACCO_BUSINESSTYPE: 3,
    FOPS: {
      'DEPARTMENT': 106,
      'CLASS': 14
    }
  }

  var exports = {}
  //fieldChanged
  function fieldChanged(context) {
    if (runtime.executionContext == runtime.ContextType.USERINTERFACE) {
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
          if (context.fieldId == "custbody_tobc_busi_id") {
            if (formid == FILECONSTANT.PAYMENTFORMS.TOBACCO) {
              if (department == FILECONSTANT.FOPS.DEPARTMENT && deptClass == FILECONSTANT.FOPS.CLASS) {
                var Btype = currentRecord.getField('custbody_tobc_bus_type_tax');
                var Ttype = currentRecord.getField('custbody_tobc_trns_type_tax');
                var business = currentRecord.getValue({
                  fieldId: "custbody_tobc_busi_id",
                });
                if (business) {
                  Btype.isDisabled = true
                  Ttype.isDisabled = true
                  var fieldLookUp = search.lookupFields({
                    type: 'customrecord_tobac_tax',
                    id: business,
                    columns: [
                      'custrecord_tobc_cnf_tax_id'
                    ]
                  });


                  var taxnumber = fieldLookUp.custrecord_tobc_cnf_tax_id;
                  currentRecord.setValue({ fieldId: "custbody_tobc_tax_payer_id", value: taxnumber })
                  currentRecord.setValue({ fieldId: "custbody_business_type", value: FILECONSTANT.TOBACCO_BUSINESSTYPE })  //custbody_tobc_bus_type_tax this field is no longer present
                  currentRecord.setValue({ fieldId: "custbody_tobc_trns_type_tax", value: FILECONSTANT.TRANS_TYPE.MAIL })
                } else {
                  Btype.isDisabled = false
                  Ttype.isDisabled = false
                  currentRecord.setValue({ fieldId: "custbody_tobc_tax_payer_id", value: '' })
                }
              } else {
                var option = {
                  title: "Error",
                  message:
                    "please select department as 'FOPS', class as 'Toaco Tax'",
                };
                dialog.alert(option);
              }
            }
          }
          else if (context.fieldId == "custbody_tobc_reven_pri_busi" || context.fieldId == "custbody_tobc_reve_adjust_rev_tax_paid") {
            var btype = currentRecord.getValue({
              fieldId: "custbody_business_type",
            });
            if (department == FILECONSTANT.FOPS.DEPARTMENT && deptClass == FILECONSTANT.FOPS.CLASS && formid == FILECONSTANT.PAYMENTFORMS.TOBACCO && btype == FILECONSTANT.TOBACCO_BUSINESSTYPE) {
              var revenue = currentRecord.getValue({
                fieldId: "custbody_tobc_reven_pri_busi",
              });
              var adjustAmnt = currentRecord.getValue({
                fieldId: "custbody_tobc_reve_adjust_rev_tax_paid",
              });
              //  if(revenue){
              var totalrevenue = revenue + adjustAmnt;
              var fieldLookUp = search.lookupFields({
                type: 'customrecord_business_tax_rate',
                id: FILECONSTANT.TOBACCO_BUSINESSTYPE,
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
              var rate = ratepercantage ? ratepercantage : 3;
              var tax = percentage(totalrevenue, rate);
              var lessCollectionFee = percentage(tax, 2);
              var occTaxDue = tax - lessCollectionFee;
              currentRecord.setValue({
                fieldId: "custbody_tobc_net_rev_tax",
                value: totalrevenue
              });
              currentRecord.setValue({
                fieldId: "custbody_tobc_occ_perord_tax",
                value: tax
              });
              currentRecord.setValue({
                fieldId: "custbody_tobc_less_colet_tax",
                value: lessCollectionFee
              });
              currentRecord.setValue({
                fieldId: "custbody_tobc_occ_due_tax",
                value: occTaxDue
              });
              var getYear = currentRecord.getValue({
                fieldId: "custbodytobc_tax_year",
              });
              var getMonth = currentRecord.getValue({
                fieldId: "custbody_tobc_tax_month",
              });
              var dueDate = getDueDate(getYear, getMonth);
              var latefee = 0;
              if (dueDate) {
                var penalty = percentage(totalrevenue, '10').toFixed(2);
                currentRecord.setValue({
                  fieldId: "custbody_tobc_penlty_tax",
                  value: penalty
                });
                var interest = percentage(penalty, '1').toFixed(2);
                currentRecord.setValue({
                  fieldId: "custbody_tobc_int_tax",
                  value: penalty
                });
                latefee = parseFloat(penalty) + parseFloat(interest);
                currentRecord.setValue({
                  fieldId: "custbody_tobc_late_int_tax",
                  value: latefee
                });
              }
              var totaldue = (parseFloat(latefee) + parseFloat(totaldue)).toFixed(2);
              currentRecord.setValue({
                fieldId: "custbody_tobc_totl_due_pentl_tax",
                value: totaldue
              });

              //var includeCharges = parseFloat(totaldue) + parseFloat(charges);
              currentRecord.setValue({
                fieldId: "payment",
                value: totaldue
              });

            }
            else {
              var option = {
                title: "Error",
                message:
                  "please select department as 'FOPS', class as 'Tobaco Tax'",
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
  function percentage(num, per) {
    return (num / 100) * per;
  }
  function getDueDate(yearParam, monthParam) {
    var now = new Date(yearParam, monthParam - 1, 1);
    var dueDate = endOfMonth(now);
    var dueMonths = monthDiff(dueDate, new Date());
    return dueMonths

  }
  function monthDiff(dateFrom, dateTo) {
    return dateTo.getMonth() - dateFrom.getMonth() +
      (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
  }
  function endOfMonth(date) {

    return new Date(date.getFullYear(), date.getMonth() + 2, 0);

  }
  exports.fieldChanged = fieldChanged;
  return exports;
});
