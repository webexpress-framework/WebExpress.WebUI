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
     * @param {HTMLElement} element - the DOM element for the split control.
     */
    constructor(element) {
        super(element);

        // read configuration from attributes
        this._orientation = element.getAttribute("data-orientation") === "vertical" ? "vertical" : "horizontal";
        this._minSide = element.hasAttribute("data-min-side") ? parseInt(element.getAttribute("data-min-side"), 10) : null;
        this._maxSide = element.hasAttribute("data-max-side") ? parseInt(element.getAttribute("data-max-side"), 10) : null;
        this._initialSideAttr = element.getAttribute("data-size");
        this._splitClass = element.getAttribute("data-splitter-class") || null;
        this._splitStyle = element.getAttribute("data-splitter-style") || null;
        this._splitterSize = element.getAttribute("data-splitter-size") || null;
        this._paneOrder = element.getAttribute("data-order") || "side-main";
        // read unit from data-unit attribute, values can be: 'px', 'em', 'rem', '%', default is 'px'
        this._unit = element.getAttribute("data-unit") || "px";

        // detect ratio mode when initial attribute uses '%'
        this._sideRatioMode = false;
        this._initialRatio = null;
        if (typeof this._initialSideAttr === "string") {
            const s = this._initialSideAttr.trim();
            if (s.endsWith("%")) {
                const p = parseFloat(s);
                if (!isNaN(p)) {
                    this._sideRatioMode = true;
                    this._initialRatio = Math.max(0, p) / 100;
                }
            }
        }

        // get panes from DOM
        this._sidePane = Array.from(element.children).find((child) => {
            return child.classList.contains("wx-side-pane");
        });
        this._detachElement(this._sidePane);

        this._mainPane = Array.from(element.children).find((child) => {
            return child.classList.contains("wx-main-pane");
        });
        this._detachElement(this._mainPane);

        // cleanup DOM attributes
        element.removeAttribute("data-orientation");
        element.removeAttribute("data-min-side");
        element.removeAttribute("data-max-side");
        element.removeAttribute("data-size");
        element.removeAttribute("data-splitter-class");
        element.removeAttribute("data-splitter-style");
        element.removeAttribute("data-splitter-size");
        element.removeAttribute("data-order");
        element.removeAttribute("data-unit");
        // element.innerHTML = "";

        // set base classes
        element.classList.remove("wx-webui-split");
        element.classList.add("wx-split");
        if (this._orientation === "vertical") {
            element.classList.add("wx-split-vertical");
        } else {
            element.classList.add("wx-split-horizontal");
        }

        // create splitter and insert between panes
        this._splitter = document.createElement("div");
        this._splitter.classList.add("wx-splitter");
        const indicator = document.createElement("div");
        indicator.classList.add("wx-splitter-indicator");

        // set the correct splitter orientation class
        if (this._orientation === "vertical") {
            this._splitter.classList.add("wx-splitter-vertical");
            indicator.classList.add("wx-splitter-indicator-vertical");
        } else {
            this._splitter.classList.add("wx-splitter-horizontal");
            indicator.classList.add("wx-splitter-indicator-horizontal");
        }

        this._splitter.appendChild(indicator);

        // arrange panes and splitter in correct order in DOM
        if (this._paneOrder === "main-side") {
            element.appendChild(this._mainPane);
            element.appendChild(this._splitter);
            element.appendChild(this._sidePane);
        } else {
            element.appendChild(this._sidePane);
            element.appendChild(this._splitter);
            element.appendChild(this._mainPane);
        }

        // set splitter class if data-splitter-class is set
        if (this._splitClass) {
            this._splitter.classList.add(...this._splitClass.split(/\s+/));
        }

        // set splitter style if data-splitter-style is set
        if (this._splitStyle) {
            this._splitter.style.cssText += ";" + this._splitStyle;
        }

        // set splitter size if data-splitter-size is set
        if (this._splitterSize) {
            if (this._orientation === "vertical") {
                this._splitter.style.height = `${this._splitterSize}px`;
            } else {
                this._splitter.style.width = `${this._splitterSize}px`;
            }
        }

        // cookie name unique per element (only if id exists)
        if (element.id) {
            this._cookieName = "wx-split-size-" + element.id;
        } else {
            this._cookieName = null;
        }

        // set initial side size: Cookie > data-size > minSide > half, but respect min and max boundaries
        let initialSide = this._getSideSizeFromCookie();
        if (initialSide == null) {
            initialSide = this._parseInitialSideSize(this._initialSideAttr) ?? Math.floor((this._orientation === "vertical" ? element.clientHeight : element.clientWidth) / 2);
        }
        if (this._minSide !== null) {
            initialSide = Math.max(initialSide, this._minSide);
        }
        if (this._maxSide !== null) {
            initialSide = Math.min(initialSide, this._maxSide);
        }
        this._sideSize = initialSide;
        this._setPaneSizes(this._sideSize);

        // make panes scrollable only if content is too large
        if (this._mainPane) {
            this._mainPane.style.overflow = "auto";
        }
        if (this._sidePane) {
            this._sidePane.style.overflow = "auto";
        }

        // handle splitter drag
        this._splitter.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this._dragging = true;
            // disable ratio mode once the user interacts manually
            this._sideRatioMode = false;
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
                if (!this._dragging) {
                    return;
                }
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
                if (this._minSide !== null) {
                    newSideSize = Math.max(this._minSide, newSideSize);
                }
                if (this._maxSide !== null) {
                    newSideSize = Math.min(this._maxSide, newSideSize);
                }
                newSideSize = Math.max(0, newSideSize);
                if (this._sidePaneCollapsed && newSideSize > 0) {
                    this.expandSidePane(newSideSize);
                } else {
                    this._setPaneSizes(newSideSize, true);
                    this._setSideSizeCookie(newSideSize);
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

        // handle double click on splitter: collapse or expand side-pane, but never smaller than minSide
        this._splitter.addEventListener("dblclick", (e) => {
            e.preventDefault();
            if (!this._sidePaneCollapsed) {
                this.collapseSidePane();
            } else {
                this.expandSidePane();
            }
        });

        // observe size changes of the split container to adjust content automatically
        this._onWindowResize = () => {
            this._handleResize();
        };
        window.addEventListener("resize", this._onWindowResize);
        this._resizeObserver = new ResizeObserver(() => {
            this._handleResize();
        });
        try {
            this._resizeObserver.observe(this._element);
        } catch (err) {
            // ignore observer errors
        }
    }

    /**
     * Handles container resize and reapplies pane sizes.
     * keeps the side pane size stable in px or proportional if ratio mode is enabled.
     * @returns {void}
     */
    _handleResize() {
        const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
        if (total <= 0) {
            return;
        }
        const splitterSize = this._getSplitterSize();
        if (this._sidePaneCollapsed) {
            // when collapsed, layout uses css calc and adapts automatically
            return;
        }
        let sideSize = this._sideSize;
        if (this._sideRatioMode && typeof this._initialRatio === "number") {
            sideSize = Math.round(this._initialRatio * total);
        }
        // respect constraints
        if (this._minSide !== null) {
            sideSize = Math.max(this._minSide, sideSize);
        }
        if (this._maxSide !== null) {
            sideSize = Math.min(this._maxSide, sideSize);
        }
        // do not allow side to exceed available space
        const maxSideByTotal = Math.max(0, total - splitterSize);
        sideSize = Math.min(sideSize, maxSideByTotal);
        sideSize = Math.max(0, sideSize);

        this._setPaneSizes(sideSize);
    }

    /**
     * Reads the side pane size from a cookie, if available.
     * Only loads the size if a cookie name exists (i.e., if an ID is set on the element).
     * @returns {number|null} returns the side pane size in pixels if available, otherwise null.
     */
    _getSideSizeFromCookie() {
        if (!this._cookieName) {
            return null;
        }
        const name = this._cookieName + "=";
        const ca = document.cookie.split(";");
        for (let c of ca) {
            c = c.trim();
            if (c.indexOf(name) === 0) {
                const v = c.substring(name.length, c.length);
                const n = parseInt(v, 10);
                if (isNaN(n)) {
                    return null;
                } else {
                    return n;
                }
            }
        }
        return null;
    }

    /**
     * Stores the side pane size in a cookie for 30 days.
     * Only saves the size if a cookie name exists (i.e., if an ID is set on the element).
     * @param {number} size - the side pane size in pixels to store.
     * @returns {void}
     */
    _setSideSizeCookie(size) {
        if (!this._cookieName) {
            return;
        }
        const d = new Date();
        d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
        document.cookie = this._cookieName + "=" + Math.round(size) + ";expires=" + d.toUTCString() + ";path=/";
    }

    /**
     * Parses the data-size attribute and returns the size in the correct unit.
     * Supports values in px, em, rem, %, or plain number (interpreted according to data-unit, default px).
     * @param {string} attr - the value of the data-size attribute.
     * @returns {number|null} returns the value in pixels if valid, otherwise null.
     */
    _parseInitialSideSize(attr) {
        if (!attr) {
            return null;
        }
        if (attr.endsWith("px")) {
            return parseInt(attr, 10);
        }
        if (attr.endsWith("em")) {
            const em = parseFloat(attr);
            if (isNaN(em)) {
                return null;
            } else {
                return Math.round(em * 16);
            }
        }
        if (attr.endsWith("rem")) {
            const rem = parseFloat(attr);
            if (isNaN(rem)) {
                return null;
            } else {
                return Math.round(rem * 16);
            }
        }
        if (attr.endsWith("%")) {
            const percent = parseFloat(attr);
            if (isNaN(percent)) {
                return null;
            }
            const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
            return Math.round((percent / 100) * total);
        }
        const n = parseFloat(attr);
        if (!isNaN(n)) {
            switch (this._unit) {
                case "em": {
                    return Math.round(n * 16);
                }
                case "rem": {
                    return Math.round(n * 16);
                }
                case "%": {
                    const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
                    return Math.round((n / 100) * total);
                }
                case "px":
                default: {
                    return Math.round(n);
                }
            }
        }
        return null;
    }

    /**
     * Returns the current splitter size (width or height).
     * If a value for data-splitter-size is set, uses that.
     * @returns {number} splitter size in pixels.
     */
    _getSplitterSize() {
        if (this._splitterSize) {
            const v = parseInt(this._splitterSize, 10);
            if (!isNaN(v)) {
                return v;
            }
        }
        if (this._orientation === "vertical") {
            return this._splitter.offsetHeight || 6;
        } else {
            return this._splitter.offsetWidth || 6;
        }
    }

    /**
     * Sets the size of both panes and stores the current side size.
     * clamps sizes within available container bounds and min/max constraints.
     * @param {number} sideSize - size of the side pane in px.
     * @param {boolean} fireEvent - whether to fire a size change event.
     * @returns {void}
     */
    _setPaneSizes(sideSize, fireEvent = false) {
        const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
        const splitterSize = this._getSplitterSize();

        // clamp side size to constraints and available space
        if (this._minSide !== null) {
            sideSize = Math.max(this._minSide, sideSize);
        }
        if (this._maxSide !== null) {
            sideSize = Math.min(this._maxSide, sideSize);
        }
        sideSize = Math.max(0, sideSize);
        const maxSideByTotal = Math.max(0, total - splitterSize);
        sideSize = Math.min(sideSize, maxSideByTotal);

        let mainSize = Math.max(0, total - sideSize - splitterSize);

        if (this._orientation === "vertical") {
            if (this._sidePane) {
                this._sidePane.style.height = sideSize + "px";
                this._sidePane.style.width = "";
            }
            if (this._mainPane) {
                this._mainPane.style.height = mainSize + "px";
                this._mainPane.style.width = "";
            }
        } else {
            if (this._sidePane) {
                this._sidePane.style.width = sideSize + "px";
                this._sidePane.style.height = "";
            }
            if (this._mainPane) {
                this._mainPane.style.width = mainSize + "px";
                this._mainPane.style.height = "";
            }
        }
        if (this._sidePane) {
            this._sidePane.style.display = "";
        }
        if (this._mainPane) {
            this._mainPane.style.display = "";
        }
        this._splitter.style.display = "";

        // persist current side size in instance
        this._sideSize = sideSize;

        // fire size change event if requested
        if (fireEvent) {
            this._dispatch(webexpress.webui.Event.SIZE_CHANGE_EVENT, {
                mainSize: mainSize,
                sideSize: sideSize,
                orientation: this._orientation
            });
        }
    }

    /**
     * Collapses the side pane and hides it, but respects minSide if set.
     * Fires HIDE_EVENT when side-pane is collapsed.
     * @returns {void}
     */
    collapseSidePane() {
        if (this._sidePaneCollapsed) {
            return;
        }
        this._sidePaneCollapsed = true;
        this._sidePanePrevSize = this._sidePane[this._orientation === "vertical" ? "offsetHeight" : "offsetWidth"];

        let collapseTo = (this._minSide !== null) ? this._minSide : 0;

        // hide only the side pane
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

        // main panel gets all space minus splitter
        if (this._orientation === "vertical") {
            this._mainPane.style.height = `calc(100% - ${this._getSplitterSize()}px)`;
            this._mainPane.style.width = "";
        } else {
            this._mainPane.style.width = `calc(100% - ${this._getSplitterSize()}px)`;
            this._mainPane.style.height = "";
        }

        // fire HIDE_EVENT
        this._dispatch(webexpress.webui.Event.HIDE_EVENT, {});
    }

    /**
     * Expands the side pane and shows it again.
     * Fires SHOW_EVENT when side-pane is expanded.
     * @param {number} [size] - optional size to restore or set for the side pane.
     * @returns {void}
     */
    expandSidePane(size) {
        if (!this._sidePaneCollapsed) {
            return;
        }
        this._sidePaneCollapsed = false;
        const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
        let sideSize = size || this._sidePanePrevSize || Math.floor(total / 2);
        if (this._minSide !== null) {
            sideSize = Math.max(this._minSide, sideSize);
        }
        if (this._maxSide !== null) {
            sideSize = Math.min(this._maxSide, sideSize);
        }
        this._sidePane.style.display = "";
        this._setPaneSizes(sideSize, true);
        this._setSideSizeCookie(sideSize);

        // fire SHOW_EVENT when side-pane is expanded (via double-click)
        this._dispatch(webexpress.webui.Event.SHOW_EVENT, {});
    }

    /**
     * Fits the side pane size to its content size.
     * Measures the content of the side pane and resizes the side pane accordingly,
     * respecting min/max constraints and the available container space. Expands the
     * side pane when it is currently collapsed.
     * @returns {void}
     */
    fitSidePaneToContent() {
        if (!this._sidePane) {
            return;
        }

        // disable ratio mode to keep pixel size after fitting
        this._sideRatioMode = false;

        // ensure pane is visible for measuring
        const prevDisplay = this._sidePane.style.display;
        if (prevDisplay === "none") {
            this._sidePane.style.display = "";
        }

        // temporarily clear explicit size to measure natural content size
        let desired;
        if (this._orientation === "vertical") {
            const prevHeight = this._sidePane.style.height;
            this._sidePane.style.height = "";
            desired = this._sidePane.scrollHeight;
            this._sidePane.style.height = prevHeight;
        } else {
            const prevWidth = this._sidePane.style.width;
            this._sidePane.style.width = "";
            desired = this._sidePane.scrollWidth;
            this._sidePane.style.width = prevWidth;
        }

        // compute available container space
        const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
        const splitterSize = this._getSplitterSize();
        const maxAvail = Math.max(0, total - splitterSize);

        // clamp desired size to constraints and available space
        let newSide = desired;
        if (this._minSide !== null) {
            newSide = Math.max(this._minSide, newSide);
        }
        if (this._maxSide !== null) {
            newSide = Math.min(this._maxSide, newSide);
        }
        newSide = Math.min(newSide, maxAvail);
        newSide = Math.max(0, newSide);

        // apply size, expanding if currently collapsed
        if (this._sidePaneCollapsed) {
            this.expandSidePane(newSide);
        } else {
            this._setPaneSizes(newSide, true);
            this._setSideSizeCookie(newSide);
        }
    }

    /**
     * Forces a recomputation of pane sizes based on the current container size.
     * keeps current side size unless ratio mode is active.
     * @returns {void}
     */
    refresh() {
        this._handleResize();
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-split", webexpress.webui.SplitCtrl);