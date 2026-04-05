/**
 * Read-only flat list of move options with optional selection marking.
 * All options are always rendered as a single <ul> list (no headers, buttons, drag & drop).
 * Selected options receive the CSS class 'is-selected'.
 * Initial selection may be provided via data-value (semicolon separated IDs).
 * Programmatic updates via the value setter re-render and emit CHANGE_VALUE_EVENT.
 */
webexpress.webui.MoveCtrl = class extends webexpress.webui.Ctrl {

    /**
     * Constructor
     * @param {HTMLElement} element host element containing .wx-webui-move-option children
     */
    constructor(element) {
        super(element);

        // read attributes
        const initialValue = element.dataset.value || "";

        // parse options and normalize selection
        this._options = this._parseOptions(element.querySelectorAll(".wx-webui-move-option"));
        this._values = this._normalizeValues(initialValue, this._options.map(o => o.id));

        // clean up element
        element.innerHTML = "";
        element.classList.add("wx-move");

        // single list
        this._list = document.createElement("ul");
        this._list.className = "wx-move-list";
        element.appendChild(this._list);

        // initial render
        this.render();
    }

    /**
     * Parses option elements
     * @param {NodeListOf<Element>} nodes option nodes
     * @returns {Array} parsed option objects
     */
    _parseOptions(nodes) {
        const result = [];
        for (const div of nodes) {
            result.push({
                id: div.id,
                label: div.textContent.trim(),
                image: div.dataset.image || null,
                icon: div.dataset.icon || null,
                disabled: div.hasAttribute("disabled")
            });
        }
        return result;
    }

    /**
     * Normalizes raw value input to an array of valid unique ids
     * @param {Array|string|null|undefined} values raw value(s)
     * @param {Array} validIds list of allowed ids
     * @returns {Array} normalized id array
     */
    _normalizeValues(values, validIds) {
        let arr = [];
        if (values == null) {
            arr = [];
        } else if (Array.isArray(values)) {
            arr = [...values];
        } else if (typeof values === "string") {
            const t = values.trim();
            if (t.length > 0) {
                arr = t.includes(";") ? t.split(";").map(v => v.trim()).filter(Boolean) : [t];
            }
        }
        const valid = new Set(validIds.map(String));
        const seen = new Set();
        // unique, valid IDs only
        return arr.map(String).filter(v => valid.has(v) && !seen.has(v) && seen.add(v));
    }

    /**
     * Renders the flat list, only rendering selected options.
     */
    render() {
        if (!this._list) return;
        this._list.innerHTML = "";
        const selectedSet = new Set(this._values.map(String));
        const selectedOptions = this._options.filter(o => selectedSet.has(String(o.id)));

        if (selectedOptions.length === 0) {
            const emptyLi = document.createElement("li");
            emptyLi.textContent = "";
            this._list.appendChild(emptyLi);
            return;
        }

        const fragment = document.createDocumentFragment();
        for (const opt of selectedOptions) {
            fragment.appendChild(this._createListItem(opt, true));
        }
        this._list.appendChild(fragment);
    }

    /**
     * Creates a single list item
     * @param {Object} opt option object
     * @param {boolean} isSelected selection flag
     * @returns {HTMLLIElement}
     */
    _createListItem(opt, isSelected) {
        const li = document.createElement("li");
        li.className = "wx-move-item";
        if (isSelected) li.classList.add("is-selected");
        if (opt.disabled) li.classList.add("is-disabled");

        // icon
        if (opt.icon) {
            const icon = document.createElement("i");
            icon.className = `text-primary ${opt.icon}`;
            li.appendChild(icon);
        }

        // image
        if (opt.image) {
            const img = document.createElement("img");
            img.className = "wx-icon";
            img.src = opt.image;
            img.alt = "";
            li.appendChild(img);
        }

        // label
        const span = document.createElement("span");
        span.textContent = opt.label;
        li.appendChild(span);

        return li;
    }

    /**
     * Returns all options as array.
     * @returns {Array}
     */
    get options() {
        return this._options;
    }

    /**
     * Sets the available options and normalizes the existing selection.
     * @param {Array} options new options array
     */
    set options(options) {
        const prevSelected = new Set(this._values.map(String));
        this._options = Array.isArray(options) ? options : [];
        this._values = this._normalizeValues(Array.from(prevSelected), this._options.map(o => o.id));
        this.render();
    }

    /**
     * Returns selected ids as array.
     * @returns {Array}
     */
    get value() {
        return this._values;
    }

    /**
     * Sets selected ids (programmatically), updates and emits change if different.
     * @param {Array|string|null|undefined} values new selection
     */
    set value(values) {
        const normalized = this._normalizeValues(values, this._options.map(o => o.id));
        const oldSer = (this._values || []).join(";");
        const newSer = normalized.join(";");
        if (oldSer !== newSer) {
            this._values = normalized;
            this.render();
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._values });
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-move", webexpress.webui.MoveCtrl);