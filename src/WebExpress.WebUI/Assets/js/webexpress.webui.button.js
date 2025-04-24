/**
 * A simple button with icon and a label.
 * The following events are triggered:
 * - webexpress.webui.click Event triggered when an element is clicked
 */
webexpress.webui.ButtonCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} elem - The DOM element associated with the instance.
     */
    constructor(elem) {
        super(elem);

        // Initialize properties
        this._label = $(elem).text() || "";
        this._icon = $(elem).data("icon") || null;
        this._image = $(elem).data("image") || null;
        this._color = $(elem).data("color") || null;

        // Clean up the DOM element and prepare it for rendering
        $(elem).removeData().empty().addClass("btn wx-button");

        // Render the button
        this.render();

        // Attach the click event listener
        $(elem).click(() => {
            $(document).trigger("webexpress.webui.click", elem.id);
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
        $(this._element).empty();

        // Append image if defined
        if (this._image) {
            const img = $("<img>").attr("src", this._image);
            $(this._element).append(img);
        }

        // Append icon if defined
        if (this._icon) {
            const icon = $("<i>").addClass(this._icon);
            $(this._element).append(icon);
        }

        // Append label
        const buttonText = $("<span>").text(this._label);
        $(this._element).append(buttonText);

        // Update color classes
        this._updateColorClass();
    }

    /**
     * Updates the button's color CSS class.
     * Removes any existing color classes and applies the new color.
     */
    _updateColorClass() {
        $(this._element).removeClass((_, className) => {
            return (className.match(/(^|\s)btn-\S+/g) || []).join(" ");
        });

        if (this._color) {
            $(this._element).addClass(this._color);
        }
    }

    /**
     * Updates the button's appearance.
     * Calls the render method to refresh the DOM element.
     */
    update() {
        this.render();
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-button", webexpress.webui.ButtonCtrl);