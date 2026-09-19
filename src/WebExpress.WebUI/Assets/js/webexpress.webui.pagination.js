/**
 * Page navigation control.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_PAGE_EVENT
 * - webexpress.webui.Event.CLICK_EVENT
 */
webexpress.webui.PaginationCtrl = class extends webexpress.webui.Ctrl {
    _page = 0;
    _count = 10;

    /**
     * Constructor for initializing the pagination control.
     * @param {HTMLElement} element - The DOM element for the pagination control.
     */
    constructor(element) {
        super(element);

        // initialize properties from data attributes or defaults
        this._page = Number(element.dataset.page) || this._page;
        this._count = Number(element.dataset.total) || this._count;

        // clean up the DOM element and add base classes
        element.innerHTML = "";
        element.removeAttribute("data-page");
        element.removeAttribute("data-pagecount");
        // a page switcher with a name of its own is a navigation landmark; one named only by
        // the generic word is a group, because two identically named landmarks on a page
        // cannot be told apart
        if (!element.hasAttribute("role")) {
            element.setAttribute("role", element.hasAttribute("aria-label") ? "navigation" : "group");
        }
        if (!element.hasAttribute("aria-label")) {
            element.setAttribute("aria-label", this._i18n("webexpress.webui:pagination.label", "Pagination"));
        }
        // the items are list items and need a list to sit in
        this._list = document.createElement("ul");
        this._list.className = "pagination wx-pagination";
        element.appendChild(this._list);

        this._initEvents();
        this.render();
    }

    /**
     * Initialize event listeners, specifically for external state updates.
     */
    _initEvents() {
        // listen for sync events from the table (infinite scroll)
        document.addEventListener("wx-update-pagination", (e) => {
            if (e.detail) {
                // update internal state silently without triggering CHANGE_PAGE_EVENT
                this.updateState(e.detail.page, e.detail.total);
            }
        });
    }

    /**
     * Updates the pagination state from external source without firing change events.
     * Used by infinite scrolling tables to update the indicator.
     * @param {number} page Current page index.
     * @param {number} total Total pages count.
     */
    updateState(page, total) {
        let changed = false;
        if (typeof total === "number" && total !== this._count) {
            this._count = total < 1 ? 1 : total;
            changed = true;
        }
        if (typeof page === "number" && page !== this._page) {
            this._page = page;
            changed = true;
        }

        if (changed) {
            // re-render but do NOT dispatch events
            this.render();
        }
    }

    /**
     * Renders the pagination control.
     * Updates the DOM element based on the current properties.
     */
    render() {
        this._list.replaceChildren();

        if (this._count <= 0) {
            return;
        }

        // add predecessor button
        const predecessor = this._createPageItem(`<span class="${this._iconClass("angle-left")}"></span>`, Math.max(this._page - 1, 0),
            this._i18n("webexpress.webui:pagination.previous", "Previous page"));
        if (this._page === 0) {
            this._disablePageItem(predecessor);
        }
        this._list.appendChild(predecessor);

        // add page items
        this._addPageItems();

        // add successor button
        const successor = this._createPageItem(`<span class="${this._iconClass("angle-right")}"></span>`, Math.min(this._page + 1, this._count - 1),
            this._i18n("webexpress.webui:pagination.next", "Next page"));
        if (this._page === this._count - 1) {
            this._disablePageItem(successor);
        }
        this._list.appendChild(successor);
    }

    /**
     * Helper to create a page item. The switch is a command, not a location, so it is a
     * button; the icon-only ends carry their name as a label.
     * @param {string} content - The HTML content of the item.
     * @param {number} page - The page number associated with the item.
     * @param {string} [label] - The accessible name when the content does not spell one.
     * @returns {HTMLElement} The page item element.
     */
    _createPageItem(content, page, label = null) {
        // create list item
        const li = document.createElement("li");
        li.className = "page-item";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "page-link";
        button.innerHTML = content;
        if (label) {
            button.setAttribute("aria-label", label);
            button.title = label;
        }
        li.appendChild(button);

        // add click handler
        li.addEventListener("click", (e) => {
            e.preventDefault();
            if (li.classList.contains("disabled") || li.classList.contains("active")) {
                return;
            }

            this.page = page;

            this._dispatch(webexpress.webui.Event.CLICK_EVENT, {
                index: page
            });
        });

        return li;
    }

    /**
     * A disabled end stays in the tab order as a real disabled control instead of a link
     * that swallows the activation.
     * @param {HTMLElement} li - The page item element.
     */
    _disablePageItem(li) {
        li.classList.add("disabled");
        const button = li.querySelector("button");
        if (button) {
            button.disabled = true;
        }
    }

    /**
     * Helper to add page items based on the current page and page count.
     */
    _addPageItems() {
        if (this._count <= 10) {
            for (let i = 0; i < this._count; i++) {
                this._appendPageItem(i, i === this._page);
            }
        } else if (this._page <= 3) {
            for (let i = 0; i < 7; i++) {
                this._appendPageItem(i, i === this._page);
            }
            this._appendEllipsis();
            this._appendPageItem(this._count - 1, false);
        } else if (this._count - this._page <= 3) {
            this._appendPageItem(0, false);
            this._appendEllipsis();
            for (let i = this._count - 7; i < this._count; i++) {
                this._appendPageItem(i, i === this._page);
            }
        } else {
            this._appendPageItem(0, false);
            this._appendEllipsis();
            for (let i = this._page - 2; i <= this._page + 2; i++) {
                this._appendPageItem(i, i === this._page);
            }
            this._appendEllipsis();
            this._appendPageItem(this._count - 1, false);
        }
    }

    /**
     * Helper to append a page item.
     * @param {number} page - The page number to append.
     * @param {boolean} isActive - Whether the page item is active.
     */
    _appendPageItem(page, isActive) {
        const pageItem = this._createPageItem((page + 1).toString(), page,
            this._i18n("webexpress.webui:pagination.page", "Page {0}").replace("{0}", () => String(page + 1)));
        if (isActive) {
            pageItem.classList.add("active");
            pageItem.querySelector("button").setAttribute("aria-current", "page");
        }
        this._list.appendChild(pageItem);
    }

    /**
     * Helper to append an ellipsis item. The gap is decoration, not a target.
     */
    _appendEllipsis() {
        const li = document.createElement("li");
        li.className = "page-item disabled";
        const gap = document.createElement("span");
        gap.className = "page-link";
        gap.textContent = "…";
        gap.setAttribute("aria-hidden", "true");
        li.appendChild(gap);
        this._list.appendChild(li);
    }

    /**
     * Returns the page number of the current page.
     */
    get page() {
        return this._page;
    }

    /**
     * Sets the page number of the current page.
     * Triggers event and re-render.
     * @param {number} value - The new page number to set.
     */
    set page(value) {
        if (value < 0 || value >= this._count) {
            return;
        }

        if (this._page !== value) {
            this._page = value;

            // trigger a page change event
            this._dispatch(webexpress.webui.Event.CHANGE_PAGE_EVENT, {
                page: this._page
            });

            // re-render the control
            this.render();
        }
    }

    /**
     * Returns the number of pages.
     */
    get total() {
        return this._count;
    }

    /**
     * Sets the number of pages.
     * @param {number} value - The new number of pages to set.
     */
    set total(value) {
        if (value < 1) {
            value = 1; // ensure at least one page exists
        }

        this._count = value;

        // adjust the current page if it exceeds the new page count
        if (this._page >= this._count) {
            this._page = this._count - 1;
        }

        // re-render the control
        this.render();
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-pagination", webexpress.webui.PaginationCtrl);