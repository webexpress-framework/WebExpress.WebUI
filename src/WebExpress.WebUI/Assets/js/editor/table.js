/**
 * Plugin for table operations.
 * Wraps tables in frames for consistent handling and provides native HTML table actions,
 * enhanced navigation (Tab key), intermediate headers, and left-side vertical headers.
 * Only table cells are editable to prevent structural damage.
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
                if (!editor.getEditorElement().querySelector("table")) {
                    this._tableToolbar.style.display = "none";
                    this._tableToolbarShownOnce = false;
                }
            }
        });
    },

    /**
     * Triggered by the editor whenever the entire content changes (load/paste).
     * Used to upgrade raw tables into editable frames.
     * @param {object} editor - Editor instance.
     */
    onContentChange: function(editor) {
        this._upgradeRawTables(editor);
    },

    /**
     * Upgrades raw html tables to framed editor tables and binds resize events.
     * @param {object} editor - Editor instance.
     */
    _upgradeRawTables: function(editor) {
        const root = editor.getEditorElement();
        if (!root) {
            return;
        }

        const tables = Array.from(root.querySelectorAll("table"));
        tables.forEach(table => {
            // ensure the table itself is not editable
            table.setAttribute("contenteditable", "false");
            
            // ensure all cells are editable
            const cells = table.querySelectorAll("td, th");
            cells.forEach(c => {
                c.setAttribute("contenteditable", "true");
            });

            // check if the table already has a wrapper frame
            let frame = table.closest(".wx-addon-frame");
            
            if (!frame) {
                // it's a raw table, apply classes and wrap it
                table.classList.add("table", "table-striped", "table-striped-columns", "table-bordered", "wx-native-table");
                
                const uniqueId = "table-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
                const dragHandle = '<span class="wx-addon-drag-handle" contenteditable="false"><i class="fas fa-grip-vertical"></i></span>';

                frame = document.createElement("div");
                frame.className = "wx-addon-frame card my-3 shadow-sm";
                frame.setAttribute("contenteditable", "false");
                frame.setAttribute("draggable", "true");
                frame.setAttribute("data-addon-id", uniqueId);
                frame.setAttribute("data-type", "table");

                frame.innerHTML = `
                    <div class="card-header py-1 px-2 d-flex justify-content-between align-items-center" contenteditable="false">
                        <div class="small text-muted fw-bold d-flex align-items-center">
                            ${dragHandle}
                            <i class="fas fa-table me-2"></i> 
                            <span>Table</span>
                        </div>
                    </div>
                    <div class="card-body p-2 wx-addon-body-container" contenteditable="false">
                    </div>
                `;

                // insert frame before table, then move table into frame's body
                if (table.parentNode) {
                    table.parentNode.insertBefore(frame, table);
                    frame.querySelector(".wx-addon-body-container").appendChild(table);
                }
            }

            // re-attach resizer events (important for loaded content since listeners are lost in html strings)
            this._attachColumnResizersToTable(table);
        });
    },

    /**
     * Enables Tab / Shift+Tab navigation inside tables.
     * Tab moves forward and inserts a new row at the end of the table when necessary.
     * Shift+Tab moves backward without inserting rows.
     * @param {object} editor - Editor instance.
     */
    _enableTabNav: function(editor) {
        editor.getEditorElement().addEventListener("keydown", (e) => {
            if (e.key !== "Tab") {
                return;
            }

            const sel = window.getSelection();
            if (!sel.rangeCount) {
                return;
            }

            let node = sel.anchorNode;
            if (node && node.nodeType !== Node.ELEMENT_NODE) {
                node = node.parentElement;
            }

            const cell = node ? node.closest("td, th") : null;
            if (!cell) {
                return;
            }

            const row = cell.parentElement;
            const table = row ? row.closest("table") : null;
            if (!table) {
                return;
            }

            e.preventDefault();

            if (e.shiftKey) {
                let prev = cell.previousElementSibling;
                if (prev) {
                    this._focusCell(prev);
                    return;
                }

                let prevRow = row.previousElementSibling;
                if (!prevRow && row.parentElement && row.parentElement.nodeName === "TBODY") {
                    const thead = table.tHead;
                    if (thead && thead.rows.length > 0) {
                        prevRow = thead.rows[thead.rows.length - 1];
                    }
                }

                if (prevRow) {
                    const lastCell = prevRow.cells[prevRow.cells.length - 1];
                    this._focusCell(lastCell);
                }
                return;
            }

            let next = cell.nextElementSibling;
            if (next) {
                this._focusCell(next);
                return;
            }

            let nextRow = row.nextElementSibling;
            if (!nextRow && row.parentElement && row.parentElement.nodeName === "THEAD") {
                if (table.tBodies.length > 0 && table.tBodies[0].rows.length > 0) {
                    nextRow = table.tBodies[0].rows[0];
                }
            }

            if (nextRow) {
                const firstCell = nextRow.cells[0];
                this._focusCell(firstCell);
                return;
            }

            if (row.parentElement && (row.parentElement.nodeName === "TBODY" || !table.tHead)) {
                // determine if first column is currently a vertical header
                const firstCellIsHeader = row.cells.length > 0 && row.cells[0].tagName === "TH";
                const cols = row.cells.length;
                const targetTbody = table.tBodies.length > 0 ? table.tBodies[0] : table.createTBody();
                const newRow = targetTbody.insertRow();
                
                for (let i = 0; i < cols; i++) {
                    const newCell = document.createElement(i === 0 && firstCellIsHeader ? "th" : "td");
                    if (i === 0 && firstCellIsHeader) {
                        newCell.scope = "row";
                    }
                    newCell.contentEditable = "true";
                    newCell.innerHTML = "<br>";
                    newRow.appendChild(newCell);
                }
                this._focusCell(newRow.cells[0]);
            }
        });
    },

    /**
     * Sets caret inside a specific cell at the start.
     * @param {HTMLElement} cell - Target cell element (td or th).
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
     * Calculates the maximum amount of columns a table has.
     * @param {HTMLTableElement} table - The table element.
     * @returns {number} Maximum column count.
     */
    _getMaxColumns: function(table) {
        let max = 0;
        for (let i = 0; i < table.rows.length; i++) {
            let cols = 0;
            const row = table.rows[i];
            for (let j = 0; j < row.cells.length; j++) {
                cols += parseInt(row.cells[j].getAttribute("colspan") || 1, 10);
            }
            if (cols > max) {
                max = cols;
            }
        }
        return max;
    },

    /**
     * Adds column resizer handles to a table header row and wires drag behavior.
     * Uses <colgroup> so resizing affects header and body consistently.
     * @param {HTMLTableElement} table - Target table.
     */
    _attachColumnResizersToTable: function(table) {
        if (!table) {
            return;
        }

        const thead = table.tHead;
        if (!thead || !thead.rows.length) {
            return;
        }

        const headerRow = thead.rows[0];
        const cols = headerRow.cells.length;
        if (cols < 2) {
            return;
        }

        let colgroup = table.querySelector(":scope > colgroup");
        if (!colgroup) {
            colgroup = document.createElement("colgroup");
            for (let i = 0; i < cols; i++) {
                const col = document.createElement("col");
                col.style.width = "";
                colgroup.appendChild(col);
            }
            table.insertBefore(colgroup, table.firstChild);
        } else {
            while (colgroup.children.length < cols) {
                colgroup.appendChild(document.createElement("col"));
            }
        }

        table.style.tableLayout = "fixed";
        table.style.width = "100%";

        // remove existing resizers to prevent duplicates
        const oldResizers = headerRow.querySelectorAll(".wx-col-resizer");
        for (let i = 0; i < oldResizers.length; i++) {
            oldResizers[i].remove();
        }

        for (let i = 0; i < cols; i++) {
            const th = headerRow.cells[i];
            if (!th) {
                continue;
            }

            th.style.position = th.style.position || "relative";

            if (i === cols - 1) {
                continue;
            }

            const handle = document.createElement("span");
            handle.className = "wx-col-resizer";
            // make resizer non-editable
            handle.contentEditable = "false";
            th.appendChild(handle);

            handle.addEventListener("mousedown", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._beginNativeColumnResize(e, table, colgroup, i, th);
            });

            handle.addEventListener("touchstart", (e) => {
                e.stopPropagation();
                this._beginNativeColumnResize(e, table, colgroup, i, th);
            }, { passive: true });

            handle.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
            });
        }
    },

    /**
     * Starts a resize drag for a table column.
     * @param {Event} evt - Mouse or touch event.
     * @param {HTMLTableElement} table - Target table.
     * @param {HTMLTableColElement|HTMLElement} colgroup - Table colgroup element.
     * @param {number} index - Column index.
     * @param {HTMLElement} th - Header cell.
     */
    _beginNativeColumnResize: function(evt, table, colgroup, index, th) {
        const pointX = (ev) => {
            if (ev.touches && ev.touches.length) {
                return ev.touches[0].clientX;
            }
            return ev.clientX;
        };

        const colEl = colgroup.children[index];
        if (!colEl) {
            return;
        }

        // capture initial widths
        const startX = pointX(evt);
        const thRect = th.getBoundingClientRect();
        const startWidth = Math.max(Math.round(thRect.width), 30);
        const isRtl = getComputedStyle(table).direction === "rtl";
        const minWidth = 30;

        const move = (e) => {
            e.preventDefault();
            // compute delta
            const dx = pointX(e) - startX;
            const signed = isRtl ? -dx : dx;
            const newWidth = Math.max(startWidth + signed, minWidth);
            colEl.style.width = `${Math.round(newWidth)}px`;
        };

        const up = () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            document.removeEventListener("touchmove", move);
            document.removeEventListener("touchend", up);
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
        document.addEventListener("touchmove", move, { passive: false });
        document.addEventListener("touchend", up);
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
     * Returns context menu items for table cell actions.
     * Includes structural modifications and formatting.
     * @param {object} editor - Editor instance.
     * @param {HTMLElement} target - The element that triggered the context menu.
     * @returns {Array<object>} Context menu descriptor array.
     */
    getContextMenuItems: function(editor, target) {
        const cell = target.closest("td, th");
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
            { label: "Add Intermediate Header", action: () => this._modifyTable(editor, "insertIntermediateHeader"), icon: "wx-icon add-row-below" },
            { label: "Toggle Left Header", action: () => this._modifyTable(editor, "toggleLeftHeader"), icon: "wx-icon cell-background" },
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
     * Inserts an HTML table wrapped in a draggable frame.
     * Only table cells are editable. Structural components are locked.
     * @param {object} editor - Editor instance.
     * @param {number} rows - Number of rows.
     * @param {number} cols - Number of columns.
     */
    _insertTable: function(editor, rows, cols) {
        // the table itself is contenteditable="false"
        let tableHtml = '<table class="table table-striped table-bordered wx-native-table" contenteditable="false">';
        tableHtml += "<thead><tr>";
        for (let c = 0; c < cols; c++) {
            // only the th inner is editable
            tableHtml += `<th scope="col" contenteditable="true">Header ${c + 1}</th>`;
        }
        tableHtml += "</tr></thead>";
        tableHtml += "<tbody>";
        for (let r = 0; r < rows; r++) {
            tableHtml += "<tr>";
            for (let c = 0; c < cols; c++) {
                // only the td inner is editable
                tableHtml += '<td contenteditable="true"><br></td>';
            }
            tableHtml += "</tr>";
        }
        tableHtml += "</tbody></table>";

        const uniqueId = "table-" + Date.now();
        const dragHandle = '<span class="wx-addon-drag-handle" contenteditable="false"><i class="fas fa-grip-vertical"></i></span>';

        const frameHtml = `
            <div class="wx-addon-frame card my-3 shadow-sm" 
                 contenteditable="false" 
                 draggable="true"
                 data-addon-id="${uniqueId}"
                 data-type="table">
                
                <div class="card-header py-1 px-2 d-flex justify-content-between align-items-center" contenteditable="false">
                    <div class="small text-muted fw-bold d-flex align-items-center">
                        ${dragHandle}
                        <i class="fas fa-table me-2"></i> 
                        <span>Table</span>
                    </div>
                </div>
                
                <div class="card-body p-2 wx-addon-body-container" 
                     contenteditable="false">
                    ${tableHtml}
                </div>
            </div>`;

        editor.insertHtmlAtCursor(frameHtml);
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
        return editor.getEditorElement().contains(node) && node.closest("table") !== null;
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
        cell = cell.closest("td, th");
        if (cell) {
            cell.style.backgroundColor = color;
        }
    },

    /**
     * Performs structural table modification actions.
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
        cell = cell.closest("td, th");
        if (!cell) {
            return;
        }

        const row = cell.parentElement;
        const table = row.closest("table");
        const frame = table.closest(".wx-addon-frame");
        const isHeaderCell = cell.tagName === "TH";
        const tbody = row.parentElement;

        if (action === "deleteRow") {
            row.remove();
            if (table.rows.length === 0) {
                if (frame) {
                    frame.remove();
                } else {
                    table.remove();
                }
            }
        } else if (action === "deleteColumn") {
            const colIndex = cell.cellIndex;
            
            for (let r = 0; r < table.rows.length; r++) {
                const tr = table.rows[r];
                // ignore rows that are just spanning the whole table (intermediate headers)
                if (tr.cells.length > 1 && tr.cells.length > colIndex) {
                    tr.deleteCell(colIndex);
                }
            }
            
            // update colgroup
            const colgroup = table.querySelector("colgroup");
            if (colgroup && colgroup.children.length > colIndex) {
                colgroup.removeChild(colgroup.children[colIndex]);
            }

            if (table.rows[0] && table.rows[0].cells.length === 0) {
                if (frame) {
                    frame.remove();
                } else {
                    table.remove();
                }
            }
            this._attachColumnResizersToTable(table);

        } else if (action === "insertRowAbove" || action === "insertRowBelow") {
            const newRow = table.insertRow(action === "insertRowAbove" ? row.rowIndex : row.rowIndex + 1);
            const cols = row.cells.length;
            
            // determine if first column is currently a vertical header
            const firstCellIsHeader = row.cells.length > 0 && row.cells[0].tagName === "TH";

            for (let i = 0; i < cols; i++) {
                const newCell = document.createElement(isHeaderCell && tbody.tagName === "THEAD" || (i === 0 && firstCellIsHeader) ? "th" : "td");
                if (i === 0 && firstCellIsHeader && tbody.tagName !== "THEAD") {
                    newCell.scope = "row";
                }
                newCell.contentEditable = "true";
                newCell.innerHTML = "<br>";
                newRow.appendChild(newCell);
            }
        } else if (action === "insertColumnLeft" || action === "insertColumnRight") {
            const colIndex = action === "insertColumnLeft" ? cell.cellIndex : cell.cellIndex + 1;
            
            // update colgroup
            const colgroup = table.querySelector("colgroup");
            if (colgroup) {
                const newCol = document.createElement("col");
                newCol.style.width = "";
                if (colgroup.children.length > colIndex) {
                    colgroup.insertBefore(newCol, colgroup.children[colIndex]);
                } else {
                    colgroup.appendChild(newCol);
                }
            }

            for (let r = 0; r < table.rows.length; r++) {
                const tr = table.rows[r];
                // ignore full row spans
                if (tr.cells.length === 1 && parseInt(tr.cells[0].getAttribute("colspan") || 1, 10) > 1) {
                    tr.cells[0].colSpan = parseInt(tr.cells[0].getAttribute("colspan"), 10) + 1;
                    continue;
                }
                const newCell = document.createElement(tr.parentElement.tagName === "THEAD" ? "th" : "td");
                newCell.contentEditable = "true";
                newCell.innerHTML = "<br>";
                if (tr.cells.length > colIndex) {
                    tr.insertBefore(newCell, tr.cells[colIndex]);
                } else {
                    tr.appendChild(newCell);
                }
            }
            this._attachColumnResizersToTable(table);

        } else if (action === "insertIntermediateHeader") {
            const maxCols = this._getMaxColumns(table);
            const newRow = table.insertRow(row.rowIndex);
            const newTh = document.createElement("th");
            newTh.colSpan = maxCols;
            newTh.contentEditable = "true";
            newTh.className = "table-light text-center"; // simple visual class
            newTh.innerHTML = "Intermediate Header";
            newRow.appendChild(newTh);

        } else if (action === "toggleLeftHeader") {
            // checks if body has left header
            const bodyHasHeaders = table.tBodies.length > 0 && table.tBodies[0].rows.length > 0 && table.tBodies[0].rows[0].cells[0].tagName === "TH";
            
            for (let r = 0; r < table.rows.length; r++) {
                const tr = table.rows[r];
                if (tr.parentElement.tagName === "THEAD") {
                    continue; // header top row is always TH
                }
                // skip intermediate headers
                if (tr.cells.length === 1 && parseInt(tr.cells[0].getAttribute("colspan") || 1, 10) > 1) {
                    continue;
                }

                if (tr.cells.length > 0) {
                    const firstCell = tr.cells[0];
                    const targetTag = bodyHasHeaders ? "td" : "th";
                    const newCell = document.createElement(targetTag);
                    if (targetTag === "th") {
                        newCell.scope = "row";
                    }
                    newCell.contentEditable = "true";
                    newCell.innerHTML = firstCell.innerHTML;
                    // copy styles and classes
                    if (firstCell.className) {
                        newCell.className = firstCell.className;
                    }
                    if (firstCell.style.cssText) {
                        newCell.style.cssText = firstCell.style.cssText;
                    }
                    tr.replaceChild(newCell, firstCell);
                }
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
                const currentSpan = parseInt(cell.getAttribute("colspan") || 1, 10);
                const nextSpan = parseInt(next.getAttribute("colspan") || 1, 10);
                
                if (content !== "<br>") {
                    cell.innerHTML += " " + content;
                }
                cell.setAttribute("colspan", currentSpan + nextSpan);
                next.remove();
            }
        } else if (action === "splitCell") {
            const colspan = parseInt(cell.getAttribute("colspan") || 1, 10);
            if (colspan > 1) {
                cell.removeAttribute("colspan");
                for (let i = 1; i < colspan; i++) {
                    const newCell = document.createElement(cell.tagName);
                    if (cell.tagName === "TH" && cell.scope) {
                        newCell.scope = cell.scope;
                    }
                    newCell.contentEditable = "true";
                    newCell.innerHTML = "<br>";
                    row.insertBefore(newCell, cell.nextElementSibling);
                }
            }
        }
    }
});