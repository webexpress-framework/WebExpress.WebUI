/**
 * Headless contract test for the TabCtrl control (wx-webui-tab).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle. The
 * focused tests below cover the optional badge of a tab header.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.tab.js",
    selector: "wx-webui-tab",
    ctrl: "TabCtrl"
});

/**
 * Builds a .wx-tab-view element carrying the given data attributes.
 * @param {object} rt - The loaded runtime.
 * @param {string} id - The tab id.
 * @param {object} data - The dataset entries (label, badge, ...).
 * @returns {object} The view element.
 */
function tabView(rt, id, data = {}) {
    const view = rt.document.createElement("div");
    view.id = id;
    view.classList.add("wx-tab-view");
    for (const [key, value] of Object.entries(data)) {
        view.dataset[key] = value;
    }
    return view;
}

test("wx-webui-tab renders the badge of a tab header", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tab.js"] });
    const host = rt.document.createElement("div");
    host.appendChild(tabView(rt, "tab-inbox", { label: "Inbox", badge: "12", badgeColor: "text-bg-danger" }));
    host.appendChild(tabView(rt, "tab-plain", { label: "Plain" }));
    rt.document.body.appendChild(host);

    new rt.wx.TabCtrl(host);

    const badges = host.querySelectorAll(".wx-tab-badge");
    assert.equal(badges.length, 1, "only the badged tab carries a badge");
    assert.equal(badges[0].textContent, "12", "the badge carries the count");
    assert.ok(badges[0].classList.contains("text-bg-danger"), "the system color lands as a css class");

    const links = host.querySelectorAll(".nav-link");
    const inbox = links.find((l) => l.dataset.tabId === "tab-inbox");
    assert.ok(inbox.querySelector(".wx-tab-badge"), "the badge sits inside the tab header");
});

test("wx-webui-tab applies a user-defined badge color as an inline style", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.tab.js"] });
    const host = rt.document.createElement("div");
    host.appendChild(tabView(rt, "tab-styled", { label: "Styled", badge: "7", badgeStyle: "background:#7c3aed;" }));
    rt.document.body.appendChild(host);

    new rt.wx.TabCtrl(host);

    const badge = host.querySelector(".wx-tab-badge");
    assert.ok(badge, "the tab carries a badge");
    assert.ok((badge.style.cssText || "").includes("#7c3aed"), "the user color lands as an inline style");
});
