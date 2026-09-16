/**
 * A selection box extending the base Control class.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_FILTER_EVENT
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT
 */
webexpress.webui.InputSelectionCtrl = class extends webexpress.webui.MenuCtrl {
    _values = [];
    _items = [];
    _filterInput = null;
    _optionfilter = null;
    _multiselect = false;
    _stickySelection = false;
    _placeholder = "";
    _dependsOn = null;
    _dependencyValue = null;
    _dependencyRoot = null;
    _dependencyListener = null;

    /**
     * Constructor for initializing the selection control.
     * @param {HTMLElement} element - The DOM element for the selection control.
     */
    constructor(element) {
        super(element);

        // initialize properties from attributes and dataset
        const id = element.getAttribute("id");
        const name = element.getAttribute("name");
        const value = element.dataset.value || null;
        this._placeholder = element.getAttribute("placeholder") || this._i18n("webexpress.webui:selection.placeholder", "Select an option");
        this._multiselect = element.dataset.multiselection === "true";
        this._stickySelection = element.dataset.stickySelection === "true";
        this._dependsOn = element.dataset.dependsOn || null;
        this._values = [];
        this._items = [];
        // default filter logic
        this._optionfilter = (label, filterText) => {
            return label && label.toLowerCase().includes(filterText.toLowerCase());
        };

        // create and append ui components
        const hiddenInput = this._createHiddenInput(id, name);
        const dropdown = this._createDropdown();
        const dropdownMenu = this._createDropdownMenu();

        // parse options and structural items from child elements
        this._parseItemsFromElements(
            element.querySelectorAll(
                ".wx-selection-header, .wx-selection-divider, .wx-selection-item, .wx-selection-footer"
            )
        );

        if (value) {
            this.value = String(value).split(";");
        }

        // clean up the element before adding new structure
        element.removeAttribute("id");
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-multiselection");
        element.removeAttribute("data-sticky-selection");
        element.removeAttribute("data-depends-on");
        element.innerHTML = "";
        element.classList.add("wx-selection");
        element.appendChild(hiddenInput);
        element.appendChild(dropdown);
        element.appendChild(dropdownMenu);

        // attach native popover behavior for the dropdown menu
        this._initializeMenu(dropdown, dropdownMenu, dropdown.querySelector("button"));
        dropdownMenu.addEventListener("toggle", (event) => {
            if (event.newState === "open") { this._filterInput.focus({ preventScroll: true }); }
        });

        // follow the field this selection depends on, if it names one. this has to happen
        // after the value was applied: the initial value may itself be one the dependency
        // no longer offers, and the reconciliation is what notices
        this._observeDependency();
        this._reconcileDependency(true);

        this.render();
    }

    /**
     * Creates a hidden input for form submission.
     * @param {string} id - The id attribute for the hidden input.
     * @param {string} name - The name attribute for the hidden input.
     * @returns {HTMLInputElement} The hidden input element.
     */
    _createHiddenInput(id, name) {
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        if (id) {
            hiddenInput.id = id;
        }
        hiddenInput.name = name || "";
        this._hidden = hiddenInput;
        return hiddenInput;
    }

    /**
     * Creates the dropdown clickable area (visible selection field).
     * @returns {HTMLDivElement} The dropdown element.
     */
    _createDropdown() {
        const dropdown = document.createElement("div");
        dropdown.classList.add("form-control");

        const selection = document.createElement("ul");
        // a list this control built lays out its own entries, so it declares the
        // role it already has: the prose list indent of .wx-content applies only
        // to lists that leave their role implicit
        selection.setAttribute("role", "list");

        const expandIcon = document.createElement("button");
        expandIcon.type = "button";
        expandIcon.setAttribute("aria-label", this._placeholder);
        expandIcon.className = "wx-selection-trigger";
        const drawing = document.createElement("i");
        drawing.className = this._iconClass("angle-down");
        expandIcon.appendChild(drawing);

        dropdown.appendChild(selection);
        dropdown.appendChild(expandIcon);
        this._selection = selection;

        return dropdown;
    }

    /**
     * Creates the dropdown menu container.
     * @returns {HTMLDivElement} The dropdown menu element.
     */
    _createDropdownMenu() {
        const dropdownMenu = document.createElement("div");
        dropdownMenu.classList.add("dropdown-menu");

        const dropdownOptions = document.createElement("ul");
        dropdownOptions.setAttribute("role", "list");
        this._dropdownoptions = dropdownOptions;

        // setup event delegation for options
        this._dropdownoptions.addEventListener("click", (e) => {
            e.stopPropagation();
            const targetItem = e.target.closest("li.dropdown-item");
            if (!targetItem || targetItem.classList.contains("disabled")) {
                return;
            }

            const itemId = targetItem.dataset.id;
            const item = this._items.find((i) => { return i.id == itemId; });

            if (item) {
                if (!this._multiselect) {
                    this.value = [];
                }

                // toggle selection or add unique
                if (!this._values.includes(item.id)) {
                    this.value = [...this.value, item.id];
                }

                // close the dropdown after selection (optional logic for single select)
                if (!this._multiselect) {

                    webexpress.webui.NativeMenu.hide(this._dropdownmenu);
                    this._dropdown.querySelector(".wx-selection-trigger").focus({ preventScroll: true });
                }
            }
        });

        dropdownMenu.appendChild(this._createFilterContainer());
        dropdownMenu.appendChild(dropdownOptions);
        this._dropdownmenu = dropdownMenu;
        return dropdownMenu;
    }

    /**
     * Creates the filter container with input and clear button.
     * @returns {HTMLDivElement} The filter container element.
     */
    _createFilterContainer() {
        const filterContainer = document.createElement("div");
        const filterInput = document.createElement("input");
        filterInput.type = "text";
        filterInput.addEventListener("keydown", event => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") { return; }
            const options = [...this._dropdownoptions.querySelectorAll("button")];
            const option = event.key === "ArrowUp" ? options.at(-1) : options[0];
            if (option) { event.preventDefault(); option.focus({ preventScroll: true }); }
        });
        filterInput.setAttribute("aria-label", this._i18n("webexpress.webui:selection.filter", "Filter"));

        const clearButton = document.createElement("button");
        clearButton.type = "button";
        clearButton.className = "wx-selection-clear";
        const clearIcon = document.createElement("i");
        clearIcon.className = this._iconClass("xmark");
        clearButton.appendChild(clearIcon);
        clearButton.setAttribute("aria-label", this._i18n("webexpress.webui:selection.filter.clear", "Clear Filter"));
        clearButton.style.cursor = "pointer";

        filterContainer.appendChild(filterInput);
        filterContainer.appendChild(clearButton);

        // update filter and re-render on input
        filterInput.addEventListener("input", () => {
            const filter = filterInput.value;
            this._dispatch(webexpress.webui.Event.CHANGE_FILTER_EVENT, { filter: filter });
            this.render();
        });

        // clear filter and re-render when clear button is clicked
        clearButton.addEventListener("click", (e) => {
            e.stopPropagation();
            filterInput.value = "";
            this._dispatch(webexpress.webui.Event.CHANGE_FILTER_EVENT, { filter: "" });
            this.render();
        });

        this._filterInput = filterInput;

        return filterContainer;
    }

    /**
     * Parses options and structural items from child elements in the selection control.
     * @param {NodeListOf<Element>} elements - Elements to parse.
     */
    _parseItemsFromElements(elements) {
        const items = [];
        const value = [...this.value]; // clone current values

        elements.forEach((elem) => {
            if (elem.classList.contains("wx-selection-divider")) {
                items.push({ type: "divider" });
            } else if (elem.classList.contains("wx-selection-header")) {
                items.push({ type: "header", content: elem.innerHTML });
            } else if (elem.classList.contains("wx-selection-footer")) {
                // footer is appended to the dropdown menu directly
                const footer = document.createElement("footer");
                footer.innerHTML = elem.innerHTML;
                this._dropdownmenu.appendChild(footer);
            } else {
                const id = elem.getAttribute("id") || null;
                items.push({
                    id: id,
                    label: elem.dataset.label || elem.textContent,
                    color: elem.dataset.color,
                    icon: elem.dataset.icon,
                    image: elem.dataset.image,
                    content: elem.innerHTML || elem.dataset.label,
                    disabled: elem.hasAttribute("disabled"),
                    // an option without the attribute states no condition and is always
                    // offered; one with it belongs to the listed values of the field this
                    // selection depends on
                    requires: this._parseRequires(elem.dataset.requires)
                });
            }
        });

        // restore values after parsing (in case setter logic needs validation against items)
        this.value = value;
        this._items = items;
    }

    /**
     * Parses the condition of an option into the list of values it belongs to.
     * @param {string} value - The semicolon-separated condition, or undefined.
     * @returns {Array|null} The values, or null when the option states no condition.
     */
    _parseRequires(value) {
        if (!value) {
            return null;
        }

        const values = String(value).split(";").map((v) => {
            return v.trim();
        }).filter((v) => {
            return v.length > 0;
        });

        return values.length > 0 ? values : null;
    }

    /**
     * Determines whether an option is offered under the value currently answered in the
     * field this selection depends on.
     * @param {Object} item - The option to test.
     * @returns {boolean} True when the option is offered.
     */
    _isOffered(item) {
        if (!this._dependsOn || !item || !item.requires) {
            return true;
        }

        // an unanswered field narrows nothing. a form is filled one field at a time - a rest
        // form even fills them one after another from its service - and hiding every
        // conditional option until the other field is answered would be a different control
        if (!this._dependencyValue) {
            return true;
        }

        const dependencyValue = String(this._dependencyValue).toLowerCase();

        return item.requires.some((required) => {
            return String(required).toLowerCase() === dependencyValue;
        });
    }

    /**
     * Reads the value currently answered in the field this selection depends on.
     * @returns {string|null} The value, or null when the field is absent or unanswered.
     */
    _resolveDependencyValue() {
        if (!this._dependsOn) {
            return null;
        }

        const root = this._dependencyRoot || document;
        const name = window.CSS && CSS.escape ? CSS.escape(this._dependsOn) : this._dependsOn;
        const field = root.querySelector(`[name="${name}"]`);

        if (!field) {
            return null;
        }

        // a selection that has already been initialized carries its value on the hidden input
        // it built; one that has not still carries it on its host element, and either may be
        // the state of the field at the moment this is asked
        const raw = field.matches("input, select, textarea")
            ? field.value
            : (field.dataset ? field.dataset.value : null);

        const first = String(raw || "").split(";")[0].trim();

        return first.length > 0 ? first : null;
    }

    /**
     * Subscribes to the changes of the field this selection depends on.
     *
     * The subscription is made on the form rather than on that field, because the field may
     * not exist yet - form items are built in document order and the one depended on may
     * follow this one - and because a value written by a service arrives as a change of a
     * control that replaced the element the field was parsed from. Every change in the form
     * is answered by reading the dependency again, which costs a query and is otherwise
     * silent.
     */
    _observeDependency() {
        if (!this._dependsOn) {
            return;
        }

        this._dependencyRoot = this._element.closest("form") || document;
        this._dependencyListener = () => {
            this._reconcileDependency(false);
        };

        this._dependencyRoot.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, this._dependencyListener);
        this._dependencyRoot.addEventListener("change", this._dependencyListener);
    }

    /**
     * Brings the offered options and the current selection back in line with the field this
     * selection depends on, dropping a value that is no longer offered.
     * @param {boolean} force - True to reconcile even when the depended-on value is unchanged,
     * which is what a change of this control's own value needs.
     */
    _reconcileDependency(force) {
        if (!this._dependsOn) {
            return;
        }

        const resolved = this._resolveDependencyValue();
        const changed = resolved !== this._dependencyValue;

        if (!changed && !force) {
            return;
        }

        this._dependencyValue = resolved;

        // a value this control cannot offer must not be submitted either - the form would be
        // refused for a combination the user was never shown
        const kept = this._values.filter((id) => {
            const item = this._items.find((x) => {
                return x.id === id;
            });

            return !item || this._isOffered(item);
        });

        if (kept.length !== this._values.length) {
            if (kept.length === 0 && !this._multiselect && this._stickySelection) {
                // a sticky selection may not be emptied, so it takes the first option that is
                // still offered rather than being left without one
                const fallback = this._items.find((x) => {
                    return !x.type && !x.disabled && this._isOffered(x);
                });

                this.value = fallback ? [fallback.id] : [];
            } else {
                this.value = kept;
            }

            return;
        }

        if (changed) {
            this.render();
        }
    }

    /**
     * Releases the subscription on the field this selection depends on.
     */
    destroy() {
        if (this._dependencyRoot && this._dependencyListener) {
            this._dependencyRoot.removeEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, this._dependencyListener);
            this._dependencyRoot.removeEventListener("change", this._dependencyListener);
            this._dependencyRoot = null;
            this._dependencyListener = null;
        }

        super.destroy();
    }

    /**
     * Returns the items the menu shows for a filter text: the options that pass it and are not
     * chosen yet, and only the headers and dividers that still structure something.
     *
     * A header stands for the group of options below it and a divider for a boundary between
     * two groups; once the filter or the selection has taken the options of a group away, the
     * header names nothing and the divider separates nothing. Left in, the menu of a narrow
     * filter is a column of captions and rules with a single option somewhere in between.
     * @param {string} filterText - The filter text.
     * @returns {Array<object>} The items in menu order.
     */
    _visibleItems(filterText) {
        const kept = this._items.filter((item) => {
            if (item.type === "divider" || item.type === "header") {
                return true;
            }

            // an option the depended-on field does not offer is left out rather than
            // shown disabled: it is not unavailable for now, it does not belong to what
            // was chosen there, and a list of struck-through impossibilities is noise
            return this._isOffered(item)
                && this._optionfilter(item.label, filterText)
                && !this._values.includes(item.id);
        });

        // a header whose group holds no option any more - the next structural item or the
        // end follows it directly - is dropped
        const withGroups = kept.filter((item, index) => {
            if (item.type !== "header") {
                return true;
            }

            const next = kept[index + 1];

            return next !== undefined && next.type !== "header" && next.type !== "divider";
        });

        // a divider at either end or next to another divider separates nothing
        return withGroups.filter((item, index) => {
            if (item.type !== "divider") {
                return true;
            }

            return index > 0 && index < withGroups.length - 1 && withGroups[index - 1].type !== "divider";
        });
    }

    /**
     * Renders the selection control options and current selection.
     */
    render() {
        // use document fragment for performance
        const fragment = document.createDocumentFragment();
        const filterText = this._filterInput ? this._filterInput.value : "";

        // render each selection item or structural item
        this._visibleItems(filterText).forEach((item) => {
            if (item.type === "divider") {
                const li = document.createElement("li");
                li.className = "dropdown-divider";
                fragment.appendChild(li);
            } else if (item.type === "header") {
                const li = document.createElement("li");
                li.className = "dropdown-header";
                li.innerHTML = item.content;
                fragment.appendChild(li);
            } else {
                const li = document.createElement("li");
                li.className = "dropdown-item";
                // store id for event delegation
                li.dataset.id = item.id;

                if (item.disabled) {
                    li.classList.add("disabled");
                }

                const contentWrapper = document.createElement(item.disabled ? "span" : "button");
                if (!item.disabled) { contentWrapper.type = "button"; }
                if (item.disabled) {
                    contentWrapper.setAttribute("disabled", "disabled");
                }
                contentWrapper.innerHTML = item.content;

                if (item.icon) {
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    contentWrapper.prepend(icon);
                }
                if (item.image) {
                    const img = document.createElement("img");
                    img.className = "wx-icon";
                    img.src = item.image;
                    contentWrapper.prepend(img);
                }
                li.appendChild(contentWrapper);

                fragment.appendChild(li);
            }
        });

        // update dom in one go
        this._dropdownoptions.innerHTML = "";
        this._dropdownoptions.appendChild(fragment);

        // render selected values in the selection field
        this._selection.innerHTML = "";
        this._values.forEach((value) => {
            const item = this._items.find((i) => { return i.id === value; });
            if (item) {
                const li = document.createElement("li");
                if (item.color) {
                    li.className = item.color;
                }

                li.classList.add("wx-chip");
                const span = document.createElement("span");
                const isStickyActive = this._stickySelection && this._values.length > 0;

                if (item.image) {
                    const img = document.createElement("img");
                    img.className = "wx-icon";
                    img.src = item.image;
                    span.appendChild(img);
                }
                if (item.icon) {
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    span.appendChild(icon);
                }
                const labelSpan = document.createElement("span");
                labelSpan.textContent = item.label;
                span.appendChild(labelSpan);

                li.appendChild(span);

                if (!isStickyActive) {
                    const closeButton = document.createElement("a");
                    closeButton.className = this._iconClass("xmark");
                    closeButton.style.cursor = "pointer";
                    closeButton.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.value = this._values.filter((v) => { return v !== value; });
                        this.render();
                    });
                    li.appendChild(closeButton);
                }
                this._selection.appendChild(li);
            }
        });

        // show placeholder if nothing is selected
        if (this._values.length === 0) {
            const span = document.createElement("span");
            span.textContent = this._placeholder;
            this._selection.innerHTML = "";
            this._selection.appendChild(span);
        }

        // update the value of the hidden input
        if (this._hidden) {
            this._hidden.value = this._values.join(";");
        }
    }

    /**
     * Returns the current options array.
     * @returns {Array} The array of options.
     */
    get options() {
        return this._items;
    }

    /**
     * Updates the list of options and triggers rendering.
     * @param {Array} items - Array of new option items.
     */
    set options(items) {
        this._items = items || [];
        this.render();
    }

    /**
     * Gets whether multi-select mode is enabled.
     * @returns {boolean} True if multiple values can be selected.
     */
    get multiSelect() {
        return this._multiselect;
    }

    /**
     * Sets whether multi-select mode is enabled.
     * Adjusts the current value structure if needed.
     * @param {boolean} enabled True to allow multiple selections.
     */
    set multiSelect(enabled) {
        this._multiselect = Boolean(enabled);

        // normalize current values depending on mode
        if (this._multiselect === false) {
            // collapse to a single value if multiple exist
            if (Array.isArray(this._values) && this._values.length > 1) {
                this._values = [this._values[0]];
            }
        }

        this.render(); // optional UI refresh
    }

    /**
     * Gets whether sticky selection mode is enabled.
     * @returns {boolean} True if the selection cannot be cleared once set.
     */
    get stickySelection() {
        return this._stickySelection;
    }

    /**
     * Sets whether sticky selection mode is enabled.
     * When enabled and a value is selected, the selection cannot be cleared
     * through the UI (remove icon or keyboard). The user may still replace
     * the value by selecting another item.
     * @param {boolean} enabled True to enable sticky selection.
     */
    set stickySelection(enabled) {
        this._stickySelection = Boolean(enabled);
        this.render();
    }

    /**
     * Gets the current value(s) of the selection.
     * @returns {Array} The currently selected values.
     */
    get value() {
        return this._values;
    }

    /**
     * Sets the value(s) of the selection and triggers events and rendering.
     * Accepts:
     * - Array of ids
     * - Array of objects with an id property (e.g. [{id: "abc", name: "Item"}])
     * - single id string
     * - semicolon separated string "id1;id2"
     * - null/undefined (clears selection)
     * In single-select mode only the first value is kept.
     * @param {Array|string|null|undefined} values - New selection value(s).
     */
    set value(values) {
        // normalize incoming values
        let normalized = [];
        if (values === null || values === undefined) {
            normalized = [];
        } else if(Array.isArray(values)) {
            if (values.length === 0) {
                normalized = [];
            } else if (typeof values[0] === "string") {
                // array of id strings
                normalized = values.map(v => String(v));
            } else if (typeof values[0] === "object" && values[0].id != null) {
                // array of objects with id
                normalized = values.map(v => String(v.id));
            } else {
                // fallback: unknown structure
                normalized = [];
            }
        } else if (typeof values === "string") {
            const trimmed = values.trim();
            if (trimmed.length > 0) {
                // allow semicolon separated list
                if (trimmed.includes(";")) {
                    normalized = trimmed.split(";").map((v) => { return v.trim(); }).filter((v) => { return v.length > 0; });
                } else {
                    normalized = [trimmed];
                }
            }
        } else {
            normalized = [];
        }

        // enforce uniqueness
        normalized = [...new Set(normalized)];

        // enforce single-select restriction
        if (!this._multiselect && normalized.length > 1) {
            normalized = [normalized[0]];
        }

        const oldSerialized = (this._values || []).join(";");
        const newSerialized = normalized.join(";");

        if (oldSerialized !== newSerialized) {
            this._values = normalized;
            this.render();
            if (this._hidden) {
                this._hidden.value = newSerialized;
            }
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: [...this._values] });

            // a value may also be written from the outside - a rest form filling this field
            // from its service, for example - and the order in which the fields of one form
            // are filled is not the order the dependency between them runs in. so the value
            // is checked against the dependency here as well, not only when the depended-on
            // field changes. the recursion this can start ends at once: the check drops what
            // is not offered, and the value it writes back has nothing left to drop
            this._reconcileDependency(true);
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-selection", webexpress.webui.InputSelectionCtrl);