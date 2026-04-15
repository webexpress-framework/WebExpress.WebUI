/// <summary>
/// Represents a password input control with a toggle button to show or hide the password.
/// </summary>
webexpress.webui.InputPasswordCtrl = class extends webexpress.webui.Ctrl {
    /**
     * The current password value.
     * @type {string}
     */
    _value = "";

    /**
     * Whether the password is currently visible.
     * @type {boolean}
     */
    _visible = false;

    /**
     * Whether the control is disabled.
     * @type {boolean}
     */
    _disabled = false;

    /**
     * The hidden input that stores the value for form submission.
     * @type {HTMLInputElement}
     */
    _hiddenInput = null;

    /**
     * The visible input element.
     * @type {HTMLInputElement}
     */
    _input = null;

    /**
     * The toggle button element.
     * @type {HTMLButtonElement}
     */
    _toggleBtn = null;

    /**
     * The icon element inside the toggle button.
     * @type {HTMLElement}
     */
    _toggleIcon = null;

    /**
     * Construct new InputPasswordCtrl.
     * @param {HTMLElement} element - host element for the password control.
     */
    constructor(element) {
        super(element);

        this._value = element.dataset.value || "";
        this._disabled = element.dataset.disabled === "true";

        var name = element.getAttribute("name") || element.dataset.name || "";
        var placeholder = element.dataset.placeholder || "";
        var minLength = element.dataset.minlength || null;
        var maxLength = element.dataset.maxlength || null;

        // clean up data attributes
        element.removeAttribute("data-value");
        element.removeAttribute("data-disabled");
        element.removeAttribute("data-name");
        element.removeAttribute("data-placeholder");
        element.removeAttribute("data-minlength");
        element.removeAttribute("data-maxlength");
        element.textContent = "";

        // create hidden input for form submission
        this._hiddenInput = document.createElement("input");
        this._hiddenInput.type = "hidden";
        this._hiddenInput.name = name;
        this._hiddenInput.value = this._value;

        // create input group wrapper
        var inputGroup = document.createElement("div");
        inputGroup.className = "input-group";

        // create password input
        this._input = document.createElement("input");
        this._input.type = "password";
        this._input.className = "form-control";
        this._input.value = this._value;
        this._input.disabled = this._disabled;
        this._input.placeholder = placeholder;

        if (minLength !== null) {
            this._input.minLength = parseInt(minLength, 10);
        }
        if (maxLength !== null) {
            this._input.maxLength = parseInt(maxLength, 10);
        }

        // create toggle button
        this._toggleBtn = document.createElement("button");
        this._toggleBtn.type = "button";
        this._toggleBtn.className = "btn btn-outline-secondary";
        this._toggleBtn.disabled = this._disabled;
        this._toggleBtn.title = this._i18n("webexpress.webui:password.toggle", "Show password");

        this._toggleIcon = document.createElement("i");
        this._toggleIcon.className = "fas fa-eye";
        this._toggleBtn.appendChild(this._toggleIcon);

        // assemble DOM
        inputGroup.appendChild(this._input);
        inputGroup.appendChild(this._toggleBtn);

        element.appendChild(this._hiddenInput);
        element.appendChild(inputGroup);

        // attach event handlers
        this._input.addEventListener("input", () => {
            this._value = this._input.value;
            this._hiddenInput.value = this._value;

            this._dispatch(webexpress.webui.Events.CHANGE_VALUE_EVENT, {
                value: this._value
            });
        });

        this._toggleBtn.addEventListener("click", () => {
            this._visible = !this._visible;
            this.render();
        });
    }

    /**
     * Renders the control, updating the input type and toggle icon.
     */
    render() {
        if (this._visible) {
            this._input.type = "text";
            this._toggleIcon.className = "fas fa-eye-slash";
            this._toggleBtn.title = this._i18n("webexpress.webui:password.hide", "Hide password");
        } else {
            this._input.type = "password";
            this._toggleIcon.className = "fas fa-eye";
            this._toggleBtn.title = this._i18n("webexpress.webui:password.toggle", "Show password");
        }
    }

    /**
     * Gets the current password value.
     * @returns {string} The password value.
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the password value.
     * @param {string} val - The new password value.
     */
    set value(val) {
        this._value = val || "";
        this._input.value = this._value;
        this._hiddenInput.value = this._value;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-input-password", webexpress.webui.InputPasswordCtrl);
