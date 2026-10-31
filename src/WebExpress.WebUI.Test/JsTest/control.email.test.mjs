/**
 * Headless contract test for the EmailCtrl control (wx-webui-email).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * On top of it the display is pinned: an address becomes a link that writes
 * to it, and the client applies the same rule as the server (EmailAddress.cs).
 */
import { test } from "node:test";
import assert from "node:assert";
import { contract } from "./controls.contract.mjs";
import { loadWebUi } from "./harness.mjs";

contract({
    file: "webexpress.webui.email.js",
    selector: "wx-webui-email",
    ctrl: "EmailCtrl"
});

function createEmail(rt, attributes) {
    const host = rt.createElement("div");
    for (const [name, value] of Object.entries(attributes)) {
        host.setAttribute(name, value);
    }
    rt.document.body.appendChild(host);
    return new rt.wx.EmailCtrl(host);
}

test("an address becomes a link that writes to it", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.email.js"] });

    const ctrl = createEmail(rt, { "data-value": "Grace@EXAMPLE.com" });

    assert.equal(ctrl.value, "Grace@example.com", "the domain is kept in lower case");
    assert.equal(ctrl._link.getAttribute("href"), "mailto:Grace@example.com");
    assert.equal(ctrl._link.textContent, "Grace@example.com");
});

test("a local part with url characters cannot add headers to the mailto link", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.email.js"] });

    const ctrl = createEmail(rt, { "data-value": "a?cc=eve&x#y@example.com" });

    assert.equal(ctrl._link.getAttribute("href"), "mailto:a%3Fcc%3Deve%26x%23y@example.com");
    assert.equal(ctrl._link.textContent, "a?cc=eve&x#y@example.com", "the text shows the address as it is");
});

test("an invalid address clears the display instead of linking nowhere", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.email.js"] });
    const ctrl = createEmail(rt, { "data-value": "grace@example.com" });

    ctrl.value = "grace@";

    assert.equal(ctrl.value, null);
    assert.equal(ctrl._link.getAttribute("href"), null);
    assert.equal(ctrl._box.hidden, true);
});

test("the client rule matches the server rule", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.email.js"] });
    const normalize = rt.wx.EmailCtrl.normalize;

    // the cases of UnitTestEmailAddress.Normalize
    assert.equal(normalize(" Grace.Hopper@Example.COM "), "Grace.Hopper@example.com");
    assert.equal(normalize("a+tag@mail.example.org"), "a+tag@mail.example.org");
    assert.equal(normalize("two@at@example.com"), null);
    assert.equal(normalize("user@-example.com"), null);
    assert.equal(normalize("a".repeat(65) + "@example.com"), null);
});
