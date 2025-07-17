/**
 * Syntax Highlighting Module for Windows Command Prompt (CMD) batch scripts
 */
(function() {
    // Define the syntax components for CMD

    // CMD keywords for control flow.
    const keywords = [
        'if', 'else', 'for', 'in', 'do', 'goto', 'call', 'exit', 'pause', 'defined', 'errorlevel', 'exist', 'not', 'cmdextversion'
    ];

    // Common internal CMD commands.
    const commands = [
        'assoc', 'break', 'cd', 'chdir', 'cls', 'color', 'copy', 'date', 'del', 'dir', 'echo',
        'endlocal', 'erase', 'ftype', 'md', 'mkdir', 'mklink', 'move', 'path', 'popd', 'prompt',
        'pushd', 'rd', 'ren', 'rename', 'rmdir', 'set', 'setlocal', 'shift', 'start', 'time',
        'title', 'type', 'ver', 'verify', 'vol'
    ];

    // CMD comparison and redirection operators.
    const operators = [
        'EQU', 'NEQ', 'LSS', 'LEQ', 'GTR', 'GEQ',
        '==', '>', '<', '>>', '&', '\\|', '&&', '\\|\\|'
    ];

    // Brackets and parentheses.
    const brackets = [
        "\\(", "\\)"
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

    // Register the syntax configuration for CMD with a combined regex.
    webexpress.webui.Syntax.register("cmd", new RegExp(
        [
            `(?<comment>^(?:REM|::).*$)`, // Captures comments (REM or :: at the start of a line).
            `(?<label>^:[a-zA-Z0-9_]+)`, // Captures labels (e.g., :myLabel).
            `(?<string>"(?:""|[^"])*")`, // Captures double-quoted strings (handles escaped quotes via "").
            `(?<variable>%[^%]+%|%%[a-zA-Z0-9#\\$\\~])`, // Captures environment variables (%VAR%) and FOR loop variables (%%A).
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures keywords.
            `(?<command>\\b(?:${commands.join("|")})\\b)`, // Captures common commands.
            `(?<operator>${operators.join("|")})`, // Captures operators.
            `(?<bracket>${brackets.join("|")})` // Captures brackets and parentheses.
        ].join("|"),
        "gim" // 'g' for global, 'i' for case-insensitive, 'm' for multiline to handle start-of-line anchors (^).
    ));
})();