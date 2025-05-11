var webexpress = webexpress || {}
webexpress.webui = {}

/**
 * Namespace webexpress.webui
 * The Controller class monitors changes in the DOM and creates instances of registered classes
 * for new DOM elements. These instances are managed in a map and are removed from the map when the
 * corresponding DOM elements are removed.
 */
webexpress.webui.Controller = new class {
    /**
     * Constructor
     */
    constructor() {
        this.instanceMap = new Map();
        this.classRegistry = new Map();
        this.observer = new MutationObserver(this.handleMutations.bind(this));
        this.observer.observe(document, { childList: true, subtree: true });
        this.overrideCreateElement();
        this.initModalHandler();
    }
    
    /**
     * Initializes modal handling using custom attributes
     */
    initModalHandler() {
        const controller = this; // Preserve reference to Controller instance
        
        $(document).ready(() => {
            // Open modal when clicking an element with data-wx-toggle="modal"
            $("[data-wx-toggle='modal']").click(function() {
                const target = $(this).attr("data-wx-target"); // Get the target modal ID
                const instance = controller.getInstance(target);
                instance?.show(); // Show modal
            });
        });
    }

    /**
     * Handler for DOM mutations.
     * @param {MutationRecord[]} mutationsList - List of MutationRecords representing the changes in the DOM.
     */
    handleMutations(mutationsList) {
        for (const mutation of mutationsList) {
            // Handle added nodes
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    this.createInstances(node);
                }
            }

            // Handle removed nodes
            for (const node of mutation.removedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    this.removeInstances(node);
                }
            }
        }
    }

    /**
     * Creates instances for new DOM elements.
     * @param {Element} element - The DOM element for which instances should be created.
     */
    createInstances(element) {
        for (const [selector, ClassConstructor] of this.classRegistry.entries()) {
            if ($(element).hasClass(selector)) {
                $(element).removeClass(selector);
                const instance = new ClassConstructor(element);
                this.instanceMap.set(element, instance);
            }
            $(element).find("." + selector).each((_, child) => {
                $(child).removeClass(selector);
                const instance = new ClassConstructor(child);
                this.instanceMap.set(child, instance);
            });
        }
    }

    /**
     * Removes instances for removed DOM elements.
     * @param {Element} element - The DOM element whose instances should be removed.
     */
    removeInstances(element) {
        if (this.instanceMap.has(element)) {
            this.instanceMap.delete(element);
        }
        $(element).find('*').each((_, child) => {
            if (this.instanceMap.has(child)) {
                this.instanceMap.delete(child);
            }
        });
    }

    /**
     * Registers a class with a selector.
     * @param {string} selector - The CSS selector to identify the DOM elements.
     * @param {Function} ClassConstructor - The constructor of the class to be created for the DOM elements.
     */
    registerClass(selector, ClassConstructor) {
        this.classRegistry.set(selector, ClassConstructor);
    }

    /**
     * Overrides document.createElement to track newly created elements.
     */
    overrideCreateElement() {
        const originalCreateElement = document.createElement.bind(document);
        document.createElement = (tagName, options) => {
            const element = originalCreateElement(tagName, options);
            // Create instances for the newly created element
            this.createInstances(element);
            return element;
        };
    }
    
    /**
     * Retrieves an instance based on a CSS selector (ID or class).
     * @param {string} selector - The CSS selector for the DOM element (e.g., "#elementId" or ".className").
     * @param {Function} [ClassConstructor] - (Optional) The constructor of the expected class instance.
     * @returns {Object|null} - The instance associated with the element, or null if not found or type mismatch.
     */
    getInstance(selector, ClassConstructor) {
        const $element = $(selector); // Use jQuery to select either an ID or class
        
        if ($element.length > 0 && this.instanceMap.has($element[0])) {
            const instance = this.instanceMap.get($element[0]);

            // If ClassConstructor is provided, check type; otherwise, return the instance
            if (ClassConstructor) {
                return instance instanceof ClassConstructor ? instance : null;
            }

            return instance;
        }
        return null;
    }
}

/**
 * Base class for Controls.
 * This abstract class provides fundamental functionalities such as initialization, rendering, updating, and destruction.
 */
webexpress.webui.Ctrl = class {
    /**
     * Creates a new instance of the Control class.
     * @param {HTMLElement} elem - The DOM element associated with this control.
     */
    constructor(elem) {
        if (new.target === webexpress.webui.Ctrl) {
            throw new Error("Control is an abstract class and cannot be instantiated directly.");
        }
        if (!(elem instanceof HTMLElement)) {
            throw new Error("Parameter 'element' must be an instance of HTMLElement.");
        }
        this._element = elem;
    }

    /**
     * Renders the control.
     * This method must be implemented in the derived class.
     */
    render() {
        throw new Error("The 'render()' method must be implemented in the derived class.");
    }

    /**
     * Updates the control.
     * By default, this method calls the render() method.
     * Derived classes can override this method to implement specific behavior.
     */
    update() {
        this.render();
    }

    /**
     * Destroys the control.
     * This method should be overridden to remove event listeners or perform other cleanup tasks.
     */
    destroy() {
        // Cleanup code, e.g., for event listeners
    }
}

/**
 * Base class for popper Controls.
 */
webexpress.webui.PopperCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Initializes Popper.js for managing the menu box positioning.
     * @param {HTMLElement} container - The container element (searchBox) to position the suggestion box relative to.
     * @param {jQuery} dropdownmenu - The menu box element.
     */
    _initializePopper(container, dropdownmenu) {
        // Map to track the visibility state of each menu
        this._menuVisibilityMap = this._menuVisibilityMap || new Map();

        const popperInstance = Popper.createPopper(container, dropdownmenu[0], {
            placement: "bottom-start",
            modifiers: [
                {
                    name: "offset",
                    options: {
                        offset: [0, 4], // Offset the suggestion box slightly
                    },
                },
                {
                    name: "preventOverflow",
                    options: {
                        boundary: "viewport", // Ensure the suggestion box stays within the viewport
                    },
                },
            ],
        });

        // Hide the suggestion box when clicking outside of it
        $(document).on("click", (event) => {
            if (!$(event.target).closest(this._element).length) {
                if (this._menuVisibilityMap.get(dropdownmenu)) {
                    this._menuVisibilityMap.delete(dropdownmenu);
                    // Trigger the DROPDOWN_HIDDEN_EVENT when the suggestion box is hidden
                    $(document).trigger(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                        id: $(this._element).attr("id")
                    });
                }
            }
        });

        // Register the ESC key to close the suggestion menu
        $(document).on("keydown", (event) => {
            if (event.key === "Escape") {
                dropdownmenu.trigger("hide").hide();
                if (this._menuVisibilityMap.get(dropdownmenu)) {
                    this._menuVisibilityMap.delete(dropdownmenu);
                    // Trigger the DROPDOWN_HIDDEN_EVENT when the suggestion box is hidden
                    $(document).trigger(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                        id: $(this._element).attr("id")
                    });
                }
            }
        });

        // Update Popper instance when the suggestion box is shown
        dropdownmenu.on("show", () => {
            // Update Popper instance and adjust width
            popperInstance.update();
            dropdownmenu.width($(this._element).width());

            // Set the visibility of the current menu to true
            this._menuVisibilityMap.set(dropdownmenu, true);

            // Trigger the DROPDOWN_SHOW_EVENT to signal that the suggestion box is shown
            $(document).trigger(webexpress.webui.Event.DROPDOWN_SHOW_EVENT, {
                id: $(this._element).attr("id")
            });
        });

        // Optional: Trigger DROPDOWN_HIDDEN_EVENT on manual hide
        dropdownmenu.on("hide", () => {
            if (this._menuVisibilityMap.get(dropdownmenu)) {
                $(document).trigger(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                    id: $(this._element).attr("id")
                });
            }
            this._menuVisibilityMap.delete(dropdownmenu);
        });
    }
}

/**
 * A utility class for defining and managing event names within the WebExpress UI framework.
 */
webexpress.webui.Event = class {
    // Event triggered when the visibility of an element changes
    static CHANGE_VISIBILITY_EVENT = "webexpress.webui.change.visibility";
    // Event triggered when an element is clicked
    static CLICK_EVENT = "webexpress.webui.click";
    // Event triggered when a filter changes, typically in search or filter controls
    static CHANGE_FILTER_EVENT = "webexpress.webui.change.filter";
    // Event triggered when a dropdown menu is shown
    static DROPDOWN_SHOW_EVENT = "webexpress.webui.dropdown.show";
    // Event triggered when a dropdown menu is hidden
    static DROPDOWN_HIDDEN_EVENT = "webexpress.webui.dropdown.hidden";
    // Event triggered when a favorite changes
    static CHANGE_FAVORITE_EVENT = "webexpress.webui.change.favorite";
    // Event triggered when columns are reordered in a table control
    static COLUMN_REORDER_EVENT = "webexpress.webui.table.column.reorder";
    // Event triggered when a table is sorted
    static TABLE_SORT_EVENT = "webexpress.webui.table.sorted";
    // Event triggered when the value of an input or control changes
    static CHANGE_VALUE_EVENT = "webexpress.webui.change.value";
    // Event triggered when a node is moved in a tree control
    static MOVE_EVENT = "webexpress.webui.tree.node.move";
    // Event triggered when the page changes in a pagination control
    static CHANGE_PAGE_EVENT = "webexpress.webui.change.page";
    // Event triggered when a modal is shown
    static MODAL_SHOW_EVENT = "webexpress.webui.modal.show";
    // Event triggered when a modal is hidden
    static MODAL_HIDE_EVENT = "webexpress.webui.modal.hide";
}