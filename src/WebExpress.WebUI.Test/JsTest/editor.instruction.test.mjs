import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";
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
