/**
 * Syntax Highlighting Module for Markdown
 */
(function () {
    // Sicherstellen, dass die Syntax-Registry existiert
    if (!webexpress.webui.Syntax) {
        webexpress.webui.Syntax = {};
    }

    if (!webexpress.webui.Syntax.register) {
        webexpress.webui.Syntax.register = function (language, regex) {
            if (!this.syntax) {
                this.syntax = {};
            }
            // Speichert die Regex für die spezifische Sprache
            this.syntax[language] = { regex };
        };
    }

    // Registrierung der Markdown-Syntax und ihrer Bestandteile
    webexpress.webui.Syntax.register("markdown", new RegExp(
        [
            // Überschriften (z.B. # Heading, ## Subheading)
            `(?<heading>^\\s*#{1,6}\\s.*$)`,
            // Unnummerierte Listen (z.B. - Item, * Item, + Item)
            `(?<listUnordered>^\\s*[-*+]\\s.*$)`,
            // Nummerierte Listen (z.B. 1. Item, 2. Item)
            `(?<listOrdered>^\\s*\\d+\\.\\s.*$)`,
            // Links (z.B. [Text](URL))
            `(?<link>\\[.*?\\]\\(.*?\\))`,
            // Bilder (z.B. ![Alt Text](URL))
            `(?<image>!\\[.*?\\]\\(.*?\\))`,
            // Inline-Code (z.B. `code`)
            `(?<inlineCode>\`.*?\`)`,
            // Block-Code (z.B. ```code```)
            `(?<blockCode>\\\`\\\`\\\`[\\s\\S]*?\\\`\\\`\\\`)`,
            // Zitate (z.B. > Quote)
            `(?<blockquote>^\\s*>\\s.*$)`,
            // Fett formatiert (z.B. **bold**)
            `(?<bold>\\*\\*.*?\\*\\*)`,
            // Kursiv formatiert (z.B. *italic*)
            `(?<italic>\\*.*?\\*)`
        ].join("|"),
        "gm" // 'g' für globale Suche, 'm' für Multiline-Modus
    ));
})();