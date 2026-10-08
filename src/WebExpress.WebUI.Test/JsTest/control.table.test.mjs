/**
 * Headless contract test for the TableCtrl control (wx-webui-table).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.table.js",
    selector: "wx-webui-table",
    ctrl: "TableCtrl"
});
