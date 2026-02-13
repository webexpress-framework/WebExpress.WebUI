/**
 * ViewCtrl - Simple Multi-View Switcher with optional Split Detail Pane.
 */
webexpress.webui.ViewCtrl = class extends webexpress.webui.Ctrl {

    // core state
    _viewsConfig = [];
    _activeViewIndex = -1;

    // dropdown control instance and host element
    _viewDropdownCtrl = null;
    _viewDropdownHost = null;

    // mutation observers for header/footer
    _headerObserver = null;
    _footerObserver = null;

    // event handler references (for cleanup)
    _handlers = {
        resize: null,
        selection: null,
        dropdownClick: null,
        navInterceptor: null,
        detailToggle: null
    };

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

        this._parseViews(element);
        this._buildLayout(element);
        this._initSubViews();
        this._setupEvents();

        // use requestAnimationFrame to ensure dom is ready before switching
        requestAnimationFrame(() => {
            if (this._viewsConfig.length > 0) {
                this.switchView(0);
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

        // remove event listeners
        const element = this._element || this.element;
        if (element && this._handlers.selection) {
            element.removeEventListener("wx-select-row", this._handlers.selection);
            element.removeEventListener("wx-select-item", this._handlers.selection);
            element.removeEventListener("wx-node-click", this._handlers.selection);
        }

        if (this._handlers.dropdownClick) {
            document.removeEventListener(webexpress.webui.Event.CLICK_EVENT || "wx-click", this._handlers.dropdownClick);
        }

        if (this._handlers.navInterceptor) {
            document.removeEventListener("click", this._handlers.navInterceptor, true);
        }

        // destroy child controllers
        if (this._viewDropdownCtrl && typeof this._viewDropdownCtrl.destroy === "function") {
            this._viewDropdownCtrl.destroy();
        }
        this._teardownDetailStructure();

        super.dispose && super.dispose();
    }

    /**
     * Parse child view configurations.
     * - accepts data-title or data-label for title
     * - accepts data-iconCss or data-icon for icon classes
     * - preserves arbitrary markup inside .wx-view by wrapping it when no known
     *   specialized child is present
     * @param {HTMLElement} host host element
     */
    _parseViews(host) {
        // collect direct child .wx-view elements
        const viewNodes = Array.from(host.querySelectorAll(":scope > .wx-view"));
        const knownSelectors = [
            { type: "table", selector: ".wx-webapp-table, .wx-table" },
            { type: "tile", selector: ".wx-webapp-tile, .wx-tile" },
            { type: "graph", selector: ".wx-webapp-graph, .wx-graph" },
            { type: "frame", selector: ".wx-frame" }
        ];

        viewNodes.forEach((node, index) => {
            let type = "unknown";
            let contentNode = null;

            // attempt to find known content elements using configuration array
            for (const item of knownSelectors) {
                const found = node.querySelector(item.selector);
                if (found) {
                    type = item.type;
                    contentNode = found;
                    break;
                }
            }

            // if no recognized content node found, move all child nodes into a wrapper
            if (!contentNode) {
                const wrapper = document.createElement("div");
                wrapper.className = "wx-view-content";
                // utilize document fragment for efficient dom manipulation
                const fragment = document.createDocumentFragment();
                while (node.firstChild) {
                    fragment.appendChild(node.firstChild);
                }
                wrapper.appendChild(fragment);
                contentNode = wrapper;
            }

            // normalize dataset keys
            const ds = node.dataset;
            const title = ds.title || ds.label || `View ${index + 1}`;
            const description = ds.description || ds.desc || "";
            const iconCss = ds.iconCss || ds.icon || null;
            const iconImg = ds.iconImg || null;
            const hasDetails = ((ds.hasDetails || "").trim().toLowerCase() === "true");

            const config = {
                index: index,
                type: type,
                title: title,
                description: description,
                iconCss: iconCss,
                iconImg: iconImg,
                hasDetails: hasDetails,
                contentNode: contentNode,
                container: null,
                controller: null
            };

            // clean up metadata attributes from content
            if (config.contentNode && config.contentNode.removeAttribute) {
                config.contentNode.removeAttribute("data-uri");
            }

            this._viewsConfig.push(config);
        });

        // clear host so layout can be built cleanly
        host.innerHTML = "";
    }

    /**
     * Build layout scaffolding.
     * @param {HTMLElement} host host element
     */
    _buildLayout(host) {
        host.classList.add("wx-view");

        this._buildToolbar(host);

        // create a flexible header area
        const headerRow = document.createElement("div");
        headerRow.className = "wx-header p-2";
        this._views.header = headerRow;
        host.appendChild(headerRow);

        this._views.bodyWrapper = document.createElement("div");
        this._views.bodyWrapper.className = "wx-view-body flex-fill position-relative overflow-hidden d-flex";
        host.appendChild(this._views.bodyWrapper);

        this._views.masterPane = document.createElement("div");
        this._views.masterPane.className = "wx-main-pane";
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

        // create a host element for dropdown
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
        const sb = document.createElement("div");
        sb.className = "wx-view-statusbar d-flex align-items-center p-1 small px-3";

        const footerRight = document.createElement("div");
        footerRight.className = "wx-footer-right d-flex align-items-center gap-2";
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

            // map controller reference if available
            if (cfg.contentNode && cfg.contentNode.controller) {
                cfg.controller = cfg.contentNode.controller;
            }

            // create dropdown item
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

        // append all items at once
        if (this._viewDropdownHost) {
            this._viewDropdownHost.appendChild(dropdownFragment);
        }

        // instantiate the dropdown control
        if (this._viewDropdownHost && webexpress.webui.DropdownCtrl) {
            this._viewDropdownCtrl = new webexpress.webui.DropdownCtrl(this._viewDropdownHost);
            this._setupDropdownEvents();
        }

        this._setupNavInterceptor();
        this._updateHeaderFooterBorders();
    }

    /**
     * Setup events for dropdown interaction.
     */
    _setupDropdownEvents() {
        this._handlers.dropdownClick = (ev) => {
            const detail = ev.detail || {};
            // ensure event comes from this dropdown instance
            if (detail && detail.sender === this._viewDropdownHost && detail.item && detail.item.uri) {
                const uri = detail.item.uri;
                if (typeof uri === "string" && uri.indexOf("wx-switch:") === 0) {
                    const idx = parseInt(uri.split(":")[1], 10);
                    if (!Number.isNaN(idx)) {
                        this.switchView(idx);
                    }
                }
            }
        };
        document.addEventListener(webexpress.webui.Event.CLICK_EVENT || "wx-click", this._handlers.dropdownClick);
    }

    /**
     * Setup navigation interceptor for custom scheme.
     */
    _setupNavInterceptor() {
        this._handlers.navInterceptor = (ev) => {
            const anchor = ev.target && ev.target.closest ? ev.target.closest("a") : null;
            if (!anchor) {
                return;
            }
            const href = anchor.getAttribute("href") || anchor.getAttribute("data-uri") || "";
            if (typeof href === "string" && href.indexOf("wx-switch:") === 0) {
                ev.preventDefault();
                const idx = parseInt(href.split(":")[1], 10);
                if (!Number.isNaN(idx)) {
                    this.switchView(idx);
                }
            }
        };
        document.addEventListener("click", this._handlers.navInterceptor, true);
    }

    /**
     * Setup global events.
     */
    _setupEvents() {
        const element = this._element || this.element;
        if (!element) {
            console.error("ViewCtrl: Element not attached during setupEvents.");
            return;
        }

        this._handlers.selection = (e) => this._handleSelection(e);
        element.addEventListener("wx-select-row", this._handlers.selection);
        element.addEventListener("wx-select-item", this._handlers.selection);
        element.addEventListener("wx-node-click", this._handlers.selection);
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
        if (!el) return false;

        // fast check: if children exist, assume content
        if (el.children.length > 0) return true;

        // slow check: verify text content
        return (el.textContent || "").trim().length > 0;
    }

    /**
     * Ensure detail structure exists (lazy creation).
     */
    _ensureDetailStructure() {
        if (this._views.detailPane && this._views.splitHost) {
            return;
        }

        const splitHost = document.createElement("div");
        splitHost.dataset.orientation = "horizontal";
        splitHost.dataset.saveState = "true";
        splitHost.dataset.order = "main-side";

        if (this._views.bodyWrapper && this._views.bodyWrapper.parentNode) {
            this._views.bodyWrapper.parentNode.replaceChild(splitHost, this._views.bodyWrapper);
        }
        
        this._views.bodyWrapper = splitHost;
        this._views.splitHost = splitHost;
        this._views.detailPane = document.createElement("div");
        this._views.detailPane.className = "wx-side-pane";
        this._ctrls.detailFrame = new webexpress.webui.FrameCtrl(this._views.detailPane);
        this._views.detailPane.innerHTML = `
            <div class="d-flex h-100 align-items-center justify-content-center text-muted">
                <div class="text-center p-4">
                    <i class="fa-regular fa-file-lines fa-3x mb-3 text-secondary"></i><br>
                    <span>Select an item to view details.</span>
                </div>
            </div>`;

        this._views.splitHost.appendChild(this._views.masterPane);
        this._views.splitHost.appendChild(this._views.detailPane);
        
        if (webexpress.webui.SplitCtrl) {
            this._ctrls.split = new webexpress.webui.SplitCtrl(this._views.splitHost);
            // set initial splitter sizes to 50:50 if supported
            if (typeof this._ctrls.split.setSizes === "function") {
                this._ctrls.split.setSizes([50, 50]);
            }
        }

        
    }

    /**
     * Remove detail structure when not needed.
     */
    _teardownDetailStructure() {
        // remove detail pane
        if (this._views.detailPane && this._views.detailPane.parentNode) {
            this._views.detailPane.parentNode.removeChild(this._views.detailPane);
        }
        this._views.detailPane = null;

        // destroy split controller
        if (this._ctrls.split) {
            if (typeof this._ctrls.split.destroy === "function") {
                this._ctrls.split.destroy();
            }
            this._ctrls.split = null;
        }
        this._ctrls.detailFrame = null;

        // restore original body layout
        if (this._views.splitHost && this._views.splitHost.parentNode) {
            const parent = this._views.splitHost.parentNode;
            const bodyWrapper = document.createElement("div");
            bodyWrapper.className = "wx-view-body flex-fill position-relative overflow-hidden d-flex";

            bodyWrapper.appendChild(this._views.masterPane);
            parent.replaceChild(bodyWrapper, this._views.splitHost);

            this._views.splitHost = null;
            this._views.bodyWrapper = bodyWrapper;
        }
    }

    /**
     * Switch active view.
     * @param {number} index target view index
     */
    switchView(index) {
        if (index < 0 || index >= this._viewsConfig.length) {
            return;
        }

        // hide current view
        if (this._activeViewIndex >= 0) {
            const oldCfg = this._viewsConfig[this._activeViewIndex];
            oldCfg.container?.classList.add("d-none");
        }

        this._activeViewIndex = index;
        const cfg = this._viewsConfig[index];

        // show new view
        cfg.container?.classList.remove("d-none");
        this._ctrls.activeMaster = cfg.controller;

        // update ui elements
        if (this._elements.title) this._elements.title.textContent = cfg.title;
        if (this._elements.desc) this._elements.desc.textContent = cfg.description;
        if (this._elements.viewBtnLabel) this._elements.viewBtnLabel.textContent = cfg.title;

        // update icon
        if (this._elements.icon) {
            let iconHtml = "";
            if (cfg.iconCss) {
                iconHtml = `<i class="${cfg.iconCss} fa-lg"></i>`;
            } else if (cfg.iconImg) {
                iconHtml = `<img src="${cfg.iconImg}" style="height:24px;width:auto;">`;
            }
            this._elements.icon.innerHTML = iconHtml;
        }

        this._handleDetailState(cfg);

        // notify external listeners
        const evt = new CustomEvent("wx-view-switched", { detail: { index: index, config: cfg } });
        this._element.dispatchEvent(evt);
    }

    /**
     * Handle the state of the detail pane based on configuration.
     * @param {Object} cfg view configuration
     */
    _handleDetailState(cfg) {
        if (cfg.hasDetails) {
            this._ensureDetailStructure();

            // default state for detail view is visible
            const isHidden = this._views.detailPane?.classList.contains("d-none");

            if (isHidden) {
                this._views.detailPane.classList.remove("d-none");
            }

            this._updateToggleBtnState(true);

            // reset splitter
            if (isHidden && typeof this._ctrls.split?.setSizes === "function") {
                this._ctrls.split.setSizes([50, 50]);
            }
        } else {
            this._teardownDetailStructure();
        }

        if (this._ctrls.split) {
            requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
        }
    }

    /**
     * Handle selection and open detail if available.
     * @param {Event} e selection event
     */
    _handleSelection(e) {
        const cfg = this._viewsConfig[this._activeViewIndex];
        if (!cfg || !cfg.hasDetails) {
            return;
        }

        this._ensureDetailStructure();
        if (!this._ctrls.detailFrame || !this._views.detailPane) {
            return;
        }

        const data = e.detail.row || e.detail.item || e.detail.data;
        if (!data) {
            return;
        }

        const targetUri = data.detailUri || data.uri || data.self;

        if (targetUri) {
            if (this._views.detailPane.classList.contains("d-none")) {
                this._toggleDetails(true);
            }
            if (typeof this._ctrls.detailFrame.setUri === "function") {
                this._ctrls.detailFrame.setUri(targetUri, true);
            }
        }
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
        if (!pane) return;

        let shouldShow = pane.classList.contains("d-none");
        if (forceOpen) shouldShow = true;

        if (shouldShow) {
            pane.classList.remove("d-none");
            this._updateToggleBtnState(true);
            if (typeof this._ctrls.split?.setSizes === "function") {
                this._ctrls.split.setSizes([50, 50]);
            }
        } else {
            pane.classList.add("d-none");
            this._updateToggleBtnState(false);
        }

        if (this._ctrls.split) {
            window.dispatchEvent(new Event("resize"));
        }
    }
};

// register the class with the controller
webexpress.webui.Controller.registerClass("wx-webui-view", webexpress.webui.ViewCtrl);