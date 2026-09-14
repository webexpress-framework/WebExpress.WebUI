/**
 * Guards how the login dialog is made of the login control.
 *
 * The dialog lends the login what a card would otherwise supply - the title bar
 * names it, the footer carries its submit button - and the login keeps what is
 * its. So the login renders plain inside the dialog, its submit button ends up
 * on the footer still wired to the form, and on its own it is the card it always
 * was. Both mount paths - the controller framework mounting the login ahead of
 * the dialog, and a dialog created by hand - end on one login instance.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */

import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

const FILES = [
    "i18n/en.js",
    "webexpress.webui.login.js",
    "webexpress.webui.modal.js",
    "webexpress.webui.modal.login.js"
];

/**
 * Loads the runtime with the login, the modal and the login dialog.
 * @returns {object} The loaded runtime.
 */
function load() {
    return loadWebUi({ browser: true, extraFiles: FILES });
}

/**
 * Builds the host the server renders: the dialog sections around a login host.
 * @param {object} rt - The loaded runtime.
 * @param {object} [options] - A username to prefill.
 * @returns {object} The dialog host and the login host inside it.
 */
function renderHost(rt, options = {}) {
    const host = rt.createElement("dialog");
    host.classList.add("wx-webui-modal-login");

    const header = rt.createElement("div");
    header.classList.add("wx-modal-header");
    header.textContent = "Login";

    const content = rt.createElement("div");
    content.classList.add("wx-modal-content");

    const login = rt.createElement("div");
    login.classList.add("wx-webui-login");

    if (options.username) {
        login.setAttribute("data-username", options.username);
        login.dataset.username = options.username;
    }

    content.appendChild(login);

    const footer = rt.createElement("div");
    footer.classList.add("wx-modal-footer");

    host.appendChild(header);
    host.appendChild(content);
    host.appendChild(footer);
    rt.document.body.appendChild(host);

    return { host, login };
}

/**
 * Mounts the dialog the way a page does: through the controller framework, which
 * mounts the login ahead of the dialog around it.
 * @param {object} rt - The loaded runtime.
 * @param {object} [options] - Passed on to renderHost.
 * @returns {object} The dialog controller and the hosts.
 */
function mount(rt, options = {}) {
    const rendered = renderHost(rt, options);
    rt.wx.Controller.createInstances(rendered.host);

    return { ...rendered, ctrl: rt.wx.Controller.instanceMap.get(rendered.host) };
}

test("the dialog frames the login plain and takes its submit button onto the footer", () => {
    const rt = load();
    const { ctrl, login } = mount(rt);

    assert.ok(ctrl instanceof rt.wx.ModalLoginCtrl);
    assert.ok(ctrl.login instanceof rt.wx.LoginCtrl, "the dialog holds the very login the framework mounted");
    assert.equal(ctrl.login, rt.wx.Controller.getInstanceByElement(login));

    // the title bar names the dialog, so the login draws neither its card nor its heading
    assert.match(ctrl._titleH1.textContent, /Login/);
    assert.ok(login.classList.contains("wx-login-plain"), "the host is marked as framed");
    assert.equal(login.classList.contains("wx-login"), false, "and not as the page card");
    assert.equal(ctrl._bodyDiv.querySelector(".card"), null, "no card inside the dialog");
    assert.equal(ctrl._bodyDiv.querySelector("h2"), null, "no heading repeating the title bar");
    assert.equal(ctrl._bodyDiv.querySelector("form"), ctrl.login._form, "the form is the body");

    // the submit button sits on the footer ahead of the close button, which closes the bar
    // as the cancelling action always does; the submit stays wired back to the form
    const bar = ctrl._footerDiv.children;
    assert.equal(bar[bar.length - 1], ctrl._cancelButton, "the cancelling action is rightmost");
    assert.equal(bar[bar.length - 2], ctrl.login._loginBtn, "the submit stands in front of it");
    assert.equal(ctrl.login._loginBtn.getAttribute("form"), ctrl.login._form.id, "a click on the footer still submits the form");
    assert.equal(ctrl.login._form.querySelector(".d-grid"), null, "the group that held the button left with it");
});

test("a dialog created by hand mounts the login itself", () => {
    const rt = load();
    const { host, login } = renderHost(rt);

    const ctrl = new rt.wx.ModalLoginCtrl(host);

    assert.ok(ctrl.login instanceof rt.wx.LoginCtrl, "the unmounted host inside the body is mounted by the dialog");
    assert.equal(login.classList.contains("wx-webui-login"), false, "the marker is consumed, so the framework does not mount it twice");
    assert.ok(login.classList.contains("wx-login-plain"));

    const bar = ctrl._footerDiv.children;
    assert.equal(bar[bar.length - 2], ctrl.login._loginBtn, "and its submit button reaches the footer all the same");
    assert.equal(bar[bar.length - 1], ctrl._cancelButton);
});

test("showing the dialog puts the caret into the field to type into", () => {
    const rt = load();

    const focused = [];
    const empty = mount(rt);
    empty.ctrl.login._usernameInput.focus = () => focused.push("username");
    empty.ctrl.login._passwordInput.focus = () => focused.push("password");
    empty.host.dispatchEvent({ type: "webexpress.webui.modal.show" });

    assert.deepEqual(focused, ["username"], "without a name the name is typed first");

    const known = mount(rt, { username: "WebExpress" });
    known.ctrl.login._usernameInput.focus = () => focused.push("username");
    known.ctrl.login._passwordInput.focus = () => focused.push("password");
    known.host.dispatchEvent({ type: "webexpress.webui.modal.show" });

    assert.deepEqual(focused, ["username", "password"], "a known name leaves only the password to type");
    assert.equal(known.ctrl.login._usernameInput.value, "WebExpress", "the prefill reached the field");
});

test("on its own the login keeps its card, and two logins do not share ids", () => {
    const rt = load();

    const hosts = [rt.createElement("div"), rt.createElement("div")];
    for (const host of hosts) {
        host.classList.add("wx-webui-login");
        rt.document.body.appendChild(host);
        rt.wx.Controller.createInstances(host);
    }

    const [first, second] = hosts.map((host) => rt.wx.Controller.getInstanceByElement(host));

    assert.ok(hosts[0].classList.contains("wx-login"), "outside a dialog the host is the page card");
    assert.ok(hosts[0].querySelector(".card"), "with the card around the form");
    assert.match(hosts[0].querySelector("h2").textContent, /Login/, "and the heading naming it");
    assert.equal(first._form.querySelector(".d-grid"), first._buttonGroup, "the submit button stays in the form");

    // the labels point at the fields and a lifted button points back at the form, so
    // a card and a dialog on one page must not resolve to each other
    assert.notEqual(first._form.id, second._form.id);
    assert.notEqual(first._usernameInput.id, second._usernameInput.id);
    assert.equal(first._form.querySelector("label").getAttribute("for"), first._usernameInput.id);
});

test("a login host carrying an id lends it to its form and fields", () => {
    const rt = load();

    const host = rt.createElement("div");
    host.id = "signin";
    host.classList.add("wx-webui-login");
    rt.document.body.appendChild(host);
    rt.wx.Controller.createInstances(host);

    const ctrl = rt.wx.Controller.getInstanceByElement(host);

    assert.equal(ctrl._form.id, "signin-form");
    assert.equal(ctrl._usernameInput.id, "signin-username");
    assert.equal(ctrl._passwordInput.id, "signin-password");
    assert.equal(ctrl._loginBtn.id, "signin-submit");
});
