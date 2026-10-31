/**
 * Headless contract test for the RatingCtrl control (wx-webui-rating).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.rating.js",
    selector: "wx-webui-rating",
    ctrl: "RatingCtrl"
});
