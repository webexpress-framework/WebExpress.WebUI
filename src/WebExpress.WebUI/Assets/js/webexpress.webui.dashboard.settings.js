/**
 * The settings dialog for a single dashboard widget. It always offers the name
 * and the accent color and appends the type-specific fields a widget declares
 * through its settings schema (an array of { key, label, type, ... } field
 * descriptors on the registered widget definition). On save the edited widget
 * object is mutated in place and the caller's callback runs, so the dashboard
 * re-renders and persists the change.
 */
webexpress.webui.DashboardWidgetSettings = class extends webexpress.webui.ModalCtrl {
    _okButton = document.createElement("button");

    /**
     * Creates the dialog and attaches it to the document body. A single instance
     * is reused for every widget of a dashboard.
     */
    constructor() {
        super(document.createElement("div"));

        document.body.appendChild(this._element);

        this._okButton.type = "button";
        this._okButton.className = "btn btn-primary";
    }

    /**
     * Opens the dialog for a widget, seeding the fields from its current values.
     * @param {object} widget - The widget data object to edit in place.
     * @param {object} definition - The registered widget definition, carrying the optional settings schema.
     * @param {Function} onSave - Invoked after the widget has been updated.
     */
    open(widget, definition, onSave) {
        this._titleH1.textContent = this._i18n("webexpress.webui:dashboard.settings.title", "Settings");

        const form = document.createElement("form");
        form.className = "wx-dashboard-settings-form";
        // a settings form has no submit target; entering must not reload the page
        form.addEventListener("submit", (e) => e.preventDefault());

        const nameInput = this._buildTextField(
            form,
            this._i18n("webexpress.webui:dashboard.settings.name", "Name"),
            "text",
            widget.title ?? widget.label ?? ""
        );

        const color = this._buildColorField(form, widget.color);
        color.ctrl = new webexpress.webui.InputColorCtrl(color.host);

        const schema = Array.isArray(definition.settings) ? definition.settings : [];
        const extraInputs = [];
        for (let i = 0; i < schema.length; i++) {
            const field = schema[i];
            const seed = (widget.params && widget.params[field.key] != null)
                ? widget.params[field.key]
                : (field.default != null ? field.default : "");
            const input = this._buildSchemaField(form, field, seed);
            extraInputs.push({ field: field, input: input });
        }

        this._bodyDiv.innerHTML = "";
        this._bodyDiv.appendChild(form);

        this._okButton.textContent = this._i18n("webexpress.webui:save", "Save");
        this._okButton.onclick = () => {
            widget.title = nameInput.value.trim() || null;
            widget.label = widget.title;
            widget.color = color.toggle.checked ? color.ctrl.value : null;

            widget.params = widget.params || {};
            for (let i = 0; i < extraInputs.length; i++) {
                const entry = extraInputs[i];
                widget.params[entry.field.key] = this._readSchemaValue(entry.field, entry.input);
            }

            if (typeof onSave === "function") {
                onSave();
            }

            this.hide();
        };

        // rebuild the footer so the primary action precedes the inherited cancel
        this._footerDiv.innerHTML = "";
        this._footerDiv.appendChild(this._okButton);
        this._footerDiv.appendChild(this._cancelButton);

        this.show();
    }

    /**
     * Builds a labelled text-like input row (text or number) and appends it to
     * the form.
     * @param {HTMLElement} form - The form to append to.
     * @param {string} label - The field label.
     * @param {string} type - The input type ("text" or "number").
     * @param {string} value - The initial value.
     * @param {object} [attrs] - Optional extra attributes (min, max, step, placeholder).
     * @returns {HTMLInputElement} The created input.
     */
    _buildTextField(form, label, type, value, attrs) {
        const wrapper = document.createElement("div");
        wrapper.className = "mb-3";

        const labelEl = document.createElement("label");
        labelEl.className = "form-label";
        labelEl.textContent = label;

        const input = document.createElement("input");
        input.type = type;
        input.className = "form-control";
        input.value = value != null ? String(value) : "";

        if (attrs) {
            if (attrs.min != null) input.min = attrs.min;
            if (attrs.max != null) input.max = attrs.max;
            if (attrs.step != null) input.step = attrs.step;
            if (attrs.placeholder != null) input.placeholder = attrs.placeholder;
        }

        wrapper.appendChild(labelEl);
        wrapper.appendChild(input);
        form.appendChild(wrapper);

        return input;
    }

    /**
     * Builds the color row: a checkbox that enables the accent color and the
     * framework color control (as ControlFormItemInputColor renders it). A named
     * color (e.g. "brown") is resolved to its hex value so the control reflects
     * the current appearance. The control is instantiated by the caller from the
     * returned host, which deliberately omits the wx-webui-input-color selector
     * class so the global controller does not also construct it.
     * @param {HTMLElement} form - The form to append to.
     * @param {string|null} color - The current widget color, or null.
     * @returns {{toggle: HTMLInputElement, host: HTMLElement}} The controls.
     */
    _buildColorField(form, color) {
        const wrapper = document.createElement("div");
        wrapper.className = "mb-3";

        const labelEl = document.createElement("label");
        labelEl.className = "form-label d-block";
        labelEl.textContent = this._i18n("webexpress.webui:dashboard.settings.color", "Color");

        const row = document.createElement("div");
        row.className = "d-flex align-items-center gap-2";

        const toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.className = "form-check-input mt-0";
        toggle.checked = !!color;
        toggle.title = this._i18n("webexpress.webui:dashboard.settings.color.enable", "Use color");
        toggle.setAttribute("aria-label", toggle.title);

        const host = document.createElement("div");
        host.className = "wx-dashboard-settings-color";
        host.setAttribute("data-value", this._cssColorToHex(color));

        row.appendChild(toggle);
        row.appendChild(host);
        wrapper.appendChild(labelEl);
        wrapper.appendChild(row);
        form.appendChild(wrapper);

        return { toggle: toggle, host: host };
    }

    /**
     * Builds a field for a widget-declared settings schema entry.
     * @param {HTMLElement} form - The form to append to.
     * @param {object} field - The schema field descriptor.
     * @param {*} value - The initial value.
     * @returns {HTMLElement} The created input or select.
     */
    _buildSchemaField(form, field, value) {
        const type = field.type || "text";
        const label = field.label || field.key;

        if (type === "checkbox") {
            const wrapper = document.createElement("div");
            wrapper.className = "mb-3 form-check";

            const input = document.createElement("input");
            input.type = "checkbox";
            input.className = "form-check-input";
            input.id = "wx-setting-" + field.key + "-" + Math.random().toString(36).slice(2, 7);
            input.checked = value === true || value === "true";

            const labelEl = document.createElement("label");
            labelEl.className = "form-check-label";
            labelEl.htmlFor = input.id;
            labelEl.textContent = label;

            wrapper.appendChild(input);
            wrapper.appendChild(labelEl);
            form.appendChild(wrapper);

            return input;
        }

        if (type === "select") {
            const wrapper = document.createElement("div");
            wrapper.className = "mb-3";

            const labelEl = document.createElement("label");
            labelEl.className = "form-label";
            labelEl.textContent = label;

            const select = document.createElement("select");
            select.className = "form-select";

            const options = Array.isArray(field.options) ? field.options : [];
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                const optionEl = document.createElement("option");
                optionEl.value = (option && option.value != null) ? option.value : option;
                optionEl.textContent = (option && option.label != null) ? option.label : optionEl.value;
                if (String(optionEl.value) === String(value)) {
                    optionEl.selected = true;
                }
                select.appendChild(optionEl);
            }

            wrapper.appendChild(labelEl);
            wrapper.appendChild(select);
            form.appendChild(wrapper);

            return select;
        }

        if (type === "color") {
            const wrapper = document.createElement("div");
            wrapper.className = "mb-3";

            const labelEl = document.createElement("label");
            labelEl.className = "form-label d-block";
            labelEl.textContent = label;

            const input = document.createElement("input");
            input.type = "color";
            input.className = "form-control form-control-color";
            input.value = this._cssColorToHex(value);

            wrapper.appendChild(labelEl);
            wrapper.appendChild(input);
            form.appendChild(wrapper);

            return input;
        }

        // text and number share the labelled input row
        return this._buildTextField(form, label, type === "number" ? "number" : "text", value, field);
    }

    /**
     * Reads the value of a schema field, normalising it to the string form the
     * widget params (a string dictionary on the server) carry.
     * @param {object} field - The schema field descriptor.
     * @param {HTMLElement} input - The field control.
     * @returns {string} The value as a string.
     */
    _readSchemaValue(field, input) {
        if ((field.type || "text") === "checkbox") {
            return input.checked ? "true" : "false";
        }
        return input.value != null ? String(input.value) : "";
    }

    /**
     * Resolves any CSS color (hex, rgb or a named color like "brown") to a hex
     * string the color picker accepts. Falls back to a neutral blue when the
     * value is empty or invalid.
     * @param {string|null} value - The CSS color.
     * @returns {string} The hex color, e.g. "#a52a2a".
     */
    _cssColorToHex(value) {
        const fallback = "#3b82f6";
        if (!value) {
            return fallback;
        }

        // let the browser normalise the color: an invalid value leaves style.color empty
        const probe = document.createElement("div");
        probe.style.color = value;
        if (!probe.style.color) {
            return fallback;
        }

        probe.style.display = "none";
        document.body.appendChild(probe);
        const computed = getComputedStyle(probe).color;
        document.body.removeChild(probe);

        const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(computed);
        if (!match) {
            return fallback;
        }

        const hex = (n) => Number(n).toString(16).padStart(2, "0");
        return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
    }
};
