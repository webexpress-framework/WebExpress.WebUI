/**
 * Syntax Highlighting Module for Python
 */
(function() {
    // Define the syntax components for Python

    // Python keywords.
    const keywords = [
        'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del',
        'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import',
        'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
        'try', 'while', 'with', 'yield'
    ];

    // Built-in constants.
    const constants = [
        'True', 'False', 'None'
    ];

    // Common built-in functions and types.
    const builtins = [
        'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'bytearray', 'bytes', 'callable',
        'chr', 'classmethod', 'compile', 'complex', 'delattr', 'dict', 'dir', 'divmod',
        'enumerate', 'eval', 'exec', 'filter', 'float', 'format', 'frozenset', 'getattr',
        'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance',
        'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max', 'memoryview', 'min',
        'next', 'object', 'oct', 'open', 'ord', 'pow', 'print', 'property', 'range',
        'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'staticmethod',
        'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip'
    ];


    // Common Python operators.
    const operators = [
        '\\+', '-', '\\*\\*', '\\*', '/', '//', '%', '@', '<<', '>>', '&', '\\|', '\\^', '~',
        ':=', '<', '>', '<=', '>=', '==', '!='
    ];

    // Brackets, parentheses, and braces.
    const brackets = [
        "\\(", "\\)", "\\[", "\\]", "{", "}"
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

    // Register the syntax configuration for Python with a combined regex.
    webexpress.webui.Syntax.register("python", new RegExp(
        [
            `(?<comment>#.*)`, // Captures single-line comments.
            // Captures all string variations: f, r, u, b prefixes and triple quotes.
            `(?<string>(?:[rfubRFUB]?)'''(?:\\\\.|[^(?:''')])*'''|(?:[rfubRFUB]?)"""(?:\\\\.|[^(?:""")]|)*"""|(?:[rfubRFUB]?)'(?:\\\\.|[^'\\\\])*'|(?:[rfubRFUB]?)"(?:\\\\.|[^"\\\\])*")`,
            `(?<decorator>^\\s*@\\w+)`, // Captures decorators.
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures keywords.
            `(?<constant>\\b(?:${constants.join("|")})\\b)`, // Captures built-in constants.
            `(?<builtin>\\b(?:${builtins.join("|")})\\b)`, // Captures common built-in functions.
            `(?<number>\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)`, // Captures integer, float, and scientific notation numbers.
            `(?<operator>${operators.join("|")})`, // Captures operators.
            `(?<bracket>${brackets.join("|")})` // Captures brackets, parentheses, and braces.
        ].join("|"),
        "gm" // 'g' for global, 'm' for multiline to handle start-of-line decorators.
    ));
})();