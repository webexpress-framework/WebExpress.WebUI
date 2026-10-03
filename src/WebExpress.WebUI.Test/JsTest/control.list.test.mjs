/**
 * Headless contract test for the ListCtrl control (wx-webui-list).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.list.js",
    selector: "wx-webui-list",
    ctrl: "ListCtrl"
});
