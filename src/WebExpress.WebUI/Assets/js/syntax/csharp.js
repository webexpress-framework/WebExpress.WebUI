// Syntax highlighting for C# as a class implementation
webexpress.webui.Syntax.register("csharp", "c#", (code) => {
    // define c# syntax components
    const accessModifiers = [
        "public", "private", "protected", "internal"
    ];
    const keywords = [
        "abstract", "as", "base", "bool", "break", "byte", "case", "catch", "char", "checked", "class",
        "const", "continue", "decimal", "default", "delegate", "do", "double", "else", "enum", "event",
        "explicit", "extern", "false", "finally", "fixed", "float", "for", "foreach", "goto", "if", "implicit",
        "in", "int", "interface", "is", "lock", "long", "namespace", "new", "null", "object",
        "operator", "out", "override", "params", "readonly", "ref", "return",
        "sbyte", "sealed", "short", "sizeof", "stackalloc", "static", "string", "struct", "switch", "this",
        "throw", "true", "try", "typeof", "uint", "ulong", "unchecked", "unsafe", "ushort", "using", "var", "virtual",
        "void", "volatile", "while"
    ];
    const types = [
        "int", "string", "bool", "double", "float", "char", "long", "short", "decimal", "byte", "sbyte", "uint", "ulong", "ushort", "object"
    ];
    const operators = [
        "=", "==", "!=", "<", ">", "<=", ">=", "+", "-", "*", "/", "%", "&&", "||", "!", "&", "|", "^", "<<", ">>", "??"
    ];
    const brackets = [
        "(", ")", "{", "}", "[", "]"
    ];

    // compile combined regex for c# syntax
    const regex = new RegExp(
        [
            // comments (single-line and multi-line)
            `(?<comment>\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/)`,
            // strings (verbatim and regular)
            `(?<string>@"(?:""|[^"])*"|"(?:\\\\.|[^"\\\\])*")`,
            // method calls like .WriteLine
            `(?<method>\\.\\s*[a-zA-Z_][a-zA-Z0-9_]*)`,
            // property/field access like Console.
            `(?<property>\\b[a-zA-Z_][a-zA-Z0-9_]*\\.)`,
            // access modifiers
            `(?<access>\\b(?:${accessModifiers.join("|")})\\b)`,
            // keywords
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // types
            `(?<type>\\b(?:${types.join("|")})\\b)`,
            // numbers
            `(?<number>\\b\\d+(?:\\.\\d+)?[fLd]?\\b)`,
            // operators
            `(?<operator>${operators.map(op => `\\${op.split('').join('\\')}`).join("|")})`,
            // brackets
            `(?<bracket>${brackets.map(b => `\\${b}`).join("|")})`
        ].join("|"),
        "g"
    );

    /**
     * converts a matched token to an html span element for syntax highlighting.
     *
     * @param {string} token - the type of token (e.g., keyword, comment).
     * @param {string} value - the matched value to be highlighted.
     * @returns {string} the html span element with corresponding class.
     */
    function tokenToSpan(token, value) {
        return `<span class="${token}">${value}</span>`;
    }

    // process each line for highlighting
    return code.split('\n').map(line => {
        let result = '';
        let lastIndex = 0;
        let matches = [...line.matchAll(regex)];

        for (const match of matches) {
            const index = match.index;
            result += line.slice(lastIndex, index);

            for (const key in match.groups) {
                if (match.groups[key] !== undefined) {
                    result += tokenToSpan(key, match.groups[key]);
                    break;
                }
            }
            lastIndex = index + match[0].length;
        }

        result += line.slice(lastIndex);

        return `<span>${result}</span>`;
    }).join('');
});