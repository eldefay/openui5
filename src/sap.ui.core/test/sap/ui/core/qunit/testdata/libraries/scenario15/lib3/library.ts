import Core from "sap/ui/core/Core";
import coreLib from "sap/ui/core/library";
sap.ui.getCore().initLibrary({
    name: "testlibs.scenario15.lib3",
    dependencies: [
        "testlibs.scenario15.lib4"
    ],
    noLibraryCSS: true
});