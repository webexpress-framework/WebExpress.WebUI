/**
 * A form input for a disjunctive normal form expression.
 *
 * The control stacks one selection control per conjunction: what a user picks
 * inside a group is combined with AND, and the groups are combined with OR, so
 * [[A,B],[C]] reads as (A AND B) OR (C). The picker itself is not reinvented -
 * every group is an ordinary multi-select InputSelectionCtrl, so filtering,
 * icons, colors and the chip rendering behave exactly as they do in a plain
 * selection field.
 *
 * The first group is the expression itself and therefore permanent: its close
 * icon empties it instead of deleting it, because an expression without a
 * single conjunction has nothing left to edit.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.ADD_EVENT
 * - webexpress.webui.Event.REMOVE_EVENT
 */
webexpress.webui.InputDnfCtrl = class extends webexpress.webui.Ctrl {
    _items = [];
    _groups = [];
    _maxGroups = -1;
    _placeholder = "";
    _disabled = false;
    _suspended = 0;

    /**
     * Creates the DNF input.
     * @param {HTMLElement} element - The host element carrying .wx-selection-item children.
     */
    constructor(element) {
        super(element);

        const id = element.getAttribute("id");
        const name = element.getAttribute("name");
        const value = element.dataset.value || null;

        this._placeholder = element.getAttribute("placeholder")
            || this._i18n("webexpress.webui:selection.placeholder", "Select an option");
        this._maxGroups = this._readCount(element.dataset.maxGroups);
        this._disabled = element.classList.contains("disabled") || element.hasAttribute("disabled");
        this._and = this._i18n("webexpress.webui:dnf.and", "and");
        this._or = this._i18n("webexpress.webui:dnf.or", "or");
        this._items = this._parseItems(element.querySelectorAll(".wx-selection-item"));

        const initial = webexpress.webui.DnfValue.parse(value);

        this._hidden = this._createHiddenInput(id, name);
        this._list = document.createElement("div");
        this._list.className = "wx-dnf-list";
        // the field label names the expression as a whole; each conjunction inside
        // names itself by what it shows
        this._list.setAttribute("role", "group");
        this._adoptFieldLabel(this._list, id, element);
        this._addButton = this._createAddButton();

        // the declared options were markup for this control to read, not content
        // for it to keep; everything below is built rather than reused
        element.removeAttribute("id");
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.innerHTML = "";
        element.classList.add("wx-dnf", "wx-dnf-input");
        element.appendChild(this._hidden);
        element.appendChild(this._list);
        element.appendChild(this._addButton);

        // an inner selection announces its own change, which is a group value and
        // not the expression; it is absorbed at the group it came from and
        // answered with the change of the whole expression, so a host listening on
        // this control is never handed half of the value
        this._changeHandler = (e) => {
            e.stopPropagation();
            this._syncValue();
        };

        // an expression always offers at least the one conjunction it is made of
        this._batch(() => (initial.length > 0 ? initial : [[]]).forEach((group) => this._appendGroup(group)));

        this._updateHidden();
        this._updateAddButton();
    }

    /**
     * Runs a change that touches several groups without letting each of them
     * announce itself. Filling a group is a write to a selection control, and
     * every such write reports a change; a host must hear the one change that
     * actually happened rather than one per group the control rebuilt.
     * @param {Function} work - The change to run.
     * @returns {*} Whatever the change returned.
     */
    _batch(work) {
        this._suspended++;
        try {
            return work();
        } finally {
            this._suspended--;
        }
    }

    /**
     * Parses the declared options into the item shape the selection control
     * consumes, so every group is fed from one parse of the markup instead of
     * cloning the option elements per group.
     * @param {NodeListOf<Element>} nodes - The option elements.
     * @returns {Array} The items.
     */
    _parseItems(nodes) {
        const items = [];
        nodes.forEach((elem) => {
            const label = elem.dataset.label || elem.textContent.trim();
            items.push({
                id: elem.getAttribute("id") || null,
                label: label,
                color: elem.dataset.color || elem.dataset.labelColor || null,
                icon: elem.dataset.icon || null,
                image: elem.dataset.image || null,
                content: elem.innerHTML || label,
                disabled: elem.hasAttribute("disabled")
            });
        });
        return items;
    }

    /**
     * Reads a positive count from a dataset entry.
     * @param {string|undefined} raw - The raw attribute value.
     * @returns {number} The count, or -1 when unset or not a positive number.
     */
    _readCount(raw) {
        const parsed = parseInt(raw, 10);
        return Number.isNaN(parsed) || parsed <= 0 ? -1 : parsed;
    }

    /**
     * Creates the field the whole expression is submitted in. The groups carry
     * unnamed fields of their own, so only this one reaches the form data.
     * @param {string} id - The id of the control.
     * @param {string} name - The name of the form field.
     * @returns {HTMLInputElement} The hidden input.
     */
    _createHiddenInput(id, name) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        if (id) {
            hidden.id = id;
        }
        hidden.name = name || "";
        return hidden;
    }

    /**
     * Creates the button that adds a further conjunction.
     * @returns {HTMLElement} The button wrapper.
     */
    _createAddButton() {
        const wrapper = document.createElement("div");
        wrapper.className = "wx-dnf-actions";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "wx-dnf-add";

        const icon = document.createElement("i");
        icon.className = this._iconClass("plus");
        button.appendChild(icon);

        const label = document.createElement("span");
        label.textContent = this._i18n("webexpress.webui:dnf.add", "Add expression");
        button.appendChild(label);

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.addGroup();
        });

        this._addButtonElement = button;
        wrapper.appendChild(button);

        return wrapper;
    }

    /**
     * Builds one conjunction and appends it to the list.
     * @param {Array<string>} terms - The term ids of the conjunction.
     * @returns {object} The group record.
     */
    _appendGroup(terms) {
        const container = document.createElement("div");
        container.className = "wx-dnf-group";

        const editor = document.createElement("div");
        // the selection reads its configuration off the host, so it has to carry
        // the attributes before the control is constructed on it
        editor.dataset.multiselection = "true";
        editor.setAttribute("placeholder", this._placeholder);

        container.appendChild(editor);
        // the group is attached before its control is built, because a selection
        // that resolves its position or queries an endpoint on construction has to
        // find itself in the document
        this._list.appendChild(container);

        const ctrl = this._createGroupControl(editor);
        editor._wx_controller = ctrl;
        ctrl.options = this._items;
        ctrl.value = terms || [];
        editor.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, this._changeHandler);

        const group = { container, editor, ctrl };
        group.badge = this._createBadge(container);
        group.close = this._createCloseButton(container, group);

        this._groups.push(group);
        this._updateSeparators();
        this._updateBadge(group);

        if (this._disabled) {
            container.classList.add("wx-disabled");
        }

        return group;
    }

    /**
     * Builds the picker of one conjunction.
     *
     * This is the seam a REST backed variant replaces: the structure of the
     * expression, the operators and the group handling are the same whether the
     * terms are declared in the markup or queried from an endpoint, and only the
     * picker differs. It is called from the constructor, so an override may not
     * rely on its own class fields, which are initialized later - the state it
     * needs has to be reachable through the host element.
     *
     * @param {HTMLElement} editor - The host element of the picker.
     * @returns {object} The selection control of the group.
     */
    _createGroupControl(editor) {
        return new webexpress.webui.InputSelectionCtrl(editor);
    }

    /**
     * Creates the AND marker of a conjunction. It is shown only while the group
     * actually holds more than one term, so the marker states a fact about the
     * current expression instead of decorating every group with an operator it
     * does not use.
     * @param {HTMLElement} container - The group element.
     * @returns {HTMLElement} The badge element.
     */
    _createBadge(container) {
        const badge = document.createElement("span");
        badge.className = "wx-dnf-badge";
        badge.textContent = this._and;
        badge.hidden = true;
        container.appendChild(badge);
        return badge;
    }

    /**
     * Creates the close icon of a conjunction. On the first group it resets the
     * selection, on every further group it removes the group.
     * @param {HTMLElement} container - The group element.
     * @param {object} group - The group record.
     * @returns {HTMLElement} The close element.
     */
    _createCloseButton(container, group) {
        const close = document.createElement("a");
        close.className = this._iconClass("xmark");
        close.href = "javascript:void(0);";
        close.setAttribute("role", "button");

        close.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const index = this._groups.indexOf(group);
            if (index <= 0) {
                this.clearGroup(0);
            } else {
                this.removeGroup(index);
            }
        });

        container.appendChild(close);
        return close;
    }

    /**
     * Rebuilds the OR words between the conjunctions. They are separate nodes in
     * the list rather than decorations of a group, so the reading order of the
     * expression survives a group being added or removed anywhere.
     */
    _updateSeparators() {
        Array.from(this._list.children)
            .filter((child) => child.classList.contains("wx-dnf-separator"))
            .forEach((child) => this._list.removeChild(child));

        this._groups.forEach((group, index) => {
            // the close icon does two different things depending on the position,
            // so it has to say which one; the first group is the expression itself
            // and can only be emptied
            group.close.title = index === 0
                ? this._i18n("webexpress.webui:dnf.clear", "Clear expression")
                : this._i18n("webexpress.webui:dnf.remove", "Remove expression");
            group.close.setAttribute("aria-label", group.close.title);

            if (index === 0) {
                return;
            }
            const separator = document.createElement("div");
            separator.className = "wx-dnf-separator";
            separator.textContent = this._or;
            this._list.insertBefore(separator, group.container);
        });
    }

    /**
     * Shows or hides the AND marker of a group according to its current size.
     * @param {object} group - The group record.
     */
    _updateBadge(group) {
        const terms = group.ctrl.value || [];
        group.badge.hidden = terms.length < 2;
        group.container.classList.toggle("wx-dnf-conjunction", terms.length > 1);
    }

    /**
     * Enables or disables the add button according to the configured limit.
     */
    _updateAddButton() {
        const reached = this._maxGroups > 0 && this._groups.length >= this._maxGroups;
        this._addButtonElement.disabled = reached || this._disabled;
        this._addButton.hidden = this._disabled;
    }

    /**
     * Writes the current expression into the hidden field.
     */
    _updateHidden() {
        this._hidden.value = webexpress.webui.DnfValue.format(this.value);
    }

    /**
     * Adopts a change of any group: refreshes the markers, the submitted value
     * and announces the new expression.
     */
    _syncValue() {
        if (this._suspended > 0) {
            return;
        }

        this._groups.forEach((group) => this._updateBadge(group));
        this._updateHidden();
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this.value });
    }

    /**
     * Adds a further conjunction to the expression.
     * @param {Array<string>} [terms] - The initial terms of the new conjunction.
     * @returns {boolean} True when the group was added.
     */
    addGroup(terms) {
        if (this._maxGroups > 0 && this._groups.length >= this._maxGroups) {
            return false;
        }

        const group = this._batch(() => this._appendGroup(terms || []));
        this._updateAddButton();
        this._updateHidden();

        this._dispatch(webexpress.webui.Event.ADD_EVENT, {
            index: this._groups.indexOf(group),
            value: this.value
        });

        return true;
    }

    /**
     * Removes a conjunction. The first group is the expression itself and is
     * emptied instead, so the control never ends up without a group to edit.
     * @param {number} index - The index of the group.
     * @returns {boolean} True when the group was removed.
     */
    removeGroup(index) {
        if (index <= 0 || index >= this._groups.length) {
            return false;
        }

        const [group] = this._groups.splice(index, 1);
        this._releaseGroup(group);

        this._updateSeparators();
        this._updateAddButton();
        this._updateHidden();

        this._dispatch(webexpress.webui.Event.REMOVE_EVENT, { index: index, value: this.value });
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this.value });

        return true;
    }

    /**
     * Empties a conjunction without removing it.
     * @param {number} index - The index of the group.
     */
    clearGroup(index) {
        const group = this._groups[index];
        if (!group) {
            return;
        }

        this._batch(() => { group.ctrl.value = []; });
        this._syncValue();
    }

    /**
     * Returns the options every group selects from.
     * @returns {Array} The items.
     */
    get options() {
        return this._items;
    }

    /**
     * Replaces the options of every group. The selected terms survive where the
     * new options still carry them, which is what a REST backed refresh of the
     * option list needs.
     * @param {Array} items - The new items.
     */
    set options(items) {
        this._items = Array.isArray(items) ? items : [];

        this._batch(() => this._groups.forEach((group) => {
            const terms = group.ctrl.value;
            group.ctrl.options = this._items;
            group.ctrl.value = terms;
        }));

        this._updateHidden();
    }

    /**
     * Returns the maximum number of conjunctions, or -1 when unlimited.
     * @returns {number} The limit.
     */
    get maxGroups() {
        return this._maxGroups;
    }

    /**
     * Sets the maximum number of conjunctions.
     * @param {number} limit - The limit, or -1 for unlimited.
     */
    set maxGroups(limit) {
        this._maxGroups = this._readCount(limit);
        this._updateAddButton();
    }

    /**
     * Returns the number of conjunctions currently shown.
     * @returns {number} The group count.
     */
    get groupCount() {
        return this._groups.length;
    }

    /**
     * Returns the expression.
     * @returns {Array<Array<string>>} The groups, empty groups dropped.
     */
    get value() {
        return webexpress.webui.DnfValue.parse(this._groups.map((group) => group.ctrl.value || []));
    }

    /**
     * Sets the expression.
     *
     * An expression of the same size is written into the groups that already
     * exist rather than into freshly built ones, so a re-assignment of the same
     * shape - what the smart edit does when an edit is cancelled - leaves the
     * open dropdowns and the scroll position of the groups alone.
     *
     * @param {string|Array|null} value - The new expression.
     */
    set value(value) {
        const groups = webexpress.webui.DnfValue.parse(value);
        const target = groups.length > 0 ? groups : [[]];

        if (webexpress.webui.DnfValue.equals(this.value, groups) && this._groups.length === target.length) {
            return;
        }

        this._batch(() => {
            while (this._groups.length > target.length) {
                this._releaseGroup(this._groups.pop());
            }

            target.forEach((terms, index) => {
                if (index < this._groups.length) {
                    this._groups[index].ctrl.value = terms;
                } else {
                    this._appendGroup(terms);
                }
            });
        });

        this._groups.forEach((group) => this._updateBadge(group));
        this._updateSeparators();
        this._updateAddButton();
        this._updateHidden();

        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this.value });
    }

    /**
     * Releases the group controls. They were constructed by this control rather
     * than by the controller, so the controller's teardown does not reach them.
     */
    destroy() {
        this._groups.forEach((group) => this._releaseGroup(group));
        this._groups = [];
    }

    /**
     * Detaches a group from the control: its listener, its selection control and
     * its markup. The selection was constructed here rather than by the
     * controller, so the controller's teardown does not reach it.
     * @param {object} group - The group record.
     */
    _releaseGroup(group) {
        group.editor.removeEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, this._changeHandler);
        group.ctrl.destroy?.();

        if (group.container.parentNode) {
            group.container.parentNode.removeChild(group.container);
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-dnf", webexpress.webui.InputDnfCtrl);
