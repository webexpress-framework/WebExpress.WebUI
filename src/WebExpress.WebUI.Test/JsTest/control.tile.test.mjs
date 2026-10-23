/**
 * Headless contract test for the TileCtrl control (wx-webui-tile).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.tile.js",
    selector: "wx-webui-tile",
    ctrl: "TileCtrl"
});
