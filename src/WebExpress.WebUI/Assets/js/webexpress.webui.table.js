/**
 * Advanced table control:
 * - Column reordering, visibility management, sorting
 * - Inline editing integration
 * - Row drag & drop (flat + hierarchical with expand/collapse)
 * - Persisted state (columns + tree collapsed nodes)
 * - Tree utilities (expand/collapse level management)
 * - Column searching and dropdown management
 *
 * Public API:
 *  - expandAll()
 *  - collapseAll()
 *  - expandFirstLevels(levelCount)
 *  - collapseDeeperThan(levelCount)
 *  - setColumns(columns, preserveExisting = true)
 *  - insertRow(rowData, parentId = null, index = null)
 *  - deleteRow(rowId)
 *  - searchColumns(term)
 *  - enableChangeFlash()
 *  - disableChangeFlash()
 *  - setChangeFlash(enabled)
 *  - suppressNextChangeFlash()
 *
 * Dispatched events (via webexpress.webui.Event constants when present):
 *  - TABLE_SORT_EVENT
 *  - COLUMN_REORDER_EVENT
 *  - COLUMN_VISIBILITY_EVENT
 *  - COLUMN_SEARCH_EVENT
 *  - START_INLINE_EDIT_EVENT
 *  - SAVE_INLINE_EDIT_EVENT
 *  - END_INLINE_EDIT_EVENT
 *  - ROW_REORDER_EVENT
 *  - CHANGE_VISIBILITY_EVENT
 *  - MOVE_EVENT
 */
webexpress.webui.TableCtrl = class extends webexpress.webui.Ctrl {

    // core elements
    _table = document.createElement("table");
    _col = document.createElement("colgroup");
    _head = document.createElement("thead");
    _body = document.createElement("tbody");
    _foot = document.createElement("tfoot");

    // data
    _columns = [];
    _rows = [];
    _footer = [];
    _options = [];

    // flags / features
    _movableRow = false;
    _hasOptions = false;
    _allowColumnRemove = true;
    _isTree = false;

    // drag state columns
    _draggedColumn = null;
    _dragColumnIndicator = null;

    // drag state rows
    _draggedRow = null;
    _draggedRowParent = null;
    _draggedRowBlockTrs = null;
    _rowPlaceholder = null;
    _rowDragActive = false;
    _autoScrollInterval = null;
    _lastPointerY = null;

    // extended tree drag target state
    _dragRowTargetParent = null;
    _dragRowInsertIndex = null;
    _dragRowTargetMode = null;

    // resizing
    _resizingColumn = null;
    _resizeStartX = null;
    _resizeStartWidth = null;
    _resizeMoveHandler = null;
    _resizeEndHandler = null;

    // persistence
    _persistKey = null;
    _saveDebounceTimer = null;

    // enhancements / filters
    _columnFilterTerm = "";

    // dropdown column list drag state
    _ddDragSourceIndex = null;
    _ddDragPlaceholder = null;

    // change detection / highlighting
    _prevRowState = new Map();
    _initialized = false;

    // cache
    _colIndexCache = null;

    // change flash control
    _highlightChanges = true;          // when false, no row flash animations are performed
    _suppressFlashOnce = false;        // when true, next render will not flash even if enabled

    // constants
    static MIN_COL_WIDTH = 30;
    static NUMERIC_RX = /^-?\d+(?:\.\d+)?$/;

    /**
     * Creates a new table control instance.
     * @param {HTMLElement} element Root element.
     */
    constructor(element) {
        super(element);

        // utilities
        this._util = {
            addClasses: (el, cls) => { 
                if (!cls) { 
                    return; 
                } 
                cls.split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c)); 
            },
            create: (tag, opts = {}) => {
                const el = document.createElement(tag);
                if (opts.class) { 
                    this._util.addClasses(el, opts.class); 
                }
                if (opts.text != null) { 
                    el.textContent = opts.text; 
                }
                if (opts.html != null) { 
                    el.innerHTML = opts.html; 
                }
                if (opts.attrs) { 
                    for (const [k, v] of Object.entries(opts.attrs)) { 
                        if (v != null) { 
                            el.setAttribute(k, v); 
                        } 
                    } 
                }
                return el;
            },
            dispatch: (evtConst, detail) => {
                if (!evtConst) { 
                    return; 
                }
                document.dispatchEvent(new CustomEvent(evtConst, { detail }));
            }
        };

        // base class / style
        this._table.className = "wx-table table table-hover table-sm";

        // dataset / flags
        const ds = element.dataset;
        const tableColor   = ds.color || null;
        const tableBorder  = ds.border || null;
        const tableStriped = ds.striped || null;
        this._movableRow        = ds.movableRow === "true" || false;
        this._allowColumnRemove = ds.allowColumnRemove === "true" || false;
        this._persistKey        = ds.persistKey || element.id || null;

        // parse declarative config
        this._options = this._parseOptions(element.querySelector(":scope > .wx-table-options"));
        this._columns = this._parseColumns(element.querySelector(":scope > .wx-table-columns"));
        this._rows    = this._parseRows(element.querySelectorAll(":scope > .wx-table-row"));
        this._footer  = this._parseFooter(element.querySelector(":scope > .wx-table-footer"));

        // load persisted state
        this._loadStateFromCookie();

        // assemble DOM
        this._table.appendChild(this._col);
        this._table.appendChild(this._head);
        this._table.appendChild(this._body);
        if (this._footer.length) { 
            this._table.appendChild(this._foot); 
        }

        // cleanup attributes
        [
            "data-color",
            "data-border",
            "data-striped",
            "data-movable-row",
            "data-persist-key",
            "data-allow-column-remove"
        ].forEach(a => element.removeAttribute(a));

        element.innerHTML = "";
        element.appendChild(this._table);

        // drag indicator (columns)
        this._dragColumnIndicator = this._util.create("div", { class: "wx-table-drag-indicator", attrs: { "aria-hidden": "true" } });
        this._dragColumnIndicator.style.display = "none";
        this._table.appendChild(this._dragColumnIndicator);

        // optional classes
        [tableColor, tableBorder, tableStriped].forEach(cls => this._util.addClasses(this._table, cls));

        // initial render
        this.render();

        // inline editing integration
        this._bindInlineEditSaveListener();
    }

    /**
     * Enables flashing highlight of changed rows.
     */
    enableChangeFlash() {
        this._highlightChanges = true;
    }

    /**
     * Disables flashing highlight of changed rows.
     */
    disableChangeFlash() {
        this._highlightChanges = false;
    }

    /**
     * Sets flashing highlight enabled state.
     * @param {boolean} enabled True to enable, false to disable.
     */
    setChangeFlash(enabled) {
        this._highlightChanges = !!enabled;
    }

    /**
     * Suppresses flashing for the next render cycle only.
     */
    suppressNextChangeFlash() {
        this._suppressFlashOnce = true;
    }

    /**
     * Renders entire table (columns, rows, footer), applying diff highlight when enabled.
     */
    render() {
        const currentStates = this._collectCurrentRowStates();
        const allowDiff = this._initialized;
        const changes = allowDiff ? this._detectChangedRows(currentStates) : [];
        const allowFlash = allowDiff && this._highlightChanges && !this._suppressFlashOnce;

        this._renderColumns();
        this._renderRows();
        this._renderFooter();
        this._syncColumnWidths();
        this._rebuildColumnIndexCache();

        if (allowFlash && changes.length) { 
            changes.forEach(r => this._flashRow(r)); 
        }
        if (this._suppressFlashOnce) { 
            this._suppressFlashOnce = false; 
        }
        this._updateSnapshot(currentStates);
        if (!this._initialized) { 
            this._initialized = true; 
        }
    }

    /**
     * Clears all internal table sections.
     */
    clear() {
        this._col.innerHTML = "";
        this._head.innerHTML = "";
        this._body.innerHTML = "";
        this._foot.innerHTML = "";
    }

    /**
     * Sets new column definitions with optional mapping preservation.
     * @param {Array<Object>} columns Column definitions.
     * @param {boolean} [preserveExisting=true] Preserve existing cell mapping.
     */
    setColumns(columns, preserveExisting = true) {
        if (!Array.isArray(columns) || !columns.length) { 
            return; 
        }
        const prevCols = this._columns.slice();
        const prevOrder = prevCols.map(c => c.id);
        const normalized = columns.map((c, idx) => ({
            id: c.id || ("col_" + idx),
            index: idx,
            name: c.name || null,
            label: c.label != null ? String(c.label) : (c.id || ("Column " + (idx + 1))),
            icon: c.icon || null,
            image: c.image || null,
            color: c.color || null,
            width: c.width || null,
            sort: null,
            visible: typeof c.visible === "boolean" ? c.visible : true,
            editable: !!c.editable,
            editAction: c.editAction || c.editaction || null,
            editMethod: c.editMethod || c.editmethod || null,
            template: c.template || null
        }));

        if (!preserveExisting) {
            this._traverseRows(this._rows, r => {
                if (!Array.isArray(r.cells)) { 
                    r.cells = []; 
                }
                if (r.cells.length > normalized.length) { 
                    r.cells.length = normalized.length; 
                }
                while (r.cells.length < normalized.length) { 
                    r.cells.push({ text: "" }); 
                }
            });
        } else {
            const prevIndexMap = new Map(prevOrder.map((id, i) => [id, i]));
            const remapRow = (row) => {
                const newCells = [];
                normalized.forEach(col => {
                    const oldIdx = prevIndexMap.get(col.id);
                    newCells.push(oldIdx != null && row.cells[oldIdx] ? row.cells[oldIdx] : { text: "" });
                });
                row.cells = newCells;
                if (row.children) { 
                    row.children.forEach(remapRow); 
                }
            };
            this._rows.forEach(remapRow);
        }

        this._columns = normalized;
        this._schedulePersist();
        this.render();
    }

    /**
     * Inserts a new row optionally as a child of another.
     * @param {Object|Array} rowData Row data object or cell array.
     * @param {string|null} [parentId=null] Parent id.
     * @param {number|null} [index=null] Index.
     * @returns {Object|null} Inserted row or null.
     */
    insertRow(rowData, parentId = null, index = null) {
        const buildRow = (data) => {
            if (Array.isArray(data)) {
                return {
                    id: null, class: null, style: null, color: null,
                    cells: data.map(v => ({ text: String(v ?? "") })),
                    options: null, children: [], parent: null, expanded: true
                };
            }
            return {
                id: data.id || null,
                class: data.class || null,
                style: data.style || null,
                color: data.color || null,
                cells: Array.isArray(data.cells)
                    ? data.cells.map(c => c && typeof c === "object" ? c : { text: String(c ?? "") })
                    : [],
                options: Array.isArray(data.options) ? data.options : null,
                children: [],
                parent: null,
                expanded: typeof data.expanded === "boolean" ? data.expanded : true
            };
        };

        const row = buildRow(rowData);
        while (row.cells.length < this._columns.length) { 
            row.cells.push({ text: "" }); 
        }
        if (row.cells.length > this._columns.length) { 
            row.cells.length = this._columns.length; 
        }

        let siblings;
        if (parentId) {
            const info = this._findRowAndParent(parentId);
            if (!info || !info.row) { 
                return null; 
            }
            const parent = info.row;
            if (!Array.isArray(parent.children)) { 
                parent.children = []; 
            }
            siblings = parent.children;
            row.parent = parent;
        } else {
            siblings = this._rows;
        }

        if (index == null || index < 0 || index > siblings.length) { 
            index = siblings.length; 
        }
        siblings.splice(index, 0, row);

        this._schedulePersist();
        this.render();
        return row;
    }

    /**
     * Deletes a row (and descendants) by id.
     * @param {string} rowId Row id.
     * @returns {boolean} True if removed.
     */
    deleteRow(rowId) {
        if (!rowId) { 
            return false; 
        }
        const removed = this._removeRowRecursive(rowId, this._rows, null);
        if (removed) {
            this._schedulePersist();
            this.render();
        }
        return removed;
    }

    /**
     * Expands all rows in the tree.
     */
    expandAll() {
        const changed = [];
        this._traverseRows(this._rows, r => {
            if (r.children && r.children.length && !r.expanded) {
                r.expanded = true;
                if (r.id) { 
                    changed.push(r.id); 
                }
            }
        });
        this._schedulePersist();
        this.render();
        if (changed.length) {
            this._dispatchVisibilityChange({ kind: "row", action: "expandAll", changedIds: changed });
        }
    }

    /**
     * Collapses all rows in the tree.
     */
    collapseAll() {
        const changed = [];
        this._traverseRows(this._rows, r => {
            if (r.children && r.children.length && r.expanded) {
                r.expanded = false;
                if (r.id) { 
                    changed.push(r.id); 
                }
            }
        });
        this._schedulePersist();
        this.render();
        if (changed.length) {
            this._dispatchVisibilityChange({ kind: "row", action: "collapseAll", changedIds: changed });
        }
    }

    /**
     * Expands rows up to a given level count.
     * @param {number} levelCount Level count (1 = root only).
     */
    expandFirstLevels(levelCount) {
        if (typeof levelCount !== "number" || levelCount < 1) { 
            return; 
        }
        const maxDepth = levelCount - 1;
        const changed = [];
        const walk = (rows, depth) => {
            for (const r of rows) {
                if (r.children && r.children.length) {
                    const desired = depth <= maxDepth;
                    if (r.expanded !== desired) {
                        r.expanded = desired;
                        if (r.id) { 
                            changed.push(r.id); 
                        }
                    }
                    walk(r.children, depth + 1);
                }
            }
        };
        walk(this._rows, 0);
        this._schedulePersist();
        this.render();
        if (changed.length) {
            this._dispatchVisibilityChange({ kind: "row", action: "expandFirstLevels", levelCount, changedIds: changed });
        }
    }

    /**
     * Collapses rows deeper than levelCount.
     * @param {number} levelCount Level threshold.
     */
    collapseDeeperThan(levelCount) {
        if (typeof levelCount !== "number" || levelCount < 1) { 
            return; 
        }
        const maxDepth = levelCount - 1;
        const changed = [];
        const walk = (rows, depth) => {
            for (const r of rows) {
                if (r.children && r.children.length) {
                    const desired = depth <= maxDepth;
                    if (r.expanded !== desired) {
                        r.expanded = desired;
                        if (r.id) { 
                            changed.push(r.id); 
                        }
                    }
                    walk(r.children, depth + 1);
                }
            }
        };
        walk(this._rows, 0);
        this._schedulePersist();
        this.render();
        if (changed.length) {
            this._dispatchVisibilityChange({ kind: "row", action: "collapseDeeperThan", levelCount, changedIds: changed });
        }
    }

    /**
     * Searches columns (id/label) case-insensitive.
     * @param {string} term Search term.
     * @returns {Array<Object>} Matching columns.
     */
    searchColumns(term) {
        term = (term || "").trim();
        this._columnFilterTerm = term;
        const lower = term.toLowerCase();
        const matches = term
            ? this._columns.filter(c =>
                (c.id && c.id.toLowerCase().includes(lower)) ||
                (c.label && c.label.toLowerCase().includes(lower)))
            : [...this._columns];

        this.render();

        this._util.dispatch(webexpress?.webui?.Event?.COLUMN_SEARCH_EVENT, {
            sender: this._element,
            term,
            matches: matches.map(c => ({ id: c.id, label: c.label }))
        });
        return matches;
    }

    /**
     * Orders top-level rows by a column (simple).
     * @param {Object} column Column descriptor.
     */
    orderRows(column) {
        const idx = this._columns.indexOf(column);
        if (idx === -1) { 
            return; 
        }
        const numeric = this._rows.every(r => {
            const v = r.cells[idx]?.text?.trim();
            return v === "" || webexpress.webui.TableCtrl.NUMERIC_RX.test(v);
        });
        this._rows.sort((a, b) => {
            const va = a.cells[idx]?.text || "";
            const vb = b.cells[idx]?.text || "";
            if (column.sort === "asc") {
                return numeric
                    ? (parseFloat(va) || 0) - (parseFloat(vb) || 0)
                    : va.localeCompare(vb, undefined, { numeric: true });
            }
            if (column.sort === "desc") {
                return numeric
                    ? (parseFloat(vb) || 0) - (parseFloat(va) || 0)
                    : vb.localeCompare(va, undefined, { numeric: true });
            }
            return 0;
        });
        this._schedulePersist();
        this.render();
    }

    /**
     * Sets column visibility.
     * @param {string|number} idOrIndex Column id or index.
     * @param {boolean} visible Visible flag.
     */
    setColumnVisibility(idOrIndex, visible) {
        const col = (typeof idOrIndex === "number")
            ? this._columns[idOrIndex]
            : this._columns.find(c => c.id === idOrIndex);
        if (!col || col.visible === visible || !this._allowColumnRemove) { 
            return; 
        }
        col.visible = visible;

        this._util.dispatch(webexpress.webui.Event.COLUMN_VISIBILITY_EVENT, {
            sender: this._element,
            columnId: col.id,
            visible: col.visible,
            columnIndex: this._columns.indexOf(col)
        });

        this._dispatchVisibilityChange({
            kind: "column",
            action: "toggle",
            columnId: col.id,
            visible: col.visible,
            columnIndex: this._columns.indexOf(col)
        });

        this._schedulePersist();
        this.render();
    }

    /**
     * Hides a column.
     * @param {string|number} idOrIndex Column id or index.
     */
    hideColumn(idOrIndex) {
        this.setColumnVisibility(idOrIndex, false);
    }

    /**
     * Shows a column.
     * @param {string|number} idOrIndex Column id or index.
     */
    showColumn(idOrIndex) {
        this.setColumnVisibility(idOrIndex, true);
    }

    /**
     * Toggles a column visibility.
     * @param {string|number} idOrIndex Column id or index.
     */
    toggleColumn(idOrIndex) {
        const col = typeof idOrIndex === "number"
            ? this._columns[idOrIndex]
            : this._columns.find(c => c.id === idOrIndex);
        if (!col) { 
            return; 
        }
        this.setColumnVisibility(col.id, !col.visible);
    }

    /**
     * Returns all visible columns.
     * @returns {Array<Object>} Visible column list.
     */
    getVisibleColumns() {
        return this._columns.filter(c => c.visible);
    }

    /**
     * Parses global option items.
     * @param {HTMLElement|null} optionsDiv Container element.
     * @returns {Array<Object>} Option list.
     */
    _parseOptions(optionsDiv) {
        if (!optionsDiv) { 
            return []; 
        }
        const list = [];
        for (const div of optionsDiv.children) {
            if (div.classList.contains("wx-dropdown-divider") || div.classList.contains("wx-dropdownbutton-divider")) {
                list.push({ type: "divider" });
            } else if (div.classList.contains("wx-dropdown-header") || div.classList.contains("wx-dropdownbutton-header")) {
                list.push({ type: "header", content: div.textContent.trim(), icon: div.dataset.icon || null });
            } else {
                list.push({
                    id: div.id || null,
                    image: div.dataset.image || null,
                    icon: div.dataset.icon || null,
                    linkColor: div.dataset.linkcolor || null,
                    uri: div.dataset.uri || div.dataset.url || null,
                    target: div.dataset.target || null,
                    tooltip: div.dataset.tooltip || null,
                    modal: div.dataset.modal || null,
                    content: div.textContent.trim() || null,
                    disabled: div.hasAttribute("disabled")
                });
            }
        }
        return list;
    }

    /**
     * Parses column definitions.
     * @param {HTMLElement|null} columnsDiv Container.
     * @returns {Array<Object>} Column definitions.
     */
    _parseColumns(columnsDiv) {
        if (!columnsDiv) { 
            return []; 
        }
        const headerColor = columnsDiv.dataset.color || null;
        if (headerColor) { 
            this._head.classList.add(headerColor); 
        }
        return Array.from(columnsDiv.children).map((div, idx) => ({
            id: div.id || ("col_" + idx),
            index: idx,
            name: div.dataset.objectName || null,
            label: div.dataset.label,
            icon: div.dataset.icon || null,
            image: div.dataset.image || null,
            color: div.dataset.color || null,
            width: div.getAttribute("width") ? parseInt(div.getAttribute("width"), 10) || null : null,
            sort: div.dataset.sort || null,
            visible: div.dataset.visible === "false" ? false : true,
            editable: div.dataset.editable === "true",
            editAction: div.dataset.formAction || null,
            editMethod: div.dataset.formMethod || null,
            template: div.firstElementChild
        }));
    }

    /**
     * Parses hierarchical rows.
     * @param {NodeList|Array} rowsDivs Row elements.
     * @param {Object|null} parent Parent row.
     * @returns {Array<Object>} Parsed rows.
     */
    _parseRows(rowsDivs, parent = null) {
        const rows = [];
        for (const div of rowsDivs) {
            if (!(div instanceof HTMLElement) || !div.classList.contains("wx-table-row")) { 
                continue; 
            }

            let expanded = true;
            if (div.dataset.expanded === "true") { 
                expanded = true; 
            } else if (div.dataset.expanded === "false") { 
                expanded = false; 
            } else if (div.dataset.collapsed === "true") { 
                expanded = false; 
            }

            const r = {
                id: div.id || null,
                class: div.className || null,
                style: div.getAttribute("style") || null,
                color: div.dataset.color || null,
                cells: [],
                options: null,
                children: [],
                parent,
                expanded
            };

            const childRowDivs = [];
            for (const child of div.children) {
                if (!(child instanceof HTMLElement)) { 
                    continue; 
                }
                if (child.classList.contains("wx-table-row")) {
                    childRowDivs.push(child);
                    this._isTree = true;
                    continue;
                }
                if (child.classList.contains("wx-table-options")) {
                    r.options = this._parseOptions(child);
                    if (r.options && r.options.length) { 
                        this._hasOptions = true; 
                    }
                } else if (child.classList.contains("wx-table-footer")) {
                    // ignore
                } else {
                    r.cells.push({
                        id: child.id || null,
                        class: child.className || null,
                        style: child.getAttribute("style") || null,
                        color: child.dataset.color || null,
                        text: child.textContent.trim(),
                        html: child.firstElementChild,
                        image: child.dataset.image || null,
                        icon: child.dataset.icon || null,
                        uri: child.dataset.uri || null,
                        target: child.dataset.target || null,
                        modal: child.dataset.modal || null,
                        objectId: child.dataset.objectId || null
                    });
                }
            }
            if (childRowDivs.length) { 
                r.children = this._parseRows(childRowDivs, r); 
            }
            rows.push(r);
        }
        return rows;
    }

    /**
     * Parses footer cells.
     * @param {HTMLElement|null} footerDiv Footer container.
     * @returns {Array<string>} Footer html fragments.
     */
    _parseFooter(footerDiv) {
        if (!footerDiv) { 
            return []; 
        }
        return Array.from(footerDiv.children).map(div => div.innerHTML.trim());
    }

    /**
     * Renders column headers including actions.
     */
    _renderColumns() {
        this._col.innerHTML = "";
        this._head.innerHTML = "";
        const headRow = document.createElement("tr");
        this._head.appendChild(headRow);
        const colFrag = document.createDocumentFragment();

        if (this._movableRow) {
            headRow.appendChild(document.createElement("th"));
            const fixCol = document.createElement("col");
            fixCol.style.width = "1ch";
            fixCol.style.maxWidth = "1ch";
            colFrag.appendChild(fixCol);
        }

        for (const col of this._columns) {
            if (!col.visible) { 
                continue; 
            }
            const th = document.createElement("th");
            th.draggable = true;
            th.dataset.columnId = col.id;
            if (col.sort) { 
                th.classList.add(col.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc"); 
            }
            this._util.addClasses(th, col.color);
            th.setAttribute("scope", "col");

            const inner = document.createElement("div");
            if (col.icon) {
                const i = document.createElement("i");
                i.className = col.icon;
                inner.appendChild(i);
            }
            if (col.image) {
                const img = document.createElement("img");
                img.src = col.image;
                img.alt = "";
                inner.appendChild(img);
            }
            inner.appendChild(document.createTextNode(col.label));
            th.appendChild(inner);
            headRow.appendChild(th);

            const cg = document.createElement("col");
            cg.dataset.columnId = col.id;
            if (col.width) { 
                cg.style.width = col.width + "px"; 
            }
            colFrag.appendChild(cg);

            this._enableDragAndDropColumn(th, col);
            this._enableResizableColumns(th, col);
            this._enableSortColumns(th, col);
        }

        this._renderActionsHeader(headRow, colFrag);
        this._col.appendChild(colFrag);
    }

    /**
     * Renders the actions header (column dropdown) if needed.
     * @param {HTMLTableRowElement} headRow Header row.
     * @param {DocumentFragment} colFrag Colgroup fragment.
     */
    _renderActionsHeader(headRow, colFrag) {
        const anyHidden = this._columns.some(c => !c.visible);
        const hasGlobalOptions = this._options.length > 0;
        const hasRowOptions = this._hasOptions;
        const showHeader = anyHidden || hasGlobalOptions || hasRowOptions || this._allowColumnRemove;
        if (!showHeader) { 
            return; 
        }

        const th = document.createElement("th");
        th.className = "wx-table-actions";
        th.style.overflow = "visible";

        const wrapper = document.createElement("div");
        wrapper.className = "wx-dropdown";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn dropdown-toggle";
        btn.setAttribute("data-bs-toggle", "dropdown");
        btn.setAttribute("aria-expanded", "false");
        btn.title = this._i18n("webexpress.webui:table.columns.toggle", "Show/Hide columns");
        btn.textContent = "+";

        const menu = document.createElement("div");
        menu.className = "dropdown-menu";
        menu.setAttribute("role", "menu");

        const header = document.createElement("h6");
        header.className = "dropdown-header";
        header.textContent = this._i18n("webexpress.webui:table.columns.label", "Columns");
        menu.appendChild(header);

        const searchGrp = document.createElement("div");
        searchGrp.className = "mb-2";
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "form-control form-control-sm";
        searchInput.placeholder = this._i18n("webexpress.webui:table.search.placeholder", "search...");
        searchInput.value = this._columnFilterTerm || "";
        searchInput.setAttribute("aria-label", this._i18n("webexpress.webui:table.filter.columns.label", "Filter columns"));
        searchInput.addEventListener("input", e => {
            this._columnFilterTerm = e.target.value.trim();
            this._applyColumnFilter(menu);
        });
        searchGrp.appendChild(searchInput);
        menu.appendChild(searchGrp);

        const listContainer = document.createElement("div");
        listContainer.className = "wx-columns-list";

        this._columns.forEach((c, idx) => {
            const item = document.createElement("div");
            item.className = "dropdown-item px-1 py-1 wx-col-item";
            item.style.whiteSpace = "normal";
            item.dataset.columnId = c.id;
            item.dataset.index = String(idx);
            item.draggable = true;

            const line = document.createElement("div");
            line.className = "d-flex align-items-center gap-2";

            const handle = document.createElement("span");
            handle.className = "wx-col-drag-handle";
            handle.title = this._i18n("webexpress.webui:table.handle.title", "Move");
            handle.textContent = "≡";

            const formCheck = document.createElement("div");
            formCheck.className = "form-check m-0 flex-grow-1";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.className = "form-check-input";
            cb.id = "dd_col_" + c.id;
            cb.checked = c.visible;
            cb.addEventListener("change", (ev) => {
                ev.stopPropagation();
                if (!cb.checked && this.getVisibleColumns().length <= 1) {
                    cb.checked = true;
                    return;
                }
                this.setColumnVisibility(c.id, cb.checked);
                this._reopenDropdownAfterRender(btn);
            });

            const label = document.createElement("label");
            label.className = "form-check-label";
            label.setAttribute("for", cb.id);
            label.textContent = c.label;

            formCheck.appendChild(cb);
            formCheck.appendChild(label);
            line.appendChild(handle);
            line.appendChild(formCheck);
            item.appendChild(line);
            listContainer.appendChild(item);
        });

        menu.appendChild(listContainer);
        this._enableDropdownColumnDrag(listContainer, btn);

        const divider = document.createElement("div");
        divider.className = "dropdown-divider";
        menu.appendChild(divider);

        wrapper.appendChild(btn);
        wrapper.appendChild(menu);
        th.appendChild(wrapper);
        headRow.appendChild(th);

        const cg = document.createElement("col");
        cg.style.width = "1em";
        colFrag.appendChild(cg);

        if (this._columnFilterTerm) { 
            this._applyColumnFilter(menu); 
        }
    }

    /**
     * Renders body rows.
     */
    _renderRows() {
        this._body.innerHTML = "";
        const fragment = document.createDocumentFragment();
        const renderList = (rows, depth) => {
            for (const r of rows) {
                this._addRow(r, depth, fragment);
                if (r.children && r.children.length && r.expanded) {
                    renderList(r.children, depth + 1);
                }
            }
        };
        renderList(this._rows, 0);
        this._body.appendChild(fragment);
    }

    /**
     * Renders a single row.
     * @param {Object} row Row object.
     * @param {number} depth Depth.
     * @param {DocumentFragment} fragment Target fragment.
     */
    _addRow(row, depth = 0, fragment) {
        const tr = document.createElement("tr");
        this._util.addClasses(tr, row.color);
        this._util.addClasses(tr, row.class);
        if (row.style) { 
            tr.setAttribute("style", row.style); 
        }
        tr._dataRowRef = row;
        row._anchorTr = tr;
        row._depth = depth;

        if (this._movableRow) {
            const handle = document.createElement("td");
            handle.className = "wx-table-drag-handle";
            handle.textContent = "☰";
            handle.title = this._i18n("webexpress.webui:table.handle.title", "Move");
            handle.setAttribute("aria-label", "Move row");
            tr.appendChild(handle);
            this._enableDragAndDropRow(handle, row);
        }

        for (let idx = 0; idx < this._columns.length; idx++) {
            const colDef = this._columns[idx];
            if (!colDef.visible) { 
                continue; 
            }
            const td = document.createElement("td");
            const cell = row.cells[idx];
            if (cell) {
                this._util.addClasses(td, cell.color);
                this._util.addClasses(td, cell.class);
                if (cell.style) { 
                    td.setAttribute("style", cell.style); 
                }
                const wrap = document.createElement("div");
                if (cell.image) {
                    const img = document.createElement("img");
                    img.src = cell.image;
                    img.alt = "";
                    wrap.appendChild(img);
                }
                if (cell.icon) {
                    const i = document.createElement("i");
                    i.className = cell.icon;
                    wrap.appendChild(i);
                }
                if (colDef.editable) {
                    if (cell.objectId) { 
                        wrap.id = colDef.id; 
                    }
                    if (cell.objectId) { 
                        wrap.setAttribute("data-object-id", cell.id); 
                    }
                    if (colDef.name) { 
                        wrap.setAttribute("data-object-name", colDef.name); 
                    }
                    if (colDef.editAction) { 
                        wrap.setAttribute("data-form-action", colDef.editAction); 
                    }
                    if (colDef.editMethod) { 
                        wrap.setAttribute("data-form-method", colDef.editMethod); 
                    }
                    if (colDef.template) {
                        wrap.appendChild(colDef.template);
                    } else {
                        const input = document.createElement("input");
                        input.type = "text";
                        input.className = "form-control";
                        input.value = cell.text || "";
                        input.name = colDef.id;
                        wrap.appendChild(input);
                    }
                    const smartEditCtrl = new webexpress.webui.SmartEditCtrl(wrap);
                    smartEditCtrl.value = cell.text || "";
                } else if (colDef.template) {
                    wrap.appendChild(colDef.template);
                    const smartViewCtrl = new webexpress.webui.SmartViewCtrl(wrap);
                    smartViewCtrl.value = cell.text || "";
                } else {
                    wrap.appendChild(cell?.html ?? document.createTextNode(cell?.text || ""));
                }
                td.appendChild(wrap);
            }
            tr.appendChild(td);
        }

        if (row.options && row.options.length) {
            const td = document.createElement("td");
            const div = document.createElement("div");
            div.dataset.icon = "fas fa-cog";
            div.dataset.size = "btn-sm";
            div.dataset.border = "false";
            new webexpress.webui.DropdownCtrl(div).items = row.options;
            td.appendChild(div);
            tr.appendChild(td);
        } else if (this._hasOptions || this._options.length > 0 || this._allowColumnRemove) {
            tr.appendChild(document.createElement("td"));
        }

        if (this._isTree) { 
            this._injectTreeToggle(tr, row, depth); 
        }
        fragment.appendChild(tr);
    }

    /**
     * Injects tree toggle into the first data cell.
     * @param {HTMLTableRowElement} tr Table row.
     * @param {Object} row Row object.
     * @param {number} depth Depth level.
     */
    _injectTreeToggle(tr, row, depth) {
        let firstDataCell = null;
        const cells = Array.from(tr.children);
        const startIndex = (this._movableRow ? 1 : 0);
        for (let i = startIndex; i < cells.length; i++) { 
            firstDataCell = cells[i]; 
            break; 
        }
        if (!firstDataCell) { 
            return; 
        }

        const contentWrapper = document.createElement("span");
        contentWrapper.classList.add("wx-tree");

        const indent = document.createElement("span");
        indent.className = "wx-tree-indent";
        indent.style.width = (depth * 1.25) + "em";

        let toggle;
        if (row.children && row.children.length) {
            toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "wx-tree-toggle btn btn-link btn-sm p-0";
            toggle.setAttribute("aria-expanded", String(!!row.expanded));
            toggle.setAttribute("aria-label", row.expanded ? "Collapse" : "Expand");

            const icon = document.createElement("span");
            icon.className = "wx-tree-indicator-angle";
            if (row.expanded) { 
                icon.classList.add("wx-tree-expand"); 
            }
            toggle.appendChild(icon);

            toggle.addEventListener("click", (e) => {
                e.stopPropagation();
                const prev = row.expanded;
                row.expanded = !row.expanded;
                toggle.setAttribute("aria-expanded", String(row.expanded));
                toggle.setAttribute("aria-label", row.expanded ? "Collapse" : "Expand");
                if (row.expanded) { 
                    icon.classList.add("wx-tree-expand"); 
                } else { 
                    icon.classList.remove("wx-tree-expand"); 
                }
                this._schedulePersist();
                this.render();
                if (prev !== row.expanded) {
                    this._dispatchVisibilityChange({
                        kind: "row",
                        action: row.expanded ? "expand" : "collapse",
                        rowId: row.id || null,
                        expanded: row.expanded
                    });
                }
            });
        } else {
            toggle = document.createElement("span");
            toggle.className = "wx-tree-toggle-placeholder";
        }

        const treeLead = document.createElement("span");
        treeLead.className = "wx-tree-lead";
        treeLead.appendChild(indent);
        treeLead.appendChild(toggle);

        contentWrapper.appendChild(treeLead);
        contentWrapper.appendChild(firstDataCell.firstChild);
        firstDataCell.innerHTML = "";
        firstDataCell.appendChild(contentWrapper);
    }

    /**
     * Renders footer row.
     */
    _renderFooter() {
        this._foot.innerHTML = "";
        const tr = document.createElement("tr");
        if (this._movableRow) { 
            tr.appendChild(document.createElement("td")); 
        }

        if (this._footer.length) {
            for (let logicalIdx = 0; logicalIdx < this._columns.length; logicalIdx++) {
                const col = this._columns[logicalIdx];
                if (!col.visible) { 
                    continue; 
                }
                const td = document.createElement("td");
                const content = this._footer[logicalIdx];
                if (content != null) { 
                    td.innerHTML = content; 
                }
                tr.appendChild(td);
            }
        } else {
            for (const c of this._columns) {
                if (c.visible) { 
                    tr.appendChild(document.createElement("td")); 
                }
            }
        }
        if (this._hasOptions || this._options.length > 0 || this._columns.some(c => !c.visible)) {
            tr.appendChild(document.createElement("td"));
        }
        this._foot.appendChild(tr);
    }

    /**
     * Synchronizes column widths to col elements.
     */
    _syncColumnWidths() {
        for (const c of this._columns) {
            if (!c.visible || !c.width) { 
                continue; 
            }
            this._applyWidthToColElement(c.id, c.width);
        }
    }

    /**
     * Applies width to matching col element.
     * @param {string} columnId Column id.
     * @param {number} width Width px.
     */
    _applyWidthToColElement(columnId, width) {
        const colEl = this._col.querySelector(`col[data-column-id='${columnId}']`);
        if (colEl) { 
            colEl.style.width = width + "px"; 
        }
    }

    /**
     * Returns current column order.
     * @returns {Array<string>} Column ids in order.
     */
    _getColumnOrder() {
        return this._columns.map(c => c.id);
    }

    /**
     * Rebuilds row cell arrays after reorder.
     * @param {Array<string>} oldOrder Old order.
     * @param {Array<string>} newOrder New order.
     */
    _rebuildAllRowCellsFromColumnOrder(oldOrder, newOrder) {
        const oldIndexMap = new Map(oldOrder.map((id, i) => [id, i]));
        const rebuildRow = (row) => {
            const newCells = new Array(newOrder.length);
            for (let i = 0; i < newOrder.length; i++) {
                const id = newOrder[i];
                const oldIdx = oldIndexMap.get(id);
                newCells[i] = (oldIdx != null && row.cells[oldIdx]) ? row.cells[oldIdx] : { text: "", id: null };
            }
            row.cells = newCells;
            if (row.children) { 
                row.children.forEach(rebuildRow); 
            }
        };
        this._rows.forEach(rebuildRow);
    }

    /**
     * Applies current column filter term to dropdown list.
     * @param {HTMLElement} menu Dropdown menu element.
     */
    _applyColumnFilter(menu) {
        const term = (this._columnFilterTerm || "").toLowerCase();
        const items = menu.querySelectorAll(".wx-columns-list > .dropdown-item");
        items.forEach(it => {
            const id = it.dataset.columnId || "";
            const label = it.querySelector(".form-check-label")?.textContent || "";
            const hay = (id + " " + label).toLowerCase();
            it.style.display = (!term || hay.includes(term)) ? "" : "none";
        });
    }

    /**
     * Enables drag & drop ordering inside the column dropdown.
     * @param {HTMLElement} listContainer Container.
     * @param {HTMLButtonElement} trigger Dropdown trigger button.
     */
    _enableDropdownColumnDrag(listContainer, trigger) {
        this._ddDragPlaceholder = document.createElement("div");
        this._ddDragPlaceholder.className = "wx-col-placeholder";
        this._ddDragSourceIndex = null;

        const items = () => Array.from(listContainer.querySelectorAll(".wx-col-item"));

        const computeIndexFromY = (clientY) => {
            const listItems = items().filter(i => !i.classList.contains("dragging"));
            if (!listItems.length) { 
                return 0; 
            }
            for (let i = 0; i < listItems.length; i++) {
                const rect = listItems[i].getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (clientY < mid) { 
                    return i; 
                }
            }
            return listItems.length;
        };

        const placePlaceholderAt = (index) => {
            const listItems = items().filter(i => !i.classList.contains("dragging"));
            if (index >= listItems.length) {
                const last = listItems[listItems.length - 1];
                if (last) {
                    if (last.nextSibling !== this._ddDragPlaceholder) {
                        last.parentNode.insertBefore(this._ddDragPlaceholder, last.nextSibling);
                    }
                } else {
                    listContainer.appendChild(this._ddDragPlaceholder);
                }
            } else {
                const ref = listItems[index];
                if (ref && ref !== this._ddDragPlaceholder.nextSibling) {
                    ref.parentNode.insertBefore(this._ddDragPlaceholder, ref);
                }
            }
        };

        const handleDragStart = (e) => {
            const item = e.currentTarget;
            this._ddDragSourceIndex = parseInt(item.dataset.index, 10);
            item.classList.add("dragging");
            try {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", item.dataset.columnId);
            } catch (_) {}
        };

        const handleDragEnd = (e) => {
            const item = e.currentTarget;
            item.classList.remove("dragging");
            if (this._ddDragPlaceholder.parentNode) {
                this._ddDragPlaceholder.parentNode.removeChild(this._ddDragPlaceholder);
            }
            items().forEach((it, idx) => it.dataset.index = String(idx));
            this._ddDragSourceIndex = null;
        };

        const handleContainerDragOver = (e) => {
            const draggingItem = listContainer.querySelector(".wx-col-item.dragging");
            if (!draggingItem) { 
                return; 
            }
            e.preventDefault();
            const idx = computeIndexFromY(e.clientY);
            placePlaceholderAt(idx);
        };

        const handleContainerDrop = (e) => {
            const draggingItem = listContainer.querySelector(".wx-col-item.dragging");
            if (!draggingItem) { 
                return; 
            }
            e.preventDefault();
            const targetIndex = (() => {
                if (this._ddDragPlaceholder.parentNode) {
                    const listItems = items().filter(i => !i.classList.contains("dragging"));
                    const allNodes = Array.from(listContainer.children);
                    let visualIndex = 0;
                    for (let i = 0; i < allNodes.length; i++) {
                        const n = allNodes[i];
                        if (n === this._ddDragPlaceholder) { 
                            return visualIndex; 
                        }
                        if (n.classList && n.classList.contains("wx-col-item") && !n.classList.contains("dragging")) {
                            visualIndex++;
                        }
                    }
                    return listItems.length;
                }
                return computeIndexFromY(e.clientY);
            })();

            const sourceIndex = this._ddDragSourceIndex;
            if (sourceIndex == null) { 
                return; 
            }

            let adjustedTarget = targetIndex;
            if (sourceIndex < targetIndex) { 
                adjustedTarget -= 1; 
            }
            adjustedTarget = Math.max(0, Math.min(adjustedTarget, this._columns.length - 1));

            if (sourceIndex !== adjustedTarget) {
                const previousOrder = this._getColumnOrder();
                const moved = this._columns.splice(sourceIndex, 1)[0];
                this._columns.splice(adjustedTarget, 0, moved);
                this._rebuildAllRowCellsFromColumnOrder(previousOrder, this._getColumnOrder());
                this._dispatchMassColumnReorder(previousOrder, this._getColumnOrder());
                this._dispatchMove({
                    kind: "column",
                    action: "move",
                    sourceIndex,
                    targetIndex: adjustedTarget,
                    order: this._getColumnOrder(),
                    previousOrder
                });
                this._schedulePersist();
                this.render();
            } else {
                this._reopenDropdownAfterRender(trigger);
            }
        };

        items().forEach((it) => {
            it.addEventListener("dragstart", handleDragStart);
            it.addEventListener("dragend", handleDragEnd);
            it.addEventListener("dragover", (e) => e.preventDefault());
        });

        listContainer.addEventListener("dragover", handleContainerDragOver);
        listContainer.addEventListener("drop", handleContainerDrop);
    }

    /**
     * Re-opens dropdown after rerender.
     * @param {HTMLButtonElement} trigger Trigger button.
     */
    _reopenDropdownAfterRender(trigger) {
        setTimeout(() => {
            if (!trigger.isConnected) {
                const newBtn = this._head.querySelector(".wx-table-actions .dropdown > .dropdown-toggle");
                if (newBtn && window.bootstrap?.Dropdown) {
                    const inst = bootstrap.Dropdown.getOrCreateInstance(newBtn);
                    inst.show();
                    newBtn.parentElement.querySelector("input[type=text]")?.focus();
                }
            } else if (window.bootstrap?.Dropdown) {
                const inst = bootstrap.Dropdown.getOrCreateInstance(trigger);
                inst.show();
                trigger.parentElement.querySelector("input[type=text]")?.focus();
            }
        }, 0);
    }

    /**
     * Enables row drag & drop using handle cell.
     * @param {HTMLTableCellElement} handle Handle.
     * @param {Object} row Row object.
     */
    _enableDragAndDropRow(handle, row) {
        if (!this._movableRow) { 
            return; 
        }
        handle.draggable = true;
        handle.setAttribute("tabindex", "0");
        handle.setAttribute("role", "button");
        const tr = handle.closest("tr");

        handle.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                if (!this._rowDragActive) { 
                    this._startRowDrag(tr, row); 
                } else { 
                    this._finalizeRowDrag(); 
                }
            }
            if (this._rowDragActive && (e.code === "ArrowUp" || e.code === "ArrowDown")) {
                e.preventDefault();
                this._keyboardMovePlaceholder(e.code === "ArrowUp" ? -1 : 1);
            }
            if (this._rowDragActive && e.code === "Enter") { 
                e.preventDefault(); 
                this._finalizeRowDrag(); 
            }
            if (this._rowDragActive && e.code === "Escape") { 
                e.preventDefault(); 
                this._cancelRowDrag(); 
            }
        });

        handle.addEventListener("dragstart", (e) => {
            this._startRowDrag(tr, row);
            const img = document.createElement("canvas");
            img.width = img.height = 1;
            e.dataTransfer.setDragImage(img, 0, 0);
        });
        handle.addEventListener("dragend", () => {
            if (this._rowDragActive) { 
                this._finalizeRowDrag(); 
            }
        });
    }

    /**
     * Starts a row drag operation (block aware).
     * @param {HTMLTableRowElement} tr Row element.
     * @param {Object} row Row object.
     */
    _startRowDrag(tr, row) {
        this._draggedRow = row;
        this._draggedRowParent = row.parent || null;
        this._dragRowTargetParent = null;
        this._dragRowInsertIndex = null;
        this._dragRowTargetMode = null;
        this._rowDragActive = true;

        const block = [tr];
        let next = tr.nextSibling;
        while (next && next._dataRowRef && this._isDescendant(next._dataRowRef, row)) {
            block.push(next);
            next = next.nextSibling;
        }
        this._draggedRowBlockTrs = block;
        tr.classList.add("wx-table-dragging");

        const totalHeight = block.reduce((h, t) => h + t.getBoundingClientRect().height, 0);
        this._rowPlaceholder = document.createElement("tr");
        this._rowPlaceholder.className = "wx-table-drag-placeholder";
        this._rowPlaceholder.style.height = totalHeight + "px";

        const visibleCols = this.getVisibleColumns().length
            + (this._movableRow ? 1 : 0)
            + (this._hasOptions || this._options.length > 0 || this._allowColumnRemove ? 1 : 0);
        for (let i = 0; i < visibleCols; i++) {
            const td = document.createElement("td");
            td.innerHTML = "&nbsp;";
            this._rowPlaceholder.appendChild(td);
        }

        tr.parentNode.insertBefore(this._rowPlaceholder, block[block.length - 1].nextSibling);

        if (!this._body._rowDragBound) {
            this._body.addEventListener("dragover", (e) => this._onTbodyDragOver(e));
            this._body.addEventListener("drop", (e) => {
                e.preventDefault();
                if (this._rowDragActive) { 
                    this._finalizeRowDrag(); 
                }
            });
            this._body._rowDragBound = true;
        }
        this._autoScrollInterval = setInterval(() => this._autoScrollCheck(), 30);
    }

    /**
     * Returns true if candidate is descendant of ancestor.
     * @param {Object} candidate Candidate row.
     * @param {Object} ancestor Ancestor row.
     * @returns {boolean} True if descendant.
     */
    _isDescendant(candidate, ancestor) {
        let p = candidate.parent;
        while (p) {
            if (p === ancestor) { 
                return true; 
            }
            p = p.parent;
        }
        return false;
    }

    /**
     * Moves placeholder by keyboard within siblings.
     * @param {number} delta Direction (+/-).
     */
    _keyboardMovePlaceholder(delta) {
        const siblings = this._getDragSiblings();
        if (!siblings.length) { 
            return; 
        }
        const currentIndex = this._getPlaceholderSiblingIndex(siblings);
        const target = Math.min(Math.max(currentIndex + delta, 0), siblings.length);
        this._movePlaceholderToSiblingIndex(siblings, target);
        this._dragRowTargetParent = this._draggedRowParent;
        this._dragRowTargetMode = null;
        this._dragRowInsertIndex = target;
    }

    /**
     * Handles dragover events inside tbody for row dragging.
     * @param {DragEvent} e Event.
     */
    _onTbodyDragOver(e) {
        if (!this._rowDragActive || !this._rowPlaceholder) { 
            return; 
        }
        e.preventDefault();
        this._lastPointerY = e.clientY;

        const tr = e.target.closest("tr");
        if (!tr || !tr._dataRowRef) { 
            return; 
        }
        const candidate = tr._dataRowRef;

        if (candidate === this._draggedRow) { 
            return; 
        }
        if (this._isDescendant(candidate, this._draggedRow)) { 
            return; 
        }

        const rect = tr.getBoundingClientRect();
        const y = e.clientY;
        const topZone = rect.top + rect.height * 0.25;
        const bottomZone = rect.bottom - rect.height * 0.25;

        let mode = "child";
        if (y < topZone) { 
            mode = "before"; 
        } else if (y > bottomZone) { 
            mode = "after"; 
        }

        if (mode === "child") {
            this._dragRowTargetParent = candidate;
            this._dragRowInsertIndex = candidate.children ? candidate.children.length : 0;
            this._dragRowTargetMode = "child";
            const endTr = this._getRowBlockEndTr(candidate);
            if (endTr.nextSibling !== this._rowPlaceholder) {
                endTr.parentNode.insertBefore(this._rowPlaceholder, endTr.nextSibling);
            }
        } else if (mode === "before") {
            const parent = candidate.parent || null;
            const idx = (parent ? parent.children : this._rows).indexOf(candidate);
            this._dragRowTargetParent = parent;
            this._dragRowInsertIndex = idx;
            this._dragRowTargetMode = "before";
            if (tr !== this._rowPlaceholder.nextSibling) {
                tr.parentNode.insertBefore(this._rowPlaceholder, tr);
            }
        } else {
            const parent = candidate.parent || null;
            const siblings = parent ? parent.children : this._rows;
            const idx = siblings.indexOf(candidate);
            this._dragRowTargetParent = parent;
            this._dragRowInsertIndex = idx + 1;
            this._dragRowTargetMode = "after";
            const endTr = this._getRowBlockEndTr(candidate);
            if (endTr.nextSibling !== this._rowPlaceholder) {
                endTr.parentNode.insertBefore(this._rowPlaceholder, endTr.nextSibling);
            }
        }
    }

    /**
     * Moves placeholder to given sibling index.
     * @param {Array<Object>} siblings Sibling rows.
     * @param {number} index Target index.
     */
    _movePlaceholderToSiblingIndex(siblings, index) {
        if (!this._rowPlaceholder) { 
            return; 
        }
        if (index >= siblings.length) {
            const last = siblings[siblings.length - 1];
            if (!last) { 
                return; 
            }
            const lastBlockEnd = this._getRowBlockEndTr(last);
            if (lastBlockEnd.nextSibling !== this._rowPlaceholder) {
                lastBlockEnd.parentNode.insertBefore(this._rowPlaceholder, lastBlockEnd.nextSibling);
            }
        } else {
            const anchor = siblings[index]._anchorTr;
            if (anchor !== this._rowPlaceholder.nextSibling) {
                anchor.parentNode.insertBefore(this._rowPlaceholder, anchor);
            }
        }
    }

    /**
     * Returns last tr belonging to hierarchical block.
     * @param {Object} row Row.
     * @returns {HTMLTableRowElement} Last tr.
     */
    _getRowBlockEndTr(row) {
        let end = row._anchorTr;
        let next = end.nextSibling;
        while (next && next._dataRowRef && this._isDescendant(next._dataRowRef, row)) {
            end = next;
            next = next.nextSibling;
        }
        return end;
    }

    /**
     * Returns siblings excluding dragged row.
     * @returns {Array<Object>} Siblings.
     */
    _getDragSiblings() {
        if (!this._draggedRow) { 
            return []; 
        }
        const base = (this._draggedRowParent ? this._draggedRowParent.children : this._rows);
        return base.filter(r => r !== this._draggedRow);
    }

    /**
     * Returns placeholder index among siblings.
     * @param {Array<Object>} siblings Sibling rows.
     * @returns {number} Index.
     */
    _getPlaceholderSiblingIndex(siblings) {
        if (!this._rowPlaceholder) { 
            return -1; 
        }
        const ordered = [...siblings];
        for (let i = 0; i < ordered.length; i++) {
            const anchor = ordered[i]._anchorTr;
            if (this._rowPlaceholder.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING) {
                return i;
            }
        }
        return ordered.length;
    }

    /**
     * Performs auto-scroll during row drag.
     */
    _autoScrollCheck() {
        if (!this._rowDragActive) { 
            return; 
        }
        if (this._lastPointerY == null) { 
            return; 
        }
        const container = this._table.parentElement || document.scrollingElement;
        const rect = container.getBoundingClientRect();
        const threshold = 40;
        if (this._lastPointerY < rect.top + threshold) { 
            container.scrollTop -= 10; 
        } else if (this._lastPointerY > rect.bottom - threshold) { 
            container.scrollTop += 10; 
        }
    }

    /**
     * Finalizes row drag repositioning.
     */
    _finalizeRowDrag() {
        if (!this._rowDragActive) { 
            return; 
        }

        const sourceParent = this._draggedRowParent;
        let targetParent = this._dragRowTargetParent;
        let insertIndex = this._dragRowInsertIndex;

        if (targetParent == null && insertIndex == null) {
            targetParent = sourceParent;
            const siblingsArr = (sourceParent ? sourceParent.children : this._rows);
            const others = siblingsArr.filter(r => r !== this._draggedRow);
            let idx = others.length;
            for (let i = 0; i < others.length; i++) {
                const anchor = others[i]._anchorTr;
                if (this._rowPlaceholder.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    idx = i;
                    break;
                }
            }
            insertIndex = idx;
        }

        if (targetParent && this._isDescendant(targetParent, this._draggedRow)) {
            this._cleanupRowDrag();
            this.render();
            return;
        }

        const oldParentId = sourceParent ? sourceParent.id : null;
        const newParentId = targetParent ? targetParent.id : null;

        const oldSiblings = sourceParent ? sourceParent.children : this._rows;
        const oldIndex = oldSiblings.indexOf(this._draggedRow);
        if (oldIndex >= 0) { 
            oldSiblings.splice(oldIndex, 1); 
        }

        if (targetParent === sourceParent && insertIndex != null && oldIndex < insertIndex) { 
            insertIndex -= 1; 
        }

        const newSiblings = targetParent ? targetParent.children : this._rows;
        if (insertIndex == null || insertIndex < 0) { 
            insertIndex = newSiblings.length; 
        }
        insertIndex = Math.min(insertIndex, newSiblings.length);
        newSiblings.splice(insertIndex, 0, this._draggedRow);
        this._draggedRow.parent = targetParent || null;

        if (this._dragRowTargetMode === "child" && targetParent && !targetParent.expanded) { 
            targetParent.expanded = true; 
        }

        const previousOrder = [];
        this._util.dispatch(webexpress.webui.Event.ROW_REORDER_EVENT, {
            sender: this._element,
            newOrder: newSiblings,
            previousOrder: previousOrder,
            parentId: targetParent ? targetParent.id : null
        });

        this._dispatchMove({
            kind: "row",
            action: "move",
            rowId: this._draggedRow.id || null,
            oldParentId,
            newParentId,
            index: insertIndex
        });

        this._cleanupRowDrag();
        this._schedulePersist();
        this.render();
    }

    /**
     * Cancels current row drag.
     */
    _cancelRowDrag() {
        if (!this._rowDragActive) { 
            return; 
        }
        this._cleanupRowDrag();
        this.render();
    }

    /**
     * Cleans all temporary row drag state.
     */
    _cleanupRowDrag() {
        if (this._rowPlaceholder && this._rowPlaceholder.parentNode) {
            this._rowPlaceholder.parentNode.removeChild(this._rowPlaceholder);
        }
        this._rowPlaceholder = null;
        if (this._draggedRowBlockTrs) {
            this._draggedRowBlockTrs.forEach(tr => tr.classList.remove("wx-table-dragging"));
        }
        this._draggedRowBlockTrs = null;
        this._draggedRow = null;
        this._draggedRowParent = null;
        this._rowDragActive = false;
        this._lastPointerY = null;
        this._dragRowTargetParent = null;
        this._dragRowInsertIndex = null;
        this._dragRowTargetMode = null;
        if (this._autoScrollInterval) {
            clearInterval(this._autoScrollInterval);
            this._autoScrollInterval = null;
        }
    }

    /**
     * Enables column drag (ctrl+drag) with indicator (external css).
     * @param {HTMLElement} th Header cell.
     * @param {Object} column Column object.
     */
    _enableDragAndDropColumn(th, column) {
        th.draggable = true;
        th.addEventListener("dragstart", (e) => {
            if (!e.ctrlKey) { 
                e.preventDefault(); 
                return; 
            }
            if (e.target.closest(".wx-table-column-resizer")) { 
                e.preventDefault(); 
                return; 
            }
            if (e.target.closest(".wx-table-col-remove")) { 
                e.preventDefault(); 
                return; 
            }
            this._draggedColumn = column;
            th.classList.add("wx-table-dragging");
        });
        th.addEventListener("dragend", () => {
            th.classList.remove("wx-table-dragging");
            this._dragColumnIndicator.style.display = "none";
            this._draggedColumn = null;
        });
        th.addEventListener("dragover", (e) => {
            if (!this._draggedColumn) { 
                return; 
            }
            e.preventDefault();
            const rect = th.getBoundingClientRect();
            const x = e.clientX;
            const leftSide = x < rect.left + th.offsetWidth / 2;
            this._dragColumnIndicator.style.top = rect.top + "px";
            this._dragColumnIndicator.style.left = (leftSide ? rect.left - 1 : rect.left + th.offsetWidth - 1) + "px";
            this._dragColumnIndicator.style.height = rect.height + "px";
            this._dragColumnIndicator.style.display = "block";
        });
        th.addEventListener("dragleave", (ev) => {
            setTimeout(() => {
                if (!this._draggedColumn) { 
                    return; 
                }
                const rel = document.elementFromPoint(ev.clientX, ev.clientY);
                if (!rel || !rel.closest("thead")) {
                    this._dragColumnIndicator.style.display = "none";
                }
            }, 10);
        });
        th.addEventListener("drop", (e) => {
            e.preventDefault();
            if (this._draggedColumn === null || column === null || this._draggedColumn === column) { 
                return; 
            }
            const sourceIndex = this._columns.indexOf(this._draggedColumn);
            const targetIndex = this._columns.indexOf(column);
            if (sourceIndex === -1 || targetIndex === -1) { 
                return; 
            }
            const rect = th.getBoundingClientRect();
            const x = e.clientX;
            const insertBefore = x < rect.left + th.offsetWidth / 2;
            let adjusted = targetIndex;
            if (insertBefore) {
                if (sourceIndex < targetIndex) { 
                    adjusted -= 1; 
                }
            } else {
                if (sourceIndex > targetIndex) { 
                    adjusted += 1; 
                }
            }
            if (sourceIndex === adjusted) {
                this._dragColumnIndicator.style.display = "none";
                this._draggedColumn = null;
                return;
            }
            const previousOrder = this._getColumnOrder();
            const moved = this._columns.splice(sourceIndex, 1)[0];
            this._columns.splice(adjusted, 0, moved);
            this._rows.forEach(r => {
                if (!Array.isArray(r.cells)) { 
                    return; 
                }
                if (sourceIndex < 0 || sourceIndex >= r.cells.length) { 
                    return; 
                }
                const movedCell = r.cells.splice(sourceIndex, 1)[0];
                const targetPos = Math.min(Math.max(adjusted, 0), r.cells.length);
                r.cells.splice(targetPos, 0, movedCell);
                this._reorderChildCells(r.children, sourceIndex, adjusted);
            });
            this._dragColumnIndicator.style.display = "none";
            this._draggedColumn = null;
            this._triggerColumnReorderEvent(sourceIndex, adjusted);
            this._dispatchMassColumnReorder(previousOrder, this._getColumnOrder());
            this._schedulePersist();
            this.render();
            this._dispatchMove({
                kind: "column",
                action: "move",
                sourceIndex,
                targetIndex: adjusted,
                order: this._getColumnOrder(),
                previousOrder
            });
        });
    }

    /**
     * Reorders child cells recursively.
     * @param {Array<Object>} children Child rows.
     * @param {number} sourceIndex Source index.
     * @param {number} adjusted Target index.
     */
    _reorderChildCells(children, sourceIndex, adjusted) {
        if (!children) { 
            return; 
        }
        for (const ch of children) {
            if (Array.isArray(ch.cells) && sourceIndex >= 0 && sourceIndex < ch.cells.length) {
                const movedCell = ch.cells.splice(sourceIndex, 1)[0];
                const targetPos = Math.min(Math.max(adjusted, 0), ch.cells.length);
                ch.cells.splice(targetPos, 0, movedCell);
            }
            if (ch.children && ch.children.length) { 
                this._reorderChildCells(ch.children, sourceIndex, adjusted); 
            }
        }
    }

    /**
     * Enables sorting on header click (cycle).
     * @param {HTMLElement} th Header cell.
     * @param {Object} column Column object.
     */
    _enableSortColumns(th, column) {
        th.addEventListener("click", (ev) => {
            if (ev.target.closest(".wx-table-col-remove")) { 
                return; 
            }
            if (th.classList.contains("wx-table-actions")) { 
                return; 
            }
            const prev = column.sort;
            const next = prev === "asc" ? "desc" : (prev === "desc" ? null : "asc");
            this._columns.forEach(c => c.sort = null);
            this._head.querySelectorAll("th").forEach(h => h.classList.remove("wx-sort-asc", "wx-sort-desc"));
            column.sort = next;
            if (next) {
                th.classList.add(next === "asc" ? "wx-sort-asc" : "wx-sort-desc");
                this.orderRows(column);
            } else {
                this._schedulePersist();
                this.render();
            }
            this._util.dispatch(webexpress.webui.Event.TABLE_SORT_EVENT, {
                sender: this._element,
                columnId: column.id,
                sortDirection: column.sort,
                columnLabel: th.textContent.trim()
            });
        });
    }

    /**
     * Adds a resize handle to header.
     * @param {HTMLElement} th Header cell.
     * @param {Object} column Column object.
     */
    _enableResizableColumns(th, column) {
        const resizer = document.createElement("div");
        resizer.className = "wx-table-column-resizer";
        resizer.addEventListener("click", (e) => e.stopPropagation());
        resizer.addEventListener("mousedown", (e) => this._onResizeStart(e, th, column));
        th.style.position = "relative";
        th.appendChild(resizer);
    }

    /**
     * Starts column resize.
     * @param {MouseEvent} e Mouse event.
     * @param {HTMLElement} th Header cell.
     * @param {Object} column Column object.
     */
    _onResizeStart(e, th, column) {
        this._resizingColumn = th;
        this._resizeStartX = e.pageX;
        this._resizeStartWidth = th.offsetWidth;
        document.body.classList.add("wx-table-resizing");
        document.addEventListener("mousemove", this._resizeMoveHandler = (ev) => this._onResize(ev, th, column));
        document.addEventListener("mouseup", this._resizeEndHandler = () => this._onResizeEnd(th));
    }

    /**
     * Handles live resizing.
     * @param {MouseEvent} e Mouse event.
     * @param {HTMLElement} th Header cell.
     * @param {Object} column Column object.
     */
    _onResize(e, th, column) {
        if (!this._resizingColumn || this._resizingColumn !== th) { 
            return; 
        }
        const dx = e.pageX - this._resizeStartX;
        const w = Math.max(this._resizeStartWidth + dx, webexpress.webui.TableCtrl.MIN_COL_WIDTH);
        th.style.width = w + "px";
        column.width = w;
        this._applyWidthToColElement(column.id, w);
    }

    /**
     * Ends column resize and persists.
     * @param {HTMLElement} th Header cell.
     */
    _onResizeEnd(th) {
        if (!this._resizingColumn || this._resizingColumn !== th) { 
            return; 
        }
        document.body.classList.remove("wx-table-resizing");
        document.removeEventListener("mousemove", this._resizeMoveHandler);
        document.removeEventListener("mouseup", this._resizeEndHandler);
        this._resizingColumn = null;
        this._resizeStartX = null;
        this._resizeStartWidth = null;
        this._schedulePersist();
    }

    /**
     * Binds inline edit SAVE event -> update snapshot + flash (if enabled).
     */
    _bindInlineEditSaveListener() {
        if (!webexpress?.webui?.Event?.SAVE_INLINE_EDIT_EVENT) { 
            return; 
        }
        document.addEventListener(webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT, (e) => {
            const src = e.detail?.sender instanceof HTMLElement ? e.detail?.sender : null;
            if (!src) { 
                return; 
            }
            const tbl = src.closest("table");
            if (tbl !== this._table) { 
                return; 
            }
            const tr = src.closest("tr");
            if (!tr || !tr._dataRowRef) { 
                return; 
            }
            this._updateRowSnapshotFromDom(tr._dataRowRef);
            this._flashRow(tr._dataRowRef);
        });
    }

    /**
     * Updates snapshot entry for a row after edit.
     * @param {Object} row Row object.
     */
    _updateRowSnapshotFromDom(row) {
        const key = this._getRowKey(row);
        if (!key) { 
            return; 
        }
        const sig = this._computeRowSignature(row);
        this._prevRowState.set(key, sig);
    }

    /**
     * Schedules a debounced persist.
     */
    _schedulePersist() {
        if (!this._persistKey) { 
            return; 
        }
        if (this._saveDebounceTimer) { 
            clearTimeout(this._saveDebounceTimer); 
        }
        this._saveDebounceTimer = setTimeout(() => this._persistState(), 150);
    }

    /**
     * Persists state to cookie.
     */
    _persistState() {
        if (!this._persistKey) { 
            return; 
        }
        const collapsed = [];
        this._traverseRows(this._rows, (r) => {
            if (r.id && r.expanded === false && r.children && r.children.length) { 
                collapsed.push(r.id); 
            }
        });
        const state = {
            v: 1,
            cols: this._columns.map(c => ({ id: c.id, visible: c.visible, width: c.width })),
            order: this._getColumnOrder(),
            sort: (() => { 
                const s = this._columns.find(c => c.sort); 
                return s ? { id: s.id, dir: s.sort } : null; 
            })(),
            tree: { collapsed: collapsed }
        };
        const json = encodeURIComponent(JSON.stringify(state));
        this._setCookie(this._persistKey, json, 365);
    }

    /**
     * Loads persisted state from cookie.
     */
    _loadStateFromCookie() {
        const raw = this._getCookie(this._persistKey);
        if (!raw) { 
            return; 
        }
        try {
            const obj = JSON.parse(decodeURIComponent(raw));
            if (!obj || obj.v !== 1) { 
                return; 
            }

            if (Array.isArray(obj.order) && obj.order.length) {
                const map = new Map(this._columns.map(c => [c.id, c]));
                const reordered = [];
                obj.order.forEach(id => { if (map.has(id)) { reordered.push(map.get(id)); } });
                this._columns.forEach(c => { if (!reordered.includes(c)) { reordered.push(c); } });
                this._columns = reordered;
            }
            if (Array.isArray(obj.cols)) {
                const cmap = new Map(obj.cols.map(c => [c.id, c]));
                this._columns.forEach(c => {
                    if (cmap.has(c.id)) {
                        const s = cmap.get(c.id);
                        if (typeof s.visible === "boolean") { 
                            c.visible = s.visible; 
                        }
                        if (s.width != null) { 
                            c.width = parseInt(s.width, 10); 
                        }
                    }
                });
            }
            if (obj.sort?.id && ["asc", "desc"].includes(obj.sort.dir)) {
                const col = this._columns.find(c => c.id === obj.sort.id);
                if (col) { 
                    col.sort = obj.sort.dir; 
                }
            }
            if (obj.tree?.collapsed?.length) { 
                this._applyCollapsedState(obj.tree.collapsed); 
            }
        } catch (_) {
            // ignore malformed state
        }
    }

    /**
     * Applies collapsed row ids to current tree.
     * @param {Array<string>} collapsedIds Collapsed id list.
     */
    _applyCollapsedState(collapsedIds) {
        if (!Array.isArray(collapsedIds) || !collapsedIds.length) { 
            return; 
        }
        const set = new Set(collapsedIds);
        this._traverseRows(this._rows, (r) => {
            if (r.id && set.has(r.id)) { 
                r.expanded = false; 
            }
        });
    }

    /**
     * Retrieves cookie value.
     * @param {string} name Cookie name.
     * @returns {string|null} Value.
     */
    _getCookie(name) {
        if (!name) { 
            return null; 
        }
        const prefix = name + "=";
        const parts = document.cookie.split(";").map(c => c.trim());
        for (const p of parts) {
            if (p.indexOf(prefix) === 0) { 
                return p.substring(prefix.length); 
            }
        }
        return null;
    }

    /**
     * Sets a cookie (SameSite=Lax).
     * @param {string} name Name.
     * @param {string} value Value.
     * @param {number} days Days to expire.
     */
    _setCookie(name, value, days) {
        const expires = (() => {
            if (!days) { 
                return ""; 
            }
            const d = new Date();
            d.setTime(d.getTime() + days * 86400000);
            return "; expires=" + d.toUTCString();
        })();
        document.cookie = name + "=" + value + expires + "; path=/; SameSite=Lax";
    }

    /**
     * Collects current row signature states.
     * @returns {Array<{row:Object,key:string,signature:string}>} State list.
     */
    _collectCurrentRowStates() {
        const list = [];
        this._traverseRows(this._rows, (r) => {
            const key = this._getRowKey(r);
            if (!key) { 
                return; 
            }
            list.push({ row: r, key, signature: this._computeRowSignature(r) });
        });
        return list;
    }

    /**
     * Computes row signature from cell text.
     * @param {Object} row Row object.
     * @returns {string} Signature.
     */
    _computeRowSignature(row) {
        const parts = [];
        if (Array.isArray(row.cells)) {
            for (const c of row.cells) {
                parts.push((c?.text || "").trim());
            }
        }
        return parts.join("|");
    }

    /**
     * Returns stable key for row.
     * @param {Object} row Row object.
     * @returns {string|null} Key.
     */
    _getRowKey(row) {
        if (!row) { 
            return null; 
        }
        if (row.id) { 
            return row.id; 
        }
        if (!row._uid) { 
            row._uid = "r_" + Math.random().toString(36).slice(2); 
        }
        return row._uid;
    }

    /**
     * Detects changed rows relative to snapshot.
     * @param {Array} currentStates Current states.
     * @returns {Array<Object>} Changed rows.
     */
    _detectChangedRows(currentStates) {
        const changed = [];
        for (const st of currentStates) {
            const prev = this._prevRowState.get(st.key);
            if (prev == null || prev !== st.signature) {
                changed.push(st.row);
            }
        }
        return changed;
    }

    /**
     * Updates snapshot map.
     * @param {Array} currentStates Current states.
     */
    _updateSnapshot(currentStates) {
        this._prevRowState.clear();
        for (const st of currentStates) {
            this._prevRowState.set(st.key, st.signature);
        }
    }

    /**
     * Highlights a changed row (if feature enabled).
     * @param {Object} row Row object.
     */
    _flashRow(row) {
        if (!this._highlightChanges) { 
            return; 
        }
        if (!row || !row._anchorTr) { 
            return; 
        }
        const tr = row._anchorTr;
        tr.classList.add("wx-row-flash");
        setTimeout(() => {
            if (tr.isConnected) { 
                tr.classList.remove("wx-row-flash"); 
            }
        }, 3000);
    }

    /**
     * Traverses rows depth-first.
     * @param {Array<Object>} rows Row list.
     * @param {Function} fn Callback.
     */
    _traverseRows(rows, fn) {
        if (!Array.isArray(rows)) { 
            return; 
        }
        for (const r of rows) {
            fn(r);
            if (r.children && r.children.length) { 
                this._traverseRows(r.children, fn); 
            }
        }
    }

    /**
     * Finds row and parent by id.
     * @param {string} id Row id.
     * @returns {{row:Object|null,parent:Object|null}|null} Result.
     */
    _findRowAndParent(id) {
        let found = null;
        const walk = (rows, parent) => {
            for (const r of rows) {
                if (r.id === id) {
                    found = { row: r, parent };
                    return true;
                }
                if (r.children && r.children.length && walk(r.children, r)) {
                    return true;
                }
            }
            return false;
        };
        walk(this._rows, null);
        return found;
    }

    /**
     * Removes row recursively.
     * @param {string} id Row id.
     * @param {Array<Object>} rows Row list.
     * @param {Object|null} parent Parent row.
     * @returns {boolean} True if removed.
     */
    _removeRowRecursive(id, rows, parent) {
        if (!Array.isArray(rows)) { 
            return false; 
        }
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (r.id === id) {
                rows.splice(i, 1);
                return true;
            }
            if (r.children && r.children.length && this._removeRowRecursive(id, r.children, r)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Dispatches visibility change event.
     * @param {Object} payload Event payload.
     */
    _dispatchVisibilityChange(payload) {
        this._util.dispatch(webexpress?.webui?.Event?.CHANGE_VISIBILITY_EVENT, Object.assign({ sender: this._element }, payload));
    }

    /**
     * Dispatches generic move event.
     * @param {Object} payload Data.
     */
    _dispatchMove(payload) {
        this._util.dispatch(webexpress?.webui?.Event?.MOVE_EVENT, Object.assign({ sender: this._element }, payload));
    }

    /**
     * Dispatches mass column reorder event.
     * @param {Array<string>} previousOrder Previous order.
     * @param {Array<string>} newOrder New order.
     */
    _dispatchMassColumnReorder(previousOrder, newOrder) {
        this._util.dispatch(webexpress.webui.Event.COLUMN_REORDER_EVENT, {
            sender: this._element,
            sourceIndex: -1,
            targetIndex: -1,
            previousOrder,
            newOrder,
            columns: this._columns
        });
    }

    /**
     * Triggers single column reorder event.
     * @param {number} sourceIndex Source index.
     * @param {number} targetIndex Target index.
     */
    _triggerColumnReorderEvent(sourceIndex, targetIndex) {
        this._util.dispatch(webexpress.webui.Event.COLUMN_REORDER_EVENT, {
            sender: this._element,
            sourceIndex,
            targetIndex,
            columns: this._columns
        });
    }

    /**
     * Rebuilds column index cache.
     */
    _rebuildColumnIndexCache() {
        this._colIndexCache = new Map();
        this._columns.forEach((c, i) => this._colIndexCache.set(c.id, i));
    }
};

// register class
webexpress.webui.Controller.registerClass("wx-webui-table", webexpress.webui.TableCtrl);