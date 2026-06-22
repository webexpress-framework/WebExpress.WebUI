/**
 * Headless contract test for the PanelDismissibleCtrl control (wx-webui-panel-dismissible).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.panel.dismissible.js",
    selector: "wx-webui-panel-dismissible",
    ctrl: "PanelDismissibleCtrl"
});
