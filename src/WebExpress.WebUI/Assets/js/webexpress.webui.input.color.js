/**
 * A color selection control extending the base MenuCtrl class.
 * Shows a color preview or a compact toolbar icon with a color indicator.
 * Provides a uniform grid of predefined colors and a custom selector in the dropdown.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT
 */
webexpress.webui.InputColorCtrl = class extends webexpress.webui.MenuCtrl {
    _value = "#000000";
    _disabled = false;

    // shared palette for forms and editor attributes
    _palette = [
        // basic colors
        "#000000", "#FF0000", "#008000", "#0000FF", "#FFFF00",
        "#FFA500", "#800080", "#A52A2A", "#00FFFF", "#808080",
        // extended palette
        "#FFC0CB", "#FFD700", "#B22222", "#ADFF2F", "#20B2AA",
        "#00CED1", "#4682B4", "#DA70D6", "#D2691E", "#C0C0C0",
        // pastel tones
        "#FFB6C1", "#FFDAB9", "#E6E6FA", "#98FB98", "#AFEEEE",
        "#D3D3D3", "#FFE4E1", "#F0E68C", "#F5DEB3", "#F4A460",
        // dark shades
        "#2F4F4F", "#696969", "#708090", "#778899", "#556B2F",
        "#483D8B", "#8B0000", "#9400D3", "#FF4500", "#DC143C"
    ];

    /**
     * Constructor for initializing the color control.
     * @param {HTMLElement} element - The DOM element for the color control.
     */
    constructor(element) {
        super(element);

        // initialize properties from attributes and dataset
        const id = element.getAttribute("id");
        const name = element.getAttribute("name");
        this._allowEmpty = element.dataset.allowEmpty === "true";
        this._compact = element.dataset.compact === "true";
        this._icon = element.dataset.icon || "";
        this._emptyColor = element.dataset.emptyColor === "currentColor" ? "currentColor" : "transparent";
        const value = element.dataset.value ?? element.getAttribute("value") ?? (this._allowEmpty ? "" : "#000000");

        // check for disable attribute
        if (element.hasAttribute("disabled")) {
            this._disabled = true;
        }

        // allow overriding palette via dataset
        if (element.dataset.palette) {
            try {
                this._palette = JSON.parse(element.dataset.palette);
            } catch (e) {
                console.warn("Invalid palette format");
            }
        }

        // create and append ui components
        const hiddenInput = this._createHiddenInput(id, name);
        const dropdown = this._createDropdown();
        const dropdownMenu = this._createDropdownMenu();

        this.value = value;

        // clean up the element before adding new structure
        element.removeAttribute("id");
        element.removeAttribute("name");
        element.removeAttribute("value");
        element.removeAttribute("disabled");
        element.innerHTML = "";
        element.classList.add("wx-color-input");
        element.classList.toggle("wx-color-compact", this._compact);
        element.appendChild(hiddenInput);
        element.appendChild(dropdown);
        element.appendChild(dropdownMenu);

        // attach native popover behavior for the dropdown menu
        this._initializeMenu(dropdown, dropdownMenu);
        this._valueText.id = dropdownMenu.id + "-value";
        // the trigger is named by the field label followed by the current value
        this._adoptFieldLabel(dropdown, id, element, this._compact ? [] : [this._valueText]);
        if (!dropdown.hasAttribute("aria-labelledby") && !dropdown.hasAttribute("aria-label")) {
            dropdown.setAttribute("aria-label", this._i18n("webexpress.webui:editor.color", "Color"));
        }

        this.render();
    }

    /**
     * Creates a hidden input for form submission.
     * @param {string} id - The id attribute for the hidden input.
     * @param {string} name - The name attribute for the hidden input.
     * @returns {HTMLInputElement} The hidden input element.
     */
    _createHiddenInput(id, name) {
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        if (id) {
            hiddenInput.id = id;
        }
        hiddenInput.name = name || "";

        // disable the input if the control is disabled
        if (this._disabled) {
            hiddenInput.disabled = true;
        }

        this._hidden = hiddenInput;
        return hiddenInput;
    }

    /**
     * Keeps the color preview accessible in both form and compact toolbar presentations.
     * @returns {HTMLButtonElement} The dropdown trigger.
     */
    _createDropdown() {
        const dropdown = document.createElement("button");
        dropdown.type = "button";
        dropdown.disabled = this._disabled;
        dropdown.classList.add("wx-color-trigger");
        dropdown.classList.add(this._compact ? "dropdown-toggle" : "form-control");

        // add disabled class for visual feedback
        if (this._disabled) {
            dropdown.classList.add("disabled");
        }

        // preview box - takes available space
        const colorPreview = document.createElement("span");
        colorPreview.className = "wx-color-preview-box";
        this._colorPreview = colorPreview;

        // the swatch says nothing to a reader; the value is spelled out beside it
        const valueText = document.createElement("span");
        valueText.className = "visually-hidden";
        this._valueText = valueText;

        const expandIcon = document.createElement("i");
        expandIcon.className = this._iconClass("angle-down");
        if (this._compact) {
            const sample = document.createElement("span");
            sample.className = "wx-color-sample";
            const icon = document.createElement("i");
            icon.className = this._iconClass(this._icon || "palette");
            sample.appendChild(icon);
            sample.appendChild(colorPreview);
            dropdown.appendChild(sample);
        } else dropdown.appendChild(colorPreview);
        dropdown.appendChild(valueText);
        if (!this._compact) dropdown.appendChild(expandIcon);

        this._trigger = dropdown;

        return dropdown;
    }

    /**
     * Shows the dropdown menu.
     * Makes the dropdown visible, fires the native "show" event,
     * and dispatches the framework-specific DROPDOWN_SHOW_EVENT.
     */
    _showDropdown() {
        // safety check to prevent opening programmatically if disabled
        if (this._disabled) {
            return;
        }

        webexpress.webui.NativeMenu.show(this._dropdownmenu);

    }

    /**
     * Hides the dropdown menu.
     * Makes the dropdown invisible, fires the native "hide" event,
     * and dispatches the framework-specific DROPDOWN_HIDDEN_EVENT.
     */
    _hideDropdown() {
        webexpress.webui.NativeMenu.hide(this._dropdownmenu);

    }

    /**
     * Creates the dropdown menu container with palette grid and embedded custom selector.
     * @returns {HTMLDivElement} The dropdown menu element.
     */
    _createDropdownMenu() {
        const dropdownMenu = document.createElement("div");
        dropdownMenu.classList.add("dropdown-menu", "wx-color-dropdown");

        // grid container
        const paletteContainer = document.createElement("div");
        paletteContainer.className = "wx-color-palette-grid";

        // 1. render predefined colors
        this._palette.forEach((color) => {
            const colorButton = this._createColorButton(color);
            colorButton.addEventListener("click", (e) => {
                e.stopPropagation();
                this.value = color;
                this._hideDropdown();
            });
            paletteContainer.appendChild(colorButton);
        });

        // 2. render custom color selector as the last grid item
        const customWrapper = document.createElement("div");
        customWrapper.title = this._i18n("webexpress.webui:color.custom", "Custom Color");

        // the visible button with a "+" icon or similar
        const customBtn = document.createElement("div");
        customBtn.className = "wx-color-custom-btn";
        customBtn.innerHTML = `<i class="${this._iconClass("palette")}"></i>`;

        // the actual native input, invisible but clickable
        const nativePicker = document.createElement("input");
        nativePicker.type = "color";
        nativePicker.className = "wx-native-color-picker";
        nativePicker.setAttribute("aria-label", customWrapper.title);

        // ensure native picker is disabled if parent is disabled
        if (this._disabled) {
            nativePicker.disabled = true;
        }

        nativePicker.addEventListener("input", (e) => {
            this.value = e.target.value;
        });

        // hide dropdown only after color is chosen/closed (change event)
        nativePicker.addEventListener("change", () => {
            this._hideDropdown();
        });

        this._nativePicker = nativePicker;

        customWrapper.appendChild(customBtn);
        customWrapper.appendChild(nativePicker);
        paletteContainer.appendChild(customWrapper);

        dropdownMenu.appendChild(paletteContainer);
        if (this._allowEmpty) {
            const divider = document.createElement("hr");
            divider.className = "dropdown-divider";
            const clear = document.createElement("button");
            clear.type = "button";
            clear.className = "dropdown-item wx-color-clear";
            const icon = document.createElement("i");
            icon.className = this._iconClass("eraser");
            clear.appendChild(icon);
            clear.appendChild(document.createTextNode(" " + this._i18n("webexpress.webui:editor.color.remove", "Remove color")));
            clear.addEventListener("click", () => {
                // mixed editor selections can contain colors while the shared preview is empty
                this.setValue("", false);
                this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: "" });
                this._hideDropdown();
            });
            dropdownMenu.appendChild(divider);
            dropdownMenu.appendChild(clear);
        }
        this._dropdownmenu = dropdownMenu;
        return dropdownMenu;
    }

    /**
     * Creates a standard color swatch button used in the dropdown.
     * The button displays the given color, applies hover animations,
     * and returns a fully configured <button> element.
     * @param {string} color - The color value used for the swatch background.
     * @returns {HTMLButtonElement} A configured button representing the color.
     */
    _createColorButton(color) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.title = color;
        btn.setAttribute("aria-label", color);
        btn.style.backgroundColor = color;

        // disable button if control is disabled
        if (this._disabled) {
            btn.disabled = true;
        }

        return btn;
    }

    /**
     * Validates whether the given string is a valid hexadecimal color value.
     * Accepts shorthand (#RGB) and full-length (#RRGGBB) formats, case-insensitive.
     * @param {string} hex - The color string to validate.
     * @returns {boolean} True if the string is a valid hex color; otherwise false.
     */
    _isValidHex(hex) {
        return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
    }

    /**
     * Renders the selection control options and current selection.
     */
    render() {
        // update trigger view
        if (this._colorPreview) {
            this._colorPreview.style.backgroundColor = this._value || this._emptyColor;
            this._colorPreview.title = this._value;
        }
        if (this._valueText) {
            this._valueText.textContent = this._value;
        }

        // update hidden input
        if (this._hidden) {
            this._hidden.value = this._value;
        }

        // update native picker to match if it exists
        if (this._nativePicker) {
            this._nativePicker.value = this._formatHex6(this._value || "#000000");
        }
        this._element.querySelectorAll("button,input").forEach(input => { input.disabled = this._disabled; });
    }

    /**
     * Converts a shorthand hex color (#RGB) into a full 6‑digit format (#RRGGBB).
     * If the input is already in 6‑digit form, it is returned unchanged.
     * @param {string} hex - The hex color value to normalize.
     * @returns {string} A 6‑digit hex color string.
     */
    _formatHex6(hex) {
        if (hex.length === 4) {
            return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }
        return hex;
    }

    /**
     * Gets the current value(s) of the selection.
     * @returns {string} The currently selected hex color.
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the color value.
     * @param {string} val - Hex color string.
     */
    set value(val) {
        this.setValue(val);
    }

    /**
     * Synchronizes a color preview without emitting an edit when selection changes elsewhere.
     * @param {string} val - A CSS color or an allowed empty value.
     * @param {boolean} [notify=true] - Whether to emit a value change for an accepted color.
     * @returns {boolean} Whether the supplied color could be represented by the picker.
     */
    setValue(val, notify = true) {
        let normalized = String(val).trim();
        if (normalized && !this._isValidHex(normalized)) {
            // browsers serialize imported hex styles as rgb values
            const rgb = webexpress.webui.ContrastColor.resolve(normalized);
            if (rgb?.every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255)) {
                normalized = "#" + rgb.map(channel => channel.toString(16).padStart(2, "0")).join("");
            }
        }
        if (this._isValidHex(normalized) || this._allowEmpty && normalized === "") {
            const old = this._value;
            this._value = normalized;
            this.render();

            if (notify && old !== normalized) {
                this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
            }
            return true;
        }
        return false;
    }

    /** Gets whether the color input prevents user changes. */
    get disabled() { return this._disabled; }

    /**
     * Keeps all palette actions and the native picker in the same enabled state.
     * @param {boolean} value - Whether user changes should be prevented.
     */
    set disabled(value) { this._disabled = !!value; this.render(); }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-color", webexpress.webui.InputColorCtrl);