/**
 * registers the system stats widget in the dashboard registry.
 */
webexpress.webui.DashboardWidgets.register("w_stats", {
    title: "System Status",
    icon: "fas fa-server",
    removable: false,

    /**
     * renders the widget content.
     * @param {HTMLElement} container - the container element to render into.
     * @param {object} data - the widget data.
     */
    render: function (container, data) {
        // build internal markup
        const heading = document.createElement("h2");
        heading.className = "text-success";
        heading.textContent = "All systems operational";

        const paragraph = document.createElement("p");
        paragraph.textContent = "Uptime: 99.9%";

        container.appendChild(heading);
        container.appendChild(paragraph);
    }
});

/**
 * registers the active users widget in the dashboard registry.
 */
webexpress.webui.DashboardWidgets.register("w_users", {
    title: "Active Users",
    icon: "fas fa-users",

    /**
     * renders the widget content.
     * @param {HTMLElement} container - the container element to render into.
     * @param {object} data - the widget data, including custom params.
     */
    render: function (container, data) {
        // extract parameters with fallback values
        const params = data.params || {};
        const count = params.count || "1,420";
        
        // create the main number display
        const heading = document.createElement("h1");
        heading.className = "display-4 text-center";
        heading.textContent = count;

        // create the subtitle
        const paragraph = document.createElement("p");
        paragraph.className = "text-center text-muted";
        paragraph.textContent = "currently online";

        container.appendChild(heading);
        container.appendChild(paragraph);
    }
});

/**
 * Registers the revenue chart widget in the dashboard registry.
 * Utilizes the webexpress.webui.ChartCtrl by mapping parameters from the dashboard
 * widget container to the required data-* attributes for the chart.
 */
webexpress.webui.DashboardWidgets.register("w_chart", {
    title: "Umsatzübersicht",
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

        // set default attributes for a fully functional demo chart
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
        chartBox.setAttribute("data-title-text", "Umsatzübersicht");
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
 * registers the recent alerts widget in the dashboard registry.
 */
webexpress.webui.DashboardWidgets.register("w_alerts", {
    title: "Recent Alerts",
    icon: "fas fa-bell",

    /**
     * renders the widget content.
     * @param {HTMLElement} container - the container element to render into.
     * @param {object} data - the widget data.
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