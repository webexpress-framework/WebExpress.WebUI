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

    // column header editing / reordering / deleting
    _editableColumn = false;
    _movableColumn = false;
    _deletableColumn = false;
    _dragColumnIndex = null;
    _activeColumnEdit = null;

    /**
     * Initializes the kanban control.
     * @param {HTMLElement} element - The root element for the kanban board.
     */
    constructor(element) {
        super(element);
        element.classList.add("wx-kanban");

        // column capabilities (the REST host element carries these attributes,
        // so they apply to both the dom-driven and the rest-driven path)
        this._editableColumn = element.dataset.editableColumn === "true";
        this._movableColumn = element.dataset.movableColumn === "true";
        this._deletableColumn = element.dataset.deletableColumn === "true";

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

        // extract columns from elements or dataset
        const columnNodes = el.querySelectorAll(".wx-column");
        if (columnNodes.length > 0) {
            columnNodes.forEach((node) => {
                columns.push({
                    id: node.id || node.dataset.id,
                    label: node.dataset.label || node.id || "column",
                    size: node.dataset.size || "1fr"
                });
            });
        } else {
            let colIds = [];
            let colTitles = [];

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

            const maxCols = Math.max(colIds.length, colTitles.length);

            for (let i = 0; i < maxCols; i++) {
                columns.push({
                    id: colIds[i] || `col_${i}`,
                    label: colTitles[i] || colIds[i] || `column ${i + 1}`,
                    size: "1fr"
                });
            }
        }

        // extract swimlanes from child elements or dataset
        const swimlaneNodes = el.querySelectorAll(".wx-swimlane");
        if (swimlaneNodes.length > 0) {
            swimlaneNodes.forEach((node) => {
                swimlanes.push({
                    id: node.id || node.dataset.id,
                    label: node.dataset.label || node.id,
                    expanded: node.dataset.expanded !== "false"
                });
            });
        } else if (el.dataset.swimlanes) {
            swimlanes = String(el.dataset.swimlanes).split(",").map((s) => {
                return {
                    id: s.trim(),
                    label: s.trim(),
                    expanded: true
                };
            });
        }

        // note: the board column template (--wx-board-cols / --wx-board-template)
        // is applied centrally in render(), so it is consistent for both the
        // DOM-driven and the REST-driven paths.

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

                // assignee avatar (initials badge or image like the scrum backlog rows)
                assigneeId: cardEl.dataset.assigneeId || null,
                assigneeName: cardEl.dataset.assigneeName || null,
                assigneeInitials: cardEl.dataset.assigneeInitials || null,
                assigneeColor: cardEl.dataset.assigneeColor || null,
                assigneeImage: cardEl.dataset.assigneeImage || null,

                // optional application-defined info chips (priority, story points, …)
                footer: this._parseFooterSpec(cardEl.dataset.footer),

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
     * Parses the optional footer spec of a card node. The attribute carries a
     * JSON array so a card can transport an arbitrary, application-defined set
     * of chips (priority, story points, …); a malformed spec degrades to an
     * empty footer instead of breaking the board. A chip color arrives either
     * as a CSS class (system color) or an inline style (user-defined color).
     * @param {string} raw - The raw data-footer attribute value.
     * @returns {Array<object>} The normalized footer chips.
     */
    _parseFooterSpec(raw) {
        if (!raw) {
            return [];
        }
        try {
            const list = JSON.parse(raw);
            return (Array.isArray(list) ? list : [])
                .map((chip) => ({
                    label: (chip && chip.label) || "",
                    icon: (chip && chip.icon) || null,
                    colorCss: (chip && chip.colorCss) || "",
                    colorStyle: (chip && chip.colorStyle) || "",
                    title: (chip && chip.title) || ""
                }))
                .filter((chip) => chip.label || chip.icon);
        } catch (err) {
            return [];
        }
    }

    /**
     * Renders the kanban board structure based on the internal state.
     */
    render() {
        const el = this._element;
        el.innerHTML = "";

        // pin a shared column template on the host element so the header row and
        // every swimlane row use identical column tracks. without this each row
        // is an independent grid that sizes its columns to its own content, so
        // the columns of the swimlanes do not line up. this runs on every render
        // and therefore also covers the REST path, which populates the columns
        // directly (updateData) without going through setData.
        if (this._columns.length > 0) {
            el.style.setProperty("--wx-board-cols", String(this._columns.length));

            const template = this._columns
                .map((col) => {
                    const size = (!col.size || col.size === "*") ? "1fr" : col.size;
                    return "minmax(280px, " + size + ")";
                })
                .join(" ");

            el.style.setProperty("--wx-board-template", template);
        } else {
            el.style.removeProperty("--wx-board-cols");
            el.style.removeProperty("--wx-board-template");
        }

        const hasSwimlanes = this._swimlanes.length > 0;

        // bucket the cards once by column (and swimlane) so each cell is a map
        // lookup instead of filtering the full card list once per cell
        // (avoids the O(swimlanes × columns × cards) cost of the old approach).
        const cardBuckets = new Map();
        for (let i = 0; i < this._cards.length; i++) {
            const card = this._cards[i];
            const key = card.columnId + "|" + (hasSwimlanes ? (card.swimlaneId ?? "") : "");
            let bucket = cardBuckets.get(key);
            if (!bucket) {
                bucket = [];
                cardBuckets.set(key, bucket);
            }
            bucket.push(card);
        }

        // render global column headers at the top if swimlanes are active
        if (hasSwimlanes) {
            const headerRow = document.createElement("div");
            headerRow.className = "wx-kanban-row wx-kanban-headers";

            for (let c = 0; c < this._columns.length; c++) {
                const header = document.createElement("div");
                header.className = "wx-kanban-column-header";
                header.textContent = this._columns[c].label;
                this._decorateColumnHeader(header, c);
                headerRow.appendChild(header);
            }

            el.appendChild(headerRow);
        }

        const swimlanesToRender = hasSwimlanes ? this._swimlanes : [{ id: null, label: "", expanded: true }];

        for (let s = 0; s < swimlanesToRender.length; s++) {
            const lane = swimlanesToRender[s];
            const laneWrapper = document.createElement("div");
            laneWrapper.className = "wx-kanban-swimlane";

            // setup expandable parameters if swimlanes are configured
            if (hasSwimlanes) {
                laneWrapper.dataset.header = lane.label;
                laneWrapper.dataset.expanded = lane.expanded ? "true" : "false";
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
                    this._decorateColumnHeader(header, c);
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

                // render cards belonging to this cell (from the prebuilt buckets)
                const cellKey = col.id + "|" + (hasSwimlanes ? (lane.id ?? "") : "");
                const cellCards = cardBuckets.get(cellKey) || [];

                for (let k = 0; k < cellCards.length; k++) {
                    const cardEl = this._buildCardElement(cellCards[k], col.id, lane.id);
                    cell.appendChild(cardEl);
                }

                colWrapper.appendChild(cell);
                row.appendChild(colWrapper);
            }
            laneWrapper.appendChild(row);
            el.appendChild(laneWrapper);

            // convert lane wrapper into an expandable component and sync state
            if (hasSwimlanes) {
                new webexpress.webui.ExpandableCtrl(laneWrapper);
                laneWrapper.addEventListener(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, (e) => {
                    if (e && e.detail !== undefined) {
                        lane.expanded = e.detail.value;
                    }
                });
            }
        }
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
                // a cancelled drag leaves no indicator behind
                this._clearColumnDropIndicators();
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
                // show on which side of the header the column would land
                const rect = headerEl.getBoundingClientRect();
                const after = e.clientX > rect.left + rect.width / 2;
                headerEl.classList.toggle("wx-board-col-drop-after", after);
                headerEl.classList.toggle("wx-board-col-drop-before", !after);
            });
            headerEl.addEventListener("dragleave", () => {
                headerEl.classList.remove("wx-board-col-drop-before", "wx-board-col-drop-after");
            });
            headerEl.addEventListener("drop", (e) => {
                if (this._dragColumnIndex === null) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                this._clearColumnDropIndicators();
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
        const current = col.label ?? col.title ?? "";

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
                col.label = value;
                col.title = value;
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
     * Deletes a column (and its cards) and persists the new column layout.
     * @param {number} index - The column index.
     */
    _deleteColumn(index) {
        if (index < 0 || index >= this._columns.length) {
            return;
        }

        const removed = this._columns[index];
        this._columns.splice(index, 1);
        this._cards = this._cards.filter((card) => card.columnId !== removed.id);

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
        this._flashMovedColumn(target);
        this._dispatchColumnChange();
    }

    /**
     * Removes the column insertion indicators from every header, used when a
     * drag ends, is cancelled or a drop is handled.
     */
    _clearColumnDropIndicators() {
        this._element.querySelectorAll(".wx-board-col-drop-before, .wx-board-col-drop-after").forEach((el) => {
            el.classList.remove("wx-board-col-drop-before", "wx-board-col-drop-after");
        });
    }

    /**
     * Briefly highlights a column header after a reorder so the user sees where
     * the column landed. The headers are re-created by render(), so the flash
     * targets the header at the new index.
     * @param {number} index - The new column index.
     */
    _flashMovedColumn(index) {
        const header = this._element.querySelectorAll(".wx-kanban-column-header")[index];
        if (!header) {
            return;
        }
        header.classList.add("wx-board-col-moved");
        setTimeout(() => header.classList.remove("wx-board-col-moved"), 800);
    }

    /**
     * Dispatches a column-layout change so the REST layer can persist it.
     */
    _dispatchColumnChange() {
        const columns = this._columns.map((c) => {
            return { id: c.id, title: c.label ?? c.title ?? "", size: c.size };
        });

        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
            id: this._element ? this._element.id : null,
            action: "columns",
            columns: columns
        });
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

        // build card header
        const header = document.createElement("div");
        header.className = "card-header";
        const title = document.createElement("div");
        title.className = "card-title";
        title.textContent = card.label;
        header.appendChild(title);

        // assignee avatar at the header end, matching the backlog row look:
        // a photo when available, otherwise a colored initials badge; unassigned
        // cards render no badge so plain boards stay unchanged
        if (card.assigneeId || card.assigneeName || card.assigneeInitials || card.assigneeImage) {
            let assignee;
            if (card.assigneeImage) {
                assignee = document.createElement("img");
                assignee.src = card.assigneeImage;
                assignee.alt = card.assigneeName || "";
            } else {
                assignee = document.createElement("span");
                assignee.style.background = card.assigneeColor || "#6c757d";
                assignee.textContent = card.assigneeInitials || (card.assigneeName || "?").slice(0, 2).toUpperCase();
            }
            assignee.className = "card-assignee";
            assignee.title = card.assigneeName || "";
            header.appendChild(assignee);
        }

        cardEl.appendChild(header);

        // build card content
        if (card.html) {
            const content = document.createElement("div");
            content.className = "card-text";
            content.innerHTML = card.html;
            cardEl.appendChild(content);
        }

        // optional footer: application-defined chips such as the priority or
        // the story points; cards without a footer keep their compact layout
        if (Array.isArray(card.footer) && card.footer.length > 0) {
            const footer = document.createElement("div");
            footer.className = "card-footer";
            for (const info of card.footer) {
                const chip = document.createElement("span");
                chip.className = "card-footer-chip" + (info.colorCss ? " " + info.colorCss : "");
                // a user-defined color arrives as an inline style declaration
                if (!info.colorCss && info.colorStyle) {
                    chip.style.cssText += ";" + info.colorStyle;
                }
                if (info.title) {
                    chip.title = info.title;
                }
                const icon = webexpress.webui.Icon.create(info.icon);
                if (icon) {
                    chip.appendChild(icon);
                }
                if (info.label) {
                    chip.appendChild(document.createTextNode(info.label));
                }
                footer.appendChild(chip);
            }
            cardEl.appendChild(footer);
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
                // ignore error
            }
        });

        cardEl.addEventListener("dragend", (e) => {
            cardEl.classList.remove("wx-dragging");
            this._dragCard = null;
            this._clearDropTargets();
        });

        cardEl.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();

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

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-kanban", webexpress.webui.KanbanCtrl);