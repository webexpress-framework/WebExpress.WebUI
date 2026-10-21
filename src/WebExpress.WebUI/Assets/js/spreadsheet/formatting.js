/**
 * Plugin for cell formatting, the counterpart of the editor's formatting plugin: clipboard,
 * fonts, emphasis, colors, borders, alignment, wrapping, merging, number formats and format
 * templates. Every button runs a command of the spreadsheet, so the same actions are reachable
 * through shortcuts and the api.
 */
webexpress.webui.SpreadsheetPlugins.register("formatting", 0, {
    /**
     * The fonts offered; the first entry restores the default font.
     */
    FONTS: ["", "Arial", "Calibri", "Cambria", "Courier New", "Georgia", "Segoe UI", "Tahoma", "Times New Roman", "Verdana"],

    /**
     * The font sizes offered, in points.
     */
    SIZES: [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48],

    /**
     * Sets up the plugin.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     * @returns {Function} The cleanup.
     */
    init(ctrl) {
        return () => ctrl._formattingColors?.forEach(control => control.destroy?.());
    },

    /**
     * Creates the formatting part of the toolbar.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     * @returns {HTMLElement} The toolbar section.
     */
    createToolbar(ctrl) {
        const t = (key, fallback) => ctrl.t(key, fallback);
        const section = document.createElement("div");
        section.className = "wx-spreadsheet-format-toolbar";
        const group = (...children) => {
            const el = document.createElement("div");
            el.className = "wx-spreadsheet-btn-group";
            el.append(...children);
            return el;
        };
        const fragment = document.createDocumentFragment();
        fragment.appendChild(group(
            ctrl.createButton({ command: "cut", icon: "scissors", label: t("cut", "Cut") }),
            ctrl.createButton({ command: "copy", icon: "copy", label: t("copy", "Copy") }),
            ctrl.createButton({ command: "paste", icon: "paste", label: t("paste", "Paste") }),
            ctrl.createButton({ command: "formatpainter", icon: "paint-roller", label: t("formatpainter", "Format painter") })
        ));
        fragment.appendChild(ctrl.createSeparator());
        const font = ctrl.createMenu({
            text: t("font.default", "Default"), label: t("font", "Font"), className: "wx-spreadsheet-font",
            items: this.FONTS.map(name => ({ label: name || t("font.default", "Default"), command: "font", value: name, render: button => { if (name) button.style.fontFamily = name; } }))
        });
        const size = ctrl.createMenu({
            text: "10", label: t("size", "Font size"), className: "wx-spreadsheet-size",
            items: [{ label: t("font.default", "Default"), command: "size", value: "" }, ...this.SIZES.map(points => ({ label: String(points), command: "size", value: String(points) }))]
        });
        fragment.appendChild(group(font, size));
        fragment.appendChild(ctrl.createSeparator());
        fragment.appendChild(group(
            ctrl.createButton({ command: "bold", icon: "bold", label: t("bold", "Bold") + " (Ctrl+B)" }),
            ctrl.createButton({ command: "italic", icon: "italic", label: t("italic", "Italic") + " (Ctrl+I)" }),
            ctrl.createButton({ command: "underline", icon: "underline", label: t("underline", "Underline") + " (Ctrl+U)" }),
            ctrl.createButton({ command: "strike", icon: "strikethrough", label: t("strike", "Strikethrough") }),
            this._color(ctrl, "color", "font", t("color", "Text color")),
            this._color(ctrl, "fill", "fill-drip", t("fill", "Fill color"))
        ));
        fragment.appendChild(ctrl.createSeparator());
        fragment.appendChild(group(
            ctrl.createMenu({
                icon: "border-all", label: t("border", "Borders"),
                items: [
                    { label: t("border.all", "All borders"), icon: "border-all", command: "border", value: "all" },
                    { label: t("border.outer", "Outside borders"), icon: "border-top-left", command: "border", value: "outer" },
                    { label: t("border.inner", "Inside borders"), command: "border", value: "inner" },
                    { label: t("border.top", "Top border"), command: "border", value: "top" },
                    { label: t("border.bottom", "Bottom border"), command: "border", value: "bottom" },
                    { label: t("border.left", "Left border"), command: "border", value: "left" },
                    { label: t("border.right", "Right border"), command: "border", value: "right" },
                    { label: t("border.thick", "Thick outside border"), onClick: () => ctrl.setBorder(null, "outer", "thick") },
                    { label: t("border.double", "Double bottom border"), onClick: () => ctrl.setBorder(null, "bottom", "double") },
                    { separator: true },
                    { label: t("border.none", "No border"), icon: "border-none", command: "border", value: "none" }
                ]
            }),
            ctrl.createButton({ command: "merge", icon: "merge-cell", label: t("merge", "Merge and center") })
        ));
        fragment.appendChild(ctrl.createSeparator());
        fragment.appendChild(group(
            ctrl.createButton({ command: "align", value: "left", icon: "align-left", label: t("align.left", "Align left") }),
            ctrl.createButton({ command: "align", value: "center", icon: "align-center", label: t("align.center", "Center") }),
            ctrl.createButton({ command: "align", value: "right", icon: "align-right", label: t("align.right", "Align right") }),
            ctrl.createMenu({
                icon: "arrows-up-down", label: t("valign", "Vertical alignment"),
                items: [
                    { label: t("valign.top", "Top"), icon: "arrows-up-to-line", command: "valign", value: "top" },
                    { label: t("valign.middle", "Middle"), icon: "arrows-up-down", command: "valign", value: "middle" },
                    { label: t("valign.bottom", "Bottom"), icon: "arrows-down-to-line", command: "valign", value: "bottom" }
                ]
            }),
            ctrl.createButton({ command: "wrap", icon: "arrow-turn-down", label: t("wrap", "Wrap text") })
        ));
        fragment.appendChild(ctrl.createSeparator());
        const conventions = webexpress.webui.SpreadsheetFormat.locale(ctrl.locale);
        fragment.appendChild(group(
            ctrl.createMenu({
                icon: "hashtag", label: t("numberformat", "Number format"),
                items: [
                    { label: t("nf.general", "General"), command: "numberformat", value: "" },
                    { label: t("nf.number", "Number") + " (1.234,56)", command: "numberformat", value: "#,##0.00" },
                    { label: t("nf.integer", "Integer") + " (1.235)", command: "numberformat", value: "#,##0" },
                    { label: t("nf.currency", "Currency"), command: "numberformat", value: conventions.currencyFormat },
                    { label: t("nf.accounting", "Accounting"), command: "numberformat", value: conventions.currencyFormat + ";[Red]-" + conventions.currencyFormat },
                    { label: t("nf.percent", "Percent"), command: "numberformat", value: "0.00%" },
                    { label: t("nf.scientific", "Scientific"), command: "numberformat", value: "0.00E+00" },
                    { separator: true },
                    { label: t("nf.date", "Date"), command: "numberformat", value: conventions.date },
                    { label: t("nf.longdate", "Long date"), command: "numberformat", value: "dddd, d. mmmm yyyy" },
                    { label: t("nf.time", "Time"), command: "numberformat", value: "hh:mm:ss" },
                    { label: t("nf.datetime", "Date and time"), command: "numberformat", value: conventions.datetime },
                    { label: t("nf.duration", "Duration"), command: "numberformat", value: "[h]:mm" },
                    { separator: true },
                    { label: t("nf.text", "Text"), command: "numberformat", value: "@" },
                    { label: t("nf.custom", "Custom format..."), onClick: () => this._customFormat(ctrl) }
                ]
            }),
            ctrl.createButton({ command: "currency", icon: "euro-sign", label: t("nf.currency", "Currency") }),
            ctrl.createButton({ command: "percent", icon: "percent", label: t("nf.percent", "Percent") }),
            ctrl.createButton({ command: "thousands", text: "000", label: t("nf.thousands", "Thousands separator") }),
            ctrl.createButton({ command: "decimalincrease", text: ".0+", label: t("nf.more", "More decimal places") }),
            ctrl.createButton({ command: "decimaldecrease", text: ".0\u2212", label: t("nf.less", "Fewer decimal places") })
        ));
        fragment.appendChild(ctrl.createSeparator());
        fragment.appendChild(group(
            ctrl.createMenu({
                icon: "palette", label: t("cellstyle", "Cell styles"),
                items: [
                    ...webexpress.webui.SpreadsheetCellStyles.getAll().map(template => ({
                        label: webexpress.webui.I18N.translate(template.label), command: "cellstyle", value: template.name,
                        render: button => { const s = template.style; if (s.fill) button.style.backgroundColor = s.fill; if (s.color) button.style.color = s.color; if (s.bold) button.style.fontWeight = "bold"; }
                    })),
                    { separator: true },
                    { label: t("cellstyle.none", "No cell style"), command: "cellstyle", value: "" }
                ]
            }),
            ctrl.createButton({ command: "clearformat", icon: "eraser", label: t("clear.formats", "Clear formatting") })
        ));
        section.appendChild(fragment);
        this._font = font.querySelector(".wx-spreadsheet-btn-text");
        this._size = size.querySelector(".wx-spreadsheet-btn-text");
        return section;
    },

    /**
     * Creates a color picker that applies its color to the selection.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     * @param {string} command - "color" or "fill".
     * @param {string} icon - The symbolic icon.
     * @param {string} label - The accessible name.
     * @returns {HTMLElement} The picker host.
     */
    _color(ctrl, command, icon, label) {
        const host = document.createElement("div");
        host.className = "wx-spreadsheet-btn-group";
        host.dataset.compact = "true";
        host.dataset.allowEmpty = "true";
        host.dataset.icon = icon;
        host.dataset.emptyColor = command === "color" ? "currentColor" : "transparent";
        host.setAttribute("aria-label", label);
        const control = new webexpress.webui.InputColorCtrl(host);
        const trigger = host.querySelector(".wx-color-trigger");
        if (trigger) { trigger.classList.add("wx-spreadsheet-btn"); trigger.title = label; trigger.setAttribute("data-color-command", command); }
        (ctrl._formattingColors ||= new Map()).set(command, control);
        // the picker's own change must not pass for a change of the spreadsheet around it
        host.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, event => {
            event.stopPropagation();
            ctrl.execCommand(command, event.detail.value || null);
        });
        return host;
    },

    /**
     * Asks for a custom number format code.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     */
    async _customFormat(ctrl) {
        const current = ctrl.queryCommandValue("numberformat") ?? "";
        const code = await ctrl.prompt(ctrl.t("nf.prompt", "Format code, for example #,##0.00 or dd.mm.yyyy"), current);
        if (code !== null) ctrl.setNumberFormat(null, code.trim() || null);
    },

    /**
     * Shows the font, size and colors at the active cell.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     */
    onSelectionChange(ctrl) {
        if (this._font) this._font.textContent = ctrl.queryCommandValue("font") || ctrl.t("font.default", "Default");
        if (this._size) this._size.textContent = String(ctrl.queryCommandValue("size") ?? 10);
        for (const [command, control] of ctrl._formattingColors ?? []) {
            const value = ctrl.queryCommandValue(command) ?? "";
            if (!control.setValue?.(value, false)) control.setValue?.("", false);
        }
    },

    /**
     * Keeps the indicators in step after changes, undo and redo.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     */
    onChange(ctrl) { this.onSelectionChange(ctrl); }
});
