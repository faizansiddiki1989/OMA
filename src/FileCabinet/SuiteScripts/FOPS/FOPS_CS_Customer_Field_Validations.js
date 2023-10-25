/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 */

/***********************************************************************************
 * File Name  : FOPS_CS_Field_Validations.js
 * Purpose    : This script to validate the fields on Customer Record based on FOPS : NETSFOPS-76
 * Date       : 26th Jan 2023
 * Author     : Faizan Siddiki
 * 
 * 
 * History
 * Date             Author              Details
 *              
 *************************************************************************************/

define(["N/record", "N/search", "N/runtime", "N/ui/dialog", "N/error"],
    function(record, search, runtime, dialog, error) {

        var exports = {};
        var fields = [{
                'id': 'customform',
                'label': 'Custom Form'
            },
            {
                'id': 'companyname',
                'label': 'Company Name'
            },
            {
                'id': 'phone',
                'label': 'Phone'
            },
            {
                'id': 'altphone',
                'label': 'Alt Phone'
            },
            {
                'id': 'fax',
                'label': 'Fax'
            },
            {
                'id': 'email',
                'label': 'Email'
            }
        ];
        var falg = false;
        var openDateinit;

        // pageInit
        function pageInit(context) {
            jQuery("#phone,#altphone,#fax").keyup(function(e) {
                telePhoneNumberFormat(e)
            });
        }


        //fieldChanged
        function fieldChanged(context) {
            var currentRecord = context.currentRecord;
            try {

                var formid = currentRecord.getValue({
                    fieldId: "customform",
                });
                var userObj = runtime.getCurrentUser();

                debugger;
                var option = {
                    title: "Error",
                    name: "MISSING_REQ_ARG",
                    message: "",
                    fields: fields
                };

                if (context.fieldId == "companyname") {
                    companyName(currentRecord, option)
                } else if (context.fieldId == "phone") {
                  phoneNumberValidation(currentRecord, option,false, context.fieldId)
                } else if (context.fieldId == "altphone") {
                  phoneNumberValidation(currentRecord, option, false, context.fieldId )
                } else if (context.fieldId == "fax") {
                  phoneNumberValidation(currentRecord, option, false, context.fieldId )
                }
            } catch (e) {
                log.error({
                    title: e.name,
                    details: e.message,
                });
            }
        }

        //saveRecord
        function saveRecord(context) {
            try {

                debugger;
                var currentRecord = context.currentRecord;
                var option = {
                    title: "Error",
                    name: "MISSING_REQ_ARG",
                    message: "",
                    fields: fields
                };

                //
                var errorMsg;
                for (var i = 0; i < fields.length; i++) {
                    var value = currentRecord.getValue({
                        fieldId: fields[i].id
                    });
                    if(fields[i].id == 'altphone' || fields[i].id == 'fax')
                        continue;

                    if (!value || value == 'undefined') {
                        if (!errorMsg) {
                            errorMsg = fields[i].label + '\n';
                        } else {
                            errorMsg += fields[i].label + '\n';
                        }
                    }
                }
                if (errorMsg) {
                    option.message = 'Please enter value(s) for: \n' + errorMsg;
                    alert(option.message)
                    return false
                }

                var errorMessage;
                var nameNamefun = companyName(currentRecord, option, true)
                if (nameNamefun.error) {
                    if (!errorMessage) {
                        errorMessage = nameNamefun.id + ': ' + nameNamefun.message + '\n \n'
                    } else {
                        errorMessage += nameNamefun.id + ': ' + nameNamefun.message + '\n \n'
                    }
                }

                ['phone'].forEach(function(fieldV){

                    var numberFieldRes = phoneNumberValidation(currentRecord, option, true, fieldV)
                    if (numberFieldRes.error) {
                      if (!errorMessage) {
                          errorMessage = numberFieldRes.id + ': ' + numberFieldRes.message + '\n \n'
                      } else {
                          errorMessage += numberFieldRes.id + ': ' + numberFieldRes.message + '\n \n'
                      }
                  }
                });

               
                if (errorMessage) {
                    alert("Please enter value(s) for: \n" + errorMessage);
                    return false
                } else {
                    return true
                }

            } catch (error) {
                log.error({
                    title: error.name,
                    details: error.message,
                });
            }
        }

   

        //Company Name Validation
        function companyName(currentRecord, option, saveRecord) {
            var name = currentRecord.getValue({
                fieldId: "companyname",
            });
            option.message = "Company Name allows only alphabets, numbers, special characters like &, /, dot,  comma, (, ), - and maximum 30 characters are allowed.";
            var regex = new RegExp("^[A-Za-z0-9? ,&.-/()]{1,30}$");
            var obj = {
                id: option.fields[1].label,
                message: option.message,
                error: true
            }

            if (name && !regex.test(name)) {
                if (!saveRecord)
                {
                    dialog.alert(option);
                    currentRecord.setValue({
                        fieldId: 'companyname',
                        value: '',
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    document.getElementById(tempFeildId).focus();
                } 
                if (saveRecord) return obj
            } else if (saveRecord && regex.test(name)) {
                obj.error = false;
                return obj
            }
        }

        //Phone Number Validation
        function phoneNumberValidation(currentRecord, option, saveRecord, tempFeildId) {
            var numberFieldValue = currentRecord.getValue({
                fieldId: tempFeildId,
            });
                        
            var obj = {
                id: '',
                message: option.message,
                error: true
            }

            var numberFieldRegx = new RegExp("\\d{3}-\\d{3}-\\d{4}");
            if(tempFeildId == 'phone'){
                option.message = "Phone allows only numbers and length should be 10 digits.";
                obj.id = option.fields[2].label
            }
            else if(tempFeildId == 'altphone'){
                option.message = "Alt Phone allows only numbers and length should be 10 digits.";
                obj.id = option.fields[3].label
            }
            else if(tempFeildId == 'fax'){
                option.message = "Fax allows only numbers and length should be 10 digits.";
                obj.id = option.fields[4].label
            }
            
            if(numberFieldValue.indexOf('-') > -1)
                numberFieldValue= numberFieldValue.replace(/-/g, "");

            if (numberFieldValue.length !=10) {
                if (!saveRecord) {
                    dialog.alert(option);
                    currentRecord.setValue({
                        fieldId: tempFeildId,
                        value: '',
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    document.getElementById(tempFeildId).focus();
                }

                if (saveRecord && tempFeildId == 'phone') return obj

            } else if (saveRecord ) {
                obj.error = false;
                return obj
            }
        }

        function telePhoneNumberFormat(e) {
            var key = e.charCode || e.keyCode || 0;
            var text = jQuery(e.currentTarget);
            if (key !== 8 && key !== 9) {
                if (text.val() && text.val().length === 3) {
                    text.val(text.val() + '-');
                }
                if (text.val() && text.val().length === 7) {
                    text.val(text.val() + '-');
                }
            }
            return (key == 8 || key == 9 || key == 46 || (key >= 48 && key <= 57) || (key >= 96 && key <= 105));
        }

        exports.pageInit = pageInit;
        exports.fieldChanged = fieldChanged;
        exports.saveRecord = saveRecord;

        return exports;
    });