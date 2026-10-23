/**
 * Headless contract test for the InputColorCtrl control (wx-webui-input-color).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.color.js",
    selector: "wx-webui-input-color",
    ctrl: "InputColorCtrl"
});
