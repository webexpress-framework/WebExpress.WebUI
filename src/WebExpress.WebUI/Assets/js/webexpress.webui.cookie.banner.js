/**
 * Keeps application-owned consent decisions separate from informational acknowledgements.
 * Applications must gate their own providers through state or subscribe().
 */
webexpress.webui.CookieBannerCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Validates declarative configuration before exposing any optional permission.
     * @param {HTMLElement} element - The configured host element.
     */
    constructor(element) {
        super(element);
        const config = {
            mode: element.getAttribute("data-mode"),
            storageKey: element.getAttribute("data-storage-key"),
            cookieName: element.getAttribute("data-cookie-name"),
            serverPolicy: element.getAttribute("data-server-policy"),
            version: element.getAttribute("data-version"),
            lifetime: Number(element.getAttribute("data-lifetime")),
            header: element.getAttribute("data-header"),
            text: element.getAttribute("data-text"),
            privacyUri: element.getAttribute("data-privacy-uri"),
            privacyLabel: element.getAttribute("data-privacy-label"),
            categories: JSON.parse(element.getAttribute("data-categories") || "[]")
        };
        if (!["notice", "consent"].includes(config.mode) ||
            typeof config.storageKey !== "string" || !config.storageKey.trim() ||
            typeof config.version !== "string" || !config.version.trim() ||
            !Number.isFinite(config.lifetime) || config.lifetime <= 0 || config.lifetime > 315360000000 ||
            !Array.isArray(config.categories)) {
            throw new TypeError("Invalid cookie banner configuration.");
        }
        const ids = new Set();
        for (const category of config.categories) {
            if (!category || typeof category.id !== "string" || !category.id.trim() ||
                typeof category.label !== "string" || !category.label.trim() || ids.has(category.id) ||
                typeof category.necessary !== "boolean") {
                throw new TypeError("Cookie banner categories require unique identifiers and labels.");
            }
            ids.add(category.id);
        }
        this._config = config;
        this._categories = config.mode === "consent" ? config.categories : [];
        // category changes also invalidate decisions when an application forgets to bump its version
        this._signature = JSON.stringify([config.mode, config.version,
            this._categories.map(c => [c.id, c.necessary]).sort((a, b) => a[0].localeCompare(b[0]))]);
        this._listeners = [];
        this._subscriptions = new Set();
        this._decision = this._read(webexpress.webui.LocalStorage.getJson(config.storageKey));
        this._syncCookie();
        this._build();
        this._storageHandler = event => {
            if (event.key === null || event.key === config.storageKey) {
                const stored = webexpress.webui.LocalStorage.getJson(config.storageKey);
                this._decision = this._read(stored);
                // a tab rendered for another policy owns that decision and the shared server cookie
                const foreign = typeof stored?.signature === "string" && stored.signature !== this._signature;
                this._publish("storage", !foreign);
            }
        };
        this._visibilityHandler = () => this._expire();
        window.addEventListener("storage", this._storageHandler);
        document.addEventListener("visibilitychange", this._visibilityHandler);
        this._renderState();
        this._scheduleExpiry();
    }

    /**
     * Provides a detached snapshot so integrations cannot mutate stored permissions.
     * @returns {object} Mode, decision status, timestamps and category permissions.
     */
    get state() {
        this._expire();
        return {
            mode: this._config.mode,
            decided: this._decision !== null,
            version: this._config.version,
            decidedAt: this._decision?.decidedAt ?? null,
            expiresAt: this._decision?.expiresAt ?? null,
            categories: Object.fromEntries(this._categories.map(c =>
                [c.id, c.necessary || this._decision?.categories[c.id] === true]))
        };
    }

    /**
     * Answers a known category without interpreting notice confirmation as consent.
     * @param {string} id - The application's category identifier.
     * @returns {boolean} Whether the category currently has permission.
     */
    isAllowed(id) {
        return Object.hasOwn(this.state.categories, id) && this.state.categories[id] === true;
    }

    /**
     * Delivers current state immediately and subsequent changes through one subscription.
     * @param {Function} callback - Receives a detached state snapshot.
     * @returns {Function} An unsubscribe function for application teardown.
     */
    subscribe(callback) {
        if (typeof callback !== "function") throw new TypeError("A callback is required.");
        const listener = () => callback(this.state);
        this._element.addEventListener(webexpress.webui.Event.COOKIE_CHANGE_EVENT, listener);
        this._subscriptions.add(listener);
        callback(this.state);
        return () => {
            this._element.removeEventListener(webexpress.webui.Event.COOKIE_CHANGE_EVENT, listener);
            this._subscriptions.delete(listener);
        };
    }

    /**
     * Reopens the current choices without modifying the saved decision.
     */
    openSettings() {
        this._expire();
        this._returnFocus = document.activeElement;
        if (this._config.mode === "notice") {
            this._panel.hidden = false;
            this._confirm.focus({ preventScroll: true });
            return;
        }
        const state = this.state;
        for (const [id, input] of this._inputs) input.checked = state.categories[id];
        if (!this._dialog.open) this._dialog.showModal();
    }

    /**
     * Grants all configured optional categories following an explicit user action.
     */
    acceptAll() {
        this.saveSelection(this._categories.map(c => c.id));
    }

    /**
     * Records rejection of optional purposes while retaining required functionality.
     */
    rejectOptional() {
        this.saveSelection([]);
    }

    /**
     * Persists an explicit selection; notice mode stores only an acknowledgement.
     * @param {string[]} ids - The optional category identifiers selected by the visitor.
     */
    saveSelection(ids) {
        if (!Array.isArray(ids) || ids.some(id => !this._categories.some(c => c.id === id))) {
            throw new TypeError("Only configured category identifiers can be selected.");
        }
        const now = Date.now();
        this._decision = {
            signature: this._signature,
            decidedAt: now,
            expiresAt: now + this._config.lifetime,
            categories: Object.fromEntries(this._categories.map(c => [c.id, c.necessary || ids.includes(c.id)]))
        };
        if (!webexpress.webui.LocalStorage.setJson(this._config.storageKey, this._decision)) {
            // an earlier grant left behind would be restored and sent to the server on the next visit
            webexpress.webui.LocalStorage.removeItem(this._config.storageKey);
        }
        this._close();
        this._publish("selection");
        this._restoreFocus();
    }

    /**
     * Clears the decision and immediately withdraws every optional permission.
     */
    reset() {
        this._decision = null;
        webexpress.webui.LocalStorage.removeItem(this._config.storageKey);
        this._close();
        this._publish("reset");
    }

    /**
     * Rejects expired, incompatible or malformed browser data as a whole.
     * @param {*} value - The parsed storage entry.
     * @returns {object|null} A validated decision or no decision.
     */
    _read(value) {
        const now = Date.now();
        if (!value || value.signature !== this._signature ||
            !Number.isFinite(value.decidedAt) || value.decidedAt > now || value.decidedAt < 0 ||
            !Number.isFinite(value.expiresAt) || value.expiresAt <= now || value.expiresAt <= value.decidedAt ||
            value.expiresAt - value.decidedAt > this._config.lifetime ||
            !value.categories || typeof value.categories !== "object" || Array.isArray(value.categories) ||
            Object.keys(value.categories).length !== this._categories.length ||
            this._categories.some(c => !Object.hasOwn(value.categories, c.id) ||
                typeof value.categories[c.id] !== "boolean" || (c.necessary && !value.categories[c.id]))) {
            return null;
        }
        return value;
    }

    /**
     * Revokes a decision on a long-lived page as soon as its lifetime ends.
     */
    _expire() {
        if (this._decision && this._decision.expiresAt <= Date.now()) {
            this._decision = null;
            this._publish("expired");
        }
    }

    /**
     * Bounds timer delays to the browser limit without shortening the configured lifetime.
     */
    _scheduleExpiry() {
        clearTimeout(this._timer);
        if (this._decision) {
            this._timer = setTimeout(() => {
                this._expire();
                this._scheduleExpiry();
            }, Math.min(2147483647, Math.max(1, this._decision.expiresAt - Date.now())));
        }
    }

    /**
     * Updates visibility before announcing an already-applied decision.
     * @param {string} reason - The source of the state transition.
     * @param {boolean} syncCookie - False when the server cookie belongs to another policy.
     */
    _publish(reason, syncCookie = true) {
        if (syncCookie) this._syncCookie();
        this._renderState();
        this._scheduleExpiry();
        this._dispatch(webexpress.webui.Event.COOKIE_CHANGE_EVENT, { state: this.state, reason });
    }

    /**
     * Mirrors preferences into a bounded cookie for subsequent C# requests.
     * Cookies remain browser-supplied preferences rather than authorization credentials.
     */
    _syncCookie() {
        if (!this._config.cookieName || !this._config.serverPolicy) return;
        const value = this._decision ? encodeURIComponent(JSON.stringify({
            policy: this._config.serverPolicy,
            decidedAt: this._decision.decidedAt,
            expiresAt: this._decision.expiresAt,
            categories: this._decision.categories
        })) : "";
        const maxAge = this._decision && value.length <= 3800
            ? Math.max(0, Math.floor((this._decision.expiresAt - Date.now()) / 1000)) : 0;
        const secure = globalThis.location?.protocol === "https:" ? "; Secure" : "";
        // remove an older permission when the new preference exceeds the cookie limit
        try {
            document.cookie = this._config.cookieName + "=" + (maxAge > 0 ? value : "") +
                "; Path=/; SameSite=Lax; Max-Age=" + maxAge + secure;
        } catch {
            // blocked cookies must not prevent the visitor from withdrawing browser permissions
        }
    }

    /**
     * Keeps a permanent entry point after the initial banner has been dismissed.
     */
    _renderState() {
        this._panel.hidden = this._decision !== null;
        this._opener.hidden = this._decision === null;
    }

    /**
     * Resolves standard UI text using the framework translation service.
     * @param {string} key - The cookie banner translation suffix.
     * @returns {string} The localized text.
     */
    _text(key) {
        return this._i18n("webexpress.webui:cookiebanner." + key, key);
    }

    /**
     * Creates text through DOM properties so application labels remain inert.
     * @param {string} tag - The HTML element name.
     * @param {string} text - Optional plain text content.
     * @param {HTMLElement} parent - The destination container.
     * @returns {HTMLElement} The appended element.
     */
    _node(tag, text, parent) {
        const node = document.createElement(tag);
        if (text) node.textContent = text;
        parent.appendChild(node);
        return node;
    }

    /**
     * Tracks event bindings so controller teardown releases all callbacks.
     * @param {HTMLElement} parent - The action container.
     * @param {string} key - The localized button label suffix.
     * @param {Function} action - The explicit visitor action.
     * @returns {HTMLButtonElement} The action button.
     */
    _button(parent, key, action) {
        const button = this._node("button", this._text(key), parent);
        button.type = "button";
        button.className = key === "reject" ? "btn btn-primary" : "btn btn-secondary";
        button.addEventListener("click", action);
        this._listeners.push([button, "click", action]);
        return button;
    }

    /**
     * Shares the configured privacy destination between the banner and settings.
     * @param {HTMLElement} parent - The container receiving the optional privacy link.
     */
    _privacyLink(parent) {
        if (this._config.privacyUri) {
            // permit web destinations and relative links, never executable URI schemes
            const uri = this._config.privacyUri.trim();
            let allowed = false;
            try { allowed = ["http:", "https:"].includes(new URL(uri, document.baseURI).protocol); } catch { /* invalid destinations remain inert */ }
            if (allowed) {
                const link = this._node("a", this._config.privacyLabel || this._text("privacy"), parent);
                link.setAttribute("href", uri);
            }
        }
    }

    /**
     * Builds the banner and native modal with browser-managed keyboard focus containment.
     */
    _build() {
        this._element.classList.add("wx-cookie-banner");
        this._panel = this._node("section", "", this._element);
        this._panel.className = "wx-cookie-banner-panel";
        this._panel.setAttribute("aria-label", this._config.header || this._text("title"));
        this._node("h2", this._config.header || this._text("title"), this._panel);
        this._node("p", this._config.text || this._text(this._config.mode), this._panel);
        this._privacyLink(this._panel);
        const actions = this._node("div", "", this._panel);
        actions.className = "wx-cookie-banner-actions";
        if (this._config.mode === "notice") {
            this._confirm = this._button(actions, "confirm", () => this.saveSelection([]));
        } else {
            this._button(actions, "accept", () => this.acceptAll());
            this._button(actions, "reject", () => this.rejectOptional());
            this._button(actions, "settings", () => this.openSettings());
        }
        this._opener = this._button(this._element,
            this._config.mode === "notice" ? "privacy" : "settings", () => this.openSettings());
        this._opener.classList.add("wx-cookie-banner-opener");
        this._inputs = new Map();
        if (this._config.mode !== "consent") return;
        this._dialog = this._node("dialog", "", this._element);
        this._dialog.className = "wx-cookie-banner-dialog";
        const keyHandler = event => this._onDialogKeyDown(event);
        this._dialog.addEventListener("keydown", keyHandler);
        this._listeners.push([this._dialog, "keydown", keyHandler]);
        this._dialog.setAttribute("aria-label", this._text("settings"));
        this._node("h2", this._text("settings"), this._dialog);
        for (const category of this._categories) {
            const label = this._node("label", "", this._dialog);
            label.className = "wx-cookie-banner-category";
            const input = this._node("input", "", label);
            input.type = "checkbox";
            input.disabled = category.necessary;
            this._inputs.set(category.id, input);
            this._node("span", category.label + (category.necessary ? " (" + this._text("necessary") + ")" : ""), label);
            this._node("small", category.description, label);
        }
        this._privacyLink(this._dialog);
        const dialogActions = this._node("div", "", this._dialog);
        dialogActions.className = "wx-cookie-banner-actions";
        this._button(dialogActions, "save", () =>
            this.saveSelection([...this._inputs].filter(([, input]) => input.checked).map(([id]) => id)));
        this._button(dialogActions, "reject", () => this.rejectOptional());
        this._button(dialogActions, "cancel", () => { this._close(); this._restoreFocus(); });
    }

    /**
     * Keeps Tab navigation inside the settings instead of moving into browser chrome.
     * @param {KeyboardEvent} event - The key event raised within the modal.
     */
    _onDialogKeyDown(event) {
        if (event.key !== "Tab") return;
        const controls = Array.from(this._dialog.querySelectorAll("input, button, a"))
            .filter(node => !node.disabled);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus({ preventScroll: true });
        }
    }

    /**
     * Closes only this control's dialog without changing the decision.
     */
    _close() {
        if (this._dialog?.open) this._dialog.close();
    }

    /**
     * Returns keyboard users to a visible settings entry after an action hides the banner.
     */
    _restoreFocus() {
        const target = this._returnFocus;
        if (target?.isConnected && !this._dialog?.contains(target) &&
            (!this._panel.hidden || !this._panel.contains(target))) target.focus({ preventScroll: true });
        else this._opener.focus({ preventScroll: true });
        this._returnFocus = null;
    }

    /**
     * Releases global listeners, subscriptions and timers when the host leaves the page.
     */
    destroy() {
        clearTimeout(this._timer);
        window.removeEventListener("storage", this._storageHandler);
        document.removeEventListener("visibilitychange", this._visibilityHandler);
        for (const [node, type, listener] of this._listeners) node.removeEventListener(type, listener);
        for (const listener of this._subscriptions) this._element.removeEventListener(webexpress.webui.Event.COOKIE_CHANGE_EVENT, listener);
        this._subscriptions.clear();
        this._close();
        this._element.replaceChildren();
        super.destroy();
    }
};

// register after the core controller is available
webexpress.webui.Controller.registerClass("wx-webui-cookie-banner", webexpress.webui.CookieBannerCtrl);
