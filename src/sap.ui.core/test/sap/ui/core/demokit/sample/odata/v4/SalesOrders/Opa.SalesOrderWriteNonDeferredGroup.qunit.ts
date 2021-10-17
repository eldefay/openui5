import Helper from "sap/ui/core/sample/common/Helper";
import WriteNonDeferredGroupTest from "sap/ui/core/sample/odata/v4/SalesOrders/tests/WriteNonDeferredGroup";
import opaTest from "sap/ui/test/opaQunit";
import TestUtils from "sap/ui/test/TestUtils";
Helper.qUnitModule("sap.ui.core.sample.odata.v4.SalesOrders - " + "Write via application groups with SubmitMode.Auto/.Direct");
if (!TestUtils.isRealOData()) {
    QUnit.skip("Test runs only with realOData=true");
    return;
}
[
    "myAutoGroup",
    "$auto",
    "$auto.foo",
    "myDirectGroup",
    "$direct"
].forEach(function (sGroupId) {
    opaTest("POST/PATCH SalesOrder via group: " + sGroupId, WriteNonDeferredGroupTest.writeNonDeferredGroup.bind(null, sGroupId, ""));
});