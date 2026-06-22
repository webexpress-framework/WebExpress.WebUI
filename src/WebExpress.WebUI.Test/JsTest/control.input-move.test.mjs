/**
 * Headless contract test for the InputMoveCtrl control (wx-webui-input-move).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.move.js",
    selector: "wx-webui-input-move",
    ctrl: "InputMoveCtrl"
});
