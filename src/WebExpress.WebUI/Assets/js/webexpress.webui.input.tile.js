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

    /**
     * Constructs the tile picker input field.
     * @param {HTMLElement} element - The root element of the picker.
     */
    constructor(element) {
        super(element);
        const name = element.getAttribute("name") || element.id;

        // check for multiselect option
        this._multiselect = element.dataset.multiselect === "true";

        // check for large icon option
        this._largeIcon = element.dataset.largeIcon === "true";

        this._hidden = this._createHiddenInput();
        if (name) {
            this._hidden.name = name;
        }

        // load tile data
        this._tiles = this._parseTiles(element.querySelectorAll(".wx-tile-card"));

        // initialize value (single: string; multi: array)
        const value = element.dataset.value || null;
        // element layout vorbereiten (tileList & hidden input setzen)
        this._tileList = document.createElement("div");
        this._tileList.className = "wx-tile-picker-tiles";
        element.innerHTML = "";
        element.removeAttribute("name");
        element.removeAttribute("data-value");
        element.appendChild(this._tileList);
        if (name) {
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
        input.type = "hidden";
        return input;
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
            tiles.push({
                id,
                label: label || id,
                html: div.innerHTML.trim(),
                class: div.dataset.class || "",
                icon: div.dataset.icon || null,
                image: div.dataset.image || null,
                colorCss: div.dataset.colorCss || div.dataset.color || null,
                colorStyle: div.dataset.colorStyle || null,

                // parse action attributes
                primaryAction: div.dataset.wxPrimaryAction || null,
                primaryTarget: div.dataset.wxPrimaryTarget || null,
                primaryUri: div.dataset.wxPrimaryUri || null,
                secondaryAction: div.dataset.wxSecondaryAction || null,
                secondaryTarget: div.dataset.wxSecondaryTarget || null,
                secondaryUri: div.dataset.wxSecondaryUri || null
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
                this.render();
                this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: id });
            }
        }
    }

    /**
     * Constructs a tile card element with selection highlighting and event listeners.
     * Handles proper background class assignment for selection.
     * Fügt große Icon-Option hinzu, falls aktiviert.
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
            card.classList.add("bg-primary", "text-white");
        } else {
            removeBackgroundClasses();
            if (tile.colorCss) {
                card.classList.add(...tile.colorCss.split(/\s+/).filter(Boolean));
            }
            card.classList.remove("bg-primary", "text-white");
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
        this._tiles.forEach((tile, idx) => {
            container.appendChild(this._createTileCard(tile, idx));
        });
        this._tileList.appendChild(container);
    }
};

// register controller class
webexpress.webui.Controller.registerClass("wx-webui-input-tile", webexpress.webui.InputTileCtrl);