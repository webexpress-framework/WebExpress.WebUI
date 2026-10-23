/**
 * Tests of the workbook model: addressing, JSON reading and writing with validation, and every
 * operation together with its inverse.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadSpreadsheet, plain } from "./spreadsheet.fixture.mjs";

const rt = loadSpreadsheet();
const { SpreadsheetAddress: Address, SpreadsheetModel: Model, SpreadsheetSheet: Sheet } = rt.wx;

/**
 * Applies an operation and checks that its inverse restores the previous JSON exactly.
 * @param {object} model - The model.
 * @param {object} op - The operation.
 * @returns {object} The result of apply.
 */
function roundTrip(model, op) {
    const before = JSON.stringify(model.toJSON({ ids: false }));
    const result = model.apply(op);
    const after = JSON.stringify(model.toJSON({ ids: false }));
    const back = model.apply(result.inverse);
    assert.equal(JSON.stringify(model.toJSON({ ids: false })), before, "the inverse restores the workbook");
    const again = model.apply(back.inverse);
    assert.equal(JSON.stringify(model.toJSON({ ids: false })), after, "the inverse of the inverse redoes it");
    return again;
}

test("a refused cell operation leaves every earlier entry unchanged", () => {
    const model = Model.fromJSON({ sheets: [{ name: "S", rowCount: 2, colCount: 2, data: [[10, "=A1*2"]] }] });
    const before = JSON.stringify(model.toJSON());

    assert.throws(() => model.apply({ type: "set", sheet: model.sheets[0].id, cells: [
        { row: 0, col: 0, cell: { v: 99 } },
        { row: 2, col: 0, cell: { v: 1 } }
    ] }), { name: "RangeError" });
    assert.equal(JSON.stringify(model.toJSON()), before);
});

test("column names and indices convert both ways", () => {
    for (const [index, name] of [[0, "A"], [25, "Z"], [26, "AA"], [701, "ZZ"], [702, "AAA"], [16383, "XFD"]]) {
        assert.equal(Address.columnName(index), name);
        assert.equal(Address.columnIndex(name), index);
        assert.equal(Address.columnIndex(name.toLowerCase()), index);
    }
    assert.equal(Address.cellName(1, 2), "C2");
    assert.equal(Address.cellName(1, 2, true, true), "$C$2");
    assert.equal(Address.cellName(1, 2, true, false), "C$2");
});

test("cell and range references are parsed with their kind and sheet", () => {
    assert.deepEqual(plain(Address.parseCell("$B$3")), { row: 2, col: 1, absRow: true, absCol: true });
    assert.equal(Address.parseCell("A0"), null);
    assert.equal(Address.parseCell("XFE1"), null);
    assert.equal(Address.parseCell("A1048577"), null);
    assert.equal(Address.parseCell("hello"), null);
    assert.deepEqual(plain(Address.parseRange("C3:A1")), { sheet: null, r1: 0, c1: 0, r2: 2, c2: 2, kind: "range" });
    assert.equal(Address.parseRange("B:D").kind, "cols");
    assert.equal(Address.parseRange("D:B").c1, 1);
    assert.equal(Address.parseRange("2:4").kind, "rows");
    assert.equal(Address.parseRange("4:2").r1, 1);
    assert.equal(Address.parseRange("Sheet2!B2").sheet, "Sheet2");
    assert.equal(Address.parseRange("'My ''x'' sheet'!A1:B2").sheet, "My 'x' sheet");
    assert.equal(Address.parseRange(""), null);
    assert.equal(Address.parseRange("A1:B2:C3"), null);
    assert.equal(Address.parseRange("A1:foo"), null);
    assert.equal(Address.parseRange("0:2"), null);
    assert.equal(Address.parseRange("A:XFZ"), null);
});

test("ranges are written in their shortest form", () => {
    assert.equal(Address.rangeName({ r1: 0, c1: 0, r2: 0, c2: 0 }), "A1");
    assert.equal(Address.rangeName({ r1: 0, c1: 0, r2: 2, c2: 1 }), "A1:B3");
    assert.equal(Address.rangeName({ r1: 0, c1: 1, r2: Address.MAX_ROWS - 1, c2: 2 }), "B:C");
    assert.equal(Address.rangeName({ r1: 1, c1: 0, r2: 3, c2: Address.MAX_COLS - 1 }), "2:4");
    assert.equal(Address.rangeName({ r1: 0, c1: 0, r2: 0, c2: 0, sheet: "My Sheet" }, { sheet: true }), "'My Sheet'!A1");
    assert.equal(Address.quoteSheet("Sales"), "Sales");
    assert.equal(Address.quoteSheet("A1"), "'A1'");
    assert.equal(Address.quoteSheet("Q 1"), "'Q 1'");
    assert.ok(Address.contains({ r1: 0, c1: 0, r2: 2, c2: 2 }, 1, 1));
    assert.ok(!Address.intersects({ r1: 0, c1: 0, r2: 1, c2: 1 }, { r1: 2, c1: 2, r2: 3, c2: 3 }));
});

test("a workbook is read from cells, from a data grid and from nothing", () => {
    const empty = Model.fromJSON(null, { sheetName: "Blatt1" });
    assert.equal(empty.sheets.length, 1);
    assert.equal(empty.sheets[0].name, "Blatt1");
    assert.equal(empty.sheets[0].rowCount, Model.DEFAULT_ROWS);
    const model = Model.fromJSON(JSON.stringify({
        sheets: [
            { name: "A", cells: { B2: { v: 5 }, C3: 7, "bogus": 1, D4: { f: "=B2*2", r: 99 } }, rows: { 1: { size: 40 }, x: {} }, cols: { 0: { size: 30, hidden: true } } },
            { name: "a", data: [[1, "=A1+1", null, ""], "nope", [{ v: "x", s: { bold: true } }]] }
        ],
        names: { Total: "A!B2", Bad: "nope", "A1": "A!B2", Plain: "B2" },
        styles: { head: { bold: true, color: "javascript:alert(1)" }, "bad name!": { bold: true } },
        meta: { title: "Plan" }
    }));
    const [a, b] = model.sheets;
    assert.equal(a.getCell(1, 1).v, 5);
    assert.equal(a.getCell(2, 2).v, 7);
    assert.equal(a.getCell(3, 3).f, "=B2*2");
    assert.equal(a.getCell(3, 3).r, undefined, "a stored result is not taken over");
    assert.equal(a.rowProps[1].size, 40);
    assert.equal(a.colProps[0].hidden, true);
    assert.equal(b.name, "Sheet2", "a name taken case-insensitively is replaced");
    assert.equal(b.getCell(0, 1).f, "=A1+1");
    assert.equal(b.getCell(2, 0).s.bold, true);
    assert.deepEqual(plain(model.names), { Total: "A!B2", Plain: "A!B2" });
    assert.deepEqual(plain(model.styles), { head: { bold: true } });
    assert.equal(model.meta.title, "Plan");
    assert.throws(() => Model.fromJSON("[1]"), { name: "TypeError" });
    assert.throws(() => Model.fromJSON({ sheets: ["x"] }), { name: "TypeError" });
});

test("cells beyond the declared size grow the sheet", () => {
    const model = Model.fromJSON({ sheets: [{ rowCount: 2, colCount: 2, cells: { E10: 1 } }] });
    assert.equal(model.sheets[0].rowCount, 10);
    assert.equal(model.sheets[0].colCount, 5);
});

test("the JSON form writes cells, axes, merges, panes, properties, ids and results", () => {
    const model = Model.fromJSON({ sheets: [{ name: "S", cells: { A1: 1, B1: { f: "=A1/0" } }, merges: ["C1:D2", "C2:C3", "E1"], frozen: { rows: 1, cols: 2 }, props: { tabColor: "#ff0000", gridlines: false, evil: "x" }, rows: { 2: { s: { fill: "#eeeeee" } } } }] });
    const json = model.toJSON({ result: (sheet, row, col) => (col === 1 ? new rt.wx.SpreadsheetError("#DIV/0!") : null), ids: true, activeSheet: "S" });
    const sheet = json.sheets[0];
    assert.equal(json.activeSheet, "S");
    assert.deepEqual(plain(sheet.cells.B1.r), { error: "#DIV/0!" });
    assert.deepEqual(plain(sheet.merges), ["C1:D2"], "overlapping and single-cell merges are dropped");
    assert.deepEqual(plain(sheet.frozen), { rows: 1, cols: 2 });
    assert.deepEqual(plain(sheet.props), { tabColor: "#ff0000", gridlines: false });
    assert.equal(sheet.rows[2].s.fill, "#eeeeee");
    assert.equal(sheet.rowIds.length, 1000);
    assert.equal(new Set(sheet.colIds).size, 26);
    const reread = Model.fromJSON(json);
    assert.deepEqual(plain(reread.sheets[0].rowIds), plain(sheet.rowIds), "ids survive a round trip");
});

test("styles are sanitized before they can become css", () => {
    const style = Model.sanitizeStyle({
        font: "Arial; background:url(x)", size: 400, bold: true, italic: "yes", color: "red", fill: "url(evil)", align: "middle", valign: "middle",
        nf: "0.00", indent: 3, border: { top: "thin #000", left: "fat", bottom: "double expression(x)", right: "thick" }, wrap: true, underline: true, strike: true
    });
    assert.deepEqual(plain(style), { bold: true, underline: true, strike: true, wrap: true, color: "red", valign: "middle", nf: "0.00", indent: 3, border: { top: "thin #000", right: "thick" } });
    assert.equal(Model.sanitizeStyle({ nope: 1 }), null);
    assert.equal(Model.sanitizeStyle(null), null);
    assert.ok(Model.isColor("rgb(1, 2, 3)"));
    assert.ok(Model.isColor("rgba(1,2,3,0.5)"));
    assert.ok(!Model.isColor("rgb(1,2)"));
    assert.equal(Model.parseBorder("dashed #00f").style, "dashed");
    assert.equal(Model.parseBorder(5), null);
});

test("cells are normalized to the fields that carry information", () => {
    assert.equal(Model.normalizeCell(null), null);
    assert.equal(Model.normalizeCell({ v: "" }), null);
    assert.equal(Model.normalizeCell({ v: NaN }), null);
    assert.deepEqual(plain(Model.normalizeCell({ f: "=1", v: 3 })), { f: "=1" });
    assert.deepEqual(plain(Model.normalizeCell({ f: "=", v: 3 })), { v: 3 });
    assert.deepEqual(plain(Model.normalizeCell({ v: { a: 1 } })), null, "objects need a type");
    assert.deepEqual(plain(Model.normalizeCell({ v: { href: "x" }, t: "link" })), { v: { href: "x" }, t: "link" });
    assert.deepEqual(plain(Model.normalizeCell({ v: true, t: "Bad Type", st: "good", c: "note", m: { a: 1 } })), { v: true, st: "good", c: { text: "note" }, m: { a: 1 } });
    assert.deepEqual(plain(Model.readComment({ text: "x", author: "A", time: "2026-01-01" })), { text: "x", author: "A", time: "2026-01-01" });
    assert.equal(Model.readComment({ text: " " }), null);
    assert.equal(Model.readComment(""), null);
    assert.ok(Model.sameCell({ v: 1, s: { bold: true } }, { s: { bold: true }, v: 1 }));
    assert.ok(!Model.sameCell({ v: 1 }, null));
});

test("setting cells is inverted exactly and logs only real changes", () => {
    const model = Model.fromJSON({ sheets: [{ name: "S", cells: { A1: 1 } }] });
    const id = model.sheets[0].id;
    const result = roundTrip(model, { type: "set", sheet: id, cells: [{ row: 0, col: 0, cell: { v: 2 } }, { row: 1, col: 1, cell: { v: "x" } }, { row: 2, col: 2, cell: null }] });
    assert.equal(result.changes.cells.length, 2);
    assert.throws(() => model.apply({ type: "set", sheet: id, cells: [{ row: 5000, col: 0, cell: { v: 1 } }] }), { name: "RangeError" });
    assert.throws(() => model.apply({ type: "set", sheet: "nope", cells: [] }), { name: "RangeError" });
    assert.throws(() => model.apply({ type: "unknown" }), { name: "TypeError" });
    const same = model.apply({ type: "set", sheet: id, cells: [{ row: 0, col: 0, cell: { v: 2 } }] });
    assert.equal(same.changes.cells.length, 0, "an unchanged cell is not logged");
});

test("row and column properties are replaced and inverted", () => {
    const model = Model.fromJSON(null);
    const id = model.sheets[0].id;
    roundTrip(model, { type: "axis", sheet: id, axis: "col", entries: [{ index: 1, props: { size: 150 } }, { index: 2, props: { hidden: true, s: { bold: true } } }] });
    roundTrip(model, { type: "axis", sheet: id, axis: "row", entries: [{ index: 0, props: null }] });
    assert.throws(() => model.apply({ type: "axis", sheet: id, axis: "row", entries: [{ index: -1, props: {} }] }), { name: "RangeError" });
});

test("inserting rows moves references, names, merges and frozen panes along", () => {
    const model = Model.fromJSON({
        sheets: [
            { name: "S", cells: { A1: 1, A2: 2, A3: 3, B1: { f: "=SUM(A1:A3)" }, B2: { f: "=A3*2" }, B3: { f: "=$A$1+A:A" } }, merges: ["C2:D3"], frozen: { rows: 2 } },
            { name: "T", cells: { A1: { f: "=S!A2+S!A1" } } }
        ],
        names: { Data: "S!$A$2:$A$3" }
    });
    const [s, t] = model.sheets;
    model.ensureIds(s);
    const result = roundTrip(model, { type: "insertRows", sheet: s.id, index: 1, count: 2 });
    assert.equal(s.getCell(0, 1).f, "=SUM(A1:A5)", "an insertion inside a range widens it");
    assert.equal(s.getCell(3, 1).f, "=A5*2");
    assert.equal(s.getCell(4, 1).f, "=$A$1+A:A");
    assert.equal(t.getCell(0, 0).f, "=S!A4+S!A1", "references from other sheets move as well");
    assert.equal(model.names.Data, "S!$A$4:$A$5");
    assert.deepEqual(plain(s.merges), [{ r1: 3, c1: 2, r2: 4, c2: 3 }]);
    assert.equal(s.frozenRows, 4);
    assert.equal(s.rowIds.length, s.rowCount);
    assert.equal(result.changes.structure[0].ids.length, 2);
    assert.throws(() => model.apply({ type: "insertRows", sheet: s.id, index: -1, count: 1 }), { name: "RangeError" });
});

test("deleting rows turns references into #REF! and narrows ranges, and undo restores them", () => {
    const model = Model.fromJSON({
        sheets: [{ name: "S", cells: { A1: 1, A2: 2, A3: 3, A4: 4, B1: { f: "=SUM(A1:A4)" }, B5: { f: "=A2" }, B6: { f: "=A3+A4" }, C2: "gone" }, merges: ["D2:E2", "D4:E5"], frozen: { rows: 3 } }],
        names: { Two: "S!A2", Range: "S!A2:A4" }
    });
    const s = model.sheets[0];
    roundTrip(model, { type: "deleteRows", sheet: s.id, index: 1, count: 2 });
    assert.equal(s.getCell(0, 1).f, "=SUM(A1:A2)");
    assert.equal(s.getCell(2, 1).f, "=#REF!");
    assert.equal(s.getCell(3, 1).f, "=#REF!+A2");
    assert.equal(s.getCell(1, 2), null, "the cells of deleted rows are gone");
    assert.deepEqual(plain(model.names), { Range: "S!A2:A2" }, "a name of a deleted range is dropped");
    assert.deepEqual(plain(s.merges), [{ r1: 1, c1: 3, r2: 2, c2: 4 }]);
    assert.equal(s.frozenRows, 1);
    assert.throws(() => model.apply({ type: "deleteRows", sheet: s.id, index: 0, count: s.rowCount }), { name: "RangeError" }, "a sheet keeps one row");
});

test("inserting and deleting columns is inverted exactly", () => {
    const model = Model.fromJSON({ sheets: [{ name: "S", cells: { A1: 1, B1: 2, C1: 3, D1: { f: "=A1+B1+C1" }, D2: { f: "=SUM(1:1)" } }, cols: { 1: { size: 80 } }, frozen: { cols: 2 } }] });
    const s = model.sheets[0];
    roundTrip(model, { type: "insertCols", sheet: s.id, index: 1, count: 1 });
    assert.equal(s.getCell(0, 4).f, "=A1+C1+D1");
    assert.equal(s.getCell(1, 4).f, "=SUM(1:1)", "whole rows are not affected by columns");
    assert.equal(s.colProps[2].size, 80);
    assert.equal(s.frozenCols, 3);
    roundTrip(model, { type: "deleteCols", sheet: s.id, index: 1, count: 2 });
    assert.equal(s.getCell(0, 2).f, "=A1+#REF!+B1");
    assert.equal(s.colCount, 25);
});

test("sheets are added, renamed, moved and removed with their references", () => {
    const model = Model.fromJSON({ sheets: [{ name: "A", cells: { A1: { f: "=B!A1+'C 1'!A1" } } }, { name: "B" }, { name: "C 1" }], names: { X: "B!A1:A2" } });
    const [a, b, c] = model.sheets;
    roundTrip(model, { type: "renameSheet", sheet: b.id, name: "Bee" });
    assert.equal(a.getCell(0, 0).f, "=Bee!A1+'C 1'!A1");
    assert.equal(model.names.X, "Bee!A1:A2");
    assert.throws(() => model.apply({ type: "renameSheet", sheet: b.id, name: "a" }), { name: "RangeError" });
    assert.throws(() => model.apply({ type: "renameSheet", sheet: b.id, name: "x/y" }), { name: "RangeError" });
    roundTrip(model, { type: "moveSheet", sheet: c.id, index: 0 });
    assert.equal(model.sheets[0], c);
    roundTrip(model, { type: "removeSheet", sheet: b.id });
    assert.equal(a.getCell(0, 0).f, "=#REF!+'C 1'!A1");
    assert.deepEqual(plain(model.names), {});
    roundTrip(model, { type: "addSheet", sheet: { name: "New", data: [[1]] }, index: 1 });
    assert.equal(model.sheets[1].name, "New");
    assert.throws(() => model.apply({ type: "addSheet", sheet: { name: "A" } }), { name: "RangeError" });
    roundTrip(model, { type: "sheetProps", sheet: a.id, props: { tabColor: "#00ff00" } });
    model.apply({ type: "removeSheet", sheet: model.sheets[1].id });
    model.apply({ type: "removeSheet", sheet: model.sheets[1].id });
    assert.throws(() => model.apply({ type: "removeSheet", sheet: model.sheets[0].id }), { name: "RangeError" }, "the last sheet stays");
});

test("merges, panes, names, styles and metadata are replaced as a whole", () => {
    const model = Model.fromJSON(null);
    const id = model.sheets[0].id;
    roundTrip(model, { type: "merges", sheet: id, merges: [{ r1: 0, c1: 0, r2: 1, c2: 1 }, "C1:D1"] });
    roundTrip(model, { type: "freeze", sheet: id, rows: 2, cols: 1 });
    roundTrip(model, { type: "names", value: { N: "Sheet1!A1" } });
    roundTrip(model, { type: "styles", value: { s: { bold: true } } });
    roundTrip(model, { type: "meta", value: { a: 1 } });
    roundTrip(model, { type: "batch", ops: [{ type: "freeze", sheet: id, rows: 0, cols: 0 }, { type: "meta", value: [] }] });
});

test("spans move like the common spreadsheets move them", () => {
    assert.deepEqual(plain(Model.shiftSpan(2, 5, 3, 2)), [2, 7]);
    assert.deepEqual(plain(Model.shiftSpan(2, 5, 2, 2)), [4, 7]);
    assert.deepEqual(plain(Model.shiftSpan(2, 5, 6, 2)), [2, 5]);
    assert.deepEqual(plain(Model.shiftSpan(2, 5, 0, -1)), [1, 4]);
    assert.deepEqual(plain(Model.shiftSpan(2, 5, 3, -2)), [2, 3]);
    assert.deepEqual(plain(Model.shiftSpan(2, 5, 1, -3)), [1, 2]);
    assert.equal(Model.shiftSpan(2, 3, 2, -2), null);
    assert.deepEqual(plain(Model.shiftSpan(2, 5, 8, -2)), [2, 5]);
});

test("the effective style layers column, row, template and cell", () => {
    const model = Model.fromJSON({ sheets: [{ cols: { 0: { s: { bold: true, border: { top: "thin" } } } }, rows: { 0: { s: { italic: true } } }, cells: { A1: { v: 1, st: "t", s: { color: "#ff0000", border: { left: "thin" } } }, B2: 2 } }], styles: { t: { fill: "#00ff00" } } });
    const sheet = model.sheets[0];
    assert.deepEqual(plain(Model.effectiveStyle(model, sheet, 0, 0)), { bold: true, border: { top: "thin", left: "thin" }, italic: true, fill: "#00ff00", color: "#ff0000" });
    assert.deepEqual(plain(Model.effectiveStyle(model, sheet, 1, 1)), {});
});

test("the sheet keeps sparse rows short and reports its used range", () => {
    const sheet = new Sheet({ id: "s", name: "S", rowCount: 10, colCount: 10 });
    assert.equal(sheet.usedRange(), null);
    sheet.setCell(2, 3, { v: 1 });
    sheet.setCell(5, 1, { v: 2 });
    assert.deepEqual(plain(sheet.usedRange()), { r1: 2, c1: 1, r2: 5, c2: 3 });
    sheet.setCell(2, 3, null);
    assert.equal(sheet.rows[2], undefined);
    sheet.setCell(9, 9, null);
    const seen = [];
    sheet.forEachCell((cell, row, col) => seen.push([row, col]));
    assert.deepEqual(plain(seen), [[5, 1]]);
});

test("names and sheet names are validated", () => {
    const model = Model.fromJSON(null);
    assert.ok(Model.isValidName("Revenue_2026"));
    assert.ok(!Model.isValidName("B2"));
    assert.ok(!Model.isValidName("TRUE"));
    assert.ok(!Model.isValidName("R1C1"));
    assert.ok(!model.isValidSheetName("'quoted'"));
    assert.ok(!model.isValidSheetName(""));
    assert.equal(model.freeSheetName("Sheet1"), "Sheet1 (2)");
    assert.equal(model.freeSheetName("Fresh"), "Fresh");
    assert.equal(model.uniqueSheetName("Sheet"), "Sheet2");
    model.idTag = "ab";
    assert.match(model.newId("r"), /^r[0-9a-z]+-ab$/);
});
