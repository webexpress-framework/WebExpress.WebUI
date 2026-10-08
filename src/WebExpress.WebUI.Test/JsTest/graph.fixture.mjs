/**
 * Shared fixture for the graph control tests.
 *
 * The graph controls read their model out of the DOM island the C# side
 * renders: one .wx-graph-node element per node and one .wx-graph-edge element
 * per edge, each carrying its data in dataset attributes. This module builds
 * that island and constructs the control on it, so the tests can describe a
 * graph instead of assembling markup.
 *
 * The stub has no layout, so the canvas is given an explicit box; without one
 * the viewport is zero-sized and every view transform is a no-op.
 */

import { loadWebUi } from "./harness.mjs";

const VIEWER = "webexpress.webui.graph.viewer.js";
const EDITOR = "webexpress.webui.graph.editor.js";

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

/**
 * Loads a runtime carrying the graph controls.
 * @param {boolean} [withEditor] - Whether the editor should be loaded as well.
 * @returns {object} The runtime.
 */
export function loadGraphRuntime(withEditor = false) {
    return loadWebUi({ browser: true, extraFiles: withEditor ? [VIEWER, EDITOR] : [VIEWER] });
}

/**
 * Builds the DOM island a graph control reads at construction time.
 * @param {object} rt - The runtime.
 * @param {object} graph - The graph: { nodes, edges, dataset }.
 * @returns {object} The connected host element.
 */
export function buildGraphHost(rt, graph = {}) {
    const host = rt.document.createElement("div");
    host.id = graph.id || "graph-host";

    for (const [key, value] of Object.entries(graph.dataset || {})) {
        host.dataset[key] = value;
    }

    for (const node of graph.nodes || []) {
        const el = rt.document.createElement("div");
        el.classList.add("wx-graph-node");
        el.id = node.id;
        for (const [key, value] of Object.entries(node)) {
            if (key !== "id") {
                el.dataset[key] = String(value);
            }
        }
        host.appendChild(el);
    }

    for (const edge of graph.edges || []) {
        const el = rt.document.createElement("div");
        el.classList.add("wx-graph-edge");
        el.id = edge.id;
        for (const [key, value] of Object.entries(edge)) {
            if (key === "id") {
                continue;
            }
            el.dataset[key] = key === "waypoints" ? JSON.stringify(value) : String(value);
        }
        host.appendChild(el);
    }

    rt.document.body.appendChild(host);
    return host;
}

/**
 * Gives the canvas a box so the view transforms have something to work with.
 * @param {object} ctrl - The graph control.
 * @param {object} [rect] - The box to report.
 */
export function sizeCanvas(ctrl, rect) {
    ctrl._svg._rect = rect || { left: 0, top: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
}

/**
 * Builds a graph viewer over a fresh island.
 * @param {object} graph - The graph description.
 * @returns {{rt: object, host: object, ctrl: object}} The fixture.
 */
export function createViewer(graph) {
    const rt = loadGraphRuntime(false);
    const host = buildGraphHost(rt, graph);
    const ctrl = new rt.wx.GraphViewerCtrl(host);
    sizeCanvas(ctrl);
    return { rt, host, ctrl };
}

/**
 * Builds a graph editor over a fresh island.
 * @param {object} graph - The graph description.
 * @returns {{rt: object, host: object, ctrl: object}} The fixture.
 */
export function createEditor(graph) {
    const rt = loadGraphRuntime(true);
    const host = buildGraphHost(rt, graph);
    const ctrl = new rt.wx.GraphEditorCtrl(host);
    sizeCanvas(ctrl);
    return { rt, host, ctrl };
}

/**
 * Adds a second editor to an existing runtime, which is how the tests observe
 * that a global shortcut reaches exactly one graph.
 * @param {object} rt - The runtime.
 * @param {object} graph - The graph description.
 * @returns {{host: object, ctrl: object}} The second editor.
 */
export function addEditor(rt, graph) {
    const host = buildGraphHost(rt, { ...graph, id: (graph.id || "graph") + "-second" });
    const ctrl = new rt.wx.GraphEditorCtrl(host);
    sizeCanvas(ctrl);
    return { host, ctrl };
}

/**
 * The rendered node groups of a control.
 * @param {object} ctrl - The graph control.
 * @returns {object[]} The group elements.
 */
export function renderedNodes(ctrl) {
    return ctrl._nodeLayer.children;
}

/**
 * The rendered edge paths of a control.
 * @param {object} ctrl - The graph control.
 * @returns {object[]} The path elements.
 */
export function renderedEdges(ctrl) {
    return ctrl._edgeLayer.children.filter((el) => String(el.tagName).toLowerCase() === "path");
}

/**
 * Waits for the pending macrotasks to drain, which is how the frame loop (a
 * setTimeout in the harness) makes progress.
 * @param {number} [turns] - How many turns to wait.
 * @returns {Promise<void>} Resolves once the turns have elapsed.
 */
export async function drainFrames(turns = 5) {
    for (let i = 0; i < turns; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1));
    }
}
