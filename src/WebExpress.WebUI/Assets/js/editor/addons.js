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
     * 
     * @param {Event} e - The event object.
     * @returns {HTMLElement|null} The target element.
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
     * 
     * @param {object} editor - The editor instance.
     * @returns {void}
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
     * 
     * @param {HTMLElement} editorElem - The content editable element.
     * @param {object} editor - The editor instance.
     * @returns {void}
     */
    _initDragEvents: function(editorElem, editor) {
        // toggle draggable attribute on mousedown
        editorElem.addEventListener("mousedown", (e) => {
            const target = this._getSafeTarget(e);
            if (!target) {
                return;
            }

            const frame = target.closest(".wx-addon-frame");
            if (!frame) {
                return;
            }

            // enable drag only if header or drag handle is clicked
            if (target.closest(".wx-addon-header") || target.closest(".wx-addon-drag-handle")) {
                // ignore if clicking settings button
                if (!target.closest(".wx-addon-settings-btn")) {
                    frame.setAttribute("draggable", "true");
                }
            } else {
                // disable drag for content area to allow text selection
                frame.setAttribute("draggable", "false");
            }
        });

        // reset draggable attribute on mouseup
        editorElem.addEventListener("mouseup", (e) => {
            const target = this._getSafeTarget(e);
            if (target) {
                const frame = target.closest(".wx-addon-frame");
                if (frame) {
                    frame.setAttribute("draggable", "false");
                }
            }
        });

        // handle drag start
        editorElem.addEventListener("dragstart", (e) => {
            const target = this._getSafeTarget(e);
            if (!target) {
                return;
            }

            const frame = target.closest("[data-addon-id]");
            // only allow drag if explicitly enabled
            if (frame && frame.getAttribute("draggable") === "true") {
                this._draggedNode = frame;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/html", frame.outerHTML);
                // visual feedback
                setTimeout(() => {
                    frame.style.opacity = "0.4";
                }, 0);
            } else {
                e.preventDefault();
            }
        });

        // handle drag end
        editorElem.addEventListener("dragend", (e) => {
            if (this._draggedNode) {
                this._draggedNode.style.opacity = "";
                this._draggedNode.setAttribute("draggable", "false");
            }
            this._draggedNode = null;
            this._removeDropMarker();
        });

        // handle drag over (visualize drop target)
        editorElem.addEventListener("dragover", (e) => {
            if (this._draggedNode) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                
                const range = this._getRangeFromEvent(e);
                if (range) {
                    // prevent dropping inside itself
                    if (this._draggedNode.contains(range.startContainer)) {
                        this._removeDropMarker();
                        return;
                    }
                    this._updateDropMarker(range);
                }
            }
        });

        // handle drag leave
        editorElem.addEventListener("dragleave", (e) => {
            const rect = editorElem.getBoundingClientRect();
            // only remove marker if leaving the editor area completely
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
                 this._removeDropMarker();
            }
        });

        // handle drop event
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

                    // move the node
                    range.insertNode(this._draggedNode);
                    
                    // reset style
                    this._draggedNode.style.opacity = "";
                    this._draggedNode.setAttribute("draggable", "false");
                    
                    // sync editor value
                    if (editor._syncValue) {
                        editor._syncValue();
                    }
                    
                    // restore caret position after inserted element
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
     * 
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The button group element.
     */
    createToolbar: function(editor) {
        const group = document.createElement("div");
        group.className = "wx-editor-btn-group";

        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.type = "button";
        btn.title = "Insert AddOn";
        btn.innerHTML = '<i class="fas fa-puzzle-piece"></i>';
        
        // save selection firmly before focus shifts away from the editor
        btn.addEventListener("mousedown", (e) => {
            e.preventDefault(); // prevent losing focus
            if (typeof editor._saveCurrentSelection === "function") {
                editor._saveCurrentSelection();
            }
        });

        btn.addEventListener("click", () => {
            let activeRange = null;
            if (editor._savedRange) {
                activeRange = editor._savedRange.cloneRange();
            }

            this._currentEditor = editor;
            this._activeAddonNode = null; // reset selection for new insert
            this._openModal(editor, "_selectionModal", "editor-addon", "AddOn Library", activeRange);
        });

        group.appendChild(btn);
        return group;
    },

    /**
     * Opens a modal and provides the editor context to the modal controller.
     * Creates the modal on first use to prevent redundant logic.
     *
     * @param {object} editor - The editor instance.
     * @param {string} modalProperty - The property name where the modal wrapper is stored.
     * @param {string} key - Registry key or identifier for the modal.
     * @param {string} title - The title to display in the modal header.
     * @param {Range|null} activeRange - The actively saved text range before focus loss.
     * @returns {void}
     */
    _openModal: function(editor, modalProperty, key, title, activeRange) {
        if (!this[modalProperty]) {
            this[modalProperty] = this._createModal(key, title);
        } else {
            // dynamically update the title for existing modals
            const titleElement = this[modalProperty].element.querySelector(".modal-title");
            if (titleElement) {
                titleElement.textContent = title;
            }
        }

        if (this[modalProperty] && this[modalProperty].ctrl) {
            const ctrl = this[modalProperty].ctrl;
            
            // provide editor reference to the modal controller
            ctrl._editor = editor;
            
            // securely store the explicit cursor position
            ctrl._backupRange = activeRange || null;

            // show modal via controller api if available
            if (typeof ctrl.show === "function") {
                ctrl.show();
            }
        }
    },

    /**
     * Creates a minimal ModalSidebarPanel instance and returns a wrapper object.
     * 
     * @param {string} key - Registry key or identifier used by dialog panels.
     * @param {string} title - Modal header title.
     * @returns {{ element: HTMLElement, ctrl: object }} Wrapper containing element and controller.
     */
    _createModal: function(key, title) {
        const id = "wx-msp-" + key + "-" + Date.now();
        const el = document.createElement("div");
        el.id = id;
        el.setAttribute("data-size", "modal-xl");
        el.setAttribute("data-key", key);
        el.setAttribute("aria-hidden", "true");

        // build minimal modal shell securely with static html
        el.innerHTML = `
            <div class="wx-modal-header">
                <h5 class="modal-title"></h5>
            </div>
            <div class="wx-modal-content p-0"></div>
            <div class="wx-modal-footer">
                <button class="btn btn-primary submit-btn" disabled>Insert</button>
            </div>`;

        const titleElement = el.querySelector(".modal-title");
        if (titleElement) {
            titleElement.textContent = title;
        }

        document.body.appendChild(el);
        const ctrl = new webexpress.webui.ModalSidebarPanel(el);

        return { element: el, ctrl: ctrl };
    },

    /**
     * Opens the property editor for a specific node (edit mode) or new add-on (insert mode).
     * 
     * @param {object} editor - Editor instance.
     * @param {HTMLElement} node - Existing add-on node (optional).
     * @returns {void}
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
     * 
     * @param {object} editor - Editor instance.
     * @param {HTMLElement} target - Click target.
     * @returns {Array} List of menu items.
     */
    getContextMenuItems: function(editor, target) {
        let element = target;
        if (element.nodeType === 3) {
            element = element.parentNode;
        }
        
        const wrapper = element.closest('[data-addon-id]');
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
     * 
     * @returns {void}
     */
    _createPropertyModal: function() {
        if (this._propModalCtrl) {
            return; // already initialized
        }

        // create host element
        // wichtig: "wx-webui-modal" entfernt, damit der globale controller nicht automatisch eingreift!
        this._propModal = document.createElement("div"); 
        this._propModal.className = "wx-prop-modal"; 
        
        // set attributes
        this._propModal.setAttribute("data-close-label", "Cancel");
        this._propModal.setAttribute("data-wx-fullscreen", "false");

        // create structure
        
        // header
        const headerSpan = document.createElement("span");
        headerSpan.className = "wx-modal-header";
        headerSpan.textContent = "Properties";
        this._propModal.appendChild(headerSpan);

        // body
        this._propBody = document.createElement("div");
        this._propBody.className = "wx-modal-content";
        this._propModal.appendChild(this._propBody);

        // footer
        const footerDiv = document.createElement("div");
        footerDiv.className = "wx-modal-footer";

        // save button
        const saveBtn = document.createElement("button");
        saveBtn.className = "btn btn-primary save-prop";
        saveBtn.type = "button";
        saveBtn.innerHTML = "Apply";
        saveBtn.addEventListener("click", () => this._handlePropertySave());
        
        footerDiv.appendChild(saveBtn);
        this._propModal.appendChild(footerDiv);

        // append to document
        document.body.appendChild(this._propModal);

        // initialize controller (manually only)
        this._propModalCtrl = new webexpress.webui.ModalCtrl(this._propModal);
    },

    /**
     * Opens the property dialog and fills it with form fields based on definition.
     * 
     * @param {object} addonDef - Add-on definition.
     * @param {Range|null} activeRange - The explicitly saved text range for new insertions.
     * @returns {void}
     */
    _openPropertyDialog: function(addonDef, activeRange) {
        if (!this._propModal) {
            this._createPropertyModal();
        }
        
        // securely backup range if passed
        if (activeRange) {
            this._backupRange = activeRange;
        }

        const formContainer = this._propModal.querySelector(".modal-body");
        formContainer.innerHTML = ""; 
        
        const values = {};

        // if editing existing, read current values from dom
        if (this._activeAddonNode) {
            let widget = null;
            if (addonDef.type === 'inline') {
                 widget = this._activeAddonNode.firstElementChild || this._activeAddonNode; 
            } else {
                 const body = this._activeAddonNode.querySelector('.card-body');
                 if (body) {
                     widget = body.firstElementChild;
                 }
            }

            if (widget) {
                addonDef.properties.forEach(prop => {
                    const attr = "data-" + prop.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                    if (widget.hasAttribute(attr)) {
                        values[prop.name] = widget.getAttribute(attr);
                    } else if (this._activeAddonNode.hasAttribute(attr)) {
                        values[prop.name] = this._activeAddonNode.getAttribute(attr);
                    }
                });
            }
        }

        // build form
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
        this._propModal.style.display = "block";
        this._propModal.classList.add("show");
        document.body.classList.add("modal-open");
        this._ensureBackdrop();
    },

    /**
     * Saves properties from the dialog and updates or inserts the add-on.
     * 
     * @returns {void}
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

        this._propModal.style.display = "none";
        this._propModal.classList.remove("show");
        this._removeBackdrop();
    },

    /**
     * Inserts a new add-on into the editor.
     * 
     * @param {object} addon - Add-on definition.
     * @param {object} data - Configuration data.
     * @returns {void}
     */
    _insertAddon: function(addon, data) {
        if (!this._currentEditor) {
            return;
        }

        // enforce restoration of the explicitly backed up range to ensure exact selection replacement
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
     * 
     * @param {HTMLElement} frameNode - The wrapper element.
     * @param {object} def - Add-on definition.
     * @param {object} data - New configuration data.
     * @returns {void}
     */
    _updateAddonNode: function(frameNode, def, data) {
        let widget = null;
        if (def.type === 'inline') {
            // re-render for inline
            if (typeof def.renderer === "function") {
                frameNode.innerHTML = def.renderer(data);
            } else {
                frameNode.innerHTML = def.content;
            }
            widget = frameNode.firstElementChild; 
        } else {
            // update widget inside block
            const body = frameNode.querySelector('.card-body');
            if (body) {
                widget = body.firstElementChild;
            }
        }

        if (widget) {
            // update controller instance if available 
            const ctrl = webexpress.webui.Controller.getInstanceByElement(widget);
            if (ctrl && typeof ctrl.updateSettings === "function") {
                // pass props individually or as object depending on impl
                if (data.cellSize && data.color) {
                    ctrl.updateSettings(data.cellSize, data.color);
                }
            }
            // persist attributes
            Object.keys(data).forEach(key => {
                const attr = "data-" + key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                widget.setAttribute(attr, data[key]);
            });
        }
    },

    /**
     * Generates the HTML wrapper (Frame) for an add-on.
     * 
     * @param {object} addonDef - Add-on definition.
     * @param {string} contentHtml - Inner HTML content.
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
                : '';
            
            const dragHandle = `<span class="wx-addon-drag-handle"><i class="fas fa-grip-vertical"></i></span>`;
            
            const bodyEditable = isContainer ? 'true' : 'false';
            const bodyClass = isContainer ? 'wx-addon-body-container' : 'wx-addon-body-widget';

            return `
                <div class="wx-addon-frame card my-3 shadow-sm" 
                     contenteditable="false" 
                     draggable="false"
                     data-addon-id="${addonDef.id}">
                    
                    <div class="card-header wx-addon-header py-1 px-2 d-flex justify-content-between align-items-center">
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
     * Removes the modal backdrop if no modals are open.
     * 
     * @returns {void}
     */
    _removeBackdrop: function() {
        if ((!this._selectionModal || this._selectionModal._element.style.display === "none") && 
            (!this._propModal || this._propModal.style.display === "none")) {
            document.body.classList.remove("modal-open");
            const bd = document.querySelector(".modal-backdrop");
            if (bd) {
                bd.remove();
            }
        }
    },
    
    /**
     * Ensures a modal backdrop exists.
     * 
     * @returns {void}
     */
    _ensureBackdrop: function() {
        if (!document.querySelector(".modal-backdrop")) {
            const bd = document.createElement("div");
            bd.className = "modal-backdrop fade show";
            document.body.appendChild(bd);
        }
    },
    
    /**
     * Calculates the caret range from a mouse event (Cross-browser).
     * 
     * @param {MouseEvent} e - Mouse event.
     * @returns {Range|null} The calculated range.
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
     * 
     * @param {Range} range - The current drop range.
     * @returns {void}
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
     * 
     * @returns {void}
     */
    _removeDropMarker: function() {
        if (this._dropMarker && this._dropMarker.parentNode) {
            this._dropMarker.parentNode.removeChild(this._dropMarker);
        }
    }
});