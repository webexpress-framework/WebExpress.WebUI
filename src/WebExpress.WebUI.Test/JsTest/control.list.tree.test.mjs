/**
 * Headless render tests for the tree of the list control.
 *
 * An item that owns children is drawn as a tree node: the row carries an
 * expander, the children are indented beneath it, and collapsing removes them
 * from the list. A list without any nesting must stay exactly as it was - no
 * expander column, no indent - because every list in the framework shares this
 * control.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi, webuiAsset } from "./harness.mjs";

/**
 * Builds a list control and hands it the supplied items.
 * @param {Array<object>} items - The items, possibly carrying children.
 * @param {object} [hostData] - Extra data attributes for the list root.
 * @returns {{ctrl: object, host: object, runtime: object}} The control, its host and the runtime.
 */
function build(items, hostData = {}) {
    const runtime = loadWebUi({ browser: true, extraFiles: [webuiAsset("webexpress.webui.list.js")] });
    const host = runtime.document.createElement("div");
    Object.assign(host.dataset, hostData);
    runtime.document.body.appendChild(host);

    const ctrl = new runtime.wx.ListCtrl(host);
    ctrl.setItems(items);

    return { ctrl, host, runtime };
}

/**
 * Returns the visible row texts of a list host, in display order.
 * @param {object} host - The list host element.
 * @returns {Array<string>} The texts.
 */
function rows(host) {
    return Array.from(host.querySelectorAll("li")).map(li => li.textContent.trim());
}

test("an item that owns children is drawn with an expander and its children beneath it", () => {
    const { host } = build([
        { id: "epic", content: "Epic", children: [{ id: "a", content: "Story A" }, { id: "b", content: "Story B" }] },
        { id: "plain", content: "Standalone" }
    ]);

    assert.deepEqual(rows(host), ["Epic", "Story A", "Story B", "Standalone"], "the children follow their parent");

    const toggles = host.querySelectorAll(".wx-list-tree-toggle");
    assert.equal(toggles.length, 1, "only the node that owns children carries an expander");
    assert.equal(toggles[0].getAttribute("aria-expanded"), "true", "and it starts open");
});

test("collapsing a node removes its children from the list", () => {
    const { host } = build([
        { id: "epic", content: "Epic", children: [{ id: "a", content: "Story A" }] }
    ]);

    host.querySelector(".wx-list-tree-toggle").click();

    assert.deepEqual(rows(host), ["Epic"], "the child is gone while the node is closed");
    assert.equal(host.querySelector(".wx-list-tree-toggle").getAttribute("aria-expanded"), "false");

    host.querySelector(".wx-list-tree-toggle").click();

    assert.deepEqual(rows(host), ["Epic", "Story A"], "and back when it is opened again");
});

test("a node that arrives collapsed stays collapsed", () => {
    const { host } = build([
        { id: "epic", content: "Epic", expanded: false, children: [{ id: "a", content: "Story A" }] }
    ]);

    assert.deepEqual(rows(host), ["Epic"], "the server decided the initial state");
});

test("a child is indented and a leaf reserves the same width", () => {
    const { host } = build([
        { id: "epic", content: "Epic", children: [{ id: "a", content: "Story A" }] }
    ]);

    const guides = host.querySelectorAll(".wx-tree-guide");
    assert.equal(guides.length, 1, "only the child gets a guide column");

    // without the placeholder the text of a leaf would sit where the expander of
    // its siblings is, and the column would look ragged
    assert.equal(host.querySelectorAll(".wx-list-tree-toggle-placeholder").length, 1, "the child reserves the expander column");
});

test("every level gets its own guide column", () => {
    const { host } = build([
        {
            id: "epic", content: "Epic", children: [
                { id: "story", content: "Story", children: [{ id: "task", content: "Task" }] }
            ]
        }
    ]);

    const perRow = Array.from(host.querySelectorAll("li")).map(li => li.querySelectorAll(".wx-tree-guide").length);

    // indentation alone stops saying which parent a row belongs to once there is
    // more than one level, which is why every level draws its own column
    assert.deepEqual(perRow, [0, 1, 2], "the columns grow with the depth");
});

test("a branch draws a through line only while it continues", () => {
    const { host } = build([
        {
            id: "epic", content: "Epic", children: [
                { id: "first", content: "First", children: [{ id: "under-first", content: "Under first" }] },
                { id: "last", content: "Last", children: [{ id: "under-last", content: "Under last" }] }
            ]
        }
    ]);

    const rowOf = (text) => Array.from(host.querySelectorAll("li")).find(li => li.textContent.trim() === text);
    const columns = (text) => Array.from(rowOf(text).querySelectorAll(".wx-tree-guide"))
        .map(g => (g.classList.contains("wx-tree-guide-elbow") ? "elbow" : "") + (g.classList.contains("wx-tree-guide-through") ? "+through" : ""));

    // "First" has a sibling below it, so its own column is a tee and the line of
    // its level carries on past the row nested under it
    assert.deepEqual(columns("First"), ["elbow+through"]);
    assert.deepEqual(columns("Under first"), ["+through", "elbow"]);

    // "Last" ends its branch, so its elbow is a corner rather than a tee, and the
    // column of that level stays blank beneath it - a through line there would
    // point at a row that does not exist
    assert.deepEqual(columns("Last"), ["elbow"]);
    assert.deepEqual(columns("Under last"), ["", "elbow"], "the ended branch leaves its column blank");
});

test("a flat list is rendered exactly as before, without a tree column", () => {
    const { host } = build([
        { id: "a", content: "One" },
        { id: "b", content: "Two" }
    ]);

    assert.deepEqual(rows(host), ["One", "Two"]);
    assert.equal(host.querySelectorAll(".wx-list-tree").length, 0, "no list pays for a tree it does not have");
});

test("a nested item is selectable by id", () => {
    const { ctrl, host } = build([
        { id: "epic", content: "Epic", children: [{ id: "a", content: "Story A" }] }
    ], { selectable: "true" });

    ctrl.selectItem("a", false);

    assert.equal(ctrl._selectedItem?.id, "a", "the lookup descends into the tree");
    assert.ok(host, "the host is rendered");
});

test("a nested item is deleted from its parent rather than ignored", () => {
    const { ctrl, host } = build([
        { id: "epic", content: "Epic", children: [{ id: "a", content: "Story A" }, { id: "b", content: "Story B" }] }
    ]);

    assert.equal(ctrl.deleteItem("a"), true, "the delete reaches the nested item");
    assert.deepEqual(rows(host), ["Epic", "Story B"]);
});
