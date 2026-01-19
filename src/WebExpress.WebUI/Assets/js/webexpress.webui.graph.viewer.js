/**
 * Graph viewer.
 * Display-only viewer with pan/zoom and simple spring-mass physics.
 * Dragging a status temporarily fixes it; connected nodes react physically.
 * Waypoints are initially shown; they dissolve smoothly on first drag.
 */
webexpress.webui.GraphViewerCtrl = class extends webexpress.webui.Ctrl {
    /**
     * @param {HTMLElement} element host element
     */
    constructor(element) {
        super(element);

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
        element.addEventListener("contextmenu", (e) => { e.preventDefault(); });

        this._svg = this._createSvg();
        this._viewport = this._createGroup("viewport");
        this._svg.appendChild(this._viewport);
        element.appendChild(this._svg);

        this._nodeLayer = this._createGroup("nodes");
        this._edgeLayer = this._createGroup("edges");
        this._viewport.appendChild(this._edgeLayer);
        this._viewport.appendChild(this._nodeLayer);

        this._buildPhysics();
        this.render();
        this._createFitButton();
        this._fitToView();
    }

    /**
     * Create svg root with pan/zoom handlers.
     * @returns {SVGSVGElement}
     */
    _createSvg() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "wx-graph-svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "520");
        svg.style.background = "var(--wx-graph-bg, #f8f9fa)";
        svg.style.userSelect = "none";
        svg.style.cursor = "default";
        svg.addEventListener("pointerdown", (e) => { e.preventDefault(); });
        svg.addEventListener("contextmenu", (e) => { e.preventDefault(); });
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
     * Create fit button.
     * @returns {void}
     */
    _createFitButton() {
        if (this._fitBtn) { return; }
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wx-graph-fit-button";
        btn.textContent = "⤢";
        btn.style.position = "absolute";
        btn.style.top = "8px";
        btn.style.right = "8px";
        btn.style.zIndex = "2";
        btn.style.padding = "4px 8px";
        btn.style.border = "1px solid #ced4da";
        btn.style.borderRadius = "4px";
        btn.style.background = "#fff";
        btn.style.cursor = "pointer";
        btn.addEventListener("click", () => {
            this._fitToView();
        });
        this._fitBtn = btn;
        this._svg.parentElement.appendChild(btn);
    }

    /**
     * Ensure arrow marker exists.
     * @returns {string} marker URL
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
            marker.setAttribute("id", "wx-graph-viewer-arrow");
            marker.setAttribute("viewBox", "0 0 14 14");
            marker.setAttribute("refX", "12");
            marker.setAttribute("refY", "7");
            marker.setAttribute("markerWidth", "14");
            marker.setAttribute("markerHeight", "14");
            marker.setAttribute("markerUnits", "strokeWidth");
            marker.setAttribute("orient", "auto-start-reverse");
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M 0 0 L 14 7 L 0 14 z");
            path.setAttribute("fill", "context-stroke");
            path.setAttribute("stroke", "none");
            marker.appendChild(path);
            defs.appendChild(marker);
        }
        return "url(#wx-graph-viewer-arrow)";
    }

    /**
     * Begin panning.
     * @param {SVGSVGElement} svg svg element
     * @param {PointerEvent} e pointer event
     * @returns {void}
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
     * Attach pan listeners.
     * @param {SVGSVGElement} svg svg element
     * @returns {void}
     */
    _attachPanListeners(svg) {
        const move = (e) => {
            if (!this._viewDrag) { return; }
            const dx = e.clientX - this._viewDrag.startClientX;
            const dy = e.clientY - this._viewDrag.startClientY;
            this._pan.x = this._viewDrag.panStartX + dx;
            this._pan.y = this._viewDrag.panStartY + dy;
            this._applyViewTransform();
        };
        const up = () => {
            if (this._viewDrag && typeof svg.releasePointerCapture === "function") {
                try { svg.releasePointerCapture(this._viewDrag.pointerId); } catch (e) { /* ignore */ }
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
     * Convert pointer to local svg coordinates.
     * @param {PointerEvent|MouseEvent} e pointer event
     * @returns {{x:number,y:number}}
     */
    _toLocal(e) {
        const pt = this._svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = this._svg.getScreenCTM();
        return ctm ? pt.matrixTransform(ctm.inverse()) : { x: e.clientX, y: e.clientY };
    }

    /**
     * Create group element.
     * @param {string} name layer name
     * @returns {SVGGElement}
     */
    _createGroup(name) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("data-layer", name);
        return g;
    }

    /**
     * Apply current pan/zoom.
     * @returns {void}
     */
    _applyViewTransform() {
        this._viewport.setAttribute("transform", `translate(${this._pan.x} ${this._pan.y}) scale(${this._scale})`);
    }

    /**
     * Zoom handler.
     * @param {WheelEvent} e wheel event
     * @returns {void}
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
     * Normalize incoming model.
     * @param {object} model raw model
     * @returns {{nodes: Array, edges: Array}}
     */
    _normalizeModel(model) {
        const nodes = Array.isArray(model?.nodes) ? model.nodes : [];
        const edges = Array.isArray(model?.edges) ? model.edges : [];

        const normNodes = nodes
            .filter(s => { return s && typeof s === "object"; })
            .map(s => {
                return {
                    id: s.id || "",
                    label: s.label || s.id || "",
                    x: Number.isFinite(s.x) ? s.x : parseFloat(s.x || "0") || 0,
                    y: Number.isFinite(s.y) ? s.y : parseFloat(s.y || "0") || 0,
                    foregroundColor: typeof s.foregroundColor === "string" ? s.foregroundColor : (typeof s.foreground === "string" ? s.foreground : ""),
                    foregroundCss: typeof s.foregroundCss === "string" ? s.foregroundCss : "",
                    backgroundColor: typeof s.backgroundColor === "string" ? s.backgroundColor : "",
                    backgroundCss: typeof s.backgroundCss === "string" ? s.backgroundCss : "",
                    icon: typeof s.icon === "string" ? s.icon : ""
                };
            });

        const normEdges = edges
            .map(t => {
                if (!t || typeof t !== "object") {
                    return { id: String(t || ""), from: "", to: "", color: "", colorCss: "", dasharray: "", waypoints: [] };
                }
                let wps = [];
                if (Array.isArray(t.waypoints)) {
                    wps = t.waypoints;
                } else if (typeof t.waypoints === "string") {
                    try { wps = JSON.parse(t.waypoints); } catch (e) { wps = []; }
                }
                wps = Array.isArray(wps) ? wps.filter(w => { return w && typeof w === "object"; }).map(w => {
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
                    waypoints: wps
                };
            });

        return { nodes: normNodes, edges: normEdges };
    }

    /**
     * Read initial model from DOM.
     * @param {HTMLElement} element host
     * @returns {{nodes: Array, edges: Array}}
     */
    _readFromDom(element) {
        const nodes = Array.from(element.querySelectorAll(".wx-graph-node")).map(el => {
            return {
                id: el.id || "",
                label: el.dataset.label || el.dataset.id || "",
                x: parseFloat(el.dataset.x || "0"),
                y: parseFloat(el.dataset.y || "0"),
                foregroundColor: el.dataset.foregroundColor || "",
                foregroundCss: el.dataset.foregroundCss || "",
                backgroundColor: el.dataset.backgroundColor || "",
                backgroundCss: el.dataset.backgroundCss || "",
                icon: el.dataset.icon || ""
            };
        });
        const edges = Array.from(element.querySelectorAll(".wx-graph-edge")).map(el => {
            let waypoints = [];
            try { waypoints = JSON.parse(el.dataset.waypoints || "[]"); } catch (e) { waypoints = []; }
            return {
                id: el.id || "",
                from: el.dataset.from || "",
                to: el.dataset.to || "",
                waypoints: Array.isArray(waypoints) ? waypoints : [],
                color: el.dataset.color || "",
                colorCss: el.dataset.colorCss || "",
                dasharray: el.dataset.dasharray || ""
            };
        });
        return { nodes, edges };
    }

    /**
     * Build physics nodes and edges (nodes stored as centers aligned to editor).
     * @returns {void}
     */
    _buildPhysics() {
        const w = 140;
        const h = 52;
        this._nodes = this._model.nodes.map(s => {
            return {
                id: s.id,
                data: s,
                x: (s.x || 0) + w / 2,
                y: (s.y || 0) + h / 2,
                vx: 0,
                vy: 0,
                fixed: false
            };
        });
        this._edges = this._model.edges
            .filter(t => { return t && t.from && t.to; })
            .map(t => {
                return {
                    id: t.id || "",
                    from: t.from,
                    to: t.to,
                    color: t.color,
                    colorCss: t.colorCss,
                    dasharray: t.dasharray,
                    waypoints: t.waypoints || []
                };
            });
    }

    /**
     * Render nodes and edges.
     * @returns {void}
     */
    render() {
        this._ensureArrowMarker();
        this._edgeLayer.innerHTML = "";
        this._nodeLayer.innerHTML = "";
        this._renderEdges();
        this._renderNodes();
        this._applyViewTransform();
    }

    /**
     * Render edges with optional waypoints and arrow heads.
     * @returns {void}
     */
    _renderEdges() {
        const marker = this._ensureArrowMarker();
        this._model.edges.forEach((t) => {
            const a = this._nodes.find(n => { return n.id === t.from; });
            const b = this._nodes.find(n => { return n.id === t.to; });
            if (!a || !b) { return; }
            const pts = this._edgePointsWithWaypoints(a, b, t.waypoints || [], this._dissolveProgress);
            const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            poly.setAttribute("class", "wx-graph-viewer-edge");
            if (t.colorCss) { poly.classList.add(t.colorCss); }
            poly.setAttribute("data-id", t.id || "");
            poly.setAttribute("points", pts.map(p => `${p.x},${p.y}`).join(" "));
            poly.setAttribute("fill", "none");
            poly.setAttribute("stroke-linecap", "round");
            poly.setAttribute("stroke-linejoin", "round");
            poly.setAttribute("marker-end", marker);
            if (t.color) { poly.setAttribute("stroke", t.color); } else { poly.removeAttribute("stroke"); }
            if (t.dasharray) { poly.setAttribute("stroke-dasharray", t.dasharray); }
            this._edgeLayer.appendChild(poly);
        });
    }

    /**
     * Compute edge polyline points using waypoints and clipping, with dissolve factor.
     * @param {object} from node source
     * @param {object} to node target
     * @param {Array<{x:number,y:number}>} wps waypoints
     * @param {number} dissolve 0..1
     * @returns {Array<{x:number,y:number}>}
     */
    _edgePointsWithWaypoints(from, to, wps, dissolve) {
        const w = 140;
        const h = 52;
        const center = (n) => { return { x: n.x, y: n.y }; };
        const srcC = center(from);
        const dstC = center(to);

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
            const edge = this._rectEdgePointRaw({ x: srcC.x - w / 2, y: srcC.y - h / 2 }, next, w, h);
            pts[0] = this._shiftAlong(edge, next, marginSrc);
        }
        if (pts.length > 1) {
            const prev = pts[pts.length - 2];
            const edge = this._rectEdgePointRaw({ x: dstC.x - w / 2, y: dstC.y - h / 2 }, prev, w, h);
            pts[pts.length - 1] = this._shiftAlong(edge, prev, pullBack);
        }
        return pts;
    }

    /**
     * Intersection with node rectangle (top-left based node, width/height).
     * @param {{x:number,y:number}} nodeTopLeft top-left of node
     * @param {{x:number,y:number}} toward target point
     * @param {number} w width
     * @param {number} h height
     * @returns {{x:number,y:number}}
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
     * Shift a point along a segment.
     * @param {{x:number,y:number}} from start
     * @param {{x:number,y:number}} to end
     * @param {number} dist distance
     * @returns {{x:number,y:number}}
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
     * Render nodes with drag.
     * @returns {void}
     */
    _renderNodes() {
        const w = 140;
        const h = 52;
        this._nodes.forEach(n => {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("class", "wx-graph-node");
            g.setAttribute("data-id", n.id);
            g.style.cursor = "grab";

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", n.x - w / 2);
            rect.setAttribute("y", n.y - h / 2);
            rect.setAttribute("rx", 6);
            rect.setAttribute("ry", 6);
            rect.setAttribute("width", w);
            rect.setAttribute("height", h);
            rect.setAttribute("class", "wx-graph-node-rect");
            if (n.data.backgroundCss) { rect.classList.add(n.data.backgroundCss); }
            if (n.data.backgroundColor) { rect.setAttribute("fill", n.data.backgroundColor); } else { rect.removeAttribute("fill"); }

            const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
            icon.setAttribute("x", n.x - w / 2 + 18);
            icon.setAttribute("y", n.y + 5);
            icon.setAttribute("text-anchor", "middle");
            icon.setAttribute("class", "wx-graph-node-icon");
            icon.textContent = n.data.icon || "";
            if (n.data.foregroundCss) { icon.classList.add(n.data.foregroundCss); }
            if (n.data.foregroundColor) { icon.setAttribute("fill", n.data.foregroundColor); }

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", n.x + 12);
            text.setAttribute("y", n.y + 5);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("class", "wx-graph-node-label");
            if (n.data.foregroundCss) { text.classList.add(n.data.foregroundCss); }
            text.textContent = n.data.label || n.id;
            if (n.data.foregroundColor) { text.setAttribute("fill", n.data.foregroundColor); }

            g.appendChild(rect);
            if (n.data.icon) { g.appendChild(icon); }
            g.appendChild(text);
            this._nodeLayer.appendChild(g);

            g.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
                const p = this._toLocal(e);
                if (!this._physicsEnabled) {
                    this._physicsEnabled = true;
                    this._dissolving = true;
                    this._dissolveProgress = 0;
                    this._startAnimation();
                }
                n.fixed = true;
                n.vx = 0;
                n.vy = 0;
                n.x = p.x;
                n.y = p.y;
                this._drag = {
                    node: n,
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
     * Flatten waypoints in model edges (after dissolve completes).
     * @returns {void}
     */
    _flattenWaypoints() {
        this._model.edges.forEach(t => {
            t.waypoints = [];
        });
    }

    /**
     * Attach drag listeners for node drag.
     * @param {Element} target capture target
     * @returns {void}
     */
    _attachDragListeners(target) {
        const move = (e) => {
            if (!this._drag) { return; }
            const p = this._toLocal(e);
            const dx = p.x - this._drag.startX;
            const dy = p.y - this._drag.startY;
            this._drag.node.x = this._drag.node.x + dx;
            this._drag.node.y = this._drag.node.y + dy;
            this._drag.startX = p.x;
            this._drag.startY = p.y;
            this._drag.node.vx = 0;
            this._drag.node.vy = 0;
            this._updateGeometry();
        };
        const up = () => {
            if (this._drag && typeof target.releasePointerCapture === "function") {
                try { target.releasePointerCapture(this._drag.pointerId); } catch (e) { /* ignore */ }
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
     * Physics tick using Hooke springs with damping and repulsion; handles waypoint dissolve.
     * @returns {void}
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
            const a = this._nodes.find(n => { return n.id === e.from; });
            const b = this._nodes.find(n => { return n.id === e.to; });
            if (!a || !b) { return; }
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
            if (n.fixed) { return; }
            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
        });

        this._updateGeometry();
    }

    /**
     * Update geometry for nodes and edges.
     * @returns {void}
     */
    _updateGeometry() {
        const w = 140;
        const h = 52;
        Array.from(this._nodeLayer.children).forEach(g => {
            const id = g.getAttribute("data-id");
            const n = this._nodes.find(nn => { return nn.id === id; });
            if (!n) { return; }
            const rect = g.querySelector("rect");
            const text = g.querySelector("text.wx-graph-node-label");
            const icon = g.querySelector("text.wx-graph-node-icon");
            rect.setAttribute("x", n.x - w / 2);
            rect.setAttribute("y", n.y - h / 2);
            const rectClasses = ["wx-graph-node-rect"];
            if (n.data.backgroundCss) { rectClasses.push(n.data.backgroundCss); }
            rect.setAttribute("class", rectClasses.join(" "));
            if (n.data.backgroundColor) { rect.setAttribute("fill", n.data.backgroundColor); } else { rect.removeAttribute("fill"); }
            if (icon) {
                icon.setAttribute("x", n.x - w / 2 + 18);
                icon.setAttribute("y", n.y + 5);
                icon.className.baseVal = ["wx-graph-node-icon", n.data.foregroundCss || ""].filter(Boolean).join(" ");
                if (n.data.foregroundColor) { icon.setAttribute("fill", n.data.foregroundColor); } else { icon.removeAttribute("fill"); }
            }
            text.setAttribute("x", n.x + 12);
            text.setAttribute("y", n.y + 5);
            text.className.baseVal = ["wx-graph-node-label", n.data.foregroundCss || ""].filter(Boolean).join(" ");
            if (n.data.foregroundColor) { text.setAttribute("fill", n.data.foregroundColor); } else { text.removeAttribute("fill"); }
        });
        Array.from(this._edgeLayer.children).forEach(poly => {
            const id = poly.getAttribute("data-id");
            const t = this._model.edges.find(tt => { return tt.id === id; });
            if (!t) { return; }
            const a = this._nodes.find(n => { return n.id === t.from; });
            const b = this._nodes.find(n => { return n.id === t.to; });
            if (!a || !b) { return; }
            const pts = this._edgePointsWithWaypoints(a, b, t.waypoints || [], this._dissolveProgress);
            poly.setAttribute("points", pts.map(p => `${p.x},${p.y}`).join(" "));
            poly.className.baseVal = ["wx-graph-viewer-edge", t.colorCss || ""].filter(Boolean).join(" ");
            if (t.color) { poly.setAttribute("stroke", t.color); } else { poly.removeAttribute("stroke"); }
            if (t.dasharray) { poly.setAttribute("stroke-dasharray", t.dasharray); } else { poly.removeAttribute("stroke-dasharray"); }
        });
    }

    /**
     * Start animation loop.
     * @returns {void}
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
     * Stop animation loop.
     * @returns {void}
     */
    _stopAnimation() {
        if (this._anim) {
            window.cancelAnimationFrame(this._anim);
            this._anim = null;
        }
    }

    /**
     * Fit content into view with padding, considering rectangle sizes.
     * @param {number} padding padding in px
     * @returns {void}
     */
    _fitToView(padding = 24) {
        const bbox = this._computeContentBBox();
        if (!bbox) { return; }
        const rect = this._svg.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w <= 0 || h <= 0) { return; }
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
     * Compute bounding box of nodes (full rect) and waypoints.
     * @returns {{minX:number,minY:number,maxX:number,maxY:number}|null}
     */
    _computeContentBBox() {
        const w = 140;
        const h = 52;
        const pts = [];
        this._model.nodes.forEach(s => {
            pts.push({ x: s.x || 0, y: s.y || 0 });
            pts.push({ x: (s.x || 0) + w, y: (s.y || 0) + h });
        });
        this._model.edges.forEach(t => {
            if (Array.isArray(t.waypoints)) {
                t.waypoints.forEach(wp => {
                    pts.push({ x: wp.x, y: wp.y });
                });
            }
        });
        if (pts.length === 0) { return null; }
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
     * Model getter.
     * @returns {{nodes:Array, edges:Array}}
     */
    get model() {
        return this._model;
    }

    /**
     * Model setter.
     * @param {{nodes:Array, edges:Array}} val new model
     */
    set model(val) {
        this._model = this._normalizeModel(val);
        this._buildPhysics();
        this.render();
        this._fitToView();
    }
};

webexpress.webui.Controller.registerClass("wx-webui-graph-viewer", webexpress.webui.GraphViewerCtrl);