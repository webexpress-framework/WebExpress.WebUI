/**
 * Syntax Highlighting Module for JavaScript
 */
(function() {
    // Define the syntax components for JavaScript

    // JavaScript keywords, including control flow, declarations, and classes.
    const keywords = [
        "abstract", "arguments", "await", "break", "case", "catch", "class", "const", "continue",
        "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "finally",
        "for", "function", "if", "implements", "import", "in", "instanceof", "interface", "let",
        "new", "package", "private", "protected", "public", "return", "static", "super",
        "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"
    ];

    // Built-in constants and special values.
    const constants = [
        "true", "false", "null", "undefined", "NaN", "Infinity"
    ];

    // Common JavaScript operators.
    const operators = [
        "=", "==", "===", "!=", "!==", ">", "<", ">=", "<=", "+", "-", "*", "/", "%", "&&", "||", "!",
        "&", "|", "^", "<<", ">>", ">>>", "=>", "...", "++", "--"
    ];

    // Brackets, parentheses, and braces are captured for styling.
    const brackets = [
        "(", ")", "{", "}", "[", "]"
    ];

    // Fallback registration logic if not already defined.
    if (!webexpress.webui.Syntax) {
        webexpress.webui.Syntax = {};
    }

    if (!webexpress.webui.Syntax.register) {
        webexpress.webui.Syntax.register = function(language, regex) {
            if (!this.syntax) {
                this.syntax = {};
            }
            // Store the provided regex under the specified language.
            this.syntax[language] = { regex };
        };
    }

    // Register the syntax configuration for JavaScript with a combined regex.
    webexpress.webui.Syntax.register("javascript", new RegExp(
        [
            `(?<comment>\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/)`, // Captures single-line and multi-line comments.
            `(?<string>'(?:\\\\.|[^'\\\\])*'|"(?:\\\\.|[^"\\\\])*"|\`(?:\\\\.|[^\`\\\\])*\`)`, // Captures single, double, and template literal strings.
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures keywords.
            `(?<constant>\\b(?:${constants.join("|")})\\b)`, // Captures built-in constants.
            `(?<number>\\b\\d+(?:\\.\\d+)?\\b)`, // Captures integer and floating-point numbers.
            `(?<operator>${operators.map(op => `\\${op.split('').join('\\')}`).join("|")})`, // Captures operators, properly escaping them.
            `(?<bracket>${brackets.map(b => `\\${b}`).join("|")})` // Captures brackets, parentheses, and braces.
        ].join("|"),
        "g" // The 'g' flag ensures that all occurrences are matched, not just the first one.
    ));
})();