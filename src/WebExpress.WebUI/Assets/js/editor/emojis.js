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
     * Builds the dropdown menu containing search, category tabs and emoji grid.
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

        // search bar
        const searchWrap = document.createElement("div");
        searchWrap.className = "p-2 border-bottom";
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "form-control form-control-sm";
        searchInput.placeholder = "Search emoji...";
        searchInput.setAttribute("aria-label", "Search emoji");
        searchWrap.appendChild(searchInput);
        menu.appendChild(searchWrap);

        // header with category tabs
        const header = document.createElement("div");
        header.className = "d-flex border-bottom bg-light";
        header.style.overflowX = "auto";
        header.style.whiteSpace = "nowrap";

        // content area where emojis are rendered
        const content = document.createElement("div");
        content.className = "p-2";
        content.style.maxHeight = "260px";
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
                // clear search when switching tabs
                searchInput.value = "";
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

        // wire search input
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length === 0) {
                // revert to active tab's category
                const activeTab = header.querySelector("button.active");
                const cat = activeTab ? activeTab.textContent : Object.keys(this._emojis)[0];
                this._renderCategory(content, cat, editor, menu);
            } else {
                this._renderSearchResults(content, query, editor, menu);
            }
        });

        // prevent dropdown from closing when typing in search
        searchInput.addEventListener("click", (e) => {
            e.stopPropagation();
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
     * Renders search results matching the query across all categories.
     * @param {HTMLElement} container - target element
     * @param {string} query - lowercase search query
     * @param {object} editor - the editor instance
     * @param {HTMLElement} menu - dropdown menu element
     */
    _renderSearchResults: function(container, query, editor, menu) {
        container.innerHTML = "";

        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(32px, 1fr))";
        grid.style.gap = "4px";

        let found = false;
        Object.values(this._emojis).forEach(emojis => {
            emojis.forEach(emoji => {
                const name = (this._emojiNames[emoji] || emoji).toLowerCase();
                if (name.indexOf(query) !== -1 || emoji.indexOf(query) !== -1) {
                    found = true;
                    grid.appendChild(this._createEmojiButton(emoji, editor, menu));
                }
            });
        });

        if (!found) {
            const msg = document.createElement("div");
            msg.className = "text-muted text-center p-3";
            msg.textContent = "No emojis found";
            container.appendChild(msg);
        } else {
            container.appendChild(grid);
        }
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
            grid.appendChild(this._createEmojiButton(emoji, editor, menu));
        });

        container.appendChild(grid);
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
        btn.className = "btn btn-sm btn-light p-0 d-flex align-items-center justify-content-center";
        btn.style.width = "100%";
        btn.style.height = "32px";
        btn.style.fontSize = "1.2rem";
        btn.textContent = emoji;

        const name = this._emojiNames[emoji] || emoji;
        btn.title = name;
        btn.setAttribute("aria-label", name);

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

        return btn;
    }
});