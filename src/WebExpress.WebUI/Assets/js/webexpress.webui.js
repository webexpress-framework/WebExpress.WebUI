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
            if ($(element).is("." + selector)) {
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
    * Retrieves an instance based on element ID and class.
    * @param {string} id - The ID of the DOM element.
    * @param {Function} ClassConstructor - The constructor of the class to be retrieved.
    * @returns {Object|null} - The instance of the specified class associated with the element, or null if not found.
    */
    getInstance(id, ClassConstructor) {
        const element = document.getElementById(id);
        if (element && this.instanceMap.has(element)) {
            const instance = this.instanceMap.get(element);
            if (instance instanceof ClassConstructor) {
                return instance;
            }
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
        this.initialize();
    }

    /**
     * Initializes the control.
     * Derived classes can override this method to perform additional initialization tasks.
     */
    initialize() {
        console.log("Control initialized.");
        // Additional initialization code here
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
        console.log("Control is updating.");
        this.render();
    }

    /**
     * Destroys the control.
     * This method should be overridden to remove event listeners or perform other cleanup tasks.
     */
    destroy() {
        console.log("Control is being destroyed.");
        // Cleanup code, e.g., for event listeners
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
}