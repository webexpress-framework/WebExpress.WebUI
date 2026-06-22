/**
 * Headless contract test for the EditorCtrl control (wx-webui-editor).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.editor.js",
    selector: "wx-webui-editor",
    ctrl: "EditorCtrl"
});
