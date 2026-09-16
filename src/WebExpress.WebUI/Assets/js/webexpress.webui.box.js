/**
 * A box: an enclosing frame around content that belongs together. Built from the host element
 * emitted by WebExpress.WebUI.WebControl.ControlBox, and from the reading view of the editor's
 * box add-on, which carries the same attributes - so a box authored in rich text and a box
 * declared in C# are one and the same thing on the page.
 */
webexpress.webui.BoxCtrl = class extends webexpress.webui.Ctrl {
    /**
     * The frames a box can draw, by the value the data attribute carries. The first entry is
     * the default and the fallback for a value the stylesheet does not know.
     */
    static LAYOUTS = ["solid", "dashed", "dotted", "double", "accent", "raised", "inset", "none"];

    /**
     * Initializes the box: lifts the content aside, builds the label row and the body around
     * it, and applies the frame.
     * @param {HTMLElement} element - The DOM element associated with the box.
     */
    constructor(element) {
        super(element);

        // configuration from data attributes
        this._layout = webexpress.webui.BoxCtrl._normalizeLayout(element.dataset.layout);
        this._header = element.dataset.header || "";
        this._headerIconCss = element.dataset.headerIconCss || null;
        this._headerIconImage = element.dataset.headerIconImage || null;
        this._colorClass = element.dataset.colorClass || null;
        this._colorStyle = element.dataset.colorStyle || null;

        // preserve the original children - they become the box body. a node that was already
        // detached yields null and is dropped rather than carried into appendChild.
        this._bodyNodes = Array.from(element.childNodes)
            .map(node => this._detachElement(node))
            .filter(node => node !== null);

        [
            "data-layout",
            "data-header",
            "data-header-icon-css",
            "data-header-icon-image",
            "data-color-class",
            "data-color-style"
        ].forEach(attr => element.removeAttribute(attr));

        element.classList.add("wx-box");

        // the accent sits on the host so the frame and the label inherit it through
        // currentColor; the body resets to the body color, because an accented paragraph is a
        // different claim than an accented frame
        if (this._colorClass || this._colorStyle) {
            element.classList.add("wx-box-accented");

            if (this._colorClass) {
                element.classList.add(...this._colorClass.split(" ").filter(Boolean));
            }

            if (this._colorStyle) {
                element.style.cssText += this._colorStyle;
            }
        }

        this._buildHeader();
        this._buildBody();

        element.appendChild(this._headerRow);
        element.appendChild(this._body);

        this.render();
    }

    /**
     * Gets the frame of the box.
     * @returns {string} One of the values in LAYOUTS.
     */
    get layout() {
        return this._layout;
    }

    /**
     * Sets the frame of the box and rerenders. A value the stylesheet does not know falls
     * back to the default frame rather than leaving the box without one.
     * @param {string} value - One of the values in LAYOUTS.
     */
    set layout(value) {
        this._layout = webexpress.webui.BoxCtrl._normalizeLayout(value);
        this.render();
    }

    /**
     * Gets the label of the box.
     * @returns {string}
     */
    get header() {
        return this._header;
    }

    /**
     * Sets the label of the box and rerenders. Setting an empty value removes the label row
     * from the box, unless an icon keeps it.
     * @param {string} value
     */
    set header(value) {
        this._header = value || "";
        this.render();
    }

    /**
     * Gets the label row. A host control that builds a box from JavaScript appends its own
     * affordances here instead of reaching into the private structure.
     * @returns {HTMLElement}
     */
    get headerElement() {
        return this._headerRow;
    }

    /**
     * Gets the label element, for a host control that has to restyle or rename it in place.
     * @returns {HTMLElement}
     */
    get titleElement() {
        return this._title;
    }

    /**
     * Gets the body, which is where the adopted content lives.
     * @returns {HTMLElement}
     */
    get bodyElement() {
        return this._body;
    }

    /**
     * Renders the box in its current state.
     */
    render() {
        const classList = this._element.classList;

        webexpress.webui.BoxCtrl.LAYOUTS.forEach(layout => {
            classList.toggle("wx-box-" + layout, layout === this._layout);
        });

        this._title.textContent = this._header;

        // a box without a label is a plain frame; the row is kept so a label set later has a
        // place to go, but it must not leave an empty line above the body
        const labelled = !!this._header || !!this._headerIconCss || !!this._headerIconImage;
        this._headerRow.classList.toggle("hide", !labelled);
        classList.toggle("wx-box-labelled", labelled);
    }

    /**
     * Builds the label row: the optional icon and the label.
     */
    _buildHeader() {
        const row = document.createElement("div");
        row.className = "wx-box-header";

        if (this._headerIconImage) {
            const img = document.createElement("img");
            img.className = "wx-box-icon";
            img.src = this._headerIconImage;
            img.alt = "";
            row.appendChild(img);
        } else if (this._headerIconCss) {
            const icon = document.createElement("i");
            icon.className = "wx-box-icon " + this._headerIconCss;
            icon.setAttribute("aria-hidden", "true");
            row.appendChild(icon);
        }

        this._title = document.createElement("span");
        this._title.className = "wx-box-title";
        row.appendChild(this._title);

        this._headerRow = row;
    }

    /**
     * Builds the body around the preserved content.
     */
    _buildBody() {
        this._body = document.createElement("div");
        this._body.className = "wx-box-body";

        this._bodyNodes.forEach(node => this._body.appendChild(node));
    }

    /**
     * Maps a layout value to one the stylesheet knows.
     * @param {string|null|undefined} value - The declared value.
     * @returns {string} The value, or the default frame when the value is unknown.
     */
    static _normalizeLayout(value) {
        const layout = String(value || "").toLowerCase();

        return webexpress.webui.BoxCtrl.LAYOUTS.includes(layout) ? layout : webexpress.webui.BoxCtrl.LAYOUTS[0];
    }
};

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-box", webexpress.webui.BoxCtrl);
