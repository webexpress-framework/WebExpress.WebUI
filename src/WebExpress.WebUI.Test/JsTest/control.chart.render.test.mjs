/**
 * Headless unit tests for the chart control. The chart is drawn by the framework itself, so
 * the tests pin what a page relies on: the data attributes the server renders become the
 * configuration, every form draws one mark per value, the legend toggles series without
 * repainting the others, the tooltip answers pointer and keyboard, the hidden table carries
 * the values, and an unsupported type is reported instead of thrown.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, webuiAsset, keyEvent, pointerEvent } from "./harness.mjs";

/**
 * Loads a runtime with the chart control.
 * @returns {object} The loaded runtime.
 */
function load() {
    return loadWebUi({ browser: true, extraFiles: [webuiAsset("webexpress.webui.chart.js")] });
}

/**
 * Builds a host carrying the given attributes and constructs the control on it.
 * @param {object} runtime - The loaded runtime.
 * @param {object} attrs - The attributes to set on the host.
 * @param {object} [config] - The constructor configuration.
 * @returns {{ctrl: object, host: object}} The control and its host.
 */
function build(runtime, attrs, config) {
    const host = runtime.document.createElement("div");
    for (const [name, value] of Object.entries(attrs || {})) {
        host.setAttribute(name, value);
    }
    runtime.document.body.appendChild(host);
    const ctrl = new runtime.wx.ChartCtrl(host, config);
    return { ctrl, host };
}

/**
 * Tells whether the tooltip is on screen; it fades, so it is shown by a class, not removed.
 * @param {object} tip - The tooltip element.
 * @returns {boolean} True when the tooltip is shown.
 */
function shown(tip) {
    return tip.classList.contains("wx-chart-tooltip-visible");
}

/**
 * The attributes ControlChart renders for a bar chart with two datasets.
 */
const SERVER_BAR = {
    "data-type": "bar",
    "data-labels": "[\"Jan\",\"Feb\",\"Mar\"]",
    "data-title-display": "true",
    "data-title-text": "Sales",
    "data-scale-y-begin-at-zero": "true",
    "data-scale-y-title": "Units",
    "data-dataset-count": "2",
    "data-dataset0-label": "2024",
    "data-dataset0-data": "[12,19,3]",
    "data-dataset1-label": "2025",
    "data-dataset1-data": "[8,11,5]",
    "data-dataset1-background-color": "gold",
    "data-dataset1-border-width": "2"
};

test("the attributes the server renders become the configuration and leave the markup", () => {
    const rt = load();
    const { ctrl, host } = build(rt, SERVER_BAR);
    const cfg = ctrl.currentConfig;

    assert.equal(cfg.type, "bar");
    assert.deepEqual(JSON.parse(JSON.stringify(cfg.data.labels)), ["Jan", "Feb", "Mar"]);
    assert.equal(cfg.data.datasets.length, 2);
    assert.equal(cfg.data.datasets[1].backgroundColor, "gold");
    assert.equal(cfg.data.datasets[1].borderWidth, 2);
    assert.equal(cfg.options.plugins.title.text, "Sales");
    assert.equal(cfg.options.scales.y.title.text, "Units");
    assert.equal(host.getAttribute("data-dataset1-data"), null, "the dataset attributes are consumed");
    assert.equal(host.getAttribute("data-type"), null);
    assert.ok(host.classList.contains("wx-chart"));
});

test("fill and point style of a dataset reach the configuration", () => {
    const rt = load();
    const { ctrl } = build(rt, {
        "data-type": "line",
        "data-dataset0-label": "A",
        "data-dataset0-data": "[1,2]",
        "data-dataset0-fill": "origin",
        "data-dataset0-point-style": "rectRot"
    });
    const ds = ctrl.currentConfig.data.datasets[0];

    assert.equal(ds.fill, "origin");
    assert.equal(ds.pointStyle, "rectRot");
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-area").length, 1, "the filled line draws its area");
});

test("data-datasets and data-options configure the chart in full", () => {
    const rt = load();
    const { ctrl } = build(rt, {
        "data-type": "line",
        "data-labels": "[\"a\",\"b\"]",
        "data-datasets": "[{\"label\":\"X\",\"data\":[1,2]},{\"label\":\"Y\",\"data\":[3,4]}]",
        "data-options": "{\"plugins\":{\"legend\":{\"display\":false}}}"
    });

    assert.equal(ctrl.currentConfig.data.datasets.length, 2);
    assert.equal(ctrl.currentConfig.options.plugins.legend.display, false);
    assert.equal(ctrl._legendEl.hidden, true, "the legend follows the option even for two series");
});

test("the scale steps in 1, 2 or 5 and keeps a fixed bound exactly", () => {
    const rt = load();
    const nice = rt.wx.ChartCtrl.niceScale;
    const plain = (s) => JSON.parse(JSON.stringify(s));

    assert.deepEqual(plain(nice(0, 19, 6).ticks), [0, 5, 10, 15, 20]);
    assert.deepEqual(plain(nice(0.1, 0.87, 5)), { min: 0, max: 1, step: 0.2, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1] });
    const fixed = nice(2, 14, 6, 0, 18);
    assert.equal(fixed.min, 0);
    assert.equal(fixed.max, 18, "the fixed maximum is not rounded up");
    assert.equal(fixed.ticks[fixed.ticks.length - 1], 18);
    assert.deepEqual(plain(nice(5, 5, 5).ticks).length > 1, true, "a flat series still gets a scale");
});

test("a bar chart draws one bar per value and a legend for its two series", () => {
    const rt = load();
    const { ctrl, host } = build(rt, SERVER_BAR);

    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-bar").length, 6);
    assert.equal(host.querySelector(".wx-chart-title").textContent, "Sales");
    const items = host.querySelectorAll(".wx-chart-legend-item");
    assert.equal(items.length, 2);
    assert.equal(ctrl._legendEl.hidden, false);
    assert.equal(ctrl.chart.getAttribute("aria-label"), "Sales");
});

test("the author's colors ride in custom properties, the palette in a class", () => {
    const rt = load();
    const { ctrl } = build(rt, SERVER_BAR);
    const bars = ctrl.chart.querySelectorAll(".wx-chart-bar");

    assert.ok(bars[0].classList.contains("wx-chart-color-0"));
    assert.equal(bars[0].style["--wx-chart-fill"], undefined, "a dataset without colors stays on the palette");
    const gold = bars.filter((b) => b.classList.contains("wx-chart-color-1"));
    assert.equal(gold.length, 3);
    assert.equal(gold[0].style["--wx-chart-fill"], "gold");
    assert.equal(gold[0].style["--wx-chart-border-width"], "2px");
});

test("a single series needs no legend unless the author asks for one", () => {
    const rt = load();
    const single = { "data-type": "line", "data-labels": "[\"a\",\"b\"]", "data-dataset-label": "Only", "data-dataset-data": "[1,2]" };

    assert.equal(build(rt, single).ctrl._legendEl.hidden, true);
    assert.equal(build(rt, { ...single, "data-legend-display": "true" }).ctrl._legendEl.hidden, false);
});

test("toggling a series in the legend hides it and leaves the others their color", () => {
    const rt = load();
    const { ctrl, host } = build(rt, SERVER_BAR);

    host.querySelectorAll(".wx-chart-legend-item")[0].click();

    const bars = ctrl.chart.querySelectorAll(".wx-chart-bar");
    assert.equal(bars.length, 3, "only the second series is left");
    assert.ok(bars.every((b) => b.classList.contains("wx-chart-color-1")), "color follows the series, not its rank");
    const items = host.querySelectorAll(".wx-chart-legend-item");
    assert.equal(items[0].getAttribute("aria-pressed"), "false");
    assert.equal(items[1].getAttribute("aria-pressed"), "true");
});

test("the hidden table reads the values per label and series", () => {
    const rt = load();
    const { host } = build(rt, SERVER_BAR);
    const table = host.querySelector("table");

    assert.equal(table.querySelector("caption").textContent, "Sales");
    assert.deepEqual(table.querySelector("thead").querySelectorAll("th").map((th) => th.textContent), ["Category", "2024", "2025"]);
    const rows = table.querySelector("tbody").querySelectorAll("tr");
    assert.equal(rows.length, 3);
    assert.deepEqual(rows[1].childNodes.map((c) => c.textContent), ["Feb", "19", "11"]);
});

test("the arrow keys walk the categories and read them out", () => {
    const rt = load();
    const { ctrl, host } = build(rt, SERVER_BAR);

    ctrl.chart.dispatchEvent(keyEvent("ArrowRight"));
    ctrl.chart.dispatchEvent(keyEvent("ArrowRight"));

    const tip = host.querySelector(".wx-chart-tooltip");
    assert.ok(shown(tip));
    assert.equal(tip.querySelector(".wx-chart-tooltip-title").textContent, "Feb");
    assert.deepEqual(tip.querySelectorAll(".wx-chart-tooltip-value").map((v) => v.textContent), ["19", "11"]);
    assert.equal(ctrl._live.textContent, "Feb - 2024: 19, 2025: 11");
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-active").length, 2, "both bars of the category are highlighted");

    ctrl.chart.dispatchEvent(keyEvent("Escape"));
    assert.ok(!shown(tip));
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-active").length, 0);
});

test("the pointer finds the category under it", () => {
    const rt = load();
    const { ctrl, host } = build(rt, { ...SERVER_BAR, "data-height": "300" });
    // the drawing is 400 x 300 in the stub; the svg reports the same box on screen
    ctrl.chart._rect = { left: 0, top: 0, width: 400, height: 300 };
    const last = ctrl._targets[2];

    ctrl.chart.dispatchEvent(pointerEvent({ type: "pointermove", clientX: last.at, clientY: 150 }));
    assert.equal(host.querySelector(".wx-chart-tooltip-title").textContent, "Mar");

    ctrl.chart.dispatchEvent(pointerEvent({ type: "pointermove", clientX: 2, clientY: 2 }));
    assert.ok(!shown(host.querySelector(".wx-chart-tooltip")), "outside the plot nothing is shown");
});

test("a pie draws a slice per positive value and legends its labels", () => {
    const rt = load();
    const { ctrl, host } = build(rt, {
        "data-type": "pie",
        "data-labels": "[\"Red\",\"Blue\",\"Yellow\",\"None\"]",
        "data-dataset0-label": "Votes",
        "data-dataset0-data": "[12,6,6,0]"
    });

    const slices = ctrl.chart.querySelectorAll(".wx-chart-arc");
    assert.equal(slices.length, 3);
    assert.ok(slices[1].classList.contains("wx-chart-color-1"), "a slice takes the palette slot of its label");
    assert.equal(host.querySelectorAll(".wx-chart-legend-item").length, 4);

    ctrl.chart.dispatchEvent(keyEvent("ArrowRight"));
    assert.equal(host.querySelector(".wx-chart-tooltip-value").textContent.replace(/\s/g, ""), "12(50%)");

    host.querySelectorAll(".wx-chart-legend-item")[0].click();
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-arc").length, 2, "a hidden label leaves the pie");
});

test("the pointer finds the slice under it", () => {
    const rt = load();
    const { ctrl, host } = build(rt, {
        "data-type": "doughnut",
        "data-height": "300",
        "data-labels": "[\"A\",\"B\"]",
        "data-dataset0-data": "[1,1]"
    });
    ctrl.chart._rect = { left: 0, top: 0, width: 400, height: 300 };

    // the first slice runs clockwise from the top, so its ring sits to the right of the center
    ctrl.chart.dispatchEvent(pointerEvent({ type: "pointermove", clientX: 200 + 110, clientY: 150 }));
    assert.equal(host.querySelector(".wx-chart-tooltip-title").textContent, "A");
    ctrl.chart.dispatchEvent(pointerEvent({ type: "pointermove", clientX: 200, clientY: 150 }));
    assert.ok(!shown(host.querySelector(".wx-chart-tooltip")), "the hole of the doughnut is empty");
});

test("every supported form draws its marks", () => {
    const rt = load();
    const labels = "[\"a\",\"b\",\"c\"]";
    const radar = build(rt, { "data-type": "radar", "data-labels": labels, "data-dataset0-data": "[1,2,3]", "data-dataset1-data": "[3,2,1]" }).ctrl;
    const polar = build(rt, { "data-type": "polarArea", "data-labels": labels, "data-dataset0-data": "[1,2,3]" }).ctrl;
    const scatter = build(rt, { "data-type": "scatter", "data-dataset0-data": "[[1,2],[3,4],[5,1]]" }).ctrl;
    const bubble = build(rt, { "data-type": "bubble", "data-dataset0-data": "[[1,1,15],[0.5,0.5,10]]" }).ctrl;
    const horizontal = build(rt, { "data-type": "bar", "data-index-axis": "y", "data-labels": labels, "data-dataset0-data": "[1,-2,3]" }).ctrl;

    assert.equal(radar.chart.querySelectorAll(".wx-chart-radar").length, 2);
    assert.equal(polar.chart.querySelectorAll(".wx-chart-polar").length, 3);
    assert.equal(scatter.chart.querySelectorAll(".wx-chart-dot").length, 3);
    assert.equal(bubble.chart.querySelectorAll(".wx-chart-bubble").map((b) => b.getAttribute("r")).join(), "15,10");
    assert.equal(horizontal.chart.querySelectorAll(".wx-chart-bar").length, 3);
    assert.equal(horizontal.chart.querySelectorAll(".wx-chart-zero").length, 1, "a scale across zero marks its zero line");
});

test("a stacked bar chart piles the series on one bar per category", () => {
    const rt = load();
    const { ctrl } = build(rt, {
        "data-type": "bar",
        "data-labels": "[\"a\",\"b\"]",
        "data-options": "{\"scales\":{\"y\":{\"stacked\":true}}}",
        "data-dataset0-data": "[1,2]",
        "data-dataset1-data": "[3,4]"
    });

    assert.deepEqual(ctrl._targets.map((t) => t.rows.length), [2, 2]);
    // the bars come per series: the first series' a and b, then the second series' a and b
    const [lowA, , highA] = ctrl.chart.querySelectorAll(".wx-chart-bar");
    const xOf = (bar) => bar.getAttribute("d").match(/^M([\d.]+)/)[1];
    assert.equal(xOf(lowA), xOf(highA), "both segments share the category's bar position");
    assert.ok(lowA.getAttribute("d").includes("Q") === false, "only the outer segment is rounded");
    assert.ok(highA.getAttribute("d").includes("Q"), "the outer segment carries the rounded end");
});

test("an unsupported type is reported, not thrown", () => {
    const rt = load();
    const { ctrl, host } = build(rt, SERVER_BAR);
    const errors = [];
    host.addEventListener(rt.wx.Event.DATA_ERROR_EVENT, (e) => errors.push(e.detail.error));

    ctrl.type("pyramid");

    assert.equal(errors.length, 1);
    assert.match(errors[0], /unsupported chart type: pyramid/);
    assert.equal(ctrl.currentConfig.type, "bar", "the chart keeps its type");
});

test("the fluent api waits for load when autoload is off and then draws once", () => {
    const rt = load();
    const { ctrl, host } = build(rt, { "data-autoload": "false" });
    const arrived = [];
    host.addEventListener(rt.wx.Event.DATA_ARRIVED_EVENT, (e) => arrived.push(e.detail.chart));

    ctrl.labels(["x", "y"]).datasets([{ label: "S", data: [1, 2] }]).options({ scales: { y: { beginAtZero: true } } });

    assert.equal(ctrl.chart, null, "nothing is drawn before load");
    ctrl.load();
    assert.equal(arrived.length, 1);
    assert.equal(arrived[0], ctrl.chart, "the event hands over the svg the chart is drawn in");
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-line").length, 1);

    ctrl.addDataset({ label: "T", data: [2, 1] });
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-line").length, 2, "a change to a drawn chart redraws it");
    ctrl.removeDataset(0);
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-line").length, 1);
});

test("a chart without data says so", () => {
    const rt = load();
    const { ctrl } = build(rt, { "data-type": "line" });

    assert.equal(ctrl.chart.querySelector(".wx-chart-empty").textContent, "No data");
});

test("destroy removes the drawing", () => {
    const rt = load();
    const { ctrl, host } = build(rt, SERVER_BAR);

    ctrl.destroy();

    assert.equal(ctrl.chart, null);
    assert.equal(host.childNodes.length, 0);
});

test("a load lets every mark enter from where its value starts", () => {
    const rt = load();
    const { ctrl } = build(rt, {
        "data-type": "bar",
        "data-labels": "[\"a\",\"b\",\"c\"]",
        "data-dataset0-data": "[1,-2,3]"
    });
    const bars = ctrl.chart.querySelectorAll(".wx-chart-bar");

    assert.ok(bars[0].classList.contains("wx-chart-enter-grow-up"));
    assert.ok(bars[1].classList.contains("wx-chart-enter-grow-down"), "a negative bar grows downwards");
    assert.equal(bars[0].style["--wx-chart-delay"], undefined, "the first bar starts at once");
    assert.equal(bars[2].style["--wx-chart-delay"], "480ms", "the last bar starts when the stagger ends");
});

test("a line draws itself, its area fades in with a gradient and its points pop up", () => {
    const rt = load();
    const { ctrl } = build(rt, {
        "data-type": "line",
        "data-labels": "[\"a\",\"b\"]",
        "data-dataset0-data": "[1,2]",
        "data-dataset0-fill": "origin"
    });
    const line = ctrl.chart.querySelector(".wx-chart-line");
    const area = ctrl.chart.querySelector(".wx-chart-area");

    assert.ok(line.classList.contains("wx-chart-enter-draw"));
    assert.equal(line.getAttribute("pathLength"), "1", "the dash runs over a normalized length");
    assert.ok(area.classList.contains("wx-chart-enter-fade"));
    assert.match(area.style.fill, /^url\(#wx-chart-\d+-area-0\)$/);
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-enter-pop").length, 2);
});

test("a resize redraws at once, without an entry", () => {
    const rt = load();
    const { ctrl } = build(rt, SERVER_BAR);

    ctrl.resize();

    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-enter-grow-up").length, 0);
    assert.ok(!ctrl.chart.querySelector(".wx-chart-series").classList.contains("wx-chart-settle"));
});

test("a legend toggle settles the chart and lets a series shown again grow back in", () => {
    const rt = load();
    const { ctrl, host } = build(rt, SERVER_BAR);
    const toggle = () => host.querySelectorAll(".wx-chart-legend-item")[0].click();

    toggle();
    assert.ok(ctrl.chart.querySelector(".wx-chart-series").classList.contains("wx-chart-settle"));
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-enter-grow-up").length, 0, "hiding lets nothing enter");

    toggle();
    const entering = ctrl.chart.querySelectorAll(".wx-chart-enter-grow-up");
    assert.equal(entering.length, 3, "only the series shown again enters");
    assert.ok(entering.every((bar) => bar.classList.contains("wx-chart-color-0")));
});

test("a doughnut names its total in the hole and the share of the hovered slice", () => {
    const rt = load();
    const { ctrl, host } = build(rt, {
        "data-type": "doughnut",
        "data-height": "300",
        "data-labels": "[\"A\",\"B\",\"C\"]",
        "data-dataset0-label": "Users",
        "data-dataset0-data": "[50,30,20]"
    });
    const value = () => host.querySelector(".wx-chart-center-value").textContent;
    const label = () => host.querySelector(".wx-chart-center-label").textContent;

    assert.equal(value(), "100");
    assert.equal(label(), "Users");

    ctrl.chart.dispatchEvent(keyEvent("ArrowRight"));
    assert.equal(value().replace(/\s/g, ""), "50%");
    assert.equal(label(), "A");
    assert.ok(ctrl.chart.querySelector(".wx-chart-arc").style["--wx-chart-dx"], "the slice knows where to step out");

    ctrl.chart.dispatchEvent(keyEvent("Escape"));
    assert.equal(value(), "100", "the total comes back at rest");
});

test("the guide glides from category to category once it is on screen", () => {
    const rt = load();
    const { ctrl } = build(rt, SERVER_BAR);

    ctrl.chart.dispatchEvent(keyEvent("ArrowRight"));
    const guide = ctrl.chart.querySelector(".wx-chart-guide");
    assert.ok(guide.classList.contains("wx-chart-hover-band"));
    assert.ok(!guide.classList.contains("wx-chart-guide-follow"), "a guide that appears does not fly in");
    const first = guide.getAttribute("x");

    ctrl.chart.dispatchEvent(keyEvent("ArrowRight"));
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-guide").length, 1, "the same guide moves on");
    assert.ok(guide.classList.contains("wx-chart-guide-follow"));
    assert.notEqual(guide.getAttribute("x"), first);
    assert.ok(ctrl._tooltip.classList.contains("wx-chart-tooltip-follow"), "the tooltip glides along");
});

test("a linear trend is fitted by least squares and a moving average fills its window first", () => {
    const rt = load();
    const Chart = rt.wx.ChartCtrl;
    const plain = (v) => JSON.parse(JSON.stringify(v));

    assert.deepEqual(plain(Chart.linearRegression([{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }])), { slope: 2, intercept: 1 });
    assert.equal(Chart.linearRegression([{ x: 1, y: 1 }, { x: 1, y: 5 }]), null, "a vertical cloud has no slope");
    assert.equal(Chart.linearRegression([{ x: 1, y: 1 }]), null);
    assert.deepEqual(plain(Chart.movingAverage([2, 4, 6, 8], 2)), [null, 3, 5, 7]);
});

test("a line chart draws its trend, reads it in the tooltip and lists it in the table", () => {
    const rt = load();
    const { ctrl, host } = build(rt, {
        "data-type": "line",
        "data-labels": "[\"a\",\"b\",\"c\",\"d\"]",
        "data-dataset0-label": "Sales",
        "data-dataset0-data": "[1,3,2,6]",
        "data-dataset0-trendline": "linear"
    });

    assert.deepEqual(JSON.parse(JSON.stringify(ctrl.currentConfig.data.datasets[0].trendline)), { type: "linear" });
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-trend").length, 1);
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-trend-halo").length, 0, "a line chart needs no halo");

    ctrl.chart.dispatchEvent(keyEvent("ArrowRight"));
    const names = host.querySelectorAll(".wx-chart-tooltip-row").map((row) => row.childNodes[1].textContent);
    assert.deepEqual(names, ["Sales", "Sales \u00b7 Trend"]);
    // y = 0.9 + 1.4 x over the points (0,1) (1,3) (2,2) (3,6); the number follows the locale
    const number = (text) => parseFloat(text.replace(",", "."));
    assert.equal(number(host.querySelectorAll(".wx-chart-tooltip-value")[1].textContent), 0.9);
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-hover-dot").length, 1, "the trend gets no hover dot");

    const table = host.querySelector("table");
    assert.deepEqual(table.querySelector("thead").querySelectorAll("th").map((th) => th.textContent), ["Category", "Sales", "Sales (Trend)"]);
    assert.equal(number(table.querySelector("tbody").querySelectorAll("tr")[3].childNodes[2].textContent), 5.1);
});

test("a moving average from the server attributes starts once its window is full", () => {
    const rt = load();
    const { ctrl, host } = build(rt, {
        "data-type": "bar",
        "data-labels": "[\"a\",\"b\",\"c\",\"d\",\"e\"]",
        "data-dataset0-data": "[2,4,6,8,10]",
        "data-dataset0-trendline": "moving-average",
        "data-dataset0-trendline-period": "3"
    });

    assert.equal(host.getAttribute("data-dataset0-trendline"), null, "the trend attributes are consumed");
    const trend = ctrl.chart.querySelector(".wx-chart-trend");
    assert.equal(trend.getAttribute("d").split(/[ML]/).filter((s) => s.trim()).length, 3, "three averages over five values");
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-trend-halo").length, 1, "over bars the trend is lifted off with a halo");
});

test("a scatter chart draws its trend, a pie ignores one", () => {
    const rt = load();
    const scatter = build(rt, { "data-type": "scatter", "data-dataset0-data": "[[1,2],[2,3],[3,5]]", "data-dataset0-trendline": "linear" }).ctrl;
    const pie = build(rt, { "data-type": "pie", "data-labels": "[\"a\",\"b\"]", "data-dataset0-data": "[1,2]", "data-dataset0-trendline": "linear" }).ctrl;

    assert.equal(scatter.chart.querySelectorAll(".wx-chart-trend").length, 1);
    assert.equal(pie.chart.querySelectorAll(".wx-chart-trend").length, 0, "a slice has no course to trend along");
});

test("a hidden series takes its trend along", () => {
    const rt = load();
    const { ctrl, host } = build(rt, { ...SERVER_BAR, "data-dataset0-trendline": "linear" });

    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-trend").length, 1);
    host.querySelectorAll(".wx-chart-legend-item")[0].click();
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-trend").length, 0);
});

/**
 * Reads the cubic segments of a path as [start, control 1, control 2, end] point lists.
 * @param {string} d - The path data.
 * @returns {Array<Array<{x: number, y: number}>>} The segments.
 */
function cubics(d) {
    const numbers = d.match(/-?[\d.]+(?:e-?\d+)?/g).map(Number);
    const points = [];
    for (let i = 0; i < numbers.length; i += 2) {
        points.push({ x: numbers[i], y: numbers[i + 1] });
    }
    const segments = [];
    for (let i = 0; i + 3 < points.length; i += 3) {
        segments.push(points.slice(i, i + 4));
    }
    return segments;
}

test("a line may run as a bezier curve or as a monotone curve, read from the server attributes", () => {
    const rt = load();
    const line = (attrs) => build(rt, {
        "data-type": "line",
        "data-labels": "[\"a\",\"b\",\"c\",\"d\",\"e\"]",
        "data-dataset0-data": "[1,9,2,8,3]",
        ...attrs
    }).ctrl;

    const straight = line({});
    const bezier = line({ "data-dataset0-curve": "bezier" });
    const tense = line({ "data-dataset0-curve": "bezier", "data-dataset0-tension": "0.8" });
    const monotone = line({ "data-dataset0-curve": "monotone" });

    assert.ok(!straight.chart.querySelector(".wx-chart-line").getAttribute("d").includes("C"));
    assert.equal(bezier.currentConfig.data.datasets[0].tension, 0.4, "a bezier curve without a tension takes the smooth default");
    assert.equal(tense.currentConfig.data.datasets[0].tension, 0.8);
    assert.equal(monotone.currentConfig.data.datasets[0].cubicInterpolationMode, "monotone");
    assert.equal(cubics(bezier.chart.querySelector(".wx-chart-line").getAttribute("d")).length, 4);
    assert.equal(cubics(monotone.chart.querySelector(".wx-chart-line").getAttribute("d")).length, 4);
});

test("a monotone curve never swings past its points, a bezier curve stays inside the plot", () => {
    const rt = load();
    const line = (attrs) => build(rt, {
        "data-type": "line",
        "data-height": "300",
        "data-labels": "[\"a\",\"b\",\"c\",\"d\",\"e\",\"f\"]",
        "data-dataset0-data": "[0,10,10,0,10,10]",
        "data-scale-y-min": "0",
        "data-scale-y-max": "10",
        ...attrs
    }).ctrl;

    // the plateau at 10 would make a bezier curve bulge over the top of the scale
    for (const [start, c1, c2, end] of cubics(line({ "data-dataset0-curve": "monotone" }).chart.querySelector(".wx-chart-line").getAttribute("d"))) {
        const low = Math.min(start.y, end.y) - 1e-6;
        const high = Math.max(start.y, end.y) + 1e-6;
        assert.ok(c1.y >= low && c1.y <= high && c2.y >= low && c2.y <= high, "the control points stay between their end points");
    }
    const tense = line({ "data-dataset0-curve": "bezier", "data-dataset0-tension": "1" });
    const top = Math.min(...tense.chart.querySelectorAll(".wx-chart-grid line").map((l) => Number(l.getAttribute("y1"))));
    for (const [, c1, c2] of cubics(tense.chart.querySelector(".wx-chart-line").getAttribute("d"))) {
        assert.ok(c1.y >= top - 1e-6 && c2.y >= top - 1e-6, "the control points stay inside the plot");
    }
});

test("a dataset on yAxisID y1 is measured on a second value axis at the right edge", () => {
    const rt = load();
    const { ctrl } = build(rt, {
        "data-type": "bar",
        "data-height": "300",
        "data-labels": "[\"a\",\"b\",\"c\"]",
        "data-datasets": "[{\"label\":\"Units\",\"data\":[10,20,30]},{\"label\":\"Revenue\",\"type\":\"line\",\"yAxisID\":\"y1\",\"data\":[500,1000,1500]}]",
        "data-options": "{\"scales\":{\"y1\":{\"position\":\"right\",\"title\":{\"display\":true,\"text\":\"EUR\"}}}}"
    });
    const ticks = ctrl.chart.querySelectorAll(".wx-chart-tick");
    const secondary = ticks.filter((t) => t.classList.contains("wx-chart-tick-secondary"));
    // whole ticks only, so every separator - grouping in any locale - can go
    const valueOf = (t) => Number(t.textContent.replace(/[^\d-]/g, ""));
    const primaryValues = ticks.filter((t) => !secondary.includes(t) && t.getAttribute("text-anchor") === "end").map(valueOf);

    assert.ok(secondary.length > 1, "the second axis has its own ticks");
    assert.ok(Math.max(...secondary.map(valueOf)) >= 1500, "the second axis spans the line");
    assert.ok(Math.max(...primaryValues) < 100, "the first axis keeps the scale of the bars");
    const rightmost = Math.max(...ticks.filter((t) => !secondary.includes(t)).map((t) => Number(t.getAttribute("x"))));
    assert.ok(secondary.every((t) => Number(t.getAttribute("x")) > rightmost), "the second axis stands right of the plot");
    assert.ok(ctrl.chart.querySelectorAll(".wx-chart-axis-title").some((t) => t.textContent === "EUR" && /rotate\(90 /.test(t.getAttribute("transform"))));

    // on one shared axis the bar of 30 would shrink to a sliver beneath the line's 1500
    const bottom = Number(ctrl.chart.querySelector(".wx-chart-axis-line").getAttribute("y1"));
    const bar = ctrl._targets[2].rows.find((r) => !r.line);
    assert.ok(bottom - bar.pos.y > (bottom - 10) / 2, "the bar is measured on its own axis");
});

test("the dataset type the server renders draws a line over the bars", () => {
    const rt = load();
    const { ctrl, host } = build(rt, {
        "data-type": "bar",
        "data-labels": "[\"a\",\"b\",\"c\"]",
        "data-dataset-count": "2",
        "data-dataset0-data": "[3,5,4]",
        "data-dataset1-data": "[4,4,4]",
        "data-dataset1-type": "line"
    });

    assert.equal(ctrl.currentConfig.data.datasets[1].type, "line");
    assert.equal(ctrl.currentConfig.data.datasets[0].type, undefined, "the first dataset takes the form of the chart");
    assert.equal(host.getAttribute("data-dataset1-type"), null, "the attribute is consumed");
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-bar").length, 3, "only the first dataset draws bars");
    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-line").length, 1, "the second dataset draws a line");
});

test("the axis id the server renders puts the dataset on the second value axis", () => {
    const rt = load();
    const { ctrl, host } = build(rt, {
        "data-type": "bar",
        "data-labels": "[\"a\",\"b\"]",
        "data-dataset-count": "2",
        "data-dataset0-data": "[1,2]",
        "data-dataset1-data": "[500,900]",
        "data-dataset1-y-axis-id": "y1"
    });

    assert.equal(ctrl.currentConfig.data.datasets[1].yAxisID, "y1");
    assert.equal(ctrl.currentConfig.data.datasets[0].yAxisID, undefined, "the first dataset stays on the default axis");
    assert.equal(host.getAttribute("data-dataset1-y-axis-id"), null, "the attribute is consumed");
    assert.ok(ctrl.chart.querySelectorAll(".wx-chart-tick-secondary").length > 1, "the second axis is drawn");
});

test("the second axis settings the server renders shape the second axis", () => {
    const rt = load();
    const { ctrl, host } = build(rt, {
        "data-type": "line",
        "data-height": "300",
        "data-labels": "[\"a\",\"b\"]",
        "data-dataset-count": "2",
        "data-dataset0-data": "[1,2]",
        "data-dataset1-data": "[500,900]",
        "data-dataset1-y-axis-id": "y1",
        "data-scale-y1-title": "EUR",
        "data-scale-y1-begin-at-zero": "true",
        "data-scale-y1-max": "2000"
    });
    const y1 = ctrl.currentConfig.options.scales.y1;

    assert.equal(y1.title.text, "EUR");
    assert.equal(y1.beginAtZero, true);
    assert.equal(y1.max, 2000);
    assert.equal(host.getAttribute("data-scale-y1-title"), null, "the attributes are consumed");
    // whole ticks only, so every separator - grouping in any locale - can go
    const values = ctrl.chart.querySelectorAll(".wx-chart-tick-secondary").map((t) => Number(t.textContent.replace(/[^\d-]/g, "")));
    assert.equal(Math.min(...values), 0, "the second axis begins at zero");
    assert.equal(Math.max(...values), 2000, "the second axis ends at its maximum");
    assert.ok(ctrl.chart.querySelectorAll(".wx-chart-axis-title").some((t) => t.textContent === "EUR"));
});

test("without a second scale every dataset shares the one value axis", () => {
    const rt = load();
    const { ctrl } = build(rt, SERVER_BAR);

    assert.equal(ctrl.chart.querySelectorAll(".wx-chart-tick-secondary").length, 0);
});
