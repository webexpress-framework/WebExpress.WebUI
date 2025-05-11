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
     * Constructor
     * @param {HTMLElement} element - The DOM element for the selection control.
     */
    constructor(element) {
        super(element);

        // Initialize properties
        const name = $(element).attr("name");
        const value = $(element).data("value") || null;
        this._placeholder = $(element).attr("placeholder") || "Select an option";
        this._multiselect = $(element).data("multiselection") || false;
        this._values = [];
        this._items = [];
        this._optionfilter = (x, y) => x?.toLowerCase().startsWith(y?.toLowerCase());

        // Build and append components
        const hiddenInput = this._createHiddenInput(name);
        const dropdown = this._createDropdown();
        const dropdownMenu = this._createDropdownMenu();

        this._parseItemsFromElements(
            $(element).find(".wx-selection-header, .wx-selection-divider, .wx-selection-item, .wx-selection-footer")
        );

        if (value) {
            this.value = String(value).split(";");
        }

        // Clean up the DOM element
        $(element)
            .removeAttr("name placeholder data-multiselection")
            .empty()
            .addClass("wx-selection")
            .append(hiddenInput, dropdown, dropdownMenu);

        // Attach the suggestion box using Popper.js
        this._initializePopper(dropdown[0], dropdownMenu);

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
        const dropdown = $("<div>").addClass("form-control");
        const selection = $("<ul>");
        const expandIcon = $("<a>").addClass("fas fa-angle-down").attr("href", "#");

        dropdown.append(selection, expandIcon);
        this._selection = selection;

        dropdown.click((e) => {
            if (this._dropdownmenu.is(":visible")) {
                this._dropdownmenu.trigger("hide").hide();
            } else {
                this._dropdownmenu.css("display", "flex").trigger("show").show();
                this._filter.focus();
            }
        });

        $(document).click((e) => {
            if (!dropdown[0].contains(e.target) && !this._dropdownmenu[0].contains(e.target)) {
                this._dropdownmenu.trigger("hide").hide();
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
                items.push({ type: "header", content: $elem.html() });
            } else if ($elem.hasClass("wx-selection-footer")) {
                const footer = $("<footer>").html($elem.html());
                this._dropdownmenu.append(footer);
            } else {
                const id = $elem.attr("id") || null;

                items.push({
                    id,
                    label: $elem.data("label") || $elem.text(),
                    labelColor: $elem.data("label-color"),
                    icon: $elem.data("icon"),
                    image: $elem.data("image"),
                    content: $elem.html() || $elem.data("label"),
                    disabled: $elem.is("[disabled]"),
                    renderFunction: $elem.data("render")
                        ? new Function("item", `return (${$elem.data("render")})(item);`)
                        : null,
                });
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
                this._dropdownoptions.append($("<li>").addClass("dropdown-header").html(item.content));
            } else if (!this._values.includes(item.id)) {
                const li = $("<li>")
                    .addClass("dropdown-item")
                    .toggleClass("disabled", item.disabled);

                if (item.renderFunction) {
                    li.html(item.renderFunction(item));
                } else {
                    if (item.disabled) {
                        const span = $("<button disabled>").html(item.content);
                        if (item.icon) span.prepend($("<i>").addClass(item.icon));
                        if (item.image) span.prepend($("<img>").attr("src", item.image));
                        li.append(span);
                    } else {
                        const a = $("<button>").html(item.content);
                        if (item.icon) a.prepend($("<i>").addClass(item.icon));
                        if (item.image) a.prepend($("<img>").attr("src", item.image));
                        li.append(a);
                    }
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
                const li = $("<li>").addClass(item.labelColor);
                const span = $("<span>");
                const closeButton = $("<a>").addClass("fas fa-times").click(() => {
                    this.value = this._values.filter((v) => v !== value);
                    this.render();
                });

                if (item.image) span.append($("<img>").attr("src", item.image));
                if (item.icon) span.append($("<i>").addClass(`${item.icon} me-2`));
                span.append($("<span>").text(item.label));
                li.append(span);
                li.append(closeButton);
                this._selection.append(li);
            }
        });

        if (this._values.length === 0) {
            this._selection.html($("<span>").text(this._placeholder));
        }
    }

    /** 
     * Getters for options. 
     * @returns {Array} The current options as a list.
     */
    get options() {
        return this._items;
    }

    /**
     * Updates the options and triggers a re-render of the component.
     */
    set options(items) {
        this._items = items || [];
        this.render();
    }

    /** 
     * Getter for the value.
     * @returns {Array} The current value as a list.
     */
    get value() {
        return this._values;
    }

    /**
     * Updates value and triggers events.
     */
    set value(values) {
        if (this._values !== values) {
            this._values = values;
            this.render();
            this._hidden.val(this._values.join(";"));
            $(document).trigger(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
                id: $(this._element).attr("id"),
                value: values
            });
        }
    }
};

// Register the class
webexpress.webui.Controller.registerClass("wx-webui-selection", webexpress.webui.SelectionCtrl);