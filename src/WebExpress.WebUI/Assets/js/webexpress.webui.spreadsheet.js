/**
 * Registry for spreadsheet plugins. Toolbar groups, context menu entries and behaviours are
 * plugins, the way the editor's are, so a project adds its own without touching the control.
 */
webexpress.webui.SpreadsheetPlugins = new class {
    /**
     * Creates the registry.
     */
    constructor() { this._plugins = []; }

    /**
     * Registers a plugin. The position orders the toolbar groups.
     * Overloads: register(name, definition) with position 10, register(name, position, definition).
     * @param {string} name - The unique name.
     * @param {number|object} position - The position, or the definition.
     * @param {object} [definition] - { init(ctrl), createToolbar(ctrl), getContextMenuItems(ctrl,
     * context), onSelectionChange(ctrl), onChange(ctrl, changes) }.
     * @returns {this} The registry.
     */
    register(name, position, definition) {
        if (typeof position !== "number") { definition = position; position = 10; }
        if (!name || !definition) return this;
        this._plugins = this._plugins.filter(p => p.name !== name);
        this._plugins.push({ name, position, definition });
        this._plugins.sort((a, b) => a.position - b.position);
        return this;
    }

    /**
     * Removes a plugin; spreadsheets created afterwards no longer get it.
     * @param {string} name - The name.
     * @returns {boolean} True if a plugin was removed.
     */
    unregister(name) {
        const count = this._plugins.length;
        this._plugins = this._plugins.filter(p => p.name !== name);
        return this._plugins.length !== count;
    }

    /**
     * Returns the plugin definitions in position order.
     * @returns {Array<object>} The definitions.
     */
    getAll() { return this._plugins.map(p => p.definition); }
};

/**
 * The undo history of an unshared spreadsheet. An entry holds the operations of one
 * transaction and their inverse, never snapshots, so the history of a sheet with hundreds of
 * thousands of rows costs only what changed. Entries with the same merge key that follow each
 * other quickly - steps of one column resize, repeated clicks on "more decimals" - are merged
 * into one, so one undo takes back one intention.
 */
webexpress.webui.SpreadsheetHistory = class {
    /**
     * Initializes a new instance of the class.
     * @param {object} [options] - { limit: entries kept (default 500), mergeWindow: milliseconds
     * within which entries with equal merge keys merge (default 1000), now: the clock }.
     */
    constructor(options = {}) {
        this.limit = Math.max(1, options.limit ?? 500);
        this.mergeWindow = Math.max(0, options.mergeWindow ?? 1000);
        this._now = options.now ?? (() => Date.now());
        this._undo = []; this._redo = [];
    }

    /**
     * Records a transaction and discards the redo branch.
     * @param {object} entry - { redo, undo, label, mergeKey, before, after } with the operations,
     * a label for the user and the selections before and after.
     */
    record(entry) {
        const top = this._undo[this._undo.length - 1], now = this._now();
        if (entry.mergeKey && top?.mergeKey === entry.mergeKey && now - top.time <= this.mergeWindow) {
            top.redo = { type: "batch", ops: [top.redo, entry.redo] };
            top.undo = { type: "batch", ops: [entry.undo, top.undo] };
            top.after = entry.after; top.time = now;
        } else {
            this._undo.push({ ...entry, time: now });
            while (this._undo.length > this.limit) this._undo.shift();
        }
        this._redo = [];
    }

    /**
     * Determines whether an entry can be undone.
     * @returns {boolean} True if undo is available.
     */
    canUndo() { return this._undo.length > 0; }

    /**
     * Determines whether an entry can be redone.
     * @returns {boolean} True if redo is available.
     */
    canRedo() { return this._redo.length > 0; }

    /**
     * Takes the entry to undo.
     * @returns {object|null} The entry, moved to the redo stack.
     */
    popUndo() {
        const entry = this._undo.pop();
        if (entry) this._redo.push(entry);
        return entry ?? null;
    }

    /**
     * Takes the entry to redo.
     * @returns {object|null} The entry, moved to the undo stack.
     */
    popRedo() {
        const entry = this._redo.pop();
        if (entry) this._undo.push(entry);
        return entry ?? null;
    }

    /**
     * Ends merging, so the next change starts an entry of its own.
     */
    seal() { const top = this._undo[this._undo.length - 1]; if (top) top.mergeKey = null; }

    /**
     * Discards all entries.
     */
    clear() { this._undo = []; this._redo = []; }

    /**
     * Lists the labels of the entries, oldest first, for a history view.
     * @returns {{undo: Array<string>, redo: Array<string>}} The labels.
     */
    labels() { return { undo: this._undo.map(e => e.label), redo: this._redo.map(e => e.label).reverse() }; }
};

/**
 * The spreadsheet control. It coordinates the workbook model, the calculation engine and the
 * grid view: every change becomes an operation on the model, the change log of that operation
 * drives the recalculation, the rendering, the events, the history and the collaboration, and
 * nothing is ever read back from the DOM.
 */
webexpress.webui.SpreadsheetCtrl = class extends webexpress.webui.Ctrl {
    /**
     * The most cells a single formatting or clearing transaction touches cell by cell.
     */
    static MAX_CELLS = 200000;

    /**
     * The zoom levels offered.
     */
    static ZOOMS = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2];

    /**
     * Initializes a new instance of the class. The host is emptied and rebuilt; its form name
     * moves to a hidden input carrying the workbook as JSON.
     * @param {HTMLElement} element - The host carrying the workbook as JSON (value, data-wx-state
     * or text content) and the configuration as data attributes.
     */
    constructor(element) {
        super(element);
        this._listeners = []; this._timers = new Set(); this._destroyed = false;
        this._options = this._readOptions(element);
        this._disabled = element.hasAttribute("disabled") || element.getAttribute("data-disabled") === "true" || element.getAttribute("aria-disabled") === "true" || element.classList.contains("disabled");
        this._readOnly = this._options.readOnly;
        const raw = element.getAttribute("value") ?? element.getAttribute("data-wx-state") ?? (element.textContent?.trim().startsWith("{") ? element.textContent : "");
        this._model = this._readWorkbook(raw);
        this._engine = new webexpress.webui.SpreadsheetEngine(this._model);
        this._history = new webexpress.webui.SpreadsheetHistory({ limit: this._options.historyLimit, mergeWindow: this._options.historyMerge });
        this._sels = new Map();
        this._activeSheetId = this._model.sheet(this._options.activeSheet ?? this._model.activeSheet)?.id ?? this._model.sheets[0].id;
        this._formFieldName = element.getAttribute("name") || element.getAttribute("data-name");
        this._changeLog = [];
        element.removeAttribute("value"); element.removeAttribute("name"); element.removeAttribute("data-wx-state");
        element.textContent = "";
        element.classList.add("wx-spreadsheet");
        if (!element.id) element.id = "wx-spreadsheet-" + (++webexpress.webui.SpreadsheetCtrl._nextId);
        if (this._options.fill) element.classList.add("wx-spreadsheet-fill");
        if (this._formFieldName) {
            this._formInput = document.createElement("input");
            this._formInput.setAttribute("type", "hidden"); this._formInput.setAttribute("name", this._formFieldName);
            element.appendChild(this._formInput);
        }
        this._plugins = webexpress.webui.SpreadsheetPlugins.getAll().map(plugin => Object.assign({}, plugin));
        this._buildChrome(element);
        this._adoptFieldLabel(this._view.viewport, element.id, element);
        this._attachEventHandlers();
        this._pluginCleanups = this._plugins.map(plugin => plugin.init?.(this)).filter(fn => typeof fn === "function");
        this._unsubscribeFunctions = webexpress.webui.SpreadsheetFunctions.subscribe(name => {
            if (!this._destroyed && this._engine.uses(name)) this.recalculate();
        });
        this._view.zoom = this._options.zoom;
        this._view.measure();
        this._view.render();
        this._refreshChrome();
        this._syncValue(false);
        this._baseline = this.value;
        if (this._options.loadUri && !raw) this.load();
    }

    /**
     * Counts the hosts that got a generated id.
     */
    static _nextId = 0;

    // ------------------------------------------------------------------ configuration

    /**
     * Reads the configuration from the data attributes of the host.
     * @param {HTMLElement} element - The host.
     * @returns {object} The options.
     */
    _readOptions(element) {
        // the attributes are read rather than the dataset, which is the same in a browser and
        // also holds where attributes are set without a dataset mirror
        const data = new Proxy({}, { get: (_, key) => element.getAttribute("data-" + String(key).replace(/[A-Z]/g, ch => "-" + ch.toLowerCase())) ?? element.dataset?.[key] ?? undefined });
        const flag = (value, fallback) => (value === undefined ? fallback : value !== "false");
        const number = (value, fallback) => (Number.isFinite(Number(value)) && value !== "" && value !== undefined ? Number(value) : fallback);
        return {
            locale: data.locale || null,
            readOnly: data.readonly === "true" || element.hasAttribute("readonly"),
            toolbar: flag(data.toolbar, true),
            formulaBar: flag(data.formulaBar, true),
            sheetTabs: flag(data.sheetTabs, true),
            statusBar: flag(data.statusBar, true),
            rows: number(data.rows, webexpress.webui.SpreadsheetModel.DEFAULT_ROWS),
            cols: number(data.cols, webexpress.webui.SpreadsheetModel.DEFAULT_COLS),
            historyLimit: number(data.historyLimit, 500),
            historyMerge: number(data.historyMerge, 1000),
            zoom: Math.min(4, Math.max(0.25, number(data.zoom, 100) / 100)),
            loadUri: data.loadUri || null,
            saveUri: data.saveUri || null,
            saveMethod: (data.saveMethod || "PUT").toUpperCase(),
            autosave: number(data.autosave, 0),
            fill: data.fill === "true",
            activeSheet: data.activeSheet || null,
            userName: data.userName || ""
        };
    }

    /**
     * Reads the initial workbook, tolerating a broken value: a control renders what it can.
     * @param {string} raw - The JSON text.
     * @returns {webexpress.webui.SpreadsheetModel} The model.
     */
    _readWorkbook(raw) {
        const options = { rows: this._options.rows, cols: this._options.cols, sheetName: this._i18n("webexpress.webui:spreadsheet.sheet", "Sheet") + "1" };
        try { return webexpress.webui.SpreadsheetModel.fromJSON(raw || null, options); } catch (e) {
            console.warn("spreadsheet: the initial value is no workbook", e);
            return webexpress.webui.SpreadsheetModel.fromJSON(null, options);
        }
    }

    // ------------------------------------------------------------------ basic accessors

    /**
     * Gets the workbook model. Reading it is fine; change it only through the API or
     * applyOperation, which keep history, engine and view in step.
     * @returns {webexpress.webui.SpreadsheetModel} The model.
     */
    get model() { return this._model; }

    /**
     * Gets the calculation engine.
     * @returns {webexpress.webui.SpreadsheetEngine} The engine.
     */
    get engine() { return this._engine; }

    /**
     * Gets the active sheet.
     * @returns {webexpress.webui.SpreadsheetSheet} The sheet.
     */
    get sheet() { return this._model.sheet(this._activeSheetId) ?? this._model.sheets[0]; }

    /**
     * Gets the language whose conventions apply to input and display.
     * @returns {string} The language code.
     */
    get locale() { return this._options.locale || webexpress.webui.I18N?.language || "en"; }

    /**
     * Returns the focusable grid, the element plugins attach their listeners to, as the editor
     * returns its editing surface.
     * @returns {HTMLElement} The grid.
     */
    getEditorElement() { return this._view.viewport; }

    /**
     * Asks for a text in a small dialog of the page, never in a blocking browser prompt.
     * @param {string} label - The question.
     * @param {string} [value=""] - The suggested text.
     * @returns {Promise<string|null>} The text, or null when cancelled.
     */
    prompt(label, value = "") {
        return new Promise(resolve => {
            const dialog = document.createElement("dialog");
            dialog.className = "wx-spreadsheet-prompt";
            dialog.setAttribute("aria-label", label);
            const form = document.createElement("form");
            form.method = "dialog";
            const caption = document.createElement("label");
            caption.textContent = label;
            const input = document.createElement("input");
            input.setAttribute("type", "text");
            input.className = "form-control";
            input.value = value;
            caption.appendChild(input);
            const actions = document.createElement("div");
            actions.className = "wx-spreadsheet-comment-actions";
            const cancel = document.createElement("button");
            cancel.type = "button"; cancel.className = "btn btn-secondary btn-sm"; cancel.textContent = this.t("comment.cancel", "Cancel");
            const ok = document.createElement("button");
            ok.type = "submit"; ok.className = "btn btn-primary btn-sm"; ok.textContent = "OK";
            actions.append(cancel, ok);
            form.append(caption, actions);
            dialog.appendChild(form);
            let answer = null;
            const finish = () => { dialog.remove(); resolve(answer); this._view.viewport.focus({ preventScroll: true }); };
            cancel.addEventListener("click", () => dialog.close());
            form.addEventListener("submit", (e) => { e.preventDefault(); answer = input.value; dialog.close(); });
            dialog.addEventListener("close", finish, { once: true });
            document.body.appendChild(dialog);
            dialog.showModal?.();
            input.focus({ preventScroll: true });
        });
    }

    /**
     * Gets the internal selection of the active sheet: ranges, active cell, anchor and focus.
     * @returns {object} The selection.
     */
    get _sel() {
        let sel = this._sels.get(this.sheet.id);
        if (!sel) {
            sel = { ranges: [{ r1: 0, c1: 0, r2: 0, c2: 0 }], active: { row: 0, col: 0 }, anchor: { row: 0, col: 0 }, focus: { row: 0, col: 0 } };
            this._sels.set(this.sheet.id, sel);
        }
        return sel;
    }

    /**
     * Gets whether the spreadsheet is disabled, on its own or by an enclosing fieldset.
     * @returns {boolean} True if disabled.
     */
    get disabled() { return this._disabled || !!this._element.closest("fieldset[disabled]"); }

    /**
     * Sets the own disabled flag.
     * @param {boolean} value - True to disable.
     */
    set disabled(value) { this._disabled = !!value; this._refreshChrome(); }

    /**
     * Gets whether the content can be viewed but not changed.
     * @returns {boolean} True if read-only.
     */
    get readOnly() { return this._readOnly || this.disabled; }

    /**
     * Sets the read-only mode.
     * @param {boolean} value - True for read-only.
     */
    set readOnly(value) { this._readOnly = !!value; if (this._editing) this._cancelEdit(); this._refreshChrome(); }

    /**
     * Gets the zoom factor.
     * @returns {number} The factor, 1 for 100 %.
     */
    get zoom() { return this._view.zoom; }

    /**
     * Sets the zoom factor, between 25 % and 400 %.
     * @param {number} value - The factor.
     */
    set zoom(value) {
        const zoom = Math.min(4, Math.max(0.25, Number(value) || 1));
        if (zoom === this._view.zoom) return;
        if (this._editing) this._commitEdit();
        this._view.zoom = zoom;
        this._view.measure(); this._view.invalidate(); this._view.render();
        this._refreshChrome();
    }

    // ------------------------------------------------------------------ value and persistence

    /**
     * Gets the workbook as JSON text, the value the form posts. Formula cells carry their last
     * result, so the server reads values without a formula engine.
     * @returns {string} The workbook.
     */
    get value() { return JSON.stringify(this.getWorkbook()); }

    /**
     * Sets the workbook from JSON text or data. Writing back the current value changes nothing.
     * @param {string|object} value - The workbook.
     */
    set value(value) { this.setWorkbook(value); }

    /**
     * Gets whether the workbook holds no cell content at all.
     * @returns {boolean} True if empty.
     */
    get empty() { return this._model.sheets.every(sheet => !sheet.usedRange()); }

    /**
     * Returns the workbook as JSON data.
     * @param {object} [options] - { results: true to include formula results (default),
     * activeSheet: true to record the active sheet }.
     * @returns {object} The workbook.
     */
    getWorkbook(options = {}) {
        return this._model.toJSON({
            result: options.results === false ? null : (sheet, row, col) => this._engine.cellValue(sheet, row, col),
            activeSheet: options.activeSheet ? this.sheet.id : null
        });
    }

    /**
     * Loads a workbook. It replaces content, history and selections; loading the workbook
     * already shown changes nothing. While shared, the load travels to the others as a change.
     * @param {string|object} value - The workbook as JSON text or data.
     * @param {object} [options] - { emit: whether CHANGE_VALUE_EVENT is raised (default true) }.
     * @throws {TypeError|SyntaxError} If the value is no workbook.
     */
    setWorkbook(value, options = {}) {
        if (this._destroyed) return;
        const next = webexpress.webui.SpreadsheetModel.fromJSON(value, { rows: this._options.rows, cols: this._options.cols });
        const stable = model => webexpress.webui.Ot.stable(model.toJSON());
        if (stable(next) === stable(this._model)) return;
        if (this._editing) this._cancelEdit();
        if (this._collab) {
            // a program loading a workbook into a shared one replaces it for everyone: the new
            // sheets arrive under provisional names, the old ones leave, the names are restored
            const json = next.toJSON();
            const old = this._model.sheets.map(s => s.id);
            const added = json.sheets.map((sheet, index) => ({ ...sheet, id: this._model.newId("s"), name: "\u2060load" + this._model._counter + "-" + index }));
            this.batch(() => {
                added.forEach(sheet => this._commit({ type: "addSheet", sheet }));
                this._activeSheetId = added[0].id;
                old.forEach(id => this._commit({ type: "removeSheet", sheet: id }));
                added.forEach((sheet, index) => this._commit({ type: "renameSheet", sheet: sheet.id, name: json.sheets[index].name }));
                this._commit({ type: "names", value: json.names ?? {} });
                this._commit({ type: "styles", value: json.styles ?? {} });
                this._commit({ type: "meta", value: json.meta ?? {} });
            }, "load");
            return;
        }
        this._model = next;
        this._engine = new webexpress.webui.SpreadsheetEngine(next);
        this._history.clear();
        this._sels.clear();
        this._activeSheetId = next.sheet(next.activeSheet)?.id ?? next.sheets[0].id;
        this._clipboardRange = null;
        this._view.measure(); this._view.invalidate(); this._view.render();
        this._refreshChrome();
        this._syncValue(options.emit !== false);
    }

    /**
     * Gets whether the workbook differs from what was loaded or saved last.
     * @returns {boolean} True if changed.
     */
    get dirty() { return this.value !== this._baseline; }

    /**
     * Takes the current workbook as the new baseline.
     */
    markPristine() { this._baseline = this.value; }

    /**
     * Restores the baseline.
     */
    reset() { this.setWorkbook(this._baseline); }

    /**
     * Loads the workbook from the load address (data-load-uri) through the transport.
     * @param {string} [uri] - The address; the configured one when omitted.
     * @returns {Promise<object>} The normalized result { ok, status, data, error }.
     */
    async load(uri) {
        const url = uri || this._options.loadUri;
        if (!url) throw new Error("The spreadsheet has no load address.");
        this._dispatch(webexpress.webui.Event.DATA_REQUESTED_EVENT, { action: "load" });
        this._dispatch(webexpress.webui.Event.TASK_START_EVENT, { name: "load" });
        const result = await webexpress.webui.Transport.request(url, { method: "GET", headers: { Accept: "application/json" } });
        this._dispatch(webexpress.webui.Event.TASK_FINISH_EVENT, { name: "load" });
        if (this._destroyed) return result;
        if (result.ok) {
            try {
                this.setWorkbook(typeof result.data === "string" ? result.data : result.data ?? null, { emit: true });
                this.markPristine();
                this._dispatch(webexpress.webui.Event.DATA_ARRIVED_EVENT, { action: "load" });
            } catch (e) {
                const error = { kind: "parse", status: result.status, message: e.message, retriable: false };
                this._dispatch(webexpress.webui.Event.DATA_ERROR_EVENT, { action: "load", error });
                return { ...result, ok: false, error };
            }
        } else if (result.error?.kind !== "abort") {
            this._dispatch(webexpress.webui.Event.DATA_ERROR_EVENT, { action: "load", error: result.error });
        }
        return result;
    }

    /**
     * Saves the workbook to the save address (data-save-uri) as JSON, following the saving side
     * of the control contract: the save is announced cancelable, the workbook is locked while
     * the request is out, and only a stored workbook becomes the new baseline.
     * @returns {Promise<object>} The normalized result { ok, status, data, error }.
     */
    async save() {
        const url = this._options.saveUri;
        if (!url) throw new Error("The spreadsheet has no save address.");
        if (this._saving) return webexpress.webui.Transport.fail("abort", 0, "a save is already running", false);
        if (this._editing) this._commitEdit();
        const payload = this.getWorkbook();
        const before = this._dispatch(webexpress.webui.Event.BEFORE_SAVE_EVENT, { action: "save", payload }, { cancelable: true });
        if (before.defaultPrevented) return webexpress.webui.Transport.fail("abort", 0, "the save was cancelled", false);
        const body = JSON.stringify(before.detail?.payload ?? payload);
        this._saving = true;
        const wasReadOnly = this._readOnly;
        this._readOnly = true; this._refreshChrome();
        this._dispatch(webexpress.webui.Event.TASK_START_EVENT, { name: "save" });
        let result;
        try {
            result = await webexpress.webui.Transport.request(url, { method: this._options.saveMethod, headers: { "Content-Type": "application/json", Accept: "application/json" }, body });
        } finally {
            this._saving = false;
            this._readOnly = wasReadOnly;
            this._dispatch(webexpress.webui.Event.TASK_FINISH_EVENT, { name: "save" });
            this._refreshChrome();
        }
        if (result.ok) {
            this._baseline = this.value;
            this._dispatch(webexpress.webui.Event.SAVED_EVENT, { action: "save", data: result.data, status: result.status });
            this._announce(this._i18n("webexpress.webui:spreadsheet.saved", "Saved"));
        } else if (result.error?.kind !== "abort") {
            this._dispatch(webexpress.webui.Event.DATA_ERROR_EVENT, { action: "save", error: result.error });
        }
        return result;
    }

    // ------------------------------------------------------------------ references

    /**
     * Resolves a reference given in any of the forms the API accepts: "B2", "A1:C3", "A:A",
     * "Sheet2!B2", a named range, { row, col }, { r1, c1, r2, c2 } with an optional sheet.
     * @param {*} ref - The reference; the selection when omitted.
     * @param {string} [sheetKey] - The sheet id or name; the active sheet when omitted.
     * @returns {{sheet: webexpress.webui.SpreadsheetSheet, range: object}} The sheet and the range.
     * @throws {RangeError} If the reference names nothing.
     */
    resolve(ref, sheetKey) {
        const Address = webexpress.webui.SpreadsheetAddress;
        let sheet = sheetKey !== undefined && sheetKey !== null ? this._model.sheet(sheetKey) : this.sheet;
        if (!sheet) throw new RangeError("Unknown sheet: " + sheetKey);
        let range;
        if (ref === undefined || ref === null) {
            const last = this._sel.ranges[this._sel.ranges.length - 1];
            return { sheet: this.sheet, range: { ...last } };
        }
        if (typeof ref === "string") {
            const named = this._model.names[ref] ?? Object.entries(this._model.names).find(([name]) => name.toLowerCase() === ref.toLowerCase())?.[1];
            const parsed = Address.parseRange(named ?? ref);
            if (!parsed) throw new RangeError("Invalid reference: " + ref);
            if (parsed.sheet) {
                sheet = this._model.sheet(parsed.sheet);
                if (!sheet) throw new RangeError("Unknown sheet: " + parsed.sheet);
            }
            range = { r1: parsed.r1, c1: parsed.c1, r2: parsed.r2, c2: parsed.c2 };
        } else if (typeof ref === "object") {
            if (ref.sheet) { sheet = this._model.sheet(ref.sheet); if (!sheet) throw new RangeError("Unknown sheet: " + ref.sheet); }
            range = Number.isInteger(ref.row) ? { r1: ref.row, c1: ref.col, r2: ref.row, c2: ref.col } : Address.normalize(ref);
        } else throw new RangeError("Invalid reference.");
        range.r2 = Math.min(range.r2, sheet.rowCount - 1); range.c2 = Math.min(range.c2, sheet.colCount - 1);
        if (![range.r1, range.c1, range.r2, range.c2].every(Number.isInteger) || range.r1 < 0 || range.c1 < 0 || range.r1 > range.r2 || range.c1 > range.c2) {
            throw new RangeError("Reference outside the sheet: " + JSON.stringify(ref));
        }
        return { sheet, range };
    }

    // ------------------------------------------------------------------ sheets

    /**
     * Lists the sheets in tab order.
     * @returns {Array<{id: string, name: string, index: number, rowCount: number, colCount: number}>} The sheets.
     */
    get sheets() { return this._model.sheets.map((s, index) => ({ id: s.id, name: s.name, index, rowCount: s.rowCount, colCount: s.colCount })); }

    /**
     * Gets the name of the active sheet.
     * @returns {string} The name.
     */
    get activeSheet() { return this.sheet.name; }

    /**
     * Activates a sheet.
     * @param {string} key - The id or name.
     */
    set activeSheet(key) { this.activateSheet(key); }

    /**
     * Activates a sheet.
     * @param {string} key - The id or name.
     * @returns {boolean} True if the sheet exists.
     */
    activateSheet(key) {
        const sheet = this._model.sheet(key);
        if (!sheet) return false;
        if (sheet.id === this._activeSheetId) return true;
        if (this._editing && !this._editing.formula) this._commitEdit();
        this._activeSheetId = sheet.id;
        this._view.measure(); this._view.invalidate(); this._view.render();
        this._refreshChrome();
        this._dispatch(webexpress.webui.Event.SPREADSHEET_SHEET_ACTIVATED_EVENT, { sheet: sheet.name, sheetId: sheet.id });
        this._selectionChanged();
        return true;
    }

    /**
     * Returns information about a sheet.
     * @param {string} key - The id or name.
     * @returns {object|null} { id, name, index, rowCount, colCount, frozenRows, frozenCols }.
     */
    getSheet(key) {
        const sheet = this._model.sheet(key);
        return sheet ? { id: sheet.id, name: sheet.name, index: this._model.sheetIndex(sheet.id), rowCount: sheet.rowCount, colCount: sheet.colCount, frozenRows: sheet.frozenRows, frozenCols: sheet.frozenCols } : null;
    }

    /**
     * Adds a sheet.
     * @param {string} [name] - The name; a free "SheetN" when omitted.
     * @param {object} [options] - { index, rows, cols, data, activate (default true) }.
     * @returns {string|null} The id of the new sheet, or null when read-only.
     */
    addSheet(name, options = {}) {
        if (this.readOnly) return null;
        const base = this._i18n("webexpress.webui:spreadsheet.sheet", "Sheet");
        const finalName = name ? this._model.freeSheetName(String(name)) : this._model.uniqueSheetName(base);
        const id = this._model.newId("s");
        const sheet = { id, name: finalName, rowCount: options.rows || this._options.rows, colCount: options.cols || this._options.cols };
        if (options.data) sheet.data = options.data;
        if (!this._commit({ type: "addSheet", sheet, index: options.index }, { label: "addSheet" })) return null;
        if (options.activate !== false) this.activateSheet(id);
        return id;
    }

    /**
     * Renames a sheet; references written with the old name follow.
     * @param {string} key - The id or name.
     * @param {string} name - The new name.
     * @returns {boolean} True if renamed.
     */
    renameSheet(key, name) {
        const sheet = this._model.sheet(key);
        if (!sheet || !this._model.isValidSheetName(String(name ?? "").trim(), sheet.id)) return false;
        return this._commit({ type: "renameSheet", sheet: sheet.id, name: String(name).trim() }, { label: "renameSheet" });
    }

    /**
     * Copies a sheet with all its content, behind the original.
     * @param {string} key - The id or name.
     * @param {string} [name] - The name of the copy; "Name (2)" when omitted.
     * @returns {string|null} The id of the copy.
     */
    copySheet(key, name) {
        const sheet = this._model.sheet(key);
        if (!sheet || this.readOnly) return null;
        const json = this._model.sheetToJSON(sheet);
        json.id = this._model.newId("s");
        json.name = this._model.freeSheetName(name || sheet.name);
        if (!this._commit({ type: "addSheet", sheet: json, index: this._model.sheetIndex(sheet.id) + 1 }, { label: "copySheet" })) return null;
        this.activateSheet(json.id);
        return json.id;
    }

    /**
     * Moves a sheet to another tab position.
     * @param {string} key - The id or name.
     * @param {number} index - The new position.
     * @returns {boolean} True if moved.
     */
    moveSheet(key, index) {
        const sheet = this._model.sheet(key);
        if (!sheet) return false;
        return this._commit({ type: "moveSheet", sheet: sheet.id, index }, { label: "moveSheet" });
    }

    /**
     * Removes a sheet. The last sheet cannot be removed.
     * @param {string} key - The id or name.
     * @returns {boolean} True if removed.
     */
    removeSheet(key) {
        const sheet = this._model.sheet(key);
        if (!sheet || this._model.sheets.length < 2) return false;
        const index = this._model.sheetIndex(sheet.id);
        if (sheet.id === this._activeSheetId) {
            const next = this._model.sheets[index + 1] ?? this._model.sheets[index - 1];
            this.activateSheet(next.id);
        }
        return this._commit({ type: "removeSheet", sheet: sheet.id }, { label: "removeSheet" });
    }

    /**
     * Sets the tab color of a sheet.
     * @param {string} key - The id or name.
     * @param {string|null} color - The color, or null to remove it.
     * @returns {boolean} True if set.
     */
    setSheetColor(key, color) {
        const sheet = this._model.sheet(key);
        if (!sheet) return false;
        const props = { ...sheet.props };
        if (color) props.tabColor = color; else delete props.tabColor;
        return this._commit({ type: "sheetProps", sheet: sheet.id, props }, { label: "sheetColor" });
    }

    // ------------------------------------------------------------------ cells

    /**
     * Returns everything about a cell.
     * @param {*} ref - The cell reference.
     * @param {string} [sheetKey] - The sheet.
     * @returns {object} { ref, value, formula, display, type, style, comment, meta }.
     */
    getCell(ref, sheetKey) {
        const { sheet, range } = this.resolve(ref, sheetKey);
        const cell = sheet.getCell(range.r1, range.c1);
        const style = webexpress.webui.SpreadsheetModel.effectiveStyle(this._model, sheet, range.r1, range.c1);
        const value = this._engine.cellValue(sheet, range.r1, range.c1);
        return {
            ref: webexpress.webui.SpreadsheetAddress.cellName(range.r1, range.c1),
            sheet: sheet.name,
            value: this._publicValue(value), formula: cell?.f ?? null,
            display: webexpress.webui.SpreadsheetFormat.display(value, cell, style, this.locale).text,
            type: cell?.t ?? (value instanceof webexpress.webui.SpreadsheetError ? "error" : value === null ? "empty" : typeof value),
            style: webexpress.webui.SpreadsheetModel._copy(cell?.s ?? {}), cellStyle: cell?.st ?? null,
            comment: cell?.c ? { ...cell.c } : null, meta: cell?.m ? webexpress.webui.SpreadsheetModel._copy(cell.m) : null,
            raw: cell ? webexpress.webui.SpreadsheetModel._copy(cell) : null
        };
    }

    /**
     * Converts an engine value for callers: errors become their code.
     * @param {*} value - The value.
     * @returns {*} The value.
     */
    _publicValue(value) { return value instanceof webexpress.webui.SpreadsheetError ? value.code : value; }

    /**
     * Returns the value of a cell; for a formula its result, for an error its code.
     * @param {*} ref - The cell reference.
     * @param {string} [sheetKey] - The sheet.
     * @returns {*} The value.
     */
    getValue(ref, sheetKey) {
        const { sheet, range } = this.resolve(ref, sheetKey);
        return this._publicValue(this._engine.cellValue(sheet, range.r1, range.c1));
    }

    /**
     * Returns what a cell shows.
     * @param {*} ref - The cell reference.
     * @param {string} [sheetKey] - The sheet.
     * @returns {string} The text.
     */
    getDisplay(ref, sheetKey) { return this.getCell(ref, sheetKey).display; }

    /**
     * Returns the formula of a cell.
     * @param {*} ref - The cell reference.
     * @param {string} [sheetKey] - The sheet.
     * @returns {string|null} The formula.
     */
    getFormula(ref, sheetKey) {
        const { sheet, range } = this.resolve(ref, sheetKey);
        return sheet.getCell(range.r1, range.c1)?.f ?? null;
    }

    /**
     * Sets the value of a cell, keeping its format and comment. A string is read like typed
     * input unless options.raw is set: "=SUM(A1:A3)" becomes a formula, "15%" a percentage.
     * @param {*} ref - The cell reference.
     * @param {*} value - The value: number, string, boolean, Date or null.
     * @param {object} [options] - { raw: store a string as text, sheet }.
     * @returns {boolean} True if the cell changed.
     */
    setValue(ref, value, options = {}) {
        const { sheet, range } = this.resolve(ref, options.sheet);
        const cell = this._cellFromInput(sheet, range.r1, range.c1, value, options);
        return this._commit({ type: "set", sheet: sheet.id, cells: [{ row: range.r1, col: range.c1, cell }] }, { label: "setValue" });
    }

    /**
     * Sets the formula of a cell.
     * @param {*} ref - The cell reference.
     * @param {string} formula - The formula, with or without "=".
     * @param {object} [options] - { sheet }.
     * @returns {boolean} True if the cell changed.
     */
    setFormula(ref, formula, options = {}) {
        const text = String(formula ?? "");
        return this.setValue(ref, text.startsWith("=") ? text : "=" + text, options);
    }

    /**
     * Replaces a cell with a cell object { v, f, t, s, st, c, m }.
     * @param {*} ref - The cell reference.
     * @param {object|null} cell - The cell; null clears it.
     * @param {object} [options] - { sheet }.
     * @returns {boolean} True if the cell changed.
     */
    setCell(ref, cell, options = {}) {
        const { sheet, range } = this.resolve(ref, options.sheet);
        return this._commit({ type: "set", sheet: sheet.id, cells: [{ row: range.r1, col: range.c1, cell }] }, { label: "setCell" });
    }

    /**
     * Returns the values of a range as rows.
     * @param {*} ref - The range.
     * @param {object} [options] - { sheet, display: return shown texts, formulas: return formulas
     * instead of their results }.
     * @returns {Array<Array<*>>} The values.
     */
    getRange(ref, options = {}) {
        const { sheet, range } = this.resolve(ref, options.sheet);
        const last = sheet.usedRange();
        const r2 = Math.min(range.r2, last ? last.r2 : range.r1), c2 = Math.min(range.c2, last ? last.c2 : range.c1);
        const out = [];
        for (let r = range.r1; r <= Math.max(range.r1, r2); r++) {
            const row = [];
            for (let c = range.c1; c <= Math.max(range.c1, c2); c++) {
                const cell = sheet.getCell(r, c);
                if (options.formulas && cell?.f) row.push(cell.f);
                else if (options.display) {
                    const value = this._engine.cellValue(sheet, r, c);
                    row.push(webexpress.webui.SpreadsheetFormat.display(value, cell, webexpress.webui.SpreadsheetModel.effectiveStyle(this._model, sheet, r, c), this.locale).text);
                } else row.push(this._publicValue(this._engine.cellValue(sheet, r, c)));
            }
            out.push(row);
        }
        return out;
    }

    /**
     * Writes rows of values into a range starting at its top-left cell, as one undo step. The
     * sheet grows when the values reach beyond it.
     * @param {*} ref - The start cell or range.
     * @param {Array<Array<*>>} values - The values; strings are read like typed input.
     * @param {object} [options] - { sheet, raw }.
     * @returns {boolean} True if anything changed.
     */
    setRange(ref, values, options = {}) {
        const { sheet, range } = this.resolve(ref, options.sheet);
        if (!Array.isArray(values)) throw new TypeError("Values must be an array of rows.");
        const rows = values.length, cols = Math.max(0, ...values.map(r => (Array.isArray(r) ? r.length : 0)));
        return this.batch(() => {
            this._ensureSize(sheet, range.r1 + rows, range.c1 + cols);
            const cells = [];
            values.forEach((row, r) => (Array.isArray(row) ? row : []).forEach((value, c) => {
                cells.push({ row: range.r1 + r, col: range.c1 + c, cell: this._cellFromInput(sheet, range.r1 + r, range.c1 + c, value, options) });
            }));
            this._commit({ type: "set", sheet: sheet.id, cells });
        }, "setRange");
    }

    /**
     * Clears a range.
     * @param {*} [ref] - The range; the selection when omitted.
     * @param {string} [what="contents"] - "contents" (values and formulas), "formats",
     * "comments" or "all".
     * @param {object} [options] - { sheet }.
     * @returns {boolean} True if anything changed.
     */
    clear(ref, what = "contents", options = {}) {
        const targets = ref === undefined || ref === null ? this._sel.ranges.map(range => ({ sheet: this.sheet, range })) : [this.resolve(ref, options.sheet)];
        return this.batch(() => {
            for (const { sheet, range } of targets) {
                const cells = [];
                this._forEachStored(sheet, range, (cell, row, col) => {
                    let next = null;
                    if (what === "contents") { next = { ...cell }; delete next.v; delete next.f; }
                    else if (what === "formats") { next = { ...cell }; delete next.s; delete next.st; }
                    else if (what === "comments") { next = { ...cell }; delete next.c; }
                    cells.push({ row, col, cell: next });
                });
                if (cells.length) this._commit({ type: "set", sheet: sheet.id, cells });
            }
        }, "clear-" + what);
    }

    /**
     * Sets, changes or removes the comment of a cell.
     * @param {*} ref - The cell reference.
     * @param {string|null} text - The comment; empty or null removes it.
     * @param {object} [options] - { sheet, author }.
     * @returns {boolean} True if changed.
     */
    setComment(ref, text, options = {}) {
        const { sheet, range } = this.resolve(ref, options.sheet);
        const cell = { ...sheet.getCell(range.r1, range.c1) };
        if (text && String(text).trim()) cell.c = { text: String(text), author: options.author ?? this._options.userName ?? "", time: new Date().toISOString() };
        else delete cell.c;
        if (!cell.c?.author) delete cell.c?.author;
        return this._commit({ type: "set", sheet: sheet.id, cells: [{ row: range.r1, col: range.c1, cell }] }, { label: "comment" });
    }

    /**
     * Returns the comment of a cell.
     * @param {*} ref - The cell reference.
     * @param {string} [sheetKey] - The sheet.
     * @returns {object|null} { text, author, time }.
     */
    getComment(ref, sheetKey) { return this.getCell(ref, sheetKey).comment; }

    /**
     * Gives a range a custom cell type (see SpreadsheetTypes), such as "checkbox".
     * @param {*} ref - The range.
     * @param {string|null} type - The type, or null for plain values.
     * @param {object} [meta] - Data the type reads, such as { options: [...] } for a list.
     * @returns {boolean} True if changed.
     */
    setType(ref, type, meta) {
        const { sheet, range } = this.resolve(ref);
        const definition = type ? webexpress.webui.SpreadsheetTypes.get(type) : null;
        if (type && !definition) throw new RangeError("Unknown cell type: " + type);
        return this._eachCell(sheet, range, (cell) => {
            const next = { ...cell };
            if (type) {
                next.t = type;
                if (meta) next.m = { ...next.m, ...meta };
                if (next.v !== undefined && definition.parse) {
                    const value = definition.parse(String(typeof next.v === "object" ? definition.edit?.(next.v) ?? "" : next.v), next);
                    if (value !== undefined) next.v = value; else delete next.v;
                }
            } else delete next.t;
            return next;
        }, "type");
    }

    /**
     * Creates the cell a value writes, keeping the format, type and comment of the old cell and
     * taking the format the input brings along when the cell has none.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @param {*} value - The value.
     * @param {object} [options] - { raw }.
     * @returns {object|null} The cell.
     */
    _cellFromInput(sheet, row, col, value, options = {}) {
        const old = sheet.getCell(row, col);
        const next = old ? { ...old } : {};
        delete next.v; delete next.f;
        // a date of another frame is no instance of this frame's Date
        if (Object.prototype.toString.call(value) === "[object Date]") {
            next.v = webexpress.webui.SpreadsheetFormat.dateToSerial(new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), value.getHours(), value.getMinutes(), value.getSeconds())));
            if (!next.s?.nf) next.s = { ...next.s, nf: webexpress.webui.SpreadsheetFormat.locale(this.locale).date };
            return next;
        }
        if (value === null || value === undefined || value === "") return Object.keys(next).length ? next : null;
        if (old?.t && typeof value === "string" && !options.raw) {
            const type = webexpress.webui.SpreadsheetTypes.get(old.t);
            if (type?.parse) {
                const parsed = type.parse(value, old);
                if (parsed === undefined) throw new RangeError(this._i18n("webexpress.webui:spreadsheet.invalidvalue", "The value does not fit the cell."));
                next.v = parsed;
                return next;
            }
        }
        if (typeof value !== "string" || options.raw) { next.v = value; return next; }
        const parsed = webexpress.webui.SpreadsheetFormat.parseInput(value, this.locale);
        if (parsed.formula) next.f = parsed.formula;
        else if (parsed.value === null) return Object.keys(next).length ? next : null;
        else next.v = parsed.value;
        if (parsed.format && !next.s?.nf) next.s = { ...next.s, nf: parsed.format };
        return next;
    }

    // ------------------------------------------------------------------ formatting

    /**
     * Returns the effective style of a cell (column, row, template and own style combined).
     * @param {*} ref - The cell reference.
     * @param {string} [sheetKey] - The sheet.
     * @returns {object} The style.
     */
    getStyle(ref, sheetKey) {
        const { sheet, range } = this.resolve(ref, sheetKey);
        return webexpress.webui.SpreadsheetModel._copy(webexpress.webui.SpreadsheetModel.effectiveStyle(this._model, sheet, range.r1, range.c1));
    }

    /**
     * Merges style properties into every cell of a range; a property set to null is removed.
     * Whole columns and rows keep the style on the axis, so formatting column A does not create
     * a million cells.
     * @param {*} ref - The range; the selection when omitted.
     * @param {object} patch - The properties, such as { bold: true, fill: "#ffff00" }.
     * @param {object} [options] - { sheet, label }.
     * @returns {boolean} True if anything changed.
     */
    setStyle(ref, patch, options = {}) {
        const apply = (style) => {
            const next = { ...style };
            for (const [key, value] of Object.entries(patch ?? {})) {
                if (value === null || value === false && key !== "gridlines") delete next[key];
                else if (key === "border" && value && typeof value === "object") {
                    const border = { ...next.border };
                    for (const [side, edge] of Object.entries(value)) { if (edge) border[side] = edge; else delete border[side]; }
                    if (Object.keys(border).length) next.border = border; else delete next.border;
                } else next[key] = value;
            }
            return webexpress.webui.SpreadsheetModel.sanitizeStyle(next);
        };
        return this._styleRanges(ref, options, () => apply, options.label ?? "style");
    }

    /**
     * Applies a function to the style of every cell of the selection or a range, through the
     * axes for whole columns or rows.
     * @param {*} ref - The range; the selection when omitted.
     * @param {object} options - { sheet }.
     * @param {Function} factory - Returns the style function for a range: (style, row, col) => style.
     * @param {string} label - The history label.
     * @returns {boolean} True if anything changed.
     */
    _styleRanges(ref, options, factory, label) {
        const targets = ref === undefined || ref === null ? this._sel.ranges.map(range => ({ sheet: this.sheet, range })) : [this.resolve(ref, options.sheet)];
        let changed = false;
        this.batch(() => {
            for (const { sheet, range } of targets) {
                const fn = factory(range);
                const fullCols = range.r1 === 0 && range.r2 >= sheet.rowCount - 1;
                const fullRows = range.c1 === 0 && range.c2 >= sheet.colCount - 1;
                if (fullCols || fullRows) {
                    const axis = fullCols ? "col" : "row";
                    const entries = [];
                    const props = fullCols ? sheet.colProps : sheet.rowProps;
                    for (let i = fullCols ? range.c1 : range.r1; i <= (fullCols ? range.c2 : range.r2); i++) {
                        const current = props[i] ?? {};
                        entries.push({ index: i, props: { ...current, s: fn(current.s ?? {}, fullCols ? -1 : i, fullCols ? i : -1) ?? undefined } });
                    }
                    changed = this._commit({ type: "axis", sheet: sheet.id, axis, entries }) || changed;
                    const cells = [];
                    this._forEachStored(sheet, range, (cell, row, col) => cells.push({ row, col, cell: { ...cell, s: cell.s ? fn(cell.s, row, col) ?? undefined : undefined } }));
                    if (cells.length) changed = this._commit({ type: "set", sheet: sheet.id, cells }) || changed;
                    continue;
                }
                changed = this._eachCell(sheet, range, (cell, row, col) => {
                    const style = fn(cell?.s ?? {}, row, col);
                    const next = { ...cell };
                    if (style) next.s = style; else delete next.s;
                    return next;
                }) || changed;
            }
        }, label, options.mergeKey);
        return changed;
    }

    /**
     * Toggles a flag style (bold, italic, underline, strike, wrap) on the selection: all on when
     * the active cell has it off, else all off.
     * @param {string} flag - The flag.
     * @returns {boolean} True if anything changed.
     */
    toggleStyle(flag) {
        const active = this.getStyle({ row: this._sel.active.row, col: this._sel.active.col });
        return this.setStyle(null, { [flag]: active[flag] ? null : true }, { label: flag });
    }

    /**
     * Sets the number format of a range.
     * @param {*} ref - The range; the selection when omitted.
     * @param {string|null} code - The format code, or null for General.
     * @returns {boolean} True if changed.
     */
    setNumberFormat(ref, code) { return this.setStyle(ref, { nf: code || null }, { label: "numberFormat" }); }

    /**
     * Draws borders on a range.
     * @param {*} ref - The range; the selection when omitted.
     * @param {string} kind - "all", "outer", "inner", "top", "bottom", "left", "right" or "none".
     * @param {string} [edge="thin"] - The line, such as "thin #000000" or "thick".
     * @returns {boolean} True if changed.
     */
    setBorder(ref, kind, edge = "thin") {
        return this._styleRanges(ref, {}, (range) => (style, row, col) => {
            const border = { ...style.border };
            const outer = { top: row === range.r1, bottom: row === range.r2, left: col === range.c1, right: col === range.c2 };
            // whole columns and rows pass -1 for the axis they span
            if (row < 0) { outer.top = true; outer.bottom = true; }
            if (col < 0) { outer.left = true; outer.right = true; }
            for (const side of ["top", "right", "bottom", "left"]) {
                const on = kind === "all" || kind === side && outer[side] || kind === "outer" && outer[side] || kind === "inner" && !outer[side];
                if (kind === "none") delete border[side];
                else if (on) border[side] = edge;
            }
            return webexpress.webui.SpreadsheetModel.sanitizeStyle({ ...style, border: Object.keys(border).length ? border : undefined });
        }, "border");
    }

    /**
     * Applies a format template (see SpreadsheetCellStyles) to a range. The template is stored in
     * the workbook, so the workbook carries it along.
     * @param {*} ref - The range; the selection when omitted.
     * @param {string|null} name - The template name, or null to remove the template.
     * @returns {boolean} True if changed.
     */
    applyCellStyle(ref, name) {
        return this.batch(() => {
            if (name && !this._model.styles[name]) {
                const template = webexpress.webui.SpreadsheetCellStyles.get(name);
                if (!template) throw new RangeError("Unknown cell style: " + name);
                this._commit({ type: "styles", value: { ...this._model.styles, [name]: template.style } });
            }
            const targets = ref === undefined || ref === null ? this._sel.ranges.map(range => ({ sheet: this.sheet, range })) : [this.resolve(ref)];
            for (const { sheet, range } of targets) {
                this._eachCell(sheet, range, cell => {
                    const next = { ...cell };
                    if (name) next.st = name; else delete next.st;
                    return next;
                });
            }
        }, "cellStyle");
    }

    /**
     * Defines or replaces a named style in the workbook, usable like a template.
     * @param {string} name - The name.
     * @param {object|null} style - The style, or null to remove it.
     * @returns {boolean} True if changed.
     */
    defineStyle(name, style) {
        const styles = { ...this._model.styles };
        if (style) styles[name] = style; else delete styles[name];
        return this._commit({ type: "styles", value: styles }, { label: "defineStyle" });
    }

    /**
     * Merges a range into one cell. Only the top-left value stays, as in the common
     * spreadsheets; overlapping merges are dissolved first.
     * @param {*} [ref] - The range; the selection when omitted.
     * @param {object} [options] - { center: also center the text }.
     * @returns {boolean} True if merged.
     */
    merge(ref, options = {}) {
        const { sheet, range } = this.resolve(ref);
        if (range.r1 === range.r2 && range.c1 === range.c2) return false;
        const Address = webexpress.webui.SpreadsheetAddress;
        return this.batch(() => {
            const cells = [];
            this._forEachStored(sheet, range, (cell, row, col) => {
                if (row !== range.r1 || col !== range.c1) cells.push({ row, col, cell: cell.s || cell.st ? { s: cell.s, st: cell.st } : null });
            });
            if (cells.length) this._commit({ type: "set", sheet: sheet.id, cells });
            const merges = sheet.merges.filter(m => !Address.intersects(m, range)).concat([{ ...range }]);
            this._commit({ type: "merges", sheet: sheet.id, merges });
            if (options.center) this.setStyle({ ...range, sheet: sheet.id }, { align: "center" });
        }, "merge");
    }

    /**
     * Dissolves the merges inside a range.
     * @param {*} [ref] - The range; the selection when omitted.
     * @returns {boolean} True if anything was unmerged.
     */
    unmerge(ref) {
        const { sheet, range } = this.resolve(ref);
        const Address = webexpress.webui.SpreadsheetAddress;
        const merges = sheet.merges.filter(m => !Address.intersects(m, range));
        if (merges.length === sheet.merges.length) return false;
        return this._commit({ type: "merges", sheet: sheet.id, merges }, { label: "unmerge" });
    }

    // ------------------------------------------------------------------ names

    /**
     * Lists the named ranges.
     * @returns {object} The ranges by name.
     */
    get names() { return { ...this._model.names }; }

    /**
     * Defines a named range; without a sheet in the reference it refers to the active sheet.
     * @param {string} name - The name.
     * @param {string} ref - The reference.
     * @returns {boolean} True if defined.
     */
    defineName(name, ref) {
        if (!webexpress.webui.SpreadsheetModel.isValidName(name)) throw new RangeError("Invalid name: " + name);
        const parsed = webexpress.webui.SpreadsheetAddress.parseRange(String(ref).replace(/^=/, ""));
        if (!parsed) throw new RangeError("Invalid reference: " + ref);
        const text = parsed.sheet ? String(ref).replace(/^=/, "") : webexpress.webui.SpreadsheetAddress.quoteSheet(this.sheet.name) + "!" + String(ref).replace(/^=/, "");
        return this._commit({ type: "names", value: { ...this._model.names, [name]: text } }, { label: "defineName" });
    }

    /**
     * Removes a named range.
     * @param {string} name - The name.
     * @returns {boolean} True if removed.
     */
    removeName(name) {
        if (!(name in this._model.names)) return false;
        const names = { ...this._model.names };
        delete names[name];
        return this._commit({ type: "names", value: names }, { label: "removeName" });
    }

    // ------------------------------------------------------------------ structure

    /**
     * Inserts empty rows; references below move along.
     * @param {number} index - The zero-based row the new rows start at.
     * @param {number} [count=1] - The number of rows.
     * @param {string} [sheetKey] - The sheet.
     * @returns {boolean} True if inserted.
     */
    insertRows(index, count = 1, sheetKey) { return this._structure("insertRows", index, count, sheetKey); }

    /**
     * Deletes rows; references into them become #REF!.
     * @param {number} index - The first row.
     * @param {number} [count=1] - The number of rows.
     * @param {string} [sheetKey] - The sheet.
     * @returns {boolean} True if deleted.
     */
    deleteRows(index, count = 1, sheetKey) { return this._structure("deleteRows", index, count, sheetKey); }

    /**
     * Inserts empty columns.
     * @param {number} index - The zero-based column the new columns start at.
     * @param {number} [count=1] - The number of columns.
     * @param {string} [sheetKey] - The sheet.
     * @returns {boolean} True if inserted.
     */
    insertColumns(index, count = 1, sheetKey) { return this._structure("insertCols", index, count, sheetKey); }

    /**
     * Deletes columns.
     * @param {number} index - The first column.
     * @param {number} [count=1] - The number of columns.
     * @param {string} [sheetKey] - The sheet.
     * @returns {boolean} True if deleted.
     */
    deleteColumns(index, count = 1, sheetKey) { return this._structure("deleteCols", index, count, sheetKey); }

    /**
     * Runs a structural operation.
     * @param {string} type - The operation type.
     * @param {number} index - The index.
     * @param {number} count - The count.
     * @param {string} [sheetKey] - The sheet.
     * @returns {boolean} True if applied.
     */
    _structure(type, index, count, sheetKey) {
        const sheet = sheetKey ? this._model.sheet(sheetKey) : this.sheet;
        if (!sheet) return false;
        return this._commit({ type, sheet: sheet.id, index, count }, { label: type });
    }

    /**
     * Sets the width of columns in pixels at 100 %.
     * @param {number} index - The first column.
     * @param {number} width - The width; null for the default.
     * @param {number} [count=1] - The number of columns.
     * @returns {boolean} True if changed.
     */
    setColumnWidth(index, width, count = 1) { return this._axisSize("col", index, width, count); }

    /**
     * Sets the height of rows in pixels at 100 %.
     * @param {number} index - The first row.
     * @param {number} height - The height; null for the default.
     * @param {number} [count=1] - The number of rows.
     * @returns {boolean} True if changed.
     */
    setRowHeight(index, height, count = 1) { return this._axisSize("row", index, height, count); }

    /**
     * Hides or shows columns.
     * @param {number} index - The first column.
     * @param {number} [count=1] - The number of columns.
     * @param {boolean} [hidden=true] - True to hide.
     * @returns {boolean} True if changed.
     */
    hideColumns(index, count = 1, hidden = true) { return this._axisFlag("col", index, count, hidden); }

    /**
     * Hides or shows rows.
     * @param {number} index - The first row.
     * @param {number} [count=1] - The number of rows.
     * @param {boolean} [hidden=true] - True to hide.
     * @returns {boolean} True if changed.
     */
    hideRows(index, count = 1, hidden = true) { return this._axisFlag("row", index, count, hidden); }

    /**
     * Changes the size of rows or columns.
     * @param {string} axis - "row" or "col".
     * @param {number} index - The first index.
     * @param {number|null} size - The size.
     * @param {number} count - The count.
     * @returns {boolean} True if changed.
     */
    _axisSize(axis, index, size, count) {
        const sheet = this.sheet, props = axis === "row" ? sheet.rowProps : sheet.colProps;
        const entries = [];
        for (let i = index; i < index + count; i++) {
            const next = { ...props[i] };
            if (size === null || size === undefined) delete next.size; else next.size = Math.max(4, Math.min(2000, Math.round(size)));
            delete next.hidden;
            entries.push({ index: i, props: next });
        }
        return this._commit({ type: "axis", sheet: sheet.id, axis, entries }, { label: "resize", mergeKey: "resize:" + axis + ":" + index });
    }

    /**
     * Hides or shows rows or columns.
     * @param {string} axis - "row" or "col".
     * @param {number} index - The first index.
     * @param {number} count - The count.
     * @param {boolean} hidden - True to hide.
     * @returns {boolean} True if changed.
     */
    _axisFlag(axis, index, count, hidden) {
        const sheet = this.sheet, props = axis === "row" ? sheet.rowProps : sheet.colProps;
        const end = Math.min(axis === "row" ? sheet.rowCount : sheet.colCount, index + count);
        const entries = [];
        if (hidden) {
            if (!this._canHide(axis, index, end - 1)) return false;
            for (let i = index; i < end; i++) if (!props[i]?.hidden) entries.push({ index: i, props: { ...props[i], hidden: true } });
        } else {
            // only the hidden ones are visited, so showing across a whole sheet stays sparse
            props.forEach((p, i) => {
                if (!p?.hidden || i < index || i >= end) return;
                const next = { ...p };
                delete next.hidden;
                entries.push({ index: i, props: next });
            });
        }
        if (!entries.length) return false;
        return this._commit({ type: "axis", sheet: sheet.id, axis, entries }, { label: hidden ? "hide" : "show" });
    }

    /**
     * Determines whether rows or columns can be hidden. A sheet without a single visible row or
     * column leaves nothing to click, select or move to.
     * @param {string} axis - "row" or "col".
     * @param {number} first - The first index.
     * @param {number} last - The last index.
     * @returns {boolean} True if something stays visible.
     */
    _canHide(axis, first, last) {
        const sheet = this.sheet, props = axis === "row" ? sheet.rowProps : sheet.colProps;
        let shown = (axis === "row" ? sheet.rowCount : sheet.colCount) - (last - first + 1);
        props.forEach((p, i) => { if (p?.hidden && (i < first || i > last)) shown--; });
        return shown > 0;
    }

    /**
     * Determines whether hidden rows or columns lie in a span.
     * @param {string} axis - "row" or "col".
     * @param {number} first - The first index.
     * @param {number} last - The last index.
     * @returns {boolean} True if one is hidden.
     */
    _hasHidden(axis, first, last) {
        const props = axis === "row" ? this.sheet.rowProps : this.sheet.colProps;
        return props.some((p, i) => p?.hidden && i >= first && i <= last);
    }

    /**
     * Shows the block of hidden rows or columns next to a visible one, as a click on the marker
     * in its header does, and selects what came back.
     * @param {string} axis - "row" or "col".
     * @param {number} index - The visible row or column.
     * @param {number} direction - -1 for the block before it, 1 for the block after it.
     * @returns {boolean} True if changed.
     */
    showHiddenNextTo(axis, index, direction) {
        const sheet = this.sheet, row = axis === "row";
        const props = row ? sheet.rowProps : sheet.colProps, count = row ? sheet.rowCount : sheet.colCount;
        let end = index + direction;
        if (end < 0 || end >= count || !props[end]?.hidden) return false;
        while (end + direction >= 0 && end + direction < count && props[end + direction]?.hidden) end += direction;
        const first = Math.min(index + direction, end), last = Math.max(index + direction, end);
        if (!this._axisFlag(axis, first, last - first + 1, false)) return false;
        this.select(row ? { r1: first, c1: 0, r2: last, c2: sheet.colCount - 1 } : { r1: 0, c1: first, r2: sheet.rowCount - 1, c2: last }, { scroll: false });
        return true;
    }

    /**
     * Freezes rows at the top and columns at the left; freeze(0, 0) unfreezes.
     * @param {number} rows - The frozen rows.
     * @param {number} cols - The frozen columns.
     * @returns {boolean} True if changed.
     */
    freeze(rows, cols) { return this._commit({ type: "freeze", sheet: this.sheet.id, rows, cols }, { label: "freeze" }); }

    /**
     * Grows a sheet so a size fits, as part of the running transaction.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {number} rows - The rows needed.
     * @param {number} cols - The columns needed.
     */
    _ensureSize(sheet, rows, cols) {
        const Address = webexpress.webui.SpreadsheetAddress;
        if (rows > sheet.rowCount) this._commit({ type: "insertRows", sheet: sheet.id, index: sheet.rowCount, count: Math.min(Address.MAX_ROWS, rows) - sheet.rowCount, adjust: false });
        if (cols > sheet.colCount) this._commit({ type: "insertCols", sheet: sheet.id, index: sheet.colCount, count: Math.min(Address.MAX_COLS, cols) - sheet.colCount, adjust: false });
    }

    /**
     * Sorts the rows of a range by one of its columns. Formulas move with their rows.
     * @param {*} [ref] - The range; the selection, or the data region around the active cell.
     * @param {object} [options] - { column: index inside the range or column letter (default 0),
     * descending, header: true to keep the first row in place }.
     * @returns {boolean} True if the order changed.
     */
    sort(ref, options = {}) {
        let { sheet, range } = this.resolve(ref);
        if (ref === undefined || ref === null) {
            const sel = this._sel.ranges[0];
            if (sel.r1 === sel.r2 && sel.c1 === sel.c2) range = this._region(sheet, sel.r1, sel.c1);
        }
        const used = sheet.usedRange();
        if (!used) return false;
        range = { ...range, r2: Math.min(range.r2, used.r2), c2: Math.min(range.c2, used.c2) };
        const key = typeof options.column === "string" ? webexpress.webui.SpreadsheetAddress.columnIndex(options.column) - range.c1 : options.column ?? (this._sel.active.col - range.c1);
        const column = Math.max(0, Math.min(range.c2 - range.c1, Number.isInteger(key) ? key : 0));
        const start = range.r1 + (options.header ? 1 : 0);
        if (start >= range.r2) return false;
        const Values = webexpress.webui.SpreadsheetValues;
        const rows = [];
        for (let r = start; r <= range.r2; r++) rows.push({ r, value: this._engine.cellValue(sheet, r, range.c1 + column) });
        const sorted = rows.slice().sort((a, b) => {
            // empty cells stay at the end in both directions
            if (a.value === null && b.value !== null) return 1;
            if (b.value === null && a.value !== null) return -1;
            const order = Values.compare(a.value instanceof webexpress.webui.SpreadsheetError ? a.value.code : a.value, b.value instanceof webexpress.webui.SpreadsheetError ? b.value.code : b.value);
            return (options.descending ? -order : order) || a.r - b.r;
        });
        if (sorted.every((entry, i) => entry.r === rows[i].r)) return false;
        const cells = [];
        sorted.forEach((entry, i) => {
            const target = start + i;
            for (let c = range.c1; c <= range.c2; c++) {
                const cell = sheet.getCell(entry.r, c);
                cells.push({ row: target, col: c, cell: cell?.f ? { ...cell, f: webexpress.webui.SpreadsheetFormula.translate(cell.f, target - entry.r, 0) } : cell });
            }
        });
        return this._commit({ type: "set", sheet: sheet.id, cells }, { label: "sort" });
    }

    /**
     * Finds the contiguous data region around a cell, as Ctrl+A and sorting take it.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @returns {{r1: number, c1: number, r2: number, c2: number}} The region.
     */
    _region(sheet, row, col) {
        let r1 = row, r2 = row, c1 = col, c2 = col, grown = true;
        const filled = (r, c) => r >= 0 && c >= 0 && r < sheet.rowCount && c < sheet.colCount && !!sheet.getCell(r, c);
        while (grown) {
            grown = false;
            for (let c = c1 - 1; c <= c2 + 1; c++) {
                if (filled(r1 - 1, c)) { r1--; grown = true; break; }
                if (filled(r2 + 1, c)) { r2++; grown = true; break; }
            }
            for (let r = r1 - 1; r <= r2 + 1; r++) {
                if (filled(r, c1 - 1)) { c1--; grown = true; break; }
                if (filled(r, c2 + 1)) { c2++; grown = true; break; }
            }
        }
        return { r1, c1, r2, c2 };
    }

    /**
     * Continues the content of a source range into a target range that extends it, the way the
     * fill handle does: number and date series continue with their step, texts ending in a
     * number count on, day and month names cycle, formulas move their relative references and
     * everything else repeats.
     * @param {*} source - The source range.
     * @param {*} target - The target range, containing the source.
     * @param {object} [options] - { copy: repeat instead of continuing series }.
     * @returns {boolean} True if anything changed.
     */
    autoFill(source, target, options = {}) {
        const { sheet, range: src } = this.resolve(source);
        const { range: dst } = this.resolve(target, sheet.id);
        const down = dst.r2 > src.r2, up = dst.r1 < src.r1, right = dst.c2 > src.c2, left = dst.c1 < src.c1;
        if (!(down || up || right || left)) return false;
        const vertical = down || up;
        const Formula = webexpress.webui.SpreadsheetFormula, Format = webexpress.webui.SpreadsheetFormat;
        const conventions = Format.locale(this.locale);
        const lists = [conventions.days, conventions.months, conventions.days.map(d => d.slice(0, 3)), conventions.months.map(m => m.slice(0, 3)),
            Format.LOCALES.en.days, Format.LOCALES.en.months];
        const cells = [];
        const lines = vertical ? [src.c1, src.c2] : [src.r1, src.r2];
        return this.batch(() => {
            this._ensureSize(sheet, dst.r2 + 1, dst.c2 + 1);
            for (let line = lines[0]; line <= lines[1]; line++) {
                const seq = [];
                const length = vertical ? src.r2 - src.r1 + 1 : src.c2 - src.c1 + 1;
                for (let i = 0; i < length; i++) {
                    const r = vertical ? src.r1 + i : line, c = vertical ? line : src.c1 + i;
                    seq.push({ r, c, cell: sheet.getCell(r, c) });
                }
                const series = options.copy ? null : this._series(seq.map(s => s.cell), lists);
                const positions = [];
                if (down || right) for (let p = (down ? src.r2 : src.c2) + 1; p <= (down ? dst.r2 : dst.c2); p++) positions.push(p);
                else for (let p = (up ? src.r1 : src.c1) - 1; p >= (up ? dst.r1 : dst.c1); p--) positions.push(p);
                positions.forEach((p, k) => {
                    const step = k + 1;
                    const index = down || right ? k % length : length - 1 - (k % length);
                    const origin = seq[index];
                    const r = vertical ? p : line, c = vertical ? line : p;
                    let cell = origin.cell ? { ...origin.cell } : null;
                    if (cell?.f) cell.f = Formula.translate(cell.f, r - origin.r, c - origin.c);
                    else if (series && cell) {
                        const value = series(down || right ? length - 1 + step : -step);
                        if (value !== undefined) cell.v = value;
                    }
                    cells.push({ row: r, col: c, cell });
                });
            }
            this._commit({ type: "set", sheet: sheet.id, cells });
        }, "fill");
    }

    /**
     * Recognizes a series in the cells of one line of a fill.
     * @param {Array<object|null>} cells - The source cells.
     * @param {Array<Array<string>>} lists - The name lists that cycle.
     * @returns {Function|null} Returns the value at a position (0 = first source cell), or null
     * when the content just repeats.
     */
    _series(cells, lists) {
        const values = cells.map(c => (c && !c.f ? c.v : undefined));
        if (values.some(v => v === undefined)) return null;
        if (values.every(v => typeof v === "number")) {
            // a single number repeats, as in the common spreadsheets; two or more continue their step
            if (values.length < 2) return null;
            const step = (values[values.length - 1] - values[0]) / (values.length - 1);
            return i => Number((values[0] + step * i).toPrecision(15));
        }
        if (values.every(v => typeof v === "string")) {
            for (const list of lists) {
                const lower = list.map(x => x.toLowerCase());
                const at = values.map(v => lower.indexOf(v.toLowerCase()));
                if (at.every(i => i >= 0)) {
                    const step = values.length > 1 ? (at[at.length - 1] - at[0]) / (values.length - 1) : 1;
                    if (!Number.isInteger(step)) return null;
                    const upper = values[0] === values[0].toUpperCase();
                    return i => { const name = list[((at[0] + step * i) % list.length + list.length) % list.length]; return upper ? name.toUpperCase() : name; };
                }
            }
            const parts = values.map(v => /^(.*?)(\d+)(\D*)$/.exec(v));
            if (parts.every(p => p && p[1] === parts[0][1] && p[3] === parts[0][3])) {
                const numbers = parts.map(p => Number(p[2]));
                const step = numbers.length > 1 ? (numbers[numbers.length - 1] - numbers[0]) / (numbers.length - 1) : 1;
                if (!Number.isInteger(step)) return null;
                const width = parts[0][2].length;
                return i => { const n = numbers[0] + step * i; return parts[0][1] + (n < 0 ? String(n) : String(n).padStart(width, "0")) + parts[0][3]; };
            }
        }
        return null;
    }

    /**
     * Moves a range to another position, carrying values, formats and merges; references to
     * the moved cells follow them, as when cutting and pasting.
     * @param {*} source - The source range.
     * @param {*} target - The top-left target cell (on any sheet).
     * @returns {boolean} True if moved.
     */
    moveRange(source, target) {
        const { sheet, range } = this.resolve(source);
        const { sheet: targetSheet, range: at } = this.resolve(target);
        const dr = at.r1 - range.r1, dc = at.c1 - range.c1;
        if (!dr && !dc && sheet === targetSheet) return false;
        const Address = webexpress.webui.SpreadsheetAddress;
        return this.batch(() => {
            this._ensureSize(targetSheet, range.r2 + dr + 1, range.c2 + dc + 1);
            const moved = [];
            this._forEachStored(sheet, range, (cell, row, col) => moved.push({ row, col, cell }));
            const clear = moved.map(({ row, col }) => ({ row, col, cell: null }));
            if (clear.length) this._commit({ type: "set", sheet: sheet.id, cells: clear });
            const destination = { r1: range.r1 + dr, c1: range.c1 + dc, r2: range.r2 + dr, c2: range.c2 + dc };
            const overwritten = [];
            this._forEachStored(targetSheet, destination, (cell, row, col) => overwritten.push({ row, col, cell: null }));
            if (overwritten.length) this._commit({ type: "set", sheet: targetSheet.id, cells: overwritten });
            this._commit({ type: "set", sheet: targetSheet.id, cells: moved.map(({ row, col, cell }) => ({ row: row + dr, col: col + dc, cell })) });
            // references into the moved block are re-aimed, everywhere in the workbook
            const lower = sheet.name.toLowerCase();
            const ops = [];
            for (const other of this._model.sheets) {
                const rewritten = [];
                other.forEachCell((cell, row, col) => {
                    if (!cell.f) return;
                    const text = webexpress.webui.SpreadsheetFormula.rewrite(cell.f, other.name, ref => {
                        if ((ref.sheet ?? ref.home ?? "").toLowerCase() !== lower || ref.kind === "cols" || ref.kind === "rows") return ref;
                        if (!(ref.r1 >= range.r1 && ref.r2 <= range.r2 && ref.c1 >= range.c1 && ref.c2 <= range.c2)) return ref;
                        const next = { ...ref, r1: ref.r1 + dr, r2: ref.r2 + dr, c1: ref.c1 + dc, c2: ref.c2 + dc };
                        if (targetSheet !== sheet || ref.sheet) next.sheet = targetSheet === other && !ref.sheet ? null : targetSheet.name;
                        return next;
                    });
                    if (text !== cell.f) rewritten.push({ row, col, cell: { ...cell, f: text } });
                });
                if (rewritten.length) ops.push({ type: "set", sheet: other.id, cells: rewritten });
            }
            ops.forEach(op => this._commit(op));
            const merges = sheet.merges.filter(m => Address.intersects(m, range));
            if (merges.length) {
                this._commit({ type: "merges", sheet: sheet.id, merges: sheet.merges.filter(m => !Address.intersects(m, range)) });
                const shifted = merges.map(m => ({ r1: m.r1 + dr, c1: m.c1 + dc, r2: m.r2 + dr, c2: m.c2 + dc }));
                this._commit({ type: "merges", sheet: targetSheet.id, merges: targetSheet.merges.filter(m => !shifted.some(s => Address.intersects(s, m))).concat(shifted) });
            }
            if (targetSheet.id !== this._activeSheetId) this.activateSheet(targetSheet.id);
            this.select(destination);
        }, "move");
    }

    // ------------------------------------------------------------------ selection

    /**
     * Gets the selection as references.
     * @returns {{sheet: string, ranges: Array<string>, active: string}} The selection.
     */
    get selection() {
        const Address = webexpress.webui.SpreadsheetAddress, sel = this._sel;
        return { sheet: this.sheet.name, ranges: sel.ranges.map(r => Address.rangeName(r)), active: Address.cellName(sel.active.row, sel.active.col) };
    }

    /**
     * Selects one or several ranges. The active cell is the first cell of the last range.
     * @param {*|Array<*>} ref - A reference or a list of them; on another sheet, that sheet is activated.
     * @param {object} [options] - { active: the active cell reference, scroll: false to keep the view }.
     */
    select(ref, options = {}) {
        const refs = Array.isArray(ref) ? ref : [ref];
        const resolved = refs.map(r => this.resolve(r));
        if (!resolved.length) return;
        if (resolved[0].sheet.id !== this._activeSheetId) this.activateSheet(resolved[0].sheet.id);
        const ranges = resolved.map(r => this._expandMerges(r.sheet, r.range));
        const last = ranges[ranges.length - 1];
        const active = options.active ? this.resolve(options.active).range : { r1: last.r1, c1: last.c1 };
        this._setSelection(ranges, { row: active.r1, col: active.c1 }, { row: last.r1, col: last.c1 }, { row: last.r2, col: last.c2 }, options.scroll !== false);
    }

    /**
     * Selects the whole sheet.
     */
    selectAll() { this.select({ r1: 0, c1: 0, r2: this.sheet.rowCount - 1, c2: this.sheet.colCount - 1 }, { active: { row: this._sel.active.row, col: this._sel.active.col }, scroll: false }); }

    /**
     * Moves the active cell to a reference and selects it.
     * @param {*} ref - The cell or range.
     */
    goTo(ref) { this.select(ref); this._view.viewport.focus({ preventScroll: true }); }

    /**
     * Grows a range until no merge sticks out of it.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {object} range - The range.
     * @returns {object} The grown range.
     */
    _expandMerges(sheet, range) {
        const Address = webexpress.webui.SpreadsheetAddress;
        let out = { r1: range.r1, c1: range.c1, r2: range.r2, c2: range.c2 }, grown = true;
        while (grown) {
            grown = false;
            for (const m of sheet.merges) {
                if (!Address.intersects(m, out)) continue;
                const next = { r1: Math.min(out.r1, m.r1), c1: Math.min(out.c1, m.c1), r2: Math.max(out.r2, m.r2), c2: Math.max(out.c2, m.c2) };
                if (next.r1 !== out.r1 || next.c1 !== out.c1 || next.r2 !== out.r2 || next.c2 !== out.c2) { out = next; grown = true; }
            }
        }
        return out;
    }

    /**
     * Replaces the selection and announces it.
     * @param {Array<object>} ranges - The ranges.
     * @param {{row: number, col: number}} active - The active cell.
     * @param {{row: number, col: number}} anchor - The fixed corner of the last range.
     * @param {{row: number, col: number}} focus - The moving corner of the last range.
     * @param {boolean} [scroll=true] - Whether the focus cell is scrolled into view.
     */
    _setSelection(ranges, active, anchor, focus, scroll = true) {
        const sel = this._sel, sheet = this.sheet;
        const clampRow = r => Math.max(0, Math.min(sheet.rowCount - 1, r)), clampCol = c => Math.max(0, Math.min(sheet.colCount - 1, c));
        const merge = sheet.mergeAt(clampRow(active.row), clampCol(active.col));
        sel.ranges = ranges.map(r => ({ r1: clampRow(r.r1), c1: clampCol(r.c1), r2: clampRow(r.r2), c2: clampCol(r.c2) }));
        sel.active = merge ? { row: merge.r1, col: merge.c1 } : { row: clampRow(active.row), col: clampCol(active.col) };
        sel.anchor = { row: clampRow(anchor.row), col: clampCol(anchor.col) };
        sel.focus = { row: clampRow(focus.row), col: clampCol(focus.col) };
        this._history.seal();
        this._collab?.history.seal();
        if (scroll) this._view.scrollToCell(sel.focus.row, sel.focus.col);
        this._view.render();
        this._selectionChanged();
    }

    /**
     * Announces a selection change to the chrome, the plugins, the event listeners and the
     * other users.
     */
    _selectionChanged() {
        this._refreshChrome();
        this._plugins.forEach(plugin => plugin.onSelectionChange?.(this));
        const sel = this.selection;
        this._dispatch(webexpress.webui.Event.SPREADSHEET_SELECTION_CHANGED_EVENT, { sheet: sel.sheet, sheetId: this.sheet.id, ranges: sel.ranges, active: sel.active });
        if (this._session) {
            if (this._presenceTimer) this.cancelDeferred(this._presenceTimer);
            this._presenceTimer = this.defer(() => { this._presenceTimer = null; this._session?.sendPresence(); }, 80);
        }
        if (this._collab?.host) this._dispatch(webexpress.webui.Event.COLLABORATION_STEPS_EVENT, { steps: [] });
    }

    /**
     * Moves the active cell, or with extend the moving corner of the selection, skipping hidden
     * rows and columns and stepping over merged cells.
     * @param {number} dr - The row delta.
     * @param {number} dc - The column delta.
     * @param {boolean} [extend=false] - Whether the selection grows instead.
     */
    _move(dr, dc, extend = false) {
        const sheet = this.sheet, sel = this._sel;
        const from = extend ? sel.focus : sel.active;
        let row = from.row, col = from.col;
        const merge = !extend && sheet.mergeAt(row, col);
        if (merge) { if (dr > 0) row = merge.r2; if (dc > 0) col = merge.c2; }
        const step = (value, delta, count, hidden) => {
            let next = value;
            for (let moved = 0; moved < Math.abs(delta);) {
                const candidate = next + Math.sign(delta);
                if (candidate < 0 || candidate >= count) break;
                next = candidate;
                if (!hidden(next)) moved++;
            }
            while (next > 0 && next < count - 1 && hidden(next)) next += Math.sign(delta) || 1;
            return next;
        };
        row = step(row, dr, sheet.rowCount, r => sheet.rowProps[r]?.hidden);
        col = step(col, dc, sheet.colCount, c => sheet.colProps[c]?.hidden);
        if (extend) {
            const range = this._expandMerges(sheet, webexpress.webui.SpreadsheetAddress.normalize({ r1: sel.anchor.row, c1: sel.anchor.col, r2: row, c2: col }));
            this._setSelection([...sel.ranges.slice(0, -1), range], sel.active, sel.anchor, { row, col });
        } else {
            const target = sheet.mergeAt(row, col) ?? { r1: row, c1: col, r2: row, c2: col };
            this._setSelection([{ ...target }], { row: target.r1, col: target.c1 }, { row: target.r1, col: target.c1 }, { row: target.r1, col: target.c1 });
        }
    }

    /**
     * Moves to the edge of the data in a direction, as Ctrl+Arrow does.
     * @param {number} dr - The row direction.
     * @param {number} dc - The column direction.
     * @param {boolean} extend - Whether the selection grows.
     */
    _jump(dr, dc, extend) {
        const sheet = this.sheet, sel = this._sel;
        const from = extend ? sel.focus : sel.active;
        let row = from.row, col = from.col;
        const filled = (r, c) => !!sheet.getCell(r, c);
        const inside = (r, c) => r >= 0 && c >= 0 && r < sheet.rowCount && c < sheet.colCount;
        if (inside(row + dr, col + dc) && filled(row, col) && filled(row + dr, col + dc)) {
            while (inside(row + dr, col + dc) && filled(row + dr, col + dc)) { row += dr; col += dc; }
        } else {
            row += dr; col += dc;
            while (inside(row, col) && !filled(row, col) && inside(row + dr, col + dc)) { row += dr; col += dc; }
            if (!inside(row, col)) { row -= dr; col -= dc; }
        }
        this._move(row - from.row, col - from.col, extend);
    }

    /**
     * Moves the active cell inside a multi-cell selection without changing it, the way Enter
     * and Tab walk through a selected block.
     * @param {number} dr - 1 or -1 for Enter, 0 for Tab.
     * @param {number} dc - 1 or -1 for Tab, 0 for Enter.
     * @returns {boolean} True if the selection was walked.
     */
    _walk(dr, dc) {
        const sel = this._sel, range = sel.ranges[sel.ranges.length - 1];
        if (sel.ranges.length !== 1 || range.r1 === range.r2 && range.c1 === range.c2) return false;
        let { row, col } = sel.active;
        const width = range.c2 - range.c1 + 1, height = range.r2 - range.r1 + 1;
        if (dc) {
            let index = (row - range.r1) * width + (col - range.c1) + dc;
            index = (index + width * height) % (width * height);
            row = range.r1 + Math.floor(index / width); col = range.c1 + index % width;
        } else {
            let index = (col - range.c1) * height + (row - range.r1) + dr;
            index = (index + width * height) % (width * height);
            col = range.c1 + Math.floor(index / height); row = range.r1 + index % height;
        }
        sel.active = { row, col };
        this._view.scrollToCell(row, col);
        this._view.render();
        this._selectionChanged();
        return true;
    }

    // ------------------------------------------------------------------ find and replace

    /**
     * Finds cells whose shown text (or formula) contains a text.
     * @param {string} query - The text.
     * @param {object} [options] - { matchCase, wholeCell, formulas: search formulas instead of
     * results, allSheets, regex }.
     * @returns {Array<{sheet: string, sheetId: string, ref: string, row: number, col: number}>} The matches.
     */
    find(query, options = {}) {
        if (query === undefined || query === null || query === "") return [];
        const pattern = options.regex ? new RegExp(query, options.matchCase ? "" : "i") : null;
        const needle = options.matchCase ? String(query) : String(query).toLowerCase();
        const matches = [];
        const sheets = options.allSheets ? this._model.sheets : [this.sheet];
        for (const sheet of sheets) {
            sheet.forEachCell((cell, row, col) => {
                let text = options.formulas && cell.f ? cell.f : webexpress.webui.SpreadsheetFormat.display(this._engine.cellValue(sheet, row, col), cell, webexpress.webui.SpreadsheetModel.effectiveStyle(this._model, sheet, row, col), this.locale).text;
                if (!options.matchCase) text = text.toLowerCase();
                const hit = pattern ? pattern.test(text) : options.wholeCell ? text === needle : text.includes(needle);
                if (hit) matches.push({ sheet: sheet.name, sheetId: sheet.id, ref: webexpress.webui.SpreadsheetAddress.cellName(row, col), row, col });
            });
        }
        return matches;
    }

    /**
     * Selects the next match after the active cell, wrapping around.
     * @param {string} query - The text.
     * @param {object} [options] - As for find, plus { backwards }.
     * @returns {object|null} The match, or null.
     */
    findNext(query, options = {}) {
        const matches = this.find(query, options);
        if (!matches.length) return null;
        const order = (m) => [this._model.sheetIndex(m.sheetId), m.row, m.col];
        const current = [this._model.sheetIndex(this.sheet.id), this._sel.active.row, this._sel.active.col];
        const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
        const match = options.backwards
            ? [...matches].reverse().find(m => compare(order(m), current) < 0) ?? matches[matches.length - 1]
            : matches.find(m => compare(order(m), current) > 0) ?? matches[0];
        this.select({ row: match.row, col: match.col, sheet: match.sheetId });
        return match;
    }

    /**
     * Replaces text in the values and formulas of matching cells.
     * @param {string} query - The text.
     * @param {string} replacement - The replacement.
     * @param {object} [options] - As for find, plus { all: replace every match instead of the active cell }.
     * @returns {number} The number of replaced cells.
     */
    replace(query, replacement, options = {}) {
        const matches = this.find(query, { ...options, formulas: true });
        const sel = this._sel;
        const targets = options.all ? matches : matches.filter(m => m.sheetId === this.sheet.id && m.row === sel.active.row && m.col === sel.active.col);
        if (!targets.length) return 0;
        const flags = options.matchCase ? "g" : "gi";
        const pattern = options.regex ? new RegExp(query, flags) : new RegExp(String(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
        let count = 0;
        this.batch(() => {
            for (const match of targets) {
                const sheet = this._model.sheet(match.sheetId);
                const cell = sheet.getCell(match.row, match.col);
                const text = cell.f ?? (typeof cell.v === "string" ? cell.v : webexpress.webui.SpreadsheetFormat.editText(cell, cell.s, this.locale));
                const next = options.wholeCell ? String(replacement) : text.replace(pattern, String(replacement));
                if (next === text) continue;
                const updated = this._cellFromInput(sheet, match.row, match.col, next);
                if (this._commit({ type: "set", sheet: sheet.id, cells: [{ row: match.row, col: match.col, cell: updated }] })) count++;
            }
        }, "replace");
        return count;
    }

    // ------------------------------------------------------------------ clipboard

    /**
     * Builds the clipboard formats of a range.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {object} range - The range.
     * @param {boolean} cut - Whether it is a cut.
     * @returns {{text: string, html: string, json: string, payload: object}} The formats.
     */
    _clipboardData(sheet, range, cut) {
        // a selection of whole columns or rows is copied as far as it holds content; anything
        // smaller is copied as selected, so its empty cells clear the target as elsewhere
        const used = sheet.usedRange();
        const huge = (range.r2 - range.r1 + 1) * (range.c2 - range.c1 + 1) > this.constructor.MAX_CELLS;
        const r2 = huge ? Math.min(range.r2, Math.max(range.r1, used ? used.r2 : range.r1)) : range.r2;
        const c2 = huge ? Math.min(range.c2, Math.max(range.c1, used ? used.c2 : range.c1)) : range.c2;
        const Model = webexpress.webui.SpreadsheetModel, Format = webexpress.webui.SpreadsheetFormat;
        const cells = [], shown = [], text = [];
        const styles = {};
        for (let r = range.r1; r <= r2; r++) {
            const row = [], shownRow = [], textRow = [];
            for (let c = range.c1; c <= c2; c++) {
                const cell = sheet.getCell(r, c);
                const style = Model.effectiveStyle(this._model, sheet, r, c);
                const display = Format.display(this._engine.cellValue(sheet, r, c), cell, style, this.locale);
                if (cell?.st && this._model.styles[cell.st]) styles[cell.st] = this._model.styles[cell.st];
                row.push(cell ? Model._copy(cell) : null);
                shownRow.push({ text: display.text, style, align: display.align });
                textRow.push(display.text);
            }
            cells.push(row); shown.push(shownRow); text.push(textRow);
        }
        const merges = sheet.merges.filter(m => m.r1 >= range.r1 && m.c1 >= range.c1 && m.r2 <= r2 && m.c2 <= c2)
            .map(m => ({ r1: m.r1 - range.r1, c1: m.c1 - range.c1, r2: m.r2 - range.r1, c2: m.c2 - range.c1 }));
        const payload = { v: 1, id: Math.random().toString(36).slice(2), cut, source: { sheet: sheet.name, sheetId: sheet.id, row: range.r1, col: range.c1 }, rows: cells.length, cols: cells[0]?.length ?? 0, cells, merges, styles };
        const Clipboard = webexpress.webui.SpreadsheetClipboard;
        return { text: Clipboard.toTSV(text), html: Clipboard.toHTML(payload, shown), json: JSON.stringify(payload), payload };
    }

    /**
     * Copies the selection to the clipboard through the asynchronous clipboard api.
     * @returns {Promise<boolean>} True if the clipboard was written.
     */
    async copy() { return this._copy(false); }

    /**
     * Cuts the selection: copies it and moves it on the next paste.
     * @returns {Promise<boolean>} True if the clipboard was written.
     */
    async cut() { return this.readOnly ? false : this._copy(true); }

    /**
     * Copies or cuts the last selected range.
     * @param {boolean} cut - Whether it is a cut.
     * @returns {Promise<boolean>} True if the clipboard was written.
     */
    async _copy(cut) {
        const data = this._prepareCopy(cut);
        return webexpress.webui.SpreadsheetClipboard.write(data);
    }

    /**
     * Builds the clipboard data of the selection and marks the copied range.
     * @param {boolean} cut - Whether it is a cut.
     * @returns {object} The formats.
     */
    _prepareCopy(cut) {
        const range = this._sel.ranges[this._sel.ranges.length - 1];
        const data = this._clipboardData(this.sheet, range, cut);
        webexpress.webui.SpreadsheetClipboard._cut = cut ? { ctrl: this, id: data.payload.id, sheet: this.sheet.id, range: { ...range } } : null;
        webexpress.webui.SpreadsheetClipboard._last = data;
        this._clipboardRange = { ...range, sheet: this.sheet.id };
        this._view.renderOverlay();
        this._announce(this._i18n(cut ? "webexpress.webui:spreadsheet.cut.done" : "webexpress.webui:spreadsheet.copy.done", cut ? "Cut" : "Copied"));
        return data;
    }

    /**
     * Pastes the system clipboard at the selection.
     * @param {object} [options] - { mode: "all" (default), "values", "formats" or "formulas" }.
     * @returns {Promise<boolean>} True if anything was pasted.
     */
    async paste(options = {}) {
        if (this.readOnly) return false;
        const formats = await webexpress.webui.SpreadsheetClipboard.read();
        return formats ? this.pasteData(formats, options) : false;
    }

    /**
     * Pastes clipboard formats at the selection, taking the richest one available: the own
     * format, an HTML table, then text. A block smaller than the selection is repeated across it
     * when the selection is a multiple of the block.
     * @param {{text?: string, html?: string, json?: string}} formats - The formats.
     * @param {object} [options] - { mode, target: a reference instead of the selection }.
     * @returns {boolean} True if anything was pasted.
     */
    pasteData(formats, options = {}) {
        if (this.readOnly) return false;
        const Clipboard = webexpress.webui.SpreadsheetClipboard;
        const mode = options.mode ?? "all";
        let payload = null;
        if (formats.json) { try { payload = JSON.parse(formats.json); } catch { payload = null; } }
        let table = null;
        if (!payload && formats.html) {
            table = Clipboard.parseHTML(formats.html);
            payload = table?.payload ?? null;
        }
        const { sheet, range } = options.target ? this.resolve(options.target) : { sheet: this.sheet, range: this._sel.ranges[this._sel.ranges.length - 1] };
        if (payload?.cut && Clipboard._cut?.id === payload.id && Clipboard._cut.ctrl === this && mode === "all") {
            const cut = Clipboard._cut;
            Clipboard._cut = null; this._clipboardRange = null;
            return this.moveRange({ ...cut.range, sheet: cut.sheet }, { row: range.r1, col: range.c1, sheet: sheet.id });
        }
        let block;
        if (payload?.cells) block = this._blockFromPayload(payload, sheet, range);
        else if (table?.rows?.length) block = this._blockFromTable(table.rows, range);
        else if (formats.text !== undefined && formats.text !== null && formats.text !== "") block = this._blockFromText(formats.text);
        if (!block || !block.cells.length) return false;
        const height = block.cells.length, width = Math.max(...block.cells.map(r => r.length));
        const selHeight = range.r2 - range.r1 + 1, selWidth = range.c2 - range.c1 + 1;
        const tilesDown = selHeight % height === 0 ? selHeight / height : 1, tilesRight = selWidth % width === 0 ? selWidth / width : 1;
        return this.batch(() => {
            this._ensureSize(sheet, range.r1 + height * tilesDown, range.c1 + width * tilesRight);
            const cells = [], merges = [];
            for (let tr = 0; tr < tilesDown; tr++) for (let tc = 0; tc < tilesRight; tc++) {
                block.cells.forEach((row, r) => row.forEach((cell, c) => {
                    const targetRow = range.r1 + tr * height + r, targetCol = range.c1 + tc * width + c;
                    let next = cell ? { ...cell } : null;
                    if (next?.f && block.origin) next.f = webexpress.webui.SpreadsheetFormula.translate(next.f, targetRow - (block.origin.row + r), targetCol - (block.origin.col + c));
                    const old = sheet.getCell(targetRow, targetCol);
                    if (mode === "values") {
                        next = { ...old };
                        delete next.f; delete next.v;
                        const value = cell?.f ? block.values?.[r]?.[c] : cell?.v;
                        if (value !== undefined && value !== null) next.v = value;
                    } else if (mode === "formats") {
                        next = { ...old, s: cell?.s, st: cell?.st };
                        if (!next.s) delete next.s;
                        if (!next.st) delete next.st;
                    } else if (mode === "formulas") {
                        next = { ...old };
                        delete next.f; delete next.v;
                        if (cell?.f) next.f = cell.f; else if (cell?.v !== undefined) next.v = cell.v;
                        if (cell?.f && block.origin) next.f = webexpress.webui.SpreadsheetFormula.translate(cell.f, targetRow - (block.origin.row + r), targetCol - (block.origin.col + c));
                    }
                    cells.push({ row: targetRow, col: targetCol, cell: next });
                }));
                if (mode === "all") for (const m of block.merges ?? []) merges.push({ r1: range.r1 + tr * height + m.r1, c1: range.c1 + tc * width + m.c1, r2: range.r1 + tr * height + m.r2, c2: range.c1 + tc * width + m.c2 });
            }
            if (mode === "all" && block.styles && Object.keys(block.styles).some(name => !this._model.styles[name])) {
                this._commit({ type: "styles", value: { ...block.styles, ...this._model.styles } });
            }
            this._commit({ type: "set", sheet: sheet.id, cells });
            if (merges.length) {
                const Address = webexpress.webui.SpreadsheetAddress;
                this._commit({ type: "merges", sheet: sheet.id, merges: sheet.merges.filter(m => !merges.some(n => Address.intersects(m, n))).concat(merges) });
            }
            this._clipboardRange = null;
            this.select({ r1: range.r1, c1: range.c1, r2: range.r1 + height * tilesDown - 1, c2: range.c1 + width * tilesRight - 1 }, { scroll: false });
        }, "paste");
    }

    /**
     * Turns the own clipboard payload into a block of cells.
     * @param {object} payload - The payload.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The target sheet.
     * @param {object} range - The target range.
     * @returns {object} The block { cells, merges, styles, origin, values }.
     */
    _blockFromPayload(payload, sheet, range) {
        const Model = webexpress.webui.SpreadsheetModel;
        const cells = (payload.cells ?? []).slice(0, 100000).map(row => (Array.isArray(row) ? row.slice(0, 16384) : []).map(cell => Model.normalizeCell(cell)));
        const source = this._model.sheet(payload.source?.sheetId);
        // pasting values takes the results the source shows, which only this workbook can compute
        const values = source ? cells.map((row, r) => row.map((cell, c) => (cell?.f ? this._publicValue(this._engine.cellValue(source, payload.source.row + r, payload.source.col + c)) : cell?.v))) : null;
        return {
            cells, values,
            merges: (payload.merges ?? []).filter(m => [m.r1, m.c1, m.r2, m.c2].every(Number.isInteger)),
            styles: payload.styles && typeof payload.styles === "object" ? payload.styles : null,
            origin: Number.isInteger(payload.source?.row) ? { row: payload.source.row, col: payload.source.col } : null
        };
    }

    /**
     * Turns an HTML table into a block of cells: Excel and Google Sheets values and formulas
     * where they are given, the shown text read like typed input otherwise.
     * @param {Array<Array<object>>} rows - The parsed rows.
     * @param {object} range - The target range.
     * @returns {object} The block.
     */
    _blockFromTable(rows, range) {
        const out = [], merges = [];
        const taken = new Set();
        rows.forEach((row, r) => {
            out[r] ??= [];
            let c = 0;
            for (const source of row) {
                while (taken.has(r + ":" + c)) c++;
                let cell = {};
                if (source.r1c1) {
                    const formula = webexpress.webui.SpreadsheetClipboard.fromR1C1(source.r1c1, range.r1 + r, range.c1 + c);
                    if (formula) cell.f = formula;
                }
                if (!cell.f && source.formula) cell.f = source.formula;
                if (!cell.f) {
                    if (source.value !== undefined) cell.v = source.value;
                    else {
                        const parsed = webexpress.webui.SpreadsheetFormat.parseInput(source.text, this.locale);
                        if (parsed.formula) cell.v = source.text;
                        else if (parsed.value !== null) { cell.v = parsed.value; if (parsed.format) cell.s = { nf: parsed.format }; }
                    }
                }
                if (source.style) cell.s = { ...source.style, ...(cell.s ?? {}), ...(source.style.nf ? { nf: source.style.nf } : {}) };
                out[r][c] = webexpress.webui.SpreadsheetModel.normalizeCell(cell);
                if (source.colspan > 1 || source.rowspan > 1) {
                    merges.push({ r1: r, c1: c, r2: r + source.rowspan - 1, c2: c + source.colspan - 1 });
                    for (let dr = 0; dr < source.rowspan; dr++) for (let dc = 0; dc < source.colspan; dc++) if (dr || dc) taken.add((r + dr) + ":" + (c + dc));
                }
                c += source.colspan;
            }
        });
        for (let r = 0; r < out.length; r++) { out[r] ??= []; for (let c = 0; c < out[r].length; c++) if (out[r][c] === undefined) out[r][c] = null; }
        return { cells: out, merges, origin: null };
    }

    /**
     * Turns tab-separated text into a block of cells.
     * @param {string} text - The text.
     * @returns {object} The block.
     */
    _blockFromText(text) {
        const source = String(text).replace(/\r\n?/g, "\n").replace(/\n$/, "");
        const rows = source.includes("\t") || source.includes("\n") ? webexpress.webui.SpreadsheetClipboard.parseDelimited(source, "\t") : [[source]];
        return {
            cells: rows.map(row => row.map(field => {
                const parsed = webexpress.webui.SpreadsheetFormat.parseInput(field, this.locale);
                if (parsed.formula) return { f: parsed.formula };
                if (parsed.value === null) return null;
                return parsed.format ? { v: parsed.value, s: { nf: parsed.format } } : { v: parsed.value };
            })),
            origin: null
        };
    }

    /**
     * Imports delimited text (CSV or TSV) into a sheet, replacing its content.
     * @param {string} text - The text.
     * @param {object} [options] - { sheet, delimiter, start: the top-left cell (default A1) }.
     * @returns {boolean} True if imported.
     */
    importCsv(text, options = {}) {
        const rows = webexpress.webui.SpreadsheetClipboard.parseDelimited(text, options.delimiter);
        const { sheet, range } = this.resolve(options.start ?? "A1", options.sheet);
        return this.batch(() => {
            if (!options.start) this.clear({ r1: 0, c1: 0, r2: sheet.rowCount - 1, c2: sheet.colCount - 1, sheet: sheet.id }, "all");
            this.setRange({ row: range.r1, col: range.c1, sheet: sheet.id }, rows, { sheet: sheet.id });
        }, "import");
    }

    /**
     * Exports the used range of a sheet as delimited text with the shown texts.
     * @param {object} [options] - { sheet, delimiter (default ","), values: raw values instead of shown texts }.
     * @returns {string} The text.
     */
    exportCsv(options = {}) {
        const sheet = options.sheet ? this._model.sheet(options.sheet) : this.sheet;
        const used = sheet.usedRange();
        if (!used) return "";
        const rows = this.getRange({ r1: 0, c1: 0, r2: used.r2, c2: used.c2, sheet: sheet.id }, { display: !options.values });
        return webexpress.webui.SpreadsheetClipboard.toDelimited(rows.map(r => r.map(v => (v === null ? "" : String(v)))), options.delimiter ?? ",");
    }

    /**
     * Exports a range as an HTML table with inline styles.
     * @param {*} [ref] - The range; the used range of the active sheet when omitted.
     * @returns {string} The HTML.
     */
    exportHtml(ref) {
        const target = ref ? this.resolve(ref) : { sheet: this.sheet, range: this.sheet.usedRange() ?? { r1: 0, c1: 0, r2: 0, c2: 0 } };
        return this._clipboardData(target.sheet, target.range, false).html;
    }

    // ------------------------------------------------------------------ history and transactions

    /**
     * Runs several changes as one transaction: one undo step, one change event.
     * @param {Function} fn - The function making the changes through the API.
     * @param {string} [label="batch"] - The label of the undo step.
     * @param {string} [mergeKey] - Merges the step with a directly preceding one of the same key.
     * @returns {boolean} True if anything changed.
     */
    batch(fn, label = "batch", mergeKey) {
        if (this._tx) { fn(); return true; }
        const before = this._selectionState();
        this._tx = { redo: [], undo: [], steps: [], changes: webexpress.webui.SpreadsheetModel.emptyChanges(), label, mergeKey, source: "api" };
        let tx;
        try { fn(); } finally { tx = this._tx; this._tx = null; }
        if (!tx.redo.length) return false;
        this._finish(tx.changes, { label: tx.label, mergeKey: tx.mergeKey, redo: { type: "batch", ops: tx.redo }, undo: { type: "batch", ops: tx.undo.reverse() }, steps: tx.steps, before });
        return true;
    }

    /**
     * Applies a model operation as a transaction of its own, or as part of the running one.
     * This is the entry for plugins that need an operation the API does not offer.
     * @param {object} op - The operation.
     * @param {object} [options] - { label, mergeKey }.
     * @returns {boolean} True if applied.
     */
    applyOperation(op, options = {}) { return this._commit(op, options); }

    /**
     * Applies an operation and routes its change log.
     * @param {object} op - The operation.
     * @param {object} [options] - { label, mergeKey, record: false to keep it out of the history }.
     * @returns {boolean} True if applied.
     */
    _commit(op, options = {}) {
        if (this._destroyed || this.readOnly && !options.force) return false;
        const before = this._tx ? null : this._selectionState();
        let result;
        try { result = this._model.apply(op); } catch (e) {
            console.warn("spreadsheet: operation refused", e);
            this._announce(e.message);
            return false;
        }
        if (!this._hasChanges(result.changes)) return false;
        this._engineUpdate(result.changes);
        const steps = this._collab ? this._collab.state.localSteps(result.changes) : [];
        if (this._tx) {
            this._tx.redo.push(op); this._tx.undo.push(result.inverse); this._tx.steps.push(...steps);
            this._mergeChanges(this._tx.changes, result.changes);
            return true;
        }
        this._finish(result.changes, { label: options.label ?? op.type, mergeKey: options.mergeKey, redo: op, undo: result.inverse, steps, before, record: options.record });
        return true;
    }

    /**
     * Determines whether a change log records anything.
     * @param {object} changes - The log.
     * @returns {boolean} True if something changed.
     */
    _hasChanges(changes) {
        return changes.cells.length || changes.structure.length || changes.axis.length || changes.sheets.length || changes.merges.size || changes.frozen.size || changes.props.size || changes.names || changes.styles || changes.meta;
    }

    /**
     * Appends one change log to another.
     * @param {object} target - The log extended.
     * @param {object} source - The log appended.
     */
    _mergeChanges(target, source) {
        for (const key of ["cells", "structure", "axis", "sheets"]) target[key].push(...source[key]);
        for (const key of ["merges", "frozen", "props"]) source[key].forEach(id => target[key].add(id));
        for (const key of ["names", "styles", "meta"]) target[key] ||= source[key];
        if (source.calculated) (target.calculated ??= []).push(...source.calculated);
    }

    /**
     * Brings the engine up to date and remembers which results changed.
     * @param {object} changes - The change log.
     */
    _engineUpdate(changes) { changes.calculated = this._engine.update(changes); }

    /**
     * Completes a transaction: history, collaboration, view, events and form value.
     * @param {object} changes - The change log.
     * @param {object} info - { label, mergeKey, redo, undo, steps, before, record, source }.
     */
    _finish(changes, info) {
        if (info.record !== false) {
            if (this._collab) {
                if (info.steps.length) this._collab.history.record(info.steps);
            } else this._history.record({ redo: info.redo, undo: info.undo, label: info.label, mergeKey: info.mergeKey, before: info.before, after: this._selectionState() });
        }
        if (this._collab && info.steps.length) this._emitSteps(info.steps);
        this._log(changes, info.source ?? "user", null);
        this._afterChange(changes, info.source ?? "user");
    }

    /**
     * Updates everything that follows a change of the workbook.
     * @param {object} changes - The change log.
     * @param {string} source - "user", "api", "undo", "redo" or "remote".
     * @param {object} [meta] - Information about a remote change.
     */
    _afterChange(changes, source, meta) {
        if (this._destroyed) return;
        if (!this._model.sheet(this._activeSheetId)) this._activeSheetId = this._model.sheets[0].id;
        if (changes.structure.length || changes.sheets.length || changes.axis.length || changes.frozen.size || changes.props.size) {
            this._clampSelections();
            this._view.measure();
        }
        if (changes.styles || changes.structure.length || changes.axis.length || changes.merges.size || changes.props.size) this._view.invalidate();
        if (this._clipboardRange && changes.cells.some(c => c.sheet === this._clipboardRange.sheet && webexpress.webui.SpreadsheetAddress.contains(this._clipboardRange, c.row, c.col))) this._clipboardRange = null;
        this._view.render();
        if (source === "remote" && meta?.user) {
            for (const change of changes.cells.slice(0, 200)) if (change.sheet === this.sheet.id && !change.removed) this._view.flash(change.row, change.col, this._peerColor(meta.user));
        }
        this._refreshChrome();
        this._plugins.forEach(plugin => plugin.onChange?.(this, changes));
        this._emitEvents(changes, source);
        this._syncValue(true);
        this._scheduleAutosave();
    }

    /**
     * Keeps every selection inside its sheet after rows or columns were removed.
     */
    _clampSelections() {
        for (const [id, sel] of this._sels) {
            const sheet = this._model.sheet(id);
            if (!sheet) { this._sels.delete(id); continue; }
            const row = r => Math.max(0, Math.min(sheet.rowCount - 1, r)), col = c => Math.max(0, Math.min(sheet.colCount - 1, c));
            sel.ranges = sel.ranges.map(r => ({ r1: row(r.r1), c1: col(r.c1), r2: row(r.r2), c2: col(r.c2) }));
            for (const key of ["active", "anchor", "focus"]) sel[key] = { row: row(sel[key].row), col: col(sel[key].col) };
            // a hidden active cell is neither drawn nor reachable, and typing would land unseen
            const shown = { row: this._nearestShown(sheet.rowProps, sheet.rowCount, sel.active.row), col: this._nearestShown(sheet.colProps, sheet.colCount, sel.active.col) };
            if (shown.row !== sel.active.row || shown.col !== sel.active.col) {
                sel.ranges = [{ r1: shown.row, c1: shown.col, r2: shown.row, c2: shown.col }];
                sel.active = { ...shown }; sel.anchor = { ...shown }; sel.focus = { ...shown };
            }
        }
    }

    /**
     * Finds the visible row or column closest to an index, preferring the ones after it.
     * @param {Array<object>} props - The row or column properties.
     * @param {number} count - The number of rows or columns.
     * @param {number} index - The index.
     * @returns {number} The visible index; the index itself if none is visible.
     */
    _nearestShown(props, count, index) {
        if (!props[index]?.hidden) return index;
        for (let i = index + 1; i < count; i++) if (!props[i]?.hidden) return i;
        for (let i = index - 1; i >= 0; i--) if (!props[i]?.hidden) return i;
        return index;
    }

    /**
     * Dispatches the events of a change log.
     * @param {object} changes - The change log.
     * @param {string} source - The source of the change.
     */
    _emitEvents(changes, source) {
        const Event = webexpress.webui.Event, Address = webexpress.webui.SpreadsheetAddress;
        const name = id => this._model.sheet(id)?.name ?? null;
        for (const change of changes.sheets) {
            const type = { add: Event.SPREADSHEET_SHEET_CREATED_EVENT, remove: Event.SPREADSHEET_SHEET_DELETED_EVENT, rename: Event.SPREADSHEET_SHEET_RENAMED_EVENT, move: Event.SPREADSHEET_SHEET_MOVED_EVENT }[change.type];
            this._dispatch(type, { sheetId: change.sheet, sheet: name(change.sheet) ?? change.before ?? null, index: change.index ?? change.to, from: change.from, before: change.before, after: change.after, source });
        }
        for (const change of changes.structure) {
            const type = { insertRows: Event.SPREADSHEET_ROW_ADDED_EVENT, deleteRows: Event.SPREADSHEET_ROW_REMOVED_EVENT, insertCols: Event.SPREADSHEET_COLUMN_ADDED_EVENT, deleteCols: Event.SPREADSHEET_COLUMN_REMOVED_EVENT }[change.type];
            this._dispatch(type, { sheetId: change.sheet, sheet: name(change.sheet), index: change.index, count: change.count, source });
        }
        const visible = changes.cells.filter(c => !c.removed && this._model.sheet(c.sheet));
        if (visible.length) {
            const describe = c => ({
                sheet: name(c.sheet), sheetId: c.sheet, ref: Address.cellName(c.row, c.col), row: c.row, col: c.col,
                before: c.before?.f ?? c.before?.v ?? null, after: c.after?.f ?? c.after?.v ?? null,
                value: this._publicValue(this._engine.cellValue(c.sheet, c.row, c.col))
            });
            this._dispatch(Event.SPREADSHEET_CELL_CHANGED_EVENT, { cells: visible.map(describe), source });
            const formulas = visible.filter(c => (c.before?.f ?? null) !== (c.after?.f ?? null));
            if (formulas.length) this._dispatch(Event.SPREADSHEET_FORMULA_CHANGED_EVENT, { cells: formulas.map(c => ({ ...describe(c), before: c.before?.f ?? null, after: c.after?.f ?? null })), source });
        }
        if (changes.calculated?.length) {
            this._dispatch(Event.SPREADSHEET_CALCULATED_EVENT, { cells: changes.calculated.slice(0, 10000).map(c => ({ sheet: name(c.sheet), sheetId: c.sheet, ref: Address.cellName(c.row, c.col), row: c.row, col: c.col, value: this._publicValue(c.value) })) });
        }
    }

    /**
     * Records a change for the change history: who changed what and when.
     * @param {object} changes - The change log.
     * @param {string} source - The source.
     * @param {object|null} user - The user of a remote change.
     */
    _log(changes, source, user) {
        const cells = changes.cells.filter(c => !c.removed);
        const entry = {
            time: new Date().toISOString(), source, user: user ? { id: user.id, name: user.name } : (this._options.userName ? { name: this._options.userName } : null),
            cells: cells.length, structure: changes.structure.map(s => ({ type: s.type, sheet: s.sheet, index: s.index, count: s.count })),
            sheets: changes.sheets.map(s => ({ type: s.type, sheet: s.sheet })),
            refs: cells.slice(0, 20).map(c => (this._model.sheet(c.sheet)?.name ?? c.sheet) + "!" + webexpress.webui.SpreadsheetAddress.cellName(c.row, c.col))
        };
        this._changeLog.push(entry);
        if (this._changeLog.length > 500) this._changeLog.shift();
    }

    /**
     * Returns the change history of this session, oldest first: local, undone, redone and
     * remote changes with the user who made them.
     * @returns {Array<object>} The entries.
     */
    getChangeLog() { return this._changeLog.map(e => ({ ...e })); }

    /**
     * Captures the selection for the history.
     * @returns {object} The state.
     */
    _selectionState() {
        const sel = this._sel;
        return { sheet: this.sheet.id, ranges: sel.ranges.map(r => ({ ...r })), active: { ...sel.active } };
    }

    /**
     * Restores a captured selection.
     * @param {object} state - The state.
     */
    _restoreSelection(state) {
        if (!state || !this._model.sheet(state.sheet)) return;
        if (state.sheet !== this._activeSheetId) this.activateSheet(state.sheet);
        const last = state.ranges[state.ranges.length - 1];
        this._setSelection(state.ranges, state.active, { row: last.r1, col: last.c1 }, { row: last.r2, col: last.c2 });
    }

    /**
     * Gets whether an undo step exists.
     * @returns {boolean} True if undo is available.
     */
    canUndo() { return this._collab ? this._collab.history.canUndo() : this._history.canUndo(); }

    /**
     * Gets whether a redo step exists.
     * @returns {boolean} True if redo is available.
     */
    canRedo() { return this._collab ? this._collab.history.canRedo() : this._history.canRedo(); }

    /**
     * Gets the undo history, whose limit and merge window can be changed at runtime.
     * @returns {webexpress.webui.SpreadsheetHistory} The history.
     */
    get history() { return this._history; }

    /**
     * Undoes the last transaction. While shared, only the own changes are undone.
     * @returns {boolean} True if something was undone.
     */
    undo() { return this._step(false); }

    /**
     * Redoes the last undone transaction.
     * @returns {boolean} True if something was redone.
     */
    redo() { return this._step(true); }

    /**
     * Undoes or redoes.
     * @param {boolean} redo - True to redo.
     * @returns {boolean} True if a step was applied.
     */
    _step(redo) {
        if (this.readOnly || this._destroyed) return false;
        if (this._editing) this._cancelEdit();
        const Event = webexpress.webui.Event;
        if (this._collab) {
            let changes = null;
            const apply = steps => {
                const result = this._collab.state.remoteSteps(steps);
                if (!result) return null;
                changes = this._collab.state.applyReconcile(result.plan);
                this._engineUpdate(changes);
                return this._hasChanges(changes) || result.applied.length ? result.applied : null;
            };
            let applied = null;
            const ok = redo ? this._collab.history.redo(steps => (applied = apply(steps))) : this._collab.history.undo(steps => (applied = apply(steps)));
            if (!ok) { this._refreshChrome(); return false; }
            this._emitSteps(applied);
            this._log(changes, redo ? "redo" : "undo", null);
            this._afterChange(changes, redo ? "redo" : "undo");
            this._dispatch(redo ? Event.SPREADSHEET_REDO_EVENT : Event.SPREADSHEET_UNDO_EVENT, { label: null });
            return true;
        }
        const entry = redo ? this._history.popRedo() : this._history.popUndo();
        if (!entry) return false;
        let result;
        try { result = this._model.apply(redo ? entry.redo : entry.undo); } catch (e) {
            console.warn("spreadsheet: history step failed", e);
            this._history.clear();
            this._refreshChrome();
            return false;
        }
        this._engineUpdate(result.changes);
        this._log(result.changes, redo ? "redo" : "undo", null);
        this._afterChange(result.changes, redo ? "redo" : "undo");
        this._restoreSelection(redo ? entry.after : entry.before);
        this._dispatch(redo ? Event.SPREADSHEET_REDO_EVENT : Event.SPREADSHEET_UNDO_EVENT, { label: entry.label });
        this._announce(this._i18n(redo ? "webexpress.webui:spreadsheet.redone" : "webexpress.webui:spreadsheet.undone", redo ? "Redone" : "Undone"));
        return true;
    }

    /**
     * Discards the history.
     */
    clearHistory() { this._history.clear(); this._collab?.history.reset(); this._refreshChrome(); }

    // ------------------------------------------------------------------ formulas

    /**
     * Evaluates a formula without storing it.
     * @param {string} formula - The formula, with or without "=".
     * @param {*} [ref] - The cell it is evaluated at (relative references); A1 when omitted.
     * @returns {*} The result; an error as its code.
     */
    evaluate(formula, ref) {
        const { sheet, range } = ref ? this.resolve(ref) : { sheet: this.sheet, range: { r1: 0, c1: 0 } };
        return this._publicValue(this._engine.evaluate(formula, sheet, range.r1, range.c1));
    }

    /**
     * Recalculates every formula, including the volatile ones such as NOW().
     * @returns {number} The number of results that changed.
     */
    recalculate() {
        const calculated = this._engine.recalculate();
        this._view.render();
        this._refreshChrome();
        if (calculated.length) {
            const changes = webexpress.webui.SpreadsheetModel.emptyChanges();
            changes.calculated = calculated;
            this._emitEvents(changes, "calculation");
            this._syncValue(true);
        }
        return calculated.length;
    }

    // ------------------------------------------------------------------ commands

    /**
     * Runs a named command, as toolbar buttons, menus and shortcuts do.
     * @param {string} command - The command name, case-insensitive.
     * @param {*} [value] - The argument, such as a color or a format code.
     * @returns {*} The command's result.
     */
    execCommand(command, value = null) {
        if (this._destroyed) return false;
        const cmd = String(command).toLowerCase();
        const sel = this._sel, last = sel.ranges[sel.ranges.length - 1];
        const rows = last.r2 - last.r1 + 1, cols = last.c2 - last.c1 + 1;
        if (this._editing && !["undo", "redo"].includes(cmd)) this._commitEdit();
        switch (cmd) {
            case "undo": return this.undo();
            case "redo": return this.redo();
            case "copy": return this.copy();
            case "cut": return this.cut();
            case "paste": return this.paste();
            case "pastevalues": return this.paste({ mode: "values" });
            case "pasteformats": return this.paste({ mode: "formats" });
            case "bold": case "italic": case "underline": case "strike": case "wrap": return this.toggleStyle(cmd);
            case "font": return this.setStyle(null, { font: value || null }, { label: "font" });
            case "size": return this.setStyle(null, { size: value ? Number(value) : null }, { label: "size" });
            case "color": return this.setStyle(null, { color: value || null }, { label: "color" });
            case "fill": return this.setStyle(null, { fill: value || null }, { label: "fill" });
            case "align": return this.setStyle(null, { align: this.queryCommandValue("align") === value ? null : value }, { label: "align" });
            case "valign": return this.setStyle(null, { valign: value || null }, { label: "valign" });
            case "indent": case "outdent": {
                const current = this.getStyle({ row: sel.active.row, col: sel.active.col }).indent ?? 0;
                return this.setStyle(null, { indent: Math.max(0, Math.min(15, current + (cmd === "indent" ? 1 : -1))) || null }, { label: "indent" });
            }
            case "numberformat": return this.setNumberFormat(null, value);
            case "currency": return this.setNumberFormat(null, webexpress.webui.SpreadsheetFormat.locale(this.locale).currencyFormat);
            case "percent": return this.setNumberFormat(null, "0%");
            case "thousands": return this.setNumberFormat(null, "#,##0.00");
            case "decimalincrease": case "decimaldecrease": return this._changeDecimals(cmd === "decimalincrease" ? 1 : -1);
            case "border": return this.setBorder(null, value || "all");
            case "clearformat": return this.clear(null, "formats");
            case "clearcontents": return this.clear(null, "contents");
            case "clearall": return this.clear(null, "all");
            case "merge": {
                const merged = this.sheet.merges.find(m => m.r1 === last.r1 && m.c1 === last.c1 && m.r2 === last.r2 && m.c2 === last.c2);
                return merged ? this.unmerge() : this.merge(null, { center: value !== "cells" });
            }
            case "unmerge": return this.unmerge();
            case "cellstyle": return this.applyCellStyle(null, value || null);
            case "formatpainter": this._painter = this._painter ? null : this.getCell({ row: sel.active.row, col: sel.active.col }).raw; this._refreshChrome(); return !!this._painter;
            case "insertrowabove": return this.insertRows(last.r1, rows);
            case "insertrowbelow": return this.insertRows(last.r2 + 1, rows);
            case "insertcolleft": return this.insertColumns(last.c1, cols);
            case "insertcolright": return this.insertColumns(last.c2 + 1, cols);
            case "deleterow": return this.deleteRows(last.r1, Math.min(rows, this.sheet.rowCount - 1));
            case "deletecol": return this.deleteColumns(last.c1, Math.min(cols, this.sheet.colCount - 1));
            case "hiderow": return this.hideRows(last.r1, rows);
            case "hidecol": return this.hideColumns(last.c1, cols);
            case "unhiderow": return this.hideRows(last.r1, rows, false);
            case "unhidecol": return this.hideColumns(last.c1, cols, false);
            case "unhide": return this.batch(() => { this.hideRows(last.r1, rows, false); this.hideColumns(last.c1, cols, false); }, "show");
            case "freeze": {
                const sheet = this.sheet;
                if (sheet.frozenRows || sheet.frozenCols) return this.freeze(0, 0);
                return sel.active.row === 0 && sel.active.col === 0 ? this.freeze(1, 0) : this.freeze(sel.active.row, sel.active.col);
            }
            case "freezerow": return this.freeze(1, 0);
            case "freezecol": return this.freeze(0, 1);
            case "unfreeze": return this.freeze(0, 0);
            case "sortasc": return this.sort(rows > 1 ? null : undefined, { descending: false });
            case "sortdesc": return this.sort(rows > 1 ? null : undefined, { descending: true });
            case "filldown": return rows > 1 && this.autoFill({ r1: last.r1, c1: last.c1, r2: last.r1, c2: last.c2 }, last, { copy: true });
            case "fillright": return cols > 1 && this.autoFill({ r1: last.r1, c1: last.c1, r2: last.r2, c2: last.c1 }, last, { copy: true });
            case "autosum": return this._autoSum(value || "SUM");
            case "insertfunction": return this._startEdit({ text: "=" + String(value || "SUM").toUpperCase() + "(", mode: "enter" });
            case "comment": return this._openComment();
            case "find": return this._plugins.find(p => typeof p.openFind === "function")?.openFind(this, false);
            case "replace": return this._plugins.find(p => typeof p.openFind === "function")?.openFind(this, true);
            case "recalculate": return this.recalculate();
            case "zoomin": return (this.zoom = this.constructor.ZOOMS.find(z => z > this.zoom + 0.001) ?? this.zoom);
            case "zoomout": return (this.zoom = [...this.constructor.ZOOMS].reverse().find(z => z < this.zoom - 0.001) ?? this.zoom);
            case "zoom": return (this.zoom = Number(value) || 1);
            case "selectall": return this.selectAll();
            case "addsheet": return this.addSheet(value || undefined);
            case "gridlines": return this._commit({ type: "sheetProps", sheet: this.sheet.id, props: { ...this.sheet.props, gridlines: this.sheet.props.gridlines === false ? undefined : false } }, { label: "gridlines" });
            default: return false;
        }
    }

    /**
     * Determines whether a toggle command is active at the active cell.
     * @param {string} command - The command.
     * @returns {boolean} True if active.
     */
    queryCommandState(command) {
        const cmd = String(command).toLowerCase(), sel = this._sel;
        const style = webexpress.webui.SpreadsheetModel.effectiveStyle(this._model, this.sheet, sel.active.row, sel.active.col);
        if (["bold", "italic", "underline", "strike", "wrap"].includes(cmd)) return !!style[cmd];
        if (cmd === "merge") return !!this.sheet.mergeAt(sel.active.row, sel.active.col);
        if (cmd === "formatpainter") return !!this._painter;
        if (cmd === "freeze") return !!(this.sheet.frozenRows || this.sheet.frozenCols);
        if (cmd.startsWith("align")) return style.align === cmd.slice(5);
        if (cmd.startsWith("valign")) return (style.valign ?? "bottom") === cmd.slice(6);
        if (cmd === "gridlines") return this.sheet.props.gridlines !== false;
        return false;
    }

    /**
     * Returns the value of a valued command at the active cell, for toolbar indicators.
     * @param {string} command - "font", "size", "color", "fill", "align", "valign",
     * "numberformat" or "cellstyle".
     * @returns {*} The value.
     */
    queryCommandValue(command) {
        const cmd = String(command).toLowerCase(), sel = this._sel;
        const style = webexpress.webui.SpreadsheetModel.effectiveStyle(this._model, this.sheet, sel.active.row, sel.active.col);
        const map = { font: style.font, size: style.size, color: style.color, fill: style.fill, align: style.align, valign: style.valign, numberformat: style.nf, cellstyle: this.sheet.getCell(sel.active.row, sel.active.col)?.st };
        return map[cmd] ?? null;
    }

    /**
     * Shows one decimal place more or less.
     * @param {number} delta - 1 or -1.
     * @returns {boolean} True if changed.
     */
    _changeDecimals(delta) {
        const sel = this._sel;
        const style = this.getStyle({ row: sel.active.row, col: sel.active.col });
        let code = style.nf;
        if (!code || /^general$/i.test(code)) {
            const value = this._engine.cellValue(this.sheet, sel.active.row, sel.active.col);
            // text has no decimal places to show; its format stays General
            if (typeof value !== "number") return false;
            const decimals = typeof value === "number" ? (String(Number(value.toPrecision(10))).split(".")[1]?.length ?? 0) : 0;
            code = decimals ? "0." + "0".repeat(decimals) : "0";
        }
        const match = /0(\.0*)?/.exec(code);
        if (!match || webexpress.webui.SpreadsheetFormat.isDateFormat(code)) return false;
        const places = Math.max(0, (match[1] ? match[1].length - 1 : 0) + delta);
        const next = code.replace(/0(\.0*)?/, places ? "0." + "0".repeat(places) : "0");
        return this.setStyle(null, { nf: next }, { label: "decimals", mergeKey: "decimals" });
    }

    /**
     * Inserts a sum (or another aggregate) of the numbers above or left of the active cell, or
     * below a selected column of numbers.
     * @param {string} name - The function, such as "SUM" or "AVERAGE".
     * @returns {boolean} True if inserted.
     */
    _autoSum(name) {
        const sheet = this.sheet, sel = this._sel, last = sel.ranges[sel.ranges.length - 1];
        const Address = webexpress.webui.SpreadsheetAddress;
        const numeric = (r, c) => typeof this._engine.cellValue(sheet, r, c) === "number";
        if (last.r2 > last.r1 || last.c2 > last.c1) {
            return this.batch(() => {
                this._ensureSize(sheet, last.r2 + 2, last.c2 + 1);
                for (let c = last.c1; c <= last.c2; c++) {
                    this._commit({ type: "set", sheet: sheet.id, cells: [{ row: last.r2 + 1, col: c, cell: { f: "=" + name + "(" + Address.rangeName({ r1: last.r1, c1: c, r2: last.r2, c2: c }) + ")" } }] });
                }
            }, "autosum");
        }
        const { row, col } = sel.active;
        let r1 = row - 1;
        while (r1 >= 0 && numeric(r1, col)) r1--;
        let text;
        if (r1 < row - 1) text = "=" + name + "(" + Address.rangeName({ r1: r1 + 1, c1: col, r2: row - 1, c2: col }) + ")";
        else {
            let c1 = col - 1;
            while (c1 >= 0 && numeric(row, c1)) c1--;
            text = "=" + name + "(" + (c1 < col - 1 ? Address.rangeName({ r1: row, c1: c1 + 1, r2: row, c2: col - 1 }) : "") + ")";
        }
        this._startEdit({ text, mode: "enter" });
        return true;
    }

    // ------------------------------------------------------------------ collaboration

    /**
     * Names the document kind this control shares: a workbook of book, sheet, column and row
     * leaves (see SpreadsheetCollab and the server's SpreadsheetSchema).
     * @returns {string} The kind.
     */
    get collaborationKind() { return "spreadsheet"; }

    /**
     * Gets whether the workbook is currently shared.
     * @returns {boolean} True while shared.
     */
    get collaborating() { return !!this._collab; }

    /**
     * Starts sharing the workbook: changes are announced as steps through
     * COLLABORATION_STEPS_EVENT, undo inverts only the own steps and new ids carry the client tag.
     * @param {object} [options] - { tag: the client tag, lowercase letters and digits }.
     */
    beginCollaboration(options = {}) {
        if (this._destroyed) return;
        if (this._editing) this._commitEdit();
        if (/^[a-z\d]{1,12}$/.test(options.tag ?? "")) this._model.idTag = options.tag;
        this._collab = { state: new webexpress.webui.SpreadsheetCollab(this._model), history: new webexpress.webui.OtHistory(), host: !options.session };
        this._history.clear();
        this._refreshChrome();
    }

    /**
     * Stops sharing; the own history starts afresh.
     */
    endCollaboration() {
        if (!this._collab) return;
        this._collab = null;
        this._model.idTag = "";
        this._history.clear();
        this._view.renderOverlay();
        this._refreshChrome();
    }

    /**
     * Returns the workbook as packed tokens.
     * @returns {Array<object>} The tokens.
     */
    getCollaborationTokens() {
        const state = this._collab?.state ?? new webexpress.webui.SpreadsheetCollab(this._model);
        return webexpress.webui.Ot.compact(state.tokens);
    }

    /**
     * Replaces the workbook with the shared state, as on joining or after a resynchronization.
     * @param {Array<object>} tokens - The packed tokens.
     * @returns {boolean} True if the tokens formed a valid workbook.
     */
    loadCollaborationTokens(tokens) {
        let expanded;
        try { expanded = webexpress.webui.Ot.expand(tokens); } catch { return false; }
        if (!webexpress.webui.SpreadsheetCollab.check(expanded)) return false;
        if (this._editing) this._cancelEdit();
        const active = this.sheet.id;
        const model = webexpress.webui.SpreadsheetCollab.toModel(expanded);
        model.idTag = this._model.idTag;
        this._model = model;
        this._engine = new webexpress.webui.SpreadsheetEngine(model);
        if (this._collab) {
            this._collab.state = new webexpress.webui.SpreadsheetCollab(model);
            this._collab.history.reset();
        }
        this._activeSheetId = model.sheet(active)?.id ?? model.sheets[0].id;
        this._clampSelections();
        this._view.measure(); this._view.invalidate(); this._view.render();
        this._refreshChrome();
        this._syncValue(true);
        return true;
    }

    /**
     * Checks packed tokens against the workbook schema.
     * @param {Array<object>} tokens - The tokens.
     * @returns {boolean} True if valid.
     */
    checkCollaborationTokens(tokens) {
        try { return webexpress.webui.SpreadsheetCollab.check(webexpress.webui.Ot.expand(tokens)); } catch { return false; }
    }

    /**
     * Repairs tokens that concurrent changes left invalid.
     * @param {Array<object>} tokens - The broken tokens.
     * @returns {Array<object>|null} The repaired packed tokens, or null.
     */
    repairCollaborationTokens(tokens) {
        try {
            const repaired = webexpress.webui.SpreadsheetCollab.repair(webexpress.webui.Ot.expand(tokens));
            return repaired ? webexpress.webui.Ot.compact(repaired) : null;
        } catch { return null; }
    }

    /**
     * Applies steps another user made. They update the workbook like any change, but are
     * neither announced again nor undoable here. A cell someone else changed while it is being
     * edited here is reported as a conflict; the edit continues and wins when committed.
     * @param {Array<object>} steps - The steps, based on the current shared state.
     * @param {object} [meta] - { user, client } of the author.
     * @returns {boolean} True if the steps applied.
     */
    applyRemoteSteps(steps, meta = {}) {
        if (!this._collab || this._destroyed) return false;
        const result = this._collab.state.remoteSteps(steps);
        if (!result) return false;
        const changes = this._collab.state.applyReconcile(result.plan);
        this._engineUpdate(changes);
        this._collab.history.remote(result.applied);
        if (this._editing && changes.cells.some(c => c.sheet === this._editing.sheet && c.row === this._editing.row && c.col === this._editing.col)) {
            this._dispatch(webexpress.webui.Event.SPREADSHEET_CONFLICT_EVENT, { reason: "edited", ref: webexpress.webui.SpreadsheetAddress.cellName(this._editing.row, this._editing.col), user: meta.user ?? null });
            this._announce(this._i18n("webexpress.webui:spreadsheet.conflict", "This cell was changed by someone else meanwhile."));
        }
        this._log(changes, "remote", meta.user ?? null);
        this._afterChange(changes, "remote", meta);
        return true;
    }

    /**
     * Gets the active cell as linear positions of the shared tokens: the row leaf as anchor and
     * the column leaf as focus, so a host can carry the cell through concurrent changes.
     * @returns {{anchor: number, focus: number}|null} The selection.
     */
    getModelSelection() {
        if (!this._collab) return null;
        const index = this._collab.state.index(), sheet = this.sheet, sel = this._sel;
        this._model.ensureIds(sheet);
        const anchor = index.pos.get("row:" + sheet.rowIds[sel.active.row]), focus = index.pos.get("col:" + sheet.colIds[sel.active.col]);
        return anchor === undefined || focus === undefined ? null : { anchor, focus };
    }

    /**
     * Measures where a host draws the caret of another user: the header of the column or row
     * the position names.
     * @param {number} pos - The linear position.
     * @returns {{left: number, top: number, height: number}|null} The viewport rectangle.
     */
    getModelPositionRect(pos) {
        const token = this._collab?.state.tokens[pos];
        if (!token || (token.n !== "col" && token.n !== "row")) return null;
        const found = this._locate(token);
        if (!found || found.sheet !== this.sheet) return null;
        const box = this._view.pane.getBoundingClientRect();
        if (token.n === "col") return { left: box.left + this._view.colX(found.index), top: box.top, height: this._view.headerHeight };
        return { left: box.left, top: box.top + this._view.rowY(found.index), height: this._view.rows.sizeOf(found.index) };
    }

    /**
     * Measures the cell a host highlights for another user: the cell of the row and column the
     * two positions name.
     * @param {number} from - One position.
     * @param {number} to - The other position.
     * @returns {Array<{left: number, top: number, width: number, height: number}>} The rectangles.
     */
    getModelRangeRects(from, to) {
        const tokens = this._collab?.state.tokens;
        if (!tokens) return [];
        const a = tokens[from], b = tokens[to];
        const rowToken = [a, b].find(t => t?.n === "row"), colToken = [a, b].find(t => t?.n === "col");
        if (!rowToken || !colToken) return [];
        const row = this._locate(rowToken), col = this._locate(colToken);
        if (!row || !col || row.sheet !== this.sheet || col.sheet !== this.sheet) return [];
        return [this._view.clientRect(row.index, col.index)];
    }

    /**
     * Finds the sheet and index of a row or column leaf.
     * @param {object} token - The leaf.
     * @returns {{sheet: webexpress.webui.SpreadsheetSheet, index: number}|null} The position.
     */
    _locate(token) {
        for (const sheet of this._model.sheets) {
            const maps = this._collab.state.maps(sheet);
            const index = (token.n === "row" ? maps.rows : maps.cols).get(token.id);
            if (index !== undefined) return { sheet, index };
        }
        return null;
    }

    /**
     * Announces local steps to the collaboration host and the provider session.
     * @param {Array<object>} steps - The applied steps.
     */
    _emitSteps(steps) {
        if (!steps?.length) return;
        this._dispatch(webexpress.webui.Event.COLLABORATION_STEPS_EVENT, { steps: webexpress.webui.Ot.clone(steps) });
        this._session?.local(steps);
    }

    /**
     * Shares the workbook through a provider (see SpreadsheetCollaborationProvider).
     * @param {webexpress.webui.SpreadsheetCollaborationProvider} provider - The provider.
     * @param {object} [options] - { user: { id, name, color }, client }.
     * @returns {Promise<webexpress.webui.SpreadsheetCollaboration>} The session, once joined.
     */
    async connect(provider, options = {}) {
        this.disconnect();
        const session = new webexpress.webui.SpreadsheetCollaboration(this, provider, { user: options.user ?? { name: this._options.userName || undefined }, client: options.client });
        this._session = session;
        const begin = this.beginCollaboration.bind(this);
        this.beginCollaboration = (opts) => begin({ ...opts, session: true });
        try { await session.connect(); } finally { delete this.beginCollaboration; }
        this._refreshChrome();
        return session;
    }

    /**
     * Stops sharing through a provider.
     */
    disconnect() {
        const session = this._session;
        if (!session) return;
        this._session = null;
        session.disconnect();
        this._refreshChrome();
    }

    /**
     * Lists the other users of the shared workbook with their selections.
     * @returns {Array<{client: string, user: object, selection: object|null}>} The users.
     */
    get collaborators() {
        if (!this._session) return [];
        return [...this._session.peers].map(([client, peer]) => ({ client, user: { ...peer.user }, selection: this._collab?.state.decodeSelection(peer.selection) ?? null }));
    }

    /**
     * Encodes the own selection for presence.
     * @returns {object|null} The selection.
     */
    _presenceSelection() {
        if (!this._collab) return null;
        const sel = this._sel;
        return this._collab.state.encodeSelection(this.sheet.id, sel.ranges, sel.active);
    }

    /**
     * Resolves the selections of the other users for drawing.
     * @returns {Array<object>} { sheet, ranges, active, color, name }.
     */
    _peerSelections() {
        if (!this._session || !this._collab) return [];
        const out = [];
        for (const [, peer] of this._session.peers) {
            const decoded = this._collab.state.decodeSelection(peer.selection);
            if (decoded) out.push({ ...decoded, color: this._peerColor(peer.user), name: peer.user?.name ?? "" });
        }
        return out;
    }

    /**
     * Picks the color of a user: their own, or a stable one derived from their id.
     * @param {object} user - The user.
     * @returns {string} The color.
     */
    _peerColor(user) {
        if (user?.color && webexpress.webui.SpreadsheetModel.isColor(user.color)) return user.color;
        const palette = webexpress.webui.SpreadsheetView.COLORS;
        let hash = 0;
        for (const ch of String(user?.id ?? user?.name ?? "")) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
        return palette[hash % palette.length];
    }

    /**
     * Redraws the selections of the other users and the presence list.
     */
    _renderPresence() {
        if (this._destroyed) return;
        this._view.renderOverlay();
        this._renderPeople();
    }

    // ------------------------------------------------------------------ helpers

    /**
     * Visits the stored cells of a range.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {object} range - The range.
     * @param {Function} callback - Called with (cell, row, col).
     */
    _forEachStored(sheet, range, callback) {
        const last = Math.min(range.r2, sheet.rows.length - 1);
        for (let r = range.r1; r <= last; r++) {
            const cells = sheet.rows[r];
            if (!cells) continue;
            const end = Math.min(range.c2, cells.length - 1);
            for (let c = range.c1; c <= end; c++) if (cells[c]) callback(cells[c], r, c);
        }
    }

    /**
     * Rewrites every cell of a range, empty ones included, as one operation; ranges beyond the
     * cell limit only touch stored cells.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {object} range - The range.
     * @param {Function} fn - Returns the new cell for (cell, row, col).
     * @param {string} [label] - The history label.
     * @returns {boolean} True if anything changed.
     */
    _eachCell(sheet, range, fn, label) {
        const cells = [];
        const area = (range.r2 - range.r1 + 1) * (range.c2 - range.c1 + 1);
        if (area <= this.constructor.MAX_CELLS) {
            for (let r = range.r1; r <= range.r2; r++) for (let c = range.c1; c <= range.c2; c++) cells.push({ row: r, col: c, cell: fn(sheet.getCell(r, c), r, c) });
        } else {
            this._forEachStored(sheet, range, (cell, r, c) => cells.push({ row: r, col: c, cell: fn(cell, r, c) }));
        }
        return this._commit({ type: "set", sheet: sheet.id, cells }, { label: label ?? "format" });
    }

    /**
     * Announces a message to assistive technology through the status live region.
     * @param {string} text - The message.
     */
    _announce(text) {
        if (!this._live || !text) return;
        this._live.textContent = "";
        this.defer(() => { if (this._live) this._live.textContent = text; }, 30);
    }

    /**
     * Writes the workbook into the form input and announces the change. Large workbooks are
     * serialized lazily: the event detail computes the value when it is read, and the form input
     * is written shortly after the change and again before the form is sent.
     * @param {boolean} [emit=true] - Whether CHANGE_VALUE_EVENT is raised.
     */
    _syncValue(emit = true) {
        if (this._destroyed) return;
        const write = () => { if (this._formInput) { this._formInput.value = this.value; this._formInput.disabled = this.disabled; } };
        const large = this._model.sheets.reduce((sum, s) => sum + s.rows.length, 0) > 5000;
        if (large) {
            if (this._syncTimer) this.cancelDeferred(this._syncTimer);
            this._syncTimer = this.defer(() => { this._syncTimer = null; write(); }, 300);
        } else write();
        if (!emit) return;
        const ctrl = this;
        const detail = { sender: this._element, id: this._element.id };
        Object.defineProperty(detail, "value", { enumerable: true, get() { return ctrl.value; } });
        this._element.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_VALUE_EVENT, { detail, bubbles: true, composed: true }));
    }

    /**
     * Starts the autosave timer after a change, when an autosave delay is configured.
     */
    _scheduleAutosave() {
        if (!this._options.autosave || !this._options.saveUri) return;
        if (this._autosaveTimer) this.cancelDeferred(this._autosaveTimer);
        this._autosaveTimer = this.defer(() => { this._autosaveTimer = null; if (this.dirty) this.save(); }, this._options.autosave);
    }

    /**
     * Adds an event listener whose removal the control owns.
     * @param {EventTarget} target - The target.
     * @param {string} type - The event type.
     * @param {Function} handler - The listener.
     * @param {object|boolean} [options] - The listener options.
     * @returns {Function} Removes the listener ahead of the teardown.
     */
    listen(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        const cleanup = () => target.removeEventListener(type, handler, options);
        this._listeners.push(cleanup);
        return cleanup;
    }

    /**
     * Schedules a callback that is dropped once the control is destroyed.
     * @param {Function} callback - The callback.
     * @param {number} [delay=0] - The delay in milliseconds.
     * @returns {number} The timer handle.
     */
    defer(callback, delay = 0) {
        const timer = setTimeout(() => { this._timers.delete(timer); if (!this._destroyed) callback(); }, delay);
        this._timers.add(timer);
        return timer;
    }

    /**
     * Cancels a callback scheduled with defer.
     * @param {number} timer - The handle.
     */
    cancelDeferred(timer) { clearTimeout(timer); this._timers.delete(timer); }

    /**
     * Translates a key of the spreadsheet texts.
     * @param {string} key - The key without namespace or with it.
     * @param {string} [fallback] - The fallback.
     * @returns {string} The text.
     */
    t(key, fallback) { return this._i18n(key.includes(":") ? key : "webexpress.webui:spreadsheet." + key, fallback); }

    // ------------------------------------------------------------------ chrome

    /**
     * Builds the toolbar, the formula bar, the grid, the sheet tabs, the status bar and the
     * live region.
     * @param {HTMLElement} element - The host.
     */
    _buildChrome(element) {
        const make = (tag, className, attrs = {}) => {
            const el = document.createElement(tag);
            if (className) el.className = className;
            for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
            return el;
        };
        this._make = make;
        // toolbar
        this._toolbar = make("div", "wx-spreadsheet-toolbar", { role: "toolbar", "aria-label": this.t("toolbar", "Spreadsheet tools") });
        this._toolbar.appendChild(this._createHistoryGroup());
        for (const plugin of this._plugins) {
            const group = plugin.createToolbar?.(this);
            if (group) this._toolbar.appendChild(group);
        }
        const end = make("div", "wx-spreadsheet-btn-group wx-spreadsheet-toolbar-end");
        this._people = make("div", "wx-spreadsheet-people", { "aria-live": "polite" });
        end.appendChild(this._people);
        end.appendChild(this.createButton({ icon: "expand", label: this._i18n("webexpress.webui:fullscreen.toggle", "Fullscreen"), attrs: { "data-wx-primary-action": "fullscreen", "data-wx-primary-target": "#" + element.id, "aria-pressed": "false" } }));
        this._toolbar.appendChild(end);
        if (!this._options.toolbar) this._toolbar.hidden = true;
        element.appendChild(this._toolbar);
        // formula bar
        this._formulaBar = make("div", "wx-spreadsheet-formulabar");
        this._nameBox = make("input", "wx-spreadsheet-namebox", { type: "text", "aria-label": this.t("namebox", "Name box"), spellcheck: "false", autocomplete: "off" });
        this._nameList = make("datalist", null, { id: element.id + "-names" });
        this._nameBox.setAttribute("list", this._nameList.id);
        this._cancelButton = this.createButton({ icon: "xmark", label: this.t("edit.cancel", "Cancel"), command: null, className: "wx-spreadsheet-edit-action" });
        this._acceptButton = this.createButton({ icon: "check", label: this.t("edit.accept", "Enter"), command: null, className: "wx-spreadsheet-edit-action" });
        this._functionButton = this.createButton({ text: "fx", label: this.t("function.insert", "Insert function"), className: "wx-spreadsheet-fx" });
        this._formulaInput = make("textarea", "wx-spreadsheet-formula", { rows: "1", spellcheck: "false", autocomplete: "off", "aria-label": this.t("formula", "Formula or value") });
        this._formulaBar.append(this._nameBox, this._nameList, this._cancelButton, this._acceptButton, this._functionButton, this._formulaInput);
        if (!this._options.formulaBar) this._formulaBar.hidden = true;
        element.appendChild(this._formulaBar);
        // grid
        const container = make("div", "wx-spreadsheet-container");
        element.appendChild(container);
        this._view = new webexpress.webui.SpreadsheetView(this, container);
        this._editor = make("textarea", "wx-spreadsheet-editor", { spellcheck: "false", autocomplete: "off", rows: "1" });
        this._editor.hidden = true;
        this._view.pane.appendChild(this._editor);
        this._suggest = make("ul", "wx-spreadsheet-suggest", { role: "listbox", id: element.id + "-suggest" });
        this._suggest.hidden = true;
        this._hint = make("div", "wx-spreadsheet-hint", { role: "tooltip" });
        this._hint.hidden = true;
        this._view.pane.append(this._suggest, this._hint);
        // sheet tabs
        this._tabBar = make("div", "wx-spreadsheet-tabbar");
        this._tabs = make("div", "wx-spreadsheet-tabs", { role: "tablist", "aria-label": this.t("sheets", "Sheets") });
        this._addSheetButton = this.createButton({ icon: "plus", label: this.t("sheet.add", "Add sheet"), command: "addsheet", className: "wx-spreadsheet-tab-add" });
        const zoom = make("div", "wx-spreadsheet-zoom");
        this._zoomOut = this.createButton({ icon: "minus", label: this.t("zoom.out", "Zoom out"), command: "zoomout" });
        this._zoomLabel = make("button", "wx-spreadsheet-btn wx-spreadsheet-zoom-label", { type: "button", "aria-label": this.t("zoom.reset", "Reset zoom") });
        this._zoomIn = this.createButton({ icon: "plus", label: this.t("zoom.in", "Zoom in"), command: "zoomin" });
        zoom.append(this._zoomOut, this._zoomLabel, this._zoomIn);
        this._tabBar.append(this._tabs, this._addSheetButton, zoom);
        if (!this._options.sheetTabs) this._tabBar.hidden = true;
        element.appendChild(this._tabBar);
        // status bar
        this._statusBar = make("div", "wx-spreadsheet-status");
        this._mode = make("span", "wx-spreadsheet-mode");
        this._aggregates = make("span", "wx-spreadsheet-aggregates");
        const done = make("button", "btn btn-primary btn-sm wx-spreadsheet-finish", { type: "button", "data-wx-dismiss": "fullscreen", "data-wx-target": "#" + element.id });
        done.textContent = this._i18n("webexpress.webui:editor.done", "Done");
        this._statusBar.append(this._mode, this._aggregates, done);
        if (!this._options.statusBar) this._statusBar.hidden = true;
        element.appendChild(this._statusBar);
        this._live = make("div", "visually-hidden", { role: "status", "aria-live": "polite" });
        element.appendChild(this._live);
        // context menu on the body, where no overflow of the page clips it; a popover so it is
        // drawn in the top layer, above a modal dialog the spreadsheet may sit in
        this._menu = make("div", "dropdown-menu shadow wx-spreadsheet-menu", { role: "menu" });
        this._menu.style.position = "fixed";
        this._menu.hidden = true;
        if (typeof this._menu.showPopover === "function") this._menu.setAttribute("popover", "manual");
        document.body.appendChild(this._menu);
    }

    /**
     * Creates a toolbar button wired to a command; plugins use it to look and behave alike.
     * @param {object} def - { command, value, icon, text, label, className, attrs, onClick }.
     * @returns {HTMLButtonElement} The button.
     */
    createButton(def) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "wx-spreadsheet-btn" + (def.className ? " " + def.className : "");
        if (def.label) { button.title = def.label; button.setAttribute("aria-label", def.label); }
        if (def.command) button.setAttribute("data-command", def.command);
        if (def.value !== undefined) button.setAttribute("data-value", def.value);
        if (def.icon) {
            const icon = document.createElement("i");
            icon.className = webexpress.webui.IconSet.resolve(def.icon);
            icon.setAttribute("aria-hidden", "true");
            button.appendChild(icon);
        }
        if (def.text) {
            const text = document.createElement("span");
            text.className = "wx-spreadsheet-btn-text";
            text.textContent = def.text;
            button.appendChild(text);
        }
        for (const [key, value] of Object.entries(def.attrs ?? {})) button.setAttribute(key, value);
        if (def.onClick || def.command) {
            this.listen(button, "click", (e) => {
                if (def.onClick) def.onClick(e);
                else this.execCommand(def.command, def.value ?? null);
                this._refreshChrome();
                if (!this._editing && !button.closest("[popover]") && def.command && !["addsheet", "find", "replace", "comment", "insertfunction", "autosum"].includes(def.command)) this._view.viewport.focus({ preventScroll: true });
            });
        }
        return button;
    }

    /**
     * Creates a dropdown menu for the toolbar.
     * @param {object} def - { icon, text, label, items: [{ label, command, value, icon, separator, render }] }.
     * @returns {HTMLElement} The group holding the toggle and the menu.
     */
    createMenu(def) {
        const group = document.createElement("div");
        group.className = "wx-spreadsheet-btn-group";
        const toggle = this.createButton({ icon: def.icon, text: def.text, label: def.label, className: "dropdown-toggle" + (def.className ? " " + def.className : "") });
        const menu = document.createElement("div");
        menu.className = "dropdown-menu wx-spreadsheet-dropdown";
        menu.setAttribute("role", "menu");
        for (const item of def.items) {
            if (item.separator) { const sep = document.createElement("div"); sep.className = "dropdown-divider"; sep.setAttribute("role", "separator"); menu.appendChild(sep); continue; }
            const button = this.createButton({ icon: item.icon, text: item.label, command: item.command, value: item.value, className: "dropdown-item", onClick: item.onClick });
            button.classList.remove("wx-spreadsheet-btn");
            button.setAttribute("role", "menuitem");
            button.removeAttribute("title");
            if (item.render) item.render(button);
            menu.appendChild(button);
        }
        group.append(toggle, menu);
        webexpress.webui.NativeMenu.bind(toggle, menu);
        return group;
    }

    /**
     * Creates the leading toolbar group: undo, redo and recalculation.
     * @returns {HTMLElement} The group.
     */
    _createHistoryGroup() {
        const group = document.createElement("div");
        group.className = "wx-spreadsheet-btn-group";
        group.append(
            this.createButton({ command: "undo", icon: "undo", label: this._i18n("webexpress.webui:editor.undo", "Undo") }),
            this.createButton({ command: "redo", icon: "redo", label: this._i18n("webexpress.webui:editor.redo", "Redo") }),
            this.createButton({ command: "recalculate", icon: "arrows-rotate", label: this.t("recalculate", "Recalculate") })
        );
        return group;
    }

    /**
     * Creates a separator between toolbar groups.
     * @returns {HTMLElement} The separator.
     */
    createSeparator() {
        const sep = document.createElement("span");
        sep.className = "wx-spreadsheet-separator";
        sep.setAttribute("role", "separator");
        return sep;
    }

    /**
     * Brings toolbar states, the name box, the formula bar, the sheet tabs and the status bar
     * up to date.
     */
    _refreshChrome() {
        if (this._destroyed || !this._toolbar) return;
        const disabled = this.disabled, readOnly = this.readOnly;
        this._element.setAttribute("aria-disabled", String(disabled));
        this._element.classList.toggle("wx-spreadsheet-readonly", readOnly);
        this._view.viewport.setAttribute("aria-readonly", String(readOnly));
        this._view.viewport.inert = disabled;
        this._toolbar.inert = disabled;
        this._tabBar.inert = disabled;
        this._toolbar.querySelectorAll("[data-command]").forEach(button => {
            const cmd = button.getAttribute("data-command");
            const viewOnly = ["copy", "find", "zoomin", "zoomout", "selectall"].includes(cmd);
            button.disabled = disabled || (readOnly && !viewOnly) || (cmd === "undo" && !this.canUndo()) || (cmd === "redo" && !this.canRedo());
            const state = ["bold", "italic", "underline", "strike", "wrap", "merge", "formatpainter", "freeze"].includes(cmd) ? this.queryCommandState(cmd)
                : cmd === "align" ? this.queryCommandValue("align") === button.getAttribute("data-value") : null;
            if (state !== null) { button.classList.toggle("active", state); button.setAttribute("aria-pressed", String(state)); }
        });
        this._addSheetButton.disabled = readOnly;
        this._formulaInput.readOnly = readOnly;
        const sel = this._sel, last = sel.ranges[sel.ranges.length - 1];
        const Address = webexpress.webui.SpreadsheetAddress;
        if (document.activeElement !== this._nameBox) {
            const name = Object.entries(this._model.names).find(([, text]) => {
                const range = Address.parseRange(text);
                return range && this._model.sheet(range.sheet)?.id === this.sheet.id && range.r1 === last.r1 && range.c1 === last.c1 && range.r2 === last.r2 && range.c2 === last.c2;
            })?.[0];
            this._nameBox.value = name ?? (last.r1 === last.r2 && last.c1 === last.c2 || this.sheet.mergeAt(last.r1, last.c1) ? Address.cellName(sel.active.row, sel.active.col) : Address.rangeName(last));
        }
        if (this._nameList.childNodes.length !== Object.keys(this._model.names).length) {
            this._nameList.textContent = "";
            for (const name of Object.keys(this._model.names)) { const option = document.createElement("option"); option.value = name; this._nameList.appendChild(option); }
        }
        if (!this._editing) {
            const cell = this.sheet.getCell(sel.active.row, sel.active.col);
            this._formulaInput.value = webexpress.webui.SpreadsheetFormat.editText(cell, webexpress.webui.SpreadsheetModel.effectiveStyle(this._model, this.sheet, sel.active.row, sel.active.col), this.locale);
        }
        this._formulaBar.classList.toggle("wx-spreadsheet-editing", !!this._editing);
        this._zoomLabel.textContent = Math.round(this.zoom * 100) + " %";
        this._renderTabs();
        this._renderStatus();
        this._element.classList.toggle("wx-spreadsheet-painting", !!this._painter);
    }

    /**
     * Renders the sheet tabs as an ARIA tab list.
     */
    _renderTabs() {
        const key = this._model.sheets.map(s => s.id + ":" + s.name + ":" + (s.props.tabColor ?? "")).join("|") + "#" + this.sheet.id + "#" + this.readOnly;
        if (this._tabsKey === key) return;
        this._tabsKey = key;
        this._tabs.textContent = "";
        for (const sheet of this._model.sheets) {
            const tab = document.createElement("button");
            tab.type = "button";
            tab.className = "wx-spreadsheet-tab";
            tab.setAttribute("role", "tab");
            tab.setAttribute("data-sheet", sheet.id);
            const active = sheet.id === this.sheet.id;
            tab.setAttribute("aria-selected", String(active));
            tab.setAttribute("aria-controls", this._view.viewport.id || (this._view.viewport.id = this._element.id + "-grid"));
            tab.tabIndex = active ? 0 : -1;
            tab.textContent = sheet.name;
            if (sheet.props.tabColor) tab.style.setProperty("--wx-spreadsheet-tab-color", sheet.props.tabColor);
            tab.draggable = !this.readOnly;
            this._tabs.appendChild(tab);
        }
    }

    /**
     * Renders the mode and the aggregates of the selection in the status bar.
     */
    _renderStatus() {
        const mode = this._editing ? (this._editing.point ? "point" : this._editing.mode) : this.readOnly ? "readonly" : "ready";
        this._mode.textContent = this.t("mode." + mode, { ready: "Ready", enter: "Enter", edit: "Edit", point: "Point", readonly: "Read-only" }[mode]);
        if (this._statusTimer) this.cancelDeferred(this._statusTimer);
        this._statusTimer = this.defer(() => {
            this._statusTimer = null;
            const sheet = this.sheet, ranges = this._sel.ranges;
            if (ranges.length === 1 && ranges[0].r1 === ranges[0].r2 && ranges[0].c1 === ranges[0].c2) { this._aggregates.textContent = ""; return; }
            let sum = 0, count = 0, numbers = 0;
            const seen = new Set();
            for (const range of ranges) {
                this._forEachStored(sheet, range, (cell, row, col) => {
                    const key = row * 16384 + col;
                    if (seen.has(key)) return;
                    seen.add(key);
                    const value = this._engine.cellValue(sheet, row, col);
                    if (value === null || value === "") return;
                    count++;
                    if (typeof value === "number") { sum += value; numbers++; }
                });
            }
            const format = n => webexpress.webui.SpreadsheetFormat.format(Number(n.toPrecision(12)), "General", this.locale).text;
            const parts = [];
            if (numbers) parts.push(this.t("status.sum", "Sum") + ": " + format(sum), this.t("status.average", "Average") + ": " + format(sum / numbers));
            if (count) parts.push(this.t("status.count", "Count") + ": " + count);
            this._aggregates.textContent = parts.join(" | ");
        }, 30);
    }

    /**
     * Renders the list of the other users in the toolbar.
     */
    _renderPeople() {
        this._people.textContent = "";
        for (const peer of this.collaborators) {
            const badge = document.createElement("span");
            badge.className = "wx-spreadsheet-person";
            badge.style.backgroundColor = this._peerColor(peer.user);
            const name = String(peer.user?.name ?? "?");
            badge.textContent = name.slice(0, 1).toUpperCase();
            badge.title = name;
            badge.setAttribute("aria-label", name);
            this._people.appendChild(badge);
        }
    }

    // ------------------------------------------------------------------ input wiring

    /**
     * Wires the grid, the formula bar, the tabs and the document.
     */
    _attachEventHandlers() {
        const view = this._view, grid = view.viewport;
        this.listen(grid, "keydown", e => this._onKeyDown(e));
        this.listen(grid, "pointerdown", e => this._onPointerDown(e));
        this.listen(grid, "dblclick", e => this._onDoubleClick(e));
        this.listen(grid, "contextmenu", e => this._onContextMenu(e));
        this.listen(grid, "pointermove", e => this._onHover(e));
        this.listen(grid, "focus", () => this._element.classList.add("wx-spreadsheet-focused"));
        this.listen(grid, "blur", () => this._element.classList.remove("wx-spreadsheet-focused"));
        this.listen(document, "copy", e => this._onClipboard(e, "copy"));
        this.listen(document, "cut", e => this._onClipboard(e, "cut"));
        this.listen(document, "paste", e => this._onClipboard(e, "paste"));
        this.listen(this._editor, "keydown", e => this._onEditorKeyDown(e, this._editor));
        this.listen(this._editor, "input", () => this._onEditorInput(this._editor));
        this.listen(this._formulaInput, "keydown", e => this._onEditorKeyDown(e, this._formulaInput));
        this.listen(this._formulaInput, "input", () => this._onEditorInput(this._formulaInput));
        this.listen(this._formulaInput, "focus", () => { if (!this._editing && !this.readOnly) this._startEdit({ mode: "edit", source: "bar" }); });
        this.listen(this._nameBox, "keydown", e => this._onNameBoxKey(e));
        this.listen(this._nameBox, "blur", () => this._refreshChrome());
        this.listen(this._acceptButton, "click", () => { if (this._editing) this._commitEdit(1, 0); });
        this.listen(this._cancelButton, "click", () => { if (this._editing) this._cancelEdit(); });
        this.listen(this._functionButton, "click", () => this._openFunctionMenu());
        this.listen(this._zoomLabel, "click", () => { this.zoom = 1; });
        this.listen(this._suggest, "pointerdown", e => {
            const item = e.target.closest("[data-function]");
            if (!item) return;
            e.preventDefault();
            this._acceptSuggestion(item.getAttribute("data-function"));
        });
        this.listen(this._tabs, "click", e => { const tab = e.target.closest("[data-sheet]"); if (tab) { this.activateSheet(tab.getAttribute("data-sheet")); grid.focus({ preventScroll: true }); } });
        this.listen(this._tabs, "dblclick", e => { const tab = e.target.closest("[data-sheet]"); if (tab && !this.readOnly) this._renameTab(tab); });
        this.listen(this._tabs, "keydown", e => this._onTabKey(e));
        this.listen(this._tabs, "contextmenu", e => { const tab = e.target.closest("[data-sheet]"); if (tab) { e.preventDefault(); this._openTabMenu(tab, e.clientX, e.clientY); } });
        this.listen(this._tabs, "dragstart", e => { const tab = e.target.closest("[data-sheet]"); if (tab) { this._dragTab = tab.getAttribute("data-sheet"); e.dataTransfer?.setData("text/plain", tab.textContent); } });
        this.listen(this._tabs, "dragover", e => { if (this._dragTab) e.preventDefault(); });
        this.listen(this._tabs, "drop", e => {
            const tab = e.target.closest("[data-sheet]");
            if (this._dragTab && tab) { e.preventDefault(); this.moveSheet(this._dragTab, this._model.sheetIndex(tab.getAttribute("data-sheet"))); }
            this._dragTab = null;
        });
        this.listen(this._menu, "keydown", e => this._onMenuKey(e));
        this.listen(document, "pointerdown", e => { if (!this._menu.hidden && !this._menu.contains(e.target)) this._closeMenu(); });
        const form = this._element.closest("form");
        if (form) {
            this.listen(form, "submit", () => { if (this._editing) this._commitEdit(); if (this._formInput) this._formInput.value = this.value; });
            this.listen(form, "formdata", () => { if (this._formInput) this._formInput.value = this.value; });
        }
        if (typeof ResizeObserver === "function") {
            this._resizeObserver = new ResizeObserver(() => { if (!this._destroyed) { this._view.render(); this._positionEditor(); } });
            this._resizeObserver.observe(grid);
        }
        this._fieldsetObserver = new MutationObserver(() => { if (!this._destroyed) this._refreshChrome(); });
        for (let fieldset = this._element.closest("fieldset"); fieldset; fieldset = fieldset.parentElement?.closest("fieldset")) {
            this._fieldsetObserver.observe(fieldset, { attributes: true, attributeFilter: ["disabled"] });
        }
    }

    /**
     * Determines whether the grid owns the keyboard focus.
     * @returns {boolean} True if focused.
     */
    _gridFocused() { return document.activeElement === this._view.viewport; }

    /**
     * Handles the keyboard of the grid: navigation, selection, editing triggers and shortcuts.
     * @param {KeyboardEvent} e - The event.
     */
    _onKeyDown(e) {
        if (e.defaultPrevented || e.isComposing || this._editing || e.target !== this._view.viewport) return;
        const key = e.key, ctrl = e.ctrlKey || e.metaKey, shift = e.shiftKey;
        const sel = this._sel, view = this._view;
        const handled = () => { e.preventDefault(); e.stopPropagation(); };
        if (ctrl && !e.altKey) {
            const lower = key.toLowerCase();
            const map = { z: shift ? "redo" : "undo", y: "redo", b: "bold", i: "italic", u: "underline", 5: "strike", d: "filldown", r: "fillright", f: "find", h: "replace" };
            if (lower === "a") {
                handled();
                const region = this._region(this.sheet, sel.active.row, sel.active.col);
                const same = sel.ranges.length === 1 && sel.ranges[0].r1 === region.r1 && sel.ranges[0].c1 === region.c1 && sel.ranges[0].r2 === region.r2 && sel.ranges[0].c2 === region.c2;
                // the first press takes the data region, the second the whole sheet
                if (!same && (region.r1 !== region.r2 || region.c1 !== region.c2)) this.select(region, { active: { row: sel.active.row, col: sel.active.col }, scroll: false });
                else this.selectAll();
                return;
            }
            if (map[lower]) { handled(); this.execCommand(map[lower]); return; }
            // the physical key, because shift turns the digit into a layout-dependent bracket
            if (e.code === "Digit9" || e.code === "Digit0") {
                handled();
                this.execCommand((shift ? "unhide" : "hide") + (e.code === "Digit9" ? "row" : "col"));
                return;
            }
            if (key === " ") { handled(); this.select({ r1: 0, c1: sel.active.col, r2: this.sheet.rowCount - 1, c2: sel.active.col }, { active: { ...sel.active }, scroll: false }); return; }
            if (key === "Home") { handled(); shift ? this._move(-sel.focus.row, -sel.focus.col, true) : this.select("A1"); return; }
            if (key === "End") {
                handled();
                const used = this.sheet.usedRange() ?? { r2: 0, c2: 0 };
                if (shift) this._move(used.r2 - sel.focus.row, used.c2 - sel.focus.col, true); else this.select({ row: used.r2, col: used.c2 });
                return;
            }
            if (key === "PageDown" || key === "PageUp") {
                handled();
                const index = this._model.sheetIndex(this.sheet.id) + (key === "PageDown" ? 1 : -1);
                if (this._model.sheets[index]) this.activateSheet(this._model.sheets[index].id);
                return;
            }
            if (key === ";") { handled(); this._quickInput(webexpress.webui.SpreadsheetFormat.format(Math.floor(webexpress.webui.SpreadsheetFormat.dateToSerial(new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())))), webexpress.webui.SpreadsheetFormat.locale(this.locale).date, this.locale).text); return; }
            const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
            if (arrows[key]) { handled(); this._jump(...arrows[key], shift); return; }
            if (key === "Enter" && !this.readOnly) { handled(); this._startEdit({ mode: "edit" }); return; }
            return;
        }
        if (e.altKey) {
            if (key === "PageDown" || key === "PageUp") { handled(); this._move(0, (key === "PageDown" ? 1 : -1) * view.pageCols(), shift); }
            if (key === "Enter" && !this.readOnly) { handled(); this._startEdit({ mode: "edit" }); }
            return;
        }
        switch (key) {
            case "ArrowUp": handled(); this._move(-1, 0, shift); return;
            case "ArrowDown": handled(); this._move(1, 0, shift); return;
            case "ArrowLeft": handled(); this._move(0, -1, shift); return;
            case "ArrowRight": handled(); this._move(0, 1, shift); return;
            case "PageDown": handled(); this._move(view.pageRows(), 0, shift); return;
            case "PageUp": handled(); this._move(-view.pageRows(), 0, shift); return;
            case "Home": handled(); this._move(0, -(shift ? sel.focus.col : sel.active.col), shift); return;
            case "End": {
                handled();
                const cells = this.sheet.rows[shift ? sel.focus.row : sel.active.row];
                const last = cells ? cells.length - 1 : 0;
                this._move(0, Math.max(0, last) - (shift ? sel.focus.col : sel.active.col), shift);
                return;
            }
            case "Tab": {
                // at the edge of the sheet Tab leaves the grid, so the grid is no keyboard trap
                const range = sel.ranges[sel.ranges.length - 1];
                const single = sel.ranges.length === 1 && range.r1 === range.r2 && range.c1 === range.c2;
                if (single && (shift ? sel.active.col === 0 : sel.active.col >= this.sheet.colCount - 1)) return;
                handled();
                if (!this._walk(0, shift ? -1 : 1)) {
                    if (!shift && this._tabStart === undefined) this._tabStart = sel.active.col;
                    this._move(0, shift ? -1 : 1);
                }
                return;
            }
            case "Enter": {
                handled();
                if (this._walk(shift ? -1 : 1, 0)) return;
                const start = this._tabStart;
                this._tabStart = undefined;
                if (!shift && start !== undefined) this._move(1, start - sel.active.col); else this._move(shift ? -1 : 1, 0);
                return;
            }
            case "Escape":
                if (this._clipboardRange || this._painter) { handled(); this._clipboardRange = null; this._painter = null; webexpress.webui.SpreadsheetClipboard._cut = null; view.renderOverlay(); this._refreshChrome(); }
                return;
            case "Delete": if (!this.readOnly) { handled(); this.clear(null, "contents"); } return;
            case "Backspace": if (!this.readOnly) { handled(); this._startEdit({ text: "", mode: "enter" }); } return;
            case "F2":
                handled();
                if (shift) this._openComment(); else if (!this.readOnly) this._startEdit({ mode: "edit" });
                return;
            case "F9": handled(); this.recalculate(); return;
            case "F10": if (shift) { handled(); this._openContextMenu(null); } return;
            case "ContextMenu": handled(); this._openContextMenu(null); return;
            case " ":
                if (shift) { handled(); this.select({ r1: sel.active.row, c1: 0, r2: sel.active.row, c2: this.sheet.colCount - 1 }, { active: { ...sel.active }, scroll: false }); return; }
                if (this.sheet.getCell(sel.active.row, sel.active.col)?.t === "checkbox" && !this.readOnly) { handled(); this._toggleCell(sel.active.row, sel.active.col); return; }
                break;
        }
        if (key.length === 1 && !this.readOnly) {
            // typing replaces the content, as in the common spreadsheets; the key lands in the editor
            handled();
            this._startEdit({ text: key, mode: "enter" });
        }
    }

    /**
     * Writes a text into the active cell as if it had been typed and committed.
     * @param {string} text - The text.
     */
    _quickInput(text) {
        if (this.readOnly) return;
        const sel = this._sel;
        try { this.setValue({ row: sel.active.row, col: sel.active.col }, text); } catch (e) { this._announce(e.message); }
    }

    /**
     * Toggles a checkbox cell.
     * @param {number} row - The row.
     * @param {number} col - The column.
     */
    _toggleCell(row, col) {
        const cell = this.sheet.getCell(row, col);
        const type = webexpress.webui.SpreadsheetTypes.get(cell?.t);
        if (!type?.toggle) return;
        this._commit({ type: "set", sheet: this.sheet.id, cells: [{ row, col, cell: { ...cell, v: type.toggle(cell.v, cell) } }] }, { label: "toggle" });
    }

    /**
     * Starts editing the active cell.
     * @param {object} [options] - { text: replaces the content, mode: "enter" (arrows commit) or
     * "edit" (arrows move the caret), source: "cell" or "bar" }.
     * @returns {boolean} True if editing started.
     */
    _startEdit(options = {}) {
        if (this.readOnly || this._destroyed) return false;
        const sel = this._sel, sheet = this.sheet;
        const cell = sheet.getCell(sel.active.row, sel.active.col);
        const style = webexpress.webui.SpreadsheetModel.effectiveStyle(this._model, sheet, sel.active.row, sel.active.col);
        const original = webexpress.webui.SpreadsheetFormat.editText(cell, style, this.locale);
        const text = options.text ?? original;
        this._editing = { sheet: sheet.id, row: sel.active.row, col: sel.active.col, original, mode: options.mode ?? "edit", point: null, source: options.source ?? "cell" };
        const editor = this._editor;
        editor.value = text;
        this._formulaInput.value = text;
        editor.hidden = false;
        const font = style.font ? style.font : "";
        editor.style.fontFamily = font;
        editor.style.fontSize = style.size ? style.size * this.zoom + "pt" : "";
        editor.style.fontWeight = style.bold ? "bold" : "";
        editor.style.fontStyle = style.italic ? "italic" : "";
        editor.style.textAlign = style.align ?? "";
        editor.setAttribute("aria-label", this.t("edit.cell", "Edit cell") + " " + webexpress.webui.SpreadsheetAddress.cellName(sel.active.row, sel.active.col));
        this._positionEditor();
        const target = this._editing.source === "bar" ? this._formulaInput : editor;
        target.focus({ preventScroll: true });
        const end = target.value.length;
        try { target.setSelectionRange(end, end); } catch { /* the stub has no selection api */ }
        this._onEditorInput(target);
        this._view.renderOverlay();
        this._refreshChrome();
        this._dispatch(webexpress.webui.Event.SPREADSHEET_EDIT_STARTED_EVENT, { ref: webexpress.webui.SpreadsheetAddress.cellName(sel.active.row, sel.active.col), sheet: sheet.name });
        return true;
    }

    /**
     * Places the cell editor over the cell being edited, grown to its text.
     */
    _positionEditor() {
        if (!this._editing) return;
        const view = this._view;
        if (this._editing.sheet !== this.sheet.id) { this._editor.hidden = true; return; }
        const rect = view.cellRect(this._editing.row, this._editing.col);
        const editor = this._editor;
        editor.hidden = false;
        editor.style.left = rect.left + "px";
        editor.style.top = rect.top + "px";
        editor.style.minWidth = rect.width + "px";
        editor.style.minHeight = rect.height + "px";
        const lines = editor.value.split("\n").length;
        editor.style.height = Math.max(rect.height, lines * 18 * this.zoom + 6) + "px";
        const longest = Math.max(...editor.value.split("\n").map(l => l.length));
        editor.style.width = Math.min(view.size.width - rect.left - 4, Math.max(rect.width, longest * 7.5 * this.zoom + 16)) + "px";
    }

    /**
     * Follows the input of the cell editor or the formula bar: mirrors it to the other one,
     * highlights the references of a formula and offers function names.
     * @param {HTMLTextAreaElement} input - The input that changed.
     */
    _onEditorInput(input) {
        if (!this._editing) return;
        const other = input === this._editor ? this._formulaInput : this._editor;
        if (other.value !== input.value) other.value = input.value;
        const text = input.value;
        this._editing.formula = text.startsWith("=");
        this._formulaRefs = this._editing.formula ? webexpress.webui.SpreadsheetFormula.references(text).map(ref => {
            const sheet = ref.sheet ? this._model.sheet(ref.sheet) : this._model.sheet(this._editing.sheet);
            return sheet ? { sheetId: sheet.id, r1: ref.r1, c1: ref.c1, r2: Math.min(ref.r2, sheet.rowCount - 1), c2: Math.min(ref.c2, sheet.colCount - 1) } : null;
        }).filter(Boolean) : [];
        this._positionEditor();
        this._view.renderOverlay();
        this._updateSuggestions(input);
        this._renderStatus();
    }

    /**
     * Shows function names matching the name being typed in a formula, and the syntax of the
     * function the caret is in.
     * @param {HTMLTextAreaElement} input - The input.
     */
    _updateSuggestions(input) {
        const caret = input.selectionStart ?? input.value.length;
        const before = input.value.slice(0, caret);
        const match = this._editing?.formula ? /(?:^=|[=(,;+\-*/^&<>\s])([A-Za-z][A-Za-z0-9.]*)$/.exec(before) : null;
        const suggestions = match ? webexpress.webui.SpreadsheetFunctions.getAll().filter(f => f.name.startsWith(match[1].toUpperCase())).slice(0, 8) : [];
        this._suggest.textContent = "";
        this._suggestIndex = 0;
        if (suggestions.length && !(suggestions.length === 1 && suggestions[0].name === match[1].toUpperCase() && before.endsWith("("))) {
            suggestions.forEach((def, i) => {
                const item = document.createElement("li");
                item.setAttribute("role", "option");
                item.id = this._element.id + "-suggest-" + i;
                item.setAttribute("data-function", def.name);
                item.setAttribute("aria-selected", String(i === 0));
                const name = document.createElement("strong");
                name.textContent = def.name;
                item.appendChild(name);
                if (def.description) { const desc = document.createElement("span"); desc.textContent = " " + def.description; item.appendChild(desc); }
                this._suggest.appendChild(item);
            });
            this._suggest.hidden = false;
            input.setAttribute("aria-controls", this._suggest.id);
            input.setAttribute("aria-activedescendant", this._element.id + "-suggest-0");
            this._placeBelowEditor(this._suggest);
        } else {
            this._suggest.hidden = true;
            input.removeAttribute("aria-activedescendant");
        }
        // the syntax of the innermost open function
        let depth = 0, name = null;
        for (let i = before.length - 1; i >= 0; i--) {
            if (before[i] === ")") depth++;
            else if (before[i] === "(") {
                if (depth === 0) { name = /([A-Za-z][A-Za-z0-9.]*)$/.exec(before.slice(0, i))?.[1]; break; }
                depth--;
            }
        }
        const def = name && webexpress.webui.SpreadsheetFunctions.get(name);
        if (def?.syntax && this._suggest.hidden) {
            this._hint.textContent = def.syntax;
            this._hint.hidden = false;
            this._placeBelowEditor(this._hint);
        } else this._hint.hidden = true;
    }

    /**
     * Positions a popup below the cell editor.
     * @param {HTMLElement} popup - The popup.
     */
    _placeBelowEditor(popup) {
        if (!this._editing) return;
        const rect = this._view.cellRect(this._editing.row, this._editing.col);
        popup.style.left = rect.left + "px";
        popup.style.top = rect.top + Math.max(rect.height, parseFloat(this._editor.style.height) || rect.height) + 2 + "px";
    }

    /**
     * Inserts a function name chosen from the suggestions.
     * @param {string} name - The function name.
     */
    _acceptSuggestion(name) {
        const input = document.activeElement === this._formulaInput ? this._formulaInput : this._editor;
        const caret = input.selectionStart ?? input.value.length;
        const before = input.value.slice(0, caret).replace(/[A-Za-z][A-Za-z0-9.]*$/, "");
        const after = input.value.slice(caret);
        input.value = before + name + "(" + after;
        const position = before.length + name.length + 1;
        try { input.setSelectionRange(position, position); } catch { /* the stub has no selection api */ }
        this._onEditorInput(input);
        input.focus({ preventScroll: true });
    }

    /**
     * Handles the keyboard while editing: committing, cancelling, point mode, suggestions and
     * absolute references.
     * @param {KeyboardEvent} e - The event.
     * @param {HTMLTextAreaElement} input - The input.
     */
    _onEditorKeyDown(e, input) {
        if (!this._editing || e.isComposing) return;
        const key = e.key, handled = () => { e.preventDefault(); e.stopPropagation(); };
        if (!this._suggest.hidden) {
            const items = [...this._suggest.querySelectorAll("[data-function]")];
            if (key === "ArrowDown" || key === "ArrowUp") {
                handled();
                this._suggestIndex = (this._suggestIndex + (key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
                items.forEach((item, i) => item.setAttribute("aria-selected", String(i === this._suggestIndex)));
                input.setAttribute("aria-activedescendant", items[this._suggestIndex].id);
                return;
            }
            if (key === "Tab" || key === "Enter" && !e.ctrlKey && !e.altKey) { handled(); this._acceptSuggestion(items[this._suggestIndex].getAttribute("data-function")); return; }
            if (key === "Escape") { handled(); this._suggest.hidden = true; return; }
        }
        const ctrl = e.ctrlKey || e.metaKey;
        if (key === "Enter" && e.altKey) {
            handled();
            const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start;
            input.value = input.value.slice(0, start) + "\n" + input.value.slice(end);
            try { input.setSelectionRange(start + 1, start + 1); } catch { /* the stub has no selection api */ }
            this._onEditorInput(input);
            return;
        }
        if (key === "Enter" && ctrl) { handled(); this._commitEdit(0, 0, { fill: true }); return; }
        if (key === "Enter") { handled(); this._commitEdit(e.shiftKey ? -1 : 1, 0); return; }
        if (key === "Tab") { handled(); this._commitEdit(0, e.shiftKey ? -1 : 1); return; }
        if (key === "Escape") { handled(); this._cancelEdit(); return; }
        if (key === "F4") { handled(); this._toggleAbsolute(input); return; }
        if (key === "F2") { handled(); this._editing.mode = this._editing.mode === "edit" ? "enter" : "edit"; this._editing.point = null; this._renderStatus(); return; }
        const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (arrows[key] && this._editing.mode === "enter" && !e.altKey) {
            const caret = input.selectionStart ?? input.value.length;
            const before = input.value.slice(0, caret);
            if (this._editing.point || webexpress.webui.SpreadsheetFormula.expectsOperand(before)) {
                handled();
                this._pointMove(input, ...arrows[key], e.shiftKey);
                return;
            }
            handled();
            this._commitEdit(...arrows[key]);
        }
    }

    /**
     * Moves the reference that point mode inserts into a formula, or grows it with Shift.
     * @param {HTMLTextAreaElement} input - The input.
     * @param {number} dr - The row delta.
     * @param {number} dc - The column delta.
     * @param {boolean} extend - Whether the reference grows into a range.
     */
    _pointMove(input, dr, dc, extend) {
        const editing = this._editing, sheet = this.sheet;
        let point = editing.point;
        if (!point) {
            const caret = input.selectionStart ?? input.value.length;
            point = editing.point = { start: caret, end: caret, anchor: { row: editing.row, col: editing.col }, focus: { row: editing.row, col: editing.col } };
        }
        const clamp = (v, max) => Math.max(0, Math.min(max - 1, v));
        point.focus = { row: clamp(point.focus.row + dr, sheet.rowCount), col: clamp(point.focus.col + dc, sheet.colCount) };
        if (!extend) point.anchor = { ...point.focus };
        this._insertPoint(input, point);
    }

    /**
     * Writes the reference of point mode into the formula.
     * @param {HTMLTextAreaElement} input - The input.
     * @param {object} point - The point state { start, end, anchor, focus }.
     */
    _insertPoint(input, point) {
        const Address = webexpress.webui.SpreadsheetAddress;
        const range = Address.normalize({ r1: point.anchor.row, c1: point.anchor.col, r2: point.focus.row, c2: point.focus.col });
        let text = Address.rangeName(range);
        if (this.sheet.id !== this._editing.sheet) text = Address.quoteSheet(this.sheet.name) + "!" + text;
        input.value = input.value.slice(0, point.start) + text + input.value.slice(point.end);
        point.end = point.start + text.length;
        try { input.setSelectionRange(point.end, point.end); } catch { /* the stub has no selection api */ }
        this._onEditorInput(input);
        this._view.scrollToCell(point.focus.row, point.focus.col);
        this._view.render();
    }

    /**
     * Cycles the reference at the caret through $A$1, A$1, $A1 and A1, as F4 does.
     * @param {HTMLTextAreaElement} input - The input.
     */
    _toggleAbsolute(input) {
        const caret = input.selectionStart ?? input.value.length;
        const ref = webexpress.webui.SpreadsheetFormula.references(input.value).find(r => caret >= r.start && caret <= r.end);
        if (!ref) return;
        const [ar, ac] = ref.abs;
        const next = !ar && !ac ? [true, true] : ar && ac ? [true, false] : ar && !ac ? [false, true] : [false, false];
        const written = webexpress.webui.SpreadsheetFormula.writeRef({ ...ref, abs: [next[0], next[1], next[0], next[1]] });
        input.value = input.value.slice(0, ref.start) + written + input.value.slice(ref.end);
        const position = ref.start + written.length;
        try { input.setSelectionRange(position, position); } catch { /* the stub has no selection api */ }
        this._onEditorInput(input);
    }

    /**
     * Commits the edit and moves the active cell.
     * @param {number} [dr=0] - The row move after committing.
     * @param {number} [dc=0] - The column move after committing.
     * @param {object} [options] - { fill: write the entry into every selected cell }.
     * @returns {boolean} True if the edit ended.
     */
    _commitEdit(dr = 0, dc = 0, options = {}) {
        const editing = this._editing;
        if (!editing) return false;
        let text = this._editor.value;
        // an unfinished formula gets its closing parentheses, as the common spreadsheets add them
        if (text.startsWith("=")) {
            const open = (text.match(/\(/g) || []).length - (text.match(/\)/g) || []).length;
            if (open > 0 && !/"[^"]*$/.test(text)) text += ")".repeat(open);
        }
        const sheet = this._model.sheet(editing.sheet);
        if (text !== editing.original && sheet) {
            let ok = true;
            try {
                if (options.fill) {
                    this.batch(() => {
                        for (const range of this._sel.ranges) {
                            for (let r = range.r1; r <= range.r2; r++) for (let c = range.c1; c <= range.c2; c++) {
                                const entry = text.startsWith("=") ? webexpress.webui.SpreadsheetFormula.translate(text, r - editing.row, c - editing.col) : text;
                                this._commit({ type: "set", sheet: sheet.id, cells: [{ row: r, col: c, cell: this._cellFromInput(sheet, r, c, entry) }] });
                            }
                        }
                    }, "edit");
                } else {
                    ok = this._commit({ type: "set", sheet: sheet.id, cells: [{ row: editing.row, col: editing.col, cell: this._cellFromInput(sheet, editing.row, editing.col, text) }] }, { label: "edit" }) || ok;
                }
            } catch (e) {
                // a value the cell type refuses keeps the editor open, marked invalid
                this._editor.setAttribute("aria-invalid", "true");
                this._announce(e.message);
                return false;
            }
        }
        this._endEdit();
        if (sheet && sheet.id !== this.sheet.id) this.activateSheet(sheet.id);
        if (options.fill) { this._view.render(); return true; }
        if (dr || dc) {
            if (!this._walk(dr, dc)) {
                if (dc > 0 && this._tabStart === undefined) this._tabStart = editing.col;
                if (dr > 0 && this._tabStart !== undefined) { const start = this._tabStart; this._tabStart = undefined; this._move(1, start - this._sel.active.col); }
                else this._move(dr, dc);
            }
        }
        return true;
    }

    /**
     * Cancels the edit and restores the cell's content.
     */
    _cancelEdit() {
        if (!this._editing) return;
        const sheet = this._editing.sheet;
        this._endEdit();
        if (sheet !== this.sheet.id) this.activateSheet(sheet);
    }

    /**
     * Closes the editor and returns the focus to the grid.
     */
    _endEdit() {
        const editing = this._editing;
        this._editing = null;
        this._formulaRefs = null;
        this._editor.hidden = true;
        this._editor.removeAttribute("aria-invalid");
        this._suggest.hidden = true;
        this._hint.hidden = true;
        this._view.viewport.focus({ preventScroll: true });
        this._view.renderOverlay();
        this._refreshChrome();
        if (editing) this._dispatch(webexpress.webui.Event.SPREADSHEET_EDIT_ENDED_EVENT, { ref: webexpress.webui.SpreadsheetAddress.cellName(editing.row, editing.col), sheet: this._model.sheet(editing.sheet)?.name ?? null });
    }

    /**
     * Opens the editor on a double click, or fills down to the data beside the selection on a
     * double click on the fill handle.
     * @param {MouseEvent} e - The event.
     */
    _onDoubleClick(e) {
        if (this.readOnly) return;
        if (e.target?.getAttribute?.("data-handle") === "fill") {
            const sel = this._sel, last = sel.ranges[sel.ranges.length - 1], sheet = this.sheet;
            const side = last.c1 > 0 && sheet.getCell(last.r2 + 1, last.c1 - 1) ? last.c1 - 1 : last.c2 + 1;
            let end = last.r2;
            while (end + 1 < sheet.rowCount && sheet.getCell(end + 1, side)) end++;
            if (end > last.r2) { this.autoFill(last, { ...last, r2: end }); this.select({ ...last, r2: end }); }
            return;
        }
        const hit = this._view.hit(e.clientX, e.clientY);
        if (hit.area === "colresize") { this._autoFit("col", hit.col); return; }
        if (hit.area === "rowresize") { this.setRowHeight(hit.row, null); return; }
        if (hit.area !== "cell") return;
        this._startEdit({ mode: "edit" });
    }

    /**
     * Sizes a column to its widest content.
     * @param {string} axis - "col".
     * @param {number} col - The column.
     */
    _autoFit(axis, col) {
        const sheet = this.sheet;
        let width = 0, checked = 0;
        const canvas = this._measure ??= document.createElement("canvas");
        const context = typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
        sheet.rows.forEach((cells, row) => {
            if (checked > 5000 || !cells?.[col]) return;
            checked++;
            const style = webexpress.webui.SpreadsheetModel.effectiveStyle(this._model, sheet, row, col);
            const text = webexpress.webui.SpreadsheetFormat.display(this._engine.cellValue(sheet, row, col), cells[col], style, this.locale).text;
            if (context?.measureText) {
                context.font = (style.bold ? "bold " : "") + (style.size ? style.size + "pt " : "13px ") + (style.font || "sans-serif");
                width = Math.max(width, context.measureText(text).width ?? 0);
            } else width = Math.max(width, text.length * 7.5);
        });
        this.setColumnWidth(col, width ? Math.ceil(width + 12) : null);
    }

    /**
     * Shows the resize cursor over header borders.
     * @param {PointerEvent} e - The event.
     */
    _onHover(e) {
        if (this._drag) return;
        const hit = this._view.hit(e.clientX, e.clientY);
        const cursors = { colresize: "col-resize", rowresize: "row-resize", colunhide: this.readOnly ? "" : "unhide", rowunhide: this.readOnly ? "" : "unhide" };
        this._view.viewport.setAttribute("data-cursor", cursors[hit.area] ?? "");
    }

    /**
     * Starts a pointer gesture: selecting, resizing, filling, moving, inserting references while
     * editing, or the touch gestures.
     * @param {PointerEvent} e - The event.
     */
    _onPointerDown(e) {
        if (this.disabled || e.button > 0) return;
        const view = this._view;
        if (this._editor.contains(e.target) || this._suggest.contains(e.target)) return;
        this._touch = e.pointerType === "touch" || e.pointerType === "pen";
        const handle = e.target?.getAttribute?.("data-handle");
        const hit = view.hit(e.clientX, e.clientY);
        if (this._touch && !handle) {
            this._beginTouch(e, hit);
            return;
        }
        if (this._editing) {
            const input = document.activeElement === this._formulaInput ? this._formulaInput : this._editor;
            const caret = input.selectionStart ?? input.value.length;
            if (hit.area === "cell" && this._editing.formula && (this._editing.point || webexpress.webui.SpreadsheetFormula.expectsOperand(input.value.slice(0, caret)))) {
                e.preventDefault();
                const point = this._editing.point ?? { start: caret, end: caret };
                point.anchor = { row: hit.row, col: hit.col }; point.focus = { row: hit.row, col: hit.col };
                this._editing.point = point;
                this._insertPoint(input, point);
                this._startDrag(e, { kind: "point", input });
                return;
            }
            if (!this._commitEdit()) return;
        }
        view.viewport.focus({ preventScroll: true });
        if (handle === "fill" && !this.readOnly) { e.preventDefault(); this._startDrag(e, { kind: "fill", source: { ...this._sel.ranges[this._sel.ranges.length - 1] } }); return; }
        if (handle === "start" || handle === "end") { e.preventDefault(); this._startDrag(e, { kind: "handle", corner: handle }); return; }
        const sel = this._sel, sheet = this.sheet;
        const add = e.ctrlKey || e.metaKey, extend = e.shiftKey;
        // a read-only sheet keeps its rows hidden, so there the marker is part of the header
        if (this.readOnly && hit.area.endsWith("unhide")) hit.area = hit.area === "colunhide" ? "colheader" : "rowheader";
        switch (hit.area) {
            case "corner": this.selectAll(); return;
            case "colunhide": case "rowunhide":
                e.preventDefault();
                if (hit.area === "colunhide") this.showHiddenNextTo("col", hit.col, hit.edge); else this.showHiddenNextTo("row", hit.row, hit.edge);
                return;
            case "colresize": case "rowresize":
                if (this.readOnly) return;
                e.preventDefault();
                this._startDrag(e, { kind: hit.area, index: hit.area === "colresize" ? hit.col : hit.row, start: hit.area === "colresize" ? e.clientX : e.clientY, size: hit.area === "colresize" ? view.cols.sizeOf(hit.col) : view.rows.sizeOf(hit.row) });
                return;
            case "colheader": case "rowheader": {
                e.preventDefault();
                const cols = hit.area === "colheader";
                const anchor = extend ? (cols ? sel.anchor.col : sel.anchor.row) : (cols ? hit.col : hit.row);
                const at = cols ? hit.col : hit.row;
                const range = cols ? { r1: 0, c1: Math.min(anchor, at), r2: sheet.rowCount - 1, c2: Math.max(anchor, at) } : { r1: Math.min(anchor, at), c1: 0, r2: Math.max(anchor, at), c2: sheet.colCount - 1 };
                const ranges = add ? [...sel.ranges, range] : [range];
                const active = extend ? sel.active : cols ? { row: view.rows.at(view._scrollY + view.rows.offset(sheet.frozenRows)), col: hit.col } : { row: hit.row, col: Math.max(sheet.frozenCols, view.cols.at(view._scrollX)) };
                this._setSelection(ranges, cols ? { row: Math.min(active.row, sheet.rowCount - 1), col: active.col } : active, cols ? { row: 0, col: anchor } : { row: anchor, col: 0 }, cols ? { row: sheet.rowCount - 1, col: at } : { row: at, col: sheet.colCount - 1 }, false);
                this._startDrag(e, { kind: hit.area, anchor, add });
                return;
            }
        }
        e.preventDefault();
        // a press on the border of the selection moves it, with Ctrl it copies it
        if (!extend && !this.readOnly && this._onSelectionBorder(e)) {
            this._startDrag(e, { kind: "move", source: { ...sel.ranges[sel.ranges.length - 1] }, copy: add });
            return;
        }
        const target = e.target?.closest?.(".wx-spreadsheet-check");
        if (target && !extend && !add && !this.readOnly) {
            this.select({ row: hit.row, col: hit.col });
            this._toggleCell(hit.row, hit.col);
            return;
        }
        if (e.target?.closest?.("a[href]") && add) return;
        if (extend) {
            const range = this._expandMerges(sheet, webexpress.webui.SpreadsheetAddress.normalize({ r1: sel.anchor.row, c1: sel.anchor.col, r2: hit.row, c2: hit.col }));
            this._setSelection([...sel.ranges.slice(0, -1), range], sel.active, sel.anchor, { row: hit.row, col: hit.col }, false);
        } else {
            const range = this._expandMerges(sheet, { r1: hit.row, c1: hit.col, r2: hit.row, c2: hit.col });
            this._setSelection(add ? [...sel.ranges, range] : [range], { row: hit.row, col: hit.col }, { row: hit.row, col: hit.col }, { row: hit.row, col: hit.col }, false);
        }
        this._startDrag(e, { kind: "select" });
    }

    /**
     * Determines whether a pointer is on the border of the selection.
     * @param {PointerEvent} e - The event.
     * @returns {boolean} True if on the border.
     */
    _onSelectionBorder(e) {
        const box = this._view.pane.getBoundingClientRect();
        const x = e.clientX - box.left, y = e.clientY - box.top;
        const last = this._sel.ranges[this._sel.ranges.length - 1];
        return this._view.rangeRects(last).some(rect => {
            const inside = x >= rect.left - 3 && x <= rect.left + rect.width + 3 && y >= rect.top - 3 && y <= rect.top + rect.height + 3;
            const near = Math.abs(x - rect.left) <= 3 || Math.abs(x - rect.left - rect.width) <= 3 || Math.abs(y - rect.top) <= 3 || Math.abs(y - rect.top - rect.height) <= 3;
            return inside && near;
        });
    }

    /**
     * Tracks a drag with pointer capture, scrolling the grid when the pointer leaves it.
     * @param {PointerEvent} e - The starting event.
     * @param {object} drag - The drag state.
     */
    _startDrag(e, drag) {
        const grid = this._view.viewport;
        this._drag = { ...drag, pointer: e.pointerId, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY };
        try { grid.setPointerCapture?.(e.pointerId); } catch { /* the pointer may already be gone */ }
        const move = (ev) => this._onDragMove(ev);
        const up = (ev) => {
            grid.removeEventListener("pointermove", move);
            grid.removeEventListener("pointerup", up);
            grid.removeEventListener("pointercancel", up);
            if (this._scrollTimer) { clearInterval(this._scrollTimer); this._scrollTimer = null; }
            this._onDragEnd(ev);
        };
        grid.addEventListener("pointermove", move);
        grid.addEventListener("pointerup", up);
        grid.addEventListener("pointercancel", up);
        this._listeners.push(() => { grid.removeEventListener("pointermove", move); grid.removeEventListener("pointerup", up); grid.removeEventListener("pointercancel", up); });
    }

    /**
     * Follows a drag.
     * @param {PointerEvent} e - The event.
     */
    _onDragMove(e) {
        const drag = this._drag;
        if (!drag) return;
        drag.x = e.clientX; drag.y = e.clientY;
        const view = this._view, sheet = this.sheet, sel = this._sel;
        const box = view.viewport.getBoundingClientRect();
        // the grid scrolls on while the pointer is beyond its edge
        if (box.width && (e.clientY > box.bottom || e.clientY < box.top + view.headerHeight || e.clientX > box.right || e.clientX < box.left + view.headerWidth) && !["colresize", "rowresize"].includes(drag.kind)) {
            if (!this._scrollTimer) this._scrollTimer = setInterval(() => {
                const b = view.viewport.getBoundingClientRect();
                view.viewport.scrollTop += this._drag.y > b.bottom ? 24 : this._drag.y < b.top + view.headerHeight ? -24 : 0;
                view.viewport.scrollLeft += this._drag.x > b.right ? 40 : this._drag.x < b.left + view.headerWidth ? -40 : 0;
                this._onDragMove({ clientX: this._drag.x, clientY: this._drag.y });
            }, 50);
        } else if (this._scrollTimer) { clearInterval(this._scrollTimer); this._scrollTimer = null; }
        const hit = view.hit(e.clientX, e.clientY);
        const Address = webexpress.webui.SpreadsheetAddress;
        switch (drag.kind) {
            case "select": case "handle": {
                const anchor = drag.kind === "handle" ? (drag.corner === "start" ? { row: sel.ranges[sel.ranges.length - 1].r2, col: sel.ranges[sel.ranges.length - 1].c2 } : { row: sel.ranges[sel.ranges.length - 1].r1, col: sel.ranges[sel.ranges.length - 1].c1 }) : sel.anchor;
                const range = this._expandMerges(sheet, Address.normalize({ r1: anchor.row, c1: anchor.col, r2: hit.row, c2: hit.col }));
                this._setSelection([...sel.ranges.slice(0, -1), range], drag.kind === "handle" ? { row: range.r1, col: range.c1 } : sel.active, anchor, { row: hit.row, col: hit.col }, false);
                break;
            }
            case "colheader": case "rowheader": {
                const cols = drag.kind === "colheader";
                const at = cols ? hit.col : hit.row;
                const range = cols ? { r1: 0, c1: Math.min(drag.anchor, at), r2: sheet.rowCount - 1, c2: Math.max(drag.anchor, at) } : { r1: Math.min(drag.anchor, at), c1: 0, r2: Math.max(drag.anchor, at), c2: sheet.colCount - 1 };
                this._setSelection([...sel.ranges.slice(0, -1), range], sel.active, sel.anchor, cols ? { row: sheet.rowCount - 1, col: at } : { row: at, col: sheet.colCount - 1 }, false);
                break;
            }
            case "point": {
                const point = this._editing?.point;
                if (!point) break;
                point.focus = { row: hit.row, col: hit.col };
                this._insertPoint(drag.input, point);
                break;
            }
            case "fill": {
                const src = drag.source;
                const down = hit.row > src.r2 ? hit.row - src.r2 : hit.row < src.r1 ? hit.row - src.r1 : 0;
                const right = hit.col > src.c2 ? hit.col - src.c2 : hit.col < src.c1 ? hit.col - src.c1 : 0;
                // a fill follows one axis: the one the pointer moved further along
                this._preview = Math.abs(down) >= Math.abs(right)
                    ? { r1: Math.min(src.r1, hit.row), c1: src.c1, r2: Math.max(src.r2, hit.row), c2: src.c2 }
                    : { r1: src.r1, c1: Math.min(src.c1, hit.col), r2: src.r2, c2: Math.max(src.c2, hit.col) };
                if (!down && !right) this._preview = null;
                view.renderOverlay();
                break;
            }
            case "move": {
                const src = drag.source;
                if (!drag.offset) {
                    const start = view.hit(drag.startX, drag.startY);
                    drag.offset = { row: start.row - src.r1, col: start.col - src.c1 };
                }
                const r1 = Math.max(0, hit.row - drag.offset.row), c1 = Math.max(0, hit.col - drag.offset.col);
                this._preview = { r1, c1, r2: r1 + src.r2 - src.r1, c2: c1 + src.c2 - src.c1 };
                view.renderOverlay();
                break;
            }
            case "colresize": case "rowresize": {
                const delta = (drag.kind === "colresize" ? e.clientX : e.clientY) - drag.start;
                drag.next = Math.max(4, (drag.size + delta) / this.zoom);
                this._preview = drag.kind === "colresize"
                    ? { r1: 0, c1: drag.index, r2: sheet.rowCount - 1, c2: drag.index }
                    : { r1: drag.index, c1: 0, r2: drag.index, c2: sheet.colCount - 1 };
                view.renderOverlay();
                const guide = view.overlay.querySelector(".wx-spreadsheet-preview");
                if (guide) {
                    if (drag.kind === "colresize") guide.style.width = drag.next * this.zoom + "px";
                    else guide.style.height = drag.next * this.zoom + "px";
                }
                break;
            }
        }
    }

    /**
     * Completes a drag.
     * @param {PointerEvent} e - The event.
     */
    _onDragEnd(e) {
        const drag = this._drag;
        this._drag = null;
        if (!drag) return;
        const preview = this._preview;
        this._preview = null;
        switch (drag.kind) {
            case "fill":
                if (preview) { this.autoFill(drag.source, preview, { copy: e.ctrlKey || e.metaKey }); this.select(preview, { scroll: false }); }
                break;
            case "move":
                if (preview && (preview.r1 !== drag.source.r1 || preview.c1 !== drag.source.c1)) {
                    if (drag.copy) {
                        const data = this._clipboardData(this.sheet, drag.source, false);
                        this.pasteData({ json: data.json }, { target: { r1: preview.r1, c1: preview.c1, r2: preview.r1, c2: preview.c1 } });
                    } else this.moveRange(drag.source, { row: preview.r1, col: preview.c1 });
                }
                break;
            case "colresize": if (drag.next) this.setColumnWidth(drag.index, drag.next); break;
            case "rowresize": if (drag.next) this.setRowHeight(drag.index, drag.next); break;
            case "select":
                if (this._painter) {
                    const painter = this._painter;
                    this._painter = null;
                    this.batch(() => {
                        for (const range of this._sel.ranges) this._eachCell(this.sheet, range, cell => ({ ...cell, s: painter?.s, st: painter?.st }));
                    }, "formatPainter");
                }
                break;
        }
        this._view.renderOverlay();
        this._refreshChrome();
    }

    /**
     * Handles touch: a tap selects, a double tap edits, a long press opens the context menu,
     * two fingers zoom; panning stays the browser's native scrolling.
     * @param {PointerEvent} e - The event.
     * @param {object} hit - What lies under the touch.
     */
    _beginTouch(e, hit) {
        const touches = this._touches ??= new Map();
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const grid = this._view.viewport;
        if (touches.size === 2) {
            const [a, b] = [...touches.values()];
            this._pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.zoom };
            if (this._longPress) { this.cancelDeferred(this._longPress); this._longPress = null; }
        }
        const start = { x: e.clientX, y: e.clientY, time: Date.now(), moved: false };
        this._longPress = this.defer(() => { this._longPress = null; if (!start.moved && touches.size === 1) { this._selectHit(hit); this._openContextMenu({ x: start.x, y: start.y }); } }, 550);
        const move = (ev) => {
            if (!touches.has(ev.pointerId)) return;
            touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
            if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 8) start.moved = true;
            if (this._pinch && touches.size === 2) {
                const [a, b] = [...touches.values()];
                const ratio = Math.hypot(a.x - b.x, a.y - b.y) / (this._pinch.distance || 1);
                const zoom = Math.round(Math.min(2, Math.max(0.5, this._pinch.zoom * ratio)) * 20) / 20;
                if (zoom !== this.zoom) this.zoom = zoom;
            }
        };
        const up = (ev) => {
            touches.delete(ev.pointerId);
            grid.removeEventListener("pointermove", move);
            grid.removeEventListener("pointerup", up);
            grid.removeEventListener("pointercancel", up);
            if (this._longPress) { this.cancelDeferred(this._longPress); this._longPress = null; }
            if (touches.size < 2) this._pinch = null;
            if (start.moved || ev.type === "pointercancel" || touches.size) return;
            const now = Date.now();
            const double = this._lastTap && now - this._lastTap.time < 350 && this._lastTap.row === hit.row && this._lastTap.col === hit.col;
            this._lastTap = { time: now, row: hit.row, col: hit.col };
            if (this._editing) this._commitEdit();
            if (hit.area.endsWith("unhide") && !this.readOnly) { this.showHiddenNextTo(hit.area === "colunhide" ? "col" : "row", hit.area === "colunhide" ? hit.col : hit.row, hit.edge); return; }
            this._selectHit(hit);
            if (double && hit.area === "cell" && !this.readOnly) {
                // a touch keyboard is easier to use in the formula bar than in a small cell
                this._startEdit({ mode: "edit", source: "bar" });
            }
        };
        grid.addEventListener("pointermove", move);
        grid.addEventListener("pointerup", up);
        grid.addEventListener("pointercancel", up);
    }

    /**
     * Selects what a hit names, the way a click does.
     * @param {object} hit - The hit.
     */
    _selectHit(hit) {
        const sheet = this.sheet;
        if (hit.area === "corner") this.selectAll();
        else if (hit.area === "colheader" || hit.area === "colunhide") this.select({ r1: 0, c1: hit.col, r2: sheet.rowCount - 1, c2: hit.col }, { scroll: false });
        else if (hit.area === "rowheader" || hit.area === "rowunhide") this.select({ r1: hit.row, c1: 0, r2: hit.row, c2: sheet.colCount - 1 }, { scroll: false });
        else if (hit.area === "cell") this.select({ row: hit.row, col: hit.col }, { scroll: false });
    }

    /**
     * Handles clipboard events while the grid has the focus.
     * @param {ClipboardEvent} e - The event.
     * @param {string} type - "copy", "cut" or "paste".
     */
    _onClipboard(e, type) {
        if (this._editing || this.disabled || !this._gridFocused() || e.defaultPrevented) return;
        const Clipboard = webexpress.webui.SpreadsheetClipboard;
        if (type === "paste") {
            if (this.readOnly) return;
            e.preventDefault();
            const formats = Clipboard.fromTransfer(e.clipboardData);
            // a cut of this page is recognized by its payload; the browser's clipboard has no other marker
            if (!formats.json && !formats.html && Clipboard._last && formats.text === Clipboard._last.text) formats.json = Clipboard._last.json;
            this.pasteData(formats);
            return;
        }
        if (type === "cut" && this.readOnly) return;
        if (!e.clipboardData) return;
        e.preventDefault();
        const data = this._prepareCopy(type === "cut");
        e.clipboardData.setData("text/plain", data.text);
        e.clipboardData.setData("text/html", data.html);
        try { e.clipboardData.setData(Clipboard.FORMAT, data.json); } catch { /* custom formats are optional */ }
    }

    /**
     * Opens the context menu at the pointer.
     * @param {MouseEvent} e - The event.
     */
    _onContextMenu(e) {
        // inside the cell editor the browser's own menu edits the text; the cell actions would
        // act on the cells behind an entry that is still open
        if (this._editor.contains(e.target)) return;
        e.preventDefault();
        const hit = this._view.hit(e.clientX, e.clientY);
        const sel = this._sel;
        const inside = sel.ranges.some(r => webexpress.webui.SpreadsheetAddress.contains(r, hit.row, hit.col));
        if (!inside) this._selectHit(hit);
        this._openContextMenu({ x: e.clientX, y: e.clientY, hit });
    }

    /**
     * Lists the entries of the grid's context menu, the plugins' entries included.
     * @param {object} context - { hit }.
     * @returns {Array<object>} The entries.
     */
    getContextMenuItems(context = {}) {
        const t = (key, fallback) => this.t(key, fallback);
        const sel = this._sel, last = sel.ranges[sel.ranges.length - 1];
        const merged = this.sheet.mergeAt(sel.active.row, sel.active.col);
        const readOnly = this.readOnly;
        const items = [
            { label: t("cut", "Cut"), icon: "scissors", command: "cut", disabled: readOnly, shortcut: "Ctrl+X" },
            { label: t("copy", "Copy"), icon: "copy", command: "copy", shortcut: "Ctrl+C" },
            { label: t("paste", "Paste"), icon: "paste", command: "paste", disabled: readOnly, shortcut: "Ctrl+V" },
            { label: t("paste.values", "Paste values only"), command: "pastevalues", disabled: readOnly },
            { separator: true },
            { label: t("row.insertabove", "Insert rows above"), icon: "add-row-above", command: "insertrowabove", disabled: readOnly },
            { label: t("row.insertbelow", "Insert rows below"), icon: "add-row-below", command: "insertrowbelow", disabled: readOnly },
            { label: t("col.insertleft", "Insert columns left"), icon: "add-column-above", command: "insertcolleft", disabled: readOnly },
            { label: t("col.insertright", "Insert columns right"), icon: "add-column-below", command: "insertcolright", disabled: readOnly },
            { label: t("row.delete", "Delete rows"), icon: "del-row", command: "deleterow", disabled: readOnly },
            { label: t("col.delete", "Delete columns"), icon: "del-column", command: "deletecol", disabled: readOnly },
            { separator: true },
            ...this._hideMenuItems(context.hit?.area, last),
            { separator: true },
            { label: t("clear.contents", "Clear contents"), icon: "eraser", command: "clearcontents", disabled: readOnly, shortcut: "Del" },
            { label: merged ? t("unmerge", "Unmerge cells") : t("merge", "Merge cells"), icon: merged ? "split-cell" : "merge-cell", command: merged ? "unmerge" : "merge", disabled: readOnly || (!merged && last.r1 === last.r2 && last.c1 === last.c2) },
            { label: t("comment", "Comment"), icon: "comment", command: "comment", disabled: readOnly, shortcut: "Shift+F2" },
            { separator: true },
            { label: t("sort.asc", "Sort ascending"), icon: "arrow-down-a-z", command: "sortasc", disabled: readOnly },
            { label: t("sort.desc", "Sort descending"), icon: "arrow-down-z-a", command: "sortdesc", disabled: readOnly }
        ];
        for (const plugin of this._plugins) {
            const extra = plugin.getContextMenuItems?.(this, context);
            if (extra?.length) items.push({ separator: true }, ...extra);
        }
        return items;
    }

    /**
     * Lists the entries that hide and show rows and columns. A row header offers only the rows,
     * a column header only the columns.
     * @param {string} [area] - The area the menu was opened on.
     * @param {object} range - The selected range.
     * @returns {Array<object>} The entries.
     */
    _hideMenuItems(area, range) {
        const t = (key, fallback) => this.t(key, fallback);
        const readOnly = this.readOnly, items = [];
        area = area?.replace("unhide", "header");
        if (area !== "colheader") {
            items.push(
                { label: t("row.hide", "Hide rows"), icon: "eye-slash", command: "hiderow", disabled: readOnly || !this._canHide("row", range.r1, range.r2), shortcut: "Ctrl+9" },
                { label: t("row.unhide", "Show hidden rows"), icon: "eye", command: "unhiderow", disabled: readOnly || !this._hasHidden("row", range.r1, range.r2), shortcut: "Ctrl+Shift+9" }
            );
        }
        if (area !== "rowheader") {
            items.push(
                { label: t("col.hide", "Hide columns"), icon: "eye-slash", command: "hidecol", disabled: readOnly || !this._canHide("col", range.c1, range.c2), shortcut: "Ctrl+0" },
                { label: t("col.unhide", "Show hidden columns"), icon: "eye", command: "unhidecol", disabled: readOnly || !this._hasHidden("col", range.c1, range.c2), shortcut: "Ctrl+Shift+0" }
            );
        }
        return items;
    }

    /**
     * Opens the context menu.
     * @param {{x: number, y: number}|null} at - The position; next to the active cell when null.
     */
    _openContextMenu(at) {
        const point = at ?? (() => { const r = this._view.clientRect(this._sel.active.row, this._sel.active.col); return { x: r.left + r.width / 2, y: r.top + r.height }; })();
        this._showMenu(this.getContextMenuItems({ hit: at?.hit }), point.x, point.y);
    }

    /**
     * Shows a menu of entries at a viewport position.
     * @param {Array<object>} items - The entries { label, icon, command, value, disabled, separator, onClick, shortcut }.
     * @param {number} x - The x position.
     * @param {number} y - The y position.
     */
    _showMenu(items, x, y) {
        const menu = this._menu;
        menu.textContent = "";
        for (const item of items) {
            if (item.separator) {
                if (menu.lastChild && !menu.lastChild.classList.contains("dropdown-divider")) { const sep = document.createElement("div"); sep.className = "dropdown-divider"; sep.setAttribute("role", "separator"); menu.appendChild(sep); }
                continue;
            }
            const button = document.createElement("button");
            button.type = "button";
            button.className = "dropdown-item";
            button.setAttribute("role", "menuitem");
            button.tabIndex = -1;
            button.disabled = !!item.disabled;
            if (item.icon) { const icon = document.createElement("i"); icon.className = webexpress.webui.IconSet.resolve(item.icon); icon.setAttribute("aria-hidden", "true"); button.appendChild(icon); }
            const label = document.createElement("span");
            label.textContent = item.label;
            button.appendChild(label);
            if (item.shortcut) { const kbd = document.createElement("kbd"); kbd.textContent = item.shortcut; button.appendChild(kbd); button.setAttribute("aria-keyshortcuts", item.shortcut.replace("Ctrl", "Control")); }
            button.addEventListener("click", () => {
                this._closeMenu();
                if (item.onClick) item.onClick(this); else this.execCommand(item.command, item.value ?? null);
                this._refreshChrome();
            });
            menu.appendChild(button);
        }
        // a modal dialog makes everything outside it inert, so the menu moves into the open dialog
        // the spreadsheet sits in; the top layer alone would draw it, but not let it be clicked
        const host = this._element.closest("dialog[open]") ?? document.body;
        if (menu.parentNode !== host) host.appendChild(menu);
        menu.hidden = false;
        menu.style.display = "block";
        if (menu.getAttribute("popover") && !menu.matches(":popover-open")) {
            try { menu.showPopover(); } catch { /* a menu outside the document stays an ordinary fixed box */ }
        }
        // placed from its real size, which only exists once it is shown: a menu that does not fit
        // below the pointer opens above it, and one taller than both sides ends at the bottom edge
        const viewWidth = globalThis.innerWidth || 1024, viewHeight = globalThis.innerHeight || 768;
        const width = menu.offsetWidth || 260, height = menu.offsetHeight || Math.min(560, items.length * 32);
        const gap = 4;
        const top = y + height <= viewHeight - gap ? y : y - height >= gap ? y - height : viewHeight - height - gap;
        menu.style.left = Math.max(0, Math.min(x, viewWidth - width - gap)) + "px";
        menu.style.top = Math.max(0, top) + "px";
        this._menuReturn = document.activeElement;
        menu.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
    }

    /**
     * Closes the context menu and returns the focus.
     */
    _closeMenu() {
        if (this._menu.hidden) return;
        this._menu.hidden = true;
        this._menu.style.display = "none";
        if (this._menu.getAttribute("popover") && this._menu.matches(":popover-open")) this._menu.hidePopover();
        if (this._menu.contains(document.activeElement)) (this._menuReturn ?? this._view.viewport).focus?.({ preventScroll: true });
    }

    /**
     * Navigates the context menu with the keyboard.
     * @param {KeyboardEvent} e - The event.
     */
    _onMenuKey(e) {
        const items = [...this._menu.querySelectorAll("button:not(:disabled)")];
        const index = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(index + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus({ preventScroll: true }); }
        else if (e.key === "Home") { e.preventDefault(); items[0]?.focus({ preventScroll: true }); }
        else if (e.key === "End") { e.preventDefault(); items[items.length - 1]?.focus({ preventScroll: true }); }
        else if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); this._closeMenu(); }
    }

    /**
     * Opens the list of functions next to the fx button.
     */
    _openFunctionMenu() {
        if (this.readOnly) return;
        const rect = this._functionButton.getBoundingClientRect();
        const items = webexpress.webui.SpreadsheetFunctions.getAll().map(def => ({ label: def.syntax || def.name, command: "insertfunction", value: def.name }));
        this._showMenu(items, rect.left, rect.bottom);
    }

    /**
     * Opens the comment editor of the active cell.
     * @returns {boolean} True if opened.
     */
    _openComment() {
        if (this.readOnly) return false;
        const sel = this._sel;
        const cell = this.sheet.getCell(sel.active.row, sel.active.col);
        this._comment?.remove();
        const popup = document.createElement("div");
        popup.className = "wx-spreadsheet-comment-editor";
        popup.setAttribute("role", "dialog");
        popup.setAttribute("aria-label", this.t("comment", "Comment"));
        const area = document.createElement("textarea");
        area.value = cell?.c?.text ?? "";
        area.setAttribute("aria-label", this.t("comment", "Comment"));
        const actions = document.createElement("div");
        actions.className = "wx-spreadsheet-comment-actions";
        const close = () => { popup.remove(); this._comment = null; this._view.viewport.focus({ preventScroll: true }); };
        const save = document.createElement("button");
        save.type = "button"; save.className = "btn btn-primary btn-sm"; save.textContent = this.t("comment.save", "Save");
        save.addEventListener("click", () => { this.setComment({ row: sel.active.row, col: sel.active.col }, area.value); close(); });
        const remove = document.createElement("button");
        remove.type = "button"; remove.className = "btn btn-outline-danger btn-sm"; remove.textContent = this.t("comment.remove", "Remove");
        remove.disabled = !cell?.c;
        remove.addEventListener("click", () => { this.setComment({ row: sel.active.row, col: sel.active.col }, null); close(); });
        const cancel = document.createElement("button");
        cancel.type = "button"; cancel.className = "btn btn-secondary btn-sm"; cancel.textContent = this.t("comment.cancel", "Cancel");
        cancel.addEventListener("click", close);
        area.addEventListener("keydown", e => {
            if (e.key === "Escape") { e.preventDefault(); close(); }
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save.click(); }
        });
        actions.append(remove, cancel, save);
        popup.append(area, actions);
        const rect = this._view.cellRect(sel.active.row, sel.active.col);
        popup.style.left = rect.left + rect.width + 4 + "px";
        popup.style.top = rect.top + "px";
        this._view.pane.appendChild(popup);
        this._comment = popup;
        area.focus({ preventScroll: true });
        return true;
    }

    /**
     * Navigates or selects through the name box: a reference, a range or a named range; an
     * unknown valid name defines a named range for the selection.
     * @param {KeyboardEvent} e - The event.
     */
    _onNameBoxKey(e) {
        if (e.key === "Escape") { e.preventDefault(); this._refreshChrome(); this._view.viewport.focus({ preventScroll: true }); return; }
        if (e.key !== "Enter") return;
        e.preventDefault();
        const text = this._nameBox.value.trim();
        try {
            this.goTo(text);
        } catch {
            if (!this.readOnly && webexpress.webui.SpreadsheetModel.isValidName(text)) {
                this.defineName(text, webexpress.webui.SpreadsheetAddress.rangeName(this._sel.ranges[this._sel.ranges.length - 1]));
                this._view.viewport.focus({ preventScroll: true });
            } else {
                this._nameBox.setAttribute("aria-invalid", "true");
                this._announce(this.t("namebox.invalid", "Unknown reference or name"));
                this.defer(() => this._nameBox.removeAttribute("aria-invalid"), 1500);
            }
        }
    }

    /**
     * Moves between the sheet tabs with the arrow keys and opens their menu.
     * @param {KeyboardEvent} e - The event.
     */
    _onTabKey(e) {
        const tabs = [...this._tabs.querySelectorAll("[role=tab]")];
        const index = tabs.indexOf(document.activeElement);
        if (index < 0) return;
        let next = null;
        if (e.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
        else if (e.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        else if (e.key === "F2" && !this.readOnly) { e.preventDefault(); this._renameTab(tabs[index]); return; }
        else if (e.key === "Delete" && !this.readOnly) { e.preventDefault(); this.removeSheet(tabs[index].getAttribute("data-sheet")); return; }
        else if (e.key === "ContextMenu" || e.key === "F10" && e.shiftKey) { e.preventDefault(); const r = tabs[index].getBoundingClientRect(); this._openTabMenu(tabs[index], r.left, r.top); return; }
        if (!next) return;
        e.preventDefault();
        this.activateSheet(next.getAttribute("data-sheet"));
        this._tabs.querySelector("[aria-selected=true]")?.focus({ preventScroll: true });
    }

    /**
     * Renames a sheet inline in its tab.
     * @param {HTMLElement} tab - The tab.
     */
    _renameTab(tab) {
        const id = tab.getAttribute("data-sheet");
        const input = document.createElement("input");
        input.type = "text";
        input.className = "wx-spreadsheet-tab-input";
        input.value = this._model.sheet(id)?.name ?? "";
        input.setAttribute("aria-label", this.t("sheet.rename", "Rename sheet"));
        tab.replaceWith(input);
        input.focus({ preventScroll: true });
        try { input.select(); } catch { /* the stub has no selection api */ }
        let done = false;
        const finish = (commit) => {
            if (done) return;
            done = true;
            if (commit && input.value.trim() && !this.renameSheet(id, input.value)) this._announce(this.t("sheet.invalidname", "This name cannot be used."));
            this._tabsKey = null;
            input.remove();
            this._refreshChrome();
            this._tabs.querySelector("[aria-selected=true]")?.focus({ preventScroll: true });
        };
        input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); finish(true); } else if (e.key === "Escape") { e.preventDefault(); finish(false); } });
        input.addEventListener("blur", () => finish(true));
    }

    /**
     * Opens the menu of a sheet tab.
     * @param {HTMLElement} tab - The tab.
     * @param {number} x - The x position.
     * @param {number} y - The y position.
     */
    _openTabMenu(tab, x, y) {
        const id = tab.getAttribute("data-sheet"), index = this._model.sheetIndex(id), readOnly = this.readOnly;
        this._showMenu([
            { label: this.t("sheet.rename", "Rename"), icon: "pen", disabled: readOnly, onClick: () => { this._renameTab(this._tabs.querySelector("[data-sheet=\"" + id + "\"]")); } },
            { label: this.t("sheet.copy", "Duplicate"), icon: "clone", disabled: readOnly, onClick: () => this.copySheet(id) },
            { label: this.t("sheet.moveleft", "Move left"), icon: "angle-left", disabled: readOnly || index === 0, onClick: () => this.moveSheet(id, index - 1) },
            { label: this.t("sheet.moveright", "Move right"), icon: "angle-right", disabled: readOnly || index === this._model.sheets.length - 1, onClick: () => this.moveSheet(id, index + 1) },
            { separator: true },
            { label: this.t("sheet.delete", "Delete"), icon: "trash", disabled: readOnly || this._model.sheets.length < 2, onClick: () => this.removeSheet(id) }
        ], x, y);
    }

    // ------------------------------------------------------------------ teardown

    /**
     * Tears the control down: the provider session, listeners, timers, observers and the menu.
     */
    destroy() {
        if (this._destroyed) return;
        this.disconnect();
        this._destroyed = true;
        this._listeners.splice(0).forEach(cleanup => cleanup());
        this._timers.forEach(timer => clearTimeout(timer)); this._timers.clear();
        if (this._scrollTimer) clearInterval(this._scrollTimer);
        this._pluginCleanups.splice(0).forEach(cleanup => { try { cleanup(); } catch (e) { console.error(e); } });
        this._unsubscribeFunctions?.();
        this._resizeObserver?.disconnect();
        this._fieldsetObserver?.disconnect();
        this._menu?.remove();
        if (webexpress.webui.SpreadsheetClipboard._cut?.ctrl === this) webexpress.webui.SpreadsheetClipboard._cut = null;
        if (this._formInput) this._formInput.disabled = true;
        super.destroy();
    }
};

webexpress.webui.Controller.registerClass("wx-webui-spreadsheet", webexpress.webui.SpreadsheetCtrl);
