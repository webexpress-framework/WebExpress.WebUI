/**
 * Table controller providing declarative parsing, sorting, rendering, and optional column resizing.
 * The following events are triggered:
 * - webexpress.webui.Event.TABLE_SORT_EVENT
 * - webexpress.webui.Event.SELECT_ROW_EVENT
 */
webexpress.webui.TableCtrl = class extends webexpress.webui.Ctrl {

    static MIN_COL_WIDTH = 30;
    static AUTOSIZE_BUFFER = 8;
    static IGNORED_DATA_ATTRS = ["data-color", "data-border", "data-striped", "data-selectable"];

    _table = document.createElement("div");
    _head = document.createElement("div");
    _body = document.createElement("div");
    _foot = null;

    _columns = [];
    _rows = [];
    _footer = [];
    _options = [];

    // feature flags
    _isTree = false;
    _suppressHeaders = false;
    _highlightChanges = true;
    _suppressFlashOnce = false;
    _columnResizeEnabled = true;
    _hasOptions = false;
    _selectable = false;

    // state
    _selectedRow = null;
    _renderScheduled = false;
    _isResizing = false;
    _initialized = false;
    _autoSelected = false;

    // caches
    _prevRowState = new Map();
    _colIndexCache = new Map();

    /**
     * Initialize controller and render initial state.
     * @param {HTMLElement} element - Host element that contains declarative configuration.
     */
    constructor(element) {
        super(element);
        this._suppressFlashOnce = true;
        this._setupDom(element);
        this._parseConfig(element);
        this._initEventListeners();
        this.render();
        this._initialized = true;
    }

    /**
     * Build base DOM structure and apply initial classes from dataset.
     * Sets ARIA roles for accessibility.
     * @param {HTMLElement} element - Host element.
     */
    _setupDom(element) {
        this._table.className = "wx-table";
        this._table.setAttribute("role", "table");

        const ds = element.dataset;
        if (ds.color) {
            this._table.classList.add(ds.color);
        }
        if (ds.border) {
            this._table.classList.add(ds.border);
        }
        if (ds.striped) {
            this._table.classList.add(...ds.striped.split(" "));
        }
        // explicit check for string "true" to enable selection
        this._selectable = ds.selectable === "true";
        if (this._selectable) {
            this._table.classList.add("wx-table-selectable");
            // make the host focusable so keyboard shortcuts work without an inner element being focused
            if (!element.hasAttribute("tabindex")) {
                element.tabIndex = 0;
            }
        }

        this._head.className = "wx-table-header-group";
        this._head.setAttribute("role", "rowgroup");

        this._body.className = "wx-table-body-group";
        this._body.setAttribute("role", "rowgroup");

        const frag = document.createDocumentFragment();
        frag.append(this._head, this._body);
        this._table.appendChild(frag);
    }

    /**
     * Parse declarative configuration from child nodes of the host element.
     * @param {HTMLElement} element - Host element.
     */
    _parseConfig(element) {
        this._beforeInitParse(element);

        this._options = this._parseOptions(element.querySelector(":scope > .wx-table-options"));
        this._columns = this._parseColumns(element.querySelector(":scope > .wx-table-columns"));
        this._rows = this._parseRows(element.querySelectorAll(":scope > .wx-table-row"));
        this._footer = this._parseFooter(element.querySelector(":scope > .wx-table-footer"));

        this._recalculateHasOptions();

        element.replaceChildren(this._table);

        // cleanup attributes
        for (const attr of webexpress.webui.TableCtrl.IGNORED_DATA_ATTRS) {
            element.removeAttribute(attr);
        }
    }

    /**
     * Register event listeners for header interactions (sorting), body interactions (selection and inputs),
     * and host-level keyboard shortcuts.
     */
    _initEventListeners() {
        // header click (sorting)
        this._head.addEventListener("click", (e) => {
            const headerCell = e.target.closest(".wx-col-header");
            if (!headerCell || this._isResizing) {
                return;
            }
            const colId = headerCell.dataset.columnId;
            const idx = this._colIndexCache.get(colId);
            if (idx === undefined) {
                return;
            }
            const col = this._columns[idx];
            if (col) {
                this._handleSortClick(headerCell, col);
            }
        }, { passive: true });

        // body click (selection)
        this._body.addEventListener("click", (e) => {
            if (e.target.closest(".wx-dropdown-toggle, .wx-dropdown-menu, .dropdown-toggle, .dropdown-menu, .wx-table-actions")) {
                return;
            }
            // ignore interactive elements and content editable areas
            if (e.target.closest("a, button, input, select, textarea, [contenteditable='true'], .wx-prevent-row-select")) {
                return;
            }

            const rowEl = e.target.closest(".wx-grid-row");
            if (rowEl && rowEl._dataRowRef && this._selectable) {
                this._selectRowInternal(rowEl._dataRowRef, e);
            }
        });

        // body input (sync manual edits back to the internal data model)
        this._body.addEventListener("input", (e) => this._syncCellEdit(e));

        // host-level keyboard shortcuts (only when selectable)
        if (this._selectable) {
            this._element.addEventListener("keydown", (e) => this._onHostKeyDown(e));
        }
    }

    /**
     * Synchronises content edits back to the row model.
     * @param {Event} e - The triggering input event.
     */
    _syncCellEdit(e) {
        const cellEl = e.target.closest(".wx-grid-cell");
        const rowEl = e.target.closest(".wx-grid-row");
        if (!cellEl || !rowEl || !rowEl._dataRowRef) {
            return;
        }

        const cellsInRow = Array.from(rowEl.children).filter(c => c.classList.contains("wx-grid-cell"));
        const colIndex = cellsInRow.indexOf(cellEl);
        if (colIndex < 0) {
            return;
        }

        // map dom-index (visible columns only) back to model index
        let visibleCount = 0;
        for (let i = 0; i < this._columns.length; i++) {
            if (!this._columns[i].visible) {
                continue;
            }
            if (visibleCount === colIndex) {
                if (rowEl._dataRowRef.cells[i]) {
                    rowEl._dataRowRef.cells[i].content = cellEl.innerHTML;
                }
                return;
            }
            visibleCount++;
        }
    }

    /**
     * Hook for subclasses to preprocess the host element before parsing.
     * @param {HTMLElement} element - Host element.
     */
    _beforeInitParse(element) { }

    // ------------------------------------------------------------------ public api

    /**
     * Enable change flash highlighting.
     */
    enableChangeFlash() {
        this._highlightChanges = true;
    }

    /**
     * Disable change flash highlighting.
     */
    disableChangeFlash() {
        this._highlightChanges = false;
    }

    /**
     * Enable column resizing behavior.
     */
    enableColumnResize() {
        this._columnResizeEnabled = true;
    }

    /**
     * Disable column resizing behavior.
     */
    disableColumnResize() {
        this._columnResizeEnabled = false;
    }

    /**
     * Selects a row programmatically.
     * @param {string} rowId - The ID of the row.
     */
    selectRow(rowId) {
        const row = this._findRowById(rowId);
        if (row) {
            this._selectRowInternal(row, null);
        }
    }

    /**
     * Returns the currently selected row, or null when nothing is selected.
     * @returns {Object|null}
     */
    getSelectedRow() {
        return this._selectedRow;
    }

    /**
     * Replaces the table's row data and re-renders.
     * @param {Array<Object>} rows - The new row payload.
     */
    setRows(rows) {
        if (!Array.isArray(rows)) {
            return;
        }
        this._rows = rows;
        this._selectedRow = null;
        this._autoSelected = false;
        this._recalculateHasOptions();
        this.render();
    }

    /**
     * Replace the current column definitions.
     * @param {Array<Object>} columns - Column descriptors.
     * @param {boolean} [preserveExisting=true] - Preserve row mappings.
     */
    setColumns(columns, preserveExisting = true) {
        if (!Array.isArray(columns) || !columns.length) {
            return;
        }

        const prevCols = this._columns.slice();
        const prevOrder = prevCols.map(c => c.id);

        const normalized = columns.map((c, idx) => ({
            id: c.id || `col_${idx}`,
            index: idx,
            name: c.name || null,
            label: c.label != null ? String(c.label) : (c.id || `Column ${idx + 1}`),
            icon: c.icon || null,
            image: c.image || null,
            color: c.color || null,
            width: c.width || null,
            minWidth: c.minWidth || null,
            resizable: typeof c.resizable === "boolean" ? c.resizable : true,
            sort: null,
            visible: typeof c.visible === "boolean" ? c.visible : true,
            rendererType: c.rendererType || null,
            rendererOptions: c.rendererOptions || {}
        }));

        if (preserveExisting) {
            const prevIndexMap = new Map(prevOrder.map((id, i) => [id, i]));
            const remapRow = (row) => {
                const newCells = new Array(normalized.length);
                for (let i = 0; i < normalized.length; i++) {
                    const oldIdx = prevIndexMap.get(normalized[i].id);
                    newCells[i] = (oldIdx != null && row.cells[oldIdx]) ? row.cells[oldIdx] : { content: "" };
                }
                row.cells = newCells;
                if (row.children) {
                    row.children.forEach(remapRow);
                }
            };
            this._rows.forEach(remapRow);
        } else {
            const resizeRow = (r) => {
                if (!Array.isArray(r.cells)) {
                    r.cells = [];
                }
                while (r.cells.length < normalized.length) {
                    r.cells.push({ content: "" });
                }
                if (r.cells.length > normalized.length) {
                    r.cells.length = normalized.length;
                }
                if (r.children) {
                    r.children.forEach(resizeRow);
                }
            };
            this._rows.forEach(resizeRow);
        }

        this._columns = normalized;
        this.render();
    }

    /**
     * Insert a new row at the given position.
     * @param {Object|Array} rowData - Row data object.
     * @param {string|null} [parentId=null] - Parent row id.
     * @param {number|null} [index=null] - Target index.
     * @returns {Object|null} - The inserted row.
     */
    insertRow(rowData, parentId = null, index = null) {
        const row = this._buildRowFromInput(rowData);

        while (row.cells.length < this._columns.length) {
            row.cells.push({ content: "" });
        }

        let siblings = this._rows;
        if (parentId) {
            const info = this._findRowAndParent(parentId);
            if (!info || !info.row) {
                return null;
            }
            if (!Array.isArray(info.row.children)) {
                info.row.children = [];
            }
            siblings = info.row.children;
            row.parent = info.row;
        }

        if (index === null || index < 0 || index > siblings.length) {
            index = siblings.length;
        }
        siblings.splice(index, 0, row);

        if (!this._hasOptions && row.options?.length > 0) {
            this._hasOptions = true;
        }

        this.render();
        return row;
    }

    /**
     * Builds a normalized row object from a plain input.
     * @param {Object|Array} data - Row source data.
     * @returns {Object}
     */
    _buildRowFromInput(data) {
        if (Array.isArray(data)) {
            return {
                id: null,
                cells: data.map(v => ({ content: String(v ?? "") })),
                children: [], parent: null, expanded: true, options: null
            };
        }
        return {
            id: data.id || null,
            class: data.class || null,
            style: data.style || null,
            color: data.color || null,
            image: data.image || null,
            icon: data.icon || null,
            uri: data.uri || data.url || null,
            target: data.target || null,
            primaryAction: data.primaryAction || null,
            secondaryAction: data.secondaryAction || null,
            bind: data.bind || null,
            cells: Array.isArray(data.cells)
                ? data.cells.map(c => (c && typeof c === "object" ? c : { content: String(c ?? "") }))
                : [],
            options: Array.isArray(data.options) ? data.options : null,
            children: [],
            parent: null,
            expanded: typeof data.expanded === "boolean" ? data.expanded : true
        };
    }

    /**
     * Delete a row by its id.
     * @param {string} rowId - Target row id.
     * @returns {boolean} - True when a row was removed.
     */
    deleteRow(rowId) {
        if (!rowId) {
            return false;
        }
        const removed = this._removeRowRecursive(rowId, this._rows);
        if (removed) {
            if (this._selectedRow && this._selectedRow.id === rowId) {
                this._selectedRow = null;
            }
            this._recalculateHasOptions();
            this.render();
        }
        return removed;
    }

    // ------------------------------------------------------------------ selection

    /**
     * Internal logic to handle row selection and event dispatching.
     * @param {Object} row - Data row object.
     * @param {Event|null} originalEvent - Triggering event.
     */
    _selectRowInternal(row, originalEvent) {
        // deselect previous
        if (this._selectedRow && this._selectedRow._anchorTr) {
            this._selectedRow._anchorTr.classList.remove("active");
            this._selectedRow._anchorTr.removeAttribute("aria-selected");
        }

        this._selectedRow = row;

        // select new
        if (this._selectedRow && this._selectedRow._anchorTr) {
            this._selectedRow._anchorTr.classList.add("active");
            this._selectedRow._anchorTr.setAttribute("aria-selected", "true");
        }

        // dispatch event
        this._dispatch(webexpress?.webui?.Event?.SELECT_ROW_EVENT, {
            sender: this._element,
            row: this._selectedRow,
            rowId: this._selectedRow?.id,
            primaryAction: this._selectedRow?.primaryAction,
            secondaryAction: this._selectedRow?.secondaryAction,
            bind: this._selectedRow?.bind,
            originalEvent: originalEvent
        });
    }

    /**
     * Clears the current selection.
     */
    _clearSelection() {
        if (!this._selectedRow) {
            return;
        }
        if (this._selectedRow._anchorTr) {
            this._selectedRow._anchorTr.classList.remove("active");
            this._selectedRow._anchorTr.removeAttribute("aria-selected");
        }
        this._selectedRow = null;
    }

    // ------------------------------------------------------------------ keyboard

    /**
     * Handles host-level keyboard shortcuts when the table or one of its rows has focus.
     * @param {KeyboardEvent} e
     */
    _onHostKeyDown(e) {
        // ignore keys typed into form controls inside cells
        const tgt = e.target;
        if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.tagName === "SELECT" || tgt.isContentEditable)) {
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                this._moveSelection(1);
                break;
            case "ArrowUp":
                e.preventDefault();
                this._moveSelection(-1);
                break;
            case "Home":
                e.preventDefault();
                this._moveSelectionEdge("first");
                break;
            case "End":
                e.preventDefault();
                this._moveSelectionEdge("last");
                break;
            case "Enter":
            case " ":
                if (this._selectedRow) {
                    e.preventDefault();
                    this._triggerPrimaryAction(this._selectedRow);
                }
                break;
            case "Escape":
                if (this._selectedRow) {
                    e.preventDefault();
                    this._clearSelection();
                    this._dispatch(webexpress?.webui?.Event?.SELECT_ROW_EVENT, {
                        sender: this._element,
                        row: null,
                        rowId: null,
                        originalEvent: e
                    });
                }
                break;
        }
    }

    /**
     * Moves selection up or down within the visible row sequence.
     * @param {number} delta - +1 or -1.
     */
    _moveSelection(delta) {
        const flat = this._visibleRowsFlat();
        if (flat.length === 0) {
            return;
        }
        const idx = this._selectedRow ? flat.indexOf(this._selectedRow) : -1;
        const nextIdx = idx < 0
            ? (delta > 0 ? 0 : flat.length - 1)
            : Math.max(0, Math.min(flat.length - 1, idx + delta));
        this._selectAndScrollIntoView(flat[nextIdx]);
    }

    /**
     * Moves selection to the first or last visible row.
     * @param {"first"|"last"} edge
     */
    _moveSelectionEdge(edge) {
        const flat = this._visibleRowsFlat();
        if (flat.length === 0) {
            return;
        }
        this._selectAndScrollIntoView(edge === "first" ? flat[0] : flat[flat.length - 1]);
    }

    /**
     * Selects a row and scrolls its anchor element into view.
     * @param {Object} row
     */
    _selectAndScrollIntoView(row) {
        if (!row) {
            return;
        }
        this._selectRowInternal(row, null);
        const tr = row._anchorTr;
        if (tr && typeof tr.scrollIntoView === "function") {
            tr.scrollIntoView({ block: "nearest" });
        }
    }

    /**
     * Returns all visible rows in display order, expanding only opened tree nodes.
     * @returns {Array<Object>}
     */
    _visibleRowsFlat() {
        const out = [];
        const walk = (rows) => {
            for (const r of rows) {
                out.push(r);
                // keyboard navigation must match the rendered rows, so the
                // tree gate of the reorderable subclass applies here as well
                if (this._treeEnabled !== false && r.children?.length && r.expanded) {
                    walk(r.children);
                }
            }
        };
        walk(this._rows);
        return out;
    }

    /**
     * Recalculates the _hasOptions flag based on rows and global options.
     */
    _recalculateHasOptions() {
        if (this._options && this._options.length > 0) {
            this._hasOptions = true;
            return;
        }
        const hasRowOptions = (rows) => {
            for (const r of rows) {
                if (r.options?.length > 0) {
                    return true;
                }
                if (r.children && hasRowOptions(r.children)) {
                    return true;
                }
            }
            return false;
        };
        this._hasOptions = hasRowOptions(this._rows);
    }

    // ------------------------------------------------------------------ render

    /**
     * Render the table using microtask batching.
     */
    render() {
        if (this._renderScheduled) {
            return;
        }
        this._renderScheduled = true;

        queueMicrotask(() => {
            this._renderScheduled = false;
            this._renderNow();
        });
    }

    /**
     * Performs a full render pass. Subclasses extend the pass through the
     * hooks (_buildLeadingHeaderCells, _buildLeadingCells, _renderActionsHeader,
     * _afterRenderDom) instead of overriding the pipeline, so batching and the
     * change-flash diff stay in one place.
     */
    _renderNow() {
        const currentStates = this._collectCurrentRowStates();
        const changedIds = new Set();
        const newIds = new Set();

        const shouldHighlight = this._initialized
            && this._highlightChanges
            && !this._suppressFlashOnce
            && this._prevRowState.size > 0;

        if (shouldHighlight) {
            for (const entry of currentStates) {
                const oldSig = this._prevRowState.get(entry.key);
                if (oldSig === undefined) {
                    newIds.add(entry.key);
                } else if (oldSig !== entry.signature) {
                    changedIds.add(entry.key);
                }
            }
        }

        this._isTree = this._detectTree(this._rows);

        this._rebuildColumnIndexCache();
        this._syncColumnWidths();

        this._renderColumns();
        this._renderRows(changedIds, newIds);
        this._renderFooter();
        this._attachColumnResizers();
        this._afterRenderDom();

        this._suppressFlashOnce = false;
        this._updateSnapshot(currentStates);
        this._initialized = true;

        this._autoSelectFirstRow();
    }

    /**
     * Hook for subclasses to bind row-level interactions after the DOM was
     * rebuilt, for example drag handles.
     */
    _afterRenderDom() { }

    /**
     * Auto-selects the first row on the very first render when the table is
     * selectable. The primary action of the row is triggered afterwards so a
     * paired panel (e.g. preview / detail view) can populate itself without
     * requiring an explicit user click. Skipped while a data load is pending
     * (_isLoading is owned by REST-backed subclasses), so placeholder rows
     * are never auto-selected.
     */
    _autoSelectFirstRow() {
        if (!this._selectable || this._autoSelected || this._isLoading || this._selectedRow !== null || this._rows.length === 0) {
            return;
        }
        this._autoSelected = true;
        const firstRow = this._rows[0];
        this._selectRowInternal(firstRow, null);
        this._triggerPrimaryAction(firstRow);
    }

    /**
     * Triggers the row's `data-wx-primary-action` via the central Actions
     * registry so callers don't have to dispatch synthetic clicks.
     * @param {Object} row - Data row whose anchor element carries the action.
     */
    _triggerPrimaryAction(row) {
        const el = row?._anchorTr;
        if (!el) {
            return;
        }
        const actionName = el.getAttribute("data-wx-primary-action");
        if (!actionName) {
            return;
        }
        const actionDef = webexpress?.webui?.Actions?.get?.(actionName);
        if (!actionDef || typeof actionDef.execute !== "function") {
            return;
        }
        try {
            actionDef.execute(el, "primary", this, null);
        } catch (e) {
            console.error("table: primary action execute failed", e);
        }
    }

    /**
     * Render header row structure.
     */
    _renderColumns() {
        const headFragment = document.createDocumentFragment();
        const headRow = document.createElement("div");
        headRow.className = "wx-grid-row wx-table-header";
        headRow.setAttribute("role", "row");
        headFragment.appendChild(headRow);

        if (!this._suppressHeaders) {
            this._buildLeadingHeaderCells(headRow);

            for (const col of this._columns) {
                if (!col.visible) {
                    continue;
                }
                headRow.appendChild(this._buildHeaderCell(col));
            }

            if (this._hasActionsColumn()) {
                this._renderActionsHeader(headRow);
            }
        }

        this._head.replaceChildren(headFragment);
    }

    /**
     * Hook for subclasses to prepend non-data header cells, for example a
     * drag-handle column.
     * @param {HTMLElement} headRow - Header row element.
     */
    _buildLeadingHeaderCells(headRow) { }

    /**
     * Renders the trailing actions header cell. The base control renders an
     * empty cell; subclasses may add controls such as a column manager.
     * @param {HTMLElement} headRow - Header row element.
     */
    _renderActionsHeader(headRow) {
        const th = document.createElement("div");
        th.className = "wx-grid-header-cell wx-table-actions";
        th.setAttribute("role", "columnheader");
        headRow.appendChild(th);
    }

    /**
     * Determines whether the trailing actions column is rendered. Subclasses
     * may widen the condition, for example when column management is enabled.
     * @returns {boolean}
     */
    _hasActionsColumn() {
        return this._hasOptions;
    }

    /**
     * Builds a single column header cell.
     * @param {Object} col
     * @returns {HTMLElement}
     */
    _buildHeaderCell(col) {
        const th = document.createElement("div");
        th.className = "wx-grid-header-cell wx-col-header";
        th.setAttribute("role", "columnheader");
        th.dataset.columnId = col.id;

        if (col.color) {
            th.classList.add(col.color);
        }
        if (col.sort) {
            th.classList.add(col.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc");
        }

        const inner = document.createElement("div");
        inner.className = "wx-col-inner";
        if (col.icon) {
            const i = document.createElement("i");
            i.className = col.icon;
            inner.appendChild(i);
        }
        if (col.image) {
            const img = document.createElement("img");
            img.className = "wx-icon";
            img.src = col.image;
            img.loading = "lazy";
            inner.appendChild(img);
        }
        inner.appendChild(document.createTextNode(col.label));
        th.appendChild(inner);
        return th;
    }

    /**
     * Render body rows.
     * @param {Set<string>} changedIds - Keys of modified rows.
     * @param {Set<string>} newIds - Keys of new rows.
     */
    _renderRows(changedIds, newIds) {
        const fragment = document.createDocumentFragment();
        const renderList = (rows, depth) => {
            for (const r of rows) {
                this._addRow(r, depth, fragment, changedIds, newIds);
                // _treeEnabled is owned by the reorderable subclass; undefined means enabled
                if (this._treeEnabled !== false && r.children?.length && r.expanded) {
                    renderList(r.children, depth + 1);
                }
            }
        };
        if (this._rows.length) {
            renderList(this._rows, 0);
        }
        this._body.replaceChildren(fragment);
    }

    /**
     * Create and append a single row div.
     * @param {Object} row - Row data object.
     * @param {number} depth - Hierarchy depth.
     * @param {DocumentFragment} fragment - Target fragment.
     * @param {Set<string>} changedIds - Keys with changed signatures.
     * @param {Set<string>} newIds - Keys for new rows.
     */
    _addRow(row, depth, fragment, changedIds, newIds) {
        const tr = document.createElement("div");
        tr.className = "wx-grid-row";
        tr.setAttribute("role", "row");

        if (row.color) {
            tr.classList.add(row.color);
        }
        if (row.class) {
            tr.classList.add(...row.class.split(/\s+/).filter(Boolean));
        }
        if (row.style) {
            tr.style.cssText = row.style;
        }

        // apply action attributes (primary + secondary)
        this._applyActionAttrs(tr, "primary", row.primaryAction);
        this._applyActionAttrs(tr, "secondary", row.secondaryAction);

        // apply selection state
        if (this._selectedRow === row) {
            tr.classList.add("active");
            tr.setAttribute("aria-selected", "true");
        }

        const key = this._getRowKey(row);
        if (key) {
            if (changedIds.has(key)) {
                tr.classList.add("wx-change-flash");
            } else if (newIds.has(key)) {
                tr.classList.add("wx-new-flash");
            }
        }

        tr._dataRowRef = row;
        row._anchorTr = tr;
        row._depth = depth;

        this._buildLeadingCells(tr, row);

        let firstVisible = true;

        for (let i = 0; i < this._columns.length; i++) {
            const colDef = this._columns[i];
            if (!colDef.visible) {
                continue;
            }
            tr.appendChild(this._buildBodyCell(row, colDef, row.cells[i], firstVisible));
            firstVisible = false;
        }

        if (this._hasActionsColumn()) {
            tr.appendChild(this._buildOptionsCell(row));
        }

        if (this._isTree && this._treeEnabled !== false) {
            this._injectTreeToggle(tr, row, depth);
        }
        fragment.appendChild(tr);
    }

    /**
     * Hook for subclasses to prepend non-data cells to a row, for example a
     * drag handle. Leading cells must be mirrored by _gridLeadingParts so the
     * grid template stays aligned.
     * @param {HTMLElement} tr - Row element.
     * @param {Object} row - Row data object.
     */
    _buildLeadingCells(tr, row) { }

    /**
     * Builds a single body cell.
     * @param {Object} row
     * @param {Object} colDef
     * @param {Object} cell
     * @param {boolean} firstVisible
     * @returns {HTMLElement}
     */
    _buildBodyCell(row, colDef, cell, firstVisible) {
        const td = document.createElement("div");
        td.className = "wx-grid-cell";
        td.setAttribute("role", "gridcell");

        if (!cell) {
            td.textContent = "";
            return td;
        }

        if (cell.color) {
            td.classList.add(cell.color);
        }
        if (cell.class) {
            td.classList.add(...cell.class.split(/\s+/).filter(Boolean));
        }
        if (cell.style) {
            td.style.cssText += (td.style.cssText ? "; " : "") + cell.style;
        }

        let content = this._renderCell(row, colDef, cell, firstVisible);

        // markup has to become nodes before the row anchor wraps it, otherwise the anchor
        // would take it as a text node and the tags would show up verbatim
        if (cell.html === true && !(content instanceof Node)) {
            const parser = document.createElement("template");
            parser.innerHTML = String(content ?? "");
            content = parser.content;
        }

        // the row decorates its first visible cell; every other cell may carry a link or an
        // icon of its own. Only one of the two wraps a given cell, so the anchors never nest
        if (firstVisible && (row.uri || row.icon || row.image)) {
            content = this._wrapWithAnchor(row, content);
        } else if (cell.uri || cell.icon || cell.image) {
            content = this._wrapWithAnchor(cell, content);
        }

        if (content instanceof Node) {
            td.appendChild(content);
        } else {
            td.textContent = String(content ?? "");
        }
        return td;
    }

    /**
     * Wraps cell content in an anchor or span carrying the decoration of its source.
     * @param {Object} source - The row or the cell that declares uri, target, icon or image.
     * @param {string|Node} content
     * @returns {HTMLElement}
     */
    _wrapWithAnchor(source, content) {
        const wrap = source.uri ? document.createElement("a") : document.createElement("span");
        wrap.className = "wx-cell-content";
        if (source.uri) {
            wrap.href = source.uri;
            if (source.target) {
                wrap.target = source.target;
            }
            wrap.rel = "noopener noreferrer";
        }
        if (source.image) {
            const img = document.createElement("img");
            img.className = "wx-icon wx-icon-large";
            img.src = source.image;
            img.alt = "";
            img.loading = "lazy";
            wrap.appendChild(img);
        }
        if (source.icon) {
            const icon = document.createElement("i");
            icon.className = source.icon + " wx-icon-large";
            wrap.appendChild(icon);
        }
        if (content instanceof Node) {
            wrap.appendChild(content);
        } else {
            wrap.appendChild(document.createTextNode(String(content ?? "")));
        }
        return wrap;
    }

    /**
     * Builds the options dropdown cell for a row.
     * @param {Object} row
     * @returns {HTMLElement}
     */
    _buildOptionsCell(row) {
        const tdOpt = document.createElement("div");
        tdOpt.className = "wx-grid-cell wx-table-actions";
        tdOpt.setAttribute("role", "gridcell");

        const effectiveOptions = (row.options && row.options.length) ? row.options : this._options;
        if (effectiveOptions && effectiveOptions.length > 0) {
            const div = document.createElement("div");
            div.dataset.icon = this._iconClass("fas fa-ellipsis-h", "wx-icon-light-more");
            div.dataset.size = "btn-sm";
            div.dataset.border = "false";
            tdOpt.appendChild(div);
            new webexpress.webui.DropdownCtrl(div).items = effectiveOptions;
        }
        return tdOpt;
    }

    /**
     * Render cell content using renderer templates if available.
     * @param {Object} row - Row data.
     * @param {Object} colDef - Column definition.
     * @param {Object} cell - Cell data.
     * @param {boolean} isFirstVisible - Is first visible column.
     * @returns {string|Node} - Rendered content.
     */
    _renderCell(row, colDef, cell, isFirstVisible) {
        const type = cell?.type || colDef.rendererType;
        const tmpl = type ? webexpress.webui.TableTemplates.get(type) : null;

        if (tmpl) {
            try {
                const opts = Object.assign({}, tmpl.options, colDef.rendererOptions || {});
                return tmpl.fn(cell?.content, this, row, cell, colDef.name || colDef.id, opts);
            } catch (e) {
                console.error("renderer error", e);
                return this._i18n("webexpress.webui:table.renderer.error", "Error");
            }
        }
        return cell?.content ?? "";
    }

    /**
     * Render footer row.
     */
    _renderFooter() {
        if (!this._footer.length) {
            this._foot?.remove();
            this._foot = null;
            return;
        }

        if (!this._foot) {
            this._foot = document.createElement("div");
            this._foot.className = "wx-table-footer-group";
            this._foot.setAttribute("role", "rowgroup");
            this._table.appendChild(this._foot);
        }

        this._foot.textContent = "";
        const tr = document.createElement("div");
        tr.className = "wx-grid-row wx-table-footer";
        tr.setAttribute("role", "row");

        for (let i = 0; i < this._columns.length; i++) {
            const col = this._columns[i];
            if (!col.visible) {
                continue;
            }

            const td = document.createElement("div");
            td.className = "wx-grid-cell";
            td.setAttribute("role", "gridcell");
            if (this._footer[i] != null) {
                td.innerHTML = this._footer[i];
            }
            tr.appendChild(td);
        }
        this._foot.appendChild(tr);
    }

    // ------------------------------------------------------------------ sorting

    /**
     * Handle sort interaction.
     * @param {HTMLElement} headerCell - Target header div.
     * @param {Object} col - Column descriptor.
     */
    _handleSortClick(headerCell, col) {
        const next = col.sort === "asc" ? "desc" : (col.sort === "desc" ? null : "asc");
        for (const c of this._columns) {
            c.sort = null;
        }
        col.sort = next;

        if (next) {
            this.orderRows(col);
        } else {
            this.render();
        }

        this._dispatch(webexpress.webui.Event.TABLE_SORT_EVENT, {
            sender: this._element,
            columnId: col.id,
            sortDirection: col.sort
        });
    }

    /**
     * Sort rows by a specific column.
     * @param {Object} column - Sorting column descriptor.
     */
    orderRows(column) {
        const idx = column.index;
        if (idx === undefined) {
            return;
        }

        const dir = column.sort === "asc" ? 1 : -1;
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

        const decorated = this._rows.map((row, i) => ({
            row,
            i,
            // rich cells hold markup in content, so the flattened text is the sortable value
            key: row.cells[idx]?.text ?? row.cells[idx]?.content ?? ""
        }));
        decorated.sort((a, b) => {
            const cmp = collator.compare(a.key, b.key);
            return cmp === 0 ? a.i - b.i : cmp * dir;
        });

        this._rows = decorated.map(d => d.row);
        this.render();
    }

    // ------------------------------------------------------------------ parsing

    /**
     * Parse column definitions with extended width properties.
     * @param {HTMLElement} div - Columns container element.
     * @returns {Array<Object>} - Parsed columns.
     */
    _parseColumns(div) {
        if (!div) {
            return [];
        }
        if (div.dataset.color) {
            this._head.classList.add(div.dataset.color);
        }
        this._suppressHeaders = div.dataset.suppressHeaders === "true";

        return Array.from(div.children).map((el, idx) => {
            const typeEl = el.querySelector(":scope > [data-type], :scope > template[data-type]");
            const rendererType = typeEl?.dataset.type || el.dataset.type || null;
            const rendererOptions = typeEl ? Object.assign({}, typeEl.dataset) : Object.assign({}, el.dataset);

            if (typeEl) {
                const src = (typeEl.tagName === "TEMPLATE") ? typeEl.content.children : typeEl.children;
                if (src.length) {
                    rendererOptions.children = Array.from(src);
                }
            }

            return {
                id: el.id || `col_${idx}`,
                index: idx,
                label: el.dataset.label || "",
                name: el.dataset.objectName || null,
                icon: el.dataset.icon || null,
                image: el.dataset.image || null,
                color: el.dataset.color || null,
                width: el.dataset.width || (el.getAttribute("width") ? parseInt(el.getAttribute("width"), 10) : null),
                minWidth: el.dataset.minWidth || null,
                resizable: el.dataset.resizable !== "false",
                sort: el.dataset.sort || null,
                visible: el.dataset.visible !== "false",
                rendererType,
                rendererOptions
            };
        });
    }

    /**
     * Parse rows from config.
     * @param {NodeList} divs - Row elements.
     * @param {Object} [parent=null] - Parent row.
     * @returns {Array<Object>} - Parsed rows.
     */
    _parseRows(divs, parent = null) {
        const rows = [];
        for (const div of divs) {
            if (!div.classList.contains("wx-table-row")) {
                continue;
            }

            const row = {
                id: div.id || null,
                class: div.className,
                style: div.getAttribute("style"),
                color: div.dataset.color,
                image: div.dataset.image,
                icon: div.dataset.icon,
                uri: div.dataset.uri || div.dataset.url,
                restApi: div.dataset.restApi || div.dataset.editApi,
                target: div.dataset.target,

                primaryAction: this._extractDatasetPrefix(div.dataset, "wxPrimary"),
                secondaryAction: this._extractDatasetPrefix(div.dataset, "wxSecondary"),

                cells: [],
                options: null,
                children: [],
                parent,
                expanded: div.dataset.expanded !== "false" && div.dataset.collapsed !== "true"
            };

            const childRows = [];
            for (const child of div.children) {
                if (child.classList.contains("wx-table-row")) {
                    childRows.push(child);
                    this._isTree = true;
                } else if (child.classList.contains("wx-table-options")) {
                    row.options = this._parseOptions(child);
                } else if (!child.classList.contains("wx-table-footer")) {
                    // a cell panel carries controls instead of a value, so its markup is kept
                    // verbatim; the flattened text is retained alongside it because sorting
                    // needs a comparable value rather than markup
                    const rich = child.classList.contains("wx-table-cell-panel");
                    const text = child.textContent.trim();
                    row.cells.push({
                        content: rich ? child.innerHTML : text,
                        text: text,
                        html: rich,
                        id: child.id,
                        // a rich cell keeps its classes on the panel element inside the markup;
                        // copying them onto the grid cell too would apply the panel layout twice
                        class: rich ? null : child.className,
                        style: child.getAttribute("style"),
                        color: child.dataset.color,
                        icon: child.dataset.icon,
                        image: child.dataset.image,
                        uri: child.dataset.uri || child.dataset.url,
                        target: child.dataset.target,
                        objectId: child.dataset.objectId,
                        type: child.dataset.type
                    });
                }
            }
            if (childRows.length) {
                row.children = this._parseRows(childRows, row);
            }
            rows.push(row);
        }
        return rows;
    }

    /**
     * Extracts every dataset entry that begins with the given camel-case prefix
     * into a key→value map, normalising "true"/"false" strings to booleans.
     * @param {DOMStringMap} dataset
     * @param {string} prefix - e.g. "wxPrimary".
     * @returns {Object}
     */
    _extractDatasetPrefix(dataset, prefix) {
        const out = {};
        const cut = prefix.length;
        for (const [k, v] of Object.entries(dataset)) {
            if (!k.startsWith(prefix) || k.length <= cut) {
                continue;
            }
            const propKey = k.slice(cut).replace(/^./, c => c.toLowerCase());
            out[propKey] = v === "true" ? true : v === "false" ? false : v;
        }
        return out;
    }

    /**
     * Parse dropdown options.
     * Both label fields are filled: the dropdown menu reads "text", while the
     * sibling controls read "content", so neither path renders an empty entry.
     * Action attributes are taken over as a whole rather than by a fixed key
     * list, because an action defines its own payload (confirm text, method,
     * ...) that the registry reads back off the rendered element.
     * @param {HTMLElement} div - Options container.
     * @returns {Array<Object>} - Parsed options.
     */
    _parseOptions(div) {
        if (!div) {
            return [];
        }
        return Array.from(div.children).map((el) => {
            const cls = el.classList;
            if (cls.contains("wx-dropdown-divider") || cls.contains("wx-dropdownbutton-divider")) {
                return { type: "divider" };
            }
            if (cls.contains("wx-dropdown-header")) {
                const label = el.textContent.trim();
                return { type: "header", text: label, content: label, icon: el.dataset.icon };
            }

            const ds = el.dataset;
            const label = el.textContent.trim();
            return {
                text: label,
                content: label,
                id: el.id,
                icon: ds.icon,
                image: ds.image,
                uri: ds.uri || ds.url,
                target: ds.target,
                tooltip: ds.tooltip,
                color: ds.color,
                modal: ds.modal,
                disabled: el.hasAttribute("disabled"),

                primaryAction: this._extractDatasetPrefix(ds, "wxPrimary"),
                secondaryAction: this._extractDatasetPrefix(ds, "wxSecondary"),
                bind: {
                    source: div.dataset.wxSource || null
                }
            };
        });
    }

    /**
     * Parse footer configuration.
     * @param {HTMLElement} div - Footer container.
     * @returns {Array<string>} - Footer cell contents.
     */
    _parseFooter(div) {
        return div ? Array.from(div.children).map(c => c.innerHTML.trim()) : [];
    }

    // ------------------------------------------------------------------ tree

    /**
     * Inject tree toggle control into the first data column.
     * @param {HTMLElement} tr - Row element.
     * @param {Object} row - Row data.
     * @param {number} depth - Hierarchy depth.
     */
    _injectTreeToggle(tr, row, depth) {
        const firstCell = Array.from(tr.children).find(cell =>
            cell.classList.contains("wx-grid-cell") && !cell.classList.contains("wx-table-drag-handle")
        );
        if (!firstCell) {
            return;
        }

        const wrapper = document.createElement("span");
        wrapper.className = "wx-tree";

        const indent = document.createElement("span");
        indent.className = "wx-tree-indent";
        indent.style.width = `${depth * 1.2}rem`;
        wrapper.appendChild(indent);

        if (row.children?.length) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "wx-tree-toggle";
            btn.setAttribute("aria-expanded", String(row.expanded));

            const icon = document.createElement("span");
            icon.className = "wx-tree-indicator-angle" + (row.expanded ? " wx-tree-expand" : "");
            btn.appendChild(icon);

            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                row.expanded = !row.expanded;
                this.render();
            });
            wrapper.appendChild(btn);
        } else {
            const dummy = document.createElement("span");
            dummy.className = "wx-tree-toggle-placeholder";
            wrapper.appendChild(dummy);
        }

        while (firstCell.firstChild) {
            wrapper.appendChild(firstCell.firstChild);
        }
        firstCell.appendChild(wrapper);
    }

    // ------------------------------------------------------------------ helpers

    /**
     * Helper to find a row in the flat structure or hierarchy.
     * @param {string} id - Row ID.
     * @returns {Object|null} - Row object.
     */
    _findRowById(id) {
        const info = this._findRowAndParent(id);
        return info ? info.row : null;
    }

    /**
     * Rebuilds the internal column index cache.
     */
    _rebuildColumnIndexCache() {
        this._colIndexCache.clear();
        for (let i = 0; i < this._columns.length; i++) {
            this._colIndexCache.set(this._columns[i].id, i);
        }
    }

    /**
     * Constructs the CSS Grid Template string.
     */
    _syncColumnWidths() {
        const parts = [];
        const visibleCols = this._columns.filter(c => c.visible);
        const lastVisibleId = visibleCols.length > 0 ? visibleCols[visibleCols.length - 1].id : null;
        const minDefault = `${webexpress.webui.TableCtrl.MIN_COL_WIDTH}px`;

        for (const c of this._columns) {
            if (!c.visible) {
                continue;
            }

            if (c.id === lastVisibleId) {
                const min = c.minWidth || minDefault;
                parts.push(`minmax(${min}, 1fr)`);
                continue;
            }

            let val = "1fr";
            if (c.width !== null && c.width !== "") {
                const w = String(c.width);
                if (w === "auto") {
                    val = "auto";
                } else if (/(?:%|fr|rem|px)$/.test(w)) {
                    val = w;
                } else if (!isNaN(Number(w))) {
                    val = `${w}px`;
                } else {
                    val = w;
                }
            }

            if (c.minWidth) {
                val = `minmax(${c.minWidth}, ${val})`;
            } else if (val === "1fr" || val === "auto") {
                val = `minmax(${minDefault}, ${val})`;
            }
            parts.push(val);
        }

        if (this._hasOptions) {
            parts.push("1.5rem");
        }

        const template = parts.length > 0 ? parts.join(" ") : "auto";
        this._table.style.setProperty("--wx-grid-template", template);
    }

    /**
     * Collects the current state of all rows.
     * @returns {Array<{ key: string, signature: string }>} - Row states.
     */
    _collectCurrentRowStates() {
        const list = [];
        const stack = [...this._rows];
        while (stack.length) {
            const r = stack.pop();
            const key = this._getRowKey(r);
            if (key) {
                list.push({ key, signature: r.cells.map(c => c.content).join("|") });
            }
            if (r.children) {
                stack.push(...r.children);
            }
        }
        return list;
    }

    /**
     * Returns a stable key for a row.
     * @param {Object} row - The row object.
     * @returns {string} - The resolved row key.
     */
    _getRowKey(row) {
        return row.id || (row._uid || (row._uid = this._generateUid()));
    }

    /**
     * Generates a unique row identifier with a defensive fallback for
     * environments without crypto.randomUUID.
     * @returns {string}
     */
    _generateUid() {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return `r_${crypto.randomUUID()}`;
        }
        return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }

    /**
     * Updates the internal snapshot.
     * @param {Array<{ key: string, signature: string }>} states
     */
    _updateSnapshot(states) {
        this._prevRowState.clear();
        for (const s of states) {
            this._prevRowState.set(s.key, s.signature);
        }
    }

    /**
     * Finds a row by ID and returns both the row and its parent.
     * @param {string} id - The row ID.
     * @returns {{ row: Object, parent: Object|null } | null} - Result.
     */
    _findRowAndParent(id) {
        let found = null;
        const walk = (rows, parent) => {
            for (const r of rows) {
                if (r.id === id) {
                    found = { row: r, parent };
                    return true;
                }
                if (r.children && walk(r.children, r)) {
                    return true;
                }
            }
            return false;
        };
        walk(this._rows, null);
        return found;
    }

    /**
     * Removes a row recursively.
     * @param {string} id - The ID.
     * @param {Array} rows - The row array.
     * @returns {boolean} - Success.
     */
    _removeRowRecursive(id, rows) {
        if (!Array.isArray(rows)) {
            return false;
        }
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (r.id === id) {
                rows.splice(i, 1);
                return true;
            }
            if (r.children && this._removeRowRecursive(id, r.children)) {
                return true;
            }
        }
        return false;
    }

    // ------------------------------------------------------------------ resizing

    /**
     * Attach column resizer handles.
     */
    _attachColumnResizers() {
        if (!this._columnResizeEnabled) {
            return;
        }
        const headers = this._head.querySelectorAll(".wx-col-header");

        const visibleCols = this._columns.filter(c => c.visible);
        const lastVisibleId = visibleCols.length > 0 ? visibleCols[visibleCols.length - 1].id : null;

        headers.forEach((th) => {
            const colId = th.dataset.columnId;
            if (!colId || !this._colIndexCache.has(colId) || colId === lastVisibleId) {
                return;
            }

            const index = this._colIndexCache.get(colId);
            const column = this._columns[index];
            if (column && column.resizable === false) {
                return;
            }

            let handle = th.querySelector(":scope > .wx-col-resizer");
            if (handle) {
                return;
            }

            handle = document.createElement("span");
            handle.className = "wx-col-resizer";
            th.appendChild(handle);

            handle.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this._beginColumnResize(e, th);
            });
            handle.addEventListener("touchstart", (e) => {
                e.stopPropagation();
                this._beginColumnResize(e, th);
            }, { passive: true });
            handle.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); });
            handle.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                e.preventDefault();
                this._autoSizeColumn(index);
            });
        });
    }

    /**
     * Autosize a specific column.
     * @param {number} index - Column index.
     */
    _autoSizeColumn(index) {
        const column = this._columns[index];
        if (!column || column.visible === false || column.resizable === false) {
            return;
        }

        const headers = this._head.querySelectorAll(".wx-col-header");
        let headerTh = null;
        let domIndex = -1;

        for (let i = 0; i < headers.length; i++) {
            if (headers[i].dataset.columnId === column.id) {
                domIndex = i;
                headerTh = headers[i];
                break;
            }
        }
        if (!headerTh) {
            return;
        }

        let maxWidth = 0;
        const inner = headerTh.querySelector(".wx-col-inner") || headerTh;

        // measure header
        const thStyle = getComputedStyle(headerTh);
        const headerWidth = Math.ceil(inner.getBoundingClientRect().width)
            + parseFloat(thStyle.paddingLeft) + parseFloat(thStyle.paddingRight)
            + parseFloat(thStyle.borderLeftWidth) + parseFloat(thStyle.borderRightWidth);

        maxWidth = Math.max(maxWidth, headerWidth);

        // measure cells
        const rows = this._body.querySelectorAll(".wx-grid-row");
        for (let r = 0; r < rows.length; r++) {
            const td = rows[r].children[domIndex];
            if (!td) {
                continue;
            }
            const tdStyle = getComputedStyle(td);
            const contentW = Math.max(td.scrollWidth, Math.ceil(td.getBoundingClientRect().width));
            const totalW = contentW + parseFloat(tdStyle.borderLeftWidth) + parseFloat(tdStyle.borderRightWidth);
            if (totalW > maxWidth) {
                maxWidth = totalW;
            }
        }

        column.width = Math.max(Math.ceil(maxWidth) + webexpress.webui.TableCtrl.AUTOSIZE_BUFFER, webexpress.webui.TableCtrl.MIN_COL_WIDTH);

        this._syncColumnWidths();
        this._schedulePersistIfAvailable();
    }

    /**
     * Start column resize interaction.
     * @param {Event} evt - Triggering event.
     * @param {HTMLElement} th - Column header element.
     */
    _beginColumnResize(evt, th) {
        this._isResizing = true;
        const colId = th.dataset.columnId;
        const index = this._colIndexCache.get(colId);
        const column = this._columns[index];

        if (!column || !column.visible || column.resizable === false) {
            this._isResizing = false;
            return;
        }

        const startWidth = Math.max(parseInt(column.width || th.getBoundingClientRect().width), webexpress.webui.TableCtrl.MIN_COL_WIDTH);
        const pointX = (ev) => (ev.touches && ev.touches.length) ? ev.touches[0].clientX : ev.clientX;
        const startX = pointX(evt);
        const isRtl = getComputedStyle(this._table).direction === "rtl";

        const move = (e) => {
            e.preventDefault();
            const dx = pointX(e) - startX;
            const signed = isRtl ? -dx : dx;
            const newWidth = Math.max(startWidth + signed, webexpress.webui.TableCtrl.MIN_COL_WIDTH);
            const rounded = Math.round(newWidth);
            if (column.width !== rounded) {
                column.width = rounded;
                this._syncColumnWidths();
            }
        };

        const up = () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            document.removeEventListener("touchmove", move);
            document.removeEventListener("touchend", up);
            setTimeout(() => { this._isResizing = false; }, 0);
            this._schedulePersistIfAvailable();
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
        document.addEventListener("touchmove", move, { passive: false });
        document.addEventListener("touchend", up);
    }

    /**
     * Schedule state persistence if supported.
     */
    _schedulePersistIfAvailable() {
        if (typeof this._schedulePersist === "function") {
            try { this._schedulePersist(); } catch (_) { /* ignore */ }
        }
    }

    /**
     * Detect whether any row has children.
     * @param {Array<Object>} rows - Row list.
     * @returns {boolean} - True if a tree structure exists.
     */
    _detectTree(rows) {
        if (!Array.isArray(rows)) {
            return false;
        }
        const stack = [...rows];
        while (stack.length) {
            const r = stack.pop();
            if (r?.children?.length > 0) {
                return true;
            }
            if (r?.children) {
                stack.push(...r.children);
            }
        }
        return false;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-table", webexpress.webui.TableCtrl);