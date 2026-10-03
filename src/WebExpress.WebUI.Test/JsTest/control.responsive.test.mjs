/**
 * Headless contract test for the ResponsiveCtrl control (wx-webui-responsive).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.responsive.js",
    selector: "wx-webui-responsive",
    ctrl: "ResponsiveCtrl"
});
