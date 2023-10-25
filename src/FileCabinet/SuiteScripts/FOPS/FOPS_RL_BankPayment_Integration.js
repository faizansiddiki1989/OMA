/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define(['N/record'], function(record) {
    function post(postDataPayload) {
        
        const FILECONSTANT = {
            'STATUS_PENDING' :1
        }
        
      try 
      {
        var strPayload = JSON.stringify(postDataPayload);
        log.debug('POST TRIGGERED', 'strPayload : '+strPayload);

        var customRecord = record.create({
          type: 'customrecord_bank_payment_payload'
        });

        customRecord.setValue({
          fieldId: 'custrecord_bpp_payload',
          value: strPayload
        });

        customRecord.setValue({
          fieldId: 'custrecord_bpp_status',
          value: FILECONSTANT.STATUS_PENDING
        });

        customRecord.setValue({
            fieldId: 'custrecord_bpp_event',
            value: postDataPayload.type
          });

        customRecord.save();

        var response = {};
        response.write(JSON.stringify({"Status":200 }));
        response.setContentType('JSON');
        return response;
      } 
      catch (e) 
      {
        log.error({
          title: 'Error processing JSON payload',
          details: e
        });

        return {
          "failed":
          {
             "code":400,
             "data": {},
             "message":"'INVALID_REQUEST' Missing required parameters"
          }
       } 
       // return {success: false};
      }
    }
  
    return {post: post};
  });
  