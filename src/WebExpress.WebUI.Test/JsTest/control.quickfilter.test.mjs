/**
 * Headless contract test for the QuickFilterCtrl control (wx-webui-quickfilter).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.quickfilter.js",
    selector: "wx-webui-quickfilter",
    ctrl: "QuickFilterCtrl"
});
