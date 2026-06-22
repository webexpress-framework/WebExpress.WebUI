/**
 * Headless contract test for the SplitCtrl control (wx-webui-split).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.split.js",
    selector: "wx-webui-split",
    ctrl: "SplitCtrl"
});
