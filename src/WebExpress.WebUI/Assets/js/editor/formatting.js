/**
 * Plugin for basic text formatting.
 * Provides toolbar controls for bold, italic, underline, fonts, colors, lists,
 * alignment, and block formatting options.
 */
webexpress.webui.EditorPlugins.register("formatting", 0, {
    _lastColor: "#000000",
    _lastHighlight: "#FFFF00", // default highlight color (yellow)

    _colors: [
        // basic colors
        "#000000", "#FF0000", "#008000", "#0000FF", "#FFFF00",
        "#FFA500", "#800080", "#A52A2A", "#00FFFF", "#808080",
        // extended palette
        "#FFC0CB", "#FFD700", "#B22222", "#ADFF2F", "#20B2AA",
        "#00CED1", "#4682B4", "#DA70D6", "#D2691E", "#C0C0C0",
        // pastel tones
        "#FFB6C1", "#FFDAB9", "#E6E6FA", "#98FB98", "#AFEEEE",
        "#D3D3D3", "#FFE4E1", "#F0E68C", "#F5DEB3", "#F4A460",
        // dark shades
        "#2F4F4F", "#696969", "#708090", "#778899", "#556B2F",
        "#483D8B", "#8B0000", "#9400D3", "#FF4500", "#DC143C"
    ],

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
     * Creates the text color split-button.
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The button group.
     */
    _createTextColorDropdown: function(editor) {
        let lastColor = this._lastColor;
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        container.style.gap = "0";

        // action button (apply current text color)
        const actionBtn = document.createElement("button");
        actionBtn.className = "wx-editor-btn";
        actionBtn.type = "button";
        actionBtn.title = webexpress.webui.I18N.translate("webexpress.webui:editor.textcolor");

        const icon = document.createElement("i");
        icon.className = webexpress.webui.IconSet.resolve("font");
        icon.style.borderBottom = `3px solid ${lastColor}`;
        actionBtn.appendChild(icon);

        actionBtn.addEventListener("click", () => {
            editor.execCommand("foreColor", lastColor);
        });

        // dropdown toggle button
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "wx-editor-btn dropdown-toggle dropdown-toggle-split";
        toggleBtn.type = "button";
        toggleBtn.title = actionBtn.title;


        const menu = document.createElement("div");
        menu.className = "dropdown-menu";
        const picker = document.createElement("ul");
        picker.className = "wx-editor-color-picker";

        this._colors.forEach((c) => {
            const li = document.createElement("li");
            const b = document.createElement("button");
            b.className = "dropdown-item p-2";
            b.type = "button";
            b.style.backgroundColor = c;
            b.title = c;
            b.addEventListener("click", () => {
                lastColor = c;
                icon.style.borderBottomColor = c;
                editor.execCommand("foreColor", c);
                webexpress.webui.NativeMenu.hide(menu);
            });
            li.appendChild(b);
            picker.appendChild(li);
        });

        menu.appendChild(picker);

        container.appendChild(actionBtn);
        container.appendChild(toggleBtn);
        container.appendChild(menu);
        webexpress.webui.NativeMenu.bind(toggleBtn, menu);
        return container;
    },

    /**
     * Creates the highlight color split-button (Mark).
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The button group.
     */
    _createHighlightDropdown: function(editor) {
        let lastHighlight = this._lastHighlight;
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        container.style.gap = "0";

        // action button (apply current highlight)
        const actionBtn = document.createElement("button");
        actionBtn.className = "wx-editor-btn";
        actionBtn.type = "button";
        actionBtn.title = webexpress.webui.I18N.translate("webexpress.webui:editor.highlightcolor");

        const icon = document.createElement("i");
        icon.className = webexpress.webui.IconSet.resolve("highlighter");
        icon.style.borderBottom = `3px solid ${lastHighlight}`;
        actionBtn.appendChild(icon);

        actionBtn.addEventListener("click", () => {
            editor.execCommand("hiliteColor", lastHighlight);
        });

        // 2. dropdown toggle button
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "wx-editor-btn dropdown-toggle dropdown-toggle-split";
        toggleBtn.type = "button";
        toggleBtn.title = actionBtn.title;


        const menu = document.createElement("div");
        menu.className = "dropdown-menu";

        const picker = document.createElement("ul");
        picker.className = "wx-editor-color-picker";

        // requested highlight colors
        const markColors = [
            { val: "#FFFF00", name: webexpress.webui.I18N.translate("webexpress.webui:editor.color.yellow") },
            { val: "#00FFFF", name: webexpress.webui.I18N.translate("webexpress.webui:editor.color.cyan") },
            { val: "#00FF00", name: webexpress.webui.I18N.translate("webexpress.webui:editor.color.lime") },
            { val: "#FF00FF", name: webexpress.webui.I18N.translate("webexpress.webui:editor.color.magenta") },
        ];

        markColors.forEach((c) => {
            const li = document.createElement("li");
            const b = document.createElement("button");
            b.className = "dropdown-item p-2 d-flex align-items-center justify-content-center";
            b.type = "button";
            b.style.backgroundColor = c.val;
            b.title = c.name;
            b.style.border = "1px solid #dee2e6";

            if (c.icon) {
                b.innerHTML = `<i class="${c.icon}" style="font-size: 10px; color: #000;"></i>`;
            }

            b.addEventListener("click", () => {
                // update state if it is a visible color
                if (c.val !== "transparent") {
                    lastHighlight = c.val;
                    icon.style.borderBottomColor = c.val;
                }
                editor.execCommand("hiliteColor", c.val);
                webexpress.webui.NativeMenu.hide(menu);
            });
            li.appendChild(b);
            picker.appendChild(li);
        });

        menu.appendChild(picker);

        container.appendChild(actionBtn);
        container.appendChild(toggleBtn);
        container.appendChild(menu);
        webexpress.webui.NativeMenu.bind(toggleBtn, menu);
        return container;
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
