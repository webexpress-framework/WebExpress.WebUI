/**
 * A control that provides a search input and highlights matches in specified target elements.
 * The search is restricted to the contents of elements identified by given IDs.
 * Matches are highlighted in yellow using <mark> elements.
 *
 * Attributes on the host element:
 * - name: optional input name.
 * - placeholder: optional placeholder text for the input.
 * - data-icon: optional icon class (default: "fas fa-search").
 * - data-target-ids: comma-separated list of element IDs to search within (required).
 * - data-highlight-color: optional css color for highlight background (default: "yellow").
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_FILTER_EVENT
 */
webexpress.webui.SearchContentCtrl = class extends webexpress.webui.Ctrl {

    _value = "";
    _highlightColor = "yellow";
    _targetIds = [];
    _searchBox;
    _searchInput;

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element for the search control.
     */
    constructor(element) {
        super(element);

        // read configuration from attributes
        const name = element.getAttribute("name") || null;
        const placeholder = element.getAttribute("placeholder") || null;
        const icon = element.dataset.icon || "fas fa-search";
        const idsAttr = element.getAttribute("data-target-ids") || element.dataset.targets || "";
        const colorAttr = element.getAttribute("data-highlight-color") || element.dataset.highlightColor || "yellow";

        // normalize and store settings
        this._highlightColor = colorAttr;
        this._targetIds = idsAttr
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        // build ui
        this._searchBox = this._createSearchBox();
        const searchIcon = this._createSearchIcon(icon);
        this._searchInput = this._createSearchInput(name, placeholder);
        const searchClear = this._createSearchClearButton();

        this._searchBox.classList.add("form-control", "wx-content-search");
        this._searchBox.appendChild(searchIcon);
        this._searchBox.appendChild(this._searchInput);
        this._searchBox.appendChild(searchClear);

        // clean up original attributes that are now applied to internal input
        element.removeAttribute("name");
        element.removeAttribute("placeholder");

        // mount built ui
        element.classList.add("wx-search");
        element.innerHTML = "";
        element.appendChild(this._searchBox);

        // initial highlight if a preset value exists
        if (this._value && this._value.length > 0) {
            this._applyHighlight(this._value);
        }
    }

    /**
     * Creates the search box element.
     * @returns {HTMLElement} The search box element.
     */
    _createSearchBox() {
        const searchBox = document.createElement("div");
        return searchBox;
    }

    /**
     * Creates the search icon element.
     * @param {string} iconClass - The CSS class for the icon.
     * @returns {HTMLElement} The search icon element.
     */
    _createSearchIcon(iconClass) {
        const label = document.createElement("label");
        const icon = document.createElement("i");
        icon.className = iconClass;
        label.appendChild(icon);
        return label;
    }

    /**
     * Creates the search input field.
     * @param {string|null} name - The name for the input field.
     * @param {string|null} placeholder - The placeholder text for the input field.
     * @returns {HTMLInputElement} The search input element.
     */
    _createSearchInput(name, placeholder) {
        const input = document.createElement("input");
        input.type = "text";
        if (name) {
            input.name = name;
        }
        if (placeholder) {
            input.placeholder = placeholder;
            input.setAttribute("aria-label", placeholder);
        }

        // react to user input and update highlights
        input.addEventListener("input", () => {
            // set value updates and event dispatch
            this.value = input.value;
            // apply highlights for current value
            this._applyHighlight(this._value);
        });

        // support escape to clear
        input.addEventListener("keydown", (ev) => {
            if (ev.key === "Escape") {
                // prevent default and clear the search
                ev.preventDefault();
                this.value = "";
                this._applyHighlight("");
            }
        });

        return input;
    }

    /**
     * Creates the clear button for the search field.
     * @returns {HTMLElement} The clear button element.
     */
    _createSearchClearButton() {
        const searchClear = document.createElement("span");
        const icon = document.createElement("i");
        icon.className = "fas fa-times";
        searchClear.appendChild(icon);
        searchClear.style.cursor = "pointer";

        searchClear.addEventListener("click", () => {
            // clear value, focus input and remove highlights
            this.value = "";
            this._searchInput.focus();
            this._applyHighlight("");
        });

        return searchClear;
    }

    /**
     * Applies highlighting to all target elements based on the query.
     * @param {string} query - The text to highlight.
     */
    _applyHighlight(query) {
        // remove old highlights first
        this._clearAllHighlights();

        // if no query, nothing to highlight
        if (!query || query.length === 0) {
            return;
        }

        // escape query for use in regex
        const pattern = this._escapeRegExp(query);
        if (pattern.length === 0) {
            return;
        }

        const regex = new RegExp(pattern, "gi");

        // process each target element
        const targets = this._getTargetElements();
        for (const target of targets) {
            // gather text nodes to avoid walker invalidation during dom mutations
            const textNodes = this._collectSearchableTextNodes(target);
            for (const textNode of textNodes) {
                const text = textNode.nodeValue;
                if (!text || text.trim().length === 0) {
                    continue;
                }

                // skip if no match
                if (!regex.test(text)) {
                    // reset lastIndex for subsequent uses
                    regex.lastIndex = 0;
                    continue;
                }

                // rebuild content with <mark> elements
                regex.lastIndex = 0;
                const frag = document.createDocumentFragment();
                let lastIndex = 0;
                let match;
                while ((match = regex.exec(text)) !== null) {
                    const start = match.index;
                    const end = start + match[0].length;

                    // append preceding text
                    if (start > lastIndex) {
                        const before = text.slice(lastIndex, start);
                        frag.appendChild(document.createTextNode(before));
                    }

                    // create highlight element
                    const mark = document.createElement("mark");
                    mark.setAttribute("data-wx-highlight", "true");
                    mark.style.backgroundColor = this._highlightColor;
                    mark.textContent = text.slice(start, end);
                    frag.appendChild(mark);

                    lastIndex = end;
                }

                // append trailing text
                if (lastIndex < text.length) {
                    const after = text.slice(lastIndex);
                    frag.appendChild(document.createTextNode(after));
                }

                // replace original text node with fragment
                if (textNode.parentNode) {
                    textNode.parentNode.replaceChild(frag, textNode);
                }
            }
        }
    }

    /**
     * Removes all highlight elements from the target elements.
     */
    _clearAllHighlights() {
        const targets = this._getTargetElements();
        for (const target of targets) {
            const highlights = target.querySelectorAll('[data-wx-highlight="true"]');
            for (const el of highlights) {
                this._unwrapElement(el);
            }
        }
    }

    /**
     * Safely unwraps a highlight element by replacing it with a text node of its text content.
     * @param {HTMLElement} el - The element to unwrap.
     */
    _unwrapElement(el) {
        const parent = el.parentNode;
        if (!parent) {
            return;
        }
        const textNode = document.createTextNode(el.textContent ?? "");
        parent.replaceChild(textNode, el);
        // merge adjacent text nodes if any
        this._mergeAdjacentTextNodes(parent);
    }

    /**
     * Merges adjacent text nodes to keep DOM clean after unwrapping.
     * @param {Node} parent - The parent node whose children may contain adjacent text nodes.
     */
    _mergeAdjacentTextNodes(parent) {
        // iterate once and merge neighbors
        let i = 0;
        while (i < parent.childNodes.length - 1) {
            const a = parent.childNodes[i];
            const b = parent.childNodes[i + 1];
            if (a.nodeType === Node.TEXT_NODE && b.nodeType === Node.TEXT_NODE) {
                a.nodeValue = (a.nodeValue || "") + (b.nodeValue || "");
                parent.removeChild(b);
                // do not increment i to check for further merges
            } else {
                i++;
            }
        }
    }

    /**
     * Collects text nodes within a root element that are eligible for highlighting.
     * Skips nodes inside script/style/noscript and inside already highlighted regions.
     * @param {Element} root - The root element to search within.
     * @returns {Text[]} An array of text nodes.
     */
    _collectSearchableTextNodes(root) {
        const nodes = [];
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // ignore empty text
                    if (!node || !node.nodeValue || node.nodeValue.length === 0) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // skip if inside existing highlight
                    if (node.parentElement && node.parentElement.closest('[data-wx-highlight="true"]')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // skip inside script/style/noscript
                    if (node.parentElement && node.parentElement.closest("script, style, noscript")) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        let current;
        while ((current = walker.nextNode())) {
            nodes.push(current);
        }
        return nodes;
    }

    /**
     * Returns the array of target elements resolved from configured IDs.
     * @returns {HTMLElement[]} Target elements.
     */
    _getTargetElements() {
        const elements = [];
        for (const id of this._targetIds) {
            const el = document.getElementById(id);
            if (el) {
                elements.push(el);
            }
        }
        return elements;
    }

    /**
     * Escapes a string for safe use in a regular expression.
     * @param {string} s - The string to escape.
     * @returns {string} The escaped string.
     */
    _escapeRegExp(s) {
        // escape regex meta characters
        return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /**
     * Gets the current value of the search input.
     * @returns {string} The current search value.
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the value of the search input and triggers a filter change event.
     * @param {string} v - The new value to set.
     */
    set value(v) {
        if (this._value !== v) {
            this._value = v;
            if (this._searchInput && this._searchInput.value !== v) {
                this._searchInput.value = v;
            }
            // dispatch change filter event for integration
            this._dispatch(webexpress.webui.Event.CHANGE_FILTER_EVENT, { value: v });
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-search-content", webexpress.webui.SearchContentCtrl);