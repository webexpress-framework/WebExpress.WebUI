/**
 * Headless contract test for the SmartViewCtrl control (wx-webui-smart-view).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * The value extraction is covered on top of it, because the control reports a
 * value rather than rendering one: a wrong extraction leaves no visible trace
 * and reads as "the field is empty" instead of as a defect.
 */
import { test } from "node:test";
import assert from "node:assert";
import { contract, defaultHost } from "./controls.contract.mjs";
import { loadWebUi } from "./harness.mjs";

contract({
    file: "webexpress.webui.smartview.js",
    selector: "wx-webui-smart-view",
    ctrl: "SmartViewCtrl",
    // the read-only view reads its inner element via firstElementChild
    host: (rt, selector) => {
        const element = defaultHost(rt, selector);
        element.appendChild(rt.createElement("div"));
        return element;
    }
});

test("a view over an editor reports what the editor holds", () => {
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.editor.js", "webexpress.webui.smartview.js"]
    });

    const host = rt.createElement("div");
    host.classList.add("wx-webui-smart-view");
    const editor = rt.createElement("div");
    editor.classList.add("wx-webui-editor");
    editor.setAttribute("value", "<p>stored text</p>");
    host.appendChild(editor);
    rt.document.body.appendChild(host);

    rt.wx.Controller.createInstances(host);

    const view = rt.wx.Controller.getInstanceByElement(host);
    const content = rt.wx.Controller.getInstanceByElement(editor);

    assert.ok(view, "the view is constructed");
    assert.equal(view.value, content.value, "the view reads the editor's content");
    assert.match(view.value, /stored text/, "and that content is the stored value, not an empty string");
});

test("a page that ships only some of the known controls still gets a view", () => {
    // the date control is present, the editor is not - which is the shape that
    // used to take the whole view down: the value extraction tested the embedded
    // control against every class it knows, and instanceof against an undefined
    // class throws rather than answering false
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.date.js", "webexpress.webui.smartview.js"]
    });
    assert.equal(rt.wx.EditorCtrl, undefined, "the editor is genuinely absent from this page");

    const host = rt.createElement("div");
    host.classList.add("wx-webui-smart-view");
    const date = rt.createElement("div");
    date.classList.add("wx-webui-date");
    date.setAttribute("data-value", "2026-08-30");
    host.appendChild(date);
    rt.document.body.appendChild(host);

    rt.wx.Controller.createInstances(host);

    const view = rt.wx.Controller.getInstanceByElement(host);
    assert.ok(view, "the view is constructed even though a known control is missing");

    // the setter walks the same list of control names and must survive it too
    assert.doesNotThrow(() => { view.value = "2026-09-01"; }, "and forwarding a value does not throw");
});

test("a view over a plain input still reports the input value", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.smartview.js"] });

    const host = rt.createElement("div");
    host.classList.add("wx-webui-smart-view");
    const input = rt.createElement("input");
    input.value = "typed";
    host.appendChild(input);
    rt.document.body.appendChild(host);

    rt.wx.Controller.createInstances(host);

    assert.equal(rt.wx.Controller.getInstanceByElement(host).value, "typed");
});
