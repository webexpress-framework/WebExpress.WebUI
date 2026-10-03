/**
 * Plugin for inserting and managing add-ons.
 * Provides a categorized selection modal, drag-and-drop placement
 * within the editor, and a property editor dialog.
 */
webexpress.webui.EditorPlugins.register("addons", 4000, {
    _selectionModal: null,
    _propModal: null,
    _currentEditor: null,
    _activeAddonNode: null,
    _insertionSelection: null,
    _propertyColorControls: null,

    /**
     * Initializes the plugin.
     * Sets up event listeners for interactions (click, drag & drop) within the editor content.
     * @param {object} editor -The editor instance.
     */
    init: function(editor) {
        editor._addonPlugin = this;
        return () => {
            this._propModal?.remove();
            this._selectionModal?.ctrl?.destroy?.();
            this._selectionModal?.element?.remove();
            this._propModalCtrl?.destroy?.();
            this._propertyColorControls?.forEach(control => control.destroy());
        };
    },

    /**
     * Keeps property actions in each add-on's own frame instead of the floating bubble.
     * @param {object} editor - The editor owning the newly rendered add-on frames.
     */
    onContentChange: function(editor) {
        editor.getEditorElement().querySelectorAll(".wx-addon-frame[data-addon-id],.wx-addon-inline-frame[data-addon-id]").forEach(frame => {
            const definition = webexpress.webui.EditorAddOns.get(frame.dataset.addonId);
            if (!definition?.properties?.length) return;
            const toolbar = document.createElement(definition.type === "inline" ? "span" : "div");
            toolbar.className = "wx-editor-frame-toolbar wx-editor-addon-toolbar";
            toolbar.setAttribute("role", "toolbar");
            toolbar.setAttribute("aria-label", definition.label || definition.id);
            toolbar.setAttribute("contenteditable", "false");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "wx-editor-btn";
            button.dataset.addonCommand = "properties";
            button.title = webexpress.webui.I18N.translate("webexpress.webui:editor.addon.properties");
            button.setAttribute("aria-label", button.title);
            const icon = document.createElement("i");
            icon.className = webexpress.webui.IconSet.resolve("gear");
            button.appendChild(icon);
            button.addEventListener("mousedown", event => { editor._saveCurrentSelection(); event.preventDefault(); });
            button.addEventListener("click", () => { if (!editor.disabled) this._openSettingsForNode(editor, frame); });
            toolbar.appendChild(button);
            frame.insertBefore(toolbar, Array.from(frame.children).find(child => child.classList.contains("card-body")));
        });
    },
    /**
     * Creates the plugin toolbar button.
     * @param {object} editor -The editor instance.
     * @returns {HTMLElement} The button group element.
     */
    createToolbar: function(editor) {
        const group = document.createElement("div");
        group.className = "wx-editor-btn-group";

        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.type = "button";
        btn.title = webexpress.webui.I18N.translate("webexpress.webui:editor.insert.addon.tooltip");
        btn.innerHTML = `<i class="${webexpress.webui.IconSet.resolve("puzzle")}"></i>`;

        btn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            if (typeof editor._saveCurrentSelection === "function") {
                editor._saveCurrentSelection();
            }
        });

        btn.addEventListener("click", () => {
            this._openModal(editor, "_selectionModal", "editor-addon", "webexpress.webui:editor.insert.addon.title");
        });

        group.appendChild(btn);
        return group;
    },

    /**
     * Opens a modal and provides the editor context to the modal controller.
     * @param {object} editor -The editor instance.
     * @param {string} modalProperty -The property name where the modal wrapper is stored.
     * @param {string} key -Registry key or identifier for the modal.
     * @param {string} title -The title to display in the modal header.
     * @param {object} [selection=editor.selection] - The model range to replace on insertion.
     */
    _openModal: function(editor, modalProperty, key, title, selection = editor.selection) {
        this._currentEditor = editor;
        this._activeAddonNode = null;
        this._insertionSelection = selection;
        if (!this[modalProperty]) {
            this[modalProperty] = this._createModal(key, title);
        }

        if (this[modalProperty] && this[modalProperty].ctrl) {
            const ctrl = this[modalProperty].ctrl;
            ctrl._editor = editor;

            if (typeof ctrl.show === "function") {
                editor.preserveDialogSelection(this[modalProperty].element);
                ctrl.show();
            }
        }
    },

    /**
     * Creates a minimal ModalSidebarPanelCtrl instance and returns a wrapper object.
     * @param {string} key -Registry key or identifier used by dialog panels.
     * @param {string} title -Modal header title.
     * @returns {{ element: HTMLElement, ctrl: object }} Wrapper containing element and controller.
     */
    _createModal: function(key, title) {
        const id = "wx-msp-" + key + "-" + Date.now();
        const el = document.createElement("dialog");
        el.id = id;
        el.setAttribute("data-size", "modal-xl");
        el.setAttribute("data-key", key);
        el.setAttribute("aria-hidden", "true");

        el.innerHTML = `
            <div class="wx-modal-header">
                <h5 class="modal-title">${webexpress.webui.I18N.translate(title)}</h5>
            </div>
            <div class="wx-modal-content p-0"></div>
            <div class="wx-modal-footer">
                <button class="btn btn-primary submit-btn" disabled>${webexpress.webui.I18N.translate("webexpress.webui:insert")}</button>
            </div>`;

        document.body.appendChild(el);
        const ctrl = new webexpress.webui.ModalSidebarPanelCtrl(el);

        return { element: el, ctrl: ctrl };
    },

    /**
     * Opens the property editor for a specific node (edit mode) or new add-on (insert mode).
     * @param {object} editor -Editor instance.
     * @param {HTMLElement} node -Existing add-on node (optional).
     */
    _openSettingsForNode: function(editor, node) {
        const addonId = node.dataset.addonId;
        const def = webexpress.webui.EditorAddOns.get(addonId);
        if (def && def.properties) {
            this._currentEditor = editor;
            this._activeAddonNode = node;
            this._insertionSelection = null;
            this._openPropertyDialog(def);
        }
    },

    /**
     * Creates and caches the property editor modal using the ModalCtrl.
     * Replaces manual DOM construction with the framework's modal controller.
     */
    _createPropertyModal: function() {
        if (this._propModalCtrl) {
            return;
        }

        this._propModal = document.createElement("dialog");
        this._propModal.className = "wx-prop-modal";
        this._propModal.setAttribute("data-close-label", webexpress.webui.I18N.translate("webexpress.webui:cancel"));
        this._propModal.setAttribute("data-size", "modal-lg");

        const headerDiv = document.createElement("div");
        headerDiv.className = "wx-modal-header";
        headerDiv.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.addon.properties");
        this._propModal.appendChild(headerDiv);

        this._propBody = document.createElement("div");
        this._propBody.className = "wx-modal-content";
        this._propModal.appendChild(this._propBody);

        const footerDiv = document.createElement("div");
        footerDiv.className = "wx-modal-footer";

        const insertBtn = document.createElement("button");
        insertBtn.className = "btn btn-primary save-prop";
        insertBtn.type = "button";
        insertBtn.textContent = webexpress.webui.I18N.translate("webexpress.webui:insert");
        insertBtn.addEventListener("click", () => {
            this._handlePropertySave();
        });

        footerDiv.appendChild(insertBtn);
        this._propModal.appendChild(footerDiv);

        document.body.appendChild(this._propModal);

        this._propModalCtrl = new webexpress.webui.ModalCtrl(this._propModal);
    },

    /**
     * Opens the property dialog and fills it with form fields based on definition.
     * @param {object} addonDef -Add-on definition.
     */
    _openPropertyDialog: function(addonDef) {
        if (!this._propModalCtrl) {
            this._createPropertyModal();
        }

        if (this._propModalCtrl && typeof this._propModalCtrl.update === "function") {
            this._propModalCtrl.update();
        }

        const formContainer = this._propModal.querySelector(".modal-body") || this._propModal.querySelector(".wx-modal-content");
        if (!formContainer) {
            return;
        }

        this._propertyColorControls?.forEach(control => control.destroy());
        this._propertyColorControls = new Map();
        formContainer.innerHTML = "";

        const values = {};

        if (this._activeAddonNode) {
            let widget = null;
            if (addonDef.type === "inline") {
                widget = this._activeAddonNode.firstElementChild || this._activeAddonNode;
            } else {
                const body = this._activeAddonNode.querySelector(".card-body");
                if (body) {
                    widget = body.firstElementChild;
                }
            }

            if (widget) {
                addonDef.properties.forEach(prop => {
                    const attr = "data-" + prop.name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
                    if (widget.hasAttribute(attr)) {
                        values[prop.name] = widget.getAttribute(attr);
                    } else if (this._activeAddonNode.hasAttribute(attr)) {
                        values[prop.name] = this._activeAddonNode.getAttribute(attr);
                    }
                });
            }
        }

        addonDef.properties.forEach(prop => {
            const wrapper = document.createElement("div");
            wrapper.className = "mb-3";

            const label = document.createElement("label");
            label.className = "form-label";
            label.textContent = prop.label;

            const input = this._createPropertyInput(prop);
            input.dataset.propName = prop.name;
            input.id = this._propModal.id + "-" + prop.name;
            label.setAttribute("for", input.id);
            const value = values[prop.name] || prop.default || "";
            if (prop.type === "color") input.dataset.value = value;
            else input.value = value;

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            formContainer.appendChild(wrapper);
            if (prop.type === "color") this._propertyColorControls.set(prop.name, new webexpress.webui.InputColorCtrl(input));
        });

        this._propModal.dataset.addonId = addonDef.id;

        if (this._propModalCtrl && typeof this._propModalCtrl.show === "function") {
            const selection = this._insertionSelection;
            this._currentEditor.preserveDialogSelection(this._propModal, selection ? { anchor: selection.focus, focus: selection.focus } : this._currentEditor.selection);
            this._propModalCtrl.show();
        }
    },

    /**
     * Builds the form field of a property. A property with a fixed set of values declares
     * `type: "select"` and its `options` as `{ value, label }` pairs. Color properties
     * receive a host for InputColorCtrl; remaining types use native input fields.
     * @param {object} prop - The property definition.
     * @returns {HTMLElement} The field element.
     */
    _createPropertyInput: function(prop) {
        if (prop.type === "color") return document.createElement("div");
        if (prop.type === "select") {
            const select = document.createElement("select");
            select.className = "form-select";
            (prop.options || []).forEach(option => {
                const item = document.createElement("option");
                item.value = option.value;
                item.textContent = option.label != null ? option.label : option.value;
                select.appendChild(item);
            });
            return select;
        }

        const input = document.createElement("input");
        input.className = "form-control";
        input.type = prop.type || "text";
        return input;
    },

    /**
     * Saves properties from the dialog and updates or inserts the add-on.
     */
    _handlePropertySave: function() {
        const addonId = this._propModal.dataset.addonId;
        const addonDef = webexpress.webui.EditorAddOns.get(addonId);
        const inputs = this._propModal.querySelectorAll("[data-prop-name]");
        const data = {};

        inputs.forEach(input => {
            data[input.dataset.propName] = this._propertyColorControls.get(input.dataset.propName)?.value ?? input.value;
        });

        if (this._activeAddonNode) {
            this._currentEditor.updateNode(this._activeAddonNode, { data });
        } else {
            this._insertAddon(addonDef, data);
        }

        if (this._propModalCtrl && typeof this._propModalCtrl.hide === "function") {
            this._propModalCtrl.hide();
        }
    },

    /**
     * Inserts a new add-on into the editor.
     * @param {object} addon -Add-on definition.
     * @param {object} data -Configuration data.
     */
    _insertAddon: function(addon, data) {
        const editor = this._currentEditor;
        if (!editor || editor.disabled) return;
        const Model = webexpress.webui.EditorModel;
        const content = addon.isContainer ? webexpress.webui.EditorHtml.read(typeof addon.renderer === "function" ? addon.renderer(data) : addon.content || "").nodes : [];
        const node = Model.node("addon", content, { name: addon.id, data: data || {}, inline: addon.type === "inline", container: !!addon.isContainer });
        editor.dispatch({ type: "insertNodes", nodes: [node], selection: this._insertionSelection || editor.selection });
        this._insertionSelection = null;
        if (addon.isContainer) { const entry = Model.find(editor._state.doc, node.id); if (entry) editor.selection = { anchor: entry.start, focus: entry.start }; }
    }
});
