/* 
 * A control for uploading and cropping a profile image with circular or rectangular mask.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.FILE_SELECTED_EVENT 
 */
webexpress.webui.InputAvatarCtrl = class extends webexpress.webui.Ctrl {

    /**
     * Initializes the avatar crop upload control.
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        // configuration from attributes and data-* settings
        this._id = this._element.id;
        this._name = this._element.getAttribute("name") || "avatar";
        this._uploadUri = this._element.dataset.uri || "";
        this._shape = (this._element.dataset.shape === "rect") ? "rect" : "circle";
        this._viewport = parseInt(this._element.dataset.viewport || "320", 10);
        this._outputSize = parseInt(this._element.dataset.size || "512", 10);
        this._outputFormat = this._element.dataset.outputFormat || "image/png";
        this._outputQuality = parseFloat(this._element.dataset.outputQuality || "0.92");
        this._accept = this._element.getAttribute("accept") || "image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp,image/svg+xml";
        this._placeholder = this._element.getAttribute("placeholder") || this._i18n("webexpress.webui:avatar.placeholder", "Drop image here or double click");
        this._overlayAlpha = this._parseNumber(this._element.dataset.overlayAlpha, 0.5, 0, 1);

        // state
        this._image = null;
        this._imageUrl = null;
        this._isPassThrough = false;   // svg or gif -> pass-through without cropping
        this._sourceFile = null;       // original file for pass-through export
        this._scale = 1;
        this._minScale = 1;
        this._maxScale = 5;
        this._tx = 0;  // translate x in css pixels
        this._ty = 0;  // translate y in css pixels
        this._isPanning = false;
        this._lastPan = { x: 0, y: 0 };
        this._pointers = new Map();
        this._initialPinch = null;
        this._filename = "avatar";
        this._dpr = Math.max(1, window.devicePixelRatio || 1);
        this._rafId = 0;     // rAF id of a scheduled render
        this._needsRender = false; // deduplicate renders

        // dom
        this._initDOM();
        this._bindEvents();
        this._requestRender();
    }

    /**
     * Initializes DOM structure and canvas.
     */
    _initDOM() {
        // cleanup host
        while (this._element.firstChild) {
            this._element.removeChild(this._element.firstChild);
        }
        this._element.classList.add("wx-upload-avatar");

        // dropzone
        this._dropzone = document.createElement("div");
        this._dropzone.className = "wx-upload-avatar-dropzone";
        this._dropzone.textContent = this._placeholder;
        this._dropzone.setAttribute("role", "button");
        this._dropzone.tabIndex = 0;
        this._element.appendChild(this._dropzone);

        // hidden file input
        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this._fileInput.accept = this._accept;
        this._fileInput.style.display = "none";
        this._element.appendChild(this._fileInput);

        // canvas container
        this._canvasWrap = document.createElement("div");
        this._canvasWrap.className = "wx-upload-avatar-canvas-wrap";
        this._dropzone.appendChild(this._canvasWrap);

        // canvas
        this._canvas = document.createElement("canvas");
        this._canvas.className = "wx-upload-avatar-canvas";
        this._canvas.style.width = this._viewport + "px";
        this._canvas.style.height = this._viewport + "px";
        this._canvas.width = Math.floor(this._viewport * this._dpr);
        this._canvas.height = Math.floor(this._viewport * this._dpr);
        this._canvas.style.touchAction = "none"; // ensure custom pinch/drag works without browser gestures
        this._ctx = this._canvas.getContext("2d");
        this._canvasWrap.appendChild(this._canvas);

        // controls
        this._controls = document.createElement("div");
        this._controls.className = "wx-upload-avatar-controls";
        this._element.appendChild(this._controls);

        // zoom slider
        this._zoomLabel = document.createElement("label");
        this._zoomLabel.className = "wx-upload-avatar-zoom-label";
        this._zoomLabel.textContent = this._i18n("webexpress.webui:avatar.zoom.label", "Zoom");
        this._controls.appendChild(this._zoomLabel);

        this._zoom = document.createElement("input");
        this._zoom.type = "range";
        this._zoom.className = "wx-upload-avatar-zoom";
        this._zoom.min = "1";
        this._zoom.max = "5";
        this._zoom.step = "0.001";
        this._zoom.value = "1";
        this._controls.appendChild(this._zoom);

        // action buttons
        this._buttons = document.createElement("div");
        this._buttons.className = "wx-upload-avatar-buttons";
        this._controls.appendChild(this._buttons);

        this._btnSelect = document.createElement("button");
        this._btnSelect.type = "button";
        this._btnSelect.className = "btn btn-secondary";
        this._btnSelect.textContent = this._i18n("webexpress.webui:avatar.upload.image.label", "Select image");
        this._buttons.appendChild(this._btnSelect);

        // create hidden input for data-url payload
        this._hiddenFormInput = document.createElement("input");
        this._hiddenFormInput.type = "hidden";
        this._hiddenFormInput.name = this._name;
        this._element.appendChild(this._hiddenFormInput);
    }

    /**
     * Binds events: drag&drop, input, canvas interactions and buttons.
     */
    _bindEvents() {
        const dropTarget = this._element;

        // drag hover
        ["dragenter", "dragover"].forEach(name => {
            dropTarget.addEventListener(name, e => {
                e.preventDefault();
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = "copy";
                }
                this._dropzone.classList.add("hover");
            });
        });

        // drag leave/end
        ["dragleave", "drop"].forEach(name => {
            dropTarget.addEventListener(name, e => {
                e.preventDefault();
                this._dropzone.classList.remove("hover");
            });
        });

        // drop handler
        dropTarget.addEventListener("drop", e => {
            const files = e.dataTransfer ? e.dataTransfer.files : null;
            if (files && files.length > 0) {
                this._handleFile(files[0]);
            }
        });

        // open file dialog
        this._dropzone.addEventListener("dblclick", () => {
            this._fileInput.click();
        });
        this._dropzone.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                this._fileInput.click();
            }
        });
        this._btnSelect.addEventListener("click", () => {
            this._fileInput.click();
        });

        // file input change
        this._fileInput.addEventListener("change", () => {
            const file = (this._fileInput.files && this._fileInput.files[0]) ? this._fileInput.files[0] : null;
            if (file) {
                this._handleFile(file);
            }
        });

        // zoom slider
        this._zoom.addEventListener("input", () => {
            if (!this._image) {
                return;
            }
            if (this._isPassThrough) {
                return;
            }
            const targetScale = this._clamp(parseFloat(this._zoom.value), this._minScale, this._maxScale);
            this._zoomAroundPoint(targetScale, { x: this._viewport / 2, y: this._viewport / 2 });
            this._requestRender();
        });

        // wheel zoom
        this._canvas.addEventListener("wheel", e => {
            if (!this._image) {
                return;
            }
            if (this._isPassThrough) {
                return;
            }
            e.preventDefault();
            const rect = this._canvas.getBoundingClientRect();
            const p = { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
            const delta = -e.deltaY;
            const zoomFactor = Math.exp(delta * 0.0015);
            const newScale = this._clamp(this._scale * zoomFactor, this._minScale, this._maxScale);
            this._zoomAroundPoint(newScale, p);
            this._zoom.value = String(newScale);
            this._requestRender();
        }, { passive: false });

        // pointer pan/pinch
        this._canvas.addEventListener("pointerdown", e => {
            if (this._isPassThrough) {
                return;
            }
            e.stopPropagation();
            this._canvas.setPointerCapture(e.pointerId);
            this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this._pointers.size === 1) {
                this._isPanning = true;
                this._lastPan = this._clientToCanvas(e);
            } else if (this._pointers.size === 2) {
                this._initialPinch = this._getPinchState();
            }
        });

        this._canvas.addEventListener("pointermove", e => {
            if (!this._image) {
                return;
            }
            if (this._isPassThrough) {
                return;
            }
            if (this._pointers.has(e.pointerId)) {
                this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            }
            if (this._pointers.size === 1 && this._isPanning) {
                const p = this._clientToCanvas(e);
                const dx = p.x - this._lastPan.x;
                const dy = p.y - this._lastPan.y;
                this._tx += dx;
                this._ty += dy;
                this._constrain();
                this._lastPan = p;
                this._requestRender();
            } else if (this._pointers.size === 2 && this._initialPinch) {
                const pinch = this._getPinchState();
                if (pinch && this._initialPinch) {
                    const newScale = this._clamp(this._initialPinch.scale * (pinch.distance / this._initialPinch.distance), this._minScale, this._maxScale);
                    this._zoomAroundPoint(newScale, pinch.center);
                    this._zoom.value = String(newScale);
                    this._requestRender();
                }
            }
        });

        const endPointer = e => {
            if (this._isPassThrough) {
                return;
            }
            e.stopPropagation();
            if (this._pointers.has(e.pointerId)) {
                this._pointers.delete(e.pointerId);
            }
            if (this._pointers.size < 2) {
                this._initialPinch = null;
            }
            if (this._pointers.size === 0) {
                this._isPanning = false;
            }
        };
        this._canvas.addEventListener("pointerup", endPointer);
        this._canvas.addEventListener("pointercancel", endPointer);
        this._canvas.addEventListener("pointerleave", endPointer);

        // resize observer to keep canvas crisp if container/css or dpr changes
        this._resizeObserver = new ResizeObserver(() => {
            this._syncCanvasSize();
            this._requestRender();
        });
        this._resizeObserver.observe(this._canvas);

        // also react to window resize to catch dpr changes on zooming
        window.addEventListener("resize", () => {
            this._syncCanvasSize();
            this._requestRender();
        });

        const form = this._element.closest("form");
        if (form) {
            // intercept submit to fill hidden field asynchronously
            form.addEventListener("submit", async e => {
                if (!this._image && !this._isPassThrough) {
                    return;
                }

                e.preventDefault();

                try {
                    const blob = await this._exportCroppedBlob();
                    const dataUrl = await this._blobToDataURL(blob);
                    this._hiddenFormInput.value = `file:${this._filename};${String(dataUrl)}`;
                } catch (err) {
                    this._hiddenFormInput.value = "";
                }

                form.submit();
            });
        }

        // cleanup on unload to release object urls
        window.addEventListener("beforeunload", () => {
            this._cleanupObjectUrl();
        });
    }

    /**
     * Handles a selected image file.
     * @param {File} file The image file.
     */
    _handleFile(file) {
        if (!file || !file.name) {
            return;
        }

        const type = (file.type || "").toLowerCase();
        const name = (file.name || "").toLowerCase();

        const isPng = type === "image/png" || name.endsWith(".png");
        const isJpeg = type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg");
        const isWebp = type === "image/webp" || name.endsWith(".webp");
        const isAvif = type === "image/avif" || name.endsWith(".avif");
        const isBmp = type === "image/bmp" || name.endsWith(".bmp");
        const isGif = type === "image/gif" || name.endsWith(".gif");
        const isSvg = type === "image/svg+xml" || name.endsWith(".svg");

        const supported = isPng || isJpeg || isWebp || isAvif || isBmp || isGif || isSvg;
        if (!supported) {
            return;
        }

        // pass-through for svg and gif (no cropping, keep file as-is)
        this._isPassThrough = (isSvg || isGif);
        this._sourceFile = this._isPassThrough ? file : null;

        // reset previous image url
        this._cleanupObjectUrl();

        this._filename = (file.name && file.name.split(".").slice(0, -1).join(".")) || "avatar";
        this._dispatch(webexpress.webui.Event.FILE_SELECTED_EVENT, { files: [file] });

        // preview (first frame for animated gif)
        this._imageUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            this._image = img;

            if (this._isPassThrough) {
                // preview contained fully (no crop)
                this._initTransformContain();
                // disable zoom control for pass-through
                this._zoom.disabled = true;
            } else {
                this._initTransform();
                this._zoom.disabled = false;
            }

            this._requestRender();
        };
        img.onerror = () => {
            this._image = null;
        };
        img.src = this._imageUrl;
    }

    /**
     * Initializes transform to cover the viewport (for cropping).
     */
    _initTransform() {
        if (!this._image) {
            return;
        }
        const vw = this._viewport;
        const vh = this._viewport;
        const sCover = Math.max(vw / this._image.naturalWidth, vh / this._image.naturalHeight);
        this._minScale = sCover;
        this._maxScale = sCover * 8;
        this._scale = sCover;
        this._tx = (vw - this._image.naturalWidth * this._scale) / 2;
        this._ty = (vh - this._image.naturalHeight * this._scale) / 2;
        this._constrain();
        this._zoom.min = String(this._minScale);
        this._zoom.max = String(this._maxScale);
        this._zoom.value = String(this._scale);
    }

    /**
     * Initializes transform to contain the whole image (for pass-through preview).
     */
    _initTransformContain() {
        if (!this._image) {
            return;
        }
        const vw = this._viewport;
        const vh = this._viewport;
        const sContain = Math.min(vw / this._image.naturalWidth, vh / this._image.naturalHeight);
        this._minScale = sContain;
        this._maxScale = sContain;
        this._scale = sContain;
        this._tx = (vw - this._image.naturalWidth * this._scale) / 2;
        this._ty = (vh - this._image.naturalHeight * this._scale) / 2;
        this._zoom.value = String(this._scale);
    }

    /**
     * Ensures the image fully covers the viewport and stays within bounds.
     */
    _constrain() {
        if (!this._image) {
            return;
        }
        const vw = this._viewport;
        const vh = this._viewport;
        const sCover = Math.max(vw / this._image.naturalWidth, vh / this._image.naturalHeight);
        if (this._scale < sCover) {
            this._scale = sCover;
        }
        const sw = this._image.naturalWidth * this._scale;
        const sh = this._image.naturalHeight * this._scale;

        if (sw <= vw) {
            this._tx = (vw - sw) / 2;
        } else {
            if (this._tx > 0) {
                this._tx = 0;
            }
            if (this._tx + sw < vw) {
                this._tx = vw - sw;
            }
        }

        if (sh <= vh) {
            this._ty = (vh - sh) / 2;
        } else {
            if (this._ty > 0) {
                this._ty = 0;
            }
            if (this._ty + sh < vh) {
                this._ty = vh - sh;
            }
        }
    }

    /**
     * Zooms around a specific canvas point, adjusting translation to keep focus stable.
     * @param {number} newScale Target scale.
     * @param {{x:number,y:number}} point Canvas point in CSS pixels.
     */
    _zoomAroundPoint(newScale, point) {
        if (!this._image) {
            return;
        }
        newScale = this._clamp(newScale, this._minScale, this._maxScale);
        const px = point.x;
        const py = point.y;
        const ix = (px - this._tx) / this._scale;
        const iy = (py - this._ty) / this._scale;
        this._scale = newScale;
        this._tx = px - ix * this._scale;
        this._ty = py - iy * this._scale;
        this._constrain();
    }

    /**
     * Renders the canvas: image, optional overlay and mask stroke (skipped for pass-through formats).
     */
    _render() {
        // ensure backing store matches current css size and dpr
        this._syncCanvasSize();

        const ctx = this._ctx;
        const dpr = this._dpr;
        const w = Math.floor(this._viewport * dpr);
        const h = Math.floor(this._viewport * dpr);

        // clear
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        // draw checkerboard only if no image is present
        if (!this._image) {
            this._drawCheckerboard(ctx, w, h);
        }

        // draw image with current transform
        if (this._image) {
            ctx.save();
            ctx.setTransform(this._scale * dpr, 0, 0, this._scale * dpr, this._tx * dpr, this._ty * dpr);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(this._image, 0, 0);
            ctx.restore();
        }

        // skip overlay and mask for pass-through formats
        if (!this._isPassThrough) {
            this._drawOverlayOutside(ctx, w, h);

            ctx.save();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = Math.max(2, Math.floor(2 * dpr));
            ctx.setLineDash([Math.max(8, 8 * dpr), Math.max(6, 6 * dpr)]);
            this._drawMaskPath(ctx, w, h);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * Draws the mask path (circle or rectangle) centered in canvas.
     * @param {CanvasRenderingContext2D} ctx canvas 2d context
     * @param {number} w canvas width in device pixels
     * @param {number} h canvas height in device pixels
     */
    _drawMaskPath(ctx, w, h) {
        ctx.beginPath();
        if (this._shape === "circle") {
            const r = Math.min(w, h) / 2;
            ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        } else {
            const size = Math.min(w, h);
            const x = (w - size) / 2;
            const y = (h - size) / 2;
            ctx.rect(x, y, size, size);
        }
    }

    /**
     * Draws a semi-transparent overlay outside the mask using even-odd fill so the inside remains unaffected.
     * @param {CanvasRenderingContext2D} ctx canvas 2d context
     * @param {number} w canvas width in device pixels
     * @param {number} h canvas height in device pixels
     */
    _drawOverlayOutside(ctx, w, h) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0," + String(this._overlayAlpha) + ")";
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        if (this._shape === "circle") {
            const r = Math.min(w, h) / 2;
            ctx.moveTo(w / 2 + r, h / 2);
            ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        } else {
            const size = Math.min(w, h);
            const x = (w - size) / 2;
            const y = (h - size) / 2;
            ctx.rect(x, y, size, size);
        }
        ctx.fill("evenodd");
        ctx.restore();
    }

    /**
     * Resets the crop to initial cover state for the current image.
     */
    _resetCrop() {
        if (!this._image) {
            return;
        }
        this._initTransform();
        this._requestRender();
    }

    /**
     * Draws a subtle checkerboard background.
     * @param {CanvasRenderingContext2D} ctx canvas 2d context
     * @param {number} w canvas width in device pixels
     * @param {number} h canvas height in device pixels
     */
    _drawCheckerboard(ctx, w, h) {
        const s = Math.max(8, Math.floor(8 * this._dpr));
        for (let y = 0; y < h; y += s) {
            for (let x = 0; x < w; x += s) {
                const odd = ((((x / s) | 0) + ((y / s) | 0)) % 2) === 1;
                ctx.fillStyle = odd ? "#e9e9e9" : "#f5f5f5";
                ctx.fillRect(x, y, s, s);
            }
        }
    }

    /**
     * Adjusts canvas backing size if CSS size or devicePixelRatio changed.
     */
    _syncCanvasSize() {
        // update dpr first to reflect current device pixel ratio
        this._dpr = Math.max(1, window.devicePixelRatio || 1);
        const rect = this._canvas.getBoundingClientRect();
        const newW = Math.floor(rect.width * this._dpr);
        const newH = Math.floor(rect.height * this._dpr);
        if (this._canvas.width !== newW || this._canvas.height !== newH) {
            this._canvas.width = newW;
            this._canvas.height = newH;
        }
    }

    /**
     * Utility: client coordinates to canvas CSS-space.
     * @param {PointerEvent|MouseEvent} e input event
     * @returns {{x:number,y:number}} canvas point in css pixels
     */
    _clientToCanvas(e) {
        const rect = this._canvas.getBoundingClientRect();
        return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
    }

    /**
     * Computes current pinch state from two pointers.
     * @returns {{distance:number, center:{x:number,y:number}, scale:number}|null} pinch state or null
     */
    _getPinchState() {
        if (this._pointers.size !== 2) {
            return null;
        }
        const arr = Array.from(this._pointers.values());
        const a = arr[0];
        const b = arr[1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        const rect = this._canvas.getBoundingClientRect();
        const center = { x: ((a.x + b.x) / 2) - rect.left, y: ((a.y + b.y) / 2) - rect.top };
        return { distance, center, scale: this._scale };
    }

    /**
     * Utility: clamps value to [min,max].
     * @param {number} v value to clamp
     * @param {number} min minimum
     * @param {number} max maximum
     * @returns {number} clamped value
     */
    _clamp(v, min, max) {
        if (v < min) {
            return min;
        }
        if (v > max) {
            return max;
        }
        return v;
    }

    /**
     * Maps mime type to file extension.
     * @param {string} mime mime type
     * @returns {string} extension without dot
     */
    _extFromMime(mime) {
        if (mime === "image/jpeg") {
            return "jpg";
        }
        if (mime === "image/webp") {
            return "webp";
        }
        if (mime === "image/avif") {
            return "avif";
        }
        if (mime === "image/gif") {
            return "gif";
        }
        if (mime === "image/bmp") {
            return "bmp";
        }
        if (mime === "image/svg+xml") {
            return "svg";
        }
        return "png";
    }

    /**
     * Exports the cropped area as a Blob in the configured format/quality.
     * For pass-through formats (SVG, GIF), returns the original file unchanged.
     * @returns {Promise<Blob>} promise resolving to the image blob
     */
    async _exportCroppedBlob() {
        if (this._isPassThrough && this._sourceFile) {
            return Promise.resolve(this._sourceFile);
        }

        if (!this._image) {
            return new Promise(resolve => {
                const c = document.createElement("canvas");
                c.width = this._outputSize;
                c.height = this._outputSize;
                c.toBlob(blob => resolve(blob || new Blob()), this._outputFormat, this._outputQuality);
            });
        }
        const out = document.createElement("canvas");
        out.width = this._outputSize;
        out.height = this._outputSize;
        const ctx = out.getContext("2d");

        // clip to desired shape
        ctx.save();
        ctx.beginPath();
        if (this._shape === "circle") {
            ctx.arc(this._outputSize / 2, this._outputSize / 2, this._outputSize / 2, 0, Math.PI * 2);
        } else {
            ctx.rect(0, 0, this._outputSize, this._outputSize);
        }
        ctx.clip();

        // compute transform mapping from viewport space to output space
        const k = this._outputSize / this._viewport;
        ctx.setTransform(this._scale * k, 0, 0, this._scale * k, this._tx * k, this._ty * k);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(this._image, 0, 0);
        ctx.restore();

        return new Promise(resolve => {
            out.toBlob(blob => {
                resolve(blob || new Blob());
            }, this._outputFormat, this._outputQuality);
        });
    }

    /**
     * Converts a Blob to a data-url string.
     * @param {Blob} blob the blob to convert
     * @returns {Promise<string>} a data-url string (e.g., "data:image/png;base64,...")
     */
    _blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => {
                reject(new Error("blob to data-url failed"));
            };
            reader.onload = () => {
                resolve(String(reader.result || ""));
            };
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Requests a render on the next animation frame (deduplicated).
     */
    _requestRender() {
        if (this._needsRender) {
            return;
        }
        this._needsRender = true;
        this._rafId = window.requestAnimationFrame(() => {
            this._needsRender = false;
            this._render();
        });
    }

    /**
     * Releases previous object URL to prevent memory leaks.
     */
    _cleanupObjectUrl() {
        if (this._imageUrl) {
            try {
                URL.revokeObjectURL(this._imageUrl);
            } catch (e) {
                // ignore revoke errors
            }
            this._imageUrl = null;
        }
    }

    /**
     * Parses a numeric data attribute with clamping.
     * @param {string|undefined} v raw value
     * @param {number} fallback default value
     * @param {number} min minimum
     * @param {number} max maximum
     * @returns {number} parsed and clamped number
     */
    _parseNumber(v, fallback, min, max) {
        const n = (v !== undefined) ? Number(v) : NaN;
        if (!Number.isFinite(n)) {
            return fallback;
        }
        if (n < min) {
            return min;
        }
        if (n > max) {
            return max;
        }
        return n;
    }
};

// register the class with the controller
webexpress.webui.Controller.registerClass("wx-webui-input-avatar", webexpress.webui.InputAvatarCtrl);