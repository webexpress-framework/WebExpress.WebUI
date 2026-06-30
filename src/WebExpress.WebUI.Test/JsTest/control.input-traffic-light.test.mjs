/**
 * Headless contract test for the InputTrafficLightCtrl control (wx-webui-input-traffic-light).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.traffic.light.js",
    selector: "wx-webui-input-traffic-light",
    ctrl: "InputTrafficLightCtrl"
});
