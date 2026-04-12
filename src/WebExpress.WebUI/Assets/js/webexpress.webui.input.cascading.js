/**
 * Cascading selection control.
 * Each level is rendered as webexpress.webui.InputSelectionCtrl.
 */
webexpress.webui.InputCascadingCtrl = class extends webexpress.webui.Ctrl {
    _placeholder = "";
    _tree = [];
    _path = [];

    /**
     * Constructor initializes the cascading control and builds the static option tree
     * from the given DOM element. Only the root level is rendered initially.
     * @param {HTMLElement} element - The host element containing .wx-cascading-item children.
     */
    constructor(element) {
        super(element);

        const name = element.getAttribute("name");
        this._placeholder = element.getAttribute("placeholder") || this._i18n("webexpress.webui:selection.placeholder", "Select an option");

        // hidden input for form submission
        this._hidden = this._createHiddenInput(name);

        // container that will hold per-level inputselection hosts
        this._levelsContainer = document.createElement("div");
        this._levelsContainer.classList.add("wx-cascading-levels");

        // parse the option tree from the original dom (static read, no observers)
        this._tree = this._parseTree(element);
        this._path = [];

        // clean up source element and attach control root
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-multiselection");
        element.innerHTML = "";
        element.classList.add("wx-cascading");
        element.appendChild(this._hidden);
        element.appendChild(this._levelsContainer);

        // render only the root level initially
        this._renderLevel(0, this._tree);
    }

    /**
     * Creates hidden input for form submission.
     * @param {string} name - Input name attribute.
     * @returns {HTMLInputElement} The created hidden input.
     */
    _createHiddenInput(name) {
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = name || "";
        return hiddenInput;
    }

    /**
     * Extracts only text nodes that are direct children (no nested selection-item text).
     * @param {HTMLElement} elem - Element to extract text from.
     * @returns {string} Trimmed direct-text content.
     */
    _extractOwnText(elem) {
        // collect only direct text nodes to avoid nested item text
        let text = "";
        const nodes = Array.from(elem.childNodes);
        nodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            }
        });
        return text.trim();
    }

    /**
     * Extracts the inner html of the element excluding its nested .wx-cascading-item children.
     * @param {HTMLElement} elem - Element to extract html from.
     * @returns {string} HTML string containing only this element's own markup.
     */
    _extractOwnHtml(elem) {
        // clone and remove direct child selection items to keep only own markup
        const clone = elem.cloneNode(true);
        const children = Array.from(clone.children);
        children.forEach((ch) => {
            if (ch.classList && ch.classList.contains("wx-cascading-item")) {
                clone.removeChild(ch);
            }
        });
        return clone.innerHTML.trim();
    }

    /**
     * Parses DOM hierarchy into an option tree using direct children only.
     * @param {HTMLElement} root - Element containing .wx-cascading-item children.
     * @returns {Array} Array of node objects {id,label,content,children,...}.
     */
    _parseTree(root) {
        // iterate direct children only; recursion builds the whole static tree
        const nodes = [];
        const children = Array.from(root.children || []);
        children.forEach((child) => {
            if (child.classList && child.classList.contains("wx-cascading-item")) {
                const node = {
                    id: child.getAttribute("id") || null,
                    label: child.dataset.label || this._extractOwnText(child) || null,
                    labelColor: child.dataset.labelColor || null,
                    icon: child.dataset.icon || null,
                    image: child.dataset.image || null,
                    content: child.dataset.label || this._extractOwnHtml(child) || "",
                    disabled: child.hasAttribute("disabled"),
                    children: this._parseTree(child)
                };
                nodes.push(node);
            }
        });
        return nodes;
    }

    /**
     * Renders a single level using InputSelectionCtrl.
     * Recurses if a path value is already present for this level.
     * Ensures subsequent levels are removed if nodes are empty or selection changes.
     * @param {number} level - Depth level (0 = root).
     * @param {Array} nodes - Array of node objects for this level.
     */
    _renderLevel(level, nodes) {
        // remove any deeper levels beyond current level and detach their listeners
        // this ensures that if we re-render level 1, level 2 and 3 are removed first
        while (this._levelsContainer.children.length > level) {
            const last = this._levelsContainer.lastChild;
            if (last) {
                if (last.__wx_doc_handler) {
                    document.removeEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, last.__wx_doc_handler);
                    delete last.__wx_doc_handler;
                }
                if (last.__wx_click_handler) {
                    last.removeEventListener("click", last.__wx_click_handler);
                    delete last.__wx_click_handler;
                }
                this._levelsContainer.removeChild(last);
            }
        }

        if (!nodes || nodes.length === 0) {
            this._updateHidden();
            return;
        }

        // create host element and instantiate inputselectionctrl for this level
        const selectionHost = document.createElement("div");
        selectionHost.setAttribute("data-multiselection", "false");
        selectionHost.setAttribute("placeholder", this._placeholder);

        this._levelsContainer.appendChild(selectionHost);

        const selectionCtrl = new webexpress.webui.InputSelectionCtrl(selectionHost);

        // map parsed nodes to the options format expected by inputselectionctrl
        const items = nodes.map((node) => {
            return {
                value: node.id,
                id: node.id,
                label: node.label,
                labelColor: node.labelColor,
                icon: node.icon,
                image: node.image,
                content: node.content,
                disabled: node.disabled
            };
        });

        selectionCtrl.options = items;

        // if there is a known value for this level in the path, apply it and recurse
        let preSelectedId = null;
        if (this._path.length > level) {
            preSelectedId = this._path[level];
            if (preSelectedId) {
                // set value as array because inputselectionctrl expects it
                selectionCtrl.value = [preSelectedId];
            }
        }

        // common handler used both for dispatched change events and click fallback
        const handleSelectionChange = () => {
            // normalize possible return shapes (primitive or object with value)
            let selected = null;
            if (selectionCtrl.value && selectionCtrl.value.length > 0) {
                const first = selectionCtrl.value[0];
                if (first && typeof first === "object" && ("value" in first)) {
                    selected = first.value;
                } else {
                    selected = first;
                }
            }

            // truncate path to current level, removing all subsequent selections
            this._path = this._path.slice(0, level);

            // push new selection if valid
            if (selected) {
                this._path.push(selected);
            }

            const childNodes = this._findChildren(nodes, selected);

            // render next level
            // if selected is null (reset), childNodes is null, causing next level to be cleared
            this._renderLevel(level + 1, childNodes);

            // dispatch a value change for the whole cascading path
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: [...this._path] });
        };

        // document-level listener: filter events so only those originating from this host are processed
        const docHandler = (evt) => {
            if (!evt || !evt.detail) {
                return;
            }
            const sender = evt.detail.sender ? evt.detail.sender : evt.target;
            if (sender === selectionHost || selectionHost.contains(sender)) {
                handleSelectionChange();
            }
        };

        document.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, docHandler);
        selectionHost.__wx_doc_handler = docHandler;

        // fallback: also listen for clicks inside the host
        const clickHandler = () => {
            setTimeout(() => {
                handleSelectionChange();
            }, 0);
        };
        selectionHost.addEventListener("click", clickHandler);
        selectionHost.__wx_click_handler = clickHandler;

        this._updateHidden();

        // if we pre-selected a value during render (e.g. from set value), we must manually trigger recursion
        if (preSelectedId) {
            const childNodes = this._findChildren(nodes, preSelectedId);
            this._renderLevel(level + 1, childNodes);
        }
    }

    /**
     * Finds children for a given id inside nodes.
     * @param {Array} nodes - Nodes to search.
     * @param {string|null} id - ID to find.
     * @returns {Array|null} Child nodes array or null.
     */
    _findChildren(nodes, id) {
        if (!id) {
            return null;
        }
        for (let i = 0; i < nodes.length; i += 1) {
            const n = nodes[i];
            if (n.id === id) {
                return n.children && n.children.length > 0 ? n.children : null;
            }
        }
        return null;
    }

    /**
     * Updates hidden input with the selected path.
     * @private
     */
    _updateHidden() {
        if (this._hidden) {
            this._hidden.value = this._path.join(";");
        }
    }

    /**
     * Gets current path selection.
     * @returns {Array} Selected path as array of IDs.
     */
    get value() {
        return this._path;
    }

    /**
     * Sets path selection and re-renders levels accordingly.
     * Accepts Array, semicolon-separated string or null.
     * @param {Array|string|null|undefined} values - New selection path.
     */
    set value(values) {
        let normalized = [];
        if (values === null || values === undefined) {
            normalized = [];
        } else if (Array.isArray(values)) {
            normalized = values;
        } else if (typeof values === "string") {
            const trimmed = values.trim();
            if (trimmed.length > 0) {
                if (trimmed.includes(";")) {
                    normalized = trimmed.split(";").map((v) => { return v.trim(); }).filter((v) => { return v.length > 0; });
                } else {
                    normalized = [trimmed];
                }
            }
        }

        // clean duplicates if any, though path usually shouldn't have them
        normalized = [...new Set(normalized)];

        this._path = normalized;
        this._renderLevel(0, this._tree);
    }
};

// register control class
webexpress.webui.Controller.registerClass("wx-webui-input-cascading", webexpress.webui.InputCascadingCtrl);