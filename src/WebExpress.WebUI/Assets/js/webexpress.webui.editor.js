/**
 * A WYSIWYG editor.
 */
webexpress.webui.EditorCtrl = class extends webexpress.webui.Ctrl {
    _formFieldName = null;
    _formInput = null;
    _tableToolbar = null;
    _editorElement = null;
    _savedRange = null;
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
     * Constructor to initialize the hybrid editor.
     * @param {HTMLElement} element - The DOM element associated with the editor instance.
     */
    constructor(element) {
        super(element);
        
        const content = element.innerHTML;
        
        // Editor options, e.g. form name
        this._formFieldName = element.getAttribute('name') || null;

        // Clean up the DOM
        element.removeAttribute('name');
        element.innerHTML = '';
        element.classList.add('wx-editor');

        this._createToolbar(element);
        this._createEditorArea(element, content);
        this._createStatusBar(element);
        
        // Enable Tab key navigation inside tables
        this._enableTableTabNavigation();
        
        // If a form field name is set, create a hidden input in the parent form
        if (this._formFieldName) {
            this._ensureFormInput();
        }

        const toolbar = element.querySelector('.wx-editor-toolbar');
        if (toolbar) {
            toolbar.addEventListener('mousedown', (e) => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    this._savedRange = sel.getRangeAt(0).cloneRange();
                }
            }, true); 
        }
    }
    
    /**
     * Creates the toolbar with a dropdown for text styles and separate formatting buttons.
     * @param {HTMLElement} element - The container element for the editor.
     */
    _createToolbar(element) {
        const toolbar = document.createElement("div");
        toolbar.classList.add("wx-editor-toolbar");

        this._tableToolbar = this._createTableToolbar(element);
        
        // Add dropdowns and buttons
        toolbar.appendChild(this._createFormatToolbar(element));
        toolbar.appendChild(this._tableToolbar);

        element.appendChild(toolbar);
    }

    /**
     * Creates the format toolbar with a dropdown for text styles and separate formatting buttons.
     * @param {HTMLElement} element - The container element for the editor.
     */
    _createFormatToolbar(element) {
        const toolbar = document.createElement("div");
        toolbar.classList.add("wx-editor-format-toolbar");

        // Add dropdowns and buttons
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
        toolbar.appendChild(this._createTableInsertButton());

        return toolbar;
    }
    
    /**
     * Creates a floating toolbar for table modifications.
     * This toolbar appears when a table is selected and provides actions
     * such as adding or deleting rows and columns.
     *
     * @returns {HTMLElement} The toolbar element containing table modification buttons.
     */
    _createTableToolbar(element) {
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
     * Create text format dropdown
     *
     * @returns {HTMLElement} The text format dropdown container.
     */
    _createFormatDropdown() {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";

        // Dropdown-Button erstellen
        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
        button.setAttribute("data-bs-toggle", "dropdown");

        // Text erstellen
        const buttonText = document.createElement("span");
        buttonText.textContent = "Paragraph";

        button.appendChild(buttonText);

        // Dropdown-Menü
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

        // Function to update the dropdown text only if selection is inside the editor
        const updateDropdownText = () => {
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;

            const range = selection.getRangeAt(0);

            // Ensure startContainer exists and is an Element, otherwise use parentElement
            let container = range.startContainer;
            if (container && container.nodeType !== Node.ELEMENT_NODE) {
                container = container.parentElement;
            }

            // Only continue if both container and _editorElement exist
            if (container && this._editorElement && this._editorElement.contains(container)) {
                const currentFormat = document.queryCommandValue("formatBlock") || "p";
                const foundOption = formatOptions.find(opt => opt.command === currentFormat);
                buttonText.textContent = foundOption ? foundOption.label : "Paragraph";
            }
        };

        // Listen for selection changes, but update only if inside the editor
        document.addEventListener("selectionchange", updateDropdownText);

        return container;
    }

    /**
     * Creates formatting buttons (Bold, Italic, Underline) and updates their active state
     * based on the selection in the editor.
     *
     * The buttons toggle the "active" class when the corresponding formatting 
     * is applied to the selected text.
     *
     * @returns {HTMLElement[]} An array of button elements for text formatting.
     */
    _createFormattingButtons() {
        const fragment = document.createDocumentFragment();
        const buttons = this._createButtons([
            { command: "bold", icon: "fas fa-bold", label: "Bold" },
            { command: "italic", icon: "fas fa-italic", label: "Italic" },
            { command: "underline", icon: "fas fa-underline", label: "Underline" }
        ]);

        // Listen for selection changes to update formatting button states dynamically
        document.addEventListener("selectionchange", () => this._updateButtonStates());

        buttons.forEach(button => fragment.appendChild(button));
        return fragment;
    }

    /**
     * Create additional formatting dropdown
     *
     * @returns {HTMLElement} The dditional formatting dropdown container.
     */
    _createStyleDropdown() {
        // Create Bootstrap dropdown container
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";

        // Create dropdown button with FontAwesome icon
        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
        button.setAttribute("data-bs-toggle", "dropdown");
        button.innerHTML = '<i class="fas fa-text-height"></i>';

        // Create dropdown menu
        const menu = document.createElement("ul");
        menu.className = "dropdown-menu";

        // Define formatting options
        const options = [
            { command: "strikethrough", label: "Strikethrough", icon: "fas fa-strikethrough" },
            { command: "superscript", label: "Superscript", icon: "fas fa-superscript" },
            { command: "subscript", label: "Subscript", icon: "fas fa-subscript" }
        ];

        // Populate dropdown with options
        options.forEach(option => {
            const item = document.createElement("li");
            const optionButton = document.createElement("button");
            optionButton.className = "dropdown-item";
            optionButton.innerHTML = `<i class="${option.icon}"></i> ${option.label}`;
            optionButton.dataset.command = option.command;

            optionButton.addEventListener("click", () => {
                _execCommand(option.command);
            });

            item.appendChild(optionButton);
            menu.appendChild(item);
        });

        // Append elements to container
        container.appendChild(button);
        container.appendChild(menu);

        return container;
    }

    /**
     * Creates a text color dropdown for the editor toolbar.
     */
    _createColorDropdown() {
        // Create Bootstrap dropdown container
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";

        // Create dropdown button with FontAwesome icon
        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
        button.type = "button"; 
        button.setAttribute("data-bs-toggle", "dropdown");
        
        // Create icon and set initial color
        const icon = document.createElement("i");
        icon.className = "fas fa-palette";
        
        // Function to update icon color only if the selection is inside the editor
        const updateIconColor = () => {
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;

            const range = selection.getRangeAt(0);

            // Get the element; if startContainer is not an ELEMENT_NODE, use its parentElement
            let container = range.startContainer;
            if (container && container.nodeType !== Node.ELEMENT_NODE) {
                container = container.parentElement;
            }

            // Only continue if both container and _editorElement exist and container is inside the editor
            if (container && this._editorElement && this._editorElement.contains(container)) {
                const color = document.queryCommandValue("foreColor") || "#000000";
                icon.style.color = color;
            }
        };

        // Initial update of the icon color
        updateIconColor();
        button.appendChild(icon);

        // Create dropdown menu
        const menu = document.createElement("div");
        menu.className = "dropdown-menu";
        
        const colorPickerContainer = document.createElement("ul");
        colorPickerContainer.className = "wx-editor-color-picker"; // Allows wrapping for grid-like layout

        // Populate dropdown with color palette
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
                icon.style.color = color; // Update icon color
                this._restoreSavedRange();
            });

            item.appendChild(colorButton);
            colorPickerContainer.appendChild(item);
        });

        menu.appendChild(colorPickerContainer);
        container.appendChild(button);
        container.appendChild(menu);
        
        // Listen for selection changes to update the icon color in real-time
        document.addEventListener("selectionchange", updateIconColor);
        
        return container;
    }

    /**
     * Creates list buttons for unordered and ordered lists.
     * Ensures proper handling of commands and dynamic state updates.
     * 
     * @returns {DocumentFragment} A fragment containing list buttons.
     */
    _createListButtons() {
        const fragment = document.createDocumentFragment();
        const buttons = this._createButtons([
            { command: "insertUnorderedList", icon: "fas fa-list-ul", label: "Bullet List" },
            { command: "insertOrderedList", icon: "fas fa-list-ol", label: "Numbered List" }
        ]);

        // Listen for selection changes to update button states dynamically
        document.addEventListener("selectionchange", () => this._updateButtonStates());

        // Append each button individually to the fragment
        buttons.forEach(button => fragment.appendChild(button));

        return fragment;
    }

    /**
     * Creates indentation control buttons for increasing and decreasing indent.
     * Ensures buttons update their active state when indentation changes.
     *
     * @returns {DocumentFragment} A fragment containing indent buttons.
     */
    _createIndentButtons() {
        const fragment = document.createDocumentFragment();
        const buttons = this._createButtons([
            { command: "outdent", icon: "fas fa-outdent", label: "Decrease Indent" },
            { command: "indent", icon: "fas fa-indent", label: "Increase Indent" }
        ]);

        // Listen for selection changes to update button states dynamically
        document.addEventListener("selectionchange", () => this._updateButtonStates());

        // Append each button individually
        buttons.forEach(button => fragment.appendChild(button));

        return fragment;
    }

    /**
     * Creates text alignment control buttons for left, center, right, and justify.
     * Ensures buttons update their active state dynamically.
     *
     * @returns {DocumentFragment} A fragment containing text alignment buttons.
     */
    _createAlignButtons() {
        const fragment = document.createDocumentFragment();
        const buttons = this._createButtons([
            { command: "justifyLeft", icon: "fas fa-align-left", label: "Align Left" },
            { command: "justifyCenter", icon: "fas fa-align-center", label: "Align Center" },
            { command: "justifyRight", icon: "fas fa-align-right", label: "Align Right" },
            { command: "justifyFull", icon: "fas fa-align-justify", label: "Justify Text" }
        ]);

        // Listen for selection changes to update button states dynamically
        document.addEventListener("selectionchange", () => this._updateButtonStates());

        // Append each button individually
        buttons.forEach(button => fragment.appendChild(button));

        return fragment;
    }

    /**
     * Creates the table input grid for selecting the table size.
     * Starts with a 5x5 grid and dynamically expands up to 18x18 as the user hovers toward the edge.
     * Highlights cells on hover and immediately inserts a table of the selected size when a cell is clicked.
     * Displays the currently selected row and column count below the grid.
     * When the dropdown is opened again, the grid resets to 5x5 and shows "1 × 1" as selection.
     *
     * @returns {HTMLElement} The toolbar element containing the table size grid.
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

        // Display for selected size
        const sizeDisplay = document.createElement("div");
        sizeDisplay.className = "wx-editor-table-size-display";
        sizeDisplay.textContent = "1 × 1";

        // Constants for initial and absolute max grid size
        const INITIAL_ROWS = 5;
        const INITIAL_COLS = 5;
        const ABS_MAX = 18;

        // Stateful variables
        let maxRows = INITIAL_ROWS;
        let maxCols = INITIAL_COLS;
        let matrix = [];
        let selectedRows = 1;
        let selectedCols = 1;

        // (Re-)create the grid with the current size
        const buildGrid = (rows, cols) => {
            grid.innerHTML = "";
            matrix = [];
            // Set CSS grid-template dynamically
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

                    // Highlight on hover and update display
                    cell.addEventListener("mouseenter", () => {
                        selectedRows = r + 1;
                        selectedCols = c + 1;
                        highlightCells(selectedRows, selectedCols, rows, cols);
                        updateSizeDisplay(selectedRows, selectedCols);

                        // Expand grid if edge is reached and not at ABS_MAX
                        if ((selectedRows === maxRows || selectedCols === maxCols) && (maxRows < ABS_MAX || maxCols < ABS_MAX)) {
                            if (maxRows < ABS_MAX && selectedRows === maxRows) maxRows = Math.min(maxRows + 1, ABS_MAX);
                            if (maxCols < ABS_MAX && selectedCols === maxCols) maxCols = Math.min(maxCols + 1, ABS_MAX);
                            buildGrid(maxRows, maxCols);
                            highlightCells(selectedRows, selectedCols, maxRows, maxCols);
                            updateSizeDisplay(selectedRows, selectedCols);
                        }
                    });

                    // Insert table on click
                    cell.addEventListener("click", e => {
                        this._insertTable(selectedRows, selectedCols);
                        if (menu.classList.contains("show")) menu.classList.remove("show");
                        resetGrid();
                        e.preventDefault();
                        e.stopPropagation();
                    });

                    grid.appendChild(cell);
                }
            }
            highlightCells(selectedRows, selectedCols, rows, cols);
        };

        // Highlights the selected region in the grid
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

        // Update the size display under the grid
        const updateSizeDisplay = (rows, cols) => {
            sizeDisplay.textContent = `${rows} × ${cols}`;
        };

        // Reset grid, selection and display to initial state
        const resetGrid = () => {
            maxRows = INITIAL_ROWS;
            maxCols = INITIAL_COLS;
            selectedRows = 1;
            selectedCols = 1;
            buildGrid(maxRows, maxCols);
            updateSizeDisplay(1, 1);
        };

        // Build initial grid
        resetGrid();

        menu.appendChild(grid);
        menu.appendChild(sizeDisplay);
        container.appendChild(button);
        container.appendChild(menu);

        // Reset everything when dropdown closes (click outside)
        document.addEventListener("click", function (event) {
            if (!container.contains(event.target)) {
                resetGrid();
            }
        });

        // Reset grid and highlighting when dropdown is opened
        button.addEventListener('click', function() {
            setTimeout(() => {
                resetGrid();
            }, 0);
        });

        // Table Toolbar visibility logic remains unchanged
        const detectTableSelection = () => {
            const selection = window.getSelection();
            if (!selection.rangeCount) return false;
            const range = selection.getRangeAt(0);
            let container = range.startContainer;
            if (container.nodeType === Node.TEXT_NODE) {
                container = container.parentElement;
            }
            return this._editorElement.contains(container) && container.closest("table");
        };

        document.addEventListener("selectionchange", () => {
            if (detectTableSelection()) {
                this._tableToolbar.style.display = "block";
            } else {
                this._tableToolbar.style.display = "none";
            }
        });

        return container;
    }
    
    
    /**
     * Creates a button to insert a row above the current table row.
     * @returns {HTMLButtonElement} Button element for "Add Row Above"
     */
    _createInsertRowAboveButton() {
        const action = { 
            command: "insertRowAbove", 
            label: "Add Row Above", 
            icon: "wx-icon add-row-above",
        };
        return this._createTableButton(action);
    }

    /**
     * Creates a button to insert a row below the current table row.
     * @returns {HTMLButtonElement} Button element for "Add Row Below"
     */
    _createInsertRowBelowButton() {
        const action = { 
            command: "insertRowBelow", 
            label: "Add Row Below", 
            icon: "wx-icon add-row-below" 
        };
        return this._createTableButton(action);
    }

    /**
     * Creates a button to delete the current table row.
     * @returns {HTMLButtonElement} Button element for "Delete Row"
     */
    _createDeleteRowButton() {
        const action = { 
            command: "deleteRow", 
            label: "Delete Row", 
            icon: "fas fa-minus" 
        };
        return this._createTableButton(action);
    }

    /**
     * Creates a button to insert a column left of the current table column.
     * @returns {HTMLButtonElement} Button element for "Add Column Left"
     */
    _createInsertColumnLeftButton() {
        const action = { 
            command: "insertColumnLeft", 
            label: "Add Column Left", 
            icon: "fas fa-arrow-left" 
        };
        return this._createTableButton(action);
    }

    /**
     * Creates a button to insert a column right of the current table column.
     * @returns {HTMLButtonElement} Button element for "Add Column Right"
     */
    _createInsertColumnRightButton() {
        const action = { 
            command: "insertColumnRight", 
            label: "Add Column Right", 
            icon: "fas fa-arrow-right" 
        };
        return this._createTableButton(action);
    }
    
    /**
     * Creates a button for merging horizontally adjacent table cells within the same row.
     * When clicked, this merges the contents of the selected cells into a single cell
     * and adjusts the colspan attribute accordingly.
     *
     * @returns {HTMLButtonElement} Button element for merging cells.
     */
    _createMergeCellsButton() {
        const button = document.createElement("button");
        button.className = "wx-editor-btn";
        button.title = "Merge cells";
        button.innerHTML = '<i class="fas fa-object-group"></i>';
        button.addEventListener("click", () => {
            this._mergeCells();
            this._restoreSavedRange();
        });
        return button;
    }

    /**
     * Creates a button for splitting a merged table cell into individual cells.
     * When clicked, this splits a cell with a colspan attribute into multiple single cells,
     * keeping the original content in the first and empty cells in the rest.
     *
     * @returns {HTMLButtonElement} Button element for splitting cells.
     */
    _createSplitCellButton() {
        const button = document.createElement("button");
        button.className = "wx-editor-btn";
        button.title = "Split cell";
        button.innerHTML = '<i class="fas fa-object-ungroup"></i>';
        button.addEventListener("click", () => {
            this._splitCell();
            this._restoreSavedRange();
        });
        return button;
    }
    
    /**
     * Creates a dropdown button for setting the background color of the current table cell.
     * Provides a color palette similar to the text color button.
     *
     * @returns {HTMLElement} The button group container for background color selection.
     */
    _createCellBackgroundColorButton() {
        const container = document.createElement("div");
        container.className = "wx-editor-btn-group";

        const button = document.createElement("button");
        button.className = "wx-editor-btn dropdown-toggle";
        button.type = "button"; 
        button.setAttribute("data-bs-toggle", "dropdown");

        // Icon for background color (palette)
        const icon = document.createElement("i");
        icon.className = "fas fa-fill-drip";
        button.appendChild(icon);

        // Dropdown menu for color selection
        const menu = document.createElement("div");
        menu.className = "dropdown-menu";

        const colorPickerContainer = document.createElement("ul");
        colorPickerContainer.className = "wx-editor-color-picker";

        // Create color buttons
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

            // Set background color of selected cell
            colorButton.addEventListener("click", () => {
                const selection = window.getSelection();
                if (!selection.rangeCount) return;
                let cell = selection.getRangeAt(0).startContainer;
                if (cell.nodeType !== Node.ELEMENT_NODE) cell = cell.parentElement;
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
     * Creates a button to delete the current table column.
     * @returns {HTMLButtonElement} Button element for "Delete Column"
     */
    _createDeleteColumnButton() {
        const action = { 
            command: "deleteColumn", 
            label: "Delete Column", 
            icon: "fas fa-eraser"
        };
        return this._createTableButton(action);
    }
    
    /**
     * Creates a button to delete the entire table.
     * @returns {HTMLButtonElement} Button element for "Delete Table"
     */
    _createDeleteTableButton() {
        const button = document.createElement("button");
        button.className = "wx-editor-btn";
        button.title = "Delete Table";
        button.innerHTML = '<i class="fas fa-trash"></i> Delete Table';
        button.addEventListener("click", () => {
            this._deleteWholeTable();
            this._restoreSavedRange();
        });
        return button;
    }


    /**
     * Creates a separator for toolbar sections.
     * @returns {HTMLElement} Separator element.
     */
    _createSeparator() {
        const separator = document.createElement("span");
        separator.classList.add("wx-editor-separator");
        return separator;
    }

    /**
     * Utility function to create editor buttons.
     * Generates buttons with icons, titles, associated formatting commands, 
     * and ensures active state toggling when applied.
     * 
     * @param {Object[]} buttons - An array of button definitions.
     * @param {string} buttons[].command - The command that will be executed.
     * @param {string} buttons[].icon - The FontAwesome icon class for the button.
     * @param {string} buttons[].label - Tooltip text for the button.
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

            // Execute formatting command and update button state dynamically
            button.addEventListener("click", () => {
                document.execCommand(btn.command);
                this._updateButtonStates();
                this._restoreSavedRange();
            });

            return button;
        });
    }
    
    /**
     * Creates a single toolbar button for the table toolbar.
     * @param {Object} action - Action object with command, label, and icon.
     * @returns {HTMLButtonElement} The created button element.
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
     * Updates the active state of all formatting buttons within the correct editor.
     * Ensures buttons visually reflect applied formatting based on user selection.
     */
    _updateButtonStates() {
        // Select only buttons within this editor instance
        const editor = document; //this._editorElement;
        const buttons = editor.querySelectorAll(".wx-editor-btn"); 

        buttons.forEach(button => {
            const isActive = document.queryCommandState(button.dataset.command);
            button.classList.toggle("active", isActive);
        });
    }

    /**
     * Creates the editor area for both WYSIWYG and Markdown input.
     * @param {HTMLElement} element - The container element for the editor.
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
     * Creates the status bar with mode information and toggle button.
     * @param {HTMLElement} element - The container element for the editor.
     */
    _createStatusBar(element) {
        this.statusBar = document.createElement("div");
        this.statusBar.classList.add("wx-editor-status");

        element.appendChild(this.statusBar);
    }
    
    /**
     * Inserts a table into the editor at the current cursor position with the specified number of rows and columns.
     * @param {number} rows - Number of rows in the table.
     * @param {number} cols - Number of columns in the table.
     */
    _insertTable(rows, cols) {
        // Build HTML for the table with thead and tbody
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

        // Insert table HTML at the current caret position inside the contenteditable editor
        this._insertHtmlAtCursor(tableHTML);
    }

    /**
     * Inserts the given HTML at the current cursor position in the editor.
     * Ensures the caret is placed directly after the inserted content.
     * @param {string} html - The HTML string to insert.
     */
    _insertHtmlAtCursor(html) {
        // Focus the editor to ensure correct insertion
        this._restoreSavedRange();
        
        let sel = window.getSelection();

        if (sel && sel.rangeCount) {
            let range = sel.getRangeAt(0);

            // Only proceed if selection is inside the editor
            if (!this._editorElement.contains(range.startContainer)) {
                // fallback: append at the end
                this._editorElement.innerHTML += html;
                return;
            }

            range.deleteContents();

            // Create a document fragment with the HTML and a marker after it
            let el = document.createElement("div");
            el.innerHTML = html;

            // Create a marker span to move the caret after insertion
            const markerId = "wx-editor-marker-" + Date.now() + "-" + Math.random();
            const marker = document.createElement("span");
            marker.id = markerId;
            marker.style.display = "inline-block";
            marker.style.width = "0";
            marker.style.height = "0";
            marker.style.overflow = "hidden";

            // Build the fragment
            let frag = document.createDocumentFragment(), node, lastNode;
            while ((node = el.firstChild)) {
                lastNode = frag.appendChild(node);
            }
            frag.appendChild(marker);
            range.insertNode(frag);

            // Place the caret directly after the marker
            const newRange = document.createRange();
            newRange.setStartAfter(marker);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);

            // Remove the marker span
            marker.parentNode.removeChild(marker);

            // Optionally scroll into view
            if (lastNode && typeof lastNode.scrollIntoView === "function") {
                lastNode.scrollIntoView({ block: "nearest" });
            }
        } else {
            // fallback: append at the end
            this._editorElement.innerHTML += html;
        }
    }
    
    /**
     * Restores the saved range selection in the editor, if available.
     * After restoring, the saved range is cleared to avoid duplicate restoration.
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
     * Applies a text style based on the selected option.
     * @param {string} style - The tag to apply (e.g., h1, p, blockquote).
     */
    _applyTextStyle(style) {
        document.execCommand("formatBlock", false, style);
        this._restoreSavedRange();
    }
    
    /**
     * Executes a formatting command in WYSIWYG mode.
     * @param {string} command - The formatting command to execute.
     */
    _execCommand(command) {
        document.execCommand(command, false, null);
        this._restoreSavedRange();
    }
    
    /**
     * Modifies the table structure based on the given action at the current selection.
     * Supports insertRow, insertColumn, deleteRow, and deleteColumn.
     * @param {string} action - The table modification action.
     */
    _modifyTable(action) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        let node = selection.getRangeAt(0).startContainer;
        // Always get the element, not a text node
        if (node.nodeType !== Node.ELEMENT_NODE) {
            node = node.parentElement;
        }

        const cell = node.closest("td, th");
        if (!cell) return;

        const row = cell.parentElement;
        const table = cell.closest("table");
        if (!table) return;

        switch (action) {
            case "insertRow": {
                // Insert a new row after the current row, copying the structure (number of cells)
                const rowIndex = row.rowIndex;
                const refRow = table.rows[rowIndex];
                const newRow = table.insertRow(rowIndex + 1);
                for (let i = 0; i < refRow.cells.length; i++) {
                    // Insert cell with placeholder or empty string
                    const newCell = newRow.insertCell(i);
                    newCell.innerHTML = "&nbsp;";
                }
                break;
            }
            case "insertColumn": {
                // Insert a new cell after the current cell index in every row
                const cellIndex = cell.cellIndex;
                for (let r = 0; r < table.rows.length; r++) {
                    const currentRow = table.rows[r];
                    const newCell = currentRow.insertCell(cellIndex + 1);
                    newCell.innerHTML = "&nbsp;";
                }
                break;
            }
            case "deleteRow": {
                if (table.rows.length > 1) {
                    row.remove();
                } else {
                    // Remove entire table if last row is deleted
                    table.remove();
                }
                break;
            }
            case "deleteColumn": {
                const cellIndex = cell.cellIndex;
                for (let r = 0; r < table.rows.length; r++) {
                    if (table.rows[r].cells.length > 1) {
                        table.rows[r].deleteCell(cellIndex);
                    } else {
                        // Remove entire table if last column is deleted
                        table.remove();
                        break;
                    }
                }
                break;
            }
        }
    }
    
    /**
     * Merges horizontally adjacent selected cells in the same table row.
     * Only works if the selection is within a single row.
     * The merged cell receives the combined content and a colspan attribute.
     */
    _mergeCells() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);

        // Get the start and end cell in the selection
        let startCell = range.startContainer;
        let endCell = range.endContainer;
        while (startCell && startCell.nodeType !== 1) startCell = startCell.parentElement;
        while (endCell && endCell.nodeType !== 1) endCell = endCell.parentElement;
        startCell = startCell.closest('td,th');
        endCell = endCell.closest('td,th');
        if (!startCell || !endCell) return;

        const row = startCell.parentElement;
        if (row !== endCell.parentElement) return; // Only allow merge in the same row

        const cells = Array.from(row.children);
        const startIdx = cells.indexOf(startCell);
        const endIdx = cells.indexOf(endCell);

        if (startIdx === -1 || endIdx === -1 || startIdx === endIdx) return;
        const minIdx = Math.min(startIdx, endIdx);
        const maxIdx = Math.max(startIdx, endIdx);

        // Merge contents of selected cells
        let mergedContent = '';
        for (let i = minIdx; i <= maxIdx; i++) {
            mergedContent += cells[i].innerHTML + ' ';
        }
        mergedContent = mergedContent.trim();

        // Set colspan and remove extra cells
        cells[minIdx].innerHTML = mergedContent;
        cells[minIdx].setAttribute('colspan', maxIdx - minIdx + 1);
        for (let i = maxIdx; i > minIdx; i--) {
            row.removeChild(cells[i]);
        }
    }

    /**
     * Splits a merged table cell (with colspan > 1) into individual cells.
     * The original content stays in the first cell, and new empty cells are inserted after it.
     */
    _splitCell() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        let cell = selection.getRangeAt(0).startContainer;
        if (cell.nodeType !== Node.ELEMENT_NODE) cell = cell.parentElement;
        cell = cell.closest('td,th');
        if (!cell) return;
        let colspan = parseInt(cell.getAttribute('colspan') || 1, 10);
        if (colspan <= 1) return;

        // Remove colspan and insert empty cells after the current cell
        cell.removeAttribute('colspan');
        for (let i = 1; i < colspan; i++) {
            const newCell = cell.cloneNode(false);
            newCell.innerHTML = '<br>';
            cell.parentElement.insertBefore(newCell, cell.nextSibling);
        }
    }
    
    /**
     * Deletes the entire table where the current selection/cursor is.
     */
    _deleteWholeTable() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        let node = selection.getRangeAt(0).startContainer;
        if (node.nodeType !== Node.ELEMENT_NODE) {
            node = node.parentElement;
        }
        const table = node.closest("table");
        if (table) {
            table.remove();
            // Hide table toolbar after deleting the table
            if (this._tableToolbar) {
                this._tableToolbar.style.display = "none";
            }
        }
    }

    /**
     * Enables Tab key navigation inside tables.
     * Tab moves to the next cell, Shift+Tab moves to the previous cell.
     * If Tab is pressed in the last cell of the last row, a new row is appended and the caret moves to its first cell.
     */
    _enableTableTabNavigation() {
        this._editorElement.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                const sel = window.getSelection();
                if (!sel.rangeCount) return;
                let cell = sel.anchorNode;
                // Find the parent <td> or <th>
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
                        // Shift+Tab: previous cell
                        targetCell = getPrevCell(cell);
                    } else {
                        // Tab: next cell or append new row only if in the last cell of the last row
                        targetCell = getNextCell(cell);
                        if (!targetCell) {
                            const table = cell.closest('table');
                            if (table) {
                                const rows = Array.from(table.rows);
                                const lastRow = rows[rows.length - 1];
                                const lastCell = lastRow.cells[lastRow.cells.length - 1];
                                // Only add row if current cell is the last cell of the last row
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

            // Helper function to get the next cell in the table
            function getNextCell(cell) {
                let next = cell.nextElementSibling;
                if (next) return next;
                // Move to the first cell of the next row
                let row = cell.parentElement.nextElementSibling;
                while (row && row.nodeName !== 'TR') row = row.nextElementSibling;
                if (row && row.children.length > 0) return row.children[0];
                return null;
            }
            // Helper function to get the previous cell in the table
            function getPrevCell(cell) {
                let prev = cell.previousElementSibling;
                if (prev) return prev;
                // Move to the last cell of the previous row
                let row = cell.parentElement.previousElementSibling;
                while (row && row.nodeName !== 'TR') row = row.previousElementSibling;
                if (row && row.children.length > 0) return row.children[row.children.length - 1];
                return null;
            }
            // Helper function to place the caret in a given cell
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
     * Creates or finds the hidden form input for submission.
     */
    _ensureFormInput() {
        // Find parent form
        let parent = this._editorElement;
        while (parent && parent.nodeName !== "FORM") {
            parent = parent.parentElement;
        }
        if (parent) {
            // Try find existing input
            let input = parent.querySelector(`input[type="hidden"][name="${this._formFieldName}"]`);
            if (!input) {
                input = document.createElement("input");
                input.type = "hidden";
                input.name = this._formFieldName;
                parent.appendChild(input);
            }
            this._formInput = input;

            // Synchronize editor content before submit
            parent.addEventListener("submit", () => {
                if (this._formInput) {
                    this._formInput.value = this._editorElement.innerHTML;
                }
            });
        }
    }

    /**
     * Sets the content of the editor and synchronizes the hidden input value.
     * @param {string} html - The HTML string to set as the editor content.
     */
    setValue(html) {
        if (this._editorElement) {
            this._editorElement.innerHTML = html;
        }
        if (this._formInput) {
            this._formInput.value = html;
        }
    }

    /**
     * Returns the current content of the editor.
     * @returns {string} The HTML content of the editor.
     */
    getValue() {
        return this._editorElement ? this._editorElement.innerHTML : "";
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-editor", webexpress.webui.EditorCtrl);