/**
 * Headless contract test for the OverflowCtrl control (wx-webui-overflow).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle. The
 * focused tests below cover the visibility of the "more" trigger, which must
 * track the overflow menu: a visible button over an empty menu is the bug they
 * guard against.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.overflow.js",
    selector: "wx-webui-overflow",
    ctrl: "OverflowCtrl"
});

/**
 * Loads a runtime with the overflow control available and builds a host with a
 * given number of plain button items. The host reports a wide clientWidth so the
 * distribution logic sees the items as fitting (the DOM stub has zero geometry,
 * which would otherwise read as a permanent overflow).
 * @param {number} count - The number of button items to create.
 * @returns {{ rt: object, host: object }} The runtime and the host element.
 */
function loadOverflow(count) {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.overflow.js"] });
    const host = rt.document.createElement("div");
    for (let i = 0; i < count; i++) {
        const button = rt.document.createElement("button");
        button.className = "btn";
        button.textContent = "B" + i;
        host.appendChild(button);
    }
    Object.defineProperty(host, "clientWidth", { value: 1000, configurable: true });
    rt.document.body.appendChild(host);
    return { rt, host };
}

test("wx-webui-overflow hides the more button once restore empties the menu", () => {
    const { rt, host } = loadOverflow(3);
    const ctrl = new rt.wx.OverflowCtrl(host);

    // simulate an earlier overflow by pushing the last item into the menu
    ctrl._representInOverflow(ctrl._items[ctrl._items.length - 1]);
    assert.equal(ctrl._moreButton.style.display, "inline-flex", "the more button shows while an item is in overflow");
    assert.equal(ctrl._menu.querySelectorAll(".wx-overflow-menu-item").length, 1, "the menu holds the overflowed item");

    ctrl.restore();

    assert.equal(ctrl._menu.querySelectorAll(".wx-overflow-menu-item").length, 0, "restore empties the menu");
    assert.equal(ctrl._moreButton.style.display, "none", "the more button is hidden when the menu is empty");
});

test("wx-webui-overflow keeps the more button while a forced item stays in overflow", () => {
    const { rt, host } = loadOverflow(3);
    // the middle item is pinned into the overflow menu regardless of width
    host.children[1].dataset.overflow = "force";

    const ctrl = new rt.wx.OverflowCtrl(host);
    ctrl.restore();

    assert.equal(ctrl._menu.querySelectorAll(".wx-overflow-menu-item").length, 1, "the forced item remains in the menu");
    assert.equal(ctrl._moreButton.style.display, "inline-flex", "the more button stays visible for a forced overflow item");
});
