/**
 * Default action definitions for the WebExpress.WebUI action registry.
 * Provides the built-in actions: modal, frame, split, fullscreen,
 * native-fullscreen, and filter.
 */

/**
 * Reads a data attribute for the given action prefix (primary/secondary).
 * @param {HTMLElement} element - The source element.
 * @param {string} prefix - "primary" or "secondary".
 * @param {string} name - Attribute suffix (e.g. "target", "uri", "size").
 * @returns {string|null} The attribute value or null.
 */
function getActionAttribute(element, prefix, name) {
    return element.getAttribute("data-wx-" + prefix + "-" + name) || null;
}

// modal action
webexpress.webui.Actions.register("modal", {
    execute: function (element, prefix, controller) {
        const target = getActionAttribute(element, prefix, "target");
        const uri = getActionAttribute(element, prefix, "uri");
        const size = getActionAttribute(element, prefix, "size");
        const instance = controller.getInstance(target);

        if (!instance) {
            // no instance found
        } else if (typeof instance.show === "function") {
            if (size) {
                instance.size = size;
            }
            if (uri) {
                instance.uri = uri;
            }
            instance.show();
        }
    }
});

// frame action
webexpress.webui.Actions.register("frame", {
    execute: function (element, prefix, controller) {
        const target = getActionAttribute(element, prefix, "target");
        const uri = getActionAttribute(element, prefix, "uri");
        const instance = controller.getInstance(target);

        if (!instance) {
            // no instance found
        } else if (uri) {
            instance.uri = uri;
        }
    }
});

// split action
webexpress.webui.Actions.register("split", {
    execute: function (element, prefix, controller) {
        const target = getActionAttribute(element, prefix, "target");
        const instance = controller.getInstance(target);
        if (instance && typeof instance.toggleSidePane === "function") {
            instance.toggleSidePane();
        }
    },
    init: function (element, prefix, controller) {
        document.addEventListener(webexpress.webui.Event.HIDE_EVENT, function (e) {
            if (e.detail.sender === element) {
                const target = getActionAttribute(element, prefix, "target");
                const instance = controller.getInstance(target);
                if (instance) {
                    instance.collapsed = true;
                }
            }
        });

        document.addEventListener(webexpress.webui.Event.SHOW_EVENT, function (e) {
            if (e.detail.sender === element) {
                const target = getActionAttribute(element, prefix, "target");
                const instance = controller.getInstance(target);
                if (instance) {
                    instance.collapsed = false;
                }
            }
        });
    }
});

// css fullscreen toggle
webexpress.webui.Actions.register("fullscreen", {
    execute: function (element, prefix, controller, e) {
        e.preventDefault();
        e.stopPropagation(); // stop bubbling to prevent parent handlers from closing

        const targetSelector = getActionAttribute(element, prefix, "target");
        // default to body if no target is specified
        const targetEl = targetSelector ? document.querySelector(targetSelector) : document.body;

        if (targetEl) {
            controller.toggleFullscreen(targetEl);
        } else {
            console.warn("Fullscreen target not found:", targetSelector);
        }
    },
    init: function (element) {
        element.setAttribute("aria-pressed", "false");
    }
});

// native browser fullscreen toggle
webexpress.webui.Actions.register("native-fullscreen", {
    execute: function (element, prefix, controller, e) {
        e.preventDefault();

        const targetSelector = getActionAttribute(element, prefix, "target");
        const targetEl = targetSelector ? document.querySelector(targetSelector) : document.documentElement;

        if (targetEl) {
            controller.toggleNativeFullscreen(targetEl);
        }
    },
    init: function (element) {
        element.setAttribute("aria-pressed", "false");
    }
});

// quickfilter action
webexpress.webui.Actions.register("filter", {
    execute: function (element, prefix, controller, e) {
        e.preventDefault();
        webexpress.webui.FilterRegistry.toggle(element.id);
    }
});

// darkmode toggle action
webexpress.webui.Actions.register("darkmode", {
    execute: function (element, prefix, controller, e) {
        if (e) {
            e.preventDefault();
        }
        webexpress.webui.DarkMode.toggle();
    },
    init: function (element, prefix) {
        const iconLight = getActionAttribute(element, prefix, "icon-light") || "fas fa-moon";
        const iconDark = getActionAttribute(element, prefix, "icon-dark") || "fas fa-sun";
        const textLight = getActionAttribute(element, prefix, "text-light");
        const textDark = getActionAttribute(element, prefix, "text-dark");

        const sync = function (mode) {
            const isDark = mode === "dark";

            // swap icon — look up each time since dropdown JS may build the <i> after init
            const iconEl = element.querySelector("i");
            if (iconEl) {
                iconEl.className = isDark ? iconDark : iconLight;
            }

            // swap text — dropdown items wrap text in a <span>; plain buttons use text nodes
            if (textLight || textDark) {
                const label = isDark ? (textDark || textLight) : (textLight || textDark);
                const spanEl = element.querySelector("span");
                if (spanEl) {
                    spanEl.textContent = label;
                } else {
                    Array.from(element.childNodes)
                        .filter(function (n) { return n.nodeType === Node.TEXT_NODE && n.textContent.trim(); })
                        .forEach(function (n) { n.textContent = " " + label; });
                }
            }

            element.setAttribute("aria-pressed", isDark ? "true" : "false");
        };

        sync(webexpress.webui.DarkMode.current);

        document.addEventListener(webexpress.webui.Event.CHANGE_DARKMODE_EVENT, function (e) {
            sync(e.detail && e.detail.mode);
        });
    }
});
