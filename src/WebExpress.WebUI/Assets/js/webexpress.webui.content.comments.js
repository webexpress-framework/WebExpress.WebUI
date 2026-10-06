/**
 * Enables annotation transactions on a reading projection without making document text editable.
 */
webexpress.webui.ContentComments = class extends webexpress.webui.Ctrl {
    /**
     * Shares the editor comment dialog while keeping selection and persistence with the reading control.
     * @param {object} content - The ContentCtrl that explicitly enables comments.
     */
    constructor(content) {
        super(content._element);
        this._content = content;
        this._listeners = [];
        this._destroyed = false;
        this._view = new webexpress.webui.EditorView(this);
        this._plugin = Object.assign({}, webexpress.webui.EditorComment);
        this._cleanup = this._plugin.init(this);
        this._bubble = document.createElement("div");
        this._bubble.className = "wx-editor-bubble shadow";
        this._bubble.setAttribute("role", "toolbar");
        this._bubble.setAttribute("aria-label", this._plugin._label("editor.comment.title"));
        this._bubble.style.position = "fixed";
        this._bubble.style.display = "none";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "wx-editor-bubble-btn";
        button.title = this._plugin._label("editor.comment.title");
        button.setAttribute("aria-label", button.title);
        const icon = document.createElement("i");
        icon.className = webexpress.webui.IconSet.resolve("comment");
        icon.setAttribute("aria-hidden", "true");
        button.appendChild(icon);
        this.listen(button, "mousedown", event => { this._saveCurrentSelection(); event.preventDefault(); });
        this.listen(button, "click", () => { this._plugin.openComment(this); this._hide(); });
        this._bubble.appendChild(button);
        document.body.appendChild(this._bubble);
        this.listen(document, "selectionchange", () => this._updateBubble());
        this.listen(window, "scroll", () => this._updateBubble(), true);
        this.listen(window, "resize", () => this._updateBubble());
        this.listen(document, "mousedown", event => {
            if (!this._element.contains(event.target) && !this._bubble.contains(event.target)) this._hide();
        });
        this.listen(document, "keydown", event => { if (event.key === "Escape") this._hide(); });
    }

    /**
     * Creates a validated model for mapping the reading projection back to persistent text positions.
     * @param {string} value - The rich-text value supplied by the host application.
     * @returns {object} The state used for the next reading projection.
     */
    read(value) {
        this._hide();
        this._state = typeof value === "string" && value.trim().startsWith("{")
            ? webexpress.webui.EditorModel.validate(JSON.parse(value))
            : webexpress.webui.EditorHtml.read(value || "").state;
        return this._state;
    }

    /**
     * Makes annotation permission available to the shared dialog without enabling text editing.
     * @returns {boolean} Whether annotation actions must be rejected.
     */
    get disabled() { return this._destroyed || !this._content._allowComments; }

    /**
     * Provides the reading root for selection ownership checks in the shared dialog.
     * @returns {HTMLElement} The annotated reading surface.
     */
    getEditorElement() { return this._element; }

    /**
     * Returns detached positions so dialog focus changes cannot mutate the captured selection.
     * @returns {{anchor:number, focus:number}} The current model selection.
     */
    get selection() { return { ...this._state.selection }; }

    /**
     * Restores model-backed browser selection after an annotation dialog closes.
     * @param {object} value - The selection positions to validate and restore.
     */
    set selection(value) {
        this._state.selection = webexpress.webui.EditorModel.validate({ ...this._state, selection: value }).selection;
        this._view.restore(this._state.selection);
    }

    /**
     * Captures only selections whose endpoints are mapped document text in this control.
     * @returns {void}
     */
    _saveCurrentSelection() {
        const selection = this._view.selection(this._element);
        if (selection && this._state) this._state.selection = selection;
    }

    /**
     * Keeps cancellation harmless when the application replaces content while the dialog is open.
     * @param {HTMLDialogElement} dialog - The comment dialog taking focus.
     * @param {object} selection - The selection captured before opening the dialog.
     * @returns {void}
     */
    preserveDialogSelection(dialog, selection) {
        const doc = this._state.doc;
        this.listen(dialog, "close", () => {
            if (!this._destroyed && this._state.doc === doc) this.selection = selection;
        }, { once: true });
    }

    /**
     * Limits explicit annotation removal to the permission supplied by the host application.
     * @returns {boolean} Whether comment deletion is enabled for this control.
     */
    get deleteComments() { return this._element.getAttribute("data-delete-comments") === "true"; }

    /**
     * Publishes only annotation changes; the host remains responsible for saving the new rich-text value.
     * @param {object} action - The comment transaction supplied by the shared dialog.
     * @returns {boolean} Whether an annotation changed.
     */
    dispatch(action) {
        if (action.type === "comment" && action.remove && !this.deleteComments) return false;
        if (this.disabled || action.type !== "comment") return false;
        const next = webexpress.webui.EditorModel.reduce(this._state, action);
        if (JSON.stringify(next.doc) === JSON.stringify(this._state.doc)) return false;
        const value = { version: next.version, doc: next.doc };
        this._content._value = JSON.stringify(value);
        this._content.render();
        this.selection = next.selection;
        this._content._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value });
        return true;
    }

    /**
     * Shows the annotation action only for a nonempty selection on this reading surface.
     * @returns {void}
     */
    _updateBubble() {
        if (this.disabled || !this._state || document.querySelector("dialog[open]")) { this._hide(); return; }
        const selection = this._view.selection(this._element);
        const browserSelection = window.getSelection();
        if (!selection || selection.anchor === selection.focus || !browserSelection?.toString().trim()) { this._hide(); return; }
        this._state.selection = selection;
        const rect = browserSelection.getRangeAt(0).getBoundingClientRect();
        if (!rect.width && !rect.height) { this._hide(); return; }
        this._bubble.style.display = "flex";
        const width = this._bubble.offsetWidth || 40;
        this._bubble.style.left = Math.max(8, Math.min(rect.left, (window.innerWidth || 1024) - width - 8)) + "px";
        this._bubble.style.top = Math.max(8, Math.min(rect.bottom + 8, (window.innerHeight || 768) - (this._bubble.offsetHeight || 36) - 8)) + "px";
    }

    /**
     * Hides selection actions without changing the browser selection or document.
     * @returns {void}
     */
    _hide() { if (this._bubble) this._bubble.style.display = "none"; }

    /**
     * Owns event registrations so removing a reading control also releases its global listeners.
     * @param {EventTarget} target - The event source.
     * @param {string} type - The event name.
     * @param {Function} handler - The callback owned by this annotation session.
     * @param {object|boolean} [options=false] - The native event listener options.
     * @returns {void}
     */
    listen(target, type, handler, options = false) {
        target.addEventListener(type, handler, options);
        this._listeners.push(() => target.removeEventListener(type, handler, options));
    }

    /**
     * Releases the dialog, bubble and global listeners without affecting the reading document.
     * @returns {void}
     */
    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        this._cleanup?.();
        this._listeners.forEach(remove => remove());
        this._listeners = [];
        this._bubble.remove();
        super.destroy();
    }
};
