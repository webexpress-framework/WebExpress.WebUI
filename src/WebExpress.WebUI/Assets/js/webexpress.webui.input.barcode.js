/**
 * A barcode input control: a text field paired with a live preview of the
 * symbol its value encodes.
 *
 * The preview is what makes the pairing worth having. A barcode is not
 * human readable, so a bare text field gives no feedback at all on whether the
 * value can be encoded - an EAN with a mistyped check digit or a Code 39 value
 * carrying a comma looks perfectly fine as text and fails only at the scanner.
 * The preview answers that while the value is being typed.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.InputBarcodeCtrl = class extends webexpress.webui.Ctrl {

    // how long typing has to pause before the preview is redrawn; a barcode is
    // expensive enough to encode that redrawing on every keystroke is wasteful
    static PREVIEW_DELAY = 150;

    _value = "";
    _type = "code128";
    _level = "M";
    _previewTimer = null;

    /**
     * Creates a new controller instance bound to the given element.
     * @param {HTMLElement} element - The host element.
     */
    constructor(element) {
        super(element);

        this._id = element.getAttribute("id") || "";
        this._name = element.getAttribute("name") || "";
        this._value = element.getAttribute("data-value") || "";
        this._type = (element.getAttribute("data-type") || "code128").toLowerCase();
        this._level = (element.getAttribute("data-level") || "M").toUpperCase();
        this._placeholder = element.getAttribute("data-placeholder") || "";
        this._disabled = element.hasAttribute("disabled") || element.classList.contains("disabled");

        // the colors belong to the preview rather than to the field, so they are
        // handed over untouched instead of being interpreted here
        this._colors = ["data-color-css", "data-color-style", "data-bgcolor-css", "data-bgcolor-style"]
            .map((attribute) => [attribute, element.getAttribute(attribute)])
            .filter(([, value]) => value);

        ["id", "name", "data-value", "data-type", "data-level", "data-placeholder",
            "data-color-css", "data-color-style", "data-bgcolor-css", "data-bgcolor-style"]
            .forEach((attribute) => element.removeAttribute(attribute));

        element.classList.add("wx-input-barcode");
        element.innerHTML = "";

        // the field is the named form control, so the value reaches a submit
        // without a hidden field of its own
        this._field = document.createElement("input");
        this._field.type = "text";
        this._field.className = "form-control wx-input-barcode-field";
        this._field.value = this._value;
        if (this._id) { this._field.id = this._id; }
        if (this._name) { this._field.name = this._name; }
        if (this._placeholder) { this._field.placeholder = this._placeholder; }
        if (this._disabled) { this._field.disabled = true; }
        this._field.addEventListener("input", () => this._onInput());
        this._field.addEventListener("change", () => this._onInput(true));

        this._preview = document.createElement("div");
        this._preview.className = "wx-input-barcode-preview";
        this._preview.setAttribute("aria-hidden", "true");
        this._colors.forEach(([attribute, value]) => this._preview.setAttribute(attribute, value));

        element.appendChild(this._field);
        element.appendChild(this._preview);

        this._barcode = new webexpress.webui.BarcodeCtrl(this._preview);
        this._barcode.type = this._type;
        this._renderPreview();
    }

    /**
     * Returns the colors of the preview, so a read view built from this editor
     * shows the symbol in the same colors the editor previewed it in.
     * @returns {Array<Array<string>>} The attribute and value pairs.
     */
    get colors() {
        return this._colors;
    }

    /**
     * Gets the encoded value.
     * @returns {string} The value.
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the value, updating both the field and the preview.
     * @param {string} value - The new value.
     */
    set value(value) {
        const next = String(value ?? "");
        if (next === this._value) {
            return;
        }
        this._value = next;
        this._field.value = next;
        this._renderPreview();
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
    }

    /**
     * Gets the symbology.
     * @returns {string} The symbology.
     */
    get type() {
        return this._type;
    }

    /**
     * Sets the symbology and redraws the preview.
     * @param {string} type - The symbology.
     */
    set type(type) {
        this._type = String(type || "code128").toLowerCase();
        this._barcode.type = this._type;
        this._renderPreview();
    }

    /**
     * Gets the error correction level used for QR codes.
     * @returns {string} The level.
     */
    get level() {
        return this._level;
    }

    /**
     * Sets the error correction level used for QR codes.
     * @param {string} level - The level.
     */
    set level(level) {
        this._level = String(level || "M").toUpperCase();
        this._barcode.level = this._level;
        this._renderPreview();
    }

    /**
     * Releases the pending preview redraw so a removed control cannot draw into
     * a detached element.
     */
    destroy() {
        if (this._previewTimer) {
            clearTimeout(this._previewTimer);
            this._previewTimer = null;
        }
    }

    /**
     * Takes the typed value over and schedules the preview.
     * @param {boolean} [immediate] - True to redraw without waiting, as on commit.
     */
    _onInput(immediate) {
        const next = this._field.value;
        if (next === this._value) {
            return;
        }
        this._value = next;

        if (this._previewTimer) {
            clearTimeout(this._previewTimer);
            this._previewTimer = null;
        }

        if (immediate) {
            this._renderPreview();
        } else {
            this._previewTimer = setTimeout(() => {
                this._previewTimer = null;
                this._renderPreview();
            }, webexpress.webui.InputBarcodeCtrl.PREVIEW_DELAY);
        }

        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
    }

    /**
     * Redraws the preview and reports whether the value encodes, so the field
     * carries the same validity the form does.
     */
    _renderPreview() {
        this._barcode.value = this._value;

        const invalid = this._value !== "" && this._preview.classList.contains("wx-barcode-invalid");
        this._field.classList.toggle("is-invalid", invalid);
        this._field.setAttribute("aria-invalid", invalid ? "true" : "false");
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-barcode", webexpress.webui.InputBarcodeCtrl);
