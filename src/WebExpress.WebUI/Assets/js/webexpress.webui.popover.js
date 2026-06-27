/**
 * Initializes a Bootstrap popover on the host element. The configuration (title,
 * content, trigger, placement) is authored in C# as data-bs-* attributes; this
 * controller only wires the Bootstrap behavior, because Bootstrap — unlike the
 * collapse, offcanvas and dropdown data APIs — does not auto-initialize popovers.
 */
webexpress.webui.PopoverCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor.
     * @param {HTMLElement} element - The DOM element associated with the instance.
     */
    constructor(element) {
        super(element);

        if (typeof bootstrap !== "undefined" && bootstrap.Popover) {
            this._popover = bootstrap.Popover.getOrCreateInstance(element);
        }
    }

    /**
     * Disposes the Bootstrap popover when the element is removed.
     */
    destroy() {
        if (this._popover) {
            this._popover.dispose();
            this._popover = null;
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-popover", webexpress.webui.PopoverCtrl);
