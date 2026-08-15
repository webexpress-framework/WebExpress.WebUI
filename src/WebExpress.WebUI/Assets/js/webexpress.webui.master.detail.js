/**
 * A master-detail view: an enumeration control on one side, a detail region on
 * the other, and the selection state that ties them together.
 *
 * The control is a composite. It owns the layout and the selected id but none of
 * the content: the master side may be any control that renders selectable items
 * (list, tile grid, table, kanban, backlog, hand-written markup), and the detail
 * side is a frame that fetches its content on demand. Neither half knows the
 * other; both are reached only through the item contract below and the frame's
 * uri setter.
 *
 * Item contract - a selectable item is an element matching the item selector
 * (data-item, defaulting to the item classes of the built-in controls) that
 * carries at least one of:
 *   data-bind-uri | data-wx-primary-uri | data-uri | data-href    the detail uri
 *   data-bind-id | data-wx-primary-item | data-tile-id | id       the item id
 * An item that carries only an id resolves its uri through the data-detail-uri
 * template, so a master can stay free of routing knowledge.
 *
 * Selections arrive through three channels that all funnel into select():
 * a delegated click on the master side, keyboard activation, and the selection
 * events of the master control itself (SELECT_ITEM_EVENT / SELECT_ROW_EVENT),
 * which keeps the state in sync when that control selects on its own.
 *
 * The splitter is not reimplemented. The host wraps a split control and the
 * detail side is hidden by hiding its content, which makes the split drop the
 * splitter, hand the whole container to the master, and restore the previous
 * splitter position once the detail comes back. The detail side carries both
 * ways out of it in a fixed header bar above its scrolling body: a close button
 * in the two-column layout, and a labelled back button in the sequential one.
 *
 * Content arriving in the detail frame is animated in, so a swap from one item
 * to the next reads as a transition rather than as a jump.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.SELECT_ITEM_EVENT
 * - webexpress.webui.Event.SHOW_EVENT
 * - webexpress.webui.Event.HIDE_EVENT
 * - webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT
 */
webexpress.webui.MasterDetailCtrl = class extends webexpress.webui.Ctrl {

    // the width below which the control switches to the sequential mode
    static DEFAULT_BREAKPOINT = 768;

    // the item markup of the built-in enumeration controls, both as authored on
    // the server and as their controls re-render it (a table row is authored as
    // .wx-table-row and rendered as .wx-grid-row), plus the two neutral hooks
    // for markup that belongs to none of them
    static DEFAULT_ITEM_SELECTOR = ".wx-list-item, .wx-tile-card, .wx-table-row, .wx-grid-row, .wx-kanban-card, "
        + "[data-bind-uri], [data-wx-primary-action='master-detail']";

    static ACTIVE_CLASS = "wx-md-item-active";
    static CLOSABLE_CLASS = "wx-md-closable";
    static COMPACT_CLASS = "wx-md-compact";
    static DETAIL_OPEN_CLASS = "wx-md-detail-open";
    static SWAP_CLASS = "wx-detail-swap";

    // config
    _breakpoint = webexpress.webui.MasterDetailCtrl.DEFAULT_BREAKPOINT;
    _itemSelector = webexpress.webui.MasterDetailCtrl.DEFAULT_ITEM_SELECTOR;
    _detailUriTemplate = null;
    _closable = true;

    // elements
    _masterPane = null;
    _detailPane = null;
    _detailBody = null;
    _emptyState = null;
    _frameElement = null;
    _splitElement = null;
    _headerElement = null;
    _backButton = null;
    _closeButton = null;

    // state
    _selectedId = null;
    _selectedUri = null;
    _selectedItem = null;
    _loadedUri = null;
    _detailHidden = false;
    _compact = false;

    // observers
    _resizeObserver = null;
    _masterObserver = null;
    _masterMutationPending = false;

    /**
     * Creates a new controller instance bound to the given host element.
     * @param {HTMLElement} element - The master-detail host element.
     */
    constructor(element) {
        super(element);

        this._readConfig(element);
        this._resolveParts(element);

        element.classList.add("wx-master-detail");

        this._buildControls();
        this._bindEvents();
        this._applyAria();

        // no selection yet, so the placeholder owns the detail side
        this._showEmptyState(true);

        this._updateBreakpoint(true);
        this._applyDetailVisibility();
        this._adoptInitialSelection();
    }

    /**
     * Gets the id of the currently selected item.
     * @returns {string|null} The selected id.
     */
    get selectedId() {
        return this._selectedId;
    }

    /**
     * Selects the item with the given id, or clears the selection for null.
     * @param {string|null} value - The item id.
     */
    set selectedId(value) {
        if (value == null) {
            this.clearSelection();
            return;
        }
        this.selectItem(value);
    }

    /**
     * Returns whether the control currently runs in the sequential
     * single-column mode.
     * @returns {boolean} True while the compact mode is active.
     */
    get compact() {
        return this._compact;
    }

    /**
     * Returns whether the detail side is currently hidden.
     * @returns {boolean} True when the detail side is hidden.
     */
    get detailHidden() {
        return this._detailHidden;
    }

    /**
     * Applies a selection and loads the matching detail content. This is the
     * single entry point for every selection channel, so the state transition is
     * identical no matter whether the click, the keyboard or the master control
     * triggered it.
     * @param {object} selection - { id, uri, element, reveal }. Missing parts are
     *     resolved from the item element; reveal:false keeps a hidden detail side
     *     hidden.
     */
    select(selection) {
        const source = selection || {};
        const element = source.element || this._findItemById(source.id != null ? String(source.id) : null);
        const id = source.id != null ? String(source.id) : this._resolveId(element);
        const uri = source.uri || this._resolveUri(element, id);

        // a single click can reach this twice - once through the item's own
        // master-detail action and once through the delegated handler - and both
        // resolve to the same item, so re-selecting what is already shown is a
        // no-op rather than a second event and a second fetch. reload() is the
        // explicit way to ask for fresh content.
        if (id === this._selectedId
            && (uri || null) === this._selectedUri
            && (element || null) === this._selectedItem
            && !this._detailHidden) {
            return;
        }

        this._selectedId = id;
        this._selectedUri = uri || null;
        this._selectedItem = element || null;

        this._applyActiveItem(element);

        if (source.reveal !== false) {
            this.showDetail();
        }
        this._syncDetailContent();

        this._dispatch(webexpress.webui.Event.SELECT_ITEM_EVENT, {
            itemId: this._selectedId,
            uri: this._selectedUri,
            item: this._selectedItem
        });
    }

    /**
     * Selects the item with the given id.
     * @param {string} id - The item id.
     */
    selectItem(id) {
        this.select({ id: id });
    }

    /**
     * Clears the selection and returns the detail side to its placeholder.
     */
    clearSelection() {
        this._selectedId = null;
        this._selectedUri = null;
        this._selectedItem = null;
        this._loadedUri = null;

        this._applyActiveItem(null);
        this._showEmptyState(true);

        this._dispatch(webexpress.webui.Event.SELECT_ITEM_EVENT, {
            itemId: null,
            uri: null,
            item: null
        });
    }

    /**
     * Shows the detail side again, restoring the splitter at the position it had
     * before it was hidden.
     */
    showDetail() {
        if (!this._detailHidden) {
            return;
        }
        this._detailHidden = false;
        this._applyDetailVisibility();
        this._dispatch(webexpress.webui.Event.SHOW_EVENT, { compact: this._compact });
    }

    /**
     * Hides the detail side. The splitter goes with it and the master side takes
     * the whole container; in the sequential mode this is the way back to the list.
     */
    hideDetail() {
        if (this._detailHidden) {
            return;
        }
        this._detailHidden = true;
        this._applyDetailVisibility();
        this._dispatch(webexpress.webui.Event.HIDE_EVENT, { compact: this._compact });

        // leaving an overlay must not leave the focus behind it
        if (this._compact) {
            this._focusItem(this._selectedItem);
        }
    }

    /**
     * Toggles the visibility of the detail side.
     */
    toggleDetail() {
        if (this._detailHidden) {
            this.showDetail();
        } else {
            this.hideDetail();
        }
    }

    /**
     * Fetches the detail content again. Selecting the same item is deliberately
     * free of a round trip, so an explicit refresh needs its own call.
     */
    reload() {
        this._loadedUri = null;
        this._syncDetailContent();
    }

    /**
     * Re-reads the master items after the master content changed outside a
     * mutation the observer sees, and re-applies roles and the active state.
     */
    refresh() {
        this._onMasterMutated();
    }

    /**
     * Releases the observers so a removed control cannot keep reacting to
     * layout or content changes.
     */
    destroy() {
        this._resizeObserver?.disconnect();
        this._masterObserver?.disconnect();
        this._resizeObserver = null;
        this._masterObserver = null;
    }

    /**
     * Reads the configuration from the host data attributes and strips them
     * afterwards, so the rendered dom carries no leftover configuration.
     * @param {HTMLElement} element - The host element.
     */
    _readConfig(element) {
        const breakpoint = parseInt(element.getAttribute("data-breakpoint"), 10);
        this._breakpoint = isNaN(breakpoint) ? webexpress.webui.MasterDetailCtrl.DEFAULT_BREAKPOINT : breakpoint;
        this._itemSelector = element.getAttribute("data-item") || webexpress.webui.MasterDetailCtrl.DEFAULT_ITEM_SELECTOR;
        this._detailUriTemplate = element.getAttribute("data-detail-uri") || null;
        this._detailHidden = element.getAttribute("data-detail-visible") === "false";
        this._closable = element.getAttribute("data-closable") !== "false";

        ["data-breakpoint", "data-item", "data-detail-uri", "data-detail-visible", "data-closable"]
            .forEach((attr) => element.removeAttribute(attr));
    }

    /**
     * Resolves the structural parts the control operates on.
     * @param {HTMLElement} element - The host element.
     */
    _resolveParts(element) {
        this._masterPane = element.querySelector(".wx-master");
        this._detailPane = element.querySelector(".wx-detail");
        this._detailBody = element.querySelector(".wx-detail-body") || this._detailPane;
        this._emptyState = this._detailBody ? this._detailBody.querySelector(".wx-empty-state") : null;

        // the child controls are upgraded first, so the split has already traded
        // its marker class for the runtime one; both are accepted because a
        // hand-written host may not have been upgraded at all
        this._splitElement = element.querySelector(".wx-split") || element.querySelector(".wx-webui-split");

        this._frameElement = this._detailBody
            ? (this._detailBody.querySelector(".wx-frame") || this._detailBody.querySelector(".wx-webui-frame"))
            : null;
    }

    /**
     * Adds the two ways out of the detail side: the close button of the
     * two-column layout and the back button of the sequential one. Both are built
     * here rather than server-side because which of them applies depends on the
     * layout mode, which the client alone decides on; css shows the one that fits
     * and keeps the other out of the way.
     *
     * Both live in a header bar of their own, which is a sibling of the scrolling
     * body rather than part of it. A button floating over the content would cover
     * whatever the loaded detail places in that corner and would scroll out of
     * reach with the body; from the bar neither can happen.
     */
    _buildControls() {
        if (!this._detailPane) {
            return;
        }

        const backLabel = this._i18n("webexpress.webui:masterdetail.back", "Back to the list");
        const header = document.createElement("div");
        header.className = "wx-detail-header";

        const back = document.createElement("button");
        back.type = "button";
        back.className = "wx-detail-back";
        back.title = backLabel;
        back.setAttribute("aria-label", backLabel);

        const backIcon = webexpress.webui.Icon.create(this._iconClass("fas fa-arrow-left", "wx-icon-light-arrow-left"));
        if (backIcon) {
            back.appendChild(backIcon);
        }
        back.appendChild(document.createTextNode(backLabel));
        back.addEventListener("click", () => this.hideDetail());

        header.appendChild(back);

        if (this._closable) {
            // the same button the modal and the dismissible panel use, so a close
            // is the same affordance everywhere in the framework
            const closeLabel = this._i18n("webexpress.webui:masterdetail.close", "Hide the detail view");
            const close = document.createElement("button");
            close.type = "button";
            close.className = "btn wx-button-close wx-detail-close";
            close.title = closeLabel;
            close.setAttribute("aria-label", closeLabel);
            close.innerHTML = `<i class="${this._iconClass("fas fa-times", "wx-icon-light-xmark")}"></i>`;
            close.addEventListener("click", () => this.hideDetail());

            header.appendChild(close);
            this._closeButton = close;

            // without the close button the bar stays empty outside the sequential
            // mode; the marker lets css leave that stray line out
            this._element.classList.add(webexpress.webui.MasterDetailCtrl.CLOSABLE_CLASS);
        }

        this._detailPane.prepend(header);
        this._headerElement = header;
        this._backButton = back;
    }

    /**
     * Registers the selection, keyboard and layout listeners.
     */
    _bindEvents() {
        if (this._masterPane) {
            this._masterPane.addEventListener("click", (e) => this._onMasterClick(e));
            this._masterPane.addEventListener("keydown", (e) => this._onMasterKeyDown(e));

            // the master control may select on its own - through its keyboard
            // handling, an auto-selected first row or a programmatic call - and
            // announces that with one of these events
            this._masterPane.addEventListener(webexpress.webui.Event.SELECT_ITEM_EVENT, (e) => this._onMasterSelect(e));
            this._masterPane.addEventListener(webexpress.webui.Event.SELECT_ROW_EVENT, (e) => this._onMasterSelect(e));

            if (typeof MutationObserver !== "undefined") {
                this._masterObserver = new MutationObserver(() => this._scheduleMasterSync());
                this._masterObserver.observe(this._masterPane, { childList: true, subtree: true });
            }
        }

        if (this._frameElement) {
            // the frame holds the previous detail until the next one is ready, so
            // the two exchange in one step and only the arrival is worth
            // animating. Animating just the arrival also means a failed load can
            // never leave the detail stuck invisible.
            this._frameElement.addEventListener(webexpress.webui.Event.DATA_ARRIVED_EVENT, (e) => this._animateSwap(e));
            this._frameElement.addEventListener("animationend", () => {
                this._frameElement.classList.remove(webexpress.webui.MasterDetailCtrl.SWAP_CLASS);
            });
        }

        if (typeof ResizeObserver !== "undefined") {
            this._resizeObserver = new ResizeObserver(() => this._updateBreakpoint(false));
            this._resizeObserver.observe(this._element);
        }
    }

    /**
     * Replays the enter animation on freshly arrived detail content, so a swap
     * from one item to the next reads as a transition rather than as a jump.
     * @param {CustomEvent} e - The arrival event of the detail frame.
     */
    _animateSwap(e) {
        // the detail content may embed frames of its own; only the arrival of the
        // detail frame itself is a swap of the detail
        if (e?.detail?.sender && e.detail.sender !== this._frameElement) {
            return;
        }

        this._frameElement.classList.remove(webexpress.webui.MasterDetailCtrl.SWAP_CLASS);
        // reading a layout property restarts the animation; without it the class
        // is re-added within the same frame and the browser never replays it
        void this._frameElement.offsetWidth;
        this._frameElement.classList.add(webexpress.webui.MasterDetailCtrl.SWAP_CLASS);
    }

    /**
     * Handles a click anywhere on the master side. Delegation is used instead of
     * per-item listeners so items that appear later are covered without a
     * re-binding pass.
     * @param {MouseEvent} e - The click event.
     */
    _onMasterClick(e) {
        const item = this._itemFromEvent(e);
        if (!item || this._isDisabled(item)) {
            return;
        }
        this.select({ element: item });
    }

    /**
     * Implements the listbox keyboard model: the arrows move the focus, Enter and
     * Space activate, Escape leaves the detail overlay. Events another control
     * already acted on are left alone, which keeps a self-navigating master (a
     * table, for example) from moving twice.
     * @param {KeyboardEvent} e - The key event.
     */
    _onMasterKeyDown(e) {
        if (e.defaultPrevented) {
            return;
        }

        const items = this._navigableItems();

        switch (e.key) {
            case "ArrowDown":
            case "ArrowUp": {
                if (items.length === 0) {
                    return;
                }
                e.preventDefault();
                const step = e.key === "ArrowDown" ? 1 : -1;
                const current = items.indexOf(this._itemFromEvent(e) || this._selectedItem);
                const next = current < 0
                    ? (step > 0 ? 0 : items.length - 1)
                    : Math.max(0, Math.min(items.length - 1, current + step));
                this._focusItem(items[next]);
                break;
            }
            case "Home":
            case "End": {
                if (items.length === 0) {
                    return;
                }
                e.preventDefault();
                this._focusItem(e.key === "Home" ? items[0] : items[items.length - 1]);
                break;
            }
            case "Enter":
            case " ":
            case "Spacebar": {
                const item = this._itemFromEvent(e);
                if (!item || this._isDisabled(item)) {
                    return;
                }
                e.preventDefault();
                this.select({ element: item });
                break;
            }
            case "Escape": {
                if (this._compact && !this._detailHidden) {
                    e.preventDefault();
                    this.hideDetail();
                }
                break;
            }
        }
    }

    /**
     * Adopts a selection the master control made on its own.
     * @param {CustomEvent} e - The selection event.
     */
    _onMasterSelect(e) {
        const detail = e.detail || {};
        const id = detail.itemId != null ? detail.itemId : detail.rowId;
        const element = this._itemFromEvent(e) || this._findItemById(id != null ? String(id) : null);
        const uri = detail.uri
            || detail.primaryAction?.uri
            || detail.row?.primaryAction?.uri
            || null;

        if (id == null && !uri && !element) {
            this.clearSelection();
            return;
        }

        this.select({ id: id, uri: uri, element: element });
    }

    /**
     * Resolves the item element an event originated from.
     * @param {Event} e - A dom event or a selection event carrying an original one.
     * @returns {HTMLElement|null} The item element, or null.
     */
    _itemFromEvent(e) {
        const target = e?.target || e?.detail?.originalEvent?.target || null;
        if (!target || typeof target.closest !== "function") {
            return null;
        }
        const item = target.closest(this._itemSelector);
        return item && this._masterPane && this._masterPane.contains(item) ? item : null;
    }

    /**
     * Returns all selectable items of the master side.
     * @returns {Array<HTMLElement>} The item elements.
     */
    _items() {
        if (!this._masterPane) {
            return [];
        }
        return Array.from(this._masterPane.querySelectorAll(this._itemSelector));
    }

    /**
     * Returns the items the keyboard may move to.
     * @returns {Array<HTMLElement>} The enabled item elements.
     */
    _navigableItems() {
        return this._items().filter((item) => !this._isDisabled(item));
    }

    /**
     * Returns whether an item is excluded from selection.
     * @param {HTMLElement} item - The item element.
     * @returns {boolean} True when the item is disabled.
     */
    _isDisabled(item) {
        return item.hasAttribute("disabled")
            || item.getAttribute("aria-disabled") === "true"
            || item.classList.contains("disabled");
    }

    /**
     * Reads the id of an item.
     * @param {HTMLElement} item - The item element.
     * @returns {string|null} The id, or null.
     */
    _resolveId(item) {
        if (!item) {
            return null;
        }
        return item.getAttribute("data-bind-id")
            || item.getAttribute("data-wx-primary-item")
            || item.getAttribute("data-tile-id")
            || item.id
            || null;
    }

    /**
     * Reads the detail uri of an item, falling back to the configured template
     * so a master that carries only ids still resolves.
     * @param {HTMLElement} item - The item element.
     * @param {string|null} id - The already resolved item id.
     * @returns {string|null} The uri, or null.
     */
    _resolveUri(item, id) {
        if (item) {
            const uri = item.getAttribute("data-bind-uri")
                || item.getAttribute("data-wx-primary-uri")
                || item.getAttribute("data-uri")
                || item.getAttribute("data-href");
            if (uri) {
                return uri;
            }
        }
        if (id && this._detailUriTemplate) {
            return this._detailUriTemplate.replace("{id}", encodeURIComponent(id));
        }
        return null;
    }

    /**
     * Finds the item element carrying the given id.
     * @param {string|null} id - The item id.
     * @returns {HTMLElement|null} The item element, or null.
     */
    _findItemById(id) {
        if (id == null) {
            return null;
        }
        return this._items().find((item) => this._resolveId(item) === String(id)) || null;
    }

    /**
     * Marks one item as the active option and clears the others.
     * @param {HTMLElement|null} item - The active item, or null.
     */
    _applyActiveItem(item) {
        let matched = false;

        for (const candidate of this._items()) {
            const active = candidate === item;
            matched = matched || active;
            candidate.classList.toggle(webexpress.webui.MasterDetailCtrl.ACTIVE_CLASS, active);
            candidate.setAttribute("aria-selected", active ? "true" : "false");
            candidate.setAttribute("tabindex", active ? "0" : "-1");
        }

        // the active item may be absent - nothing is selected, or the master
        // re-rendered and replaced it - and the list would then be left without
        // any tab stop at all
        if (!matched) {
            this._ensureTabStop();
        }
    }

    /**
     * Moves the focus to an item and makes it the single tab stop, which is the
     * roving-tabindex half of the listbox keyboard model.
     * @param {HTMLElement|null} item - The item to focus.
     */
    _focusItem(item) {
        if (!item) {
            return;
        }
        for (const candidate of this._items()) {
            candidate.setAttribute("tabindex", candidate === item ? "0" : "-1");
        }
        item.focus?.({ preventScroll: true });
        item.scrollIntoView?.({ block: "nearest" });
    }

    /**
     * Keeps exactly one item reachable with the tab key when nothing is selected.
     */
    _ensureTabStop() {
        const items = this._navigableItems();
        if (items.length === 0 || items.some((item) => item.getAttribute("tabindex") === "0")) {
            return;
        }
        items[0].setAttribute("tabindex", "0");
    }

    /**
     * Applies the listbox roles. The listbox goes on the element that actually
     * owns the items - the list's own container when they share one - so the
     * option elements stay direct children of their listbox.
     */
    _applyAria() {
        const items = this._items();
        const detailId = this._detailPane?.id || null;
        const root = this._listboxRoot(items);

        if (root) {
            if (!root.getAttribute("role")) {
                root.setAttribute("role", "listbox");
            }
            root.setAttribute("aria-multiselectable", "false");
            if (detailId) {
                root.setAttribute("aria-controls", detailId);
            }
        }

        for (const item of items) {
            if (!item.getAttribute("role")) {
                item.setAttribute("role", "option");
            }
            if (!item.hasAttribute("aria-selected")) {
                item.setAttribute("aria-selected", "false");
            }
            if (!item.hasAttribute("tabindex")) {
                item.setAttribute("tabindex", "-1");
            }
            if (detailId) {
                item.setAttribute("aria-controls", detailId);
            }
        }

        this._ensureTabStop();
    }

    /**
     * Returns the element that owns the items.
     * @param {Array<HTMLElement>} items - The item elements.
     * @returns {HTMLElement|null} The listbox element, or null.
     */
    _listboxRoot(items) {
        if (items.length === 0) {
            return this._masterPane;
        }
        const parent = items[0].parentElement;
        return parent && items.every((item) => item.parentElement === parent) ? parent : this._masterPane;
    }

    /**
     * Coalesces a burst of master mutations into a single reconciliation.
     */
    _scheduleMasterSync() {
        if (this._masterMutationPending) {
            return;
        }
        this._masterMutationPending = true;
        const run = () => {
            this._masterMutationPending = false;
            this._onMasterMutated();
        };
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(run);
        } else {
            run();
        }
    }

    /**
     * Re-binds the selection to the current dom after the master re-rendered its
     * items, which replaces the elements the control was holding on to.
     */
    _onMasterMutated() {
        const replacement = this._selectedId != null ? this._findItemById(this._selectedId) : null;

        if (replacement) {
            this._selectedItem = replacement;
        } else if (this._selectedItem && !this._selectedItem.isConnected) {
            // an item without an id cannot be found again after a re-render, so
            // the highlight is dropped rather than pinned to a detached node
            this._selectedItem = null;
        }

        this._applyAria();
        this._applyActiveItem(this._selectedItem);
    }

    /**
     * Adopts a selection that was already made when the control initialized, for
     * example the first row a selectable list activates on its own. The detail
     * side keeps its configured visibility, so an initially hidden detail is not
     * forced open by an adopted selection.
     */
    _adoptInitialSelection() {
        const preselected = this._items().find((item) =>
            item.getAttribute("aria-selected") === "true" || item.classList.contains("active"));

        if (preselected) {
            this.select({ element: preselected, reveal: false });
        }
    }

    /**
     * Pushes the selected uri into the frame. Nothing is fetched while the detail
     * side is hidden, and an unchanged uri is not fetched twice.
     */
    _syncDetailContent() {
        if (this._detailHidden) {
            return;
        }

        const uri = this._selectedUri;
        if (!uri) {
            this._showEmptyState(true);
            this._loadedUri = null;
            return;
        }

        this._showEmptyState(false);

        if (uri === this._loadedUri) {
            return;
        }
        this._loadedUri = uri;

        const frame = this._frameElement
            ? webexpress.webui.Controller.getInstanceByElement(this._frameElement)
            : null;

        if (frame) {
            frame.uri = uri;
        } else if (this._frameElement) {
            // the frame was never upgraded (a hand-written host); leaving the uri
            // on the element lets a later upgrade pick it up
            this._frameElement.setAttribute("data-uri", uri);
        }
    }

    /**
     * Swaps the placeholder and the loaded content.
     * @param {boolean} show - True to show the placeholder.
     */
    _showEmptyState(show) {
        if (this._emptyState) {
            this._emptyState.style.display = show ? "" : "none";
        }
        if (this._frameElement) {
            this._frameElement.style.display = show ? "none" : "";
        }
    }

    /**
     * Applies the current detail visibility to the dom.
     */
    _applyDetailVisibility() {
        if (!this._detailPane) {
            return;
        }

        if (this._compact) {
            // in the sequential mode the detail is an overlay: it stays displayed
            // so it can slide, and the open class decides where it sits
            this._detailPane.style.display = "";
            this._element.classList.toggle(webexpress.webui.MasterDetailCtrl.DETAIL_OPEN_CLASS, !this._detailHidden);
        } else {
            this._element.classList.remove(webexpress.webui.MasterDetailCtrl.DETAIL_OPEN_CLASS);
            // hiding the content rather than the pane is what makes the split drop
            // the splitter and give the container to the master; showing it again
            // restores the splitter at its previous position
            this._detailPane.style.display = this._detailHidden ? "none" : "";
        }

        this._syncSplit();
        this._syncDetailContent();
    }

    /**
     * Tells the split to re-evaluate its panes right away instead of waiting for
     * its own observer, so hiding and showing the detail is a single, flicker-free
     * layout step.
     */
    _syncSplit() {
        if (!this._splitElement) {
            return;
        }
        const split = webexpress.webui.Controller.getInstanceByElement(this._splitElement);
        split?.refreshContentVisibility?.();
    }

    /**
     * Re-evaluates the layout mode against the current container width.
     * @param {boolean} initial - True during construction, when no event is due.
     */
    _updateBreakpoint(initial) {
        const width = this._element.clientWidth
            || (typeof window !== "undefined" ? window.innerWidth : 0);
        const compact = this._breakpoint > 0 && width > 0 && width < this._breakpoint;

        if (compact === this._compact && !initial) {
            return;
        }

        this._compact = compact;
        this._element.classList.toggle(webexpress.webui.MasterDetailCtrl.COMPACT_CLASS, compact);

        // entering the sequential mode without a selection starts on the list,
        // which is the only sensible first screen there
        if (compact && this._selectedId == null) {
            this._detailHidden = true;
        }

        if (!initial) {
            this._applyDetailVisibility();
            this._dispatch(webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT, {
                compact: compact,
                breakpoint: this._breakpoint,
                width: width
            });
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-master-detail", webexpress.webui.MasterDetailCtrl);
