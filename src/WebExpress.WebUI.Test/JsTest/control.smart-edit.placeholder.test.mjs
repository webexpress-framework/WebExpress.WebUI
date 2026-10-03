/**
 * Focused tests for the read view of an unset value.
 *
 * An empty value used to leave an empty read view: nothing to hover, nothing to
 * click, and therefore no way to reach the editor - on exactly the values that
 * most need one. The read view falls back to the editor's own placeholder
 * instead, which both names the field and gives the pencil an area to appear in.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the runtime with the real smartedit control. _getView walks an
 * instanceof chain over sibling input controls that are not under test here, so
 * they are stubbed to keep the chain from dereferencing undefined.
 * @returns {object} The loaded runtime.
 */
function loadRuntime() {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.smartedit.js"] });

    for (const name of ["InputSelectionCtrl", "InputMoveCtrl", "InputCalendarCtrl", "InputDateCtrl", "InputTagCtrl", "InputRatingCtrl", "InputColorCtrl", "InputBarcodeCtrl", "InputTrafficLightCtrl", "EditorCtrl"]) {
        if (!rt.wx[name]) { rt.wx[name] = class { }; }
    }

    return rt;
}

/**
 * Builds an inline editable cell around a plain text input.
 * @param {object} rt - The loaded runtime.
 * @param {object} [options] - value and placeholder of the editor.
 * @returns {object} The container and the control.
 */
function buildCell(rt, options = {}) {
    const container = rt.document.createElement("div");
    const input = rt.document.createElement("input");
    input.type = "text";
    input.value = options.value === undefined ? "" : options.value;

    if (options.placeholder) {
        input.setAttribute("placeholder", options.placeholder);
    }

    container.appendChild(input);
    rt.document.body.appendChild(container);

    return { container: container, ctrl: new rt.wx.SmartEditCtrl(container) };
}

test("an unset value reads as the placeholder of its editor", () => {
    const rt = loadRuntime();
    const { container } = buildCell(rt, { placeholder: "Description" });

    const view = container.querySelector(".wx-smart-edit-placeholder");
    assert.ok(view, "the placeholder stands in for the empty value");
    assert.equal(view.textContent, "Description");
});

test("a value that is set is shown as it is", () => {
    const rt = loadRuntime();
    const { container } = buildCell(rt, { value: "draft", placeholder: "Description" });

    assert.equal(container.querySelectorAll(".wx-smart-edit-placeholder").length, 0);
    assert.ok(container.textContent.includes("draft"));
});

test("an editor without a placeholder keeps the empty read view it always had", () => {
    const rt = loadRuntime();
    const { container } = buildCell(rt, {});

    // the stand-in is opt-in: a host that wants one names the field, and a
    // control that never had one does not suddenly grow visible text
    assert.equal(container.querySelectorAll(".wx-smart-edit-placeholder").length, 0);
    assert.equal(container.textContent.trim(), "");
});

test("the host may name the placeholder itself, for an editor that carries none", () => {
    const rt = loadRuntime();
    const container = rt.document.createElement("div");
    const input = rt.document.createElement("input");
    input.type = "text";
    input.value = "";
    container.appendChild(input);
    container.setAttribute("data-placeholder", "Add a note");
    rt.document.body.appendChild(container);

    new rt.wx.SmartEditCtrl(container);

    assert.equal(container.querySelector(".wx-smart-edit-placeholder").textContent, "Add a note");
});

test("clearing a value brings the placeholder back", () => {
    const rt = loadRuntime();
    const { container, ctrl } = buildCell(rt, { value: "draft", placeholder: "Description" });

    ctrl.value = "";

    assert.equal(container.querySelector(".wx-smart-edit-placeholder").textContent, "Description",
        "the field is named again rather than left blank");
});

test("the placeholder is a read view only and never becomes the saved value", () => {
    const rt = loadRuntime();
    const { container, ctrl } = buildCell(rt, { placeholder: "Description" });

    assert.equal(ctrl.value, "", "the control still reports the empty value the editor holds");
});
