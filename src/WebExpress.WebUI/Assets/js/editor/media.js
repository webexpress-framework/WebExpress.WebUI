/**
 * Keeps image edits at the existing document position and records them as one
 * undoable change, including images wrapped in links.
 */
webexpress.webui.EditorImage = class {
    /**
     * Accepts CSS dimensions that can be safely assigned from the image dialog.
     */
    static dimension(value) {
        const text = String(value ?? "").trim();
        if (!text) {
            return "";
        }
        if (!/^(?:\d+(?:\.\d+)?|\.\d+)(?:px|%)?$/.test(text) || parseFloat(text) <= 0) {
            return null;
        }
        return /(?:px|%)$/.test(text) ? text : text + "px";
    }

    /**
     * Makes image clicks and dialog actions use the same node selection.
     */
    static select(editor, image) {
        const root = editor.getEditorElement();
        if (!root.contains(image) || !webexpress.webui.EditorSelection.isEditable(image, root)) {
            return false;
        }
        const range = document.createRange();
        range.selectNode(image);
        webexpress.webui.EditorSelection.apply(range);
        editor._saveCurrentSelection();
        return true;
    }

    /**
     * Preserves the node, its link and unrelated attributes when an image changes.
     */
    static update(editor, image, values) {
        return this._change(editor, image, () => this._apply(image, values));
    }

    /**
     * Builds new images through DOM attributes so alternative text remains text.
     */
    static insert(editor, values) {
        const image = document.createElement("img");
        this._apply(image, values);
        const container = document.createElement("div");
        container.appendChild(image);
        editor.insertHtmlAtCursor(container.innerHTML);
    }

    /**
     * Removes an image with a recoverable caret and an undo checkpoint.
     */
    static remove(editor, image) {
        return this._change(editor, image, () => image.parentNode.removeChild(image));
    }

    static _change(editor, image, change) {
        if (!this.select(editor, image)) {
            return false;
        }
        editor._history?.prepare();
        change();
        editor._saveCurrentSelection();
        editor._syncValue();
        editor._updateUndoRedoStates();
        return true;
    }

    static _apply(image, values) {
        ["src", "alt"].forEach(name => {
            if (values[name] !== undefined) {
                image.setAttribute(name, values[name]);
            }
        });
        ["width", "height"].forEach(name => {
            if (values[name] !== undefined) {
                const value = this.dimension(values[name]);
                if (value !== null) {
                    image.removeAttribute(name);
                    image.style[name] = value;
                }
            }
        });
        if (values.align !== undefined) {
            image.style.float = "";
            image.style.display = values.align === "inline" ? "" : "block";
            image.style.marginLeft = values.align === "center" || values.align === "right" ? "auto" : "";
            image.style.marginRight = values.align === "center" || values.align === "left" ? "auto" : "";
        }
    }
};

/**
 * Plugin for link and image insertion using ModalSidebarPanelCtrl.
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
        const root = editor.getEditorElement();
        const click = (event) => {
            if (event.target.tagName === "IMG" && webexpress.webui.EditorImage.select(editor, event.target)) {
                event.preventDefault();
            }
        };
        const doubleClick = (event) => {
            if (event.target.tagName === "IMG" && webexpress.webui.EditorImage.select(editor, event.target)) {
                event.preventDefault();
                this._editImage(editor, event.target);
            }
        };
        root.addEventListener("click", click);
        root.addEventListener("dblclick", doubleClick);
        return () => {
            root.removeEventListener("click", click);
            root.removeEventListener("dblclick", doubleClick);
            Object.values(editor._mediaModals || {}).forEach(modal => {
                modal.ctrl.destroy?.();
                modal.element.parentNode?.removeChild(modal.element);
            });
        };
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
        btnLink.innerHTML = `<i class="${webexpress.webui.IconSet.resolve("link")}"></i>`;

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
        btnImg.innerHTML = `<i class="${webexpress.webui.IconSet.resolve("image")}"></i>`;

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
        if (target && target.tagName === "IMG" &&
            webexpress.webui.EditorSelection.isEditable(target, editor.getEditorElement())) {
            items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.edit.image"),
                icon: "edit",
                action: () => this._editImage(editor, target)
            });

            ["left", "center", "right", "inline"].forEach(align => items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.image.align." + align),
                icon: align === "inline" ? "image" : "align-" + align,
                action: () => webexpress.webui.EditorImage.update(editor, target, { align })
            }));
            items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.image.size"),
                icon: "expand",
                submenu: ["25%", "50%", "100%", ""].map(width => ({
                    label: width || webexpress.webui.I18N.translate("webexpress.webui:editor.image.size.original"),
                    action: () => webexpress.webui.EditorImage.update(editor, target, { width, height: "" })
                }))
            });
            items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.remove.image"),
                icon: "trash",
                action: () => webexpress.webui.EditorImage.remove(editor, target)
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
                icon: "edit",
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
                icon: "unlink",
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
     * Keeps the edit target separate from the selection while a dialog is open.
     */
    _editImage: function(editor, target) {
        if (!webexpress.webui.EditorImage.select(editor, target)) {
            return;
        }
        const prefill = {
            target,
            url: target.getAttribute("src") || "",
            alt: target.getAttribute("alt") || "",
            width: target.style.width || target.getAttribute("width") || "",
            height: target.style.height || target.getAttribute("height") || ""
        };
        this._openModal(editor, "imageModal", "editor-image", "webexpress.webui:editor.edit.image",
            prefill, webexpress.webui.EditorSelection.getRange(editor.getEditorElement()));
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
        if (!editor._mediaModals) {
            editor._mediaModals = {};
        }
        if (!editor._mediaModals[modalProperty]) {
            editor._mediaModals[modalProperty] = this._createModal(key, title);
        }
        this[modalProperty] = editor._mediaModals[modalProperty];

        if (this[modalProperty] && this[modalProperty].ctrl) {
            const ctrl = this[modalProperty].ctrl;
            const heading = this[modalProperty].element.querySelector(".modal-title");
            if (heading) {
                heading.textContent = webexpress.webui.I18N.translate(title);
            }

            // provide editor reference to the modal controller
            ctrl._editor = editor;

            // securely store the explicit cursor position
            ctrl._backupRange = activeRange || null;

            // set or clear prefill data to force reset on reuse
            ctrl._linkPrefill = prefill || null;
            ctrl._imagePrefill = prefill || null;
            ctrl._imageTarget = modalProperty === "imageModal" ? prefill?.target || null : null;

            // show modal via controller api if available
            if (typeof ctrl.show === "function") {
                ctrl.show();
            }
            if (modalProperty === "imageModal" && ctrl._imageTarget && typeof ctrl.selectPage === "function") {
                ctrl.selectPage("image-web");
            }
        }
    },

    /**
     * Creates a minimal ModalSidebarPanelCtrl instance and returns a wrapper object.
     * @param {string} key - Registry key or identifier used by dialog panels.
     * @param {string} title - Modal header title.
     * @returns {{ element: HTMLElement, ctrl: object }} Wrapper containing element and controller.
     */
    _createModal: function(key, title) {
        const id = "wx-msp-" + key + "-" + Date.now();
        const el = document.createElement("dialog");
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
        const ctrl = new webexpress.webui.ModalSidebarPanelCtrl(el);

        return { element: el, ctrl: ctrl };
    }
});
