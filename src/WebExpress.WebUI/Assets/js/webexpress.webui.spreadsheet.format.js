/**
 * Number and date formats of the spreadsheet. Format codes follow the syntax of the common
 * spreadsheets ("#,##0.00", "0%", "dd.mm.yyyy", "[Red]-0.00", sections separated by ";"), so
 * formats survive the round trip through the clipboard and the file formats. Dates are serial
 * numbers counted from 1899-12-30, which keeps date arithmetic plain arithmetic.
 */
webexpress.webui.SpreadsheetFormat = class {
    /**
     * The day zero of the serial dates, in milliseconds since the Unix epoch.
     */
    static EPOCH = Date.UTC(1899, 11, 30);

    /**
     * The conventions per language: separators, default formats, the texts of the truth values
     * and the month and day names.
     */
    static LOCALES = {
        en: {
            decimal: ".", group: ",", date: "mm/dd/yyyy", time: "hh:mm", datetime: "mm/dd/yyyy hh:mm", currency: "$", currencyFormat: "$#,##0.00",
            true: "TRUE", false: "FALSE",
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        },
        de: {
            decimal: ",", group: ".", date: "dd.mm.yyyy", time: "hh:mm", datetime: "dd.mm.yyyy hh:mm", currency: "\u20AC", currencyFormat: "#,##0.00 \u20AC",
            true: "WAHR", false: "FALSCH",
            months: ["Januar", "Februar", "M\u00E4rz", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
            days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
            // German abbreviates weekdays to two letters, which no slice of the full name yields
            shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
        }
    };

    /**
     * The colors a format section may name.
     */
    static COLORS = { black: "#000000", blue: "#0000ff", cyan: "#00ffff", green: "#008000", magenta: "#ff00ff", red: "#ff0000", white: "#ffffff", yellow: "#ffff00" };

    /**
     * Compiled format codes, by code.
     */
    static _cache = new Map();

    /**
     * Resolves the conventions of a language; unknown languages fall back to English.
     * @param {string|object} [locale] - The language code, a locale object, or nothing for the
     * language of the page.
     * @returns {object} The conventions.
     */
    static locale(locale) {
        if (locale && typeof locale === "object") return locale;
        const code = String(locale || webexpress.webui.I18N?.language || "en").toLowerCase().split(/[-_]/)[0];
        return this.LOCALES[code] ?? this.LOCALES.en;
    }

    /**
     * Converts a date to its serial number; the date is read in UTC, as all serials are.
     * @param {Date} date - The date.
     * @returns {number} The serial number.
     */
    static dateToSerial(date) { return (date.getTime() - this.EPOCH) / 86400000; }

    /**
     * Converts a serial number to a date in UTC, rounded to the millisecond.
     * @param {number} serial - The serial number.
     * @returns {Date} The date.
     */
    static serialToDate(serial) { return new Date(this.EPOCH + Math.round(serial * 86400000)); }

    /**
     * Formats a value for display.
     * @param {*} value - The value: number, string, boolean, null or an error.
     * @param {string} [code] - The format code; "General" when omitted.
     * @param {string|object} [locale] - The language.
     * @returns {{text: string, color: string|null}} The text and the color a section asked for.
     */
    static format(value, code, locale) {
        const conventions = this.locale(locale);
        if (value === null || value === undefined) return { text: "", color: null };
        if (value instanceof webexpress.webui.SpreadsheetError) return { text: value.code, color: null };
        if (typeof value === "boolean") return { text: value ? conventions.true : conventions.false, color: null };
        const format = this._compile(code || "General");
        if (typeof value === "string") {
            const section = format.text;
            return section ? { text: this._render(section, value, conventions), color: section.color } : { text: value, color: null };
        }
        if (typeof value !== "number" || !Number.isFinite(value)) return { text: String(value), color: null };
        let section = format.sections[0], number = value;
        if (format.sections.length > 1 && value < 0) { section = format.sections[1]; number = -value; }
        else if (format.sections.length > 2 && value === 0) section = format.sections[2];
        else if (value < 0 && format.sections.length === 1 && !section.date) {
            // a negative value rounded to zero shows no sign
            const out = this._render(section, -value, conventions);
            return { text: /[1-9]/.test(out) ? "-" + out : out, color: section.color };
        }
        return { text: this._render(section, number, conventions), color: section.color };
    }

    /**
     * Writes a number in the General format: up to ten significant digits, no grouping, and
     * scientific notation for very large or small numbers.
     * @param {number} value - The number.
     * @param {object} conventions - The locale.
     * @returns {string} The text.
     */
    static general(value, conventions) {
        if (value === 0) return "0";
        const abs = Math.abs(value);
        let text;
        if (abs >= 1e11 || abs < 1e-9) {
            text = value.toExponential(5).replace(/\.?0+e/, "e").replace(/e([+-])(\d)$/, "e$10$2").toUpperCase();
        } else {
            text = String(Number(value.toPrecision(10)));
            if (/e/i.test(text)) text = Number(text).toFixed(10).replace(/\.?0+$/, "");
        }
        return conventions.decimal === "." ? text : text.replace(".", conventions.decimal);
    }

    /**
     * Compiles a format code into its sections.
     * @param {string} code - The code.
     * @returns {{sections: Array<object>, text: object|null}} The compiled format.
     */
    static _compile(code) {
        let compiled = this._cache.get(code);
        if (compiled) return compiled;
        const parts = this._split(code);
        const sections = parts.slice(0, 3).map(part => this._section(part));
        const textPart = parts.length > 3 ? this._section(parts[3]) : (sections.length === 1 && sections[0].tokens.some(t => t.type === "text") ? sections[0] : null);
        compiled = { sections: sections.length ? sections : [this._section("General")], text: textPart };
        if (this._cache.size > 500) this._cache.clear();
        this._cache.set(code, compiled);
        return compiled;
    }

    /**
     * Splits a code at the section separators that stand outside quotes and brackets.
     * @param {string} code - The code.
     * @returns {Array<string>} The sections.
     */
    static _split(code) {
        const parts = [];
        let current = "", quoted = false, bracket = false;
        for (let i = 0; i < code.length; i++) {
            const ch = code[i];
            if (ch === "\\" && !quoted) { current += ch + (code[i + 1] ?? ""); i++; continue; }
            if (ch === "\"") quoted = !quoted;
            else if (!quoted && ch === "[") bracket = true;
            else if (!quoted && ch === "]") bracket = false;
            if (ch === ";" && !quoted && !bracket) { parts.push(current); current = ""; continue; }
            current += ch;
        }
        parts.push(current);
        return parts;
    }

    /**
     * Tokenizes one section and works out how its number part is built.
     * @param {string} source - The section code.
     * @returns {object} The section.
     */
    static _section(source) {
        const tokens = [];
        let color = null;
        const lower = source.toLowerCase();
        if (lower.trim() === "general" || lower.trim() === "standard" || source.trim() === "") {
            return { tokens: [{ type: "general" }], color: null, date: false, general: true };
        }
        for (let i = 0; i < source.length; i++) {
            const ch = source[i], rest = source.slice(i);
            if (ch === "\"") {
                const end = source.indexOf("\"", i + 1);
                tokens.push({ type: "literal", value: source.slice(i + 1, end < 0 ? undefined : end) });
                i = end < 0 ? source.length : end;
                continue;
            }
            if (ch === "\\") { tokens.push({ type: "literal", value: source[i + 1] ?? "" }); i++; continue; }
            if (ch === "_") { tokens.push({ type: "literal", value: " " }); i++; continue; }
            if (ch === "*") { i++; continue; }
            if (ch === "[") {
                const end = source.indexOf("]", i);
                const inner = source.slice(i + 1, end < 0 ? undefined : end);
                i = end < 0 ? source.length : end;
                if (this.COLORS[inner.toLowerCase()]) color = this.COLORS[inner.toLowerCase()];
                else if (/^\$/.test(inner)) tokens.push({ type: "literal", value: inner.slice(1).split("-")[0] });
                else if (/^(h+|m+|s+)$/i.test(inner)) tokens.push({ type: "elapsed", unit: inner[0].toLowerCase(), width: inner.length });
                continue;
            }
            const date = /^(yyyy|yy|mmmmm|mmmm|mmm|mm|m|dddd|ddd|dd|d|hh|h|ss|s|am\/pm|a\/p)/i.exec(rest);
            if (date && !/^e[+-]/i.test(rest)) {
                tokens.push({ type: "date", code: date[1].toLowerCase(), raw: date[1] });
                i += date[1].length - 1;
                continue;
            }
            if (ch === "0" || ch === "#" || ch === "?") { tokens.push({ type: "digit", char: ch }); continue; }
            if (ch === ".") { tokens.push({ type: "point" }); continue; }
            if (ch === ",") { tokens.push({ type: "comma" }); continue; }
            if (ch === "%") { tokens.push({ type: "percent" }); continue; }
            if (ch === "@") { tokens.push({ type: "text" }); continue; }
            if ((ch === "E" || ch === "e") && /^[eE][+-]/.test(rest)) { tokens.push({ type: "exp", sign: rest[1] }); i++; continue; }
            tokens.push({ type: "literal", value: ch });
        }
        const isDate = tokens.some(t => t.type === "date" || t.type === "elapsed");
        if (isDate) {
            // separators of a date, such as the points of dd.mm.yyyy, are plain text there
            tokens.forEach((token, index) => {
                const literal = { point: ".", comma: ",", percent: "%" }[token.type] ?? (token.type === "digit" ? token.char : null);
                if (literal !== null) tokens[index] = { type: "literal", value: literal };
            });
            // "m" means minutes right after hours or right before seconds
            tokens.forEach((token, index) => {
                if (token.type !== "date" || !/^mm?$/.test(token.code)) return;
                const before = tokens.slice(0, index).reverse().find(t => t.type === "date" || t.type === "elapsed");
                const after = tokens.slice(index + 1).find(t => t.type === "date" || t.type === "elapsed");
                if (before && /^h/.test(before.code ?? before.unit) || after && /^s/.test(after.code ?? after.unit)) token.minutes = true;
            });
            return { tokens, color, date: true, ampm: tokens.some(t => t.type === "date" && /^a/.test(t.code)) };
        }
        const digitsAt = tokens.map((t, i) => (t.type === "digit" ? i : -1)).filter(i => i >= 0);
        const first = digitsAt[0] ?? -1, last = digitsAt[digitsAt.length - 1] ?? -1;
        const point = tokens.findIndex(t => t.type === "point");
        const expAt = tokens.findIndex(t => t.type === "exp");
        const intEnd = point >= 0 ? point : expAt >= 0 ? expAt : last + 1;
        const intDigits = tokens.slice(0, intEnd).filter(t => t.type === "digit");
        const fracTokens = point >= 0 ? tokens.slice(point + 1, expAt >= 0 ? expAt : last + 1).filter(t => t.type === "digit") : [];
        // a comma between digit placeholders groups thousands; commas right after the last one scale
        const grouping = tokens.some((t, i) => t.type === "comma" && i > first && i < intEnd && tokens.slice(i + 1, intEnd).some(x => x.type === "digit"));
        // every comma right after the last placeholder or right before the point divides by 1000
        let scale = 0;
        if (last >= 0) for (let i = last + 1; tokens[i]?.type === "comma"; i++) scale++;
        if (point > 0) for (let i = point - 1; i >= 0 && tokens[i]?.type === "comma"; i--) scale++;
        const percent = tokens.filter(t => t.type === "percent").length;
        return {
            tokens, color, date: false, first, last, point, expAt, intEnd, grouping, scale, percent,
            intDigits: intDigits.map(t => t.char), fracDigits: fracTokens.map(t => t.char),
            expDigits: expAt >= 0 ? tokens.slice(expAt + 1).filter(t => t.type === "digit").length : 0
        };
    }

    /**
     * Renders a value with one compiled section.
     * @param {object} section - The section.
     * @param {number|string} value - The value; text only for a text section.
     * @param {object} conventions - The locale.
     * @returns {string} The text.
     */
    static _render(section, value, conventions) {
        if (typeof value === "string") {
            return section.tokens.map(t => (t.type === "text" ? value : t.type === "literal" ? t.value : "")).join("");
        }
        if (section.general) return this.general(value, conventions);
        if (section.date) return this._renderDate(section, value, conventions);
        return this._renderNumber(section, value, conventions);
    }

    /**
     * Renders a number with a numeric section.
     * @param {object} section - The section.
     * @param {number} value - The non-negative number (the sign is handled by the caller).
     * @param {object} conventions - The locale.
     * @returns {string} The text.
     */
    static _renderNumber(section, value, conventions) {
        let number = value * Math.pow(100, section.percent) / Math.pow(1000, section.scale);
        let exponent = 0;
        if (section.expAt >= 0 && number !== 0) {
            const intCount = Math.max(1, section.intDigits.length);
            exponent = Math.floor(Math.log10(Math.abs(number))) - (intCount - 1);
            number = number / Math.pow(10, exponent);
        }
        const decimals = section.fracDigits.length;
        let [intPart, fracPart = ""] = Math.abs(number).toFixed(decimals).split(".");
        if (section.expAt >= 0 && intPart.length > Math.max(1, section.intDigits.length)) {
            // rounding carried into a new digit, as in 9.99 shown as 10.0E+00
            exponent += 1;
            [intPart, fracPart = ""] = (Math.abs(number) / 10).toFixed(decimals).split(".");
        }
        const minInt = section.intDigits.filter(c => c === "0").length;
        if (intPart === "0" && minInt === 0) intPart = "";
        intPart = intPart.padStart(minInt, "0");
        // optional decimal places (# and ?) drop trailing zeros; ? keeps their width as spaces
        let end = decimals;
        while (end > 0 && fracPart[end - 1] === "0" && section.fracDigits[end - 1] !== "0") end--;
        let fracText = fracPart.slice(0, end);
        for (let i = end; i < decimals; i++) if (section.fracDigits[i] === "?") fracText += " ";
        let intText = intPart;
        const pattern = section.tokens.slice(section.first, section.intEnd);
        if (section.grouping) intText = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, conventions.group);
        else if (section.first >= 0 && section.first < section.intEnd && pattern.some(t => t.type === "literal")) {
            // literals between integer placeholders, as in 000-0000, are filled right to left
            const firstDigit = pattern.findIndex(t => t.type === "digit");
            let digits = intPart, out = "";
            for (let i = pattern.length - 1; i >= 0; i--) {
                const token = pattern[i];
                if (token.type === "literal") { out = token.value + out; continue; }
                if (token.type !== "digit") continue;
                if (i === firstDigit) { out = digits + out; digits = ""; }
                else if (digits) { out = digits.slice(-1) + out; digits = digits.slice(0, -1); }
                else out = (token.char === "0" ? "0" : token.char === "?" ? " " : "") + out;
            }
            intText = out;
        }
        let numberText = intText;
        if (section.point >= 0) numberText += conventions.decimal + fracText;
        if (section.expAt >= 0) {
            const sign = exponent < 0 ? "-" : section.tokens[section.expAt].sign === "+" ? "+" : "";
            numberText += "E" + sign + String(Math.abs(exponent)).padStart(section.expDigits, "0");
        }
        const text = token => (token.type === "percent" ? "%" : token.type === "literal" ? token.value : "");
        if (section.first < 0) return section.tokens.map(text).join("");
        const start = section.point >= 0 ? Math.min(section.first, section.point) : section.first;
        const before = section.tokens.slice(0, start).map(text).join("");
        const after = section.tokens.slice(section.last + 1).map(text).join("");
        return before + numberText + after;
    }

    /**
     * Renders a serial date or time with a date section.
     * @param {object} section - The section.
     * @param {number} value - The serial number.
     * @param {object} conventions - The locale.
     * @returns {string} The text.
     */
    static _renderDate(section, value, conventions) {
        const date = this.serialToDate(value);
        const pad = (n, width = 2) => String(n).padStart(width, "0");
        const hours = date.getUTCHours();
        return section.tokens.map(token => {
            if (token.type === "literal") return token.value;
            if (token.type === "elapsed") {
                const total = token.unit === "h" ? Math.floor(value * 24 + 1e-9) : token.unit === "m" ? Math.floor(value * 1440 + 1e-9) : Math.floor(value * 86400 + 1e-6);
                return pad(total, token.width);
            }
            if (token.type !== "date") return "";
            switch (token.code) {
                case "yyyy": return String(date.getUTCFullYear());
                case "yy": return pad(date.getUTCFullYear() % 100);
                case "mmmmm": return token.minutes ? pad(date.getUTCMinutes()) : conventions.months[date.getUTCMonth()][0];
                case "mmmm": return conventions.months[date.getUTCMonth()];
                case "mmm": return conventions.months[date.getUTCMonth()].slice(0, 3);
                case "mm": return pad(token.minutes ? date.getUTCMinutes() : date.getUTCMonth() + 1);
                case "m": return String(token.minutes ? date.getUTCMinutes() : date.getUTCMonth() + 1);
                case "dddd": return conventions.days[date.getUTCDay()];
                case "ddd": return conventions.shortDays?.[date.getUTCDay()] ?? conventions.days[date.getUTCDay()].slice(0, 3);
                case "dd": return pad(date.getUTCDate());
                case "d": return String(date.getUTCDate());
                case "hh": return pad(section.ampm ? (hours % 12 || 12) : hours);
                case "h": return String(section.ampm ? (hours % 12 || 12) : hours);
                case "ss": return pad(date.getUTCSeconds());
                case "s": return String(date.getUTCSeconds());
                case "am/pm": return hours < 12 ? "AM" : "PM";
                case "a/p": return hours < 12 ? "A" : "P";
                default: return "";
            }
        }).join("");
    }

    /**
     * Determines whether a format code shows dates or times.
     * @param {string} code - The code.
     * @returns {boolean} True for a date or time format.
     */
    static isDateFormat(code) { return !!code && this._compile(code).sections[0].date === true; }

    /**
     * Reads what a user typed into a cell: a formula, a number in the conventions of the
     * language, a percentage, an amount with a currency sign, a date, a time or a truth value.
     * Whatever is recognized brings a fitting format along, as typing "15%" or "24.12.2026"
     * does in the common spreadsheets. A leading apostrophe keeps the input as text.
     * @param {string} text - The input.
     * @param {string|object} [locale] - The language.
     * @returns {{value: *, format?: string, formula?: string}} The result.
     */
    static parseInput(text, locale) {
        const conventions = this.locale(locale);
        const raw = String(text ?? "");
        const value = raw.trim();
        if (value === "") return { value: null };
        if (raw.startsWith("'")) return { value: raw.slice(1) };
        if (value.startsWith("=") && value.length > 1) return { formula: value };
        const upper = value.toUpperCase();
        if (upper === "TRUE" || upper === conventions.true.toUpperCase()) return { value: true };
        if (upper === "FALSE" || upper === conventions.false.toUpperCase()) return { value: false };
        const number = this.parseNumber(value, conventions);
        if (number !== null) return { value: number.value, ...(number.format ? { format: number.format } : {}) };
        const date = this.parseDate(value, conventions);
        if (date !== null) return date;
        return { value: raw };
    }

    /**
     * Reads a number with optional sign, grouping, percent sign or currency symbol.
     * @param {string} text - The trimmed input.
     * @param {object} conventions - The locale.
     * @returns {{value: number, format: string|null}|null} The number, or null.
     */
    static parseNumber(text, conventions) {
        let body = text, format = null, currency = null;
        const symbol = /^([$\u20AC\u00A3\u00A5])\s*(.+)$/.exec(body) || /^(.+?)\s*([$\u20AC\u00A3\u00A5])$/.exec(body);
        if (symbol) {
            currency = /[$\u20AC\u00A3\u00A5]/.test(symbol[1]) ? symbol[1] : symbol[2];
            body = /[$\u20AC\u00A3\u00A5]/.test(symbol[1]) ? symbol[2] : symbol[1];
        }
        let percent = false;
        if (body.endsWith("%")) { percent = true; body = body.slice(0, -1).trim(); }
        let negative = false;
        if (/^\(.*\)$/.test(body)) { negative = true; body = body.slice(1, -1); }
        const sign = /^[+-]/.exec(body);
        if (sign) { negative = negative !== (sign[0] === "-"); body = body.slice(1); }
        const { decimal, group } = conventions;
        const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const grouped = new RegExp("^\\d{1,3}(" + esc(group) + "\\d{3})+(" + esc(decimal) + "\\d+)?$");
        const plain = new RegExp("^(\\d+(" + esc(decimal) + "\\d*)?|" + esc(decimal) + "\\d+)([eE][+-]?\\d+)?$");
        let normalized = null, decimals = 0, hasGroup = false;
        if (grouped.test(body)) {
            hasGroup = true;
            normalized = body.split(group).join("").replace(decimal, ".");
        } else if (plain.test(body)) {
            normalized = body.replace(decimal, ".");
        } else if (decimal !== "." && /^\d+\.\d+$/.test(body) && !/^\d{1,3}\.\d{3}$/.test(body)) {
            // a point with other than three digits after it is no grouping, so it is read as decimal point
            normalized = body;
        } else return null;
        const fraction = /\.(\d+)/.exec(normalized);
        decimals = fraction ? fraction[1].length : 0;
        let number = Number(normalized);
        if (!Number.isFinite(number)) return null;
        if (negative) number = -number;
        if (percent) {
            number = number / 100;
            format = decimals ? "0." + "0".repeat(decimals) + "%" : "0%";
        } else if (currency) {
            // the euro follows the amount, the other symbols lead it
            const pattern = "#,##0." + "0".repeat(Math.max(2, decimals));
            format = currency === "\u20AC" ? pattern + " \u20AC" : currency + pattern;
        } else if (hasGroup) format = "#,##0" + (decimals ? "." + "0".repeat(decimals) : "");
        return { value: Number(number.toPrecision(15)), format };
    }

    /**
     * Reads a date, a time or both, in ISO form or in the conventions of the language.
     * @param {string} text - The trimmed input.
     * @param {object} conventions - The locale.
     * @returns {{value: number, format: string}|null} The serial and its format, or null.
     */
    static parseDate(text, conventions) {
        const time = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(text);
        if (time) {
            let hours = Number(time[1]);
            const minutes = Number(time[2]), seconds = Number(time[3] ?? 0);
            if (time[4]) { if (hours > 12) return null; hours = hours % 12 + (/pm/i.test(time[4]) ? 12 : 0); }
            if (hours > 23 || minutes > 59 || seconds > 59) return null;
            return { value: (hours * 3600 + minutes * 60 + seconds) / 86400, format: time[3] ? "hh:mm:ss" : "hh:mm" };
        }
        const [datePart, timePart] = text.split(/\s+(?=\d{1,2}:\d{2})/);
        let year, month, day;
        let match;
        if ((match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(datePart))) [, year, month, day] = match.map(Number);
        else if (conventions.decimal === "," && (match = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})?$/.exec(datePart))) {
            day = Number(match[1]); month = Number(match[2]); year = match[3] ? Number(match[3]) : new Date().getFullYear();
        } else if ((match = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(datePart))) {
            const first = Number(match[1]), second = Number(match[2]);
            [month, day] = conventions.decimal === "," ? [second, first] : [first, second];
            year = Number(match[3]);
        } else return null;
        if (year < 100) year += year < 30 ? 2000 : 1900;
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCMonth() !== month - 1) return null;
        let serial = this.dateToSerial(date);
        let format = /^\d{4}-/.test(datePart) ? "yyyy-mm-dd" : conventions.date;
        if (timePart) {
            const clock = this.parseDate(timePart, conventions);
            if (!clock || clock.value >= 1) return null;
            serial += clock.value;
            format += " " + clock.format;
        }
        return { value: serial, format };
    }

    /**
     * Produces what a cell shows: its value formatted by type and number format, with the
     * alignment a value of that kind gets when the cell names none.
     * @param {*} value - The value (computed for a formula).
     * @param {object|null} cell - The cell.
     * @param {object} style - The effective style.
     * @param {string|object} [locale] - The language.
     * @returns {{text: string, color: string|null, align: string, kind: string}} The presentation.
     */
    static display(value, cell, style, locale) {
        if (cell?.t) {
            const type = webexpress.webui.SpreadsheetTypes.get(cell.t);
            if (type?.format) return { text: String(type.format(cell.v, cell, this.locale(locale)) ?? ""), color: null, align: type.align ?? "left", kind: "custom" };
        }
        if (value instanceof webexpress.webui.SpreadsheetError) return { text: value.code, color: null, align: "center", kind: "error" };
        const kind = typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : value === null || value === undefined ? "empty" : "text";
        const result = this.format(value, style?.nf, locale);
        return { text: result.text, color: result.color, align: kind === "number" ? "right" : kind === "boolean" ? "center" : "left", kind };
    }

    /**
     * Returns the text a cell is edited as: the formula, or the value in a form parseInput reads
     * back to the same value.
     * @param {object|null} cell - The cell.
     * @param {object} style - The effective style.
     * @param {string|object} [locale] - The language.
     * @returns {string} The text.
     */
    static editText(cell, style, locale) {
        if (!cell) return "";
        if (cell.f) return cell.f;
        if (cell.t) {
            const type = webexpress.webui.SpreadsheetTypes.get(cell.t);
            if (type?.edit) return String(type.edit(cell.v, cell) ?? "");
        }
        const value = cell.v;
        const conventions = this.locale(locale);
        if (value === undefined || value === null) return "";
        if (typeof value === "boolean") return value ? conventions.true : conventions.false;
        if (typeof value === "number") {
            const code = style?.nf;
            if (code && this.isDateFormat(code)) {
                const hasTime = value % 1 !== 0, hasDate = Math.abs(value) >= 1;
                const format = hasDate && hasTime ? conventions.datetime + ":ss" : hasDate ? conventions.date : "hh:mm:ss";
                return this.format(value, format, conventions).text;
            }
            if (code && /%/.test(code)) return this.general(Number((value * 100).toPrecision(15)), conventions) + "%";
            return this.general(value, conventions);
        }
        if (typeof value === "string") {
            // text that would read back as something else keeps its apostrophe
            const parsed = this.parseInput(value, conventions);
            return parsed.formula || (parsed.value !== value && parsed.value !== null) ? "'" + value : value;
        }
        return String(value);
    }
};

/**
 * The registry of custom cell types. A typed cell stores its own value ("v") and names its type
 * ("t"); the type decides how the value is shown, edited and seen by formulas.
 */
webexpress.webui.SpreadsheetTypes = new class {
    /**
     * Creates the registry.
     */
    constructor() { this._types = new Map(); }

    /**
     * Registers a type.
     * @param {string} name - The type name (lowercase letters, digits and hyphens).
     * @param {object} definition - { label, format(value, cell, locale), parse(text, cell),
     * edit(value, cell), toValue(value, cell), toggle(value, cell), align }.
     * @returns {this} The registry.
     * @throws {TypeError} If the name is invalid.
     */
    register(name, definition) {
        if (!/^[a-z][a-z0-9-]{0,31}$/.test(name ?? "")) throw new TypeError("Invalid type name: " + name);
        this._types.set(name, { ...definition, name });
        return this;
    }

    /**
     * Returns a type.
     * @param {string} name - The type name.
     * @returns {object|null} The definition.
     */
    get(name) { return this._types.get(name) ?? null; }

    /**
     * Returns all types.
     * @returns {Array<object>} The definitions.
     */
    getAll() { return [...this._types.values()]; }

    /**
     * Removes a type; cells of that type keep their value and show it as plain data.
     * @param {string} name - The type name.
     * @returns {boolean} True if a type was removed.
     */
    unregister(name) { return this._types.delete(name); }
};

/**
 * The registry of the format templates offered in the toolbar. Applying a template stores its
 * style in the workbook under the template name, so a saved workbook carries its own templates.
 */
webexpress.webui.SpreadsheetCellStyles = new class {
    /**
     * Creates the registry.
     */
    constructor() { this._styles = new Map(); }

    /**
     * Registers a template.
     * @param {string} name - The template name, stored with the cells.
     * @param {object} definition - { label, style }; the label is an i18n key or a text.
     * @returns {this} The registry.
     */
    register(name, definition) { this._styles.set(name, { ...definition, name }); return this; }

    /**
     * Returns a template.
     * @param {string} name - The name.
     * @returns {object|null} The template.
     */
    get(name) { return this._styles.get(name) ?? null; }

    /**
     * Returns all templates in registration order.
     * @returns {Array<object>} The templates.
     */
    getAll() { return [...this._styles.values()]; }
};

(() => {
    const Types = webexpress.webui.SpreadsheetTypes;
    Types.register("checkbox", {
        label: "webexpress.webui:spreadsheet.type.checkbox",
        align: "center",
        format: value => (value === true ? "\u2611" : "\u2610"),
        parse: text => {
            const upper = String(text).trim().toUpperCase();
            return ["TRUE", "WAHR", "1", "X", "YES", "JA"].includes(upper);
        },
        edit: value => (value === true ? "TRUE" : "FALSE"),
        toValue: value => value === true,
        toggle: value => value !== true
    });
    Types.register("link", {
        label: "webexpress.webui:spreadsheet.type.link",
        format: value => (typeof value === "object" && value ? value.text || value.href : String(value ?? "")),
        parse: text => {
            const value = String(text).trim();
            const match = /^\[(.+)\]\((.+)\)$/.exec(value);
            return match ? { text: match[1], href: match[2] } : { href: value };
        },
        edit: value => (typeof value === "object" && value ? (value.text ? "[" + value.text + "](" + value.href + ")" : value.href) : String(value ?? "")),
        toValue: value => (typeof value === "object" && value ? value.text || value.href : value ?? null),
        href: value => {
            const href = typeof value === "object" && value ? value.href : value;
            return /^(https?:|mailto:|\/|#|\.\.?\/)/i.test(String(href ?? "")) ? String(href) : null;
        }
    });
    Types.register("list", {
        label: "webexpress.webui:spreadsheet.type.list",
        format: value => String(value ?? ""),
        parse: (text, cell) => {
            const options = Array.isArray(cell?.m?.options) ? cell.m.options.map(String) : [];
            const value = String(text).trim();
            return !options.length || options.includes(value) ? value : undefined;
        },
        edit: value => String(value ?? ""),
        toValue: value => value ?? null,
        options: cell => (Array.isArray(cell?.m?.options) ? cell.m.options.map(String) : [])
    });

    const Styles = webexpress.webui.SpreadsheetCellStyles;
    Styles.register("good", { label: "webexpress.webui:spreadsheet.cellstyle.good", style: { fill: "#c6efce", color: "#006100" } });
    Styles.register("bad", { label: "webexpress.webui:spreadsheet.cellstyle.bad", style: { fill: "#ffc7ce", color: "#9c0006" } });
    Styles.register("neutral", { label: "webexpress.webui:spreadsheet.cellstyle.neutral", style: { fill: "#ffeb9c", color: "#9c5700" } });
    Styles.register("title", { label: "webexpress.webui:spreadsheet.cellstyle.title", style: { bold: true, size: 18, color: "#1f3864" } });
    Styles.register("heading1", { label: "webexpress.webui:spreadsheet.cellstyle.heading1", style: { bold: true, size: 15, color: "#1f3864", border: { bottom: "thick #4472c4" } } });
    Styles.register("heading2", { label: "webexpress.webui:spreadsheet.cellstyle.heading2", style: { bold: true, size: 13, color: "#1f3864", border: { bottom: "medium #a9bfe4" } } });
    Styles.register("input", { label: "webexpress.webui:spreadsheet.cellstyle.input", style: { fill: "#ffcc99", color: "#3f3f76", border: { top: "thin #7f7f7f", right: "thin #7f7f7f", bottom: "thin #7f7f7f", left: "thin #7f7f7f" } } });
    Styles.register("output", { label: "webexpress.webui:spreadsheet.cellstyle.output", style: { fill: "#f2f2f2", color: "#3f3f3f", bold: true, border: { top: "thin #3f3f3f", right: "thin #3f3f3f", bottom: "thin #3f3f3f", left: "thin #3f3f3f" } } });
    Styles.register("total", { label: "webexpress.webui:spreadsheet.cellstyle.total", style: { bold: true, border: { top: "thin #4472c4", bottom: "double #4472c4" } } });
    Styles.register("note", { label: "webexpress.webui:spreadsheet.cellstyle.note", style: { fill: "#ffffcc", border: { top: "thin #b2b2b2", right: "thin #b2b2b2", bottom: "thin #b2b2b2", left: "thin #b2b2b2" } } });
    Styles.register("currency", { label: "webexpress.webui:spreadsheet.cellstyle.currency", style: { nf: "#,##0.00 \u20AC" } });
    Styles.register("percent", { label: "webexpress.webui:spreadsheet.cellstyle.percent", style: { nf: "0%" } });
})();
