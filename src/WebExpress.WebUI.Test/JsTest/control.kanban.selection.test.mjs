/**
 * Headless tests for kanban card selection. A board marks the clicked card
 * active and announces the selection, so it can drive a master-detail view the
 * same way a list or a backlog does. The tests cover the active marker, the
 * announcement, the parts of a card that must not select, the opt-out and the
 * selection surviving a re-render.
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
 * Builds a single-column board carrying two cards.
 * @param {object} runtime - The loaded runtime.
 * @param {object} [hostData] - Extra data attributes for the host node.
 * @returns {{ctrl: object, host: object, cards: Function, click: Function}} The fixture.
 */
function build(runtime, hostData) {
    const host = runtime.document.createElement("div");
    host.dataset.columns = "todo";
    Object.assign(host.dataset, hostData || {});

    for (const id of ["c1", "c2"]) {
        const card = runtime.document.createElement("div");
        card.className = "wx-kanban-card";
        Object.assign(card.dataset, { cardId: id, columnId: "todo", label: "Card " + id });
        host.appendChild(card);
    }

    const ctrl = new runtime.wx.KanbanCtrl(host);

    return {
        ctrl,
        host,
        cards: () => host.querySelectorAll(".wx-kanban-card"),
        click: (element) => host.dispatchEvent({ type: "click", target: element })
    };
}

test("a click on a card marks it active and announces the selection", () => {
    const runtime = load();
    const board = build(runtime);

    const events = [];
    board.host.addEventListener(runtime.wx.Event.SELECT_ITEM_EVENT, (e) => events.push(e.detail));

    board.click(board.cards()[0]);

    assert.equal(board.ctrl.selectedId, "c1", "the board owns the selected id");
    assert.ok(board.cards()[0].classList.contains("wx-kanban-card-active"), "the card is marked active");
    assert.equal(board.cards()[0].getAttribute("aria-selected"), "true");
    assert.equal(events.length, 1, "the selection is announced once");
    assert.equal(events[0].itemId, "c1");
});

test("the selected card is the only active one", () => {
    const runtime = load();
    const board = build(runtime);

    board.click(board.cards()[0]);
    board.click(board.cards()[1]);

    const states = Array.from(board.cards()).map((card) => card.classList.contains("wx-kanban-card-active"));

    assert.deepEqual(states, [false, true]);
    assert.equal(board.cards()[0].getAttribute("aria-selected"), null, "the former selection drops its marker");
});

test("re-selecting the same card does not announce twice", () => {
    const runtime = load();
    const board = build(runtime);

    const events = [];
    board.host.addEventListener(runtime.wx.Event.SELECT_ITEM_EVENT, (e) => events.push(e.detail));

    board.click(board.cards()[0]);
    board.click(board.cards()[0]);

    assert.equal(events.length, 1);
});

test("a click on an interactive part of a card leaves the selection alone", () => {
    const runtime = load();
    const board = build(runtime);

    const button = runtime.document.createElement("button");
    board.cards()[0].appendChild(button);

    board.click(button);

    assert.equal(board.ctrl.selectedId, null, "the button keeps its own meaning");
});

test("a click on the board background does not clear the selection", () => {
    const runtime = load();
    const board = build(runtime);

    board.click(board.cards()[0]);
    board.click(board.host);

    assert.equal(board.ctrl.selectedId, "c1", "an incidental click must not close a detail view");
});

test("a board can opt out of selection", () => {
    const runtime = load();
    const board = build(runtime, { selectable: "false" });

    board.click(board.cards()[0]);

    assert.equal(board.ctrl.selectedId, null);
    assert.equal(board.cards()[0].classList.contains("wx-kanban-card-active"), false);
});

test("the selection survives a re-render", () => {
    const runtime = load();
    const board = build(runtime);

    board.click(board.cards()[1]);
    board.ctrl.render();

    const active = Array.from(board.cards()).filter((card) => card.classList.contains("wx-kanban-card-active"));

    assert.equal(board.ctrl.selectedId, "c2", "the id is retained across the rebuild");
    assert.equal(active.length, 1, "exactly one rebuilt card carries the marker");
    assert.equal(active[0].dataset.cardId, "c2");
});

test("the selection can be set and cleared programmatically", () => {
    const runtime = load();
    const board = build(runtime);

    const events = [];
    board.host.addEventListener(runtime.wx.Event.SELECT_ITEM_EVENT, (e) => events.push(e.detail));

    board.ctrl.selectedId = "c2";
    assert.ok(board.cards()[1].classList.contains("wx-kanban-card-active"));

    board.ctrl.clearSelection();
    assert.equal(board.ctrl.selectedId, null);
    assert.equal(Array.from(board.cards()).filter((c) => c.classList.contains("wx-kanban-card-active")).length, 0);
    assert.deepEqual(events.map((e) => e.itemId), ["c2", null], "both transitions are announced");
});
