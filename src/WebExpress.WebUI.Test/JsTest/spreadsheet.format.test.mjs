/**
 * Tests of number and date formats, input recognition, custom cell types and format templates.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadSpreadsheet, plain } from "./spreadsheet.fixture.mjs";

const rt = loadSpreadsheet();
const { SpreadsheetFormat: Format, SpreadsheetTypes: Types, SpreadsheetCellStyles: CellStyles } = rt.wx;
const text = (value, code, locale = "en") => Format.format(value, code, locale).text;

test("number formats place digits, separators, percent and exponent", () => {
    assert.equal(text(1234.567, "#,##0.00"), "1,234.57");
    assert.equal(text(1234.567, "#,##0.00", "de"), "1.234,57");
    assert.equal(text(0.256, "0.0%"), "25.6%");
    assert.equal(text(0.5, "#.##"), ".5");
    assert.equal(text(1, "0.##"), "1.");
    assert.equal(text(3, "0.0?"), "3.0 ");
    assert.equal(text(1234567, "#,##0,"), "1,235");
    assert.equal(text(1234567, "0.0,,"), "1.2");
    assert.equal(text(5551234, "000-0000"), "555-1234");
    assert.equal(text(42, "00000"), "00042");
    assert.equal(text(12345678, "0.00E+00"), "1.23E+07");
    assert.equal(text(0.000123, "0.0E+0"), "1.2E-4");
    assert.equal(text(9.99, "0.0E+00"), "1.0E+01");
    assert.equal(text(1234.5, "#,##0.00 \u20AC", "de"), "1.234,50 \u20AC");
    assert.equal(text(1234.5, "[$$-409]#,##0.00"), "$1,234.50");
    assert.equal(text(5, "\"Total: \"0"), "Total: 5");
    assert.equal(text(5, "0\\x"), "5x");
    assert.equal(text(5, "0_)"), "5 ");
    assert.equal(text(5, "*-0"), "5");
    assert.equal(text(7, "\"fixed\""), "fixed");
});

test("sections choose by sign and carry colors", () => {
    assert.deepEqual(plain(Format.format(-5, "0.00;[Red]-0.00", "en")), { text: "-5.00", color: "#ff0000" });
    assert.equal(text(-5, "0.00;(0.00)"), "(5.00)");
    assert.equal(text(0, "0;-0;\"zero\""), "zero");
    assert.equal(text(-3, "0.00"), "-3.00");
    assert.equal(text(-0.001, "0.00"), "0.00", "a negative value rounded to zero shows no sign");
    assert.equal(text("abc", "0;0;0;\"<\"@\">\""), "<abc>");
    assert.equal(text("abc", "@"), "abc");
    assert.equal(text("abc", "0.00"), "abc");
    assert.equal(text(true, "0"), "TRUE");
    assert.equal(text(false, null, "de"), "FALSCH");
    assert.equal(text(null, "0"), "");
    assert.equal(text(new rt.wx.SpreadsheetError("#N/A"), "0"), "#N/A");
    assert.equal(text(Infinity, "0"), "Infinity");
});

test("the General format writes numbers without noise in the conventions of the language", () => {
    assert.equal(text(0, "General"), "0");
    assert.equal(text(0.1 + 0.2, "General"), "0.3");
    assert.equal(text(3.14159, "General", "de"), "3,14159");
    assert.equal(text(-12.5, ""), "-12.5");
    assert.equal(text(1.5e12, "General"), "1.5E+12");
    assert.equal(text(2e-10, "General"), "2E-10");
    assert.equal(text(123456789012, "Standard"), "1.23457E+11");
});

test("date and time formats render serials", () => {
    const serial = 46315.572916666664;
    assert.equal(text(serial, "dd.mm.yyyy"), "20.10.2026");
    assert.equal(text(serial, "yyyy-mm-dd hh:mm"), "2026-10-20 13:45");
    assert.equal(text(serial, "d/m/yy"), "20/10/26");
    assert.equal(text(serial, "dddd, d. mmmm yyyy", "de"), "Dienstag, 20. Oktober 2026");
    assert.equal(text(serial, "ddd mmm"), "Tue Oct");
    assert.equal(text(serial, "mmmmm"), "O");
    assert.equal(text(serial, "h:mm AM/PM"), "1:45 PM");
    assert.equal(text(0.25, "hh:mm a/p"), "06:00 A");
    assert.equal(text(serial, "hh:mm:ss"), "13:45:00");
    assert.equal(text(serial, "h:m:s"), "13:45:0");
    assert.equal(text(1.5, "[h]:mm"), "36:00");
    assert.equal(text(1.5, "[mm]"), "2160");
    assert.equal(text(0.5, "[ss]"), "43200");
    assert.ok(Format.isDateFormat("dd.mm.yyyy"));
    assert.ok(!Format.isDateFormat("0.00"));
    assert.ok(!Format.isDateFormat(null));
    assert.equal(Format.dateToSerial(Format.serialToDate(45000.25)), 45000.25);
});

test("input is recognized in the conventions of the language", () => {
    const parse = (value, locale = "de") => plain(Format.parseInput(value, locale));
    assert.deepEqual(parse("1.234,5"), { value: 1234.5, format: "#,##0.0" });
    assert.deepEqual(parse("1,5"), { value: 1.5 });
    assert.deepEqual(parse("1234.5"), { value: 1234.5 }, "a point with other than three digits after it is a decimal point");
    assert.deepEqual(parse("1.234"), { value: 1234, format: "#,##0" });
    assert.deepEqual(parse("-3"), { value: -3 });
    assert.deepEqual(parse("(3)"), { value: -3 });
    assert.deepEqual(parse("1e3"), { value: 1000 });
    assert.deepEqual(parse("15%"), { value: 0.15, format: "0%" });
    assert.deepEqual(parse("12,5%"), { value: 0.125, format: "0.0%" });
    assert.deepEqual(parse("1.234,50 \u20AC"), { value: 1234.5, format: "#,##0.00 \u20AC" });
    assert.deepEqual(parse("$12", "en"), { value: 12, format: "$#,##0.00" });
    assert.deepEqual(parse("20.10.2026"), { value: 46315, format: "dd.mm.yyyy" });
    assert.deepEqual(parse("20.10.26"), { value: 46315, format: "dd.mm.yyyy" });
    assert.equal(parse("20.10.").format, "dd.mm.yyyy");
    assert.deepEqual(parse("10/20/2026", "en"), { value: 46315, format: "mm/dd/yyyy" });
    assert.deepEqual(parse("20/10/2026", "de"), { value: 46315, format: "dd.mm.yyyy" });
    assert.deepEqual(parse("2026-10-20 13:45"), { value: 46315 + (13 * 60 + 45) / 1440, format: "yyyy-mm-dd hh:mm" });
    assert.deepEqual(parse("12:30"), { value: 0.5208333333333334, format: "hh:mm" });
    assert.deepEqual(parse("1:30:15 pm", "en"), { value: (13 * 3600 + 30 * 60 + 15) / 86400, format: "hh:mm:ss" });
    assert.deepEqual(parse("31.02.2026"), { value: "31.02.2026" }, "an impossible date stays text");
    assert.deepEqual(parse("25:00"), { value: "25:00" });
    assert.deepEqual(parse("13:00 pm", "en"), { value: "13:00 pm" });
    assert.deepEqual(parse("2026-10-20 99:00"), { value: "2026-10-20 99:00" });
    assert.deepEqual(parse("WAHR"), { value: true });
    assert.deepEqual(parse("false", "en"), { value: false });
    assert.deepEqual(parse("'0123"), { value: "0123" });
    assert.deepEqual(parse("=A1+1"), { formula: "=A1+1" });
    assert.deepEqual(parse("   "), { value: null });
    assert.deepEqual(parse("abc"), { value: "abc" });
    assert.deepEqual(parse("1.2.3.4"), { value: "1.2.3.4" });
});

test("the display follows types, errors and kinds", () => {
    const display = (value, cell, style = {}) => plain(Format.display(value, cell, style, "en"));
    assert.deepEqual(display(5, { v: 5 }), { text: "5", color: null, align: "right", kind: "number" });
    assert.deepEqual(display(true, { v: true }), { text: "TRUE", color: null, align: "center", kind: "boolean" });
    assert.deepEqual(display("x", { v: "x" }), { text: "x", color: null, align: "left", kind: "text" });
    assert.deepEqual(display(null, null), { text: "", color: null, align: "left", kind: "empty" });
    assert.deepEqual(display(new rt.wx.SpreadsheetError("#REF!"), { f: "=x" }), { text: "#REF!", color: null, align: "center", kind: "error" });
    assert.deepEqual(display(true, { v: true, t: "checkbox" }), { text: "\u2611", color: null, align: "center", kind: "custom" });
    assert.equal(display(0.5, { v: 0.5 }, { nf: "0%" }).text, "50%");
});

test("the edit text reads back to the same value", () => {
    const edit = (cell, style = {}, locale = "de") => Format.editText(cell, style, locale);
    assert.equal(edit(null), "");
    assert.equal(edit({ f: "=A1" }), "=A1");
    assert.equal(edit({ v: 1234.5 }), "1234,5");
    assert.equal(edit({ v: true }), "WAHR");
    assert.equal(edit({ v: 46315 }, { nf: "dd.mm.yyyy" }), "20.10.2026");
    assert.equal(edit({ v: 46315.5 }, { nf: "dd.mm.yyyy" }), "20.10.2026 12:00:00");
    assert.equal(edit({ v: 0.5 }, { nf: "hh:mm" }), "12:00:00");
    assert.equal(edit({ v: 0.15 }, { nf: "0%" }), "15%");
    assert.equal(edit({ v: "0123" }), "'0123", "text that would read as a number keeps its apostrophe");
    assert.equal(edit({ v: "plain" }), "plain");
    assert.equal(edit({ v: true, t: "checkbox" }), "TRUE");
    assert.equal(edit({ s: { bold: true } }), "");
});

test("custom types format, parse, edit, toggle and feed formulas", () => {
    const checkbox = Types.get("checkbox");
    assert.equal(checkbox.parse("x"), true);
    assert.equal(checkbox.parse("nein"), false);
    assert.equal(checkbox.toggle(true), false);
    assert.equal(checkbox.toValue(true), true);
    assert.equal(checkbox.edit(false), "FALSE");
    assert.equal(checkbox.format(false), "\u2610");
    const link = Types.get("link");
    assert.deepEqual(plain(link.parse("[Docs](https://example.com)")), { text: "Docs", href: "https://example.com" });
    assert.deepEqual(plain(link.parse("/page")), { href: "/page" });
    assert.equal(link.format({ text: "Docs", href: "x" }), "Docs");
    assert.equal(link.format("raw"), "raw");
    assert.equal(link.edit({ text: "Docs", href: "u" }), "[Docs](u)");
    assert.equal(link.edit({ href: "u" }), "u");
    assert.equal(link.toValue({ href: "u" }), "u");
    assert.equal(link.toValue(null), null);
    assert.equal(link.href({ href: "javascript:alert(1)" }), null, "only safe addresses become links");
    assert.equal(link.href("https://example.com"), "https://example.com");
    const list = Types.get("list");
    const cell = { m: { options: ["Open", "Done"] } };
    assert.equal(list.parse("Done", cell), "Done");
    assert.equal(list.parse("Other", cell), undefined);
    assert.equal(list.parse("Free", {}), "Free");
    assert.deepEqual(plain(list.options(cell)), ["Open", "Done"]);
    assert.deepEqual(plain(list.options({})), []);
    assert.equal(list.format(null), "");
    assert.equal(list.edit(undefined), "");
    assert.equal(list.toValue(undefined), null);
    Types.register("rating", { format: v => "*".repeat(v), toValue: v => v });
    assert.equal(Types.getAll().some(t => t.name === "rating"), true);
    assert.equal(Types.unregister("rating"), true);
    assert.throws(() => Types.register("Bad Name", {}), { name: "TypeError" });
    assert.equal(rt.wx.SpreadsheetEngine.storedValue({ v: true, t: "checkbox" }), true);
    assert.equal(rt.wx.SpreadsheetEngine.storedValue({ v: { a: 1 } }), null);
});

test("format templates are registered with labels and styles", () => {
    const good = CellStyles.get("good");
    assert.equal(good.style.fill, "#c6efce");
    assert.ok(CellStyles.getAll().length >= 10);
    CellStyles.register("custom", { label: "Custom", style: { bold: true } });
    assert.equal(CellStyles.get("custom").name, "custom");
    assert.equal(CellStyles.get("none"), null);
});

test("the locale falls back to English and accepts objects", () => {
    assert.equal(Format.locale("fr-FR").decimal, ".");
    assert.equal(Format.locale("de-AT").decimal, ",");
    const custom = { decimal: ";" };
    assert.equal(Format.locale(custom), custom);
});

test("short weekday names follow the language", () => {
    const monday = Format.dateToSerial(new Date(Date.UTC(2026, 9, 19)));
    assert.equal(text(monday, "ddd"), "Mon");
    assert.equal(text(monday, "ddd", "de"), "Mo");
    assert.equal(text(monday, "dddd", "de"), "Montag");
    assert.equal(text(monday, "mmm", "de"), "Okt");
});
