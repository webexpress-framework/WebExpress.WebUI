/**
 * A tree control extending the base Control class.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.MOVE_EVENT
 */
webexpress.webui.TreeCtrl = class extends webexpress.webui.Ctrl {
    // store the currently dragged node, the drag indicator element, and the current drag position
    _dragover = null;
    _dragIndicator = null;
    _dragoverPosition = null;

    /**
     * Constructor for initializing the tree control.
     * @param {HTMLElement} element - The DOM element for the tree control.
     */
    constructor(element) {
        super(element);

        // parse initial nodes and configuration from data attributes
        this._nodes = this._parseNodes(Array.from(element.children).filter((e) => { return e.classList.contains("wx-tree-node"); }));
        this._layout = element.dataset.layout || null;
        this._showIndicator = element.dataset.indicator === "false" ? false : true;
        this._showLeafIndicator = element.dataset.indicatorLeaf === "false" ? false : true; // leaf dot optional
        this._movable = element.dataset.movable === "true";
        this._container = document.createElement("ul");
        const layoutClasses = this._getLayoutClasses();
        if (layoutClasses) {
            this._container.className = layoutClasses;
        }

        // clean up the DOM element
        element.innerHTML = "";
        element.classList.add("wx-tree");
        element.appendChild(this._container);

        // create the drag indicator element (hidden initially)
        this._dragIndicator = document.createElement("div");
        this._dragIndicator.className = "wx-tree-drag-indicator";
        this._dragIndicator.style.display = "none";
        element.appendChild(this._dragIndicator);

        // render the tree structure
        this.render();
    }

    /**
     * Enables drag and drop functionality for the tree.
     * @private
     * @param {HTMLElement} element - The label container element.
     * @param {Object} node - The node object.
     */
    _enableDragAndDrop(element, node) {
        // make the element draggable
        element.setAttribute("draggable", "true");

        // handle drag start
        element.addEventListener("dragstart", (event) => {
            if (!event.ctrlKey) {
                event.preventDefault(); // only allow drag if ctrl is pressed
                return;
            }
            this._dragover = node;
            event.dataTransfer.setData("text/plain", JSON.stringify({
                node: node.id
            }));
            element.classList.add("wx-dragging");
        });

        // handle drag over
        element.addEventListener("dragover", (event) => {
            event.preventDefault(); // allow dropping by preventing default behavior

            if (this._isChildNode(this._dragover, node)) {
                // prevent showing the indicator if the target node is a child of the dragged node
                this._dragIndicator.style.display = "none";
                return;
            }

            // each node is divided into three areas: top 25% (above), middle 50% (child), bottom 25% (below)
            const rect = element.getBoundingClientRect();
            const height = rect.height;
            const mouseY = event.clientY;
            const relativeY = mouseY - rect.top;

            if (relativeY < height * 0.25) {
                // top 25% of the element
                this._dragIndicator.style.top = String(rect.top - 2 + window.scrollY) + "px";
                this._dragIndicator.style.left = String(rect.left + window.scrollX) + "px";
                this._dragIndicator.style.width = String(rect.width) + "px";
                this._dragIndicator.style.display = "block";
                element.classList.remove("wx-drag-over");
                this._dragoverPosition = "above";
            } else if (relativeY < height * 0.75) {
                // middle 50% of the element
                this._dragIndicator.style.display = "none";
                element.classList.add("wx-drag-over");
                this._dragoverPosition = "child";
            } else {
                // bottom 25% of the element
                this._dragIndicator.style.top = String(rect.top + height - 2 + window.scrollY) + "px";
                this._dragIndicator.style.left = String(rect.left + window.scrollX) + "px";
                this._dragIndicator.style.width = String(rect.width) + "px";
                this._dragIndicator.style.display = "block";
                element.classList.remove("wx-drag-over");
                this._dragoverPosition = "below";
            }
        });

        // handle drag leave
        element.addEventListener("dragleave", () => {
            element.classList.remove("wx-drag-over");
            this._dragIndicator.style.display = "none";
        });

        // handle drop
        element.addEventListener("drop", (event) => {
            event.preventDefault();
            const draggedData = JSON.parse(event.dataTransfer.getData("text/plain"));
            const draggedNode = this._findNodeById(draggedData.node);
            const targetNode = node;

            // prevent moving a parent node into one of its children
            if (this._isChildNode(draggedNode, targetNode)) {
                this._dragIndicator.style.display = "none";
                element.classList.remove("wx-drag-over");
                return;
            }

            if (draggedNode && targetNode && draggedNode !== targetNode) {
                if (this._dragoverPosition === "above") {
                    this._insertNodeAbove(draggedNode, targetNode);
                } else if (this._dragoverPosition === "child") {
                    this._insertNodeAsChild(draggedNode, targetNode);
                } else if (this._dragoverPosition === "below") {
                    this._insertNodeBelow(draggedNode, targetNode);
                }
            }

            this._dragIndicator.style.display = "none";
        });

        // handle drag end
        element.addEventListener("dragend", () => {
            this._dragover = null;
            this._dragIndicator.style.display = "none";
            element.classList.remove("wx-dragging", "wx-drag-over");
        });
    }

    /**
     * Checks if a target node is a child of the dragged node.
     * @private
     * @param {Object} draggedNode - The node being dragged.
     * @param {Object} targetNode - The target node to check.
     * @returns {boolean} True if the target node is a child of the dragged node, false otherwise.
     */
    _isChildNode(draggedNode, targetNode) {
        let currentNode = targetNode;
        // traverse up the tree to check if the targetNode is a child of draggedNode
        while (currentNode) {
            if (currentNode === draggedNode) {
                return true;
            }
            currentNode = currentNode.parent;
        }
        return false;
    }

    /**
     * Inserts a node above the target node.
     * @private
     * @param {Object} draggedNode - The node being dragged.
     * @param {Object} targetNode - The target node where the dragged node will be inserted above.
     */
    _insertNodeAbove(draggedNode, targetNode) {
        this._removeNodeFromCurrentPosition(draggedNode);
        const parent = targetNode.parent;
        if (parent) {
            const index = parent.children.indexOf(targetNode);
            parent.children.splice(index, 0, draggedNode);
            draggedNode.parent = parent;
        } else {
            const index = this._nodes.indexOf(targetNode);
            this._nodes.splice(index, 0, draggedNode);
            draggedNode.parent = null;
        }

        this._dispatch(webexpress.webui.Event.MOVE_EVENT, {
            node: draggedNode.id,
            target: targetNode.id,
            position: "above"
        });

        this.render();
    }

    /**
     * Inserts a node as a child of the target node.
     * @private
     * @param {Object} draggedNode - The node being dragged.
     * @param {Object} targetNode - The target node where the dragged node will be inserted as a child.
     */
    _insertNodeAsChild(draggedNode, targetNode) {
        this._removeNodeFromCurrentPosition(draggedNode);
        targetNode.children = targetNode.children || [];
        targetNode.children.push(draggedNode);
        draggedNode.parent = targetNode;

        this._dispatch(webexpress.webui.Event.MOVE_EVENT, {
            node: draggedNode.id,
            target: targetNode.id,
            position: "child"
        });

        this.render();
    }

    /**
     * Inserts a node below the target node.
     * @private
     * @param {Object} draggedNode - The node being dragged.
     * @param {Object} targetNode - The target node where the dragged node will be inserted below.
     */
    _insertNodeBelow(draggedNode, targetNode) {
        this._removeNodeFromCurrentPosition(draggedNode);
        const parent = targetNode.parent;
        if (parent) {
            const index = parent.children.indexOf(targetNode);
            parent.children.splice(index + 1, 0, draggedNode);
            draggedNode.parent = parent;
        } else {
            const index = this._nodes.indexOf(targetNode);
            this._nodes.splice(index + 1, 0, draggedNode);
            draggedNode.parent = null;
        }

        this._dispatch(webexpress.webui.Event.MOVE_EVENT, {
            node: draggedNode.id,
            target: targetNode.id,
            position: "below"
        });

        this.render();
    }

    /**
     * Removes a node from its current position in the tree.
     * @private
     * @param {Object} node - The node to be removed.
     */
    _removeNodeFromCurrentPosition(node) {
        if (node.parent) {
            node.parent.children = node.parent.children.filter((child) => { return child !== node; });
        } else {
            this._nodes = this._nodes.filter((n) => { return n !== node; });
        }
    }

    /**
     * Parses child elements as tree nodes.
     * @private
     * @param {Array} elements - The child elements to parse.
     * @param {Object} [parent] - The parent node, optional for the root level.
     * @returns {Array} An array of parsed tree nodes.
     */
    _parseNodes(elements, parent = null) {
        const nodes = [];
        elements.forEach((elem) => {
            const node = {
                id: elem.id || null,
                label: elem.dataset.label || "Unnamed",
                iconOpen: elem.dataset.iconOpened || elem.dataset.icon || null,
                iconClose: elem.dataset.iconClosed || elem.dataset.icon || null,
                imageOpen: elem.dataset.imageOpened || elem.dataset.image || null,
                imageClose: elem.dataset.imageClosed || elem.dataset.image || null,
                active: elem.dataset.active === "true",
                color: elem.dataset.color || "",
                expand: elem.dataset.expand === "true",
                url: elem.dataset.uri || null,
                target: elem.dataset.target || null,
                tooltip: elem.dataset.tooltip || null,
                render: elem.dataset.render || null,
                parent: parent
            };
            // recursively parse children
            node.children = this._parseNodes(Array.from(elem.children).filter((e) => { return e.classList.contains("wx-tree-node"); }), node);
            nodes.push(node);
        });
        return nodes;
    }

    /**
     * Renders the tree structure with ARIA attributes.
     * @private
     * @param {HTMLElement} container - The container for appending tree nodes.
     * @param {Array} nodes - The tree node data to render.
     */
    _renderTree(container, nodes) {
        // clear existing content
        container.innerHTML = "";
        container.setAttribute("role", "tree");

        nodes.forEach((node) => {
            const img = document.createElement("img");
            const icon = document.createElement("i");
            const li = document.createElement("li");
            li.id = node.id || "";
            li.setAttribute("role", "treeitem");
            li.setAttribute("aria-expanded", node.expand ? "true" : "false");
            li.setAttribute("aria-level", this._getNodeLevel(node));
            img.className = "wx-icon";

            // add layout-specific classes
            switch (this._layout) {
                case "wx-tree-group":
                case "wx-tree-flush":
                case "wx-tree-horizontal": {
                    li.classList.add("list-group-item");
                    break;
                }
                case "wx-tree-flat": {
                    break;
                }
                default: {
                    li.classList.add("wx-tree-node");
                    break;
                }
            }

            // add aria-selected if selectable
            if (node.selectable) {
                li.setAttribute("aria-selected", node.selected ? "true" : "false");
            }

            // create the label container (button or link)
            const labelContainer = node.url ? document.createElement("a") : document.createElement("button");
            labelContainer.className = String(node.color || "") + " wx-tree-label-container";
            if (node.active) {
                labelContainer.className = "wx-tree-label-container active";
            }

            // click handler for node selection
            labelContainer.addEventListener("click", () => {
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { node: node.id });
            });

            // add indicator and expansion/collapse logic if necessary
            let indicator;
            if (this._showIndicator && node.children && node.children.length > 0) {
                indicator = document.createElement("i");
                indicator.className = "wx-tree-indicator-angle";
                indicator.addEventListener("click", () => {
                    this._toggleNode(node, ul, icon, img, indicator);
                });
                labelContainer.addEventListener("dblclick", () => {
                    this._toggleNode(node, ul, icon, img, indicator);
                });
                if (node.expand) {
                    indicator.classList.add("wx-tree-expand");
                    if (node.iconOpen && icon) {
                        icon.className = "";
                        icon.className = node.iconOpen;
                    }
                    if (node.imageOpen && img) {
                        img.src = node.imageOpen;
                    }
                }
            } else if (this._showIndicator && this._showLeafIndicator) {
                // optional dot indicator for leaf nodes
                indicator = document.createElement("i");
                indicator.className = "wx-tree-indicator-dot";
            }

            // render image and icon if present
            if (node.imageOpen) {
                img.src = node.expand ? node.imageOpen : node.imageClose;
                labelContainer.appendChild(img);
            }

            if (node.iconOpen) {
                icon.className = node.expand ? node.iconOpen : node.iconClose;
                labelContainer.appendChild(icon);
            }

            // render label
            if (typeof node.render === "string") {
                // custom render logic
                const render = new Function("node", node.render);
                const renderResult = render(node);
                if (renderResult instanceof Node) {
                    labelContainer.appendChild(renderResult);
                } else if (typeof renderResult === "string") {
                    labelContainer.innerHTML += renderResult;
                }
            } else {
                const span = document.createElement("span");
                span.textContent = node.label;
                labelContainer.appendChild(span);
            }

            // set link attributes if present
            if (node.url) {
                labelContainer.setAttribute("href", node.url);
            }
            if (node.target) {
                labelContainer.setAttribute("target", node.target);
            }
            if (node.tooltip) {
                labelContainer.setAttribute("title", node.tooltip);
            }

            // compose the node: indicator, label, and children
            const div = document.createElement("div");
            if (indicator) {
                div.appendChild(indicator);
            }
            div.appendChild(labelContainer);
            li.appendChild(div);

            // render child nodes if present and expanded
            let ul = null;
            if (node.children && node.children.length > 0) {
                ul = document.createElement("ul");
                const layoutClasses = this._getLayoutClasses();
                if (layoutClasses) {
                    ul.className = layoutClasses;
                }
                ul.setAttribute("role", "group");
                if (node.expand) {
                    this._renderTree(ul, node.children);
                }
                li.appendChild(ul);
            }

            // add the node to the container
            container.appendChild(li);

            // enable drag & drop if movable
            if (this._movable) {
                this._enableDragAndDrop(labelContainer, node);
            }
        });
    }

    /**
     * Calculates the nesting level of a node.
     * @private
     * @param {Object} node - The tree node data.
     * @returns {number} The nesting level of the node.
     */
    _getNodeLevel(node) {
        let level = 1;
        while (node.parent) {
            level++;
            node = node.parent;
        }
        return level;
    }

    /**
     * Toggles the expand/collapse state of a tree node.
     * @private
     * @param {Object} node - The tree node data.
     * @param {HTMLElement} ul - The child container for the node's children.
     * @param {HTMLElement} icon - The icon element for the node.
     * @param {HTMLElement} img - The image element for the node.
     * @param {HTMLElement} indicator - The indicator element for the node.
     */
    _toggleNode(node, ul, icon, img, indicator) {
        this._dispatch(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, { node: node ? node.id : null });

        if (!node.expand) {
            if (indicator) {
                indicator.classList.add("wx-tree-expand-animation");
            }
            if (icon && node.iconOpen) {
                icon.className = node.iconOpen;
            }
            if (img && node.imageOpen) {
                img.src = node.imageOpen;
            }
            if (ul) {
                this._renderTree(ul, node.children);
            }
        } else {
            if (indicator) {
                indicator.classList.remove("wx-tree-expand", "wx-tree-expand-animation");
            }
            if (icon && node.iconClose) {
                icon.className = node.iconClose;
            }
            if (img && node.imageClose) {
                img.src = node.imageClose;
            }
            if (ul) {
                ul.innerHTML = "";
            }
        }
        node.expand = !node.expand;
    }

    /**
     * Recursively finds a node in the tree by its ID.
     * @private
     * @param {string} id - The ID of the node to find.
     * @param {Array} nodes - The array of nodes to search through.
     * @returns {Object|null} The node with the matching ID, or null if not found.
     */
    _findNodeById(id, nodes = this._nodes) {
        for (const node of nodes) {
            if (node.id === id) {
                return node;
            }
            if (node.children && node.children.length > 0) {
                const result = this._findNodeById(id, node.children);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }

    /**
     * Returns the appropriate CSS classes for the tree layout.
     * @private
     * @returns {string|null} The CSS classes for the current layout, or null if no specific layout is set.
     */
    _getLayoutClasses() {
        switch (this._layout) {
            case "wx-tree-group": {
                return "list-group";
            }
            case "wx-tree-flush": {
                return "list-group list-group-flush";
            }
            case "wx-tree-flat": {
                return "list-unstyled";
            }
            case "wx-tree-horizontal": {
                return "list-group list-group-horizontal";
            }
            default: {
                return null;
            }
        }
    }

    /**
     * Refreshes the tree control by rendering the latest node structure.
     */
    render() {
        this._renderTree(this._container, this._nodes);
    }

    /**
     * Gets the current tree nodes.
     * @returns {Array} The tree node data.
     */
    get nodes() {
        return this._nodes;
    }

    /**
     * Sets new tree nodes and re-renders the tree.
     * @param {Array} nodes - The new tree node data.
     */
    set nodes(nodes) {
        this._nodes = nodes;
        this.render();
    }

    /**
     * Clears all entries from the tree control.
     */
    clear() {
        this._nodes = [];
        this.render();
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-tree", webexpress.webui.TreeCtrl);