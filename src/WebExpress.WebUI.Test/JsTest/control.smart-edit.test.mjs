/**
 * Headless contract test for the SmartEditCtrl control (wx-webui-smart-edit).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.smartedit.js",
    selector: "wx-webui-smart-edit",
    ctrl: "SmartEditCtrl"
});
