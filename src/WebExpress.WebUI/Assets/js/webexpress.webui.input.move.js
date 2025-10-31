/**
 * A selection box to enable options.
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.InputMoveCtrl = class extends webexpress.webui.Ctrl {
    // Internal fields for the lists, buttons, options, state, and drag element
    _selectedList = null;
    _availableList = null;
    _buttonToSelectedAll = null;
    _buttonToSelected = null;
    _buttonToAvailable = null;
    _buttonToAvailableAll = null;
    _hidden = null;
    _options = [];
    _values = [];
    _selectedoptions = new Map(); // Key=Ctrl, Value=options
    _availableoptions = new Map(); // Key=Ctrl, Value=options
    _draggingElement = null;

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the move control.
     */
    constructor(element) {
        super(element);

        // Initialize the lists and all control buttons
        this._selectedList = this._createList();
        this._availableList = this._createList();
        this._buttonToSelectedAll = this._createButton('btn-primary', '<<');
        this._buttonToSelected = this._createButton('btn-primary', '<');
        this._buttonToAvailable = this._createButton('btn-primary', '>');
        this._buttonToAvailableAll = this._createButton('btn-primary', '>>');
        this._hidden = this._createHiddenInput();

        // Read all relevant data attributes for labels and state
        const name = element.getAttribute("name") || element.id;
        const selectedHeaderLabel = element.dataset.headerSelected || this._i18n("webexpress.webui:selected", "");
        const availableHeaderLabel = element.dataset.headerAvailable || this._i18n("webexpress.webui:available", "");
        const selectedAllButtonLabel = element.dataset.buttonSelectall || "<<";
        const selectedButtonLabel = element.dataset.buttonSelected || "<";
        const availableButtonLabel = element.dataset.buttonAvailable || ">";
        const availableAllButtonLabel = element.dataset.buttonAvailableall || ">>";
        const value = element.dataset.value || null;

        // Parse all option elements as internal option objects
        this._options = this._parseOptions(element.querySelectorAll(".wx-webui-move-option"));

        // Create the containers for both list panels and the button panel
        const selectedContainer = this._createDiv('wx-move-list');
        const selectedHeader = this._createHeader(selectedHeaderLabel);
        const availableContainer = this._createDiv('wx-move-list');
        const availableHeader = this._createHeader(availableHeaderLabel);
        const buttonContainer = this._createDiv('wx-move-button');

        // Clean up the DOM and remove all data attributes
        element.innerHTML = '';
        element.removeAttribute("name");
        element.removeAttribute("data-value");
        element.removeAttribute("data-header-selected");
        element.removeAttribute("data-header-available");
        element.removeAttribute("data-button-selectall");
        element.removeAttribute("data-button-selected");
        element.removeAttribute("data-button-available");
        element.removeAttribute("data-button-availableall");

        // Set hidden input name if available
        if (name) {
            this._hidden.name = name;
        }

        // Set the button labels
        this._buttonToSelectedAll.textContent = selectedAllButtonLabel;
        this._buttonToSelected.textContent = selectedButtonLabel;
        this._buttonToAvailable.textContent = availableButtonLabel;
        this._buttonToAvailableAll.textContent = availableAllButtonLabel;

        // Assemble the list and button containers
        selectedContainer.appendChild(selectedHeader);
        selectedContainer.appendChild(this._selectedList);
        availableContainer.appendChild(availableHeader);
        availableContainer.appendChild(this._availableList);
        buttonContainer.appendChild(this._buttonToSelectedAll);
        buttonContainer.appendChild(this._buttonToSelected);
        buttonContainer.appendChild(this._buttonToAvailable);
        buttonContainer.appendChild(this._buttonToAvailableAll);

        // Add drag & drop event handlers for both list containers
        this._addDragDropEvents(selectedContainer, this._selectedList, () => this.moveToSelected());
        this._addDragDropEvents(availableContainer, this._availableList, () => this.moveToAvailable());

        // Add click event handlers for all control buttons
        this._buttonToSelectedAll.addEventListener('click', () => this.moveToSelectedAll());
        this._buttonToSelected.addEventListener('click', () => this.moveToSelected());
        this._buttonToAvailableAll.addEventListener('click', () => this.moveToAvailableAll());
        this._buttonToAvailable.addEventListener('click', () => this.moveToAvailable());

        // Add all panels to the DOM and initialize state
        element.appendChild(selectedContainer);
        element.appendChild(buttonContainer);
        element.appendChild(availableContainer);
        element.classList.add("wx-move");
        if (name) element.appendChild(this._hidden);
        if (value) this.value = String(value).split(";");

        // Render the UI for the first time
        this.render();
    }

    /**
     * Creates and returns an empty UL list element with proper CSS classes.
     * @returns {HTMLUListElement}
     */
    _createList() {
        const ul = document.createElement('ul');
        ul.className = 'list-group list-group-flush';
        return ul;
    }

    /**
     * Creates and returns a button with the given Bootstrap classes and label.
     * @param {string} btnClass - The Bootstrap button class.
     * @param {string} label - The button label.
     * @returns {HTMLButtonElement}
     */
    _createButton(btnClass, label) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn ${btnClass} btn-block`;
        btn.textContent = label;
        return btn;
    }

    /**
     * Creates and returns a hidden input element.
     * @returns {HTMLInputElement}
     */
    _createHiddenInput() {
        const input = document.createElement('input');
        input.type = 'hidden';
        return input;
    }

    /**
     * Creates and returns a DIV element with the given class names.
     * @param {string} classes - Space-separated CSS classes.
     * @returns {HTMLDivElement}
     */
    _createDiv(classes) {
        const div = document.createElement('div');
        div.className = classes;
        return div;
    }

    /**
     * Creates and returns a span for the panel header.
     * @param {string} label - The header label text.
     * @returns {HTMLSpanElement}
     */
    _createHeader(label) {
        const span = document.createElement('span');
        span.className = 'text-muted';
        span.textContent = label;
        return span;
    }

    /**
     * Parses the options from the given NodeList into an array of option objects.
     * @param {NodeList} optionNodes - The option elements.
     * @returns {Array} Array of parsed option objects.
     */
    _parseOptions(optionNodes) {
        const options = [];
        optionNodes.forEach(div => {
            options.push({
                id: div.id,
                label: div.textContent.trim(),
                image: div.dataset.image || null,
                icon: div.dataset.icon || null,
            });
        });
        return options;
    }

    /**
     * Adds drag and drop event handlers to a container and associated list.
     * @param {HTMLElement} container - The container element.
     * @param {HTMLElement} list - The list element (UL).
     * @param {Function} onDropHandler - The handler to invoke on drop.
     */
    _addDragDropEvents(container, list, onDropHandler) {
        // Highlight list on drag enter/over
        container.addEventListener('dragenter', event => {
            event.preventDefault();
            list.classList.add('wx-drag-over');
        });
        container.addEventListener('dragover', event => {
            event.preventDefault();
            list.classList.add('wx-drag-over');
        });
        // Remove highlight and dragging class on drag end/leave/drop
        container.addEventListener('dragend', () => {
            if (this._draggingElement) this._draggingElement.classList.remove("wx-dragging", "wx-drag-over");
        });
        container.addEventListener('dragleave', () => list.classList.remove('wx-drag-over'));
        container.addEventListener('drop', event => {
            list.classList.remove('wx-drag-over');
            onDropHandler();
            event.preventDefault();
        });
    }

    /**
     * Move all entries to the left (selected).
     * This will select all options.
     */
    moveToSelectedAll() {
        this.value = this._options.map(opt => opt.id);
        this.render();
    }

    /**
     * Moves selected entries from available to selected.
     * Only the currently selected items in the available list are moved.
     */
    moveToSelected() {
        // Collect all selected IDs from available options and update the value
        const selectedIds = [...this._availableoptions.values()]
            .filter(option => option !== null)
            .map(option => option.id);
        this.value = this._values.concat(selectedIds);
        this.render();
    }

    /**
     * Move all entries to the right (available).
     * This will deselect all entries.
     */
    moveToAvailableAll() {
        this.value = [];
        this.render();
    }

    /**
     * Moves selected entries from selected to available.
     * Only the currently selected items in the selected list are moved.
     */
    moveToAvailable() {
        const selectedIds = [...this._selectedoptions.values()]
            .filter(option => option !== null)
            .map(option => option.id);

        this.value = this._values.filter(value => !selectedIds.includes(value));
        this.render();
    }

    /**
     * Renders the control: updates lists, options, buttons, and selection state.
     */
    render() {
        const values = this._values != null ? this._values : [];
        // Compute which options are selected and which are available
        const comparison = (a, b) => a === b.id;
        const relativeComplement = this._options.filter(b => values.every(a => !comparison(a, b)));
        const intersection = this._options.filter(b => values.includes(b.id));

        // Clear the lists and state maps
        this._selectedList.innerHTML = '';
        this._availableList.innerHTML = '';
        this._selectedoptions.clear();
        this._availableoptions.clear();

        /**
         * Updates the visual selection status of all list elements and buttons.
         */
        const updateselection = () => {
            this._selectedoptions.forEach((value, key) => {
                if (value != null) {
                    key.classList.add("bg-primary");
                    key.childNodes.forEach(cn => cn.classList && cn.classList.add("text-white"));
                } else {
                    key.classList.remove("bg-primary");
                    key.childNodes.forEach(cn => cn.classList && cn.classList.remove("text-white"));
                }
            });
            this._availableoptions.forEach((value, key) => {
                if (value != null) {
                    key.classList.add("bg-primary");
                    key.childNodes.forEach(cn => cn.classList && cn.classList.add("text-white"));
                } else {
                    key.classList.remove("bg-primary");
                    key.childNodes.forEach(cn => cn.classList && cn.classList.remove("text-white"));
                }
            });
            // Enable or disable the arrow buttons depending on selection
            this._buttonToSelected.disabled = ![...this._availableoptions.values()].some(elem => elem != null);
            this._buttonToSelected.classList.toggle("disabled", this._buttonToSelected.disabled);
            this._buttonToAvailable.disabled = ![...this._selectedoptions.values()].some(elem => elem != null);
            this._buttonToAvailable.classList.toggle("disabled", this._buttonToAvailable.disabled);
        };

        // Render all selected options in the left list
        intersection.forEach(currentValue => {
            const li = this._createListItem(currentValue);
            this._selectedoptions.set(li, null);

            // Click handler for selection (with or without Ctrl)
            li.addEventListener('click', event => {
                if (event.ctrlKey) {
                    if (![...this._selectedoptions.values()].some(elem => elem === currentValue)) {
                        this._selectedoptions.set(li, currentValue);
                    } else {
                        this._selectedoptions.set(li, null);
                    }
                    this._availableoptions.forEach((_, key) => this._availableoptions.set(key, null));
                } else {
                    this._selectedoptions.forEach((_, key) => this._selectedoptions.set(key, null));
                    this._selectedoptions.set(li, currentValue);
                    this._availableoptions.forEach((_, key) => this._availableoptions.set(key, null));
                }
                updateselection();
                // Trigger event for external listeners
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: currentValue });
            });
            // Double click handler: move to available
            li.addEventListener('dblclick', () => {
                this._selectedoptions.forEach((_, key) => this._selectedoptions.set(key, null));
                this._selectedoptions.set(li, currentValue);
                this._availableoptions.forEach((_, key) => this._availableoptions.set(key, null));
                this.moveToAvailable();
            });
            // Space key handler for selection
            li.addEventListener('keyup', event => {
                if (event.keyCode === 32) {
                    if (![...this._selectedoptions.keys()].some(el => el === currentValue)) {
                        this._selectedoptions.set(li, currentValue);
                    } else {
                        this._selectedoptions.set(li, null);
                    }
                    this._availableoptions.forEach((_, key) => this._availableoptions.set(key, null));
                    updateselection();
                }
            });
            // Drag start handler
            li.addEventListener('dragstart', () => {
                this._selectedoptions.forEach((_, key) => this._selectedoptions.set(key, null));
                this._selectedoptions.set(li, currentValue);
                this._availableoptions.forEach((_, key) => this._availableoptions.set(key, null));
                updateselection();
                li.classList.add("wx-dragging");
                this._draggingElement = li;
            });

            this._selectedList.appendChild(li);
        });

        // Render all available options in the right list
        relativeComplement.forEach(currentValue => {
            const li = this._createListItem(currentValue);
            this._availableoptions.set(li, null);

            // Click handler for selection (with or without Ctrl)
            li.addEventListener('click', event => {
                if (event.ctrlKey) {
                    if (![...this._availableoptions.values()].some(elem => elem === currentValue)) {
                        this._availableoptions.set(li, currentValue);
                    } else {
                        this._availableoptions.set(li, null);
                    }
                    this._selectedoptions.forEach((_, key) => this._selectedoptions.set(key, null));
                } else {
                    this._selectedoptions.forEach((_, key) => this._selectedoptions.set(key, null));
                    this._availableoptions.forEach((_, key) => this._availableoptions.set(key, null));
                    this._availableoptions.set(li, currentValue);
                }
                updateselection();
                // Trigger event for external listeners
                this._dispatch(webexpress.webui.Event.CLICK_EVENT, { item: currentValue });
            });
            // Double click handler: move to selected
            li.addEventListener('dblclick', () => {
                this._selectedoptions.forEach((_, key) => this._selectedoptions.set(key, null));
                this._availableoptions.forEach((_, key) => this._availableoptions.set(key, null));
                this._availableoptions.set(li, currentValue);
                this.moveToSelected();
            });
            // Space key handler for selection
            li.addEventListener('keyup', event => {
                if (event.keyCode === 32) {
                    if (![...this._availableoptions.keys()].some(el => el === currentValue)) {
                        this._availableoptions.set(li, currentValue);
                    } else {
                        this._availableoptions.set(li, null);
                    }
                    this._selectedoptions.forEach((_, key) => this._selectedoptions.set(key, null));
                    updateselection();
                }
            });
            // Drag start handler
            li.addEventListener('dragstart', () => {
                this._selectedoptions.forEach((_, key) => this._selectedoptions.set(key, null));
                this._availableoptions.forEach((_, key) => this._availableoptions.set(key, null));
                this._availableoptions.set(li, currentValue);
                updateselection();
                li.classList.add("wx-dragging");
                this._draggingElement = li;
            });

            this._availableList.appendChild(li);
        });

        // Enable or disable buttons for "select all" and "deselect all"
        this._buttonToSelectedAll.disabled = relativeComplement.length === 0;
        this._buttonToSelectedAll.classList.toggle("disabled", this._buttonToSelectedAll.disabled);
        this._buttonToAvailableAll.disabled = values.length === 0;
        this._buttonToAvailableAll.classList.toggle("disabled", this._buttonToAvailableAll.disabled);

        // Update selection visuals and button states
        updateselection();
    }

    /**
     * Creates a list item (li) for a given option, including icon/image if present.
     * @param {Object} currentValue - The option object.
     * @returns {HTMLLIElement}
     */
    _createListItem(currentValue) {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.setAttribute('draggable', 'true');
        // Add icon if specified
        if (currentValue.icon) {
            const icon = document.createElement('i');
            icon.className = `text-primary ${currentValue.icon}`;
            icon.setAttribute('draggable', 'false');
            li.appendChild(icon);
        }
        // Add image if specified
        if (currentValue.image) {
            const img = document.createElement('img');
            img.className = "wx-icon";
            img.setAttribute('src', currentValue.image);
            img.setAttribute('title', '');
            img.setAttribute('draggable', 'false');
            li.appendChild(img);
        }
        // Add label as link
        const a = document.createElement('a');
        a.className = 'wx-link';
        a.setAttribute('href', 'javascript:void(0)');
        a.setAttribute('draggable', 'false');
        a.textContent = currentValue.label;
        li.appendChild(a);
        return li;
    }

    /**
     * Returns all options.
     */
    get options() {
        return this._options;
    }

    /**
     * Sets the options.
     * @param options An array of options { id, label, icon, image }.
     */
    set options(options) {
        this._options = options;
        this.render();
    }

    /**
     * Returns the selected options.
     */
    get value() {
        return this._values;
    }

    /**
     * Sets the selected options.
     * Accepts:
     * - Array of ids
     * - Single id string
     * - Semicolon separated string of ids "a;b;c"
     * - Null/undefined to clear
     * Invalid ids (not present in options) are ignored, duplicates are removed (first occurrence kept).
     * @param {Array|string|null|undefined} values - The new selection value(s).
     */
    set value(values) {
        // normalize input to array of strings
        let normalized = [];
        if (values == null) {
            normalized = [];
        } else if (Array.isArray(values)) {
            normalized = values;
        } else if (typeof values === 'string') {
            const trimmed = values.trim();
            if (trimmed.length > 0) {
                normalized = trimmed.includes(';')
                    ? trimmed.split(';').map(v => v.trim())
                    : [trimmed];
            }
        } else {
            normalized = [];
        }

        // trim and filter empty
        normalized = normalized
            .map(v => (v == null ? '' : String(v).trim()))
            .filter(v => v.length > 0);

        // restrict to available option ids
        const optionIds = new Set(this._options.map(o => o.id));
        normalized = normalized.filter(id => optionIds.has(id));

        // remove duplicates preserving order
        const seen = new Set();
        normalized = normalized.filter(id => {
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });

        // serialize for change detection
        const oldSerialized = (this._values || []).join(';');
        const newSerialized = normalized.join(';');

        if (oldSerialized !== newSerialized) {
            this._values = normalized;
            if (this._hidden) this._hidden.value = newSerialized;
            this.render();
            // fire change event for external listeners
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: [...this._values] });
        }
    }
}

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-move", webexpress.webui.InputMoveCtrl);