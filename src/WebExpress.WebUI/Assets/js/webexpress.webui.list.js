/**
 * Flat list control.
 * The following events are triggered:
 *  - webexpress.webui.Event.ROW_REORDER_EVENT          // emitted after reorder with new/previous order
 *  - webexpress.webui.Event.MOVE_EVENT                 // also used with action: "delete"
 *  - webexpress.webui.Event.SELECT_ITEM_EVENT          // emitted when an item is selected
 *  - webexpress.webui.Event.SORT_CHANGE_EVENT          // emitted when sort direction changes
 *  - webexpress.webui.Event.START_INLINE_EDIT_EVENT    // integration only
 *  - webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT     // integration only
 *  - webexpress.webui.Event.END_INLINE_EDIT_EVENT      // integration only
 */
webexpress.webui.ListCtrl = class extends webexpress.webui.Ctrl {

    // core elements
    _list = document.createElement("ul");

    // header elements (title + sort)
    _headerEl = null;
    _sortBtnEl = null;
    _sortIndicatorEl = null;

    // data
    _items = [];
    _options = [];

    // flags / features
    _movableItem = false;
    _hasOptions = false;
    _deletable = false;
    _deleteConfirm = false;
    _deleteLabel = "Delete";
    _deleteTitle = "Delete item";
    _selectable = false;

    // title / sort
    _title = null;
    _sortable = false;
    _sortField = "content.content";
    _sortDir = null;   // null | "asc" | "desc"

    // drag state
    _draggedItem = null;
    _itemPlaceholder = null;
    _itemDragActive = false;
    _autoScrollInterval = null;
    _lastPointerY = null;
    _dragInsertIndex = null;
    _dragBound = false;

    // persistence
    _persistKey = null;
    _saveDebounceTimer = null;

    // change detection / highlighting
    _prevItemState = new Map();
    _initialized = false;

    // change flash control
    _highlightChanges = true;
    _suppressFlashOnce = false;

    // selection state
    _selectedItem = null;
    _autoSelected = false;

    /**
     * Creates a new list control instance.
     * @param {HTMLElement} element Root element.
     */
    constructor(element) {
        super(element);

        // dataset / flags
        const ds = element.dataset;
        this._movableItem = ds.movableItem === "true";
        this._persistKey = ds.persistKey || element.id || null;
        this._deletable = ds.deletable === "true";
        this._deleteConfirm = ds.deleteConfirm === "true";
        this._deleteLabel = ds.deleteLabel || "Delete";
        this._deleteTitle = ds.deleteTitle || "Delete item";
        this._selectable = ds.selectable === "true";
        this._title = ds.title || null;
        this._sortable = ds.sortable === "true";
        this._sortField = ds.sortField || "content.content";
        const layout = ds.layout || "list"; // "list" | "grid"

        // parse declarative config
        this._options = this._parseOptions(element.querySelector(":scope > .wx-list-options"));
        this._items = this._parseItems(element.querySelectorAll(":scope > .wx-list-item, :scope > .wx-list-item-link, :scope > .wx-list-item-button"));

        // load persisted state (order by id)
        this._loadStateFromCookie();

        // cleanup attributes
        this._cleanupAttributes(element, [
            "data-movable-item",
            "data-persist-key",
            "data-deletable",
            "data-delete-confirm",
            "data-delete-label",
            "data-delete-title",
            "data-selectable",
            "data-title",
            "data-sortable",
            "data-sort-field",
            "data-layout"
        ]);

        element.className = "wx-list";
        if (this._selectable) {
            element.classList.add("wx-list-selectable");
        }

        if (layout) {
            layout.split(" ").forEach(cls => this._list.classList.add(cls));
        }

        // build header if title or sorting is requested
        if (this._title !== null || this._sortable) {
            this._headerEl = this._buildHeader();
        }

        // mount
        if (this._headerEl) {
            element.replaceChildren(this._headerEl, this._list);
        } else {
            element.replaceChildren(this._list);
        }

        // initial render
        this.render();

        // setup event delegation
        this._setupEventDelegation();

        // inline editing integration
        this._bindInlineEditSaveListener();

        // auto-select the first item on init when the list is selectable, and
        // trigger its primary action so paired panels populate immediately.
        if (this._selectable && !this._autoSelected && this._items.length > 0 && this._selectedItem === null) {
            this._autoSelected = true;
            const firstItem = this._items[0];
            this._handleSelectionChange(firstItem, null, true);
            this._triggerPrimaryAction(firstItem);
        }
    }

    /**
     * Triggers the item's `data-wx-primary-action` via the central Actions
     * registry so callers don't have to dispatch synthetic clicks.
     * @param {Object} item Data item whose anchor element carries the action.
     */
    _triggerPrimaryAction(item) {
        const el = item?._anchorLi;
        if (!el) {
            return;
        }
        const actionName = el.getAttribute("data-wx-primary-action");
        if (!actionName) {
            return;
        }
        const actionDef = webexpress?.webui?.Actions?.get?.(actionName);
        if (!actionDef || typeof actionDef.execute !== "function") {
            return;
        }
        try {
            actionDef.execute(el, "primary", this, null);
        } catch (e) {
            console.error("list: primary action execute failed", e);
        }
    }

    /**
     * Enables flashing highlight of changed items.
     */
    enableChangeFlash() {
        this._highlightChanges = true;
    }

    /**
     * Disables flashing highlight of changed items.
     */
    disableChangeFlash() {
        this._highlightChanges = false;
    }

    /**
     * Sets flashing highlight enabled state.
     * @param {boolean} enabled True to enable, false to disable.
     */
    setChangeFlash(enabled) {
        this._highlightChanges = !!enabled;
    }

    /**
     * Suppresses flashing for the next render cycle only.
     */
    suppressNextChangeFlash() {
        this._suppressFlashOnce = true;
    }

    /**
     * Gets the current header title text.
     * @returns {string|null}
     */
    get title() {
        return this._title;
    }

    /**
     * Sets the header title text and re-renders the header.
     * @param {string|null} value
     */
    set title(value) {
        this._title = value ?? null;
        this._syncHeader();
    }

    /**
     * Gets the current sort direction.
     * @returns {"asc"|"desc"|null}
     */
    get sortDir() {
        return this._sortDir;
    }

    /**
     * Programmatically sets the sort direction and re-renders.
     * @param {"asc"|"desc"|null} value
     */
    set sortDir(value) {
        if (value !== "asc" && value !== "desc" && value !== null) {
            return;
        }
        this._sortDir = value;
        this._applySortAndRender();
    }

    /**
     * Selects an item programmatically by its ID.
     * @param {string} itemId The ID of the item to select.
     * @param {boolean} [dispatch=true] Whether to dispatch the selection event.
     */
    selectItem(itemId, dispatch = true) {
        const item = this._items.find(it => it.id === itemId);
        if (item) {
            this._handleSelectionChange(item, null, dispatch);
        } else {
            // deselect if ID not found or null passed
            this._handleSelectionChange(null, null, dispatch);
        }
    }

    /**
     * Renders the list view, applying diff highlight when enabled.
     */
    render() {
        // create snapshot for diffing
        const currentStates = this._collectCurrentItemStates();
        const allowDiff = this._initialized;
        const changes = allowDiff ? this._detectChangedItems(currentStates) : [];
        const allowFlash = allowDiff && this._highlightChanges && !this._suppressFlashOnce;

        this._renderItems();

        if (allowFlash && changes.length > 0) {
            // flash items after a short delay to ensure DOM is ready and transition triggers
            requestAnimationFrame(() => {
                changes.forEach(item => this._flashItem(item));
            });
        }

        if (this._suppressFlashOnce) {
            this._suppressFlashOnce = false;
        }

        this._updateSnapshot(currentStates);

        if (!this._initialized) {
            this._initialized = true;
        }
    }

    /**
     * Clears the list.
     */
    clear() {
        this._list.replaceChildren();
        this._items = [];
        this._selectedItem = null;
    }

    /**
     * Sets new item definitions.
     * @param {Array<Object|string>} items Item definitions.
     */
    setItems(items) {
        if (!Array.isArray(items)) {
            return;
        }
        this._items = this._normalizeItems(items);
        this._selectedItem = null; // reset selection on full update
        this._schedulePersist();
        this.render();
    }

    /**
     * Inserts a new item.
     * @param {Object|string} itemData Item object or text.
     * @param {number|null} [index=null] Index.
     * @returns {Object|null} Inserted item or null.
     */
    insertItem(itemData, index = null) {
        const item = this._buildItem(itemData);
        if (index === null || index < 0 || index > this._items.length) {
            index = this._items.length;
        }
        this._items.splice(index, 0, item);
        this._schedulePersist();
        this.render();
        return item;
    }

    /**
     * Deletes an item by id.
     * @param {string} itemId Item id.
     * @returns {boolean} True if removed.
     */
    deleteItem(itemId) {
        if (!itemId) {
            return false;
        }
        const idx = this._items.findIndex(it => it.id === itemId);
        if (idx === -1) {
            return false;
        }
        return this._deleteItemByIndex(idx);
    }

    /**
     * Deletes an item by index (0-based).
     * @param {number} index Index of the item to remove.
     * @returns {boolean} True if removed.
     */
    deleteItemAt(index) {
        if (typeof index !== "number" || index < 0 || index >= this._items.length) {
            return false;
        }
        return this._deleteItemByIndex(index);
    }

    /**
     * Helper to remove attributes cleanly.
     * @param {HTMLElement} element Target element.
     * @param {Array<string>} attributes List of attributes to remove.
     */
    _cleanupAttributes(element, attributes) {
        attributes.forEach(attr => element.removeAttribute(attr));
    }

    /**
     * Setup event delegation for static list events (like delete).
     */
    _setupEventDelegation() {
        this._list.addEventListener("click", (e) => {
            const target = e.target;

            // 1. handle delete button click
            if (target.closest(".wx-list-delete")) {
                e.preventDefault();
                e.stopPropagation();

                const li = target.closest("li");
                const item = li?._dataItemRef;

                if (item) {
                    if (this._deleteConfirm) {
                        const ok = window.confirm(this._i18n("webexpress.webui:list.delete.confirm", "Delete this item?"));
                        if (!ok) {
                            return;
                        }
                    }
                    this._deleteItemInternal(item);
                }
                return;
            }

            // 2. handle selection click (if enabled and not clicking interactive elements)
            if (this._selectable) {
                // allow clicks on item-wrapper link/button elements; block other interactive elements
                const isItemWrapper = target.closest(".wx-list-item-link-el, .wx-list-item-button-el");
                if (!isItemWrapper && target.closest("input, button, a, .dropdown-menu, .wx-list-options")) {
                    return;
                }

                const li = target.closest("li.wx-list-li");
                const item = li?._dataItemRef;

                if (item) {
                    this._handleSelectionChange(item, e);
                }
            }
        });
    }

    /**
     * Handles internal logic for changing selection.
     * @param {Object|null} item The item to select, or null to deselect.
     * @param {Event} [originalEvent=null] The DOM event that triggered selection.
     * @param {boolean} [dispatch=true] Whether to fire the event.
     */
    _handleSelectionChange(item, originalEvent = null, dispatch = true) {
        // remove active class from previous
        if (this._selectedItem && this._selectedItem._anchorLi) {
            this._selectedItem._anchorLi.classList.remove("active", "wx-list-li-active");
            this._selectedItem._anchorLi.removeAttribute("aria-selected");
        }

        this._selectedItem = item;

        // add active class and highlight border to new selection
        if (this._selectedItem && this._selectedItem._anchorLi) {
            this._selectedItem._anchorLi.classList.add("active", "wx-list-li-active");
            this._selectedItem._anchorLi.setAttribute("aria-selected", "true");
        }

        if (dispatch) {
            this._dispatch(webexpress.webui.Event.SELECT_ITEM_EVENT, {
                item: this._selectedItem,
                itemId: this._selectedItem?.id || null,
                originalEvent: originalEvent
            });
        }
    }

    /**
     * Parses global option items.
     * @param {HTMLElement|null} optionsDiv Container element.
     * @returns {Array<Object>} Option list.
     */
    _parseOptions(optionsDiv) {
        if (!optionsDiv) {
            return [];
        }
        const list = [];
        for (const div of optionsDiv.children) {
            const cl = div.classList;
            if (cl.contains("wx-dropdown-divider") || cl.contains("wx-dropdownbutton-divider")) {
                list.push({ type: "divider" });
            } else if (cl.contains("wx-dropdown-header") || cl.contains("wx-dropdownbutton-header")) {
                list.push({ type: "header", content: div.textContent.trim(), icon: div.dataset.icon || null });
            } else {
                const ds = div.dataset;
                list.push({
                    id: div.id || null,
                    image: ds.image || null,
                    icon: ds.icon || null,
                    linkColor: ds.linkcolor || null,
                    uri: ds.uri || ds.url || null,
                    target: ds.target || null,
                    tooltip: ds.tooltip || null,
                    modal: ds.modal || null,
                    content: div.textContent.trim() || null,
                    disabled: div.hasAttribute("disabled"),
                    // action attributes
                    primaryAction: Object.fromEntries(Object.entries(dataset)
                        .filter(([k]) => k.startsWith("wxPrimary"))
                        .map(([k, v]) => [
                            k.slice(9).replace(/^./, c => c.toLowerCase()),
                            v === "true" ? true : v === "false" ? false : v
                        ])
                    ),
                    secondaryAction: Object.fromEntries(Object.entries(dataset)
                        .filter(([k]) => k.startsWith("wxSecondary"))
                        .map(([k, v]) => [
                            k.slice(9).replace(/^./, c => c.toLowerCase()),
                            v === "true" ? true : v === "false" ? false : v
                        ])
                    ),
                    // bind
                    bind: {
                        source: div.dataset.wxSource || null,
                    }
                });
            }
        }
        return list;
    }

    /**
     * Parses flat items (top-level only).
     * @param {NodeList|Array} itemDivs Item elements.
     * @returns {Array<Object>} Parsed items.
     */
    _parseItems(itemDivs) {
        const items = [];
        for (const div of itemDivs) {
            if (!(div instanceof HTMLElement)) {
                continue;
            }
            const cl = div.classList;
            let itemType = "default";
            if (cl.contains("wx-list-item-link")) {
                itemType = "link";
            } else if (cl.contains("wx-list-item-button")) {
                itemType = "button";
            } else if (!cl.contains("wx-list-item")) {
                continue;
            }
            const ds = div.dataset;

            // extract renderer type and options
            const typeEl = div.querySelector(":scope > [data-type], :scope > template[data-type]");
            const rendererType = typeEl?.dataset.type || ds.type || null;
            const rendererOptions = typeEl ? Object.assign({}, typeEl.dataset) : Object.assign({}, ds);

            // if template has children, pass them as options
            if (typeEl) {
                const src = (typeEl.tagName === "TEMPLATE") ? typeEl.content.children : typeEl.children;
                if (src.length) {
                    rendererOptions.children = Array.from(src);
                }
            }

            const item = {
                id: div.id || null,
                class: div.className || null,
                style: div.getAttribute("style") || null,
                content: div.textContent.trim(),
                image: ds.image || null,
                icon: ds.icon || null,
                uri: ds.uri || ds.href || null,
                colorCss: ds.colorCss || null,
                colorStyle: ds.colorStyle || null,
                bgColorCss: ds.bgcolorCss || null,
                bgColorStyle: ds.bgcolorStyle || null,
                target: ds.target || null,
                itemType: itemType,
                disabled: div.hasAttribute("disabled") || ds.disabled === "true",
                options: null,
                _anchorLi: null
            };

            const optionsContainer = div.querySelector(":scope > .wx-list-options");
            if (optionsContainer) {
                item.options = this._parseOptions(optionsContainer);
                if (item.options.length > 0) {
                    this._hasOptions = true;
                }
            }
            items.push(item);
        }
        return items;
    }

    /**
     * Normalizes raw item array.
     * @param {Array<Object|string>} items Raw items.
     * @returns {Array<Object>} Normalized.
     */
    _normalizeItems(items) {
        return items.map(it => this._buildItem(it));
    }

    /**
     * Builds a single item from raw data.
     * @param {Object|string} data Raw.
     * @returns {Object} Item.
     */
    _buildItem(data) {
        if (typeof data === "string") {
            return {
                id: null,
                class: null,
                style: null,
                colorCss: null,
                colorStyle: null,
                bgColorCss: null,
                bgColorStyle: null,
                editable: false,
                rendererType: null,
                rendererOptions: {},
                content: { content: data },
                itemType: "default",
                disabled: false,
                options: null,
                _anchorLi: null
            };
        }
        return {
            id: data.id || null,
            class: data.class || null,
            style: data.style || null,
            colorCss: data.colorCss || null,
            colorStyle: data.colorStyle || null,
            bgColorCss: data.bgColorCss || null,
            bgColorStyle: data.bgColorStyle || null,
            editable: !!data.editable,
            rendererType: data.rendererType || data.type || null,
            rendererOptions: data.rendererOptions || {},
            content: (data.content && typeof data.content === "object")
                ? data.content
                : { content: String(data?.content ?? "") },
            itemType: data.itemType || "default",
            disabled: !!data.disabled,
            uri: data.uri || data.href || null,
            target: data.target || null,
            options: Array.isArray(data.options) ? data.options : null,
            _anchorLi: null,
            // action attributes
            primaryAction: data.primaryAction,
            secondaryAction: data.secondaryAction,
            bind: data.bind,
        };
    }

    /**
     * Builds the sticky header element (title label + optional sort button).
     * @returns {HTMLElement} The header div.
     */
    _buildHeader() {
        const header = document.createElement("div");
        header.className = "wx-list-header";

        const titleEl = document.createElement("span");
        titleEl.className = "wx-list-header-title";
        titleEl.textContent = this._title ?? "";
        header.appendChild(titleEl);

        if (this._sortable) {
            const sortBtn = document.createElement("button");
            sortBtn.type = "button";
            sortBtn.className = "wx-list-sort-btn btn btn-link btn-sm p-0";
            sortBtn.title = this._i18n("webexpress.webui:list.sort.title", "Sort");
            sortBtn.setAttribute("aria-label", this._i18n("webexpress.webui:list.sort.title", "Sort"));
            sortBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M6 12h12M10 18h4"/></svg>`;

            // sort indicator arrow (hidden when _sortDir === null)
            const indicator = document.createElement("span");
            indicator.className = "wx-list-sort-indicator";
            indicator.setAttribute("aria-hidden", "true");
            sortBtn.appendChild(indicator);
            this._sortIndicatorEl = indicator;

            sortBtn.addEventListener("click", () => this._cycleSortDir());
            header.appendChild(sortBtn);
            this._sortBtnEl = sortBtn;
        }

        return header;
    }

    /**
     * Syncs the header DOM to the current `_title` / `_sortable` state.
     * Creates the header if it does not exist yet; removes it if both are absent.
     */
    _syncHeader() {
        if (this._title !== null || this._sortable) {
            if (!this._headerEl) {
                this._headerEl = this._buildHeader();
                this._element.prepend(this._headerEl);
            } else {
                const titleEl = this._headerEl.querySelector(".wx-list-header-title");
                if (titleEl) {
                    titleEl.textContent = this._title ?? "";
                }
            }
        } else if (this._headerEl) {
            this._headerEl.remove();
            this._headerEl = null;
            this._sortBtnEl = null;
            this._sortIndicatorEl = null;
        }

        this._updateSortIndicator();
    }

    /**
     * Cycles sort direction: null → "asc" → "desc" → null.
     */
    _cycleSortDir() {
        if (this._sortDir === null) {
            this._sortDir = "asc";
        } else if (this._sortDir === "asc") {
            this._sortDir = "desc";
        } else {
            this._sortDir = null;
        }
        this._applySortAndRender();
    }

    /**
     * Updates the sort indicator arrow and aria-pressed state.
     */
    _updateSortIndicator() {
        if (!this._sortBtnEl) {
            return;
        }

        this._sortBtnEl.setAttribute("aria-pressed", this._sortDir !== null ? "true" : "false");
        this._sortBtnEl.dataset.sortDir = this._sortDir ?? "";

        if (this._sortIndicatorEl) {
            if (this._sortDir === "asc") {
                this._sortIndicatorEl.textContent = " ▴";
            } else if (this._sortDir === "desc") {
                this._sortIndicatorEl.textContent = " ▾";
            } else {
                this._sortIndicatorEl.textContent = "";
            }
        }
    }

    /**
     * Reads a nested property value from an item using dot-notation path.
     * Example path: "content.content"
     * @param {Object} item The item object.
     * @param {string} path Dot-notation path.
     * @returns {string} The resolved value (coerced to string) or "".
     */
    _getNestedValue(item, path) {
        const parts = (path || "").split(".");
        let val = item;
        for (const p of parts) {
            if (val == null) {
                return "";
            }
            val = val[p];
        }
        return String(val ?? "").toLowerCase();
    }

    /**
     * Applies the current sort direction to the item array, then calls render().
     * Dispatches SORT_CHANGE_EVENT.
     */
    _applySortAndRender() {
        this._updateSortIndicator();

        if (this._sortDir !== null) {
            const dir = this._sortDir === "asc" ? 1 : -1;
            const field = this._sortField;
            this._items.sort((a, b) => {
                const va = this._getNestedValue(a, field);
                const vb = this._getNestedValue(b, field);
                return va < vb ? -dir : va > vb ? dir : 0;
            });
        }

        this._dispatch(webexpress.webui.Event.SORT_CHANGE_EVENT ?? "wx:sort-change", {
            sortDir: this._sortDir,
            sortField: this._sortField
        });

        this.render();
    }

    /**
     * Renders list items into the UL.
     */
    _renderItems() {

        this._list.innerHTML = "";

        for (const it of this._items) {
            const li = document.createElement("li");
            li.className = "wx-list-li";

            // restore selection state
            if (this._selectedItem === it) {
                li.classList.add("active", "wx-list-li-active");
                li.setAttribute("aria-selected", "true");
            }

            if (it.colorCss) {
                li.classList.add(it.colorCss);
            }
            if (it.bgColorCss) {
                li.classList.add(it.bgColorCss);
            }
            if (it.colorStyle) {
                li.cssText += it.colorStyle;
            }
            if (it.bgColorStyle) {
                li.cssText += it.bgColorStyle;
            }

            // apply action attributes
            if (it.primaryAction) {
                for (const [key, value] of Object.entries(it.primaryAction)) {
                    if (value) {
                        const htmlName = `data-wx-primary-${key.toLowerCase()}`;
                        li.setAttribute(htmlName, value);
                    }
                }
            }

            if (it.secondaryAction) {
                for (const [key, value] of Object.entries(it.secondaryAction)) {
                    if (value) {
                        const htmlName = `data-wx-secondary-${key.toLowerCase()}`;
                        li.setAttribute(htmlName, value);
                    }
                }
            }

            li._dataItemRef = it;
            it._anchorLi = li;

            if (this._movableItem) {
                const handle = document.createElement("span");
                handle.className = "wx-list-drag-handle user-select-none";
                handle.textContent = "⠿";
                handle.title = this._i18n("webexpress.webui:list.handle.title", "Move");
                handle.setAttribute("aria-label", "Move item");
                handle.setAttribute("tabindex", "0");
                handle.setAttribute("role", "button");
                li.appendChild(handle);
                this._enableDragAndDropItem(handle, it);
            }

            // build content wrapper — for link/button types wrap inside the action element
            let actionEl = null;
            if (it.itemType === "link") {
                actionEl = document.createElement("a");
                actionEl.className = "wx-list-item-link-el list-group-item list-group-item-action";
                actionEl.href = it.uri || "#";
                if (it.target) {
                    actionEl.target = it.target;
                }
                if (it.disabled) {
                    actionEl.classList.add("disabled");
                    actionEl.setAttribute("aria-disabled", "true");
                    actionEl.removeAttribute("href");
                }
            } else if (it.itemType === "button") {
                actionEl = document.createElement("button");
                actionEl.type = "button";
                actionEl.className = "wx-list-item-button-el list-group-item list-group-item-action";
                if (it.disabled) {
                    actionEl.classList.add("disabled");
                    actionEl.setAttribute("aria-disabled", "true");
                    actionEl.disabled = true;
                }
            }

            const body = document.createElement("div");
            body.className = "wx-list-body d-flex align-items-center gap-2 flex-grow-1";

            // content wrapper
            const contentWrap = document.createElement("span");
            contentWrap.className = "wx-list-content";

            // 1. check for specific TableTemplate Renderer
            if (it.rendererType && webexpress.webui.TableTemplates) {
                const tmpl = webexpress.webui.TableTemplates.get(it.rendererType);
                if (tmpl) {
                    try {
                        // merge options: item options + edit state + objectId
                        const opts = Object.assign({}, it.rendererOptions || {});
                        if (it.editable) opts.editable = true;

                        // fake column/cell structure for compatibility with TableTemplates
                        const fakeCell = { content: it.content?.content };

                        // invoke renderer
                        const result = tmpl.fn(it.content?.content, this, it, fakeCell, it.id || "list_item", opts);

                        if (result instanceof Node) {
                            contentWrap.appendChild(result);
                        } else {
                            contentWrap.innerHTML = String(result ?? "");
                        }
                    } catch (e) {
                        console.error("ListCtrl renderer error:", e);
                        contentWrap.textContent = this._i18n("webexpress.webui:list.renderer.error", "Renderer Error");
                    }
                    body.appendChild(contentWrap);
                } else {
                    // fallback if renderer not found
                    this._renderDefaultContent(it, contentWrap, body);
                }
            } else {
                // 2. default Rendering logic
                this._renderDefaultContent(it, contentWrap, body);
            }

            if (actionEl) {
                actionEl.appendChild(body);
                li.appendChild(actionEl);
            } else {
                li.appendChild(body);
            }

            // options or delete button
            if (it.options && it.options.length) {
                const opt = document.createElement("div");
                opt.dataset.icon = "fas fa-cog";
                opt.dataset.size = "btn-sm";
                opt.dataset.border = "false";
                new webexpress.webui.DropdownCtrl(opt).items = it.options;
                li.appendChild(opt);
            } else if (this._deletable) {
                const delBtn = document.createElement("button");
                delBtn.type = "button";
                delBtn.className = "btn btn-link btn-sm text-danger wx-list-delete";
                delBtn.title = this._deleteTitle;
                delBtn.setAttribute("aria-label", this._deleteTitle);
                delBtn.textContent = this._deleteLabel;
                li.appendChild(delBtn);
            } else if (this._hasOptions || this._options.length > 0) {
                const placeholder = document.createElement("div");
                placeholder.className = "wx-list-options-placeholder";
                li.appendChild(placeholder);
            }

            this._list.appendChild(li);
        }
    }

    /**
     * Renders default content (image, icon, text/smartview) if no special renderer is used.
     * @param {Object} it Item.
     * @param {HTMLElement} contentWrap Wrapper element.
     * @param {HTMLElement} body Body element.
     */
    _renderDefaultContent(it, contentWrap, body) {
        if (it.image) {
            const img = document.createElement("img");
            img.className = "wx-icon";
            img.src = it.image;
            img.alt = "";
            img.loading = "lazy";
            contentWrap.appendChild(img);
        }
        if (it.icon) {
            const i = document.createElement("i");
            i.className = it.icon;
            contentWrap.appendChild(i);
        }

        const textContent = it.content || "";

        contentWrap.appendChild(document.createTextNode(textContent));
        body.appendChild(contentWrap);
    }

    /**
     * Deletes item by index and handles events/state.
     * @param {number} index Index to delete.
     * @returns {boolean} Success.
     */
    _deleteItemByIndex(index) {
        const item = this._items[index];
        this._items.splice(index, 1);

        // deselect if deleted
        if (this._selectedItem === item) {
            this._handleSelectionChange(null, null, true);
        }

        this._schedulePersist();
        this.render();
        return true;
    }

    /**
     * Internal delete helper to remove an item instance.
     * @param {Object} item The item to delete.
     */
    _deleteItemInternal(item) {
        const idx = this._items.indexOf(item);
        if (idx === -1) {
            return;
        }
        this._deleteItemByIndex(idx);
    }

    /**
     * Enables item drag & drop using handle (mouse + keyboard).
     * @param {HTMLElement} handle Handle element.
     * @param {Object} item Item object.
     */
    _enableDragAndDropItem(handle, item) {
        if (!this._movableItem) {
            return;
        }
        const li = handle.closest("li");

        // keyboard support
        handle.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                e.stopPropagation(); // prevent selection when dragging starts
                if (!this._itemDragActive) {
                    this._startItemDrag(li, item);
                } else {
                    this._finalizeItemDrag();
                }
            } else if (this._itemDragActive) {
                if (e.code === "ArrowUp" || e.code === "ArrowDown") {
                    e.preventDefault();
                    const delta = e.code === "ArrowUp" ? -1 : 1;
                    this._keyboardMovePlaceholder(delta);
                } else if (e.code === "Enter") {
                    e.preventDefault();
                    this._finalizeItemDrag();
                } else if (e.code === "Escape") {
                    e.preventDefault();
                    this._cancelItemDrag();
                }
            }
        });

        // mouse drag support
        handle.draggable = true;
        handle.addEventListener("dragstart", (e) => {
            this._startItemDrag(li, item);
            e.dataTransfer.effectAllowed = "move";
            const img = new Image();
            img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            e.dataTransfer.setDragImage(img, 0, 0);
        });

        handle.addEventListener("dragend", () => {
            if (this._itemDragActive) {
                this._finalizeItemDrag();
            }
        });

        // bind dragover/drop on list only once
        if (!this._dragBound) {
            this._list.addEventListener("dragover", (e) => this._onUlistDragOver(e));
            this._list.addEventListener("drop", (e) => {
                e.preventDefault();
                if (this._itemDragActive) {
                    this._finalizeItemDrag();
                }
            });
            this._dragBound = true;
        }
    }

    /**
     * Starts an item drag operation.
     * @param {HTMLLIElement} li Item element.
     * @param {Object} item Item object.
     */
    _startItemDrag(li, item) {
        this._draggedItem = item;
        this._itemDragActive = true;
        this._dragInsertIndex = null;

        li.classList.add("wx-list-dragging");

        // create placeholder
        const rect = li.getBoundingClientRect();
        this._itemPlaceholder = document.createElement("li");
        this._itemPlaceholder.className = "wx-list-drag-placeholder";
        this._itemPlaceholder.style.height = `${rect.height}px`;

        // insert placeholder after current item
        li.after(this._itemPlaceholder);

        // start autoscroll loop
        this._autoScrollInterval = setInterval(() => this._autoScrollCheck(), 30);
    }

    /**
     * Handles dragover events inside the UL for item dragging.
     * @param {DragEvent} e Event.
     */
    _onUlistDragOver(e) {
        if (!this._itemDragActive || !this._itemPlaceholder) {
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        this._lastPointerY = e.clientY;

        const li = e.target.closest("li");
        // if hovering over placeholder or nothing relevant, just update index
        if (!li || li === this._itemPlaceholder || li === this._draggedItem._anchorLi) {
            return;
        }

        if (!li._dataItemRef) {
            return;
        }

        const rect = li.getBoundingClientRect();
        const threshold = rect.top + (rect.height / 2);

        if (e.clientY < threshold) {
            // mouse in upper half -> insert before
            if (li.previousElementSibling !== this._itemPlaceholder) {
                li.before(this._itemPlaceholder);
            }
        } else {
            // mouse in lower half -> insert after
            if (li.nextElementSibling !== this._itemPlaceholder) {
                li.after(this._itemPlaceholder);
            }
        }
    }

    /**
     * Computes current placeholder index among items (excluding the dragged one).
     * @returns {number} Index.
     */
    _computePlaceholderIndex() {
        let idx = 0;
        const children = this._list.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child === this._itemPlaceholder) {
                return idx;
            }
            // skip the dragged item itself in index calculation
            if (child._dataItemRef && child._dataItemRef !== this._draggedItem) {
                idx++;
            }
        }
        return idx;
    }

    /**
     * Moves placeholder by keyboard within siblings.
     * @param {number} delta Direction (+/-).
     */
    _keyboardMovePlaceholder(delta) {
        const siblings = this._items.filter(it => it !== this._draggedItem);
        if (!siblings.length) {
            return;
        }

        let currentIndex = this._computePlaceholderIndex();
        let targetIndex = currentIndex + delta;

        // clamp index
        targetIndex = Math.max(0, Math.min(targetIndex, siblings.length));

        if (targetIndex === currentIndex) {
            return;
        }

        // move placeholder in DOM
        if (targetIndex >= siblings.length) {
            this._list.appendChild(this._itemPlaceholder);
        } else {
            const targetItem = siblings[targetIndex];
            if (targetItem && targetItem._anchorLi) {
                targetItem._anchorLi.before(this._itemPlaceholder);
            }
        }
    }

    /**
     * Performs auto-scroll during item drag.
     */
    _autoScrollCheck() {
        if (!this._itemDragActive || this._lastPointerY === null) {
            return;
        }

        const container = this._list.parentElement || document.scrollingElement;
        const rect = container.getBoundingClientRect();
        const threshold = 40;
        const scrollSpeed = 10;

        if (this._lastPointerY < rect.top + threshold) {
            container.scrollTop -= scrollSpeed;
        } else if (this._lastPointerY > rect.bottom - threshold) {
            container.scrollTop += scrollSpeed;
        }
    }

    /**
     * Finalizes item drag repositioning.
     */
    _finalizeItemDrag() {
        if (!this._itemDragActive) {
            return;
        }
        const li = this._draggedItem?._anchorLi;

        this._dragInsertIndex = this._computePlaceholderIndex();

        const prevOrder = [...this._items];
        const oldIndex = this._items.indexOf(this._draggedItem);

        if (oldIndex !== -1) {
            // remove from old position
            this._items.splice(oldIndex, 1);
            // insert at new position
            const insertIndex = Math.min(Math.max(this._dragInsertIndex, 0), this._items.length);
            this._items.splice(insertIndex, 0, this._draggedItem);

            // dispatch events only if index actually changed
            if (oldIndex !== insertIndex) {
                this._dispatch(webexpress.webui.Event.ROW_REORDER_EVENT, {
                    newOrder: this._items,
                    previousOrder: prevOrder
                });

                this._dispatch(webexpress?.webui?.Event?.MOVE_EVENT, {
                    kind: "item",
                    action: "move",
                    itemId: this._draggedItem?.id || null,
                    index: insertIndex
                });

                this._schedulePersist();
            }
        }

        this._cleanupItemDrag(li);
        this.render();
    }

    /**
     * Cancels current item drag.
     */
    _cancelItemDrag() {
        if (!this._itemDragActive) {
            return;
        }
        const li = this._draggedItem?._anchorLi;
        this._cleanupItemDrag(li);
        this.render();
    }

    /**
     * Cleans all temporary item drag state.
     * @param {HTMLLIElement|null} li Dragged item element.
     */
    _cleanupItemDrag(li) {
        this._itemPlaceholder?.remove();
        this._itemPlaceholder = null;

        if (li) {
            li.classList.remove("wx-list-dragging");
        }

        this._draggedItem = null;
        this._itemDragActive = false;
        this._lastPointerY = null;
        this._dragInsertIndex = null;

        if (this._autoScrollInterval) {
            clearInterval(this._autoScrollInterval);
            this._autoScrollInterval = null;
        }
    }

    /**
     * Binds inline edit SAVE event -> update snapshot + flash (if enabled).
     */
    _bindInlineEditSaveListener() {
        const evtName = webexpress?.webui?.Event?.SAVE_INLINE_EDIT_EVENT;
        if (!evtName) {
            return;
        }
        document.addEventListener(evtName, (e) => {
            const src = e.detail?.sender;
            if (!(src instanceof HTMLElement)) {
                return;
            }

            // verify this event belongs to an item in this list
            if (src.closest("ul") !== this._list) {
                return;
            }

            const li = src.closest("li");
            const item = li?._dataItemRef;
            if (!item) {
                return;
            }

            this._updateItemSnapshotFromDom(item);
            this._flashItem(item);
        });
    }

    /**
     * Updates snapshot entry for an item after edit.
     * @param {Object} item Item object.
     */
    _updateItemSnapshotFromDom(item) {
        const key = this._getItemKey(item);
        if (!key) {
            return;
        }
        const sig = this._computeItemSignature(item);
        this._prevItemState.set(key, sig);
    }

    /**
     * Schedules a debounced persist.
     */
    _schedulePersist() {
        if (!this._persistKey) {
            return;
        }
        if (this._saveDebounceTimer) {
            clearTimeout(this._saveDebounceTimer);
        }
        this._saveDebounceTimer = setTimeout(() => this._persistState(), 150);
    }

    /**
     * Persists state to cookie (order by id if all items have id).
     */
    _persistState() {
        if (!this._persistKey) {
            return;
        }
        // persist only if all items have IDs to ensure restoration works
        const allHaveIds = this._items.every(it => !!it.id);

        const state = {
            v: 1,
            order: allHaveIds ? this._items.map(it => it.id) : null
        };

        const json = encodeURIComponent(JSON.stringify(state));
        this._setCookie(this._persistKey, json, 365);
    }

    /**
     * Loads persisted state from cookie.
     */
    _loadStateFromCookie() {
        const raw = this._getCookie(this._persistKey);
        if (!raw) {
            return;
        }
        try {
            const obj = JSON.parse(decodeURIComponent(raw));
            if (!obj || obj.v !== 1) {
                return;
            }
            if (Array.isArray(obj.order) && obj.order.length > 0) {
                const map = new Map(this._items.map(it => [it.id, it]));
                const reordered = [];

                // restore order for known items
                obj.order.forEach(id => {
                    const item = map.get(id);
                    if (item) {
                        reordered.push(item);
                        map.delete(id);
                    }
                });

                // append remaining new items
                map.forEach(item => reordered.push(item));

                this._items = reordered;
            }
        } catch (e) {
            // silent fail on cookie parse error
            console.debug("Failed to load list state", e);
        }
    }

    /**
     * Retrieves cookie value.
     * @param {string} name Cookie name.
     * @returns {string|null} Value.
     */
    _getCookie(name) {
        if (!name) {
            return null;
        }
        const matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : null;
    }

    /**
     * Sets a cookie (SameSite=Lax).
     * @param {string} name Name.
     * @param {string} value Value.
     * @param {number} days Days to expire.
     */
    _setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const d = new Date();
            d.setTime(d.getTime() + (days * 86400000));
            expires = "; expires=" + d.toUTCString();
        }
        document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax`;
    }

    /**
     * Collects current item signature states.
     * @returns {Array<{item:Object,key:string,signature:string}>} State list.
     */
    _collectCurrentItemStates() {
        const list = [];
        for (const it of this._items) {
            const key = this._getItemKey(it);
            if (key) {
                list.push({
                    item: it,
                    key,
                    signature: this._computeItemSignature(it)
                });
            }
        }
        return list;
    }

    /**
     * Computes item signature from content text.
     * @param {Object} item Item object.
     * @returns {string} Signature.
     */
    _computeItemSignature(item) {
        return (item?.content?.content || "").trim();
    }

    /**
     * Returns stable key for item.
     * @param {Object} item Item object.
     * @returns {string|null} Key.
     */
    _getItemKey(item) {
        if (!item) {
            return null;
        }
        if (item.id) {
            return item.id;
        }
        if (!item._uid) {
            item._uid = "i_" + crypto.randomUUID();
        }
        return item._uid;
    }

    /**
     * Detects changed items relative to snapshot.
     * @param {Array} currentStates Current states.
     * @returns {Array<Object>} Changed items.
     */
    _detectChangedItems(currentStates) {
        const changed = [];
        for (const st of currentStates) {
            const prevSig = this._prevItemState.get(st.key);
            if (prevSig !== undefined && prevSig !== st.signature) {
                changed.push(st.item);
            }
        }
        return changed;
    }

    /**
     * Updates snapshot map.
     * @param {Array} currentStates Current states.
     */
    _updateSnapshot(currentStates) {
        this._prevItemState.clear();
        for (const st of currentStates) {
            this._prevItemState.set(st.key, st.signature);
        }
    }

    /**
     * Highlights a changed item (if feature enabled).
     * @param {Object} item Item object.
     */
    _flashItem(item) {
        if (!this._highlightChanges || !item?._anchorLi) {
            return;
        }
        const li = item._anchorLi;
        li.classList.remove("wx-row-flash");
        // trigger reflow
        void li.offsetWidth;
        li.classList.add("wx-row-flash");

        setTimeout(() => {
            if (li.isConnected) {
                li.classList.remove("wx-row-flash");
            }
        }, 3000);
    }
};

// register class
webexpress.webui.Controller.registerClass("wx-webui-list", webexpress.webui.ListCtrl);