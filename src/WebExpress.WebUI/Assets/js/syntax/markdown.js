// Syntax highlighting for Markdown as a class implementation
webexpress.webui.Syntax.register("markdown", "md", (code) => {
    // Markdown keywords and syntax
    const headings = [
        "^#{1,6} .*$"
    ];

    const formatting = [
        "\\*\\*[^*]+\\*\\*", // bold **
        "__[^_]+__",         // bold __
        "\\*[^*]+\\*",       // italic *
        "_[^_]+_",           // italic _
        "~~[^~]+~~"          // strikethrough ~~
    ];

    const links = [
        "\\[([^\\]]+)\\]\\(([^\\)]+)\\)",    // [text](url)
        "<(https?:\\/\\/[^>]+)>"             // <http://example.com>
    ];

    const images = [
        "!\\[([^\\]]*)\\]\\(([^\\)]+)\\)"    // ![alt](url)
    ];

    const codeblocks = [
        "```[\\s\\S]*?```",                  // fenced code block
        "`[^`]+`"                            // inline code
    ];

    const lists = [
        "^[\\s]*([-*+]|\\d+\\.)\\s+.*$"      // unordered and ordered list items
    ];

    // Compile combined regex for Markdown syntax
    const regex = new RegExp(
        [
            // Headings
            `(?<heading>${headings.join("|")})`,
            // Formatting: bold, italic, strikethrough
            `(?<formatting>${formatting.join("|")})`,
            // Images
            `(?<image>${images.join("|")})`,
            // Links
            `(?<link>${links.join("|")})`,
            // Code blocks and inline code
            `(?<code>${codeblocks.join("|")})`,
            // Lists
            `(?<list>${lists.join("|")})`
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