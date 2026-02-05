/**
 * Plugin for basic text formatting (bold, italic, colors, fonts).
 */
webexpress.webui.EditorPlugins.register("formatting", {
    _lastColor: "#000000", // Stores the current active color

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

    init: function(editor) {
        document.addEventListener("selectionchange", () => { 
            this._updateButtonStates(editor); 
        });
    },

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

    _updateButtonStates: function(editor) {
        const buttons = document.querySelectorAll(".wx-editor-btn");
        buttons.forEach((button) => {
            const isActive = button.dataset.command ? document.queryCommandState(button.dataset.command) : false;
            button.classList.toggle("active", isActive);
        });
    },

    _createSeparator: function() {
        const s = document.createElement("span");
        s.className = "wx-editor-separator";
        return s;
    },

    _createFormatDropdown: function(editor) {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        
        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
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

    _createBasicButtons: function(editor) {
        const frag = document.createDocumentFragment();
        const defs = [
            { cmd: "bold", icon: "fas fa-bold", tip: "Bold" },
            { cmd: "italic", icon: "fas fa-italic", tip: "Italic" },
            { cmd: "underline", icon: "fas fa-underline", tip: "Underline" }
        ];
        defs.forEach((d) => { frag.appendChild(this._createBtn(editor, d)); });
        return frag;
    },

    _createStyleDropdown: function(editor) {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn dropdown-toggle";
        btn.innerHTML = '<i class="fas fa-text-height"></i>';
        btn.setAttribute("data-bs-toggle", "dropdown");
        
        const menu = document.createElement("ul");
        menu.className = "dropdown-menu";
        
        const opts = [
            { cmd: "strikethrough", icon: "fas fa-strikethrough", lbl: "Strike" },
            { cmd: "superscript", icon: "fas fa-superscript", lbl: "Super" },
            { cmd: "subscript", icon: "fas fa-subscript", lbl: "Sub" }
        ];
        opts.forEach((o) => {
            const li = document.createElement("li");
            const b = document.createElement("button");
            b.className = "dropdown-item";
            b.innerHTML = `<i class="${o.icon}"></i> ${o.lbl}`;
            b.addEventListener("click", () => { editor.execCommand(o.cmd); });
            li.appendChild(b);
            menu.appendChild(li);
        });
        container.appendChild(btn);
        container.appendChild(menu);
        return container;
    },

    _createColorDropdown: function(editor) {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        container.style.gap = "0"; 

        // 1. Action Button (Apply current color)
        const actionBtn = document.createElement("button");
        actionBtn.className = "wx-editor-btn";
        actionBtn.type = "button";
        actionBtn.title = "Text Color";
        
        const icon = document.createElement("i");
        icon.className = "fas fa-palette";
        icon.style.color = this._lastColor;
        icon.style.borderBottom = `2px solid ${this._lastColor}`;
        actionBtn.appendChild(icon);

        actionBtn.addEventListener("click", () => {
            editor.execCommand("foreColor", this._lastColor);
        });

        // 2. Dropdown Toggle Button (Select new color)
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

    _createListButtons: function(editor) {
        const frag = document.createDocumentFragment();
        [
            { cmd: "insertUnorderedList", icon: "fas fa-list-ul", tip: "Bullet" },
            { cmd: "insertOrderedList", icon: "fas fa-list-ol", tip: "Number" }
        ].forEach((d) => { frag.appendChild(this._createBtn(editor, d)); });
        return frag;
    },

    _createIndentButtons: function(editor) {
        const frag = document.createDocumentFragment();
        [
            { cmd: "outdent", icon: "fas fa-outdent", tip: "Less" },
            { cmd: "indent", icon: "fas fa-indent", tip: "More" }
        ].forEach((d) => { frag.appendChild(this._createBtn(editor, d)); });
        return frag;
    },

    _createAlignButtons: function(editor) {
        const frag = document.createDocumentFragment();
        [
            { cmd: "justifyLeft", icon: "fas fa-align-left", tip: "Left" },
            { cmd: "justifyCenter", icon: "fas fa-align-center", tip: "Center" },
            { cmd: "justifyRight", icon: "fas fa-align-right", tip: "Right" },
            { cmd: "justifyFull", icon: "fas fa-align-justify", tip: "Justify" }
        ].forEach((d) => { frag.appendChild(this._createBtn(editor, d)); });
        return frag;
    },

    _createBtn: function(editor, def) {
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn";
        btn.title = def.tip;
        btn.dataset.command = def.cmd;
        btn.innerHTML = `<i class="${def.icon}"></i>`;
        btn.addEventListener("click", () => {
            editor.execCommand(def.cmd);
        });
        return btn;
    }
});