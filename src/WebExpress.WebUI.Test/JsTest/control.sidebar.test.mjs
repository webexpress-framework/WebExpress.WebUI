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

/**
 * Builds an active .wx-sidebar-link, optionally nested inside a parent group so
 * the active row lives under a collapsible branch.
 * @param {object} rt - The loaded runtime.
 * @param {boolean} nested - Whether to wrap the active row in a parent group.
 * @returns {object} The top-level element to hand to the controller.
 */
function activeItem(rt, nested) {
    const active = link(rt, "current", null);
    active.dataset.active = "active";

    if (!nested) {
        return active;
    }

    const children = rt.document.createElement("div");
    children.classList.add("wx-sidebar-children");
    children.appendChild(active);

    const parent = link(rt, "parent", null);
    parent.appendChild(children);
    return parent;
}

test("wx-webui-sidebar reveals a flyout while reduced and hides it on mouse-leave", () => {
    const rt = loadSidebar();
    const host = rt.document.createElement("div");
    host.appendChild(link(rt, "home", null));
    rt.document.body.appendChild(host);

    // the stubbed element reports offsetWidth 0, so the sidebar starts reduced
    new rt.wx.SidebarCtrl(host);
    assert.ok(host.classList.contains("wx-sidebar-reduced"), "the sidebar starts reduced");

    const wrapper = host.querySelector(".wx-sidebar-wrapper");
    wrapper.dispatchEvent(new rt.sandbox.Event("mouseenter"));
    assert.ok(host.classList.contains("wx-sidebar-flyout"), "hovering the item area opens the flyout");

    host.dispatchEvent(new rt.sandbox.Event("mouseleave"));
    assert.ok(!host.classList.contains("wx-sidebar-flyout"), "leaving closes the flyout");
});

test("wx-webui-sidebar does not open a flyout when the footer toolbar is hovered", () => {
    const rt = loadSidebar();
    const host = rt.document.createElement("div");
    host.appendChild(link(rt, "home", null));
    rt.document.body.appendChild(host);

    new rt.wx.SidebarCtrl(host);

    // the footer toolbar is a sibling of the item area, so entering the sidebar
    // element outside the wrapper must not reveal the flyout
    host.dispatchEvent(new rt.sandbox.Event("mouseenter"));
    assert.ok(!host.classList.contains("wx-sidebar-flyout"), "hovering the sidebar chrome does not open the flyout");
});

test("wx-webui-sidebar does not open a flyout when expanded", () => {
    const rt = loadSidebar();
    const host = rt.document.createElement("div");
    host.appendChild(link(rt, "home", null));
    rt.document.body.appendChild(host);

    const ctrl = new rt.wx.SidebarCtrl(host);
    ctrl.expand();

    const wrapper = host.querySelector(".wx-sidebar-wrapper");
    wrapper.dispatchEvent(new rt.sandbox.Event("mouseenter"));
    assert.ok(!host.classList.contains("wx-sidebar-flyout"), "an expanded sidebar has no hover flyout");
});

test("wx-webui-sidebar closes the flyout when a navigation link inside it is clicked", () => {
    const rt = loadSidebar();
    const host = rt.document.createElement("div");
    host.appendChild(link(rt, "home", null));
    rt.document.body.appendChild(host);

    new rt.wx.SidebarCtrl(host);

    const wrapper = host.querySelector(".wx-sidebar-wrapper");
    wrapper.dispatchEvent(new rt.sandbox.Event("mouseenter"));
    assert.ok(host.classList.contains("wx-sidebar-flyout"), "the flyout is open");

    // simulate the click bubbling from the anchor up to the sidebar listener
    const anchor = host.querySelector("a.wx-link");
    const clickEvent = new rt.sandbox.Event("click");
    clickEvent.target = anchor;
    host.dispatchEvent(clickEvent);
    assert.ok(!host.classList.contains("wx-sidebar-flyout"), "choosing a link dismisses the flyout");
});

test("wx-webui-sidebar honors data-hover-expanded=false by suppressing the flyout", () => {
    const rt = loadSidebar();
    const host = rt.document.createElement("div");
    host.setAttribute("data-hover-expanded", "false");
    host.appendChild(link(rt, "home", null));
    rt.document.body.appendChild(host);

    new rt.wx.SidebarCtrl(host);

    const wrapper = host.querySelector(".wx-sidebar-wrapper");
    wrapper.dispatchEvent(new rt.sandbox.Event("mouseenter"));
    assert.ok(!host.classList.contains("wx-sidebar-flyout"), "the flyout stays closed when hover-expand is disabled");
});

test("wx-webui-sidebar honors data-scroll-active=false by leaving groups collapsed", () => {
    const rt = loadSidebar();
    const host = rt.document.createElement("div");
    host.setAttribute("data-scroll-active", "false");
    host.appendChild(activeItem(rt, true));
    rt.document.body.appendChild(host);

    new rt.wx.SidebarCtrl(host);

    const group = host.querySelector(".wx-sidebar-group");
    assert.ok(group, "the parent link is wrapped into a group");
    assert.ok(!group.classList.contains("wx-expanded"), "the branch is not auto-expanded when scroll-active is disabled");
});

test("wx-webui-sidebar expands the ancestor group of a nested active item", () => {
    const rt = loadSidebar();
    const host = rt.document.createElement("div");
    host.appendChild(activeItem(rt, true));
    rt.document.body.appendChild(host);

    new rt.wx.SidebarCtrl(host);

    const group = host.querySelector(".wx-sidebar-group");
    assert.ok(group, "the parent link is wrapped into a group");
    assert.ok(group.classList.contains("wx-expanded"), "the active item's branch is expanded so it is visible");
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
