/**
 * A container for showing and hiding content (expand/collapse).
 * Extends the base Control class for an expandable/collapsible UI component.
 * Triggers the following events:
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 * - webexpress.webui.Event.CLICK_EVENT
 */
webexpress.webui.ExpandableCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Initializes the expandable container.
     * @param {HTMLElement} element - The DOM element associated with the expandable instance.
     */
    constructor(element) {
        super(element);

        // configuration from data attributes
        this._iconOpen = element.dataset.iconOpened || element.dataset.icon || null;
        this._iconClose = element.dataset.iconClosed || element.dataset.icon || null;
        this._imageOpen = element.dataset.imageOpened || element.dataset.image || null;
        this._imageClose = element.dataset.imageClosed || element.dataset.image || null;
        this._colorClass = element.dataset.color || "";
        this._headerText = element.dataset.header || "";
        this._headerCss = element.dataset.headercss || "text-primary";
        this._expand = (element.dataset.expanded === "true" || element.dataset.expanded === true);

        // extract content nodes or html
        this._contentHtml = Array.from(element.childNodes).map(node => this._detachElement(node));

        // clean up
        element.innerHTML = "";
        [
            "data-icon", "data-icon-opened", "data-icon-closed",
            "data-image", "data-image-opened", "data-image-closed",
            "data-color", "data-header", "data-headercss", "data-expanded"
        ].forEach(attr => element.removeAttribute(attr));
        element.classList.add("wx-expandable");

        // create UI elements
        this._expander = this._createExpander();
        this._icon = this._createIcon();
        this._img = this._createImage();
        this._header = this._createHeader();

        // create the content container
        this._content = document.createElement("div");
        if (Array.isArray(this._contentHtml)) {
            this._contentHtml.forEach(node => this._content.appendChild(node));
        } else if (typeof this._contentHtml === "string") {
            this._content.innerHTML = this._contentHtml;
        }
        if (!this._expand) {
            this._content.classList.add("hide");
        }

        // append elements to DOM container
        element.appendChild(this._expander);
        if (this._img) { element.appendChild(this._img); }
        if (this._icon) { element.appendChild(this._icon); }
        element.appendChild(this._header);
        element.appendChild(this._content);
    }

    /**
     * Toggles the expand/collapse state of the container.
     */
    toggleExpand() {
        this.expand = !this.expand;
    }

    /**
     * Returns true if expanded, false if collapsed.
     * @returns {boolean}
     */
    get expand() {
        return this._expand;
    }

    /**
     * Sets expand/collapse state; rerenders and dispatches event if state changes.
     * @param {boolean} value - True for expanded, false for collapsed.
     */
    set expand(value) {
        const newValue = !!value;
        if (this._expand !== newValue) {
            this._expand = newValue;
            this._dispatch(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, { value: newValue });
            this.render();
        }
    }

    /**
     * Gets header text.
     * @returns {string}
     */
    get header() {
        return this._headerText;
    }

    /**
     * Sets header text and rerenders component.
     * @param {string} value
     */
    set header(value) {
        this._headerText = value;
        this.render();
    }

    /**
     * Gets the content as html nodes or string.
     * @returns {Array|String}
     */
    get contentHtml() {
        return this._contentHtml;
    }

    /**
     * Sets content and rerenders.
     * @param {Array|String} html
     */
    set contentHtml(html) {
        this._contentHtml = html;
        this.render();
    }

    /**
     * Renders the expandable container and all subelements in their current state.
     */
    render() {
        // handle expander/arrow
        this._expander.classList.toggle("wx-expandable-angle-down", this._expand);
        this._expander.classList.toggle("wx-expandable-angle-down-animation", this._expand);

        // handle icon
        if (this._icon) {
            this._icon.className = this._colorClass ? this._colorClass : "";
            if (this._expand && this._iconOpen) {
                this._icon.classList.add(...this._iconOpen.split(" ").filter(Boolean));
            } else if (!this._expand && this._iconClose) {
                this._icon.classList.add(...this._iconClose.split(" ").filter(Boolean));
            }
        }

        // update image if present
        if (this._img) {
            this._img.src = this._expand ? this._imageOpen : this._imageClose;
        }

        // update header
        if (this._header) {
            this._header.textContent = this._headerText;
            this._header.setAttribute("aria-label", this._headerText);
        }

        // content node re-render, supports array of nodes or plain string
        if (this._content) {
            this._content.innerHTML = "";
            if (Array.isArray(this._contentHtml)) {
                this._contentHtml.forEach(node => this._content.appendChild(node));
            } else if (typeof this._contentHtml === "string") {
                this._content.innerHTML = this._contentHtml;
            }
            this._content.classList.toggle("hide", !this._expand);
        }
    }

    /**
     * Creates the expander (arrow clickable handle).
     * @returns {HTMLElement}
     */
    _createExpander() {
        const expander = document.createElement("a");
        expander.className = "wx-expandable-angle me-2";
        expander.href = "javascript:void(0);";
        if (this._expand) {
            expander.classList.add("wx-expandable-angle-down");
        }
        expander.addEventListener("click", () => {
            this.toggleExpand();
            this._dispatch(webexpress.webui.Event.CLICK_EVENT, {});
        });
        return expander;
    }

    /**
     * Creates the icon element for the header.
     * @returns {HTMLElement|null}
     */
    _createIcon() {
        if (!this._iconOpen && !this._iconClose) { return null; }
        const icon = document.createElement("i");
        if (this._colorClass) { icon.classList.add(this._colorClass); }
        if (this._expand && this._iconOpen) {
            icon.classList.add(...this._iconOpen.split(" ").filter(Boolean));
        } else if (!this._expand && this._iconClose) {
            icon.classList.add(...this._iconClose.split(" ").filter(Boolean));
        }
        icon.addEventListener("click", () => {
            this.toggleExpand();
            this._dispatch(webexpress.webui.Event.CLICK_EVENT, {});
        });
        return icon;
    }

    /**
     * Creates the image element for the header.
     * @returns {HTMLElement|null}
     */
    _createImage() {
        if (!this._imageOpen && !this._imageClose) { return null; }
        const img = document.createElement("img");
        img.src = this._expand ? this._imageOpen : this._imageClose;
        img.addEventListener("click", () => {
            this.toggleExpand();
            this._dispatch(webexpress.webui.Event.CLICK_EVENT, {});
        });
        return img;
    }

    /**
     * Creates the header text element.
     * @returns {HTMLElement}
     */
    _createHeader() {
        const span = document.createElement("span");
        span.className = this._headerCss;
        span.setAttribute("aria-label", this._headerText);
        span.textContent = this._headerText;
        span.addEventListener("click", () => {
            this.toggleExpand();
            this._dispatch(webexpress.webui.Event.CLICK_EVENT, {});
        });
        return span;
    }
};

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-expandable", webexpress.webui.ExpandableCtrl);