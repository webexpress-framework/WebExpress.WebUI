/**
 * Registers the page for entering an image address. Pages that offer images from elsewhere,
 * such as a site library or an upload, are provided by other modules under the same
 * "editor-image" key and apply their result through modal.editorDialog.
 */
webexpress.webui.DialogPanels.register("editor-image", {
    id: "image-web",
    parentId: null,
    title: webexpress.webui.I18N.translate("webexpress.webui:editor.image.web.title"),
    iconClass: "globe",

    /**
     * Renders the page ui.
     * @param {HTMLElement} container - Host container for the page.
     * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
     */
    render: function (container, modal) {
        const wrapper = document.createElement("div");
        const field = (key, type = "text") => {
            const label = document.createElement("label");
            label.className = "form-label d-block mb-3";
            label.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.image." + key);
            const input = document.createElement("input");
            input.type = type;
            input.className = "form-control";
            input.setAttribute("aria-label", label.textContent);
            label.appendChild(input);
            wrapper.appendChild(label);
            return input;
        };

        const urlInput = field("url.label", "url");
        urlInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.image.url.placeholder");
        const altInput = field("alt.label");
        altInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.image.alt.placeholder");
        const widthInput = field("width");
        const heightInput = field("height");
        widthInput.placeholder = heightInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.image.size.placeholder");

        container.appendChild(wrapper);
        modal._image = { urlInput, altInput, widthInput, heightInput };
    },

    /**
     * Prefills the page from the dialog context on every show.
     * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
     */
    onShow: function (modal) {
        const dialog = modal?.editorDialog;
        const page = modal?._image;
        if (!dialog || !page) {
            return;
        }

        page.urlInput.value = dialog.prefill.url;
        page.altInput.value = dialog.prefill.alt;
        page.widthInput.value = dialog.prefill.width;
        page.heightInput.value = dialog.prefill.height;

        page.urlInput.focus({ preventScroll: true });
        page.urlInput.select();
    },

    /**
     * Rejects addresses and sizes the document would drop, so the image is never lost silently.
     * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
     * @returns {true|{valid:false,message:string}}
     */
    validate: function (modal) {
        const page = modal?._image;
        if (!modal?.editorDialog || !page) {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.image.error.internal") };
        }
        if ([page.widthInput, page.heightInput].some(input => webexpress.webui.EditorImage.dimension(input.value) === null)) {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.image.error.size") };
        }
        if (!modal.editorDialog.address(page.urlInput.value)) {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.image.error.url") };
        }
        return true;
    },

    /**
     * Inserts or replaces the image; the dialog closes once this returns.
     * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
     */
    onSubmit: function (modal) {
        const page = modal._image;
        const applied = modal.editorDialog.apply({ src: page.urlInput.value, alt: page.altInput.value, width: page.widthInput.value, height: page.heightInput.value });
        if (!applied) {
            throw new Error(webexpress.webui.I18N.translate("webexpress.webui:editor.image.error.url"));
        }
    }
});
