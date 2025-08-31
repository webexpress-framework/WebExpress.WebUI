/**
 * CalendarCtrl is a calendar control for selecting a single or range date.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT: Fired when the selected date changes
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT: Fired when the calendar popup is opened
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT: Fired when the calendar popup is closed
 */
webexpress.webui.DateCtrl = class extends webexpress.webui.PopperCtrl {
    _holidays = [];
    _dateFormat = null; // stores the format for both display and value

    /**
     * Initializes the date control, sets up DOM and event bindings.
     * @param {HTMLElement} element - The DOM element for the date control.
     */
    constructor(element) {
        super(element);

        this._name = element.getAttribute("name");
        this._dateFormat = element.getAttribute("data-format") || webexpress.webui.I18N.translate("webexpress.webui:calendar.format");
        const value = element.dataset.value || null;
        this._placeholder = element.getAttribute("placeholder") || webexpress.webui.I18N.translate("webexpress.webui:calendar.select_date");
        const holidaysAttr = element.getAttribute("data-holidays");
        this._rangeMode = element.getAttribute("data-range") === "true";

        // clean up element attributes and prepare DOM structure
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-holidays");
        element.removeAttribute("data-value");
        element.removeAttribute("data-format");
        element.removeAttribute("data-range");
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
            this._holidays = holidaysAttr.split(",").map(x => x.trim()).filter(x => x.length > 0);
        }
        
        this._viewDate = value ? this._parseDate(value, this._dateFormat) : null;
        this._dropdown = this._createDropdown();
        this._dropdownmenu = this._createDropdownMenu();
        
        element.appendChild(this._dropdown);
        element.appendChild(this._dropdownmenu);
        
        this._initializePopper(this._dropdown, this._dropdownmenu);
        
        this.value = this._rangeMode ? { start: this._rangeStart, end: this._rangeEnd } : this._viewDate;
    }

    /**
     * Creates the dropdown container, text input, and calendar icon.
     * @returns {HTMLDivElement} Dropdown element.
     */
    _createDropdown() {
        const dropdown = document.createElement("div");
        dropdown.classList.add("form-control");
        dropdown.style.cursor = "pointer";
        dropdown.style.position = "relative";
        dropdown.style.display = "flex";
        dropdown.style.alignItems = "center";

        this._input = document.createElement("input");
        this._input.name = this._name || "";
        this._input.type = "text";
        this._input.className = "wx-date-input";
        this._input.style.flex = "1 1 auto";
        this._input.style.border = "none";
        this._input.style.outline = "none";
        this._input.style.background = "transparent";
        this._input.style.padding = "0";
        this._input.placeholder = this._placeholder;
        this._input.autocomplete = "off";
        this._input.value = "";

        // always show popup when clicking on the icon or control, regardless of focus
        this._input.addEventListener("input", () => this._onInputLive());
        this._input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this._onInputChange();
            }
        });
        this._input.addEventListener("blur", () => {
            this._dropdownmenu.style.display = "flex";
            this._dropdownmenu.dispatchEvent(new Event("show"));
            this._dropdownmenu.blur();
        });

        dropdown.appendChild(this._input);

        const icon = document.createElement("span");
        icon.className = "wx-date-calendar-icon fa-solid fa-calendar-days";
        icon.setAttribute("aria-hidden", "true");
        icon.style.marginLeft = "0.5em";
        dropdown.appendChild(icon);

        // always open popup when clicking the calendar icon
        icon.addEventListener("click", (e) => {
            e.stopPropagation();
            this._dropdownmenu.style.display = "flex";
            this._dropdownmenu.dispatchEvent(new Event("show"));
            this._dropdownmenu.blur();
        });

        // always open popup when clicking the control (not just icon)
        dropdown.addEventListener("click", (e) => {
            e.stopPropagation();
            this._dropdownmenu.style.display = "flex";
            this._dropdownmenu.dispatchEvent(new Event("show"));
            this._dropdownmenu.blur();
        });

        // hide popup on outside click
        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && !this._dropdownmenu.contains(e.target)) {
                this._dropdownmenu.dispatchEvent(new Event("hide"));
                this._dropdownmenu.style.display = "none";
                this._input.blur();
            }
        });

        return dropdown;
    }

    /**
     * Live validation and popup sync for manual text input.
     */
    _onInputLive() {
        const inputValue = this._input.value.trim();
        if (!inputValue) {
            this._input.setCustomValidity("");
            this._input.classList.remove("is-invalid");
            return;
        }
        const parsed = this._parseDate(inputValue, this._dateFormat);
        if (parsed && !isNaN(parsed.getTime()) && this._formatDateString(parsed, this._dateFormat) === inputValue) {
            this._input.setCustomValidity("");
            this._input.classList.remove("is-invalid");
            this._viewDate = new Date(parsed);
            this._calendarContainer.innerHTML = "";
            this._calendarContainer.appendChild(this._renderCalendar());
        } else {
            this._input.setCustomValidity("invalid");
            this._input.classList.add("is-invalid");
        }
    }

    /**
     * Commits input value on blur or enter; updates selected date if valid.
     */
    _onInputChange() {
        const inputValue = this._input.value.trim();
        if (!inputValue) {
            this.value = null;
            this._input.setCustomValidity("");
            this._input.classList.remove("is-invalid");
            return;
        }
        const parsed = this._parseDate(inputValue, this._dateFormat);
        if (
            parsed &&
            !isNaN(parsed.getTime()) &&
            this._formatDateString(parsed, this._dateFormat) === inputValue
        ) {
            this.value = parsed;
            this._input.setCustomValidity("");
            this._input.classList.remove("is-invalid");
        } else {
            this._input.setCustomValidity("invalid");
            this._input.classList.add("is-invalid");
        }
    }

    /**
     * Creates the dropdown menu (calendar popup) and "Today" button.
     * @returns {HTMLDivElement} Dropdown menu element.
     */
    _createDropdownMenu() {
        const viewDate = this._viewDate ? this._viewDate : new Date();
        const dropdownMenu = document.createElement("div");
        dropdownMenu.classList.add("dropdown-menu");
        dropdownMenu.style.minWidth = "280px";
        dropdownMenu.style.display = "none";
                        
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
        todayBtn.textContent = webexpress.webui.I18N
            ? webexpress.webui.I18N.translate("webexpress.webui:calendar.today")
            : "Today";
        todayBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const now = new Date();
            
            if (this._rangeMode) {
                this.value = { start: now, end: now };
            } else {
                this.value = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }

            setTimeout(() => {
                this._dropdownmenu.style.display = "none";
                document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                    detail: {
                        sender: this._element,
                        id: this._element.id
                    }
                }));
            }, 0);
        });
        dropdownMenu.appendChild(todayBtn);

        return dropdownMenu;
    }

    /**
     * Renders the input and calendar according to state.
     */
    render() {
        const viewDate = this._viewDate ? this._viewDate : new Date();
        this._monthYear.textContent = viewDate?.getFullYear() 
            + " - " 
            + webexpress.webui.I18N.translate(`webexpress.webui:calendar.${this._getMonthKey(viewDate?.getMonth())}`);
        this._calendarContainer.innerHTML = "";
        this._calendarContainer.appendChild(this._renderCalendar());
    }

    /**
     * Gets the current value (single date or range).
     * @returns {Date|Object|null} Single date or {start, end} object in range mode.
     */
    get value() {
        return this._rangeMode
            ? { start: this._rangeStart, end: this._rangeEnd }
            : this._selectedDate;
    }

    /**
     * Sets the selected date, triggers render and change event.
     * @param {Date|null} date - Date to set as selected.
     */
    set value(date) {
        if (this._rangeMode && date && typeof date === "object" && !(date instanceof Date)) {
            const start = typeof date.start === "string" ? this._parseDate(date.start, this._dateFormat) : date.start;
            const end = typeof date.end === "string" ? this._parseDate(date.end, this._dateFormat) : date.end;
            this._rangeStart = start ? new Date(start) : null;
            this._rangeEnd = end;
            this._selectedDate = null;
        } else if (typeof date === "string") {
            const dt = this._parseDate(date, this._dateFormat);
            this._selectedDate = dt ? new Date(dt) : null;
            this._rangeStart = null;
            this._rangeEnd = null;
        } else {
            this._selectedDate = date ? new Date(date) : null;
            this._rangeStart = null;
            this._rangeEnd = null;
        }

        const value = this._rangeMode
            ? (this._rangeStart && this._rangeEnd
                ? this._formatDateString(this._rangeStart, this._dateFormat) + " - " + this._formatDateString(this._rangeEnd, this._dateFormat)
                : (this._rangeStart ? this._formatDateString(this._rangeStart, this._dateFormat) : ""))
            : (this._selectedDate ? this._formatDateString(this._selectedDate, this._dateFormat) : "");
        
        if (this._input.value != value) {
            this._input.value = value;
            
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id,
                    value: value
                }
            }));
        }
        
        this._viewDate = this._rangeStart ? (this._rangeStart) : (this._selectedDate || date);
        this.render();
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
     * Formats a Date object according to the given format (YYYY-MM-DD etc).
     * @param {Date} date - Date to format.
     * @param {string} format - Format string.
     * @returns {string} Formatted string.
     */
    _formatDateString(date, format) {
        const yyyy = date.getFullYear().toString();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");

        return format
            .replace(/YYYY/gi, yyyy)
            .replace(/MM/gi, mm)
            .replace(/DD/gi, dd);
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
        const normalizedFormat = format.toLowerCase();

        let year, month, day;

        if (normalizedFormat === "yyyy-mm-dd") {
            const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) {
                year = parseInt(m[1], 10);
                month = parseInt(m[2], 10) - 1;
                day = parseInt(m[3], 10);
            }
        } else if (normalizedFormat === "dd.mm.yyyy") {
            const m = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
            if (m) {
                day = parseInt(m[1], 10);
                month = parseInt(m[2], 10) - 1;
                year = parseInt(m[3], 10);
            }
        } else if (normalizedFormat === "mm/dd/yyyy") {
            const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (m) {
                month = parseInt(m[1], 10) - 1;
                day = parseInt(m[2], 10);
                year = parseInt(m[3], 10);
            }
        } else if (normalizedFormat === "m/d/yyyy") {
            const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (m) {
                month = parseInt(m[1], 10) - 1;
                day = parseInt(m[2], 10);
                year = parseInt(m[3], 10);
            }
        } else if (normalizedFormat === "mmmm dd, yyyy") {
            const m = value.match(/^([a-zA-Z]+) (\d{2}), (\d{4})$/);
            if (m) {
                month = this._parseMonth(m[1]);
                day = parseInt(m[2], 10);
                year = parseInt(m[3], 10);
            }
        } else if (normalizedFormat === "dddd, mmmm dd, yyyy") {
            const m = value.match(/^[a-zA-Z]+, ([a-zA-Z]+) (\d{2}), (\d{4})$/);
            if (m) {
                month = this._parseMonth(m[1]);
                day = parseInt(m[2], 10);
                year = parseInt(m[3], 10);
            }
        }

        if (year && month >= 0 && day) {
            const d = new Date(year, month, day);
            if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
                return d;
            }
            return null;
        }

        return null;
    }

    /**
     * Helper function to parse month names (e.g., "January", "Feb").
     * @param {string} monthStr - Month string.
     * @returns {number|null} Month index (0-based) or null.
     * @private
     */
    _parseMonth(monthStr) {
        const months = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];
        const index = months.indexOf(monthStr.toLowerCase());
        return index !== -1 ? index : null;
    }

    /**
     * Creates a navigation button for the calendar header.
     * @param {string} text - Button text (e.g. « or ›).
     * @param {function} onclick - Click handler function.
     * @returns {HTMLButtonElement} Navigation button.
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
     * @param {number} step - Step size (e.g. -1 for previous).
     * @param {"month"|"year"} mode - Navigation mode.
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
     * @returns {HTMLDivElement} Calendar element.
     */
    _renderCalendar() {
        const dateButtonMap = new Map();
        const viewDate = this._viewDate ? this._viewDate : new Date();
        // table for calendar days
        const table = document.createElement("table");
        table.classList.add("wx-calendar-table");
        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        const thKW = document.createElement("th");
        thKW.textContent = webexpress.webui.I18N.translate("webexpress.webui:calendar.calendar_week");
        trHead.appendChild(thKW);

        // weekdays header (monday start)
        for (let i = 1; i <= 7; i++) {
            const th = document.createElement("th");
            th.textContent = webexpress.webui.I18N.translate(`webexpress.webui:calendar.${this._getWeekdayKey(i % 7)}`);
            trHead.appendChild(th);
        }
        thead.appendChild(trHead);
        table.appendChild(thead);

        // body with days
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
                                this._dropdownmenu.style.display = "none";
                                document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                                    detail: {
                                        sender: this._element,
                                        id: this._element.id
                                    }
                                }));
                                this._input.blur();
                            }, 0);
                        } else {
                            //this.value = { start: currentDate, end: null };
                            this._rangeStart = currentDate;
                            this._rangeEnd = null;
                            this.render();
                        }
                    } else {
                        this.value = currentDate;
                        setTimeout(() => {
                            this._dropdownmenu.style.display = "none";
                            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                                detail: {
                                    sender: this._element,
                                    id: this._element.id
                                }
                            }));
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
     * @returns {string} Month key.
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
     * @returns {string} Weekday key.
     */
    _getWeekdayKey(day) {
        const keys = ["sun","mon","tue","wed","thu","fri","sat"];
        return keys[day % 7];
    }

    /**
     * Calculates the ISO-8601 calendar week number for the given date.
     * @param {Date} date - Date for calculation.
     * @returns {number} Calendar week number.
     */
    _getCalendarWeek(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-date", webexpress.webui.DateCtrl);