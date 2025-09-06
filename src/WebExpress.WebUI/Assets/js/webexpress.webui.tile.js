/**
 * TileCtrl
 * Simple tile controller converting declarative markup into an interactive tile board.
 * Source markup example:
 * <div class="wx-webui-tile" data-movable-tile="true" data-persist-key="mytiles">
 *   <div class="wx-tile-card" data-id="t1">eins</div>
 *   <div class="wx-tile-card" data-id="t2">zwei</div>
 * </div>
 *
 * Features:
 *  - Parses existing .wx-tile-card children into internal model
 *  - Drag & drop reordering (dropping onto tile inserts before target)
 *  - Visibility control API
 *  - Optional persistence (order + visibility) via cookie using data-persist-key or element id
 *  - Searching/filtering via API
 *  - Optional remove/hide button (×) if removal allowed
 *
 * Public API:
 *  - insertTile(tileData, index = null)
 *  - deleteTile(tileId)
 *  - setTileVisibility(idOrIndex, visible)
 *  - hideTile(idOrIndex)
 *  - showTile(idOrIndex)
 *  - toggleTile(idOrIndex)
 *  - getVisibleTiles()
 *  - searchTiles(term)
 *  - orderTiles(property = "label", direction = "asc")
 *  - render()
 *
 * Dispatched Events (if webexpress.webui.Event provides constants they are used, else only CustomEvent names):
 *  - MOVE_EVENT
 *  - CHANGE_VISIBILITY_EVENT
 *  - TILE_SEARCH_EVENT
 *  - TILE_SORT_EVENT
 */
webexpress.webui.TileCtrl = class extends webexpress.webui.Ctrl {

    // element references
    _container = null;

    // state data
    _tiles = [];

    // filtered term
    _filterTerm = "";

    // flags
    _movable = false;
    _allowRemove = false;
    _removeMode = "hide"; // hide | delete

    // drag state
    _dragTile = null;

    // persistence
    _persistKey = null;
    _saveDebounce = null;

    // snapshot for change highlight (optional future use)
    _prevState = new Map();
    _initialized = false;

    /**
     * Constructs tile controller from root element.
     * @param {HTMLElement} element Root node containing .wx-tile-card children.
     */
    constructor(element) {
        super(element);
        this._container = element;
        // capture dataset (with fallbacks for legacy attribute names)
        const ds = element.dataset;
        // prefer data-movable-tile
        this._movable = (ds.movableTile ?? ds.movable) === "true";
        // prefer data-allow-tile-remove
        const allowRaw = (ds.allowTileRemove ?? ds.allowRemove);
        if (allowRaw != null) this._allowRemove = allowRaw !== "false";
        // optional remove mode
        if (ds.removeMode === "delete") this._removeMode = "delete";
        this._persistKey = ds.persistKey || element.id || null;

        // parse initial tiles
        this._tiles = this._parseInitialTiles(element);

        // load persisted state
        this._loadState();

        // render (replaces original children)
        this.render();
    }

    /**
     * Renders all tiles based on current model.
     */
    render() {
        // compute state before full rerender (for potential change detection)
        const states = this._collectStates();

        // clear existing
        this._container.innerHTML = "";
        this._container.classList.add("wx-tile");
        if (this._allowRemove) this._container.classList.add("wx-tile-removable");

        // create fragment
        const frag = document.createDocumentFragment();
        const term = (this._filterTerm || "").toLowerCase();

        for (const tile of this._tiles) {
            // skip invisible tiles
            if (!tile.visible) continue;
            // filter
            if (term && !((tile.id || "").toLowerCase().includes(term) || (tile.label || "").toLowerCase().includes(term))) continue;

            const card = document.createElement("div");
            card.className = "wx-tile-card card";
            card.dataset.tileId = tile.id || "";
            if (tile.class) card.classList.add(...tile.class.split(/\s+/).filter(Boolean));
            if (tile.colorCss) card.classList.add(...tile.colorCss.split(/\s+/).filter(Boolean));
            if (tile.colorStyle) card.style.cssText = tile.colorStyle;

            // optional remove button (×)
            if (this._allowRemove) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "wx-tile-remove-btn fas fa-times";
                btn.setAttribute("aria-label", "Close tile");
                btn.addEventListener("click", e => {
                    e.stopPropagation();
                    if (this._removeMode === "delete") {
                        if (tile.id) this.deleteTile(tile.id);
                        else this.setTileVisibility(this._tiles.indexOf(tile), false);
                    } else {
                        this.setTileVisibility(tile.id || this._tiles.indexOf(tile), false);
                    }
                });
                card.appendChild(btn);
            }

            // header (optional)
            if (tile.label || tile.icon || tile.image) {
                const header = document.createElement("h5");
                header.className = "card-title";

                // icon
                if (tile.icon) {
                    const icon = document.createElement("i");
                    icon.className = tile.icon;
                    header.appendChild(icon);
                    header.append(document.createTextNode(" "));
                }

                // image
                if (tile.image) {
                    const img = document.createElement("img");
                    img.src = tile.image;
                    img.alt = "";
                    header.appendChild(img);
                    header.append(document.createTextNode(" "));
                }

                header.append(document.createTextNode(tile.label ?? ""));
                card.appendChild(header);
            }

            // body
            const body = document.createElement("div");
            body.className = "card-body";
            if (tile.html) {
                // insert preserved html (assumed sanitized)
                body.innerHTML = tile.html;
            }
            card.appendChild(body);

            // drag & drop
            if (this._movable) {
                card.setAttribute("draggable", "true");
                card.addEventListener("dragstart", e => this._onDragStart(e, tile, card));
                card.addEventListener("dragend", e => this._onDragEnd(e, tile, card));
                card.addEventListener("dragover", e => this._onDragOver(e, tile, card));
                card.addEventListener("dragleave", e => this._onDragLeave(e, tile, card));
                card.addEventListener("drop", e => this._onDrop(e, tile, card));
            }

            frag.appendChild(card);
        }

        this._container.appendChild(frag);

        // update snapshot
        this._updateSnapshot(states);
        if (!this._initialized) this._initialized = true;
    }

    /**
     * Inserts a new tile.
     * @param {Object} tileData Definition (id, label, html, class, colorCss, colorStyle, visible, icon, image).
     * @param {number|null} index Index or end.
     * @returns {Object} Inserted tile.
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
            visible: tileData.visible !== false
        };
        if (index == null || index < 0 || index > this._tiles.length) index = this._tiles.length;
        this._tiles.splice(index, 0, tile);
        this._schedulePersist();
        this.render();
        return tile;
    }

    /**
     * Deletes a tile by id.
     * @param {string} tileId Tile id.
     * @returns {boolean} True if removed.
     */
    deleteTile(tileId) {
        const idx = this._tiles.findIndex(t => t.id === tileId);
        if (idx === -1) return false;
        this._tiles.splice(idx, 1);
        this._schedulePersist();
        this.render();
        return true;
    }

    /**
     * Sets tile visibility.
     * @param {string|number} idOrIndex Identifier or numeric index.
     * @param {boolean} visible Visibility.
     */
    setTileVisibility(idOrIndex, visible) {
        const tile = typeof idOrIndex === "number"
            ? this._tiles[idOrIndex]
            : this._tiles.find(t => t.id === idOrIndex);
        if (!tile || tile.visible === visible || !this._allowRemove) return;
        tile.visible = visible;
        this._dispatchVisibilityEvent(tile);
        this._schedulePersist();
        this.render();
    }

    /**
     * Hides a tile.
     * @param {string|number} idOrIndex Identifier or index.
     */
    hideTile(idOrIndex) { this.setTileVisibility(idOrIndex, false); }

    /**
     * Shows a tile.
     * @param {string|number} idOrIndex Identifier or index.
     */
    showTile(idOrIndex) { this.setTileVisibility(idOrIndex, true); }

    /**
     * Toggles a tile.
     * @param {string|number} idOrIndex Identifier or index.
     */
    toggleTile(idOrIndex) {
        const tile = typeof idOrIndex === "number"
            ? this._tiles[idOrIndex]
            : this._tiles.find(t => t.id === idOrIndex);
        if (!tile) return;
        this.setTileVisibility(tile.id || this._tiles.indexOf(tile), !tile.visible);
    }

    /**
     * Returns visible tiles.
     * @returns {Array<Object>} Visible tiles.
     */
    getVisibleTiles() {
        return this._tiles.filter(t => t.visible);
    }

    /**
     * Filters tiles by search term (label/id).
     * @param {string} term Search string.
     * @returns {Array<Object>} Matching tiles.
     */
    searchTiles(term) {
        this._filterTerm = (term || "").trim();
        const lower = this._filterTerm.toLowerCase();
        const matches = this._tiles.filter(t =>
            (t.id && t.id.toLowerCase().includes(lower)) ||
            (t.label && t.label.toLowerCase().includes(lower))
        );
        this.render();
        this._dispatchSearchEvent(term, matches);
        return matches;
    }

    /**
     * Orders tiles by property (label or custom).
     * @param {string} property Property to sort by.
     * @param {"asc"|"desc"} direction Sort direction.
     */
    orderTiles(property = "label", direction = "asc") {
        const numeric = this._tiles.every(t => {
            const v = (t[property] || "").trim();
            return v === "" || /^-?\d+(?:\.\d+)?$/.test(v);
        });
        this._tiles.sort((a, b) => {
            const va = a[property] || "";
            const vb = b[property] || "";
            if (direction === "asc") {
                return numeric ? (parseFloat(va) || 0) - (parseFloat(vb) || 0)
                    : va.localeCompare(vb, undefined, { numeric: true });
            }
            return numeric ? (parseFloat(vb) || 0) - (parseFloat(va) || 0)
                : vb.localeCompare(va, undefined, { numeric: true });
        });
        this._schedulePersist();
        this.render();
        this._dispatchSortEvent(property, direction);
    }

    /**
     * Parses initial markup tiles.
     * @param {HTMLElement} root Container element.
     * @returns {Array<Object>} Tiles list.
     */
    _parseInitialTiles(root) {
        const out = [];
        const children = root.querySelectorAll(":scope > .wx-tile-card");
        children.forEach(div => {
            const id = div.dataset.id || div.id || null;
            out.push({
                id: id,
                label: div.dataset.label,
                html: div.innerHTML.trim(),
                class: div.dataset.class || "",
                icon: div.dataset.icon || null,
                image: div.dataset.image || null,
                colorCss: div.dataset.colorCss || div.dataset.color || null,
                colorStyle: div.dataset.colorStyle || null,
                visible: div.dataset.visible === "false" ? false : true
            });
        });
        return out;
    }

    /**
     * Handles drag start.
     * @param {DragEvent} e Event.
     * @param {Object} tile Tile object.
     * @param {HTMLElement} card Element.
     */
    _onDragStart(e, tile, card) {
        this._dragTile = tile;
        card.classList.add("wx-dragging");
        try { e.dataTransfer.effectAllowed = "move"; } catch (_) { }
    }

    /**
     * Handles drag end cleanup.
     * @param {DragEvent} e Event.
     * @param {Object} tile Tile object.
     * @param {HTMLElement} card Element.
     */
    _onDragEnd(e, tile, card) {
        card.classList.remove("wx-dragging");
        this._clearDropTargets();
        this._dragTile = null;
    }

    /**
     * Handles drag over to show drop target.
     * @param {DragEvent} e Event.
     * @param {Object} tile Target tile.
     * @param {HTMLElement} card Card element.
     */
    _onDragOver(e, tile, card) {
        if (!this._dragTile || this._dragTile === tile) return;
        e.preventDefault();
        card.classList.add("wx-drop-target");
    }

    /**
     * Handles drag leave to remove highlight.
     * @param {DragEvent} e Event.
     * @param {Object} tile Tile object.
     * @param {HTMLElement} card Element.
     */
    _onDragLeave(e, tile, card) {
        if (this._dragTile === tile) return;
        card.classList.remove("wx-drop-target");
    }

    /**
     * Handles drop to reorder.
     * @param {DragEvent} e Event.
     * @param {Object} targetTile Target tile.
     * @param {HTMLElement} card Element.
     */
    _onDrop(e, targetTile, card) {
        e.preventDefault();
        if (!this._dragTile || this._dragTile === targetTile) return;
        const sourceIndex = this._tiles.indexOf(this._dragTile);
        const targetIndex = this._tiles.indexOf(targetTile);
        if (sourceIndex === -1 || targetIndex === -1) return;
        // remove from old
        this._tiles.splice(sourceIndex, 1);
        // insert before targetIndex (drop onto = insert before)
        const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        this._tiles.splice(insertIndex, 0, this._dragTile);

        this._dispatchReorderEvent(this._dragTile, sourceIndex, insertIndex);
        this._schedulePersist();
        this._dragTile = null;
        this._clearDropTargets();
        this.render();
    }

    /**
     * Clears all drop/drag visual markers.
     */
    _clearDropTargets() {
        this._container.querySelectorAll(".wx-drop-target, .wx-dragging")
            .forEach(el => el.classList.remove("wx-drop-target", "wx-dragging"));
    }

    /**
     * Dispatches reorder event.
     * @param {Object} tile Tile moved.
     * @param {number} from Old index.
     * @param {number} to New index.
     */
    _dispatchReorderEvent(tile, from, to) {
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.MOVE_EVENT, {
            detail: {
                sender: this._element,
                id: this._element.id,
                from,
                to,
                order: this._tiles.map(t => t.id)
            }
        }));
    }

    /**
     * Dispatches visibility event.
     * @param {Object} tile Tile.
     */
    _dispatchVisibilityEvent(tile) {
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
            detail: {
                sender: this._element,
                id: this._element.id,
                visible: tile.visible
            }
        }));
    }

    /**
     * Dispatches search event.
     * @param {string} term Search term.
     * @param {Array<Object>} matches Matches.
     */
    _dispatchSearchEvent(term, matches) {
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.TILE_SEARCH_EVENT, {
            detail: {
                sender: this._element,
                id: this._element.id,
                term,
                matches: matches.map(m => ({ id: m.id, label: m.label }))
            }
        }));
    }

    /**
     * Dispatches sort event.
     * @param {string} property Property name.
     * @param {string} direction Direction.
     */
    _dispatchSortEvent(property, direction) {
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.TILE_SORT_EVENT, {
            detail: {
                sender: this._element,
                id: this._element.id,
                property,
                direction
            }
        }));
    }

    /**
     * Collects tile states for diff.
     * @returns {Array<{key:string,signature:string}>} States.
     */
    _collectStates() {
        return this._tiles.map(t => ({
            key: t.id || "",
            signature: (t.label || "") + "|" + (t.visible ? "1" : "0")
        }));
    }

    /**
     * Updates snapshot after render.
     * @param {Array} states States list.
     */
    _updateSnapshot(states) {
        this._prevState.clear();
        for (const s of states) this._prevState.set(s.key, s.signature);
    }

    /**
     * Schedules persistence with debounce.
     */
    _schedulePersist() {
        if (!this._persistKey) return;
        if (this._saveDebounce) clearTimeout(this._saveDebounce);
        this._saveDebounce = setTimeout(() => this._persist(), 120);
    }

    /**
     * Persists order and visibility to cookie.
     */
    _persist() {
        if (!this._persistKey) return;
        const state = {
            v: 1,
            order: this._tiles.map(t => t.id),
            visible: this._tiles.filter(t => t.visible).map(t => t.id)
        };
        const json = encodeURIComponent(JSON.stringify(state));
        document.cookie = `${this._persistKey}=${json}; path=/; SameSite=Lax`;
    }

    /**
     * Loads persisted state if cookie exists.
     */
    _loadState() {
        if (!this._persistKey) return;
        const raw = this._readCookie(this._persistKey);
        if (!raw) return;
        try {
            const obj = JSON.parse(decodeURIComponent(raw));
            if (!obj || obj.v !== 1) return;
            // reorder
            if (Array.isArray(obj.order) && obj.order.length) {
                const map = new Map(this._tiles.map(t => [t.id, t]));
                const reordered = [];
                obj.order.forEach(id => { if (map.has(id)) reordered.push(map.get(id)); });
                // append any missing
                this._tiles.forEach(t => { if (!reordered.includes(t)) reordered.push(t); });
                this._tiles = reordered;
            }
            // visibility
            if (Array.isArray(obj.visible)) {
                const vis = new Set(obj.visible);
                this._tiles.forEach(t => t.visible = vis.has(t.id));
            }
        } catch (_) {
            // ignore parse errors
        }
    }

    /**
     * Reads cookie value by name.
     * @param {string} name Cookie name.
     * @returns {string|null} Value or null.
     */
    _readCookie(name) {
        if (!name) return null;
        const prefix = name + "=";
        const parts = document.cookie.split(";").map(p => p.trim());
        for (const p of parts) if (p.startsWith(prefix)) return p.substring(prefix.length);
        return null;
    }
};

// register controller
webexpress.webui.Controller.registerClass("wx-webui-tile", webexpress.webui.TileCtrl);