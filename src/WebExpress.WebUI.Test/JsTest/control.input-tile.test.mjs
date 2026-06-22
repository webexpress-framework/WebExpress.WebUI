/**
 * Headless contract test for the InputTileCtrl control (wx-webui-input-tile).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.tile.js",
    selector: "wx-webui-input-tile",
    ctrl: "InputTileCtrl"
});
