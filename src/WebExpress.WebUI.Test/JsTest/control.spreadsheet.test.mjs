/**
 * Headless contract test for the SpreadsheetCtrl control (wx-webui-spreadsheet): registration,
 * construction and teardown, and the field side of the control contract.
 */
import { test } from "node:test";
import assert from "node:assert";
import { contract } from "./controls.contract.mjs";
import { SPREADSHEET_FILES, loadSpreadsheet, createSpreadsheet } from "./spreadsheet.fixture.mjs";

contract({
    file: "webexpress.webui.spreadsheet.js",
    deps: SPREADSHEET_FILES.slice(0, SPREADSHEET_FILES.indexOf("webexpress.webui.spreadsheet.js")),
    selector: "wx-webui-spreadsheet",
    ctrl: "SpreadsheetCtrl"
});

test("the host is rebuilt into toolbar, formula bar, grid, tabs and status bar", () => {
    const rt = loadSpreadsheet();
    const { host, ctrl } = createSpreadsheet(rt, { sheets: [{ name: "Data", data: [[1, 2]] }] }, { name: "book" });
    assert.ok(host.classList.contains("wx-spreadsheet"));
    assert.equal(host.querySelector(".wx-spreadsheet-toolbar").getAttribute("role"), "toolbar");
    assert.ok(host.querySelector(".wx-spreadsheet-formulabar"));
    assert.equal(ctrl._view.viewport.getAttribute("role"), "grid");
    assert.equal(host.querySelector(".wx-spreadsheet-tabs").getAttribute("role"), "tablist");
    assert.ok(host.querySelector(".wx-spreadsheet-status"));
    const input = host.querySelector("input[name=book]");
    assert.ok(input, "the form name moves to a hidden input");
    assert.equal(JSON.parse(input.value).sheets[0].cells.B1.v, 2);
});

test("options hide the chrome and make the workbook read-only", () => {
    const rt = loadSpreadsheet();
    const { host, ctrl } = createSpreadsheet(rt, null, { "data-toolbar": "false", "data-formula-bar": "false", "data-sheet-tabs": "false", "data-status-bar": "false", "data-readonly": "true", "data-rows": "50", "data-cols": "5", "data-zoom": "150" });
    assert.equal(host.querySelector(".wx-spreadsheet-toolbar").hidden, true);
    assert.equal(host.querySelector(".wx-spreadsheet-formulabar").hidden, true);
    assert.equal(host.querySelector(".wx-spreadsheet-tabbar").hidden, true);
    assert.equal(host.querySelector(".wx-spreadsheet-status").hidden, true);
    assert.equal(ctrl.readOnly, true);
    assert.equal(ctrl.sheet.rowCount, 50);
    assert.equal(ctrl.sheet.colCount, 5);
    assert.equal(ctrl.zoom, 1.5);
    assert.equal(ctrl.setValue("A1", 1), false, "a read-only spreadsheet refuses changes");
    assert.equal(ctrl._view.viewport.getAttribute("aria-readonly"), "true");
});

test("a broken initial value renders an empty workbook instead of failing", () => {
    const rt = loadSpreadsheet();
    const warn = console.warn; console.warn = () => { };
    try {
        const { ctrl } = createSpreadsheet(rt, "{ not json");
        assert.equal(ctrl.sheets.length, 1);
        assert.equal(ctrl.empty, true);
    } finally { console.warn = warn; }
});

test("the value round-trips and writing it back announces nothing", () => {
    const rt = loadSpreadsheet();
    const { host, ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [[1, "=A1*2"]] }] });
    let announced = 0;
    host.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, () => announced++);
    const value = ctrl.value;
    assert.equal(JSON.parse(value).sheets[0].cells.B1.r, 2, "formula results travel with the value");
    ctrl.value = value;
    assert.equal(announced, 0);
    assert.equal(ctrl.dirty, false);
    ctrl.setValue("A1", 5);
    assert.equal(announced, 1);
    assert.equal(ctrl.dirty, true);
    ctrl.reset();
    assert.equal(ctrl.getValue("A1"), 1);
    ctrl.setValue("A1", 7);
    ctrl.markPristine();
    assert.equal(ctrl.dirty, false);
});

test("the change event detail reads the value lazily", () => {
    const rt = loadSpreadsheet();
    const { host, ctrl } = createSpreadsheet(rt);
    let detail = null;
    host.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, e => { detail = e.detail; });
    ctrl.setValue("C3", "x");
    assert.equal(detail.sender, host);
    assert.equal(JSON.parse(detail.value).sheets[0].cells.C3.v, "x");
});

test("a disabled fieldset or the disabled attribute disables the spreadsheet", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, null, { "data-disabled": "true" });
    assert.equal(ctrl.disabled, true);
    assert.equal(ctrl.readOnly, true);
    ctrl.disabled = false;
    assert.equal(ctrl.disabled, false);
    assert.equal(ctrl._view.viewport.inert, false);
});

test("teardown releases the menu, the session and the cut marker", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt);
    ctrl._prepareCopy(true);
    assert.ok(rt.wx.SpreadsheetClipboard._cut);
    const menu = ctrl._menu;
    ctrl.destroy();
    assert.equal(menu.parentNode, null);
    assert.equal(rt.wx.SpreadsheetClipboard._cut, null);
    ctrl.destroy();
});

test("the form posts the workbook on submit", () => {
    const rt = loadSpreadsheet();
    const form = rt.createElement("form");
    rt.document.body.appendChild(form);
    const host = rt.createElement("div");
    host.classList.add("wx-webui-spreadsheet");
    host.setAttribute("name", "book");
    form.appendChild(host);
    rt.wx.Controller.createInstances(host);
    const ctrl = rt.wx.Controller.getInstanceByElement(host);
    ctrl.setValue("A1", "42");
    const input = host.querySelector("input[name=book]");
    input.value = "";
    form.dispatchEvent({ type: "submit" });
    assert.equal(JSON.parse(input.value).sheets[0].cells.A1.v, 42);
});
