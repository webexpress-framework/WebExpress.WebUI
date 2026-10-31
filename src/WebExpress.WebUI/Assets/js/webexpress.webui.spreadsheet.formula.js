/**
 * The formula language of the spreadsheet: tokenizer, parser and the reference rewriting that
 * structural changes, copying and collaboration need. Formulas are stored as text in A1
 * notation with canonical English function names; the tokens keep their source slices, so a
 * rewrite changes the references of a formula and nothing else, not even its spacing.
 */
webexpress.webui.SpreadsheetFormula = class {
    /**
     * The error literals of the language.
     */
    static ERRORS = ["#NULL!", "#DIV/0!", "#VALUE!", "#REF!", "#NAME?", "#NUM!", "#N/A", "#CIRC!", "#ERROR!"];

    /**
     * Splits a formula into tokens. Whitespace is kept as tokens of its own, so the source can
     * be reassembled exactly.
     * @param {string} text - The formula, with or without the leading "=".
     * @returns {Array<object>} The tokens { type, text, start, end, ... }.
     * @throws {SyntaxError} If the text contains an unterminated string or an unknown character.
     */
    static tokenize(text) {
        const tokens = [];
        const source = String(text ?? "");
        let i = source.startsWith("=") ? 1 : 0;
        if (i) tokens.push({ type: "eq", text: "=", start: 0, end: 1 });
        // the patterns are tried in this order in one alternation, built once: recalculating a
        // large sheet tokenizes hundreds of thousands of formulas
        const lexer = this._lexer ??= (() => {
            const sheetPart = "(?:'(?:[^']|'')+'|[A-Za-z0-9_.\\u00C0-\\uFFFF]+)!";
            const parts = [
                "@\\{[^}]*\\}",
                "(?:" + sheetPart + ")?(?:\\$?[A-Za-z]{1,3}\\$?\\d{1,7}(?::\\$?[A-Za-z]{1,3}\\$?\\d{1,7})?|\\$?[A-Za-z]{1,3}:\\$?[A-Za-z]{1,3}|\\$?\\d{1,7}:\\$?\\d{1,7})(?![A-Za-z0-9_(.!])",
                "(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?",
                "[A-Za-z_\\\\\\u00C0-\\uFFFF][A-Za-z0-9_.\\\\\\u00C0-\\uFFFF]*",
                "\\s+",
                "<=|>=|<>|[+\\-*/^&=<>%]",
                "#(?:NULL!|DIV\\/0!|VALUE!|REF!|NAME\\?|NUM!|N\\/A|CIRC!|ERROR!)"
            ];
            return { all: new RegExp(parts.map(p => "(" + p + ")").join("|"), "y"), ident: new RegExp(parts[3], "y") };
        })();
        const types = [null, "idref", "ref", "number", "ident", "ws", "op", "error"];
        while (i < source.length) {
            const ch = source[i];
            if (ch === "\"") {
                let j = i + 1, value = "";
                for (; j < source.length; j++) {
                    if (source[j] === "\"") {
                        if (source[j + 1] === "\"") { value += "\""; j++; continue; }
                        break;
                    }
                    value += source[j];
                }
                if (j >= source.length) throw new SyntaxError("Unterminated string");
                tokens.push({ type: "string", text: source.slice(i, j + 1), value, start: i, end: j + 1 });
                i = j + 1;
                continue;
            }
            if (ch === "(" || ch === ")") { tokens.push({ type: ch === "(" ? "lparen" : "rparen", text: ch, start: i, end: i + 1 }); i++; continue; }
            if (ch === "," || ch === ";") { tokens.push({ type: "sep", text: ch, start: i, end: i + 1 }); i++; continue; }
            lexer.all.lastIndex = i;
            let match = lexer.all.exec(source);
            if (!match || !match[0].length) throw new SyntaxError("Unexpected character '" + ch + "' at " + i);
            let type = types[match.findIndex((group, index) => index > 0 && group !== undefined)];
            const range = type === "ref" ? webexpress.webui.SpreadsheetAddress.parseRange(match[0]) : null;
            // a reference outside the grid, such as A0, is no reference but an (unknown) name
            if (type === "ref" && !range) {
                lexer.ident.lastIndex = i;
                match = lexer.ident.exec(source);
                if (!match) throw new SyntaxError("Unexpected character '" + ch + "' at " + i);
                type = "ident";
            }
            const token = { type, text: match[0], start: i, end: i + match[0].length };
            if (type === "ref") token.range = range;
            if (type === "ident") {
                // a name followed by a parenthesis is a function, even where it reads like a cell (LOG10)
                let k = token.end;
                while (source[k] === " ") k++;
                if (source[k] === "(") token.type = "func";
                else if (/^(TRUE|FALSE)$/i.test(match[0])) token.type = "bool";
                else token.type = "name";
            }
            tokens.push(token);
            i = token.end;
        }
        return tokens;
    }

    /**
     * Parses a formula into an abstract syntax tree.
     * @param {string} text - The formula with its leading "=".
     * @returns {object} The root node.
     * @throws {SyntaxError} If the formula is malformed.
     */
    static parse(text) {
        const tokens = this.tokenize(text).filter(t => t.type !== "ws" && t.type !== "eq");
        let pos = 0;
        const peek = () => tokens[pos];
        const next = () => tokens[pos++];
        const expect = (type) => {
            const token = next();
            if (!token || token.type !== type) throw new SyntaxError("Expected " + type);
            return token;
        };
        const binary = { "=": 1, "<>": 1, "<": 1, ">": 1, "<=": 1, ">=": 1, "&": 2, "+": 3, "-": 3, "*": 4, "/": 4, "^": 5 };
        const expression = (min) => {
            let left = unary();
            for (;;) {
                const token = peek();
                if (token?.type === "op" && token.text === "%") { next(); left = { type: "percent", arg: left }; continue; }
                const precedence = token?.type === "op" ? binary[token.text] : undefined;
                if (precedence === undefined || precedence < min) return left;
                next();
                // all binary operators are left-associative, as in the common spreadsheets
                left = { type: "binary", op: token.text, left, right: expression(precedence + 1) };
            }
        };
        const unary = () => {
            const token = peek();
            if (token?.type === "op" && (token.text === "-" || token.text === "+")) {
                next();
                return { type: "unary", op: token.text, arg: unary() };
            }
            return primary();
        };
        const primary = () => {
            const token = next();
            if (!token) throw new SyntaxError("Unexpected end of formula");
            switch (token.type) {
                case "number": return { type: "number", value: Number(token.text) };
                case "string": return { type: "string", value: token.value };
                case "bool": return { type: "bool", value: token.text.toUpperCase() === "TRUE" };
                case "error": return { type: "error", value: token.text };
                case "ref": return this._refNode(token);
                case "idref": return { type: "error", value: "#REF!" };
                case "name": return { type: "name", name: token.text };
                case "lparen": {
                    const inner = expression(1);
                    expect("rparen");
                    return { type: "group", arg: inner };
                }
                case "func": {
                    expect("lparen");
                    const args = [];
                    if (peek()?.type === "rparen") { next(); return { type: "func", name: token.text.toUpperCase(), args }; }
                    for (;;) {
                        // an omitted argument, as in IF(A1,,1), counts as empty
                        if (peek()?.type === "sep" || peek()?.type === "rparen") args.push({ type: "missing" });
                        else args.push(expression(1));
                        const separator = next();
                        if (separator?.type === "rparen") break;
                        if (separator?.type !== "sep") throw new SyntaxError("Expected , or )");
                    }
                    return { type: "func", name: token.text.toUpperCase(), args };
                }
                default: throw new SyntaxError("Unexpected " + token.text);
            }
        };
        const root = expression(1);
        if (pos < tokens.length) throw new SyntaxError("Unexpected " + tokens[pos].text);
        return root;
    }

    /**
     * Builds the node of a reference token.
     * @param {object} token - The reference token, carrying the range the tokenizer parsed.
     * @returns {object} The ref node { type: "ref", sheet, r1, c1, r2, c2, kind, abs }.
     */
    static _refNode(token) {
        return { type: "ref", ...this.readRef(token.text, token.range) };
    }

    /**
     * Reads a reference including its absolute markers.
     * @param {string} text - The reference text, such as "Sheet2!$A$1:B3".
     * @returns {object} The reference { sheet, kind, r1, c1, r2, c2, abs: [r1, c1, r2, c2] }.
     */
    static readRef(text, parsed) {
        const range = parsed ?? webexpress.webui.SpreadsheetAddress.parseRange(text);
        const sheet = range.sheet;
        // the sheet prefix ends at the last "!", as a quoted name may itself contain one
        const rest = sheet ? text.slice(text.lastIndexOf("!") + 1) : text;
        const parts = rest.split(":");
        const absolute = (part, letter) => {
            // a part is $A$1, $A or $1: the first $ marks the leading kind, a second one the row
            if (letter) return part[0] === "$" && part.length > 1 && /[A-Za-z]/.test(part[1]);
            const digits = part.search(/\d/);
            return digits > 0 && part[digits - 1] === "$";
        };
        const a = parts[0], b = parts[1] ?? parts[0];
        return {
            sheet, kind: range.kind, r1: range.r1, c1: range.c1, r2: range.r2, c2: range.c2,
            abs: [absolute(a, false), absolute(a, true), absolute(b, false), absolute(b, true)]
        };
    }

    /**
     * Writes a reference back as text, keeping its absolute markers and its kind.
     * @param {object} ref - The reference as readRef returns it.
     * @returns {string} The text.
     */
    static writeRef(ref) {
        const Address = webexpress.webui.SpreadsheetAddress;
        const [ar1, ac1, ar2, ac2] = ref.abs ?? [false, false, false, false];
        const prefix = ref.sheet ? Address.quoteSheet(ref.sheet) + "!" : "";
        if (ref.kind === "cols") return prefix + (ac1 ? "$" : "") + Address.columnName(ref.c1) + ":" + (ac2 ? "$" : "") + Address.columnName(ref.c2);
        if (ref.kind === "rows") return prefix + (ar1 ? "$" : "") + (ref.r1 + 1) + ":" + (ar2 ? "$" : "") + (ref.r2 + 1);
        const start = Address.cellName(ref.r1, ref.c1, ar1, ac1);
        if (ref.kind === "cell") return prefix + start;
        return prefix + start + ":" + Address.cellName(ref.r2, ref.c2, ar2, ac2);
    }

    /**
     * Rewrites the references of a formula. The mapper receives every reference with "home"
     * set to the sheet the formula is on, and answers with the reference to write, with null
     * for #REF!, or with a string that replaces the reference text verbatim. A formula that
     * cannot be tokenized is returned unchanged.
     * @param {string} text - The formula.
     * @param {string|null} home - The name of the sheet the formula is on.
     * @param {Function} mapper - The mapper.
     * @returns {string} The rewritten formula.
     */
    static rewrite(text, home, mapper) {
        let tokens;
        try { tokens = this.tokenize(text); } catch { return text; }
        let changed = false;
        const out = tokens.map(token => {
            if (token.type !== "ref") return token.text;
            const ref = { ...this.readRef(token.text, token.range), home };
            const mapped = mapper(ref);
            if (mapped === ref) return token.text;
            changed = true;
            if (typeof mapped === "string") return mapped;
            if (!mapped) return "#REF!";
            const { home: _, ...plain } = mapped;
            return this.writeRef(plain);
        });
        return changed ? out.join("") : text;
    }

    /**
     * Moves the relative references of a formula by an offset, the way copying a formula to
     * another cell does. References pushed off the grid become #REF!.
     * @param {string} text - The formula.
     * @param {number} rows - The row offset.
     * @param {number} cols - The column offset.
     * @returns {string} The translated formula.
     */
    static translate(text, rows, cols) {
        if (!rows && !cols) return text;
        const Address = webexpress.webui.SpreadsheetAddress;
        return this.rewrite(text, null, ref => {
            const [ar1, ac1, ar2, ac2] = ref.abs;
            const next = { ...ref };
            if (ref.kind !== "cols") { next.r1 = ar1 ? ref.r1 : ref.r1 + rows; next.r2 = ar2 ? ref.r2 : ref.r2 + rows; }
            if (ref.kind !== "rows") { next.c1 = ac1 ? ref.c1 : ref.c1 + cols; next.c2 = ac2 ? ref.c2 : ref.c2 + cols; }
            if (next.r1 < 0 || next.c1 < 0 || next.r2 >= Address.MAX_ROWS || next.c2 >= Address.MAX_COLS) return null;
            return next;
        });
    }

    /**
     * Lists the references of a formula, for highlighting them while it is edited.
     * @param {string} text - The formula.
     * @returns {Array<object>} The references with their source positions.
     */
    static references(text) {
        let tokens;
        try { tokens = this.tokenize(text); } catch { return []; }
        return tokens.filter(t => t.type === "ref").map(t => ({ ...this.readRef(t.text, t.range), start: t.start, end: t.end, text: t.text }));
    }

    /**
     * Determines whether a caret position in a formula expects an operand, where clicking a cell
     * inserts its reference instead of ending the edit.
     * @param {string} text - The formula up to the caret.
     * @returns {boolean} True if a reference may be inserted.
     */
    static expectsOperand(text) {
        if (!String(text).startsWith("=")) return false;
        const trimmed = String(text).replace(/\s+$/, "");
        return /[=(,;+\-*/^&<>]$/.test(trimmed);
    }
};

/**
 * The registry of formula functions. Functions are registered once for every spreadsheet on
 * the page, the way editor plugins are; a spreadsheet created earlier picks a later
 * registration up through the change listeners.
 */
webexpress.webui.SpreadsheetFunctions = new class {
    /**
     * Creates the registry.
     */
    constructor() {
        this._functions = new Map();
        this._listeners = new Set();
    }

    /**
     * Registers a function. A definition is either the implementation itself or an object.
     * Arguments arrive evaluated: numbers, strings, booleans, null for an empty cell,
     * SpreadsheetError values, or SpreadsheetRange objects for ranges. Errors among the scalar
     * arguments are returned for the function unless it declares acceptErrors, and a lazy
     * function receives functions that evaluate each argument on demand.
     * @param {string} name - The name, case-insensitive (letters, digits, dots, underscores).
     * @param {Function|object} definition - The implementation or { fn, minArgs, maxArgs, lazy,
     * volatile, acceptErrors, category, description, syntax }.
     * @returns {this} The registry.
     * @throws {TypeError} If the name or the implementation is invalid.
     */
    register(name, definition) {
        const key = String(name ?? "").toUpperCase();
        if (!/^[A-Z_][A-Z0-9_.]{0,63}$/.test(key)) throw new TypeError("Invalid function name: " + name);
        const def = typeof definition === "function" ? { fn: definition } : { ...definition };
        if (typeof def.fn !== "function") throw new TypeError("A function needs an implementation.");
        def.name = key;
        def.minArgs = Number.isInteger(def.minArgs) ? def.minArgs : 0;
        def.maxArgs = Number.isInteger(def.maxArgs) ? def.maxArgs : Infinity;
        this._functions.set(key, def);
        this._notify(key);
        return this;
    }

    /**
     * Removes a function.
     * @param {string} name - The name.
     * @returns {boolean} True if a function was removed.
     */
    unregister(name) {
        const key = String(name ?? "").toUpperCase();
        const removed = this._functions.delete(key);
        if (removed) this._notify(key);
        return removed;
    }

    /**
     * Returns a function definition.
     * @param {string} name - The name, case-insensitive.
     * @returns {object|null} The definition.
     */
    get(name) { return this._functions.get(String(name ?? "").toUpperCase()) ?? null; }

    /**
     * Determines whether a function exists.
     * @param {string} name - The name.
     * @returns {boolean} True if registered.
     */
    has(name) { return this._functions.has(String(name ?? "").toUpperCase()); }

    /**
     * Returns all definitions, sorted by name, for the function list of the formula input.
     * @returns {Array<object>} The definitions.
     */
    getAll() { return [...this._functions.values()].sort((a, b) => a.name.localeCompare(b.name)); }

    /**
     * Subscribes to registrations and removals.
     * @param {Function} listener - Called with the function name.
     * @returns {Function} Unsubscribes again.
     */
    subscribe(listener) { this._listeners.add(listener); return () => this._listeners.delete(listener); }

    /**
     * Informs the subscribers; a failing subscriber does not stop the others.
     * @param {string} name - The changed function.
     */
    _notify(name) {
        for (const listener of this._listeners) {
            try { listener(name); } catch (e) { console.error(e); }
        }
    }
};

/**
 * A range argument of a function. It is read lazily, so a whole column costs only the cells
 * that hold something.
 */
webexpress.webui.SpreadsheetRange = class {
    /**
     * Initializes a new instance of the class.
     * @param {object} engine - The engine that resolves cell values.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {object} range - The bounds { r1, c1, r2, c2 }, clamped to the sheet.
     */
    constructor(engine, sheet, range) {
        this.engine = engine; this.sheet = sheet;
        this.r1 = range.r1; this.c1 = range.c1;
        this.r2 = Math.min(range.r2, sheet.rowCount - 1); this.c2 = Math.min(range.c2, sheet.colCount - 1);
    }

    /**
     * Gets the number of rows.
     * @returns {number} The row count.
     */
    get rows() { return Math.max(0, this.r2 - this.r1 + 1); }

    /**
     * Gets the number of columns.
     * @returns {number} The column count.
     */
    get cols() { return Math.max(0, this.c2 - this.c1 + 1); }

    /**
     * Returns the value at a position relative to the range.
     * @param {number} row - The row offset.
     * @param {number} col - The column offset.
     * @returns {*} The value.
     */
    at(row, col) { return this.engine.cellValue(this.sheet, this.r1 + row, this.c1 + col); }

    /**
     * Visits the cells that hold content, row by row.
     * @param {Function} callback - Called with (value, rowOffset, colOffset).
     */
    forEachValue(callback) {
        const rows = this.sheet.rows, last = Math.min(this.r2, rows.length - 1);
        for (let r = this.r1; r <= last; r++) {
            const cells = rows[r];
            if (!cells) continue;
            const end = Math.min(this.c2, cells.length - 1);
            for (let c = this.c1; c <= end; c++) {
                if (cells[c]) callback(this.engine.cellValue(this.sheet, r, c), r - this.r1, c - this.c1);
            }
        }
    }

    /**
     * Returns all values as rows, empty cells as null; meant for small ranges such as lookups.
     * @returns {Array<Array<*>>} The values.
     */
    toArray() {
        const out = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) row.push(this.at(r, c));
            out.push(row);
        }
        return out;
    }
};

/**
 * Coercion and iteration helpers the functions share, so built-in and registered functions
 * treat text, booleans, empty cells and errors alike.
 */
webexpress.webui.SpreadsheetValues = class {
    /**
     * Determines whether a value is an error.
     * @param {*} value - The value.
     * @returns {boolean} True for an error.
     */
    static isError(value) { return value instanceof webexpress.webui.SpreadsheetError; }

    /**
     * Creates an error value.
     * @param {string} code - The code, such as "#VALUE!".
     * @param {string} [message] - The description.
     * @returns {webexpress.webui.SpreadsheetError} The error.
     */
    static error(code, message) { return new webexpress.webui.SpreadsheetError(code, message); }

    /**
     * Reduces a range to its single value; a larger range is no scalar.
     * @param {*} value - The value or range.
     * @returns {*} The scalar.
     */
    static scalar(value) {
        if (value instanceof webexpress.webui.SpreadsheetRange) {
            return value.rows === 1 && value.cols === 1 ? value.at(0, 0) : this.error("#VALUE!", "A range was used where a single value is expected.");
        }
        return value;
    }

    /**
     * Converts a value to a number as arithmetic does: empty is 0, booleans are 1 and 0 and
     * numeric text is read.
     * @param {*} value - The value.
     * @returns {number|webexpress.webui.SpreadsheetError} The number or an error.
     */
    static toNumber(value) {
        value = this.scalar(value);
        if (this.isError(value)) return value;
        if (value === null || value === undefined || value === "") return 0;
        if (typeof value === "number") return value;
        if (typeof value === "boolean") return value ? 1 : 0;
        const text = String(value).trim();
        if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?%?$/.test(text)) return text.endsWith("%") ? Number(text.slice(0, -1)) / 100 : Number(text);
        const parsed = webexpress.webui.SpreadsheetFormat?.parseInput(text);
        if (parsed && typeof parsed.value === "number") return parsed.value;
        return this.error("#VALUE!", "\"" + text + "\" is not a number.");
    }

    /**
     * Converts a value to text as concatenation does.
     * @param {*} value - The value.
     * @returns {string|webexpress.webui.SpreadsheetError} The text or an error.
     */
    static toText(value) {
        value = this.scalar(value);
        if (this.isError(value)) return value;
        if (value === null || value === undefined) return "";
        if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
        if (typeof value === "number") return this.numberText(value);
        return String(value);
    }

    /**
     * Writes a number the way the General format does, without float noise such as 0.1+0.2.
     * @param {number} value - The number.
     * @returns {string} The text.
     */
    static numberText(value) {
        if (Number.isInteger(value)) return String(value);
        const text = String(Number(value.toPrecision(15)));
        return text;
    }

    /**
     * Converts a value to a boolean as logical functions do.
     * @param {*} value - The value.
     * @returns {boolean|webexpress.webui.SpreadsheetError} The boolean or an error.
     */
    static toBool(value) {
        value = this.scalar(value);
        if (this.isError(value)) return value;
        if (value === null || value === undefined) return false;
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        const text = String(value).trim().toUpperCase();
        if (text === "TRUE") return true;
        if (text === "FALSE") return false;
        return this.error("#VALUE!", "\"" + value + "\" is no truth value.");
    }

    /**
     * Collects the numbers of arguments the way SUM does: a direct argument is converted, while
     * text and booleans inside ranges are skipped. The first error wins.
     * @param {Array<*>} args - The arguments.
     * @returns {Array<number>|webexpress.webui.SpreadsheetError} The numbers or an error.
     */
    static numbers(args) {
        const out = [];
        for (const arg of args) {
            if (arg instanceof webexpress.webui.SpreadsheetRange) {
                let failure = null;
                arg.forEachValue(value => {
                    if (failure) return;
                    if (this.isError(value)) failure = value;
                    else if (typeof value === "number") out.push(value);
                });
                if (failure) return failure;
            } else if (arg !== null && arg !== undefined) {
                const value = this.toNumber(arg);
                if (this.isError(value)) return value;
                out.push(value);
            }
        }
        return out;
    }

    /**
     * Visits every value of the arguments, ranges expanded to their filled cells.
     * @param {Array<*>} args - The arguments.
     * @param {Function} callback - Called with each value; returning false stops.
     */
    static each(args, callback) {
        for (const arg of args) {
            if (arg instanceof webexpress.webui.SpreadsheetRange) {
                let stop = false;
                arg.forEachValue(value => { if (!stop && callback(value) === false) stop = true; });
                if (stop) return;
            } else if (callback(arg) === false) return;
        }
    }

    /**
     * Compares two values by the ordering of the common spreadsheets: numbers before text
     * before booleans, text case-insensitive, an empty cell as zero or empty text.
     * @param {*} a - The first value.
     * @param {*} b - The second value.
     * @returns {number} Negative, zero or positive.
     */
    static compare(a, b) {
        const rank = v => (typeof v === "number" ? 0 : typeof v === "string" ? 1 : typeof v === "boolean" ? 2 : 3);
        if (a === null || a === undefined) a = typeof b === "string" ? "" : typeof b === "boolean" ? false : 0;
        if (b === null || b === undefined) b = typeof a === "string" ? "" : typeof a === "boolean" ? false : 0;
        const ra = rank(a), rb = rank(b);
        if (ra !== rb) return ra - rb;
        if (typeof a === "string") return a.localeCompare(b, undefined, { sensitivity: "accent" });
        return a < b ? -1 : a > b ? 1 : 0;
    }

    /**
     * Builds a matcher from a criterion such as ">5", "<>done", "a*" or a plain value, as
     * COUNTIF and SUMIF accept it.
     * @param {*} criterion - The criterion.
     * @returns {Function} Tests a value.
     */
    static criterion(criterion) {
        if (typeof criterion !== "string") return value => this.compare(value, criterion) === 0 && value !== null;
        const match = /^(<=|>=|<>|<|>|=)?(.*)$/s.exec(criterion);
        const op = match[1] || "=", raw = match[2];
        const number = raw.trim() !== "" && !isNaN(Number(raw)) ? Number(raw) : null;
        const operand = number ?? (/^(TRUE|FALSE)$/i.test(raw) ? raw.toUpperCase() === "TRUE" : raw);
        const wildcard = typeof operand === "string" && /[*?]/.test(operand)
            ? new RegExp("^" + operand.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i") : null;
        return value => {
            if (op === "=" || op === "<>") {
                let equal;
                if (wildcard) equal = typeof value === "string" && wildcard.test(value);
                else if (operand === "") equal = value === null || value === "";
                else equal = value !== null && value !== "" && this.compare(value, operand) === 0;
                return op === "=" ? equal : !equal;
            }
            if (value === null || value === "" || typeof value !== typeof operand) return false;
            const order = this.compare(value, operand);
            return op === "<" ? order < 0 : op === ">" ? order > 0 : op === "<=" ? order <= 0 : order >= 0;
        };
    }
};

/**
 * The calculation engine. It parses the formulas of a workbook, tracks which cells each
 * formula reads and recalculates exactly the formulas a change reaches, in dependency order.
 * Evaluation runs iteratively over an explicit stack, so a chain of hundreds of thousands of
 * formulas - a running total down a long column - neither recurses deeply nor overflows.
 */
webexpress.webui.SpreadsheetEngine = class {
    /**
     * The column stride of the numeric cell keys.
     */
    static STRIDE = 16384;

    /**
     * Ranges spanning more columns than this are kept in one list instead of per column.
     */
    static WIDE = 64;

    /**
     * Initializes a new instance of the class.
     * @param {webexpress.webui.SpreadsheetModel} model - The workbook.
     * @param {object} [options] - The options.
     * @param {object} [options.functions] - The function registry.
     * @param {Function} [options.now] - The clock for TODAY and NOW, replaceable in tests.
     */
    constructor(model, options = {}) {
        this.model = model;
        this.functions = options.functions ?? webexpress.webui.SpreadsheetFunctions;
        this.now = options.now ?? (() => new Date());
        this.rebuild();
    }

    /**
     * Forgets all state and parses and calculates every formula of the workbook. Structural
     * changes take this path, because they move many cells at once.
     * @returns {Set<object>} The formula entries, all of them recalculated.
     */
    rebuild() {
        this._entries = new Map(); this._values = new Map();
        this._dependents = new Map(); this._ranges = new Map(); this._names = new Set(); this._volatiles = new Set();
        for (const sheet of this.model.sheets) sheet.forEachCell((cell, row, col) => { if (cell.f) this._register(sheet, row, col, cell.f); });
        const all = new Set();
        for (const map of this._entries.values()) for (const entry of map.values()) all.add(entry);
        this._evaluate(all);
        return all;
    }

    /**
     * Brings the engine up to date with a change log of the model and recalculates what the
     * change reaches.
     * @param {object} changes - The change log of SpreadsheetModel.apply.
     * @returns {Array<object>} The formula cells whose value changed { sheet, row, col, value }.
     */
    update(changes) {
        if (changes.structure.length || changes.sheets.length || changes.names) {
            const before = this._snapshot();
            this.rebuild();
            return this._diff(before);
        }
        // only the values of what the change reaches are recorded: a snapshot of every formula
        // would make an edit cost the size of the workbook rather than the size of the change
        const before = new Map();
        const dirty = new Set();
        const touched = [];
        for (const change of changes.cells) {
            const sheet = this.model.sheet(change.sheet);
            if (!sheet) continue;
            if ((change.before?.f ?? null) !== (change.after?.f ?? null)) {
                const old = this._unregister(sheet, change.row, change.col);
                if (change.after?.f) {
                    const entry = this._register(sheet, change.row, change.col, change.after.f);
                    // a cell that held no formula had no formula value; undefined keeps it reported
                    before.set(entry.sheet.id + ":" + entry.key, old?.value);
                    dirty.add(entry);
                }
            }
            touched.push([sheet, change.row, change.col]);
        }
        this._collectDependents(touched, dirty);
        for (const entry of this._volatiles) dirty.add(entry);
        for (const entry of dirty) {
            const id = entry.sheet.id + ":" + entry.key;
            if (!before.has(id)) before.set(id, entry.value);
        }
        this._evaluate(dirty);
        return this._diff(before, dirty);
    }

    /**
     * Recalculates every formula, as a forced recalculation does.
     * @returns {Array<object>} The formula cells whose value changed.
     */
    recalculate() {
        const before = this._snapshot();
        this.rebuild();
        return this._diff(before);
    }

    /**
     * Returns the value of a cell: the result of a formula, or the stored value.
     * @param {webexpress.webui.SpreadsheetSheet|string} sheet - The sheet or its id.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @returns {*} The value; null for an empty cell.
     */
    cellValue(sheet, row, col) {
        if (typeof sheet === "string") sheet = this.model.sheet(sheet);
        if (!sheet) return new webexpress.webui.SpreadsheetError("#REF!");
        if (row < 0 || col < 0 || row >= sheet.rowCount || col >= sheet.colCount) return new webexpress.webui.SpreadsheetError("#REF!");
        const entry = this._entries.get(sheet.id)?.get(row * this.constructor.STRIDE + col);
        if (entry) {
            // a formula read before it was calculated in this pass is calculated now
            if (!entry.done) this._evaluate(new Set([entry]));
            return entry.value;
        }
        return this.constructor.storedValue(sheet.getCell(row, col));
    }

    /**
     * Converts a stored cell to the value formulas see. Custom types provide their own value.
     * @param {object|null} cell - The cell.
     * @returns {*} The value.
     */
    static storedValue(cell) {
        if (!cell) return null;
        // a typed cell answers even without a value, as an unticked checkbox is FALSE
        if (cell.t) {
            const type = webexpress.webui.SpreadsheetTypes?.get(cell.t);
            if (type?.toValue) return type.toValue(cell.v, cell) ?? null;
        }
        if (cell.v === undefined) return null;
        return typeof cell.v === "object" ? null : cell.v;
    }

    /**
     * Evaluates a formula that is not stored in a cell, for the API and the status bar.
     * @param {string} text - The formula, with or without "=".
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet it is evaluated on.
     * @param {number} [row=0] - The row it is evaluated at.
     * @param {number} [col=0] - The column it is evaluated at.
     * @returns {*} The result.
     */
    evaluate(text, sheet, row = 0, col = 0) {
        const formula = String(text).startsWith("=") ? String(text) : "=" + text;
        let ast;
        try { ast = webexpress.webui.SpreadsheetFormula.parse(formula); } catch (e) { return new webexpress.webui.SpreadsheetError("#ERROR!", e.message); }
        const result = this._eval(ast, { sheet, row, col, entry: null });
        return webexpress.webui.SpreadsheetValues.scalar(result);
    }

    /**
     * Returns the parse error of a formula cell, if any.
     * @param {string} sheetId - The sheet id.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @returns {string|null} The message.
     */
    problem(sheetId, row, col) {
        const value = this._entries.get(sheetId)?.get(row * this.constructor.STRIDE + col)?.value;
        return value instanceof webexpress.webui.SpreadsheetError ? value.message || null : null;
    }

    /**
     * Determines whether any formula uses a function, so a newly registered function only
     * triggers a recalculation where it matters.
     * @param {string} name - The function name.
     * @returns {boolean} True if a formula calls it.
     */
    uses(name) {
        for (const map of this._entries.values()) for (const entry of map.values()) if (entry.functions.has(name)) return true;
        return false;
    }

    /**
     * Parses a formula cell and records what it reads.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @param {string} text - The formula.
     * @returns {object} The entry.
     */
    _register(sheet, row, col, text) {
        const key = row * this.constructor.STRIDE + col;
        const entry = { sheet, row, col, key, text, ast: null, refs: [], functions: new Set(), volatile: false, value: null, done: false, error: null };
        try { entry.ast = webexpress.webui.SpreadsheetFormula.parse(text); } catch (e) { entry.error = e.message; }
        if (entry.ast) this._collect(entry.ast, entry);
        let map = this._entries.get(sheet.id);
        if (!map) this._entries.set(sheet.id, map = new Map());
        map.set(key, entry);
        for (const ref of entry.refs) this._link(ref, entry);
        if (entry.names) this._names.add(entry);
        if (entry.volatile) this._volatiles.add(entry);
        return entry;
    }

    /**
     * Removes a formula cell and its dependency links.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @returns {object|null} The removed entry, carrying its last value; null without a formula.
     */
    _unregister(sheet, row, col) {
        const key = row * this.constructor.STRIDE + col;
        const map = this._entries.get(sheet.id);
        const entry = map?.get(key);
        if (!entry) return null;
        map.delete(key);
        for (const ref of entry.refs) this._unlink(ref, entry);
        this._names.delete(entry);
        this._volatiles.delete(entry);
        return entry;
    }

    /**
     * Collects the references, names and functions of a parsed formula.
     * @param {object} node - The node.
     * @param {object} entry - The entry receiving them.
     */
    _collect(node, entry) {
        const stack = [node];
        while (stack.length) {
            const current = stack.pop();
            switch (current.type) {
                case "ref": {
                    const sheet = current.sheet ? this.model.sheet(current.sheet) : entry.sheet;
                    if (sheet) entry.refs.push({ sheet: sheet.id, r1: current.r1, c1: current.c1, r2: current.r2, c2: current.c2 });
                    break;
                }
                case "name": entry.names = true; break;
                case "func":
                    entry.functions.add(current.name);
                    if (this.functions.get(current.name)?.volatile) entry.volatile = true;
                    stack.push(...current.args);
                    break;
                case "binary": stack.push(current.left, current.right); break;
                case "unary": case "percent": case "group": stack.push(current.arg); break;
            }
        }
    }

    /**
     * Links a reference to the entry reading it: a single cell directly, a range per column,
     * or in the list of wide ranges.
     * @param {object} ref - The reference.
     * @param {object} entry - The reading entry.
     */
    _link(ref, entry) {
        if (ref.r1 === ref.r2 && ref.c1 === ref.c2) {
            let map = this._dependents.get(ref.sheet);
            if (!map) this._dependents.set(ref.sheet, map = new Map());
            const key = ref.r1 * this.constructor.STRIDE + ref.c1;
            // most cells have one reader, which is kept without a set of its own
            const readers = map.get(key);
            if (!readers) map.set(key, entry);
            else if (readers instanceof Set) readers.add(entry);
            else if (readers !== entry) map.set(key, new Set([readers, entry]));
            return;
        }
        let index = this._ranges.get(ref.sheet);
        if (!index) this._ranges.set(ref.sheet, index = { cols: new Map(), wide: new Set() });
        const item = { ref, entry };
        ref.item = item;
        if (ref.c2 - ref.c1 >= this.constructor.WIDE) { index.wide.add(item); return; }
        for (let c = ref.c1; c <= ref.c2; c++) {
            let set = index.cols.get(c);
            if (!set) index.cols.set(c, set = new Set());
            set.add(item);
        }
    }

    /**
     * Removes a link created by _link.
     * @param {object} ref - The reference.
     * @param {object} entry - The reading entry.
     */
    _unlink(ref, entry) {
        if (ref.r1 === ref.r2 && ref.c1 === ref.c2) {
            const map = this._dependents.get(ref.sheet), key = ref.r1 * this.constructor.STRIDE + ref.c1;
            const readers = map?.get(key);
            if (readers === entry) map.delete(key);
            else if (readers instanceof Set) readers.delete(entry);
            return;
        }
        const index = this._ranges.get(ref.sheet);
        if (!index || !ref.item) return;
        index.wide.delete(ref.item);
        for (let c = ref.c1; c <= ref.c2 && ref.c2 - ref.c1 < this.constructor.WIDE; c++) index.cols.get(c)?.delete(ref.item);
    }

    /**
     * Finds the formulas reading a cell.
     * @param {string} sheetId - The sheet id.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @param {Function} visit - Called with each reading entry.
     */
    _readers(sheetId, row, col, visit) {
        const readers = this._dependents.get(sheetId)?.get(row * this.constructor.STRIDE + col);
        if (readers instanceof Set) readers.forEach(visit); else if (readers) visit(readers);
        const index = this._ranges.get(sheetId);
        if (!index) return;
        const test = item => { if (row >= item.ref.r1 && row <= item.ref.r2 && col >= item.ref.c1 && col <= item.ref.c2) visit(item.entry); };
        index.cols.get(col)?.forEach(test);
        index.wide.forEach(test);
    }

    /**
     * Adds every formula a set of changed cells reaches, transitively, to the dirty set.
     * @param {Array<Array>} cells - The changed cells as [sheet, row, col].
     * @param {Set<object>} dirty - The dirty set, extended in place.
     */
    _collectDependents(cells, dirty) {
        const queue = cells.map(([sheet, row, col]) => [sheet.id, row, col]);
        for (const entry of dirty) queue.push([entry.sheet.id, entry.row, entry.col]);
        const seen = new Set();
        while (queue.length) {
            const [sheetId, row, col] = queue.pop();
            const key = sheetId + ":" + (row * this.constructor.STRIDE + col);
            if (seen.has(key)) continue;
            seen.add(key);
            this._readers(sheetId, row, col, entry => {
                if (dirty.has(entry)) return;
                dirty.add(entry);
                queue.push([entry.sheet.id, entry.row, entry.col]);
            });
        }
        // a formula naming a range may read anything; names are rare, so they always recalculate
        if (dirty.size || cells.length) this._names.forEach(entry => dirty.add(entry));
    }

    /**
     * Calculates a set of entries in dependency order. The order comes from an iterative
     * depth-first search over the precedents inside the set; an entry met again while it is
     * still open closes a cycle, and every entry on that cycle evaluates to #CIRC!.
     * @param {Set<object>} dirty - The entries to calculate.
     */
    _evaluate(dirty) {
        for (const entry of dirty) entry.done = false;
        const state = new Map();
        const order = [];
        for (const start of dirty) {
            if (state.has(start)) continue;
            const stack = [{ entry: start, precedents: null, index: 0 }];
            state.set(start, 1);
            while (stack.length) {
                const frame = stack[stack.length - 1];
                frame.precedents ??= this._precedents(frame.entry, dirty);
                if (frame.index < frame.precedents.length) {
                    const next = frame.precedents[frame.index++];
                    const mark = state.get(next);
                    if (mark === 1) {
                        // everything on the stack from the repeated entry upward lies on the cycle
                        for (let i = stack.length - 1; i >= 0; i--) {
                            stack[i].entry.cyclic = true;
                            if (stack[i].entry === next) break;
                        }
                    } else if (mark === undefined) {
                        state.set(next, 1);
                        stack.push({ entry: next, precedents: null, index: 0 });
                    }
                    continue;
                }
                state.set(frame.entry, 2);
                order.push(frame.entry);
                stack.pop();
            }
        }
        for (const entry of order) {
            if (entry.cyclic) {
                entry.value = new webexpress.webui.SpreadsheetError("#CIRC!", "The formula refers to itself through its references.");
            } else if (entry.error) {
                entry.value = new webexpress.webui.SpreadsheetError("#ERROR!", entry.error);
            } else {
                entry.done = true;
                try {
                    entry.value = this._result(this._eval(entry.ast, { sheet: entry.sheet, row: entry.row, col: entry.col, entry }));
                } catch (e) {
                    entry.value = new webexpress.webui.SpreadsheetError("#ERROR!", e.message);
                }
            }
            entry.done = true;
            entry.cyclic = false;
        }
    }

    /**
     * Lists the entries inside a dirty set that an entry reads.
     * @param {object} entry - The entry.
     * @param {Set<object>} dirty - The dirty set.
     * @returns {Array<object>} The precedents.
     */
    _precedents(entry, dirty) {
        const out = [];
        for (const ref of entry.refs) {
            const map = this._entries.get(ref.sheet);
            if (!map) continue;
            const area = (ref.r2 - ref.r1 + 1) * (ref.c2 - ref.c1 + 1);
            if (area <= map.size) {
                const lastRow = Math.min(ref.r2, (this.model.sheet(ref.sheet)?.rowCount ?? 0) - 1);
                for (let r = ref.r1; r <= lastRow; r++) {
                    for (let c = ref.c1; c <= ref.c2; c++) {
                        const other = map.get(r * this.constructor.STRIDE + c);
                        if (other && dirty.has(other)) out.push(other);
                    }
                }
            } else {
                for (const other of map.values()) {
                    if (dirty.has(other) && other.row >= ref.r1 && other.row <= ref.r2 && other.col >= ref.c1 && other.col <= ref.c2) out.push(other);
                }
            }
        }
        // a named range may cover any cell, so its readers come after every other formula
        if (entry.names) for (const other of dirty) if (other !== entry && !other.names) out.push(other);
        return out;
    }

    /**
     * Turns the outcome of a formula into a cell value: a range shows its single value.
     * @param {*} value - The outcome.
     * @returns {*} The value.
     */
    _result(value) {
        const Values = webexpress.webui.SpreadsheetValues;
        value = Values.scalar(value);
        if (typeof value === "number" && !Number.isFinite(value)) return Values.error("#NUM!");
        return value === undefined ? null : value;
    }

    /**
     * Evaluates a node.
     * @param {object} node - The node.
     * @param {object} ctx - The context { sheet, row, col, entry }.
     * @returns {*} The value.
     */
    _eval(node, ctx) {
        const Values = webexpress.webui.SpreadsheetValues;
        switch (node.type) {
            case "number": case "string": case "bool": return node.value;
            case "error": return Values.error(node.value);
            case "missing": return null;
            case "group": return this._eval(node.arg, ctx);
            case "ref": {
                const sheet = node.sheet ? this.model.sheet(node.sheet) : ctx.sheet;
                if (!sheet) return Values.error("#REF!", "Unknown sheet " + node.sheet + ".");
                if (node.kind === "cell") return this.cellValue(sheet, node.r1, node.c1);
                return new webexpress.webui.SpreadsheetRange(this, sheet, node);
            }
            case "name": {
                const text = this.model.names[node.name] ?? Object.entries(this.model.names).find(([name]) => name.toLowerCase() === node.name.toLowerCase())?.[1];
                if (!text) return Values.error("#NAME?", "Unknown name " + node.name + ".");
                const range = webexpress.webui.SpreadsheetAddress.parseRange(text);
                const sheet = range?.sheet ? this.model.sheet(range.sheet) : ctx.sheet;
                if (!range || !sheet) return Values.error("#REF!");
                if (range.kind === "cell") return this.cellValue(sheet, range.r1, range.c1);
                return new webexpress.webui.SpreadsheetRange(this, sheet, range);
            }
            case "percent": {
                const value = Values.toNumber(this._eval(node.arg, ctx));
                return Values.isError(value) ? value : value / 100;
            }
            case "unary": {
                const value = Values.toNumber(this._eval(node.arg, ctx));
                return Values.isError(value) ? value : node.op === "-" ? -value : value;
            }
            case "binary": return this._binary(node.op, this._eval(node.left, ctx), this._eval(node.right, ctx));
            case "func": return this._call(node, ctx);
            default: return Values.error("#ERROR!", "Unknown node " + node.type);
        }
    }

    /**
     * Applies a binary operator.
     * @param {string} op - The operator.
     * @param {*} left - The left operand.
     * @param {*} right - The right operand.
     * @returns {*} The result.
     */
    _binary(op, left, right) {
        const Values = webexpress.webui.SpreadsheetValues;
        left = Values.scalar(left); right = Values.scalar(right);
        if (Values.isError(left)) return left;
        if (Values.isError(right)) return right;
        if (op === "&") return Values.toText(left) + Values.toText(right);
        if (["=", "<>", "<", ">", "<=", ">="].includes(op)) {
            const order = Values.compare(left, right);
            return op === "=" ? order === 0 : op === "<>" ? order !== 0 : op === "<" ? order < 0 : op === ">" ? order > 0 : op === "<=" ? order <= 0 : order >= 0;
        }
        const a = Values.toNumber(left), b = Values.toNumber(right);
        if (Values.isError(a)) return a;
        if (Values.isError(b)) return b;
        switch (op) {
            case "+": return a + b;
            case "-": return a - b;
            case "*": return a * b;
            case "/": return b === 0 ? Values.error("#DIV/0!", "Division by zero.") : a / b;
            case "^": {
                const result = Math.pow(a, b);
                return Number.isFinite(result) ? result : Values.error("#NUM!");
            }
        }
        return Values.error("#ERROR!");
    }

    /**
     * Calls a function.
     * @param {object} node - The function node.
     * @param {object} ctx - The context.
     * @returns {*} The result.
     */
    _call(node, ctx) {
        const Values = webexpress.webui.SpreadsheetValues;
        const def = this.functions.get(node.name);
        if (!def) return Values.error("#NAME?", "Unknown function " + node.name + ".");
        if (node.args.length < def.minArgs || node.args.length > def.maxArgs) {
            return Values.error("#N/A", node.name + " expects " + (def.minArgs === def.maxArgs ? def.minArgs : def.minArgs + (def.maxArgs === Infinity ? " or more" : " to " + def.maxArgs)) + " arguments.");
        }
        const api = { engine: this, sheet: ctx.sheet, row: ctx.row, col: ctx.col, now: this.now, values: Values };
        if (def.lazy) return def.fn(node.args.map(arg => () => this._eval(arg, ctx)), api);
        // a reference to one cell is passed as a range, so functions skip text in referenced
        // cells (AVERAGE(C1) over text is #DIV/0!) and ROW(B3) still knows the cell
        const args = node.args.map(arg => (arg.type === "ref" && arg.kind === "cell" ? this._range(arg, ctx) : this._eval(arg, ctx)));
        if (!def.acceptErrors) {
            const failure = args.find(arg => Values.isError(arg));
            if (failure) return failure;
        }
        try {
            const result = def.fn(args, api);
            return result === undefined ? null : result;
        } catch (e) {
            return Values.error("#VALUE!", e.message);
        }
    }

    /**
     * Resolves a single-cell reference as a range.
     * @param {object} node - The reference node.
     * @param {object} ctx - The context.
     * @returns {*} The range, or #REF! for an unknown sheet.
     */
    _range(node, ctx) {
        const sheet = node.sheet ? this.model.sheet(node.sheet) : ctx.sheet;
        if (!sheet) return webexpress.webui.SpreadsheetValues.error("#REF!", "Unknown sheet " + node.sheet + ".");
        return new webexpress.webui.SpreadsheetRange(this, sheet, node);
    }

    /**
     * Records the values of all formulas, so a recalculation can report what really changed.
     * @returns {Map<object, *>} The values by entry.
     */
    _snapshot() {
        const out = new Map();
        for (const map of this._entries.values()) for (const entry of map.values()) out.set(entry.sheet.id + ":" + entry.key, entry.value);
        return out;
    }

    /**
     * Lists the formula cells whose value differs from a snapshot.
     * @param {Map<string, *>} before - The snapshot.
     * @param {Set<object>} [only] - The entries to compare; all if omitted.
     * @returns {Array<object>} The changed cells.
     */
    _diff(before, only) {
        const out = [];
        const same = (a, b) => a === b || (a instanceof webexpress.webui.SpreadsheetError && b instanceof webexpress.webui.SpreadsheetError && a.code === b.code);
        const visit = entry => {
            const old = before.get(entry.sheet.id + ":" + entry.key);
            if (!same(old, entry.value)) out.push({ sheet: entry.sheet.id, row: entry.row, col: entry.col, value: entry.value, before: old ?? null });
        };
        if (only) only.forEach(visit);
        else for (const map of this._entries.values()) map.forEach(visit);
        return out;
    }
};

/**
 * The built-in functions. They are registered like any custom function, so a project can
 * replace one by registering its own under the same name.
 */
(() => {
    const F = webexpress.webui.SpreadsheetFunctions, V = webexpress.webui.SpreadsheetValues;
    const isRange = value => value instanceof webexpress.webui.SpreadsheetRange;
    const numeric = (fn) => (args) => {
        const values = V.numbers(args);
        return V.isError(values) ? values : fn(values);
    };
    const text = (value) => V.toText(value);
    const number = (value) => V.toNumber(value);
    const pick = (value, convert) => { const result = convert(value); return result; };
    const serial = (date) => webexpress.webui.SpreadsheetFormat.dateToSerial(date);
    const date = (value) => {
        const n = number(value);
        return V.isError(n) ? n : webexpress.webui.SpreadsheetFormat.serialToDate(n);
    };
    const round = (value, digits, mode) => {
        const factor = Math.pow(10, digits);
        const scaled = Number((value * factor).toPrecision(15));
        const rounded = mode === "up" ? Math.sign(scaled) * Math.ceil(Math.abs(scaled)) : mode === "down" ? Math.trunc(scaled) : Math.sign(scaled) * Math.round(Math.abs(scaled));
        return rounded / factor;
    };

    const sum = numeric(values => values.reduce((a, b) => a + b, 0));
    const average = numeric(values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : V.error("#DIV/0!", "No numbers to average."));
    const describe = (category, syntax, description) => ({ category, syntax, description });

    F.register("SUM", { fn: sum, minArgs: 1, ...describe("math", "SUM(value1, [value2, ...])", "Adds numbers and the numbers in ranges.") });
    F.register("AVG", { fn: average, minArgs: 1, ...describe("statistics", "AVG(value1, [value2, ...])", "Returns the arithmetic mean.") });
    F.register("AVERAGE", { fn: average, minArgs: 1, ...describe("statistics", "AVERAGE(value1, [value2, ...])", "Returns the arithmetic mean.") });
    F.register("MIN", { fn: numeric(values => (values.length ? Math.min(...values) : 0)), minArgs: 1, ...describe("statistics", "MIN(value1, [value2, ...])", "Returns the smallest number.") });
    F.register("MAX", { fn: numeric(values => (values.length ? Math.max(...values) : 0)), minArgs: 1, ...describe("statistics", "MAX(value1, [value2, ...])", "Returns the largest number.") });
    F.register("PRODUCT", { fn: numeric(values => values.reduce((a, b) => a * b, 1)), minArgs: 1, ...describe("math", "PRODUCT(value1, [value2, ...])", "Multiplies numbers.") });
    F.register("MEDIAN", {
        fn: numeric(values => {
            if (!values.length) return V.error("#NUM!");
            const sorted = [...values].sort((a, b) => a - b), mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        }), minArgs: 1, ...describe("statistics", "MEDIAN(value1, [value2, ...])", "Returns the median.")
    });
    F.register("COUNT", {
        fn: (args) => {
            let count = 0;
            for (const arg of args) {
                if (isRange(arg)) arg.forEachValue(value => { if (typeof value === "number") count++; });
                else if (typeof arg === "number" || (typeof arg === "string" && !V.isError(V.toNumber(arg)) && arg.trim() !== "")) count++;
            }
            return count;
        }, minArgs: 1, acceptErrors: true, ...describe("statistics", "COUNT(value1, [value2, ...])", "Counts the numbers.")
    });
    F.register("COUNTA", {
        fn: (args) => {
            let count = 0;
            V.each(args, value => { if (value !== null && value !== undefined && value !== "") count++; });
            return count;
        }, minArgs: 1, acceptErrors: true, ...describe("statistics", "COUNTA(value1, [value2, ...])", "Counts the cells that are not empty.")
    });
    F.register("COUNTBLANK", {
        fn: ([range]) => {
            if (!isRange(range)) return range === null || range === "" ? 1 : 0;
            let filled = 0;
            range.forEachValue(value => { if (value !== null && value !== "") filled++; });
            return range.rows * range.cols - filled;
        }, minArgs: 1, maxArgs: 1, ...describe("statistics", "COUNTBLANK(range)", "Counts the empty cells.")
    });
    F.register("COUNTIF", {
        fn: ([range, criterion]) => {
            const test = V.criterion(V.scalar(criterion));
            if (!isRange(range)) return test(range) ? 1 : 0;
            let count = 0;
            for (let r = 0; r < range.rows; r++) for (let c = 0; c < range.cols; c++) if (test(range.at(r, c))) count++;
            return count;
        }, minArgs: 2, maxArgs: 2, ...describe("statistics", "COUNTIF(range, criterion)", "Counts the cells meeting a criterion such as \">5\".")
    });
    F.register("SUMIF", {
        fn: ([range, criterion, sumRange]) => {
            const test = V.criterion(V.scalar(criterion));
            if (!isRange(range)) return V.error("#VALUE!");
            const target = isRange(sumRange) ? sumRange : range;
            let total = 0;
            range.forEachValue((value, r, c) => {
                if (!test(value)) return;
                const add = target.at(r, c);
                if (typeof add === "number") total += add;
            });
            return total;
        }, minArgs: 2, maxArgs: 3, ...describe("math", "SUMIF(range, criterion, [sum_range])", "Adds the cells meeting a criterion.")
    });
    F.register("AVERAGEIF", {
        fn: ([range, criterion, avgRange]) => {
            const test = V.criterion(V.scalar(criterion));
            if (!isRange(range)) return V.error("#VALUE!");
            const target = isRange(avgRange) ? avgRange : range;
            let total = 0, count = 0;
            range.forEachValue((value, r, c) => {
                if (!test(value)) return;
                const add = target.at(r, c);
                if (typeof add === "number") { total += add; count++; }
            });
            return count ? total / count : V.error("#DIV/0!");
        }, minArgs: 2, maxArgs: 3, ...describe("statistics", "AVERAGEIF(range, criterion, [average_range])", "Averages the cells meeting a criterion.")
    });

    F.register("IF", {
        fn: ([condition, then, otherwise]) => {
            const test = V.toBool(condition());
            if (V.isError(test)) return test;
            if (test) return then ? then() : true;
            return otherwise ? otherwise() : false;
        }, minArgs: 1, maxArgs: 3, lazy: true, ...describe("logical", "IF(condition, [value_if_true], [value_if_false])", "Chooses a value by a condition.")
    });
    F.register("IFERROR", {
        fn: ([value, fallback]) => {
            const result = V.scalar(value());
            return V.isError(result) ? fallback() : result;
        }, minArgs: 2, maxArgs: 2, lazy: true, ...describe("logical", "IFERROR(value, value_if_error)", "Returns a fallback for an error.")
    });
    const logical = (combine, initial) => (args) => {
        let result = initial, seen = false;
        for (const arg of args) {
            const values = [];
            if (isRange(arg)) arg.forEachValue(value => values.push(value)); else values.push(arg);
            for (const value of values) {
                if (V.isError(value)) return value;
                if (isRange(arg) && typeof value === "string") continue;
                const bool = V.toBool(value);
                if (V.isError(bool)) return bool;
                result = combine(result, bool); seen = true;
            }
        }
        return seen ? result : V.error("#VALUE!", "No truth values.");
    };
    F.register("AND", { fn: logical((a, b) => a && b, true), minArgs: 1, acceptErrors: true, ...describe("logical", "AND(logical1, [logical2, ...])", "True if all arguments are true.") });
    F.register("OR", { fn: logical((a, b) => a || b, false), minArgs: 1, acceptErrors: true, ...describe("logical", "OR(logical1, [logical2, ...])", "True if any argument is true.") });
    F.register("XOR", { fn: logical((a, b) => a !== b, false), minArgs: 1, acceptErrors: true, ...describe("logical", "XOR(logical1, [logical2, ...])", "True if an odd number of arguments is true.") });
    F.register("NOT", {
        fn: ([value]) => { const bool = V.toBool(value); return V.isError(bool) ? bool : !bool; },
        minArgs: 1, maxArgs: 1, ...describe("logical", "NOT(logical)", "Reverses a truth value.")
    });
    F.register("TRUE", { fn: () => true, maxArgs: 0, ...describe("logical", "TRUE()", "The truth value TRUE.") });
    F.register("FALSE", { fn: () => false, maxArgs: 0, ...describe("logical", "FALSE()", "The truth value FALSE.") });

    const concat = (args) => {
        let out = "";
        for (const arg of args) {
            if (isRange(arg)) {
                let failure = null;
                for (let r = 0; r < arg.rows && !failure; r++) for (let c = 0; c < arg.cols; c++) {
                    const piece = text(arg.at(r, c));
                    if (V.isError(piece)) { failure = piece; break; }
                    out += piece;
                }
                if (failure) return failure;
            } else {
                const piece = text(arg);
                if (V.isError(piece)) return piece;
                out += piece;
            }
        }
        return out;
    };
    F.register("CONCAT", { fn: concat, minArgs: 1, ...describe("text", "CONCAT(text1, [text2, ...])", "Joins texts and ranges.") });
    F.register("CONCATENATE", { fn: concat, minArgs: 1, ...describe("text", "CONCATENATE(text1, [text2, ...])", "Joins texts.") });
    F.register("TEXTJOIN", {
        fn: ([delimiter, ignoreEmpty, ...rest]) => {
            const parts = [];
            const skip = V.toBool(ignoreEmpty);
            V.each(rest, value => { const piece = text(value); if (!(skip === true && piece === "")) parts.push(piece); });
            const failure = parts.find(V.isError.bind(V));
            return failure ?? parts.join(text(delimiter));
        }, minArgs: 3, ...describe("text", "TEXTJOIN(delimiter, ignore_empty, text1, [text2, ...])", "Joins texts with a delimiter.")
    });
    const count = (value, fallback) => {
        if (value === undefined || value === null) return fallback;
        const n = number(value);
        return V.isError(n) ? n : Math.trunc(n);
    };
    F.register("LEFT", {
        fn: ([value, chars]) => {
            const s = text(value), n = count(chars, 1);
            if (V.isError(s)) return s;
            if (V.isError(n)) return n;
            return n < 0 ? V.error("#VALUE!") : s.slice(0, n);
        }, minArgs: 1, maxArgs: 2, ...describe("text", "LEFT(text, [count])", "Returns the first characters.")
    });
    F.register("RIGHT", {
        fn: ([value, chars]) => {
            const s = text(value), n = count(chars, 1);
            if (V.isError(s)) return s;
            if (V.isError(n)) return n;
            return n < 0 ? V.error("#VALUE!") : n === 0 ? "" : s.slice(-n);
        }, minArgs: 1, maxArgs: 2, ...describe("text", "RIGHT(text, [count])", "Returns the last characters.")
    });
    F.register("MID", {
        fn: ([value, start, chars]) => {
            const s = text(value), from = count(start, 1), n = count(chars, 0);
            if (V.isError(s)) return s;
            if (V.isError(from)) return from;
            if (V.isError(n)) return n;
            return from < 1 || n < 0 ? V.error("#VALUE!") : s.substr(from - 1, n);
        }, minArgs: 3, maxArgs: 3, ...describe("text", "MID(text, start, count)", "Returns characters from the middle of a text.")
    });
    F.register("LEN", { fn: ([value]) => { const s = text(value); return V.isError(s) ? s : s.length; }, minArgs: 1, maxArgs: 1, ...describe("text", "LEN(text)", "Returns the length of a text.") });
    F.register("UPPER", { fn: ([value]) => pick(value, v => { const s = text(v); return V.isError(s) ? s : s.toUpperCase(); }), minArgs: 1, maxArgs: 1, ...describe("text", "UPPER(text)", "Converts to upper case.") });
    F.register("LOWER", { fn: ([value]) => pick(value, v => { const s = text(v); return V.isError(s) ? s : s.toLowerCase(); }), minArgs: 1, maxArgs: 1, ...describe("text", "LOWER(text)", "Converts to lower case.") });
    F.register("TRIM", { fn: ([value]) => pick(value, v => { const s = text(v); return V.isError(s) ? s : s.trim().replace(/ {2,}/g, " "); }), minArgs: 1, maxArgs: 1, ...describe("text", "TRIM(text)", "Removes surplus spaces.") });
    F.register("TEXT", {
        fn: ([value, format]) => {
            const code = text(format);
            if (V.isError(code)) return code;
            return webexpress.webui.SpreadsheetFormat.format(V.scalar(value), code).text;
        }, minArgs: 2, maxArgs: 2, ...describe("text", "TEXT(value, format)", "Formats a value with a number format.")
    });
    F.register("VALUE", { fn: ([value]) => number(value), minArgs: 1, maxArgs: 1, ...describe("text", "VALUE(text)", "Converts text to a number.") });
    F.register("FIND", {
        fn: ([needle, haystack, start]) => {
            const s = text(haystack), n = text(needle), from = count(start, 1);
            const at = s.indexOf(n, from - 1);
            return at < 0 ? V.error("#VALUE!", "Not found.") : at + 1;
        }, minArgs: 2, maxArgs: 3, ...describe("text", "FIND(search, text, [start])", "Finds text, case-sensitive.")
    });
    F.register("SUBSTITUTE", {
        fn: ([value, search, replacement]) => text(value).split(text(search)).join(text(replacement)),
        minArgs: 3, maxArgs: 3, ...describe("text", "SUBSTITUTE(text, search, replacement)", "Replaces text.")
    });

    F.register("ROUND", {
        fn: ([value, digits]) => { const n = number(value), d = count(digits, 0); return V.isError(n) ? n : V.isError(d) ? d : round(n, d); },
        minArgs: 1, maxArgs: 2, ...describe("math", "ROUND(value, [digits])", "Rounds half away from zero.")
    });
    F.register("ROUNDUP", {
        fn: ([value, digits]) => { const n = number(value), d = count(digits, 0); return V.isError(n) ? n : V.isError(d) ? d : round(n, d, "up"); },
        minArgs: 1, maxArgs: 2, ...describe("math", "ROUNDUP(value, [digits])", "Rounds away from zero.")
    });
    F.register("ROUNDDOWN", {
        fn: ([value, digits]) => { const n = number(value), d = count(digits, 0); return V.isError(n) ? n : V.isError(d) ? d : round(n, d, "down"); },
        minArgs: 1, maxArgs: 2, ...describe("math", "ROUNDDOWN(value, [digits])", "Rounds towards zero.")
    });
    const unaryMath = (fn) => ([value]) => { const n = number(value); return V.isError(n) ? n : fn(n); };
    F.register("ABS", { fn: unaryMath(Math.abs), minArgs: 1, maxArgs: 1, ...describe("math", "ABS(value)", "Returns the absolute value.") });
    F.register("INT", { fn: unaryMath(Math.floor), minArgs: 1, maxArgs: 1, ...describe("math", "INT(value)", "Rounds down to an integer.") });
    F.register("SQRT", { fn: unaryMath(n => (n < 0 ? V.error("#NUM!") : Math.sqrt(n))), minArgs: 1, maxArgs: 1, ...describe("math", "SQRT(value)", "Returns the square root.") });
    F.register("POWER", {
        fn: ([base, exponent]) => { const a = number(base), b = number(exponent); return V.isError(a) ? a : V.isError(b) ? b : Math.pow(a, b); },
        minArgs: 2, maxArgs: 2, ...describe("math", "POWER(base, exponent)", "Raises to a power.")
    });
    F.register("MOD", {
        fn: ([value, divisor]) => {
            const a = number(value), b = number(divisor);
            if (V.isError(a)) return a;
            if (V.isError(b)) return b;
            return b === 0 ? V.error("#DIV/0!") : a - b * Math.floor(a / b);
        }, minArgs: 2, maxArgs: 2, ...describe("math", "MOD(value, divisor)", "Returns the remainder with the sign of the divisor.")
    });
    F.register("PI", { fn: () => Math.PI, maxArgs: 0, ...describe("math", "PI()", "Returns pi.") });
    F.register("RAND", { fn: () => Math.random(), maxArgs: 0, volatile: true, ...describe("math", "RAND()", "Returns a random number between 0 and 1.") });
    F.register("RANDBETWEEN", {
        fn: ([low, high]) => { const a = Math.ceil(number(low)), b = Math.floor(number(high)); return a > b ? V.error("#NUM!") : a + Math.floor(Math.random() * (b - a + 1)); },
        minArgs: 2, maxArgs: 2, volatile: true, ...describe("math", "RANDBETWEEN(low, high)", "Returns a random integer.")
    });

    F.register("TODAY", {
        fn: (args, api) => { const now = api.now(); return serial(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))); },
        maxArgs: 0, volatile: true, ...describe("date", "TODAY()", "Returns the current date.")
    });
    F.register("NOW", {
        fn: (args, api) => {
            const now = api.now();
            return serial(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds())));
        }, maxArgs: 0, volatile: true, ...describe("date", "NOW()", "Returns the current date and time.")
    });
    F.register("DATE", {
        fn: ([year, month, day]) => {
            const y = number(year), m = number(month), d = number(day);
            if ([y, m, d].some(V.isError.bind(V))) return [y, m, d].find(V.isError.bind(V));
            return serial(new Date(Date.UTC(Math.trunc(y), Math.trunc(m) - 1, Math.trunc(d))));
        }, minArgs: 3, maxArgs: 3, ...describe("date", "DATE(year, month, day)", "Builds a date.")
    });
    const datePart = (part) => ([value]) => { const d = date(value); return V.isError(d) ? d : part(d); };
    F.register("YEAR", { fn: datePart(d => d.getUTCFullYear()), minArgs: 1, maxArgs: 1, ...describe("date", "YEAR(date)", "Returns the year.") });
    F.register("MONTH", { fn: datePart(d => d.getUTCMonth() + 1), minArgs: 1, maxArgs: 1, ...describe("date", "MONTH(date)", "Returns the month.") });
    F.register("DAY", { fn: datePart(d => d.getUTCDate()), minArgs: 1, maxArgs: 1, ...describe("date", "DAY(date)", "Returns the day of the month.") });
    F.register("WEEKDAY", {
        fn: ([value, type]) => {
            const d = date(value), mode = count(type, 1);
            if (V.isError(d)) return d;
            const day = d.getUTCDay();
            return mode === 2 ? (day + 6) % 7 + 1 : mode === 3 ? (day + 6) % 7 : day + 1;
        }, minArgs: 1, maxArgs: 2, ...describe("date", "WEEKDAY(date, [type])", "Returns the day of the week.")
    });
    F.register("HOUR", { fn: unaryMath(n => Math.floor((n % 1) * 24 + 1e-9)), minArgs: 1, maxArgs: 1, ...describe("date", "HOUR(time)", "Returns the hour.") });
    F.register("MINUTE", { fn: unaryMath(n => Math.floor((n % 1) * 1440 + 1e-9) % 60), minArgs: 1, maxArgs: 1, ...describe("date", "MINUTE(time)", "Returns the minute.") });
    F.register("DAYS", {
        fn: ([end, start]) => { const a = number(end), b = number(start); return V.isError(a) ? a : V.isError(b) ? b : Math.trunc(a) - Math.trunc(b); },
        minArgs: 2, maxArgs: 2, ...describe("date", "DAYS(end, start)", "Returns the days between two dates.")
    });
    F.register("NETWORKDAYS", {
        fn: ([start, end]) => {
            let a = Math.trunc(number(start)), b = Math.trunc(number(end));
            if (!Number.isFinite(a) || !Number.isFinite(b)) return V.error("#VALUE!");
            const sign = a <= b ? 1 : -1;
            if (sign < 0) [a, b] = [b, a];
            let days = 0;
            for (let d = a; d <= b; d++) {
                const weekday = webexpress.webui.SpreadsheetFormat.serialToDate(d).getUTCDay();
                if (weekday !== 0 && weekday !== 6) days++;
            }
            return sign * days;
        }, minArgs: 2, maxArgs: 2, ...describe("date", "NETWORKDAYS(start, end)", "Counts the working days (Monday to Friday).")
    });
    F.register("EDATE", {
        fn: ([start, months]) => {
            const d = date(start), m = count(months, 0);
            if (V.isError(d)) return d;
            return serial(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + m, d.getUTCDate())));
        }, minArgs: 2, maxArgs: 2, ...describe("date", "EDATE(start, months)", "Shifts a date by months.")
    });

    F.register("ISBLANK", { fn: ([value]) => V.scalar(value) === null, minArgs: 1, maxArgs: 1, acceptErrors: true, ...describe("info", "ISBLANK(value)", "True for an empty cell.") });
    F.register("ISNUMBER", { fn: ([value]) => typeof V.scalar(value) === "number", minArgs: 1, maxArgs: 1, acceptErrors: true, ...describe("info", "ISNUMBER(value)", "True for a number.") });
    F.register("ISTEXT", { fn: ([value]) => typeof V.scalar(value) === "string", minArgs: 1, maxArgs: 1, acceptErrors: true, ...describe("info", "ISTEXT(value)", "True for text.") });
    F.register("ISERROR", { fn: ([value]) => V.isError(V.scalar(value)), minArgs: 1, maxArgs: 1, acceptErrors: true, ...describe("info", "ISERROR(value)", "True for an error.") });
    F.register("NA", { fn: () => V.error("#N/A"), maxArgs: 0, ...describe("info", "NA()", "Returns the error #N/A.") });
    F.register("ROW", { fn: (args, api) => (isRange(args[0]) ? args[0].r1 + 1 : api.row + 1), maxArgs: 1, ...describe("lookup", "ROW([reference])", "Returns the row number.") });
    F.register("COLUMN", { fn: (args, api) => (isRange(args[0]) ? args[0].c1 + 1 : api.col + 1), maxArgs: 1, ...describe("lookup", "COLUMN([reference])", "Returns the column number.") });
    F.register("ROWS", { fn: ([range]) => (isRange(range) ? range.rows : 1), minArgs: 1, maxArgs: 1, ...describe("lookup", "ROWS(range)", "Returns the number of rows.") });
    F.register("COLUMNS", { fn: ([range]) => (isRange(range) ? range.cols : 1), minArgs: 1, maxArgs: 1, ...describe("lookup", "COLUMNS(range)", "Returns the number of columns.") });

    F.register("VLOOKUP", {
        fn: ([key, table, column, approximate]) => {
            if (!isRange(table)) return V.error("#VALUE!");
            const index = count(column, 1);
            if (V.isError(index)) return index;
            if (index < 1 || index > table.cols) return V.error("#REF!");
            const sorted = approximate === undefined || approximate === null ? true : V.toBool(approximate);
            const needle = V.scalar(key);
            let match = -1;
            for (let r = 0; r < table.rows; r++) {
                const value = table.at(r, 0);
                const order = V.compare(value, needle);
                if (order === 0 && value !== null) { match = r; break; }
                if (sorted === true) { if (order < 0 && value !== null) match = r; else if (order > 0) break; }
            }
            return match < 0 ? V.error("#N/A", "No match.") : table.at(match, index - 1);
        }, minArgs: 3, maxArgs: 4, ...describe("lookup", "VLOOKUP(key, range, column, [sorted])", "Looks a key up in the first column.")
    });
    F.register("HLOOKUP", {
        fn: ([key, table, row, approximate]) => {
            if (!isRange(table)) return V.error("#VALUE!");
            const index = count(row, 1);
            if (index < 1 || index > table.rows) return V.error("#REF!");
            const sorted = approximate === undefined || approximate === null ? true : V.toBool(approximate);
            const needle = V.scalar(key);
            let match = -1;
            for (let c = 0; c < table.cols; c++) {
                const value = table.at(0, c);
                const order = V.compare(value, needle);
                if (order === 0 && value !== null) { match = c; break; }
                if (sorted === true) { if (order < 0 && value !== null) match = c; else if (order > 0) break; }
            }
            return match < 0 ? V.error("#N/A", "No match.") : table.at(index - 1, match);
        }, minArgs: 3, maxArgs: 4, ...describe("lookup", "HLOOKUP(key, range, row, [sorted])", "Looks a key up in the first row.")
    });
    F.register("INDEX", {
        fn: ([range, row, col]) => {
            if (!isRange(range)) return range;
            const r = count(row, 1), c = count(col, 1);
            if (V.isError(r)) return r;
            if (V.isError(c)) return c;
            if (r < 1 || c < 1 || r > range.rows || c > range.cols) return V.error("#REF!");
            return range.at(r - 1, c - 1);
        }, minArgs: 2, maxArgs: 3, ...describe("lookup", "INDEX(range, row, [column])", "Returns the value at a position.")
    });
    F.register("MATCH", {
        fn: ([key, range, type]) => {
            if (!isRange(range)) return V.error("#N/A");
            const mode = count(type, 1), needle = V.scalar(key);
            const length = Math.max(range.rows, range.cols), vertical = range.rows >= range.cols;
            let match = -1;
            for (let i = 0; i < length; i++) {
                const value = vertical ? range.at(i, 0) : range.at(0, i);
                const order = V.compare(value, needle);
                if (mode === 0) { if (order === 0 && value !== null) { match = i; break; } }
                else if (mode > 0) { if (value !== null && order <= 0) match = i; else if (order > 0) break; }
                else if (value !== null && order >= 0) match = i; else break;
            }
            return match < 0 ? V.error("#N/A", "No match.") : match + 1;
        }, minArgs: 2, maxArgs: 3, ...describe("lookup", "MATCH(key, range, [type])", "Returns the position of a key.")
    });
    F.register("CHOOSE", {
        fn: ([index, ...options]) => {
            const i = count(index(), 1);
            if (V.isError(i)) return i;
            return i < 1 || i > options.length ? V.error("#VALUE!") : options[i - 1]();
        }, minArgs: 2, lazy: true, ...describe("lookup", "CHOOSE(index, value1, [value2, ...])", "Chooses a value by its position.")
    });
})();
