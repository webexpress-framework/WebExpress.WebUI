/**
 * Read-only date (or date range) display control.
 * Stores only normalized values internally (no raw), i.e. Date or { start: Date|null, end: Date|null } or null.
 */
webexpress.webui.DateCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element host element
     */
    constructor(element) {
        super(element);

        // read attributes
        const initialText = element.textContent != null ? element.textContent.trim() : "";

        // options: locale, format, range separator
        this._locale = element.getAttribute("lang")
            || document.documentElement.getAttribute("lang")
            || navigator.language
            || "de-DE";
        this._format = element.dataset.format || "short"; // supports: short|medium|long|full or token pattern e.g. "DD.MM.YYYY"
        this._rangeSeparator = element.dataset.separator || " – ";

        // normalize initial value
        this._value = this._normalizeValue(initialText);

        // cleanup element
        element.removeAttribute("data-value");
        element.classList.add("wx-date");
        element.innerHTML = "";

        // output
        const span = document.createElement("span");
        const icon = document.createElement("i");
        icon.classList.add("fa-solid", "fa-calendar-days");
        span.appendChild(icon);

        this._span = document.createElement("span");
        span.appendChild(this._span);
        element.appendChild(span);

        this.render();
    }

    /**
     * Renders the current normalized value into the DOM.
     */
    render() {
        let display = "";

        try {
            const val = this._value;

            if (val == null) {
                display = "";
            } else if (val instanceof Date) {
                display = this._formatDate(val);
            } else if (typeof val === "object") {
                const start = val.start instanceof Date ? val.start : null;
                const end = val.end instanceof Date ? val.end : null;

                if (start && end) {
                    if (this._isSameDay(start, end)) {
                        display = this._formatDate(start);
                    } else {
                        display = this._formatDate(start) + this._rangeSeparator + this._formatDate(end);
                    }
                } else if (start) {
                    display = this._formatDate(start);
                } else if (end) {
                    display = this._formatDate(end);
                } else {
                    display = "";
                }
            } else {
                display = "";
            }
        } catch (err) {
            display = "";
        }

        this._span.textContent = display;
    }

    /**
     * Retrieves the normalized value.
     *
     * Possible return types:
     * - Date: for a single valid date
     * - { start: Date|null, end: Date|null }: for a date range
     * - null: if the value could not be parsed or is invalid
     *
     * @returns {Date|{start: Date|null, end: Date|null}|null} The current normalized value
     */
    get value() {
        return this._value;
    }

    /**
     * Sets a new value and triggers a re-render.
     *
     * Accepted input types:
     * - Date instance
     * - String:
     *   - Single date (e.g., "2025-11-28")
     *   - Range separated by ";" (e.g., "2025-11-28;2025-11-30")
     *   - Range separated by " - ", " – ", or " bis " (e.g., "2025-11-28 - 2025-11-30")
     * - Object with { start: Date|string, end: Date|string }
     * - Number (timestamp in milliseconds)
     *
     * @param {any} val - The new value to normalize and set
     */
    set value(val) {
        const normalized = this._normalizeValue(val);
        if (!this._equals(normalized, this._value)) {
            this._value = normalized;
            this.render();
        }
    }

    /**
     * Retrieves the current date format string.
     *
     * Supported values:
     * - Predefined styles: "short" | "medium" | "long" | "full"
     * - Custom token patterns (e.g., "DD.MM.YYYY")
     *
     * @returns {string} The currently active format string
     */
    get format() {
        return this._format;
    }

    /**
     * Sets the date format and triggers a re-render.
     *
     * Accepted values:
     * - Predefined styles: "short" | "medium" | "long" | "full"
     * - Custom token patterns (e.g., "DD.MM.YYYY")
     *
     * If the provided format is not a non-empty string, defaults to "short".
     *
     * @param {string} fmt - The new format string
     */
    set format(fmt) {
        const next = typeof fmt === "string" && fmt.trim().length > 0 ? fmt.trim() : "short";
        if (next !== this._format) {
            this._format = next;
            this.render();
        }
    }

    /**
     * Compares two normalized values for equality.
     *
     * Supported comparisons:
     * - Two Date instances (valid dates only)
     * - Two objects with { start, end } properties (each a Date or null)
     * - Null values
     *
     * @param {any} a - The first value to compare
     * @param {any} b - The second value to compare
     * @returns {boolean} True if both values are considered equal, otherwise false
     */
    _equals(a, b) {
        if (a === b) {
            return true;
        }
        const isDate = function(x) { return x instanceof Date && !isNaN(x.getTime()); };
        if (isDate(a) && isDate(b)) {
            return a.getTime() === b.getTime();
        }
        if (a && b && typeof a === "object" && typeof b === "object") {
            const as = isDate(a.start) ? a.start.getTime() : null;
            const ae = isDate(a.end) ? a.end.getTime() : null;
            const bs = isDate(b.start) ? b.start.getTime() : null;
            const be = isDate(b.end) ? b.end.getTime() : null;
            return as === bs && ae === be;
        }
        return a == null && b == null;
    }

    /**
     * Normalizes any supported input into a Date, a date range object, or null.
     *
     * Supported inputs:
     * - Date instance
     * - Number (timestamp in milliseconds)
     * - String (single date or range, e.g. "2025-11-28", "2025-11-28;2025-11-30", "2025-11-28 - 2025-11-30")
     * - Object with { start, end } properties
     *
     * @param {any} val - The input value to normalize
     * @returns {Date|{start: Date|null, end: Date|null}|null}
     *   - A Date if input resolves to a single valid date
     *   - An object with { start, end } if input resolves to a range
     *   - Null if input is invalid or cannot be parsed
     */
    _normalizeValue(val) {
        if (val && typeof val === "object" && !(val instanceof Date)) {
            const start = this._toDate(val.start);
            const end = this._toDate(val.end);
            if (start && end && this._isSameDay(start, end)) {
                return start;
            } else {
                return { start: start || null, end: end || null };
            }
        }

        if (val instanceof Date) {
            return isNaN(val.getTime()) ? null : val;
        }

        if (typeof val === "number") {
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
        }

        if (typeof val === "string") {
            const s = val.trim();
            if (s.length === 0) {
                return null;
            }

            if (s.includes(";")) {
                const parts = s.split(";").map(function(x) { return x.trim(); }).filter(Boolean);
                const start = this._toDate(parts[0]);
                const end = this._toDate(parts[1]);
                if (start && end && this._isSameDay(start, end)) {
                    return start;
                } else {
                    return { start: start || null, end: end || null };
                }
            }

            if (s.includes(" - ") || s.includes(" – ") || s.includes(" bis ")) {
                const sep = s.includes(" - ") ? " - " : (s.includes(" – ") ? " – " : " bis ");
                const segs = s.split(sep);
                const start = this._toDate(segs[0] ? segs[0].trim() : "");
                const end = this._toDate(segs[1] ? segs[1].trim() : "");
                if (start && end && this._isSameDay(start, end)) {
                    return start;
                } else {
                    return { start: start || null, end: end || null };
                }
            }

            const d = this._toDate(s);
            return d ? d : null;
        }

        return null;
    }

    /**
     * Checks whether two Date objects represent the same calendar day.
     *
     * @param {Date} a - The first date to compare
     * @param {Date} b - The second date to compare
     * @returns {boolean} True if both dates fall on the same day, otherwise false
     */
    _isSameDay(a, b) {
        if (!(a instanceof Date) || !(b instanceof Date)) {
            return false;
        }
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }

    /**
     * Tries to convert input to Date.
     * @param {Date|string|number|null|undefined} x Input.
     * @returns {Date|null} Date or null.
     */
    _toDate(x) {
        if (!x && x !== 0) {
            return null;
        }
        if (x instanceof Date) {
            return isNaN(x.getTime()) ? null : x;
        }
        if (typeof x === "number") {
            const d = new Date(x);
            return isNaN(d.getTime()) ? null : d;
        }
        if (typeof x === "string") {
            const t = x.trim();
            if (t.length === 0) {
                return null;
            }
            // try native parse (handles iso and many locales)
            const n = Date.parse(t);
            if (!isNaN(n)) {
                const d = new Date(n);
                if (!isNaN(d.getTime())) {
                    return d;
                }
            }
            // try DD.MM.YYYY with optional HH:mm
            const m1 = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(t);
            if (m1) {
                const dd = parseInt(m1[1], 10);
                const mm = parseInt(m1[2], 10) - 1;
                const yyyy = parseInt(m1[3], 10);
                const hh = m1[4] ? parseInt(m1[4], 10) : 0;
                const mi = m1[5] ? parseInt(m1[5], 10) : 0;
                const d = new Date(yyyy, mm, dd, hh, mi, 0, 0);
                return isNaN(d.getTime()) ? null : d;
            }
            // try YYYY-MM-DD with optional time
            const m2 = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(t);
            if (m2) {
                const yyyy = parseInt(m2[1], 10);
                const mm = parseInt(m2[2], 10) - 1;
                const dd = parseInt(m2[3], 10);
                const hh = m2[4] ? parseInt(m2[4], 10) : 0;
                const mi = m2[5] ? parseInt(m2[5], 10) : 0;
                const ss = m2[6] ? parseInt(m2[6], 10) : 0;
                const d = new Date(yyyy, mm, dd, hh, mi, ss, 0);
                return isNaN(d.getTime()) ? null : d;
            }
        }
        return null;
    }

    /**
     * Formats date according to configured pattern or style.
     * @param {Date} d Date to format.
     * @returns {string} Formatted string.
     */
    _formatDate(d) {
        if (!(d instanceof Date) || isNaN(d.getTime())) {
            return "";
        }

        const f = this._format;

        // token-based formatting (supports YYYY, MM, DD)
        if (/[YMD]/.test(f) && !/^(short|medium|long|full)$/i.test(f)) {
            const yyyy = String(d.getFullYear());
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return f
                .replace(/YYYY/g, yyyy)
                .replace(/MM/g, mm)
                .replace(/DD/g, dd);
        }

        const style = String(f).toLowerCase();
        let dateStyle = "short";
        if (style === "medium" || style === "long" || style === "full") {
            dateStyle = style;
        }

        try {
            const fmt = new Intl.DateTimeFormat(this._locale, { dateStyle: dateStyle });
            return fmt.format(d);
        } catch (e) {
            const yyyy = String(d.getFullYear());
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return dd + "." + mm + "." + yyyy;
        }
    }
};

// register class
webexpress.webui.Controller.registerClass("wx-webui-date", webexpress.webui.DateCtrl);