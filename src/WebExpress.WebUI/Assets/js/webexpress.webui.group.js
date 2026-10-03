/**
 * Items that belong together, laid out as fields of one surface and divided by hairlines.
 * Built from the host element emitted by WebExpress.WebUI.WebControl.ControlGroup.
 *
 * The dividers are the reason this is a control rather than a stylesheet. A rule drawn on
 * every field except the first is correct only while the row does not wrap; once it does, the
 * first field of every later row carries a line into empty space and the rows have nothing
 * between them. Which field starts a row is a question about the laid-out geometry, so it is
 * answered after layout and re-answered whenever the width changes.
 */
webexpress.webui.GroupCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Initializes the group: wraps each item in a field, applies the declared column count and
     * spacing, and marks the fields that start a row.
     * @param {HTMLElement} element - The DOM element associated with the group.
     */
    constructor(element) {
        super(element);

        // configuration from data attributes
        this._columns = parseInt(element.dataset.columns, 10) || 0;
        this._framed = element.dataset.framed !== "false";
        this._spacing = element.dataset.spacing || null;

        // the items are the children the server rendered; they are wrapped rather than rebuilt,
        // so whatever control produced a field keeps its own markup
        this._fields = Array.from(element.children).map((child) => {
            const field = document.createElement("div");
            field.className = "wx-group-field";
            element.replaceChild(field, child);
            field.appendChild(child);

            return field;
        });

        this._fillers = [];

        ["data-columns", "data-framed", "data-spacing"].forEach((name) => element.removeAttribute(name));

        element.classList.add("wx-group");

        if (!this._framed) {
            element.classList.add("wx-group-bare");
        }

        if (this._spacing) {
            element.classList.add("wx-group-" + this._spacing);
        }

        if (this._columns > 0) {
            element.style.setProperty("--wx-group-columns", this._columns);
        }

        this._markRowStarts();

        // the row count follows the width, so the marks are redrawn whenever it changes.
        // ResizeObserver is absent in the headless test runtime, where a single pass is
        // exactly what the assertions read.
        if (typeof ResizeObserver === "function") {
            this._observer = new ResizeObserver(() => this._markRowStarts());
            this._observer.observe(element);
        }
    }

    /**
     * Stops observing the width.
     */
    destroy() {
        this._observer?.disconnect();
        this._observer = null;

        this._dropFillers();

        super.destroy?.();
    }

    /**
     * Marks where each field sits in the laid-out grid and completes a short last row.
     *
     * Three things have to be known and none can be read from the markup. A field that begins a
     * row must drop the divider on its left, which would otherwise run into empty space. Every
     * field below the first row needs one above it - not only the first of its row, or the rule
     * runs under one column and stops. And a last row that is not full leaves a hole the lines
     * stop at, so it is completed with empty fields: the space stays empty, the frame around it
     * is whole.
     */
    _markRowStarts() {
        this._dropFillers();

        // a runtime without layout information reports nothing here; treating that as a single
        // row is the honest answer - the first field starts it, and nothing sits below it
        const tops = this._fields.map((field) => field.offsetTop ?? 0);
        const firstRow = tops.length ? tops[0] : 0;

        let top = null;

        this._fields.forEach((field, index) => {
            const offset = tops[index];

            field.classList.toggle("wx-group-row-start", top === null || offset > top);
            field.classList.toggle("wx-group-first-row", offset <= firstRow);

            if (top === null || offset > top) {
                top = offset;
            }
        });

        this._completeLastRow(tops, firstRow);
    }

    /**
     * Adds as many empty fields as the last row is short of a full one.
     *
     * Only for a group that actually wraps: in a single row the empty cells would draw a
     * divider after the last field and fence off space that is simply not used.
     * @param {number[]} tops - The offsetTop of each field, in order.
     * @param {number} firstRow - The offsetTop of the first row.
     */
    _completeLastRow(tops, firstRow) {
        const perRow = tops.filter((top) => top <= firstRow).length;
        const wraps = perRow > 0 && tops.length > perRow;

        if (!wraps) {
            return;
        }

        const missing = (perRow - (tops.length % perRow)) % perRow;

        for (let i = 0; i < missing; i++) {
            const filler = document.createElement("div");

            filler.className = "wx-group-field wx-group-filler";
            filler.setAttribute("aria-hidden", "true");

            this._element.appendChild(filler);
            this._fillers.push(filler);
        }
    }

    /**
     * Removes the empty fields, so the next pass measures the real ones only.
     */
    _dropFillers() {
        this._fillers.forEach((filler) => filler.remove());
        this._fillers = [];
    }
};

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-group", webexpress.webui.GroupCtrl);
