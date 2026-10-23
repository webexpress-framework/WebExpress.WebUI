// syntax highlighting for properties files as a class implementation
webexpress.webui.Syntax.register("property", "ini", (code) => {
    // process each line of the code
    return code.split('\n').map(line => {
        // first, check for lines that are just comments
        const commentMatch = line.match(/^(\s*[#!].*)$/);
        if (commentMatch) {
            return `<span><span class="comment">${webexpress.webui.Syntax.escape(line)}</span></span>`;
        }

        // next, check for key-value pairs, which may have an inline comment
        const keyValueMatch = line.match(/^(\s*)([^=:\s]+)(\s*[:=]\s*)(.*?)(\s*[#!].*)?$/);
        if (keyValueMatch) {
            const leadingSpace = keyValueMatch[1] || '';
            const key = keyValueMatch[2] || '';
            const separator = keyValueMatch[3] || '';
            const value = keyValueMatch[4] || '';
            const inlineComment = keyValueMatch[5] || '';

            // build the highlighted html string part by part
            const escape = webexpress.webui.Syntax.escape;
            let html = leadingSpace;
            html += `<span class="key">${escape(key)}</span>`;
            html += `<span class="separator">${escape(separator)}</span>`;
            html += `<span class="value">${escape(value)}</span>`;
            if (inlineComment) {
                html += `<span class="comment">${escape(inlineComment)}</span>`;
            }
            return `<span>${html}</span>`;
        }

        // if the line is not a comment and not a key-value pair, return it without formatting
        // this handles empty lines and section headers like [section] in ini files
        return `<span>${webexpress.webui.Syntax.escape(line)}</span>`;
    }).join('\n');
});