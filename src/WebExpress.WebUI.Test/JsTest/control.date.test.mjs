/**
 * Headless contract test for the DateCtrl control (wx-webui-date).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * On top of it the server handoff is pinned: the server formats the date with
 * the request culture, which the client parser cannot read back for every
 * format, so the culture-neutral data-value carries the actual date.
 */
import { test } from "node:test";
import assert from "node:assert";
import { contract } from "./controls.contract.mjs";
import { loadWebUi } from "./harness.mjs";

contract({
    file: "webexpress.webui.date.js",
    selector: "wx-webui-date",
    ctrl: "DateCtrl"
});

function createDate(rt, text, attributes) {
    const host = rt.createElement("div");
    for (const [name, value] of Object.entries(attributes)) {
        host.setAttribute(name, value);
    }
    host.textContent = text;
    rt.document.body.appendChild(host);
    return new rt.wx.DateCtrl(host);
}

test("a culture-formatted date from the server is kept, not replaced by an empty text", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.date.js"] });

    const ctrl = createDate(rt, "03. Oktober 2026", { "data-format": "dd. MMMM yyyy", "data-value": "2026-10-03" });

    assert.equal(ctrl._span.textContent, "03. Oktober 2026", "the server text stays visible");
    // the control runs in its own vm context, so its Date is not this realm's Date
    assert.equal(Object.prototype.toString.call(ctrl.value), "[object Date]", "the value is read from data-value");
    assert.equal(ctrl.value.getFullYear(), 2026);
    assert.equal(ctrl.value.getMonth(), 9);
    assert.equal(ctrl.value.getDate(), 3);
});

test("without data-value the text is still parsed with the format", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.date.js"] });

    const ctrl = createDate(rt, "03.10.2026", { "data-format": "dd.MM.yyyy" });

    assert.equal(ctrl._span.textContent, "03.10.2026");
    assert.equal(ctrl.value.getDate(), 3);
});
