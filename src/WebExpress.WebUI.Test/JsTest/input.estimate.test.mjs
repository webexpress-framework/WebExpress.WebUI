/**
 * Headless unit tests for the estimate input control.
 *
 * They cover the scale parsing and default, the initial value and its active
 * chip, the value get/set round trip and the clear behaviour, exercised through
 * the public surface of the control.
 *
 * Run with Node 18 or newer from the jstest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, webuiAsset } from "./harness.mjs";

function load() {
    return loadWebUi({ extraFiles: [webuiAsset("webexpress.webui.input.estimate.js")] });
}

/**
 * Builds a configured host element and constructs the control on it.
 * @param {object} runtime - The loaded runtime.
 * @param {object} data - The data attributes to seed.
 * @returns {{ctrl: object, host: object}} The control and its host.
 */
function build(runtime, data) {
    const host = runtime.document.createElement("div");
    Object.assign(host.dataset, data || {});
    const ctrl = new runtime.wx.InputEstimateCtrl(host);
    return { ctrl, host };
}

test("parses the configured scale and renders one chip per value", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { scale: "1, 2, 3, 5, 8" });
    assert.deepEqual(ctrl.scale, [1, 2, 3, 5, 8]);
    assert.equal(host.querySelectorAll(".wx-estimate-chip").length, 5);
});

test("falls back to the rounded fibonacci default when no scale is set", () => {
    const runtime = load();
    const { ctrl } = build(runtime, {});
    assert.deepEqual(ctrl.scale, [0, 1, 2, 3, 5, 8, 13, 20, 40, 100]);
});

test("seeds the value and marks the matching chip active", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { scale: "1,2,3,5,8", value: "3" });
    assert.equal(ctrl.value, 3);
    assert.equal(host.querySelector(".wx-estimate-chip.active").textContent, "3");
});

test("an unset value selects no chip", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { scale: "1,2,3,5,8" });
    assert.equal(ctrl.value, null);
    assert.equal(host.querySelector(".wx-estimate-chip.active"), null);
});

test("setting the value moves the active chip and dispatches a change", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { scale: "1,2,3,5,8", value: "3" });

    let dispatched = null;
    host.addEventListener(runtime.wx.Event.CHANGE_VALUE_EVENT, (e) => { dispatched = e; });

    ctrl.value = 8;
    assert.equal(ctrl.value, 8);
    assert.equal(host.querySelector(".wx-estimate-chip.active").textContent, "8");
    assert.ok(dispatched, "a change event should have been dispatched");
});

test("clear removes the value and the active chip", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { scale: "1,2,3,5,8", value: "5" });
    ctrl.clear();
    assert.equal(ctrl.value, null);
    assert.equal(host.querySelector(".wx-estimate-chip.active"), null);
});

test("applies per-chip colors and marks the container colored", () => {
    const runtime = load();
    const host = runtime.document.createElement("div");
    host.dataset.scale = "1,2,3";
    // index-aligned lists: a css class for the system colors, an inline style for
    // the user color in the middle
    host.setAttribute("data-colors-css", "bg-success||bg-danger");
    host.setAttribute("data-colors-style", "|background:#ffcc00;|");

    new runtime.wx.InputEstimateCtrl(host);

    const chips = host.querySelectorAll(".wx-estimate-chip");
    assert.equal(chips.length, 3);
    assert.ok(chips[0].classList.contains("bg-success"));
    assert.ok(chips[2].classList.contains("bg-danger"));
    assert.ok(String(chips[1].style.cssText).includes("background:#ffcc00"));
    assert.ok(host.querySelector(".wx-estimate-container").classList.contains("wx-estimate-colored"));
    // the consumed attributes are stripped from the host
    assert.equal(host.getAttribute("data-colors-css"), null);
});

test("an uncolored scale does not mark the container colored", () => {
    const runtime = load();
    const { host } = build(runtime, { scale: "1,2,3" });
    assert.equal(host.querySelector(".wx-estimate-container").classList.contains("wx-estimate-colored"), false);
});
