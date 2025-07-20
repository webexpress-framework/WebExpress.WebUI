// syntax highlighting for c++
webexpress.webui.Syntax.register("cpp", "c++", (code) => {
    /**
     * escapes html special characters to prevent rendering issues
     * @param {string} str - input string to escape
     * @returns {string} escaped string
     */
    function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /**
     * creates span element with syntax highlighting class
     * @param {string} className - css class for syntax type
     * @param {string} text - content to wrap
     * @returns {string} html span element
     */
    function wrapInSpan(className, text) {
        return `<span class="${className}">${escapeHtml(text)}</span>`;
    }

    /**
     * highlights syntax for a single line of code
     * @param {string} line - source code line
     * @returns {string} highlighted html
     */
    function processLine(line) {
        // initialize with original line
        let result = line;

        // syntax patterns for highlighting
        const patterns = [
            // comments (single and multi-line)
            { regex: /\/\/.*$/g, className: 'comment' },
            { regex: /\/\*[\s\S]*?\*\//g, className: 'comment' },

            // preprocessor directives
            { regex: /^\s*#.*/g, className: 'preprocessor' },

            // string literals
            { regex: /"(?:\\.|[^"\\])*"/g, className: 'string' },
            { regex: /'(?:\\.|[^'\\])*'/g, className: 'string' },

            // numeric values
            { regex: /\b\d+(?:\.\d+)?[fL]?\b/g, className: 'number' },

            // keywords
            { regex: /\b(?:alignas|alignof|and|and_eq|asm|auto|bitand|bitor|bool|break|case|catch|char|char16_t|char32_t|class|compl|const|constexpr|const_cast|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|not|not_eq|nullptr|operator|or|or_eq|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|xor|xor_eq)\b/g, className: 'keyword' },

            // types
            { regex: /\b(?:int|float|double|char|long|short|bool|void|wchar_t|size_t|string)\b/g, className: 'type' },

            // operators (ordered by length to prevent partial matches)
            { regex: /(?:==|!=|<=|>=|<<|>>|&&|\|\||::|->|[=+\-*\/%<>!&|^.~?:])/g, className: 'operator' },

            // brackets and parentheses
            { regex: /[\(\)\{\}\[\]]/g, className: 'bracket' }
        ];

        // store replacements with unique identifiers
        const replacements = new Map();
        let placeholderIndex = 0;

        // first pass: replace syntax elements with placeholders
        patterns.forEach(pattern => {
            result = result.replace(pattern.regex, (match) => {
                const placeholder = `__PLACEHOLDER_${placeholderIndex++}__`;
                replacements.set(placeholder, wrapInSpan(pattern.className, match));
                return placeholder;
            });
        });

        // second pass: escape remaining text
        result = escapeHtml(result);

        // third pass: restore highlighted elements
        replacements.forEach((replacement, placeholder) => {
            result = result.replace(placeholder, replacement);
        });

        return result;
    }

    // process entire code block line by line
    return code.split('\n').map(line => {
        const highlightedLine = processLine(line);
        return `<span>${highlightedLine}</span>`;
    }).join('');
});