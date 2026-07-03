/**
 * Headless unit tests for the add-on plugin (editor/addons.js), focused on
 * the rehydration of persisted add-ons: instantiating a control consumes its
 * marker class and replaces the widget markup with runtime DOM, so persisted
 * content only carries a dead shell. onContentChange must re-render dead
 * control add-ons from their definition (restoring the marker class for the
 * controller), while leaving live controls, static add-ons and editable
 * containers untouched.
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
const addonsJs = path.resolve(here, "..", "..", "WebExpress.WebUI", "Assets", "js", "editor", "addons.js");

/**
 * Loads the add-on plugin into a fresh vm context backed by the rich DOM
 * stub, with the registry surface the plugin touches stubbed out.
 * @returns {object} The plugin, registries, document and helpers.
 */
function loadAddonsPlugin() {
    const { document, globals } = createEditorDocument();

    let plugin = null;
    const addOns = new Map();
    const controller = {
        instanceMap: new Map(),
        classRegistry: new Map(),
        registerClass(selector, cls) { this.classRegistry.set(selector, cls); },
        getInstanceByElement(el) { return this.instanceMap.get(el) || null; }
    };

    const sandbox = {
        console,
        setTimeout,
        clearTimeout,
        ...globals,
        webexpress: {
            webui: {
                EditorPlugins: { register(name, position, definition) { plugin = definition; } },
                EditorAddOns: {
                    register(id, definition) { definition.id = id; addOns.set(id, definition); return this; },
                    get(id) { return addOns.get(id); }
                },
                Controller: controller,
                I18N: { translate: (key) => key },
                IconTheme: { resolveFa: (cls) => cls },
                ModalSidebarPanelCtrl: class { },
                ModalCtrl: class { }
            }
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(addonsJs, "utf8"), sandbox, { filename: addonsJs });

    const root = document.createElement("div");
    document.body.appendChild(root);

    // a control-hosting add-on comparable to the game of life
    sandbox.webexpress.webui.EditorAddOns.register("life", {
        label: "Life",
        icon: "fas fa-gamepad",
        type: "block",
        isContainer: false,
        properties: [{ name: "cellSize", label: "Cell Size", type: "number", default: 10 }],
        renderer: (data) => `<div class="wx-probe" data-cell-size="${data.cellSize || 10}"></div>`
    });
    controller.registerClass("wx-probe", class { });

    return {
        plugin,
        document,
        root,
        controller,
        wx: sandbox.webexpress.webui,
        editor: {
            getEditorElement: () => root,
            _saveCurrentSelection() { },
            _syncValue() { },
            _updateUndoRedoStates() { }
        }
    };
}

/**
 * Builds the persisted (dead) markup of a block add-on frame: no marker
 * class on the widget, runtime leftovers inside.
 * @param {string} addonId - The add-on id.
 * @param {string} bodyHtml - The persisted body content.
 * @param {string} [frameAttrs] - Additional attributes on the frame.
 * @returns {string} The frame markup.
 */
function deadFrameHtml(addonId, bodyHtml, frameAttrs = "") {
    return `
        <div class="wx-addon-frame card" contenteditable="false" data-addon-id="${addonId}"${frameAttrs}>
            <div class="card-header"><span>Life</span></div>
            <div class="card-body p-2 wx-addon-body-widget" contenteditable="false">${bodyHtml}</div>
        </div>`;
}

test("a persisted dead control add-on is re-rendered with its marker class", () => {
    const { plugin, root, editor } = loadAddonsPlugin();

    // persisted shell: marker class consumed, runtime canvas serialized empty
    root.innerHTML = deadFrameHtml("life",
        '<div style="width: 100%;" data-cell-size="14"><canvas></canvas></div>');

    plugin.onContentChange(editor);

    const widget = root.querySelector(".card-body").firstElementChild;
    assert.equal(widget.classList.contains("wx-probe"), true, "the marker class is restored");
    assert.equal(widget.getAttribute("data-cell-size"), "14", "the persisted configuration is kept");
    assert.equal(root.querySelectorAll("canvas").length, 0, "the stale runtime dom is dropped");
});

test("rehydration falls back to the frame attributes when the widget lost them", () => {
    const { plugin, root, editor } = loadAddonsPlugin();

    // the control replaced the widget markup entirely; only the frame still
    // carries the configuration
    root.innerHTML = deadFrameHtml("life", "<canvas></canvas>", ' data-cell-size="22"');

    plugin.onContentChange(editor);

    const widget = root.querySelector(".card-body").firstElementChild;
    assert.equal(widget.classList.contains("wx-probe"), true);
    assert.equal(widget.getAttribute("data-cell-size"), "22");
});

test("a live control is not re-rendered", () => {
    const { plugin, root, editor, controller } = loadAddonsPlugin();

    root.innerHTML = deadFrameHtml("life",
        '<div data-cell-size="14"><canvas></canvas></div>');
    const widget = root.querySelector(".card-body").firstElementChild;
    controller.instanceMap.set(widget, {});

    plugin.onContentChange(editor);

    assert.equal(root.querySelector(".card-body").firstElementChild, widget, "the widget element survives");
    assert.equal(root.querySelectorAll("canvas").length, 1, "the runtime dom is untouched");
});

test("a freshly inserted widget (marker still pending) is not re-rendered", () => {
    const { plugin, root, editor } = loadAddonsPlugin();

    root.innerHTML = deadFrameHtml("life", '<div class="wx-probe" data-cell-size="14"></div>');
    const widget = root.querySelector(".card-body").firstElementChild;

    plugin.onContentChange(editor);

    assert.equal(root.querySelector(".card-body").firstElementChild, widget, "the widget element survives");
});

test("static add-ons keep their persisted markup", () => {
    const { plugin, root, editor, wx } = loadAddonsPlugin();
    wx.EditorAddOns.register("warning-box", {
        label: "Warning",
        icon: "fas fa-exclamation-triangle",
        type: "block",
        isContainer: false,
        content: '<div class="alert alert-warning mb-0"><strong>Warning:</strong> Static alert.</div>'
    });

    root.innerHTML = deadFrameHtml("warning-box",
        '<div class="alert alert-warning mb-0"><strong>Warning:</strong> User edited text.</div>');

    plugin.onContentChange(editor);

    const body = root.querySelector(".card-body");
    assert.ok(body.textContent.indexOf("User edited text.") !== -1, "the persisted markup survives");
});

test("editable containers keep their user content", () => {
    const { plugin, root, editor, wx } = loadAddonsPlugin();
    wx.EditorAddOns.register("info-box", {
        label: "Info",
        icon: "fas fa-info-circle",
        type: "block",
        isContainer: true,
        content: '<div class="alert alert-info mb-0"><strong>Note:</strong> Type here...</div>'
    });

    root.innerHTML = `
        <div class="wx-addon-frame card" contenteditable="false" data-addon-id="info-box">
            <div class="card-header"><span>Info</span></div>
            <div class="card-body p-2 wx-addon-body-container" contenteditable="true"><p>my user text</p></div>
        </div>`;

    plugin.onContentChange(editor);

    assert.ok(root.querySelector(".card-body").textContent.indexOf("my user text") !== -1,
        "the container body survives");
});

test("the frame persists the property values as data attributes", () => {
    const { plugin, wx } = loadAddonsPlugin();
    const def = wx.EditorAddOns.get("life");

    const html = plugin._createFrameHtml(def, '<div class="wx-probe"></div>', { cellSize: 14 });

    assert.ok(html.indexOf('data-cell-size="14"') !== -1, "the configuration lands on the frame");
    assert.ok(html.indexOf('data-addon-id="life"') !== -1);
});
