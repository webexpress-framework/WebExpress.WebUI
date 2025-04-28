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
    _draggedRow = null; // Track the row being dragged
    _dragColumnIndicator = null; // Indicator for columns

    /**
     * Constructor to initialize the table control.
     * @param {HTMLElement} element - The DOM element associated with the table control.
     */
    constructor(element) {
        super(element);

        this._movableRow = $(element).data("movable-row") || false;

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

        // Create visual indicators for column and row dragging
        this._dragColumnIndicator = $("<div>")
            .addClass("wx-table-drag-indicator")
            .hide(); // Initially hidden

        // Append indicators to the document body
        $(element).append(this._dragColumnIndicator);
    }

    /**
     * Enables drag and drop functionality for columns.
     * @param {HTMLElement} element - The DOM element representing the column header.
     * @param {Object} column - The column object associated with the header.
     */
    _enableDragAndDropColumn(element, column) {
        const $th = $(element);
        $th.attr("draggable", true);

        $th.on("dragstart", (event) => {
            this._draggedColumn = column;
            element.addClass("wx-table-dragging");
        });
        $th.on("dragend", (event) => {
            $th.removeClass("wx-table-dragging");
            this._dragColumnIndicator.removeClass().hide();
            this._draggedColumn = null;
        });
        $th.on("dragover", (event) => {
            if (!this._draggedColumn) {
                return;
            }

            event.preventDefault(); // Allow dropping
            // Calculate the position of the mouse relative to the column
            const offset = $th.offset();
            const mouseX = event.originalEvent.pageX; // Mouse's X position
            const width = $th.outerWidth();
            const isLeft = mouseX < offset.left + width / 2; // Check if in the left half

            const height = $th.outerHeight();

            // Position the column indicator
            this._dragColumnIndicator
                .css({
                    top: offset.top,
                    left: isLeft ? offset.left - 2 : offset.left + width - 2, // Show indicator on the left or right
                    height: height,
                })
                .show();
        });
        $th.on("dragleave", (event) => {
            this._dragColumnIndicator.hide();
        });
        $th.on("drop", (event) => {
            event.preventDefault();

            // Prevent invalid operations where draggedColumn or targetColumn are null
            if (this._draggedColumn === null || column === null || this._draggedColumn === column) {
                return;
            }

            // Find the indices of the dragged column and the target column
            const sourceIndex = this._columns.indexOf(this._draggedColumn);
            const targetIndex = this._columns.indexOf(column);

            // Ensure both columns exist in the array
            if (sourceIndex === -1 || targetIndex === -1) {
                return;
            }

            // Calculate the position of the mouse relative to the target column
            const $th = $(event.currentTarget);
            const offset = $th.offset();
            const mouseX = event.originalEvent.pageX; // Mouse's X position
            const width = $th.outerWidth();
            const insertBefore = mouseX < offset.left + width / 2; // Determine if insertion should happen before

            // Adjust the target index based on the relative position
            let adjustedTargetIndex = targetIndex;
            if (insertBefore) {
                if (sourceIndex < targetIndex) {
                    adjustedTargetIndex -= 1; // Move leftward if the source is before the target
                }
            } else {
                if (sourceIndex > targetIndex) {
                    adjustedTargetIndex += 1; // Move rightward if the source is after the target
                }
            }

            // Edge cases: Prevent unnecessary shifts if the source is already correctly placed
            if (sourceIndex === adjustedTargetIndex) {
                return;
            }

            // Reorder columns
            const movedColumn = this._columns.splice(sourceIndex, 1)[0];
            this._columns.splice(adjustedTargetIndex, 0, movedColumn);

            // Reorder rows
            this._rows = this._rows.map(row => {
                const rowArray = Object.entries(row).sort((a, b) => a[0] - b[0]).map(entry => entry[1]);
                const movedCell = rowArray.splice(sourceIndex, 1)[0];
                rowArray.splice(adjustedTargetIndex, 0, movedCell);
                return rowArray.reduce((acc, cellData, index) => {
                    acc[index] = cellData;
                    return acc;
                }, {});
            });

            // Re-render the table
            this.render();

            // Trigger a custom event for column reorder
            this._triggerColumnReorderEvent(sourceIndex, adjustedTargetIndex);
        });
    }

    /**
     * Enables drag and drop functionality for rows.
     * @param {HTMLElement} element - The DOM element representing the column header.
     * @param {Object} row - The row object.
     */
    _enableDragAndDropRow(element, row) {
        const $handle = $(element);
        const $tr = $handle.closest("tr");
        $handle.attr("draggable", true); // Make the row handle draggable

        // Event listener for the start of the drag operation
        $handle.on("dragstart", (event) => {
            this._draggedRow = row; // Set the currently dragged row
            $handle.closest("tr").addClass("wx-table-dragging"); // Add a CSS class for visual feedback

            // Create a placeholder to show the position during dragging
            this._placeholder = $("<tr/>")
                .addClass("wx-table-drag-placeholder")
                .height($handle.closest("tr").height());
            $handle.closest("tr").after(this._placeholder);
        });

        // Event listener for the end of the drag operation
        $handle.on("dragend", (event) => {
            $tr.removeClass("wx-table-dragging"); // Remove the visual feedback class
            this._placeholder.replaceWith($tr); // Replace placeholder with the dragged row
            this._placeholder = null; // Clear the placeholder reference
            this._draggedRow = null; // Clear the reference to the dragged row
        });

        // Event listener for when the dragged row is over another row
        $tr.on("dragover", (event) => {
            if (!this._draggedRow) {
                return;
            }

            event.preventDefault(); // Allow the drop action

            const targetRow = $(event.currentTarget);
            const offset = targetRow.offset();
            const mouseY = event.originalEvent.pageY; // Y position of the mouse
            const halfHeight = targetRow.outerHeight() / 2; // Calculate the midpoint of the row

            if (mouseY < offset.top + halfHeight) {
                // If the mouse is in the top half of the row, show the indicator above
                this._placeholder.insertBefore(targetRow);
            } else {
                // If the mouse is in the bottom half of the row, show the indicator below
                this._placeholder.insertAfter(targetRow);
            }
        });

        // Event listener for when the dragged row leaves another row
        $tr.on("dragleave", (event) => {
        });

        // Event listener for when the dragged row is dropped
        $tr.on("drop", (event) => {
            event.preventDefault(); // Prevent the default drop behavior

            // Update the internal row order based on the new position
            const newIndex = this._body.find("tr").index(this._placeholder);
            const oldIndex = this._rows.indexOf(this._draggedRow);

            if (newIndex !== oldIndex && newIndex >= 0 && newIndex < this._rows.length) {
                // Remove the dragged row from its old position and insert it at the new position
                this._rows.splice(oldIndex, 1);
                this._rows.splice(newIndex, 0, this._draggedRow);
            }

            // Re-render the table to reflect the new row order
            this.render();
        });
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
            headRow = $("<tr>");
            this._head.append(headRow);
        }

        // Update or create each column header (th)
        this._columns.forEach((column, index) => {
            let th = this._head.find("th").eq(index);

            if (th.length === 0) {
                // Create a new th if it doesn't exist
                th = $("<th>")
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
            //const col = $("<col>");
            //if (column.width) {
            //    col.attr("style", `width: ${column.width};`);
            //}
            //this._col.append(col);

            // Add icon or image to the header
            if (column.icon) {
                th.append($("<i>").addClass(column.icon));
            }
            if (column.image) {
                th.append($("<img>").attr("src", column.image));
            }

            // Add label
            th.append(column.label);

            // Add drag-and-drop event handlers for column reordering
            this._enableDragAndDropColumn(th, column);
        });

        // Remove extra th elements if columns are reduced
        headRow.children("th").slice(this._columns.length).remove();

        // Reattach sort handlers
        this._attachSortHandlers();

        if (this._movableRow) {
            headRow.prepend($("<th>"));
        }
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
     * Adds a row to the table body with a dropdown for row shifting.
     * @param {Object} row - The row data.
     */
    _addRow(row) {
        const tr = $("<tr/>");

        if (this._movableRow) {
            // Create a draggable handle at the beginning of each row
            const dragHandle = $("<td/>")
                .addClass("wx-table-drag-handle")
                .text("⇅");
            tr.append(dragHandle);
            this._enableDragAndDropRow(dragHandle, row);
        }

        // Add the rest of the row's data
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