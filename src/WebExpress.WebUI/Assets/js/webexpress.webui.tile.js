/**
 * Controller for interactive tile board: parsing markup, drag & drop reordering,
 * visibility toggling, searching, sorting and persistence (order + visibility).
 * Events:
 *  - webexpress.webui.Event.MOVE_EVENT
 *  - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 *  - webexpress.webui.Event.TILE_SEARCH_EVENT
 *  - webexpress.webui.Event.TILE_SORT_EVENT
 */
webexpress.webui.TileCtrl = class extends webexpress.webui.Ctrl {

    // model state
    _tiles = [];

    // search filter
    _filterTerm = "";

    // config flags
    _movable = false;
    _allowRemove = false;
    _removeMode = "hide"; // reserved for future

    // drag state
    _dragTile = null;

    // persistence
    _persistKey = null;
    _saveDebounce = null;

    // snapshot (future diff/highlight feature)
    _prevState = new Map();
    _initialized = false;

    // cached lowercase fields for search speed
    _searchCacheDirty = true;

    // large icon mode
    _largeIcon = false;

    /**
     * Creates a tile controller for the root element.
     * @param {HTMLElement} element - Root node containing .wx-tile-card children.
     */
    constructor(element) {
        super(element);
        const ds = element.dataset;
        this._movable = ds.movable === "true";
        this._allowRemove = ds.allowRemove === "true";
        this._persistKey = ds.persistKey || element.id || null;

        // check for large icon option
        this._largeIcon = ds.largeIcon === "true";
        if (this._largeIcon) {
            element.classList.add("wx-tile-picker-largeicon");
        } else {
            element.classList.remove("wx-tile-picker-largeicon");
        }

        this._tiles = this._parseInitialTiles(element);
        element.innerHTML = "";
        this._initTileContainer(element);
        this._loadState();
        this.render();
    }
    
    /**
     * Initializes or binds a pagination control and an information area.
     * @param {HTMLElement} host - The host element to search or attach the pager to.
     */
    _initTileContainer(host) {
        this._tileContainer = document.createElement("div");
        this._tileContainer.className = "wx-tile-container";
        
        host.appendChild(this._tileContainer);
    }

    /**
     * Renders all visible + matching tiles (full re-render).
     */
    render() {
        const states = this._collectStates();
        const el = this._element;
        this._tileContainer.innerHTML = "";
        el.classList.add("wx-tile");
        if (this._allowRemove) {
            el.classList.add("wx-tile-removable");
        }
        // toggle large icon class on root depending on option
        if (this._largeIcon) {
            el.classList.add("wx-tile-picker-largeicon");
        } else {
            el.classList.remove("wx-tile-picker-largeicon");
        }
        if (this._searchCacheDirty) {
            this._rebuildSearchCache();
        }

        const term = (this._filterTerm || "").toLowerCase();

        for (const tile of this._tiles) {
            if (!tile.visible) {
                continue;
            }
            if (term && !this._matchesFilter(tile, term)) {
                continue;
            }
            this._tileContainer.appendChild(this._buildCardElement(tile));
        }

        this._updateSnapshot(states);
        if (!this._initialized) {
            this._initialized = true;
        }
    }

    /**
     * Inserts a new tile.
     * @param {Object} tileData - Tile definition.
     * @param {number|null} index - Optional index.
     * @returns {Object} Inserted tile model.
     */
    insertTile(tileData, index = null) {
        const tile = {
            id: tileData.id || null,
            label: tileData.label || tileData.text || "",
            html: tileData.html || null,
            class: tileData.class || null,
            icon: tileData.icon || null,
            image: tileData.image || null,
            colorCss: tileData.colorCss || tileData.color || null,
            colorStyle: tileData.colorStyle || null,
            visible: tileData.visible !== false,
            
            // action attributes
            primaryAction: tileData.primaryAction,
            secondaryAction: tileData.secondaryAction,
            bind: tileData.bind,

            _lc_id: null,
            _lc_label: null
        };
        if (index == null || index < 0 || index > this._tiles.length) {
            index = this._tiles.length;
        }
        this._tiles.splice(index, 0, tile);
        this._markSearchDirty();
        this._schedulePersist();
        this.render();
        return tile;
    }

    /**
     * Deletes a tile by id.
     * @param {string} tileId - Tile id.
     * @returns {boolean} True if removed.
     */
    deleteTile(tileId) {
        if (!tileId) {
            return false;
        }
        const idx = this._tiles.findIndex(t => t.id === tileId);
        if (idx === -1) {
            return false;
        }
        this._tiles.splice(idx, 1);
        this._markSearchDirty();
        this._schedulePersist();
        this.render();
        return true;
    }

    /**
     * Sets tile visibility (if allowed).
     * @param {string|number} idOrIndex - Id or index.
     * @param {boolean} visible - Visibility.
     */
    setTileVisibility(idOrIndex, visible) {
        if (!this._allowRemove) {
            return;
        }
        const tile = this._getTileByIdOrIndex(idOrIndex);
        if (!tile || tile.visible === visible) {
            return;
        }
        tile.visible = visible;
        this._dispatchVisibilityEvent(tile);
        this._schedulePersist();
        this.render();
    }

    /**
     * Hides tile.
     * @param {string|number} idOrIndex - Id or index.
     */
    hideTile(idOrIndex) {
        this.setTileVisibility(idOrIndex, false);
    }

    /**
     * Shows tile.
     * @param {string|number} idOrIndex - Id or index.
     */
    showTile(idOrIndex) {
        this.setTileVisibility(idOrIndex, true);
    }

    /**
     * Toggles tile visibility.
     * @param {string|number} idOrIndex - Id or index.
     */
    toggleTile(idOrIndex) {
        const tile = this._getTileByIdOrIndex(idOrIndex);
        if (!tile) {
            return;
        }
        this.setTileVisibility(tile.id ?? this._tiles.indexOf(tile), !tile.visible);
    }

    /**
     * Returns visible tiles.
     * @returns {Array<Object>} Visible tile list.
     */
    getVisibleTiles() {
        return this._tiles.filter(t => t.visible);
    }

    /**
     * Filters tiles by search term.
     * @param {string} term - Search term.
     * @returns {Array<Object>} Matches.
     */
    searchTiles(term) {
        this._filterTerm = (term || "").trim();
        if (this._searchCacheDirty) {
            this._rebuildSearchCache();
        }
        const lower = this._filterTerm.toLowerCase();
        const matches = lower
            ? this._tiles.filter(t => this._matchesFilter(t, lower))
            : this._tiles.slice();
        this.render();
        this._dispatchSearchEvent(term, matches);
        return matches;
    }

    /**
     * Orders tiles by property.
     * @param {string} property - Property name.
     * @param {"asc"|"desc"} direction - Direction.
     */
    orderTiles(property = "label", direction = "asc") {
        const dir = direction === "desc" ? -1 : 1;
        const allNumeric = this._tiles.every(t => {
            const v = (t[property] ?? "").toString().trim();
            return v === "" || /^-?\d+(\.\d+)?$/.test(v);
        });

        this._tiles.sort((a, b) => {
            const va = a[property] ?? "";
            const vb = b[property] ?? "";
            if (allNumeric) {
                const na = parseFloat(va) || 0;
                const nb = parseFloat(vb) || 0;
                return (na - nb) * dir;
            }
            return va.toString().localeCompare(vb.toString(), undefined, { numeric: true }) * dir;
        });

        this._markSearchDirty();
        this._schedulePersist();
        this.render();
        this._dispatchSortEvent(property, direction);
    }

    /**
     * Parses initial markup.
     * @param {HTMLElement} root - Root element.
     * @returns {Array<Object>} Tiles.
     */
    _parseInitialTiles(root) {
        const list = [];
        root.querySelectorAll(":scope > .wx-tile-card").forEach(div => {
            const id = div.dataset.id || div.id || null;
            list.push({
                id: id,
                label: div.dataset.label || "",
                html: div.innerHTML.trim(),
                class: div.dataset.class || "",
                icon: div.dataset.icon || null,
                image: div.dataset.image || null,
                colorCss: div.dataset.colorCss || div.dataset.color || null,
                colorStyle: div.dataset.colorStyle || null,
                visible: div.dataset.visible === "false" ? false : true,
                // action attributes
                primaryAction: Object.fromEntries(Object.entries(div.dataset)
                    .filter(([k]) => k.startsWith("wxPrimary"))
                    .map(([k, v]) => [
                        k.slice(9).replace(/^./, c => c.toLowerCase()),
                        v === "true" ? true : v === "false" ? false : v
                    ])
                ),
                secondaryAction: Object.fromEntries(Object.entries(div.dataset)
                    .filter(([k]) => k.startsWith("wxSecondary"))
                    .map(([k, v]) => [
                        k.slice(9).replace(/^./, c => c.toLowerCase()),
                        v === "true" ? true : v === "false" ? false : v
                    ])
                ),
                _lc_id: null,
                _lc_label: null
            });
        });
        return list;
    }

    /**
     * Builds a tile card element.
     * Adds support for large icons if option enabled.
     * @param {Object} tile - Tile model.
     * @returns {HTMLElement} Card element.
     */
    _buildCardElement(tile) {
        const card = document.createElement("div");
        card.className = "wx-tile-card card";
        if (tile.id) {
            card.dataset.tileId = tile.id;
        }
        if (tile.class) {
            card.classList.add(...tile.class.split(/\s+/).filter(Boolean));
        }
        if (tile.colorCss) {
            card.classList.add(...tile.colorCss.split(/\s+/).filter(Boolean));
        }
        if (tile.colorStyle) {
            card.style.cssText = tile.colorStyle;
        }
        card.setAttribute("role", "group");

        // apply action attributes
        if (tile.primaryAction) {
            for (const [key, value] of Object.entries(tile.primaryAction)) {
                if (value) {
                    const htmlName = `data-wx-primary-${key.toLowerCase()}`;
                    card.setAttribute(htmlName, value);
                }
            }
        }

        if (tile.secondaryAction) {
            for (const [key, value] of Object.entries(tile.secondaryAction)) {
                if (value) {
                    const htmlName = `data-wx-secondary-${key.toLowerCase()}`;
                    card.setAttribute(htmlName, value);
                }
            }
        }

        // add remove button if removable
        if (this._allowRemove) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "wx-tile-remove-btn fas fa-times";
            btn.setAttribute("aria-label", "Close tile");
            btn.addEventListener("click", e => {
                e.stopPropagation();
                if (tile.id) {
                    this.deleteTile(tile.id);
                } else {
                    this.setTileVisibility(this._tiles.indexOf(tile), false);
                }
            });
            card.appendChild(btn);
        }

        // render header with icon/image/label and supporting large icons
        if (tile.label || tile.icon || tile.image) {
            const header = document.createElement("h5");
            header.className = "card-title";
            if (tile.icon) {
                const icon = document.createElement("i");
                icon.className = tile.icon;
                // add large icon class if enabled
                if (this._largeIcon) {
                    icon.classList.add("wx-tile-icon-large");
                }
                header.appendChild(icon);
                header.append(document.createTextNode(" "));
            }
            if (tile.image) {
                const img = document.createElement("img");
                img.className = "wx-icon";
                img.src = tile.image;
                img.alt = "";
                // add large icon class if enabled
                if (this._largeIcon) {
                    img.classList.add("wx-tile-icon-large");
                }
                header.appendChild(img);
                header.append(document.createTextNode(" "));
            }
            header.append(document.createTextNode(tile.label ?? ""));
            card.appendChild(header);
        }

        const body = document.createElement("div");
        body.className = "card-body";
        if (tile.html) {
            body.innerHTML = tile.html;
        }
        card.appendChild(body);

        // add drag and drop support if movable
        if (this._movable) {
            card.setAttribute("draggable", "true");
            card.addEventListener("dragstart", e => this._onDragStart(e, tile, card));
            card.addEventListener("dragend", e => this._onDragEnd(e, tile, card));
            card.addEventListener("dragover", e => this._onDragOver(e, tile, card));
            card.addEventListener("dragleave", e => this._onDragLeave(e, tile, card));
            card.addEventListener("drop", e => this._onDrop(e, tile, card));
        }

        return card;
    }

    /**
     * Returns tile by id or index.
     * @param {string|number} idOrIndex - Id or index.
     * @returns {Object|null} Tile or null.
     */
    _getTileByIdOrIndex(idOrIndex) {
        if (typeof idOrIndex === "number") {
            return this._tiles[idOrIndex] || null;
        }
        if (!idOrIndex) {
            return null;
        }
        return this._tiles.find(t => t.id === idOrIndex) || null;
    }

    /**
     * Marks search cache dirty.
     */
    _markSearchDirty() {
        this._searchCacheDirty = true;
    }

    /**
     * Rebuilds lowercase cache.
     */
    _rebuildSearchCache() {
        for (const t of this._tiles) {
            t._lc_id = t.id ? t.id.toLowerCase() : "";
            t._lc_label = t.label ? t.label.toLowerCase() : "";
        }
        this._searchCacheDirty = false;
    }

    /**
     * Checks filter match.
     * @param {Object} tile - Tile.
     * @param {string} term - Lowercase term.
     * @returns {boolean} Match.
     */
    _matchesFilter(tile, term) {
        return (tile._lc_id && tile._lc_id.includes(term)) ||
               (tile._lc_label && tile._lc_label.includes(term));
    }

    /**
     * Computes insertion side (before/after) relative to pointer.
     * Chooses axis by greater dimension (vertical if height >= width).
     * @param {DragEvent} e - Drag event.
     * @param {HTMLElement} card - Target card.
     * @returns {"before"|"after"} Side.
     */
    _computeInsertionSide(e, card) {
        const r = card.getBoundingClientRect();
        const vertical = r.height >= r.width;
        if (vertical) {
            const midY = r.top + r.height / 2;
            return e.clientY < midY ? "before" : "after";
        } else {
            const midX = r.left + r.width / 2;
            return e.clientX < midX ? "before" : "after";
        }
    }

    /**
     * Clears side highlight classes from all cards.
     */
    _clearSideHighlights() {
        this._element.querySelectorAll(".wx-drop-before, .wx-drop-after").forEach(el => {
            el.classList.remove("wx-drop-before", "wx-drop-after");
            el.removeAttribute("data-drop-side");
        });
    }

    /**
     * Drag start handler.
     * @param {DragEvent} e - Event.
     * @param {Object} tile - Tile.
     * @param {HTMLElement} card - Card.
     */
    _onDragStart(e, tile, card) {
        this._dragTile = tile;
        card.classList.add("wx-dragging");
        try {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", tile.id || "");
        } catch (_) {
            // ignore
        }
    }

    /**
     * Drag end handler.
     * @param {DragEvent} e - Event.
     * @param {Object} tile - Tile.
     * @param {HTMLElement} card - Card.
     */
    _onDragEnd(e, tile, card) {
        card.classList.remove("wx-dragging", "wx-drop-target");
        this._clearDropTargets();
        this._clearSideHighlights();
        this._dragTile = null;
    }

    /**
     * Drag over handler.
     * @param {DragEvent} e - Event.
     * @param {Object} tile - Target tile.
     * @param {HTMLElement} card - Card element.
     */
    _onDragOver(e, tile, card) {
        if (!this._dragTile || this._dragTile === tile) {
            return;
        }
        e.preventDefault();

        const side = this._computeInsertionSide(e, card);
        if (card.dataset.dropSide !== side) {
            card.dataset.dropSide = side;
            card.classList.remove("wx-drop-before", "wx-drop-after", "wx-drop-target");
            if (side === "before") {
                card.classList.add("wx-drop-before", "wx-drop-target");
            } else {
                card.classList.add("wx-drop-after", "wx-drop-target");
            }
        }
    }

    /**
     * Drag leave handler.
     * @param {DragEvent} e - Event.
     * @param {Object} tile - Tile.
     * @param {HTMLElement} card - Card.
     */
    _onDragLeave(e, tile, card) {
        if (this._dragTile === tile) {
            return;
        }
        // only remove highlight if leaving card bounds completely
        const r = card.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
            card.classList.remove("wx-drop-before", "wx-drop-after", "wx-drop-target");
            card.removeAttribute("data-drop-side");
        }
    }

    /**
     * Drop handler (inserts before or after depending on stored side).
     * @param {DragEvent} e - Event.
     * @param {Object} targetTile - Target tile.
     * @param {HTMLElement} card - Card element.
     */
    _onDrop(e, targetTile, card) {
        e.preventDefault();
        if (!this._dragTile || this._dragTile === targetTile) {
            return;
        }

        // derive side; fallback to after
        let side = card.dataset.dropSide;
        if (side !== "before" && side !== "after") {
            side = this._computeInsertionSide(e, card);
        }

        const sourceIndex = this._tiles.indexOf(this._dragTile);
        const targetIndexOriginal = this._tiles.indexOf(targetTile);
        if (sourceIndex < 0 || targetIndexOriginal < 0) {
            return;
        }

        // remove source first
        this._tiles.splice(sourceIndex, 1);

        // adjust target index if source was before target
        let targetIndex = targetIndexOriginal;
        if (sourceIndex < targetIndexOriginal) {
            targetIndex--;
        }

        let insertIndex = side === "before" ? targetIndex : targetIndex + 1;
        if (insertIndex < 0) {
            insertIndex = 0;
        }
        if (insertIndex > this._tiles.length) {
            insertIndex = this._tiles.length;
        }

        this._tiles.splice(insertIndex, 0, this._dragTile);

        if (sourceIndex !== insertIndex) {
            this._dispatchReorderEvent(this._dragTile, sourceIndex, insertIndex);
            this._schedulePersist();
        }

        this._dragTile = null;
        this._clearDropTargets();
        this._clearSideHighlights();
        this.render();
    }

    /**
     * Clears generic drag target classes.
     */
    _clearDropTargets() {
        this._element.querySelectorAll(".wx-drop-target, .wx-dragging, .wx-drop-target").forEach(el => {
            el.classList.remove("wx-drop-target", "wx-dragging", "wx-drop-target");
        });
    }

    /**
     * Dispatches reorder event.
     * @param {Object} tile - Tile moved.
     * @param {number} from - Old index.
     * @param {number} to - New index.
     */
    _dispatchReorderEvent(tile, from, to) {
        this._dispatchEvent("MOVE_EVENT", {
            sender: this._element,
            id: this._element.id,
            from: from,
            to: to,
            order: this._tiles.map(t => t.id)
        });
    }

    /**
     * Dispatches visibility event.
     * @param {Object} tile - Tile.
     */
    _dispatchVisibilityEvent(tile) {
        this._dispatchEvent("CHANGE_VISIBILITY_EVENT", {
            sender: this._element,
            id: this._element.id,
            visible: tile.visible
        });
    }

    /**
     * Dispatches search event.
     * @param {string} term - Search term.
     * @param {Array<Object>} matches - Matches.
     */
    _dispatchSearchEvent(term, matches) {
        this._dispatchEvent("TILE_SEARCH_EVENT", {
            sender: this._element,
            id: this._element.id,
            term: term,
            matches: matches.map(m => ({ id: m.id, label: m.label }))
        });
    }

    /**
     * Dispatches sort event.
     * @param {string} property - Property.
     * @param {string} direction - Direction.
     */
    _dispatchSortEvent(property, direction) {
        this._dispatchEvent("TILE_SORT_EVENT", {
            sender: this._element,
            id: this._element.id,
            property: property,
            direction: direction
        });
    }

    /**
     * Dispatch helper resolves event constant.
     * @param {string} constName - Event constant name.
     * @param {Object} detail - Detail payload.
     */
    _dispatchEvent(constName, detail) {
        const evRoot = webexpress?.webui?.Event;
        const eventName = (evRoot && evRoot[constName]) || constName;
        this._dispatch(eventName, { detail });
    }

    /**
     * Collects state signatures.
     * @returns {Array<Object>} Signatures.
     */
    _collectStates() {
        return this._tiles.map(t => ({
            key: t.id || "",
            signature: (t.label || "") + "|" + (t.visible ? "1" : "0")
        }));
    }

    /**
     * Updates snapshot.
     * @param {Array} states - States.
     */
    _updateSnapshot(states) {
        this._prevState.clear();
        for (const s of states) {
            this._prevState.set(s.key, s.signature);
        }
    }

    /**
     * Debounced persist scheduling.
     */
    _schedulePersist() {
        if (!this._persistKey) {
            return;
        }
        if (this._saveDebounce) {
            clearTimeout(this._saveDebounce);
        }
        this._saveDebounce = setTimeout(() => this._persist(), 120);
    }

    /**
     * Persists order + visibility.
     */
    _persist() {
        if (!this._persistKey) {
            return;
        }
        try {
            const state = {
                v: 1,
                order: this._tiles.map(t => t.id),
                visible: this._tiles.filter(t => t.visible).map(t => t.id)
            };
            const json = encodeURIComponent(JSON.stringify(state));
            document.cookie = `${this._persistKey}=${json}; path=/; SameSite=Lax`;
        } catch (_) {
            // ignore
        }
    }

    /**
     * Loads persisted state from cookie.
     */
    _loadState() {
        if (!this._persistKey) {
            return;
        }
        const raw = this._readCookie(this._persistKey);
        if (!raw) {
            return;
        }
        try {
            const obj = JSON.parse(decodeURIComponent(raw));
            if (!obj || obj.v !== 1) {
                return;
            }
            if (Array.isArray(obj.order) && obj.order.length) {
                const map = new Map(this._tiles.map(t => [t.id, t]));
                const reordered = [];
                for (const id of obj.order) {
                    if (map.has(id)) {
                        reordered.push(map.get(id));
                    }
                }
                for (const t of this._tiles) {
                    if (!reordered.includes(t)) {
                        reordered.push(t);
                    }
                }
                this._tiles = reordered;
            }
            if (Array.isArray(obj.visible)) {
                const vis = new Set(obj.visible);
                for (const t of this._tiles) {
                    t.visible = t.id ? vis.has(t.id) : t.visible;
                }
            }
            this._markSearchDirty();
        } catch (_) {
            // ignore malformed cookie
        }
    }

    /**
     * Reads a cookie by name.
     * @param {string} name - Cookie name.
     * @returns {string|null} Value.
     */
    _readCookie(name) {
        if (!name) {
            return null;
        }
        const parts = document.cookie.split(";").map(s => s.trim());
        for (const p of parts) {
            if (p.startsWith(name + "=")) {
                return p.substring(name.length + 1);
            }
        }
        return null;
    }
};

// register controller class
webexpress.webui.Controller.registerClass("wx-webui-tile", webexpress.webui.TileCtrl);