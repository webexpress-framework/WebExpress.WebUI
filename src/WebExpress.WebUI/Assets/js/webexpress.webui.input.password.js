/// <summary>
/// Represents a native password input control relying on the browser's built-in show/hide functionality.
/// </summary>
webexpress.webui.InputPasswordCtrl = class extends webexpress.webui.Ctrl {
    _value = "";
    _disabled = false;
    _hiddenInput = null;
    _input = null;

    /**
     * Constructs a new InputPasswordCtrl.
     * @param {HTMLElement} element - The host element for the password control.
     */
    constructor(element) {
        super(element);

        this._value = element.dataset.value || "";
        this._disabled = element.dataset.disabled === "true";

        var id = element.getAttribute("id") || "";
        var name = element.getAttribute("name") || element.dataset.name || "";
        var placeholder = element.dataset.placeholder || "";
        var minLength = element.dataset.minlength || null;
        var maxLength = element.dataset.maxlength || null;

        // clean up data attributes
        element.removeAttribute("id");
        element.removeAttribute("name");
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

        // create password input
        this._input = document.createElement("input");
        this._input.type = "password";
        if (id) {
            this._input.id = id;
        }
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

        // assemble dom
        element.appendChild(this._hiddenInput);
        element.appendChild(this._input);

        // update values on input change
        this._input.addEventListener("input", () => {
            this._value = this._input.value;
            this._hiddenInput.value = this._value;

            this._dispatch(webexpress.webui.Events.CHANGE_VALUE_EVENT, {
                value: this._value
            });
        });
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