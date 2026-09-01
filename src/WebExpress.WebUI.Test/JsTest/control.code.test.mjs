/**
 * Headless contract test for the CodeCtrl control (wx-webui-code).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * The transport is covered on top of it: the server encodes the source as utf-8
 * bytes, and a decoder that reads those bytes as characters turns every umlaut
 * into mojibake - visibly, and in the copy button's clipboard text.
 */
import { test } from "node:test";
import assert from "node:assert";
import { contract } from "./controls.contract.mjs";
import { loadWebUi } from "./harness.mjs";

contract({
    file: "webexpress.webui.code.js",
    selector: "wx-webui-code",
    ctrl: "CodeCtrl"
});

test("the transported source survives characters outside ascii", () => {
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.code.js"],
        globals: {
            // the browser answers one character per byte, not decoded text; a stub
            // that decodes utf-8 here would hide exactly the bug this pins
            atob: (value) => Buffer.from(value, "base64").toString("latin1"),
            TextDecoder,
            Uint8Array
        }
    });

    const source = "// Grundsätze, Maßstäbe – „geprüft“";
    const host = rt.createElement("div");
    host.setAttribute("data-base64", "true");
    host.dataset.base64 = "true";
    host.innerHTML = Buffer.from(source, "utf8").toString("base64");
    rt.document.body.appendChild(host);

    const ctrl = new rt.wx.CodeCtrl(host);

    assert.equal(ctrl._code, source, "the umlauts, the dash and the quotation marks arrive intact");
});
