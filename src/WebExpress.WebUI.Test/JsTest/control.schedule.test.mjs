/**
 * Headless contract test for the ScheduleCtrl control (wx-webui-schedule).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.schedule.js",
    selector: "wx-webui-schedule",
    ctrl: "ScheduleCtrl"
});
