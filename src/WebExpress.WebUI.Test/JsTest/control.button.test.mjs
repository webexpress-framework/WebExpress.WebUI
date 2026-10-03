/**
 * Headless contract test for the ButtonCtrl control (wx-webui-button).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { test } from "node:test";
import assert from "node:assert";
import { contract } from "./controls.contract.mjs";
import { loadWebUi } from "./harness.mjs";

contract({
    file: "webexpress.webui.button.js",
    selector: "wx-webui-button",
    ctrl: "ButtonCtrl"
});

test("a button drawn on a div is still a button: role, tab stop and the keys a button answers to", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.button.js"] });
    const host = rt.createElement("div");
    host.textContent = "Toggle";
    rt.document.body.appendChild(host);
    new rt.wx.ButtonCtrl(host);

    assert.equal(host.getAttribute("role"), "button");
    assert.equal(host.getAttribute("tabindex"), "0");

    let clicks = 0;
    host.addEventListener("click", () => clicks++);
    host.dispatchEvent({ type: "keydown", key: " ", preventDefault: () => {} });
    host.dispatchEvent({ type: "keydown", key: "Enter", preventDefault: () => {} });
    assert.equal(clicks, 2, "space and enter press the button");

    const real = rt.createElement("button");
    rt.document.body.appendChild(real);
    new rt.wx.ButtonCtrl(real);
    assert.equal(real.getAttribute("role"), null, "a real button needs no role of its own");
});
