import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

const regions = editor => editor._state.doc.children.flatMap(row => row.children);
test("the outer editor and row gutters are not editing hosts", () => {
    const r = loadEditor();
    assert.equal(r.root.getAttribute("contenteditable"), "false");
    assert.equal(r.root.querySelector(".wx-editor-row").getAttribute("contenteditable"), "false");
    assert.equal(r.root.querySelector(".wx-editor-region").getAttribute("contenteditable"), "true");
    const before = r.editor.value;
    r.input("insertText", "outside", { target: r.root });
    r.input("insertText", "outside", { target: r.root.querySelector(".wx-editor-row") });
    assert.equal(r.editor.value, before);
});

test("layout commands build the requested 1 / 3 / 1 arrangement", () => {
    const r = loadEditor();
    r.editor.dispatch({ type: "layout", command: "addRow" });
    r.editor.dispatch({ type: "layout", command: "addColumn" });
    r.editor.dispatch({ type: "layout", command: "addColumn" });
    r.editor.dispatch({ type: "layout", command: "addRow" });
    assert.deepEqual(Array.from(r.editor._state.doc.children, row => row.children.length), [1, 3, 1]);
    assert.equal(r.root.querySelectorAll(".wx-editor-region").length, 5);
    assert.equal(r.editor._view.entry(r.selection.getRangeAt(0).startContainer).start, r.editor.selection.focus);
});

test("new regions start empty and typing belongs only to the selected region", () => {
    const r = loadEditor();
    r.editor.dispatch({ type: "layout", command: "addColumn" });
    const active = r.root.querySelectorAll(".wx-editor-region")[1];
    r.input("insertText", "second region", { target: active });
    assert.equal(regions(r.editor)[0].children[0].children[0].text, "alpha");
    assert.equal(regions(r.editor)[1].children[0].children[0].text, "second region");
});

test("Backspace and Delete at a region boundary cannot join neighboring regions", () => {
    const r = loadEditor(); r.editor.dispatch({ type: "layout", command: "addColumn" });
    const before = r.editor.value;
    r.editor.dispatch({ type: "delete", direction: -1 }); assert.equal(r.editor.value, before);
    r.select(5); r.editor.dispatch({ type: "delete", direction: 1 }); assert.equal(r.editor.value, before);
});

test("a selection across region boundaries cannot modify either region", () => {
    const r = loadEditor(); r.editor.dispatch({ type: "layout", command: "addColumn" });
    r.editor.dispatch({ type: "insertText", text: "beta" });
    const before = r.editor.value;
    for (const action of [{ type: "format", mark: "bold" }, { type: "delete" }, { type: "insertText", text: "x" }]) {
        r.editor.dispatch({ ...action, selection: { anchor: 2, focus: 8 } });
        assert.equal(r.editor.value, before);
    }
});

test("removing a populated region is independent from typing and fully undoable", () => {
    const r = loadEditor(); r.editor.dispatch({ type: "layout", command: "addColumn" });
    r.editor.dispatch({ type: "insertText", text: "beta" });
    const populated = r.editor.value;
    r.editor.dispatch({ type: "layout", command: "removeRegion" }); assert.equal(regions(r.editor).length, 1);
    r.editor.execCommand("undo"); assert.equal(r.editor.value, populated);
    r.editor.execCommand("undo"); assert.equal(regions(r.editor)[1].children[0].children.length, 0);
});

test("removing the last column removes its row and moves focus to a surviving region", () => {
    const r = loadEditor(); r.editor.dispatch({ type: "layout", command: "addRow" });
    r.editor.dispatch({ type: "layout", command: "removeRegion" });
    assert.equal(r.editor._state.doc.children.length, 1); assert.equal(r.editor.selection.focus, 0);
});

test("the final region cannot be removed and no history entry is recorded", () => {
    const r = loadEditor(); const before = r.editor.value;
    r.editor.dispatch({ type: "layout", command: "removeRegion" });
    assert.equal(r.editor.value, before); assert.equal(r.editor._history.canUndo(), false);
});

test("JSON reload preserves row grouping, relative widths and all region content", () => {
    const r = loadEditor(); r.editor.dispatch({ type: "layout", command: "addColumn" });
    r.editor.dispatch({ type: "layout", command: "resizeRegion", weight: 3 });
    const saved = r.editor.value;
    r.editor.value = "<p>other</p>"; r.editor.value = saved;
    assert.equal(regions(r.editor).length, 2); assert.equal(regions(r.editor)[1].attrs.weight, 3);
    assert.equal(r.root.querySelectorAll(".wx-editor-region")[1].style.flexGrow, "3");
    assert.equal(r.editor._history.canUndo(), false);
});

test("HTML import of an exported layout preserves rows and columns", () => {
    const r = loadEditor(); r.editor.dispatch({ type: "layout", command: "addColumn" });
    r.editor.dispatch({ type: "layout", command: "addRow" });
    const html = r.editor.exportHtml(); r.editor.value = html;
    assert.deepEqual(Array.from(r.editor._state.doc.children, row => row.children.length), [2, 1]);
});

test("disabled editors block layout actions as well as content edits", () => {
    const r = loadEditor({ disabled: true }); const before = r.editor.value;
    r.editor.dispatch({ type: "layout", command: "addColumn" });
    r.editor.dispatch({ type: "layout", command: "addRow" });
    assert.equal(r.editor.value, before);
    assert.equal(r.root.querySelector(".wx-editor-region").getAttribute("contenteditable"), "false");
});

test("layout action limits prevent accidental unbounded columns", () => {
    const r = loadEditor();
    for (let i = 0; i < 10; i++) r.editor.dispatch({ type: "layout", command: "addColumn" });
    assert.equal(regions(r.editor).length, 6);
});
