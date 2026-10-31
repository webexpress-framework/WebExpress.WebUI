/**
 * Headless contract test for the SelectionCtrl control (wx-webui-selection).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.selection.js",
    selector: "wx-webui-selection",
    ctrl: "SelectionCtrl"
});
