/**
 * Registers the instruction text dialog panel.
 */
webexpress.webui.DialogPanels.register("editor-instruction", {
    id: "editor-instruction-page",
    parentId: null,
    title: webexpress.webui.I18N.translate("webexpress.webui:editor.instruction.title"),
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
        textLabel.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.instruction.text.label");

        // we use a textarea since instructions can sometimes be longer
        const textInput = document.createElement("textarea");
        textInput.className = "form-control";
        textInput.rows = 3;
        textInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.instruction.text.placeholder");

        textGroup.appendChild(textLabel);
        textGroup.appendChild(textInput);

        wrapper.appendChild(textGroup);
        container.appendChild(wrapper);

        if (!modal._instruction) {
            modal._instruction = {};
        }
        modal._instruction.textInput = textInput;

        textInput.addEventListener("input", function () {
            const modalRoot = this.closest(".modal") || this.closest("[data-key]") || document;
            const submitBtn = modalRoot.querySelector(".submit-btn");

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
        if (!(modal && modal._instruction && modal._instruction.textInput)) {
            return;
        }

        const textInput = modal._instruction.textInput;

        // editor handles range saving on blur/focus internally
        if (modal._instructionPrefill) {
            textInput.value = modal._instructionPrefill.text || "";
        } else {
            textInput.value = "";
        }

        textInput.focus();
        textInput.select();

        const modalRoot = textInput.closest(".modal") || textInput.closest("[data-key]") || document;
        const submitBtn = modalRoot.querySelector(".submit-btn");

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
    },

    /**
     * Validates current page data.
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {true|{valid:false,message:string}}
     */
    validate: function (modal) {
        const editor = modal ? modal._editor : null;
        const textInput = modal && modal._instruction ? modal._instruction.textInput : null;

        if (!editor || !textInput) {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.instruction.error.internal") };
        }

        const textVal = textInput.value.trim();
        if (textVal === "") {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.instruction.error.text") };
        }

        return true;
    },

    /**
     * Handles submit and inserts the instruction text into the editor.
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
     */
    onSubmit: function (modal) {
        const editor = modal ? modal._editor : null;
        const textInput = modal && modal._instruction ? modal._instruction.textInput : null;

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

        const safeText = escapeHtml(textVal);
        const innerHtml = `<i class="${webexpress.webui.IconTheme.resolveFa("fas fa-info-circle")}"></i> ${safeText}`;

        const root = typeof editor.getEditorElement === "function" ? editor.getEditorElement() : null;
        const target = modal._instructionTarget;
        modal._instructionTarget = null;

        if (target && root && root.contains(target)) {
            // edit mode: update the existing element in place so its position
            // is kept and a cancelled dialog can never lose the instruction
            target.innerHTML = innerHtml;
            if (typeof editor._syncValue === "function") {
                editor._syncValue();
            }
            if (typeof editor._updateUndoRedoStates === "function") {
                editor._updateUndoRedoStates();
            }
        } else {
            // insert as an inline, non-editable atomic so the instruction sits in
            // the running text instead of forcing its own line/block. A trailing
            // no-break space gives the caret a place to land after the element.
            const html =
                `<span class="wx-editor-instruction" contenteditable="false">${innerHtml}</span>&nbsp;`;

            // editor.insertHtmlAtCursor focuses editor and restores saved range internally
            editor.insertHtmlAtCursor(html);
        }

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