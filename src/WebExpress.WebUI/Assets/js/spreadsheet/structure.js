/**
 * Plugin for the structure and the data of a sheet: inserting and deleting rows and columns,
 * freezing panes, sorting, quick aggregates and comments.
 */
webexpress.webui.SpreadsheetPlugins.register("structure", 1000, {
    /**
     * Creates the structure part of the toolbar.
     * @param {webexpress.webui.SpreadsheetCtrl} ctrl - The spreadsheet.
     * @returns {HTMLElement} The toolbar section.
     */
    createToolbar(ctrl) {
        const t = (key, fallback) => ctrl.t(key, fallback);
        const section = document.createElement("div");
        section.className = "wx-spreadsheet-btn-group";
        section.append(
            ctrl.createSeparator(),
            ctrl.createMenu({
                icon: "table-row-add", label: t("rows", "Rows and columns"),
                items: [
                    { label: t("row.insertabove", "Insert rows above"), icon: "add-row-above", command: "insertrowabove" },
                    { label: t("row.insertbelow", "Insert rows below"), icon: "add-row-below", command: "insertrowbelow" },
                    { label: t("col.insertleft", "Insert columns left"), icon: "add-column-above", command: "insertcolleft" },
                    { label: t("col.insertright", "Insert columns right"), icon: "add-column-below", command: "insertcolright" },
                    { separator: true },
                    { label: t("row.delete", "Delete rows"), icon: "del-row", command: "deleterow" },
                    { label: t("col.delete", "Delete columns"), icon: "del-column", command: "deletecol" },
                    { separator: true },
                    { label: t("row.hide", "Hide rows"), command: "hiderow" },
                    { label: t("col.hide", "Hide columns"), command: "hidecol" },
                    { label: t("unhide", "Show hidden rows and columns"), command: "unhide" }
                ]
            }),
            ctrl.createMenu({
                icon: "snowflake", label: t("freeze", "Freeze panes"),
                items: [
                    { label: t("freeze.panes", "Freeze panes at the active cell"), command: "freeze" },
                    { label: t("freeze.row", "Freeze top row"), command: "freezerow" },
                    { label: t("freeze.col", "Freeze first column"), command: "freezecol" },
                    { label: t("freeze.none", "Unfreeze"), command: "unfreeze" },
                    { separator: true },
                    { label: t("gridlines", "Show gridlines"), command: "gridlines" }
                ]
            }),
            ctrl.createButton({ command: "sortasc", icon: "arrow-down-a-z", label: t("sort.asc", "Sort ascending") }),
            ctrl.createButton({ command: "sortdesc", icon: "arrow-down-z-a", label: t("sort.desc", "Sort descending") }),
            ctrl.createMenu({
                icon: "sigma", label: t("autosum", "AutoSum"),
                items: [
                    { label: t("autosum.sum", "Sum"), command: "autosum", value: "SUM" },
                    { label: t("autosum.average", "Average"), command: "autosum", value: "AVERAGE" },
                    { label: t("autosum.count", "Count numbers"), command: "autosum", value: "COUNT" },
                    { label: t("autosum.max", "Maximum"), command: "autosum", value: "MAX" },
                    { label: t("autosum.min", "Minimum"), command: "autosum", value: "MIN" }
                ]
            }),
            ctrl.createButton({ command: "comment", icon: "comment", label: t("comment", "Comment") + " (Shift+F2)" })
        );
        return section;
    }
});
