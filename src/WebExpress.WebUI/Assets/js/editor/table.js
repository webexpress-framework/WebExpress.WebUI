/**
 * Plugin for table operations.
 * Wraps tables in frames for consistent handling and provides grid-table-specific actions
 * and enhanced navigation (Tab key).
 */
webexpress.webui.EditorPlugins.register("table", 3000, {
    _tableToolbar: null,
    _tableToolbarShownOnce: false,
    _lastCellColor: "#FFFF00",
    _colors: [
        "#000000", "#FF0000", "#008000", "#0000FF", "#FFFF00",
        "#FFA500", "#800080", "#A52A2A", "#00FFFF", "#808080",
        "#FFC0CB", "#FFD700", "#B22222", "#ADFF2F", "#20B2AA",
        "#00CED1", "#4682B4", "#DA70D6", "#D2691E", "#C0C0C0",
        "#FFB6C1", "#FFDAB9", "#E6E6FA", "#98FB98", "#AFEEEE",
        "#D3D3D3", "#FFE4E1", "#F0E68C", "#F5DEB3", "#F4A460",
        "#2F4F4F", "#696969", "#708090", "#778899", "#556B2F",
        "#483D8B", "#8B0000", "#9400D3", "#FF4500", "#DC143C",
        "#FFFFFF"
    ],

    /**
     * Plugin initialization hook.
     * Registers table navigation and monitors selection changes to toggle context toolbar.
     * @param {object} editor - Editor instance.
     */
    init: function(editor) {
        this._enableTabNav(editor);
        document.addEventListener("selectionchange", () => {
            const inTable = this._detectTableSelection(editor);
            if (this._tableToolbar) {
                if (inTable) {
                    this._tableToolbar.style.display = "block";
                    this._tableToolbarShownOnce = true;
                } else {
                    if (!this._tableToolbarShownOnce) {
                        this._tableToolbar.style.display = "none";
                    }
                }
                if (!editor.getEditorElement().querySelector(".wx-table")) {
                    this._tableToolbar.style.display = "none";
                    this._tableToolbarShownOnce = false;
                }
            }
        });
    },

    /**
     * Enables Tab / Shift+Tab navigation inside grid tables.
     * Tab moves forward and inserts a new row at the end of the table when necessary.
     * Shift+Tab moves backward without inserting rows.
     * @param {object} editor - Editor instance.
     */
    _enableTabNav: function(editor) {
        editor.getEditorElement().addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                const sel = window.getSelection();
                if (!sel.rangeCount) {
                    return;
                }
                
                let cell = sel.anchorNode;
                if (cell.nodeType !== Node.ELEMENT_NODE) {
                    cell = cell.parentElement;
                }
                cell = cell.closest(".wx-grid-cell, .wx-grid-header-cell");
                
                if (cell) {
                    const row = cell.closest(".wx-grid-row");
                    const table = row.closest(".wx-table");
                    
                    // prevent default tab behavior (blur or inserting tab char)
                    e.preventDefault(); 

                    if (e.shiftKey) {
                        // move to previous sibling cell or last cell of previous row
                        let prev = cell.previousElementSibling;
                        if (prev) {
                            this._focusCell(prev);
                        } else {
                            // start of row, move to last cell of previous row
                            let prevRow = row.previousElementSibling;
                            
                            // skip to header group if currently in body group and no prev row
                            if (!prevRow) {
                                if (row.parentElement.classList.contains("wx-table-body-group")) {
                                    const thead = table.querySelector(".wx-table-header-group");
                                    if (thead && thead.children.length > 0) {
                                        prevRow = thead.children[thead.children.length - 1];
                                    }
                                }
                            }

                            if (prevRow) {
                                const lastCell = prevRow.children[prevRow.children.length - 1];
                                this._focusCell(lastCell);
                            }
                        }
                    } else {
                        // move to next sibling cell or first cell of next row
                        let next = cell.nextElementSibling;
                        if (next) {
                            this._focusCell(next);
                        } else {
                            // end of row, move to first cell of next row
                            let nextRow = row.nextElementSibling;
                            
                            // if currently in header group, jump to body group first row if available
                            if (!nextRow) {
                                if (row.parentElement.classList.contains("wx-table-header-group")) {
                                    const tbody = table.querySelector(".wx-table-body-group");
                                    if (tbody && tbody.children.length > 0) {
                                        nextRow = tbody.children[0];
                                    }
                                }
                            }

                            if (nextRow) {
                                const firstCell = nextRow.children[0];
                                this._focusCell(firstCell);
                            } else {
                                // end of table: insert new row at body end when appropriate
                                if (row.parentElement.classList.contains("wx-table-body-group") || !table.querySelector(".wx-table-header-group")) {
                                    const cols = row.children.length;
                                    const newRow = document.createElement("div");
                                    newRow.className = "wx-grid-row";
                                    newRow.setAttribute("role", "row");
                                    
                                    for (let i = 0; i < cols; i++) {
                                        const newCell = document.createElement("div");
                                        newCell.className = "wx-grid-cell";
                                        newCell.setAttribute("role", "gridcell");
                                        newCell.innerHTML = "<br>";
                                        newRow.appendChild(newCell);
                                    }
                                    
                                    row.parentElement.appendChild(newRow);
                                    this._focusCell(newRow.children[0]);
                                }
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Sets caret inside a specific cell at the start.
     * @param {HTMLElement} cell - Target cell element.
     * @private
     */
    _focusCell: function(cell) {
        if (!cell) {
            return;
        }
        const range = document.createRange();
        range.selectNodeContents(cell);
        // collapse to start
        range.collapse(true); 
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    },

    /**
     * Returns context menu items for table cell actions.
     * Includes color submenu with predefined palette and custom picker.
     * @param {object} editor - Editor instance.
     * @param {HTMLElement} target - The element that triggered the context menu.
     * @returns {Array<object>} Context menu descriptor array.
     */
    getContextMenuItems: function(editor, target) {
        const cell = target.closest(".wx-grid-cell, .wx-grid-header-cell");
        if (!cell || !editor.getEditorElement().contains(cell)) {
            return [];
        }

        const range = document.createRange();
        range.selectNodeContents(cell);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        const colorItems = this._colors.map(c => ({
            type: "color",
            value: c,
            action: () => {
                this._lastCellColor = c;
                this._setCellBackground(editor, c);
            }
        }));

        const customLi = document.createElement("li");
        customLi.style.display = "inline-block";
        const customLabel = document.createElement("label");
        customLabel.className = "dropdown-item p-0 d-flex align-items-center justify-content-center";
        customLabel.style.width = "24px";
        customLabel.style.height = "24px";
        customLabel.style.cursor = "pointer";
        customLabel.style.border = "1px solid #ccc";
        customLabel.style.borderRadius = "4px";
        customLabel.innerHTML = '<i class="fas fa-plus" style="font-size: 10px;"></i>';
        
        const customInput = document.createElement("input");
        customInput.type = "color";
        customInput.style.position = "absolute";
        customInput.style.opacity = "0";
        customInput.style.width = "0";
        customInput.style.height = "0";
        customInput.addEventListener("input", (e) => {
             this._lastCellColor = e.target.value;
             this._setCellBackground(editor, e.target.value);
        });
        customLabel.appendChild(customInput);
        customLi.appendChild(customLabel);

        colorItems.push({
            type: "custom-element",
            element: customLi
        });

        return [
            { label: "Insert Row Above", action: () => this._modifyTable(editor, "insertRowAbove"), icon: "wx-icon add-row-above" },
            { label: "Insert Row Below", action: () => this._modifyTable(editor, "insertRowBelow"), icon: "wx-icon add-row-below" },
            { label: "Insert Column Left", action: () => this._modifyTable(editor, "insertColumnLeft"), icon: "wx-icon add-col-above" },
            { label: "Insert Column Right", action: () => this._modifyTable(editor, "insertColumnRight"), icon: "wx-icon add-col-below" },
            { separator: true },
            { label: "Merge Cells", action: () => this._modifyTable(editor, "mergeCells"), icon: "wx-icon merge-cells" },
            { label: "Split Cell", action: () => this._modifyTable(editor, "splitCell"), icon: "wx-icon split-cell" },
            { separator: true },
            { 
                label: "Cell Background", 
                icon: "wx-icon cell-background",
                submenu: colorItems,
                submenuClass: "wx-editor-color-picker"
            },
            { separator: true },
            { label: "Delete Row", action: () => this._modifyTable(editor, "deleteRow"), icon: "wx-icon delete-row" },
            { label: "Delete Column", action: () => this._modifyTable(editor, "deleteColumn"), icon: "wx-icon delete-col" },
            { label: "Delete Table", action: () => this._modifyTable(editor, "deleteTable"), icon: "wx-icon delete-table" }
        ];
    },

    /**
     * Creates toolbar fragment containing table insertion controls.
     * @param {object} editor - Editor instance.
     * @returns {DocumentFragment} Toolbar fragment.
     */
    createToolbar: function(editor) {
        const frag = document.createDocumentFragment();
        const sep = document.createElement("span");
        sep.className = "wx-editor-separator";
        frag.appendChild(sep);
        frag.appendChild(this._createInsertButton(editor));
        return frag;
    },

    /**
     * Creates the insert table dropdown with an interactive grid to pick dimensions.
     * @param {object} editor - Editor instance.
     * @returns {HTMLElement} Insert button group.
     */
    _createInsertButton: function(editor) {
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
                        // update selection matrix and display
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
                    
                    cell.addEventListener("click", (e) => {
                        // insert table with chosen dimensions
                        this._insertTable(editor, selectedRows, selectedCols);
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
        button.addEventListener("click", () => { 
            setTimeout(() => { 
                resetGrid(); 
            }, 0); 
        });
        return container;
    },

    /**
     * Inserts an HTML grid table wrapped in a draggable frame.
     * The table body is editable to allow inline editing and navigation.
     * @param {object} editor - Editor instance.
     * @param {number} rows - Number of rows.
     * @param {number} cols - Number of columns.
     */
    _insertTable: function(editor, rows, cols) {
        let tableHtml = '<div class="wx-webui-table" data-striped="table-striped-columns table-striped" data-border="table-bordered" data-selectable="true">';
        tableHtml += '<div class="wx-table-columns">';
        for (let c = 0; c < cols; c++) {
            tableHtml += `<div data-label="Header ${c + 1}" data-min-width="10px" data-resizable="true"></div>`;
        }
        tableHtml += '</div>';
        for (let r = 0; r < rows; r++) {
            tableHtml += '<div class="wx-table-row">';
            for (let c = 0; c < cols; c++) {
                tableHtml += '<div>text<br></div>';
            }
            tableHtml += '</div>';
        }
        tableHtml += '</div>';

        const uniqueId = "table-" + Date.now();
        const dragHandle = '<span class="wx-addon-drag-handle"><i class="fas fa-grip-vertical"></i></span>';

        const frameHtml = `
            <div class="wx-addon-frame card my-3 shadow-sm" 
                 contenteditable="false" 
                 draggable="true"
                 data-addon-id="${uniqueId}"
                 data-type="table">
                
                <div class="card-header py-1 px-2 d-flex justify-content-between align-items-center">
                    <div class="small text-muted fw-bold d-flex align-items-center">
                        ${dragHandle}
                        <i class="fas fa-table me-2"></i> 
                        <span>Table</span>
                    </div>
                </div>
                
                <div class="card-body p-2 wx-addon-body-container" 
                     contenteditable="true">
                    ${tableHtml}
                </div>
            </div><p><br></p>`;

        editor.insertHtmlAtCursor(frameHtml);
    },

    /**
     * Creates the cell background control with preset colors and a custom picker.
     * @param {object} editor - Editor instance.
     * @param {string} iconClass - Icon class for the action button.
     * @returns {HTMLElement} Button group element.
     */
    _createCellBackgroundButton: function(editor, iconClass) {
        const group = document.createElement("div");
        group.className = "wx-editor-btn-group";
        group.style.gap = "0";

        const actionBtn = document.createElement("button");
        actionBtn.className = "wx-editor-btn";
        actionBtn.title = "Cell Background";
        actionBtn.type = "button";
        const icon = document.createElement("i");
        icon.className = iconClass;
        actionBtn.style.borderBottom = `3px solid ${this._lastCellColor}`;
        actionBtn.appendChild(icon);

        actionBtn.addEventListener("click", () => {
            this._setCellBackground(editor, this._lastCellColor);
        });

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "wx-editor-btn dropdown-toggle dropdown-toggle-split";
        toggleBtn.type = "button";
        toggleBtn.setAttribute("data-bs-toggle", "dropdown");
        
        const menu = document.createElement("div");
        menu.className = "dropdown-menu";
        const list = document.createElement("ul");
        list.className = "wx-editor-color-picker";
        
        this._colors.forEach((c) => {
            const li = document.createElement("li");
            const colorBtn = document.createElement("button");
            colorBtn.type = "button";
            colorBtn.style.backgroundColor = c;
            colorBtn.addEventListener("click", () => {
                this._lastCellColor = c;
                actionBtn.style.borderBottomColor = c;
                this._setCellBackground(editor, c);
            });
            li.appendChild(colorBtn);
            list.appendChild(li);
        });

        const customLi = document.createElement("li");
        const customLabel = document.createElement("label");
        customLabel.className = "dropdown-item p-0 d-flex align-items-center justify-content-center";
        customLabel.style.width = "24px";
        customLabel.style.height = "24px";
        customLabel.style.cursor = "pointer";
        customLabel.style.border = "1px solid #ccc";
        customLabel.style.borderRadius = "4px";
        customLabel.innerHTML = '<i class="fas fa-plus" style="font-size: 10px;"></i>';
        
        const customInput = document.createElement("input");
        customInput.type = "color";
        customInput.style.position = "absolute";
        customInput.style.opacity = "0";
        customInput.style.width = "0";
        customInput.style.height = "0";

        customInput.addEventListener("input", (e) => {
             const c = e.target.value;
             this._lastCellColor = c;
             actionBtn.style.borderBottomColor = c;
             this._setCellBackground(editor, c);
        });

        customLabel.appendChild(customInput);
        customLi.appendChild(customLabel);
        list.appendChild(customLi);
        
        menu.appendChild(list);
        group.appendChild(actionBtn);
        group.appendChild(toggleBtn);
        group.appendChild(menu);
        return group;
    },

    /**
     * Detects whether the current selection is inside a table.
     * @param {object} editor - Editor instance.
     * @returns {boolean} True if selection is inside a table.
     */
    _detectTableSelection: function(editor) {
        const sel = window.getSelection();
        if (!sel.rangeCount) {
            return false;
        }
        let node = sel.getRangeAt(0).startContainer;
        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }
        return editor.getEditorElement().contains(node) && node.closest(".wx-table") !== null;
    },
    
    /**
     * Sets the background color of the current cell selection.
     * Uses editor.restoreSavedRange to ensure the selection is available.
     * @param {object} editor - Editor instance.
     * @param {string} color - CSS color string.
     */
    _setCellBackground: function(editor, color) {
        editor.restoreSavedRange();
        const sel = window.getSelection();
        if (!sel.rangeCount) {
            return;
        }
        let cell = sel.getRangeAt(0).startContainer;
        if (cell.nodeType !== Node.ELEMENT_NODE) {
            cell = cell.parentElement;
        }
        cell = cell.closest(".wx-grid-cell, .wx-grid-header-cell");
        if (cell) {
            cell.style.backgroundColor = color;
        }
    },

    /**
     * Performs table modification actions such as insert/delete rows/columns, merge/split cells.
     * Actions operate on the cell containing the current selection.
     * @param {object} editor - Editor instance.
     * @param {string} action - Action identifier.
     */
    _modifyTable: function(editor, action) {
        const sel = window.getSelection();
        if (!sel.rangeCount) {
            return;
        }
        let cell = sel.getRangeAt(0).startContainer;
        if (cell.nodeType !== Node.ELEMENT_NODE) {
            cell = cell.parentElement;
        }
        cell = cell.closest(".wx-grid-cell, .wx-grid-header-cell");
        if (!cell) {
            return;
        }
        
        const row = cell.closest(".wx-grid-row");
        const table = cell.closest(".wx-table");
        const frame = table.closest(".wx-addon-frame");

        // helper to get the visual index of the cell
        const getCellIndex = (c) => Array.prototype.indexOf.call(c.parentElement.children, c);
        const cellIndex = getCellIndex(cell);

        if (action === "deleteRow") {
            row.remove();
            const bodyGroup = table.querySelector(".wx-table-body-group");
            if (!bodyGroup || bodyGroup.children.length === 0) {
                if (frame) {
                    frame.remove();
                } else {
                    table.remove();
                }
            }
        } else if (action === "deleteColumn") {
            const rows = table.querySelectorAll(".wx-grid-row");
            for (let i = 0; i < rows.length; i++) {
                const targetCell = rows[i].children[cellIndex];
                if (targetCell) {
                    targetCell.remove();
                }
            }
            
            // update grid template columns
            const firstRow = table.querySelector(".wx-grid-row");
            if (firstRow) {
                const cols = firstRow.children.length;
                if (cols === 0) {
                    if (frame) {
                        frame.remove();
                    } else {
                        table.remove();
                    }
                } else {
                    table.style.setProperty("--wx-grid-template", `repeat(${cols}, 1fr)`);
                }
            }
        } else if (action === "insertRowAbove" || action === "insertRowBelow") {
            const cols = row.children.length;
            const newRow = document.createElement("div");
            newRow.className = "wx-grid-row";
            newRow.setAttribute("role", "row");
            
            for (let i = 0; i < cols; i++) {
                const newCell = document.createElement("div");
                newCell.className = row.classList.contains("wx-table-header") ? "wx-grid-header-cell wx-col-header" : "wx-grid-cell";
                newCell.setAttribute("role", row.classList.contains("wx-table-header") ? "columnheader" : "gridcell");
                if (row.classList.contains("wx-table-header")) {
                    newCell.innerHTML = "<div class='wx-col-inner'>New Header</div>";
                } else {
                    newCell.innerHTML = "<br>";
                }
                newRow.appendChild(newCell);
            }
            
            if (action === "insertRowAbove") {
                row.parentElement.insertBefore(newRow, row);
            } else {
                row.parentElement.insertBefore(newRow, row.nextElementSibling);
            }
        } else if (action === "insertColumnLeft" || action === "insertColumnRight") {
            const rows = table.querySelectorAll(".wx-grid-row");
            for (let i = 0; i < rows.length; i++) {
                const currentRow = rows[i];
                const isHeader = currentRow.classList.contains("wx-table-header");
                const newCell = document.createElement("div");
                
                newCell.className = isHeader ? "wx-grid-header-cell wx-col-header" : "wx-grid-cell";
                newCell.setAttribute("role", isHeader ? "columnheader" : "gridcell");
                
                if (isHeader) {
                    newCell.innerHTML = "<div class='wx-col-inner'>New</div>";
                } else {
                    newCell.innerHTML = "<br>";
                }
                
                const targetSibling = currentRow.children[cellIndex];
                if (action === "insertColumnLeft") {
                    currentRow.insertBefore(newCell, targetSibling);
                } else {
                    currentRow.insertBefore(newCell, targetSibling ? targetSibling.nextElementSibling : null);
                }
            }
            
            // update grid template columns
            const firstRow = table.querySelector(".wx-grid-row");
            if (firstRow) {
                const cols = firstRow.children.length;
                table.style.setProperty("--wx-grid-template", `repeat(${cols}, 1fr)`);
            }
        } else if (action === "deleteTable") {
            if (frame) {
                frame.remove();
            } else {
                table.remove();
            }
        } else if (action === "mergeCells") {
            const next = cell.nextElementSibling;
            if (next) {
                const content = next.innerHTML;
                const currentSpan = parseInt(cell.style.gridColumnEnd?.replace("span ", "") || 1);
                const nextSpan = parseInt(next.style.gridColumnEnd?.replace("span ", "") || 1);
                const colspan = currentSpan + nextSpan;
                
                cell.innerHTML += " " + content;
                cell.style.gridColumnEnd = `span ${colspan}`;
                next.remove();
            }
        } else if (action === "splitCell") {
            const colspan = parseInt(cell.style.gridColumnEnd?.replace("span ", "") || 1);
            if (colspan > 1) {
                cell.style.gridColumnEnd = "span 1";
                for (let i = 1; i < colspan; i++) {
                    const newCell = document.createElement("div");
                    newCell.className = cell.className;
                    newCell.setAttribute("role", cell.getAttribute("role"));
                    newCell.innerHTML = "<br>";
                    row.insertBefore(newCell, cell.nextElementSibling);
                }
            }
        }
    }
});