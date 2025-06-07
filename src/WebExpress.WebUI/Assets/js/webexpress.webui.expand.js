/**
 * A container for showing and hiding content. 
 * This class extends the base Control class to create an expandable/collapsible UI component.
 * Triggers the following events:
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 */
webexpress.webui.ExpandableCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor to initialize the expandable container.
     * @param {HTMLElement} element - The DOM element associated with the expandable instance.
     */
    constructor(element) {
        super(element);

        // Initialize properties
        this._initializeProperties(element);

        // Clean up the DOM
        $(element).empty()
            .removeAttr("data-icon data-icon-opened data-icon-closed data-image data-image-opened data-image-closed")
            .removeAttr("data-color data-header data-headercss data-expanded")
            .addClass("wx-expand");

        // Create the header
        this._expander = this._createExpander();
        const icon = this._createIcon();
        const img = this._createImage();
        const header = this._createHeader();

        // Create the content container
        this._content = $("<div/>")
            .append(this._contentHtml)
            .toggleClass("hide", !this._expand);

        // Append elements to the DOM container
        $(this._element).append(this._expander, img, icon, header, this._content);            
    }

    /**
     * Initializes properties from the DOM element's data attributes.
     * @param {HTMLElement} elem - The DOM element to extract data attributes from.
     */
    _initializeProperties(elem) {
        this._iconOpen = $(elem).data("icon-opened") || $(elem).data("icon") || null;
        this._iconClose = $(elem).data("icon-closed") || $(elem).data("icon") || null;
        this._imageOpen = $(elem).data("image-opened") || $(elem).data("image") || null;
        this._imageClose = $(elem).data("image-closed") || $(elem).data("image") || null;
        this._colorClass = $(elem).data("color") || "";
        this._headerText = $(elem).data("header") || "";
        this._headerCss = $(elem).data("headercss") || "text-primary";
        this._expand = $(elem).data("expanded") === true || false;
        this._contentHtml = [...$(elem)[0].childNodes].map(node => {
            return $(node).clone(true, true)[0];
        });
    }

    /**
     * Toggles the expand/collapse state of the container.
     * Reverses the current state of `this.expand`.
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
            $(document).trigger(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
                sender: this._element,
                id: $(this._element).attr("id") || null,
                value: value
            });
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
     * @returns {string} The HTML content inside the container.
     */
    get contentHtml() {
        return this._contentHtml;
    }

    /**
     * Setter for the content HTML. Updates the container content and re-renders.
     * @param {string} html - The new HTML content.
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
        this._expander.removeClass("wx-expand-angle-down");
        this._expander.toggleClass("wx-expand-angle-down-animation", this._expand);
        this._content.toggleClass("hide", !this._expand);
    }

    /**
     * Creates the expander button (toggle arrow).
     * @returns {jQuery} The expander element.
     */
    _createExpander() {
        const expander = $("<a class='wx-expand-angle me-2' href='javascript:void(0);'></a>");
        expander.toggleClass("wx-expand-angle-down", this._expand);
        expander.click(() => this.toggleExpand());
        return expander;
    }

    /**
     * Creates the icon element for the header.
     * @returns {jQuery|null} The icon element or null if no icon is defined.
     */
    _createIcon() {
        if (!this._iconOpen && !this._iconClose) return null;

        const icon = $("<i/>").addClass(this._colorClass);
        if (this._expand) {
            icon.addClass(this._iconOpen);
        } else {
            icon.addClass(this._iconClose);
        }
        icon.click(() => this.toggleExpand());
        return icon;
    }

    /**
     * Creates the image element for the header.
     * @returns {jQuery|null} The image element or null if no image is defined.
     */
    _createImage() {
        if (!this._imageOpen && !this._imageClose) return null;

        const img = $("<img/>");
        img.attr("src", this._expand ? this._imageOpen : this._imageClose);
        img.click(() => this.toggleExpand());
        return img;
    }

    /**
     * Creates the header text element.
     * @returns {jQuery} The header element.
     */
    _createHeader() {
        return $("<span/>")
            .addClass(this._headerCss)
            .attr("aria-label", this._headerText)
            .text(this._headerText)
            .click(() => this.toggleExpand());
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-expand", webexpress.webui.ExpandableCtrl);