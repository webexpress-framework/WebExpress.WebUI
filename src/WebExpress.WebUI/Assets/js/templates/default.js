// Date renderer
webexpress.webui.TableTemplates.register("date", (val, table, row, cell, name, opts) => {
    // ensure opts is an object to prevent runtime errors
    opts = opts || {};

    if (!val) {
        return "";
    }
    const editable = opts.editable === true || opts.editable === "true";
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
        if (row.id) {
            container.dataset.objectId = row.id;
        }
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

    if (!val) {
        return "";
    }
    const editable = opts.editable === true || opts.editable === "true";
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
        if (row.id) {
            container.dataset.objectId = row.id;
        }
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

    if (!val) {
        return "";
    }
    const editable = opts.editable === true || opts.editable === "true";
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
        if (row.id) {
            container.dataset.objectId = row.id;
        }
        container.id = `${row.id}_${name}`;
        container.appendChild(editor);
        container.setAttribute("data-form-method", "PATCH");
        container.setAttribute("data-form-action", row.restApi);
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
        if (row.id) {
            container.dataset.objectId = row.id;
        }
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // read-only
        const ctrl = new webexpress.webui.SelectionCtrl(container);
        ctrl.options = options;
        ctrl.value = val;
    }

    return container;
});

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
        if (row.id) {
            container.dataset.objectId = row.id;
        }
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
        if (row && row.id) {
            container.dataset.objectId = row.id;
        }

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
        if (row && row.id) {
            container.dataset.objectId = row.id;
        }

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
        if (row.id) {
            container.dataset.objectId = row.id;
        }
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
        if (row.id) {
            container.dataset.objectId = row.id;
        }
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // read-only
        const ctrl = new webexpress.webui.RatingCtrl(container);
        ctrl.stars = stars;
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
        if (row.id) {
            container.dataset.objectId = row.id;
        }
        new webexpress.webui.SmartEditCtrl(container);
    } else {
        // read-only
        container.innerHTML = val;
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

        if (row.id) {
            container.dataset.objectId = row.id;
        }
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