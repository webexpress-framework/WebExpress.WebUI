/**
 * Syntax Highlighting Module for XML
 */
(function () {
    // Define the syntax components for XML

    // Fallback registration logic if not already defined.
    if (!webexpress.webui.Syntax) {
        webexpress.webui.Syntax = {};
    }

    if (!webexpress.webui.Syntax.register) {
        webexpress.webui.Syntax.register = function (language, regex) {
            if (!this.syntax) {
                this.syntax = {};
            }
            // Store the provided regex under the specified language.
            this.syntax[language] = { regex };
        };
    }

    // Register the syntax configuration for XML with a combined regex.
    // The regex is structured to first find the most specific tokens like comments and CDATA,
    // then tags and their components like attributes and strings.
    webexpress.webui.Syntax.register("xml", new RegExp(
        [
            // Captures comments.
            `(?<comment><!--[\\s\\S]*?-->)`,
            // Captures CDATA sections.
            `(?<cdata><!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`,
            // Captures processing instructions, e.g., <?xml ... ?>.
            `(?<pi><\\?.*?\\?>)`,
            // Captures DOCTYPE declarations.
            `(?<doctype><!DOCTYPE[^>]*>)`,
            // Captures closing tags, e.g., </tag>. The bracket and tag name are captured separately.
            `(?<closeBracket><\\/)(?<closingTag>[a-zA-Z0-9_\\.-]+)(?<closeBracketEnd>\\s*>)`,
            // Captures opening and self-closing tags.
            `(?<openBracket><)(?<openingTag>[a-zA-Z0-9_\\.-]+)`,
            // Captures attributes within a tag.
            `(?<attribute>\\s+[a-zA-Z0-9_\\.-]+)=`,
            // Captures attribute values in quotes.
            `(?<string>"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`,
            // Captures the closing brackets of tags.
            `(?<selfClosingBracket>\\s*\\/?>)`
        ].join("|"),
        "g" // 'g' for global search to find all matches.
    ));
})();