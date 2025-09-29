/**
 * Sidebar controller for responsive sidebars using WX-prefixed classes and Popper.js for overlays.
 * Element types: .wx-sidebar-item, .wx-sidebar-divider, .wx-sidebar-header, .wx-sidebar-panel.
 * Compact mode is controlled via data-mode: "hide" or "overlay".
 * The following events are triggered:
 * - webexpress.webui.Event.REMOVE_EVENT
 * - webexpress.webui.Event.SHOW_EVENT
 * - webexpress.webui.Event.HIDE_EVENT
 * - webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT
 */
webexpress.webui.SidebarCtrl = class extends webexpress.webui.PopperCtrl {
    _items = [];

    /**
     * constructor for sidebar control
     * @param {HTMLElement} element - root element of the sidebar
     */
    constructor(element) {
        super(element);
        this._element = element;
        this._isReduced = false;
        this._manualOverride = false;
        this._toolbarElement = null;
        // set breakpoint to a sensible default if not present
        this._breakpoint = parseInt(element.getAttribute("data-breakpoint"), 10) || 100;
        this._items = this._parseItems(element.children);

        // clean up the DOM and remove all data attributes
        element.removeAttribute("data-breakpoint");
        element.classList.add("wx-sidebar");
        element.innerHTML = "";

        this._buildSidebar();
        this._buildFooter();
        this._setupPanelOverlayHandling();
        this._setupResizeHandling();

        // set initial reduced state depending on window size
        this._isReduced = window.innerWidth < this._breakpoint;
        this._updateView();
    }

    /**
     * parses all sidebar children and creates item descriptors
     * @param {HTMLCollection} children - original sidebar children
     * @returns {Array} list of item descriptors
     */
    _parseItems(children) {
        const items = [];
        const nodes = Array.from(children);
        for (let i = 0; i < nodes.length; i++) {
            const el = nodes[i];
            const isDivider = el.classList.contains("wx-sidebar-separator");
            const isHeader = el.classList.contains("wx-sidebar-header");
            const isPanel = el.classList.contains("wx-sidebar-control");
            const isLink = el.classList.contains("wx-sidebar-link");
            const isToolbar = el.classList.contains("wx-sidebar-toolbar");
            const iconClass = el.getAttribute("data-icon");
            const iconImg = el.getAttribute("data-image");
            const label = el.getAttribute("data-label") || el.textContent.trim();
            const link = el.getAttribute("data-uri") || null;
            const tooltip = el.getAttribute("data-tooltip") || null;
            const isRemoveable = el.getAttribute("data-removeable") === "true";
            const mode = el.getAttribute("data-mode") || ""; // "hide" or "overlay"

            if (isHeader) {
                const header = document.createElement("div");
                header.classList.add("wx-sidebar-header");
                items.push({
                    index: i,
                    element: header,
                    type: "header",
                    iconClass: null,
                    iconImg: null,
                    label: label,
                    link: null,
                    tooltip: null,
                    isRemoveable: null,
                    mode: "hide",
                    content: null
                });
            } else if (isDivider) {
                const divider = document.createElement("div");
                divider.classList.add("wx-sidebar-divider");
                items.push({
                    index: i,
                    element: divider,
                    type: "divider",
                    iconClass: null,
                    iconImg: null,
                    label: null,
                    link: null,
                    tooltip: null,
                    isRemoveable: null,
                    mode: mode,
                    content: null
                });
            } else if (isLink) {
                const item = document.createElement("div");
                item.className = "wx-sidebar-link";
                items.push({
                    index: i,
                    element: item,
                    type: "item",
                    iconClass: iconClass,
                    iconImg: iconImg,
                    label: label,
                    link: link,
                    tooltip: tooltip,
                    isRemoveable: isRemoveable,
                    mode: mode,
                    content: null
                });
            } else if (isPanel) {
                const panel = document.createElement("div");
                panel.classList.add("wx-sidebar-panel");
                items.push({
                    index: i,
                    element: panel,
                    type: "panel",
                    iconClass: iconClass,
                    iconImg: iconImg,
                    label: label,
                    link: null,
                    tooltip: null,
                    isRemoveable: null,
                    mode: mode,
                    content: el.children[0] ? el.children[0].cloneNode(true) : null
                });
            } else if (isToolbar) {
                el.classList.remove("wx-sidebar-toolbar");
                // toolbar gets handled as special item
                items.push({
                    index: i,
                    element: el,
                    type: "toolbar"
                });
            }
        }
        return items;
    }

    /**
     * ensures all items are in the sidebar in DOM order
     */
    _buildSidebar() {
        for (let item of this._items) {
            if (item.type !== "toolbar") {
                if (item.element.parentElement !== this._element) {
                    this._element.appendChild(item.element);
                }
            }
        }
    }

    /**
     * builds a toolbar at the footer of the sidebar, if available
     */
    _buildFooter() {
        for (let item of this._items) {
            if (item.type === "toolbar") {
                this._toolbarElement = item.element;
                if (!this._toolbarElement._toolbarCtrl) {
                    this._toolbarElement._toolbarCtrl = new webexpress.webui.ToolbarCtrl(this._toolbarElement);
                }
                this._element.appendChild(this._toolbarElement);
                break;
            }
        }
    }

    /**
     * handles overlays for panels with data-mode="overlay" in compact mode using Popper.js
     */
    _setupPanelOverlayHandling() {
        for (let item of this._items) {
            if (item.type === "panel") {
                if (!item.icon && item.iconClass) {
                    let icon = document.createElement("span");
                    icon.className = "wx-sidebar-icon";
                    let iTag = document.createElement("i");
                    iTag.className = item.iconClass;
                    icon.appendChild(iTag);
                    item.icon = icon;
                }
                if (item.icon && item.mode === "overlay") {
                    item.icon.addEventListener("click", (e) => {
                        if (!this._isReduced) {
                            return;
                        }
                        if (!item.content) {
                            return;
                        }
                        this._showPanelOverlay(item);
                    });
                }
            }
        }
    }

    /**
     * sets up resize handling with debounce and resets manual override on breakpoint change
     */
    _setupResizeHandling() {
        // debounce utility for resize event
        function debounce(fn, delay) {
            let t = null;
            return function () {
                if (t) {
                    clearTimeout(t);
                }
                t = setTimeout(() => {
                    fn();
                }, delay);
            };
        }
        // resize event listener
        const onResize = debounce(() => {
            // only trigger resize logic if no manual override active
            if (!this._manualOverride) {
                const reduced = this._element.offsetWidth < this._breakpoint;
                if (reduced !== this._isReduced) {
                    this._isReduced = reduced;
                    this._updateView();
                    this._dispatch(webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT, { reduced: this._isReduced });
                }
            }
        }, 70);

        // observe the sidebar element for size changes
        if (typeof ResizeObserver === "function") {
            this._resizeObserver = new ResizeObserver(onResize);
            this._resizeObserver.observe(this._element);
        } else {
            window.addEventListener("resize", onResize);
        }
    }

    /**
     * updates the sidebar view (reduced or expanded)
     */
    _updateView() {
        if (this._isReduced) {
            this._element.classList.add("wx-sidebar-reduced");
            this._dispatch(webexpress.webui.Event.HIDE_EVENT, { sidebar: this._element });
        } else {
            this._element.classList.remove("wx-sidebar-reduced");
            this._dispatch(webexpress.webui.Event.SHOW_EVENT, { sidebar: this._element });
        }
        for (let item of this._items) {
            if (item.type === "toolbar") {
                continue;
            }
            item.element.innerHTML = "";

            if (item.type === "header") {
                if (this._isReduced && item.mode === "hide") {
                    item.element.classList.add("hide");
                } else {
                    item.element.classList.remove("hide");
                    item.element.textContent = item.label;
                }
                continue;
            }
            if (item.type === "divider") {
                if (this._isReduced && item.mode === "hide") {
                    item.element.classList.add("hide");
                } else {
                    item.element.classList.remove("hide");
                }
                continue;
            }
            if (item.type === "item") {
                if (this._isReduced && item.mode === "hide") {
                    item.element.classList.add("hide");
                    continue;
                } else {
                    item.element.classList.remove("hide");
                }
                const link = document.createElement("a");
                if (item.iconClass) {
                    const icon = document.createElement("i");
                    icon.className = item.iconClass;
                    link.appendChild(icon);
                }
                if (item.iconImg) {
                    const img = document.createElement("img");
                    img.className = "wx-icon";
                    img.src = item.iconImg;
                    img.alt = "";
                    link.appendChild(img);
                }
                if (this._isReduced) {
                    item.element.appendChild(link);
                } else {
                    const label = document.createElement("span");
                    label.textContent = item.label;
                    link.appendChild(label);
                    item.element.appendChild(link);

                    if (item.isRemoveable) {
                        const icon = document.createElement("i");
                        icon.className = "fas fa-xmark";
                        const removeBtn = document.createElement("button");
                        removeBtn.className = "btn";
                        removeBtn.title = this._i18n ? this._i18n("webexpress.webui:remove", "") : "Remove";
                        removeBtn.appendChild(icon);
                        removeBtn.addEventListener("click", (e) => {
                            e.stopPropagation();
                            if (item.element.parentElement) {
                                item.element.parentElement.removeChild(item.element);
                            }
                            this._dispatch(webexpress.webui.Event.REMOVE_EVENT, { label: label });
                        });
                        item.element.appendChild(removeBtn);
                    }
                }
                continue;
            }
            if (item.type === "panel") {
                if (this._isReduced && (item.mode === "" || item.mode === "hide")) {
                    item.element.classList.remove("overlay");
                    item.element.classList.add("hide");
                    continue;
                } else if (this._isReduced && item.mode === "overlay") {
                    item.element.classList.add("overlay");
                    item.element.classList.remove("hide");
                    if (item.iconClass) {
                        const icon = document.createElement("i");
                        icon.className = item.iconClass;
                        item.element.appendChild(icon);
                    }
                    if (item.iconImg) {
                        const img = document.createElement("img");
                        img.className = "wx-icon";
                        img.src = item.iconImg;
                        img.alt = "";
                        item.element.appendChild(img);
                    }
                    
                    item.element.addEventListener("click", () => {
                        this._showPanelOverlay(item);
                    });
                    continue;
                } else {
                    item.element.classList.remove("overlay");
                    item.element.classList.remove("hide");
                    if (item.content) {
                        item.element.appendChild(item.content.cloneNode(true));
                    }
                }
            }
        }
    }

    /**
     * opens the overlay panel for panel items in overlay mode
     * @param {Object} item - panel item descriptor
     */
    _showPanelOverlay(item) {
        const overlayPanel = document.createElement("div");
        overlayPanel.className = "wx-sidebar-panel-overlay";
        const content = document.createElement("div");
        content.className = "wx-sidebar-panelcontent";
        if (item.content) {
            content.appendChild(item.content.cloneNode(true));
        }
        overlayPanel.appendChild(content);
        document.body.appendChild(overlayPanel);

        if (typeof this._initializePopper === "function") {
            this._initializePopper(item.element, overlayPanel);
        }

        this._dispatch(webexpress.webui.Event.SHOW_EVENT, { overlay: overlayPanel });

        // handle click outside & ESC
        const handleClickOutside = (event) => {
            if (!overlayPanel.contains(event.target) && !item.element.contains(event.target)) {
                overlayPanel.style.display = "none";
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("keydown", handleEsc);
                if (overlayPanel.parentElement) {
                    overlayPanel.parentElement.removeChild(overlayPanel);
                }
                this._dispatch(webexpress.webui.Event.HIDE_EVENT, { overlay: overlayPanel });
            }
        };
        const handleEsc = (event) => {
            if (event.key === "Escape") {
                overlayPanel.style.display = "none";
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("keydown", handleEsc);
                if (overlayPanel.parentElement) {
                    overlayPanel.parentElement.removeChild(overlayPanel);
                }
                this._dispatch(webexpress.webui.Event.HIDE_EVENT, { overlay: overlayPanel });
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);
    }

    /**
     * expands sidebar to full view
     */
    expand() {
        this._isReduced = false;
        this._manualOverride = true;
        this._updateView();
    }

    /**
     * reduces sidebar to compact view
     */
    reduce() {
        this._isReduced = true;
        this._manualOverride = true;
        this._updateView();
    }

    /**
     * cleans up resources
     */
    destroy() {
        if (this._footer && this._footer.parentElement === this._element) {
            this._element.removeChild(this._footer);
        }
    }
};

// register controller
webexpress.webui.Controller.registerClass("wx-webui-sidebar", webexpress.webui.SidebarCtrl);