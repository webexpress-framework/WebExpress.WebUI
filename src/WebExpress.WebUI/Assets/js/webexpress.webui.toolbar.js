/**
 * Controller for rendering and managing a responsive toolbar with overflow logic.
 * The toolbar supports different child types (buttons, separators, dropdowns, combos, labels, more menu).
 * overflow handling is delegated to OverflowCtrl, which can be explicitly controlled to ensure labels are hidden before items are moved to overflow
 */
webexpress.webui.ToolbarCtrl = class extends webexpress.webui.Ctrl {
    /**
     * creates a new toolbar controller instance
     * @param {HTMLElement} element - toolbar container element
     */
    constructor(element) {
        super(element);
        // parse toolbar items from DOM
        this._parseItems(Array.from(element.querySelectorAll(
            ".wx-toolbar-button, .wx-toolbar-separator, .wx-toolbar-dropdown, .wx-toolbar-combo, .wx-toolbar-label"
        )));
        // parse More dropdown if available
        this._parseMoreDropdown(element.querySelector(".wx-toolbar-more"));
        // prepare toolbar DOM
        element.innerHTML = "";
        element.classList.add("wx-toolbar");
        // render toolbar
        this._renderToolbar();
        // always update layout after rendering
        this._updateToolbarLayout();
        // use ResizeObserver for responsive label hiding and overflow logic
        this._resizeObserver = new ResizeObserver(() => {
            this._updateToolbarLayout();
        });
        this._resizeObserver.observe(element);
    }

    /**
     * parses toolbar child elements and stores as item descriptors
     * @param {HTMLElement[]} elements - items to parse
     */
    _parseItems(elements) {
        this._items = elements.map((el) => {
            const align = el.dataset.align || "left";
            const disabled = el.hasAttribute("disabled");
            const active = el.hasAttribute("active");
            if (el.classList.contains("wx-toolbar-separator")) {
                el.setAttribute("data-overflow", "hide");
                return {
                    type: "separator",
                    align: align,
                    overflow: "hide",
                    el: el
                };
            } else if (el.classList.contains("wx-toolbar-combo")) {
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
                    align: align,
                    disabled: disabled,
                    active: active,
                    overflow: el.dataset.overflow || "",
                    element: el
                };
            } else if (el.classList.contains("wx-toolbar-dropdown")) {
                return {
                    type: "dropdown",
                    colorCss: el.getAttribute("data-color-css") || null,
                    colorStyle: el.getAttribute("data-color-style") || null,
                    toggle: el.getAttribute("data-toggle") === "true" || null,
                    title: el.dataset.title || null,
                    align: align,
                    disabled: disabled,
                    active: active,
                    overflow: el.dataset.overflow || "",
                    element: el
                };
            } else if (el.classList.contains("wx-toolbar-button")) {
                return {
                    type: "button",
                    id: el.id,
                    label: el.dataset.label || null,
                    icon: el.dataset.icon || null,
                    image: el.dataset.image || null,
                    title: el.dataset.title || null,
                    colorCss: el.getAttribute("data-color-css") || null,
                    colorStyle: el.getAttribute("data-color-style") || null,
                    align: align,
                    disabled: disabled,
                    active: active,
                    overflow: el.dataset.overflow || "",
                    element: el
                };
            } else if (el.classList.contains("wx-toolbar-label")) {
                el.setAttribute("data-overflow", "hide");
                return {
                    type: "label",
                    content: el.dataset.label || "",
                    colorCss: el.getAttribute("data-color-css") || null,
                    colorStyle: el.getAttribute("data-color-style") || null,
                    title: el.dataset.title || null,
                    align: align,
                    disabled: disabled,
                    overflow: "hide",
                    element: el
                };
            }
        });
    }

    /**
     * parses the More area as a dropdown menu
     * @param {HTMLElement} element - element to parse
     */
    _parseMoreDropdown(element) {
        this._moreRaw = element;
        if (element && element.classList.contains("wx-toolbar-more")) {
            const instance = webexpress.webui.Controller.getInstanceByElement(element);
            if (instance) {
                this._more = element;
                instance.icon = "fas fa-ellipsis-h";
                instance.menuCSS = "wx-toolbar-more-menu";
            } else {
                this._more = this._createMoreDropdownWithController();
            }
        } else {
            this._more = null;
        }
    }

    /**
     * checks if More dropdown contains usable entries
     * @returns {boolean}
     */
    _hasMoreDropdownItems() {
        if (this._more && this._more.children.length > 0) {
            for (let i = 0; i < this._more.children.length; i++) {
                const child = this._more.children[i];
                if (!child.classList.contains("wx-dropdown-header") &&
                    !child.classList.contains("wx-dropdown-separator")) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * renders toolbar in flex layout
     */
    _renderToolbar() {
        const container = this._element;
        container.innerHTML = "";

        // create spring
        const spring = document.createElement("div");
        spring.style.flex = "1 1 auto";
        spring.style.pointerEvents = "none";
        spring.dataset.overflow = "hide";

        // create flex root
        const overflowRoot = document.createElement("div");
        overflowRoot.className = "wx-overflow";
        overflowRoot.style.width = "100%";
        overflowRoot.dataset.overflowCutoff = "false";

        for (const item of this._items) {
            if (item.align !== "right") {
                overflowRoot.appendChild(this._renderItem(item));
            }
        }
        overflowRoot.appendChild(spring);
        for (const item of this._items) {
            if (item.align === "right") {
                overflowRoot.appendChild(this._renderItem(item));
            }
        }

        container.appendChild(overflowRoot);

        this._overflowCtrl = new webexpress.webui.OverflowCtrl(overflowRoot);
        this._overflowCtrl.setAutoDistribute(false);

        overflowRoot.addEventListener("click", (e) => {
            const item = e.target.closest(".wx-toolbar-button, .wx-toolbar-combo, .wx-toolbar-dropdown");
            if (item) {
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { element: item });
            }
        });

        if (this._hasMoreDropdownItems()) {
            container.appendChild(this._more);
        }
    }

    /**
     * updates toolbar layout on resize and initial render
     * hides button labels if needed, triggers overflow only if labels hiding is not enough
     */
    _updateToolbarLayout() {
        const container = this._element;
        const overflowRoot = container.querySelector(".wx-overflow");
        if (!overflowRoot) {
            return;
        }
        // show all labels first
        const buttons = overflowRoot.querySelectorAll(".wx-toolbar-button span");
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].style.display = "";
        }
        let labelHidden = false;
        // check for overflow with labels
        if (overflowRoot.scrollWidth > overflowRoot.clientWidth) {
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].style.display = "none";
            }
            labelHidden = true;
        }
        // check again for overflow after hiding labels
        if (overflowRoot.scrollWidth > overflowRoot.clientWidth) {
            if (this._overflowCtrl && typeof this._overflowCtrl.handleOverflow === "function") {
                this._overflowCtrl.handleOverflow();
            }
        } else {
            if (this._overflowCtrl && typeof this._overflowCtrl.restore === "function") {
                this._overflowCtrl.restore();
            }
            if (!labelHidden) {
                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].style.display = "";
                }
            }
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
        if (item.type === "button") {
            const instance = webexpress.webui.Controller.getInstanceByElement(item.element);
            if (instance) {
                return item.element;
            }
            item.element.classList.add("btn");
            item.element.type = "button";
            if (item.image) {
                const img = document.createElement("img");
                img.className = "wx-icon";
                img.src = item.image;
                item.element.appendChild(img);
            }
            if (item.icon) {
                const icon = document.createElement("i");
                icon.className = item.icon;
                item.element.appendChild(icon);
            }
            if (item.label) {
                const span = document.createElement("span");
                span.textContent = item.label;
                item.element.appendChild(span);
            }
            if (item.colorCss) { item.element.classList.add(item.colorCss); }
            if (item.colorStyle) { item.element.setAttribute("style", item.colorStyle); }
            if (item.title) { item.element.title = item.title; }
            item.element.addEventListener("click", () => {
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: item });
            });
            return item.element;
        }
        if (item.type === "dropdown") {
            const instance = webexpress.webui.Controller.getInstanceByElement(item.element);
            if (instance) {
                return item.element;
            }
            const dropdownCtrl = new webexpress.webui.DropdownCtrl(item.element);
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
                img.className = "wx-icon";
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
            item.options.forEach(function (opt) {
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
        if (this._moreRaw) {
            Array.from(this._moreRaw.children).forEach(function (child) {
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
        }
        const dropdownContainer = document.createElement("div");
        dropdownContainer.className = "wx-toolbar-more";
        const dropdownCtrl = new webexpress.webui.DropdownCtrl(dropdownContainer);
        dropdownCtrl.label = null;
        dropdownCtrl.icon = "fas fa-ellipsis-h";
        dropdownCtrl.menuCSS = "wx-toolbar-more-menu";
        dropdownCtrl.buttonCss = "btn";
        dropdownCtrl.items = items;

        dropdownContainer.addEventListener(webexpress.webui.Event.CLICK_EVENT, (e) => {
            this._dispatch(webexpress.webui.Event.CLICK_EVENT, { element: e.detail.item });
        });

        return dropdownContainer;
    }

    /**
     * cleans up resources
     */
    destroy() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
    }
};

// controller registration
webexpress.webui.Controller.registerClass("wx-webui-toolbar", webexpress.webui.ToolbarCtrl);