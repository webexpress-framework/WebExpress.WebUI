/**
 * Graph viewer controller with pan, zoom, drag, and simple spring-mass physics.
 * Supports nodes with optional icons or images, edges with waypoint and labels.
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.DOUBLE_CLICK_EVENT
 */
webexpress.webui.GraphViewerCtrl = class extends webexpress.webui.Ctrl {
    static ICON_SIZE = 28;

    /**
     * Creates a new GraphViewer instance.
     * @param {HTMLElement} element - The host element.
     */
    constructor(element) {
        super(element);

        this._nodeStyle = (element.dataset.nodeStyle || "").toLowerCase();
        // read edge style configuration, default is 'smooth'
        this._edgeStyle = (element.dataset.edgeStyle || "smooth").toLowerCase();

        // read physics configuration. true by default unless explicitly set to "false"
        const physicsAttr = element.dataset.physicsEnabled;
        this._configPhysics = physicsAttr !== "false";

        this._scale = 1;
        this._pan = { x: 0, y: 0 };
        this._viewDrag = null;

        this._model = this._normalizeModel(this._readFromDom(element));
        this._nodes = [];
        this._edges = [];
        this._drag = null;
        this._anim = null;
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
        element.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });

        this._svg = this._createSvg();
        this._viewport = this._createGroup("viewport");
        this._svg.appendChild(this._viewport);
        element.appendChild(this._svg);

        this._nodeLayer = this._createGroup("nodes");
        this._edgeLayer = this._createGroup("edges");
        this._viewport.appendChild(this._edgeLayer);
        this._viewport.appendChild(this._nodeLayer);

        const autoPhysics = this._buildPhysics();
        this.render();
        this._createFitButton();
        this._fitToView();

        if (autoPhysics) {
            this._startAnimation();
        }
    }

    /**
     * Creates the SVG root element with pan/zoom support.
     * @returns {SVGSVGElement} The SVG element.
     */
    _createSvg() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "wx-graph-svg");

        svg.addEventListener("pointerdown", (e) => {
            e.preventDefault();
        });
        svg.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });
        svg.addEventListener("wheel", (e) => {
            e.preventDefault();
            this._onWheel(e);
        }, { passive: false });
        svg.addEventListener("pointerdown", (e) => {
            if (e.button === 0 && !this._viewDrag && e.target === svg) {
                this._beginPan(svg, e);
            }
        });
        return svg;
    }

    /**
     * Creates the fit-to-view button.
     */
    _createFitButton() {
        if (this._fitBtn) {
            return;
        }
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wx-graph-fit-button";
        btn.title = this._i18n("webexpress.webui:fit", "Fit to view");
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-expand";
        btn.appendChild(icon);

        btn.addEventListener("click", () => {
            this._fitToView();
        });
        this._fitBtn = btn;
        this._svg.parentElement.appendChild(btn);
    }

    /**
     * Ensures the arrow marker exists and returns its URL reference.
     * @returns {string} The marker URL reference.
     */
    _ensureArrowMarker() {
        let defs = this._svg.querySelector("defs");
        if (!defs) {
            defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            this._svg.insertBefore(defs, this._svg.firstChild);
        }
        let marker = defs.querySelector("#wx-graph-viewer-arrow");
        if (!marker) {
            marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
            marker.classList.add("wx-graph-edge-arrow");
            marker.setAttribute("id", "wx-graph-viewer-arrow");
            marker.setAttribute("viewBox", "0 0 12 12");
            marker.setAttribute("refX", "10");
            marker.setAttribute("refY", "7");
            marker.setAttribute("markerWidth", "12");
            marker.setAttribute("markerHeight", "12");
            marker.setAttribute("markerUnits", "strokeWidth");
            marker.setAttribute("orient", "auto-start-reverse");

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M 0 2 L 12 7 L 0 12 Z");
            marker.appendChild(path);
            defs.appendChild(marker);
        }
        return "url(#wx-graph-viewer-arrow)";
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
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
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
    }

    /**
     * Handles zooming via mouse wheel.
     * @param {WheelEvent} e - The wheel event.
     */
    _onWheel(e) {
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.min(3, Math.max(0.3, this._scale * factor));
        const before = this._toLocal(e);
        const oldScale = this._scale;

        this._scale = newScale;
        this._pan.x += before.x * (oldScale - newScale);
        this._pan.y += before.y * (oldScale - newScale);
        this._applyViewTransform();
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
        const marker = this._ensureArrowMarker();
        this._model.edges.forEach((t) => {
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
            if (t.color) {
                path.setAttribute("stroke", t.color);
            } else {
                path.removeAttribute("stroke");
            }
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
        // default to smooth curve
        return this._generateSmoothPath(points);
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
            if (n.data.backgroundColor) {
                shapeEl.setAttribute("fill", n.data.backgroundColor);
            } else {
                shapeEl.removeAttribute("fill");
            }

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
            if (n.data.foregroundColor) {
                text.setAttribute("fill", n.data.foregroundColor);
            }

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
                if (!this._physicsEnabled && this._configPhysics) {
                    this._physicsEnabled = true;
                    this._dissolving = true;
                    this._dissolveProgress = 0;
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
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
    }

    /**
     * Physics simulation tick.
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
            this._updateGeometry();
            return;
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

        this._nodes.forEach(n => {
            if (n.fixed) {
                return;
            }
            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
        });

        this._updateGeometry();
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

            if (n.data.backgroundColor) {
                shapeEl.setAttribute("fill", n.data.backgroundColor);
            } else {
                shapeEl.removeAttribute("fill");
            }

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

            if (n.data.foregroundColor) {
                text.setAttribute("fill", n.data.foregroundColor);
            } else {
                text.removeAttribute("fill");
            }
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
                if (t.color) {
                    el.setAttribute("stroke", t.color);
                } else {
                    el.removeAttribute("stroke");
                }
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
     * Starts the animation loop.
     */
    _startAnimation() {
        const step = () => {
            this._tick();
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
        this._buildPhysics();
        this.render();
        this._fitToView();
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-graph-viewer", webexpress.webui.GraphViewerCtrl);