/**
 * The collaboration interface of the rich text editor: local changes announced as steps,
 * remote steps applied through the model, selective undo of own steps only, positions as linear
 * model positions, IME compositions shielded from remote changes, and the schema with its
 * repair rules. Without collaboration nothing of this may change the editor's behavior.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";

const STEPS = "webexpress.webui.collaboration.steps";
const json = value => JSON.parse(JSON.stringify(value));

/**
 * Loads an editor in collaborative mode and records the steps it announces.
 * @param {string} [html] - The initial content.
 * @returns {object} The runtime with the recorded steps.
 */
function shared(html = "<p>alpha</p>") {
    const r = loadEditor({ html });
    r.wx.Event.COLLABORATION_STEPS_EVENT = STEPS;
    r.announced = [];
    r.host.addEventListener(STEPS, e => r.announced.push({ steps: json(e.detail.steps) }));
    r.editor.beginCollaboration({ tag: "abc" });
    r.Ot = r.wx.Ot;
    r.text = () => r.editor.exportHtml({ layout: false });
    // a peer's insertion at a linear position, as the session would hand it over
    r.remote = (pos, text) => r.editor.applyRemoteSteps([{ type: "replace", from: pos, to: pos, slice: [{ t: "s", v: text, m: {} }] }]);
    return r;
}

test("without collaboration the editor announces no steps and keeps its snapshot history", () => {
    const r = loadEditor();
    r.wx.Event.COLLABORATION_STEPS_EVENT = STEPS;
    let announced = 0;
    r.host.addEventListener(STEPS, () => announced++);
    r.select(5); r.input("insertText", "!");
    assert.equal(announced, 0);
    assert.equal(r.editor.collaborating, false);
    assert.equal(r.editor._history._entries.length, 1);
});

test("local changes are announced as applied steps that reproduce the document", () => {
    const r = shared();
    const before = r.Ot.expand(r.editor.getCollaborationTokens());
    r.select(5); r.input("insertText", "!");
    r.select(0, 3); r.editor.execCommand("bold");
    r.select(1); r.input("insertParagraph");
    assert.equal(r.announced.length, 3);
    const steps = r.announced.flatMap(a => a.steps);
    assert.equal(r.Ot.equal(r.Ot.apply(before, steps).tokens, r.Ot.expand(r.editor.getCollaborationTokens())), true);
    assert.equal(r.announced[1].steps.every(s => s.type === "addMark"), true, "formatting travels as mark steps, not as replaced text");
});

test("remote steps change the document, keep the caret on its text and are not undoable", () => {
    const r = shared();
    r.select(3);
    // linear position 3 is "row, region, p" opened, so the text starts at 3
    assert.equal(r.remote(3, "XY"), true);
    assert.equal(r.text(), "<p>XYalpha</p>");
    assert.equal(r.editor.selection.focus, 5, "the caret stays between 'alp' and 'ha'");
    assert.equal(r.announced.length, 0, "remote changes are not announced again");
    assert.equal(r.editor._collab.history.canUndo(), false);
});

test("undo inverts only the own steps and leaves concurrent remote text in place", () => {
    const r = shared();
    r.select(5); r.input("insertText", "!");
    r.remote(3, ">");
    assert.equal(r.text(), "<p>&gt;alpha!</p>");
    r.editor.execCommand("undo");
    assert.equal(r.text(), "<p>&gt;alpha</p>");
    assert.equal(r.announced.length, 2, "the undo travels to the peers like any local change");
    r.editor.execCommand("redo");
    assert.equal(r.text(), "<p>&gt;alpha!</p>");
});

test("typing merges into word-sized undo steps", () => {
    const r = shared("<p></p>");
    r.select(0);
    for (const ch of "one two") r.input("insertText", ch);
    r.editor.execCommand("undo");
    assert.equal(r.text(), "<p>one </p>");
    r.editor.execCommand("undo");
    assert.equal(r.text(), "<p><br></p>");
});

test("an undo whose text another user deleted is skipped for the previous step", () => {
    const r = shared();
    r.select(0); r.input("insertText", "A");
    r.select(6); r.input("insertText", "B");
    r.editor._collab.history.seal();
    // the peer deletes the "B"
    r.editor.applyRemoteSteps([{ type: "replace", from: 9, to: 10, slice: [] }]);
    assert.equal(r.text(), "<p>Aalpha</p>");
    r.editor.execCommand("undo");
    assert.equal(r.text(), "<p>alpha</p>");
});

test("the selection is reported and measured as linear model positions", () => {
    const r = shared("<p>ab</p><p>cd</p>");
    r.select(3);
    assert.deepEqual(json(r.editor.getModelSelection()), { anchor: 7, focus: 7 }, "the second paragraph's text starts after its own opening");
    const Model = r.wx.EditorModel, doc = r.editor._state.doc;
    for (let caret = 0; caret < Model.size(doc); caret++) assert.equal(Model.fromLinear(doc, Model.toLinear(doc, caret)), caret);
    assert.equal(Model.fromLinear(doc, 6), 3, "a position between blocks resolves to the following text");
});

test("remote steps that arrive during an IME composition wait until it ends", () => {
    const r = shared();
    r.select(5);
    const region = r.root.querySelector(".wx-editor-region");
    r.root.dispatchEvent({ type: "compositionstart", target: region });
    assert.equal(r.remote(3, ">>"), true);
    assert.equal(r.editor._collab.queue.length, 1, "the browser owns the DOM; nothing is rendered");
    r.root.dispatchEvent({ type: "compositionend", target: region, data: "中" });
    assert.equal(r.text(), "<p>&gt;&gt;alpha中</p>", "the remote text arrived and the composition landed at its place");
});

test("steps that would break the schema are refused and leave the document untouched", () => {
    const r = shared();
    const before = r.editor.value;
    assert.equal(r.editor.applyRemoteSteps([{ type: "replace", from: 2, to: 3, slice: [] }]), false);
    assert.equal(r.editor.applyRemoteSteps([{ type: "addMark", from: 3, to: 5, name: "link", value: { href: "javascript:alert(1)", target: "" } }]), false);
    assert.equal(r.editor.value, before);
});

test("the shared state loads, checks and repairs as packed tokens", () => {
    const r = shared();
    const tokens = r.editor.getCollaborationTokens();
    assert.equal(r.editor.checkCollaborationTokens(tokens), true);
    const broken = [...tokens.slice(0, 2), { t: "s", v: "loose", m: {} }, ...tokens.slice(2)];
    assert.equal(r.editor.checkCollaborationTokens(broken), false);
    const repaired = r.editor.repairCollaborationTokens(broken);
    assert.equal(r.editor.checkCollaborationTokens(repaired), true, "inline content outside a block is wrapped into a paragraph");
    assert.equal(r.editor.loadCollaborationTokens(repaired), true);
    assert.equal(r.text(), "<p>loose</p><p>alpha</p>");
});

test("node ids minted while sharing carry the client tag", () => {
    const r = shared();
    r.select(5); r.input("insertParagraph");
    assert.ok(r.editor.getCollaborationTokens().some(t => /^n\d+-abc$/.test(t.id ?? "")));
});

test("a program loading a value into a shared document announces it without an undo step", () => {
    const r = shared();
    r.editor.value = "<p>replaced</p>";
    assert.equal(r.announced.length, 1);
    assert.equal(r.editor._collab.history.canUndo(), false);
});

test("ending the collaboration returns to the snapshot history", () => {
    const r = shared();
    r.select(5); r.input("insertText", "!");
    r.editor.endCollaboration();
    r.input("insertText", "?");
    r.editor.execCommand("undo");
    assert.equal(r.text(), "<p>alpha!</p>");
    assert.equal(r.editor.collaborating, false);
});
