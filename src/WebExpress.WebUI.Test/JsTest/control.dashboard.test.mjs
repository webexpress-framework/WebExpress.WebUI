/**
 * Headless contract test for the DashboardCtrl control (wx-webui-dashboard).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 *
 * The remaining tests pin the widget look: a widget is a card with a colored
 * top edge, a bare header carrying icon and title, and a "…" menu that lives
 * in the top layer as a native popover. The menu used to be a list toggled
 * through a .show class that the framework stylesheet no longer hides, which
 * left every menu standing open inside the header.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadWebUi, webuiAsset } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.dashboard.js",
    selector: "wx-webui-dashboard",
    ctrl: "DashboardCtrl"
});

/**
 * Builds a two-column board with one statically declared widget, the way the
 * C# ControlDashboard emits it.
 * @param {object} capabilities - The data-* capability flags of the host.
 * @returns {object} The runtime, the host element and the control.
 */
function board(capabilities = {}) {
    const rt = loadWebUi({ browser: true, extraFiles: [
        "i18n/en.js", "webexpress.webui.modal.js", "webexpress.webui.modal.confirm.js",
        "webexpress.webui.input.color.js", "webexpress.webui.dashboard.settings.js", "webexpress.webui.dashboard.js"
    ] });

    const host = rt.createElement("div");
    host.dataset.columns = "state,users";
    host.dataset.columnTitles = "System Status,Users";
    Object.assign(host.dataset, capabilities);

    const widget = rt.createElement("div");
    widget.className = "wx-dashboard-widget";
    widget.dataset.title = "User";
    widget.dataset.icon = "wx-icon-user";
    widget.dataset.color = "green";
    widget.dataset.column = "1";
    widget.dataset.widget = "users";
    host.appendChild(widget);

    rt.document.body.appendChild(host);
    const ctrl = new rt.wx.DashboardCtrl(host);

    return { ...rt, host, ctrl };
}

/**
 * Finds the popover menu and its trigger inside a menu container.
 * @param {object} container - The .wx-dashboard-menu element.
 * @returns {object} The trigger button and the menu list.
 */
function menuOf(container) {
    return {
        button: container.querySelector(".wx-dashboard-menu-btn"),
        menu: container.querySelector(".dropdown-menu")
    };
}

test("a widget is a card with a colored top edge, icon and title in a bare header and its content in the body", () => {
    const { host } = board();

    const cards = host.querySelectorAll(".wx-dashboard-widget-card");
    assert.equal(cards.length, 1);
    const card = cards[0];
    assert.ok(card.classList.contains("card") && card.classList.contains("shadow-sm"), "the widget is a framework card");
    assert.equal(card.style.getPropertyValue("--wx-widget-color"), "green");
    assert.ok(card.classList.contains("wx-widget-has-color"), "the accent color paints the top edge");

    const header = card.querySelector(".card-header");
    const title = header.querySelector(".fw-bold");
    assert.equal(title.textContent, "User");
    assert.ok(title.querySelector("i").classList.contains("wx-icon-user"), "the icon precedes the title");
    assert.ok(header.querySelector(".wx-drag-handle"), "a movable widget carries its drag handle");
    assert.equal(header.children.length, 2, "the header holds the title area and the menu area only");

    const body = card.querySelector(".card-body");
    assert.equal(body.textContent, "Widget content not available.");
});

test("the widget menu is a closed native popover under its trigger instead of a list standing in the header", () => {
    const { host } = board();

    const container = host.querySelector(".wx-dashboard-widget-card .wx-dashboard-menu");
    const { button, menu } = menuOf(container);
    assert.equal(menu.getAttribute("popover"), "auto");
    assert.ok(menu.classList.contains("wx-native-menu"));
    assert.equal(menu.matches(":popover-open"), false, "the menu is closed after rendering");
    assert.equal(menu.classList.contains("show"), false, "no leftover of the class-toggled dropdown");
    assert.equal(button.getAttribute("popovertarget"), menu.id, "the browser toggles the menu on the trigger");
    assert.equal(menu.style.getPropertyValue("position-anchor"), button.style.getPropertyValue("anchor-name"));
    assert.equal(container.classList.contains("wx-menu-open"), false);
});

test("an open widget menu keeps its hover-only trigger visible and a picked entry closes it", () => {
    const { wx, host, ctrl } = board();

    const container = host.querySelector(".wx-dashboard-widget-card .wx-dashboard-menu");
    const { menu } = menuOf(container);

    wx.NativeMenu.show(menu);
    assert.equal(menu.matches(":popover-open"), true);
    assert.ok(container.classList.contains("wx-menu-open"), "the open state is mirrored onto the container");

    const remove = menu.querySelector(".dropdown-item");
    assert.equal(remove.textContent, "Remove");
    assert.ok(remove.querySelector("i").classList.contains("wx-icon-light-trash"), "removing is a trash action, not a dismiss");
    remove.click();

    assert.equal(menu.matches(":popover-open"), false, "the entry closes the menu before acting");
    assert.equal(container.classList.contains("wx-menu-open"), false);
    assert.equal(ctrl._confirm._element.open, true, "the entry hands over to the confirmation");
});

test("removing a widget asks first and drops it only once confirmed", async () => {
    const { host, ctrl } = board();

    const askToRemove = () => host.querySelector(".wx-dashboard-widget-card .dropdown-menu .dropdown-item").click();

    askToRemove();
    const confirm = ctrl._confirm;
    assert.equal(host.querySelectorAll(".wx-dashboard-widget-card").length, 1, "nothing is removed before the answer");
    assert.equal(confirm._element.open, true, "the confirmation is shown");
    assert.equal(confirm._titleH1.textContent, "Remove widget?");
    assert.equal(confirm._bodyDiv.querySelector("p").textContent, "Remove widget “User”? This action cannot be undone.", "the question names the widget");
    assert.equal(confirm._confirmButton.textContent, "Remove");

    // dismissing keeps the widget and leaves the dialog reusable
    confirm._cancelButton.click();
    assert.equal(confirm._element.open, false);
    assert.equal(host.querySelectorAll(".wx-dashboard-widget-card").length, 1);

    askToRemove();
    await confirm._confirmButton.onclick();
    assert.equal(confirm._element.open, false);
    assert.equal(host.querySelectorAll(".wx-dashboard-widget-card").length, 0, "the confirmed widget is gone");
    assert.equal(ctrl._columns[1].widgets.length, 0);
});

test("a column menu drills down in place and a reopened one starts at its top level again", () => {
    const { wx, host } = board({ editableColumn: "true" });

    const container = host.querySelector(".wx-dashboard-lane-title .wx-board-col-menu");
    const { button, menu } = menuOf(container);
    assert.equal(button.getAttribute("popovertarget"), menu.id);
    assert.ok(menu.hasAttribute("data-wx-keep-open"), "a click inside must not dismiss a drill-down menu");

    wx.NativeMenu.show(menu);
    const root = menu.querySelectorAll(".dropdown-item");
    assert.equal(root.length, 3, "rename, size and color");

    // the size entry replaces the entries with the presets behind a back entry
    root[1].click();
    assert.equal(menu.matches(":popover-open"), true, "drilling down keeps the menu open");
    const presets = menu.querySelectorAll(".dropdown-item");
    assert.equal(presets.length, 7, "back plus six size presets");
    assert.ok(presets[0].classList.contains("text-muted"), "the first entry leads back");

    wx.NativeMenu.hide(menu);
    wx.NativeMenu.show(menu);
    assert.equal(menu.querySelectorAll(".dropdown-item").length, 3, "the menu reopens at the top level");
});

test("the column menu asks before deleting and drops the column only once confirmed", async () => {
    const { wx, host, ctrl } = board({ deletableColumn: "true" });

    // the wording ships with the webapp dictionary; the test supplies the shape
    // so the name substitution is what is checked, not the sentence
    wx.I18N.register("en", "webexpress.webapp", { "dashboard.column.delete.message": "Delete “{name}”?" });

    const askToDelete = () => {
        const menu = host.querySelectorAll(".wx-board-col-menu")[0].querySelector(".dropdown-menu");
        menu.querySelectorAll(".dropdown-item").find((b) => b.textContent.endsWith("column.delete")).click();
    };

    askToDelete();
    const confirm = ctrl._confirm;
    assert.equal(ctrl._columns.length, 2, "nothing is deleted before the answer");
    assert.equal(confirm._element.open, true, "the confirmation is shown");
    assert.equal(confirm._bodyDiv.querySelector("p").textContent, "Delete “System Status”?", "the question names the column");

    // dismissing keeps the column and leaves the dialog reusable
    confirm._cancelButton.click();
    assert.equal(confirm._element.open, false);
    assert.equal(ctrl._columns.length, 2);

    askToDelete();
    await confirm._confirmButton.onclick();
    assert.equal(confirm._element.open, false);
    assert.equal(ctrl._columns.length, 1);
    assert.equal(ctrl._columns[0].id, "users");
    assert.equal(host.querySelectorAll(".wx-dashboard-widget-card").length, 1, "the widget in the remaining column stays");

    // the dialog is owned by the control and leaves with it
    ctrl.destroy();
    assert.equal(confirm._element.isConnected, false);
});

test("the widget settings open as a native dialog in the top layer, not as a block at the end of the page", () => {
    const { host, ctrl, document } = board({ configurableWidget: "true" });

    const menu = host.querySelector(".wx-dashboard-widget-card .dropdown-menu");
    menu.querySelectorAll(".dropdown-item").find((b) => b.textContent.endsWith("widget.settings")).click();

    const dialog = ctrl._settingsDialog;
    assert.equal(dialog._element.tagName, "DIALOG", "only a dialog element is styled and layered as a modal");
    assert.equal(dialog._element.open, true, "the settings are shown modally");
    assert.equal(dialog._element.parentNode, document.body);

    // the color row is a flex row with a standing check box, not a .form-check
    const row = dialog._bodyDiv.querySelector(".wx-dashboard-settings-color").parentNode;
    assert.equal(row.querySelector("input.form-check-input").type, "checkbox");
    assert.equal(row.classList.contains("form-check"), false);

    dialog._cancelButton.click();
    assert.equal(dialog._element.open, false);
});

test("a check box outside a .form-check keeps its place in the row", () => {
    const css = fs.readFileSync(webuiAsset("../css/webexpress.webui.base.css"), "utf8");

    const standalone = css.match(/^\.form-check-input\s*\{([^}]*)\}/m);
    assert.ok(standalone, "the plain check box rule exists");
    assert.doesNotMatch(standalone[1], /float|-1\.5rem/, "hanging into the label padding is the business of .form-check");

    const nested = css.match(/^\.form-check \.form-check-input\s*\{([^}]*)\}/m);
    assert.ok(nested, "the nested rule exists");
    assert.match(nested[1], /float:\s*left/);
    assert.match(nested[1], /margin-left:\s*-1\.5rem/);
});

test("the widget header sits on the card surface without a fill, a rule or a class-toggled dropdown", () => {
    const css = fs.readFileSync(webuiAsset("../css/webexpress.webui.dashboard.css"), "utf8");

    const header = css.match(/\.wx-dashboard-widget-card\s*>\s*\.card-header\s*\{([^}]*)\}/);
    assert.ok(header, "the header rule exists");
    assert.match(header[1], /background-color:\s*transparent/);
    assert.match(header[1], /border-bottom:\s*none/);
    assert.doesNotMatch(css, /\.dropdown-menu\.show/, "menus open as popovers, not through a class");

    // the widget relies on the card classes the framework stylesheet provides
    const base = fs.readFileSync(webuiAsset("../css/webexpress.webui.base.css"), "utf8");
    for (const rule of [/^\.card\s*\{/m, /^\.card-body\s*\{/m, /\.card-header[^{]*\{/, /^\.shadow-sm\s*\{/m]) {
        assert.match(base, rule);
    }
});
