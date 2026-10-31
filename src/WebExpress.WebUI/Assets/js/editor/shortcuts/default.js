/** Registers the default slash commands. */
(function () {
    const ui = webexpress.webui;

    /**
     * Resolves a slash-command text. The texts are fixed while registering, so this
     * file loads after the language bundles.
     * @param {string} key The key suffix below editor.slash.
     * @returns {string} The localized text.
     */
    const t = key => ui.I18N.translate("webexpress.webui:editor.slash." + key);

    /**
     * Registers a command whose label and description are keyed by its id.
     * @param {string} id The command id.
     * @param {string} category The category key suffix.
     * @param {object} definition The remaining command definition.
     */
    const register = (id, category, definition) => ui.EditorShortcuts.register(id, Object.assign({
        label: t(id),
        description: t(id + ".description"),
        category: t("cat." + category)
    }, definition));

    // --- Text blocks ---
    register("block.paragraph", "text", { icon: "paragraph", keywords: ["p", "text", "absatz"], tag: "P" });
    register("block.heading1", "text", { icon: "heading", keywords: ["h1", "title", "überschrift"], tag: "H1" });
    register("block.heading2", "text", { icon: "heading", keywords: ["h2"], tag: "H2" });
    register("block.heading3", "text", { icon: "heading", keywords: ["h3"], tag: "H3" });
    register("block.heading4", "text", { icon: "heading", keywords: ["h4"], tag: "H4" });
    register("block.heading5", "text", { icon: "heading", keywords: ["h5"], tag: "H5" });
    register("block.heading6", "text", { icon: "heading", keywords: ["h6"], tag: "H6" });
    register("block.quote", "text", { icon: "quote-right", keywords: ["zitat", "blockquote", ">"], tag: "BLOCKQUOTE" });
    register("block.code", "text", { icon: "code", keywords: ["code", "pre", "```"], tag: "PRE" });

    // --- Lists ---
    register("list.bullet", "list", { icon: "list-ul", keywords: ["ul", "bullet", "liste", "punkt", "-"], cmd: "insertUnorderedList" });
    register("list.number", "list", { icon: "list-ol", keywords: ["ol", "number", "nummerierung", "1."], cmd: "insertOrderedList" });

    // --- Insert ---
    register("insert.date", "insert", {
        icon: "calendar-day",
        keywords: ["date", "today", "heute", "datum"],
        execute: (editor) => {
            const text = new Date().toLocaleDateString(ui.I18N.language, { year: "numeric", month: "2-digit", day: "2-digit" });
            editor.insertHtmlAtCursor(text + "&nbsp;");
        }
    });

    register("insert.datetime", "insert", {
        icon: "clock",
        keywords: ["now", "jetzt", "zeit", "time"],
        execute: (editor) => {
            const text = new Date().toLocaleString(ui.I18N.language, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
            editor.insertHtmlAtCursor(text + "&nbsp;");
        }
    });

    register("insert.hr", "insert", { icon: "minus", keywords: ["hr", "divider", "trennlinie", "linie", "---"], html: "<hr><p><br></p>" });

    register("insert.link", "insert", {
        icon: "link",
        keywords: ["link", "url", "anchor", "verweis"],
        execute: (editor) => {
            const media = editor._plugins.find(p => typeof p?.openLink === "function");
            if (media) {
                media.openLink(editor);
                return;
            }
            const url = prompt(ui.I18N.translate("webexpress.webui:editor.link.url.label"));
            if (!url) return;
            const text = prompt(ui.I18N.translate("webexpress.webui:editor.link.text.placeholder")) || url;
            editor.insertHtmlAtCursor(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>&nbsp;`);
        }
    });

    register("insert.image", "insert", {
        icon: "image",
        keywords: ["image", "img", "picture", "bild", "foto"],
        execute: (editor) => {
            const media = editor._plugins.find(p => typeof p?.openImage === "function");
            if (media) {
                media.openImage(editor);
                return;
            }
            const url = prompt(ui.I18N.translate("webexpress.webui:editor.image.url.label"));
            if (!url) return;
            editor.insertHtmlAtCursor(`<img src="${url}" alt="">`);
        }
    });

    register("insert.addon", "insert", {
        icon: "puzzle",
        keywords: ["addon", "widget", "embed", "einfügen"],
        execute: (editor) => {
            // the editor's own plugin copy, because the add-on dialog submits through editor._addonPlugin
            const addons = editor._addonPlugin;
            if (addons) {
                addons._openModal(editor, "_selectionModal", "editor-addon", "webexpress.webui:editor.insert.addon.title");
            }
        }
    });

    // --- Format ---
    register("format.clear", "format", { icon: "eraser", keywords: ["clear", "remove", "format", "entfernen"], cmd: "removeFormat" });
})();
