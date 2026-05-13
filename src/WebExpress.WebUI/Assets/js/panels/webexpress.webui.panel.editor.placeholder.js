/**
 * Registers the placeholder (instruction text) dialog panel.
 */
webexpress.webui.DialogPanels.register("editor-placeholder", {
    id: "editor-placeholder-page",
    parentId: null,
    title: webexpress.webui.I18N.translate("webexpress.webui:editor.placeholder.title"),
    iconClass: "fas fa-info-circle",

    /**
     * Renders the page ui.
     * @param {HTMLElement} container - Host container for the page.
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     */
    render: function (container, modal) {
        const wrapper = document.createElement("div");

        const textGroup = document.createElement("div");
        textGroup.className = "mb-3";
        const textLabel = document.createElement("label");
        textLabel.className = "form-label";
        textLabel.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.placeholder.text.label");
        
        // We use a textarea since instructions can sometimes be longer
        const textInput = document.createElement("textarea");
        textInput.className = "form-control";
        textInput.rows = 3;
        textInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.placeholder.text.placeholder");
        
        textGroup.appendChild(textLabel);
        textGroup.appendChild(textInput);

        wrapper.appendChild(textGroup);
        container.appendChild(wrapper);

        if (!modal._placeholder) {
            modal._placeholder = {};
        }
        modal._placeholder.textInput = textInput;

        textInput.addEventListener("input", function () {
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
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     */
    onShow: function (modal) {
        if (modal && modal._placeholder && modal._placeholder.textInput) {
            const textInput = modal._placeholder.textInput;

            // reset or prefill fields on every show
            if (modal._placeholderPrefill) {
                textInput.value = modal._placeholderPrefill.text || "";
            } else {
                textInput.value = "";
            }

            textInput.focus();
            textInput.select();

            const modalWrapper = textInput.closest("[data-key]") || document;
            const submitBtn = modalWrapper.querySelector(".submit-btn");

            if (submitBtn) {
                if (textInput.value.trim() !== "") {
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
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {true|{valid:false,message:string}}
     */
    validate: function (modal) {
        const editor = modal ? modal._editor : null;
        const textInput = modal && modal._placeholder ? modal._placeholder.textInput : null;

        if (!editor || !textInput) {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.placeholder.error.internal") };
        }

        const textVal = textInput.value.trim();
        if (textVal === "") {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.placeholder.error.text") };
        }

        return true;
    },

    /**
     * Handles submit and inserts the instruction text into the editor.
     *
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
     */
    onSubmit: function (modal) {
        const editor = modal ? modal._editor : null;
        const textInput = modal && modal._placeholder ? modal._placeholder.textInput : null;

        if (!editor || !textInput) {
            return;
        }

        const textVal = textInput.value.trim();
        if (textVal === "") {
            return;
        }

        const escapeHtml = function (text) {
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        };

        // strictly enforce backed up range to ensure exact selection replacement
        if (modal._backupRange) {
            editor._savedRange = modal._backupRange.cloneRange();
        }

        const safeText = escapeHtml(textVal);
        
        // Insert the instruction text as a span.
        // We use contenteditable="false" to prevent accidental editing of the structure,
        // and a specific class to style it in the editor.
        const html = `<span class="wx-editor-instruction" contenteditable="false"><i class="fas fa-info-circle"></i> ${safeText}</span>&nbsp;`;
        editor.insertHtmlAtCursor(html);

        // close modal
        if (typeof modal.hide === "function") {
            modal.hide();
        } else if (modal.ctrl && typeof modal.ctrl.hide === "function") {
            modal.ctrl.hide();
        } else {
            const modalWrapper = textInput.closest(".modal");
            if (modalWrapper && typeof bootstrap !== "undefined") {
                const bsModal = bootstrap.Modal.getInstance(modalWrapper);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        }
    }
});
