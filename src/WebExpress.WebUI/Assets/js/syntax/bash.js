/**
 * Syntax Highlighting Module for Bash scripts
 */
(function() {
    // Define the syntax components for Bash

    // Bash keywords for control flow.
    const keywords = [
        'if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'select', 'while',
        'until', 'do', 'done', 'in', 'function', 'time'
    ];

    // Common built-in commands.
    const commands = [
        'alias', 'bg', 'bind', 'break', 'builtin', 'caller', 'cd', 'command', 'compgen', 'complete',
        'compopt', 'continue', 'declare', 'dirs', 'disown', 'echo', 'enable', 'eval', 'exec',
        'exit', 'export', 'false', 'fc', 'fg', 'getopts', 'hash', 'help', 'history', 'jobs',
        'kill', 'let', 'local', 'logout', 'mapfile', 'popd', 'printf', 'pushd', 'pwd', 'read',
        'readarray', 'readonly', 'return', 'set', 'shift', 'shopt', 'source', 'suspend', 'test',
        'times', 'trap', 'true', 'type', 'typeset', 'ulimit', 'umask', 'unalias', 'unset', 'wait'
    ];

    // Common Bash operators for tests and arithmetic.
    const operators = [
        '=', '==', '!=', '-eq', '-ne', '-gt', '-ge', '-lt', '-le', '&&', '\\|\\|',
        '!', '\\|', '>', '<', '>>', '&>'
    ];

    // Brackets, parentheses, and braces are captured for styling.
    const brackets = [
        "\\(", "\\)", "{", "}", "\\[", "\\]", "\\[\\[", "\\]\\]"
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

    // Register the syntax configuration for Bash with a combined regex.
    webexpress.webui.Syntax.register("bash", new RegExp(
        [
            `(?<shebang>^#!.*)`, // Captures the shebang line at the beginning of a file.
            `(?<comment>#.*)`, // Captures comments (must come after shebang).
            `(?<string>'(?:\\\\.|[^'\\\\])*'|"(?:\\\\.|[^"\\\\])*")`, // Captures single and double quoted strings.
            `(?<variable>\\$[a-zA-Z0-9_@#\\*\\?\\!\\-]+|\\$\\{[^}]+\\})`, // Captures simple and complex variables.
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures keywords.
            `(?<command>\\b(?:${commands.join("|")})\\b)`, // Captures built-in commands.
            `(?<number>\\b\\d+(?:\\.\\d+)?\\b)`, // Captures integer and floating-point numbers.
            `(?<operator>${operators.join("|")})`, // Captures operators.
            `(?<bracket>${brackets.join("|")})` // Captures brackets, parentheses, and braces.
        ].join("|"),
        "gm" // 'g' for global search, 'm' for multiline mode to allow '^' in shebang to work correctly.
    ));
})();