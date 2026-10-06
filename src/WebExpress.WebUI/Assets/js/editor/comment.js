/**
 * Keeps annotations attached to model text while dialogs temporarily own browser focus.
 */
webexpress.webui.EditorComment = {
    /**
     * Makes existing annotations editable without replacing the annotated text.
     * @param {object} editor - The editor whose comments and dialog are owned by this plugin.
     * @returns {Function} The cleanup for the dialog and its controller.
     */
    init: function(editor) {
        this._editor = editor;
        editor.listen(editor.getEditorElement(), "dblclick", event => {
            const target = event.target.closest?.(".wx-editor-comment");
            if (!target || editor.disabled) return;
            event.preventDefault();
            editor._saveCurrentSelection();
            this.openComment(editor, target.getAttribute("data-comment-id"));
        });
        return () => { this._modal?.destroy(); this._dialog?.remove(); };
    },

    /**
     * Offers editing and removal for the complete annotation across formatting boundaries.
     * @param {object} editor - The editor owning the selected text.
     * @param {HTMLElement} target - The element under the contextual bubble.
     * @returns {Array<object>} The available annotation actions.
     */
    getContextMenuItems: function(editor, target) {
        const span = target?.closest?.(".wx-editor-comment");
        if (!span || !editor.getEditorElement().contains(span)) return [];
        const id = span.getAttribute("data-comment-id");
        const items = [
            { label: this._label("editor.comment.edit"), icon: "comment", action: () => this.openComment(editor, id) }
        ];
        if (editor.deleteComments) items.push({ label: this._label("editor.comment.remove"), icon: "trash", action: () => editor.dispatch({ type: "comment", id, remove: true }) });
        return items;
    },

    /**
     * Captures model positions before the dialog takes focus and rejects ambiguous overlaps.
     * @param {object} editor - The editor whose selection anchors a new annotation.
     * @param {string|null} [id=null] - The annotation to edit regardless of selection direction.
     * @returns {void}
     */
    openComment: function(editor, id = null) {
        if (editor.disabled || editor._destroyed) return;
        const Model = webexpress.webui.EditorModel;
        const state = editor._state;
        const [from, to] = Model.bounds(state);
        const entries = Model.entries(state.doc).filter(entry => entry.node.type === "text");
        const selected = entries.filter(entry => entry.end > from && entry.start < to);
        if (!id && from === to) id = Model.activeMarks(state).comment?.id;
        if (!id && selected.length && selected.every(entry => entry.node.marks.comment?.id === selected[0].node.marks.comment?.id)) {
            id = selected[0].node.marks.comment?.id;
        }
        const comment = id ? entries.find(entry => entry.node.marks.comment?.id === id)?.node.marks.comment : null;
        const overlap = !comment && selected.some(entry => entry.node.marks.comment);
        this._ensureDialog();
        this._context = { id: comment?.id, selection: editor.selection, doc: state.doc };
        this._input.value = comment?.text || "";
        this._input.disabled = !comment && (from === to || !selected.length || overlap);
        this._hint.textContent = this._input.disabled ? this._label(overlap ? "editor.comment.overlap" : "editor.comment.select") : "";
        this._remove.hidden = !comment || !editor.deleteComments;
        this._save.disabled = this._input.disabled || !this._input.value.trim();
        editor.preserveDialogSelection(this._dialog, this._context.selection);
        this._modal.show();
        if (!this._input.disabled) this._input.focus({ preventScroll: true });
    },

    /**
     * Uses ordinary text controls so annotation content can never be interpreted as markup.
     * @returns {void}
     */
    _ensureDialog: function() {
        if (this._dialog) return;
        const dialog = document.createElement("dialog");
        dialog.setAttribute("data-size", "modal-md");
        const header = document.createElement("div");
        header.className = "wx-modal-header";
        header.textContent = this._label("editor.comment.title");
        const content = document.createElement("div");
        content.className = "wx-modal-content";
        const label = document.createElement("label");
        label.className = "form-label d-block";
        label.textContent = this._label("editor.comment.text");
        this._input = document.createElement("textarea");
        this._input.className = "form-control";
        this._input.rows = 4;
        this._input.maxLength = 10000;
        this._input.setAttribute("aria-label", this._label("editor.comment.text"));
        label.appendChild(this._input);
        this._hint = document.createElement("p");
        this._hint.setAttribute("role", "status");
        content.appendChild(label);
        content.appendChild(this._hint);
        const footer = document.createElement("div");
        footer.className = "wx-modal-footer d-flex flex-grow-1 gap-2";
        this._save = this._button("save", "btn btn-primary ms-auto", () => this._commit(false));
        this._remove = this._button("editor.comment.remove", "btn btn-outline-danger me-auto", () => this._commit(true), "trash");
        footer.appendChild(this._remove);
        footer.appendChild(this._save);
        dialog.appendChild(header);
        dialog.appendChild(content);
        dialog.appendChild(footer);
        this._editor.listen(this._input, "input", () => { this._save.disabled = this._input.disabled || !this._input.value.trim(); });
        document.body.appendChild(dialog);
        this._dialog = dialog;
        this._modal = new webexpress.webui.ModalCtrl(dialog);
    },

    /**
     * Prevents a stale dialog from attaching a comment to externally replaced document text.
     * @param {boolean} remove - Whether to remove the entire annotation while keeping its text.
     * @returns {void}
     */
    _commit: function(remove) {
        const editor = this._editor;
        if (editor.disabled || editor._destroyed || editor._state.doc !== this._context.doc) { this._modal.hide(); return; }
        if (remove && (!this._context.id || !editor.deleteComments)) return;
        if (!remove && (this._input.disabled || !this._input.value.trim())) return;
        const action = { type: "comment", id: this._context.id, text: this._input.value, remove, selection: this._context.selection };
        this._modal.hide();
        editor.dispatch(action);
    },

    /**
     * Creates a non-submitting action so dialogs nested in forms cannot save their parent form.
     * @param {string} key - The translated action label key.
     * @param {string} classes - The existing framework button styles.
     * @param {Function} action - The handler owned by this editor.
     * @param {string|null} [icon=null] - The optional symbolic action icon.
     * @returns {HTMLButtonElement} The configured action button.
     */
    _button: function(key, classes, action, icon = null) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = classes;
        if (icon) {
            const drawing = document.createElement("i");
            drawing.className = webexpress.webui.IconSet.resolve(icon) + " me-2";
            drawing.setAttribute("aria-hidden", "true");
            button.appendChild(drawing);
        }
        button.appendChild(document.createTextNode(this._label(key)));
        this._editor.listen(button, "click", action);
        return button;
    },

    /**
     * Resolves labels at use time so the dialog follows the active language.
     * @param {string} key - The key in the WebUI translation namespace.
     * @returns {string} The localized label.
     */
    _label: function(key) { return webexpress.webui.I18N.translate("webexpress.webui:" + key); }
};

webexpress.webui.EditorPlugins.register("comment", 5100, webexpress.webui.EditorComment);
