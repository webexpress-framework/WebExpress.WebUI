/**
 * A traffic light input control. The user picks a status by clicking the red, yellow or green
 * lamp; the selected lamp token is written to a hidden input so it is submitted with the form.
 * triggers:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.InputTrafficLightCtrl = class extends webexpress.webui.Ctrl {
    /**
     * The selectable lamps, in physical top-to-bottom order. The order also drives keyboard
     * navigation (ArrowDown moves toward green, ArrowUp toward red).
     */
    static LAMPS = ["red", "yellow", "green"];

    /**
     * Constructor
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        // read configuration
        this._id = element.getAttribute("id") || "";
        this._name = element.getAttribute("name") || "";
        this._horizontal = element.dataset.orientation === "horizontal";
        this._allowOff = element.dataset.allowOff !== "false" && element.dataset.allowOff !== "False";
        this._disabled = element.classList.contains("disabled");
        this._value = this._normalizeValue(element.dataset.value);

        // the id and name belong on the hidden input, not the visual host, so the posted field
        // carries the value and the host stays a plain container
        element.removeAttribute("id");
        element.removeAttribute("name");
        element.removeAttribute("data-value");
        element.classList.add("wx-traffic-light");
        element.classList.toggle("wx-traffic-light-horizontal", this._horizontal);

        // build structure
        this._hidden = this._createHiddenInput(this._id, this._name);
        this._housing = document.createElement("div");
        this._housing.className = "wx-traffic-light-housing";
        this._housing.setAttribute("role", "radiogroup");
        this._housing.setAttribute("aria-label", element.getAttribute("aria-label") || this._i18n("webexpress.webui:trafficlight", "Traffic light"));

        element.innerHTML = "";
        element.appendChild(this._hidden);
        element.appendChild(this._housing);

        // internal state; focus tracks the active lamp, or red when nothing is selected yet
        this._lamps = {};
        this._focused = this._value === "off" ? "red" : this._value;

        this._renderLamps();
        this._syncHidden();
    }

    /**
     * Normalize an incoming value to one of the known lamps or the dark state.
     * @param {string|null|undefined} v Raw input.
     * @returns {string} One of "off", "red", "yellow", "green".
     */
    _normalizeValue(v) {
        const value = (v == null ? "" : String(v)).trim().toLowerCase();
        return webexpress.webui.InputTrafficLightCtrl.LAMPS.includes(value) ? value : "off";
    }

    /**
     * Create the hidden input that carries the submitted value.
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
     * Build the three interactive lamp elements and wire up pointer and keyboard handling.
     */
    _renderLamps() {
        this._housing.innerHTML = "";
        this._lamps = {};

        for (const color of webexpress.webui.InputTrafficLightCtrl.LAMPS) {
            const lamp = document.createElement("span");
            lamp.className = "wx-traffic-light-lamp wx-traffic-light-lamp-" + color;
            lamp.setAttribute("data-color", color);
            lamp.setAttribute("role", "radio");
            lamp.setAttribute("aria-label", this._i18n("webexpress.webui:trafficlight." + color, color));
            lamp.setAttribute("aria-checked", color === this._value ? "true" : "false");
            lamp.setAttribute("tabindex", !this._disabled && color === this._focused ? "0" : "-1");

            if (!this._disabled) {
                lamp.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this._select(color);
                });
                lamp.addEventListener("focus", () => {
                    this._focused = color;
                    this._updateTabindex();
                });
                lamp.addEventListener("keydown", (e) => this._handleKey(e));
            }

            this._lamps[color] = lamp;
            this._housing.appendChild(lamp);
        }

        this._applyVisualState();
    }

    /**
     * Select a lamp. Clicking the lit lamp clears the selection when clearing is allowed.
     * @param {string} color The clicked lamp color.
     */
    _select(color) {
        if (this._allowOff && color === this._value) {
            this.value = "off";
        } else {
            this.value = color;
        }
    }

    /**
     * Handle keyboard navigation and selection for the focused lamp.
     * @param {KeyboardEvent} e Key event.
     */
    _handleKey(e) {
        const lamps = webexpress.webui.InputTrafficLightCtrl.LAMPS;
        const index = lamps.indexOf(this._focused);
        let handled = false;

        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            handled = true;
            this._focused = lamps[Math.min(index + 1, lamps.length - 1)];
            this._updateTabindex();
            this._lamps[this._focused].focus();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            handled = true;
            this._focused = lamps[Math.max(index - 1, 0)];
            this._updateTabindex();
            this._lamps[this._focused].focus();
        } else if (e.key === "Home") {
            handled = true;
            this._focused = lamps[0];
            this._updateTabindex();
            this._lamps[this._focused].focus();
        } else if (e.key === "End") {
            handled = true;
            this._focused = lamps[lamps.length - 1];
            this._updateTabindex();
            this._lamps[this._focused].focus();
        } else if (e.key === "Enter" || e.key === " ") {
            handled = true;
            this._select(this._focused);
        } else if (e.key === "Escape") {
            if (this._allowOff) {
                handled = true;
                this.value = "off";
            }
        }

        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    /**
     * Update the roving tabindex so only the focused lamp is reachable by Tab.
     */
    _updateTabindex() {
        for (const color of webexpress.webui.InputTrafficLightCtrl.LAMPS) {
            this._lamps[color].setAttribute("tabindex", !this._disabled && color === this._focused ? "0" : "-1");
        }
    }

    /**
     * Light the selected lamp, dim the others and keep aria-checked in sync.
     */
    _applyVisualState() {
        for (const color of webexpress.webui.InputTrafficLightCtrl.LAMPS) {
            const lamp = this._lamps[color];
            lamp.classList.toggle("active", color === this._value);
            lamp.setAttribute("aria-checked", color === this._value ? "true" : "false");
        }
        this._element.setAttribute("data-value", this._value);
    }

    /**
     * Mirror the current value into the hidden input. Off is submitted as an empty string.
     */
    _syncHidden() {
        if (this._hidden) {
            this._hidden.value = this._value === "off" ? "" : this._value;
        }
    }

    /**
     * Get the current state.
     * @returns {string} One of "off", "red", "yellow", "green".
     */
    get value() {
        return this._value;
    }

    /**
     * Set the current state and notify listeners when it actually changed.
     * @param {string|null|undefined} v New state.
     */
    set value(v) {
        const next = this._normalizeValue(v);
        if (next === this._value) {
            return;
        }
        this._value = next;
        this._focused = next === "off" ? "red" : next;
        this._applyVisualState();
        this._updateTabindex();
        this._syncHidden();
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
    }

    /**
     * Clear the selection (sets the state to off).
     */
    clear() {
        this.value = "off";
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
        delete this._hidden;
    }
};

// register control class
webexpress.webui.Controller.registerClass("wx-webui-input-traffic-light", webexpress.webui.InputTrafficLightCtrl);
