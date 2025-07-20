// Syntax highlighting for XML as a class implementation
webexpress.webui.Syntax.register("xml", "html", (code) => {
    // 1. escape HTML special characters to display them as text
    let highlightedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 2. define patterns for different syntax elements
    const patterns = {
        // pattern for comments: <!-- ... -->
        comment: /(&lt;!--[\s\S]*?--&gt;)/g,
        // pattern for tags, including attributes: <tag attr="value"> or </tag>
        tag: /(&lt;\/?([a-zA-Z0-9\-\._]+)((?:\s+[a-zA-Z0-9\-\._]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*&gt;)/g,
        // pattern for attributes within a matched tag: attr="value"
        attribute: /\s+([a-zA-Z0-9\-\._]+)(\s*=\s*)("[^"]*"|'[^']*')/g
    };

    // 3. apply highlighting for comments
    highlightedCode = highlightedCode.replace(patterns.comment, '<span class="comment">$1</span>');

    // 4. apply highlighting for tags and their attributes
    highlightedCode = highlightedCode.replace(patterns.tag, (match, fullTag, tagName, attributes) => {
        // highlight attributes and their values within the tag
        const highlightedAttributes = attributes.replace(patterns.attribute, (attrMatch, name, equals, value) => {
            return ` <span class="attr">${name}</span>${equals}<span class="value">${value}</span>`;
        });
        // reconstruct the tag with highlighted attributes
        return `<span class="tag">${'&lt;/' + tagName}${highlightedAttributes}&gt;</span>`;
    });

    // 5. return the fully highlighted code wrapped in a span
    return `<span>${highlightedCode}</span>`;
});