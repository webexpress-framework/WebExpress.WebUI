import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

/**
 * Supplies two independent purposes for permission boundary tests.
 * @param {object} overrides - Configuration fields for a scenario.
 * @returns {object} A complete declarative configuration.
 */
function configuration(overrides = {}) {
    return { mode: "consent", storageKey: "application:consent", version: "1", lifetime: 60000,
        categories: [{ id: "required", label: "Required", necessary: true },
            { id: "stats", label: "Statistics", necessary: false }], ...overrides };
}

/**
 * Builds a host through the same data attributes used by the C# renderer.
 * @param {object} rt - The isolated runtime.
 * @param {object} config - The declarative configuration.
 * @returns {HTMLElement} The attached host.
 */
function host(rt, config = configuration()) {
    const element = rt.createElement("div");
    element.classList.add("wx-webui-cookie-banner");
    for (const [key, value] of Object.entries(config)) {
        const attribute = "data-" + key.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
        element.setAttribute(attribute, key === "categories" ? JSON.stringify(value) : String(value));
    }
    rt.document.body.appendChild(element);
    return element;
}

/**
 * Loads the shipped asset with isolated storage for each scenario.
 * @param {object} overrides - Configuration fields for a scenario.
 * @returns {object} The runtime, host and initialized controller.
 */
function setup(overrides = {}) {
    const rt = loadWebUi({ browser: true, extraFiles: ["i18n/en.js", "webexpress.webui.cookie.banner.js"], globals: { URL } });
    const element = host(rt, configuration(overrides));
    return { rt, element, ctrl: new rt.wx.CookieBannerCtrl(element) };
}

contract({ file: "webexpress.webui.cookie.banner.js", selector: "wx-webui-cookie-banner",
    ctrl: "CookieBannerCtrl", host: rt => host(rt) });

test("first visit denies optional purposes and late subscribers receive current state", () => {
    const { ctrl } = setup();
    const states = [];
    const unsubscribe = ctrl.subscribe(state => states.push(state));
    assert.equal(states.length, 1);
    assert.equal(ctrl.isAllowed("required"), true);
    assert.equal(ctrl.isAllowed("stats"), false);
    assert.equal(ctrl.isAllowed("toString"), false);
    ctrl.acceptAll();
    assert.equal(states.at(-1).categories.stats, true);
    states.at(-1).categories.stats = false;
    assert.equal(ctrl.isAllowed("stats"), true);
    unsubscribe();
    ctrl.rejectOptional();
    assert.equal(states.length, 2);
    ctrl.destroy();
});

test("accept, reload, reject and reset preserve the explicit decision lifecycle", () => {
    const { rt, ctrl } = setup();
    ctrl.acceptAll();
    assert.equal(ctrl._panel.hidden, true);
    const restored = new rt.wx.CookieBannerCtrl(host(rt));
    assert.equal(restored.isAllowed("stats"), true);
    restored.rejectOptional();
    assert.equal(restored.state.decided, true);
    assert.equal(restored.isAllowed("stats"), false);
    restored.reset();
    assert.equal(restored.state.decided, false);
    assert.equal(restored._panel.hidden, false);
    ctrl.destroy(); restored.destroy();
});

test("notice acknowledgement never grants a category or survives a switch to consent", () => {
    const { rt, ctrl } = setup({ mode: "notice" });
    ctrl.acceptAll();
    assert.equal(ctrl.state.decided, true);
    assert.equal(ctrl.isAllowed("stats"), false);
    const consent = new rt.wx.CookieBannerCtrl(host(rt));
    assert.equal(consent.state.decided, false);
    assert.equal(consent.isAllowed("stats"), false);
    ctrl.destroy(); consent.destroy();
});

test("version, category and shorter lifetime changes invalidate saved grants", () => {
    for (const change of [{ version: "2" }, { lifetime: 10 },
        { categories: [...configuration().categories, { id: "video", label: "Video", necessary: false }] }]) {
        const { rt, ctrl } = setup();
        ctrl.acceptAll();
        const changed = new rt.wx.CookieBannerCtrl(host(rt, configuration(change)));
        assert.equal(changed.state.decided, false);
        assert.equal(changed.isAllowed("stats"), false);
        ctrl.destroy(); changed.destroy();
    }
});

test("malformed storage and non-boolean permissions never grant access", () => {
    const { rt, ctrl } = setup();
    ctrl.acceptAll();
    const valid = rt.wx.LocalStorage.getJson("application:consent");
    for (const value of ["{", JSON.stringify({ ...valid, categories: { required: true, stats: "yes" } }),
        JSON.stringify({ ...valid, expiresAt: -1 })]) {
        rt.wx.LocalStorage.setItem("application:consent", value);
        const restored = new rt.wx.CookieBannerCtrl(host(rt));
        assert.equal(restored.state.decided, false);
        restored.destroy();
    }
    ctrl.destroy();
});

test("denied storage keeps the current page usable", () => {
    const { rt, ctrl } = setup();
    rt.sandbox.localStorage.setItem = () => { throw new Error("denied"); };
    ctrl.acceptAll();
    assert.equal(ctrl.isAllowed("stats"), true);
    ctrl.rejectOptional();
    assert.equal(ctrl.isAllowed("stats"), false);
    ctrl.destroy();
});

test("expiry revokes active permissions and notifies subscribers", () => {
    const { ctrl } = setup();
    ctrl.acceptAll();
    const states = [];
    ctrl.subscribe(state => states.push(state));
    ctrl._decision.expiresAt = Date.now() - 1;
    assert.equal(ctrl.isAllowed("stats"), false);
    assert.equal(states.at(-1).decided, false);
    assert.equal(ctrl._panel.hidden, false);
    ctrl.destroy();
});

test("storage events synchronize rejection from another tab", () => {
    const { rt, ctrl } = setup();
    ctrl.acceptAll();
    rt.wx.LocalStorage.removeItem("application:consent");
    ctrl._storageHandler({ key: "application:consent" });
    assert.equal(ctrl.isAllowed("stats"), false);
    assert.equal(ctrl.state.decided, false);
    ctrl.destroy();
});

test("settings allow individual selection and cancellation leaves consent untouched", () => {
    const { ctrl } = setup();
    ctrl.openSettings();
    assert.equal(ctrl._dialog.open, true);
    assert.equal(ctrl._inputs.get("required").disabled, true);
    assert.equal(ctrl._inputs.get("stats").checked, false);
    ctrl._inputs.get("stats").checked = true;
    ctrl._dialog.querySelector("button").click();
    assert.equal(ctrl.isAllowed("stats"), true);
    assert.equal(ctrl._dialog.open, false);
    ctrl.openSettings();
    ctrl._inputs.get("stats").checked = false;
    ctrl._dialog.querySelectorAll("button")[2].click();
    assert.equal(ctrl.isAllowed("stats"), true);
    assert.throws(() => ctrl.saveSelection(["unknown"]));
    ctrl.destroy();
});

test("application scopes do not share permissions and teardown removes subscribers", () => {
    const { rt, ctrl } = setup();
    ctrl.acceptAll();
    const other = new rt.wx.CookieBannerCtrl(host(rt, configuration({ storageKey: "other" })));
    assert.equal(other.isAllowed("stats"), false);
    ctrl.subscribe(() => {});
    ctrl.destroy();
    assert.equal(ctrl._subscriptions.size, 0);
    assert.equal(ctrl._element.childNodes.length, 0);
    other.destroy();
});

test("duplicate categories fail closed and executable privacy links remain absent", () => {
    const { rt, ctrl } = setup({ privacyUri: "java\tscript:alert(1)" });
    assert.equal(ctrl._panel.querySelector("a"), null);
    assert.throws(() => new rt.wx.CookieBannerCtrl(host(rt, configuration({ categories:
        [configuration().categories[0], configuration().categories[0]] }))));
    ctrl.destroy();
});


test("the framework exposes the documented cookie change event", () => {
    const { rt, element, ctrl } = setup();
    assert.equal(rt.wx.Event.COOKIE_CHANGE_EVENT, "webexpress.webui.cookie.change");
    const events = [];
    element.addEventListener("webexpress.webui.cookie.change", event => events.push(event.detail));
    ctrl.rejectOptional();
    assert.equal(events[0].reason, "selection");
    assert.equal(events[0].state.categories.stats, false);
    ctrl.destroy();
});


test("Tab wraps across enabled dialog controls in both directions", () => {
    const { rt, ctrl } = setup();
    ctrl.openSettings();
    const first = ctrl._inputs.get("stats");
    const last = ctrl._dialog.querySelectorAll("button")[2];
    // the DOM stub does not move focus, so model only that browser primitive
    first.focus = () => { rt.document.activeElement = first; };
    last.focus = () => { rt.document.activeElement = last; };
    let prevented = 0;
    last.focus();
    ctrl._onDialogKeyDown({ key: "Tab", shiftKey: false, preventDefault() { prevented++; } });
    assert.equal(rt.document.activeElement, first);
    ctrl._onDialogKeyDown({ key: "Tab", shiftKey: true, preventDefault() { prevented++; } });
    assert.equal(rt.document.activeElement, last);
    assert.equal(prevented, 2);
    ctrl.destroy();
});


test("necessary-only is the primary action in the banner and settings", () => {
    const { ctrl } = setup();
    for (const parent of [ctrl._panel, ctrl._dialog]) {
        const buttons = Array.from(parent.querySelectorAll("button"));
        assert.deepEqual(buttons.filter(button => button.className.includes("btn-primary"))
            .map(button => button.textContent), ["Only necessary"]);
    }
    ctrl.destroy();
});

test("separate privacy settings supply the label and destination in both views", () => {
    const { rt, ctrl } = setup();
    rt.document.baseURI = "https://example.test/app/";
    const custom = new rt.wx.CookieBannerCtrl(host(rt, configuration({
        privacyUri: "privacy", privacyLabel: "Application privacy information" })));
    for (const parent of [custom._panel, custom._dialog]) {
        assert.equal(parent.querySelector("a").textContent, "Application privacy information");
        assert.equal(parent.querySelector("a").getAttribute("href"), "privacy");
    }
    assert.equal(custom._element.getAttribute("data-cookie-config"), null);
    ctrl.destroy(); custom.destroy();
});

test("server cookie mirrors choices and deletes stale grants on reset", () => {
    const { rt, ctrl } = setup({ cookieName: "wx-consent-test", serverPolicy: "policy1" });
    assert.match(rt.document.cookie, /Max-Age=0/);
    ctrl.acceptAll();
    const payload = JSON.parse(decodeURIComponent(rt.document.cookie.split(";")[0].split("=")[1]));
    assert.equal(payload.policy, "policy1");
    assert.equal(payload.categories.stats, true);
    assert.match(rt.document.cookie, /Path=\/; SameSite=Lax; Max-Age=/);
    ctrl.rejectOptional();
    const denied = JSON.parse(decodeURIComponent(rt.document.cookie.split(";")[0].split("=")[1]));
    assert.equal(denied.categories.stats, false);
    ctrl.reset();
    assert.match(rt.document.cookie, /wx-consent-test=;.*Max-Age=0/);
    ctrl.destroy();
});

test("oversized server preferences remove an earlier cookie instead of truncating permissions", () => {
    const { rt, ctrl } = setup({ cookieName: "wx-consent-test", serverPolicy: "x".repeat(4000) });
    ctrl.acceptAll();
    assert.match(rt.document.cookie, /wx-consent-test=;.*Max-Age=0/);
    assert.equal(ctrl.isAllowed("stats"), true);
    ctrl.destroy();
});
