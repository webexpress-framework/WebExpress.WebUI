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

test("wx-webui-table keeps a markup cell as markup, sorts it by its text and keeps its own classes", () => {
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
        const markup = rt.document.createElement("div");
        markup.classList.add("wx-table-cell-markup");
        markup.classList.add("extra");
        const text = rt.document.createElement("span");
        text.classList.add("wx-table-cell-text");
        text.textContent = name;
        markup.appendChild(text);
        row.appendChild(markup);
        element.appendChild(row);
    }
    rt.document.body.appendChild(element);

    const ctrl = new rt.wx.TableCtrl(element);
    const cell = ctrl._rows[0].cells[0];

    assert.equal(cell.html, true, "the markup cell is marked as markup");
    assert.equal(cell.text, "Stan", "the flattened text stays available for sorting");
    assert.ok(String(cell.class).includes("extra"), "unlike a panel, the cell keeps its classes");

    ctrl.orderRows(Object.assign(ctrl._columns[0], { sort: "asc" }));
    assert.deepEqual(ctrl._rows.map((r) => r.cells[0].text), ["Elaine", "Guybrush", "Stan"]);
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

test("wx-webui-table links a cell that carries a uri of its own", async () => {
    const rt = loadTable();
    const element = rt.document.createElement("div");

    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    for (const label of ["Name", "Path"]) {
        const column = rt.document.createElement("div");
        column.dataset.label = label;
        columns.appendChild(column);
    }
    element.appendChild(columns);

    const row = rt.document.createElement("div");
    row.classList.add("wx-table-row");
    row.appendChild(cell(rt, "HelloWorld", false));
    const path = cell(rt, "/helloworld", false);
    path.dataset.uri = "/helloworld";
    row.appendChild(path);
    element.appendChild(row);
    rt.document.body.appendChild(element);

    new rt.wx.TableCtrl(element);
    // the render is batched into a microtask
    await Promise.resolve();

    const link = element.querySelector("a");
    assert.ok(link, "the cell uri produces an anchor");
    // the dom stub models href as a property, as the browser does
    assert.equal(link.href, "/helloworld");
    assert.equal(link.textContent, "/helloworld");
    assert.equal(element.querySelectorAll("a").length, 1, "the cell without a uri stays plain");
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

test("wx-webui-table aligns the header and every cell of an aligned column", async () => {
    const rt = loadTable();
    const element = rt.document.createElement("div");

    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    for (const [label, align] of [["Name", null], ["Count", "right"]]) {
        const column = rt.document.createElement("div");
        column.dataset.label = label;
        if (align) {
            column.dataset.align = align;
        }
        columns.appendChild(column);
    }
    element.appendChild(columns);

    for (const [name, count] of [["Screws", "120"], ["Washers", "8"]]) {
        const row = rt.document.createElement("div");
        row.classList.add("wx-table-row");
        row.appendChild(cell(rt, name, false));
        row.appendChild(cell(rt, count, false));
        element.appendChild(row);
    }
    rt.document.body.appendChild(element);

    new rt.wx.TableCtrl(element);
    // the render is batched into a microtask
    await Promise.resolve();

    const aligned = element.querySelectorAll(".wx-table-align-right");
    assert.equal(aligned.length, 3, "the header and both body cells of the column");
    assert.deepEqual(Array.from(aligned).map((x) => x.textContent), ["Count", "120", "8"]);
    const cells = [...element.querySelectorAll(".wx-grid-header-cell"), ...element.querySelectorAll(".wx-grid-cell")];
    const classed = cells.filter((x) => String(x.className).includes("wx-table-align-"));
    assert.equal(cells.length, 6, "two header and four body cells are rendered");
    assert.equal(classed.length, 3, "a column without an alignment gets no class");
});

/**
 * Builds a table host whose first column has a formatted header and no plain title,
 * and whose second column is aligned and plain.
 * @param {object} rt - The loaded runtime.
 * @returns {object} The host element.
 */
function formattedHeaderHost(rt) {
    const element = rt.document.createElement("div");
    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");

    const formatted = rt.document.createElement("div");
    const label = rt.document.createElement("span");
    label.classList.add("wx-table-column-label");
    const strong = rt.document.createElement("strong");
    strong.textContent = "Name";
    label.appendChild(strong);
    formatted.appendChild(label);
    columns.appendChild(formatted);

    const plain = rt.document.createElement("div");
    plain.dataset.label = "Count";
    plain.dataset.align = "right";
    columns.appendChild(plain);
    element.appendChild(columns);

    const row = rt.document.createElement("div");
    row.classList.add("wx-table-row");
    row.appendChild(cell(rt, "Guybrush", false));
    row.appendChild(cell(rt, "3", false));
    element.appendChild(row);

    rt.document.body.appendChild(element);
    return element;
}

for (const [name, ctrl, files] of [
    ["wx-webui-table", "TableCtrl", []],
    ["wx-webui-table-reorderable", "TableReorderableCtrl", ["webexpress.webui.table.reorderable.js"]]
]) {
    test(`${name} shows a formatted column header and names the column by its text`, async () => {
        const rt = loadWebUi({
            browser: true,
            extraFiles: ["webexpress.webui.dropdown.js", "webexpress.webui.table.js", ...files]
        });
        const element = formattedHeaderHost(rt);

        const table = new rt.wx[ctrl](element);
        // the render is batched into a microtask
        await Promise.resolve();

        // the dom stub does not serialize markup, so the contract is pinned rather than the
        // materialised tags: the label is found, kept apart and named by its text
        assert.equal(table._columns[0].label, "Name", "without a title the column is named by its text");
        assert.ok(table._columns[0].labelHtml, "the formatted header is kept");
        assert.equal(table._columns[1].labelHtml, null, "a plain column has no formatted header");

        const headers = Array.from(element.querySelectorAll(".wx-col-header"));
        assert.equal(headers.length, 2);
        const line = headers[0].querySelector(".wx-table-cell-text");
        assert.ok(line, "the formatted header is one line of text");
        assert.equal(line.textContent, "Name");
        assert.equal(headers[1].querySelector(".wx-table-cell-text"), null, "a plain header stays text");
        assert.ok(String(headers[1].className).includes("wx-table-align-right"), "the header follows its column alignment");
    });
}

test("wx-webui-table shows the footer the server renders below the rows, aligned with its column", async () => {
    const rt = loadTable();
    const element = rt.document.createElement("div");

    const columns = rt.document.createElement("div");
    columns.classList.add("wx-table-columns");
    for (const [label, align] of [["Item", null], ["Count", "right"]]) {
        const column = rt.document.createElement("div");
        column.dataset.label = label;
        if (align) {
            column.dataset.align = align;
        }
        columns.appendChild(column);
    }
    element.appendChild(columns);

    const row = rt.document.createElement("div");
    row.classList.add("wx-table-row");
    row.appendChild(cell(rt, "Screws", false));
    row.appendChild(cell(rt, "120", false));
    element.appendChild(row);

    const footer = rt.document.createElement("div");
    footer.classList.add("wx-table-footer");
    footer.appendChild(cell(rt, "Total", false));
    footer.appendChild(cell(rt, "120", false));
    element.appendChild(footer);
    rt.document.body.appendChild(element);

    const ctrl = new rt.wx.TableCtrl(element);
    // the render is batched into a microtask
    await Promise.resolve();

    assert.equal(ctrl._rows.length, 1, "the footer is not read as a row");
    const group = element.querySelector(".wx-table-footer-group");
    assert.ok(group, "the footer is rendered");
    const cells = Array.from(group.querySelectorAll(".wx-grid-cell"));
    assert.deepEqual(cells.map((x) => x.textContent), ["Total", "120"]);
    assert.ok(String(cells[1].className).includes("wx-table-align-right"), "the footer cell follows its column");
});
