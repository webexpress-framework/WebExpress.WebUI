/**
 * Reorderable table control providing column mutation and row moving.
 * Features:
 * - reorder columns via drag & drop (header and dynamic modal panels)
 * - toggle column visibility
 * - move rows (flat and hierarchical, configurable via data attributes)
 * - persist columns (order, visibility, width), sort, and tree collapsed state
 * - actions modal panels including column search and inline reordering via DialogPanels
 *
 * Configuration via data attributes on host element:
 * - data-movable-row="true|false": enable row move handles and moving
 * - data-allow-column-remove="true|false": reserved for future column removal
 * - data-persist-key="string": key for cookie persistence
 * - data-tree-enabled="true|false": enable tree view (indent + toggle) when nested rows exist
 * - data-tree-move-enabled="true|false": allow hierarchical moving (drop as child)
 * - data-columns-modal-key="string": optional DialogPanels key for external column panels (default: "table-columns")
 *
 * The following events are triggered:
 * - webexpress.webui.Event.TABLE_SORT_EVENT
 * - webexpress.webui.Event.COLUMN_REORDER_EVENT
 * - webexpress.webui.Event.COLUMN_VISIBILITY_EVENT
 * - webexpress.webui.Event.COLUMN_SEARCH_EVENT
 * - webexpress.webui.Event.ROW_REORDER_EVENT
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 */
webexpress.webui.TableCtrlReorderable = class extends webexpress.webui.TableCtrl {
    /**
     * Constructor.
     * @param {HTMLElement} element Host element.
     */
    constructor(element) {
        super(element);
        this._loadStateFromCookie();
    }

    /**
     * Set up DOM for reorderable features (modal, indicators) and config.
     * @param {HTMLElement} element Host element.
     */
    _setupDom(element) {
        super._setupDom(element);

        const ds = element.dataset;
        this._movableRow = ds.movableRow === "true";
        this._allowColumnRemove = ds.allowColumnRemove === "true";
        this._persistKey = ds.persistKey || element.id || null;

        this._treeEnabled = ds.treeEnabled !== "false";
        this._treeMoveEnabled = ds.treeMoveEnabled !== "false";

        this._dragColumnIndicator = document.createElement("div");
        this._dragColumnIndicator.className = "wx-table-drag-indicator";
        this._dragColumnIndicator.setAttribute("aria-hidden", "true");
        this._dragColumnIndicator.style.display = "none";
        this._table.appendChild(this._dragColumnIndicator);
    }

    /**
     * Parse extended config and cleanup custom data attributes on host.
     * @param {HTMLElement} element Host element.
     */
    _parseConfig(element) {
        super._parseConfig(element);
        ["data-movable-row", "data-persist-key", "data-allow-column-remove", "data-tree-enabled", "data-tree-move-enabled", "data-columns-modal-key"]
            .forEach((attr) => { element.removeAttribute(attr); });
    }

    /**
     * Initialize listeners. Row handles are bound after render in _bindRowHandles().
     */
    _initEventListeners() {
        super._initEventListeners();
    }

    /**
     * Override render to ensure subclass column rendering, row handle binding.
     */
    render() {
        const currentStates = this._collectCurrentRowStates();
        const changedIds = new Set();
        const newIds = new Set();

        if (this._initialized && this._highlightChanges && !this._suppressFlashOnce && this._prevRowState.size > 0) {
            for (const entry of currentStates) {
                const oldSig = this._prevRowState.get(entry.key);
                if (oldSig === undefined) { newIds.add(entry.key); }
                else if (oldSig !== entry.signature) { changedIds.add(entry.key); }
            }
        }

        this._isTree = this._detectTree(this._rows);

        this._rebuildColumnIndexCache();

        // inline comment: sync widths first to set CSS variables for Grid
        this._syncColumnWidths();

        this._renderColumns();
        this._renderRows(changedIds, newIds);
        this._renderFooter();
        this._attachColumnResizers();

        this._bindRowHandles();

        this._suppressFlashOnce = false;
        this._updateSnapshot(currentStates);
        this._initialized = true;
    }

    /**
     * Render columns including optional left handle column and right actions cell.
     * Uses Div structure for Grid Layout.
     */
    _renderColumns() {
        const headFragment = document.createDocumentFragment();
        
        // inline comment: use div with wx-grid-row class
        const headRow = document.createElement("div");
        headRow.className = "wx-grid-row wx-grid-head-row";
        headRow.setAttribute("role", "row");
        headFragment.appendChild(headRow);

        if (!this._suppressHeaders) {
            if (this._movableRow) {
                const th = document.createElement("div");
                th.className = "wx-table-drag-column";
                th.setAttribute("role", "columnheader");
                th.setAttribute("aria-hidden", "true");
                headRow.appendChild(th);
            }

            for (const col of this._columns) {
                if (!col.visible) { continue; }

                const th = document.createElement("div");
                th.dataset.columnId = col.id;
                th.setAttribute("role", "columnheader");
                th.className = "wx-grid-header-cell wx-col-header";
                th.style.position = "relative";
                this._addClasses(th, col.color);

                if (col.sort) { th.classList.add(col.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc"); }

                const inner = document.createElement("div");
                inner.className = "wx-col-inner";
                if (col.icon) { inner.appendChild(this._createIcon(col.icon)); }
                if (col.image) { inner.appendChild(this._createImage(col.image)); }
                inner.appendChild(document.createTextNode(col.label));
                th.appendChild(inner);

                th.draggable = true;
                this._enableDragAndDropColumn(th, col);

                headRow.appendChild(th);
            }

            if (this._hasOptions || this._allowColumnRemove) {
                this._renderActionsHeader(headRow);
            }
        }

        this._head.textContent = "";
        this._head.appendChild(headFragment);
    }
    
    /**
     * Render actions header: provides a button to open the dynamic columns modal.
     * @param {HTMLElement} headRow Header row element to append actions cell.
     */
    _renderActionsHeader(headRow) {
        const th = document.createElement("div");
        th.className = "wx-grid-header-cell wx-table-actions";
        th.setAttribute("role", "columnheader");

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-sm";
        btn.title = this._i18n("webexpress.webui:table.manage.columns");
        btn.textContent = "≡";
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._openColumnsModal();
        });

        th.appendChild(btn);
        headRow.appendChild(th);
    }

    /**
     * Create dynamic modal host for columns, backed by ModalSidebarPanel and DialogPanels.
     */
    _createColumnsModal() {
        const id = "wx-table-columns-msp-" + Date.now() + "-" + Math.random().toString(36).slice(2);

        const el = document.createElement("div");
        el.id = id;
        el.setAttribute("aria-labelledby", id + "-label");
        el.setAttribute("aria-hidden", "true");
        el.setAttribute("data-key", "table-columns");
        el.setAttribute("data-submit-id", "apply-columns");
        el.setAttribute("data-validate-active-only", "true");

        const title = this._i18n("webexpress.webui:table.columns.title");

        el.innerHTML = [
            `<div class="wx-modal-header">${title}</div>`,
            `<div class="wx-modal-footer"></div>`
        ].join("");

        const footer = el.querySelector(".wx-modal-footer");
        const content = document.createElement("div");
        content.className = "wx-modal-content";
        if (footer && footer.parentNode) {
            footer.parentNode.insertBefore(content, footer);
        } else {
            el.appendChild(content);
        }

        document.body.appendChild(el);

        const modalCtrl = new webexpress.webui.ModalSidebarPanel(el);
        modalCtrl._tableCtrl = this;

        modalCtrl.getColumns = () => {
            return this._columns.map((c) => ({ id: c.id, label: c.label, visible: c.visible, width: c.width, sort: c.sort, color: c.color }));
        };
        modalCtrl.applyVisibility = (columnId, visible) => {
            this._runWithModalPreservation(() => {
                const col = this._columns.find((c) => c.id === columnId);
                if (col) {
                    col.visible = !!visible;
                    this._schedulePersist();
                    this.render();
                }
            });
            this._dispatch(webexpress.webui.Event.COLUMN_VISIBILITY_EVENT, { sender: this._element, columnId, visible: !!visible });
        };
        modalCtrl.applyOrder = (orderedIds) => {
            const map = new Map(this._columns.map((c) => [c.id, c]));
            const newOrder = [];
            orderedIds.forEach((id) => { const col = map.get(id); if (col) { newOrder.push(col); } });
            this._columns.forEach((c) => { if (!newOrder.includes(c)) { newOrder.push(c); } });
            const oldIndexById = new Map(this._columns.map((c, i) => [c.id, i]));
            this._columns = newOrder;
            const reorderCells = (rows) => {
                for (const row of rows) {
                    const newCells = [];
                    for (let i = 0; i < this._columns.length; i++) {
                        const cid = this._columns[i].id;
                        const srcIdx = oldIndexById.get(cid);
                        newCells[i] = row.cells[srcIdx];
                    }
                    row.cells = newCells;
                    if (row.children) { reorderCells(row.children); }
                }
            };
            this._runWithModalPreservation(() => {
                reorderCells(this._rows);
                this._schedulePersist();
                this.render();
            });
            this._dispatch(webexpress.webui.Event.COLUMN_REORDER_EVENT, { sender: this._element, sourceIndex: -1, targetIndex: -1 });
        };
        modalCtrl.applyWidth = (columnId, widthPx) => {
            const col = this._columns.find((c) => c.id === columnId);
            if (!col) { return; }
            const w = parseInt(widthPx, 10);
            if (!isNaN(w) && w > 0) { col.width = w; }
            this._runWithModalPreservation(() => {
                this._schedulePersist();
                this.render();
            });
        };
        modalCtrl.applySort = (columnId, dir) => {
            this._columns.forEach((c) => { if (c.id === columnId) { c.sort = dir === "asc" || dir === "desc" ? dir : null; } else { c.sort = null; } });
            this._runWithModalPreservation(() => {
                this._schedulePersist();
                this.render();
            });
            this._dispatch(webexpress.webui.Event.TABLE_SORT_EVENT, { sender: this._element, columnId, dir });
        };

        this._columnsModalEl = el;
        this._columnsSidebarPanel = modalCtrl;
    }

    /**
     * Open the columns modal and pass context data for panels.
     */
    _openColumnsModal() {
        if (!this._columnsModalEl) { this._createColumnsModal(); }
        if (this._columnsSidebarPanel) {
            this._columnsSidebarPanel._tableCtrl = this;
            this._columnsSidebarPanel._columnsPrefill = {
                columns: this._columns.map((c) => ({ id: c.id, label: c.label, visible: c.visible, width: c.width, sort: c.sort })),
                filterTerm: this._columnFilterTerm || ""
            };
            if (typeof this._columnsSidebarPanel.show === "function") { this._columnsSidebarPanel.show(); }
        }
    }

    /**
     * Preserve modal state (open + scroll) across actions and re-render.
     * @param {Function} action Function to execute.
     */
    _runWithModalPreservation(action) {
        const modal = this._columnsSidebarPanel;
        const content = modal ? modal._contentEl || this._columnsModalEl.querySelector(".wx-modal-content") : null;
        const list = content ? content.querySelector(".wx-columns-list") : null;
        const scroll = list ? list.scrollTop : 0;
        const wasOpen = modal && typeof modal.isShown === "function" ? modal.isShown() : false;

        action();

        if (wasOpen && modal && typeof modal.show === "function") {
            modal.show();
            const list2 = (modal._contentEl || this._columnsModalEl.querySelector(".wx-modal-content"))?.querySelector(".wx-columns-list");
            if (list2) { list2.scrollTop = scroll; }
        }
    }

    /**
     * Enable header column drag and drop reordering with insertion indicator.
     * @param {HTMLElement} th Header cell element.
     * @param {Object} column Column descriptor.
     */
    _enableDragAndDropColumn(th, column) {
        th.addEventListener("dragstart", (e) => {
            if (!e.ctrlKey) { e.preventDefault(); return; }
            this._draggedColumn = column;
        });
        th.addEventListener("dragend", () => {
            this._dragColumnIndicator.style.display = "none";
            this._draggedColumn = null;
        });
        th.addEventListener("dragover", (e) => {
            if (!this._draggedColumn) { return; }
            e.preventDefault();
            const rect = th.getBoundingClientRect();
            const leftSide = e.clientX < rect.left + th.offsetWidth / 2;
            this._dragColumnIndicator.style.top = `${rect.top}px`;
            this._dragColumnIndicator.style.left = `${(leftSide ? rect.left - 1 : rect.left + th.offsetWidth - 1)}px`;
            this._dragColumnIndicator.style.height = `${rect.height}px`;
            this._dragColumnIndicator.style.display = "block";
        });
        th.addEventListener("drop", (e) => {
            e.preventDefault();
            if (!this._draggedColumn || this._draggedColumn === column) { return; }

            const sourceIndex = this._columns.indexOf(this._draggedColumn);
            const targetIndex = this._columns.indexOf(column);
            const rect = th.getBoundingClientRect();
            const insertBefore = e.clientX < rect.left + th.offsetWidth / 2;
            let adjusted = targetIndex;
            if (insertBefore && sourceIndex < targetIndex) { adjusted -= 1; }
            else if (!insertBefore && sourceIndex > targetIndex) { adjusted += 1; }
            if (sourceIndex === adjusted) { return; }

            const moved = this._columns.splice(sourceIndex, 1)[0];
            this._columns.splice(adjusted, 0, moved);

            const reorderCells = (rows) => {
                for (const row of rows) {
                    if (row.cells && row.cells.length > sourceIndex) {
                        const c = row.cells.splice(sourceIndex, 1)[0];
                        row.cells.splice(adjusted, 0, c);
                    }
                    if (row.children) { reorderCells(row.children); }
                }
            };
            this._runWithModalPreservation(() => {
                reorderCells(this._rows);
                this._schedulePersist();
                this.render();
            });

            this._dispatch(webexpress.webui.Event.COLUMN_REORDER_EVENT, { sender: this._element, sourceIndex, targetIndex: adjusted });
        });
    }

    /**
     * Render rows including optional left handle column and right options column.
     * @param {Set<string>} changedIds Row keys with modified signatures.
     * @param {Set<string>} newIds Row keys first seen in this render.
     */
    _renderRows(changedIds, newIds) {
        const fragment = document.createDocumentFragment();
        const renderList = (rows, depth) => {
            for (const r of rows) {
                this._addRow(r, depth, fragment, changedIds, newIds);
                if (this._treeEnabled && r.children?.length && r.expanded) { renderList(r.children, depth + 1); }
            }
        };
        if (this._rows.length) { renderList(this._rows, 0); }
        this._body.textContent = "";
        this._body.appendChild(fragment);
    }

    /**
     * Add a single row with handle and options cell.
     * Uses Div structure for Grid Layout.
     * @param {Object} row Row descriptor.
     * @param {number} depth Current nesting depth.
     * @param {DocumentFragment} fragment Target fragment.
     * @param {Set<string>} changedIds Changed row keys.
     * @param {Set<string>} newIds New row keys.
     */
    _addRow(row, depth, fragment, changedIds, newIds) {
        const tr = document.createElement("div");
        tr.className = "wx-grid-row";
        tr.setAttribute("role", "row");
        
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

        if (this._movableRow) {
            const tdDrag = document.createElement("div");
            tdDrag.className = "wx-grid-cell wx-table-drag-handle";
            tdDrag.setAttribute("role", "gridcell");
            tdDrag.textContent = "⠿";
            tdDrag.tabIndex = 0;
            tdDrag.setAttribute("role", "button");
            tdDrag.style.userSelect = "none";
            tr.appendChild(tdDrag);
        }

        const len = this._columns.length;
        let firstVisible = true;

        for (let i = 0; i < len; i++) {
            const colDef = this._columns[i];
            if (!colDef.visible) { continue; }

            const td = document.createElement("div");
            td.className = "wx-grid-cell";
            td.setAttribute("role", "gridcell");
            
            td.style.overflow = "hidden";

            const cell = row.cells[i];

            if (cell) {
                this._addClasses(td, cell.color);
                this._addClasses(td, cell.class);
                if (cell.style) { td.style.cssText += (td.style.cssText ? "; " : "") + cell.style; }

                let content = this._renderCell(row, colDef, cell, firstVisible);

                if (firstVisible && (row.uri || row.icon)) {
                    const wrap = row.uri ? document.createElement("a") : document.createElement("span");
                    wrap.className = "wx-cell-content";
                    if (row.uri) { wrap.href = row.uri; if (row.target) { wrap.target = row.target; } wrap.rel = "noopener noreferrer"; }
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

        if (this._hasOptions || this._allowColumnRemove) {
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
                const items = row.options?.length ? row.options : this._options;
                new webexpress.webui.DropdownCtrl(div).items = items;
            }
            tr.appendChild(tdOpt);
        }

        if (this._treeEnabled && this._isTree) { this._injectTreeToggle(tr, row, depth); }
        fragment.appendChild(tr);
    }
    
    /**
     * Apply configured column widths by setting grid-template-columns variable.
     * Enforces fixed width for drag-handle (first) and actions (last).
     * Enforces last regular column to not be user-resizable (flexible filler).
     */
    _syncColumnWidths() {
        const parts = [];
        
        if (this._movableRow) { parts.push("1.25rem"); }
        
        const visibleCols = this._columns.filter((c) => c.visible);
        const lastVisibleId = visibleCols.length > 0 ? visibleCols[visibleCols.length - 1].id : null;

        for (const c of this._columns) {
            if (!c.visible) { continue; }

            if (c.id === lastVisibleId) {
                const min = c.minWidth || `${webexpress.webui.TableCtrl.MIN_COL_WIDTH}px`;
                parts.push(`minmax(${min}, 1fr)`);
                continue;
            }

            let val = "1fr";

            if (c.width !== null && c.width !== "") {
                const wStr = String(c.width).trim();
                if (wStr === "auto") {
                    val = "auto";
                } else if (wStr.endsWith("%") || wStr.endsWith("fr") || wStr.endsWith("rem") || wStr.endsWith("px")) {
                    val = wStr;
                } else if (!isNaN(Number(wStr))) {
                    val = `${wStr}px`;
                } else {
                    val = wStr;
                }
            }

            const min = c.minWidth || `${webexpress.webui.TableCtrl.MIN_COL_WIDTH}px`;
            const max = c.maxWidth || "1fr";

            if (c.width && c.width !== "auto") {
                 parts.push(val);
            } else {
                 parts.push(`minmax(${min}, ${max})`);
            }
        }
        
        if (this._hasOptions || this._allowColumnRemove) { parts.push("1.5rem"); }
        
        const template = parts.length > 0 ? parts.join(" ") : "auto";
        this._table.style.setProperty("--wx-grid-template", template);
    }

    /**
     * Bind pointer-based move interaction handlers to row handles.
     */
    _bindRowHandles() {
        if (!this._movableRow) { return; }
        const handles = this._body.querySelectorAll(".wx-table-drag-handle");
        handles.forEach((handle) => {
            if (handle._wxBoundPtr) { return; }
            handle._wxBoundPtr = true;

            const onDown = (e) => {
                if (e.button !== 0) { return; }
                const tr = handle.closest(".wx-grid-row");
                if (!tr || !tr._dataRowRef) { return; }
                e.preventDefault();

                this._beginRowMove(tr._dataRowRef, tr, e.clientX, e.clientY);
                document.addEventListener("mousemove", onMove);
                document.addEventListener("mouseup", onUp);
            };

            const onMove = (e) => {
                if (!this._rowMoveActive) { return; }
                e.preventDefault();
                this._updateRowMove(e.clientX, e.clientY);
            };

            const onUp = (e) => {
                if (!this._rowMoveActive) { return; }
                e.preventDefault();
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                this._finalizeRowMove();
            };

            handle.addEventListener("mousedown", onDown);
        });
    }

    /**
     * Begin a pointer-based row move session: create ghost and placeholder.
     * @param {Object} row Source row data object.
     * @param {HTMLElement} tr Source row element (div).
     * @param {number} startX Initial pointer X.
     * @param {number} startY Initial pointer Y.
     */
    _beginRowMove(row, tr, startX, startY) {
        this._rowMoveActive = true;
        this._rowMoveSourceRow = row;
        this._rowMoveSourceParent = row.parent || null;
        this._rowMoveTarget = null;
        this._rowMoveDerivedTargetParent = null;
        this._rowMoveDerivedInsertIndex = null;
        this._rowMoveSourceEl = tr;
        this._applyDragSourceVisual(true);

        const ghost = document.createElement("div");
        ghost.className = "wx-row-ghost";
        ghost.style.position = "fixed";
        ghost.style.left = `${startX + 8}px`;
        ghost.style.top = `${startY + 8}px`;
        ghost.style.pointerEvents = "none";
        ghost.style.padding = "2px 6px";
        ghost.style.background = "rgba(33, 150, 243, 0.15)";
        ghost.style.border = "1px solid rgba(33, 150, 243, 0.6)";
        ghost.style.borderRadius = "4px";
        ghost.style.fontSize = "12px";
        ghost.style.zIndex = "2147483647";
        ghost.textContent = (row.id ? `Row: ${row.id}` : "Row") + " moving";
        document.body.appendChild(ghost);
        this._rowMoveGhost = ghost;

        const ph = document.createElement("div");
        ph.className = "wx-row-move-placeholder wx-grid-row";
        ph.style.height = "4px";
        
        const td = document.createElement("div");
        td.className = "wx-grid-cell";
        td.style.gridColumn = "1 / -1";
        td.style.background = "var(--bs-primary, #0d6efd)";
        td.style.opacity = "0.35";
        td.style.height = "100%";
        
        ph.appendChild(td);
        tr.after(ph);
        this._rowMovePlaceholder = ph;

        this._body.addEventListener("mousemove", this._onBodyHoverMoveBound = this._onBodyHoverMove.bind(this));
    }

    /**
     * Update ghost position and recompute target based on hover position.
     * @param {number} x Pointer clientX.
     * @param {number} y Pointer clientY.
     */
    _updateRowMove(x, y) {
        if (this._rowMoveGhost) {
            this._rowMoveGhost.style.left = `${x + 8}px`;
            this._rowMoveGhost.style.top = `${y + 8}px`;
        }
    }

    /**
     * Compute current hover target and move placeholder accordingly.
     * Highlights target row and dims source row. Expands collapsed rows with children after hover delay.
     * @param {MouseEvent} e Mouse move event over tbody.
     */
    _onBodyHoverMove(e) {
        const tr = e.target.closest(".wx-grid-row");
        const switchedTarget = this._lastHoverTr !== tr;

        if (this._lastHoverTr && this._lastHoverTr !== tr) {
            this._lastHoverTr.classList.remove("wx-drag-over");
        }

        if (switchedTarget && this._hoverExpandTimer) {
            clearTimeout(this._hoverExpandTimer);
            this._hoverExpandTimer = null;
        }

        this._lastHoverTr = tr;

        if (!tr || !tr._dataRowRef || tr._dataRowRef === this._rowMoveSourceRow) {
            if (this._rowMovePlaceholder) { this._rowMovePlaceholder.style.display = ""; }
            this._rowMoveTarget = null;
            if (tr) { tr.classList.remove("wx-drag-over"); }
            return;
        }

        tr.classList.add("wx-drag-over");

        if (this._isDescendant(tr._dataRowRef, this._rowMoveSourceRow)) { return; }

        const rect = tr.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const height = rect.height;
        const zoneTop = height * 0.25;
        const zoneBottom = height * 0.75;
        const canDropAsChild = this._treeEnabled && this._treeMoveEnabled;

        if (canDropAsChild && relY > zoneTop && relY < zoneBottom) {
            this._rowMoveTarget = { mode: "child", row: tr._dataRowRef };
            if (this._rowMovePlaceholder) { this._rowMovePlaceholder.style.display = "none"; }
        } else {
            if (this._rowMovePlaceholder) { this._rowMovePlaceholder.style.display = ""; }
            this._rowMoveTarget = { mode: relY <= zoneTop ? "before" : "after", row: tr._dataRowRef };
            if (this._rowMovePlaceholder) {
                if (this._rowMoveTarget.mode === "before") { tr.before(this._rowMovePlaceholder); }
                else { tr.after(this._rowMovePlaceholder); }
            }
        }

        if (switchedTarget && this._treeEnabled && tr._dataRowRef?.children?.length && tr._dataRowRef.expanded === false) {
            this._hoverExpandTimer = setTimeout(() => {
                tr._dataRowRef.expanded = true;
                this.render();
            }, 2000);
        }
    }

    /**
     * Finalize the row move: perform atomic data update and re-render.
     */
    _finalizeRowMove() {
        if (this._onBodyHoverMoveBound) {
            this._body.removeEventListener("mousemove", this._onBodyHoverMoveBound);
            this._onBodyHoverMoveBound = null;
        }

        if (this._hoverExpandTimer) {
            clearTimeout(this._hoverExpandTimer);
            this._hoverExpandTimer = null;
        }

        if (this._lastHoverTr) {
            this._lastHoverTr.classList.remove("wx-drag-over");
            this._lastHoverTr = null;
        }

        if (this._rowMoveGhost) { this._rowMoveGhost.remove(); this._rowMoveGhost = null; }
        const ph = this._rowMovePlaceholder;

        const deriveTargetFromPlaceholder = () => {
            if (!ph || !ph.parentNode) { return null; }
            const prevRow = (() => {
                let el = ph.previousElementSibling;
                while (el && !el.classList.contains("wx-grid-row")) { el = el.previousElementSibling; }
                return el && el.classList.contains("wx-grid-row") ? el : null;
            })();
            const nextRow = (() => {
                let el = ph.nextElementSibling;
                while (el && !el.classList.contains("wx-grid-row")) { el = el.nextElementSibling; }
                return el && el.classList.contains("wx-grid-row") ? el : null;
            })();

            let targetParent = null;
            if (prevRow && prevRow._dataRowRef) { targetParent = prevRow._dataRowRef.parent || null; }
            else if (nextRow && nextRow._dataRowRef) { targetParent = nextRow._dataRowRef.parent || null; }

            const siblings = targetParent ? targetParent.children : this._rows;
            if (!Array.isArray(siblings)) { return null; }

            if (prevRow && prevRow._dataRowRef) {
                const idxPrev = siblings.indexOf(prevRow._dataRowRef);
                if (idxPrev >= 0) { return { targetParent, insertIndex: idxPrev + 1 }; }
            }
            if (nextRow && nextRow._dataRowRef) {
                const idxNext = siblings.indexOf(nextRow._dataRowRef);
                if (idxNext >= 0) { return { targetParent, insertIndex: idxNext }; }
            }
            return { targetParent, insertIndex: 0 };
        };

        if (!this._rowMoveTarget) {
            const derived = deriveTargetFromPlaceholder();
            if (derived) {
                this._rowMoveTarget = { mode: "derived", row: null };
                this._rowMoveDerivedTargetParent = derived.targetParent;
                this._rowMoveDerivedInsertIndex = derived.insertIndex;
            }
        }

        if (this._rowMovePlaceholder) { this._rowMovePlaceholder.remove(); this._rowMovePlaceholder = null; }

        const moving = this._rowMoveSourceRow;
        if (!moving) { this._applyDragSourceVisual(false); this._rowMoveActive = false; return; }

        let targetParent = null;
        let insertIndex = 0;

        if (this._rowMoveTarget && this._rowMoveTarget.mode === "child" && this._treeMoveEnabled && this._treeEnabled) {
            const targetRow = this._rowMoveTarget.row;
            if (targetRow === moving) { this._applyDragSourceVisual(false); this._rowMoveActive = false; return; }
            targetParent = targetRow;
            if (!Array.isArray(targetParent.children)) { targetParent.children = []; }
            insertIndex = targetParent.children.length;
            targetParent.expanded = true;
            this._isTree = true;
        } else if (this._rowMoveTarget && (this._rowMoveTarget.mode === "before" || this._rowMoveTarget.mode === "after")) {
            const targetRow = this._rowMoveTarget.row;
            const siblings = targetRow.parent ? targetRow.parent.children : this._rows;
            const baseIndex = siblings.indexOf(targetRow);
            insertIndex = this._rowMoveTarget.mode === "before" ? baseIndex : baseIndex + 1;
            targetParent = targetRow.parent || null;
        } else if (this._rowMoveTarget && this._rowMoveTarget.mode === "derived") {
            targetParent = this._rowMoveDerivedTargetParent || null;
            insertIndex = this._rowMoveDerivedInsertIndex || 0;
        } else {
            targetParent = null;
            insertIndex = 0;
        }

        if (targetParent && this._isDescendant(targetParent, moving)) { this._applyDragSourceVisual(false); this._rowMoveActive = false; return; }

        const oldParent = this._rowMoveSourceParent;
        const oldSiblings = oldParent ? oldParent.children : this._rows;
        const oldIndex = oldSiblings.indexOf(moving);
        if (oldIndex === -1) { this._applyDragSourceVisual(false); this._rowMoveActive = false; return; }

        const [removed] = oldSiblings.splice(oldIndex, 1);
        if (!removed) { this._applyDragSourceVisual(false); this._rowMoveActive = false; return; }

        const newSiblings = targetParent ? targetParent.children : this._rows;
        if (oldSiblings === newSiblings && oldIndex < insertIndex) { insertIndex--; }
        if (insertIndex < 0) { insertIndex = 0; }
        if (insertIndex > newSiblings.length) { insertIndex = newSiblings.length; }

        newSiblings.splice(insertIndex, 0, removed);
        removed.parent = targetParent;

        this._rowMoveActive = false;
        this._rowMoveSourceRow = null;
        this._rowMoveSourceParent = null;
        this._rowMoveTarget = null;
        this._rowMoveDerivedTargetParent = null;
        this._rowMoveDerivedInsertIndex = null;

        this._applyDragSourceVisual(false);
        this._schedulePersist();
        this.render();

        this._dispatch(webexpress.webui.Event.ROW_REORDER_EVENT, {
            sender: this._element,
            newOrder: newSiblings,
            parentId: targetParent ? targetParent.id : null,
            rowId: removed.id,
            toIndex: insertIndex
        });
    }

	/**
	 * Returns all columns that are currently marked as visible.
	 *
	 * @returns {Array<Object>} The list of visible columns.
	 */
    _getVisibleColumns() { return this._columns.filter((c) => c.visible); }

	/**
	 * Applies a text-based filter to the column selection menu.
	 * Hides menu items whose ID or label does not match the filter term.
	 *
	 * @param {HTMLElement} menuEl - The menu element containing column items.
	 */
    _applyColumnFilter(menuEl) {
        const term = (this._columnFilterTerm || "").toLowerCase();
        const items = menuEl.querySelectorAll(".wx-col-item");
        items.forEach((it) => {
            const id = it.dataset.columnId || "";
            const label = it.querySelector(".wx-form-check span")?.textContent || "";
            const hay = `${id} ${label}`.toLowerCase();
            it.style.display = (!term || hay.includes(term)) ? "" : "none";
        });
    }

	/**
	 * Schedules a debounced persistence update. Ensures that state is not
	 * written to the cookie too frequently.
	 */
    _schedulePersist() {
        if (!this._persistKey) { return; }
        if (this._saveDebounceTimer) { clearTimeout(this._saveDebounceTimer); }
        this._saveDebounceTimer = setTimeout(() => { this._persistState(); }, 300);
    }

	/**
	 * Persists the current table state (column order, visibility, widths,
	 * sort configuration, and collapsed tree nodes) into a cookie.
	 */
    _persistState() {
        const collapsed = [];
        const stack = [...this._rows];
        while (stack.length) {
            const r = stack.pop();
            if (r.id && r.children?.length) {
                if (!r.expanded) { collapsed.push(r.id); }
                for (let i = 0; i < r.children.length; i++) { stack.push(r.children[i]); }
            }
        }

        const sortCol = this._columns.find((c) => c.sort);
        const state = {
            v: 1,
            cols: this._columns.map((c) => ({ id: c.id, visible: c.visible, width: c.width })),
            order: this._columns.map((c) => c.id),
            sort: sortCol ? { id: sortCol.id, dir: sortCol.sort } : null,
            tree: { collapsed }
        };

        document.cookie = `${this._persistKey}=${encodeURIComponent(JSON.stringify(state))}; path=/; SameSite=Lax; max-age=31536000`;
    }

	/**
	 * Loads a previously persisted table state from a cookie and applies it
	 * to the current column configuration, sort state, and tree expansion.
	 */
    _loadStateFromCookie() {
        if (!this._persistKey) { return; }
        const match = document.cookie.match(new RegExp(`(^| )${this._persistKey}=([^;]+)`));
        if (!match) { return; }

        try {
            const obj = JSON.parse(decodeURIComponent(match[2]));
            if (!obj || obj.v !== 1) { return; }

            const colMap = new Map(this._columns.map((c) => [c.id, c]));

            if (Array.isArray(obj.order)) {
                const newOrder = [];
                obj.order.forEach((id) => {
                    const col = colMap.get(id);
                    if (col) { newOrder.push(col); }
                });
                this._columns.forEach((c) => { if (!newOrder.includes(c)) { newOrder.push(c); } });
                this._columns = newOrder;
            }

            if (obj.cols) {
                obj.cols.forEach((s) => {
                    const c = colMap.get(s.id);
                    if (c) {
                        if (typeof s.visible === "boolean") { c.visible = s.visible; }
                        if (s.width) { c.width = parseInt(s.width, 10); }
                    }
                });
            }

            if (obj.sort?.id) {
                const c = colMap.get(obj.sort.id);
                if (c) { c.sort = obj.sort.dir; }
            }

            if (obj.tree?.collapsed) {
                const set = new Set(obj.tree.collapsed);
                const stack2 = [...this._rows];
                while (stack2.length) {
                    const r = stack2.pop();
                    if (set.has(r.id)) { r.expanded = false; }
                    if (r.children) { stack2.push(...r.children); }
                }
            }
        } catch (e) { /* ignore */ }
    }

    /**
     * Structure check: is candidate a descendant of ancestor?
     * @param {Object} candidate Potential descendant row.
     * @param {Object} ancestor Potential ancestor row.
     * @returns {boolean} True when candidate is a descendant of ancestor.
     */
    _isDescendant(candidate, ancestor) {
        let p = candidate.parent;
        while (p) { if (p === ancestor) { return true; } p = p.parent; }
        return false;
    }

    /**
     * Set or reset visual state for drag source row.
     * @param {boolean} active Whether dragging is active.
     */
    _applyDragSourceVisual(active) {
        if (!this._rowMoveSourceEl) { return; }
        if (active) {
            this._rowMoveSourceEl.classList.add("wx-dragging");
        } else {
            this._rowMoveSourceEl.classList.remove("wx-dragging");
            this._rowMoveSourceEl.style.opacity = "";
            this._rowMoveSourceEl = null;
        }
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-table-reorderable", webexpress.webui.TableCtrlReorderable);