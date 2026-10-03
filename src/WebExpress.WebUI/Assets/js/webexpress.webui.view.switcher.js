/**
 * The presentation switch every control that offers several views of one subject
 * uses: a segmented group of entries, one per presentation, the selected one
 * lifted out of the track.
 *
 * It is a helper rather than a registered control, because it is never authored
 * on its own - a host builds it, places it in its own toolbar and is told which
 * entry the user picked. Having one implementation is what makes a view switch
 * look and behave the same wherever it appears, so a user who learned it on one
 * surface recognises it on the next.
 *
 * The entry markup carries data-view-tab, and the group listens once rather than
 * every entry listening for itself, so a rebuilt set of entries needs no
 * bookkeeping.
 */
webexpress.webui.ViewSwitcher = class {

    /**
     * Creates a switch.
     * @param {object} [options] - views: the presentations, each { name, label,
     *   icon, image }; active: the name of the selected one; onSelect: called
     *   with the name the user picked.
     */
    constructor(options = {}) {
        this._onSelect = typeof options.onSelect === "function" ? options.onSelect : null;
        this._active = options.active || null;
        this._items = new Map();

        this._element = document.createElement("div");
        this._element.className = "wx-view-switcher";
        this._element.setAttribute("role", "group");

        this._element.addEventListener("click", (e) => this._onClick(e));

        this.views = options.views || [];
    }

    /**
     * Returns the element to place in the host's toolbar.
     * @returns {HTMLElement} The group.
     */
    get element() {
        return this._element;
    }

    /**
     * Returns the name of the selected presentation.
     * @returns {string|null} The name.
     */
    get active() {
        return this._active;
    }

    /**
     * Marks a presentation as the selected one. Selecting through the property
     * only reflects the state; it does not call back, because the host is the
     * one that set it.
     * @param {string} name - The name of the presentation.
     */
    set active(name) {
        this._active = name;

        for (const [key, item] of this._items) {
            const selected = key === name;
            item.classList.toggle("wx-view-switcher-active", selected);
            item.setAttribute("aria-pressed", selected ? "true" : "false");
        }
    }

    /**
     * Replaces the presentations the switch offers.
     * @param {Array<object>} views - The presentations.
     */
    set views(views) {
        while (this._element.firstChild) {
            this._element.removeChild(this._element.firstChild);
        }

        this._items.clear();

        for (const view of Array.isArray(views) ? views : []) {
            const item = this._createItem(view);
            this._items.set(view.name, item);
            this._element.appendChild(item);
        }

        // a switch over a single presentation offers no choice, so it is a
        // control that cannot be operated; it steps aside rather than sitting in
        // the toolbar looking pressed
        if (this._items.size > 1) {
            this._element.removeAttribute("hidden");
        } else {
            this._element.setAttribute("hidden", "hidden");
        }

        // the selection is re-applied rather than assumed, so a rebuilt set
        // still shows which entry is the current one
        this.active = this._items.has(this._active) ? this._active : (views && views[0] ? views[0].name : null);
    }

    /**
     * Returns the presentations the switch offers.
     * @returns {Array<string>} The names, in the order they are offered.
     */
    get views() {
        return Array.from(this._items.keys());
    }

    /**
     * Returns the entry of a presentation, for a host that has to reach it.
     * @param {string} name - The name of the presentation.
     * @returns {HTMLElement|null} The entry.
     */
    itemOf(name) {
        return this._items.get(name) || null;
    }

    /**
     * Builds one entry.
     * @param {object} view - The presentation: { name, label, icon, image }.
     * @returns {HTMLElement} The entry.
     */
    _createItem(view) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "wx-view-switcher-item";
        item.dataset.view = view.name;
        item.setAttribute("data-view-tab", view.name);

        const icon = webexpress.webui.Icon.create(view.image || view.icon);
        if (icon) {
            item.appendChild(icon);
        }

        const label = document.createElement("span");
        label.textContent = view.label || view.name;
        item.appendChild(label);

        // the caption is hidden on a narrow toolbar, where the glyph carries the
        // entry alone; the title keeps it reachable there
        item.title = view.label || view.name;

        return item;
    }

    /**
     * Reports the entry the user picked.
     * @param {Event} e - The click.
     */
    _onClick(e) {
        const item = e.target && typeof e.target.closest === "function"
            ? e.target.closest("[data-view-tab]")
            : null;

        if (!item) {
            return;
        }

        const name = item.getAttribute("data-view-tab");

        if (name === this._active) {
            return;
        }

        if (this._onSelect) {
            this._onSelect(name);
        }
    }
};
