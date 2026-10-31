/**
 * The collaboration interface of the graph editor: committed changes become steps on node and
 * edge leaves, a moved node changes only its coordinates, remote steps arrive without being
 * undoable, concurrent structural changes are repaired by the documented rule (an edge whose
 * node was removed goes with it), and undo takes back only the own changes.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webuiAsset } from "./harness.mjs";
import { createEditor } from "./graph.fixture.mjs";

const STEPS = "webexpress.webui.collaboration.steps";
const GRAPH = {
    nodes: [
        { id: "draft", label: "Draft", x: 0, y: 0 },
        { id: "review", label: "Review", x: 300, y: 0 },
        { id: "done", label: "Done", x: 300, y: 200 }
    ],
    edges: [
        { id: "e1", from: "draft", to: "review", label: "submit" },
        { id: "e2", from: "review", to: "done", label: "approve" }
    ]
};

/**
 * Creates a shared graph editor that records the steps it announces.
 * @param {string} tag - The client tag.
 * @returns {object} The editor and its recorded steps.
 */
function shared(tag) {
    const e = createEditor(JSON.parse(JSON.stringify(GRAPH)));
    vm.runInContext(fs.readFileSync(webuiAsset("webexpress.webui.ot.js"), "utf8"), e.rt.sandbox);
    e.rt.wx.Event.COLLABORATION_STEPS_EVENT = STEPS;
    e.announced = [];
    e.host.addEventListener(STEPS, event => e.announced.push(JSON.parse(JSON.stringify(event.detail.steps))));
    e.ctrl.beginCollaboration({ tag });
    e.Ot = e.rt.wx.Ot;
    return e;
}

/**
 * Moves a node the way a finished drag commits it.
 * @param {object} ctrl - The editor.
 * @param {string} id - The node.
 * @param {number} x - The new x.
 * @param {number} y - The new y.
 */
function move(ctrl, id, x, y) {
    ctrl._saveStateToHistory();
    const node = ctrl._model.nodes.find(n => n.id === id);
    node.x = x; node.y = y;
    const placed = (ctrl._nodes || []).find(n => n.id === id);
    // the canvas keeps node centers; the model keeps corners
    if (placed) { placed.x = x + placed.width / 2; placed.y = y + placed.height / 2; }
    ctrl._emitChangeSafe();
}

test("moving a node announces only its coordinates", () => {
    const a = shared("aa"), b = shared("bb");
    b.ctrl.loadCollaborationTokens(a.ctrl.getCollaborationTokens());
    move(a.ctrl, "draft", 40, 50);
    const steps = a.announced.flat();
    assert.ok(steps.length > 0);
    assert.ok(steps.every(s => s.type === "setAttr" && ["x", "y"].includes(s.key)), "no node is replaced");
    assert.equal(b.ctrl.applyRemoteSteps(steps), true);
    assert.deepEqual([b.ctrl._model.nodes[0].x, b.ctrl._model.nodes[0].y], [40, 50]);
    assert.equal(b.ctrl._collab.history.canUndo(), false, "a remote change is not undoable");
});

test("deleting a node removes its edges on every client", () => {
    const a = shared("aa"), b = shared("bb");
    b.ctrl.loadCollaborationTokens(a.ctrl.getCollaborationTokens());
    a.ctrl._selectedNodeId = "review";
    a.ctrl._deleteSelected();
    b.ctrl.applyRemoteSteps(a.announced.flat());
    assert.deepEqual(JSON.parse(JSON.stringify(b.ctrl._model.nodes.map(n => n.id))), ["draft", "done"]);
    assert.equal(b.ctrl._model.edges.length, 0);
});

test("concurrent moves of different nodes both survive", () => {
    const a = shared("aa"), b = shared("bb");
    b.ctrl.loadCollaborationTokens(a.ctrl.getCollaborationTokens());
    move(a.ctrl, "draft", 1, 2);
    move(b.ctrl, "done", 7, 8);
    const [forA, forB] = a.Ot.transform(b.announced.flat(), a.announced.flat(), false);
    assert.equal(a.ctrl.applyRemoteSteps(forA), true);
    assert.equal(b.ctrl.applyRemoteSteps(forB), true);
    assert.equal(JSON.stringify(a.ctrl.getCollaborationTokens()), JSON.stringify(b.ctrl.getCollaborationTokens()));
    assert.equal(a.ctrl._model.nodes.find(n => n.id === "done").x, 7);
});

test("an edge to a node another user deleted is dropped by the repair rule", () => {
    const a = shared("aa"), b = shared("bb");
    b.ctrl.loadCollaborationTokens(a.ctrl.getCollaborationTokens());
    a.ctrl._selectedNodeId = "done";
    a.ctrl._deleteSelected();
    b.ctrl._model.edges.push({ id: "e3", from: "draft", to: "done", label: "skip" });
    b.ctrl._emitChangeSafe();
    const [rebased] = a.Ot.transform(b.announced.flat(), a.announced.flat(), false);
    const merged = a.Ot.apply(a.Ot.expand(a.ctrl.getCollaborationTokens()), rebased).tokens;
    assert.equal(a.ctrl.checkCollaborationTokens(a.Ot.compact(merged)), false, "the edge would dangle");
    const repaired = a.ctrl.repairCollaborationTokens(a.Ot.compact(merged));
    assert.equal(a.ctrl.loadCollaborationTokens(repaired), true);
    assert.equal(a.ctrl._model.edges.some(e => e.id === "e3"), false);
});

test("undo takes back only the own change", () => {
    const a = shared("aa"), b = shared("bb");
    b.ctrl.loadCollaborationTokens(a.ctrl.getCollaborationTokens());
    move(a.ctrl, "draft", 10, 10);
    move(b.ctrl, "done", 99, 99);
    const [forA] = a.Ot.transform(b.announced.flat(), a.announced.flat(), false);
    a.ctrl.applyRemoteSteps(forA);
    a.ctrl._undo();
    assert.equal(a.ctrl._model.nodes.find(n => n.id === "draft").x, 0, "the own move is undone");
    assert.equal(a.ctrl._model.nodes.find(n => n.id === "done").x, 99, "the other user's move stays");
    assert.equal(a.announced.length, 2, "the undo is announced like any change");
});

test("ids of new nodes and edges carry the client tag", () => {
    const a = shared("aa");
    a.ctrl._addNode();
    assert.match(a.ctrl._model.nodes.at(-1).id, /-aa$/);
    assert.match(a.ctrl._newEdgeId(), /-aa$/);
});
