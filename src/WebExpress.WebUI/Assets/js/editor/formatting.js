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
     * Sets up listeners to update button states based on cursor selection.
     * @param {object} editor - The editor instance.
     */
    init: function(editor) {
        document.addEventListener("selectionchange", () => {
            this._updateButtonStates(editor);
        });
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
     * Updates the active state of buttons based on current selection style.
     * @param {object} editor - The editor instance.
     */
    _updateButtonStates: function(editor) {
        const buttons = document.querySelectorAll(".wx-editor-btn");
        buttons.forEach((button) => {
            const isActive = button.dataset.command ? document.queryCommandState(button.dataset.command) : false;
            button.classList.toggle("active", isActive);
        });
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
        button.setAttribute("data-bs-toggle", "dropdown");
        const buttonText = document.createElement("span");
        buttonText.textContent = "Paragraph";
        button.appendChild(buttonText);

        const menu = document.createElement("ul");
        menu.className = "dropdown-menu";

        const options = [
            { cmd: "p", lbl: "Paragraph" }, { cmd: "h1", lbl: "Heading 1" },
            { cmd: "h2", lbl: "Heading 2" }, { cmd: "h3", lbl: "Heading 3" },
            { cmd: "blockquote", lbl: "Quote" }, { cmd: "pre", lbl: "Code Block" }
        ];

        options.forEach((opt) => {
            const li = document.createElement("li");
            const btn = document.createElement("button");
            btn.className = "dropdown-item";
            btn.textContent = opt.lbl;
            btn.type = "button";
            btn.addEventListener("click", () => {
                document.execCommand("formatBlock", false, opt.cmd);
                buttonText.textContent = opt.lbl;
                editor.getEditorElement().focus();
            });
            li.appendChild(btn);
            menu.appendChild(li);
        });
        container.appendChild(button);
        container.appendChild(menu);
        return container;
    },

    /**
     * Creates basic formatting buttons.
     */
    _createBasicButtons: function(editor) {
        const frag = document.createDocumentFragment();
        const defs = [
            { cmd: "bold", icon: "fas fa-bold", tip: "Bold (Ctrl+B)" },
            { cmd: "italic", icon: "fas fa-italic", tip: "Italic (Ctrl+I)" },
            { cmd: "underline", icon: "fas fa-underline", tip: "Underline (Ctrl+U)" }
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
        btn.innerHTML = '<i class="fas fa-text-height"></i>';
        btn.setAttribute("data-bs-toggle", "dropdown");

        const menu = document.createElement("ul");
        menu.className = "dropdown-menu";

        const opts = [
            { cmd: "strikethrough", icon: "fas fa-strikethrough", lbl: "Strike" },
            { cmd: "superscript", icon: "fas fa-superscript", lbl: "Super" },
            { cmd: "subscript", icon: "fas fa-subscript", lbl: "Sub" },
            { separator: true },
            { cmd: "removeFormat", icon: "fas fa-eraser", lbl: "Clear Format" }
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
                b.innerHTML = `<i class="${o.icon}"></i> ${o.lbl}`;
                b.addEventListener("click", () => {
                    editor.execCommand(o.cmd);
                });
                li.appendChild(b);
                menu.appendChild(li);
            }
        });
        container.appendChild(btn);
        container.appendChild(menu);
        return container;
    },

    /**
     * Creates the text color split-button.
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The button group.
     */
    _createTextColorDropdown: function(editor) {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        container.style.gap = "0";

        // action button (apply current text color)
        const actionBtn = document.createElement("button");
        actionBtn.className = "wx-editor-btn";
        actionBtn.type = "button";
        actionBtn.title = "Text Color";

        const icon = document.createElement("i");
        icon.className = "fas fa-font";
        icon.style.borderBottom = `3px solid ${this._lastColor}`;
        actionBtn.appendChild(icon);

        actionBtn.addEventListener("click", () => {
            editor.execCommand("foreColor", this._lastColor);
        });

        // dropdown toggle button
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "wx-editor-btn dropdown-toggle dropdown-toggle-split";
        toggleBtn.type = "button";
        toggleBtn.setAttribute("data-bs-toggle", "dropdown");

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
            b.addEventListener("click", () => {
                this._lastColor = c;
                icon.style.borderBottomColor = c;
                editor.execCommand("foreColor", c);
            });
            li.appendChild(b);
            picker.appendChild(li);
        });

        menu.appendChild(picker);

        container.appendChild(actionBtn);
        container.appendChild(toggleBtn);
        container.appendChild(menu);
        return container;
    },

    /**
     * Creates the highlight color split-button (Mark).
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The button group.
     */
    _createHighlightDropdown: function(editor) {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        container.style.gap = "0";

        // action button (apply current highlight)
        const actionBtn = document.createElement("button");
        actionBtn.className = "wx-editor-btn";
        actionBtn.type = "button";
        actionBtn.title = "Highlight Color";

        const icon = document.createElement("i");
        icon.className = "fas fa-highlighter";
        icon.style.borderBottom = `3px solid ${this._lastHighlight}`;
        actionBtn.appendChild(icon);

        actionBtn.addEventListener("click", () => {
            editor.execCommand("hiliteColor", this._lastHighlight);
        });

        // 2. dropdown toggle button
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "wx-editor-btn dropdown-toggle dropdown-toggle-split";
        toggleBtn.type = "button";
        toggleBtn.setAttribute("data-bs-toggle", "dropdown");

        const menu = document.createElement("div");
        menu.className = "dropdown-menu";

        const picker = document.createElement("ul");
        picker.className = "wx-editor-color-picker";

        // requested highlight colors
        const markColors = [
            { val: "#FFFF00", name: "Yellow" },
            { val: "#00FFFF", name: "Cyan (Light Blue)" },
            { val: "#00FF00", name: "Lime (Light Green)" },
            { val: "#FF00FF", name: "Magenta" },
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
                    this._lastHighlight = c.val;
                    icon.style.borderBottomColor = c.val;
                }
                editor.execCommand("hiliteColor", c.val);
            });
            li.appendChild(b);
            picker.appendChild(li);
        });

        menu.appendChild(picker);

        container.appendChild(actionBtn);
        container.appendChild(toggleBtn);
        container.appendChild(menu);
        return container;
    },

    /**
     * Creates list buttons.
     */
    _createListButtons: function(editor) {
        const frag = document.createDocumentFragment();
        [
            { cmd: "insertUnorderedList", icon: "fas fa-list-ul", tip: "Bullet" },
            { cmd: "insertOrderedList", icon: "fas fa-list-ol", tip: "Number" }
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
            { cmd: "outdent", icon: "fas fa-outdent", tip: "Less" },
            { cmd: "indent", icon: "fas fa-indent", tip: "More" }
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
            { cmd: "justifyLeft", icon: "fas fa-align-left", tip: "Left" },
            { cmd: "justifyCenter", icon: "fas fa-align-center", tip: "Center" },
            { cmd: "justifyRight", icon: "fas fa-align-right", tip: "Right" },
            { cmd: "justifyFull", icon: "fas fa-align-justify", tip: "Justify" }
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
        btn.innerHTML = `<i class="${def.icon}"></i>`;
        btn.addEventListener("click", () => {
            editor.execCommand(def.cmd);
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
        btn.title = "Horizontal Rule";
        btn.setAttribute("aria-label", "Horizontal Rule");
        btn.type = "button";
        btn.innerHTML = '<i class="fas fa-minus"></i>';
        btn.addEventListener("click", () => {
            editor.execCommand("insertHorizontalRule");
        });
        return btn;
    }
});