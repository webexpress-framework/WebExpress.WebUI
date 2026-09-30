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

test("semantic containers support typing, paragraphs, formatting, deletion, undo and reload", () => {
    for (const [name, color] of [["info", "info"], ["warning", "warning"], ["error", "danger"], ["success", "success"]]) {
        const r = loadEditor({ html: "<p>Before</p>", files: ["editor/addons.js", "editor/addons/default.js", "webexpress.webui.content.js"] });
        const plugin = r.editor._addonPlugin;
        plugin._openModal(r.editor, "_selectionModal", "editor-addon", "Add-ons");
        plugin._insertAddon(r.wx.EditorAddOns.get(name + "-box"), {});
        let body = r.root.querySelector(".wx-addon-body-container");
        assert.equal(body.getAttribute("contenteditable"), "true");
        assert.equal(body.classList.contains("alert-" + color), true);
        assert.equal(body.querySelector(".wx-editor-row"), null);
        const entry = r.wx.EditorModel.entries(r.editor._state.doc).find(e => e.node.type === "addon");
        r.select(entry.start, entry.end - 1);
        r.input("insertText", "Editable");
        r.input("insertParagraph");
        r.editor.execCommand("bold");
        r.input("insertText", "Second");
        const state = r.editor.value;
        r.editor.value = state;
        body = r.root.querySelector(".wx-addon-body-container");
        assert.equal(body.querySelectorAll("p").length, 2);
        assert.equal(body.querySelector("strong").textContent, "Second");
        assert.equal(body.textContent, "EditableSecond");
        const second = r.wx.EditorModel.entries(r.editor._state.doc).find(e => e.node.type === "p" && e.node.children.some(n => n.text === "Second"));
        r.select(second.start, second.end - 1);
        r.input("deleteContentForward");
        assert.equal(r.root.querySelector(".wx-addon-body-container").textContent, "Editable");
        r.editor.execCommand("undo");
        assert.equal(r.root.querySelector(".wx-addon-body-container").textContent, "EditableSecond");
        const reading = r.wx.ContentFormat.toFragment(r.editor.value);
        assert.equal(reading.querySelector(".wx-content-addon").classList.contains("alert-" + color), true);
        assert.equal(reading.querySelector(".wx-content-addon").textContent, "EditableSecond");
        assert.equal(r.wx.EditorAddOns.get("card-container"), undefined);
    }
});

test("saved warning widgets gain editable content without losing authored HTML text", () => {
    const files = ["editor/addons/default.js"];
    const r = loadEditor({ files, html: '<div class="wx-addon-frame" data-addon-id="warning-box"><div class="wx-addon-body-widget"><p>Existing warning</p></div></div>' });
    assert.equal(r.root.querySelector(".wx-addon-body-container").textContent, "Existing warning");
    const state = r.editor.getState();
    const node = r.wx.EditorModel.entries(state.doc).find(e => e.node.type === "addon").node;
    node.attrs.container = false;
    node.children = [];
    r.editor.value = state;
    assert.equal(r.root.querySelector(".wx-addon-body-container").getAttribute("contenteditable"), "true");
    assert.ok(r.root.querySelector(".wx-addon-body-container p"));
});

test("removing a container from the catalog preserves its authored HTML content", () => {
    const r = loadEditor({ files: ["editor/addons/default.js"], html: '<div class="wx-addon-frame" data-addon-id="card-container"><div class="wx-addon-body-container"><p>Retained <strong>content</strong></p></div></div>' });
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>Retained <strong>content</strong></p>");
    assert.equal(r.wx.EditorAddOns.get("card-container"), undefined);
});

test("box border properties survive insertion, editing, undo and reading conversion", () => {
    const r = loadEditor({ html: "<p>{</p>", files: ["editor/addons.js", "webexpress.webui.content.js"] });
    r.wx.BoxCtrl = { LAYOUTS: ["solid", "dashed"] };
    r.load("editor/addons/box.js");
    r.select(1);
    const plugin = r.editor._addonPlugin;
    plugin._openModal(r.editor, "_selectionModal", "editor-addon", "Add-ons", { anchor: 0, focus: 1 });
    const definition = r.wx.EditorAddOns.get("box");
    plugin._openPropertyDialog(definition);
    const color = plugin._propertyColorControls.get("borderColor");
    assert.ok(color instanceof r.wx.InputColorCtrl);
    color.value = "#cc2255";
    plugin._handlePropertySave();
    let frame = r.root.querySelector('[data-addon-id="box"]');
    assert.equal(r.root.querySelector(".wx-editor-region").textContent.includes("{"), false);
    assert.equal(frame.dataset.borderColor, "#cc2255");
    assert.equal(frame.querySelector(".wx-addon-body-container").style.getPropertyValue("--wx-box-line-color"), "#cc2255");
    plugin._openSettingsForNode(r.editor, frame);
    assert.equal(plugin._propertyColorControls.get("borderColor").value, "#cc2255");
    plugin._propertyColorControls.get("borderColor").value = "#336699";
    plugin._handlePropertySave();
    assert.equal(r.root.querySelector('[data-addon-id="box"]').dataset.borderColor, "#336699");
    r.editor.execCommand("undo");
    assert.equal(r.root.querySelector('[data-addon-id="box"]').dataset.borderColor, "#cc2255");
    const reading = r.wx.ContentFormat.toFragment(r.editor.value);
    assert.equal(reading.querySelector(".wx-webui-box").dataset.borderColor, "#cc2255");
});
