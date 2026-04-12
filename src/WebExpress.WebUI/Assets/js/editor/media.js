/**
 * Plugin for link and image insertion using ModalSidebarPanel.
 * Provides toolbar buttons to open dedicated modal panels for inserting links and images.
 */
webexpress.webui.EditorPlugins.register("media", 1000, {
    linkModal: null,
    imageModal: null,

    /**
     * Initialization hook called by the editor when the plugin is registered.
     * No special initialization is required for this plugin.
     * @param {object} editor - The editor instance.
     * @returns {void}
     */
    init: function(editor) {
        // no initialization required
    },

    /**
     * Creates toolbar controls for the plugin.
     * Returns a document fragment that will be inserted into the editor toolbar.
     * @param {object} editor - The editor instance.
     * @returns {DocumentFragment} Fragment containing toolbar buttons.
     */
    createToolbar: function(editor) {
        const frag = document.createDocumentFragment();

        const sep = document.createElement("span");
        sep.className = "wx-editor-separator";
        frag.appendChild(sep);

        // create link button safely
        const btnLink = document.createElement("button");
        btnLink.className = "wx-editor-btn";
        btnLink.type = "button";
        btnLink.title = webexpress.webui.I18N.translate("webexpress.webui:editor.insert.link");
        btnLink.setAttribute("aria-label", webexpress.webui.I18N.translate("webexpress.webui:editor.insert.link"));
        btnLink.innerHTML = '<i class="fas fa-link"></i>';

        // save selection firmly before focus shifts away from the editor
        btnLink.addEventListener("mousedown", (e) => {
            e.preventDefault(); // prevent losing focus
            if (typeof editor._saveCurrentSelection === "function") {
                editor._saveCurrentSelection();
            }
        });

        btnLink.addEventListener("click", () => {
            let prefillText = "";
            let activeRange = null;

            if (editor._savedRange) {
                activeRange = editor._savedRange.cloneRange();
                prefillText = activeRange.toString().trim();
            }

            this._openModal(editor, "linkModal", "editor-link", "webexpress.webui:editor.insert.link.title", { url: "", text: prefillText }, activeRange);
        });
        frag.appendChild(btnLink);

        // create image button safely
        const btnImg = document.createElement("button");
        btnImg.className = "wx-editor-btn";
        btnImg.type = "button";
        btnImg.title = webexpress.webui.I18N.translate("webexpress.webui:editor.insert.image");
        btnImg.setAttribute("aria-label", webexpress.webui.I18N.translate("webexpress.webui:editor.insert.image"));
        btnImg.innerHTML = '<i class="fas fa-image"></i>';

        btnImg.addEventListener("mousedown", (e) => {
            e.preventDefault(); // prevent losing focus
            if (typeof editor._saveCurrentSelection === "function") {
                editor._saveCurrentSelection();
            }
        });

        btnImg.addEventListener("click", () => {
            let activeRange = null;
            if (editor._savedRange) {
                activeRange = editor._savedRange.cloneRange();
            }
            // pass null as prefill to enforce clearing of old data
            this._openModal(editor, "imageModal", "editor-image", "webexpress.webui:editor.insert.image.title", null, activeRange);
        });
        frag.appendChild(btnImg);

        return frag;
    },

    /**
     * Provides context menu items for the plugin.
     * @param {object} editor - The editor instance.
     * @param {HTMLElement} target - The target element that was right-clicked.
     * @returns {Array} List of context menu items.
     */
    getContextMenuItems: function(editor, target) {
        const items = [];

        // check for image element
        if (target && target.nodeName === "IMG") {
            items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.edit.image"),
                icon: "fas fa-edit",
                action: () => {
                    const sel = window.getSelection();
                    let activeRange = null;

                    if (sel) {
                        const range = document.createRange();
                        range.selectNode(target);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        activeRange = range.cloneRange();

                        if (typeof editor._saveCurrentSelection === "function") {
                            editor._saveCurrentSelection();
                        }
                    }

                    const prefill = {
                        url: target.getAttribute("src") || "",
                        alt: target.getAttribute("alt") || ""
                    };
                    this._openModal(editor, "imageModal", "editor-image", "webexpress.webui:editor.insert.image.title", prefill, activeRange);
                }
            });

            items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.remove.image"),
                icon: "fas fa-trash",
                action: () => {
                    target.remove();
                    if (typeof editor._syncValue === "function") {
                        editor._syncValue();
                    }
                    if (typeof editor._updateUndoRedoStates === "function") {
                        editor._updateUndoRedoStates();
                    }
                }
            });
        }

        // find nearest anchor tag if right-clicked inside a link
        let anchor = target;
        while (anchor && anchor.nodeName !== "A" && !anchor.classList?.contains("wx-editor-content")) {
            anchor = anchor.parentElement;
        }

        if (anchor && anchor.nodeName === "A") {
            items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.edit.link"),
                icon: "fas fa-edit",
                action: () => {
                    const sel = window.getSelection();
                    let activeRange = null;

                    if (sel) {
                        const range = document.createRange();
                        range.selectNode(anchor);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        activeRange = range.cloneRange();

                        if (typeof editor._saveCurrentSelection === "function") {
                            editor._saveCurrentSelection();
                        }
                    }

                    const prefill = {
                        url: anchor.getAttribute("href") || "",
                        text: anchor.textContent || ""
                    };
                    this._openModal(editor, "linkModal", "editor-link", "webexpress.webui:editor.insert.link.title", prefill, activeRange);
                }
            });

            items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.remove.link"),
                icon: "fas fa-unlink",
                action: () => {
                    const sel = window.getSelection();
                    if (sel) {
                        const range = document.createRange();
                        range.selectNode(anchor);
                        sel.removeAllRanges();
                        sel.addRange(range);

                        if (typeof editor._saveCurrentSelection === "function") {
                            editor._saveCurrentSelection();
                        }
                    }

                    const text = anchor.textContent || "";
                    if (typeof editor.restoreSavedRange === "function") {
                        editor.restoreSavedRange();
                    }
                    if (typeof editor.insertHtmlAtCursor === "function") {
                        const div = document.createElement("div");
                        div.textContent = text;
                        editor.insertHtmlAtCursor(div.innerHTML);
                    }
                }
            });
        }

        return items;
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

            // provide editor reference to the modal controller
            ctrl._editor = editor;

            // securely store the explicit cursor position
            ctrl._backupRange = activeRange || null;

            // set or clear prefill data to force reset on reuse
            ctrl._linkPrefill = prefill || null;
            ctrl._imagePrefill = prefill || null;

            // show modal via controller api if available
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
        el.setAttribute("data-size", "modal-lg");
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