/**
 * A container for showing and hiding content. 
 * This class extends the base Control class to create an expandable/collapsible UI component.
 * Triggers the following events:
 * - webexpress.webui.change.visibility: Fired when the visibility of the content changes.
 */
webexpress.webui.ExpandableCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor to initialize the expandable container.
     * @param {HTMLElement} elem - The DOM element associated with the expandable instance.
     */
    constructor(elem) {
        super(elem);

        // Initialize properties
        this._initializeProperties(elem);

        // Clean up the DOM
        $(elem).removeData().empty().addClass("wx-expand");

        // Render the initial state
        this.render();
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
        this._contentHtml = $(elem).html();
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
            $(document).trigger(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, value);
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
        $(this._element).empty(); // Clear existing content

        // Create the header
        const expander = this._createExpander();
        const icon = this._createIcon();
        const img = this._createImage();
        const header = this._createHeader();

        // Create the content container
        const contentContainer = $("<div/>")
            .html(this._contentHtml)
            .toggleClass("hide", !this._expand);

        // Append elements to the DOM container
        $(this._element).append(expander, img, icon, header, contentContainer);

        // Update internal content reference
        this._content = contentContainer;
    }

    /**
     * Creates the expander button (toggle arrow).
     * @returns {jQuery} The expander element.
     */
    _createExpander() {
        const expander = $("<a class='wx-expand-angle me-2' href='#'></a>");
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