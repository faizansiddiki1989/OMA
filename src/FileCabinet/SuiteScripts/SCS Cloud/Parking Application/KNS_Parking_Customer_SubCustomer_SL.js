/**
*@NApiVersion 2.1
*@NScriptType Suitelet
*/
define(['N/search', 'N/record', 'N/runtime'], function (search, record, runtime) {
  function onRequest(context) {
    var params = context.request.parameters; // {"param1":"value1"}
    //var param1 = params.param1; // value1
    log.debug('param', params)
    var responseObject = {
      success: true
    };
    const call_back = params.callback,
      action = params.action,
      custid = params.customer;

    //log.debug('context',context)
    if (context.request.method === 'GET') {
      if (action == 'isSubCustomer') {
        responseObject.tokens = getSubCustomersList(custid, true);
      }
      else if (action == 'getSubCustomers') {
        responseObject = getSubCustomersList(custid, false);
      }
      else if (action == 'getSubCustomer') {
        var subid = params.subid;
        responseObject = getSubCustomer(subid, custid);
      }
      else if (action == 'createSubCustomer') {
        const body = params.body;
        //const body = context.request.body;
        log.debug('body', body)
        var injs = JSON.parse(body);
        log.debug('injs', injs)
        responseObject = createSubCustomer(injs, custid);
      }
      else if (action == 'updateSubCustomer') {
        const body = params.body;
        //const body = context.request.body;
        log.debug('body', body)
        var injs = JSON.parse(body);
        log.debug('injs', injs)
        responseObject = createSubCustomer(injs, custid);
      }
      else if (action == 'deletecustomer') {
        responseObject = deActivateCustomerAndParking(custid);
      }
    }

    log.debug('response', JSON.stringify(responseObject))
    if (call_back == 'false') {
      context.response.setHeader({
        name: 'Content-Type',
        value: 'application/json'
      });
      context.response.write(JSON.stringify(responseObject))
    } else {
      context.response.write("callback(" + JSON.stringify(responseObject) + ")");
    }

  }
  function deActivateCustomerAndParking(customer) {
    try {
      const filters = [['custrecordscs_customers_name', 'anyof', customer]];
      const columns = ['internalid']
      var parkingApp = search.create({ type: 'customrecord_scs_parking_application', filters, columns });
      const searchResultCount = parkingApp.runPaged().count;
      log.debug('searchResultCount', searchResultCount)
      parkingApp.run().each(function (result) {
        record.submitFields({
          type: 'customrecord_scs_parking_application',
          id: result.getValue('internalid'),
          values: {
            'custrecord_op_pdpa_status': '2',
            'custrecord_po_cancellation_date': new Date()
          }
        });
      });
      var inactive = record.submitFields({
        type: record.Type.CUSTOMER,
        id: customer,
        values: {
          'isinactive': true
        }
      });
      return "success"
    } catch (error) {
      return 'error'
    }
  }
  function getSubCustomer(subid, custid) {
    var sub = subid
    if (subid == 'N') {
      subid = custid
    }
    var customerLookup = search.lookupFields({ type: 'customer', id: subid, columns: ['firstname', 'lastname', 'email', 'phone', 'internalid'] });

    customerLookup.internalid = customerLookup.internalid[0].value;
    if (sub == 'N') {
      customerLookup.firstname = '';
      customerLookup.lastname = '';
    }
    return customerLookup
  }
  function createSubCustomer(data, custid) {
    log.debug('update', data)
    log.debug('internalid', data['internalid'])
    if (data.edit && data.internalid) {
      var rec = record.load({
        type: 'customer',
        id: data.internalid
      });
    } else {
      var rec = record.create({
        type: 'customer',
        isDynamic: true
      });
    }
    rec.setValue({ fieldId: 'customform', value: 23 });  //parking customer form
    rec.setValue({ fieldId: 'entitystatus', value: 13 }); // won customer
    rec.setValue({ fieldId: 'category', value: 2 }); // parking
    rec.setValue({ fieldId: 'isperson', value: 'T' });
    rec.setValue({ fieldId: 'firstname', value: data.firstname });
    rec.setValue({ fieldId: 'lastname', value: data.lastname });
    rec.setValue({ fieldId: 'email', value: data.email });
    rec.setValue({ fieldId: 'phone', value: data.phone });
    rec.setValue({ fieldId: 'parent', value: custid })
    var id = rec.save();
    return id
  }
  function getSubCustomersList(custid, countType) {
    var filters = [['parent', 'anyof', custid], 'and', ['internalid', 'noneof', custid], 'and', ['isinactive', 'is', 'F']
    ],
      columns = [
        'email',
        'internalid',
        'firstname',
        'lastname',
        'isperson',
        'companyname',
        'entityid',
        'phone'
      ],
      customerSearchObj = search.create({ type: search.Type.CUSTOMER, filters, columns });
    const data = [];

    const searchResultCount = customerSearchObj.runPaged().count;
    log.debug('searchResultCount', searchResultCount)
    customerSearchObj.run().each(function (result) {
      let parkingid = '';
      let subCustomerid = result.getValue('internalid');
      var parking_application = search.create({
        type: "customrecord_scs_parking_application",
        filters:
          [
            ["custrecordscs_customers_name", "anyof", subCustomerid],
            "AND",
            ["isinactive", "is", "F"]
          ],
        columns:
          [
            search.createColumn({
              name: "name",
              sort: search.Sort.ASC,
              label: "Name"
            }),
            search.createColumn({ name: "internalid", label: "Internal ID" })
          ]
      });
      log.debug('parking_application', parking_application.runPaged().count)
      // Add additional code 

      var scriptObj = runtime.getCurrentScript();
      log.debug('Remaining governance units: ' + scriptObj.getRemainingUsage());
      // Add additional code 


      parking_application.run().each(function (parking) {
        // .run().each has a limit of 4,000 results
        parkingid = parking.getValue('internalid');
        return true;
      });
      data.push({
        internalid: subCustomerid,
        email: result.getValue('email'),
        firstname: result.getValue('firstname'),
        lastname: result.getValue('lastname'),
        isperson: result.getValue('isperson'),
        companyname: result.getValue('companyname'),
        entity: result.getValue('entityid'),
        phone: result.getValue('phone'),
        parkingid: parkingid
      })
      return true;
    });

    if (countType) {
      return searchResultCount
    } else {
      return data
    }
  }

  return {
    onRequest: onRequest
  };
});

