/**
 * Registers the page for entering a link address. Other modules add pages under the same
 * "editor-link" key and apply their result through modal.editorDialog in the same way.
 */
webexpress.webui.DialogPanels.register("editor-link", {
    id: "editor-link-page",
    parentId: null,
    title: webexpress.webui.I18N.translate("webexpress.webui:editor.link.title"),
    iconClass: "link",

    /**
     * Renders the page ui.
     * @param {HTMLElement} container - Host container for the page.
     * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
     */
    render: function (container, modal) {
        const wrapper = document.createElement("div");

        const urlGroup = document.createElement("div");
        urlGroup.className = "mb-3";
        const urlLabel = document.createElement("label");
        urlLabel.className = "form-label";
        urlLabel.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.link.url.label");

        const urlInput = document.createElement("input");
        urlInput.type = "url";
        urlInput.className = "form-control";
        urlInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.link.url.placeholder");
        urlGroup.appendChild(urlLabel);
        urlGroup.appendChild(urlInput);

        const textGroup = document.createElement("div");
        textGroup.className = "mb-3";
        const textLabel = document.createElement("label");
        textLabel.className = "form-label";
        textLabel.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.link.text.label");

        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.className = "form-control";
        textInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.link.text.placeholder");
        textGroup.appendChild(textLabel);
        textGroup.appendChild(textInput);

        const newTabGroup = document.createElement("div");
        newTabGroup.className = "form-check mb-3";
        const newTabInput = document.createElement("input");
        newTabInput.type = "checkbox";
        newTabInput.className = "form-check-input";
        newTabInput.id = "wx-editor-link-newtab-" + Date.now();
        const newTabLabel = document.createElement("label");
        newTabLabel.className = "form-check-label";
        newTabLabel.htmlFor = newTabInput.id;
        newTabLabel.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.link.newtab.label");
        newTabGroup.appendChild(newTabInput);
        newTabGroup.appendChild(newTabLabel);

        wrapper.appendChild(urlGroup);
        wrapper.appendChild(textGroup);
        wrapper.appendChild(newTabGroup);
        container.appendChild(wrapper);

        modal._link = { urlInput, textInput, textGroup, newTabInput, newTabChosen: false };

        newTabInput.addEventListener("change", () => {
            modal._link.newTabChosen = true;
        });

        urlInput.addEventListener("input", () => {
            // until the user decides, only links that leave the site open in a new tab
            if (!modal._link.newTabChosen) {
                newTabInput.checked = webexpress.webui.EditorLink.external(webexpress.webui.EditorModel.completeUrl(urlInput.value));
            }
        });
    },

    /**
     * Prefills the page from the dialog context on every show.
     * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
     */
    onShow: function (modal) {
        const dialog = modal?.editorDialog;
        const page = modal?._link;
        if (!dialog || !page) {
            return;
        }

        page.urlInput.value = dialog.prefill.url;
        page.textInput.value = dialog.prefill.text;
        // an image link has no text of its own
        page.textGroup.hidden = dialog.prefill.image;
        page.newTabChosen = dialog.prefill.newTab != null;
        page.newTabInput.checked = dialog.prefill.newTab ?? webexpress.webui.EditorLink.external(webexpress.webui.EditorModel.completeUrl(page.urlInput.value));

        page.urlInput.focus({ preventScroll: true });
        page.urlInput.select();
    },

    /**
     * Rejects an address the document would drop, so the link is never lost silently.
     * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
     * @returns {true|{valid:false,message:string}}
     */
    validate: function (modal) {
        if (!modal?.editorDialog || !modal._link) {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.link.error.internal") };
        }
        if (!modal.editorDialog.address(modal._link.urlInput.value)) {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.link.error.url") };
        }
        return true;
    },

    /**
     * Applies the link; the dialog closes once this returns.
     * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
     */
    onSubmit: function (modal) {
        const page = modal._link;
        const applied = modal.editorDialog.apply({ href: page.urlInput.value, text: page.textInput.value, newTab: page.newTabInput.checked });
        if (!applied) {
            throw new Error(webexpress.webui.I18N.translate("webexpress.webui:editor.link.error.url"));
        }
    }
});
