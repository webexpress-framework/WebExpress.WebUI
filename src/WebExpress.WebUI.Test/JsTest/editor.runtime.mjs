import vm from "node:vm";
import fs from "node:fs";
import { webuiAsset } from "./harness.mjs";
import { createEditorDocument } from "./dom-stub.editor.mjs";

/** Exercises shipped assets with real controller transactions and a deterministic DOM. */
export function loadEditor(options = {}) {
    const { document, window, selection, globals } = createEditorDocument();
    const elementPrototype = Object.getPrototypeOf(document.body);
    if (!Object.getOwnPropertyDescriptor(elementPrototype, "dataset")) Object.defineProperty(elementPrototype, "dataset", { get() {
        const element = this;
        return new Proxy({}, { get(_, key) { return element.getAttribute("data-" + String(key).replace(/[A-Z]/g, c => "-" + c.toLowerCase())) ?? undefined; }, set(_, key, value) { element.setAttribute("data-" + String(key).replace(/[A-Z]/g, c => "-" + c.toLowerCase()), value); return true; } });
    } });
    elementPrototype.focus = function() { document.activeElement = this; };
    const plugins = new Map(), panels = new Map(), addons = new Map(), classes = new Map(), instances = new Map();
    const timers = new Map(); let timerId = 0;
    const windowListeners = {};
    window.addEventListener = (type, fn) => (windowListeners[type] ??= new Set()).add(fn);
    window.removeEventListener = (type, fn) => windowListeners[type]?.delete(fn);
    document.execCommand = () => { throw new Error("Native editing commands are forbidden"); };
    const wx = {
        Controller: { registerClass(name, cls) { classes.set(name, cls); }, getInstanceByElement(element) { return instances.get(element); }, classRegistry: classes, instanceMap: instances },
        Event: { CHANGE_VALUE_EVENT: "wx-change-value" }, I18N: { translate: key => key }, IconSet: { resolve: key => key },
        EditorPlugins: { register(name, order, plugin) { plugins.set(name, plugin); }, getAll: () => [...plugins.values()] },
        EditorAddOns: { register(id, definition) { addons.set(id, { ...definition, id }); }, get: id => addons.get(id) },
        EditorShortcuts: { getAll: () => [], register() {} },
        DialogPanels: { register(key, definition) { panels.set(definition.id || key, definition); } },
        ModalSidebarPanelCtrl: class { show() {} hide() {} selectPage() {} destroy() {} },
        ModalCtrl: class { show() {} hide() {} destroy() {} }
    };
    const observers = [];
    /**
     * Stands in for the browser's MutationObserver. It never fires on its own: a case that
     * needs a mutation delivered calls the callback it registered through the observers list.
     */
    const MutationObserver = class {
        /**
         * Registers the observer so a case can reach its callback.
         * @param {Function} callback - The mutation callback the editor registered.
         */
        constructor(callback) { this.callback = callback; observers.push(this); }
        /** Accepts any target; nothing is watched. */
        observe() {}
        /** Nothing was watched, so there is nothing to release. */
        disconnect() {}
        /**
         * Reports no pending mutations.
         * @returns {Array} An empty record list.
         */
        takeRecords() { return []; }
    };
    const sandbox = vm.createContext({ console, ...globals, Intl, navigator: { language: "en" }, MutationObserver, setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); }, webexpress: { webui: wx } });
    const load = name => vm.runInContext(fs.readFileSync(webuiAsset(name), "utf8"), sandbox, { filename: name });
    const core = fs.readFileSync(webuiAsset("webexpress.webui.js"), "utf8").replace(/\r\n/g, "\n");
    sandbox.HTMLElement = document.body.constructor;
    sandbox.CustomEvent = class {
        constructor(type, options) { this.type = type; Object.assign(this, options); }
        stopPropagation() {}
    };
    const ctrlStart = core.indexOf("webexpress.webui.Ctrl = class");
    vm.runInContext(core.slice(ctrlStart, core.indexOf("\n}", ctrlStart) + 2), sandbox, { filename: "Ctrl" });
    const menuStart = core.indexOf("webexpress.webui.NativeMenu = class");
    vm.runInContext(core.slice(menuStart, core.indexOf("\n};", menuStart) + 3), sandbox, { filename: "NativeMenu" });
    const fieldMenuStart = core.indexOf("webexpress.webui.MenuCtrl = class");
    vm.runInContext(core.slice(fieldMenuStart, core.indexOf("\n};", fieldMenuStart) + 3), sandbox, { filename: "MenuCtrl" });
    const contrastStart = core.indexOf("webexpress.webui.ContrastColor = class");
    vm.runInContext(core.slice(contrastStart, core.indexOf("\n};", contrastStart) + 3), sandbox, { filename: "ContrastColor" });
    ["webexpress.webui.input.color.js", "webexpress.webui.editor.model.js", "webexpress.webui.editor.view.js", "webexpress.webui.editor.js", ...(options.files || [])].forEach(load);
    if (options.addons) Object.entries(options.addons).forEach(([id, def]) => wx.EditorAddOns.register(id, def));
    const form = document.createElement("form"), host = document.createElement("div");
    host.setAttribute("name", "document");
    host.setAttribute("value", options.html || "<p>alpha</p>");
    if (options.disabled) host.setAttribute("disabled", "disabled");
    // the group the host sits in, so a case can disable the surface the way a form does
    const fieldset = document.createElement("fieldset");
    // the label a form group renders for the field, pointing at the host by its id
    const label = options.label ? document.createElement("label") : null;
    if (label) { host.id = "field"; label.setAttribute("for", "field"); label.textContent = options.label; fieldset.appendChild(label); }
    fieldset.appendChild(host); form.appendChild(fieldset); document.body.appendChild(form);
    const editor = new wx.EditorCtrl(host);
    instances.set(host, editor);
    const root = editor.getEditorElement();
    return {
        wx, editor, root, host, form, fieldset, label, observers, document, window, selection, plugins, panels, timers, sandbox, load,
        select(anchor, focus = anchor) { editor.selection = { anchor, focus }; },
        input(inputType, data, extra = {}) {
            const event = { type: "beforeinput", target: root.querySelector(".wx-editor-region"), inputType, data, cancelable: true, defaultPrevented: false,
                preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() {}, ...extra };
            root.dispatchEvent(event); return event;
        },
        key(key, extra = {}) {
            const event = { type: "keydown", target: root.querySelector(".wx-editor-region"), key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra };
            root.dispatchEvent(event); return event;
        },
        flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); }
    };
}
