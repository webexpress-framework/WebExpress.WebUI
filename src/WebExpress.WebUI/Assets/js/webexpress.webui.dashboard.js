/**
 * Core Dashboard control that handles independent vertical columns (lanes).
 * Columns can have optional titles and custom width sizes (e.g., 25%, 50%, *).
 * Widgets are stacked independently inside their respective columns.
 */
webexpress.webui.DashboardCtrl = class extends webexpress.webui.Ctrl {

    // model state: array of column objects { title: string, widgets: [] }
    _columns = [];
    _isMovable = true;
    _boardCols = 3; // default number of vertical lanes
    _boardTemplate = null; // custom grid template columns string
    
    // drag state
    _dragWidget = null;
    _dragColIndex = -1;

    /**
     * Initializes the dashboard control.
     * @param {HTMLElement} element - The root element for the dashboard.
     */
    constructor(element) {
        super(element);

        element.classList.add("wx-dashboard");
        
        if (element.dataset.movable === "false") {
            this._isMovable = false;
        }

        // parse custom column sizes (e.g. "25%, 50%, *")
        if (element.dataset.columnSize) {
            const sizes = element.dataset.columnSize.split(",").map(s => {
                let size = s.trim();
                return size === "*" ? "1fr" : size;
            });
            
            if (sizes.length > 0) {
                this._boardCols = sizes.length;
                this._boardTemplate = sizes.join(" ");
            }
        } else if (element.dataset.columns) {
            // fallback to equal width columns
            this._boardCols = parseInt(element.dataset.columns, 10) || 3;
        }

        // read optional column titles (comma separated)
        const titlesAttr = element.dataset.columnTitles || "";
        const titles = titlesAttr.split(",").map(s => s.trim());

        // initialize columns with optional titles
        this._columns = Array.from({ length: this._boardCols }, (_, i) => {
            return {
                title: titles[i] || null,
                widgets: []
            };
        });

        this._parseStaticWidgets();
        this.render();
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
                    "label", "icon", "image", "column"
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
                    label: dataset.label || null,
                    icon: dataset.icon || null,
                    image: dataset.image || null,
                    color: dataset.color || null,
                    removable: dataset.closeable !== "false",
                    movable: dataset.movable !== "false",
                    html: htmlContent,
                    params: params
                };
                
                // assign to specified column or distribute evenly
                let targetCol = dataset.column !== undefined ? parseInt(dataset.column, 10) : (parseIndex % this._boardCols);
                targetCol = Math.max(0, Math.min(targetCol, this._boardCols - 1));
                
                this._columns[targetCol].widgets.push(widgetData);
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
        
        // apply columns or custom template
        row.style.setProperty("--wx-board-cols", this._boardCols);
        if (this._boardTemplate) {
            row.style.setProperty("--wx-board-template", this._boardTemplate);
        }

        for (let colIdx = 0; colIdx < this._boardCols; colIdx++) {
            const colData = this._columns[colIdx];

            // Create a wrapper for the title and the lane
            const wrapperEl = document.createElement("div");
            wrapperEl.className = "wx-dashboard-lane-wrapper";

            // Append title if it exists
            if (colData.title) {
                const titleEl = document.createElement("h5");
                titleEl.className = "wx-dashboard-lane-title";
                titleEl.textContent = colData.title;
                wrapperEl.appendChild(titleEl);
            }

            // Create the actual drop zone lane
            const laneEl = document.createElement("div");
            laneEl.className = "wx-dashboard-lane";
            laneEl.dataset.columnIndex = colIdx;

            // handle dropping into the general area of the lane
            if (this._isMovable) {
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

            // append all widgets for this column
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
     * Builds the DOM element for a single dashboard widget.
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
        
        const isWidgetMovable = this._isMovable && widgetData.movable !== false && registeredWidget.movable !== false;

        if (isWidgetMovable) {
            const dragHandle = document.createElement("span");
            dragHandle.className = "text-muted wx-drag-handle";
            dragHandle.innerHTML = '<i class="fas fa-grip-horizontal"></i>';
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
        
        const widgetLabel = widgetData.label || registeredWidget.title || "";
        const titleText = document.createElement("span");
        titleText.textContent = widgetLabel;
        titleArea.appendChild(titleText);
        
        leftArea.appendChild(titleArea);
        header.appendChild(leftArea);

        const rightArea = document.createElement("div");
        rightArea.className = "d-flex gap-2";

        if (widgetData.removable !== false && registeredWidget.removable !== false) {
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "btn-close btn-close-sm";
            removeBtn.setAttribute("aria-label", "Remove");
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
            body.textContent = "Widget content not available.";
        }
        
        cardEl.appendChild(body);

        // handle drops specifically on this widget
        if (this._isMovable) {
            cardEl.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.stopPropagation(); // prevent lane events
                
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

    _removeWidget(colIdx, instanceId) {
        const index = this._columns[colIdx].widgets.findIndex(w => w.instanceId === instanceId);
        if (index > -1) {
            this._columns[colIdx].widgets.splice(index, 1);
            this.render();
            this._dispatchChangeEvent("remove");
        }
    }

    _onDragStart(e, widgetData, colIdx) {
        this._dragWidget = widgetData;
        this._dragColIndex = colIdx;
        
        // timeout ensures the drag image doesn't glitch when setting opacity immediately
        setTimeout(() => {
            const el = this._element.querySelector(`[data-instance-id="${widgetData.instanceId}"]`);
            if(el) el.classList.add("opacity-50");
        }, 0);
        
        try {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", widgetData.instanceId || "");
        } catch (err) {}
    }

    _onDragEnd(e, cardEl) {
        cardEl.classList.remove("opacity-50");
        this._dragWidget = null;
        this._dragColIndex = -1;
        this._clearDropTargets();
    }

    /**
     * Handles drop on the lane background (appends to the column).
     */
    _onDropLane(e, targetColIdx, laneEl) {
        e.preventDefault();
        this._clearDropTargets();

        if (!this._dragWidget || this._dragColIndex === -1) return;

        const sourceIndex = this._columns[this._dragColIndex].widgets.findIndex(w => w.instanceId === this._dragWidget.instanceId);
        if (sourceIndex > -1) {
            const [moved] = this._columns[this._dragColIndex].widgets.splice(sourceIndex, 1);
            // always append at the end of the lane
            this._columns[targetColIdx].widgets.push(moved);
            
            this.render();
            this._dispatchChangeEvent("reorder");
        }
    }

    /**
     * Handles drop directly onto another widget (inserts before or after).
     */
    _onDropWidget(e, targetWidget, targetColIdx, cardEl, isTopHalf) {
        e.preventDefault();
        this._clearDropTargets();

        if (!this._dragWidget || this._dragColIndex === -1 || this._dragWidget.instanceId === targetWidget.instanceId) {
            return;
        }

        const sourceIndex = this._columns[this._dragColIndex].widgets.findIndex(w => w.instanceId === this._dragWidget.instanceId);
        let targetIndex = this._columns[targetColIdx].widgets.findIndex(w => w.instanceId === targetWidget.instanceId);

        if (sourceIndex > -1 && targetIndex > -1) {
            const [moved] = this._columns[this._dragColIndex].widgets.splice(sourceIndex, 1);
            
            // adjust target index since splicing from the SAME column shifts indices
            if (this._dragColIndex === targetColIdx && sourceIndex < targetIndex) {
                targetIndex -= 1;
            }
            
            // if dropping on the bottom half, insert AFTER the target widget
            if (!isTopHalf) {
                targetIndex += 1;
            }
            
            this._columns[targetColIdx].widgets.splice(targetIndex, 0, moved);
            
            this.render();
            this._dispatchChangeEvent("reorder");
        }
    }

    _clearDropTargets() {
        const dropZones = this._element.querySelectorAll(".wx-dashboard-lane, .wx-dashboard-widget-card");
        for (let i = 0; i < dropZones.length; i++) {
            dropZones[i].classList.remove("wx-drag-over-empty", "wx-drag-over-top", "wx-drag-over-bottom");
        }
    }

    _dispatchChangeEvent(action) {
        const evRoot = webexpress?.webui?.Event;
        const eventName = (evRoot && evRoot.CHANGE_VALUE_EVENT) ? evRoot.CHANGE_VALUE_EVENT : "webexpress.webui.change.value";
        
        // simplify structure for persistence: returns array of columns containing widget IDs
        const structure = this._columns.map(col => col.widgets.map(w => w.id));

        this._dispatch(eventName, {
            detail: {
                id: this._element.id,
                action: action,
                layout: structure
            }
        });
    }
};

webexpress.webui.Controller.registerClass("wx-webui-dashboard", webexpress.webui.DashboardCtrl);