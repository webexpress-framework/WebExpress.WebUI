/**
 * ButtonSplitToggleCtrl handles a toggle button to collapse or expand the split side pane.
 * Triggers CLICK_EVENT on toggling.
 */
webexpress.webui.ButtonSplitToggleCtrl = class extends webexpress.webui.ButtonCtrl {
    /**
     * Constructs the controller instance and initializes properties from data attributes.
     * @param {HTMLElement} element - target DOM element
     */
    constructor(element) {
        super(element);

        // read properties from data attributes, fallback to null, use defaults for icons if not set
        this._label = element.dataset.label || null;
        this._iconCollapse = element.dataset.iconCollapse || "fas fa-angles-left";
        this._iconExpand = element.dataset.iconExpand || "fas fa-angles-right";
        this._imageCollapse = element.dataset.imageCollapse || null;
        this._imageExpand = element.dataset.imageExpand || null;

        // initial collapsed state: expanded (false)
        this._collapsed = false;

        // clean up element attributes
        element.innerHTML = "";
        element.removeAttribute("data-label");
        element.removeAttribute("data-iconCollapse");
        element.removeAttribute("data-iconExpand");
        element.removeAttribute("data-imageCollapse");
        element.removeAttribute("data-imageExpand");

        // render initial button view
        this.render();

        // bind click event for toggling
        element.addEventListener("click", () => {
            this._dispatch(webexpress.webui.Event.CLICK_EVENT, {});
        });
    }

    /**
     * Renders the button UI based on the current state and properties.
     */
    render() {
        // always clear previous content
        this._element.innerHTML = "";

        // always render image if present
        if (this._collapsed ? this._imageExpand : this._imageCollapse) {
            const img = document.createElement("img");
            img.className = "wx-icon";
            img.src = this._collapsed ? this._imageExpand : this._imageCollapse;
            this._element.appendChild(img);
        }

        // select icon based on collapsed state
        if (this._collapsed ? this._iconExpand : this._iconCollapse) {
            const icon = document.createElement("i");
            icon.className = this._collapsed ? this._iconExpand : this._iconCollapse;
            this._element.appendChild(icon);
        }

        // render label if present
        if (this._label) {
            const span = document.createElement("span");
            span.textContent = this._label;
            this._element.appendChild(span);
        }
    }

    /**
     * Returns the label.
     */
    get label() {
        return this._label;
    }

    /**
     * Sets the label and triggers render.
     */
    set label(value) {
        this._label = value;
        this.render();
    }

    /**
     * Returns the icon for collapse state.
     */
    get iconCollapse() {
        return this._iconCollapse;
    }

    /**
     * Sets the icon for collapse state and triggers render.
     */
    set iconCollapse(value) {
        this._iconCollapse = value;
        this.render();
    }

    /**
     * Returns the icon for expand state.
     */
    get iconExpand() {
        return this._iconExpand;
    }

    /**
     * Sets the icon for expand state and triggers render.
     */
    set iconExpand(value) {
        this._iconExpand = value;
        this.render();
    }

    /**
     * Returns the image URL for collapse state.
     */
    get imageCollapse() {
        return this._imageCollapse;
    }

    /**
     * Sets the image URL for collapse state and triggers render.
     */
    set imageCollapse(value) {
        this._imageCollapse = value;
        this.render();
    }

    /**
     * Returns the image URL for expand state.
     */
    get imageExpand() {
        return this._imageExpand;
    }

    /**
     * Sets the image URL for expand state and triggers render.
     */
    set imageExpand(value) {
        this._imageExpand = value;
        this.render();
    }

    /**
     * Returns true if collapsed.
     */
    get collapsed() {
        return this._collapsed;
    }

    /**
     * Sets the collapsed state and updates the button view.
     */
    set collapsed(value) {
        this._collapsed = value;
        this.render();
    }

    /**
     * Toggles the collapsed state and updates the button view.
     */
    toggle() {
        this._collapsed = !this._collapsed;
        this.render();
    }
};

// register the controller class
webexpress.webui.Controller.registerClass("wx-webui-button-split-toggle", webexpress.webui.ButtonSplitToggleCtrl);