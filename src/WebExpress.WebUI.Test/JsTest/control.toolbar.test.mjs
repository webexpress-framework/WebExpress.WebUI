/**
 * Headless contract test for the ToolbarCtrl control (wx-webui-toolbar).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { test } from "node:test";
import assert from "node:assert";
import { contract } from "./controls.contract.mjs";
import { loadWebUi } from "./harness.mjs";

contract({
    file: "webexpress.webui.toolbar.js",
    selector: "wx-webui-toolbar",
    ctrl: "ToolbarCtrl",
    deps: ["webexpress.webui.overflow.js"]
});

/**
 * Builds a toolbar host whose "more" area carries a server-rendered dropdown
 * header and item, the structure ControlToolbar emits for overflow entries.
 * @param {object} rt - The loaded runtime.
 * @returns {object} The connected toolbar host element.
 */
function moreToolbarHost(rt) {
    const host = rt.createElement("div");
    host.classList.add("wx-webui-toolbar");

    const more = rt.createElement("div");
    more.classList.add("wx-toolbar-more");

    const header = rt.createElement("span");
    header.classList.add("wx-dropdown-header");
    header.textContent = "More actions";
    more.appendChild(header);

    const item = rt.createElement("a");
    item.classList.add("wx-dropdown-item");
    item.id = "item-one";
    item.textContent = "Item One";
    more.appendChild(item);

    host.appendChild(more);
    rt.document.body.appendChild(host);
    return host;
}

// guards the field contract between ToolbarCtrl._createMoreDropdownWithController
// and DropdownCtrl._createMenuItem: the menu reads `text`, so descriptors built
// with the wrong key surface as the literal "undefined" header and empty items
test("wx-webui-toolbar rebuilds the more menu with the source labels", () => {
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.overflow.js", "webexpress.webui.dropdown.js", "webexpress.webui.toolbar.js"]
    });

    const host = moreToolbarHost(rt);

    rt.wx.Controller.createInstances(host);

    const menu = host.querySelector(".wx-toolbar-more-menu");
    assert.ok(menu, "the more menu is rendered");
    assert.equal(menu.querySelector(".dropdown-header").textContent, "More actions");
    assert.equal(menu.querySelector(".dropdown-item").textContent, "Item One");
    assert.ok(!menu.textContent.includes("undefined"), "no label collapses to undefined");
});
