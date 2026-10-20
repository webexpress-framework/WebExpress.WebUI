/**
 * SmartEditCtrl allows inline editing of the content of a wrapper element.
 * On mouseover, a pen icon appears next to the content.
 * When the pen is clicked, an editor form is displayed to change the value.
 * The following events are triggered:
 * - webexpress.webui.Event.START_INLINE_EDIT_EVENT: triggered when editing starts.
 * - webexpress.webui.Event.BEFORE_SAVE_EVENT: triggered before a value is saved; cancelable,
 *   a cancelled save leaves the edit open.
 * - webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT: triggered when a value is saved.
 * - webexpress.webui.Event.TASK_START_EVENT, TASK_FINISH_EVENT: triggered around the request
 *   to the form action.
 * - webexpress.webui.Event.SAVED_EVENT: triggered when a saved value was taken over.
 * - webexpress.webui.Event.DATA_ERROR_EVENT: triggered when the form action refused the value.
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT: triggered when the value changed.
 * - webexpress.webui.Event.END_INLINE_EDIT_EVENT: triggered when editing is finished (regardless if saved or canceled).
 *
 * Persistence is optional: with data-form-action the new value is submitted as
 * form data, without it the save event is the only outcome and the host decides
 * how to store the value.
 *
 * A host that stores the value itself, and may fail to, decides the outcome through the
 * save event: detail.waitUntil(promise) keeps the editor waiting until the promise
 * settles - it is taken over when the promise resolves to anything but false and set
 * back to the previous value when it resolves to false or rejects - and detail.confirm()
 * or detail.revert() decide it at once. Without any of the three the value is taken
 * over as soon as it is saved, unless the form action failed: a value the server did not
 * take is set back and reported, so the cell never shows a value as saved that is not.
 * A value that was set back leaves the cell ready to be edited again.
 */
webexpress.webui.SmartEditCtrl = class extends webexpress.webui.Ctrl {
    _activeEdit = null;
    _editor = null;
    _previousValue = null;
    _saving = false;

    /**
     * Constructor
     * @param {HTMLElement} element the host element for the inline edit control
     */
    constructor(element) {
        super(element);

        // lese optionen
        this._id = element.id || null;
        this._objectId = element.getAttribute("data-object-id") || null;
        this._objectName = element.getAttribute("data-object-name") || null;
        this._formAction = element.getAttribute("data-form-action") || null;
        this._formMethod = element.getAttribute("data-form-method") || null;

        this._editor = this._detachElement(element.firstElementChild);

        // the text the read view shows for an empty value. an empty value would
        // otherwise leave an empty view - nothing to hover and nothing to click -
        // so exactly the value that most needs an editor would have no way to
        // reach one. the editor's own placeholder names the field
        this._placeholder = element.getAttribute("data-placeholder")
            || (this._editor && typeof this._editor.getAttribute === "function"
                ? this._editor.getAttribute("placeholder")
                : null)
            || null;

        // bereinige dom
        element.removeAttribute("data-form-action");
        element.removeAttribute("data-form-method");
        element.removeAttribute("data-object-id");
        element.removeAttribute("data-object-name");
        element.removeAttribute("data-placeholder");
        element.classList.add("wx-smart-edit");

        // events
        element.addEventListener("mouseenter", (e) => { this._showEditIcon(element); });
        element.addEventListener("mouseleave", (e) => { this._hideEditIcon(element); });
        element.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            this._startEditing(element);
        });

        // a rest-backed editor (e.g. the REST selection input) loads its options
        // asynchronously, after this read view was first built; rebuild the view
        // when the editor reports its data arrived, so the display is not frozen as
        // a snapshot taken before the options existed. skipped while editing, where
        // the live editor is shown instead of the view.
        if (this._editor && typeof this._editor.addEventListener === "function") {
            this._editor.addEventListener(webexpress.webui.Event.DATA_ARRIVED_EVENT, () => {
                if (!this._activeEdit) {
                    this._element.innerHTML = "";
                    this._element.appendChild(this._getView(this.value));
                }
            });
        }

        const view = this._getView(this.value);
        this._element.appendChild(view);
    }

    /**
     * Shows the edit icon on hover.
     * @param {HTMLElement} element target element
     */
    _showEditIcon(element) {
        if (this._activeEdit || element.querySelector("button")) {
            return;
        }
        const pencil = document.createElement("button");
        const icon = document.createElement("i");
        // "pen" is the inline edit affordance everywhere else in the framework
        // (dashboard, kanban, sidebar, graph editor). the button keeps its
        // "pencil" class, which other modules style and test against
        icon.className = this._iconClass("pen");
        icon.title = this._i18n("webexpress.webui:edit", "Edit");
        pencil.classList.add("pencil");
        pencil.appendChild(icon);
        pencil.addEventListener("click", (e) => {
            e.stopPropagation();
            this._startEditing(element);
        });
        element.appendChild(pencil);
    }

    /**
     * Hides the edit icon.
     * @param {HTMLElement} element target element
     */
    _hideEditIcon(element) {
        const pencil = element.querySelector(":scope > button");
        if (pencil) {
            element.removeChild(pencil);
        }
    }

    /**
     * Shows a spinner indicating edit mode is active.
     * @param {HTMLElement} element target element
     */
    _showEditSpinner(element) {
        if (!this._activeEdit || element.querySelector(":scope > .spinner-button")) {
            return;
        }
        const spinnerButton = document.createElement("button");
        const spinner = document.createElement("span");
        spinner.className = "spinner-border spinner-border-sm";
        spinner.role = "status";
        spinner.setAttribute("aria-hidden", "true");
        spinner.title = this._i18n("webexpress.webui:edit", "Edit");
        spinnerButton.classList.add("spinner-button");
        spinnerButton.appendChild(spinner);
        spinnerButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this._startEditing(element);
        });
        element.appendChild(spinnerButton);
    }

    /**
     * Hides the edit spinner.
     * @param {HTMLElement} element target element
     */
    _hideEditSpinner(element) {
        const spinnerButton = element.querySelector(":scope > button");
        if (spinnerButton) {
            element.removeChild(spinnerButton);
        }
    }

    /**
     * Starts the inline editing process.
     * Stores the current value for potential restoration.
     * @param {HTMLElement} element target element
     */
    _startEditing(element) {
        if (this._activeEdit) {
            return;
        }

        // wert vor beginn zwischenspeichern
        this._previousValue = this.value;

        this._activeEdit = element;
        this._hideEditIcon(element);

        this._dispatch(webexpress.webui.Event.START_INLINE_EDIT_EVENT, { value: this.value });

        if (window.getSelection && !window.getSelection().isCollapsed) {
            window.getSelection().removeAllRanges();
        }

        element.innerHTML = "";
        const form = document.createElement("form");

        if (this._editor) {
            form.appendChild(this._editor);
        }

        // the field the edited value is submitted in. it is filled at submit time rather
        // than here, because here the edit has not happened yet — and it is dropped again
        // when the editor already contributes a control of the same name, so the value
        // does not travel twice
        let valueField = null;

        if (this._objectName) {
            valueField = document.createElement("input");
            valueField.type = "hidden";
            valueField.name = this._objectName;
            form.appendChild(valueField);
        }

        if (this._objectId) {
            const hidden = document.createElement("input");
            hidden.type = "hidden";
            hidden.name = `_${this._id}_objectId_`;
            hidden.value = this._objectId;
            form.appendChild(hidden);
        }

        if (this._objectName) {
            const hidden = document.createElement("input");
            hidden.type = "hidden";
            hidden.name = `_${this._id}_objectName_`;
            hidden.value = this._objectName;
            form.appendChild(hidden);
        }

        const btnOk = document.createElement("button");
        const iconOk = document.createElement("i");
        iconOk.className = this._iconClass("check") + " wx-smart-edit-save";
        btnOk.type = "submit";
        btnOk.appendChild(iconOk);
        btnOk.title = this._i18n("webexpress.webui:save", "Save");

        const btnCancel = document.createElement("button");
        const iconCancel = document.createElement("i");
        iconCancel.className = this._iconClass("xmark") + " wx-smart-edit-cancel";
        btnCancel.type = "button";
        btnCancel.appendChild(iconCancel);
        btnCancel.title = this._i18n("webexpress.webui:cancel", "Cancel");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            // a second submit while the first waits for its outcome would save twice
            if (this._saving) {
                return;
            }

            // the value the editor holds now, which is the one _finishEditing applies and
            // therefore the one the host is told about and the one submitted. reading the
            // control's own value instead would report the state from before the edit for
            // every composite editor, which only adopts typed input on its own events
            const newValue = this._getEditorValue(element);

            // an invalid value is not saved; the edit stays open with the field marked
            if (this._editor && !webexpress.webui.Field.report(this._editor)) {
                return;
            }

            const before = this._dispatch(webexpress.webui.Event.BEFORE_SAVE_EVENT, { value: newValue }, { cancelable: true });
            if (before.defaultPrevented) {
                return;
            }

            // without a configured action the host owns the persistence and
            // listens for the save event; posting to the current document
            // instead would be a request nobody asked for
            if (!this._formAction) {
                const decision = this._announceSave({
                    value: newValue,
                    status: 200,
                    statusText: ""
                });
                await this._settleSave(element, newValue, decision);
                return;
            }

            this._saving = true;
            this._prepareValueField(form, valueField, newValue);
            this._showEditSpinner(element);

            this._dispatch(webexpress.webui.Event.TASK_START_EVENT, { name: "saving" });
            const result = await webexpress.webui.Transport.request(this._formAction, {
                method: this._formMethod ?? "PUT",
                body: new FormData(form)
            });
            this._dispatch(webexpress.webui.Event.TASK_FINISH_EVENT, { name: "saving" });

            // the save event carries the status the application checks: the server's own
            // when it answered, 500 with the reason when nothing did - which is what the
            // application saw for a network failure before the transport
            const answered = !!result.response;

            const decision = this._announceSave({
                value: newValue,
                status: answered ? result.status : 500,
                statusText: answered
                    ? (result.response.statusText || "")
                    : (result.error.message || this._i18n("webexpress.webui:smartedit.network.error", "Network Error"))
            });

            if (!result.ok && !answered) {
                console.error("failed to edit", result.error.message);
            }

            // unless the application decides, the outcome of the request does
            await this._settleSave(element, newValue, decision ?? this._decideByResult(result, newValue));
        });

        btnCancel.addEventListener("click", (e) => {
            e.preventDefault();
            // bei abbrechen alten wert wiederherstellen
            this._finishEditing(false, element, this._previousValue);
        });

        this._outsideClickHandler = (e) => {
            if (!element.contains(e.target)) {
                e.stopPropagation();
                // bei klick außerhalb abbrechen und alten wert wiederherstellen
                this._finishEditing(false, element, this._previousValue);
            }
        };

        setTimeout(() => {
            // torn down within the tick the edit opened in
            if (this._destroyed || !this._outsideClickHandler) {
                return;
            }
            document.addEventListener("mousedown", this._outsideClickHandler);
            document.addEventListener("touchstart", this._outsideClickHandler);
        }, 0);

        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "form-buttons";
        buttonWrapper.appendChild(btnOk);
        buttonWrapper.appendChild(btnCancel);

        form.appendChild(buttonWrapper);
        element.appendChild(form);

        element.focus();
    }

    /**
     * Finishes editing and restores or applies value.
     * @param {boolean} save whether to apply the new value
     * @param {HTMLElement} element target element
     * @param {string|any} value new or restored value
     */
    _finishEditing(save, element, value) {
        const changed = save && JSON.stringify(value ?? null) !== JSON.stringify(this._previousValue ?? null);
        this._detachOutsideClick();

        element.innerHTML = "";
        this._dispatch(webexpress.webui.Event.END_INLINE_EDIT_EVENT, { value: this.value });

        if (save && typeof this.onSave === "function") {
            this.onSave(element, value);
        } else if (!save && typeof this.onCancel === "function") {
            this.onCancel(element, value);
        }

        // editor zurücksetzen (falls kontrollinstanz vorhanden)
        if (this._editor) {
            const ctrl = webexpress.webui.Controller.getInstanceByElement(this._editor);
            if (ctrl && typeof ctrl.value !== "undefined") {
                ctrl.value = value;
            } else if (this._editor.tagName === "SELECT") {
                const first = Array.isArray(value) ? value[0] : String(value || "").split(";")[0];
                const opt = Array.from(this._editor.options).find(o => String(o.value) === String(first));
                if (opt) {
                    this._editor.value = opt.value;
                }
            } else if (["INPUT", "TEXTAREA"].includes(this._editor.tagName)) {
                this._editor.value = value;
            } else {
                this._editor.innerHTML = value ?? "";
            }
        }

        // anzeige aktualisieren mit entsprechendem wert (neu oder wiederhergestellt)
        const view = this._getView(value);
        element.appendChild(view);

        // edit modus beenden und cache löschen
        this._activeEdit = null;
        this._previousValue = null;

        if (changed) {
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: value });
        }
        if (save) {
            this._dispatch(webexpress.webui.Event.SAVED_EVENT, { value: value });
        }
    }

    /**
     * Decides a save the host left open by the outcome of the request: a value the server took
     * is taken over, one it did not take is set back and reported, an abort is set back
     * silently.
     * @param {object} result - The normalized result of the request.
     * @param {*} value - The saved value.
     * @returns {Promise<boolean>|null} The decision, or null to take the value over.
     */
    _decideByResult(result, value) {
        if (result.ok) {
            return null;
        }
        if (result.error.kind !== "abort") {
            this._dispatch(webexpress.webui.Event.DATA_ERROR_EVENT, {
                action: "save",
                error: Object.assign({}, result.error, {
                    message: result.error.message || this._i18n("webexpress.webui:field.save.failed", "The changes could not be saved.")
                }),
                value: value
            });
        }
        return Promise.resolve(false);
    }

    /**
     * Stops listening for a click outside the editor, which cancels the edit.
     */
    _detachOutsideClick() {
        if (this._outsideClickHandler) {
            document.removeEventListener("mousedown", this._outsideClickHandler);
            document.removeEventListener("touchstart", this._outsideClickHandler);
            this._outsideClickHandler = null;
        }
    }

    /**
     * Releases the document listeners of an open edit. A host that builds the inline
     * editor itself, rather than through the controller, throws it away on its next
     * render; without this the listener of an edit that was open at that moment would
     * keep cancelling edits on a detached element.
     */
    destroy() {
        this._destroyed = true;
        this._detachOutsideClick();
        this.onSave = null;
        this.onCancel = null;
        super.destroy();
    }

    /**
     * Dispatches the save event with the means for the host to decide the outcome.
     * @param {object} detail - The value and the status of the save.
     * @returns {Promise<boolean>|null} The decision of the host - true to take the value
     *     over, false to set it back - or null when the host did not ask to decide.
     */
    _announceSave(detail) {
        let decision = null;
        let settle = null;
        const hold = () => decision || (decision = new Promise((resolve) => { settle = resolve; }));

        this._dispatch(webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT, Object.assign({}, detail, {
            waitUntil: (promise) => {
                hold();
                Promise.resolve(promise).then((outcome) => settle(outcome !== false), () => settle(false));
            },
            confirm: () => {
                hold();
                settle(true);
            },
            revert: () => {
                hold();
                settle(false);
            }
        }));

        return decision;
    }

    /**
     * Ends a save with the outcome the host decided: the value is taken over or set back
     * to the one before the edit. While the decision is pending the editor shows the
     * spinner and ignores clicks outside of it, which would cancel an edit that may still
     * be confirmed.
     * @param {HTMLElement} element - The target element.
     * @param {*} value - The saved value.
     * @param {Promise<boolean>|null} decision - The decision of the host, or null to take
     *     the value over.
     */
    async _settleSave(element, value, decision) {
        let confirmed = true;

        if (decision) {
            this._saving = true;
            this._detachOutsideClick();
            this._showEditSpinner(element);
            confirmed = await decision;
        }

        this._saving = false;
        this._hideEditSpinner(element);

        if (this._activeEdit !== element) {
            return;
        }

        this._finishEditing(confirmed, element, confirmed ? value : this._previousValue);
    }

    /**
     * Prepares the field the edited value is submitted in, just before the form data is
     * built.
     *
     * An editor that is itself a named form control — a plain input, a select, or a
     * composite control that keeps a named hidden field of its own — already carries the
     * value into the form data. The extra field would then send the same name twice, so it
     * is removed instead of filled.
     *
     * @param {HTMLFormElement} form the form being submitted
     * @param {HTMLInputElement|null} valueField the field reserved for the value
     * @param {string|string[]|any} value the edited value
     */
    _prepareValueField(form, valueField, value) {
        if (!valueField) {
            return;
        }

        const submittedByEditor = Array.from(form.elements)
            .some((el) => el !== valueField && el.name === valueField.name);

        if (submittedByEditor) {
            valueField.remove();
            return;
        }

        valueField.value = Array.isArray(value)
            ? value.join(";")
            : (value ?? "");
    }

    /**
     * Extracts the most relevant value from the editor container.
     * Priority order: control value, input/textarea, select, input inside editor, [data-value], text content.
     * @param {HTMLElement} element editor container
     * @returns {string} extracted value
     */
    _getEditorValue(element) {
        if (!this._editor) {
            return (element.querySelector("[data-value]")?.getAttribute("data-value")) || element.textContent.trim();
        }
        const ctrl = webexpress.webui.Controller.getInstanceByElement(this._editor);
        if (ctrl && this._isCtrl(ctrl, "EditorCtrl")) {
            return ctrl.value;
        }
        if (["INPUT", "TEXTAREA"].includes(this._editor.tagName)) {
            return this._editor.value;
        }
        if (this._editor.tagName === "SELECT") {
            return this._editor.options[this._editor.selectedIndex]?.value ?? "";
        }
        let el = this._editor.querySelector("input");
        if (el) {
            return el.value;
        }
        el = element.querySelector("[data-value]");
        if (el) {
            return el.getAttribute("data-value");
        }
        return this._editor.textContent.trim();
    }

    /**
     * Returns whether the editor control is an instance of the named control.
     *
     * The class is resolved by name at call time on purpose: a page does not
     * have to ship every input control this read view knows about, and a plain
     * instanceof against an undefined class throws - which would take the whole
     * read view down for every editor as soon as one control is missing.
     *
     * @param {object} ctrl the editor control to test
     * @param {string} name the control name inside the webexpress.webui namespace
     * @returns {boolean} true when the control is an instance of it
     */
    _isCtrl(ctrl, name) {
        const type = webexpress.webui[name];
        return typeof type === "function" && ctrl instanceof type;
    }

    /**
     * Builds a read-only view node for a given value based on the editor type.
     * @param {string|string[]|any} value value to display
     * @returns {HTMLElement} read-only view node
     */
    _getView(value) {
        if (!this._editor) {
            return this._textView(value);
        }

        const ctrl = webexpress.webui.Controller.getInstanceByElement(this._editor);

        if (this._isCtrl(ctrl, "InputDnfCtrl")) {
            // the raw value is the serialized expression - separators and term ids -
            // which is the one thing a reader of a filter should not be shown; the
            // read-only control resolves it into terms joined by the operator words
            const container = document.createElement("div");
            const dnf = new webexpress.webui.DnfCtrl(container);
            dnf.options = ctrl.options;
            dnf.value = value;
            return container;
        } else if (this._isCtrl(ctrl, "InputSelectionCtrl")) {
            const container = document.createElement("div");
            const selection = new webexpress.webui.SelectionCtrl(container);
            const ids = Array.isArray(value) ? value : String(value || "").split(";");
            selection.options = ctrl.options;
            selection.value = ids;
            return container;
        } else if (this._isCtrl(ctrl, "InputMoveCtrl")) {
            const container = document.createElement("div");
            const move = new webexpress.webui.MoveCtrl(container);
            const ids = Array.isArray(value) ? value : String(value || "").split(";");
            move.options = ctrl.options;
            move.value = ids;
            return container;
        } else if (this._isCtrl(ctrl, "InputCalendarCtrl")) {
            const container = document.createElement("div");
            const date = new webexpress.webui.DateCtrl(container);
            date.format = ctrl.format;
            date.value = value;
            return container;
        } else if (this._isCtrl(ctrl, "InputDateCtrl")) {
            const container = document.createElement("div");
            const date = new webexpress.webui.DateCtrl(container);
            date.format = ctrl.format;
            date.value = value;
            return container;
        } else if (this._isCtrl(ctrl, "InputTagCtrl")) {
            const container = document.createElement("div");
            const tag = new webexpress.webui.TagCtrl(container);
            tag.value = value;
            return container;
        } else if (this._isCtrl(ctrl, "InputRatingCtrl")) {
            const container = document.createElement("div");
            const rating = new webexpress.webui.RatingCtrl(container);
            rating.stars = ctrl.stars;
            rating.value = value;
            return container;
        } else if (this._isCtrl(ctrl, "InputColorCtrl")) {
            const container = document.createElement("div");
            const color = new webexpress.webui.ColorCtrl(container);
            color.value = value;
            return container;
        } else if (this._isCtrl(ctrl, "InputBarcodeCtrl")) {
            // the read view is the symbol alone; without this case it would fall
            // through to the raw value, which is the one thing a barcode is not
            const container = document.createElement("div");
            (ctrl.colors || []).forEach(([attribute, color]) => container.setAttribute(attribute, color));
            const barcode = new webexpress.webui.BarcodeCtrl(container);
            barcode.level = ctrl.level;
            barcode.type = ctrl.type;
            barcode.value = value;
            return container;
        } else if (this._isCtrl(ctrl, "InputTrafficLightCtrl")) {
            // without this case the display state falls through to the raw token
            // text; mirror the read-only representation of the traffic-light table
            // template so the value shows as a dimmed signal instead
            const container = document.createElement("div");
            if (this._editor.dataset.orientation) {
                container.dataset.orientation = this._editor.dataset.orientation;
            }
            const sizeClass = (this._editor.className || "").split(/\s+/)
                .find((c) => c.indexOf("wx-traffic-light-") === 0 && c !== "wx-traffic-light-horizontal");
            if (sizeClass) {
                container.classList.add(sizeClass);
            }
            const light = new webexpress.webui.TrafficLightCtrl(container);
            light.value = value;
            return container;
        } else if (this._isCtrl(ctrl, "EditorCtrl")) {
            // the editor stores its working surface - add-on frames, table column
            // resizers, the guard paragraphs around non-editables - so the raw value
            // is not what a reader should see; the content control converts it
            const container = document.createElement("div");
            if (this._placeholder) {
                container.setAttribute("data-placeholder", this._placeholder);
            }
            const content = new webexpress.webui.ContentCtrl(container);
            content.value = value ?? "";
            return container;
        } else if (this._editor.tagName === "SELECT") {
            const ids = Array.isArray(value) ? value : String(value || "").split(";");
            const labels = ids.map((id) => {
                const opt = Array.from(this._editor.options).find((o) => o.value === id);
                return opt?.label || opt?.text || id;
            });
            const span = document.createElement("span");
            span.textContent = labels.join(", ");
            return span;
        }

        return this._textView(value);
    }

    /**
     * Builds the plain text read view, falling back to the placeholder when the
     * value is empty, so an unset value still names the field and still offers
     * the area the pen appears over.
     * @param {string|any} value value to display
     * @returns {HTMLElement} read-only view node
     */
    _textView(value) {
        const span = document.createElement("span");
        const text = value == null ? "" : String(value);

        if (text.length === 0 && this._placeholder) {
            span.className = "wx-smart-edit-placeholder";
            span.textContent = this._placeholder;
            return span;
        }

        span.textContent = text;
        return span;
    }

    /**
     * Detaches the given element from its parent (helper to preserve event handlers).
     * @param {HTMLElement} el element to detach
     * @returns {HTMLElement} detached element
     * @private
     */
    _detachElement(el) {
        if (el && el.parentNode) {
            // an intentional detach keeps its instances alive until reattached
            el._wxDetached = true;
            el.parentNode.removeChild(el);
        }
        return el;
    }

    /**
     * Returns the current value from the underlying editor or view.
     * @returns {string|any} current value
     */
    get value() {
        if (this._editor) {
            const ctrl = webexpress.webui.Controller.getInstanceByElement(this._editor);
            if (ctrl && typeof ctrl.value !== "undefined") {
                return ctrl.value;
            } else if (this._editor.tagName === "SELECT") {
                return this._editor.value;
            } else if (["INPUT", "TEXTAREA"].includes(this._editor.tagName)) {
                return this._editor.value;
            } else {
                return this._editor.innerHTML;
            }
        }
        return null;
    }

    /**
     * Sets the value on the underlying editor and updates the read-only view if not editing.
     * The editor sits outside the document while it is not shown, so its own announcement
     * would reach nobody; a change is announced on the host instead.
     * @param {string|string[]|any} value new value
     */
    set value(value) {
        const before = JSON.stringify(this.value ?? null);

        if (this._editor) {
            const ctrl = webexpress.webui.Controller.getInstanceByElement(this._editor);
            if (ctrl && typeof ctrl.value !== "undefined") {
                ctrl.value = value;
            } else if (this._editor.tagName === "SELECT") {
                const first = Array.isArray(value) ? value[0] : String(value || "").split(";")[0];
                const opt = Array.from(this._editor.options).find((o) => String(o.value) === String(first));
                if (opt) {
                    this._editor.value = opt.value;
                }
            } else if (["INPUT", "TEXTAREA"].includes(this._editor.tagName)) {
                this._editor.value = value;
            } else {
                this._editor.innerHTML = value ?? "";
            }
        }

        if (this._element && !this._activeEdit) {
            this._element.innerHTML = "";
            const displayValue = this._getView(value);
            this._element.appendChild(displayValue);
        }

        if (JSON.stringify(this.value ?? null) !== before) {
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this.value });
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-smart-edit", webexpress.webui.SmartEditCtrl);
