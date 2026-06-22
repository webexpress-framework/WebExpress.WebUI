/**
 * Headless contract test for the PaginationCtrl control (wx-webui-pagination).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.pagination.js",
    selector: "wx-webui-pagination",
    ctrl: "PaginationCtrl"
});
