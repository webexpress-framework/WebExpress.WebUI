/**
 * Headless contract test for the UploadCtrl control (wx-webui-upload).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.upload.js",
    selector: "wx-webui-upload",
    ctrl: "UploadCtrl"
});

test("dragging over the upload marks the whole frame as the drop area, not the inner zone", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.upload.js"] });
    const host = rt.createElement("div");
    rt.document.body.appendChild(host);
    new rt.wx.UploadCtrl(host);
    const zone = host.querySelector(".wx-upload-dropzone");
    const drag = (type) => host.dispatchEvent({ type, target: host, preventDefault() {}, dataTransfer: { files: [] } });

    drag("dragover");
    assert.ok(host.classList.contains("wx-drag-over"), "the frame up to its outer border is the area");
    assert.ok(!zone.classList.contains("wx-drag-over"), "no second area inside the frame");

    drag("dragleave");
    assert.ok(!host.classList.contains("wx-drag-over"));
});
