/**
 * A dual-handle range slider input control. The control reads its
 * configuration from data-* attributes placed on the host element by the
 * server-side ControlFormItemInputSlider control.
 *
 * Values are kept synchronized with a hidden <input> serialized as
 * "min;max" so the payload survives a standard form post. The connecting
 * band between the two handles is rendered via a colored fill on the
 * track, styled by the PropertyColorSlider class on the server.
 *
 * Several built-in unit formatters are supported (number, temperature,
 * percent, duration, time). Unknown unit identifiers are treated as a
 * literal suffix, so "kg" produces labels like "12 kg".
 *
 * triggers:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.InputSliderCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        // read configuration from data attributes (server side wrote them)
        this._id = element.getAttribute("id") || "";
        this._name = element.getAttribute("name") || "";
        this._disabled = element.hasAttribute("disabled") || element.classList.contains("disabled");

        this._min = this._parseFloat(element.dataset.min, 0);
        this._max = this._parseFloat(element.dataset.max, 100);
        if (this._max <= this._min) {
            this._max = this._min + 1;
        }
        this._step = this._parseFloat(element.dataset.step, 1);
        if (this._step <= 0) {
            this._step = 1;
        }

        this._unit = (element.dataset.unit || "number").trim();
        this._showLabels = element.dataset.showLabels !== "false";

        const initialMin = this._parseFloat(element.dataset.valueMin, this._min);
        const initialMax = this._parseFloat(element.dataset.valueMax, this._max);
        this._valueMin = this._snap(this._clamp(Math.min(initialMin, initialMax)));
        this._valueMax = this._snap(this._clamp(Math.max(initialMin, initialMax)));

        // cleanup attributes that were only meant for initial configuration
        element.removeAttribute("id");
        element.removeAttribute("name");
        element.removeAttribute("data-value-min");
        element.removeAttribute("data-value-max");
        element.removeAttribute("data-min");
        element.removeAttribute("data-max");
        element.removeAttribute("data-step");
        element.removeAttribute("data-unit");
        element.removeAttribute("data-show-labels");
        element.classList.add("wx-slider");

        // internal state
        this._activeHandle = null;
        this._pointerListeners = null;

        // build DOM (color comes from CSS classes/inline style on the host,
        // there is no separate JS-driven band color)
        this._hidden = this._createHiddenInput(this._id, this._name);
        this._track = document.createElement("div");
        this._track.className = "wx-slider-track";

        this._band = document.createElement("div");
        this._band.className = "wx-slider-band";
        this._track.appendChild(this._band);

        this._handleMin = this._createHandle("min");
        this._handleMax = this._createHandle("max");
        this._track.appendChild(this._handleMin);
        this._track.appendChild(this._handleMax);

        // clicking the track jumps the nearest handle to the click position,
        // then immediately starts dragging it so the gesture feels continuous
        if (!this._disabled) {
            this._track.addEventListener("pointerdown", (e) => this._onTrackPointerDown(e));
        }

        this._labelMin = document.createElement("div");
        this._labelMin.className = "wx-slider-label wx-slider-label-min";
        this._labelMax = document.createElement("div");
        this._labelMax.className = "wx-slider-label wx-slider-label-max";

        element.innerHTML = "";
        element.appendChild(this._hidden);
        element.appendChild(this._track);
        if (this._showLabels) {
            element.appendChild(this._labelMin);
            element.appendChild(this._labelMax);
        }

        // re-render labels/handles on resize so percentages stay accurate
        window.addEventListener("resize", () => this.render());

        this.render();
        this._syncHidden();
    }

    /**
     * Parses a string into a float with a fallback.
     * @param {string|number|null|undefined} v The raw value.
     * @param {number} fallback Fallback if parsing fails.
     * @returns {number} The parsed value.
     */
    _parseFloat(v, fallback) {
        if (v === null || v === undefined || v === "") {
            return fallback;
        }
        const n = parseFloat(v);
        return isNaN(n) ? fallback : n;
    }

    /**
     * Creates the hidden input used to submit the value with the form.
     * @param {string} id The id of the hidden input.
     * @param {string} name The form field name.
     * @returns {HTMLInputElement} The hidden input element.
     */
    _createHiddenInput(id, name) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        if (id) {
            hidden.id = id;
        }
        hidden.name = name || "";
        if (this._disabled) {
            hidden.disabled = true;
        }
        return hidden;
    }

    /**
     * Creates a draggable handle element.
     * @param {"min"|"max"} which Which handle to create.
     * @returns {HTMLElement} The handle element.
     */
    _createHandle(which) {
        const handle = document.createElement("div");
        handle.className = "wx-slider-handle wx-slider-handle-" + which;
        handle.setAttribute("role", "slider");
        handle.setAttribute("tabindex", this._disabled ? "-1" : "0");
        handle.setAttribute("data-handle", which);
        handle.setAttribute("aria-valuemin", String(this._min));
        handle.setAttribute("aria-valuemax", String(this._max));

        if (!this._disabled) {
            handle.addEventListener("pointerdown", (e) => this._onPointerDown(e, which));
            handle.addEventListener("keydown", (e) => this._onKeyDown(e, which));
        }

        return handle;
    }

    /**
     * Clamps a value to the [min, max] range.
     * @param {number} v The value to clamp.
     * @returns {number} The clamped value.
     */
    _clamp(v) {
        if (v < this._min) return this._min;
        if (v > this._max) return this._max;
        return v;
    }

    /**
     * Snaps a value to the configured step grid.
     * @param {number} v The value to snap.
     * @returns {number} The snapped value.
     */
    _snap(v) {
        const steps = Math.round((v - this._min) / this._step);
        const snapped = this._min + steps * this._step;
        // guard against floating point drift on values like 0.1
        const decimals = this._decimalsFromStep();
        const factor = Math.pow(10, decimals);
        return Math.round(snapped * factor) / factor;
    }

    /**
     * Derives a sensible number of decimals from the step value, used to
     * suppress floating point drift in snapped output.
     * @returns {number} Number of decimal places to keep.
     */
    _decimalsFromStep() {
        const s = String(this._step);
        const idx = s.indexOf(".");
        return idx >= 0 ? Math.min(s.length - idx - 1, 6) : 0;
    }

    /**
     * Calculates the percentage position [0..1] of a value on the track.
     * @param {number} v The value.
     * @returns {number} The position as a fraction.
     */
    _toPct(v) {
        return (v - this._min) / (this._max - this._min);
    }

    /**
     * Translates a client x-coordinate into a value on the track.
     * @param {number} clientX The horizontal mouse / pointer position.
     * @returns {number} The corresponding value (snapped & clamped).
     */
    _fromClientX(clientX) {
        const rect = this._track.getBoundingClientRect();
        if (rect.width <= 0) {
            return this._min;
        }
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const raw = this._min + pct * (this._max - this._min);
        return this._snap(this._clamp(raw));
    }

    /**
     * Pointer down handler on a handle: starts a drag operation.
     * @param {PointerEvent} e The pointer event.
     * @param {"min"|"max"} which Which handle was grabbed.
     */
    _onPointerDown(e, which) {
        if (this._disabled) return;
        e.preventDefault();
        this._activeHandle = which;
        const target = e.currentTarget;
        try {
            target.setPointerCapture(e.pointerId);
        } catch (_) {
            // setPointerCapture is best-effort; ignore environments without it
        }
        target.classList.add("dragging");

        const onMove = (ev) => this._onPointerMove(ev);
        const onUp = (ev) => {
            target.classList.remove("dragging");
            try { target.releasePointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
            this._activeHandle = null;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            this._pointerListeners = null;
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        this._pointerListeners = { onMove, onUp };
    }

    /**
     * Pointer down on the track itself (not on a handle): jump the nearest
     * handle to the click position and continue as a drag while the pointer
     * stays pressed so the gesture feels like a single grab.
     * @param {PointerEvent} e The pointer event.
     */
    _onTrackPointerDown(e) {
        if (this._disabled) return;

        // ignore events that bubble up from the handles themselves; the
        // handle's own listener already takes care of those
        if (e.target && e.target !== this._track && e.target !== this._band) {
            return;
        }

        e.preventDefault();

        const v = this._fromClientX(e.clientX);
        // pick the handle whose current value is closer to the click; on
        // ties pick the lower handle, which feels natural when expanding
        const distMin = Math.abs(v - this._valueMin);
        const distMax = Math.abs(v - this._valueMax);
        const which = (distMin <= distMax) ? "min" : "max";

        // jump immediately so the click is acted on even without a drag
        if (which === "min") {
            this.valueMin = v;
        } else {
            this.valueMax = v;
        }

        // keep dragging while the pointer is held down; window-level
        // listeners avoid the cross-element pointer capture problem
        this._activeHandle = which;
        const handle = which === "min" ? this._handleMin : this._handleMax;
        handle.classList.add("dragging");
        try { handle.focus({ preventScroll: true }); } catch (_) { /* ignore */ }

        const onMove = (ev) => this._onPointerMove(ev);
        const onUp = () => {
            handle.classList.remove("dragging");
            this._activeHandle = null;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
    }

    /**
     * Pointer move handler: updates the active handle while dragging.
     * @param {PointerEvent} e The pointer event.
     */
    _onPointerMove(e) {
        if (!this._activeHandle) return;
        const v = this._fromClientX(e.clientX);
        if (this._activeHandle === "min") {
            this.valueMin = v;
        } else {
            this.valueMax = v;
        }
    }

    /**
     * Keyboard handler for accessible navigation. Arrow keys step by one
     * <c>step</c>, Page Up/Down by ten steps, Home/End jump to the boundary.
     * @param {KeyboardEvent} e The key event.
     * @param {"min"|"max"} which Which handle is focused.
     */
    _onKeyDown(e, which) {
        if (this._disabled) return;
        const current = which === "min" ? this._valueMin : this._valueMax;
        const big = this._step * 10;
        let next = current;
        let handled = true;

        switch (e.key) {
            case "ArrowRight":
            case "ArrowUp":
                next = current + this._step;
                break;
            case "ArrowLeft":
            case "ArrowDown":
                next = current - this._step;
                break;
            case "PageUp":
                next = current + big;
                break;
            case "PageDown":
                next = current - big;
                break;
            case "Home":
                next = which === "min" ? this._min : this._valueMin;
                break;
            case "End":
                next = which === "min" ? this._valueMax : this._max;
                break;
            default:
                handled = false;
        }

        if (handled) {
            e.preventDefault();
            next = this._snap(this._clamp(next));
            if (which === "min") {
                this.valueMin = next;
            } else {
                this.valueMax = next;
            }
        }
    }

    /**
     * Formats a numeric value using the configured unit.
     * @param {number} v The value to format.
     * @returns {string} The formatted label string.
     */
    _formatValue(v) {
        const dec = this._decimalsFromStep();
        switch (this._unit) {
            case "temperature":
                return this._roundFixed(v, dec) + " °C";
            case "percent":
                return this._roundFixed(v, dec) + " %";
            case "duration":
                return this._formatDuration(v);
            case "time":
                return this._formatTime(v);
            case "number":
            case "":
                return this._roundFixed(v, dec);
            default:
                // unknown unit - treat as literal suffix
                return this._roundFixed(v, dec) + " " + this._unit;
        }
    }

    /**
     * Formats <paramref name="v"/> using <c>toFixed</c> when at least one
     * decimal is expected, otherwise as an integer.
     * @param {number} v The value to format.
     * @param {number} dec Number of decimal places.
     * @returns {string} The rounded representation.
     */
    _roundFixed(v, dec) {
        return dec > 0 ? v.toFixed(dec) : String(Math.round(v));
    }

    /**
     * Formats <paramref name="v"/> in minutes as <c>HHh MMm</c>.
     * @param {number} v The value in minutes.
     * @returns {string} The formatted duration.
     */
    _formatDuration(v) {
        const total = Math.max(0, Math.round(v));
        const h = Math.floor(total / 60);
        const m = total % 60;
        return h > 0 ? (h + "h " + m + "m") : (m + "m");
    }

    /**
     * Formats <paramref name="v"/> in minutes since midnight as <c>HH:mm</c>.
     * Values wrap around 24h to keep the representation valid.
     * @param {number} v Minutes since midnight.
     * @returns {string} The formatted clock time.
     */
    _formatTime(v) {
        const total = ((Math.round(v) % 1440) + 1440) % 1440;
        const h = Math.floor(total / 60);
        const m = total % 60;
        return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
    }

    /**
     * Renders the visual state of the slider (handle positions, band,
     * label text, ARIA attributes).
     */
    render() {
        const pctMin = this._toPct(this._valueMin) * 100;
        const pctMax = this._toPct(this._valueMax) * 100;

        this._handleMin.style.left = pctMin + "%";
        this._handleMax.style.left = pctMax + "%";
        this._band.style.left = pctMin + "%";
        this._band.style.width = Math.max(0, pctMax - pctMin) + "%";

        const minLabel = this._formatValue(this._valueMin);
        const maxLabel = this._formatValue(this._valueMax);

        this._handleMin.setAttribute("aria-valuenow", String(this._valueMin));
        this._handleMin.setAttribute("aria-valuetext", minLabel);
        this._handleMin.title = minLabel;

        this._handleMax.setAttribute("aria-valuenow", String(this._valueMax));
        this._handleMax.setAttribute("aria-valuetext", maxLabel);
        this._handleMax.title = maxLabel;

        if (this._showLabels) {
            this._labelMin.textContent = minLabel;
            this._labelMax.textContent = maxLabel;
            this._labelMin.style.left = pctMin + "%";
            this._labelMax.style.left = pctMax + "%";
        }

        // mirror current value on the host element so external observers
        // (e.g. event loggers in the tutorial) can pick it up easily
        this._element.setAttribute("data-value-min", String(this._valueMin));
        this._element.setAttribute("data-value-max", String(this._valueMax));
    }

    /**
     * Writes the current min/max pair into the hidden input as the
     * <c>min;max</c> wire format expected by the server.
     */
    _syncHidden() {
        if (this._hidden) {
            this._hidden.value = String(this._valueMin) + ";" + String(this._valueMax);
        }
    }

    /**
     * Validates the current value pair. Returns an empty array when valid,
     * otherwise a list of human-readable error strings.
     * @returns {Array<string>} The validation errors.
     */
    validate() {
        const errors = [];
        if (isNaN(this._valueMin) || isNaN(this._valueMax)) {
            errors.push(this._i18n("webexpress.webui:slider.invalid", "Invalid range."));
        }
        if (this._valueMin < this._min || this._valueMax > this._max) {
            errors.push(this._i18n("webexpress.webui:slider.out-of-bounds", "Range is out of bounds."));
        }
        if (this._valueMin > this._valueMax) {
            errors.push(this._i18n("webexpress.webui:slider.inverted", "Lower bound must not exceed upper bound."));
        }
        return errors;
    }

    /**
     * Updates the value of one handle. Internal helper used by the setters.
     * @param {"min"|"max"} which Which handle to update.
     * @param {number} v New value for the handle.
     */
    _updateHandle(which, v) {
        const next = this._snap(this._clamp(v));
        if (which === "min") {
            const bound = Math.min(next, this._valueMax);
            if (bound === this._valueMin) return;
            this._valueMin = bound;
        } else {
            const bound = Math.max(next, this._valueMin);
            if (bound === this._valueMax) return;
            this._valueMax = bound;
        }
        this.render();
        this._syncHidden();
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
            valueMin: this._valueMin,
            valueMax: this._valueMax
        });
    }

    /**
     * Gets the current lower bound value.
     * @returns {number} The lower bound.
     */
    get valueMin() { return this._valueMin; }

    /**
     * Sets the lower bound value (will be clamped, snapped and bounded by valueMax).
     * @param {number|string} v The new value.
     */
    set valueMin(v) { this._updateHandle("min", this._parseFloat(v, this._valueMin)); }

    /**
     * Gets the current upper bound value.
     * @returns {number} The upper bound.
     */
    get valueMax() { return this._valueMax; }

    /**
     * Sets the upper bound value (will be clamped, snapped and bounded by valueMin).
     * @param {number|string} v The new value.
     */
    set valueMax(v) { this._updateHandle("max", this._parseFloat(v, this._valueMax)); }

    /**
     * Gets the current range as <c>{min, max}</c>.
     * @returns {{min:number, max:number}} The current range.
     */
    get value() {
        return { min: this._valueMin, max: this._valueMax };
    }

    /**
     * Sets the range from <c>{min, max}</c>, an array, or a "min;max" string.
     * @param {{min:number,max:number}|Array<number>|string} v The new range.
     */
    set value(v) {
        let lo = this._valueMin;
        let hi = this._valueMax;

        if (typeof v === "string") {
            const parts = v.split(";");
            if (parts.length >= 1) lo = this._parseFloat(parts[0], lo);
            if (parts.length >= 2) hi = this._parseFloat(parts[1], hi);
        } else if (Array.isArray(v)) {
            if (v.length >= 1) lo = this._parseFloat(v[0], lo);
            if (v.length >= 2) hi = this._parseFloat(v[1], hi);
        } else if (v && typeof v === "object") {
            if ("min" in v) lo = this._parseFloat(v.min, lo);
            if ("max" in v) hi = this._parseFloat(v.max, hi);
        }

        lo = this._snap(this._clamp(lo));
        hi = this._snap(this._clamp(hi));
        if (lo > hi) {
            const tmp = lo; lo = hi; hi = tmp;
        }

        const changed = lo !== this._valueMin || hi !== this._valueMax;
        this._valueMin = lo;
        this._valueMax = hi;
        this.render();
        this._syncHidden();
        if (changed) {
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
                valueMin: this._valueMin,
                valueMax: this._valueMax
            });
        }
    }

    /**
     * Destroys the control and releases pointer / window listeners.
     */
    destroy() {
        if (this._pointerListeners) {
            window.removeEventListener("pointermove", this._pointerListeners.onMove);
            window.removeEventListener("pointerup", this._pointerListeners.onUp);
            window.removeEventListener("pointercancel", this._pointerListeners.onUp);
            this._pointerListeners = null;
        }
        this._element.innerHTML = "";
    }
};

// register control class
webexpress.webui.Controller.registerClass("wx-webui-input-slider", webexpress.webui.InputSliderCtrl);
