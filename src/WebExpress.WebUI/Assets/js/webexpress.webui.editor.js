/**
 * Core WYSIWYG editor control.
 * Initializes the editor frame, manages undo/redo functionality, loads registered 
 * plugins, and handles context menu operations.
 */
webexpress.webui.EditorCtrl = class extends webexpress.webui.Ctrl {
    _formFieldName = null;
    _formInput = null;
    _editorElement = null;
    _savedRange = null;
    _contextMenu = null;
    _documentClickHandler = null;
    _fullscreenCloseBtn = null;

    // public configuration properties
    imageUploadUri = "";
    imageBaseUri = "";

    /**
     * Creates a new instance of the class.
     * @param {HTMLElement} element - The host element for the editor.
     */
    constructor(element) {
        super(element);
        const content = element.innerHTML;
        this._formFieldName = element.getAttribute("name") || null;

        element.removeAttribute("name");
        element.innerHTML = "";
        element.classList.add("wx-editor");

        this.imageUploadUri = element.dataset.imageUploadUri || "";
        this.imageBaseUri = element.dataset.imageBaseUri || "";

        this._createToolbar(element);
        this._createEditorArea(element, content);
        this._createStatusBar(element);
        this._initContextMenu();

        if (this._formFieldName) {
            this._ensureFormInput();
        }

        this._attachEventHandlers();
        this._initializePlugins();
        this._updateUndoRedoStates();
    }

    /**
     * Attaches all necessary event handlers to the editor and toolbar.
     */
    _attachEventHandlers() {
        const toolbar = this._element.querySelector(".wx-editor-toolbar");
        if (toolbar) {
            // use capture to catch the event before it bubbles up
            toolbar.addEventListener("mousedown", (e) => {
                // stop propagation to prevent parent modals from closing due to "click outside" logic
                e.stopPropagation();
                this._saveCurrentSelection();
            }, true);
        }

        this._editorElement.addEventListener("blur", () => {
            this._saveCurrentSelection();
        });

        this._editorElement.addEventListener("input", () => {
            this._syncValue();
            this._updateUndoRedoStates();
        });

        this._editorElement.addEventListener("keydown", () => {
            setTimeout(() => {
                this._updateUndoRedoStates();
            }, 0);
        });

        this._editorElement.addEventListener("mouseup", () => {
            setTimeout(() => {
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
     * @param {HTMLElement} element - The parent element.
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
     * Creates the undo/redo button group.
     * Adds the fullscreen toggle button at the end.
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

        // Add Separator
        const sep = document.createElement("div");
        sep.className = "wx-editor-separator";
        historyGroup.appendChild(sep);

        // Add Fullscreen Button
        const fsBtn = document.createElement("button");
        fsBtn.className = "wx-editor-btn";
        fsBtn.title = "Toggle Fullscreen";
        fsBtn.innerHTML = `<i class="fas fa-expand"></i>`;
        fsBtn.type = "button";

        // Set required data attributes
        fsBtn.dataset.wxToggle = "fullscreen";

        // Ensure element has an ID for the target reference
        if (!this._element.id) {
            this._element.id = "wx-editor-" + Math.floor(Math.random() * 100000);
        }
        fsBtn.dataset.wxTarget = "#" + this._element.id;

        historyGroup.appendChild(fsBtn);

        return historyGroup;
    }

    /**
     * Toggles fullscreen mode for the editor.
     * @param {HTMLElement} btn - The toggle button (optional).
     */
    _toggleFullscreen(btn) {
        // if called without button (e.g. from footer), try to find the toolbar button
        if (!btn) {
            btn = this._element.querySelector('button[data-wx-primary-action="fullscreen"]');
        }

        const isFullscreen = this._element.classList.toggle("wx-fullscreen-active");
        const icon = btn ? btn.querySelector("i") : null;

        if (isFullscreen) {
            if (icon) icon.className = "fas fa-compress";
            if (btn) btn.title = "Exit Fullscreen";
            document.body.style.overflow = "hidden"; // Prevent background scrolling

            // Show close button in footer
            if (this._fullscreenCloseBtn) {
                this._fullscreenCloseBtn.style.display = "inline-block";
            }
        } else {
            if (icon) icon.className = "fas fa-expand";
            if (btn) btn.title = "Toggle Fullscreen";
            document.body.style.overflow = "";

            // Hide close button in footer
            if (this._fullscreenCloseBtn) {
                this._fullscreenCloseBtn.style.display = "none";
            }
        }
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
        const undoBtn = this._element.querySelector('button[data-command="undo"]');
        const redoBtn = this._element.querySelector('button[data-command="redo"]');

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
     * Includes hidden close button for fullscreen mode.
     * @param {HTMLElement} element - The parent element.
     */
    _createStatusBar(element) {
        const statusBar = document.createElement("div");
        statusBar.classList.add("wx-editor-status");

        // add close button
        this._fullscreenCloseBtn = document.createElement("button");
        this._fullscreenCloseBtn.className = "btn btn-primary wx-button";
        this._fullscreenCloseBtn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Done';
        this._fullscreenCloseBtn.type = "button";
        this._fullscreenCloseBtn.style.marginLeft = "auto";

        // use data attributes for controller logic
        this._fullscreenCloseBtn.setAttribute("data-wx-dismiss", "fullscreen");
        this._fullscreenCloseBtn.setAttribute("data-wx-primary-target", "#" + this._element.id);

        // accessibility and tooltip
        this._fullscreenCloseBtn.setAttribute("aria-label", "Done");
        this._fullscreenCloseBtn.title = "Done";

        statusBar.appendChild(this._fullscreenCloseBtn);
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
            if (item.type === 'custom-element' && item.element) {
                container.appendChild(item.element);
                return;
            }

            // handle color swatch items
            if (item.type === 'color') {
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
     * Adds a separator to the menu if one doesn't already exist.
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
     * Ensures a hidden form input exists for the editor content.
     */
    _ensureFormInput() {
        let parent = this._editorElement;
        while (parent && parent.nodeName !== "FORM") {
            parent = parent.parentElement;
        }

        if (parent) {
            if (!this._formInput) {
                this._formInput = document.createElement("input");
                this._formInput.type = "hidden";
                this._formInput.name = this._formFieldName;
                parent.appendChild(this._formInput);
            }

            parent.addEventListener("submit", () => {
                this._syncValue();
            });

            this._formInput.addEventListener("input", () => {
                if (this._editorElement.innerHTML !== this._formInput.value) {
                    this._editorElement.innerHTML = this._formInput.value || "";
                }
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
            "hr", "small", "sub", "sup"
        ]);

        // allowed attributes per tag
        const allowedAttrs = {
            "a": ["href", "title", "target", "rel"],
            "img": ["src", "alt", "title", "width", "height"],
            "th": ["colspan", "rowspan"],
            "td": ["colspan", "rowspan"],
            "table": ["border", "cellpadding", "cellspacing"],
            "*": ["class", "id", "title", "role", "tabindex", "style"] // style often needed for editors
        };

        /**
         * sanitize a node and its subtree
         * @param {Node} node
         */
        function sanitizeNode(node) {
            // if element node, check tag and attributes
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node;
                const tag = el.tagName.toLowerCase();

                // special case: skip check for body itself, only sanitize its content
                if (tag !== "body") {
                    // remove disallowed elements by unwrapping or removing
                    if (!allowedTags.has(tag)) {
                        // unwrap allowed children to preserve text where sensible
                        const parent = el.parentNode;
                        if (parent) {
                            while (el.firstChild) {
                                parent.insertBefore(el.firstChild, el);
                            }
                            parent.removeChild(el);
                        } else {
                            // fallback: remove node completely
                            el.remove();
                        }
                        // since node is removed/unwrapped, we don't recurse on it directly here
                        // (children were moved to parent, they will be checked if we started high enough)
                        return;
                    }

                    // iterate attributes and remove unsafe ones
                    const attrs = Array.from(el.attributes);
                    attrs.forEach((attr) => {
                        const name = attr.name.toLowerCase();
                        const value = attr.value;

                        // allow data-* and aria-* always
                        if (name.startsWith("data-") || name.startsWith("aria-")) {
                            return;
                        }

                        // allow only whitelisted attributes
                        const allowedForTag = allowedAttrs[tag] || [];
                        const allowedGlobal = allowedAttrs["*"] || [];
                        const isAllowed = allowedForTag.indexOf(name) !== -1 || allowedGlobal.indexOf(name) !== -1;

                        if (!isAllowed) {
                            el.removeAttribute(attr.name);
                            return;
                        }

                        // if attribute is href or src, ensure protocol is safe
                        if ((name === "href" || name === "src") && value) {
                            const trimmed = value.trim();
                            // allow relative links, anchors, and specific protocols
                            if (!trimmed.match(/^(http|https|mailto|tel|\/|#|\.)/i)) {
                                // potential javascript: or data: alert -> remove
                                el.removeAttribute(attr.name);
                                return;
                            }
                            
                            // for anchors opening in new tab, enforce rel
                            if (name === "href" && el.tagName.toLowerCase() === "a") {
                                if (!el.getAttribute("rel") && el.getAttribute("target") === "_blank") {
                                    el.setAttribute("rel", "noopener noreferrer");
                                }
                            }
                        }
                        // sanitize style attribute to prevent xss via url()
                        if (name === "style" && value) {
                             if (value.toLowerCase().includes("javascript:") || value.toLowerCase().includes("expression(")) {
                                 el.removeAttribute("style");
                             }
                        }
                    });
                }
            }

            // recurse children (use snapshot because children may change)
            const children = Array.from(node.childNodes);
            children.forEach((child) => {
                sanitizeNode(child);
            });
        }

        // start sanitization on body, but the logic inside now skips the tag check for 'body'
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
     * incoming html is sanitized before insertion
     * @param {string} v - HTML string to set as editor content
     */
    set value(v) {
        if (!this._editorElement) {
            return;
        }
        // sanitize incoming html before placing into editor
        const clean = this._sanitizeHtml(v || "");
        this._editorElement.innerHTML = clean;
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
            // fallback: move cursor to the end if no selection exists
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(this._editorElement);
            range.collapse(false); // false means collapse to end
            sel.removeAllRanges();
            sel.addRange(range);

            // save this new position so subsequent calls use it
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
     * incoming html is sanitized before insertion
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
                this._syncValue();
                this._updateUndoRedoStates();
                return;
            }

            range.deleteContents();
            const el = document.createElement("div");
            el.innerHTML = cleanHtml;
            const frag = document.createDocumentFragment();
            let node, lastNode;

            while ((node = el.firstChild)) {
                lastNode = frag.appendChild(node);
            }

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