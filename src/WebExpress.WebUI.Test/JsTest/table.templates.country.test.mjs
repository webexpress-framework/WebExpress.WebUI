/**
 * Focused tests for the "country" table cell template in templates/default.js. They pin
 * both ways a column describes its countries: the nested option elements of a server
 * template, named in the request language, and the options json of a rest descriptor,
 * where an entry without a label is named by the browser.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the runtime with the country display and the default table templates. The
 * editable branch ends in a SmartEditCtrl, whose read view is not under test here.
 * @returns {object} The loaded runtime.
 */
function loadRuntime() {
    const rt = loadWebUi({
        browser: true,
        extraFiles: [
            "webexpress.webui.country.js",
            "webexpress.webui.input.selection.js",
            "templates/default.js"
        ]
    });
    rt.wx.SmartEditCtrl = class { };
    rt.document.documentElement.setAttribute("lang", "de");
    return rt;
}

/**
 * Renders one cell through the country template.
 * @param {object} rt - The loaded runtime.
 * @param {string} value - The cell value.
 * @param {object} opts - The renderer options.
 * @returns {object} The rendered node (or empty string).
 */
function render(rt, value, opts = {}) {
    const tmpl = rt.wx.TableTemplates.get("country");
    assert.ok(tmpl, "the \"country\" template is registered");
    return tmpl.fn(value, null, { id: "row1" }, {}, "country", opts);
}

/**
 * Builds the option elements a server template nests.
 * @param {object} rt - The loaded runtime.
 * @param {Array<Array<string>>} entries - The code and name of each option.
 * @returns {Array<HTMLElement>} The option elements.
 */
function children(rt, entries) {
    return entries.map(([code, label]) => {
        const child = rt.createElement("div");
        child.setAttribute("id", code);
        child.setAttribute("data-label", label);
        return child;
    });
}

test("an empty read-only cell stays empty", () => {
    const rt = loadRuntime();
    assert.equal(render(rt, ""), "");
});

test("a read-only cell shows each country with the name the server sent", () => {
    const rt = loadRuntime();

    const node = render(rt, "de;fr", { children: children(rt, [["DE", "Deutschland"], ["FR", "Frankreich"]]) });

    assert.equal(node.className, "wx-country-list");
    assert.equal(node.childNodes.length, 2, "one display per code");
    assert.equal(node.childNodes[0].textContent, "Deutschland");
    assert.equal(node.childNodes[0].querySelector("i").className, "wx-flag wx-flag-de");
    assert.equal(node.childNodes[1].textContent, "Frankreich");
});

test("a code the options do not name is named by the browser, and an invalid one is skipped", () => {
    const rt = loadRuntime();

    const node = render(rt, "JP;??", {});

    assert.equal(node.childNodes.length, 1);
    assert.equal(node.childNodes[0].textContent, "Japan");
});

test("a hidden name is handed to the display", () => {
    const rt = loadRuntime();

    const node = render(rt, "SE", { showName: "false", children: children(rt, [["SE", "Schweden"]]) });

    assert.equal(node.childNodes[0].firstChild.getAttribute("title"), "Schweden");
});

test("an editable cell offers the rest options as flagged, sorted picker entries", () => {
    const rt = loadRuntime();
    const options = JSON.stringify([{ id: "fr", label: "Frankreich" }, { id: "AT" }, { id: "xx1" }]);

    const node = render(rt, "AT", { editable: true, multiselection: "true", options: options });

    const ctrl = node.firstChild._wx_controller;
    assert.deepEqual(
        JSON.parse(JSON.stringify(ctrl.options.map((x) => [x.id, x.label, x.icon]))),
        [["FR", "Frankreich", "wx-flag wx-flag-fr"], ["AT", "Österreich", "wx-flag wx-flag-at"]]
            .sort((a, b) => a[1].localeCompare(b[1], "de")),
        "an unlabeled code is named in the page language and an invalid one is dropped"
    );
    assert.equal(ctrl.multiSelect, true);
    assert.equal(ctrl.value, "AT");
});
