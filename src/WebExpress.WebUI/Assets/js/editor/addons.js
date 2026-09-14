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
    _draggedNode: null,
    _dropMarker: null,
    _backupRange: null,

    /**
     * Helper to safely retrieve the target element from an event.
     * Handles text nodes by returning their parent element.
     * @param {Event} e -The event object.
     * @returns {HTMLElement | null} The target element.
     */
    _getSafeTarget: function(e) {
        let target = e.target;
        if (target && target.nodeType === 3) {
            target = target.parentNode;
        }
        return target;
    },









    /**
     * Collects the persisted property values of an add-on. The widget element
     * is preferred (settings dialog writes there); the frame serves as the
     * fallback because new insertions persist the values on the frame, which
     * survives even when a control replaces the widget markup at runtime.
     * @param {object} def -Add-on definition.
     * @param {HTMLElement} frame -The add-on frame element.
     * @param {HTMLElement|null} widget -The widget element inside the body.
     * @returns {object} The property values keyed by property name.
     */
    _readAddonData: function(def, frame, widget) {
        const data = {};
        (def.properties || []).forEach((prop) => {
            const attr = this._propertyAttributeName(prop.name);
            if (widget && widget.hasAttribute && widget.hasAttribute(attr)) {
                data[prop.name] = widget.getAttribute(attr);
            } else if (frame.hasAttribute(attr)) {
                data[prop.name] = frame.getAttribute(attr);
            }
        });
        return data;
    },

    /**
     * Returns the data attribute name of a property (camelCase to kebab-case).
     * @param {string} name -The property name.
     * @returns {string} The data attribute name.
     */
    _propertyAttributeName: function(name) {
        return "data-" + name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    },





    /**
     * Initializes the plugin.
     * Sets up event listeners for interactions (click, drag & drop) within the editor content.
     * @param {object} editor -The editor instance.
     */
    init: function(editor) {
        editor._addonPlugin = this;
        const root = editor.getEditorElement();
        editor.listen(root, "click", e => {
            if (editor.disabled) return;
            const button = e.target.closest?.(".wx-addon-settings-btn");
            if (button) { e.preventDefault(); this._openSettingsForNode(editor, button.closest("[data-addon-id]")); }
        });
        this._initDragEvents(root, editor);
        return () => {
            this._removeDropMarker();
            for (const key of ["_propModal", "_selectionModal"]) this[key]?.remove();
            this._propModalCtrl?.destroy?.();
        };
    },

    /**
     * Initializes drag and drop event listeners on the editor element.
     * Manages the draggable state of frames to allow text selection vs. moving.
     * @param {HTMLElement} editorElem -The content editable element.
     * @param {object} editor -The editor instance.
     */
    _initDragEvents: function(root, editor) {
        editor.listen(root, "dragstart", e => {
            if (editor.disabled) { e.preventDefault(); return; }
            const frame = e.target.closest?.("[data-addon-id]");
            if (!frame) return;
            this._draggedId = editor.nodeId(frame);
            e.dataTransfer.setData("application/x-webexpress-editor-node", this._draggedId);
        });
        editor.listen(root, "dragover", e => { if (this._draggedId && !editor.disabled) e.preventDefault(); });
        editor.listen(root, "drop", e => {
            if (!this._draggedId || editor.disabled) return;
            const range = this._getRangeFromEvent(e);
            if (!range) return;
            const position = editor._view.index(range.startContainer, range.startOffset);
            if (position === null) return;
            e.preventDefault(); e.stopPropagation();
            editor.dispatch({ type: "moveNode", id: this._draggedId, position });
            this._draggedId = null;
        });
        editor.listen(root, "dragend", () => { this._draggedId = null; });
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
            let activeRange = null;
            if (editor._savedRange) {
                activeRange = editor._savedRange.cloneRange();
            }

            // store a stable insertion range; do not overwrite a previously valid range with null
            if (activeRange) {
                this._backupRange = activeRange.cloneRange();
            }

            this._currentEditor = editor;
            this._activeAddonNode = null;
            this._openModal(editor, "_selectionModal", "editor-addon", "webexpress.webui:editor.insert.addon.title", activeRange);
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
     * @param {Range | null} activeRange -The actively saved text range before focus loss.
     */
    _openModal: function(editor, modalProperty, key, title, activeRange) {
        if (!this[modalProperty]) {
            this[modalProperty] = this._createModal(key, title);
        }

        if (this[modalProperty] && this[modalProperty].ctrl) {
            const ctrl = this[modalProperty].ctrl;
            ctrl._editor = editor;

            // keep last known insertion range if no new one is provided
            if (activeRange) {
                ctrl._backupRange = activeRange.cloneRange();
                this._backupRange = activeRange.cloneRange();
            }

            // ensure the modal insert button is wired and state is synced
            this._wireSelectionModalHandlers(this[modalProperty].element);

            if (typeof ctrl.show === "function") {
                ctrl.show();
            }

            this._syncSelectionModalInsertState(this[modalProperty].element);
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

        // selection is stored on the modal host to survive reopen without relying on ui events
        el.setAttribute("data-selected-addon", "");

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
     * Wires click handlers for the selection modal once.
     * - captures tile selection and stores it on the modal host
     * - wires the insert button to create the add-on or open the property dialog
     * @param {HTMLElement} modalEl -The modal host element.
     */
    _wireSelectionModalHandlers: function(modalEl) {
        if (!modalEl || modalEl.dataset.wxHandlersWired === "true") {
            return;
        }

        modalEl.dataset.wxHandlersWired = "true";

        // selection handler: expects tiles/items to provide data-addon-id
        modalEl.addEventListener("click", (e) => {
            const target = this._getSafeTarget(e);
            if (!target) {
                return;
            }

            const tile = target.closest("[data-addon-id]");
            if (tile && modalEl.contains(tile)) {
                const addonId = tile.getAttribute("data-addon-id") || "";
                modalEl.setAttribute("data-selected-addon", addonId);
                this._syncSelectionModalInsertState(modalEl);
            }

            const insertBtn = target.closest(".submit-btn");
            if (insertBtn) {
                e.preventDefault();
                e.stopPropagation();
                this._handleSelectionModalInsert(modalEl);
            }
        });
    },

    /**
     * Enables/disables the selection modal insert button based on stored selection.
     * @param {HTMLElement} modalEl -The modal host element.
     */
    _syncSelectionModalInsertState: function(modalEl) {
        if (!modalEl) {
            return;
        }

        const insertBtn = modalEl.querySelector(".submit-btn");
        if (!insertBtn) {
            return;
        }

        const addonId = modalEl.getAttribute("data-selected-addon") || "";
        insertBtn.disabled = addonId.length === 0;
    },

    /**
     * Handles the insert action from the selection modal.
     * @param {HTMLElement} modalEl -The modal host element.
     */
    _handleSelectionModalInsert: function(modalEl) {
        const addonId = modalEl ? (modalEl.getAttribute("data-selected-addon") || "") : "";
        if (!addonId) {
            return;
        }

        const def = webexpress.webui.EditorAddOns.get(addonId);
        if (!def) {
            return;
        }

        // insert mode: ensure no active node is set
        this._activeAddonNode = null;

        // open properties when available, otherwise insert directly
        if (def.properties && def.properties.length > 0) {
            const activeRange = this._backupRange ? this._backupRange.cloneRange() : null;
            this._openPropertyDialog(def, activeRange);
        } else {
            this._insertAddon(def, {});
        }
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
            this._openPropertyDialog(def, null);
        }
    },

    /**
     * Generates context menu items for add-on elements.
     * @param {object} editor -Editor instance.
     * @param {HTMLElement} target -Click target.
     * @returns {Array} List of menu items.
     */
    getContextMenuItems: function(editor, target) {
        let element = target;
        if (element.nodeType === 3) {
            element = element.parentNode;
        }

        const wrapper = element.closest("[data-addon-id]");
        if (!wrapper) {
            return [];
        }

        const addonId = wrapper.dataset.addonId;
        const def = webexpress.webui.EditorAddOns.get(addonId);
        const hasProps = def && def.properties && def.properties.length > 0;

        const items = [];

        if (hasProps) {
            items.push({
                label: "Properties...",
                icon: "cog",
                action: () => {
                    this._openSettingsForNode(editor, wrapper);
                }
            });
        }

        items.push({
            label: "Remove",
            icon: "trash",
            action: () => {
                editor.removeNode(wrapper);
                if (editor._syncValue) {
                    editor._syncValue();
                }
            }
        });

        return items;
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
        this._propModal.setAttribute("data-close-label", "Cancel");
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
     * @param {Range | null} activeRange -The explicitly saved text range for new insertions.
     */
    _openPropertyDialog: function(addonDef, activeRange) {
        if (!this._propModalCtrl) {
            this._createPropertyModal();
        }

        if (activeRange) {
            this._backupRange = activeRange.cloneRange();
        }

        if (this._propModalCtrl && typeof this._propModalCtrl.update === "function") {
            this._propModalCtrl.update();
        }

        const formContainer = this._propModal.querySelector(".modal-body") || this._propModal.querySelector(".wx-modal-content");
        if (!formContainer) {
            return;
        }

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

            const input = document.createElement("input");
            input.className = prop.type === "color" ? "form-control form-control-color" : "form-control";
            input.type = prop.type || "text";
            input.dataset.propName = prop.name;
            input.value = values[prop.name] || prop.default || "";

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            formContainer.appendChild(wrapper);
        });

        this._propModal.dataset.addonId = addonDef.id;

        if (this._propModalCtrl && typeof this._propModalCtrl.show === "function") {
            this._propModalCtrl.show();
        }
    },

    /**
     * Saves properties from the dialog and updates or inserts the add-on.
     */
    _handlePropertySave: function() {
        const addonId = this._propModal.dataset.addonId;
        const addonDef = webexpress.webui.EditorAddOns.get(addonId);
        const inputs = this._propModal.querySelectorAll("input");
        const data = {};

        inputs.forEach(input => {
            data[input.dataset.propName] = input.value;
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
        const content = addon.isContainer ? webexpress.webui.EditorHtml.read(typeof addon.renderer === "function" ? addon.renderer(data) : addon.content || "").state.doc.children : [];
        const node = Model.node("addon", content, { name: addon.id, data: data || {}, inline: addon.type === "inline", container: !!addon.isContainer });
        editor.dispatch({ type: "insertNodes", nodes: [node] });
        if (addon.isContainer) { const entry = Model.find(editor._state.doc, node.id); if (entry) editor.selection = { anchor: entry.start, focus: entry.start }; }
    },





    /**
     * Serializes property values as data attributes for the add-on frame so
     * the configuration survives persistence independently of the widget
     * markup, which a control may replace at runtime.
     * @param {object} addonDef -Add-on definition.
     * @param {object} data -Configuration data.
     * @returns {string} The attribute string (with a leading space) or "".
     */
    _propertyDataAttributes: function(addonDef, data) {
        const parts = [];
        (addonDef.properties || []).forEach((prop) => {
            const value = data && data[prop.name] != null ? String(data[prop.name]) : "";
            if (value === "") {
                return;
            }
            const escaped = value
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;");
            parts.push(`${this._propertyAttributeName(prop.name)}="${escaped}"`);
        });
        return parts.length ? " " + parts.join(" ") : "";
    },

    /**
     * Generates the HTML wrapper (Frame) for an add-on.
     * @param {object} addonDef -Add-on definition.
     * @param {string} contentHtml -Inner HTML content.
     * @param {object} [data] -Configuration data persisted on the frame.
     * @returns {string} HTML string of the wrapped add-on.
     */
    _createFrameHtml: function(addonDef, contentHtml, data) {
        const isContainer = !!addonDef.isContainer;
        const hasProps = addonDef.properties && addonDef.properties.length > 0;
        const type = addonDef.type || "block";
        const dataAttrs = this._propertyDataAttributes(addonDef, data);

        if (type === "inline") {
            return `
                <span class="wx-addon-inline-frame"
                      contenteditable="false"
                      draggable="true"
                      data-addon-id="${addonDef.id}"${dataAttrs}
                      title="${addonDef.label}">
                    ${contentHtml}
                </span>`;
        } else {
            const settingsBtn = hasProps
                ? `<span class="wx-addon-settings-btn" title="Settings"><i class="${webexpress.webui.IconSet.resolve("cog")}"></i></span>`
                : "";

            const dragHandle = `<span class="wx-addon-drag-handle"><i class="${webexpress.webui.IconSet.resolve("grip-lines-vertical")}"></i></span>`;

            const bodyEditable = isContainer ? "true" : "false";
            const bodyClass = isContainer ? "wx-addon-body-container" : "wx-addon-body-widget";
            // marker so _insertAddon can drop the caret inside a freshly
            // inserted editable container body
            const focusAttr = isContainer ? ' data-wx-focus-new="1"' : "";

            return `
                <div class="wx-addon-frame card my-3 shadow-sm"
                     contenteditable="false"
                     draggable="false"
                     data-addon-id="${addonDef.id}"${dataAttrs}>

                    <div class="card-header py-1 px-2 d-flex justify-content-between align-items-center">
                        <div class="small text-muted fw-bold d-flex align-items-center">
                            ${dragHandle}
                            <i class="${webexpress.webui.IconSet.resolve(addonDef.icon)} me-2"></i>
                            <span>${addonDef.label}</span>
                        </div>
                        <div>${settingsBtn}</div>
                    </div>

                    <div class="card-body p-2 ${bodyClass}"
                         contenteditable="${bodyEditable}"${focusAttr}>
                        ${contentHtml}
                    </div>
                </div><p><br></p>`;
        }
    },

    /**
     * Calculates the caret range from a mouse event (Cross-browser).
     * @param {MouseEvent} e -Mouse event.
     * @returns {Range | null} The calculated range.
     */
    _getRangeFromEvent: function(e) {
        if (document.caretRangeFromPoint) {
            return document.caretRangeFromPoint(e.clientX, e.clientY);
        } else if (document.caretPositionFromPoint) {
            const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
            if (pos) {
                const range = document.createRange();
                range.setStart(pos.offsetNode, pos.offset);
                range.collapse(true);
                return range;
            }
        }
        return null;
    },

    /**
     * Moves the drop marker to the current drop position.
     * @param {Range} range -The current drop range.
     */
    _updateDropMarker: function(range) {
        if (!this._dropMarker) {
            this._dropMarker = document.createElement("span");
            this._dropMarker.className = "wx-drop-marker";
        }
        try {
            range.insertNode(this._dropMarker);
        } catch (err) {
            // ignore range errors
        }
    },

    /**
     * Removes the drop marker from the DOM.
     */
    _removeDropMarker: function() {
        if (this._dropMarker && this._dropMarker.parentNode) {
            this._dropMarker.parentNode.removeChild(this._dropMarker);
        }
    }
});