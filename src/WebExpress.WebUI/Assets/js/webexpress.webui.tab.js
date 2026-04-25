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

        // create content wrapper
        this._contentElement = document.createElement("div");
        
        let contentClass = "tab-content wx-tab-content p-3";
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
                primaryAction: pane.dataset.wxPrimaryAction || null,
                primaryTarget: pane.dataset.wxPrimaryTarget || null,
                paneElement: pane
            };

            this._tabs.push(tabData);

            // build and append header
            const navItem = this._buildTabHeader(tabData);
            this._navElement.appendChild(navItem);

            // transform pane class list to match bootstrap tabs
            pane.classList.remove("wx-tab-view");
            pane.classList.add("tab-pane", "fade");
            pane.setAttribute("role", "tabpanel");

            // move pane into content wrapper safely
            this._contentElement.appendChild(pane);
        }

        // find and append toolbar if it exists
        const toolbarElement = el.querySelector(":scope > .wx-tab-toolbar");
        if (toolbarElement) {
            this._toolbarCtrl = new webexpress.webui.ToolbarCtrl(toolbarElement);

            this._toolbarLi = document.createElement("li");
            this._toolbarLi.className = "nav-item ms-auto d-flex align-items-center";
            this._toolbarLi.appendChild(toolbarElement);
            this._navElement.appendChild(this._toolbarLi);
        }

        el.appendChild(this._navElement);
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
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-controls", tab.id);
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
            } else {
                link.classList.remove("active");
                link.setAttribute("aria-selected", "false");
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