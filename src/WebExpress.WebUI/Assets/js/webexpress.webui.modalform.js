/**
 * A modular form.
* The following events are triggered:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 */
webexpress.webui.ModalFormCtrl = class extends webexpress.webui.ModalCtrl {
    _uri = null;
    _selector = null;

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the modal control.
     */
    constructor(element) {
        super(element);
        
        this._uri = $(element).data("uri") ?? ""; // Retrieve the URI for loading content
        this._selector = $(element).data("selector") ?? "form"; // Retrieve the selector for the content area
        
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
        const doc = parser.parseFromString(response, 'text/html');
        
        const title = $("title", doc).text() || ""; // Extract the document title
        const header = $("<div class='modal-header'>")
            .append($("<h1 class='modal-title fs-5'>").text(this._title || title))
            .append($("<button type='button' class='btn-close' data-wx-dismiss='modal'>").attr("aria-label", this._close));
        const body = $("<div class='modal-body'>");
        const footer = $("<div class='modal-footer'>")
            .append($("<button type='button' class='btn btn-secondary' data-wx-dismiss='modal'>").text(this._close));
        const content = $("<div class='modal-content'>");
        const form = $(this._selector, doc);
        const formContent = form?.children(":not('footer')");

        // Remove previous modal content before appending new content
        $(this._element).empty();
        this._dialog.empty();
   
        if (form.length > 0) {
            let method = form.attr("method") ?? "POST";
            let action = form.attr("action") ?? uri;

            form.submit(function (event) {
                event.preventDefault();
                $.ajax({
                    type: method,
                    url: action,
                    data: form.serialize(),
                    success: function (response) {
                        update(response);
                        $('script', dialog).each(function (index, script) {
                            $.globalEval(script.text || script.textContent || script.innerHTML || '');
                        });
                    }.bind(this),
                    error: function (response) {
                        body.append(response);
                    }.bind(this)
                });
            }.bind(this));

            body.append(formContent);

            form.children().remove();
            this._dialog.children().remove();
            content.append(header);
            content.append(body);
            content.append(footer);
            form.append(content);
            this._dialog.append(form);
        }
        
        // Remove previous modal content before appending new content
        $(this._element).empty(); 

        //body.append(main); // Append retrieved content to the modal body

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
        // Load content dynamically when the document is ready
        $(document).ready(function () {
            $.get(this._uri, function (response) { 
                this._update(response); 
                const modalInstance = bootstrap.Modal.getOrCreateInstance(this._element);
                modalInstance.show(); // Opens the modal
                
                $(document).trigger(webexpress.webui.Event.MODAL_SHOW_EVENT, {
                    id: $(this._element).attr("id")
                });
            }.bind(this));
        }.bind(this));
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modalform", webexpress.webui.ModalFormCtrl);