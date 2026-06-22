/**
 * Headless contract test for the SmartViewCtrl control (wx-webui-smart-view).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract, defaultHost } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.smartview.js",
    selector: "wx-webui-smart-view",
    ctrl: "SmartViewCtrl",
    // the read-only view reads its inner element via firstElementChild
    host: (rt, selector) => {
        const element = defaultHost(rt, selector);
        element.appendChild(rt.createElement("div"));
        return element;
    }
});
