/**
 * Sidebar controller for responsive sidebars using WX-prefixed classes and Popper.js for overlays.
 * Element types: .wx-sidebar-link, .wx-sidebar-separator, .wx-sidebar-header, .wx-sidebar-panel, .wx-sidebar-icon.
 * Compact mode is controlled via data-mode: "hide" or "overlay".
 *
 * The following events are triggered:
 * - webexpress.webui.Event.REMOVE_EVENT
 * - webexpress.webui.Event.SHOW_EVENT
 * - webexpress.webui.Event.HIDE_EVENT
 * - webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT
 * - webexpress.webui.Event.ICON_EDIT_EVENT
 */
webexpress.webui.SidebarCtrl = class extends webexpress.webui.PopperCtrl {
    _items = [];
    _resizeObserver = null;

    /**
     * Initializes the sidebar control, parses content, and sets up layout.
     * @param {HTMLElement} element - The root element of the sidebar.
     */
    constructor(element) {
        super(element);
        this._element = element;
        this._isReduced = false;
        this._manualOverride = false;
        this._toolbarElement = null;

        // set breakpoint to a sensible default if not present
        this._breakpoint = parseInt(element.getAttribute("data-breakpoint"), 10) || 100;

        // parse structure before clearing html
        this._items = this._parseItems(element.children);

        // clean up the dom and remove all data attributes
        [...element.attributes]
            .filter(attr => attr.name.startsWith("data-"))
            .forEach(attr => element.removeAttribute(attr.name));

        element.classList.add("wx-sidebar");
        element.innerHTML = "";

        this._sidebarWrapper = document.createElement("div");
        this._sidebarWrapper.className = "wx-sidebar-wrapper";
        this._element.appendChild(this._sidebarWrapper);

        this._buildSidebar();
        this._buildFooter();
        this._setupResizeHandling();

        // set initial reduced state depending on window size
        this._isReduced = this._element.offsetWidth < this._breakpoint;
        this._updateView();
    }

    /**
     * Parses all sidebar children and creates item descriptors.
     * @param {HTMLCollection} children - The original sidebar children.
     * @returns {Array} List of item descriptors.
     */
    _parseItems(children) {
        const items = [];
        const nodes = Array.from(children);

        for (let i = 0; i < nodes.length; i++) {
            const el = nodes[i];
            const dataset = el.dataset;
            const commonProps = {
                id: el.id || null,
                index: i,
                label: dataset.label || el.textContent.trim(),
                iconClass: dataset.icon,
                iconImg: dataset.image,
                mode: dataset.mode || "hide", // "hide" or "overlay"
                // action attributes
                primaryAction: {
                    action: dataset.wxPrimaryAction || null,
                    target: dataset.wxPrimaryTarget || null,
                    uri: dataset.wxPrimaryUri || null,
                    size: dataset.wxPrimarySize || null
                },
                secondaryAction: {
                    action: dataset.wxSecondaryAction || null,
                    target: dataset.wxSecondaryTarget || null,
                    uri: dataset.wxSecondaryUri || null,
                    size: dataset.wxSecondarySize || null
                }
            };

            if (el.classList.contains("wx-sidebar-header")) {
                items.push({
                    ...commonProps,
                    type: "header",
                    element: this._createHeaderElement(commonProps.label)
                });
            } else if (el.classList.contains("wx-sidebar-separator")) {
                items.push({
                    ...commonProps,
                    type: "divider",
                    element: this._createDividerElement()
                });
            } else if (el.classList.contains("wx-sidebar-link")) {
                const isActive = el.hasAttribute("active");
                const isDisabled = el.hasAttribute("disabled");

                items.push({
                    ...commonProps,
                    type: "item",
                    link: dataset.uri || null,
                    tooltip: dataset.tooltip || null,
                    target: dataset.target || null,
                    isRemoveable: dataset.removeable === "true",
                    active: isActive,
                    disabled: isDisabled,
                    element: null // created in _buildItemElement
                });
            } else if (el.classList.contains("wx-sidebar-control")) {
                items.push({
                    ...commonProps,
                    type: "panel",
                    content: el.firstElementChild ? this._detachElement(el.firstElementChild) : null,
                    element: null // created in _buildPanelElement
                });
            } else if (el.classList.contains("wx-sidebar-toolbar")) {
                el.classList.remove("wx-sidebar-toolbar");
                items.push({
                    index: i,
                    element: el,
                    type: "toolbar"
                });
            } else if (el.classList.contains("wx-sidebar-icon")) {
                items.push({
                    ...commonProps,
                    type: "icon",
                    uri: dataset.uri || dataset.wxUri || null,
                    iconEdit: dataset.iconEdit === "true",
                    iconText: dataset.iconText || null,
                    element: null,
                    // action attributes
                    primaryAction: {
                        action: dataset.wxPrimaryAction || null,
                        target: dataset.wxPrimaryTarget || null,
                        uri: dataset.wxPrimaryUri || null,
                        size: dataset.wxPrimarySize || null
                    },
                    secondaryAction: {
                        action: dataset.wxSecondaryAction || null,
                        target: dataset.wxSecondaryTarget || null,
                        uri: dataset.wxSecondaryUri || null,
                        size: dataset.wxSecondarySize || null
                    }
                });
            }
        }
        return items;
    }

    /**
     * Creates a header DOM element.
     * @param {string} text - The header text.
     * @returns {HTMLElement} The created header element.
     */
    _createHeaderElement(text) {
        const header = document.createElement("div");
        header.className = "wx-sidebar-header";
        header.textContent = text;
        return header;
    }

    /**
     * Creates a divider DOM element.
     * @returns {HTMLElement} The created divider element.
     */
    _createDividerElement() {
        const divider = document.createElement("div");
        divider.className = "wx-sidebar-divider";
        return divider;
    }

    /**
     * Builds the main DOM structure for items and panels.
     */
    _buildSidebar() {
        for (const item of this._items) {
            if (item.type === "toolbar") {
                continue;
            }

            if (item.type === "item") {
                item.element = this._buildItemElement(item);
            } else if (item.type === "panel") {
                item.element = this._buildPanelElement(item);
            } else if (item.type === "icon") {
                item.element = this._buildIconElement(item);
            }

            if (item.element) {
                this._sidebarWrapper.appendChild(item.element);
            }
        }
    }

    /**
     * Constructs the DOM for a navigation item (link).
     * @param {Object} item - The item descriptor.
     * @returns {HTMLElement} The constructed item element.
     */
    _buildItemElement(item) {
        const wrapper = document.createElement("div");
        if (item.id) {
            wrapper.id = item.id;
        }
        wrapper.className = "wx-sidebar-link";
        if (item.active) {
            wrapper.setAttribute("active", "");
        }
        if (item.disabled) {
            wrapper.setAttribute("disabled", "");
        }

        // apply action attributes
        if (item.primaryAction) {
            for (const [key, value] of Object.entries(item.primaryAction)) {
                if (value) {
                    const htmlName = `data-wx-primary-${key.toLowerCase()}`;
                    wrapper.setAttribute(htmlName, value);
                }
            }
        }

        if (item.secondaryAction) {
            for (const [key, value] of Object.entries(item.secondaryAction)) {
                if (value) {
                    const htmlName = `data-wx-secondary-${key.toLowerCase()}`;
                    wrapper.setAttribute(htmlName, value);
                }
            }
        }

        const link = document.createElement("a");
        link.className = "wx-link";
        if (item.link) {
            link.href = item.link;
        }
        if (item.target) {
            link.target = item.target;
        }
        if (item.tooltip) {
            link.title = item.tooltip;
        }

        // icon container
        const iconSpan = document.createElement("span");
        iconSpan.className = "wx-icon-container";

        if (item.iconClass) {
            const icon = document.createElement("i");
            icon.className = item.iconClass;
            iconSpan.appendChild(icon);
        } else if (item.iconImg) {
            const img = document.createElement("img");
            img.className = "wx-icon";
            img.src = item.iconImg;
            img.alt = "";
            iconSpan.appendChild(img);
        }
        link.appendChild(iconSpan);

        // label
        const label = document.createElement("span");
        label.className = "wx-label";
        label.textContent = item.label;
        link.appendChild(label);

        wrapper.appendChild(link);

        // remove button
        if (item.isRemoveable) {
            const removeBtn = document.createElement("button");
            removeBtn.className = "btn wx-button-close";
            removeBtn.title = this._i18n ? this._i18n("webexpress.webui:remove", "Remove") : "Remove";
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (wrapper.parentElement) {
                    wrapper.parentElement.removeChild(wrapper);
                }
                this._dispatch(webexpress.webui.Event.REMOVE_EVENT, { label: item.label });
            });
            wrapper.appendChild(removeBtn);
        }

        return wrapper;
    }

    /**
     * Constructs the DOM for a sidebar icon item.
     * @param {Object} item - The icon item descriptor.
     * @returns {HTMLElement} The constructed icon element.
     */
    _buildIconElement(item) {
        const iconWrapper = document.createElement("div");
        iconWrapper.className = "wx-sidebar-icon";
        iconWrapper.setAttribute("tabindex", "0");

        // icon presentation
        let iconEl = null;
        if (item.iconClass) {
            iconEl = document.createElement("i");
            iconEl.className = "wx-sidebar-icon-graphic " + item.iconClass;
        } else if (item.iconImg) {
            iconEl = document.createElement("img");
            iconEl.className = "wx-sidebar-icon-graphic wx-icon";
            iconEl.src = item.iconImg;
            iconEl.alt = "";
        }
        if (iconEl) {
            iconWrapper.appendChild(iconEl);
        }

        // optional text below the icon
        if (item.iconText) {
            const text = document.createElement("div");
            text.className = "wx-sidebar-icon-text";
            text.textContent = item.iconText;
            iconWrapper.appendChild(text);
        }

        // edit button
        if (item.iconEdit) {
            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "wx-sidebar-icon-edit";
            editBtn.title = this._i18n("webexpress.webui:edit", "Edit");
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
            if (item.uri) {
                editBtn.setAttribute("data-wx-uri", item.uri);
            }

            // apply action attributes
            if (item.primaryAction) {
                for (const [key, value] of Object.entries(item.primaryAction)) {
                    if (value) {
                        const htmlName = `data-wx-primary-${key.toLowerCase()}`;
                        editBtn.setAttribute(htmlName, value);
                    }
                }
            }

            if (item.secondaryAction) {
                for (const [key, value] of Object.entries(item.secondaryAction)) {
                    if (value) {
                        const htmlName = `data-wx-secondary-${key.toLowerCase()}`;
                        editBtn.setAttribute(htmlName, value);
                    }
                }
            }

            iconWrapper.appendChild(editBtn);
        }

        return iconWrapper;
    }

    /**
     * Constructs the DOM for a panel control.
     * @param {Object} item - The panel item descriptor.
     * @returns {HTMLElement} The constructed panel element.
     */
    _buildPanelElement(item) {
        const panel = document.createElement("div");
        panel.className = "wx-sidebar-panel";

        // trigger/icon area for reduced mode
        const trigger = document.createElement("div");
        trigger.className = "wx-sidebar-panel-trigger";

        if (item.iconClass) {
            const icon = document.createElement("i");
            icon.className = item.iconClass;
            trigger.appendChild(icon);
        } else if (item.iconImg) {
            const img = document.createElement("img");
            img.className = "wx-icon";
            img.src = item.iconImg;
            trigger.appendChild(img);
        }

        // content area
        const contentContainer = document.createElement("div");
        contentContainer.className = "wx-sidebar-panel-content";
        if (item.content) {
            contentContainer.appendChild(item.content);
        }

        panel.appendChild(trigger);
        panel.appendChild(contentContainer);

        // bind click for overlay mode
        if (item.mode === "overlay") {
            trigger.addEventListener("click", (e) => {
                if (this._isReduced && item.content) {
                    this._showPanelOverlay(item, trigger);
                }
            });
        }

        return panel;
    }

    /**
     * Builds a toolbar at the footer of the sidebar, if available.
     * Defines controller property as non-enumerable to prevent circular JSON error.
     */
    _buildFooter() {
        for (const item of this._items) {
            if (item.type === "toolbar") {
                this._toolbarElement = item.element;
                
                if (!this._toolbarElement._toolbarCtrl) {
                    // define as non-enumerable to prevent JSON.stringify circular reference issues
                    Object.defineProperty(this._toolbarElement, '_toolbarCtrl', {
                        value: new webexpress.webui.ToolbarCtrl(this._toolbarElement),
                        writable: true,
                        configurable: true,
                        enumerable: false
                    });
                }
                
                this._element.appendChild(this._toolbarElement);
                break;
            }
        }
    }

    /**
     * Sets up resize handling using ResizeObserver.
     */
    _setupResizeHandling() {
        // resize callback
        const onResize = () => {
            // only trigger resize logic if no manual override active
            if (!this._manualOverride) {
                const reduced = this._element.offsetWidth < this._breakpoint;
                if (reduced !== this._isReduced) {
                    this._isReduced = reduced;
                    this._updateView();
                    this._dispatch(webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT, { reduced: this._isReduced });
                }
            }
        };

        // debounce wrapper
        let timeout;
        const debouncedResize = () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(onResize, 70);
        };

        // observe the sidebar element for size changes
        if (typeof ResizeObserver === "function") {
            this._resizeObserver = new ResizeObserver(debouncedResize);
            this._resizeObserver.observe(this._element);
        } else {
            window.addEventListener("resize", debouncedResize);
        }
    }

    /**
     * Updates the sidebar CSS classes based on the current state.
     * Prevents DOM rebuilding to ensure performance.
     * Uses ID in event payload to avoid circular JSON errors.
     */
    _updateView() {
        if (this._isReduced) {
            this._element.classList.add("wx-sidebar-reduced");
            this._dispatch(webexpress.webui.Event.HIDE_EVENT, { sidebarId: this._element.id });
        } else {
            this._element.classList.remove("wx-sidebar-reduced");
            this._dispatch(webexpress.webui.Event.SHOW_EVENT, { sidebarId: this._element.id });
        }

        for (const item of this._items) {
            if (item.type === "toolbar") {
                continue;
            }

            const el = item.element;
            const mode = item.mode;

            if (item.type === "panel") {
                const trigger = el.querySelector(".wx-sidebar-panel-trigger");
                const content = el.querySelector(".wx-sidebar-panel-content");

                if (this._isReduced) {
                    // reduced mode logic
                    if (mode === "hide") {
                        el.style.display = "none";
                    } else {
                        el.style.display = "";
                        if (mode === "overlay") {
                            el.classList.add("wx-mode-overlay");
                            // show icon, hide content
                            if (trigger) { trigger.style.display = ""; }
                            if (content) { content.style.display = "none"; }
                        }
                    }
                } else {
                    // expanded mode logic: always show content, hide icon trigger
                    el.style.display = "";
                    el.classList.remove("wx-mode-overlay");

                    if (trigger) { trigger.style.display = "none"; }
                    if (content) { content.style.display = ""; }
                }
            } else if (item.type === "icon") {
                // icon: adjust size for reduced/expanded mode
                if (el) {
                    if (this._isReduced) {
                        el.classList.add("wx-sidebar-icon-small");
                        el.classList.remove("wx-sidebar-icon-large");
                    } else {
                        el.classList.remove("wx-sidebar-icon-small");
                        el.classList.add("wx-sidebar-icon-large");
                    }
                    el.style.display = "";
                }
            } else {
                // standard item logic
                if (this._isReduced) {
                    if (mode === "hide") {
                        el.style.display = "none";
                    } else {
                        el.style.display = "";
                    }
                } else {
                    el.style.display = "";
                }
            }
        }
    }

    /**
     * Opens the overlay panel for panel items in overlay mode.
     * @param {Object} item - The panel item descriptor.
     * @param {HTMLElement} triggerEl - The element triggering the overlay.
     */
    _showPanelOverlay(item, triggerEl) {
        // create overlay panel element
        const overlayPanel = document.createElement("div");
        overlayPanel.className = "wx-sidebar-panel-overlay";
        const content = document.createElement("div");
        content.className = "wx-sidebar-panelcontent";

        // clone content for overlay to avoid moving it out of sidebar structure
        // or move it temporarily if event handlers must be preserved
        // here we assume content needs to be moved to preserve state
        if (item.content) {
            content.appendChild(item.content);
        }
        overlayPanel.appendChild(content);
        document.body.appendChild(overlayPanel);

        // initialize popper if available
        if (typeof this._initializePopper === "function") {
            this._initializePopper(triggerEl, overlayPanel);
        }

        // avoid passing DOM element to payload to prevent potential circular reference issues
        this._dispatch(webexpress.webui.Event.SHOW_EVENT, { overlayActive: true });

        const closeOverlay = () => {
            // restore content to sidebar
            if (item.content && item.element) {
                const contentContainer = item.element.querySelector(".wx-sidebar-panel-content");
                if (contentContainer) {
                    contentContainer.appendChild(item.content);
                }
            }

            overlayPanel.style.display = "none";
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);

            if (overlayPanel.parentElement) {
                overlayPanel.parentElement.removeChild(overlayPanel);
            }
            this._dispatch(webexpress.webui.Event.HIDE_EVENT, { overlayActive: false });
        };

        // handle click outside
        const handleClickOutside = (event) => {
            if (!overlayPanel.contains(event.target) && !triggerEl.contains(event.target)) {
                closeOverlay();
            }
        };

        // handle esc
        const handleEsc = (event) => {
            if (event.key === "Escape") {
                closeOverlay();
            }
        };

        // prevent clicks inside overlay from closing it
        overlayPanel.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);
    }

    /**
     * Expands sidebar to full view.
     */
    expand() {
        this._isReduced = false;
        this._manualOverride = true;
        this._updateView();
    }

    /**
     * Reduces sidebar to compact view.
     */
    reduce() {
        this._isReduced = true;
        this._manualOverride = true;
        this._updateView();
    }

    /**
     * Cleans up resources.
     */
    destroy() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        if (this._toolbarElement && this._toolbarElement.parentElement === this._element) {
            this._element.removeChild(this._toolbarElement);
        }
        this._element.innerHTML = "";
    }
};

// register controller
webexpress.webui.Controller.registerClass("wx-webui-sidebar", webexpress.webui.SidebarCtrl);