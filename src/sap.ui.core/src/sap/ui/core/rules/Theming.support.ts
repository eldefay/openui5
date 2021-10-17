import SupportLib from "sap/ui/support/library";
import CoreHelper from "./CoreHelper.support";
import jQuery from "sap/ui/thirdparty/jquery";
var Log = sap.ui.require("sap/base/Log");
if (!Log) {
    Log = jQuery.sap.log;
}
var Categories = SupportLib.Categories;
var Severity = SupportLib.Severity;
var Audiences = SupportLib.Audiences;
var oCssCheckCustomStyles = {
    id: "cssCheckCustomStyles",
    audiences: [Audiences.Application],
    categories: [Categories.Consistency],
    enabled: true,
    minversion: "1.38",
    title: "CSS modifications - List of custom styles",
    description: "Checks and report for custom CSS files/styles that overwrite standard UI5 control's CSS values ",
    resolution: "Avoid CSS manipulations with custom CSS values as this could lead to rendering issues ",
    resolutionurls: [{
            text: "CSS Styling Issues",
            href: "https://openui5.hana.ondemand.com/#/topic/9d87f925dfbb4e99b9e2963693aa00ef"
        }, {
            text: "General Guidelines",
            href: "https://openui5.hana.ondemand.com/#/topic/5e08ff90b7434990bcb459513d8c52c4"
        }],
    check: function (issueManager, oCoreFacade, oScope) {
        var cssFilesMessage = "Following stylesheet file(s) contain 'custom' CSS that could affects (overwrites) UI5 controls' own styles: \n", externalStyleSheets = CoreHelper.getExternalStyleSheets(), foundIssues = 0;
        externalStyleSheets.forEach(function (styleSheet) {
            var affectsUI5Controls = false;
            Array.from(styleSheet.rules).forEach(function (rule) {
                var selector = rule.selectorText, matchedNodes = document.querySelectorAll(selector);
                matchedNodes.forEach(function (node) {
                    var hasUI5Parent = CoreHelper.nodeHasUI5ParentControl(node, oScope);
                    if (hasUI5Parent) {
                        affectsUI5Controls = true;
                    }
                });
            });
            if (affectsUI5Controls) {
                cssFilesMessage += "- " + CoreHelper.getStyleSheetName(styleSheet) + "\n";
                foundIssues++;
            }
        });
        if (foundIssues > 0) {
            issueManager.addIssue({
                severity: Severity.Medium,
                details: cssFilesMessage,
                context: {
                    id: "WEBPAGE"
                }
            });
        }
    }
};
var oCssCheckCustomStylesThatAffectControls = {
    id: "cssCheckCustomStylesThatAffectControls",
    audiences: [Audiences.Application],
    categories: [Categories.Consistency],
    enabled: true,
    minversion: "1.38",
    title: "CSS modifications - List of affected controls",
    description: "Checks and report all overwritten standard control's CSS values ",
    resolution: "Avoid CSS manipulations with custom CSS values as this could lead to rendering issues ",
    resolutionurls: [{
            text: "CSS Styling Issues",
            href: "https://openui5.hana.ondemand.com/#/topic/9d87f925dfbb4e99b9e2963693aa00ef"
        }, {
            text: "General Guidelines",
            href: "https://openui5.hana.ondemand.com/#/topic/5e08ff90b7434990bcb459513d8c52c4"
        }],
    check: function (issueManager, oCoreFacade, oScope) {
        var controlCustomCssHashMap = {}, externalStyleSheets = CoreHelper.getExternalStyleSheets();
        externalStyleSheets.forEach(function (styleSheet) {
            Array.from(styleSheet.rules).forEach(function (rule) {
                var selector = rule.selectorText, matchedNodes = document.querySelectorAll(selector);
                matchedNodes.forEach(function (node) {
                    var hasUI5Parent = CoreHelper.nodeHasUI5ParentControl(node, oScope);
                    if (hasUI5Parent) {
                        var ui5Control = jQuery(node).control()[0];
                        if (!controlCustomCssHashMap.hasOwnProperty(ui5Control.getId())) {
                            controlCustomCssHashMap[ui5Control.getId()] = "";
                        }
                        var cssSource = CoreHelper.getStyleSource(styleSheet);
                        controlCustomCssHashMap[ui5Control.getId()] += "'" + selector + "'" + " from " + cssSource + ",\n";
                    }
                });
            });
        });
        Object.keys(controlCustomCssHashMap).forEach(function (id) {
            issueManager.addIssue({
                severity: Severity.Low,
                details: "The following selector(s) " + controlCustomCssHashMap[id] + " affects standard style setting for control",
                context: {
                    id: id
                }
            });
        });
    }
};
var oCheckForLegacyParametersGet = {
    id: "checkForLegacyParametersGet",
    audiences: [Audiences.Control],
    categories: [Categories.Performance],
    enabled: true,
    minversion: "1.87",
    title: "Legacy sap.ui.core.theming.Parameters#get API",
    description: "Checks usage of the legecy variant of the Parameters.get API",
    resolution: "Use asynchronous variant of the Parameters.get API",
    resolutionurls: [{
            text: "Parameters.get API Reference",
            href: "https://openui5.hana.ondemand.com/api/sap.ui.core.theming.Parameters#methods/sap.ui.core.theming.Parameters.get"
        }],
    check: function (issueManager, oCoreFacade, oScope) {
        var oLoggedObjects = oScope.getLoggedObjects("LegacyParametersGet");
        oLoggedObjects.forEach(function (oLoggedObject) {
            issueManager.addIssue({
                severity: Severity.Medium,
                details: oLoggedObject.message,
                context: {
                    id: "WEBPAGE"
                }
            });
        });
    }
};