// Syntax highlighting for Java as a class implementation
webexpress.webui.Syntax.register("java", null, (code) => {
    // Java keywords
    const keywords = [
        "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue",
        "default", "do", "double", "else", "enum", "extends", "final", "finally", "float", "for", "goto", "if",
        "implements", "import", "instanceof", "int", "interface", "long", "native", "new", "null", "package",
        "private", "protected", "public", "return", "short", "static", "strictfp", "super", "switch", "synchronized",
        "this", "throw", "throws", "transient", "try", "void", "volatile", "while"
    ];

    // Java types
    const types = [
        "int", "float", "double", "char", "long", "short", "boolean", "byte", "void", "String", "Object"
    ];

    // Java operators
    const operators = [
        "=", "==", "!=", "<", ">", "<=", ">=", "\\+", "-", "\\*", "/", "%", "&&", "\\|\\|", "!", "&", "\\|", "\\^", "<<", ">>", ">>>", "\\?", ":", "\\.", "\\+", "-", "\\*", "/", "%", "\\+=", "-=", "\\*=", "/=", "%="
    ];

    // Brackets
    const brackets = [
        "\\(", "\\)", "\\{", "\\}", "\\[", "\\]"
    ];

    // Compile combined regex for Java syntax
    const regex = new RegExp(
        [
            // Single-line and multi-line comments
            `(?<comment>\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/)`,
            // Double-quoted and single-quoted strings
            `(?<string>"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`,
            // Annotations
            `(?<annotation>@[A-Za-z_][A-Za-z0-9_]*)`,
            // Keywords
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // Types
            `(?<type>\\b(?:${types.join("|")})\\b)`,
            // Numbers (integer, floating point, hex, octal)
            `(?<number>\\b0[xX][0-9a-fA-F]+\\b|\\b0[0-7]+\\b|\\b\\d+(?:\\.\\d+)?([eE][+-]?\\d+)?[fFdD]?\\b)`,
            // Operators
            `(?<operator>${operators.join("|")})`,
            // Brackets
            `(?<bracket>${brackets.join("|")})`
        ].join("|"),
        "gim"
    );

    // Converts token to HTML span for syntax highlighting
    function tokenToSpan(token, value) {
        return `<span class="${token}">${value}</span>`;
    }

    // Process each line for highlighting
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