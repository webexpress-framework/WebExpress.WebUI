/**
 * Headless contract test for the ModalFormCtrl control (wx-webui-modal-form).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.modal.form.js",
    selector: "wx-webui-modal-form",
    ctrl: "ModalFormCtrl",
    deps: ["webexpress.webui.modal.js", "webexpress.webui.modal.page.js"]
});
