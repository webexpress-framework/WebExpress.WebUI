/**
 * AvatarDropdownCtrl combines an avatar display with a dropdown menu.
 * The avatar acts as the trigger element; clicking it opens the associated
 * dropdown menu with all standard dropdown features (items, headers, dividers,
 * icons, actions).
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CLICK_EVENT
 * - webexpress.webui.Event.CHANGE_VISIBILITY_EVENT
 */
webexpress.webui.AvatarDropdownCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Creates a new avatar dropdown controller instance.
     * Reads configuration from the HTML element's data attributes and child
     * elements, cleans up the DOM, and triggers initial rendering.
     * @param {HTMLElement} element - The DOM element associated with the instance.
     */
    constructor(element) {
        super(element);

        // avatar configuration from data-* attributes
        this._name = element.dataset.name || "";
        this._src = element.dataset.src || "";
        this._initials = element.dataset.initials || this._deriveInitials(this._name);
        this._shape = (element.dataset.shape === "rect") ? "rect" : "circle";
        this._size = this._parseNumber(element.dataset.size, 36, 24, 512);

        // dropdown configuration from data-* attributes
        this._menuCss = element.dataset.menucss || null;
        this._buttonColor = element.dataset.color || null;

        // parse dropdown items from descendant elements
        this._parseItemsFromElements(
            Array.from(element.querySelectorAll(".wx-dropdown-header, .wx-dropdown-divider, .wx-dropdown-item"))
        );

        // clean up the DOM element
        element.innerHTML = "";
        [
            "data-name", "data-src", "data-initials", "data-shape", "data-size",
            "data-color", "data-menucss"
        ].forEach(attr => element.removeAttribute(attr));
        element.classList.add("wx-avatar-dropdown");

        // initial rendering
        this.render();
    }

    /**
     * Parses child elements and extracts menu item data.
     * Reuses the same item structure as DropdownCtrl.
     * @param {HTMLElement[]} elements - Elements to parse.
     */
    _parseItemsFromElements(elements) {
        const items = [];

        elements.forEach(elem => {
            if (elem.classList.contains("wx-dropdown-divider")) {
                items.push({ type: "divider" });
            } else if (elem.classList.contains("wx-dropdown-header")) {
                items.push({
                    type: "header",
                    text: elem.textContent,
                    icon: elem.dataset.icon || null,
                });
            } else {
                const itemClasses = Array.from(elem.classList);
                const dataAttributes = Array.from(elem.attributes)
                    .filter(attr => {
                        if (!attr.name.startsWith("data-")) return false;
                        if (attr.name === "data-uri") return false;
                        if (attr.name === "data-icon") return false;
                        if (attr.name === "data-image") return false;
                        if (attr.name === "data-color") return false;
                        return true;
                    })
                    .map(attr => [attr.name, attr.value]);

                items.push({
                    id: elem.id || null,
                    uri: elem.dataset.uri || "javascript:void(0);",
                    image: elem.dataset.image || null,
                    icon: elem.dataset.icon || null,
                    text: elem.textContent || null,
                    color: elem.dataset.color || null,
                    primaryAction: elem.primaryAction || null,
                    secondaryAction: elem.secondaryAction || null,
                    bind: elem.bind || null,
                    backgroundColor: itemClasses
                        .filter(cls => cls !== "wx-dropdown-item")
                        .find(cls => cls.startsWith("wx-")) || "",
                    disabled: elem.hasAttribute("disabled"),
                    data: dataAttributes,
                    aria: Array.from(elem.attributes)
                        .filter(attr => attr.name.startsWith("aria"))
                        .map(attr => [attr.name, attr.value]),
                    role: elem.getAttribute("role"),
                });
            }
        });

        this._items = items;
    }

    /**
     * Creates a single dropdown menu item element.
     * @param {Object} item - Menu item configuration object.
     * @returns {HTMLElement} The created list item element.
     */
    _createMenuItem(item) {
        const li = document.createElement("li");

        if (item.type === "header") {
            const header = document.createElement("span");
            header.classList.add("dropdown-header");
            if (item.icon) {
                const icon = document.createElement("i");
                icon.className = item.icon;
                header.appendChild(icon);
            }
            header.append(item.text);
            li.appendChild(header);
        } else if (item.type === "divider") {
            li.classList.add("dropdown-divider");
        } else {
            if (!item.disabled) {
                const link = document.createElement("a");
                link.id = item.id;
                link.className = "wx-link dropdown-item";
                if (item.color) link.classList.add(item.color);

                if (item.primaryAction) {
                    for (const [key, value] of Object.entries(item.primaryAction)) {
                        if (value) {
                            const htmlName = `data-wx-primary-${key.toLowerCase()}`;
                            link.setAttribute(htmlName, value);
                        }
                    }
                }

                if (item.secondaryAction) {
                    for (const [key, value] of Object.entries(item.secondaryAction)) {
                        if (value) {
                            const htmlName = `data-wx-secondary-${key.toLowerCase()}`;
                            link.setAttribute(htmlName, value);
                        }
                    }
                }

                if (item.uri) link.href = item.uri;
                if (item.image) {
                    const img = document.createElement("img");
                    img.src = item.image;
                    img.alt = item.text;
                    img.className = "wx-icon";
                    link.appendChild(img);
                }
                if (item.icon) {
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    link.appendChild(icon);
                }
                const span = document.createElement("span");
                span.textContent = item.text;
                link.appendChild(span);

                if (item.role) link.setAttribute("role", item.role);
                item.data?.forEach(([key, value]) => {
                    link.setAttribute(key, value);
                });
                item.aria?.forEach(([key, value]) => {
                    link.setAttribute(key, value);
                });

                link.addEventListener("click", () => {
                    this._dispatch(webexpress.webui.Event.CLICK_EVENT, {
                        item: item
                    });
                });

                li.appendChild(link);
            } else {
                const disabledItem = document.createElement("span");
                disabledItem.className = "dropdown-item text-muted disabled";
                disabledItem.setAttribute("aria-disabled", "true");
                if (item.icon) {
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    disabledItem.appendChild(icon);
                }
                disabledItem.append(item.text);
                li.appendChild(disabledItem);
            }
        }

        return li;
    }

    /**
     * Renders the avatar trigger and dropdown menu.
     */
    render() {
        this._element.innerHTML = "";

        // create avatar trigger button
        const button = document.createElement("button");
        button.className = "wx-avatar-dropdown-toggle";
        button.type = "button";
        button.setAttribute("data-bs-toggle", "dropdown");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", this._name
            ? (this._i18n("webexpress.webui:avatar.of", "Avatar of") + " " + this._name)
            : this._i18n("webexpress.webui:avatar.label", "Avatar"));
        if (this._buttonColor) button.classList.add(this._buttonColor);

        // avatar thumbnail
        const thumb = document.createElement("div");
        thumb.className = "wx-avatar-dropdown-thumb";
        const sizePx = this._size + "px";
        thumb.style.width = sizePx;
        thumb.style.height = sizePx;
        if (this._shape === "rect") {
            thumb.style.borderRadius = "0.24em";
            thumb.classList.add("rect");
        } else {
            thumb.style.borderRadius = "50%";
        }

        // image
        const img = document.createElement("img");
        img.className = "wx-avatar-dropdown-img";
        img.alt = this._name || this._i18n("webexpress.webui:avatar.label", "Avatar");

        // initials fallback
        const fallback = document.createElement("span");
        fallback.className = "wx-avatar-dropdown-initials";
        fallback.textContent = this._initials || "";

        if (this._src) {
            img.onload = () => {
                img.style.display = "block";
                fallback.style.display = "none";
            };
            img.onerror = () => {
                img.style.display = "none";
                fallback.style.display = "flex";
            };
            img.src = this._src;
            // show initials until image loads
            fallback.style.display = "flex";
            img.style.display = "none";
        } else {
            img.style.display = "none";
            fallback.style.display = "flex";
        }

        thumb.appendChild(img);
        thumb.appendChild(fallback);
        button.appendChild(thumb);

        // dropdown menu
        const ul = document.createElement("ul");
        ul.className = "dropdown-menu";
        if (this._menuCss) ul.classList.add(...this._menuCss.split(/\s+/).filter(Boolean));

        this._items.forEach(item => {
            const li = this._createMenuItem(item);
            ul.appendChild(li);
        });

        this._element.appendChild(button);
        this._element.appendChild(ul);

        // visibility events
        button.addEventListener("show.bs.dropdown", () => {
            this._dispatch(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
                visible: true
            });
        });
        button.addEventListener("hide.bs.dropdown", () => {
            this._dispatch(webexpress.webui.Event.CHANGE_VISIBILITY_EVENT, {
                visible: false
            });
        });
    }

    /**
     * Derives initials from a name string.
     * @param {string} name
     * @returns {string}
     */
    _deriveInitials(name) {
        if (!name) return "";
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return "";
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    /**
     * Parses a numeric data attribute with clamping.
     * @param {string|undefined} v
     * @param {number} fallback
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    _parseNumber(v, fallback, min, max) {
        const n = (v !== undefined) ? Number(v) : NaN;
        if (!Number.isFinite(n)) return fallback;
        return Math.max(min, Math.min(max, n));
    }

    /**
     * Gets the display name.
     * @returns {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Sets the display name and re-renders.
     * @param {string} value
     */
    set name(value) {
        this._name = value || "";
        this._initials = this._deriveInitials(this._name);
        this.render();
    }

    /**
     * Gets the image source.
     * @returns {string}
     */
    get src() {
        return this._src;
    }

    /**
     * Sets the image source and re-renders.
     * @param {string} value
     */
    set src(value) {
        this._src = value || "";
        this.render();
    }

    /**
     * Gets the array of menu items.
     * @returns {Array<Object>}
     */
    get items() {
        return this._items;
    }

    /**
     * Sets the array of menu items and re-renders.
     * @param {Array<Object>} value
     */
    set items(value) {
        this._items = value;
        this.render();
    }

    /**
     * Gets additional CSS classes for the dropdown menu.
     * @returns {string|null}
     */
    get menuCSS() {
        return this._menuCss;
    }

    /**
     * Sets additional CSS classes for the dropdown menu and re-renders.
     * @param {string|null} value
     */
    set menuCSS(value) {
        this._menuCss = value;
        this.render();
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-avatar-dropdown", webexpress.webui.AvatarDropdownCtrl);
