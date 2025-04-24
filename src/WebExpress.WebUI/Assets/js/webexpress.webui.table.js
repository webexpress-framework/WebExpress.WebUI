/**
 * A table control extending the base Control class with column reordering functionality and visual indicators.
 */
webexpress.webui.TableCtrl = class extends webexpress.webui.Ctrl {
    // Define table-related DOM elements and data
    _col = $("<colgroup/>");
    _head = $("<thead/>");
    _body = $("<tbody/>");
    _foot = $("<tfoot/>");
    _columns = [];
    _rows = [];
    _footer = [];
    _draggedColumn = null; // Track the column being dragged

    /**
     * Constructor to initialize the table control.
     * @param {HTMLElement} element - The DOM element associated with the table control.
     */
    constructor(element) {
        super(element);

        // Initialize table structure and parse existing data
        this._initializeTable(element);
        this.render(); // Render the initial state of the table
    }

    /**
     * Initializes the table structure and parses columns, rows, and footer.
     * @param {HTMLElement} element - The DOM element for the table control.
     */
    _initializeTable(element) {
        // Parse data from the DOM
        this._columns = this._parseColumns($(element).find("thead th"));
        this._rows = this._parseRows($(element).find("tbody tr"));
        this._footer = this._parseFooter($(element).find("tfoot tr"));

        // Set up the table structure
        $(element)
            .empty()
            .append(this._col, this._head, this._body, this._foot)
            .addClass("wx-table table table-hover");
    }

    /**
     * Parses column definitions from <thead>.
     * @param {jQuery} columns - The <th> elements.
     * @returns {Array} Parsed column definitions.
     */
    _parseColumns(columns) {
        return columns.map((_, th) => {
            const $th = $(th);
            return {
                label: $th.text().trim(),
                icon: $th.data("icon") || null,
                image: $th.data("image") || null,
                width: $th.attr("width") || null,
            };
        }).get();
    }

    /**
     * Parses row data from <tbody>.
     * @param {jQuery} rows - The <tr> elements.
     * @returns {Array} Parsed row data.
     */
    _parseRows(rows) {
        return rows.map((_, tr) => {
            const row = {};
            $(tr).children("td").each((index, td) => {
                const $td = $(td);

                row[index] = {
                    text: $td.text().trim(),
                    icon: $td.data("icon") || null,
                    image: $td.data("image") || null,
                    renderFunction: $td.data("render")
                        ? new Function("item", `return (${$td.data("render")})(item);`)
                        : null
                };
            });
            return row;
        }).get();
    }

    /**
     * Parses footer data from <tfoot>.
     * @param {jQuery} footer - The <tr> elements in <tfoot>.
     * @returns {Array} Parsed footer data.
     */
    _parseFooter(footer) {
        console.debug("Parsing footer rows:", footer);
        return footer.map((_, tr) => {
            const row = $(tr).children("td").map((_, td) => {
                return $(td).html().trim();
            }).get();

            console.debug("Parsed footer row:", row);
            return row;
        }).get();
    }

    /**
     * Clears all rows and footers from the table.
     */
    clear() {
        this._body.empty();
        this._foot.empty();
    }

    /**
     * Orders the table rows based on a specific column and sort direction.
     * @param {number} columnIndex - The index of the column to sort by.
     * @param {string} direction - The sort direction, "asc" for ascending or "desc" for descending.
     */
    orderRows(columnIndex, direction = "asc") {
        // Validate the column index
        if (columnIndex < 0 || columnIndex >= this._columns.length) {
            console.error(`Invalid column index: ${columnIndex}`);
            return;
        }

        // Sort the rows based on the specified column
        this._rows.sort((a, b) => {
            const cellA = a[columnIndex]?.text || "";
            const cellB = b[columnIndex]?.text || "";

            if (direction === "asc") {
                return cellA.localeCompare(cellB, undefined, { numeric: true });
            } else if (direction === "desc") {
                return cellB.localeCompare(cellA, undefined, { numeric: true });
            } else {
                console.error(`Invalid sort direction: ${direction}`);
                return 0;
            }
        });

        // Re-render the table to reflect the new row order
        this.render();
    }

    /**
     * Renders the table structure including columns, rows, and footer.
     */
    render() {
        this._renderColumns(); // Render table header
        this._renderRows();    // Render table body
        this._renderFooter();  // Render table footer
    }

    /**
     * Renders the table headers (columns) including sort indicators.
     * Preserves existing data attributes and CSS classes.
     */
    _renderColumns() {
        // Ensure the header row exists
        let headRow = this._head.find("tr");
        if (headRow.length === 0) {
            headRow = $("<tr/>");
            this._head.append(headRow);
        }

        // Update or create each column header (th)
        this._columns.forEach((column, index) => {
            let th = this._head.find("th").eq(index);

            if (th.length === 0) {
                // Create a new th if it doesn't exist
                th = $("<th/>")
                    .attr("draggable", true)
                    .data("index", index);
                headRow.append(th);
            }

            // Preserve existing sort direction and classes
            const currentDirection = th.data("sort");
            if (currentDirection) {
                th.addClass(currentDirection === "asc" ? "wx-sort-asc" : "wx-sort-desc");
            }

            // Clear the contents and re-add column information
            th.empty();

            // Set column width
            const col = $("<col/>");
            if (column.width) {
                col.attr("style", `width: ${column.width};`);
            }
            this._col.append(col);

            // Add icon or image to the header
            if (column.icon) {
                th.append($("<i/>").addClass(`${column.icon} me-2`));
            }
            if (column.image) {
                th.append($("<img/>").attr("src", column.image).addClass("me-2"));
            }

            // Add label
            th.append(column.label);

            // Add drag-and-drop event handlers for column reordering
            th.off("dragstart dragend dragover dragleave drop");
            th.on("dragstart", (event) => this._onDragStart(event, index));
            th.on("dragend", (event) => this._onDragEnd(event));
            th.on("dragover", (event) => this._onDragOver(event, index));
            th.on("dragleave", () => this._onDragLeave(th));
            th.on("drop", (event) => this._onDrop(event, index));
        });

        // Remove extra th elements if columns are reduced
        headRow.children("th").slice(this._columns.length).remove();

        // Reattach sort handlers
        this._attachSortHandlers();
    }

    /**
     * Attaches click event handlers to the column headers for sorting.
     */
    _attachSortHandlers() {
        this._head.find("th").each((index, th) => {
            $(th).off("click").on("click", () => {
                const currentDirection = $(th).data("sort") || "asc";
                const newDirection = currentDirection === "asc" ? "desc" : "asc";

                // Update the sort direction in jQuery and the DOM
                this._head.find("th").data("sort", null);
                $(th).data("sort", newDirection);

                // Remove sort indicators from all headers and add to the clicked one
                this._head.find("th").removeClass("wx-sort-asc wx-sort-desc");
                $(th).addClass(newDirection === "asc" ? "wx-sort-asc" : "wx-sort-desc");

                // Sort rows based on the clicked column and direction
                this.orderRows(index, newDirection);

                // Trigger a custom sort event
                $(document).trigger(webexpress.webui.Event.TABLE_SORT_EVENT, {
                    columnIndex: index,
                    sortDirection: newDirection,
                    columnLabel: $(th).text().trim() // Optional: provide column label
                });
            });
        });
    }

    /**
     * Handles the dragstart event for column reordering.
     * @param {Event} event - The dragstart event.
     * @param {number} index - The index of the column being dragged.
     */
    _onDragStart(event, index) {
        this._draggedColumn = index; // Store the index of the dragged column
        const tableId = $(this._element).attr("id"); // Get the ID of the current table
        event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify({ index, tableId }));
        const th = this._head.find("tr").children("th").eq(index);
        th.addClass("wx-dragging");
    }

    /**
     * Handles the dragend event globally to clean up the dragging state.
     * @param {Event} event - The dragend event.
     */
    _onDragEnd(event) {
        // Remove the dragging class from all columns
        this._head.find("tr").children("th").removeClass("wx-dragging wx-drop-target");
        this._draggedColumn = null; // Reset the dragged column
    }

    /**
     * Handles the dragover event for column reordering.
     * @param {Event} event - The dragover event.
     * @param {number} index - The index of the column where the drag is over.
     */
    _onDragOver(event, index) {
        event.preventDefault(); // Allow dropping

        // Highlight the column as a potential drop target
        const th = this._head.find("tr").children("th").eq(index);
        th.addClass("wx-drop-target");
    }

    /**
     * Handles the dragleave event to remove the drop target highlight.
     * @param {jQuery} th - The <th> element being left.
     */
    _onDragLeave(th) {
        th.removeClass("wx-drop-target");
    }

    /**
     * Handles the drop event for column reordering.
     */
    _onDrop(event, targetIndex) {
        event.preventDefault();

        // Parse the data from the dragstart event
        const dragData = JSON.parse(event.originalEvent.dataTransfer.getData("text/plain"));
        const sourceIndex = dragData.index;
        const sourceTableId = dragData.tableId;

        // Get the ID of the current table
        const currentTableId = $(this._element).attr("id");

        // Remove drop target class
        const th = this._head.find("tr").children("th").eq(targetIndex);
        th.removeClass("wx-drop-target");

        // Ensure the drop is within the same table
        if (sourceTableId !== currentTableId) {
            return;
        }

        // Ensure sourceIndex and targetIndex are valid
        if (isNaN(sourceIndex) || isNaN(targetIndex)) {
            console.error("Invalid source or target index:", sourceIndex, targetIndex);
            return;
        }

        if (sourceIndex !== targetIndex) {
            // Reorder columns
            const movedColumn = this._columns.splice(sourceIndex, 1)[0];
            this._columns.splice(targetIndex, 0, movedColumn);

            // Reorder rows
            this._rows = this._rows.map(row => {
                const rowArray = Object.entries(row).sort((a, b) => a[0] - b[0]).map(entry => entry[1]);
                const movedCell = rowArray.splice(sourceIndex, 1)[0];
                rowArray.splice(targetIndex, 0, movedCell);
                return rowArray.reduce((acc, cellData, index) => {
                    acc[index] = cellData;
                    return acc;
                }, {});
            });

            // Re-render the table
            this.render();

            // Trigger a custom event for column reorder
            this._triggerColumnReorderEvent(sourceIndex, targetIndex);
        }
    }

    /**
     * Triggers a custom event to notify about column reordering.
     * @param {number} sourceIndex - The original index of the column.
     * @param {number} targetIndex - The new index of the column.
     */
    _triggerColumnReorderEvent(sourceIndex, targetIndex) {
        // Trigger a global event using $(document).trigger
        $(document).trigger(webexpress.webui.Event.COLUMN_REORDER_EVENT, {
            sourceIndex: sourceIndex,
            targetIndex: targetIndex,
            columns: this._columns, // Provide the updated column structure
        });
    }

    /**
     * Renders the table rows (body).
     */
    _renderRows() {
        this._body.empty();
        this._rows.forEach(row => this._addRow(row));
    }

    /**
     * Adds a row to the table body.
     * @param {Object} row - The row data.
     */
    _addRow(row) {
        const tr = $("<tr/>");

        this._columns.forEach((_, index) => {
            const cellData = row[index] || {};
            const td = $("<td/>");

            // Use render function if defined, otherwise add text
            if (cellData.renderFunction) {
                td.html(cellData.renderFunction(cellData));
            } else {
                // Add image or icon to the cell
                if (cellData.image) {
                    td.append($("<img/>").attr("src", cellData.image));
                }
                if (cellData.icon) {
                    td.append($("<i/>").addClass(cellData.icon));
                }

                // Add text to the cell
                td.append(cellData.text || "");
            }

            tr.append(td);
        });

        this._body.append(tr);
    }

    /**
     * Renders the table footer.
     */
    _renderFooter() {
        this._foot.empty();

        const tr = $("<tr>");

        this._footer.forEach(rowData => {
            tr.append($("<td>").html(rowData));
        });

        this._foot.append(tr);
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-table", webexpress.webui.TableCtrl);