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
     * Initializes the plugin.
     * Sets up event listeners for interactions (click, drag & drop) within the editor content.
     * @param {object} editor -The editor instance.
     */
    init: function(editor) {
        // expose plugin to the editor so external pages can call property dialogs
        editor._addonPlugin = this;

        const editorElem = editor.getEditorElement();

        // handle clicks on settings buttons inside add-on frames
        editorElem.addEventListener("click", (e) => {
            const target = this._getSafeTarget(e);
            if (!target) {
                return;
            }

            const btn = target.closest(".wx-addon-settings-btn");
            if (btn) {
                const frame = btn.closest("[data-addon-id]");
                if (frame) {
                    this._openSettingsForNode(editor, frame);
                }
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // initialize drag and drop behavior
        this._initDragEvents(editorElem, editor);
    },

    /**
     * Initializes drag and drop event listeners on the editor element.
     * Manages the draggable state of frames to allow text selection vs. moving.
     * @param {HTMLElement} editorElem -The content editable element.
     * @param {object} editor -The editor instance.
     */
    _initDragEvents: function(editorElem, editor) {
        editorElem.addEventListener("mousedown", (e) => {
            const target = this._getSafeTarget(e);
            if (!target) {
                return;
            }

            const frame = target.closest(".wx-addon-frame");
            if (!frame) {
                return;
            }

            if (target.closest(".wx-addon-header") || target.closest(".wx-addon-drag-handle")) {
                if (!target.closest(".wx-addon-settings-btn")) {
                    frame.setAttribute("draggable", "true");
                }
            } else {
                frame.setAttribute("draggable", "false");
            }
        });

        editorElem.addEventListener("mouseup", (e) => {
            const target = this._getSafeTarget(e);
            if (target) {
                const frame = target.closest(".wx-addon-frame");
                if (frame) {
                    frame.setAttribute("draggable", "false");
                }
            }
        });

        editorElem.addEventListener("dragstart", (e) => {
            const target = this._getSafeTarget(e);
            if (!target) {
                return;
            }

            const frame = target.closest("[data-addon-id]");
            if (frame && frame.getAttribute("draggable") === "true") {
                this._draggedNode = frame;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/html", frame.outerHTML);
                setTimeout(() => {
                    frame.style.opacity = "0.4";
                }, 0);
            } else {
                e.preventDefault();
            }
        });

        editorElem.addEventListener("dragend", () => {
            if (this._draggedNode) {
                this._draggedNode.style.opacity = "";
                this._draggedNode.setAttribute("draggable", "false");
            }
            this._draggedNode = null;
            this._removeDropMarker();
        });

        editorElem.addEventListener("dragover", (e) => {
            if (this._draggedNode) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";

                const range = this._getRangeFromEvent(e);
                if (range) {
                    if (this._draggedNode.contains(range.startContainer)) {
                        this._removeDropMarker();
                        return;
                    }
                    this._updateDropMarker(range);
                }
            }
        });

        editorElem.addEventListener("dragleave", (e) => {
            const rect = editorElem.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
                this._removeDropMarker();
            }
        });

        editorElem.addEventListener("drop", (e) => {
            if (this._draggedNode) {
                e.preventDefault();
                e.stopPropagation();
                this._removeDropMarker();

                const range = this._getRangeFromEvent(e);
                if (range) {
                    if (this._draggedNode.contains(range.startContainer)) {
                        return;
                    }

                    range.insertNode(this._draggedNode);

                    this._draggedNode.style.opacity = "";
                    this._draggedNode.setAttribute("draggable", "false");

                    if (editor._syncValue) {
                        editor._syncValue();
                    }

                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    const newRange = document.createRange();
                    newRange.setStartAfter(this._draggedNode);
                    newRange.collapse(true);
                    sel.addRange(newRange);
                }
                this._draggedNode = null;
            }
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
        btn.innerHTML = '<i class="fas fa-puzzle-piece"></i>';

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
     * Creates a minimal ModalSidebarPanel instance and returns a wrapper object.
     * @param {string} key -Registry key or identifier used by dialog panels.
     * @param {string} title -Modal header title.
     * @returns {{ element: HTMLElement, ctrl: object }} Wrapper containing element and controller.
     */
    _createModal: function(key, title) {
        const id = "wx-msp-" + key + "-" + Date.now();
        const el = document.createElement("div");
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
        const ctrl = new webexpress.webui.ModalSidebarPanel(el);

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
                icon: "fas fa-cog",
                action: () => {
                    this._openSettingsForNode(editor, wrapper);
                }
            });
        }

        items.push({
            label: "Remove",
            icon: "fas fa-trash-alt",
            action: () => {
                wrapper.remove();
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

        this._propModal = document.createElement("div");
        this._propModal.className = "wx-prop-modal";
        this._propModal.setAttribute("data-close-label", "Cancel");
        this._propModal.setAttribute("data-size", "modal-lg");

        const headerDiv = document.createElement("div");
        headerDiv.className = "wx-modal-header";
        headerDiv.textContent = "Properties";
        this._propModal.appendChild(headerDiv);

        this._propBody = document.createElement("div");
        this._propBody.className = "wx-modal-content";
        this._propModal.appendChild(this._propBody);

        const footerDiv = document.createElement("div");
        footerDiv.className = "wx-modal-footer";

        const insertBtn = document.createElement("button");
        insertBtn.className = "btn btn-primary save-prop";
        insertBtn.type = "button";
        insertBtn.textContent = "Insert";
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
            this._updateAddonNode(this._activeAddonNode, addonDef, data);
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
        if (!this._currentEditor) {
            return;
        }

        if (this._backupRange) {
            this._currentEditor._savedRange = this._backupRange.cloneRange();
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(this._backupRange);
            }
        } else if (typeof this._currentEditor.restoreSavedRange === "function") {
            this._currentEditor.restoreSavedRange();
        }

        let innerHtml = "";
        if (typeof addon.renderer === "function") {
            innerHtml = addon.renderer(data);
        } else {
            innerHtml = addon.content;
        }

        const frameHtml = this._createFrameHtml(addon, innerHtml);
        this._currentEditor.insertHtmlAtCursor(frameHtml);
    },

    /**
     * Updates an existing add-on node with new data.
     * @param {HTMLElement} frameNode -The wrapper element.
     * @param {object} def -Add-on definition.
     * @param {object} data -New configuration data.
     */
    _updateAddonNode: function(frameNode, def, data) {
        let widget = null;
        if (def.type === "inline") {
            if (typeof def.renderer === "function") {
                frameNode.innerHTML = def.renderer(data);
            } else {
                frameNode.innerHTML = def.content;
            }
            widget = frameNode.firstElementChild;
        } else {
            const body = frameNode.querySelector(".card-body");
            if (body) {
                widget = body.firstElementChild;
            }
        }

        if (widget) {
            const ctrl = webexpress.webui.Controller.getInstanceByElement(widget);
            if (ctrl && typeof ctrl.updateSettings === "function") {
                if (data.cellSize && data.color) {
                    ctrl.updateSettings(data.cellSize, data.color);
                }
            }

            Object.keys(data).forEach(key => {
                const attr = "data-" + key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
                widget.setAttribute(attr, data[key]);
            });
        }
    },

    /**
     * Generates the HTML wrapper (Frame) for an add-on.
     * @param {object} addonDef -Add-on definition.
     * @param {string} contentHtml -Inner HTML content.
     * @returns {string} HTML string of the wrapped add-on.
     */
    _createFrameHtml: function(addonDef, contentHtml) {
        const isContainer = !!addonDef.isContainer;
        const hasProps = addonDef.properties && addonDef.properties.length > 0;
        const type = addonDef.type || "block";

        if (type === "inline") {
            return `
                <span class="wx-addon-inline-frame" 
                      contenteditable="false" 
                      draggable="true" 
                      data-addon-id="${addonDef.id}"
                      title="${addonDef.label}">
                    ${contentHtml}
                </span>`;
        } else {
            const settingsBtn = hasProps
                ? `<span class="wx-addon-settings-btn" title="Settings"><i class="fas fa-cog"></i></span>`
                : "";

            const dragHandle = `<span class="wx-addon-drag-handle"><i class="fas fa-grip-vertical"></i></span>`;

            const bodyEditable = isContainer ? "true" : "false";
            const bodyClass = isContainer ? "wx-addon-body-container" : "wx-addon-body-widget";

            return `
                <div class="wx-addon-frame card my-3 shadow-sm" 
                     contenteditable="false" 
                     draggable="false"
                     data-addon-id="${addonDef.id}">
                    
                    <div class="card-header py-1 px-2 d-flex justify-content-between align-items-center">
                        <div class="small text-muted fw-bold d-flex align-items-center">
                            ${dragHandle}
                            <i class="${addonDef.icon} me-2"></i> 
                            <span>${addonDef.label}</span>
                        </div>
                        <div>${settingsBtn}</div>
                    </div>
                    
                    <div class="card-body p-2 ${bodyClass}" 
                         contenteditable="${bodyEditable}">
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