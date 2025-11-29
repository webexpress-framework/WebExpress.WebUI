/**
 * Read-only selection list that displays all provided items.
 */
webexpress.webui.SelectionCtrl = class extends webexpress.webui.Ctrl {

    /**
     * Creates the read-only selection list.
     * @param {HTMLElement} element host element containing .wx-selection-item children
     */
    constructor(element) {
        super(element);

        // parse all items before clearing
        this._items = this._parseItems(element.querySelectorAll(".wx-selection-item"));
        this._values = [];

        // read optional initial selection markers
        const initial = element.dataset.value || null;
        if (initial) {
            this._values = this._normalizeValues(initial, this._items.map(i => i.id));
        }

        // prepare container
        element.innerHTML = "";
        element.classList.add("wx-selection");

        // create list node
        this._list = document.createElement("ul");
        element.appendChild(this._list);

        this.render();
    }

    /**
     * Parses wx-selection-item nodes into internal item objects.
     * @param {NodeListOf<Element>} nodes item elements
     * @returns {Array} parsed items
     * @private
     */
    _parseItems(nodes) {
        const items = [];
        nodes.forEach(elem => {
            items.push({
                id: elem.getAttribute("id") || null,
                label: elem.dataset.label || elem.textContent.trim(),
                labelColor: elem.dataset.labelColor || null,
                icon: elem.dataset.icon || null,
                image: elem.dataset.image || null,
                // keep original rich content if needed later
                content: elem.innerHTML || "",
                disabled: elem.hasAttribute("disabled")
            });
        });
        return items;
    }

    /**
     * Normalizes input (array/string) into a de-duplicated array of valid ids.
     * @param {Array|string|null|undefined} values input values
     * @param {Array} validIds list of allowed ids
     * @returns {Array} normalized id list
     * @private
     */
    _normalizeValues(values, validIds) {
        let arr = [];
        if (values == null) {
            arr = [];
        } else if (Array.isArray(values)) {
            arr = values;
        } else if (typeof values === "string") {
            const trimmed = values.trim();
            if (trimmed.length > 0) {
                arr = trimmed.includes(";")
                    ? trimmed.split(";").map(v => v.trim()).filter(v => v.length > 0)
                    : [trimmed];
            }
        }
        const valid = new Set(validIds.map(id => String(id)));
        const seen = new Set();
        return arr
            .map(v => String(v))
            .filter(v => valid.has(v) && !seen.has(v) && seen.add(v));
    }

    /**
     * Renders all items (never filtered); applies 'selected' marking where needed.
     */
    render() {
        if (!this._list) return;
        this._list.innerHTML = "";
        // build lookup for selected ids
        const selected = new Set((this._values || []).map(v => String(v)));
        // filter items to render only selected ones (preserve original order)
        const itemsToRender = this._items.filter(item => selected.has(String(item.id)));


        itemsToRender.forEach(item => {
            const li = document.createElement("li");
            if (item.labelColor) li.classList.add(item.labelColor);
            if (item.disabled) li.classList.add("is-disabled");
            if (this._values.includes(String(item.id))) {
                li.classList.add("selected");
            }

            const wrapper = document.createElement("span");
            // optional image
            if (item.image) {
                const img = document.createElement("img");
                img.className = "wx-icon";
                img.src = item.image;
                img.alt = "";
                wrapper.appendChild(img);
            }
            // optional icon
            if (item.icon) {
                const icon = document.createElement("i");
                icon.className = item.icon;
                wrapper.appendChild(icon);
            }
            // label
            const labelSpan = document.createElement("span");
            labelSpan.textContent = item.label;
            wrapper.appendChild(labelSpan);

            li.appendChild(wrapper);
            this._list.appendChild(li);
        });

        // add an empty state marker only if keinerlei items exist
        if (this._items.length === 0) {
            const li = document.createElement("li");
            li.textContent = "";
            this._list.appendChild(li);
        }
    }

    /**
     * Returns all option items.
     * @returns {Array} items
     */
    get options() {
        return this._items;
    }

    /**
     * Replaces option list and re-renders, preserving selection markers if possible.
     * @param {Array} items new item list
     */
    set options(items) {
        const oldValues = [...this._values];
        this._items = Array.isArray(items) ? items : [];
        this._values = this._normalizeValues(oldValues, this._items.map(i => i.id));
        this.render();
    }

    /**
     * Returns current selected (marked) ids.
     * @returns {Array} selected ids
     */
    get value() {
        return this._values;
    }

    /**
     * Sets selection markers programmatically; does not hide other items.
     * Triggers CHANGE_VALUE_EVENT if marking changes.
     * @param {Array|string|null|undefined} values selection ids
     */
    set value(values) {
        const validIds = this._items.map(i => i.id);
        const normalized = this._normalizeValues(values, validIds);
        const oldSerialized = (this._values || []).join(";");
        const newSerialized = normalized.join(";");

        if (oldSerialized !== newSerialized) {
            this._values = normalized;
            this.render();
        }
    }
};

// register the class
webexpress.webui.Controller.registerClass("wx-webui-selection", webexpress.webui.SelectionCtrl);