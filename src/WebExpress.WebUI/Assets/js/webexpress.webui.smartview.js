/**
 * SmartViewCtrl (display-only)
 * Provides a read-only rendering wrapper that extracts a value from an inner editor element
 * (or plain markup) and renders a formatted display representation. No inline editing,
 * no event dispatch for edit lifecycle. The value can still be updated programmatically
 * via the public getter/setter.
 */
webexpress.webui.SmartViewCtrl = class extends webexpress.webui.Ctrl {
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
     * Extracts the most relevant value from the editor child or fallback content.
     * @param {HTMLElement} element The host element.
     * @returns {string} The extracted value.
     */
    _getEditorValue(element) {
        // get the control instance
        const ctrl = webexpress.webui.Controller.getInstanceByElement(this._view);

        if (ctrl && ctrl instanceof webexpress.webui.EditorCtrl) {
            return ctrl._viewElement?.innerHTML ?? "";
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
            if (ctrl instanceof webexpress.webui.DateCtrl ||
                ctrl instanceof webexpress.webui.CalendarCtrl ||
                ctrl instanceof webexpress.webui.SelectionCtrl ||
                ctrl instanceof webexpress.webui.MoveCtrl ||
                ctrl instanceof webexpress.webui.TagCtrl ||
                ctrl instanceof webexpress.webui.EditorCtrl ||
                ctrl instanceof webexpress.webui.ColorCtrl) {
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