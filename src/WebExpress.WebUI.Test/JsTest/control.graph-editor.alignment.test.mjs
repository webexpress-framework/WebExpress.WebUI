/**
 * Verifies alignment through pointer gestures so snapping, guides and undo stay consistent.
 */
import { test } from "node:test";
import assert from "node:assert";
import { pointerEvent, windowListenerCount } from "./harness.mjs";
import { createEditor, renderedNodes } from "./graph.fixture.mjs";

/**
 * Sends a pointer event in graph coordinates through the current view transform.
 * @param {object} rt - The runtime.
 * @param {object} ctrl - The editor.
 * @param {string} type - The pointer event type.
 * @param {{x: number, y: number}} point - The graph position.
 */
function movePointer(rt, ctrl, type, point) {
    rt.sandbox.window.dispatchEvent(pointerEvent({
        type, clientX: point.x * ctrl._scale + ctrl._pan.x,
        clientY: point.y * ctrl._scale + ctrl._pan.y
    }));
}

for (const [alignment, factor] of [["left", -0.5], ["center", 0], ["right", 0.5]]) {
    test(`node dragging aligns ${alignment} references and can be undone`, () => {
        const { rt, ctrl } = createEditor({
            nodes: [{ id: "a", label: "A", x: 0, y: 0 }, { id: "b", label: "A wider reference", x: 500, y: 300 }],
            edges: []
        });
        const node = ctrl._nodes[0];
        const reference = ctrl._nodes[1];
        const originalX = node.x;
        const alignedX = reference.x + (reference.width - node.width) * factor;
        const target = renderedNodes(ctrl)[0];
        target.dispatchEvent(pointerEvent({ type: "pointerdown", clientX: node.x, clientY: node.y, target }));
        movePointer(rt, ctrl, "pointermove", { x: alignedX + 3, y: node.y });

        assert.equal(node.x, alignedX);
        const guide = ctrl._alignmentLayer.querySelector("line");
        assert.equal(Number(guide.getAttribute("x1")), reference.x + reference.width * factor);
        assert.equal(ctrl._model.nodes[0].x, Math.round(alignedX - node.width / 2), "the model receives the rounded aligned corner");
        movePointer(rt, ctrl, "pointerup", node);
        assert.equal(ctrl._alignmentLayer.children.length, 0, "guides last only for the gesture");
        ctrl._undo();
        assert.equal(ctrl._nodes[0].x, originalX);
        ctrl.destroy();
    });
}

test("waypoints align with neighboring edge routes at a constant screen distance", () => {
    const { rt, ctrl } = createEditor({
        nodes: [{ id: "a", x: -500, y: -300 }, { id: "b", x: 700, y: 500 }],
        edges: [
            { id: "moving", from: "a", to: "b", waypoints: [{ x: 150, y: 150 }] },
            { id: "reference", from: "a", to: "b", waypoints: [{ x: 320, y: 240 }] }
        ]
    });
    ctrl._scale = 2;
    ctrl._pan = { x: 30, y: 20 };
    ctrl._selectedEdgeId = "moving";
    ctrl.render();
    const target = ctrl._waypointLayer.children[0];
    target.dispatchEvent(pointerEvent({ type: "pointerdown", clientX: 330, clientY: 320, target }));
    movePointer(rt, ctrl, "pointermove", { x: 322.5, y: 242.5 });
    const waypoint = ctrl._model.edges[0].waypoints[0];
    assert.equal(waypoint.x, 320);
    assert.equal(waypoint.y, 240);
    assert.equal(ctrl._alignmentLayer.children.length, 2);
    movePointer(rt, ctrl, "pointermove", { x: 324, y: 244 });
    assert.equal(waypoint.x, 324, "eight screen pixels are outside the snap distance");
    assert.equal(waypoint.y, 244);
    assert.equal(ctrl._alignmentLayer.children.length, 0);
    movePointer(rt, ctrl, "pointermove", { x: 321, y: 241 });
    movePointer(rt, ctrl, "pointercancel", waypoint);
    assert.equal(ctrl._alignmentLayer.children.length, 0);
    assert.equal(ctrl._drag, null);
    ctrl.destroy();
    assert.equal(windowListenerCount(rt, "pointercancel"), 0);
});

test("alignment takes priority over the grid and isolated nodes retain grid snapping", () => {
    const { rt, ctrl } = createEditor({
        nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 303, y: 300 }],
        edges: [], dataset: { grid: "20", gridSnap: "true" }
    });
    const node = ctrl._nodes[0];
    const reference = ctrl._nodes[1];
    const target = renderedNodes(ctrl)[0];
    target.dispatchEvent(pointerEvent({ type: "pointerdown", clientX: node.x, clientY: node.y, target }));
    movePointer(rt, ctrl, "pointermove", { x: reference.x + 2, y: 101 });
    assert.equal(node.x, reference.x, "the visual reference wins even off the grid");
    movePointer(rt, ctrl, "pointermove", { x: 117 + node.width / 2, y: 117 + node.height / 2 });
    assert.equal(ctrl._model.nodes[0].x, 120);
    assert.equal(ctrl._model.nodes[0].y, 120);
    assert.equal(ctrl._alignmentLayer.children.length, 0);
    ctrl.destroy();
});
