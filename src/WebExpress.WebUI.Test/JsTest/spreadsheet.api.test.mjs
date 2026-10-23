/**
 * Tests of the public api of SpreadsheetCtrl: sheets, cells, ranges, formats, names,
 * structure, sorting, filling, moving, finding, commands, events, loading and saving.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadSpreadsheet, createSpreadsheet, plain, settle } from "./spreadsheet.fixture.mjs";

/**
 * Creates a spreadsheet.
 * @param {object} [workbook] - The workbook.
 * @param {object} [attributes] - Host attributes.
 * @param {object} [options] - Runtime options.
 * @returns {object} The runtime, host and control.
 */
function setup(workbook = { sheets: [{ name: "S", rowCount: 50, colCount: 10, data: [["Name", "Qty", "Price"], ["Pen", 3, 1.5], ["Ink", 1, 4], ["Pad", 2, 2.5]] }] }, attributes = { "data-locale": "en" }, options = {}) {
    const rt = loadSpreadsheet(options);
    const { host, ctrl } = createSpreadsheet(rt, workbook, attributes);
    return { rt, host, ctrl };
}

test("sheets are added, renamed, copied, moved, colored and removed", () => {
    const { rt, host, ctrl } = setup();
    const events = [];
    for (const name of ["SPREADSHEET_SHEET_CREATED_EVENT", "SPREADSHEET_SHEET_DELETED_EVENT", "SPREADSHEET_SHEET_RENAMED_EVENT", "SPREADSHEET_SHEET_MOVED_EVENT", "SPREADSHEET_SHEET_ACTIVATED_EVENT"]) {
        host.addEventListener(rt.wx.Event[name], e => events.push([name.replace("SPREADSHEET_SHEET_", "").replace("_EVENT", ""), e.detail.sheet]));
    }
    const id = ctrl.addSheet();
    assert.equal(ctrl.activeSheet, "Sheet2");
    assert.equal(ctrl.getSheet(id).index, 1);
    ctrl.addSheet("Data", { index: 0, rows: 5, cols: 3, data: [[1, 2]], activate: false });
    assert.deepEqual(plain(ctrl.sheets.map(s => s.name)), ["Data", "S", "Sheet2"]);
    assert.equal(ctrl.getSheet("Data").rowCount, 5);
    assert.equal(ctrl.addSheet("data"), ctrl.getSheet("data (2)").id, "a taken name is numbered");
    assert.ok(ctrl.renameSheet("Sheet2", "Report"));
    assert.equal(ctrl.renameSheet("Report", "Data"), false);
    assert.equal(ctrl.renameSheet("missing", "x"), false);
    const copy = ctrl.copySheet("S");
    assert.equal(ctrl.getSheet(copy).name, "S (2)");
    assert.equal(ctrl.getValue("A2", copy), "Pen");
    assert.ok(ctrl.moveSheet("Report", 0));
    assert.equal(ctrl.moveSheet("missing", 0), false);
    assert.ok(ctrl.setSheetColor("Report", "#ff0000"));
    assert.equal(ctrl.getSheet("Report").index, 0);
    assert.ok(ctrl.setSheetColor("Report", null));
    assert.equal(ctrl.setSheetColor("missing", "#000"), false);
    ctrl.activeSheet = "Report";
    assert.ok(ctrl.removeSheet("Report"), "the active sheet can be removed");
    assert.notEqual(ctrl.activeSheet, "Report");
    for (const sheet of ctrl.sheets.slice(1)) ctrl.removeSheet(sheet.id);
    assert.equal(ctrl.removeSheet(ctrl.sheets[0].id), false, "the last sheet stays");
    assert.equal(ctrl.activateSheet("missing"), false);
    assert.equal(ctrl.getSheet("missing"), null);
    const kinds = new Set(events.map(e => e[0]));
    for (const kind of ["CREATED", "DELETED", "RENAMED", "MOVED", "ACTIVATED"]) assert.ok(kinds.has(kind), kind);
});

test("cells are read and written in every form the api accepts", () => {
    const { rt, host, ctrl } = setup();
    let changed = null, formulas = null, calculated = null;
    host.addEventListener(rt.wx.Event.SPREADSHEET_CELL_CHANGED_EVENT, e => { changed = e.detail; });
    host.addEventListener(rt.wx.Event.SPREADSHEET_FORMULA_CHANGED_EVENT, e => { formulas = e.detail; });
    host.addEventListener(rt.wx.Event.SPREADSHEET_CALCULATED_EVENT, e => { calculated = e.detail; });
    ctrl.setFormula("D2", "B2*C2");
    assert.equal(formulas.cells[0].after, "=B2*C2");
    assert.equal(changed.cells[0].ref, "D2");
    assert.equal(changed.cells[0].value, 4.5);
    ctrl.setValue({ row: 1, col: 1 }, 4);
    assert.equal(calculated.cells[0].ref, "D2");
    assert.equal(calculated.cells[0].value, 6);
    assert.equal(ctrl.getValue("D2"), 6);
    assert.equal(ctrl.getFormula("D2"), "=B2*C2");
    assert.equal(ctrl.getFormula("A1"), null);
    const cell = ctrl.getCell("D2");
    assert.equal(cell.display, "6");
    assert.equal(cell.type, "number");
    assert.equal(ctrl.getCell("J1").type, "empty");
    ctrl.setValue("E1", "=1/0");
    assert.equal(ctrl.getCell("E1").type, "error");
    assert.equal(ctrl.getValue("E1"), "#DIV/0!");
    ctrl.setValue("E2", "=1+1", { raw: true });
    assert.equal(ctrl.getValue("E2"), "=1+1", "a raw string stays text");
    ctrl.setValue("E3", new Date(2026, 9, 20));
    assert.equal(ctrl.getValue("E3"), 46315);
    assert.equal(ctrl.getDisplay("E3"), "10/20/2026");
    ctrl.setValue("E4", "15%");
    assert.equal(ctrl.getDisplay("E4"), "15%");
    ctrl.setValue("E4", null);
    assert.equal(ctrl.getValue("E4"), null);
    ctrl.setCell("F1", { v: 1, s: { bold: true }, c: "note" });
    assert.equal(ctrl.getStyle("F1").bold, true);
    ctrl.setValue("F1", "");
    assert.equal(ctrl.getCell("F1").raw.s.bold, true, "clearing the value keeps the format");
    ctrl.setValue("F1", 7, { sheet: "S" });
    assert.throws(() => ctrl.getValue("not a ref"), { name: "RangeError" });
    assert.throws(() => ctrl.getValue("X!A1"), { name: "RangeError" });
    assert.throws(() => ctrl.getValue({ sheet: "X", row: 0, col: 0 }), { name: "RangeError" });
    assert.throws(() => ctrl.getValue({ row: -1, col: 0 }), { name: "RangeError" });
    assert.throws(() => ctrl.getValue(5), { name: "RangeError" });
    assert.throws(() => ctrl.getValue("A1", "Missing"), { name: "RangeError" });
});

test("ranges are read and written as rows", () => {
    const { ctrl } = setup();
    assert.deepEqual(plain(ctrl.getRange("A1:C2")), [["Name", "Qty", "Price"], ["Pen", 3, 1.5]]);
    assert.deepEqual(plain(ctrl.getRange("A:A")), [["Name"], ["Pen"], ["Ink"], ["Pad"]], "whole columns are cut at the data");
    ctrl.setRange("E1", [[1, "=E1*2"], ["x", true, "3.5"]]);
    assert.deepEqual(plain(ctrl.getRange("E1:G2")), [[1, 2, null], ["x", true, 3.5]]);
    assert.deepEqual(plain(ctrl.getRange("E1:F1", { formulas: true })), [[1, "=E1*2"]]);
    assert.deepEqual(plain(ctrl.getRange("C2:C3", { display: true })), [["1.5"], ["4"]]);
    ctrl.setRange("J49", [[1, 2, 3], [4]]);
    assert.equal(ctrl.sheet.rowCount, 50);
    assert.equal(ctrl.sheet.colCount, 12, "the sheet grows for the values");
    assert.throws(() => ctrl.setRange("A1", "x"), { name: "TypeError" });
    const empty = setup({ sheets: [{ name: "E" }] }).ctrl;
    assert.deepEqual(plain(empty.getRange("A1:B2")), [[null]]);
});

test("clearing removes contents, formats, comments or everything", () => {
    const { ctrl } = setup();
    ctrl.setCell("A1", { v: "x", s: { bold: true }, c: "note" });
    ctrl.clear("A1", "formats");
    assert.deepEqual(plain(ctrl.getCell("A1").raw), { v: "x", c: { text: "note" } });
    ctrl.clear("A1", "comments");
    assert.deepEqual(plain(ctrl.getCell("A1").raw), { v: "x" });
    ctrl.setStyle("B2", { italic: true });
    ctrl.clear("B2");
    assert.deepEqual(plain(ctrl.getCell("B2").raw), { s: { italic: true } });
    ctrl.select(["C2:C3", "A4"]);
    ctrl.clear(null, "all");
    assert.equal(ctrl.getValue("C3"), null);
    assert.equal(ctrl.getValue("A4"), null);
    assert.equal(ctrl.clear("H40"), false);
});

test("comments and cell types are set and removed", () => {
    const { ctrl } = setup(undefined, { "data-user-name": "Ann" });
    ctrl.setComment("A2", "Check");
    assert.equal(ctrl.getComment("A2").author, "Ann");
    ctrl.setComment("A2", "By Bob", { author: "Bob" });
    assert.equal(ctrl.getComment("A2").author, "Bob");
    ctrl.setComment("A2", "");
    assert.equal(ctrl.getComment("A2"), null);
    ctrl.setRange("H1", [["yes"], [""], ["https://example.com"]]);
    ctrl.setType("H1:H2", "checkbox");
    assert.equal(ctrl.getValue("H1"), true);
    assert.equal(ctrl.getValue("H2"), false, "an empty checkbox is unchecked for formulas");
    ctrl.setType("H3", "link");
    assert.equal(ctrl.getCell("H3").raw.v.href, "https://example.com");
    ctrl.setType("H1", "list", { options: ["a", "b"] });
    assert.deepEqual(plain(ctrl.getCell("H1").meta), { options: ["a", "b"] });
    ctrl.setType("H1", null);
    assert.equal(ctrl.getCell("H1").raw.t, undefined);
    assert.throws(() => ctrl.setType("H1", "unknown"), { name: "RangeError" });
    ctrl.setType("H4", "list", { options: ["a"] });
    assert.throws(() => ctrl.setValue("H4", "z"), { name: "RangeError" });
});

test("formats are set on cells, whole columns and rows, with borders and templates", () => {
    const { ctrl } = setup();
    ctrl.setStyle("A1:C1", { bold: true, fill: "#ffff00" });
    assert.deepEqual(plain(ctrl.getStyle("B1")), { bold: true, fill: "#ffff00" });
    ctrl.setStyle("A1", { bold: null, border: { top: "thin" } });
    ctrl.setStyle("A1", { border: { top: null, left: "thick #ff0000" } });
    assert.deepEqual(plain(ctrl.getStyle("A1")), { fill: "#ffff00", border: { left: "thick #ff0000" } });
    ctrl.setStyle("A1", { border: { left: null } });
    assert.equal(ctrl.getStyle("A1").border, undefined);
    ctrl.setStyle("D:D", { italic: true });
    assert.equal(ctrl.sheet.colProps[3].s.italic, true, "a whole column keeps its style on the axis");
    assert.equal(ctrl.getStyle("D40").italic, true);
    ctrl.setStyle("5:5", { color: "#0000ff" });
    assert.equal(ctrl.getStyle("J5").color, "#0000ff");
    ctrl.setNumberFormat("C2:C4", "#,##0.00");
    assert.equal(ctrl.getDisplay("C3"), "4.00");
    ctrl.setNumberFormat("C2:C4", null);
    assert.equal(ctrl.getDisplay("C3"), "4");
    for (const kind of ["all", "outer", "inner", "top", "bottom", "left", "right"]) ctrl.setBorder("A2:B3", kind, "thin #000000");
    assert.deepEqual(plain(ctrl.getStyle("A2").border), { top: "thin #000000", right: "thin #000000", bottom: "thin #000000", left: "thin #000000" });
    ctrl.setBorder("A2:B3", "none");
    assert.equal(ctrl.getStyle("A2").border, undefined);
    ctrl.setBorder("F:F", "outer", "medium");
    assert.equal(ctrl.sheet.colProps[5].s.border.left, "medium");
    ctrl.applyCellStyle("A2:A3", "good");
    assert.equal(ctrl.getStyle("A2").fill, "#c6efce");
    assert.equal(ctrl.model.styles.good.color, "#006100", "the template travels with the workbook");
    ctrl.applyCellStyle("A2", null);
    assert.equal(ctrl.getStyle("A2").fill, undefined);
    assert.throws(() => ctrl.applyCellStyle("A2", "no such style"), { name: "RangeError" });
    ctrl.defineStyle("own", { bold: true });
    ctrl.applyCellStyle("A3", "own");
    assert.equal(ctrl.getStyle("A3").bold, true);
    ctrl.defineStyle("own", null);
    assert.equal(ctrl.model.styles.own, undefined);
    ctrl.select("A1");
    assert.ok(ctrl.toggleStyle("strike"));
    assert.ok(ctrl.queryCommandState("strike"));
});

test("cells are merged with their top-left value and unmerged", () => {
    const { ctrl } = setup();
    assert.ok(ctrl.merge("A2:B3", { center: true }));
    assert.equal(ctrl.getValue("A2"), "Pen");
    assert.equal(ctrl.getValue("B2"), null, "the other values are dropped");
    assert.equal(ctrl.getStyle("A2").align, "center");
    assert.equal(ctrl.merge("C1"), false);
    ctrl.merge("A3:C4");
    assert.deepEqual(plain(ctrl.sheet.merges), [{ r1: 2, c1: 0, r2: 3, c2: 2 }], "overlapping merges are dissolved");
    assert.ok(ctrl.unmerge("B4"));
    assert.equal(ctrl.unmerge("B4"), false);
    ctrl.select("A1:B1");
    ctrl.execCommand("merge");
    assert.ok(ctrl.queryCommandState("merge"));
    ctrl.execCommand("merge");
    assert.equal(ctrl.queryCommandState("merge"), false, "merging a merged range unmerges it");
    ctrl.execCommand("merge", "cells");
    ctrl.execCommand("unmerge");
});

test("named ranges are defined, used and removed", () => {
    const { ctrl } = setup();
    ctrl.defineName("Qty", "B2:B4");
    assert.equal(ctrl.names.Qty, "S!B2:B4");
    ctrl.defineName("Price", "=S!C2:C4");
    ctrl.setFormula("E1", "SUM(Qty)");
    assert.equal(ctrl.getValue("E1"), 6);
    assert.deepEqual(plain(ctrl.getRange("Qty")), [[3], [1], [2]]);
    assert.ok(ctrl.removeName("Qty"));
    assert.equal(ctrl.removeName("Qty"), false);
    assert.equal(ctrl.getValue("E1"), "#NAME?");
    assert.throws(() => ctrl.defineName("A1", "B2"), { name: "RangeError" });
    assert.throws(() => ctrl.defineName("Good", "not a ref!"), { name: "RangeError" });
});

test("rows and columns are inserted, deleted, sized and hidden", () => {
    const { rt, host, ctrl } = setup();
    const events = [];
    for (const name of ["SPREADSHEET_ROW_ADDED_EVENT", "SPREADSHEET_ROW_REMOVED_EVENT", "SPREADSHEET_COLUMN_ADDED_EVENT", "SPREADSHEET_COLUMN_REMOVED_EVENT"]) host.addEventListener(rt.wx.Event[name], e => events.push([name, e.detail.index, e.detail.count]));
    ctrl.setFormula("E2", "B2*C2");
    ctrl.insertRows(1, 2);
    assert.equal(ctrl.getFormula("E4"), "=B4*C4");
    ctrl.deleteRows(1, 2);
    ctrl.insertColumns(0, 1);
    assert.equal(ctrl.getFormula("F2"), "=C2*D2");
    ctrl.deleteColumns(0);
    assert.deepEqual(plain(events.map(e => e[0].replace("SPREADSHEET_", "").replace("_EVENT", ""))), ["ROW_ADDED", "ROW_REMOVED", "COLUMN_ADDED", "COLUMN_REMOVED"]);
    assert.equal(ctrl.insertRows(0, 1, "missing"), false);
    ctrl.setColumnWidth(1, 160, 2);
    assert.equal(ctrl.sheet.colProps[2].size, 160);
    ctrl.setColumnWidth(1, null);
    assert.equal(ctrl.sheet.colProps[1], undefined);
    ctrl.setRowHeight(0, 1);
    assert.equal(ctrl.sheet.rowProps[0].size, 4, "a size has a lower bound");
    ctrl.hideRows(2, 2);
    assert.equal(ctrl.sheet.rowProps[3].hidden, true);
    ctrl.hideRows(2, 2, false);
    assert.equal(ctrl.sheet.rowProps[3], undefined);
    ctrl.hideColumns(4);
    assert.equal(ctrl._view.cols.sizeOf(4), 0);
    ctrl.freeze(1, 2);
    assert.deepEqual([ctrl.getSheet("S").frozenRows, ctrl.getSheet("S").frozenCols], [1, 2]);
});

test("ranges are sorted with their formulas", () => {
    const { ctrl } = setup();
    ctrl.setFormula("D2", "B2*C2"); ctrl.setFormula("D3", "B3*C3"); ctrl.setFormula("D4", "B4*C4");
    assert.ok(ctrl.sort("A1:D4", { column: "B", header: true }));
    assert.deepEqual(plain(ctrl.getRange("A2:A4")), [["Ink"], ["Pad"], ["Pen"]]);
    assert.equal(ctrl.getFormula("D2"), "=B2*C2", "a formula moves with its row and keeps reading it");
    assert.equal(ctrl.getValue("D2"), 4);
    assert.equal(ctrl.sort("A1:D4", { column: "B", header: true }), false, "an ordered range stays");
    ctrl.sort("A1:D4", { column: 0, header: true, descending: true });
    assert.deepEqual(plain(ctrl.getRange("A2:A4")), [["Pen"], ["Pad"], ["Ink"]]);
    ctrl.select("A3");
    ctrl.execCommand("sortasc");
    assert.equal(ctrl.getValue("A1"), "Ink", "a single cell sorts its data region by its column");
    ctrl.setValue("A6", "=1/0");
    ctrl.sort("A1:A6");
    const empty = setup({ sheets: [{ name: "E" }] }).ctrl;
    assert.equal(empty.sort("A1:A3"), false);
    assert.equal(ctrl.sort("A1:A1"), false);
});

test("filling continues numbers, dates, counted texts, names and formulas", () => {
    const { ctrl } = setup({ sheets: [{ name: "S", rowCount: 30, colCount: 12 }] }, { "data-locale": "en" });
    ctrl.setRange("A1", [[1, "Item 1", "Monday", "Jan", "x", "=A1*2", 5, "Q01", 46315]]);
    ctrl.setRange("A2", [[3, "Item 3", "Wednesday", "Mar", "y", "=A2*2", null, "Q02", 46316]]);
    ctrl.setNumberFormat("I1:I2", "yyyy-mm-dd");
    ctrl.autoFill("A1:I2", "A1:I5");
    assert.deepEqual(plain(ctrl.getRange("A3:I5")), [
        [5, "Item 5", "Friday", "May", "x", 10, 5, "Q03", 46317],
        [7, "Item 7", "Sunday", "Jul", "y", 14, null, "Q04", 46318],
        [9, "Item 9", "Tuesday", "Sep", "x", 18, 5, "Q05", 46319]
    ]);
    assert.equal(ctrl.getFormula("F5"), "=A5*2");
    assert.equal(ctrl.getDisplay("I5"), "2026-10-24", "the format is filled along");
    ctrl.setValue("K1", 7);
    ctrl.autoFill("K1", "K1:K3");
    assert.deepEqual(plain(ctrl.getRange("K1:K3")), [[7], [7], [7]], "a single number repeats");
    ctrl.setRange("A10", [[1, 2]]);
    ctrl.autoFill("A10:B10", "A10:E10");
    assert.deepEqual(plain(ctrl.getRange("C10:E10")), [[3, 4, 5]], "rows fill to the right");
    ctrl.autoFill("C10:E10", "A10:E10");
    assert.deepEqual(plain(ctrl.getRange("A10:B10")), [[1, 2]], "a fill to the left continues backwards");
    ctrl.setRange("A20", [["MONDAY"]]);
    ctrl.autoFill("A20", "A20:A21");
    assert.equal(ctrl.getValue("A21"), "TUESDAY", "the case of names is kept");
    ctrl.setRange("A25", [[1], [2]]);
    ctrl.autoFill("A25:A26", "A24:A26");
    assert.equal(ctrl.getValue("A24"), 0, "a fill upwards continues backwards");
    ctrl.autoFill("A1:A2", "A1:A2");
    assert.equal(ctrl.autoFill("A1", "A1"), false);
    ctrl.autoFill("A1:A2", "A1:A4", { copy: true });
    assert.deepEqual(plain(ctrl.getRange("A3:A4")), [[1], [3]], "copying repeats");
    ctrl.setRange("L1", [["a1.5"], ["a2"]]);
    ctrl.autoFill("L1:L2", "L1:L3");
});

test("moving formulas across sheets preserves their original references and undo", () => {
    const { ctrl } = setup({ sheets: [
        { name: "S", data: [[10, "=A1", "=B1"], [null, "=$B$1+A1"], [null, "=SUM(A:A)"], [null, "=SUM(1:1)"]] },
        { name: "Target sheet", data: [[99, "=A1", null, "=S!B2"]] }
    ] });
    const before = ctrl.value;

    assert.ok(ctrl.moveRange("S!B1:B4", "'Target sheet'!C3"));
    assert.equal(ctrl.getFormula("C3"), "=S!A1");
    assert.equal(ctrl.getValue("C3"), 10);
    assert.equal(ctrl.getFormula("C4"), "='Target sheet'!$C$3+S!A1");
    assert.equal(ctrl.getValue("C4"), 20);
    assert.equal(ctrl.getFormula("C5"), "=SUM(S!A:A)");
    assert.equal(ctrl.getFormula("C6"), "=SUM(S!1:1)");
    assert.equal(ctrl.getFormula("S!C1"), "='Target sheet'!C3");
    assert.equal(ctrl.getFormula("D1"), "='Target sheet'!C4");
    assert.equal(ctrl.getFormula("B1"), "=A1", "existing target formulas keep their home sheet");
    const after = ctrl.value;
    assert.ok(ctrl.undo());
    assert.equal(ctrl.value, before);
    assert.equal(ctrl.canUndo(), false, "the entire move is one undo step");
    assert.ok(ctrl.redo());
    assert.equal(ctrl.value, after);
    ctrl.destroy();
});

test("moving named ranges follows their cells on the same sheet and across sheets", () => {
    for (const target of ["S!A3", "'Target sheet'!A3"]) {
        const { ctrl } = setup({ sheets: [
            { name: "S", data: [[10, "=Amount"], [20, "=SUM(Total)"]] },
            { name: "Target sheet" }
        ], names: { Amount: "S!$A$1", Total: "S!$A$1:$A$2", Other: "S!B1" } });
        const before = ctrl.value;
        assert.ok(ctrl.moveRange("S!A1:A2", target));
        const prefix = target.slice(0, target.indexOf("!") + 1);
        assert.deepEqual(plain(ctrl.names), { Amount: prefix + "$A$3", Total: prefix + "$A$3:$A$4", Other: "S!B1" });
        assert.equal(ctrl.getValue("S!B1"), 10);
        assert.equal(ctrl.getValue("S!B2"), 30);
        const after = ctrl.value;
        assert.ok(ctrl.undo());
        assert.equal(ctrl.value, before);
        assert.equal(ctrl.canUndo(), false);
        assert.ok(ctrl.redo());
        assert.equal(ctrl.value, after);
        ctrl.destroy();
    }
});

test("refused pastes and moves leave cells, dimensions and history unchanged", () => {
    const { rt, host, ctrl } = setup({ sheets: [{ name: "S", rowCount: 2, colCount: 16384, cells: { A1: 10, B1: 20, XFD2: "keep" } }] });
    const before = ctrl.value;
    let changes = 0;
    host.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, () => changes++);

    assert.equal(ctrl.pasteData({ text: "x\ty\nz\tw" }, { target: "XFD2" }), false);
    assert.equal(ctrl.value, before, "a refused paste must not grow the other axis or overwrite a cell");
    assert.equal(ctrl.moveRange("A1:B1", "XFD2"), false);
    assert.equal(ctrl.value, before, "a refused move must not clear its source or destination");
    assert.equal(ctrl.canUndo(), false);
    assert.equal(changes, 0);
    ctrl.destroy();
});

test("moving a range carries its content and re-aims references", () => {
    const { ctrl } = setup({ sheets: [{ name: "S", data: [[1, 2], ["=A1+B1"]], merges: ["A1:B1"] }, { name: "T" }] });
    ctrl.unmerge("A1");
    ctrl.merge("C1:D1");
    ctrl.setValue("C1", "m");
    assert.ok(ctrl.moveRange("A1:D1", "A10"));
    assert.equal(ctrl.getFormula("A2"), "=A10+B10");
    assert.ok(ctrl.sheet.merges.some(m => m.r1 === 9 && m.c1 === 2));
    assert.equal(ctrl.moveRange("A10", "A10"), false);
    assert.ok(ctrl.moveRange("A10:B10", "T!B2"));
    assert.equal(ctrl.activeSheet, "T");
    assert.equal(ctrl.getValue("B2"), 1);
    assert.equal(ctrl.getFormula("A2", "S"), "=T!B2+T!C2");
});

test("text is found and replaced in values and formulas", () => {
    const { ctrl } = setup();
    ctrl.addSheet("Other", { data: [["pen pal"]], activate: false });
    ctrl.setFormula("D2", "C2*2");
    assert.deepEqual(plain(ctrl.find("pen").map(m => m.ref)), ["A2"]);
    assert.deepEqual(plain(ctrl.find("Pen", { matchCase: true, allSheets: true }).map(m => m.sheet + "!" + m.ref)), ["S!A2"]);
    assert.deepEqual(plain(ctrl.find("pen", { allSheets: true }).map(m => m.sheet)), ["S", "Other"]);
    assert.deepEqual(plain(ctrl.find("p[ae]", { regex: true }).map(m => m.ref)), ["A2", "A4"]);
    assert.deepEqual(plain(ctrl.find("ink", { wholeCell: true }).map(m => m.ref)), ["A3"]);
    assert.deepEqual(plain(ctrl.find("C2", { formulas: true }).map(m => m.ref)), ["D2"]);
    assert.deepEqual(plain(ctrl.find("")), []);
    ctrl.select("A1");
    assert.equal(ctrl.findNext("p[ae]", { regex: true }).ref, "A2");
    assert.equal(ctrl.findNext("p[ae]", { regex: true }).ref, "A4");
    assert.equal(ctrl.findNext("p[ae]", { regex: true }).ref, "A2", "the search wraps around");
    assert.equal(ctrl.findNext("p[ae]", { regex: true, backwards: true }).ref, "A4");
    assert.equal(ctrl.findNext("zzz"), null);
    ctrl.select("A2");
    assert.equal(ctrl.replace("Pen", "Pencil"), 1);
    assert.equal(ctrl.getValue("A2"), "Pencil");
    assert.equal(ctrl.replace("C2", "C3", { all: true }), 1);
    assert.equal(ctrl.getFormula("D2"), "=C3*2");
    assert.equal(ctrl.replace("p", "P", { all: true, wholeCell: true }), 0);
    assert.equal(ctrl.replace("1.5", "2", { all: true }), 1, "numbers are replaced in their edit text");
    assert.equal(ctrl.replace("nothing", "x", { all: true }), 0);
    assert.equal(ctrl.replace("ad", "ad", { all: true }), 0);
});

test("the find bar finds, replaces and closes", () => {
    const { ctrl } = setup();
    ctrl.execCommand("replace");
    const bar = ctrl._element.querySelector(".wx-spreadsheet-find");
    const [query, replacement] = bar.querySelectorAll("input[type=text]");
    query.value = "pe";
    query.dispatchEvent({ type: "keydown", key: "Enter", shiftKey: false, preventDefault() { } });
    assert.equal(ctrl.selection.active, "A2");
    query.dispatchEvent({ type: "keydown", key: "Enter", shiftKey: true, preventDefault() { } });
    replacement.value = "b";
    replacement.dispatchEvent({ type: "keydown", key: "Enter", preventDefault() { } });
    const buttons = [...bar.querySelectorAll("button")];
    buttons.find(b => b.title === "Replace all").click();
    buttons.find(b => b.title === "Next").click();
    buttons.find(b => b.title === "Previous").click();
    buttons.find(b => b.title === "Replace").click();
    assert.ok(!ctrl.getRange("A1:A4").flat().some(v => /p/.test(v)));
    for (const box of bar.querySelectorAll("input[type=checkbox]")) box.checked = true;
    query.value = "nothing";
    query.dispatchEvent({ type: "keydown", key: "Enter", preventDefault() { } });
    assert.equal(bar.querySelector(".wx-spreadsheet-find-status").textContent, "No matches");
    query.dispatchEvent({ type: "keydown", key: "Escape", preventDefault() { } });
    assert.equal(bar.hidden, true);
    ctrl.execCommand("find");
    replacement.dispatchEvent({ type: "keydown", key: "Escape", preventDefault() { } });
    ctrl.execCommand("find");
    query.value = "";
    query.dispatchEvent({ type: "keydown", key: "Enter", preventDefault() { } });
    buttons.find(b => b.title === "Close").click();
});

test("commands cover formatting, structure, numbers and view", () => {
    const { ctrl } = setup();
    ctrl.select("B2:C3");
    const commands = [
        ["font", "Arial"], ["size", "14"], ["color", "#ff0000"], ["fill", "#00ff00"], ["align", "center"], ["valign", "middle"], ["indent"], ["indent"], ["outdent"],
        ["currency"], ["percent"], ["thousands"], ["numberformat", "0.0"], ["border", "outer"], ["wrap"], ["cellstyle", "bad"], ["clearformat"],
        ["insertrowabove"], ["insertrowbelow"], ["insertcolleft"], ["insertcolright"], ["deleterow"], ["deletecol"], ["hiderow"], ["hidecol"], ["unhide"],
        ["freezerow"], ["freezecol"], ["unfreeze"], ["freeze"], ["freeze"], ["gridlines"], ["gridlines"], ["recalculate"], ["zoom", 1.25], ["selectall"], ["clearcontents"], ["clearall"], ["unknown"]
    ];
    for (const [command, value] of commands) ctrl.execCommand(command, value ?? null);
    assert.equal(ctrl.zoom, 1.25);
    ctrl.select("B2");
    ctrl.execCommand("align", "center");
    assert.equal(ctrl.queryCommandValue("align"), "center");
    ctrl.execCommand("align", "center");
    assert.equal(ctrl.queryCommandValue("align"), null, "the active alignment toggles off");
    assert.equal(ctrl.queryCommandState("alignleft"), false);
    assert.equal(ctrl.queryCommandState("valignbottom"), true);
    assert.equal(ctrl.queryCommandState("gridlines"), true);
    assert.equal(ctrl.queryCommandState("unknown"), false);
    assert.equal(ctrl.queryCommandValue("unknown"), null);
    ctrl.select("A1");
    ctrl.execCommand("freeze");
    assert.equal(ctrl.getSheet("S").frozenRows, 1, "freezing at A1 freezes the top row");
    ctrl.execCommand("addsheet", "Added");
    assert.equal(ctrl.activeSheet, "Added");
    ctrl.setValue("A1", "Text");
    ctrl.select("A1");
    assert.equal(ctrl.execCommand("decimalincrease"), false, "text has no decimals");
    ctrl.setValue("A1", 46315);
    ctrl.setNumberFormat("A1", "dd.mm.yyyy");
    assert.equal(ctrl.execCommand("decimalincrease"), false, "dates have no decimals");
});

test("AutoSum adds the numbers above, beside or below the selection", () => {
    const { ctrl } = setup();
    ctrl.select("B5");
    ctrl.execCommand("autosum");
    assert.equal(ctrl._editor.value, "=SUM(B2:B4)");
    ctrl._commitEdit();
    assert.equal(ctrl.getValue("B5"), 6);
    ctrl.select("D3");
    ctrl.execCommand("autosum", "AVERAGE");
    assert.equal(ctrl._editor.value, "=AVERAGE(B3:C3)");
    ctrl._cancelEdit();
    ctrl.select("H1");
    ctrl.execCommand("autosum", "MAX");
    assert.equal(ctrl._editor.value, "=MAX()");
    ctrl._cancelEdit();
    ctrl.select("C2:C4");
    ctrl.execCommand("autosum");
    assert.equal(ctrl.getFormula("C5"), "=SUM(C2:C4)");
    ctrl.execCommand("insertfunction", "round");
    assert.equal(ctrl._editor.value, "=ROUND(");
    ctrl._cancelEdit();
});

test("formulas are evaluated without storing them and recalculated on demand", () => {
    const { ctrl } = setup();
    assert.equal(ctrl.evaluate("SUM(B2:B4)"), 6);
    assert.equal(ctrl.evaluate("=ROW()", "C7"), 7);
    assert.equal(ctrl.evaluate("=1/0"), "#DIV/0!");
    ctrl.setFormula("H1", "RAND()");
    const first = ctrl.getValue("H1");
    assert.ok(ctrl.recalculate() >= 1);
    assert.notEqual(ctrl.getValue("H1"), first);
    rtRegister(ctrl);
});

/**
 * Registers a function after the control exists and checks it is picked up.
 * @param {object} ctrl - The control.
 */
function rtRegister(ctrl) {
    ctrl.setFormula("H2", "LATE(2)");
    assert.equal(ctrl.getValue("H2"), "#NAME?");
    const functions = ctrl.engine.functions;
    functions.register("LATE", ([x]) => x * 10);
    try {
        assert.equal(ctrl.getValue("H2"), 20, "a function registered later recalculates its users");
    } finally { functions.unregister("LATE"); }
}

test("the workbook is replaced and its baseline restored", () => {
    const { ctrl } = setup();
    const before = ctrl.value;
    ctrl.value = { sheets: [{ name: "New", data: [[1]] }] };
    assert.equal(ctrl.activeSheet, "New");
    ctrl.setWorkbook(ctrl.getWorkbook());
    assert.throws(() => ctrl.setWorkbook("[1]"), { name: "TypeError" });
    ctrl.reset();
    assert.equal(ctrl.value, before);
    assert.equal(ctrl.getWorkbook({ activeSheet: true }).activeSheet, ctrl.sheet.id);
});

test("loading and saving go through the transport and follow the contract", async () => {
    const calls = [];
    let reply = { status: 200, body: { sheets: [{ name: "Loaded", data: [[42]] }] } };
    const fetch = async (url, init) => {
        calls.push([url, init.method, init.body]);
        return { ok: reply.status < 400, status: reply.status, headers: { get: () => "application/json" }, json: async () => reply.body, text: async () => JSON.stringify(reply.body) };
    };
    const { rt, host, ctrl } = setup(null, { "data-load-uri": "/api/book", "data-save-uri": "/api/book", "data-save-method": "post", "data-locale": "en" }, { fetch });
    await settle(20);
    assert.equal(ctrl.getValue("A1"), 42, "a workbook without value loads from the load address");
    assert.equal(ctrl.dirty, false);
    const events = [];
    for (const name of ["BEFORE_SAVE_EVENT", "SAVED_EVENT", "DATA_ERROR_EVENT", "TASK_START_EVENT", "TASK_FINISH_EVENT"]) host.addEventListener(rt.wx.Event[name], () => events.push(name));
    ctrl.setValue("A1", 43);
    const saved = await ctrl.save();
    assert.equal(saved.ok, true);
    assert.equal(calls[calls.length - 1][1], "POST");
    assert.equal(JSON.parse(calls[calls.length - 1][2]).sheets[0].cells.A1.v, 43);
    assert.equal(ctrl.dirty, false);
    assert.deepEqual(plain(events), ["BEFORE_SAVE_EVENT", "TASK_START_EVENT", "TASK_FINISH_EVENT", "SAVED_EVENT"]);
    const veto = e => e.preventDefault();
    host.addEventListener(rt.wx.Event.BEFORE_SAVE_EVENT, veto);
    const vetoed = await ctrl.save();
    host.removeEventListener(rt.wx.Event.BEFORE_SAVE_EVENT, veto);
    assert.equal(vetoed.error.kind, "abort");
    reply = { status: 500, body: { message: "down" } };
    ctrl.setValue("A1", 44);
    const failed = await ctrl.save();
    assert.equal(failed.ok, false);
    assert.ok(events.includes("DATA_ERROR_EVENT"));
    assert.equal(ctrl.dirty, true, "a refused save stays dirty");
    const loadFailed = await ctrl.load();
    assert.equal(loadFailed.ok, false);
    reply = { status: 200, body: "not a workbook" };
    const parse = await ctrl.load();
    assert.equal(parse.error.kind, "parse");
    const none = setup().ctrl;
    await assert.rejects(none.save(), /no save address/);
    await assert.rejects(none.load(), /no load address/);
});

test("autosave stores a changed workbook after the delay", async () => {
    const calls = [];
    const fetch = async (url, init) => { calls.push(init.method); return { ok: true, status: 204, headers: { get: () => "" }, json: async () => null, text: async () => "" }; };
    const { ctrl } = setup(undefined, { "data-save-uri": "/save", "data-autosave": "10", "data-locale": "en" }, { fetch });
    ctrl.setValue("A1", "changed");
    await settle(60);
    assert.deepEqual(plain(calls), ["PUT"]);
});

test("selection, events and the status bar follow the selection", () => {
    const { rt, host, ctrl } = setup();
    let detail = null;
    host.addEventListener(rt.wx.Event.SPREADSHEET_SELECTION_CHANGED_EVENT, e => { detail = e.detail; });
    ctrl.select(["A1:B2", "C3"], { active: "C3" });
    assert.deepEqual(plain(detail.ranges), ["A1:B2", "C3"]);
    assert.equal(detail.active, "C3");
    ctrl.select("B2:C4");
    ctrl._renderStatus();
    return settle(60).then(() => {
        assert.equal(ctrl._aggregates.textContent, "Sum: 14 | Average: 2.333333333 | Count: 6");
        assert.equal(ctrl._mode.textContent, "Ready");
        ctrl.select("A1:A2");
        ctrl._renderStatus();
        return settle(60);
    }).then(() => {
        assert.equal(ctrl._aggregates.textContent, "Count: 2");
        ctrl.goTo("S!B3");
        assert.equal(ctrl.selection.active, "B3");
    });
});

test("the change history records local, undone and redone changes", () => {
    const { ctrl } = setup(undefined, { "data-user-name": "Ann", "data-locale": "en" });
    ctrl.setValue("A1", "x");
    ctrl.insertRows(0);
    ctrl.undo();
    ctrl.redo();
    const log = ctrl.getChangeLog();
    assert.deepEqual(plain(log.map(e => e.source)), ["user", "user", "undo", "redo"]);
    assert.equal(log[0].user.name, "Ann");
    assert.deepEqual(plain(log[1].structure), [{ type: "insertRows", sheet: ctrl.sheet.id, index: 0, count: 1 }]);
});

test("plugins are registered, ordered, extend the context menu and can be removed", () => {
    const rt = loadSpreadsheet();
    const calls = [];
    rt.wx.SpreadsheetPlugins.register("probe", 5, {
        init: (ctrl) => { calls.push("init"); return () => calls.push("cleanup"); },
        createToolbar: () => null,
        getContextMenuItems: (ctrl) => [{ label: "Probe", onClick: () => calls.push("menu") }],
        onSelectionChange: () => calls.push("selection"),
        onChange: () => calls.push("change")
    });
    rt.wx.SpreadsheetPlugins.register("bare", { init: () => null });
    const { ctrl } = createSpreadsheet(rt);
    ctrl.select("B2");
    ctrl.setValue("B2", 1);
    const items = ctrl.getContextMenuItems();
    items.find(i => i.label === "Probe").onClick(ctrl);
    ctrl.destroy();
    assert.deepEqual(plain([...new Set(calls)]), ["init", "selection", "change", "menu", "cleanup"]);
    assert.ok(rt.wx.SpreadsheetPlugins.unregister("probe"));
    assert.equal(rt.wx.SpreadsheetPlugins.unregister("probe"), false);
    assert.equal(rt.wx.SpreadsheetPlugins.register("", {}), rt.wx.SpreadsheetPlugins);
});

test("operations of plugins go through the same transaction", () => {
    const { ctrl } = setup();
    assert.ok(ctrl.applyOperation({ type: "meta", value: { owner: "plugin" } }));
    assert.equal(ctrl.model.meta.owner, "plugin");
    ctrl.undo();
    assert.equal(ctrl.model.meta.owner, undefined);
    const warn = console.warn; console.warn = () => { };
    try { assert.equal(ctrl.applyOperation({ type: "bogus" }), false); } finally { console.warn = warn; }
    assert.equal(ctrl.applyOperation({ type: "set", sheet: ctrl.sheet.id, cells: [] }), false, "an operation without effect records nothing");
});

test("the prompt dialog answers with the text or null", async () => {
    const { rt, ctrl } = setup();
    const answer = ctrl.prompt("Code", "0.00");
    const dialog = rt.document.body.querySelector(".wx-spreadsheet-prompt");
    dialog.querySelector("input").value = "0.000";
    dialog.querySelector("form").dispatchEvent({ type: "submit", preventDefault() { } });
    dialog.dispatchEvent({ type: "close" });
    assert.equal(await answer, "0.000");
    const cancelled = ctrl.prompt("Code");
    const second = rt.document.body.querySelector(".wx-spreadsheet-prompt");
    second.querySelector("button").click();
    second.dispatchEvent({ type: "close" });
    assert.equal(await cancelled, null);
});

test("the formatting toolbar applies colors and custom number formats", async () => {
    const { rt, host, ctrl } = setup();
    ctrl.select("B2");
    const picker = [...host.querySelectorAll("[aria-label]")].find(e => e.tagName === "DIV" && e.getAttribute("aria-label") === "Fill color");
    picker.dispatchEvent({ type: rt.wx.Event.CHANGE_VALUE_EVENT, detail: { value: "#ff0000" }, stopPropagation() { } });
    assert.equal(ctrl.getStyle("B2").fill, "#ff0000");
    picker.dispatchEvent({ type: rt.wx.Event.CHANGE_VALUE_EVENT, detail: { value: "" }, stopPropagation() { } });
    assert.equal(ctrl.getStyle("B2").fill, undefined);
    const custom = [...host.querySelectorAll(".dropdown-item")].find(item => item.textContent === "Custom format...");
    custom.click();
    const dialog = rt.document.body.querySelector(".wx-spreadsheet-prompt");
    dialog.querySelector("input").value = "0.000";
    dialog.querySelector("form").dispatchEvent({ type: "submit", preventDefault() { } });
    dialog.dispatchEvent({ type: "close" });
    await settle();
    assert.equal(ctrl.getStyle("B2").nf, "0.000");
    const font = [...host.querySelectorAll(".dropdown-item")].find(item => item.textContent === "Georgia");
    font.click();
    assert.equal(ctrl.getStyle("B2").font, "Georgia");
    assert.equal(host.querySelector(".wx-spreadsheet-font .wx-spreadsheet-btn-text").textContent, "Georgia");
});

test("a workbook opens on the sheet it was saved on, by name or by id", () => {
    const rt = loadSpreadsheet();
    const sheets = [{ id: "s1", name: "Q1" }, { id: "s2", name: "Summary" }];
    assert.equal(createSpreadsheet(rt, { activeSheet: "Summary", sheets }).ctrl.activeSheet, "Summary");
    assert.equal(createSpreadsheet(rt, { activeSheet: "s2", sheets }).ctrl.activeSheet, "Summary");
    assert.equal(createSpreadsheet(rt, { activeSheet: "missing", sheets }).ctrl.activeSheet, "Q1");
    assert.equal(createSpreadsheet(rt, { activeSheet: "Summary", sheets }, { "data-active-sheet": "Q1" }).ctrl.activeSheet, "Q1", "the attribute wins");
    const { ctrl } = createSpreadsheet(rt, { sheets });
    ctrl.setWorkbook({ activeSheet: "Summary", sheets: [...sheets, { id: "s3", name: "Notes" }] });
    assert.equal(ctrl.activeSheet, "Summary");
    const saved = ctrl.getWorkbook({ activeSheet: true });
    assert.equal(createSpreadsheet(rt, saved).ctrl.activeSheet, "Summary", "a round trip keeps it");
});
