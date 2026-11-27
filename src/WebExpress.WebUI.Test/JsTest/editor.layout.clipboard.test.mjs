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

/**
 * Drags the selected text to a model position the way the browser does: the gesture starts on
 * the region, and the drop point comes from the caret lookup under the pointer.
 * @param {object} r - The editor test runtime.
 * @param {number} from - The selection start.
 * @param {number} to - The selection end.
 * @param {number} at - The drop position.
 * @param {object} [keys] - Modifier keys held during the drop.
 * @returns {object} The drop event.
 */
function dragText(r, from, to, at, keys = {}) {
    r.select(from, to);
    const data = new Map();
    const dataTransfer = { types: [], setData(type, value) { data.set(type, value); this.types.push(type); }, getData(type) { return data.get(type) || ""; } };
    const region = r.root.querySelector(".wx-editor-region");
    const event = type => ({ type, target: region, dataTransfer, clientX: 1, clientY: 1, ...keys,
        preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}, stopImmediatePropagation() {} });
    r.root.dispatchEvent(event("dragstart"));
    const point = r.editor._view.point(at);
    r.document.caretPositionFromPoint = () => ({ offsetNode: point.node, offset: point.offset });
    const drop = event("drop"); r.root.dispatchEvent(drop);
    r.root.dispatchEvent(event("dragend"));
    return drop;
}

const paragraphs = r => Array.from(r.root.querySelectorAll("p"), p => p.textContent);

test("dragging a selection moves it within the paragraph and one undo puts it back", () => {
    const r = loadEditor({ html: "<p>alpha beta gamma</p>" });
    const before = r.editor.value;
    assert.equal(dragText(r, 0, 6, 16).defaultPrevented, true);
    assert.deepEqual(paragraphs(r), ["beta gammaalpha "], "the source is gone and no paragraph is split off");
    assert.deepEqual({ ...r.editor.selection }, { anchor: 16, focus: 16 }, "the caret follows the moved text");
    r.editor.execCommand("undo");
    assert.equal(r.editor.value, before);
});

test("dragging a selection backwards keeps the formatting it carries", () => {
    const r = loadEditor({ html: "<p>alpha <b>beta</b></p>" });
    dragText(r, 6, 10, 0);
    assert.deepEqual(paragraphs(r), ["betaalpha "]);
    assert.match(r.editor.exportHtml(), /<p><strong>beta<\/strong>alpha <\/p>/);
    assert.deepEqual({ ...r.editor.selection }, { anchor: 4, focus: 4 });
});

test("dragging with the copy modifier or onto the selection itself leaves the source in place", () => {
    const r = loadEditor({ html: "<p>alpha beta gamma</p>" });
    dragText(r, 0, 6, 16, { ctrlKey: true });
    assert.deepEqual(paragraphs(r), ["alpha beta gammaalpha "]);
    const copied = r.editor.value;
    dragText(r, 0, 6, 3);
    assert.equal(r.editor.value, copied, "a drop inside the dragged range changes nothing");
});

test("text running across paragraphs is opened at both ends where it lands", () => {
    const r = loadEditor({ html: "<p>one</p><p>two</p><p>three</p>" });
    dragText(r, 2, 5, 13);
    assert.deepEqual(paragraphs(r), ["onwo", "threee", "t"], "the source closes up, the first part continues three");
    assert.deepEqual({ ...r.editor.selection }, { anchor: 13, focus: 13 });
});

test("whole paragraphs keep apart before, behind and inside the paragraph they are dropped on", () => {
    const html = "<p>one</p><p>two</p><p>three</p>";
    // 0..8 covers one and two up to the start of three, so it carries both paragraph ends
    let r = loadEditor({ html }); dragText(r, 0, 4, 8);
    assert.deepEqual(paragraphs(r), ["two", "one", "three"], "at the start it goes before");
    r = loadEditor({ html }); dragText(r, 0, 4, 13);
    assert.deepEqual(paragraphs(r), ["two", "three", "one"], "at the end it goes behind, without an empty paragraph");
    r = loadEditor({ html }); dragText(r, 0, 8, 10);
    assert.deepEqual(paragraphs(r), ["th", "one", "two", "ree"], "in the middle it splits the paragraph");
    r = loadEditor({ html }); dragText(r, 0, 8, 8);
    assert.deepEqual(paragraphs(r), ["one", "two", "three"], "back onto its own end it stays");
});

test("a whole heading moved away leaves the paragraph behind it as it was", () => {
    const r = loadEditor({ html: "<h2>head</h2><p>two</p><p>three</p>" });
    const before = r.editor.value;
    dragText(r, 0, 5, 14);
    assert.match(r.editor.exportHtml(), /<p>two<\/p><p>three<\/p><h2>head<\/h2>/);
    r.editor.execCommand("undo");
    assert.equal(r.editor.value, before);
});

test("moving the whole text of a paragraph or list item leaves no empty line behind", () => {
    let r = loadEditor({ html: "<p>one</p><p>two</p><p>three</p>" });
    dragText(r, 8, 13, 0);
    assert.deepEqual(paragraphs(r), ["threeone", "two"]);
    r = loadEditor({ html: "<ul><li><p>a</p></li></ul><p>q</p>" });
    dragText(r, 0, 1, 3);
    assert.match(r.editor.exportHtml(), /<p>qa<\/p><\/div>/, "the emptied item takes its list along");
    assert.equal(r.root.querySelector("ul"), null);
});

test("list items keep their list when copied or moved, and join a list they land in", () => {
    const html = "<ul><li><p>a</p></li><li><p>b</p></li></ul><p>one</p><p>two</p>";
    let r = loadEditor({ html });
    const payload = dragText(r, 0, 2, 11).dataTransfer;
    assert.match(payload.getData("text/html"), /^<ul><li><p>a<\/p><\/li><\/ul>$/);
    assert.match(r.editor.exportHtml(), /<ul><li><p>b<\/p><\/li><\/ul><p>one<\/p><p>two<\/p><ul><li><p>a<\/p><\/li><\/ul>/);
    r = loadEditor({ html });
    dragText(r, 0, 3, 7);
    assert.match(r.editor.exportHtml(), /<p>one<\/p><ul><li><p>a<\/p><\/li><li><p>b<\/p><\/li><\/ul><p>two<\/p>/, "the source items go, no empty bullet or line is left");
    r = loadEditor({ html: "<ul><li><p>a</p></li><li><p>b</p></li></ul><ol><li><p>x</p></li><li><p>y</p></li></ol>" });
    dragText(r, 0, 4, 5);
    assert.match(r.editor.exportHtml(), /<ol[^>]*><li><p>x<\/p><\/li><li><p>a<\/p><\/li><li><p>b<\/p><\/li><li><p>y<\/p><\/li><\/ol>/);
    assert.deepEqual({ ...r.editor.selection }, { anchor: 5, focus: 5 });
    r = loadEditor({ html });
    dragText(r, 2, 3, 7);
    assert.match(r.editor.exportHtml(), /<ul><li><p>a<\/p><\/li><\/ul><p>oneb<\/p>/, "text from within one item is just text");
});

test("nested lists keep their levels when copied or moved", () => {
    // a(0..1) > [a1(2..4) > [a1x(5..8)], a2(9..11)], b(12..13), end(14..17)
    const html = "<ul><li><p>a</p><ul><li><p>a1</p><ol><li><p>a1x</p></li></ol></li><li><p>a2</p></li></ul></li><li><p>b</p></li></ul><p>end</p>";
    const nested = '<ul><li><p>a</p><ul><li><p>a1</p><ol start="1"><li><p>a1x</p></li></ol></li><li><p>a2</p></li></ul></li><li><p>b</p></li></ul>';
    let r = loadEditor({ html });
    assert.equal(dragText(r, 0, 14, 17).dataTransfer.getData("text/html"), nested);
    assert.ok(r.editor.exportHtml().includes("<p>end</p>" + nested), "the whole tree lands behind end");
    r = loadEditor({ html });
    assert.equal(dragText(r, 2, 12, 17).dataTransfer.getData("text/html"), '<ul><li><p>a1</p><ol start="1"><li><p>a1x</p></li></ol></li><li><p>a2</p></li></ul>',
        "the copy starts at the level it was taken from");
    assert.match(r.editor.exportHtml(), /^<div[^>]*><div[^>]*><ul><li><p>a<\/p><\/li><li><p>b<\/p><\/li><\/ul>/, "the source keeps its outer items");
    r = loadEditor({ html });
    dragText(r, 2, 9, 13);
    assert.match(r.editor.exportHtml(), /<li><p>b<\/p><\/li><li><p>a1<\/p><ol start="1"><li><p>a1x<\/p><\/li><\/ol><\/li><\/ul><p>end<\/p>/, "moved into a list, the item brings its sub-list");
});

test("a selection starting deeper than it ends carries no item without text", () => {
    // x(0..1) > y(2..3) > z(4..5); w(6..7); end(8..11)
    const r = loadEditor({ html: "<ul><li><p>x</p><ul><li><p>y</p><ul><li><p>z</p></li></ul></li></ul></li><li><p>w</p></li></ul><p>end</p>" });
    assert.equal(dragText(r, 4, 8, 11).dataTransfer.getData("text/html"), "<ul><li><p>z</p></li><li><p>w</p></li></ul>");
    assert.match(r.editor.exportHtml(), /<ul><li><p>x<\/p><ul><li><p>y<\/p><\/li><\/ul><\/li><\/ul><p>end<\/p><ul><li><p>z<\/p><\/li><li><p>w<\/p><\/li><\/ul>/);
});

test("deleting across list items joins them instead of leaving an empty bullet", () => {
    const r = loadEditor({ html: "<ul><li><p>alpha</p></li><li><p>beta</p></li><li><p>gamma</p></li></ul>" });
    r.select(2, 8);
    r.editor.dispatch({ type: "delete" });
    assert.match(r.editor.exportHtml(), /<ul><li><p>alta<\/p><\/li><li><p>gamma<\/p><\/li><\/ul>/);
});

test("pasted paragraphs continue the text around the caret instead of splitting off empty ones", () => {
    const paste = (r, html) => r.editor._insertTransfer({ getData: type => type === "text/html" ? html : "" });
    let r = loadEditor({ html: "<p>alpha beta</p>" }); r.select(5); paste(r, "<p>x1</p><p>x2</p>");
    assert.deepEqual(paragraphs(r), ["alphax1", "x2 beta"]);
    assert.deepEqual({ ...r.editor.selection }, { anchor: 10, focus: 10 }, "the caret stands behind the pasted text");
    r = loadEditor({ html: "<p>alpha</p>" }); r.select(5); paste(r, "<p>x1</p><p>x2</p>");
    assert.deepEqual(paragraphs(r), ["alphax1", "x2"]);
    r = loadEditor({ html: "<p>alpha</p>" }); r.select(0); paste(r, "<h2>T</h2><p>x</p>");
    assert.match(r.editor.exportHtml(), /<h2>T<\/h2><p>xalpha<\/p>/, "a heading at the start keeps its kind");
    r = loadEditor({ html: "<h2></h2>" }); r.select(0); paste(r, "<p>x</p>");
    assert.match(r.editor.exportHtml(), /<h2>x<\/h2>/, "a single paragraph is text in the block it lands in");
});

test("paragraphs placed into a list become items of their own, so a list command reaches one", () => {
    const paste = (r, html) => r.editor._insertTransfer({ getData: type => type === "text/html" ? html : "" });
    const r = loadEditor({ html: "<ul><li><p>item</p></li><li><p>next</p></li></ul>" });
    r.select(2); paste(r, "<p>x1</p><p>x2</p>");
    assert.match(r.editor.exportHtml(), /<ul><li><p>itx1<\/p><\/li><li><p>x2em<\/p><\/li><li><p>next<\/p><\/li><\/ul>/);
    r.select(1); r.editor.execCommand("insertUnorderedList");
    assert.match(r.editor.exportHtml(), /<p>itx1<\/p><ul><li><p>x2em<\/p><\/li><li><p>next<\/p><\/li><\/ul>/, "only the first item leaves the list");
    const d = loadEditor({ html: "<ul><li><p>a</p></li><li><p>b</p></li></ul><p>one</p><p>two</p><p>three</p>" });
    dragText(d, 4, 12, 2);
    assert.match(d.editor.exportHtml(), /<ul><li><p>a<\/p><\/li><li><p>one<\/p><\/li><li><p>two<\/p><\/li><li><p>b<\/p><\/li><\/ul><p>three<\/p>/);
});
