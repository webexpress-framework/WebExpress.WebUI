/**
 * Headless contract test for the SearchCtrl control (wx-webui-search).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.search.js",
    selector: "wx-webui-search",
    ctrl: "SearchCtrl"
});
