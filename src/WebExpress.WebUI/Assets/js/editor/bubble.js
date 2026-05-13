/**
 * Plugin for the floating bubble menu.
 * Displays a mini-toolbar below the current text selection with quick access
 * to bold, italic, underline, strike-through, link insertion and clear-format.
 *
 * Positioning rule: the bubble is always placed BELOW the selection. If the
 * page is so close to the bottom edge that the bubble would be clipped, it is
 * clamped against the viewport bottom — but never flipped above.
 */
webexpress.webui.EditorPlugins.register("bubble", 5000, {
    _bubbleEl: null,
    _currentEditor: null,

    /**
     * Translation helper.
     * @param {string} key - The i18n key.
     * @param {string} fallback - Text to use when no translation is found.
     * @returns {string}
     */
    _i18n: function(key, fallback) {
        return webexpress?.webui?.I18N?.translate?.(key) ?? fallback;
    },

    /**
     * Initializes the plugin for a single editor instance.
     * Builds the bubble lazily on first use and binds selection/scroll/blur
     * handlers so the bubble follows the active editor's selection.
     * @param {object} editor - The editor instance.
     */
    init: function(editor) {
        this._ensureBubble();
        const editorElem = editor.getEditorElement();

        // selectionchange is global; we filter for ranges inside THIS editor
        document.addEventListener("selectionchange", () => {
            setTimeout(() => this._onSelectionChange(editor), 0);
        });

        // keep bubble glued to the selection on scroll / resize
        window.addEventListener("scroll", () => {
            if (this._currentEditor === editor) {
                this._reposition();
            }
        }, true);
        window.addEventListener("resize", () => {
            if (this._currentEditor === editor) {
                this._reposition();
            }
        });

        // hide when the editor loses focus, unless focus moved into the bubble
        editorElem.addEventListener("blur", () => {
            setTimeout(() => {
                if (this._currentEditor !== editor) {
                    return;
                }
                if (this._bubbleEl && !this._bubbleEl.contains(document.activeElement)) {
                    this._hide();
                }
            }, 100);
        });

        // hide on outside click
        document.addEventListener("mousedown", (e) => {
            if (this._currentEditor !== editor) {
                return;
            }
            if (this._bubbleEl && this._bubbleEl.contains(e.target)) {
                return;
            }
            if (editorElem.contains(e.target)) {
                return;
            }
            this._hide();
        }, true);
    },

    /**
     * Selection change handler scoped to a single editor.
     * Shows the bubble if there is a non-empty selection inside this editor;
     * hides it otherwise.
     * @param {object} editor - The editor whose selection state is checked.
     */
    _onSelectionChange: function(editor) {
        const editorElem = editor.getEditorElement();
        const sel = window.getSelection();

        if (!sel || sel.rangeCount === 0) {
            if (this._currentEditor === editor) {
                this._hide();
            }
            return;
        }
        if (!editorElem.contains(sel.anchorNode)) {
            if (this._currentEditor === editor) {
                this._hide();
            }
            return;
        }
        if (sel.isCollapsed) {
            if (this._currentEditor === editor) {
                this._hide();
            }
            return;
        }
        this._currentEditor = editor;
        this._reposition();
    },

    /**
     * Lazily builds the singleton bubble DOM element.
     */
    _ensureBubble: function() {
        if (this._bubbleEl) {
            return;
        }

        const bubble = document.createElement("div");
        bubble.className = "wx-editor-bubble shadow";
        bubble.setAttribute("role", "toolbar");
        bubble.style.display = "none";
        bubble.style.position = "fixed";
        bubble.style.zIndex = "2150";

        bubble.appendChild(this._makeBtn("fas fa-bold",
            this._i18n("webexpress.webui:editor.bold", "Bold"),
            () => { this._execOnCurrent("bold"); this._reposition(); }));
        bubble.appendChild(this._makeBtn("fas fa-italic",
            this._i18n("webexpress.webui:editor.italic", "Italic"),
            () => { this._execOnCurrent("italic"); this._reposition(); }));
        bubble.appendChild(this._makeBtn("fas fa-underline",
            this._i18n("webexpress.webui:editor.underline", "Underline"),
            () => { this._execOnCurrent("underline"); this._reposition(); }));
        bubble.appendChild(this._makeBtn("fas fa-strikethrough",
            this._i18n("webexpress.webui:editor.strike", "Strike"),
            () => { this._execOnCurrent("strikeThrough"); this._reposition(); }));

        const sep = document.createElement("span");
        sep.className = "wx-editor-bubble-sep";
        bubble.appendChild(sep);

        bubble.appendChild(this._makeBtn("fas fa-link",
            this._i18n("webexpress.webui:editor.insert.link", "Insert Link"),
            () => { this._openLinkDialog(); }));

        bubble.appendChild(this._makeBtn("fas fa-eraser",
            this._i18n("webexpress.webui:editor.clearformat", "Clear Format"),
            () => { this._execOnCurrent("removeFormat"); this._reposition(); }));

        document.body.appendChild(bubble);
        this._bubbleEl = bubble;
    },

    /**
     * Builds a single toolbar button for the bubble.
     * @param {string} icon - FontAwesome class.
     * @param {string} title - Tooltip / aria-label.
     * @param {Function} onActivate - Click handler.
     * @returns {HTMLButtonElement}
     */
    _makeBtn: function(icon, title, onActivate) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "wx-editor-bubble-btn";
        b.title = title;
        b.setAttribute("aria-label", title);
        b.innerHTML = `<i class="${icon}"></i>`;
        // prevent focus loss so the selection stays alive AND capture the live
        // selection so editor.execCommand has an up-to-date _savedRange. Without
        // this the editor falls back to the stale (or null) saved range and
        // formatting is applied to the wrong text.
        b.addEventListener("mousedown", (e) => {
            e.preventDefault();
            if (this._currentEditor && typeof this._currentEditor._saveCurrentSelection === "function") {
                this._currentEditor._saveCurrentSelection();
            }
        });
        b.addEventListener("click", onActivate);
        return b;
    },

    /**
     * Executes a document command on the current editor and refreshes button states.
     * @param {string} cmd - Command name.
     */
    _execOnCurrent: function(cmd) {
        if (!this._currentEditor) {
            return;
        }
        this._currentEditor.execCommand(cmd);
    },

    /**
     * Opens the link dialog through the media plugin if present, otherwise via a prompt.
     */
    _openLinkDialog: function() {
        const editor = this._currentEditor;
        if (!editor) {
            return;
        }
        editor._saveCurrentSelection?.();
        const media = (webexpress.webui.EditorPlugins.getAll() || []).find(p => p && p.linkModal !== undefined);
        if (media && typeof media._openModal === "function") {
            const range = editor._savedRange?.cloneRange?.() || null;
            const selectedText = window.getSelection()?.toString() || "";
            media._openModal(editor, "linkModal", "editor-link", "webexpress.webui:editor.insert.link.title",
                { url: "", text: selectedText }, range);
        } else {
            const url = prompt(this._i18n("webexpress.webui:editor.link.url.label", "URL"));
            if (url) {
                editor.execCommand("createLink", url);
            }
        }
        this._hide();
    },

    /**
     * Hides the bubble.
     */
    _hide: function() {
        if (this._bubbleEl) {
            this._bubbleEl.style.display = "none";
        }
    },

    /**
     * Positions the bubble below the current selection. Always below — never flipped.
     * Clamps against the viewport bottom when there is not enough room.
     */
    _reposition: function() {
        if (!this._bubbleEl || !this._currentEditor) {
            return;
        }
        const editorElem = this._currentEditor.getEditorElement();
        const sel = window.getSelection();

        if (!sel || sel.rangeCount === 0) { this._hide(); return; }
        if (sel.isCollapsed) { this._hide(); return; }
        if (!editorElem.contains(sel.anchorNode)) { this._hide(); return; }

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (!rect || (!rect.width && !rect.height)) { this._hide(); return; }

        this._bubbleEl.style.display = "flex";
        const bRect = this._bubbleEl.getBoundingClientRect();
        const margin = 8;

        // horizontal: centered on selection, clamped to viewport
        let left = rect.left + rect.width / 2 - bRect.width / 2;
        left = Math.max(margin, Math.min(window.innerWidth - bRect.width - margin, left));

        // vertical: ALWAYS below the selection; never flipped
        let top = rect.bottom + margin;
        if (top + bRect.height > window.innerHeight - margin) {
            top = Math.max(margin, window.innerHeight - bRect.height - margin);
        }

        this._bubbleEl.style.left = left + "px";
        this._bubbleEl.style.top = top + "px";

        this._syncButtonStates();
    },

    /**
     * Reflects the active formatting state (bold / italic / ...) on the toolbar buttons.
     */
    _syncButtonStates: function() {
        if (!this._bubbleEl) {
            return;
        }
        this._bubbleEl.querySelectorAll(".wx-editor-bubble-btn").forEach((btn) => {
            const icon = btn.querySelector("i");
            if (!icon) return;
            let cmd = null;
            if (icon.classList.contains("fa-bold")) cmd = "bold";
            else if (icon.classList.contains("fa-italic")) cmd = "italic";
            else if (icon.classList.contains("fa-underline")) cmd = "underline";
            else if (icon.classList.contains("fa-strikethrough")) cmd = "strikeThrough";
            if (cmd) {
                try {
                    btn.classList.toggle("active", document.queryCommandState(cmd));
                } catch (_) { /* noop */ }
            }
        });
    }
});