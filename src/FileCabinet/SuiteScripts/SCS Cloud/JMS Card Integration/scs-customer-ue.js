/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', './jms_library', "N/url","N/runtime","N/search","N/error"],
    function(record, jms_library, url,runtime,search,error) {
        function beforeLoad(context) {
            var form = context.form;
            if(context.type == 'view') {
                var newRecord = context.newRecord;

                var jmsCusId = newRecord.getValue({fieldId: "custentity_jms_customer_id"});

                if(!jmsCusId){
                    var createCusURL = url.resolveScript({
                        scriptId: 'customscript_scs_jms_customer_sl',
                        deploymentId: 'customdeploy_scs_jms_customer_sl',
                        params: {recId: newRecord.id}
                    });

                    form.addButton({
                        id: 'custpage_create_jms_customer',
                        label: 'Create Customer in JMS',
                        functionName: "window.open('"+createCusURL+"', '_blank')"
                    });
                }

            }
        }
        function beforeSubmit(context) {
          log.debug({
            title: "runtime.ContextType before",
            details: runtime.ContextType,
          });
          log.debug({ title: "context.type", details: context.type });
          var oldRecord = context.oldRecord;
          
          // if(runtime.executionContext == runtime.ContextType.WEBSTORE){
          // email id validation for fops customer uniqe id

          var newRecord = context.newRecord;
          var email,flag;
          var isFops = newRecord.getValue({ fieldId: "category" });
          if(context.type == 'create') {

            log.debug('UPDATE STATUS')
            newRecord.setValue({
                fieldId: 'customform',
                value: 48
            });
            log.debug('UPDATED STATUS DONE')

           email = newRecord.getValue({ fieldId: "email" });
          }
          else if(context.type == 'edit') {
            var oldEmail  = oldRecord.getValue({ fieldId: "email" });
             email = newRecord.getValue({ fieldId: "email" });
            log.debug("old-email", oldEmail);
            log.debug('new email',email)
            if(oldEmail == email){
              flag = true
            }else{
              flag = false
            }
          }
          log.debug('isFops',isFops)
          log.debug('flag',flag)
          if(isFops == 1){
          log.debug("email", email);
          if (email && !flag) {
            var customerSearchObj = search.create({
   type: "customer",
   filters:
   [
      ["category","anyof","1"], 
      "AND", 
      ["email","is",email]
   ],
   columns:
   [
      search.createColumn({name: "email", label: "Email"}),
      search.createColumn({name: "altemail", label: "Alt. Email"})
   ]
});
var searchResultCount = customerSearchObj.runPaged().count;
log.debug("customerSearchObj result count",searchResultCount);
customerSearchObj.run().each(function(result){
   // .run().each has a limit of 4,000 results
  log.debug({
                title: "customer Name:",
                details: result.getValue({ name: "email" }),
              });
              var custEmail = result.getValue({ name: "email" });
              if (custEmail == email) {
               var myError = error.create({
         name: 'ERR_WS_CUSTOMER_LOGIN',
         message: 'Email id "'+ email + '" already exist. Please enter a different email address',
          notifyOff: false
     });
                throw myError.message
              } else {
                return true;
              }
});


          }
        }
        }

        function compareCustomerUpdate(newRecord, oldRecord) {
            var isPerson = newRecord.getValue({fieldId:"isperson"});
            var isUpdate = false;
            var firstName = "";
            var lastName = "";
            if(isPerson == "T"){
                firstName = newRecord.getValue({fieldId: "firstname"});
                lastName = newRecord.getValue({fieldId: "lastname"});

                if(newRecord.getValue({fieldId: "firstname"}) != oldRecord.getValue({fieldId: "firstname"}) ||
                    newRecord.getValue({fieldId: "lastname"}) != oldRecord.getValue({fieldId: "lastname"})){
                    isUpdate = true;
                }
            }else if(isPerson == "F"){
                var companyName = newRecord.getValue({fieldId: "companyname"});
                firstName = companyName.substring(0,1);
                lastName = companyName.substring(1,companyName.length);

                if(newRecord.getValue({fieldId: "companyname"}) != oldRecord.getValue({fieldId: "companyname"})){
                    isUpdate = true;
                }
            }
            return {
                isUpdate: isUpdate,
                firstName: firstName,
                lastName: lastName
            }

        }

        function afterSubmit(context) {
                    log.debug({title:'runtime.ContextType after',details:runtime.executionContext});
          log.debug({title:'web create',details:context.type})   
           
            if(context.type == "edit"){
                var newRecord = context.newRecord;
                var oldRecord = context.oldRecord;
               var custType = newRecord.getValue({fieldId: "custentity_customer_type"});
            log.debug({title:'custType edit',details:custType}) 
             if(!custType && runtime.executionContext == runtime.ContextType.WEBSTORE){
               log.debug({title:'custType ',details:'company'})
               record.submitFields({
                         type: "customer",
                         id: newRecord.id,
                         values: {
                             isperson: custType
                         }
                     });
             }
              
                var jmsId = newRecord.getValue({fieldId: "custentity_jms_customer_id"});
                var isUpdate = newRecord.getValue({fieldId: "custentity_jms_update_customer"});
                if(isUpdate){

                    if(jmsId){
                        var checkCustomer = compareCustomerUpdate(newRecord, oldRecord);
                        // if(checkCustomer.isUpdate){
                        //
                        // }
                            var updateCustomer = {};
                            updateCustomer.customerId = jmsId;
                            updateCustomer.firstName = checkCustomer.firstName;
                            updateCustomer.lastName = checkCustomer.lastName;

                            try{
                                var updateCustomerResult =  jms_library.updateCustomer(updateCustomer);
                                if(updateCustomerResult.success){
                                    log.debug("Update JMS customer complete", createCustomer);
                                }else{
                                    log.debug("Update JMS customer error", createCustomer);
                                }

                            }catch(e){
                                log.error("Update JMS customer error", e);
                            }
                    }
                    record.submitFields({
                        type: "customer",
                        id: newRecord.id,
                        values: {
                            custentity_jms_update_customer: false
                        }
                    });
                }
                
            }else if(context.type == "create" && runtime.executionContext == runtime.ContextType.WEBSTORE){
               log.debug({title:'WEBSTORE',details:context.type})  
               var newRecord = context.newRecord;
               var oldRecord = context.oldRecord;
               var category = newRecord.getValue({fieldId: "category"});
               log.debug({title:'category',details:category}) 
              if(category == 1){
              record.submitFields({
                         type: "customer",
                         id: newRecord.id,
                         values: {
                             customform: '48',
                           	entitystatus: '13',
                         }
                     }); 
              }
            }

        }
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };
    });