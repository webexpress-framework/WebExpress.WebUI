/**
 * A field to display code with copy functionality, optional line numbers, and language header.
 * Supports syntax highlighting by modular and extendable JavaScript files for different programming languages.
 */
webexpress.webui.CodeCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Creates a new code control with copy button and optional syntax highlighting.
     * @param {HTMLElement} element - The DOM element for the code display control.
     */
    constructor(element) {
        super(element);

        // read configuration from attributes
        const language = element.getAttribute("data-language") || null;
        const lineNumbers = element.dataset.lineNumbers === "true";
        const isBase64 = element.dataset.base64 === "true";

        // extract code from innerHTML and normalize line endings
        let rawCode = (element?.innerHTML ?? "").trim().replace(/\r\n/g, "\n");
        this._code = isBase64 && rawCode ? atob(rawCode) : rawCode;

        // clean up and add styling class
        element.innerHTML = "";
        element.classList.add("wx-code");

        // create header, codebox, and copy button directly
        if (language) {
            element.appendChild(this._createHeader(language));
        }

        this._codeBox = this._createCodeBox(language, lineNumbers);
        element.appendChild(this._codeBox);

        this._copyButton = this._createCopyButton();
        element.appendChild(this._copyButton);

        // apply syntax highlighting and fill content
        this._highlightSyntax(language, lineNumbers);
    }

    /**
     * Creates the code box for display.
     * @param {string|null} language - The programming language.
     * @param {boolean} lineNumbers - Whether to show line numbers.
     * @returns {HTMLElement} Code element to display code.
     */
    _createCodeBox(language, lineNumbers) {
        const codeElement = document.createElement("code");
        codeElement.className = lineNumbers ? "wx-code-line-numbers" : "wx-code-line";
        if (language) {
            codeElement.classList.add(`language-${language}`);
        }
        return codeElement;
    }

    /**
     * Creates the header structure for the code box.
     * @param {string|null} language - The programming language.
     * @returns {HTMLElement} The header element for the code box.
     */
    _createHeader(language) {
        const header = document.createElement("div");
        header.className = "wx-code-header";
        header.textContent = language;
        return header;
    }

    /**
     * Creates the copy button with icon.
     * @returns {HTMLElement} The ready-to-use copy button.
     */
    _createCopyButton() {
        const copyButton = document.createElement("button");
        const icon = document.createElement("i");
        icon.className = "fas fa-copy";
        copyButton.classList.add("btn", "btn-sm");
        copyButton.title = this._i18n("webexpress.webui:copy", "Copy");
        copyButton.appendChild(icon);
        copyButton.addEventListener("click", () => this._copyCode());
        return copyButton;
    }

    /**
     * Copies the current code to the clipboard using Clipboard API.
     */
    _copyCode() {
        if (navigator.clipboard && this._code) {
            navigator.clipboard.writeText(this._code).catch(err => {
                console.error("Failed to copy code to clipboard:", err);
            });
        }
    }

    /**
     * Applies syntax highlighting.
     * If language function available, use it; otherwise, display code as plain text, with line numbers when enabled.
     * @param {string|null} language - Programming language (highlight mode)
     * @param {boolean} lineNumbers - Whether to show line numbers.
     */
    _highlightSyntax(language, lineNumbers) {
        // try language-specific syntax highlighter if available
        const syntaxFunction = webexpress.webui.Syntax?.get?.(language);

        this._codeBox.innerHTML = "";
        if (typeof syntaxFunction === "function") {
            this._codeBox.innerHTML = syntaxFunction(this._code);
        } else {
            // use plain text, preserve lines and optionally add line numbers
            const lines = this._code.split("\n");
            lines.forEach((line, idx) => {
                const lineSpan = document.createElement("span");
                lineSpan.textContent = line;
                if (lineNumbers) {
                    const nr = document.createElement("span");
                    nr.textContent = (idx + 1) + ". ";
                    nr.className = "wx-code-linenr";
                    lineSpan.prepend(nr);
                }
                this._codeBox.appendChild(lineSpan);
                if (idx < lines.length - 1) {
                    this._codeBox.appendChild(document.createTextNode("\n"));
                }
            });
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-code", webexpress.webui.CodeCtrl);