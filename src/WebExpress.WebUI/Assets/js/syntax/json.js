// Syntax highlighting for Json.
webexpress.webui.Syntax.register("json", null, (code) => {
  // regex for JSON tokens: keys, strings, booleans, null, numbers, punctuation
  const tokenPattern = /("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\d+\.?\d*(?:[eE][+\-]?\d+)?)|([{}\[\],:])/g;

  function highlightJSON(line) {
    return line.replace(tokenPattern, (match, key, boolNull, number, punctuation) => {
      if (key) {
        // key (string before `:`)
        if (/^(?:\\.|[^"\\])*"(?=\s*:)/.test(key)) {
          return `<span class="key">${key}</span>`;
        }
        // regular string value
        return `<span class="constant">${key}</span>`;
      }
      if (boolNull) {
        const type = /true|false/.test(boolNull) ? "boolean" : "null";
        return `<span class="keyword">${boolNull}</span>`;
      }
      if (number) {
        return `<span class="number">${number}</span>`;
      }
      if (punctuation) {
        return `<span class="bracket">${punctuation}</span>`;
      }
      return match;
    });
  }

  // line-by-line formatting
  return code
    .split("\n")
    .map(line => `<span class="line">${highlightJSON(line.trimEnd())}</span>`)
    .join("");
});