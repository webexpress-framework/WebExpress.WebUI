/**
 * Plugin that powers the editor's inline shortcut surfaces:
 *  - the slash-command palette (`/`)
 *  - the inline triggers `@` (mention), `[[` (link), `{{` (AddOn)
 *  - block-level markdown patterns (# , ## , > , ``` , - , * , 1. , --- )
 *  - inline markdown patterns (**bold**, *italic*, _italic_, ~~strike~~, `code`)
 *
 * Slash menu entries come from `webexpress.webui.EditorShortcuts`. The plugin
 * is registered as a normal editor plugin at a late position so its keydown
 * listener observes events after the core editor handler runs.
 */
webexpress.webui.EditorPlugins.register("shortcut", 6000, {
    _popup: null,
    _searchInput: null,
    _listEl: null,
    _items: [],
    _activeIndex: -1,
    _currentEditor: null,
    _anchorRange: null,
    _slashNode: null,
    _slashOffset: -1,
    _slashBlock: null,
    _mentionState: null,
    _mentionPopup: null,
    _docClickHandler: null,

    /**
     * Translation helper.
     * @param {string} key - The i18n key.
     * @param {string} fallback - Fallback text used when no translation is found.
     * @returns {string}
     */
    _i18n: function(key, fallback) {
        return webexpress?.webui?.I18N?.translate?.(key) ?? fallback;
    },

    /**
     * Plugin init hook. Wires the keydown / input handlers that drive the
     * slash menu, inline triggers and markdown shortcuts. The popup DOM is
     * built lazily on first use.
     * @param {object} editor - The editor instance.
     */
    init: function(editor) {
        const editorElem = editor.getEditorElement();

        editorElem.addEventListener("keydown", (e) => this._onKeyDown(editor, e));
        editorElem.addEventListener("input", (e) => this._onInput(editor, e));
        editorElem.addEventListener("blur", () => {
            // close on blur, but allow clicks inside the popup to win
            setTimeout(() => {
                if (this._popup && this._popup.contains(document.activeElement)) {
                    return;
                }
                this._closeSlashMenu();
            }, 100);
        });

        if (!this._docClickHandler) {
            this._docClickHandler = (e) => {
                if (this._popup && this._popup.style.display !== "none") {
                    if (!this._popup.contains(e.target)) {
                        this._closeSlashMenu();
                    }
                }
                if (this._mentionPopup && this._mentionPopup.style.display !== "none") {
                    if (!this._mentionPopup.contains(e.target)) {
                        this._closeMentionMenu();
                    }
                }
            };
            document.addEventListener("mousedown", this._docClickHandler, true);
        }
    },

    /**
     * keydown router: handles slash-menu navigation, inline-trigger key combos
     * and forwards markdown patterns on space.
     * @param {object} editor
     * @param {KeyboardEvent} e
     */
    _onKeyDown: function(editor, e) {
        // mention menu is active
        if (this._mentionPopup && this._mentionPopup.style.display !== "none" && this._mentionState && this._mentionState.editor === editor) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                this._moveMentionActive(1);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                this._moveMentionActive(-1);
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                this._activateMention();
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                this._closeMentionMenu();
                return;
            }
        }

        // markdown block patterns react on Space at the very start of a line
        if (e.key === " " || e.code === "Space") {
            // run AFTER the space is inserted so the pattern is observable
            // but we don't need preventDefault here — patterns rewrite the line
        }
    },

    /**
     * input router: opens the slash menu, handles `@`, `[[`, `{{` triggers,
     * filters an open palette and applies markdown patterns.
     * @param {object} editor
     * @param {InputEvent} e
     */
    _onInput: function(editor, e) {
        // if mention menu is open, update its query
        if (this._mentionPopup && this._mentionPopup.style.display !== "none" && this._mentionState && this._mentionState.editor === editor) {
            this._updateMentionQuery();
            return;
        }

        const inputType = e.inputType || "";

        // detect a freshly typed character — most reliable across browsers
        if (inputType === "insertText" || inputType === "insertCompositionText" || inputType === "" || !inputType) {
            const data = e.data;

            if (data === "/") {
                if (this._consumeDoubleTrigger(editor, "/")) {
                    return;
                }
            }

            if (data === "@") {
                const host = editor._uiContainer || editor.getEditorElement();
                const uri = host?.dataset?.mentionUri || "";
                if (uri) {
                    this._openMentionMenu(editor, uri);
                    return;
                }
            }

            // detect [[ and {{ — both characters are eaten and the dialog opens
            if (data === "[" || data === "{") {
                if (this._consumeDoubleTrigger(editor, data)) {
                    return;
                }
            }

            // markdown: block patterns on Space, inline patterns on Space
            if (data === " ") {
                this._applyMarkdownBlock(editor);
                this._applyMarkdownInline(editor);
            }
        }
    },

    // ------------------------------------------------------------------
    // Slash menu
    // ------------------------------------------------------------------

    /**
     * Returns whether the caret sits at the very beginning of an empty block.
     * @param {object} editor
     * @returns {boolean}
     */
    _isAtBlockStart: function(editor) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return false;
        const editorElem = editor.getEditorElement();
        if (!editorElem.contains(range.startContainer)) return false;

        // walk up to the block parent
        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }
        const block = node?.closest?.("p, h1, h2, h3, h4, h5, h6, blockquote, pre, li, div");
        if (!block || !editorElem.contains(block) || block === editorElem) return false;

        // strip placeholder span if present
        const clone = block.cloneNode(true);
        clone.querySelectorAll(".wx-editor-placeholder").forEach((el) => el.remove());

        // the only typed character should be the leading `/`
        const text = (clone.textContent || "").replace(/ /g, " ");
        return text === "/" || text.trimStart() === "/";
    },

    /**
     * Opens the slash command palette anchored to the caret.
     * @param {object} editor
     */
    _openSlashMenu: function(editor) {
        this._ensurePopup();
        this._currentEditor = editor;

        // remember where the slash was typed so we can replace it on commit.
        // we also capture the parent block, because the easiest way to clean
        // up reliably (regardless of where focus lands) is to wipe the block
        // — the menu only opens at the start of an otherwise empty block.
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
            const r = sel.getRangeAt(0);
            this._slashNode = r.startContainer;
            this._slashOffset = r.startOffset - 1; // the slash sits just before the caret
            if (this._slashOffset < 0) this._slashOffset = 0;
            this._anchorRange = r.cloneRange();

            // find the enclosing block (closest p / h* / li / blockquote / pre / div)
            let n = r.startContainer;
            if (n.nodeType === Node.TEXT_NODE) n = n.parentElement;
            const block = n?.closest?.("p, h1, h2, h3, h4, h5, h6, blockquote, pre, li, div");
            const editorElem = editor.getEditorElement();
            if (block && editorElem.contains(block) && block !== editorElem) {
                this._slashBlock = block;
            } else {
                this._slashBlock = null;
            }
        }

        this._searchInput.value = "";
        this._buildItems("");
        this._render();
        this._positionPopup();
        this._popup.style.display = "block";

        // focus the search field so subsequent typing filters the list
        setTimeout(() => {
            try { this._searchInput.focus(); } catch (_) { /* noop */ }
        }, 0);
    },

    /**
     * Closes the slash menu without applying anything.
     */
    _closeSlashMenu: function() {
        if (this._popup) {
            this._popup.style.display = "none";
        }
        this._items = [];
        this._activeIndex = -1;
        this._anchorRange = null;
        this._slashNode = null;
        this._slashOffset = -1;
        this._slashBlock = null;
    },

    /**
     * Re-runs the filter using the current value of the search input.
     */
    _updateSlashQuery: function() {
        this._buildItems(this._searchInput.value || "");
        this._render();
    },

    /**
     * Builds the popup DOM lazily on first use.
     */
    _ensurePopup: function() {
        if (this._popup) return;

        const popup = document.createElement("div");
        popup.className = "wx-editor-shortcut-popup shadow";
        popup.style.position = "fixed";
        popup.style.display = "none";
        popup.style.zIndex = "2200";
        popup.setAttribute("role", "menu");

        const searchWrap = document.createElement("div");
        searchWrap.className = "wx-editor-shortcut-search";

        const search = document.createElement("input");
        search.type = "text";
        search.className = "form-control form-control-sm";
        search.placeholder = this._i18n("webexpress.webui:editor.slash.search", "Search commands…");
        search.setAttribute("aria-label", search.placeholder);
        searchWrap.appendChild(search);

        const list = document.createElement("div");
        list.className = "wx-editor-shortcut-list";

        popup.appendChild(searchWrap);
        popup.appendChild(list);
        document.body.appendChild(popup);

        this._popup = popup;
        this._searchInput = search;
        this._listEl = list;

        // keep focus inside the popup; clicking items must not steal it
        popup.addEventListener("mousedown", (e) => {
            // don't preventDefault on the input itself so the user can type
            if (e.target !== search) {
                e.preventDefault();
            }
        });

        // typing in the search filters
        search.addEventListener("input", () => this._updateSlashQuery());
        search.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); this._moveActive(1); }
            else if (e.key === "ArrowUp") { e.preventDefault(); this._moveActive(-1); }
            else if (e.key === "Enter") { e.preventDefault(); this._activateCurrent(); }
            else if (e.key === "Escape") { e.preventDefault(); this._closeSlashMenu(); }
        });
    },

    /**
     * Re-filters the registered shortcuts using `q`.
     * @param {string} q
     */
    _buildItems: function(q) {
        const all = (webexpress.webui.EditorShortcuts.getAll() || []).slice();
        const query = (q || "").trim().toLowerCase();

        if (!query) {
            this._items = all;
        } else {
            this._items = all.filter((def) => {
                const hay = [
                    def.label || "",
                    def.description || "",
                    def.id || "",
                    (def.keywords || []).join(" ")
                ].join(" ").toLowerCase();
                return hay.indexOf(query) !== -1;
            });
        }

        this._activeIndex = this._items.length > 0 ? 0 : -1;
    },

    /**
     * Renders the current `_items` into the popup, grouped by category.
     */
    _render: function() {
        this._listEl.innerHTML = "";

        if (this._items.length === 0) {
            const empty = document.createElement("div");
            empty.className = "wx-editor-shortcut-empty";
            empty.textContent = this._i18n("webexpress.webui:editor.slash.empty", "No matches");
            this._listEl.appendChild(empty);
            return;
        }

        // group by category
        const groups = new Map();
        this._items.forEach((def) => {
            const cat = def.category || this._i18n("webexpress.webui:editor.slash.cat.general", "General");
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat).push(def);
        });

        let globalIndex = 0;
        groups.forEach((defs, cat) => {
            const header = document.createElement("div");
            header.className = "wx-editor-shortcut-group";
            header.textContent = cat;
            this._listEl.appendChild(header);

            defs.forEach((def) => {
                const item = this._createItem(def, globalIndex);
                this._listEl.appendChild(item);
                globalIndex++;
            });
        });

        this._highlightActive();
    },

    /**
     * Creates a single shortcut entry.
     * @param {object} def
     * @param {number} index
     * @returns {HTMLElement}
     */
    _createItem: function(def, index) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "wx-editor-shortcut-item";
        item.dataset.index = String(index);

        const icon = document.createElement("i");
        icon.className = def.icon || "fas fa-bolt";
        item.appendChild(icon);

        const body = document.createElement("div");
        body.className = "wx-editor-shortcut-body";

        const label = document.createElement("div");
        label.className = "wx-editor-shortcut-label";
        label.textContent = def.label || def.id || "";
        body.appendChild(label);

        if (def.description) {
            const desc = document.createElement("div");
            desc.className = "wx-editor-shortcut-desc";
            desc.textContent = def.description;
            body.appendChild(desc);
        }

        item.appendChild(body);

        item.addEventListener("mouseenter", () => {
            this._activeIndex = index;
            this._highlightActive();
        });

        item.addEventListener("click", (e) => {
            e.preventDefault();
            this._activeIndex = index;
            this._activateCurrent();
        });

        return item;
    },

    /**
     * Toggles the `active` class on the entry matching `_activeIndex`.
     */
    _highlightActive: function() {
        const items = this._listEl.querySelectorAll(".wx-editor-shortcut-item");
        items.forEach((el) => {
            const idx = parseInt(el.dataset.index, 10);
            el.classList.toggle("active", idx === this._activeIndex);
            if (idx === this._activeIndex) {
                try { el.scrollIntoView({ block: "nearest" }); } catch (_) { /* noop */ }
            }
        });
    },

    /**
     * Moves the active selection by `delta`, wrapping around.
     * @param {number} delta
     */
    _moveActive: function(delta) {
        if (this._items.length === 0) return;
        this._activeIndex = (this._activeIndex + delta + this._items.length) % this._items.length;
        this._highlightActive();
    },

    /**
     * Executes the currently highlighted shortcut.
     */
    _activateCurrent: function() {
        if (this._activeIndex < 0 || this._activeIndex >= this._items.length) return;
        const def = this._items[this._activeIndex];
        const editor = this._currentEditor;
        if (!editor || !def) {
            this._closeSlashMenu();
            return;
        }

        // remove the `/` that triggered the menu first, so commands operate on a clean block
        this._removeSlashTrigger(editor);

        // close the popup before we run the command so the popup can't steal focus
        this._closeSlashMenu();

        // make sure the editor regains focus and selection
        editor.getEditorElement().focus();
        editor._saveCurrentSelection?.();

        this._executeShortcut(editor, def);
    },

    /**
     * Removes the `/` character that triggered the menu. Because the menu
     * only opens in an otherwise empty block, we wipe the block entirely and
     * leave a `<br>` filler — this side-steps any tricky cross-element range
     * arithmetic that comes up when focus has moved to the popup's search
     * field. Selection is then re-anchored at the start of the block so the
     * following execCommand operates in the expected location.
     * @param {object} editor
     */
    _removeSlashTrigger: function(editor) {
        const editorElem = editor.getEditorElement();
        const block = this._slashBlock;
        if (!block || !editorElem.contains(block)) {
            return;
        }

        try {
            while (block.firstChild) {
                block.removeChild(block.firstChild);
            }
            block.appendChild(document.createElement("br"));

            // place caret at the start of the now-empty block
            const range = document.createRange();
            range.selectNodeContents(block);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            // tell the editor about the new selection so execCommand picks it up
            editor._saveCurrentSelection?.();
        } catch (_) {
            // ignore — caret will land somewhere sensible after execution
        }
    },

    /**
     * Executes a shortcut definition against the editor.
     * Supports `execute`, `tag`, `cmd` (+ cmdArg) and `html`.
     * @param {object} editor
     * @param {object} def
     */
    _executeShortcut: function(editor, def) {
        try {
            if (typeof def.execute === "function") {
                def.execute(editor);
                return;
            }
            if (def.tag) {
                editor.execCommand("formatBlock", "<" + def.tag.toLowerCase() + ">");
                return;
            }
            if (def.cmd) {
                editor.execCommand(def.cmd, def.cmdArg !== undefined ? def.cmdArg : null);
                return;
            }
            if (def.html) {
                editor.insertHtmlAtCursor(def.html);
                return;
            }
        } catch (err) {
            console.warn("shortcut execute failed", err);
        }
    },

    /**
     * Positions the popup near the caret without flipping above the viewport.
     */
    _positionPopup: function() {
        if (!this._popup || !this._anchorRange) return;
        const rect = this._anchorRange.getBoundingClientRect();
        const popupRect = this._popup.getBoundingClientRect();
        const margin = 8;

        let left = rect.left;
        if (left + popupRect.width > window.innerWidth - margin) {
            left = window.innerWidth - popupRect.width - margin;
        }
        left = Math.max(margin, left);

        let top = rect.bottom + 4;
        if (top + popupRect.height > window.innerHeight - margin) {
            // try above the caret
            const alt = rect.top - popupRect.height - 4;
            if (alt > margin) {
                top = alt;
            } else {
                top = Math.max(margin, window.innerHeight - popupRect.height - margin);
            }
        }

        this._popup.style.left = left + "px";
        this._popup.style.top = top + "px";
    },

    // ------------------------------------------------------------------
    // Inline triggers: `[[`, `{{`
    // ------------------------------------------------------------------

    /**
     * Detects the second character of a double-character trigger (`[[` / `{{`)
     * and routes to the appropriate dialog. Returns true if a trigger was
     * consumed.
     * @param {object} editor
     * @param {string} char - The character just typed.
     * @returns {boolean}
     */
    _consumeDoubleTrigger: function(editor, char) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) return false;

        const offset = range.startOffset;
        const text = node.textContent || "";
        // last two characters before the caret
        if (offset < 2) return false;
        const prev = text.charAt(offset - 2);
        const cur = text.charAt(offset - 1);
        if (prev !== char || cur !== char) return false;

        // strip the two characters from the text
        node.textContent = text.slice(0, offset - 2) + text.slice(offset);

        // restore caret
        const newRange = document.createRange();
        const newOffset = offset - 2;
        newRange.setStart(node, Math.min(newOffset, (node.textContent || "").length));
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        editor._saveCurrentSelection?.();

        if (char === "[") {
            this._triggerLinkDialog(editor);
            return true;
        }
        if (char === "{") {
            this._triggerAddonDialog(editor);
            return true;
        }
        if (char === "/") {
            this._triggerDateDialog(editor);
            return true;
        }
        return false;
    },

    /**
     * Opens the link dialog via the media plugin if available, otherwise prompts.
     * @param {object} editor
     */
    _triggerLinkDialog: function(editor) {
        const media = (webexpress.webui.EditorPlugins.getAll() || []).find((p) => p && p.linkModal !== undefined);
        if (media && typeof media._openModal === "function") {
            const range = editor._savedRange?.cloneRange?.() || null;
            media._openModal(editor, "linkModal", "editor-link", "webexpress.webui:editor.insert.link.title", { url: "", text: "" }, range);
            return;
        }
        const url = prompt(this._i18n("webexpress.webui:editor.link.url.label", "URL"));
        if (url) {
            editor.execCommand("createLink", url);
        }
    },

    /**
     * Opens the AddOn library via the addons plugin if available.
     * @param {object} editor
     */
    _triggerAddonDialog: function(editor) {
        const addons = (webexpress.webui.EditorPlugins.getAll() || []).find((p) => p && p._selectionModal !== undefined && typeof p._openModal === "function");
        if (addons) {
            const range = editor._savedRange?.cloneRange?.() || null;
            addons._openModal(editor, "_selectionModal", "editor-addon", "webexpress.webui:editor.insert.addon.title", range);
        }
    },

    /**
     * Inserts a date control or opens the date picker dialog.
     * @param {object} editor
     */
    _triggerDateDialog: function(editor) {
        // Insert a basic HTML date input inline
        const id = "date_" + Math.random().toString(36).substr(2, 9);
        editor.insertHtmlAtCursor(`<input type="date" class="form-control d-inline-block w-auto" id="${id}">`);
    },

    // ------------------------------------------------------------------
    // Mentions
    // ------------------------------------------------------------------

    /**
     * Opens the mention picker. Stores the anchor character offset so the
     * selected entry can replace the `@query` text on commit.
     * @param {object} editor
     * @param {string} uri
     */
    _openMentionMenu: function(editor, uri) {
        this._ensureMentionPopup();

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const r = sel.getRangeAt(0);

        this._mentionState = {
            editor: editor,
            uri: uri,
            anchorNode: r.startContainer,
            anchorOffset: r.startOffset - 1, // the `@` sits before the caret
            timer: null,
            items: [],
            activeIndex: -1,
            range: r.cloneRange()
        };
        if (this._mentionState.anchorOffset < 0) this._mentionState.anchorOffset = 0;

        this._mentionPopup.style.display = "block";
        this._positionMentionPopup();
        this._updateMentionQuery();
    },

    /**
     * Closes the mention picker.
     */
    _closeMentionMenu: function() {
        if (this._mentionPopup) {
            this._mentionPopup.style.display = "none";
        }
        if (this._mentionState && this._mentionState.timer) {
            clearTimeout(this._mentionState.timer);
        }
        this._mentionState = null;
    },

    /**
     * Builds the mention popup DOM lazily.
     */
    _ensureMentionPopup: function() {
        if (this._mentionPopup) return;

        const popup = document.createElement("div");
        popup.className = "wx-editor-shortcut-popup shadow";
        popup.style.position = "fixed";
        popup.style.display = "none";
        popup.style.zIndex = "2200";

        const list = document.createElement("div");
        list.className = "wx-editor-shortcut-list";
        popup.appendChild(list);

        document.body.appendChild(popup);

        popup.addEventListener("mousedown", (e) => e.preventDefault());

        this._mentionPopup = popup;
        this._mentionListEl = list;
    },

    /**
     * Extracts the current query (`@xyz`) and fetches matching candidates.
     */
    _updateMentionQuery: function() {
        if (!this._mentionState) return;
        const editorElem = this._mentionState.editor.getEditorElement();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            this._closeMentionMenu();
            return;
        }
        const r = sel.getRangeAt(0);
        if (!editorElem.contains(r.startContainer)) {
            this._closeMentionMenu();
            return;
        }

        // pull the text between the `@` and the caret
        const node = this._mentionState.anchorNode;
        let q = "";
        if (node && node.nodeType === Node.TEXT_NODE && r.startContainer === node) {
            const text = node.textContent || "";
            const start = this._mentionState.anchorOffset + 1; // skip the `@`
            const end = r.startOffset;
            if (end < start) {
                this._closeMentionMenu();
                return;
            }
            q = text.slice(start, end);
        }

        // debounce
        if (this._mentionState.timer) clearTimeout(this._mentionState.timer);
        const state = this._mentionState;
        state.timer = setTimeout(() => {
            this._fetchMentions(state, q);
        }, 180);
    },

    /**
     * Performs the search request and renders the result list.
     * @param {object} state - Captured mention state at request time.
     * @param {string} q
     */
    _fetchMentions: function(state, q) {
        if (!this._mentionState || this._mentionState !== state) return;
        const url = state.uri + (state.uri.indexOf("?") === -1 ? "?" : "&") + "q=" + encodeURIComponent(q);
        fetch(url, { headers: { "Accept": "application/json" } })
            .then((res) => res.ok ? res.json() : [])
            .then((data) => {
                if (!this._mentionState || this._mentionState !== state) return;
                state.items = Array.isArray(data) ? data : [];
                state.activeIndex = state.items.length > 0 ? 0 : -1;
                this._renderMentionList();
            })
            .catch(() => {
                if (!this._mentionState || this._mentionState !== state) return;
                state.items = [];
                state.activeIndex = -1;
                this._renderMentionList();
            });
    },

    /**
     * Paints the current candidate list.
     */
    _renderMentionList: function() {
        if (!this._mentionState || !this._mentionListEl) return;
        const state = this._mentionState;
        this._mentionListEl.innerHTML = "";

        if (state.items.length === 0) {
            const empty = document.createElement("div");
            empty.className = "wx-editor-shortcut-empty";
            empty.textContent = this._i18n("webexpress.webui:editor.slash.empty", "No matches");
            this._mentionListEl.appendChild(empty);
            return;
        }

        state.items.forEach((entry, index) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "wx-editor-shortcut-item";
            item.dataset.index = String(index);

            if (entry.image) {
                const img = document.createElement("img");
                img.src = entry.image;
                img.style.width = "20px";
                img.style.height = "20px";
                img.style.borderRadius = "50%";
                img.style.marginRight = "6px";
                item.appendChild(img);
            } else {
                const icon = document.createElement("i");
                icon.className = "fas fa-user";
                item.appendChild(icon);
            }

            const body = document.createElement("div");
            body.className = "wx-editor-shortcut-body";
            const label = document.createElement("div");
            label.className = "wx-editor-shortcut-label";
            label.textContent = entry.label || entry.name || entry.id || "";
            body.appendChild(label);
            if (entry.description) {
                const desc = document.createElement("div");
                desc.className = "wx-editor-shortcut-desc";
                desc.textContent = entry.description;
                body.appendChild(desc);
            }
            item.appendChild(body);

            item.addEventListener("mouseenter", () => {
                state.activeIndex = index;
                this._highlightMentionActive();
            });
            item.addEventListener("click", (e) => {
                e.preventDefault();
                state.activeIndex = index;
                this._activateMention();
            });

            this._mentionListEl.appendChild(item);
        });
        this._highlightMentionActive();
    },

    /**
     * Highlights the current mention entry.
     */
    _highlightMentionActive: function() {
        if (!this._mentionState) return;
        const items = this._mentionListEl.querySelectorAll(".wx-editor-shortcut-item");
        items.forEach((el) => {
            const idx = parseInt(el.dataset.index, 10);
            el.classList.toggle("active", idx === this._mentionState.activeIndex);
        });
    },

    /**
     * Moves the active mention entry.
     * @param {number} delta
     */
    _moveMentionActive: function(delta) {
        if (!this._mentionState || this._mentionState.items.length === 0) return;
        const n = this._mentionState.items.length;
        this._mentionState.activeIndex = (this._mentionState.activeIndex + delta + n) % n;
        this._highlightMentionActive();
    },

    /**
     * Inserts the chosen mention into the editor, replacing the `@query` text.
     */
    _activateMention: function() {
        if (!this._mentionState) return;
        const state = this._mentionState;
        const entry = state.items[state.activeIndex];
        if (!entry) {
            this._closeMentionMenu();
            return;
        }

        // remove the @query text first
        const node = state.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
            try {
                const text = node.textContent || "";
                const sel = window.getSelection();
                let end = text.length;
                if (sel && sel.rangeCount) {
                    const r = sel.getRangeAt(0);
                    if (r.startContainer === node) {
                        end = r.startOffset;
                    }
                }
                if (end > state.anchorOffset) {
                    node.textContent = text.slice(0, state.anchorOffset) + text.slice(end);
                }
                const range = document.createRange();
                range.setStart(node, state.anchorOffset);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                state.editor._saveCurrentSelection?.();
            } catch (_) { /* noop */ }
        }

        const label = entry.label || entry.name || entry.id || "";
        const href = entry.uri || "#";
        const safeLabel = label.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const html = `<a class="wx-mention" data-id="${entry.id || ""}" href="${href}" contenteditable="false">@${safeLabel}</a>&nbsp;`;

        this._closeMentionMenu();
        state.editor.getEditorElement().focus();
        state.editor.insertHtmlAtCursor(html);
    },

    /**
     * Positions the mention popup at the caret.
     */
    _positionMentionPopup: function() {
        if (!this._mentionPopup || !this._mentionState) return;
        const r = this._mentionState.range;
        if (!r) return;
        const rect = r.getBoundingClientRect();
        const pRect = this._mentionPopup.getBoundingClientRect();
        const margin = 8;

        let left = rect.left;
        if (left + pRect.width > window.innerWidth - margin) {
            left = window.innerWidth - pRect.width - margin;
        }
        left = Math.max(margin, left);

        let top = rect.bottom + 4;
        if (top + pRect.height > window.innerHeight - margin) {
            const alt = rect.top - pRect.height - 4;
            top = alt > margin ? alt : Math.max(margin, window.innerHeight - pRect.height - margin);
        }
        this._mentionPopup.style.left = left + "px";
        this._mentionPopup.style.top = top + "px";
    },

    // ------------------------------------------------------------------
    // Markdown shortcuts
    // ------------------------------------------------------------------

    /**
     * Applies a block-level markdown transformation when the user typed Space
     * right after a known marker at the start of the current block.
     * @param {object} editor
     */
    _applyMarkdownBlock: function(editor) {
        const editorElem = editor.getEditorElement();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (!editorElem.contains(range.startContainer)) return;

        let node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) return;
        const block = node.parentElement?.closest?.("p, h1, h2, h3, h4, h5, h6, blockquote, pre, li, div");
        if (!block || !editorElem.contains(block) || block === editorElem) return;

        // clone block text without placeholder
        const clone = block.cloneNode(true);
        clone.querySelectorAll(".wx-editor-placeholder").forEach((el) => el.remove());
        const text = (clone.textContent || "").replace(/ /g, " ");

        // pattern table
        const patterns = [
            { rx: /^# $/, action: () => editor.execCommand("formatBlock", "<h1>") },
            { rx: /^## $/, action: () => editor.execCommand("formatBlock", "<h2>") },
            { rx: /^### $/, action: () => editor.execCommand("formatBlock", "<h3>") },
            { rx: /^> $/, action: () => editor.execCommand("formatBlock", "<blockquote>") },
            { rx: /^``` $/, action: () => editor.execCommand("formatBlock", "<pre>") },
            { rx: /^[-*] $/, action: () => editor.execCommand("insertUnorderedList") },
            { rx: /^1\. $/, action: () => editor.execCommand("insertOrderedList") },
            { rx: /^--- $/, action: () => editor.insertHtmlAtCursor("<hr><p><br></p>") }
        ];

        for (const p of patterns) {
            if (p.rx.test(text)) {
                // wipe the marker text from the block
                this._clearBlockText(block);
                // place caret inside the block
                const r = document.createRange();
                r.selectNodeContents(block);
                r.collapse(true);
                sel.removeAllRanges();
                sel.addRange(r);
                editor._saveCurrentSelection?.();
                try { p.action(); } catch (_) { /* noop */ }
                return;
            }
        }
    },

    /**
     * Wipes all child text/elements from a block while keeping it usable.
     * @param {HTMLElement} block
     */
    _clearBlockText: function(block) {
        // preserve a `<br>` filler so contenteditable behaves
        while (block.firstChild) {
            block.removeChild(block.firstChild);
        }
        block.appendChild(document.createElement("br"));
    },

    /**
     * Applies inline markdown transformations after a Space was typed.
     * Looks at the text immediately preceding the caret in the current text
     * node and replaces matched patterns with the appropriate inline element.
     * @param {object} editor
     */
    _applyMarkdownInline: function(editor) {
        const editorElem = editor.getEditorElement();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (!editorElem.contains(range.startContainer)) return;
        if (range.startContainer.nodeType !== Node.TEXT_NODE) return;

        const node = range.startContainer;
        const offset = range.startOffset; // caret is just after the Space
        if (offset < 2) return;

        const text = node.textContent || "";
        // the Space is at offset-1; look backwards from offset-1
        const beforeSpace = text.slice(0, offset - 1);
        const afterSpace = text.slice(offset - 1);

        // lookbehind on the `_italic_` pattern keeps the boundary character
        // (space, line start, opening paren) outside the match, so it doesn't
        // get clobbered when the inline element replaces the matched range.
        const patterns = [
            { rx: /\*\*([^*\n]+)\*\*$/, tag: "strong" },
            { rx: /__([^_\n]+)__$/, tag: "strong" },
            { rx: /\*([^*\n]+)\*$/, tag: "em" },
            { rx: /(?<=^|[\s(])_([^_\n]+)_$/, tag: "em" },
            { rx: /~~([^~\n]+)~~$/, tag: "s" },
            { rx: /`([^`\n]+)`$/, tag: "code" }
        ];

        for (const p of patterns) {
            const m = beforeSpace.match(p.rx);
            if (!m) continue;
            const inner = m[1];
            const matchLen = m[0].length;
            const replaceStart = beforeSpace.length - matchLen;

            // build the replacement
            const before = beforeSpace.slice(0, replaceStart);
            const el = document.createElement(p.tag);
            el.textContent = inner;

            // mutate the text node and insert the element
            const parent = node.parentNode;
            if (!parent) continue;

            // text before the match stays in `node`
            node.textContent = before;

            // insert the element after the text node
            const afterTextNode = document.createTextNode(afterSpace);
            const next = node.nextSibling;
            parent.insertBefore(el, next);
            parent.insertBefore(afterTextNode, el.nextSibling);

            // place caret right after the Space inside the new text node
            const r2 = document.createRange();
            r2.setStart(afterTextNode, 1);
            r2.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r2);
            editor._saveCurrentSelection?.();
            return;
        }
    }
});
