/**
 * A star rating input control.
 * triggers:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.InputRatingCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        // read configuration
        this._name = element.getAttribute("name") || "";
        this._total = parseInt(element.dataset.stars, 10);
        if (isNaN(this._total) || this._total <= 0) {
            this._total = 5;
        }
        this._allowClear = element.dataset.allowClear === "true" || element.dataset.allowClear === "True";
        this._value = this._normalizeValue(element.dataset.value);
        if (this._value > this._total) {
            this._value = this._total;
        }

        // cleanup attributes on host
        element.removeAttribute("name");
        element.removeAttribute("data-value");
        element.classList.add("wx-rating");

        // build structure
        this._hidden = this._createHiddenInput(this._name);
        this._container = document.createElement("div");
        this._container.className = "wx-rating-container";
        this._container.setAttribute("role", "radiogroup");
        this._container.setAttribute("aria-label", element.getAttribute("aria-label") || this._i18n("webexpress.webui:rating"));

        element.innerHTML = "";
        element.appendChild(this._hidden);
        element.appendChild(this._container);

        // internal state
        this._stars = [];
        this._hover = 0;
        this._focusedIndex = this._value > 0 ? this._value - 1 : 0;

        // render stars
        this._renderStars();

        // finalize
        this._syncHidden();
    }

    /**
     * Normalize incoming value to integer >=0.
     * @param {string|number|null|undefined} v Raw input
     * @returns {number} Normalized value.
     */
    _normalizeValue(v) {
        if (v == null) {
            return 0;
        }
        const n = parseInt(v, 10);
        if (isNaN(n) || n < 0) {
            return 0;
        }
        return n;
    }

    /**
     * Create hidden input.
     * @param {string} name Input name.
     * @returns {HTMLInputElement} Hidden input.
     */
    _createHiddenInput(name) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = name;
        return hidden;
    }

    /**
     * Build star elements.
     */
    _renderStars() {
        this._container.innerHTML = "";
        this._stars = [];
        for (let i = 1; i <= this._total; i++) {
            const star = document.createElement("span");
            star.className = "wx-rating-star";
            star.setAttribute("data-index", String(i));
            star.setAttribute("role", "radio");
            star.setAttribute("aria-label", i + " " + this._i18n("webexpress.webui:rating.of", "of") + " " + this._total);
            star.setAttribute("aria-checked", (i === this._value) ? "true" : "false");
            star.setAttribute("tabindex", (i - 1 === this._focusedIndex) ? "0" : "-1");

            // create icon element with regular (outline) star by default
            const icon = document.createElement("i");
            icon.className = "far fa-star wx-rating-icon";
            star.appendChild(icon);

            // hover preview
            star.addEventListener("mouseenter", (e) => {
                const idx = parseInt(e.currentTarget.getAttribute("data-index"), 10);
                this._hover = idx;
                this._applyVisualState();
            });
            star.addEventListener("mouseleave", () => {
                this._hover = 0;
                this._applyVisualState();
            });

            // click select / clear
            star.addEventListener("click", (e) => {
                e.stopPropagation();
                const idx = parseInt(e.currentTarget.getAttribute("data-index"), 10);
                if (this._allowClear && idx === this._value) {
                    this.value = 0;
                } else {
                    this.value = idx;
                }
                this._hover = 0;
            });

            // keyboard focus
            star.addEventListener("focus", (e) => {
                const idx = parseInt(e.currentTarget.getAttribute("data-index"), 10);
                this._focusedIndex = idx - 1;
                this._updateTabindex();
            });

            // keyboard actions
            star.addEventListener("keydown", (e) => {
                this._handleKey(e);
            });

            this._stars.push(star);
            this._container.appendChild(star);
        }

        this._container.addEventListener("mouseleave", () => {
            this._hover = 0;
            this._applyVisualState();
        });

        this._applyVisualState();
    }

    /**
     * Handle keyboard navigation and selection.
     * @param {KeyboardEvent} e Key event.
     */
    _handleKey(e) {
        const key = e.key;
        let handled = false;

        if (key === "ArrowRight") {
            handled = true;
            if (this._focusedIndex < this._total - 1) {
                this._focusedIndex++;
            }
            this._hover = 0;
            this._updateTabindex();
        } else if (key === "ArrowLeft") {
            handled = true;
            if (this._focusedIndex > 0) {
                this._focusedIndex--;
            }
            this._hover = 0;
            this._updateTabindex();
        } else if (key === "Home") {
            handled = true;
            this._focusedIndex = 0;
            this._hover = 0;
            this._updateTabindex();
        } else if (key === "End") {
            handled = true;
            this._focusedIndex = this._total - 1;
            this._hover = 0;
            this._updateTabindex();
        } else if (key === "Enter" || key === " ") {
            handled = true;
            const desired = this._focusedIndex + 1;
            if (this._allowClear && desired === this._value) {
                this.value = 0;
            } else {
                this.value = desired;
            }
        } else if (key === "Escape") {
            if (this._allowClear) {
                handled = true;
                this.value = 0;
            }
        } else if (/^[1-9]$/.test(key)) {
            const num = parseInt(key, 10);
            if (num <= this._total) {
                handled = true;
                this.value = num;
                this._focusedIndex = num - 1;
            }
        }

        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    /**
     * Update tabindex for roving focus.
     */
    _updateTabindex() {
        this._stars.forEach((s, i) => {
            s.setAttribute("tabindex", i === this._focusedIndex ? "0" : "-1");
        });
    }

    /**
     * Apply visual state (active stars) and aria-checked (switch between solid and regular icons).
     */
    _applyVisualState() {
        const activeLimit = this._hover > 0 ? this._hover : this._value;
        this._stars.forEach((star, i) => {
            const idx = i + 1;
            const active = idx <= activeLimit;
            const icon = star.querySelector("i");
            if (active) {
                star.classList.add("active");
                icon.classList.remove("far");
                icon.classList.add("fas");
            } else {
                star.classList.remove("active");
                icon.classList.remove("fas");
                icon.classList.add("far");
            }
            star.setAttribute("aria-checked", (idx === this._value) ? "true" : "false");
        });
        this._element.setAttribute("data-value", String(this._value));
    }

    /**
     * Synchronize hidden input.
     */
    _syncHidden() {
        if (this._hidden) {
            this._hidden.value = String(this._value);
        }
    }

    /**
     * Get stars.
     * @returns {number} Current star.
     */
    get stars() {
        return this._total;
    }

    /**
     * Set stars.
     * @param { number | string | null | undefined } v New value.
     */
    set stars(v) {
        this._total = this._normalizeValue(v);

        // clamp current value to new total
        if (this._value > this._total) {
            this._value = this._total;
            this._focusedIndex = this._value > 0 ? this._value - 1 : 0;
            this._syncHidden();
        }

        this._renderStars();
    }

    /**
     * Get value.
     * @returns {number} Current rating.
     */
    get value() {
        return this._value;
    }

    /**
     * Set value (integer 0..total).
     * @param {number|string|null|undefined} v New value.
     */
    set value(v) {
        const newVal = this._normalizeValue(v);
        const bounded = Math.min(Math.max(newVal, 0), this._total);
        const old = this._value;
        if (old !== bounded) {
            this._value = bounded;
            this._focusedIndex = this._value > 0 ? this._value - 1 : 0;
            this._applyVisualState();
            this._updateTabindex();
            this._syncHidden();
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
        } else {
            if (this._allowClear && bounded === old && bounded !== 0) {
                this._value = 0;
                this._focusedIndex = 0;
                this._applyVisualState();
                this._updateTabindex();
                this._syncHidden();
                this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
            }
        }
    }

    /**
     * Clear rating (sets to 0).
     */
    clear() {
        this.value = 0;
    }

    /**
     * Destroy control.
     */
    destroy() {
        if (this._container) {
            this._container.innerHTML = "";
        }
        this._element.innerHTML = "";
        delete this._stars;
        delete this._hidden;
    }
};

// register control class
webexpress.webui.Controller.registerClass("wx-webui-input-rating", webexpress.webui.InputRatingCtrl);