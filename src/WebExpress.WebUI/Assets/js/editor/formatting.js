/**
 * Plugin for basic text formatting.
 * Provides toolbar controls for bold, italic, underline, fonts, colors, lists, 
 * alignment, and block formatting options.
 */
webexpress.webui.EditorPlugins.register("formatting", 0, {
    _lastColor: "#000000",
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
        fragment.appendChild(this._createColorDropdown(editor));
        fragment.appendChild(this._createSeparator());
        fragment.appendChild(this._createListButtons(editor));
        fragment.appendChild(this._createSeparator());
        fragment.appendChild(this._createIndentButtons(editor));
        fragment.appendChild(this._createSeparator());
        fragment.appendChild(this._createAlignButtons(editor));
        
        toolbar.appendChild(fragment);
        return toolbar;
    },

    /**
     * Updates the active state of buttons based on current selection style.
     * @param {object} editor - The editor instance.
     * @private
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
     * @private
     */
    _createSeparator: function() {
        const s = document.createElement("span");
        s.className = "wx-editor-separator";
        return s;
    },

    /**
     * Creates the block format dropdown (Paragraph, Heading 1-3, etc.).
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The dropdown button group.
     * @private
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
     * Creates basic formatting buttons (Bold, Italic, Underline).
     * @param {object} editor - The editor instance.
     * @returns {DocumentFragment} Fragment containing the buttons.
     * @private
     */
    _createBasicButtons: function(editor) {
        const frag = document.createDocumentFragment();
        const defs = [
            { cmd: "bold", icon: "fas fa-bold", tip: "Bold" },
            { cmd: "italic", icon: "fas fa-italic", tip: "Italic" },
            { cmd: "underline", icon: "fas fa-underline", tip: "Underline" }
        ];
        defs.forEach((d) => { 
            frag.appendChild(this._createBtn(editor, d)); 
        });
        return frag;
    },

    /**
     * Creates the extended style dropdown (Strikethrough, Sub/Superscript, Clear Format).
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The dropdown group.
     * @private
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
     * Creates the color picker split-button.
     * Left side applies last color, right side opens selection dropdown.
     * @param {object} editor - The editor instance.
     * @returns {HTMLElement} The button group.
     * @private
     */
    _createColorDropdown: function(editor) {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        container.style.gap = "0"; 

        // 1. action button (apply current color)
        const actionBtn = document.createElement("button");
        actionBtn.className = "wx-editor-btn";
        actionBtn.type = "button";
        actionBtn.title = "Text Color";
        
        const icon = document.createElement("i");
        icon.className = "fas fa-a";
        icon.style.color = this._lastColor;
        icon.style.borderBottom = `2px solid ${this._lastColor}`;
        actionBtn.appendChild(icon);

        actionBtn.addEventListener("click", () => {
            editor.execCommand("foreColor", this._lastColor);
        });

        // 2. dropdown toggle button (select new color)
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
                icon.style.color = c;
                icon.style.borderBottomColor = c;
                editor.execCommand("foreColor", c);
            });
            li.appendChild(b);
            picker.appendChild(li);
        });

        // custom color picker option
        const customLi = document.createElement("li");
        const customLabel = document.createElement("label");
        customLabel.className = "dropdown-item p-0 d-flex align-items-center justify-content-center";
        customLabel.style.width = "24px";
        customLabel.style.height = "24px";
        customLabel.style.cursor = "pointer";
        customLabel.style.border = "1px solid #ccc";
        customLabel.style.borderRadius = "4px";
        customLabel.innerHTML = '<i class="fas fa-plus" style="font-size: 10px;"></i>';
        
        const customInput = document.createElement("input");
        customInput.type = "color";
        customInput.style.position = "absolute";
        customInput.style.opacity = "0";
        customInput.style.width = "0";
        customInput.style.height = "0";

        customInput.addEventListener("input", (e) => {
             const c = e.target.value;
             this._lastColor = c;
             icon.style.color = c;
             icon.style.borderBottomColor = c;
             editor.execCommand("foreColor", c);
        });

        customLabel.appendChild(customInput);
        customLi.appendChild(customLabel);
        picker.appendChild(customLi);

        menu.appendChild(picker);
        
        container.appendChild(actionBtn);
        container.appendChild(toggleBtn);
        container.appendChild(menu);
        return container;
    },

    /**
     * Creates list buttons (ordered/unordered).
     * @param {object} editor - The editor instance.
     * @returns {DocumentFragment} Fragment containing buttons.
     * @private
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
     * @param {object} editor - The editor instance.
     * @returns {DocumentFragment} Fragment containing buttons.
     * @private
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
     * Creates alignment buttons (left, center, right, justify).
     * @param {object} editor - The editor instance.
     * @returns {DocumentFragment} Fragment containing buttons.
     * @private
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
     * @param {object} editor - The editor instance.
     * @param {object} def - Button definition (cmd, icon, tip).
     * @returns {HTMLElement} The button element.
     * @private
     */
    _createBtn: function(editor, def) {
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.title = def.tip;
        btn.dataset.command = def.cmd;
        btn.type = "button";
        btn.innerHTML = `<i class="${def.icon}"></i>`;
        btn.addEventListener("click", () => {
            editor.execCommand(def.cmd);
        });
        return btn;
    }
});