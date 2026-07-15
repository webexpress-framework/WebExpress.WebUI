/**
 * Headless contract test for the QuickFilterCtrl control (wx-webui-quickfilter).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle. The
 * focused tests below cover the optional icon and badge visuals of the filter
 * items and the multi-select count badge.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.quickfilter.js",
    selector: "wx-webui-quickfilter",
    ctrl: "QuickFilterCtrl"
});

/**
 * Loads a runtime with the button control available, because the quickfilter
 * rebuilds its chips through webexpress.webui.ButtonCtrl.
 * @returns {object} The loaded runtime.
 */
function loadQuickfilter() {
    return loadWebUi({ browser: true, extraFiles: ["webexpress.webui.button.js", "webexpress.webui.quickfilter.js"] });
}

/**
 * Builds a static one-click filter button carrying the given data attributes.
 * @param {object} rt - The loaded runtime.
 * @param {string} id - The filter id.
 * @param {string} label - The button label.
 * @param {object} data - The dataset entries (icon, badge, ...).
 * @returns {object} The button element.
 */
function filterButton(rt, id, label, data = {}) {
    const btn = rt.document.createElement("button");
    btn.id = id;
    btn.classList.add("wx-quickfilter-button");
    btn.textContent = label;
    for (const [key, value] of Object.entries(data)) {
        btn.dataset[key] = value;
    }
    return btn;
}

test("wx-webui-quickfilter renders the icon and badge of a static button chip", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    host.appendChild(filterButton(rt, "status", "Status", { icon: "fas fa-home", badge: "42" }));
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    const icon = host.querySelector("i.fa-home");
    assert.ok(icon, "the chip renders the icon element");

    const badge = host.querySelector(".wx-quickfilter-badge");
    assert.ok(badge, "the chip renders the badge element");
    assert.equal(badge.textContent, "42", "the badge carries the count");
});

test("wx-webui-quickfilter applies the badge color class and style", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    host.appendChild(filterButton(rt, "classed", "Classed", { badge: "3", badgeColor: "text-bg-danger" }));
    host.appendChild(filterButton(rt, "styled", "Styled", { badge: "7", badgeStyle: "background:#7c3aed;" }));
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    const badges = host.querySelectorAll(".wx-quickfilter-badge");
    assert.equal(badges.length, 2, "both chips carry a badge");

    const classed = badges.find((b) => b.classList.contains("text-bg-danger"));
    assert.ok(classed, "the system color lands as a css class on the badge");

    const styled = badges.find((b) => (b.style.cssText || "").includes("#7c3aed"));
    assert.ok(styled, "the user color lands as an inline style on the badge");
});

test("wx-webui-quickfilter colors a chip through its class and accent", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    host.appendChild(filterButton(rt, "system", "System", { color: "btn-success" }));
    host.appendChild(filterButton(rt, "user", "User", { colorValue: "#7c3aed" }));
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    const system = host.querySelector("#system");
    assert.ok(system.classList.contains("btn-success"), "the system color class lands on the chip");

    const user = host.querySelector("#user");
    assert.equal(user.style.getPropertyValue("--wx-quickfilter-accent"), "#7c3aed", "the user color feeds the chip accent");
});

test("wx-webui-quickfilter omits the badge when no badge text is authored", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    host.appendChild(filterButton(rt, "plain", "Plain"));
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    assert.equal(host.querySelectorAll(".wx-quickfilter-badge").length, 0, "a chip without a badge stays unchanged");
});

test("wx-webui-quickfilter renders the badge of a dropdown option", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");

    const dropdown = rt.document.createElement("div");
    dropdown.id = "sprint";
    dropdown.classList.add("wx-quickfilter-dropdown");
    dropdown.dataset.text = "Sprint";

    const option = rt.document.createElement("button");
    option.id = "sprint-current";
    option.classList.add("wx-quickfilter-dropdown-option");
    option.dataset.text = "Current";
    option.dataset.badge = "14";
    option.dataset.badgeColor = "text-bg-danger";
    dropdown.appendChild(option);

    host.appendChild(dropdown);
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    const badge = host.querySelector(".wx-quickfilter-dropdown-menu .wx-quickfilter-badge");
    assert.ok(badge, "the rebuilt option carries the badge");
    assert.equal(badge.textContent, "14", "the badge carries the count");
    assert.ok(badge.classList.contains("text-bg-danger"), "the badge carries the color class");
});

test("wx-webui-quickfilter shows the multi-select selection count as a badge", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");

    const multi = rt.document.createElement("div");
    multi.id = "tags";
    multi.classList.add("wx-quickfilter-multiselect");
    multi.dataset.text = "Tags";

    for (const id of ["tag-bug", "tag-feature"]) {
        const option = rt.document.createElement("button");
        option.id = id;
        option.classList.add("wx-quickfilter-dropdown-option");
        option.dataset.text = id;
        option.dataset.wxPrimaryGroup = "tags";
        multi.appendChild(option);
    }

    host.appendChild(multi);
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    // no selection: the toggle shows the plain label without a badge
    let toggle = host.querySelector(".wx-quickfilter-dropdown-toggle");
    assert.ok(toggle, "the multi-select renders a toggle");
    assert.equal(toggle.querySelectorAll(".wx-quickfilter-badge").length, 0, "no badge while nothing is selected");

    // selecting an option re-renders the bar and the count appears as a badge
    rt.wx.FilterRegistry.activate("tag-bug");

    toggle = host.querySelector(".wx-quickfilter-dropdown-toggle");
    const badge = toggle.querySelector(".wx-quickfilter-badge");
    assert.ok(badge, "the selection count renders as a badge");
    assert.equal(badge.textContent, "1", "the badge carries the selection count");

    const label = toggle.querySelector("span");
    assert.ok(!label.textContent.includes("(1)"), "the count no longer piggybacks on the label text");
});
