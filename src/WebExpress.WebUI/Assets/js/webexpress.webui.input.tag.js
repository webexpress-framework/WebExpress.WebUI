/**
 * A control field for adding and removing tags with basic functionality and configuration options.
 * It is based on the behavior of simpletags.js and integrates as a WebExpress WebUI control.
 * The following events are triggered:
 * - webexpress.webui.Event.ADD_EVENT
 * - webexpress.webui.Event.REMOVE_EVENT
 */
webexpress.webui.InputTagCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor: Initializes the control and DOM structure.
     * @param {HTMLElement} element - Host element for the tag control.
     */
    constructor(element) {
        super(element);

        // extract configuration from attributes
        const fieldName = element.getAttribute("name") || "tags";
        const initialTags = (element.getAttribute("data-value") || "")
            .split(";")
            .map(t => t.trim())
            .filter(t => t.length > 0);

        // extract color configuration from data-color
        this._colorCss = element.getAttribute("data-color-css") || null;
        this._colorStyle = element.getAttribute("data-color-style") || null;

        // extract and store placeholder text
        this._placeholderText = element.getAttribute("placeholder") || "";

        // save tag array
        this._tags = initialTags;

        // build DOM structure
        element.classList.add("wx-tag");
        element.classList.add("form-control");

        // clean up the DOM element
        element.innerHTML = "";
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-tags");
        element.removeAttribute("data-color-css");
        element.removeAttribute("data-color-style");

        // list for tags
        this._list = document.createElement("ul");
        element.appendChild(this._list);

        // hidden field for form
        this._hidden = document.createElement("input");
        this._hidden.type = "hidden";
        this._hidden.name = fieldName;
        element.appendChild(this._hidden);

        // input field for new tags
        this._input = document.createElement("input");
        this._input.type = "text";
        this._input.className = "input";
        // placeholder will be set dynamically depending on tags present
        this._input.setAttribute("aria-label", this._i18n("webexpress.webui:tag.add", "add Tag"));

        // initial rendering
        this.render();

        // event: Add tag by separator
        this._input.addEventListener("keyup", (event) => {
            const value = this._input.value;
            // check for separator key
            if (event.key === "," || event.key === ";" || event.key === " ") {
                const tags = value.split(/[,; ]+/)
                    .map(t => t.trim())
                    .filter(t => t.length > 0);
                tags.forEach(tag => {
                    if (tag && !this._tags.includes(tag)) {
                        this._tags.push(tag);
                        // fire add event when a tag is added
                        this._dispatch(webexpress.webui.Event.ADD_EVENT, { detail: tag });
                    }
                });
                this._input.value = "";
                this.render();
            }
        });

        // event: Remove last tag with backspace/delete if input is empty
        this._input.addEventListener("keydown", (event) => {
            if ((event.key === "Backspace" || event.key === "Delete") && this._input.value === "") {
                this._tags.pop();
                this.render();
            }
        });

        // also handle cases where value is set via assignment (fires 'change')
        this._hidden.addEventListener("change", () => {
            this.value = this._hidden.value;
        });

        element.appendChild(this._input);
    }

    /**
     * Updates the placeholder visibility depending on tag presence.
     * Placeholder is only shown when there are no tags.
     */
    _updatePlaceholder() {
        // show placeholder only if no tags
        if (this._tags.length === 0) {
            if (this._placeholderText) {
                this._input.setAttribute("placeholder", this._placeholderText);
            }
        } else {
            this._input.removeAttribute("placeholder");
        }
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

            // x-button to remove tag
            const removeBtn = document.createElement("a");
            removeBtn.innerHTML = "&times;";
            removeBtn.href = "#";
            removeBtn.title = this._i18n("webexpress.webui:remove");
            removeBtn.setAttribute("aria-label", `Tag "${tag}" ${removeBtn.title}`);
            removeBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this._tags.splice(index, 1);
                // fire remove event when a tag is removed by click
                this._dispatch(webexpress.webui.Event.REMOVE_EVENT, { detail: tag });
                this.render();
            });

            tagElement.appendChild(removeBtn);
            this._list.appendChild(tagElement);
        });

        // update hidden field
        this._hidden.value = this._tags.map(t => t).join(";");

        // update placeholder visibility
        this._updatePlaceholder();
    }

    /**
     * Gets the tags as a string separated by semicolons.
     * @returns {string} Tags as semicolon-separated string.
     */
    get value() {
        // returns the current tags as string, separated by semicolon
        return this._tags.map(t => t).join(";");
    }

    /**
     * Sets the tags from a semicolon-separated string or array.
     * @param {string|Array} value - Tags as semicolon-separated string or array.
     */
    set value(value) {
        // array input
        if (Array.isArray(value)) {
            this._tags = value
                .map(item => {
                    if (item == null) return null;

                    // object with tag
                    if (typeof item === "object") {
                        const name = item.tag || item.label || item.name;
                        return name ? String(name).trim() : null;
                    }

                    // primitive string
                    if (typeof item === "string") {
                        return item.trim();
                    }

                    return null;
                })
                .filter(t => t && t.length > 0);
        }
        // semicolon-separated string
        else if (typeof value === "string") {
            this._tags = value
                .split(";")
                .map(t => t.trim())
                .filter(t => t.length > 0);
        }
        // fallback
        else {
            this._tags = [];
        }

        this.render();
    }
};

// Controller registration
webexpress.webui.Controller.registerClass("wx-webui-input-tag", webexpress.webui.InputTagCtrl);