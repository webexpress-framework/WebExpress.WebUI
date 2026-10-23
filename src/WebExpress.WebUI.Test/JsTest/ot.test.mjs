/**
 * Unit and property tests of the transformation core (webexpress.webui.ot.js): every rule on its
 * own, the invertibility of every primitive, the structural diff and randomized TP1 checks.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webuiAsset } from "./harness.mjs";

/**
 * Loads the shipped core into a fresh context.
 * @returns {object} The Ot and OtHistory classes.
 */
export function loadOt() {
    const sandbox = vm.createContext({ webexpress: { webui: {} } });
    vm.runInContext(fs.readFileSync(webuiAsset("webexpress.webui.ot.js"), "utf8"), sandbox, { filename: "webexpress.webui.ot.js" });
    return { Ot: sandbox.webexpress.webui.Ot, OtHistory: sandbox.webexpress.webui.OtHistory };
}

const { Ot, OtHistory } = loadOt();
const json = value => JSON.parse(JSON.stringify(value));
const text = (value, m = {}) => value ? Ot.expand([{ t: "s", v: value, m }]) : [];
const plain = tokens => tokens.map(t => t.t === "c" ? t.v : t.t === "o" ? "<" + t.n + ">" : t.t === "e" ? "</" + t.n + ">" : "[" + t.n + "]").join("");
const run = (doc, steps) => Ot.apply(doc, steps).tokens;

/**
 * Checks TP1 for two concurrent sequences and returns the converged document.
 * @param {Array<object>} doc - The common base.
 * @param {Array<object>} a - The first sequence.
 * @param {Array<object>} b - The second sequence.
 * @param {boolean} aFirst - The tie-break.
 * @returns {Array<object>} The converged document.
 */
function converge(doc, a, b, aFirst = true) {
    const [a2, b2] = Ot.transform(a, b, aFirst);
    const left = run(run(doc, b), a2), right = run(run(doc, a), b2);
    assert.equal(Ot.stable(Ot.compact(left)), Ot.stable(Ot.compact(right)), "both application orders converge");
    return left;
}

test("characters, nodes and runs survive the wire format unchanged", () => {
    const tokens = [{ t: "o", n: "p", id: "n1", a: { align: "left" } }, ...text("ab", { bold: true }), ...text("😀"), { t: "l", n: "image", id: "n2", a: { src: "/x.png" } }, { t: "e", n: "p", id: "n1" }];
    assert.equal(tokens.length, 7, "a surrogate pair occupies two positions");
    const packed = Ot.compact(tokens);
    assert.equal(packed.length, 5);
    assert.equal(Ot.equal(Ot.expand(json(packed)), tokens), true);
});

for (const bad of [null, [{ t: "x" }], [{ t: "s", v: "" }], [{ t: "o", n: "p" }], [{ t: "c", v: "ab" }], [{ t: "s", v: "a", m: [] }]]) {
    test(`malformed slice ${JSON.stringify(bad)} is rejected`, () => {
        assert.throws(() => Ot.expand(bad), { name: "TypeError" });
    });
}

test("replace records the removed content and inverts exactly", () => {
    const doc = text("hello");
    const { tokens, steps } = Ot.apply(doc, [{ type: "replace", from: 1, to: 4, slice: [{ t: "s", v: "EYY", m: {} }] }]);
    assert.equal(plain(tokens), "hEYYo");
    assert.equal(steps[0].removed[0].v, "ell");
    assert.equal(plain(run(tokens, Ot.invert(steps))), "hello");
});

test("marks record previous values per run and their inverse restores them", () => {
    const doc = [...text("ab", { italic: true }), ...text("cd", { superscript: true })];
    const { tokens, steps } = Ot.apply(doc, [{ type: "addMark", from: 1, to: 4, name: "subscript", value: true }]);
    assert.equal(tokens[3].m.superscript, undefined, "an exclusive partner is removed by the same step");
    assert.equal(tokens[3].m.subscript, true);
    const back = run(tokens, Ot.invert(steps));
    assert.equal(Ot.equal(back, doc), true);
    const removed = Ot.apply(doc, [{ type: "removeMark", from: 0, to: 3, name: "italic" }]);
    assert.equal(Ot.equal(run(removed.tokens, Ot.invert(removed.steps)), doc), true);
});

test("attributes record their previous value and target nodes by position and id", () => {
    const doc = [{ t: "o", n: "td", id: "n1", a: {} }, ...text("x"), { t: "e", n: "td", id: "n1" }];
    const { tokens, steps } = Ot.apply(doc, [{ type: "setAttr", pos: 0, id: "n1", key: "background", value: "#ff0000" }]);
    assert.equal(tokens[0].a.background, "#ff0000");
    assert.equal(Ot.equal(run(tokens, Ot.invert(steps)), doc), true);
    assert.throws(() => Ot.apply(doc, [{ type: "setAttr", pos: 0, id: "n9", key: "k", value: 1 }]), { name: "RangeError" });
    assert.throws(() => Ot.apply(doc, [{ type: "setAttr", pos: 1, key: "k", value: 1 }]), { name: "RangeError" });
});

test("out-of-range steps are rejected instead of clamped", () => {
    const doc = text("abc");
    for (const step of [{ type: "replace", from: 2, to: 9, slice: [] }, { type: "replace", from: 3, to: 2, slice: [] }, { type: "addMark", from: -1, to: 2, name: "bold", value: true }, { type: "setAttr", pos: 3, key: "x", value: 1 }]) {
        assert.throws(() => Ot.apply(doc, [step]), { name: "RangeError" });
    }
    assert.throws(() => Ot.apply(doc, [{ type: "explode" }]), { name: "TypeError" });
});

test("concurrent insertions at one position are ordered by the fixed priority", () => {
    const doc = text("ab");
    const a = [{ type: "replace", from: 1, to: 1, slice: [{ t: "s", v: "X", m: {} }] }];
    const b = [{ type: "replace", from: 1, to: 1, slice: [{ t: "s", v: "Y", m: {} }] }];
    assert.equal(plain(converge(doc, a, b, true)), "aXYb");
    assert.equal(plain(converge(doc, a, b, false)), "aYXb");
});

test("typing inside a range another user deletes survives at the deletion point", () => {
    const doc = text("abcdef");
    const typing = [{ type: "replace", from: 3, to: 3, slice: [{ t: "s", v: "X", m: {} }] }];
    const deletion = [{ type: "replace", from: 1, to: 5, slice: [] }];
    assert.equal(plain(converge(doc, typing, deletion)), "aXf");
    assert.equal(plain(converge(doc, deletion, typing)), "aXf");
});

test("overlapping deletions remove the union exactly once", () => {
    const doc = text("abcdefgh");
    assert.equal(plain(converge(doc, [{ type: "replace", from: 1, to: 5, slice: [] }], [{ type: "replace", from: 3, to: 7, slice: [] }])), "ah");
});

test("two replacements of the same selection keep both new texts", () => {
    const doc = text("abc");
    const a = [{ type: "replace", from: 0, to: 3, slice: [{ t: "s", v: "X", m: {} }] }];
    const b = [{ type: "replace", from: 0, to: 3, slice: [{ t: "s", v: "Y", m: {} }] }];
    assert.equal(plain(converge(doc, a, b, true)), "XY");
});

test("formatting a range does not extend to text concurrently typed inside it", () => {
    const doc = text("abcd");
    const bold = [{ type: "addMark", from: 0, to: 4, name: "bold", value: true }];
    const typing = [{ type: "replace", from: 2, to: 2, slice: [{ t: "s", v: "X", m: {} }] }];
    const result = converge(doc, bold, typing);
    assert.deepEqual(json(result.map(t => !!t.m.bold)), [true, true, false, true, true]);
});

test("conflicting formatting resolves by priority on the overlap only", () => {
    const doc = text("abcdef");
    const red = [{ type: "addMark", from: 0, to: 4, name: "color", value: "red" }];
    const blue = [{ type: "addMark", from: 2, to: 6, name: "color", value: "blue" }];
    assert.deepEqual(json(converge(doc, red, blue, true).map(t => t.m.color)), ["red", "red", "red", "red", "blue", "blue"]);
    assert.deepEqual(json(converge(doc, red, blue, false).map(t => t.m.color)), ["red", "red", "blue", "blue", "blue", "blue"]);
});

test("exclusive marks never end up together", () => {
    const doc = text("abcd");
    const sub = [{ type: "addMark", from: 0, to: 3, name: "subscript", value: true }];
    const sup = [{ type: "addMark", from: 1, to: 4, name: "superscript", value: true }];
    for (const order of [true, false]) {
        const result = converge(doc, sub, sup, order);
        assert.equal(result.some(t => t.m.subscript && t.m.superscript), false);
    }
    converge(doc, sub, [{ type: "removeMark", from: 1, to: 4, name: "superscript" }], false);
});

test("an attribute change on a deleted node is dropped and concurrent ones resolve by priority", () => {
    const doc = [{ t: "o", n: "p", id: "n1", a: {} }, ...text("x"), { t: "e", n: "p", id: "n1" }];
    const align = [{ type: "setAttr", pos: 0, id: "n1", key: "align", value: "center" }];
    const remove = [{ type: "replace", from: 0, to: 3, slice: [] }];
    assert.equal(converge(doc, align, remove).length, 0);
    const right = [{ type: "setAttr", pos: 0, id: "n1", key: "align", value: "right" }];
    assert.equal(converge(doc, align, right, true)[0].a.align, "center");
    assert.equal(converge(doc, align, right, false)[0].a.align, "right");
    const insert = [{ type: "replace", from: 0, to: 0, slice: [{ t: "o", n: "p", id: "n2", a: {} }, { t: "e", n: "p", id: "n2" }] }];
    assert.equal(converge(doc, align, insert)[2].a.align, "center", "the target follows content inserted before it");
});

test("positions map through replacements with an explicit side", () => {
    const steps = [{ type: "replace", from: 2, to: 2, slice: [{ t: "s", v: "XYZ", m: {} }] }];
    assert.equal(Ot.map(2, steps, -1), 2);
    assert.equal(Ot.map(2, steps, 1), 5);
    assert.equal(Ot.map(4, steps), 7);
    const deletion = [{ type: "replace", from: 2, to: 6, slice: [] }];
    assert.equal(Ot.map(4, deletion), 2);
    assert.equal(Ot.map(8, deletion), 4);
    assert.deepEqual(json(Ot.mapSelection({ anchor: 6, focus: 1 }, [{ type: "replace", from: 3, to: 3, slice: [{ t: "s", v: "ab", m: {} }] }])), { anchor: 8, focus: 1 });
});

test("the diff matches structure by identity and emits only what changed", () => {
    const li = (id, value) => [{ t: "o", n: "li", id, a: {} }, { t: "o", n: "p", id: id + "p", a: {} }, ...text(value), { t: "e", n: "p", id: id + "p" }, { t: "e", n: "li", id }];
    const before = [{ t: "o", n: "ul", id: "u", a: {} }, ...li("a", "one"), ...li("b", "two"), { t: "e", n: "ul", id: "u" }];
    // indenting item b nests it into a list inside item a
    const after = [{ t: "o", n: "ul", id: "u", a: {} }, ...li("a", "one").slice(0, -1), { t: "o", n: "ul", id: "u2", a: {} }, ...li("b", "two"), { t: "e", n: "ul", id: "u2" }, { t: "e", n: "li", id: "a" }, { t: "e", n: "ul", id: "u" }];
    const steps = Ot.diff(before, after);
    assert.equal(Ot.equal(run(before, steps), after), true);
    assert.equal(steps.every(s => s.type === "replace" && Ot.size(s.slice) <= 3 && s.to - s.from <= 1), true, "the moved item's content is not replaced");
    const typing = [{ type: "replace", from: 12, to: 12, slice: [{ t: "s", v: "!", m: {} }] }];
    assert.match(plain(converge(before, steps, typing)), /tw!o|two!/);
});

test("the diff expresses formatting and attribute changes as their own primitives", () => {
    const before = [{ t: "o", n: "p", id: "n1", a: {} }, ...text("abcd"), { t: "e", n: "p", id: "n1" }];
    const after = [{ t: "o", n: "p", id: "n1", a: { align: "center" } }, ...text("a"), ...text("bc", { bold: true }), ...text("d"), { t: "e", n: "p", id: "n1" }];
    const steps = Ot.diff(before, after);
    assert.deepEqual(json(steps.map(s => s.type).sort()), ["addMark", "setAttr"]);
    assert.equal(Ot.equal(run(before, steps), after), true);
});

test("the diff falls back to one replacement beyond its search bound", () => {
    const before = text("a".repeat(50)), after = text("b".repeat(50));
    const saved = Ot.MAX_DIFF; Ot.MAX_DIFF = 5;
    try {
        const steps = Ot.diff(before, after);
        assert.equal(steps.length, 1);
        assert.equal(Ot.equal(run(before, steps), after), true);
    } finally { Ot.MAX_DIFF = saved; }
});

/**
 * A deterministic pseudo random generator, so a failing seed reproduces.
 * @param {number} seed - The seed.
 * @returns {Function} A function returning numbers in [0, 1).
 */
export function random(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/**
 * Generates a random step sequence that is valid for a document.
 * @param {Function} rnd - The random source.
 * @param {Array<object>} doc - The document.
 * @param {string} tag - Distinguishes inserted ids per client.
 * @returns {Array<object>} The steps.
 */
export function randomSteps(rnd, doc, tag) {
    const steps = [];
    let current = doc;
    const count = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < count; i++) {
        const len = current.length, pick = rnd();
        const from = Math.floor(rnd() * (len + 1)), to = Math.min(len, from + Math.floor(rnd() * 4));
        let step;
        if (pick < 0.45) step = { type: "replace", from, to: rnd() < 0.5 ? from : to, slice: rnd() < 0.8 ? [{ t: "s", v: "xyz".slice(0, 1 + Math.floor(rnd() * 3)) + tag, m: {} }] : [{ t: "l", n: "image", id: tag + i + Math.floor(rnd() * 1e6), a: {} }] };
        else if (pick < 0.6) step = { type: "replace", from, to, slice: [] };
        else if (pick < 0.85) step = rnd() < 0.7
            ? { type: "addMark", from, to, name: ["bold", "color", "subscript", "superscript"][Math.floor(rnd() * 4)], value: rnd() < 0.5 ? true : "v" + tag }
            : { type: "removeMark", from, to, name: ["bold", "color", "subscript"][Math.floor(rnd() * 3)] };
        else {
            const nodes = current.map((t, p) => t.t === "l" ? p : -1).filter(p => p >= 0);
            if (!nodes.length) continue;
            step = { type: "setAttr", pos: nodes[Math.floor(rnd() * nodes.length)], key: ["a", "b"][Math.floor(rnd() * 2)], value: rnd() < 0.8 ? tag : null };
        }
        steps.push(step);
        current = run(current, [step]);
    }
    return steps;
}

test("randomized concurrent sequences converge in both orders (TP1)", () => {
    const rnd = random(20261019);
    for (let i = 0; i < 3000; i++) {
        const doc = [...text("abcdef".slice(0, Math.floor(rnd() * 7))), { t: "l", n: "image", id: "base", a: {} }, ...text("gh")];
        const a = randomSteps(rnd, doc, "A"), b = randomSteps(rnd, doc, "B");
        converge(doc, a, b, rnd() < 0.5);
    }
});

test("randomized applied steps invert exactly", () => {
    const rnd = random(7);
    for (let i = 0; i < 1000; i++) {
        const doc = [...text("abcdef", { bold: true }), { t: "l", n: "image", id: "base", a: { x: 1 } }];
        const { tokens, steps } = Ot.apply(doc, randomSteps(rnd, doc, "A"));
        assert.equal(Ot.equal(run(tokens, Ot.invert(steps)), doc), true);
    }
});

test("randomized diffs reproduce the target and survive the wire", () => {
    const rnd = random(99);
    for (let i = 0; i < 1000; i++) {
        const doc = [...text("abcdef"), { t: "l", n: "image", id: "base", a: {} }, ...text("gh", { italic: true })];
        const target = run(doc, randomSteps(rnd, doc, "A"));
        const steps = json(Ot.diff(doc, target));
        assert.equal(Ot.equal(run(doc, steps), target), true);
    }
});

test("selective undo removes only the own change and keeps concurrent remote text", () => {
    let doc = text("ab");
    const history = new OtHistory({ now: () => 0 });
    const apply = steps => { const r = Ot.apply(doc, steps); doc = r.tokens; return r.steps; };
    history.record(apply([{ type: "replace", from: 1, to: 1, slice: [{ t: "s", v: "MINE", m: {} }] }]));
    const remote = apply([{ type: "replace", from: 3, to: 3, slice: [{ t: "s", v: "theirs", m: {} }] }]);
    history.remote(remote);
    assert.equal(plain(doc), "aMItheirsNEb");
    assert.equal(history.undo(apply), true);
    assert.equal(plain(doc), "atheirsb");
    assert.equal(history.redo(apply), true);
    assert.equal(plain(doc), "aMItheirsNEb", "redo reinserts around the remote text");
});

test("an undo step whose content another user removed is skipped", () => {
    let doc = text("ab");
    const history = new OtHistory({ now: () => 0 });
    const apply = steps => { const r = Ot.apply(doc, steps); if (Ot.equal(r.tokens, doc)) return null; doc = r.tokens; return r.steps; };
    history.record(apply([{ type: "replace", from: 0, to: 0, slice: [{ t: "s", v: "1", m: {} }] }]));
    history.record(apply([{ type: "replace", from: 2, to: 2, slice: [{ t: "s", v: "2", m: {} }] }]));
    history.remote(apply([{ type: "replace", from: 2, to: 3, slice: [] }]));
    assert.equal(plain(doc), "1ab");
    assert.equal(history.undo(apply), true, "the empty step is skipped and the earlier one undone");
    assert.equal(plain(doc), "ab");
});

test("typing merges into word-sized undo steps and pauses split them", () => {
    let doc = [], now = 0;
    const history = new OtHistory({ now: () => now });
    const apply = steps => { const r = Ot.apply(doc, steps); doc = r.tokens; return r.steps; };
    const type = ch => history.record(apply([{ type: "replace", from: doc.length, to: doc.length, slice: [{ t: "s", v: ch, m: {} }] }]), { kind: "typing", text: ch });
    for (const ch of "ab cd") type(ch);
    now = 5000; type("e");
    assert.equal(history._undo.length, 3);
    history.undo(apply); assert.equal(plain(doc), "ab cd");
    history.undo(apply); assert.equal(plain(doc), "ab ");
    history.undo(apply); assert.equal(plain(doc), "");
});

test("undoing a deletion right after it restores later entries exactly", () => {
    let doc = text("01234");
    const history = new OtHistory({ now: () => 0 });
    const apply = steps => { const r = Ot.apply(doc, steps); doc = r.tokens; return r.steps; };
    history.record(apply([{ type: "replace", from: 2, to: 2, slice: [{ t: "s", v: "abc", m: {} }] }]));
    history.record(apply([{ type: "replace", from: 1, to: 6, slice: [] }]));
    history.undo(apply);
    assert.equal(plain(doc), "01abc234");
    history.undo(apply);
    assert.equal(plain(doc), "01234", "the typing entry was restored, not collapsed by the deletion");
});

test("the diff places an insertion between equal characters at the hinted caret", () => {
    const before = text("<A>"), after = text("<<A>");
    assert.equal(Ot.diff(before, after)[0].from, 1, "without a hint the common prefix swallows the first character");
    assert.equal(Ot.diff(before, after, 0)[0].from, 0, "with the caret as hint the insertion is where the user typed");
    assert.equal(Ot.equal(run(before, Ot.diff(before, after, 0)), after), true);
});
