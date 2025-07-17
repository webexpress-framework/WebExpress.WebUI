/**
 * Syntax Highlighting Module for C#
 */
(function() {
    // Define the syntax components for C#

    // Access modifiers are separated for distinct highlighting.
    const accessModifiers = [
        "public", "private", "protected", "internal"
    ];

    // All other C# keywords.
    const keywords = [
        "abstract", "as", "base", "bool", "break", "byte", "case", "catch", "char", "checked", "class",
        "const", "continue", "decimal", "default", "delegate", "do", "double", "else", "enum", "event",
        "explicit", "extern", "false", "finally", "fixed", "float", "for", "foreach", "goto", "if", "implicit",
        "in", "int", "interface", "is", "lock", "long", "namespace", "new", "null", "object",
        "operator", "out", "override", "params", "readonly", "ref", "return",
        "sbyte", "sealed", "short", "sizeof", "stackalloc", "static", "string", "struct", "switch", "this",
        "throw", "true", "try", "typeof", "uint", "ulong", "unchecked", "unsafe", "ushort", "using", "virtual",
        "void", "volatile", "while"
    ];

    // C# specific types.
    const types = [
        "int", "string", "bool", "double", "float", "char", "long", "short", "decimal", "byte", "sbyte", "uint", "ulong", "ushort", "object"
    ];

    // Common C# operators.
    const operators = [
        "=", "==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "&&", "||", "!", "&", "|", "^", "<<", ">>", "??"
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

    // Register the syntax configuration for C# with a combined regex.
    webexpress.webui.Syntax.register("csharp", new RegExp(
        [
            `(?<comment>\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/)`,       // Captures single-line and multi-line comments.
            `(?<string>@"(?:""|[^"])*"|"(?:\\\\.|[^"\\\\])*")`,  // Captures verbatim and regular string literals.
            `(?<annotation>\\[[^\\]]*\\])`,                      // Captures attributes (annotations).
            `(?<access>\\b(?:${accessModifiers.join("|")})\\b)`, // Captures access modifiers.
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,       // Captures other keywords.
            `(?<type>\\b(?:${types.join("|")})\\b)`,             // Captures predefined type names.
            `(?<number>\\b\\d+(?:\\.\\d+)?[fLd]?\\b)`,           // Captures integer, float, long, and double numbers.
            `(?<operator>${operators.map(op => `\\${op.split('').join('\\')}`).join("|")})`, // Captures operators, properly escaping them.
            `(?<bracket>${brackets.map(b => `\\${b}`).join("|")})` // Captures brackets, parentheses, and braces.
        ].join("|"),
        "g" // The 'g' flag ensures that all occurrences are matched, not just the first one.
    ));
})();