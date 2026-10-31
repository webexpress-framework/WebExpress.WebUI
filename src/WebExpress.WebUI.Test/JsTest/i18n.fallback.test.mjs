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

test("the page language set by the server wins over the browser language", () => {
    // the harness browser speaks en-US; a user who chose german gets a german page
    const rt = loadWebUi({ rootAttributes: { lang: "de-DE" }, extraFiles: ["i18n/en.js", "i18n/de.js"] });
    assert.equal(rt.wx.I18N.language, "de");
    assert.equal(rt.wx.I18N.translate("webexpress.webui:close"), "Schließen");
});

test("without a lang attribute the browser language is the fallback", () => {
    const rt = loadWebUi();
    assert.equal(rt.wx.I18N.language, "en");
});

test("a value without a module passes through unchanged, so plain text can stand in for a key", () => {
    const rt = loadWebUi({ extraFiles: ["i18n/en.js"] });
    assert.equal(rt.wx.I18N.translate("Columns"), "Columns");
    assert.equal(rt.wx.I18N.translate("webexpress.webui"), "webexpress.webui", "a module name is not a translation");
});

test("slash commands and add-ons label themselves in the page language", () => {
    const rt = loadWebUi({
        rootAttributes: { lang: "de" },
        extraFiles: ["i18n/en.js", "i18n/de.js", "editor/shortcuts/default.js", "editor/addons/default.js"]
    });
    const heading = rt.wx.EditorShortcuts.getAll().find(def => def.id === "block.heading1");
    assert.equal(heading.label, "Überschrift 1");
    assert.equal(heading.category, "Text");
    assert.equal(rt.wx.EditorAddOns.get("hr-styled").category, "Layout");
    assert.equal(rt.wx.EditorAddOns.get("badge-primary").label, "Badge (blau)");

    // no command or add-on may fall back to its raw key
    const texts = [
        ...rt.wx.EditorShortcuts.getAll().flatMap(def => [def.label, def.description, def.category]),
        ...rt.wx.EditorAddOns.getAll().flatMap(def => [def.label, def.description, def.category])
    ];
    assert.deepEqual(texts.filter(text => /^webexpress\.webui:/.test(text || "")), []);
});
