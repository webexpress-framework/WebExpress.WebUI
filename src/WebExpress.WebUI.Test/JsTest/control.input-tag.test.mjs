/**
 * Headless contract test for the InputTagCtrl control (wx-webui-input-tag).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.tag.js",
    selector: "wx-webui-input-tag",
    ctrl: "InputTagCtrl"
});
