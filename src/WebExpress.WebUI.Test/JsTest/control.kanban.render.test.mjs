/**
 * Headless render tests for the kanban card assignee avatar, the optional
 * footer chips and the column-reorder feedback. They cover the initials badge,
 * the image preference, the initials fallback derived from the name, the
 * unassigned card, the application-defined footer infos and the insertion
 * indicator plus landing flash while a column is dragged.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, webuiAsset } from "./harness.mjs";

/**
 * Loads a runtime with the kanban control.
 * @returns {object} The loaded runtime.
 */
function load() {
    return loadWebUi({ extraFiles: [webuiAsset("webexpress.webui.kanban.js")] });
}

/**
 * Loads a runtime with the kanban control and its swimlane dependency, needed
 * once a board renders swimlanes (each becomes a SectionCtrl).
 * @returns {object} The loaded runtime.
 */
function loadFull() {
    return loadWebUi({ extraFiles: [webuiAsset("webexpress.webui.section.js"), webuiAsset("webexpress.webui.kanban.js")] });
}

/**
 * Builds a board host carrying the given data attributes and constructs the
 * control on it.
 * @param {object} runtime - The loaded runtime.
 * @param {object} hostData - The data attributes for the host node.
 * @returns {{ctrl: object, host: object}} The control and its host.
 */
function buildBoard(runtime, hostData) {
    const host = runtime.document.createElement("div");
    Object.assign(host.dataset, hostData);
    const ctrl = new runtime.wx.KanbanCtrl(host);
    return { ctrl, host };
}

/**
 * Fires a click event carrying the guards the menu handlers expect.
 * @param {object} el - The element to click.
 */
function clickEntry(el) {
    el.dispatchEvent({ type: "click", preventDefault() { }, stopPropagation() { } });
}

/**
 * Finds a dropdown entry by its exact label. The headless runtime loads no
 * webapp i18n, so an unresolved key resolves to the key itself; the tests match
 * that stable key.
 * @param {object} root - The subtree to search.
 * @param {string} label - The entry label (an i18n key).
 * @returns {object|undefined} The matching button, or undefined.
 */
function entry(root, label) {
    return root.querySelectorAll(".dropdown-item").find((b) => b.textContent === label);
}

/**
 * Builds a single-column board carrying one card with the given data
 * attributes and constructs the control on it.
 * @param {object} runtime - The loaded runtime.
 * @param {object} cardData - Extra data attributes for the card node.
 * @returns {{ctrl: object, host: object}} The control and its host.
 */
function build(runtime, cardData) {
    const host = runtime.document.createElement("div");
    host.dataset.columns = "todo";
    const card = runtime.document.createElement("div");
    card.className = "wx-kanban-card";
    Object.assign(card.dataset, { cardId: "c1", columnId: "todo", label: "Card" }, cardData);
    host.appendChild(card);
    const ctrl = new runtime.wx.KanbanCtrl(host);
    return { ctrl, host };
}

test("an assigned card renders the initials badge with color and tooltip", () => {
    const runtime = load();
    const { host } = build(runtime, {
        assigneeId: "u1",
        assigneeName: "Guybrush Threepwood",
        assigneeInitials: "GT",
        assigneeColor: "#1d4ed8"
    });

    const badge = host.querySelector(".card-assignee");
    assert.ok(badge, "the avatar badge exists");
    assert.equal(badge.tagName, "SPAN");
    assert.equal(badge.textContent, "GT");
    assert.equal(badge.style.background, "#1d4ed8");
    assert.equal(badge.title, "Guybrush Threepwood");
});

test("an avatar image replaces the initials badge", () => {
    const runtime = load();
    const { host } = build(runtime, {
        assigneeId: "u1",
        assigneeName: "Guybrush Threepwood",
        assigneeInitials: "GT",
        assigneeImage: "/img/guybrush.png"
    });

    const avatar = host.querySelector(".card-assignee");
    assert.ok(avatar, "the avatar exists");
    assert.equal(avatar.tagName, "IMG");
    assert.equal(avatar.src, "/img/guybrush.png");
    assert.equal(avatar.title, "Guybrush Threepwood");
});

test("initials fall back to the assignee name when omitted", () => {
    const runtime = load();
    const { host } = build(runtime, { assigneeId: "u1", assigneeName: "elaine" });

    assert.equal(host.querySelector(".card-assignee").textContent, "EL");
});

test("an unassigned card renders no avatar", () => {
    const runtime = load();
    const { host } = build(runtime);

    assert.equal(host.querySelectorAll(".card-assignee").length, 0);
});

test("the footer renders one chip per entry with label, icon, color and tooltip", () => {
    const runtime = load();
    const { host } = build(runtime, {
        footer: JSON.stringify([
            { label: "P1", colorCss: "text-bg-danger", title: "Priority" },
            { label: "8", icon: "star" }
        ])
    });

    const chips = host.querySelectorAll(".card-footer-chip");
    assert.equal(chips.length, 2);

    assert.equal(chips[0].textContent, "P1");
    assert.ok(chips[0].classList.contains("text-bg-danger"));
    assert.equal(chips[0].title, "Priority");

    assert.equal(chips[1].textContent, "8");
    const icon = chips[1].childNodes.find((n) => n.tagName === "I");
    assert.ok(icon, "the chip icon exists");
    assert.equal(icon.className, "wx-icon-light wx-icon-light-star");
});

test("a user-defined chip color is applied as an inline style", () => {
    const runtime = load();
    const { host } = build(runtime, {
        footer: JSON.stringify([{ label: "5", colorStyle: "background:#ff8800;" }])
    });

    const chip = host.querySelector(".card-footer-chip");
    assert.ok(String(chip.style.cssText).includes("background:#ff8800;"));
});

test("an empty or malformed footer renders no footer element", () => {
    const runtime = load();

    assert.equal(build(runtime).host.querySelectorAll(".card-footer").length, 0);
    assert.equal(build(runtime, { footer: "[]" }).host.querySelectorAll(".card-footer").length, 0);
    assert.equal(build(runtime, { footer: "not json" }).host.querySelectorAll(".card-footer").length, 0);
});

/**
 * Builds a movable two-column board and starts a column drag on the first grip.
 * @param {object} runtime - The loaded runtime.
 * @returns {{ctrl: object, host: object, headers: object[]}} The board parts.
 */
function buildMovable(runtime) {
    const host = runtime.document.createElement("div");
    host.dataset.columns = "todo,done";
    host.dataset.columnTitles = "To Do,Done";
    host.dataset.movableColumn = "true";
    const ctrl = new runtime.wx.KanbanCtrl(host);
    const headers = host.querySelectorAll(".wx-kanban-column-header");
    headers[0].querySelector(".wx-board-col-grip").dispatchEvent({ type: "dragstart" });
    return { ctrl, host, headers };
}

test("dragging a column over a header shows the insertion indicator", () => {
    const runtime = load();
    const { headers } = buildMovable(runtime);

    // the stub rect is zero-sized, so any positive x counts as the right half
    headers[1].dispatchEvent({ type: "dragover", preventDefault() { }, clientX: 10 });
    assert.ok(headers[1].classList.contains("wx-board-col-drop-after"));
    assert.equal(headers[1].classList.contains("wx-board-col-drop-before"), false);

    headers[1].dispatchEvent({ type: "dragover", preventDefault() { }, clientX: -10 });
    assert.ok(headers[1].classList.contains("wx-board-col-drop-before"));
    assert.equal(headers[1].classList.contains("wx-board-col-drop-after"), false);

    headers[1].dispatchEvent({ type: "dragleave" });
    assert.equal(headers[1].classList.contains("wx-board-col-drop-before"), false);
    assert.equal(headers[1].classList.contains("wx-board-col-drop-after"), false);
});

test("dropping a column reorders, clears the indicator and flashes the landing header", () => {
    const runtime = load();
    const { ctrl, host, headers } = buildMovable(runtime);

    headers[1].dispatchEvent({ type: "dragover", preventDefault() { }, clientX: 10 });
    headers[1].dispatchEvent({ type: "drop", preventDefault() { }, stopPropagation() { }, clientX: 10 });

    assert.deepEqual(ctrl._columns.map((c) => c.id), ["done", "todo"]);
    assert.equal(host.querySelectorAll(".wx-board-col-drop-before, .wx-board-col-drop-after").length, 0);

    // render() rebuilt the headers; the moved column landed at index 1
    const moved = host.querySelectorAll(".wx-kanban-column-header")[1];
    assert.ok(moved.classList.contains("wx-board-col-moved"));
});

test("a cancelled column drag leaves no indicator behind", () => {
    const runtime = load();
    const { host, headers } = buildMovable(runtime);

    headers[1].dispatchEvent({ type: "dragover", preventDefault() { }, clientX: 10 });
    headers[0].querySelector(".wx-board-col-grip").dispatchEvent({ type: "dragend" });

    assert.equal(host.querySelectorAll(".wx-board-col-drop-before, .wx-board-col-drop-after").length, 0);
});

test("the board menu offers settings, add column and add swimlane", () => {
    const runtime = load();
    const { host } = buildBoard(runtime, {
        columns: "todo,done", columnTitles: "To Do,Done",
        configurableBoard: "true", addableColumn: "true", addableSwimlane: "true"
    });

    const toolbar = host.querySelector(".wx-kanban-toolbar");
    assert.ok(toolbar, "the board toolbar exists");

    assert.ok(entry(toolbar, "webexpress.webapp:board.settings"), "the settings entry exists");
    assert.ok(entry(toolbar, "webexpress.webapp:column.add"), "the add-column entry exists");
    assert.ok(entry(toolbar, "webexpress.webapp:swimlane.add"), "the add-swimlane entry exists");
});

test("a read-only board offers no board menu", () => {
    const runtime = load();
    const { host } = buildBoard(runtime, { columns: "todo,done" });

    assert.equal(host.querySelectorAll(".wx-kanban-toolbar").length, 0);
});

test("adding a column from the board menu grows the board", () => {
    const runtime = load();
    const { ctrl, host } = buildBoard(runtime, { columns: "todo", addableColumn: "true" });

    assert.equal(ctrl._columns.length, 1);
    clickEntry(entry(host.querySelector(".wx-kanban-toolbar"), "webexpress.webapp:column.add"));
    assert.equal(ctrl._columns.length, 2);
});

test("adding a swimlane from the board menu switches the board into swimlane mode", () => {
    const runtime = loadFull();
    const { ctrl, host } = buildBoard(runtime, { columns: "todo", addableSwimlane: "true" });

    assert.equal(ctrl._swimlanes.length, 0);
    clickEntry(entry(host.querySelector(".wx-kanban-toolbar"), "webexpress.webapp:swimlane.add"));
    assert.equal(ctrl._swimlanes.length, 1);
});

/**
 * Loads a runtime with the kanban control and the confirmation dialog a
 * deletion asks through; the dialog needs the browser globals of a top layer.
 * @returns {object} The loaded runtime.
 */
function loadWithConfirm() {
    return loadWebUi({ browser: true, extraFiles: [
        webuiAsset("webexpress.webui.modal.js"), webuiAsset("webexpress.webui.modal.confirm.js"),
        webuiAsset("webexpress.webui.section.js"), webuiAsset("webexpress.webui.kanban.js")
    ] });
}

test("the column menu asks before deleting and drops the column only once confirmed", async () => {
    const runtime = loadWithConfirm();
    const { ctrl, host } = buildBoard(runtime, {
        columns: "todo,done", columnTitles: "To Do,Done",
        editableColumn: "true", deletableColumn: "true"
    });
    runtime.document.body.appendChild(host);

    // the wording ships with the webapp dictionary; the test supplies the shape
    // so the name substitution is what is checked, not the sentence
    runtime.wx.I18N.register("en", "webexpress.webapp", { "kanban.column.delete.message": "Delete “{name}”?" });

    const askToDelete = () => clickEntry(entry(host.querySelectorAll(".wx-board-col-menu")[0], "webexpress.webapp:column.delete"));

    askToDelete();
    const confirm = ctrl._confirm;
    assert.equal(ctrl._columns.length, 2, "nothing is deleted before the answer");
    assert.equal(confirm._element.open, true, "the confirmation is shown");
    assert.equal(confirm._bodyDiv.querySelector("p").textContent, "Delete “To Do”?", "the question names the column");

    // dismissing keeps the column and leaves the dialog reusable
    confirm._cancelButton.click();
    assert.equal(confirm._element.open, false);
    assert.equal(ctrl._columns.length, 2);

    askToDelete();
    await confirm._confirmButton.onclick();
    assert.equal(confirm._element.open, false);
    assert.equal(ctrl._columns.length, 1);
    assert.equal(ctrl._columns[0].id, "done");

    // the dialog is owned by the control and leaves with it
    ctrl.destroy();
    assert.equal(confirm._element.isConnected, false);
});

test("the column menu starts an inline rename", () => {
    const runtime = load();
    const { host } = buildBoard(runtime, { columns: "todo", editableColumn: "true" });

    clickEntry(entry(host.querySelector(".wx-board-col-menu"), "webexpress.webapp:column.edit"));
    assert.ok(host.querySelector(".wx-board-col-input"), "the rename input appears");
});

test("the column menu applies a size preset and a color", () => {
    const runtime = load();
    const { ctrl, host } = buildBoard(runtime, { columns: "todo", editableColumn: "true" });

    const menu = host.querySelector(".wx-board-col-menu").querySelector(".dropdown-menu");

    // drill into Size, then pick a preset
    clickEntry(entry(menu, "webexpress.webapp:column.size"));
    clickEntry(entry(menu, "50 %"));
    assert.equal(ctrl._columns[0].size, "50%");

    // the menu was re-rendered by the size change; reacquire it and drill into Color
    const menu2 = host.querySelector(".wx-board-col-menu").querySelector(".dropdown-menu");
    clickEntry(entry(menu2, "webexpress.webapp:column.color"));
    clickEntry(menu2.querySelector(".wx-board-col-swatch"));
    assert.ok(ctrl._columns[0].color, "a column color is set");
});

test("the swimlane menu applies a color", () => {
    const runtime = loadFull();
    const { ctrl, host } = buildBoard(runtime, {
        columns: "todo", swimlanes: "a", editableSwimlane: "true"
    });

    const menu = host.querySelector(".wx-kanban-swimlane-menu").querySelector(".dropdown-menu");

    // drill into Color and pick a swatch
    clickEntry(entry(menu, "webexpress.webapp:swimlane.color"));
    clickEntry(menu.querySelector(".wx-board-col-swatch"));
    assert.ok(ctrl._swimlanes[0].color, "a swimlane color is set");

    // the header label is tinted with the chosen color. the label is addressed by its own
    // class rather than as "the first span in the row": the section the lane is built on puts
    // the chevron there, and the position of a decoration is not what this test is about
    const header = host.querySelector(".wx-kanban-swimlane-configurable");
    const label = header.querySelector(".wx-kanban-swimlane-header");
    assert.equal(label.style.color, ctrl._swimlanes[0].color);

    // the label must not carry the bootstrap text-primary utility: its
    // !important would beat the inline color and silently drop the accent
    assert.equal(label.classList.contains("text-primary"), false);
});

test("the swimlane color menu clears the color via None", () => {
    const runtime = loadFull();
    const { ctrl, host } = buildBoard(runtime, {
        columns: "todo", swimlanes: "a", editableSwimlane: "true"
    });

    let menu = host.querySelector(".wx-kanban-swimlane-menu").querySelector(".dropdown-menu");
    clickEntry(entry(menu, "webexpress.webapp:swimlane.color"));
    clickEntry(menu.querySelector(".wx-board-col-swatch"));
    assert.ok(ctrl._swimlanes[0].color);

    menu = host.querySelector(".wx-kanban-swimlane-menu").querySelector(".dropdown-menu");
    clickEntry(entry(menu, "webexpress.webapp:swimlane.color"));
    clickEntry(entry(menu, "webexpress.webapp:swimlane.color.none"));
    assert.equal(ctrl._swimlanes[0].color, null);
});

test("the swimlane menu asks before deleting and drops the lane only once confirmed", async () => {
    const runtime = loadWithConfirm();
    const { ctrl, host } = buildBoard(runtime, {
        columns: "todo", swimlanes: "a,b", swimlaneTitles: "Alpha,Beta",
        editableSwimlane: "true", deletableSwimlane: "true"
    });
    runtime.document.body.appendChild(host);

    // the wording ships with the webapp dictionary; the test supplies the shape
    // so the name substitution is what is checked, not the sentence
    runtime.wx.I18N.register("en", "webexpress.webapp", { "swimlane.delete.message": "Delete “{name}”?" });

    const askToDelete = () => clickEntry(entry(host.querySelectorAll(".wx-kanban-swimlane-menu")[0], "webexpress.webapp:swimlane.delete"));

    assert.equal(ctrl._swimlanes.length, 2);
    askToDelete();
    const confirm = ctrl._confirm;
    assert.equal(ctrl._swimlanes.length, 2, "nothing is deleted before the answer");
    assert.equal(confirm._element.open, true, "the confirmation is shown");
    assert.equal(confirm._bodyDiv.querySelector("p").textContent, `Delete “${ctrl._swimlanes[0].label}”?`, "the question names the lane");

    // dismissing keeps the lane and leaves the dialog reusable
    confirm._cancelButton.click();
    assert.equal(confirm._element.open, false);
    assert.equal(ctrl._swimlanes.length, 2);

    askToDelete();
    await confirm._confirmButton.onclick();
    assert.equal(confirm._element.open, false);
    assert.equal(ctrl._swimlanes.length, 1);
    assert.equal(ctrl._swimlanes[0].id, "b");
});

test("the swimlane menu starts an inline rename", () => {
    const runtime = loadFull();
    const { host } = buildBoard(runtime, { columns: "todo", swimlanes: "a", editableSwimlane: "true" });

    const menu = host.querySelector(".wx-kanban-swimlane-menu");
    assert.ok(menu, "the swimlane menu exists");
    clickEntry(entry(menu, "webexpress.webapp:swimlane.edit"));
    assert.ok(host.querySelector(".wx-board-col-input"), "the rename input appears");
});

test("a card badge renders with its color", () => {
    const runtime = load();
    const { host } = build(runtime, { badge: "#42", badgeColor: "text-bg-primary" });

    const badge = host.querySelector(".wx-kanban-card-badge");
    assert.ok(badge, "the card badge exists");
    assert.equal(badge.textContent, "#42");
    assert.ok(badge.classList.contains("badge"));
    assert.ok(badge.classList.contains("text-bg-primary"));
});

test("a swimlane badge renders in the header", () => {
    const runtime = loadFull();
    const host = runtime.document.createElement("div");
    host.dataset.columns = "todo";
    const lane = runtime.document.createElement("div");
    lane.className = "wx-swimlane";
    Object.assign(lane.dataset, { id: "a", label: "Lane A", badge: "5", badgeColor: "text-bg-info" });
    host.appendChild(lane);
    new runtime.wx.KanbanCtrl(host);

    const badge = host.querySelector(".wx-kanban-swimlane-badge");
    assert.ok(badge, "the swimlane badge exists");
    assert.equal(badge.textContent, "5");
    assert.ok(badge.classList.contains("text-bg-info"));
});

test("the swimlane move entries are bounded by the lane position", () => {
    const runtime = loadFull();
    const { host } = buildBoard(runtime, { columns: "todo", swimlanes: "a,b,c", movableSwimlane: "true" });
    const menus = host.querySelectorAll(".wx-kanban-swimlane-menu");

    const labels = (m) => m.querySelectorAll(".dropdown-item").map((b) => b.textContent);

    // first lane: only move down; middle: both; last: only move up
    assert.equal(labels(menus[0]).includes("webexpress.webapp:swimlane.moveup"), false);
    assert.ok(labels(menus[0]).includes("webexpress.webapp:swimlane.movedown"));
    assert.ok(labels(menus[1]).includes("webexpress.webapp:swimlane.moveup"));
    assert.ok(labels(menus[1]).includes("webexpress.webapp:swimlane.movedown"));
    assert.ok(labels(menus[2]).includes("webexpress.webapp:swimlane.moveup"));
    assert.equal(labels(menus[2]).includes("webexpress.webapp:swimlane.movedown"), false);
});

test("moving a swimlane down reorders the lanes", () => {
    const runtime = loadFull();
    const { ctrl, host } = buildBoard(runtime, { columns: "todo", swimlanes: "a,b,c", movableSwimlane: "true" });

    assert.deepEqual(ctrl._swimlanes.map((s) => s.id), ["a", "b", "c"]);
    const firstMenu = host.querySelectorAll(".wx-kanban-swimlane-menu")[0];
    clickEntry(entry(firstMenu, "webexpress.webapp:swimlane.movedown"));
    assert.deepEqual(ctrl._swimlanes.map((s) => s.id), ["b", "a", "c"]);
});

/**
 * Builds a board whose board, column and swimlane menus are all enabled and
 * connects it to the document, which a popover needs to enter the top layer.
 * @param {object} runtime - The loaded runtime.
 * @returns {{ctrl: object, host: object}} The control and its host.
 */
function buildMenuBoard(runtime) {
    const built = buildBoard(runtime, {
        columns: "todo,done", swimlanes: "a,b",
        addableColumn: "true", editableColumn: "true", deletableColumn: "true",
        editableSwimlane: "true", deletableSwimlane: "true"
    });
    runtime.document.body.appendChild(built.host);
    return built;
}

/**
 * Finds the entry that leads a drilled-down menu back to its root. It is the
 * one muted entry; its label cannot be matched because the stub keeps the icon
 * markup in front of it as text.
 * @param {object} menu - The dropdown menu element.
 * @returns {object|undefined} The back button, or undefined at the top level.
 */
function backEntry(menu) {
    return menu.querySelectorAll(".dropdown-item").find((b) => b.classList.contains("text-muted"));
}

test("the board, column and swimlane menus are closed native popovers under their triggers", () => {
    const runtime = loadFull();
    const { host } = buildMenuBoard(runtime);

    const containers = host.querySelectorAll(".wx-kanban-menu");
    assert.equal(containers.length, 1 + 2 + 2, "board, two columns, two swimlanes");

    for (const container of containers) {
        const button = container.querySelector(".wx-kanban-menu-btn");
        const menu = container.querySelector(".dropdown-menu");
        assert.equal(menu.getAttribute("popover"), "auto");
        assert.ok(menu.classList.contains("wx-native-menu"));
        assert.equal(menu.matches(":popover-open"), false, "the menu is closed after rendering");
        assert.equal(menu.classList.contains("show"), false, "no leftover of the class-toggled dropdown");
        assert.equal(button.getAttribute("popovertarget"), menu.id, "the browser toggles the menu on the trigger");
        assert.equal(menu.style.getPropertyValue("position-anchor"), button.style.getPropertyValue("anchor-name"));
        assert.equal(container.classList.contains("wx-menu-open"), false);
    }
});

test("an open column menu keeps its trigger visible, stays open while drilling down and closes on a pick", () => {
    const runtime = loadFull();
    const { ctrl, host } = buildMenuBoard(runtime);

    const container = host.querySelector(".wx-board-col-menu");
    const menu = container.querySelector(".dropdown-menu");

    runtime.wx.NativeMenu.show(menu);
    assert.equal(menu.matches(":popover-open"), true);
    assert.ok(container.classList.contains("wx-menu-open"), "the open state is mirrored onto the container");
    assert.equal(menu.style.position, undefined, "the top layer needs no fixed positioning to escape the board clip");

    clickEntry(entry(menu, "webexpress.webapp:column.size"));
    assert.equal(menu.matches(":popover-open"), true, "drilling down keeps the menu open");
    assert.ok(backEntry(menu), "the sub-level leads back");

    clickEntry(entry(menu, "50 %"));
    assert.equal(menu.matches(":popover-open"), false, "the pick closes the menu before acting");
    assert.equal(container.classList.contains("wx-menu-open"), false);
    assert.equal(ctrl._columns[0].size, "50%");
});

test("a reopened column or swimlane menu starts at its top level again", () => {
    const runtime = loadFull();
    const { host } = buildMenuBoard(runtime);

    for (const selector of [".wx-board-col-menu", ".wx-kanban-swimlane-menu"]) {
        const menu = host.querySelector(selector).querySelector(".dropdown-menu");
        const rootCount = menu.querySelectorAll(".dropdown-item").length;

        runtime.wx.NativeMenu.show(menu);
        clickEntry(entry(menu, selector === ".wx-board-col-menu" ? "webexpress.webapp:column.color" : "webexpress.webapp:swimlane.color"));
        assert.ok(backEntry(menu), `${selector} drilled into the colors`);

        runtime.wx.NativeMenu.hide(menu);
        runtime.wx.NativeMenu.show(menu);
        assert.equal(menu.querySelectorAll(".dropdown-item").length, rootCount, `${selector} reopens at the top level`);
        assert.equal(backEntry(menu), undefined);
    }
});

/**
 * Dispatches a click the way a browser does: on the target first, then on each
 * ancestor until a handler stops the propagation. The stub itself dispatches on
 * one element only.
 * @param {object} target - The element that was clicked.
 */
function bubbleClick(target) {
    let stopped = false;
    const event = { type: "click", target, preventDefault() { }, stopPropagation() { stopped = true; } };
    for (let node = target; node && !stopped; node = node.parentNode) {
        if (typeof node.dispatchEvent === "function") { node.dispatchEvent(event); }
    }
}

test("opening or using the swimlane menu does not fold the lane whose header carries it", () => {
    const runtime = loadFull();
    const { host } = buildMenuBoard(runtime);

    const lane = host.querySelector(".wx-kanban-swimlane");
    const container = lane.querySelector(".wx-kanban-swimlane-menu");
    const trigger = container.querySelector(".wx-kanban-menu-btn");
    const menu = container.querySelector(".dropdown-menu");

    bubbleClick(trigger);
    assert.equal(lane.classList.contains("wx-section-collapsed"), false, "the trigger is not a click on the header");

    runtime.wx.NativeMenu.show(menu);
    bubbleClick(entry(menu, "webexpress.webapp:swimlane.color"));
    assert.equal(lane.classList.contains("wx-section-collapsed"), false, "an entry is not a click on the header either");

    // the header itself still folds the lane, so the guard is scoped to the menu
    bubbleClick(lane.querySelector(".wx-kanban-swimlane-header"));
    assert.equal(lane.classList.contains("wx-section-collapsed"), true);
});

test("the board settings open as a native dialog in the top layer, not as a block at the end of the page", () => {
    const runtime = loadWebUi({ browser: true, extraFiles: [
        webuiAsset("webexpress.webui.modal.js"), webuiAsset("webexpress.webui.kanban.settings.js"), webuiAsset("webexpress.webui.kanban.js")
    ] });
    const { ctrl, host } = buildBoard(runtime, { columns: "todo", configurableBoard: "true" });
    runtime.document.body.appendChild(host);

    clickEntry(entry(host.querySelector(".wx-kanban-toolbar"), "webexpress.webapp:board.settings"));

    const dialog = ctrl._settingsDialog;
    assert.equal(dialog._element.tagName, "DIALOG", "only a dialog element is styled and layered as a modal");
    assert.equal(dialog._element.open, true, "the settings are shown modally");
    assert.equal(dialog._element.parentNode, runtime.document.body);

    dialog._cancelButton.click();
    assert.equal(dialog._element.open, false);
});
