/**
 * Headless contract test for the OverflowCtrl control (wx-webui-overflow).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.overflow.js",
    selector: "wx-webui-overflow",
    ctrl: "OverflowCtrl"
});
