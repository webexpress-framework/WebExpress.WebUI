/**
 * Presents contextual information in the browser top layer using an independent CSS anchor.
 */
webexpress.webui.TooltipCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Keeps text supplied by the server as text, including titles containing markup.
     */
    constructor(element) {
        super(element);
        this._menu = document.createElement("div");
        this._menu.className = "wx-tooltip";
        const title = element.getAttribute("data-wx-title") || element.getAttribute("title") || "";
        const message = element.getAttribute("data-wx-content") || "";
        this._menu.textContent = title;
        if (message) {
            const body = document.createElement("p");
            body.textContent = message;
            this._menu.appendChild(body);
        }
        element.removeAttribute("title");
        element.after(this._menu);
        webexpress.webui.NativeMenu.bind(element, this._menu, null);
        this._menu.setAttribute("popover", "hint");
        // the title left the element with the hint; the description reference brings the text
        // back to the reader whether or not the hint is showing
        this._menu.setAttribute("role", "tooltip");
        element.setAttribute("aria-describedby", this._menu.id);
        this._menu.setAttribute("data-wx-placement", element.getAttribute("data-wx-placement") || "top");
        const triggers = "hover focus";
        this._show = () => webexpress.webui.NativeMenu.show(this._menu);
        this._hide = () => webexpress.webui.NativeMenu.hide(this._menu);
        if (triggers.includes("hover")) {
            element.addEventListener("pointerenter", this._show);
            element.addEventListener("pointerleave", this._hide);
        }
        if (triggers.includes("focus")) {
            element.addEventListener("focusin", this._show);
            element.addEventListener("focusout", this._hide);
        }
    }

    /**
     * Releases the generated top-layer entry with its owner.
     */
    destroy() {
        this._element.removeEventListener("pointerenter", this._show);
        this._element.removeEventListener("pointerleave", this._hide);
        this._element.removeEventListener("focusin", this._show);
        this._element.removeEventListener("focusout", this._hide);
        webexpress.webui.NativeMenu.hide(this._menu);
        this._menu.remove();
        super.destroy();
    }
};

webexpress.webui.Controller.registerClass("wx-webui-tooltip", webexpress.webui.TooltipCtrl);
