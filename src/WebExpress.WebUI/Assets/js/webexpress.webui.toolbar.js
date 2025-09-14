/**
 * ToolbarCtrl is a toolbar control that dynamically generates menu items based on its child elements.
 * The toolbar supports various types of items including buttons with icons only, buttons with icons and text, buttons with text only, separators, dropdown buttons, comboboxes, and label-items.
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
                ".wx-toolbar-button, .wx-toolbar-separator, .wx-toolbar-dropdown, .wx-toolbar-combo, .wx-toolbar-label"
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
            } else if (elem.classList.contains("wx-toolbar-combo")) {
                const options = elem.querySelectorAll("option");
                items.push({
                    type: "combo",
                    label: elem.dataset.label || null,
                    colorCss: elem.getAttribute("data-color-css") || null,
                    colorStyle: elem.getAttribute("data-color-style") || null,
                    icon: elem.dataset.icon || null,
                    image: elem.dataset.image || null,
                    title: elem.dataset.title || null,
                    options: Array.from(options).map(option => ({
                        text: option.textContent,
                        value: option.value
                    })),
                    align,
                    disabled,
                    active,
                });
            } else if (elem.classList.contains("wx-toolbar-dropdown")) {
                elem.classList.remove("wx-toolbar-dropdown");
                items.push({
                    type: "dropdown",
                    colorCss: elem.getAttribute("data-color-css") || null,
                    colorStyle: elem.getAttribute("data-color-style") || null,
                    toggle: elem.getAttribute("data-toggle") === "true" || null,
                    title: elem.dataset.title || null,
                    element: elem, // pass the original element for DropdownCtrl
                    align,
                    disabled,
                    active,
                });
            } else if (elem.classList.contains("wx-toolbar-button")) {
                items.push({
                    type: "button",
                    label: elem.dataset.label || null,
                    icon: elem.dataset.icon || null,
                    image: elem.dataset.image || null,
                    title: elem.dataset.title || null,
                    colorCss: elem.getAttribute("data-color-css") || null,
                    colorStyle: elem.getAttribute("data-color-style") || null,
                    align,
                    disabled,
                    active
                });
            } else if (elem.classList.contains("wx-toolbar-label")) {
                items.push({
                    type: "label",
                    content: elem.dataset.label || "",
                    colorCss: elem.getAttribute("data-color-css") || null,
                    colorStyle: elem.getAttribute("data-color-style") || null,
                    title: elem.dataset.title || null,
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
                if (item.disabled) {
                    renderedItem.classList.add("disabled");
                }
                if (item.active) {
                    renderedItem.classList.add("active");
                }

                renderedItem.type = "button";
                if (item.image) {
                    const image = document.createElement("img");
                    image.src = item.image;
                    renderedItem.appendChild(image);
                }
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
                if (item.colorCss) {
                    renderedItem.classList.add(item.colorCss);
                }
                if (item.colorStyle) {
                    renderedItem.setAttribute("style", item.colorStyle);
                }
                if (item.title) {
                    renderedItem.title = item.title;
                }

                renderedItem.addEventListener("click", () => {
                    this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: item });
                });
            } else if (item.type === "dropdown") {
                // use DropdownCtrl for rendering dropdown buttons
                const dropdownCtrl = new webexpress.webui.DropdownCtrl(item.element);
                dropdownCtrl._buttonCss = "wx-toolbar-dropdown";
                dropdownCtrl._buttonStyle = "";
                if (item.toggle) {
                    dropdownCtrl._buttonCss += " dropdown-toggle";
                }
                if (item.disabled) {
                    dropdownCtrl._element.classList.add("disabled");
                }
                if (item.active) {
                    dropdownCtrl._buttonCss += " active";
                }
                if (item.colorCss) {
                    dropdownCtrl._buttonCss += ` ${item.colorCss}`;
                }
                if (item.colorStyle) {
                    dropdownCtrl._buttonStyle += ` ${item.colorStyle}`;
                }
                if (item.title) {
                    dropdownCtrl._element.title = item.title;
                }
                dropdownCtrl.render();

                renderedItem = dropdownCtrl._element; // use the rendered element
            } else if (item.type === "combo") {
                const comboboxContainer = document.createElement("div");
                comboboxContainer.className = "wx-toolbar-combo";
                if (item.disabled) {
                    comboboxContainer.classList.add("disabled");
                }
                if (item.title) {
                    comboboxContainer.title = item.title;
                }               
                if (item.image) {
                    const image = document.createElement("img");
                    image.src = item.image;
                    comboboxContainer.appendChild(image);

                    if (item.disabled) {
                        image.classList.add("disabled");
                    }
                    if (item.colorCss) {
                        image.classList.add(item.colorCss);
                    }
                    if (item.colorStyle) {
                        image.setAttribute("style", item.colorStyle);
                    }
                }
                if (item.icon) {
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    comboboxContainer.appendChild(icon);

                    if (item.disabled) {
                        icon.classList.add("disabled");
                    }
                    if (item.colorCss) {
                        icon.classList.add(item.colorCss);
                    }
                    if (item.colorStyle) {
                        icon.setAttribute("style", item.colorStyle);
                    }
                }
                if (item.label) {
                    const label = document.createElement("label");
                    label.textContent = item.label || "";
                    comboboxContainer.appendChild(label);
                
                    if (item.disabled) {
                        label.classList.add("disabled");
                    }
                    if (item.colorCss) {
                        label.classList.add(item.colorCss);
                    }
                    if (item.colorStyle) {
                        label.setAttribute("style", item.colorStyle);
                    }
                }

                const select = document.createElement("select");
                select.className = "form-select";
                if (item.disabled) {
                    select.setAttribute("disabled", true);
                }
                if (item.active) {
                    select.classList.add("active");
                }
                item.options.forEach(option => {
                    const opt = document.createElement("option");
                    opt.textContent = option.text;
                    opt.setAttribute("value", option.value);
                    select.appendChild(opt);
                });

                select.addEventListener("change", (event) => {
                    this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { item: item });
                });

                comboboxContainer.appendChild(select);
                renderedItem = comboboxContainer;
            } else if (item.type === "label") {
                const textItem = document.createElement("span");
                textItem.className = "wx-toolbar-label";
                textItem.textContent = item.content;
                if (item.disabled) textItem.classList.add("disabled");
                if (item.colorCss) {
                    textItem.classList.add(item.colorCss);
                }
                if (item.colorStyle) {
                    textItem.setAttribute("style", item.colorStyle);
                }
                if (item.title) {
                    textItem.title = item.title;
                }
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