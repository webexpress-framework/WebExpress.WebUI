/**
 * Reorderable table control providing column mutation and row moving.
 *
 * It renders through the hooks of the base table: a grip cell ahead of every row, the
 * column manager in the actions header and drag listeners on the column headers. A row
 * move is state - the moved row, the row under the pointer and the place the drop line
 * stands at - so the rows render their marks and the line from it; only the ghost and the
 * column insertion line follow the pointer directly, because they change at pointer rate.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.TABLE_SORT_EVENT
 * - webexpress.webui.Event.COLUMN_REORDER_EVENT
 * - webexpress.webui.Event.COLUMN_VISIBILITY_EVENT
 * - webexpress.webui.Event.COLUMN_SEARCH_EVENT
 * - webexpress.webui.Event.ROW_REORDER_EVENT
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 */
webexpress.webui.TableReorderableCtrl = class extends webexpress.webui.TableCtrl {

    // modal state
    _columnsModalEl = null;
    _columnsSidebarPanel = null;

    /**
     * Constructor.
     * @param {HTMLElement} element Host element.
     */
    constructor(element) {
        super(element);
        this._loadState();

        if (new.target === webexpress.webui.TableReorderableCtrl) {
            this._open();
        }
    }

    /**
     * Reads the reorderable features from the dataset.
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

        this.setState({ move: null });
    }

    /**
     * Parse extended config and cleanup custom data attributes on host.
     * @param {HTMLElement} element Host element.
     */
    _parseConfig(element) {
        super._parseConfig(element);
        const attrsToRemove = [
            "data-movable-row",
            "data-persist-key",
            "data-allow-column-remove",
            "data-tree-enabled",
            "data-tree-move-enabled",
            "data-columns-modal-key"
        ];
        attrsToRemove.forEach(attr => element.removeAttribute(attr));
    }

    // ------------------------------------------------------------------ view hooks

    /**
     * Gets the classes of the header row.
     * @returns {string} The css classes.
     */
    _headerRowClass() {
        return "wx-grid-row wx-grid-head-row";
    }

    /**
     * Describes the header of the grip column. The column is named, but the name need
     * not be seen.
     * @param {object} state - The current state.
     * @returns {object|null} The header cell virtual node.
     */
    _renderHeadPrefix(state) {
        if (!this._movableRow) {
            return null;
        }
        const h = webexpress.webui.h;
        return h("div", { key: "__grip", class: "wx-table-drag-column", role: "columnheader" },
            h("span", { class: "visually-hidden" }, this._i18n("webexpress.webui:table.row.move", "Move row")));
    }

    /**
     * Describes the placeholder under the grips in the footer.
     * @param {object} state - The current state.
     * @returns {object|null} The placeholder cell virtual node.
     */
    _renderFootPrefix(state) {
        if (!this._movableRow) {
            return null;
        }
        return webexpress.webui.h("div", { key: "__grip", class: "wx-grid-cell wx-table-drag-column", role: this._cellRole });
    }

    /**
     * Names the grid track of the grip column.
     * @returns {Array<string>} The track sizes.
     */
    _gridPrefixTracks() {
        return this._movableRow ? ["1.5rem"] : [];
    }

    /**
     * Makes a column header draggable; the insertion line is positioned relative to it.
     * @param {Object} col - The column.
     * @returns {object} The props.
     */
    _headerCellProps(col) {
        return {
            draggable: "true",
            style: "position: relative",
            on: this._columnDragHandlers(col.id)
        };
    }

    /**
     * Order, width and sort of the columns can always be changed, so the header
     * carries the column manager whenever it is shown - not only when rows have
     * options or columns may be hidden.
     * @returns {boolean}
     */
    _hasActionsColumn() {
        return this._hasOptions || !this._suppressHeaders;
    }

    /**
     * Describes the actions header: a button that opens the columns modal.
     * @param {object} state - The current state.
     * @returns {object} The header cell virtual node.
     */
    _renderActionsHeader(state) {
        const h = webexpress.webui.h;
        const label = this._i18n("webexpress.webui:table.columns.manage", "Manage columns");

        return h("div", { key: "__actions", class: "wx-grid-header-cell wx-table-actions", role: "columnheader" },
            h("button", {
                type: "button",
                class: "btn btn-sm",
                title: label,
                "aria-label": label,
                on: this._handler("columns", "manage", () => ({
                    click: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this._openColumnsModal();
                    }
                }))
            }, h("i", { class: this._iconClass("bars-vertical"), "aria-hidden": "true" })));
    }

    /**
     * Describes the grip of a row. The cell stays a cell of the row; the grip inside it
     * is the button.
     * @param {object} state - The current state.
     * @param {Object} row - Row data object.
     * @returns {object|null} The grip cell virtual node.
     */
    _renderRowPrefix(state, row) {
        if (!this._movableRow) {
            return null;
        }
        const h = webexpress.webui.h;
        return h("div", { key: "__grip", class: "wx-grid-cell wx-table-drag-handle", role: this._cellRole },
            h("span", {
                tabindex: "0",
                role: "button",
                "aria-label": this._i18n("webexpress.webui:table.row.move", "Move row"),
                style: "cursor: grab; user-select: none"
            }, "⠿"));
    }

    /**
     * Marks the moved row and, when the row would land inside it as a child, the row under
     * the pointer; a drop before or after a row is shown by the line alone.
     * @param {object} state - The current state.
     * @param {Object} row - Row data object.
     * @returns {Array<string>|null} The classes.
     */
    _rowClasses(state, row) {
        const move = state.move;
        if (!move) {
            return null;
        }
        const key = this._getRowKey(row);
        return [key === move.key && "wx-dragging", key === move.over && move.child && "wx-drag-over"];
    }

    /**
     * Describes the rows and, during a move, the line that shows where the row lands.
     * @param {object} state - The current state.
     * @param {boolean} tree - Whether a row has children.
     * @returns {Array<object>} The row virtual nodes.
     */
    _renderRowsList(state, tree) {
        const nodes = super._renderRowsList(state, tree);
        const at = state.move && state.move.at;
        if (!at) {
            return nodes;
        }

        const index = nodes.findIndex((node) => node.key === at.key);
        if (index < 0) {
            return nodes;
        }

        const h = webexpress.webui.h;
        const line = h("div", {
            key: "__placeholder",
            class: "wx-row-move-placeholder wx-grid-row",
            style: state.move.child ? "display: none" : ""
        }, h("div", { class: "wx-grid-cell" }));

        nodes.splice(at.mode === "before" ? index : index + 1, 0, line);
        return nodes;
    }

    /**
     * Describes the line that shows where a dragged column lands.
     * @param {object} state - The current state.
     * @returns {object} The indicator virtual node.
     */
    _renderTableExtras(state) {
        return webexpress.webui.h("div", {
            key: "__columnIndicator",
            class: "wx-table-drag-indicator",
            "aria-hidden": "true",
            style: "display: none",
            ref: (el) => { this._dragColumnIndicator = el; }
        });
    }

    /**
     * Adds the start of a row move to the listeners of the body: the grip is a pointer
     * gesture, and the arrow keys on it move the row among its siblings so the order can
     * be changed without a mouse.
     * @returns {object} The listener map.
     */
    _bodyHandlers() {
        if (!this._movableRow) {
            return super._bodyHandlers();
        }
        return this._handler("body", "moves", () => Object.assign({}, super._bodyHandlers(), {
            mousedown: (e) => this._onGripMouseDown(e),
            keydown: (e) => this._onGripKeyDown(e)
        }));
    }

    // ------------------------------------------------------------------ columns modal

    /**
     * Create dynamic modal host for columns, backed by ModalSidebarPanelCtrl.
     */
    _createColumnsModal() {
        const id = `wx-table-columns-msp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const el = document.createElement("dialog");
        el.id = id;
        el.setAttribute("aria-labelledby", `${id}-label`);
        el.dataset.key = "table-columns";
        el.dataset.submitId = "apply-columns";
        el.dataset.validateActiveOnly = "true";

        // build structure safely
        const header = document.createElement("div");
        header.className = "wx-modal-header";
        header.textContent = this._i18n("webexpress.webui:table.columns.title", "Columns");

        const content = document.createElement("div");
        content.className = "wx-modal-content";

        const footer = document.createElement("div");
        footer.className = "wx-modal-footer";

        el.append(header, content, footer);
        document.body.appendChild(el);

        const modalCtrl = new webexpress.webui.ModalSidebarPanelCtrl(el);
        modalCtrl._tableCtrl = this;

        // bridge modal actions to table control methods
        this._bindModalActions(modalCtrl);

        this._columnsModalEl = el;
        this._columnsSidebarPanel = modalCtrl;
    }

    /**
     * Helper to bind modal callback actions.
     * @param {Object} modalCtrl Modal controller instance.
     */
    _bindModalActions(modalCtrl) {
        modalCtrl.getColumns = () => {
            return this._columns.map(c => ({
                id: c.id,
                label: c.label,
                visible: c.visible,
                width: c.width,
                sort: c.sort,
                color: c.color
            }));
        };

        // the panel offers hiding a column only where this callback exists
        modalCtrl.applyVisibility = !this._allowColumnRemove ? null : (columnId, visible) => {
            this._runWithModalPreservation(() => {
                const col = this._columns.find(c => c.id === columnId);
                if (col) {
                    col.visible = !!visible;
                    this._schedulePersist();
                    this.render();
                }
            });
            this._dispatch(webexpress.webui.Event.COLUMN_VISIBILITY_EVENT, {
                sender: this._element,
                columnId,
                visible: !!visible
            });
        };

        modalCtrl.applyOrder = (orderedIds) => {
            this._runWithModalPreservation(() => {
                this._applyColumnOrder(orderedIds);
                this._schedulePersist();
                this.render();
            });
            this._dispatch(webexpress.webui.Event.COLUMN_REORDER_EVENT, {
                sender: this._element,
                sourceIndex: -1,
                targetIndex: -1
            });
        };

        modalCtrl.applyWidth = (columnId, widthPx) => {
            const col = this._columns.find(c => c.id === columnId);
            if (!col) return;

            const w = parseInt(widthPx, 10);
            if (!isNaN(w) && w > 0) {
                col.width = w;
            }
            this._runWithModalPreservation(() => {
                this._schedulePersist();
                this.render();
            });
        };

        modalCtrl.applySort = (columnId, dir) => {
            this._runWithModalPreservation(() => {
                this._applySort(columnId, dir);
                this._schedulePersist();
            });
        };
    }

    /**
     * Open the columns modal and pass context data for panels.
     */
    _openColumnsModal() {
        if (!this._columnsModalEl) {
            this._createColumnsModal();
        }
        if (this._columnsSidebarPanel) {
            this._columnsSidebarPanel._tableCtrl = this;
            this._columnsSidebarPanel._columnsPrefill = {
                columns: this._columns.map(c => ({
                    id: c.id,
                    label: c.label,
                    visible: c.visible,
                    width: c.width,
                    sort: c.sort
                })),
                filterTerm: this._columnFilterTerm || ""
            };
            if (typeof this._columnsSidebarPanel.show === "function") {
                this._columnsSidebarPanel.show();
            }
        }
    }

    /**
     * Preserve modal state (open + scroll) across actions and re-render.
     * @param {Function} action Function to execute.
     */
    _runWithModalPreservation(action) {
        const modal = this._columnsSidebarPanel;
        const content = modal ? (modal._contentEl || this._columnsModalEl.querySelector(".wx-modal-content")) : null;
        const list = content ? content.querySelector(".wx-columns-list") : null;
        const scroll = list ? list.scrollTop : 0;
        const wasOpen = modal && typeof modal.isShown === "function" ? modal.isShown() : false;

        action();

        if (wasOpen && modal && typeof modal.show === "function") {
            modal.show();
            // restore scroll position after modal re-renders
            requestAnimationFrame(() => {
                const list2 = (modal._contentEl || this._columnsModalEl.querySelector(".wx-modal-content"))?.querySelector(".wx-columns-list");
                if (list2) {
                    list2.scrollTop = scroll;
                }
            });
        }
    }

    // ------------------------------------------------------------------ column drag

    /**
     * Returns the drag listeners of a column header. They name only the column id and
     * look the column up when they run, so a listener never acts on a replaced column.
     * @param {string} columnId - The column id.
     * @returns {object} The listener map.
     */
    _columnDragHandlers(columnId) {
        return this._handler("columnDrag", columnId, () => ({
            dragstart: (e) => {
                // the header sorts on a click, so only a drag with ctrl moves the column;
                // a plain drag would move it by accident
                if (!e.ctrlKey) {
                    e.preventDefault();
                    return;
                }
                this._draggedColumnId = columnId;
                e.dataTransfer.effectAllowed = "move";
            },
            dragend: () => {
                this._hideColumnIndicator();
                this._draggedColumnId = null;
            },
            dragover: (e) => {
                if (!this._draggedColumnId) {
                    return;
                }
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";

                const th = e.currentTarget;
                const rect = th.getBoundingClientRect();
                const leftSide = e.clientX < rect.left + th.offsetWidth / 2;
                const indicator = this._dragColumnIndicator;
                if (indicator) {
                    indicator.style.top = `${rect.top}px`;
                    indicator.style.left = `${(leftSide ? rect.left - 1 : rect.left + th.offsetWidth - 1)}px`;
                    indicator.style.height = `${rect.height}px`;
                    indicator.style.display = "block";
                }
            },
            drop: (e) => {
                e.preventDefault();
                const th = e.currentTarget;
                const rect = th.getBoundingClientRect();
                this._dropColumn(this._draggedColumnId, columnId, e.clientX < rect.left + th.offsetWidth / 2);
            }
        }));
    }

    /**
     * Hides the column insertion line.
     */
    _hideColumnIndicator() {
        if (this._dragColumnIndicator) {
            this._dragColumnIndicator.style.display = "none";
        }
    }

    /**
     * Moves a column next to another one, with the cells of every row.
     * @param {string|null} sourceId - The id of the dragged column.
     * @param {string} targetId - The id of the column it was dropped on.
     * @param {boolean} insertBefore - Whether it lands before the target column.
     */
    _dropColumn(sourceId, targetId, insertBefore) {
        if (!sourceId || sourceId === targetId) {
            return;
        }

        const sourceIndex = this._columns.findIndex((c) => c.id === sourceId);
        const targetIndex = this._columns.findIndex((c) => c.id === targetId);
        if (sourceIndex < 0 || targetIndex < 0) {
            return;
        }

        let adjusted = targetIndex;
        if (insertBefore && sourceIndex < targetIndex) {
            adjusted -= 1;
        } else if (!insertBefore && sourceIndex > targetIndex) {
            adjusted += 1;
        }

        if (sourceIndex === adjusted) {
            return;
        }

        const ids = this._columns.map((c) => c.id);
        ids.splice(sourceIndex, 1);
        ids.splice(adjusted, 0, sourceId);

        this._runWithModalPreservation(() => {
            this._applyColumnOrder(ids);
            this._schedulePersist();
            this.render();
        });

        this._dispatch(webexpress.webui.Event.COLUMN_REORDER_EVENT, {
            sender: this._element,
            sourceIndex,
            targetIndex: adjusted
        });
    }

    // ------------------------------------------------------------------ row move

    /**
     * Starts a row move on the grip of a row.
     * @param {MouseEvent} e - The mousedown event on the body.
     */
    _onGripMouseDown(e) {
        const handle = e.target.closest(".wx-table-drag-handle");
        if (!handle || e.button !== 0) {
            return;
        }

        const tr = handle.closest(".wx-grid-row");
        if (!tr || !tr._dataRowRef) {
            return;
        }

        e.preventDefault();
        this._beginRowMove(tr._dataRowRef, tr, e.clientX, e.clientY);

        const onMove = (ev) => {
            if (!this._rowMoveSourceRow) return;
            ev.preventDefault();
            this._updateRowMove(ev.clientX, ev.clientY);
        };

        const onUp = (ev) => {
            if (!this._rowMoveSourceRow) return;
            ev.preventDefault();
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            this._finalizeRowMove();
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }

    /**
     * Moves a row with the arrow keys on its grip.
     * @param {KeyboardEvent} e - The keydown event on the body.
     */
    _onGripKeyDown(e) {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
            return;
        }
        const grip = e.target.closest ? e.target.closest(".wx-table-drag-handle [role=\"button\"]") : null;
        const tr = grip ? grip.closest(".wx-grid-row") : null;
        if (!tr || !tr._dataRowRef) {
            return;
        }
        // the arrow keys are the selection shortcuts of the host as well; on the grip they
        // move the row and nothing else
        e.preventDefault();
        e.stopPropagation();
        this._moveRowByStep(tr._dataRowRef, e.key === "ArrowUp" ? -1 : 1);
    }

    /**
     * Moves a row one place up or down among its siblings and puts the focus back on its
     * grip, which moving the row node has taken away.
     * @param {Object} row - The row to move.
     * @param {number} delta - -1 for up, +1 for down.
     */
    _moveRowByStep(row, delta) {
        const siblings = row.parent ? row.parent.children : this._rows;
        const index = siblings.indexOf(row);
        const target = index + delta;
        if (index < 0 || target < 0 || target >= siblings.length) {
            return;
        }

        siblings.splice(index, 1);
        siblings.splice(target, 0, row);

        this._dispatch(webexpress.webui.Event.ROW_REORDER_EVENT, {
            sender: this._element,
            newOrder: siblings,
            parentId: row.parent ? row.parent.id : null,
            rowId: row.id,
            toIndex: target
        });

        this._schedulePersist();
        this.render();
        this._store.flush();
        row._anchorTr?.querySelector(".wx-table-drag-handle [role=\"button\"]")?.focus({ preventScroll: true });
    }

    /**
     * Begins a pointer-based row move: the moved row is marked, the drop line stands
     * below it, and a ghost follows the pointer.
     * @param {Object} row Source row data object.
     * @param {HTMLElement} tr Source row element (div).
     * @param {number} startX Initial pointer X.
     * @param {number} startY Initial pointer Y.
     */
    _beginRowMove(row, tr, startX, startY) {
        const key = this._getRowKey(row);
        this._rowMoveSourceRow = row;
        this._rowMoveSourceParent = row.parent || null;
        this._rowMoveTarget = null;
        this.setState({ move: { key: key, over: null, at: { key: key, mode: "after" }, child: false } });

        const ghost = document.createElement("div");
        ghost.className = "wx-row-ghost";
        ghost.style.cssText = `
            position: fixed;
            left: ${startX + 8}px;
            top: ${startY + 8}px;
            pointer-events: none;
            padding: 2px 6px;
            background: rgba(var(--wx-primary-rgb), 0.15);
            border: 1px solid rgba(var(--wx-primary-rgb), 0.6);
            border-radius: 4px;
            font-size: 12px;
            z-index: 2147483647;
        `;
        ghost.textContent = row.id ? `Row: ${row.id}` : this._i18n("webexpress.webui:table.moving.item", "Moving item");
        document.body.appendChild(ghost);
        this._rowMoveGhost = ghost;

        this._onBodyHoverMoveBound = this._onBodyHoverMove.bind(this);
        this._body.addEventListener("mousemove", this._onBodyHoverMoveBound);
    }

    /**
     * Update ghost position.
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
     * Computes the drop target under the pointer: the upper and the lower quarter of a row
     * drop before or after it, the middle into it as a child. A collapsed row that is
     * hovered for a second unfolds, so a row can be dropped among its children.
     * @param {MouseEvent} e Mouse move event over the body.
     */
    _onBodyHoverMove(e) {
        const move = this.state.move;
        if (!move) {
            return;
        }

        const tr = e.target.closest(".wx-grid-row");
        const row = tr ? tr._dataRowRef : null;
        const switchedTarget = this._lastHoverRow !== row;
        this._lastHoverRow = row;

        if (switchedTarget && this._hoverExpandTimer) {
            clearTimeout(this._hoverExpandTimer);
            this._hoverExpandTimer = null;
        }

        // over the moved row, the drop line or nothing the line stays where it stood
        if (!row || row === this._rowMoveSourceRow) {
            this._rowMoveTarget = null;
            this._setMove({ over: null, child: false });
            return;
        }

        const key = this._getRowKey(row);

        if (this._isDescendant(row, this._rowMoveSourceRow)) {
            this._setMove({ over: key });
            return;
        }

        const rect = tr.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const zoneTop = rect.height * 0.25;
        const zoneBottom = rect.height * 0.75;
        const canDropAsChild = this._treeEnabled && this._treeMoveEnabled;

        if (canDropAsChild && relY > zoneTop && relY < zoneBottom) {
            this._rowMoveTarget = { mode: "child", row: row };
            this._setMove({ over: key, child: true });
        } else {
            const mode = relY <= zoneTop ? "before" : "after";
            this._rowMoveTarget = { mode: mode, row: row };
            this._setMove({ over: key, child: false, at: { key: key, mode: mode } });
        }

        if (switchedTarget && this._treeEnabled && row.children?.length && row.expanded === false) {
            this._hoverExpandTimer = setTimeout(() => {
                row.expanded = true;
                this.render();
            }, 1000);
        }
    }

    /**
     * Changes the move state, but only when the change shows: the pointer moves within a
     * row far more often than it crosses into another one, and each change renders.
     * @param {object} patch - The changed parts: over, child, at.
     */
    _setMove(patch) {
        const move = this.state.move;
        if (!move) {
            return;
        }
        const at = patch.at && move.at && patch.at.key === move.at.key && patch.at.mode === move.at.mode ? move.at : (patch.at || move.at);
        const over = "over" in patch ? patch.over : move.over;
        const child = "child" in patch ? patch.child : move.child;
        if (at === move.at && over === move.over && child === move.child) {
            return;
        }
        this.setState({ move: Object.assign({}, move, { at: at, over: over, child: child }) });
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
        this._lastHoverRow = null;

        if (this._rowMoveGhost) {
            this._rowMoveGhost.remove();
            this._rowMoveGhost = null;
        }

        const moving = this._rowMoveSourceRow;
        const at = this.state.move ? this.state.move.at : null;
        if (!moving) {
            this._resetMoveState();
            return;
        }

        let targetParent = null;
        let insertIndex = 0;

        if (this._rowMoveTarget && this._rowMoveTarget.mode === "child") {
            const targetRow = this._rowMoveTarget.row;
            if (targetRow === moving) {
                this._resetMoveState();
                return;
            }
            targetParent = targetRow;
            if (!Array.isArray(targetParent.children)) targetParent.children = [];
            insertIndex = targetParent.children.length;
            targetParent.expanded = true;
            this._isTree = true;
        } else if (this._rowMoveTarget) {
            const targetRow = this._rowMoveTarget.row;
            const siblings = targetRow.parent ? targetRow.parent.children : this._rows;
            const baseIndex = siblings.indexOf(targetRow);
            insertIndex = this._rowMoveTarget.mode === "before" ? baseIndex : baseIndex + 1;
            targetParent = targetRow.parent || null;
        } else if (at) {
            // without a row under the pointer the row lands where the drop line stands
            const anchor = this._findRowByKey(at.key);
            if (anchor) {
                targetParent = anchor.parent || null;
                const siblings = targetParent ? targetParent.children : this._rows;
                const idx = siblings.indexOf(anchor);
                if (idx >= 0) insertIndex = at.mode === "before" ? idx : idx + 1;
            }
        }

        // prevent dropping into own descendants
        if (targetParent && this._isDescendant(targetParent, moving)) {
            this._resetMoveState();
            return;
        }

        // remove from old position
        const oldParent = this._rowMoveSourceParent;
        const oldSiblings = oldParent ? oldParent.children : this._rows;
        const oldIndex = oldSiblings.indexOf(moving);

        if (oldIndex === -1) {
            this._resetMoveState();
            return;
        }

        const [removed] = oldSiblings.splice(oldIndex, 1);

        // adjust index if staying in same list and moving down
        const newSiblings = targetParent ? targetParent.children : this._rows;
        if (oldSiblings === newSiblings && oldIndex < insertIndex) {
            insertIndex--;
        }

        // clamp index
        insertIndex = Math.max(0, Math.min(insertIndex, newSiblings.length));

        // insert at new position
        newSiblings.splice(insertIndex, 0, removed);
        removed.parent = targetParent;

        this._dispatch(webexpress.webui.Event.ROW_REORDER_EVENT, {
            sender: this._element,
            newOrder: newSiblings,
            parentId: targetParent ? targetParent.id : null,
            rowId: removed.id,
            toIndex: insertIndex
        });

        this._resetMoveState();
        this._schedulePersist();
        this.render();
    }

    /**
     * Ends a move: the marks and the drop line go with the state.
     */
    _resetMoveState() {
        this._rowMoveSourceRow = null;
        this._rowMoveSourceParent = null;
        this._rowMoveTarget = null;
        this.setState({ move: null });
    }

    /**
     * Finds a row of any level by its key.
     * @param {string} key - The row key.
     * @returns {Object|null} The row.
     */
    _findRowByKey(key) {
        const stack = [...this._rows];
        while (stack.length) {
            const r = stack.pop();
            if (this._getRowKey(r) === key) {
                return r;
            }
            if (r.children) {
                stack.push(...r.children);
            }
        }
        return null;
    }

    /**
     * Returns all columns that are currently marked as visible.
     * @returns {Array<Object>} The list of visible columns.
     */
    _getVisibleColumns() {
        return this._columns.filter(c => c.visible);
    }

    // ------------------------------------------------------------------ persistence

    /**
     * Schedules a debounced persistence update.
     */
    _schedulePersist() {
        if (!this._persistKey) return;

        if (this._saveDebounceTimer) {
            clearTimeout(this._saveDebounceTimer);
        }
        this._saveDebounceTimer = setTimeout(() => {
            this._persistState();
        }, 300);
    }

    /**
     * Persists the table state into localStorage.
     * @param {Array<Object>} [layout] - The column layout to store, in display order, as
     *     records of id, visible and width; the current columns when omitted. A subclass
     *     that stores only a layout its server confirmed passes that one.
     */
    _persistState(layout = this._columns) {
        const collapsed = [];
        const stack = [...this._rows];
        while (stack.length) {
            const r = stack.pop();
            if (r.id && r.children?.length) {
                if (!r.expanded) collapsed.push(r.id);
                for (let i = 0; i < r.children.length; i++) {
                    stack.push(r.children[i]);
                }
            }
        }

        const sortCol = this._columns.find(c => c.sort);
        const state = {
            v: 1,
            cols: layout.map(c => ({ id: c.id, visible: c.visible, width: c.width })),
            order: layout.map(c => c.id),
            sort: sortCol ? { id: sortCol.id, dir: sortCol.sort } : null,
            tree: { collapsed }
        };

        webexpress.webui.LocalStorage.setJson(this._persistKey, state);
    }

    /**
     * Loads a previously persisted table state from localStorage.
     */
    _loadState() {
        const obj = this._readStoredState();
        if (!obj) return;

        try {
            const colMap = new Map(this._columns.map(c => [c.id, c]));

            // Restore Order
            if (Array.isArray(obj.order)) {
                this._applyColumnOrder(obj.order);
            }

            // Restore Settings (visibility, width)
            if (Array.isArray(obj.cols)) {
                obj.cols.forEach(s => {
                    const c = s && colMap.get(s.id);
                    if (c) {
                        if (typeof s.visible === "boolean") c.visible = s.visible;
                        const width = parseInt(s.width, 10);
                        if (Number.isFinite(width) && width > 0) c.width = width;
                    }
                });
            }

            // Restore Sort
            if (obj.sort?.id) {
                const c = colMap.get(obj.sort.id);
                if (c && ["asc", "desc"].includes(obj.sort.dir)) c.sort = obj.sort.dir;
            }

            this._restoreCollapsed(obj);
        } catch (e) { /* ignore */ }
    }

    /**
     * Collapses the rows a persisted state names as collapsed.
     * @param {Object|null} obj - The persisted state.
     */
    _restoreCollapsed(obj) {
        if (!Array.isArray(obj?.tree?.collapsed)) return;
        const set = new Set(obj.tree.collapsed);
        const stack = [...this._rows];
        while (stack.length) {
            const r = stack.pop();
            if (set.has(r.id)) r.expanded = false;
            if (r.children) stack.push(...r.children);
        }
    }

    /**
     * Reads the persisted table state.
     * @returns {Object|null} The state, or null when none of the known version is stored.
     */
    _readStoredState() {
        if (!this._persistKey) return null;
        const stored = webexpress.webui.LocalStorage.getJson(this._persistKey);
        return stored && stored.v === 1 ? stored : null;
    }

    /**
     * Structure check: is candidate a descendant of ancestor?
     * @param {Object} candidate Potential descendant row.
     * @param {Object} ancestor Potential ancestor row.
     * @returns {boolean} True when candidate is a descendant of ancestor.
     */
    _isDescendant(candidate, ancestor) {
        let p = candidate.parent;
        while (p) {
            if (p === ancestor) return true;
            p = p.parent;
        }
        return false;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-table-reorderable", webexpress.webui.TableReorderableCtrl);
