/********************************************************
 * File Name : FOPS_CS_ViewMode.js
 * Purpose   : Clint Script for View Mode
 * 
 * History
 * Date             Author              Details
 * 24th May         Faizan Siddiki      Remove - REMOVE link on Payment Record.
 * 2nd June 2023    Faizan Siddiki      NETSFOPS-168 : Remove Edit link in View Mode
 *********************************************************/


define(['N/currentRecord', 'N/email'],
    function (currentRecord, email) {

        function sendFollowUpEmail() {
        }

        jQuery(document).ready(function() {

            debugger;
            var recordType = nlapiGetRecordType();
            var recordId = nlapiGetRecordId();
            if(recordType == 'customerpayment'){
                var removeLabel = jQuery('#div__lab10').attr('data-label');
                if(removeLabel == 'Remove')
                    jQuery('#div__lab10').text('');

                jQuery('#tdbody_newrecrecmachcustrecord_pd_customer_payment_link').remove();
                var removeLinks = jQuery('a[onclick*="recmachcustrecord_pd_customer_payment_link_remove_record"]');
                if(removeLinks.length == 0)
                    var removeLinks = jQuery('a[onclick*="recmachcustrecord_tobc_location_custmer_payment_remove_record"]');

                removeLinks.each(function() {
                    jQuery(this).remove();
                });

                //NETSFOPS-168
                if(recordId){
                    var removeLabel = jQuery('#div__lab1').attr('data-label');
                    if(removeLabel == 'Edit')
                        jQuery('#div__lab1').text('');

                    var removeLinks = jQuery('a[href*="CUSTRECORD_PD_CUSTOMER_PAYMENT_LINK"]');
                    if(removeLinks.length == 0)
                        var removeLinks = jQuery('a[href*="CUSTRECORD_TOBC_LOCATION_CUSTMER_PAYMENT"]');

                    removeLinks.each(function() {
                        jQuery(this).remove();
                    });
                }               
            }
            else if(recordType == 'customrecord_restaurant_tax'){
                jQuery('#div__lab12').text('');
                jQuery('#tdbody_newrecrecmachcustrecord_business_id').remove();
                var removeLinks = jQuery('a[onclick*="recmachcustrecord_business_id_remove_record"]');
                    removeLinks.each(function() {
                        jQuery(this).remove();
                    });

                jQuery("#recmachcustrecord_business_id_existingrecmachcustrecord_business_id_fs_lbl_uir_label").closest("div").hide();
                jQuery("#recmachcustrecord_business_id_searchid_fs_lbl_uir_label").closest("div").hide();
            }
            else if(recordType == 'customrecord_tobacco_tax'){
                jQuery('#div__lab11').text('');
                jQuery('#tdbody_newrecrecmachcustrecord_tobc_additional_business_id').remove();
                var removeLinks = jQuery('a[onclick*="recmachcustrecord_tobc_additional_business_id_remove_record"]');
                    removeLinks.each(function() {   
                        jQuery(this).remove();
                    });

                jQuery("#recmachcustrecord_tobc_additional_business_id_existingrecmachcustrecord_tobc_additional_business_id_fs_lbl").closest("div").hide();
                jQuery("#recmachcustrecord_tobc_additional_business_id_searchid_fs_lbl_uir_label").closest("div").hide();
            }
        });

        return {
            sendFollowUpEmail: sendFollowUpEmail
        }
    });