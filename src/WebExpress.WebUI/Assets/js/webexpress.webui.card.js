/**
 * A card with an optional header, headline, footer and matching header /
 * footer icons. 
 */
webexpress.webui.CardCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Construct a new CardCtrl instance.
     * Reads configuration from data attributes, lifts the existing body
     * children aside, applies the base card classes, and triggers the first
     * render.
     * @param {HTMLElement} element - The host DOM element for this controller.
     */
    constructor(element) {
        super(element);

        // configuration from data-* attributes
        this._header = element.dataset.header || "";
        this._headerIconCss = element.dataset.headerIconCss || null;
        this._headerIconImage = element.dataset.headerIconImage || null;
        this._headerBgClass = element.dataset.headerBgClass || null;
        this._headerBgStyle = element.dataset.headerBgStyle || null;
        this._headerColorClass = element.dataset.headerColorClass || null;
        this._headerColorStyle = element.dataset.headerColorStyle || null;

        this._headline = element.dataset.headline || "";

        this._footer = element.dataset.footer || "";
        this._footerIconCss = element.dataset.footerIconCss || null;
        this._footerIconImage = element.dataset.footerIconImage || null;
        this._footerBgClass = element.dataset.footerBgClass || null;
        this._footerBgStyle = element.dataset.footerBgStyle || null;
        this._footerColorClass = element.dataset.footerColorClass || null;
        this._footerColorStyle = element.dataset.footerColorStyle || null;

        // preserve original child controls - they become the card body content
        this._bodyNodes = Array.from(element.childNodes);
        this._bodyNodes.forEach((n) => element.removeChild(n));

        // strip the data-* attributes so the rendered host stays clean
        [
            "data-header",
            "data-header-icon-css",
            "data-header-icon-image",
            "data-header-bg-class",
            "data-header-bg-style",
            "data-header-color-class",
            "data-header-color-style",
            "data-headline",
            "data-footer",
            "data-footer-icon-css",
            "data-footer-icon-image",
            "data-footer-bg-class",
            "data-footer-bg-style",
            "data-footer-color-class",
            "data-footer-color-style"
        ].forEach((attr) => element.removeAttribute(attr));

        // base styling class - paired with webexpress.webui.panel.card.css; the
        // wx-card namespace keeps the markup independent of Bootstrap's .card.
        element.classList.add("wx-card");

        this.render();
    }

    /**
     * Getter for the header text.
     * @returns {string}
     */
    get header() { return this._header; }

    /**
     * Setter for the header text. Re-renders if the value changes.
     * @param {string|null} value
     */
    set header(value) {
        const next = value || "";
        if (this._header !== next) {
            this._header = next;
            this.render();
        }
    }

    /**
     * Getter for the header icon CSS class.
     * @returns {string|null}
     */
    get headerIconCss() { return this._headerIconCss; }

    /**
     * Setter for the header icon CSS class. Mutually exclusive with the image
     * variant - the last setter wins.
     * @param {string|null} value
     */
    set headerIconCss(value) {
        this._headerIconCss = value || null;
        if (value) this._headerIconImage = null;
        this.render();
    }

    /**
     * Getter for the header icon image URL.
     * @returns {string|null}
     */
    get headerIconImage() { return this._headerIconImage; }

    /**
     * Setter for the header icon image URL. Mutually exclusive with the CSS
     * variant - the last setter wins.
     * @param {string|null} value
     */
    set headerIconImage(value) {
        this._headerIconImage = value || null;
        if (value) this._headerIconCss = null;
        this.render();
    }

    /**
     * Getter for the header background CSS class (e.g. "bg-primary").
     * @returns {string|null}
     */
    get headerBgClass() { return this._headerBgClass; }

    /**
     * Setter for the header background CSS class.
     * @param {string|null} value
     */
    set headerBgClass(value) {
        this._headerBgClass = value || null;
        this.render();
    }

    /**
     * Getter for the header background inline style.
     * @returns {string|null}
     */
    get headerBgStyle() { return this._headerBgStyle; }

    /**
     * Setter for the header background inline style.
     * @param {string|null} value
     */
    set headerBgStyle(value) {
        this._headerBgStyle = value || null;
        this.render();
    }

    /**
     * Getter for the header text colour CSS class (e.g. "text-light").
     * @returns {string|null}
     */
    get headerColorClass() { return this._headerColorClass; }

    /**
     * Setter for the header text colour CSS class.
     * @param {string|null} value
     */
    set headerColorClass(value) {
        this._headerColorClass = value || null;
        this.render();
    }

    /**
     * Getter for the header text colour inline style.
     * @returns {string|null}
     */
    get headerColorStyle() { return this._headerColorStyle; }

    /**
     * Setter for the header text colour inline style.
     * @param {string|null} value
     */
    set headerColorStyle(value) {
        this._headerColorStyle = value || null;
        this.render();
    }

    /**
     * Getter for the headline text inside the card body.
     * @returns {string}
     */
    get headline() { return this._headline; }

    /**
     * Setter for the headline text. Re-renders if the value changes.
     * @param {string|null} value
     */
    set headline(value) {
        const next = value || "";
        if (this._headline !== next) {
            this._headline = next;
            this.render();
        }
    }

    /**
     * Getter for the footer text.
     * @returns {string}
     */
    get footer() { return this._footer; }

    /**
     * Setter for the footer text. Re-renders if the value changes.
     * @param {string|null} value
     */
    set footer(value) {
        const next = value || "";
        if (this._footer !== next) {
            this._footer = next;
            this.render();
        }
    }

    /**
     * Getter for the footer icon CSS class.
     * @returns {string|null}
     */
    get footerIconCss() { return this._footerIconCss; }

    /**
     * Setter for the footer icon CSS class.
     * @param {string|null} value
     */
    set footerIconCss(value) {
        this._footerIconCss = value || null;
        if (value) this._footerIconImage = null;
        this.render();
    }

    /**
     * Getter for the footer icon image URL.
     * @returns {string|null}
     */
    get footerIconImage() { return this._footerIconImage; }

    /**
     * Setter for the footer icon image URL.
     * @param {string|null} value
     */
    set footerIconImage(value) {
        this._footerIconImage = value || null;
        if (value) this._footerIconCss = null;
        this.render();
    }

    /**
     * Getter for the footer background CSS class (e.g. "bg-primary").
     * @returns {string|null}
     */
    get footerBgClass() { return this._footerBgClass; }

    /**
     * Setter for the footer background CSS class.
     * @param {string|null} value
     */
    set footerBgClass(value) {
        this._footerBgClass = value || null;
        this.render();
    }

    /**
     * Getter for the footer background inline style.
     * @returns {string|null}
     */
    get footerBgStyle() { return this._footerBgStyle; }

    /**
     * Setter for the footer background inline style.
     * @param {string|null} value
     */
    set footerBgStyle(value) {
        this._footerBgStyle = value || null;
        this.render();
    }

    /**
     * Getter for the footer text colour CSS class (e.g. "text-light").
     * @returns {string|null}
     */
    get footerColorClass() { return this._footerColorClass; }

    /**
     * Setter for the footer text colour CSS class.
     * @param {string|null} value
     */
    set footerColorClass(value) {
        this._footerColorClass = value || null;
        this.render();
    }

    /**
     * Getter for the footer text colour inline style.
     * @returns {string|null}
     */
    get footerColorStyle() { return this._footerColorStyle; }

    /**
     * Setter for the footer text colour inline style.
     * @param {string|null} value
     */
    set footerColorStyle(value) {
        this._footerColorStyle = value || null;
        this.render();
    }

    /**
     * Renders the card structure. Builds a fresh wx-card-header / wx-card-body
     * / wx-card-footer hierarchy from the current configuration and re-inserts
     * the preserved body nodes inside the wx-card-text wrapper.
     */
    render() {
        const fragment = document.createDocumentFragment();

        // header row
        const headerEl = this._buildSection(
            "wx-card-header",
            this._headerIconCss,
            this._headerIconImage,
            this._header,
            this._headerBgClass,
            this._headerBgStyle,
            this._headerColorClass,
            this._headerColorStyle
        );
        if (headerEl) fragment.appendChild(headerEl);

        // body wrapper with optional headline and the preserved children
        const body = document.createElement("div");
        body.className = "wx-card-body";

        if (this._headline) {
            const h = document.createElement("h4");
            h.className = "wx-card-title";
            h.textContent = this._headline;
            body.appendChild(h);
        }

        const text = document.createElement("div");
        text.className = "wx-card-text";
        this._bodyNodes.forEach((n) => {
            if (n) text.appendChild(n);
        });
        body.appendChild(text);
        fragment.appendChild(body);

        // footer row
        const footerEl = this._buildSection(
            "wx-card-footer",
            this._footerIconCss,
            this._footerIconImage,
            this._footer,
            this._footerBgClass,
            this._footerBgStyle,
            this._footerColorClass,
            this._footerColorStyle
        );
        if (footerEl) fragment.appendChild(footerEl);

        this._element.textContent = "";
        this._element.appendChild(fragment);
    }

    /**
     * Build a header or footer row. Returns null when neither an icon nor a
     * text label is configured, so the corresponding wx-card-header /
     * wx-card-footer is omitted entirely. Colour classes and styles are
     * applied to the row when present.
     * @param {string} cssClass - Either "wx-card-header" or "wx-card-footer".
     * @param {string|null} iconCss - CSS class for an <i> based icon.
     * @param {string|null} iconImage - URL for an <img> based icon.
     * @param {string} text - The section label text.
     * @param {string|null} bgClass - Optional background CSS class.
     * @param {string|null} bgStyle - Optional background inline style.
     * @param {string|null} colorClass - Optional text-colour CSS class.
     * @param {string|null} colorStyle - Optional text-colour inline style.
     * @returns {HTMLElement|null}
     */
    _buildSection(cssClass, iconCss, iconImage, text, bgClass, bgStyle, colorClass, colorStyle) {
        if (!iconCss && !iconImage && !text) {
            return null;
        }

        const row = document.createElement("div");
        row.className = cssClass;

        // apply background / text-colour CSS classes (e.g. "bg-primary", "text-light")
        [bgClass, colorClass].forEach((cls) => {
            if (cls) {
                cls.split(/\s+/).filter(Boolean).forEach((c) => row.classList.add(c));
            }
        });

        // apply background / text-colour inline styles for user-defined colours
        const combinedStyle = [bgStyle, colorStyle].filter(Boolean).join(" ");
        if (combinedStyle) {
            row.setAttribute("style", combinedStyle);
        }

        if (iconImage) {
            const img = document.createElement("img");
            img.className = "wx-icon";
            img.src = iconImage;
            img.alt = "";
            row.appendChild(img);
        } else if (iconCss) {
            const i = document.createElement("i");
            i.className = iconCss;
            row.appendChild(i);
        }

        if (text) {
            row.appendChild(document.createTextNode(text));
        }

        return row;
    }
};

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-card", webexpress.webui.CardCtrl);
