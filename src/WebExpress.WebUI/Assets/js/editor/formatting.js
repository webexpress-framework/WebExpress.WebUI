/**
 * Plugin for basic text formatting.
 * Provides toolbar controls for bold, italic, underline, fonts, colors, lists,
 * alignment, and block formatting options.
 */
webexpress.webui.EditorPlugins.register("formatting", 0, {
    _colorControls: null,

    /**
     * Initializes the plugin.
     * Sets up listeners to update button states based on cursor selection
     * and the document's structural state. Keyboard, mouse and focus
     * events keep the toolbar in sync the same way Word does - every
     * cursor movement immediately updates the highlighted buttons.
     * @param {object} editor - The editor instance.
     */
    init: function(editor) {
        const update = () => this._updateButtonStates(editor);

        const selectionChanged = () => {
            // limit work to the editor that currently owns the selection
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                return;
            }
            const el = editor.getEditorElement();
            if (el && el.contains(sel.anchorNode)) {
                update();
            }
        };
        document.addEventListener("selectionchange", selectionChanged);

        const editorEl = editor.getEditorElement();
        if (editorEl) {
            editorEl.addEventListener("keyup", update);
            editorEl.addEventListener("mouseup", update);
            editorEl.addEventListener("focus", update);
            editorEl.addEventListener("input", update);
        }
        return () => {
            document.removeEventListener("selectionchange", selectionChanged);
            ["keyup", "mouseup", "focus", "input"].forEach(type => editorEl?.removeEventListener(type, update));
            this._colorControls?.forEach(control => control.destroy());
        };
    },

    /**
     * Creates the main toolbar for formatting controls.
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The toolbar container.
     */
    createToolbar: function(editor) {
        const toolbar = document.createElement("div");
        toolbar.classList.add("wx-editor-format-toolbar");

        const fragment = document.createDocumentFragment();
        fragment.appendChild(this._createFormatDropdown(editor));
        fragment.appendChild(this._createSeparator());
        fragment.appendChild(this._createBasicButtons(editor));
        fragment.appendChild(this._createStyleDropdown(editor));

        // separate buttons for text color and highlight
        fragment.appendChild(this._createSeparator());
        fragment.appendChild(this._createTextColorDropdown(editor));
        fragment.appendChild(this._createHighlightDropdown(editor));
        fragment.appendChild(this._createBtn(editor, {
            cmd: "formatpainter",
            icon: "paint-roller",
            tip: webexpress.webui.I18N.translate("webexpress.webui:editor.formatpainter")
        }));

        fragment.appendChild(this._createSeparator());
        fragment.appendChild(this._createListButtons(editor));
        fragment.appendChild(this._createSeparator());
        fragment.appendChild(this._createIndentButtons(editor));
        fragment.appendChild(this._createSeparator());
        fragment.appendChild(this._createAlignButtons(editor));
        fragment.appendChild(this._createSeparator());
        fragment.appendChild(this._createHorizontalRuleButton(editor));

        toolbar.appendChild(fragment);
        return toolbar;
    },

    /**
     * Scopes toolbar feedback to its editor and uses the command engine for
     * mixed inline selections, independent of native browser command state.
     * @param {object} editor - The editor whose active formatting is reflected in the toolbar.
     */
    _updateButtonStates: function(editor) {
        const editorEl = editor.getEditorElement();
        if (!editorEl) {
            return;
        }

        const toolbar = this._findToolbar(editorEl);
        const alignment = this._detectAlignment(editor);
        const blockFormat = this._detectBlockFormat(editor);

        if (!toolbar) {
            return;
        }
        const buttons = toolbar.querySelectorAll("[data-command]");

        buttons.forEach((button) => {
            const cmd = button.dataset.command;
            if (!cmd || cmd === "undo" || cmd === "redo") {
                return;
            }

            let isActive = false;
            switch (cmd) {
                case "justifyLeft":
                    isActive = alignment === "left";
                    break;
                case "justifyCenter":
                    isActive = alignment === "center";
                    break;
                case "justifyRight":
                    isActive = alignment === "right";
                    break;
                case "justifyFull":
                    isActive = alignment === "justify";
                    break;
                default:
                    try {
                        isActive = editor.queryCommandState(cmd);
                    } catch (e) {
                        isActive = false;
                    }
            }
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        // reflect the current paragraph format in the dropdown label so
        // the user always sees what kind of block the caret sits in -
        // identical to Word's "Styles" indicator.
        this._updateFormatDropdown(toolbar, blockFormat);
        this._updateColorButtons(editor, toolbar);
    },

    /**
     * Locates the toolbar element belonging to the editor that hosts
     * <paramref name="editorEl"/>.
     * @param {HTMLElement} editorEl - The contenteditable host.
     * @returns {HTMLElement|null} The toolbar or null when not found.
     */
    _findToolbar: function(editorEl) {
        if (!editorEl) {
            return null;
        }
        // the toolbar is a sibling of the editor container under the wx-editor host
        const host = editorEl.closest(".wx-editor");
        if (host) {
            return host.querySelector(".wx-editor-toolbar");
        }
        return null;
    },

    /**
     * Determines the effective text alignment of the block the caret
     * currently lives in. Walks up from the selection anchor through
     * every block-level ancestor inside the editor and reads the
     * computed <c>text-align</c> so the result reflects both inline
     * styles and CSS rules. Logical values (<c>start</c>, <c>end</c>) are
     * normalized into <c>left</c>/<c>right</c> using the document
     * direction.
     * @param {object} editor - The editor instance.
     * @returns {"left"|"center"|"right"|"justify"} The alignment label.
     */
    _detectAlignment: function(editor) {
        const editorEl = editor.getEditorElement();
        if (!editorEl) {
            return "left";
        }

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            return "left";
        }

        let node = sel.anchorNode;
        if (!node || !editorEl.contains(node)) {
            return "left";
        }
        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }

        const dir = getComputedStyle(editorEl).direction || "ltr";

        while (node && node !== editorEl) {
            const style = getComputedStyle(node);
            const display = style.display;
            if (display === "block"
                || display === "flex"
                || display === "list-item"
                || display === "table-cell"
                || display === "flow-root") {
                let align = style.textAlign;
                if (align === "start") {
                    align = dir === "rtl" ? "right" : "left";
                } else if (align === "end") {
                    align = dir === "rtl" ? "left" : "right";
                } else if (align === "" || align === "normal") {
                    align = "left";
                }
                return align;
            }
            node = node.parentElement;
        }
        return "left";
    },

    /**
     * Detects the current block-level format (paragraph, heading,
     * quote, code) of the caret position. Used to keep the format
     * dropdown label in sync - the closest match in
     * <c>_formatOptions</c> is taken.
     * @param {object} editor - The editor instance.
     * @returns {string|null} The lowercase tag name (<c>p</c>,
     *          <c>h1</c>, <c>blockquote</c>, …) or <c>null</c>.
     */
    _detectBlockFormat: function(editor) {
        const editorEl = editor.getEditorElement();
        if (!editorEl) {
            return null;
        }
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            return null;
        }
        let node = sel.anchorNode;
        if (!node || !editorEl.contains(node)) {
            return null;
        }
        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }

        const known = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"]);
        while (node && node !== editorEl) {
            const tag = node.tagName && node.tagName.toLowerCase();
            if (tag && known.has(tag)) {
                return tag;
            }
            node = node.parentElement;
        }
        return null;
    },

    /**
     * Updates the label of the format dropdown so it shows the block
     * format the caret currently lives in (Word's "Styles" indicator).
     * @param {HTMLElement} toolbar - The toolbar root for this editor.
     * @param {string|null} blockFormat - The detected block tag.
     */
    _updateFormatDropdown: function(toolbar, blockFormat) {
        const dropdown = toolbar.querySelector(".wx-editor-format-label");
        if (!dropdown) {
            return;
        }

        const labels = {
            "p": webexpress.webui.I18N.translate("webexpress.webui:editor.paragraph"),
            "h1": webexpress.webui.I18N.translate("webexpress.webui:editor.heading1"),
            "h2": webexpress.webui.I18N.translate("webexpress.webui:editor.heading2"),
            "h3": webexpress.webui.I18N.translate("webexpress.webui:editor.heading3"),
            "h4": webexpress.webui.I18N.translate("webexpress.webui:editor.heading4"),
            "h5": webexpress.webui.I18N.translate("webexpress.webui:editor.heading5"),
            "h6": webexpress.webui.I18N.translate("webexpress.webui:editor.heading6"),
            "blockquote": webexpress.webui.I18N.translate("webexpress.webui:editor.quote"),
            "pre": webexpress.webui.I18N.translate("webexpress.webui:editor.codeblock")
        };

        const fallback = labels["p"];
        dropdown.textContent = (blockFormat && labels[blockFormat]) || fallback;
    },

    /**
     * Creates a visual separator element.
     * @returns {HTMLElement} The separator element.
     */
    _createSeparator: function() {
        const s = document.createElement("span");
        s.className = "wx-editor-separator";
        return s;
    },

    /**
     * Creates the block format dropdown.
     */
    _createFormatDropdown: function(editor) {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";

        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
        button.type = "button";

        const buttonText = document.createElement("span");
        buttonText.className = "wx-editor-format-label";
        buttonText.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.paragraph");
        button.appendChild(buttonText);

        const menu = document.createElement("ul");
        menu.className = "dropdown-menu";

        const options = [
            { cmd: "p", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.paragraph") },
            { cmd: "h1", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.heading1") },
            { cmd: "h2", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.heading2") },
            { cmd: "h3", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.heading3") },
            { cmd: "h4", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.heading4") },
            { cmd: "h5", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.heading5") },
            { cmd: "h6", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.heading6") },
            { cmd: "blockquote", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.quote") },
            { cmd: "pre", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.codeblock") }
        ];

        options.forEach((opt) => {
            const li = document.createElement("li");
            const btn = document.createElement("button");
            btn.className = "dropdown-item";
            btn.textContent = opt.lbl;
            btn.type = "button";
            btn.addEventListener("click", () => {
                editor.execCommand("formatBlock", opt.cmd);
                buttonText.textContent = opt.lbl;
                editor.getEditorElement().focus({ preventScroll: true });
                this._updateButtonStates(editor);
            });
            li.appendChild(btn);
            menu.appendChild(li);
        });
        container.appendChild(button);
        container.appendChild(menu);
        webexpress.webui.NativeMenu.bind(button, menu);
        return container;
    },

    /**
     * Creates basic formatting buttons.
     */
    _createBasicButtons: function(editor) {
        const frag = document.createDocumentFragment();
        const defs = [
            { cmd: "bold", icon: "bold", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.bold") },
            { cmd: "italic", icon: "italic", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.italic") },
            { cmd: "underline", icon: "underline", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.underline") }
        ];
        defs.forEach((d) => {
            frag.appendChild(this._createBtn(editor, d));
        });
        return frag;
    },

    /**
     * Creates the extended style dropdown.
     */
    _createStyleDropdown: function(editor) {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn dropdown-toggle";
        btn.type = "button";
        btn.title = webexpress.webui.I18N.translate("webexpress.webui:editor.textstyle");
        btn.setAttribute("aria-label", btn.title);
        btn.innerHTML = `<i class="${webexpress.webui.IconSet.resolve("text-height")}"></i>`;


        const menu = document.createElement("ul");
        menu.className = "dropdown-menu";

        const opts = [
            { cmd: "strikethrough", icon: "strikethrough", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.strike") },
            { cmd: "superscript", icon: "superscript", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.super") },
            { cmd: "subscript", icon: "subscript", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.sub") },
            { separator: true },
            { cmd: "removeFormat", icon: "eraser", lbl: webexpress.webui.I18N.translate("webexpress.webui:editor.clearformat") }
        ];

        opts.forEach((o) => {
            if (o.separator) {
                const sep = document.createElement("div");
                sep.className = "dropdown-divider";
                menu.appendChild(sep);
            } else {
                const li = document.createElement("li");
                const b = document.createElement("button");
                b.type = "button";
                b.className = "dropdown-item";
                b.dataset.command = o.cmd;
                b.innerHTML = `<i class="${webexpress.webui.IconSet.resolve(o.icon)}"></i> ${o.lbl}`;
                b.addEventListener("click", () => {
                    editor.execCommand(o.cmd);
                    this._updateButtonStates(editor);
                });
                li.appendChild(b);
                menu.appendChild(li);
            }
        });
        container.appendChild(btn);
        container.appendChild(menu);
        webexpress.webui.NativeMenu.bind(btn, menu);
        return container;
    },

    /**
     * Uses the common dropdown treatment for text colors.
     * @param {object} editor - The editor receiving the color transaction.
     * @returns {HTMLElement} The color dropdown group.
     */
    _createTextColorDropdown: function(editor) {
        return this._createColorDropdown(editor, "foreColor", "font", "editor.textcolor");
    },

    /**
     * Keeps highlight controls consistent with text colors and exposes removal explicitly.
     * @param {object} editor - The editor receiving the highlight transaction.
     * @returns {HTMLElement} The highlight dropdown group.
     */
    _createHighlightDropdown: function(editor) {
        return this._createColorDropdown(editor, "hiliteColor", "highlighter", "editor.highlightcolor");
    },

    /**
     * Places color feedback outside the masked icon so the full indicator remains visible.
     * @param {object} editor - The editor owning the saved selection and history.
     * @param {string} command - The color command to apply to the saved selection.
     * @param {string} symbol - The symbolic light icon name.
     * @param {string} label - The translation key for the dropdown's accessible name.
     * @returns {HTMLElement} The native dropdown and its color palette.
     */
    _createColorDropdown: function(editor, command, symbol, label) {
        const host = document.createElement("div");
        host.className = "wx-editor-btn-group";
        host.dataset.compact = "true";
        host.dataset.allowEmpty = "true";
        host.dataset.icon = symbol;
        host.dataset.emptyColor = command === "foreColor" ? "currentColor" : "transparent";
        host.setAttribute("aria-label", webexpress.webui.I18N.translate("webexpress.webui:" + label));
        const control = new webexpress.webui.InputColorCtrl(host);
        const button = host.querySelector(".wx-color-trigger");
        button.classList.add("wx-editor-btn");
        button.dataset.colorCommand = command;
        button.title = host.getAttribute("aria-label");
        this._colorControls ||= new Map();
        this._colorControls.set(command, control);
        host.addEventListener("mousedown", event => {
            if (event.target.closest("button")) { editor._saveCurrentSelection(); event.preventDefault(); }
        });
        host.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, event => {
            event.stopPropagation();
            editor.execCommand(command, event.detail.value);
        });
        return host;
    },

    /**
     * Refreshes color indicators after cursor movement, loading and undo or redo.
     * @param {object} editor - The editor whose active marks determine the displayed colors.
     * @param {HTMLElement} toolbar - The toolbar belonging to that editor.
     */
    _updateColorButtons: function(editor, toolbar) {
        const marks = webexpress.webui.EditorModel.activeMarks(editor._state);
        toolbar.querySelectorAll("[data-color-command]").forEach(button => {
            const mark = button.dataset.colorCommand === "foreColor" ? "color" : "background";
            const color = marks[mark] || (mark === "color" ? "currentColor" : "transparent");
            button.dataset.color = color;
            const control = this._colorControls?.get(button.dataset.colorCommand);
            if (control && !control.setValue(marks[mark] || "", false)) control.setValue("", false);
            button.querySelector(".wx-color-preview-box").style.backgroundColor = color;
        });
    },

    /**
     * Keeps toolbar feedback synchronized with model transactions and history restoration.
     * @param {object} editor - The editor whose rendered content changed.
     */
    onContentChange: function(editor) {
        this._updateButtonStates(editor);
    },

    /**
     * Creates list buttons.
     */
    _createListButtons: function(editor) {
        const frag = document.createDocumentFragment();
        [
            { cmd: "insertUnorderedList", icon: "list-ul", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.list.bullet") },
            { cmd: "insertOrderedList", icon: "list-ol", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.list.number") }
        ].forEach((d) => {
            frag.appendChild(this._createBtn(editor, d));
        });
        return frag;
    },

    /**
     * Creates indentation buttons.
     */
    _createIndentButtons: function(editor) {
        const frag = document.createDocumentFragment();
        [
            { cmd: "outdent", icon: "outdent", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.indent.less") },
            { cmd: "indent", icon: "indent", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.indent.more") }
        ].forEach((d) => {
            frag.appendChild(this._createBtn(editor, d));
        });
        return frag;
    },

    /**
     * Creates alignment buttons.
     */
    _createAlignButtons: function(editor) {
        const frag = document.createDocumentFragment();
        [
            { cmd: "justifyLeft", icon: "align-left", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.align.left") },
            { cmd: "justifyCenter", icon: "align-center", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.align.center") },
            { cmd: "justifyRight", icon: "align-right", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.align.right") },
            { cmd: "justifyFull", icon: "align-justify", tip: webexpress.webui.I18N.translate("webexpress.webui:editor.align.justify") }
        ].forEach((d) => {
            frag.appendChild(this._createBtn(editor, d));
        });
        return frag;
    },

    /**
     * Helper factory to create a standard command button.
     */
    _createBtn: function(editor, def) {
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.title = def.tip;
        btn.setAttribute("aria-label", def.tip);
        btn.dataset.command = def.cmd;
        btn.type = "button";
        btn.innerHTML = `<i class="${webexpress.webui.IconSet.resolve(def.icon)}"></i>`;
        btn.addEventListener("click", () => {
            editor.execCommand(def.cmd);
            // refresh immediately so the alignment / list / style buttons
            // flip their active state without waiting for selectionchange
            this._updateButtonStates(editor);
        });
        return btn;
    },

    /**
     * Creates the horizontal rule insertion button.
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The button element.
     */
    _createHorizontalRuleButton: function(editor) {
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.title = webexpress.webui.I18N.translate("webexpress.webui:editor.horizontal.rule");
        btn.setAttribute("aria-label", webexpress.webui.I18N.translate("webexpress.webui:editor.horizontal.rule"));
        btn.type = "button";
        btn.innerHTML = `<i class="${webexpress.webui.IconSet.resolve("minus")}"></i>`;
        btn.addEventListener("click", () => {
            editor.execCommand("insertHorizontalRule");
        });
        return btn;
    }
});
