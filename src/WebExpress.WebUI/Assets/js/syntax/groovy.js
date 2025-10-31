// Syntax highlighting for Groovy as a class implementation
webexpress.webui.Syntax.register("groovy", null, (code) => {
    // Groovy keywords
    const keywords = [
        "as", "assert", "break", "case", "catch", "class", "continue", "def", "default", "do", "else", "enum", "extends", "false", "finally",
        "for", "goto", "if", "implements", "import", "in", "instanceof", "interface", "new", "null", "package", "return", "super", "switch",
        "this", "throw", "throws", "trait", "true", "try", "while"
    ];

    // Groovy types
    const types = [
        "boolean", "byte", "char", "double", "float", "int", "long", "short", "void", "String", "Object", "List", "Map", "Set", "Range", "Closure"
    ];

    // Groovy operators
    const operators = [
        "=", "==", "!=", "<", ">", "<=", ">=", "\\+", "-", "\\*", "/", "%", "&&", "\\|\\|", "!", "&", "\\|", "\\^", "<<", ">>", "~", "\\?", ":", "\\.", "\\->", "\\+=", "\\-=", "\\*=", "/=", "%="
    ];

    // Brackets
    const brackets = [
        "\\(", "\\)", "\\{", "\\}", "\\[", "\\]"
    ];

    // The following regular expression pattern detects comments, strings, annotations, keywords, types, numbers, operators, and brackets in Groovy source code.
    const regex = new RegExp(
        [
            // Single-line and multi-line comments as well as lines with # are detected
            `(?<comment>\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/|\\#.*$)`,
            // Strings are detected as double-quoted, single-quoted, and slashy strings, including multi-line
            `(?<string>"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\\/(?:\\\\.|[^\\/\\\\])*\\/|"""[\\s\\S]*?"""|'''[\\s\\S]*?''')`,
            // Annotations are detected when they start with @
            `(?<annotation>@[A-Za-z_][A-Za-z0-9_]*)`,
            // Keywords are detected
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // Types are detected
            `(?<type>\\b(?:${types.join("|")})\\b)`,
            // Numbers are detected, including hexadecimal and octal formats
            `(?<number>\\b0[xX][0-9a-fA-F]+\\b|\\b0[0-7]+\\b|\\b\\d+(?:\\.\\d+)?([eE][+-]?\\d+)?[fFdD]?\\b)`,
            // Operators are detected
            `(?<operator>${operators.join("|")})`,
            // Brackets are detected
            `(?<bracket>${brackets.join("|")})`
        ].join("|"),
        "gim"
    );

    // The function converts detected syntax elements into HTML span tags for highlighting
    function tokenToSpan(token, value) {
        return `<span class="${token}">${value}</span>`;
    }

    // The Groovy code is processed line by line and returned with highlighting
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