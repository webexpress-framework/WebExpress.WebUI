/**
 * A modular confirmation modal specifically for delete actions.
 * Triggers the following events:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 */
webexpress.webui.ModalConfirmDelete = class extends webexpress.webui.ModalConfirm {
    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the modal control.
     */
    constructor(element) {
        super(element);
    }

    /**
     * Sets the delete confirmation message and action to execute when confirmed.
     * @param {function} deleteAction - The function to execute upon confirmation.
     */
    confirmation(deleteAction) {
        super.confirmation("Are you sure you want to delete this item?", deleteAction);

        // Customize button style for deletion
        if (this._confirmButton) {
            this._confirmButton.classList.add("btn-danger");
            this._confirmButton.textContent = "Delete";
        }
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modalconfirmdelete", webexpress.webui.ModalConfirmDelete);
