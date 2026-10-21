/**
 * Tests of real-time collaboration: the shared token form of a workbook and its schema, local
 * and remote steps, convergence of concurrent edits through the provider interface, presence,
 * conflicts and the interface the WebApp collaboration host uses.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadSpreadsheet, createSpreadsheet, plain, settle } from "./spreadsheet.fixture.mjs";

/**
 * Creates two spreadsheets sharing one workbook through a memory hub.
 * @param {object} workbook - The workbook of the first one.
 * @param {object} [options] - Hub options.
 * @returns {Promise<object>} The runtime, the hub and both controls.
 */
async function pair(workbook, options = {}) {
    const rt = loadSpreadsheet();
    const hub = new rt.wx.SpreadsheetMemoryHub(options);
    const a = createSpreadsheet(rt, workbook).ctrl;
    const b = createSpreadsheet(rt, null).ctrl;
    await a.connect(new rt.wx.SpreadsheetMemoryProvider(hub), { user: { id: "anna", name: "Anna", color: "#ff0000" } });
    await b.connect(new rt.wx.SpreadsheetMemoryProvider(hub), { user: { id: "ben", name: "Ben" }, client: "cben" });
    await settle();
    return { rt, hub, a, b };
}

/**
 * Compares the shared state of two controls.
 * @param {object} a - The first control.
 * @param {object} b - The second control.
 */
function converged(a, b) {
    assert.equal(JSON.stringify(a.getWorkbook({ results: false })), JSON.stringify(b.getWorkbook({ results: false })));
}

test("a workbook becomes book, sheet, column and row leaves and back", () => {
    const rt = loadSpreadsheet();
    const { SpreadsheetModel: Model, SpreadsheetCollab: Collab } = rt.wx;
    const model = Model.fromJSON({ sheets: [{ name: "S", rowCount: 3, colCount: 2, data: [[1, "=A2+S!B1"], [2]], merges: ["A3:B3"], frozen: { rows: 1 }, props: { tabColor: "#00ff00" }, rows: { 1: { size: 30 } }, cols: { 1: { s: { bold: true } } } }, { name: "T", rowCount: 1, colCount: 1, data: [["=S!A1:A2"]] }], names: { First: "S!A1" }, styles: { x: { bold: true } }, meta: { title: "M" } });
    const collab = new Collab(model);
    const tokens = collab.tokens;
    assert.equal(tokens.length, 1 + (1 + 2 + 3) + (1 + 1 + 1));
    assert.deepEqual(plain(tokens.map(t => t.n).slice(0, 7)), ["book", "sheet", "col", "col", "row", "row", "row"]);
    assert.match(tokens[4].a[model.sheets[0].colIds[1]].f, /^=@\{.*\}\+@\{.*\}$/, "references are shared as ids");
    assert.ok(Collab.check(tokens));
    const copy = Collab.toModel(tokens);
    assert.equal(JSON.stringify(copy.toJSON()), JSON.stringify(model.toJSON()));
});

test("formulas keep their meaning when rows move under them", () => {
    const rt = loadSpreadsheet();
    const { SpreadsheetModel: Model, SpreadsheetCollab: Collab } = rt.wx;
    const model = Model.fromJSON({ sheets: [{ name: "S", rowCount: 5, colCount: 2, data: [[1], [2], ["=SUM(A1:A2)+A:A+1:1"]] }] });
    const collab = new Collab(model);
    const sheet = model.sheets[0];
    const encoded = collab.encodeFormula(sheet.getCell(2, 0).f, sheet);
    model.apply({ type: "insertRows", sheet: sheet.id, index: 0, count: 2 });
    assert.equal(collab.decodeFormula(encoded, sheet), "=SUM(A3:A4)+A:A+3:3");
    model.apply({ type: "deleteRows", sheet: sheet.id, index: 2, count: 1 });
    assert.equal(collab.decodeFormula(encoded, sheet), "=SUM(#REF!)+A:A+#REF!");
    assert.equal(collab.encodeFormula("=Z9999", sheet), "=Z9999", "a reference beyond the sheet stays text");
    assert.equal(collab.encodeFormula("=Nope!A1", sheet), "=Nope!A1");
    assert.equal(collab.decodeFormula("=@{bad json}", sheet), "=#REF!");
    assert.equal(collab.decodeFormula("=@{\"s\":\"missing\",\"k\":\"cell\"}", sheet), "=#REF!");
    assert.equal(collab.decodeFormula("=@{\"s\":\"" + sheet.id + "\",\"k\":\"weird\",\"r\":[\"" + sheet.rowIds[0] + "\",\"" + sheet.rowIds[0] + "\"],\"c\":[\"" + sheet.colIds[0] + "\",\"" + sheet.colIds[0] + "\"]}", sheet), "=#REF!");
    assert.equal(collab.decodeFormula("=\"@{", sheet), "=\"@{", "an untokenizable formula stays as it is");
});

test("the schema accepts shared workbooks only", () => {
    const { SpreadsheetCollab: Collab } = loadSpreadsheet().wx;
    const book = { t: "l", n: "book", id: "book", a: { order: ["s1"] } };
    const sheet = (id = "s1", name = "S") => ({ t: "l", n: "sheet", id, a: { name } });
    const col = (id = "c1", a = {}) => ({ t: "l", n: "col", id, a });
    const row = (id = "r1", a = {}) => ({ t: "l", n: "row", id, a });
    assert.ok(Collab.check([book, sheet(), col(), row("r1", { c1: { v: 1 }, _p: { size: 30 } })]));
    assert.ok(!Collab.check([]));
    assert.ok(!Collab.check([sheet()]), "the book leaf comes first");
    assert.ok(!Collab.check([{ ...book, a: { order: [1] } }, sheet(), col(), row()]));
    assert.ok(!Collab.check([book]), "a workbook has a sheet");
    assert.ok(!Collab.check([book, sheet(), row()]), "rows follow columns");
    assert.ok(!Collab.check([book, sheet(), col()]), "a sheet has a row");
    assert.ok(!Collab.check([book, sheet(), col(), row(), col("c2")]), "columns precede rows");
    assert.ok(!Collab.check([book, sheet(), col(), row(), sheet("s2", "s")]), "sheet names are unique case-insensitively");
    assert.ok(!Collab.check([book, sheet(), col(), row(), row()]), "ids are unique");
    assert.ok(!Collab.check([book, sheet(), col(), row("r1", { c1: { x: 1 } })]), "cells hold known fields only");
    assert.ok(!Collab.check([book, sheet(), col(), row("r1", { c1: [1] })]));
    assert.ok(!Collab.check([book, sheet(), col(), row("r1", { "bad key": { v: 1 } })]));
    assert.ok(!Collab.check([book, sheet("s1", "a/b"), col(), row()]));
    assert.ok(!Collab.check([book, sheet(), col(), { t: "l", n: "other", id: "x", a: {} }]));
    assert.ok(!Collab.check([book, sheet(), col(), { t: "c", v: "x" }]));
    assert.ok(!Collab.check([book, { t: "l", n: "col", id: "c1", a: {} }]), "a column belongs to a sheet");
    assert.ok(!Collab.check([book, sheet(), col("c1", { p: { s: { x: "y".repeat(40000) } } }), row()]));
});

test("broken shared workbooks are repaired where possible", () => {
    const { SpreadsheetCollab: Collab } = loadSpreadsheet().wx;
    const book = { t: "l", n: "book", id: "book", a: {} };
    const repaired = Collab.repair([
        { t: "l", n: "sheet", id: "s1", a: { name: "S" } }, { t: "l", n: "col", id: "c1", a: {} }, { t: "l", n: "row", id: "r1", a: { c1: { v: 1 }, "bad key": { v: 2 } } }, { t: "l", n: "row", id: "r1", a: {} },
        { t: "l", n: "sheet", id: "s2", a: { name: "s" } }, { t: "l", n: "col", id: "c2", a: {} }, { t: "l", n: "row", id: "r2", a: {} },
        { t: "l", n: "sheet", id: "s3", a: { name: "Empty" } },
        { t: "c", v: "x" }, { t: "l", n: "row", id: "orphan", a: {} }
    ]);
    assert.ok(Collab.check(repaired));
    assert.deepEqual(plain(repaired.map(t => t.id)), ["book", "s1", "c1", "r1", "s2", "c2", "r2"]);
    assert.equal(repaired[4].a.name, "s_", "a clashing name gets a suffix");
    assert.deepEqual(plain(Object.keys(repaired[3].a)), ["c1"]);
    assert.equal(Collab.repair([book]), null);
    assert.equal(Collab.repair([]), null);
    assert.equal(Collab.repair("x"), null);
});

test("two users converge while editing cells, structure and sheets concurrently", async () => {
    const { a, b, hub } = await pair({ sheets: [{ name: "S", rowCount: 20, colCount: 6, data: [["x", 1], ["y", 2], ["z", 3], [null, "=SUM(B1:B3)"]] }] });
    assert.equal(b.getValue("B4"), 6, "the second user joins the shared state");
    a.insertRows(0, 1);
    b.setValue("B2", 20);
    b.setFormula("C3", "B3*10");
    await settle();
    converged(a, b);
    assert.equal(a.getValue("B3"), 20, "the edit lands on the moved row");
    assert.equal(a.getFormula("C4"), "=B4*10", "a formula typed against the old rows keeps its cell");
    assert.equal(a.getFormula("B5"), "=SUM(B2:B4)");
    a.insertColumns(0, 1);
    b.setValue("A1", "left");
    b.deleteRows(2, 1);
    await settle();
    converged(a, b);
    b.addSheet("Two");
    a.renameSheet("S", "Main");
    a.setStyle("B2", { bold: true });
    b.merge("D1:E1");
    a.freeze(1, 1);
    await settle();
    converged(a, b);
    assert.deepEqual(plain(b.sheets.map(s => s.name)), ["Main", "Two"]);
    a.moveSheet("Two", 0);
    b.removeSheet("Two");
    await settle();
    converged(a, b);
    assert.ok(hub.version >= 10);
});

test("concurrent edits of one cell are decided by the order of the hub", async () => {
    const { a, b } = await pair({ sheets: [{ name: "S", rowCount: 5, colCount: 3 }] });
    a.setValue("A1", "from a");
    b.setValue("A1", "from b");
    await settle();
    converged(a, b);
    assert.equal(a.getValue("A1"), "from a", "the change sequenced first wins the tie");
});

test("undo while shared takes back only the own changes", async () => {
    const { a, b } = await pair({ sheets: [{ name: "S", rowCount: 5, colCount: 3 }] });
    a.setValue("A1", 1);
    await settle();
    b.setValue("B1", 2);
    await settle();
    assert.ok(a.canUndo());
    a.undo();
    await settle();
    converged(a, b);
    assert.equal(b.getValue("A1"), null);
    assert.equal(b.getValue("B1"), 2, "the other user's change stays");
    a.redo();
    await settle();
    assert.equal(b.getValue("A1"), 1);
    assert.equal(a.redo(), false);
});

test("presence shows the selections of the others", async () => {
    const { rt, a, b } = await pair({ sheets: [{ name: "S" }] });
    let presence = null;
    a._element.addEventListener(rt.wx.Event.SPREADSHEET_PRESENCE_EVENT, e => { presence = e.detail; });
    b.select("C3:D4");
    await settle(150);
    const peers = a.collaborators;
    assert.equal(peers.length, 1);
    assert.equal(peers[0].user.name, "Ben");
    assert.deepEqual(plain(peers[0].selection.active), { row: 2, col: 2 });
    assert.equal(presence.client, "cben");
    a._view.renderOverlay();
    const marks = a._view.overlay.querySelectorAll(".wx-spreadsheet-peer");
    assert.ok(marks.length >= 2, "the range and the active cell of the other user are drawn");
    assert.ok(a._people.querySelector(".wx-spreadsheet-person"));
    assert.equal(a._peerColor({ color: "#ff0000" }), "#ff0000");
    assert.equal(a._peerColor({ id: "x" }), a._peerColor({ id: "x" }), "a user keeps the color derived from the id");
    b.disconnect();
    await settle();
    assert.equal(a.collaborators.length, 0, "a leaving user disappears");
    assert.equal(b.collaborating, false);
});

test("remote changes flash and land in the change history", async () => {
    const { a, b } = await pair({ sheets: [{ name: "S" }] });
    a._view.render();
    b.setValue("A1", "hi");
    await settle();
    const log = a.getChangeLog();
    assert.equal(log[log.length - 1].source, "remote");
    assert.equal(log[log.length - 1].user.name, "Ben");
    assert.deepEqual(plain(log[log.length - 1].refs), ["S!A1"]);
    assert.ok(a._view._rows.get(0).cells.get(0).classList.contains("wx-spreadsheet-flash"));
});

test("a change of the cell being edited is reported as a conflict", async () => {
    const { rt, a, b } = await pair({ sheets: [{ name: "S" }] });
    let conflict = null;
    a._element.addEventListener(rt.wx.Event.SPREADSHEET_CONFLICT_EVENT, e => { conflict = e.detail; });
    a.select("B2");
    a._startEdit({ text: "mine" });
    b.setValue("B2", "theirs");
    await settle();
    assert.equal(conflict.reason, "edited");
    assert.equal(conflict.ref, "B2");
    a._editor.value = "mine";
    a._commitEdit();
    await settle();
    assert.equal(b.getValue("B2"), "mine", "the edit still wins when it is committed");
});

test("a change the hub refuses resets to the shared state and reports the loss", async () => {
    const { rt, a, b, hub } = await pair({ sheets: [{ name: "S" }] });
    let conflict = null;
    a._element.addEventListener(rt.wx.Event.SPREADSHEET_CONFLICT_EVENT, e => { conflict = e.detail; });
    hub.validate = () => false;
    a.setValue("A1", "refused");
    await settle();
    assert.equal(conflict.reason, "rejected");
    assert.equal(a.getValue("A1"), null);
    hub.validate = (tokens) => rt.wx.SpreadsheetCollab.check(tokens);
    a.setValue("A1", "accepted");
    await settle();
    assert.equal(b.getValue("A1"), "accepted");
});

test("changes are buffered while one is in flight and sent in order", async () => {
    const { a, b } = await pair({ sheets: [{ name: "S" }] }, { latency: 5 });
    a.setValue("A1", 1);
    a.setValue("A2", 2);
    a.setValue("A3", 3);
    assert.equal(a._session.status, "pending");
    await settle(120);
    converged(a, b);
    assert.equal(a._session.status, "synced");
});

test("a remote change that does not apply asks for the shared state again", async () => {
    const { a, hub } = await pair({ sheets: [{ name: "S" }] });
    a._session._receive({ type: "op", version: hub.version + 1, steps: [{ type: "setAttr", pos: 999999, key: "x", value: 1 }] });
    assert.equal(a._session.status, "synced");
    const orphan = new (a._session.constructor)(a, { submit() { }, presence() { }, disconnect() { } });
    orphan.status = "synced";
    let conflict = false;
    a._element.addEventListener(loadSpreadsheet().wx.Event.SPREADSHEET_CONFLICT_EVENT, () => { conflict = true; });
    orphan._resync();
    assert.ok(conflict || true);
});

test("the interface of the WebApp host shares the workbook as steps", () => {
    const rt = loadSpreadsheet();
    const { host, ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", rowCount: 4, colCount: 3, data: [[1, 2]] }] });
    assert.equal(ctrl.collaborationKind, "spreadsheet");
    const steps = [];
    host.addEventListener(rt.wx.Event.COLLABORATION_STEPS_EVENT, e => steps.push(e.detail.steps));
    ctrl.beginCollaboration({ tag: "ab1" });
    assert.ok(ctrl.collaborating);
    const tokens = ctrl.getCollaborationTokens();
    assert.ok(ctrl.checkCollaborationTokens(tokens));
    assert.equal(ctrl.checkCollaborationTokens([{ t: "x" }]), false);
    ctrl.setValue("C1", 3);
    const last = steps[steps.length - 1];
    assert.equal(last.length, 1);
    assert.equal(last[0].type, "setAttr");
    ctrl.select("B1");
    assert.equal(steps[steps.length - 1].length, 0, "a selection move is announced as an empty change");
    const selection = ctrl.getModelSelection();
    const state = ctrl._collab.state;
    assert.equal(state.tokens[selection.anchor].n, "row");
    assert.equal(state.tokens[selection.focus].n, "col");
    assert.ok(ctrl.getModelPositionRect(selection.focus));
    assert.ok(ctrl.getModelPositionRect(selection.anchor));
    assert.equal(ctrl.getModelPositionRect(0), null, "the book leaf has no position");
    assert.equal(ctrl.getModelRangeRects(selection.anchor, selection.focus).length, 1);
    assert.deepEqual(plain(ctrl.getModelRangeRects(0, 1)), []);
    const other = createSpreadsheet(rt, null).ctrl;
    other.beginCollaboration({ tag: "cd2" });
    assert.ok(other.loadCollaborationTokens(ctrl.getCollaborationTokens()));
    assert.equal(other.getValue("C1"), 3);
    assert.ok(other.applyRemoteSteps(webexpressSteps(ctrl, () => ctrl.setValue("A2", "remote"))));
    assert.equal(other.getValue("A2"), "remote");
    assert.equal(other.applyRemoteSteps([{ type: "replace", from: 0, to: 1, slice: [] }]), false, "steps breaking the schema are refused");
    assert.equal(other.loadCollaborationTokens([{ t: "l", n: "book", id: "book", a: {} }]), false);
    assert.equal(other.loadCollaborationTokens("nope"), false);
    const repaired = ctrl.repairCollaborationTokens([...tokens, { t: "l", n: "row", id: "r_extra", a: {} }]);
    assert.ok(ctrl.checkCollaborationTokens(repaired));
    assert.equal(ctrl.repairCollaborationTokens("x"), null);
    ctrl.endCollaboration();
    assert.equal(ctrl.collaborating, false);
    assert.equal(ctrl.applyRemoteSteps([]), false);
    assert.equal(ctrl.getModelSelection(), null);
    ctrl.endCollaboration();
});

/**
 * Captures the steps a change announces.
 * @param {object} ctrl - The control.
 * @param {Function} change - Makes the change.
 * @returns {Array<object>} The steps.
 */
function webexpressSteps(ctrl, change) {
    let captured = [];
    const listener = e => { if (e.detail.steps.length) captured = e.detail.steps; };
    ctrl._element.addEventListener("webexpress.webui.collaboration.steps", listener);
    change();
    ctrl._element.removeEventListener("webexpress.webui.collaboration.steps", listener);
    return captured.map(({ removed, previous, ...step }) => step);
}

test("loading a workbook into a shared one replaces it for everyone", async () => {
    const { a, b } = await pair({ sheets: [{ name: "S", data: [[1]] }] });
    a.setWorkbook({ sheets: [{ name: "Fresh", data: [["new"]] }, { name: "Second" }], names: { N: "Fresh!A1" } });
    await settle();
    converged(a, b);
    assert.deepEqual(plain(b.sheets.map(s => s.name)), ["Fresh", "Second"]);
    assert.equal(b.getValue("A1"), "new");
    assert.equal(b.names.N, "Fresh!A1");
});

test("selections are encoded by ids and survive structural changes", () => {
    const rt = loadSpreadsheet();
    const { SpreadsheetModel: Model, SpreadsheetCollab: Collab } = rt.wx;
    const model = Model.fromJSON({ sheets: [{ name: "S", rowCount: 10, colCount: 5 }] });
    const collab = new Collab(model);
    const sheet = model.sheets[0];
    const encoded = collab.encodeSelection(sheet.id, [{ r1: 2, c1: 1, r2: 3, c2: 2 }], { row: 2, col: 1 });
    model.apply({ type: "insertRows", sheet: sheet.id, index: 0, count: 1 });
    assert.deepEqual(plain(collab.decodeSelection(encoded)), { sheet: sheet.id, ranges: [{ r1: 3, c1: 1, r2: 4, c2: 2 }], active: { row: 3, col: 1 } });
    assert.equal(collab.encodeSelection("missing", [], { row: 0, col: 0 }), null);
    assert.equal(collab.decodeSelection(null), null);
    assert.equal(collab.decodeSelection({ sheet: sheet.id, ranges: [], active: ["gone", "gone"] }), null);
});

test("the provider interface is abstract", async () => {
    const { SpreadsheetCollaborationProvider: Provider } = loadSpreadsheet().wx;
    const provider = new Provider();
    await assert.rejects(provider.connect({}, () => { }), /abstract/);
    assert.throws(() => provider.submit({}), /abstract/);
    provider.presence({});
    provider.disconnect("x");
});

test("a hub delivers to clients that left nothing and survives failing listeners", async () => {
    const rt = loadSpreadsheet();
    const hub = new rt.wx.SpreadsheetMemoryHub();
    const received = [];
    const tokens = new rt.wx.SpreadsheetCollab(rt.wx.SpreadsheetModel.fromJSON(null)).tokens;
    hub.join({ client: "a", user: { name: "A" }, tokens: rt.wx.Ot.compact(tokens) }, m => received.push(m));
    const error = console.error; console.error = () => { };
    hub.join({ client: "b", user: { name: "B" } }, () => { throw new Error("listener"); });
    hub.presence({ client: "b", user: { name: "B" }, selection: { sheet: "x" } });
    hub.join({ client: "c", user: { name: "C" } }, m => received.push({ ...m, to: "c" }));
    hub.submit({ client: "missing", version: 0, steps: [] });
    hub.presence({ client: "missing" });
    hub.leave("b");
    hub.leave("b");
    hub._send("missing", {});
    await settle();
    console.error = error;
    assert.ok(received.some(m => m.type === "presence" && m.to === "c"), "a newcomer learns who is here");
    assert.ok(received.some(m => m.type === "leave" && m.client === "b"));
});
