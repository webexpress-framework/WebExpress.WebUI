/**
 * A split control for resizable container panels.
 * Persists side size and collapsed state via a single cookie (when the element has an id).
 *
 * Features:
 * - Supports horizontal and vertical orientation.
 * - Persistent state via cookies.
 * - Min/Max constraints.
 * - Collapsible side pane (double click or drag beyond threshold).
 * - Automatic resizing via ResizeObserver.
 * - Content-visibility aware: if all children of the side or main pane become
 *   invisible (display:none, visibility:hidden, the hidden attribute, or an
 *   empty pane), the splitter and that pane are hidden rather than removed
 *   from the DOM. The remaining pane expands to fill the entire container.
 *   Both are restored once content becomes visible again.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.SIZE_CHANGE_EVENT
 * - webexpress.webui.Event.HIDE_EVENT
 * - webexpress.webui.Event.SHOW_EVENT
 */
webexpress.webui.SplitCtrl = class extends webexpress.webui.Ctrl {

    // config
    _orientation = "horizontal";
    _minSide = null;
    _maxSide = null;
    _collapseTo = 0;
    _paneOrder = "side-main";
    _unit = "px";

    // state
    _sideSize = 0;
    _sidePaneCollapsed = false;
    _sidePanePrevSize = null;
    _collapseThreshold = 20;
    _dragging = false;
    _sideRatioMode = false;
    _initialRatio = null;
    _cookieName = null;

    // elements
    _sidePane = null;
    _mainPane = null;
    _splitter = null;
    _resizeObserver = null;

    // content-visibility tracking
    _sideContentHidden = false;
    _mainContentHidden = false;
    _sideContentObserver = null;
    _mainContentObserver = null;
    _contentVisibilityPending = false;
    _contentObserverConfig = null;

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element for the split control.
     */
    constructor(element) {
        super(element);

        this._readConfig(element);
        this._setupDom(element);
        this._initEvents();

        // restore state or set initial defaults
        this._restoreState(element);

        // observe content visibility and detach pane + splitter when empty
        this._initContentVisibility();
    }

    /**
     * Reads configuration from data attributes.
     * @param {HTMLElement} element Host element.
     */
    _readConfig(element) {
        this._orientation = element.getAttribute("data-orientation") === "vertical" ? "vertical" : "horizontal";
        this._minSide = this._parseAttrInt(element, "data-min-side");
        this._maxSide = this._parseAttrInt(element, "data-max-side");

        // the extent a collapse leaves behind. It is deliberately separate from
        // data-min-side: that is the smallest size a *drag* may reach, and using
        // it as the collapse target means a pane with a sensible drag minimum
        // can never actually be hidden. Zero (the default) hides the pane; a
        // positive value leaves a rail behind.
        this._collapseTo = this._parseAttrInt(element, "data-collapse-to") || 0;
        this._paneOrder = element.getAttribute("data-order") || "side-main";
        this._unit = element.getAttribute("data-unit") || "px";

        // parse initial size; the unit may be written inline on the value
        // (e.g. "25%") or come from the separate data-unit attribute
        // (e.g. data-size="25" data-unit="%"). a percentage makes the side pane
        // track a ratio of the container instead of a fixed extent.
        const sizeAttr = element.getAttribute("data-size");
        this._initialSideAttr = sizeAttr; // stored for deferred/fallback parsing
        if (this._sideUnit(sizeAttr) === "%") {
            const p = parseFloat(sizeAttr);
            if (!isNaN(p)) {
                this._sideRatioMode = true;
                this._initialRatio = Math.max(0, p) / 100;
            }
        }

        // determine cookie name
        this._cookieName = element.id ? `wx-split-${element.id}` : null;

        // cleanup attributes
        const attrs = [
            "data-orientation", "data-min-side", "data-max-side", "data-collapse-to", "data-size",
            "data-splitter-class", "data-splitter-style", "data-splitter-size",
            "data-order", "data-unit"
        ];
        attrs.forEach(attr => element.removeAttribute(attr));
    }

    /**
     * Set up the DOM structure (panes, splitter).
     * @param {HTMLElement} element Host element.
     */
    _setupDom(element) {
        // identify panes
        const children = Array.from(element.children);
        this._sidePane = children.find(c => c.classList.contains("wx-side-pane")) || children[0];
        this._mainPane = children.find(c => c.classList.contains("wx-main-pane")) || children.find(c => c !== this._sidePane);

        // apply base classes
        element.classList.remove("wx-webui-split");
        element.classList.add("wx-split", `wx-split-${this._orientation}`);

        // create splitter
        this._splitter = document.createElement("div");
        this._splitter.className = `wx-splitter wx-splitter-${this._orientation}`;

        const indicator = document.createElement("div");
        indicator.className = `wx-splitter-indicator wx-splitter-indicator-${this._orientation}`;
        this._splitter.appendChild(indicator);

        // apply custom splitter styles
        const customClass = element.getAttribute("data-splitter-class");
        if (customClass) this._splitter.classList.add(...customClass.split(/\s+/));

        const customStyle = element.getAttribute("data-splitter-style");
        if (customStyle) this._splitter.style.cssText += customStyle;

        const customSize = element.getAttribute("data-splitter-size");
        if (customSize) {
            const prop = this._orientation === "vertical" ? "height" : "width";
            this._splitter.style[prop] = `${customSize}px`;
        }

        // reorder dom
        const fragment = document.createDocumentFragment();
        if (this._paneOrder === "main-side") {
            if (this._mainPane) fragment.appendChild(this._mainPane);
            fragment.appendChild(this._splitter);
            if (this._sidePane) fragment.appendChild(this._sidePane);
        } else {
            if (this._sidePane) fragment.appendChild(this._sidePane);
            fragment.appendChild(this._splitter);
            if (this._mainPane) fragment.appendChild(this._mainPane);
        }
        element.replaceChildren(fragment);

        // scroll settings
        if (this._mainPane) this._mainPane.style.overflow = "auto";
    }

    /**
     * Restore state from cookie or calculate initial values.
     * @param {HTMLElement} element Host element.
     */
    _restoreState(element) {
        const state = this._getStateFromCookie();

        let initialSide = (state && typeof state.size === "number")
            ? state.size
            : this._parseInitialSideSize(this._initialSideAttr);

        // default fallback: 50%
        if (initialSide == null) {
            const dim = this._orientation === "vertical" ? element.clientHeight : element.clientWidth;
            if (dim > 0) {
                initialSide = Math.floor(dim / 2);
            } else {
                // container not laid out yet (hidden tab); express the fallback
                // as a ratio so the first real resize resolves it against the
                // true container extent instead of pinning a zero size.
                this._sideRatioMode = true;
                this._initialRatio = 0.5;
                initialSide = 0;
            }
        }

        // apply constraints immediately
        if (this._minSide !== null) initialSide = Math.max(this._minSide, initialSide);
        if (this._maxSide !== null) initialSide = Math.min(this._maxSide, initialSide);

        this._sideSize = initialSide;
        this._setPaneSizes(this._sideSize);

        // apply collapse state
        if (state && state.collapsed === true) {
            this.collapseSidePane();
        }
    }

    /**
     * Initialize event listeners.
     */
    _initEvents() {
        // splitter drag interaction
        this._splitter.addEventListener("mousedown", (e) => this._onDragStart(e));

        // double click toggle
        this._splitter.addEventListener("dblclick", (e) => {
            e.preventDefault();
            this._sidePaneCollapsed ? this.expandSidePane() : this.collapseSidePane();
        });

        // resize observer
        this._resizeObserver = new ResizeObserver(() => this._handleResize());
        this._resizeObserver.observe(this._element);
    }

    /**
     * Handle start of drag operation.
     * @param {MouseEvent} e Mouse event.
     */
    _onDragStart(e) {
        if (e.button !== 0) return; // only left click
        e.preventDefault();

        this._dragging = true;
        this._sideRatioMode = false; // disable ratio mode on manual interaction
        document.body.classList.add("wx-split-noselect");

        const rect = this._element.getBoundingClientRect();
        const isVert = this._orientation === "vertical";
        const isMainSide = this._paneOrder === "main-side";
        const sideDim = isVert ? this._sidePane.offsetHeight : this._sidePane.offsetWidth;

        // calculate constant offset based on layout
        let offset;
        if (isVert) {
            offset = isMainSide
                ? (rect.bottom - e.clientY) - sideDim
                : e.clientY - (rect.top + sideDim);
        } else {
            offset = isMainSide
                ? (rect.right - e.clientX) - sideDim
                : e.clientX - (rect.left + sideDim);
        }

        // bind global listeners
        const onDrag = (ev) => this._onDragMove(ev, rect, offset);
        const onStop = () => {
            this._dragging = false;
            document.body.classList.remove("wx-split-noselect");
            window.removeEventListener("mousemove", onDrag);
            window.removeEventListener("mouseup", onStop);
        };

        window.addEventListener("mousemove", onDrag);
        window.addEventListener("mouseup", onStop);
    }

    /**
     * Handle mouse move during drag.
     * @param {MouseEvent} ev Event.
     * @param {DOMRect} rect Container rect.
     * @param {number} offset pre-calculated offset.
     */
    _onDragMove(ev, rect, offset) {
        if (!this._dragging) return;

        // recalculate rect in case of scrolling/layout shifts during drag
        const currentRect = this._element.getBoundingClientRect();
        const isVert = this._orientation === "vertical";
        const isMainSide = this._paneOrder === "main-side";

        let newSideSize;
        if (isVert) {
            newSideSize = isMainSide
                ? currentRect.bottom - ev.clientY - offset
                : ev.clientY - currentRect.top - offset;
        } else {
            newSideSize = isMainSide
                ? currentRect.right - ev.clientX - offset
                : ev.clientX - currentRect.left - offset;
        }

        // collapse check
        const effectiveMin = this._minSide !== null ? this._minSide : 0;
        if (newSideSize <= (effectiveMin + this._collapseThreshold) && effectiveMin === 0) {
             // only auto-collapse via drag if min is 0 or very small
             // or if logic dictates allowing collapse below min
        }

        // Simpler collapse logic: if dragged below threshold (absolute or relative to min)
        if (newSideSize <= Math.max(0, (this._minSide || 0) - this._collapseThreshold)) {
             // dragged to "close"
             if (!this._sidePaneCollapsed) {
                 this.collapseSidePane();
                 this._setStateCookie({ size: this._sideSize, collapsed: true });
             }
             return;
        } else if (newSideSize <= this._collapseThreshold && this._minSide === null) {
             // dragged near 0 without minside
             if (!this._sidePaneCollapsed) {
                 this.collapseSidePane();
                 this._setStateCookie({ size: this._sideSize, collapsed: true });
             }
             return;
        }

        // if explicitly expanded via drag
        if (this._sidePaneCollapsed) {
            this.expandSidePane(newSideSize);
            return;
        }

        // apply constraints
        if (this._minSide !== null) newSideSize = Math.max(this._minSide, newSideSize);
        if (this._maxSide !== null) newSideSize = Math.min(this._maxSide, newSideSize);
        newSideSize = Math.max(0, newSideSize);

        this._setPaneSizes(newSideSize, true);
        this._setStateCookie({ size: newSideSize, collapsed: false });
    }

    /**
     * Handles container resize.
     */
    _handleResize() {
        const isVert = this._orientation === "vertical";
        const total = isVert ? this._element.clientHeight : this._element.clientWidth;
        if (total <= 0) return;

        if (this._sidePaneCollapsed) return;

        // in single-pane mode the visible pane already fills 100% of the
        // container, so the normal two-pane sizing must not run.
        if (this._sideContentHidden || this._mainContentHidden) return;

        const splitterSize = this._getSplitterSize();
        let sideSize = this._sideSize;

        // ratio mode adjustment
        if (this._sideRatioMode && typeof this._initialRatio === "number") {
            sideSize = Math.round(this._initialRatio * total);
        }

        // constraints
        if (this._minSide !== null) sideSize = Math.max(this._minSide, sideSize);
        if (this._maxSide !== null) sideSize = Math.min(this._maxSide, sideSize);

        // fit to container
        const maxAvail = Math.max(0, total - splitterSize);
        sideSize = Math.min(sideSize, maxAvail);

        this._setPaneSizes(sideSize);
    }

    /**
     * Sets the size of both panes.
     * @param {number} sideSize Pixel size of side pane.
     * @param {boolean} fireEvent Fire change event.
     */
    _setPaneSizes(sideSize, fireEvent = false) {
        const isVert = this._orientation === "vertical";
        const total = isVert ? this._element.clientHeight : this._element.clientWidth;
        const splitterSize = this._getSplitterSize();

        // the container is not laid out yet (e.g. the split was rendered inside
        // a display:none tab). clamping against a zero total would collapse both
        // panes and overwrite the desired side size with 0, leaving the pane
        // stuck once the tab is shown. keep the requested size and let the
        // ResizeObserver re-run the real sizing when a usable width appears.
        if (total <= 0) {
            this._sideSize = sideSize;
            return;
        }

        // safety clamp
        const maxSide = Math.max(0, total - splitterSize);
        sideSize = Math.min(Math.max(0, sideSize), maxSide);
        const mainSize = Math.max(0, total - sideSize - splitterSize);

        const prop = isVert ? "height" : "width";

        if (this._sidePane) {
            this._sidePane.style[prop] = `${sideSize}px`;
            this._sidePane.style.display = "";
        }
        if (this._mainPane) {
            this._mainPane.style[prop] = `${mainSize}px`; // Explicit size often smoother than calc
            this._mainPane.style.display = "";
        }
        this._splitter.style.display = "";

        this._sideSize = sideSize;

        if (fireEvent) {
            this._dispatch(webexpress.webui.Event.SIZE_CHANGE_EVENT, {
                mainSize,
                sideSize,
                orientation: this._orientation
            });
        }
    }

    /**
     * Collapses the side pane.
     */
    collapseSidePane() {
        if (this._sidePaneCollapsed) return;

        const isVert = this._orientation === "vertical";
        this._sidePanePrevSize = this._sidePane[isVert ? "offsetHeight" : "offsetWidth"];
        this._sidePaneCollapsed = true;

        const collapseTo = this._collapseTo;
        const prop = isVert ? "height" : "width";
        const minProp = isVert ? "minHeight" : "minWidth";

        if (collapseTo === 0) {
            // a fully collapsed pane leaves no rail to grab, so the splitter goes
            // with it; a visible divider against nothing reads as a rendering
            // fault, and the pane is brought back through the toolbar toggle
            this._sidePane.style.display = "none";
            this._splitter.style.display = "none";
        } else {
            this._sidePane.style[prop] = `${collapseTo}px`;
            this._sidePane.style[minProp] = `${collapseTo}px`;
            this._sidePane.style.display = "";
        }

        // main pane takes remaining
        const splitSize = collapseTo === 0 ? 0 : this._getSplitterSize();
        if (this._mainPane) {
            this._mainPane.style[prop] = `calc(100% - ${splitSize}px - ${collapseTo}px)`;
        }

        this._setStateCookie({ size: this._sideSize, collapsed: true });
        this._dispatch(webexpress.webui.Event.HIDE_EVENT, {});
    }

    /**
     * Expands the side pane.
     * @param {number} [size] Target size.
     */
    expandSidePane(size) {
        if (!this._sidePaneCollapsed) return;

        const isVert = this._orientation === "vertical";
        const total = isVert ? this._element.clientHeight : this._element.clientWidth;

        let targetSize = size || this._sidePanePrevSize || Math.floor(total / 2);

        // reset the constraints a collapse may have set
        const minProp = isVert ? "minHeight" : "minWidth";
        this._sidePane.style[minProp] = "";
        this._sidePane.style.display = "";
        this._splitter.style.display = "";

        this._sidePaneCollapsed = false;
        this._setPaneSizes(targetSize, true);

        this._setStateCookie({ size: targetSize, collapsed: false });
        this._dispatch(webexpress.webui.Event.SHOW_EVENT, {});
    }

    /**
     * Toggles side pane visibility.
     */
    toggleSidePane() {
        this._sidePaneCollapsed ? this.expandSidePane() : this.collapseSidePane();
    }

    /**
     * Sizes the side pane to fit the intrinsic extent of its content (width for
     * horizontal splits, height for vertical) and then applies the configured
     * min/max and container constraints. Callers invoke this after the side
     * content changes - e.g. a navigation tree is populated - so the pane is
     * neither clipped nor padded with dead space. No-ops while collapsed or
     * while the content has no measurable extent (e.g. inside a hidden modal),
     * so callers safely defer it to the next frame after the pane is shown.
     */
    fitSidePaneToContent() {
        if (!this._sidePane || this._sidePaneCollapsed) return;

        const isVert = this._orientation === "vertical";
        const prop = isVert ? "height" : "width";
        const pane = this._sidePane;

        // measure the content's preferred (max-content) extent while neutralizing
        // flex so the surrounding layout can neither grow nor shrink the pane
        // during the read. a width:0 + scrollWidth reading would instead report
        // the *minimum* content width - flowing text wrapped down to its longest
        // word - and collapse the pane; only content that never wraps (e.g. a
        // tree) survives that. reading offset* forces the reflow, and the
        // previous styles are restored before the browser paints, so there is no
        // visible flicker.
        const previousSize = pane.style[prop];
        const previousFlex = pane.style.flex;
        pane.style.flex = "0 0 auto";
        pane.style[prop] = "max-content";
        const content = isVert ? pane.offsetHeight : pane.offsetWidth;
        pane.style[prop] = previousSize;
        pane.style.flex = previousFlex;

        if (content <= 0) return;

        let target = content;
        if (this._minSide !== null) target = Math.max(this._minSide, target);
        if (this._maxSide !== null) target = Math.min(this._maxSide, target);

        // an explicit fit pins the size the same way a manual drag does
        this._sideRatioMode = false;
        this._setPaneSizes(target, true);
    }

    /**
     * Utility: Parse integer attribute safely.
     */
    _parseAttrInt(el, attr) {
        if (!el.hasAttribute(attr)) return null;
        const v = parseInt(el.getAttribute(attr), 10);
        return isNaN(v) ? null : v;
    }

    /**
     * Returns splitter dimension (width/height) based on orientation.
     */
    _getSplitterSize() {
        if (this._splitterSize) {
            const v = parseInt(this._splitterSize, 10);
            if (!isNaN(v)) return v;
        }
        return this._orientation === "vertical" ? this._splitter.offsetHeight : this._splitter.offsetWidth || 6;
    }

    /**
     * Resolves the effective size unit for the side pane. A unit written inline
     * on the raw size value (e.g. "25%", "10em") wins; otherwise the separate
     * data-unit configuration applies. Returns one of "px", "%", "em", "rem".
     * @param {string} attr Raw data-size value.
     */
    _sideUnit(attr) {
        const clean = String(attr ?? "").trim();
        // rem is checked before em because it also ends with "em"
        if (clean.endsWith("%")) return "%";
        if (clean.endsWith("rem")) return "rem";
        if (clean.endsWith("em")) return "em";
        if (clean.endsWith("px")) return "px";
        return (this._unit === "%" || this._unit === "em" || this._unit === "rem") ? this._unit : "px";
    }

    /**
     * Parses the configured side size to pixels, honouring both an inline unit
     * and the data-unit fallback. Percentages resolve against the current
     * container extent; ratio mode keeps them in sync on later resizes.
     */
    _parseInitialSideSize(attr) {
        if (!attr) return null;
        const val = parseFloat(String(attr).trim());
        if (isNaN(val)) return null;

        switch (this._sideUnit(attr)) {
            case "%": {
                const total = this._orientation === "vertical" ? this._element.clientHeight : this._element.clientWidth;
                return Math.round((val / 100) * total);
            }
            case "em":
            case "rem":
                return Math.round(val * 16);
            default:
                return Math.round(val);
        }
    }

    /**
     * Cookie read helper.
     */
    _getStateFromCookie() {
        if (!this._cookieName) return null;
        const nameEQ = this._cookieName + "=";
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            let c = cookies[i].trim();
            if (c.indexOf(nameEQ) === 0) {
                try {
                    const obj = JSON.parse(decodeURIComponent(c.substring(nameEQ.length)));
                    if (obj && obj.v === 1) return obj;
                } catch (e) { /* ignore */ }
            }
        }
        return null;
    }

    /**
     * Cookie write helper.
     */
    _setStateCookie(state) {
        if (!this._cookieName) return;
        const payload = {
            v: 1,
            size: Math.round(state.size),
            collapsed: !!state.collapsed
        };
        const date = new Date();
        date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
        document.cookie = `${this._cookieName}=${encodeURIComponent(JSON.stringify(payload))}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
    }

    /**
     * Installs MutationObservers on both panes that watch the visibility of
     * their child content. When the children of a pane become invisible the
     * pane and the splitter are removed from the DOM and the remaining pane
     * takes the full container; when content becomes visible again the
     * original three-element layout is restored.
     */
     _initContentVisibility() {
        if (typeof MutationObserver === "undefined") return;

        this._contentObserverConfig = {
            attributes: true,
            attributeFilter: ["style", "class", "hidden"],
            childList: true,
            subtree: true
        };
        const schedule = () => this._scheduleContentVisibilityCheck();

        if (this._sidePane) {
            this._sideContentObserver = new MutationObserver(schedule);
            this._sideContentObserver.observe(this._sidePane, this._contentObserverConfig);
        }
        if (this._mainPane) {
            this._mainContentObserver = new MutationObserver(schedule);
            this._mainContentObserver.observe(this._mainPane, this._contentObserverConfig);
        }
        // initial pass once the browser has had a chance to apply styles
        schedule();
    }

    /**
     * Coalesces visibility re-evaluation into a single rAF tick so a burst
     * of DOM mutations only triggers one layout adjustment.
     */
    _scheduleContentVisibilityCheck() {
        if (this._contentVisibilityPending) return;
        this._contentVisibilityPending = true;
        requestAnimationFrame(() => {
            this._contentVisibilityPending = false;
            this._applyContentVisibility();
        });
    }

    /**
     * Resolves the current content-visibility state of both panes and detaches
     * or re-attaches the corresponding DOM nodes to match.
     */
    _applyContentVisibility() {
        const sideHidden = this._sidePane != null && !this._hasVisibleContent(this._sidePane);
        const mainHidden = this._mainPane != null && !this._hasVisibleContent(this._mainPane);

        if (sideHidden === this._sideContentHidden && mainHidden === this._mainContentHidden) {
            return;
        }

        this._sideContentHidden = sideHidden;
        this._mainContentHidden = mainHidden;

        this._withContentObserversPaused(() => {
            if (sideHidden && mainHidden) {
                this._hideNode(this._sidePane);
                this._hideNode(this._splitter);
                this._hideNode(this._mainPane);
                return;
            }

            if (sideHidden) {
                this._hideNode(this._sidePane);
                this._hideNode(this._splitter);
                this._fillContainer(this._mainPane);
                return;
            }

            if (mainHidden) {
                this._hideNode(this._mainPane);
                this._hideNode(this._splitter);
                this._fillContainer(this._sidePane);
                return;
            }

            this._showNode(this._splitter);
            this._showNode(this._sidePane);
            this._showNode(this._mainPane);

            if (this._sidePaneCollapsed) {
                const prop = this._orientation === "vertical" ? "height" : "width";
                const minProp = this._orientation === "vertical" ? "minHeight" : "minWidth";
                const splitSize = this._getSplitterSize();
                const collapseTo = this._collapseTo;
                if (collapseTo === 0) {
                    this._sidePane.style.display = "none";
                    this._splitter.style.display = "none";
                } else {
                    this._sidePane.style[prop] = `${collapseTo}px`;
                    this._sidePane.style[minProp] = `${collapseTo}px`;
                }
                if (this._mainPane) {
                    this._mainPane.style[prop] = `calc(100% - ${collapseTo === 0 ? 0 : splitSize}px - ${collapseTo}px)`;
                }
            } else {
                this._setPaneSizes(this._sideSize);
            }
        });
    }

    /**
     * Returns true if the pane has at least one direct child that is not
     * hidden via the hidden attribute, an inline display:none, an inline
     * visibility:hidden, or - when the pane is still attached - a stylesheet
     * rule producing the same effect.
     * @param {HTMLElement} pane Pane element to inspect.
     */
    _hasVisibleContent(pane) {
        if (!pane || pane.children.length === 0) return false;
        const attached = pane.isConnected;
        for (const child of pane.children) {
            if (child.hidden) continue;
            if (attached) {
                const style = window.getComputedStyle(child);
                if (style.display !== "none" && style.visibility !== "hidden") return true;
            } else {
                const display = child.style.display;
                const visibility = child.style.visibility;
                if (display !== "none" && visibility !== "hidden") return true;
            }
        }
        return false;
    }
    
    /**
     * Hides a node without removing it from the DOM. Staying connected is
     * important so that getComputedStyle() can still correctly detect
     * class‑based hiding (e.g., Bootstrap’s .d-none) on the child elements.
     */
    _hideNode(node) {
        if (node) node.style.display = "none";
    }

    /**
     * Makes a node visible again after it was previously hidden with _hideNode.
     */
    _showNode(node) {
        if (node) node.style.display = "";
    }

    /**
     * Executes fn() while the content observers are disabled, preventing
     * visibility checks from being triggered by styles written by SplitCtrl
     * itself. Since fn() is synchronous, no real external mutation can be
     * lost during this window.
     */
    _withContentObserversPaused(fn) {
        if (this._sideContentObserver) this._sideContentObserver.disconnect();
        if (this._mainContentObserver) this._mainContentObserver.disconnect();
        try {
            fn();
        } finally {
            if (this._sideContentObserver && this._sidePane) {
                this._sideContentObserver.observe(this._sidePane, this._contentObserverConfig);
            }
            if (this._mainContentObserver && this._mainPane) {
                this._mainContentObserver.observe(this._mainPane, this._contentObserverConfig);
            }
        }
    }

    /**
     * Makes the remaining pane fill the container when its counterpart is
     * detached. Resets any sizing left over from the two-pane layout.
     * @param {HTMLElement} pane Pane that should occupy the full container.
     */
    _fillContainer(pane) {
        if (!pane) return;
        if (this._orientation === "vertical") {
            pane.style.height = "100%";
            pane.style.minHeight = "";
            pane.style.width = "";
        } else {
            pane.style.width = "100%";
            pane.style.minWidth = "";
            pane.style.height = "";
        }
        pane.style.display = "";
    }

    /**
     * Sets minimum size for a specific pane index.
     * @param {number} paneIndex 0 for side/first, 1 for main/second.
     * @param {number} minSize Size in pixels.
     */
    setMinSize(paneIndex, minSize) {
        const isSide = (this._paneOrder === "side-main" && paneIndex === 0) || (this._paneOrder === "main-side" && paneIndex === 1);

        if (isSide) {
            this._minSide = minSize;
            // re-validate current size
            if (!this._sidePaneCollapsed) {
                this._setPaneSizes(Math.max(this._sideSize, minSize));
            }
        } else {
            // logic for main pane min-size could be added here if needed,
            // currently implied by maxside constraint on side pane.
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-split", webexpress.webui.SplitCtrl);