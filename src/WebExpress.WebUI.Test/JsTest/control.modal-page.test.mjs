/**
 * Headless contract test for the ModalPageCtrl control (wx-webui-modal-page).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.modal.page.js",
    selector: "wx-webui-modal-page",
    ctrl: "ModalPageCtrl",
    deps: ["webexpress.webui.modal.js"]
});
