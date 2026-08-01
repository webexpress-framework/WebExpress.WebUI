/**
 * A calendar control for time-based items - appointments, events or tasks -
 * that carry a start, an end and may span several days.
 *
 * It offers three views over the same set of items:
 *
 *   - agenda: a chronological list of the items, grouped by day, week or month.
 *   - week:   a seven day grid with an optional time axis. With the axis on, a
 *             timed item is placed and stretched by its hours and overlapping
 *             items share the width of the day; with the axis off, the items of
 *             a day are stacked as chips.
 *   - month:  the classic calendar grid, with compact chips per day and
 *             continuous bars for the entries that span several days.
 *
 * Localisation runs through Intl, so the month and weekday names, the date and
 * time formats and the calendar system all follow the configured culture. A
 * culture tag may carry the Unicode calendar extension (for example
 * "th-TH-u-ca-buddhist") to render a calendar other than the Gregorian one.
 * Week numbering follows ISO 8601 on request, independently of the day a week
 * starts on.
 *
 * The model is read from hidden descriptor children (.wx-schedule-item and
 * .wx-schedule-holiday) that the C# ControlSchedule emits, and can be replaced
 * programmatically through the model property. Timestamps are exchanged without
 * a zone offset and parsed as local time, so a day never shifts because the
 * visitor sits in another zone.
 *
 * The following events are dispatched on the host element:
 * - webexpress.webui.Event.CLICK_EVENT         an item was clicked
 * - webexpress.webui.Event.DOUBLE_CLICK_EVENT  an item was double-clicked
 * - webexpress.webui.Event.SELECT_ITEM_EVENT   an empty day or time slot was clicked
 * - webexpress.webui.Event.CHANGE_PAGE_EVENT   the view or the shown period changed
 * - webexpress.webui.Event.MOVE_EVENT          an item was moved (editable only)
 * - webexpress.webui.Event.UPDATED_EVENT       the schedule was rendered
 */
webexpress.webui.ScheduleCtrl = class extends webexpress.webui.Ctrl {

    /** The views the control knows, in the order the switcher offers them. */
    static VIEWS = ["month", "week", "agenda"];

    /** The view a host without a data-view attribute opens in. */
    static DEFAULT_VIEW = "month";

    /** The agenda grouping a host without a data-agenda-grouping attribute uses. */
    static DEFAULT_GROUPING = "day";

    /** The bounds of the time axis when the host does not narrow them. */
    static DEFAULT_HOUR_START = 0;
    static DEFAULT_HOUR_END = 24;

    /** How many chips a month day shows before it collapses the rest into a counter. */
    static MONTH_CHIP_LIMIT = 3;

    /** The week start used when neither the host nor the culture yields one. */
    static FALLBACK_WEEK_START = 1;

    static MS_PER_DAY = 86400000;

    /**
     * Creates a new schedule.
     * @param {HTMLElement} element - The host element.
     */
    constructor(element) {
        super(element);

        // every listener installed outside the own subtree is recorded, so the
        // teardown releases them all - including the transient ones of a drag
        // that was still in progress
        this._windowListeners = [];
        this._destroyed = false;
        this._drag = null;

        // a custom renderer replaces the default entry or holiday markup; it
        // returns null to fall back, so a page can special-case a few entries
        // without having to reimplement the rest
        this.itemRenderer = null;
        this.holidayRenderer = null;

        this._readConfig(element);

        // the descriptors have to be read before the host is emptied
        this._model = this._normalizeModel(this._readFromDom(element));

        element.innerHTML = "";
        element.classList.add("wx-schedule");

        this._buildFormatters();
        this.render();
    }

    // -----------------------------------------------------------------------
    // configuration
    // -----------------------------------------------------------------------

    /**
     * Reads the declarative configuration off the host element.
     * @param {HTMLElement} element - The host element.
     */
    _readConfig(element) {
        const data = element.dataset || {};

        this._culture = data.culture || undefined;
        this._views = this._parseViews(data.views);
        this._view = this._views.includes(data.view) ? data.view : (this._views[0] || webexpress.webui.ScheduleCtrl.DEFAULT_VIEW);
        this._grouping = ["day", "week", "month"].includes(data.agendaGrouping)
            ? data.agendaGrouping
            : webexpress.webui.ScheduleCtrl.DEFAULT_GROUPING;

        this._isoWeek = data.isoWeek === "true";
        this._showWeekNumbers = data.weekNumbers === "true";
        this._showHolidays = data.showHolidays !== "false";
        this._timeAxis = data.timeAxis !== "false";
        this._miniCalendar = data.miniCalendar === "true";
        this._editable = data.editable === "true";

        this._weekStart = this._resolveWeekStart(data.weekStart);
        [this._hourStart, this._hourEnd] = this._resolveHours(data.hourStart, data.hourEnd);

        this._anchor = this._parseDate(data.date) || this._startOfDay(new Date());
    }

    /**
     * Parses the offered views, dropping the unknown ones so a typo cannot
     * produce a switcher button that leads nowhere.
     * @param {string|undefined} raw - The comma separated list.
     * @returns {Array<string>} The offered views, never empty.
     */
    _parseViews(raw) {
        const all = webexpress.webui.ScheduleCtrl.VIEWS;
        const wanted = String(raw || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
        const offered = all.filter((v) => wanted.includes(v));

        return offered.length > 0 ? offered : all.slice();
    }

    /**
     * Resolves the day a week starts on: the explicit configuration first, then
     * the culture, then Monday. The culture lookup is guarded because the week
     * information of Intl.Locale is not available in every engine.
     * @param {string|undefined} raw - The configured week start, 0 (Sunday) to 6.
     * @returns {number} The week start as a JavaScript day index.
     */
    _resolveWeekStart(raw) {
        const explicit = parseInt(raw, 10);
        if (Number.isFinite(explicit) && explicit >= 0 && explicit <= 6) {
            return explicit;
        }

        try {
            const locale = new Intl.Locale(this._culture || undefined);
            const info = typeof locale.getWeekInfo === "function" ? locale.getWeekInfo() : locale.weekInfo;
            // Intl counts Monday as 1 and Sunday as 7, JavaScript Sunday as 0
            if (info && Number.isFinite(info.firstDay)) {
                return info.firstDay % 7;
            }
        } catch (e) {
            // an unsupported tag or engine falls through to the default
        }

        return webexpress.webui.ScheduleCtrl.FALLBACK_WEEK_START;
    }

    /**
     * Resolves the bounds of the time axis, keeping them inside a day and in
     * order so an inverted or out-of-range configuration cannot produce a grid
     * with a negative height.
     * @param {string|undefined} rawStart - The configured first hour.
     * @param {string|undefined} rawEnd - The configured last hour.
     * @returns {Array<number>} The [start, end] hours.
     */
    _resolveHours(rawStart, rawEnd) {
        const clamp = (value, fallback) => {
            const hour = parseInt(value, 10);
            return Number.isFinite(hour) && hour >= 0 && hour <= 24 ? hour : fallback;
        };

        let start = clamp(rawStart, webexpress.webui.ScheduleCtrl.DEFAULT_HOUR_START);
        let end = clamp(rawEnd, webexpress.webui.ScheduleCtrl.DEFAULT_HOUR_END);

        if (end <= start) {
            start = webexpress.webui.ScheduleCtrl.DEFAULT_HOUR_START;
            end = webexpress.webui.ScheduleCtrl.DEFAULT_HOUR_END;
        }

        return [start, end];
    }

    /**
     * Builds the Intl formatters once, because constructing them per cell is by
     * far the most expensive part of rendering a month.
     */
    _buildFormatters() {
        const culture = this._culture;
        const make = (options) => {
            try {
                return new Intl.DateTimeFormat(culture, options);
            } catch (e) {
                // an unsupported culture tag must not take the whole control
                // down; the browser default still produces readable output
                return new Intl.DateTimeFormat(undefined, options);
            }
        };

        this._formats = {
            monthYear: make({ month: "long", year: "numeric" }),
            month: make({ month: "long" }),
            weekdayShort: make({ weekday: "short" }),
            weekdayLong: make({ weekday: "long" }),
            day: make({ day: "numeric" }),
            dayMonth: make({ day: "numeric", month: "short" }),
            full: make({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
            time: make({ hour: "2-digit", minute: "2-digit" })
        };
    }

    // -----------------------------------------------------------------------
    // model
    // -----------------------------------------------------------------------

    /**
     * Reads the model from the hidden descriptor children.
     * @param {HTMLElement} element - The host element.
     * @returns {{items: Array<object>, holidays: Array<object>}} The raw model.
     */
    _readFromDom(element) {
        const items = Array.from(element.querySelectorAll(".wx-schedule-item")).map((el) => ({
            id: el.id || "",
            title: el.dataset.title || "",
            start: el.dataset.start || "",
            end: el.dataset.end || "",
            allDay: el.dataset.allDay === "true",
            category: el.dataset.category || "",
            colorCss: el.dataset.colorCss || "",
            colorStyle: el.dataset.colorStyle || "",
            icon: el.dataset.icon || "",
            uri: el.dataset.uri || "",
            meta: this._parseMeta(el.dataset.meta)
        }));

        const holidays = Array.from(element.querySelectorAll(".wx-schedule-holiday")).map((el) => ({
            date: el.dataset.date || "",
            name: el.dataset.name || "",
            region: el.dataset.region || "",
            type: el.dataset.type || ""
        }));

        return { items: items, holidays: holidays };
    }

    /**
     * Parses the metadata object of an item, tolerating a malformed payload so
     * one bad entry cannot stop the schedule from rendering.
     * @param {string|undefined} raw - The JSON text.
     * @returns {object} The metadata.
     */
    _parseMeta(raw) {
        if (!raw) {
            return {};
        }
        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    /**
     * Completes a raw model into the shape the views read: every item carries a
     * parsed start and end, and the items are ordered chronologically so every
     * view can rely on the order instead of sorting again.
     * @param {object} model - The raw model.
     * @returns {{items: Array<object>, holidays: Array<object>}} The normalised model.
     */
    _normalizeModel(model) {
        model = model || {};

        const items = (Array.isArray(model.items) ? model.items : [])
            .map((item) => this._normalizeItem(item))
            .filter((item) => item !== null)
            .sort((a, b) => a.startDate - b.startDate || a.endDate - b.endDate);

        const holidays = (Array.isArray(model.holidays) ? model.holidays : [])
            .map((holiday) => this._normalizeHoliday(holiday))
            .filter((holiday) => holiday !== null);

        return { items: items, holidays: holidays };
    }

    /**
     * Completes a single item. An item without a usable start carries no
     * position in time and is dropped rather than placed at the epoch.
     * @param {object} item - The raw item.
     * @returns {object|null} The normalised item, or null when it cannot be placed.
     */
    _normalizeItem(item) {
        item = item || {};

        const startDate = this._parseDate(item.start);
        if (!startDate) {
            return null;
        }

        const allDay = item.allDay === true || item.allDay === "true";
        // an item without an end lasts until the end of the day it starts on,
        // which is what a point-in-time entry without a duration means
        let endDate = this._parseDate(item.end);
        if (!endDate || endDate < startDate) {
            endDate = allDay ? this._startOfDay(startDate) : startDate;
        }

        return {
            id: item.id != null ? String(item.id) : "",
            title: item.title || "",
            startDate: startDate,
            endDate: endDate,
            allDay: allDay,
            category: item.category || "",
            colorCss: item.colorCss || "",
            colorStyle: item.colorStyle || "",
            icon: item.icon || "",
            uri: item.uri || "",
            meta: item.meta && typeof item.meta === "object" ? item.meta : {}
        };
    }

    /**
     * Completes a single holiday. It is keyed by its bare date, never by a
     * point in time, so it stays on its day in every zone.
     * @param {object} holiday - The raw holiday.
     * @returns {object|null} The normalised holiday, or null without a date.
     */
    _normalizeHoliday(holiday) {
        holiday = holiday || {};

        const date = this._parseDate(holiday.date);
        if (!date) {
            return null;
        }

        return {
            key: this._dayKey(date),
            date: date,
            name: holiday.name || "",
            region: holiday.region || "",
            type: holiday.type || ""
        };
    }

    /**
     * Gets the current model.
     * @returns {{items: Array<object>, holidays: Array<object>}} The model.
     */
    get model() {
        return this._model;
    }

    /**
     * Replaces the model and re-renders.
     * @param {object} value - The new model with items and holidays.
     */
    set model(value) {
        this._model = this._normalizeModel(value);
        this.render();
    }

    /**
     * Gets the items of the model.
     * @returns {Array<object>} The items, chronologically ordered.
     */
    get value() {
        return this._model.items;
    }

    // -----------------------------------------------------------------------
    // calendar arithmetic
    // -----------------------------------------------------------------------

    /**
     * Parses a timestamp as local time. The bare and the full forms are handled
     * by one expression rather than by the Date constructor, whose treatment of
     * a date-only string as UTC would move an all-day item to the previous day
     * for every visitor west of Greenwich.
     * @param {string|Date} text - The timestamp.
     * @returns {Date|null} The parsed date, or null when it is unusable.
     */
    _parseDate(text) {
        // a date is recognised by its interface rather than by instanceof, so a
        // value handed in from another realm - an iframe, a module boundary -
        // is still accepted instead of being silently rejected
        if (text && typeof text.getTime === "function") {
            const time = text.getTime();
            return isNaN(time) ? null : new Date(time);
        }
        if (!text) {
            return null;
        }

        const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(String(text).trim());
        if (!match) {
            return null;
        }

        const date = new Date(
            Number(match[1]), Number(match[2]) - 1, Number(match[3]),
            Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0), 0);

        return isNaN(date.getTime()) ? null : date;
    }

    /**
     * Formats a date as the zone-free local timestamp the model exchanges.
     * toISOString is deliberately not used: it converts to UTC and would report
     * a moved item at the wrong hour, and possibly on the wrong day.
     * @param {Date} date - The date.
     * @param {boolean} [dateOnly=false] - Whether to emit the bare date.
     * @returns {string} The formatted timestamp.
     */
    _formatTimestamp(date, dateOnly = false) {
        const pad = (value, length = 2) => String(value).padStart(length, "0");
        const day = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

        return dateOnly ? day : `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    /**
     * Returns the day key a date belongs to.
     * @param {Date} date - The date.
     * @returns {string} The key in the form yyyy-mm-dd.
     */
    _dayKey(date) {
        return this._formatTimestamp(date, true);
    }

    /**
     * Returns midnight of the day a date belongs to.
     * @param {Date} date - The date.
     * @returns {Date} The start of the day.
     */
    _startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    /**
     * Adds a number of days to a date. The calendar fields are used rather than
     * millisecond arithmetic, so a daylight saving transition does not shift
     * the result to the previous or next day.
     * @param {Date} date - The date.
     * @param {number} days - The number of days, may be negative.
     * @returns {Date} The shifted date.
     */
    _addDays(date, days) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days,
            date.getHours(), date.getMinutes(), date.getSeconds());
    }

    /**
     * Returns the first day of the week a date belongs to, honouring the
     * configured week start.
     * @param {Date} date - The date.
     * @returns {Date} The start of the week.
     */
    _startOfWeek(date) {
        const day = this._startOfDay(date);
        const offset = (day.getDay() - this._weekStart + 7) % 7;

        return this._addDays(day, -offset);
    }

    /**
     * Computes the week number of a date. With ISO numbering, week one is the
     * week containing the first Thursday and the weeks are counted from Monday
     * regardless of the day the grid starts on - the two are separate
     * conventions and a region may well combine Sunday-first weeks with ISO
     * numbers. Without it, the weeks are counted from the first week start on
     * or after new year.
     * @param {Date} date - The date.
     * @returns {number} The week number.
     */
    _weekNumber(date) {
        if (this._isoWeek) {
            const target = this._startOfDay(date);
            // shift onto the Thursday of the ISO week, whose year decides the
            // year the whole week is counted in
            const isoDay = (target.getDay() + 6) % 7;
            const thursday = this._addDays(target, 3 - isoDay);
            const firstThursday = new Date(thursday.getFullYear(), 0, 4);
            const firstIsoDay = (firstThursday.getDay() + 6) % 7;
            const firstWeekThursday = this._addDays(firstThursday, 3 - firstIsoDay);

            return 1 + Math.round((thursday - firstWeekThursday) / (webexpress.webui.ScheduleCtrl.MS_PER_DAY * 7));
        }

        const weekStart = this._startOfWeek(date);
        const firstWeekStart = this._startOfWeek(new Date(weekStart.getFullYear(), 0, 1));
        const elapsed = Math.round((weekStart - firstWeekStart) / (webexpress.webui.ScheduleCtrl.MS_PER_DAY * 7));

        return elapsed + 1;
    }

    /**
     * Returns the weeks of the month grid a date belongs to, each a run of
     * seven days. The grid is padded to whole weeks on both ends, so the first
     * and the last row carry the neighbouring days rather than gaps.
     * @param {Date} anchor - A date in the month.
     * @returns {Array<Array<Date>>} The weeks.
     */
    _monthWeeks(anchor) {
        const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
        const weeks = [];

        for (let cursor = this._startOfWeek(first); cursor <= last; cursor = this._addDays(cursor, 7)) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                week.push(this._addDays(cursor, i));
            }
            weeks.push(week);
        }

        return weeks;
    }

    /**
     * Returns the period the current view shows, as the half-open range a data
     * source is queried with. The agenda reports the anchor month, so that
     * navigating it loads a bounded, predictable window even though it renders
     * every item the model holds.
     * @returns {{from: Date, to: Date}} The visible range.
     */
    range() {
        if (this._view === "week") {
            const from = this._startOfWeek(this._anchor);
            return { from: from, to: this._addDays(from, 7) };
        }

        const from = new Date(this._anchor.getFullYear(), this._anchor.getMonth(), 1);
        const to = new Date(this._anchor.getFullYear(), this._anchor.getMonth() + 1, 1);

        return { from: from, to: to };
    }

    // -----------------------------------------------------------------------
    // item queries
    // -----------------------------------------------------------------------

    /**
     * Determines whether an item covers a day.
     * @param {object} item - The item.
     * @param {Date} day - The day.
     * @returns {boolean} True when the item covers the day.
     */
    _coversDay(item, day) {
        const dayStart = this._startOfDay(day);
        const dayEnd = this._addDays(dayStart, 1);

        return item.startDate < dayEnd && item.endDate >= dayStart;
    }

    /**
     * Returns the items covering a day, in chronological order.
     * @param {Date} day - The day.
     * @returns {Array<object>} The items.
     */
    _itemsForDay(day) {
        return this._model.items.filter((item) => this._coversDay(item, day));
    }

    /**
     * Determines whether an item occupies a whole day lane rather than a slot
     * on the time axis: either because it is flagged all-day, or because it
     * reaches beyond the day it starts on.
     * @param {object} item - The item.
     * @returns {boolean} True when the item belongs in the all-day lane.
     */
    _isAllDayLane(item) {
        return item.allDay || this._dayKey(item.startDate) !== this._dayKey(item.endDate);
    }

    /**
     * Returns the holiday of a day, or null. A schedule with holidays switched
     * off never reports one, so the views need no second check.
     * @param {Date} day - The day.
     * @returns {object|null} The holiday.
     */
    _holidayFor(day) {
        if (!this._showHolidays) {
            return null;
        }
        const key = this._dayKey(day);

        return this._model.holidays.find((holiday) => holiday.key === key) || null;
    }

    /**
     * Determines whether a day falls on a weekend, derived from the culture
     * where the engine exposes it and from Saturday/Sunday otherwise.
     * @param {Date} day - The day.
     * @returns {boolean} True on a weekend day.
     */
    _isWeekend(day) {
        if (this._weekend === undefined) {
            this._weekend = null;
            try {
                const locale = new Intl.Locale(this._culture || undefined);
                const info = typeof locale.getWeekInfo === "function" ? locale.getWeekInfo() : locale.weekInfo;
                if (info && Array.isArray(info.weekend)) {
                    // Intl counts Monday as 1 and Sunday as 7
                    this._weekend = info.weekend.map((d) => d % 7);
                }
            } catch (e) {
                // fall through to the Saturday/Sunday default
            }
        }

        const days = this._weekend || [0, 6];

        return days.includes(day.getDay());
    }

    /**
     * Packs the multi-day and all-day items of a week into lanes, so that a bar
     * never overlaps another and every day of the week reserves the same number
     * of lanes. Without the packing the bars of a week would each start at the
     * top of their own cell and appear to jump between rows.
     * @param {Array<object>} items - The items to place.
     * @param {Array<Date>} week - The seven days of the week.
     * @returns {Array<object>} The segments: { item, from, to, lane, continuesLeft, continuesRight }.
     */
    _packLanes(items, week) {
        const weekStart = this._startOfDay(week[0]);
        const weekEnd = this._addDays(weekStart, 7);
        const lanes = [];
        const segments = [];

        for (const item of items) {
            const itemStart = this._startOfDay(item.startDate);
            const itemEnd = this._startOfDay(item.endDate);

            if (itemStart >= weekEnd || itemEnd < weekStart) {
                continue;
            }

            const from = Math.max(0, Math.round((itemStart - weekStart) / webexpress.webui.ScheduleCtrl.MS_PER_DAY));
            const to = Math.min(6, Math.round((itemEnd - weekStart) / webexpress.webui.ScheduleCtrl.MS_PER_DAY));

            // the first lane whose last occupied column lies before this segment
            let lane = lanes.findIndex((end) => end < from);
            if (lane === -1) {
                lane = lanes.length;
            }
            lanes[lane] = to;

            segments.push({
                item: item,
                from: from,
                to: to,
                lane: lane,
                continuesLeft: itemStart < weekStart,
                continuesRight: itemEnd >= weekEnd
            });
        }

        return segments;
    }

    /**
     * Assigns overlapping timed items to side-by-side columns, so that two
     * appointments at the same hour are both readable instead of hiding each
     * other. Items are clustered by overlap and every member of a cluster gets
     * the same number of columns, which keeps the cluster visually coherent.
     * @param {Array<object>} items - The timed items of one day, chronologically ordered.
     * @returns {Array<object>} The placements: { item, column, columns }.
     */
    _packColumns(items) {
        const placements = [];
        let cluster = [];
        let clusterEnd = null;

        const flush = () => {
            const columns = cluster.reduce((max, entry) => Math.max(max, entry.column + 1), 0);
            for (const entry of cluster) {
                placements.push({ item: entry.item, column: entry.column, columns: columns });
            }
            cluster = [];
            clusterEnd = null;
        };

        for (const item of items) {
            if (clusterEnd !== null && item.startDate >= clusterEnd) {
                flush();
            }

            // the lowest column that is free at this item's start
            const taken = cluster
                .filter((entry) => entry.item.endDate > item.startDate)
                .map((entry) => entry.column);
            let column = 0;
            while (taken.includes(column)) {
                column++;
            }

            cluster.push({ item: item, column: column });
            clusterEnd = clusterEnd === null || item.endDate > clusterEnd ? item.endDate : clusterEnd;
        }

        if (cluster.length > 0) {
            flush();
        }

        return placements;
    }

    // -----------------------------------------------------------------------
    // navigation
    // -----------------------------------------------------------------------

    /**
     * Gets the view the schedule currently shows.
     * @returns {string} The view.
     */
    get view() {
        return this._view;
    }

    /**
     * Switches the view and re-renders.
     * @param {string} value - The view: agenda, week or month.
     */
    set view(value) {
        if (!this._views.includes(value) || value === this._view) {
            return;
        }

        this._view = value;
        this.render();
        this._dispatchNavigation();
    }

    /**
     * Gets the date the schedule is anchored on.
     * @returns {Date} The anchor date.
     */
    get date() {
        return new Date(this._anchor.getTime());
    }

    /**
     * Moves the schedule onto a date and re-renders.
     * @param {Date|string} value - The date.
     */
    set date(value) {
        const parsed = this._parseDate(value);
        if (!parsed) {
            return;
        }

        this._anchor = this._startOfDay(parsed);
        this.render();
        this._dispatchNavigation();
    }

    /**
     * Steps to the next period of the current view.
     */
    next() {
        this._step(1);
    }

    /**
     * Steps to the previous period of the current view.
     */
    previous() {
        this._step(-1);
    }

    /**
     * Jumps to the current day.
     */
    today() {
        this.date = new Date();
    }

    /**
     * Steps the anchor by a number of periods of the current view.
     * @param {number} direction - The number of periods, may be negative.
     */
    _step(direction) {
        if (this._view === "week") {
            this._anchor = this._addDays(this._anchor, 7 * direction);
        } else {
            this._anchor = new Date(this._anchor.getFullYear(), this._anchor.getMonth() + direction, 1);
        }

        this.render();
        this._dispatchNavigation();
    }

    /**
     * Announces the period the schedule now shows, which is what lets a data
     * bound subclass load the matching items.
     */
    _dispatchNavigation() {
        const range = this.range();

        this._dispatch(webexpress.webui.Event.CHANGE_PAGE_EVENT, {
            view: this._view,
            date: this._formatTimestamp(this._anchor, true),
            from: this._formatTimestamp(range.from, true),
            to: this._formatTimestamp(range.to, true)
        });
    }

    // -----------------------------------------------------------------------
    // rendering
    // -----------------------------------------------------------------------

    /**
     * Renders the toolbar and the current view.
     */
    render() {
        if (this._destroyed) {
            return;
        }

        this._element.innerHTML = "";
        this._element.appendChild(this._renderToolbar());

        const body = this._create("div", "wx-schedule-body");
        body.appendChild(this._renderView());
        this._element.appendChild(body);

        this._dispatch(webexpress.webui.Event.UPDATED_EVENT, { view: this._view });
    }

    /**
     * Renders the view the schedule is currently switched to.
     * @returns {HTMLElement} The view element.
     */
    _renderView() {
        if (this._view === "agenda") {
            return this._renderAgenda();
        }
        if (this._view === "week") {
            return this._renderWeek();
        }

        return this._renderMonth();
    }

    /**
     * Builds the toolbar: the period navigation, the title, the optional mini
     * calendar and the view switcher.
     * @returns {HTMLElement} The toolbar.
     */
    _renderToolbar() {
        const toolbar = this._create("div", "wx-schedule-toolbar");

        const nav = this._create("div", "wx-schedule-nav");
        nav.appendChild(this._button("wx-schedule-prev", "‹",
            this._i18n("webexpress.webui:schedule.previous", "Previous"), () => this.previous()));
        // the modifier is deliberately not "wx-schedule-today": that class marks
        // the current day in the grid and would put its ring around the button
        nav.appendChild(this._button("wx-schedule-nav-today", this._i18n("webexpress.webui:schedule.today", "Today"),
            this._i18n("webexpress.webui:schedule.today", "Today"), () => this.today()));
        nav.appendChild(this._button("wx-schedule-next", "›",
            this._i18n("webexpress.webui:schedule.next", "Next"), () => this.next()));
        toolbar.appendChild(nav);

        const title = this._create("div", "wx-schedule-title");
        title.textContent = this._periodTitle();
        toolbar.appendChild(title);

        if (this._miniCalendar) {
            toolbar.appendChild(this._renderMiniCalendar());
        }

        if (this._views.length > 1) {
            const switcher = this._create("div", "wx-schedule-views");
            for (const view of this._views) {
                const button = this._button("wx-schedule-view-" + view,
                    this._i18n("webexpress.webui:schedule.view." + view, view),
                    null, () => { this.view = view; });
                if (view === this._view) {
                    button.classList.add("wx-schedule-view-active");
                    button.setAttribute("aria-pressed", "true");
                }
                switcher.appendChild(button);
            }
            toolbar.appendChild(switcher);
        }

        return toolbar;
    }

    /**
     * Builds the title of the period the current view shows.
     * @returns {string} The title.
     */
    _periodTitle() {
        if (this._view === "week") {
            const from = this._startOfWeek(this._anchor);
            const to = this._addDays(from, 6);
            const week = this._showWeekNumbers
                ? ` (${this._i18n("webexpress.webui:schedule.week_short", "W")}${this._weekNumber(from)})`
                : "";

            return `${this._formats.dayMonth.format(from)} – ${this._formats.dayMonth.format(to)}${week}`;
        }

        return this._formats.monthYear.format(this._anchor);
    }

    /**
     * Returns the mini calendar that jumps straight to a day rather than
     * stepping through the periods.
     *
     * It is built once and re-attached on every render rather than rebuilt: the
     * date control installs a popper, and recreating it per render would strand
     * one on every navigation.
     * @returns {HTMLElement} The mini calendar.
     */
    _renderMiniCalendar() {
        if (!this._mini) {
            this._mini = this._createMiniCalendar();
        }

        this._syncMiniCalendar();

        return this._mini;
    }

    /**
     * Builds the mini calendar from the framework date control, so the picker
     * offers the same calendar, formats and keyboard model as every other date
     * field. Where that control is not part of the bundle the row degrades to
     * the native picker rather than disappearing.
     * @returns {HTMLElement} The host element of the picker.
     */
    _createMiniCalendar() {
        const host = this._create("div", "wx-schedule-mini");
        host.setAttribute("aria-label", this._i18n("webexpress.webui:schedule.goto", "Go to date"));

        const registry = webexpress.webui.Controller && webexpress.webui.Controller.classRegistry;
        if (!registry || !registry.has("wx-webui-input-date")) {
            const input = document.createElement("input");
            input.type = "date";
            input.className = "wx-schedule-mini-input";
            input.addEventListener("change", () => {
                if (input.value) {
                    this.date = input.value;
                }
            });
            host.appendChild(input);
            this._miniInput = input;

            return host;
        }

        // the marker class is consumed by the controller on instantiation, so
        // the styling hook has to be a second class
        host.classList.add("wx-webui-input-date");
        webexpress.webui.Controller.createInstances(host);
        this._miniCtrl = typeof webexpress.webui.Controller.getInstanceByElement === "function"
            ? webexpress.webui.Controller.getInstanceByElement(host)
            : null;

        host.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
            // the picker's own change is an implementation detail of the
            // toolbar; letting it bubble would reach listeners that expect the
            // schedule's own item changes under the same name
            if (typeof e.stopPropagation === "function") {
                e.stopPropagation();
            }
            if (this._syncingMini || !this._miniCtrl) {
                return;
            }

            const picked = this._miniCtrl.value;
            if (picked) {
                this.date = picked;
            }
        });

        return host;
    }

    /**
     * Moves the picker onto the date the schedule is anchored on.
     * @remarks
     * Assigning the value dispatches a change, which without the guard would be
     * read back as a user pick and re-enter the navigation.
     */
    _syncMiniCalendar() {
        if (this._miniInput) {
            this._miniInput.value = this._dayKey(this._anchor);
            return;
        }
        if (!this._miniCtrl) {
            return;
        }

        this._syncingMini = true;
        try {
            this._miniCtrl.value = new Date(this._anchor.getTime());
        } finally {
            this._syncingMini = false;
        }
    }

    /**
     * Builds the month grid: a weekday header and one row per week, each with
     * seven day cells carrying the day number, the holiday, the continuous bars
     * of the multi-day entries and the chips of the single-day ones.
     * @returns {HTMLElement} The month view.
     */
    _renderMonth() {
        const view = this._create("div", "wx-schedule-month");
        const weeks = this._monthWeeks(this._anchor);
        const month = this._anchor.getMonth();

        view.appendChild(this._renderWeekdayHeader(weeks[0]));

        for (const week of weeks) {
            const row = this._create("div", "wx-schedule-week");

            if (this._showWeekNumbers) {
                const number = this._create("div", "wx-schedule-weeknumber");
                number.textContent = String(this._weekNumber(week[0]));
                row.appendChild(number);
            }

            const grid = this._create("div", "wx-schedule-daygrid");
            const laneItems = this._model.items.filter((item) => this._isAllDayLane(item));
            const segments = this._packLanes(laneItems, week);
            const laneCount = segments.reduce((max, segment) => Math.max(max, segment.lane + 1), 0);

            week.forEach((day, column) => {
                grid.appendChild(this._renderMonthDay(day, column, month, segments, laneCount));
            });

            row.appendChild(grid);
            view.appendChild(row);
        }

        return view;
    }

    /**
     * Builds a single day cell of the month grid.
     * @param {Date} day - The day.
     * @param {number} column - The column index inside the week.
     * @param {number} month - The month the grid is anchored on.
     * @param {Array<object>} segments - The lane segments of the week.
     * @param {number} laneCount - The number of lanes reserved in the week.
     * @returns {HTMLElement} The day cell.
     */
    _renderMonthDay(day, column, month, segments, laneCount) {
        const cell = this._create("div", "wx-schedule-day");
        const holiday = this._holidayFor(day);

        this._applyDayState(cell, day, holiday, month);
        cell.setAttribute("data-date", this._dayKey(day));

        const head = this._create("div", "wx-schedule-day-head");
        const number = this._create("span", "wx-schedule-day-number");
        number.textContent = this._formats.day.format(day);
        head.appendChild(number);

        if (holiday) {
            head.appendChild(this._renderHoliday(holiday));
        }
        cell.appendChild(head);

        // the lanes are rendered for every day, as a bar where a segment starts
        // and as a spacer everywhere else, so the chips below stay aligned
        const lanes = this._create("div", "wx-schedule-lanes");
        for (let lane = 0; lane < laneCount; lane++) {
            const segment = segments.find((s) => s.lane === lane && column >= s.from && column <= s.to);
            lanes.appendChild(segment && segment.from === column
                ? this._renderBar(segment)
                : this._create("div", "wx-schedule-lane-spacer"));
        }
        cell.appendChild(lanes);

        const list = this._create("div", "wx-schedule-day-items");
        const chips = this._itemsForDay(day).filter((item) => !this._isAllDayLane(item));
        const limit = webexpress.webui.ScheduleCtrl.MONTH_CHIP_LIMIT;

        chips.slice(0, limit).forEach((item) => list.appendChild(this._renderEntry(item, "chip", day)));

        if (chips.length > limit) {
            const more = this._create("button", "wx-schedule-more");
            more.type = "button";
            more.textContent = this._i18n("webexpress.webui:schedule.more", "+{0} more")
                .replace("{0}", String(chips.length - limit));
            more.addEventListener("click", () => {
                this._anchor = this._startOfDay(day);
                this.view = "week";
            });
            list.appendChild(more);
        }

        cell.appendChild(list);

        return cell;
    }

    /**
     * Builds the seven day grid, with the all-day lane above and either the
     * time axis or a plain stack below.
     * @returns {HTMLElement} The week view.
     */
    _renderWeek() {
        const view = this._create("div", "wx-schedule-week-view");
        const start = this._startOfWeek(this._anchor);
        const week = [];
        for (let i = 0; i < 7; i++) {
            week.push(this._addDays(start, i));
        }

        view.appendChild(this._renderWeekdayHeader(week, true));

        const laneItems = this._model.items.filter((item) => this._isAllDayLane(item));
        const segments = this._packLanes(laneItems, week);
        const laneCount = segments.reduce((max, segment) => Math.max(max, segment.lane + 1), 0);

        if (laneCount > 0) {
            view.appendChild(this._renderAllDayLane(week, segments, laneCount));
        }

        view.appendChild(this._timeAxis ? this._renderTimeGrid(week) : this._renderStack(week));

        return view;
    }

    /**
     * Builds the all-day lane of the week view.
     * @param {Array<Date>} week - The seven days.
     * @param {Array<object>} segments - The lane segments.
     * @param {number} laneCount - The number of lanes.
     * @returns {HTMLElement} The lane.
     */
    _renderAllDayLane(week, segments, laneCount) {
        const lane = this._create("div", "wx-schedule-allday");

        const label = this._create("div", "wx-schedule-allday-label");
        label.textContent = this._i18n("webexpress.webui:schedule.allday", "All day");
        lane.appendChild(label);

        const grid = this._create("div", "wx-schedule-daygrid");
        week.forEach((day, column) => {
            const cell = this._create("div", "wx-schedule-allday-cell");
            this._applyDayState(cell, day, this._holidayFor(day), day.getMonth());
            cell.setAttribute("data-date", this._dayKey(day));

            for (let index = 0; index < laneCount; index++) {
                const segment = segments.find((s) => s.lane === index && column >= s.from && column <= s.to);
                cell.appendChild(segment && segment.from === column
                    ? this._renderBar(segment)
                    : this._create("div", "wx-schedule-lane-spacer"));
            }

            grid.appendChild(cell);
        });
        lane.appendChild(grid);

        return lane;
    }

    /**
     * Builds the time grid: an hour axis and seven day columns on which the
     * timed items are placed by their hours and share the width where they
     * overlap.
     * @param {Array<Date>} week - The seven days.
     * @returns {HTMLElement} The time grid.
     */
    _renderTimeGrid(week) {
        const grid = this._create("div", "wx-schedule-timegrid");
        const hours = this._create("div", "wx-schedule-hours");

        for (let hour = this._hourStart; hour < this._hourEnd; hour++) {
            const label = this._create("div", "wx-schedule-hour");
            const sample = new Date(2000, 0, 1, hour, 0, 0);
            label.textContent = this._formats.time.format(sample);
            hours.appendChild(label);
        }
        grid.appendChild(hours);

        const columns = this._create("div", "wx-schedule-daygrid");
        for (const day of week) {
            columns.appendChild(this._renderDayColumn(day));
        }
        grid.appendChild(columns);

        return grid;
    }

    /**
     * Builds one day column of the time grid.
     * @param {Date} day - The day.
     * @returns {HTMLElement} The column.
     */
    _renderDayColumn(day) {
        const column = this._create("div", "wx-schedule-daycolumn");
        this._applyDayState(column, day, this._holidayFor(day), day.getMonth());
        column.setAttribute("data-date", this._dayKey(day));

        for (let hour = this._hourStart; hour < this._hourEnd; hour++) {
            const slot = this._create("div", "wx-schedule-slot");
            slot.setAttribute("data-hour", String(hour));
            slot.addEventListener("click", () => this._dispatch(webexpress.webui.Event.SELECT_ITEM_EVENT, {
                date: this._formatTimestamp(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour)),
                allDay: false
            }));
            column.appendChild(slot);
        }

        const timed = this._itemsForDay(day).filter((item) => !this._isAllDayLane(item));
        for (const placement of this._packColumns(timed)) {
            column.appendChild(this._renderTimedEntry(placement, day));
        }

        return column;
    }

    /**
     * Builds a timed entry, positioned on the axis by its hours and narrowed to
     * its share of the day where it overlaps others.
     * @param {object} placement - The placement: { item, column, columns }.
     * @param {Date} day - The day the entry is rendered on.
     * @returns {HTMLElement} The entry.
     */
    _renderTimedEntry(placement, day) {
        const entry = this._renderEntry(placement.item, "event", day);
        const dayStart = this._startOfDay(day);
        const axisStart = this._hourStart * 60;
        const axisLength = (this._hourEnd - this._hourStart) * 60;

        const minutes = (date) => (date - dayStart) / 60000;
        // an item reaching beyond the day or the axis is clipped to it, so it
        // stays inside the column it belongs to
        const from = Math.max(axisStart, Math.min(axisStart + axisLength, minutes(placement.item.startDate)));
        const to = Math.max(from, Math.min(axisStart + axisLength, minutes(placement.item.endDate)));

        entry.style.top = ((from - axisStart) / axisLength * 100).toFixed(4) + "%";
        entry.style.height = Math.max((to - from) / axisLength * 100, 1).toFixed(4) + "%";
        entry.style.left = (placement.column / placement.columns * 100).toFixed(4) + "%";
        entry.style.width = (100 / placement.columns).toFixed(4) + "%";

        return entry;
    }

    /**
     * Builds the plain seven day stack used when the time axis is off.
     * @param {Array<Date>} week - The seven days.
     * @returns {HTMLElement} The stack.
     */
    _renderStack(week) {
        const stack = this._create("div", "wx-schedule-stack");
        const grid = this._create("div", "wx-schedule-daygrid");

        for (const day of week) {
            const cell = this._create("div", "wx-schedule-day");
            this._applyDayState(cell, day, this._holidayFor(day), day.getMonth());
            cell.setAttribute("data-date", this._dayKey(day));

            for (const item of this._itemsForDay(day).filter((x) => !this._isAllDayLane(x))) {
                cell.appendChild(this._renderEntry(item, "chip", day));
            }

            grid.appendChild(cell);
        }

        stack.appendChild(grid);

        return stack;
    }

    /**
     * Builds the agenda: every item of the model in chronological order, under
     * a heading per day, week or month.
     * @returns {HTMLElement} The agenda view.
     */
    _renderAgenda() {
        const view = this._create("div", "wx-schedule-agenda");
        const items = this._model.items;

        if (items.length === 0) {
            const empty = this._create("div", "wx-schedule-empty");
            empty.textContent = this._i18n("webexpress.webui:schedule.empty", "No entries.");
            view.appendChild(empty);

            return view;
        }

        let currentKey = null;
        let group = null;

        for (const item of items) {
            const key = this._agendaGroupKey(item.startDate);
            if (key !== currentKey) {
                currentKey = key;
                group = this._create("div", "wx-schedule-agenda-group");

                const heading = this._create("div", "wx-schedule-agenda-heading");
                heading.textContent = this._agendaGroupTitle(item.startDate);

                const holiday = this._grouping === "day" ? this._holidayFor(item.startDate) : null;
                if (holiday) {
                    heading.appendChild(this._renderHoliday(holiday));
                }

                group.appendChild(heading);
                view.appendChild(group);
            }

            group.appendChild(this._renderEntry(item, "agenda", item.startDate));
        }

        return view;
    }

    /**
     * Returns the key that decides whether a date opens a new agenda group.
     * @param {Date} date - The date.
     * @returns {string} The group key.
     */
    _agendaGroupKey(date) {
        if (this._grouping === "month") {
            return `${date.getFullYear()}-${date.getMonth()}`;
        }
        if (this._grouping === "week") {
            return this._dayKey(this._startOfWeek(date));
        }

        return this._dayKey(date);
    }

    /**
     * Returns the heading of the agenda group a date belongs to.
     * @param {Date} date - The date.
     * @returns {string} The heading.
     */
    _agendaGroupTitle(date) {
        if (this._grouping === "month") {
            return this._formats.monthYear.format(date);
        }
        if (this._grouping === "week") {
            const start = this._startOfWeek(date);

            return `${this._i18n("webexpress.webui:schedule.week_short", "W")}${this._weekNumber(start)} `
                + `· ${this._formats.dayMonth.format(start)} – ${this._formats.dayMonth.format(this._addDays(start, 6))}`;
        }

        return this._formats.full.format(date);
    }

    // -----------------------------------------------------------------------
    // entry rendering
    // -----------------------------------------------------------------------

    /**
     * Builds the visual entry of an item, in the variant the current view asks
     * for. A configured item renderer is offered the item first and may return
     * null to fall back to the default markup, so a page can special-case a few
     * entries without reimplementing the rest.
     * @param {object} item - The item.
     * @param {string} variant - The variant: chip, event or agenda.
     * @param {Date} day - The day the entry is rendered on.
     * @returns {HTMLElement} The entry.
     */
    _renderEntry(item, variant, day) {
        let entry = null;

        if (typeof this.itemRenderer === "function") {
            entry = this.itemRenderer(item, { variant: variant, day: day, schedule: this }) || null;
        }

        if (!entry) {
            entry = this._create(item.uri ? "a" : "div", "wx-schedule-entry");
            if (item.uri) {
                entry.setAttribute("href", item.uri);
            }

            if (item.icon) {
                const icon = this._create("i", item.icon);
                entry.appendChild(icon);
            }

            if (variant !== "chip" || !item.allDay) {
                const time = this._create("span", "wx-schedule-entry-time");
                time.textContent = item.allDay
                    ? this._i18n("webexpress.webui:schedule.allday", "All day")
                    : this._formats.time.format(item.startDate);
                entry.appendChild(time);
            }

            const title = this._create("span", "wx-schedule-entry-title");
            title.textContent = item.title;
            entry.appendChild(title);
        }

        this._decorateEntry(entry, item, variant);

        return entry;
    }

    /**
     * Applies the shared identity, colouring, accessibility and interaction of
     * an entry, so a custom renderer only has to produce the visual body and
     * still takes part in selection, dragging and the events.
     * @param {HTMLElement} entry - The entry element.
     * @param {object} item - The item.
     * @param {string} variant - The variant.
     */
    _decorateEntry(entry, item, variant) {
        entry.classList.add("wx-schedule-entry", "wx-schedule-entry-" + variant);
        entry.setAttribute("data-item-id", item.id);
        entry.setAttribute("title", item.title);

        if (item.category) {
            entry.setAttribute("data-category", item.category);
        }
        if (item.colorCss) {
            for (const css of item.colorCss.split(/\s+/).filter(Boolean)) {
                entry.classList.add(css);
            }
        } else if (item.colorStyle) {
            entry.style.cssText += ";" + item.colorStyle;
        }

        entry.addEventListener("click", (e) => {
            if (typeof e.stopPropagation === "function") {
                e.stopPropagation();
            }
            this._dispatch(webexpress.webui.Event.CLICK_EVENT, { id: item.id, item: item, meta: item.meta });
        });

        entry.addEventListener("dblclick", (e) => {
            if (typeof e.stopPropagation === "function") {
                e.stopPropagation();
            }
            this._dispatch(webexpress.webui.Event.DOUBLE_CLICK_EVENT, { id: item.id, item: item, meta: item.meta });
        });

        if (this._editable) {
            entry.setAttribute("draggable", "true");
            entry.addEventListener("dragstart", (e) => this._onDragStart(e, item));
        }
    }

    /**
     * Builds the marker of a holiday. A configured holiday renderer is offered
     * the holiday first and may return null to fall back.
     * @param {object} holiday - The holiday.
     * @returns {HTMLElement} The marker.
     */
    _renderHoliday(holiday) {
        let marker = null;

        if (typeof this.holidayRenderer === "function") {
            marker = this.holidayRenderer(holiday, { schedule: this }) || null;
        }

        if (!marker) {
            marker = this._create("span", "wx-schedule-holiday-name");
            marker.textContent = holiday.name;
        }

        marker.classList.add("wx-schedule-holiday-name");
        marker.setAttribute("title", holiday.region ? `${holiday.name} (${holiday.region})` : holiday.name);
        if (holiday.type) {
            marker.setAttribute("data-type", holiday.type);
        }

        return marker;
    }

    /**
     * Builds a continuous bar for a multi-day or all-day segment, stretched
     * across the days it covers.
     * @param {object} segment - The segment.
     * @returns {HTMLElement} The bar.
     */
    _renderBar(segment) {
        const bar = this._renderEntry(segment.item, "bar", segment.item.startDate);
        const span = segment.to - segment.from + 1;

        // the bar lives in the cell it starts in and reaches across the
        // following ones, so the gaps between the cells have to be added back
        bar.style.width = `calc(${span * 100}% + ${span - 1} * var(--wx-schedule-gap, 1px))`;

        if (segment.continuesLeft) {
            bar.classList.add("wx-schedule-bar-continues-left");
        }
        if (segment.continuesRight) {
            bar.classList.add("wx-schedule-bar-continues-right");
        }

        return bar;
    }

    /**
     * Builds the weekday header of the month and week grids.
     * @param {Array<Date>} week - A representative week.
     * @param {boolean} [withDates=false] - Whether the header carries the day numbers.
     * @returns {HTMLElement} The header.
     */
    _renderWeekdayHeader(week, withDates = false) {
        const header = this._create("div", "wx-schedule-head");

        if (this._showWeekNumbers) {
            header.appendChild(this._create("div", "wx-schedule-corner"));
        }

        const grid = this._create("div", "wx-schedule-daygrid");
        for (const day of week) {
            const cell = this._create("div", "wx-schedule-weekday");
            cell.textContent = this._formats.weekdayShort.format(day);
            cell.setAttribute("title", this._formats.weekdayLong.format(day));

            if (this._isWeekend(day)) {
                cell.classList.add("wx-schedule-weekend");
            }
            if (withDates) {
                const number = this._create("span", "wx-schedule-weekday-date");
                number.textContent = this._formats.day.format(day);
                cell.appendChild(number);

                if (this._isToday(day)) {
                    cell.classList.add("wx-schedule-today");
                }
            }

            grid.appendChild(cell);
        }
        header.appendChild(grid);

        return header;
    }

    /**
     * Applies the state classes of a day to a cell: the neighbouring month, the
     * weekend, the current day and the holiday, which are the four distinctions
     * the stylesheet colours a cell by.
     * @param {HTMLElement} cell - The cell.
     * @param {Date} day - The day.
     * @param {object|null} holiday - The holiday of the day, if any.
     * @param {number} month - The month the view is anchored on.
     */
    _applyDayState(cell, day, holiday, month) {
        if (day.getMonth() !== month) {
            cell.classList.add("wx-schedule-othermonth");
        }
        if (this._isWeekend(day)) {
            cell.classList.add("wx-schedule-weekend");
        }
        if (this._isToday(day)) {
            cell.classList.add("wx-schedule-today");
        }
        if (holiday) {
            cell.classList.add("wx-schedule-isholiday");
            if (holiday.type) {
                cell.classList.add("wx-schedule-isholiday-" + holiday.type);
            }
        }

        cell.addEventListener("click", () => this._dispatch(webexpress.webui.Event.SELECT_ITEM_EVENT, {
            date: this._dayKey(day),
            allDay: true
        }));
    }

    /**
     * Determines whether a day is the current one.
     * @param {Date} day - The day.
     * @returns {boolean} True on today.
     */
    _isToday(day) {
        return this._dayKey(day) === this._dayKey(new Date());
    }

    // -----------------------------------------------------------------------
    // interaction
    // -----------------------------------------------------------------------

    /**
     * Starts a drag, remembering the item and the grab offset so the drop can
     * keep the time of day of a timed item while changing its day.
     * @param {object} e - The drag event.
     * @param {object} item - The item being dragged.
     */
    _onDragStart(e, item) {
        this._drag = { item: item };

        if (e.dataTransfer && typeof e.dataTransfer.setData === "function") {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", item.id);
        }

        const onDrop = (event) => this._onDrop(event);
        const onOver = (event) => {
            if (typeof event.preventDefault === "function") {
                event.preventDefault();
            }
        };

        this._addWindowListener("dragover", onOver);
        this._addWindowListener("drop", onDrop);
        this._addWindowListener("dragend", () => this._endDrag());
    }

    /**
     * Completes a drag: the day comes from the cell the pointer was released
     * on, the time of day is preserved and the duration is kept, so a move
     * never silently changes how long an item lasts.
     * @param {object} e - The drop event.
     */
    _onDrop(e) {
        const drag = this._drag;
        if (!drag) {
            return;
        }
        if (typeof e.preventDefault === "function") {
            e.preventDefault();
        }

        const cell = e.target && typeof e.target.closest === "function"
            ? e.target.closest("[data-date]")
            : null;
        const target = cell ? this._parseDate(cell.getAttribute("data-date")) : null;

        this._endDrag();

        if (!target) {
            return;
        }

        const item = drag.item;
        const offset = Math.round((this._startOfDay(target) - this._startOfDay(item.startDate))
            / webexpress.webui.ScheduleCtrl.MS_PER_DAY);
        if (offset === 0) {
            return;
        }

        this.moveItem(item.id, this._addDays(item.startDate, offset), this._addDays(item.endDate, offset));
    }

    /**
     * Releases the transient listeners of a drag gesture.
     */
    _endDrag() {
        this._drag = null;
        this._releaseWindowListeners();
    }

    /**
     * Moves an item to a new period, re-renders and announces the move. It is
     * the single place a move is applied, so a drag and a programmatic move
     * behave identically and a data bound subclass has one event to persist.
     * @param {string} id - The item id.
     * @param {Date|string} start - The new start.
     * @param {Date|string} end - The new end.
     * @returns {boolean} True when the item was found and moved.
     */
    moveItem(id, start, end) {
        const item = this._model.items.find((x) => x.id === id);
        const startDate = this._parseDate(start);
        if (!item || !startDate) {
            return false;
        }

        const endDate = this._parseDate(end) || startDate;

        item.startDate = startDate;
        item.endDate = endDate < startDate ? startDate : endDate;
        this._model.items.sort((a, b) => a.startDate - b.startDate || a.endDate - b.endDate);

        this.render();
        this._dispatch(webexpress.webui.Event.MOVE_EVENT, {
            id: item.id,
            item: item,
            start: this._formatTimestamp(item.startDate, item.allDay),
            end: this._formatTimestamp(item.endDate, item.allDay),
            allDay: item.allDay
        });

        return true;
    }

    // -----------------------------------------------------------------------
    // helpers and teardown
    // -----------------------------------------------------------------------

    /**
     * Creates an element with a class, the single allocation site of the view.
     * @param {string} tag - The tag name.
     * @param {string} className - The css class.
     * @returns {HTMLElement} The element.
     */
    _create(tag, className) {
        const element = document.createElement(tag);
        element.className = className;

        return element;
    }

    /**
     * Creates a toolbar button.
     * @param {string} className - The css class.
     * @param {string} text - The button text.
     * @param {string|null} label - The accessible name, when it differs from the text.
     * @param {Function} handler - The click handler.
     * @returns {HTMLElement} The button.
     */
    _button(className, text, label, handler) {
        const button = this._create("button", "wx-schedule-btn " + className);
        button.type = "button";
        button.textContent = text;
        if (label) {
            button.setAttribute("aria-label", label);
        }
        button.addEventListener("click", handler);

        return button;
    }

    /**
     * Registers a window listener and records it, so that a teardown in the
     * middle of a drag cannot strand it on the window.
     * @param {string} type - The event type.
     * @param {Function} handler - The handler.
     */
    _addWindowListener(type, handler) {
        window.addEventListener(type, handler);
        this._windowListeners.push({ type: type, handler: handler });
    }

    /**
     * Removes every recorded window listener.
     */
    _releaseWindowListeners() {
        for (const entry of this._windowListeners) {
            window.removeEventListener(entry.type, entry.handler);
        }
        this._windowListeners = [];
    }

    /**
     * Releases everything the control installed outside its own subtree and
     * empties the host.
     */
    destroy() {
        this._destroyed = true;
        this._drag = null;
        this._releaseWindowListeners();

        // the picker outlives a single render, so it is released here rather
        // than with the toolbar it happens to sit in
        if (this._miniCtrl && typeof this._miniCtrl.destroy === "function") {
            this._miniCtrl.destroy();
        }
        this._miniCtrl = null;
        this._miniInput = null;
        this._mini = null;

        this._element.innerHTML = "";

        super.destroy();
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-schedule", webexpress.webui.ScheduleCtrl);
