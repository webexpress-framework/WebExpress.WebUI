/**
 * A field to display code with copy functionality, optional line numbers, and an optional header showing the language.
 * It supports syntax highlighting by modular and extendable JavaScript files for different programming languages.
 */
webexpress.webui.CodeCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element for the code display control.
     */
    constructor(element) {
        super(element);

        // Extract configuration from DOM attributes
        const language = element.getAttribute("data-language") || null;
        const lineNumbers = element.dataset.lineNumbers === "true";

        // Extract code directly from the HTML structure
        this._code = element?.innerHTML?.trim() ?? "";


        // Build the UI for the code display
        this._codeheader = this._createHeader(language);
        this._codeBox = this._createCodeBox(this._code, language, lineNumbers);

        // Clean up DOM and append built elements
        element.innerHTML = "";
        element.classList.add("wx-code");
        element.appendChild(this._codeheader);
        element.appendChild(this._codeBox);

        // Highlight syntax if a language is provided
        this._highlightSyntax(language);
    }

    /**
     * Creates the header structure for the code box, including the label with language and copy button.
     * @param {string|null} language - The programming language.
     * @returns {HTMLElement} The header for the code box.
     */
    _createHeader(language) {
        const header = document.createElement("div");
        header.className = "wx-code-header"; 

        const languageLabel = document.createElement("span");
        languageLabel.textContent = language ? language : "";
        languageLabel.className = "font-weight-bold";

        const copyButton = this._createCopyButton();
        copyButton.classList.add("btn", "btn-sm");

        header.appendChild(languageLabel);
        header.appendChild(copyButton);

        return header;
    }

    /**
     * Creates the code box.
     * @param {string} code - The code to be displayed.
     * @param {string|null} language - The programming language.
     * @param {boolean} lineNumbers - Whether to show line numbers.
     * @returns {HTMLElement} The code box.
     */
    _createCodeBox(code, language, lineNumbers) {
        const codeElement = document.createElement("code");

        if (lineNumbers) {
            codeElement.classList.add("wx-code-line-numbers"); 
        } else {
            codeElement.classList.add("wx-code-line");
        }

        if (language) {
            codeElement.classList.add(`language-${language}`); // Add the language class dynamically
        }

        return codeElement; // Return the constructed pre element
    }

    /**
     * Creates the copy button.
     * @returns {HTMLElement} The copy button.
     */
    _createCopyButton() {
        const copyButton = document.createElement("button");
        const icon = document.createElement("i");
        icon.className = "fas fa-copy"; // FontAwesome icon for copy

        copyButton.appendChild(icon);
        copyButton.addEventListener("click", () => {
            this._copyCode();
        });

        return copyButton;
    }

    /**
     * Copies the current code to the clipboard.
     */
    _copyCode() {       
        // Use the Clipboard API to copy the code
        navigator.clipboard.writeText(this._code)
            .then(() => {
            })
            .catch(err => {
                console.error("Failed to copy code to clipboard:", err);
            });
    }

    /**
     * Applies syntax highlighting to the code in the code box element.
     * Processes each line individually if line numbers are enabled, or applies highlighting to the whole code otherwise.
     * This implementation builds native DOM elements instead of manipulating HTML strings to ensure correctness and security.
     */
    _highlightSyntax(language) {
        // Retrieve syntax configuration for the specified language
        const syntaxConfig = webexpress.webui.Syntax.get(language);
               
        function highlightLine(line, regex) {
            // Use a replacer function to process each match found by the combined regex.
            return line.replace(regex, (match, ...args) => {
                // The last argument in a replace operation is the groups object when using named capture groups.
                const groups = args[args.length - 1];

                // Find the first named group that has a value (is not undefined).
                // This identifies which syntax element was matched.
                for (const groupName in groups) {
                    if (groups[groupName] !== undefined) {
                        // The matched content is in the group.
                        const content = groups[groupName];
                        // The group name corresponds to the CSS class for highlighting.
                        const className = groupName;
                        // Create the span element with the correct class and content.
                        return `<span class="${className}">${content}</span>`;
                    }
                }

                // If for some reason no group matched, return the original match without highlighting.
                return match;
            });
        }

        const lines = this._code.split("\n");
        
        // Create individual span elements for each line and append them manually
        lines.forEach((line) => {
            const lineSpan = document.createElement("span");
            if (syntaxConfig) { 
                lineSpan.innerHTML = highlightLine(line, syntaxConfig);
            } else {
                lineSpan.textContent = line;
            }
            this._codeBox.appendChild(lineSpan); 
        });
        
        
        
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-code", webexpress.webui.CodeCtrl);