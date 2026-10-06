/**
 * Selection helpers shared by the view plugins. The live DOM selection is only a transient
 * projection of the model; persistence always belongs to the model indices.
 */
webexpress.webui.EditorSelection = class {
    /**
     * Returns the current selection range only when it lies wholly inside the editor, so a
     * selection in a dialog or in another editor is never taken for this one.
     * @param {HTMLElement} root - The editing surface the range must belong to.
     * @returns {Range|null} The live range, or null if there is none inside the root.
     */
    static getRange(root) {
        const selection = window.getSelection();
        if (!selection?.rangeCount) return null;
        const range = selection.getRangeAt(0);
        return root?.contains(range.startContainer) && root.contains(range.endContainer) ? range : null;
    }

    /**
     * Replaces the document selection with the given range. The browser keeps a single
     * selection, so any existing range has to be removed first.
     * @param {Range} range - The range to select.
     */
    static apply(range) { const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); }

    /**
     * Determines whether a node takes user input. The nearest explicit contenteditable ancestor
     * decides, because embedded islands and read-only frames override the surface.
     * @param {Node} node - The node to test; a text node is judged by its parent.
     * @param {HTMLElement} root - The editing surface bounding the search.
     * @returns {boolean} True if the node is editable.
     */
    static isEditable(node, root) {
        for (let element = node?.nodeType === 3 ? node.parentElement : node; element && element !== root; element = element.parentElement) {
            if (element.getAttribute("contenteditable") === "true") return true;
            if (element.getAttribute("contenteditable") === "false") return false;
        }
        return root?.getAttribute("contenteditable") !== "false";
    }
};

/**
 * Undo history of completed model transactions. It never stores DOM snapshots or delayed
 * typing, so restoring an entry always yields a state the reducer produced.
 */
webexpress.webui.EditorHistory = class {
    /**
     * The maximum number of retained entries; beyond it the oldest entry is dropped.
     */
    static MAX = 200;

    /**
     * Initializes a new instance of the class and takes over the undo and redo input of the
     * surface, because the native history would replay DOM changes the model never saw.
     * @param {webexpress.webui.EditorCtrl} editor - The editor whose transactions are recorded.
     */
    constructor(editor) {
        this._editor = editor; this._entries = []; this._index = 0; this._sequence = 0;
        this._keydown = e => this._onKeyDown(e);
        this._beforeinput = e => this._onBeforeInput(e);
        const root = editor.getEditorElement();
        root.addEventListener("keydown", this._keydown);
        root.addEventListener("beforeinput", this._beforeinput);
    }

    /**
     * Maps the undo and redo shortcuts to the model history. The native history input some
     * browsers fire for the same keystroke is suppressed until the next tick, so a shortcut
     * never steps twice.
     * @param {KeyboardEvent} e - The keydown event of the surface.
     */
    _onKeyDown(e) {
        if (!this._editor.ownsInput(e) || e.defaultPrevented || e.isComposing || this._editor._composing || e.altKey || !(e.ctrlKey || e.metaKey)) return;
        const key = (e.key || "").toLowerCase();
        const action = key === "z" ? e.shiftKey ? "redo" : "undo" : key === "y" ? "redo" : null;
        if (!action) return;
        e.preventDefault();
        this._suppress = true;
        if (this._timer) this._editor.cancelDeferred(this._timer);
        this._timer = this._editor.defer(() => { this._suppress = false; this._timer = null; }, 0);
        this[action]();
    }

    /**
     * Redirects native undo and redo input, such as from the context menu, to the model history.
     * @param {InputEvent} e - The beforeinput event of the surface.
     */
    _onBeforeInput(e) {
        if (!this._editor.ownsInput(e) || e.defaultPrevented || e.isComposing || this._editor._composing) return;
        if (!["historyUndo", "historyRedo"].includes(e.inputType)) return;
        e.preventDefault();
        if (!this._suppress) this[e.inputType === "historyUndo" ? "undo" : "redo"]();
    }

    /**
     * Records a transaction and discards the redo branch. A transaction that leaves the document
     * unchanged is ignored, so a mere selection move never becomes an undo step.
     * @param {object} action - The action that was reduced.
     * @param {object} before - The editor state before the action.
     * @param {object} after - The editor state after the action.
     * @returns {boolean} True if an entry was recorded.
     */
    record(action, before, after) {
        const Model = webexpress.webui.EditorModel;
        if (JSON.stringify(before.doc) === JSON.stringify(after.doc)) return false;
        this._entries.splice(this._index);
        this._entries.push({ id: ++this._sequence, action: Model.clone(action), before: Model.clone(before), after: Model.clone(after) });
        if (this._entries.length > this.constructor.MAX) this._entries.shift();
        this._index = this._entries.length;
        return true;
    }

    /**
     * Discards all entries, as an external state load establishes a new baseline.
     */
    reset() { this._entries = []; this._index = 0; }

    /**
     * Determines whether an earlier state is available.
     * @returns {boolean} True if undo would change the document.
     */
    canUndo() { return this._index > 0; }

    /**
     * Determines whether an undone state is available.
     * @returns {boolean} True if redo would change the document.
     */
    canRedo() { return this._index < this._entries.length; }

    /**
     * Restores the state before the most recent transaction. A disabled or destroyed editor is
     * left untouched, because its form value must not change behind the user's back.
     */
    undo() { if (!this._editor.disabled && !this._editor._destroyed && this.canUndo()) this._restore(this._entries[--this._index].before); }

    /**
     * Reapplies the most recently undone transaction under the same conditions as undo.
     */
    redo() { if (!this._editor.disabled && !this._editor._destroyed && this.canRedo()) this._restore(this._entries[this._index++].after); }

    /**
     * Replaces the editor state with a copy of a recorded one, so later transactions cannot
     * mutate the history entry, and brings the form value up to date.
     * @param {object} state - The recorded state to restore.
     */
    _restore(state) { this._editor._state = webexpress.webui.EditorModel.clone(state); this._editor.render(true); this._editor._syncValue(); }

    /**
     * Releases the listeners and the pending timer of the history.
     */
    destroy() {
        const root = this._editor.getEditorElement();
        root.removeEventListener("keydown", this._keydown); root.removeEventListener("beforeinput", this._beforeinput);
        if (this._timer) this._editor.cancelDeferred(this._timer);
        this._timer = null; this.reset();
    }
};

/**
 * The rich text editor control. It coordinates input, transactions and rendering while the
 * model owns all content: every change goes through the reducer, and the DOM is only ever
 * rebuilt from the resulting state.
 */
webexpress.webui.EditorCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Initializes a new instance of the class. The host is emptied and rebuilt, and its form
     * name moves to a hidden input, so the posted value is always the serialized model.
     * @param {HTMLElement} element - The host element carrying the initial value as JSON state or HTML.
     */
    constructor(element) {
        super(element);
        this._listeners = []; this._timers = new Set(); this._destroyed = false; this._composing = false;
        this._uiContainer = element; this._formInput = null; this._savedRange = null;
        this._disabled = element.hasAttribute("disabled") || element.dataset.disabled === "true" || element.getAttribute("aria-disabled") === "true" || element.classList.contains("disabled") || element.classList.contains("wx-disabled");
        const raw = element.getAttribute("value") ?? element.getAttribute("data-wx-state") ?? (element.textContent?.trim().startsWith("{") ? element.textContent : element.innerHTML) ?? "";
        this._state = this._readValue(raw);
        this._view = new webexpress.webui.EditorView(this);
        this._formFieldName = element.getAttribute("name") || element.dataset.name;
        this.imageUploadUri = element.dataset.imageUploadUri || ""; this.imageBaseUri = element.dataset.imageBaseUri || "";
        element.removeAttribute("value"); element.removeAttribute("name"); element.removeAttribute("data-wx-state");
        element.innerHTML = ""; element.classList.add("wx-editor");
        if (!element.id) element.id = "wx-editor-" + (++webexpress.webui.EditorModel._nextId);
        if (this._formFieldName) {
            this._formInput = document.createElement("input"); this._formInput.type = "hidden"; this._formInput.name = this._formFieldName; element.appendChild(this._formInput);
        }
        this._plugins = webexpress.webui.EditorPlugins.getAll().map(plugin => Object.assign({}, plugin));
        this._createToolbar(element); this._createEditorArea(element); this._createStatusBar(element); this._initContextMenu();
        // the label the form rendered for the host id names nothing on a div; it names the surface
        this._adoptFieldLabel(this._editorElement, element.id, element);
        this._history = new webexpress.webui.EditorHistory(this);
        this._attachEventHandlers(); this._observeFieldsets(element);
        this._pluginCleanups = this._plugins.map(plugin => plugin.init?.(this)).filter(fn => typeof fn === "function");
        this.render(false); this._setupFormIntegration(); this._syncValue(false);
    }

    /**
     * Follows the disabled attribute of every fieldset the host sits in.
     *
     * A disabled fieldset disables the native fields inside it live, and the editor reads it the
     * same way - but the inert flags on its own DOM are only written when the state is applied.
     * A group re-enabled after the editor rendered inside it, which is what a form does around
     * loading its record, would otherwise leave the surface locked with nothing to unlock it.
     * @param {HTMLElement} element - The host element whose enclosing fieldsets are observed.
     */
    _observeFieldsets(element) {
        this._fieldsetObserver = new MutationObserver(() => { if (!this._destroyed) this._applyDisabled(); });
        for (let fieldset = element.closest("fieldset"); fieldset; fieldset = fieldset.parentElement?.closest("fieldset")) {
            this._fieldsetObserver.observe(fieldset, { attributes: true, attributeFilter: ["disabled"] });
        }
    }

    /**
     * Reads an initial or assigned value. JSON is taken as editor state and validated, any other
     * string is imported as HTML and sanitized, so no unchecked data becomes part of a document.
     * @param {object|string} value - The editor state or an HTML import.
     * @returns {object} A validated editor state.
     * @throws {TypeError} If the value is neither an object nor a string.
     */
    _readValue(value) {
        const Model = webexpress.webui.EditorModel;
        if (typeof value === "object" && value !== null) return webexpress.webui.EditorHtml.restoreContainers(Model.validate(value));
        if (typeof value !== "string") throw new TypeError("Editor value must be JSON state or an HTML import.");
        if (value.trim().startsWith("{")) return webexpress.webui.EditorHtml.restoreContainers(Model.validate(JSON.parse(value)));
        return this._sanitizeHtml(value).state;
    }

    /**
     * Imports HTML through the sanitizing reader, the one boundary every HTML path shares.
     * @param {string} html - The untrusted HTML.
     * @returns {object} The imported state together with its nodes.
     */
    _sanitizeHtml(html) { return webexpress.webui.EditorHtml.read(html); }

    /**
     * Returns a detached copy of the document. The selection is left out, because it is view
     * state and must not end up in a view state or a persisted value.
     * @returns {object} The version and the document.
     */
    getState() { return webexpress.webui.EditorModel.clone({ version: this._state.version, doc: this._state.doc }); }

    /**
     * Gets the document as detached state.
     * @returns {object} The version and the document.
     */
    get state() { return this.getState(); }

    /**
     * Sets the document, like setState with default options.
     * @param {object} value - The editor state to load.
     */
    set state(value) { this.setState(value); }

    /**
     * Loads an external state. It establishes a new history baseline, because undoing into the
     * previous record would be meaningless, and it shares no references with the caller. An
     * unchanged document is ignored, so a reload does not wipe the history.
     * @param {object} value - The editor state to load.
     * @param {object} [options] - The load options.
     * @param {boolean} [options.emit=true] - Whether a change event is raised.
     */
    setState(value, options = {}) {
        if (this._destroyed) return;
        const next = webexpress.webui.EditorModel.validate(value);
        if (JSON.stringify(next.doc) === JSON.stringify(this._state.doc)) return;
        this._state = next; this._savedRange = null; this._history.reset(); this.render(false); this._syncValue(options.emit !== false);
    }

    /**
     * Gets the serialized document, the value the form posts.
     * @returns {string} The document as JSON.
     */
    get value() { return JSON.stringify(this.getState()); }

    /**
     * Sets the document from JSON state or from an HTML import.
     * @param {string} value - The serialized state or the HTML.
     */
    set value(value) { this.setState(this._readValue(value)); }

    /**
     * Exports the document as HTML. HTML is an explicit interchange format only; the saved value
     * stays the JSON state.
     * @param {object} [options] - The export options.
     * @param {boolean} [options.layout=true] - False unwraps the regions and rows of the layout.
     * @returns {string} The rendered HTML.
     */
    exportHtml(options = {}) {
        const root = document.createElement("div"), view = new webexpress.webui.EditorView(this);
        view.render(this._state, root, true);
        if (options.layout === false) {
            root.querySelectorAll(".wx-editor-region,.wx-editor-row").forEach(element => {
                while (element.firstChild) element.parentNode.insertBefore(element.firstChild, element);
                element.remove();
            });
        }
        return root.innerHTML;
    }

    /**
     * Allows annotation removal as part of the editor's existing document editing permission.
     * @returns {boolean} Whether this surface supports comment deletion.
     */
    get deleteComments() { return true; }

    /**
     * Commits one validated action before any DOM or form value changes, so history, rendering
     * and form value always agree.
     * @param {object} action - The action to reduce.
     * @returns {boolean} True if the document changed.
     */
    dispatch(action) {
        if (this.disabled || this._destroyed || this._composing) return false;
        const next = webexpress.webui.EditorModel.reduce(this._state, action);
        const changed = this._history.record(action, this._state, next);
        this._state = next;
        this.render(true);
        if (changed) {
            this._syncValue();
            this._plugins.forEach(plugin => plugin.onTransaction?.(this, action));
        }
        return changed;
    }

    /**
     * Rebuilds the presentation from the state and then restores the indexed selection.
     * @param {boolean} [restore=false] - Whether focus and caret are put back into the surface.
     */
    render(restore = false) {
        if (this._destroyed || !this._editorElement || this._composing) return;
        this._view.render(this._state, this._editorElement);
        this._notifyPluginsContentChanged();
        this._applyDisabled();
        if (restore && !this.disabled) {
            const point = this._view.point(this._state.selection.focus);
            const element = point.node.nodeType === 3 ? point.node.parentElement : point.node;
            element.closest?.(".wx-editor-region")?.focus({ preventScroll: true });
            this._view.restore(this._state.selection);
        }
        this._savedRange = webexpress.webui.EditorSelection.getRange(this._editorElement);
        this._updateUndoRedoStates();
    }

    /**
     * Informs the plugins after each render, so previews and toolbar states follow the content.
     */
    _notifyPluginsContentChanged() { this._plugins.forEach(plugin => plugin.onContentChange?.(this)); }

    /**
     * Adds an event listener whose removal the editor owns, so plugins and internal handlers
     * share one teardown.
     * @param {EventTarget} target - The target to listen on.
     * @param {string} type - The event type.
     * @param {Function} handler - The listener.
     * @param {object|boolean} [options] - The listener options.
     * @returns {Function} A function removing the listener ahead of the teardown.
     */
    listen(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        const cleanup = () => target.removeEventListener(type, handler, options);
        this._listeners.push(cleanup); return cleanup;
    }

    /**
     * Schedules a callback that is dropped once the editor is destroyed, so no late timer
     * touches a torn-down surface.
     * @param {Function} callback - The callback to run.
     * @param {number} [delay=0] - The delay in milliseconds.
     * @returns {number} The timer handle for cancelDeferred.
     */
    defer(callback, delay = 0) {
        const timer = setTimeout(() => { this._timers.delete(timer); if (!this._destroyed) callback(); }, delay);
        this._timers.add(timer); return timer;
    }

    /**
     * Cancels a callback scheduled with defer.
     * @param {number} timer - The timer handle.
     */
    cancelDeferred(timer) { clearTimeout(timer); this._timers.delete(timer); }

    /**
     * Determines whether an event is input of the editor. Embedded form controls and independent
     * editable islands handle their own input, which the editor must not reduce.
     * @param {Event} event - The input, keyboard, clipboard or drag event.
     * @returns {boolean} True if the editor handles the event.
     */
    ownsInput(event) {
        if (this.disabled || this._destroyed) return false;
        const root = this._editorElement, target = event.target || root;
        if (!root.contains(target)) return false;
        for (let node = target.nodeType === 3 ? target.parentElement : target; node && node !== root; node = node.parentElement) {
            if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(node.tagName)) return false;
            const editable = node.getAttribute("contenteditable");
            if (editable === "true") return node.getAttribute("data-wx-editor-owned") === "true";
            if (editable === "false") return false;
        }
        return false;
    }

    /**
     * Wires the surface and toolbar events. The toolbar keeps the selection by cancelling the
     * mousedown on its buttons, and a disabled editor swallows all input in the capture phase.
     */
    _attachEventHandlers() {
        const root = this._editorElement, toolbar = this._uiContainer.querySelector(".wx-editor-toolbar");
        this.listen(toolbar, "mousedown", e => {
            this._saveCurrentSelection();
            if (e.target.closest("button") && !e.target.closest("input,textarea,select")) e.preventDefault();
        }, true);
        this.listen(this._uiContainer, "click", e => { if (this.disabled) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
        for (const type of ["keydown", "beforeinput", "paste", "cut", "drop", "compositionstart"]) this.listen(root, type, e => {
            if (this.disabled) { e.preventDefault(); e.stopImmediatePropagation(); }
        }, true);
        for (const type of ["blur", "mouseup", "keyup"]) this.listen(root, type, () => this._saveCurrentSelection());
        this.listen(root, "mouseup", () => {
            if (!this._paintMarks || this.disabled) return;
            const marks = this._paintMarks; this._paintMarks = null;
            this.dispatch({ type: "batch", source: "formatPainter", actions: [{ type: "format", mark: "removeformat" }, ...Object.entries(marks).map(([mark, value]) => ({ type: "format", mark, value }))] });
        });
        this.listen(document, "selectionchange", () => { if (!this._composing) this._saveCurrentSelection(); });
        this.listen(root, "keydown", e => this._onKeyDown(e));
        this.listen(root, "beforeinput", e => this._onBeforeInput(e));
        this.listen(root, "input", e => this._onInput(e));
        this.listen(root, "paste", e => this._onPaste(e));
        this.listen(root, "copy", e => this._onCopy(e, false));
        this.listen(root, "cut", e => this._onCopy(e, true));
        this.listen(root, "drop", e => this._onDrop(e));
        this.listen(root, "dragstart", e => this._onDragStart(e));
        this.listen(root, "dragenter", e => this._onDragOver(e));
        this.listen(root, "dragover", e => this._onDragOver(e));
        this.listen(root, "dragend", () => this._clearDrag());
        this.listen(root, "compositionstart", e => {
            if (!this.ownsInput(e) || e.defaultPrevented) return;
            this._saveCurrentSelection(); this._compositionSelection = { ...this._state.selection }; this._composing = true;
        });
        this.listen(root, "compositionend", e => {
            if (!this._composing) return;
            this._composing = false;
            // composition DOM is temporary; the committed text is reduced against its original model range
            this.dispatch({ type: "insertText", text: e.data || "", selection: this._compositionSelection, source: "composition" });
            this._compositionSelection = null;
            this._compositionEnded = true;
            this.defer(() => { this._compositionEnded = false; }, 0);
        });
    }

    /**
     * Handles the formatting shortcuts and the tab key. Tab inserts a tab character in code and
     * indents in lists; elsewhere it keeps moving the focus, so the surface is no keyboard trap.
     * @param {KeyboardEvent} e - The keydown event of the surface.
     */
    _onKeyDown(e) {
        if (!this.ownsInput(e) || e.defaultPrevented || e.isComposing || this._composing || e.altKey) return;
        const key = (e.key || "").toLowerCase();
        const command = (e.ctrlKey || e.metaKey) && !e.shiftKey ? { b: "bold", i: "italic", u: "underline" }[key] : null;
        if (command) { e.preventDefault(); this.execCommand(command); }
        else if (key === "tab" && !e.ctrlKey && !e.metaKey) {
            this._saveCurrentSelection();
            if (this._codeSelection() && !e.shiftKey) {
                e.preventDefault();
                this.dispatch({ type: "insertText", text: "\t", marks: {} });
                return;
            }
            const block = webexpress.webui.EditorModel.block(this._state.doc, this._state.selection.focus);
            if (block?.ancestors.some(n => n.type === "li")) { e.preventDefault(); this.execCommand(e.shiftKey ? "outdent" : "indent"); }
        }
    }

    /**
     * Translates native input into model actions. Cancelable input is prevented and reduced;
     * input the browser does not let go of is remembered and reconciled in _onInput.
     * @param {InputEvent} e - The beforeinput event of the surface.
     */
    _onBeforeInput(e) {
        if (!this.ownsInput(e) || e.defaultPrevented || e.isComposing || this._composing) return;
        if (["historyUndo", "historyRedo"].includes(e.inputType)) return;
        if (this._compositionEnded && ["insertFromComposition", "insertCompositionText"].includes(e.inputType)) { e.preventDefault(); return; }
        this._saveCurrentSelection();
        const target = e.getTargetRanges?.()[0];
        if (target) {
            const anchor = this._view.index(target.startContainer, target.startOffset), focus = this._view.index(target.endContainer, target.endOffset);
            if (anchor !== null && focus !== null) this._state.selection = { anchor, focus };
        }
        const formats = { formatBold: "bold", formatItalic: "italic", formatUnderline: "underline", formatStrikeThrough: "strikethrough", formatSuperscript: "superscript", formatSubscript: "subscript", formatRemove: "removeformat", formatFontColor: "forecolor", formatBackColor: "hilitecolor", formatFontName: "fontname", insertLink: "createlink" };
        if (e.cancelable === false) { this._nativeInput = { type: e.inputType, data: e.data, selection: { ...this._state.selection } }; return; }
        e.preventDefault();
        if (this._codeSelection() && ["insertParagraph", "insertLineBreak"].includes(e.inputType)) {
            this.dispatch({ type: "insertText", text: "\n", marks: {} });
            return;
        }
        if (formats[e.inputType]) { this.execCommand(formats[e.inputType], e.data); return; }
        if (["insertOrderedList", "insertUnorderedList", "insertHorizontalRule"].includes(e.inputType)) { this.execCommand(e.inputType); return; }
        if (["insertText", "insertReplacementText", "insertFromYank"].includes(e.inputType)) this.dispatch({ type: "insertText", text: e.data ?? e.dataTransfer?.getData("text/plain") ?? "", marks: this._codeSelection() ? {} : undefined });
        else if (e.inputType === "insertParagraph") this.dispatch({ type: "split" });
        else if (e.inputType === "insertLineBreak") this.dispatch({ type: "insertNodes", nodes: [webexpress.webui.EditorModel.node("br")] });
        else if (e.inputType?.startsWith("delete")) this.dispatch({ type: "delete", direction: e.inputType.endsWith("Forward") ? 1 : -1, unit: e.inputType.includes("Word") ? "word" : e.inputType.includes("Line") ? "line" : "grapheme" });
        else if (["insertFromPaste", "insertFromDrop"].includes(e.inputType) && e.dataTransfer) this._insertTransfer(e.dataTransfer);
    }

    /**
     * Reconciles input the browser applied natively by reducing the remembered action, or
     * re-renders, so the DOM matches the model again.
     * @param {InputEvent} e - The input event of the surface.
     */
    _onInput(e) {
        if (this._composing || e.isComposing || this._destroyed) return;
        const pending = this._nativeInput; this._nativeInput = null;
        if (pending && !this.disabled) {
            if (["insertText", "insertReplacementText"].includes(pending.type) && typeof (pending.data ?? e.data) === "string") this.dispatch({ type: "insertText", text: pending.data ?? e.data, selection: pending.selection });
            else if (pending.type.startsWith("delete")) this.dispatch({ type: "delete", direction: pending.type.endsWith("Forward") ? 1 : -1, selection: pending.selection });
            else this.render(true);
        } else this.render(false);
    }

    /**
     * Replaces the native paste with a sanitized import of the clipboard.
     * @param {ClipboardEvent} e - The paste event.
     */
    _onPaste(e) {
        if (!this.ownsInput(e) || e.defaultPrevented) return;
        e.preventDefault(); this._saveCurrentSelection(); if (e.clipboardData) this._insertTransfer(e.clipboardData);
    }
    /**
     * Normalizes external clipboard presentation without changing saved document imports.
     * @param {DataTransfer} transfer - The clipboard or external drop payload.
     */
    _insertTransfer(transfer) {
        if (this._codeSelection()) {
            this.dispatch({ type: "insertText", text: transfer.getData("text/plain").replace(/\r\n?/g, "\n"), marks: {}, source: "paste" });
            return;
        }
        const html = transfer.getData("text/html");
        if (html) {
            const input = webexpress.webui.EditorHtml.read(html, { clipboard: true });
            this.dispatch({ type: "insertNodes", nodes: input.nodes, source: "paste" });
        } else {
            const lines = transfer.getData("text/plain").replace(/\r\n?/g, "\n").split("\n");
            if (lines.length === 1) this.dispatch({ type: "insertText", text: lines[0] });
            else this.dispatch({ type: "insertNodes", nodes: lines.map(text => webexpress.webui.EditorModel.node("p", [{ type: "text", text, marks: {} }])) });
        }
    }

    /**
     * Writes the selection to the clipboard as rendered HTML and as plain text, because the
     * native copy would carry the editing chrome along.
     * @param {ClipboardEvent} e - The copy or cut event.
     * @param {boolean} cut - Whether the selection is deleted afterwards.
     */
    _onCopy(e, cut) {
        if (!this.ownsInput(e) || e.defaultPrevented || !e.clipboardData) return;
        this._saveCurrentSelection();
        const Model = webexpress.webui.EditorModel, [from, to] = Model.bounds(this._state);
        if (from === to) return;
        const blocks = Model.selectedBlocks(this._state).map(entry => ({ ...entry.node, children: Model.slice(entry.node.children, Math.max(0, from - entry.start), to - entry.start) }));
        const doc = Model.node("doc", blocks);
        const root = document.createElement("div"), view = new webexpress.webui.EditorView(this);
        view.render({ doc }, root, true);
        e.preventDefault(); e.clipboardData.setData("text/html", root.innerHTML);
        e.clipboardData.setData("text/plain", blocks.map(b => Model.leaves(b).map(n => n.type === "text" ? n.text : n.type === "br" ? "\n" : n.attrs?.text || "").join("")).join("\n"));
        if (cut) this.dispatch({ type: "delete", source: "cut" });
    }
    /**
     * Commits local movement or imports an external payload at its caret position.
     * @param {DragEvent} e - The browser drop event within this editor.
     */
    _onDrop(e) {
        if (this._draggedId) {
            e.preventDefault();
            const action = !this.disabled && this._dragAction(e);
            this._clearDrag();
            if (action) this.dispatch(action);
            return;
        }
        if (!this.ownsInput(e) || e.defaultPrevented || !e.dataTransfer) return;
        if (e.dataTransfer.types?.includes("application/x-webexpress-editor-node")) { e.preventDefault(); return; }
        const position = document.caretPositionFromPoint?.(e.clientX, e.clientY);
        const range = !position && document.caretRangeFromPoint?.(e.clientX, e.clientY);
        const index = position ? this._view.index(position.offsetNode, position.offset) : range ? this._view.index(range.startContainer, range.startOffset) : null;
        if (index === null) return;
        e.preventDefault(); this._state.selection = { anchor: index, focus: index }; this._insertTransfer(e.dataTransfer);
    }

    /**
     * Starts structural movement only from a handle, preserving normal text dragging.
     * @param {DragEvent} event - The browser drag event from this editor.
     */
    _onDragStart(event) {
        const handle = event.target.closest?.(".wx-editor-region-handle,.wx-addon-drag-handle,.wx-addon-inline-frame");
        if (!handle || !this._editorElement.contains(handle)) return;
        if (this.disabled || this._composing || !event.dataTransfer) { event.preventDefault(); return; }
        this._saveCurrentSelection();
        this._draggedId = this.nodeId(handle);
        event.dataTransfer.setData("application/x-webexpress-editor-node", this._draggedId);
        event.dataTransfer.effectAllowed = "move";
    }

    /**
     * Projects a drop into a layout or block transaction without changing live content.
     * @param {DragEvent} event - The pointer location and candidate target.
     * @returns {object|null} An action for a valid target inside the owning editor.
     */
    _dragAction(event) {
        const Model = webexpress.webui.EditorModel;
        const source = Model.find(this._state.doc, this._draggedId);
        const element = event.target.nodeType === 3 ? event.target.parentElement : event.target;
        if (!source || !this._editorElement.contains(element)) return null;
        const region = element.closest(".wx-editor-region");
        if (!region) return null;
        if (source.node.type === "addon" && source.node.attrs.inline) {
            const caret = document.caretPositionFromPoint?.(event.clientX, event.clientY);
            const range = !caret && document.caretRangeFromPoint?.(event.clientX, event.clientY);
            const node = caret?.offsetNode || range?.startContainer;
            if (!node || !this._editorElement.contains(node) || !webexpress.webui.EditorSelection.isEditable(node, this._editorElement)) return null;
            const position = this._view.index(node, caret ? caret.offset : range.startOffset);
            return position === null ? null : { type: "moveNode", id: source.node.id, position };
        }
        if (source.node.type === "region") {
            if (this.nodeId(region) === source.node.id) return null;
            const box = region.getBoundingClientRect();
            const placement = event.clientY < box.top + box.height / 4 ? "above"
                : event.clientY > box.bottom - box.height / 4 ? "below"
                : event.clientX < box.left + box.width / 2 ? "before" : "after";
            return { type: "layout", command: "moveRegion", regionId: source.node.id, targetId: this.nodeId(region), placement };
        }
        let target = this._view.entry(element);
        if (source.node.type === "addon" && ["td", "th"].includes(target?.node.type)) {
            target = Model.find(this._state.doc, target.node.children.at(-1).id);
        }
        if (!target || target.node.type === "region") {
            const node = Model.find(this._state.doc, this.nodeId(region)).node.children.at(-1);
            target = Model.find(this._state.doc, node.id);
        } else target = target.node.type === "text" ? Model.block(this._state.doc, target.start) : Model.find(this._state.doc, target.id || target.node.id);
        const containers = source.node.type === "addon" ? ["region", "addon", "td", "th"] : ["region", "addon"];
        while (target?.parent && !containers.includes(target.parent.type)) target = Model.find(this._state.doc, target.parent.id);
        if (!target?.parent || target.node.id === source.node.id || target.ancestors.includes(source.node)) return null;
        let block = element;
        while (block.parentElement && block !== region && this._view.map.get(block)?.id !== target.node.id) block = block.parentElement;
        while (block.parentElement && block.parentElement !== region && this.nodeId(block.parentElement) === target.node.id) block = block.parentElement;
        const box = block.getBoundingClientRect();
        return { type: "moveNode", id: source.node.id, targetId: target.node.id, after: element === region || event.clientY >= box.top + box.height / 2 };
    }

    /**
     * Advertises valid destinations while keeping the drag local to its editor.
     * @param {DragEvent} event - The current pointer position.
     */
    _onDragOver(event) {
        this._editorElement.querySelectorAll("[data-wx-drop]").forEach(node => node.removeAttribute("data-wx-drop"));
        if (!this._draggedId || this.disabled) return;
        const action = this._dragAction(event);
        if (!action) return;
        event.preventDefault(); event.dataTransfer.dropEffect = "move";
        if (!action.targetId) return;
        const target = Array.from(this._editorElement.querySelectorAll(".wx-editor-region,.wx-addon-frame,p,h1,h2,h3,h4,h5,h6,pre,ul,ol,blockquote"))
            .find(node => this.nodeId(node) === action.targetId);
        target?.setAttribute("data-wx-drop", action.placement || (action.after ? "below" : "above"));
    }

    /**
     * Clears the transient drag chrome after a drop or a cancellation, so no drop marker
     * outlives the gesture.
     */
    _clearDrag() {
        this._draggedId = null;
        this._editorElement.querySelectorAll("[data-wx-drop]").forEach(node => node.removeAttribute("data-wx-drop"));
    }

    /**
     * Captures the DOM selection as model indices. Stored marks are dropped once the caret
     * moved, because they belong to the position they were set at.
     */
    _saveCurrentSelection() {
        if (this._composing || this._destroyed) return;
        const selection = this._view.selection(this._editorElement);
        if (selection) {
            if (selection.anchor !== this._state.selection.anchor || selection.focus !== this._state.selection.focus) this._state.storedMarks = null;
            this._state.selection = selection;
            this._savedRange = webexpress.webui.EditorSelection.getRange(this._editorElement);
        }
    }

    /**
     * Puts the saved model selection back into the DOM, typically after a toolbar dialog.
     * @returns {boolean} True if the selection was restored.
     */
    restoreSavedRange() { if (this._destroyed || this.disabled) return false; this._view.restore(this._state.selection); return true; }
    /**
     * Restores the caret after cancellation when native dialog focus resets an editable root.
     * @param {HTMLDialogElement} dialog - The dialog taking focus away from this editor.
     * @param {object} [selection=this.selection] - The selection to keep if no edit is committed.
     */
    preserveDialogSelection(dialog, selection = this.selection) {
        const doc = this._state.doc;
        dialog.addEventListener("close", () => {
            if (!this._destroyed && this._state.doc === doc && !document.querySelector("dialog[open]")) this.selection = selection;
        }, { once: true });
    }

    /**
     * Gets a copy of the model selection.
     * @returns {{anchor: number, focus: number}} The selection indices.
     */
    get selection() { return { ...this._state.selection }; }

    /**
     * Sets the model selection after validating it against the document and shows it in the DOM.
     * @param {{anchor: number, focus: number}} value - The selection indices.
     */
    set selection(value) {
        const next = webexpress.webui.EditorModel.validate({ ...this._state, selection: value });
        this._state.selection = next.selection; this._state.storedMarks = null; this.restoreSavedRange();
    }

    /**
     * Runs a named command. Plugin commands take the same reducer path as typing and native
     * menus, so every command is undoable and reaches the form value.
     * @param {string} command - The command name, case-insensitive.
     * @param {*} [value=null] - The command argument, such as a color or a url.
     */
    execCommand(command, value = null) {
        if (this.disabled || this._destroyed) return;
        const cmd = String(command).toLowerCase();
        this._saveCurrentSelection();
        if (["undo", "redo"].includes(cmd)) { this._history[cmd](); return; }
        if (cmd === "comment") { this._plugins.find(plugin => typeof plugin.openComment === "function")?.openComment(this); return; }
        if (this._codeSelection() && cmd !== "inserttext") return;
        if (cmd === "formatpainter") {
            this._paintMarks = this._paintMarks ? null : webexpress.webui.EditorModel.activeMarks(this._state);
            if (this._paintMarks) delete this._paintMarks.comment;
            return;
        }
        const mark = this.constructor.formatMark(cmd);
        if (mark) { this.dispatch({ type: "format", mark, value: mark === "link" ? { href: value } : value }); return; }
        if (cmd === "inserttext") this.dispatch({ type: "insertText", text: value });
        else if (cmd === "inserthtml") this.insertHtmlAtCursor(value);
        else if (cmd === "inserthorizontalrule") this.dispatch({ type: "insertNodes", nodes: [webexpress.webui.EditorModel.node("hr")] });
        else if (["insertorderedlist", "insertunorderedlist", "indent", "outdent"].includes(cmd)) this.dispatch({ type: "list", command: cmd });
        else if (cmd === "formatblock") {
            const block = String(value).replace(/[<>]/g, "").toLowerCase();
            this.dispatch({ type: "block", block });
        } else if (cmd.startsWith("justify")) this.dispatch({ type: "block", attrs: { align: { justifyleft: "left", justifycenter: "center", justifyright: "right", justifyfull: "justify" }[cmd] } });
    }
    /**
     * Protects literal code input from rich text commands while retaining normal history.
     * @returns {boolean} Whether both selection endpoints belong to the same code add-on.
     */
    _codeSelection() {
        const Model = webexpress.webui.EditorModel;
        const [from, to] = Model.bounds(this._state);
        const codeAt = position => Model.block(this._state.doc, position)?.ancestors.findLast(node => node.type === "addon" && node.attrs.name === "code");
        const first = codeAt(from), last = codeAt(to > from ? to - 1 : to);
        return !!first && first === last;
    }

    /**
     * Maps a command name to the mark it applies. The names of the native execCommand are
     * accepted, so toolbars written against it keep working.
     * @param {string} command - The lower-case command name.
     * @returns {string|null} The mark name, or null for a command that is no formatting.
     */
    static formatMark(command) { return { forecolor: "color", hilitecolor: "background", backcolor: "background", fontname: "font", fontsize: "size", createlink: "link", unlink: "unlink", removeformat: "removeformat" }[command] || (webexpress.webui.EditorModel.MARKS.has(command) ? command : null); }

    /**
     * Determines whether a command is active at the selection, for the states of toolbar buttons.
     * @param {string} command - The command name, case-insensitive.
     * @returns {boolean} True if the command is active.
     */
    queryCommandState(command) {
        const cmd = String(command).toLowerCase(), Model = webexpress.webui.EditorModel;
        if (cmd === "formatpainter") return !!this._paintMarks;
        const mark = this.constructor.formatMark(cmd);
        if (mark) return Model.query(this._state, mark);
        const blocks = Model.selectedBlocks(this._state);
        if (["insertorderedlist", "insertunorderedlist"].includes(cmd)) return blocks.length > 0 && blocks.every(e => e.ancestors.some(n => n.type === (cmd === "insertorderedlist" ? "ol" : "ul")));
        return false;
    }
    /**
     * Imports HTML at the saved insertion range without depending on dialog focus.
     * @param {string} html - The HTML normalized at the editor input boundary.
     * @param {object} [selection=this.selection] - The model range replaced by the content.
     */
    insertHtmlAtCursor(html, selection = this.selection) { if (this.disabled || this._destroyed) return; const input = this._sanitizeHtml(html); this.dispatch({ type: "insertNodes", nodes: input.nodes, selection, source: "html" }); }

    /**
     * Resolves a rendered element to the id of its model node.
     * @param {Node} element - The rendered element.
     * @returns {string|undefined} The node id, or undefined for an element outside the model.
     */
    nodeId(element) { return this._view.entry(element)?.id; }

    /**
     * Removes a model node as a transaction, so plugin edits stay undoable.
     * @param {HTMLElement|string} element - The rendered element or the node id.
     * @returns {boolean} True if the document changed.
     */
    removeNode(element) { return this.dispatch({ type: "removeNode", id: typeof element === "string" ? element : this.nodeId(element) }); }

    /**
     * Updates the attributes and optionally the children of a model node as a transaction.
     * @param {HTMLElement|string} element - The rendered element or the node id.
     * @param {object} attrs - The attributes to apply.
     * @param {Array} [children] - The replacement children.
     * @returns {boolean} True if the document changed.
     */
    updateNode(element, attrs, children) { return this.dispatch({ type: "updateNode", id: typeof element === "string" ? element : this.nodeId(element), attrs, children }); }

    /**
     * Returns the editing surface, the root plugins attach their listeners to.
     * @returns {HTMLElement} The editing surface.
     */
    getEditorElement() { return this._editorElement; }

    /**
     * Gets whether the editor is disabled, on its own or by an enclosing disabled fieldset.
     * @returns {boolean} True if the editor is disabled.
     */
    get disabled() { return this._disabled || !!this._uiContainer.closest("fieldset[disabled]"); }

    /**
     * Sets the own disabled flag; an enclosing disabled fieldset still wins.
     * @param {boolean} value - True to disable the editor.
     */
    set disabled(value) { this._disabled = !!value; this._applyDisabled(); }
    /**
     * Applies the disabled state to the editing hosts, the frame controls, the toolbar and the
     * form input, so every part follows the state the form owns.
     */
    _applyDisabled() {
        const disabled = this.disabled;
        this._uiContainer.setAttribute("aria-disabled", String(disabled));
        this._editorElement.setAttribute("contenteditable", "false");
        this._editorElement.setAttribute("aria-disabled", String(disabled));
        this._editorElement.querySelectorAll("[data-wx-editor-owned]").forEach(el => el.setAttribute("contenteditable", String(!disabled)));
        this._editorElement.querySelectorAll(".wx-editor-frame-options,[data-frame-command],[data-addon-command],[data-table-command],[data-wx-selection-disabled]").forEach(el => { el.disabled = disabled || el.dataset.wxSelectionDisabled === "true"; });
        const toolbar = this._uiContainer.querySelector(".wx-editor-toolbar");
        toolbar.setAttribute("aria-disabled", String(disabled)); toolbar.inert = disabled;
        toolbar.querySelectorAll("button,input,select,textarea").forEach(el => { el.disabled = disabled; });
        this._editorElement.inert = disabled;
        if (this._formInput) this._formInput.disabled = disabled;
        this._updateUndoRedoStates();
    }

    /**
     * Writes the serialized document to the hidden form input and announces the change.
     * @param {boolean} [emit=true] - Whether a change event is raised.
     */
    _syncValue(emit = true) {
        if (this._destroyed) return;
        if (this._formInput) { this._formInput.value = this.value; this._formInput.disabled = this.disabled; }
        if (emit) this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this.getState() });
        this._updateUndoRedoStates();
    }

    /**
     * Syncs the form value once more on submit, so no pending change is lost.
     */
    _setupFormIntegration() { const form = this._uiContainer.closest("form"); if (form) this.listen(form, "submit", () => this._syncValue(false)); }

    /**
     * Creates the editing surface. The surface itself is not editable, only the regions the view
     * marks as owned are, which keeps the layout chrome out of the text.
     * @param {HTMLElement} element - The editor host.
     */
    _createEditorArea(element) {
        const container = document.createElement("div"); container.className = "wx-editor-container";
        this._editorElement = document.createElement("div"); this._editorElement.className = "wx-editor-content";
        this._editorElement.setAttribute("role", "group");
        this._editorElement.style.minHeight = "200px";
        container.appendChild(this._editorElement); element.appendChild(container);
    }

    /**
     * Enables the undo and redo buttons according to the history and the disabled state.
     */
    _updateUndoRedoStates() {
        for (const command of ["undo", "redo"]) {
            const button = this._uiContainer.querySelector('button[data-command="' + command + '"]');
            if (button) button.disabled = this.disabled || !this._history?.[command === "undo" ? "canUndo" : "canRedo"]();
        }
    }

    /**
     * Tears the editor down. Every owned callback is cancelled before the view and plugin
     * resources are released, so nothing fires into a destroyed editor.
     */
    destroy() {
        if (this._destroyed) return;
        this._destroyed = true; this._composing = false;
        this._clearDrag();
        this._history.destroy(); this._fieldsetObserver.disconnect();
        this._listeners.splice(0).forEach(cleanup => cleanup());
        this._timers.forEach(timer => clearTimeout(timer)); this._timers.clear();
        this._pluginCleanups.splice(0).forEach(cleanup => cleanup());
        this._contextMenu?.remove(); this._contextMenu = null;
        this._savedRange = null; this._compositionSelection = null; this._nativeInput = null;
        this._editorElement.setAttribute("contenteditable", "false");
        if (this._formInput) this._formInput.disabled = true;
        super.destroy();
    }
    /**
     * Groups layout actions in one menu alongside plugin and history controls.
     * @param {HTMLElement} element - The editor host receiving the toolbar.
     */
    _createToolbar(element) {
        const toolbar = document.createElement("div");
        toolbar.classList.add("wx-editor-toolbar");

        const plugins = this._plugins;
        plugins.forEach((plugin) => {
            if (typeof plugin.createToolbar === "function") {
                const group = plugin.createToolbar(this);
                if (group) {
                    toolbar.appendChild(group);
                }
            }
        });

        const historyGroup = this._createHistoryGroup();
        const regions = document.createElement("div");
        regions.className = "wx-editor-btn-group wx-editor-regions-toolbar";
        const toggle = document.createElement("button");
        toggle.type = "button"; toggle.className = "wx-editor-btn dropdown-toggle";
        toggle.title = webexpress.webui.I18N.translate("webexpress.webui:editor.region.menu");
        toggle.setAttribute("aria-label", toggle.title);
        const layoutIcon = document.createElement("i");
        layoutIcon.className = webexpress.webui.IconSet.resolve("ui-layout");
        layoutIcon.setAttribute("aria-hidden", "true");
        toggle.appendChild(layoutIcon);
        const menu = document.createElement("div"); menu.className = "dropdown-menu";
        for (const [command, icon, label] of [["addRow", "plus", "addrow"], ["addColumn", "plus", "addcolumn"], ["removeRegion", "trash", "remove"]]) {
            const button = document.createElement("button");
            button.type = "button"; button.className = "dropdown-item";
            button.title = webexpress.webui.I18N.translate("webexpress.webui:editor.region." + label);
            button.setAttribute("aria-label", button.title);
            button.dataset.layoutCommand = command;
            const drawing = document.createElement("i"); drawing.className = webexpress.webui.IconSet.resolve(icon); button.appendChild(drawing);
            const text = document.createElement("span"); text.textContent = button.title; button.appendChild(text);
            this.listen(button, "click", () => this.dispatch({ type: "layout", command }));
            menu.appendChild(button);
        }
        regions.appendChild(toggle); regions.appendChild(menu);
        webexpress.webui.NativeMenu.bind(toggle, menu);
        toolbar.appendChild(regions);
        toolbar.appendChild(historyGroup);
        element.appendChild(toolbar);
    }

    /**
     * Creates the trailing toolbar group with undo, redo and the fullscreen toggle.
     * @returns {HTMLElement} The group.
     */
    _createHistoryGroup() {
        const historyGroup = document.createElement("div");
        historyGroup.className = "wx-editor-btn-group";
        historyGroup.style.marginLeft = "auto";

        const undoBtn = this._createHistoryButton("undo", webexpress.webui.I18N.translate("webexpress.webui:editor.undo"), "undo");
        const redoBtn = this._createHistoryButton("redo", webexpress.webui.I18N.translate("webexpress.webui:editor.redo"), "redo");

        historyGroup.appendChild(undoBtn);
        historyGroup.appendChild(redoBtn);

        historyGroup.appendChild(this._createSeparator());
        historyGroup.appendChild(this._createFullscreenButton());

        return historyGroup;
    }

    /**
     * Creates a visual separator between toolbar groups.
     * @returns {HTMLElement} The separator.
     */
    _createSeparator() {
        const sep = document.createElement("span");
        sep.className = "wx-editor-separator";
        return sep;
    }

    /**
     * Creates the fullscreen toggle. The generic primary action handles it, addressing the
     * editor by its host id.
     * @returns {HTMLButtonElement} The toggle.
     */
    _createFullscreenButton() {
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.type = "button";
        btn.title = webexpress.webui.I18N.translate("webexpress.webui:fullscreen.toggle");
        btn.setAttribute("aria-label", btn.title);
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("data-wx-primary-action", "fullscreen");
        btn.setAttribute("data-wx-primary-target", "#" + this._uiContainer.id);
        btn.innerHTML = `<i class="${webexpress.webui.IconSet.resolve('expand')}"></i>`;
        return btn;
    }

    /**
     * Creates an undo or redo button.
     * @param {string} command - The history command, undo or redo.
     * @param {string} title - The translated title, which is also the accessible name.
     * @param {string} iconClass - The symbolic icon name.
     * @returns {HTMLButtonElement} The button.
     */
    _createHistoryButton(command, title, iconClass) {
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.title = title;
        btn.setAttribute("aria-label", title);
        btn.dataset.command = command;
        btn.innerHTML = `<i class="${webexpress.webui.IconSet.resolve(iconClass)}"></i>`;
        btn.type = "button";

        this.listen(btn, "click", () => {
            this.execCommand(command);
            this._updateUndoRedoStates();
        });

        return btn;
    }

    /**
     * Creates the status bar with the done button that leaves the fullscreen mode.
     * @param {HTMLElement} element - The editor host.
     */
    _createStatusBar(element) {
        const statusBar = document.createElement("div");
        statusBar.classList.add("wx-editor-status");

        // "done" button to leave fullscreen; only visible while the editor is in
        // (css) fullscreen via the .wx-editor-status visibility rules.
        const finishBtn = document.createElement("button");
        finishBtn.type = "button";
        finishBtn.className = "btn btn-primary btn-sm wx-editor-finish";
        finishBtn.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.done");
        finishBtn.setAttribute("data-wx-dismiss", "fullscreen");
        finishBtn.setAttribute("data-wx-target", "#" + this._uiContainer.id);
        statusBar.appendChild(finishBtn);

        element.appendChild(statusBar);
    }

    /**
     * Creates the context menu on the body, where no overflow of the form clips it, and hides
     * it on any click elsewhere.
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
        this.listen(document, "click", this._documentClickHandler);
    }
};

webexpress.webui.Controller.registerClass("wx-webui-editor", webexpress.webui.EditorCtrl);
