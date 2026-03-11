/**
 * Ensures the image state bag on modal.
 * 
 * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
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
            selectedSiteImage: null
        };
    }
    return modal._image;
}

/**
 * Page: Image from web
 */
webexpress.webui.DialogPanels.register("editor-image", {
    id: "image-web",
    parentId: null,
    title: "From the Web",
    iconClass: "fas fa-globe",

    /**
     * Renders the page ui.
     * 
     * @param {HTMLElement} container - Host container for the page.
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
     */
    render: function (container, modal) {
        const state = ensureImageState(modal);

        const wrapper = document.createElement("div");

        const urlGroup = document.createElement("div");
        urlGroup.className = "mb-3";
        const urlLabel = document.createElement("label");
        urlLabel.className = "form-label";
        urlLabel.textContent = "Image URL";
        const urlInput = document.createElement("input");
        urlInput.type = "url";
        urlInput.className = "form-control";
        urlInput.placeholder = "https://example.com/image.png";
        urlGroup.appendChild(urlLabel);
        urlGroup.appendChild(urlInput);

        const altGroup = document.createElement("div");
        altGroup.className = "mb-3";
        const altLabel = document.createElement("label");
        altLabel.className = "form-label";
        altLabel.textContent = "Alt Text";
        const altInput = document.createElement("input");
        altInput.type = "text";
        altInput.className = "form-control";
        altInput.placeholder = "Alternative text (optional)";
        altGroup.appendChild(altLabel);
        altGroup.appendChild(altInput);

        wrapper.appendChild(urlGroup);
        wrapper.appendChild(altGroup);
        container.appendChild(wrapper);

        state.webUrlInput = urlInput;
        state.webAltInput = altInput;

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
     * Resets or prefills inputs and attaches persistent events.
     * 
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
     */
    onShow: function (modal) {
        const state = ensureImageState(modal);
        
        if (state.webUrlInput) {
            // apply prefill or reset entirely
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

            state.webUrlInput.focus();
            state.webUrlInput.select();

            const modalWrapper = state.webUrlInput.closest("[data-key]") || document;
            const submitBtn = modalWrapper.querySelector(".submit-btn");
            
            if (submitBtn) {
                if (state.webUrlInput.value.trim() !== "") {
                    submitBtn.disabled = false;
                } else {
                    submitBtn.disabled = true;
                }

                // explicitly assign the handler to the active tab
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
        const state = ensureImageState(modal);
        
        if (!editor || !state.webUrlInput) {
            return { valid: false, message: "Internal error: editor or field not available." };
        }
        
        const urlVal = state.webUrlInput.value.trim();
        if (urlVal === "" || urlVal.toLowerCase().startsWith("javascript:")) {
            return { valid: false, message: "Please provide a valid image URL." };
        }
        
        return true;
    },

    /**
     * Handles submit and inserts the image html.
     * 
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
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
        
        // append protocol if missing to prevent sanitizer from stripping
        if (!/^https?:\/\//i.test(urlVal) && !urlVal.startsWith("/") && !urlVal.startsWith(".") && !urlVal.startsWith("data:")) {
            urlVal = "https://" + urlVal;
        }
        
        const safeUrl = urlVal.replace(/"/g, "%22");
        const alt = String((state.webAltInput && state.webAltInput.value) || "").trim();
        
        const escapeHtml = function (text) {
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        };

        // strictly enforce backed up range
        if (modal._backupRange) {
            editor._savedRange = modal._backupRange.cloneRange();
        }

        editor.insertHtmlAtCursor('<img src="' + safeUrl + '" alt="' + escapeHtml(alt) + '">');
        
        if (typeof modal.hide === "function") {
            modal.hide();
        } else if (modal.ctrl && typeof modal.ctrl.hide === "function") {
            modal.ctrl.hide();
        } else {
            const modalWrapper = state.webUrlInput.closest(".modal");
            if (modalWrapper && typeof bootstrap !== "undefined") {
                const bsModal = bootstrap.Modal.getInstance(modalWrapper);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        }
    }
});

/**
 * Page: Image from site
 */
webexpress.webui.DialogPanels.register("editor-image", {
    id: "image-site",
    parentId: null,
    title: "From the Site",
    iconClass: "fas fa-image",

    /**
     * Renders the page ui.
     * 
     * @param {HTMLElement} container - Host container for the page.
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
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
            '    </div>',
            '  </div>',
            '  <div class="col-12">',
            '    <div class="mb-2">',
            '      <label class="form-label">Alt Text</label>',
            '      <input type="text" class="form-control" placeholder="Alternative text (optional)" data-role="site-alt">',
            '    </div>',
            '    <div class="wx-webui-file-list"></div>',
            '    <div class="form-text">Click an entry in the list to select the image. Double-click inserts immediately.</div>',
            '  </div>',
            '</div>'
        ].join("");
        container.appendChild(wrapper);

        const uploadHost = wrapper.querySelector(".wx-webui-upload");
        const listHost = wrapper.querySelector(".wx-webui-file-list");
        const siteAltInput = wrapper.querySelector('input[data-role="site-alt"]');

        state.uploadHost = uploadHost;
        state.siteAltInput = siteAltInput;
        state.selectedSiteImage = null;

        if (uploadHost) {
            const uploadUri = editor ? (editor._imageUploadUri || "") : "";
            uploadHost.dataset.uri = uploadUri;
            if (!uploadUri) {
                uploadHost.style.display = "none";
            }
        }

        try {
            if (uploadHost && typeof webexpress?.webui?.UploadCtrl === "function" && editor && editor._imageUploadUri) {
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

        const escapeHtml = function (text) {
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        };

        const restoreAndInsert = function (htmlContent) {
            if (modal._backupRange) {
                editor._savedRange = modal._backupRange.cloneRange();
            }
            editor.insertHtmlAtCursor(htmlContent);
        };

        const closeModal = function () {
            if (typeof modal.hide === "function") {
                modal.hide();
            } else if (modal.ctrl && typeof modal.ctrl.hide === "function") {
                modal.ctrl.hide();
            } else {
                const modalWrapper = container.closest(".modal");
                if (modalWrapper && typeof bootstrap !== "undefined") {
                    const bsModal = bootstrap.Modal.getInstance(modalWrapper);
                    if (bsModal) {
                        bsModal.hide();
                    }
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
                
                // append protocol if needed
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

                const modalWrapper = container.closest("[data-key]") || document;
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
            
            restoreAndInsert('<img src="' + safeSrc + '" alt="' + escapeHtml(alt) + '">');
            closeModal();
        });

        const onUploadSuccess = function (ev) {
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
            
            if (editor.imageBaseUri || editor._imageBaseUri) {
                const rawBase = editor.imageBaseUri || editor._imageBaseUri;
                const base = rawBase.replace(/\/+$/, "");
                const src = base + "/" + encodeURIComponent(file.name);
                const safeSrc = src.replace(/"/g, "%22");
                const alt = String((state.siteAltInput && state.siteAltInput.value) || "").trim() || file.name;
                
                restoreAndInsert('<img src="' + safeSrc + '" alt="' + escapeHtml(alt) + '">');
                closeModal();
            }
        };
        
        document.addEventListener(webexpress.webui.Event.UPLOAD_SUCCESS_EVENT, onUploadSuccess);
    },

    /**
     * Called when the page becomes active.
     * Evaluates button state and resets list selection on new inserts.
     * 
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
     */
    onShow: function (modal) {
        const state = ensureImageState(modal);
        
        if (state.siteAltInput) {
            const wrapper = state.siteAltInput.closest("[data-key]") || document;
            const submitBtn = wrapper.querySelector(".submit-btn");
            
            // apply prefill or clear previous selection state
            if (!modal._imagePrefill) {
                state.selectedSiteImage = null;
                state.siteAltInput.value = "";
                const selectedRows = wrapper.querySelectorAll(".table-primary");
                selectedRows.forEach(row => row.classList.remove("table-primary"));
            } else {
                state.siteAltInput.value = modal._imagePrefill.alt || "";
            }

            if (submitBtn) {
                if (state.selectedSiteImage && state.selectedSiteImage.src) {
                    submitBtn.disabled = false;
                } else {
                    submitBtn.disabled = true;
                }

                // explicitly assign the handler to the active tab
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
        const state = ensureImageState(modal);
        
        if (!editor) {
            return { valid: false, message: "Internal error: editor not available." };
        }
        
        if (!state.selectedSiteImage || !state.selectedSiteImage.src) {
            return { valid: false, message: "Please select an image from the list." };
        }
        
        const srcVal = state.selectedSiteImage.src.trim();
        if (srcVal === "" || srcVal.toLowerCase().startsWith("javascript:")) {
            return { valid: false, message: "Please select a valid image URL." };
        }
        
        return true;
    },

    /**
     * Handles submit and inserts the image html.
     * 
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {void}
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
        
        // append protocol if missing to prevent sanitizer from stripping
        if (!/^https?:\/\//i.test(srcVal) && !srcVal.startsWith("/") && !srcVal.startsWith(".") && !srcVal.startsWith("data:")) {
            srcVal = "https://" + srcVal;
        }
        
        const safeSrc = srcVal.replace(/"/g, "%22");
        const alt = String((state.siteAltInput && state.siteAltInput.value) || "").trim() || state.selectedSiteImage.alt || "";
        
        const escapeHtml = function (text) {
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        };

        // strictly enforce backed up range
        if (modal._backupRange) {
            editor._savedRange = modal._backupRange.cloneRange();
        }
        
        editor.insertHtmlAtCursor('<img src="' + safeSrc + '" alt="' + escapeHtml(alt) + '">');
        
        if (typeof modal.hide === "function") {
            modal.hide();
        } else if (modal.ctrl && typeof modal.ctrl.hide === "function") {
            modal.ctrl.hide();
        } else {
            const modalWrapper = state.uploadHost ? state.uploadHost.closest(".modal") : null;
            if (modalWrapper && typeof bootstrap !== "undefined") {
                const bsModal = bootstrap.Modal.getInstance(modalWrapper);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        }
    }
});