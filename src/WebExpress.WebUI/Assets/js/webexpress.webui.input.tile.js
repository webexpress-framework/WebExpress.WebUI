/**
 * A form field for selecting one or multiple tiles as styled tile cards.
 * Stores the selected tile id(s) as a semicolon-separated string in a hidden input.
 * Triggers:
 *  - webexpress.webui.Event.CLICK_EVENT
 *  - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.InputTileCtrl = class extends webexpress.webui.Ctrl {
    _tiles = [];
    _value = null;
    _hidden = null;
    _tileList = null;
    _multiselect = false;
    _lastSelectedIdx = null;
    _largeIcon = false;
    _searchable = false;
    _searchPlaceholder = "";
    _searchTerm = "";
    _searchInput = null;
    _columns = 0;
    _filterSource = null;
    _filterValue = null;
    _emptyText = "";
    _emptyElement = null;

    /**
     * Constructs the tile picker input field.
     * @param {HTMLElement} element - The root element of the picker.
     */
    constructor(element) {
        super(element);
        const id = element.getAttribute("id");
        const name = element.getAttribute("name") || element.id;

        // check for multiselect option
        this._multiselect = element.dataset.multiselect === "true";

        // check for large icon option
        this._largeIcon = element.dataset.largeIcon === "true";

        // search, grid and filter options
        this._searchable = element.dataset.searchable === "true";
        this._searchPlaceholder = element.dataset.searchPlaceholder || "";
        this._columns = parseInt(element.dataset.columns, 10) || 0;
        this._filterSource = element.dataset.filterSource || null;
        this._emptyText = element.dataset.emptyText || "";

        this._hidden = this._createHiddenInput();
        if (id) {
            this._hidden.setAttribute("id", id);
        }
        if (name) {
            this._hidden.setAttribute("name", name);
        }
        // a hidden input is barred from native constraint validation, so a required
        // picker declares itself to the form controller instead
        if (element.dataset.required === "true") {
            this._hidden.dataset.wxRequired = "true";
        }

        // load tile data
        this._tiles = this._parseTiles(element.querySelectorAll(".wx-tile-card"));

        // initialize value (single: string; multi: array)
        const value = element.dataset.value || null;
        // element layout vorbereiten (tileList & hidden input setzen)
        this._tileList = document.createElement("div");
        this._tileList.className = "wx-tile-picker-tiles";
        element.innerHTML = "";
        element.removeAttribute("id");
        element.removeAttribute("name");
        element.removeAttribute("data-value");

        if (this._searchable) {
            element.appendChild(this._createSearchBox());
        }

        element.appendChild(this._tileList);

        this._emptyElement = document.createElement("div");
        this._emptyElement.className = "wx-tile-picker-empty";
        this._emptyElement.textContent = this._emptyText;
        this._emptyElement.style.display = "none";
        element.appendChild(this._emptyElement);

        if (name || id) {
            element.appendChild(this._hidden);
        }
        element.classList.add("wx-tile-picker");

        if (this._largeIcon) {
            element.classList.add("wx-tile-picker-largeicon");
        } else {
            element.classList.remove("wx-tile-picker-largeicon");
        }

        if (this._multiselect) {
            this._value = [];
            if (value) {
                this.value = value;
            }
        } else {
            this._value = null;
            if (value) {
                this.value = value;
            }
        }

        this._attachFilterSource();
        this.render();
    }

    /**
     * Returns whether multi-selection mode is enabled.
     * @returns {boolean} True if multi-selection is enabled.
     */
    get multiselect() {
        return this._multiselect;
    }

    /**
     * Sets the multi-selection mode.
     * Converts value if mode changes.
     * @param {boolean} val - Enable or disable multi-selection.
     */
    set multiselect(val) {
        const next = !!val;
        if (next !== this._multiselect) {
            this._multiselect = next;
            // re-initialize value based on mode
            this._value = next ? [] : null;
            this.render();
        }
    }

    /**
     * Indicates whether large‑icon mode is enabled.
     * @returns {boolean} True if large icons are used.
     */
    get largeIcon() {
        return this._largeIcon;
    }

    /**
     * Enables or disables the large‑icon option.
     * @param {boolean} val - True for large icons, false for the standard size.
     */
    set largeIcon(val) {
        const next = !!val;
        if (next !== this._largeIcon) {
            this._largeIcon = next;

            if (this._tileList && this._tileList.parentElement) {
                if (this._largeIcon) {
                    this._tileList.parentElement.classList.add("wx-tile-picker-largeicon");
                } else {
                    this._tileList.parentElement.classList.remove("wx-tile-picker-largeicon");
                }
            }

            this.render();
        }
    }

    /**
     * Creates a hidden input field for storing the value.
     * @returns {HTMLInputElement} The hidden input element.
     */
    _createHiddenInput() {
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        return input;
    }

    /**
     * Creates the search box shown above the tiles.
     * @returns {HTMLElement} The search box wrapper.
     */
    _createSearchBox() {
        const wrapper = document.createElement("div");
        wrapper.className = "wx-tile-picker-search";

        const icon = document.createElement("i");
        icon.className = this._iconClass("search");
        wrapper.appendChild(icon);

        this._searchInput = document.createElement("input");
        this._searchInput.type = "search";
        this._searchInput.className = "form-control";
        this._searchInput.autocomplete = "off";
        this._searchInput.placeholder = this._searchPlaceholder;
        this._searchInput.setAttribute("aria-label", this._searchPlaceholder);
        this._searchInput.addEventListener("input", () => {
            this._searchTerm = this._searchInput.value.trim().toLowerCase();
            this.render();
        });

        // a search box inside a form must not submit it when enter is pressed
        this._searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
            }
        });

        wrapper.appendChild(this._searchInput);

        return wrapper;
    }

    /**
     * Parses tile data from DOM nodes with the .wx-tile-card class.
     * @param {NodeList} tileNodes - Collection of tile DOM nodes.
     * @returns {Array<Object>} Array of normalized tile objects.
     */
    _parseTiles(tileNodes) {
        const tiles = [];
        tileNodes.forEach(div => {
            const id = div.dataset.id || div.id || "";
            let label = div.dataset.label || "";
            if (!label && div.querySelector(".card-title")) {
                label = div.querySelector(".card-title").textContent.trim();
            }

            // the footer is authored as a child of the card, but is rendered after
            // the body, so it is taken out of the markup that becomes the body
            const source = div.cloneNode(true);
            const footerElement = source.querySelector(".wx-tile-card-footer");
            const footer = footerElement ? footerElement.innerHTML.trim() : null;
            if (footerElement) {
                footerElement.remove();
            }

            tiles.push({
                id,
                label: label || id,
                badge: div.dataset.badge || null,
                badgeColorCss: div.dataset.badgeColorCss || null,
                badgeColorStyle: div.dataset.badgeColorStyle || null,
                chip: div.dataset.chip || null,
                html: source.innerHTML.trim(),
                footer: footer,
                class: div.dataset.class || "",
                icon: div.dataset.icon || null,
                image: div.dataset.image || null,
                colorCss: div.dataset.colorCss || div.dataset.color || null,
                colorStyle: div.dataset.colorStyle || null,
                filterValue: div.dataset.filterValue || null,
                alwaysVisible: div.dataset.alwaysVisible === "true",

                // values the tile projects into the surrounding form when selected
                bindings: Object.fromEntries(Object.entries(div.dataset)
                    .filter(([k]) => k.startsWith("wxBind"))
                    .map(([k, v]) => [k.slice(6).toLowerCase(), v])
                ),

                // parse action attributes
                primaryAction: div.dataset.wxPrimaryAction || null,
                primaryTarget: div.dataset.wxPrimaryTarget || null,
                primaryUri: div.dataset.wxPrimaryUri || null,
                secondaryAction: div.dataset.wxSecondaryAction || null,
                secondaryTarget: div.dataset.wxSecondaryTarget || null,
                secondaryUri: div.dataset.wxSecondaryUri || null,

                // lowercase haystack, built once, for the search box
                search: [label, div.dataset.badge, div.dataset.chip, source.textContent]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
            });
        });
        return tiles;
    }

    /**
     * Sets the tile array and re-renders the picker.
     * @param {Array<Object>} tiles - Array of tile objects.
     */
    set tiles(tiles) {
        this._tiles = tiles;
        this.render();
    }

    /**
     * Gets the current tile array.
     * @returns {Array<Object>} Current tiles.
     */
    get tiles() {
        return this._tiles;
    }

    /**
     * Gets the currently selected value(s).
     * For multi-selection returns a semicolon-separated string. Otherwise a string or "".
     * @returns {string} Current value as string.
     */
    get value() {
        if (this._multiselect) {
            return Array.isArray(this._value) ? this._value.join(";") : "";
        }
        return this._value || "";
    }

    /**
     * Sets the selected value(s).
     * Accepts a single id, an array of ids, or a semicolon-separated string.
     * Dispatches the value change event if applicable.
     * @param {string|Array} input - The value(s) to set.
     */
    set value(input) {
        if (this._multiselect) {
            let arr = [];
            if (Array.isArray(input)) {
                arr = input.map(x => String(x).trim()).filter(Boolean);
            } else if (typeof input === "string") {
                arr = input.split(";").map(x => x.trim()).filter(Boolean);
            } else if (input != null) {
                arr = [String(input).trim()];
            }
            const validIds = new Set(this._tiles.map(t => t.id));
            arr = arr.filter((id, i) => validIds.has(id) && arr.indexOf(id) === i);
            const prev = (this._value || []).join(";");
            const next = arr.join(";");
            if (prev === next) {
                return;
            }
            this._value = arr;
            if (this._hidden) {
                this._hidden.value = arr.join(";");
            }
            this.render();
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: arr.join(";") });
        } else {
            const id = typeof input === "string" ? input : (input && input.id) || "";
            if (id === this._value) {
                return;
            }
            const exist = this._tiles.find(t => t.id === id);
            if (exist) {
                this._value = id;
                if (this._hidden) {
                    this._hidden.value = id;
                }
                this._applyBindings(exist);
                this.render();
                this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: id });
            }
        }
    }

    /**
     * Returns the form the picker lives in, or the document when it stands alone.
     * @returns {HTMLElement|Document} The scope bound targets are looked up in.
     */
    _scope() {
        return this._element.closest("form") || document;
    }

    /**
     * Looks up a form control by name. A binding key arrives through the dataset api,
     * which lower-cases it, so the exact match is followed by a case-insensitive scan
     * rather than requiring the author to spell the target name in lower case.
     * @param {HTMLElement|Document} scope - The scope to look in.
     * @param {string} name - The name of the control.
     * @returns {HTMLElement|null} The control, or null when none carries the name.
     */
    _findNamedControl(scope, name) {
        const exact = scope.querySelector(`[name="${name}"]`);
        if (exact) {
            return exact;
        }

        const lower = name.toLowerCase();
        return Array.from(scope.querySelectorAll("[name]"))
            .find(el => el.getAttribute("name").toLowerCase() === lower) || null;
    }

    /**
     * Projects the values a tile carries into the surrounding form: a form control of
     * the bound name receives the value, an element carrying data-wx-bind-text of that
     * name receives it as its text, and an element carrying data-wx-bind-visible of
     * that name is shown only while the value is present. Clearing the selection
     * (tile === null) resets all three.
     * @param {Object|null} tile - The selected tile, or null when nothing is selected.
     */
    _applyBindings(tile) {
        const names = new Set();
        for (const t of this._tiles) {
            Object.keys(t.bindings || {}).forEach(k => names.add(k));
        }
        if (!names.size) {
            return;
        }

        const scope = this._scope();

        for (const name of names) {
            const value = (tile && tile.bindings && tile.bindings[name]) || "";

            scope.querySelectorAll(`[data-wx-bind-text="${name}"]`).forEach(el => {
                el.textContent = value;
            });

            scope.querySelectorAll(`[data-wx-bind-visible="${name}"]`).forEach(el => {
                el.style.display = value ? "" : "none";
            });
        }

        // the targets are written twice: a control that narrows its own options to the
        // value of another one (a priority to its class) rejects a value that is not
        // offered yet, and only the first pass puts that other value in place
        this._writeBindingTargets(scope, names, tile);
        this._writeBindingTargets(scope, names, tile);
    }

    /**
     * Writes the bound values into the form controls that carry the bound names.
     * @param {HTMLElement|Document} scope - The scope the targets are looked up in.
     * @param {Set<string>} names - The bound names.
     * @param {Object|null} tile - The selected tile, or null when nothing is selected.
     */
    _writeBindingTargets(scope, names, tile) {
        for (const name of names) {
            const value = (tile && tile.bindings && tile.bindings[name]) || "";
            const input = this._findNamedControl(scope, name);

            if (!input) {
                continue;
            }

            // a control is registered against its root element, not against the hidden
            // input it submits through, so the lookup walks up from the input
            const ctrl = webexpress.webui.Controller.getClosestInstance(input);

            if (ctrl && typeof ctrl.value !== "undefined") {
                ctrl.value = value;
            } else if (input.value !== value) {
                input.value = value;
                input.dispatchEvent(new CustomEvent("change", { bubbles: true }));
            }
        }
    }

    /**
     * Binds the picker to the input its visible tiles are filtered by. The bound input
     * is usually written programmatically by another control, which does not raise a
     * native change event, so the bubbling value change event is listened for as well.
     */
    _attachFilterSource() {
        if (!this._filterSource) {
            return;
        }

        const scope = this._scope();
        const read = () => {
            const source = this._findNamedControl(scope, this._filterSource);
            const ctrl = source ? webexpress.webui.Controller.getClosestInstance(source) : null;
            const next = source
                ? ((ctrl && typeof ctrl.value !== "undefined") ? ctrl.value : source.value) || null
                : null;

            if (next === this._filterValue) {
                return;
            }

            this._filterValue = next;
            this._dropSelectionOutsideFilter();
            this.render();
        };

        scope.addEventListener("change", read);
        scope.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, read);

        read();
    }

    /**
     * Clears the selection when the tile it points at is no longer visible, so a
     * choice made before the filter changed cannot be submitted unseen.
     */
    _dropSelectionOutsideFilter() {
        if (this._multiselect) {
            const kept = (this._value || []).filter(id => {
                const tile = this._tiles.find(t => t.id === id);
                return tile && this._matchesFilter(tile);
            });
            if (kept.length !== (this._value || []).length) {
                this._value = kept;
                if (this._hidden) {
                    this._hidden.value = kept.join(";");
                }
                this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: kept.join(";") });
            }
            return;
        }

        const selected = this._tiles.find(t => t.id === this._value);
        if (this._value && (!selected || !this._matchesFilter(selected))) {
            this._value = null;
            if (this._hidden) {
                this._hidden.value = "";
            }
            this._applyBindings(null);
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: "" });
        }
    }

    /**
     * Checks a tile against the bound filter. A tile without a filter value is
     * always shown, so an entry that applies everywhere needs no marking, and a
     * tile marked as always visible passes unconditionally.
     * @param {Object} tile - The tile to check.
     * @returns {boolean} True when the tile passes the filter.
     */
    _matchesFilter(tile) {
        if (tile.alwaysVisible || !this._filterSource || !this._filterValue) {
            return true;
        }
        return !tile.filterValue || tile.filterValue === this._filterValue;
    }

    /**
     * Checks a tile against the current search term. A tile marked as always visible
     * is not something the user searches for and stays regardless of the term.
     * @param {Object} tile - The tile to check.
     * @returns {boolean} True when the tile matches.
     */
    _matchesSearch(tile) {
        return tile.alwaysVisible || !this._searchTerm || (tile.search || "").includes(this._searchTerm);
    }

    /**
     * Constructs a tile card element with selection highlighting and event listeners.
     * The card is laid out as kicker, title, body and footer, so the kind a card
     * belongs to reads before its name and its metadata after its description.
     * @param {Object} tile - The tile data.
     * @param {number} idx - The tile index in the list.
     * @returns {HTMLDivElement} The complete tile card element.
     */
    _createTileCard(tile, idx) {
        const card = document.createElement("div");
        card.className = "wx-tile-card";
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
        card.tabIndex = 0;

        // apply action attributes
        if (tile.primaryAction) card.dataset.wxPrimaryAction = tile.primaryAction;
        if (tile.primaryTarget) card.dataset.wxPrimaryTarget = tile.primaryTarget;
        if (tile.primaryUri) card.dataset.wxPrimaryUri = tile.primaryUri;
        if (tile.secondaryAction) card.dataset.wxSecondaryAction = tile.secondaryAction;
        if (tile.secondaryTarget) card.dataset.wxSecondaryTarget = tile.secondaryTarget;
        if (tile.secondaryUri) card.dataset.wxSecondaryUri = tile.secondaryUri;

        // remove all possible bg-* classes before (re-)applying selection
        const removeBackgroundClasses = () => {
            for (const cls of Array.from(card.classList)) {
                if (/^bg-/.test(cls)) {
                    card.classList.remove(cls);
                }
            }
        };

        // check if tile is selected (multi or single mode)
        let isSelected = false;
        if (this._multiselect) {
            isSelected = (Array.isArray(this._value) && this._value.includes(tile.id));
        } else {
            isSelected = this._value === tile.id;
        }
        if (isSelected) {
            removeBackgroundClasses();
            card.classList.add("wx-tile-card-selected");
        } else {
            removeBackgroundClasses();
            if (tile.colorCss) {
                card.classList.add(...tile.colorCss.split(/\s+/).filter(Boolean));
            }
            card.classList.remove("wx-tile-card-selected");
        }
        card.setAttribute("aria-selected", isSelected ? "true" : "false");

        // the selection is marked by a check badge as well as by the frame, so it
        // reads without relying on colour alone
        if (isSelected) {
            const check = document.createElement("span");
            check.className = "wx-tile-card-check";
            check.setAttribute("aria-hidden", "true");
            check.innerHTML = `<i class="${this._iconClass("check")}"></i>`;
            card.appendChild(check);
        }

        // add the kicker row carrying the kind of the card and its qualifier
        if (tile.badge || tile.chip) {
            const kicker = document.createElement("div");
            kicker.className = "wx-tile-card-kicker";

            if (tile.badge) {
                const badge = document.createElement("span");
                badge.className = "wx-tile-card-badge";

                const dot = document.createElement("span");
                dot.className = "wx-tile-card-badge-dot";
                if (tile.badgeColorCss) {
                    dot.classList.add(...tile.badgeColorCss.split(/\s+/).filter(Boolean));
                }
                if (tile.badgeColorStyle) {
                    dot.style.cssText = tile.badgeColorStyle;
                }
                badge.appendChild(dot);
                badge.append(document.createTextNode(tile.badge));
                kicker.appendChild(badge);
            }

            if (tile.chip) {
                const chip = document.createElement("span");
                chip.className = "wx-tile-card-chip";
                chip.textContent = tile.chip;
                kicker.appendChild(chip);
            }

            card.appendChild(kicker);
        }

        // add card header with optional icon/image and label
        if (tile.label || tile.icon || tile.image) {
            const header = document.createElement("h5");
            header.className = "card-title";
            if (tile.icon) {
                const icon = document.createElement("i");
                icon.className = tile.icon;

                if (this._largeIcon) {
                    icon.classList.add("wx-tile-icon-large");
                }

                header.appendChild(icon);
                header.append(document.createTextNode(" "));
            }
            if (tile.image) {
                const img = document.createElement("img");
                img.className = "wx-icon";

                if (this._largeIcon) {
                    img.classList.add("wx-tile-icon-large");
                }

                img.src = tile.image;
                img.alt = "";
                header.appendChild(img);
                header.append(document.createTextNode(" "));
            }
            header.append(document.createTextNode(tile.label ?? ""));
            card.appendChild(header);
        }
        // add card body (main HTML content)
        const body = document.createElement("div");
        body.className = "card-body";
        if (tile.html) {
            body.innerHTML = tile.html;
        }
        card.appendChild(body);

        // add the metadata footer
        if (tile.footer) {
            const footer = document.createElement("div");
            footer.className = "wx-tile-card-footer";
            footer.innerHTML = tile.footer;
            card.appendChild(footer);
        }

        // handle click and keyboard selection (support for Ctrl and Shift)
        card.addEventListener("click", (e) => {
            if (this._multiselect) {
                let arr = Array.isArray(this._value) ? this._value.slice() : [];
                if (e.ctrlKey || e.metaKey) {
                    // toggle current tile
                    const pos = arr.indexOf(tile.id);
                    if (pos === -1) {
                        arr.push(tile.id);
                    } else {
                        arr.splice(pos, 1);
                    }
                    this._lastSelectedIdx = idx;
                } else if (e.shiftKey && arr.length) {
                    // select range using last selection
                    const last = typeof this._lastSelectedIdx === "number" ? this._lastSelectedIdx : idx;
                    const start = Math.min(last, idx);
                    const end = Math.max(last, idx);
                    const rangeIds = this._tiles.slice(start, end + 1).map(t => t.id);
                    arr = Array.from(new Set([...arr, ...rangeIds]));
                } else {
                    // select only this tile
                    arr = [tile.id];
                    this._lastSelectedIdx = idx;
                }
                this.value = arr;
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: tile, selected: arr.includes(tile.id) });
            } else {
                if (this._value !== tile.id) {
                    this.value = tile.id;
                    this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: tile });
                }
            }
        });
        card.addEventListener("keyup", e => {
            if (e.key === " " || e.key === "Enter") {
                if (this._multiselect) {
                    let arr = Array.isArray(this._value) ? this._value.slice() : [];
                    const pos = arr.indexOf(tile.id);
                    if (pos === -1) {
                        arr.push(tile.id);
                    } else {
                        arr.splice(pos, 1);
                    }
                    this.value = arr;
                    this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: tile, selected: arr.includes(tile.id) });
                } else {
                    if (this._value !== tile.id) {
                        this.value = tile.id;
                        this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: tile });
                    }
                }
            }
        });

        return card;
    }

    /**
     * Renders the tiles into the picker list container.
     * Rebuilds and replaces all child nodes.
     */
    render() {
        while (this._tileList.firstChild) {
            this._tileList.removeChild(this._tileList.firstChild);
        }
        const container = document.createElement("div");
        container.className = "wx-tile-container";

        if (this._columns > 0) {
            container.classList.add("wx-tile-container-grid");
            container.style.setProperty("--wx-tile-columns", this._columns);
        }

        let visible = 0;
        this._tiles.forEach((tile, idx) => {
            if (!this._matchesFilter(tile) || !this._matchesSearch(tile)) {
                return;
            }
            container.appendChild(this._createTileCard(tile, idx));
            visible++;
        });
        this._tileList.appendChild(container);

        if (this._emptyElement) {
            this._emptyElement.style.display = (visible === 0 && this._emptyText) ? "" : "none";
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-tile", webexpress.webui.InputTileCtrl);
