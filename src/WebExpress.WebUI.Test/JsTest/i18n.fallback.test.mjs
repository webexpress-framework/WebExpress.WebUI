/**
 * Headless tests for the translation lookup every control labels itself
 * through. I18N.translate answers a key it does not know with the key itself,
 * so Ctrl._i18n has to recognise that answer as a miss; otherwise the english
 * fallback a control passes along is never shown and the user reads the key.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Builds a plain control on an attached host.
 * @returns {object} The webui namespace and the control.
 */
function mount() {
    const rt = loadWebUi({ browser: true });
    const host = rt.createElement("div");
    rt.document.body.appendChild(host);
    // the base is abstract; a bare subclass carries nothing but the inherited lookup
    const Probe = class extends rt.wx.Ctrl { };
    return { wx: rt.wx, ctrl: new Probe(host) };
}

test("a key no dictionary knows shows the fallback, not the key", () => {
    const { ctrl } = mount();
    assert.equal(ctrl._i18n("webexpress.webui:nowhere.to.be.found", "Options"), "Options");
});

test("a known key shows its translation rather than the fallback", () => {
    const { wx, ctrl } = mount();
    wx.I18N.register("en", "webexpress.webui", { "probe.label": "Translated" });
    wx.I18N.setLanguage("en");
    assert.equal(ctrl._i18n("webexpress.webui:probe.label", "Fallback"), "Translated");
});

test("without a fallback a missing key still shows the key, so the gap stays visible", () => {
    const { ctrl } = mount();
    assert.equal(ctrl._i18n("webexpress.webui:nowhere.to.be.found"), "webexpress.webui:nowhere.to.be.found");
});
