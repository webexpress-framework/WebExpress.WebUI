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
        if (!root) {
            return;
        }

        const tables = Array.from(root.querySelectorAll("table"));
        tables.forEach(table => {
            // allow selection across multiple cells by making the table editable
            table.setAttribute("contenteditable", "true");

            // remove explicit contenteditable from cells to inherit from table
            const cells = table.querySelectorAll("td, th");
            cells.forEach(c => {
                c.removeAttribute("contenteditable");
            });

            // check if the table already has a wrapper frame
            let frame = table.closest(".wx-addon-frame");

            if (!frame) {
                // it's a raw table, apply classes and wrap it
                table.classList.add("table", "table-striped", "table-striped-columns", "table-bordered", "wx-native-table");

                const uniqueId = "table-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
                const dragHandle = `<span class="wx-addon-drag-handle" contenteditable="false"><i class="${webexpress.webui.IconSet.resolve("grip-lines-vertical")}"></i></span>`;

                frame = document.createElement("div");
                frame.className = "wx-addon-frame card my-3 shadow-sm";
                frame.setAttribute("contenteditable", "false");
                // draggable defaults to false so a click-drag inside the table
                // performs a text selection instead of starting an element drag;
                // the add-on plugin flips it to true only while the drag handle
                // is grabbed.
                frame.setAttribute("draggable", "false");
                frame.setAttribute("data-addon-id", uniqueId);
                frame.setAttribute("data-type", "table");

                frame.innerHTML = `
                    <div class="card-header py-1 px-2 d-flex justify-content-between align-items-center" contenteditable="false">
                        <div class="small text-muted fw-bold d-flex align-items-center">
                            ${dragHandle}
                            <i class="${webexpress.webui.IconSet.resolve("table")} me-2"></i>
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
        const handler = (e) => {
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
                editor._history?.prepare();
                const newRow = targetTbody.insertRow();

                for (let i = 0; i < cols; i++) {
                    const newCell = document.createElement(i === 0 && firstCellIsHeader ? "th" : "td");
                    if (i === 0 && firstCellIsHeader) {
                        newCell.scope = "row";
                    }
                    newCell.innerHTML = "<br>";
                    newRow.appendChild(newCell);
                }
                this._finishTableChange(editor, table, newRow.cells[0]);
            }
        };
        editor.getEditorElement().addEventListener("keydown", handler);
        return () => editor.getEditorElement().removeEventListener("keydown", handler);
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
        let cells = this._getSelectedCells(editor);
        if (!cells.length) {
            editor.restoreSavedRange();
            cells = this._getSelectedCells(editor);
        }
        if (!cells.length) return;
        editor._history?.prepare();
        cells.forEach(cell => { cell.style.backgroundColor = color; });
        editor._saveCurrentSelection();
        editor._syncValue();
        editor._updateUndoRedoStates();
    },

    /**
     * Performs structural table modification actions.
     * @param {object} editor - Editor instance.
     * @param {string} action - Action identifier.
     */
    _modifyTable: function(editor, action) {
        let cells = this._getSelectedCells(editor);
        if (!cells.length) {
            editor.restoreSavedRange();
            cells = this._getSelectedCells(editor);
        }
        const cell = cells[0];
        if (!cell) return;
        if (action === "mergeCells" && !this._canMergeCells(cells)) return;
        editor._history?.prepare();

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
            newTh.className = "table-light text-center"; // simple visual class
            newTh.innerHTML = webexpress.webui.I18N.translate("webexpress.webui:editor.table.intermediate.header");
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
            this._mergeCells(cells);
        } else if (action === "splitCell") {
            this._splitCell(cell);
        }
        this._finishTableChange(editor, table, cell);
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

    /**
     * Moves content in reading order without rebuilding live descendants from HTML strings.
     */
    _mergeCells: function(cells) {
        const first = cells[0];
        const bounds = this._selectionBounds(cells, this._tableGrid(first.closest("table")).positions);
        const content = document.createDocumentFragment();
        cells.forEach(cell => {
            cell.querySelectorAll(".wx-col-resizer").forEach(handle => handle.remove());
            const meaningful = cell.textContent.trim() || cell.querySelector("img,table,ul,ol,[contenteditable='false']");
            if (meaningful) {
                if (content.childNodes.length) content.appendChild(document.createElement("br"));
                while (cell.firstChild) content.appendChild(cell.firstChild);
            }
            if (cell !== first) cell.remove();
        });
        while (first.firstChild) first.removeChild(first.firstChild);
        if (!content.childNodes.length) content.appendChild(document.createElement("br"));
        first.appendChild(content);
        first.setAttribute("colspan", bounds.right - bounds.left + 1);
        first.setAttribute("rowspan", bounds.bottom - bounds.top + 1);
    },

    /**
     * Restores every covered grid position when splitting horizontal or vertical merges.
     */
    _splitCell: function(cell) {
        const { rows, positions } = this._tableGrid(cell.closest("table"));
        const bounds = positions.get(cell);
        cell.removeAttribute("colspan");
        cell.removeAttribute("rowspan");
        for (let r = bounds.top; r <= bounds.bottom; r++) {
            const row = rows[r];
            const reference = Array.from(row.cells).find(other => positions.get(other)?.left > bounds.right) || null;
            for (let c = bounds.left; c <= bounds.right; c++) {
                if (r === bounds.top && c === bounds.left) continue;
                const newCell = document.createElement(cell.tagName.toLowerCase());
                if (cell.hasAttribute("scope")) newCell.setAttribute("scope", cell.getAttribute("scope"));
                newCell.appendChild(document.createElement("br"));
                row.insertBefore(newCell, reference);
            }
        }
    },

    /**
     * Publishes completed structural edits and leaves the caret in a surviving cell.
     */
    _finishTableChange: function(editor, table, cell) {
        this._clearCellSelection(editor);
        const root = editor.getEditorElement();
        if (root.contains(table)) {
            this._attachColumnResizersToTable(table);
            this._focusCell(root.contains(cell) ? cell : table.querySelector("td,th"));
        } else {
            const range = document.createRange();
            range.selectNodeContents(root);
            range.collapse(false);
            webexpress.webui.EditorSelection.apply(range);
        }
        editor._saveCurrentSelection();
        editor._syncValue();
        editor._updateUndoRedoStates();
    }
});
