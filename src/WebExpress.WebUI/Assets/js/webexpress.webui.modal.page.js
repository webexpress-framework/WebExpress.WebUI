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

        // retrieve the uri for loading content
        this._uri = element.getAttribute("data-uri") || "";

        // retrieve the selector for the content area
        this._selector = element.getAttribute("data-selector") || "body";

        // cleanup the dom element
        element.removeAttribute("data-uri");
        element.removeAttribute("data-selector");

        // load content dynamically after the modal is shown
        this._element.addEventListener("shown.bs.modal", () => {
            // trigger event when data is requested
            this._dispatch(webexpress.webui.Event.DATA_REQUESTED_EVENT, {});

            if (this._uri) {
                fetch(this._uri)
                    .then((response) => {
                        return response.text();
                    })
                    .then((data) => {
                        this._update(data);

                        // trigger event when data has successfully arrived
                        this._element.dispatchEvent(new CustomEvent(webexpress.webui.Event.DATA_ARRIVED_EVENT, {
                            detail: { sender: this._element, id: this._element.id, response: data }
                        }));
                    });
            } else {
                this._update(this._element.innerHTML);
            }
        });
    }

    /**
     * Updates the modal content with fetched data from the URI.
     * @param {string} response - The HTML response retrieved from the server.
     */
    _update(response) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, "text/html");

        // locate the main content area
        const contentNode = doc.querySelector(this._selector);

        // clear existing content in body
        this._bodyDiv.innerHTML = "";

        if (contentNode) {
            // append children directly to avoid creating an extra container layer
            const childNodes = Array.from(contentNode.childNodes);
            for (let i = 0; i < childNodes.length; i++) {
                this._bodyDiv.appendChild(childNodes[i]);
            }
        }

        // clear the dom element and append the dialog structure
        this._element.innerHTML = "";
        this._element.appendChild(this._dialogDiv);

        // bind click event to close the modal when dismiss button is clicked
        const dismissButtons = this._dialogDiv.querySelectorAll("[data-wx-dismiss='modal']");
        for (let i = 0; i < dismissButtons.length; i++) {
            dismissButtons[i].addEventListener("click", () => {
                this.hide();
            });
        }
    }

    /**
     * Displays the modal by retrieving or creating its Bootstrap instance.
     * Ensures the modal is properly initialized before showing it.
     */
    show() {
        // show placeholder while loading content
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

        const dismissButtons = this._dialogDiv.querySelectorAll("[data-wx-dismiss='modal']");
        for (let i = 0; i < dismissButtons.length; i++) {
            dismissButtons[i].addEventListener("click", () => {
                this.hide();
            });
        }

        // remove all known size classes
        this._dialogDiv.classList.remove("modal-sm", "modal-md", "modal-lg", "modal-xl", "modal-fullscreen");

        if (this._size) {
            // apply modal size class
            this._dialogDiv.classList.add(this._size);
        }

        const modalInstance = bootstrap.Modal.getOrCreateInstance(this._element);

        // opens the modal
        modalInstance.show();

        // trigger custom event for showing the modal
        this._dispatch(webexpress.webui.Event.MODAL_SHOW_EVENT, {});
    }

    /**
     * Gets the URI used to load the modal content.
     *
     * @returns {string} The URI from which the modal content is retrieved.
     */
    get uri() {
        return this._uri;
    }

    /**
     * Sets the URI used to load the modal content.
     *
     * @param {string} value The URI from which the modal content will be retrieved.
     */
    set uri(value) {
        this._uri = value;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modal-page", webexpress.webui.ModalPageCtrl);