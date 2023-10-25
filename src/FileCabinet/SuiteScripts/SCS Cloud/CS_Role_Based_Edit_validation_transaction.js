/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 */
 define(["N/record", "N/search", "N/runtime", "N/ui/dialog","N/format"], function (
    record,
    search,
    runtime,
    dialog,
   format
  ) {

    //IMPLEMETED THE HARDCODING ON TOP
    var FILECONSTANT = {
      'DEPARTMENT_PARKING': 3
    };

    var exports = {
      defaultChanges: false,
      editType: false,
    };
    function pageInit(context){
    
    }
   function formatDate(testDate){
        log.debug('testDate: '+testDate);
        var responseDate = format.format({value:testDate,type:format.Type.DATE});
        log.debug('responseDate: '+responseDate);
          return responseDate
      }
   //fieldChanged
    function fieldChanged(context) {
      try {
        var currentRecord = context.currentRecord;
        var sublistId = context.sublistId;
        var lockRecord = currentRecord.getValue({
          fieldId: "custbody_lock_transaction",
        });
        var formId = currentRecord.getValue({
          fieldId: "customform",
        });
        var dept = currentRecord.getValue({
          fieldId: "department",
        });
        var userObj = runtime.getCurrentUser();
        var role = userObj.role;
        log.debug('user role ', role);
        log.debug({
            title: 'field-sublist',
            details: context.fieldId + '-' + context.sublistId
        })
        var option = {
          title: "Insufficient Permission",
          message:
            "You do not have sufficient permission to change this field. Please contact with Administrator",
        };
        //role 3 admin  
        // && role !=3
        if (lockRecord && role !=3) {
          if(dept == FILECONSTANT.DEPARTMENT_PARKING){
          if (currentRecord.type == "invoice" || currentRecord.type == "customerrefund") {
            
            if (
              context.fieldId == "memo" ||
              context.fieldId == "tobeprinted" ||
              context.fieldId == "tobeemailed" ||
              context.fieldId == "tobefaxed" ||
              context.fieldId == "messagesel" ||
              context.fieldId == "message" || 
              context.fieldId ==='email'
            ) {
              exports.defaultChanges = true;
            } else {
             // exports.defaultChanges = true;
              exports.editType = true;
              dialog.alert(option);
             // log.debug('exp',JSON.stringify(exports))
            
             // trying to prevent change other field value 
              /*currentRecord.setValue({
                  fieldId: context.fieldId,
                  value: '',
                  ignoreFieldChange: true,
              })*/
            }
          }
          else if(currentRecord.type=='creditmemo'){
            if (
                sublistId =='apply' ||
                context.fieldId =='discountrate' ||
                context.fieldId == "memo" ||
                context.fieldId == "tobeprinted" ||
                context.fieldId == "tobeemailed" ||
                context.fieldId == "tobefaxed" ||
                context.fieldId == "messagesel" ||
                context.fieldId == "message"
              ) {
                exports.defaultChanges = true;
              } else {
               // exports.defaultChanges = true;
                exports.editType = true;
                dialog.alert(option);
              }
          }
          else if(currentRecord.type == "customerpayment"){
           	
            if(context.fieldId == "memo" || context.fieldId == "custbody_effective_date" || context.fieldId == "custbody_expiration_date"){
                exports.defaultChanges = true;
            }else{
                exports.editType = true;
                dialog.alert(option);
            }
          }
           else {
             alert(1)
              //other transaction records like deposit/customer payment/credit memo
            if (context.fieldId == "memo") {
              exports.defaultChanges = true;
              //exports.editType = true;
            } else {
              //exports.defaultChanges = false;
              exports.editType = true;
              dialog.alert(option);
            }
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
    function saveRecord(context) {
      
      console.log('defaultChanges:     '+exports.defaultChanges + '   -editType  :'+ exports.editType);

      var currentRecord = context.currentRecord;
      var dept = currentRecord.getValue({
        fieldId: "department"
      });      

      try {
        if (dept == FILECONSTANT.DEPARTMENT_PARKING && (exports.defaultChanges && exports.editType) || (!exports.defaultChanges && exports.editType) ) {
          dialog.alert({
            title: "Insufficient Permission",
            message:
              "You do not have sufficient permission to change this field on this record. Please contact with administrator. \n\n Please reload/refresh the window. ",
          }); 
          
         return false
          
        } else {
          return true;
        }
      } catch (e) {
        log.error({
          title: e.name,
          details: e.message,
        });
      }
    }
    function sublistChanged(Scriptcontext) {
        var cRecord = Scriptcontext.currentRecord;
        var sublistId = Scriptcontext.sublistId;
        var options = {
          title: 'Hello!',
          message: 'sublistChanged Triggered!'
          };
          try {
          // dialog.alert(options);
          dialog.alert ({
            title: 'Success',
            message: 'cRecord: '+cRecord+' sublistid: '+sublistId
           });
           //return true;
          } 
          catch (e) {
           log.error ({
             title: e.name,
               details: e.message
          });
         }
       }
    exports.fieldChanged = fieldChanged;
    exports.pageInit = pageInit;
    exports.saveRecord = saveRecord;
   // exports.sublistChanged = sublistChanged;
    return exports;
  });
  