/**
 * Headless contract test for the ContentCtrl control (wx-webui-content).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * The conversion the control performs is covered by content.format.test.mjs,
 * which runs against the rich DOM stub because the plain stub does not parse
 * markup.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.content.js",
    selector: "wx-webui-content",
    ctrl: "ContentCtrl"
});
