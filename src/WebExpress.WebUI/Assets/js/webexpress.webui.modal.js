/**
 * A modular window/dialog.
 * The following events are triggered:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 */
webexpress.webui.ModalCtrl = class extends webexpress.webui.Ctrl {
    _title = null;
    _close = null;
    _size = null;
    _content = null;
    _dialog = $("<div class='modal-dialog modal-dialog-scrollable'>");
    
    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the modal control.
     */
    constructor(element) {
        super(element);

        this._close = $(element).data("close-label") ?? "Close"; // Get the close button label, defaulting to "Close"
        this._title = $(element).data("title") ?? null; // Retrieve the title for loading content
        this._size = $(element).data("size") ?? null;
        this._content = [...$(element)[0].childNodes].map(node => {
            return $(node).clone(true, true)[0];
        });
        
        // Cleanup the DOM element and prepare it for usage
        $(this._element)
            .removeAttr("data-close-label data-title data-size") // Remove attributes that are no longer needed
            .empty() // Clear any existing content
            .addClass("modal fade") // Add a specific class for styling
            .attr("tabindex", "-1")
            .attr("aria-hidden", "true");
            
        this._dialog.addClass(this._size); // Create a modal dialog container
    }
    
    /**
     * Updates the modal content with fetched data from the URI.
     */
    update() {
        const header = $("<div class='modal-header'>")
            .append($("<h1 class='modal-title fs-5'>").text(this._title))
            .append($("<button type='button' class='btn-close' data-wx-dismiss='modal'>").attr("aria-label", this._close));
        const body = $("<div class='modal-body'>").append(this._content);
        const footer = $("<div class='modal-footer'>")
            .append($("<button type='button' class='btn btn-secondary' data-wx-dismiss='modal'>").text(this._close));
        const content = $("<div class='modal-content'>");
        
        // Remove previous modal content before appending new content
        $(this._element).empty(); 
        this._dialog.empty();

        content.append(header);
        content.append(body);
        content.append(footer);
        this._dialog.append(content);
        
        $(this._element).append(this._dialog); 
        
        // Close modal when clicking any element with data-wx-dismiss="modal" inside this specific dialog
        this._dialog.find("[data-wx-dismiss='modal']").click(function() {
            this.hide(); // Hide only this modal dialog
        }.bind(this));

    }

    /**
     * Displays the modal by retrieving or creating its Bootstrap instance.
     * Ensures the modal is properly initialized before showing it.
     */
    show() {
        this.update(); 
        const modalInstance = bootstrap.Modal.getOrCreateInstance(this._element);
        modalInstance.show(); // Opens the modal
        
        $(document).trigger(webexpress.webui.Event.MODAL_SHOW_EVENT, {
            id: $(this._element).attr("id")
        });
    }

    /**
     * Hides the modal by retrieving its Bootstrap instance.
     * If an instance exists, it triggers the hide action.
     */
    hide() {
        const modalInstance = bootstrap.Modal.getInstance(this._element);
        modalInstance?.hide(); // Closes the modal
        
        // Wait until modal is completely hidden before disposing it
        $(this._element).on('hidden.bs.modal', () => {
            // Remove modal content
            $(this._element).empty();
            
            $(document).trigger(webexpress.webui.Event.MODAL_HIDE_EVENT, {
                id: $(this._element).attr("id")
            });
        });
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modal", webexpress.webui.ModalCtrl);