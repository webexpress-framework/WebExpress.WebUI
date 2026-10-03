/**
 * Headless unit tests for the schedule control. They cover the calendar
 * arithmetic (week start, ISO week numbers, month grid), the three views and
 * their layout decisions (multi-day bars and their lane alignment, the time
 * axis placement and the overlap columns, the agenda grouping), the holiday
 * marking, the navigation with its range reporting, the move and the custom
 * renderers - all through the public surface of the control.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, webuiAsset } from "./harness.mjs";

/**
 * Loads a runtime with the schedule control and the shipped dictionaries, so
 * the assertions on the toolbar and the placeholders run against the real
 * translations rather than against the key fallbacks.
 * @param {string} [language="de"] - The language the runtime translates into.
 * @returns {object} The loaded runtime.
 */
function load(language = "de") {
    const runtime = loadWebUi({
        browser: true,
        extraFiles: [
            // the mini calendar is the framework date control, so it has to be
            // registered before a schedule that renders one is constructed
            webuiAsset("webexpress.webui.input.date.js"),
            webuiAsset("webexpress.webui.schedule.js"),
            webuiAsset("i18n/en.js"),
            webuiAsset("i18n/de.js")
        ]
    });
    runtime.wx.I18N.setLanguage(language);

    return runtime;
}

/**
 * Builds a configured host with its item and holiday descriptors and constructs
 * the control on it. The descriptors carry their values on the dataset, which
 * is what the browser produces from the data attributes the C# control emits.
 * @param {object} runtime - The loaded runtime.
 * @param {object} config - The host data attributes.
 * @param {Array<object>} [items] - The item descriptors.
 * @param {Array<object>} [holidays] - The holiday descriptors.
 * @returns {{ctrl: object, host: object}} The control and its host.
 */
function build(runtime, config, items = [], holidays = []) {
    const host = runtime.document.createElement("div");
    Object.assign(host.dataset, config || {});

    for (const item of items) {
        const el = runtime.document.createElement("div");
        el.className = "wx-schedule-item";
        el.id = item.id || "";
        Object.assign(el.dataset, item);
        host.appendChild(el);
    }

    for (const holiday of holidays) {
        const el = runtime.document.createElement("div");
        el.className = "wx-schedule-holiday";
        Object.assign(el.dataset, holiday);
        host.appendChild(el);
    }

    runtime.document.body.appendChild(host);

    return { ctrl: new runtime.wx.ScheduleCtrl(host), host };
}

// August 2026 starts on a Saturday, which makes the padding of the month grid
// visible on both ends regardless of the week start
const AUGUST = { date: "2026-08-15", culture: "de-DE" };

test("the month grid pads to whole weeks and marks the neighbouring days", () => {
    const { ctrl, host } = build(load(), AUGUST);

    const days = host.querySelectorAll(".wx-schedule-day");
    assert.equal(days.length % 7, 0, "the grid is made of whole weeks");
    assert.equal(days.length, 42, "August 2026 spans six Monday-first weeks");

    // the German culture starts the week on Monday, so the grid opens on the
    // Monday before the first of the month
    assert.equal(days[0].getAttribute("data-date"), "2026-07-27");
    assert.ok(days[0].classList.contains("wx-schedule-othermonth"));
    assert.equal(days[5].getAttribute("data-date"), "2026-08-01");
    assert.equal(days[5].classList.contains("wx-schedule-othermonth"), false);
    assert.ok(days[5].classList.contains("wx-schedule-weekend"), "the first is a Saturday");

    assert.equal(ctrl.view, "month");
});

test("the week start follows the explicit configuration over the culture", () => {
    const { host } = build(load(), { ...AUGUST, weekStart: "0" });

    // Sunday-first shifts the grid one day earlier
    assert.equal(host.querySelectorAll(".wx-schedule-day")[0].getAttribute("data-date"), "2026-07-26");
});

test("ISO week numbers count the week of the first Thursday", () => {
    const runtime = load();
    const { ctrl } = build(runtime, { date: "2026-01-04", culture: "de-DE", isoWeek: "true", weekNumbers: "true" });

    // 1 January 2026 is a Thursday, so its week is ISO week 1 and 4 January,
    // the Sunday of that week, is still week 1
    assert.equal(ctrl._weekNumber(new Date(2026, 0, 1)), 1);
    assert.equal(ctrl._weekNumber(new Date(2026, 0, 4)), 1);
    assert.equal(ctrl._weekNumber(new Date(2026, 0, 5)), 2);
    // 2027 begins on a Friday, whose week belongs to 2026 and is its week 53
    assert.equal(ctrl._weekNumber(new Date(2027, 0, 1)), 53);
});

test("the week number column is rendered only when it is asked for", () => {
    const withNumbers = build(load(), { ...AUGUST, weekNumbers: "true" });
    const without = build(load(), AUGUST);

    assert.equal(withNumbers.host.querySelectorAll(".wx-schedule-weeknumber").length, 6);
    assert.equal(without.host.querySelectorAll(".wx-schedule-weeknumber").length, 0);
});

test("a multi-day item becomes one bar per week, spanning the days it covers", () => {
    const { host } = build(load(), AUGUST, [
        { id: "trip", title: "Voyage", start: "2026-08-05T00:00:00", end: "2026-08-09T00:00:00", allDay: "true" }
    ]);

    const bars = host.querySelectorAll(".wx-schedule-entry-bar");
    assert.equal(bars.length, 1, "the run stays inside one week and needs one bar");
    // Wednesday to Sunday is five columns of a Monday-first week
    assert.equal(bars[0].style.width, "calc(500% + 4 * var(--wx-schedule-gap, 1px))");
    assert.equal(bars[0].classList.contains("wx-schedule-bar-continues-left"), false);
    assert.equal(bars[0].classList.contains("wx-schedule-bar-continues-right"), false);
});

test("a run crossing the week boundary is cut square on the sides it continues", () => {
    const { host } = build(load(), AUGUST, [
        { id: "trip", title: "Voyage", start: "2026-08-07T00:00:00", end: "2026-08-11T00:00:00", allDay: "true" }
    ]);

    const bars = host.querySelectorAll(".wx-schedule-entry-bar");
    assert.equal(bars.length, 2, "the run is drawn once per week");
    assert.ok(bars[0].classList.contains("wx-schedule-bar-continues-right"));
    assert.equal(bars[0].classList.contains("wx-schedule-bar-continues-left"), false);
    assert.ok(bars[1].classList.contains("wx-schedule-bar-continues-left"));
});

test("every day of a week reserves the same lanes, so the chips below stay aligned", () => {
    const { host } = build(load(), AUGUST, [
        { id: "a", title: "A", start: "2026-08-03T00:00:00", end: "2026-08-04T00:00:00", allDay: "true" },
        { id: "b", title: "B", start: "2026-08-05T00:00:00", end: "2026-08-06T00:00:00", allDay: "true" },
        { id: "c", title: "C", start: "2026-08-03T00:00:00", end: "2026-08-07T00:00:00", allDay: "true" }
    ]);

    // the week of 3 August: A and B share a lane because they do not overlap,
    // C needs a second one, so every day of that week reserves two slots
    const week = host.querySelectorAll(".wx-schedule-week")[1];
    const cells = week.querySelectorAll(".wx-schedule-day");
    for (const cell of cells) {
        const lanes = cell.querySelectorAll(".wx-schedule-lanes")[0];
        assert.equal(lanes.children.length, 2, `day ${cell.getAttribute("data-date")} reserves both lanes`);
    }
});

test("a day collapses the chips beyond the limit into a counter", () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
        items.push({ id: "e" + i, title: "E" + i, start: `2026-08-12T0${i + 8}:00:00`, end: `2026-08-12T0${i + 9}:00:00` });
    }
    const { host } = build(load(), AUGUST, items);

    const day = host.querySelectorAll("[data-date='2026-08-12']")[0];
    assert.equal(day.querySelectorAll(".wx-schedule-entry-chip").length, 3);
    assert.equal(day.querySelectorAll(".wx-schedule-more").length, 1);
    assert.equal(day.querySelectorAll(".wx-schedule-more")[0].textContent, "+2 weitere");
});

test("the week view places a timed item on the axis by its hours", () => {
    const { host } = build(load(), { date: "2026-08-12", culture: "de-DE", view: "week", hourStart: "8", hourEnd: "20" }, [
        { id: "m", title: "Meeting", start: "2026-08-12T10:00:00", end: "2026-08-12T11:00:00" }
    ]);

    const events = host.querySelectorAll(".wx-schedule-entry-event");
    assert.equal(events.length, 1);
    // the axis spans 12 hours from 08:00, so 10:00 sits one sixth down and the
    // hour lasts one twelfth of the height
    assert.equal(events[0].style.top, "16.6667%");
    assert.equal(events[0].style.height, "8.3333%");
    assert.equal(events[0].style.left, "0.0000%");
    assert.equal(events[0].style.width, "100.0000%");

    assert.equal(host.querySelectorAll(".wx-schedule-hour").length, 12);
});

test("overlapping timed items share the width of their day", () => {
    const { host } = build(load(), { date: "2026-08-12", culture: "de-DE", view: "week", hourStart: "8", hourEnd: "20" }, [
        { id: "a", title: "A", start: "2026-08-12T10:00:00", end: "2026-08-12T12:00:00" },
        { id: "b", title: "B", start: "2026-08-12T11:00:00", end: "2026-08-12T13:00:00" },
        { id: "c", title: "C", start: "2026-08-12T15:00:00", end: "2026-08-12T16:00:00" }
    ]);

    const events = host.querySelectorAll(".wx-schedule-entry-event");
    assert.equal(events.length, 3);
    assert.equal(events[0].style.width, "50.0000%", "A shares its cluster with B");
    assert.equal(events[1].style.left, "50.0000%", "B is placed in the second column");
    assert.equal(events[2].style.width, "100.0000%", "C overlaps nothing and keeps the full width");
});

test("an item reaching past the axis is clipped to it", () => {
    const { host } = build(load(), { date: "2026-08-12", culture: "de-DE", view: "week", hourStart: "8", hourEnd: "20" }, [
        { id: "night", title: "Night shift", start: "2026-08-12T06:00:00", end: "2026-08-12T23:00:00" }
    ]);

    const event = host.querySelectorAll(".wx-schedule-entry-event")[0];
    assert.equal(event.style.top, "0.0000%");
    assert.equal(event.style.height, "100.0000%");
});

test("the week view stacks the items when the time axis is off", () => {
    const { host } = build(load(), { date: "2026-08-12", culture: "de-DE", view: "week", timeAxis: "false" }, [
        { id: "m", title: "Meeting", start: "2026-08-12T10:00:00", end: "2026-08-12T11:00:00" }
    ]);

    assert.equal(host.querySelectorAll(".wx-schedule-timegrid").length, 0);
    assert.equal(host.querySelectorAll(".wx-schedule-stack").length, 1);
    assert.equal(host.querySelectorAll(".wx-schedule-entry-chip").length, 1);
});

test("an all-day item goes into the all-day lane rather than onto the axis", () => {
    const { host } = build(load(), { date: "2026-08-12", culture: "de-DE", view: "week" }, [
        { id: "h", title: "Holiday", start: "2026-08-12T00:00:00", end: "2026-08-12T00:00:00", allDay: "true" }
    ]);

    assert.equal(host.querySelectorAll(".wx-schedule-allday").length, 1);
    assert.equal(host.querySelectorAll(".wx-schedule-entry-event").length, 0);
    assert.equal(host.querySelectorAll(".wx-schedule-allday .wx-schedule-entry-bar").length, 1);
});

test("the agenda groups the items by the configured unit", () => {
    const items = [
        { id: "a", title: "A", start: "2026-08-03T09:00:00", end: "2026-08-03T10:00:00" },
        { id: "b", title: "B", start: "2026-08-03T11:00:00", end: "2026-08-03T12:00:00" },
        { id: "c", title: "C", start: "2026-08-20T09:00:00", end: "2026-08-20T10:00:00" },
        { id: "d", title: "D", start: "2026-09-01T09:00:00", end: "2026-09-01T10:00:00" }
    ];

    const byDay = build(load(), { ...AUGUST, view: "agenda", agendaGrouping: "day" }, items);
    assert.equal(byDay.host.querySelectorAll(".wx-schedule-agenda-group").length, 3);

    const byWeek = build(load(), { ...AUGUST, view: "agenda", agendaGrouping: "week" }, items);
    assert.equal(byWeek.host.querySelectorAll(".wx-schedule-agenda-group").length, 3);

    const byMonth = build(load(), { ...AUGUST, view: "agenda", agendaGrouping: "month" }, items);
    assert.equal(byMonth.host.querySelectorAll(".wx-schedule-agenda-group").length, 2);
    assert.equal(byMonth.host.querySelectorAll(".wx-schedule-entry-agenda").length, 4);
});

test("an empty agenda says so rather than rendering nothing", () => {
    const { host } = build(load(), { ...AUGUST, view: "agenda" });

    assert.equal(host.querySelectorAll(".wx-schedule-empty").length, 1);
    assert.equal(host.querySelectorAll(".wx-schedule-empty")[0].textContent, "Keine Einträge.");
});

test("a holiday marks its day and is named, unless holidays are switched off", () => {
    const holidays = [{ date: "2026-08-15", name: "Mariä Himmelfahrt", region: "BY", type: "public" }];

    const shown = build(load(), AUGUST, [], holidays);
    const day = shown.host.querySelectorAll("[data-date='2026-08-15']")[0];
    assert.ok(day.classList.contains("wx-schedule-isholiday"));
    assert.ok(day.classList.contains("wx-schedule-isholiday-public"));
    const name = day.querySelectorAll(".wx-schedule-holiday-name")[0];
    assert.equal(name.textContent, "Mariä Himmelfahrt");
    assert.equal(name.getAttribute("title"), "Mariä Himmelfahrt (BY)");

    const hidden = build(load(), { ...AUGUST, showHolidays: "false" }, [], holidays);
    assert.equal(hidden.host.querySelectorAll(".wx-schedule-holiday-name").length, 0);
    assert.equal(hidden.host.querySelectorAll(".wx-schedule-isholiday").length, 0);
});

test("navigation steps by the period of the current view and reports the range", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, AUGUST);

    const pages = [];
    host.addEventListener(runtime.wx.Event.CHANGE_PAGE_EVENT, (e) => pages.push(e.detail));

    ctrl.next();
    assert.deepEqual(
        { from: pages[0].from, to: pages[0].to, view: pages[0].view },
        { from: "2026-09-01", to: "2026-10-01", view: "month" });

    ctrl.previous();
    ctrl.previous();
    assert.equal(pages[2].from, "2026-07-01");

    // the week view steps by seven days and reports the week it shows
    ctrl.view = "week";
    assert.equal(pages[3].view, "week");
    ctrl.next();
    const range = ctrl.range();
    assert.equal(Math.round((range.to - range.from) / 86400000), 7);
});

test("moving an item keeps its duration and announces local timestamps", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, AUGUST, [
        { id: "m", title: "Meeting", start: "2026-08-12T10:00:00", end: "2026-08-12T11:30:00" }
    ]);

    const moves = [];
    host.addEventListener(runtime.wx.Event.MOVE_EVENT, (e) => moves.push(e.detail));

    assert.equal(ctrl.moveItem("m", new Date(2026, 7, 14, 10, 0), new Date(2026, 7, 14, 11, 30)), true);
    assert.equal(moves.length, 1);
    assert.equal(moves[0].start, "2026-08-14T10:00:00");
    assert.equal(moves[0].end, "2026-08-14T11:30:00");

    // an unknown id is reported rather than silently creating an entry
    assert.equal(ctrl.moveItem("nope", new Date()), false);
    assert.equal(moves.length, 1);
});

test("an all-day move is announced as a bare date", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, AUGUST, [
        { id: "t", title: "Trip", start: "2026-08-12T00:00:00", end: "2026-08-13T00:00:00", allDay: "true" }
    ]);

    const moves = [];
    host.addEventListener(runtime.wx.Event.MOVE_EVENT, (e) => moves.push(e.detail));

    ctrl.moveItem("t", new Date(2026, 7, 19), new Date(2026, 7, 20));
    assert.equal(moves[0].start, "2026-08-19");
    assert.equal(moves[0].end, "2026-08-20");
    assert.equal(moves[0].allDay, true);
});

test("clicking an item reports it with its metadata", () => {
    const runtime = load();
    const { host } = build(runtime, AUGUST, [
        { id: "m", title: "Meeting", start: "2026-08-12T10:00:00", end: "2026-08-12T11:00:00", meta: '{"room":"Scumm Bar"}' }
    ]);

    const clicks = [];
    host.addEventListener(runtime.wx.Event.CLICK_EVENT, (e) => clicks.push(e.detail));

    host.querySelectorAll(".wx-schedule-entry-chip")[0].dispatchEvent({ type: "click", target: null });

    assert.equal(clicks.length, 1);
    assert.equal(clicks[0].id, "m");
    assert.deepEqual(clicks[0].meta, { room: "Scumm Bar" });
});

test("the model can be replaced programmatically and drops unplaceable items", () => {
    const runtime = load();
    const { ctrl } = build(runtime, AUGUST);

    ctrl.model = {
        items: [
            { id: "a", title: "A", start: "2026-08-04T09:00:00", end: "2026-08-04T10:00:00" },
            { id: "broken", title: "No start" }
        ],
        holidays: [{ date: "2026-08-15", name: "Feiertag" }]
    };

    assert.deepEqual(ctrl.value.map((i) => i.id), ["a"]);
    assert.equal(ctrl.model.holidays.length, 1);
});

test("an item without an end lasts to the end of its start day", () => {
    const runtime = load();
    const { ctrl } = build(runtime, AUGUST, [
        { id: "p", title: "Point", start: "2026-08-12T10:00:00" }
    ]);

    const item = ctrl.value[0];
    assert.equal(item.endDate.getTime(), item.startDate.getTime());
    // it still shows on its day rather than disappearing
    assert.equal(ctrl._itemsForDay(new Date(2026, 7, 12)).length, 1);
});

test("a custom item renderer replaces the entry body and keeps the interaction", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, AUGUST, [
        { id: "m", title: "Meeting", start: "2026-08-12T10:00:00", end: "2026-08-12T11:00:00" }
    ]);

    ctrl.itemRenderer = (item, context) => {
        const el = runtime.document.createElement("span");
        el.className = "custom-entry";
        el.textContent = `${context.variant}:${item.title}`;
        return el;
    };
    ctrl.render();

    const custom = host.querySelectorAll(".custom-entry");
    assert.equal(custom.length, 1);
    assert.equal(custom[0].textContent, "chip:Meeting");
    // the shared decoration still applies, so the entry stays clickable
    assert.equal(custom[0].getAttribute("data-item-id"), "m");
    assert.ok(custom[0].classList.contains("wx-schedule-entry"));
});

test("a custom holiday renderer replaces the marker", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, AUGUST, [], [
        { date: "2026-08-15", name: "Mariä Himmelfahrt", type: "public" }
    ]);

    ctrl.holidayRenderer = (holiday) => {
        const el = runtime.document.createElement("span");
        el.className = "custom-holiday";
        el.textContent = holiday.name.toUpperCase();
        return el;
    };
    ctrl.render();

    assert.equal(host.querySelectorAll(".custom-holiday").length, 1);
    assert.equal(host.querySelectorAll(".custom-holiday")[0].textContent, "MARIÄ HIMMELFAHRT");
});

test("the view switcher offers only the configured views", () => {
    const { ctrl, host } = build(load(), { ...AUGUST, views: "week,agenda" });

    assert.equal(host.querySelectorAll(".wx-schedule-views")[0].children.length, 2);
    // the requested month view is not offered, so the control opens on the first
    // view that is
    assert.equal(ctrl.view, "week");

    ctrl.view = "month";
    assert.equal(ctrl.view, "week", "switching to a view that is not offered is refused");
});

test("an inverted time axis falls back to the whole day", () => {
    const { ctrl } = build(load(), { ...AUGUST, view: "week", hourStart: "18", hourEnd: "9" });

    assert.equal(ctrl._hourStart, 0);
    assert.equal(ctrl._hourEnd, 24);
});

test("the toolbar buttons carry no state class of the grid", () => {
    const runtime = load();
    const { host } = build(runtime, AUGUST);

    const toolbar = host.querySelectorAll(".wx-schedule-toolbar")[0];
    const today = toolbar.querySelectorAll(".wx-schedule-nav-today")[0];

    assert.ok(today, "the toolbar carries the today button");
    // wx-schedule-today rings the current day in the grid; a button wearing it
    // would show that ring permanently
    assert.equal(today.classList.contains("wx-schedule-today"), false);
    assert.equal(toolbar.querySelectorAll(".wx-schedule-today").length, 0);

    // and it is styled like the view buttons beside it
    for (const button of [today, toolbar.querySelectorAll(".wx-schedule-view-week")[0]]) {
        assert.ok(button.classList.contains("wx-schedule-btn"));
    }
});

test("the mini calendar is the framework date control", () => {
    const runtime = load();
    const { host } = build(runtime, { ...AUGUST, miniCalendar: "true" });

    const mini = host.querySelectorAll(".wx-schedule-mini")[0];
    assert.ok(mini, "the toolbar carries the picker");

    const picker = runtime.wx.Controller.getInstanceByElement(mini);
    assert.ok(picker instanceof runtime.wx.InputDateCtrl, "the picker is an InputDateCtrl");
    // it opens on the day the schedule is anchored on
    assert.equal(runtime.wx.Controller.instanceMap.has(mini), true);
    assert.equal(picker.value.getFullYear(), 2026);
    assert.equal(picker.value.getMonth(), 7);
    assert.equal(picker.value.getDate(), 15);

    // no picker is built unless it was asked for
    const without = build(runtime, AUGUST);
    assert.equal(without.host.querySelectorAll(".wx-schedule-mini").length, 0);
});

test("picking a date in the mini calendar moves the schedule", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { ...AUGUST, miniCalendar: "true" });

    const pages = [];
    host.addEventListener(runtime.wx.Event.CHANGE_PAGE_EVENT, (e) => pages.push(e.detail));

    const picker = runtime.wx.Controller.getInstanceByElement(host.querySelectorAll(".wx-schedule-mini")[0]);

    // the date control narrows its input with instanceof, so the pick has to
    // come from the realm the runtime was loaded into; ctrl.date hands out a
    // copy from exactly that realm. In a browser the two are the same realm and
    // any Date works.
    const pick = ctrl.date;
    pick.setFullYear(2026, 10, 3);
    picker.value = pick;

    assert.equal(ctrl.date.getMonth(), 10, "the schedule follows the pick");
    assert.equal(pages.length, 1);
    assert.equal(pages[0].from, "2026-11-01");
});

test("the mini calendar follows the navigation without reporting it as a pick", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { ...AUGUST, miniCalendar: "true" });

    const pages = [];
    host.addEventListener(runtime.wx.Event.CHANGE_PAGE_EVENT, (e) => pages.push(e.detail));

    ctrl.next();

    const picker = runtime.wx.Controller.getInstanceByElement(host.querySelectorAll(".wx-schedule-mini")[0]);
    assert.equal(picker.value.getMonth(), 8, "the picker was moved onto the new period");
    assert.equal(pages.length, 1, "syncing the picker does not report a second navigation");
});

test("the mini calendar survives a re-render and keeps its instance", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { ...AUGUST, miniCalendar: "true" });

    const before = runtime.wx.Controller.getInstanceByElement(host.querySelectorAll(".wx-schedule-mini")[0]);
    ctrl.render();
    ctrl.render();
    const after = runtime.wx.Controller.getInstanceByElement(host.querySelectorAll(".wx-schedule-mini")[0]);

    // rebuilding the popper-backed control per render would strand one on every
    // navigation, so the same instance has to be re-attached instead
    assert.equal(before, after);
    assert.equal(host.querySelectorAll(".wx-schedule-mini").length, 1);
});

test("the change of the picker is kept from reaching the schedule's own listeners", () => {
    const runtime = load();
    const { host } = build(runtime, { ...AUGUST, miniCalendar: "true" });

    const mini = host.querySelectorAll(".wx-schedule-mini")[0];
    let stopped = false;
    mini.dispatchEvent({
        type: runtime.wx.Event.CHANGE_VALUE_EVENT,
        target: mini,
        detail: { value: "15.08.2026" },
        stopPropagation() { stopped = true; }
    });

    assert.equal(stopped, true, "the picker's change is an implementation detail of the toolbar");
});

test("the teardown releases the picker and the drag listeners", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { ...AUGUST, miniCalendar: "true" });

    const mini = host.querySelectorAll(".wx-schedule-mini")[0];
    assert.ok(runtime.wx.Controller.getInstanceByElement(mini));

    ctrl.destroy();

    assert.equal(ctrl._miniCtrl, null, "the picker is released with the schedule");
});

test("the teardown releases the drag listeners it installed on the window", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { ...AUGUST, editable: "true" }, [
        { id: "m", title: "Meeting", start: "2026-08-12T10:00:00", end: "2026-08-12T11:00:00" }
    ]);

    const before = runtime.sandbox.window._listeners;
    const count = (type) => (before[type] ? before[type].size : 0);

    host.querySelectorAll(".wx-schedule-entry-chip")[0]
        .dispatchEvent({ type: "dragstart", target: null, dataTransfer: null });
    assert.ok(count("drop") > 0, "a drag installs its transient listeners");

    ctrl.destroy();
    assert.equal(count("drop"), 0, "the teardown releases them again");
    assert.equal(count("dragover"), 0);
});
