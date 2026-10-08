/**
 * A control for uploading and cropping a profile image with circular or rectangular mask.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.FILE_SELECTED_EVENT
 */
webexpress.webui.InputAvatarCtrl = class extends webexpress.webui.Ctrl {

    /**
     * The number of discrete positions of the zoom slider. The slider spans this domain
     * regardless of the image, so the perceived zoom granularity stays the same for a
     * thumbnail and for a multi-megapixel photo.
     */
    static ZOOM_RESOLUTION = 1000;

    /**
     * Initializes the avatar crop upload control.
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        // configuration from attributes and data-* settings
        this._id = this._element.getAttribute("id");
        this._name = this._element.getAttribute("name") || "avatar";
        this._element.removeAttribute("id");
        this._element.removeAttribute("name");
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
        this._sourceDataUrl = null;    // pass-through file, already read as a data-url
        this._loadedValue = "";        // the value the form loaded, ie. what the page shows
        this._dirty = false;           // a picture was picked or cropped in this session
        this._syncHandle = 0;          // debounce of the hidden-field update
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
        // the file input the form labelled is hidden; the drop zone is what takes the focus
        this._adoptFieldLabel(this._dropzone, this._id, this._element);

        // hidden file input
        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        if (this._id) {
            this._fileInput.id = this._id;
        }
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

        // the slider carries a position in a fixed integer domain, never the scale itself:
        // a fractional min lets the browser round the sanitized value just below the min it
        // was given, which reports a range underflow and blocks the surrounding form
        this._zoom = document.createElement("input");
        this._zoom.type = "range";
        this._zoom.className = "wx-upload-avatar-zoom";
        this._zoom.min = "0";
        this._zoom.max = String(webexpress.webui.InputAvatarCtrl.ZOOM_RESOLUTION);
        this._zoom.step = "1";
        this._zoom.value = "0";
        this._zoom.id = (this._id || "wx-avatar") + "_zoom";
        this._zoomLabel.htmlFor = this._zoom.id;
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
        this._hidden = document.createElement("input");
        this._hidden.type = "hidden";
        this._hidden.name = this._name;
        this._element.appendChild(this._hidden);
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
            const targetScale = this._sliderToScale(parseFloat(this._zoom.value));
            this._zoomAroundPoint(targetScale, { x: this._viewport / 2, y: this._viewport / 2 });
            this._requestRender();
            this._scheduleHiddenSync();
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
            this._zoom.value = String(this._scaleToSlider(newScale));
            this._requestRender();
            this._scheduleHiddenSync();
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
                    this._zoom.value = String(this._scaleToSlider(newScale));
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

            // the crop is exported when the gesture ends rather than on every frame of it
            this._scheduleHiddenSync();
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
            // The hidden field has to be filled by the time anything reads the form, and it
            // has to be filled synchronously. A form backed by a REST service serializes its
            // [name] fields inside its own submit listener, so a value written after an await
            // arrives after the request has already been assembled - the picture the user
            // picked would silently never leave the browser, and the request would still
            // report success. Cropping is synchronous apart from the encoding, so the export
            // is done with toDataURL() here rather than with toBlob(), and the submit is left
            // alone: no preventDefault, no re-submit of our own.
            form.addEventListener("submit", () => {
                this._syncHiddenValue();
            });

            // The picture is rendered by the server in several places at once - a sidebar, a
            // breadcrumb, a list - and none of them is re-rendered when a dialog saves. The
            // control has what they need, though: the picture the user just submitted is in
            // this browser already, and the address they are still showing is the value this
            // form loaded. So the two are matched up here, and the page shows the new picture
            // the moment it is stored instead of after the next reload.
            form.addEventListener(webexpress.webui.Event.UPLOAD_SUCCESS_EVENT, () => {
                this._reflectSavedPicture();
            });
        }

        // also handle cases where value is set via assignment (fires 'change')
        this._hidden.addEventListener("change", () => {
            this._updateFromHiddenInputValue(this._hidden.value);
        });

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
        this._sourceDataUrl = null;

        // from here on the control carries a picture the user chose, so the hidden field is
        // kept in step with it. Until then it holds whatever the form loaded - an existing
        // icon uri, say - and that must survive a dialog nobody edited.
        this._dirty = true;

        if (this._isPassThrough) {
            // svg and gif are handed on unchanged, and the only asynchronous read left is
            // this one; it is done now rather than at submit, so the export stays synchronous
            const reader = new FileReader();
            reader.onload = () => {
                this._sourceDataUrl = String(reader.result || "");
                this._syncHiddenValue();
            };
            reader.readAsDataURL(file);
        }

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
            this._syncHiddenValue();
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
        this._zoom.value = String(this._scaleToSlider(this._scale));
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
        this._zoom.value = String(this._scaleToSlider(this._scale));
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
     * Projects a scale onto the slider's integer domain.
     * @param {number} scale Scale within the current scale range.
     * @returns {number} Slider position.
     */
    _scaleToSlider(scale) {
        const span = this._maxScale - this._minScale;
        if (!(span > 0)) {
            return 0;
        }
        const ratio = this._clamp((scale - this._minScale) / span, 0, 1);
        return Math.round(ratio * webexpress.webui.InputAvatarCtrl.ZOOM_RESOLUTION);
    }

    /**
     * Projects a slider position back onto the current scale range.
     * @param {number} position Slider position.
     * @returns {number} Scale within the current scale range.
     */
    _sliderToScale(position) {
        const resolution = webexpress.webui.InputAvatarCtrl.ZOOM_RESOLUTION;
        if (!Number.isFinite(position)) {
            return this._minScale;
        }
        const ratio = this._clamp(position, 0, resolution) / resolution;
        return this._minScale + ratio * (this._maxScale - this._minScale);
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
     * Writes the current picture into the hidden field, so whoever serializes the form finds
     * it there. Does nothing until the user has actually picked a picture: an untouched
     * dialog keeps the value the form loaded - an existing icon uri, for instance - which is
     * what tells the server that nothing about the picture changed.
     */
    _syncHiddenValue() {
        if (this._syncHandle) {
            window.clearTimeout(this._syncHandle);
            this._syncHandle = 0;
        }

        if (!this._dirty) {
            return;
        }

        if (this._isPassThrough) {
            // svg and gif are passed on unchanged; the read was started when the file was
            // picked. Until it lands the previous value stands rather than being cleared.
            if (this._sourceDataUrl) {
                this._hidden.value = `file:${this._filename};${this._sourceDataUrl}`;
            }

            return;
        }

        if (!this._image) {
            this._hidden.value = "";

            return;
        }

        try {
            this._hidden.value = `file:${this._filename};${this._exportCroppedDataUrl()}`;
        } catch (err) {
            // a canvas tainted by a cross-origin image cannot be read back; leaving the
            // previous value in place is better than submitting an empty picture
        }
    }

    /**
     * Replaces every picture on the page that shows the value this form loaded with the one
     * that was just saved, so a change is visible immediately rather than after a reload.
     * @remarks
     * Only the pictures showing exactly the old address are touched, which is why the value
     * the form loaded is remembered: a record's icon may appear many times, and everything
     * else on the page belongs to other records. Nothing happens when the user picked no new
     * picture, or when the picture was removed - the address of what the server falls back to
     * is not something this control can know.
     */
    _reflectSavedPicture() {
        if (!this._dirty || !this._loadedValue) {
            return;
        }

        const value = this._hidden ? this._hidden.value : "";
        const start = value.indexOf("data:");

        if (start < 0) {
            return;
        }

        const picture = value.substring(start);
        const previous = new URL(this._loadedValue, document.baseURI).href;

        for (const image of document.querySelectorAll("img")) {
            const source = image.getAttribute("src");

            if (!source) {
                continue;
            }

            try {
                if (new URL(source, document.baseURI).href === previous) {
                    image.setAttribute("src", picture);
                }
            } catch (err) {
                // a src that is not a url at all cannot be the one being replaced
            }
        }

        // the page now shows the new picture, so a second save must not look for the old one
        this._loadedValue = "";
    }

    /**
     * Requests a hidden-field update once the user stops moving. Panning and zooming emit a
     * great many events, and each export encodes a full-size image.
     */
    _scheduleHiddenSync() {
        if (!this._dirty) {
            return;
        }

        if (this._syncHandle) {
            window.clearTimeout(this._syncHandle);
        }

        this._syncHandle = window.setTimeout(() => {
            this._syncHandle = 0;
            this._syncHiddenValue();
        }, 150);
    }

    /**
     * Draws the cropped area into an offscreen canvas of the configured output size.
     * @returns {HTMLCanvasElement} the canvas holding the crop; empty when there is no image
     */
    _renderCropCanvas() {
        const out = document.createElement("canvas");
        out.width = this._outputSize;
        out.height = this._outputSize;

        if (!this._image) {
            return out;
        }

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

        return out;
    }

    /**
     * Exports the cropped area as a data-url in the configured format/quality.
     * For pass-through formats (SVG, GIF), returns the original file unchanged.
     * @returns {string} the data-url
     */
    _exportCroppedDataUrl() {
        if (this._isPassThrough && this._sourceDataUrl) {
            return this._sourceDataUrl;
        }

        return this._renderCropCanvas().toDataURL(this._outputFormat, this._outputQuality);
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

        const out = this._renderCropCanvas();

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

    /**
     * Updates the avatar preview if a new value is set into the hidden field (externally).
     * Recognizes data-urls and generates preview.
     * @param {string} value The new value from the hidden field.
     */
    _updateFromHiddenInputValue(value) {
        // the value was handed to the control from outside - the form loaded it, or a caller
        // assigned it - so it is what the field should carry until the user picks something
        // else. Re-exporting it as a freshly encoded picture would replace an existing icon
        // uri with a copy of itself on every save.
        this._dirty = false;
        this._sourceDataUrl = null;
        this._loadedValue = (typeof value === "string") ? value : "";

        if (typeof value !== "string" || !value) {
            // reset preview
            this._image = null;
            this._cleanupObjectUrl();
            this._requestRender();
            return;
        }

        this._cleanupObjectUrl();
        const img = new window.Image();
        img.onload = () => {
            this._image = img;
            this._filename = "avatar";
            this._isPassThrough = false;
            this._initTransform();
            this._zoom.disabled = false;
            this._requestRender();
        };
        img.onerror = () => {
            this._image = null;
            this._requestRender();
        };
        img.src = value;
    }

    /**
     * Returns the current value.
     * @returns {string}
     */
    get value() {
        return this._hidden ? this._hidden.value : "";
    }

    /**
     * Sets the value of the input and updates the preview accordingly.
     * @param {string} v new value (should be a data url or file:...)
     */
    set value(v) {
        if (typeof v !== "string") {
            v = "";
        }
        if (this._hidden) {
            this._hidden.value = v;
            this._updateFromHiddenInputValue(v);
        }
    }
};

// register the class with the controller
webexpress.webui.Controller.registerClass("wx-webui-input-avatar", webexpress.webui.InputAvatarCtrl);