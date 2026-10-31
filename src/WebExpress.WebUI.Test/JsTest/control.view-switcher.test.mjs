/**
 * Unit tests for the shared presentation switch (webexpress.webui.ViewSwitcher).
 *
 * It is the one implementation behind every view switch in the framework - the
 * view control, the file view and the link surface all build it - so what it
 * guarantees is guaranteed on all of them: one entry per presentation, exactly
 * one of them marked, a single delegated listener, and no report for a
 * selection that changes nothing.
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads a runtime with the switch.
 * @returns {object} The loaded runtime.
 */
function load() {
    return loadWebUi({ browser: true, extraFiles: ["webexpress.webui.view.switcher.js"] });
}

/**
 * Builds a switch over two presentations, recording what it reports.
 * @param {object} rt - The loaded runtime.
 * @param {object} [options] - Overrides for the switch options.
 * @returns {object} The switch and the recorded selections.
 */
function build(rt, options = {}) {
    const selected = [];
    const switcher = new rt.wx.ViewSwitcher(Object.assign({
        views: [
            { name: "list", label: "List", icon: "list" },
            { name: "graph", label: "Graph", icon: "share-nodes" }
        ],
        onSelect: (name) => selected.push(name)
    }, options));

    rt.document.body.appendChild(switcher.element);

    return { switcher, selected };
}

test("every presentation becomes one entry, in the order it was declared", () => {
    const rt = load();
    const { switcher } = build(rt);

    assert.deepEqual(
        switcher.element.querySelectorAll("button").map((item) => item.getAttribute("data-view-tab")),
        ["list", "graph"]);
    assert.deepEqual(
        switcher.element.querySelectorAll("span").map((span) => span.textContent),
        ["List", "Graph"]);
});

test("the first presentation is the selected one until a host says otherwise", () => {
    const rt = load();
    const { switcher } = build(rt);

    assert.equal(switcher.active, "list");
    assert.ok(switcher.itemOf("list").classList.contains("wx-view-switcher-active"));
    assert.equal(switcher.itemOf("list").getAttribute("aria-pressed"), "true");
    assert.equal(switcher.itemOf("graph").getAttribute("aria-pressed"), "false");
});

test("a host may open the switch on a presentation of its choosing", () => {
    const rt = load();
    const { switcher } = build(rt, { active: "graph" });

    assert.ok(switcher.itemOf("graph").classList.contains("wx-view-switcher-active"));
});

test("exactly one entry is marked at a time", () => {
    const rt = load();
    const { switcher } = build(rt);

    switcher.active = "graph";

    assert.equal(switcher.element.querySelectorAll(".wx-view-switcher-active").length, 1);
    assert.ok(switcher.itemOf("graph").classList.contains("wx-view-switcher-active"));
});

test("a click reports the presentation the user picked", () => {
    const rt = load();
    const { switcher, selected } = build(rt);

    switcher.element.dispatchEvent({ type: "click", target: switcher.itemOf("graph") });

    assert.deepEqual(selected, ["graph"]);
});

test("picking the presentation that is already open reports nothing", () => {
    const rt = load();
    const { switcher, selected } = build(rt);

    switcher.element.dispatchEvent({ type: "click", target: switcher.itemOf("list") });

    // a host that reloaded on every click would reload on a click that changed
    // nothing, which is what the guard is for
    assert.deepEqual(selected, []);
});

test("a click beside the entries reports nothing", () => {
    const rt = load();
    const { switcher, selected } = build(rt);

    switcher.element.dispatchEvent({ type: "click", target: switcher.element });

    assert.deepEqual(selected, []);
});

test("setting the selection reflects it without reporting it back to the host", () => {
    const rt = load();
    const { switcher, selected } = build(rt);

    switcher.active = "graph";

    // the host set it, so telling the host about it would be an echo it would
    // have to guard against
    assert.deepEqual(selected, []);
});

test("a switch over one presentation steps aside, because there is nothing to choose", () => {
    const rt = load();
    const { switcher } = build(rt, { views: [{ name: "tile", label: "Tiles", icon: "grid" }] });

    assert.equal(switcher.element.hasAttribute("hidden"), true);
    assert.equal(switcher.active, "tile", "it still knows what is shown");
});

test("a switch that grows a second presentation comes back", () => {
    const rt = load();
    const { switcher } = build(rt, { views: [{ name: "tile", label: "Tiles" }] });

    switcher.views = [{ name: "tile", label: "Tiles" }, { name: "list", label: "List" }];

    assert.equal(switcher.element.hasAttribute("hidden"), false);
    assert.deepEqual(switcher.views, ["tile", "list"]);
});

test("rebuilding the entries keeps the selection when the presentation is still offered", () => {
    const rt = load();
    const { switcher } = build(rt, { active: "graph" });

    switcher.views = [
        { name: "list", label: "List" },
        { name: "graph", label: "Graph" },
        { name: "timeline", label: "Timeline" }
    ];

    assert.equal(switcher.active, "graph");
    assert.ok(switcher.itemOf("graph").classList.contains("wx-view-switcher-active"));
});

test("rebuilding falls back to the first entry when the selection is gone", () => {
    const rt = load();
    const { switcher } = build(rt, { active: "graph" });

    switcher.views = [{ name: "list", label: "List" }, { name: "timeline", label: "Timeline" }];

    assert.equal(switcher.active, "list", "a marked entry that no longer exists would leave nothing marked");
});

test("an entry carries its caption as a title, for a toolbar that hides the text", () => {
    const rt = load();
    const { switcher } = build(rt);

    assert.equal(switcher.itemOf("graph").title, "Graph");
});

test("an entry without a glyph is still an entry", () => {
    const rt = load();
    const { switcher } = build(rt, { views: [{ name: "a", label: "A" }, { name: "b", label: "B" }] });

    assert.equal(switcher.itemOf("a").querySelectorAll("i").length, 0);
    assert.equal(switcher.itemOf("a").textContent, "A");
});

test("an entry may carry an image instead of a glyph", () => {
    const rt = load();
    const { switcher } = build(rt, {
        views: [{ name: "a", label: "A", image: "/img/a.svg" }, { name: "b", label: "B" }]
    });

    assert.equal(switcher.itemOf("a").querySelectorAll("img").length, 1);
});

test("the entries listen once, on the group, rather than each for itself", () => {
    const rt = load();
    const { switcher } = build(rt);

    // a rebuilt set of entries would otherwise need listeners attached and
    // removed with it
    assert.equal((switcher.element._listeners.click || new Set()).size, 1);

    switcher.views = [{ name: "x", label: "X" }, { name: "y", label: "Y" }];

    assert.equal((switcher.element._listeners.click || new Set()).size, 1);
});
