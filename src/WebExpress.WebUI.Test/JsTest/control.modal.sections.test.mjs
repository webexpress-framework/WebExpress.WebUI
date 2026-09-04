/**
 * Guards what a dialog is made of, which the base decides.
 *
 * Every dialog has a title bar and a footer bar, so every dialog has to be able to take the
 * sections an author wrote for them - not only the one that assembles itself from a page it
 * fetched. The rule therefore lives in ModalCtrl, and the remote form reuses it rather than
 * repeating it. A section is recognised by the class a control emits or by the element an
 * author writes, and a section belonging to a dialog nested inside is left alone.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

const FILES = ["webexpress.webui.modal.js"];

/**
 * Builds a dialog host carrying the given sections and mounts the controller on it.
 * @param {object} rt - The loaded runtime.
 * @param {Array<{tag: string, cls?: string, text?: string}>} sections - What the dialog declares.
 * @returns {object} The host, the controller and the bars it assembled.
 */
function mount(rt, sections) {
    const host = rt.createElement("div");
    host.classList.add("wx-webui-modal");

    for (const section of sections) {
        const el = rt.createElement(section.tag);
        if (section.cls) { el.classList.add(section.cls); }
        if (section.text) { el.textContent = section.text; }
        host.appendChild(el);
    }

    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);

    const ctrl = rt.wx.Controller.instanceMap.get(host);

    return { host, ctrl, title: ctrl._titleH1, body: ctrl._bodyDiv, footer: ctrl._footerDiv };
}

test("a dialog takes the sections a control marked with a class", () => {
    const rt = loadWebUi({ browser: true, extraFiles: FILES });
    const { title, body, footer } = mount(rt, [
        { tag: "div", cls: "wx-modal-header", text: "Name" },
        { tag: "div", cls: "wx-modal-content", text: "Body" },
        { tag: "div", cls: "wx-modal-footer", text: "State" }
    ]);

    assert.match(title.textContent, /Name/);
    assert.match(body.textContent, /Body/);
    assert.match(footer.textContent, /State/, "the footer bar carries what the dialog declared for it");
});

test("a dialog takes the sections an author wrote as elements", () => {
    const rt = loadWebUi({ browser: true, extraFiles: FILES });
    const { title, footer } = mount(rt, [
        { tag: "header", text: "Name" },
        { tag: "footer", text: "State" }
    ]);

    assert.match(title.textContent, /Name/, "a header titles the dialog");
    assert.match(footer.textContent, /State/, "and a footer reaches the bar the buttons sit on");
});

test("a footer belonging to the content is not the dialog's", () => {
    const rt = loadWebUi({ browser: true, extraFiles: FILES });
    const host = rt.createElement("div");
    host.classList.add("wx-webui-modal");

    const content = rt.createElement("div");
    content.classList.add("wx-modal-content");

    // an article inside the body may well end in a footer of its own
    const inner = rt.createElement("footer");
    inner.textContent = "article footer";
    content.appendChild(inner);
    host.appendChild(content);

    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);

    const ctrl = rt.wx.Controller.instanceMap.get(host);

    assert.doesNotMatch(ctrl._footerDiv.textContent, /article footer/, "it stays where it was written");
    assert.match(ctrl._bodyDiv.textContent, /article footer/);
});

test("a dialog nested in the content keeps its own bars", () => {
    const rt = loadWebUi({ browser: true, extraFiles: FILES });
    const host = rt.createElement("div");
    host.classList.add("wx-webui-modal");

    const content = rt.createElement("div");
    content.classList.add("wx-modal-content");

    // a form carrying a whole dialog of its own - the document editor is one - must not be
    // dismantled to build the dialog around it
    const nested = rt.createElement("div");
    nested.classList.add("wx-webui-modal");

    const nestedTitle = rt.createElement("div");
    nestedTitle.classList.add("wx-modal-header");
    nestedTitle.textContent = "inner name";
    nested.appendChild(nestedTitle);

    content.appendChild(nested);
    host.appendChild(content);

    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);

    const ctrl = rt.wx.Controller.instanceMap.get(host);

    assert.doesNotMatch(ctrl._titleH1.textContent, /inner name/, "the inner title is not hoisted");
});

test("the lift reports whether the subtree declared a title, so a caller can fall back", () => {
    const rt = loadWebUi({ browser: true, extraFiles: FILES });
    const { ctrl } = mount(rt, [{ tag: "div", cls: "wx-modal-content", text: "Body" }]);

    const root = rt.createElement("div");
    const header = rt.createElement("header");

    header.textContent = "Served";
    root.appendChild(header);
    rt.document.body.appendChild(root);

    assert.equal(ctrl.liftTitle(root), 1, "a served subtree can be lifted the same way");
    assert.match(ctrl._titleH1.textContent, /Served/);
    assert.equal(ctrl.liftTitle(root), 0, "and reports nothing left to lift");
});
