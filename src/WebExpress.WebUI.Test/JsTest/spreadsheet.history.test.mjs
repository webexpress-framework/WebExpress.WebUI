/**
 * Tests of undo and redo: every kind of change is undone exactly, related changes merge, the
 * history is configurable, and undo restores the selection.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadSpreadsheet, createSpreadsheet, keyOn, plain } from "./spreadsheet.fixture.mjs";

test("values, formulas, formats and structure are undone and redone", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [[1, 2, "=A1+B1"]] }] });
    const snapshot = () => JSON.stringify(ctrl.getWorkbook({ results: false }));
    const states = [snapshot()];
    ctrl.setValue("A1", 10); states.push(snapshot());
    ctrl.setFormula("D1", "C1*2"); states.push(snapshot());
    ctrl.select("A1:C1"); ctrl.toggleStyle("bold"); states.push(snapshot());
    ctrl.insertRows(0, 2); states.push(snapshot());
    ctrl.deleteColumns(1, 1); states.push(snapshot());
    ctrl.merge("A5:B6"); states.push(snapshot());
    ctrl.addSheet("Two"); states.push(snapshot());
    ctrl.renameSheet("Two", "Zwei"); states.push(snapshot());
    for (let i = states.length - 1; i > 0; i--) {
        assert.ok(ctrl.undo());
        assert.equal(snapshot(), states[i - 1], "undo step " + i);
    }
    assert.equal(ctrl.undo(), false);
    for (let i = 1; i < states.length; i++) {
        assert.ok(ctrl.redo());
        assert.equal(snapshot(), states[i], "redo step " + i);
    }
    assert.equal(ctrl.redo(), false);
    assert.equal(ctrl.getFormula("B3", "S"), "=A3+#REF!", "the deleted column left its mark in the redone formula");
});

test("a new change discards the redo branch", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt);
    ctrl.setValue("A1", 1);
    ctrl.setValue("A1", 2);
    ctrl.undo();
    assert.ok(ctrl.canRedo());
    ctrl.setValue("B1", 3);
    assert.equal(ctrl.canRedo(), false);
    assert.deepEqual(plain(ctrl.history.labels().undo), ["setValue", "setValue"]);
});

test("changes with the same merge key merge within the window", () => {
    let now = 0;
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [[1.5]] }] });
    ctrl._history._now = () => now;
    ctrl.select("A1");
    ctrl.execCommand("decimalincrease");
    now += 300;
    ctrl.execCommand("decimalincrease");
    assert.equal(ctrl.getStyle("A1").nf, "0.000");
    assert.equal(ctrl.history.labels().undo.length, 1, "two quick clicks are one step");
    now += 5000;
    ctrl.execCommand("decimaldecrease");
    assert.equal(ctrl.history.labels().undo.length, 2, "a pause starts a new step");
    ctrl.undo();
    ctrl.undo();
    assert.equal(ctrl.getStyle("A1").nf, undefined);
});

test("a selection change ends merging", () => {
    let now = 0;
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt);
    ctrl._history._now = () => now;
    ctrl.setColumnWidth(0, 120);
    ctrl.select("B2");
    ctrl.setColumnWidth(0, 140);
    assert.equal(ctrl.history.labels().undo.length, 2);
});

test("the history keeps its configured number of steps", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, null, { "data-history-limit": "3", "data-history-merge": "0" });
    for (let i = 1; i <= 5; i++) ctrl.setValue("A1", i);
    assert.equal(ctrl.history.limit, 3);
    assert.equal(ctrl.history.mergeWindow, 0);
    while (ctrl.undo()) { /* undo as far as the history reaches */ }
    assert.equal(ctrl.getValue("A1"), 2);
    ctrl.clearHistory();
    assert.equal(ctrl.canUndo(), false);
});

test("a batch is one undo step and one change event", () => {
    const rt = loadSpreadsheet();
    const { host, ctrl } = createSpreadsheet(rt);
    let changes = 0;
    host.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, () => changes++);
    assert.ok(ctrl.batch(() => {
        ctrl.setValue("A1", 1);
        ctrl.setValue("A2", 2);
        ctrl.batch(() => ctrl.setFormula("A3", "A1+A2"));
    }, "fill in"));
    assert.equal(changes, 1);
    assert.equal(ctrl.getValue("A3"), 3, "results are current inside the batch");
    assert.deepEqual(plain(ctrl.history.labels().undo), ["fill in"]);
    ctrl.undo();
    assert.equal(ctrl.empty, true);
    assert.equal(ctrl.batch(() => { }), false, "an empty batch records nothing");
});

test("undo restores the selection and announces itself", () => {
    const rt = loadSpreadsheet();
    const { host, ctrl } = createSpreadsheet(rt);
    const events = [];
    host.addEventListener(rt.wx.Event.SPREADSHEET_UNDO_EVENT, e => events.push(["undo", e.detail.label]));
    host.addEventListener(rt.wx.Event.SPREADSHEET_REDO_EVENT, e => events.push(["redo", e.detail.label]));
    ctrl.select("C3");
    ctrl.setValue("C3", "x");
    ctrl.select("A1");
    ctrl.undo();
    assert.equal(ctrl.selection.active, "C3");
    ctrl.redo();
    assert.deepEqual(plain(events), [["undo", "setValue"], ["redo", "setValue"]]);
});

test("the keyboard and the toolbar reach the history", () => {
    const rt = loadSpreadsheet();
    const { host, ctrl } = createSpreadsheet(rt);
    const grid = ctrl._view.viewport;
    ctrl.setValue("A1", 1);
    const undo = host.querySelector("button[data-command=undo]");
    assert.equal(undo.disabled, false);
    ctrl._onKeyDown(keyOn(grid, "z", { ctrl: true }));
    assert.equal(ctrl.getValue("A1"), null);
    assert.equal(undo.disabled, true);
    ctrl._onKeyDown(keyOn(grid, "y", { ctrl: true }));
    assert.equal(ctrl.getValue("A1"), 1);
    ctrl._onKeyDown(keyOn(grid, "z", { ctrl: true }));
    ctrl._onKeyDown(keyOn(grid, "z", { ctrl: true, shift: true }));
    assert.equal(ctrl.getValue("A1"), 1);
    host.querySelector("button[data-command=undo]").click();
    assert.equal(ctrl.getValue("A1"), null);
});

test("a history step that no longer applies clears the history instead of failing", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt);
    ctrl.addSheet("Temp");
    ctrl._history._undo[0].undo = { type: "removeSheet", sheet: "missing" };
    const warn = console.warn; console.warn = () => { };
    try { assert.equal(ctrl.undo(), false); } finally { console.warn = warn; }
    assert.equal(ctrl.canUndo(), false);
});

test("loading a workbook starts a new history", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt);
    ctrl.setValue("A1", 1);
    ctrl.setWorkbook({ sheets: [{ name: "New" }] });
    assert.equal(ctrl.canUndo(), false);
    assert.equal(ctrl.activeSheet, "New");
});
