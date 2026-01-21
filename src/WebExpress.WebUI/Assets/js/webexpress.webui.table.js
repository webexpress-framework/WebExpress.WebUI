/**
 * Table controller providing declarative parsing, sorting, rendering, and optional column resizing.
 * Refactored to use CSS Grid instead of HTML Tables.
 * Supports advanced width configuration via data attributes.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.TABLE_SORT_EVENT
 */
webexpress.webui.TableCtrl = class extends webexpress.webui.Ctrl {

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

    // caches
    _prevRowState = new Map();
    _colIndexCache = new Map();

    _renderScheduled = false;
    _isResizing = false;

    static MIN_COL_WIDTH = 30;
    static NUMERIC_RX = /^-?\d+(?:\.\d+)?$/;

    /**
     * Initialize controller and render initial state.
     * @param {HTMLElement} element Host element that contains declarative configuration.
     */
    constructor(element) {
        super(element);
        this._initialized = false;
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
     * @param {HTMLElement} element Host element.
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
     * @param {HTMLElement} element Host element.
     */
    _parseConfig(element) {
        this._beforeInitParse(element);

        this._options = this._parseOptions(element.querySelector(":scope > .wx-table-options"));
        this._columns = this._parseColumns(element.querySelector(":scope > .wx-table-columns"));
        this._rows = this._parseRows(element.querySelectorAll(":scope > .wx-table-row"));
        this._footer = this._parseFooter(element.querySelector(":scope > .wx-table-footer"));

        this._recalculateHasOptions();

        element.textContent = "";
        element.appendChild(this._table);

        ["data-color", "data-border", "data-striped"].forEach((attr) => {
            element.removeAttribute(attr);
        });
    }

    /**
     * Register event listeners for header interactions (sorting).
     */
    _initEventListeners() {
        this._head.addEventListener("click", (e) => {
            const headerCell = e.target.closest(".wx-col-header");
            if (!headerCell) {
                return;
            }
            if (this._isResizing) {
                return;
            }
            const colId = headerCell.dataset.columnId;
            if (!colId || !this._colIndexCache.has(colId)) {
                return;
            }
            const col = this._columns[this._colIndexCache.get(colId)];
            if (col) {
                this._handleSortClick(headerCell, col);
            }
        }, { passive: true });
    }

    /**
     * Hook for subclasses to preprocess the host element before parsing.
     * @param {HTMLElement} element Host element.
     */
    _beforeInitParse(element) { }

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
     * Recalculates the _hasOptions flag based on rows and global options.
     */
    _recalculateHasOptions() {
        if (this._options && this._options.length > 0) {
            this._hasOptions = true;
            return;
        }
        const hasRowOptions = (rows) => {
            for (const r of rows) {
                if (r.options && r.options.length > 0) {
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

    /**
     * Replace the current column definitions.
     * @param {Array<Object>} columns Column descriptors.
     * @param {boolean} [preserveExisting=true] Preserve row mappings.
     */
    setColumns(columns, preserveExisting = true) {
        if (!Array.isArray(columns) || !columns.length) {
            return;
        }

        const prevCols = this._columns.slice();
        const prevOrder = prevCols.map((c) => {
            return c.id;
        });

        const normalized = columns.map((c, idx) => {
            return {
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
            };
        });

        if (preserveExisting) {
            const prevIndexMap = new Map(prevOrder.map((id, i) => {
                return [id, i];
            }));
            const remapRow = (row) => {
                const newCells = new Array(normalized.length);
                for (let i = 0; i < normalized.length; i++) {
                    const oldIdx = prevIndexMap.get(normalized[i].id);
                    newCells[i] = (oldIdx != null && row.cells[oldIdx]) ? row.cells[oldIdx] : { text: "" };
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
                if (r.cells.length > normalized.length) {
                    r.cells.length = normalized.length;
                }
                while (r.cells.length < normalized.length) {
                    r.cells.push({ text: "" });
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
     * @param {Object|Array} rowData Row data object.
     * @param {string|null} [parentId=null] Parent row id.
     * @param {number|null} [index=null] Target index.
     * @returns {Object|null} The inserted row.
     */
    insertRow(rowData, parentId = null, index = null) {
        const buildRow = (data) => {
            if (Array.isArray(data)) {
                return { id: null, cells: data.map((v) => { return { text: String(v ?? "") }; }), children: [], parent: null, expanded: true, options: null };
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
                cells: Array.isArray(data.cells) ? data.cells.map((c) => { return (c && typeof c === "object" ? c : { text: String(c ?? "") }); }) : [],
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

        if (!this._hasOptions && row.options && row.options.length > 0) {
            this._hasOptions = true;
        }

        this.render();
        return row;
    }

    /**
     * Delete a row by its id.
     * @param {string} rowId Target row id.
     * @returns {boolean} True when a row was removed.
     */
    deleteRow(rowId) {
        if (!rowId) {
            return false;
        }
        const removed = this._removeRowRecursive(rowId, this._rows);
        if (removed) { 
            this._recalculateHasOptions();
            this.render(); 
        }
        return removed;
    }

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

            const currentStates = this._collectCurrentRowStates();
            const changedIds = new Set();
            const newIds = new Set();

            const shouldHighlight = this._initialized && this._highlightChanges && !this._suppressFlashOnce && this._prevRowState.size > 0;
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

            this._suppressFlashOnce = false;
            this._updateSnapshot(currentStates);
            this._initialized = true;
        });
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
            for (const col of this._columns) {
                if (!col.visible) {
                    continue;
                }

                const th = document.createElement("div");
                th.className = "wx-grid-header-cell wx-col-header";
                th.setAttribute("role", "columnheader");
                th.dataset.columnId = col.id;
                
                this._addClasses(th, col.color);

                if (col.sort) {
                    th.classList.add(col.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc");
                }

                const inner = document.createElement("div");
                inner.className = "wx-col-inner";
                if (col.icon) {
                    inner.appendChild(this._createIcon(col.icon));
                }
                if (col.image) {
                    inner.appendChild(this._createImage(col.image));
                }
                inner.appendChild(document.createTextNode(col.label));
                th.appendChild(inner);

                headRow.appendChild(th);
            }
            
            if (this._hasOptions) {
                this._renderActionsHeader(headRow);
            }
        }

        this._head.textContent = "";
        this._head.appendChild(headFragment);
    }
    
    /**
     * Render actions header cell.
     * @param {HTMLElement} headRow Header row container.
     */
    _renderActionsHeader(headRow) {
        const th = document.createElement("div");
        th.className = "wx-grid-header-cell wx-table-actions";
        th.setAttribute("role", "columnheader");
        headRow.appendChild(th);
    }

    /**
     * Render body rows.
     * @param {Set<string>} changedIds Keys of modified rows.
     * @param {Set<string>} newIds Keys of new rows.
     */
    _renderRows(changedIds, newIds) {
        const fragment = document.createDocumentFragment();
        const renderList = (rows, depth) => {
            for (const r of rows) {
                this._addRow(r, depth, fragment, changedIds, newIds);
                if (r.children?.length && r.expanded) {
                    renderList(r.children, depth + 1);
                }
            }
        };
        if (this._rows.length) {
            renderList(this._rows, 0);
        }
        this._body.textContent = "";
        this._body.appendChild(fragment);
    }

    /**
     * Create and append a single row div.
     * @param {Object} row Row data object.
     * @param {number} depth Hierarchy depth.
     * @param {DocumentFragment} fragment Target fragment.
     * @param {Set<string>} changedIds Keys with changed signatures.
     * @param {Set<string>} newIds Keys for new rows.
     */
    _addRow(row, depth, fragment, changedIds, newIds) {
        const tr = document.createElement("div");
        tr.className = "wx-grid-row";
        tr.setAttribute("role", "row");
        
        this._addClasses(tr, row.color);
        this._addClasses(tr, row.class);
        if (row.style) {
            tr.style.cssText = row.style;
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

        let firstVisible = true;
        const len = this._columns.length;

        for (let i = 0; i < len; i++) {
            const colDef = this._columns[i];
            if (!colDef.visible) {
                continue;
            }

            const td = document.createElement("div");
            td.className = "wx-grid-cell";
            td.setAttribute("role", "gridcell");

            const cell = row.cells[i];

            if (cell) {
                this._addClasses(td, cell.color);
                this._addClasses(td, cell.class);
                if (cell.style) {
                    td.style.cssText += (td.style.cssText ? "; " : "") + cell.style;
                }

                let content = this._renderCell(row, colDef, cell, firstVisible);

                if (firstVisible && (row.uri || row.icon)) {
                    const wrap = row.uri ? document.createElement("a") : document.createElement("span");
                    wrap.className = "wx-cell-content";
                    if (row.uri) {
                        wrap.href = row.uri;
                        if (row.target) {
                            wrap.target = row.target;
                        }
                        wrap.rel = "noopener noreferrer";
                    }
                    if (row.icon) {
                        const icon = document.createElement("i");
                        icon.className = row.icon;
                        wrap.appendChild(icon);
                    }
                    if (content instanceof Node) {
                        wrap.appendChild(content);
                    } else {
                        wrap.appendChild(document.createTextNode(String(content ?? "")));
                    }
                    content = wrap;
                }

                if (content instanceof Node) {
                    td.appendChild(content);
                } else {
                    td.textContent = String(content ?? "");
                }
            } else {
                td.textContent = "";
            }

            tr.appendChild(td);
            firstVisible = false;
        }
        
        if (this._hasOptions) {
            const tdOpt = document.createElement("div");
            tdOpt.className = "wx-grid-cell wx-table-actions";
            tdOpt.setAttribute("role", "gridcell");
            
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

        if (this._isTree) {
            this._injectTreeToggle(tr, row, depth);
        }
        fragment.appendChild(tr);
    }

    /**
     * Render cell content using renderer templates if available.
     * @param {Object} row Row data.
     * @param {Object} colDef Column definition.
     * @param {Object} cell Cell data.
     * @param {boolean} isFirstVisible Is first visible column.
     * @returns {string|Node} Rendered content.
     */
    _renderCell(row, colDef, cell, isFirstVisible) {
        const type = cell?.type || colDef.rendererType;
        const tmpl = type ? webexpress.webui.TableTemplates.get(type) : null;

        if (tmpl) {
            try {
                const opts = Object.assign({}, tmpl.options, colDef.rendererOptions || {});
                // call with correct signature: (val, table, row, cell, name, opts)
                return tmpl.fn(cell?.text, this, row, cell, colDef.name || colDef.id, opts);
            } catch (e) {
                console.error("renderer error", e);
                return "Error";
            }
        }
        return cell?.text ?? "";
    }

    /**
     * Render footer row.
     */
    _renderFooter() {
        if (!this._footer.length) {
            if (this._foot && this._foot.parentNode) {
                this._foot.parentNode.removeChild(this._foot);
            }
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

    /**
     * Handle sort interaction.
     * @param {HTMLElement} headerCell Target header div.
     * @param {Object} col Column descriptor.
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
        this._dispatch(webexpress.webui.Event.TABLE_SORT_EVENT, { sender: this._element, columnId: col.id, sortDirection: col.sort });
    }

    /**
     * Sort rows by a specific column.
     * @param {Object} column Sorting column descriptor.
     */
    orderRows(column) {
        const idx = column.index;
        if (idx === undefined) {
            return;
        }
        const dir = column.sort === "asc" ? 1 : -1;
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

        const decorated = this._rows.map((row, i) => {
            return { row, i };
        });
        decorated.sort((a, b) => {
            const va = a.row.cells[idx]?.text || "";
            const vb = b.row.cells[idx]?.text || "";
            
            const cmp = collator.compare(va, vb);
            
            if (cmp === 0) {
                return a.i - b.i;
            }
            return cmp * dir;
        });
        this._rows = decorated.map((d) => {
            return d.row;
        });
        this.render();
    }

    /**
     * Parse column definitions with extended width properties.
     * Supports data-width, data-min-width, data-resizable.
     * @param {HTMLElement} div Columns container element.
     * @returns {Array<Object>} Parsed columns.
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
            
            const resizable = el.dataset.resizable !== "false";

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
                resizable: resizable,
                sort: el.dataset.sort || null,
                visible: el.dataset.visible !== "false",
                rendererType,
                rendererOptions
            };
        });
    }

    /**
     * Parse rows from config.
     * @param {NodeList} divs Row elements.
     * @param {Object} [parent=null] Parent row.
     * @returns {Array<Object>} Parsed rows.
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
            if (childRows.length) {
                row.children = this._parseRows(childRows, row);
            }
            rows.push(row);
        }
        return rows;
    }

    /**
     * Parse dropdown options.
     * @param {HTMLElement} div Options container.
     * @returns {Array<Object>} Parsed options.
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
     * Parse footer configuration.
     * @param {HTMLElement} div Footer container.
     * @returns {Array<string>} Footer cell contents.
     */
    _parseFooter(div) {
        return div ? Array.from(div.children).map((c) => {
            return c.innerHTML.trim();
        }) : [];
    }

    /**
     * Inject tree toggle control into the first data column (skips drag-handle cells).
     * @param {HTMLElement} tr Row element.
     * @param {Object} row Row data.
     * @param {number} depth Hierarchy depth.
     */
    _injectTreeToggle(tr, row, depth) {
        const firstCell = Array.from(tr.children).find((cell) => {
            if (!cell.classList.contains("wx-grid-cell")) {
                return false;
            }
            if (cell.classList.contains("wx-table-drag-handle")) {
                return false;
            }
            return true;
        });
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

            btn.onclick = (e) => {
                e.stopPropagation();
                row.expanded = !row.expanded;
                this.render();
            };

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

    /**
     * Creates a DOM element with optional class name and text content.
     * @param {string} tag - The HTML tag to create.
     * @param {string} [cls] - Optional CSS class name.
     * @param {string} [text] - Optional text content.
     * @returns {HTMLElement} The created element.
     */
    _createEl(tag, cls, text) {
        const el = document.createElement(tag);
        if (cls) {
            el.className = cls;
        }
        if (text) {
            el.textContent = text;
        }
        return el;
    }

    /**
     * Creates an <i> element used for icon rendering.
     * @param {string} cls - CSS class name for the icon.
     * @returns {HTMLElement} The created icon element.
     */
    _createIcon(cls) { 
        const i = document.createElement("i"); 
        i.className = cls; 
        return i; 
    }
    
    /**
     * Creates an <img> element with the default icon class.
     * @param {string} src - Image source URL.
     * @returns {HTMLImageElement} The created image element.
     */
    _createImage(src) { 
        const img = document.createElement("img"); 
        img.className = "wx-icon"; 
        img.src = src; 
        img.alt = ""; 
        return img; 
    }
    
    /**
     * Adds one or more CSS classes to an element.
     * @param {HTMLElement} el - The target element.
     * @param {string} cls - Space-separated list of class names.
     */
    _addClasses(el, cls) { 
        if (cls) { 
            el.classList.add(...cls.split(" ").filter((c) => {
                return c;
            })); 
        } 
    }

    /**
     * Rebuilds the internal column index cache for fast lookup.
     * Maps column IDs to their current index positions.
     */
    _rebuildColumnIndexCache() {
        this._colIndexCache.clear();
        for (let i = 0; i < this._columns.length; i++) { 
            this._colIndexCache.set(this._columns[i].id, i); 
        }
    }

    /**
     * Constructs the CSS Grid Template string and applies it to the table variable.
     * Supports pixels, percentages, minmax, and auto/fr.
     * Logic enforced: Last visible column is never strictly sized but flexible.
     */
    _syncColumnWidths() {
        const parts = [];
        
        const visibleCols = this._columns.filter((c) => {
            return c.visible;
        });
        const lastVisibleId = visibleCols.length > 0 ? visibleCols[visibleCols.length - 1].id : null;

        for (const c of this._columns) {
            if (!c.visible) {
                continue;
            }
            
            if (c.id === lastVisibleId) {
                const min = c.minWidth || `${webexpress.webui.TableCtrl.MIN_COL_WIDTH}px`;
                parts.push(`minmax(${min}, 1fr)`);
                continue;
            }

            let val = "1fr";

            if (c.width !== null && c.width !== "") {
                const w = String(c.width);
                if (w === "auto") {
                    val = "auto";
                } else if (w.endsWith("%") || w.endsWith("fr") || w.endsWith("rem") || w.endsWith("px")) {
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
                val = `minmax(${webexpress.webui.TableCtrl.MIN_COL_WIDTH}px, ${val})`;
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
     * Collects the current state of all rows, including hierarchical children.
     * Each entry contains a unique row key and a signature representing the
     * concatenated text content of all cells. Used for change detection.
     *
     * @returns {Array<{ key: string, signature: string }>} A flat list of row states.
     */
    _collectCurrentRowStates() {
        const list = [];
        const stack = [...this._rows];
        while (stack.length) {
            const r = stack.pop();
            const key = this._getRowKey(r);
            if (key) {
                list.push({ key, signature: r.cells.map((c) => { return c.text; }).join("|") });
            }
            if (r.children) {
                stack.push(...r.children);
            }
        }
        return list;
    }

    /**
     * Returns a stable key for a row. Uses the row's `id` if available;
     * otherwise generates and stores a unique internal identifier.
     *
     * @param {Object} row - The row object.
     * @returns {string} The resolved row key.
     */
    _getRowKey(row) { 
        return row.id || (row._uid || (row._uid = `r_${Math.random().toString(36).slice(2)}`)); 
    }

    /**
     * Updates the internal snapshot of row states used for change detection.
     *
     * @param {Array<{ key: string, signature: string }>} states - Current row states.
     */
    _updateSnapshot(states) { 
        this._prevRowState.clear(); 
        for (const s of states) { 
            this._prevRowState.set(s.key, s.signature); 
        } 
    }

    /**
     * Finds a row by ID and returns both the row and its parent.
     *
     * @param {string} id - The row ID to search for.
     * @returns {{ row: Object, parent: Object|null } | null} The match or null.
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
     * Removes a row with the given ID from a hierarchical row structure.
     *
     * @param {string} id - The ID of the row to remove.
     * @param {Array} rows - The row array to search within.
     * @returns {boolean} True if a row was removed; otherwise false.
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

    /**
     * Traverses all rows (including nested children) and applies a callback.
     *
     * @param {Array} rows - The row collection to traverse.
     * @param {Function} fn - Callback invoked for each row.
     * @private
     */
    _traverseRows(rows, fn) {
        if (!Array.isArray(rows)) {
            return;
        }
        for (const r of rows) {
            fn(r);
            if (r.children) {
                this._traverseRows(r.children, fn);
            }
        }
    }

    /**
     * Attach column resizer handles to header cells.
     * Respects the 'resizable' flag of each column.
     * Skips the last visible column.
     */
    _attachColumnResizers() {
        if (!this._columnResizeEnabled) {
            return;
        }
        const headers = this._head.querySelectorAll(".wx-col-header");
        
        const visibleCols = this._columns.filter((c) => {
            return c.visible;
        });
        const lastVisibleId = visibleCols.length > 0 ? visibleCols[visibleCols.length - 1].id : null;

        headers.forEach((th) => {
            const colId = th.dataset.columnId;
            if (!colId || !this._colIndexCache.has(colId)) {
                return;
            }
            
            if (colId === lastVisibleId) {
                return;
            }

            const index = this._colIndexCache.get(colId);
            const column = this._columns[index];

            if (column && column.resizable === false) {
                return;
            }

            let handle = th.querySelector(":scope > .wx-col-resizer");
            if (!handle) {
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

                handle.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                });

                handle.addEventListener("dblclick", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this._autoSizeColumn(index);
                });
            }
        });
    }

    /**
     * Autosize a specific column.
     * @param {number} index Column index.
     */
    _autoSizeColumn(index) {
        const column = this._columns[index];
        if (!column || column.visible === false || column.resizable === false) {
            return;
        }

        const headers = this._head.querySelectorAll(".wx-col-header");
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
        if (domIndex < 0 || !headerTh) {
            return;
        }

        let maxWidth = 0;
        const inner = headerTh.querySelector(".wx-col-inner") || headerTh;
        let headerBase = Math.max(inner.scrollWidth, Math.ceil(inner.getBoundingClientRect().width));
        const thStyle = getComputedStyle(headerTh);
        const thPad = parseFloat(thStyle.paddingLeft) + parseFloat(thStyle.paddingRight);
        const thBorder = parseFloat(thStyle.borderLeftWidth) + parseFloat(thStyle.borderRightWidth);
        const headerCandidate = headerBase + thPad + thBorder;
        maxWidth = Math.max(maxWidth, headerCandidate);

        const rows = this._body.querySelectorAll(".wx-grid-row");
        for (let r = 0; r < rows.length; r++) {
            const td = rows[r].children[domIndex];
            if (!td) {
                continue;
            }
            const tdBox = td.getBoundingClientRect().width;
            const tdScroll = td.scrollWidth;
            const tdStyle = getComputedStyle(td);
            const tdBorder = parseFloat(tdStyle.borderLeftWidth) + parseFloat(tdStyle.borderRightWidth);
            const cellCandidate = Math.max(Math.ceil(tdBox), tdScroll) + tdBorder;
            if (cellCandidate > maxWidth) {
                maxWidth = cellCandidate;
            }
        }

        const buffer = 2;
        const newWidth = Math.max(Math.ceil(maxWidth) + buffer, webexpress.webui.TableCtrl.MIN_COL_WIDTH);

        column.width = newWidth;
        this._syncColumnWidths(); 
        this._schedulePersistIfAvailable();
    }

    /**
     * Start column resize interaction.
     * @param {Event} evt Triggering event.
     * @param {HTMLElement} th Column header element.
     */
    _beginColumnResize(evt, th) {
        this._isResizing = true;
        const colId = th.dataset.columnId;
        if (!colId || !this._colIndexCache.has(colId)) {
            this._isResizing = false;
            return;
        }
        const index = this._colIndexCache.get(colId);
        const column = this._columns[index];
        if (!column || column.visible === false || column.resizable === false) {
            this._isResizing = false;
            return;
        }

        const startWidth = Math.max(parseInt(column.width || th.getBoundingClientRect().width), webexpress.webui.TableCtrl.MIN_COL_WIDTH);

        const pointX = (ev) => {
            if (ev.touches && ev.touches.length) {
                return ev.touches[0].clientX;
            }
            return ev.clientX;
        };

        const startX = pointX(evt);
        const isRtl = getComputedStyle(this._table).direction === "rtl";

        const move = (e) => {
            e.preventDefault();
            const dx = pointX(e) - startX;
            const signed = isRtl ? -dx : dx;
            let newWidth = Math.max(startWidth + signed, webexpress.webui.TableCtrl.MIN_COL_WIDTH);
            if (column.width && newWidth === column.width) {
                return;
            }
            column.width = Math.round(newWidth);
            this._syncColumnWidths(); 
        };

        const up = () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            document.removeEventListener("touchmove", move);
            document.removeEventListener("touchend", up);
            setTimeout(() => {
                this._isResizing = false;
            }, 0);
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
        const fn = this._schedulePersist;
        if (typeof fn === "function") {
            try {
                fn.call(this);
            } catch (e) { /* ignore */ }
        }
    }

    /**
     * Detect whether any row has children.
     * @param {Array<Object>} rows Row list.
     * @returns {boolean} True if a tree structure exists.
     */
    _detectTree(rows) {
        if (!Array.isArray(rows)) {
            return false;
        }
        const stack = [...rows];
        while (stack.length) {
            const r = stack.pop();
            if (r?.children && r.children.length > 0) {
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