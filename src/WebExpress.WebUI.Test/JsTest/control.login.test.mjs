/**
 * Headless contract test for the LoginCtrl control (wx-webui-login).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.login.js",
    selector: "wx-webui-login",
    ctrl: "LoginCtrl"
});
