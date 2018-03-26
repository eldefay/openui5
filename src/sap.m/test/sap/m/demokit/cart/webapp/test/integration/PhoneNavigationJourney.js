/*global QUnit*/

sap.ui.define([
	"sap/ui/test/opaQunit"
], function (opaTest) {
	"use strict";

	QUnit.module("Phone navigation");

	opaTest("Should navigate to a product detail page by pressing the product link of the first product tile", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();
		//Actions
		When.onTheWelcomePage.iLookAtTheScreen();
		When.onTheWelcomePage.iPressTheProductLink();
		// Assertions
		Then.onTheProduct.iShouldSeeTheProductPage();
	});

	opaTest("Should press back button and navigate to welcome view", function (Given, When, Then) {
		// Actions
		When.onTheCategory.iPressTheBackButtonInProduct();
		// Assertions
		Then.onTheWelcomePage.iShouldSeeTheWelcomePage();
	});

	opaTest("The category view should open by pressing the menu button", function (Given, When, Then) {
		//Actions
		When.onTheWelcomePage.iPressTheMenuButton();
		// Assertions
		Then.onHome.iShouldSeeTheCategoryList();
	});

	opaTest("Should see the product list", function (Given, When, Then) {
		// Actions
		When.onHome.iPressOnTheFlatScreensCategory();
		// Assertions
		Then.onTheCategory.iShouldBeTakenToTheFlatScreensCategory().
		and.iShouldSeeTheProductList().
		and.iShouldSeeSomeEntriesInTheProductList();
		// Cleanup
		Then.iTeardownMyApp();
	});
});
