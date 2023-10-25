/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/******************************************************************
 * File Name : FOPS_UE_Validate_TaxPayerID.js
 * Purpose   : To validate if Tax Payer ID already exist
 * Author    : Faizan Siddiki
 * Date      : 21/02/2023
 * 
 * History
 * Date             Author              Details
 * 20/06/2023       Faizan Siddiki      Added Tobacco Tax Record
 * 
 *******************************************************************/
define((require) => {
    'use strict';

    const record = require('N/record');
    const search = require('N/search');
    const error = require('N/error');
    const serverWidget = require('N/ui/serverWidget');


    const beforeSubmit = ({ type, newRecord, oldRecord }) => {

        const TARGET_RECORDOBJ = getRecordDetails(newRecord.type);
        log.debug('TARGET_RECORDOBJ', TARGET_RECORDOBJ+'   type : '+type+'   RECORD : '+JSON.stringify(newRecord));

        let taxPayerId = newRecord.getValue({ fieldId: TARGET_RECORDOBJ.TAX_ID_FLD });
        log.debug('Tax Payer ID :', taxPayerId);

        if (type != 'create') {

            let oldTaxPayerId = oldRecord.getValue({ fieldId: TARGET_RECORDOBJ.TAX_ID_FLD });
            log.debug("oldTaxPayerId", oldTaxPayerId);

            taxPayerId = (oldTaxPayerId != taxPayerId) ? taxPayerId : '';
        }

        log.debug("taxPayerId", taxPayerId);
        if (taxPayerId) {

            let existingTaxId = validateDuplicateTaxPayerID(taxPayerId, TARGET_RECORDOBJ);
            if (existingTaxId) {
                let taxError = error.create({
                    name: 'ERR_WS_CUSTOMER_TAX_NUMBER',
                    message: 'Tax Payer Id Number "' + taxPayerId + '" already exist Record Id : "' + existingTaxId + '". Please enter a different Tax Payer Id Number',
                    notifyOff: false
                });
                throw taxError.message
            }
        }
        return true;
    };

    /**RETURNS RECORD OBJ**/
    const getRecordDetails = (recType) => {

        if (recType == 'customrecord_restaurant_tax')
            return { 'RECTYPE': recType, 'TAX_ID_FLD': 'custrecord_rest_tax_pay_id_num' };
        else if (recType == 'customrecord_telephone_tax')
            return { 'RECTYPE': recType, 'TAX_ID_FLD': 'custrecord_conf_tax_id_num' };
        else if (recType == 'customrecord_tobacco_tax')
            return { 'RECTYPE': recType, 'TAX_ID_FLD': 'custrecord_tobc_tax_pay_id' };
        else if (recType == 'customrecord_hotel_motel_tax')
            return { 'RECTYPE': recType, 'TAX_ID_FLD': 'custrecord_hotel_taxpayer_id' };

        return {};
    }

    /**THIS FUNCTION WILL CHECK IF TAX PAYER ID EXIStS**/
    const validateDuplicateTaxPayerID = (tempTaxPayerId, recObj) => {

        let taxInternalId = '';
        //search on tax record
        const taxRecordSearch = search.create({
            type: recObj.RECTYPE,
            filters: [
                ['isinactive', 'is', false],
                'AND',
                [recObj.TAX_ID_FLD, 'is', tempTaxPayerId]
            ],
            columns: [recObj.TAX_ID_FLD, 'internalid']
        }).run().getRange({ start: 0, end: 1 });

        if (taxRecordSearch.length > 0) {
            const texRecord = taxRecordSearch[0];
            taxInternalId = texRecord.getValue('internalid');
            log.debug('validateDuplicateTaxPayerID :  taxInternalId : ', taxInternalId);
        }
        return taxInternalId;
    }

    const beforeLoad = (context) => {
        const currentForm = context.form;
        currentForm.clientScriptFileId = 45962; 
    }
    


    return  {beforeSubmit, beforeLoad};
});