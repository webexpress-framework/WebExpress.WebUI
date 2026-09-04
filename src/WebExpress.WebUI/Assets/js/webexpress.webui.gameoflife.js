/**
 * A control implementing Conway's Game of Life.
 * Features automatic restart on stagnation, mouse interaction,
 * multi-color cells with color inheritance rules, and support for a fixed custom color.
 *
 * Color rules (active only when no explicit data-color attribute is set):
 *   - on init:    each living cell receives a random color from the palette
 *   - on survive: the cell keeps its own color
 *   - on birth:   the new cell inherits a blended color from its three living parents (HSL average)
 *   - on death:   the cell color is discarded
 *   - on reset:   all living cells receive new random palette colors
 *
 * The colors a cell carries are the palette's own. What reaches the canvas is that color read
 * for the theme the page is in: the same hue, at a lightness that keeps it legible against the
 * background it is drawn on. The canvas itself stays transparent, so the background is always
 * the page's.
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
    _themeObserver = null;

    /**
     * The color a cell falls back to when neither the palette nor a configured color applies.
     */
    static DEFAULT_COLOR = "#9ec5fe";

    /**
     * The lightness band a color is read into, per theme. A drawing on a dark ground needs its
     * colors above the ground and one on a light ground needs them below it, so the band is the
     * whole of what the theme changes - the hue a cell inherited from its parents is kept.
     */
    static BANDS = {
        light: { min: 30, max: 55 },
        dark: { min: 55, max: 80 }
    };

    // palette used when no explicit color is configured
    _palette = [
        "#e63946", "#f4a261", "#2a9d8f", "#457b9d",
        "#a8dadc", "#e9c46a", "#f77f00", "#8ecae6",
        "#b5838d", "#6d6875", "#52b788", "#48cae4"
    ];

    /**
     * Constructor.
     * @param {HTMLElement} element - The DOM element associated with the instance.
     */
    constructor(element) {
        super(element);

        // initialize configuration from data attributes
        this._cellSize = parseInt(element.dataset.cellSize, 10) || 10;
        // store custom color if provided, otherwise null to activate multi-color mode
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

        // clean up dom and append canvas. The registry takes the class the control was
        // recognised by off the element once it has mounted, so the styling hook is a name of
        // its own - without it the board loses its ground the moment it comes alive.
        element.classList.add("wx-gameoflife");
        element.textContent = "";
        element.appendChild(this._canvas);

        // colors are read for the theme at draw time and the reading is memoised, so a theme
        // switch only has to empty the cache - the cells keep the colors they inherited
        this._tinted = new Map();
        this._watchTheme();

        // initialize the grid with random life
        this._initGrid();

        // start the game loop
        this._loop();

        // attach event listeners for interaction
        this._attachEvents();
    }

    /**
     * Returns a random color from the internal palette.
     * @returns {string} A hex color string.
     */
    _randomPaletteColor() {
        return this._palette[Math.floor(Math.random() * this._palette.length)];
    }

    /**
     * Reads a color for the theme the page is in.
     *
     * Only the lightness is moved, into the band the theme leaves room for; hue and saturation
     * are what the cell inherited and say which colony it belongs to, so they are kept. A color
     * already inside the band is returned untouched.
     *
     * @param {string} hex - The color the cell carries.
     * @returns {string} The color to draw it in.
     */
    _tint(hex) {
        if (this._tinted.has(hex)) {
            return this._tinted.get(hex);
        }

        const band = webexpress.webui.GameOfLifeCtrl.BANDS[this._theme()];
        const hsl = this._hexToHsl(hex);
        const lightness = Math.min(band.max, Math.max(band.min, hsl.l));
        const tinted = lightness === hsl.l ? hex : this._hslToHex(hsl.h, hsl.s, lightness);

        this._tinted.set(hex, tinted);

        return tinted;
    }

    /**
     * Reports which theme the page is in.
     * @returns {string} Either "dark" or "light".
     */
    _theme() {
        return document.documentElement?.getAttribute("data-bs-theme") === "dark" ? "dark" : "light";
    }

    /**
     * Follows a theme switch.
     *
     * The theme is changed on the document element while the page is open - the framework has a
     * picker for it - so the colors cannot be read once at construction. The cache is emptied
     * instead, and the next frame draws the same cells against the new ground.
     */
    _watchTheme() {
        if (typeof MutationObserver !== "function" || !document.documentElement) {
            return;
        }

        this._themeObserver = new MutationObserver(() => this._tinted.clear());
        this._themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-bs-theme"]
        });
    }

    /**
     * Stops the animation and the theme watch.
     */
    destroy() {
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }

        this._themeObserver?.disconnect();
        this._themeObserver = null;

        this._element.classList.remove("wx-gameoflife");
    }

    /**
     * Parses a hex color string into an HSL object.
     * @param {string} hex - A hex color string (e.g. "#ff0000").
     * @returns {{h: number, s: number, l: number}} HSL representation.
     */
    _hexToHsl(hex) {
        // convert hex to rgb components in range [0, 1]
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (delta > 0) {
            s = delta / (1 - Math.abs(2 * l - 1));

            if (max === r) {
                h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
            } else if (max === g) {
                h = ((b - r) / delta + 2) / 6;
            } else {
                h = ((r - g) / delta + 4) / 6;
            }
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    /**
     * Converts an HSL object back to a hex color string.
     * @param {number} h - Hue in degrees [0, 360].
     * @param {number} s - Saturation in percent [0, 100].
     * @param {number} l - Lightness in percent [0, 100].
     * @returns {string} A hex color string.
     */
    _hslToHex(h, s, l) {
        const sn = s / 100;
        const ln = l / 100;
        const a = sn * Math.min(ln, 1 - ln);

        /**
         * Calculates a single channel value.
         * @param {number} n - Channel index offset.
         * @returns {number} Channel value in range [0, 255].
         */
        const channel = (n) => {
            const k = (n + h / 30) % 12;
            const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color);
        };

        const r = channel(0).toString(16).padStart(2, "0");
        const g = channel(8).toString(16).padStart(2, "0");
        const b = channel(4).toString(16).padStart(2, "0");

        return `#${r}${g}${b}`;
    }

    /**
     * Blends multiple hex colors by averaging their HSL components.
     * Hue is averaged using circular mean to avoid wrap-around artifacts.
     * @param {string[]} colors - Array of hex color strings to blend.
     * @returns {string} The blended hex color string.
     */
    _blendColors(colors) {
        if (colors.length === 0) {
            return this._randomPaletteColor();
        }
        if (colors.length === 1) {
            return colors[0];
        }

        const hsls = colors.map((c) => this._hexToHsl(c));

        // circular mean for hue to handle the 0°/360° wrap correctly
        let sinSum = 0;
        let cosSum = 0;

        hsls.forEach((hsl) => {
            const rad = (hsl.h * Math.PI) / 180;
            sinSum += Math.sin(rad);
            cosSum += Math.cos(rad);
        });

        const meanRad = Math.atan2(sinSum / hsls.length, cosSum / hsls.length);
        const meanH = ((meanRad * 180) / Math.PI + 360) % 360;

        // arithmetic mean for saturation and lightness
        const meanS = hsls.reduce((acc, hsl) => acc + hsl.s, 0) / hsls.length;
        const meanL = hsls.reduce((acc, hsl) => acc + hsl.l, 0) / hsls.length;

        return this._hslToHex(meanH, meanS, meanL);
    }

    /**
     * Initializes the grid with random states and random palette colors.
     * Each cell is an object with an alive flag and a color string.
     */
    _initGrid() {
        this._grid = new Array(this._cols);
        for (let i = 0; i < this._cols; i++) {
            this._grid[i] = new Array(this._rows);
            for (let j = 0; j < this._rows; j++) {
                // random initialization: roughly 20% alive
                const alive = Math.random() > 0.8;
                this._grid[i][j] = {
                    alive,
                    color: alive ? this._randomPaletteColor() : null
                };
            }
        }
    }

    /**
     * Attaches event listeners for mouse interaction.
     */
    _attachEvents() {
        /**
         * Returns the mouse position relative to the canvas.
         * @param {MouseEvent} e
         * @returns {{x: number, y: number}}
         */
        const getMousePos = (e) => {
            const rect = this._canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        /**
         * Activates a cell at the cursor position with a random palette color.
         * @param {MouseEvent} e
         */
        const drawAtCursor = (e) => {
            const pos = getMousePos(e);
            const x = Math.floor(pos.x / this._cellSize);
            const y = Math.floor(pos.y / this._cellSize);

            if (x >= 0 && x < this._cols && y >= 0 && y < this._rows) {
                this._grid[x][y] = {
                    alive: true,
                    // user-drawn cells get a fresh random color from the palette
                    color: this._customColor || this._randomPaletteColor()
                };
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
     * Collects colors of all living neighbors for a given cell.
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     * @returns {{count: number, colors: string[]}} Living neighbor count and their colors.
     */
    _getLivingNeighborData(x, y) {
        const colors = [];

        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i === 0 && j === 0) {
                    continue;
                }
                const col = (x + i + this._cols) % this._cols;
                const row = (y + j + this._rows) % this._rows;
                const neighbor = this._grid[col][row];

                if (neighbor.alive) {
                    colors.push(neighbor.color);
                }
            }
        }

        return { count: colors.length, colors };
    }

    /**
     * Updates the game state to the next generation.
     * Applies Conway's rules; new cells inherit a blended color from their parents.
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
                const cell = this._grid[i][j];
                const { count, colors } = this._getLivingNeighborData(i, j);
                let nextAlive = cell.alive;
                let nextColor = cell.color;

                // apply rules of game of life
                if (!cell.alive && count === 3) {
                    // birth: new cell blends color from the three living parents
                    nextAlive = true;
                    nextColor = this._customColor || this._blendColors(colors);
                } else if (cell.alive && (count < 2 || count > 3)) {
                    // death by underpopulation or overpopulation
                    nextAlive = false;
                    nextColor = null;
                }
                // survival: cell keeps its own color (no change needed)

                nextGrid[i][j] = { alive: nextAlive, color: nextColor };

                if (nextAlive !== cell.alive) {
                    hasChanges = true;
                }
                if (nextAlive) {
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
     * Renders the grid to the canvas.
     * Each living cell is drawn in its individual color.
     */
    _draw() {
        // clear the entire canvas (transparent background)
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        for (let i = 0; i < this._cols; i++) {
            for (let j = 0; j < this._rows; j++) {
                const cell = this._grid[i][j];

                if (cell.alive) {
                    // the cell's own color, or the configured one, read for the current theme
                    this._ctx.fillStyle = this._tint(
                        cell.color || this._customColor || webexpress.webui.GameOfLifeCtrl.DEFAULT_COLOR
                    );
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