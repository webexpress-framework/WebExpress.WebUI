/**
 * Clipboard formats of the spreadsheet. A copy is written three times: as tab-separated text,
 * which every spreadsheet and text editor reads; as an HTML table with inline styles, which
 * Excel, Google Sheets, LibreOffice and word processors read with formatting; and as the
 * spreadsheet's own JSON, embedded in the HTML and offered as a custom format, which keeps
 * formulas, types, comments and merges exactly. Reading takes the richest format available.
 * Clipboard HTML is never inserted into the document: it is scanned by a small tokenizer, so
 * no foreign markup or script can run.
 */
webexpress.webui.SpreadsheetClipboard = class {
    /**
     * The custom format of the asynchronous clipboard api; browsers expose such formats only
     * with the "web " prefix.
     */
    static WEB_FORMAT = "web application/x-webexpress-spreadsheet";

    /**
     * The custom format of clipboard events.
     */
    static FORMAT = "application/x-webexpress-spreadsheet";

    /**
     * The last cut made on the page; a paste of that content moves it instead of copying it.
     */
    static _cut = null;

    /**
     * The last content copied on the page, the fallback when the browser denies reading the
     * clipboard to a toolbar button.
     */
    static _last = null;

    /**
     * Writes rows of texts as tab-separated values, quoting fields with tabs, line breaks or
     * quotes as the common spreadsheets expect.
     * @param {Array<Array<string>>} rows - The texts.
     * @returns {string} The text.
     */
    static toTSV(rows) { return this.toDelimited(rows, "\t"); }

    /**
     * Writes rows of texts as delimited values.
     * @param {Array<Array<string>>} rows - The texts.
     * @param {string} [delimiter=","] - The delimiter.
     * @returns {string} The text, lines separated by CRLF.
     */
    static toDelimited(rows, delimiter = ",") {
        const quote = (field) => {
            const text = String(field ?? "");
            return text.includes(delimiter) || /["\r\n]/.test(text) || (delimiter !== "\t" && /^\s|\s$/.test(text)) ? "\"" + text.replace(/"/g, "\"\"") + "\"" : text;
        };
        return rows.map(row => row.map(quote).join(delimiter)).join("\r\n");
    }

    /**
     * Parses delimited text according to RFC 4180: quoted fields may contain delimiters, line
     * breaks and doubled quotes. Without a delimiter, it is guessed from the first line.
     * @param {string} text - The text.
     * @param {string} [delimiter] - The delimiter; guessed when omitted.
     * @returns {Array<Array<string>>} The rows of fields.
     */
    static parseDelimited(text, delimiter) {
        const source = String(text ?? "").replace(/^\uFEFF/, "");
        const separator = delimiter ?? this.guessDelimiter(source);
        const rows = [];
        let row = [], field = "", quoted = false, i = 0;
        while (i < source.length) {
            const ch = source[i];
            if (quoted) {
                if (ch === "\"") {
                    if (source[i + 1] === "\"") { field += "\""; i += 2; continue; }
                    quoted = false; i++; continue;
                }
                field += ch; i++; continue;
            }
            if (ch === "\"" && field === "") { quoted = true; i++; continue; }
            if (ch === separator) { row.push(field); field = ""; i++; continue; }
            if (ch === "\r" || ch === "\n") {
                row.push(field); rows.push(row); row = []; field = "";
                i += ch === "\r" && source[i + 1] === "\n" ? 2 : 1;
                continue;
            }
            field += ch; i++;
        }
        if (field !== "" || row.length) { row.push(field); rows.push(row); }
        return rows;
    }

    /**
     * Guesses the delimiter of delimited text from its first line: a tab wins, then whichever of
     * semicolon and comma occurs more often outside quotes.
     * @param {string} text - The text.
     * @returns {string} The delimiter.
     */
    static guessDelimiter(text) {
        const line = String(text).split(/\r?\n/, 1)[0].replace(/"[^"]*"/g, "");
        if (line.includes("\t")) return "\t";
        const semicolons = (line.match(/;/g) || []).length, commas = (line.match(/,/g) || []).length;
        return semicolons > commas ? ";" : ",";
    }

    /**
     * Escapes text for HTML.
     * @param {string} text - The text.
     * @returns {string} The escaped text.
     */
    static escape(text) {
        return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    /**
     * Writes a copied block as an HTML table with inline styles and the own JSON embedded.
     * @param {object} payload - The own clipboard payload.
     * @param {Array<Array<object>>} shown - What each cell shows: { text, style, align }.
     * @returns {string} The HTML.
     */
    static toHTML(payload, shown) {
        const covered = new Set();
        for (const merge of payload.merges ?? []) {
            for (let r = merge.r1; r <= merge.r2; r++) for (let c = merge.c1; c <= merge.c2; c++) if (r !== merge.r1 || c !== merge.c1) covered.add(r + ":" + c);
        }
        let html = "<table data-wx-spreadsheet=\"" + this.escape(JSON.stringify(payload)) + "\" style=\"border-collapse:collapse\">";
        shown.forEach((row, r) => {
            html += "<tr>";
            row.forEach((cell, c) => {
                if (covered.has(r + ":" + c)) return;
                const merge = (payload.merges ?? []).find(m => m.r1 === r && m.c1 === c);
                const span = merge ? (merge.r2 > merge.r1 ? " rowspan=\"" + (merge.r2 - merge.r1 + 1) + "\"" : "") + (merge.c2 > merge.c1 ? " colspan=\"" + (merge.c2 - merge.c1 + 1) + "\"" : "") : "";
                const css = this.styleToCss(cell.style, cell.align);
                const source = payload.cells[r]?.[c];
                const formula = source?.f ? " data-formula=\"" + this.escape(source.f) + "\"" : "";
                html += "<td" + span + formula + (css ? " style=\"" + this.escape(css) + "\"" : "") + ">" + this.escape(cell.text).replace(/\r?\n/g, "<br>") + "</td>";
            });
            html += "</tr>";
        });
        return html + "</table>";
    }

    /**
     * Converts a cell style into inline css for the HTML clipboard format.
     * @param {object} style - The effective style.
     * @param {string} [align] - The alignment the value takes without an explicit one.
     * @returns {string} The css.
     */
    static styleToCss(style, align) {
        const css = [];
        if (!style) style = {};
        if (style.font) css.push("font-family:" + style.font);
        if (style.size) css.push("font-size:" + style.size + "pt");
        if (style.bold) css.push("font-weight:bold");
        if (style.italic) css.push("font-style:italic");
        const decoration = [style.underline ? "underline" : "", style.strike ? "line-through" : ""].filter(Boolean).join(" ");
        if (decoration) css.push("text-decoration:" + decoration);
        if (style.color) css.push("color:" + style.color);
        if (style.fill) css.push("background-color:" + style.fill);
        if (style.align || align && align !== "left") css.push("text-align:" + (style.align || align));
        if (style.valign) css.push("vertical-align:" + style.valign);
        if (style.wrap) css.push("white-space:normal");
        if (style.nf) css.push("mso-number-format:\"" + style.nf.replace(/"/g, "\\\"") + "\"");
        for (const side of ["top", "right", "bottom", "left"]) {
            const edge = webexpress.webui.SpreadsheetModel.parseBorder(style.border?.[side]);
            if (edge) css.push("border-" + side + ":" + ({ thin: "1px solid", medium: "2px solid", thick: "3px solid", dashed: "1px dashed", dotted: "1px dotted", double: "3px double" }[edge.style]) + " " + (edge.color || "#000000"));
        }
        return css.join(";");
    }

    /**
     * Reads a style from inline css, as Excel, Google Sheets and browsers write it.
     * @param {string} css - The css declarations.
     * @returns {object|null} The style, validated.
     */
    static cssToStyle(css) {
        const style = {};
        const decls = {};
        for (const part of String(css ?? "").split(";")) {
            const at = part.indexOf(":");
            if (at < 0) continue;
            decls[part.slice(0, at).trim().toLowerCase()] = part.slice(at + 1).trim();
        }
        const weight = decls["font-weight"];
        if (weight && (/bold/i.test(weight) || Number(weight) >= 600)) style.bold = true;
        if (/italic/i.test(decls["font-style"] ?? "")) style.italic = true;
        const decoration = (decls["text-decoration"] ?? "") + " " + (decls["text-decoration-line"] ?? "");
        if (/underline/i.test(decoration)) style.underline = true;
        if (/line-through/i.test(decoration)) style.strike = true;
        const color = this._color(decls.color);
        if (color) style.color = color;
        const fill = this._color(decls["background-color"] ?? decls.background?.split(/\s+/)[0]);
        if (fill && !/^(transparent|#ffffff|#fff|white)$/i.test(fill)) style.fill = fill;
        const align = (decls["text-align"] ?? "").toLowerCase();
        if (["left", "center", "right", "justify"].includes(align)) style.align = align;
        const valign = (decls["vertical-align"] ?? "").toLowerCase();
        if (["top", "bottom"].includes(valign)) style.valign = valign;
        else if (valign === "middle") style.valign = "middle";
        const family = decls["font-family"]?.split(",")[0]?.replace(/["']/g, "").trim();
        if (family && /^[A-Za-z0-9 _-]{1,60}$/.test(family)) style.font = family;
        const size = /^([\d.]+)(pt|px)$/.exec(decls["font-size"] ?? "");
        if (size) style.size = Math.round((size[2] === "px" ? Number(size[1]) * 0.75 : Number(size[1])) * 2) / 2;
        // wrapping is only taken when said explicitly; plain "normal" is every browser's default
        const space = decls["white-space"] ?? "";
        if (/pre-wrap|break-spaces/i.test(space) || /^normal$/i.test(space) && /break-word/i.test(decls["overflow-wrap"] ?? decls["word-wrap"] ?? "")) style.wrap = true;
        const nf = decls["mso-number-format"];
        if (nf) {
            const code = nf.replace(/^["']|["']$/g, "").replace(/\\(.)/g, "$1");
            if (code && !/^@$/.test(code) && !/^(General|Standard)$/i.test(code)) style.nf = code;
        }
        const border = {};
        for (const side of ["top", "right", "bottom", "left"]) {
            const value = decls["border-" + side] ?? decls.border;
            const edge = this._border(value);
            if (edge) border[side] = edge;
        }
        if (Object.keys(border).length) style.border = border;
        return webexpress.webui.SpreadsheetModel.sanitizeStyle(style);
    }

    /**
     * Reads a css color, accepting the forms the model accepts.
     * @param {string} value - The css value.
     * @returns {string|null} The color.
     */
    static _color(value) {
        const text = String(value ?? "").trim().replace(/\s*!important$/, "");
        if (!text) return null;
        const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(text);
        if (rgb) {
            if (rgb[4] !== undefined && Number(rgb[4]) === 0) return null;
            return "#" + [rgb[1], rgb[2], rgb[3]].map(n => Math.min(255, Number(n)).toString(16).padStart(2, "0")).join("");
        }
        return webexpress.webui.SpreadsheetModel.isColor(text) ? text.toLowerCase() : null;
    }

    /**
     * Reads a css border shorthand as a border edge.
     * @param {string} value - The css value, such as "1px solid #000".
     * @returns {string|null} The edge, such as "thin #000000".
     */
    static _border(value) {
        if (!value || /none|hidden/i.test(value)) return null;
        const width = /(\d*\.?\d+)px|(\d*\.?\d+)pt|\b(thin|medium|thick)\b/i.exec(value);
        const px = width ? (width[1] ? Number(width[1]) : width[2] ? Number(width[2]) / 0.75 : { thin: 1, medium: 2, thick: 3 }[width[3].toLowerCase()]) : 1;
        if (px <= 0) return null;
        const kind = /\b(dashed|dotted|double)\b/i.exec(value)?.[1]?.toLowerCase();
        const style = kind ?? (px >= 3 ? "thick" : px >= 2 ? "medium" : "thin");
        const color = this._color(/(#[0-9a-f]{3,8}|rgba?\([^)]*\)|\b[a-z]{3,20}\b(?=\s*$))/i.exec(value.replace(/\b(solid|dashed|dotted|double|thin|medium|thick|none)\b/gi, "").trim())?.[1]);
        return style + (color ? " " + color : "");
    }

    /**
     * Decodes the character references of HTML text.
     * @param {string} text - The text.
     * @returns {string} The decoded text.
     */
    static decode(text) {
        const named = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " };
        return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, ref) => {
            if (ref[0] === "#") {
                const code = ref[1].toLowerCase() === "x" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
                return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
            }
            return named[ref.toLowerCase()] ?? all;
        });
    }

    /**
     * Reads the attributes of a start tag.
     * @param {string} tag - The tag text.
     * @returns {object} The attributes by lowercase name.
     */
    static _attributes(tag) {
        const out = {};
        const regex = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let match;
        const body = tag.replace(/^<\s*[^\s>]+/, "");
        while ((match = regex.exec(body))) out[match[1].toLowerCase()] = this.decode(match[2] ?? match[3] ?? match[4] ?? "");
        return out;
    }

    /**
     * Reads the first table of clipboard HTML. Rules of a style block - Excel styles its cells
     * through classes - are applied before the inline style of each cell.
     * @param {string} html - The HTML.
     * @returns {{payload: object|null, rows: Array<Array<object>>}|null} The own payload, if the
     * table carries one, and the cells { text, style, colspan, rowspan, value, formula, r1c1 };
     * null if there is no table.
     */
    static parseHTML(html) {
        const source = String(html ?? "");
        const start = source.search(/<table[\s>]/i);
        if (start < 0) return null;
        const classes = {};
        for (const block of source.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? []) {
            const css = block.replace(/<\/?style[^>]*>/gi, "").replace(/<!--|-->/g, "");
            for (const rule of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
                for (const selector of rule[1].split(",")) {
                    const name = /\.([\w-]+)\s*$/.exec(selector.trim())?.[1];
                    if (name) classes[name] = (classes[name] ? classes[name] + ";" : "") + rule[2];
                }
            }
        }
        const tableTag = /<table[^>]*>/i.exec(source.slice(start))[0];
        const tableAttrs = this._attributes(tableTag);
        let payload = null;
        if (tableAttrs["data-wx-spreadsheet"]) {
            try { payload = JSON.parse(tableAttrs["data-wx-spreadsheet"]); } catch { payload = null; }
        }
        const end = source.search(/<\/table>/i);
        const body = source.slice(start + tableTag.length, end < 0 ? undefined : end);
        const rows = [];
        const rowRegex = /<tr[^>]*>([\s\S]*?)(?=<tr[\s>]|<\/tbody|<\/thead|<\/tfoot|$)/gi;
        let rowMatch;
        while ((rowMatch = rowRegex.exec(body))) {
            const cells = [];
            const cellRegex = /<(td|th)(\s[^>]*)?>([\s\S]*?)(?=<td[\s>]|<th[\s>]|<\/tr|$)/gi;
            let cellMatch;
            while ((cellMatch = cellRegex.exec(rowMatch[1]))) {
                const attrs = this._attributes("<td" + (cellMatch[2] ?? "") + ">");
                const inner = cellMatch[3].replace(/<\/t[dh]>[\s\S]*$/i, "");
                const text = this.decode(inner.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div)>\s*(?=<(p|div)[\s>])/gi, "\n").replace(/<[^>]+>/g, "")).replace(/\u00A0/g, " ").replace(/^\s*\n|\n\s*$/g, "");
                const css = (attrs.class ?? "").split(/\s+/).map(name => classes[name] ?? "").join(";") + ";" + (attrs.style ?? "");
                const cell = {
                    text: /\n/.test(text) ? text : text.replace(/\s+/g, " ").trim(),
                    style: this.cssToStyle(css),
                    colspan: Math.max(1, Math.min(1000, parseInt(attrs.colspan, 10) || 1)),
                    rowspan: Math.max(1, Math.min(10000, parseInt(attrs.rowspan, 10) || 1))
                };
                // Excel writes the exact number and the formula as attributes of its own namespace
                if (attrs["x:num"] !== undefined && attrs["x:num"] !== "" && Number.isFinite(Number(attrs["x:num"]))) cell.value = Number(attrs["x:num"]);
                else if (attrs["x:bool"] !== undefined) cell.value = /^true$/i.test(attrs["x:bool"]);
                if (attrs["x:fmla"]) cell.formula = attrs["x:fmla"];
                if (attrs["data-formula"]?.startsWith("=")) cell.formula = attrs["data-formula"];
                // Google Sheets writes the typed value as JSON and formulas in relative R1C1 form
                if (attrs["data-sheets-value"]) {
                    try {
                        const value = JSON.parse(attrs["data-sheets-value"]);
                        if (value[1] === 3 && Number.isFinite(value[3])) cell.value = value[3];
                        else if (value[1] === 4 && typeof value[4] === "boolean") cell.value = value[4];
                        else if (value[1] === 2 && typeof value[2] === "string") cell.value = value[2];
                    } catch { /* an unreadable value leaves the shown text */ }
                }
                if (attrs["data-sheets-formula"]?.startsWith("=")) cell.r1c1 = attrs["data-sheets-formula"];
                cells.push(cell);
            }
            rows.push(cells);
        }
        return { payload, rows };
    }

    /**
     * Converts a formula in relative R1C1 notation, as Google Sheets copies it, to A1 notation
     * for a cell position.
     * @param {string} formula - The formula, such as "=R[0]C[-2]*2".
     * @param {number} row - The row the formula is placed in.
     * @param {number} col - The column the formula is placed in.
     * @returns {string|null} The formula in A1 notation, or null if a reference falls off the grid.
     */
    static fromR1C1(formula, row, col) {
        const Address = webexpress.webui.SpreadsheetAddress;
        let out = "", failed = false;
        const source = String(formula);
        for (let i = 0; i < source.length;) {
            if (source[i] === "\"") {
                const end = source.indexOf("\"", i + 1);
                out += source.slice(i, end < 0 ? undefined : end + 1);
                i = end < 0 ? source.length : end + 1;
                continue;
            }
            const match = /^R(\[-?\d+\]|\d+)?C(\[-?\d+\]|\d+)?(?![A-Za-z0-9_(])/.exec(source.slice(i));
            if (match && !/[A-Za-z0-9_.]/.test(source[i - 1] ?? "")) {
                const axis = (part, base) => {
                    if (part === undefined) return { index: base, abs: false };
                    if (part.startsWith("[")) return { index: base + Number(part.slice(1, -1)), abs: false };
                    return { index: Number(part) - 1, abs: true };
                };
                const r = axis(match[1], row), c = axis(match[2], col);
                if (r.index < 0 || c.index < 0 || r.index >= Address.MAX_ROWS || c.index >= Address.MAX_COLS) failed = true;
                else out += Address.cellName(r.index, c.index, r.abs, c.abs);
                i += match[0].length;
                continue;
            }
            out += source[i++];
        }
        return failed ? null : out;
    }

    /**
     * Writes content to the system clipboard through the asynchronous api, with the own format
     * where the browser allows custom formats and plain text where it allows nothing more.
     * @param {{text: string, html: string, json: string}} data - The formats.
     * @returns {Promise<boolean>} True if the clipboard was written.
     */
    static async write(data) {
        this._last = data;
        const clipboard = globalThis.navigator?.clipboard;
        if (!clipboard) return false;
        if (typeof clipboard.write === "function" && typeof globalThis.ClipboardItem === "function") {
            const blob = (text, type) => new Blob([text], { type });
            const attempts = [
                { "text/plain": blob(data.text, "text/plain"), "text/html": blob(data.html, "text/html"), [this.WEB_FORMAT]: blob(data.json, this.WEB_FORMAT) },
                { "text/plain": blob(data.text, "text/plain"), "text/html": blob(data.html, "text/html") }
            ];
            for (const items of attempts) {
                try { await clipboard.write([new ClipboardItem(items)]); return true; } catch { /* the next attempt asks for less */ }
            }
        }
        try { await clipboard.writeText(data.text); return true; } catch { return false; }
    }

    /**
     * Reads the system clipboard through the asynchronous api. When the browser refuses, the
     * last content copied on this page is returned, so the paste button still works inside the
     * page.
     * @returns {Promise<{text: string, html: string, json: string}|null>} The formats found.
     */
    static async read() {
        const clipboard = globalThis.navigator?.clipboard;
        const result = { text: "", html: "", json: "" };
        try {
            if (typeof clipboard?.read === "function") {
                for (const item of await clipboard.read()) {
                    for (const type of item.types) {
                        const text = await (await item.getType(type)).text();
                        if (type === "text/plain") result.text = text;
                        else if (type === "text/html") result.html = text;
                        else if (type === this.WEB_FORMAT || type === this.FORMAT) result.json = text;
                    }
                }
                return result;
            }
            if (typeof clipboard?.readText === "function") { result.text = await clipboard.readText(); return result; }
        } catch { /* reading needs a permission the page may not have */ }
        return this._last ? { ...this._last } : null;
    }

    /**
     * Reads the formats of a clipboard event or a drop.
     * @param {DataTransfer} transfer - The data transfer.
     * @returns {{text: string, html: string, json: string}} The formats.
     */
    static fromTransfer(transfer) {
        const get = type => { try { return transfer?.getData(type) ?? ""; } catch { return ""; } };
        return { text: get("text/plain"), html: get("text/html"), json: get(this.FORMAT) };
    }
};
