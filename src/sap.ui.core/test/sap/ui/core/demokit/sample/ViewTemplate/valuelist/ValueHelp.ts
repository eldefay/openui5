import Button from "sap/m/Button";
import Column from "sap/m/Column";
import ColumnListItem from "sap/m/ColumnListItem";
import Input from "sap/m/Input";
import library from "sap/m/library";
import MessageBox from "sap/m/MessageBox";
import Popover from "sap/m/Popover";
import Table from "sap/m/Table";
import Text from "sap/m/Text";
var PlacementType = library.PlacementType, ValueHelp = Input.extend("sap.ui.core.sample.ViewTemplate.valuelist.ValueHelp", {
    metadata: {
        properties: {
            qualifier: { type: "string", defaultValue: "" },
            showDetails: { type: "boolean", defaultValue: false }
        }
    },
    init: function () {
        Input.prototype.init.call(this);
        this.setEditable(false);
        this.attachValueHelpRequest(this._onValueHelp.bind(this));
    },
    onBeforeRendering: function () {
        var oBinding = this.getBinding("value"), oModel = oBinding.getModel(), oMetaModel = oModel.getMetaModel(), sAbsolutePath = oModel.resolve(oBinding.getPath(), oBinding.getContext()), that = this;
        oMetaModel.loaded().then(function () {
            var oContext = oMetaModel.getMetaContext(sAbsolutePath);
            if (oContext.getProperty("sap:value-list")) {
                oMetaModel.getODataValueLists(oContext).then(function (mValueList) {
                    var oValueList = mValueList[that.getQualifier()];
                    that._parameters = [];
                    oValueList.Parameters.forEach(function (oParameter) {
                        if (oParameter.LocalDataProperty) {
                            that._parameters.unshift(oParameter.ValueListProperty.String);
                        }
                        else {
                            that._parameters.push(oParameter.ValueListProperty.String);
                        }
                    });
                    that._collectionPath = oValueList.CollectionPath.String;
                    that._collectionLabel = oValueList.Label ? oValueList.Label.String : that._collectionPath;
                    that._valueListDetails = "ValueList" + (that.getQualifier() !== "" ? "#" + that.getQualifier() : "") + "\n" + JSON.stringify(oValueList, undefined, 2);
                    that.updateDetails();
                    that.setShowValueHelp(true);
                    that.setEditable(true);
                });
            }
            else {
                that.setTooltip("No value help");
            }
        }, function (oError) {
            MessageBox.alert(oError.message, {
                icon: MessageBox.Icon.ERROR,
                title: "Error"
            });
        });
        Input.prototype.onBeforeRendering.call(this);
    },
    renderer: "sap.m.InputRenderer",
    setShowDetails: function (bShowDetails) {
        this.setProperty("showDetails", bShowDetails);
        this.updateDetails();
    },
    updateDetails: function () {
        this.setTooltip(this.getShowDetails() ? this._valueListDetails : "");
    },
    _onValueHelp: function (oEvent) {
        var oButton = new Button({ text: "Close" }), oColumnListItem = new ColumnListItem(), oControl = oEvent.getSource(), oMetaModel = oControl.getModel().getMetaModel(), oEntityType = oMetaModel.getODataEntityType(oMetaModel.getODataEntitySet(oControl._collectionPath).entityType), oPopover = new Popover({ endButton: oButton, placement: PlacementType.Auto, modal: true }), oTable = new Table();
        function onClose() {
            oPopover.close();
        }
        oPopover.setTitle("Value Help: " + oControl._collectionLabel);
        oTable.setModel(oControl.getModel());
        oTable.bindItems({
            path: "/" + oControl._collectionPath,
            template: oColumnListItem
        });
        oControl._parameters.forEach(function (sParameterPath, i) {
            var oProperty = oMetaModel.getODataProperty(oEntityType, sParameterPath), iMaxLength = Math.max(Math.min(Number(oProperty.maxLength), 15), 6), bAsPopin = i > 3;
            oTable.addColumn(new Column({
                demandPopin: bAsPopin,
                header: new Text({ text: oProperty["sap:label"] }),
                minScreenWidth: bAsPopin ? "XLarge" : "",
                width: iMaxLength + "rem"
            }));
            oColumnListItem.addCell(new ValueHelp({
                showDetails: oControl.getShowDetails(),
                value: "{" + sParameterPath + "}"
            }));
        });
        oButton.attachPress(onClose);
        oPopover.addContent(oTable);
        oPopover.openBy(oControl);
    }
});