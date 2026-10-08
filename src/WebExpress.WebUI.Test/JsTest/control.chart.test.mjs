/**
 * Headless contract test for the ChartCtrl control (wx-webui-chart).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.chart.js",
    selector: "wx-webui-chart",
    ctrl: "ChartCtrl"
});
