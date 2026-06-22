/**
 * Headless contract test for the ModalSidebarPanel control (wx-webui-modal-sidebar-panel).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.modal.sidebar.panel.js",
    selector: "wx-webui-modal-sidebar-panel",
    ctrl: "ModalSidebarPanel",
    deps: ["webexpress.webui.modal.js"]
});
