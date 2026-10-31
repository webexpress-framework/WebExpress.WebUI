/**
 * Read-only e-mail address: an envelope and the address as a link that writes to it.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.EmailCtrl = class extends webexpress.webui.Ctrl {
    // the rule browsers apply to an input of type email, which the server shares (EmailAddress.cs)
    static PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    /**
     * Constructor
     * @param {HTMLElement} element host element
     */
    constructor(element) {
        super(element);

        const value = element.getAttribute("data-value") || element.textContent;

        element.removeAttribute("data-value");
        element.classList.add("wx-email");
        element.innerHTML = "";

        this._box = document.createElement("span");
        const icon = document.createElement("i");
        icon.className = this._iconClass("envelope");
        icon.setAttribute("aria-hidden", "true");
        this._link = document.createElement("a");
        this._box.appendChild(icon);
        this._box.appendChild(this._link);
        element.appendChild(this._box);

        this._value = null;
        this._render(webexpress.webui.EmailCtrl.normalize(value));
    }

    /**
     * Brings an address into its stored form: trimmed, with the domain in lower case.
     * @param {string} value - The address as written.
     * @returns {string|null} The normalized address, or null if it is no valid address.
     */
    static normalize(value) {
        const trimmed = String(value ?? "").trim();
        if (!trimmed || trimmed.length > 254 || !webexpress.webui.EmailCtrl.PATTERN.test(trimmed)) {
            return null;
        }
        const at = trimmed.lastIndexOf("@");
        return at > 64 ? null : trimmed.slice(0, at) + "@" + trimmed.slice(at + 1).toLowerCase();
    }

    /**
     * Returns the address shown, or null.
     * @returns {string|null} The normalized address.
     */
    get value() {
        return this._value;
    }

    /**
     * Shows another address; an invalid one clears the display.
     * @param {string|null} value - The address.
     */
    set value(value) {
        const normalized = webexpress.webui.EmailCtrl.normalize(value);
        if (normalized !== this._value) {
            this._render(normalized);
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this.value });
        }
    }

    /**
     * Writes an address into the display.
     * @param {string|null} value - The normalized address.
     */
    _render(value) {
        this._value = value;
        this._box.hidden = !value;
        this._link.textContent = value || "";
        if (value) {
            // the local part may carry ? & # %, which in a mailto url would start headers or a
            // fragment; the domain holds none of them
            const at = value.lastIndexOf("@");
            this._link.setAttribute("href", "mailto:" + encodeURIComponent(value.slice(0, at)) + "@" + value.slice(at + 1));
        } else {
            this._link.removeAttribute("href");
        }
    }
};

// register class
webexpress.webui.Controller.registerClass("wx-webui-email", webexpress.webui.EmailCtrl);
