/**
 * Focused test for the SmartEditCtrl display view of editable phone and e-mail table
 * cells. The raw value of a phone cell is the bare E.164 form and the one of an e-mail
 * cell a plain address, which is what a missing _getView case falls back to; the read
 * view shows them as the read-only controls do - the flag and a link that dials, a link
 * that writes.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the runtime with the real smartedit and the contact controls. The sibling input
 * controls _getView tests against are stubbed, as they are not under test here.
 * @returns {object} The loaded runtime.
 */
function loadRuntime() {
    const rt = loadWebUi({
        browser: true,
        extraFiles: [
            "webexpress.webui.email.js",
            "webexpress.webui.phone.js",
            "webexpress.webui.input.phone.js",
            "webexpress.webui.smartedit.js"
        ]
    });

    for (const name of ["InputSelectionCtrl", "InputMoveCtrl", "InputCalendarCtrl", "InputDateCtrl", "InputTagCtrl", "InputRatingCtrl", "InputColorCtrl", "InputBarcodeCtrl", "InputTrafficLightCtrl", "InputDnfCtrl", "EditorCtrl"]) {
        if (!rt.wx[name]) { rt.wx[name] = class { }; }
    }

    return rt;
}

/**
 * Wraps an editor in a SmartEditCtrl and returns the display view it rendered.
 * @param {object} rt - The loaded runtime.
 * @param {HTMLElement} editor - The editor element.
 * @returns {object} The display view element.
 */
function displayView(rt, editor) {
    const container = rt.document.createElement("div");
    container.appendChild(editor);
    rt.document.body.appendChild(container);
    new rt.wx.SmartEditCtrl(container);
    return container.firstElementChild;
}

test("an editable phone cell shows the flag and a link that dials, not the bare number", () => {
    const rt = loadRuntime();
    const editor = rt.document.createElement("div");
    editor.setAttribute("data-value", "+14165551234");
    editor._wx_controller = new rt.wx.InputPhoneCtrl(editor);

    const view = displayView(rt, editor);

    assert.equal(view.querySelector("i").className, "wx-flag wx-flag-ca");
    assert.equal(view.querySelector("a").getAttribute("href"), "tel:+14165551234");
});

test("an editable e-mail cell shows a link that writes to the address", () => {
    const rt = loadRuntime();
    const editor = rt.document.createElement("input");
    editor.type = "email";
    editor.value = "grace@example.com";

    const view = displayView(rt, editor);

    assert.equal(view.querySelector("a").getAttribute("href"), "mailto:grace@example.com");
});
