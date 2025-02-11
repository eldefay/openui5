/*global QUnit, sinon */
sap.ui.define([
	"sap/m/routing/Router",
	"sap/m/routing/TargetHandler",
	"sap/m/NavContainer",
	"sap/m/SplitContainer",
	"sap/m/Page",
	"sap/ui/core/routing/Views",
	"./commonIntegrationTests",
	"sap/m/routing/Target",
	"sap/ui/core/routing/Target",
	"./helpers",
	"sap/ui/qunit/QUnitUtils",
	"sap/ui/qunit/utils/createAndAppendDiv",
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller", // provides sap.ui.controller
	"sap/ui/core/mvc/JSView" // provides sap.ui.jsview
], function(
	Router,
	TargetHandler,
	NavContainer,
	SplitContainer,
	Page,
	Views,
	integrationTests,
	MobileTarget,
	Target,
	helpers,
	qutils,
	createAndAppendDiv,
	Device
) {
	"use strict";

	// prepare DOM
	createAndAppendDiv("content");


	var fnCreateRouter = function() {
		var args = Array.prototype.slice.call(arguments);

		args.unshift(Router);

		if (args.length < 3) {
			args[2] = {};
		}
		if (args[2] === null) {
			args[2] = {};
		}
		args[2].async = true;

		return new (Function.prototype.bind.apply(Router, args))();
	};

	QUnit.module("Construction and destruction");

	QUnit.test("Should pass the targetHandler to the targets instance", function (assert) {
		// System under test
		var oRouter = fnCreateRouter(null, null, null, {});

		// Assert
		assert.strictEqual(oRouter._oTargets._oTargetHandler, oRouter._oTargetHandler, "Did pass the target handler");

		oRouter.destroy();
	});

	QUnit.test("Should work for routes which don't have view info", function (assert) {
		// Arrange + System under test
		var sPattern = "product",
				oRouter = fnCreateRouter([
					{
						name: "first",
						pattern: sPattern
					}
				]);

		var oRoute = oRouter.getRoute("first"),
			oListenerSpy = sinon.spy(),
			oRouteMatchedSpy = sinon.spy(oRoute, "_routeMatched");

		oRoute.attachPatternMatched(oListenerSpy);

		// Act
		oRouter.parse(sPattern);

		// If no view info is provided for a route, the internal target instance should not be sap.m.routing.Target
		assert.ok(oRoute._oTarget instanceof Target && !(oRoute._oTarget instanceof MobileTarget), "The internal target instance for old syntax should be only a core target");

		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "first route is matched");

		return oRouteMatchedSpy.returnValues[0].then(function() {
			assert.strictEqual(oListenerSpy.callCount, 1, "first route gets pattern matched");

			// Cleanup
			oRouteMatchedSpy.restore();

			oRouter.destroy();
		});
	});

	QUnit.module("add and execute navigations", {
		beforeEach: function () {
			var that = this;
			this.oStartPage = new Page();
			this.oNavContainer = new NavContainer({
				pages: this.oStartPage
			});
			this.sPattern = "some/{eventData}";
			this.oToPage = new Page();
			this.oTargetConfiguration = {
				controlId: this.oNavContainer.getId(),
				transition: "flip",
				viewName: "anyThingToPassValidation",
				viewLevel: 5,
				transitionParameters: { some: "parameter"}
			};
			// System under test
			this.oRouter = fnCreateRouter({
				myRoute: {
					pattern: this.sPattern,
					target: "myTarget"
				}
			},
			{
				controlAggregation: "pages"
			},
			null,
			{
				myTarget: this.oTargetConfiguration
			});

			this.oViewMock = {
				loaded: function() {
					return Promise.resolve(that.oToPage);
				},
				isA: function(sClass) {
					return sClass === "sap.ui.core.mvc.View";
				}
			};
		},
		afterEach: function () {
			this.oNavContainer.destroy();
			this.oToPage.destroy();
			this.oStartPage.destroy();
			this.oRouter.destroy();
		}
	});

	QUnit.test("Should do a forward navigation", function (assert) {
		//Arrange
		var that = this,
			oToSpy = sinon.spy(this.oNavContainer, "to"),
			oNavigateSpy = sinon.spy(this.oRouter._oTargetHandler, "navigate"),
			oRouteMatchedSpy = sinon.spy(this.oRouter.getRoute("myRoute"), "_routeMatched");

		this.stub(Views.prototype, "_getView").callsFake(function () {
			return that.oViewMock;
		});

		//Act
		this.oRouter.parse("some/myData");
		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched method is called once");

		return oRouteMatchedSpy.returnValues[0].then(function() {
			//Assert
			assert.strictEqual(oToSpy.callCount, 1, "did call the 'to' function on the oNavContainer instance");
			sinon.assert.calledWithExactly(oToSpy, this.oToPage.getId(), this.oTargetConfiguration.transition, { eventData: "myData"}, this.oTargetConfiguration.transitionParameters);

			assert.strictEqual(oNavigateSpy.callCount, 1, "did call the 'navigate' function on the TargetHandler instance");
			sinon.assert.calledWithExactly(oNavigateSpy, {
				askHistory: true,
				navigationIdentifier: "myTarget",
				viewLevel: 5
			});
			oToSpy.restore();
			oNavigateSpy.restore();
			oRouteMatchedSpy.restore();
		}.bind(this));
	});

	///////////////////////////////////////////////////////
	/// Integation test
	///////////////////////////////////////////////////////
	QUnit.module("Integration tests");

	function createViewAndController(sName) {
		sap.ui.controller(sName, {});
		sap.ui.jsview(sName, {
			createContent: function () {
			},
			getController: function () {
				return sap.ui.controller(sName);
			}
		});

		return sap.ui.jsview(sName);
	}

	QUnit.test("Should respect the viewlevel for multiple targets", function (assert) {
		//Arrange
		var oNavContainer = new NavContainer(),
			oRouter = fnCreateRouter(
				{
					"route": {
						pattern: "anyPattern",
						target: ["first", "second"]
					}
				},
				{
					viewType: "JS",
					controlAggregation:"pages",
					controlId: oNavContainer.getId()
				},
				null,
				{
					first: {
						viewName: "first"
					},
					second: {
						viewName: "second",
						viewLevel: 0
					},
					initial: {
						viewName: "initial",
						viewLevel: 1
					}
				}),
			fnBackSpy = sinon.spy(oNavContainer, "backToPage"),
			oRouteMatchedSpy = sinon.spy(oRouter.getRoute("route"), "_routeMatched");

		// views
		createViewAndController("first");
		createViewAndController("second");
		createViewAndController("initial");

		return oRouter.getTargets().display("initial").then(function() {
			// Act
			oRouter.parse("anyPattern");
			assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched method is called once");

			return oRouteMatchedSpy.returnValues[0];
		}).then(function() {
			// Assert
			assert.strictEqual(fnBackSpy.callCount, 1, "Did execute a back navigation");
			assert.strictEqual(fnBackSpy.firstCall.args[0], oRouter.getView("second").getId(), "The second page was target of the back navigation");

			// Cleanup
			oRouter.destroy();
			fnBackSpy.restore();
			oRouteMatchedSpy.restore();
		});
	});

	QUnit.test("Should take the viewLevel from the first ancester which has a viewLevel if a target doesn't have viewLevel defined", function (assert) {
		//Arrange
		var oNavContainer = new NavContainer(),
			oRouter = fnCreateRouter(
				{
					"route": {
						pattern: "anyPattern",
						target: ["third"]
					}
				},
				{
					viewType: "JS",
					controlAggregation:"pages",
					controlId: oNavContainer.getId()
				},
				null,
				{
					first: {
						viewName: "first",
						viewLevel: 1
					},
					second: {
						parent: "first",
						viewName: "second"
					},
					third: {
						parent: "second",
						viewName: "third"
					},
					initial: {
						viewName: "initial",
						viewLevel: 2
					}
				}),
			fnBackSpy = sinon.spy(oNavContainer, "backToPage"),
			oRouteMatchedSpy = sinon.spy(oRouter.getRoute("route"), "_routeMatched");

		// views
		createViewAndController("first");
		createViewAndController("second");
		createViewAndController("third");
		createViewAndController("initial");

		return oRouter.getTargets().display("initial").then(function() {
			// Act
			oRouter.parse("anyPattern");
			assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched method is called once");

			return oRouteMatchedSpy.returnValues[0];
		}).then(function() {
			// Assert
			assert.strictEqual(fnBackSpy.callCount, 1, "Did execute a back navigation");
			assert.strictEqual(fnBackSpy.firstCall.args[0], oRouter.getView("third").getId(), "The second page was target of the back navigation");

			// Cleanup
			oRouter.destroy();
			fnBackSpy.restore();
			oRouteMatchedSpy.restore();
		});
	});


	QUnit.test("Should pass some data to the SplitContainer", function (assert) {
		//Arrange
		var oSplitContainer = new SplitContainer({
					masterPages: [createViewAndController("InitialMaster")]
				}),
				oRouter = fnCreateRouter({
					"Master": {
						targetControl: oSplitContainer.getId(),
						pattern: "{id}",
						view: "Master",
						viewType: "JS",
						targetAggregation: "masterPages"
					}
				}),
				data = null,
				oRouteMatchedSpy = sinon.spy(oRouter.getRoute("Master"), "_routeMatched");

		this.stub(Device.system, "phone").value(false);

		// views
		createViewAndController("Master");

		oRouter.getView("Master", "JS").addEventDelegate({
			onBeforeShow: function (oEvent) {
				data = oEvent.data.id;
			}
		});

		// Act
		oRouter.parse("5");
		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched method is called once");

		return oRouteMatchedSpy.returnValues[0].then(function() {
			// Assert
			assert.strictEqual(data, "5", "should pass 5 to the page");

			// Cleanup
			oRouter.destroy();
			oRouteMatchedSpy.restore();
		});

	});

	QUnit.test("Should pass some data to the initial page of NavContainer", function(assert) {
		assert.expect(2);

		var oNavContainer = new NavContainer(),
			oRouter = fnCreateRouter({
				"route1": {
					targetControl: oNavContainer.getId(),
					pattern: "{id}",
					view: "view1",
					viewType: "JS",
					targetAggregation: "pages"
				}
			}),
			data = null,
			oRouteMatchedSpy = sinon.spy(oRouter.getRoute("route1"), "_routeMatched"),
			done = assert.async();

		// views
		createViewAndController("view1");
		oRouter.getView("view1", "JS").addEventDelegate({
			onBeforeShow: function(oEvent) {
				data = oEvent.data.id;
				// Assert
				assert.strictEqual(data, "5", "should pass 5 to the page");
			},
			onAfterShow: function(oEvent) {
				// Cleanup
				oNavContainer.destroy();
				oRouter.destroy();

				oRouteMatchedSpy.restore();
				done();
			}
		});

		oRouter.getRoute("route1").attachPatternMatched(function() {
			oNavContainer.placeAt("content");
		});

		// Act
		oRouter.parse("5");
		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched method is called once");
	});

	QUnit.test("Should pass some data to the initial pages of SplitContainer", function(assert) {
		assert.expect(3);

		var oSplitContainer = new SplitContainer(),
			oRouter = fnCreateRouter({
				route1: {
					pattern: "{id}",
					target: ["master", "detail"]
				}
			}, {
				viewType: "JS",
				controlId: oSplitContainer.getId()
			}, null, {
				master: {
					controlAggregation: "masterPages",
					viewName: "master"
				},
				detail: {
					controlAggregation: "detailPages",
					viewName: "detail"
				}
			}),
			oMasterData = null,
			oDetailData = null,
			oRouteMatchedSpy = sinon.spy(oRouter.getRoute("route1"), "_routeMatched"),
			done = assert.async();

		// views
		createViewAndController("master");
		createViewAndController("detail");
		oRouter.getView("master", "JS").addEventDelegate({
			onBeforeShow: function(oEvent) {
				oMasterData = oEvent.data.id;
			}
		});
		oRouter.getView("detail", "JS").addEventDelegate({
			onBeforeShow: function(oEvent) {
				oDetailData = oEvent.data.id;
				// Assert
				assert.strictEqual(oMasterData, "5", "should pass 5 to the master page");
				assert.strictEqual(oDetailData, "5", "should pass 5 to the detail page");
			},
			onAfterShow: function(oEvent) {
				// Cleanup
				oSplitContainer.destroy();
				oRouter.destroy();
				oRouteMatchedSpy.restore();
				done();
			}
		});

		oRouter.getRoute("route1").attachMatched(function() {
			oSplitContainer.placeAt("content");
		});

		// Act
		oRouter.parse("5");
		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched method is called once");
	});

	QUnit.module("Routes using targets mixed with old routes", {
		beforeEach: function () {
			this.oMasterDummy = new Page();
			this.oDetailDummy = new Page();
			this.oSplitContainer = new SplitContainer({
				masterPages: this.oMasterDummy,
				detailPages: this.oDetailDummy
			});
			this.oMasterView = createViewAndController("Master");
			this.oDetailView = createViewAndController("Detail");
			this.sPattern = "somePattern";
			// System under test
			this.oRouter = fnCreateRouter({
						myMasterRoute: {
							targetAggregation: "masterPages",
							view: "Master",
							subroutes: [
								{
									name: "detailRoute",
									pattern: this.sPattern,
									target: "detailTarget"
								}
							]
						}
					},
					{
						transition: "flip",
						viewLevel: 5,
						transitionParameters: { some: "parameter"},
						controlId: this.oSplitContainer.getId(),
						targetControl: this.oSplitContainer.getId(),
						targetAggregation: "detailPages",
						controlAggregation: "detailPages",
						viewType: "JS"
					},
					null,
					{
						detailTarget: {
							viewName: "Detail"
						}
					});
			this.oRouter.getViews().setView("Detail", this.oDetailView);
			this.oRouter.getViews().setView("Master", this.oMasterView);
		},
		afterEach: function () {
			this.oSplitContainer.destroy();
			this.oRouter.destroy();
		}
	});

	QUnit.test("Should be able to handle the mixed case", function (assert) {
		var oRouteMatchedSpy = sinon.spy(this.oRouter.getRoute("detailRoute"), "_routeMatched");
		this.oRouter.parse(this.sPattern);

		assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched method is called once");
		return oRouteMatchedSpy.returnValues[0].then(function() {
			assert.strictEqual(this.oSplitContainer.getCurrentDetailPage().getId(), this.oDetailView.getId(), "Did navigate to detail");
			assert.strictEqual(this.oSplitContainer.getCurrentMasterPage().getId(), this.oMasterView.getId(), "Did navigate to master");
			oRouteMatchedSpy.restore();
		}.bind(this));

	});


	integrationTests.start({
		beforeEach: function (oConfig) {
			var oRouter = fnCreateRouter(oConfig);
			this.oGetViewStub = sinon.stub(oRouter._oViews, "_getViewWithGlobalId").callsFake(helpers.createViewMock);

			this.oRouter = oRouter;
			return oRouter;
		},
		act: function (sPatternOrName, assert) {
			var oRouteMatchedSpy = sinon.spy(this.oRouter.getRoute(sPatternOrName), "_routeMatched");
			this.oRouter.parse(sPatternOrName);
			if (assert) {
				assert.strictEqual(oRouteMatchedSpy.callCount, 1, "_routeMatched method is called once");
			}
			var oPromise = oRouteMatchedSpy.returnValues[0];
			oRouteMatchedSpy.restore();
			return oPromise;
		},
		afterEach: function () {
			this.oGetViewStub.restore();
			this.oRouter.destroy();
		}
	});

	QUnit.module("Order of navigation methods and events");

	QUnit.test("TargetHandler's addNavigation, navigate and routeMatched event should be called in the correct order", function(assert) {
		var oApp = new NavContainer("container");
		var oRouter = fnCreateRouter(
			{
				"route": {
					pattern: "anyPattern",
					target: ["first", "second"]
				}
			},
			{
				viewType: "JS",
				controlAggregation:"pages",
				controlId: "container"
			},
			null,
			{
				first: {
					viewName: "first"
				},
				second: {
					viewName: "second",
					viewLevel: 0
				}
			});

		var aCalledOrder = [];
		var oTargetHandler = oRouter.getTargetHandler();

		sinon.stub(oTargetHandler, "addNavigation").callsFake(function() {
			aCalledOrder.push("addNavigation");
		});

		sinon.stub(oTargetHandler, "navigate").callsFake(function() {
			aCalledOrder.push("navigate");
		});

		oRouter.attachRouteMatched(function() {
			aCalledOrder.push("routeMatched");
		});

		var oRoute = oRouter.getRoute("route");
		var oRouteMatchedSpy = sinon.spy(oRoute, "_routeMatched");

		oRouter.parse("anyPattern");

		assert.equal(oRouteMatchedSpy.callCount, 1, "Route is matched");
		var oPromise = oRouteMatchedSpy.getCall(0).returnValue;
		return oPromise.then(function() {
			assert.deepEqual(aCalledOrder, ["addNavigation", "addNavigation", "navigate", "routeMatched"]);
			oApp.destroy();
		});
	});
});
