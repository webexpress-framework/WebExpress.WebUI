/**
 * Plugin for Link and Image insertion via ModalSidebarPanel.
 */
webexpress.webui.EditorPlugins.register("media", {
    linkModal: null,
    imageModal: null,

    init: function(editor) {
        // no specific init needed
    },

    createToolbar: function(editor) {
        const frag = document.createDocumentFragment();
        
        const sep = document.createElement("span");
        sep.className = "wx-editor-separator";
        frag.appendChild(sep);
        
        // Link Button
        const btnLink = document.createElement("button");
        btnLink.className = "wx-editor-btn";
        btnLink.innerHTML = '<i class="fas fa-link"></i>';
        btnLink.addEventListener("click", () => { this._openLinkModal(editor); });
        frag.appendChild(btnLink);

        // Image Button
        const btnImg = document.createElement("button");
        btnImg.className = "wx-editor-btn";
        btnImg.innerHTML = '<i class="fas fa-image"></i>';
        btnImg.addEventListener("click", () => { this._openImageModal(editor); });
        frag.appendChild(btnImg);
        
        return frag;
    },

    _openLinkModal: function(editor) {
        if (!this.linkModal) {
            this.linkModal = this._createModal("editor-link", "Insert Link");
        }
        
        // configure modal context before showing
        if (this.linkModal.ctrl) {
            this.linkModal.ctrl._editor = editor;
            // logic to find selected link would go here
            if (typeof this.linkModal.ctrl.show === "function") {
                this.linkModal.ctrl.show();
            }
        }
    },

    _openImageModal: function(editor) {
        if (!this.imageModal) {
            this.imageModal = this._createModal("editor-image", "Insert Image");
        }
        
        if (this.imageModal.ctrl) {
            this.imageModal.ctrl._editor = editor;
            if (typeof this.imageModal.ctrl.show === "function") {
                this.imageModal.ctrl.show();
            }
        }
    },

    _createModal: function(key, title) {
        const id = "wx-msp-" + key + "-" + Date.now();
        const el = document.createElement("div");
        el.id = id;
        el.setAttribute("data-key", key);
        el.setAttribute("aria-hidden", "true");
        el.innerHTML = `
            <div class="wx-modal-header">${title}</div>
            <div class="wx-modal-content"></div>
            <div class="wx-modal-footer">
                <button class="btn btn-primary submit-btn">Insert</button>
            </div>`;
        document.body.appendChild(el);
        
        const ctrl = new webexpress.webui.ModalSidebarPanel(el);
        
        // bind internal submit button to modal logic if needed
        const btn = el.querySelector(".submit-btn");
        if(btn) {
            btn.addEventListener("click", () => {
                // custom integration logic would call dialog panels here
                // for now we assume ModalSidebarPanel handles DialogPanels events
            });
        }

        return { element: el, ctrl: ctrl };
    }
});