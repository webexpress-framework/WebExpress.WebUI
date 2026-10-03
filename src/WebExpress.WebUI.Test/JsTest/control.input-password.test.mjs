/**
 * Headless contract test for the InputPasswordCtrl control (wx-webui-input-password).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.password.js",
    selector: "wx-webui-input-password",
    ctrl: "InputPasswordCtrl"
});
