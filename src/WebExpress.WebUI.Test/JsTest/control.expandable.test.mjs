/**
 * Headless contract test for the ExpandableCtrl control (wx-webui-expandable).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.expandable.js",
    selector: "wx-webui-expandable",
    ctrl: "ExpandableCtrl"
});
