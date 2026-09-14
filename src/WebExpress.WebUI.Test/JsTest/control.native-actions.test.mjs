import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWebUi } from "./harness.mjs";

test("a fading alert waits for its own transition and ignores repeated dismissal", () => {
    let fallback;
    const rt = loadWebUi({ browser: true, globals: {
        getComputedStyle: () => ({ transitionDuration: "0.15s", transitionDelay: "0s" }),
        setTimeout: fn => { fallback = fn; return 1; }, clearTimeout() {}
    }, extraFiles: ["webexpress.webui.native.js"] });
    const alert = rt.createElement("div");
    alert.className = "alert fade show";
    rt.document.body.appendChild(alert);
    rt.wx.NativeActions.dismissAlert(alert);
    assert.equal(alert.isConnected, true, "the alert stays in layout while fading");
    assert.equal(alert.classList.contains("show"), false);
    rt.wx.NativeActions.dismissAlert(alert);
    alert.dispatchEvent({ type: "transitionend", propertyName: "opacity", target: rt.createElement("span") });
    assert.equal(alert.isConnected, true);
    alert.dispatchEvent({ type: "transitionend", propertyName: "opacity" });
    assert.equal(alert.isConnected, false);
    fallback();
});

test("reduced motion dismisses an alert without waiting for a nonexistent transition", () => {
    const rt = loadWebUi({ browser: true, globals: {
        getComputedStyle: () => ({ transitionDuration: "0s", transitionDelay: "0s" })
    }, extraFiles: ["webexpress.webui.native.js"] });
    const alert = rt.createElement("div");
    alert.className = "alert fade show";
    rt.document.body.appendChild(alert);
    rt.wx.NativeActions.dismissAlert(alert);
    assert.equal(alert.isConnected, false);
});

test("offcanvas actions find their native dialog even when an icon was clicked", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.native.js"] });
    const dialog = rt.createElement("dialog");
    dialog.id = "drawer";
    const button = rt.createElement("button");
    button.setAttribute("data-wx-toggle", "offcanvas");
    button.setAttribute("data-wx-target", "#drawer");
    const icon = rt.createElement("i");
    button.appendChild(icon);
    rt.document.body.append(button, dialog);
    const event = { type: "click", target: icon, preventDefault() {} };
    rt.document.dispatchEvent(event);
    assert.equal(dialog.open, true);
    rt.document.dispatchEvent(event);
    assert.equal(dialog.open, false);
    button.setAttribute("data-wx-target", "#missing");
    assert.doesNotThrow(() => rt.document.dispatchEvent(event));
});
