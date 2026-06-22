/**
 * Headless contract test for the DateCtrl control (wx-webui-date).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.date.js",
    selector: "wx-webui-date",
    ctrl: "DateCtrl"
});
