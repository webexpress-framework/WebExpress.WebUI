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

    // board "…" menu (add column / add widget) and per-widget settings
    _addableColumn = false;
    _addableWidget = false;
    _configurableWidget = false;
    _settingsDialog = null;
    _onDocClick = null;

    // the widget types offered in the add menu, supplied by the REST layer; the
    // base leaves it empty so a standalone board offers nothing until told
    _availableWidgets = [];

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

        // board menu capabilities; the offered widget types are derived from the
        // client widget registry, so no server-authored list is needed
        this._addableColumn = element.dataset.addableColumn === "true";
        this._addableWidget = element.dataset.addableWidget === "true";
        this._configurableWidget = element.dataset.configurableWidget === "true";

        // a single document listener closes any open board/widget dropdown when
        // the click lands outside its own menu container
        this._onDocClick = (e) => this._closeMenusOnOutsideClick(e);
        document.addEventListener("click", this._onDocClick);

        this._parseStaticConfig();
        this.render();
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
     * Closes every open board or widget dropdown whose container does not
     * contain the click target, so only a menu the user is interacting with
     * stays open.
     * @param {MouseEvent} e - The document click event.
     */
    _closeMenusOnOutsideClick(e) {
        const menus = this._element.querySelectorAll(".wx-dashboard-menu > .dropdown-menu.show");
        for (let i = 0; i < menus.length; i++) {
            const container = menus[i].closest(".wx-dashboard-menu");
            if (container && !container.contains(e.target)) {
                menus[i].classList.remove("show");
                container.classList.remove("wx-menu-open");
            }
        }
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

        // the board "…" menu shares the tab-add look and feel and gathers the
        // add-column and add-widget affordances above the columns
        const menuBar = this._buildBoardMenu();
        if (menuBar) {
            el.appendChild(menuBar);
        }

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

                const titleText = document.createElement("span");
                titleText.className = "wx-board-col-title";
                titleText.textContent = colTitle;
                titleEl.appendChild(titleText);

                // the column color tints the header underline so the column reads
                // as a labelled, colored lane
                if (colData.color) {
                    titleEl.style.borderBottomColor = colData.color;
                    titleEl.classList.add("wx-board-col-has-color");
                }

                this._decorateColumnHeader(titleEl, colIdx);
                wrapperEl.appendChild(titleEl);
            }

            const laneEl = document.createElement("div");
            laneEl.className = "wx-dashboard-lane";
            laneEl.dataset.columnIndex = colIdx;
            laneEl.dataset.columnId = colData.id;

            // the lane is always a drop target: a drop only acts while a movable
            // widget is being dragged, and gating this on a per-column flag left
            // empty columns (including freshly added ones) unable to receive widgets
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
     * Builds the board "…" menu bar carrying the add-column entry and the
     * add-widget entries. Returns null when neither affordance is enabled, so
     * the board stays unchanged for read-only dashboards. The button toggles a
     * dropdown that mirrors the tab add (+) control.
     * @returns {HTMLElement|null} The menu bar, or null when no menu is offered.
     */
    _buildBoardMenu() {
        if (!this._addableColumn && !this._addableWidget) {
            return null;
        }

        const bar = document.createElement("div");
        bar.className = "wx-dashboard-toolbar";

        const container = document.createElement("div");
        container.className = "wx-dashboard-menu position-relative";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "wx-dashboard-menu-btn";
        button.title = this._i18n("webexpress.webapp:dashboard.menu", "Options");
        button.setAttribute("aria-label", button.title);
        button.innerHTML = `<i class="${this._iconClass("fas fa-ellipsis-vertical", "more")}"></i>`;

        const menu = document.createElement("ul");
        menu.className = "dropdown-menu dropdown-menu-end";

        if (this._addableColumn) {
            menu.appendChild(this._buildMenuEntry(
                this._iconClass("fas fa-table-columns", "table-columns"),
                this._i18n("webexpress.webapp:column.add", "New column"),
                null,
                () => this._addColumn()
            ));
        }

        if (this._addableWidget) {
            const widgets = this._availableWidgets || [];

            if (widgets.length > 0) {
                if (this._addableColumn) {
                    const divider = document.createElement("li");
                    divider.innerHTML = "<hr class=\"dropdown-divider\">";
                    menu.appendChild(divider);
                }

                const heading = document.createElement("li");
                heading.className = "dropdown-header";
                heading.textContent = this._i18n("webexpress.webapp:dashboard.widget.add", "Add item");
                menu.appendChild(heading);

                for (let i = 0; i < widgets.length; i++) {
                    const widget = widgets[i];
                    // the REST entry defines availability; its display falls back
                    // to the registered widget definition when not overridden
                    const definition = webexpress.webui.DashboardWidgets.get(widget.id) || {};
                    const iconClass = widget.icon || definition.icon;
                    const icon = iconClass ? webexpress.webui.IconTheme.resolveFa(iconClass) : null;
                    menu.appendChild(this._buildMenuEntry(
                        icon,
                        widget.title || definition.title || widget.id,
                        widget.description || definition.description || null,
                        () => this._addWidget(widget.id)
                    ));
                }
            }
        }

        // an enabled add-widget menu with no registered items would render an
        // empty dropdown, so drop the whole bar when nothing can be added
        if (menu.children.length === 0) {
            return null;
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
     * optional description line, mirroring the tab template chooser.
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
     * Toggles a dropdown menu, closing any other open dashboard menu first so
     * only one stays open at a time.
     * @param {HTMLElement} menu - The dropdown menu element.
     */
    _toggleMenu(menu) {
        const willShow = !menu.classList.contains("show");
        this._closeAllMenus();
        if (willShow) {
            menu.classList.add("show");
            // the open class keeps the hover-only trigger visible while the menu
            // is open, even once the pointer leaves the header or card
            const container = menu.closest(".wx-dashboard-menu");
            if (container) {
                container.classList.add("wx-menu-open");
            }
        }
    }

    /**
     * Closes every open board, column or widget dropdown of this dashboard.
     */
    _closeAllMenus() {
        const menus = this._element.querySelectorAll(".wx-dashboard-menu > .dropdown-menu.show");
        for (let i = 0; i < menus.length; i++) {
            menus[i].classList.remove("show");
        }
        const open = this._element.querySelectorAll(".wx-dashboard-menu.wx-menu-open");
        for (let i = 0; i < open.length; i++) {
            open[i].classList.remove("wx-menu-open");
        }
    }

    /**
     * Appends a new empty column and persists the new column layout. When the
     * headers are editable the new column is named from a translated default so
     * it is visible immediately and can be renamed inline afterwards.
     */
    _addColumn() {
        const label = this._i18n("webexpress.webapp:column.new", "New column");
        this._columns.push({
            id: "col_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            title: label,
            label: label,
            size: "1fr",
            color: null,
            widgets: []
        });

        // fixed sizes (e.g. 33%) keep the existing columns from making room for
        // the new one, so rebalance every column to an equal fraction
        for (let i = 0; i < this._columns.length; i++) {
            this._columns[i].size = "1fr";
        }

        this.render();
        this._dispatchColumnChange();
    }

    /**
     * Adds a widget of the given type to the board and persists the change. The
     * widget lands in the first column; when the board has no column yet and
     * columns may be added, one is created first so the widget has a home.
     * @param {string} widgetId - The registered widget type id.
     */
    _addWidget(widgetId) {
        if (!widgetId) {
            return;
        }

        // only widgets the REST layer marks available may be used on the board
        const available = this._availableWidgets || [];
        if (!available.some((w) => w.id === widgetId)) {
            return;
        }

        if (this._columns.length === 0) {
            if (!this._addableColumn) {
                return;
            }
            this._addColumn();
        }

        const definition = webexpress.webui.DashboardWidgets.get(widgetId) || {};

        this._columns[0].widgets.push({
            instanceId: "wx_inst_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            id: widgetId,
            title: definition.title || null,
            icon: definition.icon || null,
            image: null,
            color: null,
            removable: definition.removable !== false,
            movable: definition.movable !== false,
            html: "",
            params: {}
        });

        this.render();
        this._dispatchChangeEvent("add");
    }

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
     * Clears the column drop indicators from every column header.
     */
    _clearColumnDropIndicators() {
        const marked = this._element.querySelectorAll(".wx-board-col-drop-before, .wx-board-col-drop-after");
        for (let i = 0; i < marked.length; i++) {
            marked[i].classList.remove("wx-board-col-drop-before", "wx-board-col-drop-after");
        }
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
        container.className = "wx-dashboard-menu wx-board-col-menu position-relative";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "wx-dashboard-menu-btn";
        button.title = this._i18n("webexpress.webapp:column.menu", "Column options");
        button.setAttribute("aria-label", button.title);
        button.innerHTML = `<i class="${this._iconClass("fas fa-ellipsis-vertical", "more")}"></i>`;

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
                this._iconClass("fas fa-pencil", "pen"),
                this._i18n("webexpress.webapp:column.edit", "Rename column"),
                null,
                () => this._startColumnEdit(headerEl, index)
            ));
            menu.appendChild(this._buildColumnSubmenuEntry(
                this._iconClass("fas fa-ruler", "expand"),
                this._i18n("webexpress.webapp:column.size", "Size"),
                (m) => this._populateColumnMenuSizes(m, headerEl, index)
            ));
            menu.appendChild(this._buildColumnSubmenuEntry(
                this._iconClass("fas fa-palette", "palette"),
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
                this._iconClass("fas fa-trash", "trash"),
                this._i18n("webexpress.webapp:column.delete", "Delete column"),
                null,
                () => this._deleteColumn(index)
            ));
        }
    }

    /**
     * Builds a drill-down entry that repopulates the menu in place with a
     * sub-level, keeping the dropdown open.
     * @param {string|null} iconClass - The resolved icon class.
     * @param {string} label - The entry label.
     * @param {Function} populate - Repopulates the menu; receives the menu element.
     * @returns {HTMLElement} The list item element.
     */
    _buildColumnSubmenuEntry(iconClass, label, populate) {
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
        chevron.className = this._iconClass("fas fa-chevron-right", "chevron-right") + " ms-auto ps-3";
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
     * Prepends the "back" entry that returns a drilled-down menu to its root.
     * @param {HTMLElement} menu - The dropdown menu element.
     * @param {HTMLElement} headerEl - The column header element.
     * @param {number} index - The column index.
     */
    _buildColumnMenuBack(menu, headerEl, index) {
        const li = document.createElement("li");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "dropdown-item text-muted d-flex align-items-center";
        button.innerHTML = `<i class="${this._iconClass("fas fa-chevron-left", "chevron-left")} me-2"></i>`;
        button.appendChild(document.createTextNode(this._i18n("webexpress.webapp:back", "Back")));
        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._populateColumnMenuRoot(menu, headerEl, index);
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
        menu.appendChild(this._buildColumnMenuBack(menu, headerEl, index));

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
        menu.appendChild(this._buildColumnMenuBack(menu, headerEl, index));

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
        check.className = active ? this._iconClass("fas fa-check", "check") : "";
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
            return { id: c.id, title: c.title ?? c.label ?? "", size: c.size, color: c.color ?? null };
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

        const widgetTitle = widgetData.title || widgetData.label || registeredWidget.title || "";
        const titleText = document.createElement("span");
        titleText.textContent = widgetTitle;
        titleArea.appendChild(titleText);

        leftArea.appendChild(titleArea);
        header.appendChild(leftArea);

        const rightArea = document.createElement("div");
        rightArea.className = "d-flex gap-2";

        // the widget "…" menu offers the type-dependent settings (name and color
        // plus any declared fields) and the delete entry; either affordance can
        // be absent, so the menu is skipped when it would be empty
        const canConfigure = this._configurableWidget && registeredWidget.configurable !== false;
        const canRemove = widgetData.removable !== false && registeredWidget.removable !== false;

        if (canConfigure || canRemove) {
            rightArea.appendChild(this._buildWidgetMenu(colIdx, widgetData, canConfigure, canRemove));
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
     * Builds the per-widget "…" kebab menu carrying the settings and delete
     * entries. The dropdown mirrors the board menu look and feel.
     * @param {number} colIdx - Index of the column the widget belongs to.
     * @param {Object} widgetData - The widget configuration object.
     * @param {boolean} canConfigure - Whether the settings entry is offered.
     * @param {boolean} canRemove - Whether the delete entry is offered.
     * @returns {HTMLElement} The menu container element.
     */
    _buildWidgetMenu(colIdx, widgetData, canConfigure, canRemove) {
        const container = document.createElement("div");
        container.className = "wx-dashboard-menu position-relative";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "wx-dashboard-menu-btn wx-dashboard-widget-menu-btn";
        button.title = this._i18n("webexpress.webapp:dashboard.widget.menu", "Options");
        button.setAttribute("aria-label", button.title);
        button.innerHTML = `<i class="${this._iconClass("fas fa-ellipsis-vertical", "more")}"></i>`;

        const menu = document.createElement("ul");
        menu.className = "dropdown-menu dropdown-menu-end";

        if (canConfigure) {
            menu.appendChild(this._buildMenuEntry(
                this._iconClass("fas fa-gear", "gear"),
                this._i18n("webexpress.webapp:dashboard.widget.settings", "Settings"),
                null,
                () => this._openWidgetSettings(colIdx, widgetData.instanceId)
            ));
        }

        if (canRemove) {
            menu.appendChild(this._buildMenuEntry(
                this._iconClass("fas fa-trash", "trash"),
                this._i18n("webexpress.webui:remove", "Remove"),
                null,
                () => this._removeWidget(colIdx, widgetData.instanceId)
            ));
        }

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._toggleMenu(menu);
        });

        container.appendChild(button);
        container.appendChild(menu);

        return container;
    }

    /**
     * Opens the settings dialog for a widget. The dialog always carries the
     * name and color and appends any type-specific fields the widget declares
     * through its settings schema. On save the widget re-renders and the change
     * is persisted.
     * @param {number} colIdx - Index of the column the widget belongs to.
     * @param {string} instanceId - Unique instance identifier of the widget.
     */
    _openWidgetSettings(colIdx, instanceId) {
        const column = this._columns[colIdx];
        const widget = column && column.widgets.find((w) => w.instanceId === instanceId);
        if (!widget) {
            return;
        }

        const definition = webexpress.webui.DashboardWidgets.get(widget.id) || {};

        if (!this._settingsDialog) {
            this._settingsDialog = new webexpress.webui.DashboardWidgetSettings();
        }

        this._settingsDialog.open(widget, definition, () => {
            this.render();
            this._dispatchChangeEvent("settings");
        });
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
     * @param {string} action - The type of change (e.g. "remove", "reorder", "add", "settings").
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

        // the board serialization carries the per-widget settings (name, color,
        // params) the legacy layout drops, so add and settings changes persist
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
            action: action,
            layout: structure,
            board: this._serializeBoard()
        });
    }

    /**
     * Serializes the full board - columns with their widgets including the
     * per-widget name, color and params - so the server can persist widget
     * additions, deletions and settings, not just the arrangement by type.
     * @returns {Array<object>} The board columns with their widgets.
     */
    _serializeBoard() {
        return this._columns.map((col) => {
            return {
                id: col.id,
                title: col.title ?? col.label ?? "",
                size: col.size,
                color: col.color ?? null,
                widgets: col.widgets.map((w) => {
                    return {
                        id: w.id,
                        title: w.title ?? w.label ?? null,
                        color: w.color ?? null,
                        params: w.params || {}
                    };
                })
            };
        });
    }
};

// register the class in the webapp controller namespace
webexpress.webui.Controller.registerClass("wx-webui-dashboard", webexpress.webui.DashboardCtrl);