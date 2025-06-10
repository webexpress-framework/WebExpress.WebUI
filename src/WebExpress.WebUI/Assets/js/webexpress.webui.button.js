/**
 * A simple button with icon and a label.
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 */
webexpress.webui.ButtonCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the instance.
     */
    constructor(element) {
        super(element);

        // Initialize properties from data attributes or element content
        this._label = element.textContent || "";
        this._icon = element.dataset.icon || null;
        this._image = element.dataset.image || null;
        this._color = element.dataset.color || null;
        this._size = element.dataset.size || null;

        // Clean up the DOM element and set base classes for styling
        element.innerHTML = "";
        element.removeAttribute("data-icon");
        element.removeAttribute("data-image");
        element.removeAttribute("data-color");
        element.classList.add("btn", "wx-button");
        if (this._size) {
            element.classList.add(this._size);
        }

        // Render the button UI
        this.render();

        // Attach the click event listener
        element.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CLICK_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id || null
                }
            }));
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
        this._label = value;
        this.update();
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
        this._icon = value;
        this.update();
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
        this._color = value;
        this.update();
    }

    /**
     * Renders the button control.
     * Updates the DOM element based on the current properties.
     */
    render() {
        // Clear existing content
        this._element.innerHTML = "";

        // Append image if defined
        if (this._image) {
            const img = document.createElement("img");
            img.src = this._image;
            this._element.appendChild(img);
        }

        // Append icon if defined
        if (this._icon) {
            const icon = document.createElement("i");
            // Add all icon classes (supporting multiple)
            this._icon.split(" ").forEach(cls => {
                if (cls.trim()) icon.classList.add(cls.trim());
            });
            this._element.appendChild(icon);
        }

        // Append label
        const buttonText = document.createElement("span");
        buttonText.textContent = this._label;
        this._element.appendChild(buttonText);

        // Update color classes
        this._updateColorClass();
    }

    /**
     * Updates the button's color CSS class.
     * Removes any existing color classes and applies the new color.
     */
    _updateColorClass() {
        // Remove all classes starting with 'btn-' (such as Bootstrap classes)
        this._element.className = this._element.className
            .split(" ")
            .filter(cls => !/^btn-\S+/.test(cls))
            .join(" ");
        // Add new color class if specified
        if (this._color) {
            this._element.classList.add(this._color);
        }
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-button", webexpress.webui.ButtonCtrl);