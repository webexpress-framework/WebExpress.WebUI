/**
 * Keeps a sign-in alive while its grant lasts.
 *
 * The access credential lives for minutes, the grant behind it for days ("stay signed in").
 * Both are http-only cookies, and the refresh cookie only travels to /api/auth/refresh, so
 * nothing but a script can turn the grant into a new access credential. The server leaves a
 * readable hint cookie with the application and the access deadline; this script renews
 * shortly before that deadline, after a sleeping tab wakes up, and on a page that was
 * rendered after the deadline (an idle tab, a restarted server) - that page showed the
 * visitor as anonymous, so it is reloaded once the grant is renewed.
 *
 * A refresh credential is good for one renewal: the server reads a second use as theft and
 * ends the grant. Tabs therefore renew one at a time (Web Locks), and a tab that waited
 * re-reads the hint, because the tab before it may already have renewed.
 */
webexpress.webui.Session = new class {
    /**
     * Starts watching the grant of the current page.
     */
    constructor() {
        this.MARGIN = 60000;
        this.RETRY = 30000;
        this.RELOAD_GUARD = 30000;
        this.HINT_NAMES = ["__Host-wx-auth-renew", "wx-auth-renew"];
        this.LOCK = "wx-auth-renew";
        this.RELOAD_KEY = "wx_auth_reload";

        this._timer = null;
        this._renewing = null;

        const hint = this._readHint();
        if (hint && hint.expiresAt <= Date.now()) {
            this._renew(true);
        } else {
            this._schedule();
        }

        // background tabs throttle their timers, so a tab coming back checks right away
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState !== "hidden") {
                this._schedule();
            }
        });
    }

    /**
     * Reads the hint the server left with the credentials.
     * @returns {{application: string, expiresAt: number}|null} The application and the
     *     access deadline in milliseconds, or null without a grant.
     */
    _readHint() {
        let cookies = "";
        try {
            cookies = String(document.cookie || "");
        } catch {
            return null;
        }
        for (const part of cookies.split(";")) {
            const index = part.indexOf("=");
            const name = part.slice(0, index).trim();
            if (index < 0 || !this.HINT_NAMES.includes(name)) {
                continue;
            }
            const value = decodeURIComponent(part.slice(index + 1).trim());
            const separator = value.lastIndexOf(":");
            const seconds = Number(value.slice(separator + 1));
            if (separator > 0 && Number.isFinite(seconds)) {
                return { application: value.slice(0, separator), expiresAt: seconds * 1000 };
            }
        }
        return null;
    }

    /**
     * Plans the next renewal shortly before the access deadline - a minute ahead, or halfway
     * there for a credential that lives shorter, so a renewal never follows the last at once.
     * @param {number} [delay] - A fixed delay, used to retry after a failed attempt.
     */
    _schedule(delay) {
        clearTimeout(this._timer);
        this._timer = null;
        const hint = this._readHint();
        if (!hint) {
            return;
        }
        const remaining = hint.expiresAt - Date.now();
        if (delay === undefined && remaining <= 0) {
            this._renew(false);
            return;
        }
        const due = delay ?? remaining - Math.min(this.MARGIN, remaining / 2);
        this._timer = setTimeout(() => this._renew(false), Math.min(due, 2147483647));
    }

    /**
     * Renews the grant once, across all tabs of the browser, and plans the next renewal.
     * @param {boolean} reload - Whether the page was rendered without a valid credential and
     *     has to be loaded again to show the signed-in state.
     * @returns {Promise<void>} Settles when the attempt is over.
     */
    _renew(reload) {
        if (this._renewing) {
            return this._renewing;
        }
        const seen = this._readHint();
        let retry;
        const run = async () => {
            const hint = this._readHint();
            if (!hint) {
                return;
            }
            // a deadline that moved while this tab waited for the lock was renewed by another tab
            if (seen && hint.expiresAt !== seen.expiresAt) {
                if (reload) {
                    this._reload();
                }
                return;
            }
            const result = await webexpress.webui.Transport.request(
                "/api/auth/refresh?application=" + encodeURIComponent(hint.application), {
                    method: "POST",
                    headers: { "X-WebExpress-Auth": "1" },
                    credentials: "same-origin"
                });
            if (result.ok) {
                if (reload) {
                    this._reload();
                }
            } else {
                // the server keeps the hint only when it could not answer (a restart, the
                // network); a refused grant takes the hint with it, and nothing is planned
                retry = this.RETRY;
            }
        };
        const locks = typeof navigator !== "undefined" ? navigator.locks : null;
        const attempt = locks ? locks.request(this.LOCK, run) : run();
        // planned only once this attempt is over, since a renewal due right away would otherwise
        // find this one still running and be dropped
        this._renewing = Promise.resolve(attempt).catch(() => { retry = this.RETRY; }).finally(() => {
            this._renewing = null;
            this._schedule(retry);
        });
        return this._renewing;
    }

    /**
     * Loads the page again, unless it was just loaded for the same reason - a server that
     * keeps rendering the page anonymous must not make it reload forever.
     */
    _reload() {
        let last = 0;
        try {
            last = Number(sessionStorage.getItem(this.RELOAD_KEY)) || 0;
            if (Date.now() - last < this.RELOAD_GUARD) {
                return;
            }
            sessionStorage.setItem(this.RELOAD_KEY, String(Date.now()));
        } catch {
            // without storage there is no guard; a single reload is still the right answer
        }
        window.location.reload();
    }
};
