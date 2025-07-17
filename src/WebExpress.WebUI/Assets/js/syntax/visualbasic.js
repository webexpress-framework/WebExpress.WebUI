/**
 * Syntax Highlighting Module for Visual Basic
 */
(function() {
    // Define the syntax components for Visual Basic

    // Visual Basic reserved keywords
    const keywords = [
        "AddHandler", "AddressOf", "And", "AndAlso", "As", "Boolean", "ByRef", "Byte", "ByVal",
        "Call", "Case", "Catch", "CBool", "CByte", "CChar", "CDate", "CDbl", "CDec", "Char", "CInt",
        "Class", "CLng", "CObj", "Const", "Continue", "CSByte", "CShort", "CSng", "CStr", "CType",
        "CUInt", "CULng", "CUShort", "Date", "Decimal", "Declare", "Default", "Delegate", "Dim",
        "DirectCast", "Do", "Double", "Each", "Else", "ElseIf", "End", "EndIf", "Enum", "Erase",
        "Error", "Event", "Exit", "False", "Finally", "For", "Friend", "Function", "Get", "GetType",
        "Global", "GoSub", "GoTo", "Handles", "If", "Implements", "Imports", "In", "Inherits",
        "Integer", "Interface", "Is", "IsNot", "Let", "Lib", "Like", "Long", "Loop", "Me", "Mod",
        "Module", "MustInherit", "MustOverride", "MyBase", "MyClass", "Namespace", "Narrowing",
        "New", "Next", "Not", "Nothing", "NotInheritable", "NotOverridable", "Object", "Of", "On",
        "Operator", "Option", "Optional", "Or", "OrElse", "Overloads", "Overridable", "Overrides",
        "ParamArray", "Partial", "Private", "Property", "Protected", "Public", "RaiseEvent", "ReadOnly",
        "ReDim", "REM", "RemoveHandler", "Resume", "Return", "SByte", "Select", "Set", "Shadows",
        "Shared", "Short", "Single", "Static", "Step", "Stop", "String", "Structure", "Sub", "SyncLock",
        "Then", "Throw", "To", "True", "Try", "TryCast", "TypeOf", "UInteger", "ULong", "UShort",
        "Using", "Variant", "Wend", "While", "WideChar", "With", "WithEvents", "WriteOnly", "Xor"
    ];

    // Common Visual Basic operators
    const operators = [
        "=", "<>", "<", ">", "<=", ">=", "\\+", "-", "\\*", "/", "\\^", "&", "\\|", "Not", "And", "Or", "Xor"
    ];

    // Brackets and parentheses
    const brackets = [
        "\\(", "\\)", "{", "}", "\\[", "\\]"
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

    // Register the syntax configuration for Visual Basic with a combined regex
    webexpress.webui.Syntax.register("visualbasic", new RegExp(
        [
            `(?<comment>'[^\\n]*)`,                    // Captures comments starting with '
            `(?<string>"(?:[^"]|"")*")`,               // Captures strings enclosed in double quotes
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures Visual Basic keywords
            `(?<number>\\b\\d+(\\.\\d+)?\\b)`,         // Captures numbers
            `(?<operator>${operators.join("|")})`,    // Captures operators
            `(?<bracket>${brackets.join("|")})`       // Captures brackets and parentheses
        ].join("|"),
        "gi" // 'g' for global search, 'i' for case-insensitive
    ));
})();