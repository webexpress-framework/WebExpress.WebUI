/**
 * Table control with column reordering, visibility management, sorting, inline editing, row drag support
 * and hierarchical tree rows (nested rows with expand/collapse, intra-level reordering, persisted collapsed state).
 *
 * Dispatched events:
 * - webexpress.webui.Event.TABLE_SORT_EVENT
 * - webexpress.webui.Event.COLUMN_REORDER_EVENT
 * - webexpress.webui.Event.COLUMN_VISIBILITY_EVENT
 * - webexpress.webui.Event.START_INLINE_EDIT_EVENT (delegated to SmartEditCtrl)
 * - webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT (delegated to SmartEditCtrl)
 * - webexpress.webui.Event.END_INLINE_EDIT_EVENT (delegated to SmartEditCtrl)
 * - webexpress.webui.Event.ROW_REORDER_EVENT
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 * - webexpress.webui.Event.MOVE_EVENT
 *
 * Persistence:
 * columns (order, visibility, widths, active sort) and
 * tree collapsed state (list of row ids whose expanded=false)
 *
 * Public API additions:
 * - expandAll()
 * - collapseAll()
 * - expandFirstLevels(levelCount)
 * - collapseDeeperThan(levelCount)
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

    // drag state columns (header)
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
    _dragRowTargetMode = null; // 'before' | 'after' | 'child'

    // resizing
    _resizingColumn = null;
    _resizeStartX = null;
    _resizeStartWidth = null;
    _resizeMoveHandler = null;
    _resizeEndHandler = null;

    // persistence
    _persistKey = null;
    _saveDebounceTimer = null;

    // enhancements
    _columnFilterTerm = "";

    // dropdown column list drag state
    _ddDragSourceIndex = null;
    _ddDragPlaceholder = null;

    // internal caches (ephemeral)
    _isTree = false;

    // constants
    static MIN_COLUMN_WIDTH = 30;

    /**
     * Creates a new table control instance.
     * @param {HTMLElement} element root element containing declarative definition
     */
    constructor(element) {
        super(element);

        // base table classes
        this._table.className = "wx-table table table-hover table-sm";

        // read table-level dataset
        const tableColor   = element.dataset.color   || null;
        const tableBorder  = element.dataset.border  || null;
        const tableStriped = element.dataset.striped || null;
        this._movableRow         = element.dataset.movableRow === "true" || false;
        this._allowColumnRemove  = element.dataset.allowColumnRemove === "true" || false;
        this._persistKey         = element.dataset.persistKey || element.id || null;

        // parse declarative structures
        this._options = this._parseOptions(element.querySelector(":scope > .wx-table-options"));
        this._columns = this._parseColumns(element.querySelector(":scope > .wx-table-columns"));
        this._rows    = this._parseRows(element.querySelectorAll(":scope > .wx-table-row"));
        this._footer  = this._parseFooter(element.querySelector(":scope > .wx-table-footer"));

        // apply persisted state
        this._loadStateFromCookie();

        // assemble table sections
        this._table.appendChild(this._col);
        this._table.appendChild(this._head);
        this._table.appendChild(this._body);
        if (Array.isArray(this._footer) && this._footer.length > 0) {
            this._table.appendChild(this._foot);
        }

        // cleanup original container attributes and mount table
        element.innerHTML = "";
        [
            "data-color",
            "data-border",
            "data-striped",
            "data-movable-row",
            "data-persist-key",
            "data-allow-column-remove"
        ].forEach(a => element.removeAttribute(a));
        element.appendChild(this._table);

        // column drag indicator overlay
        this._dragColumnIndicator = document.createElement("div");
        this._dragColumnIndicator.className = "wx-table-drag-indicator";
        this._dragColumnIndicator.style.display = "none";
        this._dragColumnIndicator.setAttribute("aria-hidden", "true");
        element.appendChild(this._dragColumnIndicator);

        // apply optional appearance modifier classes
        if (tableColor)  tableColor.split(/\s+/).filter(Boolean).forEach(c => this._table.classList.add(c));
        if (tableBorder) tableBorder.split(/\s+/).filter(Boolean).forEach(c => this._table.classList.add(c));
        if (tableStriped) tableStriped.split(/\s+/).filter(Boolean).forEach(c => this._table.classList.add(c));

        // initial render
        this.render();
    }

    /**
     * Utility: dispatch generic visibility change event.
     * @param {Object} payload event detail
     */
    _dispatchVisibilityChange(payload) {
        if (!webexpress?.webui?.Event?.CHANGE_VISIBILITY_EVENT) return;
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
            detail: Object.assign({ sender: this._element }, payload)
        }));
    }

    /**
     * Utility: dispatch generic move event (row or column).
     * @param {Object} payload event detail
     */
    _dispatchMove(payload) {
        if (!webexpress?.webui?.Event?.MOVE_EVENT) return;
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.MOVE_EVENT, {
            detail: Object.assign({ sender: this._element }, payload)
        }));
    }

    /**
     * Small helper: returns localized text or fallback.
     * @param {string} key translation key
     * @param {string} fallback fallback text
     * @returns {string}
     */
    _t(key, fallback) {
        return (webexpress?.webui?.I18N?.translate(key)) ?? fallback;
    }

    /**
     * Returns current column id order.
     * @returns {Array<string>}
     */
    _getColumnOrder() {
        return this._columns.map(c => c.id);
    }

    /**
     * Parses global options menu container into structured list.
     * @param {HTMLElement|null} optionsDiv container element or null
     * @returns {Array<Object>} option descriptors
     */
    _parseOptions(optionsDiv) {
        if (!optionsDiv) return [];
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
     * Parses column definition container into column objects.
     * @param {HTMLElement|null} columnsDiv container element
     * @returns {Array<Object>} column definitions
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
            template: div.firstElementChild
        }));
    }

    /**
     * Recursively parses row elements into hierarchical structure.
     * @param {NodeListOf<HTMLElement>|Array<HTMLElement>} rowsDivs row elements at current level
     * @param {Object|null} parent parent row or null
     * @returns {Array<Object>} structured rows
     */
    _parseRows(rowsDivs, parent = null) {
        const rows = [];
        for (const div of rowsDivs) {
            if (!(div instanceof HTMLElement)) continue;                 // skip non-elements
            if (!div.classList.contains("wx-table-row")) continue;       // enforce row class

            // determine initial expanded state (before persistence override)
            let expanded = true;
            if (div.dataset.expanded === "true") expanded = true;
            else if (div.dataset.expanded === "false") expanded = false;
            else if (div.dataset.collapsed === "true") expanded = false;

            const r = {
                id: div.id || null,
                class: div.className || null,
                style: div.getAttribute("style") || null,
                color: div.dataset.color || null,
                cells: [],
                options: null,
                children: [],
                parent: parent,
                expanded: expanded
            };

            const childRowDivs = [];
            for (const child of div.children) {
                if (!(child instanceof HTMLElement)) continue;
                if (child.classList.contains("wx-table-row")) {
                    childRowDivs.push(child);
                    this._isTree = true;
                    continue;
                }
                if (child.classList.contains("wx-table-options")) {
                    r.options = this._parseOptions(child);
                    this._hasOptions = true;
                } else if (child.classList.contains("wx-table-footer")) {
                    // ignore footer inside row
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
     * Parses footer container into html list.
     * @param {HTMLElement|null} footerDiv footer container
     * @returns {Array<string>} list of html cells
     */
    _parseFooter(footerDiv) {
        if (!footerDiv) return [];
        return Array.from(footerDiv.children).map(div => div.innerHTML.trim());
    }

    /**
     * Clears all rendered sections.
     */
    clear() {
        this._col.innerHTML = "";
        this._head.innerHTML = "";
        this._body.innerHTML = "";
        this._foot.innerHTML = "";
    }

    /**
     * Orders top-level rows by a given column (children remain in place).
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
     * Changes visibility of a column.
     * @param {string|number} idOrIndex column id or index
     * @param {boolean} visible desired state
     */
    setColumnVisibility(idOrIndex, visible) {
        let col = (typeof idOrIndex === "number")
            ? this._columns[idOrIndex]
            : this._columns.find(c => c.id === idOrIndex);
        if (!col) return;
        if (col.visible === visible) return;
        if (!this._allowColumnRemove) return;
        col.visible = visible;
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.COLUMN_VISIBILITY_EVENT, {
            detail: { sender: this._element, columnId: col.id, visible: col.visible, columnIndex: this._columns.indexOf(col) }
        }));
        // generic visibility event (column)
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
     * Hides a column by id or index.
     * @param {string|number} idOrIndex column id or index
     */
    hideColumn(idOrIndex) { this.setColumnVisibility(idOrIndex, false); }

    /**
     * Shows a column by id or index.
     * @param {string|number} idOrIndex column id or index
     */
    showColumn(idOrIndex) { this.setColumnVisibility(idOrIndex, true); }

    /**
     * Toggles visibility of a column.
     * @param {string|number} idOrIndex column id or index
     */
    toggleColumn(idOrIndex) {
        let col = (typeof idOrIndex === "number")
            ? this._columns[idOrIndex]
            : this._columns.find(c => c.id === idOrIndex);
        if (!col) return;
        this.setColumnVisibility(col.id, !col.visible);
    }

    /**
     * Returns all visible columns.
     * @returns {Array<Object>}
     */
    getVisibleColumns() { return this._columns.filter(c => c.visible); }

    /**
     * Main render pipeline (batched).
     */
    render() {
        this._renderColumns();
        this._renderRows();
        this._renderFooter();
        this._syncColumnWidths();
    }

    /**
     * Renders table header row and colgroup.
     */
    _renderColumns() {
        const headRow = document.createElement("tr");
        this._col.innerHTML = "";
        this._head.innerHTML = "";
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
            if (!col.visible) continue;
            const th = document.createElement("th");
            th.draggable = true;
            th.dataset.columnId = col.id;
            if (col.sort) th.classList.add(col.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc");
            if (col.color) col.color.split(/\s+/).filter(Boolean).forEach(c => th.classList.add(c));
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
            colFrag.appendChild(cg);

            this._enableDragAndDropColumn(th, col);
            this._enableResizableColumns(th, col);
            this._enableSortColumns(th, col);
        }

        this._renderActionsHeader(headRow, colFrag);
        this._col.appendChild(colFrag);
    }

    /**
     * Renders actions header cell (bootstrap dropdown with search, ordering & visibility).
     * @param {HTMLTableRowElement} headRow header row
     * @param {DocumentFragment} colFrag colgroup fragment reference
     */
    _renderActionsHeader(headRow, colFrag) {
        const anyHidden = this._columns.some(c => !c.visible);
        const hasGlobalOptions = (this._options && this._options.length > 0);
        const hasRowOptions = this._hasOptions;
        const showHeader = anyHidden || hasGlobalOptions || hasRowOptions || this._allowColumnRemove;
        if (!showHeader) return;

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
        btn.title = this._t("webexpress.webui:table.columns.toggle", "Show/Hide columns");
        btn.textContent = "+";

        const menu = document.createElement("div");
        menu.className = "dropdown-menu";
        menu.setAttribute("role", "menu");

        const header = document.createElement("h6");
        header.className = "dropdown-header";
        header.textContent = this._t("webexpress.webui:table.columns.label", "Columns");
        menu.appendChild(header);

        const searchGrp = document.createElement("div");
        searchGrp.className = "mb-2";
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "form-control form-control-sm";
        searchInput.placeholder = this._t("webexpress.webui:table.search.placeholder", "search...");
        searchInput.value = this._columnFilterTerm || "";
        searchInput.setAttribute("aria-label", this._t("webexpress.webui:table.filter.columns.label", "Filter columns"));
        searchInput.addEventListener("input", (e) => {
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
            handle.title = this._t("webexpress.webui:table.handle.title", "Move");
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
                // prevent hiding last visible column
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
     * Adds drag & drop behavior to the columns list inside dropdown.
     * @param {HTMLElement} listContainer list container
     * @param {HTMLButtonElement} trigger dropdown trigger button
     */
    _enableDropdownColumnDrag(listContainer, trigger) {
        this._ddDragPlaceholder = document.createElement("div");
        this._ddDragPlaceholder.className = "wx-col-placeholder";
        this._ddDragSourceIndex = null;

        const items = () => Array.from(listContainer.querySelectorAll(".wx-col-item"));

        const computeIndexFromY = (clientY) => {
            const listItems = items().filter(i => !i.classList.contains("dragging"));
            if (!listItems.length) return 0;
            for (let i = 0; i < listItems.length; i++) {
                const rect = listItems[i].getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (clientY < mid) return i;
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
            if (!draggingItem) return;
            e.preventDefault();
            const idx = computeIndexFromY(e.clientY);
            placePlaceholderAt(idx);
        };

        const handleContainerDrop = (e) => {
            const draggingItem = listContainer.querySelector(".wx-col-item.dragging");
            if (!draggingItem) return;
            e.preventDefault();
            const targetIndex = (() => {
                if (this._ddDragPlaceholder.parentNode) {
                    const listItems = items().filter(i => !i.classList.contains("dragging"));
                    const allNodes = Array.from(listContainer.children);
                    let visualIndex = 0;
                    for (let i = 0; i < allNodes.length; i++) {
                        const n = allNodes[i];
                        if (n === this._ddDragPlaceholder) return visualIndex;
                        if (n.classList && n.classList.contains("wx-col-item") && !n.classList.contains("dragging")) {
                            visualIndex++;
                        }
                    }
                    return listItems.length;
                }
                return computeIndexFromY(e.clientY);
            })();

            const sourceIndex = this._ddDragSourceIndex;
            if (sourceIndex == null) return;

            let adjustedTarget = targetIndex;
            if (sourceIndex < targetIndex) adjustedTarget -= 1;
            if (adjustedTarget < 0) adjustedTarget = 0;
            if (adjustedTarget > this._columns.length - 1) adjustedTarget = this._columns.length - 1;

            if (sourceIndex !== adjustedTarget) {
                this._moveColumnIndex(sourceIndex, adjustedTarget);
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
     * Reopens dropdown after a render cycle to keep interaction continuity.
     * @param {HTMLButtonElement} trigger dropdown toggle button
     */
    _reopenDropdownAfterRender(trigger) {
        setTimeout(() => {
            if (!trigger.isConnected) {
                const newBtn = this._head.querySelector(".wx-table-actions .dropdown > .dropdown-toggle");
                if (newBtn && window.bootstrap?.Dropdown) {
                    const inst = bootstrap.Dropdown.getOrCreateInstance(newBtn);
                    inst.show();
                    const search = newBtn.parentElement.querySelector("input[type=text]");
                    if (search) search.focus();
                }
            } else {
                if (window.bootstrap?.Dropdown) {
                    const inst = bootstrap.Dropdown.getOrCreateInstance(trigger);
                    inst.show();
                    const search = trigger.parentElement.querySelector("input[type=text]");
                    if (search) search.focus();
                }
            }
        }, 0);
    }

    /**
     * Applies current column filter term to dropdown menu.
     * @param {HTMLElement} menu dropdown menu
     */
    _applyColumnFilter(menu) {
        const term = (this._columnFilterTerm || "").toLowerCase();
        const items = menu.querySelectorAll(".wx-columns-list > .dropdown-item");
        items.forEach(it => {
            const id = it.dataset.columnId || "";
            const label = it.querySelector(".form-check-label")?.textContent || "";
            const hay = (id + " " + label).toLowerCase();
            it.style.display = (!term || hay.indexOf(term) !== -1) ? "" : "none";
        });
    }

    /**
     * Moves a column from source index to target index.
     * @param {number} sourceIndex original index
     * @param {number} targetIndex target index
     */
    _moveColumnIndex(sourceIndex, targetIndex) {
        if (sourceIndex === targetIndex) return;
        if (sourceIndex < 0 || targetIndex < 0) return;
        if (sourceIndex >= this._columns.length || targetIndex >= this._columns.length) return;
        const previousOrder = this._getColumnOrder();
        const moved = this._columns.splice(sourceIndex, 1)[0];
        this._columns.splice(targetIndex, 0, moved);
        this._rebuildAllRowCellsFromColumnOrder(previousOrder, this._getColumnOrder());
        this._schedulePersist();
        this.render();
        this._dispatchMassColumnReorder(previousOrder, this._getColumnOrder());
        // generic move event (column)
        this._dispatchMove({
            kind: "column",
            action: "move",
            sourceIndex,
            targetIndex,
            order: this._getColumnOrder()
        });
    }

    /**
     * Rebuilds every row's cell array according to new column id order.
     * @param {Array<string>} oldOrder previous column id order
     * @param {Array<string>} newOrder new column id order
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
            if (row.children && row.children.length) row.children.forEach(ch => rebuildRow(ch));
        };
        this._rows.forEach(r => rebuildRow(r));
    }

    /**
     * Reorders columns alphabetically by label.
     * @param {"asc"|"desc"} direction sorting direction
     */
    _reorderColumnsAlphabetic(direction = "asc") {
        const previousOrder = this._getColumnOrder();
        const sorted = [...this._columns].sort((a, b) => {
            const la = a.label || "";
            const lb = b.label || "";
            const comp = la.localeCompare(lb, undefined, { numeric: true, sensitivity: "base" });
            return direction === "asc" ? comp : -comp;
        });
        this._columns = sorted;
        this._rebuildAllRowCellsFromColumnOrder(previousOrder, this._getColumnOrder());
        this._schedulePersist();
        this.render();
        this._dispatchMassColumnReorder(previousOrder, this._getColumnOrder());
        // generic move event (column batch)
        this._dispatchMove({
            kind: "column",
            action: "mass-reorder",
            previousOrder,
            order: this._getColumnOrder(),
            direction
        });
    }

    /**
     * Dispatches a column reorder event for bulk reorder operations.
     * @param {Array<string>} previousOrder order before
     * @param {Array<string>} newOrder order after
     */
    _dispatchMassColumnReorder(previousOrder, newOrder) {
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.COLUMN_REORDER_EVENT, {
            detail: {
                sender: this._element,
                sourceIndex: -1,
                targetIndex: -1,
                previousOrder,
                newOrder,
                columns: this._columns
            }
        }));
    }

    /**
     * Renders all hierarchical rows into tbody.
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
     * Adds a single row (hierarchical aware) to tbody (via fragment).
     * @param {Object} row row data object
     * @param {number} depth hierarchical depth
     * @param {DocumentFragment} fragment target fragment
     */
    _addRow(row, depth = 0, fragment) {
        const tr = document.createElement("tr");
        if (row.color) row.color.split(/\s+/).filter(Boolean).forEach(c => tr.classList.add(c));
        if (row.class) row.class.split(/\s+/).filter(Boolean).forEach(c => tr.classList.add(c));
        if (row.style) tr.setAttribute("style", row.style);
        tr._dataRowRef = row;
        row._anchorTr = tr;
        row._depth = depth;

        if (this._movableRow) {
            const handle = document.createElement("td");
            handle.className = "wx-table-drag-handle";
            handle.textContent = "☰";
            handle.title = this._t("webexpress.webui:table.handle.title", "Move");
            handle.setAttribute("aria-label", "Move row");
            tr.appendChild(handle);
            this._enableDragAndDropRow(handle, row);
        }

        for (let idx = 0; idx < this._columns.length; idx++) {
            const colDef = this._columns[idx];
            if (!colDef.visible) continue;
            const td = document.createElement("td");
            const cell = row.cells[idx];
            if (cell) {
                if (cell.color) cell.color.split(/\s+/).filter(Boolean).forEach(c => td.classList.add(c));
                if (cell.class) cell.class.split(/\s+/).filter(Boolean).forEach(c => td.classList.add(c));
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

        if (this._isTree) {
            this._injectTreeToggle(tr, row, depth);
        }

        fragment.appendChild(tr);
    }

    /**
     * Injects indentation and toggle button (fixed: unified expand class for animation).
     * @param {HTMLTableRowElement} tr table row element
     * @param {Object} row row data reference
     * @param {number} depth hierarchical depth
     */
    _injectTreeToggle(tr, row, depth) {
        let firstDataCell = null;
        const cells = Array.from(tr.children);
        const startIndex = (this._movableRow ? 1 : 0);
        for (let i = startIndex; i < cells.length; i++) {
            firstDataCell = cells[i];
            break;
        }
        if (!firstDataCell) return;

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
            if (row.expanded) icon.classList.add("wx-tree-expand");
            toggle.appendChild(icon);

            toggle.addEventListener("click", (e) => {
                e.stopPropagation();
                const prev = row.expanded;
                row.expanded = !row.expanded;
                toggle.setAttribute("aria-expanded", String(row.expanded));
                toggle.setAttribute("aria-label", row.expanded ? "Collapse" : "Expand");
                if (row.expanded) icon.classList.add("wx-tree-expand");
                else icon.classList.remove("wx-tree-expand");
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

        if (contentWrapper.firstChild) {
            contentWrapper.insertBefore(treeLead, contentWrapper.firstChild);
        } else {
            contentWrapper.appendChild(treeLead);
        }

        contentWrapper.appendChild(firstDataCell.firstChild);
        firstDataCell.innerHTML = "";
        firstDataCell.appendChild(contentWrapper);
    }

    /**
     * Renders footer row mapping visible columns.
     */
    _renderFooter() {
        this._foot.innerHTML = "";
        const hasData = Array.isArray(this._footer) && this._footer.length > 0;
        const tr = document.createElement("tr");
        if (this._movableRow) tr.appendChild(document.createElement("td"));
        if (hasData) {
            let footerIndex = 0;
            for (let logicalIdx = 0; logicalIdx < this._columns.length; logicalIdx++) {
                const col = this._columns[logicalIdx];
                if (!col.visible) { footerIndex++; continue; }
                const td = document.createElement("td");
                const content = this._footer[logicalIdx];
                if (content != null) td.innerHTML = content;
                tr.appendChild(td);
                footerIndex++;
            }
        } else {
            for (const c of this._columns) {
                if (c.visible) tr.appendChild(document.createElement("td"));
            }
        }
        if (this._hasOptions || this._options.length > 0 || this._columns.some(c => !c.visible)) {
            tr.appendChild(document.createElement("td"));
        }
        this._foot.appendChild(tr);
    }

    /**
     * Enables column drag-and-drop (with Ctrl modifier) for reordering in header.
     * @param {HTMLElement} th header cell
     * @param {Object} column column definition
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
            const previousOrder = this._getColumnOrder();
            const moved = this._columns.splice(sourceIndex, 1)[0];
            this._columns.splice(adjusted, 0, moved);
            this._rows.forEach(r => {
                if (!Array.isArray(r.cells)) return;
                if (sourceIndex < 0 || sourceIndex >= r.cells.length) return;
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
            // generic move event (column)
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
     * Recursively reorders cell arrays of nested child rows after a column move.
     * @param {Array<Object>} children child rows
     * @param {number} sourceIndex original index
     * @param {number} adjusted new index
     */
    _reorderChildCells(children, sourceIndex, adjusted) {
        if (!children) return;
        for (const ch of children) {
            if (Array.isArray(ch.cells) && sourceIndex >= 0 && sourceIndex < ch.cells.length) {
                const movedCell = ch.cells.splice(sourceIndex, 1)[0];
                const targetPos = Math.min(Math.max(adjusted, 0), ch.cells.length);
                ch.cells.splice(targetPos, 0, movedCell);
            }
            if (ch.children && ch.children.length) this._reorderChildCells(ch.children, sourceIndex, adjusted);
        }
    }

    /**
     * Enables sorting via header click.
     * @param {HTMLElement} th header cell
     * @param {Object} column column definition
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
     * Enables row drag & drop (all levels).
     * @param {HTMLTableCellElement} handle handle cell
     * @param {Object} row row reference
     */
    _enableDragAndDropRow(handle, row) {
        if (!this._movableRow) return;
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
                this._keyboardMovePlaceholder(e.code === "ArrowUp" ? -1 : 1);
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
     * Starts row drag (captures contiguous block of row + descendants).
     * @param {HTMLTableRowElement} tr anchor row
     * @param {Object} row row object
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
                if (this._rowDragActive) this._finalizeRowDrag();
            });
            this._body._rowDragBound = true;
        }
        this._autoScrollInterval = setInterval(() => this._autoScrollCheck(), 30);
    }

    /**
     * Determines whether a candidate row is a (transitive) descendant of a given ancestor row.
     * @param {Object} candidate target row whose ancestry is checked
     * @param {Object} ancestor potential ancestor row
     * @returns {boolean} true if candidate is a descendant of ancestor, otherwise false
     */
    _isDescendant(candidate, ancestor) {
        let p = candidate.parent;
        while (p) {
            if (p === ancestor) return true;
            p = p.parent;
        }
        return false;
    }

    /**
     * Moves the drag placeholder (keyboard interaction) up or down among sibling rows.
     * @param {number} delta relative movement (-1 up, +1 down)
     */
    _keyboardMovePlaceholder(delta) {
        const siblings = this._getDragSiblings();
        if (!siblings.length) return;
        const currentIndex = this._getPlaceholderSiblingIndex(siblings);
        const target = Math.min(Math.max(currentIndex + delta, 0), siblings.length);
        this._movePlaceholderToSiblingIndex(siblings, target);
        this._dragRowTargetParent = this._draggedRowParent;
        this._dragRowTargetMode = null;
        this._dragRowInsertIndex = target;
    }

    /**
     * Handles dragover events on tbody to dynamically position the placeholder for tree reordering.
     * @param {DragEvent} e dragover event
     */
    _onTbodyDragOver(e) {
        if (!this._rowDragActive || !this._rowPlaceholder) return;
        e.preventDefault();
        this._lastPointerY = e.clientY;

        const tr = e.target.closest("tr");
        if (!tr || !tr._dataRowRef) return;
        const candidate = tr._dataRowRef;

        if (candidate === this._draggedRow) return;
        if (this._isDescendant(candidate, this._draggedRow)) return;

        const rect = tr.getBoundingClientRect();
        const y = e.clientY;
        const topZone = rect.top + rect.height * 0.25;
        const bottomZone = rect.bottom - rect.height * 0.25;

        let mode = "child";
        if (y < topZone) mode = "before";
        else if (y > bottomZone) mode = "after";

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
            const siblings = parent ? parent.children : this._rows;
            const idx = siblings.indexOf(candidate);
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
     * Repositions the placeholder row to a specified insertion index within sibling ordering.
     * @param {Array<Object>} siblings sibling rows excluding the dragged row
     * @param {number} index desired insertion index (0..siblings.length)
     */
    _movePlaceholderToSiblingIndex(siblings, index) {
        if (!this._rowPlaceholder) return;
        if (index >= siblings.length) {
            const last = siblings[siblings.length - 1];
            if (!last) return;
            const lastBlockEnd = this._getRowBlockEndTr(last);
            if (lastBlockEnd.nextSibling !== this._rowPlaceholder) {
                lastBlockEnd.parentNode.insertBefore(this._rowPlaceholder, lastBlockEnd.nextSibling);
            }
        } else {
            const sibling = siblings[index];
            const anchor = sibling._anchorTr;
            if (anchor !== this._rowPlaceholder.nextSibling) {
                anchor.parentNode.insertBefore(this._rowPlaceholder, anchor);
            }
        }
    }

    /**
     * Returns the last DOM <tr> node that belongs to the contiguous visual block of a hierarchical row.
     * @param {Object} row logical row object
     * @returns {HTMLTableRowElement} last table row element of the block
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
     * Collects sibling rows of the currently dragged row (excluding the dragged row itself).
     * @returns {Array<Object>} array of sibling row objects
     */
    _getDragSiblings() {
        if (!this._draggedRow) return [];
        const base = (this._draggedRowParent ? this._draggedRowParent.children : this._rows);
        return base.filter(r => r !== this._draggedRow);
    }

    /**
     * Computes the insertion index represented by the placeholder relative to provided siblings.
     * @param {Array<Object>} siblings sibling rows (excluding dragged row)
     * @returns {number} insertion index (0..siblings.length) or -1 if unresolved
     */
    _getPlaceholderSiblingIndex(siblings) {
        if (!this._rowPlaceholder) return -1;
        const ordered = [];
        siblings.forEach(s => ordered.push(s));
        for (let i = 0; i < ordered.length; i++) {
            const anchor = ordered[i]._anchorTr;
            if (this._rowPlaceholder.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING) {
                return i;
            }
        }
        return ordered.length;
    }

    /**
     * Performs periodic auto-scrolling of the container while dragging near vertical edges.
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
     * Finalizes a row drag operation updating parent/child relations for hierarchical relocation.
     */
    _finalizeRowDrag() {
        if (!this._rowDragActive) return;

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
        if (oldIndex >= 0) oldSiblings.splice(oldIndex, 1);

        if (targetParent === sourceParent && insertIndex != null && oldIndex < insertIndex) {
            insertIndex -= 1;
        }

        const newSiblings = targetParent ? targetParent.children : this._rows;
        if (insertIndex == null || insertIndex < 0) insertIndex = newSiblings.length;
        if (insertIndex > newSiblings.length) insertIndex = newSiblings.length;
        newSiblings.splice(insertIndex, 0, this._draggedRow);
        this._draggedRow.parent = targetParent || null;

        if (this._dragRowTargetMode === "child" && targetParent) {
            if (!targetParent.expanded) targetParent.expanded = true;
        }

        const previousOrder = [];
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.ROW_REORDER_EVENT, {
            detail: {
                sender: this._element,
                newOrder: newSiblings,
                previousOrder: previousOrder,
                parentId: targetParent ? targetParent.id : null
            }
        }));

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
     * Cancels an active row drag operation and restores original rendering without applying changes.
     */
    _cancelRowDrag() {
        if (!this._rowDragActive) return;
        this._cleanupRowDrag();
        this.render();
    }

    /**
     * Cleans up all artifacts and timers related to an active row drag.
     */
    _cleanupRowDrag() {
        if (this._rowPlaceholder && this._rowPlaceholder.parentNode)
            this._rowPlaceholder.parentNode.removeChild(this._rowPlaceholder);
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
     * Adds a resizer affordance to a header cell to enable mouse-driven column width adjustments.
     * @param {HTMLElement} th target header cell element
     * @param {Object} column associated column definition
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
     * Handles the initial mousedown event for a column resize.
     * @param {MouseEvent} e mousedown event
     * @param {HTMLElement} th header cell being resized
     * @param {Object} column column definition reference
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
     * Performs live width adjustment while dragging the resizer.
     * @param {MouseEvent} e mousemove event
     * @param {HTMLElement} th active header cell
     * @param {Object} column column definition reference
     */
    _onResize(e, th, column) {
        if (!this._resizingColumn || this._resizingColumn !== th) return;
        const dx = e.pageX - this._resizeStartX;
        const w = Math.max(this._resizeStartWidth + dx, webexpress.webui.TableCtrl.MIN_COLUMN_WIDTH);
        th.style.width = w + "px";
        column.width = w;
        this._applyWidthToColElement(column.id, w);
    }

    /**
     * Finalizes a resize operation.
     * @param {HTMLElement} th header cell that was resized
     */
    _onResizeEnd(th) {
        if (!this._resizingColumn || this._resizingColumn !== th) return;
        document.body.classList.remove("wx-table-resizing");
        document.removeEventListener("mousemove", this._resizeMoveHandler);
        document.removeEventListener("mouseup", this._resizeEndHandler);
        this._resizingColumn = null;
        this._resizeStartX = null;
        this._resizeStartWidth = null;
        this._schedulePersist();
    }

    /**
     * Synchronizes stored per-column widths to the rendered <col> elements after re-rendering.
     */
    _syncColumnWidths() {
        for (const c of this._columns) {
            if (!c.visible) continue;
            if (c.width) this._applyWidthToColElement(c.id, c.width);
        }
    }

    /**
     * Applies an explicit pixel width to the <col> element corresponding to a given column id.
     * @param {string} columnId unique column identifier
     * @param {number} width width in pixels
     */
    _applyWidthToColElement(columnId, width) {
        const colEl = this._col.querySelector(`col[data-column-id='${columnId}']`);
        if (colEl) colEl.style.width = width + "px";
    }

    /**
     * Loads persisted table state from cookie (supports schema versions 1 and 2).
     */
    _loadStateFromCookie() {
        const raw = this._getCookie(this._persistKey);
        if (!raw) return;
        try {
            const obj = JSON.parse(decodeURIComponent(raw));
            if (!obj) return;
            if (obj.v !== 1 && obj.v !== 2) return;

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

            if (obj.v === 2 && obj.tree && Array.isArray(obj.tree.collapsed)) {
                this._applyCollapsedState(obj.tree.collapsed);
            }
        } catch (_) { /* swallow */ }
    }

    /**
     * Applies a list of row ids that should be marked as collapsed in the hierarchical tree structure.
     * @param {Array<string>} collapsedIds list of collapsed row ids
     */
    _applyCollapsedState(collapsedIds) {
        if (!Array.isArray(collapsedIds) || !collapsedIds.length) return;
        const set = new Set(collapsedIds);
        this._traverseRows(this._rows, (r) => {
            if (r.id && set.has(r.id)) r.expanded = false;
        });
    }

    /**
     * Depth-first traversal over hierarchical rows invoking a callback for each row encountered.
     * @param {Array<Object>} rows root list of rows to traverse
     * @param {Function} fn callback executed per row
     */
    _traverseRows(rows, fn) {
        if (!Array.isArray(rows)) return;
        for (const r of rows) {
            fn(r);
            if (r.children && r.children.length) this._traverseRows(r.children, fn);
        }
    }

    /**
     * Expands all rows that have children.
     */
    expandAll() {
        const changed = [];
        this._traverseRows(this._rows, r => {
            if (r.children && r.children.length && !r.expanded) {
                r.expanded = true;
                if (r.id) changed.push(r.id);
            }
        });
        this._schedulePersist();
        this.render();
        if (changed.length) {
            this._dispatchVisibilityChange({
                kind: "row",
                action: "expandAll",
                changedIds: changed
            });
        }
    }

    /**
     * Collapses all rows that have children.
     */
    collapseAll() {
        const changed = [];
        this._traverseRows(this._rows, r => {
            if (r.children && r.children.length && r.expanded) {
                r.expanded = false;
                if (r.id) changed.push(r.id);
            }
        });
        this._schedulePersist();
        this.render();
        if (changed.length) {
            this._dispatchVisibilityChange({
                kind: "row",
                action: "collapseAll",
                changedIds: changed
            });
        }
    }

    /**
     * Expands the first N hierarchical levels (1 = top-level only) and collapses all deeper levels.
     * @param {number} levelCount number of top levels to keep expanded (>=1)
     */
    expandFirstLevels(levelCount) {
        if (typeof levelCount !== "number" || levelCount < 1) return;
        const maxDepth = levelCount - 1;
        const changed = [];
        const walk = (rows, depth) => {
            for (const r of rows) {
                if (r.children && r.children.length) {
                    const desired = depth <= maxDepth;
                    if (r.expanded !== desired) {
                        r.expanded = desired;
                        if (r.id) changed.push(r.id);
                    }
                    walk(r.children, depth + 1);
                }
            }
        };
        walk(this._rows, 0);
        this._schedulePersist();
        this.render();
        if (changed.length) {
            this._dispatchVisibilityChange({
                kind: "row",
                action: "expandFirstLevels",
                levelCount,
                changedIds: changed
            });
        }
    }

    /**
     * Collapses all hierarchical levels deeper than the provided level count, keeping upper levels expanded.
     * @param {number} levelCount number of top levels to remain expanded (>=1)
     */
    collapseDeeperThan(levelCount) {
        if (typeof levelCount !== "number" || levelCount < 1) return;
        const maxDepth = levelCount - 1;
        const changed = [];
        const walk = (rows, depth) => {
            for (const r of rows) {
                if (r.children && r.children.length) {
                    const desired = depth <= maxDepth;
                    if (r.expanded !== desired) {
                        r.expanded = desired;
                        if (r.id) changed.push(r.id);
                    }
                    walk(r.children, depth + 1);
                }
            }
        };
        walk(this._rows, 0);
        this._schedulePersist();
        this.render();
        if (changed.length) {
            this._dispatchVisibilityChange({
                kind: "row",
                action: "collapseDeeperThan",
                levelCount,
                changedIds: changed
            });
        }
    }

    /**
     * Schedules a debounced persistence operation to avoid excessive cookie writes.
     */
    _schedulePersist() {
        if (!this._persistKey) return;
        if (this._saveDebounceTimer) clearTimeout(this._saveDebounceTimer);
        this._saveDebounceTimer = setTimeout(() => this._persistState(), 150);
    }

    /**
     * Serializes current table state (version 2 format) and stores it in a cookie.
     */
    _persistState() {
        if (!this._persistKey) return;
        const collapsed = [];
        this._traverseRows(this._rows, (r) => {
            if (r.id && r.expanded === false && r.children && r.children.length) collapsed.push(r.id);
        });
        const state = {
            v: 2,
            cols: this._columns.map(c => ({ id: c.id, visible: c.visible, width: c.width })),
            order: this._getColumnOrder(),
            sort: (() => { const s = this._columns.find(c => c.sort); return s ? { id: s.id, dir: s.sort } : null; })(),
            tree: { collapsed: collapsed }
        };
        const json = encodeURIComponent(JSON.stringify(state));
        this._setCookie(this._persistKey, json, 365);
    }

    /**
     * Retrieves a cookie value by name.
     * @param {string} name cookie name
     * @returns {string|null} raw cookie value or null if missing
     */
    _getCookie(name) {
        if (!name) return null;
        const prefix = name + "=";
        const parts = document.cookie.split(";").map(c => c.trim());
        for (const p of parts) {
            if (p.indexOf(prefix) === 0) return p.substring(prefix.length);
        }
        return null;
    }

    /**
     * Sets a cookie with optional expiration.
     * @param {string} name cookie name
     * @param {string} value already encoded cookie value
     * @param {number} days expiration in days
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
     * Dispatches a COLUMN_REORDER_EVENT for a direct column move (drag action).
     * @param {number} sourceIndex original column index
     * @param {number} targetIndex final column index
     */
    _triggerColumnReorderEvent(sourceIndex, targetIndex) {
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.COLUMN_REORDER_EVENT, {
            detail: { sender: this._element, sourceIndex, targetIndex, columns: this._columns }
        }));
    }
};

// register class
webexpress.webui.Controller.registerClass("wx-webui-table", webexpress.webui.TableCtrl);