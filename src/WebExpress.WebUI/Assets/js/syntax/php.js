// Syntax highlighting for PHP as a class implementation
webexpress.webui.Syntax.register("php", null, (code) => {
    // PHP keywords
    const keywords = [
        "abstract", "and", "array", "as", "break", "callable", "case", "catch", "class", "clone", "const", "continue", "declare",
        "default", "do", "echo", "else", "elseif", "empty", "enddeclare", "endfor", "endforeach", "endif", "endswitch", "endwhile",
        "eval", "exit", "extends", "final", "finally", "for", "foreach", "function", "global", "goto", "if", "implements", "include",
        "include_once", "instanceof", "insteadof", "interface", "isset", "list", "namespace", "new", "or", "print", "private",
        "protected", "public", "require", "require_once", "return", "static", "switch", "throw", "trait", "try", "unset", "use",
        "var", "while", "xor", "yield"
    ];

    // PHP types and built-ins
    const types = [
        "int", "float", "bool", "string", "array", "object", "resource", "mixed", "void", "iterable", "callable", "self", "parent"
    ];

    // PHP operators
    const operators = [
        "=", "==", "===", "!==", "!=", "<", ">", "<=", ">=", "\\+", "-", "\\*", "/", "%", "\\^", "&&", "\\|\\|", "\\|", "!", "\\.", "\\+=", "-=", "\\*=", "/=", "%=", "\\^=", "&=", "\\|=", "<<", ">>", "->", "::", "=>"
    ];

    // Brackets
    const brackets = [
        "\\(", "\\)", "\\{", "\\}", "\\[", "\\]"
    ];

    // Compile combined regex for PHP syntax
    const regex = new RegExp(
        [
            // Single-line and multi-line comments
            `(?<comment>\\/\\/.*|#.*|\\/\\*[\\s\\S]*?\\*\\/)`,
            // Double-quoted and single-quoted strings
            `(?<string>"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`,
            // PHP variables
            `(?<variable>\\$[A-Za-z_][A-Za-z0-9_]*)`,
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

    // Processes each line for highlighting
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