/**
 * A table control extending the base Control class with column reordering functionality and visual indicators.
 * The following events are triggered:
 * - webexpress.webui.Event.TABLE_SORT_EVENT
 * - webexpress.webui.Event.COLUMN_REORDER_EVENT
 */
webexpress.webui.TableCtrl = class extends webexpress.webui.Ctrl {
    // Table parts and state variables
    _table = document.createElement("table");
    _col = document.createElement("colgroup");
    _head = document.createElement("thead");
    _body = document.createElement("tbody");
    _foot = document.createElement("tfoot");
    _columns = [];
    _rows = [];
    _footer = [];
    _draggedColumn = null;
    _draggedRow = null;
    _dragColumnIndicator = null;
    _hasOptions = false;

    /**
     * Constructor to initialize the table control.
     * @param {HTMLElement} element - The DOM element associated with the table control.
     */
    constructor(element) {
        super(element);

        // Set base classes
        this._table.className = "wx-table table table-hover table-sm";

        // Read table configuration from data attributes
        const tableColor = element.dataset.color || null;
        const tableBorder = element.dataset.border || null;
        const tableStriped = element.dataset.striped || null;
        this._movableRow = element.dataset.movableRow === "true" || false;

        // Parse child options, columns, rows, footer
        this._options = this._parseOptions(element.querySelector(".wx-table-options"));
        this._columns = this._parseColumns(element.querySelector(".wx-table-columns"));
        this._rows = this._parseRows(element.querySelectorAll(".wx-table-row"));
        this._footer = this._parseFooter(element.querySelector(".wx-table-footer"));

        // Compose table structure
        this._table.appendChild(this._col);
        this._table.appendChild(this._head);
        this._table.appendChild(this._body);
        this._table.appendChild(this._foot);

        // Remove all children and attributes, then append table
        element.innerHTML = "";
        element.removeAttribute("data-color");
        element.removeAttribute("data-border");
        element.removeAttribute("data-striped");
        element.removeAttribute("data-movable-row");
        element.appendChild(this._table);

        // Add drag indicator for columns
        this._dragColumnIndicator = document.createElement("div");
        this._dragColumnIndicator.className = "wx-table-drag-indicator";
        this._dragColumnIndicator.style.display = "none";
        element.appendChild(this._dragColumnIndicator);

        if (tableColor) this._table.classList.add(tableColor);
        if (tableBorder) this._table.classList.add(tableBorder);
        if (tableStriped) this._table.classList.add(tableStriped);

        this.render();
    }

    /**
     * Enables drag and drop functionality for columns.
     * @param {HTMLElement} th - The table header cell.
     * @param {Object} column - The column definition.
     */
    _enableDragAndDropColumn(th, column) {
        th.draggable = true;

        th.addEventListener("dragstart", (event) => {
            if (!event.ctrlKey) {
                event.preventDefault();
                return;
            }
            // Prevent drag from resizer area
            if (event.target.closest(".wx-table-column-resizer")) {
                event.preventDefault();
                return;
            }
            this._draggedColumn = column;
            th.classList.add("wx-table-dragging");
        });

        th.addEventListener("dragend", () => {
            th.classList.remove("wx-table-dragging");
            this._dragColumnIndicator.className = "wx-table-drag-indicator";
            this._dragColumnIndicator.style.display = "none";
            this._draggedColumn = null;
        });

        th.addEventListener("dragover", (event) => {
            if (!this._draggedColumn || !event.ctrlKey) return;
            event.preventDefault();

            // Find out where the mouse is (left or right half)
            const rect = th.getBoundingClientRect();
            const mouseX = event.pageX || event.clientX;
            const isLeft = mouseX < rect.left + th.offsetWidth / 2;
            this._dragColumnIndicator.style.top = rect.top + "px";
            this._dragColumnIndicator.style.left = (isLeft ? rect.left - 2 : rect.left + th.offsetWidth - 2) + "px";
            this._dragColumnIndicator.style.height = th.offsetHeight + "px";
            this._dragColumnIndicator.style.display = "block";
        });

        th.addEventListener("dragleave", () => {
            this._dragColumnIndicator.style.display = "none";
        });

        th.addEventListener("drop", (event) => {
            if (!event.ctrlKey) return;
            event.preventDefault();

            // Do nothing if invalid or same column
            if (this._draggedColumn === null || column === null || this._draggedColumn === column) return;

            const sourceIndex = this._columns.indexOf(this._draggedColumn);
            const targetIndex = this._columns.indexOf(column);
            if (sourceIndex === -1 || targetIndex === -1) return;

            // Find out if the column should be inserted before or after
            const rect = th.getBoundingClientRect();
            const mouseX = event.pageX || event.clientX;
            const insertBefore = mouseX < rect.left + th.offsetWidth / 2;

            let adjustedTargetIndex = targetIndex;
            if (insertBefore) {
                if (sourceIndex < targetIndex) adjustedTargetIndex -= 1;
            } else {
                if (sourceIndex > targetIndex) adjustedTargetIndex += 1;
            }
            if (sourceIndex === adjustedTargetIndex) return;

            // Move column in array
            const movedColumn = this._columns.splice(sourceIndex, 1)[0];
            this._columns.splice(adjustedTargetIndex, 0, movedColumn);

            // Move cell data in each row to match new column order
            this._rows = this._rows.map((row) => {
                const { cells, options } = row;
                const cellArray = Array.isArray(cells) ? [...cells] : Object.values(cells);
                const movedCell = cellArray.splice(sourceIndex, 1)[0];
                cellArray.splice(adjustedTargetIndex, 0, movedCell);
                return { cells: cellArray, options };
            });

            this._dragColumnIndicator.style.display = "none";
            this._draggedColumn = null;

            this._triggerColumnReorderEvent(sourceIndex, adjustedTargetIndex);
            this.render();
        });
    }

    /**
     * Attaches click event handlers to the column headers for sorting.
     * @param {HTMLElement} th - The header cell.
     * @param {Object} column - The column object.
     */
    _enableSortColumns(th, column) {
        th.addEventListener("click", () => {
            const currentDirection = column.sort || "asc";
            // Reset all columns
            this._columns.forEach((col) => { col.sort = null; });
            // Remove old sort classes
            Array.from(this._head.querySelectorAll("th")).forEach(thEl =>
                thEl.classList.remove("wx-sort-asc", "wx-sort-desc")
            );
            th.classList.add(column.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc");
            // Set new direction
            column.sort = currentDirection === "asc" ? "desc" : "asc";
            this.orderRows(column);

            // Dispatch sort event
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.TABLE_SORT_EVENT, {
                detail: {
                    sender: this._element,
                    columnId: column.id,
                    sortDirection: column.sort,
                    columnLabel: th.textContent.trim()
                }
            }));
        });
    }

    /**
     * Enables drag and drop for table rows.
     * @param {HTMLElement} handle - The drag handle cell.
     * @param {Object} row - The row object.
     */
    _enableDragAndDropRow(handle, row) {
        handle.draggable = true;
        const tr = handle.closest("tr");

        let placeholder = null;

        handle.addEventListener("dragstart", () => {
            this._draggedRow = row;
            tr.classList.add("wx-table-dragging");
            placeholder = document.createElement("tr");
            placeholder.className = "wx-drag-over";
            placeholder.style.height = tr.offsetHeight + "px";
            tr.parentNode.insertBefore(placeholder, tr.nextSibling);
        });

        handle.addEventListener("dragend", () => {
            tr.classList.remove("wx-table-dragging");
            if (placeholder && placeholder.parentNode) placeholder.parentNode.replaceChild(tr, placeholder);
            placeholder = null;
            this._draggedRow = null;
        });

        tr.addEventListener("dragover", (event) => {
            if (!this._draggedRow) return;
            event.preventDefault();
            const targetRow = event.currentTarget;
            const rect = targetRow.getBoundingClientRect();
            const mouseY = event.pageY || event.clientY;
            const halfHeight = targetRow.offsetHeight / 2;
            if (mouseY < rect.top + halfHeight) {
                targetRow.parentNode.insertBefore(placeholder, targetRow);
            } else {
                targetRow.parentNode.insertBefore(placeholder, targetRow.nextSibling);
            }
        });

        tr.addEventListener("drop", (event) => {
            event.preventDefault();
            const newIndex = Array.from(this._body.children).indexOf(placeholder);
            const oldIndex = this._rows.indexOf(this._draggedRow);
            if (newIndex !== oldIndex && newIndex >= 0 && newIndex < this._rows.length) {
                this._rows.splice(oldIndex, 1);
                this._rows.splice(newIndex, 0, this._draggedRow);
            }
            this.render();
        });
    }

    /**
     * Enables resizable columns by adding resizer handles to each header element.
     * @param {HTMLElement} th - The column header cell.
     * @param {Object} column - The column object.
     */
    _enableResizableColumns(th, column) {
        // Create handle for resizing columns
        const resizer = document.createElement("div");
        resizer.className = "wx-table-column-resizer";
        resizer.addEventListener("click", (e) => e.stopPropagation());
        resizer.addEventListener("mousedown", (e) => this._onResizeStart(e, th));
        th.style.position = "relative";
        th.appendChild(resizer);

        // Mousemove/mouseup handlers
        document.addEventListener("mousemove", (event) => this._onResize(event, th, column));
        document.addEventListener("mouseup", () => this._onResizeEnd(th));
    }

    /**
     * Handler for the start of the resizing process.
     * @param {MouseEvent} event - The mousedown event.
     * @param {HTMLElement} th - The header being resized.
     */
    _onResizeStart(event, th) {
        this._resizingColumn = th;
        this._resizeStartX = event.pageX;
        this._resizeStartWidth = th.offsetWidth;
        document.body.classList.add("wx-table-resizing");
    }

    /**
     * Handler for mouse movement during resizing.
     * @param {MouseEvent} event - The mousemove event.
     * @param {HTMLElement} th - The header being resized.
     * @param {Object} column - The column object.
     */
    _onResize(event, th, column) {
        if (!this._resizingColumn || this._resizingColumn !== th) return;
        const deltaX = event.pageX - this._resizeStartX;
        const newWidth = Math.max(this._resizeStartWidth + deltaX, 30);
        this._resizingColumn.style.width = newWidth + "px";
        column.width = newWidth;
    }

    /**
     * Handler for the end of the resizing process.
     * @param {HTMLElement} th - The header being resized.
     */
    _onResizeEnd(th) {
        if (!this._resizingColumn || this._resizingColumn !== th) return;
        this._resizingColumn = null;
        this._resizeStartX = null;
        this._resizeStartWidth = null;
        document.body.classList.remove("wx-table-resizing");
    }

    /**
     * Parses the options within the wx-table-options container.
     * @param {HTMLElement} optionsDiv - The <div> containing the dropdown options.
     * @returns {Array} Array of parsed option objects.
     */
    _parseOptions(optionsDiv) {
        if (!optionsDiv) return [];
        const options = [];
        for (const div of optionsDiv.children) {
            const elem = div;
            if (elem.classList.contains("wx-dropdown-divider")) {
                options.push({ type: "divider" });
            } else if (elem.classList.contains("wx-dropdown-header")) {
                options.push({
                    type: "header",
                    content: elem.textContent.trim(),
                    icon: elem.dataset.icon || null,
                });
            } else {
                options.push({
                    id: elem.id || null,
                    image: elem.dataset.image || null,
                    icon: elem.dataset.icon || null,
                    linkColor: elem.dataset.linkcolor || null,
                    uri: elem.dataset.uri || null,
                    target: elem.dataset.target || null,
                    tooltip: elem.dataset.tooltip || null,
                    modal: elem.dataset.modal || null,
                    content: elem.textContent.trim() || null,
                    disabled: elem.hasAttribute("disabled"),
                });
            }
        }
        return options;
    }

    /**
     * Parses column definitions from <div> elements with class 'wx-table-columns'.
     * @param {HTMLElement} columnsDiv - The <div> with columns.
     * @returns {Array} Parsed column definitions.
     */
    _parseColumns(columnsDiv) {
        if (!columnsDiv) return [];
        const headerColor = columnsDiv.dataset.color || null;
        if (headerColor) this._head.classList.add(headerColor);
        return Array.from(columnsDiv.children).map(div => ({
            label: div.textContent.trim(),
            icon: div.dataset.icon || null,
            image: div.dataset.image || null,
            color: div.dataset.color || null,
            width: div.getAttribute("width") || null,
            sort: div.dataset.sort || null,
        }));
    }

    /**
     * Parses row data from <div> elements with class 'wx-table-row'.
     * @param {NodeList} rowsDivs - The NodeList of row divs.
     * @returns {Array} Array of row data objects.
     */
    _parseRows(rowsDivs) {
        const rows = [];
        for (const div of rowsDivs) {
            const row = {
                id: div.id || null,
                class: div.className || null,
                style: div.getAttribute("style") || null,
                color: div.dataset.color || null,
                cells: [],
                options: null
            };
            for (const cellDiv of div.children) {
                const cell = cellDiv;
                if (cell.classList.contains("wx-table-options")) {
                    row.options = this._parseOptions(cell);
                    this._hasOptions = true;
                } else {
                    row.cells.push({
                        id: cell.id || null,
                        class: cell.className || null,
                        style: cell.getAttribute("style") || null,
                        color: cell.dataset.color || null,
                        text: cell.textContent.trim(),
                        image: cell.dataset.image || null,
                        icon: cell.dataset.icon || null,
                        uri: cell.dataset.uri || null,
                        target: cell.dataset.target || null,
                        modal: cell.dataset.modal || null
                    });
                }
            }
            rows.push(row);
        }
        return rows;
    }

    /**
     * Parses footer data from <div> elements with class 'wx-table-footer'.
     * @param {HTMLElement} footerDiv - The <div> with footer rows.
     * @returns {Array} Array of HTML for footer cells.
     */
    _parseFooter(footerDiv) {
        if (!footerDiv) return [];
        return Array.from(footerDiv.children).map(div => div.innerHTML.trim());
    }

    /**
     * Clears all columns, rows and footers from the table.
     */
    clear() {
        this._col.innerHTML = "";
        this._head.innerHTML = "";
        this._body.innerHTML = "";
        this._foot.innerHTML = "";
    }

    /**
     * Orders the table rows based on a specific column object and sort direction.
     * @param {Object} column - The column object to sort by.
     */
    orderRows(column) {
        const columnIndex = this._columns.indexOf(column);
        if (columnIndex === -1) return;
        this._rows.sort((a, b) => {
            const cellsA = Array.isArray(a.cells) ? a.cells : Object.values(a.cells);
            const cellsB = Array.isArray(b.cells) ? b.cells : Object.values(b.cells);
            const cellA = cellsA[columnIndex]?.text || "";
            const cellB = cellsB[columnIndex]?.text || "";
            if (column.sort === "asc") {
                return cellA.localeCompare(cellB, undefined, { numeric: true });
            } else if (column.sort === "desc") {
                return cellB.localeCompare(cellA, undefined, { numeric: true });
            } else {
                return 0;
            }
        });
        this.render();
    }

    /**
     * Renders the table structure including columns, rows, and footer.
     */
    render() {
        this._renderColumns();
        this._renderRows();
        this._renderFooter();
    }

    /**
     * Renders the table headers (columns) including sort indicators.
     */
    _renderColumns() {
        const headRow = document.createElement("tr");
        this._col.innerHTML = "";
        this._head.innerHTML = "";
        this._head.appendChild(headRow);

        if (this._movableRow) {
            headRow.appendChild(document.createElement("th"));
            const col = document.createElement("col");
            col.setAttribute("style", "width: 1ch; max-width: 1ch; padding: 0;");
            this._col.appendChild(col);
        }

        this._columns.forEach((column) => {
            const th = document.createElement("th");
            th.draggable = true;
            if (column.color) th.classList.add(column.color);
            headRow.appendChild(th);
            
            const thdiv = document.createElement("div");

            if (column.icon) {
                const i = document.createElement("i");
                i.className = column.icon;
                thdiv.appendChild(i);
            }
            if (column.image) {
                const img = document.createElement("img");
                img.src = column.image;
                thdiv.appendChild(img);
            }
            if (column.content) {
                thdiv.innerHTML = column.content;
            } else {
                thdiv.appendChild(document.createTextNode(column.label));
            }
            
            th.appendChild(thdiv);

            const col = document.createElement("col");
            if (column.width) col.setAttribute("style", `width: ${column.width}px;`);
            this._col.appendChild(col);

            this._enableDragAndDropColumn(th, column);
            this._enableResizableColumns(th, column);
            this._enableSortColumns(th, column);
        });

        if (this._options && this._options.length > 0) {
            const div = document.createElement("div");
            div.className = "";
            div.dataset.icon = "fas fa-cog";
            div.dataset.size = "btn-sm";
            div.dataset.border = "false";
            new webexpress.webui.DropdownCtrl(div).items = this._options;
            const th = document.createElement("th");
            th.style.overflow = "visible";
            th.appendChild(div);
            headRow.appendChild(th);
            const col = document.createElement("col");
            col.setAttribute("style", "width: 1em;");
            this._col.appendChild(col);
        } else if (this._hasOptions) {
            headRow.appendChild(document.createElement("th"));
            const col = document.createElement("col");
            col.setAttribute("style", "width: 1em;");
            this._col.appendChild(col);
        }
    }

    /**
     * Renders the table rows (body).
     */
    _renderRows() {
        this._body.innerHTML = "";
        this._rows.forEach(row => this._addRow(row));
    }

    /**
     * Adds a row to the table body.
     * @param {Object} row - The row data.
     */
    _addRow(row) {
        const tr = document.createElement("tr");
        if (row.color) tr.classList.add(row.color);

        const cellCount = row.cells.length;
        const colCount = this._columns.length;

        if (this._movableRow) {
            const dragHandle = document.createElement("td");
            dragHandle.className = "wx-table-drag-handle";
            dragHandle.textContent = "☰";
            tr.appendChild(dragHandle);
            this._enableDragAndDropRow(dragHandle, row);
        }

        row.cells.forEach((cellData) => {
            const td = document.createElement("td");
            if (cellData.color) td.classList.add(cellData.color);
            if (cellData.class) td.classList.add(cellData.class);
            if (cellData.style) td.setAttribute("style", cellData.style);
            
            const tddiv = document.createElement("div");

            if (cellData.image) {
                const img = document.createElement("img");
                img.src = cellData.image;
                tddiv.appendChild(img);
            }
            if (cellData.icon) {
                const i = document.createElement("i");
                i.className = cellData.icon;
                tddiv.appendChild(i);
            }
            if (cellData.content) {
                tddiv.innerHTML = cellData.content;
            }
            else {
                tddiv.appendChild(document.createTextNode(cellData.text || ""));
            }
            td.appendChild(tddiv);
            tr.appendChild(td);
        });

        for (let i = cellCount; i < colCount; i++) {
            tr.appendChild(document.createElement("td"));
        }

        if (row.options && row.options.length > 0) {
            const div = document.createElement("div");
            div.dataset.icon = "fas fa-cog";
            div.dataset.size = "btn-sm";
            div.dataset.border = "false";
            new webexpress.webui.DropdownCtrl(div).items = row.options;
            const td = document.createElement("td");
            td.appendChild(div);
            tr.appendChild(td);
        } else if (this._hasOptions) {
            tr.appendChild(document.createElement("td"));
        }
        this._body.appendChild(tr);
    }

    /**
     * Renders the table footer.
     */
    _renderFooter() {
        this._foot.innerHTML = "";
        const tr = document.createElement("tr");
        if (this._movableRow) {
            tr.appendChild(document.createElement("td"));
        }
        this._footer.forEach(rowData => {
            const td = document.createElement("td");
            td.innerHTML = rowData;
            tr.appendChild(td);
        });
        if (this._hasOptions) {
            tr.appendChild(document.createElement("td"));
        }
        this._foot.appendChild(tr);
    }

    /**
     * Triggers a custom event to notify about column reordering.
     * @param {number} sourceIndex - The original index of the column.
     * @param {number} targetIndex - The new index of the column.
     */
    _triggerColumnReorderEvent(sourceIndex, targetIndex) {
        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.COLUMN_REORDER_EVENT, {
            detail: {
                sender: this._element,
                sourceIndex,
                targetIndex,
                columns: this._columns,
            }
        }));
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-table", webexpress.webui.TableCtrl);