/**
 * Tests of the clipboard formats - delimited text, HTML tables of Excel, Google Sheets and the
 * spreadsheet itself - and of copying, cutting and pasting through the control.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadSpreadsheet, createSpreadsheet, plain } from "./spreadsheet.fixture.mjs";

test("delimited text is written and parsed according to RFC 4180", () => {
    const { SpreadsheetClipboard: Clipboard } = loadSpreadsheet().wx;
    assert.equal(Clipboard.toTSV([["a", "b\tc"], ["x\ny", "q\"r"]]), "a\t\"b\tc\"\r\n\"x\ny\"\t\"q\"\"r\"");
    assert.equal(Clipboard.toDelimited([[" pad", 1, null]], ","), "\" pad\",1,");
    assert.deepEqual(plain(Clipboard.parseDelimited("a,b\r\n\"c,d\",\"e\"\"f\"\n")), [["a", "b"], ["c,d", "e\"f"]]);
    assert.deepEqual(plain(Clipboard.parseDelimited("﻿x;y;z\n1;2;3")), [["x", "y", "z"], ["1", "2", "3"]]);
    assert.deepEqual(plain(Clipboard.parseDelimited("a\tb\n\"m\nl\"\t2")), [["a", "b"], ["m\nl", "2"]]);
    assert.deepEqual(plain(Clipboard.parseDelimited("one")), [["one"]]);
    assert.deepEqual(plain(Clipboard.parseDelimited("a,b\n")), [["a", "b"]]);
    assert.equal(Clipboard.guessDelimiter("a;b,c;d"), ";");
    assert.equal(Clipboard.guessDelimiter("\"a;b\",c"), ",");
});

test("HTML tables are read with Excel classes, numbers and formulas", () => {
    const { SpreadsheetClipboard: Clipboard } = loadSpreadsheet().wx;
    const html = "<html><head><style><!--.xl65 {font-weight:700; mso-number-format:\"0\\.00\"; color:red} .xl66, td.xl67 {background:#FFFF00;text-align:center}--></style></head><body><table>"
        + "<tr><td class=\"xl65\" x:num=\"1250\">1.250,00</td><td x:fmla=\"=A1*2\" x:num=\"2500\">2500</td><td class=xl67 colspan=2 rowspan=\"2\">merged&nbsp;&amp;&lt;x&gt;</td></tr>"
        + "<tr><td x:bool=\"TRUE\">TRUE</td><td style=\"font-style:italic;text-decoration:underline line-through;font-family:'Courier New',monospace;font-size:16px;vertical-align:middle;white-space:pre-wrap;border-bottom:2px dashed rgb(255,0,0);border-top:none\">a<br>b</td></tr></table></body></html>";
    const parsed = Clipboard.parseHTML(html);
    assert.equal(parsed.payload, null);
    const [first, second] = parsed.rows;
    assert.equal(first[0].value, 1250);
    assert.deepEqual(plain(first[0].style), { bold: true, color: "red", nf: "0.00" });
    assert.equal(first[1].formula, "=A1*2");
    assert.equal(first[2].colspan, 2);
    assert.equal(first[2].rowspan, 2);
    assert.equal(first[2].text, "merged &<x>");
    assert.deepEqual(plain(first[2].style), { fill: "#ffff00", align: "center" });
    assert.equal(second[0].value, true);
    assert.equal(second[1].text, "a\nb");
    assert.deepEqual(plain(second[1].style), { font: "Courier New", size: 12, italic: true, underline: true, strike: true, wrap: true, valign: "middle", border: { bottom: "dashed #ff0000" } });
    assert.equal(Clipboard.parseHTML("<p>no table</p>"), null);
});

test("Google Sheets values and relative formulas are taken over", () => {
    const { SpreadsheetClipboard: Clipboard } = loadSpreadsheet().wx;
    const html = "<google-sheets-html-origin><table><tbody><tr>"
        + "<td data-sheets-value='{\"1\":3,\"3\":1250}'>1.250</td>"
        + "<td data-sheets-value='{\"1\":4,\"4\":false}'>FALSE</td>"
        + "<td data-sheets-value='{\"1\":2,\"2\":\"text\"}' data-sheets-formula=\"=R[0]C[-2]*2\">x</td>"
        + "<td data-sheets-value='broken'>raw</td></tr></tbody></table>";
    const [row] = Clipboard.parseHTML(html).rows;
    assert.equal(row[0].value, 1250);
    assert.equal(row[1].value, false);
    assert.equal(row[2].value, "text");
    assert.equal(row[2].r1c1, "=R[0]C[-2]*2");
    assert.equal(row[3].value, undefined);
    assert.equal(Clipboard.fromR1C1("=R[0]C[-2]-R[0]C[-1]+R1C1+RC+\"R1C1\"", 1, 3), "=B2-C2+$A$1+D2+\"R1C1\"");
    assert.equal(Clipboard.fromR1C1("=R[-5]C", 1, 0), null);
    assert.equal(Clipboard.fromR1C1("=SUMR1C1", 0, 0), "=SUMR1C1", "names containing R1C1 stay");
});

test("css is read into validated styles", () => {
    const { SpreadsheetClipboard: Clipboard } = loadSpreadsheet().wx;
    assert.deepEqual(plain(Clipboard.cssToStyle("font-weight:600;background-color:rgba(0,0,0,0);color:#AbC !important;border:1pt solid black")), { bold: true, color: "#abc", border: { top: "thin black", right: "thin black", bottom: "thin black", left: "thin black" } });
    assert.deepEqual(plain(Clipboard.cssToStyle("border-left:3px double #000;border-right:medium solid;mso-number-format:General")), { border: { right: "medium", left: "double #000" } });
    assert.equal(Clipboard.cssToStyle("background:white;text-align:start;white-space:normal"), null);
    assert.deepEqual(plain(Clipboard.cssToStyle("white-space:normal;overflow-wrap:break-word;vertical-align:top")), { wrap: true, valign: "top" });
    assert.equal(Clipboard._border("0px solid"), null);
    assert.equal(Clipboard.decode("&#65;&#x42;&unknown;&#0;"), "AB&unknown;");
});

test("the own format writes merges, formulas and styles into the HTML", () => {
    const { SpreadsheetClipboard: Clipboard } = loadSpreadsheet().wx;
    const payload = { v: 1, cells: [[{ f: "=1+1" }, null]], merges: [{ r1: 0, c1: 0, r2: 1, c2: 1 }] };
    const html = Clipboard.toHTML(payload, [[{ text: "2", style: { bold: true, border: { top: "thick #ff0000", left: "dotted" }, nf: "0\"x\"", wrap: true, valign: "top", font: "Arial", size: 12, underline: true, strike: true, italic: true, color: "#111", fill: "#222", align: "left" }, align: "right" }, { text: "hidden" }], [{ text: "" }, { text: "" }]]);
    assert.match(html, /data-wx-spreadsheet="\{&quot;v&quot;:1/);
    assert.match(html, /rowspan="2" colspan="2" data-formula="=1\+1"/);
    assert.match(html, /border-top:3px solid #ff0000/);
    assert.match(html, /border-left:1px dotted #000000/);
    assert.ok(!html.includes("hidden"), "cells under a merge are left out");
    assert.equal(Clipboard.parseHTML(html).payload.v, 1);
    assert.equal(Clipboard.styleToCss(null, "right"), "text-align:right");
});

test("the asynchronous clipboard writes rich formats and falls back to text", async () => {
    const written = [];
    const rt = loadSpreadsheet({ globals: { navigator: { language: "en", clipboard: { writeText: async (t) => written.push(["text", t]), write: async (items) => { if (items[0].types.length > 2) throw new Error("no custom"); written.push(["rich", items[0].types]); }, read: async () => [{ types: ["text/plain", "text/html", "web application/x-webexpress-spreadsheet", "image/png"], getType: async (type) => ({ text: async () => "content:" + type }) }] } }, ClipboardItem: class { constructor(items) { this.types = Object.keys(items); } }, Blob: class { constructor(parts) { this.parts = parts; } } } });
    const Clipboard = rt.wx.SpreadsheetClipboard;
    assert.equal(await Clipboard.write({ text: "t", html: "<table></table>", json: "{}" }), true);
    assert.deepEqual(plain(written), [["rich", ["text/plain", "text/html"]]], "a browser without custom formats gets text and HTML");
    const read = await Clipboard.read();
    assert.equal(read.text, "content:text/plain");
    assert.equal(read.json, "content:web application/x-webexpress-spreadsheet");
    const transfer = { getData: type => (type === "text/plain" ? "a" : (() => { throw new Error("denied"); })()) };
    assert.deepEqual(plain(Clipboard.fromTransfer(transfer)), { text: "a", html: "", json: "" });
});

test("reading falls back to the last copy when the browser refuses", async () => {
    const rt = loadSpreadsheet({ globals: { navigator: { language: "en", clipboard: { readText: async () => { throw new Error("denied"); }, writeText: async () => { throw new Error("denied"); } } } } });
    const Clipboard = rt.wx.SpreadsheetClipboard;
    assert.equal(await Clipboard.write({ text: "x", html: "", json: "" }), false);
    assert.equal((await Clipboard.read()).text, "x");
    const plainRt = loadSpreadsheet({ globals: { navigator: { language: "en", clipboard: { readText: async () => "plain" } } } });
    assert.equal((await plainRt.wx.SpreadsheetClipboard.read()).text, "plain");
    const none = loadSpreadsheet({ globals: { navigator: { language: "en" } } });
    assert.equal(await none.wx.SpreadsheetClipboard.read(), null);
    assert.equal(await none.wx.SpreadsheetClipboard.write({ text: "x" }), false);
});

test("copy and paste inside the spreadsheet keep formulas, formats and merges", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", rowCount: 10, colCount: 5, data: [[1, 2, "=A1+B1"], [{ v: 3, s: { bold: true }, st: "good" }]], merges: ["D1:E1"] }], styles: { good: { fill: "#c6efce" } } });
    ctrl.select("A1:E2");
    const data = ctrl._prepareCopy(false);
    assert.match(data.text, /^1\t2\t3/);
    assert.ok(ctrl._clipboardRange, "the copied range is marked");
    ctrl.select("A8");
    assert.ok(ctrl.pasteData({ json: data.json }));
    assert.equal(ctrl.getFormula("C8"), "=A8+B8", "relative references follow the paste");
    assert.equal(ctrl.getStyle("A9").bold, true);
    assert.equal(ctrl.getStyle("A9").fill, "#c6efce");
    assert.ok(ctrl.sheet.merges.some(m => m.r1 === 7 && m.c1 === 3), "merges are pasted along");
    assert.equal(ctrl.sheet.rowCount, 10, "a fitting paste does not grow the sheet");
    ctrl.select("A10");
    ctrl.pasteData({ json: data.json });
    assert.equal(ctrl.sheet.rowCount, 11, "a paste beyond the end grows the sheet");
    assert.equal(ctrl.selection.ranges[0], "A10:E11");
});

test("paste modes take values, formats or formulas only", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [[2, { f: "=A1*3", s: { italic: true } }]] }] });
    const data = ctrl._clipboardData(ctrl.sheet, { r1: 0, c1: 0, r2: 0, c2: 1 }, false);
    ctrl.pasteData({ json: data.json }, { mode: "values", target: "A3" });
    assert.equal(ctrl.getFormula("B3"), null);
    assert.equal(ctrl.getValue("B3"), 6);
    assert.equal(ctrl.getStyle("B3").italic, undefined);
    ctrl.setValue("D5", "keep");
    ctrl.pasteData({ json: data.json }, { mode: "formats", target: "C5" });
    assert.equal(ctrl.getValue("D5"), "keep");
    assert.equal(ctrl.getStyle("D5").italic, true);
    ctrl.pasteData({ json: data.json }, { mode: "formulas", target: "A7" });
    assert.equal(ctrl.getFormula("B7"), "=A7*3");
    assert.equal(ctrl.getStyle("B7").italic, undefined);
});

test("paste values uses the copied results across workbooks and after source edits", () => {
    const rt = loadSpreadsheet();
    const { ctrl: source } = createSpreadsheet(rt, { sheets: [{ name: "Source", data: [[10, "=A1*2", "=0", "=FALSE", "=1/0"]] }] });
    const copied = source._clipboardData(source.sheet, { r1: 0, c1: 1, r2: 0, c2: 4 }, false);
    source.setValue("A1", 11);

    for (const id of [source.sheet.id, "other"]) {
        const { ctrl: target } = createSpreadsheet(rt, { sheets: [{ id, name: "Target", data: [[99, "=A1*3"]] }] });
        for (const formats of [{ json: copied.json }, { html: copied.html }]) {
            assert.ok(target.pasteData(formats, { mode: "values", target: "A3" }));
            assert.deepEqual(plain(target.getRange("A3:D3")), [[20, 0, false, "#DIV/0!"]]);
            assert.equal(target.getFormula("A3"), null);
            assert.ok(target.undo());
            assert.equal(target.getValue("A3"), null);
        }
        target.destroy();
    }

    source.pasteData({ json: copied.json }, { mode: "values", target: "A3" });
    assert.equal(source.getValue("A3"), 20, "the clipboard keeps the value at copy time");
    source.destroy();
});

test("a block smaller than the selection is repeated across it", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt);
    ctrl.select("A1:B4");
    ctrl.pasteData({ text: "x\ty\n" });
    assert.deepEqual(plain(ctrl.getRange("A1:B4")), [["x", "y"], ["x", "y"], ["x", "y"], ["x", "y"]]);
    ctrl.select("D1:D3");
    ctrl.pasteData({ text: "1\n2" });
    assert.deepEqual(plain(ctrl.getRange("D1:D3")), [[1], [2], [null]], "a selection that is no multiple takes the block once");
});

test("pasting text reads values in the conventions of the language", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, null, { "data-locale": "de" });
    ctrl.pasteData({ text: "1.234,5\t15%\t20.10.2026\t=1+1\t\n'007" }, { target: "A1" });
    assert.deepEqual(plain(ctrl.getRange("A1:D1")), [[1234.5, 0.15, 46315, 2]]);
    assert.equal(ctrl.getDisplay("C1"), "20.10.2026");
    assert.equal(ctrl.getValue("A2"), "007");
    assert.equal(ctrl.pasteData({ text: "" }), false);
    assert.equal(ctrl.pasteData({}), false);
});

test("pasting an HTML table of another spreadsheet keeps merges and styles", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, null, { "data-locale": "en" });
    ctrl.pasteData({ html: "<table><tr><td colspan=2 style=\"font-weight:bold\">Head</td><td>=formula as text</td></tr><tr><td>1,250.5</td><td data-sheets-value='{\"1\":3,\"3\":7}' data-sheets-formula=\"=R[0]C[-1]+1\">7</td><td>$5</td></tr></table>" }, { target: "B2" });
    assert.equal(ctrl.getValue("B2"), "Head");
    assert.equal(ctrl.getStyle("B2").bold, true);
    assert.ok(ctrl.sheet.merges.some(m => m.r1 === 1 && m.c1 === 1 && m.c2 === 2));
    assert.equal(ctrl.getValue("D2"), "=formula as text", "a formula without the spreadsheet's mark stays text");
    assert.equal(ctrl.getValue("B3"), 1250.5);
    assert.equal(ctrl.getFormula("C3"), "=B3+1");
    assert.equal(ctrl.getStyle("D3").nf, "$#,##0.00");
});

test("a cut is moved on paste and references follow it", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [[1, 2], ["=A1+B1"]], merges: ["A1:A1"] }, { name: "T", data: [["=S!A1"]] }] });
    ctrl.select("A1:B1");
    const data = ctrl._prepareCopy(true);
    ctrl.select("C5");
    assert.ok(ctrl.pasteData({ json: data.json }));
    assert.equal(ctrl.getValue("A1"), null);
    assert.equal(ctrl.getValue("C5"), 1);
    assert.equal(ctrl.getFormula("A2"), "=C5+D5");
    assert.equal(ctrl.getFormula("A1", "T"), "=S!C5");
    assert.equal(rt.wx.SpreadsheetClipboard._cut, null, "a cut is pasted once");
    ctrl.undo();
    assert.equal(ctrl.getValue("A1"), 1);
    assert.equal(ctrl.getFormula("A2"), "=A1+B1");
});

test("clipboard events are taken over while the grid has the focus", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [["a", 1]] }] });
    const store = {};
    const event = (type) => ({ type, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, clipboardData: { setData: (k, v) => { store[k] = v; }, getData: k => store[k] ?? "" } });
    const copy = event("copy");
    rt.document.dispatchEvent(copy);
    assert.equal(copy.defaultPrevented, false, "without the focus the page keeps its clipboard");
    rt.document.activeElement = ctrl._view.viewport;
    ctrl.select("A1:B1");
    rt.document.dispatchEvent(copy);
    assert.equal(copy.defaultPrevented, true);
    assert.equal(store["text/plain"], "a\t1");
    assert.ok(store["application/x-webexpress-spreadsheet"]);
    ctrl.select("A3");
    const paste = event("paste");
    rt.document.dispatchEvent(paste);
    assert.equal(ctrl.getValue("B3"), 1);
    const cut = event("cut");
    ctrl.select("A3");
    rt.document.dispatchEvent(cut);
    assert.ok(rt.wx.SpreadsheetClipboard._cut);
    delete store["application/x-webexpress-spreadsheet"]; delete store["text/html"];
    store["text/plain"] = "a";
    ctrl.select("C3");
    rt.document.dispatchEvent(event("paste"));
    assert.equal(ctrl.getValue("C3"), "a");
});

test("toolbar copy and paste go through the asynchronous clipboard", async () => {
    let clip = { text: "", html: "", json: "" };
    const rt = loadSpreadsheet({ globals: { navigator: { language: "en", clipboard: { writeText: async (t) => { clip = { text: t, html: "", json: "" }; }, readText: async () => clip.text } } } });
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [[5, 6]] }] });
    ctrl.select("A1:B1");
    assert.equal(await ctrl.copy(), true);
    ctrl.select("A2");
    assert.equal(await ctrl.paste(), true);
    assert.deepEqual(plain(ctrl.getRange("A2:B2")), [[5, 6]]);
    assert.equal(await ctrl.cut(), true);
    ctrl.readOnly = true;
    assert.equal(await ctrl.cut(), false);
    assert.equal(await ctrl.paste(), false);
});

test("csv and html export and import the used range", () => {
    const rt = loadSpreadsheet();
    const { ctrl } = createSpreadsheet(rt, { sheets: [{ name: "S", data: [["Name", "Amount"], ["A, Inc.", 1.5], ["B", "=B2*2"]] }] });
    assert.equal(ctrl.exportCsv(), "Name,Amount\r\n\"A, Inc.\",1.5\r\nB,3");
    assert.equal(ctrl.exportCsv({ delimiter: ";", values: true }), "Name;Amount\r\nA, Inc.;1.5\r\nB;3");
    assert.match(ctrl.exportHtml(), /<td>A, Inc\.<\/td>/);
    assert.match(ctrl.exportHtml("A1:A1"), /Name/);
    ctrl.addSheet("Empty");
    assert.equal(ctrl.exportCsv(), "");
    assert.ok(ctrl.importCsv("x;y\n1;2", { delimiter: ";" }));
    assert.deepEqual(plain(ctrl.getRange("A1:B2")), [["x", "y"], [1, 2]]);
    ctrl.importCsv("z", { start: "D4" });
    assert.equal(ctrl.getValue("D4"), "z");
    assert.equal(ctrl.getValue("A1"), "x", "an import at a start cell keeps the rest");
});
