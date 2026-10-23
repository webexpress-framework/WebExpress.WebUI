/**
 * Headless contract test for the ViewCtrl control (wx-webui-view).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.view.js",
    selector: "wx-webui-view",
    ctrl: "ViewCtrl",
    deps: ["webexpress.webui.dropdown.js", "webexpress.webui.view.switcher.js"]
});
