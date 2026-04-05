/**
 * ViewCtrl - Simple Multi-View Switcher with optional Split Detail Pane.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 */
webexpress.webui.ViewCtrl = class extends webexpress.webui.Ctrl {

    // core state
    _viewsConfig = [];
    _activeViewIndex = -1;
    _storageKey = "";
    _globalDetailId = null;
    _globalDetailSelector = null;

    // dropdown control instance and host element
    _viewDropdownCtrl = null;
    _viewDropdownHost = null;

    // mutation observers for header/footer
    _headerObserver = null;
    _footerObserver = null;

    // ui references
    _views = {
        toolbar: null,
        statusbar: null,
        splitHost: null,
        masterPane: null,
        detailPane: null,
        bodyWrapper: null,
        header: null,
        footer: null
    };

    _ctrls = {
        activeMaster: null,
        detailFrame: null,
        split: null
    };

    _elements = {
        title: null,
        desc: null,
        icon: null,
        viewBtnLabel: null,
        viewDropdownMenu: null,
        viewDropdownTrigger: null
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

        // read global detail id from host element
        this._globalDetailId = element.dataset.detailId || null;
        this._globalDetailSelector = element.dataset.detailSelector || null;

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
                // validate index against config length
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
        // disconnect observers
        if (this._headerObserver) {
            this._headerObserver.disconnect();
            this._headerObserver = null;
        }
        if (this._footerObserver) {
            this._footerObserver.disconnect();
            this._footerObserver = null;
        }

        // destroy child controllers
        if (this._viewDropdownCtrl && typeof this._viewDropdownCtrl.destroy === "function") {
            this._viewDropdownCtrl.destroy();
        }

        this._teardownDetailStructure();

        // clear references
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
            wrapper.className = "wx-view-content";

            const fragment = document.createDocumentFragment();
            while (node.firstChild) {
                fragment.appendChild(node.firstChild);
            }
            wrapper.appendChild(fragment);
            const contentNode = wrapper;

            const ds = node.dataset;
            const title = ds.title || ds.label || `View ${index + 1}`;
            const description = ds.description || ds.desc || "";
            const iconCss = ds.iconCss || ds.icon || null;
            const iconImg = ds.iconImg || null;
            const hasDetails = ((ds.hasDetails || "").trim().toLowerCase() === "true");

            // read sizing config from item (still per item possible) or defaults
            const detailSize = ds.detailSize || null;
            const detailMin = ds.detailMinSide ? parseInt(ds.detailMinSide, 10) : null;
            const detailMax = ds.detailMaxSide ? parseInt(ds.detailMaxSide, 10) : null;

            const config = {
                index: index,
                type: null,
                title: title,
                description: description,
                iconCss: iconCss,
                iconImg: iconImg,
                hasDetails: hasDetails,
                detailSize: detailSize,
                detailMin: detailMin,
                detailMax: detailMax,
                contentNode: contentNode,
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

        this._buildToolbar(host);

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
        this._views.masterPane.className = "wx-main-pane flex-fill w-100 h-100";
        this._views.bodyWrapper.appendChild(this._views.masterPane);

        this._buildStatusbar(host);
        this._observeHeaderFooter();
    }

    /**
     * Build toolbar.
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
     * Initialize sub-views.
     */
    _initSubViews() {
        const dropdownFragment = document.createDocumentFragment();

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

            const itemEl = document.createElement("a");
            itemEl.className = "wx-dropdown-item";
            itemEl.href = "#";
            itemEl.setAttribute("data-uri", `wx-switch:${cfg.index}`);
            if (cfg.iconCss) {
                itemEl.setAttribute("data-icon", cfg.iconCss);
            }
            itemEl.textContent = cfg.title;
            dropdownFragment.appendChild(itemEl);
        });

        if (this._viewDropdownHost) {
            this._viewDropdownHost.appendChild(dropdownFragment);
        }

        this._viewDropdownCtrl = new webexpress.webui.DropdownCtrl(this._viewDropdownHost);
        this._setupDropdownEvents();

        this._updateHeaderFooterBorders();
    }

    /**
     * Setup events for dropdown interaction.
     */
    _setupDropdownEvents() {
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
     * Ensure detail structure exists (lazy creation).
     * Uses the global detail id if configured on the host element.
     */
    _ensureDetailStructure() {
        if (this._views.detailPane && this._views.splitHost) {
            return;
        }

        const splitHost = document.createElement("div");
        splitHost.dataset.orientation = "horizontal";
        splitHost.dataset.saveState = "true";
        splitHost.dataset.order = "main-side";
        splitHost.className = "h-100 w-100";

        // generate base id for sub-components based on controller id
        const baseId = this._element.id || `wx_view_${Math.floor(Math.random() * 10000)}`;

        // assign id to splitter host to enable cookie state persistence in split-controller
        splitHost.id = `${baseId}-split`;

        // apply configuration from current view if available for initial setup
        const activeCfg = this._viewsConfig[this._activeViewIndex];
        if (activeCfg) {
            if (activeCfg.detailSize) {
                splitHost.dataset.size = activeCfg.detailSize;
            }
            if (activeCfg.detailMin) {
                splitHost.dataset.minSide = activeCfg.detailMin;
            }
            if (activeCfg.detailMax) {
                splitHost.dataset.maxSide = activeCfg.detailMax;
            }
        }

        if (this._views.bodyWrapper && this._views.bodyWrapper.parentNode) {
            this._views.bodyWrapper.parentNode.replaceChild(splitHost, this._views.bodyWrapper);
        }

        this._views.bodyWrapper = splitHost;
        this._views.splitHost = splitHost;

        // IMPORTANT: remove w-100 and flex-fill so splitter can control the width
        this._views.masterPane.className = "wx-main-pane";

        this._views.detailPane = document.createElement("div");
        this._views.detailPane.className = "wx-side-pane wx-webui-frame";

        // assign the global id if present, otherwise generate one based on host id
        if (this._globalDetailId) {
            this._views.detailPane.id = this._globalDetailId;
        } else {
            this._views.detailPane.id = `${baseId}-detail-frame`;
        }

        if (this._globalDetailSelector) {
            this._views.detailPane.dataset.selector = this._globalDetailSelector;
        }

        const placeholderWrapper = document.createElement("div");
        placeholderWrapper.className = "d-flex h-100 align-items-center justify-content-center text-muted";

        const centerBox = document.createElement("div");
        centerBox.className = "text-center p-4";

        const icon = document.createElement("i");
        icon.className = "fa-regular fa-file-lines fa-3x mb-3 text-secondary";

        const br = document.createElement("br");
        const span = document.createElement("span");
        span.textContent = "Select an item to view details.";

        centerBox.appendChild(icon);
        centerBox.appendChild(br);
        centerBox.appendChild(span);
        placeholderWrapper.appendChild(centerBox);
        this._views.detailPane.appendChild(placeholderWrapper);

        this._views.splitHost.appendChild(this._views.masterPane);
        this._views.splitHost.appendChild(this._views.detailPane);

        if (webexpress.webui.SplitCtrl) {
            this._ctrls.split = new webexpress.webui.SplitCtrl(this._views.splitHost);
        }
    }

    /**
     * Remove detail structure when not needed.
     */
    _teardownDetailStructure() {
        if (this._views.detailPane && this._views.detailPane.parentNode) {
            this._views.detailPane.parentNode.removeChild(this._views.detailPane);
        }
        this._views.detailPane = null;

        if (this._ctrls.split) {
            if (typeof this._ctrls.split.destroy === "function") {
                this._ctrls.split.destroy();
            }
            this._ctrls.split = null;
        }

        if (this._views.splitHost && this._views.splitHost.parentNode) {
            const parent = this._views.splitHost.parentNode;

            const bodyWrapper = document.createElement("div");
            bodyWrapper.className = "wx-view-body flex-fill position-relative overflow-hidden d-flex";

            this._views.masterPane.removeAttribute("style");
            this._views.masterPane.className = "wx-main-pane flex-fill w-100 h-100";

            bodyWrapper.appendChild(this._views.masterPane);
            parent.replaceChild(bodyWrapper, this._views.splitHost);

            this._views.splitHost = null;
            this._views.bodyWrapper = bodyWrapper;
        }
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
        }

        this._dispatch(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
            visible: true,
            index: this._activeViewIndex
        });

        this._activeViewIndex = index;
        const cfg = this._viewsConfig[index];

        if (cfg.container) {
            cfg.container.classList.remove("d-none");
        }
        this._ctrls.activeMaster = cfg.controller;

        if (this._elements.title) {
            this._elements.title.textContent = cfg.title;
        }
        if (this._elements.desc) {
            this._elements.desc.textContent = cfg.description;
        }
        if (this._elements.viewBtnLabel) {
            this._elements.viewBtnLabel.textContent = cfg.title;
        }

        if (cfg.contentNode && cfg.contentNode.children.length > 0) {
            const element = cfg.contentNode.children[0];
            const obj = webexpress.webui.Controller.getInstanceByElement(element);
            if (obj && typeof obj.update === 'function') {
                obj.update();
            }
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

        this._handleDetailState(cfg);

        this._dispatch(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
            visible: true,
            index: index
        });
    }

    /**
     * Handle the state of the detail pane based on configuration.
     * @param {Object} cfg view configuration
     */
    _handleDetailState(cfg) {
        if (cfg.hasDetails) {
            this._ensureDetailStructure();

            // apply sizing constraints if defined for this specific view
            if (this._ctrls.split) {
                // if min side is defined
                if (cfg.detailMin !== null && typeof this._ctrls.split.setMinSize === "function") {
                    // index 0 for side-pane if order is side-main, but here it is main-side (index 1)
                    // wait, default is main-side, so side pane is index 1?
                    // SplitCtrl setMinSize takes index.
                    // SplitCtrl implementation handles minSide internally as property, 
                    // but we might need to expose a setter there if it changes per view.
                    // Assuming setMinSize(index, size) exists from previous context

                    // Since _paneOrder is "main-side", side pane is typically index 1 
                    // but let's assume the split controller handles 'side' identification or we pass the side index.
                    // In the SplitCtrl provided previously, setMinSize logic handles 'isSide' check.
                    // We just need to pass an index. Main is 0, Side is 1.
                    this._ctrls.split.setMinSize(1, cfg.detailMin);
                }
            }

            const isHidden = this._views.detailPane?.classList.contains("d-none");

            if (isHidden) {
                this._views.detailPane.classList.remove("d-none");
            }

            this._updateToggleBtnState(true);

        } else {
            this._teardownDetailStructure();
        }

        if (this._ctrls.split) {
            requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
        }
    }

    /**
     * Helper to update any toggle button state if one exists (placeholder).
     * @param {boolean} visible
     */
    _updateToggleBtnState(visible) {
        // placeholder
    }

    /**
     * Toggle details pane visibility.
     * @param {boolean} forceOpen force open if true
     */
    _toggleDetails(forceOpen = false) {
        const cfg = this._viewsConfig[this._activeViewIndex];
        if (!cfg || !cfg.hasDetails) {
            return;
        }

        this._ensureDetailStructure();
        const pane = this._views.detailPane;
        if (!pane) {
            return;
        }

        let shouldShow = pane.classList.contains("d-none");
        if (forceOpen) {
            shouldShow = true;
        }

        if (shouldShow) {
            pane.classList.remove("d-none");
            this._updateToggleBtnState(true);
        } else {
            pane.classList.add("d-none");
            this._updateToggleBtnState(false);
        }

        if (this._ctrls.split) {
            window.dispatchEvent(new Event("resize"));
        }
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
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
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