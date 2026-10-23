/**
 * Tests of the interaction: keyboard navigation and selection, editing with the cell editor and
 * the formula bar, point mode, suggestions, pointer and touch gestures, the name box, the sheet
 * tabs, the context menu and comments.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadSpreadsheet, createSpreadsheet, keyOn, pointerOn, cellPoint, plain, settle } from "./spreadsheet.fixture.mjs";

/**
 * Creates a spreadsheet with a block of data for navigation.
 * @param {object} [attributes] - Host attributes.
 * @returns {object} The runtime, the control and helpers.
 */
function setup(attributes = {}) {
    const rt = loadSpreadsheet();
    const { host, ctrl } = createSpreadsheet(rt, {
        sheets: [
            { name: "S", rowCount: 200, colCount: 20, data: [["a", "b", "c", null, "e"], [1, 2, 3], [4, 5, 6], [], [null, null, null, null, "x"]] },
            { name: "T" }
        ]
    }, { "data-locale": "en", ...attributes });
    const grid = ctrl._view.viewport;
    const press = (key, init) => { const e = keyOn(grid, key, init); ctrl._onKeyDown(e); return e; };
    const type = (key, init) => { const input = rt.document.activeElement === ctrl._formulaInput ? ctrl._formulaInput : ctrl._editor; const e = keyOn(input, key, init); ctrl._onEditorKeyDown(e, input); return e; };
    const write = (text) => { ctrl._editor.value = text; ctrl._onEditorInput(ctrl._editor); };
    const at = () => ctrl.selection.active;
    return { rt, host, ctrl, grid, press, type, write, at };
}

test("arrow keys move and extend the selection, Home and End jump within the row", () => {
    const { ctrl, press, at } = setup();
    press("ArrowDown"); press("ArrowRight");
    assert.equal(at(), "B2");
    press("ArrowRight", { shift: true }); press("ArrowDown", { shift: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["B2:C3"]);
    assert.equal(at(), "B2", "extending keeps the active cell");
    press("ArrowUp"); press("ArrowLeft"); press("ArrowLeft"); press("ArrowUp"); press("ArrowUp");
    assert.equal(at(), "A1", "moving stops at the edge");
    press("End");
    assert.equal(at(), "E1", "End goes to the last filled cell of the row");
    press("Home");
    assert.equal(at(), "A1");
    press("End", { shift: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["A1:E1"]);
    press("Home", { shift: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["A1"]);
});

test("Ctrl+Arrow jumps to the edges of the data", () => {
    const { press, at, ctrl } = setup();
    press("ArrowDown", { ctrl: true });
    assert.equal(at(), "A3", "from filled cells to the last filled one");
    press("ArrowDown", { ctrl: true });
    assert.equal(at(), "A200", "from the edge of the data to the sheet's end");
    press("Home", { ctrl: true });
    assert.equal(at(), "A1");
    press("ArrowRight", { ctrl: true });
    assert.equal(at(), "C1");
    press("ArrowRight", { ctrl: true });
    assert.equal(at(), "E1", "over a gap to the next filled cell");
    press("ArrowLeft", { ctrl: true, shift: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["C1:E1"]);
    press("End", { ctrl: true });
    assert.equal(at(), "E5");
    press("Home", { ctrl: true, shift: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["A1:E5"]);
});

test("Page keys move by a page, Alt+Page sideways, Ctrl+Page between sheets", () => {
    const { ctrl, press, at } = setup();
    press("PageDown");
    const rows = ctrl._view.pageRows();
    assert.equal(at(), "A" + (rows + 1));
    press("PageUp");
    assert.equal(at(), "A1");
    press("PageDown", { alt: true });
    assert.notEqual(at(), "A1");
    press("PageUp", { alt: true });
    assert.equal(at(), "A1");
    press("PageDown", { ctrl: true });
    assert.equal(ctrl.activeSheet, "T");
    press("PageUp", { ctrl: true });
    assert.equal(ctrl.activeSheet, "S");
});

test("Tab and Enter walk through a selected block and return to the start column", () => {
    const { ctrl, press, at } = setup();
    press("Tab"); press("Tab");
    assert.equal(at(), "C1");
    press("Enter");
    assert.equal(at(), "A2", "Enter after Tab returns to the column the row was started in");
    press("Tab", { shift: true });
    assert.equal(at(), "A2");
    press("Enter", { shift: true });
    assert.equal(at(), "A1");
    ctrl.select("B2:C3");
    press("Tab"); assert.equal(at(), "C2");
    press("Tab"); assert.equal(at(), "B3");
    press("Enter"); assert.equal(at(), "C2", "Enter walks down the columns of the block");
    press("Enter", { shift: true }); assert.equal(at(), "B3");
    press("Tab", { shift: true }); assert.equal(at(), "C2");
    assert.deepEqual(plain(ctrl.selection.ranges), ["B2:C3"], "the block stays selected");
});

test("Ctrl+A takes the data region first and the whole sheet second; Space keys take rows and columns", () => {
    const { ctrl, press } = setup();
    ctrl.select("B2");
    press("a", { ctrl: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["A1:C3"], "the region ends at an empty column");
    press("a", { ctrl: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["A1:T200"]);
    ctrl.select("B2");
    press(" ", { ctrl: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["B1:B200"]);
    press(" ", { shift: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["A2:T2"]);
    ctrl.select("H10");
    press("a", { ctrl: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["A1:T200"], "an empty cell has no region");
});

test("merged cells are entered at their anchor and stepped over", () => {
    const { ctrl, press, at } = setup();
    ctrl.merge("B1:C2");
    ctrl.select("A1");
    press("ArrowRight");
    assert.equal(at(), "B1");
    assert.deepEqual(plain(ctrl.selection.ranges), ["B1:C2"]);
    press("ArrowRight");
    assert.equal(at(), "D1", "the merge is stepped over as one cell");
    ctrl.select("A2");
    press("ArrowRight", { shift: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["A1:C2"], "a selection grows over a whole merge");
});

test("hidden rows and columns are skipped", () => {
    const { ctrl, press, at } = setup();
    ctrl.hideRows(1, 2);
    ctrl.select("A1");
    press("ArrowDown");
    assert.equal(at(), "A4");
    ctrl.hideColumns(1, 1);
    ctrl.select("A1");
    press("ArrowRight");
    assert.equal(at(), "C1");
});

test("the context menu of a header hides its rows or columns and the header marker shows them again", () => {
    const { ctrl, grid, at } = setup();
    const view = ctrl._view;
    const labels = () => [...ctrl._menu.querySelectorAll("[role=menuitem]")].map(b => [b.textContent.replace(/(Ctrl|Del|Shift).*$/, ""), b.disabled]);
    ctrl._onContextMenu(pointerOn(grid, 5, view.rowY(2) + 10, { type: "contextmenu" }));
    assert.deepEqual(plain(ctrl.selection.ranges), ["A3:T3"], "a right click on a row header selects the row");
    assert.deepEqual(plain(labels().filter(([l]) => /hid/i.test(l))), [["Hide rows", false], ["Show hidden rows", true]], "a row header offers only the rows");
    [...ctrl._menu.querySelectorAll("[role=menuitem]")].find(b => b.textContent.startsWith("Hide rows")).click();
    assert.equal(ctrl.sheet.rowProps[2].hidden, true);
    assert.equal(at(), "A4", "the active cell leaves the hidden row");
    assert.ok(view._rows.get(3).header.classList.contains("wx-spreadsheet-hidden-before"), "the next header marks the hidden row");
    assert.ok(!view._rows.get(1).header.classList.contains("wx-spreadsheet-hidden-after"), "only the header after a hidden block marks it");

    const marker = view.rowY(3) + 2;
    assert.deepEqual(plain(view.hit(5, marker)), { area: "rowunhide", row: 3, col: 0, edge: -1 });
    ctrl._onHover(pointerOn(grid, 5, marker, { type: "pointermove" }));
    assert.equal(grid.getAttribute("data-cursor"), "unhide");
    ctrl._onPointerDown(pointerOn(grid, 5, marker));
    assert.equal(ctrl.sheet.rowProps[2], undefined, "a click on the marker shows the row");
    assert.deepEqual(plain(ctrl.selection.ranges), ["A3:T3"], "what came back is selected");

    ctrl._onContextMenu(pointerOn(grid, view.colX(2) + 50, 10, { type: "contextmenu" }));
    assert.deepEqual(plain(labels().filter(([l]) => /hid/i.test(l)).map(([l]) => l)), ["Hide columns", "Show hidden columns"], "a column header offers only the columns");
    ctrl._closeMenu();
    ctrl._onContextMenu(pointerOn(grid, cellPoint(ctrl, 4, 4).x, cellPoint(ctrl, 4, 4).y, { type: "contextmenu" }));
    assert.equal(labels().filter(([l]) => /hid/i.test(l)).length, 4, "a cell offers both");
    ctrl._closeMenu();

    // a block at the end of the sheet has no header after it, so the one before marks it
    ctrl.hideColumns(5, 15);
    assert.ok(view._headers.get(4).classList.contains("wx-spreadsheet-hidden-after"));
    const right = view.colX(4) + view.cols.sizeOf(4) - 2;
    assert.deepEqual(plain(view.hit(right, 10)), { area: "colunhide", row: 0, col: 4, edge: 1 });
    ctrl._onPointerDown(pointerOn(grid, right, 10));
    assert.equal(ctrl.sheet.colProps.some(p => p?.hidden), false);
    assert.deepEqual(plain(ctrl.selection.ranges), ["F1:T200"]);
});

test("Ctrl+9 and Ctrl+0 hide rows and columns, with Shift they come back", () => {
    const { ctrl, grid, at } = setup();
    const press = (code, shift = false) => { const e = keyOn(grid, shift ? ")" : code.slice(-1), { ctrl: true, shift }); e.code = code; ctrl._onKeyDown(e); return e; };
    ctrl.select("B2");
    assert.ok(press("Digit0").defaultPrevented, "the browser's zoom reset stays out while the grid has the focus");
    assert.equal(ctrl.sheet.colProps[1].hidden, true);
    assert.equal(at(), "C2");
    press("Digit9");
    assert.equal(ctrl.sheet.rowProps[1].hidden, true);
    assert.equal(at(), "C3");
    ctrl.select("A1:C3");
    press("Digit9", true);
    assert.equal(ctrl.sheet.rowProps[1], undefined);
    assert.equal(ctrl.sheet.colProps[1].hidden, true, "the rows come back alone");
    press("Digit0", true);
    assert.equal(ctrl.sheet.colProps[1], undefined);
    ctrl.undo();
    assert.equal(ctrl.sheet.colProps[1].hidden, true, "showing is undone like any change");
});

test("hiding keeps one row and one column visible, and showing a whole sheet stays sparse", () => {
    const { ctrl } = setup();
    ctrl.selectAll();
    assert.equal(ctrl.execCommand("hiderow"), false, "every row hidden would leave nothing to select");
    assert.equal(ctrl.execCommand("hidecol"), false);
    ctrl._openContextMenu(null);
    const hide = [...ctrl._menu.querySelectorAll("[role=menuitem]")].filter(b => b.textContent.startsWith("Hide"));
    assert.deepEqual(hide.map(b => b.disabled), [true, true]);
    ctrl._closeMenu();
    ctrl.hideRows(0, 199);
    assert.equal(ctrl.hideRows(199), false, "the last visible row stays");
    assert.equal(ctrl.selection.active, "A200");
    ctrl.hideRows(0, 199, false);
    ctrl.hideRows(150, 1);
    let entries = 0;
    const apply = ctrl._model.apply.bind(ctrl._model);
    ctrl._model.apply = (op) => { entries += op.entries?.length ?? 0; return apply(op); };
    ctrl.selectAll();
    assert.equal(ctrl.execCommand("unhide"), true);
    assert.equal(entries, 1, "only the hidden row is touched");
    assert.equal(ctrl.execCommand("unhide"), false, "nothing hidden, nothing to do");
});

test("typing starts editing and Enter commits like the common spreadsheets", () => {
    const { rt, ctrl, press, type, write, at, host } = setup();
    const events = [];
    host.addEventListener(rt.wx.Event.SPREADSHEET_EDIT_STARTED_EVENT, () => events.push("start"));
    host.addEventListener(rt.wx.Event.SPREADSHEET_EDIT_ENDED_EVENT, () => events.push("end"));
    ctrl.select("G1");
    press("4");
    assert.ok(ctrl._editing);
    assert.equal(ctrl._editor.value, "4");
    assert.equal(ctrl._formulaInput.value, "4", "the formula bar mirrors the editor");
    write("42");
    type("Enter");
    assert.equal(ctrl.getValue("G1"), 42);
    assert.equal(at(), "G2");
    press("x"); write("left"); type("Tab");
    assert.equal(ctrl.getValue("G2"), "left");
    assert.equal(at(), "H2");
    press("y"); type("Enter", { shift: true });
    assert.equal(ctrl.getValue("H2"), "y");
    assert.equal(at(), "H1");
    press("z"); type("ArrowRight");
    assert.equal(ctrl.getValue("H1"), "z", "an arrow commits in enter mode");
    assert.equal(at(), "I1");
    press("q"); type("Escape");
    assert.equal(ctrl.getValue("I1"), null, "Escape cancels");
    assert.deepEqual(plain(events.slice(0, 2)), ["start", "end"]);
});

test("F2 edits in place, arrows move the caret there, Backspace starts empty, Delete clears", () => {
    const { ctrl, press, type, write } = setup();
    ctrl.select("A2");
    press("F2");
    assert.equal(ctrl._editor.value, "1");
    assert.equal(ctrl._editing.mode, "edit");
    const e = type("ArrowLeft");
    assert.equal(e.defaultPrevented, false, "the caret moves inside the text");
    type("F2");
    assert.equal(ctrl._editing.mode, "enter", "F2 switches to enter mode");
    write("7"); type("Enter");
    assert.equal(ctrl.getValue("A2"), 7);
    ctrl.select("B2");
    press("Backspace");
    assert.equal(ctrl._editor.value, "");
    type("Escape");
    ctrl.select("A2:C3");
    press("Delete");
    assert.deepEqual(plain(ctrl.getRange("A2:C3")), [[null, null, null], [null, null, null]]);
    press("Enter", { ctrl: true });
    assert.ok(ctrl._editing, "Ctrl+Enter opens the editor");
    type("Escape");
    press("Enter", { alt: true });
    assert.ok(ctrl._editing);
    type("Escape");
});

test("Alt+Enter breaks the line and Ctrl+Enter fills the selection", () => {
    const { ctrl, press, type, write } = setup();
    ctrl.select("G1");
    press("a");
    ctrl._editor.selectionStart = ctrl._editor.selectionEnd = 1;
    type("Enter", { alt: true });
    assert.equal(ctrl._editor.value, "a\n");
    write("a\nb"); type("Enter");
    assert.equal(ctrl.getValue("G1"), "a\nb");
    ctrl.select("H1:H3");
    press("=");
    write("=ROW()*2");
    type("Enter", { ctrl: true });
    assert.deepEqual(plain(ctrl.getRange("H1:H3")), [[2], [4], [6]]);
    ctrl.select("I1:I2");
    press("5"); type("Enter", { ctrl: true });
    assert.deepEqual(plain(ctrl.getRange("I1:I2")), [[5], [5]]);
});

test("unfinished formulas are closed and F4 cycles absolute references", () => {
    const { ctrl, press, type, write } = setup();
    ctrl.select("G1");
    press("=");
    write("=SUM(A2:C2");
    type("Enter");
    assert.equal(ctrl.getFormula("G1"), "=SUM(A2:C2)");
    assert.equal(ctrl.getValue("G1"), 6);
    ctrl.select("G2");
    press("=");
    write("=A1");
    ctrl._editor.selectionStart = ctrl._editor.selectionEnd = 3;
    type("F4"); assert.equal(ctrl._editor.value, "=$A$1");
    type("F4"); assert.equal(ctrl._editor.value, "=A$1");
    type("F4"); assert.equal(ctrl._editor.value, "=$A1");
    type("F4"); assert.equal(ctrl._editor.value, "=A1");
    write("=1");
    ctrl._editor.selectionStart = ctrl._editor.selectionEnd = 2;
    type("F4");
    assert.equal(ctrl._editor.value, "=1", "F4 outside a reference changes nothing");
    type("Escape");
});

test("point mode inserts references with the arrow keys and the mouse", () => {
    const { ctrl, press, type, grid } = setup();
    ctrl.select("G3");
    press("=");
    assert.equal(ctrl._editing.mode, "enter");
    type("ArrowLeft");
    assert.equal(ctrl._editor.value, "=F3");
    assert.equal(ctrl._renderStatus() ?? ctrl._mode.textContent, "Point");
    type("ArrowLeft"); type("ArrowUp");
    assert.equal(ctrl._editor.value, "=E2");
    type("ArrowUp", { shift: true });
    assert.equal(ctrl._editor.value, "=E1:E2");
    ctrl._editor.value += "+";
    ctrl._editor.selectionStart = ctrl._editor.selectionEnd = ctrl._editor.value.length;
    ctrl._editing.point = null;
    ctrl._onEditorInput(ctrl._editor);
    const p = cellPoint(ctrl, 1, 0);
    ctrl._onPointerDown(pointerOn(grid, p.x, p.y));
    assert.equal(ctrl._editor.value, "=E1:E2+A2", "a click inserts the reference of the cell");
    const q = cellPoint(ctrl, 2, 1);
    grid.dispatchEvent(pointerOn(grid, q.x, q.y, { type: "pointermove" }));
    assert.equal(ctrl._editor.value, "=E1:E2+A2:B3", "dragging widens it into a range");
    grid.dispatchEvent(pointerOn(grid, q.x, q.y, { type: "pointerup" }));
    assert.ok(ctrl._formulaRefs.length >= 2, "the references are highlighted");
    type("Enter");
    assert.equal(ctrl.getFormula("G3"), "=E1:E2+A2:B3");
});

test("function names are suggested and the syntax of the open function is shown", () => {
    const { ctrl, press, type, write } = setup();
    ctrl.select("G1");
    press("=");
    write("=SU");
    assert.equal(ctrl._suggest.hidden, false);
    const names = [...ctrl._suggest.querySelectorAll("[data-function]")].map(i => i.getAttribute("data-function"));
    assert.ok(names.includes("SUM") && names.includes("SUMIF"));
    assert.equal(names[0], "SUBSTITUTE", "suggestions are sorted by name");
    type("ArrowDown"); type("ArrowDown"); type("ArrowUp");
    type("Tab");
    assert.equal(ctrl._editor.value, "=SUM(");
    assert.equal(ctrl._suggest.hidden, true);
    assert.equal(ctrl._hint.hidden, false);
    assert.match(ctrl._hint.textContent, /SUM\(value1/);
    write("=SUM(1,2) + AV");
    ctrl._suggest.dispatchEvent({ type: "pointerdown", target: ctrl._suggest.querySelector("[data-function]"), preventDefault() { } });
    assert.match(ctrl._editor.value, /AV[A-Z]*\($/);
    write("=SU");
    type("Escape");
    assert.equal(ctrl._suggest.hidden, true);
    assert.ok(ctrl._editing, "the first Escape only closes the suggestions");
    type("Escape");
});

test("the formula bar edits the active cell and its buttons commit or cancel", () => {
    const { rt, ctrl } = setup();
    ctrl.select("A1");
    rt.document.activeElement = ctrl._formulaInput;
    ctrl._formulaInput.dispatchEvent({ type: "focus" });
    assert.equal(ctrl._editing.source, "bar");
    ctrl._formulaInput.value = "bar text";
    ctrl._onEditorInput(ctrl._formulaInput);
    assert.equal(ctrl._editor.value, "bar text");
    ctrl._acceptButton.click();
    assert.equal(ctrl.getValue("A1"), "bar text");
    rt.document.activeElement = ctrl._formulaInput;
    ctrl._formulaInput.dispatchEvent({ type: "focus" });
    ctrl._formulaInput.value = "discard";
    ctrl._cancelButton.click();
    assert.equal(ctrl.getValue("A1"), "bar text");
});

test("a value a typed cell refuses keeps the editor open and marked invalid", () => {
    const { ctrl, press, type, write } = setup();
    ctrl.setType("G1", "list", { options: ["Open", "Done"] });
    ctrl.select("G1");
    press("x");
    write("Maybe");
    type("Enter");
    assert.ok(ctrl._editing);
    assert.equal(ctrl._editor.getAttribute("aria-invalid"), "true");
    write("Done");
    type("Enter");
    assert.equal(ctrl.getValue("G1"), "Done");
});

test("Space toggles a checkbox cell and a click on it does as well", () => {
    const { ctrl, press, grid } = setup();
    ctrl.setValue("G1", true, { raw: true });
    ctrl.setType("G1", "checkbox");
    ctrl.select("G1");
    press(" ");
    assert.equal(ctrl.getValue("G1"), false);
    const el = ctrl._view._rows.get(0).cells.get(6);
    const p = cellPoint(ctrl, 0, 6);
    const e = pointerOn(el._text, p.x, p.y);
    e.target = { ...el._text, closest: (s) => (s === ".wx-spreadsheet-check" ? el : null), getAttribute: () => null };
    ctrl._onPointerDown(e);
    assert.equal(ctrl.getValue("G1"), true);
    void grid;
});

test("shortcuts format, fill, find and recalculate", () => {
    const { ctrl, press } = setup();
    ctrl.select("A1:B1");
    press("b", { ctrl: true }); press("i", { ctrl: true }); press("u", { ctrl: true }); press("5", { ctrl: true });
    assert.deepEqual(plain(Object.keys(ctrl.getStyle("A1")).sort()), ["bold", "italic", "strike", "underline"]);
    ctrl.select("A2:A3");
    press("d", { ctrl: true });
    assert.equal(ctrl.getValue("A3"), 1);
    ctrl.select("A2:C2");
    press("r", { ctrl: true });
    assert.equal(ctrl.getValue("C2"), 1);
    press("f", { ctrl: true });
    assert.equal(ctrl._element.querySelector(".wx-spreadsheet-find").hidden, false);
    press("h", { ctrl: true });
    assert.ok(ctrl._element.querySelector(".wx-spreadsheet-find").classList.contains("wx-spreadsheet-find-replace"));
    ctrl.select("J1");
    press(";", { ctrl: true });
    assert.equal(typeof ctrl.getValue("J1"), "number");
    assert.equal(press("F9").defaultPrevented, true);
    ctrl._clipboardRange = { r1: 0, c1: 0, r2: 0, c2: 0, sheet: ctrl.sheet.id };
    press("Escape");
    assert.equal(ctrl._clipboardRange, null);
    assert.equal(press("q", { alt: true }).defaultPrevented, false);
    assert.equal(press("k", { ctrl: true }).defaultPrevented, false);
});

test("a read-only spreadsheet navigates but never edits", () => {
    const { ctrl, press, at } = setup({ "data-readonly": "true" });
    press("ArrowDown");
    assert.equal(at(), "A2");
    press("x"); press("Delete"); press("F2"); press("Backspace");
    assert.equal(ctrl._editing, null);
    assert.equal(ctrl.getValue("A2"), 1);
    assert.equal(ctrl._startEdit(), false);
});

test("clicks select cells, ranges, rows, columns and the whole sheet", () => {
    const { ctrl, grid } = setup();
    const click = (row, col, init) => { const p = cellPoint(ctrl, row, col); ctrl._onPointerDown(pointerOn(grid, p.x, p.y, init)); grid.dispatchEvent(pointerOn(grid, p.x, p.y, { type: "pointerup" })); };
    click(2, 1);
    assert.equal(ctrl.selection.active, "B3");
    click(4, 3, { shift: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["B3:D5"]);
    click(0, 5, { ctrl: true });
    assert.deepEqual(plain(ctrl.selection.ranges), ["B3:D5", "F1"]);
    const p = cellPoint(ctrl, 0, 0);
    ctrl._onPointerDown(pointerOn(grid, p.x, p.y));
    const q = cellPoint(ctrl, 3, 2);
    grid.dispatchEvent(pointerOn(grid, q.x, q.y, { type: "pointermove" }));
    grid.dispatchEvent(pointerOn(grid, q.x, q.y, { type: "pointerup" }));
    assert.deepEqual(plain(ctrl.selection.ranges), ["A1:C4"], "dragging selects a range");
    const header = ctrl._view.colX(2) + 50;
    ctrl._onPointerDown(pointerOn(grid, header, 10));
    grid.dispatchEvent(pointerOn(grid, ctrl._view.colX(3) + 50, 10, { type: "pointermove" }));
    grid.dispatchEvent(pointerOn(grid, 0, 0, { type: "pointerup" }));
    assert.deepEqual(plain(ctrl.selection.ranges), ["C1:D200"]);
    ctrl._onPointerDown(pointerOn(grid, ctrl._view.colX(5) + 50, 10, { shift: true }));
    assert.deepEqual(plain(ctrl.selection.ranges), ["C1:F200"]);
    ctrl._onPointerDown(pointerOn(grid, 10, ctrl._view.rowY(4) + 10));
    grid.dispatchEvent(pointerOn(grid, 10, ctrl._view.rowY(6) + 10, { type: "pointermove" }));
    grid.dispatchEvent(pointerOn(grid, 0, 0, { type: "pointerup" }));
    assert.deepEqual(plain(ctrl.selection.ranges), ["A5:T7"]);
    ctrl._onPointerDown(pointerOn(grid, 5, 5));
    assert.deepEqual(plain(ctrl.selection.ranges), ["A1:T200"]);
    ctrl._onPointerDown(pointerOn(grid, 5, 5, { button: 2 }));
});

test("dragging a header border resizes, a double click fits or resets it", () => {
    const { ctrl, grid } = setup();
    const border = ctrl._view.colX(0) + ctrl._view.cols.sizeOf(0);
    assert.equal(ctrl._view.hit(border, 10).area, "colresize");
    ctrl._onHover(pointerOn(grid, border, 10, { type: "pointermove" }));
    assert.equal(grid.getAttribute("data-cursor"), "col-resize");
    ctrl._onPointerDown(pointerOn(grid, border, 10));
    grid.dispatchEvent(pointerOn(grid, border + 50, 10, { type: "pointermove" }));
    grid.dispatchEvent(pointerOn(grid, border + 50, 10, { type: "pointerup" }));
    assert.equal(ctrl.sheet.colProps[0].size, 150);
    const rowBorder = ctrl._view.rowY(1) + ctrl._view.rows.sizeOf(1);
    assert.equal(ctrl._view.hit(10, rowBorder).area, "rowresize");
    ctrl._onPointerDown(pointerOn(grid, 10, rowBorder));
    grid.dispatchEvent(pointerOn(grid, 10, rowBorder + 16, { type: "pointermove" }));
    grid.dispatchEvent(pointerOn(grid, 10, rowBorder + 16, { type: "pointerup" }));
    assert.equal(ctrl.sheet.rowProps[1].size, 40);
    ctrl._onDoubleClick(pointerOn(grid, 10, ctrl._view.rowY(1) + ctrl._view.rows.sizeOf(1), { type: "dblclick" }));
    assert.equal(ctrl.sheet.rowProps[1], undefined, "a double click resets the row height");
    const colBorder = ctrl._view.colX(0) + ctrl._view.cols.sizeOf(0);
    ctrl._onDoubleClick(pointerOn(grid, colBorder, 10, { type: "dblclick" }));
    assert.equal(ctrl.sheet.colProps[0]?.size, undefined, "fitting without a measuring context resets the width");
});

test("the fill handle continues series and a double click fills down beside the data", () => {
    const { ctrl, grid } = setup();
    ctrl.select("A2:A3");
    ctrl._view.renderOverlay();
    const handle = ctrl._view.overlay.querySelector("[data-handle=fill]");
    assert.ok(handle);
    const start = cellPoint(ctrl, 2, 0);
    const e = pointerOn(handle, start.x, start.y);
    ctrl._onPointerDown(e);
    const end = cellPoint(ctrl, 5, 0);
    grid.dispatchEvent(pointerOn(grid, end.x, end.y, { type: "pointermove" }));
    assert.ok(ctrl._preview);
    grid.dispatchEvent(pointerOn(grid, end.x, end.y, { type: "pointerup" }));
    assert.deepEqual(plain(ctrl.getRange("A2:A6")), [[1], [4], [7], [10], [13]]);
    ctrl.select("D2");
    ctrl.setValue("D2", "=B2*2");
    ctrl.select("D2");
    ctrl._view.renderOverlay();
    ctrl._onDoubleClick({ target: ctrl._view.overlay.querySelector("[data-handle=fill]"), clientX: 0, clientY: 0 });
    assert.equal(ctrl.getFormula("D3"), "=B3*2", "filled as far as the column beside holds data");
});

test("dragging the selection border moves it, with Ctrl it copies it", () => {
    const { ctrl, grid } = setup();
    ctrl.select("A2:B2");
    const rect = ctrl._view.rangeRects({ r1: 1, c1: 0, r2: 1, c2: 1 })[0];
    const edgeY = rect.top + 1;
    ctrl._onPointerDown(pointerOn(grid, rect.left + 20, edgeY));
    const target = cellPoint(ctrl, 9, 0);
    grid.dispatchEvent(pointerOn(grid, target.x, target.y, { type: "pointermove" }));
    grid.dispatchEvent(pointerOn(grid, target.x, target.y, { type: "pointerup" }));
    assert.equal(ctrl.getValue("A2"), null);
    assert.equal(ctrl.getValue("A10"), 1);
    ctrl.select("A10:B10");
    const r = ctrl._view.rangeRects({ r1: 9, c1: 0, r2: 9, c2: 1 })[0];
    ctrl._onPointerDown(pointerOn(grid, r.left + 20, r.top + 1, { ctrl: true }));
    const copyTo = cellPoint(ctrl, 11, 0);
    grid.dispatchEvent(pointerOn(grid, copyTo.x, copyTo.y, { type: "pointermove" }));
    grid.dispatchEvent(pointerOn(grid, copyTo.x, copyTo.y, { type: "pointerup" }));
    assert.equal(ctrl.getValue("A10"), 1);
    assert.equal(ctrl.getValue("A12"), 1);
});

test("the format painter carries the format of one cell to the next selection", () => {
    const { ctrl, grid } = setup();
    ctrl.setStyle("A1", { bold: true, fill: "#ffff00" });
    ctrl.select("A1");
    ctrl.execCommand("formatpainter");
    assert.ok(ctrl.queryCommandState("formatpainter"));
    const p = cellPoint(ctrl, 2, 2);
    ctrl._onPointerDown(pointerOn(grid, p.x, p.y));
    grid.dispatchEvent(pointerOn(grid, p.x, p.y, { type: "pointerup" }));
    assert.deepEqual(plain(ctrl.getStyle("C3")), { bold: true, fill: "#ffff00" });
    assert.equal(ctrl.queryCommandState("formatpainter"), false);
});

test("a double click edits the cell under the pointer", () => {
    const { ctrl, grid } = setup();
    const p = cellPoint(ctrl, 1, 1);
    ctrl._onPointerDown(pointerOn(grid, p.x, p.y));
    grid.dispatchEvent(pointerOn(grid, p.x, p.y, { type: "pointerup" }));
    ctrl._onDoubleClick(pointerOn(grid, p.x, p.y, { type: "dblclick" }));
    assert.equal(ctrl._editor.value, "2");
    ctrl._onPointerDown(pointerOn(grid, cellPoint(ctrl, 5, 5).x, cellPoint(ctrl, 5, 5).y));
    assert.equal(ctrl._editing, null, "a click elsewhere commits the edit");
    ctrl._onDoubleClick(pointerOn(grid, 5, 5, { type: "dblclick" }));
    assert.equal(ctrl._editing, null, "the corner is no cell");
});

test("touch taps select, a double tap edits in the formula bar, a long press opens the menu", async () => {
    const { ctrl, grid } = setup();
    const tap = (row, col, id = 1) => {
        const p = cellPoint(ctrl, row, col);
        ctrl._onPointerDown(pointerOn(grid, p.x, p.y, { pointerType: "touch", pointerId: id }));
        grid.dispatchEvent(pointerOn(grid, p.x, p.y, { type: "pointerup", pointerType: "touch", pointerId: id }));
    };
    tap(2, 2);
    assert.equal(ctrl.selection.active, "C3");
    ctrl._view.renderOverlay();
    assert.ok(ctrl._view.overlay.querySelector("[data-handle=start]"), "touch shows selection handles");
    tap(2, 2);
    assert.equal(ctrl._editing?.source, "bar");
    ctrl._cancelEdit();
    const p = cellPoint(ctrl, 4, 1);
    ctrl._onPointerDown(pointerOn(grid, p.x, p.y, { pointerType: "touch", pointerId: 3 }));
    await settle(600);
    assert.equal(ctrl._menu.hidden, false, "a long press opens the context menu");
    grid.dispatchEvent(pointerOn(grid, p.x, p.y, { type: "pointerup", pointerType: "touch", pointerId: 3 }));
    ctrl._closeMenu();
    const a = pointerOn(grid, 100, 100, { pointerType: "touch", pointerId: 4 });
    const b = pointerOn(grid, 200, 100, { pointerType: "touch", pointerId: 5 });
    ctrl._onPointerDown(a); ctrl._onPointerDown(b);
    grid.dispatchEvent(pointerOn(grid, 300, 100, { type: "pointermove", pointerType: "touch", pointerId: 5 }));
    assert.equal(ctrl.zoom, 2, "spreading two fingers zooms in");
    for (const id of [4, 5]) grid.dispatchEvent(pointerOn(grid, 300, 100, { type: "pointerup", pointerType: "touch", pointerId: id }));
    const handle = ctrl._view.overlay.querySelector("[data-handle=end]");
    if (handle) {
        ctrl._onPointerDown(pointerOn(handle, 0, 0, { pointerType: "touch" }));
        const end = cellPoint(ctrl, 6, 4);
        grid.dispatchEvent(pointerOn(grid, end.x, end.y, { type: "pointermove", pointerType: "touch" }));
        grid.dispatchEvent(pointerOn(grid, end.x, end.y, { type: "pointerup", pointerType: "touch" }));
    }
});

test("the name box navigates, selects ranges and defines names", () => {
    const { rt, ctrl } = setup();
    const box = ctrl._nameBox;
    const enter = (text) => { box.value = text; box.dispatchEvent({ type: "keydown", key: "Enter", target: box, preventDefault() { } }); };
    enter("C7");
    assert.equal(ctrl.selection.active, "C7");
    enter("B2:D3");
    assert.deepEqual(plain(ctrl.selection.ranges), ["B2:D3"]);
    enter("T!A5");
    assert.equal(ctrl.activeSheet, "T");
    ctrl.activateSheet("S");
    ctrl.select("A1:A3");
    enter("Labels");
    assert.equal(ctrl.names.Labels, "S!A1:A3");
    ctrl.select("H1");
    ctrl._refreshChrome();
    enter("labels");
    assert.deepEqual(plain(ctrl.selection.ranges), ["A1:A3"]);
    rt.document.activeElement = rt.document.body;
    ctrl._refreshChrome();
    assert.equal(box.value, "Labels", "the name box shows the name of a named selection");
    enter("1:2:3");
    assert.equal(box.getAttribute("aria-invalid"), "true");
    box.dispatchEvent({ type: "keydown", key: "Escape", target: box, preventDefault() { } });
    box.dispatchEvent({ type: "keydown", key: "a", target: box, preventDefault() { } });
});

test("sheet tabs switch, rename, reorder and delete by mouse and keyboard", () => {
    const { rt, ctrl } = setup();
    const tabs = () => [...ctrl._tabs.querySelectorAll("[role=tab]")];
    assert.deepEqual(plain(tabs().map(t => t.textContent)), ["S", "T"]);
    assert.equal(tabs()[0].getAttribute("aria-selected"), "true");
    ctrl._tabs.dispatchEvent({ type: "click", target: tabs()[1] });
    assert.equal(ctrl.activeSheet, "T");
    rt.document.activeElement = tabs()[1];
    ctrl._tabs.dispatchEvent({ type: "keydown", key: "ArrowRight", target: tabs()[1], preventDefault() { } });
    assert.equal(ctrl.activeSheet, "S");
    rt.document.activeElement = tabs()[0];
    for (const key of ["End", "Home", "ArrowLeft"]) ctrl._tabs.dispatchEvent({ type: "keydown", key, target: rt.document.activeElement, preventDefault() { } });
    assert.equal(ctrl.activeSheet, "T");
    rt.document.activeElement = tabs()[1];
    ctrl._tabs.dispatchEvent({ type: "keydown", key: "F2", target: tabs()[1], preventDefault() { } });
    const input = ctrl._tabs.querySelector(".wx-spreadsheet-tab-input");
    assert.ok(input);
    input.value = "Tee";
    input.dispatchEvent({ type: "keydown", key: "Enter", preventDefault() { } });
    assert.deepEqual(plain(ctrl.sheets.map(s => s.name)), ["S", "Tee"]);
    ctrl._renameTab(tabs()[0]);
    const second = ctrl._tabs.querySelector(".wx-spreadsheet-tab-input");
    second.value = "Tee";
    second.dispatchEvent({ type: "blur" });
    assert.equal(ctrl.sheets[0].name, "S", "a taken name is refused");
    ctrl._renameTab(tabs()[0]);
    ctrl._tabs.querySelector(".wx-spreadsheet-tab-input").dispatchEvent({ type: "keydown", key: "Escape", preventDefault() { } });
    ctrl._tabs.dispatchEvent({ type: "dragstart", target: tabs()[1], dataTransfer: { setData() { } } });
    ctrl._tabs.dispatchEvent({ type: "dragover", preventDefault() { } });
    ctrl._tabs.dispatchEvent({ type: "drop", target: tabs()[0], preventDefault() { } });
    assert.deepEqual(plain(ctrl.sheets.map(s => s.name)), ["Tee", "S"]);
    ctrl._tabs.dispatchEvent({ type: "dblclick", target: tabs()[0] });
    ctrl._tabs.querySelector(".wx-spreadsheet-tab-input").dispatchEvent({ type: "keydown", key: "Escape", preventDefault() { } });
    rt.document.activeElement = tabs()[0];
    ctrl._tabs.dispatchEvent({ type: "keydown", key: "Delete", target: tabs()[0], preventDefault() { } });
    assert.deepEqual(plain(ctrl.sheets.map(s => s.name)), ["S"]);
    ctrl._tabs.dispatchEvent({ type: "keydown", key: "x", target: rt.document.body, preventDefault() { } });
});

test("the tab menu duplicates, moves and deletes sheets", () => {
    const { rt, ctrl } = setup();
    const tab = ctrl._tabs.querySelector("[data-sheet]");
    ctrl._tabs.dispatchEvent({ type: "contextmenu", target: tab, clientX: 5, clientY: 5, preventDefault() { } });
    const items = () => [...ctrl._menu.querySelectorAll("[role=menuitem]")];
    assert.equal(ctrl._menu.hidden, false);
    items()[1].click();
    assert.deepEqual(plain(ctrl.sheets.map(s => s.name)), ["S", "S (2)", "T"]);
    ctrl._openTabMenu(ctrl._tabs.querySelector("[data-sheet]"), 0, 0);
    items()[3].click();
    assert.deepEqual(plain(ctrl.sheets.map(s => s.name)), ["S (2)", "S", "T"]);
    ctrl._openTabMenu(ctrl._tabs.querySelectorAll("[data-sheet]")[1], 0, 0);
    items()[2].click();
    assert.deepEqual(plain(ctrl.sheets.map(s => s.name)), ["S", "S (2)", "T"]);
    ctrl._openTabMenu(ctrl._tabs.querySelectorAll("[data-sheet]")[2], 0, 0);
    items()[4].click();
    assert.deepEqual(plain(ctrl.sheets.map(s => s.name)), ["S", "S (2)"]);
    ctrl._openTabMenu(ctrl._tabs.querySelector("[data-sheet]"), 0, 0);
    items()[0].click();
    assert.ok(ctrl._tabs.querySelector(".wx-spreadsheet-tab-input"));
    rt.document.activeElement = ctrl._tabs.querySelector("[data-sheet]");
});

test("the context menu offers the actions and is operated by keyboard", () => {
    const { rt, ctrl, grid, press } = setup();
    const p = cellPoint(ctrl, 1, 1);
    ctrl._onContextMenu(pointerOn(grid, p.x, p.y, { type: "contextmenu" }));
    assert.equal(ctrl.selection.active, "B2", "a right click outside the selection selects the cell");
    const labels = [...ctrl._menu.querySelectorAll("[role=menuitem]")].map(b => b.textContent);
    assert.ok(labels.some(l => l.startsWith("Insert rows above")));
    rt.document.activeElement = ctrl._menu.querySelector("button");
    for (const key of ["ArrowDown", "ArrowUp", "End", "Home"]) ctrl._menu.dispatchEvent({ type: "keydown", key, preventDefault() { } });
    ctrl._menu.dispatchEvent({ type: "keydown", key: "Escape", preventDefault() { } });
    assert.equal(ctrl._menu.hidden, true);
    press("F10", { shift: true });
    assert.equal(ctrl._menu.hidden, false);
    const insert = [...ctrl._menu.querySelectorAll("[role=menuitem]")].find(b => b.textContent.startsWith("Insert rows above"));
    insert.click();
    assert.equal(ctrl.getValue("A3"), 1, "the row was inserted above");
    press("ContextMenu");
    rt.document.dispatchEvent({ type: "pointerdown", target: rt.document.body });
    assert.equal(ctrl._menu.hidden, true);
});

test("in an open dialog the context menu opens inside it in the top layer, and the cell editor keeps the browser's menu", () => {
    const { rt, host, ctrl, grid, press } = setup();
    const dialog = rt.document.createElement("dialog");
    rt.document.body.appendChild(dialog);
    dialog.appendChild(host);
    dialog.setAttribute("open", "");
    const p = cellPoint(ctrl, 1, 1);
    ctrl._onContextMenu(pointerOn(grid, p.x, p.y, { type: "contextmenu" }));
    assert.equal(ctrl._menu.parentNode, dialog, "outside a modal dialog the menu would be inert");
    assert.ok(ctrl._menu.matches(":popover-open"), "and above the dialog");
    ctrl._menu.dispatchEvent({ type: "keydown", key: "Escape", preventDefault() { } });
    assert.ok(!ctrl._menu.matches(":popover-open"), "closing takes it out of the top layer");
    dialog.removeAttribute("open");
    press("ContextMenu");
    assert.equal(ctrl._menu.parentNode, rt.document.body, "without a dialog it lives on the body again");
    ctrl._closeMenu();

    press("F2");
    const e = pointerOn(ctrl._editor, p.x, p.y, { type: "contextmenu" });
    ctrl._onContextMenu(e);
    assert.equal(e.defaultPrevented, false, "the text being typed gets the browser's cut, copy and paste");
    assert.equal(ctrl._menu.hidden, true);
});

test("a menu that does not fit below the pointer opens above it, and never leaves the viewport", () => {
    const { ctrl } = setup();
    const menu = ctrl._menu;
    // the stub lays out nothing, so the menu gets the size a browser would measure (viewport 1024 x 768)
    Object.defineProperty(menu, "offsetHeight", { configurable: true, value: 300 });
    Object.defineProperty(menu, "offsetWidth", { configurable: true, value: 200 });
    const place = (x, y) => { ctrl._showMenu([{ label: "One", command: "copy" }], x, y); const at = [menu.style.left, menu.style.top]; ctrl._closeMenu(); return at; };
    assert.deepEqual(place(100, 200), ["100px", "200px"], "room below: at the pointer");
    assert.deepEqual(place(100, 700), ["100px", "400px"], "no room below: above the pointer");
    assert.deepEqual(place(1000, 200), ["820px", "200px"], "no room to the right: just inside the edge");
    Object.defineProperty(menu, "offsetHeight", { configurable: true, value: 900 });
    assert.deepEqual(place(100, 300), ["100px", "0px"], "taller than the viewport: from the top, scrolling inside");
});

test("comments are added, edited and removed through the comment editor", () => {
    const { ctrl, press } = setup({ "data-user-name": "Rene" });
    ctrl.select("B2");
    press("F2", { shift: true });
    const popup = ctrl._view.pane.querySelector(".wx-spreadsheet-comment-editor");
    assert.ok(popup);
    popup.querySelector("textarea").value = "Check this";
    popup.querySelectorAll("button")[2].click();
    assert.deepEqual({ text: ctrl.getComment("B2").text, author: ctrl.getComment("B2").author }, { text: "Check this", author: "Rene" });
    ctrl.execCommand("comment");
    const again = ctrl._view.pane.querySelector(".wx-spreadsheet-comment-editor");
    const area = again.querySelector("textarea");
    area.dispatchEvent({ type: "keydown", key: "Escape", preventDefault() { } });
    ctrl.execCommand("comment");
    const third = ctrl._view.pane.querySelector(".wx-spreadsheet-comment-editor");
    third.querySelectorAll("button")[0].click();
    assert.equal(ctrl.getComment("B2"), null);
    ctrl.execCommand("comment");
    const fourth = ctrl._view.pane.querySelector(".wx-spreadsheet-comment-editor");
    fourth.querySelector("textarea").value = "via keys";
    fourth.querySelector("textarea").dispatchEvent({ type: "keydown", key: "Enter", ctrlKey: true, preventDefault() { } });
    assert.equal(ctrl.getComment("B2").text, "via keys");
    fourth.querySelectorAll("button")[1]?.click();
});

test("the function list inserts a function", () => {
    const { ctrl } = setup();
    ctrl.select("G1");
    ctrl._functionButton.click();
    const item = [...ctrl._menu.querySelectorAll("[role=menuitem]")].find(b => b.textContent.startsWith("ABS"));
    item.click();
    assert.equal(ctrl._editor.value, "=ABS(");
    ctrl._cancelEdit();
});

test("zoom buttons and the zoom label change the scale", () => {
    const { ctrl } = setup();
    ctrl._zoomIn.click();
    assert.equal(ctrl.zoom, 1.1);
    ctrl._zoomOut.click(); ctrl._zoomOut.click();
    assert.equal(ctrl.zoom, 0.9);
    ctrl._zoomLabel.click();
    assert.equal(ctrl.zoom, 1);
    assert.equal(ctrl._zoomLabel.textContent, "100 %");
    ctrl.zoom = 9;
    assert.equal(ctrl.zoom, 4);
});

test("Tab at the edge of the sheet leaves the grid, so it is no keyboard trap", () => {
    const { ctrl, press, at } = setup();
    ctrl.select("T1");
    assert.equal(press("Tab").defaultPrevented, false);
    assert.equal(at(), "T1");
    ctrl.select("A1");
    assert.equal(press("Tab", { shift: true }).defaultPrevented, false);
    assert.equal(press("Tab").defaultPrevented, true);
});
