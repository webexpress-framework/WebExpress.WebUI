/**
 * Graph viewer controller with pan, zoom, drag, and simple spring-mass physics.
 * Supports nodes with optional icons or images, edges with waypoint and labels.
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.DOUBLE_CLICK_EVENT
 */
webexpress.webui.GraphViewerCtrl = class extends webexpress.webui.Ctrl {
    static ICON_SIZE = 28;

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

    /**
     * Creates a new GraphViewer instance.
     * @param {HTMLElement} element - The host element.
     */
    constructor(element) {
        super(element);

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

        this._scale = 1;
        this._pan = { x: 0, y: 0 };
        this._viewDrag = null;

        this._model = this._normalizeModel(this._readFromDom(element));
        this._nodes = [];
        this._edges = [];
        this._drag = null;
        this._anim = null;
        this._animFrames = 0;
        this._destroyed = false;
        this._physicsEnabled = false;
        this._dissolving = false;
        this._dissolveProgress = 0;
        this._dissolveDuration = 0.6; // seconds

        if (!element.style.position) {
            element.style.position = "relative";
        }

        element.innerHTML = "";
        element.classList.add("wx-graph-viewer");
        element.style.userSelect = "none";
        this._addElementListener(element, "contextmenu", (e) => {
            e.preventDefault();
        });

        this._svg = this._createSvg();
        this._viewport = this._createGroup("viewport");
        this._svg.appendChild(this._viewport);
        element.appendChild(this._svg);

        // the grid is the bottom layer of the viewport, so it pans and zooms
        // with the content and the cells stay aligned to model coordinates
        this._gridLayer = this._createGroup("grid");
        this._viewport.appendChild(this._gridLayer);

        this._nodeLayer = this._createGroup("nodes");
        this._edgeLayer = this._createGroup("edges");
        this._viewport.appendChild(this._edgeLayer);
        this._viewport.appendChild(this._nodeLayer);

        const autoPhysics = this._buildPhysics();
        this.render();
        this._createViewControls();
        this._createLiveRegion();
        this._fitToView();

        if (autoPhysics) {
            this._startAnimation();
        }
    }

    /**
     * Applies an author-chosen paint value, or clears it again.
     *
     * The value goes on the inline style rather than on the fill/stroke
     * presentation attribute. A presentation attribute loses against every
     * stylesheet rule, and the theme defaults for labels and edges are exactly
     * such rules - so a colour chosen for a node or an edge was silently
     * overruled by the default. An inline style outranks both, which restores
     * the intended precedence: explicit colour beats css class beats theme.
     * @param {Element} element - The element to paint.
     * @param {string} property - "fill" or "stroke".
     * @param {string} value - The colour, or an empty value to clear it.
     */
    _applyPaint(element, property, value) {
        if (!element) {
            return;
        }
        if (value) {
            element.style[property] = value;
        } else {
            element.style[property] = "";
            // an earlier render may have left the attribute behind
            element.removeAttribute(property);
        }
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
     * Releases every recorded listener. Only the listeners on long-lived
     * targets are recorded; the per-node and per-edge handlers live on elements
     * that every render replaces wholesale and that cannot outlive the SVG.
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
    }

    /**
     * Creates the SVG root element with pan/zoom support.
     * @returns {SVGSVGElement} The SVG element.
     */
    _createSvg() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "wx-graph-svg");

        // the canvas is a single tab stop that owns its arrow keys, which is
        // what role=application expresses; without a tabindex the graph could
        // not be reached by keyboard at all, and a global key handler could not
        // tell whether a key press was meant for it
        svg.setAttribute("tabindex", "0");
        svg.setAttribute("role", "application");
        svg.setAttribute("aria-roledescription", this._i18n("webexpress.webui:graph.a11y.roledescription", "graph"));
        svg.setAttribute("aria-label", this._element.dataset.label
            || this._i18n("webexpress.webui:graph.a11y.canvas", "Graph canvas"));

        this._addElementListener(svg, "pointerdown", (e) => {
            e.preventDefault();
            // a pointer interaction moves the keyboard focus onto the canvas so
            // the two input paths stay on the same element
            this._focusCanvas();
        });
        this._addElementListener(svg, "contextmenu", (e) => {
            e.preventDefault();
        });
        this._addElementListener(svg, "wheel", (e) => {
            e.preventDefault();
            this._onWheel(e);
        }, { passive: false });
        this._addElementListener(svg, "pointerdown", (e) => {
            if (e.button === 0 && !this._viewDrag && e.target === svg) {
                this._beginPan(svg, e);
            }
        });
        return svg;
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
     * Draws the background grid across the area the content occupies, padded so
     * it keeps covering the canvas while the view is panned.
     */
    _renderGrid() {
        if (!this._gridLayer) {
            return;
        }
        this._gridLayer.innerHTML = "";

        if (this._gridSize <= 0) {
            return;
        }

        const rect = this._svg.getBoundingClientRect();
        const scale = this._scale || 1;
        const size = this._gridSize;

        // the visible area in local coordinates, generously padded so a pan does
        // not immediately run past the drawn cells
        const padding = Math.max(rect.width, rect.height) / scale;
        const left = Math.floor(((-this._pan.x / scale) - padding) / size) * size;
        const top = Math.floor(((-this._pan.y / scale) - padding) / size) * size;
        const right = left + (rect.width / scale) + padding * 2 + size;
        const bottom = top + (rect.height / scale) + padding * 2 + size;

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

        const append = (d, className, width) => {
            if (!d) {
                return;
            }
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("class", className);
            path.setAttribute("d", d.trim());
            path.setAttribute("fill", "none");
            // the stroke is specified in screen pixels, so the grid stays a hair
            // line rather than thickening as the user zooms in
            path.setAttribute("stroke-width", width / scale);
            path.setAttribute("pointer-events", "none");
            this._gridLayer.appendChild(path);
        };

        append(minor, "wx-graph-grid-line", 0.5);
        append(major, "wx-graph-grid-line-major", 1);
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
        if (!this._liveRegion) {
            return;
        }
        this._liveRegion.textContent = message || "";
    }

    /**
     * Creates the off-screen live region used for the spoken selection state.
     */
    _createLiveRegion() {
        if (this._liveRegion) {
            return;
        }
        const region = document.createElement("div");
        region.className = "wx-graph-live-region";
        region.setAttribute("role", "status");
        region.setAttribute("aria-live", "polite");
        this._liveRegion = region;
        this._element.appendChild(region);
    }

    /**
     * Creates the view controls that sit in the lower left corner of the canvas.
     *
     * They live on the canvas rather than in the editor toolbar because they act
     * on the view, not on the model: they change nothing that could be saved or
     * undone, and they are equally useful to the read-only viewer, which has no
     * toolbar at all.
     */
    _createViewControls() {
        if (this._viewControls) {
            return;
        }

        const controls = document.createElement("div");
        controls.className = "wx-graph-view-controls";

        /**
         * Adds one control button.
         * @param {string} faClass - The FontAwesome icon class.
         * @param {string} lightClass - The light-theme icon name.
         * @param {string} title - The tooltip and accessible name.
         * @param {Function} action - The click handler.
         * @returns {HTMLButtonElement} The button.
         */
        const add = (faClass, lightClass, title, action) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "wx-graph-fit-button";
            btn.title = title;
            btn.setAttribute("aria-label", title);

            const icon = document.createElement("i");
            icon.className = this._iconClass(faClass, lightClass);
            icon.setAttribute("aria-hidden", "true");
            btn.appendChild(icon);

            this._addElementListener(btn, "click", (e) => {
                e.stopPropagation();
                action();
            });
            controls.appendChild(btn);
            return btn;
        };

        this._fitBtn = add("fas fa-expand", "expand",
            this._i18n("webexpress.webui:graph.fit.view", "Fit to view"),
            () => this._fitToView());

        add("fas fa-crosshairs", "crosshairs",
            this._i18n("webexpress.webui:graph.center.view", "Centre the view"),
            () => this._centerView());

        add("fas fa-magnifying-glass-plus", "zoom-in",
            this._i18n("webexpress.webui:graph.zoom.in", "Zoom in"),
            () => this._zoomAt(1.2));

        add("fas fa-magnifying-glass-minus", "zoom-out",
            this._i18n("webexpress.webui:graph.zoom.out", "Zoom out"),
            () => this._zoomAt(1 / 1.2));

        this._viewControls = controls;
        this._element.appendChild(controls);
    }

    /**
     * Pans the view so the graph content sits in the middle of the canvas,
     * leaving the zoom level untouched. Fitting changes the scale as well, which
     * is not always wanted - a user who zoomed in deliberately only wants to
     * find the content again.
     */
    _centerView() {
        const bbox = this._computeContentBBox();
        if (!bbox) {
            return;
        }
        const rect = this._svg.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return;
        }

        const cx = (bbox.minX + bbox.maxX) / 2;
        const cy = (bbox.minY + bbox.maxY) / 2;

        this._pan.x = rect.width / 2 - cx * this._scale;
        this._pan.y = rect.height / 2 - cy * this._scale;
        this._applyViewTransform();
    }

    /**
     * Ensures the arrow marker exists and returns its URL reference.
     * @returns {string} The marker URL reference.
     */
    _ensureArrowMarker(color) {
        let defs = this._svg.querySelector("defs");
        if (!defs) {
            defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            this._svg.insertBefore(defs, this._svg.firstChild);
        }

        // a marker cannot inherit the stroke of the path that references it, so
        // an arrowhead that is to match its edge needs its own marker per colour
        const safeColor = String(color || "").replace(/[^a-zA-Z0-9]/g, "");
        const markerId = safeColor ? `wx-graph-viewer-arrow-${safeColor}` : "wx-graph-viewer-arrow";

        let marker = defs.querySelector("#" + markerId);
        if (!marker) {
            marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
            marker.classList.add("wx-graph-edge-arrow");
            marker.setAttribute("id", markerId);
            marker.setAttribute("viewBox", "0 0 12 12");
            marker.setAttribute("refX", "10");
            marker.setAttribute("refY", "7");
            marker.setAttribute("markerWidth", "12");
            marker.setAttribute("markerHeight", "12");
            marker.setAttribute("markerUnits", "strokeWidth");
            marker.setAttribute("orient", "auto-start-reverse");

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M 0 2 L 12 7 L 0 12 Z");
            if (color) {
                path.setAttribute("fill", color);
            }
            marker.appendChild(path);
            defs.appendChild(marker);
        }
        return `url(#${markerId})`;
    }

    /**
     * Initiates the panning operation.
     * @param {SVGSVGElement} svg - The SVG element.
     * @param {PointerEvent} e - The pointer event.
     */
    _beginPan(svg, e) {
        this._viewDrag = {
            startClientX: e.clientX,
            startClientY: e.clientY,
            panStartX: this._pan.x,
            panStartY: this._pan.y,
            pointerId: e.pointerId
        };
        svg.style.cursor = "grabbing";
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
            const dx = e.clientX - this._viewDrag.startClientX;
            const dy = e.clientY - this._viewDrag.startClientY;
            this._pan.x = this._viewDrag.panStartX + dx;
            this._pan.y = this._viewDrag.panStartY + dy;
            this._applyViewTransform();
        };

        const up = () => {
            if (this._viewDrag && typeof svg.releasePointerCapture === "function") {
                try {
                    svg.releasePointerCapture(this._viewDrag.pointerId);
                } catch (e) {
                    // ignore
                }
            }
            svg.style.cursor = "default";
            this._viewDrag = null;
            this._removeWindowListener("pointermove", move);
            this._removeWindowListener("pointerup", up);
        };
        this._addWindowListener("pointermove", move);
        this._addWindowListener("pointerup", up);
    }

    /**
     * Transforms pointer coordinates into SVG local coordinates.
     * @param {PointerEvent|MouseEvent} e - The pointer event.
     * @returns {{x: number, y: number}} Local coordinates.
     */
    _toLocal(e) {
        const pt = this._svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = (this._viewport && typeof this._viewport.getScreenCTM === "function" ? this._viewport.getScreenCTM() : null)
            || this._svg.getScreenCTM();
        return ctm ? pt.matrixTransform(ctm.inverse()) : { x: e.clientX, y: e.clientY };
    }

    /**
     * Creates an SVG group element.
     * @param {string} name - The layer name.
     * @returns {SVGGElement} The group element.
     */
    _createGroup(name) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("data-layer", name);
        return g;
    }

    /**
     * Applies the current pan/zoom transform to the viewport.
     */
    _applyViewTransform() {
        this._viewport.setAttribute("transform", `translate(${this._pan.x} ${this._pan.y}) scale(${this._scale})`);
        // the grid is drawn for the visible area, so it has to follow the view
        this._renderGrid();
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
        const oldScale = this._scale;
        const newScale = Math.min(3, Math.max(0.3, oldScale * factor));

        if (newScale === oldScale) {
            return;
        }

        const point = anchor || this._viewportCenter();
        this._scale = newScale;
        this._pan.x += point.x * (oldScale - newScale);
        this._pan.y += point.y * (oldScale - newScale);
        this._applyViewTransform();
    }

    /**
     * The centre of the visible area in local coordinates.
     * @returns {{x: number, y: number}} The centre point.
     */
    _viewportCenter() {
        const rect = this._svg.getBoundingClientRect();
        const scale = this._scale || 1;
        return {
            x: (rect.width / 2 - this._pan.x) / scale,
            y: (rect.height / 2 - this._pan.y) / scale
        };
    }

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

                return {
                    id: s.id || "",
                    label: s.label || s.id || "",
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
                    uri: typeof s.uri === "string" ? s.uri : ""
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
                uri: el.dataset.uri || ""
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
        const widthRect = Math.max(minW, paddingH * 2 + (iconW ? iconW + iconPad : 0) + textW);
        const heightRect = Math.max(minH, paddingV * 2 + 20);
        const shape = (data.shape || "").toLowerCase();

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
     * Renders the graph.
     */
    render() {
        this._ensureArrowMarker();
        this._edgeLayer.innerHTML = "";
        this._nodeLayer.innerHTML = "";
        this._renderEdges();
        this._renderNodes();
        this._updateGeometry();
        this._applyViewTransform();
    }

    /**
     * Renders all edges.
     */
    _renderEdges() {
        this._model.edges.forEach((t) => {
            const marker = this._ensureArrowMarker(t.color);
            const a = this._nodes.find(n => {
                return n.id === t.from;
            });
            const b = this._nodes.find(n => {
                return n.id === t.to;
            });
            if (!a || !b) {
                return;
            }

            const pts = this._edgePointsWithWaypoints(a, b, t.waypoints || [], this._dissolveProgress);
            // change from polyline to path for smooth curves
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("class", "wx-graph-viewer-edge");
            if (t.colorCss) {
                path.classList.add(t.colorCss);
            }
            path.setAttribute("data-id", t.id || "");
            path.setAttribute("data-label", t.label || "");

            // use helper to generate path data based on configuration
            path.setAttribute("d", this._generatePathData(pts));

            path.setAttribute("fill", "none");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");
            path.setAttribute("marker-end", marker);
            this._applyPaint(path, "stroke", t.color);
            if (t.dasharray) {
                path.setAttribute("stroke-dasharray", t.dasharray);
            }
            this._edgeLayer.appendChild(path);

            if (t.label) {
                const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                lbl.setAttribute("class", "wx-graph-edge-label");
                lbl.setAttribute("data-id", t.id || "");
                lbl.setAttribute("text-anchor", "middle");
                lbl.setAttribute("dominant-baseline", "middle");
                lbl.textContent = t.label;
                this._edgeLayer.appendChild(lbl);
            }
        });
    }

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
            const len = Math.hypot(o.x, o.y);
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

            const p1 = { x: srcC.x + w/4, y: srcC.y - h/2 };
            const p2 = { x: srcC.x + w/4, y: srcC.y - h/2 - loopOffset };
            const p3 = { x: srcC.x + w/2 + loopOffset, y: srcC.y - h/2 - loopOffset};
            const p4 = { x: srcC.x + w/2 + loopOffset, y: srcC.y - h/4 };
            const p5 = { x: srcC.x + w/2 + 5, y: srcC.y - h/8 };

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

        const marginSrc = 4;
        const pullBack = 8;

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
     * Renders nodes and attaches listeners.
     */
    _renderNodes() {
        this._nodes.forEach(n => {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("class", "wx-graph-node");
            g.setAttribute("data-id", n.id);
            // the shape carries no accessible name of its own, so the group
            // supplies one; keyboard reachability stays with the canvas, which
            // owns the roving selection
            g.setAttribute("role", "img");
            g.setAttribute("aria-label", n.data.label || n.id);

            const layout = (n.data.layout || "").toLowerCase();
            const iconBoxSize = webexpress.webui.GraphViewerCtrl.ICON_SIZE;
            const rectW = n.rectWidth || n.width;
            const rectH = n.rectHeight || n.height;
            let shapeEl = null;

            if (n.shape === "circle") {
                shapeEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                shapeEl.setAttribute("cx", n.x);
                shapeEl.setAttribute("cy", n.y);
                shapeEl.setAttribute("r", Math.max(rectW, rectH) / 2);
                shapeEl.setAttribute("class", "wx-graph-node-circle");
            } else {
                shapeEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                shapeEl.setAttribute("x", n.x - rectW / 2);
                shapeEl.setAttribute("y", n.y - rectH / 2);
                shapeEl.setAttribute("rx", 6);
                shapeEl.setAttribute("ry", 6);
                shapeEl.setAttribute("width", rectW);
                shapeEl.setAttribute("height", rectH);
                shapeEl.setAttribute("class", "wx-graph-node-rect");
            }

            if (n.data.backgroundCss) {
                shapeEl.classList.add(n.data.backgroundCss);
            }
            this._applyPaint(shapeEl, "fill", n.data.backgroundColor);

            const hasIcon = Boolean(n.data.image) || Boolean(n.data.icon);
            let iconEl = null;

            if (n.data.image) {
                const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
                img.setAttribute("class", "wx-graph-node-icon");
                img.setAttribute("data-role", "icon-image");
                img.setAttribute("href", n.data.image);
                img.setAttribute("width", iconBoxSize);
                img.setAttribute("height", iconBoxSize);
                img.setAttribute("pointer-events", "none");
                iconEl = img;
            } else if (n.data.icon) {
                const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
                fo.setAttribute("class", "wx-graph-node-icon");
                fo.setAttribute("data-role", "icon-fo");
                fo.setAttribute("width", iconBoxSize);
                fo.setAttribute("height", iconBoxSize);
                fo.setAttribute("pointer-events", "none");

                const iEl = document.createElementNS("http://www.w3.org/1999/xhtml", "i");
                iEl.setAttribute("class", [n.data.icon, n.data.foregroundCss || ""]
                    .filter(Boolean).join(" "));
                iEl.style.width = `${iconBoxSize}px`;
                iEl.style.height = `${iconBoxSize}px`;
                iEl.style.lineHeight = `${iconBoxSize}px`;
                iEl.style.textAlign = "center";
                if (n.data.foregroundColor) {
                    iEl.style.color = n.data.foregroundColor;
                }
                fo.appendChild(iEl);
                iconEl = fo;
            }

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("class", "wx-graph-node-label");
            if (n.data.foregroundCss) {
                text.classList.add(n.data.foregroundCss);
            }
            text.textContent = n.data.label || n.id;
            this._applyPaint(text, "fill", n.data.foregroundColor);

            // if uri is present, add underline style class
            if (n.data.uri) {
                text.classList.add("wx-graph-node-link");
            }

            if (layout === "label-below") {
                const centerX = n.x;
                let iconY = n.y - rectH / 2 + (rectH - iconBoxSize) / 2;
                if (iconEl) {
                    iconEl.setAttribute("x", centerX - iconBoxSize / 2);
                    iconEl.setAttribute("y", iconY);
                }
                g.appendChild(shapeEl);
                if (iconEl) {
                    g.appendChild(iconEl);
                }
                const textY = n.y + rectH / 2 + 6;
                text.setAttribute("x", centerX);
                text.setAttribute("y", textY);
                text.setAttribute("dominant-baseline", "hanging");
                g.appendChild(text);
            } else {
                g.appendChild(shapeEl);
                if (iconEl) {
                    iconEl.setAttribute("x", n.x - n.width / 2 + 12);
                    iconEl.setAttribute("y", n.y - iconBoxSize / 2);
                    g.appendChild(iconEl);
                }
                const textX = hasIcon ? n.x + iconBoxSize * 0.4 : n.x;
                text.setAttribute("x", textX);
                text.setAttribute("y", n.y + 5);
                text.removeAttribute("dominant-baseline");
                g.appendChild(text);
            }

            this._nodeLayer.appendChild(g);

            g.addEventListener("click", (e) => {
                e.stopPropagation();

                // if ctrl + click and uri is present, open url
                if (e.ctrlKey && n.data.uri) {
                    window.open(n.data.uri, "_self");
                    return;
                }

                const detail = { id: n.id, data: n.data };
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { detail, bubbles: true });
            });

            g.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                const detail = { id: n.id, data: n.data };

                // if uri is present, navigate to it on double click
                if (n.data.uri) {
                    window.open(n.data.uri, "_self");
                }

                this._dispatch(webexpress.webui.Event.DOUBLE_CLICK_EVENT, { detail, bubbles: true });
            });

            g.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
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
                g.style.cursor = "grabbing";
                g.setPointerCapture(e.pointerId);
                this._attachDragListeners(g);
            });
        });
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
            if (this._drag && typeof target.releasePointerCapture === "function") {
                try {
                    target.releasePointerCapture(this._drag.pointerId);
                } catch (e) {
                    // ignore
                }
            }
            target.style.cursor = "grab";
            if (this._drag) {
                this._drag.node.fixed = false;
            }
            this._drag = null;
            this._removeWindowListener("pointermove", move);
            this._removeWindowListener("pointerup", up);

            // releasing a node hands it back to the simulation, which has to
            // run again to let it and its neighbours settle
            this._startAnimation();
        };
        this._addWindowListener("pointermove", move);
        this._addWindowListener("pointerup", up);
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
            if (this._dissolving) {
                this._updateGeometry();
                return true;
            }
            this._updateGeometry();
            return false;
        }

        const k = 0.05;
        const rest = 200;
        const damping = 0.9;
        const repulse = 9000;

        this._edges.forEach(e => {
            const a = this._nodes.find(n => {
                return n.id === e.from;
            });
            const b = this._nodes.find(n => {
                return n.id === e.to;
            });
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

        for (let i = 0; i < this._nodes.length; i++) {
            for (let j = i + 1; j < this._nodes.length; j++) {
                const a = this._nodes[i];
                const b = this._nodes[j];
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

        this._nodes.forEach(n => {
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

    /**
     * Updates the SVG geometry based on the current model state.
     */
    _updateGeometry() {
        Array.from(this._nodeLayer.children).forEach(g => {
            const id = g.getAttribute("data-id");
            const n = this._nodes.find(nn => {
                return nn.id === id;
            });
            if (!n) {
                return;
            }
            const shapeEl = g.querySelector("rect, circle");
            const text = g.querySelector("text.wx-graph-node-label");
            const imgIcon = g.querySelector("[data-role='icon-image']");
            const foIcon = g.querySelector("[data-role='icon-fo']");
            const hasIcon = Boolean(n.data.image) || Boolean(n.data.icon);
            const layout = (n.data.layout || "").toLowerCase();
            const iconBoxSize = webexpress.webui.GraphViewerCtrl.ICON_SIZE;
            const rectW = n.rectWidth || n.width;
            const rectH = n.rectHeight || n.height;
            const imgSize = 22;

            // determine the size actually used for centering logic
            const currentIconSize = n.data.image ? imgSize : iconBoxSize;

            // update shape position and size
            if (n.shape === "circle") {
                shapeEl.setAttribute("cx", n.x);
                shapeEl.setAttribute("cy", n.y);
                shapeEl.setAttribute("r", Math.max(rectW, rectH) / 2);
            } else {
                shapeEl.setAttribute("x", n.x - rectW / 2);
                shapeEl.setAttribute("y", n.y - rectH / 2);
                shapeEl.setAttribute("width", rectW);
                shapeEl.setAttribute("height", rectH);
            }

            // handle visual hover highlights (for Editor/Interactive use)
            if (g.classList.contains("wx-graph-node-hover")) {
                shapeEl.classList.add("hover-highlight");
            } else {
                shapeEl.classList.remove("hover-highlight");
            }

            const rectClasses = ["wx-graph-node-rect"];
            if (n.data.backgroundCss) {
                rectClasses.push(n.data.backgroundCss);
            }
            // preserve existing classes on the shape (like hover-highlight added above or via classList manipulation elsewhere)
            const existingClasses = shapeEl.getAttribute("class") || "";
            if (existingClasses.includes("hover-highlight")) {
                rectClasses.push("hover-highlight");
            }

            // reset base class but keep dynamic ones
            shapeEl.setAttribute("class", rectClasses.join(" "));

            this._applyPaint(shapeEl, "fill", n.data.backgroundColor);

            if (imgIcon) {
                imgIcon.setAttribute("width", imgSize);
                imgIcon.setAttribute("height", imgSize);
            }
            if (foIcon) {
                foIcon.setAttribute("width", iconBoxSize);
                foIcon.setAttribute("height", iconBoxSize);
                const iEl = foIcon.firstChild;
                const desiredClass = [n.data.icon, n.data.foregroundCss || ""].filter(Boolean).join(" ");
                if (iEl && iEl.className !== desiredClass) {
                    iEl.className = desiredClass;
                }
                if (iEl) {
                    if (n.data.foregroundColor) {
                        iEl.style.color = n.data.foregroundColor;
                    } else {
                        iEl.style.color = "";
                    }
                    iEl.style.width = `${iconBoxSize}px`;
                    iEl.style.height = `${iconBoxSize}px`;
                    iEl.style.lineHeight = `${iconBoxSize}px`;
                }
            }

            if (layout === "label-below") {
                const centerX = n.x;
                const rectHalfH = rectH / 2;
                // use currentIconSize for correct vertical centering within the shape
                let iconY = n.y - rectHalfH + (rectH - currentIconSize) / 2;

                if (imgIcon) {
                    imgIcon.setAttribute("x", centerX - imgSize / 2);
                    imgIcon.setAttribute("y", iconY);
                }
                if (foIcon) {
                    foIcon.setAttribute("x", centerX - iconBoxSize / 2);
                    foIcon.setAttribute("y", iconY);
                }
                const textY = n.y + rectH / 2 + (n.data.shape == "circle" ? 16 : 6);
                text.setAttribute("x", centerX);
                text.setAttribute("y", textY);
                text.setAttribute("dominant-baseline", "hanging");
            } else {
                const textX = hasIcon ? n.x + iconBoxSize * 0.4 : n.x;
                text.setAttribute("x", textX);
                text.setAttribute("y", n.y + 5);
                text.removeAttribute("dominant-baseline");

                if (imgIcon) {
                    // center image icon vertically based on its own size
                    imgIcon.setAttribute("x", n.x - n.width / 2 + 12);
                    imgIcon.setAttribute("y", n.y - imgSize / 2);
                }
                if (foIcon) {
                    foIcon.setAttribute("x", n.x - n.width / 2 + 12);
                    foIcon.setAttribute("y", n.y - iconBoxSize / 2);
                }
            }

            text.className.baseVal = ["wx-graph-node-label", n.data.foregroundCss || ""].filter(Boolean).join(" ");

            // if uri is present, add link style
            if (n.data.uri) {
                text.classList.add("wx-graph-node-link");
            } else {
                text.classList.remove("wx-graph-node-link");
            }

            this._applyPaint(text, "fill", n.data.foregroundColor);
        });

        Array.from(this._edgeLayer.children).forEach(el => {
            const id = el.getAttribute("data-id");
            const t = this._model.edges.find(tt => {
                return tt.id === id;
            });
            if (!t) {
                return;
            }
            const a = this._nodes.find(n => {
                return n.id === t.from;
            });
            const b = this._nodes.find(n => {
                return n.id === t.to;
            });
            if (!a || !b) {
                return;
            }

            // check for path tag now
            if (el.tagName === "path") {
                const pts = this._edgePointsWithWaypoints(a, b, t.waypoints || [], this._dissolveProgress);
                // update d-attribute instead of points using the config-aware helper
                el.setAttribute("d", this._generatePathData(pts));

                el.setAttribute("data-label", t.label || "");
                el.className.baseVal = ["wx-graph-viewer-edge", t.colorCss || ""].filter(Boolean).join(" ");
                this._applyPaint(el, "stroke", t.color);
                // the arrowhead is a separate element, so a recoloured edge needs
                // to be pointed at the marker matching its new colour
                el.setAttribute("marker-end", this._ensureArrowMarker(t.color));
                if (t.dasharray) {
                    el.setAttribute("stroke-dasharray", t.dasharray);
                } else {
                    el.removeAttribute("stroke-dasharray");
                }
                // cache points for label positioning
                el._cachedPoints = pts;
            } else if (el.tagName === "text" && el.classList.contains("wx-graph-edge-label")) {
                const pathEl = Array.from(this._edgeLayer.children).find(p => {
                    return p.tagName === "path" && p.getAttribute("data-id") === id;
                });
                const pts = pathEl && pathEl._cachedPoints ? pathEl._cachedPoints : this._edgePointsWithWaypoints(a, b, t.waypoints || [], this._dissolveProgress);
                const pos = this._edgeLabelPoint(pts);
                el.setAttribute("x", pos.x);
                el.setAttribute("y", pos.y);
                el.textContent = t.label || "";
                if (t.colorCss) {
                    el.className.baseVal = ["wx-graph-edge-label", t.colorCss].join(" ");
                } else {
                    el.className.baseVal = "wx-graph-edge-label";
                }
            }
        });
    }

    /**
     * Starts the animation loop, or restarts it when a settled simulation has
     * been disturbed again. The loop ends itself as soon as the simulation
     * comes to rest, so an idle graph costs nothing.
     */
    _startAnimation() {
        if (this._destroyed || (!this._physicsEnabled && !this._dissolving)) {
            return;
        }

        this._animFrames = 0;

        const step = () => {
            this._animFrames += 1;
            const running = this._tick();

            if (this._destroyed || !running || this._animFrames >= webexpress.webui.GraphViewerCtrl.MAX_SIMULATION_FRAMES) {
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
     * Releases the frame loop, every listener the control installed outside its
     * own subtree and the DOM it added to the host. Without this the frame loop
     * keeps the whole control graph reachable and running long after the host
     * has left the document.
     */
    destroy() {
        this._destroyed = true;
        this._stopAnimation();
        this._releaseListeners();

        this._drag = null;
        this._viewDrag = null;

        if (this._viewControls && this._viewControls.parentNode) {
            this._viewControls.parentNode.removeChild(this._viewControls);
        }
        this._viewControls = null;
        this._fitBtn = null;

        if (this._liveRegion && this._liveRegion.parentNode) {
            this._liveRegion.parentNode.removeChild(this._liveRegion);
        }
        this._liveRegion = null;

        if (this._svg && this._svg.parentNode) {
            this._svg.parentNode.removeChild(this._svg);
        }

        super.destroy();
    }

    /**
     * Fits the graph content to the view.
     * @param {number} [padding=24] - Padding.
     */
    _fitToView(padding = 24) {
        const bbox = this._computeContentBBox();
        if (!bbox) {
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

        this._scale = scale;
        this._pan.x = w / 2 - cx * scale;
        this._pan.y = h / 2 - cy * scale;
        this._applyViewTransform();
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

        // a replaced model may bring nodes without a position, which only the
        // simulation can place
        if (autoPhysics) {
            this._startAnimation();
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-graph-viewer", webexpress.webui.GraphViewerCtrl);