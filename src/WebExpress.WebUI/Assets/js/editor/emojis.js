/**
 * Plugin for inserting emojis.
 * Provides a categorized dropdown picker for common emojis.
 */
webexpress.webui.EditorPlugins.register("emojis", 2000, {
    _dropdown: null,
    _emojis: {
        "Faces": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "😘", "😗", "😙", "😋", "😛", "😝", "😜", "🤓", "😎", "😒", "😞", "😔"],
        "Hands": ["👋", "🤚", "🖐", "🖖", "👌", "✌️", "🤞", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "👊", "🤛", "🤜", "👏", "👐", "🤝", "🙏"],
        "Hearts": ["❤️", "💛", "💚", "💙", "💜", "🖤", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
        "Animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁"],
        "Food": ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🍍", "🥝", "🍅", "🍆", "🥑"],
        "Objects": ["📱", "📲", "💻", "⌨️", "🖥", "🖨", "🖱", "🖲", "💽", "💾", "💿", "📀"]
    },

    /**
     * Initialization hook called by the editor when plugin is registered.
     * No special setup required for emoji plugin.
     * @param {object} editor - the editor instance (unused)
     * @returns {void}
     */
    init: function(editor) {
        // no initialization required
    },

    /**
     * Creates toolbar controls for the plugin.
     * returns a DOM node (button group) that will be inserted into the editor toolbar.
     * @param {object} editor - the editor instance
     * @returns {HTMLElement} toolbar group element
     */
    createToolbar: function(editor) {
        // create button group
        const group = document.createElement("div");
        group.className = "wx-editor-btn-group";

        // create trigger button
        const btn = document.createElement("button");
        btn.className = "wx-editor-btn dropdown-toggle";
        btn.type = "button";
        btn.title = "Insert Emoji";
        btn.innerHTML = '<i class="far fa-smile"></i>';
        btn.setAttribute("data-bs-toggle", "dropdown");
        btn.setAttribute("aria-expanded", "false");

        // create dropdown content
        this._dropdown = this._createDropdown(editor);

        group.appendChild(btn);
        group.appendChild(this._dropdown);

        return group;
    },

    /**
     * Builds the dropdown menu containing category tabs and emoji grid.
     * @param {object} editor - the editor instance
     * @returns {HTMLElement} dropdown menu element
     */
    _createDropdown: function(editor) {
        // create container for menu
        const menu = document.createElement("div");
        menu.className = "dropdown-menu shadow p-0";
        menu.style.width = "320px";
        menu.style.maxHeight = "400px";
        menu.style.overflow = "hidden"; // hidden because tabs will scroll content

        // header with category tabs
        const header = document.createElement("div");
        header.className = "d-flex border-bottom bg-light";
        header.style.overflowX = "auto";
        header.style.whiteSpace = "nowrap";

        // content area where emojis are rendered
        const content = document.createElement("div");
        content.className = "p-2";
        content.style.maxHeight = "300px";
        content.style.overflowY = "auto";

        // render tabs for each category
        let firstCategory = true;
        Object.keys(this._emojis).forEach(category => {
            const tab = document.createElement("button");
            tab.type = "button";
            tab.className = "btn btn-sm btn-light border-0 rounded-0 px-3";
            tab.textContent = category;

            if (firstCategory) {
                tab.classList.add("active", "fw-bold");
                this._renderCategory(content, category, editor, menu);
                firstCategory = false;
            }

            tab.addEventListener("click", (e) => {
                // update tab visual state
                header.querySelectorAll("button").forEach(b => {
                    b.classList.remove("active", "fw-bold");
                });
                e.target.classList.add("active", "fw-bold");

                // render content for selected category
                this._renderCategory(content, category, editor, menu);
            });

            header.appendChild(tab);
        });

        menu.appendChild(header);
        menu.appendChild(content);

        // prevent dropdown from closing when interacting inside it
        menu.addEventListener("click", (e) => {
             e.stopPropagation();
        });

        return menu;
    },

    /**
     * Renders a grid of emojis for the given category into the provided container.
     * clicking an emoji inserts it into the editor.
     * @param {HTMLElement} container - target element to place emoji grid
     * @param {string} category - emoji category key
     * @param {object} editor - the editor instance
     * @param {HTMLElement} menu - dropdown menu element (used to close dropdown)
     */
    _renderCategory: function(container, category, editor, menu) {
        // clear previous content
        container.innerHTML = "";

        // create a responsive grid
        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(32px, 1fr))";
        grid.style.gap = "4px";

        // render each emoji as a button
        this._emojis[category].forEach(emoji => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-sm btn-light p-0 d-flex align-items-center justify-content-center";
            btn.style.width = "100%";
            btn.style.height = "32px";
            btn.style.fontSize = "1.2rem";
            btn.textContent = emoji;
            btn.title = emoji; // simple tooltip

            btn.addEventListener("click", () => {
                // insert emoji as plain text at caret position
                editor.execCommand("insertText", emoji);
                // close dropdown: remove 'show' class from menu and its trigger if present
                menu.classList.remove("show");
                if (menu.previousElementSibling) {
                    menu.previousElementSibling.classList.remove("show");
                    menu.previousElementSibling.setAttribute("aria-expanded", "false");
                }
            });

            grid.appendChild(btn);
        });

        container.appendChild(grid);
    }
});