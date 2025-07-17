/**
 * Syntax Highlighting Module for Java
 */
(function() {
    // Define the syntax components for Java

    // Access modifiers are separated for distinct highlighting.
    const accessModifiers = [
        "public", "private", "protected"
    ];

    // All other Java keywords.
    const keywords = [
        "abstract", "assert", "break", "case", "catch", "class", "const", "continue",
        "default", "do", "else", "enum", "extends", "final", "finally", "for", "goto",
        "if", "implements", "import", "instanceof", "interface", "native", "new", "package",
        "return", "static", "strictfp", "super", "switch", "synchronized", "this", "throw",
        "throws", "transient", "try", "void", "volatile", "while"
    ];

    // Primitive data types and common classes.
    const types = [
        "boolean", "byte", "char", "double", "float", "int", "long", "short", "String", "Object"
    ];

    // Built-in constants.
    const constants = [
        "true", "false", "null"
    ];

    // Common Java operators.
    const operators = [
        "=", "==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "&&", "||", "!", "&", "|",
        "^", "<<", ">>", ">>>", "++", "--", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=",
        "<<=", ">>=", ">>>=", "->"
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

    // Register the syntax configuration for Java with a combined regex.
    webexpress.webui.Syntax.register("java", new RegExp(
        [
            `(?<comment>\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/)`, // Captures single-line and multi-line comments.
            `(?<string>"(?:\\\\.|[^"\\\\])*")`, // Captures string literals, handling escaped quotes.
            `(?<annotation>@\\w+)`, // Captures annotations like @Override.
            `(?<accessModifier>\\b(?:${accessModifiers.join("|")})\\b)`, // Captures access modifiers.
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures other keywords.
            `(?<type>\\b(?:${types.join("|")})\\b)`, // Captures predefined type names.
            `(?<constant>\\b(?:${constants.join("|")})\\b)`, // Captures built-in constants.
            `(?<number>\\b\\d+(?:\\.\\d+)?[fLd]?\\b)`, // Captures integer, float, long, and double numbers.
            `(?<operator>${operators.map(op => `\\${op.split('').join('\\')}`).join("|")})`, // Captures operators, properly escaping them.
            `(?<bracket>${brackets.map(b => `\\${b}`).join("|")})` // Captures brackets, parentheses, and braces.
        ].join("|"),
        "g" // The 'g' flag ensures that all occurrences are matched, not just the first one.
    ));
})();