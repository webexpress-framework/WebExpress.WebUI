/**
 * Headless contract test for the TreeCtrl control (wx-webui-tree).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.tree.js",
    selector: "wx-webui-tree",
    ctrl: "TreeCtrl"
});
