/**
 * Controller for interactive tab navigation: parsing markup, rendering tabs,
 * and handling tab selection state without destroying existing dom nodes.
 * Events:
 *  - webexpress.webui.Event.SELECTED_TAB_EVENT
 */
webexpress.webui.TabCtrl = class extends webexpress.webui.Ctrl {

    // model state
    _tabs = [];
    _activeTabId = null;

    // dom nodes
    _navElement = null;
    _headerElement = null;
    _toolsElement = null;
    _contentElement = null;
    _toolbarLi = null;

    // controllers
    _toolbarCtrl = null;

    /**
     * Creates a tab controller for the root element.
     * @param {HTMLElement} element Root node containing .wx-tab-view children.
     */
    constructor(element) {
        super(element);

        this._initTabs();

        // set initial active tab
        if (this._tabs.length > 0) {
            this.selectTab(this._tabs[0].id);
        }
    }

    /**
     * Initializes the tab structure by transforming existing dom nodes.
     */
    _initTabs() {
        const el = this._element;
        el.classList.add("wx-tab-container");

        const layout = el.dataset.layout || "default";

        // create navigation wrapper
        this._navElement = document.createElement("ul");

        let navClass = "nav wx-tab-nav";
        if (layout === "underline") {
            navClass += " nav-underline";
        } else if (layout === "pill") {
            navClass += " nav-pills";
        } else {
            navClass += " nav-tabs";
        }

        this._navElement.className = navClass;
        this._navElement.setAttribute("role", "tablist");
        this._navElement.addEventListener("keydown", (e) => this._onTabListKeyDown(e));

        // create content wrapper
        this._contentElement = document.createElement("div");

        // horizontal padding only: the vertical one belongs to the stylesheet, where it
        // can be tuned per edge. as a p-3 utility it carried !important and no rule
        // could reach it
        let contentClass = "tab-content wx-tab-content px-3";
        if (layout === "default" || layout === "tab") {
            contentClass += " border border-top-0";
        }
        this._contentElement.className = contentClass;

        // find all predefined tab views
        const children = Array.from(el.querySelectorAll(":scope > .wx-tab-view"));

        for (let i = 0; i < children.length; i++) {
            const pane = children[i];
            const id = pane.id || "wx-tab-" + Date.now() + "-" + i;
            pane.id = id;

            const tabData = {
                id: id,
                label: pane.dataset.label || "",
                icon: pane.dataset.icon || null,
                color: pane.dataset.color || null,
                badge: pane.dataset.badge || null,
                badgeColor: pane.dataset.badgeColor || null,
                badgeStyle: pane.dataset.badgeStyle || null,
                primaryAction: pane.dataset.wxPrimaryAction || null,
                primaryTarget: pane.dataset.wxPrimaryTarget || null,
                paneElement: pane
            };

            this._tabs.push(tabData);

            // build and append header
            const navItem = this._buildTabHeader(tabData);
            this._navElement.appendChild(navItem);

            // transform pane class list to match WebExpress tabs
            pane.classList.remove("wx-tab-view");
            pane.classList.add("tab-pane", "fade");
            pane.setAttribute("role", "tabpanel");
            pane.setAttribute("aria-labelledby", id + "-tab");
            // a panel without a focusable child is otherwise skipped by the tab key
            if (!pane.hasAttribute("tabindex")) { pane.setAttribute("tabindex", "0"); }

            // move pane into content wrapper safely
            this._contentElement.appendChild(pane);
        }

        // the header row holds the tab list and, beside it, the tools that are not tabs: a
        // tab list may hold nothing but tabs, so the toolbar sits next to it rather than in it
        this._headerElement = document.createElement("div");
        this._headerElement.className = "wx-tab-header";
        this._toolsElement = document.createElement("div");
        this._toolsElement.className = "wx-tab-tools";
        this._headerElement.appendChild(this._navElement);
        this._headerElement.appendChild(this._toolsElement);

        // find and append toolbar if it exists
        const toolbarElement = el.querySelector(":scope > .wx-tab-toolbar");
        if (toolbarElement) {
            this._toolbarCtrl = new webexpress.webui.ToolbarCtrl(toolbarElement);

            this._toolbarLi = document.createElement("div");
            this._toolbarLi.className = "wx-tab-tools-item d-flex align-items-center";
            this._toolbarLi.appendChild(toolbarElement);
            this._toolsElement.appendChild(this._toolbarLi);
        }

        el.appendChild(this._headerElement);
        el.appendChild(this._contentElement);
    }

    /**
     * Builds a tab header element.
     * @param {Object} tab Tab model.
     * @returns {HTMLElement} List item element.
     */
    _buildTabHeader(tab) {
        const li = document.createElement("li");
        li.className = "nav-item";
        li.setAttribute("role", "presentation");

        const btn = document.createElement("button");
        btn.className = "nav-link";
        btn.type = "button";
        btn.id = tab.id + "-tab";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-controls", tab.id);
        btn.setAttribute("aria-selected", "false");
        // one tab stop for the list; the arrow keys walk the tabs
        btn.setAttribute("tabindex", "-1");
        btn.dataset.tabId = tab.id;

        // map custom action attributes if present
        if (tab.primaryAction !== null) {
            btn.dataset.wxPrimaryAction = tab.primaryAction;
        }

        if (tab.primaryTarget !== null) {
            btn.dataset.wxPrimaryTarget = tab.primaryTarget;
        }

        // append icon if configured
        if (tab.icon !== null) {
            const iconEl = document.createElement("i");
            iconEl.className = tab.icon + " me-2";
            if (tab.color !== null) {
                iconEl.classList.add(tab.color);
            }
            btn.appendChild(iconEl);
        }

        // append label text
        if (tab.label !== "") {
            const textNode = document.createTextNode(tab.label);
            btn.appendChild(textNode);
        }

        // append the trailing badge if configured; a color class or an inline
        // style overrides the neutral default
        if (tab.badge !== null && tab.badge !== "") {
            const badgeEl = document.createElement("span");
            badgeEl.className = "wx-tab-badge badge";
            if (tab.badgeColor !== null) {
                badgeEl.classList.add(...String(tab.badgeColor).split(/\s+/).filter(Boolean));
            }
            if (tab.badgeStyle !== null) {
                badgeEl.style.cssText = tab.badgeStyle;
            }
            badgeEl.textContent = tab.badge;
            btn.appendChild(badgeEl);
        }

        // attach event listener for tab switching
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            this.selectTab(tab.id);
        });

        li.appendChild(btn);

        return li;
    }

    /**
     * Selects a tab by its id and updates the dom.
     * @param {string} tabId The id of the tab to select.
     */
    selectTab(tabId) {
        // prevent redundant updates
        if (this._activeTabId === tabId) {
            return;
        }

        this._activeTabId = tabId;

        // update active state on navigation links
        const navLinks = this._navElement.querySelectorAll(".nav-link");

        for (let i = 0; i < navLinks.length; i++) {
            const link = navLinks[i];

            if (link.dataset.tabId === tabId) {
                link.classList.add("active");
                link.setAttribute("aria-selected", "true");
                link.setAttribute("tabindex", "0");
            } else {
                link.classList.remove("active");
                link.setAttribute("aria-selected", "false");
                link.setAttribute("tabindex", "-1");
            }
        }

        // update active state on content panes
        for (let i = 0; i < this._tabs.length; i++) {
            const pane = this._tabs[i].paneElement;

            if (pane.id === tabId) {
                pane.classList.add("show", "active");
            } else {
                pane.classList.remove("show", "active");
            }
        }

        this._dispatchTabSelectedEvent(tabId);
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