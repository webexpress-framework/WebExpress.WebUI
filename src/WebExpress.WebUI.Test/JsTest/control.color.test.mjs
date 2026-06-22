/**
 * Headless contract test for the ColorCtrl control (wx-webui-color).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.color.js",
    selector: "wx-webui-color",
    ctrl: "ColorCtrl"
});
