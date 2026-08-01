![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# ScheduleCtrl

The `ScheduleCtrl` is a calendar for **time-based items** - appointments, events or tasks, that carry a start, an end and may span several days. It offers three views over the same set of items, navigates between periods and marks regional holidays.

The control is **static**: its items and holidays are supplied through the properties of `ControlSchedule` and it performs no data access of its own. The data-driven counterpart that loads and updates its items over REST is [`ControlDataSchedule`](../../../WebExpress.WebApp/docs/js/schedule.md) in `WebExpress.WebApp`.

```
   ┌──────────────────────────────────────────────────────────────┐
   │ ‹  Today  ›     August 2026           [Agenda][Week ][Month ]│
   ├──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────────┤
   │ W    │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │ Sun         │
   │ 32   │  3   │  4   │  5   │  6   │  7   │  8   │  9          │
   │      │ ▓▓▓▓▓▓▓▓▓▓▓▓▓ Voyage ▓▓▓▓▓▓▓▓▓▓▓ │      │             │
   │      │ ▪9:00│      │ ▪14:0│      │      │      │             │
   │ 33   │ 10   │ 11   │ 12   │ 13   │ 14   │ 15   │ 16          │
   │      │      │      │ ▪10:0│      │      │Assum…│             │
   │      │      │      │ +2   │      │      │      │             │
   └──────┴──────┴──────┴──────┴──────┴──────┴──────┴─────────────┘
```

## Views

| View     | Layout
|----------|------------------------------------------------------------------------------------------
| `month`  | The classic calendar grid, padded to whole weeks. Single-day items appear as compact chips, multi-day items as **continuous bars** that run across the days they cover.
| `week`   | A seven day grid. With the time axis on, a timed item is placed and stretched by its hours and overlapping items share the width of the day; with the axis off, the items are stacked as chips. All-day and multi-day items sit in the lane above the axis.
| `agenda` | A chronological list of **every item in the model**, under a heading per day, week or month.

The month grid reserves the same number of bar lanes in every day of a week, so the chips below a run of bars stay aligned instead of jumping between rows.

## Declarative Configuration

The control is bootstrapped from a host element carrying the `wx-webui-schedule` CSS class. The items and holidays are hidden descriptor children that the client reads and replaces with the rendered calendar.

### Container Element Attributes

| Attribute                | Description                                                                                                        | Example
|--------------------------|--------------------------------------------------------------------------------------------------------------------|--------------------------
| `data-view`              | The view the schedule opens in: `agenda`, `week` or `month` (default).                                              | `data-view="week"`
| `data-views`             | The views offered in the toolbar, as a comma separated subset. Unknown names are dropped; when none remain, all three are offered. | `data-views="week,month"`
| `data-agenda-grouping`   | How the agenda groups its list: `day` (default), `week` or `month`.                                                 | `data-agenda-grouping="week"`
| `data-culture`           | The BCP-47 tag the names, formats and calendar system follow. May carry the Unicode calendar extension.             | `data-culture="th-TH-u-ca-buddhist"`
| `data-week-start`        | The day a week starts on, `0` (Sunday) to `6`. When absent it is derived from the culture.                          | `data-week-start="0"`
| `data-iso-week`          | `true` counts week numbers the ISO 8601 way (week one contains the first Thursday).                                 | `data-iso-week="true"`
| `data-week-numbers`      | `true` shows the week number in front of each week.                                                                 | `data-week-numbers="true"`
| `data-show-holidays`     | `false` switches the holiday marking off. Holidays are marked otherwise.                                            | `data-show-holidays="false"`
| `data-date`              | The date the schedule opens on. Defaults to the current day.                                                        | `data-date="2026-08-15"`
| `data-time-axis`         | `false` replaces the week view's time axis with a plain stack. The axis is on otherwise.                            | `data-time-axis="false"`
| `data-hour-start` / `data-hour-end` | The bounds of the time axis. An inverted or out-of-range pair falls back to the whole day.                | `data-hour-start="8"`
| `data-mini-calendar`     | `true` adds a date picker to the toolbar for jumping straight to a day. See [Mini Calendar](#mini-calendar).         | `data-mini-calendar="true"`
| `data-editable`          | `true` lets items be dragged onto another day, which raises the move event.                                         | `data-editable="true"`

### Item Descriptors

Items are elements with the class `.wx-schedule-item`.

| Attribute            | Description
|----------------------|--------------------------------------------------------------------------------------
| `id`                 | The identity of the item, reported by every event.
| `data-title`         | The title shown on the entry.
| `data-start`         | **Required.** The moment the item begins, as `yyyy-MM-ddTHH:mm:ss`.
| `data-end`           | The moment it ends. Without it - or with an end before the start - the item ends on the day it begins.
| `data-all-day`       | `true` puts the item in the all-day lane instead of onto the time axis.
| `data-category`      | The category, carried through to the entry as a `data-category` attribute for the stylesheet.
| `data-color-css` / `data-color-style` | The colour, as a CSS class (system colour) or an inline declaration (user-defined colour).
| `data-icon`          | A CSS class rendered in front of the title, for example `fas fa-anchor`.
| `data-uri`           | Turns the entry into a link.
| `data-meta`          | Free-form JSON that reaches the click events and the custom renderer unchanged.

### Holiday Descriptors

Holidays are elements with the class `.wx-schedule-holiday`.

| Attribute       | Description
|-----------------|-------------------------------------------------------------------------
| `data-date`     | **Required.** The day, as a bare `yyyy-MM-dd`.
| `data-name`     | The name shown on the day.
| `data-region`   | The region it applies to, shown in the tooltip.
| `data-type`     | `public`, `bank`, `school`, `observance` or `optional`, which selects the marking.

> **Timestamps carry no zone offset and are parsed as local time.** `toISOString` is deliberately not used anywhere in the exchange: it converts to UTC and would move an all-day item to the previous day for every visitor west of Greenwich. A holiday is a bare date and is never turned into a point in time at all.

## Calendar Cultures

Localisation runs through `Intl`, so one culture tag drives everything that differs between regions:

- **Names and formats** - month and weekday names, day numbers and times come from `Intl.DateTimeFormat`.
- **Calendar system** - a tag with the Unicode calendar extension renders a non-Gregorian calendar: `th-TH-u-ca-buddhist`, `ja-JP-u-ca-japanese`, `ar-SA-u-ca-islamic`. The grid arithmetic stays proleptic Gregorian; the extension changes how the dates are *presented*.
- **Week start** - derived from the culture through `Intl.Locale`, overridable with `data-week-start`. An engine without week information falls back to Monday.
- **Weekend** - derived from the culture as well, so a Friday/Saturday weekend is shaded correctly; it falls back to Saturday/Sunday.
- **Week numbers** - `data-iso-week` is independent of the week start, because a region may display Sunday-first weeks and still count them the ISO way.

An unsupported culture tag never takes the control down: the formatters fall back to the browser default.

## Programmatic Control

```javascript
const element = document.querySelector(".wx-webui-schedule");
const schedule = webexpress.webui.Controller.getInstanceByElement(element);

// replace the whole model
schedule.model = {
    items: [
        { id: "a", title: "Standup", start: "2026-08-12T09:00:00", end: "2026-08-12T09:15:00" },
        { id: "b", title: "Voyage", start: "2026-08-14T00:00:00", end: "2026-08-18T00:00:00", allDay: true }
    ],
    holidays: [{ date: "2026-08-15", name: "Assumption Day", region: "BY", type: "public" }]
};

// navigation
schedule.view = "week";      // agenda | week | month
schedule.date = "2026-09-01";
schedule.next();
schedule.previous();
schedule.today();

// the period the current view shows, as the range a data source is queried with
const { from, to } = schedule.range();

// move an item; this is the same path a drag takes, so it raises MOVE_EVENT too
schedule.moveItem("a", new Date(2026, 7, 13, 9, 0), new Date(2026, 7, 13, 9, 15));

// the items, chronologically ordered
const items = schedule.value;
```

An item without a usable start carries no position in time and is dropped by the model rather than placed at the epoch.

## Custom Renderers

Both renderers are offered their subject first and may return `null` to fall back to the default markup, so a page can special-case a few entries without reimplementing the rest. The shared decoration - identity, colour, title, selection, dragging and the events - is applied to whatever the renderer returns, so a custom entry stays fully interactive.

```javascript
schedule.itemRenderer = (item, context) => {
    // context: { variant: "chip" | "event" | "bar" | "agenda", day, schedule }
    if (item.category !== "release") {
        return null;                       // fall back to the default entry
    }
    const el = document.createElement("div");
    el.textContent = `🚀 ${item.title}`;
    return el;
};

schedule.holidayRenderer = (holiday) => {
    const el = document.createElement("span");
    el.textContent = holiday.type === "public" ? `★ ${holiday.name}` : holiday.name;
    return el;
};

schedule.render();
```

## Events

All events bubble and are dispatched on the host element.

| Event                                        | Fired when                          | `detail`
|----------------------------------------------|-------------------------------------|------------------------------------------
| `webexpress.webui.Event.CLICK_EVENT`         | an item is clicked                  | `{ id, item, meta }`
| `webexpress.webui.Event.DOUBLE_CLICK_EVENT`  | an item is double-clicked           | `{ id, item, meta }`
| `webexpress.webui.Event.SELECT_ITEM_EVENT`   | an empty day or time slot is clicked | `{ date, allDay }`
| `webexpress.webui.Event.CHANGE_PAGE_EVENT`   | the view or the period changes      | `{ view, date, from, to }`
| `webexpress.webui.Event.MOVE_EVENT`          | an item is moved                    | `{ id, item, start, end, allDay }`
| `webexpress.webui.Event.UPDATED_EVENT`       | the schedule is rendered            | `{ view }`

`CHANGE_PAGE_EVENT` carries the range the new period spans, which is what lets a data-driven subclass load the matching items.

```javascript
element.addEventListener(webexpress.webui.Event.SELECT_ITEM_EVENT, (e) => {
    console.log("create an appointment on", e.detail.date);
});
```

## Interaction

- **Click** an entry to select it, an empty day or hour slot to report the slot.
- **Double-click** an entry, for example to open an editor.
- **Drag** an entry onto another day when `data-editable` is set. The time of day and the duration are preserved, so a move never silently changes how long an item lasts. Resizing is not part of the control; adjust the duration through `moveItem` or an editor of your own.
- The **"+n more"** counter of a crowded month day switches to the week view of that day.

## Mini Calendar

With `data-mini-calendar` the toolbar carries a date picker that jumps straight to a day instead of stepping through the periods. It is the framework date control (`InputDateCtrl`, `wx-webui-input-date`) rather than a native `<input type="date">`, so it offers the same calendar, the same formats and the same keyboard model as every other date field in the application.

The picker is built **once** and re-attached on every render rather than rebuilt: the date control installs a popper, and recreating it per render would strand one on every navigation. Navigating the schedule moves the picker onto the new period, and that programmatic move is not reported back as a user pick.

The picker's own `CHANGE_VALUE_EVENT` is stopped at its host: it is an implementation detail of the toolbar and must not reach listeners that expect the schedule's item changes under the same name.

Where the date control is not part of the bundle, the row degrades to a native `<input type="date">` rather than disappearing. Both variants sit in `.wx-schedule-mini`; the width is the `--wx-schedule-mini` custom property.

```javascript
// the picker is a regular framework control and can be reached like any other
const mini = element.querySelector(".wx-schedule-mini");
const picker = webexpress.webui.Controller.getInstanceByElement(mini);
const shownDay = picker ? picker.value : null;   // a Date
```

## Styling

The stylesheet draws from the theme variables, so light and dark are one rule set. The layout metrics are custom properties that a host can override without touching the rules:

| Property                     | Meaning
|------------------------------|--------------------------------
| `--wx-schedule-gap`          | The gap between the grid cells. The multi-day bars add it back when they span columns, so it must match the grid.
| `--wx-schedule-lane`         | The height of a bar lane.
| `--wx-schedule-hour`         | The height of one hour on the time axis.
| `--wx-schedule-axis`         | The width of the hour axis.
| `--wx-schedule-weeknumber`   | The width of the week number column.
| `--wx-schedule-daymin`       | The minimum height of a month day cell.
| `--wx-schedule-mini`         | The width of the mini calendar in the toolbar.

State classes are additive, so a holiday on a weekend keeps both marks: `wx-schedule-othermonth`, `wx-schedule-weekend`, `wx-schedule-today`, `wx-schedule-isholiday` and `wx-schedule-isholiday-{type}`. Entries carry `wx-schedule-entry` plus `wx-schedule-entry-{variant}`.

`wx-schedule-today` marks the current **day cell** and its rule is scoped to the cells, so it cannot be picked up by a control that happens to share the name. The toolbar buttons are `wx-schedule-btn` plus `wx-schedule-prev`, `wx-schedule-nav-today`, `wx-schedule-next` and `wx-schedule-view-{view}`; the active view additionally carries `wx-schedule-view-active`.

## Use Case Example

```html
<div class="wx-webui-schedule"
     data-view="month"
     data-culture="de-DE"
     data-iso-week="true"
     data-week-numbers="true"
     data-mini-calendar="true"
     data-editable="true">

    <div id="standup" class="wx-schedule-item"
         data-title="Standup"
         data-start="2026-08-12T09:00:00"
         data-end="2026-08-12T09:15:00"
         data-icon="fas fa-users"></div>

    <div id="voyage" class="wx-schedule-item"
         data-title="Voyage"
         data-start="2026-08-14T00:00:00"
         data-end="2026-08-18T00:00:00"
         data-all-day="true"
         data-color-css="bg-success"></div>

    <div class="wx-schedule-holiday"
         data-date="2026-08-15"
         data-name="Assumption Day"
         data-region="BY"
         data-type="public"></div>
</div>
```

Authored in C#:

```csharp
new ControlSchedule("calendar")
{
    View = _ => TypeViewSchedule.Month,
    Culture = _ => "de-DE",
    IsoWeek = _ => true,
    ShowWeekNumbers = _ => true,
    MiniCalendar = _ => true,
    Editable = _ => true
}
    .Add(new ControlScheduleItem("standup")
    {
        Title = _ => "Standup",
        Start = _ => new DateTime(2026, 8, 12, 9, 0, 0),
        End = _ => new DateTime(2026, 8, 12, 9, 15, 0),
        Icon = _ => new IconUsers()
    })
    .Add(new ControlScheduleItem("voyage")
    {
        Title = _ => "Voyage",
        Start = _ => new DateTime(2026, 8, 14),
        End = _ => new DateTime(2026, 8, 18),
        AllDay = _ => true,
        Color = _ => new PropertyColorBackground(TypeColorBackground.Success)
    })
    .Add(new ControlScheduleHoliday()
    {
        Date = _ => new DateTime(2026, 8, 15),
        Name = _ => "Assumption Day",
        Region = _ => "BY",
        Type = _ => TypeHolidaySchedule.Public
    });
```
