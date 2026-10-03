/**
 * Headless contract test for the UploadCtrl control (wx-webui-upload).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.upload.js",
    selector: "wx-webui-upload",
    ctrl: "UploadCtrl"
});
