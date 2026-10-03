/**
 * Headless contract test for the HeatMapCtrl control (wx-webui-heatmap).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.heatmap.js",
    selector: "wx-webui-heatmap",
    ctrl: "HeatMapCtrl"
});
