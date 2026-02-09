/**
 * Plugin for link and image insertion using ModalSidebarPanel.
 * Provides toolbar buttons to open dedicated modal panels for inserting links and images.
 */
webexpress.webui.EditorPlugins.register("media", 1000, {
    linkModal: null,
    imageModal: null,

    /**
     * Initialization hook called by the editor when the plugin is registered.
     * no special initialization is required for this plugin.
     * @param {object} editor - the editor instance
     * @returns {void}
     */
    init: function(editor) {
        // no initialization required
    },

    /**
     * Creates toolbar controls for the plugin.
     * returns a document fragment that will be inserted into the editor toolbar.
     * @param {object} editor - the editor instance
     * @returns {DocumentFragment} fragment containing toolbar buttons
     */
    createToolbar: function(editor) {
        const frag = document.createDocumentFragment();

        const sep = document.createElement("span");
        sep.className = "wx-editor-separator";
        frag.appendChild(sep);

        // link button
        const btnLink = document.createElement("button");
        btnLink.className = "wx-editor-btn";
        btnLink.type = "button";
        btnLink.innerHTML = '<i class="fas fa-link"></i>';
        btnLink.addEventListener("click", () => {
            this._openLinkModal(editor);
        });
        frag.appendChild(btnLink);

        // image button
        const btnImg = document.createElement("button");
        btnImg.className = "wx-editor-btn";
        btnImg.type = "button";
        btnImg.innerHTML = '<i class="fas fa-image"></i>';
        btnImg.addEventListener("click", () => {
            this._openImageModal(editor);
        });
        frag.appendChild(btnImg);

        return frag;
    },

    /**
     * Opens the link insertion modal and provides the editor context to the modal controller.
     * creates the modal on first use.
     * @param {object} editor - the editor instance
     * @returns {void}
     */
    _openLinkModal: function(editor) {
        if (!this.linkModal) {
            this.linkModal = this._createModal("editor-link", "Insert Link");
        }

        if (this.linkModal && this.linkModal.ctrl) {
            // provide editor reference to the modal controller for integrations
            this.linkModal.ctrl._editor = editor;

            // show modal via controller API if available
            if (typeof this.linkModal.ctrl.show === "function") {
                this.linkModal.ctrl.show();
            }
        }
    },

    /**
     * Opens the image insertion modal and provides the editor context to the modal controller.
     * creates the modal on first use.
     * @param {object} editor - the editor instance
     * @returns {void}
     */
    _openImageModal: function(editor) {
        if (!this.imageModal) {
            this.imageModal = this._createModal("editor-image", "Insert Image");
        }

        if (this.imageModal && this.imageModal.ctrl) {
            // provide editor reference to the modal controller for integrations
            this.imageModal.ctrl._editor = editor;

            // show modal via controller API if available
            if (typeof this.imageModal.ctrl.show === "function") {
                this.imageModal.ctrl.show();
            }
        }
    },

    /**
     * Creates a minimal ModalSidebarPanel instance and returns a wrapper object.
     * the created element is appended to document.body. the function does not
     * assume any DialogPanels exist; it only prepares the shell.
     *
     * @param {string} key - registry key or identifier used by dialog panels (e.g. "editor-image")
     * @param {string} title - modal header title
     * @returns {{ element: HTMLElement, ctrl: object }} wrapper containing element and controller
     */
    _createModal: function(key, title) {
        const id = "wx-msp-" + key + "-" + Date.now();
        const el = document.createElement("div");
        el.id = id;
        el.setAttribute("data-key", key);
        el.setAttribute("aria-hidden", "true");

        // build minimal modal shell: header, content, footer
        el.innerHTML = `
            <div class="wx-modal-header">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="wx-modal-content"></div>
            <div class="wx-modal-footer">
                <button class="btn btn-primary submit-btn">Insert</button>
            </div>`;

        document.body.appendChild(el);

        // instantiate ModalSidebarPanel for consistent modal layout and sidebar support
        const ctrl = new webexpress.webui.ModalSidebarPanel(el);

        // bind submit button to a placeholder handler; actual panels will provide concrete behavior
        const btn = el.querySelector(".submit-btn");
        if (btn) {
            btn.addEventListener("click", () => {
                // placeholder: panels registered under DialogPanels should implement submission hooks.
                // when a concrete panel sets up handlers it should override or listen to events and perform insertion.
                // keep this minimal to avoid coupling plugin to specific panel implementations.
            });
        }

        return { element: el, ctrl: ctrl };
    }
});