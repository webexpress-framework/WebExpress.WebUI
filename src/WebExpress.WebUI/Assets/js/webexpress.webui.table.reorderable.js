/**
 * Reorderable table control providing column mutation and row drag.
 * bietet:
 * - Spaltenreihenfolge per Drag & Drop
 * - Spaltensichtbarkeit
 * - Zeilen verschieben (flach + hierarchisch)
 * - Persistenz (Spalten + Baumzustand)
 * - Options-Dropdown mit Spaltensuche
 *
 * Events:
 *  - webexpress.webui.Event.TABLE_SORT_EVENT
 *  - webexpress.webui.Event.COLUMN_REORDER_EVENT
 *  - webexpress.webui.Event.COLUMN_VISIBILITY_EVENT
 *  - webexpress.webui.Event.COLUMN_SEARCH_EVENT
 *  - webexpress.webui.Event.ROW_REORDER_EVENT
 *  - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 */
webexpress.webui.TableCtrlReorderable = class extends webexpress.webui.TableCtrl {
   
    /**
     * constructor
     * @param {HTMLElement} element
     */
    constructor(element) {
        super(element);
        this._loadStateFromCookie();
    }

    /**
     * setup dom extended
     * @param {HTMLElement} element
     */
    _setupDom(element) {
        super._setupDom(element);

        const ds = element.dataset;
        this._movableRow = ds.movableRow === "true";
        this._allowColumnRemove = ds.allowColumnRemove === "true";
        this._persistKey = ds.persistKey || element.id || null;

        this._menu = document.createElement("div");
        this._menu.id = "actions";
        this._table.appendChild(this._menu);

        this._dragColumnIndicator = document.createElement("div");
        this._dragColumnIndicator.className = "wx-table-drag-indicator";
        this._dragColumnIndicator.setAttribute("aria-hidden", "true");
        this._dragColumnIndicator.style.display = "none";
        this._table.appendChild(this._dragColumnIndicator);

        // pre-bind handlers for row drag
        this._onTbodyDragOverHandler = this._onTbodyDragOver.bind(this);
        this._onTbodyDropHandler = (e) => { e.preventDefault(); if (this._rowDragActive) { this._finalizeRowDrag(); } };
    }

    /**
     * parse extended config cleanup
     * @param {HTMLElement} element
     */
    _parseConfig(element) {
        super._parseConfig(element);
        ["data-movable-row", "data-persist-key", "data-allow-column-remove"]
            .forEach((attr) => { element.removeAttribute(attr); });
    }

    /**
     * init extended listeners
     */
    _initEventListeners() {
        super._initEventListeners();

        // row drag start über Griff-Spalte
        if (this._movableRow) {
            this._body.addEventListener("dragstart", (e) => {
                const handle = e.target.closest(".wx-table-drag-handle");
                if (!handle) { e.preventDefault(); return; }
                const tr = handle.closest("tr");
                if (tr && tr._dataRowRef) {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", tr._dataRowRef.id || "row");
                    if (!this._dragImage) {
                        this._dragImage = document.createElement("canvas");
                        this._dragImage.width = 1;
                        this._dragImage.height = 1;
                    }
                    e.dataTransfer.setDragImage(this._dragImage, 0, 0);
                    setTimeout(() => this._startRowDrag(tr, tr._dataRowRef), 0);
                }
            });

            this._body.addEventListener("dragend", (e) => {
                if (this._rowDragActive) {
                    this._cleanupRowDrag();
                    const tr = e.target.closest("tr");
                    if (tr) { tr.classList.remove("wx-table-dragging"); }
                }
            });
        }
    }

    /**
     * override render to ensure subclass column rendering
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

        this._renderColumns(); // inline comment: use subclass implementation
        this._renderRows(changedIds, newIds);
        this._renderFooter();
        this._syncColumnWidths();
        this._attachColumnResizers(); // inline comment: base class attaches resize handles

        this._suppressFlashOnce = false;
        this._updateSnapshot(currentStates);
        this._initialized = true;
    }

    /**
     * render columns mit linker Griff-Spalte und rechter Actions-Zelle
     */
    _renderColumns() {
        const headFragment = document.createDocumentFragment();
        const colFragment = document.createDocumentFragment();
        const headRow = document.createElement("tr");
        headFragment.appendChild(headRow);

        if (!this._suppressHeaders) {
            // linke Griff-Spalte für Zeilenverschiebung
            if (this._movableRow) {
                const th = document.createElement("th");
                th.className = "wx-table-drag-column";
                th.style.width = "1.1em";
                headRow.appendChild(th);

                const c = document.createElement("col");
                c.style.width = "1.1em";
                colFragment.appendChild(c);
            }

            // datenspalten
            for (const col of this._columns) {
                if (!col.visible) { continue; }

                const th = document.createElement("th");
                th.dataset.columnId = col.id;
                th.setAttribute("scope", "col");
                th.classList.add("wx-col-header");
                th.style.position = "relative";
                this._addClasses(th, col.color);

                if (col.sort) { th.classList.add(col.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc"); }

                const inner = document.createElement("div");
                if (col.icon) { inner.appendChild(this._createIcon(col.icon)); }
                if (col.image) { inner.appendChild(this._createImage(col.image)); }
                inner.appendChild(document.createTextNode(col.label));
                th.appendChild(inner);

                // spalten-drag aktivieren
                th.draggable = true;
                this._enableDragAndDropColumn(th, col);

                headRow.appendChild(th);

                const cg = document.createElement("col");
                cg.dataset.columnId = col.id;
                if (col.width) { cg.style.width = `${col.width}px`; }
                colFragment.appendChild(cg);
            }

            // rechte actions-zelle mit dropdown
            this._renderActionsHeader(headRow, colFragment);
        }

        this._head.textContent = "";
        this._head.appendChild(headFragment);

        this._col.textContent = "";
        this._col.appendChild(colFragment);
    }
    
    /**
     * Wrapper to execute an action that re-renders the table while keeping the dropdown open.
     * @param {Function} action - The function to execute (e.g. toggling visibility).
     */
    _runWithDropdownPreservation(action) {
        // 1. capture state
        const btn = this._head.querySelector(".wx-table-actions .dropdown-toggle");
        const isOpen = btn && btn.classList.contains("show");
        const list = this._head.querySelector(".wx-columns-list");
        const scrollTop = list ? list.scrollTop : 0;
        const activeElement = document.activeElement;
        let focusSelector = null;

        // try to generate a selector for the focused element to restore it later
        if (isOpen && list && list.contains(activeElement)) {
            if (activeElement.id) {
                focusSelector = `#${activeElement.id}`;
            } else if (activeElement.tagName === 'INPUT') {
                // fallback for search input
                focusSelector = 'input[type="text"]';
            }
        }

        // 2. execute action (trigger re-render)
        action();

        // 3. restore state
        if (isOpen) {
             // wait for the microtask/render to complete
             setTimeout(() => {
                 const newBtn = this._head.querySelector(".wx-table-actions .dropdown-toggle");
                 if (newBtn && window.bootstrap?.Dropdown) {
                     const inst = bootstrap.Dropdown.getOrCreateInstance(newBtn);
                     inst.show();

                     const newList = this._head.querySelector(".wx-columns-list");
                     if (newList) {
                         newList.scrollTop = scrollTop;
                     }

                     if (focusSelector) {
                         const toFocus = this._head.querySelector(`.wx-table-actions ${focusSelector}`);
                         if (toFocus) toFocus.focus();
                     }
                 }
             }, 0);
        }
    }

    /**
     * actions-header mit Dropdown (Suche, Sichtbarkeit, Reihenfolge)
     * @param {HTMLElement} headRow
     * @param {DocumentFragment} colFrag
     */
    _renderActionsHeader(headRow, colFrag) {
        const th = document.createElement("th");
        th.className = "wx-table-actions";
        th.style.position = "relative";

        const wrapper = document.createElement("div");
        wrapper.className = "wx-dropdown";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn dropdown-toggle";
        btn.setAttribute("data-bs-toggle", "dropdown");
        btn.setAttribute("data-bs-target", "#actions");
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("data-bs-auto-close", "outside");
        btn.title = "Spalten verwalten";
        btn.textContent = "≡";

        this._menu.innerHTML = "";
        this._menu.className = "dropdown-menu";

        // suche
        const searchGrp = document.createElement("div");
        searchGrp.className = "mb-2 px-2";
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "form-control form-control-sm";
        searchInput.placeholder = "Suche Spalten…";
        searchInput.value = this._columnFilterTerm || "";
        searchInput.onmousedown = (e) => e.stopPropagation();
        searchInput.addEventListener("input", (e) => { this._columnFilterTerm = e.target.value.trim(); this._applyColumnFilter(menu); });
        searchGrp.appendChild(searchInput);
        this._menu.appendChild(searchGrp);

        // spaltenliste mit checkbox und drag handle
        const listContainer = document.createElement("div");
        listContainer.className = "wx-columns-list";
        listContainer.style.maxHeight = "300px";
        listContainer.style.overflowY = "auto";

        const uidBase = `wx_${this._persistKey || "tbl"}_${Math.random().toString(36).slice(2, 8)}`;

        this._columns.forEach((c, idx) => {
            const item = document.createElement("div");
            item.className = "dropdown-item px-1 py-1 wx-col-item";
            item.dataset.columnId = c.id;
            item.dataset.index = String(idx);
            item.draggable = false;

            const line = document.createElement("div");
            line.className = "d-flex align-items-center gap-2";

            const handle = document.createElement("span");
            handle.className = "wx-col-drag-handle";
            handle.textContent = "⠿";
            handle.title = "Spalte ziehen (Dropdown)";
            handle.onmousedown = () => { item.draggable = true; };
            handle.onmouseup = () => { item.draggable = false; };

            const formCheck = document.createElement("div");
            formCheck.className = "form-check m-0 flex-grow-1";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.className = "form-check-input";
            cb.id = `${uidBase}_${idx}`;
            cb.checked = c.visible;

            cb.onmousedown = (e) => e.stopPropagation();
            cb.addEventListener("change", (ev) => {
                ev.preventDefault();
                if (!cb.checked && this._getVisibleColumns().length <= 1) { cb.checked = true; return; }
                this._runWithDropdownPreservation(() => { this.setColumnVisibility(c.id, cb.checked); });
            });

            const label = document.createElement("label");
            label.className = "form-check-label";
            label.setAttribute("for", cb.id);
            label.textContent = c.label;
            label.onmousedown = (e) => e.stopPropagation();

            formCheck.append(cb, label);
            line.append(handle, formCheck);
            item.appendChild(line);
            listContainer.appendChild(item);
        });

        this._menu.appendChild(listContainer);

        // drag-sort im dropdown aktivieren
        this._enableDropdownColumnDrag(listContainer, btn);

        wrapper.append(btn);
        th.appendChild(wrapper);
        headRow.appendChild(th);

        const cg = document.createElement("col");
        cg.style.width = "2.5rem";
        colFrag.appendChild(cg);

        if (this._columnFilterTerm) { this._applyColumnFilter(menu); }
    }

    /**
     * spalten-drag im header
     * @param {HTMLElement} th
     * @param {Object} column
     */
    _enableDragAndDropColumn(th, column) {
        th.addEventListener("dragstart", (e) => {
            if (!e.ctrlKey) { e.preventDefault(); return; }
            this._draggedColumn = column;
            th.classList.add("wx-table-dragging");
        });
        th.addEventListener("dragend", () => {
            th.classList.remove("wx-table-dragging");
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

            // zellenordnung in allen zeilen anpassen
            const reorderCells = (rows) => {
                for (const row of rows) {
                    if (row.cells && row.cells.length > sourceIndex) {
                        const c = row.cells.splice(sourceIndex, 1)[0];
                        row.cells.splice(adjusted, 0, c);
                    }
                    if (row.children) { reorderCells(row.children); }
                }
            };
            reorderCells(this._rows);

            this._dragColumnIndicator.style.display = "none";
            this._draggedColumn = null;
            this._schedulePersist();
            this.render();

            this._dispatch(webexpress.webui.Event.COLUMN_REORDER_EVENT, { sender: this._element, sourceIndex, targetIndex: adjusted });
        });
    }

    /**
     * drag-sort im dropdown
     * @param {HTMLElement} listContainer
     * @param {HTMLElement} trigger
     */
    _enableDropdownColumnDrag(listContainer, trigger) {
        this._ddDragPlaceholder = document.createElement("div");
        this._ddDragPlaceholder.className = "wx-col-placeholder";
        this._ddDragPlaceholder.style.cssText = "height: 2px; background: var(--bs-primary, #0d6efd); margin: 2px 0;";

        const items = () => Array.from(listContainer.querySelectorAll(".wx-col-item"));

        const handleDragStart = (e) => {
            if (e.target.getAttribute("draggable") !== "true") { e.preventDefault(); return; }
            const item = e.currentTarget;
            this._ddDragSourceIndex = parseInt(item.dataset.index, 10);
            item.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", item.dataset.columnId);
        };

        const handleDragEnd = (e) => {
            const item = e.currentTarget;
            item.classList.remove("dragging");
            item.draggable = false;
            if (this._ddDragPlaceholder.parentNode) { this._ddDragPlaceholder.remove(); }
            items().forEach((it, idx) => { it.dataset.index = String(idx); });
            this._ddDragSourceIndex = null;
        };

        const handleDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const draggingItem = listContainer.querySelector(".wx-col-item.dragging");
            if (!draggingItem) { return; }
            const siblings = items().filter((i) => i !== draggingItem);
            let nextSibling = siblings.find((sibling) => {
                const rect = sibling.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                return e.clientY < mid;
            });
            if (nextSibling) { listContainer.insertBefore(this._ddDragPlaceholder, nextSibling); }
            else { listContainer.appendChild(this._ddDragPlaceholder); }
        };

        const handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this._ddDragSourceIndex === null) { return; }

            const allChildren = Array.from(listContainer.children);
            const placeholderIndex = allChildren.indexOf(this._ddDragPlaceholder);
            let adjustedIndex = 0;
            for (let i = 0; i < placeholderIndex; i++) {
                const child = allChildren[i];
                if (child.classList.contains("wx-col-item") && !child.classList.contains("dragging")) { adjustedIndex++; }
            }

            if (this._ddDragSourceIndex !== adjustedIndex) {
                this._runWithDropdownPreservation(() => {
                    const moved = this._columns.splice(this._ddDragSourceIndex, 1)[0];
                    this._columns.splice(adjustedIndex, 0, moved);

                    const reorderCells = (rows) => {
                        for (const row of rows) {
                            if (row.cells && row.cells.length > this._ddDragSourceIndex) {
                                const c = row.cells.splice(this._ddDragSourceIndex, 1)[0];
                                row.cells.splice(adjustedIndex, 0, c);
                            }
                            if (row.children) { reorderCells(row.children); }
                        }
                    };
                    reorderCells(this._rows);

                    this._schedulePersist();
                    this.render();
                });

                this._dispatch(webexpress.webui.Event.COLUMN_REORDER_EVENT, { sender: this._element, sourceIndex: this._ddDragSourceIndex, targetIndex: adjustedIndex });
            }
        };

        items().forEach((it) => { it.addEventListener("dragstart", handleDragStart); it.addEventListener("dragend", handleDragEnd); });
        listContainer.addEventListener("dragover", handleDragOver);
        listContainer.addEventListener("drop", handleDrop);
    }

    /**
     * zeilen rendern inkl. linker griff-spalte und rechter options-spalte
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
        this._body.textContent = "";
        this._body.appendChild(fragment);
    }

    /**
     * einzelne zeile hinzufügen mit griff- und options-zelle
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

        // griff-spalte links
        if (this._movableRow) {
            const tdDrag = document.createElement("td");
            tdDrag.className = "wx-table-drag-handle";
            tdDrag.textContent = "⠿";
            tdDrag.tabIndex = 0;
            tdDrag.setAttribute("role", "button");
            tdDrag.draggable = true;
            tr.appendChild(tdDrag);
        }

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

        // options-zelle rechts
        const tdOpt = document.createElement("td");
        if (row.options?.length || this._options?.length) {
            const div = document.createElement("div");
            div.className = "wx-row-options-trigger";
            div.dataset.icon = "fas fa-cog";
            div.dataset.size = "btn-sm";
            div.dataset.border = "false";
            tdOpt.appendChild(div);
            const items = row.options?.length ? row.options : this._options;
            new webexpress.webui.DropdownCtrl(div).items = items;
        }
        tr.appendChild(tdOpt);

        if (this._isTree) { this._injectTreeToggle(tr, row, depth); }
        fragment.appendChild(tr);
    }

    /**
     * zeilen-drag: start
     * @param {HTMLTableRowElement} tr
     * @param {Object} row
     */
    _startRowDrag(tr, row) {
        this._draggedRow = row;
        this._draggedRowParent = row.parent || null;
        this._rowDragActive = true;
        this._dropTargetState = null;

        tr.classList.add("wx-table-dragging");

        this._rowPlaceholder = document.createElement("tr");
        this._rowPlaceholder.className = "wx-table-drag-placeholder";
        this._rowPlaceholder.style.height = "4px";

        const td = document.createElement("td");
        let colCount = this._columns.filter((c) => c.visible).length;
        if (this._movableRow) { colCount++; }
        colCount++; // options-spalte
        td.colSpan = colCount || 100;

        this._rowPlaceholder.appendChild(td);
        tr.after(this._rowPlaceholder);

        this._body.addEventListener("dragover", this._onTbodyDragOverHandler);
        this._body.addEventListener("drop", this._onTbodyDropHandler);
    }

    /**
     * zeilen-drag: dragover in tbody
     * @param {DragEvent} e
     */
    _onTbodyDragOver(e) {
        if (!this._rowDragActive) { return; }
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        const tr = e.target.closest("tr");

        if (this._lastHoveredTr && this._lastHoveredTr !== tr) {
            this._lastHoveredTr.classList.remove("wx-drop-target-parent");
        }
        this._lastHoveredTr = tr;

        if (!tr || !tr._dataRowRef || tr._dataRowRef === this._draggedRow) {
            this._rowPlaceholder.style.display = "";
            this._dropTargetState = null;
            return;
        }

        if (this._isDescendant(tr._dataRowRef, this._draggedRow)) { return; }

        const rect = tr.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const height = rect.height;

        const zoneTop = height * 0.25;
        const zoneBottom = height * 0.75;

        if (relY > zoneTop && relY < zoneBottom) {
            this._dropTargetState = { mode: "child", row: tr._dataRowRef };
            this._rowPlaceholder.style.display = "none";
            tr.classList.add("wx-drop-target-parent");
        } else {
            this._dropTargetState = null;
            tr.classList.remove("wx-drop-target-parent");
            this._rowPlaceholder.style.display = "";
            if (relY <= zoneTop) { tr.before(this._rowPlaceholder); } else { tr.after(this._rowPlaceholder); }
        }
    }

    /**
     * zeilen-drag: abschluss
     */
    _finalizeRowDrag() {
        let targetParent = null;
        let insertIndex = 0;

        if (this._dropTargetState && this._dropTargetState.mode === "child") {
            const targetRow = this._dropTargetState.row;
            targetParent = targetRow;
            if (!targetParent.children) { targetParent.children = []; }
            insertIndex = targetParent.children.length;
            targetParent.expanded = true;
        } else {
            let prev = this._rowPlaceholder.previousElementSibling;
            while (prev && (prev.classList.contains("wx-table-drag-placeholder") || prev.classList.contains("wx-table-dragging"))) {
                prev = prev.previousElementSibling;
            }
            if (prev && prev._dataRowRef) {
                targetParent = prev._dataRowRef.parent || null;
                const siblings = targetParent ? targetParent.children : this._rows;
                insertIndex = siblings.indexOf(prev._dataRowRef) + 1;
            } else {
                targetParent = null;
                insertIndex = 0;
            }
        }

        const oldParent = this._draggedRowParent;
        const oldSiblings = oldParent ? oldParent.children : this._rows;
        const oldIndex = oldSiblings.indexOf(this._draggedRow);
        if (oldIndex > -1) { oldSiblings.splice(oldIndex, 1); }

        const newSiblings = targetParent ? targetParent.children : this._rows;
        if (oldSiblings === newSiblings && oldIndex < insertIndex) { insertIndex--; }
        if (insertIndex < 0) { insertIndex = 0; }

        newSiblings.splice(insertIndex, 0, this._draggedRow);
        this._draggedRow.parent = targetParent;

        this._cleanupRowDrag();
        this._schedulePersist();
        this.render();

        this._dispatch(webexpress.webui.Event.ROW_REORDER_EVENT, {
            sender: this._element,
            newOrder: newSiblings,
            parentId: targetParent ? targetParent.id : null,
            rowId: this._draggedRow?.id
        });
    }

    /**
     * zeilen-drag: cleanup
     */
    _cleanupRowDrag() {
        this._body.removeEventListener("dragover", this._onTbodyDragOverHandler);
        this._body.removeEventListener("drop", this._onTbodyDropHandler);
        if (this._lastHoveredTr) { this._lastHoveredTr.classList.remove("wx-drop-target-parent"); this._lastHoveredTr = null; }
        this._rowDragActive = false;
        if (this._rowPlaceholder) { this._rowPlaceholder.remove(); }
        this._draggedRow = null;
        this._draggedRowParent = null;
        this._dropTargetState = null;
    }

    /**
     * helpers
     */
    _getVisibleColumns() { return this._columns.filter((c) => c.visible); }

    _applyColumnFilter(menu) {
        const term = (this._columnFilterTerm || "").toLowerCase();
        const items = menu.querySelectorAll(".wx-col-item");
        items.forEach((it) => {
            const id = it.dataset.columnId || "";
            const label = it.querySelector(".form-check-label")?.textContent || "";
            const hay = `${id} ${label}`.toLowerCase();
            it.style.display = (!term || hay.includes(term)) ? "" : "none";
        });
    }

    _schedulePersist() {
        if (!this._persistKey) { return; }
        if (this._saveDebounceTimer) { clearTimeout(this._saveDebounceTimer); }
        this._saveDebounceTimer = setTimeout(() => this._persistState(), 300);
    }

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
                        if (typeof s.visible === 'boolean') { c.visible = s.visible; }
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
     * strukturprüfung
     * @param {Object} candidate
     * @param {Object} ancestor
     * @returns {boolean}
     */
    _isDescendant(candidate, ancestor) {
        let p = candidate.parent;
        while (p) { if (p === ancestor) { return true; } p = p.parent; }
        return false;
    }
};

// register
webexpress.webui.Controller.registerClass("wx-webui-table-reorderable", webexpress.webui.TableCtrlReorderable);