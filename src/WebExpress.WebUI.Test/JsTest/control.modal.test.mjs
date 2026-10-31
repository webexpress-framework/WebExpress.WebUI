/**
 * Headless contract test for the ModalCtrl control (wx-webui-modal).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.modal.js",
    selector: "wx-webui-modal",
    ctrl: "ModalCtrl"
});
