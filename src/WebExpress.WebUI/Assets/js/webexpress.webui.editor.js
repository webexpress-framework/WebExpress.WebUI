/**
 * Core WYSIWYG editor control.
 * Initializes the editor frame, manages undo/redo functionality, loads registered
 * plugins, and handles context menu operations.
 */
webexpress.webui.EditorCtrl = class extends webexpress.webui.Ctrl {
    _formFieldName = null;
    _formInput = null;
    _editorElement = null;
    _uiContainer = null;
    _savedRange = null;
    _contextMenu = null;
    _documentClickHandler = null;

    // public configuration properties
    imageUploadUri = "";
    imageBaseUri = "";

    /**
     * Creates a new instance of the class.
     * @param {HTMLElement} element - The host element for the editor (always a div).
     */
    constructor(element) {
        super(element);
        
        // read content preferably from value attribute (form-item behavior), fallback to innerhtml
        let content = element.getAttribute("value") || element.innerHTML || "";
        this._formFieldName = element.getAttribute("name") || element.dataset.name || null;

        this._uiContainer = element;
        
        // clean up container
        element.removeAttribute("name");
        element.removeAttribute("value");
        element.innerHTML = "";
        element.classList.add("wx-editor");

        // create hidden input field directly inside the container
        if (this._formFieldName) {
            this._formInput = document.createElement("input");
            this._formInput.type = "hidden";
            this._formInput.name = this._formFieldName;
            this._uiContainer.appendChild(this._formInput);
        }

        this.imageUploadUri = element.dataset.imageUploadUri || "";
        this.imageBaseUri = element.dataset.imageBaseUri || "";

        // ensure the container has an id
        if (!this._uiContainer.id) {
            this._uiContainer.id = "wx-editor-" + Math.floor(Math.random() * 100000);
        }

        this._createToolbar(this._uiContainer);
        this._createEditorArea(this._uiContainer, content);
        this._createStatusBar(this._uiContainer);
        this._initContextMenu();

        if (this._formInput) {
            this._syncValue();
            this._setupFormIntegration();
        }

        this._attachEventHandlers();
        this._initializePlugins();
        this._updateUndoRedoStates();
        
        // notify plugins first so tables are wrapped in frames
        this._notifyPluginsContentChanged();
        
        // ensure typing space is available after initialization and upgrades
        this._ensureTypingSpace();
    }

    /**
     * Notifies all plugins that the content has been loaded or programmatically changed.
     */
    _notifyPluginsContentChanged() {
        const plugins = webexpress.webui.EditorPlugins.getAll();
        plugins.forEach((plugin) => {
            if (typeof plugin.onContentChange === "function") {
                plugin.onContentChange(this);
            }
        });
    }

    /**
     * Ensures there is always an empty paragraph before, after, and between non-editable elements.
     * This totally prevents the cursor trap issue.
     */
    _ensureTypingSpace() {
        if (!this._editorElement) {
            return;
        }

        let modified = false;
        const editor = this._editorElement;

        // find all non-editable blocks (like table frames)
        const nonEditables = Array.from(editor.querySelectorAll('[contenteditable="false"]'));
        
        nonEditables.forEach(el => {
            // skip elements that are nested inside OTHER non-editable elements
            if (el.parentElement && el.parentElement.closest('[contenteditable="false"]')) {
                return;
            }

            // un-nest from <p> if it accidentally got put inside one during insertion
            const parentP = el.closest("p");
            if (parentP && parentP.parentElement === editor) {
                // move element out of the paragraph and place it after
                editor.insertBefore(el, parentP.nextSibling);
                modified = true;
                
                // cleanup the empty parent paragraph
                if (parentP.textContent.trim() === "" && parentP.querySelectorAll("img, table, [contenteditable='false']").length === 0) {
                    parentP.remove();
                }
            }

            // strictly ensure el is a direct child of the editor before attempting to insert siblings
            if (el.parentElement === editor) {
                // ensure paragraph exists before the non-editable element
                const prev = el.previousElementSibling;
                if (!prev || (prev.tagName !== "P" && prev.getAttribute("contenteditable") === "false")) {
                    const pBefore = document.createElement("p");
                    pBefore.innerHTML = "<br>";
                    editor.insertBefore(pBefore, el);
                    modified = true;
                }

                // ensure paragraph exists after the non-editable element
                const next = el.nextElementSibling;
                if (!next || (next.tagName !== "P" && next.getAttribute("contenteditable") === "false")) {
                    const pAfter = document.createElement("p");
                    pAfter.innerHTML = "<br>";
                    if (el.nextSibling) {
                        editor.insertBefore(pAfter, el.nextSibling);
                    } else {
                        editor.appendChild(pAfter);
                    }
                    modified = true;
                }
            }
        });

        // ensure editor is never completely empty
        const html = editor.innerHTML.trim();
        if (!html || html === "<br>") {
            editor.innerHTML = "<p><br></p>";
            modified = true;
        }

        if (modified) {
            this._syncValue();
        }
    }

    /**
     * Attaches all necessary event handlers to the editor and toolbar.
     */
    _attachEventHandlers() {
        const toolbar = this._uiContainer.querySelector(".wx-editor-toolbar");
        if (toolbar) {
            // use capture to catch the event before it bubbles up
            toolbar.addEventListener("mousedown", (e) => {
                // stop propagation to prevent parent modals from closing due to "click outside" logic
                e.stopPropagation();
                this._saveCurrentSelection();
            }, true);
        }

        this._editorElement.addEventListener("change", () => {
            this._editorElement.innerHTML = this._formInput.value;
        });

        this._editorElement.addEventListener("blur", () => {
            this._saveCurrentSelection();
        });

        this._editorElement.addEventListener("input", () => {
            this._syncValue();
            this._updateUndoRedoStates();
        });

        this._editorElement.addEventListener("keydown", (e) => {
            let actionModified = false;

            // prevent accidental deletion of empty paragraphs directly around non-editable elements
            if (e.key === "Backspace" || e.key === "Delete") {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
                    let node = sel.getRangeAt(0).startContainer;
                    
                    if (node.nodeType === Node.TEXT_NODE) {
                        node = node.parentElement;
                    }

                    // only intercept if we are inside a direct block like <p>
                    const block = node.closest("p, div:not(.wx-editor-content)");
                    if (block && block.parentElement === this._editorElement) {
                        
                        if (e.key === "Backspace") {
                            const prev = block.previousElementSibling;
                            if (prev && prev.getAttribute("contenteditable") === "false") {
                                // check if cursor is at the very start with no content before it
                                const range = sel.getRangeAt(0);
                                const preCaretRange = range.cloneRange();
                                preCaretRange.selectNodeContents(block);
                                preCaretRange.setEnd(range.startContainer, range.startOffset);
                                
                                const frag = preCaretRange.cloneContents();
                                const hasContent = frag.textContent.trim().length > 0 || 
                                    Array.from(frag.querySelectorAll("*")).filter(el => el.tagName !== "BR").length > 0;
                                
                                if (!hasContent) {
                                    e.preventDefault(); // don't delete the empty space paragraph
                                    prev.remove(); // delete the non-editable block (table) instead
                                    actionModified = true;
                                }
                            }
                        } else if (e.key === "Delete") {
                            const next = block.nextElementSibling;
                            if (next && next.getAttribute("contenteditable") === "false") {
                                // check if cursor is at the very end with no content after it
                                const range = sel.getRangeAt(0);
                                const postCaretRange = range.cloneRange();
                                postCaretRange.selectNodeContents(block);
                                postCaretRange.setStart(range.endContainer, range.endOffset);
                                
                                const frag = postCaretRange.cloneContents();
                                const hasContent = frag.textContent.trim().length > 0 || 
                                    Array.from(frag.querySelectorAll("*")).filter(el => el.tagName !== "BR").length > 0;
                                
                                if (!hasContent) {
                                    e.preventDefault(); // don't delete the empty space paragraph
                                    next.remove(); // delete the non-editable block (table) instead
                                    actionModified = true;
                                }
                            }
                        }
                    }
                }
            }

            setTimeout(() => {
                this._ensureTypingSpace();
                this._updateUndoRedoStates();
                if (actionModified) {
                    this._syncValue();
                }
            }, 0);
        });

        this._editorElement.addEventListener("mouseup", () => {
            setTimeout(() => {
                this._ensureTypingSpace();
                this._updateUndoRedoStates();
            }, 0);
        });
    }

    /**
     * Initializes all registered plugins.
     */
    _initializePlugins() {
        const plugins = webexpress.webui.EditorPlugins.getAll();
        plugins.forEach((plugin) => {
            if (typeof plugin.init === "function") {
                plugin.init(this);
            }
        });
    }

    /**
     * Creates the toolbar containing plugin buttons and undo/redo controls.
     * @param {HTMLElement} element - The parent element (ui container).
     */
    _createToolbar(element) {
        const toolbar = document.createElement("div");
        toolbar.classList.add("wx-editor-toolbar");
        toolbar.style.display = "flex";
        toolbar.style.flexWrap = "wrap";
        toolbar.style.alignItems = "center";

        // append plugin toolbars
        const plugins = webexpress.webui.EditorPlugins.getAll();
        plugins.forEach((plugin) => {
            if (typeof plugin.createToolbar === "function") {
                const group = plugin.createToolbar(this);
                if (group) {
                    toolbar.appendChild(group);
                }
            }
        });

        // append undo/redo controls
        const historyGroup = this._createHistoryGroup();
        toolbar.appendChild(historyGroup);
        element.appendChild(toolbar);
    }

    /**
     * Creates the undo/redo button group including the fullscreen toggle.
     * @returns {HTMLElement} The history button group.
     */
    _createHistoryGroup() {
        const historyGroup = document.createElement("div");
        historyGroup.className = "wx-editor-btn-group";
        historyGroup.style.marginLeft = "auto";

        const undoBtn = this._createHistoryButton("undo", "Undo (Ctrl+Z)", "fas fa-undo");
        const redoBtn = this._createHistoryButton("redo", "Redo (Ctrl+Y)", "fas fa-redo");

        historyGroup.appendChild(undoBtn);
        historyGroup.appendChild(redoBtn);

        // add separator
        const sep = document.createElement("div");
        sep.className = "wx-editor-separator";
        historyGroup.appendChild(sep);

        // add fullscreen button
        const fsBtn = document.createElement("button");
        fsBtn.className = "wx-editor-btn";
        fsBtn.title = "Toggle Fullscreen";
        fsBtn.innerHTML = `<i class="fas fa-expand"></i>`;
        fsBtn.type = "button";

        // use the current action system targetting the container
        fsBtn.dataset.wxPrimaryAction = "fullscreen";
        fsBtn.dataset.wxPrimaryTarget = "#" + this._uiContainer.id;

        historyGroup.appendChild(fsBtn);

        return historyGroup;
    }

    /**
     * Creates a single history button (undo or redo).
     * @param {string} command - The command name.
     * @param {string} title - The button tooltip.
     * @param {string} iconClass - The icon CSS class.
     * @returns {HTMLElement} The button element.
     */
    _createHistoryButton(command, title, iconClass) {
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.title = title;
        btn.dataset.command = command;
        btn.innerHTML = `<i class="${iconClass}"></i>`;
        btn.type = "button";

        btn.addEventListener("click", () => {
            this.execCommand(command);
            this._updateUndoRedoStates();
        });

        return btn;
    }

    /**
     * Updates the enabled/disabled state of undo and redo buttons.
     */
    _updateUndoRedoStates() {
        const undoBtn = this._uiContainer.querySelector('button[data-command="undo"]');
        const redoBtn = this._uiContainer.querySelector('button[data-command="redo"]');

        if (undoBtn) {
            const canUndo = document.queryCommandEnabled("undo");
            undoBtn.disabled = !canUndo;
            undoBtn.style.opacity = canUndo ? "1" : "0.5";
        }

        if (redoBtn) {
            const canRedo = document.queryCommandEnabled("redo");
            redoBtn.disabled = !canRedo;
            redoBtn.style.opacity = canRedo ? "1" : "0.5";
        }
    }

    /**
     * Creates the editable content area.
     * @param {HTMLElement} element - The parent element.
     * @param {string} content - The initial content.
     */
    _createEditorArea(element, content) {
        const container = document.createElement("div");
        container.classList.add("wx-editor-container");

        this._editorElement = document.createElement("div");
        this._editorElement.classList.add("wx-editor-content");
        this._editorElement.setAttribute("contenteditable", "true");
        this._editorElement.style.minHeight = "200px";

        if (content) {
            // sanitize initial content before inserting
            const clean = this._sanitizeHtml(content);
            this._editorElement.innerHTML = clean;
        }

        container.appendChild(this._editorElement);
        element.appendChild(container);
    }

    /**
     * Creates the status bar at the bottom of the editor.
     * @param {HTMLElement} element - The parent element.
     */
    _createStatusBar(element) {
        const statusBar = document.createElement("div");
        statusBar.classList.add("wx-editor-status");

        const doneBtn = document.createElement("button");
        doneBtn.className = "btn btn-primary wx-button wx-editor-finish";
        doneBtn.type = "button";
        doneBtn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Done';
        doneBtn.setAttribute("aria-label", "Done");
        doneBtn.title = "Done";

        // wire to the controller's dismiss handler for css fullscreen
        doneBtn.setAttribute("data-wx-dismiss", "fullscreen");
        doneBtn.setAttribute("data-wx-target", "#" + this._uiContainer.id);

        statusBar.appendChild(doneBtn);
        element.appendChild(statusBar);
    }

    /**
     * Initializes the context menu and its event handlers.
     */
    _initContextMenu() {
        this._contextMenu = document.createElement("div");
        this._contextMenu.className = "dropdown-menu shadow";
        this._contextMenu.style.position = "fixed";
        this._contextMenu.style.display = "none";
        this._contextMenu.style.zIndex = "1050";
        document.body.appendChild(this._contextMenu);

        // close context menu on any document click
        this._documentClickHandler = () => {
            if (this._contextMenu.style.display === "block") {
                this._contextMenu.style.display = "none";
            }
        };
        document.addEventListener("click", this._documentClickHandler);

        this._editorElement.addEventListener("contextmenu", (e) => {
            this._saveCurrentSelection();
            e.preventDefault();
            this._buildAndShowContextMenu(e);
        });
    }

    /**
     * Saves the current selection range for later restoration.
     */
    _saveCurrentSelection() {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            if (this._editorElement.contains(sel.anchorNode)) {
                this._savedRange = sel.getRangeAt(0).cloneRange();
            }
        }
    }

    /**
     * Builds and displays the context menu at the specified position.
     * @param {MouseEvent} e - The context menu event.
     */
    _buildAndShowContextMenu(e) {
        this._contextMenu.innerHTML = "";
        const target = e.target;

        const sel = window.getSelection();
        const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed && this._editorElement.contains(sel.anchorNode);

        // core clipboard operations
        const coreItems = [
            { label: "Cut", action: "cut", icon: "fas fa-cut", disabled: !hasSelection },
            { label: "Copy", action: "copy", icon: "fas fa-copy", disabled: !hasSelection },
            { label: "Paste", action: () => this._handlePaste(), icon: "fas fa-paste", disabled: false }
        ];

        this._renderMenuItems(coreItems);

        // add plugin-specific context menu items
        const plugins = webexpress.webui.EditorPlugins.getAll();
        let hasPluginItems = false;

        plugins.forEach((plugin) => {
            if (typeof plugin.getContextMenuItems === "function") {
                const items = plugin.getContextMenuItems(this, target);
                if (items && items.length > 0) {
                    if (!hasPluginItems) {
                        this._addMenuSeparator();
                        hasPluginItems = true;
                    }
                    this._renderMenuItems(items);
                }
            }
        });

        // position menu and ensure it stays on screen
        this._positionContextMenu(e.clientX, e.clientY);
        this._contextMenu.style.display = "block";
    }

    /**
     * Positions the context menu, ensuring it stays within viewport bounds.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     */
    _positionContextMenu(x, y) {
        const menuRect = this._contextMenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let finalX = x;
        let finalY = y;

        // adjust if menu would overflow viewport
        if (x + menuRect.width > viewportWidth) {
            finalX = viewportWidth - menuRect.width - 5;
        }
        if (y + menuRect.height > viewportHeight) {
            finalY = viewportHeight - menuRect.height - 5;
        }

        this._contextMenu.style.top = `${finalY}px`;
        this._contextMenu.style.left = `${finalX}px`;
    }

    /**
     * Handles paste operation from clipboard with fallback support.
     */
    async _handlePaste() {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                if (item.types.includes("text/html")) {
                    const blob = await item.getType("text/html");
                    const html = await blob.text();
                    this.insertHtmlAtCursor(html);
                    return;
                }
                if (item.types.includes("text/plain")) {
                    const blob = await item.getType("text/plain");
                    const text = await blob.text();
                    this.execCommand("insertText", text);
                    return;
                }
            }
        } catch (err) {
            // fallback to plain text
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    this.execCommand("insertText", text);
                }
            } catch (fallbackErr) {
                console.warn("Clipboard paste failed:", fallbackErr);
                alert("Paste not supported or permitted by browser. Please use Ctrl+V.");
            }
        }
    }

    /**
     * Renders menu items into the specified container.
     * @param {Array} items - The menu item definitions.
     * @param {HTMLElement} container - The target container.
     */
    _renderMenuItems(items, container = this._contextMenu) {
        items.forEach(item => {
            if (item.separator) {
                this._addMenuSeparator(container);
                return;
            }

            // handle submenu items
            if (item.submenu && item.submenu.length > 0) {
                this._createSubmenuItem(item, container);
                return;
            }

            // handle custom element items
            if (item.type === "custom-element" && item.element) {
                container.appendChild(item.element);
                return;
            }

            // handle color swatch items
            if (item.type === "color") {
                this._createColorItem(item, container);
                return;
            }

            // handle standard button items
            this._createStandardMenuItem(item, container);
        });
    }

    /**
     * Creates a submenu item with nested items.
     * @param {Object} item - The submenu item definition.
     * @param {HTMLElement} container - The target container.
     */
    _createSubmenuItem(item, container) {
        const wrapper = document.createElement("div");
        wrapper.className = "position-relative";
        wrapper.style.width = "100%";

        const btn = document.createElement("button");
        btn.className = "dropdown-item d-flex align-items-center justify-content-between gap-2";
        btn.type = "button";

        const iconHtml = this._getIconHtml(item.icon);
        btn.innerHTML = `<div>${iconHtml} <span>${item.label}</span></div> <i class="fas fa-chevron-right" style="font-size:0.7em;"></i>`;

        const subMenu = document.createElement("div");
        subMenu.className = "dropdown-menu shadow";
        subMenu.style.top = "0";
        subMenu.style.left = "100%";
        subMenu.style.marginTop = "-5px";
        subMenu.style.marginLeft = "0";
        subMenu.style.display = "none";
        subMenu.style.maxHeight = "250px";
        subMenu.style.overflowY = "auto";

        let targetContainer = subMenu;
        if (item.submenuClass) {
            const gridList = document.createElement("ul");
            gridList.className = item.submenuClass;
            gridList.style.marginBottom = "0";
            subMenu.appendChild(gridList);
            targetContainer = gridList;
        }

        this._renderMenuItems(item.submenu, targetContainer);

        wrapper.addEventListener("mouseenter", () => {
            subMenu.style.display = "block";
        });
        wrapper.addEventListener("mouseleave", () => {
            subMenu.style.display = "none";
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(subMenu);
        container.appendChild(wrapper);
    }

    /**
     * Creates a color swatch menu item.
     * @param {Object} item - The color item definition.
     * @param {HTMLElement} container - The target container.
     */
    _createColorItem(item, container) {
        const li = document.createElement("li");
        li.style.display = "inline-block";

        const colorBtn = document.createElement("button");
        colorBtn.type = "button";
        colorBtn.className = "dropdown-item p-2";
        colorBtn.style.backgroundColor = item.value;
        colorBtn.style.width = "24px";
        colorBtn.style.height = "24px";
        colorBtn.style.borderRadius = "4px";
        colorBtn.style.border = "1px solid #dee2e6";
        colorBtn.title = item.value;

        colorBtn.addEventListener("click", () => {
            if (typeof item.action === "function") {
                item.action();
            }
            this._contextMenu.style.display = "none";
        });

        li.appendChild(colorBtn);
        container.appendChild(li);
    }

    /**
     * Creates a standard menu item button.
     * @param {Object} item - The menu item definition.
     * @param {HTMLElement} container - The target container.
     */
    _createStandardMenuItem(item, container) {
        const btn = document.createElement("button");
        btn.className = "dropdown-item d-flex align-items-center gap-2";
        btn.type = "button";

        if (item.disabled) {
            btn.classList.add("disabled");
            btn.disabled = true;
            btn.style.pointerEvents = "none";
            btn.style.opacity = "0.6";
        }

        const iconHtml = this._getIconHtml(item.icon);
        btn.innerHTML = `${iconHtml} <span>${item.label}</span>`;

        if (!item.disabled) {
            btn.addEventListener("click", () => {
                if (typeof item.action === "function") {
                    item.action();
                } else if (typeof item.action === "string") {
                    this.execCommand(item.action);
                }
                this._contextMenu.style.display = "none";
            });
        }

        container.appendChild(btn);
    }

    /**
     * Returns HTML markup for an icon.
     * @param {string} icon - The icon class or identifier.
     * @returns {string} The icon HTML markup.
     */
    _getIconHtml(icon) {
        if (!icon) {
            return `<span style="width:18px;"></span>`;
        }
        if (icon.startsWith("fas") || icon.startsWith("fa")) {
            return `<i class="${icon}" style="width:18px;text-align:center;"></i>`;
        }
        return `<i class="${icon}"></i>`;
    }

    /**
     * Adds a separator to the menu if one does not already exist at the end.
     * @param {HTMLElement} container - The target container.
     */
    _addMenuSeparator(container = this._contextMenu) {
        if (container.lastElementChild && container.lastElementChild.classList.contains("dropdown-divider")) {
            return;
        }
        const sep = document.createElement("div");
        sep.className = "dropdown-divider";
        container.appendChild(sep);
    }

    /**
     * Ensures form synchronization events are established.
     */
    _setupFormIntegration() {
        const form = this._uiContainer.closest("form");
        if (form) {
            form.addEventListener("submit", () => {
                this._syncValue();
            });
        }
    }

    /**
     * Synchronizes the editor content with the hidden form input.
     */
    _syncValue() {
        if (this._formInput) {
            this._formInput.value = this._editorElement.innerHTML;
        }
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._editorElement.innerHTML });
    }

    /**
     * Sanitizes an HTML string by removing unsafe tags and attributes.
     * - uses a whitelist approach for tags and attributes
     * - strips event handlers, style and javascript: urls
     * - allows data-* and aria-* attributes
     * @param {string} html - raw html input
     * @returns {string} sanitized html
     */
    _sanitizeHtml(html) {
        // parse html into a document
        const parser = new DOMParser();
        const doc = parser.parseFromString(html || "", "text/html");

        // allowed tags whitelist
        const allowedTags = new Set([
            "a", "b", "strong", "i", "em", "u", "p", "br", "ul", "ol", "li",
            "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
            "img", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
            "colgroup", "col", "hr", "small", "sub", "sup"
        ]);

        // allowed attributes per tag
        const allowedAttrs = {
            "a": ["href", "title", "target", "rel"],
            "img": ["src", "alt", "title", "width", "height"],
            "th": ["colspan", "rowspan", "scope", "contenteditable"],
            "td": ["colspan", "rowspan", "contenteditable"],
            "table": ["border", "cellpadding", "cellspacing"],
            "div": ["draggable"],
            // globally allow attributes relevant to the editor
            "*": ["class", "id", "title", "role", "tabindex", "style", "contenteditable", "data-addon-id", "data-type"]
        };

        /**
         * Sanitizes a node and its subtree recursively.
         * @param {Node} node
         */
        function sanitizeNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node;
                const tag = el.tagName.toLowerCase();

                // skip the body element itself; only sanitize its children
                if (tag !== "body") {
                    if (!allowedTags.has(tag)) {
                        // unwrap: move children to parent, then remove the element
                        const parent = el.parentNode;
                        if (parent) {
                            while (el.firstChild) {
                                parent.insertBefore(el.firstChild, el);
                            }
                            parent.removeChild(el);
                        } else {
                            el.remove();
                        }
                        return;
                    }

                    // remove unsafe attributes
                    const attrs = Array.from(el.attributes);
                    attrs.forEach((attr) => {
                        const name = attr.name.toLowerCase();
                        const value = attr.value;

                        // always allow data-* and aria-*
                        if (name.startsWith("data-") || name.startsWith("aria-")) {
                            return;
                        }

                        const allowedForTag = allowedAttrs[tag] || [];
                        const allowedGlobal = allowedAttrs["*"] || [];
                        const isAllowed = allowedForTag.indexOf(name) !== -1 || allowedGlobal.indexOf(name) !== -1;

                        if (!isAllowed) {
                            el.removeAttribute(attr.name);
                            return;
                        }

                        // block unsafe url protocols in href and src
                        if ((name === "href" || name === "src") && value) {
                            const trimmed = value.trim();
                            if (!trimmed.match(/^(http|https|mailto|tel|\/|#|\.)/i)) {
                                el.removeAttribute(attr.name);
                                return;
                            }

                            // enforce rel for links opening in new tab
                            if (name === "href" && el.tagName.toLowerCase() === "a") {
                                if (!el.getAttribute("rel") && el.getAttribute("target") === "_blank") {
                                    el.setAttribute("rel", "noopener noreferrer");
                                }
                            }
                        }

                        // block javascript: and expression() in style values
                        if (name === "style" && value) {
                            if (value.toLowerCase().includes("javascript:") || value.toLowerCase().includes("expression(")) {
                                el.removeAttribute("style");
                            }
                        }
                    });
                }
            }

            // recurse over a snapshot of children (list may change during sanitization)
            const children = Array.from(node.childNodes);
            children.forEach((child) => {
                sanitizeNode(child);
            });
        }

        if (doc.body) {
            sanitizeNode(doc.body);
            return doc.body.innerHTML;
        }

        return "";
    }

    /**
     * Getter for the editor content (HTML).
     * @returns {string} current editor HTML content
     */
    get value() {
        return this._editorElement ? this._editorElement.innerHTML : "";
    }

    /**
     * Setter for the editor content.
     * Updates the editor DOM, synchronizes hidden form input and refreshes UI state.
     * Incoming html is sanitized before insertion.
     * @param {string} v - HTML string to set as editor content
     */
    set value(v) {
        if (!this._editorElement) {
            return;
        }
        // sanitize incoming html before placing into editor
        const clean = this._sanitizeHtml(v || "");
        this._editorElement.innerHTML = clean;
        
        // notify plugins first to upgrade tables to frames
        this._notifyPluginsContentChanged();
        // then ensure typing space un-nests the newly upgraded frames
        this._ensureTypingSpace();
        
        // update hidden input and dispatch change
        this._syncValue();
        this._updateUndoRedoStates();
    }

    /**
     * Returns the editor content element.
     * @returns {HTMLElement} The editor content element.
     */
    getEditorElement() {
        return this._editorElement;
    }

    /**
     * Restores the previously saved selection range.
     * If no range is saved, sets cursor to the end of the content.
     */
    restoreSavedRange() {
        this._editorElement.focus();

        if (this._savedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this._savedRange);
        } else {
            // fallback: move cursor to end if no selection exists
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(this._editorElement);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);

            // save this position so subsequent calls use it
            this._savedRange = range.cloneRange();
        }
    }

    /**
     * Executes a document command on the editor content.
     * @param {string} command - The command to execute.
     * @param {*} value - The command value.
     */
    execCommand(command, value = null) {
        this.restoreSavedRange();
        document.execCommand(command, false, value);
    }

    /**
     * Inserts HTML at the current cursor position.
     * Replaces empty paragraphs with the block element to prevent nested invalid HTML structures.
     * @param {string} html - The HTML to insert.
     */
    insertHtmlAtCursor(html) {
        // sanitize html to avoid introducing unsafe content
        const cleanHtml = this._sanitizeHtml(html || "");
        this.restoreSavedRange();
        const sel = window.getSelection();

        if (sel && sel.rangeCount) {
            const range = sel.getRangeAt(0);

            if (!this._editorElement.contains(range.startContainer)) {
                this._editorElement.innerHTML += cleanHtml;
                this._notifyPluginsContentChanged();
                this._ensureTypingSpace();
                this._syncValue();
                this._updateUndoRedoStates();
                return;
            }

            let node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) {
                node = node.parentElement;
            }
            const p = node.closest("p");

            range.deleteContents();
            const el = document.createElement("div");
            el.innerHTML = cleanHtml;
            const frag = document.createDocumentFragment();
            let n, lastNode;

            while ((n = el.firstChild)) {
                lastNode = frag.appendChild(n);
            }

            // if we are inserting a block inside a paragraph, check if paragraph is empty
            if (p && p.parentElement === this._editorElement) {
                const pContent = p.textContent.trim();
                // replace the empty paragraph entirely to prevent nesting
                if (pContent === "" || p.innerHTML === "<br>") {
                    p.parentNode.insertBefore(frag, p);
                    p.remove();
                    
                    if (lastNode) {
                        const newRange = document.createRange();
                        newRange.setStartAfter(lastNode);
                        newRange.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                        this._saveCurrentSelection();
                    }
                    
                    this._notifyPluginsContentChanged();
                    this._ensureTypingSpace();
                    this._syncValue();
                    this._updateUndoRedoStates();
                    return;
                }
            }

            // fallback normal insertion
            range.insertNode(frag);

            if (lastNode) {
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                this._saveCurrentSelection();
            }
        } else {
            this._editorElement.innerHTML += cleanHtml;
        }

        this._notifyPluginsContentChanged();
        this._ensureTypingSpace();
        this._syncValue();
        this._updateUndoRedoStates();
    }

    /**
     * Cleans up resources when the control is destroyed.
     */
    destroy() {
        if (this._documentClickHandler) {
            document.removeEventListener("click", this._documentClickHandler);
        }

        if (this._contextMenu && this._contextMenu.parentElement) {
            this._contextMenu.parentElement.removeChild(this._contextMenu);
        }

        super.destroy();
    }
};

// register the class in the controller system
webexpress.webui.Controller.registerClass("wx-webui-editor", webexpress.webui.EditorCtrl);