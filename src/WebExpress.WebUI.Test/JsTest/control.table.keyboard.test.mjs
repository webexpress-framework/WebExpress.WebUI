/**
 * Regression tests for the keyboard of a selectable table: a key that a control inside
 * the table already answered - the grip of a movable row, a button in a row, a header
 * that sorts - does not reach the shortcuts of the table as well. The DOM stub does not
 * bubble, so the events are walked up the ancestors here, the way the browser does.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Builds a selectable reorderable table with movable rows.
 * @returns {object} The runtime and the control.
 */
function table() {
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.table.js", "webexpress.webui.table.reorderable.js"]
    });
    const element = rt.document.createElement("div");
    Object.assign(element.dataset, { selectable: "true", movableRow: "true", treeMoveEnabled: "false" });
    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    const column = rt.document.createElement("div");
    column.dataset.label = "Name";
    columns.appendChild(column);
    element.appendChild(columns);
    rt.document.body.appendChild(element);

    const ctrl = new rt.wx.TableReorderableCtrl(element);
    ctrl.setRows(["stan", "guybrush", "elaine"].map((id) => ({ id, cells: [{ content: id, text: id }], children: [] })));
    ctrl._store.flush();
    return { rt, ctrl };
}

/**
 * Dispatches an event on a target and on each of its ancestors, until a handler stops
 * the propagation.
 * @param {object} target - The element the event is dispatched on.
 * @param {object} init - The event fields.
 * @returns {object} The event.
 */
function fire(target, init) {
    let stopped = false;
    const event = Object.assign({ target, defaultPrevented: false }, init);
    event.preventDefault = () => { event.defaultPrevented = true; };
    event.stopPropagation = () => { stopped = true; };
    for (let node = target; node && !stopped; node = node.parentNode) {
        const handlers = node._listeners && node._listeners[event.type];
        if (handlers) {
            event.currentTarget = node;
            Array.from(handlers).forEach((fn) => fn(event));
        }
    }
    return event;
}

test("an arrow key on the grip moves the row and leaves the selection alone", () => {
    const { ctrl } = table();
    const stan = ctrl._rows[0];
    assert.equal(ctrl.getSelectedRow(), stan, "the first row is selected on open");
    const grip = stan._anchorTr.querySelector(".wx-table-drag-handle [role=\"button\"]");

    fire(grip, { type: "keydown", key: "ArrowDown" });
    ctrl._store.flush();

    assert.deepEqual(ctrl._rows.map((r) => r.id), ["guybrush", "stan", "elaine"]);
    assert.equal(ctrl.getSelectedRow(), stan, "the selection stays on the moved row");
});

test("enter on a button in a row does not trigger the primary action of the selected row", () => {
    const { rt, ctrl } = table();
    const triggered = [];
    ctrl._triggerPrimaryAction = (row) => triggered.push(row.id);
    const stan = ctrl._rows[0];
    const button = rt.document.createElement("button");
    stan._anchorTr.children[1].appendChild(button);

    fire(button, { type: "keydown", key: "Enter" });
    assert.deepEqual(triggered, [], "the button answers its own key");

    fire(stan._anchorTr, { type: "keydown", key: "Enter" });
    assert.deepEqual(triggered, ["stan"], "on the row itself enter still triggers it");
});

test("a key a header answered by sorting does not trigger the primary action as well", () => {
    const { ctrl } = table();
    const triggered = [];
    ctrl._triggerPrimaryAction = (row) => triggered.push(row.id);
    const header = ctrl._head.querySelector(".wx-col-header");

    fire(header, { type: "keydown", key: "Enter" });
    ctrl._store.flush();

    assert.equal(ctrl._columns[0].sort, "asc", "the header sorted");
    assert.deepEqual(triggered, []);
});
