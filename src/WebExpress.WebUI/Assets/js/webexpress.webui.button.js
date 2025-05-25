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

        // Initialize properties
        this._label = $(element).text() || "";
        this._icon = $(element).data("icon") || null;
        this._image = $(element).data("image") || null;
        this._color = $(element).data("color") || null;
        this._size = $(element).data("size") || null;

        // Clean up the DOM element
        $(element).empty()
            .removeAttr("data-icon data-image data-color")
            .addClass("btn wx-button")
            .addClass(this._size);

        // Render the button
        this.render();

        // Attach the click event listener
        $(element).click(() => {
            $(document).trigger(webexpress.webui.Event.CLICK_EVENT, {
                id: $(this._element).attr("id") || null
            });
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
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-button", webexpress.webui.ButtonCtrl);