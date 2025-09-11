/**
 * A modular window/dialog.
 * The following events are triggered:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 * - webexpress.webui.DATA_REQUESTED_EVENT
 * - webexpress.webui.DATA_ARRIVED_EVENT
 */
webexpress.webui.ModalPageCtrl = class extends webexpress.webui.ModalCtrl {
    constructor(element) {
        super(element);

        this._uri = element.getAttribute("data-uri") || ""; // Retrieve the URI for loading content
        this._selector = element.getAttribute("data-selector") || "body"; // Retrieve the selector for the content area

        // Cleanup the DOM element
        element.removeAttribute("data-uri");
        element.removeAttribute("data-selector");
    }

    /**
     * Updates the modal content with fetched data from the URI.
     * @param {string} response - The HTML response retrieved from the server.
     */
    _update(response) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, "text/html");

        this._contentDiv = doc.querySelector(this._selector); // Locate the main content area

        // Clear existing content in body and append the new content
        this._bodyDiv.innerHTML = "";
        this._bodyDiv.appendChild(this._contentDiv);

        // Clear the DOM element and append the dialog structure
        this._element.innerHTML = "";
        this._element.appendChild(this._dialogDiv);

        // Bind click event to close the modal when dismiss button is clicked
        this._dialogDiv.querySelectorAll("[data-wx-dismiss='modal']").forEach(button => {
            button.addEventListener("click", () => this.hide());
        });
    }

    /**
     * Displays the modal by retrieving or creating its Bootstrap instance.
     * Ensures the modal is properly initialized before showing it.
     */
    show() {
        // Show placeholder while loading content
        const placeholder = document.createElement("p");
        placeholder.classList.add("placeholder-glow");
        placeholder.innerHTML = `
            <div class="placeholder col-4 placeholder-lg"></div>
            <p></p>
            <div class="placeholder col-8"></div>
            <span class="placeholder col-5 me-2"></span>
            <span class="placeholder col-4"></span>
            <div class="placeholder col-7"></div>
        `;

        this._bodyDiv.innerHTML = "";
        this._bodyDiv.appendChild(placeholder);

        this._element.innerHTML = "";
        this._element.appendChild(this._dialogDiv);

        this._dialogDiv.querySelectorAll("[data-wx-dismiss='modal']").forEach(button => {
            button.addEventListener("click", () => this.hide());
        });

        const modalInstance = bootstrap.Modal.getOrCreateInstance(this._element);
        modalInstance.show(); // Opens the modal

        // Trigger custom event for showing the modal
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.MODAL_SHOW_EVENT, {
            detail: { sender: this._element, id: this._element.id }
        }));

        // Load content dynamically after the modal is shown
        this._element.addEventListener("shown.bs.modal", () => {
            // Trigger event when data is requested
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DATA_REQUESTED_EVENT, {
                detail: { sender: this._element, id: this._element.id }
            }));

            if (this._uri) {
                fetch(this._uri)
                    .then(response => response.text())
                    .then(data => {
                        this._update(data);

                        // Trigger event when data has successfully arrived
                        this._element.dispatchEvent(new CustomEvent(webexpress.webui.Event.DATA_ARRIVED_EVENT, {
                            detail: { sender: this._element, id: this._element.id, response: data }
                        }));
                    });
            } else {
                this._update(this._element.innerHTML);
            }
        });
    }
}

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modal-page", webexpress.webui.ModalPageCtrl);