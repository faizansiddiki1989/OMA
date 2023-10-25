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
    var exports = {
      defaultChanges: false,
      editType: false,
    };
    function pageInit(context){
     /* const currentRecord = context.currentRecord;
      const queryString = window.location.search;
         const urlParams = new URLSearchParams(queryString);
         const inv = urlParams.get('inv')
       const cf = urlParams.get('cf')
         //const inv = context.request.parameters['inv'];
           log.debug('inv',inv)
         if (inv && !cf) {
           //Add additional code
var fieldLookUp = search.lookupFields({
    type: search.Type.INVOICE,
    id: inv,
    columns: ['class', 'terms', 'memo', 'location','customform','custbody_row_lease_inv','custbody_effective_date','custbody_expiration_date']
});
           log.debug('fieldLookUp',fieldLookUp)
      var className = fieldLookUp.class[0].value;
    var terms = fieldLookUp.terms[0].value;
    var memo = fieldLookUp.memo;
     var location = fieldLookUp.location[0].value;
    var formId = fieldLookUp.customform[0].value;
    var leaseId = fieldLookUp.custbody_row_lease_inv.length ==1 ? fieldLookUp.custbody_row_lease_inv[0].value:'' ;
    var effective = fieldLookUp.custbody_effective_date;
    var expiration = fieldLookUp.custbody_expiration_date;
  	log.debug('class',className);
    log.debug('terms',terms);
   log.debug('memo',memo);
    log.debug('expiration',expiration);
    log.debug('effective',effective);     
         var customfrom = -1;
if(className == 7 && terms==7) { //  parking
  customfrom = 110;
  }
    else if(className == 10 && formId== 124) { // oversize permits
  customfrom = 156;
  }
  else if(className == 10 && terms==2) { // trafic permits
  customfrom = 155;
  }
  else if(className == 9 && terms==2) { // right-of-way leasing
  customfrom = 137;
  }
  else if(className == 8 && terms ==2) { // Meter hooding
  customfrom = 136;
  }
    else if(memo == 'Over Size/Over Weight Permit Fee') {  // oversize
  customfrom = 156;
  }
  else if(className == 16) {   // loading
  customfrom = 158;
  }
           
           if(customfrom) {
             var url = new URL(window.location.href);
var search_params = url.searchParams;

// add "topic" parameter
search_params.set('cf', customfrom);

url.search = search_params.toString();
var new_url = url.toString();
window.location.href = new_url;
  currentRecord.setValue({fieldId:'customform', value:customfrom,ignoreFieldChange:true});
    //nlapiSetFieldValue('memo', memo);
    if(leaseId)currentRecord.setValue({fieldId:'custbody_row_lease_inv', value:leaseId});

    if(effective){
    currentRecord.setValue({fieldId:'custbody_effective_date', value:formatDate(new Date(effective))});
  }
    if(expiration){
    currentRecord.setValue({fieldId:'custbody_expiration_date',value: formatDate(new Date(expiration))});
    }
  var formid = currentRecord.getValue({fieldId:'customform'});
  log.debug('formid',formid);
  }
           
           
           
           
         } */
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
          if(dept == 3){
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
   log.debug({
       title: 'object',
       details: 'defaultChanges:'+exports.defaultChanges + '-editType:'+ exports.editType
   })
      try {
        if ( (exports.defaultChanges && exports.editType) || (!exports.defaultChanges && exports.editType) ) {
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
  