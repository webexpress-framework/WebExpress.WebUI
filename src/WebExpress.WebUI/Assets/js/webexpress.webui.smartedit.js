/**
 * SmartEditCtrl allows inline editing of the content of a wrapper element.
 * On mouseover, a pencil icon appears next to the content.
 * When the pencil is clicked, an editor form is displayed to change the value.
 * The following events are triggered:
 * - webexpress.webui.Event.START_INLINE_EDIT_EVENT: triggered when editing starts.
 * - webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT: triggered when a value is saved.
 * - webexpress.webui.Event.END_INLINE_EDIT_EVENT: triggered when editing is finished (regardless if saved or canceled).
 */
webexpress.webui.SmartEditCtrl = class extends webexpress.webui.Ctrl {
    _activeEdit = null;
    
    /**
     * Constructor
     * @param {HTMLElement} element - the dom element for the inline edit control
     */
    constructor(element) {
        super(element);
        
        // get options from attributes
        this._id = element.id || null;
        this._value = this._getEditorValue(element);
        this._editor = this._detachElement(element.firstElementChild);
        this._objectId = element.getAttribute('data-object-id') || null;
        this._objectName = element.getAttribute('data-object-name') || null;
        this._formAction = element.getAttribute('data-form-action') || null;
        this._formMethod = element.getAttribute('data-form-method') || null;
        
        // clean up dom and add built elements
        element.removeAttribute('data-form-action');
        element.removeAttribute('data-form-method');
        element.removeAttribute('data-object-id');
        element.removeAttribute('data-object-name');
        element.classList.add("wx-smart-edit");

        const displayValue = this._getDisplayLabel(element, this._value);
        element.appendChild(displayValue);
                        
        // add mouse events to the control element itself
        element.addEventListener("mouseenter", e => this._showEditIcon(element));
        element.addEventListener("mouseleave", e => this._hideEditIcon(element));
        element.addEventListener("dblclick", e => {
            e.stopPropagation();
            this._startEditing(element);
        });
    }

    /**
     * Shows the pencil icon for editing
     * @param {HTMLElement} element - target element
     */
    _showEditIcon(element) {
        if (this._activeEdit) return;
        // do nothing if pencil already exists
        if (element.querySelector('button')) return;
        const pencil = document.createElement('button');
        const icon = document.createElement('i');
        icon.className = 'fas fa-pencil';
        icon.title = webexpress.webui.I18N.translate("webexpress.webui:edit") ?? "Edit";
        pencil.classList.add("pencil");
        pencil.appendChild(icon);
        pencil.addEventListener('click', e => {
            e.stopPropagation();
            this._startEditing(element);
        });
        element.appendChild(pencil);
    }

    /**
     * Hides the pencil icon
     * @param {HTMLElement} element - target element
     */
    _hideEditIcon(element) {
        // remove pencil if not editing
        const pencil = element.querySelector(":scope > button");
        if (pencil) element.removeChild(pencil);
    }
    
    /**
     * Displays a spinner icon to indicate edit mode
     * @param {HTMLElement} element – target element
     */
    _showEditSpinner(element) {
        if (!this._activeEdit) return;

        const spinnerButton = document.createElement('button');
        const spinner = document.createElement('span');

        spinner.className = 'spinner-border spinner-border-sm';
        spinner.role = 'status';
        spinner.setAttribute('aria-hidden', 'true');
        spinner.title = webexpress.webui.I18N.translate("webexpress.webui:edit") ?? "Edit";

        spinnerButton.classList.add('spinner-button');
        spinnerButton.appendChild(spinner);

        spinnerButton.addEventListener('click', e => {
            e.stopPropagation();
            this._startEditing(element);
        });

        element.appendChild(spinnerButton);
    }

    /**
     * Removes the spinner icon from the target element
     * @param {HTMLElement} element – target element
     */
    _hideEditSpinner(element) {
        const spinnerButton = element.querySelector(":scope > button");
        if (spinnerButton) element.removeChild(spinnerButton);
    }

    /**
     * Starts the inline editing process
     * @param {HTMLElement} element - target element
     */
    _startEditing(element) {
        // only one active edit at a time
        if (this._activeEdit) return;
        this._activeEdit = element;
        this._hideEditIcon(element);
        
        // trigger start event     
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.START_INLINE_EDIT_EVENT, {
            detail: {
                sender: element,
                id: element.id,
                value: this._value
            }
        }));
        
        // clear selection
        if (window.getSelection) {
            const selection = window.getSelection();
            if (!selection.isCollapsed) { 
                selection.removeAllRanges();
            }
        }
        
        element.innerHTML = '';
        const form = document.createElement('form');
        form.appendChild(this._editor);
        
        if (this._objectName) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = this._objectName;
            hidden.value = this.id;
            form.appendChild(hidden);
        }
        
        if (this._objectId) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = `_${this._id}_objectId_`;
            hidden.value = this._objectId;
            form.appendChild(hidden);
        }
        
        if (this._objectName) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = `_${this._id}_objectName_`;
            hidden.value = this._objectName;
            form.appendChild(hidden);
        }
                
        const btnOk = document.createElement('button');
        const iconOk = document.createElement('i');
        iconOk.className = 'fas fa-check text-success';
        btnOk.type = 'submit';
        btnOk.appendChild(iconOk);
        btnOk.title = webexpress.webui.I18N.translate("webexpress.webui:save") || "Save";

        const btnCancel = document.createElement('button');
        const iconCancel = document.createElement('i');
        iconCancel.className = 'fas fa-times text-danger';
        btnCancel.type = 'button';
        btnCancel.appendChild(iconCancel);
        btnCancel.title = webexpress.webui.I18N.translate("webexpress.webui:cancel") || "Cancel";

        // handle save event
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newValue = this._getEditorValue(element);
            const formData = new FormData(form);
            
            this._showEditSpinner(element);

            try {
                const response = await fetch(this._formAction, {
                    method: this._formMethod ?? "PUT",
                    body: formData
                });

                if (response.ok) {
                    // trigger save
                    document.dispatchEvent(new CustomEvent(webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT, {
                        detail: {
                            sender: element,
                            id: element.id,
                            value: this._value
                        }
                    }));
                    return;
                }
            } catch (error) {
                console.error(`Failed to edit`, error);
            } finally {
                this._hideEditSpinner(element);
                this._finishEditing(true, element, newValue);
            }           
        });

        // handle cancel event
        btnCancel.addEventListener('click', e => {
            e.preventDefault();
            this._finishEditing(false, element, this._value);
        });
        
        // handle click outside to cancel edit mode
        this._outsideClickHandler = (e) => {
            e.stopPropagation();
            // check if click is outside the current element
            if (!element.contains(e.target)) {
                
                this._finishEditing(false, element, this._value);
            }
        };
        
        // register outside click handler (with delay to avoid immediate trigger)
        document.addEventListener('mousedown', this._outsideClickHandler);
        document.addEventListener('touchstart', this._outsideClickHandler);
        
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'form-buttons';
        buttonWrapper.appendChild(btnOk);
        buttonWrapper.appendChild(btnCancel);
        
        form.appendChild(buttonWrapper); 
        element.appendChild(form);

        element.focus();
    }

    /**
     * Finishes editing, restores or saves value
     * @param {boolean} save - true if saving, false if canceling
     * @param {HTMLElement} element - target element
     * @param {string} value - new or original value
     */
    _finishEditing(save, element, value) {
        // remove outside click listeners if any
        if (this._outsideClickHandler) {
            document.removeEventListener('mousedown', this._outsideClickHandler);
            document.removeEventListener('touchstart', this._outsideClickHandler);
            this._outsideClickHandler = null;
        }
        
        // restore or save the value
        element.innerHTML = '';

        // always trigger end event
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.END_INLINE_EDIT_EVENT, {
            detail: {
                sender: element,
                id: element.id,
                value: this._value
            }
        }));
                
        if (save && typeof this.onSave === 'function') {
            this.onSave(element, value);
        } else if (typeof this.onCancel === 'function') {
            this.onCancel(element, value);
        }
        const displayValue = this._getDisplayLabel(element, value);
        element.appendChild(displayValue);       
        this._value = value;
        this._activeEdit = null;
    }

    /**
     * Gets the text value of an element
     * @param {HTMLElement} element - target element
     * @returns {string} value
     */
    getValue(element) {
        // get text content of element
        return element.textContent;
    }

    /**
    * Extracts the most relevant value from the given container element.
    * @param {HTMLElement} element - The DOM element to extract the value from
    * @returns {string} The extracted value based on priority
    */
    _getEditorValue(element) {
        // get the control instance
        const ctrl = webexpress.webui.Controller.getInstanceByElement(this._editor); 
        
        if (ctrl && ctrl instanceof webexpress.webui.EditorCtrl) {
            return ctrl._editorElement?.innerHTML;
        }
        
        // 1. input field
        let el = element.querySelector('input');
        if (el) return el.value;
        
        // 2. textarea element
        el = element.querySelector('textarea');
        if (el) return el.value;
        
        // 3. hidden input field
        el = element.querySelector('input[type="hidden"]');
        if (el) return el.value;

        // 4. element with a 'data-value' attribute anywhere inside
        el = element.querySelector('[data-value]');
        if (el) return el.getAttribute('data-value');

        // 5. fallback: visible text content from the container itself
        return element.textContent.trim();
    }
    
    /**
     * Returns the display label for the given value(s)
     * @param {HTMLElement} element - selection control element
     * @param {string|string[]} value - selected id(s)
     * @returns {string} label(s) as string 
     */ 
     _getDisplayLabel(element, value) { 
        // get the control instance
        const ctrl = webexpress.webui.Controller.getInstanceByElement(this._editor); 
        
        if (ctrl && ctrl instanceof webexpress.webui.SelectionCtrl) {
            const ids = Array.isArray(value) ? value : String(value).split(';'); 
            const ul = document.createElement("ul");
            
            // map every id to its label using the control's items 
            ids.map(id => { 
                const item = ctrl.options.find(opt => String(opt.id) === String(id)); 
                const li = document.createElement("li");
                const span = document.createElement("span");
                if (item.labelColor) {
                    li.className = item.labelColor;
                }
                if (item.image) {
                    const img = document.createElement("img");
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
                ul.appendChild(li);
            }); 

            return ul;
        } else if (ctrl && ctrl instanceof webexpress.webui.MoveCtrl) {
            const ids = Array.isArray(value) ? value : String(value).split(';'); 
            const ul = document.createElement("ul");
            
            ids.map(id => { 
                const item = ctrl.options.find(opt => String(opt.id) === String(id)); 
                const li = document.createElement("li");
                const span = document.createElement("span");
                if (item.labelColor) {
                    li.className = item.labelColor;
                }
                if (item.image) {
                    const img = document.createElement("img");
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
                ul.appendChild(li);
            });

            return ul;
        } else if (ctrl && ctrl instanceof webexpress.webui.TagCtrl) {
            const ids = Array.isArray(value) ? value : String(value).split(';'); 
            const ul = document.createElement("ul");
            
            ids.forEach((tag, index) => {
                const li = document.createElement("li");
                li.textContent = tag;

                // set color if defined
                if (ctrl._colorCss) {
                    li.classList.add(this._colorCss);
                } else if (ctrl._colorStyle) {
                    li.style.cssText = ctrl._colorStyle;
                } else {
                    li.classList.add("wx-tag-primary");
                }
                
                ul.appendChild(li);
            });

            return ul;
        } else if (ctrl && ctrl instanceof webexpress.webui.EditorCtrl) {
            const span = document.createElement('span');
            span.innerHTML = ctrl._editorElement?.innerHTML;
            return span;
        }
        
        // fallback
        const span = document.createElement('span');
        span.textContent = value;
        return span;
    }
}    

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-smart-edit", webexpress.webui.SmartEditCtrl);