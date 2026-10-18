/**
 * Headless tests for the view of the graph controls (wx-webui-graph-viewer and
 * wx-webui-graph-editor): the canvas renders from the state, a gesture renders once per
 * animation frame while a discrete action renders at once, the viewport is state the
 * pointer math reads before the frame paints, and the editor's selection, handles and
 * dialogs are state the canvas renders.
 */
import { test } from "node:test";
import assert from "node:assert";
import { pointerEvent } from "./harness.mjs";
import { createViewer, createEditor, renderedNodes, renderedEdges } from "./graph.fixture.mjs";

const GRAPH = {
    nodes: [
        { id: "melee", label: "Mêlée", x: 0, y: 0 },
        { id: "monkey", label: "Monkey", x: 300, y: 0 },
        { id: "scabb", label: "Scabb", x: 300, y: 200 }
    ],
    edges: [
        { id: "voyage", from: "melee", to: "monkey" },
        { id: "rafting", from: "monkey", to: "scabb" }
    ]
};

/**
 * Counts the renders a control performs.
 * @param {object} ctrl - The control.
 * @returns {{count: number}} The counter.
 */
function countRenders(ctrl) {
    const counter = { count: 0 };
    const apply = ctrl._apply.bind(ctrl);
    ctrl._apply = (state) => {
        counter.count++;
        apply(state);
    };
    return counter;
}

test("the canvas is a function of the state and keeps its nodes across a drag", () => {
    const { rt, ctrl } = createViewer({ ...GRAPH, dataset: { physicsEnabled: "false" } });
    const groups = renderedNodes(ctrl).slice();
    const edges = renderedEdges(ctrl).slice();
    const before = edges[0].getAttribute("d");

    groups[0].dispatchEvent(pointerEvent({ type: "pointerdown", clientX: 0, clientY: 0, target: groups[0] }));
    rt.sandbox.window.dispatchEvent(pointerEvent({ type: "pointermove", clientX: 0, clientY: 120 }));
    rt.sandbox.window.dispatchEvent(pointerEvent({ type: "pointerup" }));
    ctrl._store.flush();

    assert.ok(renderedNodes(ctrl).every((g, i) => g === groups[i]), "the node groups are patched, not rebuilt");
    assert.equal(renderedEdges(ctrl)[0], edges[0], "and so is the edge");
    assert.notEqual(edges[0].getAttribute("d"), before, "the edge follows the node");
    assert.equal(ctrl.state.positions.melee.y, ctrl._nodes[0].y, "the state holds the position the canvas shows");
});

test("a gesture renders once per animation frame, however many moves the frame saw", () => {
    const { rt, ctrl } = createViewer({ ...GRAPH, dataset: { physicsEnabled: "false" } });
    const group = renderedNodes(ctrl)[0];
    const renders = countRenders(ctrl);

    group.dispatchEvent(pointerEvent({ type: "pointerdown", clientX: 0, clientY: 0, target: group }));
    for (let i = 1; i <= 10; i++) {
        rt.sandbox.window.dispatchEvent(pointerEvent({ type: "pointermove", clientX: i * 5, clientY: 0 }));
    }
    assert.equal(renders.count, 0, "nothing is painted between two frames");

    ctrl._store.flush();
    assert.equal(renders.count, 1, "the frame paints the last position once");
    rt.sandbox.window.dispatchEvent(pointerEvent({ type: "pointerup" }));
});

test("a discrete action renders at once", () => {
    const { ctrl } = createViewer(GRAPH);
    const renders = countRenders(ctrl);

    ctrl._model.nodes[0].label = "Mêlée Island";
    ctrl.render();

    assert.equal(renders.count, 1);
    assert.equal(renderedNodes(ctrl)[0].getAttribute("aria-label"), "Mêlée Island");
});

test("the viewport is state the pointer math reads before the frame paints it", () => {
    const { ctrl } = createViewer(GRAPH);
    const viewport = ctrl._viewport;

    ctrl._pan = { x: 40, y: 10 };
    ctrl._scale = 2;

    assert.deepEqual({ ...ctrl._toLocal({ clientX: 140, clientY: 110 }) }, { x: 50, y: 50 }, "the inverse of the new view applies at once");
    assert.notEqual(viewport.getAttribute("transform"), "translate(40 10) scale(2)", "the canvas waits for its frame");

    ctrl._store.flush();
    assert.equal(viewport.getAttribute("transform"), "translate(40 10) scale(2)");
    assert.throws(() => { ctrl._pan.x = 0; }, "the pan is changed through the view, never in place");
});

test("the simulation paints the frame it integrates", async () => {
    const { ctrl } = createViewer(GRAPH);
    ctrl.model = { nodes: [{ id: "a" }, { id: "b" }], edges: [{ id: "e", from: "a", to: "b" }] };
    const renders = countRenders(ctrl);

    await new Promise((resolve) => setTimeout(resolve, 30));

    assert.ok(renders.count > 0, "the frame loop rendered");
    const shown = renderedNodes(ctrl)[0].querySelector("rect");
    const node = ctrl._nodes[0];
    assert.equal(Number(shown.getAttribute("x")), ctrl.state.positions.a.x - node.rectWidth / 2, "the canvas shows the published position");
    ctrl.destroy();
});

test("a circular node carries the class of a circle", () => {
    const { ctrl } = createViewer({ nodes: [{ id: "o", label: "O", x: 0, y: 0, shape: "circle" }], edges: [] });

    const circle = renderedNodes(ctrl)[0].querySelector("circle");
    assert.ok(circle.getAttribute("class").includes("wx-graph-node-circle"));
    assert.ok(!circle.getAttribute("class").includes("wx-graph-node-rect"));
});

test("the editor renders its selection, the waypoints and the handles from the state", () => {
    const { ctrl } = createEditor(GRAPH);
    ctrl._model.edges[0].waypoints = [{ x: 150, y: 80 }];

    ctrl._selectedEdgeId = "voyage";
    ctrl._selectedNodeId = null;
    ctrl.render();

    assert.equal(ctrl._waypointLayer.children.length, 1, "the waypoint of the selected edge is drawn");
    assert.equal(ctrl._handleLayer.children.length, 2, "and both endpoint handles");
    assert.equal(renderedEdges(ctrl)[0].getAttribute("data-selected"), "true");

    ctrl._selectedEdgeId = null;
    ctrl._selectedNodeId = "monkey";
    ctrl.render();

    assert.equal(ctrl._waypointLayer.children.length, 0);
    assert.equal(ctrl._handleLayer.children.length, 0);
    assert.ok(renderedNodes(ctrl)[1].getAttribute("class").includes("wx-graph-node-selected"));
});

test("a double click on a node opens its properties, whose fields survive a render", () => {
    const { ctrl, host } = createEditor(GRAPH);
    const group = renderedNodes(ctrl)[1];

    group.dispatchEvent({ type: "dblclick", target: group, stopPropagation() { }, preventDefault() { } });

    const dialog = host.querySelector(".wx-graph-modal-backdrop");
    assert.ok(dialog, "the properties dialog is open");
    const input = dialog.querySelector("#inp-label");
    input.value = "Monkey Island";

    ctrl.render();
    assert.equal(dialog.querySelector("#inp-label"), input, "the field the user types in is kept");

    const apply = dialog.querySelectorAll("button").find((b) => b.textContent === "Apply");
    apply.dispatchEvent({ type: "click" });

    assert.equal(ctrl._model.nodes[1].label, "Monkey Island");
    assert.equal(host.querySelector(".wx-graph-modal-backdrop"), null, "applying closes the dialog");
});

test("the toolbar resolves every icon through the icon set", () => {
    const { ctrl } = createEditor(GRAPH);

    const icon = (id) => ctrl._toolbarContainer.querySelector("#" + id).querySelector("i").getAttribute("class");
    assert.equal(icon("btn-add-node"), ctrl._iconClass("circle-plus"));
    assert.equal(icon("btn-export"), ctrl._iconClass("file-export"));
});

test("drawing an edge previews it on the next frame and marks the target", () => {
    const { rt, ctrl } = createEditor(GRAPH);
    ctrl._toggleAddEdgeMode(true);
    ctrl._edgeSourceNode = "melee";
    ctrl.render();
    const target = ctrl._nodes.find((n) => n.id === "scabb");

    ctrl._svg.dispatchEvent(pointerEvent({ type: "pointermove", clientX: target.x, clientY: target.y }));
    assert.equal(ctrl._previewLayer.children.length, 0, "the preview waits for its frame");

    ctrl._store.flush();
    assert.equal(ctrl._previewLayer.children.length, 1, "the frame draws the preview");
    assert.ok(renderedNodes(ctrl)[2].getAttribute("class").includes("wx-graph-node-hover"));
    assert.equal(ctrl._svg.style.cursor, "crosshair");
    rt.sandbox.window.dispatchEvent(pointerEvent({ type: "pointerup" }));
});
