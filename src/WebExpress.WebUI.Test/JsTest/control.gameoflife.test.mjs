/**
 * Headless contract test for the GameOfLifeCtrl control (wx-webui-gameoflife).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.gameoflife.js",
    selector: "wx-webui-gameoflife",
    ctrl: "GameOfLifeCtrl"
});
