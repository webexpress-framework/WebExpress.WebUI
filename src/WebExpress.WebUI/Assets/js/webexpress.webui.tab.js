/**
 * Controller for interactive tab navigation. The tab headers, the tools beside them and
 * the switching of the panes are rendered from the state (the tabs and the active one);
 * the panes keep the content and the controls the server rendered into them, the view
 * only places them and marks the active one. A subclass extends the view through the
 * hooks _renderTools, _renderHeaderExtras, _renderContentExtras and the tab header hooks
 * (_tabItemProps, _tabLinkProps, _tabLinkLead, _tabItemTail).
 * Events:
 *  - webexpress.webui.Event.SELECTED_TAB_EVENT
 */
webexpress.webui.TabCtrl = class extends webexpress.webui.StateCtrl {

    // the panes keep their server rendered content and controls; the view places them
    _panes = new Map();
    _paneClasses = new Map();

    // the server rendered toolbar and its controller
    _toolbarElement = null;
    _toolbarCtrl = null;

    // nodes captured while rendering, for the keyboard and the subclasses
    _navElement = null;
    _headerElement = null;
    _toolsElement = null;
    _contentElement = null;

    _onNavKeyDown = (e) => this._onTabListKeyDown(e);

    /**
     * Creates a tab controller for the root element.
     * @param {HTMLElement} element Root node containing .wx-tab-view children.
     * @param {object} [options={}] Options of the StateCtrl base, such as the store a
     *     WebApp subclass hands in.
     */
    constructor(element, options = {}) {
        // the authored panes are read before the first render takes the host over
        const authored = webexpress.webui.TabCtrl._readTabs(element);

        super(element, options);

        this._layout = element.dataset.layout || "default";
        this._storageKey = element.dataset.persistKey || (element.id ? `wx-tab:${element.id}` : null);
        element.classList.add("wx-tab-container");

        for (const pane of authored.panes) {
            this._panes.set(pane.id, pane);
            this._paneClasses.set(pane.id, pane.className);
        }

        if (authored.toolbar) {
            this._toolbarElement = authored.toolbar;
            this._toolbarCtrl = new webexpress.webui.ToolbarCtrl(authored.toolbar);
        }

        this.setState({ tabs: authored.tabs, activeTabId: null });
        // the first render reads the state directly, a notification would only repeat it
        this._store.flush();

        // a subclass renders through hooks that read its own fields, which exist only once
        // its constructor runs, so it opens the control at the end of that constructor
        if (new.target === webexpress.webui.TabCtrl) {
            this._open();
        }
    }

    /**
     * Reads the authored tabs of a host: one tab per .wx-tab-view child, whose element
     * stays the pane of the tab, and the optional toolbar beside the tabs.
     * @param {HTMLElement} element The host element.
     * @returns {object} The tabs, their pane elements and the toolbar element or null.
     */
    static _readTabs(element) {
        const children = Array.from(element.childNodes).filter((node) => node.nodeType === 1);
        const tabs = [];
        const panes = [];

        children.filter((node) => node.classList.contains("wx-tab-view")).forEach((pane, i) => {
            pane.id = pane.id || "wx-tab-" + Date.now() + "-" + i;

            tabs.push({
                id: pane.id,
                label: pane.dataset.label || "",
                icon: pane.dataset.icon || null,
                color: pane.dataset.color || null,
                badge: pane.dataset.badge || null,
                badgeColor: pane.dataset.badgeColor || null,
                badgeStyle: pane.dataset.badgeStyle || null,
                primaryAction: pane.dataset.wxPrimaryAction || null,
                primaryTarget: pane.dataset.wxPrimaryTarget || null
            });

            // the authored view becomes a WebExpress tab pane
            pane.classList.remove("wx-tab-view");
            pane.classList.add("tab-pane", "fade");
            pane.setAttribute("role", "tabpanel");
            pane.setAttribute("aria-labelledby", pane.id + "-tab");
            // a panel without a focusable child is otherwise skipped by the tab key
            if (!pane.hasAttribute("tabindex")) { pane.setAttribute("tabindex", "0"); }

            panes.push(pane);
        });

        const toolbar = children.find((node) => node.classList.contains("wx-tab-toolbar")) || null;

        return { tabs: tabs, panes: panes, toolbar: toolbar };
    }

    /**
     * Gets the tabs, in their order.
     * @returns {Array<object>} The tab models.
     */
    get _tabs() {
        return this.state.tabs;
    }

    /**
     * Gets the id of the selected tab.
     * @returns {string|null} The id, or null without tabs.
     */
    get _activeTabId() {
        return this.state.activeTabId;
    }

    /**
     * Renders the control the first time and selects the remembered tab, or the first.
     */
    _open() {
        this.mount();

        const tabs = this.state.tabs;
        if (tabs.length > 0) {
            const stored = webexpress.webui.LocalStorage.getItem(this._storageKey);
            this.selectTab(tabs.some(tab => tab.id === stored) ? stored : tabs[0].id);
        }
    }

    /**
     * Describes the control: the header row with the tab list and the tools beside it,
     * and the pane host. A tab list may hold nothing but tabs, so the tools sit next to
     * it rather than in it.
     * @param {object} state The current state.
     * @returns {Array<object>} The virtual node tree of the host.
     */
    render(state) {
        const h = webexpress.webui.h;

        return [
            h("div", { key: "header", class: this._headerClass(), ref: (el) => { this._headerElement = el; } },
                h("ul", {
                    key: "nav",
                    class: this._navClass(),
                    role: "tablist",
                    ref: (el) => { this._navElement = el; },
                    on: { keydown: this._onNavKeyDown }
                }, state.tabs.map((tab) => this._renderTabHeader(state, tab))),
                h("div", { key: "tools", class: "wx-tab-tools", ref: (el) => { this._toolsElement = el; } },
                    this._renderTools(state)),
                this._renderHeaderExtras(state)),
            h("div", { key: "content", class: this._contentClass(), ref: (el) => { this._contentElement = el; } },
                state.tabs.map((tab) => this._renderPane(state, tab)),
                this._renderContentExtras(state))
        ];
    }

    /**
     * Gets the classes of the header row.
     * @returns {string} The css classes.
     */
    _headerClass() {
        return "wx-tab-header";
    }

    /**
     * Gets the classes of the tab list, which carry the layout.
     * @returns {string} The css classes.
     */
    _navClass() {
        if (this._layout === "underline") {
            return "nav wx-tab-nav nav-underline";
        }
        return this._layout === "pill" ? "nav wx-tab-nav nav-pills" : "nav wx-tab-nav nav-tabs";
    }

    /**
     * Gets the classes of the pane host.
     * @returns {string} The css classes.
     */
    _contentClass() {
        // horizontal padding only: the vertical one belongs to the stylesheet, where it
        // can be tuned per edge. as a p-3 utility it carried !important and no rule
        // could reach it
        return this._layout === "default" || this._layout === "tab"
            ? "tab-content wx-tab-content px-3 border border-top-0"
            : "tab-content wx-tab-content px-3";
    }

    /**
     * Describes the header of one tab.
     * @param {object} state The current state.
     * @param {object} tab The tab model.
     * @returns {object} The list item virtual node.
     */
    _renderTabHeader(state, tab) {
        const h = webexpress.webui.h;
        const active = tab.id === state.activeTabId;
        const item = this._tabItemProps(state, tab) || {};
        const link = this._tabLinkProps(state, tab) || {};
        const dataset = { tabId: tab.id };

        // map custom action attributes if present
        if (tab.primaryAction !== null) {
            dataset.wxPrimaryAction = tab.primaryAction;
        }
        if (tab.primaryTarget !== null) {
            dataset.wxPrimaryTarget = tab.primaryTarget;
        }

        return h("li", Object.assign({}, item, {
            key: tab.id,
            class: ["nav-item"].concat(item.class || []),
            role: "presentation"
        }),
            h("button", Object.assign({}, link, {
                class: ["nav-link", active && "active"],
                type: "button",
                id: tab.id + "-tab",
                role: "tab",
                "aria-controls": tab.id,
                "aria-selected": active ? "true" : "false",
                // one tab stop for the list; the arrow keys walk the tabs
                tabindex: active ? "0" : "-1",
                dataset: dataset,
                on: Object.assign({}, link.on, {
                    click: this._handler("select", tab.id, () => (e) => {
                        e.preventDefault();
                        this.selectTab(tab.id);
                    })
                })
            }),
                this._tabLinkLead(state, tab),
                tab.icon !== null && h("i", { key: "icon", class: [tab.icon, "me-2", tab.color] }),
                tab.label !== "" ? tab.label : null,
                // a color class or an inline style overrides the neutral default
                tab.badge !== null && tab.badge !== "" && h("span", {
                    key: "badge",
                    class: ["wx-tab-badge badge"].concat(String(tab.badgeColor || "").split(/\s+/)),
                    style: tab.badgeStyle || ""
                }, tab.badge)),
            this._tabItemTail(state, tab));
    }

    /**
     * Gets further props of a tab header list item; the classes are added to its own.
     * @param {object} state The current state.
     * @param {object} tab The tab model.
     * @returns {object|null} The props, or null for none.
     */
    _tabItemProps(state, tab) {
        return null;
    }

    /**
     * Gets further props of a tab button; its listeners are added to the selection.
     * @param {object} state The current state.
     * @param {object} tab The tab model.
     * @returns {object|null} The props, or null for none.
     */
    _tabLinkProps(state, tab) {
        return null;
    }

    /**
     * Gets the content a tab button shows ahead of its icon and label.
     * @param {object} state The current state.
     * @param {object} tab The tab model.
     * @returns {*} Virtual nodes, or null for none.
     */
    _tabLinkLead(state, tab) {
        return null;
    }

    /**
     * Gets the content a tab header list item shows behind its button.
     * @param {object} state The current state.
     * @param {object} tab The tab model.
     * @returns {*} Virtual nodes, or null for none.
     */
    _tabItemTail(state, tab) {
        return null;
    }

    /**
     * Describes the tools beside the tab list: the authored toolbar.
     * @param {object} state The current state.
     * @returns {Array<object>} The tool items.
     */
    _renderTools(state) {
        if (this._toolbarElement === null) {
            return [];
        }

        return [webexpress.webui.h("div", { key: "toolbar", class: "wx-tab-tools-item d-flex align-items-center" },
            webexpress.webui.Renderer.adopt(this._toolbarElement))];
    }

    /**
     * Describes what the header row holds besides the tab list and the tools.
     * @param {object} state The current state.
     * @returns {*} Virtual nodes, or null for none.
     */
    _renderHeaderExtras(state) {
        return null;
    }

    /**
     * Describes what the pane host holds besides the panes.
     * @param {object} state The current state.
     * @returns {*} Virtual nodes, or null for none.
     */
    _renderContentExtras(state) {
        return null;
    }

    /**
     * Places the pane of a tab, marked when it is the active one.
     * @param {object} state The current state.
     * @param {object} tab The tab model.
     * @returns {object|null} The adopting virtual node, or null without a pane.
     */
    _renderPane(state, tab) {
        const pane = this._panes.get(tab.id);
        if (!pane) {
            return null;
        }

        const classes = this._paneClasses.get(tab.id) || "tab-pane fade";
        return webexpress.webui.Renderer.adopt(pane, {
            class: tab.id === state.activeTabId ? classes + " show active" : classes
        });
    }

    /**
     * Selects a tab by its id. A listener of the selection may measure the pane it was
     * told about, so the selection is rendered before it is announced.
     * @param {string} tabId The id of the tab to select.
     */
    selectTab(tabId) {
        // prevent redundant updates
        if (this.state.activeTabId === tabId || !this.state.tabs.some(tab => tab.id === tabId)) {
            return;
        }

        webexpress.webui.LocalStorage.setItem(this._storageKey, tabId);
        this.setState({ activeTabId: tabId });
        if (this._mounted) {
            this._store.flush();
        }

        this._dispatchTabSelectedEvent(tabId);
    }

    /**
     * Changes the label of a tab.
     * @param {string} tabId The id of the tab to relabel.
     * @param {string} label The new label.
     * @returns {boolean} Whether the tab exists.
     */
    setTabLabel(tabId, label) {
        if (!this.state.tabs.some(item => item.id === tabId)) {
            return false;
        }

        this.setState({ tabs: this.state.tabs.map((tab) => tab.id === tabId ? Object.assign({}, tab, { label: label }) : tab) });
        return true;
    }

    /**
     * Walks the tabs with the arrow keys and selects the one that receives focus, as a
     * tab list is expected to; the toolbar sitting in the same list is left to the tab key.
     * @param {KeyboardEvent} e The key event raised inside the tab list.
     */
    _onTabListKeyDown(e) {
        // only the tabs of the list, not a command a subclass may place among them
        const tabs = Array.from(this._navElement.querySelectorAll("[role=\"tab\"]")).filter(tab => tab.dataset.tabId);
        const index = tabs.indexOf(e.target.closest ? e.target.closest("[role=\"tab\"]") : null);
        if (index < 0 || tabs.length === 0) {
            return;
        }

        let next = null;
        switch (e.key) {
            case "ArrowRight":
            case "ArrowDown":
                next = (index + 1) % tabs.length;
                break;
            case "ArrowLeft":
            case "ArrowUp":
                next = (index - 1 + tabs.length) % tabs.length;
                break;
            case "Home":
                next = 0;
                break;
            case "End":
                next = tabs.length - 1;
                break;
            default:
                return;
        }

        e.preventDefault();
        tabs[next].focus({ preventScroll: true });
        this.selectTab(tabs[next].dataset.tabId);
    }

    /**
     * Dispatches the tab selected event.
     * @param {string} tabId The selected tab id.
     */
    _dispatchTabSelectedEvent(tabId) {
        this._dispatch(webexpress.webui.Event.SELECTED_TAB_EVENT, {
            tabId: tabId
        });
    }

    /**
     * Returns the toolbar controller instance associated with this tab control, if any.
     * @returns {webexpress.webui.ToolbarCtrl}
     */
    get toolbar() {
        return this._toolbarCtrl;
    }
};

// register controller class
webexpress.webui.Controller.registerClass("wx-webui-tab", webexpress.webui.TabCtrl);
