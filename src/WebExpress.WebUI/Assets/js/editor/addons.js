/**
 * Plugin for inserting and managing add-ons.
 * Provides a categorized selection modal (ModalSidebarPanel), real-time search,
 * drag-and-drop placement within the editor, and a property editor dialog.
 */
webexpress.webui.EditorPlugins.register("addons", 4000, {
    _selectionModal: null,
    _propModal: null,
    _currentEditor: null,
    _activeAddonNode: null,
    _draggedNode: null,
    _dropMarker: null, 

    /**
     * Helper to safely retrieve the target element from an event.
     * Handles text nodes by returning their parent element.
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
     * @param {object} editor - The editor instance.
     */
    init: function(editor) {
        const editorElem = editor.getEditorElement();
        
        // handle clicks on settings buttons inside add-on frames
        editorElem.addEventListener("click", (e) => {
            const target = this._getSafeTarget(e);
            if (!target) return;

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
     * @param {HTMLElement} editorElem - The content editable element.
     * @param {object} editor - The editor instance.
     */
    _initDragEvents: function(editorElem, editor) {
        // toggle draggable attribute on mousedown
        editorElem.addEventListener("mousedown", (e) => {
            const target = this._getSafeTarget(e);
            if (!target) return;

            const frame = target.closest(".wx-addon-frame");
            if (!frame) return;

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
            if (!target) return;

            const frame = target.closest("[data-addon-id]");
            // only allow drag if explicitly enabled
            if (frame && frame.getAttribute("draggable") === "true") {
                this._draggedNode = frame;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/html", frame.outerHTML);
                // visual feedback
                setTimeout(() => frame.style.opacity = "0.4", 0);
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
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The button group element.
     */
    createToolbar: function(editor) {
        const group = document.createElement("div");
        group.className = "wx-editor-btn-group";

        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.type = "button"
        btn.title = "Insert AddOn";
        btn.innerHTML = '<i class="fas fa-puzzle-piece"></i>';
        
        btn.addEventListener("click", () => {
            this._currentEditor = editor;
            this._activeAddonNode = null; // Reset selection for new insert
            this._openSelectionModal();
        });

        group.appendChild(btn);
        return group;
    },

    /**
     * Opens the add-on selection modal (ModalSidebarPanel).
     * Builds categories and injects search functionality.
     */
    _openSelectionModal: function() {
        // destroy old instance to ensure fresh data
        if (this._selectionModal) {
            const el = document.getElementById("wx-addon-selection-modal");
            if (el) el.remove();
            this._selectionModal = null;
        }

        // create host element
        const modalEl = document.createElement("div");
        modalEl.id = "wx-addon-selection-modal";
        modalEl.className = "modal fade modal-xl";
        modalEl.setAttribute("data-bs-backdrop", "static");
        modalEl.setAttribute("data-side-width", "250");
        
        // header
        const header = document.createElement("div");
        header.className = "wx-modal-header";
        header.innerHTML = `<h5 class="modal-title"><i class="fas fa-puzzle-piece"></i> AddOn Library</h5>`;
        modalEl.appendChild(header);

        // body (empty, filled by sidebarpanel logic)
        const body = document.createElement("div");
        body.className = "wx-modal-content p-0"; 
        modalEl.appendChild(body);

        // footer
        const footer = document.createElement("div");
        footer.className = "wx-modal-footer";

        this._insertBtn = document.createElement("button");
        this._insertBtn.className = "btn btn-primary ms-2";
        this._insertBtn.type = "button";
        this._insertBtn.textContent = "Insert";
        this._insertBtn.disabled = true;
        
        footer.appendChild(this._insertBtn);
        modalEl.appendChild(footer);

        // Bind Insert Action
        this._insertBtn.addEventListener("click", () => {
            this._handleFinalInsert(modalEl);
        });

        document.body.appendChild(modalEl);

        // instantiate modalsidebarpanel
        this._selectionModal = new webexpress.webui.ModalSidebarPanel(modalEl);

        const addons = webexpress.webui.EditorAddOns.getAll();
        const categories = {};
        
        // group by category
        addons.forEach(addon => {
            const cat = addon.category || "General";
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(addon);
        });

        // 1. add "all" category
        this._addCategoryPage(this._selectionModal, "all", "All AddOns", "fas fa-th", addons);

        // 2. add specific categories
        Object.keys(categories).sort().forEach(cat => {
            this._addCategoryPage(this._selectionModal, "cat-" + cat, cat, "fas fa-folder", categories[cat]);
        });

        // 3. inject search control
        // wait for modal shown event to ensure dom structure is ready
        modalEl.addEventListener("shown.bs.modal", () => {
            const mainPane = modalEl.querySelector(".wx-main-pane");
            // inject only if not present
            if (mainPane && !mainPane.querySelector(".wx-addon-search-container")) {
                const searchContainer = document.createElement("div");
                searchContainer.className = "wx-addon-search-container p-2 border-bottom bg-light";
                
                // create searchctrl
                const searchEl = document.createElement("div");
                searchEl.setAttribute("placeholder", "Search AddOns...");
                searchContainer.appendChild(searchEl);
                
                const searchCtrl = new webexpress.webui.SearchCtrl(searchEl);
                
                // search logic: filter tiles in the currently active pane
                document.addEventListener(webexpress.webui.Event.CHANGE_FILTER_EVENT, (e) => {
                    if (e.detail.sender === searchEl) {
                        const term = e.detail.value.toLowerCase();
                        this._filterVisibleTiles(modalEl, term);
                    }
                });

                mainPane.insertBefore(searchContainer, mainPane.firstChild);
            }
        });

        this._selectionModal.show();
    },

    /**
     * Adds a category page to the sidebar panel containing a tile list.
     * @param {object} panel - The ModalSidebarPanel instance.
     * @param {string} id - Page ID.
     * @param {string} title - Page Title.
     * @param {string} icon - Icon class.
     * @param {Array} addons - List of add-ons for this category.
     */
    _addCategoryPage: function(panel, id, title, icon, addons) {
        panel.addPage({
            id: id,
            title: title,
            iconClass: icon,
            render: (container) => {
                container.className = "p-3";
                container.style.height = "100%";
                container.style.overflowY = "auto";

                // tile container
                const tileHost = document.createElement("div");
                tileHost.className = "wx-addon-tile-list row g-2"; 
                tileHost.dataset.multiselect = "false";
                
                container.appendChild(tileHost);

                // create tile ctrl
                const tileCtrl = new webexpress.webui.InputTileCtrl(tileHost);
                
                // map data to tile format
                const tiles = addons.map(addon => ({
                    id: addon.id,
                    label: addon.label,
                    icon: addon.icon,
                    // hidden text for search + visible description
                    html: `<div class="d-none search-text">${addon.label} ${addon.description}</div>
                           <p class="small text-muted mb-0">${addon.description || ''}</p>`,
                    class: "col-md-6 mb-2"
                }));
                
                tileCtrl.tiles = tiles;

                document.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
                    if (e.detail.sender === tileHost || tileHost.contains(e.detail.sender)) {
                        if (this._insertBtn) {
                            this._insertBtn.disabled = !e.detail.value;
                        }
                    }
                });
                
                // double-click to insert immediately
                tileHost.addEventListener("dblclick", (e) => {
                    const card = e.target.closest(".wx-tile-card");
                    if (card && tileCtrl.value) {
                        this._handleSelection(tileCtrl.value);
                    }
                });
            }
        });
    },

    /**
     * Filters visible tiles in the modal based on search term.
     * @param {HTMLElement} modalEl - The modal element.
     * @param {string} term - Search term (lowercase).
     */
    _filterVisibleTiles: function(modalEl, term) {
        // find the active page pane
        const activePane = modalEl.querySelector(".wx-page-pane:not([style*='none'])");
        if (!activePane) return;

        const cards = activePane.querySelectorAll(".wx-tile-card");
        cards.forEach(card => {
            const text = (card.textContent || "").toLowerCase();
            if (text.includes(term)) {
                card.classList.remove("d-none");
            } else {
                card.classList.add("d-none");
            }
        });
    },

    /**
     * Handles the selection of an add-on. Closes modal and opens property editor if needed.
     * @param {string} addonId - The ID of the selected add-on.
     */
    _handleSelection: function(addonId) {
        if (!addonId) return;
        const addon = webexpress.webui.EditorAddOns.get(addonId);
        if (!addon) return;

        // close selection modal
        if (this._selectionModal) {
            this._selectionModal.hide();
        }

        if (addon.properties && addon.properties.length > 0) {
            this._openPropertyDialog(addon);
        } else {
            this._insertAddon(addon, {});
        }
    },
    
    /**
     * Handles the click on the "Insert" button.
     * Finds the active tile controller and its value.
     */
    _handleFinalInsert: function(modalEl) {
        // find the visible page pane
        const activePane = modalEl.querySelector(".wx-page-pane:not([style*='none'])");
        if (!activePane) return;

        // find the tile list container inside
        const tileHost = activePane.querySelector(".wx-addon-tile-list");
        if (tileHost && tileHost._wxController) {
            const selectedId = tileHost._wxController.value;
            if (selectedId) {
                this._handleSelection(selectedId);
            }
        }
    },

    /**
     * Opens the property editor for a specific node (edit mode) or new add-on (insert mode).
     * @param {object} editor - Editor instance.
     * @param {HTMLElement} node - Existing add-on node (optional).
     */
    _openSettingsForNode: function(editor, node) {
        const addonId = node.dataset.addonId;
        const def = webexpress.webui.EditorAddOns.get(addonId);
        if (def && def.properties) {
            this._currentEditor = editor;
            this._activeAddonNode = node;
            this._openPropertyDialog(def);
        }
    },

    /**
     * Generates context menu items for add-on elements.
     * @param {object} editor - Editor instance.
     * @param {HTMLElement} target - Click target.
     * @returns {Array} List of menu items.
     */
    getContextMenuItems: function(editor, target) {
        let element = target;
        if (element.nodeType === 3) element = element.parentNode;
        
        const wrapper = element.closest('[data-addon-id]');
        if (!wrapper) return [];

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
                if (editor._syncValue) editor._syncValue();
            }
        });

        return items;
    },

    /**
     * Creates and caches the property editor modal DOM structure.
     */
    _createPropertyModal: function() {
        this._propModal = document.createElement("div");
        this._propModal.className = "modal fade wx-prop-modal";
        this._propModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Properties</h5>
                        <button type="button" class="btn-close close-prop"></button>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary close-prop">Cancel</button>
                        <button type="button" class="btn btn-primary save-prop">Apply</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(this._propModal);

        const closeBtns = this._propModal.querySelectorAll(".close-prop");
        const saveBtn = this._propModal.querySelectorAll(".save-prop")[0];

        closeBtns.forEach(b => b.addEventListener("click", () => {
            this._propModal.style.display = "none";
            this._propModal.classList.remove("show");
            this._removeBackdrop();
        }));

        saveBtn.addEventListener("click", () => this._handlePropertySave());
    },

    /**
     * Opens the property dialog and fills it with form fields based on definition.
     * @param {object} addonDef - Add-on definition.
     */
    _openPropertyDialog: function(addonDef) {
        if (!this._propModal) {
            this._createPropertyModal();
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
                 if (body) widget = body.firstElementChild;
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
     * @param {object} addon - Add-on definition.
     * @param {object} data - Configuration data.
     */
    _insertAddon: function(addon, data) {
        if (!this._currentEditor) return;
        
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
     * @param {HTMLElement} frameNode - The wrapper element.
     * @param {object} def - Add-on definition.
     * @param {object} data - New configuration data.
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
            if (body) widget = body.firstElementChild;
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
     */
    _removeBackdrop: function() {
        if ((!this._selectionModal || this._selectionModal._element.style.display === "none") && 
            (!this._propModal || this._propModal.style.display === "none")) {
            document.body.classList.remove("modal-open");
            const bd = document.querySelector(".modal-backdrop");
            if (bd) bd.remove();
        }
    },
    
    /**
     * Ensures a modal backdrop exists.
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
     * @param {Range} range - The current drop range.
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