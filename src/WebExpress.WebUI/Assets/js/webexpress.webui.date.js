/**
 * Read-only date (or date range) display control.
 */
webexpress.webui.DateCtrl = class extends webexpress.webui.Ctrl {

    /**
     * Constructor
     * @param {HTMLElement} element host element
     */
    constructor(element) {
        super(element);

        // read attributes
        this._rawValue = element.textContent.trim();

        // cleanup element
        element.removeAttribute("data-value");
        element.classList.add("wx-date");
        element.innerHTML = "";

        // output
        const span = document.createElement("span");
        const icon = document.createElement("i");
        icon.classList.add("fa-solid", "fa-calendar-days");
        span.appendChild(icon);
        
        this._span = document.createElement("span");
        span.appendChild(this._span);
        element.appendChild(span);
        
        this.render();
    }

    /**
     * Writes current formatted value to DOM.
     */
    render() {
        this._span.textContent = this._rawValue;
    }

    /**
     * Raw underlying value string (single date or 'date1;date2' for range).
     * @returns {string} raw value
     */
    get value() {
        return this._rawValue;
    }

    /**
     * Sets new value (single date or 'd1;d2' if in range mode) and re-renders.
     * Fires CHANGE_VALUE_EVENT when the final formatted output changes.
     * @param {string|Date|null|undefined} val new value
     */
    set value(val) {
        this._rawValue = val;
        this.render();
    }
};

// register class
webexpress.webui.Controller.registerClass("wx-webui-date", webexpress.webui.DateCtrl);