/**
 * Core Dashboard control that handles the visual grid layout, rendering of widgets,
 * and drag-and-drop reordering. Uses a 12-column grid system logic.
 * Triggers events on moving or removing widgets.
 */
webexpress.webui.DashboardCtrl = class extends webexpress.webui.Ctrl {

    // model state
    _widgets = [];
    _isMovable = true;
    
    // drag state
    _dragWidget = null;
    _dragElement = null;

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

        this.render();
    }

    /**
     * Renders the complete dashboard based on the current widget list.
     */
    render() {
        const el = this._element;
        el.innerHTML = "";

        const row = document.createElement("div");
        row.className = "row g-3 wx-dashboard-row";

        for (let i = 0; i < this._widgets.length; i++) {
            const widget = this._widgets[i];
            const col = this._buildWidgetElement(widget);
            row.appendChild(col);
        }

        el.appendChild(row);
    }

    /**
     * Updates the internal model for widgets and re-renders the dashboard.
     * @param {Object} data - The configuration data containing widgets.
     */
    updateData(data) {
        if (!data) {
            return;
        }

        if (Array.isArray(data.widgets)) {
            this._widgets = data.widgets;
        } else if (Array.isArray(data.items)) {
            this._widgets = data.items;
        }

        this.render();
    }

    /**
     * Builds the DOM element for a single dashboard widget.
     * @param {Object} widget - The widget data object.
     * @returns {HTMLElement} The column element containing the widget card.
     */
    _buildWidgetElement(widget) {
        const colWidth = widget.width || 4; // default to 4 of 12 columns
        const colEl = document.createElement("div");
        colEl.className = `col-12 col-md-${colWidth} wx-dashboard-col`;
        colEl.dataset.widgetId = widget.id;

        const cardEl = document.createElement("div");
        cardEl.className = "card h-100 shadow-sm wx-dashboard-widget";
        
        // build header
        const header = document.createElement("div");
        header.className = "card-header d-flex justify-content-between align-items-center bg-white";
        
        const titleArea = document.createElement("div");
        titleArea.className = "fw-bold text-truncate";
        
        if (widget.icon) {
            const icon = document.createElement("i");
            icon.className = `${widget.icon} me-2 text-muted`;
            titleArea.appendChild(icon);
        }
        
        const titleText = document.createElement("span");
        titleText.textContent = widget.title || "";
        titleArea.appendChild(titleText);
        header.appendChild(titleArea);

        // build controls area (drag handle, remove button)
        const controls = document.createElement("div");
        controls.className = "d-flex gap-2";

        if (this._isMovable) {
            const dragHandle = document.createElement("span");
            dragHandle.className = "text-muted wx-drag-handle";
            dragHandle.style.cursor = "grab";
            dragHandle.innerHTML = '<i class="fas fa-grip-horizontal"></i>';
            controls.appendChild(dragHandle);

            // enable drag and drop on the whole card but indicate grab on handle
            cardEl.setAttribute("draggable", "true");
            cardEl.addEventListener("dragstart", (e) => {
                this._onDragStart(e, widget, colEl);
            });
            cardEl.addEventListener("dragend", (e) => {
                this._onDragEnd(e, colEl);
            });
        }

        if (widget.removable !== false) {
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "btn-close btn-close-sm";
            removeBtn.setAttribute("aria-label", "Remove");
            removeBtn.addEventListener("click", () => {
                this._removeWidget(widget.id);
            });
            controls.appendChild(removeBtn);
        }

        header.appendChild(controls);
        cardEl.appendChild(header);

        // build body
        const body = document.createElement("div");
        body.className = "card-body overflow-auto";
        if (widget.html) {
            body.innerHTML = widget.html;
        }
        cardEl.appendChild(body);

        // handle drop events on the column container
        if (this._isMovable) {
            colEl.addEventListener("dragover", (e) => {
                this._onDragOver(e, colEl);
            });
            colEl.addEventListener("dragleave", (e) => {
                this._onDragLeave(e, colEl);
            });
            colEl.addEventListener("drop", (e) => {
                this._onDrop(e, widget, colEl);
            });
        }

        colEl.appendChild(cardEl);
        return colEl;
    }

    /**
     * Removes a widget from the dashboard.
     * @param {string} widgetId - The id of the widget to remove.
     */
    _removeWidget(widgetId) {
        const index = this._widgets.findIndex((w) => {
            return w.id === widgetId;
        });
        
        if (index > -1) {
            this._widgets.splice(index, 1);
            this.render();
            this._dispatchChangeEvent("remove");
        }
    }

    /**
     * Handles the start of a drag operation.
     * @param {DragEvent} e - The drag event.
     * @param {Object} widget - The widget model.
     * @param {HTMLElement} colEl - The column DOM element.
     */
    _onDragStart(e, widget, colEl) {
        this._dragWidget = widget;
        this._dragElement = colEl;
        colEl.classList.add("opacity-50");
        
        try {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", widget.id || "");
        } catch (err) {
            // ignore data transfer errors on unsupported browsers
        }
    }

    /**
     * Handles the end of a drag operation.
     * @param {DragEvent} e - The drag event.
     * @param {HTMLElement} colEl - The column DOM element.
     */
    _onDragEnd(e, colEl) {
        colEl.classList.remove("opacity-50");
        this._dragWidget = null;
        this._dragElement = null;
        this._clearDropTargets();
    }

    /**
     * Handles dragging over a target column.
     * @param {DragEvent} e - The drag event.
     * @param {HTMLElement} targetCol - The target column.
     */
    _onDragOver(e, targetCol) {
        if (!this._dragWidget || this._dragElement === targetCol) {
            return;
        }
        e.preventDefault();
        targetCol.classList.add("border-primary", "border", "border-2", "rounded");
    }

    /**
     * Handles the pointer leaving a drop target.
     * @param {DragEvent} e - The drag event.
     * @param {HTMLElement} targetCol - The target column.
     */
    _onDragLeave(e, targetCol) {
        targetCol.classList.remove("border-primary", "border", "border-2", "rounded");
    }

    /**
     * Handles dropping a widget onto another to reorder them.
     * @param {DragEvent} e - The drag event.
     * @param {Object} targetWidget - The target widget model.
     * @param {HTMLElement} targetCol - The target column element.
     */
    _onDrop(e, targetWidget, targetCol) {
        e.preventDefault();
        targetCol.classList.remove("border-primary", "border", "border-2", "rounded");

        if (!this._dragWidget || this._dragWidget.id === targetWidget.id) {
            return;
        }

        const sourceIndex = this._widgets.findIndex((w) => {
            return w.id === this._dragWidget.id;
        });
        const targetIndex = this._widgets.findIndex((w) => {
            return w.id === targetWidget.id;
        });

        if (sourceIndex > -1 && targetIndex > -1) {
            // remove from old position
            const [moved] = this._widgets.splice(sourceIndex, 1);
            // insert at new position
            this._widgets.splice(targetIndex, 0, moved);
            
            this.render();
            this._dispatchChangeEvent("reorder");
        }
    }

    /**
     * Clears visual highlighting from all columns.
     */
    _clearDropTargets() {
        const cols = this._element.querySelectorAll(".wx-dashboard-col");
        for (let i = 0; i < cols.length; i++) {
            cols[i].classList.remove("border-primary", "border", "border-2", "rounded");
        }
    }

    /**
     * Dispatches a custom event indicating the dashboard configuration changed.
     * @param {string} action - The action type (e.g., 'reorder', 'remove').
     */
    _dispatchChangeEvent(action) {
        const evRoot = webexpress?.webui?.Event;
        const eventName = (evRoot && evRoot.CHANGE_VALUE_EVENT) ? evRoot.CHANGE_VALUE_EVENT : "webexpress.webui.change.value";
        
        const widgetOrder = [];
        for (let i = 0; i < this._widgets.length; i++) {
            widgetOrder.push(this._widgets[i].id);
        }

        this._dispatch(eventName, {
            detail: {
                id: this._element.id,
                action: action,
                order: widgetOrder
            }
        });
    }
};

// register the base class in the controller system
webexpress.webui.Controller.registerClass("wx-webui-dashboard", webexpress.webui.DashboardCtrl);