import testfwk from "./testfwk";
import oCore from "sap/ui/core/Core";
import Form from "sap/ui/layout/form/Form";
import FormContainer from "sap/ui/layout/form/FormContainer";
import FormElement from "sap/ui/layout/form/FormElement";
import GridLayout from "sap/ui/layout/form/GridLayout";
import ListItem from "sap/ui/core/ListItem";
import ComboBox from "sap/m/ComboBox";
import CheckBox from "sap/m/CheckBox";
function updateItems(oCombo, mValues, sDefault) {
    oCombo.destroyItems();
    oCombo.setValue(sDefault);
    for (var sKey in mValues) {
        oCombo.addItem(new ListItem({ text: mValues[sKey], key: sKey }));
        if (sKey === sDefault) {
            oCombo.setValue(mValues[sKey]);
        }
    }
    return oCombo;
}
function createUI() {
    var oThemeCombo;
    var oContrastModeCB;
    new Form({
        editable: true,
        layout: new GridLayout({
            singleColumn: true
        }),
        formContainers: [
            new FormContainer({
                formElements: [
                    new FormElement({
                        fields: [
                            oThemeCombo = updateItems(new ComboBox({
                                width: "120px",
                                change: function themeChanged(e) {
                                    var oCombo = e.getSource();
                                    var sTheme = oCombo.getSelectedKey() || oCombo.getValue();
                                    testfwk.setTheme(sTheme);
                                    if (sTheme === "sap_belize" || sTheme === "sap_belize_plus") {
                                        oContrastModeCB.setEnabled(true);
                                    }
                                    else {
                                        oContrastModeCB.setEnabled(false);
                                        oContrastModeCB.setSelected(false);
                                    }
                                }
                            }), testfwk.THEMES, testfwk.getTheme())
                        ],
                        label: "Theme"
                    }),
                    new FormElement({
                        fields: [
                            oContrastModeCB = new CheckBox({
                                selected: testfwk.getContrastMode(),
                                select: function (e) {
                                    testfwk.setContrastMode(e.getParameter("selected"));
                                }
                            })
                        ],
                        label: "Contrast Mode"
                    }),
                    new FormElement({
                        fields: [
                            updateItems(new ComboBox({
                                width: "120px",
                                change: function languageChanged(e) {
                                    var oCombo = e.getSource();
                                    var sLanguage = oCombo.getSelectedKey() || oCombo.getValue();
                                    testfwk.setLanguage(sLanguage);
                                }
                            }), testfwk.LANGUAGES, testfwk.getLanguage())
                        ],
                        label: "Language"
                    }),
                    new FormElement({
                        fields: [
                            new CheckBox({
                                selected: testfwk.getRTL(),
                                select: function (e) {
                                    testfwk.setRTL(e.getParameter("selected"));
                                }
                            })
                        ],
                        label: "RTL"
                    }),
                    new FormElement({
                        fields: [
                            new CheckBox({
                                selected: testfwk.getAccessibilityMode(),
                                select: function (e) {
                                    testfwk.setAccessibilityMode(e.getParameter("selected"));
                                }
                            })
                        ],
                        label: "Accessibility Mode"
                    })
                ]
            })
        ]
    }).placeAt("uiArea1");
    testfwk.attachThemeConfigurationChanged(function () {
        updateItems(oThemeCombo, testfwk.getAllowedThemes(), testfwk.getTheme());
    });
}
oCore.attachInit(createUI);