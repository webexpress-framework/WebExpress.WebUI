// register default slash commands immediately

// --- Text blocks ---
webexpress.webui.EditorShortcuts.register("block.paragraph", {
    label: "Paragraph",
    description: "Plain text paragraph",
    icon: "paragraph",
    category: "Text",
    keywords: ["p", "text", "absatz"],
    tag: "P"
});

webexpress.webui.EditorShortcuts.register("block.heading1", {
    label: "Heading 1",
    description: "Large section heading",
    icon: "heading",
    category: "Text",
    keywords: ["h1", "title", "überschrift"],
    tag: "H1"
});

webexpress.webui.EditorShortcuts.register("block.heading2", {
    label: "Heading 2",
    description: "Medium section heading",
    icon: "heading",
    category: "Text",
    keywords: ["h2"],
    tag: "H2"
});

webexpress.webui.EditorShortcuts.register("block.heading3", {
    label: "Heading 3",
    description: "Small section heading",
    icon: "heading",
    category: "Text",
    keywords: ["h3"],
    tag: "H3"
});

webexpress.webui.EditorShortcuts.register("block.heading4", {
    label: "Heading 4",
    description: "Sub-heading",
    icon: "heading",
    category: "Text",
    keywords: ["h4"],
    tag: "H4"
});

webexpress.webui.EditorShortcuts.register("block.heading5", {
    label: "Heading 5",
    description: "Minor heading",
    icon: "heading",
    category: "Text",
    keywords: ["h5"],
    tag: "H5"
});

webexpress.webui.EditorShortcuts.register("block.heading6", {
    label: "Heading 6",
    description: "Smallest heading",
    icon: "heading",
    category: "Text",
    keywords: ["h6"],
    tag: "H6"
});

webexpress.webui.EditorShortcuts.register("block.quote", {
    label: "Quote",
    description: "Block quote",
    icon: "quote-right",
    category: "Text",
    keywords: ["zitat", "blockquote", ">"],
    tag: "BLOCKQUOTE"
});

webexpress.webui.EditorShortcuts.register("block.code", {
    label: "Code Block",
    description: "Monospaced code block",
    icon: "code",
    category: "Text",
    keywords: ["code", "pre", "```"],
    tag: "PRE"
});

// --- Lists ---
webexpress.webui.EditorShortcuts.register("list.bullet", {
    label: "Bullet",
    description: "Unordered list",
    icon: "list-ul",
    category: "List",
    keywords: ["ul", "bullet", "liste", "punkt", "-"],
    cmd: "insertUnorderedList"
});

webexpress.webui.EditorShortcuts.register("list.number", {
    label: "Numbered list",
    description: "Ordered list",
    icon: "list-ol",
    category: "List",
    keywords: ["ol", "number", "nummerierung", "1."],
    cmd: "insertOrderedList"
});

// --- Insert ---
webexpress.webui.EditorShortcuts.register("insert.date", {
    label: "Date",
    description: "Insert today's date",
    icon: "calendar-day",
    category: "Insert",
    keywords: ["date", "today", "heute", "datum"],
    execute: (editor) => {
        const lang = webexpress?.webui?.I18N?.language || navigator.language || "en";
        const text = new Date().toLocaleDateString(lang, { year: "numeric", month: "2-digit", day: "2-digit" });
        editor.insertHtmlAtCursor(text + "&nbsp;");
    }
});

webexpress.webui.EditorShortcuts.register("insert.datetime", {
    label: "Date & time",
    description: "Insert current date and time",
    icon: "clock",
    category: "Insert",
    keywords: ["now", "jetzt", "zeit", "time"],
    execute: (editor) => {
        const lang = webexpress?.webui?.I18N?.language || navigator.language || "en";
        const text = new Date().toLocaleString(lang, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
        editor.insertHtmlAtCursor(text + "&nbsp;");
    }
});

webexpress.webui.EditorShortcuts.register("insert.hr", {
    label: "Horizontal Rule",
    description: "Horizontal divider line",
    icon: "minus",
    category: "Insert",
    keywords: ["hr", "divider", "trennlinie", "linie", "---"],
    html: "<hr><p><br></p>"
});

webexpress.webui.EditorShortcuts.register("insert.link", {
    label: "Insert Link",
    description: "Add a hyperlink",
    icon: "link",
    category: "Insert",
    keywords: ["link", "url", "anchor", "verweis"],
    execute: (editor) => {
        const media = (webexpress.webui.EditorPlugins.getAll() || []).find(p => p && p.linkModal !== undefined);
        if (media && typeof media._openModal === "function") {
            media._openModal(editor, "linkModal", "editor-link", "webexpress.webui:editor.insert.link.title", { url: "", text: "" }, editor._savedRange?.cloneRange?.() || null);
            return;
        }
        const url = prompt("URL");
        if (!url) return;
        const text = prompt("Text (optional)") || url;
        editor.insertHtmlAtCursor(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>&nbsp;`);
    }
});

webexpress.webui.EditorShortcuts.register("insert.image", {
    label: "Insert Image",
    description: "Embed an image by URL",
    icon: "image",
    category: "Insert",
    keywords: ["image", "img", "picture", "bild", "foto"],
    execute: (editor) => {
        const media = (webexpress.webui.EditorPlugins.getAll() || []).find(p => p && p.imageModal !== undefined);
        if (media && typeof media._openModal === "function") {
            media._openModal(editor, "imageModal", "editor-image", "webexpress.webui:editor.insert.image.title", null, editor._savedRange?.cloneRange?.() || null);
            return;
        }
        const url = prompt("Image URL");
        if (!url) return;
        editor.insertHtmlAtCursor(`<img src="${url}" alt="">`);
    }
});

webexpress.webui.EditorShortcuts.register("insert.addon", {
    label: "Insert AddOn",
    description: "Open the AddOn library",
    icon: "puzzle",
    category: "Insert",
    keywords: ["addon", "widget", "embed", "einfügen"],
    execute: (editor) => {
        const addons = (webexpress.webui.EditorPlugins.getAll() || []).find(p => p && typeof p._openModal === "function" && p._selectionModal !== undefined);
        if (addons) {
            addons._openModal(editor, "_selectionModal", "editor-addon", "webexpress.webui:editor.insert.addon.title", editor._savedRange?.cloneRange?.() || null);
        }
    }
});

// --- Format ---
webexpress.webui.EditorShortcuts.register("format.clear", {
    label: "Clear Format",
    description: "Remove all formatting from selection",
    icon: "eraser",
    category: "Format",
    keywords: ["clear", "remove", "format", "entfernen"],
    cmd: "removeFormat"
});