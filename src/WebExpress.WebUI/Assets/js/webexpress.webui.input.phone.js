/**
 * A telephone number field: a country picker showing the flag and calling code, beside a
 * field for the national number. The value is the international E.164 form (+4930123456),
 * so a number entered in one country dials from everywhere.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT
 */
webexpress.webui.InputPhoneCtrl = class extends webexpress.webui.MenuCtrl {
    _value = "";
    _country = null;
    _disabled = false;

    /**
     * Constructor for initializing the phone control.
     * @param {HTMLElement} element - The DOM element for the phone control.
     */
    constructor(element) {
        super(element);

        const id = element.getAttribute("id");
        const name = element.getAttribute("name");
        const value = element.getAttribute("data-value") || "";
        this._placeholder = element.getAttribute("placeholder") || "";
        this._disabled = element.hasAttribute("disabled") || element.classList.contains("disabled");
        this._locale = document.documentElement.getAttribute("lang") || navigator.language || "en";
        this._options = this._readOptions(element);

        // a number names its own country; an empty field starts in the country the server
        // chose, else in the one of the page language
        this._country = this._offered(element.getAttribute("data-country"))
            || this._offered((this._locale.split("-")[1] || ""))
            || this._options[0]?.country
            || null;

        const hidden = document.createElement("input");
        hidden.type = "hidden";
        if (id) {
            hidden.id = id;
        }
        hidden.name = name || "";
        this._hidden = hidden;

        const field = this._createField();
        const menu = this._createMenu();

        element.removeAttribute("id");
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-value");
        element.removeAttribute("data-country");
        element.removeAttribute("disabled");
        element.innerHTML = "";
        element.classList.add("wx-phone-input");
        element.appendChild(hidden);
        element.appendChild(field);
        element.appendChild(menu);

        this._initializeMenu(field, menu, this._trigger);
        menu.addEventListener("toggle", (event) => {
            if (event.newState === "open") {
                this._filter.value = "";
                this._applyFilter();
                this._filter.focus({ preventScroll: true });
            }
        });
        // the number is captioned by the field label, the country button by its own purpose
        this._adoptFieldLabel(this._number, id, element, []);
        // a field placed outside a form has no label to adopt, and the placeholder is only a
        // hint that disappears with the first digit
        if (!this._number.hasAttribute("aria-labelledby") && !this._number.hasAttribute("aria-label")) {
            this._number.setAttribute("aria-label", this._i18n("webexpress.webui:phone.number", "Phone number"));
        }
        this._trigger.setAttribute("aria-label", this._i18n("webexpress.webui:phone.country", "Country calling code"));
        menu.setAttribute("aria-label", this._i18n("webexpress.webui:phone.country", "Country calling code"));

        this._apply(value, false);
    }

    /**
     * Returns the number in international form, or an empty text. A number still being typed
     * is returned as it stands, so the server can say what is wrong with it.
     * @returns {string} The number.
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the number. An international number selects its country; a national one is read in
     * the country currently chosen.
     * @param {string} value - The number in any notation.
     */
    set value(value) {
        this._apply(value, true);
    }

    /**
     * Returns the code of the country chosen.
     * @returns {string|null} The upper-case country code.
     */
    get country() {
        return this._country;
    }

    /**
     * Chooses another country; the national number stays and is read in the new country.
     * @param {string} country - The country code, in any letter case.
     */
    set country(country) {
        const offered = this._offered(country);
        if (offered && offered !== this._country) {
            this._country = offered;
            this._commit(this._number.value, true);
        }
    }

    /** Gets whether the field prevents user changes. */
    get disabled() {
        return this._disabled;
    }

    /**
     * Keeps the country button and the number field in the same enabled state.
     * @param {boolean} value - Whether user changes should be prevented.
     */
    set disabled(value) {
        this._disabled = !!value;
        this._render();
    }

    /**
     * Validates the number in its country without presenting anything.
     * @returns {string[]} The messages; empty for a valid or an empty field.
     */
    validate() {
        if (!this._value) {
            return [];
        }
        const normalized = webexpress.webui.PhoneCatalog.normalize(this._value);
        if (!normalized) {
            return [this._i18n("webexpress.webui:phone.invalid", "The phone number is not valid.")];
        }
        // a number may belong to several countries of its calling code; one offered is enough
        return this._options.some((option) => webexpress.webui.PhoneCatalog.fits(normalized, option.country))
            ? []
            : [this._i18n("webexpress.webui:phone.country.refused", "Phone numbers of this country are not accepted.")];
    }

    /**
     * Reads the countries offered from the option elements the server rendered, or offers every
     * country with a numbering plan, named by the browser.
     * @param {HTMLElement} element - The host element.
     * @returns {Array<{country: string, label: string, code: string}>} The options, sorted by name.
     */
    _readOptions(element) {
        const catalog = webexpress.webui.PhoneCatalog;
        let options = Array.from(element.querySelectorAll(".wx-selection-item")).map((item) => ({
            country: String(item.getAttribute("id") || "").toUpperCase(),
            label: item.getAttribute("data-label") || ""
        }));
        if (!options.length) {
            options = catalog.countries().map((country) => ({ country: country, label: "" }));
        }
        let names = null;
        try {
            names = new Intl.DisplayNames([this._locale], { type: "region" });
        } catch (e) {
            // without display names a country is listed by its code
        }
        return options
            .filter((option) => catalog.callingCode(option.country))
            .map((option) => ({
                country: option.country,
                label: option.label || names?.of(option.country) || option.country,
                code: catalog.callingCode(option.country)
            }))
            .sort((a, b) => a.label.localeCompare(b.label, this._locale));
    }

    /**
     * Returns the offered country an international number is read in: the chosen one where
     * the number fits it, as within a shared calling code, else the detected one, else any
     * offered one the number fits. A number still being typed names only its detected country.
     * @param {string} value - The number, international.
     * @param {{country: string}} split - The parts of the number.
     * @returns {string|null} The upper-case country code, or null if none offered fits.
     */
    _countryOf(value, split) {
        const catalog = webexpress.webui.PhoneCatalog;
        const normalized = catalog.normalize(value);
        if (!normalized) {
            return this._offered(split.country);
        }
        if (this._country && catalog.fits(normalized, this._country)) {
            return this._country;
        }
        return this._offered(catalog.country(normalized))
            || this._options.find((option) => catalog.fits(normalized, option.country))?.country
            || null;
    }

    /**
     * Returns a country when it is offered.
     * @param {string} country - The country code, in any letter case.
     * @returns {string|null} The upper-case code, or null.
     */
    _offered(country) {
        const code = String(country ?? "").trim().toUpperCase();
        return this._options.some((option) => option.country === code) ? code : null;
    }

    /**
     * Builds the visible field: the country button and the number input.
     * @returns {HTMLDivElement} The field.
     */
    _createField() {
        const field = document.createElement("div");
        field.className = "form-control wx-prefix-field";

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "wx-prefix-button";
        this._triggerFlag = document.createElement("i");
        this._triggerFlag.setAttribute("aria-hidden", "true");
        this._triggerCode = document.createElement("span");
        const caret = document.createElement("i");
        caret.className = this._iconClass("angle-down");
        caret.setAttribute("aria-hidden", "true");
        trigger.appendChild(this._triggerFlag);
        trigger.appendChild(this._triggerCode);
        trigger.appendChild(caret);
        this._trigger = trigger;

        const number = document.createElement("input");
        number.type = "tel";
        number.className = "wx-prefix-text";
        number.setAttribute("autocomplete", "tel-national");
        number.setAttribute("inputmode", "tel");
        if (this._placeholder) {
            number.placeholder = this._placeholder;
        }
        number.addEventListener("input", () => {
            // a pasted or typed international number names its country itself
            const split = webexpress.webui.PhoneCatalog.split(number.value);
            const country = split && /^\s*(\+|00)/.test(number.value) ? this._countryOf(number.value, split) : null;
            if (country) {
                this._country = country;
                number.value = split.national;
            }
            this._commit(number.value, true);
        });
        this._number = number;

        field.appendChild(trigger);
        field.appendChild(number);
        return field;
    }

    /**
     * Builds the country menu: a filter above the list of countries.
     * @returns {HTMLDivElement} The menu.
     */
    _createMenu() {
        const menu = document.createElement("div");
        menu.className = "dropdown-menu wx-prefix-menu";

        const filter = document.createElement("input");
        filter.type = "text";
        filter.className = "form-control wx-prefix-filter";
        filter.setAttribute("autocomplete", "off");
        filter.setAttribute("aria-label", this._i18n("webexpress.webui:phone.filter", "Search country"));
        filter.placeholder = this._i18n("webexpress.webui:phone.filter", "Search country");
        filter.addEventListener("input", () => this._applyFilter());
        this._filter = filter;

        const list = document.createElement("ul");
        list.setAttribute("role", "list");
        const fragment = document.createDocumentFragment();
        for (const option of this._options) {
            const li = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "dropdown-item";
            button.setAttribute("data-country", option.country);
            const flag = document.createElement("i");
            flag.className = "wx-flag wx-flag-" + option.country.toLowerCase();
            flag.setAttribute("aria-hidden", "true");
            const label = document.createElement("span");
            label.textContent = option.label;
            const code = document.createElement("span");
            code.className = "wx-prefix-detail";
            code.textContent = "+" + option.code;
            button.appendChild(flag);
            button.appendChild(label);
            button.appendChild(code);
            button.addEventListener("click", () => {
                this.country = option.country;
                webexpress.webui.NativeMenu.hide(menu);
                this._number.focus({ preventScroll: true });
            });
            li.appendChild(button);
            fragment.appendChild(li);
            option.item = li;
        }
        list.appendChild(fragment);

        menu.appendChild(filter);
        menu.appendChild(list);
        this._menu = menu;
        return menu;
    }

    /**
     * Shows the countries whose name or calling code holds the filter text.
     */
    _applyFilter() {
        const text = this._filter.value.trim().toLowerCase().replace(/^\+/, "");
        for (const option of this._options) {
            option.item.hidden = !!text && !option.label.toLowerCase().includes(text) && !option.code.startsWith(text);
        }
    }

    /**
     * Takes a value from outside the field.
     * @param {string} value - The number in any notation.
     * @param {boolean} notify - Whether a change is announced.
     */
    _apply(value, notify) {
        const text = String(value ?? "").trim();
        const split = webexpress.webui.PhoneCatalog.split(text);
        const country = split ? this._countryOf(text, split) : null;
        if (country) {
            this._country = country;
            this._number.value = split.national;
        } else {
            this._number.value = text;
        }
        this._commit(this._number.value, notify);
    }

    /**
     * Composes the value from the country and the national number and announces a change.
     * @param {string} national - The national number as typed.
     * @param {boolean} notify - Whether a change is announced.
     */
    _commit(national, notify) {
        const catalog = webexpress.webui.PhoneCatalog;
        const text = String(national ?? "").trim();
        // only the separators of a written number go; any other character is kept, so the
        // field reports it instead of silently turning a typo into a valid number
        const digits = text.replace(/[\s\-./()]/g, "");
        const code = catalog.callingCode(this._country);
        let next = "";
        if (/[^0-9]/.test(digits.replace(/^\+/, ""))) {
            next = text;
        } else if (digits.startsWith("+") || digits.startsWith("00")) {
            // an international number keeps its own calling code even where its country is
            // not offered; read in the chosen country it would dial somewhere else entirely
            next = "+" + digits.replace(/^(\+|00)/, "");
        } else if (digits && code) {
            // a number dialled within the country starts with its national prefix, which the
            // international form leaves out
            next = "+" + code + catalog.stripPrefix(digits, this._country);
        }
        const old = this._value;
        this._value = next;
        this._render();
        if (notify && old !== next) {
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
        }
    }

    /**
     * Shows the chosen country and writes the value into the hidden input.
     */
    _render() {
        const country = this._country;
        this._triggerFlag.className = country ? "wx-flag wx-flag-" + country.toLowerCase() : "";
        this._triggerCode.textContent = country ? "+" + webexpress.webui.PhoneCatalog.callingCode(country) : "";
        this._hidden.value = this._value;
        this._trigger.disabled = this._disabled;
        this._number.disabled = this._disabled;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-phone", webexpress.webui.InputPhoneCtrl);
