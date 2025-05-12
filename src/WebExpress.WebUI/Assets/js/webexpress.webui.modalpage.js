/**
 * A modular window/dialog.
 * The following events are triggered:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 * - webexpress.webui.DATA_REQUESTED_EVENT
 * - webexpress.webui.DATA_ARRIVED_EVENT
 */
webexpress.webui.ModalPageCtrl = class extends webexpress.webui.ModalCtrl {
    _uri = null;
    _selector = null;
    
    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the modal control.
     */
    constructor(element) {
        super(element);
        
        this._uri = $(element).data("uri") ?? ""; // Retrieve the URI for loading content
        this._selector = $(element).data("selector") ?? "body"; // Retrieve the selector for the content area
        
        // Cleanup the DOM element
        $(this._element)
            .removeAttr("data-uri data-selector") // Remove attributes that are no longer needed
    }
    
    /**
     * Updates the modal content with fetched data from the URI.
     * @param {string} response - The HTML response retrieved from the server.
     */
    _update(response) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, "text/html");

        this._contentDiv = $(this._selector, doc); // Locate the main content area

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
        // Show placeholder while loading content
        const placeholder = $("<p class='placeholder-glow'>")
            .append($("<div class='placeholder col-4 placeholder-lg'>"))
            .append($("<p>"))
            .append($("<div class='placeholder col-8'>"))
            .append($("<span class='placeholder col-5 me-2'>"))
            .append($("<span class='placeholder col-4'>"))
            .append($("<div class='placeholder col-7'>"));
       
        // Clear existing content in body and append the new content
        this._bodyDiv.empty().append(placeholder);

        // Clear the DOM element and append the dialog structure
        $(this._element).empty().append(this._dialogDiv);
        
        // Bind click event to close the modal when dismiss button is clicked
        this._dialogDiv.find("[data-wx-dismiss='modal']").click(() => {
            this.hide(); // Hide only this modal dialog
        });
        
        const modalInstance = bootstrap.Modal.getOrCreateInstance(this._element);
        modalInstance.show(); // Opens the modal

        // Trigger custom event for showing the modal
        $(document).trigger(webexpress.webui.Event.MODAL_SHOW_EVENT, {
            id: $(this._element).attr("id")
        });

        // Load content dynamically after the modal is shown
        $(this._element).on("shown.bs.modal", () => {
            // Trigger event when data is requested
            $(document).trigger(webexpress.webui.Event.DATA_REQUESTED_EVENT, {
                id: $(this._element).attr("id")
            });
            
            if (this._uri) {
                $.get(this._uri, (response) => {
                    this._update(response);
                    
                    // Trigger event when data has successfully arrived
                    $(this._element).trigger(webexpress.webui.Event.DATA_ARRIVED_EVENT, {
                        id: $(this._element).attr("id"),
                        response: response
                    });
                });
            } else {
                // If no URI is specified, directly render existing content
                this._update($(this._element).html());
            }
        });
    }

};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modalpage", webexpress.webui.ModalPageCtrl);