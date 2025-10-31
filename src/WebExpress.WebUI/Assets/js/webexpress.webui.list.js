/**
 * Flat list control.
 * - flat list rendering
 * - item drag & drop (mouse + keyboard)
 * - inline editing integration via SmartEditCtrl
 * - per-item dropdown options (optional)
 * - per-item delete button as an alternative to dropdown options (optional)
 * - persisted state (item order by id if available)
 * - change highlighting (diff-based)
 *
 * Dataset options on the host element:
 *  - data-movable-item="true|false"    enable drag & drop
 *  - data-persist-key="..."            cookie key for persisted order
 *  - data-deletable="true|false"       show a delete button per item (when no dropdown options exist)
 *  - data-delete-confirm="true|false"  ask for confirmation before deleting
 *  - data-delete-label="..."           label for the delete button (default: "Delete")
 *  - data-delete-title="..."           title/tooltip for delete button (default: "Delete item")
 *
 * The following events are triggered:
 *  - webexpress.webui.Event.ROW_REORDER_EVENT          // emitted after reorder with new/previous order
 *  - webexpress.webui.Event.MOVE_EVENT                 // also used with action: "delete"
 *  - webexpress.webui.Event.DELETE_ITEM_EVENT          // if defined in host app; otherwise safely ignored
 *  - webexpress.webui.Event.START_INLINE_EDIT_EVENT    // integration only
 *  - webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT     // integration only
 *  - webexpress.webui.Event.END_INLINE_EDIT_EVENT      // integration only
 */
webexpress.webui.ListCtrl = class extends webexpress.webui.Ctrl {

    // core elements
    _list = document.createElement("ul");

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

    // drag state
    _draggedItem = null;
    _itemPlaceholder = null;
    _itemDragActive = false;
    _autoScrollInterval = null;
    _lastPointerY = null;
    _dragInsertIndex = null;

    // persistence
    _persistKey = null;
    _saveDebounceTimer = null;

    // change detection / highlighting
    _prevItemState = new Map();
    _initialized = false;

    // change flash control
    _highlightChanges = true;
    _suppressFlashOnce = false;

    /**
     * Creates a new list control instance.
     * @param {HTMLElement} element Root element.
     */
    constructor(element) {
        super(element);

        // utilities
        this._util = {
            addClasses: (el, cls) => {
                if (!cls) {
                    return;
                }
                cls.split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c));
            },
            create: (tag, opts = {}) => {
                const el = document.createElement(tag);
                if (opts.class) {
                    this._util.addClasses(el, opts.class);
                }
                if (opts.text != null) {
                    el.textContent = opts.text;
                }
                if (opts.html != null) {
                    el.innerHTML = opts.html;
                }
                if (opts.attrs) {
                    for (const [k, v] of Object.entries(opts.attrs)) {
                        if (v != null) {
                            el.setAttribute(k, v);
                        }
                    }
                }
                return el;
            },
            dispatch: (evtConst, detail) => {
                if (!evtConst) {
                    return;
                }
                this._dispatch(evtConst, { detail });
            }
        };

        // base classes
        this._list.className = "wx-list list-unstyled m-0";

        // dataset / flags
        const ds = element.dataset;
        this._movableItem = ds.movableItem === "true" || false;
        this._persistKey = ds.persistKey || element.id || null;
        this._deletable = ds.deletable === "true" || false;
        this._deleteConfirm = ds.deleteConfirm === "true" || false;
        this._deleteLabel = ds.deleteLabel || "Delete";
        this._deleteTitle = ds.deleteTitle || "Delete item";

        // parse declarative config
        this._options = this._parseOptions(element.querySelector(":scope > .wx-list-options"));
        this._items = this._parseItems(element.querySelectorAll(":scope > .wx-list-item"));

        // load persisted state (order by id)
        this._loadStateFromCookie();

        // cleanup attributes
        [
            "data-movable-item",
            "data-persist-key",
            "data-deletable",
            "data-delete-confirm",
            "data-delete-label",
            "data-delete-title"
        ].forEach(a => element.removeAttribute(a));

        // mount
        element.innerHTML = "";
        element.appendChild(this._list);

        // initial render
        this.render();

        // inline editing integration
        this._bindInlineEditSaveListener();
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
     * Renders the list view, applying diff highlight when enabled.
     */
    render() {
        const currentStates = this._collectCurrentItemStates();
        const allowDiff = this._initialized;
        const changes = allowDiff ? this._detectChangedItems(currentStates) : [];
        const allowFlash = allowDiff && this._highlightChanges && !this._suppressFlashOnce;

        this._renderItems();

        if (allowFlash && changes.length) {
            changes.forEach(it => this._flashItem(it));
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
        this._list.innerHTML = "";
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
        const siblings = this._items;
        if (index == null || index < 0 || index > siblings.length) {
            index = siblings.length;
        }
        siblings.splice(index, 0, item);
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
        const it = this._items[idx];
        this._items.splice(idx, 1);
        this._afterDelete(it, idx);
        this._schedulePersist();
        this.render();
        return true;
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
        const it = this._items[index];
        this._items.splice(index, 1);
        this._afterDelete(it, index);
        this._schedulePersist();
        this.render();
        return true;
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
            if (div.classList.contains("wx-dropdown-divider") || div.classList.contains("wx-dropdownbutton-divider")) {
                list.push({ type: "divider" });
            } else if (div.classList.contains("wx-dropdown-header") || div.classList.contains("wx-dropdownbutton-header")) {
                list.push({ type: "header", content: div.textContent.trim(), icon: div.dataset.icon || null });
            } else {
                list.push({
                    id: div.id || null,
                    image: div.dataset.image || null,
                    icon: div.dataset.icon || null,
                    linkColor: div.dataset.linkcolor || null,
                    uri: div.dataset.uri || div.dataset.url || null,
                    target: div.dataset.target || null,
                    tooltip: div.dataset.tooltip || null,
                    modal: div.dataset.modal || null,
                    content: div.textContent.trim() || null,
                    disabled: div.hasAttribute("disabled")
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
            if (!(div instanceof HTMLElement) || !div.classList.contains("wx-list-item")) {
                continue;
            }
            const item = {
                id: div.id || null,
                class: div.className || null,
                style: div.getAttribute("style") || null,
                color: div.dataset.color || null,
                editable: div.dataset.editable === "true",
                content: {
                    text: div.textContent.trim(),
                    html: div.firstElementChild || null,
                    image: div.dataset.image || null,
                    icon: div.dataset.icon || null,
                    uri: div.dataset.uri || null,
                    target: div.dataset.target || null,
                    modal: div.dataset.modal || null,
                    objectId: div.dataset.objectId || null
                },
                options: null,
                _anchorLi: null
            };

            for (const child of div.children) {
                if (!(child instanceof HTMLElement)) {
                    continue;
                }
                if (child.classList.contains("wx-list-options")) {
                    item.options = this._parseOptions(child);
                    if (item.options && item.options.length) {
                        this._hasOptions = true;
                    }
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
        const norm = [];
        for (const it of items) {
            norm.push(this._buildItem(it));
        }
        return norm;
    }

    /**
     * Builds a single item from raw data.
     * @param {Object|string} data Raw.
     * @returns {Object} Item.
     */
    _buildItem(data) {
        if (typeof data === "string") {
            return { id: null, class: null, style: null, color: null, editable: false, content: { text: data }, options: null, _anchorLi: null };
        }
        return {
            id: data.id || null,
            class: data.class || null,
            style: data.style || null,
            color: data.color || null,
            editable: !!data.editable,
            content: (data.content && typeof data.content === "object") ? data.content : { text: String(data?.content ?? "") },
            options: Array.isArray(data.options) ? data.options : null,
            _anchorLi: null
        };
    }

    /**
     * Renders list items into the UL.
     */
    _renderItems() {
        this._list.innerHTML = "";
        const fragment = document.createDocumentFragment();

        for (const it of this._items) {
            const li = document.createElement("li");
            li.className = "wx-list-li d-flex align-items-start gap-2";
            this._util.addClasses(li, it.color);
            this._util.addClasses(li, it.class);
            if (it.style) {
                li.setAttribute("style", it.style);
            }
            li._dataItemRef = it;
            it._anchorLi = li;

            if (this._movableItem) {
                const handle = document.createElement("span");
                handle.className = "wx-list-drag-handle user-select-none";
                handle.textContent = "☰";
                handle.title = this._i18n("webexpress.webui:list.handle.title", "Move");
                handle.setAttribute("aria-label", "Move item");
                handle.setAttribute("tabindex", "0");
                li.appendChild(handle);
                this._enableDragAndDropItem(handle, it);
            }

            const body = document.createElement("div");
            body.className = "wx-list-body d-flex align-items-center gap-2 flex-grow-1";

            // content
            const contentWrap = document.createElement("span");
            contentWrap.className = "wx-list-content";

            if (it.content?.image) {
                const img = document.createElement("img");
                img.className = "wx-icon";
                img.src = it.content.image;
                img.alt = "";
                contentWrap.appendChild(img);
            }
            if (it.content?.icon) {
                const i = document.createElement("i");
                i.className = it.content.icon;
                contentWrap.appendChild(i);
            }

            if (it.editable) {
                if (it.content?.objectId) {
                    contentWrap.id = it.id || ("it_" + Math.random().toString(36).slice(2));
                    contentWrap.setAttribute("data-object-id", it.content.objectId);
                }
                const input = document.createElement("input");
                input.type = "text";
                input.className = "form-control";
                input.value = it.content?.text || "";
                input.name = it.id || "item";
                contentWrap.appendChild(input);
                const smartEditCtrl = new webexpress.webui.SmartEditCtrl(contentWrap);
                smartEditCtrl.value = it.content?.text || "";
            } else {
                // only use SmartViewCtrl when a template element exists
                if (it.content?.html instanceof Element) {
                    const tpl = it.content.html.cloneNode(true); // clone template to avoid reparenting
                    contentWrap.appendChild(tpl);
                    const smartViewCtrl = new webexpress.webui.SmartViewCtrl(contentWrap);
                    smartViewCtrl.value = it.content?.text || "";
                } else {
                    // plain text fallback without SmartViewCtrl
                    contentWrap.appendChild(document.createTextNode(it.content?.text || ""));
                }
            }

            body.appendChild(contentWrap);
            li.appendChild(body);

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
                delBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this._deleteConfirm) {
                        const ok = window.confirm(this._i18n("webexpress.webui:list.delete.confirm", "Delete this item?"));
                        if (!ok) {
                            return;
                        }
                    }
                    this._deleteItemInternal(it);
                });
                li.appendChild(delBtn);
            } else if (this._hasOptions || this._options.length > 0) {
                const placeholder = document.createElement("div");
                placeholder.className = "wx-list-options-placeholder";
                li.appendChild(placeholder);
            }

            fragment.appendChild(li);
        }

        this._list.appendChild(fragment);
    }

    /**
     * Internal delete helper to remove an item instance and dispatch events.
     * @param {Object} item The item to delete.
     */
    _deleteItemInternal(item) {
        const idx = this._items.indexOf(item);
        if (idx === -1) {
            return;
        }
        this._items.splice(idx, 1);
        this._afterDelete(item, idx);
        this._schedulePersist();
        this.render();
    }

    /**
     * Post-delete event dispatching.
     * @param {Object} item Deleted item.
     * @param {number} index Original index.
     */
    _afterDelete(item, index) {
        this._util.dispatch(webexpress?.webui?.Event?.DELETE_ITEM_EVENT, {
            sender: this._element,
            item: item,
            itemId: item?.id || null,
            index: index
        });
        this._util.dispatch(webexpress?.webui?.Event?.MOVE_EVENT, {
            sender: this._element,
            kind: "item",
            action: "delete",
            itemId: item?.id || null,
            index: index
        });
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

        handle.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                if (!this._itemDragActive) {
                    this._startItemDrag(li, item);
                } else {
                    this._finalizeItemDrag();
                }
            }
            if (this._itemDragActive && (e.code === "ArrowUp" || e.code === "ArrowDown")) {
                e.preventDefault();
                const delta = e.code === "ArrowUp" ? -1 : 1;
                this._keyboardMovePlaceholder(delta);
            }
            if (this._itemDragActive && e.code === "Enter") {
                e.preventDefault();
                this._finalizeItemDrag();
            }
            if (this._itemDragActive && e.code === "Escape") {
                e.preventDefault();
                this._cancelItemDrag();
            }
        });

        handle.draggable = true;
        handle.addEventListener("dragstart", (e) => {
            this._startItemDrag(li, item);
            // use a transparent drag image to avoid cursor jump
            const img = document.createElement("canvas");
            img.width = img.height = 1;
            e.dataTransfer.setDragImage(img, 0, 0);
        });
        handle.addEventListener("dragend", () => {
            if (this._itemDragActive) {
                this._finalizeItemDrag();
            }
        });

        if (!this._list._itemDragBound) {
            this._list.addEventListener("dragover", (e) => this._onUlistDragOver(e));
            this._list.addEventListener("drop", (e) => {
                e.preventDefault();
                if (this._itemDragActive) {
                    this._finalizeItemDrag();
                }
            });
            this._list._itemDragBound = true;
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

        const totalHeight = li.getBoundingClientRect().height;
        this._itemPlaceholder = document.createElement("li");
        this._itemPlaceholder.className = "wx-list-drag-placeholder";
        this._itemPlaceholder.style.height = totalHeight + "px";
        this._itemPlaceholder.innerHTML = "&nbsp;";

        li.parentNode.insertBefore(this._itemPlaceholder, li.nextSibling);

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
        this._lastPointerY = e.clientY;

        const li = e.target.closest("li");
        if (!li || li === this._itemPlaceholder) {
            this._dragInsertIndex = this._computePlaceholderIndex();
            return;
        }
        if (!li._dataItemRef) {
            return;
        }
        if (li._dataItemRef === this._draggedItem) {
            return;
        }

        const rect = li.getBoundingClientRect();
        const y = e.clientY;
        const before = y < rect.top + rect.height / 2;

        if (before) {
            if (li !== this._itemPlaceholder.nextSibling) {
                li.parentNode.insertBefore(this._itemPlaceholder, li);
            }
        } else {
            if (li.nextSibling !== this._itemPlaceholder) {
                li.parentNode.insertBefore(this._itemPlaceholder, li.nextSibling);
            }
        }

        this._dragInsertIndex = this._computePlaceholderIndex();
    }

    /**
     * Computes current placeholder index among items (excluding the dragged one).
     * @returns {number} Index.
     */
    _computePlaceholderIndex() {
        let idx = 0;
        const children = Array.from(this._list.children);
        for (const child of children) {
            if (child === this._itemPlaceholder) {
                return idx;
            }
            if (child._dataItemRef && child._dataItemRef !== this._draggedItem) {
                idx += 1;
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
        const current = this._computePlaceholderIndex();
        const target = Math.min(Math.max(current + delta, 0), siblings.length);
        const anchors = siblings.map(s => s._anchorLi).filter(Boolean);
        if (target >= anchors.length) {
            const last = anchors[anchors.length - 1];
            if (last) {
                if (last.nextSibling !== this._itemPlaceholder) {
                    last.parentNode.insertBefore(this._itemPlaceholder, last.nextSibling);
                }
            } else {
                this._list.appendChild(this._itemPlaceholder);
            }
        } else {
            const ref = anchors[target];
            if (ref && ref !== this._itemPlaceholder.nextSibling) {
                ref.parentNode.insertBefore(this._itemPlaceholder, ref);
            }
        }
        this._dragInsertIndex = target;
    }

    /**
     * Performs auto-scroll during item drag.
     */
    _autoScrollCheck() {
        if (!this._itemDragActive) {
            return;
        }
        if (this._lastPointerY == null) {
            return;
        }
        const container = this._list.parentElement || document.scrollingElement;
        const rect = container.getBoundingClientRect();
        const threshold = 40;
        if (this._lastPointerY < rect.top + threshold) {
            container.scrollTop -= 10;
        } else if (this._lastPointerY > rect.bottom - threshold) {
            container.scrollTop += 10;
        }
    }

    /**
     * Finalizes item drag repositioning.
     */
    _finalizeItemDrag() {
        if (!this._itemDragActive) {
            return;
        }
        const li = this._draggedItem?._anchorLi || null;

        if (this._dragInsertIndex == null) {
            this._dragInsertIndex = this._computePlaceholderIndex();
        }

        const prevOrder = this._items.slice();

        const oldIndex = this._items.indexOf(this._draggedItem);
        if (oldIndex >= 0) {
            this._items.splice(oldIndex, 1);
        }
        const insertIndex = Math.min(Math.max(this._dragInsertIndex, 0), this._items.length);
        this._items.splice(insertIndex, 0, this._draggedItem);

        this._util.dispatch(webexpress.webui.Event.ROW_REORDER_EVENT, {
            sender: this._element,
            newOrder: this._items,
            previousOrder: prevOrder
        });

        this._util.dispatch(webexpress?.webui?.Event?.MOVE_EVENT, {
            sender: this._element,
            kind: "item",
            action: "move",
            itemId: this._draggedItem?.id || null,
            index: insertIndex
        });

        this._cleanupItemDrag(li);
        this._schedulePersist();
        this.render();
    }

    /**
     * Cancels current item drag.
     */
    _cancelItemDrag() {
        if (!this._itemDragActive) {
            return;
        }
        const li = this._draggedItem?._anchorLi || null;
        this._cleanupItemDrag(li);
        this.render();
    }

    /**
     * Cleans all temporary item drag state.
     * @param {HTMLLIElement|null} li Dragged item element.
     */
    _cleanupItemDrag(li) {
        if (this._itemPlaceholder && this._itemPlaceholder.parentNode) {
            this._itemPlaceholder.parentNode.removeChild(this._itemPlaceholder);
        }
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
        if (!webexpress?.webui?.Event?.SAVE_INLINE_EDIT_EVENT) {
            return;
        }
        document.addEventListener(webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT, (e) => {
            const src = e.detail?.sender instanceof HTMLElement ? e.detail?.sender : null;
            if (!src) {
                return;
            }
            const host = src.closest("ul");
            if (host !== this._list) {
                return;
            }
            const li = src.closest("li");
            if (!li || !li._dataItemRef) {
                return;
            }
            this._updateItemSnapshotFromDom(li._dataItemRef);
            this._flashItem(li._dataItemRef);
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
            if (Array.isArray(obj.order) && obj.order.length) {
                const map = new Map(this._items.map(it => [it.id, it]));
                const reordered = [];
                obj.order.forEach(id => {
                    if (map.has(id)) {
                        reordered.push(map.get(id));
                    }
                });
                this._items.forEach(it => {
                    if (!reordered.includes(it)) {
                        reordered.push(it);
                    }
                });
                this._items = reordered;
            }
        } catch (_) {
            // ignore malformed state
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
        const prefix = name + "=";
        const parts = document.cookie.split(";").map(c => c.trim());
        for (const p of parts) {
            if (p.indexOf(prefix) === 0) {
                return p.substring(prefix.length);
            }
        }
        return null;
    }

    /**
     * Sets a cookie (SameSite=Lax).
     * @param {string} name Name.
     * @param {string} value Value.
     * @param {number} days Days to expire.
     */
    _setCookie(name, value, days) {
        const expires = (() => {
            if (!days) {
                return "";
            }
            const d = new Date();
            d.setTime(d.getTime() + days * 86400000);
            return "; expires=" + d.toUTCString();
        })();
        document.cookie = name + "=" + value + expires + "; path=/; SameSite=Lax";
    }

    /**
     * Collects current item signature states.
     * @returns {Array<{item:Object,key:string,signature:string}>} State list.
     */
    _collectCurrentItemStates() {
        const list = [];
        for (const it of this._items) {
            const key = this._getItemKey(it);
            if (!key) {
                continue;
            }
            list.push({ item: it, key, signature: this._computeItemSignature(it) });
        }
        return list;
    }

    /**
     * Computes item signature from content text.
     * @param {Object} item Item object.
     * @returns {string} Signature.
     */
    _computeItemSignature(item) {
        const txt = (item?.content?.text || "").trim();
        return txt;
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
            item._uid = "i_" + Math.random().toString(36).slice(2);
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
            const prev = this._prevItemState.get(st.key);
            if (prev == null || prev !== st.signature) {
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
        if (!this._highlightChanges) {
            return;
        }
        if (!item || !item._anchorLi) {
            return;
        }
        const li = item._anchorLi;
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