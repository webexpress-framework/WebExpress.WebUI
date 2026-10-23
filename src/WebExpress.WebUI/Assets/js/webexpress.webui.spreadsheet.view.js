/**
 * The sizes along one axis of a sheet. Only rows or columns that differ from the default size
 * are stored, with prefix sums of their differences, so the offset of any of a million rows is
 * a binary search away and building the axis costs only the overrides.
 */
webexpress.webui.SpreadsheetAxis = class {
    /**
     * Initializes a new instance of the class.
     * @param {number} count - The number of rows or columns.
     * @param {number} size - The default size in pixels at 100 %.
     * @param {Array<object>} props - The sparse row or column properties.
     * @param {number} [zoom=1] - The zoom factor.
     */
    constructor(count, size, props, zoom = 1) {
        this.count = count; this.size = size; this.zoom = zoom;
        this._at = []; this._sizes = []; this._prefix = [0];
        let sum = 0;
        props.forEach((p, i) => {
            if (i >= count || !p) return;
            const value = p.hidden ? 0 : p.size ?? size;
            if (value === size) return;
            this._at.push(i); this._sizes.push(value);
            sum += value - size;
            this._prefix.push(sum);
        });
    }

    /**
     * Counts the overrides before an index.
     * @param {number} index - The index.
     * @returns {number} The count.
     */
    _below(index) {
        let lo = 0, hi = this._at.length;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (this._at[mid] < index) lo = mid + 1; else hi = mid; }
        return lo;
    }

    /**
     * Returns where a row or column starts.
     * @param {number} index - The index; the count gives the total size.
     * @returns {number} The offset in pixels.
     */
    offset(index) { return (index * this.size + this._prefix[this._below(index)]) * this.zoom; }

    /**
     * Returns the size of a row or column.
     * @param {number} index - The index.
     * @returns {number} The size in pixels; 0 for a hidden one.
     */
    sizeOf(index) {
        const k = this._below(index);
        return (this._at[k] === index ? this._sizes[k] : this.size) * this.zoom;
    }

    /**
     * Returns the total size.
     * @returns {number} The size in pixels.
     */
    total() { return this.offset(this.count); }

    /**
     * Finds the row or column at an offset.
     * @param {number} px - The offset in pixels.
     * @returns {number} The index, clamped to the axis.
     */
    at(px) {
        let lo = 0, hi = this.count - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (this.offset(mid) <= px) lo = mid; else hi = mid - 1;
        }
        return Math.max(0, lo);
    }
};

/**
 * The grid of the spreadsheet. It renders only what is visible - the frozen rows and columns
 * plus the rows and columns inside the viewport - into a pane that stays fixed over a natively
 * scrolled spacer, so scrolling is the browser's and costs a few position updates per frame.
 * Cells keep a signature of what they show and the DOM is only written where it changed.
 *
 * The grid is an ARIA grid: rows carry their row index, cells their column index, the active
 * cell is the active descendant of the focused grid, and selected cells are marked as such.
 */
webexpress.webui.SpreadsheetView = class {
    /**
     * The height of the column header row.
     */
    static HEADER_HEIGHT = 24;

    /**
     * The default row height at 100 %.
     */
    static ROW_HEIGHT = 24;

    /**
     * The default column width at 100 %.
     */
    static COL_WIDTH = 100;

    /**
     * The largest scroll height used; a taller sheet is scrolled proportionally, because
     * browsers cap the height of an element (Firefox near 17.9 million pixels).
     */
    static MAX_SCROLL = 15000000;

    /**
     * The width of the zone around a header border that resizes instead of selecting.
     */
    static RESIZE_ZONE = 4;

    /**
     * The distance from a header edge in which a click shows the hidden rows or columns behind it.
     */
    static UNHIDE_ZONE = 8;

    /**
     * The viewport size assumed while the browser reports none, such as before layout.
     */
    static FALLBACK = { width: 1024, height: 600 };

    /**
     * Initializes a new instance of the class and builds the grid DOM.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     * @param {HTMLElement} parent - The element receiving the grid.
     */
    constructor(ctrl, parent) {
        this.ctrl = ctrl;
        this.zoom = 1;
        this._rows = new Map(); this._headers = new Map();
        this._frame = null; this._scrollY = 0; this._scrollX = 0;
        const make = (className, role) => {
            const el = document.createElement("div");
            el.className = className;
            if (role) el.setAttribute("role", role);
            return el;
        };
        this.viewport = make("wx-spreadsheet-viewport", "grid");
        this.viewport.tabIndex = 0;
        this.viewport.setAttribute("aria-multiselectable", "true");
        this.inner = make("wx-spreadsheet-inner", "presentation");
        this.pane = make("wx-spreadsheet-pane", "presentation");
        this.body = make("wx-spreadsheet-body", "rowgroup");
        this.overlay = make("wx-spreadsheet-overlay", "presentation");
        this.overlay.setAttribute("aria-hidden", "true");
        this.headRow = make("wx-spreadsheet-row wx-spreadsheet-headrow", "row");
        this.headRow.setAttribute("aria-rowindex", "1");
        this.headScroll = make("wx-spreadsheet-row-scroll", "presentation");
        this.corner = make("wx-spreadsheet-corner", "columnheader");
        this.corner.setAttribute("aria-colindex", "1");
        const cornerLabel = document.createElement("span");
        cornerLabel.className = "visually-hidden";
        cornerLabel.textContent = webexpress.webui.I18N.translate("webexpress.webui:spreadsheet.selectall");
        this.corner.appendChild(cornerLabel);
        this.headRow.appendChild(this.corner);
        this.headRow.appendChild(this.headScroll);
        this.pane.appendChild(this.body);
        this.pane.appendChild(this.overlay);
        this.pane.appendChild(this.headRow);
        this.inner.appendChild(this.pane);
        this.viewport.appendChild(this.inner);
        parent.appendChild(this.viewport);
        this.viewport.addEventListener("scroll", () => this.render());
    }

    /**
     * Gets the sheet shown.
     * @returns {webexpress.webui.SpreadsheetSheet} The sheet.
     */
    get sheet() { return this.ctrl.sheet; }

    /**
     * Gets the size of the viewport, falling back to a fixed size before layout.
     * @returns {{width: number, height: number}} The size in pixels.
     */
    get size() {
        const width = this.viewport.clientWidth, height = this.viewport.clientHeight;
        return width > 0 && height > 0 ? { width, height } : this.constructor.FALLBACK;
    }

    /**
     * Gets the width of the row header column, which grows with the digits of the last row.
     * @returns {number} The width in pixels.
     */
    get headerWidth() { return 14 + 8 * String(this.sheet.rowCount).length; }

    /**
     * Gets the height of the column header row.
     * @returns {number} The height in pixels.
     */
    get headerHeight() { return this.constructor.HEADER_HEIGHT; }

    /**
     * Rebuilds the axes from the sheet, after a structural change, a resize or a zoom.
     */
    measure() {
        const sheet = this.sheet;
        this.rows = new webexpress.webui.SpreadsheetAxis(sheet.rowCount, this.constructor.ROW_HEIGHT, sheet.rowProps, this.zoom);
        this.cols = new webexpress.webui.SpreadsheetAxis(sheet.colCount, this.constructor.COL_WIDTH, sheet.colProps, this.zoom);
        const width = this.headerWidth + this.cols.total();
        const height = this.headerHeight + this.rows.total();
        this._fullHeight = height;
        this._cssHeight = Math.min(height, this.constructor.MAX_SCROLL);
        this.inner.style.width = width + "px";
        this.inner.style.height = this._cssHeight + "px";
        this.viewport.setAttribute("aria-rowcount", String(sheet.rowCount + 1));
        this.viewport.setAttribute("aria-colcount", String(sheet.colCount + 1));
        this.pane.classList.toggle("wx-spreadsheet-nogrid", sheet.props.gridlines === false);
        this.pane.style.setProperty("--wx-spreadsheet-zoom", String(this.zoom));
        this._signature = null;
    }

    /**
     * Drops every cached cell signature, so the next render rewrites all visible cells.
     */
    invalidate() {
        this._signature = null;
        for (const row of this._rows.values()) row.cells.forEach(cell => { cell._sig = null; });
    }

    /**
     * Schedules a render for the next frame; several requests in one frame render once.
     */
    requestRender() {
        if (this._frame) return;
        const raf = globalThis.requestAnimationFrame ?? (callback => setTimeout(callback, 16));
        this._frame = raf(() => { this._frame = null; this.render(); });
    }

    /**
     * Reads the scroll position, scaled for sheets taller than the scroll limit.
     */
    _readScroll() {
        const { height } = this.size;
        const top = this.viewport.scrollTop || 0;
        const ratio = this._cssHeight > height && this._fullHeight > this._cssHeight ? (this._fullHeight - height) / (this._cssHeight - height) : 1;
        this._scrollY = top * ratio;
        this._scrollX = this.viewport.scrollLeft || 0;
    }

    /**
     * Returns the pane offset of a column.
     * @param {number} col - The column.
     * @returns {number} The x position in pixels.
     */
    colX(col) {
        const frozen = col < this.sheet.frozenCols;
        return this.headerWidth + this.cols.offset(col) - (frozen ? 0 : this._scrollX);
    }

    /**
     * Returns the pane offset of a row.
     * @param {number} row - The row.
     * @returns {number} The y position in pixels.
     */
    rowY(row) {
        const frozen = row < this.sheet.frozenRows;
        return this.headerHeight + this.rows.offset(row) - (frozen ? 0 : this._scrollY);
    }

    /**
     * Determines the visible rows and columns.
     * @returns {{rows: Array<number>, cols: Array<number>}} The indices in drawing order.
     */
    visible() {
        const sheet = this.sheet, { width, height } = this.size;
        const fr = Math.min(sheet.frozenRows, sheet.rowCount), fc = Math.min(sheet.frozenCols, sheet.colCount);
        const frozenH = this.rows.offset(fr), frozenW = this.cols.offset(fc);
        const rows = [], cols = [];
        for (let r = 0; r < fr; r++) rows.push(r);
        for (let c = 0; c < fc; c++) cols.push(c);
        if (fr < sheet.rowCount) {
            const first = Math.max(fr, this.rows.at(frozenH + this._scrollY));
            const last = this.rows.at(this._scrollY + height - this.headerHeight);
            for (let r = first; r <= last && r < sheet.rowCount; r++) rows.push(r);
        }
        if (fc < sheet.colCount) {
            const first = Math.max(fc, this.cols.at(frozenW + this._scrollX));
            const last = this.cols.at(this._scrollX + width - this.headerWidth);
            for (let c = first; c <= last && c < sheet.colCount; c++) cols.push(c);
        }
        return { rows, cols };
    }

    /**
     * Renders the visible part of the sheet.
     */
    render() {
        if (this.ctrl._destroyed || !this.rows) return;
        this._readScroll();
        const ctrl = this.ctrl, sheet = this.sheet, { width, height } = this.size;
        this.pane.style.width = width + "px";
        this.pane.style.height = height + "px";
        const view = this.visible();
        const active = ctrl._sel.active;
        // the active cell stays rendered, so the grid's active descendant always exists
        if (!view.rows.includes(active.row) && active.row < sheet.rowCount) view.rows.push(active.row);
        if (!view.cols.includes(active.col) && active.col < sheet.colCount) view.cols.push(active.col);
        const merges = sheet.merges.filter(m => view.rows.some(r => r >= m.r1 && r <= m.r2) && view.cols.some(c => c >= m.c1 && c <= m.c2));
        for (const merge of merges) {
            if (!view.rows.includes(merge.r1)) view.rows.push(merge.r1);
            if (!view.cols.includes(merge.c1)) view.cols.push(merge.c1);
        }
        const covered = new Set();
        for (const m of merges) for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) if (r !== m.r1 || c !== m.c1) covered.add(r * 16384 + c);
        const selected = ctrl._sel.ranges;
        const prefix = ctrl._element.id + "-cell";
        const keep = new Set();
        const fragment = document.createDocumentFragment();
        for (const row of view.rows) {
            const size = this.rows.sizeOf(row);
            if (!size) continue;
            keep.add(row);
            let entry = this._rows.get(row);
            if (!entry) {
                entry = this._createRow(row);
                this._rows.set(row, entry);
                fragment.appendChild(entry.el);
            }
            const frozenRow = row < sheet.frozenRows;
            entry.el.style.top = this.rowY(row) + "px";
            entry.el.style.height = size + "px";
            entry.el.classList.toggle("wx-spreadsheet-frozen-row", frozenRow);
            entry.scroll.style.transform = "translateX(" + (-this._scrollX) + "px)";
            entry.header.style.width = this.headerWidth + "px";
            entry.header.classList.toggle("wx-spreadsheet-header-active", selected.some(r => row >= r.r1 && row <= r.r2));
            this._markHidden(entry.header, this.rows, row);
            this._renderCells(entry, row, view.cols, covered, merges, prefix);
        }
        for (const [row, entry] of this._rows) {
            if (!keep.has(row)) { entry.el.remove(); this._rows.delete(row); }
        }
        if (fragment.childNodes.length) this.body.appendChild(fragment);
        this._renderHeaders(view.cols);
        this.renderOverlay();
        this.viewport.setAttribute("aria-activedescendant", prefix + "-" + active.row + "-" + active.col);
    }

    /**
     * Creates the element of a row.
     * @param {number} row - The row.
     * @returns {object} The row entry { el, header, scroll, cells }.
     */
    _createRow(row) {
        const el = document.createElement("div");
        el.className = "wx-spreadsheet-row";
        el.setAttribute("role", "row");
        el.setAttribute("aria-rowindex", String(row + 2));
        const header = document.createElement("div");
        header.className = "wx-spreadsheet-rowheader";
        header.setAttribute("role", "rowheader");
        header.setAttribute("aria-colindex", "1");
        header.textContent = String(row + 1);
        const scroll = document.createElement("div");
        scroll.className = "wx-spreadsheet-row-scroll";
        scroll.setAttribute("role", "presentation");
        el.appendChild(header);
        el.appendChild(scroll);
        return { el, header, scroll, cells: new Map(), row };
    }

    /**
     * Renders the cells of one row.
     * @param {object} entry - The row entry.
     * @param {number} row - The row.
     * @param {Array<number>} cols - The visible columns.
     * @param {Set<number>} covered - The cells hidden under merges.
     * @param {Array<object>} merges - The visible merges.
     * @param {string} prefix - The id prefix of the cells.
     */
    _renderCells(entry, row, cols, covered, merges, prefix) {
        const ctrl = this.ctrl, sheet = this.sheet;
        const keep = new Set();
        const sorted = cols.slice().sort((a, b) => a - b);
        for (const col of sorted) {
            const width = this.cols.sizeOf(col);
            if (!width || covered.has(row * 16384 + col)) continue;
            keep.add(col);
            let el = entry.cells.get(col);
            const frozen = col < sheet.frozenCols;
            if (!el) {
                el = document.createElement("div");
                el.className = "wx-spreadsheet-cell";
                el.setAttribute("role", "gridcell");
                el.setAttribute("aria-colindex", String(col + 2));
                el.id = prefix + "-" + row + "-" + col;
                const text = document.createElement("div");
                text.className = "wx-spreadsheet-text";
                el.appendChild(text);
                el._text = text;
                entry.cells.set(col, el);
            }
            const parent = frozen ? entry.el : entry.scroll;
            if (el.parentNode !== parent) parent.appendChild(el);
            const merge = merges.find(m => m.r1 === row && m.c1 === col);
            let w = width, h = this.rows.sizeOf(row);
            if (merge) {
                w = this.cols.offset(merge.c2 + 1) - this.cols.offset(merge.c1);
                h = this.rows.offset(merge.r2 + 1) - this.rows.offset(merge.r1);
            }
            const left = this.headerWidth + this.cols.offset(col);
            const geometry = left + "," + w + "," + h + "," + frozen;
            if (el._geometry !== geometry) {
                el._geometry = geometry;
                el.style.left = left + "px";
                el.style.width = w + "px";
                el.style.height = h + "px";
                el.classList.toggle("wx-spreadsheet-frozen", frozen);
                el.classList.toggle("wx-spreadsheet-merged", !!merge);
            }
            this._paintCell(el, row, col, w, sorted);
            const selected = ctrl._sel.ranges.some(r => row >= r.r1 && row <= r.r2 && col >= r.c1 && col <= r.c2);
            if (el._selected !== selected) { el._selected = selected; el.setAttribute("aria-selected", String(selected)); }
        }
        for (const [col, el] of entry.cells) {
            if (!keep.has(col)) { el.remove(); entry.cells.delete(col); }
        }
    }

    /**
     * Writes the content and style of a cell when its signature changed.
     * @param {HTMLElement} el - The cell element.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @param {number} width - The rendered width.
     * @param {Array<number>} cols - The visible columns, sorted, for text overflow.
     */
    _paintCell(el, row, col, width, cols) {
        const ctrl = this.ctrl, sheet = this.sheet;
        const cell = sheet.getCell(row, col);
        const style = webexpress.webui.SpreadsheetModel.effectiveStyle(ctrl.model, sheet, row, col);
        const value = ctrl.engine.cellValue(sheet, row, col);
        const shown = webexpress.webui.SpreadsheetFormat.display(value, cell, style, ctrl.locale);
        // plain text that does not wrap runs over empty neighbours, as in the common spreadsheets
        let overflow = 0;
        if (shown.text && !style.wrap && (style.align ?? shown.align) === "left" && shown.kind === "text") {
            for (let next = col + 1; next < sheet.colCount && overflow < 2000; next++) {
                if (sheet.getCell(row, next) || sheet.mergeAt(row, next) || !cols.includes(next)) break;
                overflow += this.cols.sizeOf(next);
            }
        }
        const problem = value instanceof webexpress.webui.SpreadsheetError ? value.message : "";
        const signature = webexpress.webui.Ot.stable([shown.text, shown.color, shown.align, style, cell?.c?.text ?? "", cell?.t ?? "", overflow, problem, this.zoom]);
        if (el._sig === signature) return;
        el._sig = signature;
        const text = el._text;
        const type = cell?.t ? webexpress.webui.SpreadsheetTypes.get(cell.t) : null;
        const href = type?.href?.(cell.v);
        text.textContent = "";
        if (href) {
            const link = document.createElement("a");
            link.href = href; link.target = "_blank"; link.rel = "noopener noreferrer";
            link.textContent = shown.text;
            link.tabIndex = -1;
            text.appendChild(link);
        } else text.textContent = shown.text;
        const s = text.style;
        s.fontFamily = style.font ? style.font : "";
        s.fontSize = style.size ? style.size * this.zoom + "pt" : "";
        s.fontWeight = style.bold ? "bold" : "";
        s.fontStyle = style.italic ? "italic" : "";
        s.textDecoration = [style.underline ? "underline" : "", style.strike ? "line-through" : ""].filter(Boolean).join(" ");
        s.color = shown.color || style.color || (style.fill ? this.constructor.contrastText(style.fill) : "");
        s.paddingLeft = style.indent ? style.indent * 9 * this.zoom + "px" : "";
        const align = style.align ?? shown.align;
        el.setAttribute("data-align", align);
        el.setAttribute("data-valign", style.valign ?? "bottom");
        el.classList.toggle("wx-spreadsheet-wrap", !!style.wrap);
        el.classList.toggle("wx-spreadsheet-overflow", overflow > 0);
        el.classList.toggle("wx-spreadsheet-error", shown.kind === "error");
        el.classList.toggle("wx-spreadsheet-check", cell?.t === "checkbox");
        s.maxWidth = overflow > 0 ? width + overflow + "px" : "";
        el.style.backgroundColor = style.fill || "";
        el.classList.toggle("wx-spreadsheet-commented", !!cell?.c);
        const title = [problem, cell?.c ? (cell.c.author ? cell.c.author + ": " : "") + cell.c.text : ""].filter(Boolean).join("\n");
        if (title) el.setAttribute("title", title); else el.removeAttribute("title");
        let border = el._border;
        if (style.border) {
            if (!border) { border = document.createElement("div"); border.className = "wx-spreadsheet-border"; el.appendChild(border); el._border = border; }
            const widths = { thin: 1, medium: 2, thick: 3, dashed: 1, dotted: 1, double: 3 };
            for (const side of ["top", "right", "bottom", "left"]) {
                const edge = webexpress.webui.SpreadsheetModel.parseBorder(style.border[side]);
                const name = "border" + side[0].toUpperCase() + side.slice(1);
                border.style[name] = edge ? widths[edge.style] + "px " + (["dashed", "dotted", "double"].includes(edge.style) ? edge.style : "solid") + " " + (edge.color || "currentColor") : "";
            }
        } else if (border) { border.remove(); el._border = null; }
    }

    /**
     * Renders the column headers.
     * @param {Array<number>} cols - The visible columns.
     */
    _renderHeaders(cols) {
        const sheet = this.sheet, Address = webexpress.webui.SpreadsheetAddress;
        this.corner.style.width = this.headerWidth + "px";
        this.headScroll.style.transform = "translateX(" + (-this._scrollX) + "px)";
        const keep = new Set();
        const selected = this.ctrl._sel.ranges;
        for (const col of cols) {
            const width = this.cols.sizeOf(col);
            if (!width) continue;
            keep.add(col);
            let el = this._headers.get(col);
            if (!el) {
                el = document.createElement("div");
                el.className = "wx-spreadsheet-colheader";
                el.setAttribute("role", "columnheader");
                el.setAttribute("aria-colindex", String(col + 2));
                el.textContent = Address.columnName(col);
                this._headers.set(col, el);
            }
            const frozen = col < sheet.frozenCols;
            const parent = frozen ? this.headRow : this.headScroll;
            if (el.parentNode !== parent) parent.appendChild(el);
            el.style.left = this.headerWidth + this.cols.offset(col) + "px";
            el.style.width = width + "px";
            el.classList.toggle("wx-spreadsheet-frozen", frozen);
            el.classList.toggle("wx-spreadsheet-header-active", selected.some(r => col >= r.c1 && col <= r.c2));
            this._markHidden(el, this.cols, col);
        }
        for (const [col, el] of this._headers) if (!keep.has(col)) { el.remove(); this._headers.delete(col); }
    }

    /**
     * Marks the edges of a header behind which rows or columns are hidden.
     * @param {HTMLElement} el - The header.
     * @param {webexpress.webui.SpreadsheetAxis} axis - The rows or the columns.
     * @param {number} index - The row or column.
     */
    _markHidden(el, axis, index) {
        const edges = this.hiddenEdges(axis, index);
        el.classList.toggle("wx-spreadsheet-hidden-before", edges.before);
        el.classList.toggle("wx-spreadsheet-hidden-after", edges.after);
    }

    /**
     * Splits a range into the visible rectangles of the pane: up to four, one per frozen or
     * scrolled quadrant, each clipped to its quadrant and marked with the range edges it shows.
     * @param {object} range - The range { r1, c1, r2, c2 }.
     * @returns {Array<object>} The rectangles { left, top, width, height, edges }.
     */
    rangeRects(range) {
        const sheet = this.sheet, { width, height } = this.size;
        const fr = sheet.frozenRows, fc = sheet.frozenCols;
        const hw = this.headerWidth, hh = this.headerHeight;
        const frozenW = this.cols.offset(fc), frozenH = this.rows.offset(fr);
        const r2 = Math.min(range.r2, sheet.rowCount - 1), c2 = Math.min(range.c2, sheet.colCount - 1);
        const spans = (a, b, split) => {
            const out = [];
            if (a < split) out.push([a, Math.min(b, split - 1), true]);
            if (b >= split) out.push([Math.max(a, split), b, false]);
            return out;
        };
        const out = [];
        for (const [ra, rb, rowFrozen] of spans(range.r1, r2, fr)) {
            for (const [ca, cb, colFrozen] of spans(range.c1, c2, fc)) {
                const x1 = this.colX(ca), x2 = this.colX(cb) + this.cols.sizeOf(cb);
                const y1 = this.rowY(ra), y2 = this.rowY(rb) + this.rows.sizeOf(rb);
                const minX = colFrozen ? hw : hw + frozenW, maxX = colFrozen ? hw + frozenW : width;
                const minY = rowFrozen ? hh : hh + frozenH, maxY = rowFrozen ? hh + frozenH : height;
                const left = Math.max(x1, minX), right = Math.min(x2, maxX), top = Math.max(y1, minY), bottom = Math.min(y2, maxY);
                if (right <= left || bottom <= top) continue;
                out.push({
                    left, top, width: right - left, height: bottom - top,
                    edges: { left: ca === range.c1 && x1 >= minX, right: cb === c2 && x2 <= maxX, top: ra === range.r1 && y1 >= minY, bottom: rb === r2 && y2 <= maxY }
                });
            }
        }
        return out;
    }

    /**
     * Returns the rectangle of a cell in the pane, merged cells covering their whole merge.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @returns {{left: number, top: number, width: number, height: number}} The rectangle.
     */
    cellRect(row, col) {
        const merge = this.sheet.mergeAt(row, col);
        const range = merge ?? { r1: row, c1: col, r2: row, c2: col };
        return {
            left: this.colX(range.c1), top: this.rowY(range.r1),
            width: this.cols.offset(range.c2 + 1) - this.cols.offset(range.c1),
            height: this.rows.offset(range.r2 + 1) - this.rows.offset(range.r1)
        };
    }

    /**
     * Returns the rectangle of a cell in viewport coordinates, for elements outside the grid.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @returns {{left: number, top: number, width: number, height: number}} The rectangle.
     */
    clientRect(row, col) {
        const box = this.pane.getBoundingClientRect(), rect = this.cellRect(row, col);
        return { left: box.left + rect.left, top: box.top + rect.top, width: rect.width, height: rect.height };
    }

    /**
     * Finds what lies under a pointer position.
     * @param {number} clientX - The x position in viewport coordinates.
     * @param {number} clientY - The y position in viewport coordinates.
     * @returns {{area: string, row: number, col: number, edge?: number}} The area ("cell",
     * "colheader", "rowheader", "corner", "colresize", "rowresize") and its row and column.
     */
    hit(clientX, clientY) {
        const box = this.pane.getBoundingClientRect();
        const x = clientX - box.left, y = clientY - box.top;
        const sheet = this.sheet, hw = this.headerWidth, hh = this.headerHeight;
        const colAt = (px) => {
            const frozenW = this.cols.offset(sheet.frozenCols);
            const content = px - hw < frozenW ? px - hw : px - hw + this._scrollX;
            return Math.min(sheet.colCount - 1, this.cols.at(Math.max(0, content)));
        };
        const rowAt = (py) => {
            const frozenH = this.rows.offset(sheet.frozenRows);
            const content = py - hh < frozenH ? py - hh : py - hh + this._scrollY;
            return Math.min(sheet.rowCount - 1, this.rows.at(Math.max(0, content)));
        };
        const zone = this.constructor.RESIZE_ZONE;
        if (y < hh && x < hw) return { area: "corner", row: 0, col: 0 };
        if (y < hh) {
            const col = colAt(x);
            const edge = this._unhideEdge(this.cols, col, x - this.colX(col));
            if (edge) return { area: "colunhide", row: 0, col, edge };
            const right = this.colX(col) + this.cols.sizeOf(col);
            if (Math.abs(x - right) <= zone) return { area: "colresize", row: 0, col };
            if (x - this.colX(col) <= zone && col > 0) return { area: "colresize", row: 0, col: col - 1 };
            return { area: "colheader", row: 0, col };
        }
        if (x < hw) {
            const row = rowAt(y);
            const edge = this._unhideEdge(this.rows, row, y - this.rowY(row));
            if (edge) return { area: "rowunhide", row, col: 0, edge };
            const bottom = this.rowY(row) + this.rows.sizeOf(row);
            if (Math.abs(y - bottom) <= zone) return { area: "rowresize", row, col: 0 };
            if (y - this.rowY(row) <= zone && row > 0) return { area: "rowresize", row: row - 1, col: 0 };
            return { area: "rowheader", row, col: 0 };
        }
        return { area: "cell", row: rowAt(y), col: colAt(x) };
    }

    /**
     * Tells which hidden neighbours a visible row or column marks in its header. The block before
     * it is marked on its leading edge. The block after it is marked only when it runs to the end
     * of the sheet, since otherwise the next visible header marks it and the trailing edge stays
     * free for resizing.
     * @param {webexpress.webui.SpreadsheetAxis} axis - The rows or the columns.
     * @param {number} index - The row or column.
     * @returns {{before: boolean, after: boolean}} The marked edges.
     */
    hiddenEdges(axis, index) {
        const end = axis.offset(index + 1);
        return {
            before: index > 0 && axis.sizeOf(index - 1) === 0,
            after: index + 1 < axis.count && axis.sizeOf(index) > 0 && end === axis.total()
        };
    }

    /**
     * Finds the marker of hidden neighbours under a position in a header.
     * @param {webexpress.webui.SpreadsheetAxis} axis - The rows or the columns.
     * @param {number} index - The row or column under the position.
     * @param {number} into - The distance from where the header starts.
     * @returns {number} -1 for the marker before, 1 for the one after, 0 for none.
     */
    _unhideEdge(axis, index, into) {
        const zone = this.constructor.UNHIDE_ZONE, edges = this.hiddenEdges(axis, index);
        if (edges.before && into <= zone) return -1;
        if (edges.after && axis.sizeOf(index) - into <= zone) return 1;
        return 0;
    }

    /**
     * Scrolls the least distance that brings a cell into view; frozen cells are always visible.
     * @param {number} row - The row.
     * @param {number} col - The column.
     */
    scrollToCell(row, col) {
        this._readScroll();
        const sheet = this.sheet, { width, height } = this.size;
        if (row >= sheet.frozenRows && row < sheet.rowCount) {
            const top = this.rows.offset(row) - this.rows.offset(sheet.frozenRows), bottom = this.rows.offset(row + 1) - this.rows.offset(sheet.frozenRows);
            const viewH = height - this.headerHeight - this.rows.offset(sheet.frozenRows);
            let next = this._scrollY;
            if (top < next) next = top; else if (bottom > next + viewH) next = bottom - viewH;
            if (next !== this._scrollY) this._setScrollY(Math.max(0, next));
        }
        if (col >= sheet.frozenCols && col < sheet.colCount) {
            const left = this.cols.offset(col) - this.cols.offset(sheet.frozenCols), right = this.cols.offset(col + 1) - this.cols.offset(sheet.frozenCols);
            const viewW = width - this.headerWidth - this.cols.offset(sheet.frozenCols);
            let next = this._scrollX;
            if (left < next) next = left; else if (right > next + viewW) next = right - viewW;
            if (next !== this._scrollX) { this.viewport.scrollLeft = Math.max(0, next); this._scrollX = Math.max(0, next); }
        }
    }

    /**
     * Scrolls vertically to a content position, converting it for scaled sheets.
     * @param {number} y - The content position.
     */
    _setScrollY(y) {
        const { height } = this.size;
        const ratio = this._cssHeight > height && this._fullHeight > this._cssHeight ? (this._fullHeight - height) / (this._cssHeight - height) : 1;
        this.viewport.scrollTop = y / ratio;
        this._scrollY = y;
    }

    /**
     * Returns how many rows a page holds, for Page Up and Page Down.
     * @returns {number} The rows per page.
     */
    pageRows() {
        const { height } = this.size;
        return Math.max(1, Math.floor((height - this.headerHeight - this.rows.offset(this.sheet.frozenRows)) / (this.constructor.ROW_HEIGHT * this.zoom)) - 1);
    }

    /**
     * Returns how many columns a page holds.
     * @returns {number} The columns per page.
     */
    pageCols() {
        const { width } = this.size;
        return Math.max(1, Math.floor((width - this.headerWidth - this.cols.offset(this.sheet.frozenCols)) / (this.constructor.COL_WIDTH * this.zoom)) - 1);
    }

    /**
     * Renders the overlays: selection, active cell, fill handle, copy marquee, references of the
     * formula being edited, previews of a drag and the selections of other users.
     */
    renderOverlay() {
        const ctrl = this.ctrl, layer = this.overlay;
        layer.textContent = "";
        const add = (className, rect, edges, color, label) => {
            const el = document.createElement("div");
            el.className = className;
            el.style.left = rect.left + "px"; el.style.top = rect.top + "px";
            el.style.width = rect.width + "px"; el.style.height = rect.height + "px";
            if (edges) for (const side of ["left", "right", "top", "bottom"]) if (!edges[side]) el.style["border" + side[0].toUpperCase() + side.slice(1) + "Width"] = "0";
            if (color) { el.style.borderColor = color; el.style.setProperty("--wx-spreadsheet-user", color); }
            if (label) {
                const tag = document.createElement("span");
                tag.className = "wx-spreadsheet-user-label";
                tag.textContent = label;
                if (color) tag.style.backgroundColor = color;
                el.appendChild(tag);
            }
            layer.appendChild(el);
            return el;
        };
        const selection = ctrl._sel;
        const multiple = selection.ranges.length > 1 || selection.ranges.some(r => r.r1 !== r.r2 || r.c1 !== r.c2);
        if (multiple) for (const range of selection.ranges) for (const rect of this.rangeRects(range)) add("wx-spreadsheet-selection", rect, rect.edges);
        const active = this.sheet.mergeAt(selection.active.row, selection.active.col) ?? { r1: selection.active.row, c1: selection.active.col, r2: selection.active.row, c2: selection.active.col };
        for (const rect of this.rangeRects(active)) add("wx-spreadsheet-active", rect, rect.edges);
        const last = selection.ranges[selection.ranges.length - 1];
        if (last && !ctrl._editing && !ctrl.readOnly) {
            const rects = this.rangeRects(last).filter(r => r.edges.right && r.edges.bottom);
            for (const rect of rects) {
                const handle = add("wx-spreadsheet-fill-handle", { left: rect.left + rect.width - 4, top: rect.top + rect.height - 4, width: 7, height: 7 });
                handle.setAttribute("data-handle", "fill");
            }
            if (ctrl._touch) {
                for (const [corner, rect] of [["start", this.rangeRects({ r1: last.r1, c1: last.c1, r2: last.r1, c2: last.c1 })[0]], ["end", this.rangeRects({ r1: last.r2, c1: last.c2, r2: last.r2, c2: last.c2 })[0]]]) {
                    if (!rect) continue;
                    const x = corner === "start" ? rect.left : rect.left + rect.width, y = corner === "start" ? rect.top : rect.top + rect.height;
                    const knob = add("wx-spreadsheet-touch-handle", { left: x - 9, top: y - 9, width: 18, height: 18 });
                    knob.setAttribute("data-handle", corner);
                }
            }
        }
        if (ctrl._clipboardRange?.sheet === this.sheet.id) {
            for (const rect of this.rangeRects(ctrl._clipboardRange)) add("wx-spreadsheet-marquee", rect, rect.edges);
        }
        if (ctrl._preview) for (const rect of this.rangeRects(ctrl._preview)) add("wx-spreadsheet-preview", rect, rect.edges);
        (ctrl._formulaRefs ?? []).forEach((ref, i) => {
            if (ref.sheetId !== this.sheet.id) return;
            const color = this.constructor.COLORS[i % this.constructor.COLORS.length];
            for (const rect of this.rangeRects(ref)) add("wx-spreadsheet-reference", rect, rect.edges, color);
        });
        for (const peer of ctrl._peerSelections()) {
            if (peer.sheet !== this.sheet.id) continue;
            for (const range of peer.ranges) for (const rect of this.rangeRects(range)) add("wx-spreadsheet-peer", rect, rect.edges, peer.color);
            const cell = this.rangeRects({ r1: peer.active.row, c1: peer.active.col, r2: peer.active.row, c2: peer.active.col })[0];
            if (cell) add("wx-spreadsheet-peer wx-spreadsheet-peer-active", cell, cell.edges, peer.color, peer.name);
        }
    }

    /**
     * Highlights a cell briefly, for a change another user made.
     * @param {number} row - The row.
     * @param {number} col - The column.
     * @param {string} [color] - The user's color.
     */
    flash(row, col, color) {
        const el = this._rows.get(row)?.cells.get(col);
        if (!el) return;
        el.style.setProperty("--wx-spreadsheet-user", color || "var(--wx-primary)");
        el.classList.remove("wx-spreadsheet-flash");
        void el.offsetWidth;
        el.classList.add("wx-spreadsheet-flash");
        this.ctrl.defer(() => el.classList.remove("wx-spreadsheet-flash"), 1200);
    }

    /**
     * The colors of the references of a formula being edited.
     */
    static COLORS = ["#1a73e8", "#e8710a", "#188038", "#a142f4", "#d93025", "#12b5cb", "#f538a0", "#9aa0a6"];

    /**
     * Returns a text color legible on a fill. A fill is an absolute color while the default text
     * color follows the theme, so a light fill in dark mode would otherwise carry light text.
     * @param {string} fill - The fill: #rgb, #rrggbb, #rrggbbaa, rgb() or rgba().
     * @returns {string} Dark or light text, or "" for a fill it cannot read (color names).
     */
    static contrastText(fill) {
        const text = String(fill).trim();
        let rgb = null;
        const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text);
        if (hex) {
            const digits = hex[1].length === 3 ? [...hex[1]].map(d => d + d).join("") : hex[1].slice(0, 6);
            rgb = [0, 2, 4].map(i => parseInt(digits.slice(i, i + 2), 16));
        } else {
            const fn = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(text);
            if (fn) rgb = fn.slice(1, 4).map(Number);
        }
        if (!rgb) return "";
        // relative luminance after WCAG 2.1; 0.18 is where black and white text reach equal contrast
        const [r, g, b] = rgb.map(v => { const c = Math.min(255, v) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.18 ? "#1f1f1f" : "#ffffff";
    }
};
