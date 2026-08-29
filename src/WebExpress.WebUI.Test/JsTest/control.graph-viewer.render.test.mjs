/**
 * Render, view-transform and lifecycle tests for the GraphViewerCtrl.
 *
 * These go past the registration contract in control.graph-viewer.test.mjs:
 * they build a real model island, let the control render it and then assert on
 * the SVG it produced, on how the viewport reacts to zoom and fit, and on what
 * the teardown leaves behind. The frame loop is the part that has to be
 * observed rather than read, so it gets its own assertions: it must stop by
 * itself once the layout settles, and it must be gone after destroy.
 */

import { test } from "node:test";
import assert from "node:assert";
import { windowListenerCount, elementListenerCount, pointerEvent } from "./harness.mjs";
import {
    createViewer, renderedNodes, renderedEdges, drainFrames,
    CANVAS_WIDTH, CANVAS_HEIGHT
} from "./graph.fixture.mjs";

const TWO_NODES = {
    nodes: [
        { id: "a", label: "Alpha", x: 0, y: 0 },
        { id: "b", label: "Beta", x: 300, y: 0 }
    ],
    edges: [{ id: "e1", from: "a", to: "b", label: "goes to" }]
};

test("renders one group per node and one path per edge", () => {
    const { ctrl } = createViewer(TWO_NODES);

    const nodes = renderedNodes(ctrl);
    assert.equal(nodes.length, 2, "both nodes are rendered");
    assert.deepEqual(nodes.map((g) => g.getAttribute("data-id")), ["a", "b"]);

    const edges = renderedEdges(ctrl);
    assert.equal(edges.length, 1, "the edge is rendered as a path");
    assert.equal(edges[0].getAttribute("data-id"), "e1");
    assert.ok(edges[0].getAttribute("d").startsWith("M "), "the path carries geometry");
});

test("a node label is rendered as text and named for assistive technology", () => {
    const { ctrl } = createViewer(TWO_NODES);

    const group = renderedNodes(ctrl)[0];
    assert.equal(group.getAttribute("aria-label"), "Alpha", "the group carries an accessible name");
    assert.equal(group.getAttribute("role"), "img");

    const label = group.querySelector("text");
    assert.ok(label, "a text element is rendered");
    assert.equal(label.textContent, "Alpha");
});

test("an author-chosen colour outranks the theme default", () => {
    const { ctrl } = createViewer({
        nodes: [{ id: "a", label: "Alpha", x: 0, y: 0, foregroundColor: "#0077be", backgroundColor: "#eef6fb" }],
        edges: []
    });

    const group = renderedNodes(ctrl)[0];
    const label = group.querySelector("text");
    const shape = group.querySelector("rect");

    // the stylesheet sets a fill on .wx-graph-node-label for the dark theme, and
    // a css rule beats a fill presentation attribute - so the colour has to be
    // applied as an inline style or it is silently ignored
    assert.equal(label.style.fill, "#0077be", "the label carries the chosen text colour inline");
    assert.equal(label.getAttribute("fill"), null, "and not as an overrulable attribute");
    assert.equal(shape.style.fill, "#eef6fb", "the shape carries the chosen background inline");
});

test("clearing a colour hands the element back to the theme", () => {
    const { ctrl } = createViewer({
        nodes: [{ id: "a", label: "Alpha", x: 0, y: 0, foregroundColor: "#0077be" }],
        edges: []
    });

    ctrl._model.nodes[0].foregroundColor = "";
    ctrl._buildPhysics();
    ctrl.render();

    const label = renderedNodes(ctrl)[0].querySelector("text");
    assert.ok(!label.style.fill, "no inline colour is left behind");
    assert.equal(label.getAttribute("fill"), null, "and no attribute either");
});

test("an edge colour outranks the theme default", () => {
    const { ctrl } = createViewer({
        nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 0 }],
        edges: [{ id: "e1", from: "a", to: "b", color: "#dc3545" }]
    });

    const edge = renderedEdges(ctrl)[0];
    assert.equal(edge.style.stroke, "#dc3545", "the edge carries its colour inline");
    assert.equal(edge.getAttribute("stroke"), null, "and not as an overrulable attribute");
});

test("recolouring through the model reaches the rendered element", () => {
    const { ctrl } = createViewer({
        nodes: [{ id: "a", label: "Alpha", x: 0, y: 0 }, { id: "b", x: 300, y: 0 }],
        edges: [{ id: "e1", from: "a", to: "b" }]
    });

    ctrl._model.nodes[0].foregroundColor = "#146c43";
    ctrl._model.edges[0].color = "#b26a00";
    ctrl._updateGeometry();

    assert.equal(renderedNodes(ctrl)[0].querySelector("text").style.fill, "#146c43",
        "the geometry update repaints the label");
    assert.equal(renderedEdges(ctrl)[0].style.stroke, "#b26a00",
        "and the edge");
});

test("an image node renders an image element and an icon node a foreignObject", () => {
    const { ctrl } = createViewer({
        nodes: [
            { id: "img", label: "Picture", x: 0, y: 0, image: "/assets/state.png" },
            { id: "ico", label: "Glyph", x: 200, y: 0, icon: "fas fa-check" }
        ],
        edges: []
    });

    const groups = renderedNodes(ctrl);
    const image = groups[0].querySelector("[data-role='icon-image']");
    assert.ok(image, "the image node renders an image element");
    assert.equal(image.getAttribute("href"), "/assets/state.png");

    const icon = groups[1].querySelector("[data-role='icon-fo']");
    assert.ok(icon, "the icon node renders a foreignObject");
    assert.equal(groups[1].querySelector("[data-role='icon-image']"), null,
        "an icon node does not render an image");
});

test("the canvas is a focusable application region", () => {
    const { ctrl } = createViewer(TWO_NODES);

    assert.equal(ctrl._svg.getAttribute("tabindex"), "0", "the canvas can be reached by keyboard");
    assert.equal(ctrl._svg.getAttribute("role"), "application");
    assert.ok(ctrl._svg.getAttribute("aria-label"), "the canvas carries an accessible name");
    assert.ok(ctrl._liveRegion, "a live region accompanies the canvas");
});

test("zooming keeps the point under the pointer in place", () => {
    const { ctrl } = createViewer(TWO_NODES);

    const before = ctrl._toLocal({ clientX: 100, clientY: 250 });
    ctrl._onWheel({ deltaY: -1, clientX: 100, clientY: 250 });
    const after = ctrl._toLocal({ clientX: 100, clientY: 250 });

    assert.ok(ctrl._scale > 1, "scrolling up zooms in");
    assert.ok(Math.abs(after.x - before.x) < 1e-6, "the anchor keeps its local x");
    assert.ok(Math.abs(after.y - before.y) < 1e-6, "the anchor keeps its local y");
});

test("the zoom stays inside its bounds", () => {
    const { ctrl } = createViewer(TWO_NODES);

    for (let i = 0; i < 100; i++) {
        ctrl._zoomAt(1.5);
    }
    assert.equal(ctrl._scale, 3, "zooming in saturates at the maximum");

    for (let i = 0; i < 100; i++) {
        ctrl._zoomAt(0.5);
    }
    assert.equal(ctrl._scale, 0.3, "zooming out saturates at the minimum");
});

test("fitting the view centers the content in the canvas", () => {
    const { ctrl } = createViewer(TWO_NODES);

    ctrl._fitToView();

    const box = ctrl._computeContentBBox();
    const centerX = (box.minX + box.maxX) / 2;
    const centerY = (box.minY + box.maxY) / 2;

    assert.ok(Math.abs((centerX * ctrl._scale + ctrl._pan.x) - CANVAS_WIDTH / 2) < 1e-6,
        "the content center lands on the canvas center horizontally");
    assert.ok(Math.abs((centerY * ctrl._scale + ctrl._pan.y) - CANVAS_HEIGHT / 2) < 1e-6,
        "the content center lands on the canvas center vertically");
});

test("nodes that arrive without a position are laid out and start the simulation", () => {
    const { ctrl } = createViewer(TWO_NODES);

    // a model assigned from a REST payload is the path that carries nodes
    // without coordinates; only the simulation can place those
    ctrl.model = {
        nodes: [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }],
        edges: [{ id: "e1", from: "a", to: "b" }]
    };

    assert.ok(ctrl._physicsEnabled, "a missing position turns the simulation on");
    assert.ok(ctrl._anim !== null, "the frame loop is running");

    const positions = ctrl._nodes.map((n) => `${n.x}:${n.y}`);
    assert.equal(new Set(positions).size, 3, "the nodes are spread rather than stacked");
});

test("the simulation settles and the frame loop reports that it is done", () => {
    const { ctrl } = createViewer(TWO_NODES);
    ctrl.model = {
        nodes: [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }],
        edges: [{ id: "e1", from: "a", to: "b" }, { id: "e2", from: "b", to: "c" }]
    };

    let frames = 0;
    const limit = ctrl.constructor.MAX_SIMULATION_FRAMES;
    while (ctrl._tick() && frames < limit) {
        frames++;
    }

    assert.ok(frames < limit, `the simulation came to rest after ${frames} frames`);
    assert.equal(ctrl._tick(), false, "a settled simulation asks for no further frame");
});

test("a graph with fixed positions never starts a frame loop", () => {
    const { ctrl } = createViewer(TWO_NODES);

    assert.equal(ctrl._physicsEnabled, false, "fully placed nodes need no simulation");
    assert.equal(ctrl._anim, null, "no frame loop is scheduled");
    assert.equal(ctrl._tick(), false, "a tick reports that nothing is moving");
});

test("the running frame loop stops on teardown and schedules no further frame", async () => {
    const { rt, ctrl } = createViewer(TWO_NODES);
    ctrl.model = {
        nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
        edges: [{ id: "e1", from: "a", to: "b" }]
    };

    assert.ok(ctrl._anim !== null, "the loop is running before the teardown");

    let framesRequested = 0;
    const realRaf = rt.sandbox.window.requestAnimationFrame;
    rt.sandbox.window.requestAnimationFrame = (callback) => {
        framesRequested++;
        return realRaf(callback);
    };

    ctrl.destroy();
    await drainFrames(10);

    assert.equal(ctrl._anim, null, "the teardown cleared the frame handle");
    assert.equal(framesRequested, 0, "no frame was requested after the teardown");
});

test("the teardown leaves no listener on the window or on the canvas", () => {
    const { rt, ctrl, host } = createViewer(TWO_NODES);
    const svg = ctrl._svg;

    // a pan gesture installs the transient window handlers that a teardown in
    // mid-gesture would otherwise strand
    ctrl._beginPan(svg, pointerEvent({ clientX: 10, clientY: 10 }));
    assert.ok(windowListenerCount(rt, "pointermove") > 0, "the pan installed a move handler");

    ctrl.destroy();

    assert.equal(windowListenerCount(rt, "pointermove"), 0, "no pointermove handler survives");
    assert.equal(windowListenerCount(rt, "pointerup"), 0, "no pointerup handler survives");
    assert.equal(elementListenerCount(svg, "wheel"), 0, "no wheel handler survives on the canvas");
    assert.equal(elementListenerCount(svg, "pointerdown"), 0, "no pointerdown handler survives on the canvas");
    assert.equal(elementListenerCount(host, "contextmenu"), 0, "no context menu handler survives on the host");
    assert.equal(svg.parentNode, null, "the canvas is detached from the host");
});

test("dragging a node moves it and wakes a settled simulation", () => {
    const { rt, ctrl } = createViewer(TWO_NODES);
    const group = renderedNodes(ctrl)[0];
    const node = ctrl._nodes[0];
    const startX = node.x;
    const startY = node.y;

    group.dispatchEvent(pointerEvent({ type: "pointerdown", clientX: startX, clientY: startY, target: group }));
    assert.ok(ctrl._drag, "the drag started");
    assert.ok(ctrl._physicsEnabled, "grabbing a node turns the simulation on");

    // the gesture handlers live on the window, which is what lets a drag
    // continue outside the canvas
    rt.sandbox.window.dispatchEvent(pointerEvent({ type: "pointermove", clientX: startX + 40, clientY: startY }));

    assert.equal(ctrl._nodes[0].x, startX + 40, "the node followed the pointer");

    rt.sandbox.window.dispatchEvent(pointerEvent({ type: "pointerup" }));
    assert.equal(ctrl._drag, null, "releasing the pointer ends the drag");
});

test("replacing the model re-renders the graph", () => {
    const { ctrl } = createViewer(TWO_NODES);

    ctrl.model = {
        nodes: [{ id: "x", label: "X", x: 10, y: 10 }],
        edges: []
    };

    const nodes = renderedNodes(ctrl);
    assert.equal(nodes.length, 1, "only the new node remains");
    assert.equal(nodes[0].getAttribute("data-id"), "x");
    assert.equal(renderedEdges(ctrl).length, 0, "the old edge is gone");
});

test("an edge is routed as straight segments with rounded corners by default", () => {
    const { ctrl } = createViewer({
        nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 }],
        edges: [{ id: "e1", from: "a", to: "b", waypoints: [{ x: 200, y: 150 }] }]
    });

    const d = renderedEdges(ctrl)[0].getAttribute("d");

    // a quadratic segment rounds the corner; a cubic one would mean the whole
    // run was bent into a bezier and no longer passes through the waypoint
    assert.ok(d.includes(" Q "), "the corner is rounded with a quadratic arc");
    assert.ok(!d.includes(" C "), "the run is not turned into a bezier");
    assert.ok(d.includes(" L "), "the segments between the corners stay straight");
});

test("the edge style attribute selects the routing", () => {
    const curved = createViewer({
        dataset: { edgeStyle: "smooth" },
        nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 }],
        edges: [{ id: "e1", from: "a", to: "b", waypoints: [{ x: 200, y: 150 }] }]
    });
    assert.ok(renderedEdges(curved.ctrl)[0].getAttribute("d").includes(" C "),
        "smooth still selects the bezier routing");

    const straight = createViewer({
        dataset: { edgeStyle: "straight" },
        nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 }],
        edges: [{ id: "e1", from: "a", to: "b", waypoints: [{ x: 200, y: 150 }] }]
    });
    const d = renderedEdges(straight.ctrl)[0].getAttribute("d");
    assert.ok(!d.includes(" Q ") && !d.includes(" C "), "straight keeps the corners sharp");
});

test("the arrowhead is coloured like the edge it terminates", () => {
    const { ctrl } = createViewer({
        nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 0 }],
        edges: [{ id: "e1", from: "a", to: "b", color: "#ff6600" }]
    });

    const marker = renderedEdges(ctrl)[0].getAttribute("marker-end");
    assert.ok(marker.includes("ff6600"), "the edge points at a marker of its own colour");

    // resolve the marker the edge actually references, not just any marker
    const markerId = marker.replace(/^url\(#/, "").replace(/\)$/, "");
    const head = ctrl._svg.querySelector("#" + markerId).querySelector("path");
    assert.equal(head.getAttribute("fill"), "#ff6600", "the arrowhead carries the edge colour");
});

test("the grid stays off unless it is asked for", () => {
    const { ctrl } = createViewer(TWO_NODES);

    assert.equal(ctrl._gridSize, 0, "no grid is configured");
    assert.equal(ctrl._gridLayer.children.length, 0, "nothing is drawn");
});

test("the grid attribute turns the grid on and sets its cell size", () => {
    const defaulted = createViewer({ ...TWO_NODES, dataset: { grid: "true" } });
    assert.equal(defaulted.ctrl._gridSize, defaulted.ctrl.constructor.DEFAULT_GRID_SIZE);
    assert.ok(defaulted.ctrl._gridLayer.children.length > 0, "the grid is drawn");

    const sized = createViewer({ ...TWO_NODES, dataset: { grid: "40" } });
    assert.equal(sized.ctrl._gridSize, 40, "a number sets the cell size");

    const off = createViewer({ ...TWO_NODES, dataset: { grid: "false" } });
    assert.equal(off.ctrl._gridSize, 0, "false keeps the grid off");
});

test("snapping is opt-in and rounds to the cell size", () => {
    const { ctrl } = createViewer({ ...TWO_NODES, dataset: { grid: "20" } });
    assert.equal(ctrl._snapToGrid(37), 37, "without snapping the value passes through");

    const snapping = createViewer({ ...TWO_NODES, dataset: { grid: "20", gridSnap: "true" } });
    assert.equal(snapping.ctrl._snapToGrid(37), 40, "the value snaps to the nearest cell");
    assert.equal(snapping.ctrl._snapToGrid(-31), -40);
});

test("the view controls sit on the canvas and centre without changing the zoom", () => {
    const { ctrl, host } = createViewer(TWO_NODES);

    const controls = host.querySelector(".wx-graph-view-controls");
    assert.ok(controls, "the controls are rendered on the host");
    assert.equal(controls.children.length, 4, "fit, centre, zoom in and zoom out");

    ctrl._scale = 2;
    ctrl._pan = { x: 999, y: 999 };
    ctrl._centerView();

    const box = ctrl._computeContentBBox();
    const centerX = (box.minX + box.maxX) / 2;

    assert.equal(ctrl._scale, 2, "centring leaves the zoom alone");
    assert.ok(Math.abs((centerX * 2 + ctrl._pan.x) - CANVAS_WIDTH / 2) < 1e-6,
        "the content is centred horizontally");
});

test("an edge between unknown nodes is skipped rather than rendered broken", () => {
    const { ctrl } = createViewer({
        nodes: [{ id: "a", x: 0, y: 0 }],
        edges: [{ id: "e1", from: "a", to: "missing" }]
    });

    assert.equal(renderedEdges(ctrl).length, 0, "the dangling edge is not drawn");
});

const DETAILED = {
    nodes: [
        {
            id: "chg",
            label: "CHG-00045",
            description: "Change · Firmware update",
            state: "Approved",
            stateCss: "wx-demo-success",
            x: 0,
            y: 0
        },
        { id: "plain", label: "Beta", x: 300, y: 0 }
    ],
    edges: [{ id: "e1", from: "chg", to: "plain" }]
};

test("a node that carries a description and a state renders both", () => {
    const { ctrl } = createViewer({});
    ctrl.model = DETAILED;

    const [detailed] = renderedNodes(ctrl);

    assert.equal(detailed.querySelectorAll("text.wx-graph-node-description").length, 1);
    assert.equal(detailed.querySelectorAll("text.wx-graph-node-state").length, 1);

    // the state is a badge: a plate laid under its caption, not a bare dot
    const badge = detailed.querySelector("rect.wx-graph-node-state-badge");
    assert.ok(badge, "the state carries a badge");
    assert.ok(badge.getAttribute("class").includes("wx-demo-success"), "the badge takes the colour of the state");
});

test("a node without a description or a state renders as it always did", () => {
    const { ctrl } = createViewer({});
    ctrl.model = DETAILED;

    const plain = renderedNodes(ctrl)[1];

    assert.equal(plain.querySelectorAll("text.wx-graph-node-description").length, 0);
    assert.equal(plain.querySelectorAll("rect.wx-graph-node-state-badge").length, 0);
    assert.equal(plain.querySelectorAll("text.wx-graph-node-label").length, 1);
});

test("the text of a detailed node stays inside its rectangle", () => {
    const { ctrl } = createViewer({});
    ctrl.model = {
        nodes: [{
            id: "long",
            label: "a key far longer than any node should try to show at once",
            description: "a description that runs on well past the width a node can give it",
            state: "a state caption nobody would ever write",
            x: 0,
            y: 0
        }],
        edges: []
    };

    const node = ctrl._nodes[0];
    const caps = ctrl.constructor;

    assert.ok(node.data.label.length <= caps.NODE_LABEL_LENGTH, "the label is cut to what fits");
    assert.ok(node.data.description.length <= caps.NODE_DESCRIPTION_LENGTH);
    assert.ok(node.data.state.length <= caps.NODE_STATE_LENGTH);
    assert.ok(node.data.label.endsWith("…"), "what was left out is marked");

    // the rectangle is measured from the cut text, so the badge cannot reach
    // past the right edge and the two lines cannot reach past the left one
    const [group] = renderedNodes(ctrl);
    const rect = group.querySelector("rect.wx-graph-node-rect");
    const left = Number(rect.getAttribute("x"));
    const right = left + Number(rect.getAttribute("width"));
    const badge = group.querySelector("rect.wx-graph-node-state-badge");
    const description = group.querySelector("text.wx-graph-node-description");

    assert.ok(Number(badge.getAttribute("x")) > left, "the badge starts inside the box");
    assert.ok(Number(badge.getAttribute("x")) + Number(badge.getAttribute("width")) <= right,
        "the badge ends inside the box");
    assert.ok(Number(description.getAttribute("x")) > left, "the description starts inside the box");
});
