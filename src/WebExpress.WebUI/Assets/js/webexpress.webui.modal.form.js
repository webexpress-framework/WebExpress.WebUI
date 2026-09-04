/**
 * A modular form.
 * The following events are triggered:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 * - webexpress.webui.DATA_REQUESTED_EVENT
 * - webexpress.webui.DATA_ARRIVED_EVENT
 * - webexpress.webui.UPDATED_EVENT
 */
webexpress.webui.ModalFormCtrl = class extends webexpress.webui.ModalPageCtrl {
    _form = null;
    _submitHandler = null;

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the modal control.
     */
    constructor(element) {
        super(element);

        this._selector = this._selector === "body" ? "form" : this._selector; // set selector for the form area
    }

    /**
     * Updates the modal content with fetched data from the URI.
     * @param {string} response - The HTML response retrieved from the server.
     */
    _update(response) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, "text/html");
        const form = doc.querySelector(this._selector);

        if (form) {
            // remove previous submit handler to avoid duplicate bindings
            if (this._submitHandler && this._form) {
                this._form.removeEventListener("submit", this._submitHandler);
            }

            this._form = form;

            // keep only CSS classes starting with "wx"
            this._form.className = [...this._form.classList]
                .filter(cls => cls.startsWith("wx"))
                .join(" ");

            // ensure the form behaves like a transparent container
            this._form.style.display = "contents";

            // extract submit/reset buttons before clearing the form
            const buttons = Array.from(form.querySelectorAll("button[type='submit'], button[type='reset']"))
                .map(btn => this._detachElement(btn));

            // hidden metadata elements the server emits as direct children of
            // the form (for example the wx-state / wx-service islands a data
            // bound form carries) are not visible content and must stay direct
            // children of the form: a form controller that hydrates the form
            // after it is injected reads them from the form's direct children,
            // so relocating them into the modal body would leave the form
            // without its endpoint and the fields empty.
            const islands = [...form.children].filter(el => el.hasAttribute("hidden"));

            const method = form.getAttribute("method") || "POST";
            const action = form.getAttribute("action") || this._uri;

            // submit handler for AJAX form submission
            this._submitHandler = (event) => {
                if (event.defaultPrevented) return;

                event.preventDefault();
                const formData = new FormData(this._form);

                fetch(action, { method, body: formData })
                    .then(r => r.text())
                    .then(data => this._update(data))
                    .catch(error => {
                        this._bodyDiv.innerHTML =
                            error.message ||
                            this._i18n("webexpress.webui:modal.form.error", "An error occurred.");
                    });
            };

            this._form.addEventListener("submit", this._submitHandler);

            // the bars are emptied before the served form's sections are lifted onto them, so
            // nothing of the previously shown form is left behind them
            this._footerDiv.innerHTML = "";
            this._titleH1.innerHTML = "";

            // a form header names what is being edited, which is what the dialog's title bar is
            // for, and a form footer holds what belongs beside its buttons. Both are lifted by
            // the base dialog, which owns what a dialog is made of; because they stay inside the
            // form, an input in the header (the edited record's own name, say) is still loaded
            // and submitted with the rest.
            const titled = this.liftTitle(form);
            this.liftFooter(form);

            // extract all visible content except the metadata islands; the sections are already
            // gone from the form's children by now
            const formContent = [...form.children].filter(el => !el.hasAttribute("hidden"));

            // a form whose body is one filling element gets the whole body reserved for it: the
            // body stops scrolling and passes its height down, so a writing surface ends exactly
            // where the dialog does instead of guessing at the chrome around it. asked here,
            // while the form still holds its content - the emptying below detaches it.
            const fills = !!form.querySelector("[data-fill=\"true\"]");

            form.innerHTML = "";

            if (!titled) {
                this._titleH1.textContent = doc.title?.trim() ?? "";
            }

            buttons.forEach(btn => this._footerDiv.appendChild(btn));
            this._footerDiv.appendChild(this._cancelButton);

            this._bodyDiv.classList.toggle("wx-modal-fill", fills);

            // fill modal body with form content
            this._bodyDiv.innerHTML = "";
            formContent.forEach(el => this._bodyDiv.appendChild(el));

            this._form.innerHTML = "";
            // keep the metadata islands as direct children of the form, ahead of
            // the dialog, so the injected form hydrates from them
            islands.forEach(el => this._form.appendChild(el));
            this._form.appendChild(this._dialogDiv);

            this._element.innerHTML = "";
            this._element.appendChild(this._form);

            // bind dismiss buttons
            this._dialogDiv.querySelectorAll("[data-wx-dismiss='modal']").forEach(button => {
                button.addEventListener("click", () => this.hide());
            });

            // notify listeners that the modal has been updated
            this._element.dispatchEvent(new CustomEvent(webexpress.webui.Event.UPDATED_EVENT, {
                detail: { form: this._form }
            }));

            return;
        }

        this._titleH1.textContent = doc.title?.trim() ?? "";

        // fallback: try to find a wx-content-main
        const contentMain = doc.querySelector("#wx-content-main");

        if (contentMain) {
            this._bodyDiv.innerHTML = "";
            this._bodyDiv.appendChild(contentMain.cloneNode(true));

            this._footerDiv.innerHTML = "";
            this._footerDiv.appendChild(this._cancelButton);

            this._element.innerHTML = "";
            this._element.appendChild(this._dialogDiv);

            return; // content successfully displayed
        }

        // final fallback
        this._bodyDiv.innerHTML = this._i18n(
            "webexpress.webui:modal.form.notfound",
            "No form or content could be loaded."
        );

        this._footerDiv.innerHTML = "";
        this._footerDiv.appendChild(this._cancelButton);

        this._element.innerHTML = "";
        this._element.appendChild(this._dialogDiv);
    }

    /**
     * Displays validation errors inside a Bootstrap alert with plain paragraph formatting.
     * @param {Array<{ code: string, message: string, field: string }>} errors - List of validation error objects.
     */
    showValidationErrors(errors) {
        if (!Array.isArray(errors)) {
            return;
        }

        this._form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
        this._form.querySelector(".wx-validation-alert")?.remove();

        const alert = document.createElement("div");
        alert.className = "alert alert-danger wx-validation-alert";
        alert.role = "alert";

        const text = errors.map(err => err.message).join("<br>");
        alert.innerHTML = `<strong>${this._i18n("webexpress.webui:modal.form.correct", "Please correct the following:")}</strong><br>${text}`;

        errors.forEach(error => {
            const input = this._form.querySelector(`[name="${error.field}"]`);
            if (input) {
                input.classList.add("is-invalid");
            }
        });

        const modalBody = this._form.querySelector(".modal-body");
        if (modalBody) {
            modalBody.prepend(alert);
        } else {
            this._form.prepend(alert);
        }
    }
}

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modal-form", webexpress.webui.ModalFormCtrl);