/**
 * Headless contract test for the ButtonSplitToggleCtrl control (wx-webui-button-split-toggle).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.button.split.toggle.js",
    selector: "wx-webui-button-split-toggle",
    ctrl: "ButtonSplitToggleCtrl",
    deps: ["webexpress.webui.button.js"]
});
