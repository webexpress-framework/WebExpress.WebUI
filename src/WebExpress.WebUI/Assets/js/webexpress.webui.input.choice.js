/**
 * A form field offering a small, fixed set of mutually exclusive options as a row
 * of buttons. The selected option value is stored in a hidden input.
 * The visible options can be narrowed to the value of another input, which lets a
 * single control carry the options of every context and show only the relevant ones.
 * Triggers:
 *  - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.InputChoiceCtrl = class extends webexpress.webui.Ctrl {
    _options = [];
    _value = null;
    _hidden = null;
    _list = null;
    _disabled = false;
    _required = false;
    _filterSource = null;
    _filterValue = null;

    /**
     * Constructs the choice input field.
     * @param {HTMLElement} element - The root element of the control.
     */
    constructor(element) {
        super(element);

        const id = element.getAttribute("id");
        const name = element.getAttribute("name") || element.id;

        this._disabled = element.dataset.disabled === "true";
        this._required = element.dataset.required === "true";
        this._filterSource = element.dataset.filterSource || null;

        this._options = this._parseOptions(element.querySelectorAll(".wx-choice-option"));

        const value = element.dataset.value || null;

        this._hidden = document.createElement("input");
        this._hidden.setAttribute("type", "hidden");
        if (id) {
            this._hidden.setAttribute("id", id);
        }
        if (name) {
            this._hidden.setAttribute("name", name);
        }
        if (this._required) {
            this._hidden.dataset.wxRequired = "true";
        }

        this._list = document.createElement("div");
        this._list.className = "wx-choice-options";
        this._list.setAttribute("role", "radiogroup");

        element.innerHTML = "";
        element.removeAttribute("id");
        element.removeAttribute("name");
        element.removeAttribute("data-value");
        element.classList.add("wx-choice");
        element.appendChild(this._list);

        if (name || id) {
            element.appendChild(this._hidden);
        }

        if (value && this._options.some(o => o.value === value)) {
            this._value = value;
            this._hidden.value = value;
        }

        this._attachFilterSource();
        this.render();
    }

    /**
     * Parses the option markup emitted by the server.
     * @param {NodeList} nodes - The option elements.
     * @returns {Array<Object>} The normalized options.
     */
    _parseOptions(nodes) {
        const options = [];
        nodes.forEach(node => {
            options.push({
                value: node.dataset.value || "",
                text: node.textContent.trim(),
                description: node.dataset.description || null,
                colorCss: node.dataset.colorCss || null,
                colorStyle: node.dataset.colorStyle || null,
                filterValue: node.dataset.filterValue || null
            });
        });
        return options;
    }

    /**
     * Gets the selected value.
     * @returns {string} The selected value, or an empty string.
     */
    get value() {
        return this._value || "";
    }

    /**
     * Sets the selected value. A value no option carries clears the selection, so a
     * preset arriving from elsewhere cannot select an option that is not offered.
     * @param {string} input - The value to select.
     */
    set value(input) {
        const next = (input == null ? "" : String(input));

        if (next === (this._value || "")) {
            return;
        }

        // the filter is re-read rather than trusted: a value arriving from another
        // control is usually written together with the value the options are filtered
        // by, and the control must not depend on which of the two lands first
        this._readFilter();

        const option = this._options.find(o => o.value === next && this._matchesFilter(o));

        this._value = option ? option.value : null;
        this._hidden.value = this._value || "";
        this.render();
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value || "" });
    }

    /**
     * Returns the form the control lives in, or the document when it stands alone.
     * @returns {HTMLElement|Document} The scope bound inputs are looked up in.
     */
    _scope() {
        return this._element.closest("form") || document;
    }

    /**
     * Binds the control to the input its visible options are filtered by. The bound
     * input is usually written programmatically by another control, which raises no
     * native change event, so the bubbling value change event is listened for too.
     */
    _attachFilterSource() {
        if (!this._filterSource) {
            return;
        }

        const scope = this._scope();
        const read = () => {
            if (this._readFilter()) {
                this.render();
            }
        };

        scope.addEventListener("change", read);
        scope.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, read);

        read();
    }

    /**
     * Reads the current value of the input the options are filtered by and drops a
     * selection the new filter no longer offers, so it cannot be submitted unseen.
     * @returns {boolean} True when the filter changed.
     */
    _readFilter() {
        if (!this._filterSource) {
            return false;
        }

        const source = this._scope().querySelector(`[name="${this._filterSource}"]`);
        const ctrl = source ? webexpress.webui.Controller.getClosestInstance(source) : null;
        const next = source
            ? ((ctrl && typeof ctrl.value !== "undefined") ? ctrl.value : source.value) || null
            : null;

        if (next === this._filterValue) {
            return false;
        }

        this._filterValue = next;

        const selected = this._options.find(o => o.value === this._value);
        if (this._value && (!selected || !this._matchesFilter(selected))) {
            this._value = null;
            this._hidden.value = "";
        }

        return true;
    }

    /**
     * Checks an option against the bound filter. An option without a filter value is
     * always shown, so an entry that applies everywhere needs no marking.
     * @param {Object} option - The option to check.
     * @returns {boolean} True when the option passes the filter.
     */
    _matchesFilter(option) {
        if (!this._filterSource || !this._filterValue) {
            return true;
        }
        return !option.filterValue || option.filterValue === this._filterValue;
    }

    /**
     * Rebuilds the option buttons.
     */
    render() {
        this._list.innerHTML = "";

        for (const option of this._options) {
            if (!this._matchesFilter(option)) {
                continue;
            }

            const button = document.createElement("button");
            button.type = "button";
            button.className = "wx-choice-option";
            button.dataset.value = option.value;
            button.setAttribute("role", "radio");
            button.disabled = this._disabled;

            if (option.description) {
                button.title = option.description;
            }

            if (option.colorCss || option.colorStyle) {
                const dot = document.createElement("span");
                dot.className = "wx-choice-option-dot";
                if (option.colorCss) {
                    dot.classList.add(...option.colorCss.split(/\s+/).filter(Boolean));
                }
                if (option.colorStyle) {
                    dot.style.cssText = option.colorStyle;
                }
                button.appendChild(dot);
            }

            button.append(document.createTextNode(option.text));

            const selected = this._value === option.value;
            button.setAttribute("aria-checked", selected ? "true" : "false");
            if (selected) {
                button.classList.add("wx-choice-option-selected");
            }

            button.addEventListener("click", () => {
                this.value = this._value === option.value ? "" : option.value;
            });

            this._list.appendChild(button);
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-choice", webexpress.webui.InputChoiceCtrl);
