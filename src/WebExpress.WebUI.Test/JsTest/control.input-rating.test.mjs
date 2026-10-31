/**
 * Headless contract test for the InputRatingCtrl control (wx-webui-input-rating).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.rating.js",
    selector: "wx-webui-input-rating",
    ctrl: "InputRatingCtrl"
});
