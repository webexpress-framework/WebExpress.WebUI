/**
 * A modular window/dialog.
 * The following events are triggered:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 */
webexpress.webui.ModalCtrl = class extends webexpress.webui.Ctrl {
    _closeLabel = null;
    _size = null;
    _autoShow = null;
    _dialogDiv = document.createElement("div");
    _contentDiv = document.createElement("div");
    _headerDiv = document.createElement("div");
    _titleH1 = document.createElement("h1");
    _bodyDiv = document.createElement("div");
    _footerDiv = document.createElement("div");
    _cancelButton = document.createElement("button");

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the modal control.
     */
    constructor(element) {
        super(element);

        // Retrieve custom attributes or use default values
        this._closeLabel = element.getAttribute("data-close-label") ||
            webexpress.webui.I18N.translate("webexpress.webui:modal.close");
        this._size = element.getAttribute("data-size") || "";
        this._autoShow = element.getAttribute("data-auto-show") === "true";

        // Cleanup the DOM element
        element.removeAttribute("data-close-label");
        element.removeAttribute("data-size");
        element.removeAttribute("data-auto-show");
        element.classList.add("modal", "fade");

        // Create modal elements
        this._bodyDiv.className = "modal-body";
        this._headerDiv.className = "modal-header";
        this._titleH1.className = "modal-title fs-5";
        this._footerDiv.className = "modal-footer";

        // Extract and append children from .wx-modal-header
        const headers = this._element.querySelectorAll(".wx-modal-header");
        headers.forEach(header => {
            this._titleH1.appendChild(this._detachElement(header));
        });

        // Extract and append all .wx-modal-content elements
        const contents = this._element.querySelectorAll(".wx-modal-content");
        contents.forEach(content => {
            this._contentDiv.appendChild(this._detachElement(content));
        });

        // Extract and append all .wx-modal-footer elements
        const footers = this._element.querySelectorAll(".wx-modal-footer");
        footers.forEach(footer => {
            this._footerDiv.appendChild(this._detachElement(footer));
        });

        // Create header content
        this._headerDiv.appendChild(this._titleH1);
        this._bodyDiv.appendChild(this._contentDiv);

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "btn-close";
        closeButton.setAttribute("data-wx-dismiss", "modal");
        closeButton.setAttribute("aria-label", this._closeLabel);
        closeButton.addEventListener("click", () => this.hide());
        this._headerDiv.appendChild(closeButton);

        // Create footer content
        this._cancelButton.type = "button";
        this._cancelButton.className = "btn btn-secondary";
        this._cancelButton.setAttribute("data-wx-dismiss", "modal");
        this._cancelButton.innerHTML = `<i class='fas fa-times me-2'></i>${this._closeLabel}`;
        this._cancelButton.addEventListener("click", () => this.hide());
        this._footerDiv.appendChild(this._cancelButton);

        // Create modal content structure
        this._dialogDiv.className = `modal-dialog modal-dialog-scrollable ${this._size}`;

        const modalContentDiv = document.createElement("div");
        modalContentDiv.className = "modal-content";
        modalContentDiv.appendChild(this._headerDiv);
        modalContentDiv.appendChild(this._bodyDiv);
        modalContentDiv.appendChild(this._footerDiv);

        this._dialogDiv.appendChild(modalContentDiv);
        this._element.appendChild(this._dialogDiv);

        // Auto-show if specified
        if (this._autoShow) {
            this.show();
        }
    }
    
    /**
     * Updates the modal content with fetched data from the URI.
     */
    update() {
        if (!this._element.hasChildNodes()) {
            this._element.appendChild(this._dialogDiv);
        }

        // Bind click event to close the modal when dismiss button is clicked
        const closeButton = this._dialogDiv.querySelector("[data-wx-dismiss='modal']");
        if (closeButton) {
            closeButton.removeEventListener("click", this.hide);
            closeButton.addEventListener("click", () => this.hide()); // Bind click event
        }
    }

    /**
     * Displays the modal by retrieving or creating its Bootstrap instance.
     * Ensures the modal is properly initialized before showing it.
     */
    show() {
        this.update(); // Ensure modal content is refreshed
        const modalInstance = new bootstrap.Modal(this._element, {
            backdrop: "static",
            keyboard: true,
        });
        modalInstance.show();

        // Trigger event for showing the modal
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.MODAL_SHOW_EVENT, {
            detail: { sender: this._element, id: this._element.id }
        }));
    }

    /**
     * Hides the modal by retrieving its Bootstrap instance.
     * If an instance exists, it triggers the hide action.
     */
    hide() {
        const modalInstance = bootstrap.Modal.getInstance(this._element);
        
        this._element.addEventListener("hidden.bs.modal", () => {
            this._element.removeAttribute("style");
            this._element.removeAttribute("aria-hidden");

            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.MODAL_HIDE_EVENT, {
                sender: this._element,
                id: this._element.id 
            }));
        });

        this._element.innerHTML = "";
        this._element.removeAttribute("style");
        this._element.removeAttribute("aria-hidden");
        document.body.focus();

        modalInstance?.hide();
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modal", webexpress.webui.ModalCtrl);