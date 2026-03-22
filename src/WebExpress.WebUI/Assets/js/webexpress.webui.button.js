/**
 * A simple button with icon and a label.
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 */
webexpress.webui.ButtonCtrl = class extends webexpress.webui.Ctrl {
    _lastColorClass = null;

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the instance.
     */
    constructor(element) {
        super(element);

        // initialize properties from data attributes or element content
        this._label = (element.textContent || "").trim();
        this._icon = element.dataset.icon || null;
        this._image = element.dataset.image || null;
        this._color = element.dataset.color || null;
        this._size = element.dataset.size || null;

        // clean up the dom element and set base classes for styling
        element.textContent = "";
        element.removeAttribute("data-icon");
        element.removeAttribute("data-image");
        element.removeAttribute("data-color");
        element.removeAttribute("data-size");
        
        element.classList.add("btn", "wx-button");
        if (this._size) {
            element.classList.add(this._size);
        }

        // render the button ui
        this.render();

        // attach the click event listener
        element.addEventListener("click", (e) => {
            // prevent default action if it's a link-styled button acting as a control
            if (element.tagName === "A" && element.getAttribute("href") === "#") {
                e.preventDefault();
            }
            this._dispatch(webexpress.webui.Event.CLICK_EVENT, { });
        });
    }

    /**
     * Getter for the button label.
     * @returns {string} The current label of the button.
     */
    get label() {
        return this._label;
    }

    /**
     * Setter for the button label.
     * Updates the label and re-renders the button.
     * @param {string} value - The new label value.
     */
    set label(value) {
        if (this._label !== value) {
            this._label = value;
            this.render();
        }
    }

    /**
     * Getter for the button icon.
     * @returns {string|null} The current icon class of the button.
     */
    get icon() {
        return this._icon;
    }

    /**
     * Setter for the button icon.
     * Updates the icon and re-renders the button.
     * @param {string|null} value - The new icon class.
     */
    set icon(value) {
        if (this._icon !== value) {
            this._icon = value;
            this.render();
        }
    }

    /**
     * Getter for the button color.
     * @returns {string|null} The current color class of the button.
     */
    get color() {
        return this._color;
    }

    /**
     * Setter for the button color.
     * Updates the color and re-renders the button.
     * @param {string|null} value - The new color class.
     */
    set color(value) {
        if (this._color !== value) {
            this._color = value;
            this._updateColorClass();
        }
    }

    /**
     * Renders the button control.
     * Updates the DOM element based on the current properties.
     */
    render() {
        // use document fragment to minimize reflows
        const fragment = document.createDocumentFragment();

        // append image if defined
        if (this._image) {
            const img = document.createElement("img");
            img.className = "wx-icon";
            img.src = this._image;
            img.alt = ""; 
            fragment.appendChild(img);
        }

        // append icon if defined
        if (this._icon) {
            const icon = document.createElement("i");
            // directly set classname for performance
            icon.className = this._icon;
            fragment.appendChild(icon);
        }

        // append label
        if (this._label) {
            const buttonText = document.createElement("span");
            buttonText.textContent = this._label;
            fragment.appendChild(buttonText);
        }

        // clear existing content and append new structure
        this._element.textContent = "";
        this._element.appendChild(fragment);

        // ensure color classes are applied
        this._updateColorClass();
    }

    /**
     * Updates the button's color CSS class.
     * Removes any existing color classes and applies the new color.
     */
    _updateColorClass() {
        // efficiently remove the previously set color class
        if (this._lastColorClass) {
            this._element.classList.remove(this._lastColorClass);
            this._lastColorClass = null;
        }

        // add new color class if specified
        if (this._color) {
            this._element.classList.add(this._color);
            this._lastColorClass = this._color;
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-button", webexpress.webui.ButtonCtrl);