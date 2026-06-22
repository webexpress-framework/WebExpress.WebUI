/**
 * Headless contract test for the ButtonCtrl control (wx-webui-button).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.button.js",
    selector: "wx-webui-button",
    ctrl: "ButtonCtrl"
});
