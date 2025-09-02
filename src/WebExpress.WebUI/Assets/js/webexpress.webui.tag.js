/**
 * A control field for adding and removing tags with basic functionality and configuration options.
 * It is based on the behavior of simpletags.js and integrates as a WebExpress WebUI control.
 * The following events are triggered:
 * - webexpress.webui.Event.ADD_EVENT
 * - webexpress.webui.Event.REMOVE_EVENT
 */
webexpress.webui.TagCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor: Initializes the control and DOM structure.
     * @param {HTMLElement} element - Host element for the tag control.
     */
    constructor(element) {
        super(element);

        // extract configuration from attributes
        const initialTags = (element.getAttribute("data-value") || "")
            .split(";")
            .map(t => t.trim())
            .filter(t => t.length > 0);

        // extract color configuration from data-color
        this._colorCss = element.getAttribute("data-color-css") || null;
        this._colorStyle = element.getAttribute("data-color-style") || null;

        // save tag array
        this._tags = initialTags;

        // build DOM structure
        element.classList.add("wx-tag");

        // clean up the DOM element
        element.innerHTML = "";
        element.removeAttribute("data-tags");
        element.removeAttribute("data-color-css");
        element.removeAttribute("data-color-style");

        // list for tags
        this._list = document.createElement("ul");
        element.appendChild(this._list);

        // initial rendering
        this.render();
    }

    /**
     * Renders tags as <li> with x-button before the input field and updates the hidden field.
     * Each tag color is taken from the _color value, default is no color.
     */
    render() {
        // remove all tag elements
        this._list.innerHTML = "";

        // create tag elements with color and remove button
        this._tags.forEach((tag, index) => {
            const tagElement = document.createElement("li");
            tagElement.textContent = tag.toLowerCase();

            // set color if defined
            if (this._colorCss) {
                tagElement.classList.add(this._colorCss);
            } else if (this._colorStyle) {
                tagElement.style.cssText = this._colorStyle;
            } else {
                tagElement.classList.add("wx-tag-primary");
            }

            this._list.appendChild(tagElement);
        });
    }
    
    /**
     * Gets the tags as a string separated by semicolons.
     * @returns {string} Tags as semicolon-separated string.
     */
    get value() {
        // returns the current tags as string, separated by semicolon
        return this._tags.map(t => t.toLowerCase()).join(";");
    }

    /**
     * Sets the tags from a semicolon-separated string or array.
     * @param {string|Array} value - Tags as semicolon-separated string or array.
     */
    set value(value) {
        // sets the tags, accepts array or string (semicolon-separated)
        if (Array.isArray(value)) {
            this._tags = value.map(t => t.trim()).filter(t => t.length > 0);
        } else if (typeof value === "string") {
            this._tags = value.split(";").map(t => t.trim()).filter(t => t.length > 0);
        }
        this.render();
    }
};

// Controller registration
webexpress.webui.Controller.registerClass("wx-webui-tag", webexpress.webui.TagCtrl);