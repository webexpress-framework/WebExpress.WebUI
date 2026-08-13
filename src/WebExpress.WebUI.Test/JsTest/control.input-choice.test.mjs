/**
 * Headless contract test for the InputChoiceCtrl control (wx-webui-input-choice).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.choice.js",
    selector: "wx-webui-input-choice",
    ctrl: "InputChoiceCtrl"
});
