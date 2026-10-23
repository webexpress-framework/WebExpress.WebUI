/**
 * Regression tests for how the table writes a manual edit back to its model: the cell is
 * found by the column it shows rather than by its position among the cells of the row,
 * so the grip of a movable row, a hidden column or a reordered one does not shift the
 * edit onto a neighbour, and the sortable text follows the edited content.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Builds a reorderable table of two columns and two rows.
 * @param {object} [host={}] - The dataset of the host.
 * @returns {object} The runtime and the control.
 */
function table(host = {}) {
    const rt = loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.table.js", "webexpress.webui.table.reorderable.js"]
    });
    const element = rt.document.createElement("div");
    Object.assign(element.dataset, host);
    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    for (const label of ["Name", "Age"]) {
        const column = rt.document.createElement("div");
        column.dataset.label = label;
        columns.appendChild(column);
    }
    element.appendChild(columns);
    rt.document.body.appendChild(element);

    const ctrl = new rt.wx.TableReorderableCtrl(element);
    ctrl.setRows([
        { id: "stan", cells: [{ content: "Stan", text: "Stan" }, { content: "41", text: "41" }], children: [] },
        { id: "elaine", cells: [{ content: "Elaine", text: "Elaine" }, { content: "35", text: "35" }], children: [] }
    ]);
    ctrl._store.flush();
    return { rt, ctrl };
}

/**
 * Finds the cell element a row renders for a column.
 * @param {object} row - The row record.
 * @param {string} columnId - The id of the column.
 * @returns {object} The cell element.
 */
function cellOf(row, columnId) {
    const cell = row._anchorTr.children.find((el) => el._wxColumn && el._wxColumn.id === columnId);
    assert.ok(cell, `the row renders a cell for ${columnId}`);
    return cell;
}

test("an input in the first data column of a movable row changes exactly that model cell", () => {
    const { rt, ctrl } = table({ movableRow: "true" });
    const stan = ctrl._rows[0];
    const input = rt.document.createElement("input");
    cellOf(stan, "col_0").appendChild(input);

    input.value = "Stanley";
    ctrl._onBodyInput({ target: input });

    assert.equal(stan.cells[0].content, "Stanley");
    assert.equal(stan.cells[0].text, "Stanley", "the sortable text follows the edit");
    assert.equal(stan.cells[1].content, "41", "the neighbour keeps its value");
    assert.equal(stan.cells[1].text, "41");
});

test("a contenteditable cell is written back with its text", () => {
    const { rt, ctrl } = table({ movableRow: "true" });
    const elaine = ctrl._rows[1];
    const editable = rt.document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    cellOf(elaine, "col_1").appendChild(editable);

    editable.textContent = "36";
    ctrl._onBodyInput({ target: editable });

    assert.equal(elaine.cells[1].content, "36");
    assert.equal(elaine.cells[1].text, "36");
    assert.equal(elaine.cells[0].content, "Elaine");
});

test("an edit after a column reorder lands in the column it was made in and sorts by its new text", () => {
    const { rt, ctrl } = table({ movableRow: "true" });
    ctrl._dropColumn("col_1", "col_0", true);
    ctrl._store.flush();
    const elaine = ctrl._rows[1];
    const input = rt.document.createElement("input");
    cellOf(elaine, "col_0").appendChild(input);

    input.value = "Zed";
    ctrl._onBodyInput({ target: input });
    ctrl._onHeadClick({ target: ctrl._head.querySelectorAll(".wx-col-header").find((el) => el.dataset.columnId === "col_0") });
    ctrl._store.flush();

    assert.deepEqual(ctrl._rows.map((r) => r.id), ["stan", "elaine"], "the edited name sorts last");
    assert.equal(elaine.cells[ctrl._colIndexCache.get("col_0")].content, "Zed");
    assert.equal(elaine.cells[ctrl._colIndexCache.get("col_1")].content, "35");
});

test("a cell whose template brings an editor of its own is left to that editor", () => {
    const { rt, ctrl } = table();
    const stan = ctrl._rows[0];
    const smartEdit = rt.document.createElement("div");
    smartEdit.classList.add("wx-smart-edit");
    const input = rt.document.createElement("input");
    smartEdit.appendChild(input);
    cellOf(stan, "col_0").appendChild(smartEdit);

    input.value = "Stanley";
    ctrl._onBodyInput({ target: input });

    assert.equal(stan.cells[0].content, "Stan", "the editor reports through its save event instead");
});
