// Syntax highlighting for BASIC as a class implementation
webexpress.webui.Syntax.register("basic", "bas", (code) => {
    // define BASIC syntax components
    const keywords = [
        'ABS', 'AND', 'ASC', 'ATN', 'CALL', 'CHR$', 'CLEAR', 'CLOSE', 'CLS', 'COLOR',
        'CONT', 'COS', 'CSNG', 'CVD', 'CVI', 'CVS', 'DATA', 'DATE$', 'DEF', 'DEFDBL',
        'DEFINT', 'DEFSNG', 'DEFSTR', 'DELETE', 'DIM', 'DO', 'LOOP', 'UNTIL', 'WHILE', 'WEND',
        'DRAW', 'EDIT', 'ELSE', 'END', 'ENVIRON', 'EOF', 'EQV', 'ERASE', 'ERL', 'ERR',
        'ERROR', 'EXP', 'FIELD', 'FILES', 'FIX', 'FN', 'FOR', 'NEXT', 'TO', 'STEP',
        'FRE', 'GET', 'GOSUB', 'GOTO', 'HEX$', 'IF', 'THEN', 'IMP', 'INKEY$', 'INP',
        'INPUT', 'INSTR', 'INT', 'KEY', 'KILL', 'LEFT$', 'LEN', 'LET', 'LINE', 'LIST',
        'LLIST', 'LOAD', 'LOC', 'LOCATE', 'LOF', 'LOG', 'LPOS', 'LPRINT', 'LSET',
        'MERGE', 'MID$', 'MKD$', 'MKI$', 'MKS$', 'MOD', 'MOTOR', 'NAME', 'NEW', 'NOT',
        'OCT$', 'ON', 'OPEN', 'OPTION', 'BASE', 'OR', 'OUT', 'PAINT', 'PEEK', 'PEN',
        'PLAY', 'PMAP', 'POINT', 'POKE', 'POS', 'PRESET', 'PRINT', 'PSET', 'PUT',
        'RANDOMIZE', 'READ', 'REM', 'RENUM', 'RESET', 'RESTORE', 'RESUME', 'RETURN',
        'RIGHT$', 'RND', 'RSET', 'RUN', 'SAVE', 'SCREEN', 'SGN', 'SIN', 'SOUND',
        'SPACE$', 'SPC', 'SQR', 'STATIC', 'STICK', 'STOP', 'STR$', 'STRIG', 'STRING$',
        'SWAP', 'SYSTEM', 'TAB', 'TAN', 'TIME$', 'TIMER', 'TROFF', 'TRON', 'USING',
        'USR', 'VAL', 'VARPTR', 'VIEW', 'WAIT', 'WHILE', 'WEND', 'WIDTH', 'WINDOW',
        'WRITE', 'XOR'
    ];

    const operators = [
        '=', '<>', '>', '<', '<=', '>=', '\\+', '-', '\\*', '/', '\\^'
    ];

    const brackets = [
        '\\(', '\\)'
    ];

    // compile combined regex for BASIC syntax
    const regex = new RegExp(
        [
            // line numbers at the start of a line
            `(?<linenumber>^[0-9]+)`,
            // comments: REM or '
            `(?<comment>(?:\\bREM\\b|').*$)`,
            // double-quoted strings
            `(?<string>"(?:""|[^"])*")`,
            // keywords
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // numbers
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