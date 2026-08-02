/**
 * Headless unit tests for the service level agreement control. They cover what
 * the client takes over from the server: the countdown, the move between the
 * states as the thresholds are crossed, the rollover of a periodic agreement
 * into its next cycle, the transitions a visitor triggers and the localisation
 * of the labels the server wrote in English.
 *
 * Time is driven by a stubbed clock rather than by waiting, so a day of
 * recurrence is asserted on in microseconds and the results stay deterministic.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, webuiAsset } from "./harness.mjs";

/**
 * The moment the stubbed clock starts at. Any fixed value does; it only has to
 * be stable across the runs.
 */
const EPOCH = 1_780_000_000_000;

/**
 * Loads a runtime whose clock the test controls and whose dictionaries are the
 * shipped ones, so the assertions on the labels run against the real
 * translations rather than against the key fallbacks.
 * @param {object} [options] - The options: language and the fetch stub.
 * @returns {object} The runtime, extended with an advance(seconds) helper.
 */
function load(options = {}) {
    let now = EPOCH;

    const clock = class extends Date {
        static now() {
            return now;
        }
    };

    const runtime = loadWebUi({
        browser: true,
        fetch: options.fetch,
        globals: { Date: clock },
        extraFiles: [
            webuiAsset("webexpress.webui.sla.js"),
            webuiAsset("i18n/en.js"),
            webuiAsset("i18n/de.js")
        ]
    });

    runtime.wx.I18N.setLanguage(options.language || "en");
    runtime.advance = (seconds) => {
        now += seconds * 1000;
    };

    return runtime;
}

/**
 * Builds a host carrying the state the C# control emits and constructs the
 * widget on it. The markup mirrors what ControlSla renders, because the client
 * updates those parts rather than building them.
 * @param {object} runtime - The loaded runtime.
 * @param {object} state - The host data attributes.
 * @returns {{ctrl: object, host: object}} The control and its host.
 */
function build(runtime, state) {
    const host = runtime.document.createElement("div");
    Object.assign(host.dataset, { target: "14400", elapsed: "3600", warningThreshold: "0.8", cycle: "1", ...state });

    const header = runtime.document.createElement("div");
    header.className = "wx-sla-header";
    const status = runtime.document.createElement("span");
    status.className = "wx-sla-status";
    status.textContent = "Fulfilled";
    header.appendChild(status);
    host.appendChild(header);

    const meter = runtime.document.createElement("div");
    meter.className = "wx-sla-meter";
    const track = runtime.document.createElement("div");
    track.className = "wx-sla-meter-track";
    const value = runtime.document.createElement("div");
    value.className = "wx-sla-meter-value";
    track.appendChild(value);
    meter.appendChild(track);
    host.appendChild(meter);

    const footer = runtime.document.createElement("div");
    footer.className = "wx-sla-footer";
    const remaining = runtime.document.createElement("time");
    remaining.className = "wx-sla-remaining";
    const cycle = runtime.document.createElement("span");
    cycle.className = "wx-sla-cycle";
    footer.appendChild(remaining);
    footer.appendChild(cycle);
    host.appendChild(footer);

    const actions = runtime.document.createElement("div");
    actions.className = "wx-sla-actions";
    for (const action of ["pause", "resume", "fulfill"]) {
        const button = runtime.document.createElement("button");
        button.className = "wx-sla-action";
        button.setAttribute("data-wx-sla-action", action);
        button.setAttribute("aria-label", action);
        actions.appendChild(button);
    }
    host.appendChild(actions);

    runtime.document.body.appendChild(host);

    return { ctrl: new runtime.wx.SlaCtrl(host), host };
}

/**
 * Returns the transition button of an action.
 * @param {object} host - The host element.
 * @param {string} action - The action.
 * @returns {object} The button.
 */
function button(host, action) {
    return host.querySelectorAll(`[data-wx-sla-action]`).find((b) => b.getAttribute("data-wx-sla-action") === action);
}

test("the countdown runs on the durations the server sent, not on its clock", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { status: "fulfilled" });

    assert.equal(ctrl.remaining, 10800, "three of the four hours are left");

    runtime.advance(1800);
    ctrl.update();

    assert.equal(ctrl.remaining, 9000);
    assert.equal(host.getAttribute("data-remaining"), "9000");
    assert.equal(host.querySelector(".wx-sla-remaining").textContent, "2 h 30 min");
    assert.equal(host.querySelector(".wx-sla-remaining").getAttribute("datetime"), "PT2H30M0S");
});

test("the widget turns at risk when the warning threshold is crossed", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { status: "fulfilled" });

    // one second short of 03:12, the four fifths of a four hour budget
    runtime.advance(7919);
    ctrl.update();
    assert.equal(ctrl.status, "fulfilled");

    runtime.advance(1);
    ctrl.update();

    assert.equal(ctrl.status, "at-risk");
    assert.equal(host.getAttribute("data-status"), "at-risk");
    assert.ok(host.classList.contains("wx-sla-at-risk"));
    assert.ok(!host.classList.contains("wx-sla-fulfilled"));
    assert.equal(host.querySelector(".wx-sla-status").textContent, "At risk");
});

test("the widget turns violated when the budget runs out and reports the overrun", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { status: "fulfilled" });

    runtime.advance(11700);
    ctrl.update();

    assert.equal(ctrl.status, "violated");
    assert.ok(host.classList.contains("wx-sla-violated"));
    assert.equal(host.querySelector(".wx-sla-remaining").textContent, "15 min overdue");
    assert.equal(host.getAttribute("data-progress"), "1.0000");
});

test("a status change is reported once, with the status it came from", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { status: "fulfilled" });
    const events = [];

    host.addEventListener("webexpress.webui.sla.status.change", (e) => events.push(e.detail));

    runtime.advance(7920);
    ctrl.update();
    runtime.advance(1);
    ctrl.update();

    assert.equal(events.length, 1, "the second tick did not change the status");
    assert.equal(events[0].status, "at-risk");
    assert.equal(events[0].previous, "fulfilled");
});

test("a periodic agreement rolls over into its next cycle with a fresh budget", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, {
        status: "violated",
        elapsed: "82800",
        period: "86400",
        recurrence: "daily",
        cycles: "5"
    });
    const cycles = [];

    host.addEventListener("webexpress.webui.sla.cycle", (e) => cycles.push(e.detail.cycle));

    assert.equal(ctrl.status, "violated");

    runtime.advance(3600);
    ctrl.update();

    assert.equal(ctrl.cycle, 2);
    assert.equal(ctrl.status, "fulfilled", "the new cycle starts with its budget untouched");
    assert.equal(ctrl.remaining, 14400);
    assert.deepEqual(cycles, [2]);
    assert.equal(host.getAttribute("data-cycle"), "2");
    assert.equal(host.querySelector(".wx-sla-cycle").textContent, "Cycle 2 of 5");
});

test("the last cycle of a limited agreement stays open ended", () => {
    const runtime = load();
    const { ctrl } = build(runtime, {
        status: "violated",
        elapsed: "82800",
        period: "86400",
        recurrence: "daily",
        cycles: "1"
    });

    runtime.advance(7200);
    ctrl.update();

    assert.equal(ctrl.cycle, 1, "there is no cycle to roll into");
    assert.equal(ctrl.status, "violated");
});

test("a settled cycle keeps its status until it resets", () => {
    const runtime = load();
    const { ctrl } = build(runtime, {
        status: "fulfilled",
        settled: "true",
        period: "86400",
        recurrence: "daily",
        cycles: "0"
    });

    runtime.advance(18000);
    ctrl.update();

    assert.equal(ctrl.status, "fulfilled", "the budget ran out but the cycle was settled");

    runtime.advance(86400);
    ctrl.update();

    assert.equal(ctrl.cycle, 2);
    assert.equal(ctrl.status, "violated", "the settlement does not carry into the next cycle");
});

test("pausing stops the clock and resuming continues where it stopped", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { status: "fulfilled" });

    ctrl.execute("pause");

    assert.equal(ctrl.status, "paused");
    assert.equal(host.getAttribute("data-paused"), "true");
    assert.ok(host.classList.contains("wx-sla-paused"));
    assert.equal(button(host, "pause").disabled, true);
    assert.equal(button(host, "resume").disabled, false);

    runtime.advance(36000);
    ctrl.update();

    assert.equal(ctrl.remaining, 10800, "ten hours passed but none of them were spent");
    assert.equal(ctrl.status, "paused");

    ctrl.execute("resume");
    runtime.advance(1800);
    ctrl.update();

    assert.equal(ctrl.remaining, 9000);
    assert.equal(ctrl.status, "fulfilled");
    assert.equal(host.getAttribute("data-paused"), null);
});

test("settling releases the clock and disables its own action", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { status: "fulfilled" });

    ctrl.execute("pause");
    ctrl.execute("fulfill");

    assert.equal(ctrl.status, "fulfilled");
    assert.equal(host.getAttribute("data-settled"), "true");
    assert.equal(host.getAttribute("data-paused"), null);
    assert.equal(button(host, "fulfill").disabled, true);
});

test("a transition is reported and persisted to the endpoint the widget was given", async () => {
    const calls = [];
    const runtime = load({
        fetch: async (uri, init) => {
            calls.push({ uri, body: JSON.parse(init.body) });
            return { ok: true, json: async () => ({ elapsed: 60, paused: true }) };
        }
    });
    const { ctrl, host } = build(runtime, { status: "fulfilled", actionUri: "/api/v1/sla" });
    const actions = [];

    host.addEventListener("webexpress.webui.sla.action", (e) => actions.push(e.detail.action));

    ctrl.execute("pause");

    assert.deepEqual(actions, ["pause"]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].uri, "/api/v1/sla");
    assert.deepEqual(calls[0].body, { action: "pause" });

    // let the response settle, then check the widget adopted the server's answer
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(ctrl.remaining, 14340);
});

test("a failing request is reported rather than swallowed", async () => {
    const runtime = load({ fetch: async () => ({ ok: false, status: 500, statusText: "Internal Server Error" }) });
    const { ctrl, host } = build(runtime, { status: "fulfilled", actionUri: "/api/v1/sla" });
    const errors = [];

    host.addEventListener("webexpress.webui.data.error", (e) => errors.push(e.detail));

    ctrl.execute("pause");
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(errors.length, 1);
    assert.equal(errors[0].action, "pause");
    assert.match(errors[0].error, /500/);
});

test("without an endpoint the widget reports the transition and nothing else", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { status: "fulfilled" });
    const actions = [];

    host.addEventListener("webexpress.webui.sla.action", (e) => actions.push(e.detail.action));

    ctrl.execute("pause");
    ctrl.execute("pause");

    assert.deepEqual(actions, ["pause"], "a repeated pause changes nothing and is not reported");
});

test("the labels are localised into the visitor's language", () => {
    const runtime = load({ language: "de" });
    const { ctrl, host } = build(runtime, { status: "fulfilled", cycles: "5", period: "86400", recurrence: "daily" });

    runtime.advance(14400);
    ctrl.update();

    assert.equal(host.querySelector(".wx-sla-status").textContent, "Verletzt");
    assert.equal(host.querySelector(".wx-sla-cycle").textContent, "Zyklus 1 von 5");
    assert.equal(host.querySelector(".wx-sla-remaining").textContent, "1 Std. überfällig");
    assert.equal(button(host, "pause").getAttribute("aria-label"), "SLA pausieren");
});

test("a widget that is not live never starts a timer", () => {
    const runtime = load();
    const { ctrl } = build(runtime, { status: "fulfilled", live: "false" });

    runtime.advance(36000);

    assert.equal(ctrl.remaining, 10800, "the state is exactly the one the server rendered");

    ctrl.destroy();
});

test("the meter and its accessible reading follow the consumed budget", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { status: "fulfilled" });

    runtime.advance(3600);
    ctrl.update();

    const meter = host.querySelector(".wx-sla-meter");

    assert.equal(host.querySelector(".wx-sla-meter-value").style.width, "50%");
    assert.equal(meter.getAttribute("aria-valuenow"), "50");
    assert.equal(meter.getAttribute("aria-valuetext"), "50% - 2 h");
});
