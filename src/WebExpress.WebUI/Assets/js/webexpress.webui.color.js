/**
 * A read-only color display controller.
 * Shows a label and a color swatch without selection capabilities.
 * Designed to visualize color values defined in dataset attributes.
 */
webexpress.webui.ColorCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Creates a new ColorCtrl instance.
     * @param {HTMLElement} element - The host element.
     */
    constructor(element) {
        super(element);

        // explicitly set element if base class doesn't do it immediately
        if (!this.element) {
            this.element = element;
        }

        // read initial values from dataset or defaults
        this._value = element.dataset.value || element.dataset.color || "#000000";
        this._tooltip = element.dataset.tooltip || null;

        // add base css class matching the css file
        element.classList.add("wx-color");

        // clean up the dom element attributes to keep the dom clean
        element.removeAttribute("data-color");
        element.removeAttribute("data-value");

        this._render();
    }

    /**
     * Renders the internal structure of the control.
     * Clears existing content and builds the label and swatch.
     */
    _render() {
        const el = this.element;
        if (!el) {
            return;
        }

        // clear previous content
        el.innerHTML = "";

        // create and append the visual color swatch
        const swatch = document.createElement("div");
        swatch.style.backgroundColor = this._value;

        if (this._tooltip) {
            swatch.title = this._tooltip;
        }

        el.appendChild(swatch);

        // store reference for updates
        this._swatch = swatch;
    }

    /**
     * Gets the current color value.
     * @returns {string} The color value (e.g., hex string).
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the color value and updates the visual swatch.
     * @param {string} val - The new color value.
     */
    set value(val) {
        this._value = val;
        if (this._swatch) {
            this._swatch.style.backgroundColor = val;
        }
    }

    /**
     * Gets the current tooltip text.
     * @returns {string} The tooltip text.
     */
    get tooltip() {
        return this._tooltip;
    }

    /**
     * Sets the tooltip text and updates the swatch title.
     * @param {string} text - The new tooltip text.
     */
    set tooltip(text) {
        this._tooltip = text;
        if (this._swatch && this._tooltip) {
            this._swatch.title = this._tooltip;
        }
    }
};

// register the class in the controller system
webexpress.webui.Controller.registerClass("wx-webui-color", webexpress.webui.ColorCtrl);