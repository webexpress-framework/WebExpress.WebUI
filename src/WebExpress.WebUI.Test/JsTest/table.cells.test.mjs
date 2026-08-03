/**
 * Focused tests for how the table control reads a row: which cells carry
 * markup rather than a value, and what a row's "..." menu passes on to the
 * shared dropdown. Both are contracts between the server-rendered markup
 * (ControlTableCellPanel, ControlTableRow options) and the dropdown control,
 * so a drift on either side breaks here rather than silently in the browser.
 *
 * The dom stub does not parse markup, so these tests pin the classification
 * and the attribute round-trip, not the materialised nodes.
 *
 * Run with Node 18 or newer from the JsTest folder:
 *   node --test
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";

/**
 * Loads a runtime with the table and the dropdown it builds its options menu
 * from.
 * @returns {object} The loaded runtime.
 */
function loadTable() {
    return loadWebUi({
        browser: true,
        extraFiles: ["webexpress.webui.dropdown.js", "webexpress.webui.table.js"]
    });
}

/**
 * Builds a table host with a single column and a single row.
 * @param {object} rt - The loaded runtime.
 * @param {Function} fillRow - Populates the row element.
 * @returns {object} The host element.
 */
function host(rt, fillRow) {
    const element = rt.document.createElement("div");

    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    const column = rt.document.createElement("div");
    column.dataset.label = "Name";
    columns.appendChild(column);
    element.appendChild(columns);

    const row = rt.document.createElement("div");
    row.classList.add("wx-table-row");
    fillRow(row);
    element.appendChild(row);

    rt.document.body.appendChild(element);
    return element;
}

/**
 * Builds a cell element.
 * @param {object} rt - The loaded runtime.
 * @param {string} text - The cell text.
 * @param {boolean} panel - Whether the cell is a control panel.
 * @returns {object} The cell element.
 */
function cell(rt, text, panel) {
    const element = rt.document.createElement("div");
    if (panel) {
        element.classList.add("wx-table-cell-panel");
    }
    element.textContent = text;
    return element;
}

test("wx-webui-table keeps a cell panel as markup and a plain cell as text", () => {
    const rt = loadTable();
    const element = host(rt, (row) => {
        row.appendChild(cell(rt, "Guybrush", true));
        row.appendChild(cell(rt, "1.0.0", false));
    });

    const cells = new rt.wx.TableCtrl(element)._rows[0].cells;

    assert.equal(cells[0].html, true, "the panel cell is marked as markup");
    assert.equal(cells[0].text, "Guybrush", "the flattened text stays available for sorting");
    assert.equal(cells[1].html, false, "a plain cell is not marked as markup");
    assert.equal(cells[1].content, "1.0.0");
});

test("wx-webui-table sorts a cell panel by its text rather than its markup", () => {
    const rt = loadTable();
    const element = rt.document.createElement("div");

    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    const column = rt.document.createElement("div");
    column.dataset.label = "Name";
    columns.appendChild(column);
    element.appendChild(columns);

    for (const name of ["Stan", "Elaine", "Guybrush"]) {
        const row = rt.document.createElement("div");
        row.classList.add("wx-table-row");
        row.appendChild(cell(rt, name, true));
        element.appendChild(row);
    }
    rt.document.body.appendChild(element);

    const ctrl = new rt.wx.TableCtrl(element);
    ctrl.orderRows(Object.assign(ctrl._columns[0], { sort: "asc" }));

    assert.deepEqual(ctrl._rows.map((r) => r.cells[0].text), ["Elaine", "Guybrush", "Stan"]);
});

test("wx-webui-table passes a row option on with its label and full action payload", () => {
    const rt = loadTable();
    const element = host(rt, (row) => {
        row.appendChild(cell(rt, "Guybrush", false));

        const options = rt.document.createElement("div");
        options.classList.add("wx-table-options");

        const item = rt.document.createElement("div");
        item.classList.add("wx-dropdown-item");
        item.textContent = "Update";
        item.dataset.wxPrimaryAction = "plugin-package";
        item.dataset.wxPrimaryUri = "/api/v1/pluginpackage/action/update/x";
        item.dataset.wxPrimaryMethod = "PUT";
        item.dataset.wxPrimaryRequireFile = "true";
        item.dataset.wxPrimaryConfirm = "Update package?";
        options.appendChild(item);

        row.appendChild(options);
    });

    const option = new rt.wx.TableCtrl(element)._rows[0].options[0];

    assert.equal(option.text, "Update", "the dropdown reads the label from text");
    assert.equal(option.content, "Update", "the sibling controls read it from content");
    assert.equal(option.primaryAction.action, "plugin-package");
    assert.equal(option.primaryAction.method, "PUT");
    assert.equal(option.primaryAction.requireFile, true, "a multi-word action attribute survives");
    assert.equal(option.primaryAction.confirm, "Update package?");
});

test("wx-webui-dropdown writes a multi-word action attribute back hyphenated", () => {
    const rt = loadTable();
    const element = rt.document.createElement("div");
    rt.document.body.appendChild(element);

    const ctrl = new rt.wx.DropdownCtrl(element);
    ctrl.items = [{
        text: "Update",
        primaryAction: {
            action: "plugin-package",
            uri: "/api/v1/pluginpackage/action/update/x",
            requireFile: true,
            confirm: "Update package?"
        }
    }];

    const link = element.querySelector("a");
    assert.ok(link, "the menu renders an entry");
    assert.equal(link.textContent, "Update");
    assert.equal(link.getAttribute("data-wx-primary-action"), "plugin-package");
    // the registry reads data-wx-primary-require-file; a lower-cased key would
    // produce data-wx-primary-requirefile and the action would never see it
    assert.equal(link.getAttribute("data-wx-primary-require-file"), "true");
    assert.equal(link.getAttribute("data-wx-primary-confirm"), "Update package?");
});
