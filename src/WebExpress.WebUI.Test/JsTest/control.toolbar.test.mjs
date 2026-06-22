/**
 * Headless contract test for the ToolbarCtrl control (wx-webui-toolbar).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.toolbar.js",
    selector: "wx-webui-toolbar",
    ctrl: "ToolbarCtrl",
    deps: ["webexpress.webui.overflow.js"]
});
