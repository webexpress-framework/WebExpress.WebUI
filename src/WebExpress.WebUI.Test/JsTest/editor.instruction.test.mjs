/**
 * Headless unit tests for the instruction text ("Platzhaltertext") flow:
 * editing an existing instruction must update the element in place - the old
 * implementation removed the element before the dialog opened and relied on
 * a fragile re-insertion, which lost the instruction when anything in the
 * modal round trip went wrong (or the dialog was cancelled).
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
const assetsJs = path.resolve(here, "..", "..", "WebExpress.WebUI", "Assets", "js");

/**
 * Loads the instruction panel and plugin into a fresh vm context backed by
 * the rich DOM stub.
 * @returns {object} The panel definition, plugin, document and helpers.
 */
function loadInstruction() {
    const { document, globals } = createEditorDocument();

    let plugin = null;
    const panels = new Map();

    const sandbox = {
        console,
        setTimeout,
        clearTimeout,
        ...globals,
        webexpress: {
            webui: {
                EditorPlugins: { register(name, position, definition) { plugin = definition; } },
                DialogPanels: { register(key, definition) { panels.set(key, definition); } },
                I18N: { translate: (key) => key },
                IconSet: { resolve: (icon) => icon },
                ModalSidebarPanelCtrl: class {
                    constructor(element) { this.element = element; }
                    show() { this.shown = true; }
                }
            }
        }
    };
    vm.createContext(sandbox);
    ["panels/webexpress.webui.panel.editor.instruction.js", "editor/instruction.js"].forEach((file) => {
        const full = path.join(assetsJs, file);
        vm.runInContext(fs.readFileSync(full, "utf8"), sandbox, { filename: full });
    });

    const root = document.createElement("div");
    document.body.appendChild(root);

    const calls = { sync: 0, undo: 0, inserted: [] };
    const editor = {
        getEditorElement: () => root,
        _saveCurrentSelection() { },
        _syncValue() { calls.sync++; },
        _updateUndoRedoStates() { calls.undo++; },
        insertHtmlAtCursor(html) { calls.inserted.push(html); }
    };

    return { panel: panels.get("editor-instruction"), plugin, document, root, editor, calls };
}

/**
 * Builds a paragraph holding an instruction span followed by ordinary text.
 * @param {object} root - The editor root element.
 * @returns {object} The instruction element.
 */
function buildInstruction(root) {
    root.innerHTML =
        '<p><span class="wx-editor-instruction" contenteditable="false">' +
        '<i class="fas fa-info-circle"></i> old text</span>&nbsp;surrounding</p>';
    return root.querySelector(".wx-editor-instruction");
}

test("submitting the edit dialog updates the instruction in place", () => {
    const { panel, root, editor, calls } = loadInstruction();
    const instruction = buildInstruction(root);
    const parent = instruction.parentNode;

    const modal = {
        _editor: editor,
        _instruction: { textInput: { value: "  new text  " } },
        _instructionTarget: instruction,
        hide() { this.hidden = true; }
    };

    panel.onSubmit(modal);

    assert.equal(instruction.parentNode, parent, "the element keeps its position");
    assert.ok(instruction.textContent.indexOf("new text") !== -1, "the text is updated");
    assert.ok(instruction.querySelector("i"), "the icon is preserved");
    assert.equal(root.querySelectorAll(".wx-editor-instruction").length, 1, "no duplicate is created");
    assert.equal(calls.inserted.length, 0, "nothing is re-inserted");
    assert.equal(calls.sync, 1, "the value is synced");
    assert.equal(modal._instructionTarget, null, "the edit target is consumed");
    assert.equal(modal.hidden, true, "the dialog closes");
});

test("the edit action keeps the instruction in the document until submit", () => {
    const { plugin, root, editor } = loadInstruction();
    const instruction = buildInstruction(root);

    const items = plugin.getContextMenuItems(editor, instruction);
    assert.ok(items.length >= 2, "edit and remove items are offered");

    items[0].action();

    assert.ok(instruction.parentNode, "the instruction survives opening the dialog (cancel-safe)");
    assert.equal(plugin.instructionModal.ctrl._instructionTarget, instruction,
        "the dialog receives the element as its edit target");
    assert.equal(plugin.instructionModal.ctrl._instructionPrefill.text, "old text",
        "the dialog is prefilled with the current text");
});

test("submitting without an edit target inserts a new instruction", () => {
    const { panel, editor, calls } = loadInstruction();

    const modal = {
        _editor: editor,
        _instruction: { textInput: { value: "fresh" } },
        _instructionTarget: null,
        hide() { }
    };

    panel.onSubmit(modal);

    assert.equal(calls.inserted.length, 1, "the instruction is inserted");
    assert.ok(calls.inserted[0].indexOf("wx-editor-instruction") !== -1);
    assert.ok(calls.inserted[0].indexOf("fresh") !== -1);
});

test("a stale edit target outside the editor falls back to inserting", () => {
    const { panel, document, editor, calls } = loadInstruction();

    const detached = document.createElement("span");
    const modal = {
        _editor: editor,
        _instruction: { textInput: { value: "fresh" } },
        _instructionTarget: detached,
        hide() { }
    };

    panel.onSubmit(modal);

    assert.equal(calls.inserted.length, 1, "the text is inserted instead of lost");
});
