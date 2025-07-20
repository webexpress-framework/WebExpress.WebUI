// Syntax highlighting for Bash as a class implementation
webexpress.webui.Syntax.register("bash", "sh", (code) => {
    // define Bash syntax components
    const keywords = [
        "if", "then", "else", "elif", "fi", "case", "esac", "for", "while", "in", "do", "done", "function", "select", "until", "time"
    ];

    const operators = [
        "=", "==", "!=", "<", ">", "<=", ">=", "\\+", "-", "\\*", "/", "%", "&&", "\\|\\|", "!", "&", "\\|", "\\^", ">>", "<<"
    ];

    const brackets = [
        "\\(", "\\)", "\\{", "\\}", "\\[", "\\]"
    ];

    const builtins = [
        "echo", "printf", "read", "cd", "pwd", "exit", "kill", "wait", "exec", "eval", "source", "trap", "type", "set", "unset", "export", "alias", "bg", "fg", "jobs", "test", "true", "false"
    ];

    // compile combined regex for Bash syntax
    const regex = new RegExp(
        [
            // single-line and multi-line comments
            `(?<comment>#.*$)`,
            // double-quoted and single-quoted strings
            `(?<string>"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`,
            // variables (e.g. $VAR or ${VAR})
            `(?<variable>\\$[A-Za-z_][A-Za-z0-9_]*|\\$\\{[^}]+\\})`,
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

    // convert a matched token to an HTML span element for syntax highlighting
    function tokenToSpan(token, value) {
        return `<span class="${token}">${value}</span>`;
    }

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