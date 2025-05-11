/**
 * Page navigation control.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_PAGE_EVENT
 * - webexpress.webui.Event.CLICK_EVENT
 */
webexpress.webui.PaginationCtrl = class extends webexpress.webui.Ctrl {
    _currentpage = 1;
    _pagecount = 10;

    /**
     * Constructor for initializing the pagination control.
     * @param {HTMLElement} element - The DOM element for the pagination control.
     */
    constructor(element) {
        super(element);

        // Initialize properties
        this._currentpage = $(element).data("page") || this._currentpage;
        this._pagecount = $(element).data("pagecount") || this._pagecount;

        // Clean up the DOM element
        $(element)
            .empty()
            .removeAttr("data-page data-pagecount")
            .addClass("pagination wx-pagination");

        // Render the control
        this.render();
    }

    /**
     * Renders the pagination control.
     * Updates the DOM element based on the current properties.
     */
    render() {
        $(this._element).children().remove();

        if (this._pagecount <= 0) {
            return;
        }

        // Add predecessor button
        const predecessor = this._createPageItem("<span class='fas fa-angle-left'></span>", Math.max(this._currentpage - 1, 0));
        $(this._element).append(predecessor);

        // Add page items
        this._addPageItems();

        // Add successor button
        const successor = this._createPageItem("<span class='fas fa-angle-right'></span>", Math.min(this._currentpage + 1, this._pagecount - 1));
        $(this._element).append(successor);
    }

    /**
     * Helper to create a page item.
     * @param {string} content - The HTML content of the item.
     * @param {number} page - The page number associated with the item.
     * @returns {jQuery} The page item element.
     */
    _createPageItem(content, page) {
        const item = $("<li class='page-item'><a class='page-link' href='#'>" + content + "</a></li>");
        item.click(() => {
            this.currentpage = page;
            $(document).trigger(webexpress.webui.Event.CLICK_EVENT, {
                id: $(this._element).attr("id"),
                index: page
            });
        });
        return item;
    }

    /**
     * Helper to add page items based on the current page and page count.
     */
    _addPageItems() {
        if (this._pagecount <= 10) {
            for (let i = 0; i < this._pagecount; i++) {
                this._appendPageItem(i, i === this._currentpage);
            }
        } else if (this._currentpage <= 3) {
            for (let i = 0; i < 7; i++) {
                this._appendPageItem(i, i === this._currentpage);
            }
            this._appendEllipsis();
            this._appendPageItem(this._pagecount - 1, false);
        } else if (this._pagecount - this._currentpage <= 3) {
            this._appendPageItem(0, false);
            this._appendEllipsis();
            for (let i = this._pagecount - 7; i < this._pagecount; i++) {
                this._appendPageItem(i, i === this._currentpage);
            }
        } else {
            this._appendPageItem(0, false);
            this._appendEllipsis();
            for (let i = this._currentpage - 2; i <= this._currentpage + 2; i++) {
                this._appendPageItem(i, i === this._currentpage);
            }
            this._appendEllipsis();
            this._appendPageItem(this._pagecount - 1, false);
        }
    }

    /**
     * Helper to append a page item.
     * @param {number} page - The page number to append.
     * @param {boolean} isActive - Whether the page item is active.
     */
    _appendPageItem(page, isActive) {
        const pageItem = this._createPageItem(page + 1, page);
        if (isActive) {
            pageItem.addClass("active");
        }
        $(this._element).append(pageItem);
    }

    /**
     * Helper to append an ellipsis item.
     */
    _appendEllipsis() {
        const ellipsis = $("<li class='page-item disabled'><a class='page-link' href='#'>…</a></li>");
        $(this._element).append(ellipsis);
    }

    /**
     * Returns the page number of the current page.
     */
    get currentpage() {
        return this._currentpage;
    }

    /**
     * Sets the page number of the current page.
     * @param {number} value - The new page number to set.
     */
    set currentpage(value) {
        if (value < 0 || value >= this._pagecount) {
            throw new Error("Invalid page number. It must be between 0 and the total number of pages - 1.");
        }

        this._currentpage = value;

        // Trigger a page change event
        $(document).trigger(webexpress.webui.Event.CHANGE_PAGE_EVENT, {
            id: $(this._element).attr("id"),
            currentpage: this._currentpage
        });

        // Re-render the control
        this.render();
    }

    /**
     * Returns the number of pages.
     */
    get pagecount() {
        return this._pagecount;
    }

    /**
     * Sets the number of pages.
     * @param {number} value - The new number of pages to set.
     */
    set pagecount(value) {
        if (value < 1) {
            throw new Error("Page count must be at least 1.");
        }

        this._pagecount = value;

        // Adjust the current page if it exceeds the new page count
        if (this._currentpage >= this._pagecount) {
            this._currentpage = this._pagecount - 1;
        }

        // Re-render the control
        this.render();
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-pagination", webexpress.webui.PaginationCtrl);