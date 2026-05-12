/**
 * Placeholder plugin.
 *
 * Displays a low-contrast hint inside every empty block of the editor (the
 * first block always, others when focused on them). Mirrors the slash-command
 * affordance: "Type / for commands" by default.
 *
 * Reads the hint from data-placeholder on the editor host element when given,
 * falling back to an i18n key.
 *
 * Implemented entirely via CSS via the data-empty="true" attribute that this
 * plugin writes onto empty blocks on every input/selectionchange.
 */
webexpress.webui.EditorPlugins.register("placeholder", 70, (function () {

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
     * Returns whether a block is visually "empty" — no text and no embedded
     * content (images, addons, br-only). Treats `<br>` as empty.
     * @param {HTMLElement} block
     * @returns {boolean}
     */
    function isBlockEmpty(block) {
        if (!block) return false;
        const text = (block.textContent || "").trim();
        if (text.length) return false;
        // any non-br element with content counts as not-empty
        for (const child of block.children) {
            if (child.tagName !== "BR" && child.tagName !== "SPAN") return false;
            if (child.tagName === "SPAN" && child.textContent.trim().length) return false;
        }
        return true;
    }

    return {
        /**
         * Plugin init hook. Attaches an attribute-syncing routine that paints
         * the data-empty marker onto every empty block.
         * @param {Object} editor
         */
        init: function (editor) {
            const editorElem = editor.getEditorElement();
            const host = editor._uiContainer || editorElem;

            // resolve placeholder text once
            const hint = host?.dataset?.placeholder
                || t("webexpress.webui:editor.placeholder", "Type / for commands");
            editorElem.setAttribute("data-placeholder", hint);

            /**
             * Walks every block child of the editor and toggles `data-empty`.
             */
            function refresh() {
                const blocks = editorElem.children;
                let activeBlock = null;
                const sel = window.getSelection();
                if (sel && sel.rangeCount && editorElem.contains(sel.anchorNode)) {
                    let node = sel.getRangeAt(0).startContainer;
                    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
                    const b = node?.closest?.("p, h1, h2, h3, h4, h5, h6, blockquote, pre, li, div");
                    if (b && editorElem.contains(b) && b !== editorElem) activeBlock = b;
                }
                for (const b of blocks) {
                    // skip non-editable embeds (addon frames, tables)
                    if (b.getAttribute("contenteditable") === "false") {
                        b.removeAttribute("data-empty");
                        continue;
                    }
                    if (isBlockEmpty(b)) {
                        // show placeholder on first block always, or on currently-active block
                        const show = (b === blocks[0]) || (b === activeBlock);
                        b.toggleAttribute("data-empty", !!show);
                    } else {
                        b.removeAttribute("data-empty");
                    }
                }
            }

            // initial paint, then on every relevant event
            refresh();
            editorElem.addEventListener("input", refresh);
            editorElem.addEventListener("focus", refresh);
            editorElem.addEventListener("blur", refresh);
            document.addEventListener("selectionchange", () => {
                // only react if our editor has focus / selection lives inside
                const sel = window.getSelection();
                if (sel && sel.rangeCount && editorElem.contains(sel.anchorNode)) refresh();
            });
        }
    };
})());