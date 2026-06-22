/**
 * Headless contract test for the FrameCtrl control (wx-webui-frame).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.frame.js",
    selector: "wx-webui-frame",
    ctrl: "FrameCtrl"
});
