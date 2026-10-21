/**
 * Addressing helpers of the spreadsheet. Rows and columns are zero-based indices internally and
 * only become A1 names at the boundary - in formulas, in the JSON value and in the API - so no
 * computation ever has to parse a name twice.
 */
webexpress.webui.SpreadsheetAddress = class {
    /**
     * The largest number of rows a sheet may have, the limit of the common file formats.
     */
    static MAX_ROWS = 1048576;

    /**
     * The largest number of columns a sheet may have (XFD).
     */
    static MAX_COLS = 16384;

    /**
     * Converts a column index into its letters.
     * @param {number} index - The zero-based column index.
     * @returns {string} The column name, such as "A" or "AB".
     */
    static columnName(index) {
        let name = "";
        for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + (n - 1) % 26) + name;
        return name;
    }

    /**
     * Converts column letters into the column index.
     * @param {string} name - The column letters, case-insensitive.
     * @returns {number} The zero-based index.
     */
    static columnIndex(name) {
        let n = 0;
        for (const ch of String(name).toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64;
        return n - 1;
    }

    /**
     * Builds the A1 name of a cell.
     * @param {number} row - The zero-based row.
     * @param {number} col - The zero-based column.
     * @param {boolean} [absRow=false] - Whether the row is written absolute.
     * @param {boolean} [absCol=false] - Whether the column is written absolute.
     * @returns {string} The name, such as "B2" or "$B$2".
     */
    static cellName(row, col, absRow = false, absCol = false) {
        return (absCol ? "$" : "") + this.columnName(col) + (absRow ? "$" : "") + (row + 1);
    }

    /**
     * Parses the A1 name of one cell.
     * @param {string} text - The name, optionally with $ markers.
     * @returns {{row: number, col: number, absRow: boolean, absCol: boolean}|null} The cell, or
     * null if the text names no cell inside the grid limits.
     */
    static parseCell(text) {
        const match = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})$/.exec(String(text ?? "").trim());
        if (!match) return null;
        const col = this.columnIndex(match[2]), row = Number(match[4]) - 1;
        if (row < 0 || row >= this.MAX_ROWS || col >= this.MAX_COLS) return null;
        return { row, col, absRow: match[3] === "$", absCol: match[1] === "$" };
    }

    /**
     * Splits an optional sheet prefix ("Sheet1!" or "'My sheet'!") from a reference.
     * @param {string} text - The reference.
     * @returns {{sheet: string|null, rest: string}} The sheet name, unquoted, and the remainder.
     */
    static splitSheet(text) {
        const value = String(text ?? "").trim();
        const quoted = /^'((?:[^']|'')+)'!(.*)$/.exec(value);
        if (quoted) return { sheet: quoted[1].replace(/''/g, "'"), rest: quoted[2] };
        const plain = /^([^!'\s][^!]*)!(.*)$/.exec(value);
        if (plain) return { sheet: plain[1], rest: plain[2] };
        return { sheet: null, rest: value };
    }

    /**
     * Parses a reference to a cell, a range, whole columns or whole rows, optionally on another
     * sheet. Whole columns span every row and whole rows every column, so their extent follows
     * the sheet instead of being frozen at parse time.
     * @param {string} text - The reference, such as "B2", "A1:C3", "A:A", "2:4" or "Sheet2!A1".
     * @returns {object|null} The normalized range { sheet, r1, c1, r2, c2, kind }, or null.
     */
    static parseRange(text) {
        const { sheet, rest } = this.splitSheet(text);
        const parts = rest.split(":");
        if (parts.length > 2 || !parts[0]) return null;
        if (parts.length === 1) {
            const cell = this.parseCell(parts[0]);
            return cell ? { sheet, r1: cell.row, c1: cell.col, r2: cell.row, c2: cell.col, kind: "cell" } : null;
        }
        const a = this.parseCell(parts[0]), b = this.parseCell(parts[1]);
        if (a && b) return { sheet, ...this.normalize({ r1: a.row, c1: a.col, r2: b.row, c2: b.col }), kind: "range" };
        const colA = /^\$?([A-Za-z]{1,3})$/.exec(parts[0]), colB = /^\$?([A-Za-z]{1,3})$/.exec(parts[1]);
        if (colA && colB) {
            const c1 = this.columnIndex(colA[1]), c2 = this.columnIndex(colB[1]);
            if (Math.max(c1, c2) >= this.MAX_COLS) return null;
            return { sheet, r1: 0, c1: Math.min(c1, c2), r2: this.MAX_ROWS - 1, c2: Math.max(c1, c2), kind: "cols" };
        }
        const rowA = /^\$?(\d{1,7})$/.exec(parts[0]), rowB = /^\$?(\d{1,7})$/.exec(parts[1]);
        if (rowA && rowB) {
            const r1 = Number(rowA[1]) - 1, r2 = Number(rowB[1]) - 1;
            if (Math.min(r1, r2) < 0 || Math.max(r1, r2) >= this.MAX_ROWS) return null;
            return { sheet, r1: Math.min(r1, r2), c1: 0, r2: Math.max(r1, r2), c2: this.MAX_COLS - 1, kind: "rows" };
        }
        return null;
    }

    /**
     * Writes a range in A1 notation, the inverse of parseRange.
     * @param {object} range - The range { r1, c1, r2, c2, kind?, sheet? }.
     * @param {object} [options] - The options.
     * @param {boolean} [options.sheet=false] - Whether the sheet prefix is written.
     * @returns {string} The reference.
     */
    static rangeName(range, options = {}) {
        const prefix = options.sheet && range.sheet ? this.quoteSheet(range.sheet) + "!" : "";
        if (range.kind === "cols" || range.r1 === 0 && range.r2 >= this.MAX_ROWS - 1) {
            return prefix + this.columnName(range.c1) + ":" + this.columnName(range.c2);
        }
        if (range.kind === "rows" || range.c1 === 0 && range.c2 >= this.MAX_COLS - 1) return prefix + (range.r1 + 1) + ":" + (range.r2 + 1);
        const start = this.cellName(range.r1, range.c1);
        return prefix + (range.r1 === range.r2 && range.c1 === range.c2 ? start : start + ":" + this.cellName(range.r2, range.c2));
    }

    /**
     * Quotes a sheet name where a formula would otherwise misread it.
     * @param {string} name - The sheet name.
     * @returns {string} The name as it is written in a reference.
     */
    static quoteSheet(name) {
        return /^[A-Za-z_\u00C0-\uFFFF][A-Za-z0-9_.\u00C0-\uFFFF]*$/.test(name) && !this.parseCell(name) && !/^[A-Za-z]{1,3}\d/.test(name)
            ? name : "'" + String(name).replace(/'/g, "''") + "'";
    }

    /**
     * Orders the corners of a range, so a selection dragged up or left still has r1 <= r2.
     * @param {object} range - The range.
     * @returns {{r1: number, c1: number, r2: number, c2: number}} The ordered range.
     */
    static normalize(range) {
        return { r1: Math.min(range.r1, range.r2), c1: Math.min(range.c1, range.c2), r2: Math.max(range.r1, range.r2), c2: Math.max(range.c1, range.c2) };
    }

    /**
     * Determines whether a range covers a cell.
     * @param {object} range - The range.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @returns {boolean} True if the cell lies inside.
     */
    static contains(range, row, col) { return row >= range.r1 && row <= range.r2 && col >= range.c1 && col <= range.c2; }

    /**
     * Determines whether two ranges overlap.
     * @param {object} a - The first range.
     * @param {object} b - The second range.
     * @returns {boolean} True if they share at least one cell.
     */
    static intersects(a, b) { return a.r1 <= b.r2 && b.r1 <= a.r2 && a.c1 <= b.c2 && b.c1 <= a.c2; }
};

/**
 * One sheet of a workbook. Cells are kept as rows of sparse arrays, because row and column
 * insertion are splices then and a sheet with hundreds of thousands of rows stays a flat array.
 * Cell objects are treated as immutable: a change replaces the object, so the history and the
 * change log may keep references instead of copies.
 */
webexpress.webui.SpreadsheetSheet = class {
    /**
     * Initializes a new instance of the class.
     * @param {object} init - The identity and the dimensions.
     * @param {string} init.id - The stable sheet id.
     * @param {string} init.name - The display name.
     * @param {number} init.rowCount - The number of rows.
     * @param {number} init.colCount - The number of columns.
     */
    constructor(init) {
        this.id = init.id; this.name = init.name;
        this.rowCount = init.rowCount; this.colCount = init.colCount;
        this.rows = []; this.rowProps = []; this.colProps = [];
        this.merges = []; this.frozenRows = 0; this.frozenCols = 0;
        this.props = {};
        // stable row and column ids exist only once a collaboration or a presence needs them
        this.rowIds = null; this.colIds = null;
    }

    /**
     * Returns the cell at a position.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @returns {object|null} The cell, or null for an empty cell.
     */
    getCell(row, col) { return this.rows[row]?.[col] ?? null; }

    /**
     * Stores or clears a cell; callers go through SpreadsheetModel.apply so the change is logged.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @param {object|null} cell - The normalized cell, or null to clear it.
     */
    setCell(row, col, cell) {
        if (cell) (this.rows[row] ??= [])[col] = cell;
        else if (this.rows[row]) {
            delete this.rows[row][col];
            if (col === this.rows[row].length - 1) {
                // keep the sparse row short, so "is the row empty" stays a length check
                let length = this.rows[row].length;
                while (length > 0 && this.rows[row][length - 1] === undefined) length--;
                this.rows[row].length = length;
            }
            if (!this.rows[row].length) delete this.rows[row];
        }
    }

    /**
     * Visits every stored cell in row-major order.
     * @param {Function} callback - Called with (cell, row, col).
     */
    forEachCell(callback) {
        this.rows.forEach((cells, row) => cells?.forEach((cell, col) => { if (cell) callback(cell, row, col); }));
    }

    /**
     * Determines the smallest range enclosing every stored cell.
     * @returns {{r1: number, c1: number, r2: number, c2: number}|null} The used range, or null for an empty sheet.
     */
    usedRange() {
        let r1 = Infinity, c1 = Infinity, r2 = -1, c2 = -1;
        this.rows.forEach((cells, row) => {
            if (!cells?.length) return;
            const first = cells.findIndex(cell => cell);
            if (first < 0) return;
            r1 = Math.min(r1, row); r2 = Math.max(r2, row);
            c1 = Math.min(c1, first); c2 = Math.max(c2, cells.length - 1);
        });
        return r2 < 0 ? null : { r1, c1, r2, c2 };
    }

    /**
     * Finds the merged range a cell belongs to.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @returns {object|null} The merge, or null.
     */
    mergeAt(row, col) { return this.merges.find(m => webexpress.webui.SpreadsheetAddress.contains(m, row, col)) ?? null; }
};

/**
 * The workbook model. It holds the sheets, the named ranges, the named cell styles and the
 * metadata, and it is the only place content changes: every change is an operation passed to
 * apply(), which returns the inverse operation and a log of what changed. The history, the
 * renderer, the formula engine, the events and the collaboration all work from that log, so
 * none of them has to compare documents.
 */
webexpress.webui.SpreadsheetModel = class {
    /**
     * The version of the JSON format.
     */
    static VERSION = 1;

    /**
     * The number of rows of a new sheet.
     */
    static DEFAULT_ROWS = 1000;

    /**
     * The number of columns of a new sheet.
     */
    static DEFAULT_COLS = 26;

    /**
     * The largest number of characters a text value, a formula or a comment may have.
     */
    static MAX_TEXT = 32767;

    /**
     * The border line styles a cell edge accepts.
     */
    static BORDER_STYLES = ["thin", "medium", "thick", "dashed", "dotted", "double"];

    /**
     * Initializes an empty workbook; use fromJSON to load one.
     */
    constructor() {
        this.sheets = []; this.names = {}; this.styles = {}; this.meta = {};
        // the sheet the workbook was saved on; a view hint, not content, so toJSON leaves it to its caller
        this.activeSheet = null;
        this.idTag = ""; this._counter = 0;
    }

    /**
     * Creates a workbook from its JSON form, validating everything on the way in.
     * @param {object|string|null} json - The workbook, its JSON text, or null for a new workbook.
     * @param {object} [options] - The options.
     * @param {number} [options.rows] - The rows of a sheet that names none.
     * @param {number} [options.cols] - The columns of a sheet that names none.
     * @param {string} [options.sheetName="Sheet1"] - The name of the sheet of a new workbook.
     * @returns {webexpress.webui.SpreadsheetModel} The model.
     * @throws {TypeError} If the input is no workbook.
     */
    static fromJSON(json, options = {}) {
        const data = typeof json === "string" ? (json.trim() ? JSON.parse(json) : null) : json;
        const model = new this();
        if (data !== null && data !== undefined && (typeof data !== "object" || Array.isArray(data))) throw new TypeError("A workbook must be a JSON object.");
        const sheets = Array.isArray(data?.sheets) && data.sheets.length ? data.sheets : [{ name: options.sheetName || "Sheet1" }];
        for (const sheetJson of sheets) model.sheets.push(model._readSheet(sheetJson, options));
        model.names = model._readNames(data?.names);
        model.styles = model._readStyles(data?.styles);
        model.meta = this._plain(data?.meta, 0) ? this._copy(data?.meta ?? {}) : {};
        model.activeSheet = typeof data?.activeSheet === "string" ? data.activeSheet : null;
        model._syncCounter();
        return model;
    }

    /**
     * Writes the workbook as JSON data, the form it is saved and exchanged in.
     * @param {object} [options] - The options.
     * @param {Function} [options.result] - Returns the computed value of a formula cell
     * (sheet, row, col); with it, formula cells carry their last result as "r", so a reader
     * without a formula engine - such as the server - still sees the values.
     * @param {boolean} [options.ids=false] - Whether stable row and column ids are written.
     * @param {string} [options.activeSheet] - The sheet to record as active.
     * @returns {object} The workbook.
     */
    toJSON(options = {}) {
        const out = { version: this.constructor.VERSION };
        if (options.activeSheet) out.activeSheet = options.activeSheet;
        out.sheets = this.sheets.map(sheet => this.sheetToJSON(sheet, options));
        if (Object.keys(this.names).length) out.names = { ...this.names };
        if (Object.keys(this.styles).length) out.styles = this.constructor._copy(this.styles);
        if (Object.keys(this.meta).length) out.meta = this.constructor._copy(this.meta);
        return out;
    }

    /**
     * Writes one sheet as JSON data.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {object} [options] - As for toJSON.
     * @returns {object} The sheet.
     */
    sheetToJSON(sheet, options = {}) {
        const Address = webexpress.webui.SpreadsheetAddress;
        const out = { id: sheet.id, name: sheet.name, rowCount: sheet.rowCount, colCount: sheet.colCount };
        const cells = {};
        sheet.forEachCell((cell, row, col) => {
            const copy = this.constructor.copyCell(cell);
            if (cell.f && options.result) {
                const result = options.result(sheet.id, row, col);
                if (result !== undefined && result !== null) copy.r = result instanceof webexpress.webui.SpreadsheetError ? { error: result.code } : result;
            }
            cells[Address.cellName(row, col)] = copy;
        });
        out.cells = cells;
        const axis = (props) => {
            const entries = {};
            props.forEach((value, index) => { if (value) entries[index] = this.constructor._copy(value); });
            return Object.keys(entries).length ? entries : null;
        };
        const rows = axis(sheet.rowProps), cols = axis(sheet.colProps);
        if (rows) out.rows = rows;
        if (cols) out.cols = cols;
        if (sheet.merges.length) out.merges = sheet.merges.map(m => Address.rangeName(m));
        if (sheet.frozenRows || sheet.frozenCols) out.frozen = { rows: sheet.frozenRows, cols: sheet.frozenCols };
        if (Object.keys(sheet.props).length) out.props = this.constructor._copy(sheet.props);
        if (options.ids) {
            this.ensureIds(sheet);
            out.rowIds = sheet.rowIds.slice(); out.colIds = sheet.colIds.slice();
        }
        return out;
    }

    /**
     * Finds a sheet by id or by name (case-insensitive).
     * @param {string} key - The id or the name.
     * @returns {webexpress.webui.SpreadsheetSheet|null} The sheet, or null.
     */
    sheet(key) {
        if (key === undefined || key === null) return null;
        const lower = String(key).toLowerCase();
        return this.sheets.find(s => s.id === key) ?? this.sheets.find(s => s.name.toLowerCase() === lower) ?? null;
    }

    /**
     * Returns the position of a sheet in the tab order.
     * @param {string} id - The sheet id.
     * @returns {number} The index, or -1.
     */
    sheetIndex(id) { return this.sheets.findIndex(s => s.id === id); }

    /**
     * Creates a unique id for a sheet, a row or a column. While shared, ids carry the client tag
     * so two clients never create the same id.
     * @param {string} prefix - "s", "r" or "c".
     * @returns {string} The id.
     */
    newId(prefix) { return prefix + (++this._counter).toString(36) + (this.idTag ? "-" + this.idTag : ""); }

    /**
     * Gives every row and column of a sheet a stable id, which positions shift under but ids do not.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     */
    ensureIds(sheet) {
        if (!sheet.rowIds) sheet.rowIds = Array.from({ length: sheet.rowCount }, () => this.newId("r"));
        if (!sheet.colIds) sheet.colIds = Array.from({ length: sheet.colCount }, () => this.newId("c"));
    }

    /**
     * Proposes a sheet name that is not taken yet.
     * @param {string} [base="Sheet"] - The name stem.
     * @returns {string} The free name.
     */
    uniqueSheetName(base = "Sheet") {
        const taken = new Set(this.sheets.map(s => s.name.toLowerCase()));
        for (let n = this.sheets.length + 1; ; n++) {
            const name = base + n;
            if (!taken.has(name.toLowerCase())) return name;
        }
    }

    /**
     * Keeps a wished-for sheet name, or numbers it like "Sales (2)" when it is taken.
     * @param {string} name - The wished-for name.
     * @returns {string} A free name.
     */
    freeSheetName(name) {
        if (this.isValidSheetName(name)) return name;
        const stem = String(name ?? "").replace(/[\[\]:*?/\\']/g, "").trim().slice(0, 90) || "Sheet";
        for (let n = 2; ; n++) {
            const candidate = stem + " (" + n + ")";
            if (this.isValidSheetName(candidate)) return candidate;
        }
    }

    /**
     * Checks a sheet name against the rules of the common file formats.
     * @param {string} name - The name.
     * @param {string} [except] - The id of a sheet whose own name does not count as taken.
     * @returns {boolean} True if the name may be used.
     */
    isValidSheetName(name, except) {
        if (typeof name !== "string" || !name.trim() || name.length > 100 || /[\[\]:*?/\\]/.test(name) || /^'|'$/.test(name)) return false;
        const lower = name.toLowerCase();
        return !this.sheets.some(s => s.id !== except && s.name.toLowerCase() === lower);
    }

    /**
     * Applies an operation. Every content change of the workbook goes through here.
     * @param {object} op - The operation (see the documentation for the operation types).
     * @returns {{inverse: object, changes: object}} The operation that undoes this one, and the
     * log of what changed.
     * @throws {TypeError|RangeError} If the operation is malformed or addresses nothing.
     */
    apply(op) {
        const changes = this.constructor.emptyChanges();
        const inverse = this._apply(op, changes);
        return { inverse, changes };
    }

    /**
     * Creates an empty change log.
     * @returns {object} The log.
     */
    static emptyChanges() {
        return { cells: [], structure: [], axis: [], sheets: [], merges: new Set(), frozen: new Set(), names: false, styles: false, meta: false, props: new Set() };
    }

    /**
     * Applies one operation and records it into a shared change log.
     * @param {object} op - The operation.
     * @param {object} changes - The change log.
     * @returns {object} The inverse operation.
     */
    _apply(op, changes) {
        switch (op?.type) {
            case "batch": {
                const inverses = [];
                for (const part of op.ops ?? []) inverses.push(this._apply(part, changes));
                return { type: "batch", ops: inverses.reverse() };
            }
            case "set": return this._applySet(op, changes);
            case "axis": return this._applyAxis(op, changes);
            case "insertRows": case "insertCols": return this._applyInsert(op, changes);
            case "deleteRows": case "deleteCols": return this._applyDelete(op, changes);
            case "merges": return this._applyMerges(op, changes);
            case "freeze": return this._applyFreeze(op, changes);
            case "addSheet": return this._applyAddSheet(op, changes);
            case "removeSheet": return this._applyRemoveSheet(op, changes);
            case "renameSheet": return this._applyRenameSheet(op, changes);
            case "moveSheet": return this._applyMoveSheet(op, changes);
            case "sheetProps": return this._applySheetProps(op, changes);
            case "names": return this._applyMap("names", op, changes);
            case "styles": return this._applyMap("styles", op, changes);
            case "meta": return this._applyMap("meta", op, changes);
            default: throw new TypeError("Unknown spreadsheet operation: " + op?.type);
        }
    }

    /**
     * Returns a sheet an operation addresses.
     * @param {string} id - The sheet id.
     * @returns {webexpress.webui.SpreadsheetSheet} The sheet.
     * @throws {RangeError} If there is no such sheet.
     */
    _target(id) {
        const sheet = this.sheets.find(s => s.id === id);
        if (!sheet) throw new RangeError("Unknown sheet: " + id);
        return sheet;
    }

    /**
     * Stores cells. An entry with a null cell clears the cell.
     * @param {object} op - { sheet, cells: [{ row, col, cell }] }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applySet(op, changes) {
        const sheet = this._target(op.sheet);
        // a refused entry must not leave earlier writes outside history and change processing
        const cells = (op.cells ?? []).map(entry => {
            const { row, col } = entry;
            if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= sheet.rowCount || col >= sheet.colCount) {
                throw new RangeError("Cell outside the sheet: " + row + "," + col);
            }
            return { row, col, cell: this.constructor.normalizeCell(entry.cell) };
        });
        const previous = [];
        for (const { row, col, cell: after } of cells) {
            const before = sheet.getCell(row, col);
            previous.push({ row, col, cell: before });
            if (this.constructor.sameCell(before, after)) continue;
            sheet.setCell(row, col, after);
            changes.cells.push({ sheet: sheet.id, row, col, before, after });
        }
        return { type: "set", sheet: sheet.id, cells: previous.reverse() };
    }

    /**
     * Replaces the properties (height or width, hidden, style) of rows or columns.
     * @param {object} op - { sheet, axis: "row"|"col", entries: [{ index, props }] }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applyAxis(op, changes) {
        const sheet = this._target(op.sheet);
        const row = op.axis === "row";
        const list = row ? sheet.rowProps : sheet.colProps, count = row ? sheet.rowCount : sheet.colCount;
        const previous = [];
        for (const { index, props } of op.entries ?? []) {
            if (!Number.isInteger(index) || index < 0 || index >= count) throw new RangeError("Index outside the sheet: " + index);
            const before = list[index] ?? null, after = this._readAxisProps(props);
            previous.push({ index, props: before });
            if (JSON.stringify(before) === JSON.stringify(after)) continue;
            if (after) list[index] = after; else delete list[index];
            changes.axis.push({ sheet: sheet.id, axis: op.axis, index, before, after });
        }
        return { type: "axis", sheet: sheet.id, axis: op.axis, entries: previous.reverse() };
    }

    /**
     * Inserts rows or columns. References, named ranges, merges and frozen panes move along,
     * unless the operation restores a previous state (adjust: false), which brings them back
     * explicitly.
     * @param {object} op - { sheet, index, count, ids?, data?, adjust? }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applyInsert(op, changes) {
        const sheet = this._target(op.sheet);
        const rows = op.type === "insertRows";
        const limit = rows ? webexpress.webui.SpreadsheetAddress.MAX_ROWS : webexpress.webui.SpreadsheetAddress.MAX_COLS;
        const size = rows ? sheet.rowCount : sheet.colCount;
        const { index, count } = op;
        if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1 || index < 0 || index > size || size + count > limit) {
            throw new RangeError("Cannot insert " + count + " at " + index);
        }
        const gap = new Array(count);
        if (rows) {
            sheet.rows.splice(index, 0, ...gap); sheet.rowProps.splice(index, 0, ...gap);
            sheet.rowCount += count;
            if (sheet.rowIds || op.ids) {
                this.ensureIds(sheet);
                sheet.rowIds.splice(index, 0, ...(op.ids?.length === count ? op.ids : Array.from({ length: count }, () => this.newId("r"))));
            }
        } else {
            sheet.rows.forEach(cells => { if (cells && cells.length > index) cells.splice(index, 0, ...gap); });
            sheet.colProps.splice(index, 0, ...gap);
            sheet.colCount += count;
            if (sheet.colIds || op.ids) {
                this.ensureIds(sheet);
                sheet.colIds.splice(index, 0, ...(op.ids?.length === count ? op.ids : Array.from({ length: count }, () => this.newId("c"))));
            }
        }
        sheet.version = (sheet.version || 0) + 1;
        changes.structure.push({ sheet: sheet.id, type: op.type, index, count, ids: (rows ? sheet.rowIds : sheet.colIds)?.slice(index, index + count) });
        // references are rewritten after the splice, so the restoring operations address the
        // cells where they stand now, which is where the inverse finds them
        const restored = { cells: [], other: [] };
        if (op.adjust !== false) this._adjustReferences(sheet, rows ? "row" : "col", index, count, changes, restored);
        // restored content of deleted rows or columns comes back as ordinary cell changes
        for (const entry of op.data ?? []) {
            const offset = entry.offset;
            if (entry.props) {
                (rows ? sheet.rowProps : sheet.colProps)[index + offset] = entry.props;
                changes.axis.push({ sheet: sheet.id, axis: rows ? "row" : "col", index: index + offset, before: null, after: entry.props });
            }
            for (const [other, cell] of entry.cells ?? []) {
                const row = rows ? index + offset : other, col = rows ? other : index + offset;
                sheet.setCell(row, col, cell);
                changes.cells.push({ sheet: sheet.id, row, col, before: null, after: cell });
            }
        }
        const inverse = { type: rows ? "deleteRows" : "deleteCols", sheet: sheet.id, index, count, adjust: false };
        const ops = [...restored.cells, ...restored.other, inverse];
        return ops.length > 1 ? { type: "batch", ops } : inverse;
    }

    /**
     * Deletes rows or columns together with their cells.
     * @param {object} op - { sheet, index, count, adjust? }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse, which brings back content, ids and every adjusted reference.
     */
    _applyDelete(op, changes) {
        const sheet = this._target(op.sheet);
        const rows = op.type === "deleteRows";
        const size = rows ? sheet.rowCount : sheet.colCount;
        const { index, count } = op;
        if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1 || index < 0 || index + count > size || count >= size) {
            throw new RangeError("Cannot delete " + count + " at " + index);
        }
        const data = [];
        for (let offset = 0; offset < count; offset++) {
            const at = index + offset;
            const cells = [];
            if (rows) sheet.rows[at]?.forEach((cell, col) => { if (cell) cells.push([col, cell]); });
            else sheet.rows.forEach((list, row) => { if (list?.[at]) cells.push([row, list[at]]); });
            const props = (rows ? sheet.rowProps : sheet.colProps)[at] ?? null;
            if (cells.length || props) data.push({ offset, cells, props });
            for (const [other, cell] of cells) {
                changes.cells.push({ sheet: sheet.id, row: rows ? at : other, col: rows ? other : at, before: cell, after: null, removed: true });
            }
        }
        const ids = rows ? sheet.rowIds?.slice(index, index + count) : sheet.colIds?.slice(index, index + count);
        if (rows) {
            sheet.rows.splice(index, count); sheet.rowProps.splice(index, count); sheet.rowIds?.splice(index, count);
            sheet.rowCount -= count;
        } else {
            sheet.rows.forEach((cells, row) => {
                if (!cells || cells.length <= index) return;
                cells.splice(index, count);
                let length = cells.length;
                while (length > 0 && cells[length - 1] === undefined) length--;
                cells.length = length;
                if (!length) delete sheet.rows[row];
            });
            sheet.colProps.splice(index, count); sheet.colIds?.splice(index, count);
            sheet.colCount -= count;
        }
        sheet.version = (sheet.version || 0) + 1;
        changes.structure.push({ sheet: sheet.id, type: op.type, index, count, ids });
        const restored = { cells: [], other: [] };
        if (op.adjust !== false) this._adjustReferences(sheet, rows ? "row" : "col", index, -count, changes, restored);
        const inverse = { type: rows ? "insertRows" : "insertCols", sheet: sheet.id, index, count, adjust: false, data };
        if (ids) inverse.ids = ids;
        // formulas are restored where they stand before the rows return; merges and panes after,
        // because they name positions that exist only once the rows are back
        const ops = [...restored.cells, inverse, ...restored.other];
        return ops.length > 1 ? { type: "batch", ops } : inverse;
    }

    /**
     * Moves references, named ranges, merges and frozen panes along an insertion (positive
     * count) or a deletion (negative count). What it rewrites is collected as operations that
     * restore the previous state, because a deletion cannot be inverted by arithmetic alone.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The changed sheet.
     * @param {string} axis - "row" or "col".
     * @param {number} index - Where the change happens.
     * @param {number} delta - The inserted (positive) or deleted (negative) count.
     * @param {object} changes - The change log.
     * @param {{cells: Array<object>, other: Array<object>}} restored - Receives the restoring
     * operations, the formula cells apart from the rest.
     */
    _adjustReferences(sheet, axis, index, delta, changes, restored) {
        const shift = (start, end) => this.constructor.shiftSpan(start, end, index, delta);
        const lower = sheet.name.toLowerCase();
        const mapper = (ref) => {
            if ((ref.sheet ?? ref.home ?? "").toLowerCase() !== lower) return ref;
            if (axis === "row" ? ref.kind === "cols" : ref.kind === "rows") return ref;
            const span = axis === "row" ? shift(ref.r1, ref.r2) : shift(ref.c1, ref.c2);
            if (!span) return null;
            return axis === "row" ? { ...ref, r1: span[0], r2: span[1] } : { ...ref, c1: span[0], c2: span[1] };
        };
        this._rewriteFormulas(mapper, changes, restored.cells);
        this._rewriteNames(mapper, changes, restored.other);
        const merges = sheet.merges.map(m => {
            const span = axis === "row" ? shift(m.r1, m.r2) : shift(m.c1, m.c2);
            if (!span) return null;
            return axis === "row" ? { ...m, r1: span[0], r2: span[1] } : { ...m, c1: span[0], c2: span[1] };
        }).filter(m => m && (m.r1 !== m.r2 || m.c1 !== m.c2));
        if (JSON.stringify(merges) !== JSON.stringify(sheet.merges)) {
            restored.other.push({ type: "merges", sheet: sheet.id, merges: sheet.merges.map(m => ({ ...m })) });
            sheet.merges = merges; changes.merges.add(sheet.id);
        }
        // a pane frozen across the change grows with an insertion and loses the deleted part
        const frozen = axis === "row" ? sheet.frozenRows : sheet.frozenCols;
        const next = delta > 0
            ? (index < frozen ? frozen + delta : frozen)
            : frozen - Math.max(0, Math.min(frozen, index - delta) - index);
        if (next !== frozen) {
            restored.other.push({ type: "freeze", sheet: sheet.id, rows: sheet.frozenRows, cols: sheet.frozenCols });
            if (axis === "row") sheet.frozenRows = next; else sheet.frozenCols = next;
            changes.frozen.add(sheet.id);
        }
    }

    /**
     * Rewrites the references of the named ranges.
     * @param {Function} mapper - As for _rewriteFormulas.
     * @param {object} changes - The change log.
     * @param {Array<object>} restored - Receives the operation restoring the previous names.
     */
    _rewriteNames(mapper, changes, restored) {
        const names = {};
        let renamed = false;
        for (const [name, text] of Object.entries(this.names)) {
            const next = webexpress.webui.SpreadsheetFormula.rewrite("=" + text, null, mapper);
            // a name whose range was deleted is dropped, as a #REF! name would only mislead
            if (next.includes("#REF!")) { renamed = true; continue; }
            names[name] = next.slice(1);
            if (names[name] !== text) renamed = true;
        }
        if (!renamed) return;
        restored.push({ type: "names", value: { ...this.names } });
        this.names = names; changes.names = true;
    }

    /**
     * Moves a span along an insertion or deletion, as spreadsheets do: an insertion inside a span
     * widens it, a deletion narrows it, and a span deleted completely is gone.
     * @param {number} start - The first index of the span.
     * @param {number} end - The last index of the span.
     * @param {number} index - Where the change happens.
     * @param {number} delta - The inserted (positive) or deleted (negative) count.
     * @returns {[number, number]|null} The new span, or null if it was deleted.
     */
    static shiftSpan(start, end, index, delta) {
        if (delta > 0) {
            if (start >= index) return [start + delta, end + delta];
            if (end >= index) return [start, end + delta];
            return [start, end];
        }
        const count = -delta, last = index + count - 1;
        if (end < index) return [start, end];
        if (start > last) return [start - count, end - count];
        if (start >= index && end <= last) return null;
        const newStart = start < index ? start : index;
        const newEnd = end > last ? end - count : index - 1;
        return newEnd < newStart ? null : [newStart, newEnd];
    }

    /**
     * Rewrites the references of every formula in the workbook.
     * @param {Function} mapper - Maps a reference (see SpreadsheetFormula.rewrite) or returns null for #REF!.
     * @param {object} changes - The change log.
     * @param {Array<object>} restored - Receives the operations restoring the previous formulas.
     * @param {Function} [skip] - Tells formulas to leave alone (sheet, row, col).
     */
    _rewriteFormulas(mapper, changes, restored, skip) {
        const Formula = webexpress.webui.SpreadsheetFormula;
        for (const other of this.sheets) {
            const previous = [];
            other.forEachCell((cell, row, col) => {
                if (!cell.f || skip?.(other, row, col)) return;
                const text = Formula.rewrite(cell.f, other.name, mapper);
                if (text === cell.f) return;
                const after = { ...cell, f: text };
                other.setCell(row, col, after);
                changes.cells.push({ sheet: other.id, row, col, before: cell, after, rewritten: true });
                previous.push({ row, col, cell });
            });
            if (previous.length) restored.push({ type: "set", sheet: other.id, cells: previous });
        }
    }

    /**
     * Replaces the merged ranges of a sheet.
     * @param {object} op - { sheet, merges: [{ r1, c1, r2, c2 }] }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applyMerges(op, changes) {
        const sheet = this._target(op.sheet);
        const previous = sheet.merges.map(m => ({ ...m }));
        const next = this._readMerges(op.merges, sheet);
        sheet.merges = next;
        changes.merges.add(sheet.id);
        return { type: "merges", sheet: sheet.id, merges: previous };
    }

    /**
     * Sets the frozen rows and columns of a sheet.
     * @param {object} op - { sheet, rows, cols }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applyFreeze(op, changes) {
        const sheet = this._target(op.sheet);
        const previous = { type: "freeze", sheet: sheet.id, rows: sheet.frozenRows, cols: sheet.frozenCols };
        sheet.frozenRows = Math.max(0, Math.min(sheet.rowCount - 1, Math.trunc(op.rows) || 0));
        sheet.frozenCols = Math.max(0, Math.min(sheet.colCount - 1, Math.trunc(op.cols) || 0));
        changes.frozen.add(sheet.id);
        return previous;
    }

    /**
     * Adds a sheet from its JSON form.
     * @param {object} op - { sheet: sheetJson, index? }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applyAddSheet(op, changes) {
        // the requested name is checked before reading, which would otherwise number a taken one
        if (op.sheet?.name !== undefined && !this.isValidSheetName(String(op.sheet.name).trim())) throw new RangeError("Invalid or duplicate sheet name: " + op.sheet.name);
        const sheet = this._readSheet(op.sheet, {});
        if (this.sheets.some(s => s.id === sheet.id)) throw new RangeError("Duplicate sheet id: " + sheet.id);
        if (!this.isValidSheetName(sheet.name)) throw new RangeError("Invalid or duplicate sheet name: " + sheet.name);
        const index = Number.isInteger(op.index) ? Math.max(0, Math.min(this.sheets.length, op.index)) : this.sheets.length;
        this.sheets.splice(index, 0, sheet);
        changes.sheets.push({ type: "add", sheet: sheet.id, index });
        sheet.forEachCell((cell, row, col) => changes.cells.push({ sheet: sheet.id, row, col, before: null, after: cell }));
        return { type: "removeSheet", sheet: sheet.id };
    }

    /**
     * Removes a sheet. References to it turn into #REF!, as in the common spreadsheets.
     * @param {object} op - { sheet }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applyRemoveSheet(op, changes) {
        const sheet = this._target(op.sheet);
        if (this.sheets.length < 2) throw new RangeError("The last sheet cannot be removed.");
        const index = this.sheetIndex(sheet.id);
        const json = this.sheetToJSON(sheet, { ids: !!sheet.rowIds });
        const restored = [];
        const lower = sheet.name.toLowerCase();
        const mapper = ref => ((ref.sheet ?? ref.home ?? "").toLowerCase() === lower ? null : ref);
        this._rewriteFormulas(mapper, changes, restored, other => other === sheet);
        this._rewriteNames(mapper, changes, restored);
        sheet.forEachCell((cell, row, col) => changes.cells.push({ sheet: sheet.id, row, col, before: cell, after: null, removed: true }));
        this.sheets.splice(index, 1);
        changes.sheets.push({ type: "remove", sheet: sheet.id, index });
        return { type: "batch", ops: [{ type: "addSheet", sheet: json, index }, ...restored] };
    }

    /**
     * Renames a sheet and every reference written with its name.
     * @param {object} op - { sheet, name, adjust? }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applyRenameSheet(op, changes) {
        const sheet = this._target(op.sheet);
        if (!this.isValidSheetName(op.name, sheet.id)) throw new RangeError("Invalid or duplicate sheet name: " + op.name);
        const old = sheet.name;
        if (old === op.name) return { type: "renameSheet", sheet: sheet.id, name: old, adjust: false };
        const restored = [];
        if (op.adjust !== false) {
            const lower = old.toLowerCase();
            const mapper = ref => (ref.sheet?.toLowerCase() === lower ? { ...ref, sheet: op.name } : ref);
            this._rewriteFormulas(mapper, changes, restored);
            this._rewriteNames(mapper, changes, restored);
        }
        sheet.name = op.name;
        changes.sheets.push({ type: "rename", sheet: sheet.id, before: old, after: op.name });
        const inverse = { type: "renameSheet", sheet: sheet.id, name: old, adjust: false };
        return restored.length ? { type: "batch", ops: [inverse, ...restored] } : inverse;
    }

    /**
     * Moves a sheet within the tab order.
     * @param {object} op - { sheet, index }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applyMoveSheet(op, changes) {
        const sheet = this._target(op.sheet);
        const from = this.sheetIndex(sheet.id);
        const to = Math.max(0, Math.min(this.sheets.length - 1, Math.trunc(op.index)));
        this.sheets.splice(from, 1); this.sheets.splice(to, 0, sheet);
        if (from !== to) changes.sheets.push({ type: "move", sheet: sheet.id, from, to });
        return { type: "moveSheet", sheet: sheet.id, index: from };
    }

    /**
     * Replaces the free properties of a sheet, such as its tab color.
     * @param {object} op - { sheet, props }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applySheetProps(op, changes) {
        const sheet = this._target(op.sheet);
        const previous = this.constructor._copy(sheet.props);
        sheet.props = this._readSheetProps(op.props);
        changes.props.add(sheet.id);
        return { type: "sheetProps", sheet: sheet.id, props: previous };
    }

    /**
     * Replaces the named ranges, the named styles or the metadata.
     * @param {string} key - "names", "styles" or "meta".
     * @param {object} op - { value }.
     * @param {object} changes - The change log.
     * @returns {object} The inverse.
     */
    _applyMap(key, op, changes) {
        const previous = this.constructor._copy(this[key]);
        this[key] = key === "names" ? this._readNames(op.value) : key === "styles" ? this._readStyles(op.value) : this.constructor._plain(op.value, 0) ? this.constructor._copy(op.value ?? {}) : {};
        changes[key] = true;
        return { type: key, value: previous };
    }

    /**
     * Keeps the id counter ahead of every id loaded, so new ids never repeat a loaded one.
     */
    _syncCounter() {
        const seen = id => {
            const match = /^[src]([0-9a-z]+)/.exec(id ?? "");
            if (match) this._counter = Math.max(this._counter, parseInt(match[1], 36) || 0);
        };
        for (const sheet of this.sheets) {
            seen(sheet.id);
            sheet.rowIds?.forEach(seen); sheet.colIds?.forEach(seen);
        }
    }

    /**
     * Reads and validates one sheet.
     * @param {object} json - The sheet data.
     * @param {object} options - The defaults for missing dimensions.
     * @returns {webexpress.webui.SpreadsheetSheet} The sheet.
     */
    _readSheet(json, options) {
        const Address = webexpress.webui.SpreadsheetAddress;
        if (!json || typeof json !== "object" || Array.isArray(json)) throw new TypeError("A sheet must be an object.");
        const id = typeof json.id === "string" && /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(json.id) && !this.sheets.some(s => s.id === json.id) ? json.id : this.newId("s");
        let name = typeof json.name === "string" ? json.name.trim() : "";
        if (!this.isValidSheetName(name)) name = this.uniqueSheetName("Sheet");
        const dimension = (value, fallback, max) => Number.isInteger(value) && value > 0 ? Math.min(value, max) : fallback;
        const sheet = new webexpress.webui.SpreadsheetSheet({
            id, name,
            rowCount: dimension(json.rowCount, options.rows || this.constructor.DEFAULT_ROWS, Address.MAX_ROWS),
            colCount: dimension(json.colCount, options.cols || this.constructor.DEFAULT_COLS, Address.MAX_COLS)
        });
        const put = (row, col, raw) => {
            const cell = this.constructor.normalizeCell(this.constructor.readCell(raw));
            if (!cell) return;
            if (row >= sheet.rowCount) sheet.rowCount = Math.min(Address.MAX_ROWS, row + 1);
            if (col >= sheet.colCount) sheet.colCount = Math.min(Address.MAX_COLS, col + 1);
            sheet.setCell(row, col, cell);
        };
        if (json.cells && typeof json.cells === "object" && !Array.isArray(json.cells)) {
            for (const [key, raw] of Object.entries(json.cells)) {
                const cell = Address.parseCell(key);
                if (cell) put(cell.row, cell.col, raw);
            }
        }
        // a plain grid of values starting at A1 is the shortest way to hand over data
        if (Array.isArray(json.data)) {
            json.data.slice(0, Address.MAX_ROWS).forEach((values, row) => {
                if (Array.isArray(values)) values.slice(0, Address.MAX_COLS).forEach((value, col) => {
                    if (value === null || value === undefined || value === "") return;
                    put(row, col, typeof value === "string" && value.startsWith("=") && value.length > 1 ? { f: value } : (typeof value === "object" ? value : { v: value }));
                });
            });
        }
        const axis = (source, list, count) => {
            if (!source || typeof source !== "object") return;
            for (const [key, value] of Object.entries(source)) {
                const index = Number(key);
                const props = this._readAxisProps(value);
                if (Number.isInteger(index) && index >= 0 && index < count && props) list[index] = props;
            }
        };
        axis(json.rows, sheet.rowProps, sheet.rowCount);
        axis(json.cols, sheet.colProps, sheet.colCount);
        sheet.merges = this._readMerges(json.merges, sheet);
        if (json.frozen && typeof json.frozen === "object") {
            sheet.frozenRows = Math.max(0, Math.min(sheet.rowCount - 1, Math.trunc(json.frozen.rows) || 0));
            sheet.frozenCols = Math.max(0, Math.min(sheet.colCount - 1, Math.trunc(json.frozen.cols) || 0));
        }
        sheet.props = this._readSheetProps(json.props);
        const ids = (list, count, prefix) => Array.isArray(list) && list.length === count && list.every(v => typeof v === "string" && /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(v)) && new Set(list).size === count
            ? list.slice() : null;
        sheet.rowIds = ids(json.rowIds, sheet.rowCount, "r");
        sheet.colIds = ids(json.colIds, sheet.colCount, "c");
        return sheet;
    }

    /**
     * Reads merged ranges, dropping single cells, ranges outside the sheet and overlaps.
     * @param {Array} list - The ranges as A1 text or objects.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @returns {Array<object>} The merges.
     */
    _readMerges(list, sheet) {
        const Address = webexpress.webui.SpreadsheetAddress;
        const out = [];
        for (const item of Array.isArray(list) ? list : []) {
            const range = typeof item === "string" ? Address.parseRange(item) : item && typeof item === "object" ? Address.normalize(item) : null;
            if (!range || ![range.r1, range.c1, range.r2, range.c2].every(Number.isInteger)) continue;
            const merge = { r1: range.r1, c1: range.c1, r2: range.r2, c2: range.c2 };
            if (merge.r1 < 0 || merge.c1 < 0 || merge.r2 >= sheet.rowCount || merge.c2 >= sheet.colCount) continue;
            if (merge.r1 === merge.r2 && merge.c1 === merge.c2) continue;
            if (out.some(m => Address.intersects(m, merge))) continue;
            out.push(merge);
        }
        return out;
    }

    /**
     * Reads the properties of a row or a column.
     * @param {object} value - The raw properties.
     * @returns {object|null} The validated properties, or null if none remain.
     */
    _readAxisProps(value) {
        if (!value || typeof value !== "object") return null;
        const out = {};
        if (Number.isFinite(value.size) && value.size >= 0) out.size = Math.min(2000, Math.round(value.size));
        if (value.hidden === true) out.hidden = true;
        const style = this.constructor.sanitizeStyle(value.s);
        if (style) out.s = style;
        return Object.keys(out).length ? out : null;
    }

    /**
     * Reads the free properties of a sheet.
     * @param {object} value - The raw properties.
     * @returns {object} The validated properties.
     */
    _readSheetProps(value) {
        const out = {};
        if (!value || typeof value !== "object") return out;
        if (this.constructor.isColor(value.tabColor)) out.tabColor = value.tabColor;
        if (value.gridlines === false) out.gridlines = false;
        if (value.hidden === true) out.hidden = true;
        return out;
    }

    /**
     * Reads the named ranges; a name must not look like a cell reference.
     * @param {object} value - The raw names.
     * @returns {object} The validated names.
     */
    _readNames(value) {
        const Address = webexpress.webui.SpreadsheetAddress;
        const out = {};
        if (!value || typeof value !== "object" || Array.isArray(value)) return out;
        for (const [name, raw] of Object.entries(value)) {
            if (!this.constructor.isValidName(name) || typeof raw !== "string" || raw.length > 1000) continue;
            const text = raw.replace(/^=/, "");
            const range = Address.parseRange(text);
            if (!range) continue;
            // a name always says which sheet it means, so moving the active sheet never re-aims it;
            // a sheet that does not exist (yet) is kept, the name then evaluates to #REF!
            if (range.sheet) { out[name] = text; continue; }
            if (this.sheets[0]) out[name] = Address.quoteSheet(this.sheets[0].name) + "!" + text;
        }
        return out;
    }

    /**
     * Reads the named cell styles (the format templates).
     * @param {object} value - The raw styles.
     * @returns {object} The validated styles.
     */
    _readStyles(value) {
        const out = {};
        if (!value || typeof value !== "object" || Array.isArray(value)) return out;
        for (const [name, style] of Object.entries(value)) {
            const clean = this.constructor.sanitizeStyle(style);
            if (/^[\w .-]{1,64}$/u.test(name) && clean) out[name] = clean;
        }
        return out;
    }

    /**
     * Determines whether a text may name a range.
     * @param {string} name - The candidate.
     * @returns {boolean} True if it is a valid name.
     */
    static isValidName(name) {
        return typeof name === "string" && /^[A-Za-z_\\][A-Za-z0-9_.\\]{0,254}$/.test(name) && !webexpress.webui.SpreadsheetAddress.parseCell(name)
            && !/^(TRUE|FALSE|R\d*C\d*)$/i.test(name);
    }

    /**
     * Reads a cell from its JSON form without normalizing it.
     * @param {*} raw - The cell object, or a bare value.
     * @returns {object|null} The cell.
     */
    static readCell(raw) {
        if (raw === null || raw === undefined) return null;
        if (typeof raw !== "object" || Array.isArray(raw)) return { v: raw };
        return raw;
    }

    /**
     * Validates a cell and reduces it to the fields that carry information. A formula replaces
     * the value; the computed result ("r") is never stored, because the engine owns it.
     * @param {object|null} cell - The cell.
     * @returns {object|null} The normalized cell, or null if nothing remains.
     */
    static normalizeCell(cell) {
        if (!cell || typeof cell !== "object") return null;
        const out = {};
        if (typeof cell.f === "string" && cell.f.length > 1 && cell.f.startsWith("=") && cell.f.length <= 8192) out.f = cell.f;
        else if (cell.v !== undefined && cell.v !== null && cell.v !== "") {
            const value = cell.v;
            if (typeof value === "number") { if (Number.isFinite(value)) out.v = value; }
            else if (typeof value === "string") out.v = value.slice(0, this.MAX_TEXT);
            else if (typeof value === "boolean") out.v = value;
            else if (cell.t && this._plain(value, 1)) out.v = this._copy(value);
        }
        if (typeof cell.t === "string" && /^[a-z][a-z0-9-]{0,31}$/.test(cell.t)) out.t = cell.t;
        const style = this.sanitizeStyle(cell.s);
        if (style) out.s = style;
        if (typeof cell.st === "string" && /^[\w .-]{1,64}$/u.test(cell.st)) out.st = cell.st;
        const comment = this.readComment(cell.c);
        if (comment) out.c = comment;
        if (cell.m && this._plain(cell.m, 1) && Object.keys(cell.m).length) out.m = this._copy(cell.m);
        return Object.keys(out).length ? out : null;
    }

    /**
     * Reads a comment, given as text or as { text, author, time }.
     * @param {*} value - The raw comment.
     * @returns {object|null} The comment.
     */
    static readComment(value) {
        if (typeof value === "string") return value.trim() ? { text: value.slice(0, this.MAX_TEXT) } : null;
        if (!value || typeof value !== "object" || typeof value.text !== "string" || !value.text.trim()) return null;
        const out = { text: value.text.slice(0, this.MAX_TEXT) };
        if (typeof value.author === "string" && value.author) out.author = value.author.slice(0, 200);
        if (typeof value.time === "string" && value.time.length <= 40) out.time = value.time;
        return out;
    }

    /**
     * Copies a cell without a round trip through JSON text, which would dominate saving a
     * workbook of hundreds of thousands of cells; only nested objects are copied in depth.
     * @param {object} cell - The normalized cell.
     * @returns {object} The copy.
     */
    static copyCell(cell) {
        const out = { ...cell };
        if (cell.s) out.s = cell.s.border ? { ...cell.s, border: { ...cell.s.border } } : { ...cell.s };
        if (cell.c) out.c = { ...cell.c };
        if (cell.m) out.m = this._copy(cell.m);
        if (cell.v !== null && typeof cell.v === "object") out.v = this._copy(cell.v);
        return out;
    }

    /**
     * Compares two cells by content.
     * @param {object|null} a - The first cell.
     * @param {object|null} b - The second cell.
     * @returns {boolean} True if both carry the same content.
     */
    static sameCell(a, b) {
        if (a === b) return true;
        if (!a || !b) return false;
        return webexpress.webui.Ot ? webexpress.webui.Ot.stable(a) === webexpress.webui.Ot.stable(b) : JSON.stringify(a) === JSON.stringify(b);
    }

    /**
     * Validates a style. Styles end up as inline css, so every value is checked against a
     * strict pattern and anything unknown is dropped rather than passed through.
     * @param {object} style - The raw style.
     * @returns {object|null} The clean style, or null if nothing remains.
     */
    static sanitizeStyle(style) {
        if (!style || typeof style !== "object" || Array.isArray(style)) return null;
        const out = {};
        if (typeof style.font === "string" && /^[A-Za-z0-9 ,'"_-]{1,100}$/.test(style.font)) out.font = style.font;
        if (Number.isFinite(style.size) && style.size >= 4 && style.size <= 200) out.size = Math.round(style.size * 2) / 2;
        for (const flag of ["bold", "italic", "underline", "strike", "wrap"]) if (style[flag] === true) out[flag] = true;
        for (const key of ["color", "fill"]) if (this.isColor(style[key])) out[key] = style[key];
        if (["left", "center", "right", "justify"].includes(style.align)) out.align = style.align;
        if (["top", "middle", "bottom"].includes(style.valign)) out.valign = style.valign;
        if (typeof style.nf === "string" && style.nf && style.nf.length <= 200) out.nf = style.nf;
        if (Number.isInteger(style.indent) && style.indent > 0 && style.indent <= 15) out.indent = style.indent;
        if (style.border && typeof style.border === "object") {
            const border = {};
            for (const side of ["top", "right", "bottom", "left"]) {
                const edge = this.parseBorder(style.border[side]);
                if (edge) border[side] = edge.style + (edge.color ? " " + edge.color : "");
            }
            if (Object.keys(border).length) out.border = border;
        }
        return Object.keys(out).length ? out : null;
    }

    /**
     * Parses one border edge such as "thin #ff0000".
     * @param {string} value - The edge.
     * @returns {{style: string, color: string|null}|null} The edge, or null if it is invalid.
     */
    static parseBorder(value) {
        if (typeof value !== "string") return null;
        const [style, color] = value.trim().split(/\s+/, 2);
        if (!this.BORDER_STYLES.includes(style)) return null;
        if (color && !this.isColor(color)) return null;
        return { style, color: color || null };
    }

    /**
     * Determines whether a value is a color the stylesheet may carry.
     * @param {*} value - The candidate.
     * @returns {boolean} True for hex, rgb(a) or plain color names.
     */
    static isColor(value) {
        return typeof value === "string" && (/^#[0-9a-fA-F]{3,8}$/.test(value) || /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(value) || /^[a-zA-Z]{3,20}$/.test(value));
    }

    /**
     * Combines the style layers of a cell: column, row, named style and the cell's own style.
     * @param {object} model - The workbook.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @returns {object} The effective style.
     */
    static effectiveStyle(model, sheet, row, col) {
        const cell = sheet.getCell(row, col);
        const named = cell?.st ? model.styles[cell.st] : null;
        const colStyle = sheet.colProps[col]?.s, rowStyle = sheet.rowProps[row]?.s;
        if (!colStyle && !rowStyle && !named) return cell?.s ?? {};
        const merged = { ...colStyle, ...rowStyle, ...named, ...cell?.s };
        if (colStyle?.border || rowStyle?.border || named?.border || cell?.s?.border) merged.border = { ...colStyle?.border, ...rowStyle?.border, ...named?.border, ...cell?.s?.border };
        return merged;
    }

    /**
     * Determines whether a value is bounded plain JSON data.
     * @param {*} value - The value.
     * @param {number} depth - The nesting depth.
     * @returns {boolean} True if allowed.
     */
    static _plain(value, depth) {
        if (value === undefined || value === null || typeof value === "boolean") return true;
        if (typeof value === "string") return value.length <= this.MAX_TEXT;
        if (typeof value === "number") return Number.isFinite(value);
        if (depth > 6) return false;
        if (Array.isArray(value)) return value.length <= 10000 && value.every(v => this._plain(v, depth + 1));
        if (typeof value !== "object") return false;
        const entries = Object.entries(value);
        return entries.length <= 1000 && entries.every(([key, v]) => key !== "__proto__" && this._plain(v, depth + 1));
    }

    /**
     * Copies JSON data.
     * @param {*} value - The value.
     * @returns {*} The copy.
     */
    static _copy(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
};

/**
 * An error value of a formula, such as #DIV/0!. Errors are values: they flow through
 * references and functions like numbers do.
 */
webexpress.webui.SpreadsheetError = class {
    /**
     * The error codes the engine produces.
     */
    static CODES = ["#NULL!", "#DIV/0!", "#VALUE!", "#REF!", "#NAME?", "#NUM!", "#N/A", "#CIRC!", "#ERROR!"];

    /**
     * Initializes a new instance of the class.
     * @param {string} code - The error code.
     * @param {string} [message] - A description for the tooltip.
     */
    constructor(code, message) { this.code = code; this.message = message || ""; }

    /**
     * Returns the code, the text the cell shows.
     * @returns {string} The code.
     */
    toString() { return this.code; }
};
