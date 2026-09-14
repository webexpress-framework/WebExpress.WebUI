/**
 * CalendarCtrl is a calendar control for selecting a single or range date.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT: Fired when the selected date changes
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT: Fired when the calendar popup is opened
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT: Fired when the calendar popup is closed
 */
webexpress.webui.InputDateCtrl = class extends webexpress.webui.MenuCtrl {
    _holidays = [];
    _dateFormat = null;

    /**
     * Initializes the date control, sets up DOM and event bindings.
     * @param {HTMLElement} element - The DOM element for the date control.
     */
    constructor(element) {
        super(element);

        this._id = element.getAttribute("id");
        this._name = element.getAttribute("name");
        this._dateFormat = element.getAttribute("data-format") || this._i18n("webexpress.webui:calendar.format");
        const value = element.dataset.value || null;
        this._placeholder = element.getAttribute("placeholder") || this._i18n("webexpress.webui:calendar.select_date");
        const holidaysAttr = element.getAttribute("data-holidays");
        this._rangeMode = element.getAttribute("data-range") === "true";

        // clean up element attributes and prepare DOM structure
        ["id", "name", "placeholder", "data-holidays", "data-value", "data-format", "data-range"].forEach(attr => element.removeAttribute(attr));
        element.innerHTML = "";
        element.classList.add("wx-date");

        if (this._rangeMode && value && value.includes(" - ")) {
            const [start, end] = value.split(" - ").map(date => this._parseDate(date.trim(), this._dateFormat));
            this._rangeStart = start || null;
            this._rangeEnd = end || null;
        } else {
            this._rangeStart = null;
            this._rangeEnd = null;
        }
        if (holidaysAttr) {
            this._holidays = holidaysAttr.split(",").map(x => x.trim()).filter(Boolean);
        }

        this._viewDate = value ? this._parseDate(value, this._dateFormat) : null;
        this._dropdown = this._createDropdown();
        this._dropdownmenu = this._createDropdownMenu();

        element.appendChild(this._dropdown);
        element.appendChild(this._dropdownmenu);
        this._initializeMenu(this._dropdown, this._dropdownmenu, this._dropdown.querySelector("button"));

        this.value = this._rangeMode ? { start: this._rangeStart, end: this._rangeEnd } : this._viewDate;
    }

    /**
     * Creates the dropdown container, text input, and calendar icon.
     * @returns {HTMLDivElement}
     */
    _createDropdown() {
        const dropdown = document.createElement("div");
        dropdown.classList.add("form-control");
        dropdown.style.cursor = "pointer";
        dropdown.style.position = "relative";
        dropdown.style.display = "flex";
        dropdown.style.alignItems = "center";

        this._input = document.createElement("input");
        if (this._id) {
            this._input.id = this._id;
        }
        this._input.name = this._name || "";
        this._input.type = "text";
        this._input.className = "wx-date-input";
        Object.assign(this._input.style, {
            flex: "1 1 auto",
            // a flex item refuses to shrink below its intrinsic width, and a
            // text input brings a wide one (its default size). In a field
            // narrower than that the input keeps its width and pushes the
            // calendar icon out of the box, onto whatever sits beside it.
            minWidth: "0",
            border: "none",
            outline: "none",
            background: "transparent",
            padding: "0"
        });
        this._input.placeholder = this._placeholder;
        this._input.autocomplete = "off";
        this._input.value = "";

        this._input.addEventListener("click", () => this._showCalendarPopup());
        this._input.addEventListener("input", () => this._onInputLive());
        this._input.addEventListener("change", () => this._onInputChange());
        this._input.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                this._showCalendarPopup();
                this._dropdownmenu.querySelector(".wx-calendar-day.selected, .wx-calendar-day:not(:disabled), button")?.focus({ preventScroll: true });
            } else if (e.key === "Enter") {
                e.preventDefault();
                this._onInputChange();
                this._showCalendarPopup();
            }
        });

        dropdown.appendChild(this._input);

        const icon = document.createElement("button");
        icon.type = "button";
        icon.setAttribute("aria-label", this._placeholder || this._i18n("webexpress.webui:calendar", "Calendar"));
        icon.className = "wx-date-calendar-icon";
        const drawing = document.createElement("i");
        drawing.className = this._iconClass("calendar");
        icon.appendChild(drawing);
        icon.style.marginLeft = "0.5em";
        // the icon is the fixed part of the field; the text gives way, not it
        icon.style.flex = "0 0 auto";
        dropdown.appendChild(icon);

        return dropdown;
    }

    /**
     * Shows the calendar popup and dispatches event.
     */
    _showCalendarPopup() {
        if (this._input.disabled || this._input.readOnly) { return; }
        webexpress.webui.NativeMenu.show(this._dropdownmenu);
    }

    /**
     * Handles live validation and popup sync for manual text input.
     */
    _readManualInput() {
        const text = this._input.value.trim();
        if (!text) { return { valid: true, value: null }; }
        const parts = this._rangeMode ? text.split(/\s+[-–]\s+/) : [text];
        const dates = parts.map(part => this._parseDate(part.trim(), this._dateFormat));
        if (parts.length > 2 || dates.some(date => !date)) { return { valid: false }; }
        return { valid: true, value: this._rangeMode ? { start: dates[0], end: dates[1] || dates[0] } : dates[0], viewDate: dates[0] };
    }

    _onInputLive() {
        const parsed = this._readManualInput();
        this._input.setCustomValidity(parsed.valid ? "" : this._i18n("webexpress.webui:calendar.invalid_date"));
        this._input.classList.toggle("is-invalid", !parsed.valid);
        this._dropdown.classList.toggle("is-invalid", !parsed.valid);
        if (parsed.valid && parsed.viewDate) { this._viewDate = parsed.viewDate; this.render(); }
    }

    /**
     * Commits complete manual dates and ranges while retaining invalid text for correction.
     */
    _onInputChange() {
        const parsed = this._readManualInput();
        this._input.setCustomValidity(parsed.valid ? "" : this._i18n("webexpress.webui:calendar.invalid_date"));
        this._input.classList.toggle("is-invalid", !parsed.valid);
        this._dropdown.classList.toggle("is-invalid", !parsed.valid);
        if (parsed.valid) { this.value = parsed.value; }
    }

    /**
     * Creates the dropdown menu (calendar popup) and "Today" button.
     * @returns {HTMLDivElement}
     */
    _createDropdownMenu() {
        const dropdownMenu = document.createElement("div");
        dropdownMenu.classList.add("dropdown-menu");
        dropdownMenu.style.minWidth = "280px";
        // the popup is positioned absolutely, so its width is shrink-to-fit
        // against the containing block - the field it hangs under. In a narrow
        // field that box stays at the minimum while the calendar table needs
        // more, and the surplus columns are painted over the page behind it.
        // Sizing the box by its content instead keeps the table inside it.
        dropdownMenu.style.width = "max-content";
        // room for the 25em calendar plus the padding of the menu; below that
        // the calendar gives way rather than spilling out
        dropdownMenu.style.maxWidth = "min(92vw, 28rem)";


        // header with navigation
        const header = document.createElement("div");
        header.classList.add("wx-calendar-header");

        const btnPrevYear = this._createNavButton("«", () => this._changeView(-1, "year"));
        const btnPrevMonth = this._createNavButton("‹", () => this._changeView(-1, "month"));
        const btnNextMonth = this._createNavButton("›", () => this._changeView(1, "month"));
        const btnNextYear = this._createNavButton("»", () => this._changeView(1, "year"));
        this._monthYear = document.createElement("span");

        header.appendChild(btnPrevYear);
        header.appendChild(btnPrevMonth);
        header.appendChild(this._monthYear);
        header.appendChild(btnNextMonth);
        header.appendChild(btnNextYear);

        dropdownMenu.appendChild(header);

        this._calendarContainer = document.createElement("div");
        this._calendarContainer.classList.add("wx-calendar");
        dropdownMenu.appendChild(this._calendarContainer);

        // "today" button
        const todayBtn = document.createElement("button");
        todayBtn.type = "button";
        todayBtn.className = "btn btn-light wx-date-today-btn";
        todayBtn.textContent = this._i18n("webexpress.webui:calendar.today", "Today");
        todayBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const now = new Date();
            if (this._rangeMode) {
                this.value = { start: now, end: now };
            } else {
                this.value = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
            setTimeout(() => {
                webexpress.webui.NativeMenu.hide(this._dropdownmenu);

            }, 0);
        });
        dropdownMenu.appendChild(todayBtn);
        return dropdownMenu;
    }

    /**
     * Renders the input and calendar according to state.
     * @public
     */
    render() {
        const viewDate = this._viewDate || new Date();
        this._monthYear.textContent = viewDate.getFullYear() + " - " + this._i18n(`webexpress.webui:calendar.${this._getMonthKey(viewDate.getMonth())}`);
        this._calendarContainer.innerHTML = "";
        this._calendarContainer.appendChild(this._renderCalendar());
    }

    /**
     * Returns the selected value.
     * @returns {Date|Object|null}
     */
    get value() {
        return this._rangeMode
            ? { start: this._rangeStart, end: this._rangeEnd }
            : this._selectedDate;
    }

    /**
     * Sets the selected date, updates control and dispatches events if needed.
     * @param {Date|Object|string|null|Array} input - Single date, range object, string or array.
     */
    set value(input) {
        let changed = false;

        // normalization for range and single mode
        if (input == null) {
            changed = !!(this._selectedDate || this._rangeStart || this._rangeEnd);
            if (this._rangeMode) {
                this._rangeStart = null;
                this._rangeEnd = null;
            } else {
                this._selectedDate = null;
            }
        } else if (this._rangeMode) {
            let start = null, end = null;
            if (Array.isArray(input)) {
                [start, end] = input;
                if (typeof end === "undefined") { end = start; }
            } else if (input instanceof Date) {
                start = input; end = input;
            } else if (typeof input === "string") {
                if (input.includes(" - ")) {
                    const parts = input.split(" - ");
                    start = parts[0]; end = parts[1];
                } else {
                    start = input; end = input;
                }
            } else if (typeof input === "object") {
                if (Object.prototype.hasOwnProperty.call(input, "start")) {
                    start = input.start;
                }
                if (Object.prototype.hasOwnProperty.call(input, "end")) {
                    end = input.end;
                } else if (start != null) {
                    end = start;
                }
            }
            if (typeof start === "string") { start = this._parseDate(start.trim(), this._dateFormat); }
            if (typeof end === "string") { end = this._parseDate(end.trim(), this._dateFormat); }
            start = start instanceof Date ? new Date(start.getFullYear(), start.getMonth(), start.getDate()) : null;
            end = end instanceof Date ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : null;

            if (start && end && end < start) {
                [start, end] = [end, start];
            }

            if (this._rangeStart?.getTime() !== start?.getTime() || this._rangeEnd?.getTime() !== end?.getTime()) {
                changed = true;
            }

            this._rangeStart = start;
            this._rangeEnd = end;
            this._selectedDate = null;
            if (this._rangeStart) {
                this._viewDate = new Date(this._rangeStart);
            }
        } else {
            let date = null;
            if (input instanceof Date) {
                date = input;
            } else if (typeof input === "string") {
                date = this._parseDate(input.trim(), this._dateFormat);
            } else if (typeof input === "object" && input.start) {
                date = input.start instanceof Date
                    ? input.start
                    : (typeof input.start === "string" ? this._parseDate(input.start.trim(), this._dateFormat) : null);
            }
            date = date instanceof Date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;

            if (this._selectedDate?.getTime() !== date?.getTime()) {
                changed = true;
            }
            this._selectedDate = date;
            this._rangeStart = null;
            this._rangeEnd = null;
            if (this._selectedDate) {
                this._viewDate = new Date(this._selectedDate);
            }
        }

        // serialized value for input field
        let newSerialized = "";
        if (this._rangeMode) {
            if (this._rangeStart && this._rangeEnd) {
                newSerialized = this._formatDateString(this._rangeStart, this._dateFormat) + " - " + this._formatDateString(this._rangeEnd, this._dateFormat);
            } else if (this._rangeStart && !this._rangeEnd) {
                newSerialized = this._formatDateString(this._rangeStart, this._dateFormat);
            }
        } else if (this._selectedDate) {
            newSerialized = this._formatDateString(this._selectedDate, this._dateFormat);
        }

        if (this._input && this._input.value !== newSerialized) {
            this._input.value = newSerialized;
        }

        this._input.setCustomValidity("");
        this._input.classList.remove("is-invalid");
        this._dropdown.classList.remove("is-invalid");

        // update view date if available
        if (this._rangeMode) {
            if (this._rangeStart) {
                this._viewDate = new Date(this._rangeStart);
            }
        } else if (this._selectedDate) {
            this._viewDate = new Date(this._selectedDate);
        }

        this.render();

        // dispatch if changed
        if (changed) {
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: newSerialized });
        }
    }

    /**
     * Gets current date format string.
     * @returns {string}
     */
    get format() {
        return this._dateFormat;
    }

    /**
     * Sets date format.
     * @param {string} fmt
     */
    set format(fmt) {
        const next = typeof fmt === "string" && fmt.trim().length > 0 ? fmt.trim() : "short";
        if (next !== this._dateFormat) {
            this._dateFormat = next;
            this.render();
        }
    }

    /**
     * Formats a date object using format string.
     * @param {Date} date
     * @returns {string}
     */
    _formatDate(date) {
        return this._dateFormat ? this._formatDateString(date, this._dateFormat) : date.toLocaleDateString("en-US");
    }

    /**
     * Formats a Date object according to the given format (YYYY-MM-DD etc).
     * @param {Date} date
     * @param {string} format
     * @returns {string}
     */
    _formatDateString(date, format) {
        // see original for detailed doc
        const yyyy = String(date.getFullYear());
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const mNoPad = String(date.getMonth() + 1);
        const dNoPad = String(date.getDate());
        let monthName = null;
        if (webexpress.webui && webexpress.webui.I18N) {
            monthName = this._i18n(`webexpress.webui:calendar.${this._getMonthKey(date.getMonth())}`);
        } else {
            monthName = this._getMonthKey(date.getMonth());
        }
        const tokenRe = /(YYYY|mmmm|MM|DD|M|D)/gi;
        let out = "";
        let lastIndex = 0, m;
        while ((m = tokenRe.exec(format)) !== null) {
            out += format.substring(lastIndex, m.index);
            const tok = m[0];
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
                out += tok;
            }
            lastIndex = tokenRe.lastIndex;
        }
        out += format.substring(lastIndex);
        return out;
    }

    /**
     * Parses a date string according to the given format.
     * @param {string} value
     * @param {string} format
     * @returns {Date|null}
     */
    _parseDate(value, format) {
        const tokens = [];
        const escaped = format.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = escaped.replace(/dddd|mmmm|yyyy|dd|mm|d|m/gi, token => {
            const name = token.toLowerCase();
            tokens.push(name);
            return name === "yyyy" ? "(\\d{4})" : name === "mmmm" || name === "dddd" ? "(.+?)" : "(\\d{1,2})";
        });
        const match = value.match(new RegExp("^" + pattern + "$", "iu"));
        if (!match) { return null; }
        let year, month, day;
        tokens.forEach((token, index) => {
            const text = match[index + 1];
            if (token === "yyyy") { year = Number(text); }
            else if (token === "mmmm") { month = this._parseMonth(text); }
            else if (token === "m" || token === "mm") { month = Number(text) - 1; }
            else if (token === "d" || token === "dd") { day = Number(text); }
        });
        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) { return null; }
        const date = new Date(0);
        date.setHours(0, 0, 0, 0);
        date.setFullYear(year, month, day);
        return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
    }

    /**
     * Accepts localized month names in the same format the calendar displays.
     */
    _parseMonth(monthStr) {
        for (let month = 0; month < 12; month++) {
            const key = this._getMonthKey(month);
            if ([key, this._i18n("webexpress.webui:calendar." + key)].some(name => name.toLowerCase() === monthStr.toLowerCase())) { return month; }
        }
        return null;
    }

    /**
     * Creates a navigation button for the calendar header.
     * @param {string} text
     * @param {function} onclick
     * @returns {HTMLButtonElement}
     */
    _createNavButton(text, onclick) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wx-calendar-nav";
        btn.textContent = text;
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            onclick();
        });
        return btn;
    }

    /**
     * Changes the calendar view (month or year).
     * @param {number} step
     * @param {"month"|"year"} mode
     */
    _changeView(step, mode) {
        if (mode === "month") {
            this._viewDate.setMonth(this._viewDate.getMonth() + step);
        } else if (mode === "year") {
            this._viewDate.setFullYear(this._viewDate.getFullYear() + step);
        }
        this.render();
    }

    /**
     * Renders the calendar view for the current month.
     * @returns {HTMLDivElement}
     */
    _renderCalendar() {
        const dateButtonMap = new Map();
        const viewDate = this._viewDate || new Date();
        const table = document.createElement("table");
        table.classList.add("wx-calendar-table");
        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        const thKW = document.createElement("th");
        thKW.textContent = this._i18n("webexpress.webui:calendar.calendar_week");
        trHead.appendChild(thKW);

        for (let i = 1; i <= 7; i++) {
            const th = document.createElement("th");
            th.textContent = this._i18n(`webexpress.webui:calendar.${this._getWeekdayKey(i % 7)}`);
            trHead.appendChild(th);
        }
        thead.appendChild(trHead);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let date = new Date(firstDay);
        date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // start at Monday

        while (date <= lastDay || date.getDay() !== 1) {
            const tr = document.createElement("tr");
            const tdKW = document.createElement("td");
            tdKW.textContent = this._getCalendarWeek(date);
            tr.appendChild(tdKW);

            for (let wd = 1; wd <= 7; wd++) {
                const td = document.createElement("td");
                const button = document.createElement("button");
                button.textContent = date.getDate();
                button.className = "wx-calendar-day";
                dateButtonMap.set(new Date(date.getFullYear(), date.getMonth(), date.getDate()), button);
                // highlight weekends
                if (date.getMonth() === month && (date.getDay() === 0 || date.getDay() === 6)) {
                    button.classList.add("wx-calendar-red");
                }
                // highlight holidays
                if (date.getMonth() === month) {
                    const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
                    if (this._holidays.includes(dateStr)) {
                        button.classList.add("wx-calendar-red");
                    }
                }
                // grayout days not in this month
                if (date.getMonth() !== month) {
                    button.classList.add("wx-calendar-out");
                }

                if (this._rangeMode) {
                    const t = date.getTime();
                    const s = this._rangeStart?.setHours(0,0,0,0);
                    const e = this._rangeEnd?.setHours(0,0,0,0);
                    if (this._rangeStart && t === s) {
                        button.classList.add("selected", "range-start");
                    }
                    if (this._rangeEnd && t === e) {
                        button.classList.add("selected", "range-end");
                    }
                    if (this._rangeStart && this._rangeEnd && t > s && t < e) {
                        button.classList.add("selected", "range-middle");
                    }
                } else if (this._selectedDate &&
                    date.getFullYear() === this._selectedDate.getFullYear() &&
                    date.getMonth() === this._selectedDate.getMonth() &&
                    date.getDate() === this._selectedDate.getDate()
                ) {
                    button.classList.add("selected");
                }

                const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                button.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (this._rangeMode) {
                        if (this._rangeStart && this._rangeEnd == null) {
                            if (currentDate < this._rangeStart) {
                                this.value = { start: currentDate, end: this._rangeStart };
                            } else {
                                this.value = { start: this._rangeStart, end: currentDate };
                            }
                            setTimeout(() => {
                                webexpress.webui.NativeMenu.hide(this._dropdownmenu);

                                this._input.blur();
                            }, 0);
                        } else {
                            this._rangeStart = currentDate;
                            this._rangeEnd = null;
                            this.render();
                        }
                    } else {
                        this.value = currentDate;
                        setTimeout(() => {
                            webexpress.webui.NativeMenu.hide(this._dropdownmenu);

                            this._input.blur();
                        }, 0);
                    }
                });

                if (this._rangeMode && this._rangeStart && this._rangeEnd == null) {
                    button.addEventListener("mouseenter", (e) => {
                        e.preventDefault();
                        const start = this._rangeStart?.setHours(0,0,0,0);
                        const end = currentDate?.setHours(0,0,0,0);
                        const min = Math.min(start, end);
                        const max = Math.max(start, end);
                        for (const [d, b] of dateButtonMap.entries()) {
                            const c = d.setHours(0,0,0,0);
                            if (c >= min && c <= max) {
                                b.classList.add("preview");
                            } else {
                                b.classList.remove("preview");
                            }
                        }
                    });
                }
                td.appendChild(button);
                tr.appendChild(td);
                date.setDate(date.getDate() + 1);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        return table;
    }

    /**
     * Returns the i18n month key for a given month index.
     * @param {number} month - 0-based month index.
     * @returns {string}
     */
    _getMonthKey(month) {
        const keys = [
            "january","february","march","april","may","june",
            "july","august","september","october","november","december"
        ];
        return keys[month];
    }

    /**
     * Returns the i18n weekday key for a given weekday index.
     * @param {number} day - 1=Mo to 7=Su.
     * @returns {string}
     */
    _getWeekdayKey(day) {
        const keys = ["sun","mon","tue","wed","thu","fri","sat"];
        return keys[day % 7];
    }

    /**
     * Calculates the ISO-8601 calendar week for the given date.
     * @param {Date} date
     * @returns {number}
     */
    _getCalendarWeek(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-date", webexpress.webui.InputDateCtrl);