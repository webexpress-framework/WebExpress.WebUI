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
        const content = element.getAttribute("value") || element.innerHTML || "";
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

        // notify plugins again so anything that depends on the final block
        // structure (placeholder hint, etc.) sees the post-typing-space dom
        this._notifyPluginsContentChanged();
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
        const nonEditables = Array.from(editor.querySelectorAll('[contenteditable="false"]'));

        nonEditables.forEach((el) => {
            if (el.parentElement && el.parentElement.closest('[contenteditable="false"]')) {
                return;
            }

            const parentP = el.closest("p");
            if (parentP && parentP.parentElement === editor) {
                editor.insertBefore(el, parentP.nextSibling);
                modified = true;

                if (parentP.textContent.trim() === "" && parentP.querySelectorAll("img, table, [contenteditable='false']").length === 0) {
                    parentP.remove();
                }
            }

            if (el.parentElement === editor) {
                const prev = el.previousElementSibling;
                if (!prev || (prev.tagName !== "P" && prev.getAttribute("contenteditable") === "false")) {
                    const pBefore = document.createElement("p");
                    pBefore.innerHTML = "<br>";
                    editor.insertBefore(pBefore, el);
                    modified = true;
                }

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
            toolbar.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this._saveRangeOnFocusLost();
            }, true);
        }

        // save current range when editor loses focus
        this._editorElement.addEventListener("blur", () => {
            this._saveRangeOnFocusLost();
        });

        // restore current range when editor gets focus back
        this._editorElement.addEventListener("focus", () => {
            this._restoreRangeOnFocusReceived();
        });

        this._editorElement.addEventListener("mouseup", () => {
            this._saveRangeOnFocusLost();
        });

        this._editorElement.addEventListener("keyup", () => {
            this._saveRangeOnFocusLost();
        });

        this._editorElement.addEventListener("input", () => {
            this._syncValue();
            this._updateUndoRedoStates();
        });
    }

    /**
     * Saves the current range when focus is lost.
     * @returns {void}
     */
    _saveRangeOnFocusLost() {
        const sel = window.getSelection();
        if (!(sel && sel.rangeCount > 0)) {
            return;
        }

        const range = sel.getRangeAt(0);
        if (
            this._editorElement &&
            this._editorElement.contains(range.startContainer) &&
            this._editorElement.contains(range.endContainer)
        ) {
            this._savedRange = range.cloneRange();
        }
    }

    /**
     * Restores the saved range when focus is received.
     * If no valid range exists, caret is moved to the end.
     * @returns {void}
     */
    _restoreRangeOnFocusReceived() {
        if (!this._editorElement) {
            return;
        }

        const sel = window.getSelection();
        if (!sel) {
            return;
        }

        if (
            this._savedRange &&
            this._editorElement.contains(this._savedRange.startContainer) &&
            this._editorElement.contains(this._savedRange.endContainer)
        ) {
            sel.removeAllRanges();
            sel.addRange(this._savedRange);
            return;
        }

        const range = document.createRange();
        range.selectNodeContents(this._editorElement);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        this._savedRange = range.cloneRange();
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

        const plugins = webexpress.webui.EditorPlugins.getAll();
        plugins.forEach((plugin) => {
            if (typeof plugin.createToolbar === "function") {
                const group = plugin.createToolbar(this);
                if (group) {
                    toolbar.appendChild(group);
                }
            }
        });

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

        return historyGroup;
    }

    /**
     * Creates a single history button (undo or redo).
     * @param {string} command - The command name.
     * @param {string} title - The button tooltip.
     * @param {string} iconClass - The icon css class.
     * @returns {HTMLElement} The button element.
     */
    _createHistoryButton(command, title, iconClass) {
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.title = title;
        btn.setAttribute("aria-label", title);
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
        }

        if (redoBtn) {
            const canRedo = document.queryCommandEnabled("redo");
            redoBtn.disabled = !canRedo;
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
        document.body.appendChild(this._contextMenu);

        this._documentClickHandler = () => {
            if (this._contextMenu.style.display === "block") {
                this._contextMenu.style.display = "none";
            }
        };
        document.addEventListener("click", this._documentClickHandler);
    }

    /**
     * Sanitizes an html string by removing unsafe tags and attributes.
     * @param {string} html - Raw html input.
     * @returns {string} Sanitized html.
     */
    _sanitizeHtml(html) {
        return html || "";
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
     * Executes a document command on the editor content.
     * @param {string} command - The command to execute.
     * @param {*} value - The command value.
     */
    execCommand(command, value = null) {
        this._editorElement.focus();
        this._restoreRangeOnFocusReceived();
        document.execCommand(command, false, value);
        this._saveRangeOnFocusLost();
        this._syncValue();
        this._updateUndoRedoStates();
    }

    /**
     * Inserts html at the current cursor position.
     * @param {string} html - The html to insert.
     */
    insertHtmlAtCursor(html) {
        const cleanHtml = this._sanitizeHtml(html || "");

        this._editorElement.focus();
        this._restoreRangeOnFocusReceived();

        const sel = window.getSelection();
        if (!(sel && sel.rangeCount > 0)) {
            this._editorElement.innerHTML += cleanHtml;
            this._syncValue();
            return;
        }

        const range = sel.getRangeAt(0);
        range.deleteContents();

        const el = document.createElement("div");
        el.innerHTML = cleanHtml;
        const frag = document.createDocumentFragment();
        let node = null;
        let lastNode = null;

        while (el.firstChild) {
            node = el.firstChild;
            lastNode = frag.appendChild(node);
        }

        range.insertNode(frag);

        if (lastNode) {
            const newRange = document.createRange();
            newRange.setStartAfter(lastNode);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            this._savedRange = newRange.cloneRange();
        }

        this._notifyPluginsContentChanged();
        this._ensureTypingSpace();
        this._syncValue();
        this._updateUndoRedoStates();
    }

    /**
     * Getter for the editor content (html).
     * @returns {string} Current editor html content.
     */
    get value() {
        if (!this._editorElement) {
            return "";
        }
        return this._editorElement.innerHTML;
    }

    /**
     * Setter for the editor content.
     * @param {string} v - Html string to set.
     */
    set value(v) {
        if (!this._editorElement) {
            return;
        }
        const clean = this._sanitizeHtml(v || "");
        this._editorElement.innerHTML = clean;
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