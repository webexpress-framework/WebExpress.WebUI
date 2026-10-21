/**
 * Tests of the grid view: axis arithmetic, virtual rendering of what is visible, frozen panes,
 * merges, text overflow, dirty rendering, the ARIA grid, overlays, scaling of very tall sheets,
 * and the speed of large workbooks.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadSpreadsheet, createSpreadsheet, plain } from "./spreadsheet.fixture.mjs";

test("an axis computes offsets and finds indices with sizes and hidden entries", () => {
    const rt = loadSpreadsheet();
    const props = [];
    props[2] = { size: 50 }; props[5] = { hidden: true }; props[7] = { size: 24 }; props[20] = { size: 10 };
    const axis = new rt.wx.SpreadsheetAxis(10, 24, props, 2);
    assert.equal(axis.offset(0), 0);
    assert.equal(axis.offset(3), (24 + 24 + 50) * 2);
    assert.equal(axis.sizeOf(2), 100);
    assert.equal(axis.sizeOf(5), 0);
    assert.equal(axis.sizeOf(7), 48, "an entry with the default size is no override");
    assert.equal(axis.total(), (10 * 24 + 26 - 24) * 2);
    assert.equal(axis.at(0), 0);
    assert.equal(axis.at(axis.offset(4) + 1), 4);
    assert.equal(axis.at(axis.offset(6) - 1), 4, "a hidden row is never hit");
    assert.equal(axis.at(1e9), 9);
});

test("only the visible rows and columns are rendered", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", rowCount: 100000, colCount: 200 }] });
    const view = ctrl._view;
    const rows = view._rows.size;
    assert.ok(rows > 10 && rows < 40, "rows rendered: " + rows);
    const cells = view._rows.get(0).cells.size;
    assert.ok(cells > 5 && cells < 20, "cells per row: " + cells);
    assert.equal(view.viewport.getAttribute("aria-rowcount"), "100001");
    assert.equal(view.viewport.getAttribute("aria-colcount"), "201");
    view.viewport.scrollTop = 24 * 50000;
    view.render();
    assert.ok(view._rows.has(50000));
    assert.ok(view._rows.has(0), "the active cell stays rendered");
    assert.ok(!view._rows.has(100));
});

test("the grid carries the ARIA roles, indices, selection and active descendant", () => {
    const rt = loadSpreadsheet();
    const { host, ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [["a"]] }] });
    const view = ctrl._view;
    ctrl.select("B2:C3");
    const row = view._rows.get(1);
    assert.equal(row.el.getAttribute("role"), "row");
    assert.equal(row.el.getAttribute("aria-rowindex"), "3");
    assert.equal(row.header.getAttribute("role"), "rowheader");
    const cell = row.cells.get(1);
    assert.equal(cell.getAttribute("role"), "gridcell");
    assert.equal(cell.getAttribute("aria-colindex"), "3");
    assert.equal(cell.getAttribute("aria-selected"), "true");
    assert.equal(row.cells.get(0).getAttribute("aria-selected"), "false");
    assert.equal(view.viewport.getAttribute("aria-activedescendant"), host.id + "-cell-1-1");
    assert.equal(view._headers.get(1).getAttribute("role"), "columnheader");
    assert.ok(view._headers.get(1).classList.contains("wx-spreadsheet-header-active"));
    assert.ok(row.header.classList.contains("wx-spreadsheet-header-active"));
    assert.equal(view.headRow.getAttribute("aria-rowindex"), "1");
});

test("cells show formatted values, styles, borders, comments, errors and links", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", cells: {
        A1: { v: 1234.5, s: { nf: "#,##0.00", bold: true, italic: true, underline: true, strike: true, font: "Arial", size: 12, color: "#ff0000", fill: "#ffff00", align: "center", valign: "top", indent: 2, wrap: true, border: { top: "thin #000000", right: "dashed", bottom: "double", left: "thick" } } },
        B1: { f: "=1/0" },
        C1: { v: "note", c: { text: "Remember", author: "Ann" } },
        D1: { v: { text: "Docs", href: "https://example.com" }, t: "link" },
        E1: { v: true, t: "checkbox" }
    } }] }, { "data-locale": "en" });
    const row = ctrl._view._rows.get(0);
    const a1 = row.cells.get(0);
    assert.equal(a1._text.textContent, "1,234.50");
    assert.equal(a1._text.style.fontWeight, "bold");
    assert.equal(a1._text.style.textDecoration, "underline line-through");
    assert.equal(a1.style.backgroundColor, "#ffff00");
    assert.equal(a1.getAttribute("data-align"), "center");
    assert.equal(a1.getAttribute("data-valign"), "top");
    assert.ok(a1.classList.contains("wx-spreadsheet-wrap"));
    assert.equal(a1._border.style.borderTop, "1px solid #000000");
    assert.equal(a1._border.style.borderRight, "1px dashed currentColor");
    assert.equal(a1._border.style.borderBottom, "3px double currentColor");
    const b1 = row.cells.get(1);
    assert.equal(b1._text.textContent, "#DIV/0!");
    assert.ok(b1.classList.contains("wx-spreadsheet-error"));
    assert.match(b1.getAttribute("title"), /Division by zero/);
    assert.equal(row.cells.get(2).getAttribute("title"), "Ann: Remember");
    assert.ok(row.cells.get(2).classList.contains("wx-spreadsheet-commented"));
    const link = row.cells.get(3)._text.querySelector("a");
    assert.equal(link.href, "https://example.com");
    assert.equal(link.rel, "noopener noreferrer");
    assert.equal(row.cells.get(4)._text.textContent, "\u2611");
    ctrl.setStyle("A1", { border: null });
    assert.equal(a1._border, null, "a removed border removes its element");
});

test("a cell is only rewritten when what it shows changed", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [[1, 2]] }] });
    const cell = ctrl._view._rows.get(0).cells.get(0);
    const signature = cell._sig;
    let writes = 0;
    const text = cell._text;
    const original = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(text), "textContent");
    Object.defineProperty(text, "textContent", { get() { return original.get.call(this); }, set(v) { writes++; original.set.call(this, v); }, configurable: true });
    ctrl._view.render();
    assert.equal(writes, 0, "an unchanged cell is not touched");
    assert.equal(cell._sig, signature);
    ctrl.setValue("A1", 5);
    assert.ok(writes > 0);
    ctrl._view.invalidate();
    assert.equal(cell._sig, null);
});

test("text runs over empty neighbours but not over filled ones", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [["a long text that does not fit", null, null, "stop"], ["short", "next"]] }] });
    const first = ctrl._view._rows.get(0).cells.get(0);
    assert.ok(first.classList.contains("wx-spreadsheet-overflow"));
    assert.equal(first._text.style.maxWidth, "300px", "it runs over the two empty cells up to the filled one");
    assert.ok(!ctrl._view._rows.get(1).cells.get(0).classList.contains("wx-spreadsheet-overflow"));
});

test("merged cells span their range and hide the cells under them", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [["merged"]], merges: ["A1:B2"] }] });
    const view = ctrl._view;
    const anchor = view._rows.get(0).cells.get(0);
    assert.equal(anchor.style.width, "200px");
    assert.equal(anchor.style.height, "48px");
    assert.ok(anchor.classList.contains("wx-spreadsheet-merged"));
    assert.ok(!view._rows.get(0).cells.has(1));
    assert.ok(!view._rows.get(1).cells.has(0));
    view.viewport.scrollTop = 30;
    view.render();
    assert.ok(view._rows.has(0), "the anchor of a merge reaching into the view is rendered");
    assert.deepEqual(plain(view.cellRect(1, 1)), plain(view.cellRect(0, 0)));
});

test("frozen panes stay in place while the rest scrolls", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", rowCount: 500, colCount: 50, frozen: { rows: 2, cols: 1 } }] });
    const view = ctrl._view;
    view.viewport.scrollTop = 2400;
    view.viewport.scrollLeft = 1000;
    view.render();
    assert.ok(view._rows.has(0) && view._rows.has(1), "frozen rows are always rendered");
    assert.equal(view._rows.get(0).el.style.top, view.headerHeight + "px");
    assert.ok(view._rows.get(0).el.classList.contains("wx-spreadsheet-frozen-row"));
    assert.ok(view._rows.get(0).cells.get(0).classList.contains("wx-spreadsheet-frozen"));
    assert.equal(view._rows.get(0).scroll.style.transform, "translateX(-1000px)");
    assert.equal(view.colX(0), view.headerWidth);
    assert.equal(view.rowY(1), view.headerHeight + 24);
    const firstScrolled = view.rows.at(48 + 2400);
    assert.ok(view._rows.has(firstScrolled));
    const rects = view.rangeRects({ r1: 0, c1: 0, r2: 120, c2: 15 });
    assert.equal(rects.length, 4, "a range across both freeze lines is drawn in four parts");
    assert.ok(rects.every(r => r.width > 0 && r.height > 0));
    assert.deepEqual(plain(view.rangeRects({ r1: 300, c1: 40, r2: 301, c2: 41 })), [], "an invisible range draws nothing");
    const hitFrozen = view.hit(view.headerWidth + 5, view.headerHeight + 5);
    assert.deepEqual(plain([hitFrozen.area, hitFrozen.row, hitFrozen.col]), ["cell", 0, 0]);
    const hitScrolled = view.hit(view.headerWidth + 105, view.headerHeight + 50);
    assert.equal(hitScrolled.row, view.rows.at(48 + 2400 + 2));
    assert.equal(hitScrolled.col, view.cols.at(100 + 1000 + 5));
});

test("scrolling brings cells into view by the least distance", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", rowCount: 1000, colCount: 100 }] });
    const view = ctrl._view;
    ctrl.select("A500");
    assert.ok(view.viewport.scrollTop > 0);
    const top = view.viewport.scrollTop;
    ctrl.select("A499");
    assert.equal(view.viewport.scrollTop, top, "a visible cell does not scroll");
    ctrl.select("A1");
    assert.equal(view.viewport.scrollTop, 0);
    ctrl.select("CV1");
    assert.ok(view.viewport.scrollLeft > 0);
    ctrl.select("A1");
    assert.equal(view.viewport.scrollLeft, 0);
    assert.ok(view.pageRows() > 10);
    assert.ok(view.pageCols() > 3);
});

test("very tall sheets scroll proportionally below the browser limit", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", rowCount: 1048576, colCount: 5 }] });
    const view = ctrl._view;
    assert.equal(view.inner.style.height, rt.wx.SpreadsheetView.MAX_SCROLL + "px");
    ctrl.select("A1048576");
    view.render();
    assert.ok(view._rows.has(1048575));
    assert.ok(view.viewport.scrollTop < rt.wx.SpreadsheetView.MAX_SCROLL);
    assert.equal(ctrl.selection.active, "A1048576");
});

test("zoom scales the sizes and the fonts", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", cells: { A1: { v: 1, s: { size: 10 } } } }] });
    ctrl.zoom = 2;
    assert.equal(ctrl._view.cols.sizeOf(0), 200);
    assert.equal(ctrl._view._rows.get(0).cells.get(0)._text.style.fontSize, "20pt");
    assert.equal(ctrl._view.pane.style.getPropertyValue("--wx-spreadsheet-zoom"), "2");
});

test("overlays draw the copy marquee, previews, references and flashes", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [[1, 2]] }] });
    const view = ctrl._view;
    ctrl._clipboardRange = { r1: 0, c1: 0, r2: 0, c2: 1, sheet: ctrl.sheet.id };
    ctrl._preview = { r1: 2, c1: 0, r2: 3, c2: 0 };
    ctrl._formulaRefs = [{ sheetId: ctrl.sheet.id, r1: 0, c1: 0, r2: 0, c2: 0 }, { sheetId: "other", r1: 0, c1: 0, r2: 0, c2: 0 }];
    view.renderOverlay();
    assert.ok(view.overlay.querySelector(".wx-spreadsheet-marquee"));
    assert.ok(view.overlay.querySelector(".wx-spreadsheet-preview"));
    assert.equal(view.overlay.querySelectorAll(".wx-spreadsheet-reference").length, 1);
    view.flash(0, 0, "#ff0000");
    assert.ok(view._rows.get(0).cells.get(0).classList.contains("wx-spreadsheet-flash"));
    view.flash(900, 0);
    view.requestRender();
    view.requestRender();
    assert.ok(view._frame);
});

test("hit testing tells cells, headers, borders and the corner apart", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt);
    const view = ctrl._view;
    assert.equal(view.hit(5, 5).area, "corner");
    assert.equal(view.hit(view.headerWidth + 50, 5).area, "colheader");
    assert.equal(view.hit(view.headerWidth + 2, 5).area, "colheader", "the left border of the first column belongs to no other column");
    assert.equal(view.hit(view.headerWidth + 102, 5).area, "colresize");
    assert.equal(view.hit(5, view.headerHeight + 12).area, "rowheader");
    assert.equal(view.hit(5, view.headerHeight + 26).area, "rowresize");
    const box = view.clientRect(1, 1);
    assert.deepEqual(plain(box), { left: view.headerWidth + 100, top: view.headerHeight + 24, width: 100, height: 24 });
});

test("gridlines can be switched off per sheet", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", props: { gridlines: false } }] });
    assert.ok(ctrl._view.pane.classList.contains("wx-spreadsheet-nogrid"));
    ctrl.execCommand("gridlines");
    assert.ok(!ctrl._view.pane.classList.contains("wx-spreadsheet-nogrid"));
});

test("a workbook with 300,000 rows loads, calculates and edits quickly", () => {
    const rt = loadSpreadsheet();
    const rows = 300000;
    const data = new Array(rows);
    for (let i = 0; i < rows; i++) data[i] = [i, i * 2, "=A" + (i + 1) + "+B" + (i + 1)];
    let started = Date.now();
    const model = rt.wx.SpreadsheetModel.fromJSON({ sheets: [{ name: "Big", rowCount: rows, colCount: 3, data }] });
    const engine = new rt.wx.SpreadsheetEngine(model);
    const loadTime = Date.now() - started;
    assert.equal(engine.cellValue(model.sheets[0], rows - 1, 2), (rows - 1) * 3);
    started = Date.now();
    const changed = engine.update(model.apply({ type: "set", sheet: model.sheets[0].id, cells: [{ row: 5, col: 0, cell: { v: 1000 } }] }).changes);
    const editTime = Date.now() - started;
    assert.equal(changed.length, 1, "only the dependent formula recalculates");
    assert.ok(loadTime < 20000, "load and calculate took " + loadTime + " ms");
    assert.ok(editTime < 200, "an edit took " + editTime + " ms");
    const { ctrl } = createSpreadsheet(rt, null);
    started = Date.now();
    ctrl.setWorkbook(model.toJSON());
    ctrl.select("C" + rows);
    assert.ok(Date.now() - started < 30000);
    assert.equal(ctrl.getValue("C" + rows), (rows - 1) * 3);
    assert.ok(ctrl._view._rows.size < 60, "the grid still renders only the visible rows");
});

test("a fill without a text color gets legible text, whatever the theme's text color is", () => {
    const rt = loadSpreadsheet();
    const View = rt.wx.SpreadsheetView;
    assert.equal(View.contrastText("#e2efda"), "#1f1f1f");
    assert.equal(View.contrastText("#fff"), "#1f1f1f");
    assert.equal(View.contrastText("#1f3864"), "#ffffff");
    assert.equal(View.contrastText("#1f3864ff"), "#ffffff");
    assert.equal(View.contrastText("rgba(255, 255, 0, 0.5)"), "#1f1f1f");
    assert.equal(View.contrastText("rgb(0,0,128)"), "#ffffff");
    assert.equal(View.contrastText("navy"), "", "names are left to the theme");
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", cells: {
        A1: { v: "light", s: { fill: "#e2efda" } },
        B1: { v: "dark", s: { fill: "#1f3864" } },
        C1: { v: "own", s: { fill: "#1f3864", color: "#ffc000" } },
        D1: { v: "none" }
    } }] }, { "data-locale": "en" });
    const cells = ctrl._view._rows.get(0).cells;
    assert.equal(cells.get(0)._text.style.color, "#1f1f1f");
    assert.equal(cells.get(1)._text.style.color, "#ffffff");
    assert.equal(cells.get(2)._text.style.color, "#ffc000", "an own text color is kept");
    assert.equal(cells.get(3)._text.style.color, "", "without a fill the theme decides");
});
