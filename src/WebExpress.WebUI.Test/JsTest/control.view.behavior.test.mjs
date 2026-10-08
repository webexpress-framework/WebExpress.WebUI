/**
 * Behaviour test for the two layouts of the ViewCtrl control (wx-webui-view).
 * The layouts differ in how the views are offered - the default one through a
 * dropdown beside the title of the active view, the toggle group through the
 * shared presentation switch - so each layout is pinned to its own switch.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

const FILES = [
    "webexpress.webui.dropdown.js",
    "webexpress.webui.view.switcher.js",
    "webexpress.webui.view.js"
];

/**
 * Builds a host with two views. The stub does not mirror setAttribute into
 * dataset, so the view metadata is written through dataset.
 * @param {object} rt - The loaded runtime.
 * @param {string|null} layout - The layout to request, or null for the default.
 * @returns {object} The host element.
 */
function host(rt, layout) {
    const element = rt.createElement("div");

    if (layout) {
        element.dataset.layout = layout;
    }

    for (const title of ["List", "Chart"]) {
        const view = rt.createElement("div");
        view.classList.add("wx-view");
        view.dataset.title = title;
        element.appendChild(view);
    }

    rt.document.body.appendChild(element);

    return element;
}

test("the default layout offers the views through a dropdown", () => {
    const rt = loadWebUi({ browser: true, extraFiles: FILES });
    const ctrl = new rt.wx.ViewCtrl(host(rt, null));

    assert.ok(ctrl._viewDropdownCtrl, "the default layout switches through a dropdown");
    assert.equal(ctrl._switcher, null, "the segmented switch belongs to the toggle group");

    assert.deepEqual(
        ctrl._viewDropdownCtrl._items.map((item) => [item.text, item.uri]),
        [["List", "wx-switch:0"], ["Chart", "wx-switch:1"]],
        "every view is reachable, addressed by its position"
    );
});

test("the toggle group layout offers the views through the shared switch", () => {
    const rt = loadWebUi({ browser: true, extraFiles: FILES });
    const element = host(rt, "togglegroup");
    const ctrl = new rt.wx.ViewCtrl(element);

    assert.ok(ctrl._switcher, "the toggle group switches through the shared switch");
    assert.equal(ctrl._viewDropdownCtrl, null, "no dropdown is built beside it");

    assert.deepEqual(
        element.querySelectorAll(".wx-view-switcher-item").map((item) => item.getAttribute("data-view-tab")),
        ["0", "1"],
        "every view has its own entry"
    );
});

test("switching keeps the active view alone visible", () => {
    const rt = loadWebUi({ browser: true, extraFiles: FILES });
    const ctrl = new rt.wx.ViewCtrl(host(rt, null));

    ctrl.switchView(1);

    assert.equal(ctrl._activeViewIndex, 1);
    assert.ok(ctrl._viewsConfig[0].container.classList.contains("d-none"), "the former view is hidden");
    assert.ok(!ctrl._viewsConfig[1].container.classList.contains("d-none"), "the new view is shown");
});
