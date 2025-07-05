/**
 * ToolbarCtrl is a toolbar control that dynamically generates menu items based on its child elements.
 * The toolbar supports various types of items including buttons with icons only, buttons with icons and text, buttons with text only, separators, dropdown buttons, comboboxes, and text-items.
 * It offers flexible configuration via data attributes and allows customization of styling and behavior.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */

webexpress.webui.ToolbarCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Creates a new toolbar controller instance.
     * @param {HTMLElement} element - The DOM element associated with the toolbar.
     */
    constructor(element) {
        super(element);

        // Parse toolbar items from child elements
        this._parseItemsFromElements(
            Array.from(element.querySelectorAll(
                ".wx-toolbar-button, .wx-toolbar-separator, .wx-toolbar-dropdown, .wx-toolbar-combobox, .wx-toolbar-text"
            ))
        );
        
        // Add predefined dropdown at the right end
        this._parseMoreDropdown(element.querySelector(".wx-toolbar-more"));

        // Clean up the DOM element
        element.innerHTML = "";
        element.classList.add("wx-toolbar");

        // Initial rendering of the toolbar
        this.render();
    }

    /**
     * Parses child elements of the toolbar container and extracts item data.
     * @param {HTMLElement[]} elements - Elements to parse.
     */
    _parseItemsFromElements(elements) {
        const items = [];

        elements.forEach(elem => {
            const align = elem.dataset.align || "left"; // Default alignment is "left"
            const disabled = elem.hasAttribute("disabled"); // Check if the item is disabled
            const active = elem.hasAttribute("active"); // Check if the item is selected

            if (elem.classList.contains("wx-toolbar-separator")) {
                items.push({ type: "separator", align });
            } else if (elem.classList.contains("wx-toolbar-combobox")) {
                const options = elem.dataset.options ? elem.dataset.options.split(",") : [];
                items.push({
                    type: "combobox",
                    label: elem.dataset.label || null,
                    icon: elem.dataset.icon || null,
                    title: elem.dataset.title || null,
                    options: options,
                    align,
                    disabled,
                });
            } else if (elem.classList.contains("wx-toolbar-dropdown")) {
                elem.classList.remove("wx-toolbar-dropdown");
                items.push({
                    type: "dropdown",
                    element: elem, // Pass the original element for DropdownCtrl
                    align,
                    disabled,
                    active,
                });
            } else if (elem.classList.contains("wx-toolbar-button")) {
                items.push({
                    type: "button",
                    label: elem.dataset.label || null,
                    icon: elem.dataset.icon || null,
                    title: elem.dataset.title || null,
                    color: elem.dataset.color || null,
                    align,
                    disabled,
                    active,
                });
            } else if (elem.classList.contains("wx-toolbar-text")) {
                items.push({
                    type: "text",
                    content: elem.dataset.label || "",
                    align,
                    disabled,
                });
            }
        });

        this._items = items;
    }

    /**
     * Adds a default dropdown menu at the right end of the toolbar.
      @param {HTMLElement} element - Element to parse.
     */
    _parseMoreDropdown(element) {
        
        if (element && element.children.length > 0) {
            element.classList.remove("wx-toolbar-more");
            element.dataset.label = '…';
            this._items.push({
                type: "dropdown",
                element: element,
                align: "right"
            });
        }
    }

    /**
     * Renders the toolbar based on the current properties.
     */
    render() {
        this._element.innerHTML = "";

        const leftContainer = document.createElement("div");
        leftContainer.className = "wx-toolbar-left";

        const rightContainer = document.createElement("div");
        rightContainer.className = "wx-toolbar-right";

        this._items.forEach(item => {
            let renderedItem;

            if (item.type === "separator") {
                renderedItem = document.createElement("div");
                renderedItem.className = "wx-toolbar-separator";
            } else if (item.type === "button") {
                renderedItem = document.createElement("button");
                renderedItem.className = "btn wx-toolbar-button";
                if (item.disabled) renderedItem.classList.add("disabled");
                if (item.active) renderedItem.classList.add("active");

                renderedItem.type = "button";
                if (item.icon) {
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    renderedItem.appendChild(icon);
                }
                if (item.label) {
                    const span = document.createElement("span");
                    span.textContent = item.label;
                    renderedItem.appendChild(span);
                }

                if (item.title) {
                    renderedItem.title = item.title;
                }

                renderedItem.addEventListener("click", () => {
                    document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CLICK_EVENT, {
                        detail: {
                            sender: this._element,
                            id: this._element.id || null,
                            item: item
                        }
                    }));
                });
            } else if (item.type === "dropdown") {
                // Use DropdownCtrl for rendering dropdown buttons
                const dropdownCtrl = new webexpress.webui.DropdownCtrl(item.element);
                dropdownCtrl._buttonCss = "wx-toolbar-dropdown";
                dropdownCtrl.render();

                renderedItem = dropdownCtrl._element; // Use the rendered element
            } else if (item.type === "combobox") {
                const comboboxContainer = document.createElement("div");
                comboboxContainer.className = "wx-toolbar-combobox";
                if (item.disabled) comboboxContainer.classList.add("disabled");

                const label = document.createElement("label");
                label.textContent = item.label || "";
                comboboxContainer.appendChild(label);

                const select = document.createElement("select");
                select.className = "form-select";
                if (item.disabled) select.setAttribute("disabled", true);
                item.options.forEach(option => {
                    const opt = document.createElement("option");
                    opt.textContent = option;
                    select.appendChild(opt);
                });

                select.addEventListener("change", (event) => {
                    document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
                        detail: {
                            sender: this._element,
                            id: this._element.id || null,
                            item: item
                        }
                    }));
                });

                comboboxContainer.appendChild(select);
                renderedItem = comboboxContainer;
            } else if (item.type === "text") {
                const textItem = document.createElement("span");
                textItem.className = "wx-toolbar-text";
                textItem.textContent = item.content;
                if (item.disabled) textItem.classList.add("disabled");
                renderedItem = textItem;
            }

            if (item.align === "right") {
                rightContainer.appendChild(renderedItem);
            } else {
                leftContainer.appendChild(renderedItem);
            }
        });

        this._element.appendChild(leftContainer);
        this._element.appendChild(rightContainer);
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-toolbar", webexpress.webui.ToolbarCtrl);