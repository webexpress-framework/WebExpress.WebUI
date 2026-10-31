/**
 * Points the inline editor of a cell at the record of its row, so a finished edit is
 * written to the endpoint the row carries in "restApi" instead of only announcing itself
 * through the save event. Without this an editable column can be edited but never saves.
 *
 * The payload name is the column name, so the request body is { name: value }. The
 * SmartEditCtrl drops the field it reserves for the value when the editor already
 * contributes a control of that name, so an editor may carry the name as well.
 *
 * @param {HTMLElement} container - The cell container the SmartEditCtrl is mounted on.
 * @param {Object} row - The row data.
 * @param {string} name - The payload name of the column.
 */
webexpress.webui.TableTemplates.bindInlineEdit = (container, row, name) => {
    if (!row) {
        return;
    }

    if (row.id !== null && typeof row.id !== "undefined") {
        container.dataset.objectId = row.id;
    }

    // without an endpoint the host owns the persistence and listens for the save event
    if (!row.restApi || !name) {
        return;
    }

    container.setAttribute("data-object-name", name);
    container.setAttribute("data-form-action", row.restApi);
    container.setAttribute("data-form-method", "PUT");
};

// Date renderer
webexpress.webui.TableTemplates.register("date", (val, table, row, cell, name, opts) => {
    // ensure opts is an object to prevent runtime errors
    opts = opts || {};

    const editable = opts.editable === true || opts.editable === "true";
    // an editable cell keeps its editor when empty, otherwise a date could never be entered
    if (!val && !editable) {
        return "";
    }
    const format = opts.format || "yyyy-MM-dd";
    const placeholder = opts.placeholder || null;
    const cssColor = opts.colorCss || null;
    const styleColor = opts.colorStyle || null;
    const container = document.createElement("div");

    if (editable) {
        const editor = document.createElement("div");
        const inputCtrl = new webexpress.webui.InputDateCtrl(editor);
        editor._wx_controller = inputCtrl;
        inputCtrl.format = format;
        inputCtrl._placeholderText = placeholder;
        inputCtrl.value = val;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        if (cssColor) {
            container.setAttribute("data-color-css", cssColor);
        }
        if (styleColor) {
            container.setAttribute("data-color-style", styleColor);
        }
        const ctrl = new webexpress.webui.DateCtrl(container);
        ctrl.format = format;
        ctrl.value = val;
    }

    return container;
});

// Calendar renderer
webexpress.webui.TableTemplates.register("calendar", (val, table, row, cell, name, opts) => {
    // ensure opts is an object
    opts = opts || {};

    const editable = opts.editable === true || opts.editable === "true";
    // an editable cell keeps its editor when empty, otherwise a date could never be entered
    if (!val && !editable) {
        return "";
    }
    const format = opts.format || "yyyy-MM-dd";
    const placeholder = opts.placeholder || null;
    const cssColor = opts.colorCss || null;
    const styleColor = opts.colorStyle || null;
    const container = document.createElement("div");

    if (editable) {
        const editor = document.createElement("div");
        const inputCtrl = new webexpress.webui.InputCalendarCtrl(editor);
        editor._wx_controller = inputCtrl;
        inputCtrl.format = format;
        inputCtrl._placeholderText = placeholder;
        inputCtrl.value = val;
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        container.appendChild(editor);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        if (cssColor) {
            container.setAttribute("data-color-css", cssColor);
        }
        if (styleColor) {
            container.setAttribute("data-color-style", styleColor);
        }
        const ctrl = new webexpress.webui.DateCtrl(container);
        ctrl.format = format;
        ctrl.value = val;
    }

    return container;
});

// Tag renderer
webexpress.webui.TableTemplates.register("tag", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    const editable = opts.editable === true || opts.editable === "true";
    // an editable cell keeps its editor when empty, otherwise removing the last tag
    // would leave no way to add one again
    if (!val && !editable) {
        return "";
    }
    const container = document.createElement("div");
    const cssColor = opts.colorCss || null;
    const styleColor = opts.colorStyle || null;
    const placeholder = opts.placeholder || null;

    if (editable) {
        const editor = document.createElement("div");
        editor.setAttribute("name", name);
        const inputCtrl = new webexpress.webui.InputTagCtrl(editor);
        editor._wx_controller = inputCtrl;
        inputCtrl._colorCss = cssColor;
        inputCtrl._colorStyle = styleColor;
        inputCtrl._placeholderText = placeholder;
        inputCtrl.value = val;
        container.id = `${row.id}_${name}`;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);

    } else {
        const ctrl = new webexpress.webui.TagCtrl(container);
        ctrl._colorCss = cssColor;
        ctrl._colorStyle = styleColor;
        ctrl.value = val;
    }

    return container;
});

// Selection renderer
webexpress.webui.TableTemplates.register("selection", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    if ((val === null || val === undefined || val === "") && !opts.editable) {
        return "";
    }

    const container = document.createElement("div");
    const editable = opts.editable === true || opts.editable === "true";
    const multiselection = opts.multiselection || null;
    let options = [];

    if (opts.children && opts.children.length > 0) {
        options = opts.children.map((child) => {
            return {
                id: child.getAttribute("id") || null,
                label: child.dataset.label || child.textContent.trim(),
                labelColor: child.dataset.labelColor || null,
                icon: child.dataset.icon || null,
                image: child.dataset.image || null,
                // keep original rich content if needed later
                content: child.innerHTML || "",
                disabled: child.hasAttribute("disabled")
            };
        });
    } else if (opts.options) {
        try {
            options = JSON.parse(opts.options);
        } catch (e) {
            // ignore parse error
        }
    }

    if (editable) {
        const editor = document.createElement("div");
        editor.id = "wx_" + Math.random().toString(36).slice(2, 7);
        const inputCtrl = new webexpress.webui.InputSelectionCtrl(editor);
        inputCtrl.options = options;
        inputCtrl.multiSelect = multiselection;
        inputCtrl.value = val;
        editor._wx_controller = inputCtrl;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // read-only
        const ctrl = new webexpress.webui.SelectionCtrl(container);
        ctrl.options = options;
        ctrl.value = val;
    }

    return container;
});

// Dnf renderer
webexpress.webui.TableTemplates.register("dnf", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    if ((val === null || val === undefined || val === "") && !opts.editable) {
        return "";
    }

    const container = document.createElement("div");
    const editable = opts.editable === true || opts.editable === "true";
    const options = webexpress.webui.TableTemplates.dnfOptions(opts);

    if (editable) {
        const editor = document.createElement("div");
        editor.id = "wx_" + Math.random().toString(36).slice(2, 7);
        editor.setAttribute("name", name);
        if (opts.placeholder) {
            editor.setAttribute("placeholder", opts.placeholder);
        }
        if (opts.maxGroups) {
            editor.dataset.maxGroups = opts.maxGroups;
        }
        const inputCtrl = new webexpress.webui.InputDnfCtrl(editor);
        inputCtrl.options = options;
        inputCtrl.value = val;
        editor._wx_controller = inputCtrl;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // a cell is narrower than the expression it may hold, so the read state
        // clips to one line unless the column asked for the full rendering
        container.dataset.compact = opts.compact === "false" ? "false" : "true";
        if (opts.placeholder) {
            container.dataset.placeholder = opts.placeholder;
        }
        const ctrl = new webexpress.webui.DnfCtrl(container);
        ctrl.options = options;
        ctrl.value = val;
    }

    return container;
});

/**
 * Reads the selectable terms of a DNF column, which arrive either as the
 * template's child elements (a server rendered table) or as embedded JSON (a
 * REST rendered table).
 *
 * @param {Object} opts - The renderer options of the column.
 * @returns {Array} The items.
 */
webexpress.webui.TableTemplates.dnfOptions = (opts) => {
    if (opts.children && opts.children.length > 0) {
        return opts.children.map((child) => {
            return {
                id: child.getAttribute("id") || null,
                label: child.dataset.label || child.textContent.trim(),
                color: child.dataset.color || child.dataset.labelColor || null,
                icon: child.dataset.icon || null,
                image: child.dataset.image || null,
                content: child.innerHTML || "",
                disabled: child.hasAttribute("disabled")
            };
        });
    }

    if (opts.options) {
        try {
            return JSON.parse(opts.options);
        } catch (e) {
            // a malformed option list costs the labels, not the expression: the
            // controls fall back to rendering the term ids themselves
            return [];
        }
    }

    return [];
};

// Combo renderer
webexpress.webui.TableTemplates.register("combo", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    if ((val === null || val === undefined || val === "") && !opts.editable) {
        return "";
    }

    const container = document.createElement("div");
    const editable = opts.editable === true || opts.editable === "true";
    let options = [];

    // parse generic children
    if (opts.children && opts.children.length > 0) {
        options = opts.children.map((child) => {
            return {
                value: child.value || child.id || child.text,
                text: child.text
            };
        });
    } else if (opts.options) {
        try {
            options = JSON.parse(opts.options);
        } catch (e) {
            // ignore parse error
        }
    }

    if (editable) {
        const select = document.createElement("select");
        select.className = "form-select";
        select.id = "wx_" + Math.random().toString(36).slice(2, 7);

        options.forEach((opt) => {
            const optionEl = document.createElement("option");
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;

            if (String(opt.value) === String(val)) {
                optionEl.selected = true;
            }
            select.appendChild(optionEl);
        });
        container.appendChild(select);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // read-only
        const valStr = String(val ?? "");
        const match = options.find((o) => {
            return String(o.value) === valStr;
        });
        container.textContent = match ? (match.text || match.label) : valStr;
    }

    return container;
});

// Text renderer
// Registers a simple text renderer that shows a native input[type="text"] in edit mode
// and a plain text node in read-only mode.
webexpress.webui.TableTemplates.register("text", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    const container = document.createElement("div");
    const editable = opts.editable === true || opts.editable === "true";
    const cssColor = opts.colorCss || null;
    const styleColor = opts.colorStyle || null;
    const placeholder = opts.placeholder || null;

    if (editable) {
        // create native text input for editing
        const input = document.createElement("input");
        input.type = "text";
        input.className = "form-control";
        input.id = "wx_" + Math.random().toString(36).slice(2, 7);
        input.value = val !== null && typeof val !== "undefined" ? String(val) : "";

        // apply placeholder
        if (placeholder) {
            input.placeholder = placeholder;
        }

        // attach input to container
        container.appendChild(input);

        // set optional object id for smart edit/save integration
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);

        // initialize smarteditctrl so inline-edit lifecycle is available
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // create simple text view for read-only mode
        const span = document.createElement("span");
        // apply color (CSS class or inline style)
        if (cssColor) {
            span.classList.add(cssColor);
        }
        if (styleColor) {
            span.style = styleColor;
        }
        span.textContent = val !== null && typeof val !== "undefined" ? String(val) : "";
        container.appendChild(span);
    }

    return container;
});

// Numeric renderer
// Registers a simple numeric renderer that shows a native input[type="number"] in edit mode
// and a plain text node in read-only mode.
webexpress.webui.TableTemplates.register("numeric", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    // container for renderer output
    const container = document.createElement("div");

    // determine if field should be editable
    const editable = opts.editable === true || opts.editable === "true";
    const cssColor = opts.colorCss || null;
    const styleColor = opts.colorStyle || null;
    const placeholder = opts.placeholder || null;

    if (editable) {
        // create native number input for editing
        const input = document.createElement("input");
        input.type = "number";
        input.className = "form-control";
        input.id = "wx_" + Math.random().toString(36).slice(2, 7);

        // set value if provided
        if (val !== null && typeof val !== "undefined" && val !== "") {
            input.value = String(val);
        } else {
            input.value = "";
        }

        // apply placeholder
        if (placeholder) {
            input.placeholder = placeholder;
        }

        // set optional numeric attributes from options (if provided)
        if (typeof opts.min !== "undefined") {
            input.setAttribute("min", String(opts.min));
        }
        if (typeof opts.max !== "undefined") {
            input.setAttribute("max", String(opts.max));
        }
        if (typeof opts.step !== "undefined") {
            input.setAttribute("step", String(opts.step));
        }

        // append input to container
        container.appendChild(input);

        // set optional object id for smart edit/save integration
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);

        // initialize smarteditctrl so inline-edit lifecycle is available
        new webexpress.webui.SmartEditCtrl(container);

    } else {
        // create simple text view for read-only mode
        const span = document.createElement("span");
        // apply color (CSS class or inline style)
        if (cssColor) {
            span.classList.add(cssColor);
        }
        if (styleColor) {
            span.style = styleColor;
        }
        span.textContent = val !== null && typeof val !== "undefined" ? String(val) : "";
        container.appendChild(span);
    }

    return container;
});

// Move renderer
webexpress.webui.TableTemplates.register("move", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    if ((val === null || val === undefined || val === "") && !opts.editable) {
        return "";
    }

    const container = document.createElement("div");
    const editable = opts.editable === true || opts.editable === "true";
    let options = [];

    if (opts.children && opts.children.length > 0) {
        options = opts.children.map((child) => {
            return {
                id: child.getAttribute("id") || null,
                label: child.dataset.label || child.textContent.trim(),
                labelColor: child.dataset.labelColor || null,
                icon: child.dataset.icon || null,
                image: child.dataset.image || null,
                // keep original rich content if needed later
                content: child.innerHTML || "",
                disabled: child.hasAttribute("disabled")
            };
        });
    } else if (opts.options) {
        try {
            options = JSON.parse(opts.options);
        } catch (e) {
            // ignore parse error
        }
    }

    if (editable) {
        const editor = document.createElement("div");
        editor.id = "wx_" + Math.random().toString(36).slice(2, 7);
        const inputCtrl = new webexpress.webui.InputMoveCtrl(editor);
        inputCtrl.options = options;
        inputCtrl.value = val;
        editor._wx_controller = inputCtrl;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // read-only
        const ctrl = new webexpress.webui.MoveCtrl(container);
        ctrl.options = options;
        ctrl.value = val;
    }

    return container;
});

// Rating renderer
webexpress.webui.TableTemplates.register("rating", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    if ((val === null || val === undefined || val === "") && !opts.editable) {
        return "";
    }

    const container = document.createElement("div");
    const editable = opts.editable === true || opts.editable === "true";
    const stars = opts.stars || 5;

    if (editable) {
        const editor = document.createElement("div");
        editor.id = "wx_" + Math.random().toString(36).slice(2, 7);
        const inputCtrl = new webexpress.webui.InputRatingCtrl(editor);
        inputCtrl.stars = stars;
        inputCtrl.value = val;
        editor._wx_controller = inputCtrl;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // read-only
        const ctrl = new webexpress.webui.RatingCtrl(container);
        ctrl.stars = stars;
        ctrl.value = val;
    }

    return container;
});

// Barcode renderer
webexpress.webui.TableTemplates.register("barcode", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    if ((val === null || val === undefined || val === "") && !opts.editable) {
        return "";
    }

    const container = document.createElement("div");
    const editable = opts.editable === true || opts.editable === "true";
    const type = opts.barcodeType || opts.type || "code128";
    const level = opts.level || "M";
    const colors = [
        ["data-color-css", opts.colorCss],
        ["data-color-style", opts.colorStyle],
        ["data-bgcolor-css", opts.bgcolorCss],
        ["data-bgcolor-style", opts.bgcolorStyle]
    ].filter(([, value]) => value);

    if (editable) {
        const editor = document.createElement("div");
        editor.id = "wx_" + Math.random().toString(36).slice(2, 7);
        colors.forEach(([attribute, value]) => editor.setAttribute(attribute, value));
        const inputCtrl = new webexpress.webui.InputBarcodeCtrl(editor);
        inputCtrl.type = type;
        inputCtrl.level = level;
        inputCtrl.value = val;
        editor._wx_controller = inputCtrl;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // read-only
        colors.forEach(([attribute, value]) => container.setAttribute(attribute, value));
        const ctrl = new webexpress.webui.BarcodeCtrl(container);
        ctrl.level = level;
        ctrl.type = type;
        ctrl.value = val;
    }

    return container;
});

// Traffic light renderer
webexpress.webui.TableTemplates.register("traffic-light", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    if ((val === null || val === undefined || val === "") && !opts.editable) {
        return "";
    }

    const container = document.createElement("div");
    const editable = opts.editable === true || opts.editable === "true";
    const orientation = opts.orientation || "vertical";
    const size = opts.size || "";

    if (editable) {
        const editor = document.createElement("div");
        editor.id = "wx_" + Math.random().toString(36).slice(2, 7);
        editor.dataset.orientation = orientation;
        if (size) {
            editor.classList.add("wx-traffic-light-" + size);
        }
        const inputCtrl = new webexpress.webui.InputTrafficLightCtrl(editor);
        inputCtrl.value = val;
        editor._wx_controller = inputCtrl;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // read-only
        container.dataset.orientation = orientation;
        if (size) {
            container.classList.add("wx-traffic-light-" + size);
        }
        const ctrl = new webexpress.webui.TrafficLightCtrl(container);
        ctrl.value = val;
    }

    return container;
});

// Editor renderer
webexpress.webui.TableTemplates.register("editor", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    if ((val === null || val === undefined || val === "") && !opts.editable) {
        return "";
    }

    const container = document.createElement("div");
    const editable = opts.editable === true || opts.editable === "true";

    if (editable) {
        const editor = document.createElement("div");
        editor.id = "wx_" + Math.random().toString(36).slice(2, 7);
        const inputCtrl = new webexpress.webui.EditorCtrl(editor);
        inputCtrl.value = val;
        editor._wx_controller = inputCtrl;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // the stored value is the editor's working surface, so the cell shows the
        // reading view of it instead of the add-on frames and guard paragraphs
        const ctrl = new webexpress.webui.ContentCtrl(container);
        ctrl.value = val;
    }

    return container;
});

// Color renderer
webexpress.webui.TableTemplates.register("color", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    if ((val === null || val === undefined || val === "") && !opts.editable) {
        return "";
    }

    const container = document.createElement("div");
    const editable = opts.editable === true || opts.editable === "true";

    if (editable) {
        const editor = document.createElement("div");
        editor.id = "wx_" + Math.random().toString(36).slice(2, 7);

        // set name for form submission if available
        if (name) {
            editor.setAttribute("name", name);
        }

        const inputCtrl = new webexpress.webui.InputColorCtrl(editor);
        inputCtrl.value = val;

        editor._wx_controller = inputCtrl;
        container.appendChild(editor);

        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // read-only view
        if (opts.tooltip) {
            container.dataset.tooltip = opts.tooltip;
        }

        const ctrl = new webexpress.webui.ColorCtrl(container);
        ctrl.value = val;
    }

    return container;
});

// Country renderer - the flag and name of each code read-only, a country picker in edit mode
webexpress.webui.TableTemplates.register("country", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    const editable = opts.editable === true || opts.editable === "true";
    if ((val === null || val === undefined || val === "") && !editable) {
        return "";
    }

    // a server template nests the countries named in the request language; a rest descriptor
    // embeds them as json, where an entry without a label is named by the browser
    let options = [];
    if (opts.children && opts.children.length > 0) {
        options = opts.children.map((child) => ({
            id: child.getAttribute("id"),
            label: child.dataset.label || child.getAttribute("data-label") || ""
        }));
    } else if (opts.options) {
        try {
            options = JSON.parse(opts.options);
        } catch (e) {
            // an unreadable list leaves the picker empty and the read view to the browser's names
        }
    }
    options = options
        .map((option) => ({ id: webexpress.webui.CountryCtrl.normalize(option.id), label: option.label || "" }))
        .filter((option) => option.id);

    const container = document.createElement("div");

    if (editable) {
        const locale = document.documentElement.getAttribute("lang") || navigator.language || "en";
        const names = new Intl.DisplayNames([locale], { type: "region" });
        const items = options
            .map((option) => {
                const label = option.label || names.of(option.id) || option.id;
                // the selection writes the content as markup, the name is plain text
                const content = label.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
                return { id: option.id, label: label, content: content, icon: "wx-flag wx-flag-" + option.id.toLowerCase() };
            })
            .sort((a, b) => a.label.localeCompare(b.label, locale));

        const editor = document.createElement("div");
        editor.id = "wx_" + Math.random().toString(36).slice(2, 7);
        if (name) {
            editor.setAttribute("name", name);
        }
        if (opts.placeholder) {
            editor.setAttribute("placeholder", opts.placeholder);
        }
        const inputCtrl = new webexpress.webui.InputSelectionCtrl(editor);
        inputCtrl.options = items;
        inputCtrl.multiSelect = opts.multiselection === true || opts.multiselection === "true";
        inputCtrl.value = val;
        editor._wx_controller = inputCtrl;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        const labels = new Map(options.map((option) => [option.id, option.label]));
        container.className = "wx-country-list";
        for (const code of String(val).split(";")) {
            const normalized = webexpress.webui.CountryCtrl.normalize(code);
            if (!normalized) {
                continue;
            }
            const host = document.createElement("div");
            host.setAttribute("data-value", normalized);
            if (opts.showName === false || opts.showName === "false") {
                host.setAttribute("data-show-name", "false");
            }
            host.textContent = labels.get(normalized) || "";
            container.appendChild(host);
            new webexpress.webui.CountryCtrl(host);
        }
    }

    return container;
});

// E-mail renderer - a link that writes to the address read-only, an e-mail field in edit mode
webexpress.webui.TableTemplates.register("email", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    const editable = opts.editable === true || opts.editable === "true";
    if ((val === null || val === undefined || val === "") && !editable) {
        return "";
    }

    const container = document.createElement("div");

    if (editable) {
        const input = document.createElement("input");
        input.type = "email";
        input.className = "form-control";
        input.id = "wx_" + Math.random().toString(36).slice(2, 7);
        input.setAttribute("autocomplete", "email");
        input.value = val !== null && val !== undefined ? String(val) : "";
        if (opts.placeholder) {
            input.placeholder = opts.placeholder;
        }
        container.appendChild(input);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        container.setAttribute("data-value", String(val));
        new webexpress.webui.EmailCtrl(container);
    }

    return container;
});

// Phone renderer - the flag and a link that dials the number read-only, the phone field in edit mode
webexpress.webui.TableTemplates.register("phone", (val, table, row, cell, name, opts) => {
    opts = opts || {};

    const editable = opts.editable === true || opts.editable === "true";
    if ((val === null || val === undefined || val === "") && !editable) {
        return "";
    }

    const container = document.createElement("div");

    if (editable) {
        const editor = document.createElement("div");
        editor.id = "wx_" + Math.random().toString(36).slice(2, 7);
        if (name) {
            editor.setAttribute("name", name);
        }
        if (opts.country) {
            editor.setAttribute("data-country", opts.country);
        }
        if (opts.placeholder) {
            editor.setAttribute("placeholder", opts.placeholder);
        }
        editor.setAttribute("data-value", val !== null && val !== undefined ? String(val) : "");
        const inputCtrl = new webexpress.webui.InputPhoneCtrl(editor);
        editor._wx_controller = inputCtrl;
        container.appendChild(editor);
        webexpress.webui.TableTemplates.bindInlineEdit(container, row, name);
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        container.setAttribute("data-value", String(val));
        new webexpress.webui.PhoneCtrl(container);
    }

    return container;
});

// Markdown renderer - renders a markdown subset (headings, emphasis, code,
// links and lists) as rich text. The raw value is escaped before the markup
// is rewritten, so markdown data cannot inject HTML. Read-only.
webexpress.webui.TableTemplates.register("markdown", (val, table, row, cell, name, opts) => {
    if (val === null || val === undefined || val === "") {
        return "";
    }

    const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));

    const inline = (s) => s
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/__([^_]+)__/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/_([^_]+)_/g, "<em>$1</em>")
        .replace(/~~([^~]+)~~/g, "<del>$1</del>")
        // escaping keeps the address inside its attribute but says nothing about its scheme
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, text, href) => webexpress.webui.EditorModel.url(href)
            ? "<a href=\"" + href + "\" target=\"_blank\" rel=\"noopener\">" + text + "</a>"
            : text);

    const out = [];
    // null while outside a list, otherwise the pending closing tag
    let listClose = null;
    let listOrdered = false;

    for (const line of escape(val).split(/\r?\n/)) {
        const item = line.match(/^\s*([-*+]|\d+\.)\s+(.*)$/);
        if (item) {
            const ordered = /\d/.test(item[1]);
            if (!listClose || listOrdered !== ordered) {
                if (listClose) {
                    out.push(listClose);
                }
                listOrdered = ordered;
                listClose = ordered ? "</ol>" : "</ul>";
                out.push(ordered ? "<ol>" : "<ul>");
            }
            out.push("<li>" + inline(item[2]) + "</li>");
            continue;
        }
        if (listClose) {
            out.push(listClose);
            listClose = null;
        }

        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            // a cell is data, not a section of the page: the heading keeps its look through the
            // size class but stays out of the outline a reader walks
            const level = heading[1].length;
            out.push("<p class=\"h" + level + " wx-table-markdown-heading\">" + inline(heading[2]) + "</p>");
            continue;
        }
        if (line.trim() === "") {
            continue;
        }
        out.push("<p>" + inline(line) + "</p>");
    }
    if (listClose) {
        out.push(listClose);
    }

    const container = document.createElement("div");
    container.className = "wx-table-markdown";
    container.innerHTML = out.join("");

    return container;
});

// Html renderer - renders the cell value as raw HTML. The content must come
// from a trusted source such as the server; data that may contain user input
// belongs in the text or markdown template, which escape the value. Read-only.
webexpress.webui.TableTemplates.register("html", (val, table, row, cell, name, opts) => {
    if (val === null || val === undefined || val === "") {
        return "";
    }

    const container = document.createElement("div");
    container.className = "wx-table-html";
    container.innerHTML = val;

    return container;
});