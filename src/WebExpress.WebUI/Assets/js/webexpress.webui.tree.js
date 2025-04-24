/**
 * A tree control extending the base Control class.
 * The following events are triggered:
 * - webexpress.webui.change.visibility Event triggered when the visibility of an element changes
 * - webexpress.webui.click Event triggered when an element is clicked
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
     * Parses child elements as tree nodes.
     * @param {jQuery} elements - The child elements to parse.
     * @returns {Array} An array of parsed tree nodes.
     */
    _parseNodes(elements) {
        const nodes = [];

        elements.each((_, elem) => {
            const $elem = $(elem);
            nodes.push({
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
                children: this._parseNodes($elem.children(".wx-tree-node")) // Recursively parse children
            });
        });

        return nodes;
    }

    /**
     * Renders the tree structure.
     * @param {jQuery} container - The container for appending tree nodes.
     * @param {Array} nodes - The tree node data to render.
     */
    _renderTree(container, nodes) {
        container.empty(); // Clear existing content

        nodes.forEach((node) => {
            const li = $("<li>").addClass("wx-tree-node");
            const expand = $("<span>").addClass(node.color);
            const img = $("<img/>");
            const icon = $("<i>");

            // Add image, icon, or label
            this._addNodeContent(expand, node, img, icon);
            li.append(expand);

            // Handle expandable nodes
            if (node.children && node.children.length > 0) {
                const ul = $("<ul>");
                const indicator = $("<a class='wx-tree-indicator-angle'>");

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
                expand.prepend($("<a>").addClass("wx-tree-indicator-dot"));
            }

            li.click(() => {
                $(document).trigger(webexpress.webui.Event.CLICK_EVENT, node);
            });

            // Append the node to the container
            container.append(li);
        });
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
        $(document).trigger(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, node);

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
        } else if (node.url) {
            const link = $("<a>", { href: node.url, text: node.label, class: node.color });
            expand.append(link);
        } else {
            expand.append($("<span>").text(node.label));
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