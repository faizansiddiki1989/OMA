/**
  * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/http', 'N/url', 'N/search', 'N/record', 'N/ui/dialog'],
    function (ui, http, url, search, record, dialogobj) {
        function inventoryDetails(context) {
            if (context.request.method == 'GET') {
                try {
                    var formObj = ui.createForm({
                        title: "Inventory Managment"
                    });

                    // ATTACH CLIENT SIDE SCRIPT
                    formObj.clientScriptModulePath = 'SuiteScripts/GILL_CS_Inventory_Managment_script';
                    log.debug('GET CONTEXT', context);
                    
                    var reqObj = context.request;
                    log.debug('GET INITIATED', 'reqObj' + JSON.stringify(reqObj));
                    
                    var parametersObj = reqObj.parameters;
                    log.debug('GET', 'PARAMETER :' + JSON.stringify(parametersObj));
                    
                    var itemId = parametersObj.item;
                    var locationId = parametersObj.location;
                    var step = parametersObj.step;
                    var invIdParam = parametersObj.iaid;
                    log.debug('PARAMETER', 'GET VALUES FROM PARAMETER ITEM :' + itemId + ' LOCATION :' + locationId + ' STEP :' + step  + ' INVENTORY ADJUSTMENT RECORD ID :' + invIdParam);
                   
                    if(invIdParam){
                     dialogobj.alert({ title: 'NetSuite Alert', message: 'You are open Inventory Managment Suitelet' })
                    }
                    // add hidden field 
                    var stepHidd = formObj.addField({
                        id: 'custpage_step',
                        label: 'Step',
                        type: 'text'
                    });

                    stepHidd.updateDisplayType({
                        displayType: ui.FieldDisplayType.DISABLED
                    });
                    stepHidd.defaultValue = step;

                    //WHEN LOCATION AND ITEM SELECTED
                    if (itemId && locationId && step == 'Final') {
                        // ADD INVENTORY ADJUSTMENT BUTTON
                        formObj.addSubmitButton({
                            label: 'Inventory Adjustment'
                        });

                        // ADD RESET BUTTON
                        formObj.addButton({
                            id: 'custpage_reset_button',
                            label: 'Reset',
                            functionName: 'backToPreviousPage'
                        });

                        // ADD FIELD GROUP
                        formObj.addFieldGroup({
                            id: 'custpage_add_field_group',
                            label: 'Primary Information',
                        });

                        // ADD FILED 
                        var itemFieldObj = formObj.addField({
                            id: 'custpage_item',
                            label: 'Item',
                            type: ui.FieldType.SELECT,
                            source: 'item',
                            container: 'custpage_add_field_group'
                        });
                        itemFieldObj.isMandatory = true;
                        itemFieldObj.defaultValue = itemId;
                        itemFieldObj.updateDisplayType({
                            displayType: ui.FieldDisplayType.DISABLED
                        });

                        var locationFieldObj = formObj.addField({
                            id: 'custpage_location',
                            label: 'Location',
                            type: ui.FieldType.SELECT,
                            source: 'location',
                            container: 'custpage_add_field_group'
                        });
                        locationFieldObj.isMandatory = true;
                        locationFieldObj.defaultValue = locationId;
                        locationFieldObj.updateDisplayType({
                            displayType: ui.FieldDisplayType.DISABLED
                        });

                        var quantityOnHandField = formObj.addField({
                            id: 'custpage_quantity_on_hand',
                            label: 'On Hand Quantity',
                            type: 'Text',
                            container: 'custpage_add_field_group'
                        });
                        quantityOnHandField.isMandatory = true;



                        var newQuantityField = formObj.addField({
                            id: 'custpage_new_quantity',
                            label: 'New Quantity',
                            type: ui.FieldType.INTEGER,
                            container: 'custpage_add_field_group'
                        });
                        newQuantityField.isMandatory = true;

                        var inventoryQuantityOnHand = getItemQuantityByLOcation(itemId, locationId);

                        quantityOnHandField.defaultValue = inventoryQuantityOnHand;

                        quantityOnHandField.updateDisplayType({
                            displayType: ui.FieldDisplayType.DISABLED
                        });

                    } else {
                        // ADD SAERCH BUTTON
                        formObj.addSubmitButton({
                            label: 'Search'
                        });

                        formObj.addFieldGroup({
                            id: 'custpage_field_group',
                            label: 'Primary Information',
                        });


                        // ADD FILED 
                        var itemFieldObj = formObj.addField({
                            id: 'custpage_item',
                            label: 'Item',
                            type: ui.FieldType.SELECT,
                            source: 'item',
                            container: 'custpage_field_group'
                        });
                        itemFieldObj.isMandatory = true;



                        var locationFieldObj = formObj.addField({
                            id: 'custpage_location',
                            label: 'Location',
                            type: ui.FieldType.SELECT,
                            source: 'location',
                            container: 'custpage_field_group'
                        });
                        locationFieldObj.isMandatory = true;
                    }
                    context.response.writePage(formObj);
                    
                } catch (e) {
                    log.error('GET INPUT TRIGGER', e.toString());
                }
            } 
            else {
                // START POST METHOD
                var reqObj = context.request;
                log.debug('POST INITIATED', 'reqObj' + JSON.stringify(reqObj));

                var parametersObj = reqObj.parameters;
                log.debug('POSt', 'PARAMETER :' + JSON.stringify(parametersObj));

                var itemParam = parametersObj.custpage_item;
                var locationParam = parametersObj.custpage_location;
                var stepPost = parametersObj.custpage_step;
                log.debug('POST METHOD', ' GET VALUES FROM POST METHOD : ' + 'ITEM PARAM :' + itemParam + ' LOCATION PARAM :' + locationParam + ' POST STEP :' + stepPost);
                
                if (stepPost) {
                    var quantity = parametersObj.custpage_new_quantity;
                    log.debug('POST', 'GET VALUE FROM QUANTITY :' + quantity);
                    if (quantity) {
                        // CREATE INVENTORY ADJUSTMENT RECORD
                        var createInventoryAdjsRec = record.create({
                            type: 'inventoryadjustment',
                            isDynamic: true,
                        });

                        createInventoryAdjsRec.setValue({
                            fieldId: 'account',
                            value: 12,
                            ignoreFieldChange: true
                        });

                        createInventoryAdjsRec.setValue({
                            fieldId: 'class',
                            value: 27,
                            ignoreFieldChange: true
                        });

                        createInventoryAdjsRec.setValue({
                            fieldId: 'department',
                            value: 1,
                            ignoreFieldChange: true
                        });

                        createInventoryAdjsRec.setValue({
                            fieldId: 'adjlocation',
                            value: Number(locationParam),
                            ignoreFieldChange: true
                        });

                        createInventoryAdjsRec.selectNewLine({
                            sublistId: 'inventory'
                        });

                        createInventoryAdjsRec.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'item',
                            value: Number(itemParam)
                        });

                        createInventoryAdjsRec.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'location',
                            value: Number(locationParam)
                        });

                        createInventoryAdjsRec.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'adjustqtyby',
                            value: quantity
                        });


                        createInventoryAdjsRec.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'department',
                            value: 1
                        });

                        createInventoryAdjsRec.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'department',
                            value: 1
                        });

                        createInventoryAdjsRec.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'class',
                            value: 27
                        });

                        createInventoryAdjsRec.commitLine({
                            sublistId: 'inventory'
                        });

                        var newInvAdjsRecId = createInventoryAdjsRec.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        log.debug('NEW INVENTORY ADJUSTMENT RECORD ID', newInvAdjsRecId);

                        // REDIRECT TO SAME SUITELET
                        context.response.sendRedirect({
                            identifier: 'customscript_gi_sl_inve_manag_script',
                            type: http.RedirectType.SUITELET,
                            id: 'customdeploy_gi_sl_inve_manag_script',
                            parameters: {
                                'iaid': newInvAdjsRecId
                            }
                        });

                    }
                } else {
                    // REDIRECT TO SAME SUITELET
                    context.response.sendRedirect({
                        identifier: 'customscript_gi_sl_inve_manag_script',
                        type: http.RedirectType.SUITELET,
                        id: 'customdeploy_gi_sl_inve_manag_script',
                        parameters: {
                            'item': itemParam,
                            'location': locationParam,
                            'step': 'Final'
                        }
                    });
                }

                // GET URL TO SAME SUITELET
                url.resolveScript({
                    scriptId: 'customscript_gi_sl_po_script',
                    deploymentId: 'customdeploy_gi_sl_po_script',
                    returnExternalUrl: false
                });

            }
        }
        // CREATE FUNCTION
        function getItemQuantityByLOcation(itemId, locationId) {
            // CRAETE SEARCH ON ITEM RECORD
            var inventoryitemSearchObj = search.create({
                type: "inventoryitem",
                filters:
                    [
                        ["type", "anyof", "InvtPart"],
                        "AND",
                        ["isinactive", "is", "F"],
                        "AND",
                        ["inventorylocation", "anyof", locationId],
                        "AND",
                        ["internalid", "anyof", itemId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "locationquantityonhand", label: "LocationA On Hand" })
                    ]
            });
            log.debug('CREATE SAVE SEARCH', ' GET VALUES FROM SAVE SEARCH :' + JSON.stringify(inventoryitemSearchObj));

            // GET VALUES FROM SCRIPT SAVE SEARCH
            var locationOnHand = '';
            inventoryitemSearchObj.run().each(function (result) {
                locationOnHand = result.getValue({
                    name: 'locationquantityonhand'
                });
                log.debug('GET VALUES', ' QUANTITY ON HAND : ' + locationOnHand);

                return true;

            });
            log.debug('ARRAY', locationOnHand);
            return locationOnHand;

        }
        return {
            onRequest: inventoryDetails
        }
    });