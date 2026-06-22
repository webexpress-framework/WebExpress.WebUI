/**
 * Headless contract test for the FileListCtrl control (wx-webui-file-list).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.filelist.js",
    selector: "wx-webui-file-list",
    ctrl: "FileListCtrl"
});
