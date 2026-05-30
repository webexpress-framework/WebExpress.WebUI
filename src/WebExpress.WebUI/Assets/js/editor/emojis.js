/**
 * Plugin for inserting emojis.
 * Provides a categorized dropdown picker with search for common emojis.
 */
webexpress.webui.EditorPlugins.register("emojis", 2000, {
    _dropdown: null,
    _emojis: {
        "Faces": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "😘", "😗", "😙", "😋", "😛", "😝", "😜", "🤓", "😎", "😒", "😞", "😔", "😢", "😭", "😤", "😠", "😡", "🤬", "😈", "👿", "💀", "☠️", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤯", "🥴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥳", "🤩", "😸", "😹", "😺", "😻", "😼", "😽", "🙀", "😿", "😾"],
        "Hands": ["👋", "🤚", "🖐", "🖖", "👌", "✌️", "🤞", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "👊", "🤛", "🤜", "👏", "👐", "🤝", "🙏", "💪", "🦶", "🦵", "✍️", "🤳", "💅"],
        "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️"],
        "Animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🐢", "🐍", "🦎", "🐙", "🦑", "🦐", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊"],
        "Food": ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🍍", "🥝", "🍅", "🍆", "🥑", "🥦", "🥒", "🌶", "🌽", "🥕", "🥔", "🍠", "🥐", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🥞", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🍿", "🧂", "🥤", "🍺", "🍻", "🥂", "🍷", "🍸", "🍹", "☕", "🍵", "🧃", "🍰", "🎂", "🍩", "🍪", "🍫", "🍬", "🍭", "🍮"],
        "Objects": ["📱", "📲", "💻", "⌨️", "🖥", "🖨", "🖱", "🖲", "💽", "💾", "💿", "📀", "📷", "📸", "📹", "🎥", "📞", "☎️", "📺", "📻", "🎙", "⏰", "🔔", "📢", "🔑", "🗝", "🔒", "🔓", "📦", "📫", "📝", "📁", "📂", "📊", "📈", "📉", "📌", "📎", "🔗", "✂️", "📐", "📏", "🔧", "🔨", "⚙️", "🔩", "💡", "🔦", "🔋", "🔌"],
        "Symbols": ["✅", "❌", "⭐", "🌟", "💯", "🔥", "💧", "🎯", "💬", "💭", "🗯", "♻️", "⚠️", "🚫", "❓", "❗", "💤", "🎵", "🎶", "➕", "➖", "➗", "✖️", "♾", "💲", "©️", "®️", "™️", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔶", "🔷", "▶️", "⏸", "⏹", "⏺"],
        "Nature": ["🌸", "💐", "🌷", "🌹", "🥀", "🌺", "🌻", "🌼", "🌾", "🍀", "🍁", "🍂", "🍃", "🌿", "☀️", "🌤", "⛅", "🌥", "☁️", "🌦", "🌧", "⛈", "🌩", "🌈", "❄️", "☃️", "⛄", "🌊", "🌍", "🌎", "🌏", "⭐", "🌙", "🌛", "🌜"]
    },
    _emojiNames: {
        "😀": "grinning face", "😃": "smiley", "😄": "smile", "😁": "grin", "😆": "laughing",
        "😅": "sweat smile", "😂": "joy", "🤣": "rofl", "😊": "blush", "😇": "innocent",
        "🙂": "slightly smiling", "🙃": "upside down", "😉": "wink", "😌": "relieved",
        "😍": "heart eyes", "😘": "kissing heart", "😗": "kissing", "😙": "kissing smiling",
        "😋": "yum", "😛": "stuck out tongue", "😝": "squinting tongue", "😜": "winking tongue",
        "🤓": "nerd", "😎": "sunglasses", "😒": "unamused", "😞": "disappointed",
        "😔": "pensive", "😢": "cry", "😭": "sob", "😤": "triumph", "😠": "angry",
        "😡": "rage", "🤬": "cursing", "😈": "smiling imp", "👿": "imp", "💀": "skull",
        "😱": "scream", "😨": "fearful", "😰": "cold sweat", "😥": "sad relieved",
        "😓": "downcast sweat", "🤗": "hugging", "🤔": "thinking", "🤭": "hand over mouth",
        "🤫": "shushing", "🤥": "lying", "😶": "no mouth", "😐": "neutral",
        "😑": "expressionless", "😬": "grimacing", "🙄": "eye roll", "😯": "hushed",
        "😦": "frowning open mouth", "😧": "anguished", "😮": "open mouth", "😲": "astonished",
        "🥱": "yawning", "😴": "sleeping", "🤤": "drooling", "😪": "sleepy",
        "😵": "dizzy face", "🤯": "exploding head", "🥴": "woozy", "😷": "mask",
        "🤒": "thermometer face", "🤕": "head bandage", "🤢": "nauseated",
        "🤮": "vomiting", "🥵": "hot face", "🥶": "cold face", "🥳": "party face",
        "🤩": "star struck",
        "👋": "wave", "🤚": "raised back of hand", "🖐": "hand with fingers splayed",
        "🖖": "vulcan salute", "👌": "ok hand", "✌️": "victory", "🤞": "crossed fingers",
        "🤘": "rock on", "🤙": "call me", "👈": "point left", "👉": "point right",
        "👆": "point up", "🖕": "middle finger", "👇": "point down", "☝️": "index up",
        "👍": "thumbs up", "👎": "thumbs down", "👊": "fist bump", "🤛": "left fist",
        "🤜": "right fist", "👏": "clap", "👐": "open hands", "🤝": "handshake",
        "🙏": "pray", "💪": "flexed bicep", "✍️": "writing hand", "🤳": "selfie",
        "❤️": "red heart", "🧡": "orange heart", "💛": "yellow heart", "💚": "green heart",
        "💙": "blue heart", "💜": "purple heart", "🖤": "black heart", "🤍": "white heart",
        "🤎": "brown heart", "💔": "broken heart", "❣️": "heart exclamation",
        "💕": "two hearts", "💞": "revolving hearts", "💓": "beating heart",
        "💗": "growing heart", "💖": "sparkling heart", "💘": "arrow heart", "💝": "heart ribbon",
        "✅": "check mark", "❌": "cross mark", "⭐": "star", "🌟": "glowing star",
        "💯": "hundred points", "🔥": "fire", "💧": "droplet", "🎯": "direct hit",
        "💬": "speech balloon", "🗯": "anger bubble", "♻️": "recycling", "⚠️": "warning",
        "🚫": "prohibited", "❓": "question", "❗": "exclamation", "💤": "sleeping zzz",
        "🎵": "musical note", "🎶": "musical notes"
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
        btn.title = webexpress.webui.I18N.translate("webexpress.webui:editor.insert.emoji");
        btn.innerHTML = `<i class="${webexpress.webui.IconTheme.resolveFa("far fa-smile")}"></i>`;
        btn.setAttribute("data-bs-toggle", "dropdown");
        btn.setAttribute("aria-expanded", "false");

        // create dropdown content
        this._dropdown = this._createDropdown(editor);

        group.appendChild(btn);
        group.appendChild(this._dropdown);

        return group;
    },

    /**
     * Representative glyph shown on each category tab.
     */
    _categoryIcons: {
        "Faces": "😀", "Hands": "👋", "Hearts": "❤️", "Animals": "🐶",
        "Food": "🍎", "Objects": "📱", "Symbols": "✅", "Nature": "🌸"
    },

    /**
     * Builds the dropdown menu containing search, category tabs and emoji grid.
     * @param {object} editor - the editor instance
     * @returns {HTMLElement} dropdown menu element
     */
    _createDropdown: function(editor) {
        const menu = document.createElement("div");
        menu.className = "dropdown-menu shadow wx-emoji-picker";

        // sticky search bar
        const searchWrap = document.createElement("div");
        searchWrap.className = "wx-emoji-search-wrap";

        const searchIcon = document.createElement("i");
        searchIcon.className = webexpress.webui.IconTheme.resolveFa("fas fa-search") + " wx-emoji-search-icon";
        searchWrap.appendChild(searchIcon);

        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "wx-emoji-search";
        searchInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.emoji.search");
        searchInput.setAttribute("aria-label", webexpress.webui.I18N.translate("webexpress.webui:editor.emoji.search.label"));
        searchWrap.appendChild(searchInput);
        menu.appendChild(searchWrap);

        // category tabs (icon based)
        const tabs = document.createElement("div");
        tabs.className = "wx-emoji-tabs";

        // scrollable content with a sticky category title
        const content = document.createElement("div");
        content.className = "wx-emoji-content";

        const title = document.createElement("div");
        title.className = "wx-emoji-cat-title";
        content.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "wx-emoji-grid";
        content.appendChild(grid);

        const categories = Object.keys(this._emojis);
        const selectCategory = (category, tabBtn) => {
            searchInput.value = "";
            tabs.querySelectorAll(".wx-emoji-tab").forEach(b => b.classList.remove("active"));
            if (tabBtn) {
                tabBtn.classList.add("active");
            }
            this._renderCategory(title, grid, category, editor, menu);
            content.scrollTop = 0;
        };

        categories.forEach((category, index) => {
            const tab = document.createElement("button");
            tab.type = "button";
            tab.className = "wx-emoji-tab";
            tab.textContent = this._categoryIcons[category] || (this._emojis[category][0] || "•");
            tab.title = category;
            tab.setAttribute("aria-label", category);

            if (index === 0) {
                tab.classList.add("active");
                this._renderCategory(title, grid, category, editor, menu);
            }

            tab.addEventListener("click", () => selectCategory(category, tab));
            tabs.appendChild(tab);
        });

        // wire search input
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length === 0) {
                const activeTab = tabs.querySelector(".wx-emoji-tab.active") || tabs.querySelector(".wx-emoji-tab");
                const cat = activeTab ? activeTab.title : categories[0];
                this._renderCategory(title, grid, cat, editor, menu);
            } else {
                this._renderSearchResults(title, grid, query, editor, menu);
            }
        });
        searchInput.addEventListener("click", (e) => e.stopPropagation());

        menu.appendChild(tabs);
        menu.appendChild(content);

        // keep the dropdown open while interacting inside it
        menu.addEventListener("click", (e) => e.stopPropagation());

        return menu;
    },

    /**
     * Renders search results matching the query across all categories.
     * @param {HTMLElement} title - the category title element
     * @param {HTMLElement} grid - the emoji grid element
     * @param {string} query - lowercase search query
     * @param {object} editor - the editor instance
     * @param {HTMLElement} menu - dropdown menu element
     */
    _renderSearchResults: function(title, grid, query, editor, menu) {
        grid.innerHTML = "";
        title.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.emoji.search.label");

        let found = false;
        const seen = new Set();
        Object.values(this._emojis).forEach(emojis => {
            emojis.forEach(emoji => {
                if (seen.has(emoji)) {
                    return;
                }
                const name = (this._emojiNames[emoji] || emoji).toLowerCase();
                if (name.includes(query) || emoji.includes(query)) {
                    found = true;
                    seen.add(emoji);
                    grid.appendChild(this._createEmojiButton(emoji, editor, menu));
                }
            });
        });

        if (!found) {
            const msg = document.createElement("div");
            msg.className = "wx-emoji-empty";
            msg.textContent = webexpress.webui.I18N.translate("webexpress.webui:editor.emoji.notfound");
            grid.appendChild(msg);
        }
    },

    /**
     * Renders a grid of emojis for the given category.
     * @param {HTMLElement} title - the category title element
     * @param {HTMLElement} grid - the emoji grid element
     * @param {string} category - emoji category key
     * @param {object} editor - the editor instance
     * @param {HTMLElement} menu - dropdown menu element (used to close dropdown)
     */
    _renderCategory: function(title, grid, category, editor, menu) {
        grid.innerHTML = "";
        title.textContent = category;
        this._emojis[category].forEach(emoji => {
            grid.appendChild(this._createEmojiButton(emoji, editor, menu));
        });
    },

    /**
     * Creates a single emoji button element.
     * @param {string} emoji - the emoji character
     * @param {object} editor - the editor instance
     * @param {HTMLElement} menu - dropdown menu element
     * @returns {HTMLElement} the button element
     */
    _createEmojiButton: function(emoji, editor, menu) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wx-emoji-btn";
        btn.textContent = emoji;

        const name = this._emojiNames[emoji] || emoji;
        btn.title = name;
        btn.setAttribute("aria-label", name);

        // keep the editor caret alive so the emoji is inserted at the cursor
        btn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            if (typeof editor._saveCurrentSelection === "function") {
                editor._saveCurrentSelection();
            }
        });

        btn.addEventListener("click", () => {
            editor.execCommand("insertText", emoji);
            menu.classList.remove("show");
            if (menu.previousElementSibling) {
                menu.previousElementSibling.classList.remove("show");
                menu.previousElementSibling.setAttribute("aria-expanded", "false");
            }
        });

        return btn;
    }
});