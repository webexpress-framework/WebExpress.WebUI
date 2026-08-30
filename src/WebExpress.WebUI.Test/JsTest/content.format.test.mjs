/**
 * Headless unit tests for the reading view of editor content
 * (webexpress.webui.content.js): the conversion from the editor's working
 * surface - add-on frames with their headers and handles, framed tables with
 * column resizers, instruction texts, the guard paragraphs around
 * non-editables - into the document those things surround, plus the control
 * that hosts the result.
 *
 * They run against the rich DOM stub in dom-stub.editor.mjs, because the
 * conversion is markup surgery and the plain stub neither parses nor
 * serializes markup.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEditorDocument, serializeNode } from "./dom-stub.editor.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const contentJs = path.resolve(here, "..", "..", "WebExpress.WebUI", "Assets", "js", "webexpress.webui.content.js");

/**
 * Loads the content sources into a fresh vm context backed by the rich DOM
 * stub. Only the namespace surface the file touches is stubbed; the converter
 * and the control under test are the real, shipped implementations.
 * @returns {object} The namespace, document and helpers.
 */
function loadContent() {
    const { document, globals } = createEditorDocument();

    const instantiated = [];
    const sandbox = {
        console,
        // the browser answers one character per byte, not decoded text; a stub
        // that decodes utf-8 here would hide exactly the bug the control guards
        atob: (value) => Buffer.from(value, "base64").toString("latin1"),
        TextDecoder,
        Uint8Array,
        ...globals,
        webexpress: {
            webui: {
                Ctrl: class {
                    constructor(element) { this._element = element; }
                    destroy() { }
                },
                Controller: {
                    registerClass(selector, cls) { this.classRegistry.set(selector, cls); },
                    classRegistry: new Map(),
                    createInstances(element) { instantiated.push(element); }
                },
                I18N: { translate: (key) => key },
                IconSet: { resolve: (icon) => icon }
            }
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(contentJs, "utf8"), sandbox, { filename: contentJs });

    const wx = sandbox.webexpress.webui;

    return {
        wx,
        document,
        instantiated,
        /** Converts a raw editor value and returns the reading view as markup. */
        convert(html, options) {
            const host = document.createElement("div");
            host.appendChild(wx.ContentFormat.toFragment(html, options));
            return host.childNodes.map(serializeNode).join("");
        },
        /** Builds a connected host element for the control. */
        host(attributes, inner) {
            const element = document.createElement("div");
            Object.entries(attributes || {}).forEach(([name, value]) => element.setAttribute(name, value));
            if (inner != null) {
                element.innerHTML = inner;
            }
            document.body.appendChild(element);
            return element;
        }
    };
}

/** The frame the add-on plugin persists for a static block add-on. */
const ADDON = `<div class="wx-addon-frame card my-3 shadow-sm" contenteditable="false" draggable="false" data-addon-id="warning-box">`
    + `<div class="card-header py-1 px-2">`
    + `<span class="wx-addon-drag-handle"><i class="grip"></i></span><span>Warning Widget</span>`
    + `<span class="wx-addon-settings-btn"><i class="cog"></i></span>`
    + `</div>`
    + `<div class="card-body p-2 wx-addon-body-widget" contenteditable="false">`
    + `<div class="alert alert-warning mb-0">Static alert.</div>`
    + `</div>`
    + `</div>`;

test("a block add-on keeps what it renders and loses the frame that configured it", () => {
    const rt = loadContent();

    const html = rt.convert(`<p>before</p>${ADDON}<p>after</p>`);

    assert.ok(html.includes(`<div class="alert alert-warning mb-0">Static alert.</div>`), "the widget survives");
    assert.ok(!html.includes("card-header"), "the header naming the add-on is gone");
    assert.ok(!html.includes("wx-addon-drag-handle"), "the drag handle is gone");
    assert.ok(!html.includes("wx-addon-settings-btn"), "the settings button is gone");
    assert.ok(!html.includes("contenteditable"), "nothing stays editable");
    assert.ok(!html.includes("draggable"), "nothing stays draggable");
    assert.ok(html.includes(`data-addon-id="warning-box"`), "the add-on identity is carried over");
});

test("a framed table becomes a reading table without its column resizers", () => {
    const rt = loadContent();

    const value = `<div class="wx-addon-frame card" contenteditable="false" data-addon-id="table-1" data-type="table">`
        + `<div class="card-header"><span>Table</span></div>`
        + `<div class="card-body wx-addon-body-container" contenteditable="false">`
        + `<table class="table table-bordered wx-native-table" contenteditable="true">`
        + `<colgroup><col style="width: 120px"><col></colgroup>`
        + `<thead><tr><th style="position: relative">Head<span class="wx-col-resizer" contenteditable="false"></span></th><th>Second</th></tr></thead>`
        + `<tbody><tr><td>Cell</td><td>Other</td></tr></tbody>`
        + `</table></div></div>`;

    const html = rt.convert(value);

    assert.ok(html.includes("<table"), "the table survives");
    assert.ok(!html.includes("wx-col-resizer"), "the column resizers are gone");
    assert.ok(!html.includes("wx-native-table"), "the editing marker class is gone");
    assert.ok(html.includes("wx-content-table"), "the table is marked as a reading table");
    assert.ok(html.includes("width: 120px"), "the column width the author sized is kept");
    assert.ok(!html.includes("contenteditable"), "the cells are no longer editable");
    assert.ok(!html.includes("position"), "the anchor the resizer needed is gone, and it was inline");
});

test("an instruction text is dropped for the reader and kept on request", () => {
    const rt = loadContent();
    const value = `<p>Fill in <span class="wx-editor-instruction" contenteditable="false">ask legal first</span> here</p>`;

    const reading = rt.convert(value);
    assert.ok(!reading.includes("ask legal first"), "the note to the author does not reach the reader");
    assert.ok(reading.includes("Fill in"), "the surrounding text is untouched");

    const proofing = rt.convert(value, { instruction: true });
    assert.ok(proofing.includes("ask legal first"), "a proof-reading view can keep the note");
});

test("the guard paragraphs around a non-editable block are dropped, an authored blank line is not", () => {
    const rt = loadContent();

    const framed = rt.convert(`<p><br></p>${ADDON}<p><br></p>`);
    assert.ok(!framed.includes("<p>"), "nothing but the add-on is left");

    const authored = rt.convert("<p>one</p><p><br></p><p>two</p>");
    assert.equal(authored, "<p>one</p><p><br></p><p>two</p>", "a blank line between two paragraphs is content");
});

test("an inline add-on becomes plain markup in the running text", () => {
    const rt = loadContent();

    const html = rt.convert(`<p>a <span class="wx-addon-inline-frame" contenteditable="false" draggable="true"`
        + ` data-addon-id="badge-primary" data-prop-text="New" title="Badge (Blue)">`
        + `<span class="badge bg-primary">New</span></span> b</p>`);

    assert.ok(html.includes(`<span class="badge bg-primary">New</span>`), "the badge survives");
    assert.ok(html.includes("wx-content-inline"), "it is marked as inline content");
    assert.ok(!html.includes("Badge (Blue)"), "the tooltip naming the add-on type is gone");
    assert.ok(!html.includes("draggable"), "it can no longer be dragged");
    assert.ok(html.includes(`data-prop-text="New"`), "the persisted configuration is carried over");
});

test("markup that reached the value from outside loses its inline handlers", () => {
    const rt = loadContent();

    const html = rt.convert(`<p onclick="steal()">text</p><img src="x.png" onerror="steal()">`);

    assert.ok(!html.includes("onclick"), "the click handler is gone");
    assert.ok(!html.includes("onerror"), "the error handler is gone");
    assert.ok(html.includes("<img src=\"x.png\">"), "the image itself is kept");
});

test("a link that opens a new tab gets the opener protection", () => {
    const rt = loadContent();

    const html = rt.convert(`<p><a href="https://x.test" target="_blank">x</a></p>`);

    assert.ok(html.includes(`rel="noopener noreferrer"`), "an unprotected link is hardened");

    const explicit = rt.convert(`<p><a href="https://x.test" target="_blank" rel="author">x</a></p>`);
    assert.ok(explicit.includes(`rel="author"`), "an explicit relation is not overwritten");
});

test("emptiness is decided by what the reader sees, not by the characters", () => {
    const rt = loadContent();
    const empty = (html) => rt.wx.ContentFormat.isEmpty(rt.wx.ContentFormat.toFragment(html));

    assert.equal(empty(""), true, "no value at all");
    assert.equal(empty("<p><br></p><p><br></p>"), true, "guard paragraphs alone say nothing");
    assert.equal(empty(`<p><span class="wx-editor-instruction">note</span></p>`), true, "a note to the author is not content");
    assert.equal(empty(`<p><img src="x.png"></p>`), false, "an image is content without any text");
    assert.equal(empty("<p>x</p>"), false, "text is content");
});

test("the control decodes the transported value and shows the document", () => {
    const rt = loadContent();
    const value = `<p>hello</p>${ADDON}`;
    const element = rt.host({ "data-base64": "true" }, Buffer.from(value, "utf8").toString("base64"));

    const ctrl = new rt.wx.ContentCtrl(element);

    assert.equal(ctrl.value, value, "the raw value stays available for a round trip");
    assert.ok(element.innerHTML.includes("Static alert."), "the add-on content is rendered");
    assert.ok(!element.innerHTML.includes("card-header"), "the editing frame is not rendered");
    assert.equal(element.getAttribute("data-base64"), null, "the transport marker is consumed");
    assert.ok(element.classList.contains("wx-content"), "the host carries the reading class");
    assert.equal(ctrl.text, "helloStatic alert.", "the reading text is available for an excerpt");
});

test("the transported value survives characters outside ascii", () => {
    const rt = loadContent();
    const value = "<p>Grundsätze, Maßstäbe – „geprüft“</p>";
    const element = rt.host({ "data-base64": "true" }, Buffer.from(value, "utf8").toString("base64"));

    const ctrl = new rt.wx.ContentCtrl(element);

    assert.equal(ctrl.value, value, "the umlauts, the dash and the quotation marks arrive intact");
});

test("an add-on that persists as a control is handed back to the controller", () => {
    const rt = loadContent();
    const element = rt.host({}, `<p>x</p>`);

    new rt.wx.ContentCtrl(element);

    assert.deepEqual(rt.instantiated, [element], "the rendered content is scanned for controls");
});

test("an unset value renders the placeholder, or nothing when none was named", () => {
    const rt = loadContent();

    const named = rt.host({ "data-placeholder": "No description yet" }, "<p><br></p>");
    new rt.wx.ContentCtrl(named);
    assert.equal(named.textContent, "No description yet", "the placeholder names the missing content");
    assert.equal(named.getAttribute("data-placeholder"), null, "the configuration is consumed");

    const silent = rt.host({}, "<p><br></p>");
    new rt.wx.ContentCtrl(silent);
    assert.equal(silent.innerHTML, "", "without a placeholder the control takes no room");
});

test("setting the value rebuilds the view from the new content", () => {
    const rt = loadContent();
    const element = rt.host({ "data-placeholder": "nothing" }, "");
    const ctrl = new rt.wx.ContentCtrl(element);

    assert.equal(element.textContent, "nothing", "it starts out empty");

    ctrl.value = `<p>later</p>`;
    assert.equal(element.innerHTML, "<p>later</p>", "the new content replaces the placeholder");

    ctrl.value = null;
    assert.equal(element.textContent, "nothing", "clearing it falls back to the placeholder");
});
