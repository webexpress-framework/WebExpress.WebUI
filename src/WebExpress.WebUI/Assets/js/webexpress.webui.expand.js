/**
 * A container for showing and hiding content. 
 * This class extends the base Control class to create an expandable/collapsible UI component.
 * Triggers the following events:
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 * - webexpress.webui.Event.CLICK_EVENT
 */
webexpress.webui.ExpandableCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor to initialize the expandable container.
     * @param {HTMLElement} element - The DOM element associated with the expandable instance.
     */
    constructor(element) {
        super(element);

        // Initialize properties from data attributes and element content
        this._iconOpen = element.dataset.iconOpened || element.dataset.icon || null;
        this._iconClose = element.dataset.iconClosed || element.dataset.icon || null;
        this._imageOpen = element.dataset.imageOpened || element.dataset.image || null;
        this._imageClose = element.dataset.imageClosed || element.dataset.image || null;
        this._colorClass = element.dataset.color || "";
        this._headerText = element.dataset.header || "";
        this._headerCss = element.dataset.headercss || "text-primary";
        this._expand = element.dataset.expanded === "true" || false;
        // Save the content 
        this._contentHtml = Array.from(element.childNodes).map(node => this._detachElement(node));

        // Clean up the DOM
        element.innerHTML = "";
        element.removeAttribute("data-icon");
        element.removeAttribute("data-icon-opened");
        element.removeAttribute("data-icon-closed");
        element.removeAttribute("data-image");
        element.removeAttribute("data-image-opened");
        element.removeAttribute("data-image-closed");
        element.removeAttribute("data-color");
        element.removeAttribute("data-header");
        element.removeAttribute("data-headercss");
        element.removeAttribute("data-expanded");
        element.classList.add("wx-expand");

        // Create UI elements
        this._expander = this._createExpander();
        this._icon = this._createIcon();
        this._img = this._createImage();
        this._header = this._createHeader();

        // Create the content container
        this._content = document.createElement("div");
        if (Array.isArray(this._contentHtml)) {
            this._contentHtml.forEach(node => this._content.appendChild(node));
        } else if (typeof this._contentHtml === "string") {
            this._content.innerHTML = this._contentHtml;
        }
        if (!this._expand) {
            this._content.classList.add("hide");
        }

        // Append elements to the DOM container
        element.appendChild(this._expander);
        if (this._img) element.appendChild(this._img);
        if (this._icon) element.appendChild(this._icon);
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
     * Getter for the expand state.
     * @returns {boolean} True if the container is expanded, false if it is collapsed.
     */
    get expand() {
        return this._expand;
    }

    /**
     * Setter for the expand state. Updates the UI and triggers an event when the state changes.
     * @param {boolean} value - The desired expand state (true to expand, false to collapse).
     */
    set expand(value) {
        if (this._expand !== value) {
            this._expand = value;
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id || null,
                    value: value
                }
            }));
            this.render();
        }
    }

    /**
     * Getter for the header text.
     * @returns {string} The text displayed in the header.
     */
    get header() {
        return this._headerText;
    }

    /**
     * Setter for the header text. Updates the header and re-renders the component.
     * @param {string} value - The new header text.
     */
    set header(value) {
        this._headerText = value;
        this.render();
    }

    /**
     * Getter for the content HTML.
     * @returns {Array|String} The HTML content inside the container.
     */
    get contentHtml() {
        return this._contentHtml;
    }

    /**
     * Setter for the content HTML. Updates the container content and re-renders.
     * @param {Array|String} html - The new HTML content.
     */
    set contentHtml(html) {
        this._contentHtml = html;
        this.render();
    }

    /**
     * Renders the expandable container.
     * Updates the DOM based on the current properties.
     */
    render() {
        // Update expander arrow classes
        this._expander.classList.toggle("wx-expand-angle-down", this._expand);
        this._expander.classList.toggle("wx-expand-angle-down-animation", this._expand);

        // Update icon classes
        if (this._icon) {
            this._icon.className = this._colorClass ? this._colorClass : "";
            if (this._expand && this._iconOpen) {
                this._icon.classList.add(...this._iconOpen.split(" ").filter(Boolean));
            } else if (!this._expand && this._iconClose) {
                this._icon.classList.add(...this._iconClose.split(" ").filter(Boolean));
            }
        }

        // Update image source
        if (this._img) {
            this._img.src = this._expand ? this._imageOpen : this._imageClose;
        }

        // Update header
        if (this._header) {
            this._header.textContent = this._headerText;
            this._header.setAttribute("aria-label", this._headerText);
        }

        // Update content
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
     * Creates the expander button (toggle arrow).
     * @returns {HTMLElement} The expander element.
     */
    _createExpander() {
        const expander = document.createElement("a");
        expander.className = "wx-expand-angle me-2";
        expander.href = "javascript:void(0);";
        if (this._expand) {
            expander.classList.add("wx-expand-angle-down");
        }
        expander.addEventListener("click", () => {
            this.toggleExpand();
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CLICK_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id || null
                }
            }));
        });
        return expander;
    }

    /**
     * Creates the icon element for the header.
     * @returns {HTMLElement|null} The icon element or null if no icon is defined.
     */
    _createIcon() {
        if (!this._iconOpen && !this._iconClose) return null;
        const icon = document.createElement("i");
        if (this._colorClass) icon.classList.add(this._colorClass);
        if (this._expand && this._iconOpen) {
            icon.classList.add(...this._iconOpen.split(" ").filter(Boolean));
        } else if (!this._expand && this._iconClose) {
            icon.classList.add(...this._iconClose.split(" ").filter(Boolean));
        }
        icon.addEventListener("click", () => {
            this.toggleExpand();
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CLICK_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id || null
                }
            }));
        });
        return icon;
    }

    /**
     * Creates the image element for the header.
     * @returns {HTMLElement|null} The image element or null if no image is defined.
     */
    _createImage() {
        if (!this._imageOpen && !this._imageClose) return null;
        const img = document.createElement("img");
        img.src = this._expand ? this._imageOpen : this._imageClose;
        img.addEventListener("click", () => {
            this.toggleExpand();
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CLICK_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id || null
                }
            }));
        });
        return img;
    }

    /**
     * Creates the header text element.
     * @returns {HTMLElement} The header element.
     */
    _createHeader() {
        const span = document.createElement("span");
        span.className = this._headerCss;
        span.setAttribute("aria-label", this._headerText);
        span.textContent = this._headerText;
        span.addEventListener("click", () => {
            this.toggleExpand();
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CLICK_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id || null
                }
            }));
        });
        return span;
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-expand", webexpress.webui.ExpandableCtrl);