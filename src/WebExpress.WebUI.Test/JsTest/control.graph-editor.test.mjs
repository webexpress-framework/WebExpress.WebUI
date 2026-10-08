/**
 * Headless contract test for the GraphEditorCtrl control (wx-webui-graph-editor).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.graph.editor.js",
    selector: "wx-webui-graph-editor",
    ctrl: "GraphEditorCtrl",
    deps: ["webexpress.webui.graph.viewer.js"]
});
