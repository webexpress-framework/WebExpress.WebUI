/**
 * Interaction tests for the GraphEditorCtrl.
 *
 * The editor listens for keys on the window, because an SVG canvas is not
 * focused by simply pointing at it. That reach is the dangerous part: a Delete
 * pressed in an unrelated text field must not delete a node, and a page with
 * two graphs must not have both react to the same key. Those two properties are
 * asserted here rather than reasoned about, together with the keyboard editing
 * model (navigate, nudge, connect, waypoints), the undo history and the
 * teardown.
 */

import { test } from "node:test";
import assert from "node:assert";
import { windowListenerCount, elementListenerCount, keyEvent, pointerEvent } from "./harness.mjs";
import { createEditor, addEditor, renderedNodes } from "./graph.fixture.mjs";

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
 * Sends a key to the window the way a browser would, with the element that had
 * the focus as the event target.
 * @param {object} rt - The runtime.
 * @param {string} key - The key value.
 * @param {object} target - The focused element.
 * @param {object} [init] - Further event fields.
 * @returns {object} The dispatched event.
 */
function pressKey(rt, key, target, init = {}) {
    const event = keyEvent(key, { ...init, target });
    rt.sandbox.window.dispatchEvent(event);
    return event;
}

test("Delete in a foreign input leaves the graph untouched", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    ctrl._selectedNodeId = "draft";
    ctrl._updateToolbarState();

    const foreignInput = rt.document.createElement("input");
    rt.document.body.appendChild(foreignInput);

    pressKey(rt, "Delete", foreignInput);

    assert.equal(ctrl._model.nodes.length, 3, "no node was deleted");
    assert.equal(ctrl._model.edges.length, 2, "no edge was deleted");
    assert.equal(ctrl._element.querySelector(".wx-graph-modal-backdrop"), null,
        "no confirmation dialog was opened");
});

test("Ctrl+Z in a foreign input leaves the graph untouched", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    // give the history something to undo
    ctrl._selectedNodeId = "draft";
    ctrl._deleteSelected();
    assert.equal(ctrl._model.nodes.length, 2, "the node was deleted");

    const foreignInput = rt.document.createElement("textarea");
    rt.document.body.appendChild(foreignInput);

    const event = pressKey(rt, "z", foreignInput, { ctrlKey: true });

    assert.equal(ctrl._model.nodes.length, 2, "the undo did not run");
    assert.equal(event.defaultPrevented, false, "the field keeps its own undo");
});

test("a key press inside the editor's own properties field is left to that field", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    // a field rendered inside the editor host, as the workflow properties
    // panel does it
    const ownInput = rt.document.createElement("input");
    ctrl._element.appendChild(ownInput);
    ctrl._selectedNodeId = "draft";

    pressKey(rt, "Delete", ownInput);

    assert.equal(ctrl._model.nodes.length, 3, "editing a label does not delete the state");
});

test("Delete on the focused canvas removes the selected edge", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    ctrl._selectedEdgeId = "e1";
    ctrl._updateToolbarState();

    pressKey(rt, "Delete", ctrl._svg);

    assert.equal(ctrl._model.edges.length, 1, "the selected edge is gone");
    assert.equal(ctrl._model.edges[0].id, "e2");
});

test("only the graph the key was pressed in reacts", () => {
    const { rt, ctrl: first } = createEditor(GRAPH);
    const { ctrl: second } = addEditor(rt, GRAPH);

    first._selectedEdgeId = "e1";
    second._selectedEdgeId = "e1";

    pressKey(rt, "Delete", second._svg);

    assert.equal(first._model.edges.length, 2, "the untouched graph keeps its edges");
    assert.equal(second._model.edges.length, 1, "the focused graph deleted its edge");
});

test("a torn down editor ignores keys that are still flying", () => {
    const { rt, ctrl } = createEditor(GRAPH);
    const svg = ctrl._svg;

    ctrl._selectedEdgeId = "e1";
    ctrl.destroy();

    pressKey(rt, "Delete", svg);

    assert.equal(ctrl._model.edges.length, 2, "the model is untouched after the teardown");
});

test("the arrow keys walk the selection between nodes", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    pressKey(rt, "ArrowRight", ctrl._svg);
    assert.equal(ctrl._selectedNodeId, "draft", "the first arrow enters the graph");

    pressKey(rt, "ArrowRight", ctrl._svg);
    assert.equal(ctrl._selectedNodeId, "review", "the next node to the right is selected");

    pressKey(rt, "ArrowDown", ctrl._svg);
    assert.equal(ctrl._selectedNodeId, "done", "the node below is selected");

    pressKey(rt, "ArrowUp", ctrl._svg);
    assert.equal(ctrl._selectedNodeId, "review", "the node above is selected again");
});

test("Alt and an arrow move the selected node and can be undone in one step", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    ctrl._selectedNodeId = "draft";
    const before = ctrl._nodes.find((n) => n.id === "draft").x;

    pressKey(rt, "ArrowRight", ctrl._svg, { altKey: true });

    const moved = ctrl._nodes.find((n) => n.id === "draft");
    assert.equal(moved.x, before + ctrl.constructor.NUDGE_STEP, "the node moved by one step");
    assert.equal(ctrl._model.nodes.find((n) => n.id === "draft").x, moved.x - moved.width / 2,
        "the model followed, converted back to its top left coordinate space");

    ctrl._undo();
    assert.equal(ctrl._nodes.find((n) => n.id === "draft").x, before, "the undo restored the position");
});

test("Shift narrows the nudge to a single unit", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    ctrl._selectedNodeId = "draft";
    const before = ctrl._nodes.find((n) => n.id === "draft").y;

    pressKey(rt, "ArrowDown", ctrl._svg, { altKey: true, shiftKey: true });

    assert.equal(ctrl._nodes.find((n) => n.id === "draft").y, before + 1);
});

test("an edge can be created entirely from the keyboard", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    ctrl._selectedNodeId = "draft";
    pressKey(rt, "Enter", ctrl._svg, { ctrlKey: true });
    assert.ok(ctrl._isAddEdgeMode, "the editor waits for a target");
    assert.equal(ctrl._edgeSourceNode, "draft");

    pressKey(rt, "ArrowDown", ctrl._svg);
    assert.equal(ctrl._selectedNodeId, "done", "the target is picked with the arrows");

    pressKey(rt, "Enter", ctrl._svg);

    assert.equal(ctrl._model.edges.length, 3, "the edge was created");
    const created = ctrl._model.edges[2];
    assert.equal(created.from, "draft");
    assert.equal(created.to, "done");
    assert.equal(ctrl._isAddEdgeMode, false, "the mode ends with the edge");
});

test("Escape abandons a pending edge without creating it", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    ctrl._selectedNodeId = "draft";
    pressKey(rt, "Enter", ctrl._svg, { ctrlKey: true });
    pressKey(rt, "Escape", ctrl._svg);

    assert.equal(ctrl._isAddEdgeMode, false, "the mode is off");
    assert.equal(ctrl._edgeSourceNode, null, "the pending source is dropped");
    assert.equal(ctrl._model.edges.length, 2, "no edge was created");
});

test("Insert adds a waypoint to the selected edge and Delete removes only that waypoint", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    ctrl._selectedEdgeId = "e1";
    ctrl.render();

    pressKey(rt, "Insert", ctrl._svg);

    const edge = ctrl._model.edges.find((e) => e.id === "e1");
    assert.equal(edge.waypoints.length, 1, "a waypoint was inserted");
    assert.equal(ctrl._selectedWaypointIndex, 0, "the new waypoint is selected");

    const before = { ...edge.waypoints[0] };
    pressKey(rt, "ArrowDown", ctrl._svg, { altKey: true });
    assert.equal(edge.waypoints[0].y, before.y + ctrl.constructor.NUDGE_STEP,
        "Alt and an arrow move the waypoint");

    pressKey(rt, "Delete", ctrl._svg);
    assert.equal(edge.waypoints.length, 0, "the waypoint is gone");
    assert.equal(ctrl._model.edges.length, 2, "the edge itself survived");
    assert.equal(ctrl._selectedWaypointIndex, null, "no waypoint stays selected");
});

test("the arrows walk the waypoints of the selected edge", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    const edge = ctrl._model.edges.find((e) => e.id === "e1");
    edge.waypoints = [{ x: 100, y: 20 }, { x: 200, y: 40 }];
    ctrl._selectedEdgeId = "e1";
    ctrl._selectedWaypointIndex = 0;

    pressKey(rt, "ArrowRight", ctrl._svg);
    assert.equal(ctrl._selectedWaypointIndex, 1, "the next waypoint is selected");

    pressKey(rt, "ArrowRight", ctrl._svg);
    assert.equal(ctrl._selectedWaypointIndex, 0, "the walk wraps around");
});

test("a position survives a round trip through the model unchanged", () => {
    const { ctrl } = createEditor(GRAPH);

    // the model stores top left corners and the simulation works with centres;
    // if the conversion is skipped in either direction the node creeps by half
    // its size on every save, undo or reload
    const before = ctrl._nodes.map((n) => `${n.id}:${n.x}:${n.y}`);

    ctrl._syncModelPositions();
    ctrl._buildPhysics();

    assert.deepEqual(ctrl._nodes.map((n) => `${n.id}:${n.x}:${n.y}`), before,
        "writing the model and rebuilding from it is a no-op");

    assert.equal(ctrl._model.nodes[0].x, 0, "the model keeps the authored top left corner");
    assert.equal(ctrl._model.nodes[0].y, 0);
});

test("undo drops a selection the restored model no longer contains", () => {
    const { ctrl } = createEditor(GRAPH);

    ctrl._addNode();
    const added = ctrl._selectedNodeId;
    assert.ok(added, "the new node is selected");

    ctrl._undo();

    assert.equal(ctrl._model.nodes.some((n) => n.id === added), false, "the node is gone");
    assert.equal(ctrl._selectedNodeId, null, "the selection does not point at it any more");
});

test("undo drops a selected edge the restored model no longer contains", () => {
    const { ctrl } = createEditor(GRAPH);

    ctrl._createEdgeAndEmit("draft", "done");
    const added = ctrl._selectedEdgeId;

    ctrl._undo();

    assert.equal(ctrl._model.edges.some((e) => e.id === added), false, "the edge is gone");
    assert.equal(ctrl._selectedEdgeId, null, "the selection was cleared");
});

test("the undo history never grows past its limit", () => {
    const { ctrl } = createEditor(GRAPH);
    const limit = ctrl.constructor.HISTORY_LIMIT;

    for (let i = 0; i < limit * 2; i++) {
        ctrl._saveStateToHistory();
    }

    assert.equal(ctrl._undoStack.length, limit, "the stack is capped at the limit");
});

test("the stroke pattern is picked from drawn samples", () => {
    const { ctrl } = createEditor(GRAPH);

    const picked = [];
    const picker = ctrl._buildDashPicker("6 3", "#ff0000", (value) => picked.push(value));

    const options = picker.querySelectorAll(".wx-graph-dash-option");
    assert.equal(options.length, ctrl.constructor.DASH_PATTERNS.length, "every pattern is offered");

    // each option shows what the line will look like rather than its numbers
    const sample = options[0].querySelector("line");
    assert.ok(sample, "the option draws a sample line");
    assert.equal(sample.getAttribute("stroke"), "#ff0000", "the sample uses the edge colour");

    const active = options.filter((o) => o.classList.contains("is-active"));
    assert.equal(active.length, 1, "exactly the current pattern is marked");
    assert.equal(active[0].dataset.dash, "6 3", "the current pattern is the marked one");

    options[2].dispatchEvent({ type: "click", stopPropagation() { } });

    assert.deepEqual(picked, [options[2].dataset.dash], "picking reports the new pattern");
    assert.equal(options[2].getAttribute("aria-checked"), "true", "the selection moves");
    assert.equal(options[0].getAttribute("aria-checked"), "false");
});

test("the toolbar carries no view actions", () => {
    const { ctrl } = createEditor(GRAPH);

    const ids = ctrl._toolbarContainer.children
        .filter((c) => String(c.tagName).toUpperCase() === "BUTTON")
        .map((c) => c.id);

    assert.ok(!ids.includes("btn-fit"), "fitting lives on the canvas, not in the toolbar");
    assert.ok(ids.includes("btn-add-node"), "the model actions are still there");
});

test("the teardown leaves no window or canvas listener and no toolbar behind", () => {
    const { rt, ctrl, host } = createEditor(GRAPH);
    const svg = ctrl._svg;
    const toolbar = ctrl._toolbarContainer;

    assert.ok(windowListenerCount(rt, "keydown") > 0, "the editor listens for keys while alive");

    ctrl.destroy();

    assert.equal(windowListenerCount(rt, "keydown"), 0, "no key handler survives");
    assert.equal(windowListenerCount(rt, "pointerup"), 0, "no pointerup handler survives");
    assert.equal(elementListenerCount(svg, "pointermove"), 0, "no pointermove handler survives on the canvas");
    assert.equal(elementListenerCount(svg, "click"), 0, "no click handler survives on the canvas");
    assert.equal(elementListenerCount(svg, "dblclick"), 0, "no dblclick handler survives on the canvas");
    assert.equal(toolbar.parentNode, null, "the toolbar is removed");
    assert.equal(host.querySelector(".wx-graph-svg"), null, "the canvas is removed from the host");
});

test("a drag that is interrupted by a teardown strands no gesture handler", () => {
    const { rt, ctrl } = createEditor(GRAPH);
    const group = renderedNodes(ctrl)[0];

    group.dispatchEvent(pointerEvent({ type: "pointerdown", clientX: 0, clientY: 0, target: group }));
    assert.ok(windowListenerCount(rt, "pointermove") > 0, "the drag installed its handlers");

    ctrl.destroy();

    assert.equal(windowListenerCount(rt, "pointermove"), 0, "the interrupted drag left nothing behind");
});

test("clicking a node selects it and enables the editing actions", () => {
    const { ctrl } = createEditor(GRAPH);
    const group = renderedNodes(ctrl)[0];

    group.dispatchEvent({ type: "click", target: group, stopPropagation() { } });

    assert.equal(ctrl._selectedNodeId, "draft", "the node is selected");
    assert.equal(ctrl._btnDelete.disabled, false, "the delete action becomes available");
    assert.equal(ctrl._btnEdit.disabled, false, "the edit action becomes available");
});

test("deleting a node takes its edges with it", () => {
    const { ctrl } = createEditor(GRAPH);

    ctrl._selectedNodeId = "review";
    ctrl._deleteSelected();

    assert.equal(ctrl._model.nodes.length, 2, "the node is gone");
    assert.equal(ctrl._model.edges.length, 0, "both edges touching it are gone");
});

test("zoom shortcuts scale the view and the fit shortcut resets it", () => {
    const { rt, ctrl } = createEditor(GRAPH);

    const initial = ctrl._scale;
    pressKey(rt, "+", ctrl._svg);
    const zoomedIn = ctrl._scale;
    assert.ok(zoomedIn > initial, "plus zooms in");

    pressKey(rt, "-", ctrl._svg);
    assert.ok(ctrl._scale < zoomedIn, "minus zooms back out");

    ctrl._scale = 2.5;
    pressKey(rt, "0", ctrl._svg);
    assert.notEqual(ctrl._scale, 2.5, "zero fits the content again");
});
