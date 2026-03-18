/**
 * Kanban board control using a dashboard-style CSS grid layout.
 * Supports optional swimlanes, pixel-perfect drag & drop, icons, images, and wx-actions.
 * The following events are triggered:
 * - webexpress.webui.Event.MOVE_EVENT
 */
webexpress.webui.KanbanCtrl = class extends webexpress.webui.Ctrl {

    _columns = [];
    _swimlanes = [];
    _cards = [];

    _dragCard = null;

    /**
     * Initializes the kanban control.
     * @param {HTMLElement} element - The root element for the kanban board.
     */
    constructor(element) {
        super(element);
        element.classList.add("wx-kanban");
        this._parseStaticConfig();
        this.render();
    }

    /**
     * Parses columns, swimlanes, and cards from the static dom attributes.
     */
    _parseStaticConfig() {
        const el = this._element;
        let columns = [];
        let swimlanes = [];
        let cards = [];

        // extract column ids and titles
        let colIds = [];
        let colTitles = [];

        if (el.dataset.columns) {
            colIds = String(el.dataset.columns).split(",").map((s) => s.trim());
        }
        if (el.dataset.columnTitles) {
            colTitles = String(el.dataset.columnTitles).split(",").map((s) => s.trim());
        }

        const maxCols = Math.max(colIds.length, colTitles.length);

        for (let i = 0; i < maxCols; i++) {
            columns.push({
                id: colIds[i] || `col_${i}`,
                label: colTitles[i] || colIds[i] || `Column ${i + 1}`
            });
        }

        // extract swimlanes from dataset
        if (el.dataset.swimlanes) {
            swimlanes = String(el.dataset.swimlanes).split(",").map((s) => {
                return { id: s.trim(), label: s.trim() };
            });
        }

        // apply board template constraints based on columns
        if (columns.length > 0) {
            el.style.setProperty("--wx-board-cols", columns.length);
        }
        
        if (el.dataset.columnSize) {
            const sizes = el.dataset.columnSize.split(",").map((s) => {
                return s.trim() === "*" ? "1fr" : s.trim();
            });
            el.style.setProperty("--wx-board-template", sizes.join(" "));
        }

        // extract card configurations from dom nodes
        const cardNodes = el.querySelectorAll(".wx-kanban-card, [data-card-id]");
        cardNodes.forEach((cardEl, idx) => {
            const cardData = {
                id: cardEl.dataset.cardId || "c_" + idx,
                columnId: cardEl.dataset.columnId || null,
                swimlaneId: cardEl.dataset.swimlaneId || null,
                label: cardEl.dataset.label || cardEl.querySelector(".card-title")?.textContent || "",
                html: cardEl.dataset.html || cardEl.querySelector(".card-text")?.innerHTML || cardEl.innerHTML,
                colorCss: cardEl.dataset.colorCss || "",
                icon: cardEl.dataset.icon || null,
                image: cardEl.dataset.image || null,
                
                // primary actions
                primaryAction: {
                    action: cardEl.dataset.wxPrimaryAction || null,
                    target: cardEl.dataset.wxPrimaryTarget || null,
                    uri: cardEl.dataset.wxPrimaryUri || null,
                    size: cardEl.dataset.wxPrimarySize || null
                },

                // secondary actions
                secondaryAction: {
                    action: cardEl.dataset.wxSecondaryAction || null,
                    target: cardEl.dataset.wxSecondaryTarget || null,
                    uri: cardEl.dataset.wxSecondaryUri || null,
                    size: cardEl.dataset.wxSecondarySize || null
                }
            };
            cards.push(cardData);
        });

        this._columns = columns;
        this._swimlanes = swimlanes;
        this._cards = cards;
    }

    /**
     * Renders the kanban board structure based on the internal state.
     */
    render() {
        const el = this._element;
        el.innerHTML = "";

        const hasSwimlanes = this._swimlanes.length > 0;

        // render global column headers at the top if swimlanes are active
        if (hasSwimlanes) {
            const headerRow = document.createElement("div");
            headerRow.className = "wx-kanban-row wx-kanban-headers";
            
            for (let c = 0; c < this._columns.length; c++) {
                const header = document.createElement("div");
                header.className = "wx-kanban-column-header";
                header.textContent = this._columns[c].label;
                headerRow.appendChild(header);
            }
            
            el.appendChild(headerRow);
        }

        const swimlanesToRender = hasSwimlanes ? this._swimlanes : [{ id: null, label: "" }];

        for (let s = 0; s < swimlanesToRender.length; s++) {
            const lane = swimlanesToRender[s];
            const laneWrapper = document.createElement("div");
            laneWrapper.className = "wx-kanban-swimlane";

            // render swimlane title if swimlanes are configured
            if (hasSwimlanes) {
                const laneTitle = document.createElement("h5");
                laneTitle.className = "wx-kanban-swimlane-title";
                laneTitle.textContent = lane.label;
                laneWrapper.appendChild(laneTitle);
            }

            // create the grid row for the drop zones
            const row = document.createElement("div");
            row.className = "wx-kanban-row";

            for (let c = 0; c < this._columns.length; c++) {
                const col = this._columns[c];
                const colWrapper = document.createElement("div");

                // integrate header directly into the column if no swimlanes are active
                if (!hasSwimlanes) {
                    const header = document.createElement("div");
                    header.className = "wx-kanban-column-header";
                    header.style.marginBottom = "0.75rem";
                    header.textContent = col.label;
                    colWrapper.appendChild(header);
                }

                const cell = document.createElement("div");
                cell.className = "wx-kanban-cell";
                cell.dataset.colId = col.id;
                
                if (lane.id) {
                    cell.dataset.swimlaneId = lane.id;
                }

                // cell drop events for completely empty areas
                cell.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    if (cell.children.length === 0) {
                        cell.classList.add("wx-drag-over-empty");
                    } else {
                        // highlight below the last card if dropping in empty space
                        const lastCard = cell.lastElementChild;
                        if (lastCard && !lastCard.classList.contains("wx-drag-over-top")) {
                            lastCard.classList.add("wx-drag-over-bottom");
                        }
                    }
                });
                
                cell.addEventListener("dragleave", (e) => {
                    cell.classList.remove("wx-drag-over-empty");
                    const lastCard = cell.lastElementChild;
                    if (lastCard) {
                        lastCard.classList.remove("wx-drag-over-bottom");
                    }
                });
                
                cell.addEventListener("drop", (e) => {
                    this._onDropCell(e, col.id, lane.id, cell);
                });

                // filter and render cards belonging to this cell
                const cellCards = this._cards.filter((card) => {
                    return card.columnId === col.id && (hasSwimlanes ? card.swimlaneId === lane.id : true);
                });
                
                for (let k = 0; k < cellCards.length; k++) {
                    const cardEl = this._buildCardElement(cellCards[k], col.id, lane.id);
                    cell.appendChild(cardEl);
                }

                colWrapper.appendChild(cell);
                row.appendChild(colWrapper);
            }
            laneWrapper.appendChild(row);
            el.appendChild(laneWrapper);
        }
    }

    /**
     * Builds the dom element for a single card.
     * @param {Object} card - The card data object.
     * @param {string} colId - The column id.
     * @param {string} swimlaneId - The swimlane id.
     * @returns {HTMLElement} - The fully constructed card element.
     */
    _buildCardElement(card, colId, swimlaneId) {
        const cardEl = document.createElement("div");
        cardEl.className = "wx-kanban-card";
        cardEl.dataset.cardId = card.id;
        cardEl.setAttribute("draggable", "true");

        // apply primary actions to DOM element
        if (card.primaryAction && card.primaryAction.action) {
            for (const [key, value] of Object.entries(card.primaryAction)) {
                if (value) {
                    cardEl.setAttribute(`data-wx-primary-${key.toLowerCase()}`, value);
                }
            }
        }

        // apply secondary actions to DOM element
        if (card.secondaryAction && card.secondaryAction.action) {
            for (const [key, value] of Object.entries(card.secondaryAction)) {
                if (value) {
                    cardEl.setAttribute(`data-wx-secondary-${key.toLowerCase()}`, value);
                }
            }
        }

        // map bootstrap colors to hex for the top border highlight
        const colorCss = card.colorCss || "";
        let colorHex = "transparent";
        
        if (colorCss.includes("success")) {
            colorHex = "#198754";
        } else if (colorCss.includes("warning")) {
            colorHex = "#ffc107";
        } else if (colorCss.includes("danger")) {
            colorHex = "#dc3545";
        } else if (colorCss.includes("info")) {
            colorHex = "#0d6efd";
        }
        
        cardEl.style.setProperty("--kanban-color", colorHex);

        // build card header (icon/image + title)
        const header = document.createElement("div");
        header.className = "card-header";

        if (card.image) {
            const img = document.createElement("img");
            img.src = card.image;
            img.className = "card-image";
            header.appendChild(img);
        } else if (card.icon) {
            const iconWrapper = document.createElement("div");
            iconWrapper.className = "card-icon";
            const icon = document.createElement("i");
            icon.className = card.icon;
            iconWrapper.appendChild(icon);
            header.appendChild(iconWrapper);
        }

        const title = document.createElement("div");
        title.className = "card-title";
        title.textContent = card.label;
        header.appendChild(title);
        
        cardEl.appendChild(header);

        // build card content
        if (card.html) {
            const content = document.createElement("div");
            content.className = "card-text";
            content.innerHTML = card.html;
            cardEl.appendChild(content);
        }

        // drag events
        cardEl.addEventListener("dragstart", (e) => {
            this._dragCard = card;
            setTimeout(() => {
                cardEl.classList.add("wx-dragging");
            }, 0);
            try {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", card.id || "");
            } catch (err) {
                // ignore data transfer errors on unsupported browsers
            }
        });

        cardEl.addEventListener("dragend", (e) => {
            cardEl.classList.remove("wx-dragging");
            this._dragCard = null;
            this._clearDropTargets();
        });

        cardEl.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation(); // prevent bubbling to the cell
            
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
            const rect = cardEl.getBoundingClientRect();
            const isTopHalf = (e.clientY - rect.top) < (rect.height / 2);
            this._onDropWidget(e, card, colId, swimlaneId, isTopHalf);
        });

        return cardEl;
    }

    /**
     * Handles dropping a card directly into an empty cell area.
     */
    _onDropCell(e, colId, swimlaneId, cell) {
        e.preventDefault();
        this._clearDropTargets();

        if (!this._dragCard) {
            return;
        }

        const sourceIndex = this._cards.findIndex((c) => {
            return c.id === this._dragCard.id;
        });
        
        if (sourceIndex > -1) {
            const oldColId = this._dragCard.columnId;
            const oldSwimlaneId = this._dragCard.swimlaneId;
            
            const [moved] = this._cards.splice(sourceIndex, 1);
            moved.columnId = colId;
            moved.swimlaneId = swimlaneId;
            
            // append card at the end of the array
            this._cards.push(moved);
            
            this._dispatchMoveEvent(moved, oldColId, oldSwimlaneId, colId, swimlaneId, this._cards.length - 1);
            this.render();
        }
    }

    /**
     * Handles dropping a card onto another existing card to reorder.
     */
    _onDropWidget(e, targetCard, colId, swimlaneId, isTopHalf) {
        e.preventDefault();
        this._clearDropTargets();

        if (!this._dragCard || this._dragCard.id === targetCard.id) {
            return;
        }

        const sourceIndex = this._cards.findIndex((c) => {
            return c.id === this._dragCard.id;
        });
        
        if (sourceIndex > -1) {
            const oldColId = this._dragCard.columnId;
            const oldSwimlaneId = this._dragCard.swimlaneId;
            
            const [moved] = this._cards.splice(sourceIndex, 1);
            moved.columnId = colId;
            moved.swimlaneId = swimlaneId;

            // find the new target index based on the modified array
            let targetIndex = this._cards.findIndex((c) => {
                return c.id === targetCard.id;
            });
            
            if (!isTopHalf) {
                targetIndex += 1;
            }

            this._cards.splice(targetIndex, 0, moved);
            
            this._dispatchMoveEvent(moved, oldColId, oldSwimlaneId, colId, swimlaneId, targetIndex);
            this.render();
        }
    }

    /**
     * Clears visual highlighting from all drop zones.
     */
    _clearDropTargets() {
        const dropZones = this._element.querySelectorAll(".wx-kanban-cell, .wx-kanban-card");
        dropZones.forEach((el) => {
            el.classList.remove("wx-drag-over-empty", "wx-drag-over-top", "wx-drag-over-bottom");
        });
    }

    /**
     * Dispatches custom events when a card is moved.
     */
    _dispatchMoveEvent(card, oldColId, oldSwimlaneId, newColId, newSwimlaneId, newIndex) {        
        const layout = this._cards.map((c) => {
            return {
                id: c.id,
                columnId: c.columnId,
                swimlaneId: c.swimlaneId
            };
        });

        this._dispatch(webexpress.webui.Event.MOVE_EVENT, {
            cardId: card.id,
            oldColumnId: oldColId,
            oldSwimlaneId: oldSwimlaneId,
            columnId: newColId,
            swimlaneId: newSwimlaneId,
            index: newIndex,
            layout: layout
        });
    }
};

webexpress.webui.Controller.registerClass("wx-webui-kanban", webexpress.webui.KanbanCtrl);