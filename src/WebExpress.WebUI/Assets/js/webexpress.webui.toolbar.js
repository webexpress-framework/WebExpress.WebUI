/**
 * ToolbarCtrl dynamically generates and manages a responsive toolbar with overflow and alignment support.
 * All child items are parsed, sorted by alignment, and rendered in the order: left-aligned items, spring (data-overflow="never"), right-aligned items.
 * Overflow handling leverages OverflowCtrl, ensuring the More menu stays at the right edge.
 */
webexpress.webui.ToolbarCtrl = class extends webexpress.webui.Ctrl {
    /**
     * creates a new toolbar controller instance
     * @param {HTMLElement} element - the dom element associated with the toolbar
     */
    constructor(element) {
        super(element);
        // parse items from DOM
        this._parseItems(Array.from(element.querySelectorAll(
            ".wx-toolbar-button, .wx-toolbar-separator, .wx-toolbar-dropdown, .wx-toolbar-combo, .wx-toolbar-label, .wx-toolbar-mode"
        )));
        // parse More dropdown
        this._parseMoreDropdown(element.querySelector(".wx-toolbar-more"));
        // prepare toolbar DOM
        element.innerHTML = "";
        element.classList.add("wx-toolbar");
        // render
        this._renderOverflow();
    }

    /**
     * parses toolbar child elements and stores as item descriptors
     * @param {HTMLElement[]} elements - elements to parse
     */
    _parseItems(elements) {
        this._items = elements.map((el) => {
            const align = el.dataset.align || "left";
            const disabled = el.hasAttribute("disabled");
            const active = el.hasAttribute("active");
            if (el.classList.contains("wx-toolbar-separator")) {
                // always set overflow=hide for separators in the DOM
                el.setAttribute("data-overflow", "hide");
                return {
                    type: "separator",
                    align,
                    overflow: "hide",
                    el
                };
            }
            if (el.classList.contains("wx-toolbar-mode")) {
                return {
                    type: "mode",
                    label: el.dataset.label || null,
                    icon: el.dataset.icon || null,
                    image: el.dataset.image || null,
                    title: el.dataset.title || null,
                    colorCss: el.getAttribute("data-color-css") || null,
                    colorStyle: el.getAttribute("data-color-style") || null,
                    align,
                    disabled,
                    active,
                    overflow: "never",
                    el
                };
            }
            if (el.classList.contains("wx-toolbar-combo")) {
                return {
                    type: "combo",
                    label: el.dataset.label || null,
                    colorCss: el.getAttribute("data-color-css") || null,
                    colorStyle: el.getAttribute("data-color-style") || null,
                    icon: el.dataset.icon || null,
                    image: el.dataset.image || null,
                    title: el.dataset.title || null,
                    options: Array.from(el.querySelectorAll("option")).map(function (opt) {
                        return { text: opt.textContent, value: opt.value };
                    }),
                    align,
                    disabled,
                    active,
                    overflow: el.dataset.overflow || "",
                    el
                };
            }
            if (el.classList.contains("wx-toolbar-dropdown")) {
                el.classList.remove("wx-toolbar-dropdown");
                return {
                    type: "dropdown",
                    colorCss: el.getAttribute("data-color-css") || null,
                    colorStyle: el.getAttribute("data-color-style") || null,
                    toggle: el.getAttribute("data-toggle") === "true" || null,
                    title: el.dataset.title || null,
                    align,
                    disabled,
                    active,
                    overflow: el.dataset.overflow || "",
                    el
                };
            }
            if (el.classList.contains("wx-toolbar-button")) {
                return {
                    type: "button",
                    label: el.dataset.label || null,
                    icon: el.dataset.icon || null,
                    image: el.dataset.image || null,
                    title: el.dataset.title || null,
                    colorCss: el.getAttribute("data-color-css") || null,
                    colorStyle: el.getAttribute("data-color-style") || null,
                    align,
                    disabled,
                    active,
                    overflow: el.dataset.overflow || "",
                    el
                };
            }
            if (el.classList.contains("wx-toolbar-label")) {
                // always set overflow=hide for labels in the DOM
                el.setAttribute("data-overflow", "hide");
                return {
                    type: "label",
                    content: el.dataset.label || "",
                    colorCss: el.getAttribute("data-color-css") || null,
                    colorStyle: el.getAttribute("data-color-style") || null,
                    title: el.dataset.title || null,
                    align,
                    disabled,
                    overflow: "hide",
                    el
                };
            }
        });
    }

    /**
     * parses the More area as a dropdown and keeps a reference
     * @param {HTMLElement} element - element to parse
     */
    _parseMoreDropdown(element) {
        if (element) {
            this._moreDropdownElement = element;
        } else {
            this._moreDropdownElement = document.createElement("div");
            this._moreDropdownElement.className = "wx-toolbar-more";
        }
    }

    /**
     * returns true if More dropdown contains usable entries
     * @returns {boolean}
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
     * renders the toolbar as a flex overflow layout (left, spring, right)
     */
    _renderOverflow() {
        const container = this._element;
        container.innerHTML = "";

        // create spring
        const spring = document.createElement("div");
        spring.style.flex = "1 1 auto";
        spring.style.pointerEvents = "none";
        spring.dataset.overflow = "hide";

        // order: left, spring, right
        const overflowRoot = document.createElement("div");
        overflowRoot.className = "wx-overflow";
        overflowRoot.style.width = "100%";
        overflowRoot.dataset.overflowCutoff = "false";

        // add left-aligned
        for (const item of this._items) {
            if (item.align !== "right") {
                overflowRoot.appendChild(this._renderItem(item));
            }
        }
        // add spring
        overflowRoot.appendChild(spring);
        // add right-aligned
        for (const item of this._items) {
            if (item.align === "right") {
                overflowRoot.appendChild(this._renderItem(item));
            }
        }

        container.appendChild(overflowRoot);

        // overflow handling
        this._overflowCtrl = new webexpress.webui.OverflowCtrl(overflowRoot);

        // event delegation for overflow menu items
        overflowRoot.addEventListener("click", (e) => {
            const item = e.target.closest(".wx-toolbar-button, .wx-toolbar-combo, .wx-toolbar-dropdown");
            if (item) {
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { element: item });
            }
        });

        // More dropdown if needed
        if (this._hasMoreDropdownItems()) {
            container.appendChild(this._createMoreDropdownWithController());
        }
    }

    /**
     * renders a single toolbar item as DOM node
     * @param {object} item
     * @returns {HTMLElement}
     */
    _renderItem(item) {
        if (item.type === "separator") {
            const el = document.createElement("div");
            el.className = "wx-toolbar-separator";
            el.dataset.overflow = "hide";
            return el;
        }
        if (item.type === "mode") {
            const el = document.createElement("button");
            el.className = "btn wx-toolbar-mode";
            if (item.disabled) { el.classList.add("disabled"); }
            if (item.active) { el.classList.add("active"); }
            el.type = "button";
            if (item.image) {
                const img = document.createElement("img");
                img.src = item.image;
                el.appendChild(img);
            }
            if (item.icon) {
                const icon = document.createElement("i");
                icon.className = item.icon;
                el.appendChild(icon);
            }
            if (item.label) {
                const span = document.createElement("span");
                span.textContent = item.label;
                el.appendChild(span);
            }
            if (item.colorCss) { el.classList.add(item.colorCss); }
            if (item.colorStyle) { el.setAttribute("style", item.colorStyle); }
            if (item.title) { el.title = item.title; }
            el.dataset.overflow = "never";
            el.addEventListener("click", () => {
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: item });
            });
            return el;
        }
        if (item.type === "button") {
            const el = document.createElement("button");
            el.className = "btn wx-toolbar-button";
            if (item.disabled) { el.classList.add("disabled"); }
            if (item.active) { el.classList.add("active"); }
            el.type = "button";
            if (item.image) {
                const img = document.createElement("img");
                img.src = item.image;
                el.appendChild(img);
            }
            if (item.icon) {
                const icon = document.createElement("i");
                icon.className = item.icon;
                el.appendChild(icon);
            }
            if (item.label) {
                const span = document.createElement("span");
                span.textContent = item.label;
                el.appendChild(span);
            }
            if (item.colorCss) { el.classList.add(item.colorCss); }
            if (item.colorStyle) { el.setAttribute("style", item.colorStyle); }
            if (item.title) { el.title = item.title; }
            el.addEventListener("click", () => {
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: item });
            });
            return el;
        }
        if (item.type === "dropdown") {
            const dropdownCtrl = new webexpress.webui.DropdownCtrl(item.el);
            dropdownCtrl._buttonCss = "wx-toolbar-dropdown";
            dropdownCtrl._buttonStyle = "";
            if (item.toggle) { dropdownCtrl._buttonCss += " dropdown-toggle"; }
            if (item.disabled) { dropdownCtrl._element.classList.add("disabled"); }
            if (item.active) { dropdownCtrl._buttonCss += " active"; }
            if (item.colorCss) { dropdownCtrl._buttonCss += ` ${item.colorCss}`; }
            if (item.colorStyle) { dropdownCtrl._buttonStyle += ` ${item.colorStyle}`; }
            if (item.title) { dropdownCtrl._element.title = item.title; }
            dropdownCtrl.render();
            return dropdownCtrl._element;
        }
        if (item.type === "combo") {
            const combo = document.createElement("div");
            combo.className = "wx-toolbar-combo";
            if (item.disabled) { combo.classList.add("disabled"); }
            if (item.title) { combo.title = item.title; }
            if (item.image) {
                const img = document.createElement("img");
                img.src = item.image;
                combo.appendChild(img);
                if (item.disabled) { img.classList.add("disabled"); }
                if (item.colorCss) { img.classList.add(item.colorCss); }
                if (item.colorStyle) { img.setAttribute("style", item.colorStyle); }
            }
            if (item.icon) {
                const icon = document.createElement("i");
                icon.className = item.icon;
                combo.appendChild(icon);
                if (item.disabled) { icon.classList.add("disabled"); }
                if (item.colorCss) { icon.classList.add(item.colorCss); }
                if (item.colorStyle) { icon.setAttribute("style", item.colorStyle); }
            }
            if (item.label) {
                const label = document.createElement("label");
                label.textContent = item.label || "";
                combo.appendChild(label);
                if (item.disabled) { label.classList.add("disabled"); }
                if (item.colorCss) { label.classList.add(item.colorCss); }
                if (item.colorStyle) { label.setAttribute("style", item.colorStyle); }
            }
            const select = document.createElement("select");
            select.className = "form-select";
            if (item.disabled) { select.setAttribute("disabled", true); }
            if (item.active) { select.classList.add("active"); }
            item.options.forEach(opt => {
                const o = document.createElement("option");
                o.textContent = opt.text;
                o.setAttribute("value", opt.value);
                select.appendChild(o);
            });
            select.addEventListener("change", (event) => {
                this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { item: item });
            });
            combo.appendChild(select);
            return combo;
        }
        if (item.type === "label") {
            const el = document.createElement("span");
            el.className = "wx-toolbar-label";
            el.textContent = item.content;
            if (item.disabled) { el.classList.add("disabled"); }
            if (item.colorCss) { el.classList.add(item.colorCss); }
            if (item.colorStyle) { el.setAttribute("style", item.colorStyle); }
            if (item.title) { el.title = item.title; }
            el.dataset.overflow = "hide";
            return el;
        }
        return null;
    }

    /**
     * creates the More dropdown using DropdownCtrl with ... icon and all contained items as entries
     * @returns {HTMLElement} dropdown root element
     */
    _createMoreDropdownWithController() {
        const items = [];
        Array.from(this._moreDropdownElement.children).forEach((child) => {
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

        const dropdownContainer = document.createElement("div");
        const dropdownCtrl = new webexpress.webui.DropdownCtrl(dropdownContainer);
        dropdownCtrl.label = null;
        dropdownCtrl.icon = "fas fa-ellipsis-h";
        dropdownCtrl.menuCSS = "wx-toolbar-more-menu";
        dropdownCtrl.buttonCss = "wx-toolbar-more-dropdown btn";
        dropdownCtrl.items = items;

        dropdownContainer.addEventListener(webexpress.webui.Event.CLICK_EVENT, (e) => {
            this._dispatch(webexpress.webui.Event.CLICK_EVENT, { element: e.detail.item });
        });

        return dropdownContainer;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-toolbar", webexpress.webui.ToolbarCtrl);