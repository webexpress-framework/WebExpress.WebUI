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
        const initialValue = element.getAttribute("data-value") || "";
        this._tags = this._parseTags(initialValue);

        // extract color configuration from data-color
        this._colorCss = element.getAttribute("data-color-css") || null;
        this._colorStyle = element.getAttribute("data-color-style") || null;

        // build dom structure
        element.classList.add("wx-tag");

        // clean up the dom element
        element.innerHTML = "";
        element.removeAttribute("data-tags");
        element.removeAttribute("data-value");
        element.removeAttribute("data-color-css");
        element.removeAttribute("data-color-style");

        // list for tags
        this._list = document.createElement("ul");
        element.appendChild(this._list);

        // initial rendering
        this.render();
    }

    /**
     * Parses a semicolon-separated string into an array of tags.
     * @param {string} value - The raw string value.
     * @returns {string[]} An array of cleaned tag strings.
     */
    _parseTags(value) {
        if (!value) {
            return [];
        }
        return String(value)
            .split(";")
            .map((t) => { return t.trim(); })
            .filter((t) => { return t.length > 0; });
    }

    /**
     * Renders tags as <li> with x-button before the input field and updates the hidden field.
     * Each tag color is taken from the _color value, default is no color.
     */
    render() {
        // remove all tag elements
        this._list.innerHTML = "";

        if (!this._tags || this._tags.length === 0) {
            return;
        }

        // use document fragment for efficient batch insertion
        const fragment = document.createDocumentFragment();

        // create tag elements
        this._tags.forEach((tag) => {
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

            fragment.appendChild(tagElement);
        });

        this._list.appendChild(fragment);
    }

    /**
     * Gets the tags as a string separated by semicolons.
     * @returns {string} Tags as semicolon-separated string.
     */
    get value() {
        // returns the current tags as string, separated by semicolon
        return this._tags.map((t) => { return t.toLowerCase(); }).join(";");
    }

    /**
     * Sets the tags from a semicolon-separated string or array.
     * @param {string|Array} value - Tags as semicolon-separated string or array.
     */
    set value(value) {
        let newTags = [];

        if (Array.isArray(value)) {
            newTags = value.map((t) => { return String(t).trim(); }).filter((t) => { return t.length > 0; });
        } else if (typeof value === "string") {
            newTags = this._parseTags(value);
        }

        // check for changes before re-rendering (simple shallow comparison)
        if (this._tags.join(";") !== newTags.join(";")) {
            this._tags = newTags;
            this.render();
        }
    }
};

// controller registration
webexpress.webui.Controller.registerClass("wx-webui-tag", webexpress.webui.TagCtrl);