/**
 * SmartViewCtrl (display-only)
 * Provides a read-only rendering wrapper that extracts a value from an inner editor element
 * (or plain markup) and renders a formatted display representation. No inline editing,
 * no event dispatch for edit lifecycle. The value can still be updated programmatically
 * via the public getter/setter.
 */
webexpress.webui.SmartViewCtrl = class extends webexpress.webui.Ctrl {
    /**
     * The controls the view forwards a new value to. A control outside this set
     * keeps what it shows: the view has no way to tell what a value would mean
     * to it.
     */
    static VALUE_CONTROLS = [
        "DateCtrl",
        "CalendarCtrl",
        "SelectionCtrl",
        "MoveCtrl",
        "TagCtrl",
        "EditorCtrl",
        "ColorCtrl"
    ];

    _value = null;
    _view = null;
    _id = null;

    /**
     * Constructor
     * @param {HTMLElement} element The host element for the display control.
     */
    constructor(element) {
        super(element);

        // capture identifying attributes
        this._id = element.id || null;
        this._view = element.firstElementChild;

        // initial value extraction
        this._value = this._getEditorValue(element);

        // mark element with display class
        element.classList.add("wx-smart-view");
    }

    /**
     * Returns whether the embedded control is an instance of the named control.
     *
     * The class is resolved by name at call time on purpose: a page does not
     * have to ship every control this view knows about, and a plain instanceof
     * against an undefined class throws - which would take the whole view down
     * as soon as one of them is missing.
     *
     * @param {object} ctrl the embedded control to test
     * @param {string} name the control name inside the webexpress.webui namespace
     * @returns {boolean} true when the control is an instance of it
     */
    _isCtrl(ctrl, name) {
        const type = webexpress.webui[name];
        return typeof type === "function" && ctrl instanceof type;
    }

    /**
     * Extracts the most relevant value from the editor child or fallback content.
     * @param {HTMLElement} element The host element.
     * @returns {string} The extracted value.
     */
    _getEditorValue(element) {
        // get the control instance
        const ctrl = webexpress.webui.Controller.getInstanceByElement(this._view);

        if (this._isCtrl(ctrl, "EditorCtrl")) {
            return ctrl.value;
        }

        // input
        if (this._view?.tagName === "INPUT") {
            return this._view.value;
        }

        // textarea
        if (this._view?.tagName === "TEXTAREA") {
            return this._view.value;
        }

        // select
        if (this._view?.tagName === "SELECT") {
            return this._view.options[this._view.selectedIndex]?.value ?? "";
        }

        // hidden input inside wrapper
        let el = this._view?.querySelector("input");
        if (el) {
            return el.value;
        }

        // any data-value deep inside
        el = element.querySelector("[data-value]");
        if (el) {
            return el.getAttribute("data-value");
        }

        // fallback text
        return (this._view?.textContent || "").trim();
    }

    /**
     * Gets the current textual display value (raw).
     * @returns {string} The current raw value as a string.
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the value programmatically and refreshes the display.
     * @param {string|string[]} value The new raw value.
     */
    set value(value) {
        this._value = value;

        // update underlying embedded control if available
        const ctrl = webexpress.webui.Controller.getInstanceByElement(this._view);
        if (ctrl) {
            if (webexpress.webui.SmartViewCtrl.VALUE_CONTROLS.some((name) => this._isCtrl(ctrl, name))) {
                ctrl.value = value;
            }
        } else if (this._view?.tagName === "SELECT") {
            // single select assumption: pick first token
            const first = Array.isArray(value) ? value[0] : String(value).split(";")[0];
            const opt = Array.from(this._view.options).find(o => String(o.value) === String(first));
            if (opt) {
                this._view.value = opt.value;
            }
        } else if (this._view?.tagName === "INPUT" || this._view?.tagName === "TEXTAREA") {
            this._view.value = value;
        }

        this._element.innerHTML = "";
        if (this._view) {
            this._element.appendChild(this._view.cloneNode(true));
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-smart-view", webexpress.webui.SmartViewCtrl);