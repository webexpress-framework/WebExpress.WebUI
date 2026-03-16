/**
 * Core Kanban control that handles the visual grid, cards, and drag & drop operations.
 * Supports configurable columns and horizontal swimlanes with custom colors.
 * Triggers a move event when a card is dropped into a new cell.
 */
webexpress.webui.KanbanCtrl = class extends webexpress.webui.Ctrl {

    // model state
    _columns = [];
    _swimlanes = [];
    _cards = [];

    // drag state
    _dragCard = null;

    /**
     * Initializes the Kanban control.
     * @param {HTMLElement} element The root element for the kanban board.
     */
    constructor(element) {
        super(element);
        
        element.classList.add("wx-kanban");
        element.style.overflowX = "auto";
        
        this.render();
    }

    /**
     * Renders the complete kanban board based on the current model state.
     */
    render() {
        const el = this._element;
        el.innerHTML = "";

        const table = document.createElement("table");
        table.className = "table table-bordered wx-kanban-table";
        table.style.tableLayout = "fixed";
        table.style.width = "100%";
        table.style.minWidth = "800px";

        const hasSwimlanes = this._swimlanes && this._swimlanes.length > 0;

        // build thead
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        if (hasSwimlanes) {
            const emptyTh = document.createElement("th");
            emptyTh.style.width = "150px";
            emptyTh.className = "bg-light";
            headerRow.appendChild(emptyTh);
        }

        for (let i = 0; i < this._columns.length; i++) {
            const col = this._columns[i];
            const th = document.createElement("th");
            th.textContent = col.label || col.id;
            
            // apply column color configurations
            if (col.colorCss) {
                th.classList.add(...col.colorCss.split(/\s+/).filter(Boolean));
            } else {
                th.classList.add("bg-light");
            }
            if (col.colorStyle) {
                th.style.cssText = col.colorStyle;
            }
            
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // build tbody
        const tbody = document.createElement("tbody");
        const swimlanesToRender = hasSwimlanes ? this._swimlanes : [{ id: null, label: "" }];

        for (let i = 0; i < swimlanesToRender.length; i++) {
            const lane = swimlanesToRender[i];
            const row = document.createElement("tr");

            // render swimlane header if applicable
            if (hasSwimlanes) {
                const th = document.createElement("th");
                th.textContent = lane.label || lane.id;
                
                if (lane.colorCss) {
                    th.classList.add(...lane.colorCss.split(/\s+/).filter(Boolean));
                } else {
                    th.classList.add("bg-light");
                }
                if (lane.colorStyle) {
                    th.style.cssText = lane.colorStyle;
                }
                row.appendChild(th);
            }

            // render cells for each column
            for (let j = 0; j < this._columns.length; j++) {
                const col = this._columns[j];
                const td = document.createElement("td");
                td.className = "wx-kanban-cell";
                td.style.verticalAlign = "top";
                td.style.minHeight = "120px";
                
                if (col.id) {
                    td.dataset.colId = col.id;
                }
                if (lane.id) {
                    td.dataset.swimlaneId = lane.id;
                }

                // attach drop zone events
                td.addEventListener("dragover", (e) => {
                    this._onDragOver(e, td);
                });
                td.addEventListener("dragleave", (e) => {
                    this._onDragLeave(e, td);
                });
                td.addEventListener("drop", (e) => {
                    this._onDrop(e, col.id, lane.id, td);
                });

                // populate cards belonging to this cell
                for (let k = 0; k < this._cards.length; k++) {
                    const card = this._cards[k];
                    const matchCol = card.columnId === col.id;
                    const matchLane = (!hasSwimlanes) || (card.swimlaneId === lane.id);

                    if (matchCol && matchLane) {
                        const cardEl = this._buildCardElement(card);
                        td.appendChild(cardEl);
                    }
                }

                row.appendChild(td);
            }
            tbody.appendChild(row);
        }

        table.appendChild(tbody);
        el.appendChild(table);
    }

    /**
     * Updates the internal model for columns, swimlanes and cards.
     * @param {Object} data The configuration data.
     */
    updateData(data) {
        if (!data) {
            return;
        }

        if (Array.isArray(data.columns)) {
            this._columns = data.columns;
        }
        if (Array.isArray(data.swimlanes)) {
            this._swimlanes = data.swimlanes;
        }
        if (Array.isArray(data.items)) {
            this._cards = data.items;
        }

        this.render();
    }

    /**
     * Builds the DOM element for a single card.
     * @param {Object} card The card data object.
     * @returns {HTMLElement} The card element.
     */
    _buildCardElement(card) {
        const cardEl = document.createElement("div");
        cardEl.className = "wx-kanban-card card mb-2 shadow-sm";
        cardEl.setAttribute("draggable", "true");
        
        if (card.colorCss) {
            cardEl.classList.add(...card.colorCss.split(/\s+/).filter(Boolean));
        }
        if (card.colorStyle) {
            cardEl.style.cssText = card.colorStyle;
        }

        const body = document.createElement("div");
        body.className = "card-body p-2";
        
        if (card.label) {
            const title = document.createElement("h6");
            title.className = "card-title mb-1";
            title.textContent = card.label;
            body.appendChild(title);
        }
        
        if (card.html) {
            const content = document.createElement("div");
            content.className = "card-text small";
            content.innerHTML = card.html;
            body.appendChild(content);
        }

        cardEl.appendChild(body);

        // attach drag events
        cardEl.addEventListener("dragstart", (e) => {
            this._onDragStart(e, card, cardEl);
        });
        cardEl.addEventListener("dragend", (e) => {
            this._onDragEnd(e, cardEl);
        });

        return cardEl;
    }

    /**
     * Handles the start of a drag operation.
     * @param {DragEvent} e The drag event.
     * @param {Object} card The card model.
     * @param {HTMLElement} cardEl The card DOM element.
     */
    _onDragStart(e, card, cardEl) {
        this._dragCard = card;
        cardEl.classList.add("wx-dragging");
        cardEl.style.opacity = "0.5";
        
        try {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", card.id || "");
        } catch (err) {
            // ignore data transfer errors
        }
    }

    /**
     * Handles the end of a drag operation.
     * @param {DragEvent} e The drag event.
     * @param {HTMLElement} cardEl The card DOM element.
     */
    _onDragEnd(e, cardEl) {
        cardEl.classList.remove("wx-dragging");
        cardEl.style.opacity = "1";
        this._dragCard = null;
        this._clearDropTargets();
    }

    /**
     * Handles dragging over a target cell.
     * @param {DragEvent} e The drag event.
     * @param {HTMLElement} cell The target cell.
     */
    _onDragOver(e, cell) {
        if (!this._dragCard) {
            return;
        }
        e.preventDefault();
        cell.classList.add("bg-secondary", "bg-opacity-10");
    }

    /**
     * Handles the pointer leaving a drop target.
     * @param {DragEvent} e The drag event.
     * @param {HTMLElement} cell The target cell.
     */
    _onDragLeave(e, cell) {
        cell.classList.remove("bg-secondary", "bg-opacity-10");
    }

    /**
     * Handles dropping a card into a new cell.
     * @param {DragEvent} e The drag event.
     * @param {string} colId The target column id.
     * @param {string} swimlaneId The target swimlane id.
     * @param {HTMLElement} cell The target cell.
     */
    _onDrop(e, colId, swimlaneId, cell) {
        e.preventDefault();
        cell.classList.remove("bg-secondary", "bg-opacity-10");

        if (!this._dragCard) {
            return;
        }

        const oldColId = this._dragCard.columnId;
        const oldSwimlaneId = this._dragCard.swimlaneId;

        // only process if position changed
        if (oldColId !== colId || oldSwimlaneId !== swimlaneId) {
            this._dragCard.columnId = colId;
            this._dragCard.swimlaneId = swimlaneId;

            this._dispatchMoveEvent(this._dragCard.id, colId, swimlaneId);
            this.render();
        }
        
        this._dragCard = null;
    }

    /**
     * Clears visual highlighting from all cells.
     */
    _clearDropTargets() {
        const cells = this._element.querySelectorAll(".wx-kanban-cell");
        for (let i = 0; i < cells.length; i++) {
            cells[i].classList.remove("bg-secondary", "bg-opacity-10");
        }
    }

    /**
     * Dispatches a custom move event for integration components.
     * @param {string} cardId The moved card id.
     * @param {string} colId The new column id.
     * @param {string} swimlaneId The new swimlane id.
     */
    _dispatchMoveEvent(cardId, colId, swimlaneId) {
        const evRoot = webexpress?.webui?.Event;
        const eventName = (evRoot && evRoot.MOVE_EVENT) ? evRoot.MOVE_EVENT : "webexpress.webui.move";
        
        this._dispatch(eventName, {
            detail: {
                id: this._element.id,
                cardId: cardId,
                columnId: colId,
                swimlaneId: swimlaneId
            }
        });
    }
};

// register the base class in the controller
webexpress.webui.Controller.registerClass("wx-webui-kanban", webexpress.webui.KanbanCtrl);