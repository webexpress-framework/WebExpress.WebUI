/**
 * Headless contract test for the InputCalendarCtrl control (wx-webui-input-calendar).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.calendar.js",
    selector: "wx-webui-input-calendar",
    ctrl: "InputCalendarCtrl"
});
