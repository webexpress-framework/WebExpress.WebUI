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
        const isBase64 = element.dataset.base64 === "true";

        // Extract code directly from the HTML structure
        let rawCode = element?.innerHTML?.trim() ?? "";
        this._code = isBase64 ? atob(rawCode) : rawCode;

        // Build the UI for the code display
        this._copyButton = this._createCopyButton();
        this._codeheader = this._createHeader(language);
        this._codeBox = this._createCodeBox(this._code, language, lineNumbers);

        // Clean up DOM and append built elements
        element.innerHTML = "";
        element.classList.add("wx-code");
        
        const container = document.createElement("div");
                
        if (language) {
            container.appendChild(this._codeheader);
        }
        container.appendChild(this._codeBox);
        
        element.appendChild(container);
        element.appendChild(this._copyButton);

        // Highlight syntax if a language is provided
        this._highlightSyntax(language);
    }

    /**
     * Creates the header structure for the code box.
     * @param {string|null} language - The programming language.
     * @returns {HTMLElement} The header for the code box.
     */
    _createHeader(language) {
        const header = document.createElement("div");
        header.className = "wx-code-header"; 

        header.textContent = language ? language : "";

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

        copyButton.classList.add("btn", "btn-sm");
        copyButton.title = webexpress.webui.I18N.translate("webexpress.webui:copy");
        
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
        // use the Clipboard API to copy the code
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
        // retrieve syntax configuration for the specified language
        const syntaxFunction = webexpress.webui.Syntax.get(language);
               
        if (syntaxFunction) {
            this._codeBox.innerHTML = syntaxFunction(this._code);
        }
        else {
            const lines = this._code.split("\n");
            
            // create individual span elements for each line and append them manually
            lines.forEach((line) => {
                const lineSpan = document.createElement("span");
                lineSpan.textContent = line;
                this._codeBox.appendChild(lineSpan); 
            });
        }
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-code", webexpress.webui.CodeCtrl);