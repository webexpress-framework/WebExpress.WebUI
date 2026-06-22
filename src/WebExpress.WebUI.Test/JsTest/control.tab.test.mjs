/**
 * Headless contract test for the TabCtrl control (wx-webui-tab).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.tab.js",
    selector: "wx-webui-tab",
    ctrl: "TabCtrl"
});
