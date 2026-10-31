// register game of life add-on; its labels are resolved here, so this file loads after the i18n dictionaries
webexpress.webui.EditorAddOns.register("game-of-life", {
    label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.gameoflife.label"),
    icon: "gamepad",
    type: "block",
    isContainer: false, // canvas handles its own interaction
    description: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.gameoflife.description"),
    properties: [
        { name: "cellSize", label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.gameoflife.cellsize"), type: "number", default: 10 }
    ],
    renderer: (data) => {
        const cellSize = data.cellSize || 10;

        // the size is this block's own and stays in the markup; the ground is not - it is the
        // theme's, and an inline colour would outrank every stylesheet and freeze the board on
        // one background for the life of the document it was written into
        return `
            <div class="wx-webui-gameoflife"
                 style="width: 100%; height: 300px;"
                 data-cell-size="${cellSize}">
            </div>`;
    }
});