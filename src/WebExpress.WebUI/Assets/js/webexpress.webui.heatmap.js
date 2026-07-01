/**
 * A read-only heat map control. It renders a grid of numeric values, colouring each cell on a
 * gradient between a low and a high colour so patterns and outliers stand out at a glance. The
 * grid, the bounds, the optional axis labels and the gradient endpoints are taken from the host
 * element's data attributes and can be updated programmatically.
 */
webexpress.webui.HeatMapCtrl = class extends webexpress.webui.Ctrl {
    /**
     * The default gradient endpoints (a light tint to a saturated blue), used when the host does
     * not configure data-low-color / data-high-color.
     */
    static DEFAULT_LOW = [222, 235, 247];
    static DEFAULT_HIGH = [8, 48, 107];

    /**
     * Constructor
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        // read configuration
        this._values = this._parseValues(element.dataset.values);
        this._rowLabels = this._parseLabels(element.dataset.rowLabels);
        this._colLabels = this._parseLabels(element.dataset.colLabels);
        this._low = this._parseColor(element.dataset.lowColor) || webexpress.webui.HeatMapCtrl.DEFAULT_LOW;
        this._high = this._parseColor(element.dataset.highColor) || webexpress.webui.HeatMapCtrl.DEFAULT_HIGH;
        this._min = this._parseNumber(element.dataset.min);
        this._max = this._parseNumber(element.dataset.max);

        // base classes and attributes; the grid is purely visual, so the value is exposed once on
        // the host rather than per cell
        element.classList.add("wx-heatmap");
        element.setAttribute("role", "img");
        element.setAttribute("aria-readonly", "true");

        this._render();
    }

    /**
     * Parse the serialized grid (rows split by ';', cells by ',') into a 2D array of numbers.
     * @param {string|null|undefined} raw Raw input.
     * @returns {number[][]} The parsed grid, empty when there is nothing to parse.
     */
    _parseValues(raw) {
        if (!raw) {
            return [];
        }
        return raw.split(";").map((row) => row.split(",").map((cell) => parseFloat(cell)));
    }

    /**
     * Parse a comma separated label list into an array of trimmed strings.
     * @param {string|null|undefined} raw Raw input.
     * @returns {string[]} The labels, empty when there are none.
     */
    _parseLabels(raw) {
        if (!raw) {
            return [];
        }
        return raw.split(",").map((label) => label.trim());
    }

    /**
     * Parse a number, returning null when absent or invalid so a computed bound can take over.
     * @param {string|null|undefined} raw Raw input.
     * @returns {number|null} The parsed number or null.
     */
    _parseNumber(raw) {
        if (raw == null || raw === "") {
            return null;
        }
        const n = parseFloat(raw);
        return isNaN(n) ? null : n;
    }

    /**
     * Parse a hex colour (#rgb or #rrggbb) into an [r, g, b] triple.
     * @param {string|null|undefined} raw Raw input.
     * @returns {number[]|null} The triple, or null when it cannot be parsed.
     */
    _parseColor(raw) {
        if (!raw) {
            return null;
        }
        let hex = raw.trim();
        if (hex.charAt(0) === "#") {
            hex = hex.slice(1);
        }
        if (hex.length === 3) {
            hex = hex.split("").map((c) => c + c).join("");
        }
        if (hex.length !== 6 || /[^0-9a-fA-F]/.test(hex)) {
            return null;
        }
        return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16)
        ];
    }

    /**
     * Resolve the gradient bounds from the configured min/max or, when absent, from the data so
     * the gradient always spans the grid.
     * @returns {number[]} The [min, max] bounds.
     */
    _bounds() {
        let min = this._min;
        let max = this._max;

        if (min == null || max == null) {
            const flat = this._values.flat().filter((v) => !isNaN(v));
            const dataMin = flat.length ? Math.min(...flat) : 0;
            const dataMax = flat.length ? Math.max(...flat) : 0;
            if (min == null) {
                min = dataMin;
            }
            if (max == null) {
                max = dataMax;
            }
        }

        return [min, max];
    }

    /**
     * Interpolate the gradient colour for a value within the bounds.
     * @param {number} value The cell value.
     * @param {number} min The low bound.
     * @param {number} max The high bound.
     * @returns {string} The css rgb() colour.
     */
    _colorFor(value, min, max) {
        // a zero-width range maps every value to the high colour, avoiding a divide by zero
        const t = max > min ? Math.min(Math.max((value - min) / (max - min), 0), 1) : 1;
        const channel = (i) => Math.round(this._low[i] + (this._high[i] - this._low[i]) * t);
        return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
    }

    /**
     * Build the grid: an optional column-label header followed by one row per data row, each with
     * an optional row label and its coloured cells.
     */
    _render() {
        this._element.innerHTML = "";

        const rows = this._values;
        const rowCount = rows.length;
        const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);

        if (rowCount === 0 || colCount === 0) {
            this._element.setAttribute("aria-label", this._i18n("webexpress.webui:heatmap", "Heat map"));
            return;
        }

        const hasRowLabels = this._rowLabels.length > 0;
        const hasColLabels = this._colLabels.length > 0;
        const [min, max] = this._bounds();

        this._element.style.gridTemplateColumns =
            (hasRowLabels ? "auto " : "") + `repeat(${colCount}, var(--wx-heatmap-cell, 1.5rem))`;

        const fragment = document.createDocumentFragment();

        if (hasColLabels) {
            if (hasRowLabels) {
                fragment.appendChild(this._buildElement("div", "wx-heatmap-corner"));
            }
            for (let c = 0; c < colCount; c++) {
                const label = this._buildElement("div", "wx-heatmap-col-label");
                label.textContent = this._colLabels[c] != null ? this._colLabels[c] : "";
                fragment.appendChild(label);
            }
        }

        for (let r = 0; r < rowCount; r++) {
            if (hasRowLabels) {
                const label = this._buildElement("div", "wx-heatmap-row-label");
                label.textContent = this._rowLabels[r] != null ? this._rowLabels[r] : "";
                fragment.appendChild(label);
            }

            for (let c = 0; c < colCount; c++) {
                const value = rows[r][c];
                const cell = this._buildElement("div", "wx-heatmap-cell");
                cell.setAttribute("aria-hidden", "true");
                if (value == null || isNaN(value)) {
                    cell.classList.add("wx-heatmap-cell-empty");
                } else {
                    cell.style.backgroundColor = this._colorFor(value, min, max);
                    cell.setAttribute("title", String(value));
                }
                fragment.appendChild(cell);
            }
        }

        this._element.appendChild(fragment);
        this._element.setAttribute("aria-label", `${this._i18n("webexpress.webui:heatmap", "Heat map")}: ${rowCount}x${colCount}`);
    }

    /**
     * Create an element with a class, the single allocation site for the grid parts.
     * @param {string} tag The tag name.
     * @param {string} className The css class.
     * @returns {HTMLElement} The created element.
     */
    _buildElement(tag, className) {
        const element = document.createElement(tag);
        element.className = className;
        return element;
    }

    /**
     * Get the grid values.
     * @returns {number[][]} The current grid.
     */
    get values() {
        return this._values;
    }

    /**
     * Set the grid values and re-render.
     * @param {number[][]|string|null|undefined} v New grid, as a 2D array or the serialized token.
     */
    set values(v) {
        this._values = Array.isArray(v) ? v : this._parseValues(v);
        this._render();
    }

    /**
     * Destroy control.
     */
    destroy() {
        this._element.innerHTML = "";
    }
};

// register control class
webexpress.webui.Controller.registerClass("wx-webui-heatmap", webexpress.webui.HeatMapCtrl);
