import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

test("clicking an instruction exposes editing and deletion even beside text boundaries", () => {
    const r = loadEditor({ html: '<p>before<span class="wx-editor-instruction" contenteditable="false">hint</span>after</p>',
        files: ["editor/instruction.js", "editor/bubble.js", "panels/webexpress.webui.panel.editor.instruction.js"] });
    const instruction = r.root.querySelector(".wx-editor-instruction");
    r.root.dispatchEvent({ type: "click", target: instruction, button: 0, preventDefault() {} });
    assert.equal(r.editor.selection.focus - r.editor.selection.anchor, 1);
    r.editor.restoreSavedRange();
    const bubble = r.editor._plugins.find(plugin => plugin._resolveTarget);
    assert.equal(bubble._resolveTarget(r.selection, r.editor), instruction);
    bubble._rebuild(r.editor, { hasSelection: false, hasContext: true, target: instruction });
    assert.ok(bubble._bubbleEl.querySelector('[aria-label="webexpress.webui:editor.edit"]'));
    const plugin = r.editor._plugins.find(plugin => plugin.instructionModal !== undefined);
    const actions = plugin.getContextMenuItems(r.editor, instruction);
    actions[0].action();
    const modal = plugin.instructionModal.ctrl;
    assert.equal(modal._instructionPrefill.text, "hint");
    modal._instruction = { textInput: { value: "changed" } };
    r.panels.get("editor-instruction-page").onSubmit(modal);
    assert.match(r.editor.exportHtml(), />changed<\/span>/);
    r.editor.execCommand("undo");
    assert.match(r.editor.exportHtml(), />hint<\/span>/);
    plugin.getContextMenuItems(r.editor, r.root.querySelector(".wx-editor-instruction"))[1].action();
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>beforeafter</p>");
    r.editor.execCommand("undo");
    r.root.dispatchEvent({ type: "click", target: r.root.querySelector(".wx-editor-instruction"), button: 0, preventDefault() {} });
    r.input("deleteContentForward");
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>beforeafter</p>");
});
test("instruction changes use an atom update and cancelling leaves the document untouched", () => {
    const r = loadEditor({ html: '<p>before<span class="wx-editor-instruction" contenteditable="false">hint</span>after</p>' });
    const node = r.root.querySelector(".wx-editor-instruction"), before = r.editor.value;
    const id = r.editor.nodeId(node);
    assert.equal(r.editor.value, before);
    r.editor.updateNode(id, { text: "<changed>" });
    assert.match(r.editor.exportHtml({ layout: false }), /&lt;changed&gt;/);
    r.editor.execCommand("undo"); assert.equal(r.editor.value, before);
});
test("instruction removal restores exactly one atomic position on undo", () => {
    const r = loadEditor({ html: '<p>a<span class="wx-editor-instruction" contenteditable="false">hint</span>b</p>' });
    r.editor.removeNode(r.root.querySelector(".wx-editor-instruction"));
    assert.equal(r.editor.exportHtml({ layout: false }), "<p>ab</p>"); r.editor.execCommand("undo");
    assert.equal(r.editor._state.doc.children[0].children[0].children[0].children[1].type, "atom");
});
