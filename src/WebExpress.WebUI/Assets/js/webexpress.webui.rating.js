/**
 * A read-only star rating control.
 */
webexpress.webui.RatingCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        // read configuration
        this._total = parseInt(element.dataset.stars, 10);
        if (isNaN(this._total) || this._total <= 0) {
            this._total = 5;
        }
        this._value = this._normalizeValue(element.dataset.value);
        if (this._value > this._total) {
            this._value = this._total;
        }

        // base classes and attributes
        element.classList.add("wx-rating-view");
        element.setAttribute("aria-readonly", "true");
        if (!element.getAttribute("aria-label")) {
            element.setAttribute("aria-label", `${this._i18n("webexpress.webui:rating")}: ${this._value} / ${this._total}`);
        }

        // build structure
        this._container = document.createElement("div");
        this._container.className = "wx-rating-container";
        // role presentation, since it's purely visual
        this._container.setAttribute("role", "presentation");

        element.innerHTML = "";
        element.appendChild(this._container);

        // render stars
        this._renderStars();
    }

    /**
     * Normalize incoming value to integer >=0.
     * @param {string|number|null|undefined} v Raw input.
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
     * Render star elements.
     */
    _renderStars() {
        this._container.innerHTML = "";
        for (let i = 1; i <= this._total; i++) {
            const star = document.createElement("span");
            star.className = "wx-rating-star";
            star.setAttribute("data-index", String(i));
            // aria: mark active stars for screen readers via aria-hidden elements, keep overall label at container
            star.setAttribute("aria-hidden", "true");

            const icon = document.createElement("i");
            const active = i <= this._value;
            icon.className = (active ? "fas fa-star" : "far fa-star") + " wx-rating-icon";
            star.classList.toggle("active", active);

            star.appendChild(icon);
            this._container.appendChild(star);
        }
        this._element.setAttribute("data-value", String(this._value));
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
        }

        this._renderStars();
    }

    /**
     * Get value.
     * @returns {number} Current rating
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
        if (bounded !== this._value) {
            this._value = bounded;
            // update aria-label to reflect change
            this._element.setAttribute("aria-label", `${this._i18n("webexpress.webui:rating")}: ${this._value} / ${this._total}`);
            this._renderStars();
        }
    }

    /**
     * Destroy control.
     */
    destroy() {
        if (this._container) {
            this._container.innerHTML = "";
        }
        this._element.innerHTML = "";
    }
};

// register control class
webexpress.webui.Controller.registerClass("wx-webui-rating", webexpress.webui.RatingCtrl);