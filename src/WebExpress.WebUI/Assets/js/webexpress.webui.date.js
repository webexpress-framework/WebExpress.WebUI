/**
 * Read-only date (or date range) display control.
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
        this._dateFormat = element.getAttribute("data-format") || this._i18n("webexpress.webui:calendar.format");
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
        return this._dateFormat;
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
        if (next !== this._dateFormat) {
            this._dateFormat = next;
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
        const isDate = function (x) { return x instanceof Date && !isNaN(x.getTime()); };
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
            const start = this._parseDate(val.start, this._dateFormat);
            const end = this._parseDate(val.end, this._dateFormat);
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
                const parts = s.split(";").map(function (x) { return x.trim(); }).filter(Boolean);
                const start = this._parseDate(parts[0], this._dateFormat);
                const end = this._parseDate(parts[1], this._dateFormat);
                if (start && end && this._isSameDay(start, end)) {
                    return start;
                } else {
                    return { start: start || null, end: end || null };
                }
            }

            if (s.includes(" - ") || s.includes(" – ") || s.includes(" bis ")) {
                const sep = s.includes(" - ") ? " - " : (s.includes(" – ") ? " – " : " bis ");
                const segs = s.split(sep);
                const start = this._parseDate(segs[0] ? segs[0].trim() : "", this._dateFormat);
                const end = this._parseDate(segs[1] ? segs[1].trim() : "", this._dateFormat);
                if (start && end && this._isSameDay(start, end)) {
                    return start;
                } else {
                    return { start: start || null, end: end || null };
                }
            }

            const d = this._parseDate(s, this._dateFormat);
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
     * Parses a date string according to the given format.
     * Supports multiple formats such as "yyyy-MM-dd", "dd.MM.yyyy", "MM/dd/yyyy", "M/d/yyyy", etc.
     * @param {string} value - Input string.
     * @param {string} format - Format string.
     * @returns {Date|null} Parsed Date or null.
     * @private
     */
    _parseDate(value, format) {
        if (!value && value !== 0) {
            return null;
        }
        const v = String(value).trim();
        if (v.length === 0) {
            return null;
        }

        const normalizedFormat = (format || "").toLowerCase();

        let year, month, day;

        if (normalizedFormat === "yyyy-mm-dd") {
            const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) {
                year = parseInt(m[1], 10);
                month = parseInt(m[2], 10) - 1;
                day = parseInt(m[3], 10);
            }
        } else if (normalizedFormat === "dd.mm.yyyy") {
            const m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
            if (m) {
                day = parseInt(m[1], 10);
                month = parseInt(m[2], 10) - 1;
                year = parseInt(m[3], 10);
            }
        } else if (normalizedFormat === "mm/dd/yyyy") {
            const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (m) {
                month = parseInt(m[1], 10) - 1;
                day = parseInt(m[2], 10);
                year = parseInt(m[3], 10);
            }
        } else if (normalizedFormat === "m/d/yyyy") {
            const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (m) {
                month = parseInt(m[1], 10) - 1;
                day = parseInt(m[2], 10);
                year = parseInt(m[3], 10);
            }
        } else if (normalizedFormat === "mmmm dd, yyyy") {
            const m = v.match(/^([a-zA-Z]+) (\d{1,2}), (\d{4})$/);
            if (m) {
                month = this._parseMonth(m[1]);
                day = parseInt(m[2], 10);
                year = parseInt(m[3], 10);
            }
        } else if (normalizedFormat === "dddd, mmmm dd, yyyy") {
            const m = v.match(/^[a-zA-Z]+, ([a-zA-Z]+) (\d{1,2}), (\d{4})$/);
            if (m) {
                month = this._parseMonth(m[1]);
                day = parseInt(m[2], 10);
                year = parseInt(m[3], 10);
            }
        } else {
            // fallback: try common patterns (ISO, DD.MM.YYYY, etc.)
            // try ISO-like first
            const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(v);
            if (iso) {
                year = parseInt(iso[1], 10);
                month = parseInt(iso[2], 10) - 1;
                day = parseInt(iso[3], 10);
            } else {
                const alt = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(v);
                if (alt) {
                    day = parseInt(alt[1], 10);
                    month = parseInt(alt[2], 10) - 1;
                    year = parseInt(alt[3], 10);
                }
            }
        }

        if (typeof year === "number" && typeof month === "number" && typeof day === "number") {
            const d = new Date(year, month, day);
            if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
                return d;
            }
            return null;
        }

        return null;
    }

    /**
     * helper to parse month names to 0-based month index
     * @param {string} monthStr month name like "January" or "Feb"
     * @returns {number|null} month index 0..11 or null
     * @private
     */
    _parseMonth(monthStr) {
        if (!monthStr || typeof monthStr !== "string") {
            return null;
        }
        const months = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];
        const idx = months.indexOf(monthStr.toLowerCase());
        return idx !== -1 ? idx : null;
    }

    /**
     * Formats a date for input display.
     * @param {Date} date - Date to format.
     * @returns {string} Formatted date string.
     */
    _formatDate(date) {
        if (this._dateFormat && typeof this._dateFormat === "string") {
            return this._formatDateString(date, this._dateFormat);
        }
        return date.toLocaleDateString("en-US");
    }

    /**
     * Formats a Date object according to the given format (supports YYYY, MM, DD, M, D and mmmm).
     * @param {Date} date - Date to format.
     * @param {string} format - Format string.
     * @returns {string} Formatted string.
     */
    _formatDateString(date, format) {
        const yyyy = String(date.getFullYear());
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const mNoPad = String(date.getMonth() + 1);
        const dNoPad = String(date.getDate());

        // resolve month name locally (do not rely on calendar controller's helper)
        // english month keys are used for i18n lookup if available
        const monthKeys = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];
        const monthKey = monthKeys[date.getMonth()];
        let monthName = monthKey;
        if (typeof webexpress !== "undefined" && webexpress.webui && webexpress.webui.I18N && typeof this._i18n === "function") {
            try {
                monthName = this._i18n(`webexpress.webui:calendar.${monthKey}`);
            } catch (e) {
                monthName = monthKey;
            }
        }

        // tokenize and replace tokens in a single pass to avoid accidental replacements
        // supported tokens: YYYY, mmmm, MM, DD, M, D (case-insensitive)
        const tokenRe = /(YYYY|mmmm|MM|DD|M|D)/gi;
        let out = "";
        let lastIndex = 0;
        let m;
        while ((m = tokenRe.exec(format)) !== null) {
            // append literal part between tokens
            out += format.substring(lastIndex, m.index);
            const tok = m[0];
            // replace known tokens (case-insensitive handling)
            if (/^mmmm$/i.test(tok)) {
                out += monthName;
            } else if (/^YYYY$/i.test(tok)) {
                out += yyyy;
            } else if (/^MM$/i.test(tok)) {
                out += mm;
            } else if (/^DD$/i.test(tok)) {
                out += dd;
            } else if (/^M$/i.test(tok)) {
                out += mNoPad;
            } else if (/^D$/i.test(tok)) {
                out += dNoPad;
            } else {
                // unknown token: keep as-is
                out += tok;
            }
            lastIndex = tokenRe.lastIndex;
        }
        // append remaining literal suffix
        out += format.substring(lastIndex);
        return out;
    }
};

// register class
webexpress.webui.Controller.registerClass("wx-webui-date", webexpress.webui.DateCtrl);