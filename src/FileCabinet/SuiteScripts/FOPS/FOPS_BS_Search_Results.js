/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

 /***********************************************************************************
 * File Name  : FOPS_BS_Search_Results.js
 * Purpose    : This script will return the search results
 * Date       : 29th Jan 2023
 * 
 * History
 * Date             Author              Details
 * 
 *************************************************************************************/

 define(['N/search'], function(search) {
    function onRequest(context) {
        var request = context.request;
        var response = context.response;

        // Get search parameters from the request
        var filters = JSON.parse(request.parameters.filters);
        var columns = JSON.parse(request.parameters.columns);
        var recordType = request.parameters.recordType;

        // Create the search
        var mySearch = search.create({
            type: recordType,
            filters: filters,
            columns: columns
        });

        // Run the search
        var searchResults = mySearch.run().getRange({
            start: 0,
            end: 1000
        });

        // Prepare the response
        var searchData = [];
        for (var i = 0; i < searchResults.length; i++) {
            var result = searchResults[i];

            // Add the data to the searchData array
            var data = {};
            for (var j = 0; j < columns.length; j++) {
                var column = columns[j];
                data[column.name] = {
                    'value': result.getValue({name: column.name}),
                    'text': result.getText({name: column.name})
                }
            }
            searchData.push(data);
        }

        // Write the response
        response.write(JSON.stringify(searchData));
    }
    return {
        onRequest: onRequest
    };
});
