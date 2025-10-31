// Syntax highlighting for PowerShell as a class implementation
webexpress.webui.Syntax.register("powershell", "ps", (code) => {
    // PowerShell keywords
    const keywords = [
        "function", "filter", "workflow", "if", "else", "elseif", "switch", "foreach", "for", "while", "do", "until", "return", "break", "continue", "trap", "throw", "try", "catch", "finally", "in"
    ];

    // PowerShell built-ins and cmdlets (partial list)
    const builtins = [
        "Get-ChildItem", "Get-Content", "Get-Help", "Get-Process", "Get-Service", "Get-Command", "Get-Item", "Set-Item", "Remove-Item", "New-Item", "Copy-Item", "Move-Item", "Write-Host", "Write-Output", "Read-Host", "Start-Process", "Stop-Process", "Test-Path", "Select-Object", "Where-Object", "Sort-Object", "Format-Table", "Format-List", "Import-Module", "Export-ModuleMember"
    ];

    // PowerShell operators
    const operators = [
        "-eq", "-ne", "-gt", "-lt", "-ge", "-le", "-like", "-notlike", "-match", "-notmatch", "-replace", "-contains", "-notcontains", "-in", "-notin", "-and", "-or", "-not", "-band", "-bor", "-bxor", "-bnot", "-shl", "-shr", "=", "\\+", "-", "\\*", "/", "%", "\\.", "!", "\\|", "&"
    ];

    // Brackets
    const brackets = [
        "\\(", "\\)", "\\{", "\\}", "\\[", "\\]"
    ];

    // Compile combined regex for PowerShell syntax
    const regex = new RegExp(
        [
            // Single-line and multi-line comments
            `(?<comment>#.*|<#[\\s\\S]*?#>)`,
            // Double-quoted and single-quoted strings
            `(?<string>"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`,
            // Variables: $var, ${var}
            `(?<variable>\\$[A-Za-z_][A-Za-z0-9_]*|\\$\\{[^}]+\\})`,
            // Keywords
            `(?<keyword>\\b(?:${keywords.join("|")})\\b)`,
            // Built-ins and cmdlets
            `(?<builtin>\\b(?:${builtins.join("|")})\\b)`,
            // Numbers (integer and floating point)
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