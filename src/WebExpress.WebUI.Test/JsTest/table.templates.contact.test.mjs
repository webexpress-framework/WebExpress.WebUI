/**
 * Focused tests for the "email" and "phone" table cell templates in templates/default.js:
 * read-only they hand the cell to the display control, editable to a field inside the
 * inline editor, with the options a REST descriptor or a server template sends.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the runtime with the contact controls and the default table templates. The editable
 * branch ends in a SmartEditCtrl, whose read view is not under test here.
 * @returns {object} The loaded runtime.
 */
function loadRuntime() {
    const rt = loadWebUi({
        browser: true,
        extraFiles: [
            "webexpress.webui.email.js",
            "webexpress.webui.phone.js",
            "webexpress.webui.input.phone.js",
            "templates/default.js"
        ]
    });
    rt.wx.SmartEditCtrl = class { };
    return rt;
}

/**
 * Renders one cell through a registered template.
 * @param {object} rt - The loaded runtime.
 * @param {string} type - The template type.
 * @param {string} value - The cell value.
 * @param {object} opts - The renderer options.
 * @returns {object} The rendered node (or empty string).
 */
function render(rt, type, value, opts = {}) {
    const tmpl = rt.wx.TableTemplates.get(type);
    assert.ok(tmpl, `the "${type}" template is registered`);
    return tmpl.fn(value, null, { id: "row1" }, {}, "contact", opts);
}

test("an empty read-only cell stays empty", () => {
    const rt = loadRuntime();
    assert.equal(render(rt, "email", ""), "");
    assert.equal(render(rt, "phone", null), "");
});

test("a read-only e-mail cell links the address", () => {
    const rt = loadRuntime();

    const node = render(rt, "email", "grace@example.com");

    assert.equal(node.querySelector("a").getAttribute("href"), "mailto:grace@example.com");
});

test("an editable e-mail cell is an e-mail field with the placeholder", () => {
    const rt = loadRuntime();

    const node = render(rt, "email", "grace@example.com", { editable: true, placeholder: "name@example.com" });

    const input = node.firstChild;
    assert.equal(input.type, "email");
    assert.equal(input.value, "grace@example.com");
    assert.equal(input.placeholder, "name@example.com");
});

test("a read-only phone cell shows the flag and dials the number", () => {
    const rt = loadRuntime();

    const node = render(rt, "phone", "+4930123456");

    assert.equal(node.querySelector("i").className, "wx-flag wx-flag-de");
    assert.equal(node.querySelector("a").getAttribute("href"), "tel:+4930123456");
});

test("an editable phone cell is the phone field, starting in the configured country", () => {
    const rt = loadRuntime();

    const empty = render(rt, "phone", "", { editable: true, country: "CH" });
    assert.equal(empty.firstChild._wx_controller.country, "CH");

    const filled = render(rt, "phone", "+4930123456", { editable: true, country: "CH" });
    assert.equal(filled.firstChild._wx_controller.country, "DE", "a number names its own country");
    assert.equal(filled.firstChild._wx_controller.value, "+4930123456");
});
