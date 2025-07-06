/**
 * Page navigation control.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_PAGE_EVENT
 * - webexpress.webui.Event.CLICK_EVENT
 */
webexpress.webui.PaginationCtrl = class extends webexpress.webui.Ctrl {
    // Default values for page and count
    _page = 0;
    _count = 10;

    /**
     * Constructor for initializing the pagination control.
     * @param {HTMLElement} element - The DOM element for the pagination control.
     */
    constructor(element) {
        super(element);

        // Initialize properties from data attributes or defaults
        this._page = Number(element.dataset.page) || this._page;
        this._count = Number(element.dataset.total) || this._count;

        // Clean up the DOM element and add base classes
        element.innerHTML = "";
        element.removeAttribute("data-page");
        element.removeAttribute("data-pagecount");
        element.classList.add("pagination", "wx-pagination");

        // Render the control
        this.render();
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

        // Add predecessor button
        const predecessor = this._createPageItem("<span class='fas fa-angle-left'></span>", Math.max(this._page - 1, 0));
        this._element.appendChild(predecessor);

        // Add page items
        this._addPageItems();

        // Add successor button
        const successor = this._createPageItem("<span class='fas fa-angle-right'></span>", Math.min(this._page + 1, this._count - 1));
        this._element.appendChild(successor);
    }

    /**
     * Helper to create a page item.
     * @param {string} content - The HTML content of the item.
     * @param {number} page - The page number associated with the item.
     * @returns {HTMLElement} The page item element.
     */
    _createPageItem(content, page) {
        // Create list item
        const li = document.createElement("li");
        li.className = "page-item";
        // Create anchor
        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "javascript:void(0)";
        a.innerHTML = content;
        li.appendChild(a);

        // Add click handler
        li.addEventListener("click", () => {
            this.page = page;
            const clickEvent = new CustomEvent(webexpress.webui.Event.CLICK_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id,
                    index: page
                }
            });
            document.dispatchEvent(clickEvent);
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
     * @param {number} value - The new page number to set.
     */
    set page(value) {
        if (value < 0 || value >= this._count) {
            throw new Error("Invalid page number. It must be between 0 and the total number of pages - 1.");
        }

        if (this._page !== value) {
            this._page = value;

            // Trigger a page change event
            const changeEvent = new CustomEvent(webexpress.webui.Event.CHANGE_PAGE_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id,
                    page: this._page
                }
            });
            document.dispatchEvent(changeEvent);

            // Re-render the control
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
            value = 1; // Ensure at least one page exists
        }

        this._count = value;

        // Adjust the current page if it exceeds the new page count
        if (this._page >= this._count) {
            this._page = this._count - 1;
        }

        // Re-render the control
        this.render();
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-pagination", webexpress.webui.PaginationCtrl);