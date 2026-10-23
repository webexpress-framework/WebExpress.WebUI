/**
 * Graph editor controller.
 * Features:
 * - Double-click node: Edit Properties
 * - Double-click edge: Add Waypoint
 * - Edge Creation: Shows preview arrow from source to mouse
 * - Edge Reconnect: Highlights target nodes on hover
 *
 * The editor renders through the hooks of the viewer, from the same state: the toolbar
 * ahead of the canvas, the selection, hover and source marks of the nodes, the waypoints
 * and the endpoint handles of the selected edge, the preview of an edge being drawn,
 * the alignment guides of a drag and the dialogs. A discrete action - a click, a key,
 * a menu command - renders at once; a gesture renders once per animation frame.
 */
webexpress.webui.GraphEditorCtrl = class extends webexpress.webui.GraphViewerCtrl {
    // the distance an Alt+arrow moves the selection; Shift narrows it to one
    // unit for fine placement
    static NUDGE_STEP = 10;

    // how many model snapshots the undo history retains
    static HISTORY_LIMIT = 50;

    // a screen-space tolerance keeps alignment equally usable at every zoom
    static ALIGNMENT_TOLERANCE = 6;

    // the colour of the edge being drawn, which marks it as not yet part of the graph
    static PREVIEW_COLOR = "#ffc107";

    static ARROW_DIRECTIONS = {
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 }
    };

    /**
     * Constructor for the graph editor control.
     * @param {HTMLElement} element - host element
     */
    constructor(element) {
        super(element);

        // the box model lives in webexpress.webui.graph.css; setting it inline
        // here would win over every stylesheet and leave a host that embeds the
        // editor no way to give it a height of its own
        element.classList.add("wx-graph-editor");

        this.setState({
            selectedNode: null,
            selectedEdge: null,
            selectedWaypoint: null,
            hoveredNode: null,
            addEdge: false,
            edgeSource: null,
            endpointDrag: null,
            preview: null,
            guides: [],
            dialog: null,
            history: { undo: 0, redo: 0 }
        });

        // each entry is the model as it was before one change; the model on screen is
        // never on the stack, so a model a host loads later cannot be undone away
        this._undoStack = [];
        this._redoStack = [];

        this._drag = null;
        this._dragSnapshot = null;
        this._dialogToken = 0;
        this._confirmAction = null;

        this._addWindowListener("pointerup", (e) => this._onPointerUpGlobal(e));
        this._addWindowListener("keydown", (e) => this._onKeyDown(e));

        if (new.target === webexpress.webui.GraphEditorCtrl) {
            this._open();
        }
    }

    // the editing state lives in the state; the accessors keep the field api the
    // subclasses and the hosts use

    get _selectedNodeId() { return this.state.selectedNode ?? null; }
    set _selectedNodeId(value) { this.setState({ selectedNode: value ?? null }); }

    get _selectedEdgeId() { return this.state.selectedEdge ?? null; }
    set _selectedEdgeId(value) { this.setState({ selectedEdge: value ?? null }); }

    get _selectedWaypointIndex() { return this.state.selectedWaypoint ?? null; }
    set _selectedWaypointIndex(value) { this.setState({ selectedWaypoint: value ?? null }); }

    get _hoveredNodeId() { return this.state.hoveredNode ?? null; }
    set _hoveredNodeId(value) { this.setState({ hoveredNode: value ?? null }); }

    get _isAddEdgeMode() { return !!this.state.addEdge; }
    set _isAddEdgeMode(value) { this.setState({ addEdge: !!value }); }

    get _edgeSourceNode() { return this.state.edgeSource ?? null; }
    set _edgeSourceNode(value) { this.setState({ edgeSource: value ?? null }); }

    get _endpointDrag() { return this.state.endpointDrag ?? null; }
    set _endpointDrag(value) { this.setState({ endpointDrag: value ?? null }); }

    /**
     * Converts a pointer event to local SVG coordinates.
     * @param {PointerEvent|MouseEvent} e - the pointer event
     * @returns {{x: number, y: number}} local coordinates
     */
    _toLocalSafe(e) {
        return this._toLocal(e);
    }

    // ------------------------------------------------------------------ history

    /**
     * Records the model as it is before a change, so one undo takes back exactly that
     * change. Every caller saves ahead of its mutation.
     */
    _saveStateToHistory() {
        this._pushHistory(this._undoStack, this._snapshot());
        this._redoStack = [];
        this._updateToolbarState();
    }

    /**
     * Copies the model with the positions the simulation and the gestures gave it.
     * @returns {object} The detached copy.
     */
    _snapshot() {
        this._syncModelPositions();
        return JSON.parse(JSON.stringify(this._model));
    }

    /**
     * Pushes a snapshot onto a history stack within the limit.
     * @param {Array<object>} stack - The undo or the redo stack.
     * @param {object} snapshot - The model copy.
     */
    _pushHistory(stack, snapshot) {
        // trim before the push, so the stack never exceeds the limit; testing
        // with > after the push would keep one entry too many
        while (stack.length >= webexpress.webui.GraphEditorCtrl.HISTORY_LIMIT) {
            stack.shift();
        }
        stack.push(snapshot);
    }

    /**
     * Restores the model as it was before the last change.
     */
    _undo() {
        if (this._collab) {
            this._collabStep(false);
            return;
        }

        if (this._undoStack.length === 0) {
            return;
        }

        this._pushHistory(this._redoStack, this._snapshot());
        this._restoreSnapshot(this._undoStack.pop());
    }

    /**
     * Puts a snapshot from the history in place of the model and announces the change.
     * @param {object} snapshot - The model copy.
     */
    _restoreSnapshot(snapshot) {
        this._model = snapshot;
        this._buildPhysics();
        this._pruneSelection();
        this.render();
        this._updateToolbarState();
        this._emitChangeSafe();
    }

    /**
     * Drops a selection that the restored model no longer contains. Without
     * this the properties panel keeps editing an element that has been undone
     * away, and the changes are written back into a detached object.
     */
    _pruneSelection() {
        if (this._selectedNodeId && !this._model.nodes.some(n => n.id === this._selectedNodeId)) {
            this._selectedNodeId = null;
        }
        if (this._selectedEdgeId && !this._model.edges.some(e => (e.id || "") === this._selectedEdgeId)) {
            this._selectedEdgeId = null;
            this._selectedWaypointIndex = null;
        }
        if (this._edgeSourceNode && !this._model.nodes.some(n => n.id === this._edgeSourceNode)) {
            this._edgeSourceNode = null;
        }

        const edge = this._selectedEdge();
        const count = edge && Array.isArray(edge.waypoints) ? edge.waypoints.length : 0;
        if (this._selectedWaypointIndex !== null && this._selectedWaypointIndex >= count) {
            this._selectedWaypointIndex = count > 0 ? count - 1 : null;
        }
    }

    /**
     * Re-applies a previously undone model state from the redo stack.
     */
    _redo() {
        if (this._collab) {
            this._collabStep(true);
            return;
        }

        if (this._redoStack.length === 0) {
            return;
        }

        this._pushHistory(this._undoStack, this._snapshot());
        this._restoreSnapshot(this._redoStack.pop());
    }

    // ------------------------------------------------------------------ collaboration

    /**
     * Names the document kind this control shares: a graph of node and edge leaves (see
     * webexpress.webui.OtSchema.checkGraph).
     * @returns {string} The kind.
     */
    get collaborationKind() { return "graph"; }

    /**
     * Starts sharing the graph. Every committed change is announced as steps; moving a node
     * becomes attribute steps on its coordinates, so two users moving different nodes never
     * conflict. Undo then inverts only the user's own changes.
     * @param {object} [options] - The options.
     * @param {string} [options.tag] - The client tag that keeps new ids unique across clients.
     */
    beginCollaboration(options = {}) {
        this._collabTag = /^[a-z\d]{1,12}$/.test(options.tag ?? "") ? options.tag : "";
        // edges without ids cannot be addressed by steps
        this._model.edges.forEach(edge => { if (!edge.id) edge.id = this._newEdgeId(); });
        this._collab = { history: new webexpress.webui.OtHistory(), tokens: this._graphTokens() };
        this._updateToolbarState();
    }

    /**
     * Stops sharing the graph; the snapshot history starts afresh.
     */
    endCollaboration() {
        this._collab = null;
        this._undoStack = [];
        this._redoStack = [];
        this._updateToolbarState();
    }

    /**
     * Returns the graph as packed tokens, as it was last announced.
     * @returns {Array<object>} The packed tokens.
     */
    getCollaborationTokens() {
        return webexpress.webui.Ot.compact(this._collab?.tokens ?? this._graphTokens());
    }

    /**
     * Replaces the graph with the shared state.
     * @param {Array<object>} tokens - The packed tokens.
     * @returns {boolean} True if they form a valid graph.
     */
    loadCollaborationTokens(tokens) {
        let expanded;
        try { expanded = webexpress.webui.Ot.expand(tokens); } catch { return false; }
        if (!webexpress.webui.OtSchema.checkGraph(expanded)) return false;
        this._showGraph(expanded);
        this._collab?.history.reset();
        this._updateToolbarState();
        return true;
    }

    /**
     * Checks packed tokens against the graph schema.
     * @param {Array<object>} tokens - The tokens.
     * @returns {boolean} True if valid.
     */
    checkCollaborationTokens(tokens) {
        try { return webexpress.webui.OtSchema.checkGraph(webexpress.webui.Ot.expand(tokens)); } catch { return false; }
    }

    /**
     * Repairs a graph after concurrent changes; edges whose node was removed are dropped.
     * @param {Array<object>} tokens - The broken tokens.
     * @returns {Array<object>|null} The repaired packed tokens.
     */
    repairCollaborationTokens(tokens) {
        try { return webexpress.webui.Ot.compact(webexpress.webui.OtSchema.repairGraph(webexpress.webui.Ot.expand(tokens))); } catch { return null; }
    }

    /**
     * Applies steps another user made, without announcing them or making them undoable here.
     * @param {Array<object>} steps - The steps.
     * @returns {boolean} True if they applied to a valid graph.
     */
    applyRemoteSteps(steps) {
        if (!this._collab) return false;
        let result;
        try { result = webexpress.webui.Ot.apply(this._collab.tokens, steps); } catch { return false; }
        if (!webexpress.webui.OtSchema.checkGraph(result.tokens)) return false;
        this._showGraph(result.tokens);
        this._collab.history.remote(result.steps);
        this._updateToolbarState();
        return true;
    }

    /**
     * A graph has no text caret; the pointers of the others are shown by the host.
     * @returns {null} Always null.
     */
    getModelSelection() { return null; }

    /**
     * A graph has no text positions to measure.
     * @returns {null} Always null.
     */
    getModelPositionRect() { return null; }

    /**
     * Returns the suffix that keeps new ids unique across the clients sharing the graph.
     * @returns {string} The suffix, empty while the graph is not shared.
     */
    _idSuffix() { return this._collab && this._collabTag ? "-" + this._collabTag : ""; }

    /**
     * Linearizes the model: one leaf per node, then one per edge, with all properties but the
     * id as attributes.
     * @returns {Array<object>} The tokens.
     */
    _graphTokens() {
        this._syncModelPositions();
        const leaf = (type, item) => {
            const { id, ...attrs } = JSON.parse(JSON.stringify(item));
            return { t: "l", n: type, id: String(id ?? ""), a: attrs };
        };
        return [...this._model.nodes.map(node => leaf("node", node)), ...this._model.edges.map(edge => leaf("edge", edge))];
    }

    /**
     * Shows a graph from tokens and publishes it as the value, without announcing it as a
     * local change.
     * @param {Array<object>} tokens - The tokens.
     */
    _showGraph(tokens) {
        const model = { nodes: [], edges: [] };
        for (const token of tokens) (token.n === "node" ? model.nodes : model.edges).push({ id: token.id, ...JSON.parse(JSON.stringify(token.a)) });
        if (this._collab) this._collab.tokens = tokens;
        this._model = this._normalizeModel(model);
        this._buildPhysics();
        this._pruneSelection();
        this.render();
        this._remote = true;
        try { this._emitChangeSafe(); } finally { this._remote = false; }
    }

    /**
     * Announces what changed since the last announcement as steps and records it for
     * selective undo.
     */
    _announceGraph() {
        if (!this._collab || this._remote) return;
        const before = this._collab.tokens, after = this._graphTokens();
        const steps = webexpress.webui.Ot.diff(before, after);
        if (!steps.length) return;
        const applied = webexpress.webui.Ot.apply(before, steps).steps;
        this._collab.tokens = after;
        this._collab.history.record(applied);
        this._dispatch(webexpress.webui.Event.COLLABORATION_STEPS_EVENT, { steps: applied });
        this._updateToolbarState();
    }

    /**
     * Undoes or redoes an own change while the graph is shared.
     * @param {boolean} redo - True to redo.
     */
    _collabStep(redo) {
        let applied = null;
        const apply = steps => {
            let result;
            try { result = webexpress.webui.Ot.apply(this._collab.tokens, steps); } catch { return null; }
            if (!webexpress.webui.OtSchema.checkGraph(result.tokens) || webexpress.webui.Ot.equal(result.tokens, this._collab.tokens)) return null;
            this._showGraph(result.tokens);
            return (applied = result.steps);
        };
        const history = this._collab.history;
        if (redo ? history.redo(apply) : history.undo(apply)) {
            this._dispatch(webexpress.webui.Event.COLLABORATION_STEPS_EVENT, { steps: applied });
        }
        this._updateToolbarState();
    }

    // ------------------------------------------------------------------ toolbar

    /**
     * The toolbar actions this editor offers, in order; "|" is a separator.
     *
     * A subclass that surfaces some of them elsewhere narrows the set here
     * rather than deleting buttons the base already built - the workflow editor
     * moves creation and editing into its properties panel, where the same
     * actions sit next to the fields they affect.
     * @returns {string[]} the action keys
     */
    _toolbarActions() {
        return ["undo", "redo", "|", "add-node", "add-edge", "|", "edit", "delete", "|", "export"];
    }

    /**
     * Describes the toolbar ahead of the canvas. Fitting and centring are view actions,
     * not model actions; they live on the canvas itself (lower left), so no key is
     * offered for them here.
     * @param {object} state - The state.
     * @returns {object} The toolbar virtual node.
     */
    _renderBeforeCanvas(state) {
        const h = webexpress.webui.h;
        const hasSelection = !!state.selectedNode || !!state.selectedEdge;
        const canUndo = state.history.undo > 0;
        const canRedo = state.history.redo > 0;

        const button = (key, id, icon, title, action, options = {}) => h("button", {
            key: key,
            type: "button",
            class: "wx-simple-btn" + (options.active ? " active" : ""),
            title: title,
            id: id,
            disabled: !!options.disabled,
            style: options.style || null,
            on: this._handler("toolbar", key, () => ({
                click: (e) => {
                    e.stopPropagation();
                    action();
                }
            })),
            ref: options.ref || null
        }, h("i", { class: icon }));

        const dim = (enabled, pointer) => pointer
            ? { opacity: enabled ? "1" : "0.5", cursor: enabled ? "pointer" : "default" }
            : { opacity: enabled ? "1" : "0.5" };

        const builders = {
            "undo": () => button("undo", "btn-undo", this._iconClass("undo"),
                this._i18n("webexpress.webui:graph.undo", "Undo"), () => this._undo(),
                { disabled: !canUndo, style: dim(canUndo, false), ref: (el) => { this._btnUndo = el; } }),
            "redo": () => button("redo", "btn-redo", this._iconClass("redo"),
                this._i18n("webexpress.webui:graph.redo", "Redo"), () => this._redo(),
                { disabled: !canRedo, style: dim(canRedo, false), ref: (el) => { this._btnRedo = el; } }),
            "add-node": () => button("add-node", "btn-add-node", this._iconClass("circle-plus"),
                this._i18n("webexpress.webui:graph.add.node", "Add Node"), () => {
                    this._addNode();
                    if (this._isAddEdgeMode) {
                        this._resetAddEdgeMode();
                    }
                }),
            "add-edge": () => button("add-edge", "btn-add-edge", this._iconClass("share"),
                this._i18n("webexpress.webui:graph.add.edge", "Add Edge (Toggle)"),
                () => this._toggleAddEdgeMode(!this._isAddEdgeMode),
                { active: !!state.addEdge, ref: (el) => { this._btnEdgeMode = el; } }),
            "edit": () => button("edit", "btn-edit", this._iconClass("pen"),
                this._i18n("webexpress.webui:graph.edit.properties", "Edit Properties"), () => this._openPropertiesModal(),
                { disabled: !hasSelection, style: dim(hasSelection, true), ref: (el) => { this._btnEdit = el; } }),
            "delete": () => button("delete", "btn-delete", this._iconClass("trash"),
                this._i18n("webexpress.webui:graph.delete.selected", "Delete Selected"), () => this._requestDelete(),
                { disabled: !hasSelection, style: dim(hasSelection, true), ref: (el) => { this._btnDelete = el; } }),
            "export": () => button("export", "btn-export", this._iconClass("file-export"),
                this._i18n("webexpress.webui:graph.export.svg", "Export SVG"), () => this.exportSvg())
        };

        const actions = this._toolbarActions();
        const items = actions.map((action, index) => {
            if (action === "|") {
                // a separator only earns its place between two actions that are
                // actually present
                const before = actions.slice(0, index).some(a => a !== "|" && builders[a]);
                const after = actions.slice(index + 1).some(a => a !== "|" && builders[a]);
                return before && after ? h("div", { key: "sep" + index, class: "wx-simple-sep" }) : null;
            }
            return builders[action] ? builders[action]() : null;
        });

        return h("div", {
            key: "toolbar",
            class: "wx-graph-simple-toolbar",
            ref: (el) => { this._toolbarContainer = el; }
        }, items, this._renderToolbarExtras(state));
    }

    /**
     * Hook for subclasses to describe further items at the end of the toolbar.
     * @param {object} state - The state.
     * @returns {*} Virtual nodes, or null.
     */
    _renderToolbarExtras(state) {
        return null;
    }

    /**
     * Brings the toolbar up to date with the history and renders it at once; the
     * selection and the mode it reflects are state of their own.
     */
    _updateToolbarState() {
        const history = this._collab
            ? { undo: this._collab.history.canUndo() ? 1 : 0, redo: this._collab.history.canRedo() ? 1 : 0 }
            : { undo: this._undoStack.length, redo: this._redoStack.length };
        const current = this.state.history;
        if (!current || current.undo !== history.undo || current.redo !== history.redo) {
            this.setState({ history: history });
        }
        this._store.flush();
    }

    // ------------------------------------------------------------------ canvas view

    /**
     * Adds the colour of the edge being drawn to the arrow markers.
     * @param {object} state - The state.
     * @returns {Array<string>} The colours.
     */
    _markerColors(state) {
        return super._markerColors(state).concat([webexpress.webui.GraphEditorCtrl.PREVIEW_COLOR]);
    }

    /**
     * Gets the cursor of the canvas: a crosshair while an edge is drawn.
     * @param {object} state - The state.
     * @returns {string} The cursor.
     */
    _canvasCursor(state) {
        return state.addEdge ? "crosshair" : super._canvasCursor(state);
    }

    /**
     * Returns the listeners of the canvas: the viewer's, and the background click,
     * double click and pointer tracking of the editor.
     * @returns {object} The listener map.
     */
    _svgHandlers() {
        return this._handler("svg", "editor", () => Object.assign({}, super._svgHandlers(), {
            pointermove: (e) => this._onPointerMove(e),
            click: (e) => this._onCanvasClick(e),
            dblclick: (e) => this._onCanvasDoubleClick(e)
        }));
    }

    /**
     * Selects the edge near a background click, or clears the selection.
     * @param {MouseEvent} e - The click event.
     */
    _onCanvasClick(e) {
        const isNode = e.target.closest(".wx-graph-node");
        const isWp = e.target.closest(".wx-workflow-waypoint");
        const isHandle = e.target.closest(".wx-workflow-handle");
        const isEdge = e.target.closest(".wx-workflow-edge");

        if (isNode || isWp || isHandle || isEdge) {
            return;
        }

        const handled = this._selectEdgeNear(e, 12);
        if (!handled) {
            this._deselectAll();
            if (this._isAddEdgeMode) {
                this._resetAddEdgeMode();
            }
        }
    }

    /**
     * Adds a waypoint to the edge near a background double click, or a node where no
     * edge is near.
     * @param {MouseEvent} e - The double click event.
     */
    _onCanvasDoubleClick(e) {
        // a node and an edge answer their own double click
        if (e.target.closest(".wx-graph-node") || e.target.closest(".wx-workflow-waypoint") || e.target.closest(".wx-workflow-edge")) {
            return;
        }

        const local = this._toLocalSafe(e);
        const near = this._nearestEdgeAt(local.x, local.y, 12);
        if (near && near.edge) {
            this._saveStateToHistory();
            this._selectedEdgeId = this._edgeId(near.edge, -1);
            this._selectedNodeId = null;

            const a = near.a;
            const b = near.b;
            const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

            near.edge.waypoints = Array.isArray(near.edge.waypoints) ? near.edge.waypoints : [];
            const insertAt = Math.min(Math.max(near.index, 0), near.edge.waypoints.length);
            near.edge.waypoints.splice(insertAt, 0, mid);

            this.render();
            this._updateToolbarState();
            this._emitChangeSafe();
        } else {
            this._addNode();
        }
    }

    /**
     * Marks the selected node, the source of an edge being drawn and the node an edge
     * end is about to land on.
     * @param {object} state - The state.
     * @param {object} n - The node.
     * @returns {Array<string>} The classes.
     */
    _nodeClasses(state, n) {
        return [
            n.id === state.selectedNode && "wx-graph-node-selected",
            state.addEdge && n.id === state.edgeSource && "wx-graph-node-source",
            n.id === state.hoveredNode && "wx-graph-node-hover"
        ].filter(Boolean);
    }

    /**
     * Returns the listeners of a node: a press starts a move, a click selects it or
     * connects it while an edge is drawn, a double click opens its properties.
     * @param {string} id - The node id.
     * @returns {object} The listener map.
     */
    _nodeHandlers(id) {
        return this._handler("editorNode", id, () => ({
            pointerdown: (e) => {
                if (this._isAddEdgeMode) {
                    return;
                }
                e.stopPropagation();
                const n = this._nodeById(id);
                if (!n) {
                    return;
                }
                const p = this._toLocalSafe(e);

                this._dragSnapshot = JSON.stringify(this._model);
                this._drag = {
                    type: "node",
                    id: n.id,
                    startX: p.x,
                    startY: p.y,
                    nodeStartX: n.x || 0,
                    nodeStartY: n.y || 0,
                    pointerId: e.pointerId,
                    hasMoved: false
                };
                this._selectedNodeId = n.id;
                this._selectedEdgeId = null;
                const target = e.currentTarget || e.target;
                try {
                    target.setPointerCapture(e.pointerId);
                } catch (err) {
                    // pointer capture may not be supported
                }
                this.render();
                this._updateToolbarState();
                this._attachDragListeners(target);
            },
            click: (e) => {
                e.stopPropagation();
                if (this._isAddEdgeMode) {
                    if (this._edgeSourceNode === null) {
                        this._edgeSourceNode = id;
                    } else if (this._edgeSourceNode !== id) {
                        const source = this._edgeSourceNode;
                        this._edgeSourceNode = null;
                        this._createEdgeAndEmit(source, id);
                    } else {
                        // clicked same node -> deselect source
                        this._edgeSourceNode = null;
                    }
                    this.setState({ preview: null, hoveredNode: null });
                    this.render();
                    return;
                }
                this._selectedNodeId = id;
                this._selectedEdgeId = null;
                this.render();
                this._updateToolbarState();
            },
            dblclick: (e) => {
                e.stopPropagation();
                if (this._isAddEdgeMode) {
                    return;
                }
                this._selectedNodeId = id;
                this._selectedEdgeId = null;
                this._updateToolbarState();
                this._openPropertiesModal();
            }
        }));
    }

    /**
     * Gets the key of an edge, which is also its id on the canvas.
     * @param {object} t - The edge.
     * @param {number} index - The position of the edge in the model.
     * @returns {string} The key.
     */
    _edgeKey(t, index) {
        return this._edgeId(t, index);
    }

    /**
     * Gets the points an edge is drawn through; the edge whose end is being dragged runs
     * to the pointer.
     * @param {object} state - The state.
     * @param {Map<string, object>} placed - The nodes at their rendered positions.
     * @param {object} t - The edge.
     * @returns {Array<{x: number, y: number}>|null} The points.
     */
    _edgeRenderPoints(state, placed, t) {
        const drag = state.endpointDrag;
        const src = placed.get(t.from);
        const dst = placed.get(t.to);

        if (drag && drag.edgeId === (t.id || "")) {
            const draggingFrom = drag.which === "from";
            const startPoint = draggingFrom ? drag.current : (src ? { x: src.x, y: src.y } : { x: 0, y: 0 });
            const endPoint = draggingFrom ? (dst ? { x: dst.x, y: dst.y } : { x: 0, y: 0 }) : drag.current;
            const pts = [startPoint].concat(Array.isArray(t.waypoints) ? t.waypoints : [], [endPoint]);
            if (draggingFrom && dst) {
                pts[pts.length - 1] = this._nodeEdgePoint(dst, pts[pts.length - 2]);
            } else if (!draggingFrom && src) {
                pts[0] = this._nodeEdgePoint(src, pts[1]);
            }
            return pts;
        }

        if (!src || !dst) {
            return null;
        }
        return this._edgePointsWithWaypoints(src, dst, t.waypoints || [], 0);
    }

    /**
     * Marks an edge as one the editor works on and gives it its listeners.
     * @param {object} state - The state.
     * @param {object} t - The edge.
     * @param {string} id - The edge key.
     * @returns {object} The props.
     */
    _edgeProps(state, t, id) {
        return {
            class: ["wx-graph-viewer-edge wx-workflow-edge", t.colorCss].filter(Boolean).join(" "),
            "data-selected": id === state.selectedEdge ? "true" : null,
            on: this._handler("edge", id, () => ({
                click: (e) => {
                    e.stopPropagation();
                    if (this._selectedEdgeId === id) {
                        this._selectedEdgeId = null;
                    } else {
                        this._selectedEdgeId = id;
                        this._selectedNodeId = null;
                    }
                    this.setState({ endpointDrag: null, hoveredNode: null });
                    this.render();
                    this._updateToolbarState();
                },
                dblclick: (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const edge = this._model.edges.find((candidate, index) => this._edgeId(candidate, index) === id);
                    if (!edge) {
                        return;
                    }
                    this._saveStateToHistory();
                    this._selectedEdgeId = id;
                    this._selectedNodeId = null;
                    this._insertWaypointAtMid(edge, e);
                }
            }))
        };
    }

    /**
     * Tells whether edge labels are drawn; the editor shows its edges unlabelled.
     * @returns {boolean} False.
     */
    _showsEdgeLabels() {
        return false;
    }

    /**
     * Describes the layers above the nodes: the waypoints and the endpoint handles of
     * the selected edge, the preview of an edge being drawn and the alignment guides of
     * a drag. Handles and waypoints keep their size on screen at every zoom.
     * @param {object} state - The state.
     * @param {Map<string, object>} placed - The nodes at their rendered positions.
     * @returns {Array<object>} The layer virtual nodes.
     */
    _renderOverlays(state, placed) {
        const h = webexpress.webui.h;
        const inv = 1 / (state.view.scale || 1);

        return [
            h("g", { key: "waypoints", "data-layer": "waypoints", ref: (el) => { this._waypointLayer = el; } },
                this._renderWaypoints(state, inv)),
            h("g", { key: "preview", "data-layer": "preview", ref: (el) => { this._previewLayer = el; } },
                state.preview && h("path", {
                    key: "edge",
                    class: "wx-graph-preview-edge",
                    d: this._arrowPathData(state.preview),
                    "marker-end": this._ensureArrowMarker(webexpress.webui.GraphEditorCtrl.PREVIEW_COLOR),
                    fill: "none"
                })),
            h("g", { key: "handles", "data-layer": "handles", ref: (el) => { this._handleLayer = el; } },
                this._renderHandles(state, placed, inv)),
            h("g", { key: "markers", "data-layer": "markers", ref: (el) => { this._markerLayer = el; } }),
            h("g", {
                key: "alignment",
                "data-layer": "alignment",
                "pointer-events": "none",
                "aria-hidden": "true",
                ref: (el) => { this._alignmentLayer = el; }
            }, state.guides.map((guide, index) => h("line", Object.assign({ key: "guide" + index, class: "wx-graph-alignment-guide" }, guide))))
        ];
    }

    /**
     * Describes the waypoint circles of the selected edge.
     * @param {object} state - The state.
     * @param {number} inv - The inverse of the zoom.
     * @returns {Array<object>} The waypoint virtual nodes.
     */
    _renderWaypoints(state, inv) {
        const h = webexpress.webui.h;
        const edgeId = state.selectedEdge;
        if (!edgeId) {
            return [];
        }
        const edge = state.model.edges.find((t, index) => this._edgeId(t, index) === edgeId);
        if (!edge || !Array.isArray(edge.waypoints)) {
            return [];
        }

        return edge.waypoints.map((wp, index) => h("circle", {
            key: edgeId + "/" + index,
            class: "wx-workflow-waypoint" + (index === state.selectedWaypoint ? " wx-workflow-waypoint-selected" : ""),
            cx: wp.x,
            cy: wp.y,
            r: 5 * inv,
            style: { strokeWidth: 2 * inv + "px" },
            "data-edge": edgeId,
            "data-index": index,
            on: this._handler("waypoint", edgeId + "/" + index, () => ({
                pointerdown: (e) => this._beginWaypointDrag(edgeId, index, e),
                contextmenu: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const target = this._selectedEdge();
                    if (!target || !target.waypoints[index]) {
                        return;
                    }
                    this._saveStateToHistory();
                    target.waypoints.splice(index, 1);
                    this.render();
                    this._emitChangeSafe();
                }
            }))
        }));
    }

    /**
     * Starts moving a waypoint.
     * @param {string} edgeId - The id of the edge.
     * @param {number} index - The index of the waypoint.
     * @param {PointerEvent} e - The pointer event.
     */
    _beginWaypointDrag(edgeId, index, e) {
        e.stopPropagation();
        const edge = this._model.edges.find(t => (t.id || "") === edgeId);
        const wp = edge && edge.waypoints ? edge.waypoints[index] : null;
        if (!wp) {
            return;
        }
        this._selectedWaypointIndex = index;
        const p = this._toLocalSafe(e);
        this._dragSnapshot = JSON.stringify(this._model);
        this._drag = {
            type: "waypoint",
            edgeId: edgeId,
            index: index,
            startX: p.x,
            startY: p.y,
            wpStartX: wp.x,
            wpStartY: wp.y,
            pointerId: e.pointerId,
            hasMoved: false
        };
        const target = e.currentTarget || e.target;
        try {
            target.setPointerCapture(e.pointerId);
        } catch (err) {
            // pointer capture may not be supported
        }
        this._attachDragListeners(target);
    }

    /**
     * Describes the draggable endpoint handles of the selected edge.
     * @param {object} state - The state.
     * @param {Map<string, object>} placed - The nodes at their rendered positions.
     * @param {number} inv - The inverse of the zoom.
     * @returns {Array<object>} The handle virtual nodes.
     */
    _renderHandles(state, placed, inv) {
        const h = webexpress.webui.h;
        if (!state.selectedEdge) {
            return [];
        }
        const t = state.model.edges.find(tr => (tr.id || "") === state.selectedEdge);
        if (!t) {
            return [];
        }

        let srcPos = null;
        let dstPos = null;
        const drag = state.endpointDrag;

        if (drag && drag.edgeId === (t.id || "")) {
            const src = placed.get(t.from);
            const dst = placed.get(t.to);
            if (drag.which === "from") {
                srcPos = drag.current;
                const ref = (t.waypoints && t.waypoints.length) ? t.waypoints[t.waypoints.length - 1] : srcPos;
                dstPos = dst ? this._nodeEdgePoint(dst, ref) : { x: 0, y: 0 };
            } else {
                dstPos = drag.current;
                const ref = (t.waypoints && t.waypoints.length) ? t.waypoints[0] : dstPos;
                srcPos = src ? this._nodeEdgePoint(src, ref) : { x: 0, y: 0 };
            }
        } else {
            const pts = this._edgeRenderPoints(state, placed, t) || [];
            if (pts.length > 0) {
                srcPos = pts[0];
                dstPos = pts[pts.length - 1];
            }
        }

        const handle = (pt, which) => pt && h("circle", {
            key: which,
            class: "wx-workflow-handle handle-" + which,
            cx: pt.x,
            cy: pt.y,
            r: 6 * inv,
            style: { strokeWidth: 2 * inv + "px" },
            on: this._handler("handle", which, () => ({
                pointerdown: (e) => {
                    e.stopPropagation();
                    const edge = this._selectedEdge();
                    if (!edge) {
                        return;
                    }
                    const p = this._toLocalSafe(e);
                    this._endpointDrag = { which: which, edgeId: edge.id || "", current: { x: p.x, y: p.y } };
                    this.render();
                    try {
                        this._svg.setPointerCapture(e.pointerId);
                    } catch (err) {
                        // pointer capture may not be supported
                    }
                }
            }))
        });

        return [handle(srcPos, "from"), handle(dstPos, "to")];
    }

    // ------------------------------------------------------------------ dialogs

    /**
     * Describes the open dialog, if any: a confirmation or the properties of the
     * selected node or edge. The fields of the properties dialog are built into its body
     * when it opens and kept there, because they carry what the user types and the
     * colour controls of the framework.
     * @param {object} state - The state.
     * @returns {object|null} The dialog virtual node.
     */
    _renderAfterCanvas(state) {
        const dialog = state.dialog;
        if (!dialog) {
            return null;
        }

        const h = webexpress.webui.h;
        const close = this._handler("dialog", "close", () => ({ click: () => this._closeDialog() }));

        let body;
        let footer;

        if (dialog.kind === "confirm") {
            body = h("div", { key: "body", class: "wx-graph-modal-body" }, h("p", null, dialog.message));
            footer = [
                h("button", { key: "cancel", class: "wx-simple-btn wx-graph-modal-btn", on: close },
                    this._i18n("webexpress.webui:cancel", "Cancel")),
                h("button", {
                    key: "confirm",
                    class: "wx-simple-btn wx-graph-modal-btn wx-graph-modal-btn--danger",
                    on: this._handler("dialog", "confirm", () => ({
                        click: () => {
                            const action = this._confirmAction;
                            this._closeDialog();
                            if (action) {
                                action();
                            }
                        }
                    }))
                }, this._i18n("webexpress.webui:delete", "Delete"))
            ];
        } else {
            body = h("div", {
                key: "fields" + dialog.token,
                class: "wx-graph-modal-body",
                keep: true,
                ref: (el) => this._fillPropertiesDialog(el, dialog)
            });
            footer = [
                h("button", { key: "cancel", class: "wx-simple-btn wx-graph-modal-btn", on: close },
                    this._i18n("webexpress.webui:cancel", "Cancel")),
                h("button", {
                    key: "apply",
                    class: "wx-simple-btn wx-graph-modal-btn wx-graph-modal-btn--primary",
                    on: this._handler("dialog", "apply", () => ({ click: () => this._applyPropertiesDialog() }))
                }, this._i18n("webexpress.webui:graph.apply", "Apply"))
            ];
        }

        // attached to the host so position: absolute works correctly
        return h("div", { key: "dialog", class: "wx-graph-modal-backdrop" },
            h("div", { class: "wx-graph-modal-dialog" },
                h("div", { key: "header", class: "wx-graph-modal-header" },
                    h("span", { key: "title" }, dialog.title),
                    h("span", {
                        key: "close",
                        style: dialog.kind === "confirm" ? { cursor: "pointer" } : { cursor: "pointer", fontSize: "20px" },
                        on: close
                    }, "×")),
                body,
                h("div", { key: "footer", class: "wx-graph-modal-footer" }, footer)));
    }

    /**
     * Closes the open dialog.
     */
    _closeDialog() {
        this._confirmAction = null;
        this.setState({ dialog: null });
        this._store.flush();
    }

    /**
     * Initiates deletion with a confirmation dialog for nodes.
     */
    _requestDelete() {
        // a selected waypoint is the narrower target: removing it must not take
        // the whole edge with it
        if (this._selectedEdgeId && this._selectedWaypointIndex !== null) {
            const edge = this._selectedEdge();
            if (edge && Array.isArray(edge.waypoints) && edge.waypoints[this._selectedWaypointIndex]) {
                this._saveStateToHistory();
                edge.waypoints.splice(this._selectedWaypointIndex, 1);
                this._selectedWaypointIndex = edge.waypoints.length > 0
                    ? Math.min(this._selectedWaypointIndex, edge.waypoints.length - 1)
                    : null;
                this.render();
                this._emitChangeSafe();
                return;
            }
            this._selectedWaypointIndex = null;
        }

        if (this._selectedNodeId) {
            this._openConfirmationModal(
                this._i18n("webexpress.webui:graph.delete.node", "Delete Node"),
                this._i18n("webexpress.webui:graph.delete.confirm", "Are you sure you want to delete this node and all connected edges?"),
                () => {
                    this._deleteSelected();
                }
            );
        } else if (this._selectedEdgeId) {
            this._deleteSelected();
        }
    }

    /**
     * Opens a confirmation modal dialog.
     * @param {string} title - dialog title
     * @param {string} message - confirmation message
     * @param {Function} onConfirm - callback when user confirms
     */
    _openConfirmationModal(title, message, onConfirm) {
        this._confirmAction = onConfirm;
        this.setState({ dialog: { kind: "confirm", token: ++this._dialogToken, title: title, message: message } });
        this._store.flush();
    }

    /**
     * Deletes the currently selected node or edge from the model.
     */
    _deleteSelected() {
        this._saveStateToHistory();

        let changed = false;
        const selectedEdge = this._selectedEdgeId;
        const selectedNode = this._selectedNodeId;
        if (selectedEdge) {
            const before = this._model.edges.length;
            this._model.edges = this._model.edges.filter(t => (t.id || "") !== selectedEdge);
            if (this._model.edges.length !== before) {
                changed = true;
            }
        }
        if (selectedNode) {
            const beforeNodes = this._model.nodes.length;
            this._model.nodes = this._model.nodes.filter(n => n.id !== selectedNode);
            const beforeEdges = this._model.edges.length;
            this._model.edges = this._model.edges.filter(e => e.from !== selectedNode && e.to !== selectedNode);
            if (this._model.nodes.length !== beforeNodes || this._model.edges.length !== beforeEdges) {
                changed = true;
            }
            if (this._edgeSourceNode === selectedNode) {
                this._edgeSourceNode = null;
            }
        }
        if (changed) {
            this._deselectAll();
            this._buildPhysics();
            this.render();
            this._emitChangeSafe();
        }
    }

    /**
     * Opens the properties modal for the currently selected node or edge.
     */
    _openPropertiesModal() {
        if (!this._selectedNodeId && !this._selectedEdgeId) {
            return;
        }

        const node = this._selectedNodeId ? this._model.nodes.find(n => n.id === this._selectedNodeId) : null;
        const edge = !node && this._selectedEdgeId ? this._model.edges.find(e => (e.id || "") === this._selectedEdgeId) : null;

        this.setState({
            dialog: {
                kind: "properties",
                token: ++this._dialogToken,
                nodeId: node ? node.id : null,
                edgeId: edge ? edge.id || "" : null,
                title: node
                    ? this._i18n("webexpress.webui:graph.edit.node", "Edit Node")
                    : this._i18n("webexpress.webui:graph.edit.edge", "Edit Edge")
            }
        });
        this._store.flush();
    }

    /**
     * Builds the fields of the properties dialog into its body once per dialog.
     * @param {HTMLElement} body - The dialog body.
     * @param {object} dialog - The dialog state.
     */
    _fillPropertiesDialog(body, dialog) {
        this._dialogBody = body;
        if (body._wxDialogToken === dialog.token) {
            return;
        }
        body._wxDialogToken = dialog.token;
        body.replaceChildren();

        // the field ids repeat per dialog, so the controls of a previous dialog
        // must not be read back into this one
        this._colorControls = {};
        this._dashValues = {};

        if (dialog.nodeId) {
            const target = this._model.nodes.find(n => n.id === dialog.nodeId);
            if (target) {
                this._addModalInput(body, this._i18n("webexpress.webui:graph.label", "Label"), "text", target.label || "", "inp-label");
                this._addModalColor(body, this._i18n("webexpress.webui:graph.background", "Background"), target.backgroundColor || "#ffffff", "inp-bgcolor");
                this._addModalColor(body, this._i18n("webexpress.webui:graph.textcolor", "Text Color"), target.foregroundColor || "#000000", "inp-fgcolor");
                this._addModalSelect(body, this._i18n("webexpress.webui:graph.shape", "Shape"), ["rect", "circle"], target.shape, "inp-shape");
                this._addModalSelect(body, this._i18n("webexpress.webui:graph.layout", "Layout"), ["label-inside", "label-below"], target.layout, "inp-layout");
                this._addModalInput(body, this._i18n("webexpress.webui:graph.uri", "URI (Link)"), "text", target.uri || "", "inp-uri");
            }
        } else if (dialog.edgeId !== null) {
            const target = this._model.edges.find(e => (e.id || "") === dialog.edgeId);
            if (target) {
                this._addModalInput(body, this._i18n("webexpress.webui:graph.label", "Label"), "text", target.label || "", "inp-label");
                this._addModalColor(body, this._i18n("webexpress.webui:graph.color", "Color"), target.color || "#000000", "inp-color");
                this._addModalDash(body, this._i18n("webexpress.webui:graph.dasharray", "Stroke pattern"),
                    target.dasharray || "", target.color || "#000000", "inp-dash");
            }
        }
    }

    /**
     * Writes the fields of the properties dialog back into the model and closes it.
     */
    _applyPropertiesDialog() {
        const dialog = this.state.dialog;
        const body = this._dialogBody;
        if (!dialog || !body) {
            return;
        }

        if (dialog.nodeId) {
            const target = this._model.nodes.find(n => n.id === dialog.nodeId);
            if (!target) {
                return;
            }
            this._saveStateToHistory();

            // sync visual position to model before applying changes
            const visualNode = this._nodes.find(n => n.id === dialog.nodeId);
            if (visualNode) {
                this._syncModelPosition(visualNode);
            }

            target.label = body.querySelector("#inp-label").value;
            target.backgroundColor = this._readModalColor(body, "inp-bgcolor", target.backgroundColor);
            target.foregroundColor = this._readModalColor(body, "inp-fgcolor", target.foregroundColor);
            target.shape = body.querySelector("#inp-shape").value;
            target.layout = body.querySelector("#inp-layout").value;
            target.uri = body.querySelector("#inp-uri").value;

            this._buildPhysics();
        } else {
            const target = this._model.edges.find(e => (e.id || "") === dialog.edgeId);
            if (!target) {
                return;
            }
            this._saveStateToHistory();
            target.label = body.querySelector("#inp-label").value;
            target.color = this._readModalColor(body, "inp-color", target.color);
            target.dasharray = this._dashValues ? (this._dashValues["inp-dash"] || "") : target.dasharray;
        }

        this.setState({ dialog: null });
        this.render();
        this._emitChangeSafe();
    }

    /**
     * Adds a labeled input field to a modal container.
     * @param {HTMLElement} container - parent element
     * @param {string} label - field label text
     * @param {string} type - input type attribute
     * @param {string} value - initial input value
     * @param {string} id - input element id
     */
    _addModalInput(container, label, type, value, id) {
        const div = document.createElement("div");
        div.className = "wx-graph-form-group";
        const lbl = document.createElement("label");
        lbl.textContent = label;
        const inp = document.createElement("input");
        inp.type = type;
        inp.id = id;
        inp.value = value;
        div.appendChild(lbl);
        div.appendChild(inp);
        container.appendChild(div);
    }

    /**
     * Adds a labeled colour field to a modal container.
     *
     * The framework colour control (ControlFormItemInputColor and its
     * InputColorCtrl counterpart) is used when it is part of the bundle, so the
     * dialog offers the same curated palette as every other colour field;
     * otherwise the row degrades to the native input.
     * @param {HTMLElement} container - parent element
     * @param {string} label - field label text
     * @param {string} value - initial colour value
     * @param {string} id - element id used to read the value back
     */
    _addModalColor(container, label, value, id) {
        if (!webexpress.webui.Controller
            || !webexpress.webui.Controller.classRegistry
            || !webexpress.webui.Controller.classRegistry.has("wx-webui-input-color")) {
            this._addModalInput(container, label, "color", value, id);
            return;
        }

        const div = document.createElement("div");
        div.className = "wx-graph-form-group";

        const lbl = document.createElement("label");
        lbl.textContent = label;
        div.appendChild(lbl);

        const host = document.createElement("div");
        host.className = "wx-webui-input-color";
        host.id = id;
        host.dataset.value = value;
        div.appendChild(host);
        container.appendChild(div);

        // the control consumes the id it was given, so the current colour is
        // read back from the instance rather than from a form element
        webexpress.webui.Controller.createInstances(host);
        this._colorControls = this._colorControls || {};
        this._colorControls[id] = webexpress.webui.Controller.getInstanceByElement
            ? webexpress.webui.Controller.getInstanceByElement(host)
            : null;
    }

    /**
     * Reads a colour back from a modal field, whichever variant was rendered.
     * @param {HTMLElement} container - the modal body
     * @param {string} id - the field id
     * @param {string} fallback - the value to use when the field is missing
     * @returns {string} the selected colour
     */
    _readModalColor(container, id, fallback) {
        const control = this._colorControls ? this._colorControls[id] : null;
        if (control) {
            return control.value;
        }
        const input = container.querySelector("#" + id);
        return input ? input.value : fallback;
    }

    /**
     * The stroke patterns the graphical dash picker offers. The value is the
     * SVG stroke-dasharray; an empty value is a solid line.
     * @returns {Array<{value: string, key: string}>} The patterns.
     */
    static get DASH_PATTERNS() {
        return [
            { value: "", key: "graph.dash.solid" },
            { value: "6 3", key: "graph.dash.dashed" },
            { value: "2 3", key: "graph.dash.dotted" },
            { value: "10 4", key: "graph.dash.long" },
            { value: "10 3 2 3", key: "graph.dash.dashdot" }
        ];
    }

    /**
     * Builds a graphical picker for the stroke pattern.
     *
     * A dasharray is a rendering instruction, not a quantity: "10 3 2 3" tells
     * nobody what the line will look like, so the choice is offered as drawn
     * samples and the numbers stay an implementation detail.
     * @param {string} value - the current dasharray
     * @param {string} color - the colour to draw the samples in
     * @param {Function} onChange - (string) => void, called with the new dasharray
     * @returns {HTMLElement} the picker element
     */
    _buildDashPicker(value, color, onChange) {
        const wrap = document.createElement("div");
        wrap.className = "wx-graph-dash-picker";
        wrap.setAttribute("role", "radiogroup");

        const current = (value || "").trim();
        const stroke = color || "currentColor";

        for (const pattern of webexpress.webui.GraphEditorCtrl.DASH_PATTERNS) {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "wx-graph-dash-option";
            option.dataset.dash = pattern.value;
            option.title = this._i18n("webexpress.webui:" + pattern.key, pattern.value || "solid");
            option.setAttribute("role", "radio");

            const selected = pattern.value === current;
            option.setAttribute("aria-checked", selected ? "true" : "false");
            if (selected) {
                option.classList.add("is-active");
            }

            const sample = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            sample.setAttribute("class", "wx-graph-dash-sample");
            sample.setAttribute("viewBox", "0 0 64 8");
            sample.setAttribute("aria-hidden", "true");

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", "2");
            line.setAttribute("y1", "4");
            line.setAttribute("x2", "62");
            line.setAttribute("y2", "4");
            line.setAttribute("stroke", stroke);
            line.setAttribute("stroke-width", "2");
            line.setAttribute("stroke-linecap", "round");
            if (pattern.value) {
                line.setAttribute("stroke-dasharray", pattern.value);
            }
            sample.appendChild(line);
            option.appendChild(sample);

            option.addEventListener("click", (e) => {
                e.stopPropagation();
                for (const sibling of wrap.querySelectorAll(".wx-graph-dash-option")) {
                    const isActive = sibling === option;
                    sibling.classList.toggle("is-active", isActive);
                    sibling.setAttribute("aria-checked", isActive ? "true" : "false");
                }
                onChange(pattern.value);
            });

            wrap.appendChild(option);
        }

        return wrap;
    }

    /**
     * Adds a labeled stroke-pattern picker to a modal container.
     * @param {HTMLElement} container - parent element
     * @param {string} label - field label text
     * @param {string} value - the current dasharray
     * @param {string} color - the edge colour the samples are drawn in
     * @param {string} id - the field id used to read the value back
     */
    _addModalDash(container, label, value, color, id) {
        const div = document.createElement("div");
        div.className = "wx-graph-form-group";

        const lbl = document.createElement("label");
        lbl.textContent = label;
        div.appendChild(lbl);

        this._dashValues = this._dashValues || {};
        this._dashValues[id] = value || "";

        div.appendChild(this._buildDashPicker(value, color, (next) => {
            this._dashValues[id] = next;
        }));
        container.appendChild(div);
    }

    /**
     * Adds a labeled select field to a modal container.
     * @param {HTMLElement} container - parent element
     * @param {string} label - field label text
     * @param {string[]} options - available option values
     * @param {string} value - currently selected value
     * @param {string} id - select element id
     */
    _addModalSelect(container, label, options, value, id) {
        const div = document.createElement("div");
        div.className = "wx-graph-form-group";
        const lbl = document.createElement("label");
        lbl.textContent = label;
        const sel = document.createElement("select");
        sel.id = id;
        options.forEach(o => {
            const opt = document.createElement("option");
            opt.value = o;
            opt.textContent = o;
            if (o === value) {
                opt.selected = true;
            }
            sel.appendChild(opt);
        });
        div.appendChild(lbl);
        div.appendChild(sel);
        container.appendChild(div);
    }

    // ------------------------------------------------------------------ modes & actions

    /**
     * Toggles the add-edge mode on or off.
     * @param {boolean} active - whether to activate or deactivate
     */
    _toggleAddEdgeMode(active) {
        this._deselectAll();
        this.setState({ addEdge: !!active, edgeSource: null, preview: null });
        this._updateToolbarState();
        this.render();
    }

    /**
     * Resets the add-edge mode to inactive.
     */
    _resetAddEdgeMode() {
        this._toggleAddEdgeMode(false);
    }

    /**
     * Adds a new node at the center of the current viewport.
     */
    _addNode() {
        this._saveStateToHistory();
        const center = this._viewportCenter();
        const newNode = {
            id: "n-" + Date.now() + this._idSuffix(),
            label: this._i18n("webexpress.webui:graph.new.node", "New Node"),
            x: center.x,
            y: center.y,
            layout: "label-inside",
            shape: "rect",
            backgroundColor: "#ffffff",
            foregroundColor: "#000000",
            uri: ""
        };
        this._model.nodes.push(newNode);
        this._deselectAll();
        this._selectedNodeId = newNode.id;

        this._buildPhysics();

        this.render();
        this._updateToolbarState();
        this._emitChangeSafe();
    }

    /**
     * Exports the current graph as an SVG file download.
     */
    exportSvg() {
        const svgClone = this._svg.cloneNode(true);
        svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const toRemove = svgClone.querySelectorAll(
            "[data-layer='markers'], [data-layer='handles'], [data-layer='waypoints'], [data-layer='preview'], [data-layer='alignment']"
        );
        toRemove.forEach(el => {
            el.remove();
        });
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgClone);
        const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "graph.svg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Clears all selection state, preview layers, and hover effects.
     */
    _deselectAll() {
        this.setState({
            selectedEdge: null,
            selectedNode: null,
            selectedWaypoint: null,
            hoveredNode: null,
            endpointDrag: null,
            preview: null
        });
        this.render();
        this._updateToolbarState();
    }

    /**
     * Ends a gesture that is still running and releases what the editor added.
     */
    destroy() {
        this._endpointDrag = null;
        this._dragSnapshot = null;

        // the base teardown releases the recorded listeners and the frame loop and
        // empties the host, the toolbar with it
        super.destroy();
    }

    /**
     * Handles pointer move for endpoint dragging, edge creation preview,
     * and target node highlighting. The marks it sets are painted on the next frame.
     * @param {PointerEvent} e - the pointer event
     */
    _onPointerMove(e) {
        const local = this._toLocalSafe(e);

        if (this._endpointDrag) {
            // determine hovered target node and store as state
            const node = this._nearestNodeAt(local.x, local.y, 18);
            this.setState({
                endpointDrag: Object.assign({}, this._endpointDrag, { current: { x: local.x, y: local.y } }),
                hoveredNode: node ? node.id : null
            });
            return;
        }

        if (this._isAddEdgeMode && this._edgeSourceNode) {
            const node = this._nearestNodeAt(local.x, local.y, 18);
            const target = node && node.id !== this._edgeSourceNode ? node : null;
            const srcNode = this._nodes.find(n => n.id === this._edgeSourceNode);
            let preview = null;

            if (srcNode) {
                // the line runs to the centre of the node it would connect, or to the pointer
                const targetPoint = target ? { x: target.x, y: target.y } : { x: local.x, y: local.y };
                preview = [
                    this._nodeEdgePoint(srcNode, targetPoint),
                    target ? this._nodeEdgePoint(target, srcNode) : targetPoint
                ];
            }

            this.setState({ hoveredNode: target ? target.id : null, preview: preview });
        }
    }

    /**
     * Handles global pointer up to finalize endpoint drag operations.
     * @param {PointerEvent} e - the pointer event
     */
    _onPointerUpGlobal(e) {
        const drag = this._endpointDrag;
        if (!drag) {
            return;
        }
        const t = this._model.edges.find(tr => (tr.id || "") === drag.edgeId);

        try {
            this._svg.releasePointerCapture(e.pointerId);
        } catch (err) {
            // pointer capture may already be released
        }

        if (!t) {
            this.setState({ endpointDrag: null, hoveredNode: null });
            this.render();
            return;
        }

        const local = this._toLocalSafe(e);
        const node = this._nearestNodeAt(local.x, local.y, 18);
        let changed = false;

        if (node) {
            const which = drag.which === "from" ? "from" : "to";
            if (t[which] !== node.id) {
                this._saveStateToHistory();
                changed = true;
            }
            t[which] = node.id;
        }

        this.setState({ endpointDrag: null, hoveredNode: null });
        this.render();

        if (changed) {
            this._emitChangeSafe();
        }
    }

    /**
     * Decides whether a global key press is meant for this editor.
     *
     * The handler is registered on the window, because the canvas is an SVG the
     * user does not necessarily focus before reaching for a key. That reach has
     * to be narrow: a page can host several graphs and arbitrary other forms,
     * and a Delete pressed in a text field must never reach a graph. A key press
     * therefore only counts when it originates inside this control's own host
     * and does not come from a control that consumes text input itself.
     * @param {KeyboardEvent} e - the keyboard event
     * @returns {boolean} true when the editor should act on the event
     */
    _ownsKeyEvent(e) {
        if (this._destroyed || !this._element || !this._element.isConnected) {
            return false;
        }

        const target = e.target;
        if (!target || target.nodeType !== 1) {
            return false;
        }

        // a field that consumes the key itself keeps it, whether it belongs to
        // this editor (the properties panel) or to an unrelated form
        const tag = (target.tagName || "").toUpperCase();
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
            return false;
        }

        if (this._element.contains(target)) {
            return true;
        }

        // some browsers report body as the target while the focus sits on the
        // canvas; the focused element is then the authoritative signal
        const active = document.activeElement;
        return !!active && active !== document.body && this._element.contains(active);
    }

    /**
     * Handles keyboard shortcuts. Events that did not originate in this editor
     * are ignored, so neither a second graph on the page nor a foreign form
     * loses data to a shortcut meant for someone else.
     *
     * The canvas is fully operable from the keyboard: the arrows move the
     * selection between nodes (or along the waypoints of a selected edge),
     * Alt+arrow moves the selected node or waypoint, Ctrl+Enter starts an edge
     * from the selected node and Enter completes it on the next one.
     * @param {KeyboardEvent} e - the keyboard event
     */
    _onKeyDown(e) {
        // an open dialog sits inside the host but is modal: its buttons and fields keep
        // their keys, and the canvas shortcuts would act on a graph the user cannot see
        if (this.state.dialog && !this._destroyed
            && (this._element.contains(e.target) || this._element.contains(document.activeElement))) {
            if (e.key === "Escape") {
                e.preventDefault();
                this._closeDialog();
            }
            return;
        }

        if (!this._ownsKeyEvent(e)) {
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
            e.preventDefault();
            this._undo();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            e.preventDefault();
            this._redo();
            return;
        }

        if (e.key === "Delete") {
            e.preventDefault();
            this._requestDelete();
            return;
        }
        if (e.key === "Escape") {
            if (this._isAddEdgeMode) {
                this._resetAddEdgeMode();
            }
            this._deselectAll();
            this._announceSelection();
            return;
        }

        if (e.key.startsWith("Arrow")) {
            const direction = webexpress.webui.GraphEditorCtrl.ARROW_DIRECTIONS[e.key];
            if (!direction) {
                return;
            }
            e.preventDefault();
            if (e.altKey) {
                this._nudgeSelection(direction, e.shiftKey ? 1 : webexpress.webui.GraphEditorCtrl.NUDGE_STEP);
            } else {
                this._moveSelection(direction);
            }
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            this._activateSelection(e.ctrlKey || e.metaKey);
            return;
        }
        if (e.key === "Insert") {
            e.preventDefault();
            this._insertWaypointByKeyboard();
            return;
        }
        if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            this._zoomAt(1.1);
            return;
        }
        if (e.key === "-") {
            e.preventDefault();
            this._zoomAt(0.9);
            return;
        }
        if (e.key === "0") {
            e.preventDefault();
            this._fitToView();
        }
    }

    /**
     * Moves the selection one step in the given direction. While an edge with
     * waypoints is selected the step walks its waypoints, otherwise it walks
     * the nodes by geometry, which is what the eye expects from an arrow key on
     * a canvas.
     * @param {{x: number, y: number}} direction - the unit direction
     */
    _moveSelection(direction) {
        if (this._selectedEdgeId && this._selectedWaypointIndex !== null) {
            const edge = this._selectedEdge();
            const count = edge && Array.isArray(edge.waypoints) ? edge.waypoints.length : 0;
            if (count > 0 && direction.y === 0) {
                const step = direction.x > 0 ? 1 : -1;
                this._selectedWaypointIndex = (this._selectedWaypointIndex + step + count) % count;
                this.render();
                this._announceSelection();
                return;
            }
            // a vertical step leaves the waypoints and returns to the nodes
            this._selectedWaypointIndex = null;
        }

        const next = this._nodeInDirection(direction);
        if (!next) {
            return;
        }

        // a pending edge source stays while the target is being picked
        this._selectedNodeId = next.id;
        this._selectedEdgeId = null;
        if (!(this._isAddEdgeMode && this._edgeSourceNode)) {
            this._selectedWaypointIndex = null;
        }
        this.render();
        this._updateToolbarState();
        this._announceSelection();
    }

    /**
     * Picks the node that best continues a movement in the given direction:
     * the closest one that actually lies ahead, with the sideways offset
     * weighted more heavily so the step stays on course.
     * @param {{x: number, y: number}} direction - the unit direction
     * @returns {object|null} the node to select, or null when there is none
     */
    _nodeInDirection(direction) {
        if (!this._nodes || this._nodes.length === 0) {
            return null;
        }

        const current = this._nodes.find(n => n.id === this._selectedNodeId);
        if (!current) {
            // no anchor yet: enter the graph at the node closest to its top left
            return this._nodes.reduce((best, n) => {
                return !best || (n.x + n.y) < (best.x + best.y) ? n : best;
            }, null);
        }

        let best = null;
        let bestScore = Infinity;

        for (const candidate of this._nodes) {
            if (candidate === current) {
                continue;
            }
            const dx = candidate.x - current.x;
            const dy = candidate.y - current.y;
            const along = dx * direction.x + dy * direction.y;
            if (along <= 0) {
                continue;
            }
            const across = Math.abs(dx * direction.y - dy * direction.x);
            const score = along + across * 2;
            if (score < bestScore) {
                bestScore = score;
                best = candidate;
            }
        }
        return best;
    }

    /**
     * Moves the selected node or waypoint by a fixed step, which is the
     * keyboard counterpart of dragging it.
     * @param {{x: number, y: number}} direction - the unit direction
     * @param {number} step - the distance in local units
     */
    _nudgeSelection(direction, step) {
        const dx = direction.x * step;
        const dy = direction.y * step;

        if (this._selectedEdgeId && this._selectedWaypointIndex !== null) {
            const edge = this._selectedEdge();
            const waypoint = edge && Array.isArray(edge.waypoints)
                ? edge.waypoints[this._selectedWaypointIndex]
                : null;
            if (!waypoint) {
                return;
            }
            this._saveStateToHistory();
            waypoint.x += dx;
            waypoint.y += dy;
            this.render();
            this._emitChangeSafe();
            return;
        }

        if (!this._selectedNodeId) {
            return;
        }
        const visual = this._nodes.find(n => n.id === this._selectedNodeId);
        if (!visual) {
            return;
        }

        this._saveStateToHistory();
        visual.x += dx;
        visual.y += dy;
        this._syncModelPosition(visual);
        this.render();
        this._emitChangeSafe();
    }

    /**
     * Acts on the current selection: Ctrl+Enter starts an edge at the selected
     * node, a plain Enter completes a pending edge or opens the properties of
     * whatever is selected.
     * @param {boolean} withModifier - whether Ctrl or Meta was held
     */
    _activateSelection(withModifier) {
        if (withModifier && this._selectedNodeId) {
            // the mode toggle clears the selection, so the source has to be
            // captured before it and restored afterwards
            const source = this._selectedNodeId;
            this._toggleAddEdgeMode(true);
            this._edgeSourceNode = source;
            this._selectedNodeId = source;
            this.render();
            this._announce(this._i18n("webexpress.webui:graph.a11y.edge.started", "Edge started"));
            return;
        }

        if (this._isAddEdgeMode && this._edgeSourceNode && this._selectedNodeId
            && this._selectedNodeId !== this._edgeSourceNode) {
            const source = this._edgeSourceNode;
            const target = this._selectedNodeId;
            this.setState({ edgeSource: null, addEdge: false, preview: null });
            this._createEdgeAndEmit(source, target);
            this._announce(this._i18n("webexpress.webui:graph.a11y.edge.created", "Edge created"));
            return;
        }

        if (this._selectedNodeId || this._selectedEdgeId) {
            this._openPropertiesModal();
        }
    }

    /**
     * Adds a waypoint to the selected edge at the middle of its longest visible
     * segment and selects it, so it can be moved with Alt+arrow right away.
     */
    _insertWaypointByKeyboard() {
        const edge = this._selectedEdge();
        if (!edge) {
            return;
        }
        const pts = this._edgePoints(edge);
        if (pts.length < 2) {
            return;
        }

        let bestIndex = 0;
        let bestLength = -1;
        for (let i = 0; i < pts.length - 1; i++) {
            const length = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
            if (length > bestLength) {
                bestLength = length;
                bestIndex = i;
            }
        }

        this._saveStateToHistory();
        edge.waypoints = Array.isArray(edge.waypoints) ? edge.waypoints : [];
        const insertAt = Math.min(Math.max(bestIndex, 0), edge.waypoints.length);
        edge.waypoints.splice(insertAt, 0, {
            x: (pts[bestIndex].x + pts[bestIndex + 1].x) / 2,
            y: (pts[bestIndex].y + pts[bestIndex + 1].y) / 2
        });
        this._selectedWaypointIndex = insertAt;

        this.render();
        this._emitChangeSafe();
        this._announceSelection();
    }

    /**
     * Returns the currently selected edge.
     * @returns {object|null} the edge or null
     */
    _selectedEdge() {
        if (!this._selectedEdgeId) {
            return null;
        }
        return this._model.edges.find(e => (e.id || "") === this._selectedEdgeId) || null;
    }

    /**
     * Speaks the current selection through the canvas live region, which is the
     * only channel that carries selection state to assistive technology.
     */
    _announceSelection() {
        if (this._selectedEdgeId && this._selectedWaypointIndex !== null) {
            this._announce(this._i18n("webexpress.webui:graph.a11y.waypoint", "Waypoint")
                + " " + (this._selectedWaypointIndex + 1));
            return;
        }
        if (this._selectedNodeId) {
            const node = this._model.nodes.find(n => n.id === this._selectedNodeId);
            this._announce(this._i18n("webexpress.webui:graph.a11y.node", "Node")
                + ": " + (node ? (node.label || node.id) : this._selectedNodeId));
            return;
        }
        if (this._selectedEdgeId) {
            const edge = this._selectedEdge();
            this._announce(this._i18n("webexpress.webui:graph.a11y.edge", "Edge")
                + ": " + (edge ? (edge.label || edge.id) : this._selectedEdgeId));
            return;
        }
        this._announce(this._i18n("webexpress.webui:graph.a11y.selection.none", "Selection cleared"));
    }

    /**
     * Returns a stable identifier for an edge.
     * @param {Object} t - edge object
     * @param {number} idx - fallback index
     * @returns {string} edge identifier
     */
    _edgeId(t, idx) {
        return t.id || ("t-" + idx);
    }

    /**
     * Attempts to select the nearest edge within a pixel tolerance of a click event.
     * @param {MouseEvent} e - the click event
     * @param {number} tolerancePx - pixel tolerance for hit testing
     * @returns {boolean} true if an edge was found and selection changed
     */
    _selectEdgeNear(e, tolerancePx) {
        const local = this._toLocalSafe(e);
        const near = this._nearestEdgeAt(local.x, local.y, tolerancePx);
        if (!near || !near.edge) {
            return false;
        }
        const edgeId = this._edgeId(near.edge, -1);
        if (this._selectedEdgeId === edgeId) {
            this._selectedEdgeId = null;
        } else {
            this._selectedEdgeId = edgeId;
            this._selectedNodeId = null;
        }
        this._endpointDrag = null;
        this.render();
        this._updateToolbarState();
        return true;
    }

    /**
     * Builds the physics simulation and immediately disables it for editor mode.
     * @returns {boolean} always false
     */
    _buildPhysics() {
        super._buildPhysics();
        this._physicsEnabled = false;
        return false;
    }

    /**
     * Prevents automatic physics animation from starting in editor mode.
     */
    _startAnimation() {
        // editor mode does not use physics animation
    }

    // ------------------------------------------------------------------ dragging

    /**
     * Attaches temporary pointermove and pointerup listeners for drag operations.
     * A move renders on the next frame; the release takes a single undo step.
     * @param {SVGElement} target - the element being dragged
     */
    _attachDragListeners(target) {
        const alignmentTargets = this._collectAlignmentTargets();
        const move = (e) => {
            if (!this._drag) {
                return;
            }
            const p = this._toLocalSafe(e);
            const dx = p.x - this._drag.startX;
            const dy = p.y - this._drag.startY;
            if (dx !== 0 || dy !== 0) {
                this._drag.hasMoved = true;
            }

            if (this._drag.type === "node") {
                const node = this._nodes.find(n => n.id === this._drag.id);
                if (node) {
                    const position = this._alignDragPosition({
                        x: this._drag.nodeStartX + dx,
                        y: this._drag.nodeStartY + dy
                    }, node.width, node.height, alignmentTargets);
                    node.x = position.x;
                    node.y = position.y;
                    this._syncModelPosition(node);
                    this._updateGeometry();
                }
            } else if (this._drag.type === "waypoint") {
                const tr = this._model.edges.find(t => (t.id || "") === this._drag.edgeId);
                if (tr && tr.waypoints && tr.waypoints[this._drag.index]) {
                    const position = this._alignDragPosition({
                        x: this._drag.wpStartX + dx,
                        y: this._drag.wpStartY + dy
                    }, 0, 0, alignmentTargets);
                    tr.waypoints[this._drag.index].x = position.x;
                    tr.waypoints[this._drag.index].y = position.y;
                    this._updateGeometry();
                }
            }
        };

        const up = () => {
            if (this._drag && target && typeof target.releasePointerCapture === "function") {
                try {
                    target.releasePointerCapture(this._drag.pointerId);
                } catch (err) {
                    // pointer capture may already be released
                }
            }

            // push pre-drag snapshot to undo stack if the element actually moved
            if (this._drag && this._drag.hasMoved && this._dragSnapshot) {
                this._pushHistory(this._undoStack, JSON.parse(this._dragSnapshot));
                this._redoStack = [];
            }

            this._dragSnapshot = null;
            this._drag = null;
            this._clearAlignmentGuides();
            this._removeWindowListener("pointermove", move);
            this._removeWindowListener("pointerup", up);
            this._removeWindowListener("pointercancel", up);
            this._updateToolbarState();
            this._emitChangeSafe();
        };

        this._addWindowListener("pointermove", move);
        this._addWindowListener("pointerup", up);
        this._addWindowListener("pointercancel", up);
    }

    /**
     * Captures stationary alignment references so moving geometry cannot attract itself.
     * @returns {{x: object[], y: object[]}} Node bounds and edge routing references by axis.
     */
    _collectAlignmentTargets() {
        const targets = { x: [], y: [] };
        for (const node of this._nodes) {
            if (this._drag.type === "node" && node.id === this._drag.id) {
                continue;
            }
            for (const offset of [-0.5, 0, 0.5]) {
                targets.x.push({ value: node.x + node.width * offset, start: node.y - node.height / 2, end: node.y + node.height / 2 });
                targets.y.push({ value: node.y + node.height * offset, start: node.x - node.width / 2, end: node.x + node.width / 2 });
            }
        }
        for (const edge of this._model.edges) {
            if (this._drag.type === "node" && (edge.from === this._drag.id || edge.to === this._drag.id)) {
                continue;
            }
            const points = this._edgePoints(edge);
            const movingIndex = this._drag.type === "waypoint" && edge.id === this._drag.edgeId
                ? this._drag.index + 1 : -1;
            points.forEach((point, index) => {
                if (index === movingIndex) {
                    return;
                }
                targets.x.push({ value: point.x, start: point.y, end: point.y });
                targets.y.push({ value: point.y, start: point.x, end: point.x });
                const next = points[index + 1];
                if (next && index + 1 !== movingIndex) {
                    targets.x.push({ value: (point.x + next.x) / 2, start: Math.min(point.y, next.y), end: Math.max(point.y, next.y) });
                    targets.y.push({ value: (point.y + next.y) / 2, start: Math.min(point.x, next.x), end: Math.max(point.x, next.x) });
                }
            });
        }
        return targets;
    }

    /**
     * Aligns a dragged node or waypoint and puts the references that caused it to snap
     * into the state, where they are drawn as guides.
     * @param {{x: number, y: number}} position - The unsnapped center in graph coordinates.
     * @param {number} width - The node width, or zero for a waypoint.
     * @param {number} height - The node height, or zero for a waypoint.
     * @param {{x: object[], y: object[]}} targets - Stationary references captured at drag start.
     * @returns {{x: number, y: number}} The aligned position, falling back to the configured grid.
     */
    _alignDragPosition(position, width, height, targets) {
        const tolerance = webexpress.webui.GraphEditorCtrl.ALIGNMENT_TOLERANCE / (this._scale || 1);
        const size = { x: width, y: height };
        const result = {};
        const matches = {};
        for (const axis of ["x", "y"]) {
            let distance = tolerance;
            for (const offset of size[axis] ? [0, -size[axis] / 2, size[axis] / 2] : [0]) {
                for (const target of targets[axis]) {
                    const delta = target.value - position[axis] - offset;
                    if (Math.abs(delta) <= distance) {
                        distance = Math.abs(delta);
                        matches[axis] = { target, value: position[axis] + delta };
                    }
                }
            }
            // grid coordinates refer to the stored top-left corner of a node
            result[axis] = matches[axis] ? matches[axis].value
                : this._snapToGrid(position[axis] - size[axis] / 2) + size[axis] / 2;
        }

        const guides = [];
        for (const axis of ["x", "y"]) {
            if (!matches[axis]) {
                continue;
            }
            const other = axis === "x" ? "y" : "x";
            const target = matches[axis].target;
            const padding = 12 / (this._scale || 1);
            guides.push({
                [axis + "1"]: target.value,
                [axis + "2"]: target.value,
                [other + "1"]: Math.min(target.start, result[other] - size[other] / 2) - padding,
                [other + "2"]: Math.max(target.end, result[other] + size[other] / 2) + padding
            });
        }
        this.setState({ guides: guides });
        return result;
    }

    /**
     * Removes transient references when the pointer leaves alignment or the gesture ends.
     */
    _clearAlignmentGuides() {
        if (this.state.guides && this.state.guides.length > 0) {
            this.setState({ guides: [] });
        }
    }

    // ------------------------------------------------------------------ geometry queries

    /**
     * Computes the polyline points for an edge including waypoints and border clipping.
     * @param {Object} t - edge object with from, to, and waypoints
     * @returns {{x: number, y: number}[]} array of points
     */
    _edgePoints(t) {
        const src = this._nodes.find(s => s.id === t.from);
        const dst = this._nodes.find(s => s.id === t.to);
        if (!src || !dst) {
            return [];
        }
        return this._edgePointsWithWaypoints(src, dst, t.waypoints || [], 0);
    }

    /**
     * Inserts a new waypoint at the midpoint of the nearest edge segment.
     * @param {Object} edge - the edge object to modify
     * @param {MouseEvent} event - the double-click event
     */
    _insertWaypointAtMid(edge, event) {
        const local = this._toLocalSafe(event);
        edge.waypoints = Array.isArray(edge.waypoints) ? edge.waypoints : [];
        const pts = this._edgePoints(edge);
        if (pts.length < 2) {
            return;
        }
        const near = this._nearestPointOnPolyline(pts, local.x, local.y);
        const a = pts[near.index];
        const b = pts[near.index + 1];
        if (!a || !b) {
            return;
        }
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const insertAt = Math.min(Math.max(near.index, 0), edge.waypoints.length);
        edge.waypoints.splice(insertAt, 0, mid);
        this.render();
        this._updateToolbarState();
        this._emitChangeSafe();
    }

    /**
     * Finds the nearest edge within a tolerance of the given local coordinates.
     * @param {number} x - local x coordinate
     * @param {number} y - local y coordinate
     * @param {number} tolerancePx - pixel tolerance (screen space)
     * @returns {Object|null} nearest edge info or null
     */
    _nearestEdgeAt(x, y, tolerancePx) {
        const tolLocal = tolerancePx / (this._scale || 1);
        let best = null;
        let bestDist = Infinity;
        this._model.edges.forEach((t) => {
            const pts = this._edgePoints(t);
            if (pts.length < 2) {
                return;
            }
            const near = this._nearestPointOnPolyline(pts, x, y);
            const d = Math.hypot(near.point.x - x, near.point.y - y);
            if (d < bestDist && d <= tolLocal) {
                bestDist = d;
                best = {
                    edge: t,
                    index: near.index,
                    point: near.point,
                    a: pts[near.index],
                    b: pts[near.index + 1]
                };
            }
        });
        return best;
    }

    /**
     * Finds the nearest point on a polyline to the given coordinates.
     * @param {{x: number, y: number}[]} pts - polyline points
     * @param {number} x - query x coordinate
     * @param {number} y - query y coordinate
     * @returns {{point: {x: number, y: number}, index: number}} nearest point and segment index
     */
    _nearestPointOnPolyline(pts, x, y) {
        let bestIdx = 0;
        let bestPoint = pts[0] || { x: x, y: y };
        let bestDist = Infinity;
        for (let i = 0; i < pts.length - 1; i++) {
            const res = this._closestPointOnSegment(pts[i], pts[i + 1], x, y);
            const d = Math.hypot(res.x - x, res.y - y);
            if (d < bestDist) {
                bestDist = d;
                bestPoint = res;
                bestIdx = i;
            }
        }
        return { point: bestPoint, index: bestIdx };
    }

    /**
     * Computes the closest point on a line segment to a given point.
     * @param {{x: number, y: number}} a - segment start
     * @param {{x: number, y: number}} b - segment end
     * @param {number} px - point x
     * @param {number} py - point y
     * @returns {{x: number, y: number}} closest point on segment
     */
    _closestPointOnSegment(a, b, px, py) {
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        const wx = px - a.x;
        const wy = py - a.y;
        const c1 = vx * wx + vy * wy;
        if (c1 <= 0) {
            return { x: a.x, y: a.y };
        }
        const c2 = vx * vx + vy * vy;
        if (c2 <= c1) {
            return { x: b.x, y: b.y };
        }
        const t = c1 / c2;
        return { x: a.x + t * vx, y: a.y + t * vy };
    }

    /**
     * Finds the nearest node to the given coordinates within a tolerance.
     * @param {number} x - local x coordinate
     * @param {number} y - local y coordinate
     * @param {number} tolerancePx - pixel tolerance
     * @returns {Object|null} nearest node or null
     */
    _nearestNodeAt(x, y, tolerancePx) {
        let best = null;
        let bestD = Infinity;
        this._nodes.forEach(n => {
            const dx = n.x - x;
            const dy = n.y - y;
            const d2 = dx * dx + dy * dy;
            const r = Math.max(n.width || 80, n.height || 40) / 2;
            const distLimit = r + tolerancePx;
            if (d2 <= distLimit * distLimit && d2 < bestD) {
                bestD = d2;
                best = n;
            }
        });
        return best;
    }

    /**
     * Creates a new edge between two nodes and emits a change event.
     * @param {string} from - source node id
     * @param {string} to - target node id
     */
    _createEdgeAndEmit(from, to) {
        this._saveStateToHistory();
        const newId = this._newEdgeId();
        const tr = {
            id: newId,
            from: from,
            to: to,
            waypoints: [],
            color: "#5bc0de",
            dasharray: ""
        };
        this._model.edges.push(tr);
        this._deselectAll();
        this._selectedEdgeId = newId;
        this.render();
        this._updateToolbarState();
        this._emitChangeSafe();
    }

    /**
     * Generates a unique edge identifier.
     * @returns {string} unique edge id
     */
    _newEdgeId() {
        const base = "e";
        let n = this._model.edges.length + 1;
        let candidate = base + "-" + Date.now() + "-" + n + this._idSuffix();
        const exists = (id) => {
            return this._model.edges.some(t => (t.id || "") === id);
        };
        while (exists(candidate)) {
            n += 1;
            candidate = base + "-" + Date.now() + "-" + n + this._idSuffix();
        }
        return candidate;
    }

    /**
     * Safely emits a change event, supporting both _emitChange and _dispatch patterns.
     */
    _emitChangeSafe() {
        this._announceGraph();

        if (typeof this._emitChange === "function") {
            this._emitChange();
        } else if (typeof this._dispatch === "function") {
            // sync visual positions to model before dispatching
            this._syncModelPositions();
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { model: this._model });
        }
    }

    /**
     * Normalizes incoming model data to a consistent format with nodes and edges arrays.
     * @param {Object} model - raw model data
     * @returns {Object} normalized model
     */
    _normalizeModel(model) {
        const m = model || {};
        if (!m.nodes && Array.isArray(m.states)) {
            m.nodes = m.states;
        }
        if (!m.edges && Array.isArray(m.transitions)) {
            m.edges = m.transitions;
        }
        m.nodes = Array.isArray(m.nodes) ? m.nodes : [];
        m.edges = Array.isArray(m.edges) ? m.edges : [];
        return super._normalizeModel({ nodes: m.nodes, edges: m.edges });
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-graph-editor", webexpress.webui.GraphEditorCtrl);
