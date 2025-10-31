/**
 * A fluent controller for chart.js that supports multiple chart types and data-* attributes.
 * Encapsulates chart creation, type switching, option/data updates, and destruction.
 * dispatches the following events on the host element:
 * - webexpress.webui.Event.DATA_REQUESTED_EVENT
 * - webexpress.webui.Event.DATA_ARRIVED_EVENT
 */
webexpress.webui.ChartCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Creates a new chart.js controller for the given host element
     * @param {HTMLElement} element - host element that will contain the canvas
     * @param {Object} [config] - optional chart.js configuration object
     */
    constructor(element, config) {
        super(element);

        this._canvas = this._ensureCanvas(this._element);
        this._chart = null;
        this._config = this._buildInitialConfig(this._element, config);
        this._autoload = this._readAutoloadFlag(this._element);

        // cleanup data attributes to keep dom clean
        this._cleanupDataAttributes(this._element);

        // optionally create the chart immediately
        if (this._autoload) {
            this.load();
        }
    }

    /**
     * Ensures a canvas element is present within the given host element. If no canvas exists, a new 
     * canvas is created, styled, and appended to the host. The canvas width is always set to 100%. The 
     * height is determined by the data-height attribute if present, otherwise a default height of 300px is used.
     * @param {HTMLElement} host - The container element in which the canvas should reside.
     * @returns {HTMLCanvasElement} Returns the canvas element contained within the host.
     */
    _ensureCanvas(host) {
        // try to find an existing canvas
        let canvas = host.querySelector("canvas");
        if (!canvas) {
            // create a new canvas and set sensible defaults
            canvas = document.createElement("canvas");
            canvas.style.width = "100%";
            // set fixed height if provided via data-height, else use a default height
            if (host.getAttribute("data-height")) {
                const h = String(host.getAttribute("data-height")).trim();
                canvas.style.height = (h.endsWith("px") || h.endsWith("%")) ? h : (parseInt(h, 10) + "px");
            } else {
                canvas.style.height = "300px";
            }
            host.appendChild(canvas);
        }
        return canvas;
    }

    /**
     * Reads the autoload flag from the data-autoload attribute of the given element. If the attribute is missing, the default value is true.
     * @param {HTMLElement} element - The host element to read the flag from.
     * @returns {boolean} Returns true if autoload is enabled, false otherwise.
     */
    _readAutoloadFlag(element) {
        const raw = (element.getAttribute("data-autoload") || "true").toLowerCase();
        return raw !== "false";
    }

    /**
     * Deep merges two objects. If an array is encountered, it is replaced rather than merged.
     * All properties from the source object are recursively merged into the target object.
     * @param {Object} target - The target object to merge into.
     * @param {Object} source - The source object providing properties to merge.
     * @returns {Object} Returns a new object resulting from the deep merge.
     */
    _deepMerge(target, source) {
        const out = Array.isArray(target) ? target.slice() : { ...(target || {}) };
        if (source && typeof source === "object") {
            const keys = Object.keys(source);
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
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
     * Safely parses a data-* JSON attribute from the given element.
     * If the attribute is missing or contains invalid JSON, the provided fallback value is returned.
     * @param {HTMLElement} element - The DOM element from which the attribute is read.
     * @param {string} name - The name of the data-* attribute (e.g. "data-options").
     * @param {*} fallback - The value to return if the attribute is missing or invalid.
     * @returns {*} Returns the parsed value or the fallback.
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
     * Safely parses a boolean data-* attribute from the given element.
     * If the attribute is missing, the provided fallback value is returned.
     * The string value is interpreted strictly: "true" (case-insensitive) yields true, "false" yields false.
     * @param {HTMLElement} element - The DOM element from which the attribute is read.
     * @param {string} name - The name of the data-* attribute (e.g. "data-responsive").
     * @param {boolean|null} fallback - The value to return if the attribute is missing.
     * @returns {boolean|null} Returns true, false, or the fallback if not present.
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
     * Ensures that the specified nested option path exists within the root object. 
     * If any part of the path does not exist or is not an object, an empty object is assigned at that position.
     * Returns the leaf object at the end of the path.
     * @param {Object} root - The root object to traverse or extend.
     * @param {Array<string>} path - The array of keys representing the nested path.
     * @returns {Object} Returns the object at the end of the path.
     */
    _ensurePath(root, path) {
        let node = root;
        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            if (typeof node[key] !== "object" || node[key] === null || Array.isArray(node[key])) {
                node[key] = {};
            }
            node = node[key];
        }
        return node;
    }

    /**
     * Builds the initial Chart.js configuration object using defaults, data-* attributes, and an optional constructor config.
     * Data attributes have priority and are mapped to the relevant Chart.js options structure.
     * Supports multiple datasets with indexed data-datasetN-* attributes.
     * @param {HTMLElement} element - The host DOM element containing chart data attributes.
     * @param {Object} [config] - Optional Chart.js config object for additional overrides.
     * @returns {Object} Returns the merged Chart.js configuration object.
     */
    _buildInitialConfig(element, config) {
        // base defaults for chart.js v4
        const base = {
            type: "line",
            data: { labels: [], datasets: [] },
            options: { responsive: true, maintainAspectRatio: true }
        };

        // read labels from data-labels (JSON array)
        const labelsAttr = this._parseJSONAttr(element, "data-labels", null);

        // read datasets with index (data-dataset0-*, data-dataset1-*, ...)
        const datasets = [];
        for (let i = 0; i < 10; i++) {
            const label = element.getAttribute(`data-dataset${i}-label`);
            const data = this._parseJSONAttr(element, `data-dataset${i}-data`, null);
            const bg = element.getAttribute(`data-dataset${i}-background-color`);
            const border = element.getAttribute(`data-dataset${i}-border-color`);
            const bw = element.getAttribute(`data-dataset${i}-border-width`);
            if (label || Array.isArray(data)) {
                datasets.push({
                    label: label || "",
                    data: Array.isArray(data) ? data : [],
                    backgroundColor: bg || undefined,
                    borderColor: border || undefined,
                    borderWidth: bw != null ? parseInt(bw, 10) : undefined
                });
            }
        }

        // fallback: support single dataset without index
        if (datasets.length === 0) {
            const dsLabel = element.getAttribute("data-dataset-label");
            const dsData = this._parseJSONAttr(element, "data-dataset-data", null);
            const dsBg = element.getAttribute("data-dataset-background-color");
            const dsBorder = element.getAttribute("data-dataset-border-color");
            const dsBw = element.getAttribute("data-dataset-border-width");
            if (dsLabel || Array.isArray(dsData)) {
                datasets.push({
                    label: dsLabel || "",
                    data: Array.isArray(dsData) ? dsData : [],
                    backgroundColor: dsBg || undefined,
                    borderColor: dsBorder || undefined,
                    borderWidth: dsBw != null ? parseInt(dsBw, 10) : undefined
                });
            }
        }

        // read chart type
        const typeAttr = element.getAttribute("data-type");

        // read further options as standalone data-* attributes
        const responsiveAttr = this._parseBoolAttr(element, "data-responsive", null);
        const marAttr = this._parseBoolAttr(element, "data-maintain-aspect-ratio", null);
        const legendDisplayAttr = this._parseBoolAttr(element, "data-legend-display", null);
        const titleDisplayAttr = this._parseBoolAttr(element, "data-title-display", null);
        const titleTextAttr = element.getAttribute("data-title-text");
        const yBeginAtZeroAttr = this._parseBoolAttr(element, "data-scale-y-begin-at-zero", null);
        const yTitleAttr = element.getAttribute("data-scale-y-title");
        const xBeginAtZeroAttr = this._parseBoolAttr(element, "data-scale-x-begin-at-zero", null);
        const xTitleAttr = element.getAttribute("data-scale-x-title");
        const yMinAttr = element.getAttribute("data-scale-y-min");
        const yMaxAttr = element.getAttribute("data-scale-y-max");

        // merge configuration
        let cfg = this._deepMerge(base, {});
        if (config && typeof config === "object") {
            cfg = this._deepMerge(cfg, config);
        }
        if (typeAttr && typeof typeAttr === "string") {
            cfg.type = typeAttr.trim();
        }
        cfg.data = cfg.data || { labels: [], datasets: [] };
        if (Array.isArray(labelsAttr)) {
            cfg.data.labels = labelsAttr.slice();
        }
        cfg.data.datasets = datasets;

        // Optionen wie responsive usw. wie gehabt übernehmen
        cfg.options = cfg.options || {};
        if (responsiveAttr !== null) {
            cfg.options.responsive = responsiveAttr;
        }
        if (marAttr !== null) {
            cfg.options.maintainAspectRatio = marAttr;
        }

        // plugins.legend.display
        if (legendDisplayAttr !== null) {
            const legend = this._ensurePath(cfg.options, ["plugins", "legend"]);
            legend.display = legendDisplayAttr;
        }

        // plugins.title.{display,text}
        if (titleDisplayAttr !== null || typeof titleTextAttr === "string") {
            const title = this._ensurePath(cfg.options, ["plugins", "title"]);
            if (titleDisplayAttr !== null) {
                title.display = titleDisplayAttr;
            }
            if (typeof titleTextAttr === "string") {
                title.text = titleTextAttr;
            }
        }

        // scales.y.{beginAtZero, title.text, min, max, ticks.beginAtZero}
        if (yBeginAtZeroAttr !== null || typeof yTitleAttr === "string" || yMinAttr !== null || yMaxAttr !== null) {
            const y = this._ensurePath(cfg.options, ["scales", "y"]);
            if (yBeginAtZeroAttr !== null) {
                y.beginAtZero = yBeginAtZeroAttr;
                const yTicks = this._ensurePath(cfg.options, ["scales", "y", "ticks"]);
                yTicks.beginAtZero = yBeginAtZeroAttr;
            }
            if (typeof yTitleAttr === "string") {
                const yTitle = this._ensurePath(cfg.options, ["scales", "y", "title"]);
                yTitle.display = true;
                yTitle.text = yTitleAttr;
            }
            if (yMinAttr !== null) {
                y.min = parseFloat(yMinAttr);
            }
            if (yMaxAttr !== null) {
                y.max = parseFloat(yMaxAttr);
            }
        }

        // scales.x.{beginAtZero, title.text, ticks.beginAtZero}
        if (xBeginAtZeroAttr !== null || typeof xTitleAttr === "string") {
            const x = this._ensurePath(cfg.options, ["scales", "x"]);
            if (xBeginAtZeroAttr !== null) {
                x.beginAtZero = xBeginAtZeroAttr;
                const xTicks = this._ensurePath(cfg.options, ["scales", "x", "ticks"]);
                xTicks.beginAtZero = xBeginAtZeroAttr;
            }
            if (typeof xTitleAttr === "string") {
                const xTitle = this._ensurePath(cfg.options, ["scales", "x", "title"]);
                xTitle.display = true;
                xTitle.text = xTitleAttr;
            }
        }

        return cfg;
    }

    /**
 * Removes all known data-* attributes from the given DOM element to prevent configuration values from leaking into the DOM.
 * This ensures a clean markup after the chart controller has initialized its configuration.
 * Extended to also remove indexed dataset attributes (data-dataset0-*, data-dataset1-*, ...).
 * @param {HTMLElement} element - The DOM element whose data-* attributes should be removed.
 */
    _cleanupDataAttributes(element) {
        // list of generic and non-indexed attributes
        const names = [
            // generic config
            "data-config", "data-type", "data-labels", "data-datasets", "data-options",
            "data-autoload", "data-height", "data-index-axis",
            // dataset convenience (single dataset)
            "data-dataset-label", "data-dataset-data", "data-dataset-background-color",
            "data-dataset-border-color", "data-dataset-border-width",
            // split options
            "data-responsive", "data-maintain-aspect-ratio",
            "data-legend-display", "data-title-display", "data-title-text",
            "data-scale-y-begin-at-zero", "data-scale-y-title",
            "data-scale-x-begin-at-zero", "data-scale-x-title",
            "data-scale-y-min", "data-scale-y-max"
        ];
        for (let i = 0; i < names.length; i++) {
            element.removeAttribute(names[i]);
        }
        // remove indexed dataset attributes (for up to 10 datasets)
        for (let i = 0; i < 10; i++) {
            element.removeAttribute(`data-dataset${i}-label`);
            element.removeAttribute(`data-dataset${i}-data`);
            element.removeAttribute(`data-dataset${i}-background-color`);
            element.removeAttribute(`data-dataset${i}-border-color`);
            element.removeAttribute(`data-dataset${i}-border-width`);
        }
    }

    /**
     * Creates or recreates the Chart.js instance using the current configuration object.
     * If a previous chart instance exists, it is destroyed before creating a new one.
     * Ensures Chart.js is loaded and the chart type is supported.
     * Dispatches lifecycle events for request, success, and error.
     * @returns {this} Returns the controller instance for chaining.
     */
    load() {
        // signal start of (re)creation
        this._dispatch(webexpress.webui.Event.DATA_REQUESTED_EVENT, { config: this._config });

        try {
            // destroy existing chart instance if present
            if (this._chart !== null) {
                this._chart.destroy();
                this._chart = null;
            }

            // ensure chart.js (umd) is loaded
            if (typeof Chart === "undefined" || typeof Chart !== "function") {
                throw new Error("Chart.js v4 is not loaded or not available as a global 'Chart'.");
            }

            // validate type before instantiation (v4 supported types)
            const t = (this._config && this._config.type) ? String(this._config.type) : "line";
            if (!webexpress.webui.ChartCtrl.isSupportedType(t)) {
                throw new Error("unsupported chart type: " + t);
            }

            // instantiate chart.js on the managed canvas
            this._chart = new Chart(this._canvas, this._config);

            // signal success
            this._dispatch(webexpress.webui.Event.DATA_ARRIVED_EVENT, { chart: this._chart });
        } catch (error) {
            // dispatch error to consumers
            this._dispatch(webexpress.webui.Event.DATA_ERROR_EVENT, { error: String(error), config: this._config });
        }

        return this;
    }

    /**
     * Sets the entire Chart.js data object and refreshes the chart.
     * If the chart instance exists, it directly updates the chart data and triggers a re-render.
     * Otherwise, the data is stored in the configuration object for later chart creation.
     * @param {Object} data - The data object to set for the chart.
     * @returns {this} Returns the controller instance for chaining.
     */
    data(data) {
        if (this._chart !== null) {
            this._chart.data = data || { labels: [], datasets: [] };
            this._chart.update();
        } else {
            this._config.data = data || { labels: [], datasets: [] };
        }
        return this;
    }

    /**
     * Updates the entire Chart.js data object. This method is an alias for the data() method.
     * Sets the chart data and triggers a re-render if the chart instance exists. Otherwise, stores the data for later chart creation.
     * @param {Object} newData - The new data object to set for the chart.
     * @returns {this} Returns the controller instance for chaining.
     */
    updateData(newData) {
        return this.data(newData);
    }

    /**
     * Sets the chart labels and refreshes the chart.
     * If the chart instance already exists, updates its labels and triggers a re-render.
     * Otherwise, stores the labels in the config for later chart creation.
     * @param {Array<string>} labels - The array of labels to set for the chart.
     * @returns {this} Returns the controller instance for chaining.
     */
    labels(labels) {
        const value = Array.isArray(labels) ? labels.slice() : [];
        if (this._chart !== null) {
            this._chart.data.labels = value;
            this._chart.update();
        } else {
            if (!this._config.data) {
                this._config.data = { labels: [], datasets: [] };
            }
            this._config.data.labels = value;
        }
        return this;
    }

    /**
     * Sets the chart datasets and refreshes the chart.
     * If a chart instance exists, replaces its datasets and triggers a re-render.
     * Otherwise, stores the datasets in the configuration object for later chart creation.
     * @param {Array<Object>} datasets - The array of dataset objects to set for the chart.
     * @returns {this} Returns the controller instance for chaining.
     */
    datasets(datasets) {
        const value = Array.isArray(datasets) ? datasets.slice() : [];
        if (this._chart !== null) {
            this._chart.data.datasets = value;
            this._chart.update();
        } else {
            if (!this._config.data) {
                this._config.data = { labels: [], datasets: [] };
            }
            this._config.data.datasets = value;
        }
        return this;
    }

    /**
     * Adds a single dataset to the chart and refreshes the chart.
     * If a chart instance exists, the dataset is pushed directly and the chart is updated.
     * Otherwise, the dataset is added to the configuration object for later chart creation.
     * @param {Object} dataset - The dataset object to add to the chart.
     * @returns {this} Returns the controller instance for chaining.
     */
    addDataset(dataset) {
        if (this._chart !== null) {
            if (!Array.isArray(this._chart.data.datasets)) {
                this._chart.data.datasets = [];
            }
            this._chart.data.datasets.push(dataset);
            this._chart.update();
        } else {
            if (!this._config.data) {
                this._config.data = { labels: [], datasets: [] };
            }
            if (!Array.isArray(this._config.data.datasets)) {
                this._config.data.datasets = [];
            }
            this._config.data.datasets.push(dataset);
        }
        return this;
    }

    /**
     * Removes a dataset from the chart by its index and refreshes the chart.
     * If a chart instance exists, the dataset is removed directly and the chart is updated.
     * Otherwise, the dataset is removed from the configuration object for later chart creation.
     * @param {number} index - The index of the dataset to remove.
     * @returns {this} Returns the controller instance for chaining.
     */
    removeDataset(index) {
        if (typeof index === "number") {
            if (this._chart !== null) {
                if (Array.isArray(this._chart.data.datasets) && index >= 0 && index < this._chart.data.datasets.length) {
                    this._chart.data.datasets.splice(index, 1);
                    this._chart.update();
                }
            } else {
                if (this._config.data && Array.isArray(this._config.data.datasets) && index >= 0 && index < this._config.data.datasets.length) {
                    this._config.data.datasets.splice(index, 1);
                }
            }
        }
        return this;
    }

    /**
     * Deep-merges the provided options object into the current Chart.js options and refreshes the chart.
     * If the chart instance exists, merges and updates the options immediately. Otherwise, merges into the stored configuration for later use.
     * @param {Object} opts - The options object to merge into the chart configuration.
     * @returns {this} Returns the controller instance for method chaining.
     */
    options(opts) {
        if (!opts || typeof opts !== "object") {
            return this;
        }
        if (this._chart !== null) {
            this._chart.options = this._deepMerge(this._chart.options || {}, opts);
            this._chart.update();
        } else {
            this._config.options = this._deepMerge(this._config.options || {}, opts);
        }
        return this;
    }

    /**
     * Sets a new chart type and recreates the chart using the updated configuration.
     * If the provided type is not supported, an error event is dispatched and no chart is created.
     * @param {string} type - The chart type to set (e.g. "line", "bar", "pie").
     * @returns {this} Returns the controller instance for method chaining.
     */
    type(type) {
        const t = String(type || "").trim();
        if (!webexpress.webui.ChartCtrl.isSupportedType(t)) {
            this._dispatch(webexpress.webui.Event.DATA_ERROR_EVENT, { error: "unsupported chart type: " + t });
            return this;
        }
        this._config.type = t;
        return this.load();
    }

    /**
     * Sets a completely new Chart.js configuration object and recreates the chart.
     * The chart instance is destroyed and recreated with the provided configuration.
     * @param {Object} config - The new Chart.js configuration object.
     * @returns {this} Returns the controller instance for method chaining.
     */
    config(config) {
        this._config = config || {};
        return this.load();
    }

    /**
     * Triggers Chart.js internal resize logic for the chart instance.
     * If the chart instance exists, its resize method is called to adjust the canvas size and redraw the chart.
     * If no chart instance exists, the method does nothing.
     * @returns {this} Returns the controller instance for method chaining.
     */
    resize() {
        if (this._chart !== null) {
            this._chart.resize();
        }
        return this;
    }

    /**
     * Destroys the Chart.js instance and frees associated resources.
     * If a chart instance exists, it is destroyed and the internal reference is set to null.
     * This method ensures that memory is released and the canvas is no longer bound to Chart.js.
     * @returns {this} Returns the controller instance for method chaining.
     */
    destroy() {
        if (this._chart !== null) {
            this._chart.destroy();
            this._chart = null;
        }
        return this;
    }

    /**
     * Returns the current Chart.js instance if it exists, otherwise returns null.
     * This method allows access to the underlying Chart.js object for advanced operations.
     * @returns {Chart|null} The current Chart.js instance or null if no chart is created.
     */
    get chart() {
        return this._chart;
    }

    /**
     * Returns the current Chart.js configuration object.
     * This method provides access to the underlying configuration for inspection or advanced manipulation.
     * @returns {Object} The current Chart.js configuration object.
     */
    get currentConfig() {
        return this._config;
    }

    /**
     * Validates whether the provided chart type is supported.
     * Returns true if the type is among the supported types, false otherwise.
     * @param {string} type - The chart type to validate (e.g. "line", "bar", "pie").
     * @returns {boolean} True if the type is supported, otherwise false.
     */
    static isSupportedType(type) {
        const supported = [
            "line",
            "bar",
            "pie",
            "doughnut",
            "radar",
            "polarArea",
            "bubble",
            "scatter"
        ];
        return supported.indexOf(type) !== -1;
    }
};

// Register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-chart", webexpress.webui.ChartCtrl);