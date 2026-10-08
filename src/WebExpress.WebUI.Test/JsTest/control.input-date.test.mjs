/**
 * Headless contract test for the InputDateCtrl control (wx-webui-input-date).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.date.js",
    selector: "wx-webui-input-date",
    ctrl: "InputDateCtrl"
});
