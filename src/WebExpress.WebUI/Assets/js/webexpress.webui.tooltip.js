/**
 * Initializes a Bootstrap tooltip on the host element. The configuration (title,
 * placement) is authored in C# as data-bs-* attributes; this controller only
 * wires the Bootstrap behavior, because Bootstrap — unlike the collapse,
 * offcanvas and dropdown data APIs — does not auto-initialize tooltips.
 */
webexpress.webui.TooltipCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor.
     * @param {HTMLElement} element - The DOM element associated with the instance.
     */
    constructor(element) {
        super(element);

        if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
            this._tooltip = bootstrap.Tooltip.getOrCreateInstance(element);
        }
    }

    /**
     * Disposes the Bootstrap tooltip when the element is removed.
     */
    destroy() {
        if (this._tooltip) {
            this._tooltip.dispose();
            this._tooltip = null;
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-tooltip", webexpress.webui.TooltipCtrl);
