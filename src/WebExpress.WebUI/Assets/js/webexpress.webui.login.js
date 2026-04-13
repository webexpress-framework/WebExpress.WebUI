/// <summary>
/// Represents a login control that provides a user interface for entering credentials
/// and performs basic authentication via a fetch request.
/// </summary>
webexpress.webui.LoginCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Construct new LoginCtrl.
     * @param {HTMLElement} element - host element for the login control.
     */
    constructor(element) {
        super(element);

        // read potential prefilled data
        this._prefilledUsername = element.dataset.username || "";
        this._title = element.dataset.title || this._i18n("webexpress.webui:login.title", "Login");

        // ui references
        this._form = null;
        this._usernameInput = null;
        this._passwordInput = null;
        this._loginBtn = null;

        // clean up the host element
        element.textContent = "";
        element.removeAttribute("data-username");
        element.removeAttribute("data-title");

        this._buildDom();
        this._attachEventHandlers();
    }

    /**
     * Build the control DOM.
     */
    _buildDom() {
        // create dialog container using bootstrap card classes
        const dialog = document.createElement("div");
        dialog.className = "card shadow-sm mx-auto";
        dialog.style.maxWidth = "400px";

        // create card body
        const cardBody = document.createElement("div");
        cardBody.className = "card-body p-4";

        // create heading
        const heading = document.createElement("h2");
        heading.className = "card-title text-center mb-4";
        heading.textContent = this._title;

        // create form
        this._form = document.createElement("form");
        this._form.id = "loginForm";

        // create username group
        const userGroup = document.createElement("div");
        userGroup.className = "mb-3";

        const userLabel = document.createElement("label");
        userLabel.className = "form-label";
        userLabel.setAttribute("for", "username");
        userLabel.textContent = this._i18n("webexpress.webui:login.username", "Username");

        this._usernameInput = document.createElement("input");
        this._usernameInput.className = "form-control";
        this._usernameInput.type = "text";
        this._usernameInput.id = "username";
        this._usernameInput.name = "username";
        this._usernameInput.required = true;
        this._usernameInput.value = this._prefilledUsername;

        userGroup.appendChild(userLabel);
        userGroup.appendChild(this._usernameInput);

        // create password group
        const passGroup = document.createElement("div");
        passGroup.className = "mb-3";

        const passLabel = document.createElement("label");
        passLabel.className = "form-label";
        passLabel.setAttribute("for", "password");
        passLabel.textContent = this._i18n("webexpress.webui:login.password", "Password");

        this._passwordInput = document.createElement("input");
        this._passwordInput.className = "form-control";
        this._passwordInput.type = "password";
        this._passwordInput.id = "password";
        this._passwordInput.name = "password";
        this._passwordInput.required = true;

        passGroup.appendChild(passLabel);
        passGroup.appendChild(this._passwordInput);

        // create button group
        const btnGroup = document.createElement("div");
        btnGroup.className = "d-grid mt-4";

        this._loginBtn = document.createElement("button");
        this._loginBtn.className = "btn btn-primary";
        this._loginBtn.type = "submit";
        this._loginBtn.id = "loginBtn";
        this._loginBtn.textContent = this._i18n("webexpress.webui:login.submit", "Login");

        btnGroup.appendChild(this._loginBtn);

        // assemble form
        this._form.appendChild(userGroup);
        this._form.appendChild(passGroup);
        this._form.appendChild(btnGroup);

        // assemble dialog
        cardBody.appendChild(heading);
        cardBody.appendChild(this._form);
        dialog.appendChild(cardBody);

        // attach to host
        this._element.appendChild(dialog);
        this._element.classList.add("wx-login-ctrl-host");
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

            // create basic auth token
            const token = btoa(username + ":" + password);

            // setup the fetch request with the authorization header
            fetch(window.location.href, {
                method: "POST",
                headers: {
                    "Authorization": "Basic " + token,
                    "Content-Type": "application/json"
                }
            }).then((response) => {
                if (response.ok) {
                    // parse the response to extract the session data
                    response.json().then((data) => {
                        // set the session cookie if provided by the server
                        if (data && data.sessionId) {
                            document.cookie = "session=" + encodeURIComponent(data.sessionId) + "; path=/";
                        }

                        // perform the refresh to reload the page with the new cookie
                        window.location.reload();
                    }).catch(() => {
                        // fallback to reload if parsing fails or no json is returned
                        window.location.reload();
                    });
                } else {
                    // notify user about failed login
                    alert(this._i18n("webexpress.webui:login.failed", "Login failed. Please check your credentials."));
                }
            }).catch((error) => {
                // log and notify about network or generic errors
                console.error("error during login:", error);
                alert(this._i18n("webexpress.webui:login.error", "An error occurred. Please try again."));
            });
        });
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-login", webexpress.webui.LoginCtrl);