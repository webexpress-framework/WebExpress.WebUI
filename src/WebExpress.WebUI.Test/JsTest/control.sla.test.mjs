/**
 * Headless contract test for the SlaCtrl control (wx-webui-sla).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.sla.js",
    selector: "wx-webui-sla",
    ctrl: "SlaCtrl"
});
