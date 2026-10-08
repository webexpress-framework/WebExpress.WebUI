/**
 * Headless contract test for the TableReorderableCtrl control (wx-webui-table-reorderable).
 * The shared contract (controls.contract.mjs) verifies that the control
 * registers correctly and survives a construct / teardown lifecycle.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

contract({
    file: "webexpress.webui.table.reorderable.js",
    selector: "wx-webui-table-reorderable",
    ctrl: "TableReorderableCtrl",
    deps: ["webexpress.webui.table.js"]
});

/**
 * Builds a reorderable table with two columns and one row without options.
 * @param {object} config - The data attributes of the host.
 * @returns {object} The runtime and the control.
 */
function table(config = {}) {
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.table.js", "webexpress.webui.table.reorderable.js"]
    });
    const element = rt.document.createElement("div");
    Object.assign(element.dataset, config.host || {});

    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    Object.assign(columns.dataset, config.columns || {});
    for (const label of ["Name", "Age"]) {
        const column = rt.document.createElement("div");
        column.dataset.label = label;
        columns.appendChild(column);
    }
    element.appendChild(columns);

    const row = rt.document.createElement("div");
    row.classList.add("wx-table-row");
    for (const text of ["Guybrush", "21"]) {
        const cell = rt.document.createElement("div");
        cell.textContent = text;
        row.appendChild(cell);
    }
    element.appendChild(row);

    rt.document.body.appendChild(element);
    return { rt, ctrl: new rt.wx.TableReorderableCtrl(element) };
}

test("the header carries the column manager although no row has options", () => {
    const { ctrl } = table();

    const actions = ctrl._head.querySelector(".wx-table-actions");
    assert.ok(actions, "the header has an actions cell");
    assert.ok(actions.querySelector("button"), "the actions cell holds the column manager");
    assert.ok(ctrl._body.querySelector(".wx-table-actions"), "the rows keep their cells aligned under it");
    assert.match(ctrl._table.style.getPropertyValue("--wx-grid-template"), /1\.5rem$/, "the grid reserves the actions track");
});

test("a table without a header has no column manager and no actions track", () => {
    const { ctrl } = table({ columns: { suppressHeaders: "true" } });

    assert.equal(ctrl._head.querySelector(".wx-table-actions"), null);
    assert.equal(ctrl._body.querySelector(".wx-table-actions"), null);
    assert.doesNotMatch(ctrl._table.style.getPropertyValue("--wx-grid-template"), /1\.5rem$/);
});

test("hiding a column in the manager is offered only where columns may be removed", () => {
    const fixed = {};
    table().ctrl._bindModalActions(fixed);
    assert.notEqual(typeof fixed.applyVisibility, "function", "a fixed set of columns can only be reordered");
    assert.equal(typeof fixed.applyOrder, "function");

    const removable = {};
    table({ host: { allowColumnRemove: "true" } }).ctrl._bindModalActions(removable);
    assert.equal(typeof removable.applyVisibility, "function");
});
