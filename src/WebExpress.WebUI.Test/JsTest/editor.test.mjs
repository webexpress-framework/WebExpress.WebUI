/**
 * Headless unit tests for the editor engine classes in
 * webexpress.webui.editor.js: selection preservation around list and indent
 * restructuring (EditorSelection.markRange/restoreRange, EditorList), the
 * per-block transform of the inline formatting engine (EditorFormat) - in
 * particular the clear-format-on-list regression that used to leave empty
 * list items behind - and the format painter (EditorPainter).
 *
 * The engines run against the rich DOM stub in dom-stub.editor.mjs, which
 * models live ranges and the standard extractContents semantics.
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
import { createEditorDocument } from "./dom-stub.editor.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const editorJs = path.resolve(here, "..", "..", "WebExpress.WebUI", "Assets", "js", "webexpress.webui.editor.js");

/**
 * Loads the editor sources into a fresh vm context backed by the rich DOM
 * stub. Only the namespace surface the file touches at load time is stubbed;
 * the engine classes under test are the real, shipped implementations.
 * @returns {object} The webui namespace, document, selection and helpers.
 */
function loadEditor() {
    const { document, window, selection, globals } = createEditorDocument();

    const sandbox = {
        console,
        setTimeout,
        clearTimeout,
        ...globals,
        webexpress: {
            webui: {
                Ctrl: class { constructor(element) { this._element = element; } destroy() { } },
                Controller: { registerClass() { } },
                Event: { CHANGE_VALUE_EVENT: "wx-change-value" },
                I18N: { translate: (key) => key },
                IconTheme: { resolveFa: (cls) => cls }
            }
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(editorJs, "utf8"), sandbox, { filename: editorJs });

    const root = document.createElement("div");
    document.body.appendChild(root);

    return {
        wx: sandbox.webexpress.webui,
        document,
        selection,
        root,
        /** Creates an element with the given children (strings become text). */
        el(tag, ...children) {
            const node = document.createElement(tag);
            children.forEach((c) => {
                node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
            });
            return node;
        },
        /** Sets the live selection to the given boundary points. */
        select(startNode, startOffset, endNode, endOffset) {
            const range = document.createRange();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
            selection.removeAllRanges();
            selection.addRange(range);
            return range;
        },
        /** Minimal editor instance for the static engine entry points. */
        editorMock() {
            return {
                getEditorElement: () => root,
                _saveCurrentSelection() { },
                _syncValue() { },
                _updateUndoRedoStates() { },
                _pendingFormat: null,
                _uiContainer: null
            };
        }
    };
}

/**
 * Returns the first text node under node, in document order.
 * @param {object} node - The subtree root.
 * @returns {object} The text node.
 */
function firstText(node) {
    if (node.nodeType === 3) {
        return node;
    }
    for (const child of node.childNodes) {
        const found = firstText(child);
        if (found) {
            return found;
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// EditorSelection.markRange / restoreRange
// ---------------------------------------------------------------------------

test("markRange/restoreRange restores a text selection and removes all markers", () => {
    const { wx, document, selection, root, el } = loadEditor();
    const p = el("p", "hello");
    root.appendChild(p);
    const t = firstText(p);

    const range = document.createRange();
    range.setStart(t, 1);
    range.setEnd(t, 4);

    assert.equal(wx.EditorSelection.markRange(range), true);
    assert.equal(root.querySelectorAll("[data-wx-caret]").length, 2, "a start and an end marker exist");

    assert.equal(wx.EditorSelection.restoreRange(root), true);
    assert.equal(selection.rangeCount, 1);
    assert.equal(selection.getRangeAt(0).toString(), "ell", "the selection is restored");
    assert.equal(root.querySelectorAll("[data-wx-caret]").length, 0, "all markers are removed");
});

test("markRange/restoreRange restores a collapsed caret at its position", () => {
    const { wx, document, selection, root, el } = loadEditor();
    const p = el("p", "hello");
    root.appendChild(p);
    const t = firstText(p);

    const range = document.createRange();
    range.setStart(t, 2);
    range.collapse(true);

    wx.EditorSelection.markRange(range);
    wx.EditorSelection.restoreRange(root);

    const caret = selection.getRangeAt(0);
    assert.equal(caret.collapsed, true, "the caret stays collapsed");

    // the caret sits before "llo"
    const probe = document.createRange();
    probe.setStart(caret.startContainer, caret.startOffset);
    probe.setEnd(p, p.childNodes.length);
    assert.equal(probe.toString(), "llo");
});

test("markRange sinks root-level markers into the adjacent blocks", () => {
    const { wx, document, selection, root, el } = loadEditor();
    const ul = el("ul", el("li", "one"), el("li", "two"));
    root.appendChild(ul);

    // select-all style boundaries at the root, spanning the whole list
    const range = document.createRange();
    range.setStart(root, 0);
    range.setEnd(root, 1);

    wx.EditorSelection.markRange(range);

    const start = root.querySelector("[data-wx-caret='start']");
    const end = root.querySelector("[data-wx-caret='end']");
    assert.equal(start.parentElement.tagName, "LI", "the start marker sank into the first item");
    assert.equal(end.parentElement.tagName, "LI", "the end marker sank into the last item");
    assert.equal(ul.children.length, 2, "no marker separates the list items");

    wx.EditorSelection.restoreRange(root);
    assert.equal(selection.getRangeAt(0).toString(), "onetwo");
});

// ---------------------------------------------------------------------------
// EditorList: selection preservation around restructuring
// ---------------------------------------------------------------------------

test("toggling a list keeps the text selection", () => {
    const { wx, selection, root, el, select, editorMock } = loadEditor();
    const p1 = el("p", "one");
    const p2 = el("p", "two");
    root.appendChild(p1);
    root.appendChild(p2);

    select(firstText(p1), 1, firstText(p2), 2);
    wx.EditorList.exec(editorMock(), "insertunorderedlist");

    assert.equal(root.innerHTML, "<ul><li>one</li><li>two</li></ul>");
    assert.equal(selection.getRangeAt(0).toString(), "netw", "the selection survives the restructuring");
});

test("removing a list (same type toggle) keeps the text selection", () => {
    const { wx, selection, root, el, select, editorMock } = loadEditor();
    const li1 = el("li", "alpha");
    const li2 = el("li", "beta");
    root.appendChild(el("ul", li1, li2));

    select(firstText(li1), 0, firstText(li2), 4);
    wx.EditorList.exec(editorMock(), "insertunorderedlist");

    assert.equal(root.innerHTML, "<p>alpha</p><p>beta</p>");
    assert.equal(selection.getRangeAt(0).toString(), "alphabeta");
});

test("switching the list type keeps the text selection", () => {
    const { wx, selection, root, el, select, editorMock } = loadEditor();
    const li1 = el("li", "alpha");
    const li2 = el("li", "beta");
    root.appendChild(el("ul", li1, li2));

    select(firstText(li1), 0, firstText(li2), 4);
    wx.EditorList.exec(editorMock(), "insertorderedlist");

    assert.equal(root.innerHTML, "<ol><li>alpha</li><li>beta</li></ol>");
    assert.equal(selection.getRangeAt(0).toString(), "alphabeta");
});

test("indent and outdent keep the multi-item selection", () => {
    const { wx, selection, root, el, select, editorMock } = loadEditor();
    const li1 = el("li", "one");
    const li2 = el("li", "two");
    const li3 = el("li", "three");
    root.appendChild(el("ul", li1, li2, li3));
    const editor = editorMock();

    select(firstText(li2), 0, firstText(li3), 5);
    wx.EditorList.exec(editor, "indent");

    assert.equal(root.innerHTML, "<ul><li>one<ul><li>two</li><li>three</li></ul></li></ul>");
    assert.equal(selection.getRangeAt(0).toString(), "twothree", "the selection survives the indent");

    wx.EditorList.exec(editor, "outdent");

    assert.equal(root.innerHTML, "<ul><li>one</li><li>two</li><li>three</li></ul>");
    assert.equal(selection.getRangeAt(0).toString(), "twothree", "the selection survives the outdent");
});

// ---------------------------------------------------------------------------
// EditorFormat: per-block transform across list items
// ---------------------------------------------------------------------------

test("clear format on a selected list strips the formatting without creating empty items", () => {
    const { wx, selection, root, el, select, editorMock } = loadEditor();
    const li1 = el("li", el("b", "foo"));
    const li2 = el("li", el("i", "bar"));
    root.appendChild(el("ul", li1, li2));

    select(firstText(li1), 0, firstText(li2), 3);
    wx.EditorFormat.exec(editorMock(), "removeformat");

    assert.equal(root.innerHTML, "<ul><li>foo</li><li>bar</li></ul>", "the formatting is stripped in place");
    assert.equal(root.querySelectorAll("li").length, 2, "no empty list items appear");
    assert.equal(root.querySelectorAll("ul").length, 1, "the list is not duplicated or nested");
    assert.equal(selection.getRangeAt(0).toString(), "foobar", "the selection survives");
});

test("bold across list items wraps each item's text without touching the structure", () => {
    const { wx, selection, root, el, select, editorMock } = loadEditor();
    const li1 = el("li", "foo");
    const li2 = el("li", "bar");
    root.appendChild(el("ul", li1, li2));

    select(firstText(li1), 0, firstText(li2), 3);
    wx.EditorFormat.exec(editorMock(), "bold");

    assert.equal(root.innerHTML, "<ul><li><strong>foo</strong></li><li><strong>bar</strong></li></ul>");
    assert.equal(selection.getRangeAt(0).toString(), "foobar");
});

test("bold on a fully bold list selection removes the formatting", () => {
    const { wx, root, el, select, editorMock } = loadEditor();
    const li1 = el("li", el("strong", "foo"));
    const li2 = el("li", el("strong", "bar"));
    root.appendChild(el("ul", li1, li2));

    select(firstText(li1), 0, firstText(li2), 3);
    wx.EditorFormat.exec(editorMock(), "bold");

    assert.equal(root.innerHTML, "<ul><li>foo</li><li>bar</li></ul>");
});

test("a color across two paragraphs styles each block's text separately", () => {
    const { wx, root, el, select, editorMock } = loadEditor();
    const p1 = el("p", "one");
    const p2 = el("p", "two");
    root.appendChild(p1);
    root.appendChild(p2);

    select(firstText(p1), 0, firstText(p2), 3);
    wx.EditorFormat.exec(editorMock(), "forecolor", "#ff0000");

    assert.equal(root.innerHTML,
        '<p><span style="color: #ff0000;">one</span></p>' +
        '<p><span style="color: #ff0000;">two</span></p>');
});

// ---------------------------------------------------------------------------
// EditorPainter: capture and apply
// ---------------------------------------------------------------------------

test("the painter captures the inline wrapper chain at the selection", () => {
    const { wx, root, el, select, editorMock } = loadEditor();
    const span = el("span", "x");
    span.style.color = "red";
    const p = el("p", el("strong", span));
    root.appendChild(p);

    const t = firstText(p);
    select(t, 0, t, 1);

    const painter = new wx.EditorPainter(editorMock());
    assert.equal(painter.capture(), true);
    assert.equal(painter.isActive(), true);
    assert.deepEqual(painter._chain, [
        { tag: "strong", style: "" },
        { tag: "span", style: "color: red;" }
    ], "the chain is captured outermost first");
    assert.equal(root.classList.contains("wx-editor-painting"), true);

    painter.cancel();
    assert.equal(painter.isActive(), false);
    assert.equal(root.classList.contains("wx-editor-painting"), false);
});

test("the painter transfers the captured formatting to the next selection", () => {
    const { wx, root, el, select, editorMock } = loadEditor();
    const p1 = el("p", el("strong", "src"));
    const p2 = el("p", "plain");
    root.appendChild(p1);
    root.appendChild(p2);

    const painter = new wx.EditorPainter(editorMock());
    const src = firstText(p1);
    select(src, 0, src, 3);
    painter.capture();

    const target = firstText(p2);
    select(target, 0, target, 5);
    painter._applyToCurrentSelection();

    assert.equal(p2.innerHTML, "<strong>plain</strong>", "the formatting is transferred");
    assert.equal(painter.isActive(), false, "the painter disarms after one application");
});

test("a plain captured chain acts like clear format", () => {
    const { wx, root, el, select, editorMock } = loadEditor();
    const p = el("p", el("b", "hello"));
    root.appendChild(p);

    const t = firstText(p);
    select(t, 0, t, 5);
    wx.EditorFormat.applyChain(editorMock(), t.ownerDocument.getSelection().getRangeAt(0), []);

    assert.equal(p.innerHTML, "hello", "the existing formatting is stripped");
});
