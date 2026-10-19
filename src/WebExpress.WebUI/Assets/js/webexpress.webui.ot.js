/**
 * Operational transformation over documents that are addressed as one flat sequence.
 *
 * A document is linearized into tokens: a character, the opening or the closing of a structured
 * node and an atomic leaf each occupy exactly one position. Positions inside paragraphs, lists,
 * tables and inline elements are therefore plain integers, and the structure travels with the
 * content instead of being lost to a text-only view.
 *
 * Only three kinds of primitives exist: replacing a range by a structured slice (insertion,
 * deletion and every structural change), adding or removing a formatting mark over a range, and
 * setting a node attribute. Complex edits are sequences of them, so the transformation rules stay
 * a fixed small set no matter how many element types or add-ons exist; an add-on never brings
 * rules of its own.
 *
 * Every function is pure and DOM-free. The same code runs in the controls, in the tests and as
 * the reference the server's apply and validation mirror; the server itself never transforms.
 *
 * Token formats, identical in memory and on the wire except that the wire packs characters:
 * - { t: "c", v: "a", m: { ...marks } }        one UTF-16 code unit with its marks
 * - { t: "s", v: "text", m: { ...marks } }     a packed run of characters (wire and slices only)
 * - { t: "o", n: "p", id: "n1", a: { ... } }   the opening of a structured node
 * - { t: "e", n: "p", id: "n1" }               the closing of a structured node
 * - { t: "l", n: "image", id: "n2", a: { ... } } an atomic leaf
 */
webexpress.webui.Ot = class {
    /**
     * The version of the step format; a peer speaking another one must not exchange steps.
     */
    static VERSION = 1;

    /**
     * The upper bound of edit distance the structural diff searches before it falls back to
     * one replacement, which keeps a pathological edit from stalling the input thread.
     */
    static MAX_DIFF = 2000;

    /**
     * Marks that exclude each other. Adding one removes its partners in the same step, so two
     * concurrent edits can never leave both on one character.
     */
    static EXCLUSIVE = { subscript: ["superscript"], superscript: ["subscript"] };

    /**
     * Serializes a value with sorted object keys, so equal marks and attributes compare equal
     * independently of the order they were built in.
     * @param {*} value - The JSON-compatible value.
     * @returns {string} The canonical JSON text.
     */
    static stable(value) {
        if (value === undefined) return "null";
        if (value === null || typeof value !== "object") return JSON.stringify(value);
        if (Array.isArray(value)) return "[" + value.map(v => this.stable(v)).join(",") + "]";
        return "{" + Object.keys(value).filter(k => value[k] !== undefined).sort().map(k => JSON.stringify(k) + ":" + this.stable(value[k])).join(",") + "}";
    }

    /**
     * Copies a JSON-compatible value, so a step never shares mutable data with its caller.
     * @param {*} value - The value.
     * @returns {*} The copy.
     */
    static clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }

    /**
     * Determines the identity of a token for structural comparison. Marks and attributes are
     * left out on purpose: they change through their own primitives and must not turn a
     * formatting change into a replacement.
     * @param {object} token - The token.
     * @returns {string} The identity key.
     */
    static key(token) { return token.t === "c" ? token.v : token.t + "\u0000" + token.n + "\u0000" + token.id; }

    /**
     * Unpacks a wire slice into one token per position and rejects malformed input, so nothing
     * from the network reaches a document without a known shape.
     * @param {Array} slice - The packed tokens.
     * @returns {Array<object>} The tokens.
     * @throws {TypeError} If a token is malformed.
     */
    static expand(slice) {
        if (!Array.isArray(slice)) throw new TypeError("A slice must be an array of tokens.");
        const out = [];
        const plain = value => value !== null && typeof value === "object" && !Array.isArray(value);
        for (const raw of slice) {
            if (!plain(raw)) throw new TypeError("A token must be an object.");
            if (raw.t === "s" || raw.t === "c") {
                if (typeof raw.v !== "string" || !raw.v.length || raw.t === "c" && raw.v.length !== 1) throw new TypeError("A character token needs text.");
                if (raw.m !== undefined && !plain(raw.m)) throw new TypeError("Marks must be an object.");
                const marks = raw.m ?? {};
                // indexing walks UTF-16 code units; for...of would join surrogate pairs into one token
                for (let i = 0; i < raw.v.length; i++) out.push({ t: "c", v: raw.v[i], m: marks });
            } else if (raw.t === "o" || raw.t === "l" || raw.t === "e") {
                if (typeof raw.n !== "string" || !raw.n || typeof raw.id !== "string") throw new TypeError("A node token needs a type and an id.");
                if (raw.t === "e") out.push({ t: "e", n: raw.n, id: raw.id });
                else {
                    if (raw.a !== undefined && !plain(raw.a)) throw new TypeError("Attributes must be an object.");
                    out.push({ t: raw.t, n: raw.n, id: raw.id, a: raw.a ?? {} });
                }
            } else throw new TypeError("Unknown token kind.");
        }
        return out;
    }

    /**
     * Packs consecutive characters with equal marks into runs for transport and storage.
     * @param {Array<object>} tokens - The tokens.
     * @returns {Array<object>} The packed slice.
     */
    static compact(tokens) {
        const out = [];
        const memo = new Map();
        const marksKey = m => { let k = memo.get(m); if (k === undefined) { k = this.stable(m ?? {}); memo.set(m, k); } return k; };
        let run = null, runKey = null;
        for (const token of tokens) {
            if (token.t === "c") {
                const k = marksKey(token.m);
                if (run && runKey === k) { run.v += token.v; continue; }
                run = { t: "s", v: token.v, m: token.m ?? {} }; runKey = k; out.push(run);
                continue;
            }
            run = null;
            out.push(token.t === "e" ? { t: "e", n: token.n, id: token.id } : { t: token.t, n: token.n, id: token.id, a: token.a ?? {} });
        }
        return out;
    }

    /**
     * Counts the positions a slice occupies without unpacking it.
     * @param {Array<object>} slice - The packed or unpacked slice.
     * @returns {number} The number of positions.
     */
    static size(slice) { return (slice ?? []).reduce((sum, token) => sum + (token.t === "s" ? token.v.length : 1), 0); }

    /**
     * Determines whether two token sequences describe the same document.
     * @param {Array<object>} a - The first sequence.
     * @param {Array<object>} b - The second sequence.
     * @returns {boolean} True if both are equal including marks and attributes.
     */
    static equal(a, b) { return this.stable(this.compact(a)) === this.stable(this.compact(b)); }

    /**
     * Applies steps in order and records what each one replaced, so the result can be inverted
     * exactly even after the steps were transformed and their stored inverses became stale.
     * @param {Array<object>} tokens - The document; it is not modified.
     * @param {Array<object>} steps - The steps to apply.
     * @returns {{tokens: Array<object>, steps: Array<object>}} The new document and the applied steps.
     * @throws {RangeError} If a step addresses a position outside the document or a wrong node.
     */
    static apply(tokens, steps) {
        let doc = tokens.slice();
        const applied = [];
        for (const step of steps ?? []) {
            const result = this._applyStep(doc, step);
            doc = result.tokens;
            applied.push(result.step);
        }
        return { tokens: doc, steps: applied };
    }

    /**
     * Applies one primitive.
     * @param {Array<object>} doc - The working copy, owned by apply.
     * @param {object} step - The primitive.
     * @returns {{tokens: Array<object>, step: object}} The document and the recorded step.
     */
    static _applyStep(doc, step) {
        const int = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
        if (step?.type === "replace") {
            if (!int(step.from, doc.length) || !int(step.to, doc.length) || step.to < step.from) throw new RangeError("Replace range outside the document.");
            const inserted = this.expand(step.slice ?? []);
            const removed = doc.slice(step.from, step.to);
            const next = doc.length > 50000 || inserted.length > 50000
                ? doc.slice(0, step.from).concat(inserted, doc.slice(step.to))
                : (doc.splice(step.from, step.to - step.from, ...inserted), doc);
            return { tokens: next, step: { type: "replace", from: step.from, to: step.to, slice: this.compact(inserted), removed: this.compact(removed) } };
        }
        if (step?.type === "addMark" || step?.type === "removeMark") {
            if (!int(step.from, doc.length) || !int(step.to, doc.length) || step.to < step.from) throw new RangeError("Mark range outside the document.");
            if (typeof step.name !== "string" || !step.name) throw new TypeError("A mark step needs a name.");
            const adding = step.type === "addMark";
            if (adding && (step.value === undefined || step.value === null || step.value === false)) throw new TypeError("An added mark needs a value.");
            const names = [step.name, ...(adding ? this.EXCLUSIVE[step.name] ?? [] : [])];
            const previous = [];
            const value = adding ? this.clone(step.value) : undefined;
            for (let i = step.from; i < step.to; i++) {
                const token = doc[i];
                let before = null;
                if (token.t === "c") {
                    before = {};
                    const marks = { ...token.m };
                    for (const name of names) { before[name] = token.m[name] ?? null; delete marks[name]; }
                    if (adding) marks[step.name] = value;
                    doc[i] = { t: "c", v: token.v, m: marks };
                }
                const last = previous[previous.length - 1];
                if (last && this.stable(last[1]) === this.stable(before)) last[0]++;
                else previous.push([1, before]);
            }
            const recorded = { type: step.type, from: step.from, to: step.to, name: step.name, previous };
            if (adding) recorded.value = this.clone(step.value);
            return { tokens: doc, step: recorded };
        }
        if (step?.type === "setAttr") {
            if (!int(step.pos, doc.length - 1)) throw new RangeError("Attribute target outside the document.");
            if (typeof step.key !== "string" || !step.key) throw new TypeError("An attribute step needs a key.");
            const token = doc[step.pos];
            if (token.t !== "o" && token.t !== "l") throw new RangeError("Attributes belong to nodes only.");
            if (step.id != null && token.id !== step.id) throw new RangeError("Attribute target does not match the node.");
            const attrs = { ...token.a };
            const previous = attrs[step.key] === undefined ? null : this.clone(attrs[step.key]);
            if (step.value === null || step.value === undefined) delete attrs[step.key];
            else attrs[step.key] = this.clone(step.value);
            doc[step.pos] = { t: token.t, n: token.n, id: token.id, a: attrs };
            return { tokens: doc, step: { type: "setAttr", pos: step.pos, id: token.id, key: step.key, value: step.value ?? null, previous } };
        }
        throw new TypeError("Unknown step type.");
    }

    /**
     * Inverts applied steps. The inverse of a sequence undoes its last step first.
     * @param {Array<object>} applied - Steps as returned by apply, with their recorded inverses.
     * @returns {Array<object>} The inverse steps.
     */
    static invert(applied) {
        const out = [];
        for (const step of [...applied].reverse()) {
            if (step.type === "replace") {
                out.push({ type: "replace", from: step.from, to: step.from + this.size(step.slice), slice: step.removed ?? [], removed: step.slice });
            } else if (step.type === "setAttr") {
                out.push({ type: "setAttr", pos: step.pos, id: step.id, key: step.key, value: step.previous, previous: step.value });
            } else {
                let pos = step.from;
                for (const [length, before] of step.previous ?? []) {
                    if (before) {
                        // removals first, because an added mark may itself remove an exclusive partner
                        const entries = Object.entries(before).sort((a, b) => (a[1] === null ? 0 : 1) - (b[1] === null ? 0 : 1));
                        for (const [name, value] of entries) {
                            out.push(value === null
                                ? { type: "removeMark", from: pos, to: pos + length, name }
                                : { type: "addMark", from: pos, to: pos + length, name, value: this.clone(value) });
                        }
                    }
                    pos += length;
                }
            }
        }
        return out;
    }

    /**
     * Maps a position through steps.
     * @param {number} pos - The position before the steps.
     * @param {Array<object>} steps - The steps applied after the position was taken.
     * @param {number} [assoc=1] - Which side of inserted content the position sticks to: -1 stays
     * before content inserted exactly at it, 1 moves behind it.
     * @returns {number} The position after the steps.
     */
    static map(pos, steps, assoc = 1) {
        for (const step of steps ?? []) {
            if (step.type !== "replace") continue;
            const size = this.size(step.slice);
            if (pos < step.from) continue;
            if (pos > step.to) pos += size - (step.to - step.from);
            else if (pos === step.from && step.from === step.to) pos = assoc < 0 ? pos : pos + size;
            else if (pos === step.to) pos = step.from + size;
            else pos = assoc < 0 ? step.from : step.from + size;
        }
        return pos;
    }

    /**
     * Maps an anchor/focus pair through steps without letting a collapsed caret split apart.
     * @param {{anchor: number, focus: number}} selection - The selection before the steps.
     * @param {Array<object>} steps - The steps.
     * @param {number} [assoc=1] - The side a collapsed caret sticks to.
     * @returns {{anchor: number, focus: number}} The mapped selection.
     */
    static mapSelection(selection, steps, assoc = 1) {
        if (selection.anchor === selection.focus) {
            const pos = this.map(selection.anchor, steps, assoc);
            return { anchor: pos, focus: pos };
        }
        const forward = selection.anchor < selection.focus;
        // a range keeps its ends inside the content it covered, never growing over new neighbours
        const start = this.map(Math.min(selection.anchor, selection.focus), steps, 1);
        const end = Math.max(start, this.map(Math.max(selection.anchor, selection.focus), steps, -1));
        return forward ? { anchor: start, focus: end } : { anchor: end, focus: start };
    }

    /**
     * Transforms two concurrent step sequences that are based on the same document against each
     * other, so either can be applied after the other with the same result.
     * @param {Array<object>} a - The first sequence.
     * @param {Array<object>} b - The second sequence.
     * @param {boolean} aFirst - Whether a wins ties: its insertion goes first at a shared
     * position and its formatting or attribute wins where both set the same thing.
     * @returns {[Array<object>, Array<object>]} a rebased onto b, and b rebased onto a.
     */
    static transform(a, b, aFirst) {
        const [x, y] = this._xform(this._atoms(a), this._atoms(b), aFirst);
        return [this._steps(x), this._steps(y)];
    }

    /**
     * Splits steps into the atoms the rules are defined on: a replacement is a deletion followed
     * by an insertion at its start, which reduces every replacement pair to the classic list rules.
     * @param {Array<object>} steps - The steps.
     * @returns {Array<object>} The atoms.
     */
    static _atoms(steps) {
        const out = [];
        for (const step of steps ?? []) {
            if (step.type === "replace") {
                if (step.to > step.from) out.push({ k: "del", from: step.from, to: step.to });
                if (this.size(step.slice)) out.push({ k: "ins", pos: step.from, slice: step.slice, size: this.size(step.slice) });
            } else if (step.type === "addMark" || step.type === "removeMark") {
                if (step.to > step.from) out.push({ k: "mark", from: step.from, to: step.to, name: step.name, value: step.type === "addMark" ? step.value : null });
            } else if (step.type === "setAttr") {
                out.push({ k: "attr", pos: step.pos, id: step.id, key: step.key, value: step.value ?? null });
            } else throw new TypeError("Unknown step type.");
        }
        return out;
    }

    /**
     * Joins atoms back into steps; a deletion directly followed by an insertion at its start
     * becomes one replacement again.
     * @param {Array<object>} atoms - The atoms.
     * @returns {Array<object>} The steps.
     */
    static _steps(atoms) {
        const out = [];
        for (let i = 0; i < atoms.length; i++) {
            const atom = atoms[i], next = atoms[i + 1];
            if (atom.k === "del" && next?.k === "ins" && next.pos === atom.from) {
                out.push({ type: "replace", from: atom.from, to: atom.to, slice: next.slice }); i++;
            } else if (atom.k === "del") out.push({ type: "replace", from: atom.from, to: atom.to, slice: [] });
            else if (atom.k === "ins") out.push({ type: "replace", from: atom.pos, to: atom.pos, slice: atom.slice });
            else if (atom.k === "mark") out.push(atom.value === null
                ? { type: "removeMark", from: atom.from, to: atom.to, name: atom.name }
                : { type: "addMark", from: atom.from, to: atom.to, name: atom.name, value: atom.value });
            else out.push({ type: "setAttr", pos: atom.pos, id: atom.id, key: atom.key, value: atom.value });
        }
        return out;
    }

    /**
     * Transforms atom sequences by halving, which keeps the recursion depth logarithmic.
     * @param {Array<object>} a - The first atoms.
     * @param {Array<object>} b - The second atoms.
     * @param {boolean} aFirst - Whether a wins ties.
     * @returns {[Array<object>, Array<object>]} The transformed sequences.
     */
    static _xform(a, b, aFirst) {
        if (!a.length || !b.length) return [a, b];
        if (a.length === 1 && b.length === 1) return this._pair(a[0], b[0], aFirst);
        if (a.length > 1) {
            const mid = a.length >> 1;
            const [a1, b1] = this._xform(a.slice(0, mid), b, aFirst);
            const [a2, b2] = this._xform(a.slice(mid), b1, aFirst);
            return [a1.concat(a2), b2];
        }
        const mid = b.length >> 1;
        const [a1, b1] = this._xform(a, b.slice(0, mid), aFirst);
        const [a2, b2] = this._xform(a1, b.slice(mid), aFirst);
        return [a2, b1.concat(b2)];
    }

    /**
     * Determines whether two mark atoms compete for the same characters. Changes of one mark
     * always do; exclusive partners only when both add, since adding one removes the other while
     * a removal of the partner commutes with it.
     * @param {object} x - The first mark atom.
     * @param {object} y - The second mark atom.
     * @returns {boolean} True if their order matters.
     */
    static _conflict(x, y) {
        return x.name === y.name || x.value !== null && y.value !== null && (this.EXCLUSIVE[x.name] ?? []).includes(y.name);
    }

    /**
     * Maps a position through a deletion; positions inside it collapse onto its start.
     * @param {number} pos - The position.
     * @param {object} del - The deletion atom.
     * @returns {number} The mapped position.
     */
    static _throughDel(pos, del) { return pos <= del.from ? pos : pos >= del.to ? pos - (del.to - del.from) : del.from; }

    /**
     * The transformation rules for one pair of atoms. Each rule keeps the result equal in both
     * application orders (TP1), which the randomized convergence tests verify.
     * @param {object} x - The atom of the first sequence.
     * @param {object} y - The atom of the second sequence.
     * @param {boolean} xFirst - Whether x wins ties.
     * @returns {[Array<object>, Array<object>]} x rebased onto y, and y rebased onto x.
     */
    static _pair(x, y, xFirst) {
        const rank = { ins: 0, del: 1, mark: 2, attr: 3 };
        if (rank[x.k] > rank[y.k]) {
            const [b, a] = this._pair(y, x, !xFirst);
            return [a, b];
        }
        if (x.k === "ins" && y.k === "ins") {
            if (x.pos < y.pos || x.pos === y.pos && xFirst) return [[x], [{ ...y, pos: y.pos + x.size }]];
            return [[{ ...x, pos: x.pos + y.size }], [y]];
        }
        if (x.k === "ins" && y.k === "del") {
            if (x.pos <= y.from) return [[x], [{ ...y, from: y.from + x.size, to: y.to + x.size }]];
            if (x.pos >= y.to) return [[{ ...x, pos: x.pos - (y.to - y.from) }], [y]];
            // the insertion survives inside the deleted range: nobody intended to delete new text
            return [[{ ...x, pos: y.from }], [{ ...y, from: x.pos + x.size, to: y.to + x.size }, { ...y, from: y.from, to: x.pos }]];
        }
        if (x.k === "ins" && y.k === "mark") {
            if (x.pos <= y.from) return [[x], [{ ...y, from: y.from + x.size, to: y.to + x.size }]];
            if (x.pos >= y.to) return [[x], [y]];
            // content inserted inside a formatted range keeps the marks it was typed with
            return [[x], [{ ...y, to: x.pos }, { ...y, from: x.pos + x.size, to: y.to + x.size }]];
        }
        if (x.k === "ins" && y.k === "attr") {
            return [[x], [x.pos <= y.pos ? { ...y, pos: y.pos + x.size } : y]];
        }
        if (x.k === "del" && y.k === "del") {
            const a = { ...x, from: this._throughDel(x.from, y), to: this._throughDel(x.to, y) };
            const b = { ...y, from: this._throughDel(y.from, x), to: this._throughDel(y.to, x) };
            return [a.to > a.from ? [a] : [], b.to > b.from ? [b] : []];
        }
        if (x.k === "del" && y.k === "mark") {
            const b = { ...y, from: this._throughDel(y.from, x), to: this._throughDel(y.to, x) };
            return [[x], b.to > b.from ? [b] : []];
        }
        if (x.k === "del" && y.k === "attr") {
            if (y.pos >= x.from && y.pos < x.to) return [[x], []];
            return [[x], [y.pos >= x.to ? { ...y, pos: y.pos - (x.to - x.from) } : y]];
        }
        if (x.k === "mark" && y.k === "mark") {
            if (!this._conflict(x, y) || x.to <= y.from || y.to <= x.from) return [[x], [y]];
            const [win, lose] = xFirst ? [x, y] : [y, x];
            const rest = [];
            if (lose.from < win.from) rest.push({ ...lose, to: win.from });
            if (lose.to > win.to) rest.push({ ...lose, from: win.to });
            return xFirst ? [[x], rest] : [rest, [y]];
        }
        if (x.k === "mark" && y.k === "attr") return [[x], [y]];
        if (x.k === "attr" && y.k === "attr") {
            if (x.pos !== y.pos || x.key !== y.key) return [[x], [y]];
            return xFirst ? [[x], []] : [[], [y]];
        }
        throw new TypeError("Unhandled atom pair " + x.k + "/" + y.k + ".");
    }

    /**
     * Derives the steps that turn one document into another. Structure is matched by node
     * identity, so moving a list item or wrapping a paragraph touches only the tokens that
     * actually changed and concurrent typing inside the moved content survives. Marks and
     * attributes of matched tokens become mark and attribute steps.
     * @param {Array<object>} before - The previous document.
     * @param {Array<object>} after - The new document.
     * @param {number} [hint] - Where the change begins, when the caller knows it. Typing a
     * character in front of the same character can be read as an insertion before or after it;
     * both give the same document, but only the one at the caret keeps the order of concurrent
     * insertions and the positions undo and remote carets are mapped through.
     * @returns {Array<object>} Steps that turn before into after.
     */
    static diff(before, after, hint = Infinity) {
        const ka = before.map(t => this.key(t)), kb = after.map(t => this.key(t));
        let start = 0;
        const limit = Number.isFinite(hint) ? Math.max(0, hint) : Infinity;
        while (start < ka.length && start < kb.length && start < limit && ka[start] === kb[start]) start++;
        let endA = ka.length, endB = kb.length;
        while (endA > start && endB > start && ka[endA - 1] === kb[endB - 1]) { endA--; endB--; }
        const pairs = [];
        for (let i = 0; i < start; i++) pairs.push([i, i]);
        const steps = [];
        const script = endA - start + endB - start > 0 ? this._myers(ka.slice(start, endA), kb.slice(start, endB)) : [];
        let ia = start, ib = start;
        const hunk = (dels, ins) => {
            if (!dels && !ins) return;
            steps.push({ type: "replace", from: ib, to: ib + dels, slice: this.compact(after.slice(ib, ib + ins)) });
            ia += dels; ib += ins;
        };
        if (script === null) hunk(endA - start, endB - start);
        else {
            let dels = 0, ins = 0;
            for (const op of script) {
                if (op === "=") {
                    if (dels || ins) { const d = dels, n = ins; dels = 0; ins = 0; hunk(d, n); }
                    pairs.push([ia, ib]); ia++; ib++;
                } else if (op === "-") dels++;
                else ins++;
            }
            hunk(dels, ins);
        }
        for (let i = 0; i < ka.length - endA; i++) pairs.push([endA + i, endB + i]);
        return steps.concat(this._formatting(before, after, pairs));
    }

    /**
     * Emits mark and attribute steps for matched tokens, in positions of the final document.
     * Removals come first, so an added exclusive mark is never removed again behind it.
     * @param {Array<object>} before - The previous document.
     * @param {Array<object>} after - The new document.
     * @param {Array<[number, number]>} pairs - Matched positions, ascending.
     * @returns {Array<object>} The steps.
     */
    static _formatting(before, after, pairs) {
        const memo = new Map();
        const key = v => { if (v === null || typeof v !== "object") return this.stable(v ?? null); let k = memo.get(v); if (k === undefined) { k = this.stable(v); memo.set(v, k); } return k; };
        const runs = new Map(), attrs = [];
        for (const [ia, ib] of pairs) {
            const a = before[ia], b = after[ib];
            if (a.t === "c") {
                if (a.m === b.m || key(a.m) === key(b.m)) continue;
                for (const name of new Set([...Object.keys(a.m), ...Object.keys(b.m)])) {
                    const value = b.m[name] ?? null;
                    if (key(a.m[name] ?? null) === key(value)) continue;
                    const list = runs.get(name) ?? runs.set(name, []).get(name);
                    const last = list[list.length - 1];
                    if (last && last.to === ib && key(last.value) === key(value)) last.to++;
                    else list.push({ name, from: ib, to: ib + 1, value });
                }
            } else if ((a.t === "o" || a.t === "l") && key(a.a) !== key(b.a)) {
                for (const k of new Set([...Object.keys(a.a), ...Object.keys(b.a)])) {
                    if (key(a.a[k] ?? null) !== key(b.a[k] ?? null)) attrs.push({ type: "setAttr", pos: ib, id: b.id, key: k, value: b.a[k] ?? null });
                }
            }
        }
        const all = [...runs.values()].flat();
        return [
            ...all.filter(r => r.value === null).map(r => ({ type: "removeMark", from: r.from, to: r.to, name: r.name })),
            ...all.filter(r => r.value !== null).map(r => ({ type: "addMark", from: r.from, to: r.to, name: r.name, value: r.value })),
            ...attrs
        ];
    }

    /**
     * Computes a shortest edit script with Myers' algorithm.
     * @param {Array<string>} a - The previous keys.
     * @param {Array<string>} b - The new keys.
     * @returns {Array<string>|null} The script of "=", "-" and "+", or null beyond MAX_DIFF.
     */
    static _myers(a, b) {
        const n = a.length, m = b.length;
        if (!n || !m) return [...Array(n).fill("-"), ...Array(m).fill("+")];
        const maxD = Math.min(n + m, this.MAX_DIFF), offset = maxD + 1;
        const v = new Int32Array(2 * offset + 1);
        const trace = [];
        let found = -1;
        for (let d = 0; d <= maxD && found < 0; d++) {
            for (let k = -d; k <= d; k += 2) {
                let x = k === -d || k !== d && v[offset + k - 1] < v[offset + k + 1] ? v[offset + k + 1] : v[offset + k - 1] + 1;
                let y = x - k;
                while (x < n && y < m && a[x] === b[y]) { x++; y++; }
                v[offset + k] = x;
                if (x >= n && y >= m) { found = d; break; }
            }
            trace.push(v.slice(offset - d, offset + d + 1));
        }
        if (found < 0) return null;
        const out = [];
        let x = n, y = m;
        for (let d = found; d > 0; d--) {
            const prev = trace[d - 1], at = k => prev[k + d - 1];
            const k = x - y;
            const prevK = k === -d || k !== d && at(k - 1) < at(k + 1) ? k + 1 : k - 1;
            const prevX = at(prevK), prevY = prevX - prevK;
            while (x > prevX && y > prevY) { out.push("="); x--; y--; }
            out.push(prevK === k + 1 ? "+" : "-");
            x = prevX; y = prevY;
        }
        while (x > 0 && y > 0) { out.push("="); x--; y--; }
        return out.reverse();
    }
};

/**
 * Selective, operation-based undo for collaborative editing.
 *
 * A snapshot history restores whole documents and would wipe out what other users wrote in the
 * meantime. This history keeps the inverse steps of the local user's own changes and transforms
 * them against everything that happens afterwards, so undoing touches only the user's own edits.
 * When a change is undone right after it was made, the entries it had transformed are restored
 * from their saved form instead of being transformed back, because a transformation against a
 * deletion and its reinsertion would lose positions inside the deleted range.
 */
webexpress.webui.OtHistory = class {
    /**
     * The maximum number of retained undo steps.
     */
    static MAX = 100;

    /**
     * Typing pauses longer than this, in milliseconds, start a new undo step.
     */
    static PAUSE = 1000;

    /**
     * How many saved forms an entry keeps for exact restoration.
     */
    static SAVED = 50;

    /**
     * Initializes a new instance of the class.
     * @param {object} [options] - The options.
     * @param {Function} [options.now] - The clock, replaceable for deterministic tests.
     */
    constructor(options = {}) {
        this._undo = []; this._redo = []; this._change = 0;
        this._now = options.now ?? (() => Date.now());
    }

    /**
     * Determines whether an undo step exists.
     * @returns {boolean} True if undo is available.
     */
    canUndo() { return this._undo.length > 0; }

    /**
     * Determines whether a redo step exists.
     * @returns {boolean} True if redo is available.
     */
    canRedo() { return this._redo.length > 0; }

    /**
     * Discards all entries.
     */
    reset() { this._undo = []; this._redo = []; }

    /**
     * Records a local change. Consecutive typing or deletion within the pause merges into one
     * step until a word boundary is passed, so one undo takes back a word, not a character.
     * @param {Array<object>} applied - The applied steps of the change.
     * @param {object} [meta] - The change description.
     * @param {string} [meta.kind] - "typing" or "delete" to allow merging; other kinds never merge.
     * @param {string} [meta.text] - The typed text, used for word boundaries.
     */
    record(applied, meta = {}) {
        if (!applied.length) return;
        const id = ++this._change;
        const inverse = webexpress.webui.Ot.invert(applied);
        const top = this._undo[this._undo.length - 1], now = this._now();
        const text = meta.text ?? "";
        const boundary = top?.kind === "typing" && /\s$/.test(top.text) && /^\S/.test(text);
        if (meta.kind && top && top.kind === meta.kind && now - top.time <= this.constructor.PAUSE && !boundary) {
            this._rebase(applied, id, top);
            top.steps = inverse.concat(top.steps); top.time = now; top.text += text; top.sources.push(id);
        } else {
            this._rebase(applied, id, null);
            this._undo.push({ steps: inverse, kind: meta.kind ?? null, text, time: now, sources: [id], saved: [] });
            if (this._undo.length > this.constructor.MAX) this._undo.shift();
        }
        this._redo = [];
    }

    /**
     * Transforms all entries against a change that did not come from this history, such as a
     * remote operation.
     * @param {Array<object>} steps - The steps applied to the document.
     */
    remote(steps) { if (steps.length) this._rebase(steps, ++this._change, null); }

    /**
     * Ends the current merge group, for example after the caret moved.
     */
    seal() { const top = this._undo[this._undo.length - 1]; if (top) top.kind = null; }

    /**
     * Undoes the most recent own change that still has an effect; changes whose content other
     * users removed have become empty and are skipped.
     * @param {Function} apply - Applies steps to the document and returns the applied steps, or
     * null when they were rejected or had no effect.
     * @returns {boolean} True if a change was undone.
     */
    undo(apply) { return this._step(this._undo, this._redo, apply); }

    /**
     * Redoes the most recently undone change.
     * @param {Function} apply - As for undo.
     * @returns {boolean} True if a change was redone.
     */
    redo(apply) { return this._step(this._redo, this._undo, apply); }

    /**
     * Moves one entry from one stack to the other by applying it.
     * @param {Array<object>} from - The stack to take from.
     * @param {Array<object>} to - The stack to put the inverse on.
     * @param {Function} apply - Applies the steps.
     * @returns {boolean} True if an entry was applied.
     */
    _step(from, to, apply) {
        while (from.length) {
            const entry = from.pop();
            if (!entry.steps.length) continue;
            const applied = apply(entry.steps);
            if (!applied?.length) continue;
            const id = ++this._change;
            for (const other of [...this._undo, ...this._redo]) {
                // restore what this entry's own changes transformed, as long as nothing came between
                let restored = false;
                while (other.saved.length && entry.sources.includes(other.saved[other.saved.length - 1].id)) {
                    other.steps = other.saved.pop().steps; restored = true;
                }
                if (!restored) this._transform(other, applied, id);
            }
            to.push({ steps: webexpress.webui.Ot.invert(applied), kind: null, text: "", time: 0, sources: [id], saved: [] });
            return true;
        }
        return false;
    }

    /**
     * Transforms every entry except one against a change.
     * @param {Array<object>} steps - The change.
     * @param {number} id - The change id.
     * @param {object|null} except - An entry left untouched.
     */
    _rebase(steps, id, except) {
        for (const entry of [...this._undo, ...this._redo]) if (entry !== except) this._transform(entry, steps, id);
    }

    /**
     * Transforms one entry and keeps its previous form for exact restoration.
     * @param {object} entry - The entry.
     * @param {Array<object>} steps - The change.
     * @param {number} id - The change id.
     */
    _transform(entry, steps, id) {
        entry.saved.push({ id, steps: entry.steps });
        if (entry.saved.length > this.constructor.SAVED) entry.saved.shift();
        entry.steps = webexpress.webui.Ot.transform(entry.steps, steps, false)[0];
    }
};

/**
 * The schemas of the document kinds without a model of their own: plain text, as the WQL prompt
 * shares it, and graphs, as the graph editor shares them. The rich text schema lives with its
 * model (EditorModel.check). Each check has a twin on the server (PlainTextSchema, GraphSchema)
 * that must accept exactly the same documents; the cross-language fixture pins both.
 */
webexpress.webui.OtSchema = class {
    /**
     * The maximum number of characters of plain text.
     */
    static MAX_TEXT = 100000;

    /**
     * The maximum number of nodes and edges of a graph.
     */
    static MAX_GRAPH = 20000;

    /**
     * Checks plain text: unformatted characters only, without carriage returns, which the
     * controls normalize away at their input boundary.
     * @param {Array<object>} tokens - The tokens.
     * @returns {boolean} True if valid.
     */
    static checkText(tokens) {
        return tokens.length <= this.MAX_TEXT && tokens.every(t => t.t === "c" && t.v !== "\r" && (!t.m || Object.keys(t.m).length === 0));
    }

    /**
     * Repairs plain text by dropping structure, formatting and carriage returns.
     * @param {Array<object>} tokens - The tokens.
     * @returns {Array<object>} Valid tokens.
     */
    static repairText(tokens) {
        return tokens.filter(t => t.t === "c" && t.v !== "\r").slice(0, this.MAX_TEXT).map(t => ({ t: "c", v: t.v, m: {} }));
    }

    /**
     * Checks a graph: node and edge leaves with unique ids, bounded plain data as properties,
     * and every edge connecting two existing nodes.
     * @param {Array<object>} tokens - The tokens.
     * @returns {boolean} True if valid.
     */
    static checkGraph(tokens) {
        if (tokens.length > this.MAX_GRAPH) return false;
        const nodes = new Set(), edges = new Set();
        for (const token of tokens) {
            if (!this._graphItem(token)) return false;
            const ids = token.n === "node" ? nodes : edges;
            if (ids.has(token.id)) return false;
            ids.add(token.id);
        }
        return tokens.every(t => t.n !== "edge" || typeof t.a.from === "string" && nodes.has(t.a.from) && typeof t.a.to === "string" && nodes.has(t.a.to));
    }

    /**
     * Repairs a graph after concurrent changes: malformed items and repeated ids are dropped,
     * and so are edges whose node another user removed.
     * @param {Array<object>} tokens - The tokens.
     * @returns {Array<object>} Valid tokens.
     */
    static repairGraph(tokens) {
        const seen = new Set();
        const items = tokens.filter(t => this._graphItem(t) && !seen.has(t.n + "\u0000" + t.id) && seen.add(t.n + "\u0000" + t.id));
        const nodes = new Set(items.filter(t => t.n === "node").map(t => t.id));
        return items.filter(t => t.n === "node" || nodes.has(t.a.from) && nodes.has(t.a.to)).slice(0, this.MAX_GRAPH);
    }

    /**
     * Checks one graph item without its references.
     * @param {object} token - The token.
     * @returns {boolean} True if the item is well-formed.
     */
    static _graphItem(token) {
        return token?.t === "l" && (token.n === "node" || token.n === "edge") && typeof token.id === "string"
            && /^[^\u0000-\u001f]{1,200}$/.test(token.id) && this._data(token.a, 1);
    }

    /**
     * Checks that a property value is bounded plain data.
     * @param {*} value - The value.
     * @param {number} depth - The nesting depth.
     * @returns {boolean} True if allowed.
     */
    static _data(value, depth) {
        if (depth > 4) return false;
        if (value === null || typeof value === "boolean") return true;
        if (typeof value === "string") return value.length <= 10000;
        if (typeof value === "number") return Number.isFinite(value);
        if (Array.isArray(value)) return value.length <= 1000 && value.every(v => this._data(v, depth + 1));
        if (typeof value !== "object") return false;
        const entries = Object.entries(value);
        return entries.length <= 64 && entries.every(([key, v]) => /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(key) && key !== "__proto__" && this._data(v, depth + 1));
    }
};
