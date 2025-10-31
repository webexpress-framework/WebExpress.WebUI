/**
 * ensures the image state bag on modal
 * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance
 * @returns {any}
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
 * page: image from web
 */
webexpress.webui.DialogPanels.register("editor-image", {
    id: "image-web",
    parentId: null,
    title: "From the Web",
    iconClass: "fas fa-globe",

    /**
     * renders the page ui
     * @param {HTMLElement} container - host container for the page
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance (holds _editor and _image state)
     * @returns {void}
     */
    render: function (container, modal) {
        const state = ensureImageState(modal);

        // build form
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

        // store refs
        state.webUrlInput = urlInput;
        state.webAltInput = altInput;
    },

    /**
     * called when the page becomes active
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance
     * @returns {void}
     */
    onShow: function (modal) {
        const state = ensureImageState(modal);
        // reset inputs and focus url
        if (state.webUrlInput) {
            state.webUrlInput.value = "";
            state.webUrlInput.focus();
            state.webUrlInput.select();
        }
        if (state.webAltInput) {
            state.webAltInput.value = "";
        }
    },

    /**
     * validates current page data
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance
     * @returns {true|{valid:false,message:string}}
     */
    validate: function (modal) {
        const editor = modal ? modal._editor : null;
        const state = ensureImageState(modal);
        if (!editor || !state.webUrlInput) {
            return { valid: false, message: "internal error: editor or field not available." };
        }
        const safeUrl = editor._sanitizeUrl(state.webUrlInput.value || "");
        if (!safeUrl) {
            return { valid: false, message: "Please provide a valid image URL." };
        }
        return true;
    },

    /**
     * handles submit and inserts the image html
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance
     * @returns {void}
     */
    onSubmit: function (modal) {
        const editor = modal ? modal._editor : null;
        const state = ensureImageState(modal);
        if (!editor || !state.webUrlInput) {
            return;
        }
        const safeUrl = editor._sanitizeUrl(state.webUrlInput.value || "");
        if (!safeUrl) {
            return;
        }
        const alt = String((state.webAltInput && state.webAltInput.value) || "").trim();
        editor._restoreSavedRange();
        editor._insertHtmlAtCursor('<img src="' + safeUrl + '" alt="' + editor._escapeHtml(alt) + '">');
        if (editor._formInput) {
            editor._formInput.value = editor._editorElement ? editor._editorElement.innerHTML : "";
        }
    }
});

/**
 * page: image from site
 */
webexpress.webui.DialogPanels.register("editor-image", {
    id: "image-site",
    parentId: null,
    title: "From the Site",
    iconClass: "fas fa-image",

    /**
     * renders the page ui
     * @param {HTMLElement} container - host container for the page
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance (holds _editor and _image state)
     * @returns {void}
     */
    render: function (container, modal) {
        const state = ensureImageState(modal);
        const editor = modal ? modal._editor : null;

        // wrapper
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

        // refs
        const uploadHost = wrapper.querySelector(".wx-webui-upload");
        const listHost = wrapper.querySelector(".wx-webui-file-list");
        const siteAltInput = wrapper.querySelector('input[data-role="site-alt"]');

        // store refs
        state.uploadHost = uploadHost;
        state.siteAltInput = siteAltInput;
        state.selectedSiteImage = null;

        // configure upload endpoint
        if (uploadHost) {
            const uploadUri = editor ? (editor._imageUploadUri || "") : "";
            uploadHost.dataset.uri = uploadUri;
            if (!uploadUri) {
                uploadHost.style.display = "none";
            }
        }

        // init controls when available
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

        // selection via click
        let selectedRow = null;
        container.addEventListener("click", function (e) {
            const link = e.target.closest(".wx-file-list a.link, .wx-webui-file-list a.link");
            const row = e.target.closest(".wx-file-list tr");
            if (link) {
                e.preventDefault();
                const src = link.getAttribute("href");
                const altGuess = link.textContent || "";
                state.selectedSiteImage = { src: src, alt: altGuess };
                if (selectedRow) {
                    selectedRow.classList.remove("table-primary");
                }
                if (row) {
                    selectedRow = row;
                    selectedRow.classList.add("table-primary");
                }
            }
        });

        // double click inserts immediately
        container.addEventListener("dblclick", function (e) {
            const link = e.target.closest(".wx-file-list a.link, .wx-webui-file-list a.link");
            if (!link) {
                return;
            }
            e.preventDefault();
            if (!editor) {
                return;
            }
            const src = link.getAttribute("href");
            const safe = editor._sanitizeUrl(src || "");
            if (!safe) {
                return;
            }
            const alt = String((state.siteAltInput && state.siteAltInput.value) || "").trim() || (link.textContent || "");
            editor._restoreSavedRange();
            editor._insertHtmlAtCursor('<img src="' + safe + '" alt="' + editor._escapeHtml(alt) + '">');
            if (typeof modal.hide === "function") {
                modal.hide();
            }
        });

        // upload success inserts image when base uri configured
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
            if (editor._imageBaseUri) {
                const base = editor._imageBaseUri.replace(/\/+$/, "");
                const src = base + "/" + encodeURIComponent(file.name);
                const alt = String((state.siteAltInput && state.siteAltInput.value) || "").trim() || file.name;
                editor._restoreSavedRange();
                editor._insertHtmlAtCursor('<img src="' + editor._sanitizeUrl(src) + '" alt="' + editor._escapeHtml(alt) + '">');
                if (typeof modal.hide === "function") {
                    modal.hide();
                }
            }
        };
        document.addEventListener(webexpress.webui.Event.UPLOAD_SUCCESS_EVENT, onUploadSuccess);
    },

    /**
     * validates current page data
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance
     * @returns {true|{valid:false,message:string}}
     */
    validate: function (modal) {
        const editor = modal ? modal._editor : null;
        const state = ensureImageState(modal);
        if (!editor) {
            return { valid: false, message: "internal error: editor not available." };
        }
        if (!state.selectedSiteImage || !state.selectedSiteImage.src) {
            return { valid: false, message: "Please select an image from the list." };
        }
        const safe = editor._sanitizeUrl(state.selectedSiteImage.src || "");
        if (!safe) {
            return { valid: false, message: "Please select a valid image URL." };
        }
        return true;
    },

    /**
     * handles submit and inserts the image html
     * @param {webexpress.webui.ModalSidebarPanel} modal - modal instance
     * @returns {void}
     */
    onSubmit: function (modal) {
        const editor = modal ? modal._editor : null;
        const state = ensureImageState(modal);
        if (!editor || !state.selectedSiteImage || !state.selectedSiteImage.src) {
            return;
        }
        const safe = editor._sanitizeUrl(state.selectedSiteImage.src || "");
        if (!safe) {
            return;
        }
        const alt = String((state.siteAltInput && state.siteAltInput.value) || "").trim() || state.selectedSiteImage.alt || "";
        editor._restoreSavedRange();
        editor._insertHtmlAtCursor('<img src="' + safe + '" alt="' + editor._escapeHtml(alt) + '">');
        if (editor._formInput) {
            editor._formInput.value = editor._editorElement ? editor._editorElement.innerHTML : "";
        }
    }
});