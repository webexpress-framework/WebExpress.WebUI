/**
 * A modular form.
 * The following events are triggered:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 * - webexpress.webui.DATA_REQUESTED_EVENT
 * - webexpress.webui.DATA_ARRIVED_EVENT 
 */
webexpress.webui.ModalFormCtrl = class extends webexpress.webui.ModalPageCtrl {
    _form = "";
    
    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the modal control.
     */
    constructor(element) {
        super(element);
        
        this._selector = this._selector == "body" ? "form" : this._selector; // Retrieve the selector for the form area
        
        this._form = $("<form>");
    }

    /**
     * Updates the modal content with fetched data from the URI.
     * @param {string} response - The HTML response retrieved from the server.
     */
    _update(response) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, "text/html");

        const form = $(this._selector, doc);
        const buttons = form.find("button[type='submit'], button[type='reset']").detach();

        if (form.length > 0) {
            const method = form.attr("method") || "POST";
            const action = form.attr("action") || this._uri;

            // Bind form submission logic
            this._form.submit((event) => {
                event.preventDefault();
                $.ajax({
                    type: method,
                    url: action,
                    data: form.serialize(),
                    success: (response) => {
                        this._update(response); // Update modal content on success
                    },
                    error: (response) => {
                        this._bodyDiv.empty().append(response.responseText || "An error occurred.");
                    },
                });
            });

            // Extract the form content for the modal body
            const formContent = form.children(":not('footer')");
            
            form.empty(); // Clear form content to avoid duplication
            
            // Add the form buttons 
            this._footerDiv.empty().append(buttons);
            
            // Clear existing content in body and append the new content
            this._bodyDiv.empty().append(formContent);
            this._form.empty().append(this._dialogDiv);
            
            // Clear the DOM element and append the dialog structure
            $(this._element).empty().append(this._form);

            // Bind click event to close the modal when dismiss button is clicked
            this._dialogDiv.find("[data-wx-dismiss='modal']").click(() => {
                this.hide(); // Hide only this modal dialog
            });
        }
    }
}

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modalform", webexpress.webui.ModalFormCtrl);