/**
 * Kanban board control using a dashboard-style CSS grid layout.
 * Supports optional swimlanes, pixel-perfect drag & drop, icons, images, and wx-actions.
 *
 * Card selection mirrors the list and the backlog: a click marks the card active and
 * announces the selection, so a board can drive a master-detail view the same way those
 * controls do. Selection survives a re-render, because the card element is rebuilt from
 * the retained selected id rather than from the dom.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.MOVE_EVENT
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.SELECT_ITEM_EVENT
 */
webexpress.webui.KanbanCtrl = class extends webexpress.webui.Ctrl {

    static ACTIVE_CLASS = "wx-kanban-card-active";

    // the interactive parts of a card and its surroundings. a click on one of them
    // operates that control instead of selecting the card
    static NON_SELECTING = "button, a, input, textarea, select, [contenteditable='true'], "
        + ".wx-kanban-card-menu, .wx-kanban-grip";

    _columns = [];
    _swimlanes = [];
    _cards = [];

    _dragCard = null;

    // card selection
    _selectable = true;
    _selectedCardId = null;

    // column header editing / reordering / deleting
    _editableColumn = false;
    _movableColumn = false;
    _deletableColumn = false;
    _dragColumnIndex = null;
    _activeColumnEdit = null;

    // board "…" menu (settings / add column / add swimlane) and swimlane menu
    _addableColumn = false;
    _addableSwimlane = false;
    _editableSwimlane = false;
    _deletableSwimlane = false;
    _movableSwimlane = false;
    _configurableBoard = false;
    _configurableSwimlane = false;

    // the wql filter of the board settings; edited through the settings dialog and
    // seeded from the loaded board (REST) or the static data-filter attribute
    _filter = "";
    _settingsDialog = null;
    _activeSwimlaneEdit = null;
    _onDocClick = null;

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

        // board and swimlane capabilities
        this._addableColumn = element.dataset.addableColumn === "true";
        this._addableSwimlane = element.dataset.addableSwimlane === "true";
        this._editableSwimlane = element.dataset.editableSwimlane === "true";
        this._deletableSwimlane = element.dataset.deletableSwimlane === "true";
        this._movableSwimlane = element.dataset.movableSwimlane === "true";
        this._configurableBoard = element.dataset.configurableBoard === "true";
        this._configurableSwimlane = element.dataset.configurableSwimlane === "true";

        this._filter = element.dataset.filter || "";

        // card selection is on unless the host opts out, matching the list, whose
        // selectable default is what a board embedded in a master-detail needs
        this._selectable = element.dataset.selectable !== "false";

        // a single document listener closes any open board / column / swimlane
        // dropdown when the click lands outside its own menu container
        this._onDocClick = (e) => this._closeMenusOnOutsideClick(e);
        document.addEventListener("click", this._onDocClick);

        // delegated, because render() rebuilds every card: a listener on the host
        // survives that, per-card listeners would have to be re-bound each time
        element.addEventListener("click", (e) => this._onCardClick(e));

        this._parseStaticConfig();
        this.render();
    }

    /**
     * Gets the id of the currently selected card.
     * @returns {string|null} The selected card id.
     */
    get selectedId() {
        return this._selectedCardId;
    }

    /**
     * Selects the card with the given id, or clears the selection for null.
     * @param {string|null} value - The card id.
     */
    set selectedId(value) {
        this.selectCard(value, null);
    }

    /**
     * Selects a card and announces the change. This is the single entry point for
     * every selection channel, so the state transition is identical no matter
     * whether a click or a programmatic call triggered it.
     * @param {string|null} id - The card id, or null to clear the selection.
     * @param {Event} [originalEvent=null] - The dom event that triggered the selection.
     * @param {boolean} [dispatch=true] - Whether to fire the selection event.
     */
    selectCard(id, originalEvent = null, dispatch = true) {
        const next = id != null ? String(id) : null;

        if (next === this._selectedCardId) {
            return;
        }

        this._selectedCardId = next;
        this._applySelectionClasses();

        if (dispatch) {
            this._dispatch(webexpress.webui.Event.SELECT_ITEM_EVENT, {
                itemId: this._selectedCardId,
                originalEvent: originalEvent
            });
        }
    }

    /**
     * Clears the card selection.
     */
    clearSelection() {
        this.selectCard(null);
    }

    /**
     * Selects the card a click landed on. Clicks on the interactive parts of a card
     * are left to those controls, and a click outside every card leaves the
     * selection alone rather than clearing it, so the detail of a master-detail
     * does not close on an incidental click on the board background.
     * @param {MouseEvent} e - The click event.
     */
    _onCardClick(e) {
        if (!this._selectable) {
            return;
        }

        const target = e.target;
        if (!target || typeof target.closest !== "function") {
            return;
        }

        if (target.closest(webexpress.webui.KanbanCtrl.NON_SELECTING)) {
            return;
        }

        const cardEl = target.closest(".wx-kanban-card");
        if (!cardEl || !this._element.contains(cardEl)) {
            return;
        }

        this.selectCard(cardEl.dataset.cardId, e);
    }

    /**
     * Reflects the selection on the rendered cards, so exactly one card carries the
     * active marker.
     */
    _applySelectionClasses() {
        for (const cardEl of this._element.querySelectorAll(".wx-kanban-card")) {
            const active = this._selectedCardId != null
                && cardEl.dataset.cardId === this._selectedCardId;

            cardEl.classList.toggle(webexpress.webui.KanbanCtrl.ACTIVE_CLASS, active);
            cardEl.classList.toggle("active", active);

            if (active) {
                cardEl.setAttribute("aria-selected", "true");
            } else {
                cardEl.removeAttribute("aria-selected");
            }
        }
    }

    /**
     * Removes the document-level menu listener when the control is torn down.
     */
    destroy() {
        if (this._onDocClick) {
            document.removeEventListener("click", this._onDocClick);
            this._onDocClick = null;
        }
        super.destroy();
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
                    size: node.dataset.size || "1fr",
                    color: node.dataset.color || null,
                    badge: node.dataset.badge || null,
                    badgeColor: node.dataset.badgeColor || null,
                    badgeStyle: node.dataset.badgeStyle || null
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
                    size: "1fr",
                    color: null
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
                    expanded: node.dataset.expanded !== "false",
                    filter: node.dataset.filter || "",
                    color: node.dataset.color || null,
                    badge: node.dataset.badge || null,
                    badgeColor: node.dataset.badgeColor || null,
                    badgeStyle: node.dataset.badgeStyle || null
                });
            });
        } else if (el.dataset.swimlanes) {
            swimlanes = String(el.dataset.swimlanes).split(",").map((s) => {
                return {
                    id: s.trim(),
                    label: s.trim(),
                    expanded: true,
                    filter: ""
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

                // optional trailing badge in the card header
                badge: cardEl.dataset.badge || null,
                badgeColor: cardEl.dataset.badgeColor || null,
                badgeStyle: cardEl.dataset.badgeStyle || null,

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

        // the board "…" menu (settings / add column / add swimlane) sits above the
        // columns; it is skipped for boards that offer none of these affordances
        const menuBar = this._buildBoardMenu();
        if (menuBar) {
            el.appendChild(menuBar);
        }

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
                headerRow.appendChild(this._createColumnHeader(this._columns[c], c));
            }

            el.appendChild(headerRow);
        }

        const swimlanesToRender = hasSwimlanes ? this._swimlanes : [{ id: null, label: "", expanded: true }];

        for (let s = 0; s < swimlanesToRender.length; s++) {
            const lane = swimlanesToRender[s];
            const laneWrapper = document.createElement("div");
            laneWrapper.className = "wx-kanban-swimlane";

            // setup section parameters if swimlanes are configured. the header label
            // deliberately opts out of the bootstrap text-primary default, whose !important
            // would beat the inline accent color of a colored lane. a lane name is a name, so
            // it keeps its spelling instead of taking the upper case of a structural label, and
            // the board owns the collapsed state, so the section does not remember one of its
            // own
            if (hasSwimlanes) {
                laneWrapper.classList.add("wx-section-verbatim");
                laneWrapper.dataset.header = lane.label;
                laneWrapper.dataset.labelCss = "wx-kanban-swimlane-header";
                laneWrapper.dataset.expanded = lane.expanded ? "true" : "false";
                laneWrapper.dataset.guide = "false";
                laneWrapper.dataset.persist = "false";
            }

            // create the grid row for the drop zones
            const row = document.createElement("div");
            row.className = "wx-kanban-row";

            for (let c = 0; c < this._columns.length; c++) {
                const col = this._columns[c];
                const colWrapper = document.createElement("div");

                // integrate header directly into the column if no swimlanes are active
                if (!hasSwimlanes) {
                    const header = this._createColumnHeader(col, c);
                    header.style.marginBottom = "0.75rem";
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

            // convert lane wrapper into a collapsible section and sync state
            if (hasSwimlanes) {
                const laneCtrl = new webexpress.webui.SectionCtrl(laneWrapper);
                this._appendSwimlaneBadge(laneCtrl, lane);
                this._applySwimlaneColor(laneCtrl, lane);
                this._decorateSwimlaneHeader(laneCtrl, s);
                laneWrapper.addEventListener(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, (e) => {
                    if (e && e.detail !== undefined) {
                        lane.expanded = e.detail.value;
                    }
                });
            }
        }
    }

    /**
     * Builds a column header carrying the label, the optional accent color and
     * the reorder / "…" affordances. Shared by the swimlane header row and the
     * per-column header of a board without swimlanes.
     * @param {object} col - The column data object.
     * @param {number} index - The column index in this._columns.
     * @returns {HTMLElement} The header element.
     */
    _createColumnHeader(col, index) {
        const header = document.createElement("div");
        header.className = "wx-kanban-column-header";

        const titleText = document.createElement("span");
        titleText.className = "wx-board-col-title";
        titleText.textContent = col.label ?? col.title ?? "";
        header.appendChild(titleText);

        // optional trailing badge (e.g. the card count), coloured by a css class
        // (system color) or an inline style, mirroring the tab header badge
        const colBadge = this._makeBadge(col, "wx-board-col-badge");
        if (colBadge) {
            header.appendChild(colBadge);
        }

        // the column color tints the header underline so the column reads as a
        // labelled, colored lane, mirroring the dashboard
        if (col.color) {
            header.style.borderBottomColor = col.color;
            header.classList.add("wx-board-col-has-color");
        }

        this._decorateColumnHeader(header, index);

        return header;
    }

    /**
     * Builds an optional trailing badge from a data object carrying badge,
     * badgeColor and badgeStyle (columns, swimlanes and cards all share it). The
     * color arrives either as a css class (system color) or an inline style
     * (user-defined color). Returns null when the data carries no badge.
     * @param {object} data - The data object with badge fields.
     * @param {string} className - The element class distinguishing the badge kind.
     * @returns {HTMLElement|null} The badge element, or null.
     */
    _makeBadge(data, className) {
        if (!data || data.badge == null || data.badge === "") {
            return null;
        }

        const badge = document.createElement("span");
        badge.className = className + " badge";
        if (data.badgeColor) {
            badge.classList.add(...String(data.badgeColor).split(/\s+/).filter(Boolean));
        }
        if (data.badgeStyle) {
            badge.style.cssText = data.badgeStyle;
        }
        badge.textContent = data.badge;
        return badge;
    }

    // ---- board "…" menu -------------------------------------------------------

    /**
     * Builds the board "…" menu bar carrying the settings (wql filter), the
     * add-column and the add-swimlane entries. Returns null when none of these
     * affordances is enabled, so read-only boards stay unchanged.
     * @returns {HTMLElement|null} The menu bar, or null when no menu is offered.
     */
    _buildBoardMenu() {
        if (!this._configurableBoard && !this._addableColumn && !this._addableSwimlane) {
            return null;
        }

        const bar = document.createElement("div");
        bar.className = "wx-kanban-toolbar";

        const container = document.createElement("div");
        container.className = "wx-kanban-menu position-relative";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "wx-kanban-menu-btn";
        button.title = this._i18n("webexpress.webapp:kanban.menu", "Options");
        button.setAttribute("aria-label", button.title);
        button.innerHTML = `<i class="${this._iconClass("more")}"></i>`;

        const menu = document.createElement("ul");
        menu.className = "dropdown-menu dropdown-menu-end";

        if (this._configurableBoard) {
            menu.appendChild(this._buildMenuEntry(
                this._iconClass("gear"),
                this._i18n("webexpress.webapp:board.settings", "Settings"),
                null,
                () => this._openBoardSettings()
            ));
        }

        if (this._addableColumn || this._addableSwimlane) {
            if (this._configurableBoard) {
                const divider = document.createElement("li");
                divider.innerHTML = "<hr class=\"dropdown-divider\">";
                menu.appendChild(divider);
            }

            if (this._addableColumn) {
                menu.appendChild(this._buildMenuEntry(
                    this._iconClass("table-columns"),
                    this._i18n("webexpress.webapp:column.add", "New column"),
                    null,
                    () => this._addColumn()
                ));
            }

            if (this._addableSwimlane) {
                menu.appendChild(this._buildMenuEntry(
                    this._iconClass("bars"),
                    this._i18n("webexpress.webapp:swimlane.add", "New swimlane"),
                    null,
                    () => this._addSwimlane()
                ));
            }
        }

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._toggleMenu(menu);
        });

        container.appendChild(button);
        container.appendChild(menu);
        bar.appendChild(container);

        return bar;
    }

    /**
     * Builds a single dropdown entry with an optional icon, a title and an
     * optional description line.
     * @param {string|null} iconClass - The resolved icon class, or null.
     * @param {string} title - The entry title.
     * @param {string|null} description - The optional description line.
     * @param {Function} onClick - The click handler.
     * @returns {HTMLElement} The list item element.
     */
    _buildMenuEntry(iconClass, title, description, onClick) {
        const li = document.createElement("li");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "dropdown-item";

        const titleLine = document.createElement("div");
        titleLine.className = "fw-semibold";
        if (iconClass) {
            const icon = document.createElement("i");
            icon.className = iconClass + " me-2";
            titleLine.appendChild(icon);
        }
        titleLine.appendChild(document.createTextNode(title));
        button.appendChild(titleLine);

        if (description) {
            const descLine = document.createElement("small");
            descLine.className = "d-block text-muted";
            descLine.textContent = description;
            button.appendChild(descLine);
        }

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._closeAllMenus();
            onClick();
        });

        li.appendChild(button);

        return li;
    }

    /**
     * Builds a menu entry with a leading check mark reflecting the active state.
     * @param {string} label - The entry label.
     * @param {boolean} active - Whether the entry is the current selection.
     * @param {Function} onClick - The click handler.
     * @returns {HTMLElement} The list item element.
     */
    _buildMenuCheckEntry(label, active, onClick) {
        const li = document.createElement("li");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "dropdown-item d-flex align-items-center";
        if (active) {
            button.classList.add("active");
        }

        const check = document.createElement("i");
        check.className = active ? this._iconClass("check") : "";
        check.style.width = "1.25em";
        button.appendChild(check);
        button.appendChild(document.createTextNode(label));

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._closeAllMenus();
            onClick();
        });

        li.appendChild(button);

        return li;
    }

    /**
     * Toggles a dropdown menu, closing any other open kanban menu first so only
     * one stays open at a time.
     * @param {HTMLElement} menu - The dropdown menu element.
     */
    _toggleMenu(menu) {
        const willShow = !menu.classList.contains("show");
        this._closeAllMenus();
        if (willShow) {
            menu.classList.add("show");
            // the open class keeps the hover-only trigger visible while the menu
            // is open, even once the pointer leaves the header
            const container = menu.closest(".wx-kanban-menu");
            if (container) {
                container.classList.add("wx-menu-open");
                const button = container.querySelector(".wx-kanban-menu-btn");
                if (button) {
                    this._positionMenu(button, menu);
                }
            }
        }
    }

    /**
     * Pins an open dropdown to the viewport with a fixed position anchored under
     * the trigger. The board scroller (.wx-kanban) clips overflow on both axes,
     * so an absolutely positioned menu would be cut off; a fixed position
     * escapes the clip, mirroring the framework's fixed dropdown strategy.
     * @param {HTMLElement} button - The trigger button.
     * @param {HTMLElement} menu - The dropdown menu element.
     */
    _positionMenu(button, menu) {
        const rect = button.getBoundingClientRect();
        const viewportWidth = (typeof window !== "undefined" && window.innerWidth)
            || (document.documentElement && document.documentElement.clientWidth) || 0;

        menu.style.position = "fixed";
        menu.style.top = rect.bottom + "px";
        // anchor by the right edge so the menu stays under a dropdown-menu-end trigger
        menu.style.left = "auto";
        menu.style.right = Math.max(0, viewportWidth - rect.right) + "px";
        menu.style.bottom = "auto";
    }

    /**
     * Closes every open board, column or swimlane dropdown of this board and
     * drops the fixed positioning applied on open.
     */
    _closeAllMenus() {
        const menus = this._element.querySelectorAll(".wx-kanban-menu > .dropdown-menu.show");
        for (let i = 0; i < menus.length; i++) {
            menus[i].classList.remove("show");
            this._resetMenuPosition(menus[i]);
        }
        const open = this._element.querySelectorAll(".wx-kanban-menu.wx-menu-open");
        for (let i = 0; i < open.length; i++) {
            open[i].classList.remove("wx-menu-open");
        }
    }

    /**
     * Clears the inline fixed-position styles a menu carries while open.
     * @param {HTMLElement} menu - The dropdown menu element.
     */
    _resetMenuPosition(menu) {
        menu.style.removeProperty("position");
        menu.style.removeProperty("top");
        menu.style.removeProperty("left");
        menu.style.removeProperty("right");
        menu.style.removeProperty("bottom");
    }

    /**
     * Closes every open menu whose container does not contain the click target,
     * so only a menu the user is interacting with stays open.
     * @param {MouseEvent} e - The document click event.
     */
    _closeMenusOnOutsideClick(e) {
        const menus = this._element.querySelectorAll(".wx-kanban-menu > .dropdown-menu.show");
        for (let i = 0; i < menus.length; i++) {
            const container = menus[i].closest(".wx-kanban-menu");
            if (container && !container.contains(e.target)) {
                menus[i].classList.remove("show");
                this._resetMenuPosition(menus[i]);
                container.classList.remove("wx-menu-open");
            }
        }
    }

    /**
     * Appends a new empty column and persists the new column layout.
     */
    _addColumn() {
        const label = this._i18n("webexpress.webapp:column.new", "New column");
        this._columns.push({
            id: "col_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            label: label,
            title: label,
            size: "1fr",
            color: null
        });

        this.render();
        this._dispatchColumnChange();
    }

    /**
     * Appends a new swimlane and persists the new swimlane layout. When the
     * board had no swimlane yet, the existing cards (which carry no swimlane) are
     * moved into the new lane so they stay visible after the board switches into
     * the swimlane layout.
     */
    _addSwimlane() {
        const label = this._i18n("webexpress.webapp:swimlane.new", "New swimlane");
        const id = "lane_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

        const wasEmpty = this._swimlanes.length === 0;

        this._swimlanes.push({ id: id, label: label, expanded: true, filter: "", color: null });

        if (wasEmpty) {
            for (let i = 0; i < this._cards.length; i++) {
                if (!this._cards[i].swimlaneId) {
                    this._cards[i].swimlaneId = id;
                }
            }
        }

        this.render();
        this._dispatchSwimlaneChange();
    }

    // ---- column "…" menu ------------------------------------------------------

    /**
     * Decorates a column header with the ⠿ reorder grip and the "…" menu
     * (rename, size, color, delete), depending on the enabled column flags. The
     * grip and menu trigger reveal on hover; an inline rename is started from the
     * menu rather than a pencil or double-click.
     * @param {HTMLElement} headerEl - The column header element.
     * @param {number} index - The column index in this._columns.
     */
    _decorateColumnHeader(headerEl, index) {
        const hasMenu = this._editableColumn || this._deletableColumn;
        if (!this._movableColumn && !hasMenu) {
            return;
        }

        headerEl.classList.add("wx-board-col-header");

        if (this._movableColumn) {
            headerEl.classList.add("wx-board-col-movable");
            this._addColumnGrip(headerEl, index);
        }

        if (hasMenu) {
            headerEl.appendChild(this._buildColumnMenu(headerEl, index));
        }
    }

    /**
     * Adds the ⠿ reorder grip and wires the column drag and drop, including the
     * before/after drop indicators that visualise where the dragged column would
     * land - the same affordance the tabs use.
     * @param {HTMLElement} headerEl - The column header element.
     * @param {number} index - The column index.
     */
    _addColumnGrip(headerEl, index) {
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
            this._clearColumnDropIndicators();
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
            const rect = headerEl.getBoundingClientRect();
            const after = e.clientX > rect.left + rect.width / 2;
            this._clearColumnDropIndicators();
            headerEl.classList.add(after ? "wx-board-col-drop-after" : "wx-board-col-drop-before");
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
            const rect = headerEl.getBoundingClientRect();
            const after = e.clientX > rect.left + rect.width / 2;
            this._clearColumnDropIndicators();
            this._moveColumn(this._dragColumnIndex, index, after);
        });
    }

    /**
     * Builds the column "…" menu offering rename, size, color and delete. The
     * size and color entries drill down into the same dropdown so no nested
     * flyout positioning is needed.
     * @param {HTMLElement} headerEl - The column header element.
     * @param {number} index - The column index.
     * @returns {HTMLElement} The menu container element.
     */
    _buildColumnMenu(headerEl, index) {
        const container = document.createElement("span");
        container.className = "wx-kanban-menu wx-board-col-menu position-relative";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "wx-kanban-menu-btn";
        button.title = this._i18n("webexpress.webapp:column.menu", "Column options");
        button.setAttribute("aria-label", button.title);
        button.innerHTML = `<i class="${this._iconClass("more")}"></i>`;

        const menu = document.createElement("ul");
        menu.className = "dropdown-menu dropdown-menu-end";

        this._populateColumnMenuRoot(menu, headerEl, index);

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // a re-opened menu always starts at the top level
            this._populateColumnMenuRoot(menu, headerEl, index);
            this._toggleMenu(menu);
        });

        container.appendChild(button);
        container.appendChild(menu);

        return container;
    }

    /**
     * Populates the column menu with its top-level entries.
     * @param {HTMLElement} menu - The dropdown menu element.
     * @param {HTMLElement} headerEl - The column header element.
     * @param {number} index - The column index.
     */
    _populateColumnMenuRoot(menu, headerEl, index) {
        menu.replaceChildren();

        if (this._editableColumn) {
            menu.appendChild(this._buildMenuEntry(
                this._iconClass("pen"),
                this._i18n("webexpress.webapp:column.edit", "Rename column"),
                null,
                () => this._startColumnEdit(headerEl, index)
            ));
            menu.appendChild(this._buildSubmenuEntry(
                this._iconClass("expand"),
                this._i18n("webexpress.webapp:column.size", "Size"),
                (m) => this._populateColumnMenuSizes(m, headerEl, index)
            ));
            menu.appendChild(this._buildSubmenuEntry(
                this._iconClass("palette"),
                this._i18n("webexpress.webapp:column.color", "Color"),
                (m) => this._populateColumnMenuColors(m, headerEl, index)
            ));
        }

        if (this._deletableColumn) {
            if (this._editableColumn) {
                const divider = document.createElement("li");
                divider.innerHTML = "<hr class=\"dropdown-divider\">";
                menu.appendChild(divider);
            }
            menu.appendChild(this._buildMenuEntry(
                this._iconClass("trash"),
                this._i18n("webexpress.webapp:column.delete", "Delete column"),
                null,
                () => this._deleteColumn(index)
            ));
        }
    }

    /**
     * Builds a drill-down entry that repopulates the menu in place with a
     * sub-level, keeping the dropdown open. Shared by the column and swimlane
     * menus.
     * @param {string|null} iconClass - The resolved icon class.
     * @param {string} label - The entry label.
     * @param {Function} populate - Repopulates the menu; receives the menu element.
     * @returns {HTMLElement} The list item element.
     */
    _buildSubmenuEntry(iconClass, label, populate) {
        const li = document.createElement("li");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "dropdown-item d-flex align-items-center";

        if (iconClass) {
            const icon = document.createElement("i");
            icon.className = iconClass + " me-2";
            button.appendChild(icon);
        }
        button.appendChild(document.createTextNode(label));

        const chevron = document.createElement("i");
        chevron.className = this._iconClass("chevron-right") + " ms-auto ps-3";
        button.appendChild(chevron);

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            populate(li.closest(".dropdown-menu"));
        });

        li.appendChild(button);

        return li;
    }

    /**
     * Builds the "back" entry that returns a drilled-down menu to its root.
     * Shared by the column and swimlane menus.
     * @param {Function} onBack - Repopulates the menu with its root entries.
     * @returns {HTMLElement} The list item element.
     */
    _buildMenuBackEntry(onBack) {
        const li = document.createElement("li");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "dropdown-item text-muted d-flex align-items-center";
        button.innerHTML = `<i class="${this._iconClass("chevron-left")} me-2"></i>`;
        button.appendChild(document.createTextNode(this._i18n("webexpress.webapp:back", "Back")));
        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            onBack();
        });

        li.appendChild(button);

        return li;
    }

    /**
     * Populates the column menu with the size presets.
     * @param {HTMLElement} menu - The dropdown menu element.
     * @param {HTMLElement} headerEl - The column header element.
     * @param {number} index - The column index.
     */
    _populateColumnMenuSizes(menu, headerEl, index) {
        menu.replaceChildren();
        menu.appendChild(this._buildMenuBackEntry(() => this._populateColumnMenuRoot(menu, headerEl, index)));

        const col = this._columns[index];
        const presets = [
            { label: this._i18n("webexpress.webapp:column.size.auto", "Auto"), value: "1fr" },
            { label: "25 %", value: "25%" },
            { label: "33 %", value: "33%" },
            { label: "50 %", value: "50%" },
            { label: "66 %", value: "66%" },
            { label: "75 %", value: "75%" }
        ];

        for (let i = 0; i < presets.length; i++) {
            const preset = presets[i];
            const active = col && (col.size === preset.value
                || (preset.value === "1fr" && (!col.size || col.size === "*")));
            menu.appendChild(this._buildMenuCheckEntry(preset.label, active, () => this._setColumnSize(index, preset.value)));
        }
    }

    /**
     * Populates the column menu with the color palette and a "none" option.
     * @param {HTMLElement} menu - The dropdown menu element.
     * @param {HTMLElement} headerEl - The column header element.
     * @param {number} index - The column index.
     */
    _populateColumnMenuColors(menu, headerEl, index) {
        menu.replaceChildren();
        menu.appendChild(this._buildMenuBackEntry(() => this._populateColumnMenuRoot(menu, headerEl, index)));

        const col = this._columns[index];

        menu.appendChild(this._buildMenuCheckEntry(
            this._i18n("webexpress.webapp:column.color.none", "None"),
            col && !col.color,
            () => this._setColumnColor(index, null)
        ));

        const li = document.createElement("li");
        const grid = document.createElement("div");
        grid.className = "wx-board-col-color-grid";

        const palette = this._colorPalette();
        for (let i = 0; i < palette.length; i++) {
            const color = palette[i];
            const swatch = document.createElement("button");
            swatch.type = "button";
            swatch.className = "wx-board-col-swatch";
            swatch.style.backgroundColor = color;
            swatch.title = color;
            if (col && col.color && col.color.toLowerCase() === color.toLowerCase()) {
                swatch.classList.add("active");
            }
            swatch.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._closeAllMenus();
                this._setColumnColor(index, color);
            });
            grid.appendChild(swatch);
        }

        li.appendChild(grid);
        menu.appendChild(li);
    }

    /**
     * The column color palette offered in the column menu.
     * @returns {Array<string>} The hex colors.
     */
    _colorPalette() {
        return [
            "#0d6efd", "#6610f2", "#6f42c1", "#d63384", "#dc3545", "#fd7e14",
            "#ffc107", "#198754", "#20c997", "#0dcaf0", "#6c757d", "#343a40"
        ];
    }

    /**
     * Sets a column size and persists the new column layout.
     * @param {number} index - The column index.
     * @param {string} value - The CSS grid size (e.g. "1fr", "33%").
     */
    _setColumnSize(index, value) {
        const col = this._columns[index];
        if (!col) {
            return;
        }
        col.size = value;
        this.render();
        this._dispatchColumnChange();
    }

    /**
     * Sets a column color and persists the new column layout.
     * @param {number} index - The column index.
     * @param {string|null} color - The color, or null to clear it.
     */
    _setColumnColor(index, color) {
        const col = this._columns[index];
        if (!col) {
            return;
        }
        col.color = color;
        this.render();
        this._dispatchColumnChange();
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
            return { id: c.id, title: c.label ?? c.title ?? "", size: c.size, color: c.color ?? null };
        });

        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
            id: this._element ? this._element.id : null,
            action: "columns",
            columns: columns
        });
    }

    // ---- swimlane "…" menu ----------------------------------------------------

    /**
     * Appends the optional trailing badge to a swimlane header, at the end of the
     * header row.
     *
     * The badge is built by the shared _makeBadge, which columns, cards and lanes
     * all use, so it carries the kanban badge classes rather than the plain text
     * pill the section offers of its own.
     * @param {object} laneCtrl - The SectionCtrl of the swimlane.
     * @param {object} lane - The swimlane data object.
     */
    _appendSwimlaneBadge(laneCtrl, lane) {
        const badge = this._makeBadge(lane, "wx-kanban-swimlane-badge");
        if (!badge) {
            return;
        }

        const header = laneCtrl && laneCtrl.headerElement;
        if (header) {
            header.appendChild(badge);
        }
    }

    /**
     * Tints a swimlane header with its optional accent color, so a colored lane
     * reads as a labelled group the same way a colored column reads as a
     * labelled stage.
     * @param {object} laneCtrl - The SectionCtrl of the swimlane.
     * @param {object} lane - The swimlane data object.
     */
    _applySwimlaneColor(laneCtrl, lane) {
        const label = laneCtrl && laneCtrl.titleElement;
        if (!label || !lane.color) {
            return;
        }
        label.style.color = lane.color;
        if (laneCtrl.headerElement) {
            laneCtrl.headerElement.classList.add("wx-kanban-swimlane-has-color");
        }
    }

    /**
     * Decorates a swimlane header with a "…" menu offering rename, color,
     * settings, move and delete, depending on the enabled swimlane flags. The
     * menu is appended to the header row so it flows with the label; color
     * drills into the same dropdown so no nested flyout positioning is needed.
     * @param {object} laneCtrl - The SectionCtrl of the swimlane.
     * @param {number} index - The swimlane index in this._swimlanes.
     */
    _decorateSwimlaneHeader(laneCtrl, index) {
        if (!this._editableSwimlane && !this._deletableSwimlane && !this._movableSwimlane && !this._configurableSwimlane) {
            return;
        }

        const headerSpan = laneCtrl && laneCtrl.titleElement;
        const header = laneCtrl && laneCtrl.headerElement;
        if (!headerSpan || !header) {
            return;
        }

        header.classList.add("wx-kanban-swimlane-configurable");

        const container = document.createElement("span");
        container.className = "wx-kanban-menu wx-kanban-swimlane-menu position-relative";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "wx-kanban-menu-btn";
        button.title = this._i18n("webexpress.webapp:swimlane.menu", "Swimlane options");
        button.setAttribute("aria-label", button.title);
        button.innerHTML = `<i class="${this._iconClass("more")}"></i>`;

        const menu = document.createElement("ul");
        menu.className = "dropdown-menu dropdown-menu-end";

        this._populateSwimlaneMenuRoot(menu, headerSpan, index);

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // a re-opened menu always starts at the top level
            this._populateSwimlaneMenuRoot(menu, headerSpan, index);
            this._toggleMenu(menu);
        });

        container.appendChild(button);
        container.appendChild(menu);

        // place the menu at the end of the header row, after the label and any badge
        header.appendChild(container);
    }

    /**
     * Populates the swimlane menu with its top-level entries.
     * @param {HTMLElement} menu - The dropdown menu element.
     * @param {HTMLElement} headerSpan - The swimlane header label element.
     * @param {number} index - The swimlane index.
     */
    _populateSwimlaneMenuRoot(menu, headerSpan, index) {
        menu.replaceChildren();

        if (this._editableSwimlane) {
            menu.appendChild(this._buildMenuEntry(
                this._iconClass("pen"),
                this._i18n("webexpress.webapp:swimlane.edit", "Rename swimlane"),
                null,
                () => this._startSwimlaneEdit(headerSpan, index)
            ));
            menu.appendChild(this._buildSubmenuEntry(
                this._iconClass("palette"),
                this._i18n("webexpress.webapp:swimlane.color", "Color"),
                (m) => this._populateSwimlaneMenuColors(m, headerSpan, index)
            ));
        }

        if (this._configurableSwimlane) {
            menu.appendChild(this._buildMenuEntry(
                this._iconClass("gear"),
                this._i18n("webexpress.webapp:swimlane.settings", "Settings"),
                null,
                () => this._openSwimlaneSettings(index)
            ));
        }

        if (this._movableSwimlane) {
            // only offer the direction that has room, so the menu never carries a
            // dead entry at the first or last lane
            if (index > 0) {
                menu.appendChild(this._buildMenuEntry(
                    this._iconClass("arrow-up"),
                    this._i18n("webexpress.webapp:swimlane.moveup", "Move up"),
                    null,
                    () => this._moveSwimlane(index, -1)
                ));
            }
            if (index < this._swimlanes.length - 1) {
                menu.appendChild(this._buildMenuEntry(
                    this._iconClass("arrow-down"),
                    this._i18n("webexpress.webapp:swimlane.movedown", "Move down"),
                    null,
                    () => this._moveSwimlane(index, 1)
                ));
            }
        }

        if (this._deletableSwimlane) {
            if (this._editableSwimlane || this._configurableSwimlane || this._movableSwimlane) {
                const divider = document.createElement("li");
                divider.innerHTML = "<hr class=\"dropdown-divider\">";
                menu.appendChild(divider);
            }
            menu.appendChild(this._buildMenuEntry(
                this._iconClass("trash"),
                this._i18n("webexpress.webapp:swimlane.delete", "Delete swimlane"),
                null,
                () => this._deleteSwimlane(index)
            ));
        }
    }

    /**
     * Populates the swimlane menu with the color palette and a "none" option.
     * @param {HTMLElement} menu - The dropdown menu element.
     * @param {HTMLElement} headerSpan - The swimlane header label element.
     * @param {number} index - The swimlane index.
     */
    _populateSwimlaneMenuColors(menu, headerSpan, index) {
        menu.replaceChildren();
        menu.appendChild(this._buildMenuBackEntry(() => this._populateSwimlaneMenuRoot(menu, headerSpan, index)));

        const lane = this._swimlanes[index];

        menu.appendChild(this._buildMenuCheckEntry(
            this._i18n("webexpress.webapp:swimlane.color.none", "None"),
            lane && !lane.color,
            () => this._setSwimlaneColor(index, null)
        ));

        const li = document.createElement("li");
        const grid = document.createElement("div");
        grid.className = "wx-board-col-color-grid";

        const palette = this._colorPalette();
        for (let i = 0; i < palette.length; i++) {
            const color = palette[i];
            const swatch = document.createElement("button");
            swatch.type = "button";
            swatch.className = "wx-board-col-swatch";
            swatch.style.backgroundColor = color;
            swatch.title = color;
            if (lane && lane.color && lane.color.toLowerCase() === color.toLowerCase()) {
                swatch.classList.add("active");
            }
            swatch.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._closeAllMenus();
                this._setSwimlaneColor(index, color);
            });
            grid.appendChild(swatch);
        }

        li.appendChild(grid);
        menu.appendChild(li);
    }

    /**
     * Sets a swimlane accent color and persists the new swimlane layout.
     * @param {number} index - The swimlane index.
     * @param {string|null} color - The color, or null to clear it.
     */
    _setSwimlaneColor(index, color) {
        const lane = this._swimlanes[index];
        if (!lane) {
            return;
        }
        lane.color = color;
        this.render();
        this._dispatchSwimlaneChange();
    }

    /**
     * Starts inline editing of a swimlane title in place of the header label.
     * @param {HTMLElement} headerSpan - The swimlane header label element.
     * @param {number} index - The swimlane index.
     */
    _startSwimlaneEdit(headerSpan, index) {
        const lane = this._swimlanes[index];
        if (!lane || this._activeSwimlaneEdit) {
            return;
        }

        this._activeSwimlaneEdit = headerSpan;
        const current = lane.label ?? "";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "wx-board-col-input";
        input.value = current;
        // the header label toggles the lane on click; stop the input from doing so
        input.addEventListener("click", (e) => e.stopPropagation());

        headerSpan.innerHTML = "";
        headerSpan.appendChild(input);
        input.focus();
        input.select();

        let done = false;
        const finish = (save) => {
            if (done) {
                return;
            }
            done = true;
            this._activeSwimlaneEdit = null;

            const value = input.value.trim();
            if (save && value && value !== current) {
                lane.label = value;
                this.render();
                this._dispatchSwimlaneChange();
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
     * Moves a swimlane one position up or down and persists the new order.
     * @param {number} index - The swimlane index.
     * @param {number} delta - The move direction: -1 for up, 1 for down.
     */
    _moveSwimlane(index, delta) {
        const target = index + delta;
        if (index < 0 || index >= this._swimlanes.length || target < 0 || target >= this._swimlanes.length) {
            return;
        }

        const [moved] = this._swimlanes.splice(index, 1);
        this._swimlanes.splice(target, 0, moved);

        this.render();
        this._dispatchSwimlaneChange();
    }

    /**
     * Deletes a swimlane (and its cards) and persists the new swimlane layout.
     * @param {number} index - The swimlane index.
     */
    _deleteSwimlane(index) {
        if (index < 0 || index >= this._swimlanes.length) {
            return;
        }

        const removed = this._swimlanes[index];
        this._swimlanes.splice(index, 1);
        this._cards = this._cards.filter((card) => card.swimlaneId !== removed.id);

        this.render();
        this._dispatchSwimlaneChange();
    }

    /**
     * Opens the swimlane settings dialog seeded with the lane's current wql
     * filter. On save the filter is stored on the lane and the swimlane change is
     * persisted.
     * @param {number} index - The swimlane index.
     */
    _openSwimlaneSettings(index) {
        const lane = this._swimlanes[index];
        if (!lane) {
            return;
        }

        if (!this._settingsDialog) {
            this._settingsDialog = new webexpress.webui.KanbanBoardSettings();
        }

        const settings = { filter: lane.filter || "" };
        this._settingsDialog.open(
            settings,
            () => {
                lane.filter = settings.filter;
                this._dispatchSwimlaneChange();
            },
            this._i18n("webexpress.webui:kanban.settings.swimlane.title", "Swimlane settings")
        );
    }

    /**
     * Dispatches a swimlane-layout change so the REST layer can persist it. Each
     * swimlane carries its title, its wql filter and its accent color.
     */
    _dispatchSwimlaneChange() {
        const swimlanes = this._swimlanes.map((s) => {
            return { id: s.id, title: s.label ?? "", filter: s.filter ?? "", color: s.color ?? null };
        });

        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
            id: this._element ? this._element.id : null,
            action: "swimlanes",
            swimlanes: swimlanes
        });
    }

    // ---- board settings (wql filter) ------------------------------------------

    /**
     * Opens the board settings dialog seeded with the current wql filter. On
     * save the filter is stored and the change is persisted so the next load
     * applies it.
     */
    _openBoardSettings() {
        if (!this._settingsDialog) {
            this._settingsDialog = new webexpress.webui.KanbanBoardSettings();
        }

        const settings = { filter: this._filter || "" };
        this._settingsDialog.open(settings, () => {
            this._filter = settings.filter;
            this._dispatchBoardSettings();
        });
    }

    /**
     * Dispatches a board-settings change so the REST layer can persist the wql
     * filter and re-query the board.
     */
    _dispatchBoardSettings() {
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
            id: this._element ? this._element.id : null,
            action: "settings",
            filter: this._filter || ""
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

        // restore the selection state: render() rebuilds every card, so the active
        // marker has to come from the retained id rather than from the old element
        if (this._selectable && this._selectedCardId != null && String(card.id) === this._selectedCardId) {
            cardEl.classList.add("active", webexpress.webui.KanbanCtrl.ACTIVE_CLASS);
            cardEl.setAttribute("aria-selected", "true");
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

        // build card header
        const header = document.createElement("div");
        header.className = "card-header";
        const title = document.createElement("div");
        title.className = "card-title";
        title.textContent = card.label;
        header.appendChild(title);

        // optional trailing badge in the card header (e.g. a ticket number or an
        // age), coloured by a css class or an inline style
        const cardBadge = this._makeBadge(card, "wx-kanban-card-badge");
        if (cardBadge) {
            header.appendChild(cardBadge);
        }

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
