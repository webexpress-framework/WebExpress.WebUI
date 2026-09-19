/**
 * Plugin for table operations.
 * Wraps tables in frames for consistent handling and provides native HTML table actions,
 * enhanced navigation (Tab key), intermediate headers, and left-side vertical headers.
 * Only table cells are editable to prevent structural damage.
 */
webexpress.webui.EditorPlugins.register("table", 3000, {
    _selections: new WeakMap(),
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
     * Keeps navigation and selection listeners tied to the owning editor's lifetime.
     * @param {object} editor - Editor instance.
     */
    init: function(editor) {
        const stopNavigation = this._enableTabNav(editor);
        const stopSelection = this._enableCellSelection(editor);
        return () => {
            stopNavigation();
            stopSelection();
        };
    },

    /**
     * Triggered by the editor whenever the entire content changes (load/paste).
     * Used to upgrade raw tables into editable frames.
     * @param {object} editor - Editor instance.
     */
    onContentChange: function(editor) {
        this._clearCellSelection(editor);
        this._upgradeRawTables(editor);
    },

    /**
     * Tracks rectangular cell selections independently of browser text-selection quirks.
     */
    _enableCellSelection: function(editor) {
        const root = editor.getEditorElement();
        let anchor = null;
        let dragging = false;
        const down = e => {
            if (e.button !== 0 || e.target.closest?.(".wx-col-resizer")) {
                return;
            }
            const cell = e.target.closest?.("td,th");
            const previous = this._getSelectedCells(editor)[0];
            this._clearCellSelection(editor);
            anchor = cell && root.contains(cell) ? cell : null;
            dragging = false;
            if (e.shiftKey && anchor && previous?.closest("table") === anchor.closest("table")) {
                this._selectCellRectangle(editor, previous, anchor);
                anchor = previous;
                dragging = true;
                e.preventDefault();
            }
        };
        const move = e => {
            if (!anchor || !(e.buttons & 1)) {
                return;
            }
            const cell = e.target.closest?.("td,th");
            if (!cell || cell.closest("table") !== anchor.closest("table") || (!dragging && cell === anchor)) {
                return;
            }
            dragging = true;
            e.preventDefault();
            this._selectCellRectangle(editor, anchor, cell);
        };
        const up = () => {
            anchor = null;
            dragging = false;
        };
        const change = () => {
            if (anchor) {
                return;
            }
            const range = webexpress.webui.EditorSelection.getRange(root);
            if (range) {
                const cells = this._nativeSelectedCells(editor);
                this._highlightCells(editor, cells.length > 1 ? cells : []);
            }
        };
        const key = e => {
            if (e.key === "Escape") {
                const cell = this._getSelectedCells(editor)[0];
                this._clearCellSelection(editor);
                this._focusCell(cell);
            }
        };
        const outside = e => {
            if (!root.contains(e.target) && !editor._uiContainer?.contains(e.target) &&
                !e.target.closest?.(".wx-editor-bubble,.wx-editor-bubble-menu")) {
                this._clearCellSelection(editor);
            }
        };
        root.addEventListener("mousedown", down);
        root.addEventListener("keydown", key);
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
        document.addEventListener("mousedown", outside);
        document.addEventListener("selectionchange", change);
        return () => {
            root.removeEventListener("mousedown", down);
            root.removeEventListener("keydown", key);
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            document.removeEventListener("mousedown", outside);
            document.removeEventListener("selectionchange", change);
            this._clearCellSelection(editor);
        };
    },

    /**
     * Maps logical coordinates to cells so row and column spans do not shift the selection.
     */
    _tableGrid: function(table) {
        const rows = Array.from(table.rows);
        const grid = [];
        const positions = new Map();
        rows.forEach((row, r) => {
            grid[r] ||= [];
            let c = 0;
            const groupEnd = rows.findIndex((next, i) => i > r && next.parentElement !== row.parentElement);
            const remaining = (groupEnd < 0 ? rows.length : groupEnd) - r;
            Array.from(row.cells).forEach(cell => {
                while (grid[r][c]) c++;
                const rowSpan = Math.min(cell.rowSpan || remaining, remaining);
                const colSpan = cell.colSpan;
                positions.set(cell, { top: r, left: c, bottom: r + rowSpan - 1, right: c + colSpan - 1 });
                for (let y = r; y < r + rowSpan; y++) {
                    grid[y] ||= [];
                    for (let x = c; x < c + colSpan; x++) grid[y][x] = cell;
                }
                c += colSpan;
            });
        });
        return { rows, grid, positions };
    },

    /**
     * Expands a rectangle until every intersected spanning cell fits completely inside it.
     */
    _cellRectangle: function(first, last) {
        const table = first?.closest("table");
        if (!table || table !== last?.closest("table")) return [];
        const { positions } = this._tableGrid(table);
        const a = positions.get(first), b = positions.get(last);
        if (!a || !b) return [];
        const bounds = { top: Math.min(a.top, b.top), left: Math.min(a.left, b.left),
            bottom: Math.max(a.bottom, b.bottom), right: Math.max(a.right, b.right) };
        let changed;
        do {
            changed = false;
            positions.forEach(p => {
                if (p.top > bounds.bottom || p.bottom < bounds.top || p.left > bounds.right || p.right < bounds.left) return;
                const expanded = { top: Math.min(bounds.top, p.top), left: Math.min(bounds.left, p.left),
                    bottom: Math.max(bounds.bottom, p.bottom), right: Math.max(bounds.right, p.right) };
                if (Object.keys(bounds).some(key => bounds[key] !== expanded[key])) {
                    Object.assign(bounds, expanded);
                    changed = true;
                }
            });
        } while (changed);
        return Array.from(positions).filter(([, p]) => p.top >= bounds.top && p.bottom <= bounds.bottom &&
            p.left >= bounds.left && p.right <= bounds.right).map(([cell]) => cell);
    },

    /**
     * Accepts both text endpoints and native Firefox cell ranges.
     */
    _boundaryCell: function(node, offset, end = false) {
        const element = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        const cell = element?.closest?.("td,th");
        if (cell) return cell;
        const child = node?.childNodes[end ? offset - 1 : offset];
        if (child?.matches?.("td,th")) return child;
        const cells = child?.querySelectorAll?.("td,th");
        return cells?.length ? cells[end ? cells.length - 1 : 0] : null;
    },

    /**
     * Converts keyboard and native table selections to the same rectangle as mouse dragging.
     */
    _nativeSelectedCells: function(editor) {
        const sel = window.getSelection();
        const root = editor.getEditorElement();
        if (!sel?.rangeCount) return [];
        const start = sel.getRangeAt(0), end = sel.getRangeAt(sel.rangeCount - 1);
        const first = this._boundaryCell(start.startContainer, start.startOffset);
        const last = this._boundaryCell(end.endContainer, end.endOffset, true);
        if (!first || !last || !root.contains(first) || !root.contains(last)) return [];
        return this._cellRectangle(first, last);
    },

    /**
     * Retains cell identity while toolbar focus temporarily removes the native selection.
     */
    _getSelectedCells: function(editor) {
        const cells = this._selections.get(editor);
        if (cells?.length && cells.every(cell => editor.getEditorElement().contains(cell))) return cells;
        return this._nativeSelectedCells(editor);
    },

    /**
     * Keeps the visible rectangle and command selection in agreement.
     */
    _selectCellRectangle: function(editor, first, last) {
        const cells = this._cellRectangle(first, last);
        if (!cells.length) return;
        this._highlightCells(editor, cells);
        const range = document.createRange();
        range.setStart(cells[0], 0);
        range.setEnd(cells[cells.length - 1], cells[cells.length - 1].childNodes.length);
        webexpress.webui.EditorSelection.apply(range);
        editor._saveCurrentSelection();
    },

    /**
     * Stores presentation state per editor to prevent selections leaking between instances.
     */
    _highlightCells: function(editor, cells) {
        this._clearCellSelection(editor);
        cells.forEach(cell => cell.setAttribute("data-wx-table-selected", ""));
        this._selections.set(editor, cells);
    },

    /**
     * Removes selection presentation before content replacement or editor teardown.
     */
    _clearCellSelection: function(editor) {
        editor.getEditorElement().querySelectorAll("[data-wx-table-selected]").forEach(cell => {
            cell.removeAttribute("data-wx-table-selected");
        });
        this._selections.delete(editor);
    },

    /**
     * Upgrades raw html tables to framed editor tables and binds resize events.
     * @param {object} editor - Editor instance.
     */
    _upgradeRawTables: function(editor) {
        const root = editor.getEditorElement();
        root.querySelectorAll("table").forEach(table => {
            table._wxEditor = editor;
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
        return editor.listen(editor.getEditorElement(), "keydown", e => {
            if (e.key !== "Tab" || e.defaultPrevented || e.isComposing || !editor.ownsInput(e)) return;
            editor._saveCurrentSelection();
            const Model = webexpress.webui.EditorModel;
            const block = Model.block(editor._state.doc, editor.selection.focus);
            const cell = block?.ancestors.findLast(n => n.type === "td" || n.type === "th");
            const table = block?.ancestors.findLast(n => n.type === "table");
            if (!cell || !table) return;
            e.preventDefault();
            const cells = table.children.flatMap(section => section.children.flatMap(row => row.children));
            let next = cells[cells.indexOf(cell) + (e.shiftKey ? -1 : 1)];
            if (!next && !e.shiftKey) {
                editor.dispatch({ type: "table", command: "insertRowBelow", ids: [cell.id] });
                const updated = Model.find(editor._state.doc, table.id)?.node;
                next = updated?.children.at(-1)?.children.at(-1)?.children[0];
            }
            if (next) { const pos = Model.find(editor._state.doc, next.id).start; editor.selection = { anchor: pos, focus: pos }; }
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
        return Math.max(0, ...this._tableGrid(table).grid.map(row => row.length));
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
        const cols = this._getMaxColumns(table);
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

        const positions = this._tableGrid(table).positions;
        for (const th of Array.from(headerRow.cells)) {
            const i = positions.get(th).right;

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
        const editor = table._wxEditor;
        if (!editor || editor.disabled) return;
        const id = editor.nodeId(table);
        const pointX = e => e.touches?.[0]?.clientX ?? e.clientX;
        const startX = pointX(evt), startWidth = Math.max(30, Math.round(th.getBoundingClientRect().width));
        const widths = Array.from(colgroup.children).map(col => parseFloat(col.style.width) || startWidth);
        const rtl = getComputedStyle(table).direction === "rtl";
        let width = widths[index];
        const move = e => { e.preventDefault(); width = Math.max(30, startWidth + (pointX(e) - startX) * (rtl ? -1 : 1)); colgroup.children[index].style.width = width + "px"; };
        const cleanups = [];
        const up = () => { cleanups.forEach(cleanup => cleanup()); widths[index] = width; editor.updateNode(id, { widths }); };
        cleanups.push(editor.listen(document, "mousemove", move), editor.listen(document, "mouseup", up), editor.listen(document, "touchmove", move, { passive: false }), editor.listen(document, "touchend", up));
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

        const cells = this._getSelectedCells(editor);
        if (!cells.includes(cell)) {
            this._clearCellSelection(editor);
            this._focusCell(cell);
        } else if (cells.length > 1) {
            this._highlightCells(editor, cells);
        }
        editor._saveCurrentSelection();

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
        customLabel.innerHTML = `<i class="${webexpress.webui.IconSet.resolve("plus")}" style="font-size: 10px;"></i>`;

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
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.insert.row.above"), action: () => this._modifyTable(editor, "insertRowAbove"), icon: "add-row-above" },
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.insert.row.below"), action: () => this._modifyTable(editor, "insertRowBelow"), icon: "add-row-below" },
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.insert.col.left"), action: () => this._modifyTable(editor, "insertColumnLeft"), icon: "add-column-above" },
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.insert.col.right"), action: () => this._modifyTable(editor, "insertColumnRight"), icon: "add-column-below" },
            { separator: true },
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.add.intermediate.header"), action: () => this._modifyTable(editor, "insertIntermediateHeader"), icon: "add-row-below" },
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.toggle.left.header"), action: () => this._modifyTable(editor, "toggleLeftHeader"), icon: "table-columns" },
            { separator: true },
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.merge.cells"), action: () => this._modifyTable(editor, "mergeCells"), icon: "table-merge-cells" },
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.split.cell"), action: () => this._modifyTable(editor, "splitCell"), icon: "split-cell" },
            { separator: true },
            {
                label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.cell.background"),
                icon: "fill-drip",
                submenu: colorItems,
                submenuClass: "wx-editor-color-picker"
            },
            { separator: true },
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.delete.row"), action: () => this._modifyTable(editor, "deleteRow"), icon: "del-row" },
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.delete.col"), action: () => this._modifyTable(editor, "deleteColumn"), icon: "del-column" },
            { label: webexpress.webui.I18N.translate("webexpress.webui:editor.table.delete.table"), action: () => this._modifyTable(editor, "deleteTable"), icon: "del-table" }
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
        button.title = webexpress.webui.I18N.translate("webexpress.webui:editor.table");
        button.setAttribute("aria-label", button.title);

        button.innerHTML = `<i class="${webexpress.webui.IconSet.resolve("table")}"></i>`;

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
        webexpress.webui.NativeMenu.bind(button, menu);
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
        // the table itself is contenteditable="true" to allow multi-cell selection
        let tableHtml = '<table class="table table-striped table-bordered wx-native-table" contenteditable="true">';
        tableHtml += "<thead><tr>";
        for (let c = 0; c < cols; c++) {
            tableHtml += `<th scope="col">Header ${c + 1}</th>`;
        }
        tableHtml += "</tr></thead>";
        tableHtml += "<tbody>";
        for (let r = 0; r < rows; r++) {
            tableHtml += "<tr>";
            for (let c = 0; c < cols; c++) {
                tableHtml += '<td><br></td>';
            }
            tableHtml += "</tr>";
        }
        tableHtml += "</tbody></table>";

        const uniqueId = "table-" + Date.now();
        const dragHandle = `<span class="wx-addon-drag-handle" contenteditable="false"><i class="${webexpress.webui.IconSet.resolve("grip-lines-vertical")}"></i></span>`;

        const frameHtml = `
            <div class="wx-addon-frame card my-3 shadow-sm"
                 contenteditable="false"
                 draggable="false"
                 data-addon-id="${uniqueId}"
                 data-type="table">

                <div class="card-header py-1 px-2 d-flex justify-content-between align-items-center" contenteditable="false">
                    <div class="small text-muted fw-bold d-flex align-items-center">
                        ${dragHandle}
                        <i class="${webexpress.webui.IconSet.resolve("table")} me-2"></i>
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
     * Sets the background color of the current cell selection.
     * Uses editor.restoreSavedRange to ensure the selection is available.
     * @param {object} editor - Editor instance.
     * @param {string} color - CSS color string.
     */
    _setCellBackground: function(editor, color) {
        editor.dispatch({ type: "table", command: "background", ids: this._getSelectedCells(editor).map(cell => editor.nodeId(cell)), color });
    },

    /**
     * Performs structural table modification actions.
     * @param {object} editor - Editor instance.
     * @param {string} action - Action identifier.
     */
    _modifyTable: function(editor, action) {
        const cells = this._getSelectedCells(editor);
        if (!cells.length) return;
        editor.dispatch({ type: "table", command: action, ids: cells.map(cell => editor.nodeId(cell)), text: webexpress.webui.I18N.translate("webexpress.webui:editor.table.intermediate.header") });
        this._clearCellSelection(editor);
    },

    /**
     * Rejects incomplete rectangles and row-group crossings that HTML cannot represent with spans.
     */
    _canMergeCells: function(cells) {
        if (cells.length < 2) return false;
        const table = cells[0].closest("table");
        const section = cells[0].parentElement.parentElement;
        if (cells.some(cell => cell.closest("table") !== table || cell.parentElement.parentElement !== section)) return false;
        const rectangle = this._cellRectangle(cells[0], cells[cells.length - 1]);
        if (rectangle.length !== cells.length || rectangle.some(cell => !cells.includes(cell))) return false;
        const { positions } = this._tableGrid(table);
        const bounds = this._selectionBounds(cells, positions);
        const area = cells.reduce((total, cell) => {
            const p = positions.get(cell);
            return total + (p.bottom - p.top + 1) * (p.right - p.left + 1);
        }, 0);
        return area === (bounds.bottom - bounds.top + 1) * (bounds.right - bounds.left + 1);
    },

    /**
     * Finds the logical extent of selected cells including their existing spans.
     */
    _selectionBounds: function(cells, positions) {
        const selected = cells.map(cell => positions.get(cell));
        return { top: Math.min(...selected.map(p => p.top)), left: Math.min(...selected.map(p => p.left)),
            bottom: Math.max(...selected.map(p => p.bottom)), right: Math.max(...selected.map(p => p.right)) };
    },






});
