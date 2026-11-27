/**
 * Behavioural tests for the click semantics of a multiple tile selection: by default a plain
 * click selects the clicked tile alone and Ctrl+click toggles it; with
 * data-toggle-on-click a plain click toggles, the way a checkbox does. Shift+click selects
 * a range in both modes, from the tile clicked or toggled last and over the tiles on
 * screen only.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Builds a multiple tile selection.
 * @param {boolean} toggleOnClick - Whether a plain click toggles.
 * @param {object} options - The labels of the tiles by id and whether the picker is searchable.
 * @returns {object} The picker control.
 */
function build(toggleOnClick, { labels = { a: "A", b: "B", c: "C" }, searchable = false } = {}) {
    const rt = loadWebUi({ extraFiles: ["webexpress.webui.input.tile.js"] });
    const form = rt.createElement("form");
    rt.document.body.appendChild(form);

    const element = rt.createElement("div");
    element.classList.add("wx-webui-input-tile");
    element.setAttribute("name", "Classes");
    element.dataset.multiselect = "true";
    if (toggleOnClick) {
        element.dataset.toggleOnClick = "true";
    }
    if (searchable) {
        element.dataset.searchable = "true";
    }
    form.appendChild(element);

    for (const [id, label] of Object.entries(labels)) {
        const card = rt.createElement("div");
        card.classList.add("wx-tile-card");
        card.id = id;
        card.dataset.label = label;
        element.appendChild(card);
    }

    rt.wx.Controller.createInstances(form);

    return rt.wx.Controller.getInstanceByElement(element);
}

/**
 * Returns the selected ids in tile order, since a range appends to the selection in the
 * order it was made.
 * @param {object} picker - The picker control.
 * @returns {string} The sorted ids, separated by semicolons.
 */
function selected(picker) {
    return picker.value.split(";").filter(Boolean).sort().join(";");
}

/**
 * Clicks the rendered card of a tile.
 * @param {object} picker - The picker control.
 * @param {string} id - The tile id.
 * @param {object} keys - The modifier keys of the click.
 */
function click(picker, id, keys = {}) {
    const container = picker._tileList.firstChild;
    const nodes = Array.from(container.children || container.childNodes);
    const card = nodes.find((n) => n.dataset && n.dataset.tileId === id);

    assert.ok(card, `the card of tile ${id} is rendered`);
    card.dispatchEvent({ type: "click", ctrlKey: false, metaKey: false, shiftKey: false, ...keys });
}

test("a plain click replaces a multiple selection by default", () => {
    const picker = build(false);

    click(picker, "a");
    click(picker, "b");

    assert.equal(picker.value, "b");
    assert.equal(picker.toggleOnClick, false);
});

test("ctrl+click adds and removes a tile by default", () => {
    const picker = build(false);

    click(picker, "a");
    click(picker, "b", { ctrlKey: true });
    assert.equal(picker.value, "a;b");

    click(picker, "a", { ctrlKey: true });
    assert.equal(picker.value, "b");
});

test("a plain click toggles a tile with toggle on click", () => {
    const picker = build(true);

    click(picker, "a");
    click(picker, "c");
    assert.equal(picker.value, "a;c", "the second click adds instead of replacing");
    assert.equal(picker._hidden.value, "a;c", "and it is what the form submits");

    click(picker, "a");
    assert.equal(picker.value, "c", "clicking a selected tile takes it out");
});

test("shift+click still selects a range with toggle on click", () => {
    const picker = build(true);

    click(picker, "a");
    click(picker, "c", { shiftKey: true });

    assert.equal(picker.value, "a;b;c");
});

test("a range takes in only the tiles a search leaves on screen", () => {
    const picker = build(false, { labels: { a: "Red one", b: "Blue", c: "Red two" }, searchable: true });

    picker._searchInput.value = "red";
    picker._searchInput.dispatchEvent({ type: "input", target: picker._searchInput });
    click(picker, "a");
    click(picker, "c", { shiftKey: true });

    assert.equal(selected(picker), "a;c", "the hidden tile between them stays unselected");
});

test("a range takes in only the tiles the filter leaves on screen", () => {
    const picker = build(false);
    picker._filterSource = "Decade";
    picker._filterValue = "1970s";
    picker.tiles = picker.tiles.map(t => ({ ...t, filterValue: t.id === "b" ? "1960s" : "1970s" }));

    click(picker, "a");
    click(picker, "c", { shiftKey: true });

    assert.equal(selected(picker), "a;c");
});

test("a tile toggled with the keyboard becomes the anchor of the next range", () => {
    const picker = build(false, { labels: { a: "A", b: "B", c: "C", d: "D" } });

    click(picker, "a");
    const nodes = Array.from(picker._tileList.firstChild.children);
    const d = nodes.find((n) => n.dataset.tileId === "d");
    d.dispatchEvent({ type: "keyup", key: " " });
    click(picker, "c", { shiftKey: true });

    assert.equal(selected(picker), "a;c;d", "the range runs from d, not from a");
});

test("successive shift+clicks extend from the same anchor", () => {
    const picker = build(false, { labels: { a: "A", b: "B", c: "C", d: "D" } });

    click(picker, "b");
    click(picker, "d", { shiftKey: true });
    click(picker, "a", { shiftKey: true });

    assert.equal(selected(picker), "a;b;c;d");
});

test("the anchor stays on its tile when the tiles are reloaded in another order", () => {
    const picker = build(false, { labels: { a: "A", b: "B", c: "C", d: "D" } });

    click(picker, "a");
    picker.tiles = picker.tiles.map(t => ({ ...t })).reverse();
    click(picker, "c", { shiftKey: true });

    assert.equal(selected(picker), "a;b;c", "the range runs from a at its new place, not from the first tile");
});

test("the toggle mode can be switched at runtime", () => {
    const picker = build(false);

    picker.toggleOnClick = true;
    click(picker, "a");
    click(picker, "b");

    assert.equal(picker.value, "a;b");
});
