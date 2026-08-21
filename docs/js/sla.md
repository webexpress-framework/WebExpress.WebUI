![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# SlaCtrl

The `SlaCtrl` is the client half of the **service level agreement** widget: a coloured status, a meter of the consumed budget, the time left, the cycle of a periodic agreement and the actions that pause, resume or settle it.

The widget is rendered **complete on the server**. `SlaEvaluator` derives the status from the definition and `ControlSla` writes it into the markup, so the tile is correct in the first paint, readable without JavaScript and assertable in a unit test. The client only takes over what the server cannot know - the passing of time: it counts the budget down, moves the tile between the states as the thresholds are crossed, rolls a periodic agreement over into its next cycle and localises the labels.

The control has **two readings**, and which one it takes is decided by whether agreements were added to it. Empty, it is one agreement, configured through its own properties. Filled, it is the **panel** that frames them - see [Framing several agreements](#framing-several-agreements). Both ship as one control and one asset; each rendering carries its own marker class and therefore its own client (`SlaCtrl` and `SlaGroupCtrl`).

```
   ┌────────────────────────────────────────────────────┐
   │ First response                          [AT RISK]  │
   │ Premium tickets, business hours                    │
   │ ████████████████████████████████░░░░░░░░           │
   │ 48 min                              Cycle 3 of 5   │
   │ [ || ]  [ ▶ ]  [ ✓ ]                               │
   └────────────────────────────────────────────────────┘
```

## States

| Status      | Colour | Meaning
|-------------|--------|---------------------------------------------------------------------------------
| `fulfilled` | green  | The agreement is being met - either it still has budget left or the cycle was settled manually.
| `at-risk`   | yellow | The elapsed time has passed the warning threshold but the deadline has not been reached yet.
| `violated`  | red    | The budget of the current cycle is used up. The countdown keeps running and reports the size of the overrun.
| `paused`    | grey   | The clock is stopped, so neither the deadline nor the next cycle moves closer.

The status is **decided in a fixed order**: a manually settled cycle wins over everything, because settling it is a statement about the outcome rather than about the clock; a stopped clock wins over the remaining time, because a paused agreement must not slide into a violation while nobody is working on it; and only then does the budget decide between violated, at risk and on track.

> **The four states are exhaustive and mutually exclusive**, so a dashboard can colour a whole wall of agreements without ever falling back on an "unknown" tile.

## Server Side

### ControlSla

| Property           | Type                    | Description
|--------------------|-------------------------|--------------------------------------------------------------
| `Label`            | `string`                | The name of the agreement. It also becomes the accessible name of the tile.
| `Description`      | `string`                | The optional line below the name, for example what the agreement covers or who owns it.
| `Start`            | `DateTime`              | The moment the clock of the first cycle started.
| `Target`           | `TimeSpan`              | **The time budget granted per cycle** (`targetTime`). A budget larger than the recurrence interval is capped to the interval. A non-positive budget leaves the agreement without time and reports as violated from the first moment, so a widget that was never configured is impossible to miss.
| `WarningThreshold` | `double`                | The fraction of the budget after which the agreement counts as at risk, between 0 and 1. Defaults to `0.8`, which leaves an operator a fifth of the time to react.
| `Recurrence`       | `TypeRecurrenceSla`     | **The interval the agreement resets in** (`recurrenceInterval`): `None`, `Daily`, `Weekly` or `Monthly`.
| `Cycles`           | `int`                   | The number of cycles the agreement runs for, where `0` means unlimited. Defaults to `1`.
| `PauseTotal`       | `TimeSpan`              | The time the agreement has spent paused so far. It is subtracted from the elapsed time.
| `PausedSince`      | `DateTime?`             | The moment the current pause began, or `null` while the clock is running.
| `FulfilledCycle`   | `int?`                  | The one-based cycle that was settled manually, or `null` when none was.
| `FulfilledAt`      | `DateTime?`             | The moment the agreement was settled manually. Informational - the status is decided by `FulfilledCycle`.
| `Now`              | `DateTime`              | The moment the widget is evaluated at. Defaults to the current server time; pin it to render the widget as it looked at any moment - which is what makes the markup testable.
| `ActionUri`        | `IUri`                  | The endpoint a requested transition is posted to. Without it the actions raise their events only.
| `ShowActions`      | `bool`                  | Whether the pause, resume and settle buttons are rendered. Defaults to `true`.
| `Live`             | `bool`                  | Whether the client keeps the widget running. Defaults to `true`; switched off, the widget stays exactly as the server rendered it.
| `ShowSummary`      | `bool`                  | Whether the panel shows the summary of the agreements it frames. Defaults to `true`; it has no meaning for a single agreement.

Every property is a function of the render context, so the values are read per request rather than captured once at construction time.

```csharp
new ControlSla("sla-response")
{
    Label = _ => "First response",
    Description = _ => "Premium tickets, business hours",
    Start = _ => agreement.StartedAt,
    Target = _ => TimeSpan.FromHours(4),
    WarningThreshold = _ => 0.75,
    Recurrence = _ => TypeRecurrenceSla.Daily,
    Cycles = _ => 5,
    ActionUri = _ => sitemapManager.GetUri<SlaEndpoint>(pageContext)
};
```

### SlaDefinition

`SlaDefinition` is the model the evaluation and the transitions work on. It carries state, not behaviour that reaches outside itself: it knows nothing about storage, requests or rendering, which is what lets a whole month of history be driven in a test without a clock. A store that already keeps its agreements in this shape hands one to the control in a single call:

```csharp
new ControlSla("sla-response") { Label = _ => agreement.Name }.Bind(definition);
```

The transitions **return a new instance** instead of mutating the one they were called on, so a definition that is being read - by a renderer, by another request - can never change underneath the reader.

| Method              | Description
|---------------------|--------------------------------------------------------------------------------
| `Pause(moment)`     | Stops the clock. Pausing an already paused agreement is a no-op, so a retried call cannot extend the credited pause.
| `Resume(moment)`    | Starts the clock again and credits the time spent paused. A resume dated before the pause credits nothing.
| `Fulfill(moment)`   | Settles the current cycle. The clock is released as well - a settled cycle has no reason to stay frozen, and leaving it paused would credit the remaining pause to the cycle that follows.
| `Restart(moment)`   | Starts the agreement over, discarding the pause and settlement history of the run so far.

### Framing several agreements

`Add(params ControlSla[])` turns the control into the panel that frames the agreements handed to it:

```csharp
new ControlSla
(
    "sla-support",
    new ControlSla("sla-response") { Label = _ => "First response", /* ... */ },
    new ControlSla("sla-resolution") { Label = _ => "Resolution", /* ... */ }
)
{
    Label = _ => "Support",
    Description = _ => "What we owe our premium customers."
};
```

A dashboard that shows more than one agreement should show them as one thing. Rendered on their own, five tiles read as five unrelated widgets that happen to sit next to each other; inside the panel they sit under a shared heading, indented and separated by a hairline, so the eye reads one panel and the summary answers the only question a wall display is really asked - **is anything wrong**.

Neither rendering draws a box of its own. The frame belongs to whatever hosts the widget - a card, a dashboard tile - because a widget that brought its own would nest a second frame inside the host's. The **tile** does carry a coloured left edge: it repeats the status the badge shows, so it stays readable for a visitor who cannot separate the badge colours. The **panel** carries none. Every tile already marks its own agreement, and a second accent spanning all of them would repeat the worst status without saying which agreement it belongs to - which is the summary's job, and the summary says it in words.

The panel takes the colour of its **worst** agreement, because one that showed the best of them would hide what it exists to surface. `paused` only wins when *every* agreement is paused: a single stopped clock among running ones says nothing about the set.

| Element                | Description
|------------------------|------------------------------------------------------------------
| `.wx-sla-group`        | The panel. Carries the aggregated status class and the `wx-webui-sla-group` marker.
| `.wx-sla-group-header` | The heading and the summary.
| `.wx-sla-summary`      | The count per status, with the empty ones left out and the ones that need attention first. Kept current by the client.
| `.wx-sla-group-items`  | The tiles, indented under the panel's edge and separated by a hairline.

Both the summary and the colour are computed on the server from the same evaluation the tiles render, and the client recomputes them whenever a tile reports a status change or a cycle rollover - so the panel can never disagree with what is shown underneath it.

### FragmentControlSla

`ControlSla` is also available as a fragment, so an agreement can be **contributed to a section** instead of being added to a page by hand - which is what lets an agreement owned by one plugin appear on a dashboard owned by another without either knowing the other. The fragment carries no state of its own; a derived class fills the properties, typically from its own store:

```csharp
[Section<SectionContentPrimary>]
[Scope<IScopeDashboard>]
public sealed class SlaFirstResponseFragment : FragmentControlSla
{
    public SlaFirstResponseFragment(IFragmentContext fragmentContext, IAgreementStore store)
        : base(fragmentContext)
    {
        Label = _ => "First response";
        Start = _ => store.FirstResponse.StartedAt;
        Target = _ => TimeSpan.FromHours(4);
        Recurrence = _ => TypeRecurrenceSla.Daily;
    }
}
```

The id of the tile is derived from the fragment id, and the conditions of the fragment context are honoured: a fragment whose conditions do not hold renders nothing at all rather than an empty tile.

### SlaEvaluator

```csharp
var evaluation = SlaEvaluator.Evaluate(definition, DateTime.Now);
```

The evaluation is pure and takes the moment as an argument rather than reading the clock. All arithmetic happens on the agreement's **own timeline**: the time it has actually been running, with every paused interval removed. A pause therefore does not merely freeze the countdown, it also postpones the next reset - the only reading under which "the clock is stopped" stays true for a periodic agreement.

| Member          | Description
|-----------------|------------------------------------------------------------------------------------
| `Status`        | The state the agreement is in.
| `Elapsed`       | The time consumed in the current cycle, excluding paused time.
| `Remaining`     | The time left in the current cycle. Negative once the budget is overrun, because the size of the overrun is what an operator needs after a violation.
| `Budget`        | The budget of the current cycle, after capping it to the recurrence interval.
| `Period`        | The length of the current cycle, or zero when the agreement does not recur.
| `Progress`      | The share of the budget consumed, between 0 and 1.
| `Cycle`         | The one-based number of the current cycle.
| `Cycles`        | The number of cycles the agreement runs for, where 0 means unlimited.
| `IsPaused`      | Whether the clock is stopped.
| `IsFinalCycle`  | Whether the current cycle is the last one.
| `IsSettled`     | Whether the current cycle was settled manually. It separates the two readings of `Fulfilled` - settled and merely on track - which a client has to tell apart before it counts on.
| `Deadline`      | The wall clock moment the budget runs out, or `null` while the agreement is paused.
| `Reset`         | The wall clock moment the next cycle begins, or `null` when paused, not recurring or on the last cycle.

### Recurrence

A periodic agreement starts over with a fresh budget every day, seven days or calendar month. Monthly cycles are walked on the calendar rather than derived from a fixed tick count, so they inherit the unequal length of the months they fall into.

Once the last cycle of a limited agreement is reached the agreement **stops resetting** and its final window keeps running, so a cycle that was never settled stays visible as a violation instead of quietly disappearing.

A manual settlement is stored as the cycle it happened in, not as a timestamp. A recurring agreement therefore forgets it exactly when it starts over - which is the reset behaviour a periodic agreement promises.

## Declarative Configuration

The control is bootstrapped from a host element carrying the `wx-webui-sla` CSS class. The client reads the state from its data attributes and updates the parts the server rendered; it never builds them.

| Attribute                | Description                                                                                              | Example
|--------------------------|----------------------------------------------------------------------------------------------------------|--------------------------
| `data-status`            | The status the server computed: `fulfilled`, `at-risk`, `violated` or `paused`.                           | `data-status="at-risk"`
| `data-target`            | The budget of the current cycle, in whole seconds.                                                        | `data-target="14400"`
| `data-elapsed`           | The time consumed in the current cycle, in whole seconds.                                                 | `data-elapsed="11520"`
| `data-remaining`         | The time left in the current cycle, in whole seconds. Negative on an overrun.                             | `data-remaining="2880"`
| `data-progress`          | The share of the budget consumed, between 0 and 1.                                                        | `data-progress="0.8"`
| `data-warning-threshold` | The fraction of the budget after which the agreement counts as at risk.                                   | `data-warning-threshold="0.8"`
| `data-recurrence`        | The reset interval: `daily`, `weekly` or `monthly`. Absent when the agreement does not recur.              | `data-recurrence="daily"`
| `data-period`            | The length of the current cycle, in whole seconds. Absent when the agreement does not recur.               | `data-period="86400"`
| `data-cycle`             | The one-based number of the current cycle.                                                                 | `data-cycle="3"`
| `data-cycles`            | The number of cycles. Absent when the agreement runs indefinitely.                                         | `data-cycles="5"`
| `data-deadline`          | The moment the budget runs out, as `yyyy-MM-ddTHH:mm:ss`. Absent while paused. Display only.               | `data-deadline="2026-08-01T12:00:00"`
| `data-reset`             | The moment the next cycle begins. Absent while paused, on the last cycle and without recurrence.            | `data-reset="2026-08-02T08:00:00"`
| `data-now`               | The moment the server evaluated the widget at. Display and diagnostics only.                               | `data-now="2026-08-01T09:00:00"`
| `data-fulfilled`         | The moment the agreement was settled manually.                                                             | `data-fulfilled="2026-08-01T10:00:00"`
| `data-paused`            | `true` while the clock is stopped. Absent otherwise.                                                       | `data-paused="true"`
| `data-settled`           | `true` when the current cycle was settled manually. Absent otherwise.                                      | `data-settled="true"`
| `data-live`              | `false` freezes the widget at the state the server rendered. The countdown runs otherwise.                 | `data-live="false"`
| `data-action-uri`        | The endpoint a transition is posted to. Without it a transition is only raised as an event.                | `data-action-uri="/api/v1/sla"`

> **The countdown runs on the durations, not on the timestamps.** `data-remaining` is immune to the skew between the server clock and the visitor's clock, which a countdown built from an absolute deadline is not. The timestamps are carried alongside for display only.

Timestamps carry no zone offset and are read as local time, exactly like those of the [schedule](schedule.md).

### Parts

The client updates these elements when they are present. Each one is optional: a host reduced to its data attributes stays a valid, if silent, widget.

| Selector               | Updated with
|------------------------|-------------------------------------------------------------------
| `.wx-sla-status`       | The localised status text.
| `.wx-sla-meter`        | `aria-valuenow` and `aria-valuetext`.
| `.wx-sla-meter-value`  | The width of the bar.
| `.wx-sla-remaining`    | The localised remaining time and the `datetime` duration.
| `.wx-sla-cycle`        | The localised cycle counter.
| `[data-wx-sla-action]` | The disabled state and the localised accessible name.

## Events

Every event is dispatched on the host element and bubbles, so a dashboard can listen once on a container instead of subscribing to every tile.

| Event                                    | Constant                     | Detail
|------------------------------------------|------------------------------|------------------------------------------------
| `webexpress.webui.sla.status.change`     | `SLA_STATUS_CHANGE_EVENT`    | `status`, `previous`, `cycle`, `remaining`
| `webexpress.webui.sla.action`            | `SLA_ACTION_EVENT`           | `action`, `status`, `cycle`, `remaining`
| `webexpress.webui.sla.cycle`             | `SLA_CYCLE_EVENT`            | `cycle`, `cycles`
| `webexpress.webui.data.error`            | `DATA_ERROR_EVENT`           | `action`, `error` - raised when a transition could not be persisted

A status change is reported **once per change**, not once per tick.

```javascript
document.querySelector("#dashboard").addEventListener(webexpress.webui.Event.SLA_STATUS_CHANGE_EVENT, (e) => {
    if (e.detail.status === "violated") {
        console.warn(`${e.detail.id} was violated in cycle ${e.detail.cycle}`);
    }
});
```

## Data-driven Agreements

The counterpart that sources its state from a REST endpoint instead of being handed it is [`ControlDataSla`](../../../WebExpress.WebApp/docs/js/sla.md) in `WebExpress.WebApp`. It derives from this control, so everything above applies unchanged; what it adds is the service island it loads from and requests its transitions through, and an optional poll interval.

## Server Routes

With `ActionUri` set, a click posts the requested transition as JSON and the widget adopts the state the endpoint answers with. The transition is applied locally first - the visitor asked for it and the outcome is known, so waiting for a round trip to grey out a paused agreement would make the button feel broken. A failing request is reported through the data error event, which is where a page that cares about the discrepancy reloads.

**Request**

```http
POST /api/v1/sla
Content-Type: application/json

{ "action": "pause" }
```

| Action     | Effect
|------------|-------------------------------------------------------------
| `pause`    | Stops the clock.
| `resume`   | Starts the clock again and credits the time spent paused.
| `fulfill`  | Settles the current cycle and releases the clock.

**Response**

Every field is optional; the widget adopts the ones it is given and keeps the rest.

```json
{
    "status": "paused",
    "target": 14400,
    "elapsed": 11520,
    "remaining": 2880,
    "period": 86400,
    "cycle": 3,
    "cycles": 5,
    "paused": true,
    "settled": false
}
```

An endpoint owns no logic of its own - it applies the transitions of `SlaDefinition` and reports what `SlaEvaluator` derives from the result, so the widget, the endpoint and the tests all arrive at the same status by the same route:

```csharp
[Segment("sla")]
public sealed class SlaEndpoint : IRestApi
{
    [Method(RequestMethod.POST)]
    public IResponse Update(Request request)
    {
        var moment = DateTime.Now;

        _definition = GetAction(request) switch
        {
            "pause" => _definition.Pause(moment),
            "resume" => _definition.Resume(moment),
            "fulfill" => _definition.Fulfill(moment),
            _ => throw new ArgumentException("Unknown action.")
        };

        return Json(SlaEvaluator.Evaluate(_definition, moment));
    }
}
```

## Programmatic Control

```javascript
const element = document.querySelector("#sla-response");
const sla = webexpress.webui.Controller.getInstanceByElement(element);

// the current reading
sla.status;      // "fulfilled" | "at-risk" | "violated" | "paused"
sla.remaining;   // seconds left in the cycle, negative on an overrun
sla.cycle;       // the one-based cycle

// apply a transition, exactly as a click on the button would
sla.execute("pause");
sla.execute("resume");
sla.execute("fulfill");

// adopt a state computed elsewhere, for example after a poll
sla.apply({ elapsed: 11520, paused: false, cycle: 3 });

// advance to the current moment and render, which the timer does every second
sla.update();
```

## Accessibility

- The tile is a `role="group"` named by its `Label`, so a screen reader announces which of the agreements on the dashboard it is reading.
- The status badge is a `role="status"` with `aria-live="polite"`, so a change is announced without stealing the focus. It is the one part of the widget that changes on its own.
- The meter is a `role="progressbar"` carrying `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and an `aria-valuetext` that reads the remaining time rather than the bare percentage - the number the widget exists for.
- The remaining time is a `<time>` element with an ISO 8601 duration in its `datetime` attribute.
- The transition buttons carry an icon only and are therefore always given an `aria-label` and a `title`. A transition that would do nothing is disabled rather than dropped, so the row keeps its shape as the agreement moves between the states.
- The status is carried by the coloured left edge **and** by the text of the badge, so the tile stays readable for a visitor who cannot separate the colours.
- The meter transition is dropped under `prefers-reduced-motion`.

## Use Case Example

```html
<div id="sla-response"
     class="wx-sla wx-webui-sla wx-sla-at-risk"
     role="group"
     aria-label="First response"
     data-status="at-risk"
     data-target="14400"
     data-elapsed="11520"
     data-remaining="2880"
     data-progress="0.8"
     data-warning-threshold="0.8"
     data-recurrence="daily"
     data-period="86400"
     data-cycle="3"
     data-cycles="5"
     data-deadline="2026-08-01T12:00:00"
     data-action-uri="/api/v1/sla">

    <div class="wx-sla-header">
        <span class="wx-sla-label">First response</span>
        <span class="wx-sla-status" role="status" aria-live="polite">At risk</span>
    </div>
    <div class="wx-sla-meter" role="progressbar"
         aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"
         aria-valuetext="80% - 48 min">
        <div class="wx-sla-meter-track">
            <div class="wx-sla-meter-value" style="width: 80%;"></div>
        </div>
    </div>
    <div class="wx-sla-footer">
        <time class="wx-sla-remaining" datetime="PT0H48M0S">48 min</time>
        <span class="wx-sla-cycle">Cycle 3 of 5</span>
    </div>
    <div class="wx-sla-actions">
        <button type="button" class="wx-sla-action" title="Pause"
                aria-label="Pause" data-wx-sla-action="pause"><i class="pause"></i></button>
        <button type="button" class="wx-sla-action" title="Resume"
                aria-label="Resume" data-wx-sla-action="resume" disabled><i class="play"></i></button>
        <button type="button" class="wx-sla-action" title="Mark as fulfilled"
                aria-label="Mark as fulfilled" data-wx-sla-action="fulfill"><i class="check"></i></button>
    </div>
</div>
```

Authored in C#:

```csharp
new ControlSla("sla-response")
{
    Label = _ => "First response",
    Start = _ => new DateTime(2026, 8, 1, 8, 0, 0),
    Target = _ => TimeSpan.FromHours(4),
    Recurrence = _ => TypeRecurrenceSla.Daily,
    Cycles = _ => 5,
    ActionUri = _ => sitemapManager.GetUri<SlaEndpoint>(pageContext)
};
```
