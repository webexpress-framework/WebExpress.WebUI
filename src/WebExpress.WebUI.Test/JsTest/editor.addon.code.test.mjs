import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadEditor } from "./editor.runtime.mjs";

const files = ["editor/addons.js", "editor/addons/code.js", "webexpress.webui.content.js", "webexpress.webui.code.js"];

/**
 * Inserts code through the add-on workflow so properties and initial content use shipped code.
 * @returns {object} The editor runtime containing an empty code add-on.
 */
function codeEditor() {
    const r = loadEditor({ html: "<p>{</p>", files });
    const plugin = r.editor._addonPlugin;
    plugin._openModal(r.editor, "_selectionModal", "editor-addon", "Add-ons", { anchor: 0, focus: 1 });
    plugin._insertAddon(r.wx.EditorAddOns.get("code"), { language: "javascript", lineNumbers: "true" });
    return r;
}

test("code add-on is shipped and inserts an editable preformatted container with frame controls", () => {
    const r = codeEditor();
    const definition = r.wx.EditorAddOns.get("code");
    assert.equal(definition.isContainer, true);
    assert.equal(definition.contentClass, "wx-webui-code");
    const frame = r.root.querySelector('[data-addon-id="code"]');
    assert.ok(frame.querySelector('.wx-editor-addon-toolbar').querySelector('[data-addon-command="properties"]'));
    assert.equal(frame.querySelector(".wx-addon-body-container").getAttribute("contenteditable"), "true");
    assert.equal(frame.querySelector(".wx-addon-body-container").getAttribute("spellcheck"), "false");
    assert.equal(frame.querySelector("pre").textContent, "");
    assert.doesNotMatch(r.editor.exportHtml(), /\{/);
    const includes = fs.readFileSync(new URL("../../WebExpress.WebUI/WebInclude/IncludeJavaScript.cs", import.meta.url), "utf8");
    assert.match(includes, /Asset\("\/assets\/js\/editor\/addons\/code\.js"\)/);
});

test("code typing keeps line breaks, tabs and markup literal through history and reload", () => {
    const r = codeEditor();
    r.input("insertText", 'if (a < b) {');
    r.input("insertParagraph");
    r.key("Tab");
    r.input("insertText", 'print("<script> & München");');
    r.input("insertLineBreak");
    r.input("insertText", '}');
    const expected = 'if (a < b) {\n\tprint("<script> & München");\n}';
    assert.equal(r.root.querySelector("pre").textContent, expected);
    assert.equal(r.root.querySelectorAll('[data-addon-id="code"] pre').length, 1);
    assert.equal(r.root.querySelector("script"), null);
    const saved = r.editor.value;
    r.editor.execCommand("undo");
    assert.equal(r.root.querySelector("pre").textContent, expected.slice(0, -1));
    r.editor.execCommand("redo");
    assert.equal(r.editor.value, saved);
    r.editor.value = saved;
    assert.equal(r.root.querySelector("pre").textContent, expected);
    const read = r.wx.ContentFormat.toFragment(saved).querySelector(".wx-webui-code");
    assert.equal(read.dataset.language, "javascript");
    const ctrl = new r.wx.CodeCtrl(read);
    assert.equal(ctrl._code, expected);
    assert.equal(read.querySelector("script"), null);
});

test("code paste prefers literal source and property editing retains content and undo history", () => {
    const r = codeEditor();
    const source = '\n    <button>literal & text</button>\r\n';
    r.editor._insertTransfer({ getData: type => type === "text/plain" ? source : "<b>different rich text</b>" });
    const expected = source.replace(/\r\n/g, "\n");
    assert.equal(r.root.querySelector("pre").textContent, expected);
    r.editor.execCommand("bold");
    r.editor.execCommand("formatBlock", "h1");
    assert.equal(r.root.querySelector("pre").textContent, expected);
    assert.equal(r.root.querySelector("strong,h1"), null);
    const plugin = r.editor._addonPlugin;
    plugin._openSettingsForNode(r.editor, r.root.querySelector('[data-addon-id="code"]'));
    plugin._propModal.querySelector('[data-prop-name="language"]').value = "xml";
    plugin._propModal.querySelector('[data-prop-name="lineNumbers"]').value = "false";
    plugin._handlePropertySave();
    assert.equal(r.root.querySelector('[data-addon-id="code"]').dataset.language, "xml");
    assert.equal(r.root.querySelector("pre").textContent, expected);
    r.editor.execCommand("undo");
    assert.equal(r.root.querySelector('[data-addon-id="code"]').dataset.language, "javascript");
    assert.equal(r.root.querySelector("pre").textContent, expected);
});
