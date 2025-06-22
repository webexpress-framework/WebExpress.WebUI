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
    _form = document.createElement("form");
    
    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the modal control.
     */
    constructor(element) {
        super(element);

        this._selector = this._selector === "body" ? "form" : this._selector; // Set selector for the form area
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
            const buttons = Array.from(form.querySelectorAll("button[type='submit'], button[type='reset']"))
                .map(btn => this._detachElement(btn));

            const method = form.getAttribute("method") || "POST";
            const action = form.getAttribute("action") || this._uri;
            
            // Bind form submission logic
            this._form.addEventListener("submit", (event) => {

                if (event.defaultPrevented) return; // Prevent double submission

                event.preventDefault();

                const formData = new FormData(this._form);
                
                fetch(action, {
                    method: method,
                    body: formData
                })
                    .then(response => response.text())
                    .then(data => this._update(data))
                    .catch(error => {
                        this._bodyDiv.innerHTML = error.message || "An error occurred.";
                    });
            });

            // Extract the form content for the modal body
            const formContent = [...form.children].filter(el => !el.matches("footer"));

            form.innerHTML = ""; // Clear form content to avoid duplication

            // Add the form buttons
            this._footerDiv.innerHTML = "";
            buttons.forEach(btn => this._footerDiv.appendChild(btn));
            this._footerDiv.appendChild(this._cancelButton);

            // Clear existing content in body and append the new content
            this._bodyDiv.innerHTML = "";
            formContent.forEach(el => this._bodyDiv.appendChild(el));

            this._form.innerHTML = "";
            this._form.appendChild(this._dialogDiv);

            // Clear the DOM element and append the dialog structure
            this._element.innerHTML = "";
            this._element.appendChild(this._form);

            // Bind click event to close the modal when dismiss button is clicked
            this._dialogDiv.querySelectorAll("[data-wx-dismiss='modal']").forEach(button => {
                button.addEventListener("click", () => this.hide());
            });

            // Send the UPDATED_EVENT after updating the modal content
            this._element.dispatchEvent(new CustomEvent(webexpress.webui.Event.UPDATED_EVENT, {
                detail: {
                    form: this._form
                }
            }));
        }
    }

    /**
     * Displays validation errors inside a Bootstrap alert with plain paragraph formatting.
     *
     * @param {Array<{ code: string, message: string, field: string }>} errors - List of validation error objects.
     */
    showValidationErrors(errors) {
        if (!Array.isArray(errors)) return;

        // Clean up previous errors
        this._form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
        this._form.querySelector(".wx-validation-alert")?.remove();

        // Create formatted alert
        const alert = document.createElement("div");
        alert.className = "alert alert-danger wx-validation-alert";
        alert.role = "alert";

        // Combine messages as paragraph block
        const text = errors.map(err => err.message).join("<br>");
        alert.innerHTML = `<strong>Please correct the following:</strong><br>${text}`;

        // Mark fields as invalid
        errors.forEach(error => {
            const input = this._form.querySelector(`[name="${error.field}"]`);
            if (input) input.classList.add("is-invalid");
        });

        // Insert at top of modal body
        const modalBody = this._form.querySelector(".modal-body");
        if (modalBody) {
            modalBody.prepend(alert);
        } else {
            this._form.prepend(alert);
        }
    }

}

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modalform", webexpress.webui.ModalFormCtrl);