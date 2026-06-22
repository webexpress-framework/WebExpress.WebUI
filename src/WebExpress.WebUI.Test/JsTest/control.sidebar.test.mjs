/**
 * Headless contract test for the SidebarCtrl control (wx-webui-sidebar).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.sidebar.js",
    selector: "wx-webui-sidebar",
    ctrl: "SidebarCtrl"
});
