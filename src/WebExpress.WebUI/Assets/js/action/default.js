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
