/**
 * Syntax Highlighting Module for PowerShell scripts
 */
(function() {
    // Define the syntax components for PowerShell

    // PowerShell keywords for control flow and declarations.
    const keywords = [
        'if', 'else', 'elseif', 'for', 'foreach', 'in', 'while', 'switch', 'case', 'default',
        'function', 'class', 'enum', 'try', 'catch', 'finally', 'throw', 'trap', 'return', 'break',
        'continue', 'do', 'until', 'begin', 'process', 'end', 'param'
    ];

    // Common PowerShell cmdlets.
    const commands = [
        'Get-ChildItem', 'Get-Content', 'Set-Content', 'Add-Content', 'Get-Process', 'Stop-Process',
        'Get-Service', 'Start-Service', 'Stop-Service', 'Write-Host', 'Write-Output', 'Read-Host',
        'New-Item', 'Remove-Item', 'Copy-Item', 'Move-Item', 'Rename-Item', 'Get-Location', 'Set-Location',
        'Invoke-Command', 'Invoke-Expression', 'Invoke-RestMethod', 'Invoke-WebRequest', 'ConvertTo-Json',
        'ConvertFrom-Json', 'Select-Object', 'Where-Object', 'ForEach-Object', 'Sort-Object', 'Measure-Object',
        'Group-Object', 'Compare-Object', 'Import-Module', 'Export-Module', 'Get-Module'
    ];

    // PowerShell operators.
    const operators = [
        '-eq', '-ne', '-gt', '-ge', '-lt', '-le', '-like', '-notlike', '-match', '-notmatch',
        '-contains', '-notcontains', '-in', '-notin', '-replace', '-and', '-or', '-xor', '-not',
        '=', '\\+=', '-=', '\\*=', '/=', '%=', '\\+\\+', '--', '\\+', '-', '\\*', '/', '%'
    ];

    // Brackets, parentheses, and braces.
    const brackets = [
        "\\(", "\\)", "{", "}", "\\[", "\\]"
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

    // Register the syntax configuration for PowerShell with a combined regex.
    webexpress.webui.Syntax.register("powershell", new RegExp(
        [
            `(?<comment><#[\\s\\S]*?#_>|#.*)`, // Captures multi-line and single-line comments.
            `(?<string>'(?:''|[^'])*'|"(?:""|[^"])*")`, // Captures single and double quoted strings (handles escaped quotes).
            `(?<type>\\[[a-zA-Z0-9_.]+\\])`, // Captures type accelerators like [string].
            `(?<variable>\\$[a-zA-Z0-9_]+)`, // Captures variables.
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`, // Captures keywords.
            `(?<command>\\b(?:${commands.join("|")})\\b)`, // Captures common cmdlets.
            `(?<number>\\b\\d+(?:\\.\\d+)?\\b)`, // Captures integer and floating-point numbers.
            `(?<operator>${operators.join("|")})`, // Captures operators.
            `(?<bracket>${brackets.join("|")})` // Captures brackets, parentheses, and braces.
        ].join("|"),
        "gi" // 'g' for global search, 'i' for case-insensitivity.
    ));
})();