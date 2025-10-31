// Syntax highlighting for Python as a class implementation
webexpress.webui.Syntax.register("python", "py", (code) => {
    // python keywords
    const keywords = [
        "False", "await", "else", "import", "pass", "None", "break", "except", "in", "raise", "True", "class", "finally",
        "is", "return", "and", "continue", "for", "lambda", "try", "as", "def", "from", "nonlocal", "while",
        "assert", "del", "global", "not", "with", "async", "elif", "if", "or", "yield"
    ];

    // python built-in types
    const types = [
        "int", "float", "bool", "str", "list", "tuple", "dict", "set", "frozenset", "complex", "bytes", "bytearray", "memoryview", "object"
    ];

    // python built-in functions and common modules
    const builtins = [
        "abs", "all", "any", "ascii", "bin", "callable", "chr", "classmethod", "compile", "delattr", "dir", "divmod",
        "enumerate", "eval", "exec", "filter", "format", "getattr", "globals", "hasattr", "hash", "help", "hex",
        "id", "input", "isinstance", "issubclass", "iter", "len", "locals", "map", "max", "min", "next", "oct",
        "open", "ord", "pow", "print", "property", "range", "repr", "reversed", "round", "setattr", "slice",
        "sorted", "staticmethod", "sum", "super", "type", "vars", "zip", "__import__"
    ];

    // python operators
    const operators = [
        "=", "==", "!=", "<", ">", "<=", ">=", "\\+", "-", "\\*", "/", "%", "//", "\\*\\*", "and", "or", "not", "is", "in"
    ];

    // brackets
    const brackets = [
        "\\(", "\\)", "\\{", "\\}", "\\[", "\\]"
    ];

    // compile combined regex for Python syntax
    const regex = new RegExp(
        [
            // single-line and multi-line comments
            `(?<comment>#.*|'''[\\s\\S]*?'''|"""[\\s\\S]*?""")`,
            // double-quoted and single-quoted strings
            `(?<string>"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`,
            // keywords
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // built-in functions
            `(?<builtin>\\b(?:${builtins.join("|")})\\b)`,
            // types
            `(?<type>\\b(?:${types.join("|")})\\b)`,
            // numbers (integer, floating point, hex, octal)
            `(?<number>\\b0[xX][0-9a-fA-F]+\\b|\\b0[oO][0-7]+\\b|\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)`,
            // operators
            `(?<operator>${operators.join("|")})`,
            // brackets
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