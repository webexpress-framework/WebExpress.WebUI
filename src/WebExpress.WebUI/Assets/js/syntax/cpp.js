/**
 * Syntax Highlighting Module for C++
 */
(function() {
    // Define the syntax components for C++

    // Access modifiers are separated for distinct highlighting.
    const accessModifiers = [
        "public", "private", "protected"
    ];

    // Common C++ keywords.
    const keywords = [
        'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor', 'break', 'case',
        'catch', 'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit',
        'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype', 'default',
        'delete', 'do', 'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'for',
        'friend', 'goto', 'if', 'inline', 'mutable', 'namespace', 'new', 'noexcept', 'not',
        'not_eq', 'operator', 'or', 'or_eq', 'register', 'reinterpret_cast', 'requires',
        'return', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct', 'switch',
        'template', 'this', 'thread_local', 'throw', 'try', 'typedef', 'typeid', 'typename',
        'union', 'using', 'virtual', 'volatile', 'while', 'xor', 'xor_eq'
    ];

    // C++ fundamental types.
    const types = [
        'bool', 'char', 'char8_t', 'char16_t', 'char32_t', 'double', 'float', 'int', 'long',
        'short', 'signed', 'unsigned', 'void', 'wchar_t'
    ];

    // C++ literals.
    const constants = [
        'true', 'false', 'nullptr'
    ];

    // Common C++ operators.
    const operators = [
        '::', '\\+\\+', '--', '->', '\\.',
        '\\+', '-', '\\*', '/', '%',
        '\\&', '\\|', '\\^', '!', '~',
        '=', '\\+=', '-=', '\\*=', '/=', '%=', '\\&=', '\\|=', '\\^=', '<<=', '>>=',
        '==', '!=', '<', '>', '<=', '>=', '<=>',
        '&&', '\\|\\|',
        '<<', '>>',
        '\\?', ':'
    ];

    // Brackets, parentheses, and braces.
    const brackets = [
        "\\(", "\\)", "{", "}", "\\[", "\\]"
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

    // Register the syntax configuration for C++ with a combined regex.
    webexpress.webui.Syntax.register("cpp", new RegExp(
        [
            `(?<preprocessor>^\\s*#.*)`, // Captures preprocessor directives.
            `(?<comment>\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/)`, // Captures single-line and multi-line comments.
            `(?<string>R"([^()\\\\]*\\([^()\\\\]*\\)[^()\\\\]*)"|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`, // Captures raw, double, and single quoted strings.
            `(?<access>\\b(?:${accessModifiers.join("|")})\\b)`, // Captures access modifiers.
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures other keywords.
            `(?<type>\\b(?:${types.join("|")})\\b)`, // Captures fundamental type names.
            `(?<constant>\\b(?:${constants.join("|")})\\b)`, // Captures literals.
            `(?<number>\\b(?:0[xX][a-fA-F0-9]+|0[0-7]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)[ULf]*\\b)`, // Captures hex, octal, decimal, float, and scientific numbers.
            `(?<operator>${operators.join("|")})`, // Captures operators.
            `(?<bracket>${brackets.join("|")})` // Captures brackets, parentheses, and braces.
        ].join("|"),
        "gm" // 'g' for global search, 'm' for multiline mode to handle start-of-line preprocessor directives.
    ));
})();