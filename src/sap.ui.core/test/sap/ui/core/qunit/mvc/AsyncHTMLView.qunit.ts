import ResourceBundle from "sap/base/i18n/ResourceBundle";
import View from "sap/ui/core/mvc/View";
import HTMLView from "sap/ui/core/mvc/HTMLView";
import asyncTestsuite from "./AnyViewAsync.qunit";
import Log from "sap/base/Log";
var oConfig = {
    type: "HTML",
    factory: function (bAsync) {
        return sap.ui.view({
            type: "HTML",
            viewName: "testdata.mvc.Async",
            async: bAsync
        });
    },
    receiveSource: function (source) {
        return source;
    }
};
asyncTestsuite("Generic View Factory", oConfig);
oConfig.factory = function (bAsync) {
    return sap.ui.htmlview({
        viewName: "testdata.mvc.Async",
        async: bAsync
    });
};
asyncTestsuite("HTMLView Factory", oConfig);
QUnit.test("New create factory", function (assert) {
    assert.expect(3);
    var done = assert.async();
    var that = this;
    this.oLogMock = this.mock(Log);
    this.oLogMock.expects("warning").never();
    HTMLView.create({
        viewName: "testdata.mvc.Async"
    }).then(function (oViewLoaded) {
        assert.equal(that.oAfterInitSpy.callCount, 1, "AfterInit event fired before resolving");
        assert.ok(oViewLoaded instanceof HTMLView, "View created");
        done();
    });
});
var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
QUnit.module("Apply settings", {
    beforeEach: function () {
        sap.ui.getCore().getConfiguration().setLanguage("en-US");
    },
    afterEach: function () {
        sap.ui.getCore().getConfiguration().setLanguage(sDefaultLanguage);
    }
});
QUnit.test("New create factory async resource model", function (assert) {
    assert.expect(3);
    var oResourceBundleCreateSpy = sinon.spy(ResourceBundle, "create");
    return HTMLView.create({
        viewName: "testdata.mvc.AsyncWithResourceBundle"
    }).then(function (oViewLoaded) {
        assert.ok(oViewLoaded instanceof HTMLView, "View created");
        var oCreateCall = oResourceBundleCreateSpy.getCall(0);
        assert.ok(oCreateCall, "async call");
        assert.ok(oCreateCall.args[0].async, "async call");
        oResourceBundleCreateSpy.restore();
    });
});