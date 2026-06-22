/**
 * Headless contract test for the KanbanCtrl control (wx-webui-kanban).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.kanban.js",
    selector: "wx-webui-kanban",
    ctrl: "KanbanCtrl"
});
