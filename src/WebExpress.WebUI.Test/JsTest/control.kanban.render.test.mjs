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
            { label: "8", icon: "fas fa-star" }
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
    assert.equal(icon.className, "fas fa-star");
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
