/**
 * A flat, collapsible section: a quiet label row over a body of content, without the frame of
 * a card. Built from the host element emitted by WebExpress.WebUI.WebControl.ControlSection.
 *
 * Triggers the following events:
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 */
webexpress.webui.SectionCtrl = class extends webexpress.webui.Ctrl {
    /**
     * The prefix of the storage key under which a section remembers its state.
     */
    static STORAGE_PREFIX = "wx-section:";

    /**
     * Initializes the section: lifts the content aside, builds the header row and the
     * collapsible body around it, and applies the remembered state.
     * @param {HTMLElement} element - The DOM element associated with the section.
     */
    constructor(element) {
        super(element);

        // configuration from data attributes
        this._header = element.dataset.header || "";
        this._headerIconCss = element.dataset.headerIconCss || null;
        this._headerIconImage = element.dataset.headerIconImage || null;
        this._note = element.dataset.note || "";
        this._badge = element.dataset.badge || "";
        this._badgeBgClass = element.dataset.badgeBgClass || null;
        this._badgeBgStyle = element.dataset.badgeBgStyle || null;
        this._colorClass = element.dataset.colorClass || null;
        this._colorStyle = element.dataset.colorStyle || null;
        this._labelCss = element.dataset.labelCss || null;
        this._guide = element.dataset.guide !== "false";
        this._collapsible = element.dataset.collapsible !== "false";
        this._persist = element.dataset.persist !== "false" && !!element.id;

        // the declared state is the starting point; a state the reader chose earlier wins
        this._expanded = element.dataset.expanded !== "false";
        if (this._collapsible) {
            const stored = this._read();
            if (stored !== null) {
                this._expanded = stored;
            }
        } else {
            this._expanded = true;
        }

        // preserve the original children - they become the section body. a node that was
        // already detached yields null and is dropped rather than carried into appendChild.
        this._bodyNodes = Array.from(element.childNodes)
            .map(node => this._detachElement(node))
            .filter(node => node !== null);

        [
            "data-header",
            "data-header-icon-css",
            "data-header-icon-image",
            "data-note",
            "data-badge",
            "data-badge-bg-class",
            "data-badge-bg-style",
            "data-color-class",
            "data-color-style",
            "data-label-css",
            "data-collapsible",
            "data-expanded",
            "data-guide",
            "data-persist"
        ].forEach(attr => element.removeAttribute(attr));

        element.classList.add("wx-section");

        if (this._guide) {
            element.classList.add("wx-section-guided");
        }

        // the accent sits on the host so the label row and the guide line inherit it; the body
        // resets to the body color, because an accented paragraph is a different claim than an
        // accented section
        if (this._colorClass || this._colorStyle) {
            element.classList.add("wx-section-accented");

            if (this._colorClass) {
                element.classList.add(...this._colorClass.split(" ").filter(Boolean));
            }

            if (this._colorStyle) {
                element.style.cssText += this._colorStyle;
            }
        }

        if (this._collapsible) {
            element.classList.add("wx-section-collapsible");
        }

        this._buildHeader();
        this._buildBody();

        element.appendChild(this._headerRow);
        element.appendChild(this._wrapper);

        // the body is clipped only while it moves, so dropdowns and popovers inside an open
        // section are free to overflow it
        this._wrapper.addEventListener("transitionend", event => {
            if (event.target === this._wrapper && event.propertyName === "grid-template-rows") {
                this._endAnimation();
            }
        });

        this.render();
    }

    /**
     * Returns true when the body is shown.
     * @returns {boolean}
     */
    get expanded() {
        return this._expanded;
    }

    /**
     * Shows or folds away the body, remembers the choice and dispatches the change.
     * @param {boolean} value - True to show the body, false to fold it away.
     */
    set expanded(value) {
        const next = !!value;

        if (this._expanded === next || !this._collapsible) {
            return;
        }

        this._expanded = next;
        this._startAnimation();
        this._write(next);
        this._dispatch(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, { value: next });
        this.render();
    }

    /**
     * Gets the section label.
     * @returns {string}
     */
    get header() {
        return this._header;
    }

    /**
     * Sets the section label and rerenders.
     * @param {string} value
     */
    set header(value) {
        this._header = value || "";
        this.render();
    }

    /**
     * Gets the trailing note of the header row.
     * @returns {string}
     */
    get note() {
        return this._note;
    }

    /**
     * Sets the trailing note of the header row and rerenders. Setting an empty value removes
     * the note element from the row.
     * @param {string} value
     */
    set note(value) {
        this._note = value || "";
        this.render();
    }

    /**
     * Gets the header row. A host control that builds a section from JavaScript appends its own
     * affordances here - a menu button, a badge of its own kind - instead of reaching into the
     * private structure.
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
     * Gets the badge text.
     * @returns {string}
     */
    get badge() {
        return this._badge;
    }

    /**
     * Sets the badge text and rerenders. Setting an empty value removes the badge from the row.
     * @param {string} value
     */
    set badge(value) {
        this._badge = value || "";
        this.render();
    }

    /**
     * Folds the body away when it is shown and back when it is not.
     */
    toggle() {
        this.expanded = !this._expanded;
    }

    /**
     * Renders the section in its current state.
     */
    render() {
        this._element.classList.toggle("wx-section-collapsed", !this._expanded);

        this._title.textContent = this._header;

        if (this._badgeElement) {
            this._badgeElement.textContent = this._badge;
            this._badgeElement.classList.toggle("hide", !this._badge);
        }

        if (this._noteElement) {
            this._noteElement.textContent = this._note;
            this._noteElement.classList.toggle("hide", !this._note);
        }

        if (this._collapsible) {
            this._headerRow.setAttribute("aria-expanded", this._expanded ? "true" : "false");
        }
    }

    /**
     * Clips the body for the length of the fold.
     */
    _startAnimation() {
        this._element.classList.add("wx-section-animating");

        // a transition that never runs - reduced motion, a hidden tab, a browser that skips it -
        // would leave the body clipped for good and swallow every dropdown inside it, so the
        // clip is lifted on a timer as well as on the event
        clearTimeout(this._animationTimer);
        this._animationTimer = setTimeout(() => this._endAnimation(), 400);
    }

    /**
     * Lifts the clip once the fold has come to rest.
     */
    _endAnimation() {
        clearTimeout(this._animationTimer);
        this._element.classList.remove("wx-section-animating");
    }

    /**
     * Builds the header row: the chevron, the optional icon, the label and the optional note.
     */
    _buildHeader() {
        const row = document.createElement(this._collapsible ? "button" : "div");
        row.className = "wx-section-header";

        if (this._collapsible) {
            row.type = "button";
            row.setAttribute("aria-controls", this._bodyId());
            row.addEventListener("click", () => this.toggle());

            const chevron = document.createElement("span");
            chevron.className = "wx-section-chevron";
            chevron.setAttribute("aria-hidden", "true");
            row.appendChild(chevron);
        }

        if (this._headerIconImage) {
            const img = document.createElement("img");
            img.className = "wx-section-icon";
            img.src = this._headerIconImage;
            img.alt = "";
            row.appendChild(img);
        } else if (this._headerIconCss) {
            const icon = document.createElement("i");
            icon.className = "wx-section-icon " + this._headerIconCss;
            icon.setAttribute("aria-hidden", "true");
            row.appendChild(icon);
        }

        this._title = document.createElement("span");
        this._title.className = "wx-section-title";

        if (this._labelCss) {
            this._title.classList.add(...this._labelCss.split(" ").filter(Boolean));
        }

        row.appendChild(this._title);

        this._badgeElement = document.createElement("span");
        this._badgeElement.className = "wx-section-badge badge rounded-pill";

        if (this._badgeBgClass) {
            this._badgeElement.classList.add(...this._badgeBgClass.split(" ").filter(Boolean));
        }

        if (this._badgeBgStyle) {
            this._badgeElement.style.cssText += this._badgeBgStyle;
        }

        row.appendChild(this._badgeElement);

        // the hairline of the rule layout is an element rather than a pseudo, so it can sit
        // between the label and the trailing note instead of after both
        this._rule = document.createElement("span");
        this._rule.className = "wx-section-rule-line";
        this._rule.setAttribute("aria-hidden", "true");
        row.appendChild(this._rule);

        this._noteElement = document.createElement("span");
        this._noteElement.className = "wx-section-note";
        row.appendChild(this._noteElement);

        this._headerRow = row;
    }

    /**
     * Builds the collapsible body around the preserved content.
     */
    _buildBody() {
        this._wrapper = document.createElement("div");
        this._wrapper.className = "wx-section-wrapper";

        this._body = document.createElement("div");
        this._body.className = "wx-section-body";
        this._body.id = this._bodyId();

        this._bodyNodes.forEach(node => this._body.appendChild(node));

        this._wrapper.appendChild(this._body);
    }

    /**
     * Returns the id the header row points at with aria-controls.
     * @returns {string}
     */
    _bodyId() {
        return (this._element.id || "wx-section") + "-body";
    }

    /**
     * Reads the remembered state.
     * @returns {boolean|null} The remembered state, or null when there is none.
     */
    _read() {
        if (!this._persist) {
            return null;
        }

        try {
            const value = localStorage.getItem(webexpress.webui.SectionCtrl.STORAGE_PREFIX + this._element.id);
            return value === null ? null : value === "true";
        } catch {
            // a host that denies storage still gets a working section, just a forgetful one
            return null;
        }
    }

    /**
     * Remembers the state.
     * @param {boolean} value - The state to remember.
     */
    _write(value) {
        if (!this._persist) {
            return;
        }

        try {
            localStorage.setItem(webexpress.webui.SectionCtrl.STORAGE_PREFIX + this._element.id, value ? "true" : "false");
        } catch {
            // see _read
        }
    }
};

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-section", webexpress.webui.SectionCtrl);
