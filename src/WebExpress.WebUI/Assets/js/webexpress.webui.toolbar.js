/**
 * Controller for rendering and managing a responsive toolbar with overflow logic.
 * The toolbar supports different child types (buttons, separators, dropdowns, combos, labels, custom items, modal triggers, more menu).
 * Overflow handling is delegated to OverflowCtrl.
 */
webexpress.webui.ToolbarCtrl = class extends webexpress.webui.Ctrl {
    _resizeObserver = null;
    _overflowCtrl = null;
    _items = [];
    _moreRaw = null;
    _more = null;
    _layoutFrame = null;
    _modalInstances = {}; // cache for modal instances

    /**
     * Creates a new toolbar controller instance.
     * @param {HTMLElement} element - The toolbar container element.
     */
    constructor(element) {
        super(element);
        
        // parse toolbar items from dom
        this._parseItems(Array.from(element.querySelectorAll(
            ".wx-toolbar-button, .wx-toolbar-separator, .wx-toolbar-dropdown, .wx-toolbar-combo, .wx-toolbar-label, .wx-toolbar-custom, .wx-toolbar-modal-btn"
        )));
        
        // parse more dropdown if available
        this._parseMoreDropdown(element.querySelector(".wx-toolbar-more"));
        
        // prepare toolbar dom
        element.innerHTML = "";
        element.classList.add("wx-toolbar");
        element.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });
        
        // render toolbar
        this._renderToolbar();
        
        // always update layout after rendering
        this._scheduleLayoutUpdate();
        
        // use resizeobserver for responsive label hiding and overflow logic
        this._resizeObserver = new ResizeObserver(() => {
            this._scheduleLayoutUpdate();
        });
        this._resizeObserver.observe(element);
    }
    
    /**
     * Adds a generic item descriptor to the toolbar and re-renders.
     * @param {object} item - The item descriptor (see _parseItems for structure).
     */
    addItem(item) {
        if (!item || !item.type) {
            console.error("ToolbarCtrl.addItem: Invalid item descriptor", item);
            return;
        }
        
        // ensure element is created if not provided (for programmatic addition)
        if (!item.element) {
            item.element = this._createItemElement(item);
        }

        this._items.push(item);
        this._renderToolbar();
        this._scheduleLayoutUpdate();
    }

    /**
     * Add a button programmatically.
     * @param {object} opts - { id, label, icon, image, title, align, disabled, active, colorCss, modal }
     */
    addButton(opts) {
        this.addItem({
            type: "button",
            id: opts.id || null,
            label: opts.label || null,
            icon: opts.icon || null,
            image: opts.image || null,
            title: opts.title || null,
            modal: opts.modal || null,
            colorCss: opts.colorCss || null,
            colorStyle: opts.colorStyle || null,
            align: opts.align || "left",
            disabled: !!opts.disabled,
            active: !!opts.active,
            overflow: opts.overflow || ""
        });
    }

    /**
     * Adds a custom item (generic wrapper) programmatically.
     * @param {object} opts - { element, align, overflow }
     */
    addCustom(opts) {
        let el = opts.element;
        if (!el) {
            console.error("ToolbarCtrl.addCustom: 'element' is required");
            return;
        }
        // ensure wrapper class for styling
        if (!el.classList.contains("wx-toolbar-custom")) {
            const wrapper = document.createElement("div");
            wrapper.className = "wx-toolbar-custom";
            wrapper.appendChild(el);
            el = wrapper;
        }
        
        this.addItem({
            type: "custom",
            align: opts.align || "left",
            overflow: opts.overflow || "",
            element: el
        });
    }

    /**
     * Adds a modal trigger button programmatically.
     * @param {object} opts - { id, label, icon, modalKey, modalTitle, align, disabled, colorCss }
     */
    addModalButton(opts) {
        this.addItem({
            type: "modal-button",
            id: opts.id || null,
            label: opts.label || null,
            icon: opts.icon || null,
            modalKey: opts.modalKey,
            modalTitle: opts.modalTitle || "Dialog",
            modalSubmitId: opts.modalSubmitId,
            colorCss: opts.colorCss || null,
            align: opts.align || "left",
            disabled: !!opts.disabled,
            overflow: opts.overflow || ""
        });
    }

    /**
     * Add a separator programmatically.
     * @param {string} [align="left"] - Alignment of the separator.
     */
    addSeparator(align = "left") {
        this.addItem({
            type: "separator",
            align: align,
            overflow: "hide"
        });
    }

    /**
     * Add a label programmatically.
     * @param {object} opts - { content, title, align, colorCss } 
     */
    addLabel(opts) {
        this.addItem({
            type: "label",
            content: opts.content || "",
            title: opts.title || null,
            colorCss: opts.colorCss || null,
            align: opts.align || "left",
            disabled: !!opts.disabled,
            overflow: "hide"
        });
    }

    /**
     * Add a dropdown programmatically.
     * @param {object} opts - { title, toggle, align, colorCss, element } 
     */
    addDropdown(opts) {
        let el = opts.element;
        if (!el) {
            el = document.createElement("div");
            el.className = "wx-toolbar-dropdown";
        }
        
        this.addItem({
            type: "dropdown",
            colorCss: opts.colorCss || null,
            colorStyle: opts.colorStyle || null,
            toggle: !!opts.toggle,
            title: opts.title || null,
            align: opts.align || "left",
            disabled: !!opts.disabled,
            active: !!opts.active,
            overflow: opts.overflow || "",
            element: el
        });
    }

    /**
     * Removes an item by its ID.
     * @param {string} id - The ID of the item to remove.
     */
    removeItem(id) {
        const idx = this._items.findIndex((item) => {
            return item.id === id || (item.element && item.element.id === id);
        });
        if (idx > -1) {
            this._items.splice(idx, 1);
            this._renderToolbar();
            this._scheduleLayoutUpdate();
        }
    }
    
    /**
     * Creates the DOM element for an item descriptor if it doesn't exist yet.
     * Used when adding items programmatically via add* methods.
     * @param {object} item - The item descriptor.
     * @returns {HTMLElement} The created DOM element.
     */
    _createItemElement(item) {
        if (item.type === "separator") {
            const el = document.createElement("div");
            el.className = "wx-toolbar-separator";
            return el;
        } else if (item.type === "label") {
            const el = document.createElement("span");
            el.className = "wx-toolbar-label";
            if (item.content) {
                el.dataset.label = item.content;
            }
            return el;
        } else if (item.type === "button") {
            const el = document.createElement("button");
            el.className = "wx-toolbar-button";
            if (item.id) {
                el.id = item.id;
            }
            return el;
        } else if (item.type === "modal-button") {
            const el = document.createElement("button");
            el.className = "wx-toolbar-modal-btn";
            if (item.id) {
                el.id = item.id;
            }
            return el;
        } else if (item.type === "combo") {
            const el = document.createElement("div");
            el.className = "wx-toolbar-combo";
            return el;
        } else if (item.type === "custom") {
            // custom element should usually be provided via opts.element, but fallback here
            const el = document.createElement("div");
            el.className = "wx-toolbar-custom";
            return el;
        }
        // fallback generic
        return document.createElement("div");
    }

    /**
     * Parses toolbar child elements and stores as item descriptors.
     * @param {HTMLElement[]} elements - Items to parse.
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
                    element: el
                };
            } else if (el.classList.contains("wx-toolbar-custom")) {
                return {
                    type: "custom",
                    align: align,
                    overflow: el.dataset.overflow || "",
                    element: el
                };
            } else if (el.classList.contains("wx-toolbar-modal-btn")) {
                return {
                    type: "modal-button",
                    id: el.id,
                    label: el.dataset.label || el.textContent.trim() || null,
                    icon: el.dataset.icon || null,
                    modalKey: el.dataset.modalKey,
                    modalTitle: el.dataset.modalTitle || "Dialog",
                    modalSubmitId: el.dataset.modalSubmitId,
                    colorCss: el.getAttribute("data-color-css") || null,
                    align: align,
                    disabled: disabled,
                    overflow: el.dataset.overflow || "",
                    element: el
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
                    options: Array.from(el.querySelectorAll("option")).map((opt) => {
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
                    modal: el.dataset.modal || null,
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
            return null; // fallback
        }).filter((item) => { return item !== null; }); // remove invalid items
    }

    /**
     * Parses the More area as a dropdown menu.
     * @param {HTMLElement} element - Element to parse.
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
     * Checks if "More" dropdown contains usable entries.
     * @returns {boolean} True if items exist.
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
     * Renders toolbar in flex layout.
     */
    _renderToolbar() {
        const container = this._element;
        container.innerHTML = "";

        // create spring
        const spring = document.createElement("div");
        spring.style.flex = "1 1 auto";
        spring.style.pointerEvents = "none";
        spring.dataset.overflow = "never";

        // create flex root
        const overflowRoot = document.createElement("div");
        overflowRoot.className = "wx-overflow";
        overflowRoot.style.width = "100%";
        overflowRoot.dataset.overflowCutoff = "false";

        // append left items
        this._items.filter((i) => { return i.align !== "right"; }).forEach((item) => {
            const rendered = this._renderItem(item);
            if (rendered) {
                overflowRoot.appendChild(rendered);
            }
        });

        overflowRoot.appendChild(spring);

        // append right items
        this._items.filter((i) => { return i.align === "right"; }).forEach((item) => {
            const rendered = this._renderItem(item);
            if (rendered) {
                overflowRoot.appendChild(rendered);
            }
        });

        container.appendChild(overflowRoot);

        this._overflowCtrl = new webexpress.webui.OverflowCtrl(overflowRoot);
        this._overflowCtrl.setAutoDistribute(false);

        // central click handler
        overflowRoot.addEventListener("click", (e) => {
            // handle buttons, combos, dropdowns
            const item = e.target.closest(".wx-toolbar-button, .wx-toolbar-combo, .wx-toolbar-dropdown");
            if (item) {
                // find corresponding data object if possible
                const dataItem = this._items.find((i) => { return i.element === item; });
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { element: item, item: dataItem });
            }
        });

        if (this._hasMoreDropdownItems()) {
            container.appendChild(this._more);
        }
    }

    /**
     * Schedules a layout update for the next animation frame.
     */
    _scheduleLayoutUpdate() {
        if (this._layoutFrame) {
            cancelAnimationFrame(this._layoutFrame);
        }
        this._layoutFrame = requestAnimationFrame(() => {
            this._updateToolbarLayout();
            this._layoutFrame = null;
        });
    }

    /**
     * Updates toolbar layout on resize and initial render
     * hides button labels individually (only if an icon/image is present) before triggering overflow.
     * when expanding, restores items from overflow before showing labels again individually as space allows.
     */
    _updateToolbarLayout() {
        const overflowRoot = this._getOverflowRoot();
        if (!overflowRoot) {
            return;
        }

        // first, try to restore items from overflow when space might have increased
        if (this._overflowCtrl && typeof this._overflowCtrl.restore === "function") {
            this._overflowCtrl.restore();
        }

        // shrink phase: hide labels one-by-one (right-to-left) before moving items into overflow
        let safety = 500; // simple guard to avoid infinite loops
        while (overflowRoot.scrollWidth > overflowRoot.clientWidth && safety > 0) {
            const next = this._findNextLabelToHide(overflowRoot);
            if (next) {
                this._hideButtonLabel(next);
            } else {
                break;
            }
            safety--;
        }

        // if still overflowing, move items into overflow via controller
        if (overflowRoot.scrollWidth > overflowRoot.clientWidth) {
            if (this._overflowCtrl && typeof this._overflowCtrl.handleOverflow === "function") {
                this._overflowCtrl.handleOverflow();
            }
        } else {
            // grow phase: show labels one-by-one (left-to-right) but only after restoring items
            this._showLabelsAsSpaceAllows(overflowRoot);
        }
    }

    /**
     * Renders a single toolbar item as DOM node.
     * @param {object} item - The item descriptor.
     * @returns {HTMLElement} The rendered element.
     */
    _renderItem(item) {
        if (item.type === "separator") {
            const el = document.createElement("div");
            el.className = "wx-toolbar-separator";
            el.dataset.overflow = "hide";
            return el;
        }
        if (item.type === "custom") {
            // custom item: preserve element, add wrapper class if needed
            if (!item.element.classList.contains("wx-toolbar-custom")) {
                item.element.classList.add("wx-toolbar-custom");
            }
            return item.element;
        }
        if (item.type === "modal-button") {
            item.element.classList.add("btn", "wx-toolbar-modal-btn");
            item.element.type = "button";
            item.element.innerHTML = ""; // clear
            
            if (item.icon) {
                const icon = document.createElement("i");
                icon.className = item.icon;
                item.element.appendChild(icon);
            }
            if (item.label) {
                const span = document.createElement("span");
                span.className = "wx-toolbar-button-label";
                span.textContent = item.label;
                item.element.appendChild(span);
            }
            if (item.colorCss) {
                item.element.classList.add(item.colorCss);
            }
            
            // attach specific listener for modal opening
            item.element.addEventListener("click", (e) => {
                e.preventDefault();
                this._openModal(item.modalKey, item.modalTitle, item.modalSubmitId);
            });
            
            // attributes for detection logic
            item.element.dataset.hasIcon = item.icon ? "true" : "false";
            item.element.dataset.labelHidden = "false";
            
            return item.element;
        }
        if (item.type === "button") {
            const instance = webexpress.webui.Controller.getInstanceByElement(item.element);
            if (instance) {
                // ensure legacy buttons still have detectable label/icon state
                this._ensureButtonDetectionAttributes(item.element);
                return item.element;
            }
            item.element.classList.add("btn");
            item.element.type = "button";
            
            // clear content to rebuild (safe for non-controller elements)
            item.element.innerHTML = "";
            
            let hasIconOrImage = false;
            if (item.image) {
                const img = document.createElement("img");
                img.className = "wx-icon";
                img.src = item.image;
                item.element.appendChild(img);
                hasIconOrImage = true;
            }
            if (item.icon) {
                const icon = document.createElement("i");
                icon.className = item.icon;
                item.element.appendChild(icon);
                hasIconOrImage = true;
            }
            if (item.label) {
                const span = document.createElement("span");
                span.className = "wx-toolbar-button-label";
                span.textContent = item.label;
                item.element.appendChild(span);
            }
            
            item.element.dataset.hasIcon = hasIconOrImage ? "true" : "false";
            item.element.dataset.labelHidden = "false";
            
            if (item.colorCss) {
                item.element.classList.add(item.colorCss);
            }
            if (item.colorStyle) {
                item.element.setAttribute("style", item.colorStyle);
            }
            if (item.title) {
                item.element.title = item.title;
            }
            if (item.modal) {
                item.element.setAttribute("data-wx-toggle", "modal");
                item.element.setAttribute("data-wx-target", item.modal);
            }
            // click listener handled by delegation in _renderToolbar
            return item.element;
        }
        if (item.type === "dropdown") {
            const instance = webexpress.webui.Controller.getInstanceByElement(item.element);
            if (instance) {
                return item.element;
            }
            const dropdownCtrl = new webexpress.webui.DropdownCtrl(item.element);
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
            return dropdownCtrl._element;
        }
        if (item.type === "combo") {
            const combo = document.createElement("div");
            combo.className = "wx-toolbar-combo";
            if (item.disabled) {
                combo.classList.add("disabled");
            }
            if (item.title) {
                combo.title = item.title;
            }
            if (item.image) {
                const img = document.createElement("img");
                img.className = "wx-icon";
                img.src = item.image;
                combo.appendChild(img);
                if (item.disabled) {
                    img.classList.add("disabled");
                }
                if (item.colorCss) {
                    img.classList.add(item.colorCss);
                }
                if (item.colorStyle) {
                    img.setAttribute("style", item.colorStyle);
                }
            }
            if (item.icon) {
                const icon = document.createElement("i");
                icon.className = item.icon;
                combo.appendChild(icon);
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
                combo.appendChild(label);
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
            item.options.forEach((opt) => {
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
            if (item.disabled) {
                el.classList.add("disabled");
            }
            if (item.colorCss) {
                el.classList.add(item.colorCss);
            }
            if (item.colorStyle) {
                el.setAttribute("style", item.colorStyle);
            }
            if (item.title) {
                el.title = item.title;
            }
            el.dataset.overflow = "hide";
            return el;
        }
        return null;
    }

    /**
     * Creates and opens a ModalSidebarPanel for the given key.
     * Reuses existing instances.
     * @param {string} key - The registration key for DialogPanels.
     * @param {string} title - Title for the modal.
     * @param {string} submitId - ID for the submit button.
     */
    _openModal(key, title, submitId) {
        if (!key) {
            return;
        }
        
        let modalInstance = this._modalInstances[key];
        
        if (!modalInstance) {
            const id = "wx-toolbar-msp-" + key + "-" + Date.now();
            const el = document.createElement("div");
            el.id = id;
            el.setAttribute("aria-labelledby", id + "-label");
            el.setAttribute("aria-hidden", "true");
            el.setAttribute("data-key", key);
            if (submitId) {
                el.setAttribute("data-submit-id", submitId);
            }
            el.setAttribute("data-validate-active-only", "true");

            const submitBtnId = submitId || ("submit-" + id);
            
            el.innerHTML = [
                '<div class="wx-modal-header">' + (title || "Dialog") + '</div>',
                '<div class="wx-modal-footer">',
                `<button id="' + submitBtnId + '" class="btn btn-primary">${this._i18n("webexpress.webui:apply")}</button>`,
                '</div>'
            ].join("");

            const footer = el.querySelector(".wx-modal-footer");
            const content = document.createElement("div");
            content.className = "wx-modal-content";
            
            if (footer && footer.parentNode) {
                footer.parentNode.insertBefore(content, footer);
            } else {
                el.appendChild(content);
            }

            document.body.appendChild(el);
            
            modalInstance = new webexpress.webui.ModalSidebarPanel(el);
            modalInstance._toolbar = this; // link back reference
            this._modalInstances[key] = modalInstance;
        }
        
        if (modalInstance && typeof modalInstance.show === "function") {
            modalInstance.show();
        }
    }

    /**
     * Creates the More dropdown using DropdownCtrl with ... icon and all contained items as entries.
     * @returns {HTMLElement} Dropdown root element.
     */
    _createMoreDropdownWithController() {
        const items = [];
        if (this._moreRaw) {
            Array.from(this._moreRaw.children).forEach((child) => {
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
     * Returns the overflow root element.
     * @returns {HTMLElement|null}
     */
    _getOverflowRoot() {
        const container = this._element;
        const overflowRoot = container.querySelector(".wx-overflow");
        if (!overflowRoot) {
            return null;
        }
        return overflowRoot;
    }

    /**
     * Ensures that a pre-existing button element has detection attributes/classes.
     * @param {HTMLElement} buttonEl
     */
    _ensureButtonDetectionAttributes(buttonEl) {
        // detect icon or image presence
        const hasIconOrImage = !!buttonEl.querySelector("i, img");
        buttonEl.dataset.hasIcon = hasIconOrImage ? "true" : "false";
        // find an existing label span and mark it
        const labelSpan = this._findLabelSpan(buttonEl);
        if (labelSpan && !labelSpan.classList.contains("wx-toolbar-button-label")) {
            labelSpan.classList.add("wx-toolbar-button-label");
        }
        if (!buttonEl.dataset.labelHidden) {
            buttonEl.dataset.labelHidden = "false";
        }
    }

    /**
     * Finds the label span for a given button element.
     * @param {HTMLElement} buttonEl
     * @returns {HTMLElement|null}
     */
    _findLabelSpan(buttonEl) {
        // prefer explicit class, fallback to the first span child
        let span = buttonEl.querySelector(".wx-toolbar-button-label");
        if (!span) {
            span = buttonEl.querySelector("span");
        }
        return span || null;
    }

    /**
     * Returns whether a button's label can be hidden (icon present and label currently visible).
     * @param {HTMLElement} buttonEl
     * @returns {boolean}
     */
    _canHideLabel(buttonEl) {
        if (!buttonEl || !buttonEl.classList.contains("wx-toolbar-button") && !buttonEl.classList.contains("wx-toolbar-modal-btn")) {
            return false;
        }
        const labelSpan = this._findLabelSpan(buttonEl);
        const hasIcon = buttonEl.dataset.hasIcon === "true" || !!buttonEl.querySelector("i, img");
        const isHidden = buttonEl.dataset.labelHidden === "true" || (labelSpan && labelSpan.style.display === "none");
        if (!labelSpan) {
            return false;
        }
        if (!hasIcon) {
            return false;
        }
        if (isHidden) {
            return false;
        }
        return true;
    }

    /**
     * Hides a single button label and marks the state.
     * @param {HTMLElement} buttonEl
     */
    _hideButtonLabel(buttonEl) {
        const span = this._findLabelSpan(buttonEl);
        if (span) {
            // hide only the label span
            span.style.display = "none";
            buttonEl.dataset.labelHidden = "true";
        }
    }

    /**
     * Tries to show a single button label; reverts if it causes overflow.
     * @param {HTMLElement} buttonEl
     * @param {HTMLElement} overflowRoot
     * @returns {boolean} true if label was shown and kept, false if reverted
     */
    _tryShowButtonLabel(buttonEl, overflowRoot) {
        const span = this._findLabelSpan(buttonEl);
        if (!span) {
            return false;
        }
        // show the label tentatively
        const previousDisplay = span.style.display;
        span.style.display = "";
        // force state to visible for bookkeeping
        buttonEl.dataset.labelHidden = "false";

        // if this triggers overflow, revert
        if (overflowRoot.scrollWidth > overflowRoot.clientWidth) {
            span.style.display = previousDisplay || "none";
            buttonEl.dataset.labelHidden = "true";
            return false;
        }
        return true;
    }

    /**
     * Finds the next button whose label should be hidden (right-to-left).
     * @param {HTMLElement} overflowRoot
     * @returns {HTMLElement|null}
     */
    _findNextLabelToHide(overflowRoot) {
        const buttons = Array.from(overflowRoot.querySelectorAll(".wx-toolbar-button, .wx-toolbar-modal-btn"));
        for (let i = buttons.length - 1; i >= 0; i--) {
            const btn = buttons[i];
            if (this._canHideLabel(btn)) {
                return btn;
            }
        }
        return null;
    }

    /**
     * Shows labels one-by-one (left-to-right) as long as there is enough space.
     * @param {HTMLElement} overflowRoot
     */
    _showLabelsAsSpaceAllows(overflowRoot) {
        const buttons = Array.from(overflowRoot.querySelectorAll(".wx-toolbar-button, .wx-toolbar-modal-btn"));
        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const isHidden = btn.dataset.labelHidden === "true";
            const canShow = isHidden && !!this._findLabelSpan(btn);
            if (canShow) {
                // only attempt to show if the button actually has an icon (we only hide such labels)
                const hasIcon = btn.dataset.hasIcon === "true" || !!btn.querySelector("i, img");
                if (!hasIcon) {
                    continue;
                }
                const shown = this._tryShowButtonLabel(btn, overflowRoot);
                if (!shown) {
                    // stop when next label would overflow
                    break;
                }
            }
        }
    }

    /**
     * Cleans up resources.
     */
    destroy() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._layoutFrame) {
            cancelAnimationFrame(this._layoutFrame);
            this._layoutFrame = null;
        }
        // cleanup created modals
        Object.keys(this._modalInstances).forEach((key) => {
            const modal = this._modalInstances[key];
            // assume modal has destroy, if not, remove element
            if (modal && typeof modal.destroy === "function") {
                modal.destroy();
            } else if (modal && modal._element && modal._element.parentNode) {
                modal._element.parentNode.removeChild(modal._element);
            }
        });
        this._modalInstances = {};
    }
};

// controller registration
webexpress.webui.Controller.registerClass("wx-webui-toolbar", webexpress.webui.ToolbarCtrl);