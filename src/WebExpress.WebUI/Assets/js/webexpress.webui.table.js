/**
 * Base table controller providing sorting and rendering only.
 * Features:
 * - sorting of columns
 * - rendering of headers, rows, cells, and footer
 *
 * Events emitted:
 *  - webexpress.webui.Event.TABLE_SORT_EVENT
 */
webexpress.webui.TableCtrl = class extends webexpress.webui.Ctrl {

    // core elements
    _table = document.createElement("table");
    _col = document.createElement("colgroup");
    _head = document.createElement("thead");
    _body = document.createElement("tbody");
    _foot = document.createElement("tfoot");

    // data models
    _columns = [];
    _rows = [];
    _footer = [];
    _options = [];

    // flags / features
    _isTree = false;
    _suppressHeaders = false;
    _highlightChanges = true;
    _suppressFlashOnce = false;
    _columnResizeEnabled = true; // inline comment: allow toggling feature

    // cache
    _prevRowState = new Map();
    _colIndexCache = new Map();

    static MIN_COL_WIDTH = 30;
    static NUMERIC_RX = /^-?\d+(?:\.\d+)?$/;

    /**
     * Constructor.
     * @param {HTMLElement} element - host element.
     */
    constructor(element) {
        super(element);
        this._setupDom(element);
        this._parseConfig(element);
        this._initEventListeners();
        this.render();
        this._initialized = true;
    }

    /**
     * Set up base DOM structure.
     * @param {HTMLElement} element
     */
    _setupDom(element) {
        this._table.className = "wx-table table table-hover table-sm";
        const ds = element.dataset;
        if (ds.color) { this._table.classList.add(ds.color); }
        if (ds.border) { this._table.classList.add(ds.border); }
        if (ds.striped) { this._table.classList.add(ds.striped); }
        this._table.append(this._col, this._head, this._body, this._foot);
    }

    /**
     * Parse declarative configuration.
     * @param {HTMLElement} element
     */
    _parseConfig(element) {
        this._beforeInitParse(element);

        this._options = this._parseOptions(element.querySelector(":scope > .wx-table-options"));
        this._columns = this._parseColumns(element.querySelector(":scope > .wx-table-columns"));
        this._rows = this._parseRows(element.querySelectorAll(":scope > .wx-table-row"));
        this._footer = this._parseFooter(element.querySelector(":scope > .wx-table-footer"));

        element.innerHTML = "";
        element.appendChild(this._table);

        ["data-color", "data-border", "data-striped"]
            .forEach((attr) => { element.removeAttribute(attr); });
    }

    /**
     * Initialize base event listeners (sorting).
     */
    _initEventListeners() {
        this._head.addEventListener("click", (e) => {
            const th = e.target.closest("th");
            if (!th) { return; }
            const colId = th.dataset.columnId;
            if (!colId || !this._colIndexCache.has(colId)) { return; }
            const col = this._columns[this._colIndexCache.get(colId)];
            if (col) { this._handleSortClick(th, col); }
        });
    }

    /**
     * Hook before parsing, for extension points.
     * @param {HTMLElement} element
     */
    _beforeInitParse(element) { }

    /**
     * Enable change flash highlighting.
     */
    enableChangeFlash() { this._highlightChanges = true; }

    /**
     * Disable change flash highlighting.
     */
    disableChangeFlash() { this._highlightChanges = false; }

    /**
     * Enable column resizing.
     */
    enableColumnResize() { this._columnResizeEnabled = true; }

    /**
     * Disable column resizing.
     */
    disableColumnResize() { this._columnResizeEnabled = false; }

    /**
     * Set columns.
     * @param {Array<Object>} columns
     * @param {boolean} [preserveExisting=true]
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
                const newCells = [];
                normalized.forEach((col) => {
                    const oldIdx = prevIndexMap.get(col.id);
                    newCells.push((oldIdx != null && row.cells[oldIdx]) ? row.cells[oldIdx] : { text: "" });
                });
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
     * Insert a row.
     * @param {Object|Array} rowData
     * @param {string|null} [parentId=null]
     * @param {number|null} [index=null]
     * @returns {Object|null}
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

        this.render();
        return row;
    }

    /**
     * Delete a row by id.
     * @param {string} rowId
     * @returns {boolean}
     */
    deleteRow(rowId) {
        if (!rowId) { return false; }
        const removed = this._removeRowRecursive(rowId, this._rows);
        if (removed) { this.render(); }
        return removed;
    }

    /**
     * Render the table.
     */
    render() {
        const currentStates = this._collectCurrentRowStates();
        const changedIds = new Set();
        const newIds = new Set();

        if (this._initialized && this._highlightChanges && !this._suppressFlashOnce) {
            for (const entry of currentStates) {
                const oldSig = this._prevRowState.get(entry.key);
                if (oldSig === undefined) { newIds.add(entry.key); }
                else if (oldSig !== entry.signature) { changedIds.add(entry.key); }
            }
        }

        this._rebuildColumnIndexCache();

        this._renderColumns();
        this._renderRows(changedIds, newIds);
        this._renderFooter();
        this._syncColumnWidths();
        this._attachColumnResizers(); // inline comment: ensure resizers exist after headers

        this._suppressFlashOnce = false;
        this._updateSnapshot(currentStates);
        this._initialized = true;
    }

    /**
     * Render column headers and colgroup.
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
        }

        this._head.textContent = '';
        this._head.appendChild(headFragment);

        this._col.textContent = '';
        this._col.appendChild(colFragment);
    }

    /**
     * Render all data rows.
     * @param {Set<string>} changedIds
     * @param {Set<string>} newIds
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
        this._body.textContent = '';
        this._body.appendChild(fragment);
    }

    /**
     * Add one row DOM node.
     * @param {Object} row
     * @param {number} depth
     * @param {DocumentFragment} fragment
     * @param {Set<string>} changedIds
     * @param {Set<string>} newIds
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
            const cell = row.cells[i];

            if (cell) {
                this._addClasses(td, cell.color);
                this._addClasses(td, cell.class);
                if (cell.style) { td.style.cssText = cell.style; }

                let content = this._renderCell(row, colDef, cell, firstVisible);

                if (firstVisible && (row.uri || row.icon)) {
                    const wrap = row.uri ? document.createElement("a") : document.createElement("span");
                    wrap.className = "wx-cell-content";
                    if (row.uri) { wrap.href = row.uri; if (row.target) { wrap.target = row.target; } }
                    if (row.icon) { const icon = document.createElement("i"); icon.className = row.icon; wrap.appendChild(icon); }
                    if (content instanceof Node) { wrap.appendChild(content); } else { wrap.appendChild(document.createTextNode(String(content ?? ""))); }
                    content = wrap;
                }

                if (content instanceof Node) { td.appendChild(content); } else { td.textContent = String(content ?? ""); }
            }
            tr.appendChild(td);
            firstVisible = false;
        }

        // inline comment: no actions/options cell in base controller
        if (this._isTree) { this._injectTreeToggle(tr, row, depth); }
        fragment.appendChild(tr);
    }

    /**
     * Render one cell content.
     * @param {Object} row
     * @param {Object} colDef
     * @param {Object} cell
     * @param {boolean} isFirstVisible
     * @returns {string|HTMLElement}
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
     * Render footer row.
     */
    _renderFooter() {
        this._foot.textContent = '';
        const tr = document.createElement("tr");

        if (this._footer.length) {
            for (let i = 0; i < this._columns.length; i++) {
                const col = this._columns[i];
                if (!col.visible) { continue; }
                const td = document.createElement("td");
                if (this._footer[i] != null) { td.innerHTML = this._footer[i]; }
                tr.appendChild(td);
            }
        } else {
            for (const c of this._columns) {
                if (c.visible) { tr.appendChild(document.createElement("td")); }
            }
        }

        // inline comment: no footer alignment cell for actions in base controller
        this._foot.appendChild(tr);
    }

    /**
     * Handle sort interaction.
     * @param {HTMLElement} th
     * @param {Object} col
     */
    _handleSortClick(th, col) {
        const next = col.sort === "asc" ? "desc" : (col.sort === "desc" ? null : "asc");
        this._columns.forEach((c) => { c.sort = null; });
        col.sort = next;
        if (next) { this.orderRows(col); } else { this.render(); }
        this._dispatch(webexpress.webui.Event.TABLE_SORT_EVENT, { sender: this._element, columnId: col.id, sortDirection: col.sort });
    }

    /**
     * Order rows by a column definition.
     * @param {Object} column
     */
    orderRows(column) {
        const idx = column.index;
        if (idx === undefined) { return; }
        const numeric = this._rows.every((r) => {
            const v = r.cells[idx]?.text?.trim();
            return !v || webexpress.webui.TableCtrl.NUMERIC_RX.test(v);
        });
        const dir = column.sort === "asc" ? 1 : -1;
        this._rows.sort((a, b) => {
            const va = a.cells[idx]?.text || "";
            const vb = b.cells[idx]?.text || "";
            if (numeric) { return ((parseFloat(va) || 0) - (parseFloat(vb) || 0)) * dir; }
            return va.localeCompare(vb, undefined, { numeric: true }) * dir;
        });
        this.render();
    }

    /**
     * Parse column definitions.
     * @param {HTMLElement|null} div
     * @returns {Array<Object>}
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
                const src = (typeEl.tagName === 'TEMPLATE') ? typeEl.content.children : typeEl.children;
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
     * Parse rows (supports hierarchy).
     * @param {HTMLCollection|Array<HTMLElement>} divs
     * @param {Object|null} [parent=null]
     * @returns {Array<Object>}
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
     * Parse dropdown options.
     * @param {HTMLElement|null} div
     * @returns {Array<Object>}
     */
    _parseOptions(div) {
        if (!div) { return []; }
        return Array.from(div.children).map((el) => {
            const cls = el.classList;
            if (cls.contains("wx-dropdown-divider") || cls.contains("wx-dropdownbutton-divider")) { return { type: "divider" }; }
            if (cls.contains("wx-dropdown-header")) { return { type: "header", content: el.textContent.trim(), icon: el.dataset.icon }; }
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
     * Parse footer cells.
     * @param {HTMLElement|null} div
     * @returns {Array<string>}
     */
    _parseFooter(div) { return div ? Array.from(div.children).map((c) => c.innerHTML.trim()) : []; }

    /**
     * Inject tree toggle control.
     * @param {HTMLTableRowElement} tr
     * @param {Object} row
     * @param {number} depth
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
     * Helper: create element.
     * @param {string} tag
     * @param {string} [cls]
     * @param {string} [text]
     * @returns {HTMLElement}
     */
    _createEl(tag, cls, text) { const el = document.createElement(tag); if (cls) { el.className = cls; } if (text) { el.textContent = text; } return el; }

    /**
     * Helper: create icon element.
     * @param {string} cls
     * @returns {HTMLElement}
     */
    _createIcon(cls) { const i = document.createElement("i"); i.className = cls; return i; }

    /**
     * Helper: create image element.
     * @param {string} src
     * @returns {HTMLImageElement}
     */
    _createImage(src) { const img = document.createElement("img"); img.className = "wx-icon"; img.src = src; img.alt = ""; return img; }

    /**
     * Helper: add classes from string.
     * @param {HTMLElement} el
     * @param {string} cls
     */
    _addClasses(el, cls) { if (cls) { el.classList.add(...cls.split(" ").filter((c) => c)); } }

    /**
     * Rebuild column index cache map.
     */
    _rebuildColumnIndexCache() {
        this._colIndexCache.clear();
        for (let i = 0; i < this._columns.length; i++) { this._colIndexCache.set(this._columns[i].id, i); }
    }

    /**
     * Sync column widths from configuration to DOM.
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
     * Collect row state signatures for change detection.
     * @returns {Array<{key: string|number, signature: string}>}
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
     * Get a stable row key.
     * @param {Object} row
     * @returns {string|number}
     */
    _getRowKey(row) { return row.id || (row._uid || (row._uid = `r_${Math.random().toString(36).slice(2)}`)); }

    /**
     * Update snapshot cache of row states.
     * @param {Array<{key: string|number, signature: string}>} states
     */
    _updateSnapshot(states) { this._prevRowState.clear(); for (const s of states) { this._prevRowState.set(s.key, s.signature); } }

    /**
     * Dispatch a custom event helper.
     * @param {string} evtName
     * @param {Object} detail
     */
    _dispatch(evtName, detail) { this._element.dispatchEvent(new CustomEvent(evtName, { bubbles: true, detail })); }

    /**
     * Find a row and its parent by id.
     * @param {string|number} id
     * @returns {{row:Object,parent:Object|null}|null}
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
     * Remove a row recursively by id.
     * @param {string|number} id
     * @param {Array<Object>} rows
     * @returns {boolean}
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
     * Traverse rows depth-first.
     * @param {Array<Object>} rows
     * @param {Function} fn
     */
    _traverseRows(rows, fn) {
        if (!Array.isArray(rows)) { return; }
        for (const r of rows) { fn(r); if (r.children) { this._traverseRows(r.children, fn); } }
    }

    /**
     * Attach column resizer handles to header cells.
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
                handle.addEventListener("mousedown", (e) => { this._beginColumnResize(e, th); });
                handle.addEventListener("touchstart", (e) => { this._beginColumnResize(e, th); }, { passive: true });
            }
        });
    }

    /**
     * Begin a column resize interaction.
     * @param {MouseEvent|TouchEvent} evt
     * @param {HTMLElement} th
     */
    _beginColumnResize(evt, th) {
        const colId = th.dataset.columnId;
        if (!colId || !this._colIndexCache.has(colId)) { return; }
        const index = this._colIndexCache.get(colId);
        const column = this._columns[index];
        if (!column || column.visible === false) { return; }

        const colEl = this._col.querySelector(`col[data-column-id='${colId}']`);
        const startWidth = Math.max(column.width || th.getBoundingClientRect().width, webexpress.webui.TableCtrl.MIN_COL_WIDTH);

        const pointX = (ev) => {
            if (ev.touches && ev.touches.length) { return ev.touches[0].clientX; }
            return ev.clientX;
        };

        const startX = pointX(evt);
        const isRtl = getComputedStyle(this._table).direction === "rtl";

        const move = (e) => {
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
            this._schedulePersistIfAvailable(); // inline comment: persist width when available
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
        document.addEventListener("touchmove", move, { passive: false });
        document.addEventListener("touchend", up);
    }

    /**
     * Optional persist hook if a derived class supports it.
     */
    _schedulePersistIfAvailable() {
        const fn = this._schedulePersist;
        if (typeof fn === "function") { try { fn.call(this); } catch (e) { /* ignore */ } }
    }
};

// registration
webexpress.webui.Controller.registerClass("wx-webui-table", webexpress.webui.TableCtrl);