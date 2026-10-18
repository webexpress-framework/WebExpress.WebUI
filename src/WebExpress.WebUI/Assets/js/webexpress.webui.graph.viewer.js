/**
 * Graph viewer controller with pan, zoom, drag, and simple spring-mass physics.
 * Supports nodes with optional icons or images, edges with waypoint and labels.
 *
 * The canvas is a function of the state: the model, the measured nodes, their
 * positions, the viewport and the canvas size. The state is a FrameState, so a
 * simulation step, a drag or a pan renders once per animation frame however many
 * changes the frame saw; a discrete change - render(), a replaced model - renders at
 * once. The node records of the simulation are its working memory: an integration
 * step or a gesture moves them and then publishes their positions into the state the
 * canvas renders from.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.DOUBLE_CLICK_EVENT
 */
webexpress.webui.GraphViewerCtrl = class extends webexpress.webui.StateCtrl {
    static ICON_SIZE = 28;

    // an image icon is drawn a little smaller than a glyph, whose box carries padding
    static IMAGE_SIZE = 22;

    // a node that carries a description or a state is measured from its text,
    // so the text is cut first and the rectangle then fits it exactly; without
    // the cut a long title would either overflow its box or stretch it across
    // the canvas
    static NODE_LABEL_LENGTH = 24;
    static NODE_DESCRIPTION_LENGTH = 34;
    static NODE_STATE_LENGTH = 14;

    // the simulation is considered at rest once no free node moves faster than
    // this many units per frame; below that the positions no longer change
    // visibly, so continuing to integrate only burns cpu
    static SETTLE_VELOCITY = 0.05;

    // hard ceiling on the frames a single simulation run may consume. A layout
    // that cannot reach equilibrium (coincident nodes producing extreme
    // repulsion, for example) must still give the frame loop back rather than
    // spin for the lifetime of the page
    static MAX_SIMULATION_FRAMES = 1800;

    // the cell size a data-grid="true" selects, and how many cells apart the
    // emphasised lines sit
    static DEFAULT_GRID_SIZE = 20;
    static GRID_MAJOR_EVERY = 5;

    // how far a rounded corner reaches into the two segments meeting at a waypoint
    static CORNER_RADIUS = 12;

    // the arrow head in graph units, slimmer than wide so it reads as a direction
    static ARROW_LENGTH = 10;
    static ARROW_WIDTH = 7;

    // svg fragment references share the document even across separate canvases
    static _nextMarkerId = 0;

    /**
     * Creates a new GraphViewer instance.
     * @param {HTMLElement} element - The host element.
     */
    constructor(element) {
        super(element, {
            store: new webexpress.webui.FrameState({
                model: { nodes: [], edges: [] },
                nodes: [],
                positions: {},
                view: { scale: 1, x: 0, y: 0 },
                size: { width: 0, height: 0 },
                dissolve: 0,
                panning: false,
                announcement: "",
                revision: 0
            })
        });

        // every listener the control installs outside its own subtree is
        // recorded here, so the teardown can release them all - including the
        // transient ones a pan or drag gesture installs and that a teardown in
        // mid-gesture would otherwise strand on the window
        this._windowListeners = [];
        this._elementListeners = [];

        this._nodeStyle = (element.dataset.nodeStyle || "").toLowerCase();
        // read edge style configuration; the default routes straight segments
        // with rounded corners, "straight" keeps the corners sharp and
        // "smooth" / "curve" select the bezier routing
        this._edgeStyle = (element.dataset.edgeStyle || "rounded").toLowerCase();

        // read physics configuration. true by default unless explicitly set to "false"
        const physicsAttr = element.dataset.physicsEnabled;
        this._configPhysics = physicsAttr !== "false";

        // optional background grid; the attribute carries the cell size, and
        // "true" selects the default size. It is off unless asked for, because a
        // grid is a modelling aid rather than a property of the graph
        this._gridSize = this._readGridSize(element.dataset.grid);
        this._gridSnap = element.dataset.gridSnap === "true";

        this._viewDrag = null;
        this._drag = null;
        this._autoFit = true;
        this._edges = [];
        this._anim = null;
        this._animFrames = 0;
        this._destroyed = false;
        this._physicsEnabled = false;
        this._dissolving = false;
        this._dissolveProgress = 0;
        this._dissolveDuration = 0.6; // seconds
        this._markerPrefix = `wx-graph-arrow-${++webexpress.webui.GraphViewerCtrl._nextMarkerId}`;

        this._model = this._normalizeModel(this._readFromDom(element));

        if (!element.style.position) {
            element.style.position = "relative";
        }

        element.innerHTML = "";
        element.classList.add("wx-graph-viewer");
        element.style.userSelect = "none";
        this._addElementListener(element, "contextmenu", (e) => {
            e.preventDefault();
        });

        this._autoPhysics = this._buildPhysics();

        // a subclass renders through hooks that read what its own constructor sets up,
        // so it opens the canvas at the end of that constructor
        if (new.target === webexpress.webui.GraphViewerCtrl) {
            this._open();
        }
    }

    /**
     * Renders the canvas the first time, fits the graph into it and starts the
     * simulation when nodes are still to be placed.
     */
    _open() {
        this._store.flush();
        this.mount();
        this._fitToView();
        this._store.flush();

        if (this._autoPhysics) {
            this._startAnimation();
        }
    }

    // the model, the measured nodes and the viewport are state; the accessors keep the
    // record api the subclasses and the hosts use

    get _model() { return this.state.model; }
    set _model(value) { this.setState({ model: value || { nodes: [], edges: [] } }); }

    get _nodes() { return this.state.nodes; }
    set _nodes(value) { this.setState({ nodes: Array.isArray(value) ? value : [] }); }

    get _scale() { return this.state.view.scale; }
    set _scale(value) { this._setView({ scale: value }); }

    // a copy: the pan is changed through _setView, never in place
    get _pan() { return Object.freeze({ x: this.state.view.x, y: this.state.view.y }); }
    set _pan(value) { this._setView({ x: value.x, y: value.y }); }

    /**
     * Changes the viewport.
     * @param {{scale?: number, x?: number, y?: number}} patch - The changed parts.
     */
    _setView(patch) {
        this.setState({ view: Object.assign({}, this.state.view, patch) });
    }

    /**
     * Registers a listener outside the control's own subtree and records it so
     * the teardown can release it again.
     * @param {EventTarget} target - The target to listen on.
     * @param {string} type - The event type.
     * @param {Function} handler - The handler.
     * @param {object|boolean} [options] - The listener options.
     */
    _addElementListener(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        this._elementListeners.push({ target, type, handler, options });
    }

    /**
     * Registers a window listener and records it for the teardown.
     * @param {string} type - The event type.
     * @param {Function} handler - The handler.
     */
    _addWindowListener(type, handler) {
        window.addEventListener(type, handler);
        this._windowListeners.push({ type, handler });
    }

    /**
     * Releases a single recorded window listener. Gestures use this to drop
     * their transient handlers as soon as they end, so a long-lived viewer does
     * not accumulate one entry per pan or drag.
     * @param {string} type - The event type.
     * @param {Function} handler - The handler.
     */
    _removeWindowListener(type, handler) {
        window.removeEventListener(type, handler);
        const index = this._windowListeners.findIndex(entry => {
            return entry.type === type && entry.handler === handler;
        });
        if (index !== -1) {
            this._windowListeners.splice(index, 1);
        }
    }

    /**
     * Releases every recorded listener and the listeners the view attached.
     */
    _releaseListeners() {
        for (const entry of this._windowListeners) {
            window.removeEventListener(entry.type, entry.handler);
        }
        this._windowListeners = [];

        for (const entry of this._elementListeners) {
            entry.target.removeEventListener(entry.type, entry.handler, entry.options);
        }
        this._elementListeners = [];

        webexpress.webui.Renderer.release(this._renderRoot);
    }

    /**
     * Reads the grid cell size from its data attribute. "true" selects the
     * default size, a number selects that size, anything else turns the grid off.
     * @param {string|undefined} value - The attribute value.
     * @returns {number} The cell size, or 0 when the grid is off.
     */
    _readGridSize(value) {
        if (value === undefined || value === null || value === "" || value === "false") {
            return 0;
        }
        if (value === "true") {
            return webexpress.webui.GraphViewerCtrl.DEFAULT_GRID_SIZE;
        }
        const size = parseFloat(value);
        return Number.isFinite(size) && size > 0 ? size : 0;
    }

    /**
     * Snaps a coordinate to the grid when snapping is enabled.
     * @param {number} value - The coordinate.
     * @returns {number} The snapped coordinate.
     */
    _snapToGrid(value) {
        if (!this._gridSnap || this._gridSize <= 0) {
            return value;
        }
        return Math.round(value / this._gridSize) * this._gridSize;
    }

    /**
     * Moves the keyboard focus onto the canvas without scrolling the page,
     * which a focus() on a large SVG would otherwise trigger.
     */
    _focusCanvas() {
        if (this._svg && typeof this._svg.focus === "function") {
            this._svg.focus({ preventScroll: true });
        }
    }

    /**
     * Announces a message to assistive technology through the live region that
     * accompanies the canvas. Selection and structural changes are invisible to
     * a screen reader otherwise, because they only manifest as SVG geometry.
     * @param {string} message - The message to announce.
     */
    _announce(message) {
        this.setState({ announcement: message || "" });
    }

    // ------------------------------------------------------------------ view

    /**
     * Describes the host: the canvas, the view controls in its lower left corner and the
     * live region, with room for a subclass to place a toolbar ahead of the canvas and
     * dialogs after it.
     * @param {object} state - The state.
     * @returns {Array<object>} The virtual nodes of the host.
     */
    _viewTree(state) {
        const h = webexpress.webui.h;
        const placed = this._placedNodes(state);
        const view = state.view;

        return [
            this._renderBeforeCanvas(state),
            h("svg", {
                key: "svg",
                class: "wx-graph-svg",
                // the canvas is a single tab stop that owns its arrow keys, which is
                // what role=application expresses; without a tabindex the graph could
                // not be reached by keyboard at all, and a global key handler could not
                // tell whether a key press was meant for it
                tabindex: "0",
                role: "application",
                "aria-roledescription": this._i18n("webexpress.webui:graph.a11y.roledescription", "graph"),
                "aria-label": this._element.dataset.label || this._i18n("webexpress.webui:graph.a11y.canvas", "Graph canvas"),
                style: { cursor: this._canvasCursor(state) },
                on: this._svgHandlers(),
                ref: (el) => { this._svg = el; }
            },
                h("defs", { key: "defs" }, this._markerColors(state).map((color) => this._renderMarker(color))),
                h("g", {
                    key: "viewport",
                    "data-layer": "viewport",
                    transform: `translate(${view.x} ${view.y}) scale(${view.scale})`,
                    ref: (el) => { this._viewport = el; }
                },
                    h("g", { key: "grid", "data-layer": "grid", ref: (el) => { this._gridLayer = el; } }, this._renderGrid(state)),
                    h("g", { key: "edges", "data-layer": "edges", ref: (el) => { this._edgeLayer = el; } }, this._renderEdges(state, placed)),
                    h("g", { key: "nodes", "data-layer": "nodes", ref: (el) => { this._nodeLayer = el; } },
                        state.nodes.map((n) => this._renderNode(state, placed.get(n.id)))),
                    this._renderOverlays(state, placed))),
            this._renderViewControls(state),
            h("div", {
                key: "live",
                class: "wx-graph-live-region",
                role: "status",
                "aria-live": "polite",
                ref: (el) => { this._liveRegion = el; }
            }, state.announcement),
            this._renderAfterCanvas(state)
        ];
    }

    /**
     * Hook for subclasses to describe what goes ahead of the canvas, such as a toolbar.
     * @param {object} state - The state.
     * @returns {*} Virtual nodes, or null.
     */
    _renderBeforeCanvas(state) {
        return null;
    }

    /**
     * Hook for subclasses to describe what goes after the canvas, such as a dialog.
     * @param {object} state - The state.
     * @returns {*} Virtual nodes, or null.
     */
    _renderAfterCanvas(state) {
        return null;
    }

    /**
     * Hook for subclasses to describe layers above the nodes, such as handles.
     * @param {object} state - The state.
     * @param {Map<string, object>} placed - The nodes at their rendered positions.
     * @returns {*} Virtual nodes, or null.
     */
    _renderOverlays(state, placed) {
        return null;
    }

    /**
     * Gets the cursor of the canvas.
     * @param {object} state - The state.
     * @returns {string} The cursor, or an empty value for the default.
     */
    _canvasCursor(state) {
        return state.panning ? "grabbing" : "";
    }

    /**
     * Returns the listeners of the canvas.
     * @returns {object} The listener map.
     */
    _svgHandlers() {
        return this._handler("svg", "viewer", () => ({
            pointerdown: (e) => {
                e.preventDefault();
                // a pointer interaction moves the keyboard focus onto the canvas so
                // the two input paths stay on the same element
                this._focusCanvas();
                if (e.button === 0 && !this._viewDrag && e.target === this._svg) {
                    this._beginPan(this._svg, e);
                }
            },
            contextmenu: (e) => {
                e.preventDefault();
            },
            wheel: (e) => {
                e.preventDefault();
                this._onWheel(e);
            }
        }));
    }

    /**
     * Gets the node records at the positions the state publishes, by id. Rendering reads
     * these, because the records go on moving between a publication and the paint.
     * @param {object} state - The state.
     * @returns {Map<string, object>} The placed nodes.
     */
    _placedNodes(state) {
        const placed = new Map();
        for (const n of state.nodes) {
            const p = state.positions[n.id] || n;
            // flat objects of one shape keep the property access of every render fast
            placed.set(n.id, {
                id: n.id,
                data: n.data,
                x: p.x,
                y: p.y,
                width: n.width,
                height: n.height,
                rectWidth: n.rectWidth,
                rectHeight: n.rectHeight,
                shape: n.shape
            });
        }
        return placed;
    }

    /**
     * Gets the colours an arrow marker is needed for: the theme default and every
     * explicit edge colour.
     * @param {object} state - The state.
     * @returns {Array<string>} The colours.
     */
    _markerColors(state) {
        const colors = new Set([""]);
        for (const edge of state.model.edges) {
            if (edge && edge.color) {
                colors.add(edge.color);
            }
        }
        return Array.from(colors);
    }

    /**
     * Gets the id of the arrow marker of a colour. A marker cannot inherit the stroke of
     * the path that references it, so an arrowhead that is to match its edge needs its
     * own marker per colour.
     * @param {string} [color] - The explicit edge color, or the theme default.
     * @returns {string} The marker id.
     */
    _markerId(color) {
        const safeColor = String(color || "").replace(/[^a-zA-Z0-9]/g, "");
        return `${this._markerPrefix}-${safeColor || "default"}`;
    }

    /**
     * Returns the URL reference of the arrow marker of a colour.
     * @param {string} [color] - The explicit edge color, or the theme default.
     * @returns {string} The marker URL reference.
     */
    _ensureArrowMarker(color) {
        return `url(#${this._markerId(color)})`;
    }

    /**
     * Describes the arrow marker of a colour.
     * @param {string} color - The colour, or an empty value for the theme default.
     * @returns {object} The marker virtual node.
     */
    _renderMarker(color) {
        const h = webexpress.webui.h;
        const id = this._markerId(color);

        const length = webexpress.webui.GraphViewerCtrl.ARROW_LENGTH;
        const width = webexpress.webui.GraphViewerCtrl.ARROW_WIDTH;

        // the head is anchored at its base: the line stops where the head begins, so
        // neither its round cap nor its dash pattern runs into the tip
        return h("marker", {
            key: id,
            id: id,
            class: "wx-graph-edge-arrow",
            viewBox: `0 0 ${length} ${width}`,
            refX: "0",
            refY: String(width / 2),
            markerWidth: String(length),
            markerHeight: String(width),
            markerUnits: "userSpaceOnUse",
            orient: "auto-start-reverse"
        }, h("path", { d: `M 0 0 L ${length} ${width / 2} L 0 ${width} Z`, style: this._paint("fill", color) }));
    }

    /**
     * Gets the style that applies an author-chosen paint value, or clears it again.
     *
     * The value goes on the inline style rather than on the fill/stroke presentation
     * attribute. A presentation attribute loses against every stylesheet rule, and the
     * theme defaults for labels and edges are exactly such rules - so a colour chosen for
     * a node or an edge was silently overruled by the default. An inline style outranks
     * both, which restores the intended precedence: explicit colour beats css class beats
     * theme.
     * @param {string} property - "fill" or "stroke".
     * @param {string} value - The colour, or an empty value to clear it.
     * @returns {object} The style object.
     */
    _paint(property, value) {
        return { [property]: value || "" };
    }

    /**
     * Describes the background grid across the area the content occupies, padded so it
     * keeps covering the canvas while the view is panned.
     * @param {object} state - The state.
     * @returns {Array<object>} The grid paths.
     */
    _renderGrid(state) {
        if (this._gridSize <= 0) {
            return [];
        }

        const h = webexpress.webui.h;
        const view = state.view;
        const scale = view.scale || 1;
        const size = this._gridSize;
        const width = state.size.width;
        const height = state.size.height;

        // the visible area in local coordinates, generously padded so a pan does
        // not immediately run past the drawn cells
        const padding = Math.max(width, height) / scale;
        const left = Math.floor(((-view.x / scale) - padding) / size) * size;
        const top = Math.floor(((-view.y / scale) - padding) / size) * size;
        const right = left + (width / scale) + padding * 2 + size;
        const bottom = top + (height / scale) + padding * 2 + size;

        // a single path per direction keeps the node count low even on a wide
        // canvas, which matters because this redraws on every pan and zoom
        let minor = "";
        let major = "";

        for (let x = left; x <= right; x += size) {
            const line = `M ${x},${top} L ${x},${bottom} `;
            if (Math.round(x / size) % webexpress.webui.GraphViewerCtrl.GRID_MAJOR_EVERY === 0) {
                major += line;
            } else {
                minor += line;
            }
        }
        for (let y = top; y <= bottom; y += size) {
            const line = `M ${left},${y} L ${right},${y} `;
            if (Math.round(y / size) % webexpress.webui.GraphViewerCtrl.GRID_MAJOR_EVERY === 0) {
                major += line;
            } else {
                minor += line;
            }
        }

        // the stroke is specified in screen pixels, so the grid stays a hair
        // line rather than thickening as the user zooms in
        const path = (key, d, className, width) => d && h("path", {
            key: key,
            class: className,
            d: d.trim(),
            fill: "none",
            "stroke-width": width / scale,
            "pointer-events": "none"
        });

        return [
            path("minor", minor, "wx-graph-grid-line", 0.5),
            path("major", major, "wx-graph-grid-line-major", 1)
        ];
    }

    /**
     * Describes the edges and their labels.
     * @param {object} state - The state.
     * @param {Map<string, object>} placed - The nodes at their rendered positions.
     * @returns {Array<object>} The edge virtual nodes.
     */
    _renderEdges(state, placed) {
        const h = webexpress.webui.h;
        const out = [];

        state.model.edges.forEach((t, index) => {
            if (!t || typeof t !== "object") {
                return;
            }
            const pts = this._edgeRenderPoints(state, placed, t);
            if (!pts || pts.length === 0) {
                return;
            }
            const id = this._edgeKey(t, index);

            out.push(h("path", Object.assign({
                key: id,
                class: ["wx-graph-viewer-edge", t.colorCss].filter(Boolean).join(" "),
                "data-id": id,
                "data-label": t.label || "",
                d: this._arrowPathData(pts),
                fill: "none",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "marker-end": this._ensureArrowMarker(t.color),
                "stroke-dasharray": t.dasharray || null,
                style: this._paint("stroke", t.color)
            }, this._edgeProps(state, t, id))));

            if (t.label && this._showsEdgeLabels()) {
                const pos = this._edgeLabelPoint(pts);
                out.push(h("text", {
                    key: id + "/label",
                    class: ["wx-graph-edge-label", t.colorCss].filter(Boolean).join(" "),
                    "data-id": id,
                    x: pos.x,
                    y: pos.y,
                    "text-anchor": "middle",
                    "dominant-baseline": "middle"
                }, t.label));
            }
        });

        return out;
    }

    /**
     * Gets the key and the data-id of an edge.
     * @param {object} t - The edge.
     * @param {number} index - The position of the edge in the model.
     * @returns {string} The key.
     */
    _edgeKey(t, index) {
        return t.id || "";
    }

    /**
     * Gets the points an edge is drawn through, or nothing for an edge between unknown
     * nodes, which is skipped rather than rendered broken.
     * @param {object} state - The state.
     * @param {Map<string, object>} placed - The nodes at their rendered positions.
     * @param {object} t - The edge.
     * @returns {Array<{x: number, y: number}>|null} The points.
     */
    _edgeRenderPoints(state, placed, t) {
        const a = placed.get(t.from);
        const b = placed.get(t.to);
        if (!a || !b) {
            return null;
        }
        return this._edgePointsWithWaypoints(a, b, t.waypoints || [], state.dissolve);
    }

    /**
     * Hook for subclasses to add props to an edge path, such as listeners.
     * @param {object} state - The state.
     * @param {object} t - The edge.
     * @param {string} id - The edge key.
     * @returns {object|null} The props.
     */
    _edgeProps(state, t, id) {
        return null;
    }

    /**
     * Tells whether edge labels are drawn on the canvas.
     * @returns {boolean} True for the viewer.
     */
    _showsEdgeLabels() {
        return true;
    }

    /**
     * Describes one node: its shape, its icon, its label and, for a node that says more
     * than its name, the description and the state badge.
     * @param {object} state - The state.
     * @param {object} n - The node at its rendered position.
     * @returns {object} The node virtual node.
     */
    _renderNode(state, n) {
        const h = webexpress.webui.h;
        const ctor = webexpress.webui.GraphViewerCtrl;
        const layout = (n.data.layout || "").toLowerCase();
        const iconBox = ctor.ICON_SIZE;
        const imgSize = ctor.IMAGE_SIZE;
        const rectW = n.rectWidth || n.width;
        const rectH = n.rectHeight || n.height;
        const hasIcon = Boolean(n.data.image) || Boolean(n.data.icon);
        const detailed = layout !== "label-below" && (Boolean(n.data.description) || Boolean(n.data.state));

        const shape = n.shape === "circle"
            ? h("circle", {
                key: "circle",
                class: ["wx-graph-node-circle", n.data.backgroundCss].filter(Boolean).join(" "),
                cx: n.x,
                cy: n.y,
                r: Math.max(rectW, rectH) / 2,
                style: this._paint("fill", n.data.backgroundColor)
            })
            : h("rect", {
                key: "rect",
                class: ["wx-graph-node-rect", n.data.backgroundCss].filter(Boolean).join(" "),
                x: n.x - rectW / 2,
                y: n.y - rectH / 2,
                rx: 6,
                ry: 6,
                width: rectW,
                height: rectH,
                style: this._paint("fill", n.data.backgroundColor)
            });

        // the icon box, by layout: centred in the shape below a label, at the left edge
        // of the box otherwise
        let iconX;
        let iconY;
        if (layout === "label-below") {
            const size = n.data.image ? imgSize : iconBox;
            iconX = n.x - size / 2;
            iconY = n.y - rectH / 2 + (rectH - size) / 2;
        } else {
            iconX = n.x - n.width / 2 + 12;
            iconY = n.y - (n.data.image ? imgSize : iconBox) / 2;
        }

        let icon = null;
        if (n.data.image) {
            icon = h("image", {
                key: "image",
                class: "wx-graph-node-icon",
                "data-role": "icon-image",
                href: n.data.image,
                x: iconX,
                y: iconY,
                width: imgSize,
                height: imgSize,
                "pointer-events": "none"
            });
        } else if (n.data.icon) {
            icon = h("foreignObject", {
                key: "icon",
                class: "wx-graph-node-icon",
                "data-role": "icon-fo",
                x: iconX,
                y: iconY,
                width: iconBox,
                height: iconBox,
                "pointer-events": "none"
            }, h("i", {
                class: [n.data.icon, n.data.foregroundCss].filter(Boolean).join(" "),
                style: {
                    width: `${iconBox}px`,
                    height: `${iconBox}px`,
                    lineHeight: `${iconBox}px`,
                    textAlign: "center",
                    color: n.data.foregroundColor || ""
                }
            }));
        }

        const labelClass = ["wx-graph-node-label", n.data.foregroundCss, n.data.uri && "wx-graph-node-link"].filter(Boolean).join(" ");
        const labelProps = {
            key: "label",
            class: labelClass,
            style: this._paint("fill", n.data.foregroundColor)
        };
        let detail = null;

        if (layout === "label-below") {
            Object.assign(labelProps, {
                x: n.x,
                y: n.y + rectH / 2 + (n.data.shape === "circle" ? 16 : 6),
                "text-anchor": "middle",
                "dominant-baseline": "hanging"
            });
        } else if (detailed) {
            // the two lines of text sit left aligned beside the icon and the state at the
            // right edge of the first line; the geometry lives here alone, because every
            // frame has to agree with the first one on it
            const left = n.x - rectW / 2 + 14 + (hasIcon ? iconBox + 6 : 0);
            const right = n.x + rectW / 2 - 12;
            const line = n.data.description ? n.y - 3 : n.y + 4;
            Object.assign(labelProps, { x: left, y: line, "text-anchor": "start" });

            detail = [
                n.data.description && h("text", {
                    key: "description",
                    class: "wx-graph-node-description",
                    "pointer-events": "none",
                    x: left,
                    y: n.y + 14,
                    "text-anchor": "start"
                }, n.data.description),
                n.data.state && this._renderNodeState(n, right, line)
            ];
        } else {
            Object.assign(labelProps, {
                x: hasIcon ? n.x + iconBox * 0.4 : n.x,
                y: n.y + 5,
                "text-anchor": "middle"
            });
        }

        return h("g", {
            key: n.id,
            class: ["wx-graph-node"].concat(this._nodeClasses(state, n) || []).join(" "),
            "data-id": n.id,
            // the shape carries no accessible name of its own, so the group supplies
            // one; keyboard reachability stays with the canvas, which owns the roving
            // selection
            role: "img",
            "aria-label": n.data.label || n.id,
            on: this._nodeHandlers(n.id)
        }, shape, icon, h("text", labelProps, n.data.label || n.id), detail);
    }

    /**
     * Describes the state of a node: a coloured badge laid under its caption.
     * @param {object} n - The node.
     * @param {number} right - The right edge of the text area.
     * @param {number} line - The baseline of the first line.
     * @returns {Array<object>} The badge and the caption.
     */
    _renderNodeState(n, right, line) {
        const h = webexpress.webui.h;
        // the caption is right aligned and the plate is laid under it, so the badge
        // grows to the left and never leaves the box
        const captionW = n.data.state.length * 6;
        const padding = 6;

        return [
            h("rect", {
                key: "state-badge",
                class: ["wx-graph-node-state-badge", n.data.stateCss].filter(Boolean).join(" "),
                rx: 8,
                ry: 8,
                height: 16,
                x: right - captionW - padding * 2,
                y: line - 12,
                width: captionW + padding * 2,
                "pointer-events": "none",
                style: this._paint("fill", n.data.stateColor)
            }),
            h("text", {
                key: "state",
                class: ["wx-graph-node-state", n.data.stateCss].filter(Boolean).join(" "),
                "pointer-events": "none",
                x: right - padding,
                y: line,
                "text-anchor": "end",
                style: this._paint("fill", n.data.stateColor)
            }, n.data.state)
        ];
    }

    /**
     * Hook for subclasses to add classes to a node group, such as a selection mark.
     * @param {object} state - The state.
     * @param {object} n - The node.
     * @returns {Array<string>|null} The classes.
     */
    _nodeClasses(state, n) {
        return null;
    }

    /**
     * Returns the listeners of a node. They name only the node id and look the node up
     * when they run, so a listener never acts on a replaced record.
     * @param {string} id - The node id.
     * @returns {object} The listener map.
     */
    _nodeHandlers(id) {
        return this._handler("node", id, () => ({
            click: (e) => {
                e.stopPropagation();
                const n = this._nodeById(id);
                if (!n) {
                    return;
                }

                // if ctrl + click and uri is present, open url
                if (e.ctrlKey && n.data.uri) {
                    window.open(n.data.uri, "_self");
                    return;
                }

                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { detail: { id: n.id, data: n.data }, bubbles: true });
            },
            dblclick: (e) => {
                e.stopPropagation();
                const n = this._nodeById(id);
                if (!n) {
                    return;
                }

                // if uri is present, navigate to it on double click
                if (n.data.uri) {
                    window.open(n.data.uri, "_self");
                }

                this._dispatch(webexpress.webui.Event.DOUBLE_CLICK_EVENT, { detail: { id: n.id, data: n.data }, bubbles: true });
            },
            pointerdown: (e) => {
                e.stopPropagation();
                const n = this._nodeById(id);
                if (n) {
                    this._beginNodeDrag(n, e);
                }
            }
        }));
    }

    /**
     * Finds a node record by its id.
     * @param {string} id - The node id.
     * @returns {object|null} The record.
     */
    _nodeById(id) {
        return this._nodes.find((n) => n.id === id) || null;
    }

    /**
     * Describes the view controls in the lower left corner of the canvas.
     *
     * They live on the canvas rather than in the editor toolbar because they act on the
     * view, not on the model: they change nothing that could be saved or undone, and they
     * are equally useful to the read-only viewer, which has no toolbar at all.
     * @param {object} state - The state.
     * @returns {object} The controls virtual node.
     */
    _renderViewControls(state) {
        const h = webexpress.webui.h;
        const button = (key, icon, title, action) => h("button", {
            key: key,
            type: "button",
            class: "wx-graph-fit-button",
            title: title,
            "aria-label": title,
            on: this._handler("view", key, () => ({
                click: (e) => {
                    e.stopPropagation();
                    action();
                }
            })),
            ref: key === "fit" ? (el) => { this._fitBtn = el; } : null
        }, h("i", { class: this._iconClass(icon), "aria-hidden": "true" }));

        return h("div", { key: "controls", class: "wx-graph-view-controls", ref: (el) => { this._viewControls = el; } },
            button("fit", "expand", this._i18n("webexpress.webui:graph.fit.view", "Fit to view"), () => this._fitToView()),
            button("center", "crosshairs", this._i18n("webexpress.webui:graph.center.view", "Centre the view"), () => this._centerView()),
            button("in", "magnifying-glass-plus", this._i18n("webexpress.webui:graph.zoom.in", "Zoom in"), () => this._zoomAt(1.2)),
            button("out", "magnifying-glass-minus", this._i18n("webexpress.webui:graph.zoom.out", "Zoom out"), () => this._zoomAt(1 / 1.2)));
    }

    /**
     * Measures the canvas once it is shown and whenever its box changes; the grid covers
     * the visible area, which only the layout knows.
     * @param {object} state - The rendered state.
     */
    onMount(state) {
        this._measureCanvas();
        if (typeof ResizeObserver === "function" && this._svg) {
            this._resizeObserver = new ResizeObserver(() => this._measureCanvas());
            this._resizeObserver.observe(this._svg);
        }
        this.onUpdate(state);
    }

    /**
     * Follows a render with what the DOM has to do itself.
     * @param {object} state - The rendered state.
     */
    onUpdate(state) { }

    /**
     * Takes the box of the canvas into the state.
     */
    _measureCanvas() {
        if (!this._svg || this._destroyed) {
            return;
        }
        const rect = this._svg.getBoundingClientRect();
        const size = this.state.size;
        if (rect.width !== size.width || rect.height !== size.height) {
            this.setState({ size: { width: rect.width, height: rect.height } });

            // the first fit often sees a canvas the page layout has not settled yet (a
            // scrollbar, a sidebar, a hidden tab), so the graph keeps fitting the canvas
            // until the user takes the view into their own hands
            if (this._autoFit) {
                this._fitToView();
            }
        }
    }

    // ------------------------------------------------------------------ view actions

    /**
     * Pans the view so the graph content sits in the middle of the canvas,
     * leaving the zoom level untouched. Fitting changes the scale as well, which
     * is not always wanted - a user who zoomed in deliberately only wants to
     * find the content again.
     */
    _centerView() {
        const bbox = this._computeContentBBox();
        if (!bbox || !this._svg) {
            return;
        }
        const rect = this._svg.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return;
        }

        const cx = (bbox.minX + bbox.maxX) / 2;
        const cy = (bbox.minY + bbox.maxY) / 2;
        const scale = this._scale;

        this._autoFit = false;
        this._setView({ x: rect.width / 2 - cx * scale, y: rect.height / 2 - cy * scale });
    }

    /**
     * Initiates the panning operation.
     * @param {SVGSVGElement} svg - The SVG element.
     * @param {PointerEvent} e - The pointer event.
     */
    _beginPan(svg, e) {
        const view = this.state.view;
        this._viewDrag = {
            startClientX: e.clientX,
            startClientY: e.clientY,
            panStartX: view.x,
            panStartY: view.y,
            pointerId: e.pointerId
        };
        this.setState({ panning: true });
        svg.setPointerCapture(e.pointerId);
        this._attachPanListeners(svg);
    }

    /**
     * Attaches listeners for panning.
     * @param {SVGSVGElement} svg - The SVG element.
     */
    _attachPanListeners(svg) {
        const move = (e) => {
            if (!this._viewDrag) {
                return;
            }
            this._autoFit = false;
            this._setView({
                x: this._viewDrag.panStartX + e.clientX - this._viewDrag.startClientX,
                y: this._viewDrag.panStartY + e.clientY - this._viewDrag.startClientY
            });
        };

        const up = () => {
            if (this._viewDrag && typeof svg.releasePointerCapture === "function") {
                try {
                    svg.releasePointerCapture(this._viewDrag.pointerId);
                } catch (e) {
                    // ignore
                }
            }
            this._viewDrag = null;
            this.setState({ panning: false });
            this._removeWindowListener("pointermove", move);
            this._removeWindowListener("pointerup", up);
            this._removeWindowListener("pointercancel", up);
        };
        this._addWindowListener("pointermove", move);
        this._addWindowListener("pointerup", up);
        // a gesture the browser takes over (a touch scroll) ends without a pointerup
        this._addWindowListener("pointercancel", up);
    }

    /**
     * Transforms pointer coordinates into local graph coordinates: the screen point is
     * taken into the canvas through its own transformation, then through the inverse of
     * the viewport the state holds. The viewport is read from the state rather than from
     * the rendered transform, which may still wait for its frame.
     * @param {PointerEvent|MouseEvent} e - The pointer event.
     * @returns {{x: number, y: number}} Local coordinates.
     */
    _toLocal(e) {
        let point = { x: e.clientX, y: e.clientY };
        const ctm = this._svg && typeof this._svg.getScreenCTM === "function" ? this._svg.getScreenCTM() : null;
        if (ctm) {
            const pt = this._svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            point = pt.matrixTransform(ctm.inverse());
        }
        const view = this.state.view;
        const scale = view.scale || 1;
        return { x: (point.x - view.x) / scale, y: (point.y - view.y) / scale };
    }

    /**
     * Handles zooming via mouse wheel.
     * @param {WheelEvent} e - The wheel event.
     */
    _onWheel(e) {
        this._zoomAt(e.deltaY < 0 ? 1.1 : 0.9, this._toLocal(e));
    }

    /**
     * Scales the view around a fixed point in local coordinates, so the content
     * under that point stays put. Zooming from the keyboard passes the viewport
     * centre, zooming with the wheel passes the pointer position.
     * @param {number} factor - The relative scale change.
     * @param {{x: number, y: number}} [anchor] - The local point to keep fixed.
     */
    _zoomAt(factor, anchor) {
        const view = this.state.view;
        const oldScale = view.scale;
        const newScale = Math.min(3, Math.max(0.3, oldScale * factor));

        if (newScale === oldScale) {
            return;
        }

        this._autoFit = false;
        const point = anchor || this._viewportCenter();
        this._setView({
            scale: newScale,
            x: view.x + point.x * (oldScale - newScale),
            y: view.y + point.y * (oldScale - newScale)
        });
    }

    /**
     * The centre of the visible area in local coordinates.
     * @returns {{x: number, y: number}} The centre point.
     */
    _viewportCenter() {
        const rect = this._svg ? this._svg.getBoundingClientRect() : { width: 0, height: 0 };
        const view = this.state.view;
        const scale = view.scale || 1;
        return {
            x: (rect.width / 2 - view.x) / scale,
            y: (rect.height / 2 - view.y) / scale
        };
    }

    /**
     * Fits the graph content to the view.
     * @param {number} [padding=24] - Padding.
     */
    _fitToView(padding = 24) {
        // a fit asks for the whole graph, which a later resize of the canvas keeps
        this._autoFit = true;
        const bbox = this._computeContentBBox();
        if (!bbox || !this._svg) {
            return;
        }
        const rect = this._svg.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        if (w <= 0 || h <= 0) {
            return;
        }

        const contentW = bbox.maxX - bbox.minX;
        const contentH = bbox.maxY - bbox.minY;
        const scale = Math.max(0.3, Math.min(3, Math.min((w - padding * 2) / contentW, (h - padding * 2) / contentH)));
        const cx = (bbox.minX + bbox.maxX) / 2;
        const cy = (bbox.minY + bbox.maxY) / 2;

        this._setView({ scale: scale, x: w / 2 - cx * scale, y: h / 2 - cy * scale });
    }

    /**
     * Computes the bounding box of the graph content.
     * @returns {{minX:number, minY:number, maxX:number, maxY:number}|null} The bbox.
     */
    _computeContentBBox() {
        if (!this._nodes.length) {
            return null;
        }
        const pts = [];
        this._nodes.forEach(n => {
            pts.push({ x: n.x - n.width / 2, y: n.y - n.height / 2 });
            pts.push({ x: n.x + n.width / 2, y: n.y + n.height / 2 });
        });
        this._model.edges.forEach(t => {
            if (Array.isArray(t.waypoints)) {
                t.waypoints.forEach(wp => {
                    pts.push({ x: wp.x, y: wp.y });
                });
            }
        });

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        pts.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });
        const expand = 20;
        return { minX: minX - expand, minY: minY - expand, maxX: maxX + expand, maxY: maxY + expand };
    }

    // ------------------------------------------------------------------ model

    /**
     * Normalizes the raw model data.
     * @param {object} model - The raw model.
     * @returns {{nodes: Array, edges: Array}} The normalized model.
     */
    _normalizeModel(model) {
        const nodes = Array.isArray(model?.nodes) ? model.nodes : [];
        const edges = Array.isArray(model?.edges) ? model.edges : [];
        const defaultLayout = this._nodeStyle || "";

        const normNodes = nodes
            .filter(s => {
                return s && typeof s === "object";
            })
            .map(s => {
                const rawX = Number.isFinite(s.x) ? s.x : parseFloat(s.x ?? "");
                const rawY = Number.isFinite(s.y) ? s.y : parseFloat(s.y ?? "");
                const hasPosition = Number.isFinite(rawX) && Number.isFinite(rawY);
                const layoutVal = typeof s.layout === "string" ? s.layout : (typeof s.nodeLayout === "string" ? s.nodeLayout : "");
                const layout = (layoutVal || defaultLayout || "").toLowerCase();

                const detailed = Boolean(s.description) || Boolean(s.state);

                return {
                    id: s.id || "",
                    label: detailed
                        ? this._fit(s.label || s.id, webexpress.webui.GraphViewerCtrl.NODE_LABEL_LENGTH)
                        : (s.label || s.id || ""),
                    x: hasPosition ? rawX : 0,
                    y: hasPosition ? rawY : 0,
                    hasPosition,
                    foregroundColor: typeof s.foregroundColor === "string" ? s.foregroundColor : (typeof s.foreground === "string" ? s.foreground : ""),
                    foregroundCss: typeof s.foregroundCss === "string" ? s.foregroundCss : "",
                    backgroundColor: typeof s.backgroundColor === "string" ? s.backgroundColor : "",
                    backgroundCss: typeof s.backgroundCss === "string" ? s.backgroundCss : "",
                    icon: typeof s.icon === "string" ? s.icon : "",
                    image: typeof s.image === "string" ? s.image : "",
                    shape: typeof s.shape === "string" ? s.shape.toLowerCase() : (typeof s.nodeShape === "string" ? s.nodeShape.toLowerCase() : ""),
                    layout,
                    uri: typeof s.uri === "string" ? s.uri : "",
                    // a node may say more than its name: a second line naming
                    // what it is, and a state shown as a dot with its caption
                    description: this._fit(s.description, webexpress.webui.GraphViewerCtrl.NODE_DESCRIPTION_LENGTH),
                    state: this._fit(s.state, webexpress.webui.GraphViewerCtrl.NODE_STATE_LENGTH),
                    stateCss: typeof s.stateCss === "string" ? s.stateCss : "",
                    stateColor: typeof s.stateColor === "string" ? s.stateColor : ""
                };
            });

        const normEdges = edges
            .map(t => {
                if (!t || typeof t !== "object") {
                    return { id: String(t || ""), from: "", to: "", color: "", colorCss: "", dasharray: "", waypoints: [], label: "" };
                }
                let wps = [];
                if (Array.isArray(t.waypoints)) {
                    wps = t.waypoints;
                } else if (typeof t.waypoints === "string") {
                    try {
                        wps = JSON.parse(t.waypoints);
                    } catch (e) {
                        wps = [];
                    }
                }
                wps = Array.isArray(wps) ? wps.filter(w => {
                    return w && typeof w === "object";
                }).map(w => {
                    return {
                        x: Number.isFinite(w.x) ? w.x : parseFloat(w.x || "0") || 0,
                        y: Number.isFinite(w.y) ? w.y : parseFloat(w.y || "0") || 0
                    };
                }) : [];

                return {
                    id: t.id || "",
                    from: t.from || "",
                    to: t.to || "",
                    color: typeof t.color === "string" ? t.color : "",
                    colorCss: typeof t.colorCss === "string" ? t.colorCss : "",
                    dasharray: typeof t.dasharray === "string" ? t.dasharray : "",
                    waypoints: wps,
                    label: typeof t.label === "string" ? t.label : ""
                };
            });

        return { nodes: normNodes, edges: normEdges };
    }

    /**
     * Reads the model from the DOM structure.
     * @param {HTMLElement} element - The host element.
     * @returns {{nodes: Array, edges: Array}} The model.
     */
    _readFromDom(element) {
        const nodes = Array.from(element.querySelectorAll(".wx-graph-node")).map(el => {
            const xVal = parseFloat(el.dataset.x ?? "");
            const yVal = parseFloat(el.dataset.y ?? "");
            const hasPosition = Number.isFinite(xVal) && Number.isFinite(yVal);
            return {
                id: el.id || "",
                label: el.dataset.label || el.dataset.id || "",
                x: hasPosition ? xVal : Math.floor(Math.random() * 201) - 100,
                y: hasPosition ? yVal : Math.floor(Math.random() * 201) - 100,
                hasPosition,
                foregroundColor: el.dataset.foregroundColor || "",
                foregroundCss: el.dataset.foregroundCss || "",
                backgroundColor: el.dataset.backgroundColor || "",
                backgroundCss: el.dataset.backgroundCss || "",
                icon: el.dataset.icon || "",
                image: el.dataset.image || "",
                shape: (el.dataset.shape || el.dataset.nodeShape || "").toLowerCase(),
                layout: (el.dataset.nodeStyle || this._nodeStyle || "").toLowerCase(),
                uri: el.dataset.uri || "",
                description: el.dataset.description || "",
                state: el.dataset.state || "",
                stateCss: el.dataset.stateCss || "",
                stateColor: el.dataset.stateColor || ""
            };
        });

        const edges = Array.from(element.querySelectorAll(".wx-graph-edge")).map(el => {
            let waypoints = [];
            try {
                waypoints = JSON.parse(el.dataset.waypoints || "[]");
            } catch (e) {
                waypoints = [];
            }
            return {
                id: el.id || "",
                from: el.dataset.from || "",
                to: el.dataset.to || "",
                waypoints: Array.isArray(waypoints) ? waypoints : [],
                color: el.dataset.color || "",
                colorCss: el.dataset.colorCss || "",
                dasharray: el.dataset.dasharray || "",
                label: el.dataset.label || ""
            };
        });

        return { nodes, edges };
    }

    /**
     * Cuts a text to the number of characters a node can show, ending it with
     * an ellipsis when something was left out.
     * @param {string} text - The text, may be absent.
     * @param {number} length - The maximum number of characters.
     * @returns {string} The text as it fits.
     */
    _fit(text, length) {
        const value = typeof text === "string" ? text : "";

        return value.length > length
            ? value.slice(0, length - 1).trimEnd() + "…"
            : value;
    }

    /**
     * Measures the node size based on content, shape, and layout.
     * @param {object} data - The node data.
     * @returns {{width: number, height: number, shape: string, rectWidth: number, rectHeight: number}} Size info.
     */
    _measureNodeSize(data) {
        const layout = (data.layout || "").toLowerCase();
        const iconW = data.image || data.icon ? webexpress.webui.GraphViewerCtrl.ICON_SIZE : 0;
        const textLen = (data.label || data.id || "").length;
        const textW = textLen * 7;
        const textH = 18;

        if (layout === "label-below") {
            const rectW = Math.max(iconW, 24);
            const rectH = Math.max(iconW, 24);
            const gap = 12;
            const width = Math.max(rectW, textW);
            const height = rectH + gap + textH;
            const shape = (data.shape || "").toLowerCase();

            if (shape === "circle") {
                const d = Math.max(width, height) * 0.7;
                return { width: d, height: d, shape: "circle", rectWidth: d, rectHeight: d - textH - gap };
            }
            return { width, height, shape: "rect", rectWidth: rectW, rectHeight: rectH };
        }

        const minW = 80;
        const minH = 36;
        const paddingH = 14;
        const paddingV = 10;
        const iconPad = data.image || data.icon ? 8 : 0;
        const shape = (data.shape || "").toLowerCase();

        // a node that carries a description or a state needs room for a
        // second line and for the state caption next to the label
        if (data.description || data.state) {
            const descriptionW = (data.description || "").length * 6;
            const stateW = data.state ? (data.state.length * 6 + 12) : 0;
            const contentW = Math.max(textW + (stateW ? stateW + 12 : 0), descriptionW);
            const detailW = Math.max(minW + 40, paddingH * 2 + (iconW ? iconW + iconPad : 0) + contentW);
            const detailH = data.description ? 52 : 40;

            return { width: detailW, height: detailH, shape: "rect", rectWidth: detailW, rectHeight: detailH };
        }

        const widthRect = Math.max(minW, paddingH * 2 + (iconW ? iconW + iconPad : 0) + textW);
        const heightRect = Math.max(minH, paddingV * 2 + 20);

        if (shape === "circle") {
            const d = Math.max(widthRect, heightRect) * 0.7;
            return { width: d, height: d, shape: "circle", rectWidth: d, rectHeight: d };
        }
        return { width: widthRect, height: heightRect, shape: "rect", rectWidth: widthRect, rectHeight: heightRect };
    }

    /**
     * Builds the physics structures.
     * @returns {boolean} True if auto-physics should start.
     */
    _buildPhysics() {
        this._nodes = this._model.nodes.map(s => {
            const size = this._measureNodeSize(s);
            return {
                id: s.id,
                data: s,
                x: (s.x || 0) + size.width / 2,
                y: (s.y || 0) + size.height / 2,
                vx: 0,
                vy: 0,
                fixed: false,
                width: size.width,
                height: size.height,
                rectWidth: size.rectWidth,
                rectHeight: size.rectHeight,
                shape: size.shape,
                hasPosition: !!s.hasPosition
            };
        });

        this._edges = this._model.edges
            .filter(t => {
                return t && t.from && t.to;
            })
            .map(t => {
                return {
                    id: t.id || "",
                    from: t.from,
                    to: t.to,
                    color: t.color,
                    colorCss: t.colorCss,
                    dasharray: t.dasharray,
                    waypoints: t.waypoints || [],
                    label: t.label || ""
                };
            });

        const hadMissing = this._assignMissingPositions();
        this._updateGeometry();

        // start animation if missing positions were found AND physics is allowed by config
        const shouldRun = hadMissing && this._configPhysics;

        if (shouldRun) {
            this._physicsEnabled = true;
        }
        return shouldRun;
    }

    /**
     * Writes a simulated node position back into the model.
     *
     * The two live in different coordinate spaces: the model stores the top
     * left corner (that is how _buildPhysics reads it back), while the
     * simulation works with centres. Writing a centre into the model would
     * therefore shift the node by half its size on every round trip - once per
     * undo, and once per save-and-reload.
     * @param {object} node - The simulated node.
     * @returns {object|null} The model node that was updated.
     */
    _syncModelPosition(node) {
        const modelNode = this._model.nodes.find(m => {
            return m.id === node.id;
        });
        if (modelNode) {
            // rounded on the way out: the canvas works in continuous space, but a
            // stored layout has no use for sub-pixel precision and a consumer may
            // well model a position as a whole number
            modelNode.x = Math.round(node.x - node.width / 2);
            modelNode.y = Math.round(node.y - node.height / 2);
        }
        return modelNode || null;
    }

    /**
     * Writes every simulated node position back into the model.
     */
    _syncModelPositions() {
        (this._nodes || []).forEach(node => {
            this._syncModelPosition(node);
        });
    }

    /**
     * Distributes nodes with missing positions.
     * @returns {boolean} True if positions were assigned.
     */
    _assignMissingPositions() {
        const missing = this._nodes.filter(n => {
            return !n.hasPosition;
        });
        if (missing.length === 0) {
            return false;
        }

        const placed = this._nodes.filter(n => {
            return n.hasPosition;
        });
        let centerX = 0;
        let centerY = 0;

        if (placed.length > 0) {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            placed.forEach(n => {
                minX = Math.min(minX, n.x - n.width / 2);
                minY = Math.min(minY, n.y - n.height / 2);
                maxX = Math.max(maxX, n.x + n.width / 2);
                maxY = Math.max(maxY, n.y + n.height / 2);
            });
            centerX = (minX + maxX) / 2;
            centerY = (minY + maxY) / 2;
        }

        const maxSize = Math.max(...this._nodes.map(n => {
            return Math.max(n.width, n.height);
        }), 120);
        const r = Math.max(maxSize * 1.2, (missing.length * maxSize * 1.3) / (2 * Math.PI));
        const step = (2 * Math.PI) / missing.length;

        missing.forEach((n, idx) => {
            const angle = idx * step;
            n.x = centerX + r * Math.cos(angle);
            n.y = centerY + r * Math.sin(angle);
        });
        return true;
    }

    /**
     * Renders the graph again at once: a discrete change - a model edited in place, a
     * replaced selection - is shown before the call returns.
     */
    render() {
        this._updateGeometry();
        this.setState({ revision: this.state.revision + 1 });
        this._store.flush();
    }

    /**
     * Publishes the positions of the node records into the state, which renders them on
     * the next animation frame. A simulation step and every move of a gesture end here.
     */
    _updateGeometry() {
        const positions = {};
        for (const n of this._nodes) {
            positions[n.id] = { x: n.x, y: n.y };
        }
        this.setState({ positions: positions, dissolve: this._dissolveProgress });
    }

    // ------------------------------------------------------------------ geometry

    /**
     * Generates the SVG path data string based on the current edge style configuration.
     * @param {Array<{x:number, y:number}>} points - The points to connect.
     * @returns {string} The path d attribute string.
     */
    _generatePathData(points) {
        if (this._edgeStyle === "straight") {
            if (!points || points.length === 0) {
                return "";
            }
            return points.map((p, i) => {
                return (i === 0 ? "M " : "L ") + `${p.x},${p.y}`;
            }).join(" ");
        }
        if (this._edgeStyle === "curve" || this._edgeStyle === "smooth") {
            return this._generateSmoothPath(points);
        }
        // default: straight segments with the corners rounded off, which keeps a
        // waypoint readable as the deliberate routing decision it is - a bezier
        // bends the whole run and no longer passes through the point the user set
        return this._generateRoundedPath(points);
    }

    /**
     * Generates a path of straight segments whose corners are rounded with a
     * short arc. The radius shrinks for short segments so two close waypoints
     * cannot produce overlapping arcs.
     * @param {Array<{x:number, y:number}>} points - The points to connect.
     * @returns {string} The path d attribute string.
     */
    _generateRoundedPath(points) {
        if (!points || points.length === 0) {
            return "";
        }
        if (points.length < 3) {
            return points.map((p, i) => {
                return (i === 0 ? "M " : "L ") + `${p.x},${p.y}`;
            }).join(" ");
        }

        const maxRadius = webexpress.webui.GraphViewerCtrl.CORNER_RADIUS;
        let d = `M ${points[0].x},${points[0].y}`;

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const corner = points[i];
            const next = points[i + 1];

            const inLen = Math.hypot(corner.x - prev.x, corner.y - prev.y) || 1;
            const outLen = Math.hypot(next.x - corner.x, next.y - corner.y) || 1;
            // never eat more than half of either adjoining segment
            const radius = Math.min(maxRadius, inLen / 2, outLen / 2);

            const start = {
                x: corner.x - ((corner.x - prev.x) / inLen) * radius,
                y: corner.y - ((corner.y - prev.y) / inLen) * radius
            };
            const end = {
                x: corner.x + ((next.x - corner.x) / outLen) * radius,
                y: corner.y + ((next.y - corner.y) / outLen) * radius
            };

            d += ` L ${start.x},${start.y}`;
            // the corner itself is the control point, which rounds the turn
            // without moving the path away from the waypoint
            d += ` Q ${corner.x},${corner.y} ${end.x},${end.y}`;
        }

        const last = points[points.length - 1];
        d += ` L ${last.x},${last.y}`;
        return d;
    }

    /**
     * Generates a smooth SVG path d-string from points using Catmull-Rom like tension.
     * @param {Array<{x:number, y:number}>} points - The points to connect.
     * @returns {string} The path d attribute string.
     */
    _generateSmoothPath(points) {
        if (!points || points.length === 0) {
            return "";
        }
        if (points.length === 1) {
            return `M ${points[0].x},${points[0].y}`;
        }
        // if only 2 points, straight line is sufficient
        if (points.length === 2) {
            return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
        }

        // helper to get control point
        const getControlPoint = (prev, curr, next, reverse) => {
            const p = prev || curr;
            const n = next || curr;
            // smoothing factor (0.2 is usually good)
            const smoothing = 0.2;
            const o = {
                x: n.x - p.x,
                y: n.y - p.y
            };
            const angle = Math.atan2(o.y, o.x) + (reverse ? Math.PI : 0);
            const length = Math.hypot(curr.x - (reverse ? n.x : p.x), curr.y - (reverse ? n.y : p.y)) * smoothing;
            return {
                x: curr.x + Math.cos(angle) * length,
                y: curr.y + Math.sin(angle) * length
            };
        };

        let d = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i - 1]; // previous
            const p1 = points[i];     // current (start of curve segment)
            const p2 = points[i + 1]; // next (end of curve segment)
            const p3 = points[i + 2]; // next next

            const cp1 = getControlPoint(p0, p1, p2, false);
            const cp2 = getControlPoint(p1, p2, p3, true);

            d += ` C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${p2.x},${p2.y}`;
        }
        return d;
    }

    /**
     * Calculates points for an edge, handling waypoint dissolving.
     * @param {object} from - Source node.
     * @param {object} to - Target node.
     * @param {Array<{x:number, y:number}>} wps - Waypoints.
     * @param {number} dissolve - Dissolve factor (0 to 1).
     * @returns {Array<{x:number, y:number}>} The points.
     */
    _edgePointsWithWaypoints(from, to, wps, dissolve) {
        const srcC = { x: from.x, y: from.y };
        const dstC = { x: to.x, y: to.y };

        if (from.id === to.id && (!wps || wps.length === 0)) {
            const w = from.rectWidth || from.width || 60;
            const h = from.rectHeight || from.height || 40;

            // adjust offset based on layout to avoid overlapping with text/icon
            const isLabelBelow = (from.data.layout === "label-below");
            const loopOffset = isLabelBelow ? 28 : 20;

            const p1 = { x: srcC.x + w / 4, y: srcC.y - h / 2 };
            const p2 = { x: srcC.x + w / 4, y: srcC.y - h / 2 - loopOffset };
            const p3 = { x: srcC.x + w / 2 + loopOffset, y: srcC.y - h / 2 - loopOffset };
            const p4 = { x: srcC.x + w / 2 + loopOffset, y: srcC.y - h / 4 };
            const p5 = { x: srcC.x + w / 2 + 5, y: srcC.y - h / 8 };

            return [p1, p2, p3, p4, p5];
        }

        const pts = [];
        pts.push({ ...srcC });

        if (Array.isArray(wps)) {
            const k = wps.length;
            wps.forEach((wp, idx) => {
                const t = (idx + 1) / (k + 1);
                const targetOnLine = {
                    x: srcC.x + (dstC.x - srcC.x) * t,
                    y: srcC.y + (dstC.y - srcC.y) * t
                };
                const blended = {
                    x: wp.x * (1 - dissolve) + targetOnLine.x * dissolve,
                    y: wp.y * (1 - dissolve) + targetOnLine.y * dissolve
                };
                pts.push(blended);
            });
        }
        pts.push({ ...dstC });

        // the line starts just off the source and the tip just clears the stroke of
        // the target, so an arrow visibly arrives at the node it points to
        const marginSrc = 2;
        const pullBack = 1;

        if (pts.length > 1) {
            const next = pts[1];
            const edge = this._nodeEdgePoint(from, next);
            pts[0] = this._shiftAlong(edge, next, marginSrc);
        }
        if (pts.length > 1) {
            const prev = pts[pts.length - 2];
            const edge = this._nodeEdgePoint(to, prev);
            pts[pts.length - 1] = this._shiftAlong(edge, prev, pullBack);
        }
        return pts;
    }

    /**
     * Calculates the intersection point on a node's border.
     * @param {{x:number, y:number, width:number, height:number, shape:string}} node - The node.
     * @param {{x:number, y:number}} toward - The target point.
     * @returns {{x:number, y:number}} The intersection point.
     */
    _nodeEdgePoint(node, toward) {
        // use the visual shape dimensions (rectWidth/rectHeight) instead of the total bounding box
        const w = node.rectWidth || node.width;
        const h = node.rectHeight || node.height;

        if (node.shape === "circle") {
            const cx = node.x;
            const cy = node.y;
            const dx = toward.x - cx;
            const dy = toward.y - cy;
            if (dx === 0 && dy === 0) {
                return { x: cx, y: cy };
            }
            // use visual dimensions for radius calculation
            const r = Math.max(w, h) / 2;
            const len = Math.hypot(dx, dy) || 1;
            return { x: cx + (dx / len) * r, y: cy + (dy / len) * r };
        }

        // calculate top-left based on visual center and visual dimensions
        return this._rectEdgePointRaw({ x: node.x - w / 2, y: node.y - h / 2 }, toward, w, h);
    }

    /**
     * Calculates intersection on a rectangle.
     * @param {{x:number, y:number}} nodeTopLeft - Top-left coordinate.
     * @param {{x:number, y:number}} toward - Target point.
     * @param {number} [w=140] - Width.
     * @param {number} [h=52] - Height.
     * @returns {{x:number, y:number}} The intersection point.
     */
    _rectEdgePointRaw(nodeTopLeft, toward, w = 140, h = 52) {
        const cx = nodeTopLeft.x + w / 2;
        const cy = nodeTopLeft.y + h / 2;
        const dx = toward.x - cx;
        const dy = toward.y - cy;

        if (dx === 0 && dy === 0) {
            return { x: cx, y: cy };
        }

        const sx = w / 2;
        const sy = h / 2;
        const scale = Math.max(Math.abs(dx) / sx, Math.abs(dy) / sy);

        if (scale === 0) {
            return { x: cx, y: cy };
        }
        return { x: cx + dx / scale, y: cy + dy / scale };
    }

    /**
     * Generates the path data of an edge that ends in an arrow head: the line stops
     * where the head begins, and the head reaches on to the last point.
     * @param {Array<{x:number, y:number}>} points - The points from source to tip.
     * @returns {string} The path d attribute string.
     */
    _arrowPathData(points) {
        if (!points || points.length < 2) {
            return this._generatePathData(points);
        }
        const tip = points[points.length - 1];
        const before = points[points.length - 2];
        const length = Math.hypot(tip.x - before.x, tip.y - before.y);
        // a segment shorter than the head keeps a stub, so the head still has a direction
        const trim = Math.min(webexpress.webui.GraphViewerCtrl.ARROW_LENGTH, Math.max(0, length - 0.5));
        return this._generatePathData(points.slice(0, -1).concat([this._shiftAlong(tip, before, trim)]));
    }

    /**
     * Shifts a point along a segment.
     * @param {{x:number, y:number}} from - Start point.
     * @param {{x:number, y:number}} to - End point.
     * @param {number} dist - Distance to shift.
     * @returns {{x:number, y:number}} The shifted point.
     */
    _shiftAlong(from, to, dist) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        return { x: from.x + ux * dist, y: from.y + uy * dist };
    }

    /**
     * Calculates the midpoint for edge labels.
     * @param {Array<{x:number, y:number}>} pts - Points.
     * @returns {{x:number, y:number}} The midpoint.
     */
    _edgeLabelPoint(pts) {
        if (!Array.isArray(pts) || pts.length === 0) {
            return { x: 0, y: 0 };
        }
        if (pts.length === 1) {
            return pts[0];
        }

        let total = 0;
        const segs = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const dx = pts[i + 1].x - pts[i].x;
            const dy = pts[i + 1].y - pts[i].y;
            const len = Math.hypot(dx, dy);
            segs.push({ len, from: pts[i], to: pts[i + 1] });
            total += len;
        }

        const half = total / 2;
        let acc = 0;
        for (let i = 0; i < segs.length; i++) {
            const seg = segs[i];
            if (acc + seg.len >= half) {
                const t = (half - acc) / (seg.len || 1);
                return {
                    x: seg.from.x + (seg.to.x - seg.from.x) * t,
                    y: seg.from.y + (seg.to.y - seg.from.y) * t
                };
            }
            acc += seg.len;
        }
        const last = pts[pts.length - 1];
        return { x: last.x, y: last.y };
    }

    // ------------------------------------------------------------------ drag & physics

    /**
     * Starts dragging a node: the simulation wakes up, and the node follows the pointer
     * until it is released.
     * @param {object} n - The node record.
     * @param {PointerEvent} e - The pointer event.
     */
    _beginNodeDrag(n, e) {
        const p = this._toLocal(e);
        // check config before enabling physics
        if (this._configPhysics) {
            if (!this._physicsEnabled) {
                this._physicsEnabled = true;
                this._dissolving = true;
                this._dissolveProgress = 0;
            }
            // the loop stops itself once the layout settles, so a drag
            // has to be able to wake it again rather than assume it runs
            this._startAnimation();
        }
        n.fixed = true;
        n.vx = 0;
        n.vy = 0;
        n._wasDragged = false;
        this._drag = {
            node: n,
            offsetX: n.x - p.x,
            offsetY: n.y - p.y,
            startX: p.x,
            startY: p.y,
            pointerId: e.pointerId
        };
        const target = e.currentTarget || e.target;
        if (target && typeof target.setPointerCapture === "function") {
            target.setPointerCapture(e.pointerId);
        }
        this._attachDragListeners(target);
    }

    /**
     * Clears waypoints from all edges.
     */
    _flattenWaypoints() {
        this._model.edges.forEach(t => {
            t.waypoints = [];
        });
    }

    /**
     * Attaches drag listeners.
     * @param {Element} target - Capture target.
     */
    _attachDragListeners(target) {
        const move = (e) => {
            if (!this._drag) {
                return;
            }
            const p = this._toLocal(e);

            // calculate delta of movement
            const dx = (p.x + this._drag.offsetX) - this._drag.node.x;
            const dy = (p.y + this._drag.offsetY) - this._drag.node.y;

            // update node position
            this._drag.node.x = p.x + this._drag.offsetX;
            this._drag.node.y = p.y + this._drag.offsetY;
            this._drag.startX = p.x;
            this._drag.startY = p.y;
            this._drag.node.vx = 0;
            this._drag.node.vy = 0;

            if (dx !== 0 || dy !== 0) {
                this._drag.node._wasDragged = true;
                this._model.edges.forEach(edge => {
                    const isSelfLoop = (edge.from === this._drag.node.id && edge.to === this._drag.node.id);
                    const isSource = (edge.from === this._drag.node.id);
                    const isTarget = (edge.to === this._drag.node.id);

                    if (Array.isArray(edge.waypoints) && edge.waypoints.length > 0) {
                        if (isSelfLoop) {
                            // move ALL waypoints for self-loops
                            edge.waypoints.forEach(wp => {
                                wp.x += dx;
                                wp.y += dy;
                            });
                        } else if (isSource || isTarget) {
                            const count = edge.waypoints.length;
                            edge.waypoints.forEach((wp, i) => {
                                let factor = 0;
                                if (isSource) {
                                    factor = (count - i) / (count + 1);
                                } else {
                                    factor = (i + 1) / (count + 1);
                                }
                                wp.x += dx * factor;
                                wp.y += dy * factor;
                            });
                        }
                    }
                });
            }

            this._updateGeometry();
        };

        const up = () => {
            if (this._drag && target && typeof target.releasePointerCapture === "function") {
                try {
                    target.releasePointerCapture(this._drag.pointerId);
                } catch (e) {
                    // ignore
                }
            }
            if (this._drag) {
                this._drag.node.fixed = false;
            }
            this._drag = null;
            this._removeWindowListener("pointermove", move);
            this._removeWindowListener("pointerup", up);
            this._removeWindowListener("pointercancel", up);

            // releasing a node hands it back to the simulation, which has to
            // run again to let it and its neighbours settle
            this._startAnimation();
        };
        this._addWindowListener("pointermove", move);
        this._addWindowListener("pointerup", up);
        // a gesture the browser takes over (a touch scroll) ends without a pointerup
        this._addWindowListener("pointercancel", up);
    }

    /**
     * Advances the simulation by one frame.
     * @returns {boolean} True while another frame is still needed.
     */
    _tick() {
        const dt = 0.016;

        if (this._dissolving) {
            this._dissolveProgress = Math.min(1, this._dissolveProgress + dt / this._dissolveDuration);
            if (this._dissolveProgress >= 1) {
                this._dissolving = false;
                this._flattenWaypoints();
            }
        }

        if (!this._physicsEnabled) {
            // a dissolve still moves the waypoints, so geometry has to follow;
            // once it is done nothing changes on its own any more and the frame
            // loop has no reason to continue
            this._updateGeometry();
            return this._dissolving;
        }

        const k = 0.05;
        const rest = 200;
        const damping = 0.9;
        const repulse = 9000;
        // the records are read once: the accessor would be asked once per pair otherwise
        const nodes = this._nodes;
        const byId = new Map(nodes.map(n => [n.id, n]));

        this._edges.forEach(e => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) {
                return;
            }
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const force = k * (dist - rest);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (!a.fixed) {
                a.vx += fx * dt;
                a.vy += fy * dt;
            }
            if (!b.fixed) {
                b.vx -= fx * dt;
                b.vy -= fy * dt;
            }
        });

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist2 = dx * dx + dy * dy || 0.0001;
                const dist = Math.sqrt(dist2);
                const f = repulse / dist2;
                const fx = (dx / dist) * f;
                const fy = (dy / dist) * f;

                if (!a.fixed) {
                    a.vx -= fx * dt;
                    a.vy -= fy * dt;
                }
                if (!b.fixed) {
                    b.vx += fx * dt;
                    b.vy += fy * dt;
                }
            }
        }

        let peakVelocity = 0;

        nodes.forEach(n => {
            if (n.fixed) {
                return;
            }
            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
            peakVelocity = Math.max(peakVelocity, Math.abs(n.vx), Math.abs(n.vy));
        });

        this._updateGeometry();

        // a node held by the pointer keeps feeding energy into the system, so
        // the simulation stays live for as long as the gesture lasts
        return this._dissolving
            || this._drag !== null
            || peakVelocity > webexpress.webui.GraphViewerCtrl.SETTLE_VELOCITY;
    }

    /**
     * Starts the animation loop, or restarts it when a settled simulation has
     * been disturbed again. The loop ends itself as soon as the simulation
     * comes to rest, so an idle graph costs nothing. The frame that integrates the
     * positions also paints them, rather than leaving them to the next one.
     */
    _startAnimation() {
        if (this._destroyed || (!this._physicsEnabled && !this._dissolving)) {
            return;
        }

        this._animFrames = 0;

        const step = () => {
            this._animFrames += 1;
            const running = this._tick();

            if (this._destroyed) {
                this._anim = null;
                return;
            }
            this._store.flush();

            if (!running || this._animFrames >= webexpress.webui.GraphViewerCtrl.MAX_SIMULATION_FRAMES) {
                this._anim = null;
                return;
            }
            this._anim = window.requestAnimationFrame(step);
        };

        if (!this._anim) {
            this._anim = window.requestAnimationFrame(step);
        }
    }

    /**
     * Stops the animation loop.
     * @returns {void}
     */
    _stopAnimation() {
        if (this._anim) {
            window.cancelAnimationFrame(this._anim);
            this._anim = null;
        }
    }

    /**
     * Releases the frame loop, every listener the control installed and the DOM it
     * added to the host. Without this the frame loop keeps the whole control graph
     * reachable and running long after the host has left the document.
     */
    destroy() {
        this._destroyed = true;
        this._stopAnimation();
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        this._releaseListeners();

        this._drag = null;
        this._viewDrag = null;

        if (this._renderRoot) {
            this._renderRoot.replaceChildren();
        }
        this._viewControls = null;
        this._fitBtn = null;
        this._liveRegion = null;

        super.destroy();
        this._store.destroy();
    }

    /**
     * Gets the current model.
     * @returns {{nodes: Array, edges: Array}} The model.
     */
    get model() {
        return this._model;
    }

    /**
     * Sets the model and re-renders the graph.
     * @param {{nodes: Array, edges: Array}} val - The new model.
     */
    set model(val) {
        this._model = this._normalizeModel(val);
        const autoPhysics = this._buildPhysics();
        this.render();
        this._fitToView();
        // the fit belongs to the replaced model; a frame later the graph would first
        // show at the zoom of the previous one
        this._store.flush();

        // a replaced model may bring nodes without a position, which only the
        // simulation can place
        if (autoPhysics) {
            this._startAnimation();
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-graph-viewer", webexpress.webui.GraphViewerCtrl);
