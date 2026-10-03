/**
 * Headless contract test for the TrafficLightCtrl control (wx-webui-traffic-light).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.traffic.light.js",
    selector: "wx-webui-traffic-light",
    ctrl: "TrafficLightCtrl"
});
