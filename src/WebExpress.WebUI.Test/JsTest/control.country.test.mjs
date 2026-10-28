/**
 * Headless contract test for the CountryCtrl control (wx-webui-country).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * On top of it the server handoff is pinned: the server names the country in
 * the language of the request and the client keeps that name, adding only the
 * flag the code selects.
 */
import { test } from "node:test";
import assert from "node:assert";
import { contract } from "./controls.contract.mjs";
import { loadWebUi } from "./harness.mjs";

contract({
    file: "webexpress.webui.country.js",
    selector: "wx-webui-country",
    ctrl: "CountryCtrl"
});

function createCountry(rt, text, attributes) {
    const host = rt.createElement("div");
    for (const [name, value] of Object.entries(attributes)) {
        host.setAttribute(name, value);
    }
    host.textContent = text;
    rt.document.body.appendChild(host);
    return { host, ctrl: new rt.wx.CountryCtrl(host) };
}

test("the name from the server is kept and the code picks the flag", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.country.js"] });

    const { host, ctrl } = createCountry(rt, "Deutschland", { "data-value": "DE", lang: "en" });

    assert.equal(ctrl.value, "DE");
    assert.equal(ctrl._name.textContent, "Deutschland", "the server's translation wins over the browser's");
    assert.equal(ctrl._flag.className, "wx-flag wx-flag-de");
    assert.equal(ctrl._flag.getAttribute("aria-hidden"), "true", "the name already says which country it is");
    assert.equal(host.hasAttribute("data-value"), false, "the handoff attribute is consumed");
});

test("a code set from script is named in the language of the page", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.country.js"] });
    const { ctrl } = createCountry(rt, "", { lang: "de" });

    ctrl.value = "fr";

    assert.equal(ctrl.value, "FR", "the code is kept in upper case");
    assert.equal(ctrl._name.textContent, "Frankreich");
    assert.equal(ctrl._flag.className, "wx-flag wx-flag-fr");
});

test("an invalid or empty code clears the display", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.country.js"] });
    const { ctrl } = createCountry(rt, "Japan", { "data-value": "JP" });

    ctrl.value = "Japan";

    assert.equal(ctrl.value, null);
    assert.equal(ctrl._name.textContent, "");
    assert.equal(ctrl._box.hidden, true, "no empty chip is left behind");
});

test("with the name hidden, the flag carries it as a tooltip and for screen readers", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.country.js"] });

    const { ctrl } = createCountry(rt, "Japan", { "data-value": "JP", "data-show-name": "false" });

    assert.equal(ctrl._box.getAttribute("title"), "Japan");
    assert.equal(ctrl._name.className, "visually-hidden");
    assert.equal(ctrl._name.textContent, "Japan");
});

for (const showFlag of [undefined, "true", "false"]) {
    test(`country flag visibility respects ${showFlag ?? "the default"} across value changes`, () => {
        const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.country.js"] });
        const attributes = { "data-value": "DE", lang: "en" };
        if (showFlag !== undefined) {
            attributes["data-show-flag"] = showFlag;
        }
        const { host, ctrl } = createCountry(rt, "Germany", attributes);

        assert.equal(ctrl._box.contains(ctrl._flag), showFlag !== "false");
        assert.equal(ctrl._name.textContent, "Germany");
        assert.equal(host.hasAttribute("data-show-flag"), false);

        ctrl.value = null;
        ctrl.value = "JP";

        assert.equal(ctrl._box.contains(ctrl._flag), showFlag !== "false");
        assert.equal(ctrl._name.textContent, "Japan");
        assert.equal(ctrl._box.hidden, false);
    });
}
