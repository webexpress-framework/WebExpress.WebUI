import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";
const addons = {
    badge: { type: "inline", properties: [{ name: "text" }], renderer: data => `<span class="badge">${data.text}</span>` },
    box: { type: "block", isContainer: true, content: "<p>inside</p>" },
    life: { type: "block", properties: [{ name: "size" }], renderer: data => `<div class="wx-webui-gameoflife" data-size="${data.size}"></div>` }
};
test("add-on values contain configuration rather than live widget DOM", () => {
    const r = loadEditor({ addons }); const M = r.wx.EditorModel;
    r.editor.dispatch({ type: "insertNodes", nodes: [M.node("addon", [], { name: "life", container: false, data: { size: "10" } })] });
    r.root.querySelector(".wx-addon-body-widget").innerHTML = "<canvas>temporary</canvas>";
    assert.equal(r.editor.value.includes("canvas"), false); r.editor.render();
    assert.ok(r.root.querySelector(".wx-webui-gameoflife"));
});
test("nested editable containers retain their recursive document through JSON reload", () => {
    const r = loadEditor({ addons }); const M = r.wx.EditorModel;
    r.editor.dispatch({ type: "insertNodes", nodes: [M.node("addon", [M.node("p", [{ type: "text", text: "inside", marks: {} }])], { name: "box", container: true, data: {} })] });
    const saved = r.editor.value; r.editor.value = "<p>other</p>"; r.editor.value = saved;
    assert.equal(r.root.querySelector(".wx-addon-body-container").textContent, "inside");
    assert.equal(r.editor._history.canUndo(), false);
});
test("configuration edits and atom removal have independent undo actions", () => {
    const r = loadEditor({ addons }); const M = r.wx.EditorModel;
    r.editor.dispatch({ type: "insertNodes", nodes: [M.node("addon", [], { name: "badge", inline: true, data: { text: "old" } })] });
    const id = M.entries(r.editor._state.doc).find(e => e.node.type === "addon").node.id;
    r.editor.updateNode(id, { data: { text: "new" } }); r.editor.removeNode(id);
    r.editor.execCommand("undo"); assert.match(r.root.textContent, /new/);
    r.editor.execCommand("undo"); assert.match(r.root.textContent, /old/);
});
test("disabled container bodies do not reopen nested editing hosts", () => {
    const r = loadEditor({ addons, disabled: true, html: '<div class="wx-addon-frame" data-addon-id="box"><div class="wx-addon-body-container"><p>inside</p></div></div>' });
    assert.equal(r.root.querySelector(".wx-addon-body-container").getAttribute("contenteditable"), "false");
});
