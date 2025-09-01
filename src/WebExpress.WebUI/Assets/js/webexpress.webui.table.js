/**
 * Table control with column reordering, visibility management, sorting, inline editing and row drag support.
 * Dispatched events:
 * - webexpress.webui.Event.TABLE_SORT_EVENT
 * - webexpress.webui.Event.COLUMN_REORDER_EVENT
 * - webexpress.webui.Event.COLUMN_VISIBILITY_EVENT
 * - webexpress.webui.Event.START_INLINE_EDIT_EVENT (delegated to SmartEditCtrl)
 * - webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT (delegated to SmartEditCtrl)
 * - webexpress.webui.Event.END_INLINE_EDIT_EVENT (delegated to SmartEditCtrl)
 * - webexpress.webui.Event.ROW_REORDER_EVENT 
 *
 * Persistence:
 * State (column order, visibility, widths, active sort) is stored in a cookie keyed
 * by a stable identifier (explicit persistKey, element id or generated hash).
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

    // flags
    _movableRow = false;
    _hasOptions = false;
    _allowColumnRemove = true;

    // drag state columns
    _draggedColumn = null;
    _dragColumnIndicator = null;

    // drag state rows
    _draggedRow = null;
    _rowPlaceholder = null;
    _rowDragActive = false;
    _autoScrollInterval = null;
    _lastPointerY = null;

    // resizing
    _resizingColumn = null;
    _resizingDef = null;
    _resizeStartX = null;
    _resizeStartWidth = null;
    _resizeMoveHandler = null;
    _resizeEndHandler = null;

    // persistence
    _persistKey = null;
    _saveDebounceTimer = null;

    // ui references
    _actionsPanel = null;
    _panelOutsideHandler = null;
    _panelKeyHandler = null;
    _ellipsisButton = null;
    _actionsOverlay = null;
    _overlayOutsideHandler = null;
    _overlayKeyHandler = null;

    /**
     * Creates a new table control instance by parsing declarative markup and rendering interactive table.
     * Applies persisted state if available, initializes DOM structure, and performs initial render.
     * @param {HTMLElement} element root element containing declarative definition
     */
    constructor(element) {
        super(element);
        this._table.className = "wx-table table table-hover table-sm";

        const tableColor = element.dataset.color || null;
        const tableBorder = element.dataset.border || null;
        const tableStriped = element.dataset.striped || null;
        this._movableRow = element.dataset.movableRow === "true" || false;
        this._allowColumnRemove = element.dataset.allowColumnRemove === "true" || false;
        this._persistKey = element.dataset.persistKey || element.id || null;

        this._options = this._parseOptions(element.querySelector(":scope > .wx-table-options"));
        this._columns = this._parseColumns(element.querySelector(":scope > .wx-table-columns"));
        this._rows = this._parseRows(element.querySelectorAll(":scope > .wx-table-row"));
        this._footer = this._parseFooter(element.querySelector(":scope > .wx-table-footer"));

        this._loadStateFromCookie();

        this._table.appendChild(this._col);
        this._table.appendChild(this._head);
        this._table.appendChild(this._body);

        if (Array.isArray(this._footer) && this._footer.length > 0) {
            this._table.appendChild(this._foot);
        }

        element.innerHTML = "";
        [
            "data-color", "data-border",
            "data-striped", "data-movable-row",
            "data-persist-key", "data-allow-column-remove"
        ].forEach(a => element.removeAttribute(a));
        element.appendChild(this._table);

        this._dragColumnIndicator = document.createElement("div");
        this._dragColumnIndicator.className = "wx-table-drag-indicator";
        this._dragColumnIndicator.style.display = "none";
        this._dragColumnIndicator.setAttribute("aria-hidden", "true");
        element.appendChild(this._dragColumnIndicator);

        if (tableColor) tableColor.split(/\s+/)
            .filter(Boolean)
            .forEach(c => this._table.classList.add(c));
        if (tableBorder) tableBorder.split(/\s+/)
            .filter(Boolean)
            .forEach(c => this._table.classList.add(c));
        if (tableStriped) tableStriped.split(/\s+/)
            .filter(Boolean)
            .forEach(c => this._table.classList.add(c));

        this.render();
    }

    /**
     * Parses global options menu container into structured list.
     * Supports divider, header, and actionable entries.
     * @param {HTMLElement|null} optionsDiv container element or null
     * @returns {Array<Object>} option descriptors
     */
    _parseOptions(optionsDiv) {
        if (!optionsDiv) return [];
        const list = [];
        for (const div of optionsDiv.children) {
            if (div.classList.contains("wx-dropdown-divider")) {
                list.push({ type: "divider" });
            } else if (div.classList.contains("wx-dropdown-header")) {
                list.push({ type: "header", content: div.textContent.trim(), icon: div.dataset.icon || null });
            } else {
                list.push({
                    id: div.id || null,
                    image: div.dataset.image || null,
                    icon: div.dataset.icon || null,
                    linkColor: div.dataset.linkcolor || null,
                    uri: div.dataset.uri || null,
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
     * Parses column definition container into column objects.
     * Handles basic properties (id, label, icon, width, visibility, sort state, edit metadata).
     * @param {HTMLElement|null} columnsDiv container element
     * @returns {Array<Object>} column definitions in declared order
     */
    _parseColumns(columnsDiv) {
        if (!columnsDiv) return [];
        const headerColor = columnsDiv.dataset.color || null;
        if (headerColor) this._head.classList.add(headerColor);
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
            html: div.firstElementChild
        }));
    }

    /**
     * Parses all row elements into structured row objects with cell metadata and per-row options.
     * @param {NodeListOf<HTMLElement>} rowsDivs list of row div elements
     * @returns {Array<Object>} structured rows
     */
    _parseRows(rowsDivs) {
        const rows = [];
        for (const div of rowsDivs) {
            const r = {
                id: div.id || null,
                class: div.className || null,
                style: div.getAttribute("style") || null,
                color: div.dataset.color || null,
                cells: [],
                options: null
            };
            for (const child of div.children) {
                if (child.classList.contains("wx-table-options")) {
                    r.options = this._parseOptions(child);
                    this._hasOptions = true;
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
            rows.push(r);
        }
        return rows;
    }

    /**
     * Parses footer container into raw HTML cell content list aligned by logical column index.
     * @param {HTMLElement|null} footerDiv footer container
     * @returns {Array<string>} footer html contents
     */
    _parseFooter(footerDiv) {
        if (!footerDiv) return [];
        return Array.from(footerDiv.children).map(div => div.innerHTML.trim());
    }

    /**
     * Clears all rendered table sections (colgroup, head, body, foot).
     * Does not modify underlying data arrays.
     */
    clear() {
        this._col.innerHTML = "";
        this._head.innerHTML = "";
        this._body.innerHTML = "";
        this._foot.innerHTML = "";
    }

    /**
     * Orders rows by a given column according to its current sort direction (asc/desc).
     * Numeric comparison used when all cell values are numeric-like for that column.
     * Schedules persistence and triggers full re-render.
     * @param {Object} column column definition reference
     */
    orderRows(column) {
        const idx = this._columns.indexOf(column);
        if (idx === -1) return;
        const numeric = this._rows.every(r => {
            const v = r.cells[idx]?.text?.trim();
            return v === "" || /^-?\d+(\.\d+)?$/.test(v);
        });
        this._rows.sort((a, b) => {
            const va = a.cells[idx]?.text || "";
            const vb = b.cells[idx]?.text || "";
            if (column.sort === "asc") return numeric
                ? (parseFloat(va) || 0) - (parseFloat(vb) || 0)
                : va.localeCompare(vb, undefined, { numeric: true });
            if (column.sort === "desc") return numeric
                ? (parseFloat(vb) || 0) - (parseFloat(va) || 0)
                : vb.localeCompare(va, undefined, { numeric: true });
            return 0;
        });
        this._schedulePersist();
        this.render();
    }

    /**
     * Changes visibility of a column (by id or index) if allowed and updates UI.
     * Prevents hiding last visible column for usability.
     * Dispatches visibility event and persists state.
     * @param {string|number} idOrIndex column id or positional index
     * @param {boolean} visible desired visibility state
     * @fires webexpress.webui.Event.COLUMN_VISIBILITY_EVENT
     */
    setColumnVisibility(idOrIndex, visible) {
        let col = null;
        if (typeof idOrIndex === "number") {
            col = this._columns[idOrIndex];
        } else {
            col = this._columns.find(c => c.id === idOrIndex);
        }
        if (!col) return;
        if (col.visible === visible) return;
        if (!this._allowColumnRemove) return;
        col.visible = visible;
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.COLUMN_VISIBILITY_EVENT, {
            detail: { sender: this._element, columnId: col.id, visible: col.visible, columnIndex: this._columns.indexOf(col) }
        }));
        this._schedulePersist();
        this.render();
    }

    /**
     * Hides a column by id or index.
     * @param {string|number} idOrIndex column identifier or index
     */
    hideColumn(idOrIndex) { this.setColumnVisibility(idOrIndex, false); }

    /**
     * Shows a column by id or index.
     * @param {string|number} idOrIndex column identifier or index
     */
    showColumn(idOrIndex) { this.setColumnVisibility(idOrIndex, true); }

    /**
     * Toggles visibility of a column.
     * @param {string|number} idOrIndex column identifier or index
     */
    toggleColumn(idOrIndex) {
        let col = null;
        if (typeof idOrIndex === "number") {
            col = this._columns[idOrIndex];
        } else {
            col = this._columns.find(c => c.id === idOrIndex);
        }
        if (!col) return;
        this.setColumnVisibility(col.id, !col.visible);
    }

    /**
     * Returns an array of currently visible columns.
     * @returns {Array<Object>} visible column definitions
     */
    getVisibleColumns() { return this._columns.filter(c => c.visible); }

    /**
     * Main render pipeline: closes active overlays, renders columns, rows, footer, updates panel and synchronizes widths.
     */
    render() {
        this._closeActionsOverlay();
        this._renderColumns();
        this._renderRows();
        this._renderFooter();
        if (this._actionsPanel && this._actionsPanel.isConnected) this._updateActionsPanel();
        this._syncColumnWidths();
    }

    /**
     * Renders table header row and colgroup based on current column state.
     * Adds drag, resize, and sort handlers per visible column.
     * Appends actions header as needed.
     */
    _renderColumns() {
        const headRow = document.createElement("tr");
        this._col.innerHTML = "";
        this._head.innerHTML = "";
        this._head.appendChild(headRow);
        if (this._movableRow) {
            headRow.appendChild(document.createElement("th"));
            const fixCol = document.createElement("col");
            fixCol.style.width = "1ch";
            fixCol.style.maxWidth = "1ch";
            this._col.appendChild(fixCol);
        }
        this._columns.forEach(col => {
            if (!col.visible) return;
            const th = document.createElement("th");
            th.draggable = true;
            th.dataset.columnId = col.id;
            if (col.sort) th.classList.add(col.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc");
            if (col.color) th.classList.add(col.color);
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
            if (col.width) cg.style.width = col.width + "px";
            this._col.appendChild(cg);
            this._enableDragAndDropColumn(th, col);
            this._enableResizableColumns(th, col);
            this._enableSortColumns(th, col);
        });
        this._renderActionsHeader(headRow);
    }

    /**
     * Renders actions header cell when there are hidden columns, global options, or row options present.
     * Builds appropriate UI (gear menu, column toggle, combined overlay) based on configuration.
     * @param {HTMLTableRowElement} headRow header row element
     */
    _renderActionsHeader(headRow) {
        const anyHidden = this._columns.some(c => !c.visible);
        const hasGlobalOptions = (this._options && this._options.length > 0);
        const hasRowOptions = this._hasOptions;
        const showHeader = anyHidden || hasGlobalOptions || hasRowOptions || this._allowColumnRemove;
        if (!showHeader) return;
        const th = document.createElement("th");
        th.className = "wx-table-actions";
        th.style.overflow = "visible";
        if (hasGlobalOptions && !this._allowColumnRemove) {
            const gearWrap = document.createElement("div");
            gearWrap.className = "wx-table-actions-gear";
            gearWrap.dataset.icon = "fas fa-cog";
            gearWrap.dataset.size = "btn-sm";
            gearWrap.dataset.border = "false";
            new webexpress.webui.DropdownCtrl(gearWrap).items = this._options;
            th.appendChild(gearWrap);
        }
        else if (!hasGlobalOptions && this._allowColumnRemove) {
            const plusBtn = document.createElement("button");
            plusBtn.type = "button";
            plusBtn.className = "btn";
            plusBtn.title = webexpress.webui.I18N.translate("webexpress.webui:table.columns.toggle") ?? "Show/Hide columns";
            plusBtn.setAttribute("aria-haspopup", "true");
            plusBtn.setAttribute("aria-expanded", "false");
            plusBtn.textContent = "+";
            plusBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (this._actionsPanel && this._actionsPanel.isConnected) this._closeActionsPanel();
                else this._openActionsPanel(plusBtn);
            });
            th.appendChild(plusBtn);
        } else if (hasGlobalOptions && this._allowColumnRemove) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn";
            btn.setAttribute("aria-haspopup", "true");
            btn.setAttribute("aria-expanded", "false");
            btn.title = webexpress.webui.I18N.translate("webexpress.webui:table.options.label") ?? "Options";
            btn.textContent = "…";
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                this._toggleActionsOverlay(th);
            });
            this._ellipsisButton = btn;
            th.appendChild(btn);
            const overlay = document.createElement("div");
            overlay.className = "wx-table-actions-overlay";
            overlay.setAttribute("role", "menu");
            overlay.style.display = "none";
            this._actionsOverlay = overlay;
            const plusBtn = document.createElement("button");
            plusBtn.type = "button";
            plusBtn.className = "btn";
            plusBtn.title = webexpress.webui.I18N.translate("webexpress.webui:table.columns.toggle") ?? "Show/Hide columns";
            plusBtn.setAttribute("aria-haspopup", "true");
            plusBtn.setAttribute("aria-expanded", "false");
            plusBtn.textContent = "+";
            plusBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (this._actionsPanel && this._actionsPanel.isConnected) this._closeActionsPanel();
                else this._openActionsPanel(plusBtn);
            });
            overlay.appendChild(plusBtn);
            const gearWrap = document.createElement("div");
            gearWrap.className = "wx-table-actions-gear";
            gearWrap.dataset.icon = "fas fa-cog";
            gearWrap.dataset.size = "btn-sm";
            gearWrap.dataset.border = "false";
            new webexpress.webui.DropdownCtrl(gearWrap).items = this._options;
            overlay.appendChild(gearWrap);
            th.appendChild(overlay);
        }
        headRow.appendChild(th);
        const cg = document.createElement("col");
        cg.style.width = "1em";
        this._col.appendChild(cg);
    }

    /**
     * Toggles the visibility of the actions overlay within the header cell.
     * @param {HTMLElement} th header actions cell
     */
    _toggleActionsOverlay(th) {
        if (th.classList.contains("wx-actions-open")) this._closeActionsOverlay();
        else this._openActionsOverlay(th);
    }

    /**
     * Opens the actions overlay (column toggle + options) and binds outside handlers.
     * Focus moves to first interactive element.
     * @param {HTMLElement} th header cell
     */
    _openActionsOverlay(th) {
        th.classList.add("wx-actions-open");
        if (this._ellipsisButton) this._ellipsisButton.setAttribute("aria-expanded", "true");
        if (this._actionsOverlay) this._actionsOverlay.style.display = "inline-flex";
        this._bindOverlayOutside();
        const first = this._actionsOverlay?.querySelector("button, [tabindex]:not([tabindex='-1'])");
        if (first) setTimeout(() => first.focus(), 0);
    }

    /**
     * Closes the actions overlay and unbinds outside handlers.
     */
    _closeActionsOverlay() {
        const th = this._head.querySelector("th.wx-table-actions");
        if (th) th.classList.remove("wx-actions-open");
        if (this._ellipsisButton) this._ellipsisButton.setAttribute("aria-expanded", "false");
        if (this._actionsOverlay) this._actionsOverlay.style.display = "none";
        this._unbindOverlayOutside();
    }

    /**
     * Binds event listeners for overlay outside click and escape key.
     */
    _bindOverlayOutside() {
        this._unbindOverlayOutside();
        this._overlayOutsideHandler = (e) => {
            if (this._actionsPanel && this._actionsPanel.contains(e.target)) return;
            const th = this._head.querySelector("th.wx-table-actions");
            if (!th) return;
            if (th.contains(e.target)) return;
            this._closeActionsOverlay();
        };
        document.addEventListener("mousedown", this._overlayOutsideHandler, true);
        this._overlayKeyHandler = (e) => {
            if (e.key === "Escape") {
                this._closeActionsPanel();
                this._closeActionsOverlay();
            }
        };
        document.addEventListener("keydown", this._overlayKeyHandler);
    }

    /**
     * Unbinds overlay outside listeners if present.
     */
    _unbindOverlayOutside() {
        if (this._overlayOutsideHandler) {
            document.removeEventListener("mousedown", this._overlayOutsideHandler, true);
            this._overlayOutsideHandler = null;
        }
        if (this._overlayKeyHandler) {
            document.removeEventListener("keydown", this._overlayKeyHandler);
            this._overlayKeyHandler = null;
        }
    }

    /**
     * Renders all table rows into tbody from structured row data respecting visibility of columns.
     * @private
     * @returns {void}
     */
    _renderRows() {
        this._body.innerHTML = "";
        this._rows.forEach(row => this._addRow(row));
    }

    /**
     * Adds a single row to tbody, creating cells for visible columns and initializing inline editing / options.
     * @param {Object} row row data object
     */
    _addRow(row) {
        const tr = document.createElement("tr");
        if (row.color) row.color.split(/\s+/)
            .filter(Boolean)
            .forEach(c => tr.classList.add(c));
        if (row.class) row.class.split(/\s+/)
            .filter(Boolean)
            .forEach(c => tr.classList.add(c));
        if (row.style) tr.setAttribute("style", row.style);
        tr._dataRowRef = row;
        if (this._movableRow) {
            const handle = document.createElement("td");
            handle.className = "wx-table-drag-handle";
            handle.textContent = "☰";
            handle.setAttribute("aria-label", "Move row");
            tr.appendChild(handle);
            this._enableDragAndDropRow(handle, row);
        }
        this._columns.forEach((colDef, idx) => {
            if (!colDef.visible) return;
            const td = document.createElement("td");
            const cell = row.cells[idx];
            if (cell) {
                if (cell.color) cell.color.split(/\s+/)
                    .filter(Boolean)
                    .forEach(c => td.classList.add(c));
                if (cell.class) cell.class.split(/\s+/)
                    .filter(Boolean)
                    .forEach(c => td.classList.add(c));
                if (cell.style) td.setAttribute("style", cell.style);
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
                    if (cell.objectId) wrap.id = colDef.id;
                    if (cell.objectId) wrap.setAttribute("data-object-id", cell.id);
                    if (colDef.name) wrap.setAttribute("data-object-name", colDef.name);
                    if (colDef.editAction) wrap.setAttribute("data-form-action", colDef.editAction);
                    if (colDef.editMethod) wrap.setAttribute("data-form-method", colDef.editMethod);
                    if (colDef.html) {
                        wrap.appendChild(colDef.html);
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
                } else {
                    wrap.appendChild(cell.html ?? document.createTextNode(cell.text || ""));
                }
                td.appendChild(wrap);
            }
            tr.appendChild(td);
        });

        if (row.options && row.options.length > 0) {
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

        this._body.appendChild(tr);
    }

    /**
     * Renders footer row mapping visible columns to provided footer data.
     * Maintains alignment with logical column indices (hidden columns skipped).
     * Adds structural cells for drag handle and actions column when present.
     */
    _renderFooter() {
        this._foot.innerHTML = "";
        const hasData = Array.isArray(this._footer) && this._footer.length > 0;
        const tr = document.createElement("tr");

        // add drag placeholder cell if rows movable
        if (this._movableRow) tr.appendChild(document.createElement("td"));

        if (hasData) {
            let footerIndex = 0;
            // iterate columns in original order; only visible ones produce cells
            this._columns.forEach((col, logicalIdx) => {
                if (!col.visible) {
                    // advance index even for hidden column to keep mapping stable
                    footerIndex++;
                    return;
                }
                const td = document.createElement("td");
                const content = this._footer[logicalIdx]; // align by logical index (includes hidden)
                if (content != null) td.innerHTML = content;
                tr.appendChild(td);
                footerIndex++;
            });
        } else {
            // legacy behavior: produce blank row matching current visible structure
            this._columns.forEach(c => {
                if (!c.visible) return;
                tr.appendChild(document.createElement("td"));
            });
        }

        // actions cell if needed
        if (this._hasOptions || this._options.length > 0 || this._columns.some(c => !c.visible)) {
            const tdActions = document.createElement("td");
            // could insert aggregated footer action content later if required
            tr.appendChild(tdActions);
        }

        this._foot.appendChild(tr);
    }

    /**
     * Opens column visibility panel (dialog-like) anchored to a button and binds outside handlers.
     * Focus shifts to first checkbox post render.
     * @param {HTMLElement} anchor button element triggering panel
     */
    _openActionsPanel(anchor) {
        this._closeActionsPanel();
        this._actionsPanel = document.createElement("div");
        this._actionsPanel.className = "wx-table-col-visibility-panel";
        this._actionsPanel.setAttribute("role", "dialog");
        this._actionsPanel.setAttribute("aria-label", webexpress.webui.I18N.translate("webexpress.webui:table.columns.toggle") ?? "Show/Hide columns");
        document.body.appendChild(this._actionsPanel);
        this._updateActionsPanel();
        const rect = anchor.getBoundingClientRect();
        const width = 240;
        const top = rect.bottom + 4;
        const left = Math.min(Math.max(8, rect.left + rect.width - width), window.innerWidth - width - 8);
        this._actionsPanel.style.position = "fixed";
        this._actionsPanel.style.top = top + "px";
        this._actionsPanel.style.left = left + "px";
        anchor.setAttribute("aria-expanded", "true");
        this._panelOutsideHandler = (ev) => {
            if (!this._actionsPanel) return;
            if (this._actionsPanel.contains(ev.target) || anchor.contains(ev.target)) return;
            this._closeActionsPanel();
        };
        document.addEventListener("mousedown", this._panelOutsideHandler, true);
        this._panelKeyHandler = (e) => {
            if (e.key === "Escape") this._closeActionsPanel();
        };
        document.addEventListener("keydown", this._panelKeyHandler);
        setTimeout(() => {
            const first = this._actionsPanel.querySelector("input[type=checkbox]");
            if (first) first.focus();
        }, 0);
    }

    /**
     * Closes column visibility panel and removes bound listeners.
     */
    _closeActionsPanel() {
        if (this._actionsPanel && this._actionsPanel.parentNode)
            this._actionsPanel.parentNode.removeChild(this._actionsPanel);
        this._actionsPanel = null;
        if (this._panelOutsideHandler) {
            document.removeEventListener("mousedown", this._panelOutsideHandler, true);
            this._panelOutsideHandler = null;
        }
        if (this._panelKeyHandler) {
            document.removeEventListener("keydown", this._panelKeyHandler);
            this._panelKeyHandler = null;
        }
        const btn = document.querySelector(".wx-table-actions [aria-expanded='true']");
        if (btn) btn.setAttribute("aria-expanded", "false");
    }

    /**
     * Updates contents of visibility panel (checkbox list) reflecting current column visibility.
     * Resets and rebuilds UI; maintains ability to prevent hiding last visible column.
     */
    _updateActionsPanel() {
        if (!this._actionsPanel) return;
        this._actionsPanel.innerHTML = "";
        const head = document.createElement("div");
        head.className = "wx-table-col-visibility-header";
        head.textContent = webexpress.webui.I18N.translate("webexpress.webui:table.columns.label") ?? "Columns";
        this._actionsPanel.appendChild(head);
        const list = document.createElement("ul");
        list.className = "wx-table-column-visibility list-unstyled m-0";
        this._columns.forEach(c => {
            const li = document.createElement("li");
            const id = "ap_col_" + c.id;
            const label = document.createElement("label");
            label.setAttribute("for", id);
            label.style.display = "flex";
            label.style.gap = ".5em";
            label.style.alignItems = "center";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.id = id;
            cb.checked = c.visible;
            cb.addEventListener("change", () => {
                if (!cb.checked && this.getVisibleColumns().length <= 1) {
                    cb.checked = true;
                    return;
                }
                this.setColumnVisibility(c.id, cb.checked);
                this._updateActionsPanel();
            });
            const span = document.createElement("span");
            span.textContent = c.label;
            label.appendChild(cb);
            label.appendChild(span);
            li.appendChild(label);
            list.appendChild(li);
        });
        this._actionsPanel.appendChild(list);
        const footer = document.createElement("div");
        footer.className = "wx-table-col-visibility-footer";
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "btn btn-primary";
        closeBtn.textContent = webexpress.webui.I18N.translate("webexpress.webui:close") ?? "Close";
        closeBtn.addEventListener("click", () => this._closeActionsPanel());
        footer.appendChild(closeBtn);
        this._actionsPanel.appendChild(footer);
    }

    /**
     * Enables column drag-and-drop (with Ctrl modifier) and sets up visual indicator & reorder logic.
     * Prevents unintended drags during resize or removal operations.
     * Dispatches column reorder event and persists state on successful drop.
     * @param {HTMLElement} th header cell
     * @param {Object} column column definition
     * @fires webexpress.webui.Event.COLUMN_REORDER_EVENT
     */
    _enableDragAndDropColumn(th, column) {
        th.draggable = true;
        th.addEventListener("dragstart", (e) => {
            if (!e.ctrlKey) { e.preventDefault(); return; }
            if (e.target.closest(".wx-table-column-resizer")) { e.preventDefault(); return; }
            if (e.target.closest(".wx-table-col-remove")) { e.preventDefault(); return; }
            this._draggedColumn = column;
            th.classList.add("wx-table-dragging");
        });
        th.addEventListener("dragend", () => {
            th.classList.remove("wx-table-dragging");
            this._dragColumnIndicator.style.display = "none";
            this._draggedColumn = null;
        });
        th.addEventListener("dragover", (e) => {
            if (!this._draggedColumn || !e.ctrlKey) return;
            e.preventDefault();
            const rect = th.getBoundingClientRect();
            const x = e.clientX;
            const leftSide = x < rect.left + th.offsetWidth / 2;
            this._dragColumnIndicator.style.top = rect.top + "px";
            this._dragColumnIndicator.style.left = (leftSide ? rect.left - 2 : rect.left + th.offsetWidth - 2) + "px";
            this._dragColumnIndicator.style.height = th.offsetHeight + "px";
            this._dragColumnIndicator.style.display = "block";
        });
        th.addEventListener("dragleave", () => {
            this._dragColumnIndicator.style.display = "none";
        });
        th.addEventListener("drop", (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            if (this._draggedColumn === null || column === null || this._draggedColumn === column) return;
            const sourceIndex = this._columns.indexOf(this._draggedColumn);
            const targetIndex = this._columns.indexOf(column);
            if (sourceIndex === -1 || targetIndex === -1) return;
            const rect = th.getBoundingClientRect();
            const x = e.clientX;
            const insertBefore = x < rect.left + th.offsetWidth / 2;
            let adjusted = targetIndex;
            if (insertBefore) {
                if (sourceIndex < targetIndex) adjusted -= 1;
            } else {
                if (sourceIndex > targetIndex) adjusted += 1;
            }
            if (sourceIndex === adjusted) return;
            const moved = this._columns.splice(sourceIndex, 1)[0];
            this._columns.splice(adjusted, 0, moved);
            this._rows.forEach(r => {
                if (!Array.isArray(r.cells)) return;
                if (sourceIndex < 0 || sourceIndex >= r.cells.length) return;
                const movedCell = r.cells.splice(sourceIndex, 1)[0];
                const targetPos = Math.min(Math.max(adjusted, 0), r.cells.length);
                r.cells.splice(targetPos, 0, movedCell);
            });
            this._dragColumnIndicator.style.display = "none";
            this._draggedColumn = null;
            this._triggerColumnReorderEvent(sourceIndex, adjusted);
            this._schedulePersist();
            this.render();
        });
    }

    /**
     * Enables sorting via header click. Cycles through asc -> desc -> none.
     * Clears previous sort and triggers row ordering and sort event dispatch.
     * @param {HTMLElement} th header cell
     * @param {Object} column column definition
     * @fires webexpress.webui.Event.TABLE_SORT_EVENT
     */
    _enableSortColumns(th, column) {
        th.addEventListener("click", (ev) => {
            if (ev.target.closest(".wx-table-col-remove")) return;
            if (th.classList.contains("wx-table-actions")) return;
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
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.TABLE_SORT_EVENT, {
                detail: { sender: this._element, columnId: column.id, sortDirection: column.sort, columnLabel: th.textContent.trim() }
            }));
        });
    }

    /**
     * Enables row drag-and-drop interaction on a handle cell including keyboard support.
     * @param {HTMLTableCellElement} handle drag handle cell
     * @param {Object} row row data reference
     */
    _enableDragAndDropRow(handle, row) {
        handle.draggable = true;
        handle.setAttribute("tabindex", "0");
        handle.setAttribute("role", "button");
        const tr = handle.closest("tr");
        handle.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                if (!this._rowDragActive) this._startRowDrag(tr, row);
                else this._finalizeRowDrag();
            }
            if (this._rowDragActive && (e.code === "ArrowUp" || e.code === "ArrowDown")) {
                e.preventDefault();
                const idx = this._getPlaceholderIndex();
                const delta = e.code === "ArrowUp" ? -1 : 1;
                const target = Math.min(Math.max(idx + delta, 0), this._body.children.length - 1);
                const ref = this._body.children[target];
                if (ref && ref !== this._rowPlaceholder) {
                    this._body.insertBefore(this._rowPlaceholder, delta > 0 ? ref.nextSibling : ref);
                }
            }
            if (this._rowDragActive && e.code === "Enter") { e.preventDefault(); this._finalizeRowDrag(); }
            if (this._rowDragActive && e.code === "Escape") { e.preventDefault(); this._cancelRowDrag(); }
        });
        handle.addEventListener("dragstart", (e) => {
            this._startRowDrag(tr, row);
            const img = document.createElement("canvas");
            img.width = img.height = 1;
            e.dataTransfer.setDragImage(img, 0, 0);
        });
        handle.addEventListener("dragend", () => {
            if (this._rowDragActive) this._finalizeRowDrag();
        });
    }

    /**
     * Initiates row drag state: sets up placeholder, autoscroll, and event bindings.
     * @param {HTMLTableRowElement} tr row element
     * @param {Object} row row data reference
     */
    _startRowDrag(tr, row) {
        this._draggedRow = row;
        this._rowDragActive = true;
        tr.classList.add("wx-table-dragging");
        this._rowPlaceholder = document.createElement("tr");
        this._rowPlaceholder.className = "wx-table-drag-placeholder";
        this._rowPlaceholder.style.height = tr.offsetHeight + "px";
        tr.parentNode.insertBefore(this._rowPlaceholder, tr.nextSibling);
        if (!this._body._rowDragBound) {
            this._body.addEventListener("dragover", (e) => this._onTbodyDragOver(e));
            this._body.addEventListener("drop", (e) => {
                e.preventDefault();
                if (this._rowDragActive) this._finalizeRowDrag();
            });
            this._body._rowDragBound = true;
        }
        this._autoScrollInterval = setInterval(() => this._autoScrollCheck(), 30);
    }

    /**
     * Handles dragover events within tbody to position placeholder relative to pointer y coordinate.
     * @param {DragEvent} e drag event
     */
    _onTbodyDragOver(e) {
        if (!this._rowDragActive || !this._rowPlaceholder) return;
        e.preventDefault();
        this._lastPointerY = e.clientY;
        const after = this._getRowAfterPosition(e.clientY);
        if (after == null) {
            if (this._body.lastElementChild !== this._rowPlaceholder) this._body.appendChild(this._rowPlaceholder);
        } else {
            if (after !== this._rowPlaceholder) this._body.insertBefore(this._rowPlaceholder, after);
        }
    }

    /**
     * Determines the row element after which the placeholder should appear based on pointer Y.
     * @param {number} y pointer client y coordinate
     * @returns {HTMLTableRowElement|null} closest row below pointer or null
     */
    _getRowAfterPosition(y) {
        const rows = [...this._body.querySelectorAll("tr")].filter(r => r !== this._rowPlaceholder && !r.classList.contains("wx-table-dragging"));
        let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
        for (const r of rows) {
            const box = r.getBoundingClientRect();
            const offset = y - (box.top + box.height / 2);
            if (offset < 0 && offset > closest.offset) closest = { offset, element: r };
        }
        return closest.element;
    }

    /**
     * Gets the index position of the placeholder within tbody children list.
     * @returns {number} placeholder index or -1 if not active
     */
    _getPlaceholderIndex() {
        if (!this._rowPlaceholder) return -1;
        return Array.from(this._body.children).indexOf(this._rowPlaceholder);
    }

    /**
     * Performs auto scroll during row drag when pointer approaches container edges.
     */
    _autoScrollCheck() {
        if (!this._rowDragActive) return;
        if (this._lastPointerY == null) return;
        const container = this._table.parentElement || document.scrollingElement;
        const rect = container.getBoundingClientRect();
        const threshold = 40;
        if (this._lastPointerY < rect.top + threshold) container.scrollTop -= 10;
        else if (this._lastPointerY > rect.bottom - threshold) container.scrollTop += 10;
    }

    /**
     * Finalizes row drag: updates internal row order based on placeholder position, dispatches reorder event, persists, re-renders.
     * @fires webexpress.webui.Event.ROW_REORDER_EVENT
     */
    _finalizeRowDrag() {
        if (!this._rowDragActive) return;
        const ph = this._getPlaceholderIndex();
        if (ph >= 0) {
            const domRows = [...this._body.querySelectorAll("tr")].filter(r => r !== this._rowPlaceholder && !r.classList.contains("wx-table-dragging"));
            const order = domRows.map(r => r._dataRowRef).filter(Boolean);
            const old = order.indexOf(this._draggedRow);
            if (old !== -1) order.splice(old, 1);
            const clamped = Math.min(Math.max(ph, 0), order.length);
            order.splice(clamped, 0, this._draggedRow);
            const previousOrder = this._rows;
            this._rows = order;
            if (webexpress?.webui?.Event?.ROW_REORDER_EVENT) {
                document.dispatchEvent(new CustomEvent(webexpress.webui.Event.ROW_REORDER_EVENT, {
                    detail: { sender: this._element, newOrder: this._rows, previousOrder: previousOrder }
                }));
            }
        }
        this._cleanupRowDrag();
        this._schedulePersist();
        this.render();
    }

    /**
     * Cancels active row drag and restores original rendering.
     */
    _cancelRowDrag() {
        if (!this._rowDragActive) return;
        this._cleanupRowDrag();
        this.render();
    }

    /**
     * Cleans up drag state objects, intervals, placeholder and CSS classes after finalize or cancel.
     */
    _cleanupRowDrag() {
        if (this._rowPlaceholder && this._rowPlaceholder.parentNode) this._rowPlaceholder.parentNode.removeChild(this._rowPlaceholder);
        this._rowPlaceholder = null;
        const dragging = this._body.querySelector("tr.wx-table-dragging");
        if (dragging) dragging.classList.remove("wx-table-dragging");
        this._draggedRow = null;
        this._rowDragActive = false;
        this._lastPointerY = null;
        if (this._autoScrollInterval) {
            clearInterval(this._autoScrollInterval);
            this._autoScrollInterval = null;
        }
    }

    /**
     * Adds resizer affordance to a column header enabling width adjustment via mouse drag.
     * @param {HTMLElement} th header cell
     * @param {Object} column column definition
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
     * Handles resize start for a given column header.
     * Stores initial state and binds move/end listeners.
     * @param {MouseEvent} e mousedown event
     * @param {HTMLElement} th header cell
     * @param {Object} column column definition
     */
    _onResizeStart(e, th, column) {
        this._resizingColumn = th;
        this._resizingDef = column;
        this._resizeStartX = e.pageX;
        this._resizeStartWidth = th.offsetWidth;
        document.body.classList.add("wx-table-resizing");
        document.addEventListener("mousemove", this._resizeMoveHandler = (ev) => this._onResize(ev, th, column));
        document.addEventListener("mouseup", this._resizeEndHandler = () => this._onResizeEnd(th));
    }

    /**
     * Performs resize calculation on mouse move and applies width to header & col element.
     * @param {MouseEvent} e mouse move event
     * @param {HTMLElement} th header cell
     * @param {Object} column column definition
     */
    _onResize(e, th, column) {
        if (!this._resizingColumn || this._resizingColumn !== th) return;
        const dx = e.pageX - this._resizeStartX;
        const w = Math.max(this._resizeStartWidth + dx, 30);
        th.style.width = w + "px";
        column.width = w;
        this._applyWidthToColElement(column.id, w);
    }

    /**
     * Ends resize operation, cleans handlers, triggers persistence scheduling.
     * @param {HTMLElement} th header cell
     */
    _onResizeEnd(th) {
        if (!this._resizingColumn || this._resizingColumn !== th) return;
        document.body.classList.remove("wx-table-resizing");
        document.removeEventListener("mousemove", this._resizeMoveHandler);
        document.removeEventListener("mouseup", this._resizeEndHandler);
        this._resizingColumn = null;
        this._resizingDef = null;
        this._resizeStartX = null;
        this._resizeStartWidth = null;
        this._schedulePersist();
    }

    /**
     * Synchronizes explicitly stored widths to respective col elements after re-renders.
     */
    _syncColumnWidths() {
        this._columns.forEach(c => {
            if (!c.visible) return;
            if (c.width) this._applyWidthToColElement(c.id, c.width);
        });
    }

    /**
     * Applies width to col element identified by column id.
     * @param {string} columnId target column identifier
     * @param {number} width width in pixels
     */
    _applyWidthToColElement(columnId, width) {
        const colEl = this._col.querySelector(`col[data-column-id='${columnId}']`);
        if (colEl) colEl.style.width = width + "px";
    }

    /**
     * Loads persisted state from cookie and applies to current column definitions (order, visibility, widths, sort).
     * Silently ignores malformed or version-mismatched data.
     */
    _loadStateFromCookie() {
        const raw = this._getCookie(this._persistKey);
        if (!raw) return;
        try {
            const obj = JSON.parse(decodeURIComponent(raw));
            if (!obj || obj.v !== 1) return;
            if (Array.isArray(obj.order) && obj.order.length) {
                const map = new Map(this._columns.map(c => [c.id, c]));
                const reordered = [];
                obj.order.forEach(id => { if (map.has(id)) reordered.push(map.get(id)); });
                this._columns.forEach(c => { if (!reordered.includes(c)) reordered.push(c); });
                this._columns = reordered;
            }
            if (Array.isArray(obj.cols)) {
                const cmap = new Map(obj.cols.map(c => [c.id, c]));
                this._columns.forEach(c => {
                    if (cmap.has(c.id)) {
                        const s = cmap.get(c.id);
                        if (typeof s.visible === "boolean") c.visible = s.visible;
                        if (s.width != null) c.width = parseInt(s.width, 10);
                    }
                });
            }
            if (obj.sort && obj.sort.id && ["asc", "desc"].includes(obj.sort.dir)) {
                const col = this._columns.find(c => c.id === obj.sort.id);
                if (col) col.sort = obj.sort.dir;
            }
        } catch (_) { }
    }

    /**
     * Debounces persistence to avoid excessive cookie writes during rapid state changes.
     */
    _schedulePersist() {
        if (!this._persistKey) return;
        if (this._saveDebounceTimer) clearTimeout(this._saveDebounceTimer);
        this._saveDebounceTimer = setTimeout(() => this._persistState(), 150);
    }

    /**
     * Persists current table state (columns ordering, visibility, widths, active sort) into cookie.
     */
    _persistState() {
        if (!this._persistKey) return;
        const state = {
            v: 1,
            cols: this._columns.map(c => ({ id: c.id, visible: c.visible, width: c.width })),
            order: this._columns.map(c => c.id),
            sort: (() => { const s = this._columns.find(c => c.sort); return s ? { id: s.id, dir: s.sort } : null; })()
        };
        const json = encodeURIComponent(JSON.stringify(state));
        this._setCookie(this._persistKey, json, 365);
    }

    /**
     * Retrieves cookie value by name.
     * @param {string} name cookie name
     * @returns {string|null} cookie value or null
     */
    _getCookie(name) {
        if (!name) return;
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
     * Sets a cookie with optional expiry in days.
     * @param {string} name cookie name
     * @param {string} value value (already encoded if needed)
     * @param {number} days number of days until expiration
     */
    _setCookie(name, value, days) {
        const expires = (() => {
            if (!days) return "";
            const d = new Date();
            d.setTime(d.getTime() + days * 86400000);
            return "; expires=" + d.toUTCString();
        })();
        document.cookie = name + "=" + value + expires + "; path=/; SameSite=Lax";
    }

    /**
     * Dispatches column reorder event with new column order metadata.
     * @param {number} sourceIndex original index
     * @param {number} targetIndex new index
     * @fires webexpress.webui.Event.COLUMN_REORDER_EVENT
     */
    _triggerColumnReorderEvent(sourceIndex, targetIndex) {
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.COLUMN_REORDER_EVENT, {
            detail: { sender: this._element, sourceIndex, targetIndex, columns: this._columns }
        }));
    }
};

// register class
webexpress.webui.Controller.registerClass("wx-webui-table", webexpress.webui.TableCtrl);