/**
 * Headless contract test for the CodeCtrl control (wx-webui-code).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.code.js",
    selector: "wx-webui-code",
    ctrl: "CodeCtrl"
});
