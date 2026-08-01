/**
 * Headless regression tests for the footprint of the date control.
 *
 * The control is regularly embedded in a container narrower than its calendar -
 * a toolbar, a filter row, the schedule's mini calendar. Two things then used to
 * escape the control and paint over whatever sat beside it:
 *
 *   - the text input refused to shrink below its intrinsic width and pushed the
 *     calendar icon out of the field, and
 *   - the popup, whose width is shrink-to-fit against that narrow field, stayed
 *     at its minimum while the 25em calendar inside it kept its width, so the
 *     surplus columns were drawn over the page behind it.
 *
 * There is no layout engine here, so the tests pin the declarations that carry
 * the fix rather than measuring boxes.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, webuiAsset } from "./harness.mjs";

/**
 * Builds a runtime with the date control and constructs one on a fresh host.
 * @returns {{rt: object, host: object}} The runtime and the host element.
 */
function build() {
    const rt = loadWebUi({ browser: true, extraFiles: [webuiAsset("webexpress.webui.input.date.js")] });
    const host = rt.document.createElement("div");
    rt.document.body.appendChild(host);
    new rt.wx.InputDateCtrl(host);

    return { rt, host };
}

test("the text of the field gives way so the calendar icon stays inside it", () => {
    const { host } = build();

    const input = host.querySelectorAll(".wx-date-input")[0];
    const icon = host.querySelectorAll(".wx-date-calendar-icon")[0];

    assert.ok(input && icon, "the field carries a text input and the icon");
    assert.equal(input.style.flex, "1 1 auto", "the text takes the free space");
    assert.equal(input.style.minWidth, "0", "and may shrink below its intrinsic width");
    assert.equal(icon.style.flex, "0 0 auto", "the icon is the fixed part of the field");
});

test("the popup is sized by the calendar rather than by the field it hangs under", () => {
    const { host } = build();

    const menu = host.querySelectorAll(".dropdown-menu")[0];
    assert.ok(menu, "the control carries a popup");

    assert.equal(menu.style.width, "max-content", "the box follows its content");
    assert.equal(menu.style.minWidth, "280px");
    assert.equal(menu.style.maxWidth, "min(92vw, 28rem)", "and is capped to the viewport");
});

test("the popup starts hidden", () => {
    const { host } = build();

    assert.equal(host.querySelectorAll(".dropdown-menu")[0].style.display, "none");
});

test("a narrow host does not change what the control emits", () => {
    const { rt } = build();

    // the schedule embeds the control in a 10rem toolbar slot; the declarations
    // that keep it inside its box must not depend on the host
    const narrow = rt.document.createElement("div");
    narrow.style.width = "10rem";
    rt.document.body.appendChild(narrow);
    new rt.wx.InputDateCtrl(narrow);

    assert.equal(narrow.querySelectorAll(".wx-date-input")[0].style.minWidth, "0");
    assert.equal(narrow.querySelectorAll(".dropdown-menu")[0].style.width, "max-content");
});
