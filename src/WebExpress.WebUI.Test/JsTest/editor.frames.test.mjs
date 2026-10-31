import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

const files = ["editor/addons.js", "editor/table.js", "editor/bubble.js", "webexpress.webui.content.js"];
const addons = {
    box: { label: "Box", isContainer: true, properties: [{ name: "title" }] },
    token: { label: "Token", type: "inline", content: "Token", properties: [{ name: "text" }] },
    notice: { label: "Notice", isContainer: true }
};
const html = '<div class="wx-addon-frame" data-addon-id="box"><div class="wx-addon-body-container"><p>outer</p>' +
    '<table><tbody><tr><td><div class="wx-addon-frame" data-addon-id="notice"><div class="wx-addon-body-container"><p>nested</p></div></div></td></tr></tbody></table>' +
    '</div></div><p>left<span class="wx-addon-inline-frame" data-addon-id="token"></span>right</p>';

/**
 * Reads only direct frame chrome so nested frames cannot satisfy an outer frame assertion.
 * @param {HTMLElement} frame - The frame under test.
 * @param {string} className - The class identifying a direct child.
 * @returns {HTMLElement|undefined} The frame-owned child.
 */
function child(frame, className) {
    return Array.from(frame.children).find(element => element.classList.contains(className));
}

/**
 * Activates the deletion action through the same menu used by mouse and keyboard input.
 * @param {HTMLElement} frame - The frame whose own model node should be deleted.
 */
function remove(frame) {
    const menu = child(frame, "wx-addon-header").querySelector("[popover]");
    menu.hidePopover = () => {};
    const button = menu.querySelector("button");
    button.dispatchEvent({ type: "click", target: button });
}

test("every table, block and inline frame shares a delete-only native menu", () => {
    const r = loadEditor({ html, files, addons });
    const frames = r.root.querySelectorAll(".wx-addon-frame,.wx-addon-inline-frame");
    assert.equal(frames.length, 4);
    for (const frame of frames) {
        const header = child(frame, "wx-addon-header");
        const toggle = header.querySelector(".wx-editor-frame-options");
        assert.equal(toggle.classList.contains("dropdown-toggle"), false);
        assert.equal(toggle.querySelector("i").className, "more");
        const actions = header.querySelectorAll(".dropdown-item");
        assert.equal(actions.length, 1);
        assert.equal(actions[0].dataset.frameCommand, "delete");
        assert.equal(actions[0].textContent.trim(), "webexpress.webui:editor.frame.delete");
    }
    assert.equal(r.root.querySelector('[data-table-command="deleteTable"]'), null);
    assert.equal(child(r.root.querySelector('[data-addon-id="notice"]'), "wx-editor-frame-toolbar"), undefined);
});

test("property toolbars target their own block or inline add-on and never contribute bubble actions", () => {
    const r = loadEditor({ html, files, addons });
    const plugin = r.editor._addonPlugin;
    const bubble = r.editor._plugins.find(item => item._contextElement);
    const edited = [];
    plugin._openSettingsForNode = (editor, frame) => edited.push({ editor, id: editor.nodeId(frame) });
    for (const name of ["box", "token"]) {
        const frame = r.root.querySelector('[data-addon-id="' + name + '"]');
        const toolbar = child(frame, "wx-editor-frame-toolbar");
        assert.equal(toolbar.getAttribute("role"), "toolbar");
        const button = toolbar.querySelector('[data-addon-command="properties"]');
        assert.equal(button.querySelector("i").className, "gear");
        button.dispatchEvent({ type: "click", target: button });
        assert.equal(edited.at(-1).id, r.editor.nodeId(frame));
        assert.equal(edited.at(-1).editor, r.editor);
        assert.equal(bubble._contextElement(r.editor, child(frame, "card-body")), null);
    }
    assert.equal(plugin.getContextMenuItems, undefined);
});

test("deleting a nested frame affects only that node and undo and reload restore one set of controls", () => {
    for (const selector of ['[data-addon-id="notice"]', '.wx-editor-table-frame', '[data-addon-id="box"]', '[data-addon-id="token"]']) {
        const r = loadEditor({ html, files, addons });
        const frame = r.root.querySelector(selector);
        const id = r.editor.nodeId(frame), before = r.editor.value;
        r.select(0);
        remove(frame);
        assert.equal(r.wx.EditorModel.find(r.editor._state.doc, id), undefined);
        assert.equal(r.editor._history._entries.length, 1);
        if (selector !== '[data-addon-id="box"]') assert.ok(r.root.querySelector('[data-addon-id="box"]'));
        r.editor.execCommand("undo");
        assert.equal(r.editor.value, before);
        r.editor.value = r.editor.value;
        const restored = r.root.querySelector(selector);
        assert.equal(child(restored, "wx-addon-header").querySelectorAll(".wx-editor-frame-options").length, 1);
        assert.doesNotMatch(r.editor.exportHtml(), /wx-editor-frame-|data-frame-command|data-addon-command/);
        const reading = r.wx.ContentFormat.toFragment(r.root.innerHTML);
        assert.equal(reading.querySelector(".wx-addon-header,.wx-editor-frame-toolbar"), null);
        assert.equal(reading.querySelector('[data-addon-id="token"]').textContent, "Token");
    }
});

test("disabled frame controls cannot delete nodes or open properties and recover when enabled", () => {
    const r = loadEditor({ html, files, addons });
    let edits = 0;
    r.editor._addonPlugin._openSettingsForNode = () => { edits++; };
    const before = r.editor.value;
    r.editor.disabled = true;
    for (const button of r.root.querySelectorAll(".wx-editor-frame-options,[data-frame-command],[data-addon-command]")) assert.equal(button.disabled, true);
    for (const frame of r.root.querySelectorAll(".wx-addon-frame,.wx-addon-inline-frame")) remove(frame);
    r.root.querySelector('[data-addon-command="properties"]').dispatchEvent({ type: "click" });
    assert.equal(r.editor.value, before);
    assert.equal(edits, 0);
    r.editor.disabled = false;
    for (const button of r.root.querySelectorAll(".wx-editor-frame-options,[data-frame-command],[data-addon-command]")) assert.equal(button.disabled, false);
    r.root.querySelector('[data-addon-command="properties"]').dispatchEvent({ type: "click" });
    assert.equal(edits, 1);
});
