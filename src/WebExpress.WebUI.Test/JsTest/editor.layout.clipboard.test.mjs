import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

const regionNodes = r => r.editor._state.doc.children.flatMap(row => row.children);
const tableHtml = '<table><tbody><tr><td>cell</td><td>other</td></tr></tbody></table>';

/**
 * Drives delegated drag events with a deterministic rectangle and transfer payload.
 * @param {object} runtime - The editor test runtime.
 * @param {HTMLElement} handle - The user-visible drag source.
 * @param {HTMLElement} target - The destination element.
 * @param {number} x - The horizontal drop position.
 * @param {number} y - The vertical drop position.
 * @returns {object} The final drop event.
 */
function drag(runtime, handle, target, x = 50, y = 90) {
    const data = new Map();
    const dataTransfer = { types: [], setData(type, value) { data.set(type, value); this.types.push(type); }, getData(type) { return data.get(type) || ""; } };
    const event = (type, element) => ({ type, target: element, dataTransfer, clientX: x, clientY: y,
        preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}, stopImmediatePropagation() {} });
    for (let element = target; element && element !== runtime.root; element = element.parentElement) {
        element.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 });
    }
    runtime.root.dispatchEvent(event("dragstart", handle));
    runtime.root.dispatchEvent(event("dragenter", target));
    runtime.root.dispatchEvent(event("dragover", target));
    const drop = event("drop", target); runtime.root.dispatchEvent(drop);
    return drop;
}

test("region actions share one native dropdown and target the selected region", () => {
    const r = loadEditor();
    const group = r.host.querySelector(".wx-editor-regions-toolbar");
    assert.equal(group.querySelectorAll(".dropdown-toggle").length, 1);
    const menu = group.querySelector("[popover]");
    assert.ok(menu);
    assert.deepEqual(Array.from(menu.querySelectorAll("button"), button => button.dataset.layoutCommand), ["addRow", "addColumn", "removeRegion"]);
    menu.querySelector('[data-layout-command="addColumn"]').dispatchEvent({ type: "click" });
    assert.equal(regionNodes(r).length, 2);
    menu.querySelector('[data-layout-command="removeRegion"]').dispatchEvent({ type: "click" });
    assert.equal(regionNodes(r).length, 1);
});

test("region chrome appears only for multiple regions and follows undo and reload", () => {
    const r = loadEditor();
    assert.equal(r.root.classList.contains("wx-editor-multiple-regions"), false);
    assert.equal(r.root.querySelector(".wx-editor-region-handle"), null);
    r.editor.dispatch({ type: "layout", command: "addColumn" });
    const saved = r.editor.value;
    assert.equal(r.root.classList.contains("wx-editor-multiple-regions"), true);
    assert.deepEqual(Array.from(r.root.querySelectorAll(".wx-editor-region-handle"), h => h.textContent), ["⠿", "⠿"]);
    assert.doesNotMatch(r.editor.exportHtml(), /⠿|draggable|data-region-label/);
    r.editor.execCommand("undo");
    assert.equal(r.root.classList.contains("wx-editor-multiple-regions"), false);
    r.editor.value = saved;
    assert.equal(r.root.classList.contains("wx-editor-multiple-regions"), true);
});

test("dragging a region reorders columns and keeps its content, weight and undo history", () => {
    const r = loadEditor();
    r.editor.dispatch({ type: "layout", command: "addColumn" });
    r.editor.dispatch({ type: "insertText", text: "beta" });
    r.editor.dispatch({ type: "layout", command: "resizeRegion", weight: 3 });
    const before = r.editor.value, ids = regionNodes(r).map(n => n.id), count = r.editor._history._entries.length;
    const elements = r.root.querySelectorAll(".wx-editor-region");
    drag(r, elements[1].querySelector(".wx-editor-region-handle"), elements[0], 10, 50);
    assert.deepEqual(regionNodes(r).map(n => n.id), ids.reverse());
    assert.equal(regionNodes(r)[0].attrs.weight, 3);
    assert.equal(regionNodes(r)[0].children[0].children[0].text, "beta");
    assert.equal(r.editor._history._entries.length, count + 1);
    const after = r.editor.value;
    r.editor.execCommand("undo"); assert.equal(r.editor.value, before);
    r.editor.execCommand("redo"); assert.equal(r.editor.value, after);
});

test("regions move between rows or into their own row without empty row shells", () => {
    const r = loadEditor();
    r.editor.dispatch({ type: "layout", command: "addRow" });
    const ids = regionNodes(r).map(n => n.id);
    r.editor.dispatch({ type: "layout", command: "moveRegion", regionId: ids[0], targetId: ids[1], placement: "after" });
    assert.deepEqual(Array.from(r.editor._state.doc.children, row => row.children.length), [2]);
    r.editor.dispatch({ type: "layout", command: "moveRegion", regionId: ids[0], targetId: ids[1], placement: "above" });
    assert.deepEqual(Array.from(r.editor._state.doc.children, row => row.children.length), [1, 1]);
    assert.deepEqual(regionNodes(r).map(n => n.id), ids);
});

test("self drops, full destination rows and disabled drags preserve the document", () => {
    const r = loadEditor();
    for (let i = 0; i < 5; i++) r.editor.dispatch({ type: "layout", command: "addColumn" });
    r.editor.dispatch({ type: "layout", command: "addRow" });
    const nodes = regionNodes(r), before = r.editor.value;
    r.editor.dispatch({ type: "layout", command: "moveRegion", regionId: nodes[6].id, targetId: nodes[0].id, placement: "before" });
    assert.equal(r.editor.value, before);
    r.editor.dispatch({ type: "layout", command: "moveRegion", regionId: nodes[0].id, targetId: nodes[0].id, placement: "above" });
    assert.equal(r.editor.value, before);
    r.editor.disabled = true;
    const elements = r.root.querySelectorAll(".wx-editor-region");
    drag(r, elements[0].querySelector(".wx-editor-region-handle"), elements[1]);
    assert.equal(r.editor.value, before);
});

test("tables render movable frames while only table content enters exports and persistence", () => {
    const r = loadEditor({ html: tableHtml });
    const table = r.root.querySelector("table"), frame = table.closest(".wx-editor-table-frame");
    assert.ok(frame);
    assert.equal(frame.getAttribute("contenteditable"), "false");
    assert.equal(table.getAttribute("contenteditable"), "true");
    assert.equal(frame.querySelector(".wx-addon-drag-handle").textContent, "⠿");
    assert.equal(r.editor.ownsInput({ target: table.querySelector("td") }), true);
    assert.equal(r.editor.ownsInput({ target: frame.querySelector(".card-header") }), false);
    assert.doesNotMatch(r.editor.exportHtml(), /wx-addon-frame|⠿|draggable/);
    assert.doesNotMatch(r.editor.value, /wx-addon-frame|⠿/);
    const saved = r.editor.value; r.editor.value = '<p>temporary</p>'; r.editor.value = saved;
    assert.equal(r.root.querySelectorAll(".wx-editor-table-frame").length, 1);
});

test("table handle movement works without the add-on plugin and is one undoable action", () => {
    const r = loadEditor({ html: tableHtml + '<p>after</p>' });
    const before = r.editor.value, tableId = r.editor.nodeId(r.root.querySelector("table"));
    const target = r.root.querySelector(".wx-editor-region").lastChild;
    drag(r, r.root.querySelector(".wx-addon-drag-handle"), target);
    assert.equal(regionNodes(r)[0].children.at(-1).id, tableId);
    assert.equal(r.editor._history._entries.length, 1);
    assert.equal(r.root.querySelector("table").textContent, "cellother");
    r.editor.execCommand("undo"); assert.equal(r.editor.value, before);
    r.editor.execCommand("redo"); assert.equal(regionNodes(r)[0].children.at(-1).id, tableId);
});

test("table insertion supplies a frame toolbar and cell editing still uses the document model", () => {
    const r = loadEditor({ files: ["editor/table.js"] });
    r.editor._plugins[0]._insertTable(r.editor, 2, 2);
    const frame = r.root.querySelector(".wx-editor-table-frame");
    assert.ok(frame.querySelector(".wx-editor-table-toolbar"));
    const cell = frame.querySelector("td"), entry = r.wx.EditorModel.find(r.editor._state.doc, r.editor.nodeId(cell));
    r.select(entry.start); r.input("insertText", "typed", { target: cell });
    assert.equal(r.root.querySelector("td").textContent, "typed");
    r.editor.disabled = true;
    assert.equal(r.root.querySelector("table").getAttribute("contenteditable"), "false");
    assert.ok(Array.from(r.root.querySelector(".wx-editor-table-toolbar").querySelectorAll("button")).every(button => button.disabled));
});

test("dragenter accepts a table destination before the browser emits dragover", () => {
    const r = loadEditor({ html: tableHtml + '<p>target</p>' });
    const target = r.root.querySelector(".wx-editor-region").lastChild;
    target.getBoundingClientRect = () => ({ top: 0, height: 100 });
    r.root.dispatchEvent({ type: "dragstart", target: r.root.querySelector(".wx-addon-drag-handle"), dataTransfer: { setData() {} } });
    const event = { type: "dragenter", target, clientY: 90, dataTransfer: {}, preventDefault() { this.defaultPrevented = true; } };
    r.root.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(event.dataTransfer.dropEffect, "move");
    assert.equal(target.getAttribute("data-wx-drop"), "below");
    r.root.dispatchEvent({ type: "dragend" });
    assert.equal(target.hasAttribute("data-wx-drop"), false);
    assert.equal(r.editor._history.canUndo(), false);
});

test("moving a table to a different region preserves cells and both region identities", () => {
    const r = loadEditor({ html: tableHtml });
    r.editor.dispatch({ type: "layout", command: "addColumn" });
    const ids = regionNodes(r).map(n => n.id), before = r.editor.value;
    const target = r.root.querySelectorAll(".wx-editor-region")[1].querySelector("p");
    drag(r, r.root.querySelector(".wx-addon-drag-handle"), target);
    assert.deepEqual(regionNodes(r).map(n => n.id), ids);
    assert.equal(regionNodes(r)[0].children.some(n => n.type === "table"), false);
    assert.equal(regionNodes(r)[1].children.some(n => n.type === "table"), true);
    assert.equal(r.root.querySelector("table").textContent, "cellother");
    r.editor.execCommand("undo"); assert.equal(r.editor.value, before);
});

test("table deletion applies to its own frame while selection is outside the table", () => {
    const r = loadEditor({ html: tableHtml + '<p>outside</p>', files: ["editor/table.js"] });
    const frame = r.root.querySelector(".wx-editor-table-frame");
    const before = r.editor.value;
    const action = frame.querySelector('[data-frame-command="delete"]');
    frame.querySelector("[popover]").hidePopover = () => {};
    action.dispatchEvent({ type: "click", target: action });
    assert.equal(r.root.querySelector("table"), null);
    assert.equal(r.editor._history._entries.length, 1);
    r.editor.execCommand("undo"); assert.equal(r.editor.value, before);
});

test("inline add-ons remain movable to a text caret through the shared drag handlers", () => {
    const r = loadEditor({ addons: { token: { type: "inline", content: "Token" } },
        html: '<p>A<span class="wx-addon-inline-frame" data-addon-id="token"></span>B</p><p>target</p>' });
    const target = r.root.querySelector(".wx-editor-region").lastChild;
    r.document.caretRangeFromPoint = () => ({ startContainer: target.firstChild, startOffset: 3 });
    const before = r.editor.value;
    drag(r, r.root.querySelector(".wx-addon-inline-frame"), target);
    assert.equal(r.root.querySelector(".wx-editor-region").firstChild.textContent, "AB");
    const moved = r.root.querySelector(".wx-addon-inline-frame");
    assert.equal(moved.parentElement.firstChild.textContent, "tar");
    assert.equal(moved.querySelector(".card-body").textContent, "Token");
    assert.equal(moved.parentElement.lastChild.textContent, "get");
    r.editor.execCommand("undo"); assert.equal(r.editor.value, before);
});

test("add-on frame options follow the title and the common grip moves its model node", () => {
    const r = loadEditor({ addons: { box: { label: "Box", isContainer: true, properties: [{ name: "title" }] } },
        html: '<div class="wx-addon-frame" data-addon-id="box"><div class="wx-addon-body-container"><p>inside</p></div></div><p>after</p>' });
    const frame = r.root.querySelector(".wx-addon-frame"), header = frame.querySelector(".wx-addon-header");
    const options = header.querySelector(".wx-editor-frame-options");
    assert.ok(options.classList.contains("wx-editor-btn"));
    assert.equal(options.querySelector("i").className, "more");
    assert.equal(header.children[1].className, "wx-addon-title");
    assert.equal(header.children[2], options);
    assert.equal(header.firstChild.textContent, "⠿");
    const id = r.editor.nodeId(frame);
    drag(r, header.firstChild, r.root.querySelector(".wx-editor-region").lastChild);
    assert.equal(regionNodes(r)[0].children.at(-1).id, id);
});

test("block add-ons move into cell content and cell padding with persistent identity and undo", () => {
    for (const isContainer of [true, false]) {
        const r = loadEditor({ addons: { box: { label: "Box", isContainer, render: () => "Widget" } },
            html: '<div class="wx-addon-frame" data-addon-id="box"><div class="wx-addon-body-container"><p>inside</p></div></div>' + tableHtml });
        const before = r.editor.value;
        const frame = r.root.querySelector('[data-addon-id="box"]');
        const id = r.editor.nodeId(frame);
        drag(r, frame.querySelector(".wx-addon-drag-handle"), r.root.querySelector("td").querySelector("p"));
        assert.equal(r.editor.nodeId(r.root.querySelector("td").querySelector('[data-addon-id="box"]')), id);
        const moved = r.editor.value;
        r.editor.execCommand("undo");
        assert.equal(r.editor.value, before);
        r.editor.execCommand("redo");
        assert.equal(r.editor.value, moved);
        r.editor.value = moved;
        const cells = r.root.querySelectorAll("td");
        drag(r, r.root.querySelector('[data-addon-id="box"]').querySelector(".wx-addon-drag-handle"), cells[1]);
        assert.equal(r.editor.nodeId(r.root.querySelectorAll("td")[1].querySelector('[data-addon-id="box"]')), id);
    }
});

test("an add-on cannot be dragged into its own nested table", () => {
    const r = loadEditor({ addons: { box: { label: "Box", isContainer: true } },
        html: '<div class="wx-addon-frame" data-addon-id="box"><div class="wx-addon-body-container">' + tableHtml + '</div></div>' });
    const before = r.editor.value;
    drag(r, r.root.querySelector('[data-addon-id="box"]').querySelector(".wx-addon-drag-handle"), r.root.querySelector("td"));
    assert.equal(r.editor.value, before);
});

test("add-on frames expose deletion alone in the menu and properties in their toolbar", () => {
    const r = loadEditor({ files: ["editor/addons.js"], addons: { box: { label: "Box", isContainer: true, properties: [{ name: "title" }] } },
        html: '<div class="wx-addon-frame" data-addon-id="box"><div class="wx-addon-body-container"><p>inside</p></div></div>' });
    const button = r.root.querySelector(".wx-editor-frame-options");
    assert.equal(button.classList.contains("dropdown-toggle"), false);
    assert.equal(button.querySelector("i").className, "more");
    const menu = button.parentNode.querySelector("[popover]");
    menu.dispatchEvent({ type: "beforetoggle", target: menu, newState: "open" });
    assert.equal(menu.querySelectorAll("button").length, 1);
    assert.doesNotMatch(menu.textContent, /editor.addon.properties/);
    assert.ok(r.root.querySelector('.wx-editor-addon-toolbar').querySelector('[data-addon-command="properties"]'));
    const before = r.editor.value;
    menu.hidePopover = () => {};
    menu.querySelector("button").dispatchEvent({ type: "click" });
    assert.equal(r.root.querySelector('[data-addon-id="box"]'), null);
    r.editor.execCommand("undo");
    assert.equal(r.editor.value, before);
});

test("clipboard HTML removes backgrounds and foreign typography but maps supported semantics", () => {
    const r = loadEditor(); r.select(0, 5);
    const html = '<section style="background: yellow; background-color: red; font-family: Calibri; font-size: 18pt">' +
        '<h2 style="text-align: center">Title</h2><p><span style="font-weight: 700; font-style: italic; text-decoration: underline; color: #123456; letter-spacing: 2px">text</span>' +
        '<del>deleted</del><kbd>key</kbd><span style="vertical-align: super">2</span><font face="Comic Sans MS" size="7" color="#ff0000">legacy</font></p>' +
        '<table style="background-color: green"><tr><td bgcolor="blue" style="background-color: blue">cell</td></tr></table></section>';
    const before = r.editor.value;
    r.editor._onPaste({ target: r.root.querySelector(".wx-editor-region"), preventDefault() {}, clipboardData: { getData: type => type === "text/html" ? html : "" } });
    const output = r.editor.exportHtml({ layout: false });
    assert.doesNotMatch(output, /background|font-family|font-size|letter-spacing|bgcolor/);
    assert.match(output, /<h2[^>]*text-align: center/);
    assert.match(output, /<strong><em><u>text<\/u><\/em><\/strong>/);
    assert.match(output, /<s>deleted<\/s><code>key<\/code><sup>2<\/sup>/);
    assert.match(output, /color: #ff0000/);
    assert.equal(r.editor._history._entries.length, 1);
    const after = r.editor.value;
    r.editor.execCommand("undo"); assert.equal(r.editor.value, before);
    r.editor.execCommand("redo"); assert.equal(r.editor.value, after);
});

test("clipboard cleanup leaves saved highlights and explicit HTML imports intact", () => {
    const r = loadEditor({ html: '<p><span style="background-color: yellow; font-family: Arial; font-size: 12pt">saved</span></p>' });
    const saved = r.editor.value;
    assert.match(r.editor.exportHtml(), /background-color: yellow/);
    r.select(5);
    r.editor.insertHtmlAtCursor('<span style="background-color: red">explicit</span>');
    assert.match(r.editor.exportHtml(), /background-color: red/);
    r.editor.value = saved;
    assert.match(r.editor.exportHtml(), /font-family: Arial/);
    r.editor._insertTransfer({ getData: type => type === "text/html" ? '<span style="background-color: blue">pasted</span>' : "" });
    assert.doesNotMatch(r.editor.exportHtml(), /background-color: blue/);
    assert.match(r.editor.exportHtml(), /background-color: yellow/);
});
