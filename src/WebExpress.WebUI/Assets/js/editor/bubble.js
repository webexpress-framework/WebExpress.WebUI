/**
 * Bubble-menu plugin.
 *
 * Displays a floating mini-toolbar above any non-empty text selection inside
 * the editor. Provides quick access to bold/italic/underline/strike, a link
 * action, and clear-format. The bubble follows the selection on scroll/resize.
 */
webexpress.webui.EditorPlugins.register("bubble", 60, (function () {

    /**
     * Translation helper.
     * @param {string} key
     * @param {string} fallback
     * @returns {string}
     */
    function t(key, fallback) {
        return webexpress?.webui?.I18N?.translate?.(key) ?? fallback;
    }

    /**
     * Builds a single toolbar button.
     * @param {string} icon FontAwesome icon class.
     * @param {string} title Tooltip / aria-label.
     * @param {Function} onActivate
     * @returns {HTMLButtonElement}
     */
    function makeBtn(icon, title, onActivate) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "wx-editor-bubble-btn";
        b.title = title;
        b.setAttribute("aria-label", title);
        b.innerHTML = `<i class="${icon}"></i>`;
        b.addEventListener("mousedown", (e) => e.preventDefault()); // keep selection
        b.addEventListener("click", onActivate);
        return b;
    }

    return {
        /**
         * Plugin init hook. Builds the bubble element once per editor and wires
         * selection tracking on the editor's contenteditable area.
         * @param {Object} editor
         */
        init: function (editor) {
            const editorElem = editor.getEditorElement();

            // ---- build bubble element ----
            const bubble = document.createElement("div");
            bubble.className = "wx-editor-bubble shadow";
            bubble.setAttribute("role", "toolbar");
            bubble.style.display = "none";
            bubble.style.position = "fixed";
            bubble.style.zIndex = "2150";

            bubble.appendChild(makeBtn("fas fa-bold", t("webexpress.webui:editor.bold", "Bold"),
                () => { editor.execCommand("bold"); reposition(); }));
            bubble.appendChild(makeBtn("fas fa-italic", t("webexpress.webui:editor.italic", "Italic"),
                () => { editor.execCommand("italic"); reposition(); }));
            bubble.appendChild(makeBtn("fas fa-underline", t("webexpress.webui:editor.underline", "Underline"),
                () => { editor.execCommand("underline"); reposition(); }));
            bubble.appendChild(makeBtn("fas fa-strikethrough", t("webexpress.webui:editor.strike", "Strike"),
                () => { editor.execCommand("strikeThrough"); reposition(); }));

            // separator
            const sep = document.createElement("span");
            sep.className = "wx-editor-bubble-sep";
            bubble.appendChild(sep);

            // link via media plugin if available; otherwise via createLink
            bubble.appendChild(makeBtn("fas fa-link", t("webexpress.webui:editor.insert.link", "Insert Link"),
                () => {
                    editor._saveCurrentSelection?.();
                    const media = (webexpress.webui.EditorPlugins.getAll() || []).find(p => p && p.linkModal !== undefined);
                    if (media && typeof media._openModal === "function") {
                        const range = editor._savedRange?.cloneRange?.() || null;
                        media._openModal(editor, "linkModal", "editor-link", "webexpress.webui:editor.insert.link.title", { url: "", text: window.getSelection()?.toString() || "" }, range);
                    } else {
                        const url = prompt(t("webexpress.webui:editor.link.url.label", "URL"));
                        if (url) editor.execCommand("createLink", url);
                    }
                    hide();
                }));

            bubble.appendChild(makeBtn("fas fa-eraser", t("webexpress.webui:editor.clearformat", "Clear Format"),
                () => { editor.execCommand("removeFormat"); reposition(); }));

            document.body.appendChild(bubble);

            // ---- state-tracking helpers ----

            /**
             * Hides the bubble.
             */
            function hide() {
                bubble.style.display = "none";
            }

            /**
             * Shows and positions the bubble above the current text selection.
             * No-op if there is no editable text-selection inside this editor.
             */
            function reposition() {
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) { hide(); return; }
                if (sel.isCollapsed) { hide(); return; }

                const anchor = sel.anchorNode;
                if (!anchor || !editorElem.contains(anchor)) { hide(); return; }

                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                if (!rect || (!rect.width && !rect.height)) { hide(); return; }

                bubble.style.display = "flex";
                // measure after making visible
                const bRect = bubble.getBoundingClientRect();
                const margin = 8;
                let left = Math.max(margin, Math.min(window.innerWidth - bRect.width - margin, rect.left + rect.width / 2 - bRect.width / 2));
                let top = rect.top - bRect.height - margin;
                if (top < margin) {
                    // place below if not enough room above
                    top = rect.bottom + margin;
                }
                bubble.style.left = left + "px";
                bubble.style.top = top + "px";

                // sync toggle states (bold/italic/...)
                bubble.querySelectorAll(".wx-editor-bubble-btn").forEach((btn) => {
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

            // ---- event wiring ----

            // Track selection changes globally but only react when our editor has focus
            const selHandler = () => {
                // micro-delay so collapse-after-click happens first
                setTimeout(() => {
                    const sel = window.getSelection();
                    if (!sel || !sel.rangeCount) { hide(); return; }
                    if (!editorElem.contains(sel.anchorNode)) { hide(); return; }
                    if (sel.isCollapsed) { hide(); return; }
                    reposition();
                }, 0);
            };
            document.addEventListener("selectionchange", selHandler);
            window.addEventListener("scroll", reposition, true);
            window.addEventListener("resize", reposition);

            // Hide on blur unless focus moves into the bubble itself
            editorElem.addEventListener("blur", () => {
                setTimeout(() => {
                    if (!bubble.contains(document.activeElement)) hide();
                }, 100);
            });

            // Hide on outside clicks
            document.addEventListener("mousedown", (e) => {
                if (bubble.contains(e.target)) return;
                if (editorElem.contains(e.target)) return;
                hide();
            }, true);
        }
    };
})());