/**
 * Read-only country display: the flag and the name of a country.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.CountryCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element host element
     */
    constructor(element) {
        super(element);

        this._locale = element.getAttribute("lang")
            || document.documentElement.getAttribute("lang")
            || navigator.language
            || "en";
        this._showName = element.getAttribute("data-show-name") !== "false";

        // the server translated the name with the request culture; it is kept so the page
        // reads the same as the server's other texts, and only a code set from script is
        // named by the browser
        const code = webexpress.webui.CountryCtrl.normalize(element.getAttribute("data-value"));
        const serverName = element.textContent != null ? element.textContent.trim() : "";

        const showFlag = element.getAttribute("data-show-flag") !== "false";

        element.removeAttribute("data-show-flag");
        element.removeAttribute("data-value");
        element.removeAttribute("data-show-name");
        element.classList.add("wx-country");
        element.innerHTML = "";

        this._box = document.createElement("span");
        this._flag = document.createElement("i");
        // the name beside it says the same, so the flag is not announced a second time
        this._flag.setAttribute("aria-hidden", "true");
        this._name = document.createElement("span");
        if (!this._showName) {
            this._name.className = "visually-hidden";
        }
        if (showFlag) {
            this._box.appendChild(this._flag);
        }
        this._box.appendChild(this._name);
        element.appendChild(this._box);

        this._value = null;
        this._render(code, serverName);
    }

    /**
     * Brings a code into the upper-case form of ISO 3166-1 alpha-2.
     * @param {string} code - The code in any letter case.
     * @returns {string|null} The upper-case code, or null if it is not made of two letters.
     */
    static normalize(code) {
        const normalized = String(code ?? "").trim().toUpperCase();
        return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
    }

    /**
     * Returns the ISO 3166-1 alpha-2 code of the country shown, or null.
     * @returns {string|null} The upper-case code.
     */
    get value() {
        return this._value;
    }

    /**
     * Shows another country, named in the language of the page.
     * @param {string|null} code - The code of the country, in any letter case; null clears the display.
     */
    set value(code) {
        const normalized = webexpress.webui.CountryCtrl.normalize(code);
        if (normalized !== this._value) {
            this._render(normalized, null);
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this.value });
        }
    }

    /**
     * Writes a country into the display.
     * @param {string|null} code - The normalized code.
     * @param {string|null} name - The name to show; without one, the browser names the country.
     */
    _render(code, name) {
        this._value = code;
        const label = code ? (name || this._displayName(code)) : "";

        this._flag.className = code ? "wx-flag wx-flag-" + code.toLowerCase() : "";
        this._box.hidden = !code;
        this._name.textContent = label;
        // with the name hidden, the tooltip is what tells a pointer user which flag this is
        if (!this._showName && label) {
            this._box.setAttribute("title", label);
        } else {
            this._box.removeAttribute("title");
        }
    }

    /**
     * Names a country in the language of the page.
     * @param {string} code - The normalized code.
     * @returns {string} The name, or the code where the browser has none.
     */
    _displayName(code) {
        try {
            return new Intl.DisplayNames([this._locale], { type: "region" }).of(code) || code;
        } catch (e) {
            // an unknown locale tag or a browser without display names still shows the code
            return code;
        }
    }
};

// register class
webexpress.webui.Controller.registerClass("wx-webui-country", webexpress.webui.CountryCtrl);
