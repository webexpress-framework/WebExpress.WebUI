/**
 * A selection box to enable options.
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.MoveCtrl = class extends webexpress.webui.Ctrl {
    _selectedList = $("<ul class='list-group list-group-flush'/>");
    _availableList = $("<ul class='list-group list-group-flush'/>");
    _buttonToSelectedAll = $("<button class='btn btn-primary btn-block' type='button'/>");
    _buttonToSelected = $("<button class='btn btn-primary btn-block' type='button'/>");
    _buttonToAvailable = $("<button class='btn btn-primary btn-block' type='button'/>");
    _buttonToAvailableAll = $("<button class='btn btn-primary btn-block' type='button'/>");
    _hidden = $("<input type='hidden'/>");
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

        // Initialize structure and parse existing data
        const name = $(element).attr("name") || $(element).attr("id");
        const selectedHeaderLabel = $(element).data("header-selected") || "Selected";
        const availableHeaderLabel = $(element).data("header-available") || "Available";
        const selectedAllButtonLabel = $(element).data("button-selectall") || "<<";
        const selectedButtonLabel = $(element).data("button-selected") || "<";
        const availableButtonLabel = $(element).data("button-available") || ">";
        const availableAllButtonLabel = $(element).data("button-availableall") || ">>";
        const value = $(element).data("value") || null;
        this._options = this._parseOptions($(element).find(".wx-webui-move-option"));
        
        const selectedContainer = $("<div class='wx-move-list'/>");
        const selectedHeader = $("<span class='text-muted'>").text(selectedHeaderLabel);
        const availableContainer = $("<div class='wx-move-list'/>");
        const availableHeader = $("<span class='text-muted'>").text(availableHeaderLabel);
        const buttonContainer = $("<div class='wx-move-button d-grid gap-2'/>");
        
        // Clean up the DOM
        $(element)
            .empty()
            .removeAttr("name data-value data-header-selected data-header-available")
            .removeAttr("data-button-selectall data-button-selected data-button-available data-button-availableall");
            
        if (name) {
            this._hidden.attr("name", name);
        }
        
        this._buttonToSelectedAll.html(selectedAllButtonLabel);
        this._buttonToSelected.html(selectedButtonLabel);
        this._buttonToAvailable.html(availableButtonLabel);
        this._buttonToAvailableAll.html(availableAllButtonLabel);
        
        selectedContainer.append(selectedHeader);
        selectedContainer.append(this._selectedList);
        availableContainer.append(availableHeader);
        availableContainer.append(this._availableList);
        buttonContainer.append(this._buttonToSelectedAll);
        buttonContainer.append(this._buttonToSelected);
        buttonContainer.append(this._buttonToAvailable);
        buttonContainer.append(this._buttonToAvailableAll);

        // Event listeners for drag and drop functionality
        selectedContainer.on('dragenter', (event) => {
            event.preventDefault();
            this._selectedList.addClass('wx-drag-over');
        });
        
        selectedContainer.on('dragover', (event) => {
            //if (this._draggingElement || this._selectedList.has(this._draggingElement)) {
                // Prevent showing the indicator
            //    return;
            //}
            event.preventDefault();
            this._selectedList.addClass('wx-drag-over');
        });
        
        selectedContainer.on("dragend", () => {
            if (this._draggingElement) {
                this._draggingElement.removeClass("wx-dragging wx-drag-over");
            }
        });
        
        selectedContainer.on('dragleave', () => {
            this._selectedList.removeClass('wx-drag-over');
        });
        
        selectedContainer.on('drop', (event) => {
            this._selectedList.removeClass('wx-drag-over');
            this.moveToSelected();
            event.preventDefault(); 
        });
        
        availableContainer.on('dragenter', (event) => {
            event.preventDefault();
            this._availableList.addClass('wx-drag-over');
        });
        
        availableContainer.on('dragover', (event) => {
            event.preventDefault();
            this._availableList.addClass('wx-drag-over');
        });
        
        availableContainer.on("dragend", () => {
            if (this._draggingElement) {
                this._draggingElement.removeClass("wx-dragging wx-drag-over");
            }
        });
        
        availableContainer.on('dragleave', () => {
            this._availableList.removeClass('wx-drag-over');
        });
        
        availableContainer.on('drop', (event) => {
            this._availableList.removeClass('wx-drag-over');
            this.moveToAvailable();
            event.preventDefault();
        });
        
        this._buttonToSelectedAll.click(() => {    
            this.moveToSelectedAll();
        });

        this._buttonToSelected.click(() => {
            this.moveToSelected();
        });
        
        this._buttonToAvailableAll.click(() => {
            this.moveToAvailableAll();
        });

        this._buttonToAvailable.click(() => {  
            this.moveToAvailable();
        });
        
        $(element).append(selectedContainer, buttonContainer, availableContainer)
            .addClass("wx-move");

        if (name) {
            $(element).append(this._hidden);
        }
        
        if (value) {
            this.value = String(value).split(";");
        }
        
        this.render(); // Render the initial state of the control
    }
    
    /**
     * Parses the options.
     * @param {jQuery} optionsDiv - The <div> element containing the options.
     * @returns {Array} An array of parsed option objects.
     */
    _parseOptions(optionsDiv) {
        const options = [];
        optionsDiv.each((_, div) => {
            const $div = $(div);
            options.push({
                id:  $div.attr("id"),
                label: $div.text().trim(),
                image: $div.data("image") || null,
                icon: $div.data("icon") || null,
            });
        });
        return options;
    }
    
    /**
     * Move all entries to the left (selected).
     */
    moveToSelectedAll() {
        this.value = this._options.map(element => element.id);
        this.render();
    }
    
    /**
     * Moves selected entries to the left (selected).
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
     */
    moveToAvailableAll() {
        this.value = [];
        this.render();
    }

    /**
     * Moves selected entries to the right (available).
     */
    moveToAvailable() {
        const selectedIds = [...this._selectedoptions.values()]
            .filter(option => option !== null)
            .map(option => option.id);

        this.value = this._values.filter(value => !selectedIds.includes(value));
        this.render();
    }
   
    /**
     * Renders the control structure.
     */
    render() {
        const values = this._values != null ? this._values : [];
        const comparison = (a, b) => a === b.id;
        const relativeComplement = this._options.filter(b => values.every(a => !comparison(a, b)));
        const intersection = this._options.filter(b => values.includes(b.id));
        
        this._selectedList.children().remove();
        this._availableList.children().remove();
        this._selectedoptions.clear();
        this._availableoptions.clear();

        const updateselection = () => {
            this._selectedoptions.forEach((value, key) => {
                if (value != null) {
                    key.addClass("bg-primary");
                    key.children().addClass("text-white");
                } else {
                    key.removeClass("bg-primary");
                    key.children().removeClass("text-white");
                }
            });
            this._availableoptions.forEach((value, key) => {
                if (value != null) {
                    key.addClass("bg-primary");
                    key.children().addClass("text-white");
                } else {
                    key.removeClass("bg-primary");
                    key.children().removeClass("text-white");
                }
            });
            
            if (Array.from(this._availableoptions.values()).filter(elem => elem != null).length === 0) {
                this._buttonToSelected.addClass("disabled");
                this._buttonToSelected.prop("disabled", true);
            } else {
                this._buttonToSelected.removeClass("disabled");
                this._buttonToSelected.prop("disabled", false);
            }
            
            if (Array.from(this._selectedoptions.values()).filter(elem => elem != null).length === 0) {
                this._buttonToAvailable.addClass("disabled");
                this._buttonToAvailable.prop("disabled", true);
            } else {
                this._buttonToAvailable.removeClass("disabled");
                this._buttonToAvailable.prop("disabled", false);
            }
        };

        intersection.forEach((currentValue) => {   
            const li = $("<li class='list-group-item' draggable='true'>");
            const img = $("<img title='' draggable='false'/>").attr("src", currentValue.image);
            const icon = $("<i class='text-primary' draggable='false'>").addClass(currentValue.icon);
            const a = $("<a class='link' href='javascript:void(0)' draggable='false'>").text(currentValue.label);
            if (currentValue.icon != null) {
                li.append(icon);
            }
            if (currentValue.image != null) {
                li.append(img);
            }
            li.append(a);
            this._selectedoptions.set(li, null);
                        
            li.click((event) => {   
                if (event.ctrlKey) {
                    if (!Array.from(this._selectedoptions.values()).some(elem => elem === currentValue)) {
                        this._selectedoptions.set(li, currentValue);
                    } else {
                        this._selectedoptions.set(li, null);
                    }
                    this._availableoptions.forEach((value, key, map) => map.set(key, null));
                } else {
                    this._selectedoptions.forEach((value, key, map) => map.set(key, null));
                    this._selectedoptions.set(li, currentValue);
                    this._availableoptions.forEach((value, key, map) => map.set(key, null));
                }
                updateselection();
                $(document).trigger(webexpress.webui.Event.CLICK_EVENT, {
                    id: $(this._element).attr("id"),
                    item: currentValue
                });
                
            }).dblclick(() => {  
                this._selectedoptions.forEach((value, key, map) => map.set(key, null));
                this._selectedoptions.set(li, currentValue);
                this._availableoptions.forEach((value, key, map) => map.set(key, null));

                this.moveToAvailable();
            }).keyup((event) => { 
                if (event.keyCode === 32) {
                    if (!Array.from(this._selectedoptions.keys()).some(elem => elem === currentValue)) {
                        this._selectedoptions.set(li, currentValue);
                    } else {
                        this._selectedoptions.set(li, null);
                    }
                    this._availableoptions.forEach((value, key, map) => map.set(key, null));
                    updateselection();
                }
            });
            
            li.on('dragstart', (e) => {
                this._selectedoptions.forEach((value, key, map) => map.set(key, null));
                this._selectedoptions.set(li, currentValue);
                this._availableoptions.forEach((value, key, map) => map.set(key, null));    
                updateselection();             
                li.addClass("wx-dragging");
                this._draggingElement = li;
            });

            this._selectedList.append(li);
        });

        relativeComplement.forEach((currentValue) => { 
            const li = $("<li class='list-group-item' draggable='true'>");
            const img = $("<img title='' draggable='false'/>").attr("src", currentValue.image);
            const icon = $("<i class='text-primary' draggable='false'>").addClass(currentValue.icon);;
            const a = $("<a class='link' href='javascript:void(0)' draggable='false'>").text(currentValue.label);
            if (currentValue.icon != null) {
                li.append(icon);
            }
            if (currentValue.image != null) {
                li.append(img);
            }
            li.append(a);
            this._availableoptions.set(li, null);
            
            li.click((event) => {   
                if (event.ctrlKey) {
                    if (!Array.from(this._availableoptions.values()).some(elem => elem === currentValue)) {
                        this._availableoptions.set(li, currentValue);
                    } else {
                        this._availableoptions.set(li, null);
                    }
                    this._selectedoptions.forEach((value, key, map) => map.set(key, null));
                } else {
                    this._selectedoptions.forEach((value, key, map) => map.set(key, null));
                    this._availableoptions.forEach((value, key, map) => map.set(key, null));
                    this._availableoptions.set(li, currentValue);
                }
                                
                updateselection();
                $(document).trigger(webexpress.webui.Event.CLICK_EVENT, {
                    id: $(this._element).attr("id"),
                    item: currentValue
                });
            }).dblclick(() => {  
                this._selectedoptions.forEach((value, key, map) => map.set(key, null));
                this._availableoptions.forEach((value, key, map) => map.set(key, null));
                this._availableoptions.set(li, currentValue);

                this.moveToSelected();
            }).keyup((event) => { 
                if (event.keyCode === 32) {
                    if (!Array.from(this._availableoptions.keys()).some(elem => elem === currentValue)) {
                        this._availableoptions.set(li, currentValue);
                    } else {
                        this._availableoptions.set(li, null);
                    }
                    this._selectedoptions.forEach((value, key, map) => map.set(key, null));
                    updateselection();
                }
            });
            
            li.on('dragstart', (e) => {
                this._selectedoptions.forEach((value, key, map) => map.set(key, null));
                this._availableoptions.forEach((value, key, map) => map.set(key, null));
                this._availableoptions.set(li, currentValue);
                updateselection();
                li.addClass("wx-dragging");
                this._draggingElement = li;
            });

            this._availableList.append(li);
        });
        
        if (relativeComplement.length === 0) {
            this._buttonToSelectedAll.addClass("disabled");
            this._buttonToSelectedAll.prop("disabled", true);
        } else {
            this._buttonToSelectedAll.removeClass("disabled");
            this._buttonToSelectedAll.prop("disabled", false);
        }

        if (values.length === 0) {
            this._buttonToAvailableAll.addClass("disabled");
            this._buttonToAvailableAll.prop("disabled", true);
        } else {
            this._buttonToAvailableAll.removeClass("disabled");
            this._buttonToAvailableAll.prop("disabled", false);
        }
        
        updateselection();
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
     * @param values An array with object ids.
     */
    set value(values) {
        if (this._values !== values) {
            this._values = values;
            this._hidden.val(this._values.join(';'));
            this.render();
            $(document).trigger(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
                id: $(this._element).attr("id"),
                value: values
            });
        }
    }
}

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-move", webexpress.webui.MoveCtrl);