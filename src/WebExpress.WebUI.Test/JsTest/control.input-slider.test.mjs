/**
 * Headless contract test for the InputSliderCtrl control (wx-webui-input-slider).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.slider.js",
    selector: "wx-webui-input-slider",
    ctrl: "InputSliderCtrl"
});
