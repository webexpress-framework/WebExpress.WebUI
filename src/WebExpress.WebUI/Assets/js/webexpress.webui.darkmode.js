/**
 * Dark mode toggle controller.
 * Toggles the `data-bs-theme` attribute on the document root between
 * "light" and "dark" and persists the current state in a cookie so that
 * the mode survives reloads.
 *
 * Auto-initialized via the CSS class `wx-webui-darkmode`. The module also
 * exposes the singleton `webexpress.webui.DarkMode` so the state can be
 * read or changed programmatically.
 */
webexpress.webui.DarkModeCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Creates a new DarkModeCtrl instance for the given element.
     * @param {HTMLElement} element - The host element (a button).
     */
    constructor(element) {
        super(element);

        // read optional configuration from dataset
        this._icon = element.dataset.icon || "fas fa-moon";
        this._iconLight = element.dataset.iconLight || this._icon;
        this._iconDark = element.dataset.iconDark || "fas fa-sun";
        this._title = element.dataset.title || null;

        // drop dataset config attributes to keep the DOM clean
        element.removeAttribute("data-icon");
        element.removeAttribute("data-icon-light");
        element.removeAttribute("data-icon-dark");
        element.removeAttribute("data-title");

        // base css classes for the button
        element.classList.add("btn", "wx-button", "wx-webui-darkmode-btn");

        // build the icon container once and reuse it
        this._iconElement = document.createElement("i");
        element.textContent = "";
        element.appendChild(this._iconElement);

        // apply the persisted state and sync the button
        webexpress.webui.DarkMode.apply(webexpress.webui.DarkMode.current);
        this._sync(webexpress.webui.DarkMode.current);

        // click handler toggles the mode
        element.addEventListener("click", (e) => {
            if (element.tagName === "A" && element.getAttribute("href") === "#") {
                e.preventDefault();
            }
            const next = webexpress.webui.DarkMode.toggle();
            this._sync(next);
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: next });
        });

        // stay in sync when some other instance flips the mode
        document.addEventListener(webexpress.webui.Event.CHANGE_DARKMODE_EVENT, (e) => {
            this._sync(e.detail?.mode);
        });
    }

    /**
     * Updates the icon and the button title to reflect the current mode.
     * @param {string} mode - The current mode ("light" or "dark").
     */
    _sync(mode) {
        const isDark = mode === "dark";
        this._iconElement.className = isDark ? this._iconDark : this._iconLight;

        if (this._title) {
            this._element.title = this._title;
        }

        this._element.setAttribute("aria-pressed", isDark ? "true" : "false");
        this._element.setAttribute("data-wx-darkmode-active", isDark ? "true" : "false");
    }

    /**
     * Forces a re-render of the button state.
     */
    render() {
        this._sync(webexpress.webui.DarkMode.current);
    }
};

/**
 * Singleton responsible for reading, writing, applying and persisting
 * the current dark mode state.
 */
webexpress.webui.DarkMode = new class {
    /**
     * Creates a new instance and initializes the state from the cookie.
     */
    constructor() {
        this._cookieName = "wx_darkmode";
        this._cookieMaxAgeDays = 365;
        this._current = this._readCookie() || "light";
        // apply the initial state as soon as possible so the FOUC is minimized
        this.apply(this._current);
    }

    /**
     * Gets the current mode ("light" or "dark").
     * @returns {string} the current mode.
     */
    get current() {
        return this._current;
    }

    /**
     * Sets the mode explicitly, persists it and applies it to the DOM.
     * @param {string} mode - Either "light" or "dark".
     */
    set(mode) {
        const normalized = mode === "dark" ? "dark" : "light";
        if (this._current === normalized) {
            return normalized;
        }
        this._current = normalized;
        this.apply(normalized);
        this._writeCookie(normalized);
        this._notify(normalized);
        return normalized;
    }

    /**
     * Toggles between light and dark and returns the new mode.
     * @returns {string} the new mode.
     */
    toggle() {
        return this.set(this._current === "dark" ? "light" : "dark");
    }

    /**
     * Applies the given mode to the document root element.
     * Sets `data-bs-theme="dark"` for dark mode and removes/sets it to
     * "light" when switching back.
     * @param {string} mode - Either "light" or "dark".
     */
    apply(mode) {
        const root = document.documentElement;
        if (!root) {
            return;
        }

        if (mode === "dark") {
            root.setAttribute("data-bs-theme", "dark");
        } else {
            root.setAttribute("data-bs-theme", "light");
        }
    }

    /**
     * Writes the current mode to a persistent cookie.
     * @param {string} mode - Either "light" or "dark".
     */
    _writeCookie(mode) {
        const date = new Date();
        date.setTime(date.getTime() + (this._cookieMaxAgeDays * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = this._cookieName + "=" + encodeURIComponent(mode) + ";" + expires + ";path=/;SameSite=Strict";
    }

    /**
     * Reads the mode from the cookie.
     * @returns {string|null} the persisted mode or null if not set.
     */
    _readCookie() {
        const nameEq = this._cookieName + "=";
        const ca = document.cookie ? document.cookie.split(";") : [];

        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEq) === 0) {
                const raw = decodeURIComponent(c.substring(nameEq.length, c.length));
                return raw === "dark" ? "dark" : "light";
            }
        }
        return null;
    }

    /**
     * Notifies listeners about the mode change.
     * @param {string} mode - The new mode.
     */
    _notify(mode) {
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_DARKMODE_EVENT, {
            detail: { mode: mode },
            bubbles: true
        }));
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-darkmode", webexpress.webui.DarkModeCtrl);
