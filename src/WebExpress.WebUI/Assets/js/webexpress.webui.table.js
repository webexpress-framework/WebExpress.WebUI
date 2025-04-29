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

        // Initialize table structure and parse existing data
        this._movableRow = $(element).data("movable-row") || false;
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
        this.render(); // Render the initial state of the table
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
            if (!event.ctrlKey) {
                event.preventDefault(); // Prevent drag if Ctrl is not pressed
                return;
            }

            const resizerArea = $(event.target).closest(".wx-table-column-resizer");
            if (resizerArea.length > 0) {
                event.preventDefault(); // Prevent drag if the drag starts from the resizer area
                return;
            }

            this._draggedColumn = column;
            $th.addClass("wx-table-dragging");
        });

        $th.on("dragend", () => {
            $th.removeClass("wx-table-dragging");
            this._dragColumnIndicator.removeClass().hide();
            this._draggedColumn = null;
        });

        $th.on("dragover", (event) => {
            if (!this._draggedColumn || !event.ctrlKey) {
                return; // Prevent dragover if no column is being dragged or Ctrl is not pressed
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

        $th.on("dragleave", () => {
            this._dragColumnIndicator.hide();
        });

        $th.on("drop", (event) => {
            if (!event.ctrlKey) {
                return; // Prevent dropping if Ctrl is not pressed
            }

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

            // Cancel drag
            this._dragColumnIndicator.hide();
            this._draggedColumn = null;

            // Trigger a custom event for column reorder
            this._triggerColumnReorderEvent(sourceIndex, adjustedTargetIndex);

            // Re-render the table
            this.render();
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
     * Enables resizable columns by adding resizer handles to each header element.
     * @param {HTMLElement} element - The DOM element representing the column header.
     * @param {Object} column - The column object associated with the header.
     */
    _enableResizableColumns(element, column) {
        const $th = $(element);

        // Create and configure the resizer element
        const resizer = $("<div>")
            .addClass("wx-table-column-resizer")
            .on("click", (event) => event.stopPropagation())
            .on("mousedown", (event) => this._onResizeStart(event, $th));

        // Append the resizer to the right side of the header
        $th.css("position", "relative").append(resizer);

        // Attach mousemove and mouseup handlers to the document for resizing
        $(document)
            .on("mousemove", (event) => this._onResize(event, $th, column))
            .on("mouseup", () => this._onResizeEnd($th));
    }

    /**
     * Handler for the start of the resizing process.
     * @param {MouseEvent} event - The mousedown event.
     * @param {jQuery} $th - The header element being resized.
     */
    _onResizeStart(event, $th) {
        this._resizingColumn = $th; // Store the column being resized
        this._resizeStartX = event.pageX; // Record the initial mouse position
        this._resizeStartWidth = $th.outerWidth(); // Record the initial column width
        $("body").addClass("wx-table-resizing"); // Add a visual cue for resizing
    }

    /**
     * Handler for mouse movement during resizing.
     * @param {MouseEvent} event - The mousemove event.
     * @param {jQuery} $th - The header element being resized.
     * @param {Object} column - The column object.
     */
    _onResize(event, $th, column) {
        if (!this._resizingColumn && this._resizingColumn != $th) return; // Exit if no column is being resized

        // Calculate the new width based on mouse movement
        const deltaX = event.pageX - this._resizeStartX;
        const newWidth = Math.max(this._resizeStartWidth + deltaX, 30); // Minimum width

        // Apply the new width to the header and associated column
        this._resizingColumn.css("width", `${newWidth}px`);
        column.width = newWidth;
    }

    /**
     * Handler for the end of the resizing process.
     * @param {jQuery} $th - The header element being resized.
     */
    _onResizeEnd($th) {
        if (!this._resizingColumn && this._resizingColumn != $th) return; // Exit if no column is being resized

        this._resizingColumn = null; // Clear the reference to the resizing column
        this._resizeStartX = null;
        this._resizeStartWidth = null;
        $("body").removeClass("wx-table-resizing"); // Remove the resizing visual cue
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
                sort: $th.data("sort") || null
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
     * Orders the table rows based on a specific column object and sort direction.
     * @param {Object} column - The column object to sort by.
     */
    orderRows(column) {
        // Find the index of the column object in the columns array
        const columnIndex = this._columns.indexOf(column);

        // Validate the column index
        if (columnIndex === -1) {
            console.error(`Column not found: ${JSON.stringify(column)}`);
            return;
        }

        // Sort the rows based on the specified column
        this._rows.sort((a, b) => {
            const cellA = a[columnIndex]?.text || "";
            const cellB = b[columnIndex]?.text || "";

            if (column.sort === "asc") {
                return cellA.localeCompare(cellB, undefined, { numeric: true });
            } else if (column.sort === "desc") {
                return cellB.localeCompare(cellA, undefined, { numeric: true });
            } else {
                console.error(`Invalid sort direction: ${column.sort}`);
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
        const headRow = $("<tr>");
        this._head.empty().append(headRow);

        if (this._movableRow) {
            headRow.append($("<th>"));
            this._col.empty().append($("<col>").attr("style", "width: 0.1em;"));
        }

        // Update or create each column header (th)
        this._columns.forEach((column, index) => {
            const th = $("<th>").attr("draggable", true);
            const isLastColumn = index === this._columns.length - 1;

            headRow.append(th);

            // Preserve existing sort direction and classes
            const currentDirection = column.sort;
            if (currentDirection) {
                th.addClass(currentDirection === "asc" ? "wx-sort-asc" : "wx-sort-desc");
            }

            // Set column width
            const col = $("<col>");
            if (isLastColumn) {
                col.attr("style", "width: auto;");
            } else if (column.width) {
                col.attr("style", `width: ${column.width}px;`);
            }
            this._col.append(col);

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
            this._enableResizableColumns(th, column);
            // Reattach sort handlers
            this._attachSortHandlers(th, column);
        });
    }

    /**
     * Attaches click event handlers to the column headers for sorting.
     * @param {HTMLElement} element - The DOM element representing the column header.
     * @param {Object} column - The column object associated with the header.
     */
    _attachSortHandlers(element, column) {
        const $th = $(element); // Get the jQuery object for the header element

        $th.on("click", () => {

            // Determine the new sort direction
            const currentDirection = column.sort || "asc";

            // Resets the sort direction for all columns
            this._columns.forEach((column) => {
                column.sort = null; // Set the sort property to null
            });

            // Update the sort direction in the DOM
            this._head.find("th").removeClass("wx-sort-asc wx-sort-desc");
            $th.addClass(column.sort === "asc" ? "wx-sort-asc" : "wx-sort-desc");

            // Sort rows based on the column and direction
            column.sort = currentDirection === "asc" ? "desc" : "asc";
            this.orderRows(column);

            // Trigger a custom sort event
            $(document).trigger(webexpress.webui.Event.TABLE_SORT_EVENT, {
                columnId: column.id,
                sortDirection: column.sort,
                columnLabel: $th.text().trim()
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
                .text("☰");
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