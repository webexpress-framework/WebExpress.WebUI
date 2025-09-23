/**
 * ToolbarCtrl is a toolbar control that dynamically generates menu items based on its child elements.
 * The toolbar supports various types of items including buttons, dropdowns, comboboxes, labels, separators and mode buttons.
 * Items can be aligned left or right. When the available width is insufficient, items from both sides are moved into a common overflow area.
 * Separators are removed if necessary, but never placed in the overflow menu.
 * The More button is only visible if there are menu items and is rendered as a dropdown using DropdownCtrl, never moved into overflow.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.ToolbarCtrl = class extends webexpress.webui.Ctrl {
    /**
     * creates a new toolbar controller instance
     * @param {HTMLElement} element - the dom element associated with the toolbar
     */
    constructor(element) {
        super(element);

        // parse toolbar items from child elements
        this._parseItemsFromElements(
            Array.from(element.querySelectorAll(
                ".wx-toolbar-button, .wx-toolbar-separator, .wx-toolbar-dropdown, .wx-toolbar-combo, .wx-toolbar-label, .wx-toolbar-mode"
            ))
        );

        // parse the More dropdown area and keep reference
        this._parseMoreDropdown(element.querySelector(".wx-toolbar-more"));

        // clean up the dom element
        element.innerHTML = "";
        element.classList.add("wx-toolbar");

        // initial rendering of the toolbar
        this.render();

        // initialize joint overflow handling for both sides
        this._initJointOverflow();
    }

    /**
     * parses child elements of the toolbar container and extracts item data
     * @param {HTMLElement[]} elements - elements to parse
     */
    _parseItemsFromElements(elements) {
        const items = [];
        elements.forEach(elem => {
            const align = elem.dataset.align || "left";
            const disabled = elem.hasAttribute("disabled");
            const active = elem.hasAttribute("active");
            // separators are never placed into overflow
            if (elem.classList.contains("wx-toolbar-separator")) {
                items.push({ type: "separator", align, overflow: "never" });
            } else if (elem.classList.contains("wx-toolbar-mode")) {
                items.push({
                    type: "mode",
                    label: elem.dataset.label || null,
                    icon: elem.dataset.icon || null,
                    image: elem.dataset.image || null,
                    title: elem.dataset.title || null,
                    colorCss: elem.getAttribute("data-color-css") || null,
                    colorStyle: elem.getAttribute("data-color-style") || null,
                    align,
                    disabled,
                    active,
                    overflow: "never"
                });
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
                    overflow: elem.dataset.overflow || ""
                });
            } else if (elem.classList.contains("wx-toolbar-dropdown")) {
                elem.classList.remove("wx-toolbar-dropdown");
                items.push({
                    type: "dropdown",
                    colorCss: elem.getAttribute("data-color-css") || null,
                    colorStyle: elem.getAttribute("data-color-style") || null,
                    toggle: elem.getAttribute("data-toggle") === "true" || null,
                    title: elem.dataset.title || null,
                    element: elem,
                    align,
                    disabled,
                    active,
                    overflow: elem.dataset.overflow || ""
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
                    active,
                    overflow: elem.dataset.overflow || ""
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
                    overflow: elem.dataset.overflow || ""
                });
            }
        });
        this._items = items;
    }

    /**
     * parses the More area as a dropdown and keeps the reference
     * @param {HTMLElement} element - element to parse
     */
    _parseMoreDropdown(element) {
        if (element) {
            // keep reference to the more dropdown DOM node
            this._moreDropdownElement = element;
        } else {
            // fallback: create empty dropdown if not present
            this._moreDropdownElement = document.createElement("div");
            this._moreDropdownElement.className = "wx-toolbar-more";
        }
    }

    /**
     * checks if the More dropdown contains items
     * @returns {boolean} true if there are elements in the More dropdown, false otherwise
     */
    _hasMoreDropdownItems() {
        if (this._moreDropdownElement && this._moreDropdownElement.children.length > 0) {
            for (let i = 0; i < this._moreDropdownElement.children.length; i++) {
                const child = this._moreDropdownElement.children[i];
                if (!child.classList.contains("wx-dropdown-header")) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * initializes a joint overflow handling for left and right toolbar containers
     * both sides share the same overflow menu (shown at the end of the toolbar)
     */
    _initJointOverflow() {
        const toolbarContainer = this._element;
        const leftContainer = toolbarContainer.querySelector('.wx-toolbar-left');
        const rightContainer = toolbarContainer.querySelector('.wx-toolbar-right');

        // collect all items from both sides except the More dropdown
        const allItems = [];
        if (leftContainer) {
            Array.from(leftContainer.children).forEach(item => {
                if (!item.classList.contains("wx-toolbar-more")) {
                    allItems.push(item);
                }
            });
        }
        if (rightContainer) {
            Array.from(rightContainer.children).forEach(item => {
                if (!item.classList.contains("wx-toolbar-more")) {
                    allItems.push(item);
                }
            });
        }

        // remove wx-toolbar-text elements from overflow items
        const filteredItems = [];
        for (let i = 0; i < allItems.length; i++) {
            if (!allItems[i].classList.contains("wx-toolbar-text")) {
                filteredItems.push(allItems[i]);
            }
        }

        // create joint overflow container
        const overflowRoot = document.createElement("div");
        overflowRoot.className = "wx-overflow wx-toolbar-overflow wx-toolbar-overflow-joint";
        overflowRoot.style.width = "100%";
        overflowRoot.dataset.overflowCutoff = "false";

        // add all items to overflow container, convert buttons to links in overflow
        for (let i = 0; i < filteredItems.length; i++) {
            const item = filteredItems[i];
            if (item.classList.contains("wx-toolbar-button") && item.tagName.toLowerCase() === "button") {
                const link = document.createElement("a");
                link.className = "wx-link wx-toolbar-button";
                link.href = "#";
                link.innerHTML = item.innerHTML;
                if (item.title) {
                    link.title = item.title;
                }
                if (item.classList.contains("disabled")) {
                    link.classList.add("disabled");
                    link.setAttribute("aria-disabled", "true");
                    link.setAttribute("tabindex", "-1");
                }
                link.setAttribute("style", item.getAttribute("style") || "");
                // handle click event for overflow links
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    if (!link.classList.contains("disabled")) {
                        this._dispatch(webexpress.webui.Event.CLICK_EVENT, { element: link });
                    }
                });
                overflowRoot.appendChild(link);
            } else {
                overflowRoot.appendChild(item);
            }
        }

        // remove old containers and add the overflow root
        if (leftContainer) {
            toolbarContainer.removeChild(leftContainer);
        }
        if (rightContainer) {
            toolbarContainer.removeChild(rightContainer);
        }
        toolbarContainer.appendChild(overflowRoot);

        // create overflow controller (does not handle more dropdown)
        this._overflowCtrl = new webexpress.webui.OverflowCtrl(overflowRoot);

        // event delegation for overflow menu items
        overflowRoot.addEventListener("click", (e) => {
            const item = e.target.closest(".wx-toolbar-button, .wx-toolbar-combo, .wx-toolbar-dropdown");
            if (item) {
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { element: item });
            }
        });

        // only append the more dropdown if there are items
        if (this._hasMoreDropdownItems()) {
            toolbarContainer.appendChild(this._createMoreDropdownWithController());
        }
    }

    /**
     * creates the More dropdown using DropdownCtrl with ... icon and all contained items as entries
     * @returns {HTMLElement} dropdown root element
     */
    _createMoreDropdownWithController() {
        // collect dropdown items from original moreDropdownElement
        const items = [];
        Array.from(this._moreDropdownElement.children).forEach(child => {
            if (child.classList.contains("wx-dropdown-header")) {
                items.push({
                    type: "header",
                    content: child.textContent,
                    icon: child.dataset.icon || null
                });
            } else if (child.classList.contains("wx-dropdown-divider")) {
                items.push({ type: "divider" });
            } else if (child.classList.contains("wx-dropdown-item")) {
                items.push({
                    id: child.id || null,
                    uri: child.dataset.uri || "javascript:void(0);",
                    image: child.dataset.image || null,
                    icon: child.dataset.icon || null,
                    content: child.textContent || null,
                    color: child.dataset.color || null,
                    disabled: child.hasAttribute("disabled")
                });
            }
        });

        // create a container for the dropdown
        const dropdownContainer = document.createElement("div");
        // create DropdownCtrl and assign menu items and properties
        const dropdownCtrl = new webexpress.webui.DropdownCtrl(dropdownContainer);
        dropdownCtrl.label = null;
        dropdownCtrl.icon = "fas fa-ellipsis-h";
        dropdownCtrl.menuCSS = "wx-toolbar-more-menu";
        dropdownCtrl.buttonCss = "wx-toolbar-more-dropdown btn";
        dropdownCtrl.items = items;

        // handle click events (forward from dropdownCtrl to toolbar)
        dropdownContainer.addEventListener(webexpress.webui.Event.CLICK_EVENT, (e) => {
            this._dispatch(webexpress.webui.Event.CLICK_EVENT, { element: e.detail.item });
        });

        return dropdownContainer;
    }

    /**
     * removes visible separators if elements to their left are hidden
     * @param {HTMLElement} container - toolbar container to process
     */
    _removeUnneededSeparators(container) {
        let lastVisible = null;
        const children = Array.from(container.children);
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.classList.contains("wx-toolbar-separator")) {
                if (!lastVisible || lastVisible.style.display === "none" || lastVisible.hasAttribute("hidden")) {
                    container.removeChild(child);
                }
            } else {
                lastVisible = child;
            }
        }
    }

    /**
     * renders the toolbar based on the current properties
     */
    render() {
        this._element.innerHTML = "";

        const leftContainer = document.createElement("div");
        leftContainer.className = "wx-toolbar-left";

        const rightContainer = document.createElement("div");
        rightContainer.className = "wx-toolbar-right";

        let lastVisibleLeft = null;
        let lastVisibleRight = null;

        for (let i = 0; i < this._items.length; i++) {
            const item = this._items[i];
            let renderedItem = null;
            let overflowAttr = item.overflow || "";

            if (item.type === "separator") {
                renderedItem = document.createElement("div");
                renderedItem.className = "wx-toolbar-separator";
                renderedItem.dataset.overflow = "never";
            } else if (item.type === "mode") {
                renderedItem = document.createElement("button");
                renderedItem.className = "btn wx-toolbar-mode";
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
                renderedItem.dataset.overflow = "never";
                renderedItem.addEventListener("click", () => {
                    this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: item });
                });
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
                renderedItem.dataset.overflow = overflowAttr;
                renderedItem.addEventListener("click", () => {
                    this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: item });
                });
            } else if (item.type === "dropdown") {
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
                dropdownCtrl._element.dataset.overflow = overflowAttr;
                dropdownCtrl.render();
                renderedItem = dropdownCtrl._element;
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
                comboboxContainer.dataset.overflow = overflowAttr;
                renderedItem = comboboxContainer;
            } else if (item.type === "label") {
                const textItem = document.createElement("span");
                textItem.className = "wx-toolbar-label";
                textItem.textContent = item.content;
                if (item.disabled) {
                    textItem.classList.add("disabled");
                }
                if (item.colorCss) {
                    textItem.classList.add(item.colorCss);
                }
                if (item.colorStyle) {
                    textItem.setAttribute("style", item.colorStyle);
                }
                if (item.title) {
                    textItem.title = item.title;
                }
                textItem.dataset.overflow = overflowAttr;
                renderedItem = textItem;
            }

            if (item.align === "right") {
                if (item.type !== "separator") {
                    lastVisibleRight = renderedItem;
                }
                rightContainer.appendChild(renderedItem);
            } else {
                if (item.type !== "separator") {
                    lastVisibleLeft = renderedItem;
                }
                leftContainer.appendChild(renderedItem);
            }
        }

        this._removeUnneededSeparators(leftContainer);
        this._removeUnneededSeparators(rightContainer);

        this._element.appendChild(leftContainer);
        this._element.appendChild(rightContainer);
        // more dropdown is rendered outside in _initJointOverflow
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-toolbar", webexpress.webui.ToolbarCtrl);