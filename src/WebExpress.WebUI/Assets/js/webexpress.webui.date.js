/**
 * A date picker control extending the base Control class.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT
 */
webexpress.webui.DateCtrl = class extends webexpress.webui.PopperCtrl {
    _holidays = [];
    
    /**
     * Constructor for initializing the date control.
     * @param {HTMLElement} element - The DOM element for the date control.
     */
    constructor(element) {
        super(element);

        // Initialize properties
        const name = element.getAttribute("name");
        const value = element.dataset.value || null;
        this._placeholder = element.getAttribute("placeholder") || webexpress.webui.I18N.translate("calendar.select_date");
        const holidaysAttr = element.getAttribute("data-holidays");
        
        if (holidaysAttr) {
            this._holidays = holidaysAttr.split(",").map(x => x.trim()).filter(x => x.length > 0);
        }
        this._hidden = this._createHiddenInput(name);
        this._dropdown = this._createDropdown();
        this._dropdownmenu = this._createDropdownMenu();
        this._selectedDate = value ? new Date(value) : null;
        this._viewDate = this._selectedDate ? new Date(this._selectedDate) : new Date();

        // Remove unnecessary attributes and build structure
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-holidays");
        element.innerHTML = "";
        element.classList.add("wx-date");
        element.appendChild(this._hidden);
        element.appendChild(this._dropdown);
        element.appendChild(this._dropdownmenu);

        // Attach Popper.js positioning for the dropdown menu
        this._initializePopper(this._dropdown, this._dropdownmenu);

        // Initial rendering
        this.render();
    }

    /**
     * Creates a hidden input for form submission.
     * @param {string} name - The name attribute for the hidden input.
     * @returns {HTMLInputElement} The hidden input element.
     */
    _createHiddenInput(name) {
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = name || "";
        return hiddenInput;
    }

    /**
     * Creates the visible selection field, including the calendar icon.
     * @returns {HTMLDivElement} The dropdown element.
     */
    _createDropdown() {
        const dropdown = document.createElement("div");
        dropdown.classList.add("form-control");
        dropdown.style.cursor = "pointer";
        dropdown.style.position = "relative";
        this._display = document.createElement("span");
        this._display.style.flex = "1 1 auto";
        dropdown.appendChild(this._display);

        // Add calendar icon (Font Awesome)
        const icon = document.createElement("span");
        icon.className = "wx-date-calendar-icon fa-solid fa-calendar-days";
        icon.setAttribute("aria-hidden", "true");
        dropdown.appendChild(icon);

        // Open the dropdown on click
        dropdown.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this._dropdownmenu.style.display === "flex") {
                this._dropdownmenu.dispatchEvent(new Event("hide"));
                this._dropdownmenu.style.display = "none";
            } else {
                this._dropdownmenu.style.display = "flex";
                this._dropdownmenu.dispatchEvent(new Event("show"));
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && !this._dropdownmenu.contains(e.target)) {
                this._dropdownmenu.dispatchEvent(new Event("hide"));
                this._dropdownmenu.style.display = "none";
            }
        });

        return dropdown;
    }

    /**
     * Creates the dropdown menu with calendar view.
     * @returns {HTMLDivElement} The dropdown menu element.
     */
    _createDropdownMenu() {
        const dropdownMenu = document.createElement("div");
        dropdownMenu.classList.add("dropdown-menu");
        dropdownMenu.style.minWidth = "280px";
        dropdownMenu.style.display = "none";
        this._calendarContainer = document.createElement("div");
        dropdownMenu.appendChild(this._calendarContainer);
        return dropdownMenu;
    }

    /**
     * Renders the date control and the calendar.
     */
    render() {
        // Update the display text
        if (this._selectedDate) {
            this._display.textContent = this._formatDate(this._selectedDate);
        } else {
            this._display.textContent = this._placeholder;
        }
        this._hidden.value = this._selectedDate ? this._toDateValue(this._selectedDate) : "";

        // Create calendar view
        this._calendarContainer.innerHTML = "";
        this._calendarContainer.appendChild(this._renderCalendar());
    }

    /**
     * Creates the calendar view.
     * @returns {HTMLDivElement} The calendar element.
     */
    _renderCalendar() {
        const container = document.createElement("div");
        container.classList.add("wx-calendar");

        // Header with navigation (year/month)
        const header = document.createElement("div");
        header.classList.add("wx-calendar-header");
        const btnPrevYear = this._createNavButton("«", () => this._changeView(-1, "year"));
        const btnPrevMonth = this._createNavButton("‹", () => this._changeView(-1, "month"));
        const btnNextMonth = this._createNavButton("›", () => this._changeView(1, "month"));
        const btnNextYear = this._createNavButton("»", () => this._changeView(1, "year"));
        const monthYear = document.createElement("span");
        monthYear.textContent = this._viewDate.getFullYear() + " – " + webexpress.webui.I18N.translate("calendar." + this._getMonthKey(this._viewDate.getMonth()));
        monthYear.classList.add("wx-calendar-monthyear");

        header.appendChild(btnPrevYear);
        header.appendChild(btnPrevMonth);
        header.appendChild(monthYear);
        header.appendChild(btnNextMonth);
        header.appendChild(btnNextYear);

        // Table structure for calendar
        const table = document.createElement("table");
        table.classList.add("wx-calendar-table");
        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        const thKW = document.createElement("th");
        thKW.textContent = webexpress.webui.I18N.translate("calendar.calendar_week");
        trHead.appendChild(thKW);

        // Weekdays (Mo-Su) with i18n
        for (let i = 1; i <= 7; i++) {
            const th = document.createElement("th");
            th.textContent = webexpress.webui.I18N.translate("calendar." + this._getWeekdayKey(i % 7));
            trHead.appendChild(th);
        }
        thead.appendChild(trHead);
        table.appendChild(thead);

        // Calculate calendar dates
        const tbody = document.createElement("tbody");
        const year = this._viewDate.getFullYear();
        const month = this._viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let date = new Date(firstDay);
        date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // Start at Monday

        // Iterate each calendar week
        while (date <= lastDay || date.getDay() !== 1) {
            const tr = document.createElement("tr");
            // Calendar week
            const tdKW = document.createElement("td");
            tdKW.textContent = this._getCalendarWeek(date);
            tr.appendChild(tdKW);

            // Weekdays
            for (let wd = 1; wd <= 7; wd++) {
                const td = document.createElement("td");
                td.textContent = date.getMonth() === month ? date.getDate() : "";
                td.className = "wx-calendar-day";
                
                // Weekend (Saturday = 6, Sunday = 0)
                if (date.getMonth() === month && (date.getDay() === 0 || date.getDay() === 6)) {
                    td.classList.add("wx-calendar-red");
                }

                // Holidays (compare formatted date string)
                if (date.getMonth() === month) {
                    const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
                    if (this._holidays.includes(dateStr)) {
                        td.classList.add("wx-calendar-red");
                    }
                }
                
                if (date.getMonth() !== month) {
                    td.classList.add("wx-calendar-out");
                } else if (
                    this._selectedDate &&
                    date.getFullYear() === this._selectedDate.getFullYear() &&
                    date.getMonth() === this._selectedDate.getMonth() &&
                    date.getDate() === this._selectedDate.getDate()
                ) {
                    td.classList.add("selected");
                }
                td.style.cursor = date.getMonth() === month ? "pointer" : "default";
                if (date.getMonth() === month) {
                    // Use a copy of the current date for the click handler
                    const currentDate = new Date(date);
                    td.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.value = currentDate;
                        this._dropdownmenu.style.display = "none";
                        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                            detail: {
                                sender: this._element,
                                id: this._element.id
                            }
                        }));
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
     * Creates a navigation button for the calendar.
     * @param {string} text - The button text.
     * @param {function} onclick - The click handler.
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
     * Navigates the calendar (month/year).
     * @param {number} step - Step size.
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
     * Returns the current selected date.
     * @returns {Date|null}
     */
    get value() {
        return this._selectedDate;
    }

    /**
     * Sets the selected date and triggers events.
     * @param {Date|null} date
     */
    set value(date) {
        if (
            !this._selectedDate ||
            !date ||
            this._toDateValue(this._selectedDate) !== this._toDateValue(date)
        ) {
            this._selectedDate = date;
            this.render();
            this._hidden.value = date ? this._toDateValue(date) : "";
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id,
                    value: date ? this._toDateValue(date) : ""
                }
            }));
        }
    }

    /**
     * Formats the date for display.
     * @param {Date} date
     * @returns {string}
     */
    _formatDate(date) {
        // Example: 10.06.2025
        return date.toLocaleDateString(webexpress.webui.I18N.language === "de" ? "de-DE" : "en-GB");
    }

    /**
     * Converts a date to YYYY-MM-DD string.
     * @param {Date} date
     * @returns {string}
     */
    _toDateValue(date) {
        return date
            ? date.getFullYear() +
                  "-" +
                  String(date.getMonth() + 1).padStart(2, "0") +
                  "-" +
                  String(date.getDate()).padStart(2, "0")
            : "";
    }

    /**
     * Returns the month key for i18n.
     * @param {number} month - 0-based
     * @returns {string}
     */
    _getMonthKey(month) {
        // Mapping for i18n keys
        const keys = [
            "january","february","march","april","may","june",
            "july","august","september","october","november","december"
        ];
        return keys[month];
    }

    /**
     * Returns the weekday key for i18n.
     * @param {number} day - 1=Mo to 7=Su
     * @returns {string}
     */
    _getWeekdayKey(day) {
        // day: 1=Mo, ..., 7=Su
        const keys = ["sun","mon","tue","wed","thu","fri","sat"];
        return keys[day % 7];
    }

    /**
     * Calculates the ISO-8601 calendar week.
     * @param {Date} date
     * @returns {number}
     */
    _getCalendarWeek(date) {
        // Clone and set to Monday of the current week
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-date", webexpress.webui.DateCtrl);