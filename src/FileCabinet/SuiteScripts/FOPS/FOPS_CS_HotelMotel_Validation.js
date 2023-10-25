/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 */

/***********************************************************
 * File Name : FOPS_CS_HotelMotel_Validation.js
 * Purpose   : To validate data entered from UI on Hotel/Motel Tax Record
 *
 * History
 * Date             Author              Details
 * 20-07-2023       Faizan Siddiki      Initial Version
 ************************************************************/

define(["N/ui/dialog","N/https"], function (dialog, https) {
    var exports = {};

    var FILECONSTANT = {
        BE_SEARCH_SUITELET_ID : 'customscript_fops_bs_search_reuslts',
        BE_SEARCH_SUITELET_DEPLOYMENT_ID : 'customdeploy_fops_bs_search_reuslts'
    }

    var BUSINESS_TYPE = {
        "TELEPHONE": "1",
        "RESTAURANT": "2",
        "TOBACCO": "3",
        "HOTEL": "4"
    }

    var fields = [
        { 'id': 'customform', 'label': 'Custom Form' },
        { 'id': 'custrecord_hotel_customer', 'label': 'Customer' },
        { 'id': 'custrecord_hotel_taxpayer_id', 'label': 'Tax Payer Id Number' },
        { 'id': 'name', 'label': 'Business Name' },
        { 'id': 'custrecord_hotel_confirm_taxpayer_id', 'label': 'Confirm Tax Payer Id Number' },
        { 'id': 'custrecord_hotel_address_line1', 'label': 'Address Line1' },
        { 'id': 'custrecord_hotel_city', 'label': 'City' },
        { 'id': 'custrecord_hotel_state', 'label': 'State' },
        { 'id': 'custrecord_hotel_zip', 'label': 'Zip' },

        { 'id': 'custrecord_hotel_contact_person', 'label': 'Contact Person' },
        { 'id': 'custrecord_hotel_contact_telephone', 'label': 'Contact Telephone' },
        { 'id': 'custrecord_hotel_mail_business_name', 'label': 'Corporate Name' },
        { 'id': 'custrecord_hotel_mail_address', 'label': 'Mailing Address Line 1' },
        //{ 'id': 'custrecord_hotel_mail_address_2', 'label': 'Mailing Address Line 2' },

        { 'id': 'custrecord_hotel_mail_state', 'label': 'Mailing State' },
        { 'id': 'custrecord_hotel_mail_city', 'label': 'Mailing City' },
        { 'id': 'custrecord_hotel_mail_zip', 'label': 'Mailing Zip' },
        { 'id': 'custrecord_hotel_mail_corporate_contact', 'label': 'Mailing Corporate Contact' },
        { 'id': 'custrecord_hotel_mail_corporate_telephon', 'label': 'Mailing Contact Telephone' },
        { 'id': 'custrecord_hotel_mail_bussines_open_date', 'label': 'Business Open Date' },
        { 'id': 'custrecord_hotel_payment_period', 'label': 'Payment Period' },
        // {'id': 'custrecord_hotel_address_line2', 'label': 'Address Line 2'}
    ];

    var payments;
    var falg = false;
    var openDateinit;
    function pageInit(context) {
        debugger;
        jQuery("#custrecord_hotel_confirm_taxpayer_id,#custrecord_hotel_taxpayer_id").keyup(function (e) {
            taxNumberFormat(e);
        });

        jQuery("#custrecord_hotel_contact_telephone,#custrecord_hotel_mail_corporate_telephon").keyup(function (e) {
            telePhoneNumberFormat(e)
        });

        openDateinit = context.currentRecord.getValue({ fieldId: 'custrecord_hotel_mail_bussines_open_date' });

        var mandatoryTag = '<label class="uir-required-icon">*</label>';
        jQuery("#custrecord_hotel_mail_city_fs_lbl").append(mandatoryTag);
        jQuery("#custrecord_hotel_mail_state_fs_lbl").append(mandatoryTag);
        jQuery("#custrecord_hotel_mail_zip_fs_lbl").append(mandatoryTag);
        jQuery("#custrecord_hotel_mail_address_fs_lbl").append(mandatoryTag);
        jQuery("#custrecord_hotel_mail_business_name_fs_lbl").append(mandatoryTag);

    }
    //validateField
    function validateField(context) {
        var currentRecord = context.currentRecord;
        var option = {
            title: "Error",
            name: "MISSING_REQ_ARG",
            message: "",
        };
        if (context.fieldId = "custrecord_hotel_taxpayer_id") {
            var taxnumber = currentRecord.getValue({ fieldId: "custrecord_hotel_taxpayer_id" });
            if (taxnumber != '') {
                taxnumber = taxnumber.replaceAll('-', '');
                var twoDigits = taxnumber.substring(0, 2);
                var lastDigits = taxnumber.substring(2);
                var finalStr = twoDigits + '-' + lastDigits;
                alert('validateField'); currentRecord.setValue({ fieldId: "custrecord_hotel_taxpayer_id", value: finalStr, ignoreFieldChange: true });

            }
        }
        return true
    }
    //fieldChanged
    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        try {
            debugger;
            var option = {
                title: "Error",
                name: "MISSING_REQ_ARG",
                message: "",
                fields: fields
            };

            if (context.fieldId == "custrecord_hotel_taxpayer_id") {
                //alert('fieldchange');
                taxId(currentRecord, option)
            }
            else if (context.fieldId == "custrecord_hotel_confirm_taxpayer_id") {
                confirmTax(currentRecord, option)
            } else if (context.fieldId == "name") {
                nameName(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_address_line1") {
                address1(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_address_line2") {
                address2(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_city") {
                city(currentRecord, option)
            }
            //NETSFOPS-100
            /*else if (context.fieldId == "custrecord_rest_tax_sate") {
              state(currentRecord, option)
            } */
            else if (context.fieldId == "custrecord_hotel_zip") {
                zipcode(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_contact_person") {
                taxPerson(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_contact_telephone") {
                telephoneNumber(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_mail_business_name") {
                corporateName(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_mail_address") {
                malingAddress1(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_mail_address_2") {
                malingAddress2(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_mail_city") {
                malingCity(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_mail_zip") {
                malingZip(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_mail_corporate_contact") {
                malingCorporateName(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_mail_corporate_telephon") {
                malingTelephone(currentRecord, option)
            } else if (context.fieldId == "custrecord_hotel_mail_bussines_open_date") {
                var changeDate = currentRecord.getValue({ fieldId: 'custrecord_hotel_mail_bussines_open_date' });
                if (changeDate != openDateinit) {
                    falg = true
                }
            } else if (context.fieldId == "custrecord_hotel_tax_sameas_above") {
                // same as above
                var sameAsAbove = currentRecord.getValue({
                    fieldId: "custrecord_hotel_tax_sameas_above",
                });
                if (sameAsAbove) {
                    currentRecord.setValue({
                        fieldId: "custrecord_hotel_mail_business_name",
                        value: currentRecord.getValue({
                            fieldId: "name",
                        }),
                        ignoreFieldChange: true
                    });
                    currentRecord.setValue({
                        fieldId: "custrecord_hotel_mail_address",
                        value: currentRecord.getValue({
                            fieldId: "custrecord_hotel_address_line1",
                        }),
                        ignoreFieldChange: true
                    });
                    currentRecord.setValue({
                        fieldId: "custrecord_hotel_mail_address_2",
                        value: currentRecord.getValue({
                            fieldId: "custrecord_hotel_address_line2",
                        }),
                        ignoreFieldChange: true
                    });
                    currentRecord.setValue({
                        fieldId: "custrecord_hotel_mail_state",
                        value: currentRecord.getValue({
                            fieldId: "custrecord_hotel_state",
                        }),
                        ignoreFieldChange: true
                    });
                    currentRecord.setValue({
                        fieldId: "custrecord_hotel_mail_city",
                        value: currentRecord.getValue({
                            fieldId: "custrecord_hotel_city",
                        }),
                        ignoreFieldChange: true
                    });
                    currentRecord.setValue({
                        fieldId: "custrecord_hotel_mail_zip",
                        value: currentRecord.getValue({
                            fieldId: "custrecord_hotel_zip",
                        }),
                        ignoreFieldChange: true
                    });
                    currentRecord.setValue({
                        fieldId: "custrecord_hotel_mail_corporate_contact",
                        value: currentRecord.getValue({
                            fieldId: "custrecord_hotel_contact_person",
                        }),
                        ignoreFieldChange: true
                    });
                    currentRecord.setValue({
                        fieldId: "custrecord_hotel_mail_corporate_telephon",
                        value: currentRecord.getValue({
                            fieldId: "custrecord_hotel_contact_telephone",
                        }),
                        ignoreFieldChange: true
                    });
                }
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
            var errorMsg;
            for (var i = 0; i < fields.length; i++) {
                var value = currentRecord.getValue({ fieldId: fields[i].id });
                if(fields[i].id  == 'custrecord_hotel_mail_bussines_open_date')
                  value = currentRecord.getValue('custrecord_hotel_mail_bussines_open_date');
              
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
            // for(var i =0;i<4;i++){
            var taxIdfun = taxId(currentRecord, option, true)
            if (taxIdfun.error) {
                if (!errorMessage) {
                    errorMessage = taxIdfun.id + ': ' + taxIdfun.message + '\n \n '
                } else {
                    errorMessage += taxIdfun.id + ': ' + taxIdfun.message + '\n \n '
                }
            }
            var confirmTaxfun = confirmTax(currentRecord, option, true)
            if (confirmTaxfun.error) {
                if (!errorMessage) {
                    errorMessage = confirmTaxfun.id + ': ' + confirmTaxfun.message + '\n \n '
                } else {
                    errorMessage += confirmTaxfun.id + ': ' + confirmTaxfun.message + '\n \n '
                }
            }
            var nameNamefun = nameName(currentRecord, option, true)
            if (nameNamefun.error) {
                if (!errorMessage) {
                    errorMessage = nameNamefun.id + ': ' + nameNamefun.message + '\n \n'
                } else {
                    errorMessage += nameNamefun.id + ': ' + nameNamefun.message + '\n \n'
                }
            }
            var address1fun = address1(currentRecord, option, true)
            if (address1fun.error) {
                if (!errorMessage) {
                    errorMessage = address1fun.id + ': ' + address1fun.message + '\n \n'
                } else {
                    errorMessage += address1fun.id + ': ' + address1fun.message + '\n \n'
                }
            }
            var address2fun = address2(currentRecord, option, true)
            console.log(address2fun)
            if (address2fun.error) {
                if (!errorMessage) {
                    errorMessage = address2fun.id + ': ' + address2fun.message + '\n \n'
                } else {
                    errorMessage += address2fun.id + ': ' + address2fun.message + '\n \n'
                }
            }
            var cityfun = city(currentRecord, option, true);
            if (cityfun.error) {
                if (!errorMessage) {
                    errorMessage = cityfun.id + ': ' + cityfun.message + '\n \n'
                } else {
                    errorMessage += cityfun.id + ': ' + cityfun.message + '\n \n'
                }
            }
            /*var statefun =  state(currentRecord,option,true);
         if(statefun.error){
          if(!errorMessage){
            errorMessage = statefun.id +': ' + statefun.message + '\n \n'
          }else{
            errorMessage += statefun.id +': ' + statefun.message + '\n \n'
          }
        }*/
            var zipcodefun = zipcode(currentRecord, option, true)
            if (zipcodefun.error) {
                if (!errorMessage) {
                    errorMessage = zipcodefun.id + ': ' + zipcodefun.message + '\n \n'
                } else {
                    errorMessage += zipcodefun.id + ': ' + zipcodefun.message + '\n \n'
                }
            }
            var taxPersonfun = taxPerson(currentRecord, option, true)
            if (taxPersonfun.error) {
                if (!errorMessage) {
                    errorMessage = taxPersonfun.id + ': ' + taxPersonfun.message + '\n \n'
                } else {
                    errorMessage += taxPersonfun.id + ': ' + taxPersonfun.message + '\n \n'
                }
            }
            var telephoneNumberfun = telephoneNumber(currentRecord, option, true)
            if (telephoneNumberfun.error) {
                if (!errorMessage) {
                    errorMessage = telephoneNumberfun.id + ': ' + telephoneNumberfun.message + '\n \n'
                } else {
                    errorMessage += telephoneNumberfun.id + ': ' + telephoneNumberfun.message + '\n \n'
                }
            }
            var corporateNamefun = corporateName(currentRecord, option, true)
            if (corporateNamefun.error) {
                if (!errorMessage) {
                    errorMessage = corporateNamefun.id + ': ' + corporateNamefun.message + '\n \n'
                } else {
                    errorMessage += corporateNamefun.id + ': ' + corporateNamefun.message + '\n \n'
                }
            }
            var malingAddress1fun = malingAddress1(currentRecord, option, true)
            if (malingAddress1fun.error) {
                if (!errorMessage) {
                    errorMessage = malingAddress1fun.id + ': ' + malingAddress1fun.message + '\n \n'
                } else {
                    errorMessage += malingAddress1fun.id + ': ' + malingAddress1fun.message + '\n \n'
                }
            }
            var malingAddress2fun = malingAddress2(currentRecord, option, true)
            if (malingAddress2fun.error) {
                if (!errorMessage) {
                    errorMessage = malingAddress2fun.id + ': ' + malingAddress2fun.message + '\n \n'
                } else {
                    errorMessage += malingAddress2fun.id + ': ' + malingAddress2fun.message + '\n \n'
                }
            }
            var malingCityfun = malingCity(currentRecord, option, true)
            if (malingCityfun.error) {
                if (!errorMessage) {
                    errorMessage = malingCityfun.id + ': ' + malingCityfun.message + '\n \n'
                } else {
                    errorMessage += malingCityfun.id + ': ' + malingCityfun.message + '\n \n'
                }
            }
            //NETSFOPS-100
            /*var malingstateFun =  maliState(currentRecord,option,true)
            if(malingstateFun.error){
              if(!errorMessage){
                errorMessage = malingstateFun.id +': ' + malingstateFun.message + '\n \n'
              }else{
                errorMessage += malingstateFun.id +': ' + malingstateFun.message + '\n \n'
              }
            }*/
            var malingZipfun = malingZip(currentRecord, option, true)
            if (malingZipfun.error) {
                if (!errorMessage) {
                    errorMessage = malingZipfun.id + ': ' + malingZipfun.message + '\n \n'
                } else {
                    errorMessage += malingZipfun.id + ': ' + malingZipfun.message + '\n \n'
                }
            }
            var malingCorporateNamefun = malingCorporateName(currentRecord, option, true)
            if (malingCorporateNamefun.error) {
                if (!errorMessage) {
                    errorMessage = malingCorporateNamefun.id + ': ' + malingCorporateNamefun.message + '\n \n'
                } else {
                    errorMessage += malingCorporateNamefun.id + ': ' + malingCorporateNamefun.message + '\n \n'
                }
            }
            var malingTelephonefun = malingTelephone(currentRecord, option, true)
            if (malingTelephonefun.error) {
                if (!errorMessage) {
                    errorMessage = malingTelephonefun.id + ': ' + malingTelephonefun.message + '\n \n'
                } else {
                    errorMessage += malingTelephonefun.id + ': ' + malingTelephonefun.message + '\n \n'
                }
            }
            var openDate = BusinessOpenDate(currentRecord, option, true)
            if (openDate.error) {
                if (!errorMessage) {
                    errorMessage = openDate.id + ': ' + openDate.message + '\n \n'
                } else {
                    errorMessage += openDate.id + ': ' + openDate.message + '\n \n'
                }
            }
            var paymentPeriod = BusinessPaymentPeriod(currentRecord, option, true)
            if (paymentPeriod.error) {
                if (!errorMessage) {
                    errorMessage = paymentPeriod.id + ': ' + paymentPeriod.message + '\n \n'
                } else {
                    errorMessage += paymentPeriod.id + ': ' + paymentPeriod.message + '\n \n'
                }
            }

            if (errorMessage) {
                alert("Please enter value(s) for: \n" + errorMessage);
                return false
            } else {
                return true
            }

            /*
         var taxIdfun =  taxId(currentRecord,option,true)
          var confirmTaxfun =  confirmTax(currentRecord,option,true)
         var nameNamefun =  nameName(currentRecord,option,true)
         var address1fun =  address1(currentRecord,option,true)
         var address2fun = address2(currentRecord,option,true)
         var cityfun =  city(currentRecord,option,true)
         var zipcodefun = zipcode(currentRecord,option,true)
         var taxPersonfun = taxPerson(currentRecord,option,true)
         var telephoneNumberfun = telephoneNumber(currentRecord,option,true)
         var corporateNamefun =  corporateName(currentRecord,option,true)
         var mallingAddress1fun =  mallingAddress1(currentRecord,option,true)
         var mallingAddress2fun =  mallingAddress2(currentRecord,option,true)
         var mallingCityfun =  mallingCity(currentRecord,option,true)
         var mallingZipfun =  mallingZip(currentRecord,option,true)
         var mallingCorporateNamefun =  mallingCorporateName(currentRecord,option,true)
         var mallingTelephonefun =   mallingTelephone(currentRecord,option,true)
         console.log('taxIdfun-'+taxIdfun + ',confirmTaxfun-' + confirmTaxfun + ',nameNamefun-'+nameNamefun + ',address1fun-'+address1fun + ',address2fun-'+address2fun + ',cityfun-'+cityfun + ',zipcodefun-'+zipcodefun + ',taxPersonfun-'+taxPersonfun + ',telephoneNumberfun-'+telephoneNumberfun + ',corporateNamefun-'+ corporateNamefun + ',mallingAddress1fun-'+ mallingAddress1fun + ',mallingAddress2fun-'+ mallingAddress2fun + ',mallingCityfun-'+mallingCityfun+ ',mallingZipfun-'+mallingZipfun + ',mallingCorporateNamefun-'+ mallingCorporateNamefun + ',mallingTelephonefun-' +mallingTelephonefun)
         if(taxIdfun && confirmTaxfun && nameNamefun && address1fun && cityfun && zipcodefun && taxPersonfun && telephoneNumberfun
          && corporateNamefun && mallingAddress1fun  && mallingCityfun && mallingZipfun && mallingCorporateNamefun && mallingTelephonefun){
            return true
          }else{
            option.message ="Something went wrong, Please check all fields data";
              dialog.alert(option);
            return false
          } */

        } catch (error) {
            log.error({
                title: error.name,
                details: error.message,
            });
        }
    }

    function taxNumberFormat(e) {
        var key = e.charCode || e.keyCode || 0;
        var text = jQuery(e.currentTarget);
        if (key !== 8 && key !== 9) {
            if (text.val() && text.val().length === 2) {
                text.val(text.val() + '-');
            }

        }
        return (key == 8 || key == 9 || key == 46 || (key >= 48 && key <= 57) || (key >= 96 && key <= 105));
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

    //NETSFOPS-94
    function taxId(currentRecord, option, saveRecord) {

        var taxnumber = currentRecord.getValue({ fieldId: "custrecord_hotel_taxpayer_id" });

        //'90-1234567'
        option.message = "Please enter valid TAX PAYER ID NUMBER. Expected format : XX-XXXXXXX";
        var taxregex = new RegExp("\\d{2}-\\d{7}");

        var obj = { id: option.fields[2].label, message: option.message, error: true }
        if (taxnumber && !taxregex.test(taxnumber)) {

            if (!saveRecord) {
                log.debug('Tax Payer ID is wrong');
                dialog.alert(option);
                currentRecord.setValue({
                    fieldId: 'custrecord_hotel_taxpayer_id',
                    value: '',
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                });
                document.getElementById('custrecord_hotel_taxpayer_id').focus();

            }
            if (saveRecord) {
                return obj;
            }

        } else if (saveRecord && taxregex.test(taxnumber)) {
            obj.error = false
            return obj
        }

    }

    function confirmTax(currentRecord, option, saveRecord) {
        var taxnumber = currentRecord.getValue({ fieldId: "custrecord_hotel_taxpayer_id" });
        var confTaxnumber = currentRecord.getValue({ fieldId: "custrecord_hotel_confirm_taxpayer_id" });
        option.message = "CONFIRM TAX PAYER ID NUMBER does not match with TAX PAYER ID NUMBER.";

        var obj = { id: option.fields[3].label, message: option.message, error: true }

        if (taxnumber && confTaxnumber && taxnumber == confTaxnumber) {
            // 90-12345678
            if (taxnumber.length != 10 && confTaxnumber.length != 10) {
                if (!saveRecord) {
                    dialog.alert(option);
                    currentRecord.setValue({
                        fieldId: 'custrecord_hotel_confirm_taxpayer_id',
                        value: '',
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    document.getElementById('custrecord_hotel_confirm_taxpayer_id').focus();
                }
                if (saveRecord) {
                    return obj
                }
            } else if (taxnumber.length == 10 && confTaxnumber.length == 10) {
                //  currentRecord.setValue({fieldId:"custrecord_rest_tax_pay_id_num",value:finalStr,ignoreFieldChange: true});
                obj.error = false;
                return obj
            }
        } else {
            if (!saveRecord) {
                dialog.alert(option);
            }
            if (saveRecord) {
                return obj
            }
        }
    }
    function nameName(currentRecord, option, saveRecord) {
        var name = currentRecord.getValue({
            fieldId: "name",
        });
        option.message = "Business Name allows only alphabets, numbers, special characters like &, /, dot,  comma, (, ), - and maximum 30 characters are allowed.";
        var regex = new RegExp("^[A-Za-z0-9? ,&.-/()]{1,30}$");
        var obj = { id: option.fields[4].label, message: option.message, error: true }

        if (name && !regex.test(name)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && regex.test(name)) {
            obj.error = false;
            return obj
        }
    }
    function address1(currentRecord, option, saveRecord) {
        var address1 = currentRecord.getValue({
            fieldId: "custrecord_hotel_address_line1",
        });
        option.message = "Addess line 1 allows only alphabets, numbers, special characters like #, - , comma and maximum 30 characters are allowed.";
        var obj = { id: option.fields[5].label, message: option.message, error: true }

        var regex1 = new RegExp("^[A-Za-z0-9? , #-]{1,30}$");
        if (address1 && !regex1.test(address1)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && regex1.test(address1)) {
            obj.error = false
            return obj
        }
    }
    function address2(currentRecord, option, saveRecord) {
        var address2 = currentRecord.getValue({
            fieldId: "custrecord_hotel_address_line2",
        });
        var regex2 = new RegExp("^[A-Za-z0-9? ,#-]{1,30}$");
        option.message = "Addess line 2 should be alphanumeric, special characters like #, - , comma and maximum 30 characters are allowed.";
        var obj = { id: 'Address Line 2', message: option.message, error: true }

        if (address2 && !regex2.test(address2)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && regex2.test(address2) && address2) {
            obj.error = false
            return obj
        } else {
            obj.error = false;
            return obj
        }
    }
    function city(currentRecord, option, saveRecord) {
        var city = currentRecord.getValue({
            fieldId: "custrecord_hotel_city",
        });
        var cityregex = new RegExp("^[A-Za-z? ]{1,30}$");
        option.message = "City should be alphabets and maximum 30 characters are allowed.";
        var obj = { id: option.fields[6].label, message: option.message, error: true }

        if (city && !cityregex.test(city)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && cityregex.test(city)) {
            obj.error = false
            return obj
        }
    }
    function state(currentRecord, option, saveRecord) {
        var state = currentRecord.getValue({
            fieldId: "custrecord_hotel_state",
        });
        var stateregex = new RegExp("^[A-Za-z? ]{1,30}$");
        option.message = "State should be alphabets and maximum 30 characters are allowed.";
        var obj = { id: option.fields[7].label, message: option.message, error: true }

        if (state && !stateregex.test(state)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && stateregex.test(state)) {
            obj.error = false
            return obj
        }
    }
    function zipcode(currentRecord, option, saveRecord) {
        var zipcode = currentRecord.getValue({
            fieldId: "custrecord_hotel_zip",
        });
        var zipcoderegex = new RegExp("^[0-9?]{5}$");
        option.message = "Zip code should be numbers and length should 5 digits.";
        var obj = { id: option.fields[8].label, message: option.message, error: true }

        if (zipcode && !zipcoderegex.test(zipcode)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && zipcoderegex.test(zipcode)) {
            obj.error = false
            return obj
        }

    }
    function taxPerson(currentRecord, option, saveRecord) {
        var contactperson = currentRecord.getValue({
            fieldId: "custrecord_hotel_contact_person",
        });
        var contactpersonregex = new RegExp("^[A-Za-z? ]{1,30}$");
        option.message = "Contact Person allows only alphabets and maximum 30 characters are allowed.";
        var obj = { id: option.fields[9].label, message: option.message, error: true }

        if (contactperson && !contactpersonregex.test(contactperson)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && contactpersonregex.test(contactperson)) {
            obj.error = false
            return obj
        }
    }
    function telephoneNumber(currentRecord, option, saveRecord) {
        var businesstelephone = currentRecord.getValue({
            fieldId: "custrecord_hotel_contact_telephone",
        });
        // 123-456-789

        //NETSFOPS-94
        //var businesstelephoneregex = new RegExp('"^[0-9?-]{12}$"');
        var businesstelephoneregex = new RegExp("\\d{3}-\\d{3}-\\d{4}");
        option.message = "Contact Telephone allows only numbers and length should be 10 digits, with format 123-456-7890";
        var obj = { id: option.fields[10].label, message: option.message, error: true }

        if (businesstelephone && !businesstelephoneregex.test(businesstelephone)) {
            if (!saveRecord) {
                dialog.alert(option);

                currentRecord.setValue({
                    fieldId: 'custrecord_hotel_contact_telephone',
                    value: '',
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                });
                document.getElementById('custrecord_hotel_contact_telephone').focus();

            }
            if (saveRecord) return obj

        } else if (saveRecord && businesstelephoneregex.test(businesstelephone)) {
            obj.error = false
            return obj
        }

    }
    function corporateName(currentRecord, option, saveRecord) {
        var mname = currentRecord.getValue({
            fieldId: "custrecord_hotel_mail_business_name",
        });
        option.message = "Corporate Name allows only alphabets, numbers, special characters like &, /, dot,  comma, (, ), - , .";
        var obj = { id: option.fields[11].label, message: option.message, error: true }

        var mnameregex = new RegExp("^[A-Za-z0-9? ,&.-/]{1,30}$");
        if (mname && !mnameregex.test(mname)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && mnameregex.test(mname)) {
            obj.error = false
            return obj
        }
    }
    function malingAddress1(currentRecord, option, saveRecord) {
        var maddress = currentRecord.getValue({
            fieldId: "custrecord_hotel_mail_address",
        });
        option.message = "Address allows only alphabets, numbers, special characters like #, - , comma .";
        var obj = { id: option.fields[12].label, message: option.message, error: true }

        var maddressregex = new RegExp("^[A-Za-z0-9? ,#-]{1,30}$");
        if (maddress && !maddressregex.test(maddress)) {
            if (!saveRecord)
                dialog.alert(option);
            if (saveRecord)
                return obj;//NETSFOPS-106
        } else if (saveRecord && maddressregex.test(maddress)) {
            obj.error = false
            return obj
        }
    }
    function malingAddress2(currentRecord, option, saveRecord) {
        var maddress2 = currentRecord.getValue({
            fieldId: "custrecord_hotel_address_line2",
        });
        var maddressregex2 = new RegExp("^[A-Za-z0-9? ,#-]{1,30}$");

        option.message = "Mailing Addess line 2 should be alphanumeric, special characters like #, - , comma and maximum 30 characters are allowed.";
        var obj = { id: 'Mailing Address Line 2', message: option.message, error: true }

        if (maddress2 && !maddressregex2.test(maddress2)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && maddressregex2.test(maddress2) && maddress2) {
            obj.error = false;
            return false
        } else {
            obj.error = false;
            return obj
        }
    }
    function malingCity(currentRecord, option, saveRecord) {
        var mcity = currentRecord.getValue({
            fieldId: "custrecord_hotel_mail_city",
        });
        var mcityregex = new RegExp("^[A-Za-z? ]{1,30}$");
        option.message = "City should be alphabets and maximum 30 characters are allowed.";
        var obj = { id: option.fields[14].label, message: option.message, error: true }

        if (mcity && !mcityregex.test(mcity)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && mcityregex.test(mcity)) {
            obj.error = false
            return obj
        }
    }
    function malingZip(currentRecord, option, saveRecord) {
        var mzipcode = currentRecord.getValue({
            fieldId: "custrecord_hotel_mail_zip",
        });
        option.message = "Zip code should be numbers and length should 5 digits.";
        var obj = { id: option.fields[15].label, message: option.message, error: true }
        var mzipcoderegex = new RegExp("^[0-9?]{5}$");
        if (mzipcode && !mzipcoderegex.test(mzipcode)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj
        } else if (saveRecord && mzipcoderegex.test(mzipcode)) {
            obj.error = false;
            return obj
        }
    }
    function malingCorporateName(currentRecord, option, saveRecord) {
        var mccontat = currentRecord.getValue({
            fieldId: "custrecord_hotel_mail_corporate_contact",
        });
        var mccontatregex = new RegExp("^[A-Za-z? ]{1,30}$");
        option.message = "Mailing Corporate Contact allows only alphabets and maximum 30 characters are allowed.";
        var obj = { id: option.fields[17].label, message: option.message, error: true }

        if (mccontat && !mccontatregex.test(mccontat)) {
            if (!saveRecord) dialog.alert(option);
            if (saveRecord) return obj

        } else if (saveRecord && mccontatregex.test(mccontat)) {
            obj.error = false
            return obj
        }
    }
    function malingTelephone(currentRecord, option, saveRecord) {
        var mallingtelephone = currentRecord.getValue({
            fieldId: "custrecord_hotel_mail_corporate_telephon",
        });

        // 123-456-789
        //var mallingtelephoneRegx = new RegExp("^[0-9?-]{12}$");
        var mallingtelephoneRegx = new RegExp("\\d{3}-\\d{3}-\\d{4}");
        option.message = "Contact Telephone allows only numbers and length should be 10 digits.";
        var obj = { id: option.fields[18].label, message: option.message, error: true }

        if (mallingtelephone && !mallingtelephoneRegx.test(mallingtelephone)) {
            if (!saveRecord) {
                dialog.alert(option);
                currentRecord.setValue({
                    fieldId: 'custrecord_hotel_mail_corporate_telephon',
                    value: '',
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                });
                document.getElementById('custrecord_hotel_mail_corporate_telephon').focus();
            }

            if (saveRecord) return obj

        } else if (saveRecord && mallingtelephoneRegx.test(mallingtelephone)) {
            obj.error = false;
            return obj
        }

    }
    function BusinessOpenDate(currentRecord, option, saveRecord) {
        var openDate = currentRecord.getValue({
            fieldId: "custrecord_hotel_mail_bussines_open_date",
        });
        var businessId = currentRecord.getValue({
            fieldId: "recordid",
        });
        // 123-456-789
        option.message = "Please select Business Open Date.";
        var obj = { id: 'Business Open Date', message: option.message, error: true }

        if (openDate && saveRecord && falg && businessId) {
            var payments = paymentsInDb(businessId);
            console.log(payments);

            var endDate = dateChange(openDate, payments);
            console.log(endDate);

            var openDateformat = new Date(openDate);
            var endDateFormat = new Date(endDate);
            if (endDateFormat < openDateformat) {
                obj.message = 'Business date should be prior to first tax payment date';
                return obj
            } else {
                obj.error = false;
                return obj
            }
        } else {
            obj.error = false;
            return obj
        }
    }
    function BusinessPaymentPeriod(currentRecord, option, saveRecord) {
        var period = currentRecord.getValue({
            fieldId: "custrecord_hotel_payment_period",
        });

        // 123-456-789
        option.message = "Please select Payment Period.";
        var obj = { id: 'Payment Period', message: option.message, error: true }

        if (!period && saveRecord) {
            return obj
        } else {
            obj.error = false;
            return obj
        }
    }
    
    function paymentsInDb(id)
    {
        // var searchPayment = nlapiSearchRecord("customerpayment",null,
        // [
        //     ["type","anyof","CustPymt"],
        //     "AND",
        //     ["custbody_business_type","is", BUSINESS_TYPE.HOTEL],
        //     "AND",
        //     ["custbody_hotel_busniess_name_id", "anyof", id],
        //     "AND",
        //     ["mainline","is","T"]
        // ],
        // [
        //     new nlobjSearchColumn("custbody_rest_total_occ_enty"),
        //     new nlobjSearchColumn('custbody_tax_year'),
        //     new nlobjSearchColumn('custbody_tax_month'),
        //     new nlobjSearchColumn('custbody_quarterly')
        // ]);
        var payment = {
            validation: {}
        }

        var filters = [
            ["type","anyof","CustPymt"],
            "AND",
            ["custbody_business_type","is", BUSINESS_TYPE.HOTEL],
            "AND",
            ["custbody_hotel_busniess_name_id", "anyof", id],
            "AND",
            ["mainline","is","T"]
        ];

        var columns = [
            'custbody_rest_total_occ_enty',
            'custbody_tax_year',
            'custbody_tax_month',
            'custbody_quarterly'
        ];    

        var searchPayment = callSearchSuitelet(filters, columns, 'customerpayment');

        var data = [];
        if(searchPayment){
            searchPayment.forEach(function(result){
                var typeOfPayment;
                var hasData = false;
                var taxMonth = result.custbody_tax_month.value; 
                var taxQuarter =  result.custbody_quarterly.text;
                var valQuarter = result.custbody_quarterly.value;
                var taxYear =  result.custbody_tax_year.text;
                var custPayAmount =  result.custbody_rest_total_occ_enty.value;
                var obj = {
                    "1": ['1','2','3'],
                    "2": ['4','5','6'],
                    "3": ['7','8','9'],
                    "4": ['10','11','12']
                };

                var monthLevel = {
                    '1':'January',
                    '2': 'February',
                    '3': 'March',
                    '4': 'April',
                    '5': 'May',
                    '6': 'June',
                    '7': 'July',
                    '8': 'August',
                    '9': 'September',
                    '10': 'October',
                    '11': 'November',
                    '12': 'December'
                };            
            
                if(taxQuarter && taxYear && custPayAmount ){
            
                    if(!(payment.validation.hasOwnProperty(taxYear))){
                        payment.validation[taxYear] = {}
                    }
                    
                    typeOfPayment = 'Quarterly';
                    hasData = true;
                    var months = obj[valQuarter];

                    for(var k = 0; k < months.length; k++){
                        var m = monthLevel[months[k]];
                        if(!(payment.validation[taxYear].hasOwnProperty(m) )){
                            payment.validation[taxYear][m] = custPayAmount
                        }
                    }
                }
                else if(!taxQuarter && taxMonth && taxYear && custPayAmount){
                    typeOfPayment = 'Monthly';
                    hasData = true;

                    if(!(payment.validation.hasOwnProperty(taxYear))){
                        payment.validation[taxYear] = {}
                    }
                    var m = monthLevel[taxMonth];
                    if(!(payment.validation[taxYear].hasOwnProperty(m) )){
                        payment.validation[taxYear][m] = custPayAmount
                    } 
                }    
            });
        }
        return payment.validation;
    }

    /**NETSFOPS-108**/
    function callSearchSuitelet(filters, columns, recordType) {
        debugger;
        // Prepare the request
        var request = {
            filters: JSON.stringify(filters),
            columns: JSON.stringify(columns),
            recordType: recordType
        };
        
        // Call the Suitelet
        var response = https.post({
            url: '/app/site/hosting/scriptlet.nl?script='+FILECONSTANT.BE_SEARCH_SUITELET_ID+'&deploy='+FILECONSTANT.BE_SEARCH_SUITELET_DEPLOYMENT_ID,
            body: request
        });
        
        // Get the response body
        var responseBody = response.body;
        
        // Parse the response
        var data = JSON.parse(responseBody);
            
        // Use the returned data
        console.log("Search Data: " + JSON.stringify(data));
    
        return data;
    }    
 
    function dateChange(date, payments) {
        if (date) {
            var monthLevel = {
                'January': 1,
                'February': 2,
                'March': 3,
                'April': 4,
                'May': 5,
                'June': 6,
                'July': 7,
                'August': 8,
                'September': 9,
                'October': 10,
                'November': 11,
                'December': 12
            }
            //var dates = date.split('/');
            //var year = dates[2];
            //var month = dates[0];
            var minMonth = [];
            var inDb = payments;
            var keys = Object.keys(inDb);
            var minYear = Math.min.apply(null, keys);
            if (minYear) {
                var yearinDb = inDb[minYear.toString()];
                if (yearinDb) {
                    var months = Object.keys(yearinDb)
                    for (var i = 0; i < months.length; i++) {
                        var items = months[i];
                        var s = monthLevel[items]
                        minMonth.push(s);
                    }
                    var minmumMonth = Math.min.apply(null, minMonth);
                    var date = new Date();
                    var lastDay = lastDayfun(minYear, minmumMonth)
                    var enddate = minmumMonth + '/' + lastDay + '/' + minYear;
                    return enddate
                }
            }
        }
        return new Date();
    }
    function lastDayfun(year,month){
        return new Date(year, month, 0).getDate()
      }
    exports.pageInit = pageInit;
    exports.fieldChanged = fieldChanged;
    exports.saveRecord = saveRecord;
    return exports;
});