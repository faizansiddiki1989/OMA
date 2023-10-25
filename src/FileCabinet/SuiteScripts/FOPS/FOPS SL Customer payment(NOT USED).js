/**
* @NApiVersion 2.x
* @NModuleScope Public
* @NScriptType Suitelet
*/
define(["N/ui/serverWidget", "N/search"],
    function (ui, search) {
        function onRequest(context) {
            try {
                if (context.request.method == "GET") {
                    var form = ui.createForm({
                        title: "FOPS Payment Search",
                    });

                    form.clientScriptModulePath = 'SuiteScripts/FOPS/FOPS_CS_Customer_Payment.js';

                    var reqObj = context.request;
                    log.debug('GET INITIATED', 'reqObj' + JSON.stringify(reqObj));

                    var parametersObj = reqObj.parameters;
                    log.debug('GET', 'PARAMETER :' + JSON.stringify(parametersObj));

                    var businessTypeParam = parametersObj.businesstype;
                    log.debug('GET', 'BUSINESS TYPE :' + businessTypeParam);

                    if (businessTypeParam) {

                        // ADD FILED GROUP
                        form.addFieldGroup({
                            id: 'custpage_field_grp',
                            label: 'Filters'

                        });

                        var businessType = form.addField({
                            id: 'custpage_business_type',
                            label: 'Business Type',
                            type: ui.FieldType.SELECT,
                            source: 'customlist137',
                            container: 'custpage_field_grp'
                        });

                        businessType.defaultValue = businessTypeParam;

                        businessType.updateLayoutType({
                            layoutType: ui.FieldLayoutType.OUTSIDEABOVE
                        });

                        businessType.isMandatory = true;

                        var taxPayerid = form.addField({
                            id: 'custpage_tax_payer_id',
                            label: 'Tax Pyer Id',
                            type: 'Text',
                            container: 'custpage_field_grp'
                        });

                        taxPayerid.updateLayoutType({
                            layoutType: ui.FieldLayoutType.OUTSIDEABOVE
                        });

                        taxPayerid.isMandatory = true;

                        var businessName = form.addField({
                            id: 'custpage_business_name',
                            label: 'Business Name',
                            type: 'Text',
                            container: 'custpage_field_grp'
                        });

                        businessName.updateLayoutType({
                            layoutType: ui.FieldLayoutType.OUTSIDEABOVE
                        });

                        businessName.isMandatory = true;

                        // ADD BACK BUTTON
                        form.addButton({
                            id: 'custpage_back_btn',
                            label: 'Back',
                            functionName: 'backBtn'
                        })

                        log.debug('PUSH FILTERS', '----------------------- START PUSH FILTERS IN SAVE SEARCH--------------');

                        // var filtersArr = [];

                        // if (businessType) {
                        //     filtersArr.push(['custpage_business_type', 'is', businessType]);
                        // }

                        // if (taxPayerid) {
                        //     if (filtersArr.length > 0) {
                        //         filtersArr.push('AND')
                        //         filtersArr.push(['custpage_tax_payer_id', 'is', taxPayerid])
                        //     }
                        //     else {
                        //         filtersArr.push(['custpage_tax_payer_id', 'is', taxPayerid])
                        //     }
                        // }
                        // if (businessName) {
                        //     if (filtersArr.length > 0) {
                        //         filtersArr.push('AND');

                        //         filtersArr.push([
                        //             ['name.custbody_rest_tax_bus_id', 'is', businessName], 'OR',
                        //             ['name.custbody_business_id', 'is', businessName]
                        //         ]);

                        //     }
                        // }

                        // var fopsSearch = search.create({
                        //     type: '',
                        //     filters:

                        // })

                        var fopsLoadSaveSearch = search.load({
                            id: 'customsearch_fops_all_in_one_payment'
                        });

                        log.debug('SAVE SEARCH', JSON.stringify(fopsLoadSaveSearch));

                        var searchResult = fopsLoadSaveSearch.run().getRange({
                            start: 0,
                            end: 1000
                        });

                        log.debug('SAVE SEARCH', 'GET COLUMN : ' + JSON.stringify(searchResult));

                        var sublist = form.addSublist({
                            id: 'custpage_sublist',
                            label: 'Save Search Results',
                            type: ui.SublistType.LIST
                        });

                        log.debug('SAVE SEARCH', 'COLUMN  Length : ' + fopsLoadSaveSearch.columns.length);

                        var columnName = '';
                        for (var i = 0; i < fopsLoadSaveSearch.columns.length; i++) {
                            var column = fopsLoadSaveSearch.columns[i];
                            columnName = 'custpage_'+column.name;
                            log.debug('ADD FIELDS', 'columnName : '+columnName+ '   column : ' + column);
                           
                            sublist.addField({
                                id: columnName,
                                label: column.label,
                                type: 'text'
                            });
                         }

                        // ADD THE RESULT TO THE SUBLIST 
                        var line = 0;
                        var column = '';
                        var columnText = '';
                        var columnValue = '';
                        searchResult.forEach(function (result) {
                            for (var i = 0; i < fopsLoadSaveSearch.columns.length; i++) {
                                column = fopsLoadSaveSearch.columns[i];
                                columnName = 'custpage_'+column.name;
                                columnText = result.getText(column.name);
                                columnValue = result.getValue(column.name);

                                log.debug('ADD FIELDS', 'columnText : '+columnText+ '   VALUE : ' + result.getValue(column));
                                
                                if(columnValue)
                                    sublist.setSublistValue({
                                        id: columnName,
                                        line:line,
                                        value: columnText?columnText:columnValue
                                    });
                            }

                            // ADD ROWS
                            line++
                        });
                    } else {

                        // ADD FILED GROUP
                        form.addFieldGroup({
                            id: 'custpage_field_grp',
                            label: 'Filters'
                        });

                        // ADD FIELD
                        var customer = form.addField({
                            id: 'custpage_business_type',
                            label: 'Business Type',
                            type: ui.FieldType.SELECT,
                            source: 'customlist137',
                            container: 'custpage_field_grp'
                        });

                        customer.updateLayoutType({
                            layoutType: ui.FieldLayoutType.OUTSIDEABOVE
                        });

                        customer.isMandatory = true;

                        var taxPayerId = form.addField({
                            id: 'custpage_tax_payer_id',
                            label: 'Tax Pyer Id',
                            type: 'Text',
                            container: 'custpage_field_grp'
                        });

                        taxPayerId.updateLayoutType({
                            layoutType: ui.FieldLayoutType.OUTSIDEABOVE
                        });

                        taxPayerId.isMandatory = true;

                        var businessName = form.addField({
                            id: 'custpage_business_name',
                            label: 'Business Name',
                            type: 'Text',
                            container: 'custpage_field_grp'
                        });

                        businessName.updateLayoutType({
                            layoutType: ui.FieldLayoutType.OUTSIDEABOVE
                        });

                        businessName.isMandatory = true;
                    }


                    context.response.writePage(form);
                }

            } catch (e) {
                log.error('GET INPUT TRIGGER', e.toString());
            }
        }
        return {
            onRequest: onRequest
        }
    });