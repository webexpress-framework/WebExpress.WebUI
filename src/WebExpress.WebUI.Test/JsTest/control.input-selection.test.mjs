/**
 * Headless contract test for the InputSelectionCtrl control (wx-webui-input-selection).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.selection.js",
    selector: "wx-webui-input-selection",
    ctrl: "InputSelectionCtrl"
});
