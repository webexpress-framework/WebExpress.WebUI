// Syntax highlighting for XML.
webexpress.webui.Syntax.register("xml", "html", (code) => {
  // HTML escaping
  code = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Attribute pattern
  const attribute = /\s+([A-Za-z0-9\-._]+)(\s*=\s*)("[^"]*"|'[^']*')/g;

  // Flags for the state machine
  let inComment = false;
  let inTag     = false;

  // Helper function: highlight nested attributes
  function highlightAttributes(text) {
    return text.replace(attribute, (_, name, eq, val) => {
      return ` <span class="attribute">${name}</span>` +
             `<span class="operator">${eq}</span>` +
             `<span class="string">${val}</span>`;
    });
  }

  // Wrapper for entire lines
  function wrapLine(cls, line) {
    return `<span class="${cls}">${line}</span>`;
  }

  return code
    .split("\n")
    .map(line => {
      line = line.trimEnd();

      // 1) If we're currently inside a comment
      if (inComment) {
        if (/--&gt;/.test(line)) inComment = false;
        return `<span>${wrapLine("comment", line)}</span>`;
      }

      // 2) If we're currently inside a tag
      if (inTag) {
        const hl = highlightAttributes(line);
        if (/&gt;/.test(line)) inTag = false;
        return `<span>${wrapLine("tag", hl)}</span>`;
      }

      // 3) Detect new comments
      if (/&lt;!--/.test(line)) {
        if (!/--&gt;/.test(line)) inComment = true;
        return `<span>${wrapLine("comment", line)}</span>`;
      }

      // 4) Detect multi-line tags (opening '<' without a closing '>')
      if (/&lt;[A-Za-z]/.test(line) && !/&gt;/.test(line)) {
        inTag = true;
        return `<span>${wrapLine("tag", highlightAttributes(line))}</span>`;
      }

      // 5) Highlight single-line tags (potentially multiple per line)
      const singleTag = /(&lt;\/?[A-Za-z0-9\-._]+(?:\s+[A-Za-z0-9\-._]+(?:\s*=\s*"[^"]*")?)*\s*&gt;)/g;
      const processed = line.replace(singleTag, match => {
        return `<span>${wrapLine("tag", highlightAttributes(match))}</span>`;
      });

      // 6) Default case: normal text
      return `<span>${processed}</span>`;
    })
    .join("");
});