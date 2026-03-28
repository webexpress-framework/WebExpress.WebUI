/**
 * Registers the system stats widget in the dashboard registry.
 */
webexpress.webui.DashboardWidgets.register("widget_stats", {
    title: "System Status",
    icon: "fas fa-server",
    removable: false,

    /**
     * Renders the widget content.
     * @param {HTMLElement} container - The container element to render into.
     * @param {object} data - The widget data.
     */
    render: function (container, data) {
        // build internal markup
        const params = data.params;
        const heading = document.createElement("h2");
        heading.className = "text-success";
        heading.textContent = params.title || "All systems operational";

        const paragraph = document.createElement("p");
        paragraph.textContent = params.uptime || "Uptime: 99.9%";

        container.appendChild(heading);
        container.appendChild(paragraph);
    }
});

/**
 * Registers the revenue chart widget in the dashboard registry.
 * Utilizes the webexpress.webui.ChartCtrl by mapping parameters from the dashboard
 * widget container to the required data-* attributes for the chart.
 */
webexpress.webui.DashboardWidgets.register("widget_chart", {
    title: "Chart",
    icon: "fas fa-chart-line",

    /**
     * Renders the widget content.
     * @param {HTMLElement} container - The container element to render into.
     * @param {object} data - The widget data, including custom params mapped from HTML.
     */
    render: function (container, data) {
        // create the host element for the chart controller
        const chartBox = document.createElement("div");
        chartBox.className = "wx-webui-chart";

        // set default attributes
        chartBox.setAttribute("data-type", "bar");
        chartBox.setAttribute("data-labels", '["Januar","Februar","März","April","Mai","Juni"]');
        chartBox.setAttribute("data-dataset-label", "Umsatz in €");
        chartBox.setAttribute("data-dataset-data", "[1200,1900,3000,500,2500,3200]");
        chartBox.setAttribute("data-dataset-background-color", "rgba(54, 162, 235, 0.2)");
        chartBox.setAttribute("data-dataset-border-color", "rgba(54, 162, 235, 1)");
        chartBox.setAttribute("data-dataset-border-width", "1");
        chartBox.setAttribute("data-responsive", "true");
        chartBox.setAttribute("data-maintain-aspect-ratio", "false");
        chartBox.setAttribute("data-scale-y-begin-at-zero", "true");
        chartBox.setAttribute("data-scale-y-title", "Wert");
        chartBox.setAttribute("data-legend-display", "true");
        chartBox.setAttribute("data-title-display", "true");
        chartBox.setAttribute("data-title-text", "Chart");
        chartBox.setAttribute("data-height", "250px");

        // override default attributes with parameters passed to the dashboard widget
        if (data && data.params) {
            const params = data.params;
            for (const key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key)) {
                    const value = params[key];

                    // map specific aliases to match the chart controllers expected attributes
                    if (key === "chartType") {
                        chartBox.setAttribute("data-type", value);
                    } else if (key === "data") {
                        chartBox.setAttribute("data-dataset-data", value);
                    } else {
                        // convert standard camelcase params back to kebab-case for data-* attributes
                        const kebabKey = key.replace(/[A-Z]/g, function (match) {
                            return "-" + match.toLowerCase();
                        });
                        chartBox.setAttribute("data-" + kebabKey, value);
                    }
                }
            }
        }

        // append the configured element to the widget container
        container.appendChild(chartBox);

        // instantiate the chart controller which automatically parses the data-* attributes
        new webexpress.webui.ChartCtrl(chartBox);
    }
});

/**
 * Registers the recent alerts widget in the dashboard registry.
 */
webexpress.webui.DashboardWidgets.register("widget_alerts", {
    title: "Recent Alerts",
    icon: "fas fa-bell",

    /**
     * Renders the widget content.
     * @param {HTMLElement} container - The container element to render into.
     * @param {object} data - The widget data.
     */
    render: function (container, data) {
        // create the list container
        const list = document.createElement("ul");
        list.className = "list-group list-group-flush";

        // define the alert items
        const alerts = [
            { text: "High CPU Load", className: "list-group-item text-danger" },
            { text: "Memory above 80%", className: "list-group-item text-warning" },
            { text: "Backup completed", className: "list-group-item" }
        ];

        // append each alert to the list
        for (let i = 0; i < alerts.length; i++) {
            const item = document.createElement("li");
            item.className = alerts[i].className;
            item.textContent = alerts[i].text;
            list.appendChild(item);
        }

        container.appendChild(list);
    }
});

/**
 * Registers a generic info card.
 */
webexpress.webui.DashboardWidgets.register("widget_info", {
    title: "Info Card",
    icon: "fas fa-info-circle",

    /**
     * Renders a simple informational card with optional title/desc.
     * @param {HTMLElement} container - The container element to render into.
     * @param {object} data - The widget data. 
     */
    render: function (container, data) {
        // show data.params.title/desc if available
        const params = data.params || {};
        const headline = document.createElement("div");
        headline.className = "fw-bold mb-2";
        headline.textContent = params.title;

        const text = document.createElement("div");
        text.textContent = params.desc;

        container.appendChild(headline);
        container.appendChild(text);
    }
});

/**
 * Registers a basic progress bar widget.
 */
webexpress.webui.DashboardWidgets.register("widget_progress", {
    title: "Progress",
    icon: "fas fa-tasks",
    /**
     * Renders a simple progress bar.
     * @param {HTMLElement} container - The container element to render into.
     * @param {object} data - The widget data. 
     */
    render: function (container, data) {
        const params = data.params || {};
        const value = Math.min(Math.max(Number(params.value) || 70, 0), 100);
        const bar = document.createElement("div");
        bar.className = "progress";

        const barInner = document.createElement("div");
        barInner.className = "progress-bar";
        barInner.style.width = value + "%";
        barInner.textContent = value + "%";

        // optionally adjust bootstrap color
        if (params.color) {
            barInner.classList.add("bg-" + params.color);
        }
        bar.appendChild(barInner);

        container.appendChild(bar);
    }
});

/**
 * Registers a generic avatar widget.
 */
webexpress.webui.DashboardWidgets.register("widget_avatar", {
    title: "Avatar",
    icon: "fas fa-user",

    /**
     * Renders a user/character avatar with name and optional caption.
     * @param {HTMLElement} container - The container element to render into.
     * @param {object} data - The widget data. 
     */
    render: function (container, data) {
        const params = data.params || {};
        const img = document.createElement("img");
        img.className = "rounded-circle mb-2";
        img.alt = params.name || "Avatar";
        img.style.width = "64px";
        img.style.height = "64px";
        img.src = params.image;

        const name = document.createElement("div");
        name.className = "fw-bold text-center";
        name.textContent = params.name;

        const subtitle = document.createElement("div");
        subtitle.className = "text-muted small text-center";
        subtitle.textContent = params.caption || "";
        if (params.image) {
            container.appendChild(img);
        }
        container.appendChild(name);
        if (subtitle.textContent) {
            container.appendChild(subtitle);
        }
    }
});

/**
 * Registers a generic bullet list widget.
 */
webexpress.webui.DashboardWidgets.register("widget_list", {
    title: "Info List",
    icon: "fas fa-list",

    /**
     * Renders a list of arbitrary items.
     * @param {HTMLElement} container - The container element to render into.
     * @param {object} data - The widget data.
     */
    render: function (container, data) {
        const params = data.params || {};
        const items = (params.items && Array.isArray(params.items)) ? params.items : ["Item 1", "Item 2"];
        const ul = document.createElement("ul");
        ul.className = "list-group";
        for (let i = 0; i < items.length; i++) {
            const li = document.createElement("li");
            li.className = "list-group-item";
            li.textContent = items[i];
            ul.appendChild(li);
        }
        container.appendChild(ul);
    }
});

/**
 * Registers a big number widget in the dashboard registry.
 */
webexpress.webui.DashboardWidgets.register("widget_bignumber", {
    title: "Big Number",
    icon: "fas fa-hashtag",

    /**
     * Renders a large numeric value with label (e.g., for KPIs).
     * @param {HTMLElement} container - The container element to render into.
     * @param {object} data - The widget data.
     */
    render: function (container, data) {
        const params = data.params || {};
        const value = params.value;
        const label = params.label;

        // big number display
        const heading = document.createElement("div");
        heading.className = "display-3 fw-bold text-center";
        heading.textContent = value;

        // label below
        const sub = document.createElement("div");
        sub.className = "text-center text-muted";
        sub.textContent = label;

        container.appendChild(heading);
        container.appendChild(sub);
    }
});