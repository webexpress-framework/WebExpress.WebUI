/**
 * Focused test for the SmartEditCtrl display view of an editable traffic-light
 * table cell (templates/default.js "traffic-light" with data-editable="true").
 * The inline editor is a webexpress.webui.InputTrafficLightCtrl, so the read-only
 * display state must render the read-only TrafficLightCtrl - not the raw token
 * text (the color name), which is what a missing _getView case falls back to.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the runtime with the real smartedit and both traffic-light controls.
 * _getView walks an instanceof chain over many sibling input controls before it
 * reaches the traffic-light case; those siblings are not under test here, so they
 * are stubbed as empty classes to keep the chain from dereferencing undefined.
 * @returns {object} The loaded runtime.
 */
function loadRuntime() {
    const rt = loadWebUi({
        browser: true,
        extraFiles: [
            "webexpress.webui.traffic.light.js",
            "webexpress.webui.input.traffic.light.js",
            "webexpress.webui.smartedit.js"
        ]
    });

    for (const name of ["InputSelectionCtrl", "InputMoveCtrl", "InputCalendarCtrl", "InputDateCtrl", "InputTagCtrl", "InputRatingCtrl", "InputColorCtrl", "EditorCtrl"]) {
        if (!rt.wx[name]) { rt.wx[name] = class { }; }
    }

    return rt;
}

/**
 * Builds the editable traffic-light cell the table template produces and wraps it
 * in a SmartEditCtrl, returning the rendered display view node.
 * @param {object} rt - The loaded runtime.
 * @param {string} value - The lamp token to seed.
 * @param {object} attrs - Optional { orientation, sizeClass } for the editor.
 * @returns {object} The display view element the SmartEditCtrl appended.
 */
function buildDisplayView(rt, value, attrs = {}) {
    const doc = rt.document;

    const container = doc.createElement("div");
    const editor = doc.createElement("div");
    editor.id = "wx_test";
    editor.dataset.orientation = attrs.orientation || "vertical";
    if (attrs.sizeClass) { editor.classList.add(attrs.sizeClass); }

    const inputCtrl = new rt.wx.InputTrafficLightCtrl(editor);
    inputCtrl.value = value;
    editor._wx_controller = inputCtrl;
    container.appendChild(editor);
    doc.body.appendChild(container);

    new rt.wx.SmartEditCtrl(container);

    return container.firstElementChild;
}

test("editable traffic-light cell shows the read-only light, not the color name", () => {
    const rt = loadRuntime();
    const view = buildDisplayView(rt, "green");

    assert.equal(view.tagName, "DIV", "the display view is a traffic-light element, not a text span");
    assert.ok(view.classList.contains("wx-traffic-light"), "the display view is a read-only traffic light");
    assert.equal(view.getAttribute("data-value"), "green", "the lit lamp reflects the value");
    assert.equal(view.textContent, "", "the display view carries no raw token text");
});

test("editable traffic-light cell carries orientation and size into the display", () => {
    const rt = loadRuntime();
    const view = buildDisplayView(rt, "red", { orientation: "horizontal", sizeClass: "wx-traffic-light-lg" });

    assert.ok(view.classList.contains("wx-traffic-light-horizontal"), "the horizontal orientation is preserved");
    assert.ok(view.classList.contains("wx-traffic-light-lg"), "the size is preserved");
    assert.equal(view.getAttribute("data-value"), "red", "the lit lamp reflects the value");
});
