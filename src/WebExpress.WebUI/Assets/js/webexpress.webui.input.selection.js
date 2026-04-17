/**
 * A selection box extending the base Control class.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_FILTER_EVENT
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT
 */
webexpress.webui.InputSelectionCtrl = class extends webexpress.webui.PopperCtrl {
    _values = [];
    _items = [];
    _filterInput = null;
    _optionfilter = null;
    _multiselect = false;
    _stickySelection = false;
    _placeholder = "";

    /**
     * Constructor for initializing the selection control.
     * @param {HTMLElement} element - The DOM element for the selection control.
     */
    constructor(element) {
        super(element);

        // initialize properties from attributes and dataset
        const name = element.getAttribute("name");
        const value = element.dataset.value || null;
        this._placeholder = element.getAttribute("placeholder") || this._i18n("webexpress.webui:selection.placeholder", "Select an option");
        this._multiselect = element.dataset.multiselection === "true";
        this._stickySelection = element.dataset.stickySelection === "true";
        this._values = [];
        this._items = [];
        // default filter logic
        this._optionfilter = (label, filterText) => {
            return label && label.toLowerCase().includes(filterText.toLowerCase());
        };

        // create and append ui components
        const hiddenInput = this._createHiddenInput(name);
        const dropdown = this._createDropdown();
        const dropdownMenu = this._createDropdownMenu();

        // parse options and structural items from child elements
        this._parseItemsFromElements(
            element.querySelectorAll(
                ".wx-selection-header, .wx-selection-divider, .wx-selection-item, .wx-selection-footer"
            )
        );

        if (value) {
            this.value = String(value).split(";");
        }

        // clean up the element before adding new structure
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-multiselection");
        element.removeAttribute("data-sticky-selection");
        element.innerHTML = "";
        element.classList.add("wx-selection");
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
        this._hidden = hiddenInput;
        return hiddenInput;
    }

    /**
     * Creates the dropdown clickable area (visible selection field).
     * @returns {HTMLDivElement} The dropdown element.
     */
    _createDropdown() {
        const dropdown = document.createElement("div");
        dropdown.classList.add("form-control");

        const selection = document.createElement("ul");
        const expandIcon = document.createElement("a");
        expandIcon.className = "fas fa-angle-down";
        expandIcon.href = "javascript:void(0);";

        dropdown.appendChild(selection);
        dropdown.appendChild(expandIcon);
        this._selection = selection;

        // toggle the dropdown menu on click
        dropdown.addEventListener("click", (e) => {
            if (this._dropdownmenu.style.display === "flex") {
                this._dropdownmenu.dispatchEvent(new Event("hide"));
                this._dropdownmenu.style.display = "none";
            } else {
                this._dropdownmenu.style.display = "flex";
                this._dropdownmenu.dispatchEvent(new Event("show"));
                if (this._filterInput) {
                    this._filterInput.focus({ preventScroll: true });
                }
            }
        });

        // hide the dropdown menu when clicking outside
        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && !this._dropdownmenu.contains(e.target)) {
                this._dropdownmenu.dispatchEvent(new Event("hide"));
                this._dropdownmenu.style.display = "none";
            }
        });

        return dropdown;
    }

    /**
     * Creates the dropdown menu container.
     * @returns {HTMLDivElement} The dropdown menu element.
     */
    _createDropdownMenu() {
        const dropdownMenu = document.createElement("div");
        dropdownMenu.classList.add("dropdown-menu");

        const dropdownOptions = document.createElement("ul");
        this._dropdownoptions = dropdownOptions;

        // setup event delegation for options
        this._dropdownoptions.addEventListener("click", (e) => {
            e.stopPropagation();
            const targetItem = e.target.closest("li.dropdown-item");
            if (!targetItem || targetItem.classList.contains("disabled")) {
                return;
            }

            const itemId = targetItem.dataset.id;
            const item = this._items.find((i) => { return i.id == itemId; });

            if (item) {
                if (!this._multiselect) {
                    this.value = [];
                }

                // toggle selection or add unique
                if (!this._values.includes(item.id)) {
                    this.value = [...this.value, item.id];
                }

                // close the dropdown after selection (optional logic for single select)
                if (!this._multiselect) {
                    this._dispatch(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {});
                    this._dropdownmenu.style.display = "none";
                }
            }
        });

        dropdownMenu.appendChild(this._createFilterContainer());
        dropdownMenu.appendChild(dropdownOptions);
        this._dropdownmenu = dropdownMenu;
        return dropdownMenu;
    }

    /**
     * Creates the filter container with input and clear button.
     * @returns {HTMLDivElement} The filter container element.
     */
    _createFilterContainer() {
        const filterContainer = document.createElement("div");
        const filterInput = document.createElement("input");
        filterInput.type = "text";
        filterInput.setAttribute("aria-label", this._i18n("webexpress.webui:selection.filter", "Filter"));

        const clearButton = document.createElement("a");
        clearButton.className = "fas fa-times";
        clearButton.setAttribute("aria-label", this._i18n("webexpress.webui:selection.filter.clear", "Clear Filter"));
        clearButton.setAttribute("role", "button");
        clearButton.style.cursor = "pointer";

        filterContainer.appendChild(filterInput);
        filterContainer.appendChild(clearButton);

        // update filter and re-render on input
        filterInput.addEventListener("input", () => {
            const filter = filterInput.value;
            this._dispatch(webexpress.webui.Event.CHANGE_FILTER_EVENT, { filter: filter });
            this.render();
        });

        // clear filter and re-render when clear button is clicked
        clearButton.addEventListener("click", (e) => {
            e.stopPropagation();
            filterInput.value = "";
            this._dispatch(webexpress.webui.Event.CHANGE_FILTER_EVENT, { filter: "" });
            this.render();
        });

        this._filterInput = filterInput;

        return filterContainer;
    }

    /**
     * Parses options and structural items from child elements in the selection control.
     * @param {NodeListOf<Element>} elements - Elements to parse.
     */
    _parseItemsFromElements(elements) {
        const items = [];
        const value = [...this.value]; // clone current values

        elements.forEach((elem) => {
            if (elem.classList.contains("wx-selection-divider")) {
                items.push({ type: "divider" });
            } else if (elem.classList.contains("wx-selection-header")) {
                items.push({ type: "header", content: elem.innerHTML });
            } else if (elem.classList.contains("wx-selection-footer")) {
                // footer is appended to the dropdown menu directly
                const footer = document.createElement("footer");
                footer.innerHTML = elem.innerHTML;
                this._dropdownmenu.appendChild(footer);
            } else {
                const id = elem.getAttribute("id") || null;
                items.push({
                    id: id,
                    label: elem.dataset.label || elem.textContent,
                    labelColor: elem.dataset.labelColor,
                    icon: elem.dataset.icon,
                    image: elem.dataset.image,
                    content: elem.innerHTML || elem.dataset.label,
                    disabled: elem.hasAttribute("disabled")
                });
            }
        });

        // restore values after parsing (in case setter logic needs validation against items)
        this.value = value;
        this._items = items;
    }

    /**
     * Renders the selection control options and current selection.
     */
    render() {
        // use document fragment for performance
        const fragment = document.createDocumentFragment();
        const filterText = this._filterInput ? this._filterInput.value : "";

        // render each selection item or structural item
        this._items.forEach((item) => {
            // apply filter logic
            if (item.type !== "divider" && item.type !== "header") {
                 const isVisible = this._optionfilter(item.label, filterText);
                 if (!isVisible) {
                     return;
                 }
            }

            // prevent rendering dividers/headers if they are adjacent or at start/end due to filtering
            // (simple logic: just render all structure for now, complex logic omitted for brevity)

            if (item.type === "divider") {
                const li = document.createElement("li");
                li.className = "dropdown-divider";
                fragment.appendChild(li);
            } else if (item.type === "header") {
                const li = document.createElement("li");
                li.className = "dropdown-header";
                li.innerHTML = item.content;
                fragment.appendChild(li);
            } else if (!this._values.includes(item.id)) {
                const li = document.createElement("li");
                li.className = "dropdown-item";
                // store id for event delegation
                li.dataset.id = item.id;

                if (item.disabled) {
                    li.classList.add("disabled");
                }

                const contentWrapper = document.createElement(item.disabled ? "span" : "button");
                if (item.disabled) {
                    contentWrapper.setAttribute("disabled", "disabled");
                }
                contentWrapper.innerHTML = item.content;

                if (item.icon) {
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    contentWrapper.prepend(icon);
                }
                if (item.image) {
                    const img = document.createElement("img");
                    img.className = "wx-icon";
                    img.src = item.image;
                    contentWrapper.prepend(img);
                }
                li.appendChild(contentWrapper);

                fragment.appendChild(li);
            }
        });

        // update dom in one go
        this._dropdownoptions.innerHTML = "";
        this._dropdownoptions.appendChild(fragment);

        // render selected values in the selection field
        this._selection.innerHTML = "";
        this._values.forEach((value) => {
            const item = this._items.find((i) => { return i.id === value; });
            if (item) {
                const li = document.createElement("li");
                if (item.labelColor) {
                    li.className = item.labelColor;
                }

                const span = document.createElement("span");
                const isStickyActive = this._stickySelection && this._values.length > 0;

                if (item.image) {
                    const img = document.createElement("img");
                    img.className = "wx-icon";
                    img.src = item.image;
                    span.appendChild(img);
                }
                if (item.icon) {
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    span.appendChild(icon);
                }
                const labelSpan = document.createElement("span");
                labelSpan.textContent = item.label;
                span.appendChild(labelSpan);

                li.appendChild(span);

                if (!isStickyActive) {
                    const closeButton = document.createElement("a");
                    closeButton.className = "fas fa-times";
                    closeButton.style.cursor = "pointer";
                    closeButton.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.value = this._values.filter((v) => { return v !== value; });
                        this.render();
                    });
                    li.appendChild(closeButton);
                }
                this._selection.appendChild(li);
            }
        });

        // show placeholder if nothing is selected
        if (this._values.length === 0) {
            const span = document.createElement("span");
            span.textContent = this._placeholder;
            this._selection.innerHTML = "";
            this._selection.appendChild(span);
        }

        // update the value of the hidden input
        if (this._hidden) {
            this._hidden.value = this._values.join(";");
        }
    }

    /**
     * Returns the current options array.
     * @returns {Array} The array of options.
     */
    get options() {
        return this._items;
    }

    /**
     * Updates the list of options and triggers rendering.
     * @param {Array} items - Array of new option items.
     */
    set options(items) {
        this._items = items || [];
        this.render();
    }

    /**
     * Gets whether multi-select mode is enabled.
     * @returns {boolean} True if multiple values can be selected.
     */
    get multiSelect() {
        return this._multiselect;
    }

    /**
     * Sets whether multi-select mode is enabled.
     * Adjusts the current value structure if needed.
     * @param {boolean} enabled True to allow multiple selections.
     */
    set multiSelect(enabled) {
        this._multiselect = Boolean(enabled);

        // normalize current values depending on mode
        if (this._multiselect === false) {
            // collapse to a single value if multiple exist
            if (Array.isArray(this._values) && this._values.length > 1) {
                this._values = [this._values[0]];
            }
        }

        this.render(); // optional UI refresh
    }

    /**
     * Gets whether sticky selection mode is enabled.
     * @returns {boolean} True if the selection cannot be cleared once set.
     */
    get stickySelection() {
        return this._stickySelection;
    }

    /**
     * Sets whether sticky selection mode is enabled.
     * When enabled and a value is selected, the selection cannot be cleared
     * through the UI (remove icon or keyboard). The user may still replace
     * the value by selecting another item.
     * @param {boolean} enabled True to enable sticky selection.
     */
    set stickySelection(enabled) {
        this._stickySelection = Boolean(enabled);
        this.render();
    }

    /**
     * Gets the current value(s) of the selection.
     * @returns {Array} The currently selected values.
     */
    get value() {
        return this._values;
    }

    /**
     * Sets the value(s) of the selection and triggers events and rendering.
     * Accepts:
     * - Array of ids
     * - single id string
     * - semicolon separated string "id1;id2"
     * - null/undefined (clears selection)
     * In single-select mode only the first value is kept.
     * @param {Array|string|null|undefined} values - New selection value(s).
     */
    set value(values) {
        // normalize incoming values
        let normalized = [];
        if (values === null || values === undefined) {
            normalized = [];
        } else if (Array.isArray(values)) {
            normalized = values;
        } else if (typeof values === "string") {
            const trimmed = values.trim();
            if (trimmed.length > 0) {
                // allow semicolon separated list
                if (trimmed.includes(";")) {
                    normalized = trimmed.split(";").map((v) => { return v.trim(); }).filter((v) => { return v.length > 0; });
                } else {
                    normalized = [trimmed];
                }
            }
        } else {
            normalized = [];
        }

        // enforce uniqueness
        normalized = [...new Set(normalized)];

        // enforce single-select restriction
        if (!this._multiselect && normalized.length > 1) {
            normalized = [normalized[0]];
        }

        const oldSerialized = (this._values || []).join(";");
        const newSerialized = normalized.join(";");

        if (oldSerialized !== newSerialized) {
            this._values = normalized;
            this.render();
            if (this._hidden) {
                this._hidden.value = newSerialized;
            }
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: [...this._values] });
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-selection", webexpress.webui.InputSelectionCtrl);