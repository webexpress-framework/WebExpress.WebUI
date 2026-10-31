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
        const attrs = { ...values };
        return editor.updateNode(image, attrs);
    }

    static insert(editor, values, selection = editor.selection) {
        return editor.dispatch({ type: "insertNodes", nodes: [webexpress.webui.EditorModel.node("image", [], values)], selection });
    }

    static remove(editor, image) { return editor.removeNode(image); }

    /**
     * Describes one opening of the image dialog to its panels. Panels of other modules register
     * under the "editor-image" key and only read the prefill and hand their result to apply(),
     * so insertion, replacement and address rules are the same whichever module provides them.
     * @param {object} editor - The editor instance.
     * @param {HTMLElement|null} [image=null] - The rendered image to edit, or null to insert one.
     * @returns {object} The dialog context, exposed to panels as modal.editorDialog.
     */
    static dialog(editor, image = null) {
        const Model = webexpress.webui.EditorModel;
        // the id survives the re-render a dispatch causes, the element does not
        const id = image ? editor.nodeId(image) : null;
        // the caret at opening time, because focus moves into the dialog
        const selection = editor.selection;
        const address = value => Model.url(Model.completeUrl(value), true);
        const apply = values => {
            const attrs = { src: address(values?.src), alt: String(values?.alt ?? "").trim() };
            if (!attrs.src) {
                return false;
            }
            // an omitted dimension keeps the current one, an empty one means automatic sizing
            for (const name of ["width", "height"]) {
                if (values[name] !== undefined) {
                    attrs[name] = this.dimension(values[name]);
                    if (attrs[name] === null) {
                        return false;
                    }
                }
            }
            if (!id) {
                this.insert(editor, attrs, selection);
                return true;
            }
            if (!Model.find(editor._state.doc, id)) {
                return false;
            }
            // a save without changes is no failure
            this.update(editor, id, attrs);
            return true;
        };
        return {
            editor,
            mode: id ? "edit" : "insert",
            prefill: {
                url: image?.getAttribute("src") || "",
                alt: image?.getAttribute("alt") || "",
                width: image?.style.width || image?.getAttribute("width") || "",
                height: image?.style.height || image?.getAttribute("height") || ""
            },
            address,
            apply
        };
    }
};

/**
 * Resolves links to model ranges. The view renders every text run of a link as an anchor of its
 * own, so acting on the clicked anchor alone would split the link and drop its formatting, and an
 * image carries its link as an attribute rather than as text.
 */
webexpress.webui.EditorLink = class {
    /**
     * Determines what the link dialog acts on: a selected image, the link around the caret, or
     * the selected text, whose formatting survives when only a destination is added.
     * @param {object} editor - The editor instance.
     * @returns {object} The link target for apply() and remove().
     */
    static selected(editor) {
        const Model = webexpress.webui.EditorModel, state = editor._state, [from, to] = Model.bounds(state);
        const entries = Model.entries(state.doc);
        const image = to === from + 1 && entries.find(e => e.start === from && e.node.type === "image");
        if (image) {
            return this._image(image);
        }
        const link = from === to && entries.find(e => e.node.type === "text" && e.node.marks.link && e.start < from && e.end > from);
        if (link) {
            return this._run(state, link);
        }
        const text = entries.filter(e => e.node.type === "text" && e.end > from && e.start < to)
            .map(e => e.node.text.slice(Math.max(0, from - e.start), to - e.start)).join("");
        return { ...state.selection, text, marks: Model.insertionMarks({ ...state, storedMarks: null }) };
    }

    /**
     * Resolves a rendered anchor to the whole link it belongs to.
     * @param {object} editor - The editor instance.
     * @param {HTMLElement} anchor - The rendered anchor element.
     * @returns {object|null} The link target, or null for an anchor outside the model.
     */
    static of(editor, anchor) {
        const entry = editor._view.entry(anchor.firstChild ?? anchor);
        if (entry?.node.type === "image") {
            return entry.node.attrs.link ? this._image(entry) : null;
        }
        return entry?.node.type === "text" && entry.node.marks.link ? this._run(editor._state, entry) : null;
    }

    /**
     * Applies a destination as one undoable change. Text that the dialog left unchanged only
     * receives the mark, so paragraphs, atoms and formatting inside the selection stay intact.
     * @param {object} editor - The editor instance.
     * @param {object} target - The target from selected() or of().
     * @param {{href: string, target: string}} link - The validated destination.
     * @param {string} text - The text the link should read.
     * @returns {boolean} True if the document changed.
     */
    static apply(editor, target, link, text) {
        if (target.id) {
            return editor.updateNode(target.id, { link });
        }
        const selection = { anchor: target.anchor, focus: target.focus };
        if (target.anchor !== target.focus && text === target.text) {
            return editor.dispatch({ type: "format", mark: "link", value: link, selection });
        }
        return editor.dispatch({ type: "insertNodes", selection, nodes: [{ type: "text", text, marks: { ...target.marks, link } }] });
    }

    /**
     * Removes a link but keeps its text, formatting and images.
     * @param {object} editor - The editor instance.
     * @param {object} target - The target from selected() or of().
     * @returns {boolean} True if the document changed.
     */
    static remove(editor, target) {
        if (target.id) {
            return editor.updateNode(target.id, { link: null });
        }
        return editor.dispatch({ type: "format", mark: "unlink", selection: { anchor: target.anchor, focus: target.focus } });
    }

    /**
     * Describes one opening of the link dialog to its panels. Panels of other modules register
     * under the "editor-link" key and hand their result to apply(), so a page picker of another
     * module links exactly like an entered address.
     * @param {object} editor - The editor instance.
     * @param {object} [target=selected(editor)] - The target from selected() or of().
     * @returns {object} The dialog context, exposed to panels as modal.editorDialog.
     */
    static dialog(editor, target = this.selected(editor)) {
        const Model = webexpress.webui.EditorModel;
        const address = value => Model.url(Model.completeUrl(value));
        const apply = values => {
            const href = address(values?.href);
            if (!href) {
                return false;
            }
            // without a choice, only links that leave the site open in a new tab
            const newTab = values.newTab ?? this.external(href);
            const text = String(values.text ?? "").trim() || target.text || href.replace(/^(?:https?:\/\/|mailto:)/i, "");
            this.apply(editor, target, { href, target: newTab ? "_blank" : "" }, text);
            return true;
        };
        return {
            editor,
            mode: target.link ? "edit" : "insert",
            prefill: {
                url: target.link?.href ?? "",
                text: target.text ?? "",
                newTab: target.link ? target.link.target === "_blank" : null,
                image: !!target.id
            },
            address,
            apply
        };
    }

    /**
     * Tells whether an address leaves the site, which decides the new tab when the dialog left
     * the choice open. An absolute address of this very site - as a sitemap resolves its pages -
     * stays internal.
     * @param {string} href - The completed address.
     * @returns {boolean} True for an http(s) address of another origin.
     */
    static external(href) {
        const text = String(href ?? "");
        if (!/^https?:/i.test(text)) {
            return false;
        }
        const base = globalThis.location?.href;
        if (!base) {
            return true;
        }
        try {
            return new URL(text, base).origin !== new URL(base).origin;
        } catch {
            return true;
        }
    }

    static _image(entry) {
        return { id: entry.node.id, text: "", link: entry.node.attrs.link ?? null };
    }

    /**
     * Widens a linked text run to the adjacent runs with the same destination, which differ
     * only in their other marks.
     */
    static _run(state, entry) {
        const Model = webexpress.webui.EditorModel, block = Model.block(state.doc, entry.start), link = entry.node.marks.link;
        const runs = [];
        let pos = block.start;
        for (const node of block.node.children) {
            runs.push({ start: pos, end: pos += Model.size(node), node });
        }
        const same = run => run?.node.type === "text" && run.node.marks.link?.href === link.href && run.node.marks.link.target === link.target;
        let first = runs.findIndex(run => run.start === entry.start), last = first;
        while (same(runs[first - 1])) first--;
        while (same(runs[last + 1])) last++;
        const text = runs.slice(first, last + 1).map(run => run.node.text).join("");
        return { anchor: runs[first].start, focus: runs[last].end, text, marks: { ...runs[first].node.marks }, link };
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
                this.openImage(editor, event.target);
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
            this.openLink(editor);
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
            this.openImage(editor);
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
                action: () => this.openImage(editor, target)
            });

            ["left", "center", "right", "inline"].forEach(align => items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.image.align." + align),
                icon: align === "inline" ? "image" : "align-" + align,
                action: () => webexpress.webui.EditorImage.update(editor, target, { align })
            }));
            ["25%", "50%", "100%", ""].forEach(width => items.push({
                label: width || webexpress.webui.I18N.translate("webexpress.webui:editor.image.size.original"),
                action: () => webexpress.webui.EditorImage.update(editor, target, { width, height: "" })
            }));
            items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.remove.image"),
                icon: "trash",
                action: () => webexpress.webui.EditorImage.remove(editor, target)
            });
        }

        const anchor = (target?.nodeType === 3 ? target.parentElement : target)?.closest?.("a");
        const link = anchor && editor.getEditorElement().contains(anchor) ? webexpress.webui.EditorLink.of(editor, anchor) : null;
        if (link) {
            items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.edit.link"),
                icon: "edit",
                action: () => this.openLink(editor, link)
            });
            items.push({
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.remove.link"),
                icon: "unlink",
                action: () => webexpress.webui.EditorLink.remove(editor, link)
            });
        }

        return items;
    },

    /**
     * Opens the link dialog. Every entry point - toolbar, bubble, context menu and shortcuts -
     * goes through here, so the panels of all modules receive the same context.
     * @param {object} editor - The editor instance.
     * @param {object} [target] - The link target from EditorLink; defaults to the selection.
     */
    openLink: function(editor, target = webexpress.webui.EditorLink.selected(editor)) {
        this._openModal(editor, "linkModal", "editor-link", "webexpress.webui:editor.insert.link.title", webexpress.webui.EditorLink.dialog(editor, target));
    },

    /**
     * Opens the image dialog to insert an image at the selection or to edit a rendered image.
     * @param {object} editor - The editor instance.
     * @param {HTMLElement|null} [image=null] - The rendered image to edit.
     */
    openImage: function(editor, image = null) {
        if (image && !webexpress.webui.EditorImage.select(editor, image)) {
            return;
        }
        const title = image ? "webexpress.webui:editor.edit.image" : "webexpress.webui:editor.insert.image.title";
        this._openModal(editor, "imageModal", "editor-image", title, webexpress.webui.EditorImage.dialog(editor, image));
        // an image is edited through its address, whichever page was used last
        if (image) {
            this.imageModal.ctrl.selectPage?.("image-web");
        }
    },

    /**
     * Shows the editor's dialog for a panel key and hands the dialog context to its panels.
     * The dialog is created on first use; the pages registered under the key until then belong to it.
     * @param {object} editor - The editor instance.
     * @param {string} modalProperty - The property name where the modal wrapper is stored.
     * @param {string} key - The DialogPanels key whose panels the dialog shows.
     * @param {string} title - The i18n key of the dialog title.
     * @param {object} dialog - The context from EditorLink.dialog() or EditorImage.dialog().
     */
    _openModal: function(editor, modalProperty, key, title, dialog) {
        if (!editor._mediaModals) {
            editor._mediaModals = {};
        }
        if (!editor._mediaModals[modalProperty]) {
            editor._mediaModals[modalProperty] = this._createModal(key, title, dialog);
        }
        const modal = this[modalProperty] = editor._mediaModals[modalProperty];
        modal.ctrl.editorDialog = dialog;

        const heading = modal.element.querySelector(".modal-title");
        if (heading) {
            heading.textContent = webexpress.webui.I18N.translate(title);
        }
        const submit = modal.element.querySelector(".submit-btn");
        if (submit) {
            submit.textContent = webexpress.webui.I18N.translate(dialog.mode === "edit" ? "webexpress.webui:save" : "webexpress.webui:insert");
        }

        editor.preserveDialogSelection(modal.element);
        modal.ctrl.show();
    },

    /**
     * Creates the dialog shell of one editor. Submission is left to ModalSidebarPanelCtrl, which
     * validates and submits the active page only, so a page of any module needs no button wiring.
     * The pages are added here rather than loaded by key, because the dialog belongs to one editor:
     * a page whose available(editor) declines - an upload page on an editor without an upload
     * address, say - is left out, and every page finds the context set when it renders.
     * @param {string} key - The DialogPanels key whose pages the dialog shows.
     * @param {string} title - The i18n key of the dialog title.
     * @param {object} dialog - The context of the first opening.
     * @returns {{ element: HTMLElement, ctrl: object }} Wrapper containing element and controller.
     */
    _createModal: function(key, title, dialog) {
        const id = "wx-msp-" + key + "-" + Date.now();
        const el = document.createElement("dialog");
        el.id = id;
        el.setAttribute("data-size", "modal-lg");
        el.setAttribute("data-submit-id", id + "-submit");
        el.setAttribute("data-validate-active-only", "true");
        el.setAttribute("aria-hidden", "true");

        const header = document.createElement("div");
        header.className = "wx-modal-header";
        const heading = document.createElement("h5");
        heading.className = "modal-title";
        heading.textContent = webexpress.webui.I18N.translate(title);
        header.appendChild(heading);

        const content = document.createElement("div");
        content.className = "wx-modal-content";

        const footer = document.createElement("div");
        footer.className = "wx-modal-footer";
        const submit = document.createElement("button");
        submit.type = "button";
        submit.id = id + "-submit";
        submit.className = "btn btn-primary submit-btn";
        submit.textContent = webexpress.webui.I18N.translate("webexpress.webui:insert");
        footer.appendChild(submit);

        el.appendChild(header);
        el.appendChild(content);
        el.appendChild(footer);
        document.body.appendChild(el);
        const ctrl = new webexpress.webui.ModalSidebarPanelCtrl(el);
        ctrl.editorDialog = dialog;

        const ids = new Set();
        for (const page of webexpress.webui.DialogPanels.get(key)) {
            if (typeof page.available === "function" && !page.available(dialog.editor)) {
                continue;
            }
            // a second page under a taken id gets a generated one instead of replacing the first
            if (ids.has(page.id)) {
                delete page.id;
            }
            ctrl.addPage(page);
            ids.add(page.id);
        }

        return { element: el, ctrl: ctrl };
    }
});
