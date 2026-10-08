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
    assert.equal(confirm._titleHeading.textContent, "Remove widget?");
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
    assert.equal(root.length, 3, "rename, equal widths and color");

    // the color entry replaces the entries with the palette behind a back entry
    root[2].click();
    assert.equal(menu.matches(":popover-open"), true, "drilling down keeps the menu open");
    const colors = menu.querySelectorAll(".dropdown-item");
    assert.equal(colors.length, 2, "back plus the entry for no color, above the swatches");
    assert.ok(colors[0].classList.contains("text-muted"), "the first entry leads back");
    assert.ok(menu.querySelector(".wx-board-col-swatch"), "the palette follows");

    wx.NativeMenu.hide(menu);
    wx.NativeMenu.show(menu);
    assert.equal(menu.querySelectorAll(".dropdown-item").length, 3, "the menu reopens at the top level");
});

test("the column menu asks before deleting and drops the column only once confirmed", async () => {
    const { wx, host, ctrl } = board({ deletableColumn: "true" });

    // the test supplies the shape of the message so the name substitution is
    // what is checked, not the sentence
    wx.I18N.register("en", "webexpress.webui", { "dashboard.column.delete.message": "Delete “{name}”?" });

    const askToDelete = () => {
        const menu = host.querySelectorAll(".wx-board-col-menu")[0].querySelector(".dropdown-menu");
        menu.querySelectorAll(".dropdown-item").find((b) => b.textContent.endsWith("Delete column")).click();
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
    menu.querySelectorAll(".dropdown-item").find((b) => b.textContent.endsWith("Settings")).click();

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
    const css = fs.readFileSync(webuiAsset("../css/webexpress.webui.css"), "utf8");

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
    const base = fs.readFileSync(webuiAsset("../css/webexpress.webui.css"), "utf8");
    for (const rule of [/^\.card\s*\{/m, /^\.card-body\s*\{/m, /\.card-header[^{]*\{/, /^\.shadow-sm\s*\{/m]) {
        assert.match(base, rule);
    }
});

/**
 * Loads a runtime with the dashboard and its dialogs, for the tests that build
 * their own host.
 * @returns {object} The runtime.
 */
function runtime() {
    return loadWebUi({ browser: true, extraFiles: [
        "i18n/en.js", "webexpress.webui.modal.js", "webexpress.webui.modal.confirm.js",
        "webexpress.webui.input.color.js", "webexpress.webui.dashboard.settings.js", "webexpress.webui.dashboard.js"
    ] });
}

test("a column rendered by ControlDashboardColumn shows its title, not its id", () => {
    const rt = runtime();
    const host = rt.createElement("div");
    const column = rt.createElement("div");
    column.id = "state";
    column.className = "wx-column";
    // ControlDashboardColumn writes the translated title as data-label
    column.dataset.label = "System Status";
    host.appendChild(column);
    rt.document.body.appendChild(host);

    new rt.wx.DashboardCtrl(host);

    assert.equal(host.querySelector(".wx-board-col-title").textContent, "System Status");
});

test("declared widget content stays the same live nodes through every render", () => {
    const rt = runtime();
    const host = rt.createElement("div");
    host.dataset.columns = "a,b";
    const widget = rt.createElement("div");
    widget.className = "wx-dashboard-widget";
    widget.dataset.column = "0";
    // stands in for a control the controller has already set up inside the widget
    const inner = rt.createElement("span");
    inner.className = "probe";
    let clicks = 0;
    inner.addEventListener("click", () => clicks++);
    widget.appendChild(inner);
    host.appendChild(widget);
    rt.document.body.appendChild(host);

    const ctrl = new rt.wx.DashboardCtrl(host);
    assert.equal(host.querySelector(".card-body .probe"), inner, "the body holds the declared node, not a copy");

    ctrl.render();
    const probe = host.querySelector(".card-body .probe");
    assert.equal(probe, inner, "a render moves the node rather than re-parsing markup");
    probe.click();
    assert.equal(clicks, 1, "what was bound to the node keeps working");
});

test("a confirmed column deletion drops the column it named, even after a reload reordered the board", async () => {
    const { host, ctrl } = board({ deletableColumn: "true" });
    const askToDelete = () => host.querySelectorAll(".wx-board-col-menu")[0].querySelector(".dropdown-menu")
        .querySelectorAll(".dropdown-item").find((b) => b.textContent.endsWith("Delete column")).click();
    const ids = () => ctrl._columns.map((c) => c.id).join(",");

    askToDelete();
    // a reload while the dialog is open puts the columns in a new order
    ctrl._columns = [ctrl._columns[1], ctrl._columns[0]];
    ctrl.render();
    await ctrl._confirm._confirmButton.onclick();
    assert.equal(ids(), "users", "the named column is gone, not the one now at its index");

    // a column the reload already dropped is not replaced by whatever took its place
    askToDelete();
    ctrl._columns = [{ id: "other", title: "Other", size: "1fr", widgets: [] }];
    ctrl.render();
    await ctrl._confirm._confirmButton.onclick();
    assert.equal(ids(), "other");
});

test("a confirmed widget removal finds the widget wherever a reload put it and leaves a replaced one alone", async () => {
    const { host, ctrl } = board();
    const askToRemove = () => host.querySelector(".wx-dashboard-widget-card .dropdown-menu .dropdown-item").click();
    const count = () => ctrl._columns[0].widgets.length + ctrl._columns[1].widgets.length;

    askToRemove();
    // a reload while the dialog is open moved the widget into the other column
    ctrl._columns[0].widgets.push(ctrl._columns[1].widgets.pop());
    ctrl.render();
    await ctrl._confirm._confirmButton.onclick();
    assert.equal(count(), 0, "the widget is removed from the column it sits in now");

    ctrl._columns[1].widgets.push({ instanceId: "a", id: "users", title: "User" });
    ctrl.render();
    askToRemove();
    // a reload hands over fresh widgets with fresh instance ids
    ctrl._columns[1].widgets = [{ instanceId: "b", id: "users", title: "User" }];
    ctrl.render();
    await ctrl._confirm._confirmButton.onclick();
    assert.equal(count(), 1, "a widget the dialog did not name is not guessed at");
});

test("the board update sends every widget's instance id back, so the server can keep it", () => {
    const { ctrl } = board();
    ctrl._columns[1].widgets[0].instanceId = "stored-1";

    assert.equal(ctrl._serializeBoard()[1].widgets[0].instanceId, "stored-1");
});

test("a settings edit reaches the widget a reload handed over under the same instance id", () => {
    const { host, ctrl } = board({ configurableWidget: "true" });
    ctrl._columns[1].widgets[0].instanceId = "stored-1";
    ctrl.render();
    host.querySelector(".wx-dashboard-widget-card .dropdown-menu")
        .querySelectorAll(".dropdown-item").find((b) => b.textContent.endsWith("Settings")).click();
    const dialog = ctrl._settingsDialog;
    dialog._bodyDiv.querySelector("input.form-control").value = "Renamed";

    // a reload while the dialog is open hands over a fresh copy carrying the stored id
    ctrl._columns[1].widgets = [{ instanceId: "stored-1", id: "users", title: "User", params: {} }];
    ctrl.render();
    dialog._okButton.onclick();

    assert.equal(ctrl._columns[1].widgets[0].title, "Renamed", "the edit is not lost on the orphaned copy");
    assert.equal(host.querySelector(".wx-dashboard-widget-card .card-header .fw-bold").textContent, "Renamed");
});

test("a rebuild during a column rename releases it without committing the abandoned input", () => {
    const { wx, host, ctrl } = board({ editableColumn: "true" });
    let changes = 0;
    host.addEventListener(wx.Event.CHANGE_VALUE_EVENT, () => changes++);
    const rename = () => host.querySelector(".wx-board-col-menu .dropdown-menu")
        .querySelectorAll(".dropdown-item").find((b) => b.textContent.endsWith("Rename column")).click();

    rename();
    const input = host.querySelector(".wx-board-col-input");
    input.value = "Renamed";

    // a reload replaces the header; firefox reports no blur for the removed input,
    // chromium reports one into the rebuilt board
    ctrl.render();
    input.dispatchEvent({ type: "blur" });

    assert.equal(ctrl._columns[0].label, "System Status");
    assert.equal(changes, 0, "nothing is persisted from the abandoned input");

    rename();
    assert.ok(host.querySelector(".wx-board-col-input"), "a new rename can start");
});

test("the settings dialog leaves the page with the dashboard", () => {
    const { host, ctrl } = board({ configurableWidget: "true" });
    host.querySelector(".wx-dashboard-widget-card .dropdown-menu")
        .querySelectorAll(".dropdown-item").find((b) => b.textContent.endsWith("Settings")).click();
    const dialog = ctrl._settingsDialog._element;

    ctrl.destroy();

    assert.equal(dialog.open, false);
    assert.equal(dialog.isConnected, false, "no orphaned dialog stays on the body");
});

test("the chart widget leaves its chart to the controller, which would otherwise build a second one", () => {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.dashboard.js", "widgets/default.js"] });
    let built = 0;
    rt.wx.ChartCtrl = class { constructor() { built++; } };

    const body = rt.createElement("div");
    rt.wx.DashboardWidgets.get("widget_chart").render(body, { params: {} });

    assert.equal(built, 0, "the widget does not construct the chart by hand");
    assert.ok(body.querySelector(".wx-webui-chart"), "the host keeps the selector the controller creates the chart from");
});

/**
 * Builds a board of columns with the given sizes, the way the server sends them.
 * @param {string} sizes - The comma separated column sizes.
 * @param {object} capabilities - The data-* capability flags of the host.
 * @returns {object} The runtime, the host and the control.
 */
function sized(sizes, capabilities = {}) {
    const rt = runtime();
    const host = rt.createElement("div");
    const count = sizes.split(",").length;
    host.dataset.columns = Array.from({ length: count }, (_, i) => "c" + i).join(",");
    host.dataset.columnTitles = Array.from({ length: count }, (_, i) => "C" + i).join(",");
    host.dataset.columnSize = sizes;
    Object.assign(host.dataset, capabilities);
    rt.document.body.appendChild(host);
    return { ...rt, host, ctrl: new rt.wx.DashboardCtrl(host) };
}

/**
 * Rounds weights for comparison and leaves the vm realm behind.
 * @param {Array<number>} weights - The weights.
 * @returns {string} The rounded weights.
 */
function shares(weights) {
    return Array.from(weights, (w) => Math.round(w * 100) / 100).join(" ");
}

/**
 * Compares weights within the precision they are stored with.
 * @param {Array<number>} actual - The weights of the board.
 * @param {Array<number>} expected - The expected weights.
 * @param {string} message - The assertion message.
 */
function near(actual, expected, message) {
    const values = Array.from(actual);
    assert.equal(values.length, expected.length, message);
    values.forEach((w, i) => assert.ok(Math.abs(w - expected[i]) < 0.002, `${message}: ${values.join(" ")}`));
}

/**
 * Gives the wrappers of a rendered board a width, since the dom stub measures nothing.
 * @param {object} host - The dashboard host.
 * @param {number} width - The width of every column in pixels.
 */
function measure(host, width) {
    for (const wrapper of host.querySelectorAll(".wx-dashboard-lane-wrapper")) {
        wrapper.getBoundingClientRect = () => ({ width: width, height: 0, left: 0, top: 0, right: width, bottom: 0 });
    }
}

/**
 * Fires a pointer event carrying the fields the divider reads.
 * @param {object} el - The divider.
 * @param {string} type - The event type.
 * @param {number} clientX - The pointer position.
 */
function pointer(el, type, clientX) {
    el.dispatchEvent({ type: type, button: 0, pointerId: 1, clientX: clientX, preventDefault() { } });
}

test("percentages that claim more than the row are scaled down until the board fits", () => {
    const { host, ctrl } = sized("75%,75%,75%");

    assert.equal(shares(ctrl._columnWeights()), "1 1 1", "three equal claims become three equal shares");
    assert.equal(host.querySelector(".wx-dashboard-row").style.getPropertyValue("--wx-board-template"),
        "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)", "every track can shrink below its content");
});

test("sizes from before keep their proportions when they fitted", () => {
    assert.equal(shares(sized("25%,*").ctrl._columnWeights()), "0.5 1.5", "a quarter and the rest");
    assert.equal(shares(sized("50%,1fr,1fr").ctrl._columnWeights()), "1.5 0.75 0.75", "the fractions share what the percentage leaves");
    assert.equal(shares(sized("1fr,2fr,auto").ctrl._columnWeights()), "0.75 1.5 0.75", "auto counts as one average column");
});

test("a divider sits between every two columns of an editable board, none after the last", () => {
    assert.equal(sized("1fr,1fr,1fr").host.querySelectorAll(".wx-dashboard-col-resizer").length, 0, "a read-only board has no dividers");

    const { host } = sized("1fr,3fr,1fr", { editableColumn: "true" });
    const dividers = host.querySelectorAll(".wx-dashboard-col-resizer");
    assert.equal(dividers.length, 2);
    assert.equal(dividers[0].getAttribute("role"), "separator");
    assert.equal(dividers[0].getAttribute("aria-orientation"), "vertical");
    assert.equal(dividers[0].getAttribute("aria-valuenow"), "25", "the left column takes a quarter of the pair");
    assert.equal(dividers[0].getAttribute("aria-label"), "Width of “C0” and “C1”");
    assert.equal(dividers[0].tabIndex, 0, "the keyboard reaches the divider");
});

test("dragging a divider moves width between its two columns only and stores the board as weights", () => {
    const { wx, host, ctrl } = sized("1fr,1fr,1fr", { editableColumn: "true" });
    const changes = [];
    host.addEventListener(wx.Event.CHANGE_VALUE_EVENT, (e) => changes.push(e.detail));
    measure(host, 300);
    const divider = host.querySelectorAll(".wx-dashboard-col-resizer")[0];
    const row = host.querySelector(".wx-dashboard-row");

    pointer(divider, "pointerdown", 100);
    pointer(divider, "pointermove", 160);
    assert.equal(row.style.getPropertyValue("--wx-board-template"),
        "minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 1fr)", "the row follows the pointer while dragging");
    assert.equal(changes.length, 0, "nothing is stored before the pointer is let go");

    pointer(divider, "pointerup", 160);
    assert.equal(ctrl._columns.map((c) => c.size).join(","), "1.2fr,0.8fr,1fr", "the third column keeps its width");
    assert.equal(changes.length, 1);
    assert.equal(changes[0].action, "columns");
    assert.equal(divider.getAttribute("aria-valuenow"), "60");
});

test("a column cannot be dragged narrower than 160 pixels", () => {
    const { host, ctrl } = sized("1fr,1fr", { editableColumn: "true" });
    measure(host, 300);
    const divider = host.querySelector(".wx-dashboard-col-resizer");

    pointer(divider, "pointerdown", 300);
    pointer(divider, "pointermove", -2000);
    pointer(divider, "pointerup", -2000);

    // 160 of the pair's 600 pixels
    near(ctrl._columnWeights(), [0.533, 1.467], "the left column stops at the minimum");
});

test("a cancelled drag leaves the board as it was", () => {
    const { wx, host, ctrl } = sized("1fr,1fr", { editableColumn: "true" });
    let changes = 0;
    host.addEventListener(wx.Event.CHANGE_VALUE_EVENT, () => changes++);
    measure(host, 300);
    const divider = host.querySelector(".wx-dashboard-col-resizer");

    pointer(divider, "pointerdown", 100);
    pointer(divider, "pointermove", 250);
    pointer(divider, "pointercancel", 250);

    assert.equal(ctrl._columns.map((c) => c.size).join(","), "1fr,1fr");
    assert.equal(host.querySelector(".wx-dashboard-row").style.getPropertyValue("--wx-board-template"), "minmax(0, 1fr) minmax(0, 1fr)");
    assert.equal(changes, 0);
});

test("the arrow keys move a divider in steps and a double click splits the pair evenly", () => {
    const { host, ctrl } = sized("1fr,1fr,2fr", { editableColumn: "true" });
    const dividers = host.querySelectorAll(".wx-dashboard-col-resizer");

    // an average column weighs 1, so the board reads 0.75 0.75 1.5 and the pair 1.5
    dividers[0].dispatchEvent({ type: "keydown", key: "ArrowRight", preventDefault() { } });
    near(ctrl._columnWeights(), [0.825, 0.675, 1.5], "a step is a twentieth of the pair");

    dividers[1].dispatchEvent({ type: "dblclick" });
    near(ctrl._columnWeights(), [0.825, 1.0875, 1.0875], "the second divider works on the width the first one left");
});

test("the column menu evens out every width again", () => {
    const { host, ctrl } = sized("10%,60%,30%", { editableColumn: "true" });
    const menu = host.querySelector(".wx-board-col-menu .dropdown-menu");

    menu.querySelectorAll(".dropdown-item").find((b) => b.textContent.endsWith("Equal column widths")).click();

    assert.equal(ctrl._columns.map((c) => c.size).join(","), "1fr,1fr,1fr");
});

test("a new column takes an average width and the others keep their proportions", () => {
    const { ctrl } = sized("25%,*", { addableColumn: "true" });

    ctrl._addColumn();

    assert.equal(ctrl._columns.map((c) => c.size).join(","), "0.5fr,1.5fr,1fr",
        "a percentage would have left the new column a sliver of the row");
});
