/**
 * Regression tests for the column model of the reorderable table
 * (wx-webui-table-reorderable): after the columns were reordered - in the column dialog,
 * by drag and drop or by restoring a stored order - a click on a header sorts by that
 * column, and every footer cell stands under its header. The column dialog sorts the
 * rows as the header does and announces the direction the same way.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

// every column orders the rows differently, so a sort by the wrong column shows
const CREW = [
    ["stan", "Stan", "41", "Alpha"],
    ["guybrush", "Guybrush", "21", "Zephyr"],
    ["elaine", "Elaine", "35", "Mermaid"]
];
const FOOTER = { col_0: "names", col_1: "ages", col_2: "ships" };
const BY_NAME = ["elaine", "guybrush", "stan"];
const BY_AGE = ["guybrush", "elaine", "stan"];
const BY_SHIP = ["stan", "elaine", "guybrush"];

/**
 * Builds a reorderable table with three columns, three rows and a footer from markup,
 * the way the server renders it.
 * @param {object} [options={}] - host: the dataset of the host; stored: a persisted state.
 * @returns {object} The runtime, the host and the control.
 */
function table(options = {}) {
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.table.js", "webexpress.webui.table.reorderable.js"]
    });
    if (options.stored) {
        rt.wx.LocalStorage.setJson("crew", options.stored);
    }

    const element = rt.document.createElement("div");
    Object.assign(element.dataset, { persistKey: "crew" }, options.host || {});

    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    for (const label of ["Name", "Age", "Ship"]) {
        const column = rt.document.createElement("div");
        column.dataset.label = label;
        columns.appendChild(column);
    }
    element.appendChild(columns);

    for (const [id, ...values] of CREW) {
        const row = rt.document.createElement("div");
        row.id = id;
        row.classList.add("wx-table-row");
        for (const value of values) {
            const cell = rt.document.createElement("div");
            cell.textContent = value;
            row.appendChild(cell);
        }
        element.appendChild(row);
    }

    const footer = rt.document.createElement("div");
    footer.classList.add("wx-table-footer");
    for (const text of Object.values(FOOTER)) {
        const cell = rt.document.createElement("div");
        cell.textContent = text;
        footer.appendChild(cell);
    }
    element.appendChild(footer);

    rt.document.body.appendChild(element);
    const ctrl = new rt.wx.TableReorderableCtrl(element);
    ctrl._store.flush();
    return { rt, element, ctrl };
}

const rowIds = (ctrl) => ctrl._body.children.filter((el) => el._dataRowRef).map((el) => el._dataRowRef.id);

/**
 * Clicks the header of a column, as the reader does.
 * @param {object} ctrl - The table control.
 * @param {string} columnId - The id of the column.
 */
function clickHeader(ctrl, columnId) {
    const header = ctrl._head.querySelectorAll(".wx-col-header").find((el) => el.dataset.columnId === columnId);
    assert.ok(header, `the header of ${columnId} is rendered`);
    ctrl._onHeadClick({ target: header });
    ctrl._store.flush();
}

/**
 * Asserts that the footer row lines up with the header row: as many cells, and under
 * each column header the footer of that column.
 * @param {object} ctrl - The table control.
 */
function assertFooterUnderHeaders(ctrl) {
    const headerRow = ctrl._head.firstChild;
    const footerRow = ctrl._foot.firstChild;
    assert.equal(footerRow.children.length, headerRow.children.length, "the footer has a cell under every header cell");
    headerRow.children.forEach((header, i) => {
        const columnId = header.dataset.columnId;
        if (columnId) {
            assert.equal(footerRow.children[i].textContent, FOOTER[columnId], `the footer of ${columnId} stands under its header`);
        }
    });
}

test("after a reorder in the column dialog a header click sorts by the clicked column", () => {
    const { ctrl } = table();
    const modal = {};
    ctrl._bindModalActions(modal);

    modal.applyOrder(["col_2", "col_0", "col_1"]);
    ctrl._store.flush();
    clickHeader(ctrl, "col_2");

    assert.deepEqual(rowIds(ctrl), BY_SHIP);
    clickHeader(ctrl, "col_1");
    assert.deepEqual(rowIds(ctrl), BY_AGE);
});

test("after a drag and drop of a column a header click sorts by the clicked column", () => {
    const { ctrl } = table();

    ctrl._dropColumn("col_0", "col_2", false);
    ctrl._store.flush();
    clickHeader(ctrl, "col_1");

    assert.deepEqual(ctrl._columns.map((c) => c.id), ["col_1", "col_2", "col_0"]);
    assert.deepEqual(rowIds(ctrl), BY_AGE);
    clickHeader(ctrl, "col_0");
    assert.deepEqual(rowIds(ctrl), BY_NAME);
});

test("after a stored order was restored a header click sorts by the clicked column", () => {
    const { ctrl } = table({ stored: { v: 1, order: ["col_1", "col_2", "col_0"], cols: [], sort: null, tree: { collapsed: [] } } });

    assert.deepEqual(ctrl._columns.map((c) => c.id), ["col_1", "col_2", "col_0"]);
    clickHeader(ctrl, "col_2");

    assert.deepEqual(rowIds(ctrl), BY_SHIP);
});

test("every footer cell stands under its header after a reorder in the column dialog", () => {
    const { ctrl } = table({ host: { movableRow: "true" } });
    const modal = {};
    ctrl._bindModalActions(modal);

    modal.applyOrder(["col_2", "col_0", "col_1"]);
    ctrl._store.flush();

    assertFooterUnderHeaders(ctrl);
});

test("every footer cell stands under its header after a drag and drop of a column", () => {
    const { ctrl } = table({ host: { movableRow: "true" } });

    ctrl._dropColumn("col_2", "col_0", true);
    ctrl._store.flush();

    assert.deepEqual(ctrl._columns.map((c) => c.id), ["col_2", "col_0", "col_1"]);
    assertFooterUnderHeaders(ctrl);
});

test("every footer cell stands under its header after a stored order was restored", () => {
    const { ctrl } = table({
        host: { movableRow: "true" },
        stored: { v: 1, order: ["col_1", "col_2", "col_0"], cols: [], sort: null, tree: { collapsed: [] } }
    });

    assertFooterUnderHeaders(ctrl);
});

test("the column dialog sorts the rows locally and announces the direction like the header", () => {
    const { rt, element, ctrl } = table();
    const modal = {};
    ctrl._bindModalActions(modal);
    const sorts = [];
    element.addEventListener(rt.wx.Event.TABLE_SORT_EVENT, (event) => sorts.push([event.detail.columnId, event.detail.sortDirection]));

    modal.applySort("col_1", "asc");
    ctrl._store.flush();
    assert.deepEqual(rowIds(ctrl), BY_AGE);
    assert.equal(ctrl._columns.find((c) => c.id === "col_1").sort, "asc");

    modal.applySort("col_2", "desc");
    ctrl._store.flush();
    assert.deepEqual(rowIds(ctrl), BY_SHIP.slice().reverse());

    clickHeader(ctrl, "col_0");
    assert.deepEqual(sorts, [["col_1", "asc"], ["col_2", "desc"], ["col_0", "asc"]]);
});
