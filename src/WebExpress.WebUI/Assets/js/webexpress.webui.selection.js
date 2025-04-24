/**
 * A selection box extending the base Control class.
 * The following events are triggered:
 * - webexpress.webui.change.filter with parameter filter.
 * - webexpress.webui.change.value with parameter value.
 * - webexpress.webui.dropdown.show
 * - webexpress.webui.dropdown.hidden
 */
webexpress.webui.SelectionCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element for the selection control.
     */
    constructor(element) {
        super(element);

        // Initialize properties
        this._placeholder = $(element).attr("placeholder") || "Select an option";
        this._multiselect = $(element).data("multiselection") === true;
        this._values = [];
        this._items = [];
        this._optionfilter = (x, y) => x?.toLowerCase().startsWith(y?.toLowerCase());

        // Build and append components
        const hiddenInput = this._createHiddenInput($(element).attr("name"));
        const dropdown = this._createDropdown();
        const dropdownMenu = this._createDropdownMenu();

        this._parseItemsFromElements(
            $(element).find(".wx-selection-header, .wx-selection-divider, .wx-selection-item, .wx-selection-footer")
        );

        $(element)
            .removeData()
            .empty()
            .addClass("wx-selection form-control")
            .append(dropdown, dropdownMenu, hiddenInput);

        this.render();
    }

    /**
     * Creates a hidden input for form submission.
     * @param {string} name - The name attribute for the hidden input.
     * @returns {jQuery} The hidden input element.
     */
    _createHiddenInput(name) {
        const hiddenInput = $("<input>").attr({ type: "hidden", name: name || "" });
        this._hidden = hiddenInput;
        return hiddenInput;
    }

    /**
     * Creates the dropdown container.
     * @returns {jQuery} The dropdown element.
     */
    _createDropdown() {
        const dropdown = $("<div>");
        const selection = $("<ul>");
        const expandIcon = $("<a>").addClass("fas fa-angle-down").attr("href", "#");

        dropdown.append(selection, expandIcon);
        this._selection = selection;

        dropdown.click((e) => {
            e.stopPropagation();
            const isVisible = this._dropdownmenu.is(":visible");
            this._dropdownmenu.css("display", isVisible ? "none" : "flex");
            if (!isVisible) {
                $(document).trigger(webexpress.webui.Event.DROPDOWN_SHOW_EVENT, "");
            } else {
                $(document).trigger(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, "");
            }
            this._dropdownmenu.width($(this._element).width());
        });

        $(document).click((e) => {
            if (!dropdown[0].contains(e.target) && !this._dropdownmenu[0].contains(e.target)) {
                this._dropdownmenu.css("display", "none");
            }
        });

        return dropdown;
    }

    /**
     * Creates the dropdown menu container.
     * @returns {jQuery} The dropdown menu element.
     */
    _createDropdownMenu() {
        const dropdownMenu = $("<div>").addClass("dropdown-menu");
        const dropdownOptions = $("<ul>");
        this._dropdownoptions = dropdownOptions;
        dropdownMenu.append(this._createFilterContainer(), dropdownOptions);
        this._dropdownmenu = dropdownMenu;
        return dropdownMenu;
    }

    /**
     * Creates the filter container with input and clear button.
     * @returns {jQuery} The filter container element.
     */
    _createFilterContainer() {
        const filterContainer = $("<div>");
        const filterInput = $("<input>").attr({ type: "text", "aria-label": "Filter" });
        const clearButton = $("<a>")
            .addClass("fas fa-times")
            .attr({ "aria-label": "Clear Filter", role: "button" });

        filterContainer.append(filterInput, clearButton);

        filterInput.on("input", () => {
            const filter = filterInput.val();
            $(document).trigger(webexpress.webui.Event.CHANGE_FILTER_EVENT, filter || "");
            this.render();
        });

        clearButton.click((e) => {
            e.stopPropagation();
            filterInput.val("");
            $(document).trigger(webexpress.webui.Event.CHANGE_FILTER_EVENT, "");
            this.render();
        });

        this._filter = filterInput;
        this._clearFilterButton = clearButton;

        return filterContainer;
    }

    /**
     * Parses items from child elements in the selection control.
     * @param {jQuery} elements - The child elements to parse.
     */
    _parseItemsFromElements(elements) {
        const items = [];
        const value = [...this.value];

        elements.each((_, elem) => {
            const $elem = $(elem);

            if ($elem.hasClass("wx-selection-divider")) {
                items.push({ type: "divider" });
            } else if ($elem.hasClass("wx-selection-header")) {
                items.push({ type: "header", description: $elem.html() });
            } else if ($elem.hasClass("wx-selection-footer")) {
                const footer = $("<footer>").html($elem.html());
                this._dropdownmenu.append(footer);
            } else {
                const id = $elem.attr("id") || null;
                const selected = $elem.is("[selected]");

                items.push({
                    id,
                    label: $elem.data("label"),
                    labelColor: $elem.data("label-color"),
                    icon: $elem.data("icon"),
                    image: $elem.data("image"),
                    content: $elem.html(),
                    description: $elem.data("description"),
                    disabled: $elem.is("[disabled]"),
                    renderFunction: $elem.data("render")
                        ? new Function("item", `return (${$elem.data("render")})(item);`)
                        : null,
                });

                if (selected) value.push(id);
            }
        });

        this.value = value;
        this._items = items;
    }

    /**
     * Render the selection control.
     */
    render() {
        this._dropdownoptions.empty();

        this._items.forEach((item) => {
            if (item.type === "divider") {
                this._dropdownoptions.append($("<li>").addClass("dropdown-divider"));
            } else if (item.type === "header") {
                this._dropdownoptions.append($("<li>").addClass("dropdown-header").html(item.description));
            } else if (!this._values.includes(item.id)) {
                const li = $("<li>")
                    .addClass("dropdown-item")
                    .toggleClass("disabled", item.disabled);

                if (item.renderFunction) {
                    li.html(item.renderFunction(item));
                } else {
                    if (item.icon) li.append($("<i>").addClass(`${item.icon} me-2`));
                    if (item.image) li.append($("<img>").attr("src", item.image));
                    li.append($("<span>").text(item.label));
                }

                li.click(() => {
                    if (!this._multiselect) this.value = [];
                    if (!this._values.includes(item.id)) this.value = [...this.value, item.id];
                    this.render();
                });

                if (!item.label || item.label.toLowerCase().includes(this._filter.val().toLowerCase())) {
                    this._dropdownoptions.append(li);
                }
            }
        });

        this._selection.empty();
        this._values.forEach((value) => {
            const item = this._items.find((i) => i.id === value);
            if (item) {
                const li = $("<li>").addClass(item.labelColor).text(item.label);
                const closeButton = $("<a>").addClass("fas fa-times").click(() => {
                    this.value = this._values.filter((v) => v !== value);
                    this.render();
                });
                li.append(closeButton);
                this._selection.append(li);
            }
        });

        if (this._values.length === 0) {
            this._selection.html($("<span>").text(this._placeholder));
        }
    }

    /** Getters and setters for options and values */
    get options() {
        return this._items;
    }

    set options(items) {
        this._items = items || [];
        this.render();
    }

    get value() {
        return this._values;
    }

    set value(values) {
        if (this._values !== values) {
            this._values = values;
            this.render();
            this._hidden.val(this._values.join(";"));
            $(document).trigger("webexpress.webui.change.value", values);
        }
    }
};

// Register the class
webexpress.webui.Controller.registerClass("wx-webui-selection", webexpress.webui.SelectionCtrl);