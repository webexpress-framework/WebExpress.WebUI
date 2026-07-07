/**
 * Headless contract test for the SidebarCtrl control (wx-webui-sidebar).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle. The
 * focused tests below cover the trailing "..." options menu that both flat
 * items and nested tree items expose.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.sidebar.js",
    selector: "wx-webui-sidebar",
    ctrl: "SidebarCtrl"
});

/**
 * Loads a runtime with the dropdown control available, because the sidebar
 * builds the "..." menu through webexpress.webui.DropdownCtrl.
 * @returns {object} The loaded runtime.
 */
function loadSidebar() {
    return loadWebUi({ browser: true, extraFiles: ["webexpress.webui.dropdown.js", "webexpress.webui.sidebar.js"] });
}

/**
 * Builds a .wx-sidebar-link element, optionally carrying an options container
 * with one dropdown entry per label.
 * @param {object} rt - The loaded runtime.
 * @param {string} label - The link label.
 * @param {string[]|null} optionLabels - The option entries, or null for none.
 * @returns {object} The link element.
 */
function link(rt, label, optionLabels) {
    const el = rt.document.createElement("div");
    el.classList.add("wx-sidebar-link");
    el.dataset.label = label;

    if (optionLabels) {
        const options = rt.document.createElement("div");
        options.classList.add("wx-sidebar-options");
        for (const text of optionLabels) {
            const item = rt.document.createElement("div");
            item.classList.add("wx-dropdown-item");
            item.textContent = text;
            options.appendChild(item);
        }
        el.appendChild(options);
    }

    return el;
}

test("wx-webui-sidebar builds a '...' menu only for items that declare options", () => {
    const rt = loadSidebar();
    const host = rt.document.createElement("div");
    host.appendChild(link(rt, "with options", ["Edit", "Delete"]));
    host.appendChild(link(rt, "without options", null));
    rt.document.body.appendChild(host);

    new rt.wx.SidebarCtrl(host);

    const menus = host.querySelectorAll(".wx-sidebar-options");
    assert.equal(menus.length, 1, "only the item with options gets a menu");
    assert.ok(menus[0].classList.contains("wx-dropdown"), "the menu host is upgraded to a dropdown");
    assert.ok(menus[0].querySelector("button"), "the dropdown renders a toggle button");
});

test("wx-webui-sidebar builds a '...' menu for a nested tree item", () => {
    const rt = loadSidebar();

    const children = rt.document.createElement("div");
    children.classList.add("wx-sidebar-children");
    children.appendChild(link(rt, "child", ["Rename"]));

    const parent = link(rt, "parent", null);
    parent.appendChild(children);

    const host = rt.document.createElement("div");
    host.appendChild(parent);
    rt.document.body.appendChild(host);

    new rt.wx.SidebarCtrl(host);

    const menus = host.querySelectorAll(".wx-sidebar-options");
    assert.equal(menus.length, 1, "the nested child's options produce a menu");
});

test("wx-webui-sidebar applies text and background colors to the row", () => {
    const rt = loadSidebar();

    const classed = link(rt, "classed", null);
    classed.dataset.colorCss = "text-primary";
    classed.dataset.backgroundColorCss = "bg-dark";

    const styled = link(rt, "styled", null);
    styled.dataset.colorStyle = "color:#111111;";
    styled.dataset.backgroundColorStyle = "background:#222222;";

    const host = rt.document.createElement("div");
    host.appendChild(classed);
    host.appendChild(styled);
    rt.document.body.appendChild(host);

    new rt.wx.SidebarCtrl(host);

    const rows = host.querySelectorAll(".wx-sidebar-link");
    const classedRow = rows.find(r => r.classList.contains("text-primary"));
    assert.ok(classedRow, "the text color class lands on the row");
    assert.ok(classedRow.classList.contains("bg-dark"), "the background color class lands on the row");

    const styledRow = rows.find(r => (r.style.cssText || "").includes("#222222"));
    assert.ok(styledRow, "the inline background style lands on the row");
    assert.ok(styledRow.style.cssText.includes("#111111"), "the inline text style lands on the row");
});
