/**
 * Plugin that provides a toolbar button to insert an "Instruction Text" (Anweisungstext)
 * into the editor via a modal dialog. This text is meant to be a visual hint or instruction for authors.
 * It is displayed prominently within the editor but hidden by default outside of it.
 */
webexpress.webui.EditorPlugins.register("instruction", 5000, {
    instructionModal: null,

    init: function(editor) {
        // No automatic initialization needed
    },

    /**
     * Creates toolbar controls for the plugin.
     * @param {object} editor - the editor instance
     * @returns {HTMLElement} toolbar group element
     */
    createToolbar: function(editor) {
        const group = document.createElement("div");
        group.className = "wx-editor-btn-group";

        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.type = "button";
        btn.title = webexpress.webui.I18N.translate("webexpress.webui:editor.instruction.title");
        btn.setAttribute("aria-label", webexpress.webui.I18N.translate("webexpress.webui:editor.instruction.title"));
        btn.innerHTML = '<i class="fas fa-info-circle"></i>';

        btn.addEventListener("mousedown", (e) => {
            e.preventDefault(); // prevent losing focus
            if (typeof editor._saveCurrentSelection === "function") {
                editor._saveCurrentSelection();
            }
        });

        btn.addEventListener("click", () => {
            let prefillText = "";
            let activeRange = null;

            if (editor._savedRange) {
                activeRange = editor._savedRange.cloneRange();
                prefillText = activeRange.toString().trim();
            }

            this._openModal(editor, "instructionModal", "editor-instruction", "webexpress.webui:editor.instruction.title", { text: prefillText }, activeRange);
        });

        group.appendChild(btn);
        return group;
    },

    /**
     * Opens a modal and provides the editor context to the modal controller.
     * Creates the modal on first use to prevent redundant logic.
     * @param {object} editor - The editor instance.
     * @param {string} modalProperty - The property name where the modal wrapper is stored.
     * @param {string} key - Registry key or identifier for the modal.
     * @param {string} title - The title to display in the modal header.
     * @param {object|null} prefill - Optional data to prefill the modal form.
     * @param {Range|null} activeRange - The actively saved text range before focus loss.
     * @returns {void}
     */
    _openModal: function(editor, modalProperty, key, title, prefill, activeRange) {
        if (!this[modalProperty]) {
            this[modalProperty] = this._createModal(key, title);
        }

        if (this[modalProperty] && this[modalProperty].ctrl) {
            const ctrl = this[modalProperty].ctrl;
            ctrl._editor = editor;
            ctrl._backupRange = activeRange ? activeRange.cloneRange() : null;
            ctrl._instructionPrefill = prefill || null;

            if (typeof ctrl.show === "function") {
                ctrl.show();
            }
        }
    },

    /**
     * Creates a minimal ModalSidebarPanel instance and returns a wrapper object.
     * @param {string} key - Registry key or identifier used by dialog panels.
     * @param {string} title - Modal header title.
     * @returns {{ element: HTMLElement, ctrl: object }} Wrapper containing element and controller.
     */
    _createModal: function(key, title) {
        const id = "wx-msp-" + key + "-" + Date.now();
        const el = document.createElement("div");
        el.id = id;
        el.setAttribute("data-size", "modal-md");
        el.setAttribute("data-key", key);
        el.setAttribute("aria-hidden", "true");

        // build minimal modal shell securely with static html
        el.innerHTML = `
            <div class="wx-modal-header">
                <h5 class="modal-title">${webexpress.webui.I18N.translate(title)}</h5>
            </div>
            <div class="wx-modal-content"></div>
            <div class="wx-modal-footer">
                <button class="btn btn-primary submit-btn" disabled>${webexpress.webui.I18N.translate("webexpress.webui:insert")}</button>
            </div>`;

        document.body.appendChild(el);
        const ctrl = new webexpress.webui.ModalSidebarPanel(el);

        return { element: el, ctrl: ctrl };
    }
});