/**
 * A read-only traffic light control. It lights one of three lamps (red, yellow, green) to
 * visualize a status. The value is taken from the host element's data attributes and can be
 * updated programmatically through the value property.
 */
webexpress.webui.TrafficLightCtrl = class extends webexpress.webui.Ctrl {
    /**
     * The lamps a traffic light can show, in physical top-to-bottom order.
     */
    static LAMPS = ["red", "yellow", "green"];

    /**
     * Constructor
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        // read configuration
        this._value = this._normalizeValue(element.dataset.value);
        this._horizontal = element.dataset.orientation === "horizontal";

        // base classes and attributes; the housing is purely visual, so the live status is
        // exposed once on the host rather than per lamp
        element.classList.add("wx-traffic-light");
        element.classList.toggle("wx-traffic-light-horizontal", this._horizontal);
        element.setAttribute("role", "img");
        element.setAttribute("aria-readonly", "true");

        const tooltip = element.dataset.tooltip;
        if (tooltip) {
            element.setAttribute("title", tooltip);
        }

        // build structure
        this._housing = document.createElement("div");
        this._housing.className = "wx-traffic-light-housing";
        this._housing.setAttribute("role", "presentation");

        element.innerHTML = "";
        element.appendChild(this._housing);

        // render lamps
        this._lamps = {};
        this._renderLamps();
    }

    /**
     * Normalize an incoming value to one of the known lamps or the dark state.
     * @param {string|null|undefined} v Raw input.
     * @returns {string} One of "off", "red", "yellow", "green".
     */
    _normalizeValue(v) {
        const value = (v == null ? "" : String(v)).trim().toLowerCase();
        return webexpress.webui.TrafficLightCtrl.LAMPS.includes(value) ? value : "off";
    }

    /**
     * Build the three lamp elements once and remember them by color so updates only toggle a
     * class instead of rebuilding the DOM.
     */
    _renderLamps() {
        this._housing.innerHTML = "";
        this._lamps = {};

        for (const color of webexpress.webui.TrafficLightCtrl.LAMPS) {
            const lamp = document.createElement("span");
            lamp.className = "wx-traffic-light-lamp wx-traffic-light-lamp-" + color;
            lamp.setAttribute("data-color", color);
            lamp.setAttribute("aria-hidden", "true");
            this._housing.appendChild(lamp);
            this._lamps[color] = lamp;
        }

        this._applyVisualState();
    }

    /**
     * Light the lamp that matches the current value and dim the others.
     */
    _applyVisualState() {
        for (const color of webexpress.webui.TrafficLightCtrl.LAMPS) {
            this._lamps[color].classList.toggle("active", color === this._value);
        }
        this._element.setAttribute("data-value", this._value);
        this._element.setAttribute("aria-label", `${this._i18n("webexpress.webui:trafficlight", "Traffic light")}: ${this._stateLabel()}`);
    }

    /**
     * Resolve the translated label for the current state, used for the accessible name.
     * @returns {string} The human-readable state name.
     */
    _stateLabel() {
        return this._i18n("webexpress.webui:trafficlight." + this._value, this._value);
    }

    /**
     * Get the current state.
     * @returns {string} One of "off", "red", "yellow", "green".
     */
    get value() {
        return this._value;
    }

    /**
     * Set the current state. Unknown values dim every lamp.
     * @param {string|null|undefined} v New state.
     */
    set value(v) {
        const next = this._normalizeValue(v);
        if (next !== this._value) {
            this._value = next;
            this._applyVisualState();
        }
    }

    /**
     * Destroy control.
     */
    destroy() {
        if (this._housing) {
            this._housing.innerHTML = "";
        }
        this._element.innerHTML = "";
        delete this._lamps;
    }
};

// register control class
webexpress.webui.Controller.registerClass("wx-webui-traffic-light", webexpress.webui.TrafficLightCtrl);
