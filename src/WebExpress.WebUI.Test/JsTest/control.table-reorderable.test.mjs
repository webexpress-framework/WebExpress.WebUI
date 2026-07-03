/**
 * Headless contract test for the TableReorderableCtrl control (wx-webui-table-reorderable).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.table.reorderable.js",
    selector: "wx-webui-table-reorderable",
    ctrl: "TableReorderableCtrl",
    deps: ["webexpress.webui.table.js"]
});
