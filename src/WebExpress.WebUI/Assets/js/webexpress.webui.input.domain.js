/**
 * An account in a domain: a picker of the domains offered beside a field for the user name,
 * composed into DOMAIN\user or user@domain.tld. Without domains to offer, the field takes the
 * whole account as text. The server checks the same rules (DomainLogon.cs).
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT
 */
webexpress.webui.InputDomainCtrl = class extends webexpress.webui.MenuCtrl {
    // a list longer than this gets a filter above it
    static FILTER_THRESHOLD = 8;

    // the characters a logon name must not contain; the at sign separates a principal name
    static RESERVED_USER = "\"/\\[]:;|=,+*?<>@";
    static RESERVED_DOMAIN = "\\/:*?\"<>| ";
    static DNS = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    _value = "";
    _domain = null;
    _disabled = false;
    // the notation of an account given in full, which composing must not change
    _notation = null;

    /**
     * Constructor for initializing the domain control.
     * @param {HTMLElement} element - The DOM element for the domain control.
     */
    constructor(element) {
        super(element);

        const id = element.getAttribute("id");
        const name = element.getAttribute("name");
        const value = element.getAttribute("data-value") || "";
        this._placeholder = element.getAttribute("placeholder") || "";
        this._format = element.getAttribute("data-format") || null;
        this._disabled = element.hasAttribute("disabled") || element.classList.contains("disabled");
        this._options = Array.from(element.querySelectorAll(".wx-selection-item")).map((item) => ({
            domain: item.getAttribute("id") || "",
            label: item.getAttribute("data-label") || item.getAttribute("id") || ""
        })).filter((option) => option.domain);
        this._domain = this._offered(element.getAttribute("data-domain")) || this._options[0]?.domain || null;

        const hidden = document.createElement("input");
        hidden.type = "hidden";
        if (id) {
            hidden.id = id;
        }
        hidden.name = name || "";
        this._hidden = hidden;

        const field = this._createField();

        element.removeAttribute("id");
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-value");
        element.removeAttribute("data-domain");
        element.removeAttribute("data-format");
        element.removeAttribute("disabled");
        element.innerHTML = "";
        element.classList.add("wx-domain-input");
        element.appendChild(hidden);
        element.appendChild(field);

        // without domains to offer there is nothing to pick, and the field is a plain text field
        if (this._options.length) {
            const menu = this._createMenu();
            element.appendChild(menu);
            this._initializeMenu(field, menu, this._trigger);
            menu.addEventListener("toggle", (event) => {
                if (event.newState === "open") {
                    if (this._filter) {
                        this._filter.value = "";
                        this._applyFilter();
                        this._filter.focus({ preventScroll: true });
                    } else {
                        menu.querySelector("button")?.focus({ preventScroll: true });
                    }
                }
            });
            this._trigger.setAttribute("aria-label", this._i18n("webexpress.webui:domain.select", "Domain"));
            menu.setAttribute("aria-label", this._i18n("webexpress.webui:domain.select", "Domain"));
        }
        this._adoptFieldLabel(this._user, id, element, []);

        this._apply(value, false);
    }

    /**
     * Splits an account into its domain and its user, by the rules of a directory.
     * @param {string} value - The account as written.
     * @returns {{domain: string, user: string, format: string}|null} The parts, or null for no valid account.
     */
    static parse(value) {
        const ctrl = webexpress.webui.InputDomainCtrl;
        const text = String(value ?? "").trim();
        const valid = (user, max) => !!user && user.length <= max && user.trim() === user && !user.endsWith(".")
            && ![...user].some((c) => ctrl.RESERVED_USER.includes(c) || c < " ");
        const backslash = text.indexOf("\\");
        if (backslash >= 0) {
            const domain = text.slice(0, backslash);
            const user = text.slice(backslash + 1);
            const domainValid = !!domain && !domain.startsWith(".") && (domain.includes(".")
                ? domain.length <= 255 && ctrl.DNS.test(domain)
                : domain.length <= 15 && ![...domain].some((c) => ctrl.RESERVED_DOMAIN.includes(c) || c < " "));
            return domainValid && valid(user, 20) ? { domain, user, format: "downlevel" } : null;
        }
        const at = text.lastIndexOf("@");
        if (at >= 0) {
            const user = text.slice(0, at);
            const domain = text.slice(at + 1);
            return valid(user, 64) && domain.length <= 255 && ctrl.DNS.test(domain) ? { domain, user, format: "principal" } : null;
        }
        return null;
    }

    /**
     * Returns the account in its full notation, or the text as typed where it is none.
     * @returns {string} The account.
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the account. An account of an offered domain selects that domain.
     * @param {string} value - The account in either notation.
     */
    set value(value) {
        this._apply(value, true);
    }

    /**
     * Returns the domain chosen, or null without domains to offer.
     * @returns {string|null} The domain.
     */
    get domain() {
        return this._domain;
    }

    /**
     * Chooses another domain; the user name stays.
     * @param {string} domain - The domain, in any letter case.
     */
    set domain(domain) {
        const offered = this._offered(domain);
        if (offered && offered !== this._domain) {
            // a domain picked anew is written the way that domain asks for
            this._domain = offered;
            this._notation = null;
            this._commit(true);
        }
    }

    /** Gets whether the field prevents user changes. */
    get disabled() {
        return this._disabled;
    }

    /**
     * Keeps the domain button and the user field in the same enabled state.
     * @param {boolean} value - Whether user changes should be prevented.
     */
    set disabled(value) {
        this._disabled = !!value;
        this._render();
    }

    /**
     * Validates the account without presenting anything.
     * @returns {string[]} The messages; empty for a valid or an empty field.
     */
    validate() {
        if (!this._value) {
            return [];
        }
        const parsed = webexpress.webui.InputDomainCtrl.parse(this._value);
        if (!parsed || this._format && parsed.format !== this._format) {
            return [this._i18n("webexpress.webui:domain.invalid", "The account is not valid.")];
        }
        return this._options.length && !this._offered(parsed.domain)
            ? [this._i18n("webexpress.webui:domain.refused", "The domain is not permitted.")]
            : [];
    }

    /**
     * Returns a domain when it is offered, in the spelling of the offer.
     * @param {string} domain - The domain, in any letter case.
     * @returns {string|null} The offered domain, or null.
     */
    _offered(domain) {
        const wanted = String(domain ?? "").trim().toLowerCase();
        return this._options.find((option) => option.domain.toLowerCase() === wanted)?.domain || null;
    }

    /**
     * Builds the visible field: the domain button, where there are domains, and the user input.
     * @returns {HTMLDivElement} The field.
     */
    _createField() {
        const field = document.createElement("div");
        field.className = "form-control wx-prefix-field";

        if (this._options.length) {
            const trigger = document.createElement("button");
            trigger.type = "button";
            trigger.className = "wx-prefix-button";
            this._triggerLabel = document.createElement("span");
            const caret = document.createElement("i");
            caret.className = this._iconClass("angle-down");
            caret.setAttribute("aria-hidden", "true");
            trigger.appendChild(this._triggerLabel);
            trigger.appendChild(caret);
            this._trigger = trigger;
            field.appendChild(trigger);
        }

        const user = document.createElement("input");
        user.type = "text";
        user.className = "wx-prefix-text";
        user.setAttribute("autocomplete", "username");
        user.setAttribute("spellcheck", "false");
        user.setAttribute("autocapitalize", "off");
        if (this._placeholder) {
            user.placeholder = this._placeholder;
        }
        user.addEventListener("input", () => {
            // an account typed or pasted in full names its domain itself
            const parsed = webexpress.webui.InputDomainCtrl.parse(user.value);
            const offered = parsed && this._offered(parsed.domain);
            if (offered) {
                this._domain = offered;
                this._notation = parsed.format;
                user.value = parsed.user;
            }
            this._commit(true);
        });
        this._user = user;
        field.appendChild(user);
        return field;
    }

    /**
     * Builds the domain menu, with a filter above a long list.
     * @returns {HTMLDivElement} The menu.
     */
    _createMenu() {
        const menu = document.createElement("div");
        menu.className = "dropdown-menu wx-prefix-menu";

        this._filter = null;
        if (this._options.length > webexpress.webui.InputDomainCtrl.FILTER_THRESHOLD) {
            const filter = document.createElement("input");
            filter.type = "text";
            filter.className = "form-control wx-prefix-filter";
            filter.setAttribute("autocomplete", "off");
            filter.setAttribute("aria-label", this._i18n("webexpress.webui:domain.filter", "Search domain"));
            filter.placeholder = this._i18n("webexpress.webui:domain.filter", "Search domain");
            filter.addEventListener("input", () => this._applyFilter());
            this._filter = filter;
            menu.appendChild(filter);
        }

        const list = document.createElement("ul");
        list.setAttribute("role", "list");
        const fragment = document.createDocumentFragment();
        for (const option of this._options) {
            const li = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "dropdown-item";
            button.textContent = option.label;
            button.addEventListener("click", () => {
                this.domain = option.domain;
                webexpress.webui.NativeMenu.hide(menu);
                this._user.focus({ preventScroll: true });
            });
            li.appendChild(button);
            fragment.appendChild(li);
            option.item = li;
        }
        list.appendChild(fragment);
        menu.appendChild(list);
        return menu;
    }

    /**
     * Shows the domains whose name holds the filter text.
     */
    _applyFilter() {
        const text = this._filter ? this._filter.value.trim().toLowerCase() : "";
        for (const option of this._options) {
            option.item.hidden = !!text && !option.label.toLowerCase().includes(text);
        }
    }

    /**
     * Takes a value from outside the field.
     * @param {string} value - The account in either notation.
     * @param {boolean} notify - Whether a change is announced.
     */
    _apply(value, notify) {
        const text = String(value ?? "").trim();
        const parsed = webexpress.webui.InputDomainCtrl.parse(text);
        const offered = parsed && this._offered(parsed.domain);
        if (offered) {
            this._domain = offered;
            this._notation = parsed.format;
            this._user.value = parsed.user;
        } else {
            this._notation = null;
            this._user.value = text;
        }
        this._commit(notify);
    }

    /**
     * Composes the account from the domain and the user name and announces a change.
     * @param {boolean} notify - Whether a change is announced.
     */
    _commit(notify) {
        const user = this._user.value.trim();
        let next = user;
        // a name that is already an account, or a field without domains, posts as written
        if (user && this._domain && !user.includes("\\") && !user.includes("@")) {
            // an account given in full keeps its notation - example.com\alice stays down-level,
            // and a logon name too long for one stays a principal name; the server reports a
            // notation the field does not accept instead of the field rewriting it
            const notation = this._notation || this._format;
            const principal = notation ? notation === "principal" : this._domain.includes(".");
            next = principal ? user + "@" + this._domain : this._domain + "\\" + user;
        }
        const old = this._value;
        this._value = next;
        this._render();
        if (notify && old !== next) {
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
        }
    }

    /**
     * Shows the chosen domain and writes the value into the hidden input.
     */
    _render() {
        if (this._triggerLabel) {
            this._triggerLabel.textContent = this._domain || "";
            this._trigger.disabled = this._disabled;
        }
        this._hidden.value = this._value;
        this._user.disabled = this._disabled;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-domain", webexpress.webui.InputDomainCtrl);
