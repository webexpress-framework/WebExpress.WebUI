/**
 * Headless contract test for the DashboardCtrl control (wx-webui-dashboard).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.dashboard.js",
    selector: "wx-webui-dashboard",
    ctrl: "DashboardCtrl"
});
