/**
 * Headless unit tests for the panel rendering of the agreement control - the
 * shape it takes once agreements are added to it. They cover the summary, the
 * aggregated status the panel takes its colour from, and the refresh that
 * follows an agreement changing status.
 *
 * The agreements report a status change by bubbling an event; the DOM stub
 * dispatches without bubbling, so the tests raise the event on the panel
 * itself, which is exactly what a bubbled event delivers there.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, webuiAsset } from "./harness.mjs";

/**
 * Loads a runtime with the panel, the agreement it frames and the shipped
 * dictionaries.
 * @param {string} [language="en"] - The language the runtime translates into.
 * @returns {object} The loaded runtime.
 */
function load(language = "en") {
    const runtime = loadWebUi({
        browser: true,
        extraFiles: [
            webuiAsset("webexpress.webui.sla.js"),
            webuiAsset("i18n/en.js"),
            webuiAsset("i18n/de.js")
        ]
    });

    runtime.wx.I18N.setLanguage(language);

    return runtime;
}

/**
 * Builds a panel framing one agreement host per status.
 * @param {object} runtime - The loaded runtime.
 * @param {Array<string>} statuses - The status of each framed agreement.
 * @returns {{ctrl: object, host: object, items: Array<object>}} The control, its host and the agreements.
 */
function build(runtime, statuses) {
    const host = runtime.document.createElement("div");

    const summary = runtime.document.createElement("span");
    summary.className = "wx-sla-summary";
    host.appendChild(summary);

    const items = statuses.map((status) => {
        const item = runtime.document.createElement("div");
        item.className = "wx-sla";
        item.setAttribute("data-status", status);
        host.appendChild(item);
        return item;
    });

    runtime.document.body.appendChild(host);

    return { ctrl: new runtime.wx.SlaGroupCtrl(host), host, items };
}

test("the summary counts the agreements per status, worst first", () => {
    const runtime = load();
    const { host } = build(runtime, ["fulfilled", "at-risk", "violated", "fulfilled", "paused"]);

    assert.equal(host.querySelector(".wx-sla-summary").textContent, "1 violated, 1 at risk, 1 paused, 2 fulfilled");
});

test("the panel takes the colour of its worst agreement", () => {
    const runtime = load();
    const { host } = build(runtime, ["fulfilled", "at-risk", "violated"]);

    assert.ok(host.classList.contains("wx-sla-violated"));
    assert.ok(!host.classList.contains("wx-sla-at-risk"));
    assert.ok(!host.classList.contains("wx-sla-fulfilled"));
});

test("a single stopped clock does not make the whole container paused", () => {
    const runtime = load();
    const { host } = build(runtime, ["fulfilled", "paused"]);

    assert.ok(host.classList.contains("wx-sla-fulfilled"));

    const all = build(load(), ["paused", "paused"]);
    assert.ok(all.host.classList.contains("wx-sla-paused"), "every agreement paused does");
});

test("the summary follows an agreement that changes status", () => {
    const runtime = load();
    const { host, items } = build(runtime, ["fulfilled", "fulfilled"]);

    assert.equal(host.querySelector(".wx-sla-summary").textContent, "2 fulfilled");

    items[0].setAttribute("data-status", "violated");
    host.dispatchEvent({ type: runtime.wx.Event.SLA_STATUS_CHANGE_EVENT, detail: { status: "violated" } });

    assert.equal(host.querySelector(".wx-sla-summary").textContent, "1 violated, 1 fulfilled");
    assert.ok(host.classList.contains("wx-sla-violated"));
});

test("the summary follows a periodic agreement into its next cycle", () => {
    const runtime = load();
    const { host, items } = build(runtime, ["violated"]);

    items[0].setAttribute("data-status", "fulfilled");
    host.dispatchEvent({ type: runtime.wx.Event.SLA_CYCLE_EVENT, detail: { cycle: 2 } });

    assert.equal(host.querySelector(".wx-sla-summary").textContent, "1 fulfilled");
    assert.ok(host.classList.contains("wx-sla-fulfilled"));
});

test("an empty container says so rather than showing an empty count", () => {
    const runtime = load();
    const { host } = build(runtime, []);

    assert.equal(host.querySelector(".wx-sla-summary").textContent, "No agreements");
    assert.ok(host.classList.contains("wx-sla-fulfilled"));
});

test("the summary is localised into the visitor's language", () => {
    const runtime = load("de");
    const { host } = build(runtime, ["violated", "at-risk"]);

    assert.equal(host.querySelector(".wx-sla-summary").textContent, "1 verletzt, 1 gefährdet");
});

test("the panel stops listening when it is destroyed", () => {
    const runtime = load();
    const { ctrl, host, items } = build(runtime, ["fulfilled"]);

    ctrl.destroy();
    items[0].setAttribute("data-status", "violated");
    host.dispatchEvent({ type: runtime.wx.Event.SLA_STATUS_CHANGE_EVENT, detail: { status: "violated" } });

    assert.equal(host.querySelector(".wx-sla-summary").textContent, "1 fulfilled", "the summary is no longer updated");
});
