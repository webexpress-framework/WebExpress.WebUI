/**
 * A control implementing Conway's Game of Life.
 * Features automatic restart on stagnation, mouse interaction,
 * and support for dark mode/custom colors.
 */
webexpress.webui.GameOfLifeCtrl = class extends webexpress.webui.Ctrl {
    _canvas = null;
    _ctx = null;
    _grid = [];
    _cols = 0;
    _rows = 0;
    _cellSize = 10;
    _animationFrameId = null;
    _isDrawing = false;
    _customColor = null;

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with the instance.
     */
    constructor(element) {
        super(element);

        // initialize configuration from data attributes
        this._cellSize = parseInt(element.dataset.cellSize, 10) || 10;
        // store custom color if provided, otherwise null to allow auto-theming
        this._customColor = element.dataset.color || null;

        // setup the canvas and dimensions
        this._canvas = document.createElement("canvas");
        this._canvas.width = element.clientWidth || 300;
        this._canvas.height = element.clientHeight || 300;
        this._canvas.style.display = "block";
        this._ctx = this._canvas.getContext("2d");

        // calculate grid dimensions based on canvas size
        this._cols = Math.floor(this._canvas.width / this._cellSize);
        this._rows = Math.floor(this._canvas.height / this._cellSize);

        // clean up dom and append canvas
        element.textContent = "";
        element.appendChild(this._canvas);

        // initialize the grid with random life
        this._initGrid();

        // start the game loop
        this._loop();

        // attach event listeners for interaction and theme changes
        this._attachEvents();
    }

    /**
     * Initializes the grid with random states (alive or dead).
     */
    _initGrid() {
        this._grid = new Array(this._cols);
        for (let i = 0; i < this._cols; i++) {
            this._grid[i] = new Array(this._rows);
            for (let j = 0; j < this._rows; j++) {
                // random initialization: roughly 20% alive
                this._grid[i][j] = Math.random() > 0.8 ? 1 : 0;
            }
        }
    }

    /**
     * Attaches event listeners for mouse interaction and theme changes.
     */
    _attachEvents() {
        const getMousePos = (e) => {
            const rect = this._canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const drawAtCursor = (e) => {
            const pos = getMousePos(e);
            const x = Math.floor(pos.x / this._cellSize);
            const y = Math.floor(pos.y / this._cellSize);
            
            if (x >= 0 && x < this._cols && y >= 0 && y < this._rows) {
                this._grid[x][y] = 1;
                this._draw();
            }
        };

        this._canvas.addEventListener("mousedown", (e) => {
            this._isDrawing = true;
            drawAtCursor(e);
        });

        this._canvas.addEventListener("mousemove", (e) => {
            if (this._isDrawing) {
                drawAtCursor(e);
            }
        });

        window.addEventListener("mouseup", () => {
            this._isDrawing = false;
        });
    }

    /**
     * Determines the current color for living cells.
     * Prioritizes data-color attribute, otherwise falls back to theme default.
     * @returns {string} The hex color string.
     */
    _getColor() {
        if (this._customColor) {
            return this._customColor;
        }
        // return default
        return "#9ec5fe";
    }

    /**
     * The main game loop handling updates and rendering.
     */
    _loop() {
        // slow down the animation slightly for visibility
        setTimeout(() => {
            this._animationFrameId = requestAnimationFrame(() => {
                this._loop();
            });
        }, 100);

        this._update();
        this._draw();
    }

    /**
     * Updates the game state to the next generation.
     * Checks for extinction or stagnation to trigger a reset.
     */
    _update() {
        // do not update grid logic while user is interacting
        if (this._isDrawing) {
            return;
        }

        const nextGrid = new Array(this._cols);
        let hasChanges = false;
        let totalAlive = 0;

        for (let i = 0; i < this._cols; i++) {
            nextGrid[i] = new Array(this._rows);
            for (let j = 0; j < this._rows; j++) {
                const state = this._grid[i][j];
                const neighbors = this._countNeighbors(this._grid, i, j);
                let newState = state;

                // apply rules of game of life
                if (state === 0 && neighbors === 3) {
                    newState = 1;
                } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
                    newState = 0;
                }

                nextGrid[i][j] = newState;

                if (newState !== state) {
                    hasChanges = true;
                }
                if (newState === 1) {
                    totalAlive++;
                }
            }
        }

        this._grid = nextGrid;

        // detect dead field (no life or static state) and restart
        if (!hasChanges || totalAlive === 0) {
            this._initGrid();
        }
    }

    /**
     * Counts the living neighbors of a specific cell.
     * @param {Array} grid - The current grid state.
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     * @returns {number} The number of living neighbors.
     */
    _countNeighbors(grid, x, y) {
        let sum = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                const col = (x + i + this._cols) % this._cols;
                const row = (y + j + this._rows) % this._rows;
                sum += grid[col][row];
            }
        }
        return sum - grid[x][y];
    }

    /**
     * Renders the grid to the canvas.
     */
    _draw() {
        // clear the entire canvas (transparent background)
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.fillStyle = this._getColor();

        for (let i = 0; i < this._cols; i++) {
            for (let j = 0; j < this._rows; j++) {
                if (this._grid[i][j] === 1) {
                    this._ctx.fillRect(
                        i * this._cellSize, 
                        j * this._cellSize, 
                        this._cellSize - 1, 
                        this._cellSize - 1
                    );
                }
            }
        }
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-gameoflife", webexpress.webui.GameOfLifeCtrl);