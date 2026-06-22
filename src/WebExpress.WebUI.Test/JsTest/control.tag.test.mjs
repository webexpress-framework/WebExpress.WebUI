/**
 * Headless contract test for the TagCtrl control (wx-webui-tag).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.tag.js",
    selector: "wx-webui-tag",
    ctrl: "TagCtrl"
});
