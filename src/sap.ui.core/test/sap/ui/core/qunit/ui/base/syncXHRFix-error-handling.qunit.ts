import Device from "sap/ui/Device";
import syncXHRFix from "sap/ui/base/syncXHRFix";
var originalSetTimeout = window.setTimeout;
var baseURL = "test-resources/sap/ui/core/qunit/ui/base/";
QUnit.module("sap/ui/base/syncXHRFix (error handling)", {
    before: function () {
        var fnOriginalSend = window.XMLHttpRequest.prototype.send;
        window.XMLHttpRequest.prototype.send = function () {
            fnOriginalSend.apply(this, arguments);
            throw new Error("fake-error");
        };
        if (Device.browser.firefox && window.Proxy) {
            syncXHRFix();
        }
    }
});
QUnit.test("Failing XMLHttpRequest#send (sync)", function (assert) {
    assert.expect(6);
    var done = assert.async();
    var testDone = false;
    originalSetTimeout(function () {
        if (!testDone) {
            assert.ok(false, "Test timed out");
            done();
        }
    }, 10);
    Promise.resolve().then(function () {
        assert.ok(true, "Promise#then callback should be called");
    });
    setTimeout(function () {
        assert.ok(true, "setTimeout callback should be called");
        testDone = true;
        done();
    });
    var xhr = new XMLHttpRequest();
    assert.equal(xhr.readyState, 0, "Initial readyState");
    xhr.open("GET", baseURL, false);
    assert.equal(xhr.readyState, 1, "readyState after open should be 1");
    assert.throws(function () {
        xhr.send();
    }, /fake-error/, "xhr.send should throw the expected error");
    assert.equal(xhr.readyState, 4, "readyState should be updated even when 'send' is failing");
});
QUnit.test("Failing XMLHttpRequest#send (async)", function (assert) {
    assert.expect(6);
    var done = assert.async();
    var testDone = false;
    originalSetTimeout(function () {
        if (!testDone) {
            assert.ok(false, "Test timed out");
            done();
        }
    }, 10);
    Promise.resolve().then(function () {
        assert.ok(true, "Promise#then callback should be called");
    });
    setTimeout(function () {
        assert.ok(true, "setTimeout callback should be called");
        testDone = true;
        done();
    });
    var xhr = new XMLHttpRequest();
    assert.equal(xhr.readyState, 0, "Initial readyState");
    xhr.open("GET", baseURL, true);
    assert.equal(xhr.readyState, 1, "readyState after open should be 1");
    assert.throws(function () {
        xhr.send();
    }, /fake-error/, "xhr.send should throw the expected error");
    assert.equal(xhr.readyState, 1, "readyState should still be 1 even when 'send' is failing");
});