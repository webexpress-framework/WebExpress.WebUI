import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webuiAsset } from "./harness.mjs";

function model() {
    const sandbox = vm.createContext({ webexpress: { webui: {} }, Intl });
    vm.runInContext(fs.readFileSync(webuiAsset("webexpress.webui.editor.model.js"), "utf8"), sandbox);
    return sandbox.webexpress.webui.EditorModel;
}
const text = (value, marks = {}) => ({ type: "text", text: value, marks });
const plain = state => state.doc.children[0].children[0].children.map(n => n.children.map(n => n.text || "[atom]").join("")).join("|");
function fixture(content = ["alpha"]) {
    const M = model();
    return { M, state: M.validate({ version: 1, doc: M.node("doc", content.map(t => M.node("p", [text(t)]))) }) };
}

test("model editing and validation run without document, window or native commands", () => {
    const { M, state } = fixture();
    const next = M.reduce(state, { type: "insertText", text: "X", selection: { anchor: 2, focus: 2 } });
    assert.equal(plain(next), "alXpha"); assert.equal(plain(state), "alpha"); assert.equal(next.selection.focus, 3);
});

for (const mark of ["bold", "italic", "underline", "strikethrough", "superscript", "subscript", "code"]) {
    test(`${mark} splits partial runs and toggles a mixed selection uniformly`, () => {
        const { M, state } = fixture(["abcdef"]);
        let next = M.reduce(state, { type: "format", mark, selection: { anchor: 2, focus: 4 } });
        assert.equal(next.doc.children[0].children[0].children[0].children[1].marks[mark], true);
        assert.equal(plain(next), "abcdef"); assert.equal(M.query(next, mark), true);
        next = M.reduce(next, { type: "format", mark, selection: { anchor: 1, focus: 5 } });
        assert.equal(next.doc.children[0].children[0].children[0].children[1].text, "bcde");
        next = M.reduce(next, { type: "format", mark });
        assert.equal(next.doc.children[0].children[0].children[0].children.length, 1); assert.equal(M.query(next, mark), false);
    });
}

test("clear formatting retains links and superscript/subscript are exclusive", () => {
    const { M, state } = fixture();
    state.doc.children[0].children[0].children[0].children[0].marks = { bold: true, italic: true, superscript: true, link: { href: "/safe" } };
    let next = M.reduce(state, { type: "format", mark: "subscript", selection: { anchor: 0, focus: 5 } });
    assert.equal(next.doc.children[0].children[0].children[0].children[0].marks.superscript, undefined);
    next = M.reduce(next, { type: "format", mark: "removeformat" });
    assert.deepEqual(Object.keys(next.doc.children[0].children[0].children[0].children[0].marks), ["link"]);
});

test("collapsed formatting affects subsequent typing without empty DOM wrappers", () => {
    const { M, state } = fixture();
    let next = M.reduce(state, { type: "format", mark: "bold", selection: { anchor: 5, focus: 5 } });
    assert.equal(plain(next), "alpha");
    next = M.reduce(next, { type: "insertText", text: "!" });
    assert.equal(next.doc.children[0].children[0].children[0].children[1].marks.bold, true);
    assert.equal(next.selection.focus, 6);
});

for (const value of ["😀", "e\u0301", "👨‍👩‍👧‍👦", "🇩🇪", "👍🏽"]) {
    for (const direction of [-1, 1]) test(`deletion removes one grapheme ${value} in direction ${direction}`, () => {
        const { M, state } = fixture(["a" + value + "b"]);
        const pos = direction < 0 ? 1 + value.length : 1;
        const next = M.reduce(state, { type: "delete", direction, selection: { anchor: pos, focus: pos } });
        assert.equal(plain(next), "ab"); assert.equal(next.selection.focus, 1);
    });
}

test("empty and full-range deletion keep an editable paragraph", () => {
    const { M, state } = fixture(["one", "two"]);
    const next = M.reduce(state, { type: "delete", selection: { anchor: 0, focus: M.size(state.doc) } });
    assert.equal(next.doc.children[0].children[0].children.length, 1); assert.equal(next.doc.children[0].children[0].children[0].type, "p"); assert.equal(plain(next), "");
    assert.equal(plain(M.reduce(next, { type: "delete", direction: -1 })), "");
});

test("backward selections replace text across paragraphs and retain the trailing suffix", () => {
    const { M, state } = fixture(["alpha", "beta", "gamma"]);
    const next = M.reduce(state, { type: "insertText", text: "X", selection: { anchor: 13, focus: 2 } });
    assert.equal(plain(next), "alXmma"); assert.equal(next.selection.focus, 3);
});

test("paragraph split, join and block-end boundaries preserve all text", () => {
    const { M, state } = fixture();
    let next = M.reduce(state, { type: "split", selection: { anchor: 2, focus: 2 } });
    assert.equal(plain(next), "al|pha"); assert.equal(next.selection.focus, 3);
    next = M.reduce(next, { type: "delete", direction: -1 });
    assert.equal(plain(next), "alpha"); assert.equal(next.selection.focus, 2);
});

test("a selection ending at another block's start excludes that block from formatting", () => {
    const { M, state } = fixture(["one", "two"]);
    const next = M.reduce(state, { type: "block", block: "h2", selection: { anchor: 0, focus: 4 } });
    assert.equal(next.doc.children[0].children[0].children[0].type, "h2"); assert.equal(next.doc.children[0].children[0].children[1].type, "p");
});

test("images are single units and a deletion does not consume adjacent text", () => {
    const { M, state } = fixture(["ab"]);
    let next = M.reduce(state, { type: "insertNodes", nodes: [M.node("image", [], { src: "/image.png", alt: "a" })], selection: { anchor: 1, focus: 1 } });
    assert.equal(next.selection.focus, 2);
    const before = M.clone(next);
    next = M.reduce(next, { type: "delete", direction: -1 });
    assert.equal(plain(next), "ab"); assert.equal(before.doc.children[0].children[0].children[0].children[1].type, "image");
});

test("block insertion splits a paragraph and preserves text on both sides", () => {
    const { M, state } = fixture();
    const next = M.reduce(state, { type: "insertNodes", nodes: [M.node("hr")], selection: { anchor: 2, focus: 2 } });
    assert.deepEqual(Array.from(next.doc.children[0].children[0].children, n => n.type), ["p", "hr", "p"]);
    assert.equal(next.doc.children[0].children[0].children[0].children[0].text, "al"); assert.equal(next.doc.children[0].children[0].children[2].children[0].text, "pha");
});

test("lists preserve node identities, nesting and indexed caret positions", () => {
    const { M, state } = fixture(["one", "two", "three"]);
    let next = M.reduce(state, { type: "list", command: "insertunorderedlist", selection: { anchor: 0, focus: 13 } });
    assert.equal(next.doc.children[0].children[0].children.length, 1); assert.equal(next.doc.children[0].children[0].children[0].children.length, 3);
    next = M.reduce(next, { type: "list", command: "indent", selection: { anchor: 4, focus: 7 } });
    assert.equal(next.doc.children[0].children[0].children[0].children[0].children[1].type, "ul");
    next = M.reduce(next, { type: "list", command: "outdent" });
    assert.equal(next.doc.children[0].children[0].children[0].children.length, 3); assert.equal(next.selection.focus, 7);
});

test("empty list Enter leaves the list and keeps a reachable paragraph", () => {
    const { M, state } = fixture([""]);
    let next = M.reduce(state, { type: "list", command: "insertorderedlist" });
    next = M.reduce(next, { type: "split" });
    assert.equal(next.doc.children[0].children[0].children[0].type, "p");
});

for (const url of ["javascript:alert(1)", "java\nscript:alert(1)", "data:text/html,evil", "data:image/svg+xml,evil", "vbscript:bad", "\\evil", "//evil", "file:/private"]) {
    test(`untrusted URL ${JSON.stringify(url)} never reaches link or image state`, () => {
        const { M, state } = fixture();
        const next = M.reduce(state, { type: "insertNodes", nodes: [M.node("image", [], { src: url })] });
        assert.equal(M.entries(next.doc).some(e => e.node.type === "image"), false);
        assert.equal(M.url(url), "");
    });
}

test("unknown fields, marks and active CSS are removed before renderable state exists", () => {
    const { M, state } = fixture();
    state.doc.children[0].children[0].children[0].attrs = { onclick: "alert(1)", align: "center", style: "position:fixed", background: "url(javascript:bad)" };
    state.doc.children[0].children[0].children[0].children[0].marks = { color: "expression(bad)", script: true, bold: true, font: "Arial;display:none" };
    const clean = M.validate(state);
    assert.deepEqual(Object.keys(clean.doc.children[0].children[0].children[0].attrs), ["align"]);
    assert.deepEqual(Object.keys(clean.doc.children[0].children[0].children[0].children[0].marks), ["bold"]);
});

test("unsupported versions, excessive depth and cyclic state fail before mutation", () => {
    const { M, state } = fixture();
    assert.throws(() => M.validate({ ...state, version: 2 }), /version/);
    const cycle = M.node("blockquote"); cycle.children.push(cycle); state.doc.children[0].children[0].children = [cycle];
    assert.throws(() => M.validate(state), /structural limit/);
});

test("caller mutations cannot modify a reduced document or action payload", () => {
    const { M, state } = fixture();
    const nodes = [M.node("image", [], { src: "/ok" })];
    const next = M.reduce(state, { type: "insertNodes", nodes });
    nodes[0].attrs.src = "javascript:bad";
    assert.equal(M.entries(next.doc).find(e => e.node.type === "image").node.attrs.src, "/ok");
});
