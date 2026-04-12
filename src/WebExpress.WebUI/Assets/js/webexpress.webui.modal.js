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
    _headerDiv = document.createElement("div");
    _titleH1 = document.createElement("h1");
    _bodyDiv = document.createElement("div");
    _footerDiv = document.createElement("div");
    _cancelButton = document.createElement("button");
    _fullscreenButton = document.createElement("button");
    _fullscreenMode = "true"; // "true" (css) or "native" or ""

    /**
     * Creates a new instance of the class.
     * @param {HTMLElement} element - The DOM element associated with the modal control.
     */
    constructor(element) {
        super(element);

        // retrieve custom attributes or use default values
        this._closeLabel = element.getAttribute("data-close-label") || this._i18n("webexpress.webui:close");
        this._size = element.getAttribute("data-size") || "";
        this._autoShow = element.getAttribute("data-auto-show") === "true";

        // cleanup the dom element
        element.removeAttribute("data-close-label");
        element.removeAttribute("data-size");
        element.removeAttribute("data-auto-show");
        element.classList.add("modal", "fade");

        // create modal elements
        this._bodyDiv.className = "modal-body";
        this._headerDiv.className = "modal-header";
        this._titleH1.className = "modal-title fs-5 flex-grow-1";
        this._footerDiv.className = "modal-footer";

        // extract and append children from .wx-modal-header
        const headers = this._element.querySelectorAll(".wx-modal-header");
        headers.forEach(header => {
            this._titleH1.appendChild(this._detachElement(header));
        });

        // extract and append all .wx-modal-content elements directly to body div
        const contents = this._element.querySelectorAll(".wx-modal-content");
        contents.forEach(content => {
            this._bodyDiv.appendChild(this._detachElement(content));
        });

        // extract and append all .wx-modal-footer elements
        const footers = this._element.querySelectorAll(".wx-modal-footer");
        footers.forEach(footer => {
            this._footerDiv.appendChild(this._detachElement(footer));
        });

        // create header content
        this._headerDiv.appendChild(this._titleH1);

        if (this._fullscreenMode && this._size !== "modal-fullscreen") {
            // create fullscreen toggle button
            this._fullscreenButton.type = "button";
            this._fullscreenButton.className = "btn wx-button-fullscreen ms-auto";
            this._fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
            this._fullscreenButton.setAttribute("aria-label", "Toggle Fullscreen");
            this._fullscreenButton.addEventListener("click", () => {
                this.toggleFullscreen();
            });
            this._headerDiv.appendChild(this._fullscreenButton);
        }

        // create close button
        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "btn wx-button-close";
        closeButton.setAttribute("data-wx-dismiss", "modal");
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.setAttribute("aria-label", this._closeLabel);
        closeButton.addEventListener("click", () => {
            this.hide();
        });
        this._headerDiv.appendChild(closeButton);

        // create footer content
        this._cancelButton.type = "button";
        this._cancelButton.className = "btn btn-secondary";
        this._cancelButton.setAttribute("data-wx-dismiss", "modal");
        this._cancelButton.innerHTML = `<i class="fas fa-times me-2"></i>${this._closeLabel}`;
        this._cancelButton.addEventListener("click", () => {
            this.hide();
        });
        this._footerDiv.appendChild(this._cancelButton);

        // create modal content structure
        this._dialogDiv.className = `modal-dialog modal-dialog-scrollable ${this._size}`;

        const modalContentDiv = document.createElement("div");
        modalContentDiv.className = "modal-content";
        modalContentDiv.appendChild(this._headerDiv);
        modalContentDiv.appendChild(this._bodyDiv);
        modalContentDiv.appendChild(this._footerDiv);

        this._dialogDiv.appendChild(modalContentDiv);
        this._element.appendChild(this._dialogDiv);

        // auto-show if specified
        if (this._autoShow) {
            this.show();
        }
    }

    /**
     * Toggles the modal fullscreen state.
     */
    toggleFullscreen() {
        // determine mode and toggle accordingly
        if (this._fullscreenMode === "native") {
            // call controller to request/exit native fullscreen
            if (typeof webexpress.webui.Controller !== "undefined" && webexpress.webui.Controller && typeof webexpress.webui.Controller.toggleNativeFullscreen === "function") {
                webexpress.webui.Controller.toggleNativeFullscreen(this._element);
            } else {
                // fallback to css if controller not available
                this._dialogDiv.classList.toggle("modal-fullscreen");
            }
            return;
        }

        // default: css/light fullscreen toggle
        const isFullscreen = this._dialogDiv.classList.toggle("modal-fullscreen");
        const icon = this._fullscreenButton ? this._fullscreenButton.querySelector("i") : null;

        if (isFullscreen) {
            if (icon) {
                icon.classList.remove("fa-expand");
                icon.classList.add("fa-compress");
            }
            this._fullscreenButton.setAttribute("aria-pressed", "true");
            this._dialogDiv.classList.remove("modal-sm", "modal-md", "modal-lg", "modal-xl");

            // set backdrop/body state if needed (css-only)
            document.body.classList.add("modal-open");
        } else {
            if (icon) {
                icon.classList.remove("fa-compress");
                icon.classList.add("fa-expand");
            }
            this._fullscreenButton.setAttribute("aria-pressed", "false");
            this._dialogDiv.classList.add(this._size);

            // restore body state
            document.body.classList.remove("modal-open");
        }
    }

    /**
     * Updates the modal content with fetched data from the URI.
     */
    update() {
        if (!this._element.hasChildNodes()) {
            this._element.appendChild(this._dialogDiv);
        }

        // bind click event to close the modal when dismiss button is clicked
        const closeButton = this._dialogDiv.querySelector("[data-wx-dismiss='modal']");
        if (closeButton) {
            closeButton.removeEventListener("click", this.hide);
            closeButton.addEventListener("click", () => {
                this.hide();
            });
        }

        // remove all known size classes except fullscreen if it was toggled manually
        this._dialogDiv.classList.remove("modal-sm", "modal-md", "modal-lg", "modal-xl", "modal-fullscreen");

        // reset icon state
        const icon = this._fullscreenButton.querySelector("i");
        if (icon) {
            icon.classList.remove("fa-compress");
            icon.classList.add("fa-expand");
        }

        if (this._size) {
            // apply modal size class
            this._dialogDiv.classList.add(this._size);
        }
    }

    /**
     * Displays the modal by retrieving or creating its Bootstrap instance.
     * Ensures the modal is properly initialized before showing it.
     */
    show() {
        // ensure modal content is refreshed
        this.update();

        const modalInstance = new bootstrap.Modal(this._element, {
            backdrop: "static",
            keyboard: true,
        });
        modalInstance.show();

        // trigger event for showing the modal
        this._dispatch(webexpress.webui.Event.MODAL_SHOW_EVENT, {});
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
            this._dispatch(webexpress.webui.Event.MODAL_HIDE_EVENT, {});
        }, { once: true });

        document.body.focus();

        if (modalInstance) {
            modalInstance.hide();
        }
    }

    /**
     * Gets the size of the modal.
     * @returns {string} The size.
     */
    get size() {
        return this._size;
    }

    /**
     * Sets the size of the modal.
     * @param {string} value The size.
     */
    set size(value) {
        this._size = value;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modal", webexpress.webui.ModalCtrl);