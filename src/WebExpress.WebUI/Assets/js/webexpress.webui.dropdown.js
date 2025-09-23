/**
 * DropdownCtrl is a control for dropdown buttons offering advanced features such as dynamically generated menu items.
 * 
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 */
webexpress.webui.DropdownCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Creates a new dropdown button controller instance.
     * Reads configuration from the HTML element's data attributes and child elements, 
     * cleans up the DOM, and triggers initial rendering.
     * @param {HTMLElement} element - The DOM element associated with the instance.
     */
    constructor(element) {
        super(element);

        // Read properties from data-attributes or attributes, fallback to null if missing
        this._label = element.dataset.label || null;
        this._icon = element.dataset.icon || null;
        this._image = element.dataset.image || null;
        this._menuCss = element.dataset.menucss || null;
        this._buttonCss = element.dataset.buttoncss || null;
        this._buttonStyle = element.dataset.buttonstyle || null;
        this._buttonColor = element.dataset.color || null;
        this._active = element.hasAttribute("active") ? "active" : null;
        this._disabled = element.hasAttribute("disabled") ? "disabled" : null;

        // Parse dropdown items from descendant elements
        this._parseItemsFromElements(
            Array.from(element.querySelectorAll(".wx-dropdown-header, .wx-dropdown-divider, .wx-dropdown-item"))
        );

        // Clean up the DOM element
        element.innerHTML = "";
        [
            "data-label", "data-icon", "data-image", "data-color", "data-menucss",
            "data-block", "data-toggle", "data-size", "data-border", "data-buttoncss",
            "data-buttonstyle", "disabled", "active"
        ].forEach(attr => element.removeAttribute(attr));
        element.classList.add("wx-dropdown");

        // Initial rendering of button and menu
        this.render();
    }

    /**
     * Parses child elements of the dropdown container and extracts menu item data.
     * Stores the result as a structured items array.
     * @param {HTMLElement[]} elements - Elements to parse.
     */
    _parseItemsFromElements(elements) {
        const items = [];

        elements.forEach(elem => {
            if (elem.classList.contains("wx-dropdown-divider")) {
                items.push({ type: "divider" });
            } else if (elem.classList.contains("wx-dropdown-header")) {
                items.push({
                    type: "header",
                    content: elem.textContent,
                    icon: elem.dataset.icon || null,
                });
            } else {
                const itemClasses = Array.from(elem.classList);
                items.push({
                    id: elem.id || null,
                    uri: elem.dataset.uri || "javascript:void(0);",
                    image: elem.dataset.image || null,
                    icon: elem.dataset.icon || null,
                    content: elem.textContent || null,
                    color: elem.dataset.color || null,
                    backgroundColor: itemClasses
                        .filter(cls => cls !== "wx-dropdown-item")
                        .find(cls => cls.startsWith("wx-")) || "",
                    disabled: elem.hasAttribute("disabled"),
                });
            }
        });

        this._items = items;
    }

    /**
     * Creates a single dropdown menu item element based on the provided item data.
     * Handles headers, dividers, enabled and disabled items, including icons and images.
     * @param {Object} item - Menu item configuration object.
     * @returns {HTMLElement} The created list item element.
     */
    _createMenuItem(item) {
        const li = document.createElement("li");

        if (item.type === "header") {
            // Create a header item with optional icon
            const header = document.createElement("span");
            header.classList.add("dropdown-header");
            if (item.icon) {
                const icon = document.createElement("i");
                icon.className = item.icon;
                header.appendChild(icon);
            }
            header.append(item.content);
            li.appendChild(header);
        } else if (item.type === "divider") {
            // Create a divider element
            li.classList.add("dropdown-divider");
        } else {
            // Create a regular menu item (enabled or disabled)
            if (!item.disabled) {
                const link = document.createElement("a");
                link.className = "wx-link dropdown-item";
                if (item.color) link.classList.add(item.color);
                link.href = item.uri;

                if (item.image) {
                    const img = document.createElement("img");
                    img.src = item.image;
                    img.alt = item.content;
                    link.appendChild(img);
                }
                if (item.icon) {
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    link.appendChild(icon);
                }
                const span = document.createElement("span");
                span.textContent = item.content;
                link.appendChild(span);

                // Register click handler for the menu item
                link.addEventListener("click", () => {
                    if (typeof item.action === "function") {
                        item.action();
                    }
                    const event = new CustomEvent(webexpress.webui.Event.CLICK_EVENT, {
                        detail: {
                            sender: this._element,
                            id: this._element.id || null,
                            item: item
                        }
                    });
                    document.dispatchEvent(event);
                });

                li.appendChild(link);
            } else {
                // Create a disabled menu item
                const disabledItem = document.createElement("span");
                disabledItem.className = "dropdown-item text-muted disabled";
                disabledItem.setAttribute("aria-disabled", "true");
                if (item.icon) {
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    disabledItem.appendChild(icon);
                }
                disabledItem.append(item.content);
                li.appendChild(disabledItem);
            }
        }

        return li;
    }

    /**
     * Renders the dropdown button and menu based on the current properties.
     * Clears the container, creates the button, generates the menu and attaches all to the DOM.
     * Fires CHANGE_VISIBILITY_EVENT if the menu becomes visible or hidden.
     */
    render() {
        this._element.innerHTML = "";

        // Create the main dropdown button
        const button = document.createElement("button");
        button.className = "btn";
        button.type = "button";
        button.setAttribute("data-bs-toggle", "dropdown");
        button.setAttribute("aria-expanded", "false");
        if (this._buttonCss) button.classList.add(...this._buttonCss.split(" "));
        if (this._buttonColor) button.classList.add(this._buttonColor);
        if (this._active) button.setAttribute("active", "true");
        if (this._disabled) button.disabled = true;
        if (this._buttonStyle) button.setAttribute("style", this._buttonStyle);

        if (this._image) {
            const img = document.createElement("img");
            img.src = this._image;
            button.appendChild(img);
        }
        if (this._icon) {
            const icon = document.createElement("i");
            icon.className = this._icon;
            button.appendChild(icon);
        }

        if (this._label) {
            const span = document.createElement("span");
            span.textContent = this._label || "";
            button.appendChild(span);
        }

        // Create the dropdown menu list
        const ul = document.createElement("ul");
        ul.className = "dropdown-menu";
        if (this._menuCss) ul.classList.add(...this._menuCss.split(" "));

        // Add all menu items
        this._items.forEach(item => {
            const li = this._createMenuItem(item);
            ul.appendChild(li);
        });

        // Append button and menu to the container
        this._element.appendChild(button);
        this._element.appendChild(ul);

        // Handle visibility change event
        // Fires CHANGE_VISIBILITY_EVENT when the menu is shown or hidden
        button.addEventListener('show.bs.dropdown', () => {
            const visEvent = new CustomEvent(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
                detail: {
                    sender: this._element,
                    visible: true
                }
            });
            document.dispatchEvent(visEvent);
        });
        button.addEventListener('hide.bs.dropdown', () => {
            const visEvent = new CustomEvent(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
                detail: {
                    sender: this._element,
                    visible: false
                }
            });
            document.dispatchEvent(visEvent);
        });
    }

    /**
     * Gets or sets the button label.
     */
    get label() {
        return this._label;
    }
    set label(value) {
        this._label = value;
        this.render();
    }

    /**
     * Gets or sets the button icon.
     */
    get icon() {
        return this._icon;
    }
    set icon(value) {
        this._icon = value;
        this.render();
    }

    /**
     * Gets or sets the button color class.
     */
    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
        this.render();
    }

    /**
     * Gets or sets the menu CSS classes.
     */
    get menuCSS() {
        return this._menuCss;
    }
    set menuCSS(value) {
        this._menuCss = value;
        this.render();
    }

    /**
     * Gets or sets the array of menu items.
     */
    get items() {
        return this._items;
    }
    set items(value) {
        this._items = value;
        this.render();
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-dropdown", webexpress.webui.DropdownCtrl);