/**
 * Plugin for table operations.
 * Implements getContextMenuItems to provide table-specific actions including background color dropdown.
 */
webexpress.webui.EditorPlugins.register("table", {
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

        // Generate color items for submenu
        const colorItems = this._colors.map(c => ({
            type: 'color',
            value: c,
            action: () => {
                this._lastCellColor = c;
                this._setCellBackground(editor, c);
            }
        }));

        // Add custom picker item to submenu
        // We create a custom DOM element that mimics the grid item but contains the input
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
            type: 'custom-element',
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
                submenuClass: "wx-editor-color-picker" // Forces grid layout
            },
            { separator: true },
            { label: "Delete Row", action: () => this._modifyTable(editor, "deleteRow"), icon: "wx-icon delete-row" },
            { label: "Delete Column", action: () => this._modifyTable(editor, "deleteColumn"), icon: "wx-icon delete-col" },
            { label: "Delete Table", action: () => this._modifyTable(editor, "deleteTable"), icon: "wx-icon delete-table" }
        ];
    },

    createToolbar: function(editor) {
        const frag = document.createDocumentFragment();
        const sep = document.createElement("span");
        sep.className = "wx-editor-separator";
        frag.appendChild(sep);
        frag.appendChild(this._createInsertButton(editor));
        this._tableToolbar = this._createContextToolbar(editor);
        frag.appendChild(this._tableToolbar);
        return frag;
    },

    _createInsertButton: function(editor) {
        // ... (unchanged insert button logic) ...
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
                            if (maxRows < ABS_MAX && selectedRows === maxRows) maxRows = Math.min(maxRows + 1, ABS_MAX);
                            if (maxCols < ABS_MAX && selectedCols === maxCols) maxCols = Math.min(maxCols + 1, ABS_MAX);
                            buildGrid(maxRows, maxCols);
                            highlightCells(selectedRows, selectedCols, maxRows, maxCols);
                            updateSizeDisplay(selectedRows, selectedCols);
                        }
                    });
                    
                    cell.addEventListener("click", (e) => {
                        this._insertTable(editor, selectedRows, selectedCols);
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
        document.addEventListener("click", (event) => { if (!container.contains(event.target)) resetGrid(); });
        button.addEventListener("click", () => { setTimeout(() => { resetGrid(); }, 0); });
        return container;
    },

    _insertTable: function(editor, rows, cols) {
        let html = "<table class='wx-editor-table' border='1'><thead><tr>";
        for (let c = 0; c < cols; c++) html += "<th><br></th>";
        html += "</tr></thead><tbody>";
        for (let r = 1; r < rows; r++) {
            html += "<tr>";
            for (let c = 0; c < cols; c++) html += "<td><br></td>";
            html += "</tr>";
        }
        html += "</tbody></table>";
        editor.insertHtmlAtCursor(html);
    },

    _createContextToolbar: function(editor) {
        const tb = document.createElement("div");
        tb.className = "wx-editor-table-toolbar";
        tb.style.display = "none";
        
        const actions = [
            { cmd: "insertRowAbove", icon: "wx-icon add-row-above" },
            { cmd: "insertRowBelow", icon: "wx-icon add-row-below" },
            { cmd: "deleteRow", icon: "wx-icon delete-row" },
            { cmd: "insertColumnLeft", icon: "wx-icon add-col-above" },
            { cmd: "insertColumnRight", icon: "wx-icon add-col-below" },
            { cmd: "deleteColumn", icon: "wx-icon delete-col" },
            { cmd: "mergeCells", icon: "wx-icon merge-cells" },
            { cmd: "splitCell", icon: "wx-icon split-cell" },
            { cmd: "cellBackground", icon: "wx-icon cell-background" },
            { cmd: "deleteTable", icon: "wx-icon delete-table" }
        ];
        
        actions.forEach((a) => {
            if (a.cmd === "cellBackground") {
                 tb.appendChild(this._createCellBackgroundButton(editor, a.icon));
            } else {
                 const b = document.createElement("button");
                 b.className = "wx-editor-btn";
                 b.innerHTML = `<i class="${a.icon}"></i>`;
                 b.addEventListener("click", () => {
                     this._modifyTable(editor, a.cmd);
                     editor.restoreSavedRange();
                 });
                 tb.appendChild(b);
            }
        });
        return tb;
    },
    
    _createCellBackgroundButton: function(editor, iconClass) {
        const group = document.createElement("div");
        group.className = "wx-editor-btn-group";
        group.style.gap = "0";

        const actionBtn = document.createElement("button");
        actionBtn.className = "wx-editor-btn";
        actionBtn.title = "Cell Background";
        const icon = document.createElement("i");
        icon.className = iconClass;
        actionBtn.style.borderBottom = `3px solid ${this._lastCellColor}`;
        actionBtn.appendChild(icon);

        actionBtn.addEventListener("click", () => {
            this._setCellBackground(editor, this._lastCellColor);
        });

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "wx-editor-btn dropdown-toggle dropdown-toggle-split";
        toggleBtn.setAttribute("data-bs-toggle", "dropdown");
        
        const menu = document.createElement("div");
        menu.className = "dropdown-menu";
        const list = document.createElement("ul");
        list.className = "wx-editor-color-picker";
        
        this._colors.forEach((c) => {
            const li = document.createElement("li");
            const colorBtn = document.createElement("button");
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

    _detectTableSelection: function(editor) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return false;
        let node = sel.getRangeAt(0).startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        return editor.getEditorElement().contains(node) && node.closest("table");
    },
    
    _setCellBackground: function(editor, color) {
        editor.restoreSavedRange();
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        let cell = sel.getRangeAt(0).startContainer;
        if (cell.nodeType !== Node.ELEMENT_NODE) cell = cell.parentElement;
        cell = cell.closest("td,th");
        if (cell) cell.style.backgroundColor = color;
    },

    _modifyTable: function(editor, action) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        let cell = sel.getRangeAt(0).startContainer;
        if (cell.nodeType !== Node.ELEMENT_NODE) cell = cell.parentElement;
        cell = cell.closest("td,th");
        if (!cell) return;
        
        const row = cell.parentElement;
        const table = cell.closest("table");

        if (action === "deleteRow") {
            row.remove();
            if (table.rows.length === 0) table.remove();
        } else if (action === "deleteColumn") {
            const idx = cell.cellIndex;
            for (let r = 0; r < table.rows.length; r++) {
                if (table.rows[r].cells[idx]) table.rows[r].deleteCell(idx);
            }
            if (table.rows[0] && table.rows[0].cells.length === 0) table.remove();
        } else if (action === "insertRowAbove") {
            const newRow = table.insertRow(row.rowIndex);
            for(let i = 0; i < row.cells.length; i++) newRow.insertCell(i).innerHTML = "<br>";
        } else if (action === "insertRowBelow") {
            const newRow = table.insertRow(row.rowIndex + 1);
            for(let i = 0; i < row.cells.length; i++) newRow.insertCell(i).innerHTML = "<br>";
        } else if (action === "insertColumnLeft") {
            const idx = cell.cellIndex;
            for(let r = 0; r < table.rows.length; r++) table.rows[r].insertCell(idx).innerHTML = "<br>";
        } else if (action === "insertColumnRight") {
            const idx = cell.cellIndex + 1;
            for(let r = 0; r < table.rows.length; r++) table.rows[r].insertCell(idx).innerHTML = "<br>";
        } else if (action === "deleteTable") {
            table.remove();
        } else if (action === "mergeCells") {
            const next = cell.nextElementSibling;
            if (next) {
                const content = next.innerHTML;
                const colspan = (parseInt(cell.getAttribute("colspan")||1)) + (parseInt(next.getAttribute("colspan")||1));
                cell.innerHTML += " " + content;
                cell.setAttribute("colspan", colspan);
                next.remove();
            }
        } else if (action === "splitCell") {
            const colspan = parseInt(cell.getAttribute("colspan") || 1);
            if (colspan > 1) {
                cell.setAttribute("colspan", 1);
                for(let i=1; i<colspan; i++) {
                    const c = row.insertCell(cell.cellIndex + 1);
                    c.innerHTML = "<br>";
                }
            }
        }
    },

    _enableTabNav: function(editor) {
        editor.getEditorElement().addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                const sel = window.getSelection();
                if (!sel.rangeCount) return;
                let cell = sel.anchorNode;
                if (cell.nodeType !== Node.ELEMENT_NODE) cell = cell.parentElement;
                cell = cell.closest("td,th");
                if (cell) {
                    e.preventDefault();
                    const next = cell.nextElementSibling;
                    if (next) {
                         const r = document.createRange();
                         r.selectNodeContents(next);
                         r.collapse(true);
                         sel.removeAllRanges();
                         sel.addRange(r);
                    }
                }
            }
        });
    }
});