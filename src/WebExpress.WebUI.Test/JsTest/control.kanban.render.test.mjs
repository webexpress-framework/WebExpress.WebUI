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
 * i18n dictionary, so an entry shows the english fallback of its control.
 * @param {object} root - The subtree to search.
 * @param {string} label - The entry label.
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

    assert.ok(entry(toolbar, "Settings"), "the settings entry exists");
    assert.ok(entry(toolbar, "New column"), "the add-column entry exists");
    assert.ok(entry(toolbar, "New swimlane"), "the add-swimlane entry exists");
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
    clickEntry(entry(host.querySelector(".wx-kanban-toolbar"), "New column"));
    assert.equal(ctrl._columns.length, 2);
});

test("adding a swimlane from the board menu switches the board into swimlane mode", () => {
    const runtime = loadFull();
    const { ctrl, host } = buildBoard(runtime, { columns: "todo", addableSwimlane: "true" });

    assert.equal(ctrl._swimlanes.length, 0);
    clickEntry(entry(host.querySelector(".wx-kanban-toolbar"), "New swimlane"));
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
    runtime.wx.I18N.register("en", "webexpress.webui", { "kanban.column.delete.message": "Delete “{name}”?" });

    const askToDelete = () => clickEntry(entry(host.querySelectorAll(".wx-board-col-menu")[0], "Delete column"));

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

    clickEntry(entry(host.querySelector(".wx-board-col-menu"), "Rename column"));
    assert.ok(host.querySelector(".wx-board-col-input"), "the rename input appears");
});

test("the column menu applies a color and leaves the widths to the dividers", () => {
    const runtime = load();
    const { ctrl, host } = buildBoard(runtime, { columns: "todo", editableColumn: "true" });

    const menu = host.querySelector(".wx-board-col-menu").querySelector(".dropdown-menu");
    assert.equal(entry(menu, "Size"), undefined, "no size presets in the menu");

    clickEntry(entry(menu, "Color"));
    clickEntry(menu.querySelector(".wx-board-col-swatch"));
    assert.ok(ctrl._columns[0].color, "a column color is set");
});

/**
 * Builds a board of columns with the given sizes, the way the server sends them.
 * @param {object} runtime - The loaded runtime.
 * @param {string} sizes - The comma separated column sizes.
 * @param {object} capabilities - The data-* capability flags of the host.
 * @returns {{ctrl: object, host: object}} The control and its host.
 */
function sized(runtime, sizes, capabilities = {}) {
    const host = runtime.document.createElement("div");
    sizes.split(",").forEach((size, i) => {
        const col = runtime.document.createElement("div");
        col.className = "wx-column";
        col.id = "c" + i;
        Object.assign(col.dataset, { label: "C" + i, size: size });
        host.appendChild(col);
    });
    Object.assign(host.dataset, capabilities);
    runtime.document.body.appendChild(host);
    return { ctrl: new runtime.wx.KanbanCtrl(host), host };
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
 * Gives the columns of every row a width, since the dom stub measures nothing.
 * @param {object} host - The board host.
 * @param {number} width - The width of every column in pixels.
 */
function measure(host, width) {
    for (const item of host.querySelectorAll(".wx-kanban-col, .wx-kanban-column-header")) {
        item.getBoundingClientRect = () => ({ width: width, height: 0, left: 0, top: 0, right: width, bottom: 0 });
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

test("column sizes become weights, and percentages that claim more than the row are scaled down", () => {
    const runtime = load();

    const over = sized(runtime, "75%,75%,75%");
    assert.equal(shares(over.ctrl._columnWeights()), "1 1 1", "three equal claims become three equal shares");
    assert.equal(over.host.style.getPropertyValue("--wx-board-template"),
        "minmax(280px, 1fr) minmax(280px, 1fr) minmax(280px, 1fr)", "every track keeps the floor below which the board scrolls");

    assert.equal(shares(sized(runtime, "25%,*").ctrl._columnWeights()), "0.5 1.5", "a board that fitted keeps its proportions");
});

test("a divider sits between every two columns of an editable board, none after the last", () => {
    const runtime = load();
    assert.equal(sized(runtime, "1fr,1fr,1fr").host.querySelectorAll(".wx-kanban-col-resizer").length, 0, "a read-only board has no dividers");

    const { host } = sized(runtime, "1fr,3fr,1fr", { editableColumn: "true" });
    const dividers = host.querySelectorAll(".wx-kanban-col-resizer");
    assert.equal(dividers.length, 2);
    assert.equal(dividers[0].getAttribute("role"), "separator");
    assert.equal(dividers[0].getAttribute("aria-orientation"), "vertical");
    assert.equal(dividers[0].getAttribute("aria-valuenow"), "25", "the left column takes a quarter of the pair");
    assert.equal(dividers[0].getAttribute("aria-label"), "Width of “C0” and “C1”");
    assert.equal(dividers[0].tabIndex, 0, "the keyboard reaches the divider");
});

test("a board with swimlanes announces one divider per pair and repeats it silently in every lane", () => {
    const runtime = loadFull();
    const { host } = buildBoard(runtime, { columns: "a,b", swimlanes: "x,y", editableColumn: "true" });

    const dividers = host.querySelectorAll(".wx-kanban-col-resizer");
    assert.equal(dividers.length, 3, "the header band and both lanes");

    const announced = dividers.filter((d) => d.getAttribute("role") === "separator");
    assert.equal(announced.length, 1);
    assert.ok(announced[0].parentElement.classList.contains("wx-kanban-column-header"), "the header band carries it");
    for (const silent of dividers.filter((d) => d !== announced[0])) {
        assert.equal(silent.getAttribute("aria-hidden"), "true");
        assert.notEqual(silent.tabIndex, 0, "the keyboard meets the pair once");
    }
});

test("dragging a divider moves width between its two columns only and stores the board as weights", () => {
    const runtime = load();
    const { ctrl, host } = sized(runtime, "1fr,1fr,1fr", { editableColumn: "true" });
    const changes = [];
    host.addEventListener(runtime.wx.Event.CHANGE_VALUE_EVENT, (e) => changes.push(e.detail));
    measure(host, 600);
    const divider = host.querySelectorAll(".wx-kanban-col-resizer")[0];

    pointer(divider, "pointerdown", 100);
    pointer(divider, "pointermove", 220);
    assert.equal(host.style.getPropertyValue("--wx-board-template"),
        "minmax(280px, 1.2fr) minmax(280px, 0.8fr) minmax(280px, 1fr)", "the board follows the pointer while dragging");
    assert.equal(changes.length, 0, "nothing is stored before the pointer is let go");

    pointer(divider, "pointerup", 220);
    assert.equal(ctrl._columns.map((c) => c.size).join(","), "1.2fr,0.8fr,1fr", "the third column keeps its width");
    assert.equal(changes.length, 1);
    assert.equal(changes[0].action, "columns");
    assert.equal(divider.getAttribute("aria-valuenow"), "60");
});

test("a column cannot be dragged narrower than the floor of its track", () => {
    const runtime = load();
    const { ctrl, host } = sized(runtime, "1fr,1fr", { editableColumn: "true" });
    measure(host, 400);
    const divider = host.querySelector(".wx-kanban-col-resizer");

    pointer(divider, "pointerdown", 400);
    pointer(divider, "pointermove", -2000);
    pointer(divider, "pointerup", -2000);

    // 280 of the pair's 800 pixels
    assert.equal(shares(ctrl._columnWeights()), "0.7 1.3", "the left column stops at the minimum");
});

test("a cancelled drag leaves the board as it was", () => {
    const runtime = load();
    const { ctrl, host } = sized(runtime, "1fr,1fr", { editableColumn: "true" });
    let changes = 0;
    host.addEventListener(runtime.wx.Event.CHANGE_VALUE_EVENT, () => changes++);
    measure(host, 600);
    const divider = host.querySelector(".wx-kanban-col-resizer");

    pointer(divider, "pointerdown", 100);
    pointer(divider, "pointermove", 250);
    pointer(divider, "pointercancel", 250);

    assert.equal(ctrl._columns.map((c) => c.size).join(","), "1fr,1fr");
    assert.equal(host.style.getPropertyValue("--wx-board-template"), "minmax(280px, 1fr) minmax(280px, 1fr)");
    assert.equal(changes, 0);
});

test("the arrow keys move a divider in steps and a double click splits the pair evenly", () => {
    const runtime = load();
    const { ctrl, host } = sized(runtime, "1fr,1fr,2fr", { editableColumn: "true" });
    const dividers = host.querySelectorAll(".wx-kanban-col-resizer");

    // an average column weighs 1, so the board reads 0.75 0.75 1.5 and the pair 1.5
    dividers[0].dispatchEvent({ type: "keydown", key: "ArrowRight", preventDefault() { } });
    near(ctrl._columnWeights(), [0.825, 0.675, 1.5], "a step is a twentieth of the pair");

    dividers[1].dispatchEvent({ type: "dblclick" });
    near(ctrl._columnWeights(), [0.825, 1.0875, 1.0875], "the second divider works on the width the first one left");
});

test("a new column takes an average width and the others keep their proportions", () => {
    const runtime = load();
    const { ctrl } = sized(runtime, "25%,*", { addableColumn: "true" });

    ctrl._addColumn();

    assert.equal(ctrl._columns.map((c) => c.size).join(","), "0.5fr,1.5fr,1fr",
        "a percentage would have left the new column a sliver of the row");
});

test("the swimlane menu applies a color", () => {
    const runtime = loadFull();
    const { ctrl, host } = buildBoard(runtime, {
        columns: "todo", swimlanes: "a", editableSwimlane: "true"
    });

    const menu = host.querySelector(".wx-kanban-swimlane-menu").querySelector(".dropdown-menu");

    // drill into Color and pick a swatch
    clickEntry(entry(menu, "Color"));
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
    clickEntry(entry(menu, "Color"));
    clickEntry(menu.querySelector(".wx-board-col-swatch"));
    assert.ok(ctrl._swimlanes[0].color);

    menu = host.querySelector(".wx-kanban-swimlane-menu").querySelector(".dropdown-menu");
    clickEntry(entry(menu, "Color"));
    clickEntry(entry(menu, "None"));
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
    runtime.wx.I18N.register("en", "webexpress.webui", { "kanban.swimlane.delete.message": "Delete “{name}”?" });

    const askToDelete = () => clickEntry(entry(host.querySelectorAll(".wx-kanban-swimlane-menu")[0], "Delete swimlane"));

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
    clickEntry(entry(menu, "Rename swimlane"));
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
    assert.equal(labels(menus[0]).includes("Move up"), false);
    assert.ok(labels(menus[0]).includes("Move down"));
    assert.ok(labels(menus[1]).includes("Move up"));
    assert.ok(labels(menus[1]).includes("Move down"));
    assert.ok(labels(menus[2]).includes("Move up"));
    assert.equal(labels(menus[2]).includes("Move down"), false);
});

test("moving a swimlane down reorders the lanes", () => {
    const runtime = loadFull();
    const { ctrl, host } = buildBoard(runtime, { columns: "todo", swimlanes: "a,b,c", movableSwimlane: "true" });

    assert.deepEqual(ctrl._swimlanes.map((s) => s.id), ["a", "b", "c"]);
    const firstMenu = host.querySelectorAll(".wx-kanban-swimlane-menu")[0];
    clickEntry(entry(firstMenu, "Move down"));
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

    clickEntry(entry(menu, "Color"));
    assert.equal(menu.matches(":popover-open"), true, "drilling down keeps the menu open");
    assert.ok(backEntry(menu), "the sub-level leads back");

    clickEntry(entry(menu, "None"));
    assert.equal(menu.matches(":popover-open"), false, "the pick closes the menu before acting");
    assert.equal(container.classList.contains("wx-menu-open"), false);
    assert.equal(ctrl._columns[0].color, null);
});

test("a reopened column or swimlane menu starts at its top level again", () => {
    const runtime = loadFull();
    const { host } = buildMenuBoard(runtime);

    for (const selector of [".wx-board-col-menu", ".wx-kanban-swimlane-menu"]) {
        const menu = host.querySelector(selector).querySelector(".dropdown-menu");
        const rootCount = menu.querySelectorAll(".dropdown-item").length;

        runtime.wx.NativeMenu.show(menu);
        clickEntry(entry(menu, selector === ".wx-board-col-menu" ? "Color" : "Color"));
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
    bubbleClick(entry(menu, "Color"));
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

    clickEntry(entry(host.querySelector(".wx-kanban-toolbar"), "Settings"));

    const dialog = ctrl._settingsDialog;
    assert.equal(dialog._element.tagName, "DIALOG", "only a dialog element is styled and layered as a modal");
    assert.equal(dialog._element.open, true, "the settings are shown modally");
    assert.equal(dialog._element.parentNode, runtime.document.body);

    dialog._cancelButton.click();
    assert.equal(dialog._element.open, false);
});

test("a card that names itself by its element id keeps that id", () => {
    const runtime = load();
    const host = runtime.document.createElement("div");
    host.dataset.columns = "todo";
    const card = runtime.document.createElement("div");
    card.className = "wx-kanban-card";
    card.id = "task1";
    Object.assign(card.dataset, { columnId: "todo", label: "Card" });
    host.appendChild(card);
    const ctrl = new runtime.wx.KanbanCtrl(host);

    assert.equal(ctrl._cards[0].id, "task1", "moves and selections report the card's own id");
    assert.equal(host.querySelector(".wx-kanban-card").dataset.cardId, "task1");
});

test("a card shows its color and its icon, and an image takes the icon's place", () => {
    const runtime = load();

    let cardEl = build(runtime, { color: "orange", icon: "fas fa-bug" }).host.querySelector(".wx-kanban-card");
    assert.equal(cardEl.style.getPropertyValue("--kanban-color"), "orange", "any css color reaches the top border");
    assert.ok(cardEl.querySelector(".card-header .card-icon i"), "the icon sits in the header");

    cardEl = build(runtime, { icon: "fas fa-bug", image: "/img/card.png" }).host.querySelector(".wx-kanban-card");
    assert.equal(cardEl.querySelector(".card-image").src, "/img/card.png");
    assert.equal(cardEl.querySelector(".card-icon"), null);

    cardEl = build(runtime, { colorCss: "border-danger" }).host.querySelector(".wx-kanban-card");
    assert.equal(cardEl.style.getPropertyValue("--kanban-color"), "#dc3545", "a system color class still maps to its accent");
});

test("a card carries its actions onto every rebuilt element", () => {
    const runtime = load();
    const { ctrl, host } = build(runtime, { wxPrimaryAction: "modal", wxPrimaryTarget: "#detail" });

    ctrl.render();
    const cardEl = host.querySelector(".wx-kanban-card");
    assert.equal(cardEl.getAttribute("data-wx-primary-action"), "modal");
    assert.equal(cardEl.getAttribute("data-wx-primary-target"), "#detail");
    assert.equal(cardEl.getAttribute("data-wx-secondary-action"), null);
});

test("a confirmed deletion drops the column it named, even after a reload reordered the board", async () => {
    const runtime = loadWithConfirm();
    const { ctrl, host } = buildBoard(runtime, {
        columns: "todo,doing,done", deletableColumn: "true"
    });
    runtime.document.body.appendChild(host);

    clickEntry(entry(host.querySelectorAll(".wx-board-col-menu")[0], "Delete column"));

    // a reload while the dialog is open hands over fresh column objects in a new order
    ctrl._columns = ["done", "todo", "doing"].map((id) => ({ id, label: id, size: "1fr" }));
    ctrl.render();

    await ctrl._confirm._confirmButton.onclick();
    assert.deepEqual(ctrl._columns.map((c) => c.id), ["done", "doing"]);

    // a column the reload already dropped is not replaced by whatever took its place
    clickEntry(entry(host.querySelectorAll(".wx-board-col-menu")[0], "Delete column"));
    ctrl._columns = [{ id: "doing", label: "doing", size: "1fr" }];
    ctrl.render();
    await ctrl._confirm._confirmButton.onclick();
    assert.deepEqual(ctrl._columns.map((c) => c.id), ["doing"]);
});

test("a rebuild during a rename releases it without committing the abandoned input", () => {
    const runtime = load();
    const { ctrl, host } = buildBoard(runtime, { columns: "todo", editableColumn: "true" });
    let changes = 0;
    host.addEventListener(runtime.wx.Event.CHANGE_VALUE_EVENT, () => changes++);

    clickEntry(entry(host.querySelector(".wx-board-col-menu"), "Rename column"));
    const input = host.querySelector(".wx-board-col-input");
    input.value = "Renamed";

    // a reload replaces the header; firefox reports no blur for the removed input,
    // chromium reports one into the rebuilt board
    ctrl.render();
    input.dispatchEvent({ type: "blur" });

    assert.equal(ctrl._columns[0].label, "todo");
    assert.equal(changes, 0, "nothing is persisted from the abandoned input");

    clickEntry(entry(host.querySelector(".wx-board-col-menu"), "Rename column"));
    assert.ok(host.querySelector(".wx-board-col-input"), "a new rename can start");
});

test("on a board without swimlanes alt+up passes the card above it, whatever lane the cards still name", () => {
    const runtime = load();
    const host = runtime.document.createElement("div");
    host.dataset.columns = "todo";
    for (const [id, lane] of [["c1", "gone"], ["c2", ""]]) {
        const card = runtime.document.createElement("div");
        card.className = "wx-kanban-card";
        Object.assign(card.dataset, { cardId: id, columnId: "todo", swimlaneId: lane, label: id });
        host.appendChild(card);
    }
    const ctrl = new runtime.wx.KanbanCtrl(host);

    const second = host.querySelectorAll(".wx-kanban-card")[1];
    second.dispatchEvent({ type: "keydown", key: "ArrowUp", altKey: true, target: second, preventDefault() { } });

    assert.deepEqual(ctrl._cards.map((c) => c.id), ["c2", "c1"]);
});

test("the first swimlane takes in every card, including those naming a lane that is gone", () => {
    const runtime = loadFull();
    const { ctrl, host } = build(runtime, { swimlaneId: "gone" });
    ctrl._addableSwimlane = true;
    ctrl.render();

    clickEntry(entry(host.querySelector(".wx-kanban-toolbar"), "New swimlane"));

    assert.equal(ctrl._cards[0].swimlaneId, ctrl._swimlanes[0].id);
    assert.equal(host.querySelectorAll(".wx-kanban-card").length, 1, "the card stays on the board");
});
