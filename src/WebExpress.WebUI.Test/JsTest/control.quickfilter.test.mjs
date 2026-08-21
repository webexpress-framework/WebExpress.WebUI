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

/**
 * Builds a chip that creates a new filter, carrying the given data attributes.
 * @param {object} rt - The loaded runtime.
 * @param {string} id - The chip id.
 * @param {object} data - The dataset entries (text, icon, ...).
 * @returns {object} The chip element.
 */
function addChip(rt, id, data = {}) {
    const chip = rt.document.createElement("button");
    chip.id = id;
    chip.classList.add("wx-quickfilter-add");
    chip.dataset.wxPrimaryAction = "modal";
    chip.dataset.wxPrimaryTarget = "#newfilter";
    for (const [key, value] of Object.entries(data)) {
        chip.dataset[key] = value;
    }
    return chip;
}

test("wx-webui-quickfilter renders the add chip with its action and the plus default", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    host.appendChild(addChip(rt, "newfilter", { text: "New filter" }));
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    const chip = host.querySelector("#newfilter");
    assert.ok(chip, "the add chip is rebuilt");
    assert.ok(chip.classList.contains("wx-quickfilter-add"), "the chip keeps its add class");
    assert.ok(chip.classList.contains("wx-quickfilter-btn-chip"), "the chip looks like the other chips");
    assert.ok(chip.textContent.includes("New filter"), "the chip carries the authored label");
    assert.ok(chip.querySelector("i.wx-icon-light-plus"), "the chip falls back to the plus icon");
    assert.equal(chip.dataset.wxPrimaryTarget, "#newfilter", "the authored action survives the rebuild");
});

test("wx-webui-quickfilter labels an icon-only add chip for assistive technology", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    host.appendChild(addChip(rt, "newfilter"));
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    const chip = host.querySelector("#newfilter");
    assert.ok(chip.getAttribute("aria-label"), "an icon-only chip announces its action");
});

test("wx-webui-quickfilter keeps the add chip trailing the active filter chips", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    host.appendChild(addChip(rt, "newfilter"));
    host.appendChild(filterButton(rt, "status", "Status"));
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    rt.wx.FilterRegistry.registerFilters([{ id: "loose", name: "Loose" }]);
    rt.wx.FilterRegistry.activate("loose");

    const row = host.querySelector("div");
    const last = row.children[row.children.length - 1];
    assert.equal(last.id, "newfilter", "the add chip stays at the end of the bar");
});

test("wx-webui-quickfilter does not treat the add chip as a filter", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    host.appendChild(addChip(rt, "newfilter"));
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    assert.ok(!rt.wx.FilterRegistry.getFilterConfig("newfilter"), "the add chip is not registered as a filter");

    const chip = host.querySelector("#newfilter");
    assert.ok(!chip.classList.contains("active"), "the add chip never shows active");
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

test("wx-webui-quickfilter announces a definition change so bound controls refresh", () => {
    const rt = loadQuickfilter();
    const seen = [];
    rt.document.addEventListener(rt.wx.Event.CHANGE_FILTER_DEFINITION_EVENT, (e) => seen.push(e.detail));

    rt.wx.FilterRegistry.defineFilter({ id: "mine", name: "Mine", custom: true, criteria: "author:me" }, "bar");
    assert.equal(seen.length, 1, "defining a filter is announced");
    assert.equal(seen[0].origin, "bar", "the origin travels along so the causing control skips its own event");

    const config = rt.wx.FilterRegistry.getFilterConfig("mine");
    assert.equal(config.custom, true, "the registry keeps the user-defined flag");
    assert.equal(config.criteria, "author:me", "the registry keeps the opaque criteria");

    rt.wx.FilterRegistry.activate("mine");
    rt.wx.FilterRegistry.undefineFilter("mine", "bar");

    assert.equal(seen.length, 2, "removing a filter is announced");
    assert.equal(rt.wx.FilterRegistry.getFilterConfig("mine"), null, "the definition is gone");
    assert.ok(!rt.wx.FilterRegistry.getActiveFilters().includes("mine"), "a removed filter is no longer active");
});

test("wx-webui-quickfilter leaves an application filter without an options menu", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    host.appendChild(filterButton(rt, "status", "Status"));
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    assert.equal(host.querySelectorAll(".wx-quickfilter-menu-toggle").length, 0, "an authored filter carries no menu");
});

test("wx-webui-quickfilter keeps the authored action on a rebuilt add chip", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    host.appendChild(addChip(rt, "newfilter"));
    rt.document.body.appendChild(host);

    new rt.wx.QuickFilterCtrl(host);

    // the framework ships no editor; the chip carries the modal action the
    // application authored, so the framework's action mechanism opens its dialog
    const chip = host.querySelector("#newfilter");
    assert.equal(chip.dataset.wxPrimaryAction, "modal", "the chip keeps the authored action");
    assert.equal(chip.dataset.wxPrimaryTarget, "#newfilter", "the chip keeps the authored target");
});

test("wx-webui-quickfilter puts the authored edit action on a user-defined chip", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");

    const prototype = rt.document.createElement("div");
    prototype.classList.add("wx-quickfilter-edit-action");
    prototype.dataset.wxPrimaryAction = "modal";
    prototype.dataset.wxPrimaryTarget = "#filtereditor";
    prototype.dataset.wxPrimaryUri = "/games";
    host.appendChild(prototype);
    rt.document.body.appendChild(host);

    const ctrl = new rt.wx.QuickFilterCtrl(host);

    rt.wx.FilterRegistry.defineFilter({ id: "mine", name: "Mine", custom: true });
    ctrl._staticButtonConfigs = [];
    const container = rt.document.createElement("div");
    const chip = rt.document.createElement("button");
    chip.id = "mine";
    container.appendChild(ctrl._withCustomMenu(chip, { id: "mine", custom: true }));

    const edit = container.querySelectorAll(".dropdown-item")[0];
    assert.equal(edit.dataset.wxPrimaryAction, "modal", "the entry carries the authored action");
    assert.equal(edit.dataset.wxPrimaryTarget, "#filtereditor", "the entry carries the authored target");
    assert.equal(edit.dataset.wxPrimaryUri, "/games?id=mine", "the uri names the filter being edited");
    assert.equal(edit.dataset.wxFilter, "mine", "the entry names the filter it edits");
});

test("wx-webui-quickfilter offers no edit entry without an authored edit action", () => {
    const rt = loadQuickfilter();
    const host = rt.document.createElement("div");
    rt.document.body.appendChild(host);

    const ctrl = new rt.wx.QuickFilterCtrl(host);

    const container = rt.document.createElement("div");
    const chip = rt.document.createElement("button");
    chip.id = "mine";
    container.appendChild(ctrl._withCustomMenu(chip, { id: "mine", custom: true }));

    const items = container.querySelectorAll(".dropdown-item");
    assert.equal(items.length, 1, "only the removal is offered");
});
