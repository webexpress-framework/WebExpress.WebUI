/**
 * A tree control extending the base Control class.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.MOVE_EVENT
 */
webexpress.webui.TreeCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor for initializing the tree control.
     * @param {HTMLElement} element - The DOM element for the tree control.
     */
    constructor(element) {
        super(element);

        // Initialize properties
        this._container = $("<ul>");
        this._nodes = this._parseNodes($(element).children(".wx-tree-node"));

        // Clean up the DOM
        $(element).empty().addClass("wx-tree").append(this._container);

        // Render the tree
        this.render();
    }

    /**
     * Enables drag and drop functionality for the tree.
     * @param {jQuery} element - The node element.
     * @param {Object} node - The node object.
     */
    _enableDragAndDrop(element, node) {
        // Attach dragstart, dragover, and drop handlers to tree nodes
        element.attr("draggable", true);

        // Handle drag start
        element.on("dragstart", (event) => {
            event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(
                {
                    element: element,
                    node: node.id,
                }));

            event.addClass("wx-dragging");
        });

        // Handle drag over
        element.on("dragover", (event) => {
            event.preventDefault(); // Allow dropping by preventing default behavior

            // ToDo: Prevent moving a node into its own children
            /*const data = event.originalEvent.dataTransfer.getData("text/plain");
            const draggedData = JSON.parse(data);
            const draggedNode = this._findNodeById(draggedData.node);

            // Check if the current element is a child of the dragged node
            let isChild = false;
            let currentNode = node;

            while (currentNode) {
                if (currentNode === draggedNode) {
                    isChild = true;
                    break;
                }
                currentNode = currentNode.parent; // Traverse up the tree
            }

            if (isChild) {
                // Do not allow dropping on a child node
                return;
            }*/

            // Mark the element as a valid drop target
            element.addClass("wx-drop-target");
        });

        // Handle drag leave
        element.on("dragleave", () => {
            // Hide the drag indicator when leaving the target area
            element.removeClass("wx-drop-target");
        });

        // Handle drop
        element.on("drop", (event) => {
            event.preventDefault();
            const draggedData = JSON.parse(event.originalEvent.dataTransfer.getData("text/plain"));
            const draggedNode = this._findNodeById(draggedData.node);
            const targetNode = node;

            if (draggedNode && targetNode) {
                this._moveNode(draggedNode, targetNode);
            }
        });

        // Handle drag end
        element.on("dragend", () => {
            // Remove the dragging class from all columns
            element.removeClass("wx-dragging wx-drop-target");
        });
    }

    /**
     * Moves a node to a new parent or position in the tree.
     * @param {Object} draggedNode - The node being dragged.
     * @param {Object} targetNode - The target node where the dragged node will be moved.
     */
    _moveNode(draggedNode, targetNode) {
        // Remove the dragged node from its current parent's children
        if (draggedNode.parent) {
            draggedNode.parent.children = draggedNode.parent.children.filter(
                (child) => child !== draggedNode
            );
        } else {
            // If the node is at the root level, remove it from the main node list
            this._nodes = this._nodes.filter((node) => node !== draggedNode);
        }

        // Set the new parent for the dragged node
        draggedNode.parent = targetNode;

        // Add the dragged node to the children of the target node
        targetNode.children = targetNode.children || [];
        targetNode.children.push(draggedNode);

        // Trigger a MOVE_EVENT to notify external listeners
        $(document).trigger(webexpress.webui.Event.MOVE_EVENT, {
            id: $(this._element).attr("id"),
            node: draggedNode.id,
            newParentId: targetNode.id
        });

        // Re-render the tree to reflect the new structure
        this.render();
    }

    /**
     * Parses child elements as tree nodes.
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
                color: $elem.data("color") || "",
                expand: $elem.data("expand") === true,
                url: $elem.data("url") || null,
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
     * @param {jQuery} container - The container for appending tree nodes.
     * @param {Array} nodes - The tree node data to render.
     */
    _renderTree(container, nodes) {
        container.empty(); // Clear existing content
        container.attr("role", "tree"); // Set ARIA role for the container

        nodes.forEach((node) => {
            // Create the tree item
            const li = $("<li>").addClass("wx-tree-node").attr("id", node.id);
            li.attr("role", "treeitem"); // ARIA role for tree item
            li.attr("aria-expanded", node.expand || false); // Indicate expanded/collapsed state
            li.attr("aria-level", this._getNodeLevel(node)); // Indicate the nesting level

            // If the node is selectable, add aria-selected
            if (node.selectable) {
                li.attr("aria-selected", node.selected || false);
            }

            const expand = $("<a href='#'>").addClass(node.color);
            const img = $("<img/>");
            const icon = $("<i>");

            // Add image, icon, or label
            this._addNodeContent(expand, node, img, icon);
            li.append(expand);

            if (node.url) {
                expand.attr("href", node.url);
            }

            // Handle expandable nodes
            if (node.children && node.children.length > 0) {
                const ul = $("<ul>");
                ul.attr("role", "group"); // ARIA role for the group of children
                const indicator = $("<span>").addClass("wx-tree-indicator-angle");

                expand.prepend(indicator);
                li.append(ul);

                if (node.expand) {
                    this._renderTree(ul, node.children);
                    indicator.addClass("wx-tree-expand");
                }

                expand.click(() => {
                    this._toggleNode(node, ul, icon, img, indicator);
                });
            } else {
                // Add leaf node indicator
                expand.prepend($("<i>").addClass("wx-tree-indicator-dot"));
            }

            expand.click(() => {
                $(document).trigger(webexpress.webui.Event.CLICK_EVENT,
                    {
                        id: $(this._element).attr("id"),
                        node: node
                    });
            });

            // Append the node to the container
            container.append(li);

            this._enableDragAndDrop(expand, node);
        });
    }

    /**
     * Calculates the nesting level of a node.
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
            indicator.addClass("wx-tree-expand");
            icon.removeClass(node.iconClose).addClass(node.iconOpen);
            img.attr("src", node.imageOpen);
            this._renderTree(ul, node.children);
        } else {
            indicator.removeClass("wx-tree-expand");
            icon.removeClass(node.iconOpen).addClass(node.iconClose);
            img.attr("src", node.imageClose);
            ul.empty();
        }

        node.expand = !node.expand;
    }

    /**
     * Adds content (image, icon, or label) to a tree node.
     * @param {jQuery} expand - The container for the node's expand/collapse elements.
     * @param {Object} node - The tree node data.
     * @param {jQuery} img - The image element for the node.
     * @param {jQuery} icon - The icon element for the node.
     */
    _addNodeContent(expand, node, img, icon) {
        if (node.imageOpen) {
            img.attr("src", node.expand ? node.imageOpen : node.imageClose);
            expand.append(img);
        }

        if (node.iconOpen) {
            icon.addClass(node.expand ? node.iconOpen : node.iconClose);
            expand.append(icon);
        }

        if (typeof node.render === "string") {
            const render = new Function("node", node.render);
            const renderResult = render(node);
            if (renderResult) {
                expand.append(renderResult);
            }
        } else {
            expand.append($("<span>").text(node.label));
        }
    }

    /**
     * Recursively finds a node in the tree by its ID.
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