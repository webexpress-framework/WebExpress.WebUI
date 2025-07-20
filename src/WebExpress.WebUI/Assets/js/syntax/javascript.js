// Syntax highlighting for JavaScript as a class implementation
webexpress.webui.Syntax.register("javascript", "js", (code) => {
    // JavaScript keywords
    const keywords = [
        "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "export", "extends",
        "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "return", "super", "switch", "this", "throw",
        "try", "typeof", "var", "void", "while", "with", "yield"
    ];

    // JavaScript types and built-ins
    const types = [
        "Array", "Boolean", "Date", "Error", "Function", "JSON", "Math", "Number", "Object", "RegExp", "Set", "String", "Symbol", "Map", "WeakMap", "WeakSet", "BigInt", "Promise"
    ];

    // JavaScript operators
    const operators = [
        "=", "==", "===", "!=", "!==", "<", ">", "<=", ">=", "\\+", "-", "\\*", "/", "%", "&&", "\\|\\|", "!", "&", "\\|", "\\^", "<<", ">>", ">>>", "~", "\\?", ":", "\\.", "\\+=", "-=", "\\*=", "/=", "%=", "&=", "\\|=", "\\^=", "<<=", ">>=", ">>>="
    ];

    // Brackets
    const brackets = [
        "\\(", "\\)", "\\{", "\\}", "\\[", "\\]"
    ];

    // Compile combined regex for JavaScript syntax
    const regex = new RegExp(
        [
            // Single-line and multi-line comments
            `(?<comment>\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/)`,
            // Double-quoted, single-quoted, backtick strings
            `(?<string>"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`)`,
            // Annotations (decorators with @)
            `(?<annotation>@[A-Za-z_][A-Za-z0-9_]*)`,
            // Keywords
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // Types and built-ins
            `(?<type>\\b(?:${types.join("|")})\\b)`,
            // Numbers (integer, floating point, hex, octal)
            `(?<number>\\b0[xX][0-9a-fA-F]+\\b|\\b0[0-7]+\\b|\\b\\d+(?:\\.\\d+)?([eE][+-]?\\d+)?\\b)`,
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