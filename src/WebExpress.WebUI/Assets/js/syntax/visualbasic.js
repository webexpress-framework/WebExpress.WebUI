// Syntax highlighting for Visual Basic as a class implementation
webexpress.webui.Syntax.register("visualbasic", "vb", (code) => {
    // Visual Basic keywords
    const keywords = [
        "Dim", "As", "If", "Then", "Else", "ElseIf", "End", "For", "Each", "Next", "While", "Do", "Loop", "Until", "Exit", "Select", "Case",
        "Function", "Sub", "Return", "Class", "Module", "Public", "Private", "Protected", "Friend", "Shared", "Static", "New", "Set", "Get",
        "Property", "Imports", "Namespace", "Try", "Catch", "Finally", "Throw", "Handles", "With", "Me", "MyBase", "MyClass", "Not", "And", "Or"
    ];

    // Visual Basic types
    const types = [
        "Integer", "String", "Boolean", "Double", "Decimal", "Object", "Char", "Byte", "Long", "Short", "Single", "Date", "Array", "Variant"
    ];

    // Visual Basic operators
    const operators = [
        "=", "<>", "<", ">", "<=", ">=", "\\+", "-", "\\*", "/", "\\^", "\\&", "\\.", "\\:", "\\\\", "\\->"
    ];

    // Brackets
    const brackets = [
        "\\(", "\\)", "\\{", "\\}", "\\[", "\\]"
    ];

    // Compile combined regex for Visual Basic syntax
    const regex = new RegExp(
        [
            // Single-line and multi-line comments
            `(?<comment>'[^\\n]*|REM[^\\n]*)`,
            // Double-quoted strings
            `(?<string>"(?:\\\\.|[^"\\\\])*")`,
            // Keywords
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // Types
            `(?<type>\\b(?:${types.join("|")})\\b)`,
            // Numbers (integer, floating point)
            `(?<number>\\b\\d+(?:\\.\\d+)?\\b)`,
            // Operators
            `(?<operator>${operators.join("|")})`,
            // Brackets
            `(?<bracket>${brackets.join("|")})`
        ].join("|"),
        "gim"
    );

    // Converts token to HTML span for syntax highlighting
    function tokenToSpan(token, value) {
        return `<span class="${token}">${value}</span>`;
    }

    // Processes each line for highlighting
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