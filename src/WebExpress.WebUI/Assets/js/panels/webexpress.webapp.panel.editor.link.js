/**
 * Registers the link page.
 */
webexpress.webui.DialogPanels.register("editor-link", {
    id: "editor-link-page",
    parentId: null,
    title: "Link",
    iconClass: "fas fa-link",

    /**
     * Renders the page ui.
     * 
     * @param {HTMLElement} container - Host container for the page.
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
     */
    render: function (container, modal) {
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

        if (!modal._link) {
            modal._link = {};
        }
        modal._link.urlInput = urlInput;
        modal._link.textInput = textInput;

        urlInput.addEventListener("input", function () {
            const modalWrapper = this.closest("[data-key]") || document;
            const submitBtn = modalWrapper.querySelector(".submit-btn");
            
            if (submitBtn) {
                if (this.value.trim() !== "") {
                    submitBtn.disabled = false;
                } else {
                    submitBtn.disabled = true;
                }
            }
        });
    },

    /**
     * Called when the page becomes active.
     * Resets or prefills inputs and attaches the explicit click handler.
     * 
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
     */
    onShow: function (modal) {
        if (modal && modal._link && modal._link.urlInput) {
            const urlInput = modal._link.urlInput;
            const textInput = modal._link.textInput;
            
            // reset or prefill fields on every show
            if (modal._linkPrefill) {
                urlInput.value = modal._linkPrefill.url || "";
                if (textInput) {
                    textInput.value = modal._linkPrefill.text || "";
                }
            } else {
                urlInput.value = "";
                if (textInput) {
                    textInput.value = "";
                }
            }
            
            urlInput.focus();
            urlInput.select();

            const modalWrapper = urlInput.closest("[data-key]") || document;
            const submitBtn = modalWrapper.querySelector(".submit-btn");
            
            if (submitBtn) {
                if (urlInput.value.trim() !== "") {
                    submitBtn.disabled = false;
                } else {
                    submitBtn.disabled = true;
                }

                // cleanly bind to this active tab
                submitBtn.onclick = () => {
                    const validationResult = this.validate(modal);
                    if (validationResult === true) {
                        this.onSubmit(modal);
                    } else if (validationResult && validationResult.message) {
                        alert(validationResult.message);
                    }
                };
            }
        }
    },

    /**
     * Validates current page data.
     * 
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {true|{valid:false,message:string}}
     */
    validate: function (modal) {
        const editor = modal ? modal._editor : null;
        const urlInput = modal && modal._link ? modal._link.urlInput : null;
        
        if (!editor || !urlInput) {
            return { valid: false, message: "Internal error: editor or field not available." };
        }
        
        const urlVal = urlInput.value.trim();
        if (urlVal === "") {
            return { valid: false, message: "Please enter a valid URL." };
        }
        
        return true;
    },

    /**
     * Handles submit and inserts the link into the editor.
     * 
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
     */
    onSubmit: function (modal) {
        const editor = modal ? modal._editor : null;
        const urlInput = modal && modal._link ? modal._link.urlInput : null;
        const textInput = modal && modal._link ? modal._link.textInput : null;
        
        if (!editor || !urlInput) {
            return;
        }
        
        let urlVal = urlInput.value.trim();
        if (urlVal === "") {
            return;
        }
        
        // append protocol if missing to prevent sanitizer from stripping
        if (!/^https?:\/\//i.test(urlVal) && !urlVal.startsWith("/") && !urlVal.startsWith("#") && !urlVal.startsWith("mailto:")) {
            urlVal = "https://" + urlVal;
        }
        
        const rawText = String((textInput && textInput.value) || "").trim() || urlVal.replace(/^https?:\/\//i, "");
        const safeUrl = urlVal.replace(/"/g, "%22");
        
        const escapeHtml = function (text) {
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        };
        
        // strictly enforce backed up range to ensure exact selection replacement
        if (modal._backupRange) {
            editor._savedRange = modal._backupRange.cloneRange();
        }
        
        editor.insertHtmlAtCursor(' <a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(rawText) + "</a> ");
               
        // close modal
        if (typeof modal.hide === "function") {
            modal.hide();
        } else if (modal.ctrl && typeof modal.ctrl.hide === "function") {
            modal.ctrl.hide();
        } else {
            const modalWrapper = urlInput.closest(".modal");
            if (modalWrapper && typeof bootstrap !== "undefined") {
                const bsModal = bootstrap.Modal.getInstance(modalWrapper);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        }
    }
});