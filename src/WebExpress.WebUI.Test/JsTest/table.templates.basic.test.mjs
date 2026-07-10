/**
 * Focused tests for the plain table cell templates in templates/default.js:
 * "text", "numeric" and "combo". They pin the option contract the REST
 * column template descriptors emit (colorCss, placeholder, min/max/step and
 * the embedded options JSON string), so a renamed option breaks here rather
 * than silently in the browser.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the runtime with the default table templates. The editable branches
 * end in a SmartEditCtrl, so the smartedit control is loaded and the sibling
 * input controls its read view walks over are stubbed, mirroring the other
 * template tests.
 * @returns {object} The loaded runtime.
 */
function loadRuntime() {
    const rt = loadWebUi({
        browser: true,
        extraFiles: [
            "webexpress.webui.smartedit.js",
            "templates/default.js"
        ]
    });

    for (const name of ["InputSelectionCtrl", "InputMoveCtrl", "InputCalendarCtrl", "InputDateCtrl", "InputTagCtrl", "InputRatingCtrl", "InputColorCtrl", "InputTrafficLightCtrl", "EditorCtrl"]) {
        if (!rt.wx[name]) { rt.wx[name] = class { }; }
    }

    return rt;
}

/**
 * Renders one cell through the registered template.
 * @param {object} rt - The loaded runtime.
 * @param {string} type - The template type to render.
 * @param {string} value - The cell value.
 * @param {object} opts - The renderer options.
 * @returns {object} The rendered node (or empty string).
 */
function render(rt, type, value, opts = {}) {
    const tmpl = rt.wx.TableTemplates.get(type);
    assert.ok(tmpl, `the "${type}" template is registered`);
    return tmpl.fn(value, null, { id: "row1" }, {}, "col", opts);
}

test("text renders a read-only span with the color class", () => {
    const rt = loadRuntime();
    const node = render(rt, "text", "Mighty pirate", { colorCss: "text-info" });

    const span = node.firstChild;
    assert.equal(span.tagName, "SPAN");
    assert.equal(span.textContent, "Mighty pirate");
    assert.ok(span.classList.contains("text-info"), "the colorCss option lands on the span");
});

test("text renders an input with placeholder and value in edit mode", () => {
    const rt = loadRuntime();
    // smartedit swaps the editor for its display view on construction; the
    // renderer output is what is under test here
    rt.wx.SmartEditCtrl = class { };
    const node = render(rt, "text", "Guybrush", { editable: true, placeholder: "Enter name" });

    const input = node.firstChild;
    assert.equal(input.tagName, "INPUT");
    assert.equal(input.value, "Guybrush");
    assert.equal(input.placeholder, "Enter name");
});

test("numeric renders the value read-only and honors the range in edit mode", () => {
    const rt = loadRuntime();
    // smartedit swaps the editor for its display view on construction; the
    // renderer output is what is under test here
    rt.wx.SmartEditCtrl = class { };

    const readOnly = render(rt, "numeric", "42", {});
    assert.equal(readOnly.firstChild.textContent, "42");

    const editable = render(rt, "numeric", "42", { editable: true, min: 0, max: 100, step: 5 });
    const input = editable.firstChild;
    assert.equal(input.tagName, "INPUT");
    assert.equal(input.getAttribute("min"), "0");
    assert.equal(input.getAttribute("max"), "100");
    assert.equal(input.getAttribute("step"), "5");
});

test("combo resolves the label from the embedded options JSON read-only", () => {
    const rt = loadRuntime();
    const options = JSON.stringify([
        { value: "pirate", text: "Pirate" },
        { value: "ghost", text: "Ghost" }
    ]);

    const matched = render(rt, "combo", "pirate", { options: options });
    assert.equal(matched.textContent, "Pirate", "a matching item shows its label");

    const unmatched = render(rt, "combo", "governor", { options: options });
    assert.equal(unmatched.textContent, "governor", "an unmatched value falls back to the raw value");
});

test("combo renders a select with the embedded options in edit mode", () => {
    const rt = loadRuntime();
    // the smartedit read view iterates select.options, which the headless dom
    // stub does not model; the renderer output is what is under test here
    rt.wx.SmartEditCtrl = class { };
    const options = JSON.stringify([
        { value: "pirate", text: "Pirate" },
        { value: "ghost", text: "Ghost" }
    ]);

    const node = render(rt, "combo", "ghost", { editable: true, options: options });
    const select = node.firstChild;

    assert.equal(select.tagName, "SELECT");
    assert.equal(select.childNodes.length, 2);
    assert.equal(select.childNodes[0].value, "pirate");
    assert.equal(select.childNodes[1].value, "ghost");
    assert.equal(select.childNodes[1].selected, true, "the current value is preselected");
});
