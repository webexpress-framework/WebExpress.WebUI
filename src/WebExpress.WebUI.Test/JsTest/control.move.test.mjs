/**
 * Headless contract test for the MoveCtrl control (wx-webui-move).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.move.js",
    selector: "wx-webui-move",
    ctrl: "MoveCtrl"
});
