// Syntax highlighting for Windows CMD (Batch) as a class implementation
webexpress.webui.Syntax.register("cmd", null, (code) => {
    // Define CMD keywords and builtins
    const keywords = [
        "if", "else", "goto", "call", "exit", "for", "in", "do", "set", "shift", "pause", "echo", "rem", "goto", "choice", "copy", "del", "dir", "move", "ren", "replace", "type", "start", "title", "color", "attrib"
    ];

    const builtins = [
        "echo", "pause", "set", "shift", "cd", "chdir", "cls", "copy", "del", "dir", "erase", "md", "mkdir", "move", "rd", "ren", "rename", "rmdir", "type", "ver", "vol", "start", "title", "color", "attrib", "assoc", "call", "choice", "exit"
    ];

    const operators = [
        "=", "==", ">", "<", "\\|", "\\&", "\\+", "-", "\\*", "/", "%"
    ];

    const brackets = [
        "\\(", "\\)", "\\[", "\\]"
    ];

    // Regex for CMD syntax
    const regex = new RegExp(
        [
            // REM comments or :: comments
            `(?<comment>(?:^|\\s)(?:REM|::).*?$)`,
            // double-quoted and single-quoted strings
            `(?<string>"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`,
            // variables: %VAR% or !VAR!
            `(?<variable>%[A-Za-z0-9_]+%|![A-Za-z0-9_]+!)`,
            // keywords
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // builtins
            `(?<builtin>\\b(?:${builtins.join("|")})\\b)`,
            // numbers (integer and floating point)
            `(?<number>\\b\\d+(?:\\.\\d+)?\\b)`,
            // operators
            `(?<operator>${operators.join("|")})`,
            // brackets
            `(?<bracket>${brackets.join("|")})`
        ].join("|"),
        "gim"
    );

    // Converts a matched token to an HTML span element for syntax highlighting
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