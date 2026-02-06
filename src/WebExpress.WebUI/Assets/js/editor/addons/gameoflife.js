// register game of life add-on
webexpress.webui.EditorAddOns.register("game-of-life", {
    label: "Game of Life",
    icon: "fas fa-gamepad",
    type: "block",
    isContainer: false, // Canvas handles its own interaction
    description: "Interactive Game of Life simulation.",
    properties: [
        { name: "cellSize", label: "Cell Size (px)", type: "number", default: 10 },
        { name: "color", label: "Color", type: "color", default: "#9ec5fe" }
    ],
    renderer: (data) => {
        const cellSize = data.cellSize || 10;
        const color = data.color || "#9ec5fe";
        return `
            <div class="wx-webui-gameoflife" 
                 style="width: 100%; height: 300px; background: #f8f9fa;"
                 data-cell-size="${cellSize}" 
                 data-color="${color}">
            </div>`;
    }
});