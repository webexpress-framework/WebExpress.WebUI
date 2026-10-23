/**
 * Plugin for finding and replacing (Ctrl+F, Ctrl+H). The bar opens below the toolbar and keeps
 * the grid usable: Enter finds the next match, Shift+Enter the previous one, Escape closes the
 * bar and returns to the grid.
 */
webexpress.webui.SpreadsheetPlugins.register("find", 2000, {
    /**
     * Creates the find button and the hidden find bar.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     * @returns {HTMLElement} The toolbar section.
     */
    createToolbar(ctrl) {
        const section = document.createElement("div");
        section.className = "wx-spreadsheet-btn-group";
        section.append(ctrl.createSeparator(), ctrl.createButton({ command: "find", icon: "magnifying-glass", label: ctrl.t("find", "Find") + " (Ctrl+F)" }));
        return section;
    },

    /**
     * Opens the find bar, with the replace fields when asked.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     * @param {boolean} replace - Whether replacing is offered.
     * @returns {boolean} True when the bar is open.
     */
    openFind(ctrl, replace) {
        const bar = this._bar ??= this._build(ctrl);
        bar.hidden = false;
        bar.classList.toggle("wx-spreadsheet-find-replace", !!replace && !ctrl.readOnly);
        this._query.focus({ preventScroll: true });
        try { this._query.select(); } catch { /* the stub has no selection api */ }
        return true;
    },

    /**
     * Builds the find bar.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     * @returns {HTMLElement} The bar.
     */
    _build(ctrl) {
        const t = (key, fallback) => ctrl.t(key, fallback);
        const bar = document.createElement("div");
        bar.className = "wx-spreadsheet-find";
        bar.setAttribute("role", "search");
        bar.hidden = true;
        const input = (label) => {
            const el = document.createElement("input");
            el.setAttribute("type", "text");
            el.className = "form-control form-control-sm";
            el.setAttribute("aria-label", label);
            el.placeholder = label;
            return el;
        };
        const check = (label) => {
            const wrap = document.createElement("label");
            wrap.className = "wx-spreadsheet-find-option";
            const box = document.createElement("input");
            box.setAttribute("type", "checkbox");
            wrap.append(box, document.createTextNode(" " + label));
            return { wrap, box };
        };
        this._query = input(t("find.query", "Find"));
        this._replacement = input(t("find.replacement", "Replace with"));
        this._replacement.classList.add("wx-spreadsheet-find-replace-only");
        const matchCase = check(t("find.case", "Match case"));
        const whole = check(t("find.whole", "Entire cell"));
        const all = check(t("find.sheets", "All sheets"));
        const formulas = check(t("find.formulas", "In formulas"));
        this._status = document.createElement("span");
        this._status.className = "wx-spreadsheet-find-status";
        this._status.setAttribute("role", "status");
        const options = () => ({ matchCase: matchCase.box.checked, wholeCell: whole.box.checked, allSheets: all.box.checked, formulas: formulas.box.checked });
        const report = (match) => {
            const count = ctrl.find(this._query.value, options()).length;
            this._status.textContent = match ? (t("find.found", "Match") + " " + match.sheet + "!" + match.ref + " (" + count + ")") : t("find.none", "No matches");
        };
        const next = (backwards) => {
            if (!this._query.value) return;
            report(ctrl.findNext(this._query.value, { ...options(), backwards }));
        };
        const button = (label, icon, handler, extra) => {
            const el = ctrl.createButton({ icon, text: icon ? undefined : label, label, onClick: handler });
            if (extra) el.classList.add(extra);
            return el;
        };
        const close = () => { bar.hidden = true; ctrl.getEditorElement().focus({ preventScroll: true }); };
        this._query.addEventListener("keydown", e => {
            if (e.key === "Enter") { e.preventDefault(); next(e.shiftKey); }
            else if (e.key === "Escape") { e.preventDefault(); close(); }
        });
        this._replacement.addEventListener("keydown", e => {
            if (e.key === "Enter") { e.preventDefault(); this._status.textContent = t("find.replaced", "Replaced") + ": " + ctrl.replace(this._query.value, this._replacement.value, options()); next(false); }
            else if (e.key === "Escape") { e.preventDefault(); close(); }
        });
        bar.append(
            this._query,
            button(t("find.previous", "Previous"), "angle-up", () => next(true)),
            button(t("find.next", "Next"), "angle-down", () => next(false)),
            this._replacement,
            button(t("find.replace", "Replace"), null, () => { this._status.textContent = t("find.replaced", "Replaced") + ": " + ctrl.replace(this._query.value, this._replacement.value, options()); next(false); }, "wx-spreadsheet-find-replace-only"),
            button(t("find.replaceall", "Replace all"), null, () => { this._status.textContent = t("find.replaced", "Replaced") + ": " + ctrl.replace(this._query.value, this._replacement.value, { ...options(), all: true }); }, "wx-spreadsheet-find-replace-only"),
            matchCase.wrap, whole.wrap, all.wrap, formulas.wrap, this._status,
            button(t("find.close", "Close"), "xmark", close)
        );
        ctrl._toolbar.after(bar);
        return bar;
    }
});
