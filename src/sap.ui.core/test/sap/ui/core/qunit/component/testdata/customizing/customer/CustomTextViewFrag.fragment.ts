import TextView from "sap/ui/commons/TextView";
import Fragment from "sap/ui/core/Fragment";
sap.ui.jsfragment("testdata.customizing.customer.CustomTextViewFrag", {
    createContent: function (oController) {
        var oTextView = new TextView("iHaveCausedDestruction", {
            text: "Hello World"
        });
        return oTextView;
    }
});