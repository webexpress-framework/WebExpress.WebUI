/**
 * Table controller providing declarative parsing, sorting, rendering, and optional column resizing.
 *
 * The header, the rows and the footer are rendered from the state: the columns, the rows,
 * the footer, the selected row and the rows a refresh found changed. Rows are keyed, so a
 * sort, an expand or a selection moves and patches them instead of rebuilding them. The
 * content of a cell - the output of a cell template, which may be a control of its own -
 * is built into the cell and kept until the cell or what it shows changes.
 *
 * The rows and the columns are records the control, its subclasses and the cell templates
 * change in place; render() renders them again and flashes the rows whose content changed.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.TABLE_SORT_EVENT
 * - webexpress.webui.Event.SELECT_ROW_EVENT
 */
webexpress.webui.TableCtrl = class extends webexpress.webui.StateCtrl {

    static MIN_COL_WIDTH = 30;
    static AUTOSIZE_BUFFER = 8;
    // the length of the wx-change-flash animation in webexpress.webui.table.css
    static FLASH_DURATION = 1000;
    static IGNORED_DATA_ATTRS = ["data-color", "data-border", "data-striped", "data-selectable"];

    // feature flags
    _isTree = false;
    _suppressHeaders = false;
    _highlightChanges = true;
    _suppressFlashOnce = false;
    _columnResizeEnabled = true;
    _hasOptions = false;
    _selectable = false;
    _headColor = null;

    // interaction state
    _isResizing = false;
    _initialized = false;
    _autoSelected = false;

    // caches
    _prevRowState = new Map();
    _colIndexCache = new Map();

    // the change marks of refreshes that were not rendered yet, and the marks rendered last
    _pendingFlash = null;
    _shownFlash = null;

    // nodes captured while rendering
    _head = null;
    _body = null;
    _foot = null;
    _headerCells = new Map();
    _rowElements = new Map();

    /**
     * Initialize controller and render initial state.
     * @param {HTMLElement} element - Host element that contains declarative configuration.
     */
    constructor(element) {
        // the table element is the render root; a subclass places elements of its own
        // beside it in the host, such as a pager or a progress bar
        const table = document.createElement("div");

        super(element, {
            renderRoot: table,
            state: {
                columns: [],
                rows: [],
                footer: [],
                options: [],
                selected: null,
                // the rows the last refresh found changed or new, by row key
                flash: null,
                revision: 0
            }
        });

        this._table = table;
        this._suppressFlashOnce = true;
        this._setupDom(element);
        this._parseConfig(element);
        this._initEventListeners();

        // a subclass renders through hooks that read what its own constructor sets up,
        // so it opens the table at the end of that constructor
        if (new.target === webexpress.webui.TableCtrl) {
            this._open();
        }
    }

    /**
     * Renders the table the first time. The rows it shows are the ones the first refresh
     * compares against, so nothing flashes for what the table was built with.
     */
    _open() {
        // the first render reads the state directly, a notification would only repeat it
        this._store.flush();
        this.mount();
        this._initialized = true;
    }

    // the model is held in the state; the accessors keep the record API the subclasses,
    // the cell templates and the hosts use

    // the cells of a row are positional, and a sort or an edit finds the cell of a column
    // through the index cache, so the cache follows every replacement of the columns
    get _columns() { return this.state.columns; }
    set _columns(value) {
        this.setState({ columns: Array.isArray(value) ? value : [] });
        this._rebuildColumnIndexCache();
    }

    get _rows() { return this.state.rows; }
    set _rows(value) { this.setState({ rows: Array.isArray(value) ? value : [] }); }

    get _footer() { return this.state.footer; }
    set _footer(value) { this.setState({ footer: Array.isArray(value) ? value : [] }); }

    get _options() { return this.state.options; }
    set _options(value) { this.setState({ options: Array.isArray(value) ? value : [] }); }

    get _selectedRow() { return this.state.selected; }
    set _selectedRow(value) { this.setState({ selected: value || null }); }

    /**
     * Applies the classes and the role of the table element from the dataset.
     * @param {HTMLElement} element - Host element.
     */
    _setupDom(element) {
        this._table.className = "wx-table";
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
        // explicit check for string "true" to enable selection. a selectable table is a
        // grid, whose rows carry a selected state and whose cells are grid cells; a plain
        // table is read as one and gets the plain cell role
        this._selectable = ds.selectable === "true";
        this._table.setAttribute("role", this._selectable ? "grid" : "table");
        this._cellRole = this._selectable ? "gridcell" : "cell";
        if (this._selectable) {
            this._table.classList.add("wx-table-selectable");
            // make the host focusable so keyboard shortcuts work without an inner element being focused
            if (!element.hasAttribute("tabindex")) {
                element.tabIndex = 0;
            }
        }
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
     * Registers the host-level keyboard shortcuts of a selectable table. The header and
     * the body listen through the view.
     */
    _initEventListeners() {
        if (this._selectable) {
            this._element.addEventListener("keydown", (e) => this._onHostKeyDown(e));
        }
    }

    // header keys (sorting): the keys a button answers to sort like a click does
    _onHeadKeyDown = (e) => {
        if (e.key !== "Enter" && e.key !== " ") {
            return;
        }
        const headerCell = e.target.closest ? e.target.closest(".wx-col-header") : null;
        if (!headerCell || e.target !== headerCell) {
            return;
        }
        const col = this._columns[this._colIndexCache.get(headerCell.dataset.columnId)];
        if (col) {
            e.preventDefault();
            this._handleSortClick(headerCell, col);
        }
    };

    _onHeadClick = (e) => {
        const headerCell = e.target.closest(".wx-col-header");
        if (!headerCell || this._isResizing) {
            return;
        }
        const idx = this._colIndexCache.get(headerCell.dataset.columnId);
        const col = idx === undefined ? null : this._columns[idx];
        if (col) {
            this._handleSortClick(headerCell, col);
        }
    };

    _onBodyClick = (e) => {
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
    };

    // body input (sync manual edits back to the internal data model)
    _onBodyInput = (e) => this._syncCellEdit(e);

    /**
     * Writes a manual edit in a cell back to the row model. The cell is resolved by the
     * column it shows, not by its position in the row, because a row may carry cells of no
     * column - the grip of a movable row, the actions - and hidden columns render none.
     * A cell template that brings an editor of its own reports the value through the save
     * event of that editor instead, so such a cell is left alone.
     * @param {Event} e - The triggering input event.
     */
    _syncCellEdit(e) {
        const cellEl = e.target.closest ? e.target.closest(".wx-grid-cell") : null;
        const columnId = cellEl ? cellEl.dataset.columnId : null;
        const rowEl = columnId ? cellEl.closest(".wx-grid-row") : null;
        if (!rowEl || !rowEl._dataRowRef || cellEl.querySelector(".wx-smart-edit")) {
            return;
        }

        const index = this._colIndexCache.get(columnId);
        const cell = index === undefined ? null : rowEl._dataRowRef.cells[index];
        if (cell) {
            this._writeCellValue(cell, this._editedValue(e.target));
        }
    }

    /**
     * Gets the value an edit left in the element it was made in: the value of a form
     * field, the text of a content editable area.
     * @param {HTMLElement} target - The element the input event was raised on.
     * @returns {string} The edited value.
     */
    _editedValue(target) {
        const field = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
        return String((field ? target.value : target.textContent) ?? "");
    }

    /**
     * Writes a value into a cell. The content is what the cell shows and the text is what
     * it sorts by, so both change together or a sort orders the row by its old value.
     * @param {Object} cell - The model cell.
     * @param {string} value - The new value.
     */
    _writeCellValue(cell, value) {
        cell.content = value;
        cell.text = value;
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
        this.render();
    }

    /**
     * Disable column resizing behavior.
     */
    disableColumnResize() {
        this._columnResizeEnabled = false;
        this.render();
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
        this.setState({ rows: rows, selected: null });
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
            label: c.label != null ? String(c.label) : (c.id || this._columnFallbackName(idx)),
            labelHtml: c.labelHtml || null,
            icon: c.icon || null,
            image: c.image || null,
            color: c.color || null,
            align: c.align || null,
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
     * Selects a row and announces it. A listener may look at the row it was told about,
     * so the selection is rendered before it is announced.
     * @param {Object} row - Data row object.
     * @param {Event|null} originalEvent - Triggering event.
     * @param {boolean} [renderNow=true] - False when called while the table renders.
     */
    _selectRowInternal(row, originalEvent, renderNow = true) {
        this._selectedRow = row;
        if (renderNow && this._mounted) {
            this._store.flush();
        }

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
        this._selectedRow = null;
        this._store.flush();
    }

    // ------------------------------------------------------------------ keyboard

    /**
     * Handles host-level keyboard shortcuts when the table or one of its rows has focus.
     * @param {KeyboardEvent} e
     */
    _onHostKeyDown(e) {
        // a key a control inside the table answered - a grip that moved its row, a header
        // that sorted - or one aimed at a button or a link belongs to that control alone;
        // the shortcuts of the table would act on the selected row a second time
        const tgt = e.target;
        if (e.defaultPrevented || (tgt && tgt.closest && tgt.closest("button, a, [role=\"button\"]"))) {
            return;
        }
        // ignore keys typed into form controls inside cells
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
     * Renders the table again, on the next microtask together with every other change of
     * the same turn. The rows are compared with the last refresh, so a row whose content
     * changed flashes - which is why a caller that changed the records in place calls this.
     */
    render() {
        const states = this._collectCurrentRowStates();
        const flash = {};

        const shouldHighlight = this._initialized
            && this._highlightChanges
            && !this._suppressFlashOnce
            && this._prevRowState.size > 0;

        if (shouldHighlight) {
            for (const entry of states) {
                const oldSig = this._prevRowState.get(entry.key);
                if (oldSig === undefined) {
                    flash[entry.key] = "new";
                } else if (oldSig !== entry.signature) {
                    flash[entry.key] = "change";
                }
            }
        }

        this._suppressFlashOnce = false;
        this._updateSnapshot(states);

        // the marks of several refreshes before one render add up rather than replace
        this._pendingFlash = Object.assign(this._pendingFlash || {}, flash);
        this.setState({ revision: this.state.revision + 1, flash: this._pendingFlash });
    }

    /**
     * Produces the view of a state; the public render() is the refresh the hosts call.
     * @param {object} state - The state.
     * @returns {Array<object>} The virtual node tree of the table element.
     */
    _viewTree(state) {
        const tree = this._detectTree(state.rows);

        return [
            this._renderHead(state),
            this._renderBody(state, tree),
            state.footer.length > 0 && this._renderFoot(state),
            this._renderTableExtras(state)
        ];
    }

    /**
     * Describes the header row group.
     * @param {object} state - The current state.
     * @returns {object} The header virtual node.
     */
    _renderHead(state) {
        const h = webexpress.webui.h;
        const suppressed = this._suppressHeaders;
        const visible = state.columns.filter((c) => c.visible);
        const lastVisibleId = visible.length > 0 ? visible[visible.length - 1].id : null;

        // a header the table does without is layout only: a row without cells, and a row
        // group without rows, would be announced as broken structure
        return h("div", {
            key: "head",
            class: this._classes(["wx-table-header-group", this._headColor]),
            role: suppressed ? "presentation" : "rowgroup",
            ref: (el) => { this._head = el; },
            on: { click: this._onHeadClick, keydown: this._onHeadKeyDown }
        },
            h("div", { key: "row", class: this._headerRowClass(), role: suppressed ? "presentation" : "row" },
                !suppressed && [
                    this._renderHeadPrefix(state),
                    visible.map((col) => this._renderHeaderCell(state, col, this._columnResizeEnabled && col.id !== lastVisibleId && col.resizable !== false)),
                    this._renderHeadSuffix(state)
                ]));
    }

    /**
     * Gets the classes of the header row.
     * @returns {string} The css classes.
     */
    _headerRowClass() {
        return "wx-grid-row wx-table-header";
    }

    // the cells of no column ahead of and behind the columns. The header, every row and
    // the footer describe them through matching hooks, and the grid template reserves a
    // track for each, so a cell of a column stands under its header in every row group

    /**
     * Hook for subclasses to describe header cells of no column ahead of the columns, for
     * example the header of a grip column.
     * @param {object} state - The current state.
     * @returns {*} Virtual nodes, or null.
     */
    _renderHeadPrefix(state) {
        return null;
    }

    /**
     * Describes the header cells of no column behind the columns: the actions header.
     * @param {object} state - The current state.
     * @returns {*} Virtual nodes, or null.
     */
    _renderHeadSuffix(state) {
        return this._hasActionsColumn() ? this._renderActionsHeader(state) : null;
    }

    /**
     * Hook for subclasses to describe the cells of no column ahead of the columns of a
     * row, for example a grip.
     * @param {object} state - The current state.
     * @param {Object} row - Row data object.
     * @returns {*} Virtual nodes, or null.
     */
    _renderRowPrefix(state, row) {
        return null;
    }

    /**
     * Describes the cells of no column behind the columns of a row: the actions cell,
     * which holds the options menu of the row.
     * @param {object} state - The current state.
     * @param {Object} row - Row data object.
     * @returns {*} Virtual nodes, or null.
     */
    _renderRowSuffix(state, row) {
        if (!this._hasActionsColumn()) {
            return null;
        }
        return webexpress.webui.h("div", {
            key: "__actions",
            class: "wx-grid-cell wx-table-actions",
            role: this._cellRole,
            keep: true,
            ref: (el) => this._placeOptions(el, row)
        });
    }

    /**
     * Hook for subclasses to describe the footer cells of no column ahead of the columns,
     * the placeholders under the cells of the row prefix.
     * @param {object} state - The current state.
     * @returns {*} Virtual nodes, or null.
     */
    _renderFootPrefix(state) {
        return null;
    }

    /**
     * Describes the footer cells of no column behind the columns: the placeholder under
     * the actions cells.
     * @param {object} state - The current state.
     * @returns {*} Virtual nodes, or null.
     */
    _renderFootSuffix(state) {
        if (!this._hasActionsColumn()) {
            return null;
        }
        return webexpress.webui.h("div", { key: "__actions", class: "wx-grid-cell wx-table-actions", role: this._cellRole });
    }

    /**
     * Hook for subclasses to name the grid tracks of the cells their row prefix adds.
     * @returns {Array<string>} The track sizes.
     */
    _gridPrefixTracks() {
        return [];
    }

    /**
     * Names the grid tracks of the cells behind the columns: the actions track.
     * @returns {Array<string>} The track sizes.
     */
    _gridSuffixTracks() {
        return this._hasActionsColumn() ? ["1.5rem"] : [];
    }

    /**
     * Hook for subclasses to add props to a column header cell, such as listeners; the
     * props of the cell itself win.
     * @param {Object} col - The column.
     * @returns {object|null} The props, or null.
     */
    _headerCellProps(col) {
        return null;
    }

    /**
     * Describes the trailing actions header cell. The base control renders an empty
     * cell; subclasses may add controls such as a column manager.
     * @param {object} state - The current state.
     * @returns {object} The header cell virtual node.
     */
    _renderActionsHeader(state) {
        const h = webexpress.webui.h;
        // the column is named, but the name need not be seen
        return h("div", { key: "__actions", class: "wx-grid-header-cell wx-table-actions", role: "columnheader" },
            h("span", { class: "visually-hidden" }, this._i18n("webexpress.webui:table.options.label", "Options")));
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
     * Names a column that was given no label, by its position.
     * @param {number} index Zero-based column index.
     * @returns {string}
     */
    _columnFallbackName(index) {
        return this._i18n("webexpress.webui:table.column", "Column {n}").replace("{n}", String(index + 1));
    }

    /**
     * Describes a single column header cell.
     * @param {object} state - The current state.
     * @param {Object} col - The column.
     * @param {boolean} resizable - Whether the column carries a resize handle.
     * @returns {object} The header cell virtual node.
     */
    _renderHeaderCell(state, col, resizable) {
        const h = webexpress.webui.h;
        const extra = this._headerCellProps(col) || {};

        return h("div", Object.assign({}, extra, {
            key: col.id,
            class: this._classes([
                "wx-grid-header-cell wx-col-header",
                col.color,
                col.align && `wx-table-align-${col.align}`,
                col.sort && (col.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc")
            ]),
            role: "columnheader",
            dataset: { columnId: col.id },
            // a click on the header sorts, so the keyboard reaches it and reads the order
            tabindex: "0",
            "aria-sort": col.sort === "asc" ? "ascending" : col.sort === "desc" ? "descending" : "none",
            ref: (el) => { this._headerCells.set(col.id, el); }
        }),
            h("div", { key: "inner", class: "wx-col-inner" },
                col.icon && h("i", { key: "icon", class: col.icon }),
                col.image && h("img", { key: "image", class: "wx-icon", src: col.image, alt: "", loading: "lazy" }),
                this._renderHeaderLabel(col),
                // a column that shows an icon or nothing at all still needs a name a reader
                // can sort by; it is text, hidden from the eye, because a header is read by
                // its content
                !col.label && h("span", { key: "name", class: "visually-hidden" }, col.name || this._columnFallbackName(col.index))),
            resizable && h("span", { key: "resizer", class: "wx-col-resizer", on: this._resizerHandlers(col.id) }));
    }

    /**
     * Describes the label of a column header: the formatted header the server rendered,
     * or the plain label. The formatting is kept in one span, because the header lays
     * out its children as flex items and would drop the blanks between formatted words.
     * @param {Object} col - The column.
     * @returns {*} The label virtual node or text.
     */
    _renderHeaderLabel(col) {
        return col.labelHtml
            ? webexpress.webui.h("span", { key: "label", class: "wx-table-cell-text", html: col.labelHtml })
            : (col.label || null);
    }

    /**
     * Returns the listeners of the resize handle of a column.
     * @param {string} columnId - The column id.
     * @returns {object} The listener map.
     */
    _resizerHandlers(columnId) {
        return this._handler("resizer", columnId, () => ({
            mousedown: (e) => {
                e.stopPropagation();
                this._beginColumnResize(e, this._headerCells.get(columnId));
            },
            touchstart: (e) => {
                e.stopPropagation();
                this._beginColumnResize(e, this._headerCells.get(columnId));
            },
            click: (e) => {
                e.stopPropagation();
                e.preventDefault();
            },
            dblclick: (e) => {
                e.stopPropagation();
                e.preventDefault();
                this._autoSizeColumn(this._colIndexCache.get(columnId));
            }
        }));
    }

    /**
     * Describes the body row group: the visible rows in display order.
     * @param {object} state - The current state.
     * @param {boolean} tree - Whether a row has children.
     * @returns {object} The body virtual node.
     */
    _renderBody(state, tree) {
        return webexpress.webui.h("div", {
            key: "body",
            class: "wx-table-body-group",
            role: "rowgroup",
            ref: (el) => { this._body = el; },
            on: this._bodyHandlers()
        }, this._renderRowsList(state, tree));
    }

    /**
     * Returns the listeners of the body, which serve every row through delegation.
     * Subclasses add theirs, for example the start of a row move.
     * @returns {object} The listener map.
     */
    _bodyHandlers() {
        return this._handler("body", "rows", () => ({ click: this._onBodyClick, input: this._onBodyInput }));
    }

    /**
     * Describes the visible rows in display order, expanding only opened tree nodes.
     * @param {object} state - The current state.
     * @param {boolean} tree - Whether a row has children.
     * @returns {Array<object>} The row virtual nodes.
     */
    _renderRowsList(state, tree) {
        const nodes = [];
        const walk = (rows, depth) => {
            for (const row of rows) {
                nodes.push(this._renderRow(state, row, depth, tree));
                // _treeEnabled is owned by the reorderable subclass; undefined means enabled
                if (this._treeEnabled !== false && row.children?.length && row.expanded) {
                    walk(row.children, depth + 1);
                }
            }
        };
        walk(state.rows, 0);
        return nodes;
    }

    /**
     * Describes one row: its leading cells, a cell per visible column and the actions
     * cell.
     * @param {object} state - The current state.
     * @param {Object} row - Row data object.
     * @param {number} depth - Hierarchy depth.
     * @param {boolean} tree - Whether a row has children.
     * @returns {object} The row virtual node.
     */
    _renderRow(state, row, depth, tree) {
        const h = webexpress.webui.h;
        const key = this._getRowKey(row);
        const flash = state.flash ? state.flash[key] : null;
        const selected = state.selected === row;
        const props = {
            key: key,
            class: this._classes([
                "wx-grid-row",
                row.color,
                ...String(row.class || "").split(/\s+/),
                selected && "active",
                flash === "change" && "wx-change-flash",
                flash === "new" && "wx-new-flash"
            ].concat(this._rowClasses(state, row) || [])),
            role: "row",
            style: row.style || "",
            "aria-selected": selected ? "true" : null,
            ref: (el) => {
                el._dataRowRef = row;
                row._anchorTr = el;
                row._depth = depth;
                this._rowElements.set(key, el);
            }
        };

        // apply action attributes (primary + secondary)
        Object.assign(props, this._actionProps("primary", row.primaryAction), this._actionProps("secondary", row.secondaryAction));

        const cells = [];
        let firstVisible = true;
        for (let i = 0; i < state.columns.length; i++) {
            const col = state.columns[i];
            if (!col.visible) {
                continue;
            }
            cells.push(this._renderBodyCell(row, col, row.cells[i], firstVisible, tree));
            firstVisible = false;
        }

        return h("div", props,
            this._renderRowPrefix(state, row),
            cells,
            this._renderRowSuffix(state, row));
    }

    /**
     * Joins class names into one string. The renderer leaves a prop alone that equals the
     * one it rendered last, so a row keeps a class another hand gave it (a drag mark)
     * until its own classes change.
     * @param {Array<string>} parts - The class names, falsy entries skipped.
     * @returns {string} The class attribute.
     */
    _classes(parts) {
        return parts.filter(Boolean).join(" ");
    }

    /**
     * Gets the action attributes of a row as props, in the form _applyActionAttrs writes.
     * @param {"primary"|"secondary"} prefix - Attribute prefix.
     * @param {Object|null} actionMap - The action map (key→value).
     * @returns {object} The attribute props.
     */
    _actionProps(prefix, actionMap) {
        const props = {};
        for (const [key, value] of Object.entries(actionMap || {})) {
            if (value === null || value === undefined || value === false || value === "") {
                continue;
            }
            props[`data-wx-${prefix}-${key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}`] = String(value);
        }
        return props;
    }

    /**
     * Hook for subclasses to add classes to a row, for example the marks of a drag.
     * @param {object} state - The current state.
     * @param {Object} row - Row data object.
     * @returns {Array<string>|null} The classes.
     */
    _rowClasses(state, row) {
        return null;
    }

    /**
     * Hook for subclasses to describe elements of the table element besides the header,
     * the body and the footer.
     * @param {object} state - The current state.
     * @returns {*} Virtual nodes, or null.
     */
    _renderTableExtras(state) {
        return null;
    }

    /**
     * Describes a single body cell. Its content is built into it and kept until the cell
     * or what the cell shows changes, because a cell template may place a control there.
     * The cell names its column, which is how an edit in it finds its model cell.
     * @param {Object} row - The row.
     * @param {Object} col - The column.
     * @param {Object} cell - The cell.
     * @param {boolean} firstVisible - Whether it is the first visible column.
     * @param {boolean} tree - Whether a row has children.
     * @returns {object} The cell virtual node.
     */
    _renderBodyCell(row, col, cell, firstVisible, tree) {
        return webexpress.webui.h("div", {
            key: col.id,
            class: this._classes([
                "wx-grid-cell",
                col.align && `wx-table-align-${col.align}`,
                cell && cell.color,
                ...String((cell && cell.class) || "").split(/\s+/)
            ]),
            role: this._cellRole,
            style: (cell && cell.style) || "",
            dataset: { columnId: col.id },
            keep: true,
            ref: (el) => this._placeCell(el, row, col, cell, firstVisible && tree && this._treeEnabled !== false, firstVisible)
        });
    }

    /**
     * Builds the content of a cell into it, anew only when the cell, its column or what
     * it shows changed, so a control a cell template placed there survives a sort, an
     * expand or a selection.
     * @param {HTMLElement} el - The cell element.
     * @param {Object} row - The row.
     * @param {Object} col - The column.
     * @param {Object} cell - The cell.
     * @param {boolean} treeCell - Whether the cell carries the tree toggle.
     * @param {boolean} firstVisible - Whether it is the first visible column.
     */
    _placeCell(el, row, col, cell, treeCell, firstVisible) {
        const signature = JSON.stringify([
            cell ? [cell.content, cell.html, cell.type, cell.uri, cell.icon, cell.image, cell.target] : null,
            firstVisible ? [row.uri, row.icon, row.image, row.target] : null,
            treeCell ? [row.expanded, !!row.children?.length, webexpress.webui.treeGuides(row)] : null
        ]);
        if (el._wxCell === cell && el._wxColumn === col && el._wxRow === row && el._wxSignature === signature) {
            return;
        }
        el._wxCell = cell;
        el._wxColumn = col;
        el._wxRow = row;
        el._wxSignature = signature;

        el.replaceChildren();
        if (cell) {
            let content = this._renderCell(row, col, cell, firstVisible);

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
                el.appendChild(content);
            } else {
                el.textContent = String(content ?? "");
            }
        }

        if (treeCell) {
            this._injectTreeToggle(el, row);
        }
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
     * Builds the options dropdown of a row into its cell, anew only when the options
     * changed.
     * @param {HTMLElement} el - The actions cell.
     * @param {Object} row - The row.
     */
    _placeOptions(el, row) {
        const effectiveOptions = (row.options && row.options.length) ? row.options : this._options;
        if (el._wxOptions === effectiveOptions) {
            return;
        }
        el._wxOptions = effectiveOptions;
        el.replaceChildren();

        if (effectiveOptions && effectiveOptions.length > 0) {
            const div = document.createElement("div");
            div.dataset.icon = this._iconClass("more");
            div.dataset.size = "btn-sm";
            div.dataset.border = "false";
            div.title = this._i18n("webexpress.webui:table.options.label", "Options");
            el.appendChild(div);
            new webexpress.webui.DropdownCtrl(div).items = effectiveOptions;
        }
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
     * Describes the footer row group. The footer cells are positional like the cells of
     * a row and are reordered with the columns.
     * @param {object} state - The current state.
     * @returns {object} The footer virtual node.
     */
    _renderFoot(state) {
        const h = webexpress.webui.h;

        return h("div", { key: "foot", class: "wx-table-footer-group", role: "rowgroup", ref: (el) => { this._foot = el; } },
            h("div", { class: "wx-grid-row wx-table-footer", role: "row" },
                this._renderFootPrefix(state),
                state.columns.map((col, i) => col.visible && h("div", {
                    key: col.id,
                    class: this._classes(["wx-grid-cell", col.align && `wx-table-align-${col.align}`]),
                    role: this._cellRole,
                    html: state.footer[i] != null ? state.footer[i] : ""
                })),
                this._renderFootSuffix(state)));
    }

    /**
     * Follows the first render: the rows it shows are the ones the next refresh compares
     * against, and a selectable table selects its first row.
     * @param {object} state - The rendered state.
     */
    onMount(state) {
        this._updateSnapshot(this._collectCurrentRowStates());
        this._suppressFlashOnce = false;
        this.onUpdate(state);
    }

    /**
     * Follows a render with what the DOM has to do itself: the grid template of the
     * columns, the restart of a change flash on a row that kept its node, and the hooks.
     * @param {object} state - The rendered state.
     */
    onUpdate(state) {
        this._isTree = this._detectTree(state.rows);
        this._rebuildColumnIndexCache();
        this._syncColumnWidths();

        if (!state.footer.length) {
            this._foot = null;
        }

        if (state.flash !== this._shownFlash) {
            this._shownFlash = state.flash;
            this._pendingFlash = null;
            // a row keeps its node, so a mark it already carries has to be set anew for
            // the animation to play again
            for (const [key, kind] of Object.entries(state.flash || {})) {
                const el = this._rowElements.get(key);
                const cls = kind === "new" ? "wx-new-flash" : "wx-change-flash";
                if (el && el.isConnected !== false) {
                    el.classList.remove(cls);
                    void el.offsetWidth;
                    el.classList.add(cls);
                }
            }

            // once played, the marks go, so a row that is shown again later (an expand,
            // a column brought back) does not flash a change it never had
            const shown = state.flash;
            if (shown && Object.keys(shown).length > 0) {
                clearTimeout(this._flashTimer);
                this._flashTimer = setTimeout(() => {
                    if (this.state.flash === shown) {
                        this.setState({ flash: null });
                    }
                }, webexpress.webui.TableCtrl.FLASH_DURATION);
            }
        }

        this._afterRenderDom();
        this._autoSelectFirstRow();
    }

    /**
     * Stops the timer that takes the change marks away.
     */
    onUnmount() {
        clearTimeout(this._flashTimer);
    }

    /**
     * Hook for subclasses to bind row-level interactions after a render.
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
        this._selectRowInternal(firstRow, null, false);
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

    // ------------------------------------------------------------------ sorting

    /**
     * Handle sort interaction.
     * @param {HTMLElement} headerCell - Target header div.
     * @param {Object} col - Column descriptor.
     */
    _handleSortClick(headerCell, col) {
        this._applySort(col.id, col.sort === "asc" ? "desc" : (col.sort === "desc" ? null : "asc"));
    }

    /**
     * Sorts the table by a column, the one way the header and the column dialog both
     * sort: the column carries the mark, the rows are ordered locally - or shown in the
     * order they came in once the sort is lifted - and the sort is announced, so a table
     * that sorts on its server learns of it from either place alike.
     * @param {string} columnId - The id of the column.
     * @param {"asc"|"desc"|null} direction - The direction, or null to lift the sort.
     * @remarks The event detail names the direction in sortDirection. It carries it in
     *     dir as well, which is deprecated: the column dialog announced it under that
     *     name alone, and it remains for listeners written against it until they read
     *     sortDirection.
     */
    _applySort(columnId, direction) {
        const col = this._columns.find((c) => c.id === columnId);
        if (!col) {
            return;
        }
        const dir = direction === "asc" || direction === "desc" ? direction : null;
        for (const c of this._columns) {
            c.sort = null;
        }
        col.sort = dir;

        if (dir) {
            this.orderRows(col);
        } else {
            this.render();
        }

        this._dispatch(webexpress.webui.Event.TABLE_SORT_EVENT, {
            sender: this._element,
            columnId: col.id,
            sortDirection: dir,
            dir: dir
        });
    }

    /**
     * Sort rows by a specific column.
     * @param {Object} column - Sorting column descriptor.
     */
    orderRows(column) {
        const idx = this._colIndexCache.get(column.id);
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
        this._headColor = div.dataset.color || null;
        this._suppressHeaders = div.dataset.suppressHeaders === "true";

        return Array.from(div.children).map((el, idx) => {
            const typeEl = el.querySelector(":scope > [data-type], :scope > template[data-type]");
            const labelEl = el.querySelector(":scope > .wx-table-column-label");
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
                // the position the column was declared at, which names an unlabeled
                // column; the cells of a column are found through the index cache, since
                // the columns may have been reordered since
                index: idx,
                // a formatted header still needs a plain name for the column chooser and
                // the accessible name; without a title it is the text of the formatting
                label: el.dataset.label || labelEl?.textContent.trim() || "",
                labelHtml: labelEl ? labelEl.innerHTML : null,
                name: el.dataset.objectName || null,
                icon: el.dataset.icon || null,
                image: el.dataset.image || null,
                color: el.dataset.color || null,
                align: el.dataset.align || null,
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
                    // a cell panel carries controls and a markup cell formatted text instead of
                    // a value, so their markup is kept verbatim; the flattened text is retained
                    // alongside it because sorting needs a comparable value rather than markup
                    const panel = child.classList.contains("wx-table-cell-panel");
                    const rich = panel || child.classList.contains("wx-table-cell-markup");
                    const text = child.textContent.trim();
                    row.cells.push({
                        content: rich ? child.innerHTML : text,
                        text: text,
                        html: rich,
                        id: child.id,
                        // a panel keeps its classes on the panel element inside the markup;
                        // copying them onto the grid cell too would apply the panel layout twice
                        class: panel ? null : child.className,
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
     * Builds one guide column of a tree row.
     * @param {boolean} continues - Whether the branch of this level goes on below the row.
     * @param {boolean} own - Whether the column belongs to the row itself, which carries
     *     the elbow that joins the row to its parent.
     * @returns {HTMLElement} The guide element.
     */
    _createTreeGuide(continues, own) {
        const guide = document.createElement("span");

        guide.className = "wx-tree-guide"
            + (continues ? " wx-tree-guide-through" : "")
            + (own ? " wx-tree-guide-elbow" : "");

        return guide;
    }

    /**
     * Wraps the content of the first data cell of a row into the tree indentation and
     * its toggle.
     * @remarks
     * The indentation is drawn as one guide column per level rather than as a single
     * blank spacer: an ancestor whose branch continues carries a through line, and the
     * column of the row itself carries the elbow that joins it to its parent. At depth
     * two and beyond, indentation alone no longer says which parent a row belongs to.
     * @param {HTMLElement} firstCell - The first data cell of the row.
     * @param {Object} row - Row data.
     */
    _injectTreeToggle(firstCell, row) {
        const wrapper = document.createElement("span");
        wrapper.className = "wx-tree";

        const guides = webexpress.webui.treeGuides(row);

        for (let level = 0; level < guides.length; level++) {
            wrapper.appendChild(this._createTreeGuide(guides[level], level === guides.length - 1));
        }

        if (row.children?.length) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "wx-tree-toggle";
            btn.setAttribute("aria-expanded", String(row.expanded));
            btn.setAttribute("aria-label", this._i18n("webexpress.webui:list.tree.toggle", "Expand or collapse"));

            const icon = document.createElement("span");
            // the chevron is a drawing of the icon set: the class alone is a mask without a shape
            icon.className = "wx-tree-indicator-angle " + this._iconClass("angle-down") + (row.expanded ? " wx-tree-expand" : "");
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
     * Puts the columns into a new order and takes along what is positional with them: the
     * cells of every row and child row, and the footer. Every place that reorders columns
     * goes through here, so no one of them can move the columns and leave a footer or a
     * level of rows behind.
     * @param {Array<string>} orderedIds - The column ids in the wanted order; a column it
     *     does not name keeps its relative place behind the named ones.
     * @returns {boolean} True when the order changed.
     */
    _applyColumnOrder(orderedIds) {
        const byId = new Map(this._columns.map((c) => [c.id, c]));
        const ordered = [];
        for (const id of orderedIds || []) {
            const col = byId.get(id);
            if (col && !ordered.includes(col)) {
                ordered.push(col);
            }
        }
        for (const col of this._columns) {
            if (!ordered.includes(col)) {
                ordered.push(col);
            }
        }

        // the old position of the column each new position shows
        const oldIndexById = new Map(this._columns.map((c, i) => [c.id, i]));
        const source = ordered.map((c) => oldIndexById.get(c.id));
        if (source.every((from, to) => from === to)) {
            return false;
        }

        const stack = [...this._rows];
        while (stack.length) {
            const row = stack.pop();
            const cells = Array.isArray(row.cells) ? row.cells : [];
            row.cells = source.map((from) => cells[from] || { content: "" });
            if (row.children) {
                stack.push(...row.children);
            }
        }
        if (this._footer.length) {
            const footer = this._footer;
            this._footer = source.map((from) => footer[from] ?? "");
        }
        // the setter rebuilds the index cache
        this._columns = ordered;
        return true;
    }

    /**
     * Constructs the CSS Grid Template string. It is written to the table element, which
     * is the render root and so outside the rendered tree, and also live while a column
     * is resized.
     */
    _syncColumnWidths() {
        const parts = [...this._gridPrefixTracks()];
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

        parts.push(...this._gridSuffixTracks());

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
     * Autosize a specific column.
     * @param {number} index - Column index.
     */
    _autoSizeColumn(index) {
        const column = this._columns[index];
        if (!column || column.visible === false || column.resizable === false) {
            return;
        }

        const headerTh = this._headerCells.get(column.id);
        if (!headerTh || !headerTh.isConnected) {
            return;
        }

        // a style the browser leaves empty counts as no width rather than poisoning the sum
        const px = (value) => parseFloat(value) || 0;
        let maxWidth = 0;
        const inner = headerTh.querySelector(".wx-col-inner") || headerTh;

        // measure header
        const thStyle = getComputedStyle(headerTh);
        const headerWidth = Math.ceil(inner.getBoundingClientRect().width)
            + px(thStyle.paddingLeft) + px(thStyle.paddingRight)
            + px(thStyle.borderLeftWidth) + px(thStyle.borderRightWidth);

        maxWidth = Math.max(maxWidth, headerWidth);

        // measure cells; a cell is found by the column it shows, because a row may lead
        // with cells of no column (the grip of a movable row)
        const rows = this._body.querySelectorAll(".wx-grid-row");
        for (let r = 0; r < rows.length; r++) {
            const td = Array.from(rows[r].children).find((cell) => cell._wxColumn === column);
            if (!td) {
                continue;
            }
            const tdStyle = getComputedStyle(td);
            const contentW = Math.max(td.scrollWidth, Math.ceil(td.getBoundingClientRect().width));
            const totalW = contentW + px(tdStyle.borderLeftWidth) + px(tdStyle.borderRightWidth);
            if (totalW > maxWidth) {
                maxWidth = totalW;
            }
        }

        column.width = Math.max(Math.ceil(maxWidth) + webexpress.webui.TableCtrl.AUTOSIZE_BUFFER, webexpress.webui.TableCtrl.MIN_COL_WIDTH);

        this._syncColumnWidths();
        this._schedulePersistIfAvailable();
    }

    /**
     * Start column resize interaction. The width follows the pointer through the grid
     * template alone, so the gesture renders nothing.
     * @param {Event} evt - Triggering event.
     * @param {HTMLElement} th - Column header element.
     */
    _beginColumnResize(evt, th) {
        if (!th) {
            return;
        }
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
