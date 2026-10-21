/**
 * The shared form of a workbook. A workbook becomes a flat sequence of leaves for the
 * transformation core (webexpress.webui.Ot): one leaf for the workbook, and per sheet one leaf
 * for the sheet, one per column and one per row. A cell is an attribute of its row leaf, keyed
 * by the id of its column. Rows and columns are addressed by ids that never shift, so two users
 * editing different cells never touch the same attribute, inserting a row is the insertion of
 * one leaf, and concurrent insertions keep each other.
 *
 * Formulas are shared with their references written as row and column ids. A formula another
 * user typed against the old row positions therefore still means the same cells after an
 * insertion elsewhere; every client turns the ids back into A1 text for display.
 *
 *   [book] [sheet s1] [col c1] [col c2] ... [row r1] [row r2] ... [sheet s2] ...
 */
webexpress.webui.SpreadsheetCollab = class {
    /**
     * The largest number of leaves a shared workbook may have.
     */
    static MAX_TOKENS = 2000000;

    /**
     * The pattern of ids and attribute keys.
     */
    static ID = /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/;

    /**
     * Initializes the shared state of a workbook.
     * @param {webexpress.webui.SpreadsheetModel} model - The workbook.
     */
    constructor(model) {
        this.model = model;
        this._maps = new Map();
        for (const sheet of model.sheets) model.ensureIds(sheet);
        this.order = model.sheets.map(s => s.id);
        this.tokens = this.build();
        this._index = null;
    }

    /**
     * Linearizes the workbook.
     * @returns {Array<object>} The tokens.
     */
    build() {
        const model = this.model;
        const tokens = [{ t: "l", n: "book", id: "book", a: this.bookAttrs() }];
        for (const id of this.order) {
            const sheet = model.sheet(id);
            if (!sheet) continue;
            model.ensureIds(sheet);
            tokens.push({ t: "l", n: "sheet", id: sheet.id, a: this.sheetAttrs(sheet) });
            sheet.colIds.forEach((colId, col) => tokens.push({ t: "l", n: "col", id: colId, a: this.axisAttrs(sheet.colProps[col], "p") }));
            sheet.rowIds.forEach((rowId, row) => tokens.push({ t: "l", n: "row", id: rowId, a: this.rowAttrs(sheet, row) }));
        }
        return tokens;
    }

    /**
     * Returns the attributes of the workbook leaf.
     * @returns {object} The attributes.
     */
    bookAttrs() {
        const model = this.model, names = {};
        for (const [name, text] of Object.entries(model.names)) names[name] = this.encodeFormula("=" + text, null);
        const attrs = { order: model.sheets.map(s => s.id) };
        if (Object.keys(names).length) attrs.names = names;
        if (Object.keys(model.styles).length) attrs.styles = webexpress.webui.SpreadsheetModel._copy(model.styles);
        if (Object.keys(model.meta).length) attrs.meta = webexpress.webui.SpreadsheetModel._copy(model.meta);
        return attrs;
    }

    /**
     * Returns the attributes of a sheet leaf.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @returns {object} The attributes.
     */
    sheetAttrs(sheet) {
        const attrs = { name: sheet.name };
        if (sheet.merges.length) attrs.merges = sheet.merges.map(m => [sheet.rowIds[m.r1], sheet.colIds[m.c1], sheet.rowIds[m.r2], sheet.colIds[m.c2]]);
        if (sheet.frozenRows || sheet.frozenCols) attrs.frozen = { rows: sheet.frozenRows, cols: sheet.frozenCols };
        if (Object.keys(sheet.props).length) attrs.props = { ...sheet.props };
        return attrs;
    }

    /**
     * Returns the attributes holding the properties of a row or a column.
     * @param {object|undefined} props - The properties.
     * @param {string} key - The attribute key.
     * @returns {object} The attributes.
     */
    axisAttrs(props, key) { return props ? { [key]: webexpress.webui.SpreadsheetModel._copy(props) } : {}; }

    /**
     * Returns the attributes of a row leaf: its cells by column id and its properties.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @param {number} row - The row.
     * @returns {object} The attributes.
     */
    rowAttrs(sheet, row) {
        const attrs = this.axisAttrs(sheet.rowProps[row], "_p");
        sheet.rows[row]?.forEach((cell, col) => { if (cell) attrs[sheet.colIds[col]] = this.encodeCell(cell, sheet); });
        return attrs;
    }

    /**
     * Encodes a cell for sharing: the formula with id references, everything else as is.
     * @param {object} cell - The cell.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet holding it.
     * @returns {object} The shared cell.
     */
    encodeCell(cell, sheet) {
        const out = webexpress.webui.SpreadsheetModel._copy(cell);
        if (cell.f) out.f = this.encodeFormula(cell.f, sheet);
        return out;
    }

    /**
     * Decodes a shared cell.
     * @param {object} shared - The shared cell.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet holding it.
     * @returns {object|null} The cell.
     */
    decodeCell(shared, sheet) {
        if (!shared || typeof shared !== "object") return null;
        const cell = { ...shared };
        if (typeof cell.f === "string") cell.f = this.decodeFormula(cell.f, sheet);
        return webexpress.webui.SpreadsheetModel.normalizeCell(cell);
    }

    /**
     * Writes the references of a formula as ids. A reference to a sheet, a row or a column that
     * does not exist stays text.
     * @param {string} text - The formula.
     * @param {webexpress.webui.SpreadsheetSheet|null} home - The sheet the formula is on.
     * @returns {string} The encoded formula.
     */
    encodeFormula(text, home) {
        const model = this.model;
        return webexpress.webui.SpreadsheetFormula.rewrite(text, home?.name ?? null, ref => {
            const sheet = ref.sheet ? model.sheet(ref.sheet) : home;
            if (!sheet) return ref;
            model.ensureIds(sheet);
            const id = { s: sheet.id, x: ref.sheet ? 1 : 0, k: ref.kind, a: ref.abs.map(Number) };
            if (ref.kind !== "cols") {
                if (ref.r2 >= sheet.rowCount) return ref;
                id.r = [sheet.rowIds[ref.r1], sheet.rowIds[ref.r2]];
            }
            if (ref.kind !== "rows") {
                if (ref.c2 >= sheet.colCount) return ref;
                id.c = [sheet.colIds[ref.c1], sheet.colIds[ref.c2]];
            }
            return "@" + JSON.stringify(id);
        });
    }

    /**
     * Turns the id references of a formula back into A1 text; a reference whose row, column or
     * sheet was removed becomes #REF!.
     * @param {string} text - The encoded formula.
     * @param {webexpress.webui.SpreadsheetSheet|null} home - The sheet the formula is on.
     * @returns {string} The formula.
     */
    decodeFormula(text, home) {
        if (!text.includes("@{")) return text;
        let tokens;
        try { tokens = webexpress.webui.SpreadsheetFormula.tokenize(text); } catch { return text; }
        return tokens.map(token => {
            if (token.type !== "idref") return token.text;
            let id;
            try { id = JSON.parse(token.text.slice(1)); } catch { return "#REF!"; }
            const sheet = this.model.sheet(id.s);
            if (!sheet || this.model.sheets.indexOf(sheet) < 0) return "#REF!";
            const maps = this.maps(sheet);
            const ref = { kind: id.k, abs: (id.a ?? [0, 0, 0, 0]).map(Boolean), sheet: id.x || sheet !== home ? sheet.name : null };
            if (id.k === "cols") { ref.r1 = 0; ref.r2 = webexpress.webui.SpreadsheetAddress.MAX_ROWS - 1; }
            else {
                ref.r1 = maps.rows.get(id.r?.[0]); ref.r2 = maps.rows.get(id.r?.[1]);
                if (ref.r1 === undefined || ref.r2 === undefined) return "#REF!";
            }
            if (id.k === "rows") { ref.c1 = 0; ref.c2 = webexpress.webui.SpreadsheetAddress.MAX_COLS - 1; }
            else {
                ref.c1 = maps.cols.get(id.c?.[0]); ref.c2 = maps.cols.get(id.c?.[1]);
                if (ref.c1 === undefined || ref.c2 === undefined) return "#REF!";
            }
            if (!["cell", "range", "cols", "rows"].includes(ref.kind)) return "#REF!";
            return webexpress.webui.SpreadsheetFormula.writeRef(ref);
        }).join("");
    }

    /**
     * Returns the id-to-index maps of a sheet, rebuilt only when its structure changed.
     * @param {webexpress.webui.SpreadsheetSheet} sheet - The sheet.
     * @returns {{rows: Map<string, number>, cols: Map<string, number>}} The maps.
     */
    maps(sheet) {
        this.model.ensureIds(sheet);
        let entry = this._maps.get(sheet.id);
        if (!entry || entry.version !== (sheet.version || 0) || entry.rowIds !== sheet.rowIds || entry.colIds !== sheet.colIds) {
            entry = {
                version: sheet.version || 0, rowIds: sheet.rowIds, colIds: sheet.colIds,
                rows: new Map(sheet.rowIds.map((id, i) => [id, i])), cols: new Map(sheet.colIds.map((id, i) => [id, i]))
            };
            this._maps.set(sheet.id, entry);
        }
        return entry;
    }

    /**
     * Indexes the leaves by id and the sections by sheet.
     * @returns {object} The index { pos: Map, sections: Map }.
     */
    index() {
        if (this._index) return this._index;
        const pos = new Map(), sections = new Map();
        let current = null;
        this.tokens.forEach((token, i) => {
            pos.set(token.n + ":" + token.id, i);
            if (token.n === "sheet") { current = { id: token.id, start: i, cols: [], rows: [] }; sections.set(token.id, current); }
            else if (token.n === "col") current?.cols.push(token.id);
            else if (token.n === "row") current?.rows.push(token.id);
        });
        return (this._index = { pos, sections });
    }

    /**
     * Turns a change log of the model into steps on the shared tokens, applies them and
     * returns them with their recorded inverses. Structural steps go first, one by one, because
     * they shift positions; all attribute steps follow in one pass.
     * @param {object} changes - The change log.
     * @returns {Array<object>} The applied steps.
     */
    localSteps(changes) {
        const Ot = webexpress.webui.Ot, model = this.model;
        const applied = [];
        const run = (step) => {
            const result = Ot.apply(this.tokens, [step]);
            this.tokens = result.tokens; this._index = null;
            applied.push(...result.steps);
        };
        for (const change of changes.sheets) {
            if (change.type === "add") {
                const sheet = model.sheet(change.sheet);
                model.ensureIds(sheet);
                this.order.push(sheet.id);
                const slice = [{ t: "l", n: "sheet", id: sheet.id, a: this.sheetAttrs(sheet) }];
                sheet.colIds.forEach((id, col) => slice.push({ t: "l", n: "col", id, a: this.axisAttrs(sheet.colProps[col], "p") }));
                sheet.rowIds.forEach((id, row) => slice.push({ t: "l", n: "row", id, a: this.rowAttrs(sheet, row) }));
                run({ type: "replace", from: this.tokens.length, to: this.tokens.length, slice: Ot.compact(slice) });
            } else if (change.type === "remove") {
                const section = this.index().sections.get(change.sheet);
                if (!section) continue;
                const end = section.start + 1 + section.cols.length + section.rows.length;
                this.order = this.order.filter(id => id !== change.sheet);
                run({ type: "replace", from: section.start, to: end, slice: [] });
            }
        }
        for (const change of changes.structure) {
            const section = this.index().sections.get(change.sheet);
            if (!section) continue;
            const rows = change.type.endsWith("Rows");
            const base = section.start + 1 + (rows ? section.cols.length : 0);
            const from = base + change.index;
            if (change.type.startsWith("insert")) {
                const ids = change.ids ?? [];
                run({ type: "replace", from, to: from, slice: ids.map(id => ({ t: "l", n: rows ? "row" : "col", id, a: {} })) });
            } else {
                run({ type: "replace", from, to: from + change.count, slice: [] });
            }
        }
        const attrs = [];
        const index = this.index();
        const set = (kind, id, key, value) => {
            const pos = index.pos.get(kind + ":" + id);
            if (pos === undefined) return;
            const current = this.tokens[pos].a?.[key];
            if (Ot.stable(current ?? null) === Ot.stable(value ?? null)) return;
            attrs.push({ type: "setAttr", pos, id, key, value: value ?? null });
        };
        const deletedCols = changes.structure.filter(c => c.type === "deleteCols");
        for (const change of changes.cells) {
            const sheet = model.sheet(change.sheet);
            if (!sheet) continue;
            if (change.removed) {
                // a deleted column leaves its values on the row leaves unless they are cleared
                const gone = deletedCols.find(c => c.sheet === change.sheet && change.col >= c.index && change.col < c.index + c.count);
                const rowId = gone && sheet.rowIds?.[change.row];
                if (rowId && gone.ids) set("row", rowId, gone.ids[change.col - gone.index], null);
                continue;
            }
            if (change.row >= sheet.rowCount || change.col >= sheet.colCount) continue;
            const cell = sheet.getCell(change.row, change.col);
            set("row", sheet.rowIds[change.row], sheet.colIds[change.col], cell ? this.encodeCell(cell, sheet) : null);
        }
        for (const change of changes.axis) {
            const sheet = model.sheet(change.sheet);
            if (!sheet) continue;
            const row = change.axis === "row";
            if (change.index >= (row ? sheet.rowCount : sheet.colCount)) continue;
            const props = (row ? sheet.rowProps : sheet.colProps)[change.index] ?? null;
            set(row ? "row" : "col", (row ? sheet.rowIds : sheet.colIds)[change.index], row ? "_p" : "p", props ? webexpress.webui.SpreadsheetModel._copy(props) : null);
        }
        const sheetsTouched = new Set([...changes.merges, ...changes.frozen, ...changes.props, ...changes.sheets.filter(c => c.type === "rename").map(c => c.sheet)]);
        if (changes.structure.length) changes.structure.forEach(c => sheetsTouched.add(c.sheet));
        for (const id of sheetsTouched) {
            const sheet = model.sheet(id);
            if (!sheet) continue;
            const desired = this.sheetAttrs(sheet);
            for (const key of ["name", "merges", "frozen", "props"]) set("sheet", id, key, desired[key]);
        }
        const book = this.bookAttrs();
        if (changes.names || changes.structure.length || changes.sheets.length) set("book", "book", "names", book.names);
        if (changes.styles) set("book", "book", "styles", book.styles);
        if (changes.meta) set("book", "book", "meta", book.meta);
        if (changes.sheets.length) set("book", "book", "order", book.order);
        if (attrs.length) {
            const result = Ot.apply(this.tokens, attrs);
            this.tokens = result.tokens;
            applied.push(...result.steps);
        }
        // formulas elsewhere that point into removed rows decode to #REF! on every client by themselves
        return applied;
    }

    /**
     * Applies steps from elsewhere - another user, or the own undo while shared - to the shared
     * tokens and plans how the workbook follows (see applyReconcile).
     * @param {Array<object>} steps - The steps.
     * @returns {{applied: Array<object>, plan: object}|null} The applied steps and the plan, or
     * null if the steps do not fit or break the schema.
     */
    remoteSteps(steps) {
        const Ot = webexpress.webui.Ot;
        let result;
        try { result = Ot.apply(this.tokens, steps); } catch { return null; }
        if (!this.constructor.check(result.tokens)) return null;
        const touched = new Set();
        let structural = false;
        for (const step of result.steps) {
            if (step.type === "setAttr") touched.add(step.id);
            else if (step.type === "replace") {
                structural = true;
                for (const token of Ot.expand(step.slice ?? [])) touched.add(token.id);
            }
        }
        this.tokens = result.tokens; this._index = null;
        return { applied: result.steps, plan: this.reconcile(touched, structural) };
    }

    /**
     * Plans the structural model operations that make the workbook match the shared tokens:
     * sheets added, removed and reordered, rows and columns inserted and deleted. Structure is
     * compared by id lists, so the plan needs no knowledge of the steps that caused it.
     * @param {Set<string>} touched - The ids of changed leaves; extended by inserted ones.
     * @param {boolean} structural - Whether leaves were inserted or removed.
     * @returns {{ops: Array<object>, touched: Set<string>, structural: boolean}} The plan.
     */
    reconcile(touched, structural) {
        const model = this.model;
        const ops = [];
        const index = this.index();
        if (structural) {
            this.order = [...index.sections.keys()];
            // the operations run one after another, so the plan follows them on copies of the id lists
            const plan = new Map(model.sheets.map(s => { model.ensureIds(s); return [s.id, { rows: s.rowIds.slice(), cols: s.colIds.slice() }]; }));
            for (const [id, section] of index.sections) {
                if (plan.has(id)) continue;
                ops.push({ type: "addSheet", sheet: { id, name: this.tokens[section.start].a.name, rowCount: section.rows.length, colCount: section.cols.length, rowIds: section.rows, colIds: section.cols } });
                plan.set(id, { rows: section.rows.slice(), cols: section.cols.slice() });
                section.rows.forEach(x => touched.add(x));
                section.cols.forEach(x => touched.add(x));
                touched.add(id);
            }
            // removals follow the additions, as a workbook never runs out of sheets on the way
            for (const sheet of model.sheets) if (!index.sections.has(sheet.id)) ops.push({ type: "removeSheet", sheet: sheet.id });
            for (const [id, section] of index.sections) {
                const current = plan.get(id);
                for (const [axis, wanted] of [["Rows", section.rows], ["Cols", section.cols]]) {
                    const have = axis === "Rows" ? current.rows : current.cols;
                    let start = 0;
                    while (start < have.length && start < wanted.length && have[start] === wanted[start]) start++;
                    let endHave = have.length, endWanted = wanted.length;
                    while (endHave > start && endWanted > start && have[endHave - 1] === wanted[endWanted - 1]) { endHave--; endWanted--; }
                    const removed = endHave - start, added = endWanted - start;
                    if (!removed && !added) continue;
                    // inserting behind the removed block first keeps at least one row or column at all times
                    if (added) {
                        const ids = wanted.slice(start, endWanted);
                        ops.push({ type: "insert" + axis, sheet: id, index: start + removed, count: added, ids, adjust: false });
                        ids.forEach(x => touched.add(x));
                    }
                    if (removed) ops.push({ type: "delete" + axis, sheet: id, index: start, count: removed, adjust: false });
                    have.splice(start, removed, ...wanted.slice(start, endWanted));
                }
                touched.add(id);
            }
        }
        if (structural || touched.has("book")) {
            const order = (this.tokens[0].a.order ?? []).filter(id => index.sections.has(id));
            for (const id of index.sections.keys()) if (!order.includes(id)) order.push(id);
            order.forEach((id, position) => ops.push({ type: "moveSheet", sheet: id, index: position }));
        }
        return { ops, touched, structural };
    }

    /**
     * Applies a plan of reconcile to the model. Structure goes first; then sheet properties,
     * rows, columns and cells are compared with the tokens. Cells are decoded only now, because
     * their references resolve against the final structure and sheet names. After a structural
     * change every row holding a formula is compared, as the tokens are the truth about what a
     * formula references.
     * @param {object} plan - The result of reconcile.
     * @returns {object} The change log.
     */
    applyReconcile(plan) {
        const model = this.model, Ot = webexpress.webui.Ot;
        const changes = webexpress.webui.SpreadsheetModel.emptyChanges();
        const run = (op) => { try { model._apply(op, changes); } catch (e) { console.warn("spreadsheet: shared change skipped", e); } };
        plan.ops.forEach(run);
        const index = this.index(), touched = plan.touched;
        for (const [id, section] of index.sections) {
            if (!touched.has(id)) continue;
            const token = this.tokens[section.start];
            run({ type: "renameSheet", sheet: id, name: token.a.name, adjust: false });
            run({ type: "freeze", sheet: id, rows: token.a.frozen?.rows ?? 0, cols: token.a.frozen?.cols ?? 0 });
            run({ type: "sheetProps", sheet: id, props: token.a.props ?? {} });
        }
        for (const [id, section] of index.sections) {
            const sheet = model.sheet(id);
            if (!sheet) continue;
            const maps = this.maps(sheet);
            if (touched.has(id)) {
                const merges = (this.tokens[section.start].a.merges ?? []).map(([r1, c1, r2, c2]) => ({ r1: maps.rows.get(r1), c1: maps.cols.get(c1), r2: maps.rows.get(r2), c2: maps.cols.get(c2) }))
                    .filter(m => [m.r1, m.c1, m.r2, m.c2].every(Number.isInteger));
                if (Ot.stable(merges.map(m => webexpress.webui.SpreadsheetAddress.normalize(m))) !== Ot.stable(sheet.merges)) run({ type: "merges", sheet: id, merges });
            }
            const axisEntries = { row: [], col: [] };
            section.cols.forEach((colId, col) => {
                if (touched.has(colId)) axisEntries.col.push({ index: col, props: this.tokens[index.pos.get("col:" + colId)].a.p ?? null });
            });
            const cells = [];
            section.rows.forEach((rowId, row) => {
                const token = this.tokens[index.pos.get("row:" + rowId)];
                const formulas = plan.structural && (sheet.rows[row]?.some(c => c?.f) || Object.entries(token.a).some(([key, c]) => key !== "_p" && typeof c?.f === "string"));
                if (!touched.has(rowId) && !formulas) return;
                if (touched.has(rowId)) axisEntries.row.push({ index: row, props: token.a._p ?? null });
                const seen = new Set();
                for (const [key, shared] of Object.entries(token.a)) {
                    const col = key === "_p" ? undefined : maps.cols.get(key);
                    if (col === undefined) continue;
                    seen.add(col);
                    cells.push({ row, col, cell: this.decodeCell(shared, sheet) });
                }
                sheet.rows[row]?.forEach((cell, col) => { if (cell && !seen.has(col)) cells.push({ row, col, cell: null }); });
            });
            if (axisEntries.row.length) run({ type: "axis", sheet: id, axis: "row", entries: axisEntries.row });
            if (axisEntries.col.length) run({ type: "axis", sheet: id, axis: "col", entries: axisEntries.col });
            if (cells.length) run({ type: "set", sheet: id, cells });
        }
        if (touched.has("book") || plan.structural) {
            const book = this.tokens[0].a;
            const names = {};
            for (const [name, text] of Object.entries(book.names ?? {})) {
                const decoded = this.decodeFormula(String(text), null);
                if (!decoded.includes("#REF!")) names[name] = decoded.replace(/^=/, "");
            }
            if (Ot.stable(names) !== Ot.stable(model.names)) run({ type: "names", value: names });
            if (Ot.stable(book.styles ?? {}) !== Ot.stable(model.styles)) run({ type: "styles", value: book.styles ?? {} });
            if (Ot.stable(book.meta ?? {}) !== Ot.stable(model.meta)) run({ type: "meta", value: book.meta ?? {} });
        }
        return changes;
    }

    /**
     * Encodes a selection for the presence of other users: by ids, so it survives their edits.
     * @param {string} sheetId - The sheet.
     * @param {Array<object>} ranges - The selected ranges.
     * @param {{row: number, col: number}} active - The active cell.
     * @returns {object|null} The presence selection.
     */
    encodeSelection(sheetId, ranges, active) {
        const sheet = this.model.sheet(sheetId);
        if (!sheet) return null;
        this.model.ensureIds(sheet);
        const clampRow = r => sheet.rowIds[Math.min(r, sheet.rowCount - 1)], clampCol = c => sheet.colIds[Math.min(c, sheet.colCount - 1)];
        return {
            sheet: sheetId,
            ranges: ranges.slice(0, 20).map(r => [clampRow(r.r1), clampCol(r.c1), clampRow(r.r2), clampCol(r.c2)]),
            active: [clampRow(active.row), clampCol(active.col)]
        };
    }

    /**
     * Resolves a presence selection to positions.
     * @param {object} selection - The presence selection.
     * @returns {{sheet: string, ranges: Array<object>, active: object}|null} The positions, or null.
     */
    decodeSelection(selection) {
        const sheet = selection && this.model.sheet(selection.sheet);
        if (!sheet) return null;
        const maps = this.maps(sheet);
        const ranges = (selection.ranges ?? []).map(([r1, c1, r2, c2]) => ({ r1: maps.rows.get(r1), c1: maps.cols.get(c1), r2: maps.rows.get(r2), c2: maps.cols.get(c2) }))
            .filter(r => [r.r1, r.c1, r.r2, r.c2].every(Number.isInteger)).map(r => webexpress.webui.SpreadsheetAddress.normalize(r));
        const row = maps.rows.get(selection.active?.[0]), col = maps.cols.get(selection.active?.[1]);
        return Number.isInteger(row) && Number.isInteger(col) ? { sheet: sheet.id, ranges, active: { row, col } } : null;
    }

    /**
     * Rebuilds a workbook model from shared tokens.
     * @param {Array<object>} tokens - The expanded tokens.
     * @param {object} [options] - The model options.
     * @returns {webexpress.webui.SpreadsheetModel} The model.
     */
    static toModel(tokens, options = {}) {
        const book = tokens[0];
        const sheets = [];
        let current = null;
        for (const token of tokens.slice(1)) {
            if (token.n === "sheet") {
                current = { token, cols: [], rows: [] };
                sheets.push(current);
            } else if (token.n === "col") current.cols.push(token);
            else current.rows.push(token);
        }
        const json = {
            sheets: sheets.map(s => ({
                id: s.token.id, name: s.token.a.name, rowCount: s.rows.length, colCount: s.cols.length,
                rowIds: s.rows.map(t => t.id), colIds: s.cols.map(t => t.id),
                frozen: s.token.a.frozen, props: s.token.a.props
            })),
            styles: book.a.styles, meta: book.a.meta
        };
        const model = webexpress.webui.SpreadsheetModel.fromJSON(json, options);
        const collab = new this(model);
        // cells are decoded once every sheet exists, as formulas may reference any of them
        sheets.forEach((s, i) => {
            const sheet = model.sheets[i];
            const colAt = new Map(sheet.colIds.map((x, c) => [x, c]));
            s.cols.forEach((token, c) => { if (token.a.p) sheet.colProps[c] = model._readAxisProps(token.a.p); });
            s.rows.forEach((token, r) => {
                if (token.a._p) sheet.rowProps[r] = model._readAxisProps(token.a._p);
                for (const [key, shared] of Object.entries(token.a)) {
                    const c = colAt.get(key);
                    if (key === "_p" || c === undefined) continue;
                    const cell = collab.decodeCell(shared, sheet);
                    if (cell) sheet.setCell(r, c, cell);
                }
            });
            const rowAt = new Map(sheet.rowIds.map((x, r) => [x, r]));
            sheet.merges = model._readMerges((s.token.a.merges ?? []).map(([r1, c1, r2, c2]) => ({ r1: rowAt.get(r1), c1: colAt.get(c1), r2: rowAt.get(r2), c2: colAt.get(c2) })), sheet);
        });
        const order = (book.a.order ?? []).filter(id => model.sheet(id));
        model.sheets.sort((a, b) => (order.indexOf(a.id) + 1 || 1e9) - (order.indexOf(b.id) + 1 || 1e9));
        const names = {};
        for (const [name, text] of Object.entries(book.a.names ?? {})) {
            const decoded = collab.decodeFormula(String(text), null);
            if (!decoded.includes("#REF!")) names[name] = decoded;
        }
        model.names = model._readNames(names);
        model._syncCounter();
        return model;
    }

    /**
     * Checks shared tokens against the workbook schema - the same rules the server applies
     * (SpreadsheetSchema): the workbook leaf first, then complete sheet sections with unique
     * ids, at least one column and one row each, and bounded plain data as attributes.
     * @param {Array<object>} tokens - The expanded tokens.
     * @returns {boolean} True if valid.
     */
    static check(tokens) {
        if (!Array.isArray(tokens) || !tokens.length || tokens.length > this.MAX_TOKENS) return false;
        const book = tokens[0];
        if (book?.t !== "l" || book.n !== "book" || book.id !== "book" || !this._bookAttrs(book.a)) return false;
        const ids = new Set();
        let section = null, sheets = 0;
        const names = new Set();
        const close = () => section && section.cols > 0 && section.rows > 0 && section.cols <= webexpress.webui.SpreadsheetAddress.MAX_COLS && section.rows <= webexpress.webui.SpreadsheetAddress.MAX_ROWS;
        for (let i = 1; i < tokens.length; i++) {
            const token = tokens[i];
            if (token?.t !== "l" || typeof token.id !== "string" || !this.ID.test(token.id)) return false;
            const key = token.n + ":" + token.id;
            if (ids.has(key)) return false;
            ids.add(key);
            if (token.n === "sheet") {
                if (section && !close()) return false;
                const name = token.a?.name;
                if (typeof name !== "string" || !name.trim() || name.length > 100 || /[\[\]:*?/\\]/.test(name) || names.has(name.toLowerCase())) return false;
                names.add(name.toLowerCase());
                if (!this._data(token.a, 0, 1000)) return false;
                section = { cols: 0, rows: 0 }; sheets++;
            } else if (token.n === "col") {
                if (!section || section.rows) return false;
                section.cols++;
                if (!this._data(token.a, 0, 10)) return false;
            } else if (token.n === "row") {
                if (!section || !section.cols) return false;
                section.rows++;
                const entries = Object.entries(token.a ?? {});
                if (entries.length > webexpress.webui.SpreadsheetAddress.MAX_COLS + 1) return false;
                for (const [attr, value] of entries) {
                    if (!this.ID.test(attr) || attr === "__proto__") return false;
                    if (!value || typeof value !== "object" || Array.isArray(value) || !this._data(value, 1, 64)) return false;
                    if (attr !== "_p" && !Object.keys(value).every(k => ["v", "f", "t", "s", "st", "c", "m"].includes(k))) return false;
                }
            } else return false;
        }
        return sheets > 0 && close();
    }

    /**
     * Repairs shared tokens after concurrent changes left them invalid: malformed and repeated
     * leaves are dropped, sheets without rows or columns removed, and a workbook without any
     * sheet is not repairable.
     * @param {Array<object>} tokens - The expanded tokens.
     * @returns {Array<object>|null} Valid tokens, or null.
     */
    static repair(tokens) {
        if (!Array.isArray(tokens) || !tokens.length) return null;
        const book = tokens[0]?.n === "book" && this._bookAttrs(tokens[0].a) ? tokens[0] : { t: "l", n: "book", id: "book", a: { order: [] } };
        const out = [book];
        const seen = new Set();
        let section = null;
        const flush = () => { if (section && section.cols.length && section.rows.length) out.push(section.sheet, ...section.cols, ...section.rows); section = null; };
        const names = new Set();
        for (const token of tokens.slice(tokens[0] === book ? 1 : 0)) {
            if (token?.t !== "l" || typeof token.id !== "string" || !this.ID.test(token.id)) continue;
            const key = token.n + ":" + token.id;
            if (seen.has(key)) continue;
            seen.add(key);
            if (token.n === "sheet") {
                flush();
                let name = typeof token.a?.name === "string" && token.a.name.trim() ? token.a.name.replace(/[\[\]:*?/\\]/g, "").slice(0, 100) : token.id;
                while (names.has(name.toLowerCase())) name += "_";
                names.add(name.toLowerCase());
                section = { sheet: { ...token, a: { ...token.a, name } }, cols: [], rows: [] };
            } else if (token.n === "col" && section && !section.rows.length) section.cols.push(token);
            else if (token.n === "row" && section && section.cols.length) {
                const a = {};
                for (const [attr, value] of Object.entries(token.a ?? {})) {
                    if (this.ID.test(attr) && value && typeof value === "object" && !Array.isArray(value) && this._data(value, 1, 64)) a[attr] = value;
                }
                section.rows.push({ ...token, a });
            }
        }
        flush();
        if (out.length < 2) return null;
        return this.check(out) ? out : null;
    }

    /**
     * Checks the attributes of the workbook leaf.
     * @param {object} attrs - The attributes.
     * @returns {boolean} True if valid.
     */
    static _bookAttrs(attrs) {
        if (!attrs || typeof attrs !== "object") return false;
        if (attrs.order !== undefined && (!Array.isArray(attrs.order) || !attrs.order.every(id => typeof id === "string"))) return false;
        return this._data(attrs, 0, 10000);
    }

    /**
     * Checks that a value is bounded plain data.
     * @param {*} value - The value.
     * @param {number} depth - The nesting depth.
     * @param {number} width - The maximum number of entries of an object or an array.
     * @returns {boolean} True if allowed.
     */
    static _data(value, depth, width) {
        if (depth > 6) return false;
        if (value === null || typeof value === "boolean") return true;
        if (typeof value === "string") return value.length <= 32767;
        if (typeof value === "number") return Number.isFinite(value);
        if (Array.isArray(value)) return value.length <= Math.max(width, 10000) && value.every(v => this._data(v, depth + 1, width));
        if (typeof value !== "object") return false;
        const entries = Object.entries(value);
        return entries.length <= Math.max(width, 1000) && entries.every(([key, v]) => key !== "__proto__" && key.length <= 255 && this._data(v, depth + 1, width));
    }
};

/**
 * The interface every synchronization mechanism implements to share a spreadsheet. A provider
 * only transports: it sequences submitted changes, answers the submitter with an
 * acknowledgement, forwards the change to everyone else and relays presence, all through one
 * ordered message channel per client. The transformation of concurrent changes happens in the
 * session, so a provider over WebSockets, a message queue, WebRTC or a test double needs no
 * spreadsheet knowledge at all.
 *
 * Messages to the client: { type: "ack", version }, { type: "op", version, steps, client, user },
 * { type: "presence", client, user, selection }, { type: "leave", client },
 * { type: "reset", version, tokens }.
 */
webexpress.webui.SpreadsheetCollaborationProvider = class {
    /**
     * Opens the connection and joins the document.
     * @param {object} join - { client, user, tokens }: the client id, the user { id, name,
     * color } and the packed tokens to seed a document that does not exist yet.
     * @param {Function} deliver - Receives the messages for this client, in order.
     * @returns {Promise<{version: number, tokens: Array<object>}>} The current document.
     */
    async connect(join, deliver) { throw new Error("SpreadsheetCollaborationProvider.connect is abstract."); }

    /**
     * Submits local steps based on a version.
     * @param {{client: string, version: number, steps: Array<object>}} message - The change.
     */
    submit(message) { throw new Error("SpreadsheetCollaborationProvider.submit is abstract."); }

    /**
     * Announces the local selection.
     * @param {{client: string, user: object, selection: object|null}} message - The presence.
     */
    presence(message) { }

    /**
     * Leaves the document and closes the connection.
     * @param {string} client - The client id.
     */
    disconnect(client) { }
};

/**
 * An in-memory document that sequences changes for the providers attached to it. Two
 * spreadsheets on one page, the tutorial and the tests share through it; a server provides the
 * same behaviour across machines.
 */
webexpress.webui.SpreadsheetMemoryHub = class {
    /**
     * Initializes an empty hub; the first client seeds the document.
     * @param {object} [options] - { latency: delivery delay in milliseconds, validate: tokens check }.
     */
    constructor(options = {}) {
        this.version = 0; this.tokens = null; this.log = [];
        this.clients = new Map();
        this.latency = options.latency ?? 0;
        this.validate = options.validate ?? (tokens => webexpress.webui.SpreadsheetCollab.check(tokens));
    }

    /**
     * Joins a client.
     * @param {object} join - { client, user, tokens }.
     * @param {Function} deliver - The message channel of the client.
     * @returns {{version: number, tokens: Array<object>}} The document.
     */
    join(join, deliver) {
        if (!this.tokens) this.tokens = webexpress.webui.Ot.expand(join.tokens ?? []);
        this.clients.set(join.client, { deliver, user: join.user, queue: [], busy: false, selection: null });
        // the newcomer learns who is already here
        for (const [id, other] of this.clients) if (id !== join.client && other.selection) this._send(join.client, { type: "presence", client: id, user: other.user, selection: other.selection });
        return { version: this.version, tokens: webexpress.webui.Ot.compact(this.tokens) };
    }

    /**
     * Sequences a change: rebases it over everything sequenced since its version, checks the
     * result and acknowledges or rejects it.
     * @param {{client: string, version: number, steps: Array<object>}} message - The change.
     */
    submit(message) {
        const Ot = webexpress.webui.Ot;
        const client = this.clients.get(message.client);
        if (!client) return;
        let steps = message.steps;
        try {
            for (const entry of this.log.filter(e => e.version > message.version)) steps = Ot.transform(steps, entry.steps, false)[0];
            const result = Ot.apply(this.tokens, steps);
            if (!this.validate(result.tokens)) throw new Error("invalid");
            this.tokens = result.tokens;
            this.version++;
            const plain = result.steps.map(({ removed, previous, ...step }) => step);
            this.log.push({ version: this.version, steps: plain, client: message.client });
            if (this.log.length > 1000) this.log.shift();
            this._send(message.client, { type: "ack", version: this.version });
            for (const id of this.clients.keys()) {
                if (id !== message.client) this._send(id, { type: "op", version: this.version, steps: plain, client: message.client, user: client.user });
            }
        } catch {
            this._send(message.client, { type: "reset", version: this.version, tokens: Ot.compact(this.tokens) });
        }
    }

    /**
     * Relays a selection.
     * @param {{client: string, user: object, selection: object|null}} message - The presence.
     */
    presence(message) {
        const client = this.clients.get(message.client);
        if (!client) return;
        client.selection = message.selection; client.user = message.user ?? client.user;
        for (const id of this.clients.keys()) if (id !== message.client) this._send(id, { type: "presence", client: message.client, user: client.user, selection: message.selection });
    }

    /**
     * Removes a client.
     * @param {string} id - The client id.
     */
    leave(id) {
        if (!this.clients.delete(id)) return;
        for (const other of this.clients.keys()) this._send(other, { type: "leave", client: id });
    }

    /**
     * Delivers a message asynchronously but strictly in order per client.
     * @param {string} id - The client id.
     * @param {object} message - The message.
     */
    _send(id, message) {
        const client = this.clients.get(id);
        if (!client) return;
        client.queue.push(webexpress.webui.Ot.clone(message));
        if (client.busy) return;
        client.busy = true;
        const pump = () => {
            const next = client.queue.shift();
            if (!next) { client.busy = false; return; }
            try { client.deliver(next); } catch (e) { console.error(e); }
            schedule();
        };
        const schedule = () => (this.latency ? setTimeout(pump, this.latency) : queueMicrotask(pump));
        schedule();
    }
};

/**
 * A provider sharing through a SpreadsheetMemoryHub.
 */
webexpress.webui.SpreadsheetMemoryProvider = class extends webexpress.webui.SpreadsheetCollaborationProvider {
    /**
     * Initializes a new instance of the class.
     * @param {webexpress.webui.SpreadsheetMemoryHub} hub - The hub.
     */
    constructor(hub) { super(); this.hub = hub; }

    /**
     * Joins the hub.
     * @param {object} join - The join message.
     * @param {Function} deliver - The message channel.
     * @returns {Promise<object>} The document.
     */
    async connect(join, deliver) { return this.hub.join(join, deliver); }

    /**
     * Submits a change.
     * @param {object} message - The change.
     */
    submit(message) { this.hub.submit(webexpress.webui.Ot.clone(message)); }

    /**
     * Relays a selection.
     * @param {object} message - The presence.
     */
    presence(message) { this.hub.presence(webexpress.webui.Ot.clone(message)); }

    /**
     * Leaves the hub.
     * @param {string} client - The client id.
     */
    disconnect(client) { this.hub.leave(client); }
};

/**
 * The client side of sharing through a provider. It keeps the classic client state of
 * operational transformation: the version it has seen, the change in flight and the changes
 * buffered behind it. Local changes show at once (optimistic) and are sent one at a time; a
 * change from someone else is transformed past the own unacknowledged ones before it applies.
 */
webexpress.webui.SpreadsheetCollaboration = class {
    /**
     * Initializes a new instance of the class.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     * @param {webexpress.webui.SpreadsheetCollaborationProvider} provider - The provider.
     * @param {object} [options] - { user: { id, name, color }, client }.
     */
    constructor(ctrl, provider, options = {}) {
        this.ctrl = ctrl; this.provider = provider;
        const random = Math.random().toString(36).slice(2, 10);
        this.client = options.client ?? "c" + random;
        this.user = { id: options.user?.id ?? this.client, name: options.user?.name ?? this.client, color: options.user?.color ?? null };
        this.version = 0; this.inflight = null; this.buffer = [];
        this.peers = new Map();
        this.status = "offline";
    }

    /**
     * Joins the shared document and loads its state.
     * @returns {Promise<void>} Resolves once the document is shown.
     */
    async connect() {
        this.status = "connecting";
        this.ctrl.beginCollaboration({ tag: this.client.replace(/[^a-z0-9]/g, "").slice(-8) || "x" });
        const joined = await this.provider.connect({ client: this.client, user: this.user, tokens: this.ctrl.getCollaborationTokens() }, message => this._receive(message));
        this.version = joined.version;
        if (joined.tokens && !webexpress.webui.Ot.equal(webexpress.webui.Ot.expand(joined.tokens), this.ctrl._collab.state.tokens)) this.ctrl.loadCollaborationTokens(joined.tokens);
        this.status = "synced";
        this.sendPresence();
    }

    /**
     * Leaves the document; the spreadsheet continues unshared.
     */
    disconnect() {
        if (this.status === "offline") return;
        this.status = "offline";
        this.provider.disconnect(this.client);
        this.peers.clear();
        this.ctrl._renderPresence?.();
        this.ctrl.endCollaboration();
    }

    /**
     * Takes local steps: sends them, or buffers them while a change is in flight.
     * @param {Array<object>} steps - The applied steps.
     */
    local(steps) {
        if (this.status === "offline" || !steps.length) return;
        const plain = steps.map(({ removed, previous, ...step }) => step);
        if (this.inflight) { this.buffer.push(...plain); this.status = "pending"; return; }
        this._send(plain);
    }

    /**
     * Sends the local selection to the others.
     */
    sendPresence() {
        if (this.status === "offline") return;
        this.provider.presence({ client: this.client, user: this.user, selection: this.ctrl._presenceSelection() });
    }

    /**
     * Sends a change.
     * @param {Array<object>} steps - The steps.
     */
    _send(steps) {
        this.inflight = steps; this.status = "pending";
        this.provider.submit({ client: this.client, version: this.version, steps });
    }

    /**
     * Handles a message of the provider.
     * @param {object} message - The message.
     */
    _receive(message) {
        const Ot = webexpress.webui.Ot;
        if (this.status === "offline") return;
        switch (message.type) {
            case "ack":
                this.version = message.version; this.inflight = null;
                if (this.buffer.length) this._send(this.buffer.splice(0));
                else this.status = "synced";
                break;
            case "op": {
                let remote = message.steps;
                // the sequenced change came first, so it wins ties against the own pending ones
                if (this.inflight) [remote, this.inflight] = Ot.transform(remote, this.inflight, true);
                if (this.buffer.length) [remote, this.buffer] = Ot.transform(remote, this.buffer, true);
                this.version = message.version;
                if (!this.ctrl.applyRemoteSteps(remote, { user: message.user, client: message.client })) this._resync();
                break;
            }
            case "presence":
                this.peers.set(message.client, { user: message.user ?? { id: message.client, name: message.client }, selection: message.selection });
                this.ctrl._renderPresence?.();
                this.ctrl._dispatch(webexpress.webui.Event.SPREADSHEET_PRESENCE_EVENT, { client: message.client, user: message.user, selection: this.ctrl._collab ? this.ctrl._collab.state.decodeSelection(message.selection) : null });
                break;
            case "leave":
                this.peers.delete(message.client);
                this.ctrl._renderPresence?.();
                break;
            case "reset":
                this._reset(message);
                break;
        }
    }

    /**
     * Starts over from the shared state after a change was refused; the own unsent changes are
     * reported as a conflict, because the merge could not keep them.
     * @param {{version: number, tokens: Array<object>}} message - The shared state.
     */
    _reset(message) {
        const lost = !!(this.inflight || this.buffer.length);
        this.inflight = null; this.buffer = [];
        this.version = message.version;
        this.ctrl.loadCollaborationTokens(message.tokens);
        this.status = "synced";
        if (lost) this.ctrl._dispatch(webexpress.webui.Event.SPREADSHEET_CONFLICT_EVENT, { reason: "rejected" });
    }

    /**
     * Asks for the shared state again after a change could not be applied locally.
     */
    _resync() {
        const tokens = this.provider.hub?.tokens;
        if (tokens) this._reset({ version: this.provider.hub.version, tokens: webexpress.webui.Ot.compact(tokens) });
        else this.ctrl._dispatch(webexpress.webui.Event.SPREADSHEET_CONFLICT_EVENT, { reason: "resync" });
    }
};
