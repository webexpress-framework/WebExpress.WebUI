/**
 * The settings dialog for a kanban board. It carries the WQL filter that
 * restricts which cards the board loads. On save the passed settings object is
 * mutated in place and the caller's callback runs, so the board persists the
 * change and re-queries with the new filter. A single instance is reused for
 * every open of a board.
 */
webexpress.webui.KanbanBoardSettings = class extends webexpress.webui.ModalCtrl {
    _okButton = document.createElement("button");

    /**
     * Creates the dialog and attaches it to the document body.
     */
    constructor() {
        super(document.createElement("div"));

        document.body.appendChild(this._element);

        this._okButton.type = "button";
        this._okButton.className = "btn btn-primary";
    }

    /**
     * Opens the dialog, seeding the filter field from the current value. The same
     * dialog serves the board filter and a per-swimlane filter; the caller passes
     * the title that names which scope is being edited.
     * @param {object} settings - The settings object to edit in place, carrying { filter }.
     * @param {Function} onSave - Invoked after the settings have been updated.
     * @param {string} [title] - The dialog title; defaults to the board settings title.
     */
    open(settings, onSave, title) {
        this._titleH1.textContent = title || this._i18n("webexpress.webui:kanban.settings.title", "Board settings");

        const form = document.createElement("form");
        form.className = "wx-kanban-settings-form";
        // a settings form has no submit target; entering must not reload the page
        form.addEventListener("submit", (e) => e.preventDefault());

        const filterInput = this._buildFilterField(form, settings.filter);

        this._bodyDiv.innerHTML = "";
        this._bodyDiv.appendChild(form);

        this._okButton.textContent = this._i18n("webexpress.webui:save", "Save");
        this._okButton.onclick = () => {
            settings.filter = filterInput.read().trim();

            if (typeof onSave === "function") {
                onSave();
            }

            this.hide();
        };

        // rebuild the footer so the primary action precedes the inherited cancel
        this._footerDiv.innerHTML = "";
        this._footerDiv.appendChild(this._okButton);
        this._footerDiv.appendChild(this._cancelButton);

        this.show();
    }

    /**
     * Builds the labelled WQL filter row. When the DataWqlPrompt control is
     * available (WebApp loaded) the field is the full WQL prompt with live
     * syntax highlighting; otherwise it degrades to a plain monospace textarea.
     * A help line explains that only matching cards are shown.
     * @param {HTMLElement} form - The form to append to.
     * @param {string|null} value - The current filter, or null.
     * @returns {{read: Function}} An accessor exposing the current value.
     */
    _buildFilterField(form, value) {
        const wrapper = document.createElement("div");
        wrapper.className = "mb-3";

        const labelEl = document.createElement("label");
        labelEl.className = "form-label";
        labelEl.textContent = this._i18n("webexpress.webui:kanban.settings.filter", "Filter (WQL)");

        const help = document.createElement("small");
        help.className = "form-text text-muted";
        help.textContent = this._i18n("webexpress.webui:kanban.settings.filter.help", "Only cards matching this WQL expression are shown.");

        const PromptCtrl = (typeof webexpress !== "undefined" && webexpress.webapp && webexpress.webapp.WqlPromptCtrl) || null;

        wrapper.appendChild(labelEl);

        if (PromptCtrl) {
            // the host deliberately omits the wx-webapp-wql-prompt selector class
            // so the global controller does not also construct the prompt
            const host = document.createElement("div");
            host.className = "wx-kanban-settings-filter";
            wrapper.appendChild(host);
            wrapper.appendChild(help);
            form.appendChild(wrapper);

            const prompt = new PromptCtrl(host);
            prompt.value = value != null ? String(value) : "";

            return { read: () => prompt.value };
        }

        const textarea = document.createElement("textarea");
        textarea.className = "form-control wx-kanban-settings-filter";
        textarea.rows = 3;
        textarea.value = value != null ? String(value) : "";
        textarea.placeholder = this._i18n("webexpress.webui:kanban.settings.filter.placeholder", "e.g. priority = 'high'");

        wrapper.appendChild(textarea);
        wrapper.appendChild(help);
        form.appendChild(wrapper);

        return { read: () => textarea.value };
    }
};
