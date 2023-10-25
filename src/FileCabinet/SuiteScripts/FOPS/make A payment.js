define([], function() {
    
    var exports ={};
 
    function beforeLoad(context){
        context.form.addButton({
            id : "custpage_paymentButton",
            label : "make a payment",
            functionName : "onClickButton"

        });


    }

exports.beforeLoad = beforeLoad;
return exports;

    
});