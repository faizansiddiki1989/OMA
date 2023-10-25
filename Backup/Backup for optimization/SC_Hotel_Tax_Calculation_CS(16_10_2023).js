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
  var exports = {}
  //fieldChanged
    function fieldChanged(context) {
      if (runtime.executionContext == runtime.ContextType.USERINTERFACE){
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
        
            
        if(currentRecord.type == "customerpayment"){
          if(context.fieldId == "custbody_hotel_busniess_name_id"){
               if(formid == 220) {
                if(department == 106 && deptClass == 15){
                var Btype = currentRecord.getField('custbody_business_type');
                var Ttype = currentRecord.getField('custbody_transaction_type');
                var business = currentRecord.getValue({
                    fieldId: "custbody_hotel_busniess_name_id",
                  }); 
                  if(business){
                    Btype.isDisabled = true
                    Ttype.isDisabled = true
                  var fieldLookUp = search.lookupFields({
                    type: 'customrecord_hotel_motel_tax',
                    id: business,
                    columns: [
                        'custrecord_hotel_cnf_tax_pay_id'
                        ]
                });
                

                  var taxnumber = fieldLookUp.custrecord_hotel_cnf_tax_pay_id;
                  currentRecord.setValue({fieldId: "custbody_hotel_tax_payer_id",value: taxnumber})
                  currentRecord.setValue({fieldId: "custbody_business_type",value: 4})
                  currentRecord.setValue({fieldId: "custbody_transaction_type",value: 1})

              }else{
                Btype.isDisabled = false
                Ttype.isDisabled = false
                currentRecord.setValue({fieldId: "custbody_hotel_tax_payer_id",value: ''})
              }
               }else{
                var option = {
                    title: "Error",
                    message:
                      "please select department as 'FOPS', class as 'Hotel/Motel Tax'",
                  };
                dialog.alert(option);
            } 
          }
          }
          else if(context.fieldId == "custbody_hotel_totaol_revenue_room_tax" || context.fieldId == "custbody_hotel_revenue_notsujt_tax" || context.fieldId == "custbody_hotel_adjust_prior_month_tax"){
              var btype = currentRecord.getValue({
                fieldId: "custbody_business_type",
              });
              if (department == 106 && deptClass == 15 && formid == 220 && btype ==4) {
                var revenue = currentRecord.getValue({
                    fieldId: "custbody_hotel_totaol_revenue_room_tax",
                  }); 
                  var lessRevenue = currentRecord.getValue({
                    fieldId: "custbody_hotel_revenue_notsujt_tax",
                  });
                  var adjustAmnt = currentRecord.getValue({
                    fieldId: "custbody_hotel_adjust_prior_month_tax",
                  }); 
                //  if(revenue){
                    var totalrevenue = (revenue-lessRevenue)+adjustAmnt;
                    var fieldLookUp = search.lookupFields({
                      type: 'customrecord_business_tax_rate',
                      id: '5',
                      columns: [
                          'custrecord35'
                          ]
                  });
                  var ratepercantage  = fieldLookUp.custrecord35;
                  log.debug({
                    title: 'rate',
                    details: ratepercantage
                  });
                  ratepercantage = ratepercantage.replace('%','');
                  var rate = ratepercantage ? ratepercantage : 5.5;
                      var tax = percentage(totalrevenue,rate);
                      var lessCollectionFee = percentage(tax,2);
                      var occTaxDue = tax- lessCollectionFee;
                      currentRecord.setValue({
                        fieldId: "custbody_hotel_nettax_revenue_currmon",
                        value: totalrevenue
                      });
                      currentRecord.setValue({
                        fieldId: "custbody_hotel_occupation_tax_due",
                        value: tax
                      });
                      currentRecord.setValue({
                        fieldId: "custbody_hotel_less_coll_fee_tax",
                        value: lessCollectionFee
                      });
                      currentRecord.setValue({
                        fieldId: "custbody_hotel_less_coll_fee_tax",
                        value: occTaxDue
                      });
                      var getYear = currentRecord.getValue({
                        fieldId: "custbody_hotel_year_tax",
                      }); 
                      var getMonth = currentRecord.getValue({
                        fieldId: "custbody_hotel_month",
                      }); 
                     var dueDate =  getDueDate(getYear,getMonth);
                     var latefee = 0;
      if(dueDate){
        var penalty = percentage(totalrevenue,'10').toFixed(2);
        currentRecord.setValue({
          fieldId: "custbody_hotel_penality_tax",
          value: penalty
        });
        var interest = percentage(penalty,'1').toFixed(2);
        currentRecord.setValue({
          fieldId: "custbody_hotel_interest_tax",
          value: penalty
        });
         latefee =  parseFloat(penalty) + parseFloat(interest);
         currentRecord.setValue({
          fieldId: "custbody_hotel_total_penlty_interest",
          value: latefee
        });
      }
      var totaldue =  ( parseFloat(latefee) + parseFloat(totaldue) ).toFixed(2);
      currentRecord.setValue({
        fieldId: "custbody_hotel_totaltax_latefee",
        value: totaldue
      });
      
      //var includeCharges = parseFloat(totaldue) + parseFloat(charges);
                     
                      currentRecord.setValue({
                        fieldId: "payment",
                        value: totaldue
                      });
                    
                 }
           else{
              var option = {
                    title: "Error",
                  message:
                    "please select department as 'FOPS', class as 'Hotel/Motel Tax'",
                };
              dialog.alert(option);
          } 
        }
        
      } 
    }catch (e) {
        log.error({
          title: e.name,
          details: e.message,
        });
      }
    }
    }
    function percentage(num, per){
      return (num/100)*per;
    }
    function getDueDate(yearParam,monthParam){
      var now = new Date(yearParam,monthParam-1,1);
      var dueDate = endOfMonth(now);
      var dueMonths = monthDiff(dueDate,new Date());
      return dueMonths

  }
   function monthDiff(dateFrom, dateTo) {
    return dateTo.getMonth() - dateFrom.getMonth() + 
      (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
   }
  function endOfMonth (date)
  {
     
  return new Date(date.getFullYear(), date.getMonth() + 2, 0);
 
  }
    exports.fieldChanged = fieldChanged;
    return exports;
  });
