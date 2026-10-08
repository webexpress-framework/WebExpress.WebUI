/**
 * Headless contract test for the ModalLoginCtrl control (wx-webui-modal-login).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle. The
 * dialog frames the login control and derives from the modal, so both load
 * first.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.modal.login.js",
    selector: "wx-webui-modal-login",
    ctrl: "ModalLoginCtrl",
    deps: [
        "webexpress.webui.login.js",
        "webexpress.webui.modal.js"
    ]
});
