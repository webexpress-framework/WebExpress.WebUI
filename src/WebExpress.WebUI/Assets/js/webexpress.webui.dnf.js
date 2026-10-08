/**
 * Disjunctive normal form: the value model and the read-only view.
 *
 * A DNF expression is a disjunction of conjunctions - [[A,B],[C],[D,E]] reads as
 * (A AND B) OR (C) OR (D AND E). The two dimensions travel in one string so the
 * value fits a single hidden form field and a single table cell: terms inside a
 * group are joined with ";" and the groups with "|", which makes a one group
 * expression byte for byte the semicolon list every other selection control
 * already speaks.
 */
webexpress.webui.DnfValue = class {
    /**
     * Separates the terms of one conjunction. Shared with the selection control,
     * so a single group round-trips through code that only knows selections.
     */
    static TERM_SEPARATOR = ";";

    /**
     * Separates the conjunctions of the disjunction.
     */
    static GROUP_SEPARATOR = "|";

    /**
     * Reads any of the shapes a host may hand in and answers the canonical one:
     * an array of groups, each an array of non-empty, unique term ids, with
     * empty groups dropped.
     *
     * Accepts the serialized string, a flat id list (which is a single
     * conjunction), a list of groups, and the object lists a REST payload
     * produces, so a caller never has to normalize before assigning.
     *
     * @param {string|Array|null|undefined} value - The value to read.
     * @returns {Array<Array<string>>} The groups.
     */
    static parse(value) {
        if (value === null || value === undefined) {
            return [];
        }

        if (typeof value === "string") {
            return this._clean(value.split(this.GROUP_SEPARATOR).map((group) => group.split(this.TERM_SEPARATOR)));
        }

        if (!Array.isArray(value)) {
            return this._clean([[this._id(value)]]);
        }

        // a flat list is one conjunction; only a nested list carries the disjunction
        const nested = value.some((entry) => Array.isArray(entry));
        if (!nested) {
            return this._clean([value.map((entry) => this._id(entry))]);
        }

        return this._clean(value.map((group) => (Array.isArray(group) ? group : [group]).map((entry) => this._id(entry))));
    }

    /**
     * Serializes groups into the transport string.
     * @param {Array<Array<string>>|string|null} groups - The groups.
     * @returns {string} The serialized expression, empty when nothing is set.
     */
    static format(groups) {
        return this.parse(groups)
            .map((group) => group.join(this.TERM_SEPARATOR))
            .join(this.GROUP_SEPARATOR);
    }

    /**
     * Compares two expressions by meaning rather than by shape, so a control can
     * tell a real change from a re-assignment of the same value in a different
     * notation.
     * @param {*} left - The first value.
     * @param {*} right - The second value.
     * @returns {boolean} True when both describe the same expression.
     */
    static equals(left, right) {
        return this.format(left) === this.format(right);
    }

    /**
     * Returns every term id used anywhere in the expression, once. Callers that
     * have to resolve labels - the read-only view, a REST backed view - ask for
     * the whole set in one go instead of walking the groups themselves.
     * @param {*} value - The expression.
     * @returns {Array<string>} The distinct term ids, in first-use order.
     */
    static terms(value) {
        return [...new Set(this.parse(value).flat())];
    }

    /**
     * Renders the expression as text, which is what a tooltip, an aria label or
     * a compacted table cell needs.
     * @param {*} value - The expression.
     * @param {Function} [label] - Resolves a term id to its display text.
     * @param {string} [and] - The conjunction word.
     * @param {string} [or] - The disjunction word.
     * @returns {string} The readable expression.
     */
    static toText(value, label, and, or) {
        const resolve = typeof label === "function" ? label : (id) => id;
        const groups = this.parse(value);

        return groups
            .map((group) => {
                const terms = group.map((id) => resolve(id)).join(` ${and || "AND"} `);
                // parentheses only earn their place where the precedence is in question
                return groups.length > 1 && group.length > 1 ? `(${terms})` : terms;
            })
            .join(` ${or || "OR"} `);
    }

    /**
     * Reads the id out of whichever entry shape a caller passed.
     * @param {*} entry - A term id or an object carrying one.
     * @returns {string} The id.
     */
    static _id(entry) {
        if (entry === null || entry === undefined) {
            return "";
        }
        if (typeof entry === "object") {
            return entry.id === null || entry.id === undefined ? "" : String(entry.id);
        }
        return String(entry);
    }

    /**
     * Drops what carries no meaning: blank terms, terms repeated inside one
     * conjunction (A AND A is A) and groups that ended up empty.
     * @param {Array<Array<string>>} groups - The raw groups.
     * @returns {Array<Array<string>>} The cleaned groups.
     */
    static _clean(groups) {
        return groups
            .map((group) => [...new Set(group.map((term) => String(term ?? "").trim()).filter((term) => term.length > 0))])
            .filter((group) => group.length > 0);
    }
};

/**
 * Read-only view of a DNF expression.
 *
 * The view renders the terms of a conjunction as chips joined by the AND word
 * and separates the conjunctions with the OR word, so the two levels of the
 * expression stay distinguishable without the reader knowing the notation. It
 * is also the read view the smart edit shows for the DNF input, which is why it
 * takes its options in the same shape the input publishes them.
 */
webexpress.webui.DnfCtrl = class extends webexpress.webui.Ctrl {
    _items = [];
    _groups = [];
    _compact = false;
    _placeholder = null;

    /**
     * Creates the read-only view.
     * @param {HTMLElement} element - The host element carrying .wx-selection-item children.
     */
    constructor(element) {
        super(element);

        this._items = this._parseItems(element.querySelectorAll(".wx-selection-item"));
        this._groups = webexpress.webui.DnfValue.parse(element.dataset.value || null);
        this._compact = element.dataset.compact === "true";
        this._placeholder = element.dataset.placeholder || null;

        this._and = this._i18n("webexpress.webui:dnf.and", "and");
        this._or = this._i18n("webexpress.webui:dnf.or", "or");

        element.innerHTML = "";
        element.classList.add("wx-dnf", "wx-dnf-view");
        if (this._compact) {
            element.classList.add("wx-dnf-compact");
        }

        this.render();
    }

    /**
     * Parses the declared options into the item shape the input control also
     * uses, so both controls can be fed from one source.
     * @param {NodeListOf<Element>} nodes - The option elements.
     * @returns {Array} The items.
     */
    _parseItems(nodes) {
        const items = [];
        nodes.forEach((elem) => {
            items.push({
                id: elem.getAttribute("id") || null,
                label: elem.dataset.label || elem.textContent.trim(),
                color: elem.dataset.color || elem.dataset.labelColor || null,
                icon: elem.dataset.icon || null,
                image: elem.dataset.image || null,
                disabled: elem.hasAttribute("disabled")
            });
        });
        return items;
    }

    /**
     * Returns the item registered for a term id, if any.
     * @param {string} id - The term id.
     * @returns {object|null} The item.
     */
    _item(id) {
        return this._items.find((item) => String(item.id) === String(id)) || null;
    }

    /**
     * Returns the display text of a term. An id without a registered option
     * still shows as itself rather than vanishing, because a value that arrived
     * before its options did would otherwise read as an empty expression.
     * @param {string} id - The term id.
     * @returns {string} The label.
     */
    _label(id) {
        const item = this._item(id);
        return item && item.label ? item.label : String(id);
    }

    /**
     * Builds one term chip.
     * @param {string} id - The term id.
     * @returns {HTMLElement} The chip element.
     */
    _renderTerm(id) {
        const item = this._item(id);
        const term = document.createElement("span");
        term.className = "wx-dnf-term";

        if (item && item.color) {
            term.classList.add(item.color);
        }
        if (item && item.disabled) {
            term.classList.add("is-disabled");
        }

        if (item && item.image) {
            const img = document.createElement("img");
            img.className = "wx-icon";
            img.src = item.image;
            img.alt = "";
            term.appendChild(img);
        }
        if (item && item.icon) {
            const icon = document.createElement("i");
            icon.className = this._iconClass(item.icon);
            term.appendChild(icon);
        }

        const label = document.createElement("span");
        label.textContent = this._label(id);
        term.appendChild(label);

        return term;
    }

    /**
     * Builds an operator word. The word is a node of its own rather than a
     * pseudo element, so it is part of the accessible text and survives a copy
     * of the rendered expression.
     * @param {string} kind - "and" or "or".
     * @returns {HTMLElement} The operator element.
     */
    _renderOperator(kind) {
        const operator = document.createElement("span");
        operator.className = `wx-dnf-operator wx-dnf-${kind}`;
        operator.textContent = kind === "and" ? this._and : this._or;
        return operator;
    }

    /**
     * Renders the expression.
     */
    render() {
        if (!this._element) {
            return;
        }

        const fragment = document.createDocumentFragment();

        this._groups.forEach((group, index) => {
            if (index > 0) {
                fragment.appendChild(this._renderOperator("or"));
            }

            const groupElement = document.createElement("span");
            groupElement.className = "wx-dnf-group";
            // a conjunction of several terms is bracketed against the surrounding
            // disjunction; a single term needs no bracket to read unambiguously
            if (group.length > 1 && this._groups.length > 1) {
                groupElement.classList.add("wx-dnf-bracketed");
            }

            group.forEach((id, termIndex) => {
                if (termIndex > 0) {
                    groupElement.appendChild(this._renderOperator("and"));
                }
                groupElement.appendChild(this._renderTerm(id));
            });

            fragment.appendChild(groupElement);
        });

        this._element.innerHTML = "";

        if (this._groups.length === 0) {
            if (this._placeholder) {
                const empty = document.createElement("span");
                empty.className = "wx-dnf-placeholder";
                empty.textContent = this._placeholder;
                this._element.appendChild(empty);
            }
            this._element.removeAttribute("title");
            return;
        }

        this._element.appendChild(fragment);

        // the compact view clips to the cell width, so the full expression has to
        // stay reachable somewhere; the title is that somewhere
        if (this._compact) {
            this._element.setAttribute("title", this.text);
        }
    }

    /**
     * Returns the options the view resolves labels against.
     * @returns {Array} The items.
     */
    get options() {
        return this._items;
    }

    /**
     * Replaces the options and re-renders.
     * @param {Array} items - The new items.
     */
    set options(items) {
        this._items = Array.isArray(items) ? items : [];
        this.render();
    }

    /**
     * Returns whether the view renders in the space saving single line form.
     * @returns {boolean} True when compact.
     */
    get compact() {
        return this._compact;
    }

    /**
     * Switches between the full and the space saving form.
     * @param {boolean} enabled - True for the compact form.
     */
    set compact(enabled) {
        this._compact = Boolean(enabled);
        this._element.classList.toggle("wx-dnf-compact", this._compact);
        this.render();
    }

    /**
     * Returns the expression as readable text.
     * @returns {string} The expression.
     */
    get text() {
        return webexpress.webui.DnfValue.toText(this._groups, (id) => this._label(id), this._and, this._or);
    }

    /**
     * Returns the expression.
     * @returns {Array<Array<string>>} The groups.
     */
    get value() {
        return this._groups;
    }

    /**
     * Sets the expression and re-renders when it actually changed.
     * @param {string|Array|null} value - The new expression.
     */
    set value(value) {
        const groups = webexpress.webui.DnfValue.parse(value);

        if (webexpress.webui.DnfValue.equals(this._groups, groups)) {
            return;
        }

        this._groups = groups;
        this.render();
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-dnf", webexpress.webui.DnfCtrl);
