/**
 * Syntax Highlighting Module for COBOL
 */
(function() {
    // Define the syntax components for COBOL

    // COBOL reserved words (keywords)
    const keywords = [
        "ACCEPT", "ADD", "CALL", "CANCEL", "CLOSE", "COMPUTE", "CONTINUE", "DELETE", "DISPLAY",
        "DIVIDE", "EVALUATE", "EXIT", "GOBACK", "IF", "INITIALIZE", "INSPECT", "MULTIPLY", "OPEN",
        "PERFORM", "READ", "REWRITE", "SEARCH", "SET", "SORT", "START", "STOP", "STRING", "SUBTRACT",
        "UNSTRING", "WRITE", "WHEN", "END-IF", "END-PERFORM", "END-READ", "END-WRITE", "END-ADD", "END-COMPUTE"
    ];

    // COBOL section and paragraph names
    const sections = [
        "IDENTIFICATION DIVISION", "ENVIRONMENT DIVISION", "DATA DIVISION", "PROCEDURE DIVISION",
        "WORKING-STORAGE SECTION", "FILE SECTION", "LINKAGE SECTION", "LOCAL-STORAGE SECTION"
    ];

    // Common COBOL operators
    const operators = [
        "=", "\\+", "-", "\\*", "/", ">", "<", ">=", "<=", "AND", "OR", "NOT"
    ];

    // COBOL variable names (alphanumeric and numeric literals)
    const variables = [
        "[a-zA-Z0-9-]+" // Matches alphanumeric variables with possible dashes
    ];

    // Fallback registration logic if not already defined
    if (!webexpress.webui.Syntax) {
        webexpress.webui.Syntax = {};
    }

    if (!webexpress.webui.Syntax.register) {
        webexpress.webui.Syntax.register = function(language, regex) {
            if (!this.syntax) {
                this.syntax = {};
            }
            // Store the provided regex under the specified language
            this.syntax[language] = { regex };
        };
    }

    // Register the syntax configuration for COBOL with a combined regex
    webexpress.webui.Syntax.register("cobol", new RegExp(
        [
            `(?<comment>\\*\\*.*)`,                     // Captures comments (starting with **)
            `(?<string>".*?"|'.*?')`,                  // Captures strings in double or single quotes
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures keywords
            `(?<section>\\b(?:${sections.join("|")})\\b)`, // Captures sections
            `(?<variable>${variables.join("|")})`,     // Captures variable names
            `(?<number>\\b\\d+(?:\\.\\d+)?\\b)`,       // Captures numbers
            `(?<operator>${operators.join("|")})`      // Captures operators
        ].join("|"),
        "gi" // 'g' for global search, 'i' for case-insensitive
    ));
})();