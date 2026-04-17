/**
 * A color selection control extending the base PopperCtrl class.
 * Shows only a color preview in collapsed state.
 * Provides a uniform grid of predefined colors and a custom selector in the dropdown.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT
 */
webexpress.webui.InputColorCtrl = class extends webexpress.webui.PopperCtrl {
    _value = "#000000";
    _disabled = false;

    // palette matching wysiwyg_editor_ctrl.js (40 colors)
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
        const name = element.getAttribute("name");
        const value = element.dataset.value || element.getAttribute("value") || "#000000";

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
        const hiddenInput = this._createHiddenInput(name);
        const dropdown = this._createDropdown();
        const dropdownMenu = this._createDropdownMenu();

        this.value = value;

        // clean up the element before adding new structure
        element.removeAttribute("name");
        element.removeAttribute("value");
        element.removeAttribute("disabled");
        element.innerHTML = "";
        element.classList.add("wx-color-input");
        element.appendChild(hiddenInput);
        element.appendChild(dropdown);
        element.appendChild(dropdownMenu);

        // attach popper.js positioning for the dropdown menu
        this._initializePopper(dropdown, dropdownMenu);

        this.render();
    }

    /**
     * Creates a hidden input for form submission.
     * @param {string} name - The name attribute for the hidden input.
     * @returns {HTMLInputElement} The hidden input element.
     */
    _createHiddenInput(name) {
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = name || "";

        // disable the input if the control is disabled
        if (this._disabled) {
            hiddenInput.disabled = true;
        }

        this._hidden = hiddenInput;
        return hiddenInput;
    }

    /**
     * Creates the dropdown trigger area (only color preview, no text).
     * @returns {HTMLDivElement} The dropdown element.
     */
    _createDropdown() {
        const dropdown = document.createElement("div");
        dropdown.classList.add("form-control", "wx-color-trigger");

        // add disabled class for visual feedback
        if (this._disabled) {
            dropdown.classList.add("disabled");
        }

        // preview box - takes available space
        const colorPreview = document.createElement("div");
        colorPreview.className = "wx-color-preview-box";
        this._colorPreview = colorPreview;

        const expandIcon = document.createElement("i");
        expandIcon.className = "fas fa-angle-down";
        expandIcon.style.color = "#666";

        dropdown.appendChild(colorPreview);
        dropdown.appendChild(expandIcon);

        // toggle the dropdown menu on click
        dropdown.addEventListener("click", (e) => {
            // block interaction if disabled
            if (this._disabled) {
                return;
            }

            if (this._dropdownmenu.style.display === "flex") {
                this._hideDropdown();
            } else {
                this._showDropdown();
            }
        });

        // hide the dropdown menu when clicking outside
        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && !this._dropdownmenu.contains(e.target)) {
                this._hideDropdown();
            }
        });

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

        this._dropdownmenu.style.display = "flex";
        this._dropdownmenu.dispatchEvent(new Event("show"));
        this._dispatch(webexpress.webui.Event.DROPDOWN_SHOW_EVENT, {});
    }

    /**
     * Hides the dropdown menu.
     * Makes the dropdown invisible, fires the native "hide" event,
     * and dispatches the framework-specific DROPDOWN_HIDDEN_EVENT.
     */
    _hideDropdown() {
        this._dropdownmenu.style.display = "none";
        this._dropdownmenu.dispatchEvent(new Event("hide"));
        this._dispatch(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {});
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
        customBtn.innerHTML = '<i class="fas fa-palette"></i>';

        // the actual native input, invisible but clickable
        const nativePicker = document.createElement("input");
        nativePicker.type = "color";
        nativePicker.className = "wx-native-color-picker";

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
            this._colorPreview.style.backgroundColor = this._value;
            this._colorPreview.title = this._value;
        }

        // update hidden input
        if (this._hidden) {
            this._hidden.value = this._value;
        }

        // update native picker to match if it exists
        if (this._nativePicker) {
            this._nativePicker.value = this._formatHex6(this._value);
        }
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
        const normalized = String(val).trim();
        if (this._isValidHex(normalized)) {
            const old = this._value;
            this._value = normalized;
            this.render();

            if (old !== normalized) {
                this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
            }
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-color", webexpress.webui.InputColorCtrl);