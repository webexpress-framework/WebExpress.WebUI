/**
 * Headless tests for the success action a form dialog lets its opener override. A form is
 * authored for the page it usually lives on - a detail page reloads after a save - and an
 * opener that refreshes itself, such as a board, tells the dialog to keep the page instead.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads the form dialog and the default actions.
 * @returns {object} The runtime.
 */
function load() {
    return loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.modal.js", "webexpress.webui.modal.page.js", "webexpress.webui.modal.form.js", "action/default.js"]
    });
}

/**
 * Creates a form dialog on the page.
 * @param {object} rt - The runtime.
 * @param {string} [authored] - The success action the dialog is authored with.
 * @returns {object} The host and the dialog controller.
 */
function dialog(rt, authored) {
    const host = rt.createElement("dialog");
    host.id = "modal-form";
    if (authored !== undefined) {
        host.setAttribute("data-wx-success-action", authored);
    }
    rt.document.body.appendChild(host);
    return { host, ctrl: new rt.wx.ModalFormCtrl(host) };
}

/**
 * Stands in for the controller registry, which only knows the instances it created itself.
 * @param {object} ctrl - The dialog controller the target resolves to.
 * @returns {object} The registry stand-in.
 */
function lookup(ctrl) {
    return { getInstance: () => ctrl };
}

test("without an override the form decides, and an unknown value never suppresses its action", () => {
    const rt = load();
    const { ctrl } = dialog(rt);
    assert.equal(ctrl.successAction, null);

    ctrl.successAction = "None";
    assert.equal(ctrl.successAction, "none", "the value is read case-insensitively");
    ctrl.successAction = "relaod";
    assert.equal(ctrl.successAction, null, "a misspelled value falls back to the form's own action");
    ctrl.successAction = "follow-uri";
    assert.equal(ctrl.successAction, "follow-uri");
    ctrl.successAction = null;
    assert.equal(ctrl.successAction, null);
});

test("an override lasts for one opening and the authored action comes back on close", () => {
    const rt = load();
    const { host, ctrl } = dialog(rt, "reload");
    assert.equal(host.hasAttribute("data-wx-success-action"), false, "the attribute is consumed");
    assert.equal(ctrl.successAction, "reload");

    ctrl.successAction = "none";
    host.showModal();
    assert.equal(ctrl.successAction, "none");
    ctrl.hide();
    assert.equal(ctrl.successAction, "reload", "the next opener gets the authored action again");
});

test("the modal action passes its success option to a form dialog and leaves it out otherwise", () => {
    const rt = load();
    const { ctrl } = dialog(rt);
    ctrl.show = () => { };
    const modal = rt.wx.Actions.get("modal");

    const button = rt.createElement("button");
    button.setAttribute("data-wx-primary-target", "#modal-form");
    button.setAttribute("data-wx-primary-uri", "/transition");
    button.setAttribute("data-wx-primary-success", "none");
    modal.execute(button, "primary", lookup(ctrl));
    assert.equal(ctrl.uri, "/transition");
    assert.equal(ctrl.successAction, "none");

    ctrl.successAction = null;
    button.removeAttribute("data-wx-primary-success");
    modal.execute(button, "primary", lookup(ctrl));
    assert.equal(ctrl.successAction, null, "a button without the option lets the form decide");
});

test("a plain dialog ignores the success option", () => {
    const rt = load();
    const host = rt.createElement("dialog");
    host.id = "plain";
    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.ModalPageCtrl(host);
    ctrl.show = () => { };

    const button = rt.createElement("button");
    button.setAttribute("data-wx-primary-target", "#plain");
    button.setAttribute("data-wx-primary-success", "none");
    rt.wx.Actions.get("modal").execute(button, "primary", lookup(ctrl));
    assert.equal("successAction" in ctrl, false);
});
