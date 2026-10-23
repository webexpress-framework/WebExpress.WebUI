/// <summary>
/// Represents a login control that provides a user interface for entering credentials
/// and authenticates through the framework credential endpoint.
///
/// On its own the control draws a card with a heading around the form. Inside the body
/// of a dialog the dialog is the card: the title bar names it and the footer holds its
/// actions, so the control renders the form plain there and hands its submit button to
/// the dialog through liftSubmitButton. The login itself - the fields, the request and
/// what follows success and failure - is the same in both places.
/// </summary>
webexpress.webui.LoginCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Where a login counts as framed by a dialog: the content section a dialog control
     * renders on the server, or the body a dialog controller assembled on the client.
     */
    static DIALOG_BODY_SELECTOR = ".wx-modal-content, .modal-body";

    static _nextId = 0;

    /**
     * Construct new LoginCtrl.
     * @param {HTMLElement} element - host element for the login control.
     */
    constructor(element) {
        super(element);

        // read potential prefilled data
        this._prefilledUsername = element.dataset.username || "";
        this._title = element.dataset.title || this._i18n("webexpress.webui:login.title", "Login");
        // the outline level of the title: second level on a page of its own, deeper when embedded
        this._headingLevel = Math.min(6, Math.max(1, parseInt(element.dataset.headingLevel, 10) || 2));
        this._plain = !!element.closest(webexpress.webui.LoginCtrl.DIALOG_BODY_SELECTOR);
        this._loginUri = element.dataset.loginUri || "/api/auth/login";
        this._externalLogins = JSON.parse(element.dataset.externalLogins || "[]");
        this._authenticationFailed = element.dataset.authError === "true";

        // the form and its fields are addressed by id - the labels point at the fields, a
        // button lifted out of the form points back at it - so two logins on one page (a
        // card and a dialog, say) must not share them
        this._id = element.id || ("wx-login-" + (++webexpress.webui.LoginCtrl._nextId));

        // ui references
        this._form = null;
        this._usernameInput = null;
        this._passwordInput = null;
        this._rememberMeInput = null;
        this._loginBtn = null;
        this._buttonGroup = null;

        // clean up the host element
        element.textContent = "";
        element.classList.add(this._plain ? "wx-login-plain" : "wx-login");
        element.removeAttribute("data-login-uri");
        element.removeAttribute("data-username");
        element.removeAttribute("data-title");
        element.removeAttribute("data-heading-level");
        element.removeAttribute("data-external-logins");
        element.removeAttribute("data-auth-error");

        this._buildDom();
        this._attachEventHandlers();
    }

    /**
     * Build the control DOM.
     */
    _buildDom() {
        this._buildForm();

        // framed by a dialog the form is the whole content; the heading would repeat the
        // title bar and the card would frame a frame
        if (this._plain) {
            this._element.appendChild(this._form);
            return;
        }

        // create dialog container using WebExpress card classes
        const dialog = document.createElement("div");
        dialog.className = "card shadow-sm mx-auto";
        dialog.style.maxWidth = "400px";

        // create card body
        const cardBody = document.createElement("div");
        cardBody.className = "card-body p-4";

        // create heading; the h2 class keeps the look whatever level the outline asks for
        const heading = document.createElement("h" + this._headingLevel);
        heading.className = "card-title h2 text-center mb-4";
        heading.textContent = this._title;

        // assemble dialog
        cardBody.appendChild(heading);
        cardBody.appendChild(this._form);
        dialog.appendChild(cardBody);

        // attach to host
        this._element.appendChild(dialog);
    }

    /**
     * Builds the credential form with an explicit browser persistence choice.
     */
    _buildForm() {
        this._form = document.createElement("form");
        this._form.id = this._id + "-form";
        if (this._authenticationFailed) {
            const error = document.createElement("div");
            error.className = "alert alert-danger wx-login-external-error";
            error.setAttribute("role", "alert");
            error.textContent = this._i18n("webexpress.webui:login.external.failed",
                "External sign-in could not be completed. Please try again.");
            this._form.appendChild(error);
        }

        // create username group
        const userGroup = document.createElement("div");
        userGroup.className = "mb-3";

        const userLabel = document.createElement("label");
        userLabel.className = "form-label";
        userLabel.setAttribute("for", this._id + "-username");
        userLabel.textContent = this._i18n("webexpress.webui:login.username", "Username");

        this._usernameInput = document.createElement("input");
        this._usernameInput.className = "form-control";
        this._usernameInput.type = "text";
        this._usernameInput.id = this._id + "-username";
        this._usernameInput.name = "username";
        this._usernameInput.autocomplete = "username";
        this._usernameInput.required = true;
        this._usernameInput.value = this._prefilledUsername;

        userGroup.appendChild(userLabel);
        userGroup.appendChild(this._usernameInput);

        // create password group
        const passGroup = document.createElement("div");
        passGroup.className = "mb-3";

        const passLabel = document.createElement("label");
        passLabel.className = "form-label";
        passLabel.setAttribute("for", this._id + "-password");
        passLabel.textContent = this._i18n("webexpress.webui:login.password", "Password");

        // a plain field, not the marker of the password control: on a bare input the control
        // would strip the id and the name, and with them the label the field is named by
        this._passwordInput = document.createElement("input");
        this._passwordInput.className = "form-control";
        this._passwordInput.type = "password";
        this._passwordInput.id = this._id + "-password";
        this._passwordInput.name = "password";
        this._passwordInput.autocomplete = "current-password";
        this._passwordInput.required = true;

        passGroup.appendChild(passLabel);
        passGroup.appendChild(this._passwordInput);

        // create button group
        this._buttonGroup = document.createElement("div");
        this._buttonGroup.className = "d-grid mt-4";

        this._loginBtn = document.createElement("button");
        this._loginBtn.className = "btn btn-primary";
        this._loginBtn.type = "submit";
        this._loginBtn.id = this._id + "-submit";
        this._loginBtn.textContent = this._i18n("webexpress.webui:login.submit", "Login");

        this._buttonGroup.appendChild(this._loginBtn);

        // assemble form
        this._form.appendChild(userGroup);
        this._form.appendChild(passGroup);
        this._buildRememberMe();
        this._form.appendChild(this._buttonGroup);
        this._buildExternalLogins();
    }

    /**
     * Exposes the same persistence choice for credential and external sign-in.
     * @returns {void}
     */
    _buildRememberMe() {
        const group = document.createElement("div");
        group.className = "form-check form-switch mb-3";
        this._rememberMeInput = document.createElement("input");
        this._rememberMeInput.type = "checkbox";
        this._rememberMeInput.className = "form-check-input";
        this._rememberMeInput.id = this._id + "-remember-me";
        this._rememberMeInput.name = "rememberMe";
        this._rememberMeInput.checked = true;
        this._rememberMeInput.setAttribute("role", "switch");
        this._rememberMeInput.addEventListener("change", () => this._updateExternalLogins());
        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", this._rememberMeInput.id);
        label.textContent = this._i18n("webexpress.webui:login.rememberme", "Stay signed in");
        group.appendChild(this._rememberMeInput);
        group.appendChild(label);
        this._form.appendChild(group);
    }

    /**
     * Updates real link destinations so keyboard navigation and new tabs retain the choice.
     * @returns {void}
     */
    _updateExternalLogins() {
        const links = this._form.querySelectorAll(".wx-login-external a");
        for (let index = 0; index < links.length; index++) {
            const uri = new URL(this._externalLogins[index].uri, window.location.href);
            uri.searchParams.set("rememberMe", String(this._rememberMeInput.checked));
            links[index].setAttribute("href", uri.pathname + uri.search + uri.hash);
        }
    }

    /**
     * Keeps external navigation independent of credential validation and the modal submit button.
     * @returns {void}
     */
    _buildExternalLogins() {
        if (this._externalLogins.length === 0) {
            return;
        }
        const group = document.createElement("div");
        group.className = "wx-login-external d-grid gap-2 mt-3";
        for (const provider of this._externalLogins) {
            const link = document.createElement("a");
            link.className = "btn btn-outline-primary";
            link.setAttribute("href", provider.uri);
            link.textContent = this._i18n("webexpress.webui:login.external.submit", "Sign in with {0}")
                .replace("{0}", provider.label);
            group.appendChild(link);
        }
        this._form.appendChild(group);
        this._updateExternalLogins();
    }

    /**
     * Moves the submit button onto a bar outside the form - the footer of the dialog the
     * control is framed by. The form attribute keeps the button the form's own, so a click
     * on the bar submits and Enter in a field still triggers it. The group that held the
     * button goes with it, because an empty group would leave its gap at the end of the
     * form.
     * @param {HTMLElement} bar - The element that takes the button.
     * @param {HTMLElement} [before] - The child of the bar the button goes in front of; appended without one.
     */
    liftSubmitButton(bar, before = null) {
        this._loginBtn.setAttribute("form", this._form.id);
        bar.insertBefore(this._loginBtn, before);

        if (this._buttonGroup && this._buttonGroup.children.length === 0) {
            this._buttonGroup.remove();
            this._buttonGroup = null;
        }
    }

    /**
     * Puts the caret where typing continues: into the login name, or into the password
     * when the name is already known.
     */
    focus() {
        const target = this._usernameInput.value ? this._passwordInput : this._usernameInput;
        target.focus({ preventScroll: true });
    }

    /**
     * Attach event handlers for UI interaction.
     */
    _attachEventHandlers() {
        // handle form submission
        this._form.addEventListener("submit", (e) => {
            e.preventDefault();

            const username = this._usernameInput.value;
            const password = this._passwordInput.value;

            webexpress.webui.Transport.request(this._loginUri, {
                method: "POST",
                headers: {
                    "X-WebExpress-Auth": "1",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password, rememberMe: this._rememberMeInput.checked })
            }).then((result) => {
                if (result.ok) {
                    // the session cookie arrived with this response, http-only and set by
                    // the server; the reload carries it
                    window.location.reload();
                } else if (result.error.kind === "http") {
                    // the server answered and said no: the credentials
                    alert(this._i18n("webexpress.webui:login.failed", "Login failed. Please check your credentials."));
                } else if (result.error.kind !== "abort") {
                    // nothing answered: the network, or an answer that could not be read
                    console.error("error during login:", result.error.message);
                    alert(this._i18n("webexpress.webui:login.error", "An error occurred. Please try again."));
                }
            });
        });
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-login", webexpress.webui.LoginCtrl);
