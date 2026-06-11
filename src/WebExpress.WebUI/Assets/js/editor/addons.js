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
     * Handles the Enter key inside an editable add-on body so the line break is
     * created within the add-on instead of escaping to the end of the document.
     * @param {object} editor - The editor instance.
     * @param {KeyboardEvent} e - The keydown event.
     */
    _handleBodyEnter: function(editor, e) {
        if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) {
            return;
        }
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) {
            return;
        }
        let el = sel.anchorNode;
        if (el && el.nodeType === 3) {
            el = el.parentElement;
        }
        const body = el && el.closest ? el.closest(".wx-addon-body-container") : null;
        if (!body || !editor.getEditorElement().contains(body)) {
            return; // not inside an add-on body -> native behaviour
        }
        // only editable container bodies; the table frame reuses the same class
        // but is contenteditable="false" (its table handles Enter natively)
        if (body.getAttribute("contenteditable") !== "true") {
            return;
        }
        // tables inside a container keep their native cell behaviour
        if (el.closest("table") && body.contains(el.closest("table"))) {
            return;
        }

        e.preventDefault();

        const range = sel.getRangeAt(0);
        range.deleteContents();

        let startEl = range.startContainer;
        if (startEl.nodeType === 3) {
            startEl = startEl.parentElement;
        }
        const block = startEl && startEl.closest
            ? startEl.closest("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre")
            : null;

        if (block && body.contains(block) && block !== body) {
            this._splitBlock(block, range, sel);
        } else {
            this._insertBreak(range, sel);
        }

        if (typeof editor._syncValue === "function") {
            editor._syncValue();
        }
        if (typeof editor._updateUndoRedoStates === "function") {
            editor._updateUndoRedoStates();
        }
    },

    /**
     * Splits a block element at the caret, moving the trailing content into a
     * new sibling block of the same type and placing the caret at its start.
     * @param {HTMLElement} block - The block to split.
     * @param {Range} range - The collapsed caret range.
     * @param {Selection} sel - The current selection.
     */
    _splitBlock: function(block, range, sel) {
        const tail = document.createRange();
        tail.setStart(range.startContainer, range.startOffset);
        tail.setEnd(block, block.childNodes.length);
        const frag = tail.extractContents();

        const newBlock = document.createElement(block.tagName);
        const style = block.getAttribute("style");
        if (style) {
            newBlock.setAttribute("style", style);
        }
        if (!frag.childNodes.length || ((frag.textContent || "").trim() === "" && !frag.querySelector("br, img"))) {
            newBlock.innerHTML = "<br>";
        } else {
            newBlock.appendChild(frag);
        }

        if ((block.textContent || "").trim() === "" && !block.querySelector("br, img")) {
            block.innerHTML = "<br>";
        }

        block.parentNode.insertBefore(newBlock, block.nextSibling);

        const r = document.createRange();
        r.setStart(newBlock, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
    },

    /**
     * Inserts a line break at the caret, adding a filler break when needed so
     * the caret can move to the new visual line.
     * @param {Range} range - The collapsed caret range.
     * @param {Selection} sel - The current selection.
     */
    _insertBreak: function(range, sel) {
        const br = document.createElement("br");
        range.insertNode(br);

        const next = br.nextSibling;
        const needsFiller = !next || (next.nodeType === 3 && next.textContent === "");
        if (needsFiller) {
            const filler = document.createElement("br");
            br.parentNode.insertBefore(filler, br.nextSibling);
        }

        const r = document.createRange();
        r.setStartAfter(br);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
    },

    /**
     * Brings persisted add-ons back to life after the content has been loaded
     * or programmatically replaced. Instantiating a control consumes its
     * marker class and replaces the widget markup with runtime DOM (e.g. the
     * Game of Life canvas), so persisted content only carries a dead shell.
     * Re-rendering the widget body from the definition restores the marker
     * class, which lets the controller instantiate the control again.
     * Containers (user content) and purely static add-ons are left untouched.
     * @param {object} editor -The editor instance.
     */
    onContentChange: function(editor) {
        const root = editor.getEditorElement();
        if (!root) {
            return;
        }

        root.querySelectorAll("[data-addon-id]").forEach((frame) => {
            const def = webexpress.webui.EditorAddOns.get(frame.getAttribute("data-addon-id") || "");
            if (!def || def.isContainer) {
                return; // container bodies carry user content and must survive
            }

            const host = (def.type || "block") === "inline"
                ? frame
                : frame.querySelector(".card-body");
            if (!host) {
                return;
            }

            const data = this._readAddonData(def, frame, host.firstElementChild);
            const html = typeof def.renderer === "function" ? def.renderer(data) : (def.content || "");
            if (!this._containsRegisteredControl(html)) {
                return; // static content persists on its own
            }
            if (this._hasLiveControl(host)) {
                return; // already instantiated or about to be picked up
            }

            host.innerHTML = html;
        });
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
     * Returns whether the rendered add-on markup contains the marker class of
     * a registered control, i.e. whether the add-on hosts a JS control that
     * needs instantiation (in contrast to purely static markup).
     * @param {string} html -The freshly rendered add-on markup.
     * @returns {boolean}
     */
    _containsRegisteredControl: function(html) {
        const registry = webexpress.webui.Controller.classRegistry;
        if (!registry) {
            return false;
        }
        for (const selector of registry.keys()) {
            const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            if (new RegExp("(^|[^-\\w])" + escaped + "($|[^-\\w])").test(html)) {
                return true;
            }
        }
        return false;
    },

    /**
     * Returns whether the add-on body still hosts a living control: either an
     * element with a registered instance, or one that still carries a marker
     * class and is therefore about to be instantiated by the observer.
     * @param {HTMLElement} host -The add-on body element.
     * @returns {boolean}
     */
    _hasLiveControl: function(host) {
        const controller = webexpress.webui.Controller;
        const elements = [host, ...host.querySelectorAll("*")];
        return elements.some((el) => {
            if (controller.instanceMap && controller.instanceMap.has(el)) {
                return true;
            }
            if (!el.classList || !controller.classRegistry) {
                return false;
            }
            for (const selector of controller.classRegistry.keys()) {
                if (el.classList.contains(selector)) {
                    return true;
                }
            }
            return false;
        });
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

        // keep Enter inside an editable add-on body (a contenteditable="true"
        // island nested in the contenteditable="false" frame). Native Enter
        // there tends to escape the island and land at the document end.
        editorElem.addEventListener("keydown", (e) => this._handleBodyEnter(editor, e));

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

            // never start an element drag from inside a table - the user is
            // selecting cell text - regardless of where exactly the press lands
            if (target.closest("table")) {
                frame.setAttribute("draggable", "false");
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
        btn.innerHTML = `<i class="${webexpress.webui.IconTheme.resolveFa("fas fa-puzzle-piece")}"></i>`;

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

        const frameHtml = this._createFrameHtml(addon, innerHtml, data);
        this._currentEditor.insertHtmlAtCursor(frameHtml);

        // drop the caret inside the new container body so the first edit happens
        // inside the add-on, not in the document after it
        if (addon.isContainer) {
            this._focusNewContainerBody(this._currentEditor);
        }
    },

    /**
     * Places the caret inside a freshly inserted editable container body
     * (marked with data-wx-focus-new) and clears the marker.
     * @param {object} editor - The editor instance.
     */
    _focusNewContainerBody: function(editor) {
        const root = editor.getEditorElement();
        if (!root) {
            return;
        }
        const body = root.querySelector('[data-wx-focus-new="1"]');
        if (!body) {
            return;
        }
        body.removeAttribute("data-wx-focus-new");

        const target = body.querySelector("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, div") || body;
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        if (typeof editor._saveCurrentSelection === "function") {
            editor._saveCurrentSelection();
        }
        if (typeof editor._syncValue === "function") {
            editor._syncValue();
        }
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
                const attr = this._propertyAttributeName(key);
                widget.setAttribute(attr, data[key]);
            });
        }

        // mirror the values onto the frame: it survives even when a control
        // replaces the widget markup at runtime, so rehydration after a
        // reload can re-render the add-on with the persisted configuration
        Object.keys(data).forEach(key => {
            frameNode.setAttribute(this._propertyAttributeName(key), data[key]);
        });
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
                ? `<span class="wx-addon-settings-btn" title="Settings"><i class="${webexpress.webui.IconTheme.resolveFa("fas fa-cog")}"></i></span>`
                : "";

            const dragHandle = `<span class="wx-addon-drag-handle"><i class="${webexpress.webui.IconTheme.resolveFa("fas fa-grip-vertical")}"></i></span>`;

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
                            <i class="${webexpress.webui.IconTheme.resolveFa(addonDef.icon)} me-2"></i>
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