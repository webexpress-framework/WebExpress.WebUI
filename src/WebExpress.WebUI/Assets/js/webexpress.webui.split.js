/**
 * A split control for resizable container panels.
 * The following events are triggered:
 * - webexpress.webui.Event.SIZE_CHANGE_EVENT
 * - webexpress.webui.Event.HIDE_EVENT
 * - webexpress.webui.Event.SHOW_EVENT
 */
webexpress.webui.SplitCtrl = class extends webexpress.webui.Ctrl {
    _sidePaneCollapsed = false;
    _sidePanePrevSize = null;

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element for the split control.
     */
    constructor(element) {
        super(element);

        // Read configuration from attributes
        this._orientation = element.getAttribute("data-orientation") === "vertical" ? "vertical" : "horizontal";
        this._minSide = element.hasAttribute("data-min-side") ? parseInt(element.getAttribute("data-min-side"), 10) : null;
        this._maxSide = element.hasAttribute("data-max-side") ? parseInt(element.getAttribute("data-max-side"), 10) : null;
        this._initialSideAttr = element.getAttribute("data-size");
        this._splitClass = element.getAttribute("data-splitter-class") || null;
        this._splitStyle = element.getAttribute("data-splitter-style") || null;
        this._splitterSize = element.getAttribute("data-splitter-size") || null;
        this._paneOrder = element.getAttribute("data-order") || "side-main";
        // Read unit from data-unit attribute, values can be: 'px', 'em', 'rem', '%', default is 'px'
        this._unit = element.getAttribute("data-unit") || "px";

        // Get panes from DOM
        this._sidePane = Array.from(element.children)
            .find(child => child.classList.contains("wx-side-pane"));
        this._detachElement(this._sidePane);

        this._mainPane = Array.from(element.children)
            .find(child => child.classList.contains("wx-main-pane"));
        this._detachElement(this._mainPane);

        // Cleanup DOM attributes
        element.removeAttribute("data-orientation");
        element.removeAttribute("data-min-side");
        element.removeAttribute("data-max-side");
        element.removeAttribute("data-size");
        element.removeAttribute("data-splitter-class");
        element.removeAttribute("data-splitter-style");
        element.removeAttribute("data-splitter-size");
        element.removeAttribute("data-order");
        element.removeAttribute("data-unit");
        //element.innerHTML = "";

        // Set base classes
        element.classList.remove("wx-webui-split");
        element.classList.add("wx-split");
        if (this._orientation === "vertical") {
            element.classList.add("wx-split-vertical");
        } else {
            element.classList.add("wx-split-horizontal");
        }

        // Create splitter and insert between panes
        this._splitter = document.createElement("div");
        this._splitter.classList.add("wx-splitter");
        const indicator = document.createElement("div");
        indicator.classList.add("wx-splitter-indicator");

        // Set the correct splitter orientation class
        if (this._orientation === "vertical") {
            this._splitter.classList.add("wx-splitter-vertical");
            indicator.classList.add("wx-splitter-indicator-vertical");
        } else {
            this._splitter.classList.add("wx-splitter-horizontal");
            indicator.classList.add("wx-splitter-indicator-horizontal");
        }

        this._splitter.appendChild(indicator);
                
        // Arrange panes and splitter in correct order in DOM
        if (this._paneOrder === "main-side") {
            element.appendChild(this._mainPane);
            element.appendChild(this._splitter);
            element.appendChild(this._sidePane);
        } else {
            element.appendChild(this._sidePane);
            element.appendChild(this._splitter);
            element.appendChild(this._mainPane);
        }

        // Set splitter class if data-splitter-class is set
        if (this._splitClass) {
            this._splitter.classList.add(...this._splitClass.split(/\s+/));
        }

        // Set splitter style if data-splitter-style is set
        if (this._splitStyle) {
            this._splitter.style.cssText += ";" + this._splitStyle;
        }

        // Set splitter size if data-splitter-size is set
        if (this._splitterSize) {
            if (this._orientation === "vertical") {
                this._splitter.style.height = `${this._splitterSize}px`;
            } else {
                this._splitter.style.width = `${this._splitterSize}px`;
            }
        }

        // Cookie name unique per element (only if id exists)
        if (element.id) {
            this._cookieName = "wx-split-size-" + element.id;
        } else {
            this._cookieName = null;
        }

        // Set initial side size: Cookie > data-size > minSide > half, but respect min and max boundaries
        let initialSide = this._getSideSizeFromCookie();
        if (initialSide == null) {
            initialSide = this._parseInitialSideSize(this._initialSideAttr) ?? Math.floor(
                (this._orientation === "vertical" ? element.clientHeight : element.clientWidth) / 2
            );
        }
        if (this._minSide !== null) initialSide = Math.max(initialSide, this._minSide);
        if (this._maxSide !== null) initialSide = Math.min(initialSide, this._maxSide);
        this._sideSize = initialSide;
        this._setPaneSizes(this._sideSize);

        // Make panes scrollable only if content is too large
        if (this._mainPane) this._mainPane.style.overflow = "auto";
        if (this._sidePane) this._sidePane.style.overflow = "auto";

        // Handle splitter drag
        this._splitter.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this._dragging = true;
            document.body.classList.add("wx-split-noselect");

            const rect = this._element.getBoundingClientRect();
            let offset;
            if (this._orientation === "vertical") {
                if (this._paneOrder === "main-side") {
                    offset = (rect.bottom - e.clientY) - this._sidePane.offsetHeight;
                } else {
                    offset = e.clientY - (rect.top + this._sidePane.offsetHeight);
                }
            } else {
                if (this._paneOrder === "main-side") {
                    offset = (rect.right - e.clientX) - this._sidePane.offsetWidth;
                } else {
                    offset = e.clientX - (rect.left + this._sidePane.offsetWidth);
                }
            }

            const onDrag = (ev) => {
                if (!this._dragging) return;
                const rect = this._element.getBoundingClientRect();
                let newSideSize;
                if (this._orientation === "vertical") {
                    if (this._paneOrder === "main-side") {
                        newSideSize = rect.bottom - ev.clientY - offset;
                    } else {
                        newSideSize = ev.clientY - rect.top - offset;
                    }
                } else {
                    if (this._paneOrder === "main-side") {
                        newSideSize = rect.right - ev.clientX - offset;
                    } else {
                        newSideSize = ev.clientX - rect.left - offset;
                    }
                }
                if (this._minSide !== null) newSideSize = Math.max(this._minSide, newSideSize);
                if (this._maxSide !== null) newSideSize = Math.min(this._maxSide, newSideSize);
                newSideSize = Math.max(0, newSideSize);
                if (this._sidePaneCollapsed && newSideSize > 0) {
                    this.expandSidePane(newSideSize);
                } else {
                    this._setPaneSizes(newSideSize, true);
                    this._setSideSizeCookie(newSideSize); // Save in cookie
                }
            };

            const onStopDrag = () => {
                this._dragging = false;
                document.body.classList.remove("wx-split-noselect");
                window.removeEventListener("mousemove", onDrag);
                window.removeEventListener("mouseup", onStopDrag);
            };

            window.addEventListener("mousemove", onDrag);
            window.addEventListener("mouseup", onStopDrag);
        });

        // Handle double click on splitter: collapse or expand side-pane, but never smaller than minSide
        this._splitter.addEventListener("dblclick", (e) => {
            e.preventDefault();
            if (!this._sidePaneCollapsed) {
                this.collapseSidePane();
            } else {
                this.expandSidePane();
            }
        });
    }

    /**
     * Reads the side pane size from a cookie, if available.
     * Only loads the size if a cookie name exists (i.e., if an ID is set on the element).
     * @returns {number|null} Returns the side pane size in pixels if available, otherwise null.
     */
    _getSideSizeFromCookie() {
        if (!this._cookieName) return null; // Do not load if no id is set
        const name = this._cookieName + "=";
        const ca = document.cookie.split(';');
        for (let c of ca) {
            c = c.trim();
            if (c.indexOf(name) === 0) {
                const v = c.substring(name.length, c.length);
                const n = parseInt(v, 10);
                return isNaN(n) ? null : n;
            }
        }
        return null;
    }

    /**
     * Stores the side pane size in a cookie for 30 days.
     * Only saves the size if a cookie name exists (i.e., if an ID is set on the element).
     * @param {number} size - The side pane size in pixels to store.
     * @returns {void}
     */
    _setSideSizeCookie(size) {
        if (!this._cookieName) return; // Do not save if no id is set
        const d = new Date();
        d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
        document.cookie = this._cookieName + "=" + Math.round(size) + ";expires=" + d.toUTCString() + ";path=/";
    }

    /**
     * Parses the data-size attribute and returns the size in the correct unit.
     * Supports values in px, em, rem, %, or plain number (interpreted according to data-unit, default px).
     * @param {string} attr - The value of the data-size attribute.
     * @returns {number|null} Returns the value in pixels if valid, otherwise null.
     */
    _parseInitialSideSize(attr) {
        if (!attr) return null;
        // px
        if (attr.endsWith("px")) return parseInt(attr, 10);
        // em
        if (attr.endsWith("em")) {
            const em = parseFloat(attr);
            if (isNaN(em)) return null;
            // Assume 1em = 16px (standard)
            return Math.round(em * 16);
        }
        // rem
        if (attr.endsWith("rem")) {
            const rem = parseFloat(attr);
            if (isNaN(rem)) return null;
            // Assume 1rem = 16px (standard)
            return Math.round(rem * 16);
        }
        // %
        if (attr.endsWith("%")) {
            const percent = parseFloat(attr);
            if (isNaN(percent)) return null;
            const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
            return Math.round((percent / 100) * total);
        }
        // No unit specified: use data-unit
        const n = parseFloat(attr);
        if (!isNaN(n)) {
            switch (this._unit) {
                case "em":
                    return Math.round(n * 16);
                case "rem":
                    return Math.round(n * 16);
                case "%":
                    const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
                    return Math.round((n / 100) * total);
                case "px":
                default:
                    return Math.round(n);
            }
        }
        return null;
    }

    /**
     * Returns the current splitter size (width or height).
     * If a value for data-splitter-size is set, uses that.
     * @returns {number}
     */
    _getSplitterSize() {
        if (this._splitterSize) {
            // Try to parse number, fallback to offset if invalid
            const v = parseInt(this._splitterSize, 10);
            if (!isNaN(v)) return v;
        }
        if (this._orientation === "vertical") {
            return this._splitter.offsetHeight || 6;
        } else {
            return this._splitter.offsetWidth || 6;
        }
    }

    /**
     * Set the size of both panes.
     * @param {number} sideSize - Size of the side pane in px.
     * @param {boolean} fireEvent - Whether to fire a size change event.
     */
    _setPaneSizes(sideSize, fireEvent = false) {
        const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
        const splitterSize = this._getSplitterSize();
        sideSize = Math.max(0, sideSize);
        let mainSize = Math.max(0, total - sideSize - splitterSize);

        if (this._orientation === "vertical") {
            if (this._sidePane) this._sidePane.style.height = sideSize + "px";
            if (this._sidePane) this._sidePane.style.width = "";
            if (this._mainPane) this._mainPane.style.height = mainSize + "px";
            if (this._mainPane) this._mainPane.style.width = "";
        } else {
            if (this._sidePane) this._sidePane.style.width = sideSize + "px";
            if (this._sidePane) this._sidePane.style.height = "";
            if (this._mainPane) this._mainPane.style.width = mainSize + "px";
            if (this._mainPane) this._mainPane.style.height = "";
        }
        if (this._sidePane) this._sidePane.style.display = "";
        if (this._mainPane) this._mainPane.style.display = "";
        this._splitter.style.display = "";

        // Fire size change event if requested
        if (fireEvent) {
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.SIZE_CHANGE_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id,
                    mainSize: mainSize,
                    sideSize: sideSize,
                    orientation: this._orientation
                }
            }));
        }
    }

    /**
     * Collapse the side pane and hide it, but respect minSide if set.
     * Fires HIDE_EVENT when side-pane is collapsed.
     */
    collapseSidePane() {
        if (this._sidePaneCollapsed) return;
        this._sidePaneCollapsed = true;
        this._sidePanePrevSize = this._sidePane[this._orientation === "vertical" ? "offsetHeight" : "offsetWidth"];

        let collapseTo = (this._minSide !== null) ? this._minSide : 0;

        // Hide only the side pane
        if (collapseTo === 0) {
            this._sidePane.style.display = "none";
        } else {
            if (this._orientation === "vertical") {
                this._sidePane.style.height = collapseTo + "px";
                this._sidePane.style.minHeight = collapseTo + "px";
            } else {
                this._sidePane.style.width = collapseTo + "px";
                this._sidePane.style.minWidth = collapseTo + "px";
            }
            this._sidePane.style.display = "";
        }

        // Main panel gets all space minus splitter
        if (this._orientation === "vertical") {
            this._mainPane.style.height = `calc(100% - ${this._getSplitterSize()}px)`;
            this._mainPane.style.width = "";
        } else {
            this._mainPane.style.width = `calc(100% - ${this._getSplitterSize()}px)`;
            this._mainPane.style.height = "";
        }

        // Fire HIDE_EVENT
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.HIDE_EVENT, {
            detail: {
                sender: this._element,
                id: this._element.id
            }
        }));
    }

    /**
     * Expand the side pane and show it again.
     * Fires SHOW_EVENT when side-pane is expanded.
     * @param {number} [size] - Optional size to restore or set for the side pane.
     */
    expandSidePane(size) {
        if (!this._sidePaneCollapsed) return;
        this._sidePaneCollapsed = false;
        const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
        let sideSize = size || this._sidePanePrevSize || Math.floor(total / 2);
        if (this._minSide !== null) sideSize = Math.max(this._minSide, sideSize);
        if (this._maxSide !== null) sideSize = Math.min(this._maxSide, sideSize);
        this._sidePane.style.display = "";
        this._setPaneSizes(sideSize, true);
        this._setSideSizeCookie(sideSize); // Save restored size in cookie

        // Fire SHOW_EVENT when side-pane is expanded (via double-click)
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.SHOW_EVENT, {
            detail: {
                sender: this._element,
                id: this._element.id
            }
        }));
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-split", webexpress.webui.SplitCtrl);