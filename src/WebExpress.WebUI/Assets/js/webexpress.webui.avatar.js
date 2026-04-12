/**
 * Read-only avatar display with name and hover info provided as a child element.
 */
webexpress.webui.AvatarCtrl = class extends webexpress.webui.Ctrl {

    /**
     * Initializes the read-only avatar control.
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        // configuration from attributes and data-* settings
        this._id = this._element.id || "";
        this._displayName = this._element.dataset.name || this._element.textContent.trim() || "";
        this._subtitle = this._element.dataset.subtitle || "";
        this._src = this._element.dataset.src || "";
        this._initials = this._element.dataset.initials || this._deriveInitials(this._displayName);
        this._shape = (this._element.dataset.shape === "rect") ? "rect" : "circle";
        this._size = this._parseNumber(this._element.dataset.size, 64, 24, 512);
        this._placement = this._element.dataset.placement || "top"; // top|right|bottom|left
        this._badge = this._element.dataset.badge || "";

        // track previous src to avoid flicker
        this._lastRenderedSrc = null;

        // capture existing hover info child before DOM reb
        const existingInfo = this._element.querySelector(".wx-avatar-info");
        this._infoSource = existingInfo ? existingInfo.cloneNode(true) : null;

        this._initDOM();
        this._bindEvents();
        this._render();
    }

    /**
     * Initializes DOM structure for the avatar.
     */
    _initDOM() {
        // cleanup host content
        while (this._element.firstChild) {
            this._element.removeChild(this._element.firstChild);
        }
        this._element.classList.add("wx-avatar");
        this._element.setAttribute("role", "group");
        this._element.setAttribute("tabindex", "0");

        // root wrapper
        this._root = document.createElement("div");
        this._root.className = "wx-avatar-root";
        this._element.appendChild(this._root);

        // thumbnail / image wrapper
        this._thumb = document.createElement("div");
        this._thumb.className = "wx-avatar-thumb";
        this._thumb.setAttribute("role", "img");
        this._thumb.setAttribute("aria-label", this._displayName ? (this._i18n("webexpress.webui:avatar.of", "Avatar of") + " " + this._displayName) : this._i18n("webexpress.webui:avatar.label", "Avatar"));
        this._root.appendChild(this._thumb);

        // user img
        this._img = document.createElement("img");
        this._img.className = "wx-avatar-img";
        this._img.alt = this._displayName || this._i18n("webexpress.webui:avatar.label", "Avatar");
        this._thumb.appendChild(this._img);

        // fallback initials if no img or img fails
        this._fallback = document.createElement("span");
        this._fallback.className = "wx-avatar-initials";
        this._thumb.appendChild(this._fallback);

        // badge
        this._badgeEl = document.createElement("span");
        this._badgeEl.className = "wx-avatar-badge";
        this._thumb.appendChild(this._badgeEl);

        // text (name, subtitle)
        this._text = document.createElement("div");
        this._text.className = "wx-avatar-text";
        this._root.appendChild(this._text);

        this._nameEl = document.createElement("div");
        this._nameEl.className = "wx-avatar-name";
        this._nameEl.id = this._id ? (this._id + "-name") : "";
        this._text.appendChild(this._nameEl);

        this._subtitleEl = document.createElement("div");
        this._subtitleEl.className = "wx-avatar-subtitle";
        this._text.appendChild(this._subtitleEl);

        // hover card container
        this._card = document.createElement("div");
        this._card.className = "wx-avatar-card";
        this._card.setAttribute("role", "dialog");
        this._card.setAttribute("aria-hidden", "true");
        if (this._nameEl.id) {
            this._card.setAttribute("aria-labelledby", this._nameEl.id);
        }
        this._element.appendChild(this._card);

        // card header
        this._cardHeader = document.createElement("div");
        this._cardHeader.className = "wx-avatar-card-header";
        this._card.appendChild(this._cardHeader);

        this._cardTitle = document.createElement("div");
        this._cardTitle.className = "wx-avatar-card-title";
        this._cardHeader.appendChild(this._cardTitle);

        // card body
        this._cardBody = document.createElement("div");
        this._cardBody.className = "wx-avatar-card-body";
        this._card.appendChild(this._cardBody);

        // inject provided hover info child if present
        if (this._infoSource) {
            this._cardBody.appendChild(this._infoSource);
        } else if (this._subtitle) {
            const p = document.createElement("div");
            p.className = "wx-avatar-card-empty";
            p.textContent = this._subtitle;
            this._cardBody.appendChild(p);
        }
    }

    /**
     * Binds hover, focus and layout events.
     */
    _bindEvents() {
        // hover show/hide
        this._element.addEventListener("mouseenter", () => this._showCard());
        this._element.addEventListener("mouseleave", () => this._hideCard());

        // keyboard focus show/hide
        this._element.addEventListener("focusin", () => this._showCard());
        this._element.addEventListener("focusout", () => {
            setTimeout(() => this._hideCard(), 80);
        });

        // reposition on viewport changes
        window.addEventListener("resize", () => this._positionCard());
        window.addEventListener("scroll", () => this._positionCard(), { passive: true });

        // handle image load/fail
        this._img.onload = () => {
            this._img.style.display = "block";
            this._fallback.style.display = "none";
        };
        this._img.onerror = () => {
            this._img.style.display = "none";
            this._fallback.style.display = "flex";
        };
    }

    /**
     * Renders the avatar visuals and hover card.
     */
    _render() {
        // shape, size
        const sizePx = this._size + "px";
        this._thumb.style.width = sizePx;
        this._thumb.style.height = sizePx;
        this._thumb.style.borderRadius = (this._shape === "rect") ? "0.24em" : "50%";
        this._thumb.classList.toggle("rect", this._shape === "rect");

        // Name/Subtitel
        this._nameEl.textContent = this._displayName || "";
        this._subtitleEl.textContent = this._subtitle || "";
        this._subtitleEl.style.display = this._subtitle ? "block" : "none";

        // Badge
        this._badgeEl.textContent = this._badge || "";
        this._badgeEl.style.display = this._badge ? "inline-block" : "none";

        // image or initials
        this._updateImage(this._src);

        // Card Titel
        this._cardTitle.textContent = this._displayName || "";

        // position hover card
        this._positionCard();
    }

    /**
     * Updates the image source with a fallback to initials.
     * @param {string} src
     */
    _updateImage(src) {
        if (src && src !== this._lastRenderedSrc) {
            this._fallback.textContent = this._initials || "";
            this._fallback.style.display = "flex";
            this._img.style.display = "none";
            this._img.src = src;
            this._lastRenderedSrc = src;
        } else if (!src) {
            this._img.removeAttribute("src");
            this._img.style.display = "none";
            this._fallback.style.display = "flex";
            this._fallback.textContent = this._initials || "";
            this._lastRenderedSrc = null;
        }
    }

    /**
     * Shows the hover card.
     */
    _showCard() {
        this._card.setAttribute("aria-hidden", "false");
        this._card.classList.add("show");
        this._positionCard();
    }

    /**
     * Hides the hover card.
     */
    _hideCard() {
        this._card.setAttribute("aria-hidden", "true");
        this._card.classList.remove("show");
    }

    /**
     * Positions the hover card according to placement.
     */
    _positionCard() {
        const rect = this._element.getBoundingClientRect();
        const cardRect = this._card.getBoundingClientRect();
        const offset = 10;
        let top = 0, left = 0;

        // Ensure card is always inside viewport
        if (this._placement === "top") {
            top = rect.top - cardRect.height - offset;
            left = rect.left + (rect.width - cardRect.width) / 2;
        } else if (this._placement === "right") {
            top = rect.top + (rect.height - cardRect.height) / 2;
            left = rect.right + offset;
        } else if (this._placement === "bottom") {
            top = rect.bottom + offset;
            left = rect.left + (rect.width - cardRect.width) / 2;
        } else { // left
            top = rect.top + (rect.height - cardRect.height) / 2;
            left = rect.left - cardRect.width - offset;
        }
        // Clamp to viewport
        const docTop = window.scrollY || window.pageYOffset || 0;
        const docLeft = window.scrollX || window.pageXOffset || 0;
        const maxLeft = Math.max(0, Math.min(left + docLeft, window.innerWidth - cardRect.width));
        const maxTop = Math.max(0, Math.min(top + docTop, window.innerHeight - cardRect.height));

        this._card.style.top = maxTop + "px";
        this._card.style.left = maxLeft + "px";
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
        if (n < min) return min;
        if (n > max) return max;
        return n;
    }

    /**
     * Public API: updates the display name and re-renders.
     * @param {string} name
     */
    set name(name) {
        this._displayName = name || "";
        this._initials = this._deriveInitials(this._displayName);
        this._render();
    }
    get name() {
        return this._displayName;
    }

    /**
     * Public API: updates the image source and re-renders.
     * @param {string} src
     */
    set src(src) {
        this._src = src || "";
        this._render();
    }
    get src() {
        return this._src;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-avatar", webexpress.webui.AvatarCtrl);