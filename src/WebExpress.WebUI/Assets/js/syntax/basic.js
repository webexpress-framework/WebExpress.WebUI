/**
 * Syntax Highlighting Module for BASIC
 */
(function() {
    // Define the syntax components for BASIC

    // BASIC keywords and common statements.
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

    // BASIC operators.
    const operators = [
        '=', '<>', '>', '<', '<=', '>=', '\\+', '-', '\\*', '/', '\\^'
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

    // Register the syntax configuration for BASIC with a combined regex.
    webexpress.webui.Syntax.register("basic", new RegExp(
        [
            // Captures line numbers at the start of a line.
            `(?<linenumber>^[0-9]+)`,
            // Captures comments, which start with REM or a single quote.
            `(?<comment>(?:\\bREM\\b|').*$)`,
            // Captures double-quoted strings.
            `(?<string>"(?:""|[^"])*")`,
            // Captures keywords.
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // Captures numbers.
            `(?<number>\\b\\d+(?:\\.\\d+)?\\b)`,
            // Captures operators.
            `(?<operator>${operators.join("|")})`,
            // Captures brackets and parentheses.
            `(?<bracket>${brackets.join("|")})`
        ].join("|"),
        "gim" // 'g' for global, 'i' for case-insensitive, 'm' for multiline anchors.
    ));
})();