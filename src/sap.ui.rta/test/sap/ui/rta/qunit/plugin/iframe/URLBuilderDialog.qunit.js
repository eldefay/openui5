/*global QUnit*/

sap.ui.define([
	"sap/ui/rta/plugin/iframe/URLBuilderDialog",
	"sap/base/Log",
	"sap/ui/qunit/QUnitUtils",
	"sap/ui/rta/plugin/iframe/URLBuilderDialogController"
], function (
	URLBuilderDialog,
	Log,
	QUnitUtils,
	URLBuilderDialogController
) {
	"use strict";

	var oTextResources = sap.ui.getCore().getLibraryResourceBundle("sap.ui.rta");

	var mParameters = {
		editURL: "http://blabla.company.com",
		parameters: [{
			label: "Guid",
			key: "{Guid}",
			value: "guid13423412342314"
		}, {
			label: "Region",
			key: "{Region}",
			value: "Germany"
		}, {
			label: "Year",
			key: "{Year}",
			value: "2020"
		}, {
			label: "Month",
			key: "{Month}",
			value: "July"
		}, {
			label: "Product_Category",
			key: "{Product_Category}",
			value: "Ice Cream"
		}, {
			label: "Campaign_Name",
			key: "{Campaign_Name}",
			value: "Langnese Brand"
		}, {
			label: "Brand_Name",
			key: "{Brand_Name}",
			value: "Langnese"
		}]
	};

	function clickOnButton(sId) {
		var oCancelButton = sap.ui.getCore().byId(sId);
		QUnitUtils.triggerEvent("tap", oCancelButton.getDomRef());
	}

	function clickOnCancel() {
		clickOnButton("sapUiRtaURLBuilderDialogCancelButton");
	}

	QUnit.module("Given that a URLBuilderDialog is available...", {
		beforeEach: function () {
			this.oURLBuilderDialog = new URLBuilderDialog();
		}
	}, function () {
		QUnit.test("When URLBuilderDialog gets initialized and open is called,", function (assert) {
			this.oURLBuilderDialog.attachOpened(function () {
				assert.ok(true, "then dialog pops up,");
				assert.equal(this._oDialog.getTitle(), oTextResources.getText("IFRAME_URLBUILDER_DIALOG_TITLE"), "then the title is set");
				assert.equal(this._oDialog.getContent().length, 4, "then 4 controls are added ");
				assert.equal(this._oDialog.getButtons().length, 2, "then 2 buttons are added");
				clickOnCancel();
			});
			return this.oURLBuilderDialog.open();
		});

		QUnit.test("When parameters are passed to the dialog then they should be imported correctly", function (assert) {
			this.oURLBuilderDialog.attachOpened(function () {
				var oData = this.oURLBuilderDialog._oJSONModel.getData();
				Object.keys(mParameters).forEach(function (sFieldName) {
					assert.strictEqual(oData[sFieldName].value, mParameters[sFieldName], sFieldName + " is imported correctly");
				});
				clickOnCancel();
			}, this);
			return this.oURLBuilderDialog.open(mParameters);
		});

		QUnit.test("When Cancel button is clicked then the promise should return nothing", function (assert) {
			this.oURLBuilderDialog.attachOpened(function () {
				clickOnCancel();
			}, this);
			return this.oURLBuilderDialog.open().then(function (mSettings) {
				assert.strictEqual(mSettings, undefined, "The promise returns nothing");
			});
		});

		QUnit.test("When Save button is clicked then the promise should return the built URL", function (assert) {
			this.oURLBuilderDialog.attachOpened(function () {
				this.oURLBuilderDialog._oJSONModel.setProperty("/editURL/value", "BASE_URL?{Region}&{Product_Category}");
				clickOnButton("sapUiRtaURLBuilderDialogSaveButton");
			}, this);
			return this.oURLBuilderDialog.open(mParameters).then(function (sUrl) {
				assert.strictEqual(sUrl, "BASE_URL?Germany&Ice Cream", "URL is returned");
			});
		});

		QUnit.test("When the dialog is opened then hash map is built correctly", function (assert) {
			this.oURLBuilderDialog.attachOpened(function () {
				var mHashmap = URLBuilderDialogController.prototype._buildParameterHashMap(mParameters);
				mParameters.parameters.forEach(function (oParam) {
					assert.strictEqual(oParam.value, mHashmap[oParam.key], "Found " + oParam.key);
				});
				clickOnCancel();
			}, this);
			return this.oURLBuilderDialog.open();
		});

		QUnit.test("When URL parameters are added then the edit URL is built correctly", function (assert) {
			this.oURLBuilderDialog.attachOpened(function () {
				var sUrl = this.oURLBuilderDialog._oController._addURLParameter("firstParameter");
				this.oURLBuilderDialog._oJSONModel.setProperty("/editURL/value", sUrl);
				assert.ok(sUrl.indexOf("firstParameter") >= 0, "Found firstParameter");

				sUrl = this.oURLBuilderDialog._oController._addURLParameter("secondParameter");
				this.oURLBuilderDialog._oJSONModel.setProperty("/editURL/value", sUrl);
				assert.ok(sUrl.indexOf("secondParameter") >= 0, "Found secondParameter");

				sUrl = this.oURLBuilderDialog._oController._addURLParameter("thirdParameter");
				this.oURLBuilderDialog._oJSONModel.setProperty("/editURL/value", sUrl);
				assert.ok(sUrl.indexOf("thirdParameter") >= 0, "Found thirdParameter");

				clickOnCancel();
			}, this);
			return this.oURLBuilderDialog.open(mParameters);
		});

		QUnit.test("When Show Preview is clicked then preview URL is built correctly", function (assert) {
			var sUrl;
			this.oURLBuilderDialog.attachOpened(function () {
				mParameters.parameters.forEach(function (oParam) {
					sUrl = this.oURLBuilderDialog._oController._addURLParameter(oParam.key);
					this.oURLBuilderDialog._oJSONModel.setProperty("/editURL/value", sUrl);
				}, this);

				sUrl = this.oURLBuilderDialog._oController._buildPreviewURL(this.oURLBuilderDialog._oJSONModel.getProperty("/editURL/value"));
				mParameters.parameters.forEach(function (oParam) {
					assert.ok(sUrl.indexOf(oParam.value) >= 0, "Found " + oParam.key);
				}, this);
				clickOnCancel();
			}, this);
			return this.oURLBuilderDialog.open(mParameters);
		});
	});

	QUnit.done(function () {
		jQuery("#qunit-fixture").hide();
	});
});