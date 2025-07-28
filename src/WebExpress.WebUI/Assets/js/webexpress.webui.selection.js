/**
 * A selection box extending the base Control class.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_FILTER_EVENT
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT
 */
webexpress.webui.SelectionCtrl = class extends webexpress.webui.PopperCtrl {
    /**
     * Constructor for initializing the selection control.
     * @param {HTMLElement} element - The DOM element for the selection control.
     */
    constructor(element) {
        super(element);

        // Initialize properties from attributes and dataset
        const name = element.getAttribute("name");
        const value = element.dataset.value || null;
        this._placeholder = element.getAttribute("placeholder") || "Select an option";
        this._multiselect = element.dataset.multiselection === "true";
        this._values = [];
        this._items = [];
        this._optionfilter = (x, y) => x?.toLowerCase().startsWith(y?.toLowerCase());

        // Create and append UI components
        const hiddenInput = this._createHiddenInput(name);
        const dropdown = this._createDropdown();
        const dropdownMenu = this._createDropdownMenu();

        // Parse options and structural items from child elements
        this._parseItemsFromElements(
            element.querySelectorAll(
                ".wx-selection-header, .wx-selection-divider, .wx-selection-item, .wx-selection-footer"
            )
        );

        if (value) {
            this.value = String(value).split(";");
        }

        // Clean up the element before adding new structure
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-multiselection");
        element.innerHTML = "";
        element.classList.add("wx-selection");
        element.appendChild(hiddenInput);
        element.appendChild(dropdown);
        element.appendChild(dropdownMenu);

        // Attach Popper.js positioning for the dropdown menu
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

        // Toggle the dropdown menu on click
        dropdown.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this._dropdownmenu.style.display === "flex") {
                this._dropdownmenu.dispatchEvent(new Event("hide"));
                this._dropdownmenu.style.display = "none";
            } else {
                this._dropdownmenu.style.display = "flex";
                this._dropdownmenu.dispatchEvent(new Event("show"));
                this._filter.focus();
            }
        });

        // Hide the dropdown menu when clicking outside
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
        filterInput.setAttribute("aria-label", "Filter");

        const clearButton = document.createElement("a");
        clearButton.className = "fas fa-times";
        clearButton.setAttribute("aria-label", "Clear Filter");
        clearButton.setAttribute("role", "button");
        clearButton.style.cursor = "pointer";

        filterContainer.appendChild(filterInput);
        filterContainer.appendChild(clearButton);

        // Update filter and re-render on input
        filterInput.addEventListener("input", () => {
            const filter = filterInput.value;
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_FILTER_EVENT, {
                detail: {
                    sender: this._element,
                    filter: filter
                }
            }));
            this.render();
        });

        // Clear filter and re-render when clear button is clicked
        clearButton.addEventListener("click", (e) => {
            e.stopPropagation();
            filterInput.value = "";
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_FILTER_EVENT, {
                detail: {
                    sender: this._element,
                    filter: ""
                }
            }));
            this.render();
        });

        this._filter = filterInput;
        this._clearFilterButton = clearButton;

        return filterContainer;
    }

    /**
     * Parses options and structural items from child elements in the selection control.
     * @param {NodeListOf<Element>} elements - Elements to parse.
     */
    _parseItemsFromElements(elements) {
        const items = [];
        const value = [...this.value];

        elements.forEach((elem) => {
            if (elem.classList.contains("wx-selection-divider")) {
                // Divider item
                items.push({ type: "divider" });
            } else if (elem.classList.contains("wx-selection-header")) {
                // Header item
                items.push({ type: "header", content: elem.innerHTML });
            } else if (elem.classList.contains("wx-selection-footer")) {
                // Footer is appended to the dropdown menu
                const footer = document.createElement("footer");
                footer.innerHTML = elem.innerHTML;
                this._dropdownmenu.appendChild(footer);
            } else {
                // Regular selection item
                const id = elem.getAttribute("id") || null;
                items.push({
                    id,
                    label: elem.dataset.label || elem.textContent,
                    labelColor: elem.dataset.labelColor,
                    icon: elem.dataset.icon,
                    image: elem.dataset.image,
                    content: elem.innerHTML || elem.dataset.label,
                    disabled: elem.hasAttribute("disabled"),
                    renderFunction: elem.dataset.render
                        ? new Function("item", `return (${elem.dataset.render})(item);`)
                        : null,
                });
            }
        });

        this.value = value;
        this._items = items;
    }

    /**
     * Renders the selection control options and current selection.
     */
    render() {
        // Clear dropdown options
        this._dropdownoptions.innerHTML = "";

        // Render each selection item or structural item
        this._items.forEach((item) => {
            if (item.type === "divider") {
                const li = document.createElement("li");
                li.className = "dropdown-divider";
                this._dropdownoptions.appendChild(li);
            } else if (item.type === "header") {
                const li = document.createElement("li");
                li.className = "dropdown-header";
                li.innerHTML = item.content;
                this._dropdownoptions.appendChild(li);
            } else if (!this._values.includes(item.id)) {
                const li = document.createElement("li");
                li.className = "dropdown-item";
                if (item.disabled) li.classList.add("disabled");

                // Custom render function or default rendering
                if (item.renderFunction) {
                    li.innerHTML = item.renderFunction(item);
                } else {
                    if (item.disabled) {
                        const span = document.createElement("button");
                        span.disabled = true;
                        span.innerHTML = item.content;
                        if (item.icon) {
                            const icon = document.createElement("i");
                            icon.className = item.icon;
                            span.prepend(icon);
                        }
                        if (item.image) {
                            const img = document.createElement("img");
                            img.src = item.image;
                            span.prepend(img);
                        }
                        li.appendChild(span);
                    } else {
                        const a = document.createElement("button");
                        a.innerHTML = item.content;
                        if (item.icon) {
                            const icon = document.createElement("i");
                            icon.className = item.icon;
                            a.prepend(icon);
                        }
                        if (item.image) {
                            const img = document.createElement("img");
                            img.src = item.image;
                            a.prepend(img);
                        }
                        li.appendChild(a);
                    }
                }

                // Add click event for selection
                li.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (!item.disabled) {
                        if (!this._multiselect) this.value = [];
                        if (!this._values.includes(item.id)) this.value = [...this.value, item.id];
                        this.render();
                        
                        // Close the dropdown after selection
                        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                            detail: {
                                sender: this._element,
                                id: this._element.id
                            }
                        }));
                        this._dropdownmenu.style.display = "none";
                    }
                });

                // Filter items based on filter input
                if (!item.label || item.label.toLowerCase().includes(this._filter.value.toLowerCase())) {
                    this._dropdownoptions.appendChild(li);
                }
            }
        });

        // Render selected values in the selection field
        this._selection.innerHTML = "";
        this._values.forEach((value) => {
            const item = this._items.find((i) => i.id === value);
            if (item) {
                const li = document.createElement("li");
                if (item.labelColor) li.className = item.labelColor;
                const span = document.createElement("span");
                const closeButton = document.createElement("a");
                closeButton.className = "fas fa-times";
                closeButton.style.cursor = "pointer";
                closeButton.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.value = this._values.filter((v) => v !== value);
                    this.render();
                });

                if (item.image) {
                    const img = document.createElement("img");
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
                li.appendChild(closeButton);
                this._selection.appendChild(li);
            }
        });

        // Show placeholder if nothing is selected
        if (this._values.length === 0) {
            const span = document.createElement("span");
            span.textContent = this._placeholder;
            this._selection.innerHTML = "";
            this._selection.appendChild(span);
        }

        // Update the value of the hidden input
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
     * Gets the current value(s) of the selection.
     * @returns {Array} The currently selected values.
     */
    get value() {
        return this._values;
    }

    /**
     * Sets the value(s) of the selection and triggers events and rendering.
     * @param {Array} values - Array of selected values.
     */
    set value(values) {
        // Only set value if it has changed
        const old = typeof this._values === "object" ? this._values.join(";") : this._values;
        const neu = typeof values === "object" ? values.join(";") : values;
        if (old !== neu) {
            this._values = values;
            this.render();
            if (this._hidden) this._hidden.value = (this._values || []).join(";");
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id,
                    value: values
                }
            }));
        }
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-selection", webexpress.webui.SelectionCtrl);