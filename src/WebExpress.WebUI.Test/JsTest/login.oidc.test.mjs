/**
 * Verifies external login navigation without submitting or exposing local credentials.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Creates a login from the public metadata emitted by the server.
 * @param {object[]} providers - Public provider labels and authorization URLs.
 * @param {boolean} failed - Whether a previous browser authentication failed.
 * @returns {object} The runtime, host, and mounted login controller.
 */
function createLogin(providers = [], failed = false) {
    const rt = loadWebUi({ browser: true, extraFiles: ["i18n/en.js", "webexpress.webui.login.js"] });
    const host = rt.document.createElement("div");
    host.dataset.loginUri = "/api/auth/login?application=test";
    host.dataset.externalLogins = JSON.stringify(providers);
    host.dataset.authError = String(failed);
    rt.document.body.appendChild(host);
    return { rt, host, ctrl: new rt.wx.LoginCtrl(host) };
}

test("registered providers appear as links independent of required credential fields", () => {
    const uri = "/api/auth/authorize?application=app&provider=company&returnUrl=%2Fworkspace";
    const { host, ctrl } = createLogin([{ label: "Company <SSO>", uri }, { label: "Partner", uri: uri + "2" }]);
    const links = host.querySelectorAll(".wx-login-external a");
    assert.equal(links.length, 2);
    assert.equal(links[0].getAttribute("href"), uri + "&rememberMe=true");
    assert.equal(links[0].textContent, "Sign in with Company <SSO>");
    assert.equal(links[0].children.length, 0);
    assert.equal(ctrl._usernameInput.value, "");
    assert.equal(ctrl._passwordInput.value, "");
});

test("moving the credential button into a modal footer preserves external login links", () => {
    const { rt, host, ctrl } = createLogin([{ label: "Company", uri: "/api/auth/authorize?provider=company" }]);
    const footer = rt.document.createElement("div");
    ctrl.liftSubmitButton(footer);
    assert.equal(footer.querySelector("button"), ctrl._loginBtn);
    assert.equal(host.querySelectorAll(".wx-login-external a").length, 1);
});

test("stay signed in defaults on and changing it updates every external destination", () => {
    const uri = "/api/auth/authorize?provider=company&returnUrl=%2Fworkspace%3Fview%3Dmine";
    const { host, ctrl } = createLogin([{ label: "Company", uri }, { label: "Partner", uri }]);
    const input = ctrl._rememberMeInput;
    assert.equal(input.checked, true);
    assert.equal(input.type, "checkbox");
    assert.equal(input.getAttribute("role"), "switch");
    assert.equal(host.querySelector(`label[for="${input.id}"]`).textContent, "Stay signed in");
    for (const checked of [false, true, false]) {
        input.checked = checked;
        input.dispatchEvent({ type: "change" });
        for (const link of host.querySelectorAll(".wx-login-external a")) {
            const query = new URL(link.getAttribute("href"), "https://example.test").searchParams;
            assert.deepEqual(query.getAll("rememberMe"), [String(checked)]);
            assert.equal(query.get("returnUrl"), "/workspace?view=mine");
        }
    }
});

test("credential login sends the persistence choice to the application authentication endpoint", async () => {
    const { rt, ctrl } = createLogin();
    let sent;
    rt.wx.Transport.request = async (url, options) => {
        sent = { url, options };
        return { ok: false, error: { kind: "abort" } };
    };
    ctrl._usernameInput.value = "alice";
    ctrl._passwordInput.value = "secret";
    for (const checked of [true, false]) {
        ctrl._rememberMeInput.checked = checked;
        ctrl._form.dispatchEvent({ type: "submit", preventDefault() { } });
        await Promise.resolve();
        assert.equal(sent.url, "/api/auth/login?application=test");
        assert.equal(sent.options.headers["X-WebExpress-Auth"], "1");
        assert.deepEqual(JSON.parse(sent.options.body), { username: "alice", password: "secret", rememberMe: checked });
    }
});

test("a login without external providers has no empty provider section", () => {
    const { host } = createLogin();
    assert.equal(host.querySelector(".wx-login-external"), null);
});

test("failed external authentication shows a translated accessible retry message", () => {
    const { host } = createLogin([], true);
    const error = host.querySelector(".wx-login-external-error");
    assert.equal(error.getAttribute("role"), "alert");
    assert.equal(error.textContent, "External sign-in could not be completed. Please try again.");
});
