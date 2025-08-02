/**
 * A control for handling file uploads with drag-and-drop support and fetch API.
 * The following events are triggered:
 * - webexpress.webui.Event.FILE_SELECTED_EVENT
 * - webexpress.webui.Event.UPLOAD_SUCCESS_EVENT
 * - webexpress.webui.Event.UPLOAD_ERROR_EVENT
 * - webexpress.webui.Event.UPLOAD_PROGRESS_EVENT
 */
webexpress.webui.UploadCtrl = class extends webexpress.webui.Ctrl {

    /**
     * Initializes the control, setting up configuration and the DOM.
     * @param {HTMLElement} element The DOM element for the control.
     */
    constructor(element) {
        super(element);

        // configuration from data attributes
        this._id = this._element.id;
        this._name = this._element.getAttribute("name") || null;
        this._uploadUri = this._element.dataset.uri || "";
        this._multiple = this._element.dataset.multiple !== "false";
        this._accept = this._element.dataset.accept || "*/*";
        this._fullscreenDropzone = this._element.dataset.fullscreenDropzone === "true";
        this._autoupload = this._element.dataset.autoupload === "true";
        this._showProgress = this._element.dataset.progress === "true" || true;
        this._placeholder = this._element.getAttribute("placeholder") || "Drag files here or click to upload";

        this.files = [];

        this._initDOM();
        this._bindEvents();
    }

    /**
     * Initializes the DOM structure of the upload control.
     */
    _initDOM() {
        // clean up the host element
        while (this._element.firstChild) {
            this._element.removeChild(this._element.firstChild);
        }
        this._element.classList.add("wx-upload");

        // create dropzone
        this._dropzone = document.createElement("div");
        this._dropzone.className = "wx-upload-dropzone";
        this._dropzone.textContent = this._placeholder;

        // create a file input for triggering the file dialog
        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this._fileInput.style.display = "none";
        this._fileInput.multiple = this._multiple;
        this._fileInput.accept = this._accept;

        // create preview container
        this._preview = document.createElement("div");
        this._preview.className = "wx-upload-preview";

        // create upload button for manual uploads
        this._uploadButton = document.createElement("button");
        this._uploadButton.textContent = "Upload Files";
        this._uploadButton.className = "btn btn-primary mt-2";
        this._uploadButton.style.display = "none";

        // append elements to the host element
        this._element.appendChild(this._dropzone);
        this._element.appendChild(this._fileInput);
        this._element.appendChild(this._preview);
        this._element.appendChild(this._uploadButton);
    }

    /**
     * Binds drag-and-drop, click, and file input events.
     */
    _bindEvents() {
        const dropTarget = this._fullscreenDropzone ? document.body : this._element;

        // add hover effect on drag
        ["dragenter", "dragover"].forEach(eventName =>
            dropTarget.addEventListener(eventName, e => {
                e.preventDefault();
                this._dropzone.classList.add("hover");
            })
        );

        // remove hover effect
        ["dragleave", "drop"].forEach(eventName =>
            dropTarget.addEventListener(eventName, e => {
                e.preventDefault();
                this._dropzone.classList.remove("hover");
            })
        );

        // handle dropped files
        dropTarget.addEventListener("drop", e => {
            this._handleFiles(e.dataTransfer.files);
        });

        // open file picker on click
        this._dropzone.addEventListener("click", () => this._fileInput.click());

        // handle selected files from the file picker
        this._fileInput.addEventListener("change", () => {
            this._handleFiles(this._fileInput.files);
        });

        // handle upload button click
        this._uploadButton.addEventListener("click", () => {
            this.upload();
        });
    }

    /**
     * Processes selected or dropped files, updating the UI and preparing for upload.
     * @param {FileList} fileList The list of files to handle.
     */
    _handleFiles(fileList) {
        const newFiles = Array.from(fileList);
        if (!this._multiple) {
            this.files = newFiles.length > 0 ? [newFiles[0]] : [];
        } else {
            // merge and remove duplicates based on file name
            const existingFileNames = new Set(this.files.map(f => f.name));
            const uniqueNewFiles = newFiles.filter(f => !existingFileNames.has(f.name));
            this.files.push(...uniqueNewFiles);
        }

        this._renderPreview();
        this._dispatch(webexpress.webui.Event.FILE_SELECTED_EVENT, { files: this.files });

        if (this._autoupload) {
            this.upload();
        } else {
            this._uploadButton.style.display = this.files.length > 0 ? "inline-block" : "none";
        }
    }

    /**
     * Renders the preview area with the currently selected files.
     */
    _renderPreview() {
        // clear existing previews by removing all child nodes
        while (this._preview.firstChild) {
            this._preview.removeChild(this._preview.firstChild);
        }

        this.files.forEach(file => {
            const previewElement = this._createPreviewElement(file);
            this._preview.appendChild(previewElement);
        });
    }

    /**
     * Creates a DOM element for a single file preview.
     * @param {File} file The file to create a preview for.
     * @returns {HTMLElement} The preview element.
     */
    _createPreviewElement(file) {
        const previewElement = document.createElement("div");
        previewElement.className = "wx-upload-file-preview";
        previewElement.dataset.fileName = file.name;

        const icon = document.createElement("i");
        icon.className = this._getIconForFilename(file.name);
        previewElement.appendChild(icon);

        const text = document.createElement("span");
        text.textContent = file.name;
        previewElement.appendChild(text);

        const removeBtn = document.createElement("button");
        removeBtn.className = "fas fa-times";
        removeBtn.title = "Remove file";
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            this.files = this.files.filter(f => f.name !== file.name);
            previewElement.remove();
            if (!this._autoupload) {
                this._uploadButton.style.display = this.files.length > 0 ? "inline-block" : "none";
            }
        };
        previewElement.appendChild(removeBtn);

        return previewElement;
    }

    /**
     * Uploads all selected files to the server.
     */
    upload() {
        if (!this._autoupload) {
            this._uploadButton.style.display = "none";
        }
        // create a copy of the files array to avoid issues with modification during iteration
        const filesToUpload = [...this.files];
        this.files = []; // clear the main files array

        filesToUpload.forEach(file => {
            this._uploadFile(file);
        });
    }

    /**
     * Uploads a single file using XMLHttpRequest to support progress tracking.
     * @param {File} file The file to upload.
     */
    _uploadFile(file) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append(this._name, this._id || "true");

        xhr.open("POST", this._uploadUri, true);

        // handle upload progress
        xhr.upload.onprogress = e => {
            if (e.lengthComputable && this._showProgress) {
                const percent = Math.round((e.loaded / e.total) * 100);
                this._dispatch(webexpress.webui.Event.UPLOAD_PROGRESS_EVENT, { file, percent });
                this._updateProgress(file.name, percent);
            }
        };

        // handle successful or failed upload
        xhr.onload = () => {
            const previewElement = this._preview.querySelector(`[data-file-name="${file.name}"]`);
            if (xhr.status >= 200 && xhr.status < 300) {
                this._dispatch(webexpress.webui.Event.UPLOAD_SUCCESS_EVENT, { file });
                if (previewElement) {
                    previewElement.remove();
                }
            } else {
                this._dispatch(webexpress.webui.Event.UPLOAD_ERROR_EVENT, { file, error: xhr.statusText, status: xhr.status });
                if (previewElement) {
                    previewElement.classList.add("error");
                }
            }
        };

        // handle network errors
        xhr.onerror = () => {
            this._dispatch(webexpress.webui.Event.UPLOAD_ERROR_EVENT, { file, error: "Network Error", status: xhr.status });
            const previewElement = this._preview.querySelector(`[data-file-name="${file.name}"]`);
            if (previewElement) {
                previewElement.classList.add("error");
            }
        };

        xhr.send(formData);
    }

    /**
     * Renders or updates a progress bar for a file upload.
     * @param {string} filename The name of the file being uploaded.
     * @param {number} percent The completion percentage.
     */
    _updateProgress(filename, percent) {
        const previewElement = this._preview.querySelector(`[data-file-name="${filename}"]`);
        if (!previewElement) return;

        let progressBar = previewElement.querySelector(".wx-upload-progress");
        if (!progressBar) {
            progressBar = document.createElement("div");
            progressBar.className = "wx-upload-progress";

            const bar = document.createElement("div");
            bar.className = "bar";
            bar.style.width = "0%";
            progressBar.appendChild(bar);

            // insert progress bar before the remove button
            previewElement.insertBefore(progressBar, previewElement.querySelector("button"));
        }

        const bar = progressBar.querySelector(".bar");
        if (bar) {
            bar.style.width = `${percent}%`;
        }
    }

    /**
     * Dispatches a custom event from the control's host element.
     * @param {string} type The event type.
     * @param {object} detail The event's detail object.
     */
    _dispatch(type, detail) {
        document.dispatchEvent(new CustomEvent(type, {
            detail: {
                sender: this._element,
                id: this._element.id,
                ...detail
            },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Returns a Font Awesome icon class based on the file extension.
     * @param {string} filename The name of the file (e.g., "report.pdf").
     * @returns {string} The corresponding Font Awesome icon class (e.g., "fas fa-file-pdf").
     */
    _getIconForFilename(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            "doc": "fas fa-file-word",
            "docx": "fas fa-file-word",
            "xls": "fas fa-file-excel",
            "xlsx": "fas fa-file-excel",
            "csv": "fas fa-file-csv",
            "ppt": "fas fa-file-powerpoint",
            "pptx": "fas fa-file-powerpoint",
            "pdf": "fas fa-file-pdf",
            "txt": "fas fa-file-alt",
            "jpg": "fas fa-file-image",
            "jpeg": "fas fa-file-image",
            "png": "fas fa-file-image",
            "gif": "fas fa-file-image",
            "zip": "fas fa-file-archive",
            "rar": "fas fa-file-archive",
            "mp3": "fas fa-file-audio",
            "wav": "fas fa-file-audio",
            "mp4": "fas fa-file-video",
            "mov": "fas fa-file-video"
        };
        return iconMap[ext] || "fas fa-file";
    }
};

// register the class with the controller
webexpress.webui.Controller.registerClass("wx-webui-upload", webexpress.webui.UploadCtrl);