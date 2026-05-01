/**
 * ViewCtrl - Multi-View Switcher.
 * Supports two layouts:
 * - default:     toolbar with the active view's title/description and a dropdown for switching.
 * - togglegroup: compact toggle bar with all available views as labels/icons. No title/description.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 */
webexpress.webui.ViewCtrl = class extends webexpress.webui.Ctrl {

    // core state
    _viewsConfig = [];
    _activeViewIndex = -1;
    _storageKey = "";
    _layout = "default";

    // dropdown control instance and host element (default layout only)
    _viewDropdownCtrl = null;
    _viewDropdownHost = null;

    // mutation observers for header/footer
    _headerObserver = null;
    _footerObserver = null;

    // ui references
    _views = {
        toolbar: null,
        statusbar: null,
        masterPane: null,
        bodyWrapper: null,
        header: null,
        footer: null
    };

    _ctrls = {
        activeMaster: null
    };

    _elements = {
        title: null,
        desc: null,
        icon: null,
        viewDropdownMenu: null,
        viewDropdownTrigger: null,
        toggleGroup: null,
        toggleButtons: []
    };

    /**
     * Construct controller.
     * @param {HTMLElement} element host element
     */
    constructor(element) {
        super(element);

        // generate storage key based on element id or fallback
        const baseId = element.id || "wx-view-ctrl";
        this._storageKey = `wx_view_state_${baseId}`;

        // resolve layout (default | togglegroup)
        const rawLayout = (element.dataset.layout || "default").trim().toLowerCase();
        this._layout = rawLayout === "togglegroup" ? "togglegroup" : "default";

        this._parseViews(element);
        this._buildLayout(element);
        this._initSubViews();

        // determine initial view: saved state > first view
        let initialIndex = 0;
        const savedIndex = this._getCookie(this._storageKey);
        if (savedIndex !== null) {
            const idx = parseInt(savedIndex, 10);
            if (!isNaN(idx) && idx >= 0) {
                initialIndex = idx;
            }
        }

        // use requestAnimationFrame to ensure dom is ready before switching
        requestAnimationFrame(() => {
            if (this._viewsConfig.length > 0) {
                if (initialIndex >= this._viewsConfig.length) {
                    initialIndex = 0;
                }
                this.switchView(initialIndex);
            }
        });
    }

    /**
     * Cleanup resources when controller is destroyed.
     */
    dispose() {
        if (this._headerObserver) {
            this._headerObserver.disconnect();
            this._headerObserver = null;
        }
        if (this._footerObserver) {
            this._footerObserver.disconnect();
            this._footerObserver = null;
        }

        if (this._viewDropdownCtrl && typeof this._viewDropdownCtrl.destroy === "function") {
            this._viewDropdownCtrl.destroy();
        }

        this._viewsConfig = [];
        this._views = {};
        this._ctrls = {};
        this._elements = {};

        super.dispose && super.dispose();
    }

    /**
     * Parse child view configurations and import header/footer nodes if present.
     * @param {HTMLElement} host host element
     */
    _parseViews(host) {
        const headerNode = host.querySelector(":scope > .wx-view-header");
        if (headerNode) {
            this._views.header = headerNode;
        }

        const footerNode = host.querySelector(":scope > .wx-view-statusbar, :scope > .wx-view-footer, :scope > footer");
        if (footerNode) {
            this._views.footer = footerNode;
        }

        const viewNodes = Array.from(host.querySelectorAll(":scope > .wx-view"));

        viewNodes.forEach((node, index) => {
            const wrapper = document.createElement("div");
            wrapper.className = "wx-view-content d-flex flex-column flex-fill";

            const fragment = document.createDocumentFragment();
            while (node.firstChild) {
                fragment.appendChild(node.firstChild);
            }
            wrapper.appendChild(fragment);

            const ds = node.dataset;
            const title = ds.title || ds.label || `View ${index + 1}`;
            const description = ds.description || ds.desc || "";
            const iconCss = ds.iconCss || ds.icon || null;
            const iconImg = ds.iconImg || ds.image || null;

            const config = {
                index: index,
                title: title,
                description: description,
                iconCss: iconCss,
                iconImg: iconImg,
                contentNode: wrapper,
                container: null,
                controller: null
            };

            if (config.contentNode && config.contentNode.removeAttribute) {
                config.contentNode.removeAttribute("data-uri");
            }

            this._viewsConfig.push(config);
        });

        host.innerHTML = "";
    }

    /**
     * Build layout scaffolding.
     * @param {HTMLElement} host host element
     */
    _buildLayout(host) {
        host.classList.add("wx-view");

        if (this._layout === "togglegroup") {
            this._buildToggleBar(host);
        } else {
            this._buildToolbar(host);
        }

        if (this._views.header) {
            host.appendChild(this._views.header);
        } else {
            const headerRow = document.createElement("div");
            headerRow.className = "wx-view-header p-2";
            this._views.header = headerRow;
            host.appendChild(headerRow);
        }

        this._views.bodyWrapper = document.createElement("div");
        this._views.bodyWrapper.className = "wx-view-body flex-fill position-relative overflow-hidden d-flex";
        host.appendChild(this._views.bodyWrapper);

        this._views.masterPane = document.createElement("div");
        this._views.masterPane.className = "wx-main-pane flex-fill w-100 h-100 d-flex flex-column";
        this._views.bodyWrapper.appendChild(this._views.masterPane);

        this._buildStatusbar(host);
        this._observeHeaderFooter();
    }

    /**
     * Build the default toolbar with title/description and a dropdown.
     * @param {HTMLElement} host host element
     */
    _buildToolbar(host) {
        const tb = document.createElement("div");
        tb.className = "wx-view-toolbar d-flex align-items-center p-2 gap-2";

        const titleGroup = document.createElement("div");
        titleGroup.className = "d-flex align-items-center me-auto overflow-hidden";

        this._elements.icon = document.createElement("span");
        this._elements.icon.className = "me-2 text-primary d-flex align-items-center";
        titleGroup.appendChild(this._elements.icon);

        const titleWrapper = document.createElement("div");
        titleWrapper.className = "d-flex flex-column text-truncate";

        this._elements.title = document.createElement("h5");
        this._elements.title.className = "mb-0 text-truncate";
        titleWrapper.appendChild(this._elements.title);

        this._elements.desc = document.createElement("small");
        this._elements.desc.className = "text-muted text-truncate";
        titleWrapper.appendChild(this._elements.desc);

        titleGroup.appendChild(titleWrapper);
        tb.appendChild(titleGroup);

        const dropdownHost = document.createElement("div");
        dropdownHost.dataset.icon = "fa fa-layer-group";
        this._viewDropdownHost = dropdownHost;
        tb.appendChild(dropdownHost);

        host.appendChild(tb);
        this._views.toolbar = tb;
    }

    /**
     * Build the toggle bar used by the togglegroup layout.
     * @param {HTMLElement} host host element
     */
    _buildToggleBar(host) {
        const tb = document.createElement("div");
        tb.className = "wx-view-toolbar wx-view-togglegroup d-flex align-items-center p-2 gap-2";

        const group = document.createElement("div");
        group.className = "btn-group";
        group.setAttribute("role", "group");

        tb.appendChild(group);
        host.appendChild(tb);

        this._views.toolbar = tb;
        this._elements.toggleGroup = group;
    }

    /**
     * Build status bar (footer).
     * @param {HTMLElement} host host element
     */
    _buildStatusbar(host) {
        if (this._views.footer) {
            host.appendChild(this._views.footer);
            return;
        }

        const sb = document.createElement("div");
        sb.className = "wx-view-statusbar d-flex align-items-center p-1 small px-3";

        const footerRight = document.createElement("div");
        footerRight.className = "wx-view-footer-right d-flex align-items-center gap-2";
        sb.appendChild(footerRight);

        host.appendChild(sb);
        this._views.footer = sb;
    }

    /**
     * Initialize sub-views and the active switcher (dropdown or toggle bar).
     */
    _initSubViews() {
        this._viewsConfig.forEach(cfg => {
            const container = document.createElement("div");
            container.className = "wx-view-container h-100 w-100 d-none";

            if (cfg.contentNode) {
                container.appendChild(cfg.contentNode);
            }
            this._views.masterPane.appendChild(container);
            cfg.container = container;

            if (cfg.contentNode && cfg.contentNode.controller) {
                cfg.controller = cfg.contentNode.controller;
            }
        });

        if (this._layout === "togglegroup") {
            this._initToggleButtons();
        } else {
            this._initDropdown();
        }

        this._updateHeaderFooterBorders();
    }

    /**
     * Populate the dropdown for the default layout.
     */
    _initDropdown() {
        const fragment = document.createDocumentFragment();

        this._viewsConfig.forEach(cfg => {
            const itemEl = document.createElement("a");
            itemEl.className = "wx-dropdown-item";
            itemEl.href = "#";
            itemEl.setAttribute("data-uri", `wx-switch:${cfg.index}`);
            if (cfg.iconCss) {
                itemEl.setAttribute("data-icon", cfg.iconCss);
            }
            itemEl.textContent = cfg.title;
            fragment.appendChild(itemEl);
        });

        if (this._viewDropdownHost) {
            this._viewDropdownHost.appendChild(fragment);
        }

        this._viewDropdownCtrl = new webexpress.webui.DropdownCtrl(this._viewDropdownHost);

        this._viewDropdownHost.addEventListener(webexpress.webui.Event.CLICK_EVENT, (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            const detail = ev.detail || {};
            if (detail && detail.sender === this._viewDropdownHost && detail.item && detail.item.uri) {
                const uri = detail.item.uri;
                if (typeof uri === "string" && uri.indexOf("wx-switch:") === 0) {
                    const idx = parseInt(uri.split(":")[1], 10);
                    if (!Number.isNaN(idx)) {
                        this.switchView(idx);
                    }
                }
            }
        });
    }

    /**
     * Build toggle buttons for the togglegroup layout.
     */
    _initToggleButtons() {
        const group = this._elements.toggleGroup;
        if (!group) {
            return;
        }

        this._elements.toggleButtons = this._viewsConfig.map(cfg => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-outline-primary";
            btn.dataset.index = cfg.index;
            btn.title = cfg.title;

            if (cfg.iconCss) {
                const icon = document.createElement("i");
                icon.className = `${cfg.iconCss} me-1`;
                btn.appendChild(icon);
            } else if (cfg.iconImg) {
                const img = document.createElement("img");
                img.src = cfg.iconImg;
                img.style.height = "16px";
                img.style.width = "auto";
                img.className = "me-1";
                btn.appendChild(img);
            }

            const label = document.createElement("span");
            label.textContent = cfg.title;
            btn.appendChild(label);

            btn.addEventListener("click", (ev) => {
                ev.preventDefault();
                this.switchView(cfg.index);
            });

            group.appendChild(btn);
            return btn;
        });
    }

    /**
     * Observe header and footer for content changes.
     */
    _observeHeaderFooter() {
        if (this._headerObserver || this._footerObserver) {
            return;
        }

        const observerCallback = () => {
            this._updateHeaderFooterBorders();
        };

        const config = { childList: true, subtree: true, characterData: true };

        if (this._views.header) {
            this._headerObserver = new MutationObserver(observerCallback);
            this._headerObserver.observe(this._views.header, config);
        }

        if (this._views.footer) {
            this._footerObserver = new MutationObserver(observerCallback);
            this._footerObserver.observe(this._views.footer, config);
        }
    }

    /**
     * Update header/footer border classes.
     */
    _updateHeaderFooterBorders() {
        const updateBorder = (el, className) => {
            if (el) {
                if (this._hasVisibleContent(el)) {
                    el.classList.add(className);
                } else {
                    el.classList.remove(className);
                }
            }
        };

        updateBorder(this._views.header, "border-bottom");
        updateBorder(this._views.footer, "border-top");
    }

    /**
     * Check if element contains content.
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    _hasVisibleContent(el) {
        if (!el) {
            return false;
        }
        if (el.children.length > 0) {
            return true;
        }
        return (el.textContent || "").trim().length > 0;
    }

    /**
     * Switch active view and save state.
     * @param {number} index target view index
     */
    switchView(index) {
        if (index < 0 || index >= this._viewsConfig.length) {
            return;
        }

        // save to cookie
        this._setCookie(this._storageKey, index.toString(), 30);

        if (this._activeViewIndex >= 0) {
            const oldCfg = this._viewsConfig[this._activeViewIndex];
            if (oldCfg.container) {
                oldCfg.container.classList.add("d-none");
            }

            this._dispatch(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
                visible: false,
                index: this._activeViewIndex
            });
        }

        this._activeViewIndex = index;
        const cfg = this._viewsConfig[index];

        if (cfg.container) {
            cfg.container.classList.remove("d-none");
        }
        this._ctrls.activeMaster = cfg.controller;

        if (this._layout === "togglegroup") {
            this._updateToggleButtonStates();
        } else {
            this._updateToolbarMetadata(cfg);
        }

        if (cfg.contentNode && cfg.contentNode.children.length > 0) {
            const element = cfg.contentNode.children[0];
            const obj = webexpress.webui.Controller.getInstanceByElement(element);
            if (obj && typeof obj.update === "function") {
                obj.update();
            }
        }

        this._dispatch(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
            visible: true,
            index: index
        });
    }

    /**
     * Update title, description and icon shown in the default toolbar.
     * @param {Object} cfg active view configuration
     */
    _updateToolbarMetadata(cfg) {
        if (this._elements.title) {
            this._elements.title.textContent = cfg.title;
        }
        if (this._elements.desc) {
            this._elements.desc.textContent = cfg.description;
        }
        if (this._elements.icon) {
            this._elements.icon.innerHTML = "";
            if (cfg.iconCss) {
                const i = document.createElement("i");
                i.className = `${cfg.iconCss} fa-lg`;
                this._elements.icon.appendChild(i);
            } else if (cfg.iconImg) {
                const img = document.createElement("img");
                img.src = cfg.iconImg;
                img.style.height = "24px";
                img.style.width = "auto";
                this._elements.icon.appendChild(img);
            }
        }
    }

    /**
     * Reflect the active view in the toggle bar.
     */
    _updateToggleButtonStates() {
        const buttons = this._elements.toggleButtons || [];
        buttons.forEach(btn => {
            const idx = parseInt(btn.dataset.index, 10);
            const isActive = idx === this._activeViewIndex;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    /**
     * Sets a cookie with the given name, value, and expiration days.
     * @param {string} name - Name of the cookie.
     * @param {string} value - Value of the cookie.
     * @param {number} days - Expiration in days.
     */
    _setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    }

    /**
     * Gets the value of a cookie by name.
     * @param {string} name - Name of the cookie.
     * @returns {string|null} The cookie value or null if not found.
     */
    _getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(";");
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    }
};

// register the class with the controller
webexpress.webui.Controller.registerClass("wx-webui-view", webexpress.webui.ViewCtrl);
