(function () {
    /**
     * Shares insertion and in-place replacement across URL, library and upload
     * entry points, keeping an open dialog independent of the live selection.
     */
    function applyImage(modal, src, alt, dimensions = false) {
        const editor = modal._editor;
        const state = ensureImageState(modal);
        const values = { src, alt };
        if (dimensions) {
            for (const name of ["width", "height"]) {
                const input = state[name + "Input"];
                if (input) {
                    values[name] = webexpress.webui.EditorImage.dimension(input.value);
                    if (values[name] === null) {
                        return false;
                    }
                }
            }
        }
        if (modal._imageTarget) {
            if (!webexpress.webui.EditorImage.update(editor, modal._imageTarget, values)) {
                return false;
            }
        } else {
            const range = modal._backupRange;
            const root = editor.getEditorElement();
            if (range && root.contains(range.startContainer) && root.contains(range.endContainer)) {
                webexpress.webui.EditorSelection.apply(range);
                editor._saveCurrentSelection();
            }
            webexpress.webui.EditorImage.insert(editor, values);
        }
        modal._imageTarget = null;
        return true;
    }

    /**
     * Ensures the image state bag on modal.
     * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
     * @returns {any} The image state object.
     */
    function ensureImageState(modal) {
        if (!modal._image) {
            modal._image = {
                webUrlInput: null,
                webAltInput: null,
                siteAltInput: null,
                uploadCtrl: null,
                fileListCtrl: null,
                uploadHost: null,
                selectedSiteImage: null,
                uploadSuccessHandler: null
            };
        }
        return modal._image;
    }

    /**
     * Page: Image from web.
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
            const state = ensureImageState(modal);

            const wrapper = document.createElement("div");

            const urlGroup = document.createElement("div");
            urlGroup.className = "mb-3";

            const urlLabel = document.createElement("label");
            urlLabel.className = "form-label";
            urlLabel.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.image.url.label");

            const urlInput = document.createElement("input");
            urlInput.type = "url";
            urlInput.className = "form-control";
            urlInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.image.url.placeholder");

            urlGroup.appendChild(urlLabel);
            urlGroup.appendChild(urlInput);

            const altGroup = document.createElement("div");
            altGroup.className = "mb-3";

            const altLabel = document.createElement("label");
            altLabel.className = "form-label";
            altLabel.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.image.alt.label");

            const altInput = document.createElement("input");
            altInput.type = "text";
            altInput.className = "form-control";
            altInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.image.alt.placeholder");

            altGroup.appendChild(altLabel);
            altGroup.appendChild(altInput);

            wrapper.appendChild(urlGroup);
            wrapper.appendChild(altGroup);
            ["width", "height"].forEach(name => {
                const label = document.createElement("label");
                label.className = "form-label d-block mb-3";
                label.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.image." + name);
                const input = document.createElement("input");
                input.type = "text";
                input.className = "form-control";
                input.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.image.size.placeholder");
                input.setAttribute("aria-label", label.textContent);
                label.appendChild(input);
                wrapper.appendChild(label);
                state[name + "Input"] = input;
            });
            urlInput.setAttribute("aria-label", urlLabel.textContent);
            altInput.setAttribute("aria-label", altLabel.textContent);
            container.appendChild(wrapper);

            state.webUrlInput = urlInput;
            state.webAltInput = altInput;

            urlInput.addEventListener("input", function () {
                const modalWrapper = this.closest(".modal") || this.closest("[data-key]") || document;
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
         * Resets or prefills inputs and attaches persistent events.
         * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
         */
        onShow: function (modal) {
            const state = ensureImageState(modal);

            if (!state.webUrlInput) {
                return;
            }

            if (modal._imagePrefill) {
                state.webUrlInput.value = modal._imagePrefill.url || "";
                if (state.webAltInput) {
                    state.webAltInput.value = modal._imagePrefill.alt || "";
                }
            } else {
                state.webUrlInput.value = "";
                if (state.webAltInput) {
                    state.webAltInput.value = "";
                }
            }

            ["width", "height"].forEach(name => {
                if (state[name + "Input"]) {
                    state[name + "Input"].value = modal._imagePrefill?.[name] || "";
                }
            });
            state.webUrlInput.focus({ preventScroll: true });
            state.webUrlInput.select();

            const modalWrapper = state.webUrlInput.closest(".modal") || state.webUrlInput.closest("[data-key]") || document;
            const submitBtn = modalWrapper.querySelector(".submit-btn");

            if (submitBtn) {
                submitBtn.textContent = webexpress.webui.I18N.translate(modal._imageTarget ? "webexpress.webui:save" : "webexpress.webui:insert");
                if (state.webUrlInput.value.trim() !== "") {
                    submitBtn.disabled = false;
                } else {
                    submitBtn.disabled = true;
                }

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
         * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
         * @returns {true|{valid:false,message:string}}
         */
        validate: function (modal) {
            const editor = modal ? modal._editor : null;
            const state = ensureImageState(modal);

            if (!editor || !state.webUrlInput) {
                return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.image.error.internal") };
            }

            const urlVal = state.webUrlInput.value.trim();
            if (["width", "height"].some(name => state[name + "Input"] &&
                webexpress.webui.EditorImage.dimension(state[name + "Input"].value) === null)) {
                return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.image.error.size") };
            }
            if (urlVal === "" || urlVal.toLowerCase().startsWith("javascript:")) {
                return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.image.error.url") };
            }

            return true;
        },

        /**
         * Handles submit and inserts the image html.
         * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
         */
        onSubmit: function (modal) {
            const editor = modal ? modal._editor : null;
            const state = ensureImageState(modal);

            if (!editor || !state.webUrlInput) {
                return;
            }

            let urlVal = state.webUrlInput.value.trim();
            if (urlVal === "" || urlVal.toLowerCase().startsWith("javascript:")) {
                return;
            }

            if (!/^https?:\/\//i.test(urlVal) && !urlVal.startsWith("/") && !urlVal.startsWith(".") && !urlVal.startsWith("data:")) {
                urlVal = "https://" + urlVal;
            }

            const safeUrl = urlVal.replace(/"/g, "%22");
            const alt = String((state.webAltInput && state.webAltInput.value) || "").trim();

            if (!applyImage(modal, safeUrl, alt, true)) {
                return;
            }

            if (typeof modal.hide === "function") {
                modal.hide();
            } else if (modal.ctrl && typeof modal.ctrl.hide === "function") {
                modal.ctrl.hide();
            } else {
                const modalWrapper = state.webUrlInput.closest(".modal");
                if (modalWrapper?.open) {
                    modalWrapper.close();
                }
            }
        }
    });

    /**
     * Page: Image from site.
     */
    webexpress.webui.DialogPanels.register("editor-image", {
        id: "image-site",
        parentId: null,
        title: webexpress.webui.I18N.translate("webexpress.webui:editor.image.site.title"),
        iconClass: "image",

        /**
         * Renders the page ui.
         * @param {HTMLElement} container - Host container for the page.
         * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
         */
        render: function (container, modal) {
            const state = ensureImageState(modal);
            const editor = modal ? modal._editor : null;

            const wrapper = document.createElement("div");
            wrapper.innerHTML = [
                '<div class="row g-3">',
                '  <div class="col-12">',
                '    <div class="wx-webui-upload"',
                '         data-multiple="false"',
                '         data-accept="image/*"',
                '         data-autoupload="true"',
                '         data-progress="true"',
                '         data-fullscreen-dropzone="false"',
                '         data-uri="">',
                "    </div>",
                "  </div>",
                '  <div class="col-12">',
                '    <div class="mb-2">',
                '      <label class="form-label">' + webexpress.webui.I18N.translate("webexpress.webui:editor.image.alt.label") + "</label>",
                '      <input type="text" class="form-control" placeholder="' + webexpress.webui.I18N.translate("webexpress.webui:editor.image.alt.placeholder") + '" data-role="site-alt">',
                "    </div>",
                '    <div class="wx-webui-file-list"></div>',
                '    <div class="form-text">' + webexpress.webui.I18N.translate("webexpress.webui:editor.image.site.hint") + "</div>",
                "  </div>",
                "</div>"
            ].join("");
            container.appendChild(wrapper);

            const uploadHost = wrapper.querySelector(".wx-webui-upload");
            const listHost = wrapper.querySelector(".wx-webui-file-list");
            const siteAltInput = wrapper.querySelector('input[data-role="site-alt"]');

            state.uploadHost = uploadHost;
            state.siteAltInput = siteAltInput;
            state.selectedSiteImage = null;

            if (uploadHost) {
                const uploadUri = editor ? (editor.imageUploadUri || "") : "";
                uploadHost.dataset.uri = uploadUri;
                if (!uploadUri) {
                    uploadHost.style.display = "none";
                }
            }

            try {
                if (uploadHost && typeof webexpress?.webui?.UploadCtrl === "function" && editor && editor.imageUploadUri) {
                    state.uploadCtrl = new webexpress.webui.UploadCtrl(uploadHost);
                }
            } catch (err) {
                // ignore init errors
            }

            try {
                if (listHost && typeof webexpress?.webui?.FileListCtrl === "function") {
                    state.fileListCtrl = new webexpress.webui.FileListCtrl(listHost);
                }
            } catch (err) {
                // ignore init errors
            }

            const closeModal = function () {
                if (typeof modal.hide === "function") {
                    modal.hide();
                } else if (modal.ctrl && typeof modal.ctrl.hide === "function") {
                    modal.ctrl.hide();
                } else {
                    const modalWrapper = container.closest(".modal");
                    if (modalWrapper?.open) {
                        modalWrapper.close();
                    }
                }
            };

            let selectedRow = null;

            container.addEventListener("click", function (e) {
                const link = e.target.closest(".wx-file-list a.link, .wx-webui-file-list a.link");
                const row = e.target.closest(".wx-file-list tr");

                if (link) {
                    e.preventDefault();

                    let src = link.getAttribute("href");
                    const altGuess = link.textContent || "";

                    if (src && !/^https?:\/\//i.test(src) && !src.startsWith("/") && !src.startsWith(".") && !src.startsWith("data:")) {
                        src = "https://" + src;
                    }

                    state.selectedSiteImage = { src: src, alt: altGuess };

                    if (selectedRow) {
                        selectedRow.classList.remove("table-primary");
                    }

                    if (row) {
                        selectedRow = row;
                        selectedRow.classList.add("table-primary");
                    }

                    const modalWrapper = container.closest(".modal") || container.closest("[data-key]") || document;
                    const submitBtn = modalWrapper.querySelector(".submit-btn");
                    if (submitBtn) {
                        submitBtn.disabled = false;
                    }
                }
            });

            container.addEventListener("dblclick", function (e) {
                const link = e.target.closest(".wx-file-list a.link, .wx-webui-file-list a.link");
                if (!link) {
                    return;
                }
                e.preventDefault();

                if (!editor) {
                    return;
                }

                let src = link.getAttribute("href") || "";
                if (src.trim() === "" || src.toLowerCase().startsWith("javascript:")) {
                    return;
                }

                if (!/^https?:\/\//i.test(src) && !src.startsWith("/") && !src.startsWith(".") && !src.startsWith("data:")) {
                    src = "https://" + src;
                }

                const safeSrc = src.replace(/"/g, "%22");
                const alt = String((state.siteAltInput && state.siteAltInput.value) || "").trim() || (link.textContent || "");

                if (!applyImage(modal, safeSrc, alt)) {
                    return;
                }
                closeModal();
            });

            if (!state.uploadSuccessHandler) {
                state.uploadSuccessHandler = (ev) => {
                    if (!state.uploadCtrl) {
                        return;
                    }
                    if (!ev || !ev.detail || ev.detail.sender !== uploadHost) {
                        return;
                    }

                    const file = ev.detail.file;
                    if (!file || !editor) {
                        return;
                    }

                    if (editor.imageBaseUri) {
                        const rawBase = editor.imageBaseUri;
                        const base = rawBase.replace(/\/+$/, "");
                        const src = base + "/" + encodeURIComponent(file.name);
                        const safeSrc = src.replace(/"/g, "%22");
                        const alt = String((state.siteAltInput && state.siteAltInput.value) || "").trim() || file.name;

                        if (!applyImage(modal, safeSrc, alt)) {
                            return;
                        }
                        closeModal();
                    }
                };
                document.addEventListener(webexpress.webui.Event.UPLOAD_SUCCESS_EVENT, state.uploadSuccessHandler);
            }
        },

        /**
         * Called when the page becomes active.
         * Evaluates button state and resets list selection on new inserts.
         * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
         */
        onShow: function (modal) {
            const state = ensureImageState(modal);

            if (!state.siteAltInput) {
                return;
            }

            const wrapper = state.siteAltInput.closest(".modal") || state.siteAltInput.closest("[data-key]") || document;
            const submitBtn = wrapper.querySelector(".submit-btn");

            if (!modal._imagePrefill) {
                state.selectedSiteImage = null;
                state.siteAltInput.value = "";
                const selectedRows = wrapper.querySelectorAll(".table-primary");
                selectedRows.forEach((row) => {
                    row.classList.remove("table-primary");
                });
            } else {
                state.siteAltInput.value = modal._imagePrefill.alt || "";
            }

            if (submitBtn) {
                submitBtn.textContent = webexpress.webui.I18N.translate(modal._imageTarget ? "webexpress.webui:save" : "webexpress.webui:insert");
                if (state.selectedSiteImage && state.selectedSiteImage.src) {
                    submitBtn.disabled = false;
                } else {
                    submitBtn.disabled = true;
                }

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
         * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
         * @returns {true|{valid:false,message:string}}
         */
        validate: function (modal) {
            const editor = modal ? modal._editor : null;
            const state = ensureImageState(modal);

            if (!editor) {
                return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.image.site.error.internal") };
            }

            if (!state.selectedSiteImage || !state.selectedSiteImage.src) {
                return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.image.site.error.select") };
            }

            const srcVal = state.selectedSiteImage.src.trim();
            if (srcVal === "" || srcVal.toLowerCase().startsWith("javascript:")) {
                return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.image.site.error.url") };
            }

            return true;
        },

        /**
         * Handles submit and inserts the image html.
         * @param {webexpress.webui.ModalSidebarPanelCtrl} modal - Modal instance.
         */
        onSubmit: function (modal) {
            const editor = modal ? modal._editor : null;
            const state = ensureImageState(modal);

            if (!editor || !state.selectedSiteImage || !state.selectedSiteImage.src) {
                return;
            }

            let srcVal = state.selectedSiteImage.src.trim();
            if (srcVal === "" || srcVal.toLowerCase().startsWith("javascript:")) {
                return;
            }

            if (!/^https?:\/\//i.test(srcVal) && !srcVal.startsWith("/") && !srcVal.startsWith(".") && !srcVal.startsWith("data:")) {
                srcVal = "https://" + srcVal;
            }

            const safeSrc = srcVal.replace(/"/g, "%22");
            const alt = String((state.siteAltInput && state.siteAltInput.value) || "").trim() || state.selectedSiteImage.alt || "";

            if (!applyImage(modal, safeSrc, alt)) {
                return;
            }

            if (typeof modal.hide === "function") {
                modal.hide();
            } else if (modal.ctrl && typeof modal.ctrl.hide === "function") {
                modal.ctrl.hide();
            } else {
                const modalWrapper = state.uploadHost ? state.uploadHost.closest(".modal") : null;
                if (modalWrapper?.open) {
                    modalWrapper.close();
                }
            }
        }
    });
})();
