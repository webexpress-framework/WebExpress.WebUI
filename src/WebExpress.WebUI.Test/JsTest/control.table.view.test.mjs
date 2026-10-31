/**
 * Headless tests for the view of the table controls (wx-webui-table and
 * wx-webui-table-reorderable): the rows render from the state and keep their nodes, the
 * content a cell template built is built anew only when what the cell shows changes, a
 * refresh flashes what changed, and a row move is state the rows render.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Builds a table of two columns and three rows; the first column is drawn by a cell
 * template that counts how often it builds.
 * @param {object} [options={}] - reorderable, host dataset, the rows.
 * @returns {object} The runtime, the host, the control and the build counter.
 */
function table(options = {}) {
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.table.js", "webexpress.webui.table.reorderable.js"]
    });
    const builds = [];
    rt.wx.TableTemplates.register("probe", (value) => {
        builds.push(value);
        const span = rt.document.createElement("span");
        span.className = "probe";
        span.textContent = value;
        return span;
    });

    const element = rt.document.createElement("div");
    Object.assign(element.dataset, options.host || {});
    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    for (const [label, type] of [["Name", "probe"], ["Age", null]]) {
        const column = rt.document.createElement("div");
        column.dataset.label = label;
        if (type) {
            column.dataset.type = type;
        }
        columns.appendChild(column);
    }
    element.appendChild(columns);
    rt.document.body.appendChild(element);

    const Ctrl = options.reorderable ? rt.wx.TableReorderableCtrl : rt.wx.TableCtrl;
    const ctrl = new Ctrl(element);
    ctrl.setRows(options.rows || [
        row("steve", "Steve", "41"),
        row("grace", "Grace", "21"),
        row("emma", "Emma", "25")
    ]);
    ctrl._store.flush();
    builds.length = 0;
    return { rt, element, ctrl, builds };
}

/**
 * Builds a row record.
 * @param {string} id - The row id.
 * @param {...string} values - The cell contents.
 * @returns {object} The row.
 */
function row(id, ...values) {
    return { id, cells: values.map((content) => ({ content, text: content })), children: [], parent: null, expanded: true };
}

const ids = (ctrl) => ctrl._body.children.filter((el) => el._dataRowRef).map((el) => el._dataRowRef.id);

test("the table describes its state without touching the DOM", () => {
    const { rt, ctrl } = table();
    const before = ctrl._body.children.slice();

    const tree = ctrl._viewTree(Object.assign({}, ctrl.state, { rows: [] }));

    assert.ok(ctrl instanceof rt.wx.StateCtrl);
    assert.deepEqual(tree.filter(Boolean).map((node) => node.key), ["head", "body"]);
    assert.ok(ctrl._body.children.every((node, i) => node === before[i]), "the rows are still there");
});

test("a sort moves the rows and keeps their nodes and what their cell templates built", () => {
    const { ctrl, builds } = table();
    const nodes = new Map(ctrl._rows.map((r) => [r.id, r._anchorTr]));
    const probes = new Map(ctrl._rows.map((r) => [r.id, r._anchorTr.querySelector(".probe")]));

    ctrl._handleSortClick(null, ctrl._columns[0]);
    ctrl._store.flush();

    assert.deepEqual(ids(ctrl), ["emma", "grace", "steve"]);
    for (const r of ctrl._rows) {
        assert.equal(r._anchorTr, nodes.get(r.id), `${r.id} keeps its row node`);
        assert.equal(r._anchorTr.querySelector(".probe"), probes.get(r.id), `${r.id} keeps its cell content`);
    }
    assert.deepEqual(builds, [], "no cell template ran again");
    assert.equal(ctrl._head.querySelector(".wx-col-header").getAttribute("aria-sort"), "ascending");
});

test("a cell is built anew when what it shows changes, and only that cell", () => {
    const { ctrl, builds } = table();
    const steve = ctrl._rows[0];
    const other = ctrl._rows[1]._anchorTr.querySelector(".probe");

    steve.cells[0].content = "Steve S. Stanman";
    ctrl.render();
    ctrl._store.flush();

    assert.deepEqual(builds, ["Steve S. Stanman"]);
    assert.equal(steve._anchorTr.querySelector(".probe").textContent, "Steve S. Stanman");
    assert.equal(ctrl._rows[1]._anchorTr.querySelector(".probe"), other);
});

test("a selection is rendered before it is announced", () => {
    const { rt, element, ctrl } = table({ host: { selectable: "true" } });
    const seen = [];
    element.addEventListener(rt.wx.Event.SELECT_ROW_EVENT, (event) => {
        seen.push([event.detail.rowId, event.detail.row._anchorTr.classList.contains("active")]);
    });

    ctrl.selectRow("emma");

    assert.deepEqual(seen, [["emma", true]]);
    assert.equal(ctrl._rows[0]._anchorTr.classList.contains("active"), false, "the first row gave the selection up");
    assert.equal(ctrl._rows[2]._anchorTr.getAttribute("aria-selected"), "true");
});

test("a refresh flashes the changed and the new rows and takes the marks away once played", async () => {
    const { rt, ctrl } = table();
    rt.wx.TableCtrl.FLASH_DURATION = 5;

    ctrl._rows[1].cells[1].content = "22";
    ctrl.insertRow(row("chloe", "Chloe", "35"));
    ctrl._store.flush();

    const grace = ctrl._rows[1]._anchorTr;
    const chloe = ctrl._rows[3]._anchorTr;
    assert.ok(grace.classList.contains("wx-change-flash"));
    assert.ok(chloe.classList.contains("wx-new-flash"));
    assert.equal(ctrl._rows[0]._anchorTr.classList.contains("wx-change-flash"), false, "an unchanged row stays calm");

    await new Promise((resolve) => setTimeout(resolve, 20));
    ctrl._store.flush();
    assert.equal(grace.classList.contains("wx-change-flash"), false);
    assert.equal(chloe.classList.contains("wx-new-flash"), false);
});

test("a row move is state: the moved row, the row under the pointer and the drop line render from it", () => {
    const { rt, element, ctrl } = table({ reorderable: true, host: { movableRow: "true", treeMoveEnabled: "false" } });
    const [steve, , emma] = ctrl._rows;
    const nodes = ctrl._rows.map((r) => r._anchorTr);
    const reorders = [];
    element.addEventListener(rt.wx.Event.ROW_REORDER_EVENT, (event) => reorders.push([event.detail.rowId, event.detail.toIndex]));

    ctrl._beginRowMove(steve, steve._anchorTr, 0, 0);
    ctrl._store.flush();
    const ghost = ctrl._rowMoveGhost;
    assert.ok(steve._anchorTr.classList.contains("wx-dragging"));
    assert.equal(steve._anchorTr.nextSibling.classList.contains("wx-row-move-placeholder"), true, "the line stands below the moved row");

    emma._anchorTr._rect = { top: 0, height: 40 };
    ctrl._onBodyHoverMove({ target: emma._anchorTr.children[1], clientY: 35 });
    ctrl._store.flush();
    assert.equal(emma._anchorTr.classList.contains("wx-drag-over"), false, "a drop between rows is shown by the line alone");
    assert.equal(emma._anchorTr.nextSibling.classList.contains("wx-row-move-placeholder"), true, "the line follows below the hovered row");

    ctrl._finalizeRowMove();
    ctrl._store.flush();
    assert.deepEqual(ids(ctrl), ["grace", "emma", "steve"]);
    assert.deepEqual(reorders, [["steve", 2]]);
    assert.equal(ctrl._body.querySelector(".wx-row-move-placeholder"), null);
    assert.equal(ctrl._body.querySelector(".wx-dragging"), null);
    assert.equal(ctrl._body.querySelector(".wx-drag-over"), null);
    assert.equal(ghost.parentNode, null, "the ghost is gone");
    assert.ok(ctrl._rows.every((r) => nodes.includes(r._anchorTr)), "the rows moved, they were not rebuilt");
});

test("a row dropped into another is shown as a drop area on that row instead of a line", () => {
    const { ctrl } = table({ reorderable: true, host: { movableRow: "true" } });
    const [steve, , emma] = ctrl._rows;

    ctrl._beginRowMove(steve, steve._anchorTr, 0, 0);
    emma._anchorTr._rect = { top: 0, height: 40 };
    ctrl._onBodyHoverMove({ target: emma._anchorTr.children[1], clientY: 20 });
    ctrl._store.flush();
    assert.ok(emma._anchorTr.classList.contains("wx-drag-over"));
    const line = ctrl._body.querySelector(".wx-row-move-placeholder");
    assert.match(line.getAttribute("style") ?? line.style.cssText ?? "", /display:\s*none/, "no line competes with the area");
    ctrl._finalizeRowMove();
});

test("the arrow keys on a grip move the row and give its grip the focus back", () => {
    const { ctrl } = table({ reorderable: true, host: { movableRow: "true" } });
    const grace = ctrl._rows[1];
    const grip = grace._anchorTr.querySelector(".wx-table-drag-handle").firstChild;
    let focused = null;
    grip.focus = () => { focused = grip; };

    ctrl._moveRowByStep(grace, -1);

    assert.deepEqual(ids(ctrl), ["grace", "steve", "emma"]);
    assert.equal(focused, grip);
});

test("a dropped column takes its cells along and the headers keep their nodes", () => {
    const { ctrl } = table({ reorderable: true });
    const headers = ctrl._head.querySelectorAll(".wx-col-header");

    ctrl._dropColumn("col_0", "col_1", false);
    ctrl._store.flush();

    const after = ctrl._head.querySelectorAll(".wx-col-header");
    assert.deepEqual(after.map((h) => h.dataset.columnId), ["col_1", "col_0"]);
    assert.equal(after[0], headers[1]);
    assert.equal(after[1], headers[0]);
    const cells = ctrl._rows[0]._anchorTr.children.filter((el) => el.classList.contains("wx-grid-cell") && !el.classList.contains("wx-table-actions"));
    assert.equal(cells[0].textContent, "41");
    assert.equal(cells[1].querySelector(".probe").textContent, "Steve");
});

test("a reorderable row writes a multi-word action hyphenated, as the base table does", () => {
    const actionRow = Object.assign(row("steve", "Steve", "41"), { primaryAction: { action: "modal", modalUri: "/steve" } });
    const { ctrl } = table({ reorderable: true, rows: [actionRow] });

    const tr = ctrl._rows[0]._anchorTr;
    assert.equal(tr.getAttribute("data-wx-primary-modal-uri"), "/steve");
    assert.equal(tr.getAttribute("data-wx-primary-modaluri"), null);
});

test("a double click on a resizer sizes the column by its own cells, not by the grip ahead of them", () => {
    const { ctrl } = table({ reorderable: true, host: { movableRow: "true" } });
    for (const r of ctrl._rows) {
        const [grip, name] = r._anchorTr.children;
        grip._rect = { width: 900 };
        name._rect = { width: r.id === "grace" ? 200 : 120 };
    }

    ctrl._autoSizeColumn(0);

    assert.equal(ctrl._columns[0].width, 200 + ctrl.constructor.AUTOSIZE_BUFFER);
    assert.match(ctrl._table.style.getPropertyValue("--wx-grid-template"), /^1\.5rem 208px /);
});

test("the column insertion line is a rendered part of the table that a render leaves where the drag put it", () => {
    const { ctrl } = table({ reorderable: true });
    const indicator = ctrl._dragColumnIndicator;
    indicator.style.display = "block";

    ctrl.render();
    ctrl._store.flush();

    assert.equal(ctrl._dragColumnIndicator, indicator);
    assert.equal(indicator.parentNode, ctrl._table);
    assert.equal(indicator.style.display, "block");
});
