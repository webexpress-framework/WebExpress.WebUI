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
        element.classList.add("pagination", "wx-pagination");

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
        // Remove all children from the pagination element
        while (this._element.firstChild) {
            this._element.removeChild(this._element.firstChild);
        }

        if (this._count <= 0) {
            return;
        }

        // add predecessor button
        const predecessor = this._createPageItem("<span class='fas fa-angle-left'></span>", Math.max(this._page - 1, 0));
        if (this._page === 0) {
            predecessor.classList.add("disabled");
        }
        this._element.appendChild(predecessor);

        // add page items
        this._addPageItems();

        // add successor button
        const successor = this._createPageItem("<span class='fas fa-angle-right'></span>", Math.min(this._page + 1, this._count - 1));
        if (this._page === this._count - 1) {
            successor.classList.add("disabled");
        }
        this._element.appendChild(successor);
    }

    /**
     * Helper to create a page item.
     * @param {string} content - The HTML content of the item.
     * @param {number} page - The page number associated with the item.
     * @returns {HTMLElement} The page item element.
     */
    _createPageItem(content, page) {
        // create list item
        const li = document.createElement("li");
        li.className = "page-item";
        // create anchor
        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "javascript:void(0)";
        a.innerHTML = content;
        li.appendChild(a);

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
        const pageItem = this._createPageItem((page + 1).toString(), page);
        if (isActive) {
            pageItem.classList.add("active");
        }
        this._element.appendChild(pageItem);
    }

    /**
     * Helper to append an ellipsis item.
     */
    _appendEllipsis() {
        const li = document.createElement("li");
        li.className = "page-item disabled";
        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "javascript:void(0)";
        a.textContent = "…";
        li.appendChild(a);
        this._element.appendChild(li);
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