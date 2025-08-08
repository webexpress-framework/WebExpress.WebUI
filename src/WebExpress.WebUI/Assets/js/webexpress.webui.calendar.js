/**
 * CalendarCtrl is a calendar control that provides both single-date selection and
 * date range selection functionality, depending on the configuration.
 * The calendar is always rendered as part of the control, without a popup.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.CalendarCtrl = class extends webexpress.webui.Ctrl {
    _holidays = [];
    _dateFormat = null;
    _rangeMode = false;
    _rangeStart = null;
    _rangeEnd = null;
    _selectingRange = false;

    /**
     * Initializes the calendar control and sets up DOM and event bindings.
     * @param {HTMLElement} element - The DOM element for the calendar control.
     */
    constructor(element) {
        super(element);

        // Read configuration from data attributes and set initial state
        const name = element.getAttribute("name");
        this._dateFormat = element.getAttribute("data-format") || webexpress.webui.I18N.translate("webexpress.webui:calendar.format");
        this._rangeMode = element.getAttribute("data-range") === "true";
        const value = element.dataset.value || null;
        this._placeholder = element.getAttribute("placeholder") || webexpress.webui.I18N.translate("webexpress.webui:calendar.select_date");
        const holidaysAttr = element.getAttribute("data-holidays");

        if (this._rangeMode && value && value.includes(" - ")) {
            const [start, end] = value.split(" - ").map(date => this._parseDate(date.trim(), this._dateFormat));
            this._rangeStart = start || null;
            this._rangeEnd = end || null;
            this._viewDate = new Date(this._rangeStart);
        } else if (this._rangeMode) {
            this._rangeStart = null;
            this._rangeEnd = null;
            this._viewDate = new Date();
        } else {
            // parse initial value if available
            this._selectedDate = value ? this._parseDate(value, this._dateFormat) : null;
            // set initial view date
            this._viewDate = this._selectedDate ? new Date(this._selectedDate) : new Date();
        }

        // parse holidays from data attribute
        if (holidaysAttr) {
            this._holidays = holidaysAttr.split(",").map(x => x.trim()).filter(x => x.length > 0);
        }

        this._hidden = this._createHiddenInput(name);

        // clean up element attributes and prepare DOM structure
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-holidays");
        element.removeAttribute("data-format");
        element.removeAttribute("data-range");
        element.innerHTML = "";
        element.classList.add("wx-calendar");
        element.appendChild(this._hidden);

        // build main layout: wrapper, display, toolbar, and calendar container
        const wrapper = document.createElement("div");
        wrapper.className = "wx-calendar-wrapper";
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.gap = "0.5em";
        element.appendChild(wrapper);

        const previewToolbarRow = document.createElement("div");
        previewToolbarRow.className = "wx-calendar-preview-toolbar-row";
        previewToolbarRow.style.display = "flex";
        previewToolbarRow.style.flexDirection = "row";
        previewToolbarRow.style.alignItems = "center";
        wrapper.appendChild(previewToolbarRow);

        // display selected date or range
        this._display = document.createElement("div");
        this._display.className = "wx-calendar-display";
        this._display.style.minHeight = "2em";
        this._display.style.display = "flex";
        this._display.style.alignItems = "center";
        this._display.style.padding = "0.25em 0.5em";
        this._display.style.flex = "1 1 auto";
        previewToolbarRow.appendChild(this._display);

        // toolbar with action buttons (Today, Clear, Copy, Paste)
        this._toolbar = document.createElement("div");
        this._toolbar.className = "wx-calendar-toolbar";
        this._toolbar.style.display = "flex";
        this._toolbar.style.flexDirection = "row";
        this._toolbar.style.alignItems = "center";
        this._toolbar.style.gap = "0.25em";
        previewToolbarRow.appendChild(this._toolbar);

        // today button to select the current day
        const todayBtn = document.createElement("button");
        todayBtn.type = "button";
        todayBtn.className = "btn btn-light wx-calendar-today-btn";
        todayBtn.title = webexpress.webui.I18N
            ? webexpress.webui.I18N.translate("webexpress.webui:calendar.today")
            : "Today";
        todayBtn.innerHTML = '<i class="fa-solid fa-calendar-day"></i>';
        todayBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const now = new Date();
            this._viewDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (this._rangeMode) {
                this._rangeStart = this._rangeEnd = now;
                this._selectingRange = false;
            } else {
                this.value = now;
            }

            this.render();
        });
        this._toolbar.appendChild(todayBtn);

        // button to clear the selection
        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "btn btn-light wx-calendar-clear-btn";
        clearBtn.title = webexpress.webui.I18N
            ? webexpress.webui.I18N.translate("webexpress.webui:calendar.clear_range") || "Clear range"
            : "Clear range";
        clearBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        clearBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this._rangeMode) {
                this._rangeStart = null;
                this._rangeEnd = null;
                this._selectingRange = false;
            } else {
                this.value = null;
            }

            this.render();
        });
        this._toolbar.appendChild(clearBtn);

        // button to copy the current value to clipboard
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "btn btn-light wx-calendar-copy-btn";
        copyBtn.title = webexpress.webui.I18N
            ? webexpress.webui.I18N.translate("webexpress.webui:copy") || "Copy"
            : "Copy";
        copyBtn.innerHTML = '<i class="fa-solid fa-clone"></i>';
        copyBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            let copyText = "";
            if (this._rangeMode && this._rangeStart && this._rangeEnd) {
                copyText = this._formatDateString(this._rangeStart, this._dateFormat) + " - " + this._formatDateString(this._rangeEnd, this._dateFormat);
            } else if (!this._rangeMode && this._selectedDate) {
                copyText = this._formatDateString(this._selectedDate, this._dateFormat);
            }
            if (copyText) {
                navigator.clipboard.writeText(copyText);
            }
        });
        this._toolbar.appendChild(copyBtn);

        // container for the calendar view
        this._calendarContainer = document.createElement("div");
        wrapper.appendChild(this._calendarContainer);

        this.render();
    }

    /**
     * Creates a hidden input for form submission.
     * @param {string} name - The input name attribute.
     * @returns {HTMLInputElement} Hidden input element.
     * @private
     */
    _createHiddenInput(name) {
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = name || "";
        return hiddenInput;
    }

    /**
     * Render the display area and calendar according to the current state.
     */
    render() {
        if (this._rangeMode) {
            this._display.textContent = (this._rangeStart && this._rangeEnd)
                ? this._formatDate(this._rangeStart) + " - " + this._formatDate(this._rangeEnd)
                : (webexpress.webui.I18N
                    ? webexpress.webui.I18N.translate("webexpress.webui:calendar.select_range")
                    : "Select range");
            this._hidden.value = (this._rangeStart && this._rangeEnd)
                ? this._formatDateString(this._rangeStart, this._dateFormat) + " - " + this._formatDateString(this._rangeEnd, this._dateFormat)
                : "";
        } else {
            this._display.textContent = this._selectedDate
                ? this._formatDate(this._selectedDate)
                : this._placeholder;
            this._hidden.value = this._selectedDate
                ? this._formatDateString(this._selectedDate, this._dateFormat)
                : "";
        }
        // disable copy button if nothing is selected
        if ((this._rangeMode && (!this._rangeStart || !this._rangeEnd)) ||
            (!this._rangeMode && !this._selectedDate)) {
            this._toolbar.querySelector('.wx-calendar-copy-btn').disabled = true;
        } else {
            this._toolbar.querySelector('.wx-calendar-copy-btn').disabled = false;
        }

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
     * Sets the current value and triggers rendering and change event.
     * @param {Date|Object|null} date - Date or {start, end} object.
     */
    set value(date) {
        if (this._rangeMode && date && typeof date === "object") {
            this._rangeStart = new Date(date.start);
            this._rangeEnd = date.end;
            this._selectedDate = null;
        } else {
            this._selectedDate = new Date(date);
            this._rangeStart = null;
            this._rangeEnd = null;
        }

        const value = this._rangeMode
            ? (this._rangeStart && this._rangeEnd
                ? this._formatDateString(this._rangeStart, this._dateFormat) + " - " + this._formatDateString(this._rangeEnd, this._dateFormat)
                : (this._rangeStart ? this._formatDateString(this._rangeStart, this._dateFormat) : ""))
            : (date ? this._formatDateString(date, this._dateFormat) : "");
        
        if (this._hidden.value != value) {
            this._hidden.value = value;
            
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id,
                    value: value
                }
            }));
        }
        
        this.render();
    }

    /**
     * Format a date for display.
     * @param {Date} date - Date to format.
     * @returns {string} Formatted date string.
     * @private
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
     * @private
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
     * @private
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
     * @private
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
     * Handles display of range selection, single-date selection, holidays, and week numbers.
     * Handles mouseover for preview (hover) display and highlights all days in the hovered range.
     * @returns {HTMLDivElement} The rendered calendar container element.
     * @private
     */
    _renderCalendar() {
        const dateButtonMap = new Map();
        const viewDate = this._viewDate ? this._viewDate : new Date();
        const container = document.createElement("div");
        container.classList.add("wx-calendar-view");

        const header = document.createElement("div");
        header.classList.add("wx-calendar-header");
        const btnPrevYear = this._createNavButton("«", () => this._changeView(-1, "year"));
        const btnPrevMonth = this._createNavButton("‹", () => this._changeView(-1, "month"));
        const btnNextMonth = this._createNavButton("›", () => this._changeView(1, "month"));
        const btnNextYear = this._createNavButton("»", () => this._changeView(1, "year"));
        const monthYear = document.createElement("span");
        monthYear.textContent = viewDate.getFullYear() 
            + " - " 
            + webexpress.webui.I18N.translate(`webexpress.webui:calendar.${this._getMonthKey(viewDate.getMonth())}`);
        monthYear.classList.add("wx-calendar-monthyear");

        header.appendChild(btnPrevYear);
        header.appendChild(btnPrevMonth);
        header.appendChild(monthYear);
        header.appendChild(btnNextMonth);
        header.appendChild(btnNextYear);

        const table = document.createElement("table");
        table.classList.add("wx-calendar-table");
        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        const thKW = document.createElement("th");
        thKW.textContent = webexpress.webui.I18N.translate("webexpress.webui:calendar.calendar_week");
        trHead.appendChild(thKW);

        for (let i = 1; i <= 7; i++) {
            const th = document.createElement("th");
            th.textContent = webexpress.webui.I18N.translate(`webexpress.webui:calendar.${this._getWeekdayKey(i % 7)}`);
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

        // table rows and cells for days
        while (date <= lastDay || date.getDay() !== 1) {
            const tr = document.createElement("tr");
            const tdKW = document.createElement("td");
            tdKW.textContent = this._getCalendarWeek(date);
            tr.appendChild(tdKW);

            for (let wd = 1; wd <= 7; wd++) {
                const td = document.createElement("td");
                const button = document.createElement("button");
                button.textContent = date.getDate();
                td.appendChild(button);
                dateButtonMap.set(new Date(date.getFullYear(), date.getMonth(), date.getDate()), button);
                button.className = "wx-calendar-day";
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

                // highlight selected range
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
                } else if (!this._rangeMode && this._selectedDate
                    && date.getFullYear() === this._selectedDate.getFullYear()
                    && date.getMonth() === this._selectedDate.getMonth()
                    && date.getDate() === this._selectedDate.getDate()) {
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
                        } else {
                            this.value = { start: currentDate, end: null };
                        }
                    } else {
                        this.value = currentDate;
                    }
                    this.render();
                });
                
                button.addEventListener("dblclick", (e) => {
                    e.stopPropagation();
                    this.value = null;
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

                tr.appendChild(td);
                date.setDate(date.getDate() + 1);
            }
            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        container.appendChild(header);
        container.appendChild(table);

        return container;
    }

    /**
     * Returns the i18n month key for a given month index.
     * @param {number} month - 0-based month index.
     * @returns {string} Month key.
     * @private
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
     * @private
     */
    _getWeekdayKey(day) {
        const keys = ["sun","mon","tue","wed","thu","fri","sat"];
        return keys[day % 7];
    }

    /**
     * Calculates the ISO-8601 calendar week number for the given date.
     * @param {Date} date - Date for calculation.
     * @returns {number} Calendar week number.
     * @private
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
webexpress.webui.Controller.registerClass("wx-webui-calendar", webexpress.webui.CalendarCtrl);