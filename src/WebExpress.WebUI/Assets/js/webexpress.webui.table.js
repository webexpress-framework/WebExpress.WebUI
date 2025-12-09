/**
 * Table controller providing declarative parsing, sorting, rendering, and optional column resizing.
 * Responsibilities:
 * - parse column, row, footer, and option structures from markup
 * - render colgroup, header, body, and footer using document fragments to minimize reflows
 * - provide column sort interactions and stable sorting behavior
 * - column resizing via header-attached resizer handles
 *
 * Emitted events:
 * - webexpress.webui.Event.TABLE_SORT_EVENT
 */
webexpress.webui.TableCtrl = class extends webexpress.webui.Ctrl {

    // core elements created once and appended to host
    _table = document.createElement("table");
    _col = document.createElement("colgroup");
    _head = document.createElement("thead");
    _body = document.createElement("tbody");
    _foot = null; // create on demand only

    // data models mirroring parsed configuration
    _columns = [];
    _rows = [];
    _footer = [];
    _options = [];

    // feature flags controlling behavior
    _isTree = false;
    _suppressHeaders = false;
    _highlightChanges = true;
    _suppressFlashOnce = false;
    _columnResizeEnabled = true;
    _hasOptions = false;

    // caches for performance and diffing
    _prevRowState = new Map();
    _colIndexCache = new Map();

    // render batching to avoid redundant renders within a microtask
    _renderScheduled = false;

    // interaction state flags
    _isResizing = false; // inline comment: lock to suppress sort during resize

    static MIN_COL_WIDTH = 30;
    static NUMERIC_RX = /^-?\d+(?:\.\d+)?$/;

    /**
     * Initialize controller and render initial state.
     * @param {HTMLElement} element Host element that contains declarative configuration.
     */
    constructor(element) {
        super(element);
        this._initialized = false; // inline comment: ensure first render is treated as initial
        this._suppressFlashOnce = true; // inline comment: suppress flash for initial render
        this._setupDom(element);
        this._parseConfig(element);
        this._initEventListeners();
        this.render();
        this._initialized = true;
    }

    /**
     * Build base DOM structure and apply initial classes from dataset.
     * Enforces fixed table layout so column widths from colgroup are respected.
     * @param {HTMLElement} element Host element.
     */
    _setupDom(element) {
        this._table.className = "wx-table table table-hover table-sm";
        const ds = element.dataset;
        if (ds.color) { this._table.classList.add(ds.color); }
        if (ds.border) { this._table.classList.add(ds.border); }
        if (ds.striped) { this._table.classList.add(...ds.striped.split(' ')); }

        // enforce fixed layout to allow shrinking columns below content width
        this._table.style.tableLayout = "fixed"; // inline comment: honor colgroup widths for sizing
        this._table.style.width = "100%"; // inline comment: ensure stable layout width

        const frag = document.createDocumentFragment();
        frag.append(this._col, this._head, this._body);
        // inline comment: tfoot is appended only when footer exists
        this._table.appendChild(frag);
    }

    /**
     * Parse declarative configuration from child nodes of the host element.
     * Cleans host inner content and mounts the constructed table.
     * @param {HTMLElement} element Host element.
     */
    _parseConfig(element) {
        this._beforeInitParse(element);

        this._options = this._parseOptions(element.querySelector(":scope > .wx-table-options"));
        this._columns = this._parseColumns(element.querySelector(":scope > .wx-table-columns"));
        this._rows = this._parseRows(element.querySelectorAll(":scope > .wx-table-row"));
        this._footer = this._parseFooter(element.querySelector(":scope > .wx-table-footer"));

        this._recalculateHasOptions(); // Check initially

        element.textContent = "";
        element.appendChild(this._table);

        ["data-color", "data-border", "data-striped"].forEach((attr) => { element.removeAttribute(attr); });
    }

    /**
     * Register event listeners for header interactions (sorting).
     * Suppresses sort when a resize gesture just occurred.
     */
    _initEventListeners() {
        this._head.addEventListener("click", (e) => {
            const th = e.target.closest("th");
            if (!th) { return; }
            if (this._isResizing) { return; }
            const colId = th.dataset.columnId;
            if (!colId || !this._colIndexCache.has(colId)) { return; }
            const col = this._columns[this._colIndexCache.get(colId)];
            if (col) { this._handleSortClick(th, col); }
        }, { passive: true });
    }

    /**
     * Hook for subclasses to preprocess the host element before parsing.
     * @param {HTMLElement} element Host element.
     */
    _beforeInitParse(element) { }

    /**
     * Enable change flash highlighting for modified and newly added rows.
     */
    enableChangeFlash() { this._highlightChanges = true; }

    /**
     * Disable change flash highlighting for modified and newly added rows.
     */
    disableChangeFlash() { this._highlightChanges = false; }

    /**
     * Enable column resizing behavior via header resizer handles.
     */
    enableColumnResize() { this._columnResizeEnabled = true; }

    /**
     * Disable column resizing behavior via header resizer handles.
     */
    disableColumnResize() { this._columnResizeEnabled = false; }

    /**
     * Recalculates the _hasOptions flag.
     * Returns true if global options exist OR if ANY row has specific options.
     */
    _recalculateHasOptions() {
        if (this._options && this._options.length > 0) {
            this._hasOptions = true;
            return;
        }

        // Deep search for row options
        const hasRowOptions = (rows) => {
            for (const r of rows) {
                if (r.options && r.options.length > 0) return true;
                if (r.children && hasRowOptions(r.children)) return true;
            }
            return false;
        };

        this._hasOptions = hasRowOptions(this._rows);
    }

    /**
     * Replace the current column definitions.
     * When preserveExisting is true, remaps existing row cells to the new column ids.
     * @param {Array<Object>} columns Column descriptors parsed or provided programmatically.
     * @param {boolean} [preserveExisting=true] Preserve existing row cell mapping where possible.
     */
    setColumns(columns, preserveExisting = true) {
        if (!Array.isArray(columns) || !columns.length) { return; }

        const prevCols = this._columns.slice();
        const prevOrder = prevCols.map((c) => c.id);

        const normalized = columns.map((c, idx) => ({
            id: c.id || `col_${idx}`,
            index: idx,
            name: c.name || null,
            label: c.label != null ? String(c.label) : (c.id || `Column ${idx + 1}`),
            icon: c.icon || null,
            image: c.image || null,
            color: c.color || null,
            width: c.width || null,
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
                    newCells[i] = (oldIdx != null && row.cells[oldIdx]) ? row.cells[oldIdx] : { text: "" };
                }
                row.cells = newCells;
                if (row.children) { row.children.forEach(remapRow); }
            };
            this._rows.forEach(remapRow);
        } else {
            const resizeRow = (r) => {
                if (!Array.isArray(r.cells)) { r.cells = []; }
                if (r.cells.length > normalized.length) { r.cells.length = normalized.length; }
                while (r.cells.length < normalized.length) { r.cells.push({ text: "" }); }
                if (r.children) { r.children.forEach(resizeRow); }
            };
            this._rows.forEach(resizeRow);
        }

        this._columns = normalized;
        this.render();
    }

    /**
     * Insert a new row at the given position, optionally under a parent row for tree structures.
     * Automatically pads cells to match the current column count.
     * @param {Object|Array} rowData Row data object or array of cell values.
     * @param {string|null} [parentId=null] Parent row id for hierarchical insertion.
     * @param {number|null} [index=null] Target index among siblings; appends when out of bounds.
     * @returns {Object|null} The inserted row object or null if parent not found.
     */
    insertRow(rowData, parentId = null, index = null) {
        const buildRow = (data) => {
            if (Array.isArray(data)) {
                return { id: null, cells: data.map((v) => ({ text: String(v ?? "") })), children: [], parent: null, expanded: true, options: null };
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
                cells: Array.isArray(data.cells) ? data.cells.map((c) => (c && typeof c === "object" ? c : { text: String(c ?? "") })) : [],
                options: Array.isArray(data.options) ? data.options : null,
                children: [],
                parent: null,
                expanded: typeof data.expanded === "boolean" ? data.expanded : true
            };
        };

        const row = buildRow(rowData);
        while (row.cells.length < this._columns.length) { row.cells.push({ text: "" }); }

        let siblings = this._rows;
        if (parentId) {
            const info = this._findRowAndParent(parentId);
            if (!info || !info.row) { return null; }
            if (!Array.isArray(info.row.children)) { info.row.children = []; }
            siblings = info.row.children;
            row.parent = info.row;
        }

        if (index == null || index < 0 || index > siblings.length) { index = siblings.length; }
        siblings.splice(index, 0, row);

        // Check if the new row introduced options, potentially enabling the column
        if (!this._hasOptions && row.options && row.options.length > 0) {
            this._hasOptions = true;
        }

        this.render();
        return row;
    }

    /**
     * Delete a row by its id. Performs a deep search across the hierarchy.
     * Triggers re-render upon successful removal.
     * @param {string} rowId Target row id.
     * @returns {boolean} True when a row was removed, false otherwise.
     */
    deleteRow(rowId) {
        if (!rowId) { return false; }
        const removed = this._removeRowRecursive(rowId, this._rows);
        if (removed) { 
            // If the removed row might have been the last one with options, recalculate
            this._recalculateHasOptions();
            this.render(); 
        }
        return removed;
    }

    /**
     * Render the table. Uses microtask batching to coalesce multiple rapid updates.
     * Performs header, body, and footer updates in a single transaction and refreshes caches.
     */
    render() {
        if (this._renderScheduled) { return; }
        this._renderScheduled = true;

        queueMicrotask(() => {
            this._renderScheduled = false;

            const currentStates = this._collectCurrentRowStates();
            const changedIds = new Set();
            const newIds = new Set();

            // inline comment: suppress flash when not initialized yet or snapshot is empty or explicitly suppressed
            const shouldHighlight = this._initialized && this._highlightChanges && !this._suppressFlashOnce && this._prevRowState.size > 0;
            if (shouldHighlight) {
                for (const entry of currentStates) {
                    const oldSig = this._prevRowState.get(entry.key);
                    if (oldSig === undefined) { newIds.add(entry.key); }
                    else if (oldSig !== entry.signature) { changedIds.add(entry.key); }
                }
            }

            this._rebuildColumnIndexCache();

            // single DOM update transaction with minimal reflows
            this._renderColumns();
            this._renderRows(changedIds, newIds);
            this._renderFooter();
            this._syncColumnWidths();
            this._attachColumnResizers(); // inline comment: ensure resizers exist after headers

            // inline comment: clear the one-shot suppression after render
            this._suppressFlashOnce = false;
            this._updateSnapshot(currentStates);
            this._initialized = true;
        });
    }

    /**
     * Render column headers and colgroup based on visibility and configured width.
     * Applies sort indicators to matching header cells.
     */
    _renderColumns() {
        const headFragment = document.createDocumentFragment();
        const colFragment = document.createDocumentFragment();
        const headRow = document.createElement("tr");
        headFragment.appendChild(headRow);

        if (!this._suppressHeaders) {
            for (const col of this._columns) {
                if (!col.visible) { continue; }

                const th = document.createElement("th");
                th.dataset.columnId = col.id;
                th.setAttribute("scope", "col");
                th.classList.add("wx-col-header");
                th.style.position = "relative"; // inline comment: allow absolute positioned resizer
                this._addClasses(th, col.color);

                if (col.sort) { th.classList.add(col.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc"); }

                const inner = document.createElement("div");
                inner.className = "wx-col-inner";
                if (col.icon) { inner.appendChild(this._createIcon(col.icon)); }
                if (col.image) { inner.appendChild(this._createImage(col.image)); }
                inner.appendChild(document.createTextNode(col.label));
                th.appendChild(inner);

                headRow.appendChild(th);

                const cg = document.createElement("col");
                cg.dataset.columnId = col.id;
                if (col.width) { cg.style.width = `${col.width}px`; }
                colFragment.appendChild(cg);
            }
            
            // right actions cell with custom toggle (opens dynamic modal panels)
            if (this._hasOptions) {
                this._renderActionsHeader(headRow, colFragment);
            }
        }

        this._head.textContent = "";
        this._head.appendChild(headFragment);

        this._col.textContent = "";
        this._col.appendChild(colFragment);
    }
    
    /**
     * Render actions header: provides a button to open the dynamic columns modal.
     * @param {HTMLElement} headRow Header row element to append actions th.
     * @param {DocumentFragment} colFrag Colgroup fragment to append actions col.
     */
    _renderActionsHeader(headRow, colFrag) {
        const th = document.createElement("th");
        th.className = "wx-table-actions";

        headRow.appendChild(th);

        const cg = document.createElement("col");
        cg.style.width = "1.5rem";
        colFrag.appendChild(cg);
    }

    /**
     * Render all rows depth-first and apply change/new flash classes based on diffing.
     * @param {Set<string>} changedIds Keys for rows with modified signatures.
     * @param {Set<string>} newIds Keys for newly seen rows.
     */
    _renderRows(changedIds, newIds) {
        const fragment = document.createDocumentFragment();
        const renderList = (rows, depth) => {
            for (const r of rows) {
                this._addRow(r, depth, fragment, changedIds, newIds);
                if (r.children?.length && r.expanded) { renderList(r.children, depth + 1); }
            }
        };
        if (this._rows.length) { renderList(this._rows, 0); }
        this._body.textContent = "";
        this._body.appendChild(fragment);
    }

    /**
     * Create and append a single row element including its cells and optional tree toggle control.
     * Wraps first visible cell content with link/icon when row URI or icon is set.
     * Also ensures cells can be narrower than content without layout overflow.
     * @param {Object} row Row data object.
     * @param {number} depth Current hierarchy depth used for indenting.
     * @param {DocumentFragment} fragment Target fragment to append the row.
     * @param {Set<string>} changedIds Keys with changed signatures.
     * @param {Set<string>} newIds Keys for new rows.
     */
    _addRow(row, depth, fragment, changedIds, newIds) {
        const tr = document.createElement("tr");
        this._addClasses(tr, row.color);
        this._addClasses(tr, row.class);
        if (row.style) { tr.style.cssText = row.style; }

        const key = this._getRowKey(row);
        if (key) {
            if (changedIds.has(key)) { tr.classList.add("wx-change-flash"); }
            else if (newIds.has(key)) { tr.classList.add("wx-new-flash"); }
        }

        tr._dataRowRef = row;
        row._anchorTr = tr;
        row._depth = depth;

        let firstVisible = true;
        const len = this._columns.length;

        for (let i = 0; i < len; i++) {
            const colDef = this._columns[i];
            if (!colDef.visible) { continue; }

            const td = document.createElement("td");
            // allow shrinking without visual overflow
            td.style.overflow = "hidden"; // inline comment: clip overflowing content when column is narrow

            const cell = row.cells[i];

            if (cell) {
                this._addClasses(td, cell.color);
                this._addClasses(td, cell.class);
                if (cell.style) { td.style.cssText += (td.style.cssText ? "; " : "") + cell.style; }

                let content = this._renderCell(row, colDef, cell, firstVisible);

                if (firstVisible && (row.uri || row.icon)) {
                    const wrap = row.uri ? document.createElement("a") : document.createElement("span");
                    wrap.className = "wx-cell-content";
                    if (row.uri) {
                        wrap.href = row.uri;
                        if (row.target) { wrap.target = row.target; }
                        wrap.rel = "noopener noreferrer"; // inline comment: improve security of external links
                    }
                    if (row.icon) { const icon = document.createElement("i"); icon.className = row.icon; wrap.appendChild(icon); }
                    if (content instanceof Node) { wrap.appendChild(content); } else { wrap.appendChild(document.createTextNode(String(content ?? ""))); }
                    content = wrap;
                }

                if (content instanceof Node) { td.appendChild(content); } else { td.textContent = String(content ?? ""); }
            } else {
                td.textContent = "";
            }

            tr.appendChild(td);
            firstVisible = false;
        }
        
        // right options cell (only if needed)
        if (this._hasOptions) {
            const tdOpt = document.createElement("td");
            tdOpt.className = "wx-table-actions";
            
            // Check if this specific row has options OR global options exist
            const effectiveOptions = (row.options && row.options.length) ? row.options : this._options;
            
            if (effectiveOptions && effectiveOptions.length > 0) {
                const div = document.createElement("div");
                div.dataset.icon = "fas fa-cog";
                div.dataset.size = "btn-sm";
                div.dataset.border = "false";
                tdOpt.appendChild(div);
                new webexpress.webui.DropdownCtrl(div).items = effectiveOptions;
            }
            tr.appendChild(tdOpt);
        }

        // inline comment: no actions/options cell in base controller
        if (this._isTree) { this._injectTreeToggle(tr, row, depth); }
        fragment.appendChild(tr);
    }

    /**
     * Render the content for a single cell using a renderer template when available.
     * Falls back to plain text when no renderer is defined or an error occurs.
     * @param {Object} row Row data object.
     * @param {Object} colDef Column definition.
     * @param {Object} cell Cell definition.
     * @param {boolean} isFirstVisible Whether this is the first visible column in the row.
     * @returns {string|HTMLElement} Rendered content node or text.
     */
    _renderCell(row, colDef, cell, isFirstVisible) {
        const type = cell?.type || colDef.rendererType;
        const tmpl = type ? webexpress.webui.TableTemplates.get(type) : null;

        if (tmpl) {
            try {
                const opts = Object.assign({}, tmpl.options, colDef.rendererOptions || {});
                return tmpl.fn(cell?.text, cell, row, opts);
            } catch (e) {
                console.error("renderer error", e); // inline comment: keep errors simple
                return "Error";
            }
        }
        return cell?.text ?? "";
    }

    /**
     * Render footer row according to configured footer cells and visible columns.
     * When no footer is configured, removes any existing tfoot from the DOM.
     */
    _renderFooter() {
        if (!this._footer.length) {
            if (this._foot && this._foot.parentNode) { this._foot.parentNode.removeChild(this._foot); }
            this._foot = null;
            return;
        }

        if (!this._foot) {
            this._foot = document.createElement("tfoot");
            this._table.appendChild(this._foot);
        }

        this._foot.textContent = "";
        const tr = document.createElement("tr");

        for (let i = 0; i < this._columns.length; i++) {
            const col = this._columns[i];
            if (!col.visible) { continue; }
            const td = document.createElement("td");
            td.style.overflow = "hidden"; // inline comment: clip overflow like body cells
            if (this._footer[i] != null) { td.innerHTML = this._footer[i]; }
            tr.appendChild(td);
        }

        this._foot.appendChild(tr);
    }

    /**
     * Handle sort interaction for a header cell and toggle direction.
     * Clears sort state on other columns and triggers reordering or full re-render.
     * Dispatches a sorting event to inform external listeners.
     * @param {HTMLElement} th Target header cell.
     * @param {Object} col Column descriptor.
     */
    _handleSortClick(th, col) {
        const next = col.sort === "asc" ? "desc" : (col.sort === "desc" ? null : "asc");
        for (const c of this._columns) { c.sort = null; }
        col.sort = next;
        if (next) { this.orderRows(col); } else { this.render(); }
        this._dispatch(webexpress.webui.Event.TABLE_SORT_EVENT, { sender: this._element, columnId: col.id, sortDirection: col.sort });
    }

    /**
     * Order top-level rows by a column definition with stable sort semantics.
     * Numeric columns are detected via a regex; string comparison uses localeCompare with numeric option.
     * @param {Object} column Column descriptor containing index and sort direction.
     */
    orderRows(column) {
        const idx = column.index;
        if (idx === undefined) { return; }
        const numeric = this._rows.every((r) => {
            const v = r.cells[idx]?.text?.trim();
            return !v || webexpress.webui.TableCtrl.NUMERIC_RX.test(v);
        });
        const dir = column.sort === "asc" ? 1 : -1;

        // stable sort by decorating with original indices
        const decorated = this._rows.map((row, i) => ({ row, i }));
        decorated.sort((a, b) => {
            const va = a.row.cells[idx]?.text || "";
            const vb = b.row.cells[idx]?.text || "";
            let cmp;
            if (numeric) { cmp = ((parseFloat(va) || 0) - (parseFloat(vb) || 0)); }
            else { cmp = va.localeCompare(vb, undefined, { numeric: true }); }
            if (cmp === 0) { return a.i - b.i; }
            return cmp * dir;
        });
        this._rows = decorated.map((d) => d.row);
        this.render();
    }

    /**
     * Parse column definitions from a .wx-table-columns container.
     * Supports inline data-type and template[data-type] renderer declarations with dataset options.
     * @param {HTMLElement|null} div Columns container element.
     * @returns {Array<Object>} Parsed column descriptors.
     */
    _parseColumns(div) {
        if (!div) { return []; }
        if (div.dataset.color) { this._head.classList.add(div.dataset.color); }
        this._suppressHeaders = div.dataset.suppressHeaders === "true";

        return Array.from(div.children).map((el, idx) => {
            const typeEl = el.querySelector(":scope > [data-type], :scope > template[data-type]");
            const rendererType = typeEl?.dataset.type || el.dataset.type || null;
            const rendererOptions = typeEl ? Object.assign({}, typeEl.dataset) : Object.assign({}, el.dataset);

            if (typeEl) {
                const src = (typeEl.tagName === "TEMPLATE") ? typeEl.content.children : typeEl.children;
                if (src.length) { rendererOptions.children = Array.from(src); }
            }

            return {
                id: el.id || `col_${idx}`,
                index: idx,
                label: el.dataset.label || "",
                name: el.dataset.objectName || null,
                icon: el.dataset.icon || null,
                image: el.dataset.image || null,
                color: el.dataset.color || null,
                width: el.getAttribute("width") ? parseInt(el.getAttribute("width"), 10) : null,
                sort: el.dataset.sort || null,
                visible: el.dataset.visible !== "false",
                rendererType,
                rendererOptions
            };
        });
    }

    /**
     * Parse rows from a collection of .wx-table-row elements, supporting nested hierarchy.
     * Options and footer elements are ignored within row parsing.
     * @param {HTMLCollection|Array<HTMLElement>} divs Collection of row container elements.
     * @param {Object|null} [parent=null] Parent row object for nested rows.
     * @returns {Array<Object>} Parsed row descriptors including children.
     */
    _parseRows(divs, parent = null) {
        const rows = [];
        for (const div of divs) {
            if (!div.classList.contains("wx-table-row")) { continue; }

            const row = {
                id: div.id || null,
                class: div.className,
                style: div.getAttribute("style"),
                color: div.dataset.color,
                image: div.dataset.image,
                icon: div.dataset.icon,
                uri: div.dataset.uri || div.dataset.url,
                target: div.dataset.target,
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
                    row.cells.push({
                        text: child.textContent.trim(),
                        id: child.id,
                        class: child.className,
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
            if (childRows.length) { row.children = this._parseRows(childRows, row); }
            rows.push(row);
        }
        return rows;
    }

    /**
     * Parse dropdown options from a .wx-table-options container.
     * Supports headers, dividers, and action entries with optional link/target and disabled state.
     * @param {HTMLElement|null} div Options container element.
     * @returns {Array<Object>} Parsed option descriptors.
     */
    _parseOptions(div) {
        if (!div) { return []; }
        return Array.from(div.children).map((el) => {
            const cls = el.classList;
            if (cls.contains("wx-dropdown-divider") || cls.contains("wx-dropdownbutton-divider")) { 
                return { type: "divider" }; 
            }
            if (cls.contains("wx-dropdown-header")) { 
                return { type: "header", content: el.textContent.trim(), icon: el.dataset.icon }; 
            }
            return {
                content: el.textContent.trim(),
                id: el.id,
                icon: el.dataset.icon,
                image: el.dataset.image,
                uri: el.dataset.uri || el.dataset.url,
                target: el.dataset.target,
                modal: el.dataset.modal,
                disabled: el.hasAttribute("disabled")
            };
        });
    }

    /**
     * Parse footer cells from a .wx-table-footer container.
     * Returns the raw HTML content for each cell to allow rich markup.
     * @param {HTMLElement|null} div Footer container element.
     * @returns {Array<string>} Array of innerHTML snippets, one per cell.
     */
    _parseFooter(div) { return div ? Array.from(div.children).map((c) => c.innerHTML.trim()) : []; }

    /**
     * Inject a tree toggle control into the first cell to manage row expansion.
     * Applies indentation proportional to depth and preserves existing cell content.
     * @param {HTMLTableRowElement} tr Target row element.
     * @param {Object} row Row data object.
     * @param {number} depth Current hierarchy depth.
     */
    _injectTreeToggle(tr, row, depth) {
        const firstContentIndex = 0;
        const firstCell = tr.cells[firstContentIndex];
        if (!firstCell) { return; }

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

            btn.onclick = (e) => { e.stopPropagation(); row.expanded = !row.expanded; this.render(); };

            wrapper.appendChild(btn);
        } else {
            const dummy = document.createElement("span");
            dummy.className = "wx-tree-toggle-placeholder";
            wrapper.appendChild(dummy);
        }

        while (firstCell.firstChild) { wrapper.appendChild(firstCell.firstChild); }
        firstCell.appendChild(wrapper);
    }

    /**
     * Helper to create a generic element with optional class and text content.
     * @param {string} tag Tag name to create.
     * @param {string} [cls] Optional className.
     * @param {string} [text] Optional text content.
     * @returns {HTMLElement} Created element.
     */
    _createEl(tag, cls, text) {
        const el = document.createElement(tag);
        if (cls) { el.className = cls; }
        if (text) { el.textContent = text; }
        return el;
    }

    /**
     * Helper to create an icon element using a class name.
     * @param {string} cls Icon class name.
     * @returns {HTMLElement} Created <i> element.
     */
    _createIcon(cls) { const i = document.createElement("i"); i.className = cls; return i; }

    /**
     * Helper to create an image element with standard table icon styling.
     * @param {string} src Image source URL.
     * @returns {HTMLImageElement} Created <img> element.
     */
    _createImage(src) { const img = document.createElement("img"); img.className = "wx-icon"; img.src = src; img.alt = ""; return img; }

    /**
     * Helper to add classes from a whitespace-separated list to an element.
     * Ignores empty entries for robustness.
     * @param {HTMLElement} el Target element.
     * @param {string} cls Whitespace-separated class list.
     */
    _addClasses(el, cls) { if (cls) { el.classList.add(...cls.split(" ").filter((c) => c)); } }

    /**
     * Rebuild the column id-to-index cache for fast lookups during interactions.
     * Should be called after any change to _columns.
     */
    _rebuildColumnIndexCache() {
        this._colIndexCache.clear();
        for (let i = 0; i < this._columns.length; i++) { this._colIndexCache.set(this._columns[i].id, i); }
    }

    /**
     * Apply configured column widths to the colgroup elements for layout control.
     * Only applies when both column is visible and a width is defined.
     */
    _syncColumnWidths() {
        for (const c of this._columns) {
            if (c.visible && c.width) {
                const el = this._col.querySelector(`col[data-column-id='${c.id}']`);
                if (el) { el.style.width = `${c.width}px`; }
            }
        }
    }

    /**
     * Collect a list of row signatures used for change detection.
     * Each signature is a concatenation of cell text values for simplicity and speed.
     * @returns {Array<{key: string|number, signature: string}>} Row keys with current signatures.
     */
    _collectCurrentRowStates() {
        const list = [];
        const stack = [...this._rows];
        while (stack.length) {
            const r = stack.pop();
            const key = this._getRowKey(r);
            if (key) { list.push({ key, signature: r.cells.map((c) => c.text).join("|") }); }
            if (r.children) { stack.push(...r.children); }
        }
        return list;
    }

    /**
     * Return a stable key for a row, preferring explicit id over a generated uid.
     * @param {Object} row Row data object.
     * @returns {string|number} Stable identifier for the row.
     */
    _getRowKey(row) { return row.id || (row._uid || (row._uid = `r_${Math.random().toString(36).slice(2)}`)); }

    /**
     * Update the snapshot of row signatures used for change detection in subsequent renders.
     * @param {Array<{key: string|number, signature: string}>} states Row signatures to persist.
     */
    _updateSnapshot(states) { 
        this._prevRowState.clear(); 
        for (const s of states) { 
            this._prevRowState.set(s.key, s.signature); 
        } 
    }

    /**
     * Dispatch a custom event with bubbling to notify external consumers.
     * @param {string} evtName Event type name.
     * @param {Object} detail Event detail payload.
     */
    _dispatch(evtName, detail) { this._element.dispatchEvent(new CustomEvent(evtName, { bubbles: true, detail })); }

    /**
     * Find a row and its immediate parent by id using depth-first search.
     * @param {string|number} id Row identifier.
     * @returns {{row:Object,parent:Object|null}|null} Row and parent pair or null when not found.
     */
    _findRowAndParent(id) {
        let found = null;
        const walk = (rows, parent) => {
            for (const r of rows) {
                if (r.id === id) { found = { row: r, parent }; return true; }
                if (r.children && walk(r.children, r)) { return true; }
            }
            return false;
        };
        walk(this._rows, null);
        return found;
    }

    /**
     * Remove a row recursively by id from a given row list.
     * @param {string|number} id Row identifier to remove.
     * @param {Array<Object>} rows List to search and mutate.
     * @returns {boolean} True when removed, false otherwise.
     */
    _removeRowRecursive(id, rows) {
        if (!Array.isArray(rows)) { return false; }
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (r.id === id) { rows.splice(i, 1); return true; }
            if (r.children && this._removeRowRecursive(id, r.children)) { return true; }
        }
        return false;
    }

    /**
     * Traverse rows depth-first and invoke a callback for each row encountered.
     * @param {Array<Object>} rows Root row list to traverse.
     * @param {Function} fn Callback invoked with each row object.
     */
    _traverseRows(rows, fn) {
        if (!Array.isArray(rows)) { return; }
        for (const r of rows) { fn(r); if (r.children) { this._traverseRows(r.children, fn); } }
    }

    /**
     * Attach column resizer handles to header cells when resizing is enabled.
     * Adds double-click autosize behavior on the handle.
     * Handles are positioned according to document direction (LTR/RTL).
     * Events are bound for mouse and touch to initiate resize gesture.
     * Sort suppression is ensured by stopping event propagation and setting _isResizing.
     */
    _attachColumnResizers() {
        if (!this._columnResizeEnabled) { return; }
        const headers = this._head.querySelectorAll("th.wx-col-header");
        const isRtl = getComputedStyle(this._table).direction === "rtl";

        headers.forEach((th) => {
            let handle = th.querySelector(":scope > .wx-col-resizer");
            if (!handle) {
                handle = document.createElement("span");
                handle.className = "wx-col-resizer";
                handle.style.position = "absolute";
                handle.style.top = "0";
                handle.style[isRtl ? "left" : "right"] = "0";
                handle.style.width = "6px";
                handle.style.cursor = isRtl ? "w-resize" : "e-resize";
                handle.style.userSelect = "none";
                handle.style.height = "100%";
                handle.style.transform = "translateX(" + (isRtl ? "-50%" : "50%") + ")";
                handle.style.zIndex = "2";
                th.appendChild(handle);

                // pointer events on handle only
                handle.addEventListener("mousedown", (e) => {
                    e.stopPropagation(); // inline comment: prevent header click from firing
                    this._beginColumnResize(e, th);
                });
                handle.addEventListener("touchstart", (e) => {
                    e.stopPropagation(); // inline comment: prevent header click from firing
                    this._beginColumnResize(e, th);
                }, { passive: true });

                // prevent synthetic click after drag on some browsers
                handle.addEventListener("click", (e) => {
                    e.stopPropagation(); // inline comment: block click bubbling to header
                    e.preventDefault(); // inline comment: neutralize default click behavior
                });

                // autosize on double click
                handle.addEventListener("dblclick", (e) => {
                    e.stopPropagation(); // inline comment: do not trigger header click
                    e.preventDefault(); // inline comment: avoid selection artifacts
                    const colId = th.dataset.columnId;
                    if (!colId || !this._colIndexCache.has(colId)) { return; }
                    const index = this._colIndexCache.get(colId);
                    this._autoSizeColumn(index); // inline comment: compute and apply best-fit width
                });
            }
        });
    }

    /**
     * Compute best-fit width for a column based on header and visible body cells.
     * Uses header inner width and each cell's scrollWidth/bounding box, adds padding and borders.
     * Respects MIN_COL_WIDTH, adds a small buffer, updates colgroup and model, and schedules persistence.
     * @param {number} index Column index in _columns (not the DOM index).
     */
    _autoSizeColumn(index) {
        const column = this._columns[index];
        if (!column || column.visible === false) { return; }

        // find the header th and its dom index among visible headers
        const headers = this._head.querySelectorAll("th.wx-col-header");
        let domIndex = -1;
        let headerTh = null;
        for (let i = 0; i < headers.length; i++) {
            const th = headers[i];
            if (th.dataset.columnId === column.id) {
                domIndex = i;
                headerTh = th;
                break;
            }
        }
        if (domIndex < 0 || !headerTh) { return; }

        // measure header content width excluding resizer handle
        let maxWidth = 0;
        const inner = headerTh.querySelector(".wx-col-inner") || headerTh;
        let headerBase = Math.max(inner.scrollWidth, Math.ceil(inner.getBoundingClientRect().width));
        const thStyle = getComputedStyle(headerTh);
        const thPad = parseFloat(thStyle.paddingLeft) + parseFloat(thStyle.paddingRight);
        const thBorder = parseFloat(thStyle.borderLeftWidth) + parseFloat(thStyle.borderRightWidth);
        const headerCandidate = headerBase + thPad + thBorder;
        maxWidth = Math.max(maxWidth, headerCandidate);

        // iterate visible body rows and measure the dom cell at the same dom index
        const rows = this._body.rows;
        for (let r = 0; r < rows.length; r++) {
            const td = rows[r].cells[domIndex];
            if (!td) { continue; }
            const tdBox = td.getBoundingClientRect().width;
            const tdScroll = td.scrollWidth;
            const tdStyle = getComputedStyle(td);
            const tdBorder = parseFloat(tdStyle.borderLeftWidth) + parseFloat(tdStyle.borderRightWidth);
            const cellCandidate = Math.max(Math.ceil(tdBox), tdScroll) + tdBorder;
            if (cellCandidate > maxWidth) { maxWidth = cellCandidate; }
        }

        const buffer = 2;
        const newWidth = Math.max(Math.ceil(maxWidth) + buffer, webexpress.webui.TableCtrl.MIN_COL_WIDTH);

        const colEl = this._col.querySelector(`col[data-column-id='${column.id}']`);
        column.width = newWidth;
        if (colEl) { colEl.style.width = `${newWidth}px`; }

        this._schedulePersistIfAvailable(); // inline comment: persist width when available
    }

    /**
     * Begin a column resize gesture by capturing the initial pointer position.
     * Applies minimum width and respects RTL direction for delta computation.
     * Cleans up listeners on gesture end and optionally schedules persistence.
     * Suppresses header sort by marking _isResizing during the gesture.
     * @param {MouseEvent|TouchEvent} evt Initial pointer event.
     * @param {HTMLElement} th Header cell element for the target column.
     */
    _beginColumnResize(evt, th) {
        this._isResizing = true; // inline comment: mark resizing to suppress sort
        const colId = th.dataset.columnId;
        if (!colId || !this._colIndexCache.has(colId)) { this._isResizing = false; return; }
        const index = this._colIndexCache.get(colId);
        const column = this._columns[index];
        if (!column || column.visible === false) { this._isResizing = false; return; }

        const colEl = this._col.querySelector(`col[data-column-id='${colId}']`);
        const startWidth = Math.max(column.width || th.getBoundingClientRect().width, webexpress.webui.TableCtrl.MIN_COL_WIDTH);

        const pointX = (ev) => {
            if (ev.touches && ev.touches.length) { return ev.touches[0].clientX; }
            return ev.clientX;
        };

        const startX = pointX(evt);
        const isRtl = getComputedStyle(this._table).direction === "rtl";

        const move = (e) => {
            e.preventDefault(); // inline comment: avoid scrolling during touch move
            const dx = pointX(e) - startX;
            const signed = isRtl ? -dx : dx;
            let newWidth = Math.max(startWidth + signed, webexpress.webui.TableCtrl.MIN_COL_WIDTH);
            if (column.width && newWidth === column.width) { return; }
            column.width = Math.round(newWidth);
            if (colEl) { colEl.style.width = `${column.width}px`; }
        };

        const up = () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            document.removeEventListener("touchmove", move);
            document.removeEventListener("touchend", up);
            setTimeout(() => { this._isResizing = false; }, 0); // inline comment: clear flag after gesture
            this._schedulePersistIfAvailable(); // inline comment: persist width when available
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
        document.addEventListener("touchmove", move, { passive: false });
        document.addEventListener("touchend", up);
    }

    /**
     * Schedule persistence of layout state when a subclass provides _schedulePersist().
     * Errors in the subclass hook are swallowed to avoid breaking interactions.
     */
    _schedulePersistIfAvailable() {
        const fn = this._schedulePersist;
        if (typeof fn === "function") { try { fn.call(this); } catch (e) { /* ignore */ } }
    }
};

// class registration for declarative initialization
webexpress.webui.Controller.registerClass("wx-webui-table", webexpress.webui.TableCtrl);