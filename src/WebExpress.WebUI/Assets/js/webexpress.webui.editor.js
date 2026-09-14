/** Selection helpers shared by view plugins; model indices own persistence. */
webexpress.webui.EditorSelection = class {
    static getRange(root) {
        const selection = window.getSelection();
        if (!selection?.rangeCount) return null;
        const range = selection.getRangeAt(0);
        return root?.contains(range.startContainer) && root.contains(range.endContainer) ? range : null;
    }
    static apply(range) { const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); }
    static isEditable(node, root) {
        for (let element = node?.nodeType === 3 ? node.parentElement : node; element && element !== root; element = element.parentElement) {
            if (element.getAttribute("contenteditable") === "true") return true;
            if (element.getAttribute("contenteditable") === "false") return false;
        }
        return root?.getAttribute("contenteditable") !== "false";
    }
};

/** History records completed model transactions, never DOM snapshots or delayed typing. */
webexpress.webui.EditorHistory = class {
    static MAX = 200;
    constructor(editor) {
        this._editor = editor; this._entries = []; this._index = 0; this._sequence = 0;
        this._keydown = e => this._onKeyDown(e);
        this._beforeinput = e => this._onBeforeInput(e);
        const root = editor.getEditorElement();
        root.addEventListener("keydown", this._keydown);
        root.addEventListener("beforeinput", this._beforeinput);
    }
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
    _onBeforeInput(e) {
        if (!this._editor.ownsInput(e) || e.defaultPrevented || e.isComposing || this._editor._composing) return;
        if (!["historyUndo", "historyRedo"].includes(e.inputType)) return;
        e.preventDefault();
        if (!this._suppress) this[e.inputType === "historyUndo" ? "undo" : "redo"]();
    }
    record(action, before, after) {
        const Model = webexpress.webui.EditorModel;
        if (JSON.stringify(before.doc) === JSON.stringify(after.doc)) return false;
        this._entries.splice(this._index);
        this._entries.push({ id: ++this._sequence, action: Model.clone(action), before: Model.clone(before), after: Model.clone(after) });
        if (this._entries.length > this.constructor.MAX) this._entries.shift();
        this._index = this._entries.length;
        return true;
    }
    reset() { this._entries = []; this._index = 0; }
    canUndo() { return this._index > 0; }
    canRedo() { return this._index < this._entries.length; }
    undo() { if (!this._editor.disabled && !this._editor._destroyed && this.canUndo()) this._restore(this._entries[--this._index].before); }
    redo() { if (!this._editor.disabled && !this._editor._destroyed && this.canRedo()) this._restore(this._entries[this._index++].after); }
    _restore(state) { this._editor._state = webexpress.webui.EditorModel.clone(state); this._editor.render(true); this._editor._syncValue(); }
    destroy() {
        const root = this._editor.getEditorElement();
        root.removeEventListener("keydown", this._keydown); root.removeEventListener("beforeinput", this._beforeinput);
        if (this._timer) this._editor.cancelDeferred(this._timer);
        this._timer = null; this.reset();
    }
};

/** Coordinates input, transactions and rendering while the model owns all content. */
webexpress.webui.EditorCtrl = class extends webexpress.webui.Ctrl {
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
        this._history = new webexpress.webui.EditorHistory(this);
        this._attachEventHandlers();
        this._pluginCleanups = this._plugins.map(plugin => plugin.init?.(this)).filter(fn => typeof fn === "function");
        this.render(false); this._setupFormIntegration(); this._syncValue(false);
    }

    /** Applies validation before data becomes part of an editor document. */
    _readValue(value) {
        const Model = webexpress.webui.EditorModel;
        if (typeof value === "object" && value !== null) return Model.validate(value);
        if (typeof value !== "string") throw new TypeError("Editor value must be JSON state or an HTML import.");
        if (value.trim().startsWith("{")) return Model.validate(JSON.parse(value));
        return this._sanitizeHtml(value).state;
    }
    _sanitizeHtml(html) { return webexpress.webui.EditorHtml.read(html); }

    /** Returns a detached document value suitable for ViewState and persistence. */
    getState() { return webexpress.webui.EditorModel.clone({ version: this._state.version, doc: this._state.doc }); }
    get state() { return this.getState(); }
    set state(value) { this.setState(value); }

    /** External state loads establish a new history baseline without sharing references. */
    setState(value, options = {}) {
        if (this._destroyed) return;
        const next = webexpress.webui.EditorModel.validate(value);
        if (JSON.stringify(next.doc) === JSON.stringify(this._state.doc)) return;
        this._state = next; this._savedRange = null; this._history.reset(); this.render(false); this._syncValue(options.emit !== false);
    }
    get value() { return JSON.stringify(this.getState()); }
    set value(value) { this.setState(this._readValue(value)); }

    /** HTML remains an explicit interchange format, separate from the saved document. */
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

    /** Commits one validated action before any DOM or form value changes. */
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

    /** Rebuilds presentation from state and then restores the indexed selection. */
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
    _notifyPluginsContentChanged() { this._plugins.forEach(plugin => plugin.onContentChange?.(this)); }

    /** Tracks listener ownership so plugins and internal handlers share one teardown. */
    listen(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        const cleanup = () => target.removeEventListener(type, handler, options);
        this._listeners.push(cleanup); return cleanup;
    }
    defer(callback, delay = 0) {
        const timer = setTimeout(() => { this._timers.delete(timer); if (!this._destroyed) callback(); }, delay);
        this._timers.add(timer); return timer;
    }
    cancelDeferred(timer) { clearTimeout(timer); this._timers.delete(timer); }

    /** Embedded form controls and independent editable islands own their own input. */
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

    _onKeyDown(e) {
        if (!this.ownsInput(e) || e.defaultPrevented || e.isComposing || this._composing || e.altKey) return;
        const key = (e.key || "").toLowerCase();
        const command = (e.ctrlKey || e.metaKey) && !e.shiftKey ? { b: "bold", i: "italic", u: "underline" }[key] : null;
        if (command) { e.preventDefault(); this.execCommand(command); }
        else if (key === "tab" && !e.ctrlKey && !e.metaKey) {
            this._saveCurrentSelection();
            const block = webexpress.webui.EditorModel.block(this._state.doc, this._state.selection.focus);
            if (block?.ancestors.some(n => n.type === "li")) { e.preventDefault(); this.execCommand(e.shiftKey ? "outdent" : "indent"); }
        }
    }

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
        if (formats[e.inputType]) { this.execCommand(formats[e.inputType], e.data); return; }
        if (["insertOrderedList", "insertUnorderedList", "insertHorizontalRule"].includes(e.inputType)) { this.execCommand(e.inputType); return; }
        if (["insertText", "insertReplacementText", "insertFromYank"].includes(e.inputType)) this.dispatch({ type: "insertText", text: e.data ?? e.dataTransfer?.getData("text/plain") ?? "" });
        else if (e.inputType === "insertParagraph") this.dispatch({ type: "split" });
        else if (e.inputType === "insertLineBreak") this.dispatch({ type: "insertNodes", nodes: [webexpress.webui.EditorModel.node("br")] });
        else if (e.inputType?.startsWith("delete")) this.dispatch({ type: "delete", direction: e.inputType.endsWith("Forward") ? 1 : -1, unit: e.inputType.includes("Word") ? "word" : e.inputType.includes("Line") ? "line" : "grapheme" });
        else if (["insertFromPaste", "insertFromDrop"].includes(e.inputType) && e.dataTransfer) this._insertTransfer(e.dataTransfer);
    }

    _onInput(e) {
        if (this._composing || e.isComposing || this._destroyed) return;
        const pending = this._nativeInput; this._nativeInput = null;
        if (pending && !this.disabled) {
            if (["insertText", "insertReplacementText"].includes(pending.type) && typeof (pending.data ?? e.data) === "string") this.dispatch({ type: "insertText", text: pending.data ?? e.data, selection: pending.selection });
            else if (pending.type.startsWith("delete")) this.dispatch({ type: "delete", direction: pending.type.endsWith("Forward") ? 1 : -1, selection: pending.selection });
            else this.render(true);
        } else this.render(false);
    }
    _onPaste(e) {
        if (!this.ownsInput(e) || e.defaultPrevented) return;
        e.preventDefault(); this._saveCurrentSelection(); if (e.clipboardData) this._insertTransfer(e.clipboardData);
    }
    _insertTransfer(transfer) {
        const html = transfer.getData("text/html");
        if (html) this.insertHtmlAtCursor(html);
        else {
            const lines = transfer.getData("text/plain").replace(/\r\n?/g, "\n").split("\n");
            if (lines.length === 1) this.dispatch({ type: "insertText", text: lines[0] });
            else this.dispatch({ type: "insertNodes", nodes: lines.map(text => webexpress.webui.EditorModel.node("p", [{ type: "text", text, marks: {} }])) });
        }
    }
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
    _onDrop(e) {
        if (!this.ownsInput(e) || e.defaultPrevented || !e.dataTransfer) return;
        if (e.dataTransfer.types?.includes("application/x-webexpress-editor-node")) return;
        const position = document.caretPositionFromPoint?.(e.clientX, e.clientY);
        const range = !position && document.caretRangeFromPoint?.(e.clientX, e.clientY);
        const index = position ? this._view.index(position.offsetNode, position.offset) : range ? this._view.index(range.startContainer, range.startOffset) : null;
        if (index === null) return;
        e.preventDefault(); this._state.selection = { anchor: index, focus: index }; this._insertTransfer(e.dataTransfer);
    }

    _saveCurrentSelection() {
        if (this._composing || this._destroyed) return;
        const selection = this._view.selection(this._editorElement);
        if (selection) {
            if (selection.anchor !== this._state.selection.anchor || selection.focus !== this._state.selection.focus) this._state.storedMarks = null;
            this._state.selection = selection;
            this._savedRange = webexpress.webui.EditorSelection.getRange(this._editorElement);
        }
    }
    restoreSavedRange() { if (this._destroyed || this.disabled) return false; this._view.restore(this._state.selection); return true; }
    get selection() { return { ...this._state.selection }; }
    set selection(value) {
        const next = webexpress.webui.EditorModel.validate({ ...this._state, selection: value });
        this._state.selection = next.selection; this._state.storedMarks = null; this.restoreSavedRange();
    }

    /** Keeps plugin commands on the same reducer path as typing and native menus. */
    execCommand(command, value = null) {
        if (this.disabled || this._destroyed) return;
        const cmd = String(command).toLowerCase();
        this._saveCurrentSelection();
        if (["undo", "redo"].includes(cmd)) { this._history[cmd](); return; }
        if (cmd === "formatpainter") { this._paintMarks = this._paintMarks ? null : webexpress.webui.EditorModel.activeMarks(this._state); return; }
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
    static formatMark(command) { return { forecolor: "color", hilitecolor: "background", backcolor: "background", fontname: "font", fontsize: "size", createlink: "link", unlink: "unlink", removeformat: "removeformat" }[command] || (webexpress.webui.EditorModel.MARKS.has(command) ? command : null); }
    queryCommandState(command) {
        const cmd = String(command).toLowerCase(), Model = webexpress.webui.EditorModel;
        if (cmd === "formatpainter") return !!this._paintMarks;
        const mark = this.constructor.formatMark(cmd);
        if (mark) return Model.query(this._state, mark);
        const blocks = Model.selectedBlocks(this._state);
        if (["insertorderedlist", "insertunorderedlist"].includes(cmd)) return blocks.length > 0 && blocks.every(e => e.ancestors.some(n => n.type === (cmd === "insertorderedlist" ? "ol" : "ul")));
        return false;
    }
    insertHtmlAtCursor(html) { if (this.disabled || this._destroyed) return; const input = this._sanitizeHtml(html); this.dispatch({ type: "insertNodes", nodes: input.nodes, source: "html" }); }
    nodeId(element) { return this._view.entry(element)?.id; }
    removeNode(element) { return this.dispatch({ type: "removeNode", id: typeof element === "string" ? element : this.nodeId(element) }); }
    updateNode(element, attrs, children) { return this.dispatch({ type: "updateNode", id: typeof element === "string" ? element : this.nodeId(element), attrs, children }); }
    getEditorElement() { return this._editorElement; }

    get disabled() { return this._disabled || !!this._uiContainer.closest("fieldset[disabled]"); }
    set disabled(value) { this._disabled = !!value; this._applyDisabled(); }
    _applyDisabled() {
        const disabled = this.disabled;
        this._uiContainer.setAttribute("aria-disabled", String(disabled));
        this._editorElement.setAttribute("contenteditable", "false");
        this._editorElement.setAttribute("aria-disabled", String(disabled));
        this._editorElement.querySelectorAll("[data-wx-editor-owned]").forEach(el => el.setAttribute("contenteditable", String(!disabled)));
        const toolbar = this._uiContainer.querySelector(".wx-editor-toolbar");
        toolbar.setAttribute("aria-disabled", String(disabled)); toolbar.inert = disabled;
        toolbar.querySelectorAll("button,input,select,textarea").forEach(el => { el.disabled = disabled; });
        this._editorElement.inert = disabled;
        if (this._formInput) this._formInput.disabled = disabled;
        this._updateUndoRedoStates();
    }
    _syncValue(emit = true) {
        if (this._destroyed) return;
        if (this._formInput) { this._formInput.value = this.value; this._formInput.disabled = this.disabled; }
        if (emit) this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this.getState() });
        this._updateUndoRedoStates();
    }
    _setupFormIntegration() { const form = this._uiContainer.closest("form"); if (form) this.listen(form, "submit", () => this._syncValue(false)); }
    _createEditorArea(element) {
        const container = document.createElement("div"); container.className = "wx-editor-container";
        this._editorElement = document.createElement("div"); this._editorElement.className = "wx-editor-content";
        this._editorElement.setAttribute("role", "group");
        this._editorElement.style.minHeight = "200px";
        container.appendChild(this._editorElement); element.appendChild(container);
    }
    _updateUndoRedoStates() {
        for (const command of ["undo", "redo"]) {
            const button = this._uiContainer.querySelector('button[data-command="' + command + '"]');
            if (button) button.disabled = this.disabled || !this._history?.[command === "undo" ? "canUndo" : "canRedo"]();
        }
    }

    /** Cancels every owned callback before removing view and plugin resources. */
    destroy() {
        if (this._destroyed) return;
        this._destroyed = true; this._composing = false;
        this._history.destroy();
        this._listeners.splice(0).forEach(cleanup => cleanup());
        this._timers.forEach(timer => clearTimeout(timer)); this._timers.clear();
        this._pluginCleanups.splice(0).forEach(cleanup => cleanup());
        this._contextMenu?.remove(); this._contextMenu = null;
        this._savedRange = null; this._compositionSelection = null; this._nativeInput = null;
        this._editorElement.setAttribute("contenteditable", "false");
        if (this._formInput) this._formInput.disabled = true;
        super.destroy();
    }
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
        for (const [command, icon, label] of [["addRow", "plus", "addrow"], ["addColumn", "plus", "addcolumn"], ["removeRegion", "trash", "remove"]]) {
            const button = document.createElement("button");
            button.type = "button"; button.className = "wx-editor-btn";
            button.title = webexpress.webui.I18N.translate("webexpress.webui:editor.region." + label);
            button.setAttribute("aria-label", button.title);
            button.dataset.layoutCommand = command;
            const drawing = document.createElement("i"); drawing.className = webexpress.webui.IconSet.resolve(icon); button.appendChild(drawing);
            const text = document.createElement("span"); text.textContent = button.title; button.appendChild(text);
            this.listen(button, "click", () => this.dispatch({ type: "layout", command }));
            regions.appendChild(button);
        }
        toolbar.appendChild(regions);
        toolbar.appendChild(historyGroup);
        element.appendChild(toolbar);
    }

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

    _createSeparator() {
        const sep = document.createElement("span");
        sep.className = "wx-editor-separator";
        return sep;
    }

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
