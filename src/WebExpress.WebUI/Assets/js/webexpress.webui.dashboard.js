/**
 * Core Dashboard control that handles independent vertical columns (lanes).
 * Columns can have optional titles and custom width sizes (e.g., 25%, 50%, *).
 * Widgets are stacked independently inside their respective columns.
 */
webexpress.webui.DashboardCtrl = class extends webexpress.webui.Ctrl {

    _columns = [];
    _dragWidget = null;
    _dragColIndex = -1;

    // column header editing / reordering / deleting
    _editableColumn = false;
    _movableColumn = false;
    _deletableColumn = false;
    _dragColumnIndex = null;
    _activeColumnEdit = null;

    /**
     * Initializes the dashboard control.
     * @param {HTMLElement} element - The root element for the dashboard.
     */
    constructor(element) {
        super(element);

        element.classList.add("wx-dashboard");

        // column capabilities (the REST host element carries these attributes,
        // so they apply to both the dom-driven and the rest-driven path)
        this._editableColumn = element.dataset.editableColumn === "true";
        this._movableColumn = element.dataset.movableColumn === "true";
        this._deletableColumn = element.dataset.deletableColumn === "true";

        this._parseStaticConfig();
        this.render();
    }

    /**
     * Parses columns and widgets from the static dom attributes.
     */
    _parseStaticConfig() {
        const el = this._element;
        let columns = [];

        // extract columns from elements or dataset
        const columnNodes = el.querySelectorAll(".wx-column");
        if (columnNodes.length > 0) {
            columnNodes.forEach((node) => {
                columns.push({
                    id: node.id || node.dataset.id,
                    title: node.dataset.title || node.id || "column",
                    size: node.dataset.size || "1fr",
                    widgets: []
                });
            });
        } else {
            let colIds = [];
            let colTitles = [];
            let colSizes = [];

            if (el.dataset.columns) {
                colIds = String(el.dataset.columns).split(",").map((s) => {
                    return s.trim();
                });
            }
            if (el.dataset.columnTitles) {
                colTitles = String(el.dataset.columnTitles).split(",").map((s) => {
                    return s.trim();
                });
            }
            if (el.dataset.columnSize) {
                colSizes = String(el.dataset.columnSize).split(",").map((s) => {
                    let size = s.trim();
                    return size === "*" ? "1fr" : size;
                });
            }

            const maxCols = Math.max(colIds.length, colTitles.length);

            if (maxCols === 0) {
                // default to 3 columns if nothing is specified
                for (let i = 0; i < 3; i++) {
                    columns.push({
                        id: "col_" + i,
                        label: "",
                        size: "1fr",
                        widgets: []
                    });
                }
            } else {
                for (let i = 0; i < maxCols; i++) {
                    columns.push({
                        id: colIds[i] || `col_${i}`,
                        label: colTitles[i] || colIds[i] || `column ${i + 1}`,
                        size: colSizes[i] || "1fr",
                        widgets: []
                    });
                }
            }
        }

        this._columns = columns;
        this._parseStaticWidgets();
    }

    /**
     * Parses the initial widget configuration from the static DOM elements.
     */
    _parseStaticWidgets() {
        const widgetElements = this._element.querySelectorAll(".wx-dashboard-widget");
        let parseIndex = 0;

        for (let i = 0; i < widgetElements.length; i++) {
            const wEl = widgetElements[i];
            const dataset = wEl.dataset;
            const widgetId = dataset.widget || null;
            const htmlContent = wEl.innerHTML.trim();

            if (widgetId || htmlContent) {
                const params = {};

                const reservedKeys = [
                    "widget", "color", "closeable", "movable",
                    "label", "icon", "image", "column", "columnId"
                ];

                for (const key in dataset) {
                    if (Object.prototype.hasOwnProperty.call(dataset, key)) {
                        if (!reservedKeys.includes(key)) {
                            params[key] = dataset[key];
                        }
                    }
                }

                const widgetData = {
                    instanceId: "wx_inst_" + i + "_" + Date.now(),
                    id: widgetId || "w_custom_" + i,
                    title: dataset.title || null,
                    icon: dataset.icon || null,
                    image: dataset.image || null,
                    color: dataset.color || null,
                    removable: dataset.closeable !== "false",
                    movable: dataset.movable !== "false",
                    html: htmlContent,
                    params: params,
                    columnId: dataset.columnId || dataset.column || null
                };

                let targetColIndex = -1;

                if (widgetData.columnId !== null) {
                    // try to find column by id
                    targetColIndex = this._columns.findIndex((c) => {
                        return c.id === String(widgetData.columnId);
                    });

                    // fallback to index if id is numeric
                    if (targetColIndex === -1 && !isNaN(widgetData.columnId)) {
                        const idx = parseInt(widgetData.columnId, 10);
                        if (idx >= 0 && idx < this._columns.length) {
                            targetColIndex = idx;
                        }
                    }
                }

                if (targetColIndex === -1) {
                    // distribute evenly
                    targetColIndex = parseIndex % this._columns.length;
                }

                this._columns[targetColIndex].widgets.push(widgetData);
                parseIndex++;
            }
        }
    }

    /**
     * Renders the complete dashboard based on the current columns structure.
     */
    render() {
        const el = this._element;
        el.innerHTML = "";

        const row = document.createElement("div");
        row.className = "wx-dashboard-row";

        // apply columns and custom template
        row.style.setProperty("--wx-board-cols", this._columns.length);
        const sizes = this._columns.map((c) => {
            return c.size === "*" ? "1fr" : c.size;
        });
        row.style.setProperty("--wx-board-template", sizes.join(" "));

        for (let colIdx = 0; colIdx < this._columns.length; colIdx++) {
            const colData = this._columns[colIdx];

            const wrapperEl = document.createElement("div");
            wrapperEl.className = "wx-dashboard-lane-wrapper";

            const colTitle = colData.title ?? colData.label ?? "";
            const hasColTools = this._editableColumn || this._movableColumn || this._deletableColumn;
            if (colTitle || hasColTools) {
                const titleEl = document.createElement("h5");
                titleEl.className = "wx-dashboard-lane-title";
                titleEl.textContent = colTitle;
                this._decorateColumnHeader(titleEl, colIdx);
                wrapperEl.appendChild(titleEl);
            }

            const laneEl = document.createElement("div");
            laneEl.className = "wx-dashboard-lane";
            laneEl.dataset.columnIndex = colIdx;
            laneEl.dataset.columnId = colData.id;

            if (colData.movable) {
                laneEl.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    if (laneEl.children.length === 0) {
                        laneEl.classList.add("wx-drag-over-empty");
                    } else {
                        // highlight the bottom of the last widget when dragging in empty space below
                        const lastChild = laneEl.lastElementChild;
                        if (lastChild && !lastChild.classList.contains("wx-drag-over-top")) {
                            lastChild.classList.add("wx-drag-over-bottom");
                        }
                    }
                });
                laneEl.addEventListener("dragleave", (e) => {
                    laneEl.classList.remove("wx-drag-over-empty");
                    const lastChild = laneEl.lastElementChild;
                    if (lastChild) {
                        lastChild.classList.remove("wx-drag-over-bottom");
                    }
                });
                laneEl.addEventListener("drop", (e) => {
                    this._onDropLane(e, colIdx, laneEl);
                });
            }

            const columnWidgets = colData.widgets;
            for (let i = 0; i < columnWidgets.length; i++) {
                const widgetData = columnWidgets[i];
                const card = this._buildWidgetElement(widgetData, colIdx);
                laneEl.appendChild(card);
            }

            wrapperEl.appendChild(laneEl);
            row.appendChild(wrapperEl);
        }

        el.appendChild(row);
    }

    /**
     * Decorates a column header with the inline-rename, ⠿ reorder grip and
     * delete affordances, depending on the enabled column flags.
     * @param {HTMLElement} headerEl - The column header element.
     * @param {number} index - The column index in this._columns.
     */
    _decorateColumnHeader(headerEl, index) {
        if (!this._editableColumn && !this._movableColumn && !this._deletableColumn) {
            return;
        }

        headerEl.classList.add("wx-board-col-header");

        if (this._movableColumn) {
            headerEl.classList.add("wx-board-col-movable");

            const grip = document.createElement("span");
            grip.className = "wx-board-col-grip";
            grip.textContent = "⠿";
            grip.title = this._i18n("webexpress.webapp:column.move", "Reorder column");
            grip.setAttribute("aria-label", grip.title);
            grip.draggable = true;
            grip.addEventListener("click", (e) => e.stopPropagation());
            grip.addEventListener("dragstart", (e) => {
                this._dragColumnIndex = index;
                headerEl.classList.add("wx-board-col-dragging");
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = "move";
                    try { e.dataTransfer.setData("text/plain", String(index)); } catch (err) { /* noop */ }
                }
            });
            grip.addEventListener("dragend", () => {
                headerEl.classList.remove("wx-board-col-dragging");
                this._dragColumnIndex = null;
            });
            headerEl.insertBefore(grip, headerEl.firstChild);

            headerEl.addEventListener("dragover", (e) => {
                if (this._dragColumnIndex === null) {
                    return;
                }
                e.preventDefault();
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = "move";
                }
            });
            headerEl.addEventListener("drop", (e) => {
                if (this._dragColumnIndex === null) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                const rect = headerEl.getBoundingClientRect();
                const after = e.clientX > rect.left + rect.width / 2;
                this._moveColumn(this._dragColumnIndex, index, after);
            });
        }

        if (this._deletableColumn) {
            const del = document.createElement("button");
            del.type = "button";
            del.className = "wx-board-col-delete";
            del.title = this._i18n("webexpress.webapp:column.delete", "Delete column");
            del.setAttribute("aria-label", del.title);
            del.innerHTML = `<i class="${this._iconClass("fas fa-xmark", "wx-icon-light-xmark")}"></i>`;
            del.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._deleteColumn(index);
            });
            headerEl.appendChild(del);
        }

        if (this._editableColumn) {
            headerEl.classList.add("wx-board-col-editable");
            headerEl.addEventListener("dblclick", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._startColumnEdit(headerEl, index);
            });
            headerEl.addEventListener("mouseenter", () => {
                if (this._activeColumnEdit || headerEl.querySelector(".wx-board-col-edit")) {
                    return;
                }
                const pencil = document.createElement("button");
                pencil.type = "button";
                pencil.className = "wx-board-col-edit";
                pencil.title = this._i18n("webexpress.webapp:column.edit", "Rename column");
                pencil.setAttribute("aria-label", pencil.title);
                pencil.innerHTML = `<i class="${this._iconClass("fas fa-pencil", "wx-icon-light-pen")}"></i>`;
                pencil.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._startColumnEdit(headerEl, index);
                });
                headerEl.appendChild(pencil);
            });
            headerEl.addEventListener("mouseleave", () => {
                const pencil = headerEl.querySelector(".wx-board-col-edit");
                if (pencil) {
                    pencil.remove();
                }
            });
        }
    }

    /**
     * Starts inline editing of a column title.
     * @param {HTMLElement} headerEl - The column header element.
     * @param {number} index - The column index.
     */
    _startColumnEdit(headerEl, index) {
        const col = this._columns[index];
        if (!col || this._activeColumnEdit) {
            return;
        }

        this._activeColumnEdit = headerEl;
        const current = col.title ?? col.label ?? "";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "wx-board-col-input";
        input.value = current;

        headerEl.innerHTML = "";
        headerEl.appendChild(input);
        input.focus();
        input.select();

        let done = false;
        const finish = (save) => {
            if (done) {
                return;
            }
            done = true;
            this._activeColumnEdit = null;

            const value = input.value.trim();
            if (save && value && value !== current) {
                col.title = value;
                col.label = value;
                this.render();
                this._dispatchColumnChange();
            } else {
                this.render();
            }
        };

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                finish(true);
            } else if (e.key === "Escape") {
                e.preventDefault();
                finish(false);
            }
        });
        input.addEventListener("blur", () => finish(true));
    }

    /**
     * Deletes a column (and its widgets) and persists the new column layout.
     * @param {number} index - The column index.
     */
    _deleteColumn(index) {
        if (index < 0 || index >= this._columns.length) {
            return;
        }

        this._columns.splice(index, 1);

        this.render();
        this._dispatchColumnChange();
    }

    /**
     * Moves a column to a new position and persists the new column order.
     * @param {number} from - The source column index.
     * @param {number} to - The target column index.
     * @param {boolean} after - Whether to insert after the target.
     */
    _moveColumn(from, to, after) {
        if (from === to || from < 0 || from >= this._columns.length) {
            return;
        }

        const [moved] = this._columns.splice(from, 1);
        let target = from < to ? to - 1 : to;
        if (after) {
            target += 1;
        }
        target = Math.max(0, Math.min(target, this._columns.length));
        this._columns.splice(target, 0, moved);

        this.render();
        this._dispatchColumnChange();
    }

    /**
     * Dispatches a column-layout change so the REST layer can persist it.
     */
    _dispatchColumnChange() {
        const columns = this._columns.map((c) => {
            return { id: c.id, title: c.title ?? c.label ?? "", size: c.size };
        });

        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
            id: this._element ? this._element.id : null,
            action: "columns",
            columns: columns
        });
    }

    /**
     * Builds and returns the DOM element representing a single dashboard widget.
     * @param {Object} widgetData - The widget configuration object.
     * @param {number} colIdx - Index of the column the widget belongs to.
     * @returns {HTMLElement} The constructed widget card element.
     */
    _buildWidgetElement(widgetData, colIdx) {
        const registeredWidget = webexpress.webui.DashboardWidgets.get(widgetData.id) || {};

        const cardEl = document.createElement("div");
        cardEl.className = "card shadow-sm wx-dashboard-widget-card";
        cardEl.dataset.instanceId = widgetData.instanceId;

        if (widgetData.color) {
            cardEl.style.setProperty("--wx-widget-color", widgetData.color);
            cardEl.classList.add("wx-widget-has-color");
        }

        const header = document.createElement("div");
        header.className = "card-header";

        const leftArea = document.createElement("div");
        leftArea.className = "d-flex align-items-center gap-2 overflow-hidden";

        const isWidgetMovable = widgetData.movable !== false && registeredWidget.movable !== false;

        if (isWidgetMovable) {
            const dragHandle = document.createElement("span");
            dragHandle.className = "text-muted wx-drag-handle";
            dragHandle.innerHTML = `<i class="${this._iconClass("fas fa-grip-horizontal", "wx-icon-light-drag")}"></i>`;
            leftArea.appendChild(dragHandle);

            cardEl.setAttribute("draggable", "true");
            cardEl.addEventListener("dragstart", (e) => {
                this._onDragStart(e, widgetData, colIdx);
            });
            cardEl.addEventListener("dragend", (e) => {
                this._onDragEnd(e, cardEl);
            });
        }

        const titleArea = document.createElement("div");
        titleArea.className = "fw-bold text-truncate";

        const imgSrc = widgetData.image;
        const iconCssClass = widgetData.icon || (!imgSrc ? registeredWidget.icon : null);

        if (imgSrc) {
            const img = document.createElement("img");
            img.src = imgSrc;
            img.className = "me-2";
            img.style.maxHeight = "1.2em";
            img.style.width = "auto";
            img.style.verticalAlign = "middle";
            img.alt = "";
            titleArea.appendChild(img);
        } else if (iconCssClass) {
            const icon = document.createElement("i");
            icon.className = `${iconCssClass} me-2 text-muted`;
            titleArea.appendChild(icon);
        }

        const widgetTitle = widgetData.title || registeredWidget.title || "";
        const titleText = document.createElement("span");
        titleText.textContent = widgetTitle;
        titleArea.appendChild(titleText);

        leftArea.appendChild(titleArea);
        header.appendChild(leftArea);

        const rightArea = document.createElement("div");
        rightArea.className = "d-flex gap-2";

        if (widgetData.removable !== false && registeredWidget.removable !== false) {
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "btn wx-button-close";
            removeBtn.setAttribute("aria-label", this._i18n("webexpress.webui:remove", "Remove"));
            removeBtn.innerHTML = `<i class="${this._iconClass("fas fa-times", "wx-icon-light-xmark")}"></i>`;
            removeBtn.addEventListener("click", () => {
                this._removeWidget(colIdx, widgetData.instanceId);
            });
            rightArea.appendChild(removeBtn);
        }

        header.appendChild(rightArea);
        cardEl.appendChild(header);

        const body = document.createElement("div");
        body.className = "card-body overflow-auto";

        if (typeof registeredWidget.render === "function") {
            registeredWidget.render(body, widgetData);
        } else if (widgetData.html) {
            body.innerHTML = widgetData.html;
        } else {
            body.textContent = this._i18n("webexpress.webui:dashboard.widget.unavailable", "Widget content not available.");
        }

        cardEl.appendChild(body);

        // handle drops specifically on this widget
        if (isWidgetMovable) {
            cardEl.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.stopPropagation();

                // calc mouse position to determine top or bottom drop indicator
                const rect = cardEl.getBoundingClientRect();
                const isTopHalf = (e.clientY - rect.top) < (rect.height / 2);

                if (isTopHalf) {
                    cardEl.classList.add("wx-drag-over-top");
                    cardEl.classList.remove("wx-drag-over-bottom");
                } else {
                    cardEl.classList.add("wx-drag-over-bottom");
                    cardEl.classList.remove("wx-drag-over-top");
                }
            });

            cardEl.addEventListener("dragleave", (e) => {
                e.stopPropagation();
                cardEl.classList.remove("wx-drag-over-top", "wx-drag-over-bottom");
            });

            cardEl.addEventListener("drop", (e) => {
                e.stopPropagation();

                // determine if dropped in top or bottom half
                const rect = cardEl.getBoundingClientRect();
                const isTopHalf = (e.clientY - rect.top) < (rect.height / 2);

                this._onDropWidget(e, widgetData, colIdx, cardEl, isTopHalf);
            });
        }

        return cardEl;
    }

    /**
     * Removes a widget from the specified column and re-renders the dashboard.
     * @param {number} colIdx - Index of the column containing the widget.
     * @param {string} instanceId - Unique instance identifier of the widget.
     */
    _removeWidget(colIdx, instanceId) {
        const index = this._columns[colIdx].widgets.findIndex((w) => {
            return w.instanceId === instanceId;
        });
        if (index > -1) {
            this._columns[colIdx].widgets.splice(index, 1);
            this.render();
            this._dispatchChangeEvent("remove");
        }
    }

    /**
     * Handles the drag start event for a widget.
     * Stores the dragged widget reference and applies visual drag indicators.
     * @param {DragEvent} e - The dragstart event.
     * @param {Object} widgetData - The widget being dragged.
     * @param {number} colIdx - Index of the column the widget originates from.
     */
    _onDragStart(e, widgetData, colIdx) {
        this._dragWidget = widgetData;
        this._dragColIndex = colIdx;

        // timeout ensures the drag image doesn't glitch
        setTimeout(() => {
            const el = this._element.querySelector(`[data-instance-id="${widgetData.instanceId}"]`);
            if (el) {
                el.classList.add("opacity-50");
            }
        }, 0);

        try {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", widgetData.instanceId || "");
        } catch (err) {
            // ignore
        }
    }

    /**
     * Handles the drag end event for a widget.
     * Clears drag indicators and resets internal drag state.
     * @param {DragEvent} e - The dragend event.
     * @param {HTMLElement} cardEl - The widget card element.
     */
    _onDragEnd(e, cardEl) {
        cardEl.classList.remove("opacity-50");
        this._dragWidget = null;
        this._dragColIndex = -1;
        this._clearDropTargets();
    }

    /**
     * Handles dropping a widget onto an empty area of a column.
     * The widget is appended to the end of the target column.
     * @param {DragEvent} e - The drop event.
     * @param {number} targetColIdx - Index of the target column.
     * @param {HTMLElement} laneEl - The lane element receiving the drop.
     */
    _onDropLane(e, targetColIdx, laneEl) {
        e.preventDefault();
        this._clearDropTargets();

        if (!this._dragWidget || this._dragColIndex === -1) {
            return;
        }

        const sourceIndex = this._columns[this._dragColIndex].widgets.findIndex((w) => {
            return w.instanceId === this._dragWidget.instanceId;
        });
        if (sourceIndex > -1) {
            const [moved] = this._columns[this._dragColIndex].widgets.splice(sourceIndex, 1);
            this._columns[targetColIdx].widgets.push(moved);

            this.render();
            this._dispatchChangeEvent("reorder");
        }
    }

    /**
     * Handles dropping a widget directly onto another widget.
     * Inserts the dragged widget before or after the target widget,
     * depending on the drop position (top or bottom half).
     * @param {DragEvent} e - The drop event.
     * @param {Object} targetWidget - The widget onto which the drop occurred.
     * @param {number} targetColIdx - Index of the target column.
     * @param {HTMLElement} cardEl - The target widget's card element.
     * @param {boolean} isTopHalf - True if dropped in the upper half of the widget.
     */
    _onDropWidget(e, targetWidget, targetColIdx, cardEl, isTopHalf) {
        e.preventDefault();
        this._clearDropTargets();

        if (!this._dragWidget || this._dragColIndex === -1 || this._dragWidget.instanceId === targetWidget.instanceId) {
            return;
        }

        const sourceIndex = this._columns[this._dragColIndex].widgets.findIndex((w) => {
            return w.instanceId === this._dragWidget.instanceId;
        });
        let targetIndex = this._columns[targetColIdx].widgets.findIndex((w) => {
            return w.instanceId === targetWidget.instanceId;
        });

        if (sourceIndex > -1 && targetIndex > -1) {
            const [moved] = this._columns[this._dragColIndex].widgets.splice(sourceIndex, 1);

            // adjust target index since splicing from the same column shifts indices
            if (this._dragColIndex === targetColIdx && sourceIndex < targetIndex) {
                targetIndex -= 1;
            }

            if (!isTopHalf) {
                targetIndex += 1;
            }

            this._columns[targetColIdx].widgets.splice(targetIndex, 0, moved);

            this.render();
            this._dispatchChangeEvent("reorder");
        }
    }

    /**
     * Clears all visual drop indicators from lanes and widget cards.
     */
    _clearDropTargets() {
        const dropZones = this._element.querySelectorAll(".wx-dashboard-lane, .wx-dashboard-widget-card");
        for (let i = 0; i < dropZones.length; i++) {
            dropZones[i].classList.remove("wx-drag-over-empty", "wx-drag-over-top", "wx-drag-over-bottom");
        }
    }

    /**
     * Dispatches a change event containing the updated dashboard layout.
     * Used to persist layout changes on the server.
     * @param {string} action - The type of change (e.g., "remove", "reorder").
     */
    _dispatchChangeEvent(action) {
        // map the columns array to layout structure for server persistence
        const structure = this._columns.map((col) => {
            return {
                columnId: col.id,
                widgets: col.widgets.map((w) => {
                    return w.id;
                })
            };
        });

        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
            action: action,
            layout: structure
        });
    }
};

// register the class in the webapp controller namespace
webexpress.webui.Controller.registerClass("wx-webui-dashboard", webexpress.webui.DashboardCtrl);