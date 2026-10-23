/**
 * Headless unit tests for the read-only heat map control. They cover the grid
 * parsing, the cell-per-value rendering, the gradient colour interpolation, the
 * axis labels, the empty-cell placeholder and the values round trip, exercised
 * through the public surface of the control.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, webuiAsset } from "./harness.mjs";

/**
 * Loads a runtime with the heat map control.
 * @returns {object} The loaded runtime.
 */
function load() {
    return loadWebUi({ extraFiles: [webuiAsset("webexpress.webui.heatmap.js")] });
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
    const ctrl = new runtime.wx.HeatMapCtrl(host);
    return { ctrl, host };
}

test("renders a cell per value and interpolates the default gradient across the data range", () => {
    const runtime = load();
    // two rows, bounds auto-computed as min 0 / max 10
    const { host } = build(runtime, { values: "0,10;5,5" });

    const cells = host.querySelectorAll(".wx-heatmap-cell");
    assert.equal(cells.length, 4);

    // the minimum maps to the low colour, the maximum to the high colour, the
    // midpoint to the exact half-interpolation of the default endpoints
    assert.equal(cells[0].style.backgroundColor, "rgb(222, 235, 247)");
    assert.equal(cells[1].style.backgroundColor, "rgb(8, 48, 107)");
    assert.equal(cells[2].style.backgroundColor, "rgb(115, 142, 177)");
});

test("renders the optional axis labels and the corner", () => {
    const runtime = load();
    const { host } = build(runtime, { values: "1,2;3,4", rowLabels: "A,B", colLabels: "x,y" });

    assert.equal(host.querySelectorAll(".wx-heatmap-col-label").length, 2);
    assert.equal(host.querySelectorAll(".wx-heatmap-row-label").length, 2);
    assert.equal(host.querySelectorAll(".wx-heatmap-corner").length, 1);
});

test("renders a non-numeric cell as an empty placeholder", () => {
    const runtime = load();
    const { host } = build(runtime, { values: "1,x;3,4" });

    assert.equal(host.querySelectorAll(".wx-heatmap-cell").length, 4);
    assert.equal(host.querySelectorAll(".wx-heatmap-cell-empty").length, 1);
});

test("the values setter accepts a 2D array and re-renders", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { values: "1,2;3,4" });

    ctrl.values = [[1], [2], [3]];

    assert.deepEqual(ctrl.values, [[1], [2], [3]]);
    assert.equal(host.querySelectorAll(".wx-heatmap-cell").length, 3);
});
