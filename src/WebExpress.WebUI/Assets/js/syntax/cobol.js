// Syntax highlighting for COBOL as a class implementation
webexpress.webui.Syntax.register("cobol", "cob", (code) => {
    // define COBOL syntax components
    const keywords = [
        "ACCEPT", "ADD", "CALL", "CANCEL", "CLOSE", "COMPUTE", "CONTINUE", "COPY", "DELETE", "DISPLAY",
        "DIVIDE", "ELSE", "END-IF", "END-PERFORM", "END-READ", "END-WRITE", "EVALUATE", "EXIT", "GOBACK",
        "GO", "IF", "INITIALIZE", "INSPECT", "MOVE", "MULTIPLY", "OPEN", "PERFORM", "READ", "RETURN",
        "REWRITE", "SEARCH", "SET", "SORT", "START", "STOP", "STRING", "SUBTRACT", "UNSTRING", "UNTIL",
        "WHEN", "WRITE", "WORKING-STORAGE", "PROCEDURE", "DIVISION", "SECTION", "ENVIRONMENT", "DATA",
        "FILE", "FD", "SELECT", "TO", "BY", "FROM", "INTO", "THEN", "USING", "WITH"
    ];

    const divisions = [
        "IDENTIFICATION", "ENVIRONMENT", "DATA", "PROCEDURE"
    ];

    const operators = [
        "=", "<>", ">", "<", "<=", ">=", "\\+", "-", "\\*", "/", "AND", "OR", "NOT"
    ];

    const brackets = [
        "\\(", "\\)", "\\[", "\\]", "\\{", "\\}"
    ];

    // compile combined regex for COBOL syntax
    const regex = new RegExp(
        [
            // single-line comments (with *)
            `(?<comment>\\*.*$)`,
            // double-quoted and single-quoted strings
            `(?<string>"(?:[^"]*)"|'(?:[^']*)')`,
            // division headers
            `(?<division>\\b(?:${divisions.join("|")})\\s+DIVISION\\b)`,
            // section headers
            `(?<section>\\b[A-Z0-9-]+\\s+SECTION\\b)`,
            // keywords
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // numbers (integer and floating point)
            `(?<number>\\b\\d+(?:\\.\\d+)?\\b)`,
            // operators
            `(?<operator>${operators.join("|")})`,
            // brackets
            `(?<bracket>${brackets.join("|")})`
        ].join("|"),
        "gim"
    );

    // converts token to HTML span for syntax highlighting
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