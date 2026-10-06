/**
 * Plugin that powers the editor's inline shortcut surfaces:
 *  - the slash-command palette (`/`)
 *  - the inline triggers `@` (mention), `[` (link), `{` (AddOn), `:` (emoji)
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
    _inlineState: null,
    _inlinePopup: null,
    _docClickHandler: null,
    _datePopup: null,
    _dateKeyHandler: null,
    _dateClickHandler: null,

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
        const root = editor.getEditorElement();
        editor.listen(root, "keydown", e => { if (editor.ownsInput(e) && !e.defaultPrevented && !e.isComposing) this._onKeyDown(editor, e); });
        editor.listen(root, "click", e => {
            if (editor.disabled) return;
            const date = e.target.closest?.(".wx-editor-date");
            if (date) { e.preventDefault(); this._editDate(editor, date); }
        });
        editor.listen(document, "mousedown", e => {
            if (!this._popup?.contains(e.target) && !root.contains(e.target)) this._closeSlashMenu();
            if (!this._inlinePopup?.contains(e.target) && !root.contains(e.target)) this._closeInlineMenu();
        });
        return () => {
            this._closeDatePopup(); this._closeInlineMenu(); this._closeSlashMenu();
            this._popup?.remove(); this._inlinePopup?.remove();
        };
    },

    /**
     * Keeps inline picker navigation on the editor while ordinary typing reaches the model.
     * @param {object} editor - The editor that owns the active inline picker.
     * @param {KeyboardEvent} e - The key event used to navigate or dismiss the picker.
     */
    _onKeyDown: function(editor, e) {
        // keep picker navigation on the editor selection
        if (this._inlinePopup && this._inlinePopup.style.display !== "none" && this._inlineState && this._inlineState.editor === editor) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                this._moveInlineActive(1);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                this._moveInlineActive(-1);
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                this._activateInline();
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                this._closeInlineMenu();
                return;
            }
        }

    },

    /**
     * Routes committed text through insertion pickers and reversible text shortcuts.
     * @param {object} editor - The editor that committed the transaction.
     * @param {object} action - The model transaction containing the inserted text.
     */
    onTransaction: function(editor, action) {
        if (action.source === "shortcut") return;
        if (this._inlineState && ["delete", "splitBlock"].includes(action.type)) { this._updateInlineQuery(); return; }
        if (action.type !== "insertText") return;
        if (this._applyEmoticon(editor)) return;
        const e = { inputType: "insertText", data: action.text };
        // an open inline picker owns its query until selection or cancellation
        if (this._inlinePopup && this._inlinePopup.style.display !== "none" && this._inlineState && this._inlineState.editor === editor) {
            this._updateInlineQuery();
            return;
        }

        const inputType = e.inputType || "";

        // detect a freshly typed character - most reliable across browsers
        if (inputType === "insertText" || inputType === "insertCompositionText" || inputType === "" || !inputType) {
            const data = e.data;

            if (data === "/" && this._isAtBlockStart(editor) && this._textBeforeCaret(editor) !== null) this._openSlashMenu(editor);
            if (data === "/") {
                if (this._consumeTrigger(editor, "//")) {
                    return;
                }
            }

            if (data === "@" && this._atTriggerBoundary(editor, "@")) {
                const host = editor._uiContainer || editor.getEditorElement();
                const uri = host?.dataset?.mentionUri || "";
                if (uri) {
                    this._openInlineMenu(editor, uri);
                    return;
                }
            }

            if (data === ":" && this._atTriggerBoundary(editor, ":") && editor._plugins.some(plugin => plugin._emojis)) {
                this._openInlineMenu(editor, "", "emoji");
                return;
            }

            // single-character triggers share the date shortcut transaction path
            if (data === "[" || data === "{") {
                if (this._consumeTrigger(editor, data)) {
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
        const block = webexpress.webui.EditorModel.block(editor._state.doc, editor.selection.focus);
        return !!block && editor.selection.focus === block.start + 1;
    },

    /**
     * Opens the slash command palette anchored to the caret.
     * @param {object} editor
     */
    _openSlashMenu: function(editor) {
        this._ensurePopup();
        this._currentEditor = editor;
        this._slashPosition = editor.selection.focus - 1;

        // remember where the slash was typed so we can replace it on commit.
        // we also capture the parent block, because the easiest way to clean
        // up reliably (regardless of where focus lands) is to wipe the block
        // - the menu only opens at the start of an otherwise empty block.
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
        editor.defer(() => {
            if (this._popup.style.display !== "none" && this._currentEditor === editor) {
                this._searchInput.focus({ preventScroll: true });
            }
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
            if (e.key === "/" && search.value === "") {
                e.preventDefault();
                const editor = this._currentEditor;
                editor.dispatch({ type: "insertText", text: "/", source: "shortcut" });
                this._consumeTrigger(editor, "//");
            }
            else if (e.key === "ArrowDown") { e.preventDefault(); this._moveActive(1); }
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
        icon.className = webexpress.webui.IconSet.resolve(def.icon || "bolt");
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
        editor.getEditorElement().focus({ preventScroll: true });
        editor._saveCurrentSelection?.();

        this._executeShortcut(editor, def);
    },

    /**
     * Removes the `/` character that triggered the menu. Because the menu
     * only opens in an otherwise empty block, we wipe the block entirely and
     * leave a `<br>` filler - this side-steps any tricky cross-element range
     * arithmetic that comes up when focus has moved to the popup's search
     * field. Selection is then re-anchored at the start of the block so the
     * following execCommand operates in the expected location.
     * @param {object} editor
     */
    _removeSlashTrigger: function(editor) {
        if (this._slashPosition == null) return;
        editor.dispatch({ type: "delete", selection: { anchor: this._slashPosition, focus: this._slashPosition + 1 }, source: "shortcut" });
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
    // inline insertion triggers
    // ------------------------------------------------------------------

    /**
     * Reads the current token without triggering pickers inside code blocks or inline code.
     * @param {object} editor - The editor whose caret determines the current text prefix.
     * @returns {string|null} The text prefix, or null when shortcuts are suppressed.
     */
    _textBeforeCaret: function(editor) {
        const Model = webexpress.webui.EditorModel, pos = editor.selection.focus;
        if (editor.selection.anchor !== pos) return null;
        const block = Model.block(editor._state.doc, pos);
        if (!block || block.node.type === "pre" || Model.activeMarks(editor._state).code || editor._codeSelection()) return null;
        return Model.slice(block.node.children, 0, pos - block.start).map(node => node.text || "\ufffc").join("");
    },

    /**
     * Keeps trigger characters in addresses and ordinary words as literal text.
     * @param {object} editor - The editor containing the freshly typed trigger.
     * @param {string} trigger - The complete trigger sequence.
     * @returns {boolean} Whether the sequence starts a new token at the caret.
     */
    _atTriggerBoundary: function(editor, trigger) {
        const before = this._textBeforeCaret(editor);
        if (before === null || !before.endsWith(trigger)) return false;
        const prefix = before.slice(0, -trigger.length);
        return !prefix || /\s$/.test(prefix);
    },

    /**
     * Reserves a trigger for replacement only when the insertion dialog is confirmed.
     * @param {object} editor - The editor retaining literal text when the dialog is cancelled.
     * @param {string} trigger - A link, add-on or date trigger.
     * @returns {boolean} Whether a dialog accepted the trigger.
     */
    _consumeTrigger: function(editor, trigger) {
        if (!this._atTriggerBoundary(editor, trigger)) return false;
        if (trigger === "{" && !editor._plugins.some(plugin => plugin._selectionModal !== undefined)) return false;
        const pos = editor.selection.focus;
        const selection = { anchor: pos - trigger.length, focus: pos };
        if (trigger === "[") this._triggerLinkDialog(editor, selection);
        if (trigger === "{") this._triggerAddonDialog(editor, selection);
        if (trigger === "//") {
            this._closeSlashMenu();
            this._triggerDateDialog(editor, selection);
        }
        return true;
    },

    /**
     * Converts complete emoticons in one undoable replacement while preserving surrounding text.
     * @param {object} editor - The editor receiving the Unicode emoji.
     * @returns {boolean} Whether a complete emoticon was replaced.
     */
    _applyEmoticon: function(editor) {
        const before = this._textBeforeCaret(editor);
        const match = before?.match(/(?:^|\s)(:-?\)|;-?\)|:-?\(|:-?[dDpP]|<3|\([/xX!]\))$/);
        if (!match) return false;
        const token = match[1];
        const normalized = token.replace("-", "").toLowerCase();
        const emoji = { ":)": "🙂", ";)": "😉", ":(": "🙁", ":d": "😃", ":p": "😛", "<3": "❤️", "(/)": "✅", "(x)": "❌", "(!)": "ℹ️" }[normalized];
        const pos = editor.selection.focus;
        this._closeInlineMenu();
        editor.dispatch({ type: "insertText", text: emoji, selection: { anchor: pos - token.length, focus: pos }, source: "shortcut" });
        return true;
    },

    /**
     * Opens the link dialog via the media plugin if available, otherwise prompts.
     * @param {object} editor - The editor owning the insertion dialog.
     * @param {object} [selection=editor.selection] - The model range replaced on confirmation.
     */
    _triggerLinkDialog: function(editor, selection = editor.selection) {
        const media = editor._plugins.find(p => typeof p?.openLink === "function");
        if (media) {
            // the trigger is replaced, never linked, so it does not count as selected text
            media.openLink(editor, { ...selection, text: "" });
            return;
        }
        const url = prompt(this._i18n("webexpress.webui:editor.link.url.label", "URL"));
        if (url) {
            editor.dispatch({ type: "insertNodes", nodes: [{ type: "text", text: url, marks: { link: { href: url } } }], selection });
        }
    },

    /**
     * Opens the AddOn library via the addons plugin if available.
     * @param {object} editor - The editor owning the insertion dialog.
     * @param {object} [selection=editor.selection] - The model range replaced on confirmation.
     */
    _triggerAddonDialog: function(editor, selection = editor.selection) {
        const addons = editor._plugins.find((p) => p && p._selectionModal !== undefined && typeof p._openModal === "function");
        if (addons) {
            addons._openModal(editor, "_selectionModal", "editor-addon", "webexpress.webui:editor.insert.addon.title", selection);
        }
    },

    /**
     * Opens a date picker (webexpress.webui.InputDateCtrl) anchored at the
     * caret. When a date is chosen the editor receives a read-only display
     * control (webexpress.webui.DateCtrl) at the saved caret position.
     * @param {object} editor - The editor owning the date picker.
     * @param {object} [selection=editor.selection] - The model range replaced on confirmation.
     * @param {string|null} [targetId=null] - The date atom to change instead of inserting one;
     * it belongs to this popup, so a cancelled edit cannot redirect a later insertion.
     */
    _triggerDateDialog: function(editor, selection = editor.selection, targetId = null) {
        this._closeDatePopup();

        const format = this._i18n("webexpress.webui:calendar.format", "DD.MM.YYYY");

        const popup = document.createElement("div");
        popup.className = "wx-editor-date-popup shadow";
        popup.style.position = "fixed";
        popup.style.zIndex = "2200";

        // host element that the controller framework upgrades to an InputDateCtrl
        const host = document.createElement("div");
        host.className = "wx-webui-input-date";
        host.setAttribute("data-format", format);
        popup.appendChild(host);

        document.body.appendChild(popup);
        this._datePopup = { popup: popup, editor: editor, format: format, done: false, selection, targetId };

        // position at the saved caret (fall back to the live selection)
        const range = editor._savedRange?.cloneRange?.() || this._currentSelectionRange(editor);
        this._positionDatePopup(range);

        // the framework instantiates the control asynchronously; the value
        // change event bubbles up from the host, so we listen on the popup.
        popup.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, (e) => {
            const value = e?.detail?.value || "";
            if (!value) {
                return;
            }
            this._commitDate(editor, value, format);
        });

        // open the calendar right away for a smooth flow
        editor.defer(() => {
            const ctrl = webexpress.webui.Controller.getInstanceByElement(host) ||
                webexpress.webui.Controller.getInstanceByElement(popup.firstElementChild);
            if (ctrl && typeof ctrl._showCalendarPopup === "function") {
                try { ctrl._showCalendarPopup(); } catch (_) { /* noop */ }
            }
        }, 0);

        // dismiss handlers
        this._dateKeyHandler = (ev) => {
            if (ev.key === "Escape") {
                this._closeDatePopup();
            }
        };
        this._dateClickHandler = (ev) => {
            if (!this._datePopup) {
                return;
            }
            // keep open while interacting with the picker or its (possibly
            // re-parented) calendar dropdown
            if (this._datePopup.popup.contains(ev.target) ||
                (ev.target.closest && ev.target.closest(".wx-editor-date-popup, .dropdown-menu, .wx-calendar, .wx-date"))) {
                return;
            }
            this._closeDatePopup();
        };
        editor.listen(document, "keydown", this._dateKeyHandler, true);
        // defer so the triggering interaction does not immediately close it
        editor.defer(() => { if (this._datePopup?.popup === popup) editor.listen(document, "mousedown", this._dateClickHandler, true); }, 0);
    },

    /**
     * Inserts the chosen date as a read-only display control and closes the popup.
     * @param {object} editor
     * @param {string} value - The formatted date string.
     * @param {string} format - The date format used for the display control.
     */
    _commitDate: function(editor, value, format) {
        const id = this._datePopup?.targetId;
        const selection = this._datePopup?.selection || editor.selection;
        if (this._datePopup) this._datePopup.done = true;
        this._closeDatePopup();
        const attrs = { kind: "date", text: value, value, format };
        if (id) editor.updateNode(id, attrs);
        else editor.dispatch({ type: "insertNodes", nodes: [webexpress.webui.EditorModel.node("atom", [], attrs)], selection });
    },

    /**
     * Returns the current selection range when it lies inside the editor.
     * @param {object} editor
     * @returns {Range|null}
     */
    _currentSelectionRange: function(editor) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            return null;
        }
        const r = sel.getRangeAt(0);
        return editor.getEditorElement().contains(r.startContainer) ? r.cloneRange() : null;
    },

    /**
     * Positions the date popup near the given range (or centered as fallback).
     * @param {Range|null} range
     */
    _positionDatePopup: function(range) {
        if (!this._datePopup) {
            return;
        }
        const popup = this._datePopup.popup;
        const margin = 8;
        let rect = null;
        if (range) {
            rect = range.getBoundingClientRect();
        }
        const pRect = popup.getBoundingClientRect();

        let left = rect ? rect.left : (window.innerWidth - pRect.width) / 2;
        left = Math.max(margin, Math.min(window.innerWidth - pRect.width - margin, left));

        let top = rect ? rect.bottom + 4 : margin * 6;
        if (top + pRect.height > window.innerHeight - margin) {
            const alt = (rect ? rect.top : window.innerHeight) - pRect.height - 4;
            top = alt > margin ? alt : Math.max(margin, window.innerHeight - pRect.height - margin);
        }
        popup.style.left = left + "px";
        popup.style.top = top + "px";
    },

    /**
     * Closes and removes the date picker popup and its dismiss handlers.
     */
    _closeDatePopup: function() {
        if (this._dateKeyHandler) {
            document.removeEventListener("keydown", this._dateKeyHandler, true);
            this._dateKeyHandler = null;
        }
        if (this._dateClickHandler) {
            document.removeEventListener("mousedown", this._dateClickHandler, true);
            this._dateClickHandler = null;
        }
        if (this._datePopup && this._datePopup.popup && this._datePopup.popup.parentNode) {
            this._datePopup.popup.parentNode.removeChild(this._datePopup.popup);
        }
        this._datePopup = null;
    },

    /**
     * Provides context menu items for an inserted date element (edit / remove).
     * @param {object} editor
     * @param {HTMLElement} target
     * @returns {Array<object>}
     */
    getContextMenuItems: function(editor, target) {
        let element = target;
        if (element && element.nodeType === 3) {
            element = element.parentNode;
        }
        const dateEl = element && element.closest ? element.closest(".wx-editor-date") : null;
        if (!dateEl || !editor.getEditorElement().contains(dateEl)) {
            return [];
        }

        return [
            {
                label: this._i18n("webexpress.webui:editor.edit", "Edit"),
                icon: "edit",
                action: () => this._editDate(editor, dateEl)
            },
            {
                label: this._i18n("webexpress.webui:editor.remove", "Remove"),
                icon: "trash",
                action: () => {
                    editor.removeNode(dateEl);
                    editor._syncValue?.();
                    editor._updateUndoRedoStates?.();
                }
            }
        ];
    },

    /**
     * Removes the given date element, restores the caret at its position and
     * re-opens the date picker so the value can be changed.
     * @param {object} editor
     * @param {HTMLElement} dateEl - The .wx-editor-date element.
     */
    _editDate: function(editor, dateEl) {
        this._triggerDateDialog(editor, editor.selection, editor.nodeId(dateEl));
    },

    // ------------------------------------------------------------------
    // Mentions
    // ------------------------------------------------------------------

    /**
     * Anchors mention and emoji choices to a model position so selection replaces the typed query.
     * @param {object} editor - The editor containing the trigger.
     * @param {string} uri - The configured mention endpoint, or an empty string for local emoji choices.
     * @param {string} kind - The inline picker kind, either mention or emoji.
     */
    _openInlineMenu: function(editor, uri, kind = "mention") {
        this._ensureInlinePopup();

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const r = sel.getRangeAt(0);

        this._inlineState = {
            editor: editor,
            uri: uri,
            kind: kind,
            anchor: editor.selection.focus - 1,
            timer: null,
            items: [],
            activeIndex: -1,
            range: r.cloneRange()
        };


        this._inlinePopup.style.display = "block";
        this._positionInlinePopup();
        this._updateInlineQuery();
    },

    /**
     * Cancels an inline picker without changing the typed query.
     */
    _closeInlineMenu: function() {
        if (this._inlinePopup) {
            this._inlinePopup.style.display = "none";
        }
        if (this._inlineState && this._inlineState.timer) {
            clearTimeout(this._inlineState.timer);
        }
        this._inlineState = null;
    },

    /**
     * Builds the shared inline picker without moving focus away from the caret.
     */
    _ensureInlinePopup: function() {
        if (this._inlinePopup) return;

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

        this._inlinePopup = popup;
        this._inlineListEl = list;
    },

    /**
     * Filters emoji names locally or requests matching mentions for the current query.
     */
    _updateInlineQuery: function() {
        const state = this._inlineState;
        if (!state) return;
        const Model = webexpress.webui.EditorModel, block = Model.block(state.editor._state.doc, state.anchor);
        const end = state.editor.selection.focus;
        if (!block || end < state.anchor + 1 || state.editor.selection.anchor !== end || Model.block(state.editor._state.doc, end)?.node.id !== block.node.id) { this._closeInlineMenu(); return; }
        const q = Model.slice(block.node.children, state.anchor + 1 - block.start, end - block.start).map(n => n.text || "").join("");
        if (/\s/.test(q)) { this._closeInlineMenu(); return; }
        if (state.kind === "emoji") {
            const plugin = state.editor._plugins.find(plugin => plugin._emojis);
            const query = q.toLowerCase();
            state.items = [...new Set(Object.values(plugin._emojis).flat())]
                .map(emoji => ({ emoji, label: plugin._emojiNames[emoji] || emoji }))
                .filter(item => item.label.toLowerCase().includes(query) || item.emoji.includes(query)).slice(0, 30);
            state.activeIndex = state.items.length ? 0 : -1;
            this._renderInlineList();
            this._positionInlinePopup();
            return;
        }
        if (state.timer) state.editor.cancelDeferred(state.timer);
        state.timer = state.editor.defer(() => this._fetchMentions(state, q), 180);
    },

    /**
     * Performs the search request and renders the result list.
     * @param {object} state - Captured mention state at request time.
     * @param {string} q
     */
    _fetchMentions: function(state, q) {
        const service = webexpress.webapp?.ServiceRegistry;
        if (!service || this._inlineState !== state || state.editor._destroyed) return;
        const url = state.uri + (state.uri.includes("?") ? "&" : "?") + "q=" + encodeURIComponent(q);
        const request = (state.request || 0) + 1; state.request = request;
        service.request(url, { method: "GET" }).then(result => {
            if (this._inlineState !== state || state.editor._destroyed || state.request !== request) return;
            state.items = result.ok && Array.isArray(result.data) ? result.data : [];
            state.activeIndex = state.items.length ? 0 : -1;
            this._renderInlineList();
        });
    },

    /**
     * Presents matching mention or emoji candidates with keyboard selection feedback.
     */
    _renderInlineList: function() {
        if (!this._inlineState || !this._inlineListEl) return;
        const state = this._inlineState;
        this._inlineListEl.innerHTML = "";

        if (state.items.length === 0) {
            const empty = document.createElement("div");
            empty.className = "wx-editor-shortcut-empty";
            empty.textContent = this._i18n("webexpress.webui:editor.slash.empty", "No matches");
            this._inlineListEl.appendChild(empty);
            return;
        }

        state.items.forEach((entry, index) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "wx-editor-shortcut-item";
            item.dataset.index = String(index);

            if (entry.emoji) {
                const glyph = document.createElement("span");
                glyph.textContent = entry.emoji;
                item.appendChild(glyph);
            } else if (entry.image) {
                const img = document.createElement("img");
                img.src = entry.image;
                img.style.width = "20px";
                img.style.height = "20px";
                img.style.borderRadius = "50%";
                img.style.marginRight = "6px";
                item.appendChild(img);
            } else {
                const icon = document.createElement("i");
                icon.className = webexpress.webui.IconSet.resolve("user");
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
                this._highlightInlineActive();
            });
            item.addEventListener("click", (e) => {
                e.preventDefault();
                state.activeIndex = index;
                this._activateInline();
            });

            this._inlineListEl.appendChild(item);
        });
        this._highlightInlineActive();
    },

    /**
     * Marks the active inline choice for keyboard navigation.
     */
    _highlightInlineActive: function() {
        if (!this._inlineState) return;
        const items = this._inlineListEl.querySelectorAll(".wx-editor-shortcut-item");
        items.forEach((el) => {
            const idx = parseInt(el.dataset.index, 10);
            el.classList.toggle("active", idx === this._inlineState.activeIndex);
        });
    },

    /**
     * Wraps keyboard navigation within the visible inline choices.
     * @param {number} delta - The signed number of candidates to advance.
     */
    _moveInlineActive: function(delta) {
        if (!this._inlineState || this._inlineState.items.length === 0) return;
        const n = this._inlineState.items.length;
        this._inlineState.activeIndex = (this._inlineState.activeIndex + delta + n) % n;
        this._highlightInlineActive();
    },

    /**
     * Replaces the typed query with the selected mention atom or Unicode emoji.
     */
    _activateInline: function() {
        const state = this._inlineState, entry = state?.items[state.activeIndex];
        if (!entry) return;
        const editor = state.editor, selection = { anchor: state.anchor, focus: editor.selection.focus };
        this._closeInlineMenu();
        if (entry.emoji) editor.dispatch({ type: "insertText", selection, text: entry.emoji, source: "shortcut" });
        else editor.dispatch({ type: "insertNodes", selection, nodes: [webexpress.webui.EditorModel.node("atom", [], { kind: "mention", text: "@" + (entry.label || entry.name || entry.id || ""), value: String(entry.id || "") })] });
    },

    /**
     * Keeps inline choices next to the active text query.
     */
    _positionInlinePopup: function() {
        if (!this._inlinePopup || !this._inlineState) return;
        const r = webexpress.webui.EditorSelection.getRange(this._inlineState.editor.getEditorElement());
        if (!r) return;
        const rect = r.getBoundingClientRect();
        const pRect = this._inlinePopup.getBoundingClientRect();
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
        this._inlinePopup.style.left = left + "px";
        this._inlinePopup.style.top = top + "px";
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
        const Model = webexpress.webui.EditorModel, block = Model.block(editor._state.doc, editor.selection.focus);
        if (!block || this._textBeforeCaret(editor) === null) return;
        const text = block.node.children.map(n => n.text || "\ufffc").join("");
        const blocks = { "# ": "h1", "## ": "h2", "### ": "h3", "``` ": "pre", "> ": "blockquote" };
        const command = blocks[text] ? { type: "block", block: blocks[text] } : ["- ", "* ", "1. "].includes(text) ? { type: "list", command: text === "1. " ? "insertorderedlist" : "insertunorderedlist" } : null;
        if (!command) return;
        editor.dispatch({ type: "batch", actions: [{ type: "delete", selection: { anchor: block.start, focus: block.end - 1 } }, command], source: "markdown" });
    },



    /**
     * Applies inline markdown transformations after a Space was typed.
     * Looks at the text immediately preceding the caret in the current text
     * node and replaces matched patterns with the appropriate inline element.
     * @param {object} editor
     */
    _applyMarkdownInline: function(editor) {
        const Model = webexpress.webui.EditorModel, pos = editor.selection.focus, block = Model.block(editor._state.doc, pos);
        const text = this._textBeforeCaret(editor);
        if (!block || text === null) return;
        const patterns = [[/\*\*([^*\n]+)\*\* $/, "bold"], [/__([^_\n]+)__ $/, "bold"], [/\*([^*\n]+)\* $/, "italic"], [/(?<=^|[\s(])_([^_\n]+)_ $/, "italic"], [/~~([^~\n]+)~~ $/, "strikethrough"], [/`([^`\n]+)` $/, "code"]];
        for (const [regex, mark] of patterns) {
            const match = text.match(regex);
            if (!match) continue;
            // the delimiters are removed around the content instead of retyping it, so atoms and
            // existing marks such as links and comments inside the match survive
            const delimiter = (match[0].length - match[1].length - 1) / 2, start = pos - match[0].length, end = start + match[1].length;
            const space = Model.slice(block.node.children, pos - 1 - block.start, pos - block.start)[0];
            delete space.marks[mark];
            editor.dispatch({ type: "batch", source: "markdown", actions: [
                { type: "delete", selection: { anchor: start, focus: start + delimiter } },
                { type: "format", mark, value: true, selection: { anchor: start, focus: end } },
                { type: "insertNodes", nodes: [space], selection: { anchor: end, focus: end + delimiter + 1 } }
            ] });
            break;
        }
    }
});
