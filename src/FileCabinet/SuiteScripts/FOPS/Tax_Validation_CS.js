/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType ClientScript
 */

/********************************
 * File Name : Tax_Validation_CS
 * Purpose
 * 
 * History
 * Date             Author              Details
 * 24th Jan 2023    Faizan Siddiki      NETSFOPS-100 :Telephone Tax - System doesn't retrieve the "State" value selected previously.
 * 25th Jan 2023    Faizan Siddiki      NETSFOPS-94  :Date, Tax Id and Phone fields fixes 
 * 27th Jan 2023    Faizan Siddiki      NETSFOPS-106 :Fix display appropriate message 
*/

define(["N/record", "N/https", "N/runtime", "N/ui/dialog", "N/error"], function (
  record, https, runtime, dialog, error){

  var FILECONSTANT = {
    BE_SEARCH_SUITELET_ID : 'customscript_fops_bs_search_reuslts',
    BE_SEARCH_SUITELET_DEPLOYMENT_ID : 'customdeploy_fops_bs_search_reuslts'
  }

  var exports = {};
  var fields = [
    { 'id': 'customform', 'label': 'Custom Form' },
    { 'id': 'custrecord_restaurant_customer_tax', 'label': 'Customer' },
    { 'id': 'custrecord_tax_payer_id_num', 'label': 'Tax Payer Id Number' },
    { 'id': 'custrecord_conf_tax_id_num', 'label': 'Confirm Tax Payer Id Number' },
    { 'id': 'name', 'label': 'Business Name' },
    { 'id': 'custrecord_add_line_1', 'label': 'Address Line1' },
    { 'id': 'custrecord_rest_tax_city', 'label': 'City' },
    { 'id': 'custrecord_rest_tax_state', 'label': 'State' },
    { 'id': 'custrecord_rest_tax_zip', 'label': 'Zip' },
    { 'id': 'custrecord_rest_tax_person', 'label': 'Contact Person' },
    { 'id': 'custrecord_rest_tax_telephone', 'label': 'Contact Telephone' },
    { 'id': 'custrecord_rest_tax_corp_name', 'label': 'Corporate Name' },
    { 'id': 'custrecord_rest_tax_add', 'label': 'Mailing Address Line 1' },
    { 'id': 'custrecord_rest_tax_mail_state', 'label': 'Mailing State' },
    { 'id': 'custrecord_rest_taxt_city', 'label': 'Mailing City' },
    { 'id': 'custrecord_rest_tax_mail_zip', 'label': 'Mailing Zip' },
    { 'id': 'custrecord_rest_corp_telephone', 'label': 'Mailing Corporate Contact' },
    { 'id': 'custrecord_rest_tax_telephone_cont', 'label': 'Mailing Contact Telephone' },
    { 'id': 'custrecord_rest_bues_open_date', 'label': 'Business Open Date' },
    { 'id': 'custrecord_rest_pay_period', 'label': 'Payment Period' }
  ];
  var payments;
  var falg = false;
  var openDateinit;
  // pageInit
  function pageInit(context) {
    jQuery("#custrecord_tax_payer_id_num,#custrecord_conf_tax_id_num").keyup(function (e) {
      taxNumberFormat(e);
    });
    jQuery("#custrecord_rest_tax_telephone,#custrecord_rest_tax_telephone_cont").keyup(function (e) {
      telePhoneNumberFormat(e)
    });
    openDateinit = context.currentRecord.getValue({ fieldId: 'custrecord_rest_bues_open_date' });


  }
  //validateField
  function validateField(context) {
    var currentRecord = context.currentRecord;
    var option = {
      title: "Error",
      name: "MISSING_REQ_ARG",
      message: "",
    };
    if (context.fieldId == "custrecord_tax_payer_id_num") {
      var taxnumber = currentRecord.getValue({ fieldId: "custrecord_tax_payer_id_num" });
      if (taxnumber != '') {
        taxnumber = taxnumber.replaceAll('-', '');
        var twoDigits = taxnumber.substring(0, 2);
        var lastDigits = taxnumber.substring(2);
        var finalStr = twoDigits + '-' + lastDigits;
        alert('validateField'); currentRecord.setValue({ fieldId: "custrecord_tax_payer_id_num", value: finalStr, ignoreFieldChange: true });

      }
    }
    return true
  }
  //fieldChanged
  function fieldChanged(context) {
    var currentRecord = context.currentRecord;
    try {

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

      if (currentRecord.type == "customrecord_telephone_tax") {
        debugger;
        var option = {
          title: "Error",
          name: "MISSING_REQ_ARG",
          message: "",
          fields: fields
        };

        if (context.fieldId == "custrecord_tax_payer_id_num") {
          //alert('fieldchange');
          taxId(currentRecord, option)
        }
        else if (context.fieldId == "custrecord_conf_tax_id_num") {
          confirmTax(currentRecord, option)
        } else if (context.fieldId == "name") {
          nameName(currentRecord, option)
        } else if (context.fieldId == "custrecord_add_line_1") {
          address1(currentRecord, option)
        } else if (context.fieldId == "custrecord_add_line_2") {
          address2(currentRecord, option)
        } else if (context.fieldId == "custrecord_rest_tax_city") {
          city(currentRecord, option)
        }
        //NETSFOPS-100 
        /*else if (context.fieldId == "custrecord_rest_tax_state") {
          state(currentRecord, option)
        } */
        else if (context.fieldId == "custrecord_rest_tax_zip") {
          zipcode(currentRecord, option)
        } else if (context.fieldId == "custrecord_rest_tax_person") {
          taxPerson(currentRecord, option)
        } else if (context.fieldId == "custrecord_rest_tax_telephone") {
          telephoneNumber(currentRecord, option)
        } else if (context.fieldId == "custrecord_rest_tax_corp_name") {
          corporateName(currentRecord, option)
        } else if (context.fieldId == "custrecord_rest_tax_add") {
          malingAddress1(currentRecord, option)
        } else if (context.fieldId == "custrecord_malling_address2") {
          malingAddress2(currentRecord, option)
        } else if (context.fieldId == "custrecord_rest_taxt_city") {
          malingCity(currentRecord, option)
        } else if (context.fieldId == "custrecord_rest_tax_mail_zip") {
          malingZip(currentRecord, option)
        } else if (context.fieldId == "custrecord_rest_corp_telephone") {
          malingCorporateName(currentRecord, option)
        } else if (context.fieldId == "custrecord_rest_tax_telephone_cont") {
          malingTelephone(currentRecord, option)
        } else if (context.fieldId == "custrecord_rest_bues_open_date") {
          var changeDate = currentRecord.getValue({ fieldId: 'custrecord_rest_bues_open_date' });
          if (changeDate != openDateinit) {
            falg = true
          }
        } else if (context.fieldId == "custrecord_telphone_sameas_above") {
          // same as above
          var sameAsAbove = currentRecord.getValue({
            fieldId: "custrecord_telphone_sameas_above",
          });
          if (sameAsAbove) {
            currentRecord.setValue({
              fieldId: "custrecord_rest_tax_corp_name",
              value: currentRecord.getValue({
                fieldId: "name",
              }),
              ignoreFieldChange: true
            });
            currentRecord.setValue({
              fieldId: "custrecord_rest_tax_add",
              value: currentRecord.getValue({
                fieldId: "custrecord_add_line_1",
              }),
              ignoreFieldChange: true
            });
            currentRecord.setValue({
              fieldId: "custrecord_malling_address2",
              value: currentRecord.getValue({
                fieldId: "custrecord_add_line_2",
              }),
              ignoreFieldChange: true
            });
            currentRecord.setValue({
              fieldId: "custrecord_rest_tax_mail_state",
              value: currentRecord.getValue({
                fieldId: "custrecord_rest_tax_state",
              }),
              ignoreFieldChange: true
            });
            currentRecord.setValue({
              fieldId: "custrecord_rest_taxt_city",
              value: currentRecord.getValue({
                fieldId: "custrecord_rest_tax_city",
              }),
              ignoreFieldChange: true
            });
            currentRecord.setValue({
              fieldId: "custrecord_rest_tax_mail_zip",
              value: currentRecord.getValue({
                fieldId: "custrecord_rest_tax_zip",
              }),
              ignoreFieldChange: true
            });
            currentRecord.setValue({
              fieldId: "custrecord_rest_corp_telephone",
              value: currentRecord.getValue({
                fieldId: "custrecord_rest_tax_person",
              }),
              ignoreFieldChange: true
            });
            currentRecord.setValue({
              fieldId: "custrecord_rest_tax_telephone_cont",
              value: currentRecord.getValue({
                fieldId: "custrecord_rest_tax_telephone",
              }),
              ignoreFieldChange: true
            });
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
  //saveRecord
  function saveRecord(context) {
    try {

      debugger;
      var currentRecord = context.currentRecord;
      if (currentRecord.type == "customrecord_telephone_tax") {
        var option = {
          title: "Error",
          name: "MISSING_REQ_ARG",
          message: "",
          fields: fields
        };

        //
        var errorMsg;
        for (var i = 0; i < fields.length; i++) {
          var value = currentRecord.getValue({ fieldId: fields[i].id });
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


      }
    } catch (error) {
      log.error({
        title: error.name,
        details: error.message,
      });
    }
  }

  //NETSFOPS-94
  function taxId(currentRecord, option, saveRecord) {

    var taxnumber = currentRecord.getValue({ fieldId: "custrecord_tax_payer_id_num" });

    //'90-1234567'
    option.message = "Please enter valid TAX PAYER ID NUMBER. Expected format : XX-XXXXXXX";
    var taxregex = new RegExp("\\d{2}-\\d{7}");

    var obj = { id: option.fields[2].label, message: option.message, error: true }
    if (taxnumber && !taxregex.test(taxnumber)) {

      if (!saveRecord) {
        log.debug('Tax Payer ID is wrong');
        dialog.alert(option);
        currentRecord.setValue({
          fieldId: 'custrecord_tax_payer_id_num',
          value: '',
          ignoreFieldChange: true,
          forceSyncSourcing: false
        });
        document.getElementById('custrecord_tax_payer_id_num').focus();

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
    var taxnumber = currentRecord.getValue({ fieldId: "custrecord_tax_payer_id_num" });
    var confTaxnumber = currentRecord.getValue({ fieldId: "custrecord_conf_tax_id_num" });
    option.message = "CONFIRM TAX PAYER ID NUMBER does not match with TAX PAYER ID NUMBER.";

    var obj = { id: option.fields[3].label, message: option.message, error: true }

    if (taxnumber && confTaxnumber && taxnumber == confTaxnumber) {
      // 90-12345678
      if (taxnumber.length != 10 && confTaxnumber.length != 10) {
        if (!saveRecord) {
          dialog.alert(option);
          currentRecord.setValue({
            fieldId: 'custrecord_conf_tax_id_num',
            value: '',
            ignoreFieldChange: true,
            forceSyncSourcing: false
          });
          document.getElementById('custrecord_conf_tax_id_num').focus();
        }
        if (saveRecord) {
          return obj
        }
      } else if (taxnumber.length == 10 && confTaxnumber.length == 10) {
        //  currentRecord.setValue({fieldId:"custrecord_conf_tax_id_num",value:finalStr,ignoreFieldChange: true});
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
      fieldId: "custrecord_add_line_1",
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
      fieldId: "custrecord_add_line_2",
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
      fieldId: "custrecord_rest_tax_city",
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
      fieldId: "custrecord_rest_tax_state",
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
      fieldId: "custrecord_rest_tax_zip",
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
      fieldId: "custrecord_rest_tax_person",
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
      fieldId: "custrecord_rest_tax_telephone",
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
          fieldId: 'custrecord_rest_tax_telephone',
          value: '',
          ignoreFieldChange: true,
          forceSyncSourcing: false
        });
        document.getElementById('custrecord_rest_tax_telephone').focus();

      }
      if (saveRecord) return obj

    } else if (saveRecord && businesstelephoneregex.test(businesstelephone)) {
      obj.error = false
      return obj
    }

  }
  function corporateName(currentRecord, option, saveRecord) {
    var mname = currentRecord.getValue({
      fieldId: "custrecord_rest_tax_corp_name",
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
      fieldId: "custrecord_rest_tax_add",
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
      fieldId: "custrecord_malling_address2",
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
  function maliState(currentRecord, option, saveRecord) {
    var state = currentRecord.getValue({
      fieldId: "custrecord_rest_tax_state",
    });
    var stateregex = new RegExp("^[A-Za-z? ]{1,30}$");
    option.message = "State should be alphabets and maximum 30 characters are allowed.";
    var obj = { id: option.fields[13].label, message: option.message, error: true }

    if (state && !stateregex.test(state)) {
      if (!saveRecord) dialog.alert(option);
      if (saveRecord) return obj
    } else if (saveRecord && stateregex.test(state)) {
      obj.error = false
      return obj
    }
  }
  function malingCity(currentRecord, option, saveRecord) {
    var mcity = currentRecord.getValue({
      fieldId: "custrecord_rest_taxt_city",
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
      fieldId: "custrecord_rest_tax_mail_zip",
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
      fieldId: "custrecord_rest_corp_telephone",
    });
    var mccontatregex = new RegExp("^[A-Za-z? ]{1,30}$");
    option.message = "Corporate Contact allows only alphabets and maximum 30 characters are allowed.";
    var obj = { id: option.fields[16].label, message: option.message, error: true }

    if (mccontat && !mccontatregex.test(mccontat)) {
      if (!saveRecord) dialog.alert(option);
      if (saveRecord) return obj

    } else if (saveRecord && mccontatregex.test(mccontat)) {
      obj.error = false
      return obj
    }
  }

  //NETSFOPS-94
  function malingTelephone(currentRecord, option, saveRecord) {
    var mallingtelephone = currentRecord.getValue({
      fieldId: "custrecord_rest_tax_telephone_cont",
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
          fieldId: 'custrecord_rest_tax_telephone_cont',
          value: '',
          ignoreFieldChange: true,
          forceSyncSourcing: false
        });
        document.getElementById('custrecord_rest_tax_telephone_cont').focus();
      }

      if (saveRecord) return obj

    } else if (saveRecord && mallingtelephoneRegx.test(mallingtelephone)) {
      obj.error = false;
      return obj
    }

  }
  function BusinessOpenDate(currentRecord, option, saveRecord) {
    var openDate = currentRecord.getValue({
      fieldId: "custrecord_rest_bues_open_date",
    });
    var businessId = currentRecord.getValue({
      fieldId: "recordid",
    });
    // 123-456-789
    option.message = "Please select Business Open Date.";
    var obj = { id: 'Business Open Date', message: option.message, error: true }

    if (openDate && saveRecord && falg && businessId) {
      var payments = paymentsInDb(businessId);
      console.log(payments)
      var endDate = dateChange(openDate, payments);
      console.log(endDate)
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
      fieldId: "custrecord_rest_pay_period",
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
  function paymentsInDb(id) {
    // var searchPayment = nlapiSearchRecord("customerpayment", null,
    //   [
    //     ["type", "anyof", "CustPymt"],
    //     "AND",
    //     ["custbody_business_id", "anyof", id],
    //     "AND",
    //     ["mainline", "is", "T"]
    //   ],
    //   [
    //     new nlobjSearchColumn('custbody_tax_year'),
    //     new nlobjSearchColumn('custbody_tele_mnthly_year_2'),
    //     new nlobjSearchColumn('custbody_tele_mnthly_year3'),
    //     new nlobjSearchColumn('custbody_tax_month'),
    //     new nlobjSearchColumn('custbody_tele_mnth_month_2'),
    //     new nlobjSearchColumn('custbody_tele_mnthly_month3'),
    //     new nlobjSearchColumn('custbody_tele_amount_1'),
    //     new nlobjSearchColumn('custbody_tele_mnthly_amount2'),
    //     new nlobjSearchColumn('custbody_tele_mnthly_amount_3'),
    //     new nlobjSearchColumn('custbody_quarterly'),
    //     new nlobjSearchColumn('custbody_hotel_year_tax'),
    //     new nlobjSearchColumn('custbody_paymnt_amount1'),
    //     new nlobjSearchColumn('custbody_payment_amount2'),
    //     new nlobjSearchColumn('custbody_payment_amount3')

    //   ]
    // );
    var payment = {
      validation: {}
    }
    var columns = [
      'custbody_tax_year', 
      'custbody_tele_mnthly_year_2', 
      'custbody_tele_mnthly_year3', 
      'custbody_tax_month', 
      'custbody_tele_mnth_month_2',
      'custbody_tele_mnthly_month3',
      'custbody_tele_amount_1',
      'custbody_tele_mnthly_amount2',
      'custbody_tele_mnthly_amount_3',
      'custbody_quarterly',
      'custbody_hotel_year_tax',
      'custbody_paymnt_amount1',
      'custbody_payment_amount2',
      'custbody_payment_amount3'
    ];

    var filters = [
      ["type", "anyof", "CustPymt"],
      "AND",
      ["custbody_business_id", "anyof", id],
      "AND",
      ["mainline", "is", "T"]
    ];

    var searchPayment = callSearchSuitelet(filters, columns, 'customerpayment');

    var data = [];
    if (searchPayment) {
      searchPayment.forEach(function (result) {

        var typeOfPayment;
        var quarterly = null;
        var monthly = null;
        var hasData = false;
        var quarter = result.custbody_quarterly.text;
        var qtrAmt1 = result.custbody_paymnt_amount1.value;
        var qtrAmt2 = result.custbody_payment_amount2.value;
        var qtrAmt3 = result.custbody_payment_amount3.value;
        var qtrYear = result.custbody_hotel_year_tax.text;

        var monAmt1 = result.custbody_tele_amount_1.value;
        var monAmt2 = result.custbody_tele_mnthly_amount2.value;
        var monAmt3 = result.custbody_tele_mnthly_amount_3.value;
        var month1 = result.custbody_tax_month.value;
        var month2 = result.custbody_tele_mnth_month_2.value;
        var month3 = result.custbody_tele_mnthly_month3.value;
        var monYear1 = result.custbody_tax_year.text;
        var monYear2 = result.custbody_tele_mnthly_year_2.text;
        var monYear3 = result.custbody_tele_mnthly_year3.text;
        var obj = {
          "1": ['1', '2', '3'],
          "2": ['4', '5', '6'],
          "3": ['7', '8', '9'],
          "4": ['10', '11', '12']
        }
        var monthLevel = {
          '1': 'January',
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
        }


        if (quarter && qtrYear && (qtrAmt1 || qtrAmt2 || qtrAmt3)) {

          if (!(payment.validation.hasOwnProperty(qtrYear))) {
            payment.validation[qtrYear] = {}
          }


          typeOfPayment = 'Quarterly';
          hasData = true;
          var quart = result.custbody_quarterly.value;
          //    nlapiLogExecution('debug','quart',quart)
          var month = obj[quart];
          //nlapiLogExecution('debug','quart',JSON.stringify(month))
          //nlapiLogExecution('debug','quart',monthLevel[month[0]])
          if (qtrAmt1) {
            var m = monthLevel[month[0]];
            if (!(payment.validation[qtrYear].hasOwnProperty(m))) {
              payment.validation[qtrYear][m] = qtrAmt1
            }
          }
          if (qtrAmt2) {
            var m = monthLevel[month[1]];
            if (!(payment.validation[qtrYear].hasOwnProperty(m))) {
              payment.validation[qtrYear][m] = qtrAmt2
            }
          }
          if (qtrAmt3) {
            var m = monthLevel[month[2]];
            if (!(payment.validation[qtrYear].hasOwnProperty(m))) {
              payment.validation[qtrYear][m] = qtrAmt3
            }
          }

          // quarterly = str

        } else if (!quarter && (monYear1 && month1 && monAmt1)) {
          typeOfPayment = 'Monthly';
          hasData = true;



          if (monAmt1 && month1 && monYear1) {
            if (!(payment.validation.hasOwnProperty(monYear1))) {
              payment.validation[monYear1] = {}
            }
            var m = monthLevel[month1];
            if (!(payment.validation[monYear1].hasOwnProperty(m))) {
              payment.validation[monYear1][m] = monAmt1
            }
          }
          if (monAmt2 && month2 && monYear2) {
            if (!(payment.validation.hasOwnProperty(monYear2))) {
              payment.validation[monYear2] = {}
            }
            var m = monthLevel[month2];
            if (!(payment.validation[monYear2].hasOwnProperty(m))) {
              payment.validation[monYear2][m] = monAmt2
            }
          }
          if (monAmt3 && month3 && monYear3) {
            if (!(payment.validation.hasOwnProperty(monYear3))) {
              payment.validation[monYear3] = {}
            }
            var m = monthLevel[month3];
            if (!(payment.validation[monYear3].hasOwnProperty(m))) {
              payment.validation[monYear3][m] = monAmt3
            }

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
      url: '/app/site/hosting/scriptlet.nl?script=' + FILECONSTANT.BE_SEARCH_SUITELET_ID + '&deploy=' + FILECONSTANT.BE_SEARCH_SUITELET_DEPLOYMENT_ID,
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
  function lastDayfun(year, month) {
    return new Date(year, month, 0).getDate()
  }
  exports.pageInit = pageInit;
  exports.fieldChanged = fieldChanged;
  exports.saveRecord = saveRecord;
  //exports.validateField = validateField;


  return exports;
});