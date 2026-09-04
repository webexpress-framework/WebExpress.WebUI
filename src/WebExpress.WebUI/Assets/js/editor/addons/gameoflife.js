// register game of life add-on
webexpress.webui.EditorAddOns.register("game-of-life", {
    label: "Game of Life",
    icon: "gamepad",
    type: "block",
    isContainer: false, // canvas handles its own interaction
    description: "Interactive Game of Life simulation.",
    properties: [
        { name: "cellSize", label: "Cell Size (px)", type: "number", default: 10 }
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