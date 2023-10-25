/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', "N/url","N/runtime","N/search","N/error"],
    function(record, url,runtime,search,error) {
        function beforeSubmit(context) {
          log.debug({
            title: "runtime.ContextType before",
            details: runtime.ContextType,
          });
          log.debug({ title: "web create before", details: context.type });
          
			var newRecord = context.newRecord;
          var newtaxnumber = newRecord.getValue({ fieldId: "custrecord_conf_tax_id_num" });
          log.debug("newtaxnumber", newtaxnumber);
         var taxnumber;
          if(context.type == "create"){
          taxnumber = newtaxnumber;
         }else{
           var oldRecord = context.oldRecord;
            var oldTaxnumber = oldRecord.getValue({ fieldId: "custrecord_conf_tax_id_num" });
            log.debug("oldTaxnumber", oldTaxnumber);
           if(oldTaxnumber == newtaxnumber) taxnumber = ''
           if(oldTaxnumber !=newtaxnumber) taxnumber = newtaxnumber
         }
          log.debug("taxnumber", taxnumber);
          if (taxnumber) {
            var customerSearchObj = search.create({
   type: "customrecord_telephone_tax",
   filters:
   [
      ["custrecord_conf_tax_id_num","is",taxnumber]
   ],
   columns:
   [
      search.createColumn({name: "custrecord_conf_tax_id_num", label: "CONFIRM TAX PAYER ID NUMBER"}),
   ]
});
var searchResultCount = customerSearchObj.runPaged().count;
log.debug("customerSearchObj result count",searchResultCount);
customerSearchObj.run().each(function(result){
   // .run().each has a limit of 4,000 results
  log.debug({
                title: "tax number:",
                details: result.getValue({ name: "custrecord_conf_tax_id_num" }),
              });
              var custTaxNumber = result.getValue({ name: "custrecord_conf_tax_id_num" });
              if (custTaxNumber == taxnumber) {
               var myError = error.create({
         name: 'ERR_WS_CUSTOMER_TAX_NUMBER',
         message: 'Tax Payer Id Number"'+ taxnumber + '"already exist. Please enter a different Tax Payer Id Number',
          notifyOff: false
     });
                throw myError.message
              } else {
                return true;
              }
});

          
        } /*else{
            var myError = error.create({
                name: 'ERR_WS_CUSTOMER_TAX_NUMBER',
                message: 'Tax Payer Id Number is empty. Please enter a Tax Payer Id Number',
                 notifyOff: false
            });
                       throw myError.message
        } */
       
    }

      
       
        return {
            beforeSubmit: beforeSubmit,
        };
    });