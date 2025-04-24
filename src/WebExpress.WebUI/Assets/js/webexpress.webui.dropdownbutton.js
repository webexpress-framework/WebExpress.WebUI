/**
 * A dropdown button offering advanced features such as dynamically generated menu items.
 * The following events are triggered:
 *   - webexpress.webui.click Event triggered when an element is clicked
 */
webexpress.webui.DropdownButtonCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor for creating a dropdown button instance.
     * @param {HTMLElement} elem - The DOM element associated with the instance.
     */
    constructor(elem) {
        super(elem);

        // Initialize properties
        this._label = $(elem).data("label") || null;
        this._icon = $(elem).data("icon") || null;
        this._image = $(elem).data("image") || null;
        this._color = $(elem).data("color") || null;
        this._menuCSS = $(elem).data("menucss") || null;

        // Parse items from child elements
        this._parseItemsFromElements(
            $(elem).find(".wx-dropdownbutton-header, .wx-dropdownbutton-divider, .wx-dropdownbutton-item")
        );

        // Clean up the DOM element
        $(elem).removeAttr("icon color menucss").empty().addClass("wx-dropdownbutton");

        // Render the dropdown button
        this.render();
    }

    /**
     * Parses items from child elements in the dropdown control.
     * @param {jQuery} elements - The child elements to parse.
     */
    _parseItemsFromElements(elements) {
        const items = [];

        elements.each((_, elem) => {
            const $elem = $(elem);

            if ($elem.hasClass("wx-dropdownbutton-divider")) {
                items.push({ type: "divider" });
            } else if ($elem.hasClass("wx-dropdownbutton-header")) {
                items.push({
                    type: "header",
                    content: $elem.text(),
                    icon: $elem.data("icon") || null,
                });
            } else {
                items.push({
                    id: $elem.attr("id") || null,
                    image: $elem.data("image") || null,
                    icon: $elem.data("icon") || null,
                    content: $elem.text() || null,
                    color: $elem.attr("class").split(" ").find((cls) => cls.startsWith("text-")) || "",
                    backgroundColor: $elem
                        .attr("class")
                        .split(" ")
                        .filter((cls) => cls !== "wx-dropdownbutton-item")
                        .find((cls) => cls.startsWith("wx-")) || "",
                    disabled: $elem.is("[disabled]"),
                });
            }
        });

        this._items = items;
    }

    /**
     * Creates a single dropdown menu item based on the provided option data.
     * @param {Object} item - The data object for the menu item.
     * @returns {jQuery} The created menu item.
     */
    _createMenuItem(item) {
        const li = $("<li/>");

        if (item.type === "header") {
            // Create a header item
            if (item.icon) li.append($("<span class='me-2'/>").addClass(item.icon));
            li.append($("<span/>").text(item.content));
            li.addClass("dropdown-header");
        } else if (item.type === "divider") {
            // Create a divider item
            li.addClass("dropdown-divider");
        } else {
            // Create a regular menu item
            if (!item.disabled) {
                const link = $("<a class='link dropdown-item'/>")
                    .addClass(item.color)
                    .attr("href", "#");

                if (item.image) link.append($("<img/>").attr("src", item.image).attr("alt", item.content));
                if (item.icon) link.append($("<i/>").addClass(item.icon));
                link.append($("<span/>").text(item.content));

                link.click(() => {
                    $(document).trigger(webexpress.webui.Event.CLICK_EVENT, item.id);
                });

                li.append(link);
            } else {
                // Create a disabled menu item
                const disabledItem = $("<span class='dropdown-item text-muted disabled' aria-disabled='true'/>")
                    .html(`${item.icon ? `<i class='me-2 ${item.icon}'></i>` : ""}${item.content}`);
                li.append(disabledItem);
            }
        }

        return li;
    }

    /**
     * Renders the dropdown button and menu based on the current properties.
     */
    render() {
        // Clear existing content
        $(this._element).empty();

        // Create the button
        const button = $("<button class='btn' type='button' data-bs-toggle='dropdown' aria-expanded='false'/>");
        if (this._color) button.addClass(this._color);
        if (this._image) button.append($("<img class='me-2'/>").attr("src", this._image));
        if (this._icon) button.append($("<i class='me-2'/>").addClass(this._icon));
        button.append($("<span>").text(this._label));

        // Create the dropdown menu
        const ul = $("<ul class='dropdown-menu'/>");
        if (this._menuCSS) ul.addClass(this._menuCSS);

        // Generate menu items
        this._items.forEach((item) => {
            const li = this._createMenuItem(item);
            ul.append(li);
        });

        // Append button and menu to the element
        $(this._element).append(button, ul);
    }

    // Getter and setter for label
    get label() {
        return this._label;
    }

    set label(value) {
        this._label = value;
        this.render();
    }

    // Getter and setter for icon
    get icon() {
        return this._icon;
    }

    set icon(value) {
        this._icon = value;
        this.render();
    }

    // Getter and setter for color
    get color() {
        return this._color;
    }

    set color(value) {
        this._color = value;
        this.render();
    }

    // Getter and setter for menuCSS
    get menuCSS() {
        return this._menuCSS;
    }

    set menuCSS(value) {
        this._menuCSS = value;
        this.render();
    }

    // Getter and setter for items
    get items() {
        return this._items;
    }

    set items(value) {
        this._items = value;
        this.render();
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-dropdownbutton", webexpress.webui.DropdownButtonCtrl);