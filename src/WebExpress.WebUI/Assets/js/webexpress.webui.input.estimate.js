/**
 * An estimate input control. The estimate is chosen from a configurable scale
 * of values rendered as selectable chips, defaulting to a rounded Fibonacci
 * sequence. The control mirrors the rating control: it owns a hidden input
 * carrying the value and exposes a value get/set pair.
 * triggers:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.InputEstimateCtrl = class extends webexpress.webui.Ctrl {
    // the scale offered when the host carries no data-scale attribute
    static DEFAULT_SCALE = [0, 1, 2, 3, 5, 8, 13, 20, 40, 100];

    /**
     * Constructor
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        // read configuration
        this._id = element.getAttribute("id") || "";
        this._name = element.getAttribute("name") || "";
        this._scale = this._parseScale(element.dataset.scale);
        this._allowClear = element.dataset.allowClear === "true" || element.dataset.allowClear === "True";
        this._value = this._normalizeValue(element.dataset.value);
        this._colors = this._readColors(element);

        // cleanup attributes on host
        element.removeAttribute("id");
        element.removeAttribute("name");
        element.removeAttribute("data-value");
        element.removeAttribute("data-scale");
        element.removeAttribute("data-allow-clear");
        element.classList.add("wx-estimate");

        // build structure
        this._hidden = this._createHiddenInput(this._id, this._name);
        this._container = document.createElement("div");
        this._container.className = "wx-estimate-container";
        this._container.setAttribute("role", "radiogroup");
        this._container.setAttribute("aria-label", element.getAttribute("aria-label") || this._i18n("webexpress.webui:estimate", "Estimate"));

        element.replaceChildren(this._hidden, this._container);

        // internal state
        this._chips = [];
        this._focusedIndex = Math.max(0, this._scale.indexOf(this._value));

        this._renderChips();
        this._syncHidden();
    }

    /**
     * Parses a comma separated scale into non-negative integers, falling back to
     * the default scale when no valid value is supplied.
     * @param {string|null|undefined} raw The raw scale, e.g. "1,2,3,5,8".
     * @returns {Array<number>} The scale.
     */
    _parseScale(raw) {
        if (typeof raw !== "string" || raw.trim() === "") {
            return webexpress.webui.InputEstimateCtrl.DEFAULT_SCALE.slice();
        }
        const values = raw.split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => Number.isFinite(n) && n >= 0);
        return values.length > 0 ? values : webexpress.webui.InputEstimateCtrl.DEFAULT_SCALE.slice();
    }

    /**
     * Normalizes an incoming value to a non-negative integer, or null when no
     * estimate is set.
     * @param {string|number|null|undefined} v Raw input.
     * @returns {number|null} The normalized value.
     */
    _normalizeValue(v) {
        if (v == null || v === "") {
            return null;
        }
        const n = parseInt(v, 10);
        if (isNaN(n) || n < 0) {
            return null;
        }
        return n;
    }

    /**
     * Create the hidden input that carries the value back to a form.
     * @param {string} id Input id.
     * @param {string} name Input name.
     * @returns {HTMLInputElement} Hidden input.
     */
    _createHiddenInput(id, name) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        if (id) {
            hidden.id = id;
        }
        hidden.name = name;
        return hidden;
    }

    /**
     * Reads the per-chip colors from the two pipe-separated, index-aligned host
     * attributes, removing them so the host is left clean after the colors are
     * consumed. Each entry carries a css class (system color) or an inline style
     * (user color), matching the per-element split used by the other controls.
     * @param {HTMLElement} element The host element.
     * @returns {Array<{css: (string|null), style: (string|null)}>} The colors.
     */
    _readColors(element) {
        const cssRaw = element.getAttribute("data-colors-css");
        const styleRaw = element.getAttribute("data-colors-style");
        element.removeAttribute("data-colors-css");
        element.removeAttribute("data-colors-style");

        if (!cssRaw && !styleRaw) {
            return [];
        }

        const css = (cssRaw || "").split("|");
        const style = (styleRaw || "").split("|");
        const count = Math.max(css.length, style.length);

        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push({ css: css[i] || null, style: style[i] || null });
        }
        return colors;
    }

    /**
     * Applies a color descriptor to an element, preferring the css class and
     * falling back to the inline style. A null or empty descriptor leaves the
     * stylesheet default untouched.
     * @param {HTMLElement} element The target element.
     * @param {{css: (string|null), style: (string|null)}} color The descriptor.
     * @returns {boolean} True when a color was applied.
     */
    _applyColor(element, color) {
        if (!element || !color) {
            return false;
        }
        if (color.css) {
            for (const cls of color.css.split(/\s+/)) {
                if (cls) {
                    element.classList.add(cls);
                }
            }
            return true;
        }
        if (color.style) {
            element.style.cssText += ";" + color.style;
            return true;
        }
        return false;
    }

    /**
     * Build the chip elements.
     */
    _renderChips() {
        this._container.replaceChildren();
        this._chips = [];

        let colored = false;

        this._scale.forEach((points, index) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "wx-estimate-chip";
            chip.textContent = String(points);
            chip.setAttribute("role", "radio");
            chip.setAttribute("data-points", String(points));
            chip.setAttribute("aria-checked", points === this._value ? "true" : "false");
            chip.setAttribute("tabindex", index === this._focusedIndex ? "0" : "-1");

            if (this._applyColor(chip, this._colors[index])) {
                colored = true;
            }

            chip.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this._allowClear && points === this._value) {
                    this.value = null;
                } else {
                    this.value = points;
                }
            });

            chip.addEventListener("focus", () => {
                this._focusedIndex = index;
                this._updateTabindex();
            });

            chip.addEventListener("keydown", (e) => this._handleKey(e));

            this._chips.push(chip);
            this._container.appendChild(chip);
        });

        // a colored scale switches the active chip to a ring so the chip keeps
        // its own color, while an uncolored scale keeps the filled accent
        this._container.classList.toggle("wx-estimate-colored", colored);

        this._applyVisualState();
    }

    /**
     * Handle keyboard navigation and selection.
     * @param {KeyboardEvent} e Key event.
     */
    _handleKey(e) {
        const last = this._scale.length - 1;
        let handled = true;

        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            this._focusChip(Math.min(last, this._focusedIndex + 1));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            this._focusChip(Math.max(0, this._focusedIndex - 1));
        } else if (e.key === "Home") {
            this._focusChip(0);
        } else if (e.key === "End") {
            this._focusChip(last);
        } else if (e.key === "Enter" || e.key === " ") {
            const points = this._scale[this._focusedIndex];
            this.value = (this._allowClear && points === this._value) ? null : points;
        } else if (e.key === "Escape" && this._allowClear) {
            this.value = null;
        } else {
            handled = false;
        }

        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    /**
     * Move the roving focus to the chip at the given index.
     * @param {number} index The chip index.
     */
    _focusChip(index) {
        this._focusedIndex = index;
        this._updateTabindex();
        if (this._chips[index]) {
            this._chips[index].focus();
        }
    }

    /**
     * Update the roving tabindex so only the focused chip is tabbable.
     */
    _updateTabindex() {
        this._chips.forEach((chip, i) => {
            chip.setAttribute("tabindex", i === this._focusedIndex ? "0" : "-1");
        });
    }

    /**
     * Apply the active state to the chip matching the current value.
     */
    _applyVisualState() {
        this._chips.forEach((chip) => {
            const points = parseInt(chip.getAttribute("data-points"), 10);
            const active = points === this._value;
            chip.classList.toggle("active", active);
            chip.setAttribute("aria-checked", active ? "true" : "false");
        });
    }

    /**
     * Synchronize the hidden input with the current value.
     */
    _syncHidden() {
        if (this._hidden) {
            this._hidden.value = this._value == null ? "" : String(this._value);
        }
    }

    /**
     * Get the configured scale.
     * @returns {Array<number>} A copy of the scale.
     */
    get scale() {
        return this._scale.slice();
    }

    /**
     * Set the scale and re-render the chips, clamping the focus into range.
     * @param {Array<number>|string|null|undefined} v The new scale.
     */
    set scale(v) {
        this._scale = Array.isArray(v) ? v.filter((n) => Number.isFinite(n) && n >= 0) : this._parseScale(v);
        if (this._scale.length === 0) {
            this._scale = webexpress.webui.InputEstimateCtrl.DEFAULT_SCALE.slice();
        }
        this._focusedIndex = Math.max(0, this._scale.indexOf(this._value));
        this._renderChips();
    }

    /**
     * Get the current estimate.
     * @returns {number|null} The selected points, or null when unset.
     */
    get value() {
        return this._value;
    }

    /**
     * Set the current estimate.
     * @param {number|string|null|undefined} v The new value.
     */
    set value(v) {
        const next = this._normalizeValue(v);
        if (next === this._value) {
            return;
        }
        this._value = next;
        const matched = this._scale.indexOf(next);
        if (matched >= 0) {
            this._focusedIndex = matched;
        }
        this._applyVisualState();
        this._updateTabindex();
        this._syncHidden();
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
    }

    /**
     * Clear the estimate.
     */
    clear() {
        this.value = null;
    }

    /**
     * Destroy the control.
     */
    destroy() {
        if (this._container) {
            this._container.replaceChildren();
        }
        this._element.replaceChildren();
        delete this._chips;
        delete this._hidden;
    }
};

// register control class
webexpress.webui.Controller.registerClass("wx-webui-input-estimate", webexpress.webui.InputEstimateCtrl);
