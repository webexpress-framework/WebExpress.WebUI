/**
 * A modular confirm form.
 * Triggers the following events:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 */
webexpress.webui.ModalConfirm = class extends webexpress.webui.ModalCtrl {
    _confirmButton = document.createElement("button");

    /**
     * Constructor
     */
    constructor() {
        super(document.createElement("div"));

        document.body.appendChild(this._element);
    }

    /**
     * Sets the confirmation message and action to execute when confirmed.
     * @param {string} header - The confirmation header.
     * @param {string} message - The confirmation message.
     * @param {function} action - The function to execute upon confirmation.
     */
    confirmation(header, message, action) {

        // Create confirm button
        this._confirmButton.type = "button";
        this._confirmButton.className = "btn btn-danger";
        this._confirmButton.textContent = this._i18n("webexpress.webui:confirm", "Confirm");
        this._confirmButton.onclick = () => {
            if (typeof action === "function") {
                action();
            }
            this.hide();
        };

        // Update modal content
        this._headerDiv.innerHTML = `<h5>${this._i18n(header, "Confirmation") }</h5>`;
        this._bodyDiv.innerHTML = `<p>${message}</p>`;

        // Create footer buttons
        this._footerDiv.innerHTML = "";
        this._cancelButton.setAttribute("data-wx-dismiss", "modal");

        this._footerDiv.appendChild(this._confirmButton);
        this._footerDiv.appendChild(this._cancelButton);

        this.update();
    }
}
