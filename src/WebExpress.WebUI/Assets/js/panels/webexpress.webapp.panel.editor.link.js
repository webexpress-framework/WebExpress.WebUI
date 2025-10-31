/**
 * registers the link page
 */
webexpress.webui.DialogPanels.register("editor-link", {
    id: "editor-link-page",
    parentId: null,
    title: "Link",
    iconClass: "fas fa-link",

    /**
     * renders the page ui
     * @param {HTMLElement} container - host container for the page
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance (holds _editor and optional _linkPrefill)
     * @returns {void}
     */
    render: function (container, modal) {
        // build form
        const wrapper = document.createElement("div");

        const urlGroup = document.createElement("div");
        urlGroup.className = "mb-3";
        const urlLabel = document.createElement("label");
        urlLabel.className = "form-label";
        urlLabel.textContent = "URL";
        const urlInput = document.createElement("input");
        urlInput.type = "url";
        urlInput.className = "form-control";
        urlInput.placeholder = "https://example.com";
        urlGroup.appendChild(urlLabel);
        urlGroup.appendChild(urlInput);

        const textGroup = document.createElement("div");
        textGroup.className = "mb-3";
        const textLabel = document.createElement("label");
        textLabel.className = "form-label";
        textLabel.textContent = "Text";
        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.className = "form-control";
        textInput.placeholder = "Link text (optional)";
        textGroup.appendChild(textLabel);
        textGroup.appendChild(textInput);

        wrapper.appendChild(urlGroup);
        wrapper.appendChild(textGroup);
        container.appendChild(wrapper);

        // store refs on modal state
        if (!modal._link) {
            modal._link = {};
        }
        modal._link.urlInput = urlInput;
        modal._link.textInput = textInput;

        // apply prefill if present
        if (modal._linkPrefill && typeof modal._linkPrefill === "object") {
            if (typeof modal._linkPrefill.url === "string") {
                urlInput.value = modal._linkPrefill.url;
            }
            if (typeof modal._linkPrefill.text === "string") {
                textInput.value = modal._linkPrefill.text;
            }
        }
    },

    /**
     * called when the page becomes active
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance
     * @returns {void}
     */
    onShow: function (modal) {
        // focus url input
        if (modal && modal._link && modal._link.urlInput) {
            modal._link.urlInput.focus();
            modal._link.urlInput.select();
        }
    },

    /**
     * validates current page data
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance
     * @returns {true|{valid:false,message:string}}
     */
    validate: function (modal) {
        const editor = modal ? modal._editor : null;
        const urlInput = modal && modal._link ? modal._link.urlInput : null;
        if (!editor || !urlInput) {
            return { valid: false, message: "internal error: editor or field not available." };
        }
        const safeUrl = editor._sanitizeUrl(urlInput.value || "");
        if (!safeUrl) {
            return { valid: false, message: "Please enter a valid URL." };
        }
        return true;
    },

    /**
     * handles submit and inserts the link into the editor
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance
     * @returns {void}
     */
    onSubmit: function (modal) {
        const editor = modal ? modal._editor : null;
        const urlInput = modal && modal._link ? modal._link.urlInput : null;
        const textInput = modal && modal._link ? modal._link.textInput : null;
        if (!editor || !urlInput) {
            return;
        }
        const urlVal = editor._sanitizeUrl(urlInput.value || "");
        if (!urlVal) {
            return;
        }
        const text = String((textInput && textInput.value) || "").trim() || urlVal.replace(/^https?:\/\//i, "");
        editor._restoreSavedRange();
        editor._insertHtmlAtCursor('<a href="' + urlVal + '" target="_blank" rel="noopener noreferrer">' + editor._escapeHtml(text) + "</a>");
        if (editor._formInput) {
            editor._formInput.value = editor._editorElement ? editor._editorElement.innerHTML : "";
        }
    }
});