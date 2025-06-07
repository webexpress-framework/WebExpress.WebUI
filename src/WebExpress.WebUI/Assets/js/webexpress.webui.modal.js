/**
 * A modular window/dialog.
 * The following events are triggered:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 */
webexpress.webui.ModalCtrl = class extends webexpress.webui.Ctrl {
    _close = null;
    _size = null;
    _autoShow = null;
    _contentDiv = null;
    _dialogDiv = $("<div class='modal-dialog modal-dialog-scrollable'>");
    _headerDiv = null;
    _footerDiv = null;
    _bodyDiv = null;

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the modal control.
     */
    constructor(element) {
        super(element);

        // Retrieve custom attributes or use default values
        this._close = $(element).data("close-label") || this._close;
        this._size = $(element).data("size") || null;
        this._autoShow = $(element).data("auto-show") || null;

        // Extract header, content, and footer from the provided HTML structure
        this._headerDiv = $("<div>").append($(".wx-modal-header", this._element).detach());
        this._contentDiv = $("<div>").append($(".wx-modal-content", this._element).children().detach());
        this._footerDiv = $("<div>").append($(".wx-modal-footer", this._element).children().detach());

        // Cleanup the DOM element
        $(this._element)
            .removeAttr("data-close-label data-size data-auto-show") // Remove unnecessary attributes
            .empty() // Clear existing content
            .addClass("modal fade") // Add modal-specific classes
            .attr("tabindex", "-1")
            .attr("aria-hidden", "true");

        // Create modal header
        const header = $("<div class='modal-header'>")
            .append($("<h1 class='modal-title fs-5'>").append(this._headerDiv))
            .append(
                $("<button type='button' class='btn-close' data-wx-dismiss='modal'>")
                    .attr("aria-label", this._close)
            );

        // Create modal footer
        const footer = $("<div class='modal-footer'>")
            .append(this._footerDiv)
            .append(
                $("<button type='button' class='btn btn-secondary' data-wx-dismiss='modal'>")
                    .text(this._close).prepend($("<i class='fas fa-times me-2'>"))
                    
            );
            
        // Create modal body
        this._bodyDiv = $("<div class='modal-body'>");

        // Combine header, body, and footer into modal content
        const modalContent = $("<div class='modal-content'>").append(header, this._bodyDiv, footer);

        // Add size class to dialog and append modal content
        this._dialogDiv.addClass(this._size).append(modalContent);

        if (this._autoShow === true) {
            this.show(); // Automatically show the modal if specified
        }
    }
    
    /**
     * Updates the modal content with fetched data from the URI.
     */
    update() {
        // Clear existing content in body and append the new content
        this._bodyDiv.empty().append(this._contentDiv);

        // Clear the DOM element and append the dialog structure
        $(this._element).empty().append(this._dialogDiv);

        // Bind click event to close the modal when dismiss button is clicked
        this._dialogDiv.find("[data-wx-dismiss='modal']").click(() => {
            this.hide(); // Hide only this modal dialog
        });
    }

    /**
     * Displays the modal by retrieving or creating its Bootstrap instance.
     * Ensures the modal is properly initialized before showing it.
     */
    show() {
        this.update(); // Ensure modal content is up to date
        const modalInstance = bootstrap.Modal.getOrCreateInstance(this._element, {
            backdrop: 'static',
            keyboard: true
        });
        modalInstance.show(); // Open the modal

        // Trigger custom event for showing the modal
        $(document).trigger(webexpress.webui.Event.MODAL_SHOW_EVENT, {
            sender: this._element,
            id: $(this._element).attr("id"),
        });
    }

    /**
     * Hides the modal by retrieving its Bootstrap instance.
     * If an instance exists, it triggers the hide action.
     */
    hide() {
        const modalInstance = bootstrap.Modal.getInstance(this._element);
        modalInstance?.hide(); // Close the modal
        

        // Cleanup content after the modal is fully hidden
        $(this._element).on("hidden.bs.modal", () => {
            $(this._element).empty(); // Clear modal content
            $(document).trigger(webexpress.webui.Event.MODAL_HIDE_EVENT, {
                sender: this._element,
                id: $(this._element).attr("id"),
            });
            
            modalInstance?.dispose(); // Free memory
        });
        
        // Ensure event listeners are properly removed
        $(this._element).off("hidden.bs.modal");
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modal", webexpress.webui.ModalCtrl);