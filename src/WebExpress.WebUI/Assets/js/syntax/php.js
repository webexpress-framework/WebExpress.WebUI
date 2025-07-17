/**
 * Syntax Highlighting Module for PHP
 */
(function() {
    // Define the syntax components for PHP

    // PHP keywords, including control flow, declarations, and access modifiers.
    const keywords = [
        '__halt_compiler', 'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class',
        'clone', 'const', 'continue', 'declare', 'default', 'die', 'do', 'echo', 'else', 'elseif',
        'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch', 'endwhile', 'eval', 'exit',
        'extends', 'final', 'finally', 'fn', 'for', 'foreach', 'function', 'global', 'goto', 'if',
        'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface', 'isset', 'list',
        'match', 'namespace', 'new', 'or', 'print', 'private', 'protected', 'public', 'readonly',
        'require', 'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset',
        'use', 'var', 'while', 'xor', 'yield', 'from'
    ];

    // Built-in constants and magic constants.
    const constants = [
        'true', 'false', 'null', '__CLASS__', '__DIR__', '__FILE__', '__FUNCTION__',
        '__LINE__', '__METHOD__', '__NAMESPACE__', '__TRAIT__'
    ];

    // Common PHP operators.
    const operators = [
        '\\+=', '-=', '\\*=', '/=', '\\.=', '%=', '&=', '\\|=', '\\^=', '<<=', '>>=', '\\*\\*=',
        '\\+\\+', '--', '=>', '===', '!==', '==', '!=', '<>', '<=', '>=', '<=>', '&&', '\\|\\|',
        '\\?\\?', '\\.\\.\\.', '->', '&', '\\+', '-', '\\*', '/', '%', '!', '\\.', '\\|', '\\^', '~', '<<', '>>', '<', '>'
    ];

    // Brackets, parentheses, and braces are captured for styling.
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

    // Register the syntax configuration for PHP with a combined regex.
    webexpress.webui.Syntax.register("php", new RegExp(
        [
            `(?<comment>\\/\\/.*|#.*|\\/\\*[\\s\\S]*?\\*\\/)`, // Captures single-line (// and #) and multi-line comments.
            `(?<string>'(?:\\\\.|[^'\\\\])*'|"(?:\\\\.|[^"\\\\])*")`, // Captures single and double quoted strings.
            `(?<variable>\\$[a-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*)`, // Captures variables.
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures keywords.
            `(?<constant>\\b(?:${constants.join("|")})\\b)`, // Captures built-in constants.
            `(?<number>\\b\\d+(?:\\.\\d+)?\\b)`, // Captures integer and floating-point numbers.
            `(?<operator>${operators.join("|")})`, // Captures operators.
            `(?<bracket>${brackets.join("|")})` // Captures brackets, parentheses, and braces.
        ].join("|"),
        "gi" // The 'g' flag for global search, 'i' for case-insensitivity (common for PHP keywords).
    ));
})();