/**
 * Headless contract test for the CardCtrl control (wx-webui-card).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.card.js",
    selector: "wx-webui-card",
    ctrl: "CardCtrl"
});
