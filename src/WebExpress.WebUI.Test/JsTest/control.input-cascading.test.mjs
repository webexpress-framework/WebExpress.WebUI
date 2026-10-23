/**
 * Headless contract test for the InputCascadingCtrl control (wx-webui-input-cascading).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.cascading.js",
    selector: "wx-webui-input-cascading",
    ctrl: "InputCascadingCtrl"
});
