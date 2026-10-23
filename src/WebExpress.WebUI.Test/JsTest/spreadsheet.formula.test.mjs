/**
 * Tests of the formula language and the calculation engine: tokenizing, parsing, operators,
 * the built-in functions, custom functions, dependency tracking, cycles and reference rewriting.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadSpreadsheet, plain } from "./spreadsheet.fixture.mjs";

const rt = loadSpreadsheet();
const { SpreadsheetModel: Model, SpreadsheetEngine: Engine, SpreadsheetFormula: Formula, SpreadsheetFunctions: Functions, SpreadsheetValues: Values } = rt.wx;

/**
 * Builds a workbook with an engine.
 * @param {Array} data - The data grid of the first sheet.
 * @param {object} [extra] - Further workbook fields.
 * @returns {{model: object, engine: object, sheet: object, value: Function, set: Function}} The setup.
 */
function book(data, extra = {}) {
    const model = Model.fromJSON({ sheets: [{ name: "S", data }, ...(extra.sheets ?? [])], names: extra.names });
    const engine = new Engine(model, { now: () => new Date(2026, 9, 20, 13, 45, 30) });
    const sheet = model.sheets[0];
    const value = (ref, target = sheet) => {
        const cell = rt.wx.SpreadsheetAddress.parseCell(ref);
        const result = engine.cellValue(target, cell.row, cell.col);
        return result instanceof rt.wx.SpreadsheetError ? result.code : result;
    };
    const set = (ref, cell, target = sheet) => {
        const at = rt.wx.SpreadsheetAddress.parseCell(ref);
        return engine.update(model.apply({ type: "set", sheet: target.id, cells: [{ row: at.row, col: at.col, cell }] }).changes);
    };
    const evaluate = text => {
        const result = engine.evaluate(text, sheet);
        return result instanceof rt.wx.SpreadsheetError ? result.code : result;
    };
    return { model, engine, sheet, value, set, evaluate };
}

test("the tokenizer keeps source slices and tells references from names and functions", () => {
    const tokens = Formula.tokenize("= SUM( A1:B2 ;Sheet2!$C$3)&\"a\"\"b\" + LOG10(1) <> Total*1:3+A:B+TRUE+#N/A%");
    assert.equal(tokens.map(t => t.text).join(""), "= SUM( A1:B2 ;Sheet2!$C$3)&\"a\"\"b\" + LOG10(1) <> Total*1:3+A:B+TRUE+#N/A%");
    const kinds = tokens.filter(t => t.type !== "ws").map(t => t.type + ":" + t.text);
    assert.ok(kinds.includes("func:SUM"));
    assert.ok(kinds.includes("ref:A1:B2"));
    assert.ok(kinds.includes("sep:;"));
    assert.ok(kinds.includes("ref:Sheet2!$C$3"));
    assert.ok(kinds.includes("func:LOG10"), "a cell-like name before a parenthesis is a function");
    assert.ok(kinds.includes("name:Total"));
    assert.ok(kinds.includes("ref:1:3"));
    assert.ok(kinds.includes("ref:A:B"));
    assert.ok(kinds.includes("bool:TRUE"));
    assert.ok(kinds.includes("error:#N/A"));
    assert.equal(tokens.find(t => t.type === "string").value, "a\"b");
    assert.throws(() => Formula.tokenize("=\"open"), { name: "SyntaxError" });
    assert.throws(() => Formula.tokenize("=1 ~ 2"), { name: "SyntaxError" });
});

test("the parser builds the precedence of the common spreadsheets", () => {
    const { evaluate } = book([]);
    assert.equal(evaluate("=1+2*3"), 7);
    assert.equal(evaluate("=(1+2)*3"), 9);
    assert.equal(evaluate("=-2^2"), 4, "unary minus binds tighter than the power");
    assert.equal(evaluate("=2^3^2"), 64, "powers associate to the left");
    assert.equal(evaluate("=10-2-3"), 5);
    assert.equal(evaluate("=50%*2"), 1);
    assert.equal(evaluate("=1+2&3"), "33");
    assert.equal(evaluate("=1+2=3"), true);
    assert.equal(evaluate("=+5"), 5);
    for (const broken of ["=1+", "=SUM(1", "=(1", "=1)", "=SUM(1 2)", "=", "=,"]) {
        assert.throws(() => Formula.parse(broken), { name: "SyntaxError" }, broken);
    }
    assert.equal(evaluate("=1+"), "#ERROR!");
});

test("operators coerce text, booleans and empty cells and propagate errors", () => {
    const { evaluate } = book([[null, "12", "abc", true]]);
    assert.equal(evaluate("=A1+1"), 1, "an empty cell counts as zero");
    assert.equal(evaluate("=B1*2"), 24, "numeric text is read");
    assert.equal(evaluate("=C1*2"), "#VALUE!");
    assert.equal(evaluate("=D1+1"), 2);
    assert.equal(evaluate("=1/0"), "#DIV/0!");
    assert.equal(evaluate("=(1/0)+1"), "#DIV/0!");
    assert.equal(evaluate("=1+(1/0)"), "#DIV/0!");
    assert.equal(evaluate("=A1&\"x\""), "x");
    assert.equal(evaluate("=TRUE&1.5"), "TRUE1.5");
    assert.equal(evaluate("=0.1+0.2&\"\""), "0.3", "general text avoids float noise");
    assert.equal(evaluate("=\"a\"<\"B\""), true, "text compares case-insensitively");
    assert.equal(evaluate("=1<\"a\""), true, "numbers sort before text");
    assert.equal(evaluate("=\"a\"<TRUE"), true, "text sorts before booleans");
    assert.equal(evaluate("=A1=0"), true);
    assert.equal(evaluate("=A1=\"\""), true);
    assert.equal(evaluate("=2>=2"), true);
    assert.equal(evaluate("=2<=1"), false);
    assert.equal(evaluate("=2<>1"), true);
    assert.equal(evaluate("=(-1)^0.5"), "#NUM!");
    assert.equal(evaluate("=A1:B1+1"), "#VALUE!", "a range is no single value");
    assert.equal(evaluate("=-\"x\""), "#VALUE!");
    assert.equal(evaluate("=\"x\"%"), "#VALUE!");
    assert.equal(evaluate("=10^400"), "#NUM!");
});

test("references reach other sheets, named ranges and whole columns", () => {
    const { evaluate, value, set } = book([[1, 2], [3, 4]], { sheets: [{ name: "Other Sheet", data: [[10]] }], names: { Pair: "S!A1:B1", One: "S!B2", Lost: "Nowhere!A1" } });
    assert.equal(evaluate("='Other Sheet'!A1*2"), 20);
    assert.equal(evaluate("=Missing!A1"), "#REF!");
    assert.equal(evaluate("=SUM(Pair)"), 3);
    assert.equal(evaluate("=one*2"), 8, "names are found case-insensitively");
    assert.equal(evaluate("=Unknown"), "#NAME?");
    assert.equal(evaluate("=Lost"), "#REF!");
    assert.equal(evaluate("=SUM(A:A)"), 4);
    assert.equal(evaluate("=SUM(2:2)"), 7);
    set("C1", { f: "=SUM(Pair)" });
    assert.equal(value("C1"), 3);
    set("A1", { v: 5 });
    assert.equal(value("C1"), 7, "a formula reading a name recalculates on any change");
});

test("the engine recalculates exactly what a change reaches and reports changed results", () => {
    const { value, set, engine } = book([[1, "=A1*2", "=B1+1", "=SUM(A1:A3)"], [2], [3], ["=A1"]]);
    assert.equal(value("C1"), 3);
    assert.equal(value("D1"), 6);
    const changed = set("A1", { v: 10 });
    assert.deepEqual(plain(changed.map(c => [c.row, c.col, c.value]).sort()), [[0, 1, 20], [0, 2, 21], [0, 3, 15], [3, 0, 10]]);
    assert.equal(set("A2", { v: 2 }).length, 0, "an unchanged value reports nothing");
    set("B1", { v: 7 });
    assert.equal(value("C1"), 8, "a formula replaced by a value feeds its readers");
    set("B1", null);
    assert.equal(value("C1"), 1);
    assert.equal(engine.recalculate().length, 0);
    assert.equal(engine.problem(rt.wx.SpreadsheetModel.fromJSON(null).sheets[0].id, 0, 0), null);
});

test("cycles evaluate to #CIRC! and recover when they are broken", () => {
    const { value, set, engine, sheet } = book([["=B1", "=A1+1", "=B1*2"], ["=A2"]]);
    assert.equal(value("A1"), "#CIRC!");
    assert.equal(value("B1"), "#CIRC!");
    assert.equal(value("C1"), "#CIRC!", "a reader of a cycle sees its error");
    assert.equal(value("A2"), "#CIRC!", "a formula reading itself is a cycle");
    assert.match(engine.problem(sheet.id, 0, 0), /refers to itself/);
    set("A1", { v: 1 });
    assert.equal(value("B1"), 2);
    assert.equal(value("C1"), 4);
});

test("long chains are calculated without deep recursion", () => {
    const data = [[1]];
    for (let i = 2; i <= 20000; i++) data.push(["=A" + (i - 1) + "+1"]);
    const { value, set } = book(data);
    assert.equal(value("A20000"), 20000);
    set("A1", { v: 2 });
    assert.equal(value("A20000"), 20001);
});

test("a formula that cannot be parsed shows #ERROR! with the reason", () => {
    const { value, engine, sheet } = book([["=SUM(1"]]);
    assert.equal(value("A1"), "#ERROR!");
    assert.ok(engine.problem(sheet.id, 0, 0));
});

test("the math and statistics functions follow the common spreadsheets", () => {
    const { evaluate } = book([[1, 2, "x", true], [4, null, 6, ""], ["=1/0"]]);
    assert.equal(evaluate("=SUM(A1:D2)"), 13, "text and booleans in ranges are skipped");
    assert.equal(evaluate("=SUM(1,\"2\",TRUE)"), 4, "direct arguments are converted");
    assert.equal(evaluate("=SUM(A1:A3)"), "#DIV/0!");
    assert.equal(evaluate("=SUM(\"x\")"), "#VALUE!");
    assert.equal(evaluate("=AVG(A1:D2)"), 13 / 4);
    assert.equal(evaluate("=AVERAGE(1,2,3)"), 2);
    assert.equal(evaluate("=AVERAGE(C1)"), "#DIV/0!");
    assert.equal(evaluate("=MIN(A1:D2)"), 1);
    assert.equal(evaluate("=MAX(A1:D2)"), 6);
    assert.equal(evaluate("=MIN(C1)"), 0);
    assert.equal(evaluate("=MAX(C1)"), 0);
    assert.equal(evaluate("=PRODUCT(2,3,A2)"), 24);
    assert.equal(evaluate("=MEDIAN(1,3,2,4)"), 2.5);
    assert.equal(evaluate("=MEDIAN(1,3,2)"), 2);
    assert.equal(evaluate("=MEDIAN(C1)"), "#NUM!");
    assert.equal(evaluate("=COUNT(A1:D2,\"5\",\"x\",7)"), 6);
    assert.equal(evaluate("=COUNTA(A1:D2)"), 6);
    assert.equal(evaluate("=COUNTBLANK(A1:D2)"), 2);
    assert.equal(evaluate("=COUNTBLANK(\"\")"), 1);
    assert.equal(evaluate("=COUNTIF(A1:D2,\">1\")"), 3);
    assert.equal(evaluate("=COUNTIF(A1:D2,\"x\")"), 1);
    assert.equal(evaluate("=COUNTIF(A1:D2,\"<>x\")"), 7);
    assert.equal(evaluate("=COUNTIF(A1:D2,\"\")"), 2);
    assert.equal(evaluate("=COUNTIF(A1:D2,4)"), 1);
    assert.equal(evaluate("=COUNTIF(5,5)"), 1);
    assert.equal(evaluate("=SUMIF(A1:C2,\">1\")"), 12);
    assert.equal(evaluate("=SUMIF(A1:A2,\">=4\",B1:B2)"), 0);
    assert.equal(evaluate("=SUMIF(A1:A2,\"<4\",B1:B2)"), 2);
    assert.equal(evaluate("=SUMIF(1,1)"), "#VALUE!");
    assert.equal(evaluate("=AVERAGEIF(A1:C2,\">1\")"), 4);
    assert.equal(evaluate("=AVERAGEIF(A1:C2,\">100\")"), "#DIV/0!");
    assert.equal(evaluate("=AVERAGEIF(1,1)"), "#VALUE!");
    assert.equal(evaluate("=ROUND(2.345,2)"), 2.35);
    assert.equal(evaluate("=ROUND(-2.5)"), -3);
    assert.equal(evaluate("=ROUNDUP(2.341,2)"), 2.35);
    assert.equal(evaluate("=ROUNDDOWN(-2.349,2)"), -2.34);
    assert.equal(evaluate("=ABS(-3)"), 3);
    assert.equal(evaluate("=INT(-2.5)"), -3);
    assert.equal(evaluate("=SQRT(16)"), 4);
    assert.equal(evaluate("=SQRT(-1)"), "#NUM!");
    assert.equal(evaluate("=POWER(2,10)"), 1024);
    assert.equal(evaluate("=MOD(-7,3)"), 2);
    assert.equal(evaluate("=MOD(1,0)"), "#DIV/0!");
    assert.equal(evaluate("=ROUND(PI(),4)"), 3.1416);
    const random = evaluate("=RAND()");
    assert.ok(random >= 0 && random < 1);
    const between = evaluate("=RANDBETWEEN(3,3)");
    assert.equal(between, 3);
    assert.equal(evaluate("=RANDBETWEEN(5,1)"), "#NUM!");
    assert.equal(evaluate("=SUM()"), "#N/A", "argument counts are checked");
    assert.equal(evaluate("=NOPE(1)"), "#NAME?");
});

test("the logical functions evaluate lazily and short-circuit", () => {
    const { evaluate } = book([[true, false, "x"]]);
    assert.equal(evaluate("=IF(1>0,\"yes\",1/0)"), "yes");
    assert.equal(evaluate("=IF(0,1/0,\"no\")"), "no");
    assert.equal(evaluate("=IF(1)"), true);
    assert.equal(evaluate("=IF(0)"), false);
    assert.equal(evaluate("=IF(\"x\",1,2)"), "#VALUE!");
    assert.equal(evaluate("=IFERROR(1/0,\"fallback\")"), "fallback");
    assert.equal(evaluate("=IFERROR(5,0)"), 5);
    assert.equal(evaluate("=AND(TRUE,1,A1)"), true);
    assert.equal(evaluate("=AND(A1:C1)"), false, "text in ranges is skipped");
    assert.equal(evaluate("=OR(B1,0)"), false);
    assert.equal(evaluate("=OR(A1:B1)"), true);
    assert.equal(evaluate("=XOR(TRUE,TRUE,TRUE)"), true);
    assert.equal(evaluate("=AND(C1)"), "#VALUE!");
    assert.equal(evaluate("=AND(1/0)"), "#DIV/0!");
    assert.equal(evaluate("=AND(\"x\")"), "#VALUE!");
    assert.equal(evaluate("=NOT(A1)"), false);
    assert.equal(evaluate("=NOT(\"x\")"), "#VALUE!");
    assert.equal(evaluate("=TRUE()"), true);
    assert.equal(evaluate("=FALSE()"), false);
    assert.equal(evaluate("=CHOOSE(2,\"a\",\"b\",1/0)"), "b");
    assert.equal(evaluate("=CHOOSE(9,1)"), "#VALUE!");
});

test("the text functions work on values and ranges", () => {
    const { evaluate } = book([["Hello", " World ", 5]]);
    assert.equal(evaluate("=CONCAT(A1,B1,C1)"), "Hello World 5");
    assert.equal(evaluate("=CONCAT(A1:C1)"), "Hello World 5");
    assert.equal(evaluate("=CONCATENATE(\"a\",1)"), "a1");
    assert.equal(evaluate("=CONCAT(1/0)"), "#DIV/0!");
    assert.equal(evaluate("=TEXTJOIN(\"-\",TRUE,A1:C1,\"\",\"z\")"), "Hello- World -5-z");
    assert.equal(evaluate("=LEFT(A1,2)"), "He");
    assert.equal(evaluate("=LEFT(A1)"), "H");
    assert.equal(evaluate("=LEFT(A1,-1)"), "#VALUE!");
    assert.equal(evaluate("=RIGHT(A1,3)"), "llo");
    assert.equal(evaluate("=RIGHT(A1,0)"), "");
    assert.equal(evaluate("=RIGHT(A1,-1)"), "#VALUE!");
    assert.equal(evaluate("=MID(A1,2,3)"), "ell");
    assert.equal(evaluate("=MID(A1,0,3)"), "#VALUE!");
    assert.equal(evaluate("=LEN(B1)"), 7);
    assert.equal(evaluate("=UPPER(A1)"), "HELLO");
    assert.equal(evaluate("=LOWER(A1)"), "hello");
    assert.equal(evaluate("=TRIM(\"  a   b \")"), "a b");
    assert.equal(evaluate("=TEXT(1234.5,\"#,##0.00\")"), "1,234.50");
    assert.equal(evaluate("=VALUE(\"12.5\")"), 12.5);
    assert.equal(evaluate("=FIND(\"l\",A1)"), 3);
    assert.equal(evaluate("=FIND(\"z\",A1)"), "#VALUE!");
    assert.equal(evaluate("=SUBSTITUTE(A1,\"l\",\"L\")"), "HeLLo");
    assert.equal(evaluate("=LEFT(A1,\"x\")"), "#VALUE!");
});

test("the date functions use serial numbers and the injected clock", () => {
    const { evaluate } = book([[46315.5]]);
    assert.equal(evaluate("=TODAY()"), 46315);
    assert.ok(Math.abs(evaluate("=NOW()") - (46315 + (13 * 3600 + 45 * 60 + 30) / 86400)) < 1e-6);
    assert.equal(evaluate("=DATE(2026,10,20)"), 46315);
    assert.equal(evaluate("=DATE(\"x\",1,1)"), "#VALUE!");
    assert.equal(evaluate("=YEAR(A1)"), 2026);
    assert.equal(evaluate("=MONTH(A1)"), 10);
    assert.equal(evaluate("=DAY(A1)"), 20);
    assert.equal(evaluate("=YEAR(\"x\")"), "#VALUE!");
    assert.equal(evaluate("=WEEKDAY(A1)"), 3, "a Tuesday is day 3 when Sunday is day 1");
    assert.equal(evaluate("=WEEKDAY(A1,2)"), 2);
    assert.equal(evaluate("=WEEKDAY(A1,3)"), 1);
    assert.equal(evaluate("=HOUR(A1)"), 12);
    assert.equal(evaluate("=MINUTE(0.5+1/1440*5)"), 5);
    assert.equal(evaluate("=DAYS(A1,46300)"), 15);
    assert.equal(evaluate("=NETWORKDAYS(46315,46322)"), 6);
    assert.equal(evaluate("=NETWORKDAYS(46322,46315)"), -6);
    assert.equal(evaluate("=EDATE(46315,2)"), 46376);
    assert.equal(evaluate("=EDATE(\"x\",2)"), "#VALUE!");
});

test("the information and lookup functions find what they look for", () => {
    const { evaluate } = book([["Apple", 1], ["Banana", 2], ["Cherry", 3]]);
    assert.equal(evaluate("=ISBLANK(C1)"), true);
    assert.equal(evaluate("=ISNUMBER(B1)"), true);
    assert.equal(evaluate("=ISTEXT(A1)"), true);
    assert.equal(evaluate("=ISERROR(1/0)"), true);
    assert.equal(evaluate("=NA()"), "#N/A");
    assert.equal(evaluate("=ROW(B3)"), 3);
    assert.equal(evaluate("=ROW()"), 1);
    assert.equal(evaluate("=COLUMN(C1:D1)"), 3);
    assert.equal(evaluate("=COLUMN()"), 1);
    assert.equal(evaluate("=ROWS(A1:B3)"), 3);
    assert.equal(evaluate("=ROWS(1)"), 1);
    assert.equal(evaluate("=COLUMNS(A1:B3)"), 2);
    assert.equal(evaluate("=COLUMNS(1)"), 1);
    assert.equal(evaluate("=VLOOKUP(\"banana\",A1:B3,2,FALSE)"), 2);
    assert.equal(evaluate("=VLOOKUP(\"Blueberry\",A1:B3,2)"), 2, "a sorted lookup takes the last smaller key");
    assert.equal(evaluate("=VLOOKUP(\"Kiwi\",A1:B3,2,FALSE)"), "#N/A");
    assert.equal(evaluate("=VLOOKUP(\"Apple\",A1:B3,5,FALSE)"), "#REF!");
    assert.equal(evaluate("=VLOOKUP(\"Apple\",1,1)"), "#VALUE!");
    assert.equal(evaluate("=HLOOKUP(\"Apple\",A1:B3,2,FALSE)"), "Banana");
    assert.equal(evaluate("=HLOOKUP(\"Zed\",A1:B1,1)"), 1);
    assert.equal(evaluate("=HLOOKUP(\"Apple\",A1:B1,4)"), "#REF!");
    assert.equal(evaluate("=HLOOKUP(\"Apple\",1,1)"), "#VALUE!");
    assert.equal(evaluate("=INDEX(A1:B3,3,2)"), 3);
    assert.equal(evaluate("=INDEX(A1:B3,4,1)"), "#REF!");
    assert.equal(evaluate("=INDEX(5,1)"), 5);
    assert.equal(evaluate("=MATCH(\"Cherry\",A1:A3,0)"), 3);
    assert.equal(evaluate("=MATCH(2.5,B1:B3)"), 2);
    assert.equal(evaluate("=MATCH(2.5,B1:B3,0)"), "#N/A");
    assert.equal(evaluate("=MATCH(\"x\",1)"), "#N/A");
    assert.equal(evaluate("=MATCH(2,B1:B1)"), 1);
});

test("custom functions are registered like editor add-ons and recalculate users", () => {
    const { evaluate, value, set, engine } = book([[2, "=DOUBLE(A1)", "=GREET()"]]);
    assert.equal(value("B1"), "#NAME?");
    Functions.register("DOUBLE", { fn: ([x], api) => api.values.toNumber(x) * 2, minArgs: 1, maxArgs: 1, category: "custom", description: "Doubles." });
    Functions.register("greet", () => "hi");
    Functions.register("LAZYFIRST", { fn: ([first, second]) => first() ?? second(), lazy: true });
    Functions.register("FAILS", { fn: () => { throw new Error("boom"); } });
    Functions.register("ERRS", { fn: ([value]) => (Values.isError(value) ? "got " + value.code : "none"), acceptErrors: true });
    try {
        assert.ok(engine.uses("DOUBLE"));
        engine.recalculate();
        assert.equal(value("B1"), 4);
        assert.equal(value("C1"), "hi");
        set("A1", { v: 5 });
        assert.equal(value("B1"), 10);
        assert.equal(evaluate("=LAZYFIRST(1,1/0)"), 1);
        assert.equal(evaluate("=FAILS()"), "#VALUE!");
        assert.equal(evaluate("=ERRS(1/0)"), "got #DIV/0!");
        assert.ok(Functions.has("double"));
        assert.ok(Functions.getAll().some(f => f.name === "DOUBLE"));
        assert.throws(() => Functions.register("1bad", () => 1), { name: "TypeError" });
        assert.throws(() => Functions.register("NOFN", {}), { name: "TypeError" });
    } finally {
        for (const name of ["DOUBLE", "GREET", "LAZYFIRST", "FAILS", "ERRS"]) Functions.unregister(name);
    }
    assert.equal(Functions.unregister("DOUBLE"), false);
    assert.equal(Functions.get("DOUBLE"), null);
});

test("a failing registry listener does not stop the others", () => {
    const calls = [];
    const error = console.error; console.error = () => { };
    const off1 = Functions.subscribe(() => { throw new Error("listener"); });
    const off2 = Functions.subscribe(name => calls.push(name));
    try {
        Functions.register("LISTENED", () => 1);
        Functions.unregister("LISTENED");
    } finally { off1(); off2(); console.error = error; }
    assert.deepEqual(plain(calls), ["LISTENED", "LISTENED"]);
});

test("volatile functions recalculate on every change", () => {
    let now = new Date(2026, 0, 1, 10, 0, 0);
    const model = Model.fromJSON({ sheets: [{ data: [["=TODAY()", 1]] }] });
    const engine = new Engine(model, { now: () => now });
    assert.equal(engine.cellValue(model.sheets[0], 0, 0), 46023);
    now = new Date(2026, 0, 2, 10, 0, 0);
    const changed = engine.update(model.apply({ type: "set", sheet: model.sheets[0].id, cells: [{ row: 0, col: 1, cell: { v: 2 } }] }).changes);
    assert.equal(changed[0].value, 46024);
    const id = model.sheets[0].id;
    engine.update(model.apply({ type: "set", sheet: id, cells: [{ row: 0, col: 0, cell: { v: 5 } }] }).changes);
    now = new Date(2026, 0, 3, 10, 0, 0);
    assert.deepEqual(plain(engine.update(model.apply({ type: "set", sheet: id, cells: [{ row: 0, col: 1, cell: { v: 3 } }] }).changes)), [], "a replaced TODAY() no longer recalculates");
});

test("an edit costs what it reaches, not the size of the workbook", () => {
    const data = [];
    for (let i = 0; i < 2000; i++) data.push([i, "=A" + (i + 1) + "*2"]);
    const model = Model.fromJSON({ sheets: [{ rowCount: 2000, colCount: 2, data }] });
    const engine = new Engine(model);
    const id = model.sheets[0].id;
    // the full snapshot is the path of structural changes; a cell edit must not take it
    let snapshots = 0;
    const snapshot = engine._snapshot.bind(engine);
    engine._snapshot = () => { snapshots++; return snapshot(); };
    const changed = engine.update(model.apply({ type: "set", sheet: id, cells: [{ row: 7, col: 0, cell: { v: 100 } }] }).changes);
    assert.deepEqual(plain(changed.map(c => [c.row, c.col, c.value, c.before])), [[7, 1, 200, 14]]);
    const formula = engine.update(model.apply({ type: "set", sheet: id, cells: [{ row: 8, col: 1, cell: { f: "=A9*3" } }] }).changes);
    assert.deepEqual(plain(formula.map(c => [c.row, c.col, c.value, c.before])), [[8, 1, 24, 16]], "a replaced formula reports its old result");
    const fresh = engine.update(model.apply({ type: "set", sheet: id, cells: [{ row: 9, col: 0, cell: { f: "=1" } }] }).changes);
    assert.deepEqual(plain(fresh.map(c => [c.row, c.col, c.value, c.before])).sort(), [[9, 0, 1, null], [9, 1, 2, 18]], "a new formula reports itself and what reads it");
    assert.equal(snapshots, 0);
    engine.update(model.apply({ type: "insertRows", sheet: id, index: 0, count: 1 }).changes);
    assert.equal(snapshots, 1, "a structural change still compares everything");
});

test("references are rewritten, translated and listed", () => {
    assert.equal(Formula.translate("=A1+$B$2+B$3+$C4+SUM(D:D)+2:2", 1, 1), "=B2+$B$2+C$3+$C5+SUM(E:E)+3:3");
    assert.equal(Formula.translate("=A1", -1, 0), "=#REF!");
    assert.equal(Formula.translate("=A1", 0, 0), "=A1");
    assert.equal(Formula.rewrite("=\"unterminated", null, () => null), "=\"unterminated", "a broken formula stays as it is");
    assert.equal(Formula.rewrite("=A1+B1", "S", ref => (ref.c1 === 0 ? "X" : ref)), "=X+B1");
    assert.equal(Formula.writeRef({ sheet: "My S", kind: "range", r1: 0, c1: 0, r2: 1, c2: 1, abs: [true, false, false, true] }), "'My S'!A$1:$B2");
    assert.equal(Formula.writeRef({ sheet: null, kind: "cols", r1: 0, c1: 1, r2: 9, c2: 2, abs: [false, true, false, false] }), "$B:C");
    assert.equal(Formula.writeRef({ sheet: null, kind: "rows", r1: 1, c1: 0, r2: 2, c2: 9, abs: [true, false, false, false] }), "$2:3");
    const refs = Formula.references("=SUM(A1:B2)+C3");
    assert.deepEqual(plain(refs.map(r => [r.text, r.start])), [["A1:B2", 5], ["C3", 12]]);
    assert.deepEqual(plain(Formula.references("=\"x")), []);
    assert.ok(Formula.expectsOperand("=SUM("));
    assert.ok(Formula.expectsOperand("=A1+ "));
    assert.ok(!Formula.expectsOperand("=A1"));
    assert.ok(!Formula.expectsOperand("text("));
});

test("values helpers compare, convert and match criteria", () => {
    assert.equal(Values.toNumber("1e3"), 1000);
    assert.equal(Values.toNumber("50%"), 0.5);
    assert.equal(Values.toNumber(null), 0);
    assert.equal(Values.toText(null), "");
    assert.equal(Values.toText(false), "FALSE");
    assert.equal(Values.toBool("true"), true);
    assert.equal(Values.toBool("FALSE"), false);
    assert.equal(Values.toBool(null), false);
    assert.equal(Values.toBool(2), true);
    assert.equal(Values.compare(null, null), 0);
    assert.equal(Values.compare(true, null), 1, "an empty cell compares as FALSE with a truth value");
    assert.equal(Values.numberText(1 / 3), "0.333333333333333");
    const wildcard = Values.criterion("a*e");
    assert.ok(wildcard("Apple"));
    assert.ok(!wildcard("Banana"));
    assert.ok(Values.criterion("<>")("x"));
    assert.ok(Values.criterion("=TRUE")(true));
    assert.ok(Values.criterion("<=2")(2));
    assert.ok(!Values.criterion(">a")(5), "a type mismatch never matches an ordering");
    assert.ok(Values.criterion(">=b")("c"));
    assert.ok(Values.criterion("<b")("a"));
});
