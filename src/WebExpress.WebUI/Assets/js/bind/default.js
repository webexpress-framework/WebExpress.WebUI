/**
 * Default bind definitions for the WebExpress.WebUI bind registry.
 * Provides the built-in binds: search, paging, filter, darkmode, hide, disable.
 *
 * Each bind definition exposes a single `bind(element, controller)` hook
 * that is called once per element when the binding is established.
 * The element carries all relevant data-wx-bind-* attributes at that point.
 */

/**
 * Resolves the source element for source-based binds.
 * Reads data-wx-source-{bindName} or the generic data-wx-source attribute.
 * @param {HTMLElement} element - The bound element.
 * @param {string} bindName - The bind name used as the attribute suffix.
 * @returns {HTMLElement|null} The resolved source element or null.
 */
function resolveSourceElement(element, bindName) {
    const selector = element.getAttribute(`data-wx-source-${bindName}`) ||
        element.getAttribute("data-wx-source");

    if (!selector) {
        return null;
    }

    const sourceElement = document.querySelector(selector);

    if (!sourceElement) {
        console.warn(`Source element not found for bind "${bindName}":`, selector);
    }

    return sourceElement || null;
}

/**
 * Resolves the effective target for hide/disable operations.
 * When the element is inside a fieldset.wx-form-group, that fieldset is
 * returned so the entire form group is affected rather than just the input.
 * @param {HTMLElement} element - The directly bound element.
 * @returns {HTMLElement} The fieldset ancestor or the element itself.
 */
function resolveFormTarget(element) {
    return element.closest("fieldset.wx-form-group") || element;
}

/**
 * Reads the current value of a source element in a normalised way.
 * Checkboxes and radio buttons return "true"/"false" based on their checked
 * state. All other inputs return their .value string.
 * @param {HTMLElement} sourceElement - The watched source element.
 * @returns {string} The current normalised value.
 */
function readSourceValue(sourceElement) {
    if (sourceElement.type === "checkbox" || sourceElement.type === "radio") {
        return sourceElement.checked ? "true" : "false";
    }

    return sourceElement.value ?? "";
}

/**
 * Normalises common boolean string representations to a canonical form so
 * that "1", "on", "yes", and "true" all compare equal, regardless of case.
 * Non-boolean strings are returned lower-cased and trimmed.
 * @param {string} value - The value to normalise.
 * @returns {string} The normalised value.
 */
function normaliseBoolValue(value) {
    const lower = (value ?? "").trim().toLowerCase();

    if (lower === "1" || lower === "on" || lower === "yes" || lower === "true") {
        return "true";
    }

    if (lower === "0" || lower === "off" || lower === "no" || lower === "false") {
        return "false";
    }

    return lower;
}

/**
 * Evaluates whether a source value satisfies a condition expression.
 *
 * Supported condition formats:
 *   value          Plain equality (boolean-normalised). Example: "true", "1", "yes"
 *   =value         Explicit equality prefix (boolean-normalised).
 *   !=value        Not-equal (boolean-normalised string comparison).
 *   >number        Numeric greater-than.
 *   >=number       Numeric greater-than-or-equal.
 *   <number        Numeric less-than.
 *   <=number       Numeric less-than-or-equal.
 *   /pattern/flags Regular-expression match. Example: "/^foo/i"
 *
 * @param {string} rawSourceValue - The current value read from the source element.
 * @param {string} condition - The condition expression from the data attribute.
 * @returns {boolean} True when the condition is satisfied.
 */
function matchesCondition(rawSourceValue, condition) {
    // 1. regex: /pattern/flags
    const reMatch = /^\/(.*)\/([gimsuy]*)$/.exec(condition ?? "");
    if (reMatch) {
        try {
            return new RegExp(reMatch[1], reMatch[2]).test(rawSourceValue);
        } catch (e) {
            console.warn("bind: invalid regex condition:", condition, e);
            return false;
        }
    }

    // 2. numeric comparisons: >=, <=, >, <
    const numMatch = /^(>=|<=|>|<)(.+)$/.exec(condition ?? "");
    if (numMatch) {
        const lhs = parseFloat(rawSourceValue);
        const rhs = parseFloat(numMatch[2]);
        if (isNaN(lhs) || isNaN(rhs)) {
            return false;
        }
        switch (numMatch[1]) {
            case ">=": return lhs >= rhs;
            case "<=": return lhs <= rhs;
            case ">":  return lhs > rhs;
            case "<":  return lhs < rhs;
        }
    }

    // 3. not-equal (boolean-normalised string comparison)
    if ((condition ?? "").startsWith("!=")) {
        return normaliseBoolValue(rawSourceValue) !== normaliseBoolValue(condition.slice(2));
    }

    // 4. explicit equal prefix
    if ((condition ?? "").startsWith("=")) {
        return normaliseBoolValue(rawSourceValue) === normaliseBoolValue(condition.slice(1));
    }

    // 5. plain equality â€” default / current behavior
    return normaliseBoolValue(rawSourceValue) === normaliseBoolValue(condition ?? "");
}

// search bind â€” forwards CHANGE_FILTER_EVENT from a source element to the bound control's search() method
webexpress.webui.Binds.register("search", {
    bind(element, controller) {
        const sourceElement = resolveSourceElement(element, "search");

        if (!sourceElement) {
            return;
        }

        sourceElement.addEventListener(webexpress.webui.Event.CHANGE_FILTER_EVENT, (e) => {
            const query = e.detail?.value;
            const searchType = e.detail?.searchType;
            const instance = controller.getInstanceByElement(element);
            if (typeof instance?.search === "function") {
                instance.search(query, searchType);
            }
        });
    }
});

// paging bind â€” forwards CHANGE_PAGE_EVENT from a source element to the bound control's paging() method
webexpress.webui.Binds.register("paging", {
    bind(element, controller) {
        const sourceElement = resolveSourceElement(element, "paging");

        if (!sourceElement) {
            return;
        }

        sourceElement.addEventListener(webexpress.webui.Event.CHANGE_PAGE_EVENT, (e) => {
            const page = e.detail?.page;
            const instance = controller.getInstanceByElement(element);
            if (typeof instance?.paging === "function") {
                instance.paging(page);
            }
        });
    }
});

// filter bind â€” reacts to global CHANGE_FILTER_EVENT and forwards active filters to the bound control
webexpress.webui.Binds.register("filter", {
    bind(element, controller) {
        document.addEventListener(webexpress.webui.Event.CHANGE_FILTER_EVENT, () => {
            const instance = controller.getInstanceByElement(element);
            if (typeof instance?.filter === "function") {
                instance.filter(webexpress.webui.FilterRegistry.getActiveFilters());
            } else {
                element.dispatchEvent(new Event("change", { bubbles: true }));
            }
        });
    }
});

// darkmode bind â€” syncs the icon and text of the bound element to the current dark mode state
webexpress.webui.Binds.register("darkmode", {
    bind(element) {
        const iconLight = element.getAttribute("data-wx-bind-icon-light") || "fas fa-moon";
        const iconDark = element.getAttribute("data-wx-bind-icon-dark") || "fas fa-sun";
        const textLight = element.getAttribute("data-wx-bind-text-light");
        const textDark = element.getAttribute("data-wx-bind-text-dark");

        const sync = (mode) => {
            const isDark = mode === "dark";

            // swap icon â€” look up each time since dropdown JS may build the <i> after init
            const iconEl = element.querySelector("i");
            if (iconEl) {
                iconEl.className = isDark ? iconDark : iconLight;
            }

            // swap text â€” dropdown items wrap text in a <span>; plain buttons use text nodes
            if (textLight || textDark) {
                const label = isDark ? (textDark || textLight) : (textLight || textDark);
                const spanEl = element.querySelector("span");
                if (spanEl) {
                    spanEl.textContent = label;
                } else {
                    Array.from(element.childNodes)
                        .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
                        .forEach((n) => { n.textContent = " " + label; });
                }
            }

            element.setAttribute("aria-pressed", isDark ? "true" : "false");
        };

        // sync on initialization
        sync(webexpress.webui.DarkMode.current);

        // sync on every darkmode change event
        document.addEventListener(webexpress.webui.Event.CHANGE_DARKMODE_EVENT, (e) => {
            sync(e.detail && e.detail.mode);
        });
    }
});

// hide bind â€” hides the element (or its enclosing fieldset.wx-form-group) when the source value satisfies the condition
webexpress.webui.Binds.register("hide", {
    bind(element) {
        const sourceElement = resolveSourceElement(element, "hide");

        if (!sourceElement) {
            return;
        }

        const condition = element.getAttribute("data-wx-bind-value-hide") ?? "";
        const target = resolveFormTarget(element);

        const sync = () => {
            const matches = matchesCondition(readSourceValue(sourceElement), condition);
            target.classList.toggle("d-none", matches);
            target.setAttribute("aria-hidden", matches ? "true" : "false");
        };

        // sync on initialization
        sync();

        // sync on every change and input event of the source
        sourceElement.addEventListener("change", sync);
        sourceElement.addEventListener("input", sync);
    }
});

// disable bind â€” disables the element (or its enclosing fieldset.wx-form-group) when the source value satisfies the condition
webexpress.webui.Binds.register("disable", {
    bind(element) {
        const sourceElement = resolveSourceElement(element, "disable");

        if (!sourceElement) {
            return;
        }

        const condition = element.getAttribute("data-wx-bind-value-disable") ?? "";
        const target = resolveFormTarget(element);

        const sync = () => {
            const matches = matchesCondition(readSourceValue(sourceElement), condition);

            if (target.tagName === "FIELDSET") {
                // a disabled fieldset propagates to all its form controls automatically
                target.disabled = matches;
            } else {
                target.disabled = matches;
                target.setAttribute("aria-disabled", matches ? "true" : "false");
            }
        };

        // sync on initialization
        sync();

        // sync on every change and input event of the source
        sourceElement.addEventListener("change", sync);
        sourceElement.addEventListener("input", sync);
    }
