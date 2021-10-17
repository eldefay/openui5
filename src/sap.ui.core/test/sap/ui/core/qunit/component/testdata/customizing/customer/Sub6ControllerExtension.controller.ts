sap.ui.controller("testdata.customizing.customer.Sub6ControllerExtension", {
    onInit: function () {
        oLifecycleSpy("Sub6ControllerExtension Controller onInit()");
    },
    onExit: function () {
        oLifecycleSpy("Sub6ControllerExtension Controller onExit()");
    },
    onBeforeRendering: function () {
        oLifecycleSpy("Sub6ControllerExtension Controller onBeforeRendering()");
    },
    onAfterRendering: function () {
        oLifecycleSpy("Sub6ControllerExtension Controller onAfterRendering()");
    },
    myCustomAction1: function () {
    },
    myCustomAction2: function () {
    }
});