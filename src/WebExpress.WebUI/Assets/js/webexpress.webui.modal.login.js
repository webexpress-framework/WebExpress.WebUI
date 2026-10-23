/**
 * A login dialog: the login control framed by a modal, so signing in happens on top
 * of the page the user is on. The dialog lends the login what a card would otherwise
 * supply - the title bar names it, the footer carries its submit button ahead of the
 * close button, which closes the bar - and leaves the login what is its: the fields,
 * the request and what follows success and failure. A variant of the login (the
 * application layer's
 * REST-backed one, say) is therefore framed by this dialog unchanged, because the
 * dialog only takes the button the mounted login hands over.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.MODAL_SHOW_EVENT
 * - webexpress.webui.Event.MODAL_HIDE_EVENT
 */
webexpress.webui.ModalLoginCtrl = class extends webexpress.webui.ModalCtrl {
    _login = null;

    /**
     * Creates a new instance of the class.
     * @param {HTMLElement} element - The DOM element associated with the login dialog.
     */
    constructor(element) {
        super(element);

        this._login = this._mountLogin();

        if (this._login) {
            // the cancelling action closes the bar, so the submit goes in front of it
            this._login.liftSubmitButton(this._footerDiv, this._cancelButton);
        }

        // the credentials are what the dialog opens for, so the caret is already in the
        // field to type into once the dialog stands
        this._element.addEventListener(webexpress.webui.Event.MODAL_SHOW_EVENT, () => {
            if (this._login) {
                this._login.focus();
            }
        });
    }

    /**
     * Resolves the login the dialog frames. The controller framework mounts children
     * ahead of their parent, so the login the server rendered into the content section
     * already stands when the dialog is assembled; a dialog created by hand still holds
     * the unmounted host and mounts it here, which is what keeps both paths on one
     * login instance. The body is mounted as a whole rather than by the login's marker,
     * because the marker names the variant - the plain login, the REST-backed one of
     * the application layer - and the dialog frames any of them.
     * @returns {webexpress.webui.LoginCtrl|null} The mounted login, or null when the body holds none.
     */
    _mountLogin() {
        // mounting is idempotent, so a body the framework already mounted passes through
        webexpress.webui.Controller.createInstances(this._bodyDiv);

        const host = this._bodyDiv.querySelector(".wx-login-plain");

        return host ? webexpress.webui.Controller.getInstanceByElement(host) : null;
    }

    /**
     * Gets the login the dialog frames, for a page that wants to prefill or focus it.
     * @returns {webexpress.webui.LoginCtrl|null} The login controller.
     */
    get login() {
        return this._login;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-modal-login", webexpress.webui.ModalLoginCtrl);
