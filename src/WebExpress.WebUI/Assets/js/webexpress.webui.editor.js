/**
 * A WYSIWYG editor control.
 */
webexpress.webui.EditorCtrl = class extends webexpress.webui.Ctrl {
    _formFieldName = null;
    _formInput = null;
    _tableToolbar = null;
    _editorElement = null;
    _savedRange = null;
    _tableToolbarShownOnce = false;
    _colors = [
        // basic colors
        "#000000", "#FF0000", "#008000", "#0000FF", "#FFFF00",
        "#FFA500", "#800080", "#A52A2A", "#00FFFF", "#808080",
        // extended palette
        "#FFC0CB", "#FFD700", "#B22222", "#ADFF2F", "#20B2AA",
        "#00CED1", "#4682B4", "#DA70D6", "#D2691E", "#C0C0C0",
        // pastel tones
        "#FFB6C1", "#FFDAB9", "#E6E6FA", "#98FB98", "#AFEEEE",
        "#D3D3D3", "#FFE4E1", "#F0E68C", "#F5DEB3", "#F4A460",
        // dark shades
        "#2F4F4F", "#696969", "#708090", "#778899", "#556B2F",
        "#483D8B", "#8B0000", "#9400D3", "#FF4500", "#DC143C"
    ];

    /**
     * Constructor to initialize the editor.
     * @param {HTMLElement} element - The DOM element associated with the editor instance.
     */
    constructor(element) {
        super(element);
        const content = element.innerHTML;
        this._formFieldName = element.getAttribute('name') || null;
        element.removeAttribute('name');
        element.innerHTML = '';
        element.classList.add('wx-editor');
        this._createToolbar(element);
        this._createEditorArea(element, content);
        this._createStatusBar(element);
        this._enableTableTabNavigation();
        if (this._formFieldName) {
            this._ensureFormInput();
        }
        const toolbar = element.querySelector('.wx-editor-toolbar');
        if (toolbar) {
            toolbar.addEventListener('mousedown', () => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    this._savedRange = sel.getRangeAt(0).cloneRange();
                }
            }, true);
        }
        this._editorElement.addEventListener('input', () => {
            if (this._formInput) {
                this._formInput.value = this._editorElement.innerHTML;
            }
        });
    }

    /**
     * Creates the toolbar with all sub toolbars.
     * @param {HTMLElement} element - The container element.
     */
    _createToolbar(element) {
        const toolbar = document.createElement("div");
        toolbar.classList.add("wx-editor-toolbar");
        this._tableToolbar = this._createTableToolbar(element);
        toolbar.appendChild(this._createFormatToolbar(element));
        toolbar.appendChild(this._tableToolbar);
        element.appendChild(toolbar);
    }

    /**
     * Creates the format toolbar section.
     * @param {HTMLElement} element - The container element.
     * @returns {HTMLElement} The format toolbar element.
     */
    _createFormatToolbar(element) {
        const toolbar = document.createElement("div");
        toolbar.classList.add("wx-editor-format-toolbar");
        toolbar.appendChild(this._createFormatDropdown());
        toolbar.appendChild(this._createSeparator());
        toolbar.appendChild(this._createFormattingButtons());
        toolbar.appendChild(this._createStyleDropdown());
        toolbar.appendChild(this._createColorDropdown());
        toolbar.appendChild(this._createSeparator());
        toolbar.appendChild(this._createListButtons());
        toolbar.appendChild(this._createSeparator());
        toolbar.appendChild(this._createIndentButtons());
        toolbar.appendChild(this._createSeparator());
        toolbar.appendChild(this._createAlignButtons());
        toolbar.appendChild(this._createSeparator());
        // link + image buttons
        toolbar.appendChild(this._createLinkButton());
        toolbar.appendChild(this._createImageButton());
        toolbar.appendChild(this._createSeparator());
        toolbar.appendChild(this._createTableInsertButton());
        return toolbar;
    }

    /**
     * Creates the floating table toolbar.
     * @returns {HTMLElement} The table toolbar element.
     */
    _createTableToolbar() {
        const tableToolbar = document.createElement("div");
        tableToolbar.className = "wx-editor-table-toolbar";
        tableToolbar.style.display = "none";
        tableToolbar.appendChild(this._createInsertRowAboveButton());
        tableToolbar.appendChild(this._createInsertRowBelowButton());
        tableToolbar.appendChild(this._createDeleteRowButton());
        tableToolbar.appendChild(this._createSeparator());
        tableToolbar.appendChild(this._createInsertColumnLeftButton());
        tableToolbar.appendChild(this._createInsertColumnRightButton());
        tableToolbar.appendChild(this._createDeleteColumnButton());
        tableToolbar.appendChild(this._createSeparator());
        tableToolbar.appendChild(this._createMergeCellsButton());
        tableToolbar.appendChild(this._createSplitCellButton());
        tableToolbar.appendChild(this._createSeparator());
        tableToolbar.appendChild(this._createCellBackgroundColorButton());
        tableToolbar.appendChild(this._createSeparator());
        tableToolbar.appendChild(this._createDeleteTableButton());
        return tableToolbar;
    }

    /**
     * Creates the block format dropdown (e.g., Paragraph, Heading 1).
     * @returns {HTMLElement} The dropdown container element.
     */
    _createFormatDropdown() {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
        button.setAttribute("data-bs-toggle", "dropdown");
        const buttonText = document.createElement("span");
        buttonText.textContent = "Paragraph";
        button.appendChild(buttonText);
        const menu = document.createElement("ul");
        menu.className = "dropdown-menu";
        const formatOptions = [
            { command: "p", label: "Paragraph" },
            { command: "h1", label: "Heading 1" },
            { command: "h2", label: "Heading 2" },
            { command: "h3", label: "Heading 3" },
            { command: "blockquote", label: "Quote" },
            { command: "pre", label: "Code Block" }
        ];
        formatOptions.forEach(option => {
            const item = document.createElement("li");
            const optionButton = document.createElement("button");
            optionButton.className = "dropdown-item";
            optionButton.textContent = option.label;
            optionButton.dataset.command = option.command;
            optionButton.addEventListener("click", () => {
                document.execCommand("formatBlock", false, option.command);
                buttonText.textContent = option.label;
            });
            item.appendChild(optionButton);
            menu.appendChild(item);
        });
        container.appendChild(button);
        container.appendChild(menu);
        const updateDropdownText = () => {
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) {
                return;
            }
            const range = selection.getRangeAt(0);
            let node = range.startContainer;
            if (node && node.nodeType !== Node.ELEMENT_NODE) {
                node = node.parentElement;
            }
            if (node && this._editorElement && this._editorElement.contains(node)) {
                const currentFormat = document.queryCommandValue("formatBlock") || "p";
                const foundOption = formatOptions.find(opt => opt.command === currentFormat);
                buttonText.textContent = foundOption ? foundOption.label : "Paragraph";
            }
        };
        document.addEventListener("selectionchange", updateDropdownText);
        return container;
    }

    /**
     * Creates basic formatting buttons (bold, italic, underline).
     * @returns {DocumentFragment} A fragment containing the buttons.
     */
    _createFormattingButtons() {
        const fragment = document.createDocumentFragment();
        const buttons = this._createButtons([
            { command: "bold", icon: "fas fa-bold", label: "Bold" },
            { command: "italic", icon: "fas fa-italic", label: "Italic" },
            { command: "underline", icon: "fas fa-underline", label: "Underline" }
        ]);
        document.addEventListener("selectionchange", () => this._updateButtonStates());
        buttons.forEach(button => {
            fragment.appendChild(button);
        });
        return fragment;
    }

    /**
     * Creates a style dropdown for strikethrough, superscript, and subscript.
     * @returns {HTMLElement} The dropdown element.
     */
    _createStyleDropdown() {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
        button.setAttribute("data-bs-toggle", "dropdown");
        button.innerHTML = '<i class="fas fa-text-height"></i>';
        const menu = document.createElement("ul");
        menu.className = "dropdown-menu";
        const options = [
            { command: "strikethrough", label: "Strikethrough", icon: "fas fa-strikethrough" },
            { command: "superscript", label: "Superscript", icon: "fas fa-superscript" },
            { command: "subscript", label: "Subscript", icon: "fas fa-subscript" }
        ];
        options.forEach(option => {
            const item = document.createElement("li");
            const optionButton = document.createElement("button");
            optionButton.className = "dropdown-item";
            optionButton.innerHTML = `<i class="${option.icon}"></i> ${option.label}`;
            optionButton.dataset.command = option.command;
            optionButton.addEventListener("click", () => {
                this._execCommand(option.command);
            });
            item.appendChild(optionButton);
            menu.appendChild(item);
        });
        container.appendChild(button);
        container.appendChild(menu);
        return container;
    }

    /**
     * Creates the text color dropdown with a color picker.
     * @returns {HTMLElement} The dropdown group element.
     */
    _createColorDropdown() {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
        button.type = "button";
        button.setAttribute("data-bs-toggle", "dropdown");
        const icon = document.createElement("i");
        icon.className = "fas fa-palette";
        const updateIconColor = () => {
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) {
                return;
            }
            const range = selection.getRangeAt(0);
            let node = range.startContainer;
            if (node && node.nodeType !== Node.ELEMENT_NODE) {
                node = node.parentElement;
            }
            if (node && this._editorElement && this._editorElement.contains(node)) {
                const color = document.queryCommandValue("foreColor") || "#000000";
                icon.style.color = color;
            }
        };
        updateIconColor();
        button.appendChild(icon);
        const menu = document.createElement("div");
        menu.className = "dropdown-menu";
        const colorPickerContainer = document.createElement("ul");
        colorPickerContainer.className = "wx-editor-color-picker";
        this._colors.forEach(color => {
            const item = document.createElement("li");
            const colorButton = document.createElement("button");
            colorButton.className = "dropdown-item p-2";
            colorButton.type = "button";
            colorButton.style.backgroundColor = color;
            colorButton.style.width = "24px";
            colorButton.style.height = "24px";
            colorButton.style.border = "none";
            colorButton.style.cursor = "pointer";
            colorButton.style.display = "inline-block";
            colorButton.addEventListener("click", () => {
                document.execCommand("foreColor", false, color);
                icon.style.color = color;
                this._restoreSavedRange();
            });
            item.appendChild(colorButton);
            colorPickerContainer.appendChild(item);
        });
        menu.appendChild(colorPickerContainer);
        container.appendChild(button);
        container.appendChild(menu);
        document.addEventListener("selectionchange", updateIconColor);
        return container;
    }

    /**
     * Creates list buttons (unordered, ordered).
     * @returns {DocumentFragment} A fragment containing the buttons.
     */
    _createListButtons() {
        const fragment = document.createDocumentFragment();
        const buttons = this._createButtons([
            { command: "insertUnorderedList", icon: "fas fa-list-ul", label: "Bullet List" },
            { command: "insertOrderedList", icon: "fas fa-list-ol", label: "Numbered List" }
        ]);
        document.addEventListener("selectionchange", () => this._updateButtonStates());
        buttons.forEach(button => {
            fragment.appendChild(button);
        });
        return fragment;
    }

    /**
     * Creates indent and outdent buttons.
     * @returns {DocumentFragment} A fragment containing the buttons.
     */
    _createIndentButtons() {
        const fragment = document.createDocumentFragment();
        const buttons = this._createButtons([
            { command: "outdent", icon: "fas fa-outdent", label: "Decrease Indent" },
            { command: "indent", icon: "fas fa-indent", label: "Increase Indent" }
        ]);
        document.addEventListener("selectionchange", () => this._updateButtonStates());
        buttons.forEach(button => {
            fragment.appendChild(button);
        });
        return fragment;
    }

    /**
     * Creates alignment buttons (left, center, right, justify).
     * @returns {DocumentFragment} A fragment containing the buttons.
     */
    _createAlignButtons() {
        const fragment = document.createDocumentFragment();
        const buttons = this._createButtons([
            { command: "justifyLeft", icon: "fas fa-align-left", label: "Align Left" },
            { command: "justifyCenter", icon: "fas fa-align-center", label: "Align Center" },
            { command: "justifyRight", icon: "fas fa-align-right", label: "Align Right" },
            { command: "justifyFull", icon: "fas fa-align-justify", label: "Justify Text" }
        ]);
        document.addEventListener("selectionchange", () => this._updateButtonStates());
        buttons.forEach(button => {
            fragment.appendChild(button);
        });
        return fragment;
    }

    /**
     * Creates a button to insert a hyperlink.
     * @returns {HTMLElement} The button element.
     */
    _createLinkButton() {
        const button = document.createElement("button");
        button.className = "wx-editor-btn";
        button.type = "button";
        button.title = "Insert Link";
        button.innerHTML = '<i class="fas fa-link"></i>';
        button.addEventListener("click", () => {
            this._restoreSavedRange();
            const url = window.prompt("URL:");
            if (!url) {
                return;
            }
            const safeUrl = this._sanitizeUrl(url);
            if (!safeUrl) {
                return;
            }
            const sel = window.getSelection();
            let text = "";
            if (sel && sel.rangeCount && !sel.isCollapsed) {
                text = sel.toString();
            }
            if (!text) {
                text = safeUrl.replace(/^https?:\/\//i, "");
            }
            this._insertHtmlAtCursor(`<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${this._escapeHtml(text)}</a>`);
        });
        return button;
    }

    /**
     * Creates a button to insert an image.
     * @returns {HTMLElement} The button element.
     */
    _createImageButton() {
        const button = document.createElement("button");
        button.className = "wx-editor-btn";
        button.type = "button";
        button.title = "Insert Image";
        button.innerHTML = '<i class="fas fa-image"></i>';
        button.addEventListener("click", () => {
            this._restoreSavedRange();
            const url = window.prompt("Image URL:");
            if (!url) {
                return;
            }
            const safeUrl = this._sanitizeUrl(url);
            if (!safeUrl) {
                return;
            }
            const alt = window.prompt("Alt text (optional):") || "";
            this._insertHtmlAtCursor(`<img src="${safeUrl}" alt="${this._escapeHtml(alt)}">`);
        });
        return button;
    }

    /**
     * Sanitizes a URL to reduce risk of XSS via javascript: schemes.
     * @param {string} url - raw url
     * @returns {string|null} sanitized url or null if invalid
     */
    _sanitizeUrl(url) {
        const trimmed = String(url).trim();
        if (trimmed === "") {
            return null;
        }
        if (/^javascript:/i.test(trimmed)) {
            return null;
        }
        return trimmed;
    }

    /**
     * Escapes HTML special characters in text nodes.
     * @param {string} str - raw string
     * @returns {string} escaped string
     */
    _escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * Creates the table insertion button with a size selection grid.
     * @returns {HTMLElement} The button group container.
     */
    _createTableInsertButton() {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
        button.type = "button";
        button.setAttribute("data-bs-toggle", "dropdown");
        button.innerHTML = '<i class="fas fa-table"></i>';
        const menu = document.createElement("div");
        menu.className = "dropdown-menu p-3";
        const grid = document.createElement("div");
        grid.className = "wx-editor-insertable-grid";
        const sizeDisplay = document.createElement("div");
        sizeDisplay.className = "wx-editor-table-size-display";
        sizeDisplay.textContent = "1 × 1";
        const INITIAL_ROWS = 5;
        const INITIAL_COLS = 5;
        const ABS_MAX = 18;
        let maxRows = INITIAL_ROWS;
        let maxCols = INITIAL_COLS;
        let matrix = [];
        let selectedRows = 1;
        let selectedCols = 1;

        const highlightCells = (rows, cols, totalRows, totalCols) => {
            totalRows = totalRows || maxRows;
            totalCols = totalCols || maxCols;
            for (let r = 0; r < totalRows; r++) {
                for (let c = 0; c < totalCols; c++) {
                    if (matrix[r] && matrix[r][c]) {
                        if (r < rows && c < cols && rows > 0 && cols > 0) {
                            matrix[r][c].classList.add("selected");
                        } else {
                            matrix[r][c].classList.remove("selected");
                        }
                    }
                }
            }
        };

        const updateSizeDisplay = (rows, cols) => {
            sizeDisplay.textContent = `${rows} × ${cols}`;
        };

        const buildGrid = (rows, cols) => {
            grid.innerHTML = "";
            matrix = [];
            grid.style.gridTemplateColumns = `repeat(${cols}, 24px)`;
            grid.style.gridTemplateRows = `repeat(${rows}, 24px)`;
            for (let r = 0; r < rows; r++) {
                matrix[r] = [];
                for (let c = 0; c < cols; c++) {
                    const cell = document.createElement("div");
                    cell.className = "wx-editor-insertable-cell";
                    cell.dataset.row = r + 1;
                    cell.dataset.col = c + 1;
                    matrix[r][c] = cell;
                    cell.addEventListener("mouseenter", () => {
                        selectedRows = r + 1;
                        selectedCols = c + 1;
                        highlightCells(selectedRows, selectedCols, rows, cols);
                        updateSizeDisplay(selectedRows, selectedCols);
                        if ((selectedRows === maxRows || selectedCols === maxCols) && (maxRows < ABS_MAX || maxCols < ABS_MAX)) {
                            if (maxRows < ABS_MAX && selectedRows === maxRows) {
                                maxRows = Math.min(maxRows + 1, ABS_MAX);
                            }
                            if (maxCols < ABS_MAX && selectedCols === maxCols) {
                                maxCols = Math.min(maxCols + 1, ABS_MAX);
                            }
                            buildGrid(maxRows, maxCols);
                            highlightCells(selectedRows, selectedCols, maxRows, maxCols);
                            updateSizeDisplay(selectedRows, selectedCols);
                        }
                    });
                    cell.addEventListener("click", e => {
                        this._insertTable(selectedRows, selectedCols);
                        if (menu.classList.contains("show")) {
                            menu.classList.remove("show");
                        }
                        resetGrid();
                        e.preventDefault();
                        e.stopPropagation();
                    });
                    grid.appendChild(cell);
                }
            }
            highlightCells(selectedRows, selectedCols, rows, cols);
        };

        const resetGrid = () => {
            maxRows = INITIAL_ROWS;
            maxCols = INITIAL_COLS;
            selectedRows = 1;
            selectedCols = 1;
            buildGrid(maxRows, maxCols);
            updateSizeDisplay(1, 1);
        };

        resetGrid();
        menu.appendChild(grid);
        menu.appendChild(sizeDisplay);
        container.appendChild(button);
        container.appendChild(menu);

        document.addEventListener("click", (event) => {
            if (!container.contains(event.target)) {
                resetGrid();
            }
        });

        button.addEventListener('click', () => {
            setTimeout(() => {
                resetGrid();
            }, 0);
        });

        const detectTableSelection = () => {
            const selection = window.getSelection();
            if (!selection.rangeCount) {
                return false;
            }
            const range = selection.getRangeAt(0);
            let node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) {
                node = node.parentElement;
            }
            return this._editorElement.contains(node) && node.closest("table");
        };

        document.addEventListener("selectionchange", () => {
            if (detectTableSelection()) {
                this._tableToolbar.style.display = "block";
                this._tableToolbarShownOnce = true;
            } else {
                if (!this._tableToolbarShownOnce) {
                    this._tableToolbar.style.display = "none";
                }
            }
        });

        return container;
    }

    /**
     * Creates a button to insert a row above the current one.
     * @returns {HTMLButtonElement} The button element.
     */
    _createInsertRowAboveButton() {
        const action = { command: "insertRowAbove", label: "Add Row Above", icon: "wx-icon add-row-above" };
        return this._createTableButton(action);
    }

    /**
     * Creates a button to insert a row below the current one.
     * @returns {HTMLButtonElement} The button element.
     */
    _createInsertRowBelowButton() {
        const action = { command: "insertRowBelow", label: "Add Row Below", icon: "wx-icon add-row-below" };
        return this._createTableButton(action);
    }

    /**
     * Creates a button to delete the current row.
     * @returns {HTMLButtonElement} The button element.
     */
    _createDeleteRowButton() {
        const action = { command: "deleteRow", label: "Delete Row", icon: "wx-icon delete-row" };
        return this._createTableButton(action);
    }

    /**
     * Creates a button to insert a column to the left of the current one.
     * @returns {HTMLButtonElement} The button element.
     */
    _createInsertColumnLeftButton() {
        const action = { command: "insertColumnLeft", label: "Add Column Left", icon: "wx-icon add-col-left" };
        return this._createTableButton(action);
    }

    /**
     * Creates a button to insert a column to the right of the current one.
     * @returns {HTMLButtonElement} The button element.
     */
    _createInsertColumnRightButton() {
        const action = { command: "insertColumnRight", label: "Add Column Right", icon: "wx-icon add-col-right" };
        return this._createTableButton(action);
    }

    /**
     * Creates a button to merge selected cells.
     * @returns {HTMLButtonElement} The button element.
     */
    _createMergeCellsButton() {
        const button = document.createElement("button");
        button.className = "wx-editor-btn";
        button.title = "Merge cells";
        button.innerHTML = '<i class="wx-icon merge-cells"></i>';
        button.addEventListener("click", () => {
            this._mergeCells();
            this._restoreSavedRange();
        });
        return button;
    }

    /**
     * Creates a button to split a merged cell.
     * @returns {HTMLButtonElement} The button element.
     */
    _createSplitCellButton() {
        const button = document.createElement("button");
        button.className = "wx-editor-btn";
        button.title = "Split cell";
        button.innerHTML = '<i class="wx-icon split-cell"></i>';
        button.addEventListener("click", () => {
            this._splitCell();
            this._restoreSavedRange();
        });
        return button;
    }

    /**
     * Creates a dropdown to set the background color of a table cell.
     * @returns {HTMLElement} The button group element.
     */
    _createCellBackgroundColorButton() {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";
        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
        button.type = "button";
        button.setAttribute("data-bs-toggle", "dropdown");
        const icon = document.createElement("i");
        icon.className = "wx-icon cell-background";
        button.appendChild(icon);
        const menu = document.createElement("div");
        menu.className = "dropdown-menu";
        const colorPickerContainer = document.createElement("ul");
        colorPickerContainer.className = "wx-editor-color-picker";
        this._colors.forEach(color => {
            const item = document.createElement("li");
            const colorButton = document.createElement("button");
            colorButton.className = "dropdown-item p-2";
            colorButton.type = "button";
            colorButton.style.backgroundColor = color;
            colorButton.style.width = "24px";
            colorButton.style.height = "24px";
            colorButton.style.border = "none";
            colorButton.style.cursor = "pointer";
            colorButton.style.display = "inline-block";
            colorButton.addEventListener("click", () => {
                const selection = window.getSelection();
                if (!selection.rangeCount) {
                    return;
                }
                let cell = selection.getRangeAt(0).startContainer;
                if (cell.nodeType !== Node.ELEMENT_NODE) {
                    cell = cell.parentElement;
                }
                cell = cell.closest('td,th');
                if (cell) {
                    cell.style.backgroundColor = color;
                }
            });
            item.appendChild(colorButton);
            colorPickerContainer.appendChild(item);
        });
        menu.appendChild(colorPickerContainer);
        container.appendChild(button);
        container.appendChild(menu);
        return container;
    }

    /**
     * Creates a button to delete the current column.
     * @returns {HTMLButtonElement} The button element.
     */
    _createDeleteColumnButton() {
        const action = { command: "deleteColumn", label: "Delete Column", icon: "wx-icon delete-col" };
        return this._createTableButton(action);
    }

    /**
     * Creates a button to delete the entire table.
     * @returns {HTMLButtonElement} The button element.
     */
    _createDeleteTableButton() {
        const button = document.createElement("button");
        button.className = "wx-editor-btn";
        button.title = "Delete Table";
        button.innerHTML = '<i class="wx-icon delete-table"></i> Delete Table';
        button.addEventListener("click", () => {
            this._deleteWholeTable();
            this._restoreSavedRange();
        });
        return button;
    }

    /**
     * Creates a visual separator for the toolbar.
     * @returns {HTMLElement} The separator span element.
     */
    _createSeparator() {
        const separator = document.createElement("span");
        separator.classList.add("wx-editor-separator");
        return separator;
    }

    /**
     * Creates generic command buttons.
     * @param {Object[]} buttons - An array of button definitions.
     * @returns {HTMLElement[]} An array of button elements.
     */
    _createButtons(buttons) {
        return buttons.map(btn => {
            const button = document.createElement("button");
            button.className = "wx-editor-btn";
            button.type = "button";
            button.title = btn.label;
            button.dataset.command = btn.command;
            const icon = document.createElement("i");
            icon.className = btn.icon;
            button.appendChild(icon);
            button.addEventListener("click", () => {
                document.execCommand(btn.command);
                this._updateButtonStates();
                this._restoreSavedRange();
            });
            return button;
        });
    }

    /**
     * Creates a button for a table-specific command.
     * @param {Object} action - The action definition.
     * @returns {HTMLButtonElement} The button element.
     */
    _createTableButton(action) {
        const button = document.createElement("button");
        button.className = "wx-editor-btn";
        button.type = "button";
        button.title = action.label;
        button.innerHTML = `<i class="${action.icon}"></i>`;
        button.addEventListener("click", () => {
            this._modifyTable(action.command);
            this._restoreSavedRange();
        });
        return button;
    }

    /**
     * Updates the active states of formatting buttons based on the current selection.
     */
    _updateButtonStates() {
        const buttons = document.querySelectorAll(".wx-editor-btn");
        buttons.forEach(button => {
            const isActive = button.dataset.command ? document.queryCommandState(button.dataset.command) : false;
            button.classList.toggle("active", isActive);
        });
    }

    /**
     * Creates the main editor area where content is edited.
     * @param {HTMLElement} element - The parent element.
     * @param {string} content - The initial HTML content.
     */
    _createEditorArea(element, content) {
        this.editorContainer = document.createElement("div");
        this.editorContainer.classList.add("wx-editor-container");
        this._editorElement = document.createElement("div");
        this._editorElement.classList.add("wx-editor-content");
        this._editorElement.setAttribute("contenteditable", "true");
        this._editorElement.style.minHeight = "200px";
        if (content) {
            this._editorElement.innerHTML = content;
        }
        this.editorContainer.appendChild(this._editorElement);
        element.appendChild(this.editorContainer);
    }

    /**
     * Creates the status bar at the bottom of the editor.
     * @param {HTMLElement} element - The parent element.
     */
    _createStatusBar(element) {
        this.statusBar = document.createElement("div");
        this.statusBar.classList.add("wx-editor-status");
        element.appendChild(this.statusBar);
    }

    /**
     * Inserts a table at the current cursor position.
     * @param {number} rows - The number of rows for the table.
     * @param {number} cols - The number of columns for the table.
     */
    _insertTable(rows, cols) {
        let tableHTML = "<table class='wx-editor-table' border='1'><thead><tr>";
        for (let c = 0; c < cols; c++) {
            tableHTML += "<th><br></th>";
        }
        tableHTML += "</tr></thead><tbody>";
        for (let r = 1; r < rows; r++) {
            tableHTML += "<tr>";
            for (let c = 0; c < cols; c++) {
                tableHTML += "<td><br></td>";
            }
            tableHTML += "</tr>";
        }
        tableHTML += "</tbody></table>";
        this._insertHtmlAtCursor(tableHTML);
    }

    /**
     * Inserts raw HTML at the current cursor position.
     * @param {string} html - The HTML string to insert.
     */
    _insertHtmlAtCursor(html) {
        this._restoreSavedRange();
        let sel = window.getSelection();
        if (sel && sel.rangeCount) {
            let range = sel.getRangeAt(0);
            if (!this._editorElement.contains(range.startContainer)) {
                this._editorElement.innerHTML += html;
                return;
            }
            range.deleteContents();
            let el = document.createElement("div");
            el.innerHTML = html;
            const marker = document.createElement("span");
            marker.id = "wx-editor-marker-" + Date.now() + "-" + Math.random();
            marker.style.display = "inline-block";
            marker.style.width = "0";
            marker.style.height = "0";
            marker.style.overflow = "hidden";
            let frag = document.createDocumentFragment();
            let node;
            let lastNode;
            while ((node = el.firstChild)) {
                lastNode = frag.appendChild(node);
            }
            frag.appendChild(marker);
            range.insertNode(frag);
            const newRange = document.createRange();
            newRange.setStartAfter(marker);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            marker.parentNode.removeChild(marker);
            if (lastNode && typeof lastNode.scrollIntoView === "function") {
                lastNode.scrollIntoView({ block: "nearest" });
            }
        } else {
            this._editorElement.innerHTML += html;
        }
    }

    /**
     * Restores the previously saved selection range.
     */
    _restoreSavedRange() {
        if (this._savedRange) {
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this._savedRange);
            this._savedRange = null;
        }
    }

    /**
     * Applies a block style tag (e.g., 'p', 'h1') to the selection.
     * @param {string} style - The tag name of the style to apply.
     */
    _applyTextStyle(style) {
        document.execCommand("formatBlock", false, style);
        this._restoreSavedRange();
    }

    /**
     * Executes a document command (e.g., 'bold', 'italic').
     * @param {string} command - The name of the command to execute.
     */
    _execCommand(command) {
        document.execCommand(command, false, null);
        this._restoreSavedRange();
    }

    /**
     * Returns the table editing context (cell, row, table) for current selection.
     * @returns {{cell:HTMLTableCellElement,row:HTMLTableRowElement,table:HTMLTableElement}|null}
     */
    _getTableContext() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) {
            return null;
        }
        let node = selection.getRangeAt(0).startContainer;
        if (node.nodeType !== Node.ELEMENT_NODE) {
            node = node.parentElement;
        }
        if (!node) {
            return null;
        }
        const cell = node.closest('td,th');
        if (!cell) {
            return null;
        }
        const row = cell.parentElement;
        const table = cell.closest('table');
        if (!row || !table) {
            return null;
        }
        return { cell, row, table };
    }

    /**
     * Places the caret inside an element (start).
     * @param {HTMLElement} el - target element
     */
    _placeCaret(el) {
        if (!el) {
            return;
        }
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    /**
     * Inserts a new row above the reference row.
     * @param {HTMLTableRowElement} row - reference row
     * @returns {HTMLTableRowElement} new row
     */
    _insertRowAbove(row) {
        const table = row.closest('table');
        if (!table) {
            return null;
        }
        const newRow = row.cloneNode(false);
        for (let i = 0; i < row.cells.length; i++) {
            const newCell = row.cells[i].cloneNode(false);
            newCell.innerHTML = "<br>";
            newRow.appendChild(newCell);
        }
        row.parentElement.insertBefore(newRow, row);
        return newRow;
    }

    /**
     * Inserts a new row below the reference row.
     * @param {HTMLTableRowElement} row - reference row
     * @returns {HTMLTableRowElement} new row
     */
    _insertRowBelow(row) {
        const table = row.closest('table');
        if (!table) {
            return null;
        }
        const newRow = row.cloneNode(false);
        for (let i = 0; i < row.cells.length; i++) {
            const newCell = row.cells[i].cloneNode(false);
            newCell.innerHTML = "<br>";
            newRow.appendChild(newCell);
        }
        if (row.nextSibling) {
            row.parentElement.insertBefore(newRow, row.nextSibling);
        } else {
            row.parentElement.appendChild(newRow);
        }
        return newRow;
    }

    /**
     * Inserts a new column to the left of the given cell index.
     * @param {HTMLTableCellElement} cell - reference cell
     * @returns {number} new cell index
     */
    _insertColumnLeft(cell) {
        const table = cell.closest('table');
        if (!table) {
            return -1;
        }
        const idx = cell.cellIndex;
        for (let r = 0; r < table.rows.length; r++) {
            const row = table.rows[r];
            const ref = row.cells[idx];
            const newCell = document.createElement(ref ? ref.tagName.toLowerCase() : 'td');
            newCell.innerHTML = "<br>";
            row.insertBefore(newCell, ref);
        }
        return idx;
    }

    /**
     * Inserts a new column to the right of the given cell index.
     * @param {HTMLTableCellElement} cell - reference cell
     * @returns {number} new cell index
     */
    _insertColumnRight(cell) {
        const table = cell.closest('table');
        if (!table) {
            return -1;
        }
        const idx = cell.cellIndex;
        for (let r = 0; r < table.rows.length; r++) {
            const row = table.rows[r];
            const ref = row.cells[idx];
            const newCell = document.createElement(ref ? ref.tagName.toLowerCase() : 'td');
            newCell.innerHTML = "<br>";
            if (ref && ref.nextSibling) {
                row.insertBefore(newCell, ref.nextSibling);
            } else {
                row.appendChild(newCell);
            }
        }
        return idx + 1;
    }

    /**
     * Deletes a row with fallback to remove table if last row.
     * @param {HTMLTableRowElement} row - row to delete
     */
    _deleteRow(row) {
        const table = row.closest('table');
        if (!table) {
            return;
        }
        const totalRows = table.rows.length;
        const nextFocus = row.nextElementSibling || row.previousElementSibling;
        row.remove();
        if (totalRows <= 1) {
            table.remove();
        } else {
            if (nextFocus && nextFocus.cells && nextFocus.cells[0]) {
                this._placeCaret(nextFocus.cells[0]);
            }
        }
    }

    /**
     * Deletes a column at specified cell index with fallback to remove table.
     * @param {HTMLTableCellElement} cell - reference cell
     */
    _deleteColumn(cell) {
        const table = cell.closest('table');
        if (!table) {
            return;
        }
        const idx = cell.cellIndex;
        let remainingCols = table.rows[0].cells.length;
        if (remainingCols <= 1) {
            table.remove();
            return;
        }
        for (let r = 0; r < table.rows.length; r++) {
            const row = table.rows[r];
            if (row.cells[idx]) {
                row.deleteCell(idx);
            }
        }
        const focusRow = table.rows[0];
        if (focusRow) {
            const target = focusRow.cells[idx] || focusRow.cells[idx - 1];
            if (target) {
                this._placeCaret(target);
            }
        }
    }

    /**
     * Modifies the table structure according to the given action.
     * Supported: insertRowAbove, insertRowBelow, insertColumnLeft, insertColumnRight, deleteRow, deleteColumn,
     * legacy: insertRow (below), insertColumn (right).
     * @param {string} action - action identifier
     */
    _modifyTable(action) {
        const ctx = this._getTableContext();
        if (!ctx) {
            return;
        }
        const { cell, row, table } = ctx;
        switch (action) {
            case "insertRowAbove": {
                const newRow = this._insertRowAbove(row);
                if (newRow && newRow.cells[0]) {
                    this._placeCaret(newRow.cells[0]);
                }
                break;
            }
            case "insertRowBelow":
            case "insertRow": {
                const newRow = this._insertRowBelow(row);
                if (newRow && newRow.cells[0]) {
                    this._placeCaret(newRow.cells[0]);
                }
                break;
            }
            case "insertColumnLeft": {
                const newIndex = this._insertColumnLeft(cell);
                if (row.cells[newIndex]) {
                    this._placeCaret(row.cells[newIndex]);
                }
                break;
            }
            case "insertColumnRight":
            case "insertColumn": {
                const newIndex = this._insertColumnRight(cell);
                if (row.cells[newIndex]) {
                    this._placeCaret(row.cells[newIndex]);
                }
                break;
            }
            case "deleteRow": {
                this._deleteRow(row);
                break;
            }
            case "deleteColumn": {
                this._deleteColumn(cell);
                break;
            }
            default: {
                break;
            }
        }
        if (!table.isConnected && this._tableToolbar) {
            this._tableToolbar.style.display = "none";
            this._tableToolbarShownOnce = false;
        }
    }

    /**
     * Merges horizontally adjacent selected cells within the same row.
     */
    _mergeCells() {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            return;
        }
        const range = selection.getRangeAt(0);
        let startCell = range.startContainer;
        let endCell = range.endContainer;
        while (startCell && startCell.nodeType !== 1) {
            startCell = startCell.parentElement;
        }
        while (endCell && endCell.nodeType !== 1) {
            endCell = endCell.parentElement;
        }
        startCell = startCell.closest('td,th');
        endCell = endCell.closest('td,th');
        if (!startCell || !endCell) {
            return;
        }
        const row = startCell.parentElement;
        if (row !== endCell.parentElement) {
            return;
        }
        const cells = Array.from(row.children);
        const startIdx = cells.indexOf(startCell);
        const endIdx = cells.indexOf(endCell);
        if (startIdx === -1 || endIdx === -1 || startIdx === endIdx) {
            return;
        }
        const minIdx = Math.min(startIdx, endIdx);
        const maxIdx = Math.max(startIdx, endIdx);
        let mergedContent = '';
        for (let i = minIdx; i <= maxIdx; i++) {
            mergedContent += cells[i].innerHTML + ' ';
        }
        mergedContent = mergedContent.trim();
        cells[minIdx].innerHTML = mergedContent;
        cells[minIdx].setAttribute('colspan', maxIdx - minIdx + 1);
        for (let i = maxIdx; i > minIdx; i--) {
            row.removeChild(cells[i]);
        }
        this._placeCaret(cells[minIdx]);
    }

    /**
     * Splits a cell with a colspan greater than 1 into individual cells.
     */
    _splitCell() {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            return;
        }
        let cell = selection.getRangeAt(0).startContainer;
        if (cell.nodeType !== Node.ELEMENT_NODE) {
            cell = cell.parentElement;
        }
        cell = cell.closest('td,th');
        if (!cell) {
            return;
        }
        let colspan = parseInt(cell.getAttribute('colspan') || 1, 10);
        if (colspan <= 1) {
            return;
        }
        cell.removeAttribute('colspan');
        for (let i = 1; i < colspan; i++) {
            const newCell = cell.cloneNode(false);
            newCell.innerHTML = '<br>';
            cell.parentElement.insertBefore(newCell, cell.nextSibling);
        }
        this._placeCaret(cell);
    }

    /**
     * Deletes the entire table containing the current cursor position.
     */
    _deleteWholeTable() {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            return;
        }
        let node = selection.getRangeAt(0).startContainer;
        if (node.nodeType !== Node.ELEMENT_NODE) {
            node = node.parentElement;
        }
        const table = node.closest("table");
        if (table) {
            table.remove();
            if (this._tableToolbar) {
                if (!this._editorElement.querySelector("table")) {
                    this._tableToolbar.style.display = "none";
                    this._tableToolbarShownOnce = false;
                }
            }
        }
    }

    /**
     * Enables Tab and Shift+Tab navigation within tables.
     */
    _enableTableTabNavigation() {
        this._editorElement.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                const sel = window.getSelection();
                if (!sel.rangeCount) {
                    return;
                }
                let cell = sel.anchorNode;
                while (cell && cell.nodeType !== 1) {
                    cell = cell.parentElement;
                }
                while (cell && !/^TD|TH$/i.test(cell.nodeName)) {
                    cell = cell.parentElement;
                }
                if (cell && (cell.nodeName === 'TD' || cell.nodeName === 'TH')) {
                    e.preventDefault();
                    let targetCell;
                    if (e.shiftKey) {
                        targetCell = getPrevCell(cell);
                    } else {
                        targetCell = getNextCell(cell);
                        if (!targetCell) {
                            const table = cell.closest('table');
                            if (table) {
                                const rows = Array.from(table.rows);
                                const lastRow = rows[rows.length - 1];
                                const lastCell = lastRow.cells[lastRow.cells.length - 1];
                                if (cell === lastCell) {
                                    const colCount = lastRow.cells.length;
                                    const newRow = table.insertRow(rows.length);
                                    for (let c = 0; c < colCount; c++) {
                                        newRow.insertCell(c).innerHTML = '...';
                                    }
                                    targetCell = newRow.cells[0];
                                }
                            }
                        }
                    }
                    if (targetCell) {
                        placeCaretInCell(targetCell);
                    }
                }
            }
            function getNextCell(cell) {
                let next = cell.nextElementSibling;
                if (next) {
                    return next;
                }
                let row = cell.parentElement.nextElementSibling;
                while (row && row.nodeName !== 'TR') {
                    row = row.nextElementSibling;
                }
                if (row && row.children.length > 0) {
                    return row.children[0];
                }
                return null;
            }
            function getPrevCell(cell) {
                let prev = cell.previousElementSibling;
                if (prev) {
                    return prev;
                }
                let row = cell.parentElement.previousElementSibling;
                while (row && row.nodeName !== 'TR') {
                    row = row.previousElementSibling;
                }
                if (row && row.children.length > 0) {
                    return row.children[row.children.length - 1];
                }
                return null;
            }
            function placeCaretInCell(cell) {
                cell.focus();
                let range = document.createRange();
                range.selectNodeContents(cell);
                range.collapse(true);
                let sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    }

    /**
     * Ensures a hidden form input exists and syncs its content on form submission.
     */
    _ensureFormInput() {
        let parent = this._editorElement;
        while (parent && parent.nodeName !== "FORM") {
            parent = parent.parentElement;
        }
        if (parent) {
            let input = parent.querySelector(`input[type="hidden"][name="${this._formFieldName}"]`);
            if (!input) {
                input = document.createElement("input");
                input.type = "hidden";
                input.name = this._formFieldName;
                parent.appendChild(input);
            }
            this._formInput = input;
            parent.addEventListener("submit", () => {
                if (this._formInput) {
                    this._formInput.value = this._editorElement.innerHTML;
                }
            });
        }
    }

    /**
     * Gets the current HTML content of the editor.
     * @returns {string} The HTML content.
     */
    get value() {
        return this._editorElement ? this._editorElement.innerHTML : "";
    }

    /**
     * Sets the HTML content of the editor and dispatches a change event if the content has changed.
     * @param {string} html - The new HTML content.
     */
    set value(html) {
        const newHtml = html != null ? String(html) : "";
        const oldHtml = this._editorElement ? this._editorElement.innerHTML : "";
        if (this._editorElement) {
            this._editorElement.innerHTML = newHtml;
        }
        if (this._formInput) {
            this._formInput.value = newHtml;
        }
        if (oldHtml !== newHtml) {
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.CHANGE_VALUE_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id,
                    value: newHtml
                }
            }));
        }
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-editor", webexpress.webui.EditorCtrl);