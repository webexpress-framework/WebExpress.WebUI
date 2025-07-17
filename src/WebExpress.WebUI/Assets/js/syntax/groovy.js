/**
 * Syntax Highlighting Module for Groovy
 */
(function() {
    // Define the syntax components for Groovy

    // Groovy keywords
    const keywords = [
        "abstract", "as", "assert", "break", "case", "catch", "class", "const", "continue", "def", "default",
        "do", "else", "enum", "extends", "final", "finally", "for", "goto", "if", "implements", "import",
        "in", "instanceof", "interface", "native", "new", "null", "package", "private", "protected", "public",
        "return", "static", "super", "switch", "synchronized", "this", "throw", "throws", "trait", "transient",
        "try", "void", "volatile", "while", "yield"
    ];

    // Groovy types
    const types = [
        "boolean", "byte", "char", "double", "float", "int", "long", "short", "void"
    ];

    // Common Groovy operators
    const operators = [
        "\\+", "-", "\\*", "/", "%", "\\^", "=", "==", "!=", "<", ">", "<=", ">=", "&&", "\\|\\|", "!", "\\?", ":",
        "\\+=", "-=", "\\*=", "/=", "%=", "\\^=", "<<", ">>", ">>>", "&", "\\|", "~"
    ];

    // Brackets, parentheses, and braces
    const brackets = [
        "\\(", "\\)", "\\{", "\\}", "\\[", "\\]"
    ];

    // Fallback registration logic if not already defined
    if (!webexpress.webui.Syntax) {
        webexpress.webui.Syntax = {};
    }

    if (!webexpress.webui.Syntax.register) {
        webexpress.webui.Syntax.register = function(language, regex) {
            if (!this.syntax) {
                this.syntax = {};
            }
            // Store the provided regex under the specified language
            this.syntax[language] = { regex };
        };
    }

    // Register the syntax configuration for Groovy with a combined regex
    webexpress.webui.Syntax.register("groovy", new RegExp(
        [
            `(?<comment>\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/)`,  // Captures single-line and multi-line comments
            `(?<string>"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`, // Captures double and single quoted strings
            `(?<annotation>@[a-zA-Z_]\\w*)`,               // Captures annotations
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures keywords
            `(?<type>\\b(?:${types.join("|")})\\b)`,       // Captures predefined types
            `(?<number>\\b\\d+(?:\\.\\d+)?[fFdD]?\\b)`,    // Captures numbers
            `(?<operator>${operators.join("|")})`,         // Captures operators
            `(?<bracket>${brackets.join("|")})`            // Captures brackets, parentheses, and braces
        ].join("|"),
        "g" // 'g' flag ensures all matches are found
    ));
})();