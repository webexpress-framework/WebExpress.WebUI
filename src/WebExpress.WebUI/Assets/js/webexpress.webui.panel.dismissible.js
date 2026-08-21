/**
 * A dismissible container panel with a title bar and an "x" dismiss button
 * in the top-right corner.
 *
 * The panel can be hidden by the user (dismiss button or toggle()) and re-shown
 * programmatically via show() / toggle(). External controls reactivate the
 * panel via the "show" bind, which listens for SELECT_ITEM_EVENT (or any other
 * configured event) on a source element and calls show() on this control.
 *
 * Public API:
 *   show()      - reveals the panel (no-op if already visible)
 *   hide()      - hides the panel (no-op if already hidden)
 *   toggle()    - flips between shown and hidden
 *   isVisible   - read-only boolean reflecting the current state
 *
 * Emits:
 *   webexpress.webui.Event.SHOW_EVENT - when the panel becomes visible
 *   webexpress.webui.Event.HIDE_EVENT - when the panel becomes hidden
 */
webexpress.webui.PanelDismissibleCtrl = class extends webexpress.webui.Ctrl {
    // state
    _visible = true;

    // dom references
    _header = null;
    _title = null;
    _dismissBtn = null;
    _body = null;

    /**
     * Construct a new PanelDismissibleCtrl instance.
     * Reads configuration from data attributes:
     * - data-title:           panel title text (i18n key allowed)
     * - data-initial-hidden:  start collapsed ("true"/"false", default false)
     * - data-dismiss-aria:    aria-label for the dismiss button
     * @param {HTMLElement} element - The host DOM element for this controller.
     */
    constructor(element) {
        super(element);

        const titleText = element.dataset.title || "";
        const initialHidden = element.dataset.initialHidden === "true";
        const dismissAria = element.dataset.dismissAria || "close";

        // preserve user-supplied content - everything below the header becomes the body
        const contentNodes = Array.from(element.childNodes).map((n) => this._detachElement(n));

        ["data-title", "data-initial-hidden", "data-dismiss-aria"].forEach((attr) => element.removeAttribute(attr));

        // Bootstrap's "fade" + "show" combo drives the opacity transition the
        // alert close button uses, so dismissing the panel fades out and
        // re-showing fades back in.
        element.classList.add("wx-panel-dismissible", "fade");

        this._header = this._createHeader(titleText, dismissAria);
        this._body = this._createBody(contentNodes);

        element.appendChild(this._header);
        element.appendChild(this._body);

        this._visible = !initialHidden;
        this._applyVisibility(false);
    }

    /**
     * Read-only getter for the current visibility state.
     * @returns {boolean} True when the panel is shown, false when hidden.
     */
    get isVisible() {
        return this._visible;
    }

    /**
     * Reveal the panel. Dispatches SHOW_EVENT exactly once per transition.
     */
    show() {
        if (this._visible) return;
        this._visible = true;
        this._applyVisibility(true);
    }

    /**
     * Hide the panel. Dispatches HIDE_EVENT exactly once per transition.
     */
    hide() {
        if (!this._visible) return;
        this._visible = false;
        this._applyVisibility(true);
    }

    /**
     * Flip the visibility state. Convenience for show()/hide().
     */
    toggle() {
        this._visible ? this.hide() : this.show();
    }

    /**
     * Updates the title text dynamically.
     * @param {string} value - New title text.
     */
    setTitle(value) {
        if (this._title) {
            this._title.textContent = value ?? "";
        }
    }

    /**
     * Apply the current visibility to the DOM and optionally fire an event.
     *
     * Uses the same fade pattern Bootstrap's alert / toast components rely on:
     * the host carries the .fade class permanently; toggling .show drives the
     * opacity transition; .d-none is only added once the transition finishes
     * so the fade-out is actually visible before the element is taken out of
     * the layout. SHOW_EVENT / HIDE_EVENT fire after the animation completes.
     *
     * @param {boolean} fireEvent - true to animate and dispatch SHOW_EVENT/HIDE_EVENT.
     */
    _applyVisibility(fireEvent) {
        this._element.setAttribute("aria-hidden", this._visible ? "false" : "true");

        // initial setup (no animation): drop the layout immediately, no event.
        if (!fireEvent) {
            this._element.classList.toggle("show", this._visible);
            this._element.classList.toggle("d-none", !this._visible);
            return;
        }

        // cancel any in-flight transition listener from a previous toggle.
        if (this._transitionEndHandler) {
            this._element.removeEventListener("transitionend", this._transitionEndHandler);
            this._transitionEndHandler = null;
        }
        if (this._fadeFallbackTimer) {
            clearTimeout(this._fadeFallbackTimer);
            this._fadeFallbackTimer = null;
        }

        const duration = this._readFadeDuration();

        if (this._visible) {
            // Make element part of the layout, then on the next frame add .show
            // so the opacity transition actually animates from 0 to 1.
            this._element.classList.remove("d-none");
            requestAnimationFrame(() => {
                this._element.classList.add("show");
            });
            this._runAfterTransition(duration, () => {
                this._dispatch(webexpress.webui.Event.SHOW_EVENT, {});
            });
        } else {
            // Remove .show first so the fade-out plays, then add .d-none.
            this._element.classList.remove("show");
            this._runAfterTransition(duration, () => {
                this._element.classList.add("d-none");
                this._dispatch(webexpress.webui.Event.HIDE_EVENT, {});
            });
        }
    }

    /**
     * Runs the callback after the host element's CSS transition has finished,
     * with a setTimeout fallback so missing/short transitions still complete.
     * @param {number} duration - Computed transition duration in milliseconds.
     * @param {Function} done - Callback to invoke once the transition ends.
     */
    _runAfterTransition(duration, done) {
        let fired = false;
        const finish = () => {
            if (fired) return;
            fired = true;

            if (this._transitionEndHandler) {
                this._element.removeEventListener("transitionend", this._transitionEndHandler);
                this._transitionEndHandler = null;
            }
            if (this._fadeFallbackTimer) {
                clearTimeout(this._fadeFallbackTimer);
                this._fadeFallbackTimer = null;
            }

            done();
        };

        if (duration <= 0) {
            // No transition declared - finish on the next tick so callers can
            // still rely on the same async ordering as the animated path.
            this._fadeFallbackTimer = setTimeout(finish, 0);
            return;
        }

        this._transitionEndHandler = (event) => {
            // ignore bubbling transitions from descendants
            if (event.target === this._element && event.propertyName === "opacity") {
                finish();
            }
        };
        this._element.addEventListener("transitionend", this._transitionEndHandler);

        // safety net: transitionend can be missed (display:none mid-flight,
        // window blur, etc.) - finish after duration + 50ms in any case.
        this._fadeFallbackTimer = setTimeout(finish, duration + 50);
    }

    /**
     * Reads the host element's effective transition duration in milliseconds.
     * Falls back to 150ms (Bootstrap's .fade default) when nothing is set.
     * @returns {number} Duration in milliseconds.
     */
    _readFadeDuration() {
        const style = window.getComputedStyle(this._element);
        const raw = (style.transitionDuration || "").split(",")[0]?.trim() || "";

        if (raw.endsWith("ms")) return parseFloat(raw) || 150;
        if (raw.endsWith("s")) return (parseFloat(raw) || 0.15) * 1000;
        return 150;
    }

    /**
     * Build the header bar with a title and the dismiss button.
     * @param {string} titleText - Initial title text.
     * @param {string} dismissAria - aria-label for the dismiss button.
     * @returns {HTMLElement} The header element.
     */
    _createHeader(titleText, dismissAria) {
        const header = document.createElement("div");
        header.className = "wx-panel-dismissible-header d-flex align-items-center";

        this._title = document.createElement("span");
        this._title.className = "wx-panel-dismissible-title";
        this._title.textContent = titleText;
        header.appendChild(this._title);

        // Re-use wx-button-close - the same hover-to-danger animation Bootstrap
        // alerts use - and ms-auto pins the button to the right regardless of
        // the title length or any additional header content.
        this._dismissBtn = document.createElement("button");
        this._dismissBtn.type = "button";
        this._dismissBtn.className = "btn wx-button-close wx-panel-dismissible-close ms-auto";
        this._dismissBtn.setAttribute("aria-label", dismissAria);
        this._dismissBtn.appendChild(Object.assign(document.createElement("i"), {
            className: this._iconClass("xmark")
        }));
        this._dismissBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        });
        header.appendChild(this._dismissBtn);

        return header;
    }

    /**
     * Build the body container and re-attach the preserved content nodes.
     * @param {Node[]} contentNodes - The original child nodes detached in the
     *     constructor.
     * @returns {HTMLElement} The body element.
     */
    _createBody(contentNodes) {
        const body = document.createElement("div");
        body.className = "wx-panel-dismissible-body";
        contentNodes.forEach((node) => {
            if (node) {
                body.appendChild(node);
            }
        });
        return body;
    }
};

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-panel-dismissible", webexpress.webui.PanelDismissibleCtrl);
