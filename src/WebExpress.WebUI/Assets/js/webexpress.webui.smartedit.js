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
    _value = null;
    _editor = null;

    /**
     * Constructor
     * @param {HTMLElement} element - the dom element for the inline edit control
     */
    constructor(element) {
        super(element);

        // get options from attributes
        this._id = element.id || null;
        this._objectId = element.getAttribute('data-object-id') || null;
        this._objectName = element.getAttribute('data-object-name') || null;
        this._formAction = element.getAttribute('data-form-action') || null;
        this._formMethod = element.getAttribute('data-form-method') || null;

        this._editor = this._detachElement(element.firstElementChild);

        // clean up dom and add built-in elements
        element.removeAttribute('data-form-action');
        element.removeAttribute('data-form-method');
        element.removeAttribute('data-object-id');
        element.removeAttribute('data-object-name');
        element.classList.add("wx-smart-edit");

        // add mouse events to the control element itself
        element.addEventListener("mouseenter", e => this._showEditIcon(element));
        element.addEventListener("mouseleave", e => this._hideEditIcon(element));
        element.addEventListener("dblclick", e => {
            e.stopPropagation();
            this._startEditing(element);
        });
    }

    /**
     * Shows the pencil icon for editing.
     * @param {HTMLElement} element - target element
     */
    _showEditIcon(element) {
        if (this._activeEdit || element.querySelector('button')) {
            return;
        }

        const pencil = document.createElement('button');
        const icon = document.createElement('i');
        icon.className = 'fas fa-pencil';
        icon.title = this._i18n("webexpress.webui:edit", "Edit");
        pencil.classList.add("pencil");
        pencil.appendChild(icon);
        pencil.addEventListener('click', e => {
            e.stopPropagation();
            this._startEditing(element);
        });
        element.appendChild(pencil);
    }

    /**
     * Hides the pencil icon.
     * @param {HTMLElement} element - target element
     */
    _hideEditIcon(element) {
        const pencil = element.querySelector(":scope > button");
        if (pencil) {
            element.removeChild(pencil);
        }
    }

    /**
     * Displays a spinner icon to indicate edit mode.
     * @param {HTMLElement} element - target element
     */
    _showEditSpinner(element) {
        if (!this._activeEdit) {
            return;
        }

        const spinnerButton = document.createElement('button');
        const spinner = document.createElement('span');

        spinner.className = 'spinner-border spinner-border-sm';
        spinner.role = 'status';
        spinner.setAttribute('aria-hidden', 'true');
        spinner.title = this._i18n("webexpress.webui:edit", "Edit");

        spinnerButton.classList.add('spinner-button');
        spinnerButton.appendChild(spinner);

        spinnerButton.addEventListener('click', e => {
            e.stopPropagation();
            this._startEditing(element);
        });

        element.appendChild(spinnerButton);
    }

    /**
     * Removes the spinner icon from the target element.
     * @param {HTMLElement} element - target element
     */
    _hideEditSpinner(element) {
        const spinnerButton = element.querySelector(":scope > button");
        if (spinnerButton) {
            element.removeChild(spinnerButton);
        }
    }

    /**
     * Starts the inline editing process.
     * @param {HTMLElement} element - target element
     */
    _startEditing(element) {
        if (this._activeEdit) {
            return;
        }

        this.value = this._value;
        this._activeEdit = element;
        this._hideEditIcon(element);

        this._dispatch(webexpress.webui.Event.START_INLINE_EDIT_EVENT, { value: this._value });

        if (window.getSelection && !window.getSelection().isCollapsed) {
            window.getSelection().removeAllRanges();
        }

        element.innerHTML = '';
        const form = document.createElement('form');

        if (this._editor) {
            form.appendChild(this._editor);
        }

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
        btnOk.title = this._i18n("webexpress.webui:save", "Save");

        const btnCancel = document.createElement('button');
        const iconCancel = document.createElement('i');
        iconCancel.className = 'fas fa-times text-danger';
        btnCancel.type = 'button';
        btnCancel.appendChild(iconCancel);
        btnCancel.title = this._i18n("webexpress.webui:cancel", "Cancel");

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

                this._dispatch(webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT, {
                    value: this._value,
                    status: response.status,
                    statusText: response.statusText || ""
                });
            } catch (error) {
                this._dispatch(webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT, {
                    value: this._value,
                    status: 500,
                    statusText: error.message || "Network Error"
                });
                console.error(`Failed to edit`, error);
            } finally {
                this._hideEditSpinner(element);
                this._finishEditing(true, element, newValue);
            }
        });

        btnCancel.addEventListener('click', e => {
            e.preventDefault();
            this._finishEditing(false, element, this._value);
        });

        this._outsideClickHandler = (e) => {
            if (!element.contains(e.target)) {
                e.stopPropagation();
                this._finishEditing(false, element, this._value);
            }
        };

        setTimeout(() => {
            document.addEventListener('mousedown', this._outsideClickHandler);
            document.addEventListener('touchstart', this._outsideClickHandler);
        }, 0);

        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'form-buttons';
        buttonWrapper.appendChild(btnOk);
        buttonWrapper.appendChild(btnCancel);

        form.appendChild(buttonWrapper);
        element.appendChild(form);

        element.focus();
    }

    /**
     * Finishes editing, restores or saves value.
     * @param {boolean} save - true if saving, false if canceling
     * @param {HTMLElement} element - target element
     * @param {string} value - new or original value
     */
    _finishEditing(save, element, value) {
        if (this._outsideClickHandler) {
            document.removeEventListener('mousedown', this._outsideClickHandler);
            document.removeEventListener('touchstart', this._outsideClickHandler);
            this._outsideClickHandler = null;
        }

        element.innerHTML = '';
        this._dispatch(webexpress.webui.Event.END_INLINE_EDIT_EVENT, { value: this._value });

        if (save && typeof this.onSave === 'function') {
            this.onSave(element, value);
        } else if (typeof this.onCancel === 'function') {
            this.onCancel(element, value);
        }

        const displayValue = this._getDisplayLabel(value);
        element.appendChild(displayValue);
        this._value = value;
        this._activeEdit = null;
    }

    /**
     * Extracts the most relevant value from the given container element.
     * @param {HTMLElement} element - The DOM element to extract the value from
     * @returns {string} The extracted value based on priority
     */
    _getEditorValue(element) {
        if (!this._editor) {
            return (element.querySelector('[data-value]')?.getAttribute('data-value')) || element.textContent.trim();
        }

        const ctrl = webexpress.webui.Controller.getInstanceByElement(this._editor);
        if (ctrl && ctrl instanceof webexpress.webui.EditorCtrl) {
            return ctrl._editorElement?.innerHTML;
        }

        if (['INPUT', 'TEXTAREA'].includes(this._editor.tagName)) {
            return this._editor.value;
        }

        if (this._editor.tagName === 'SELECT') {
            return this._editor.options[this._editor.selectedIndex]?.value ?? '';
        }

        let el = this._editor.querySelector('input');
        if (el) {
            return el.value;
        }

        el = element.querySelector('[data-value]');
        if (el) {
            return el.getAttribute('data-value');
        }

        return this._editor.textContent.trim();
    }

    /**
     * Returns the display label for the given value(s)
     * @param {string|string[]} value - selected id(s)
     * @returns {string|HTMLElement} label(s) as node
     */
    _getDisplayLabel(value) {
        if (!this._editor) {
            const span = document.createElement('span');
            span.textContent = value;
            return span;
        }

        const ctrl = webexpress.webui.Controller.getInstanceByElement(this._editor);

        if (ctrl instanceof webexpress.webui.InputSelectionCtrl || ctrl instanceof webexpress.webui.InputMoveCtrl) {
            const ids = Array.isArray(value) ? value : String(value || '').split(';');
            const ul = document.createElement("ul");

            ids.forEach(id => {
                const item = ctrl.options.find(opt => String(opt.id) === String(id));
                if (item) {
                    const li = document.createElement("li");
                    const span = document.createElement("span");
                    if (item.labelColor) li.className = item.labelColor;
                    if (item.image) {
                        const img = document.createElement("img");
                        img.src = item.image;
                        img.className = "wx-icon";
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
                }
            });

            return ul;
        } else if (ctrl instanceof webexpress.webui.InputTagCtrl) {
            const tags = Array.isArray(value) ? value : String(value || '').split(';');
            const ul = document.createElement("ul");

            tags.forEach((tag) => {
                if (tag) {
                    const li = document.createElement("li");
                    li.textContent = tag;
                    if (ctrl._colorCss) {
                        li.classList.add(ctrl._colorCss);
                    } else if (ctrl._colorStyle) {
                        li.style.cssText = ctrl._colorStyle;
                    } else {
                        li.classList.add("wx-tag-primary");
                    }
                    ul.appendChild(li);
                }
            });

            return ul;
        } else if (ctrl instanceof webexpress.webui.EditorCtrl) {
            const span = document.createElement('span');
            span.innerHTML = value ?? '';
            return span;
        } else if (this._editor.tagName === 'SELECT') {
            const ids = Array.isArray(value) ? value : String(value || '').split(';');
            const labels = ids.map(id => {
                const opt = Array.from(this._editor.options).find(o => o.value === id);
                return opt?.label || opt?.text || id;
            });
            const span = document.createElement('span');
            span.textContent = labels.join(', ');
            return span;
        }

        const span = document.createElement('span');
        span.textContent = value;
        return span;
    }

    /**
     * Detach element (helper to preserve event handlers if any)
     * @param {HTMLElement} el element to detach
     * @returns {HTMLElement} detached element
     * @private
     */
    _detachElement(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
        return el;
    }

    /**
     * Gets the text value of an element
     * @returns {string} value
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the value of the editor and updates the display.
     * @param {string|string[]} value - value to set
     */
    set value(value) {
        this._value = value;

        // update the underlying editor's value
        if (this._editor) {
            const ctrl = webexpress.webui.Controller.getInstanceByElement(this._editor);
            if (ctrl && typeof ctrl.value !== 'undefined') {
                ctrl.value = value;
            } else if (this._editor.tagName === 'SELECT') {
                const first = Array.isArray(value) ? value[0] : String(value || '').split(';')[0];
                const opt = Array.from(this._editor.options).find(o => String(o.value) === String(first));
                if (opt) {
                    this._editor.value = opt.value;
                }
            } else if (['INPUT', 'TEXTAREA'].includes(this._editor.tagName)) {
                this._editor.value = value;
            } else {
                this._editor.innerHTML = value;
            }
        }

        // if not in edit mode, update the display
        if (this._element && !this._activeEdit) {
            this._element.innerHTML = '';
            const displayValue = this._getDisplayLabel(value);
            this._element.appendChild(displayValue);
        }
    }
}

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-smart-edit", webexpress.webui.SmartEditCtrl);