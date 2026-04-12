/**
 * Graph editor controller.
 * Features:
 * - Double-click node: Edit Properties
 * - Double-click edge: Add Waypoint
 * - Edge Creation: Shows preview arrow from source to mouse
 * - Edge Reconnect: Highlights target nodes on hover
 */
webexpress.webui.GraphEditorCtrl = class extends webexpress.webui.GraphViewerCtrl {
    /**
     * Constructor for the graph editor control.
     * @param {HTMLElement} element - host element
     */
    constructor(element) {
        super(element);

        element.classList.add("wx-graph-editor");
        element.style.position = "relative";
        element.style.display = "flex";
        element.style.flexDirection = "column";
        element.style.overflow = "hidden";
        element.style.height = "100%";
        element.style.width = "100%";

        // cache for per-color arrow markers (may already exist from early render)
        if (!this._arrowMarkers) {
            this._arrowMarkers = {};
        }

        // toolbar
        this._toolbarContainer = document.createElement("div");
        this._toolbarContainer.className = "wx-graph-simple-toolbar";

        if (this._svg && this._svg.parentNode === element) {
            element.insertBefore(this._toolbarContainer, this._svg);
        } else {
            element.appendChild(this._toolbarContainer);
        }

        this._buildSimpleToolbar();

        // history (Undo/Redo)
        this._undoStack = [];
        this._redoStack = [];
        this._saveStateToHistory(true);

        // editor state
        this._drag = null;
        this._dragSnapshot = null;
        this._selectedEdgeId = null;
        this._selectedNodeId = null;
        this._hoveredNodeId = null;
        this._isAddEdgeMode = false;
        this._edgeSourceNode = null;
        this._endpointDrag = null;

        // helper for the preview line
        this._previewEdgePath = null;

        if (!this._waypointLayer) {
            this._waypointLayer = this._createGroup("waypoints");
            this._viewport.appendChild(this._waypointLayer);
        }

        // preview layer for creating edges
        this._previewLayer = this._createGroup("preview");
        this._viewport.appendChild(this._previewLayer);

        if (!this._handleLayer) {
            this._handleLayer = this._createGroup("handles");
            this._viewport.appendChild(this._handleLayer);
        }
        if (!this._markerLayer) {
            this._markerLayer = this._createGroup("markers");
            this._viewport.appendChild(this._markerLayer);
        }

        this._onPointerMoveBound = (e) => {
            this._onPointerMove(e);
        };
        this._onPointerUpBound = (e) => {
            this._onPointerUpGlobal(e);
        };
        this._onKeyDownBound = (e) => {
            this._onKeyDown(e);
        };

        this._svg.addEventListener("pointermove", this._onPointerMoveBound);
        window.addEventListener("pointerup", this._onPointerUpBound);
        window.addEventListener("keydown", this._onKeyDownBound);

        this._svg.addEventListener("click", (e) => {
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
        });

        this._svg.addEventListener("dblclick", (e) => {
            // check for node -> edit modal
            const isNode = e.target.closest(".wx-graph-node");
            if (isNode) {
                const id = isNode.getAttribute("data-id");
                this._selectedNodeId = id;
                this._selectedEdgeId = null;
                this._updateToolbarState();
                this._openPropertiesModal();
                return;
            }

            // check for waypoint -> do nothing (handled by context menu)
            const isWp = e.target.closest(".wx-workflow-waypoint");
            if (isWp) {
                return;
            }

            // check for edge path element -> skip, handled by edge dblclick
            const isEdgePath = e.target.closest(".wx-workflow-edge");
            if (isEdgePath) {
                return;
            }

            // check for edge (click near) -> add waypoint
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
                // background -> add node
                this._addNode();
            }
        });

        // re-render now that the editor is fully initialized
        this.render();
    }

    /**
     * Returns the defs element of the SVG, creating it if necessary.
     * @returns {SVGDefsElement|null} the defs element, or null if svg is not ready
     */
    _ensureDefs() {
        if (!this._svg) {
            return null;
        }
        let defs = this._svg.querySelector("defs");
        if (!defs) {
            defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            this._svg.insertBefore(defs, this._svg.firstChild);
        }
        return defs;
    }

    /**
     * Returns a marker-end url reference for an arrow marker in the given color.
     * Creates the marker in the SVG defs if it does not yet exist.
     * Uses markerUnits="userSpaceOnUse" so the arrow size is independent
     * of the edge stroke-width.
     * @param {string} color - the fill color for the arrowhead
     * @returns {string} url reference, e.g. "url(#wx-arrow-ff6600)"
     */
    _getArrowMarkerUrl(color) {
        // lazy-initialize the cache in case this is called during super() construction
        if (!this._arrowMarkers) {
            this._arrowMarkers = {};
        }

        // normalize color to a safe id suffix
        const safeColor = color.replace(/[^a-zA-Z0-9]/g, "");
        const markerId = "wx-arrow-" + safeColor;

        if (this._arrowMarkers[markerId]) {
            return "url(#" + markerId + ")";
        }

        const defs = this._ensureDefs();
        if (!defs) {
            // svg not yet available, return a reference that will resolve later
            return "url(#" + markerId + ")";
        }

        // check if the marker already exists in the DOM (e.g. from a previous instance)
        if (!defs.querySelector("#" + markerId)) {
            const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
            marker.setAttribute("id", markerId);
            marker.setAttribute("viewBox", "0 0 10 10");
            marker.setAttribute("refX", "10");
            marker.setAttribute("refY", "5");
            marker.setAttribute("markerWidth", "10");
            marker.setAttribute("markerHeight", "10");
            marker.setAttribute("markerUnits", "userSpaceOnUse");
            marker.setAttribute("orient", "auto-start-reverse");

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
            path.setAttribute("fill", color);

            marker.appendChild(path);
            defs.appendChild(marker);
        }

        this._arrowMarkers[markerId] = true;
        return "url(#" + markerId + ")";
    }

    /**
     * Returns a default arrow marker url for edges without an explicit color.
     * @returns {string} url reference for the default black arrow
     */
    _getDefaultArrowMarkerUrl() {
        return this._getArrowMarkerUrl("#000000");
    }

    /**
     * Converts a pointer event to local SVG coordinates with fallback.
     * @param {PointerEvent|MouseEvent} e - the pointer event
     * @returns {{x: number, y: number}} local coordinates
     */
    _toLocalSafe(e) {
        if (typeof this._toLocal === "function") {
            return this._toLocal(e);
        }
        // fallback: manual calculation from pan and scale
        const rect = this._svg.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - (this._pan ? this._pan.x : 0)) / (this._scale || 1),
            y: (e.clientY - rect.top - (this._pan ? this._pan.y : 0)) / (this._scale || 1)
        };
    }

    /**
     * Saves the current model state to the undo history stack.
     * @param {boolean} [initial=false] - whether this is the initial snapshot
     */
    _saveStateToHistory(initial = false) {
        if (this._undoStack.length > 50) {
            this._undoStack.shift();
        }

        if (this._nodes) {
            this._nodes.forEach(n => {
                const modelNode = this._model.nodes.find(mn => mn.id === n.id);
                if (modelNode) {
                    modelNode.x = n.x;
                    modelNode.y = n.y;
                }
            });
        }

        const snapshot = JSON.parse(JSON.stringify(this._model));
        this._undoStack.push(snapshot);
        if (!initial) {
            this._redoStack = [];
        }
        this._updateToolbarState();
    }

    /**
     * Restores the previous model state from the undo stack.
     */
    _undo() {
        if (this._undoStack.length <= 1) {
            return;
        }

        const current = this._undoStack.pop();
        this._redoStack.push(current);

        const prev = this._undoStack[this._undoStack.length - 1];
        this._model = JSON.parse(JSON.stringify(prev));
        this._buildPhysics();
        this.render();
        this._updateToolbarState();
        this._emitChangeSafe();
    }

    /**
     * Re-applies a previously undone model state from the redo stack.
     */
    _redo() {
        if (this._redoStack.length === 0) {
            return;
        }

        const next = this._redoStack.pop();
        this._undoStack.push(next);

        this._model = JSON.parse(JSON.stringify(next));
        this._buildPhysics();
        this.render();
        this._updateToolbarState();
        this._emitChangeSafe();
    }

    /**
     * Builds the simple toolbar with all editor action buttons.
     */
    _buildSimpleToolbar() {
        /**
         * Creates a toolbar button element.
         * @param {string} id - button id
         * @param {string} iconClass - CSS icon class
         * @param {string} title - tooltip text
         * @param {Function} action - click handler
         * @param {boolean} [isToggle=false] - whether the button toggles
         * @returns {HTMLButtonElement} the created button
         */
        const createBtn = (id, iconClass, title, action, isToggle = false) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "wx-simple-btn";
            btn.title = title;
            btn.id = id;
            btn.innerHTML = `<i class="${iconClass}"></i>`;
            btn.onclick = (e) => {
                e.stopPropagation();
                if (isToggle) {
                    btn.classList.toggle("active");
                }
                action(btn);
            };
            this._toolbarContainer.appendChild(btn);
            return btn;
        };

        /**
         * Creates a visual separator in the toolbar.
         */
        const createSep = () => {
            const sep = document.createElement("div");
            sep.className = "wx-simple-sep";
            this._toolbarContainer.appendChild(sep);
        };

        this._btnUndo = createBtn("btn-undo", "fas fa-undo", "Undo", () => {
            this._undo();
        });
        this._btnRedo = createBtn("btn-redo", "fas fa-redo", "Redo", () => {
            this._redo();
        });

        createSep();

        createBtn("btn-add-node", "fas fa-plus-circle", "Add Node", () => {
            this._addNode();
            if (this._isAddEdgeMode) {
                this._resetAddEdgeMode();
            }
        });

        this._btnEdgeMode = createBtn("btn-add-edge", "fas fa-share-alt", "Add Edge (Toggle)", () => {
            const isActive = !this._isAddEdgeMode;
            this._toggleAddEdgeMode(isActive);
        }, true);

        createSep();

        this._btnEdit = createBtn("btn-edit", "fas fa-pen", "Edit Properties", () => {
            this._openPropertiesModal();
        });
        this._btnEdit.disabled = true;

        this._btnDelete = createBtn("btn-delete", "fas fa-trash", "Delete Selected", () => {
            this._requestDelete();
        });
        this._btnDelete.disabled = true;

        createSep();

        createBtn("btn-fit", "fas fa-expand", "Fit View", () => {
            this._fitToView();
        });
        createBtn("btn-export", "fas fa-file-export", "Export SVG", () => {
            this.exportSvg();
        });
    }

    /**
     * Updates the enabled/disabled state and visual appearance of all toolbar buttons.
     */
    _updateToolbarState() {
        const hasSelection = !!this._selectedNodeId || !!this._selectedEdgeId;

        if (this._btnEdit) {
            this._btnEdit.disabled = !hasSelection;
            this._btnEdit.style.opacity = hasSelection ? "1" : "0.5";
            this._btnEdit.style.cursor = hasSelection ? "pointer" : "default";
        }

        if (this._btnDelete) {
            this._btnDelete.disabled = !hasSelection;
            this._btnDelete.style.opacity = hasSelection ? "1" : "0.5";
            this._btnDelete.style.cursor = hasSelection ? "pointer" : "default";
        }

        if (this._btnEdgeMode) {
            if (this._isAddEdgeMode) {
                this._btnEdgeMode.classList.add("active");
            } else {
                this._btnEdgeMode.classList.remove("active");
            }
        }

        if (this._btnUndo) {
            const canUndo = this._undoStack.length > 1;
            this._btnUndo.disabled = !canUndo;
            this._btnUndo.style.opacity = canUndo ? "1" : "0.5";
        }
        if (this._btnRedo) {
            const canRedo = this._redoStack.length > 0;
            this._btnRedo.disabled = !canRedo;
            this._btnRedo.style.opacity = canRedo ? "1" : "0.5";
        }
    }

    /**
     * Initiates deletion with a confirmation dialog for nodes.
     */
    _requestDelete() {
        if (this._selectedNodeId) {
            this._openConfirmationModal(
                "Delete Node",
                "Are you sure you want to delete this node and all connected edges?",
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
        const backdrop = document.createElement("div");
        backdrop.className = "wx-graph-modal-backdrop";

        const dialog = document.createElement("div");
        dialog.className = "wx-graph-modal-dialog";

        const header = document.createElement("div");
        header.className = "wx-graph-modal-header";
        const titleSpan = document.createElement("span");
        titleSpan.textContent = title;
        const closeIcon = document.createElement("span");
        closeIcon.innerHTML = "&times;";
        closeIcon.style.cursor = "pointer";
        closeIcon.onclick = () => {
            this._element.removeChild(backdrop);
        };
        header.appendChild(titleSpan);
        header.appendChild(closeIcon);

        const body = document.createElement("div");
        body.className = "wx-graph-modal-body";
        body.innerHTML = `<p>${message}</p>`;

        const footer = document.createElement("div");
        footer.className = "wx-graph-modal-footer";

        const btnCancel = document.createElement("button");
        btnCancel.className = "wx-simple-btn";
        btnCancel.textContent = "Cancel";
        btnCancel.style.border = "1px solid #ccc";
        btnCancel.onclick = () => {
            this._element.removeChild(backdrop);
        };

        const btnConfirm = document.createElement("button");
        btnConfirm.className = "wx-simple-btn";
        btnConfirm.textContent = "Delete";
        btnConfirm.style.background = "#dc3545";
        btnConfirm.style.color = "#fff";
        btnConfirm.style.border = "1px solid #dc3545";
        btnConfirm.onclick = () => {
            onConfirm();
            this._element.removeChild(backdrop);
        };

        footer.appendChild(btnCancel);
        footer.appendChild(btnConfirm);
        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(footer);
        backdrop.appendChild(dialog);

        // attach to host element so position: absolute works correctly
        this._element.appendChild(backdrop);
    }

    /**
     * Deletes the currently selected node or edge from the model.
     */
    _deleteSelected() {
        this._saveStateToHistory();

        let changed = false;
        if (this._selectedEdgeId) {
            const before = this._model.edges.length;
            this._model.edges = this._model.edges.filter(t => (t.id || "") !== this._selectedEdgeId);
            if (this._model.edges.length !== before) {
                changed = true;
            }
        }
        if (this._selectedNodeId) {
            const beforeNodes = this._model.nodes.length;
            this._model.nodes = this._model.nodes.filter(n => n.id !== this._selectedNodeId);
            const beforeEdges = this._model.edges.length;
            this._model.edges = this._model.edges.filter(e => e.from !== this._selectedNodeId && e.to !== this._selectedNodeId);
            if (this._model.nodes.length !== beforeNodes || this._model.edges.length !== beforeEdges) {
                changed = true;
            }
            if (this._edgeSourceNode === this._selectedNodeId) {
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

        const backdrop = document.createElement("div");
        backdrop.className = "wx-graph-modal-backdrop";

        const dialog = document.createElement("div");
        dialog.className = "wx-graph-modal-dialog";

        const header = document.createElement("div");
        header.className = "wx-graph-modal-header";

        const titleSpan = document.createElement("span");

        const closeIcon = document.createElement("span");
        closeIcon.innerHTML = "&times;";
        closeIcon.style.cursor = "pointer";
        closeIcon.style.fontSize = "20px";
        closeIcon.onclick = () => {
            this._element.removeChild(backdrop);
        };

        const body = document.createElement("div");
        body.className = "wx-graph-modal-body";

        const footer = document.createElement("div");
        footer.className = "wx-graph-modal-footer";

        const btnCancel = document.createElement("button");
        btnCancel.className = "wx-simple-btn";
        btnCancel.textContent = "Cancel";
        btnCancel.style.border = "1px solid #ccc";
        btnCancel.onclick = () => {
            this._element.removeChild(backdrop);
        };

        const btnSave = document.createElement("button");
        btnSave.className = "wx-simple-btn";
        btnSave.textContent = "Apply";
        btnSave.style.background = "#0d6efd";
        btnSave.style.color = "#fff";
        btnSave.style.border = "1px solid #0d6efd";

        let targetObj = null;

        if (this._selectedNodeId) {
            targetObj = this._model.nodes.find(n => n.id === this._selectedNodeId);
            titleSpan.textContent = "Edit Node";
            if (targetObj) {
                this._addModalInput(body, "Label", "text", targetObj.label || "", "inp-label");
                this._addModalInput(body, "Background", "color", targetObj.backgroundColor || "#ffffff", "inp-bgcolor");
                this._addModalInput(body, "Text Color", "color", targetObj.foregroundColor || "#000000", "inp-fgcolor");
                this._addModalSelect(body, "Shape", ["rect", "circle"], targetObj.shape, "inp-shape");
                this._addModalSelect(body, "Layout", ["label-inside", "label-below"], targetObj.layout, "inp-layout");
                this._addModalInput(body, "URI (Link)", "text", targetObj.uri || "", "inp-uri");
            }
            btnSave.onclick = () => {
                if (!targetObj) {
                    return;
                }
                this._saveStateToHistory();

                // sync visual position to model before applying changes
                const visualNode = this._nodes.find(n => n.id === this._selectedNodeId);
                if (visualNode) {
                    targetObj.x = visualNode.x;
                    targetObj.y = visualNode.y;
                }

                targetObj.label = body.querySelector("#inp-label").value;
                targetObj.backgroundColor = body.querySelector("#inp-bgcolor").value;
                targetObj.foregroundColor = body.querySelector("#inp-fgcolor").value;
                targetObj.shape = body.querySelector("#inp-shape").value;
                targetObj.layout = body.querySelector("#inp-layout").value;
                targetObj.uri = body.querySelector("#inp-uri").value;

                this._buildPhysics();
                this.render();
                this._emitChangeSafe();
                this._element.removeChild(backdrop);
            };
        } else if (this._selectedEdgeId) {
            targetObj = this._model.edges.find(e => (e.id || "") === this._selectedEdgeId);
            titleSpan.textContent = "Edit Edge";
            if (targetObj) {
                this._addModalInput(body, "Label", "text", targetObj.label || "", "inp-label");
                this._addModalInput(body, "Color", "color", targetObj.color || "#000000", "inp-color");
                this._addModalInput(body, "Dash Array", "text", targetObj.dasharray || "", "inp-dash");
            }
            btnSave.onclick = () => {
                if (!targetObj) {
                    return;
                }
                this._saveStateToHistory();
                targetObj.label = body.querySelector("#inp-label").value;
                targetObj.color = body.querySelector("#inp-color").value;
                targetObj.dasharray = body.querySelector("#inp-dash").value;
                this.render();
                this._emitChangeSafe();
                this._element.removeChild(backdrop);
            };
        }

        header.appendChild(titleSpan);
        header.appendChild(closeIcon);
        dialog.appendChild(header);
        dialog.appendChild(body);
        footer.appendChild(btnCancel);
        footer.appendChild(btnSave);
        dialog.appendChild(footer);
        backdrop.appendChild(dialog);

        // attach to host element so position: absolute works correctly
        this._element.appendChild(backdrop);
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

    /**
     * Toggles the add-edge mode on or off.
     * @param {boolean} active - whether to activate or deactivate
     */
    _toggleAddEdgeMode(active) {
        this._isAddEdgeMode = active;
        this._edgeSourceNode = null;
        this._deselectAll();

        if (this._isAddEdgeMode) {
            this._svg.style.cursor = "crosshair";
        } else {
            this._svg.style.cursor = "default";
        }

        // clear preview line
        this._previewLayer.innerHTML = "";

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
        const rect = this._svg.getBoundingClientRect();
        const centerX = (rect.width / 2 - (this._pan ? this._pan.x : 0)) / (this._scale || 1);
        const centerY = (rect.height / 2 - (this._pan ? this._pan.y : 0)) / (this._scale || 1);
        const newNode = {
            id: "n-" + Date.now(),
            label: "New Node",
            x: centerX,
            y: centerY,
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
     * Applies the current pan/zoom transform and scales control elements accordingly.
     */
    _applyViewTransform() {
        super._applyViewTransform();
        this._updateControlElementsScale();
    }

    /**
     * Adjusts the visual size of handles and waypoints to compensate for zoom level.
     */
    _updateControlElementsScale() {
        const s = this._scale || 1;
        const inv = 1 / s;
        const rHandle = 6 * inv;
        const rWaypoint = 5 * inv;
        const strokeW = 2 * inv;

        Array.from(this._handleLayer.children).forEach(el => {
            el.setAttribute("r", rHandle);
            el.style.strokeWidth = strokeW + "px";
        });
        Array.from(this._waypointLayer.children).forEach(el => {
            el.setAttribute("r", rWaypoint);
            el.style.strokeWidth = strokeW + "px";
        });
    }

    /**
     * Fits all nodes into the current viewport. Falls back to reset if the
     * parent class does not provide _fitToView.
     */
    _fitToView() {
        if (typeof super._fitToView === "function") {
            super._fitToView();
            return;
        }

        // fallback implementation
        if (!this._nodes || this._nodes.length === 0) {
            return;
        }

        const rect = this._svg.getBoundingClientRect();
        const padding = 40;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        this._nodes.forEach(n => {
            const hw = (n.width || 80) / 2;
            const hh = (n.height || 40) / 2;
            if (n.x - hw < minX) { minX = n.x - hw; }
            if (n.y - hh < minY) { minY = n.y - hh; }
            if (n.x + hw > maxX) { maxX = n.x + hw; }
            if (n.y + hh > maxY) { maxY = n.y + hh; }
        });

        const contentW = maxX - minX;
        const contentH = maxY - minY;

        if (contentW <= 0 || contentH <= 0) {
            return;
        }

        const scaleX = (rect.width - padding * 2) / contentW;
        const scaleY = (rect.height - padding * 2) / contentH;
        this._scale = Math.min(scaleX, scaleY, 2);

        this._pan = {
            x: (rect.width - contentW * this._scale) / 2 - minX * this._scale,
            y: (rect.height - contentH * this._scale) / 2 - minY * this._scale
        };

        this._applyViewTransform();
    }

    /**
     * Exports the current graph as an SVG file download.
     */
    exportSvg() {
        const svgClone = this._svg.cloneNode(true);
        svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const toRemove = svgClone.querySelectorAll(
            "[data-layer='markers'], [data-layer='handles'], [data-layer='waypoints'], [data-layer='preview']"
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
        this._selectedEdgeId = null;
        this._selectedNodeId = null;
        this._hoveredNodeId = null;
        this._endpointDrag = null;

        // clear stale preview lines
        if (this._previewLayer) {
            this._previewLayer.innerHTML = "";
        }

        this.render();
        this._updateToolbarState();
    }

    /**
     * Removes all event listeners and cleans up DOM elements created by the editor.
     */
    destroy() {
        this._svg.removeEventListener("pointermove", this._onPointerMoveBound);
        window.removeEventListener("pointerup", this._onPointerUpBound);
        window.removeEventListener("keydown", this._onKeyDownBound);

        // remove toolbar
        if (this._toolbarContainer && this._toolbarContainer.parentNode) {
            this._toolbarContainer.parentNode.removeChild(this._toolbarContainer);
        }

        // call parent destroy if available
        if (typeof super.destroy === "function") {
            super.destroy();
        }
    }

    /**
     * Handles pointer move for endpoint dragging, edge creation preview,
     * and target node highlighting.
     * @param {PointerEvent} e - the pointer event
     */
    _onPointerMove(e) {
        const local = this._toLocalSafe(e);

        if (this._endpointDrag) {
            this._endpointDrag.current = { x: local.x, y: local.y };

            // determine hovered target node and store as state
            const node = this._nearestNodeAt(local.x, local.y, 18);
            this._hoveredNodeId = node ? node.id : null;

            this.render();
            return;
        }

        if (this._isAddEdgeMode && this._edgeSourceNode) {
            // determine hovered target node and store as state
            const node = this._nearestNodeAt(local.x, local.y, 18);
            if (node && node.id !== this._edgeSourceNode) {
                this._hoveredNodeId = node.id;
            } else {
                this._hoveredNodeId = null;
            }

            // draw phantom arrow
            const srcNode = this._nodes.find(n => n.id === this._edgeSourceNode);
            if (srcNode) {
                // determine target point (center of hovered node or mouse position)
                let targetPoint = { x: local.x, y: local.y };
                if (node && node.id !== this._edgeSourceNode) {
                    targetPoint = { x: node.x, y: node.y };
                }

                // calculate edge points with border adjustment
                let pts = [{ x: srcNode.x, y: srcNode.y }, targetPoint];
                if (typeof this._nodeEdgePoint === "function") {
                    pts[0] = this._nodeEdgePoint(srcNode, targetPoint);
                    if (node && node.id !== this._edgeSourceNode) {
                        pts[1] = this._nodeEdgePoint(node, srcNode);
                    }
                }

                const d = "M " + pts[0].x + "," + pts[0].y + " L " + pts[1].x + "," + pts[1].y;

                // update or create preview path
                let path = this._previewLayer.querySelector(".wx-graph-preview-edge");
                if (!path) {
                    path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("class", "wx-graph-preview-edge");
                    path.setAttribute("marker-end", this._getArrowMarkerUrl("#ffc107"));
                    path.setAttribute("fill", "none");
                    this._previewLayer.appendChild(path);
                }
                path.setAttribute("d", d);
            }

            // re-render nodes so hover class is applied from state
            this._nodeLayer.innerHTML = "";
            this._renderNodes();
            this._applyViewTransform();
        }
    }

    /**
     * Handles global pointer up to finalize endpoint drag operations.
     * @param {PointerEvent} e - the pointer event
     */
    _onPointerUpGlobal(e) {
        if (!this._endpointDrag) {
            return;
        }
        const drag = this._endpointDrag;
        const t = this._model.edges.find(tr => (tr.id || "") === drag.edgeId);

        try {
            this._svg.releasePointerCapture(e.pointerId);
        } catch (err) {
            // pointer capture may already be released
        }

        if (!t) {
            this._endpointDrag = null;
            this._hoveredNodeId = null;
            this.render();
            return;
        }

        const local = this._toLocalSafe(e);
        const node = this._nearestNodeAt(local.x, local.y, 18);
        let changed = false;

        if (node) {
            if (drag.which === "from") {
                if (t.from !== node.id) {
                    this._saveStateToHistory();
                    changed = true;
                }
                t.from = node.id;
            } else {
                if (t.to !== node.id) {
                    this._saveStateToHistory();
                    changed = true;
                }
                t.to = node.id;
            }
        }

        this._endpointDrag = null;
        this._hoveredNodeId = null;
        this.render();

        if (changed) {
            this._emitChangeSafe();
        }
    }

    /**
     * Handles keyboard shortcuts for delete, escape, undo, and redo.
     * @param {KeyboardEvent} e - the keyboard event
     */
    _onKeyDown(e) {
        if (e.key === "Delete") {
            this._requestDelete();
        }
        if (e.key === "Escape") {
            if (this._isAddEdgeMode) {
                this._resetAddEdgeMode();
            }
            this._deselectAll();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
            e.preventDefault();
            this._undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            e.preventDefault();
            this._redo();
        }
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

    /**
     * Full render pass: clears and redraws edges, nodes, waypoints, and handles.
     */
    render() {
        if (!this._nodes || this._nodes.length === 0) {
            this._buildPhysics();
        }

        if (!this._waypointLayer) {
            this._waypointLayer = this._createGroup("waypoints");
            this._viewport.appendChild(this._waypointLayer);
        }
        if (!this._previewLayer) {
            this._previewLayer = this._createGroup("preview");
            this._viewport.appendChild(this._previewLayer);
        }
        if (!this._handleLayer) {
            this._handleLayer = this._createGroup("handles");
            this._viewport.appendChild(this._handleLayer);
        }

        this._ensureArrowMarker();
        this._edgeLayer.innerHTML = "";
        this._waypointLayer.innerHTML = "";
        this._nodeLayer.innerHTML = "";
        this._handleLayer.innerHTML = "";

        this._renderEdges();
        this._renderNodes();
        this._renderWaypoints();
        this._renderHandles();
        this._applyViewTransform();
    }

    /**
     * Renders all edges including selection state, drag preview, and event handlers.
     * Each edge receives a per-color arrow marker so the arrowhead matches the edge color.
     */
    _renderEdges() {
        this._model.edges.forEach((t, ti) => {
            if (!t || typeof t !== "object") {
                return;
            }
            const edgeId = this._edgeId(t, ti);
            const isSelected = (edgeId === this._selectedEdgeId);

            // determine the effective edge color
            const edgeColor = t.color || "#000000";
            // get a color-matched arrow marker
            const markerUrl = this._getArrowMarkerUrl(edgeColor);

            let pts;

            if (this._endpointDrag && this._endpointDrag.edgeId === (t.id || "")) {
                const src = this._nodes.find(s => s.id === t.from);
                const dst = this._nodes.find(s => s.id === t.to);
                const draggingFrom = this._endpointDrag.which === "from";
                const startPoint = draggingFrom
                    ? this._endpointDrag.current
                    : (src ? { x: src.x, y: src.y } : { x: 0, y: 0 });
                const endPoint = draggingFrom
                    ? (dst ? { x: dst.x, y: dst.y } : { x: 0, y: 0 })
                    : this._endpointDrag.current;
                pts = [];
                pts.push(startPoint);
                if (Array.isArray(t.waypoints)) {
                    pts.push.apply(pts, t.waypoints);
                }
                pts.push(endPoint);
                if (draggingFrom && dst && typeof this._nodeEdgePoint === "function") {
                    pts[pts.length - 1] = this._nodeEdgePoint(dst, pts[pts.length - 2]);
                } else if (!draggingFrom && src && typeof this._nodeEdgePoint === "function") {
                    pts[0] = this._nodeEdgePoint(src, pts[1]);
                }
            } else {
                pts = this._edgePoints(t);
            }

            if (pts.length === 0) {
                return;
            }

            const poly = document.createElementNS("http://www.w3.org/2000/svg", "path");
            let d = "";
            if (typeof this._generateSmoothPath === "function") {
                d = this._generateSmoothPath(pts);
            } else {
                d = "M " + pts[0].x + "," + pts[0].y;
                for (let i = 1; i < pts.length; i++) {
                    d += " L " + pts[i].x + "," + pts[i].y;
                }
            }
            poly.setAttribute("d", d);
            poly.setAttribute("class", "wx-workflow-edge");
            if (isSelected) {
                poly.setAttribute("data-selected", "true");
            }
            poly.setAttribute("data-id", edgeId);
            poly.setAttribute("fill", "none");
            poly.setAttribute("stroke", edgeColor);
            poly.setAttribute("stroke-linecap", "round");
            poly.setAttribute("stroke-linejoin", "round");
            poly.setAttribute("marker-end", markerUrl);
            if (t.dasharray) {
                poly.setAttribute("stroke-dasharray", t.dasharray);
            }

            poly.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this._selectedEdgeId === edgeId) {
                    this._selectedEdgeId = null;
                } else {
                    this._selectedEdgeId = edgeId;
                    this._selectedNodeId = null;
                }
                this._endpointDrag = null;
                this._hoveredNodeId = null;
                this.render();
                this._updateToolbarState();
            });

            poly.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                e.preventDefault();
                this._saveStateToHistory();
                this._selectedEdgeId = edgeId;
                this._selectedNodeId = null;
                this._insertWaypointAtMid(t, e);
            });

            this._edgeLayer.appendChild(poly);
        });
    }

    /**
     * Renders all nodes with editor-specific interaction handlers.
     * Applies selection, source, and hover classes from editor state
     * so that visual feedback survives full re-renders.
     */
    _renderNodes() {
        super._renderNodes();
        Array.from(this._nodeLayer.children).forEach(g => {
            if (g.dataset.editorAttached === "true") {
                return;
            }
            g.dataset.editorAttached = "true";
            const id = g.getAttribute("data-id");
            const n = this._nodes.find(nn => nn.id === id);
            if (!n) {
                return;
            }

            // apply visual state classes from editor state (survives re-render)
            if (id === this._selectedNodeId) {
                g.classList.add("wx-graph-node-selected");
            }
            if (this._isAddEdgeMode && this._edgeSourceNode === id) {
                g.classList.add("wx-graph-node-source");
            }
            if (this._hoveredNodeId === id) {
                g.classList.add("wx-graph-node-hover");
            }

            const newG = g.cloneNode(true);
            g.parentNode.replaceChild(newG, g);

            newG.addEventListener("pointerdown", (e) => {
                if (this._isAddEdgeMode) {
                    return;
                }
                e.stopPropagation();
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
                newG.style.cursor = "grabbing";
                try {
                    newG.setPointerCapture(e.pointerId);
                } catch (err) {
                    // pointer capture may not be supported
                }
                this.render();
                this._updateToolbarState();
                this._attachDragListeners(newG);
            });

            newG.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this._isAddEdgeMode) {
                    if (this._edgeSourceNode === null) {
                        this._edgeSourceNode = n.id;
                        this.render();
                    } else {
                        if (this._edgeSourceNode !== n.id) {
                            this._createEdgeAndEmit(this._edgeSourceNode, n.id);
                            this._edgeSourceNode = null;
                            // clear preview line
                            this._previewLayer.innerHTML = "";
                            this.render();
                        } else {
                            // clicked same node -> deselect source
                            this._edgeSourceNode = null;
                            this._previewLayer.innerHTML = "";
                            this.render();
                        }
                    }
                    return;
                }
                this._selectedNodeId = n.id;
                this._selectedEdgeId = null;
                this.render();
                this._updateToolbarState();
            });

            // dblclick: stop propagation so the svg-level handler does not fire again
            newG.addEventListener("dblclick", (e) => {
                e.stopPropagation();
            });
        });
    }

    /**
     * Renders waypoint circles for the currently selected edge.
     */
    _renderWaypoints() {
        const selectedId = this._selectedEdgeId;
        if (!selectedId) {
            return;
        }
        this._model.edges.forEach((t, ti) => {
            const tid = this._edgeId(t, ti);
            if (tid !== selectedId) {
                return;
            }
            t.waypoints = Array.isArray(t.waypoints) ? t.waypoints : [];
            t.waypoints.forEach((wp, wi) => {
                const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                c.setAttribute("class", "wx-workflow-waypoint");
                c.setAttribute("cx", wp.x);
                c.setAttribute("cy", wp.y);
                c.setAttribute("data-edge", tid);
                c.setAttribute("data-index", wi);

                c.addEventListener("pointerdown", (e) => {
                    e.stopPropagation();
                    const p = this._toLocalSafe(e);
                    this._dragSnapshot = JSON.stringify(this._model);
                    this._drag = {
                        type: "waypoint",
                        edgeId: tid,
                        index: wi,
                        startX: p.x,
                        startY: p.y,
                        wpStartX: wp.x,
                        wpStartY: wp.y,
                        pointerId: e.pointerId,
                        hasMoved: false
                    };
                    c.style.cursor = "grabbing";
                    try {
                        c.setPointerCapture(e.pointerId);
                    } catch (err) {
                        // pointer capture may not be supported
                    }
                    this._attachDragListeners(c);
                });

                c.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._saveStateToHistory();
                    t.waypoints.splice(wi, 1);
                    this.render();
                    this._emitChangeSafe();
                });

                this._waypointLayer.appendChild(c);
            });
        });
    }

    /**
     * Renders draggable endpoint handles for the currently selected edge.
     */
    _renderHandles() {
        if (!this._selectedEdgeId) {
            return;
        }
        const t = this._model.edges.find(tr => (tr.id || "") === this._selectedEdgeId);
        if (!t) {
            return;
        }

        let srcPos = null;
        let dstPos = null;

        if (this._endpointDrag && this._endpointDrag.edgeId === (t.id || "")) {
            const src = this._nodes.find(s => s.id === t.from);
            const dst = this._nodes.find(s => s.id === t.to);
            if (this._endpointDrag.which === "from") {
                srcPos = this._endpointDrag.current;
                if (dst && typeof this._nodeEdgePoint === "function") {
                    const ref = (t.waypoints && t.waypoints.length)
                        ? t.waypoints[t.waypoints.length - 1]
                        : srcPos;
                    dstPos = this._nodeEdgePoint(dst, ref);
                } else {
                    dstPos = dst ? { x: dst.x, y: dst.y } : { x: 0, y: 0 };
                }
            } else {
                dstPos = this._endpointDrag.current;
                if (src && typeof this._nodeEdgePoint === "function") {
                    const ref = (t.waypoints && t.waypoints.length)
                        ? t.waypoints[0]
                        : dstPos;
                    srcPos = this._nodeEdgePoint(src, ref);
                } else {
                    srcPos = src ? { x: src.x, y: src.y } : { x: 0, y: 0 };
                }
            }
        } else {
            const pts = this._edgePoints(t);
            if (pts.length > 0) {
                srcPos = pts[0];
                dstPos = pts[pts.length - 1];
            }
        }

        /**
         * Creates a single draggable handle circle.
         * @param {{x: number, y: number}} pt - position
         * @param {string} which - "from" or "to"
         */
        const createHandle = (pt, which) => {
            if (!pt) {
                return;
            }
            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("class", "wx-workflow-handle handle-" + which);
            c.setAttribute("cx", pt.x);
            c.setAttribute("cy", pt.y);
            c.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
                const p = this._toLocalSafe(e);
                this._endpointDrag = {
                    which: which,
                    edgeId: t.id || "",
                    current: { x: p.x, y: p.y }
                };
                this.render();
                try {
                    this._svg.setPointerCapture(e.pointerId);
                } catch (err) {
                    // pointer capture may not be supported
                }
            });
            this._handleLayer.appendChild(c);
        };

        createHandle(srcPos, "from");
        createHandle(dstPos, "to");
    }

    /**
     * Attaches temporary pointermove and pointerup listeners for drag operations.
     * @param {SVGElement} target - the element being dragged
     */
    _attachDragListeners(target) {
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
                const modelNode = this._model.nodes.find(n => n.id === this._drag.id);
                if (node) {
                    node.x = this._drag.nodeStartX + dx;
                    node.y = this._drag.nodeStartY + dy;
                    if (modelNode) {
                        modelNode.x = node.x;
                        modelNode.y = node.y;
                    }
                    this._updateGeometry();
                }
            } else if (this._drag.type === "waypoint") {
                const tr = this._model.edges.find(t => (t.id || "") === this._drag.edgeId);
                if (tr && tr.waypoints && tr.waypoints[this._drag.index]) {
                    tr.waypoints[this._drag.index].x = this._drag.wpStartX + dx;
                    tr.waypoints[this._drag.index].y = this._drag.wpStartY + dy;
                    this._updateGeometry();
                }
            }
        };

        const up = () => {
            if (this._drag && typeof target.releasePointerCapture === "function") {
                try {
                    target.releasePointerCapture(this._drag.pointerId);
                } catch (err) {
                    // pointer capture may already be released
                }
            }
            if (target instanceof SVGGElement || target instanceof SVGCircleElement) {
                target.style.cursor = "grab";
            }

            // push pre-drag snapshot to undo stack if the element actually moved
            if (this._drag && this._drag.hasMoved && this._dragSnapshot) {
                if (this._undoStack.length > 50) {
                    this._undoStack.shift();
                }
                this._undoStack.push(JSON.parse(this._dragSnapshot));
                this._redoStack = [];
                this._updateToolbarState();
            }

            this._dragSnapshot = null;
            this._drag = null;
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            this._emitChangeSafe();
        };

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
    }

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
     * Updates edge paths, waypoint positions, and handle positions during drag.
     */
    _updateGeometry() {
        super._updateGeometry();
        if (this._selectedEdgeId) {
            this._handleLayer.innerHTML = "";
            this._renderHandles();
        }
        Array.from(this._waypointLayer.children).forEach(circle => {
            const trId = circle.getAttribute("data-edge");
            const idx = parseInt(circle.getAttribute("data-index"), 10);
            const t = this._model.edges.find(tr => (tr.id || "") === trId);
            if (!t || !t.waypoints || !t.waypoints[idx]) {
                return;
            }
            circle.setAttribute("cx", t.waypoints[idx].x);
            circle.setAttribute("cy", t.waypoints[idx].y);
            const poly = this._edgeLayer.querySelector('path[data-id="' + trId + '"]');
            if (poly) {
                const pts = this._edgePoints(t);
                let d = "";
                if (typeof this._generateSmoothPath === "function") {
                    d = this._generateSmoothPath(pts);
                } else if (pts.length > 0) {
                    d = "M " + pts[0].x + "," + pts[0].y;
                    for (let i = 1; i < pts.length; i++) {
                        d += " L " + pts[i].x + "," + pts[i].y;
                    }
                }
                poly.setAttribute("d", d);
            }
        });
        this._updateControlElementsScale();
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
        let candidate = base + "-" + Date.now() + "-" + n;
        const exists = (id) => {
            return this._model.edges.some(t => (t.id || "") === id);
        };
        while (exists(candidate)) {
            n += 1;
            candidate = base + "-" + Date.now() + "-" + n;
        }
        return candidate;
    }

    /**
     * Safely emits a change event, supporting both _emitChange and _dispatch patterns.
     */
    _emitChangeSafe() {
        if (typeof this._emitChange === "function") {
            this._emitChange();
        } else if (typeof this._dispatch === "function") {
            // sync visual positions to model before dispatching
            this._nodes.forEach(n => {
                const modelNode = this._model.nodes.find(node => node.id === n.id);
                if (modelNode) {
                    modelNode.x = n.x;
                    modelNode.y = n.y;
                }
            });
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