/**
 * Headless contract test for the InputSelectionCtrl control (wx-webui-input-selection).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.input.selection.js",
    selector: "wx-webui-input-selection",
    ctrl: "InputSelectionCtrl"
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

/**
 * Builds a selection with two named groups and a divider between them.
 */
function grouped() {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.input.selection.js"] });
    const host = rt.createElement("div");
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.InputSelectionCtrl(host);
    ctrl.options = [
        { type: "header", content: "Fruit" },
        { id: "apple", label: "Apple", content: "Apple" },
        { id: "pear", label: "Pear", content: "Pear" },
        { type: "divider" },
        { type: "header", content: "Vegetables" },
        { id: "leek", label: "Leek", content: "Leek" },
        { type: "divider" },
        { id: "salt", label: "Salt", content: "Salt" }
    ];
    return { rt, ctrl };
}

/**
 * Returns the menu rows as a compact shape: "H" for a header, "-" for a divider, the id of an option.
 */
function shape(ctrl) {
    return [...ctrl._dropdownoptions.querySelectorAll("li")].map(li =>
        li.classList.contains("dropdown-header") ? "H" : li.classList.contains("dropdown-divider") ? "-" : li.dataset.id);
}

test("the full menu keeps every header and divider", () => {
    const { ctrl } = grouped();
    assert.deepEqual(shape(ctrl), ["H", "apple", "pear", "-", "H", "leek", "-", "salt"]);
});

test("a filter that empties a group takes its header and the divider with it", () => {
    const { ctrl } = grouped();
    ctrl._filterInput.value = "le";
    ctrl.render();
    // "Apple" and "Leek" match; the fruit group keeps its header, the vegetables keep theirs,
    // and the divider before the now empty tail is gone
    assert.deepEqual(shape(ctrl), ["H", "apple", "-", "H", "leek"]);

    ctrl._filterInput.value = "salt";
    ctrl.render();
    assert.deepEqual(shape(ctrl), ["salt"], "no group is left, so no caption and no rule remains");
});

test("choosing the last option of a group removes its header from the menu", () => {
    const { ctrl } = grouped();
    ctrl.value = ["leek"];
    assert.deepEqual(shape(ctrl), ["H", "apple", "pear", "-", "salt"]);
});
