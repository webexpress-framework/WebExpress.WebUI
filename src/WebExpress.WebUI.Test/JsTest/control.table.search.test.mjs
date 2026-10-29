/**
 * Tests the search of the table: the search bind hands it the term of a search box, and
 * the table narrows its rows on the client without losing any of them.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Builds a table with a name and a description column.
 * @returns {object} The runtime and the control.
 */
function table() {
    const rt = loadWebUi({ browser: true, extraFiles: ["webexpress.webui.table.js"] });
    const element = rt.document.createElement("div");
    element.dataset.selectable = "true";
    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    for (const label of ["Name", "Description"]) {
        const column = rt.document.createElement("div");
        column.dataset.label = label;
        columns.appendChild(column);
    }
    element.appendChild(columns);
    rt.document.body.appendChild(element);

    const ctrl = new rt.wx.TableCtrl(element);
    ctrl.setRows([
        { id: "base", cells: [{ content: "Demo Basis", text: "Demo Basis" }, { content: "Provides services", text: "Provides services" }], children: [] },
        { id: "addon", cells: [{ content: "Demo Addon", text: "Demo Addon" }, { content: "Extends the base", text: "Extends the base" }], children: [] },
        { id: "hello", cells: [{ content: "HelloWorld", text: "HelloWorld" }, { content: "Greets", text: "Greets" }], children: [] }
    ]);
    ctrl._store.flush();
    return { rt, ctrl };
}

/**
 * Returns the ids of the rows the body shows.
 * @param {object} ctrl - The table control.
 * @returns {Array<string>} The row ids.
 */
function shown(ctrl) {
    return ctrl._visibleRowsFlat().map((row) => row.id);
}

test("a term narrows the rows to those with a matching cell, ignoring case", () => {
    const { ctrl } = table();

    ctrl.search("DEMO");
    ctrl._store.flush();
    assert.deepEqual(shown(ctrl), ["base", "addon"]);

    ctrl.search("extends");
    ctrl._store.flush();
    assert.deepEqual(shown(ctrl), ["addon"], "any cell counts, not only the first");
});

test("clearing the term shows every row again, none was dropped", () => {
    const { ctrl } = table();

    ctrl.search("hello");
    ctrl._store.flush();
    ctrl.search("");
    ctrl._store.flush();

    assert.deepEqual(shown(ctrl), ["base", "addon", "hello"]);
    assert.equal(ctrl._rows.length, 3);
});

test("a term without match says so instead of leaving an empty body", () => {
    const { ctrl } = table();

    ctrl.search("nothing like this");
    ctrl._store.flush();

    assert.deepEqual(shown(ctrl), []);
    assert.ok(ctrl._body.querySelector(".wx-table-search-empty"), "the body names the empty result");

    ctrl.search("");
    ctrl._store.flush();
    assert.equal(ctrl._body.querySelector(".wx-table-search-empty"), null, "the note goes with the term");
});

test("a selected row the search hides is no longer selected", () => {
    const { ctrl } = table();
    assert.equal(ctrl.getSelectedRow()?.id, "base", "the first row is selected on open");

    ctrl.search("hello");
    ctrl._store.flush();

    assert.equal(ctrl.getSelectedRow(), null);
});
