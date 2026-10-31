/**
 * Draws charts as SVG without a third-party charting library. The control keeps the
 * configuration shape the framework has always used - type, data.labels, data.datasets and
 * options with plugins.legend, plugins.title and scales - so server-rendered charts, the
 * dashboard widget and code driving the fluent api keep working unchanged.
 *
 * The drawing follows the theme: series colors, grid and text are css custom properties, so a
 * chart follows the light and dark theme without being redrawn. Every chart carries a legend
 * that toggles its series, a pointer and keyboard tooltip and a visually hidden data table, so
 * identity never rests on color alone and the values stay reachable for assistive technology.
 *
 * Dispatches the following events on the host element:
 * - webexpress.webui.Event.DATA_REQUESTED_EVENT
 * - webexpress.webui.Event.DATA_ARRIVED_EVENT
 * - webexpress.webui.Event.DATA_ERROR_EVENT
 */
webexpress.webui.ChartCtrl = class extends webexpress.webui.Ctrl {
    static SVG_NS = "http://www.w3.org/2000/svg";
    static TYPES = ["line", "bar", "pie", "doughnut", "radar", "polarArea", "bubble", "scatter"];

    // the forms whose legend names the labels (the slices) instead of the datasets
    static LABEL_LEGEND_TYPES = ["pie", "doughnut", "polarArea"];

    // the categorical palette has eight slots; a ninth series repeats the first color
    static PALETTE_SIZE = 8;
    static DEFAULT_HEIGHT = 300;
    static FONT_SIZE = 12;
    static MAX_BAR_THICKNESS = 24;
    static BAR_GAP = 2;

    // the staggered entry of the marks of one series ends within this time, however many there are
    static STAGGER = 480;

    // numbers the instances, so the gradients of two charts never share an id
    static _uid = 0;

    /**
     * Creates a new chart controller for the given host element.
     * @param {HTMLElement} element - The host element the chart is drawn into.
     * @param {Object} [config] - An optional configuration { type, data, options }.
     */
    constructor(element, config) {
        super(element);

        this._chart = null;
        this._uid = ++webexpress.webui.ChartCtrl._uid;
        this._motion = null;
        this._enterKey = null;
        this._center = null;
        this._visibility = new Map();
        this._targets = [];
        this._active = -1;
        this._locate = () => -1;
        this._size = { width: 0, height: 0 };
        this._observer = null;
        this._height = this._readHeight(element.getAttribute("data-height"));
        this._width = this._readPixels(element.getAttribute("data-width"));
        this._config = this._buildInitialConfig(element, config);
        this._autoload = this._readAutoloadFlag(element);

        this._cleanupDataAttributes(element);
        element.classList.add("wx-chart");

        if (this._autoload) {
            this.load();
        }
    }

    /**
     * Draws the chart from the current configuration. A chart already on screen is redrawn.
     * @returns {this} The controller instance for chaining.
     */
    load() {
        this._dispatch(webexpress.webui.Event.DATA_REQUESTED_EVENT, { config: this._config });

        try {
            const type = this._typeOf();
            if (!webexpress.webui.ChartCtrl.isSupportedType(type)) {
                throw new Error("unsupported chart type: " + type);
            }

            this._render("enter");
            this._dispatch(webexpress.webui.Event.DATA_ARRIVED_EVENT, { chart: this._chart });
        } catch (error) {
            this._dispatch(webexpress.webui.Event.DATA_ERROR_EVENT, { error: String(error), config: this._config });
        }

        return this;
    }

    /**
     * Replaces the data object { labels, datasets } and redraws the chart.
     * @param {Object} data - The new data object.
     * @returns {this} The controller instance for chaining.
     */
    data(data) {
        this._config.data = data || { labels: [], datasets: [] };
        return this._refresh();
    }

    /**
     * Replaces the data object. Alias of data().
     * @param {Object} newData - The new data object.
     * @returns {this} The controller instance for chaining.
     */
    updateData(newData) {
        return this.data(newData);
    }

    /**
     * Replaces the labels of the category axis (or of the slices) and redraws the chart.
     * @param {Array<string>} labels - The labels.
     * @returns {this} The controller instance for chaining.
     */
    labels(labels) {
        this._ensureData().labels = Array.isArray(labels) ? labels.slice() : [];
        return this._refresh();
    }

    /**
     * Replaces the datasets and redraws the chart.
     * @param {Array<Object>} datasets - The datasets.
     * @returns {this} The controller instance for chaining.
     */
    datasets(datasets) {
        this._ensureData().datasets = Array.isArray(datasets) ? datasets.slice() : [];
        return this._refresh();
    }

    /**
     * Appends a dataset and redraws the chart.
     * @param {Object} dataset - The dataset.
     * @returns {this} The controller instance for chaining.
     */
    addDataset(dataset) {
        this._ensureData().datasets.push(dataset);
        return this._refresh();
    }

    /**
     * Removes the dataset at the given index and redraws the chart.
     * @param {number} index - The index of the dataset.
     * @returns {this} The controller instance for chaining.
     */
    removeDataset(index) {
        const datasets = this._ensureData().datasets;
        if (typeof index === "number" && index >= 0 && index < datasets.length) {
            datasets.splice(index, 1);
            // the toggles are keyed by position, so they would land on the next dataset
            this._visibility.clear();
            this._refresh();
        }
        return this;
    }

    /**
     * Deep-merges options into the current options and redraws the chart. Arrays are replaced.
     * @param {Object} opts - The options to merge.
     * @returns {this} The controller instance for chaining.
     */
    options(opts) {
        if (!opts || typeof opts !== "object") {
            return this;
        }
        this._config.options = this._deepMerge(this._config.options || {}, opts);
        return this._refresh();
    }

    /**
     * Switches the chart type and redraws the chart. An unsupported type is reported through
     * the data error event and leaves the chart as it is.
     * @param {string} type - The chart type, e.g. "line", "bar" or "pie".
     * @returns {this} The controller instance for chaining.
     */
    type(type) {
        const t = String(type || "").trim();
        if (!webexpress.webui.ChartCtrl.isSupportedType(t)) {
            this._dispatch(webexpress.webui.Event.DATA_ERROR_EVENT, { error: "unsupported chart type: " + t });
            return this;
        }
        this._config.type = t;
        // a hidden slice and a hidden dataset share their index, so a switch would carry it over
        this._visibility.clear();
        return this.load();
    }

    /**
     * Replaces the whole configuration and redraws the chart.
     * @param {Object} config - The new configuration { type, data, options }.
     * @returns {this} The controller instance for chaining.
     */
    config(config) {
        this._config = config || {};
        this._visibility.clear();
        return this.load();
    }

    /**
     * Redraws the chart for the current size of its host.
     * @returns {this} The controller instance for chaining.
     */
    resize() {
        if (this._chart !== null) {
            this._render(null);
        }
        return this;
    }

    /**
     * Removes the drawing, the listeners and the resize observer.
     * @returns {this} The controller instance for chaining.
     */
    destroy() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        if (this._chart !== null) {
            this._element.replaceChildren();
            this._chart = null;
            this._plot = null;
        }
        return this;
    }

    /**
     * Returns the svg element the chart is drawn in, or null before the first draw.
     * @returns {SVGSVGElement|null} The svg element.
     */
    get chart() {
        return this._chart;
    }

    /**
     * Returns the current configuration.
     * @returns {Object} The configuration { type, data, options }.
     */
    get currentConfig() {
        return this._config;
    }

    /**
     * Tells whether the control can draw the given chart type.
     * @param {string} type - The chart type.
     * @returns {boolean} True when the type is supported.
     */
    static isSupportedType(type) {
        return webexpress.webui.ChartCtrl.TYPES.indexOf(type) !== -1;
    }

    /**
     * Computes a readable linear scale: round bounds and a step of 1, 2 or 5 times a power of
     * ten, so the tick labels are numbers a reader can add up. A fixed bound is kept exactly and
     * becomes a tick of its own.
     * @param {number} min - The smallest value to show.
     * @param {number} max - The largest value to show.
     * @param {number} maxTicks - The most ticks that fit.
     * @param {number|null} [fixedMin] - A bound the author fixed.
     * @param {number|null} [fixedMax] - A bound the author fixed.
     * @returns {{min: number, max: number, step: number, ticks: number[]}} The scale.
     */
    static niceScale(min, max, maxTicks, fixedMin, fixedMax) {
        const hasMin = typeof fixedMin === "number" && isFinite(fixedMin);
        const hasMax = typeof fixedMax === "number" && isFinite(fixedMax);
        let lo = hasMin ? fixedMin : min;
        let hi = hasMax ? fixedMax : max;
        if (!isFinite(lo) || !isFinite(hi)) {
            lo = 0;
            hi = 1;
        }
        if (lo > hi) {
            [lo, hi] = [hi, lo];
        }
        if (lo === hi) {
            const pad = lo === 0 ? 1 : Math.abs(lo) * 0.1;
            lo = hasMin ? lo : lo - pad;
            hi = hasMax ? hi : hi + pad;
        }

        const nice = (x, round) => {
            const exp = Math.floor(Math.log10(x));
            const f = x / Math.pow(10, exp);
            const nf = round
                ? (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10)
                : (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10);
            return nf * Math.pow(10, exp);
        };
        const count = Math.max(2, Math.floor(maxTicks) || 2);
        const step = nice(nice(hi - lo, false) / (count - 1), true);
        const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
        const snap = (v) => Number(v.toFixed(Math.min(20, decimals + 2)));
        const scaleMin = hasMin ? lo : snap(Math.floor(lo / step + 1e-9) * step);
        const scaleMax = hasMax ? hi : snap(Math.ceil(hi / step - 1e-9) * step);

        const ticks = [];
        for (let n = Math.ceil(scaleMin / step - 1e-9); n * step <= scaleMax + step * 1e-6; n++) {
            ticks.push(snap(n * step));
        }
        // a fixed bound off the step grid is shown as such; a grid tick that would crowd it goes
        if (hasMin && (!ticks.length || Math.abs(ticks[0] - scaleMin) > step * 1e-6)) {
            if (ticks.length && ticks[0] - scaleMin < step * 0.4) {
                ticks.shift();
            }
            ticks.unshift(scaleMin);
        }
        if (hasMax && Math.abs(ticks[ticks.length - 1] - scaleMax) > step * 1e-6) {
            if (ticks.length > 1 && scaleMax - ticks[ticks.length - 1] < step * 0.4) {
                ticks.pop();
            }
            ticks.push(scaleMax);
        }

        return { min: scaleMin, max: scaleMax, step: step, ticks: ticks };
    }

    /**
     * Fits a straight line through points by least squares, the trend a reader expects from a
     * spreadsheet's linear trendline.
     * @param {Array<{x: number, y: number}>} points - The points.
     * @returns {{slope: number, intercept: number}|null} The line y = intercept + slope * x, or
     *     null when fewer than two distinct x values leave the slope undefined.
     */
    static linearRegression(points) {
        const n = points.length;
        if (n < 2) {
            return null;
        }
        let sx = 0;
        let sy = 0;
        let sxx = 0;
        let sxy = 0;
        for (const p of points) {
            sx += p.x;
            sy += p.y;
            sxx += p.x * p.x;
            sxy += p.x * p.y;
        }
        const den = n * sxx - sx * sx;
        if (Math.abs(den) < 1e-12) {
            return null;
        }
        const slope = (n * sxy - sx * sy) / den;
        return { slope: slope, intercept: (sy - slope * sx) / n };
    }

    /**
     * Averages each value with the ones before it over a window, which smooths out the noise
     * of a series and leaves its course.
     * @param {number[]} values - The values in order.
     * @param {number} period - The size of the window.
     * @returns {Array<number|null>} The averages; null where the window is not yet full.
     */
    static movingAverage(values, period) {
        const size = Math.max(1, Math.floor(period) || 1);
        let sum = 0;
        return values.map((v, i) => {
            sum += v;
            if (i >= size) {
                sum -= values[i - size];
            }
            return i >= size - 1 ? sum / size : null;
        });
    }

    /**
     * Reads the height from data-height: a pixel value, or a percentage the plot takes from
     * its container.
     * @param {string|null} raw - The attribute value.
     * @returns {{px: number}|{css: string}|null} The height, or null for the default.
     */
    _readHeight(raw) {
        if (raw == null || String(raw).trim() === "") {
            return null;
        }
        const value = String(raw).trim();
        if (value.endsWith("%")) {
            return { css: value };
        }
        const px = this._readPixels(value);
        return px ? { px: px } : null;
    }

    /**
     * Reads a positive pixel length such as "300" or "300px".
     * @param {string|null} raw - The attribute value.
     * @returns {number|null} The length, or null when absent or invalid.
     */
    _readPixels(raw) {
        const n = parseInt(raw, 10);
        return isFinite(n) && n > 0 ? n : null;
    }

    /**
     * Reads the autoload flag from data-autoload; without the attribute the chart draws at once.
     * @param {HTMLElement} element - The host element.
     * @returns {boolean} True when the chart draws on construction.
     */
    _readAutoloadFlag(element) {
        const raw = (element.getAttribute("data-autoload") || "true").toLowerCase();
        return raw !== "false";
    }

    /**
     * Deep merges two objects; arrays are replaced rather than merged.
     * @param {Object} target - The object merged into.
     * @param {Object} source - The object providing the values.
     * @returns {Object} A new merged object.
     */
    _deepMerge(target, source) {
        const out = Array.isArray(target) ? target.slice() : { ...(target || {}) };
        if (source && typeof source === "object") {
            for (const k of Object.keys(source)) {
                const sv = source[k];
                const tv = out[k];
                if (sv && typeof sv === "object" && !Array.isArray(sv) && tv && typeof tv === "object" && !Array.isArray(tv)) {
                    out[k] = this._deepMerge(tv, sv);
                } else {
                    out[k] = Array.isArray(sv) ? sv.slice() : sv;
                }
            }
        }
        return out;
    }

    /**
     * Parses a JSON data attribute; a missing or malformed value yields the fallback.
     * @param {HTMLElement} element - The element carrying the attribute.
     * @param {string} name - The attribute name.
     * @param {*} fallback - The value for a missing or malformed attribute.
     * @returns {*} The parsed value or the fallback.
     */
    _parseJSONAttr(element, name, fallback) {
        const raw = element.getAttribute(name);
        if (!raw) {
            return fallback;
        }
        try {
            return JSON.parse(raw);
        } catch (err) {
            return fallback;
        }
    }

    /**
     * Parses a boolean data attribute strictly: "true" and "false", anything else is the fallback.
     * @param {HTMLElement} element - The element carrying the attribute.
     * @param {string} name - The attribute name.
     * @param {boolean|null} fallback - The value for a missing or unreadable attribute.
     * @returns {boolean|null} The flag or the fallback.
     */
    _parseBoolAttr(element, name, fallback) {
        const raw = element.getAttribute(name);
        if (raw == null) {
            return fallback;
        }
        const v = String(raw).trim().toLowerCase();
        if (v === "true") {
            return true;
        }
        if (v === "false") {
            return false;
        }
        return fallback;
    }

    /**
     * Makes sure a nested option path exists and returns its leaf object.
     * @param {Object} root - The object to extend.
     * @param {Array<string>} path - The keys of the path.
     * @returns {Object} The leaf object.
     */
    _ensurePath(root, path) {
        let node = root;
        for (const key of path) {
            if (typeof node[key] !== "object" || node[key] === null || Array.isArray(node[key])) {
                node[key] = {};
            }
            node = node[key];
        }
        return node;
    }

    /**
     * Reads one dataset from its data attributes (prefix "data-dataset0-", "data-dataset-", ...).
     * @param {HTMLElement} element - The host element.
     * @param {string} prefix - The attribute prefix of the dataset.
     * @returns {Object|null} The dataset, or null when the prefix carries neither label nor data.
     */
    _readDatasetAttrs(element, prefix) {
        const label = element.getAttribute(prefix + "label");
        const data = this._parseJSONAttr(element, prefix + "data", null);
        if (!label && !Array.isArray(data)) {
            return null;
        }

        const dataset = { label: label || "", data: Array.isArray(data) ? data : [] };
        const bg = element.getAttribute(prefix + "background-color");
        const border = element.getAttribute(prefix + "border-color");
        const bw = parseInt(element.getAttribute(prefix + "border-width"), 10);
        const fill = element.getAttribute(prefix + "fill");
        const point = element.getAttribute(prefix + "point-style");
        if (bg) {
            dataset.backgroundColor = bg;
        }
        if (border) {
            dataset.borderColor = border;
        }
        if (isFinite(bw)) {
            dataset.borderWidth = bw;
        }
        if (fill) {
            dataset.fill = fill === "true" ? true : fill === "false" ? false : fill;
        }
        if (point) {
            dataset.pointStyle = point === "false" ? false : point;
        }
        const curve = element.getAttribute(prefix + "curve");
        const tension = parseFloat(element.getAttribute(prefix + "tension"));
        if (curve === "monotone") {
            dataset.cubicInterpolationMode = "monotone";
        } else if (curve === "bezier" || isFinite(tension)) {
            // a Bezier curve without a tension swings out as far as a spreadsheet's smooth line
            dataset.tension = isFinite(tension) ? tension : 0.4;
        }
        const trend = element.getAttribute(prefix + "trendline");
        const period = parseInt(element.getAttribute(prefix + "trendline-period"), 10);
        if (trend && trend !== "none") {
            dataset.trendline = isFinite(period) ? { type: trend, period: period } : { type: trend };
        }
        const type = element.getAttribute(prefix + "type");
        if (type === "bar" || type === "line") {
            dataset.type = type;
        }
        const yAxisId = element.getAttribute(prefix + "y-axis-id");
        if (yAxisId) {
            dataset.yAxisID = yAxisId;
        }
        return dataset;
    }

    /**
     * Builds the configuration from the defaults, data-config, the constructor config,
     * data-options and the individual data attributes, in rising priority.
     * @param {HTMLElement} element - The host element.
     * @param {Object} [config] - The constructor configuration.
     * @returns {Object} The configuration { type, data, options }.
     */
    _buildInitialConfig(element, config) {
        let cfg = {
            type: "line",
            data: { labels: [], datasets: [] },
            options: { responsive: true }
        };
        cfg = this._deepMerge(cfg, this._parseJSONAttr(element, "data-config", null));
        if (config && typeof config === "object") {
            cfg = this._deepMerge(cfg, config);
        }
        cfg.data = cfg.data || { labels: [], datasets: [] };
        cfg.options = this._deepMerge(cfg.options || {}, this._parseJSONAttr(element, "data-options", null));

        const typeAttr = element.getAttribute("data-type");
        if (typeAttr) {
            cfg.type = typeAttr.trim();
        }

        const labels = this._parseJSONAttr(element, "data-labels", null);
        if (Array.isArray(labels)) {
            cfg.data.labels = labels.slice();
        }

        // indexed datasets run up to data-dataset-count, and past it while attributes follow
        const count = parseInt(element.getAttribute("data-dataset-count"), 10) || 0;
        const datasets = [];
        this._datasetAttrCount = 0;
        for (let i = 0; ; i++) {
            const dataset = this._readDatasetAttrs(element, `data-dataset${i}-`);
            if (!dataset && i >= count) {
                break;
            }
            this._datasetAttrCount = i + 1;
            if (dataset) {
                datasets.push(dataset);
            }
        }
        if (datasets.length === 0) {
            const single = this._readDatasetAttrs(element, "data-dataset-");
            if (single) {
                datasets.push(single);
            }
        }
        const datasetsAttr = this._parseJSONAttr(element, "data-datasets", null);
        if (Array.isArray(datasetsAttr)) {
            cfg.data.datasets = datasetsAttr;
        } else if (datasets.length > 0) {
            cfg.data.datasets = datasets;
        }

        const opts = cfg.options;
        const responsive = this._parseBoolAttr(element, "data-responsive", null);
        const aspect = this._parseBoolAttr(element, "data-maintain-aspect-ratio", null);
        const indexAxis = element.getAttribute("data-index-axis");
        const legendDisplay = this._parseBoolAttr(element, "data-legend-display", null);
        const titleDisplay = this._parseBoolAttr(element, "data-title-display", null);
        const titleText = element.getAttribute("data-title-text");
        if (responsive !== null) {
            opts.responsive = responsive;
        }
        if (aspect !== null) {
            opts.maintainAspectRatio = aspect;
        }
        if (indexAxis === "x" || indexAxis === "y") {
            opts.indexAxis = indexAxis;
        }
        if (legendDisplay !== null) {
            this._ensurePath(opts, ["plugins", "legend"]).display = legendDisplay;
        }
        if (titleDisplay !== null) {
            this._ensurePath(opts, ["plugins", "title"]).display = titleDisplay;
        }
        if (typeof titleText === "string") {
            this._ensurePath(opts, ["plugins", "title"]).text = titleText;
        }

        for (const axis of ["x", "y", "y1"]) {
            const beginAtZero = this._parseBoolAttr(element, `data-scale-${axis}-begin-at-zero`, null);
            const title = element.getAttribute(`data-scale-${axis}-title`);
            const min = parseFloat(element.getAttribute(`data-scale-${axis}-min`));
            const max = parseFloat(element.getAttribute(`data-scale-${axis}-max`));
            if (beginAtZero !== null) {
                this._ensurePath(opts, ["scales", axis]).beginAtZero = beginAtZero;
            }
            if (typeof title === "string") {
                const t = this._ensurePath(opts, ["scales", axis, "title"]);
                t.display = true;
                t.text = title;
            }
            if (isFinite(min)) {
                this._ensurePath(opts, ["scales", axis]).min = min;
            }
            if (isFinite(max)) {
                this._ensurePath(opts, ["scales", axis]).max = max;
            }
        }

        return cfg;
    }

    /**
     * Removes the configuration attributes once they are read, so the markup stays clean and a
     * re-scan of the page does not configure the chart a second time.
     * @param {HTMLElement} element - The host element.
     */
    _cleanupDataAttributes(element) {
        const names = [
            "data-config", "data-type", "data-labels", "data-datasets", "data-options",
            "data-autoload", "data-height", "data-width", "data-index-axis", "data-dataset-count",
            "data-responsive", "data-maintain-aspect-ratio",
            "data-legend-display", "data-title-display", "data-title-text"
        ];
        for (const axis of ["x", "y", "y1"]) {
            names.push(`data-scale-${axis}-begin-at-zero`, `data-scale-${axis}-title`, `data-scale-${axis}-min`, `data-scale-${axis}-max`);
        }
        const fields = ["label", "data", "background-color", "border-color", "border-width", "fill", "point-style", "curve", "tension", "trendline", "trendline-period", "y-axis-id", "type"];
        const prefixes = ["data-dataset-"];
        for (let i = 0; i < this._datasetAttrCount; i++) {
            prefixes.push(`data-dataset${i}-`);
        }
        for (const prefix of prefixes) {
            for (const field of fields) {
                names.push(prefix + field);
            }
        }
        for (const name of names) {
            element.removeAttribute(name);
        }
    }

    /**
     * Returns the data object, creating it when a configuration came without one.
     * @returns {Object} The data object { labels, datasets }.
     */
    _ensureData() {
        const data = this._config.data || (this._config.data = { labels: [], datasets: [] });
        if (!Array.isArray(data.labels)) {
            data.labels = [];
        }
        if (!Array.isArray(data.datasets)) {
            data.datasets = [];
        }
        return data;
    }

    /**
     * Redraws a chart that is already on screen; before the first draw the change only waits
     * in the configuration for load().
     * @returns {this} The controller instance for chaining.
     */
    _refresh() {
        if (this._chart !== null) {
            this._render("settle");
        }
        return this;
    }

    /**
     * Returns the configured chart type.
     * @returns {string} The chart type.
     */
    _typeOf() {
        return this._config && this._config.type ? String(this._config.type) : "line";
    }

    /**
     * Returns the labels of the configuration.
     * @returns {Array<string>} The labels.
     */
    _labels() {
        const data = this._config.data || {};
        return Array.isArray(data.labels) ? data.labels : [];
    }

    /**
     * Returns the datasets with their index and whether they are shown. The index stays the
     * position in the configuration, so a dataset keeps its color when another one is hidden.
     * @returns {Array<{ds: Object, index: number, visible: boolean}>} The datasets.
     */
    _series() {
        const data = this._config.data || {};
        const list = Array.isArray(data.datasets) ? data.datasets : [];
        return list.map((ds, index) => ({
            ds: ds || {},
            index: index,
            visible: this._isVisible("d" + index, ds && ds.hidden === true)
        }));
    }

    /**
     * Tells whether a legend entry is shown.
     * @param {string} key - "d" plus a dataset index or "l" plus a label index.
     * @param {boolean} [hiddenByDefault] - Whether the configuration hides the entry initially.
     * @returns {boolean} True when the entry is shown.
     */
    _isVisible(key, hiddenByDefault) {
        return this._visibility.has(key) ? this._visibility.get(key) : !hiddenByDefault;
    }

    /**
     * Returns the data array of a dataset.
     * @param {Object} ds - The dataset.
     * @returns {Array} The data points.
     */
    _dataOf(ds) {
        return Array.isArray(ds.data) ? ds.data : [];
    }

    /**
     * Reads the value a point contributes on a value axis: a number, the y of an object or the
     * second entry of an [x, y] array.
     * @param {*} point - The data point.
     * @returns {number|null} The value, or null for a gap.
     */
    _valueOf(point) {
        let v = point;
        if (Array.isArray(point)) {
            v = point.length > 1 ? point[1] : point[0];
        } else if (point && typeof point === "object") {
            v = point.y;
        }
        if (v === null || v === undefined || v === "") {
            return null;
        }
        const n = Number(v);
        return isFinite(n) ? n : null;
    }

    /**
     * Reads an x/y(/r) point from a number, an object or an [x, y, r] array.
     * @param {*} point - The data point.
     * @param {number} index - The position of the point, the x of a bare number.
     * @returns {{x: number, y: number, r: number|null}|null} The point, or null when unusable.
     */
    _pointOf(point, index) {
        let x;
        let y;
        let r = null;
        if (Array.isArray(point)) {
            [x, y, r] = [point[0], point[1], point.length > 2 ? point[2] : null];
        } else if (point && typeof point === "object") {
            [x, y, r] = [point.x, point.y, point.r != null ? point.r : null];
        } else {
            [x, y] = [index, point];
        }
        if (x === null || y === null || x === undefined || y === undefined) {
            return null;
        }
        x = Number(x);
        y = Number(y);
        r = r === null ? null : Number(r);
        return isFinite(x) && isFinite(y) ? { x: x, y: y, r: isFinite(r) ? r : null } : null;
    }

    /**
     * Describes how a mark is colored: a palette slot by default, the author's colors when the
     * dataset names them. A color array names one color per element.
     * @param {Object} ds - The dataset.
     * @param {number} slot - The palette slot the mark takes without an author color.
     * @param {number} element - The index of the element within the dataset.
     * @returns {{cls: string, fill: string|null, stroke: string|null, width: number|null}} The paint.
     */
    _paint(ds, slot, element) {
        const pick = (v) => (Array.isArray(v) ? v[element % v.length] : v);
        const width = Number(pick(ds.borderWidth));
        return {
            cls: "wx-chart-color-" + (slot % webexpress.webui.ChartCtrl.PALETTE_SIZE),
            fill: pick(ds.backgroundColor) || null,
            stroke: pick(ds.borderColor) || null,
            width: ds.borderWidth != null && isFinite(width) ? width : null
        };
    }

    /**
     * Applies a paint to an element. The author's colors go into custom properties rather than
     * into fill and stroke, so the mark keeps its own rules for which color it uses where.
     * @param {Element} el - The element to color.
     * @param {Object} paint - The paint from _paint().
     * @returns {Element} The element.
     */
    _applyPaint(el, paint) {
        el.classList.add(paint.cls);
        if (paint.fill) {
            el.style.setProperty("--wx-chart-fill", paint.fill);
        }
        if (paint.stroke) {
            el.style.setProperty("--wx-chart-stroke", paint.stroke);
        }
        if (paint.width !== null) {
            el.style.setProperty("--wx-chart-border-width", paint.width + "px");
        }
        return el;
    }

    /**
     * Creates an svg element.
     * @param {string} tag - The tag name.
     * @param {Object} [attrs] - The attributes to set.
     * @param {Element} [parent] - The element to append to.
     * @returns {SVGElement} The element.
     */
    _svg(tag, attrs, parent) {
        const el = document.createElementNS(webexpress.webui.ChartCtrl.SVG_NS, tag);
        for (const key of Object.keys(attrs || {})) {
            el.setAttribute(key, String(attrs[key]));
        }
        if (parent) {
            parent.appendChild(el);
        }
        return el;
    }

    /**
     * Creates an svg text element.
     * @param {string} text - The text.
     * @param {Object} attrs - The attributes to set.
     * @param {Element} parent - The element to append to.
     * @returns {SVGTextElement} The element.
     */
    _text(text, attrs, parent) {
        const el = this._svg("text", attrs, parent);
        el.textContent = text;
        return el;
    }

    /**
     * Estimates the width of a text. Glyphs cannot be measured before the text is drawn, so the
     * layout reserves an average advance per character of the system sans.
     * @param {string} text - The text.
     * @returns {number} The width in pixels.
     */
    _textWidth(text) {
        return String(text).length * webexpress.webui.ChartCtrl.FONT_SIZE * 0.58;
    }

    /**
     * Shortens a text with an ellipsis until it fits the width.
     * @param {string} text - The text.
     * @param {number} width - The available width in pixels.
     * @returns {string} The text that fits.
     */
    _fit(text, width) {
        const value = String(text);
        if (this._textWidth(value) <= width) {
            return value;
        }
        const chars = Math.max(1, Math.floor(width / (webexpress.webui.ChartCtrl.FONT_SIZE * 0.58)) - 1);
        return value.slice(0, chars) + "\u2026";
    }

    /**
     * Formats a number in the language of the page.
     * @param {number} value - The number.
     * @param {number} [step] - The tick step; its decimals decide the decimals of the result.
     * @returns {string} The formatted number.
     */
    _format(value, step) {
        const digits = step ? Math.max(0, Math.min(10, -Math.floor(Math.log10(step) + 1e-9))) : 3;
        const lang = (document.documentElement && document.documentElement.lang) || undefined;
        try {
            return new Intl.NumberFormat(lang, { maximumFractionDigits: digits }).format(value);
        } catch (e) {
            return String(value);
        }
    }

    /**
     * Formats a trend value. A trend is an estimate, so it gets one decimal - two below ten -
     * rather than the false precision of its arithmetic.
     * @param {number} value - The trend value.
     * @returns {string} The formatted value.
     */
    _formatTrend(value) {
        return this._format(value, Math.abs(value) >= 10 ? 0.1 : 0.01);
    }

    /**
     * Formats a share as a percentage.
     * @param {number} share - The share between 0 and 1.
     * @returns {string} The formatted percentage.
     */
    _percent(share) {
        const lang = (document.documentElement && document.documentElement.lang) || undefined;
        try {
            return new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 1 }).format(share);
        } catch (e) {
            return Math.round(share * 1000) / 10 + " %";
        }
    }

    /**
     * Returns the title text of an axis.
     * @param {Object} axis - The axis options.
     * @returns {string} The title, empty when the axis has none.
     */
    _axisTitle(axis) {
        const title = axis && axis.title;
        return title && title.display !== false && title.text ? String(title.text) : "";
    }

    /**
     * Returns the chart title, or an empty string when none is displayed.
     * @returns {string} The title.
     */
    _title() {
        const plugins = (this._config.options && this._config.options.plugins) || {};
        const title = plugins.title || {};
        if (title.display !== true || !title.text) {
            return "";
        }
        return Array.isArray(title.text) ? title.text.join(" ") : String(title.text);
    }

    /**
     * Returns the display name of a dataset; an unnamed dataset is numbered.
     * @param {Object} ds - The dataset.
     * @param {number} index - The index of the dataset.
     * @returns {string} The name.
     */
    _seriesName(ds, index) {
        return ds.label ? String(ds.label) : this._i18n("webexpress.webui:chart.series", "Series") + " " + (index + 1);
    }

    /**
     * Builds the parts of the chart once: title, legend, plot with its svg and tooltip, a live
     * region for keyboard reading and the data table.
     */
    _ensureSkeleton() {
        if (this._plot && this._plot.parentNode === this._element) {
            return;
        }
        // markup left in the host (an old canvas, a fallback text) has no meaning for the chart
        this._element.replaceChildren();

        this._titleEl = document.createElement("div");
        this._titleEl.className = "wx-chart-title";

        this._legendEl = document.createElement("div");
        this._legendEl.className = "wx-chart-legend";
        this._legendEl.setAttribute("role", "group");
        this._legendEl.setAttribute("aria-label", this._i18n("webexpress.webui:chart.legend", "Legend"));

        this._plot = document.createElement("div");
        this._plot.className = "wx-chart-plot";
        this._chart = this._svg("svg", { role: "img", tabindex: "0" }, this._plot);

        this._tooltip = document.createElement("div");
        this._tooltip.className = "wx-chart-tooltip";
        this._tooltip.setAttribute("aria-hidden", "true");
        this._plot.appendChild(this._tooltip);

        // the tooltip is visual; the keyboard reading goes through a polite live region so a
        // pointer sweeping over the chart does not flood a screen reader
        this._live = document.createElement("div");
        this._live.className = "visually-hidden";
        this._live.setAttribute("aria-live", "polite");

        this._table = document.createElement("table");
        this._table.className = "visually-hidden";

        const frag = document.createDocumentFragment();
        frag.appendChild(this._titleEl);
        frag.appendChild(this._legendEl);
        frag.appendChild(this._plot);
        frag.appendChild(this._live);
        frag.appendChild(this._table);
        this._element.appendChild(frag);

        this._chart.addEventListener("pointermove", (e) => this._onPointerMove(e));
        this._chart.addEventListener("pointerdown", (e) => this._onPointerMove(e));
        this._chart.addEventListener("pointerleave", () => this._hideTip());
        this._chart.addEventListener("keydown", (e) => this._onKeyDown(e));
        this._chart.addEventListener("blur", () => this._hideTip());

        if (this._config.options && this._config.options.responsive !== false && typeof ResizeObserver !== "undefined") {
            this._observer = new ResizeObserver(() => {
                const width = this._plot ? this._plot.clientWidth : 0;
                if (width > 0 && Math.round(width) !== Math.round(this._size.width)) {
                    // a chart laid out for the first time still owes its entry
                    this._render(this._pendingEntry ? "enter" : null);
                }
            });
            this._observer.observe(this._plot);
        }
    }

    /**
     * Determines the size of the drawing: the width of the plot (or data-width) and a height
     * from data-height, from the aspect ratio when it is to be kept, or the default height.
     * @param {string} type - The chart type.
     * @returns {{width: number, height: number}} The size in pixels.
     */
    _measure(type) {
        const opts = this._config.options || {};
        if (this._width) {
            this._plot.style.maxWidth = this._width + "px";
        }
        const width = Math.min(this._width || Infinity, this._plot.clientWidth || this._element.clientWidth || this._width || 400);
        let height = webexpress.webui.ChartCtrl.DEFAULT_HEIGHT;

        if (this._height && this._height.css) {
            this._plot.style.height = this._height.css;
            height = this._plot.clientHeight || height;
        } else if (this._height) {
            height = this._height.px;
        } else if (opts.maintainAspectRatio === true) {
            const radial = ["pie", "doughnut", "radar", "polarArea"].includes(type);
            const ratio = Number(opts.aspectRatio) > 0 ? Number(opts.aspectRatio) : (radial ? 1 : 2);
            height = Math.round(width / ratio);
        }

        return { width: Math.max(80, Math.round(width)), height: Math.max(60, Math.round(height)) };
    }

    /**
     * Draws the chart: the svg layers, the legend and the data table. The motion tells how the
     * marks arrive: "enter" lets every series grow in, as a load does; "settle" lets a changed
     * chart ease into its new state, as a legend toggle or a data update does; null draws at
     * once, as a resize does, where any movement would only distract.
     * @param {string|null} motion - "enter", "settle" or null.
     * @param {string|null} [enterKey] - The legend key of a series shown again, which enters
     *     while the rest settles.
     */
    _render(motion, enterKey) {
        this._ensureSkeleton();
        this._motion = motion;
        this._enterKey = enterKey || null;
        // a chart drawn before its host has a size enters once the layout gives it one, since
        // an entry played off screen would never be seen
        this._pendingEntry = motion === "enter" && !this._width && !this._plot.clientWidth;

        const type = this._typeOf();
        const title = this._title();
        this._titleEl.textContent = title;
        this._titleEl.hidden = !title;

        const { width, height } = this._measure(type);
        this._size = { width: width, height: height };

        // the targets of the previous drawing still own the highlight, so it goes first
        this._hideTip();
        this._targets = [];
        this._locate = () => -1;
        this._center = null;
        // the trend values per dataset index, which the data table reads after the drawing
        this._trendValues = new Map();

        const svg = this._chart;
        svg.replaceChildren();
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("height", String(height));
        svg.setAttribute("aria-label", title || this._i18n("webexpress.webui:chart", "Chart"));

        const entering = motion === "enter";
        const layers = {
            defs: this._svg("defs", {}, svg),
            grid: this._svg("g", { class: "wx-chart-grid" + (entering ? " wx-chart-enter-fade" : "") }, svg),
            overlay: this._svg("g", { class: "wx-chart-overlay" }, svg),
            series: this._svg("g", { class: "wx-chart-series" + (motion === "settle" ? " wx-chart-settle" : "") }, svg),
            axes: this._svg("g", { class: "wx-chart-axes" + (entering ? " wx-chart-enter-fade" : "") }, svg)
        };
        this._overlay = layers.overlay;

        if (!this._hasData()) {
            this._text(this._i18n("webexpress.webui:chart.empty", "No data"), {
                class: "wx-chart-empty", x: width / 2, y: height / 2, "text-anchor": "middle", "dominant-baseline": "middle"
            }, layers.axes);
        } else if (type === "pie" || type === "doughnut") {
            this._renderPie(layers, width, height, type);
        } else if (type === "polarArea") {
            this._renderPolar(layers, width, height);
        } else if (type === "radar") {
            this._renderRadar(layers, width, height);
        } else if (type === "scatter" || type === "bubble") {
            this._renderScatter(layers, width, height, type);
        } else {
            this._renderCategory(layers, width, height, type);
        }

        this._renderLegend(type);
        this._renderTable(type);
    }

    /**
     * Tells whether any dataset holds a point.
     * @returns {boolean} True when there is something to draw.
     */
    _hasData() {
        return this._series().some((s) => this._dataOf(s.ds).length > 0);
    }

    /**
     * Lets a mark enter when the chart enters, or when its series is shown again. The motion
     * itself lives in the stylesheet, so a reader who asks for reduced motion is spared it.
     * @param {SVGElement} el - The mark.
     * @param {string} kind - grow-up, grow-down, grow-left, grow-right, draw, fade, pop, radial or scale.
     * @param {number} delay - The delay in milliseconds, which staggers the marks.
     * @param {string} key - The legend key of the mark's series or slice.
     * @param {{x: number, y: number}} [origin] - The center a radial or scaling entry starts from.
     * @returns {SVGElement} The mark.
     */
    _animate(el, kind, delay, key, origin) {
        if (this._motion !== "enter" && key !== this._enterKey) {
            return el;
        }
        if (kind === "draw") {
            // a path length of one lets the dash offset run from 1 to 0 whatever the real length
            el.setAttribute("pathLength", "1");
        }
        el.classList.add("wx-chart-enter-" + kind);
        if (delay > 0) {
            el.style.setProperty("--wx-chart-delay", Math.round(delay) + "ms");
        }
        if (origin) {
            el.style.transformOrigin = `${origin.x}px ${origin.y}px`;
        }
        return el;
    }

    /**
     * Returns the delay of the n-th mark of a series, so a series enters from its first mark to
     * its last within the same time, however many marks it has.
     * @param {number} n - The position of the mark.
     * @param {number} count - The number of marks.
     * @returns {number} The delay in milliseconds.
     */
    _stagger(n, count) {
        return count > 1 ? webexpress.webui.ChartCtrl.STAGGER * n / (count - 1) : 0;
    }

    /**
     * Defines the gradient an area fades out with towards its baseline and returns its url. The
     * id carries the instance number, as the same chart may be on a page twice.
     * @param {Element} defs - The defs element of the drawing.
     * @param {Object} paint - The paint of the series.
     * @param {number} index - The index of the series.
     * @param {boolean} downwards - Whether the area hangs below its line.
     * @returns {string} The url() of the gradient.
     */
    _areaGradient(defs, paint, index, downwards) {
        const id = `wx-chart-${this._uid}-area-${index}`;
        const gradient = this._svg("linearGradient", { id: id, class: "wx-chart-gradient", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        gradient.classList.add(paint.cls);
        this._svg("stop", { offset: "0", class: downwards ? "wx-chart-gradient-strong" : "wx-chart-gradient-weak" }, gradient);
        this._svg("stop", { offset: "1", class: downwards ? "wx-chart-gradient-weak" : "wx-chart-gradient-strong" }, gradient);
        return `url(#${id})`;
    }

    /**
     * Normalizes the trendline option of a dataset: true or "linear" for a least squares line,
     * "movingAverage" (or "moving-average") with a period for a smoothed course.
     * @param {Object} ds - The dataset.
     * @returns {{type: string, period: number, color: string|null}|null} The trend, or null for none.
     */
    _trendOf(ds) {
        let trend = ds.trendline;
        if (!trend) {
            return null;
        }
        if (trend === true || typeof trend === "string") {
            trend = { type: trend === true ? "linear" : trend };
        }
        const type = String(trend.type || "linear").replace(/-([a-z])/g, (m, c) => c.toUpperCase());
        if (type !== "linear" && type !== "movingAverage") {
            return null;
        }
        return { type: type, period: Math.max(2, parseInt(trend.period, 10) || 3), color: trend.color || null };
    }

    /**
     * Computes the trendline of a dataset through its points.
     * @param {Object} ds - The dataset.
     * @param {Array<{x: number, y: number}>} points - The points, x being the category index or
     *     the x value.
     * @returns {{points: Array<{x: number, y: number}>, valueAt: function(number): (number|null), trend: Object}|null}
     *     The points the line runs through and its value at an x, or null without a trend.
     */
    _trendline(ds, points) {
        const Chart = webexpress.webui.ChartCtrl;
        const trend = this._trendOf(ds);
        if (!trend || points.length < 2) {
            return null;
        }
        const sorted = points.slice().sort((a, b) => a.x - b.x);

        if (trend.type === "movingAverage") {
            const averages = Chart.movingAverage(sorted.map((p) => p.y), trend.period);
            const line = [];
            const byX = new Map();
            averages.forEach((v, j) => {
                if (v !== null) {
                    line.push({ x: sorted[j].x, y: v });
                    byX.set(sorted[j].x, v);
                }
            });
            return line.length >= 2 ? { points: line, valueAt: (x) => (byX.has(x) ? byX.get(x) : null), trend: trend } : null;
        }

        const fit = Chart.linearRegression(sorted);
        if (!fit) {
            return null;
        }
        const first = sorted[0].x;
        const last = sorted[sorted.length - 1].x;
        const at = (x) => fit.intercept + fit.slope * x;
        return {
            points: [{ x: first, y: at(first) }, { x: last, y: at(last) }],
            valueAt: (x) => (x >= first && x <= last ? at(x) : null),
            trend: trend
        };
    }

    /**
     * Draws a trendline: dashed, in a shade of its series, after the series has entered.
     * @param {Element} layer - The layer to draw into.
     * @param {Object} fit - The trendline from _trendline().
     * @param {function({x: number, y: number}): {x: number, y: number}} toPx - Maps a point to the drawing.
     * @param {Object} paint - The paint of the series.
     * @param {string} key - The legend key of the series.
     * @param {number} delay - The entry delay in milliseconds.
     * @param {boolean} halo - Whether a ring of the surface lifts the line off the bars beneath.
     */
    _drawTrend(layer, fit, toPx, paint, key, delay, halo) {
        const d = fit.points.map((p, j) => {
            const q = toPx(p);
            return (j === 0 ? "M" : "L") + q.x + "," + q.y;
        }).join(" ");
        if (halo) {
            this._animate(this._svg("path", { class: "wx-chart-trend-halo", d: d }, layer), "fade", delay, key);
        }
        const path = this._applyPaint(this._svg("path", { class: "wx-chart-trend", d: d }, layer), paint);
        if (fit.trend.color) {
            path.style.setProperty("--wx-chart-trend-color", fit.trend.color);
        }
        this._animate(path, "fade", delay, key);
    }

    /**
     * Draws a line or bar chart over a category axis, vertical or - with indexAxis "y" - as
     * horizontal bars. A dataset may switch between bar and line with its own type, which mixes
     * both forms on one category axis. A vertical chart measures the datasets whose yAxisID
     * names another scale than "y" on a second value axis at the right edge, so that series of
     * different magnitude - a count and a percentage - stay readable side by side.
     * @param {Object} layers - The svg layers.
     * @param {number} width - The width of the drawing.
     * @param {number} height - The height of the drawing.
     * @param {string} type - The chart type, "line" or "bar".
     */
    _renderCategory(layers, width, height, type) {
        const Chart = webexpress.webui.ChartCtrl;
        const font = Chart.FONT_SIZE;
        const opts = this._config.options || {};
        const scales = opts.scales || {};
        const horizontal = type === "bar" && opts.indexAxis === "y";
        const catOpts = (horizontal ? scales.y : scales.x) || {};
        const valId = horizontal ? "x" : "y";
        const valOpts = scales[valId] || {};
        const xTitle = this._axisTitle(scales.x);
        const yTitle = this._axisTitle(scales.y);
        const labels = this._labels();
        const series = this._series().filter((s) => s.visible);
        const kinds = series.map((s) => (s.ds.type === "bar" || s.ds.type === "line" ? s.ds.type : type));
        // horizontal bars keep a single value axis, whose twin would have to run along the top
        const secondId = horizontal ? null : (series.map((s) => s.ds.yAxisID).find((id) => id && id !== valId) || null);
        const axes = series.map((s) => (secondId !== null && s.ds.yAxisID === secondId ? secondId : valId));
        const hasBars = kinds.includes("bar");
        const stacked = valOpts.stacked === true || catOpts.stacked === true;
        const count = Math.max(labels.length, ...series.map((s) => this._dataOf(s.ds).length), 0);
        const labelOf = (i) => (labels[i] != null ? String(labels[i]) : "");

        // value spans per dataset and category; stacked spans start where the previous ended,
        // and every value axis keeps its own stacks, as their units need not agree
        const spans = series.map(() => []);
        const acc = {};
        const outer = {};
        series.forEach((s, k) => {
            const data = this._dataOf(s.ds);
            const sums = acc[axes[k] + ":" + kinds[k]] || (acc[axes[k] + ":" + kinds[k]] = { pos: [], neg: [] });
            const tops = outer[axes[k]] || (outer[axes[k]] = { pos: [], neg: [] });
            for (let i = 0; i < count; i++) {
                const v = this._valueOf(data[i]);
                if (v === null) {
                    spans[k][i] = null;
                    continue;
                }
                if (stacked) {
                    const side = v >= 0 ? "pos" : "neg";
                    const from = sums[side][i] || 0;
                    sums[side][i] = from + v;
                    spans[k][i] = { from: from, to: from + v, value: v };
                    if (kinds[k] === "bar") {
                        tops[side][i] = k;
                    }
                } else {
                    spans[k][i] = { from: null, to: v, value: v };
                }
            }
        });

        // a trend runs through the plotted values, so a stacked series trends at its stacked height
        const trends = series.map((s, k) => this._trendline(s.ds, spans[k]
            .map((sp, i) => (sp ? { x: i, y: sp.to } : null))
            .filter((p) => p !== null)));

        // the data range of one value axis, widened by its options
        const extent = (id) => {
            const axisOpts = scales[id] || {};
            let dataMin = Infinity;
            let dataMax = -Infinity;
            spans.forEach((list, k) => {
                if (axes[k] !== id) {
                    return;
                }
                for (const sp of list) {
                    if (sp) {
                        const from = sp.from === null ? sp.to : sp.from;
                        dataMin = Math.min(dataMin, sp.to, from);
                        dataMax = Math.max(dataMax, sp.to, from);
                    }
                }
            });
            // the scale makes room for a linear trend running past the data at its ends
            trends.forEach((fit, k) => {
                for (const p of (fit && axes[k] === id ? fit.points : [])) {
                    dataMin = Math.min(dataMin, p.y);
                    dataMax = Math.max(dataMax, p.y);
                }
            });
            if (!isFinite(dataMin)) {
                dataMin = 0;
                dataMax = 1;
            }
            if (isFinite(axisOpts.suggestedMin)) {
                dataMin = Math.min(dataMin, axisOpts.suggestedMin);
            }
            if (isFinite(axisOpts.suggestedMax)) {
                dataMax = Math.max(dataMax, axisOpts.suggestedMax);
            }
            // bars grow from zero, so a bar axis starts at zero unless the author says otherwise
            const axisBars = kinds.some((kind, k) => kind === "bar" && axes[k] === id);
            if (axisOpts.beginAtZero === true || (axisOpts.beginAtZero !== false && axisBars)) {
                dataMin = Math.min(dataMin, 0);
                dataMax = Math.max(dataMax, 0);
            }
            return {
                min: dataMin,
                max: dataMax,
                fixedMin: isFinite(axisOpts.min) ? Number(axisOpts.min) : null,
                fixedMax: isFinite(axisOpts.max) ? Number(axisOpts.max) : null
            };
        };
        const niceScaleOf = (id, ticks) => {
            const e = extent(id);
            return Chart.niceScale(e.min, e.max, ticks, e.fixedMin, e.fixedMax);
        };
        const tickWidthOf = (sc) => Math.max(0, ...sc.ticks.map((t) => this._textWidth(this._format(t, sc.step))));
        const secondTitle = secondId !== null ? this._axisTitle(scales[secondId]) : "";

        // layout: the margins hold the tick labels and the axis titles
        const catTexts = [];
        for (let i = 0; i < count; i++) {
            catTexts.push(labelOf(i));
        }
        const catWidth = Math.max(0, ...catTexts.map((t) => this._textWidth(t)));
        const top = 10;
        let right = 12;
        const bottom = font + 14 + (xTitle ? font + 10 : 0);
        let left;
        let scale;
        let second = null;
        if (horizontal) {
            left = Math.min(catWidth, width * 0.35) + 10 + (yTitle ? font + 10 : 0);
            const plotWidth = Math.max(10, width - left - right);
            scale = niceScaleOf(valId, Math.floor(plotWidth / 80) + 1);
            right = Math.max(right, this._textWidth(this._format(scale.max, scale.step)) / 2 + 4);
        } else {
            const plotHeight = Math.max(10, height - top - bottom);
            scale = niceScaleOf(valId, Math.floor(plotHeight / 40) + 1);
            left = tickWidthOf(scale) + 10 + (yTitle ? font + 10 : 0);
            if (secondId !== null) {
                second = niceScaleOf(secondId, Math.floor(plotHeight / 40) + 1);
                right = tickWidthOf(second) + 10 + (secondTitle ? font + 10 : 0);
            }
        }
        const offset = hasBars || catOpts.offset === true;
        if (!horizontal && !offset && count > 0) {
            // a line chart puts its first and last label on the plot edges
            left = Math.max(left, this._textWidth(catTexts[0]) / 2 + 4);
            right = Math.max(right, this._textWidth(catTexts[count - 1]) / 2 + 4);
        }
        const plot = { x: left, y: top, w: Math.max(10, width - left - right), h: Math.max(10, height - top - bottom) };

        // clip the geometry after mapping values so fixed bounds do not change slopes or stacked spans
        const clipId = `wx-chart-${this._uid}-plot`;
        const clip = this._svg("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" }, layers.defs);
        this._svg("rect", { x: plot.x, y: plot.y, width: plot.w, height: plot.h }, clip);
        layers.series.setAttribute("clip-path", `url(#${clipId})`);

        const scaleOf = { [valId]: scale };
        if (second) {
            scaleOf[secondId] = second;
        }
        const clampTo = (sc, v) => Math.min(sc.max, Math.max(sc.min, v));
        const vPxOn = (id, v) => {
            const sc = scaleOf[id];
            const ratio = (v - sc.min) / (sc.max - sc.min || 1);
            return horizontal ? plot.x + plot.w * ratio : plot.y + plot.h * (1 - ratio);
        };
        const vPx = (v) => vPxOn(valId, v);
        const catLen = horizontal ? plot.h : plot.w;
        const catStart = horizontal ? plot.y : plot.x;
        const slot = count > 0 ? catLen / count : catLen;
        const cPx = (i) => (offset
            ? catStart + slot * (i + 0.5)
            : catStart + (count > 1 ? catLen * i / (count - 1) : catLen / 2));
        const at = (i, v, id = valId) => (horizontal ? { x: vPxOn(id, v), y: cPx(i) } : { x: cPx(i), y: vPxOn(id, v) });
        const baseOf = (id) => clampTo(scaleOf[id], 0);

        // value grid and ticks
        const showGrid = !(valOpts.grid && valOpts.grid.display === false);
        for (const t of scale.ticks) {
            const p = vPx(t);
            if (showGrid) {
                this._svg("line", horizontal
                    ? { x1: p, y1: plot.y, x2: p, y2: plot.y + plot.h }
                    : { x1: plot.x, y1: p, x2: plot.x + plot.w, y2: p }, layers.grid);
            }
            const text = this._format(t, scale.step);
            if (horizontal) {
                this._text(text, { class: "wx-chart-tick", x: p, y: plot.y + plot.h + font + 4, "text-anchor": "middle" }, layers.axes);
            } else {
                this._text(text, { class: "wx-chart-tick", x: plot.x - 8, y: p, "text-anchor": "end", "dominant-baseline": "middle" }, layers.axes);
            }
        }
        // the second axis draws no grid of its own, whose lines would cross the first one's
        if (second) {
            for (const t of second.ticks) {
                this._text(this._format(t, second.step), {
                    class: "wx-chart-tick wx-chart-tick-secondary", x: plot.x + plot.w + 8, y: vPxOn(secondId, t),
                    "text-anchor": "start", "dominant-baseline": "middle"
                }, layers.axes);
            }
            if (secondTitle) {
                const x = width - 12;
                const y = plot.y + plot.h / 2;
                this._text(secondTitle, {
                    class: "wx-chart-axis-title", x: x, y: y, "text-anchor": "middle", "dominant-baseline": "middle",
                    transform: `rotate(90 ${x} ${y})`
                }, layers.axes);
            }
        }
        if (scale.min < 0 && scale.max > 0) {
            const z = vPx(0);
            this._svg("line", horizontal
                ? { class: "wx-chart-zero", x1: z, y1: plot.y, x2: z, y2: plot.y + plot.h }
                : { class: "wx-chart-zero", x1: plot.x, y1: z, x2: plot.x + plot.w, y2: z }, layers.axes);
        }
        this._svg("line", horizontal
            ? { class: "wx-chart-axis-line", x1: plot.x, y1: plot.y, x2: plot.x, y2: plot.y + plot.h }
            : { class: "wx-chart-axis-line", x1: plot.x, y1: plot.y + plot.h, x2: plot.x + plot.w, y2: plot.y + plot.h }, layers.axes);

        // category labels; a crowded axis shows every n-th label
        const pitch = offset ? slot : (count > 1 ? catLen / (count - 1) : catLen);
        const every = Math.max(1, Math.ceil((horizontal ? font + 4 : catWidth + 8) / Math.max(1, pitch)));
        for (let i = 0; i < count; i += every) {
            const p = cPx(i);
            if (horizontal) {
                this._text(this._fit(catTexts[i], plot.x - 10 - (yTitle ? font + 10 : 0)), {
                    class: "wx-chart-tick", x: plot.x - 8, y: p, "text-anchor": "end", "dominant-baseline": "middle"
                }, layers.axes);
            } else {
                this._text(catTexts[i], { class: "wx-chart-tick", x: p, y: plot.y + plot.h + font + 4, "text-anchor": "middle" }, layers.axes);
            }
        }
        this._axisTitles(layers, plot, height, xTitle, yTitle);

        // bars
        const marks = [];
        const barSeries = [];
        kinds.forEach((kind, k) => {
            if (kind === "bar") {
                barSeries.push(k);
            }
        });
        // stacked bars form one stack per value axis, side by side like unstacked groups
        const barAxes = [...new Set(barSeries.map((k) => axes[k]))];
        const groups = stacked ? barAxes.length : barSeries.length;
        barSeries.forEach((k, g) => {
            const s = series[k];
            const id = axes[k];
            const limit = Number(s.ds.maxBarThickness || opts.maxBarThickness) || Chart.MAX_BAR_THICKNESS;
            const thick = Math.max(1, Math.min((slot * 0.8 - (groups - 1) * Chart.BAR_GAP) / groups, limit));
            const total = groups * thick + (groups - 1) * Chart.BAR_GAP;
            const shift = (stacked ? barAxes.indexOf(id) : g) * (thick + Chart.BAR_GAP);
            spans[k].forEach((sp, i) => {
                if (!sp) {
                    return;
                }
                const start = cPx(i) - total / 2 + shift;
                const from = vPxOn(id, sp.from === null ? baseOf(id) : sp.from);
                const to = vPxOn(id, sp.to);
                const round = !stacked || outer[id][sp.value >= 0 ? "pos" : "neg"][i] === k;
                const path = this._barPath(horizontal, start, thick, from, to, round, stacked);
                if (path) {
                    const bar = this._svg("path", { class: "wx-chart-mark wx-chart-bar", d: path }, layers.series);
                    this._applyPaint(bar, this._paint(s.ds, s.index, i));
                    // a bar grows out of its baseline; stacked segments pile up one after another
                    const grow = horizontal ? (to >= from ? "grow-right" : "grow-left") : (to <= from ? "grow-up" : "grow-down");
                    this._animate(bar, grow, this._stagger(i, count) + g * (stacked ? 160 : 50), "d" + s.index);
                    (marks[i] || (marks[i] = [])).push(bar);
                }
            });
        });

        // lines, their areas and points
        const dense = catLen / Math.max(1, count) < 6;
        series.forEach((s, k) => {
            if (kinds[k] !== "line") {
                return;
            }
            const ds = s.ds;
            const paint = this._paint(ds, s.index, 0);
            const segments = [];
            let current = [];
            spans[k].forEach((sp, i) => {
                if (sp) {
                    current.push(i);
                } else if (!ds.spanGaps && current.length) {
                    segments.push(current);
                    current = [];
                }
            });
            if (current.length) {
                segments.push(current);
            }

            const fill = this._fillMode(ds.fill);
            const curve = this._curveOf(ds);
            const key = "d" + s.index;
            // the series after the first follow a little later, so the lines draw one by one
            const lag = k * 120;
            for (const seg of segments) {
                const points = seg.map((i) => at(i, spans[k][i].to, axes[k]));
                if (fill) {
                    const sc = scaleOf[axes[k]];
                    const edge = fill === "start" ? sc.min : fill === "end" ? sc.max : baseOf(axes[k]);
                    const stackedEdge = stacked && fill === "origin";
                    const lower = seg.map((i) => at(i, stackedEdge ? spans[k][i].from : edge, axes[k])).reverse();
                    // a stacked area rests on the curve of the series beneath, a filled one on a straight edge
                    const back = stackedEdge
                        ? " L" + this._linePath(lower, curve, plot, horizontal).slice(1)
                        : lower.map((p) => ` L${p.x},${p.y}`).join("");
                    const d = this._linePath(points, curve, plot, horizontal) + back + " Z";
                    const area = this._applyPaint(this._svg("path", { class: "wx-chart-area", d: d }, layers.series), paint);
                    if (!paint.fill && !horizontal) {
                        area.style.fill = this._areaGradient(layers.defs, paint, s.index, fill !== "end");
                    }
                    this._animate(area, "fade", 450 + lag, key);
                }
                if (ds.showLine !== false) {
                    const line = this._svg("path", { class: "wx-chart-line", d: this._linePath(points, curve, plot, horizontal) }, layers.series);
                    this._animate(this._applyPaint(line, paint), "draw", lag, key);
                }
            }

            const style = ds.pointStyle === undefined ? "circle" : ds.pointStyle;
            const radius = ds.pointRadius != null ? Number(ds.pointRadius) : 4;
            if (style !== false && style !== "none" && radius > 0 && !dense) {
                spans[k].forEach((sp, i) => {
                    if (sp) {
                        const p = at(i, sp.to, axes[k]);
                        const marker = this._applyPaint(this._marker(style, p.x, p.y, radius, layers.series), this._paint(ds, s.index, i));
                        // a point appears as the drawing line reaches it
                        this._animate(marker, "pop", lag + (count > 1 ? 800 * i / (count - 1) : 0), key);
                    }
                });
            }
        });

        // the trendlines go over every series, so a trend stays visible across the bars
        const trendName = this._i18n("webexpress.webui:chart.trend", "Trend");
        trends.forEach((fit, k) => {
            if (fit) {
                const s = series[k];
                this._trendValues.set(s.index, fit.valueAt);
                this._drawTrend(layers.series, fit, (p) => at(p.x, p.y, axes[k]), this._paint(s.ds, s.index, 0), "d" + s.index, 900 + k * 120, hasBars);
            }
        });

        // one hover target per category, holding every dataset's value
        for (let i = 0; i < count; i++) {
            const rows = [];
            series.forEach((s, k) => {
                const sp = spans[k][i];
                if (sp) {
                    rows.push({
                        name: this._seriesName(s.ds, s.index),
                        value: this._format(sp.value),
                        paint: this._paint(s.ds, s.index, i),
                        line: kinds[k] === "line",
                        pos: at(i, sp.to, axes[k])
                    });
                }
                const trendValue = trends[k] ? trends[k].valueAt(i) : null;
                if (trendValue !== null) {
                    rows.push({
                        name: this._seriesName(s.ds, s.index) + " \u00b7 " + trendName,
                        value: this._formatTrend(trendValue),
                        paint: this._paint(s.ds, s.index, 0),
                        line: true,
                        trend: true,
                        pos: at(i, trendValue, axes[k])
                    });
                }
            });
            if (!rows.length) {
                continue;
            }
            const c = cPx(i);
            const anchor = horizontal
                ? { x: Math.max(...rows.map((r) => r.pos.x)), y: c }
                : { x: c, y: Math.min(...rows.map((r) => r.pos.y)) };
            anchor.x = Math.min(plot.x + plot.w, Math.max(plot.x, anchor.x));
            anchor.y = Math.min(plot.y + plot.h, Math.max(plot.y, anchor.y));
            const guide = hasBars
                ? { band: horizontal ? { x: plot.x, y: c - slot / 2, w: plot.w, h: slot } : { x: c - slot / 2, y: plot.y, w: slot, h: plot.h } }
                : { line: horizontal ? { x1: plot.x, y1: c, x2: plot.x + plot.w, y2: c } : { x1: c, y1: plot.y, x2: c, y2: plot.y + plot.h } };
            this._targets.push({
                title: labelOf(i),
                rows: rows,
                anchor: anchor,
                guide: guide,
                dots: rows.filter((r) => r.line && !r.trend &&
                    r.pos.x >= plot.x && r.pos.x <= plot.x + plot.w && r.pos.y >= plot.y && r.pos.y <= plot.y + plot.h),
                marks: marks[i] || [],
                at: c
            });
        }

        this._locate = (x, y) => {
            if (x < plot.x - 4 || x > plot.x + plot.w + 4 || y < plot.y - 4 || y > plot.y + plot.h + 4) {
                return -1;
            }
            const q = horizontal ? y : x;
            let best = -1;
            let distance = Infinity;
            this._targets.forEach((t, n) => {
                const d = Math.abs(t.at - q);
                if (d < distance) {
                    distance = d;
                    best = n;
                }
            });
            return offset && distance > slot / 2 ? -1 : best;
        };
    }

    /**
     * Draws a scatter or bubble chart over two linear axes.
     * @param {Object} layers - The svg layers.
     * @param {number} width - The width of the drawing.
     * @param {number} height - The height of the drawing.
     * @param {string} type - The chart type, "scatter" or "bubble".
     */
    _renderScatter(layers, width, height, type) {
        const Chart = webexpress.webui.ChartCtrl;
        const font = Chart.FONT_SIZE;
        const scales = (this._config.options || {}).scales || {};
        const xOpts = scales.x || {};
        const yOpts = scales.y || {};
        const xTitle = this._axisTitle(xOpts);
        const yTitle = this._axisTitle(yOpts);
        const series = this._series().filter((s) => s.visible);
        const bubble = type === "bubble";
        const fixed = (v) => (isFinite(v) ? Number(v) : null);

        const points = series.map((s) => this._dataOf(s.ds).map((p, i) => this._pointOf(p, i)));
        const xs = [];
        const ys = [];
        points.forEach((list) => list.forEach((p) => {
            if (p) {
                xs.push(p.x);
                ys.push(p.y);
            }
        }));
        const trends = series.map((s, k) => this._trendline(s.ds, points[k].filter((p) => p !== null)));
        trends.forEach((fit) => (fit ? fit.points : []).forEach((p) => ys.push(p.y)));
        // a mark on the edge of the scale would sit half outside the plot; a little grace keeps
        // it inside, more for bubbles because of their radius
        const range = (values, axis) => {
            let lo = values.length ? Math.min(...values) : 0;
            let hi = values.length ? Math.max(...values) : 1;
            const grace = (hi - lo || Math.abs(hi) || 1) * (bubble ? 0.15 : 0.05);
            lo -= grace;
            hi += grace;
            if (axis.beginAtZero === true) {
                lo = Math.min(lo, 0);
                hi = Math.max(hi, 0);
            }
            return [lo, hi];
        };
        const [xLo, xHi] = range(xs, xOpts);
        const [yLo, yHi] = range(ys, yOpts);

        const top = 10;
        const bottom = font + 14 + (xTitle ? font + 10 : 0);
        const plotHeight = Math.max(10, height - top - bottom);
        const yScale = Chart.niceScale(yLo, yHi, Math.floor(plotHeight / 40) + 1, fixed(yOpts.min), fixed(yOpts.max));
        const tickWidth = Math.max(0, ...yScale.ticks.map((t) => this._textWidth(this._format(t, yScale.step))));
        const left = tickWidth + 10 + (yTitle ? font + 10 : 0);
        let xScale = Chart.niceScale(xLo, xHi, Math.floor((width - left - 12) / 80) + 1, fixed(xOpts.min), fixed(xOpts.max));
        const right = Math.max(12, this._textWidth(this._format(xScale.max, xScale.step)) / 2 + 4);
        const plot = { x: left, y: top, w: Math.max(10, width - left - right), h: plotHeight };
        xScale = Chart.niceScale(xLo, xHi, Math.floor(plot.w / 80) + 1, fixed(xOpts.min), fixed(xOpts.max));

        const xPx = (v) => plot.x + plot.w * (v - xScale.min) / (xScale.max - xScale.min || 1);
        const yPx = (v) => plot.y + plot.h * (1 - (v - yScale.min) / (yScale.max - yScale.min || 1));

        for (const t of yScale.ticks) {
            const p = yPx(t);
            this._svg("line", { x1: plot.x, y1: p, x2: plot.x + plot.w, y2: p }, layers.grid);
            this._text(this._format(t, yScale.step), { class: "wx-chart-tick", x: plot.x - 8, y: p, "text-anchor": "end", "dominant-baseline": "middle" }, layers.axes);
        }
        for (const t of xScale.ticks) {
            const p = xPx(t);
            this._svg("line", { x1: p, y1: plot.y, x2: p, y2: plot.y + plot.h }, layers.grid);
            this._text(this._format(t, xScale.step), { class: "wx-chart-tick", x: p, y: plot.y + plot.h + font + 4, "text-anchor": "middle" }, layers.axes);
        }
        this._svg("line", { class: "wx-chart-axis-line", x1: plot.x, y1: plot.y + plot.h, x2: plot.x + plot.w, y2: plot.y + plot.h }, layers.axes);
        this._axisTitles(layers, plot, height, xTitle, yTitle);

        series.forEach((s, k) => {
            const ds = s.ds;
            points[k].forEach((p, i) => {
                if (!p) {
                    return;
                }
                const cx = xPx(p.x);
                const cy = yPx(p.y);
                const paint = this._paint(ds, s.index, i);
                let r;
                let mark;
                if (bubble) {
                    r = Math.max(1, p.r !== null ? p.r : Number(ds.radius) || 4);
                    mark = this._svg("circle", { class: "wx-chart-mark wx-chart-bubble", cx: cx, cy: cy, r: r }, layers.series);
                } else {
                    r = ds.pointRadius != null ? Number(ds.pointRadius) : 5;
                    mark = this._marker(ds.pointStyle || "circle", cx, cy, r, layers.series);
                    mark.classList.add("wx-chart-mark", "wx-chart-dot");
                }
                this._applyPaint(mark, paint);
                this._animate(mark, "pop", this._stagger(i, points[k].length) + k * 120, "d" + s.index);

                const coords = [this._format(p.x), this._format(p.y)];
                if (bubble && p.r !== null) {
                    coords.push(this._format(p.r));
                }
                this._targets.push({
                    title: "",
                    rows: [{ name: this._seriesName(ds, s.index), value: "(" + coords.join(", ") + ")", paint: paint }],
                    anchor: { x: cx, y: cy - r },
                    dots: [],
                    marks: [mark],
                    hit: { x: cx, y: cy, r: Math.max(r + 4, 10) }
                });
            });
        });

        trends.forEach((fit, k) => {
            if (fit) {
                const s = series[k];
                this._drawTrend(layers.series, fit, (p) => ({ x: xPx(p.x), y: yPx(p.y) }), this._paint(s.ds, s.index, 0), "d" + s.index, 700 + k * 120, false);
            }
        });

        this._locate = (x, y) => {
            let best = -1;
            let distance = Infinity;
            this._targets.forEach((t, n) => {
                const d = Math.hypot(t.hit.x - x, t.hit.y - y);
                if (d <= t.hit.r && d < distance) {
                    distance = d;
                    best = n;
                }
            });
            return best;
        };
    }

    /**
     * Draws a pie or doughnut chart. Several datasets become concentric rings, the first one
     * outermost; a slice hidden through the legend is left out of every ring.
     * @param {Object} layers - The svg layers.
     * @param {number} width - The width of the drawing.
     * @param {number} height - The height of the drawing.
     * @param {string} type - The chart type, "pie" or "doughnut".
     */
    _renderPie(layers, width, height, type) {
        const opts = this._config.options || {};
        const labels = this._labels();
        const series = this._series().filter((s) => s.visible);
        const cx = width / 2;
        const cy = height / 2;
        // the margin leaves room for a hovered slice to step out of the circle
        const radius = Math.max(10, Math.min(width, height) / 2 - 10);
        const cutout = opts.cutout !== undefined ? opts.cutout : (type === "doughnut" ? "50%" : 0);
        const inner = typeof cutout === "string" && cutout.trim().endsWith("%")
            ? radius * Math.min(95, Math.max(0, parseFloat(cutout))) / 100
            : Math.min(radius * 0.95, Math.max(0, Number(cutout) || 0));
        const ring = (radius - inner) / Math.max(1, series.length);
        const start = -Math.PI / 2 + (Number(opts.rotation) || 0) * Math.PI / 180;
        const sweep = Math.PI * 2 * Math.min(360, Math.max(0, opts.circumference != null ? Number(opts.circumference) : 360)) / 360;

        // a single ring with room in its hole names its total there, and the share of the
        // hovered slice while one is hovered
        const centered = series.length === 1 && inner >= 36;

        series.forEach((s, d) => {
            const r1 = radius - d * ring;
            const r0 = r1 - ring;
            const values = this._dataOf(s.ds).map((p) => this._valueOf(p));
            const total = values.reduce((sum, v, i) => sum + (v > 0 && this._isVisible("l" + i) ? v : 0), 0);
            const shown = values.filter((v, i) => v > 0 && this._isVisible("l" + i)).length;
            let angle = start;
            let n = 0;
            values.forEach((v, i) => {
                if (!(v > 0) || !this._isVisible("l" + i) || total <= 0) {
                    return;
                }
                const a0 = angle;
                const a1 = angle + sweep * v / total;
                angle = a1;
                const mid = (a0 + a1) / 2;
                const paint = this._paint(s.ds, i, i);
                const slice = this._svg("path", { class: "wx-chart-mark wx-chart-arc", d: this._arcPath(cx, cy, r0, r1, a0, a1), "fill-rule": "evenodd" }, layers.series);
                this._applyPaint(slice, paint);
                // the direction a hovered slice steps out in
                slice.style.setProperty("--wx-chart-dx", (Math.cos(mid) * 6).toFixed(2) + "px");
                slice.style.setProperty("--wx-chart-dy", (Math.sin(mid) * 6).toFixed(2) + "px");
                this._animate(slice, "radial", this._stagger(n++, shown) * 0.6 + d * 120, "l" + i, { x: cx, y: cy });
                // the tooltip sits at the rim, so it leaves the center of a doughnut readable
                const rm = centered ? r1 : r0 + (r1 - r0) * (r0 > 0 ? 0.5 : 0.62);
                const label = labels[i] != null ? String(labels[i]) : "";
                this._targets.push({
                    title: label,
                    rows: [{ name: this._seriesName(s.ds, s.index), value: this._format(v) + " (" + this._percent(v / total) + ")", paint: paint }],
                    anchor: { x: cx + rm * Math.cos(mid), y: cy + rm * Math.sin(mid) },
                    dots: [],
                    marks: [slice],
                    sector: { r0: r0, r1: r1, a0: a0, a1: a1 },
                    center: centered ? { value: this._percent(v / total), label: label } : null
                });
            });

            if (centered && total > 0) {
                const size = Math.max(14, Math.min(30, inner * 0.36));
                const value = this._text("", { class: "wx-chart-center-value", x: cx, y: cy - 2, "text-anchor": "middle", "font-size": size }, layers.axes);
                const caption = this._text("", { class: "wx-chart-center-label", x: cx, y: cy + 6, "text-anchor": "middle", "dominant-baseline": "hanging" }, layers.axes);
                this._center = {
                    value: value,
                    label: caption,
                    width: inner * 1.6,
                    rest: { value: this._format(total), label: this._seriesName(s.ds, s.index) }
                };
                this._setCenter(null);
            }
        });

        this._locate = (x, y) => this._locateSector(cx, cy, x, y);
    }

    /**
     * Writes the center of a doughnut: the share of a hovered slice, or the total at rest.
     * @param {{value: string, label: string}|null} content - The content, null for the total.
     */
    _setCenter(content) {
        const center = this._center;
        if (!center) {
            return;
        }
        const shown = content || center.rest;
        if (center.value.textContent === shown.value && center.shown === shown) {
            return;
        }
        center.shown = shown;
        center.value.textContent = shown.value;
        center.label.textContent = this._fit(shown.label, center.width);
        center.value.classList.remove("wx-chart-center-change");
        // the restart of the animation needs a style flush between removing and adding the class
        void center.value.getBoundingClientRect();
        center.value.classList.add("wx-chart-center-change");
    }

    /**
     * Draws a polar area chart: equal angles per label, the radius showing the value.
     * @param {Object} layers - The svg layers.
     * @param {number} width - The width of the drawing.
     * @param {number} height - The height of the drawing.
     */
    _renderPolar(layers, width, height) {
        const Chart = webexpress.webui.ChartCtrl;
        const opts = this._config.options || {};
        const rOpts = (opts.scales && opts.scales.r) || {};
        const labels = this._labels();
        const series = this._series().filter((entry) => entry.visible);
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.max(10, Math.min(width, height) / 2 - 8);
        if (!series.length) {
            return;
        }

        const values = series.map((s) => this._dataOf(s.ds).map((p) => this._valueOf(p)));
        const count = Math.max(labels.length, ...values.map((data) => data.length));
        const shown = Array.from({ length: count }, (v, i) => i).filter((i) => this._isVisible("l" + i));
        const max = Math.max(0, ...values.flatMap((data) => shown.map((i) => data[i] || 0)));
        const scale = Chart.niceScale(0, max, Math.floor(radius / 35) + 1,
            isFinite(rOpts.min) ? Number(rOpts.min) : 0, isFinite(rOpts.max) ? Number(rOpts.max) : null);
        const rPx = (v) => radius * (Math.min(scale.max, Math.max(scale.min, v)) - scale.min) / (scale.max - scale.min || 1);

        for (const t of scale.ticks) {
            if (t > scale.min) {
                this._svg("circle", { cx: cx, cy: cy, r: rPx(t), fill: "none" }, layers.grid);
            }
        }

        const step = Math.PI * 2 / Math.max(1, shown.length);
        const start = -Math.PI / 2 + (Number(opts.startAngle) || 0) * Math.PI / 180;
        // the first dataset is in front; hit targets follow the same front-to-back order
        for (let k = series.length - 1; k >= 0; k--) {
            const s = series[k];
            const targets = [];
            shown.forEach((i, n) => {
                const v = values[k][i];
                if (v === null || !(v > scale.min)) {
                    return;
                }
                const a0 = start + n * step;
                const a1 = a0 + step;
                const r1 = rPx(v);
                const paint = this._paint(s.ds, i, i);
                const wedge = this._svg("path", { class: "wx-chart-mark wx-chart-polar", d: this._arcPath(cx, cy, 0, r1, a0, a1) }, layers.series);
                this._applyPaint(wedge, paint);
                this._animate(wedge, "scale", this._stagger(n, shown.length) * 0.6, "l" + i, { x: cx, y: cy });
                const mid = (a0 + a1) / 2;
                targets.push({
                    title: labels[i] != null ? String(labels[i]) : "",
                    rows: [{ name: this._seriesName(s.ds, s.index), value: this._format(v), paint: paint }],
                    anchor: { x: cx + r1 * 0.6 * Math.cos(mid), y: cy + r1 * 0.6 * Math.sin(mid) },
                    dots: [],
                    marks: [wedge],
                    sector: { r0: 0, r1: Math.max(r1, 6), a0: a0, a1: a1 }
                });
            });
            this._targets.unshift(...targets);
        }

        // the tick labels sit on the upright radius, haloed against the wedges beneath
        for (const t of scale.ticks) {
            if (t > scale.min) {
                this._text(this._format(t, scale.step), {
                    class: "wx-chart-tick wx-chart-tick-halo", x: cx, y: cy - rPx(t), "text-anchor": "middle", "dominant-baseline": "middle"
                }, layers.axes);
            }
        }

        this._locate = (x, y) => this._locateSector(cx, cy, x, y);
    }

    /**
     * Draws a radar chart: one spoke per label, one polygon per dataset.
     * @param {Object} layers - The svg layers.
     * @param {number} width - The width of the drawing.
     * @param {number} height - The height of the drawing.
     */
    _renderRadar(layers, width, height) {
        const Chart = webexpress.webui.ChartCtrl;
        const font = Chart.FONT_SIZE;
        const opts = this._config.options || {};
        const rOpts = (opts.scales && opts.scales.r) || {};
        const labels = this._labels();
        const series = this._series().filter((s) => s.visible);
        const count = Math.max(labels.length, ...series.map((s) => this._dataOf(s.ds).length), 0);
        const texts = [];
        for (let i = 0; i < count; i++) {
            texts.push(labels[i] != null ? String(labels[i]) : "");
        }
        const labelWidth = Math.min(width * 0.25, Math.max(0, ...texts.map((t) => this._textWidth(t))));
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.max(10, Math.min(width / 2 - labelWidth - 14, height / 2 - font - 20));

        const values = series.map((s) => this._dataOf(s.ds).map((p) => this._valueOf(p)));
        const flat = values.flat().filter((v) => v !== null);
        let lo = flat.length ? Math.min(...flat) : 0;
        const hi = flat.length ? Math.max(...flat) : 1;
        // a radar compares magnitudes, so its scale starts at zero unless the author opts out
        if (rOpts.beginAtZero !== false) {
            lo = Math.min(lo, 0);
        }
        const scale = Chart.niceScale(lo, hi, Math.floor(radius / 30) + 1,
            isFinite(rOpts.min) ? Number(rOpts.min) : null, isFinite(rOpts.max) ? Number(rOpts.max) : null);
        const rPx = (v) => radius * (Math.min(scale.max, Math.max(scale.min, v)) - scale.min) / (scale.max - scale.min || 1);
        const angle = (i) => -Math.PI / 2 + i * Math.PI * 2 / Math.max(1, count);
        const point = (i, r) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });

        for (const t of scale.ticks) {
            if (t > scale.min && count > 2) {
                const ring = [];
                for (let i = 0; i < count; i++) {
                    const p = point(i, rPx(t));
                    ring.push(p.x + "," + p.y);
                }
                this._svg("polygon", { points: ring.join(" "), fill: "none" }, layers.grid);
            }
        }
        for (let i = 0; i < count; i++) {
            const p = point(i, radius);
            this._svg("line", { x1: cx, y1: cy, x2: p.x, y2: p.y }, layers.grid);

            const cos = Math.cos(angle(i));
            const sin = Math.sin(angle(i));
            // a label above or below the center keeps clear of the tick label on the upright spoke
            const l = point(i, radius + (Math.abs(sin) > 0.9 ? 16 : 10));
            this._text(this._fit(texts[i], labelWidth + 4), {
                class: "wx-chart-tick wx-chart-point-label",
                x: l.x,
                y: l.y,
                "text-anchor": cos > 0.1 ? "start" : cos < -0.1 ? "end" : "middle",
                "dominant-baseline": sin > 0.1 ? "hanging" : sin < -0.1 ? "auto" : "middle"
            }, layers.axes);
        }
        for (const t of scale.ticks) {
            if (t > scale.min) {
                this._text(this._format(t, scale.step), {
                    class: "wx-chart-tick wx-chart-tick-halo", x: cx + 4, y: cy - rPx(t), "text-anchor": "start", "dominant-baseline": "middle"
                }, layers.axes);
            }
        }

        series.forEach((s, k) => {
            const paint = this._paint(s.ds, s.index, 0);
            const corners = [];
            for (let i = 0; i < count; i++) {
                const v = values[k][i];
                corners.push(point(i, rPx(v === null || v === undefined ? scale.min : v)));
            }
            const key = "d" + s.index;
            const polygon = this._svg("polygon", { class: "wx-chart-radar", points: corners.map((p) => p.x + "," + p.y).join(" ") }, layers.series);
            this._animate(this._applyPaint(polygon, paint), "scale", k * 150, key, { x: cx, y: cy });
            const pointRadius = s.ds.pointRadius != null ? Number(s.ds.pointRadius) : 3;
            if (s.ds.pointStyle !== false && pointRadius > 0) {
                corners.forEach((p, i) => {
                    const marker = this._marker(s.ds.pointStyle || "circle", p.x, p.y, pointRadius, layers.series);
                    this._animate(this._applyPaint(marker, this._paint(s.ds, s.index, i)), "pop", 450 + k * 150 + this._stagger(i, count) * 0.5, key);
                });
            }
        });

        for (let i = 0; i < count; i++) {
            const rows = [];
            series.forEach((s, k) => {
                const v = values[k][i];
                if (v !== null && v !== undefined) {
                    rows.push({ name: this._seriesName(s.ds, s.index), value: this._format(v), paint: this._paint(s.ds, s.index, 0), line: true, pos: point(i, rPx(v)) });
                }
            });
            if (!rows.length) {
                continue;
            }
            const end = point(i, radius);
            this._targets.push({
                title: texts[i],
                rows: rows,
                anchor: rows.reduce((a, r) => (r.pos.y < a.y ? r.pos : a), rows[0].pos),
                guide: { line: { x1: cx, y1: cy, x2: end.x, y2: end.y } },
                dots: rows,
                marks: [],
                spoke: i
            });
        }

        this._locate = (x, y) => {
            if (count === 0 || Math.hypot(x - cx, y - cy) > radius + 24) {
                return -1;
            }
            const turn = Math.PI * 2;
            const a = Math.atan2(y - cy, x - cx) + Math.PI / 2;
            const spoke = Math.round((((a % turn) + turn) % turn) / (turn / count)) % count;
            return this._targets.findIndex((t) => t.spoke === spoke);
        };
    }

    /**
     * Finds the slice or wedge under a point.
     * @param {number} cx - The center x.
     * @param {number} cy - The center y.
     * @param {number} x - The x of the point.
     * @param {number} y - The y of the point.
     * @returns {number} The index of the target, or -1.
     */
    _locateSector(cx, cy, x, y) {
        const r = Math.hypot(x - cx, y - cy);
        const turn = Math.PI * 2;
        const a = Math.atan2(y - cy, x - cx);
        return this._targets.findIndex((t) => {
            const s = t.sector;
            if (r < s.r0 || r > s.r1) {
                return false;
            }
            // a sector may start before -pi/2 or run past pi; compare within its own turn
            const rel = (((a - s.a0) % turn) + turn) % turn;
            return rel <= s.a1 - s.a0;
        });
    }

    /**
     * Draws the axis titles: the x title centered below the plot, the y title rotated left of it.
     * @param {Object} layers - The svg layers.
     * @param {Object} plot - The plot area { x, y, w, h }.
     * @param {number} height - The height of the drawing.
     * @param {string} xTitle - The x axis title.
     * @param {string} yTitle - The y axis title.
     */
    _axisTitles(layers, plot, height, xTitle, yTitle) {
        if (xTitle) {
            this._text(xTitle, { class: "wx-chart-axis-title", x: plot.x + plot.w / 2, y: height - 4, "text-anchor": "middle" }, layers.axes);
        }
        if (yTitle) {
            const y = plot.y + plot.h / 2;
            this._text(yTitle, {
                class: "wx-chart-axis-title", x: 12, y: y, "text-anchor": "middle", "dominant-baseline": "middle",
                transform: `rotate(-90 12 ${y})`
            }, layers.axes);
        }
    }

    /**
     * Normalizes the fill option of a line dataset.
     * @param {*} fill - The fill option: true, false, "origin", "start" or "end".
     * @returns {string|null} The fill mode, or null for no fill.
     */
    _fillMode(fill) {
        if (fill === true || fill === "origin") {
            return "origin";
        }
        if (fill === "start" || fill === "end") {
            return fill;
        }
        return null;
    }

    /**
     * Reads how a line dataset runs between its points: straight, as a Bezier curve whose
     * tangents follow the neighbouring points, or as a monotone curve.
     * @param {Object} ds - The dataset.
     * @returns {{tension: number, monotone: boolean}} The curve.
     */
    _curveOf(ds) {
        return {
            tension: Math.min(1, Math.max(0, Number(ds.tension) || 0)),
            monotone: ds.cubicInterpolationMode === "monotone"
        };
    }

    /**
     * Builds the path of a line through points: straight, as a Bezier curve or as a monotone
     * curve. Bezier control points are bounded by the plot extended to include the data, so
     * fixed axis limits do not flatten offscreen peaks. A monotone curve never swings past
     * its neighbouring points, so a peak in the drawing is a peak in the data.
     * @param {Array<{x: number, y: number}>} points - The points, in order along the axis.
     * @param {{tension: number, monotone: boolean}|number} curve - The curve, or a bare tension.
     * @param {{x: number, y: number, w: number, h: number}} [bounds] - The plot area the
     *     control points of a Bezier curve stay within, extended to include offscreen data.
     * @param {boolean} [vertical] - Whether the points run along the y axis (horizontal bars).
     * @returns {string} The path data.
     */
    _linePath(points, curve, bounds, vertical) {
        if (!points.length) {
            return "";
        }
        const shape = typeof curve === "number" ? { tension: curve, monotone: false } : (curve || {});
        if (shape.monotone && points.length > 2) {
            return this._monotonePath(points, vertical);
        }

        const limits = bounds ? {
            left: Math.min(bounds.x, ...points.map((p) => p.x)),
            right: Math.max(bounds.x + bounds.w, ...points.map((p) => p.x)),
            top: Math.min(bounds.y, ...points.map((p) => p.y)),
            bottom: Math.max(bounds.y + bounds.h, ...points.map((p) => p.y))
        } : null;
        const clamp = (p) => (limits
            ? { x: Math.min(limits.right, Math.max(limits.left, p.x)), y: Math.min(limits.bottom, Math.max(limits.top, p.y)) }
            : p);
        let d = `M${points[0].x},${points[0].y}`;
        for (let j = 1; j < points.length; j++) {
            const p1 = points[j - 1];
            const p2 = points[j];
            if (shape.tension > 0 && points.length > 2) {
                const p0 = points[j - 2] || p1;
                const p3 = points[j + 1] || p2;
                const k = shape.tension / 2;
                const c1 = clamp({ x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k });
                const c2 = clamp({ x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k });
                d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
            } else {
                d += ` L${p2.x},${p2.y}`;
            }
        }
        return d;
    }

    /**
     * Builds a monotone cubic Bezier path (Fritsch-Carlson): the tangent at a point is flat
     * where the data turns and is limited where it would carry the curve past a neighbour.
     * @param {Array<{x: number, y: number}>} points - The points, in order along the axis.
     * @param {boolean} [vertical] - Whether the points run along the y axis.
     * @returns {string} The path data.
     */
    _monotonePath(points, vertical) {
        // the computation runs along the axis the points follow; a vertical run swaps the roles
        const pts = vertical ? points.map((p) => ({ x: p.y, y: p.x })) : points;
        const n = pts.length;
        const slopes = [];
        for (let i = 0; i < n - 1; i++) {
            const dx = pts[i + 1].x - pts[i].x;
            slopes.push(dx !== 0 ? (pts[i + 1].y - pts[i].y) / dx : 0);
        }
        const tangents = pts.map((p, i) => {
            if (i === 0) {
                return slopes[0];
            }
            if (i === n - 1) {
                return slopes[n - 2];
            }
            return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
        });
        for (let i = 0; i < n - 1; i++) {
            if (slopes[i] === 0) {
                tangents[i] = 0;
                tangents[i + 1] = 0;
                continue;
            }
            const a = tangents[i] / slopes[i];
            const b = tangents[i + 1] / slopes[i];
            const s = a * a + b * b;
            if (s > 9) {
                const t = 3 / Math.sqrt(s);
                tangents[i] = t * a * slopes[i];
                tangents[i + 1] = t * b * slopes[i];
            }
        }

        const out = (x, y) => (vertical ? `${y},${x}` : `${x},${y}`);
        let d = "M" + out(pts[0].x, pts[0].y);
        for (let i = 0; i < n - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const third = (p2.x - p1.x) / 3;
            d += ` C${out(p1.x + third, p1.y + tangents[i] * third)} ${out(p2.x - third, p2.y - tangents[i + 1] * third)} ${out(p2.x, p2.y)}`;
        }
        return d;
    }

    /**
     * Builds the path of a bar: square at the baseline, rounded at the data end.
     * @param {boolean} horizontal - Whether the bar runs horizontally.
     * @param {number} start - The position of the bar across the value axis.
     * @param {number} thick - The thickness of the bar.
     * @param {number} from - The baseline position on the value axis.
     * @param {number} to - The data end position on the value axis.
     * @param {boolean} round - Whether the data end is rounded.
     * @param {boolean} inset - Whether to leave a surface gap between stacked segments.
     * @returns {string|null} The path data, or null for a bar without length.
     */
    _barPath(horizontal, start, thick, from, to, round, inset) {
        let a = from;
        let b = to;
        if (inset && Math.abs(b - a) > 2) {
            const dir = Math.sign(b - a);
            a += dir;
            b -= dir;
        }
        if (Math.abs(b - a) < 0.5) {
            return null;
        }
        const r = round ? Math.min(4, thick / 2, Math.abs(b - a)) : 0;
        const e = start + thick;
        if (horizontal) {
            const dir = b > a ? 1 : -1;
            return r > 0
                ? `M${a},${start} H${b - dir * r} Q${b},${start} ${b},${start + r} V${e - r} Q${b},${e} ${b - dir * r},${e} H${a} Z`
                : `M${a},${start} H${b} V${e} H${a} Z`;
        }
        const dir = b < a ? 1 : -1;
        return r > 0
            ? `M${start},${a} V${b + dir * r} Q${start},${b} ${start + r},${b} H${e - r} Q${e},${b} ${e},${b + dir * r} V${a} Z`
            : `M${start},${a} V${b} H${e} V${a} Z`;
    }

    /**
     * Builds the path of a ring sector; a full turn is drawn as two circles with an even-odd
     * fill, because an arc whose ends meet draws nothing.
     * @param {number} cx - The center x.
     * @param {number} cy - The center y.
     * @param {number} r0 - The inner radius, 0 for a pie slice.
     * @param {number} r1 - The outer radius.
     * @param {number} a0 - The start angle in radians.
     * @param {number} a1 - The end angle in radians.
     * @returns {string} The path data.
     */
    _arcPath(cx, cy, r0, r1, a0, a1) {
        const p = (r, a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        if (a1 - a0 >= Math.PI * 2 - 1e-6) {
            const circle = (r) => `M${cx - r},${cy} A${r},${r} 0 1 1 ${cx + r},${cy} A${r},${r} 0 1 1 ${cx - r},${cy} Z`;
            return circle(r1) + (r0 > 0 ? " " + circle(r0) : "");
        }
        const large = a1 - a0 > Math.PI ? 1 : 0;
        if (r0 > 0) {
            return `M${p(r1, a0)} A${r1},${r1} 0 ${large} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
        }
        return `M${cx},${cy} L${p(r1, a0)} A${r1},${r1} 0 ${large} 1 ${p(r1, a1)} Z`;
    }

    /**
     * Draws a point marker in one of the point styles.
     * @param {string} style - circle, triangle, rect, rectRounded, rectRot, cross, crossRot or star.
     * @param {number} x - The center x.
     * @param {number} y - The center y.
     * @param {number} r - The radius.
     * @param {Element} parent - The element to append to.
     * @returns {SVGElement} The marker.
     */
    _marker(style, x, y, r, parent) {
        const cls = "wx-chart-point";
        switch (style) {
            case "triangle": {
                const h = r * 1.5;
                return this._svg("path", { class: cls, d: `M${x},${y - h} L${x + h * 0.87},${y + h / 2} L${x - h * 0.87},${y + h / 2} Z` }, parent);
            }
            case "rect":
                return this._svg("rect", { class: cls, x: x - r, y: y - r, width: r * 2, height: r * 2 }, parent);
            case "rectRounded":
                return this._svg("rect", { class: cls, x: x - r, y: y - r, width: r * 2, height: r * 2, rx: r * 0.4 }, parent);
            case "rectRot":
                return this._svg("path", { class: cls, d: `M${x},${y - r * 1.3} L${x + r * 1.3},${y} L${x},${y + r * 1.3} L${x - r * 1.3},${y} Z` }, parent);
            case "cross":
                return this._svg("path", { class: cls + " wx-chart-point-stroke", d: `M${x - r},${y} H${x + r} M${x},${y - r} V${y + r}` }, parent);
            case "crossRot": {
                const k = r * 0.71;
                return this._svg("path", { class: cls + " wx-chart-point-stroke", d: `M${x - k},${y - k} L${x + k},${y + k} M${x + k},${y - k} L${x - k},${y + k}` }, parent);
            }
            case "star": {
                const corners = [];
                for (let i = 0; i < 10; i++) {
                    const a = -Math.PI / 2 + i * Math.PI / 5;
                    const radius = i % 2 === 0 ? r * 1.4 : r * 0.6;
                    corners.push(`${x + radius * Math.cos(a)},${y + radius * Math.sin(a)}`);
                }
                return this._svg("polygon", { class: cls, points: corners.join(" ") }, parent);
            }
            default:
                return this._svg("circle", { class: cls, cx: x, cy: y, r: r }, parent);
        }
    }

    /**
     * Fills the legend: one toggle per dataset, or per label for the forms that color their
     * slices. A single dataset needs no legend - the title names it - unless the author asks.
     * @param {string} type - The chart type.
     */
    _renderLegend(type) {
        const focused = document.activeElement;
        const focusKey = this._legendEl.contains(focused) ? focused.getAttribute("data-legend-key") : null;
        let focusItem = null;
        const legend = ((this._config.options || {}).plugins || {}).legend || {};
        const byLabel = webexpress.webui.ChartCtrl.LABEL_LEGEND_TYPES.includes(type);
        const all = this._series();
        const entries = [];

        if (byLabel) {
            const first = all[0] ? all[0].ds : {};
            this._labels().forEach((label, i) => {
                entries.push({ key: "l" + i, text: String(label), paint: this._paint(first, i, i), line: false });
            });
        } else {
            all.forEach((s) => {
                const kind = s.ds.type || type;
                entries.push({
                    key: "d" + s.index,
                    text: this._seriesName(s.ds, s.index),
                    paint: this._paint(s.ds, s.index, 0),
                    line: kind === "line" || kind === "radar",
                    hiddenByDefault: s.ds.hidden === true
                });
            });
        }

        const display = legend.display === true || (legend.display !== false && entries.length > (byLabel ? 0 : 1));
        this._legendEl.hidden = !display;
        this._legendEl.classList.toggle("wx-chart-legend-bottom", legend.position === "bottom");

        const frag = document.createDocumentFragment();
        for (const entry of entries) {
            const visible = this._isVisible(entry.key, entry.hiddenByDefault);
            const item = document.createElement("button");
            item.type = "button";
            item.className = "wx-chart-legend-item";
            item.setAttribute("data-legend-key", entry.key);
            item.setAttribute("aria-pressed", visible ? "true" : "false");
            if (entry.key === focusKey) {
                focusItem = item;
            }

            const swatch = document.createElement("span");
            swatch.className = "wx-chart-swatch" + (entry.line ? " wx-chart-swatch-line" : "");
            swatch.setAttribute("aria-hidden", "true");
            this._applyPaint(swatch, entry.paint);

            const text = document.createElement("span");
            text.textContent = entry.text;

            item.appendChild(swatch);
            item.appendChild(text);
            item.addEventListener("click", () => {
                const show = !this._isVisible(entry.key, entry.hiddenByDefault);
                this._visibility.set(entry.key, show);
                // the others ease into their new places, a series shown again grows back in
                this._render("settle", show ? entry.key : null);
            });
            frag.appendChild(item);
        }
        this._legendEl.replaceChildren(frag);
        if (display && focusItem) {
            focusItem.focus({ preventScroll: true });
        }
    }

    /**
     * Fills the visually hidden data table, the reading of the chart for assistive technology.
     * It lists every dataset, hidden ones included, because hiding is a visual choice.
     * @param {string} type - The chart type.
     */
    _renderTable(type) {
        const table = this._table;
        const opts = this._config.options || {};
        const scales = opts.scales || {};
        const series = this._series();
        const head = document.createElement("thead");
        const body = document.createElement("tbody");

        const caption = document.createElement("caption");
        caption.textContent = this._title() || this._i18n("webexpress.webui:chart", "Chart");

        const headRow = (cells) => {
            const tr = document.createElement("tr");
            for (const value of cells) {
                const th = document.createElement("th");
                th.setAttribute("scope", "col");
                th.textContent = value;
                tr.appendChild(th);
            }
            head.appendChild(tr);
        };
        const bodyRow = (cells) => {
            const tr = document.createElement("tr");
            cells.forEach((value, i) => {
                const cell = document.createElement(i === 0 ? "th" : "td");
                if (i === 0) {
                    cell.setAttribute("scope", "row");
                }
                cell.textContent = value;
                tr.appendChild(cell);
            });
            body.appendChild(tr);
        };

        if (type === "scatter" || type === "bubble") {
            const cols = [
                this._i18n("webexpress.webui:chart.series", "Series"),
                this._axisTitle(scales.x) || "x",
                this._axisTitle(scales.y) || "y"
            ];
            if (type === "bubble") {
                cols.push(this._i18n("webexpress.webui:chart.radius", "Radius"));
            }
            headRow(cols);
            for (const s of series) {
                this._dataOf(s.ds).forEach((p, i) => {
                    const point = this._pointOf(p, i);
                    if (point) {
                        const cells = [this._seriesName(s.ds, s.index), this._format(point.x), this._format(point.y)];
                        if (type === "bubble") {
                            cells.push(point.r !== null ? this._format(point.r) : "");
                        }
                        bodyRow(cells);
                    }
                });
            }
        } else {
            const horizontal = type === "bar" && opts.indexAxis === "y";
            const catTitle = this._axisTitle(horizontal ? scales.y : scales.x);
            // a drawn trendline is part of the reading, so it gets a column next to the values
            const trendName = this._i18n("webexpress.webui:chart.trend", "Trend");
            const trended = series.filter((s) => this._trendValues.has(s.index));
            headRow([
                catTitle || this._i18n("webexpress.webui:chart.category", "Category"),
                ...series.map((s) => this._seriesName(s.ds, s.index)),
                ...trended.map((s) => this._seriesName(s.ds, s.index) + " (" + trendName + ")")
            ]);
            const labels = this._labels();
            const count = Math.max(labels.length, ...series.map((s) => this._dataOf(s.ds).length), 0);
            for (let i = 0; i < count; i++) {
                const cells = [labels[i] != null ? String(labels[i]) : String(i + 1)];
                for (const s of series) {
                    const v = this._valueOf(this._dataOf(s.ds)[i]);
                    cells.push(v === null ? "" : this._format(v));
                }
                for (const s of trended) {
                    const v = this._trendValues.get(s.index)(i);
                    cells.push(v === null ? "" : this._formatTrend(v));
                }
                bodyRow(cells);
            }
        }

        table.replaceChildren(caption, head, body);
    }

    /**
     * Converts the pointer position into drawing coordinates.
     * @param {PointerEvent} e - The pointer event.
     * @returns {{x: number, y: number}} The position in the drawing.
     */
    _toLocal(e) {
        const rect = this._chart.getBoundingClientRect();
        const sx = rect.width ? this._size.width / rect.width : 1;
        const sy = rect.height ? this._size.height / rect.height : 1;
        return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
    }

    /**
     * Shows the tooltip of the target under the pointer.
     * @param {PointerEvent} e - The pointer event.
     */
    _onPointerMove(e) {
        const p = this._toLocal(e);
        const index = this._locate(p.x, p.y);
        if (index < 0) {
            if (this._active >= 0) {
                this._hideTip();
            }
        } else if (index !== this._active) {
            this._showTip(index, false);
        }
    }

    /**
     * Walks the targets with the arrow keys, the keyboard way to read the values.
     * @param {KeyboardEvent} e - The keyboard event.
     */
    _onKeyDown(e) {
        const count = this._targets.length;
        if (!count) {
            return;
        }
        let next;
        switch (e.key) {
            case "ArrowRight":
            case "ArrowDown":
                next = this._active < 0 ? 0 : (this._active + 1) % count;
                break;
            case "ArrowLeft":
            case "ArrowUp":
                next = this._active < 0 ? count - 1 : (this._active - 1 + count) % count;
                break;
            case "Home":
                next = 0;
                break;
            case "End":
                next = count - 1;
                break;
            case "Escape":
                this._hideTip();
                return;
            default:
                return;
        }
        e.preventDefault();
        this._showTip(next, true);
    }

    /**
     * Shows the tooltip of a target, highlights its marks and draws its guide.
     * @param {number} index - The index of the target.
     * @param {boolean} announce - Whether to read the values out, which only the keyboard does.
     */
    _showTip(index, announce) {
        const target = this._targets[index];
        if (!target) {
            this._hideTip();
            return;
        }
        this._clearActive();
        this._active = index;

        this._showGuide(target.guide);
        // the dots go on top of the series so they ride above the lines they mark
        for (const dot of target.dots) {
            this._applyPaint(this._svg("circle", { class: "wx-chart-hover-dot", cx: dot.pos.x, cy: dot.pos.y, r: 5 }, this._chart), dot.paint);
        }
        if (target.marks.length) {
            this._chart.classList.add("wx-chart-hovering");
            target.marks.forEach((mark) => mark.classList.add("wx-chart-active"));
        }
        if (target.center) {
            this._setCenter(target.center);
        }

        const tip = this._tooltip;
        // a tooltip already on screen glides to its new place; one that appears does not fly in
        // from where it was last shown
        const visible = tip.classList.contains("wx-chart-tooltip-visible");
        tip.classList.toggle("wx-chart-tooltip-follow", visible);
        tip.replaceChildren();
        if (target.title) {
            const title = document.createElement("div");
            title.className = "wx-chart-tooltip-title";
            title.textContent = target.title;
            tip.appendChild(title);
        }
        for (const r of target.rows) {
            const line = document.createElement("div");
            line.className = "wx-chart-tooltip-row";
            const swatch = document.createElement("span");
            swatch.className = "wx-chart-swatch" + (r.line ? " wx-chart-swatch-line" : "") + (r.trend ? " wx-chart-swatch-trend" : "");
            this._applyPaint(swatch, r.paint);
            const name = document.createElement("span");
            name.textContent = r.name;
            const value = document.createElement("span");
            value.className = "wx-chart-tooltip-value";
            value.textContent = r.value;
            line.appendChild(swatch);
            line.appendChild(name);
            line.appendChild(value);
            tip.appendChild(line);
        }
        const rect = this._chart.getBoundingClientRect();
        const sx = rect.width ? rect.width / this._size.width : 1;
        const sy = rect.height ? rect.height / this._size.height : 1;
        const plotWidth = this._plot.clientWidth || this._size.width;
        const half = (tip.offsetWidth || 0) / 2;
        const anchor = target.anchor.x * sx;
        const left = Math.min(Math.max(anchor, half), Math.max(half, plotWidth - half));
        const top = target.anchor.y * sy;
        tip.style.left = left + "px";
        tip.style.top = top + "px";
        // the caret keeps pointing at the mark when the tooltip is pushed off center at an edge
        tip.style.setProperty("--wx-chart-caret", (anchor - left).toFixed(1) + "px");
        tip.classList.toggle("wx-chart-tooltip-below", top < (tip.offsetHeight || 0) + 12);
        tip.classList.add("wx-chart-tooltip-visible");

        if (announce) {
            const parts = target.rows.map((r) => r.name + ": " + r.value);
            this._live.textContent = (target.title ? target.title + " - " : "") + parts.join(", ");
        }
    }

    /**
     * Shows the guide of a target: the band behind a category of bars, the line through a
     * category of points or the spoke of a radar. A band or an upright line is one rectangle
     * that glides from category to category; a slanted spoke is drawn anew.
     * @param {Object} [guide] - The guide { band } or { line } of the target.
     */
    _showGuide(guide) {
        const line = guide && guide.line;
        let box = guide && guide.band ? guide.band : null;
        if (line && (line.x1 === line.x2 || line.y1 === line.y2)) {
            box = line.x1 === line.x2
                ? { x: line.x1 - 0.5, y: Math.min(line.y1, line.y2), w: 1, h: Math.abs(line.y2 - line.y1) }
                : { x: Math.min(line.x1, line.x2), y: line.y1 - 0.5, w: Math.abs(line.x2 - line.x1), h: 1 };
        } else if (line) {
            this._svg("line", Object.assign({ class: "wx-chart-crosshair wx-chart-spoke" }, line), this._overlay);
        }
        if (!box) {
            return;
        }

        let el = this._overlay.querySelector(".wx-chart-guide");
        const visible = !!el && el.classList.contains("wx-chart-guide-visible");
        if (!el) {
            el = this._svg("rect", { class: "wx-chart-guide" }, this._overlay);
        }
        el.classList.toggle("wx-chart-hover-band", !!guide.band);
        el.classList.toggle("wx-chart-crosshair-rect", !guide.band);
        el.classList.toggle("wx-chart-guide-follow", visible);
        const geometry = { x: box.x, y: box.y, width: box.w, height: box.h };
        for (const name of Object.keys(geometry)) {
            // the attribute draws the guide, the css property lets it glide between categories
            el.setAttribute(name, String(geometry[name]));
            el.style.setProperty(name, geometry[name] + "px");
        }
        el.setAttribute("rx", guide.band ? "6" : "0");
        el.classList.add("wx-chart-guide-visible");
    }

    /**
     * Hides the tooltip and removes the highlight.
     */
    _hideTip() {
        this._clearActive();
        this._active = -1;
        if (this._tooltip) {
            this._tooltip.classList.remove("wx-chart-tooltip-visible");
        }
        if (this._overlay) {
            const guide = this._overlay.querySelector(".wx-chart-guide");
            if (guide) {
                guide.classList.remove("wx-chart-guide-visible");
            }
        }
        this._setCenter(null);
    }

    /**
     * Removes the hover dots, the spoke and the highlight of the active target.
     */
    _clearActive() {
        const target = this._targets[this._active];
        if (target) {
            target.marks.forEach((mark) => mark.classList.remove("wx-chart-active"));
        }
        if (this._chart) {
            this._chart.classList.remove("wx-chart-hovering");
            this._chart.querySelectorAll(".wx-chart-hover-dot").forEach((dot) => dot.remove());
        }
        if (this._overlay) {
            this._overlay.querySelectorAll(".wx-chart-spoke").forEach((spoke) => spoke.remove());
        }
    }
};

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-chart", webexpress.webui.ChartCtrl);
