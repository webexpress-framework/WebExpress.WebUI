/**
 * A responsive control for dynamically showing or hiding panels based on breakpoints.
 * Triggers the following events:
 * - webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT
 */
webexpress.webui.ResponsiveCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element - the DOM element for the responsive control.
     */
    constructor(element) {
        super(element);

        // find all panels and extract their breakpoints
        this._panels = Array.from(element.children).filter((child) => {
            return child.classList.contains("wx-responsive-panel");
        });

        // identify the fallback panel, if present
        this._fallbackPanel = Array.from(element.children).find((child) => {
            return child.classList.contains("wx-responsive-panel-fallback");
        });

        this._breakpoints = this._panels.map((panel) => {
            const breakpoint = parseInt(panel.getAttribute("data-breakpoint"), 10);
            return {
                size: breakpoint,
                panel: panel
            };
        }).sort((a, b) => a.size - b.size); // sort by breakpoint size ascending

        // initialize the current breakpoint
        this._currentBreakpoint = null;

        // set base class
        element.classList.add("wx-responsive");

        // observe size changes of the container
        this._resizeObserver = new ResizeObserver(() => {
            this._updatePanelsVisibility();
        });

        // safely start observing the element
        try {
            this._resizeObserver.observe(this._element);
        } catch (err) {
            // ignore observer errors
        }

        // initial visibility setup
        this._updatePanelsVisibility();
    }

    /**
     * Updates the visibility of panels based on the current container size.
     * If no breakpoint matches, shows the fallback panel (if available).
     * @returns {void}
     */
    _updatePanelsVisibility() {
        const containerWidth = this._element.clientWidth;
        let matchedBreakpoint = null;

        // find the largest matching breakpoint
        for (const breakpoint of this._breakpoints) {
            if (containerWidth >= breakpoint.size) {
                matchedBreakpoint = breakpoint;
            } else {
                break;
            }
        }

        // if the breakpoint hasn't changed, do nothing
        if (this._currentBreakpoint === matchedBreakpoint) {
            return;
        }

        this._currentBreakpoint = matchedBreakpoint;

        // update the visibility of each panel
        this._breakpoints.forEach((entry) => {
            if (entry === matchedBreakpoint) {
                entry.panel.style.display = "";
            } else {
                entry.panel.style.display = "none";
            }
        });

        // handle fallback panel visibility
        if (this._fallbackPanel) {
            if (!matchedBreakpoint) {
                this._fallbackPanel.style.display = "";
            } else {
                this._fallbackPanel.style.display = "none";
            }
        }

        // fire breakpoint change event
        this._dispatch(webexpress.webui.Event.BREAKPOINT_CHANGE_EVENT, {
            breakpoint: matchedBreakpoint ? matchedBreakpoint.size : null,
        });
    }

    /**
     * Refresh the control by re-evaluating the current size and updating visibility.
     * @returns {void}
     */
    refresh() {
        this._updatePanelsVisibility();
    }

    /**
     * Destroys the control and cleans up any observers or event listeners.
     * @returns {void}
     */
    destroy() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-responsive", webexpress.webui.ResponsiveCtrl);