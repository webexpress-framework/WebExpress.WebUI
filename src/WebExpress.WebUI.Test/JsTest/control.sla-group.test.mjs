/**
 * Headless contract test for the SlaGroupCtrl control (wx-webui-sla-group) -
 * the panel rendering of the agreement control, which ships in the same asset.
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.sla.js",
    selector: "wx-webui-sla-group",
    ctrl: "SlaGroupCtrl"
});
