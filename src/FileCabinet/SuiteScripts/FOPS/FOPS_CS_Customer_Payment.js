/**
 * @NApiVersion 2.x
 * @NScriptType clientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/url'],
    function (currentRecord, dialogobj, url) {
        function FopsDialog(context) {
            dialogobj.alert({ title: 'NetSuite Alert', message: 'You did open FOPS payment suitelet' });
        }
        // FIELD CHANGE FUNCTION
        function FOPSFieldChanged(context) {
            try {
                debugger;
                var currentRecord = context.currentRecord;
                var fieldName = context.fieldId;
                var sublistName = context.sublistId;

                var businessType = currentRecord.getValue({
                    fieldId: 'custpage_business_type'
                });

                log.debug('GET BUSINESS TYPE ID FROM SUITELET', businessType);

                var taxPayerId = currentRecord.getValue({
                    fieldId: 'custpage_tax_payer_id'
                });

                log.debug('GET TAX PYER ID FROM SUITELET', taxPayerId);

                var businessName = currentRecord.getValue({
                    fieldId: 'custpage_business_name'
                });

                log.debug('GET BUSINESS NAME FROM SUITELET', businessName);

                // GET URL FROM SUITELET
                var suiteletUrl = url.resolveScript({
                    scriptId: 'customscriptfops_sl_customer_payment',
                    deploymentId: 'customdeployfops_sl_customer_payment',
                    returnExternalUrl: false
                });

                log.debug('GET SUITELET URL', suiteletUrl);

                var params = {
                    'businesstype': businessType,
                    'taxPayerid': taxPayerId,
                    'businessname' :businessName
                };

                // Convert params object into a query string
                var paramString = Object.keys(params).map(function (key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                }).join('&');

                // Append the query string to the Suitelet URL
                var slUrl = suiteletUrl + '&' + paramString;

                // Redirect to the Suitelet URL with parameters
                window.location.href = slUrl;


            } catch (e) {
                log.error('GET LOG ERROR', e.toString());
            }
        }

        function backBtn(){
            debugger;
            window.history.back();
        }

        function FOPSSaveRecord(context)
        {
            var currentRecord = context.currentRecord;
     
        }

        return {
            // pageInit: FopsDialog,
            fieldChanged: FOPSFieldChanged,
            backBtn: backBtn,
            saveRecord : FOPSSaveRecord
        }
    });