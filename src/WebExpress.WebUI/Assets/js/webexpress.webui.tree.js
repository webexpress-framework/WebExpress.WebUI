/**
 * A tree control extending the base Control class.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.MOVE_EVENT
 */
webexpress.webui.TreeCtrl = class extends webexpress.webui.Ctrl {
    _dragover = null; // store the currently dragged node
    _dragIndicator = null; // store the drag indicator element
    _dragoverPosition = null; // store the current drag position (above, child, below)

    /**
     * Constructor for initializing the tree control.
     * @param {HTMLElement} element - The DOM element for the tree control.
     */
    constructor(element) {
        super(element);

        // Initialize properties
        this._nodes = this._parseNodes($(element).children(".wx-tree-node"));
        this._layout = $(element).data("layout") || null;
        this._showIndicator = $(element).data("indicator") == false ? false : true;
        this._movable = $(element).data("movable") || false;
        this._container = $("<ul>").addClass(this._getLayoutClasses());

        // Clean up the DOM
        $(element).empty().addClass("wx-tree").append(this._container);

        // Create the drag indicator element
        this._dragIndicator = $("<div>")
            .addClass("wx-tree-drag-indicator")
            .hide(); // Initially hidden
        $(element).append(this._dragIndicator);

        // Render the tree
        this.render();
    }

    /**
     * Enables drag and drop functionality for the tree.
     * @private
     * @param {jQuery} element - The node element.
     * @param {Object} node - The node object.
     */
    _enableDragAndDrop(element, node) {
        // Attach dragstart, dragover, and drop handlers to tree nodes
        element.attr("draggable", true);

        // Handle drag start
        element.on("dragstart", (event) => {
            if (!event.ctrlKey) {
                event.preventDefault(); // Prevent drag if Ctrl is not pressed
                return;
            }

            this._dragover = node;
            event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(
                {
                    element: element,
                    node: node.id,
                }));

            element.addClass("wx-dragging");
        });

        // Handle drag over
        element.on("dragover", (event) => {
            event.preventDefault(); // Allow dropping by preventing default behavior

            if (this._isChildNode(this._dragover, node)) {
                // Prevent showing the indicator if the target node is a child of the dragged node
                this._dragIndicator.hide();
                return;
            }

            // Each node is divided into three areas: the top 25% for moving above the 
            // element, the middle 50% for moving as a child, and the bottom 25% for 
            // moving below the element.
            const offset = element.offset();
            const height = element.outerHeight();
            const mouseY = event.originalEvent.pageY;

            // Calculate the mouse position relative to the element
            const relativeY = mouseY - offset.top;

            if (relativeY < height * 0.25) {
                // Top 25% of the element
                this._dragIndicator
                    .css({
                        top: offset.top - 2, // Slightly above the top
                        left: offset.left,
                        width: element.outerWidth(),
                    })
                    .show();
                element.removeClass("wx-drop-target");
                this._dragoverPosition = "above";
            } else if (relativeY < height * 0.75) {
                // Middle 50% of the element
                this._dragIndicator.hide();
                element.addClass("wx-drop-target");
                this._dragoverPosition = "child";
            } else {
                // Bottom 25% of the element
                this._dragIndicator
                    .css({
                        top: offset.top + height - 2, // Slightly below the bottom
                        left: offset.left,
                        width: element.outerWidth(),
                    })
                    .show();
                element.removeClass("wx-drop-target");
                this._dragoverPosition = "below";
            }
        });

        // Handle drag leave
        element.on("dragleave", () => {
            // Hide the drag indicator when leaving the target area
            element.removeClass("wx-drop-target");
            // Hide the drag indicator when leaving the target area
            this._dragIndicator.hide();
        });

        // Handle drop
        element.on("drop", (event) => {
            event.preventDefault();
            const draggedData = JSON.parse(event.originalEvent.dataTransfer.getData("text/plain"));
            const draggedNode = this._findNodeById(draggedData.node);
            const targetNode = node;

            // Prevent moving a parent node into one of its children
            if (this._isChildNode(draggedNode, targetNode)) {
                this._dragIndicator.hide();
                element.removeClass("wx-drop-target");
                return;
            }

            if (draggedNode && targetNode && draggedNode != targetNode) {
                if (this._dragoverPosition === "above") {
                    this._insertNodeAbove(draggedNode, targetNode);
                } else if (this._dragoverPosition === "child") {
                    this._insertNodeAsChild(draggedNode, targetNode);
                } else if (this._dragoverPosition === "below") {
                    this._insertNodeBelow(draggedNode, targetNode);
                }
            }

            this._dragIndicator.hide(); // Hide the drag indicator after dropping
        });

        // Handle drag end
        element.on("dragend", () => {
            this._dragover = null;
            this._dragIndicator.hide(); // Hide the indicator when dragging ends
            // Remove the dragging class from all columns
            element.removeClass("wx-dragging wx-drop-target");
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

        // Traverse up the tree to check if the targetNode is a child of draggedNode
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

        this.render(); // Re-render the tree
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

        this.render(); // Re-render the tree
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

        this.render(); // Re-render the tree
    }

    /**
     * Removes a node from its current position in the tree.
     * @private
     * @param {Object} node - The node to be removed.
     */
    _removeNodeFromCurrentPosition(node) {
        if (node.parent) {
            node.parent.children = node.parent.children.filter(
                (child) => child !== node
            );
        } else {
            this._nodes = this._nodes.filter((n) => n !== node);
        }
    }

    /**
     * Parses child elements as tree nodes.
     * @private
     * @param {jQuery} elements - The child elements to parse.
     * @param {Object} [parentNode] - The parent node, optional for the root level.
     * @returns {Array} An array of parsed tree nodes.
     */
    _parseNodes(elements, parent = null) {
        const nodes = [];

        elements.each((_, elem) => {
            const $elem = $(elem);
            const node = {
                id: $elem.attr("id") || null,
                label: $elem.data("label") || "Unnamed",
                iconOpen: $elem.data("icon-opened") || $elem.data("icon") || null,
                iconClose: $elem.data("icon-closed") || $elem.data("icon") || null,
                imageOpen: $elem.data("image-opened") || $elem.data("image") || null,
                imageClose: $elem.data("image-closed") || $elem.data("image") || null,
                active: $elem.data("active") || false,
                color: $elem.data("color") || "",
                expand: $elem.data("expand") === true,
                url: $elem.data("url") || null,
                target: $elem.data("target") || null,
                tooltip: $elem.data("tooltip") || null,
                render: $elem.data("render") || null,
                parent: parent
            };

            // Recursively parse children
            node.children = this._parseNodes($elem.children(".wx-tree-node"), node);

            nodes.push(node);
        });

        return nodes;
    }

    /**
     * Renders the tree structure with ARIA attributes.
     * @private
     * @param {jQuery} container - The container for appending tree nodes.
     * @param {Array} nodes - The tree node data to render.
     */
    _renderTree(container, nodes) {
        container.empty(); // Clear existing content
        container.attr("role", "tree"); // Set ARIA role for the container

        nodes.forEach((node) => {
            // Create the tree item
            const li = $("<li>").attr("id", node.id)
                .attr("role", "treeitem") // ARIA role for tree item
                .attr("aria-expanded", node.expand || false) // Indicate expanded/collapsed state
                .attr("aria-level", this._getNodeLevel(node)); // Indicate the nesting level
            const div = $("<div>");
            const ul = $("<ul>") // children
                .addClass(this._getLayoutClasses())
                .attr("role", "group"); // ARIA role for the group of children

            switch (this._layout) {
                case "wx-tree-group":
                    li.addClass("list-group-item");
                    break;
                case "wx-tree-flush":
                    li.addClass("list-group-item");
                    break;
                case "wx-tree-horizontal":
                    li.addClass("list-group-item");
                    break;
                case "wx-tree-flat":
                    break;
                default:
                    li.addClass("wx-tree-node");
                    break;
            }

            // If the node is selectable, add aria-selected
            if (node.selectable) {
                li.attr("aria-selected", node.selected || false);
            }

            const labelContainer = node.url ? $("<a>") : $("<button>");
            const img = $("<img/>");
            const icon = $("<i>");

            labelContainer
                .addClass(node.color)
                .addClass("wx-tree-label-container");

            // Add image, icon, or label
            if (node.active) {
                labelContainer
                    .removeClass(node.color)
                    .addClass("active");
            }

            labelContainer.click(() => {
                $(document).trigger(webexpress.webui.Event.CLICK_EVENT,
                    {
                        id: $(this._element).attr("id"),
                        node: node.id
                    });
            });

            // Handle expandable nodes
            if (this._showIndicator && node.children?.length > 0) {
                const indicator = $("<i>").addClass("wx-tree-indicator-angle");
                div.append(indicator);
                indicator.click(() => {
                    this._toggleNode(node, ul, icon, img, indicator);
                });
                if (!node.url) {
                    labelContainer.click(() => {
                        this._toggleNode(node, ul, icon, img, indicator);
                    });
                }
                if (node.expand) {
                    indicator.addClass("wx-tree-expand");
                    icon.removeClass(node.iconClose).addClass(node.iconOpen);
                    img.attr("src", node.imageOpen);
                }
            } else {
                // Add leaf node indicator
                if (this._showIndicator) {
                    div.append($("<i>").addClass("wx-tree-indicator-dot"));
                }
            }

            if (typeof node.render === "string") {
                const render = new Function("node", node.render);
                const renderResult = render(node);
                if (renderResult) {
                    labelContainer.append(renderResult);
                }
            } else {
                if (node.imageOpen) {
                    img.attr("src", node.expand ? node.imageOpen : node.imageClose);
                    labelContainer.append(img);
                }

                if (node.iconOpen) {
                    icon.addClass(node.expand ? node.iconOpen : node.iconClose);
                    labelContainer.append(icon);
                }

                labelContainer.append($("<span>").text(node.label));
            }

            div.append(labelContainer);
            li.append(div);

            // Handle expandable nodes
            if (node.children && node.children.length > 0) {
                li.append(ul);
                if (node.expand) {
                    this._renderTree(ul, node.children);
                }
            }

            if (node.url) {
                labelContainer.attr("href", node.url);
            }

            if (node.target) {
                labelContainer.attr("target", node.target);
            }

            if (node.tooltip) {
                labelContainer.attr("title", node.tooltip);
            }

            // Append the node to the container
            container.append(li);

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
     * @param {jQuery} ul - The child container for the node's children.
     * @param {jQuery} icon - The icon element for the node.
     * @param {jQuery} img - The image element for the node.
     * @param {jQuery} indicator - The indicator element for the node.
     */
    _toggleNode(node, ul, icon, img, indicator) {
        $(document).trigger(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT,
            {
                id: $(this._element).attr("id"),
                node: node?.id
            });

        if (!node.expand) {
            indicator.addClass("wx-tree-expand-animation");;
            icon.removeClass(node.iconClose).addClass(node.iconOpen);
            img.attr("src", node.imageOpen);
            this._renderTree(ul, node.children);
        } else {
            indicator.removeClass("wx-tree-expand wx-tree-expand-animation");
            icon.removeClass(node.iconOpen).addClass(node.iconClose);
            img.attr("src", node.imageClose);
            ul.empty();
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
        // Iterate through each node in the array
        for (const node of nodes) {
            // Check if the current node's ID matches the target ID
            if (node.id === id) {
                return node; // Return the matching node
            }

            // If the node has children, search recursively
            if (node.children && node.children.length > 0) {
                const result = this._findNodeById(id, node.children);
                if (result) {
                    return result; // Return the result if found in children
                }
            }
        }

        // Return null if the node with the ID is not found
        return null;
    }

    /**
        * Returns the appropriate CSS classes for the tree layout.
        * @private
        * @returns {string|null} The CSS classes for the current layout, or null if no specific layout is set.
        */
    _getLayoutClasses() {
        switch (this._layout) {
            case "wx-tree-group":
                return "list-group";
            case "wx-tree-flush":
                return "list-group list-group-flush";
            case "wx-tree-flat":
                return "list-unstyled";
            case "wx-tree-horizontal":
                return "list-group list-group-horizontal";
            default:
                return null;
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