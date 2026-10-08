/**
 * Headless contract test for the SearchContentCtrl control (wx-webui-search-content).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.search.content.js",
    selector: "wx-webui-search-content",
    ctrl: "SearchContentCtrl"
});
