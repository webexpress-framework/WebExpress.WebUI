/**
 * Plugin for the floating bubble menu.
 *
 * The bubble has two parts that appear depending on the current selection:
 *  - a formatting section (bold, italic, underline, strike, link, clear) shown
 *    whenever there is a non-empty text selection, and
 *  - a context section (a single "more actions" button opening a flyout) shown
 *    whenever the caret/selection sits on a context-aware element: a table
 *    cell, an add-on, an instruction text, an image or a link. The flyout is
 *    fed from the plugins' getContextMenuItems(), so every plugin that exposes
 *    context commands automatically contributes its specific commands.
 *
 * Positioning rule: the bubble is always placed BELOW the selection (or below
 * the context element when the selection is collapsed). It is clamped against
 * the viewport bottom but never flipped above.
 */
webexpress.webui.EditorPlugins.register("bubble", 5000, {
    _bubbleEl: null,
    _flyoutEl: null,
    _currentEditor: null,
    _contextTarget: null,

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
                const active = document.activeElement;
                if (this._bubbleEl && this._bubbleEl.contains(active)) {
                    return;
                }
                if (this._flyoutEl && this._flyoutEl.contains(active)) {
                    return;
                }
                this._hide();
            }, 150);
        });

        // hide on outside click
        document.addEventListener("mousedown", (e) => {
            if (this._currentEditor !== editor) {
                return;
            }
            if (this._bubbleEl && this._bubbleEl.contains(e.target)) {
                return;
            }
            if (this._flyoutEl && this._flyoutEl.contains(e.target)) {
                return;
            }
            if (editorElem.contains(e.target)) {
                return;
            }
            this._hide();
        }, true);
    },

    /**
     * Selection change handler scoped to a single editor. Decides whether the
     * bubble should be visible (text selection and/or context element) and, if
     * so, rebuilds and positions it.
     * @param {object} editor - The editor whose selection state is checked.
     */
    _onSelectionChange: function(editor) {
        // while the context flyout is open the user is interacting with the
        // menu (some plugin actions move the selection); don't rebuild or hide.
        if (this._flyoutEl) {
            return;
        }
        const state = this._computeState(editor);
        if (!state) {
            if (this._currentEditor === editor) {
                this._hide();
            }
            return;
        }
        this._currentEditor = editor;
        this._rebuild(editor, state);
        this._position(state.rect);
        this._syncButtonStates();
    },

    /**
     * Computes the bubble state for the editor that owns the current selection.
     * @param {object} editor - The editor instance.
     * @returns {{hasSelection:boolean, hasContext:boolean, rect:DOMRect, target:HTMLElement}|null}
     */
    _computeState: function(editor) {
        const editorElem = editor.getEditorElement();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            return null;
        }
        if (!editorElem.contains(sel.anchorNode)) {
            return null;
        }

        const range = sel.getRangeAt(0);
        const hasSelection = !sel.isCollapsed && (range.toString() || "").trim().length > 0;

        const target = this._resolveTarget(sel);
        const contextEl = this._contextElement(editor, target);
        const hasContext = !!contextEl;

        if (!hasSelection && !hasContext) {
            return null;
        }

        let rect = null;
        if (hasSelection) {
            rect = range.getBoundingClientRect();
        }
        if ((!rect || (!rect.width && !rect.height)) && contextEl) {
            rect = contextEl.getBoundingClientRect();
        }
        if (!rect || (!rect.width && !rect.height)) {
            return null;
        }

        this._contextTarget = target;
        return { hasSelection: hasSelection, hasContext: hasContext, rect: rect, target: target };
    },

    /**
     * Resolves the element a selection points at, handling inline atomics
     * (instruction text, date controls, inline add-ons) that are selected as a
     * whole: in that case the anchor is the parent with an offset bracketing the
     * atomic, so we inspect the adjacent child nodes.
     * @param {Selection} sel - The current selection.
     * @returns {HTMLElement|null}
     */
    _resolveTarget: function(sel) {
        let node = sel.anchorNode;
        if (!node) {
            return null;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const kids = node.childNodes;
            const candidates = [kids[sel.anchorOffset], kids[sel.anchorOffset - 1]];
            for (const c of candidates) {
                if (c && c.nodeType === Node.ELEMENT_NODE) {
                    return c;
                }
            }
            return node;
        }
        return node.parentElement;
    },

    /**
     * Returns the nearest context-aware element for the given target, or null.
     * This detection is intentionally side-effect free (unlike some plugins'
     * getContextMenuItems) so it is safe to run on every selection change.
     * @param {object} editor - The editor instance.
     * @param {HTMLElement} target - The element at the selection anchor.
     * @returns {HTMLElement|null}
     */
    _contextElement: function(editor, target) {
        if (!target || !target.closest) {
            return null;
        }
        const root = editor.getEditorElement();
        const candidates = [
            target.closest("td, th"),
            target.closest(".wx-editor-instruction"),
            target.closest(".wx-editor-date"),
            target.closest("[data-addon-id]"),
            target.tagName === "IMG" ? target : null,
            target.closest("a")
        ];
        for (const c of candidates) {
            if (c && root.contains(c)) {
                return c;
            }
        }
        return null;
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

        // clicking anywhere in the bubble must not steal the editor selection
        bubble.addEventListener("mousedown", (e) => {
            if (!e.target.closest("input, textarea, select")) {
                e.preventDefault();
            }
        });

        document.body.appendChild(bubble);
        this._bubbleEl = bubble;
    },

    /**
     * (Re)builds the bubble content for the current state.
     * @param {object} editor - The editor instance.
     * @param {object} state - The computed bubble state.
     */
    _rebuild: function(editor, state) {
        const bubble = this._bubbleEl;
        bubble.innerHTML = "";

        if (state.hasSelection) {
            bubble.appendChild(this._makeBtn("bold",
                this._i18n("webexpress.webui:editor.bold", "Bold"),
                () => { this._execOnCurrent("bold"); this._reposition(); }));
            bubble.appendChild(this._makeBtn("italic",
                this._i18n("webexpress.webui:editor.italic", "Italic"),
                () => { this._execOnCurrent("italic"); this._reposition(); }));
            bubble.appendChild(this._makeBtn("underline",
                this._i18n("webexpress.webui:editor.underline", "Underline"),
                () => { this._execOnCurrent("underline"); this._reposition(); }));
            bubble.appendChild(this._makeBtn("strikethrough",
                this._i18n("webexpress.webui:editor.strike", "Strike"),
                () => { this._execOnCurrent("strikeThrough"); this._reposition(); }));
            bubble.appendChild(this._makeSep());
            bubble.appendChild(this._makeBtn("link",
                this._i18n("webexpress.webui:editor.insert.link", "Insert Link"),
                () => { this._openLinkDialog(); }));
            bubble.appendChild(this._makeBtn("eraser",
                this._i18n("webexpress.webui:editor.clearformat", "Clear Format"),
                () => { this._execOnCurrent("removeFormat"); this._reposition(); }));
        }

        if (state.hasContext) {
            if (state.hasSelection) {
                bubble.appendChild(this._makeSep());
            }
            const ctxBtn = this._makeBtn("more",
                this._i18n("webexpress.webui:editor.actions", "Actions"),
                () => this._toggleFlyout(editor, state.target));
            ctxBtn.classList.add("wx-editor-bubble-context-btn");
            bubble.appendChild(ctxBtn);
        }
    },

    /**
     * Builds a single toolbar button for the bubble.
     * @param {string} icon - Symbolic icon name.
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
        b.innerHTML = `<i class="${webexpress.webui.IconSet.resolve(icon)}"></i>`;
        // keep the editor selection alive and up to date for execCommand
        b.addEventListener("mousedown", (e) => {
            e.preventDefault();
            if (this._currentEditor && typeof this._currentEditor._saveCurrentSelection === "function") {
                this._currentEditor._saveCurrentSelection();
            }
        });
        b.addEventListener("click", (e) => {
            e.preventDefault();
            onActivate();
        });
        return b;
    },

    /**
     * Creates a vertical separator for the bubble.
     * @returns {HTMLElement}
     */
    _makeSep: function() {
        const sep = document.createElement("span");
        sep.className = "wx-editor-bubble-sep";
        return sep;
    },

    /**
     * Executes a document command on the current editor.
     * @param {string} cmd - Command name.
     */
    _execOnCurrent: function(cmd) {
        if (!this._currentEditor) {
            return;
        }
        this._currentEditor.execCommand(cmd);
    },

    // ------------------------------------------------------------------
    // Context flyout
    // ------------------------------------------------------------------

    /**
     * Toggles the context flyout, (re)building it from the plugins'
     * getContextMenuItems for the current target.
     * @param {object} editor - The editor instance.
     * @param {HTMLElement} target - The element at the selection anchor.
     */
    _toggleFlyout: function(editor, target) {
        if (this._flyoutEl && this._flyoutEl.style.display !== "none") {
            this._closeFlyout();
            return;
        }
        const items = this._collectContextItems(editor, target || this._contextTarget);
        if (!items.length) {
            return;
        }
        this._openFlyout(editor, items);
    },

    /**
     * Collects context menu items from every plugin that exposes them. A
     * separator is inserted between groups contributed by different plugins.
     * @param {object} editor - The editor instance.
     * @param {HTMLElement} target - The context target element.
     * @returns {Array<object>}
     */
    _collectContextItems: function(editor, target) {
        const plugins = webexpress.webui.EditorPlugins.getAll() || [];
        let items = [];
        plugins.forEach((p) => {
            if (typeof p.getContextMenuItems !== "function") {
                return;
            }
            let got = [];
            try {
                got = p.getContextMenuItems(editor, target) || [];
            } catch (_) {
                got = [];
            }
            if (got.length) {
                if (items.length) {
                    items.push({ separator: true });
                }
                items = items.concat(got);
            }
        });
        return items;
    },

    /**
     * Builds and shows the context flyout below the bubble.
     * @param {object} editor - The editor instance.
     * @param {Array<object>} items - Context menu descriptors.
     */
    _openFlyout: function(editor, items) {
        this._closeFlyout();

        const menu = document.createElement("div");
        menu.className = "wx-editor-bubble-menu shadow";
        menu.style.position = "fixed";
        menu.style.zIndex = "2160";

        menu.addEventListener("mousedown", (e) => {
            if (!e.target.closest("input, textarea, select, label")) {
                e.preventDefault();
            }
        });

        items.forEach((item) => this._renderFlyoutItem(menu, item, editor));

        document.body.appendChild(menu);
        this._flyoutEl = menu;
        this._positionFlyout();
    },

    /**
     * Renders a single context menu item into the flyout.
     * @param {HTMLElement} menu - The flyout container.
     * @param {object} item - The item descriptor.
     * @param {object} editor - The editor instance.
     */
    _renderFlyoutItem: function(menu, item, editor) {
        if (!item) {
            return;
        }
        if (item.separator) {
            const div = document.createElement("div");
            div.className = "wx-editor-bubble-menu-divider";
            menu.appendChild(div);
            return;
        }
        if (item.type === "custom-element" && item.element) {
            const wrap = document.createElement("div");
            wrap.className = "wx-editor-bubble-menu-custom";
            wrap.appendChild(item.element);
            // land inside the open palette (e.g. the colour row) when nested
            const host = menu._activePalette || menu;
            host.appendChild(wrap);
            return;
        }
        if (item.type === "color") {
            const swatch = document.createElement("button");
            swatch.type = "button";
            swatch.className = "wx-editor-bubble-swatch";
            swatch.style.backgroundColor = item.value;
            swatch.title = item.value;
            swatch.addEventListener("click", (e) => {
                e.preventDefault();
                this._runAction(editor, item.action);
            });
            // colors render into the most recently opened palette row, or the menu
            const host = menu._activePalette || menu;
            host.appendChild(swatch);
            return;
        }
        if (item.submenu && item.submenu.length) {
            const row = this._makeFlyoutRow(item.label, item.icon);
            const palette = document.createElement("div");
            palette.className = "wx-editor-bubble-menu-palette";
            if (item.submenuClass) {
                palette.classList.add(item.submenuClass);
            }
            palette.style.display = "none";
            // capture the palette so nested color/custom items land inside it
            const prev = menu._activePalette;
            menu._activePalette = palette;
            item.submenu.forEach((sub) => this._renderFlyoutItem(menu, sub, editor));
            menu._activePalette = prev;
            row.addEventListener("click", (e) => {
                e.preventDefault();
                palette.style.display = palette.style.display === "none" ? "flex" : "none";
                this._positionFlyout();
            });
            menu.appendChild(row);
            menu.appendChild(palette);
            return;
        }

        // normal action item
        const row = this._makeFlyoutRow(item.label, item.icon);
        row.addEventListener("click", (e) => {
            e.preventDefault();
            this._runAction(editor, item.action);
        });
        menu.appendChild(row);
    },

    /**
     * Creates a clickable flyout row with an optional icon.
     * @param {string} label - The row label.
     * @param {string} icon - Optional icon reference.
     * @returns {HTMLButtonElement}
     */
    _makeFlyoutRow: function(label, icon) {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "wx-editor-bubble-menu-item";
        if (icon) {
            const i = document.createElement("i");
            i.className = webexpress.webui.IconSet.resolve(icon);
            row.appendChild(i);
        }
        const span = document.createElement("span");
        span.textContent = label || "";
        row.appendChild(span);
        return row;
    },

    /**
     * Runs a context action and keeps the editor state (value, history) in sync.
     * Several plugin actions mutate the dom without syncing, so we sync here.
     * @param {object} editor - The editor instance.
     * @param {Function} action - The action callback.
     */
    _runAction: function(editor, action) {
        if (typeof action === "function") {
            try {
                action();
            } catch (err) {
                console.warn("bubble context action failed", err);
            }
        }
        this._closeFlyout();
        if (editor && typeof editor._syncValue === "function") {
            editor._syncValue();
        }
        if (editor && typeof editor._updateUndoRedoStates === "function") {
            editor._updateUndoRedoStates();
        }
        this._reposition();
    },

    /**
     * Positions the flyout directly below the bubble.
     */
    _positionFlyout: function() {
        if (!this._flyoutEl || !this._bubbleEl) {
            return;
        }
        const bRect = this._bubbleEl.getBoundingClientRect();
        const fRect = this._flyoutEl.getBoundingClientRect();
        const margin = 8;

        let left = bRect.left;
        left = Math.max(margin, Math.min(window.innerWidth - fRect.width - margin, left));

        let top = bRect.bottom + 4;
        if (top + fRect.height > window.innerHeight - margin) {
            const alt = bRect.top - fRect.height - 4;
            top = alt > margin ? alt : Math.max(margin, window.innerHeight - fRect.height - margin);
        }

        this._flyoutEl.style.left = left + "px";
        this._flyoutEl.style.top = top + "px";
    },

    /**
     * Closes and removes the context flyout.
     */
    _closeFlyout: function() {
        if (this._flyoutEl && this._flyoutEl.parentNode) {
            this._flyoutEl.parentNode.removeChild(this._flyoutEl);
        }
        this._flyoutEl = null;
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
     * Hides the bubble and its flyout.
     */
    _hide: function() {
        this._closeFlyout();
        if (this._bubbleEl) {
            this._bubbleEl.style.display = "none";
        }
    },

    /**
     * Recomputes the state and repositions the bubble; hides it when nothing
     * applies anymore.
     */
    _reposition: function() {
        if (!this._bubbleEl || !this._currentEditor) {
            return;
        }
        const state = this._computeState(this._currentEditor);
        if (!state) {
            this._hide();
            return;
        }
        this._position(state.rect);
        this._positionFlyout();
        this._syncButtonStates();
    },

    /**
     * Positions the bubble below the given rect. Always below - never flipped.
     * @param {DOMRect} rect - The anchor rectangle (selection or context element).
     */
    _position: function(rect) {
        if (!this._bubbleEl || !rect) {
            return;
        }
        this._bubbleEl.style.display = "flex";
        const bRect = this._bubbleEl.getBoundingClientRect();
        const margin = 8;

        let left = rect.left + rect.width / 2 - bRect.width / 2;
        left = Math.max(margin, Math.min(window.innerWidth - bRect.width - margin, left));

        let top = rect.bottom + margin;
        if (top + bRect.height > window.innerHeight - margin) {
            top = Math.max(margin, window.innerHeight - bRect.height - margin);
        }

        this._bubbleEl.style.left = left + "px";
        this._bubbleEl.style.top = top + "px";
    },

    /**
     * Reflects the active formatting state (bold / italic / ...) on the toolbar buttons.
     */
    _syncButtonStates: function() {
        if (!this._bubbleEl || !this._currentEditor) {
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
                    btn.classList.toggle("active", this._currentEditor.queryCommandState(cmd));
                } catch (_) { /* noop */ }
            }
        });
    }
});
