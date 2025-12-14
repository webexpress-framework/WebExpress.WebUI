var webexpress = webexpress || {}
webexpress.webui = webexpress.webui || {}

/**
 * Namespace webexpress.webui
 * The Controller class monitors changes in the DOM and creates instances
 * of registered classes for new DOM elements. These instances are managed 
 * in a map and are removed from the map when the corresponding DOM 
 * elements are removed.
 */
webexpress.webui.Controller = new class {
    /**
     * Constructor
     */
    constructor() {
        this.instanceMap = new Map();
        this.classRegistry = new Map();
        this._wxRegisteredElements = new WeakSet(); // prevent duplicate bindings
        this.observer = new MutationObserver(this.handleMutations.bind(this));
        this.observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-wx-toggle"] });
        this.overrideCreateElement();
        this.initModalHandler();
    }

    /**
     * Initializes modal handling using custom attributes.
     */
    initModalHandler() {
        // wait for DOMContentLoaded event to ensure DOM is ready
        document.addEventListener("DOMContentLoaded", () => {
            document.querySelectorAll("[data-wx-toggle]").forEach(el => {
                this._registerWxEvents(el);
            });
        });
    }

    /**
     * Registers wx-* click handlers for a single element.
     * This method is invoked during the initial DOM setup as well as for
     * dynamically added elements detected by the MutationObserver.
     *
     * @param {HTMLElement} element - The element for which wx-* event handlers should be registered.
     */
    _registerWxEvents(element) {
        if (this._wxRegisteredElements.has(element)) {
            return; // already bound
        }

        let bound = false;

        // modal
        if (element.matches("[data-wx-toggle='modal']")) {
            element.addEventListener("click", () => {
                const target = element.getAttribute("data-wx-target");
                const uri = element.getAttribute("data-wx-uri");
                const instance = this.getInstance(target);

                if (instance && typeof instance.show === "function") {
                    if (uri) {
                        instance.uri = uri;
                    }
                    instance.show();
                }
            });
            bound = true;
        }

        // split
        if (element.matches("[data-wx-toggle='split']")) {
            element.addEventListener("click", () => {
                const target = element.getAttribute("data-wx-target");
                const instance = this.getInstance(target);
                if (instance && typeof instance.toggleSidePane === "function") {
                    instance.toggleSidePane();
                }
            });

            document.addEventListener(webexpress.webui.Event.HIDE_EVENT, (e) => {
                if (e.detail.sender === element) {
                    const target = element.getAttribute("data-wx-target");
                    const instance = this.getInstance(target);
                    if (instance) {
                        instance.collapsed = true;
                    }
                }
            });

            document.addEventListener(webexpress.webui.Event.SHOW_EVENT, (e) => {
                if (e.detail.sender === element) {
                    const target = element.getAttribute("data-wx-target");
                    const instance = this.getInstance(target);
                    if (instance) {
                        instance.collapsed = false;
                    }
                }
            });
            bound = true;
        }

        if (bound) {
            this._wxRegisteredElements.add(element);
        }
    }

    /**
     * Handler for DOM mutations.
     * @param {MutationRecord[]} mutationsList - List of MutationRecords representing the changes in the DOM.
     */
    handleMutations(mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
                this._registerWxEvents(mutation.target);
                continue;
            }
            // handle added nodes
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    this.createInstances(node);
                }
            }
        }
    }

    /**
     * Creates instances for new DOM elements.
     * @param {Element} element - The DOM element for which instances should be created.
     */
    createInstances(element) {
        // initialize children first (depth-first)
        Array.from(element.children).forEach(child => {
            this.createInstances(child);
        });

        // register wx events for dynamically added elements
        this._registerWxEvents(element);

        // then initialize the element itself if it matches a registered selector
        for (const [selector, ClassConstructor] of this.classRegistry.entries()) {
            if (element.classList.contains(selector)) {
                element.classList.remove(selector);
                try {
                    const instance = new ClassConstructor(element);
                    this.instanceMap.set(element, instance);
                } catch (error) {
                    console.error(`Failed to create instance for selector "${selector}"`, error);
                }
            }
        }
    }
    
    /**
     * Creates an instance from a registered classType string and a DOM element.
     * @param {string} classType - The registered class name (selector).
     * @param {HTMLElement} element - The DOM element to bind the instance to.
     * @returns {Object|null} - The created instance or null if not found.
     */
    createInstanceByClassType(classType, element) {
        const ClassConstructor = this.classRegistry.get(classType);
        if (ClassConstructor) {
            try {
                const instance = new ClassConstructor(element);
                this.instanceMap.set(element, instance);
                return instance;
            } catch (error) {
                console.error(`Failed to instantiate class "${classType}"`, error);
            }
        } else {
            console.warn(`Class "${classType}" is not registered.`);
        }
        return null;
    }

    /**
     * Removes instances for removed DOM elements.
     * @param {Element} element - The DOM element whose instances should be removed.
     */
    removeInstances(element) {
        if (this.instanceMap.has(element)) {
            this.instanceMap.delete(element);
        }
        // remove instances for all descendants
        element.querySelectorAll('*').forEach(child => {
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
            // create instances for the newly created element
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
        const element = document.querySelector(selector);
        if (element && this.instanceMap.has(element)) {
            const instance = this.instanceMap.get(element);
            if (ClassConstructor) {
                return instance instanceof ClassConstructor ? instance : null;
            }
            return instance;
        }
        return null;
    }

    /**
     * Retrieves an instance based on a DOM element.
     * @param {HTMLElement} element - The DOM element.
     * @param {Function} [ClassConstructor] - (Optional) The constructor of the expected class instance.
     * @returns {Object|null} - The instance associated with the element, or null if not found or type mismatch.
     */
    getInstanceByElement(element, ClassConstructor) {
        if (element._wx_controller) {
            return element._wx_controller;
        }
        
        if (this.instanceMap.has(element)) {
            const instance = this.instanceMap.get(element);
            if (ClassConstructor) {
                return instance instanceof ClassConstructor ? instance : null;
            }
            return instance;
        }
        return null;
    }
}

/**
 * Internationalization (i18n) helper class supporting key=value files.
 */
webexpress.webui.I18N = new class {
    /**
     * Creates an instance of the I18N class.
     * The language is automatically determined from the browser, but can be overridden.
     * @param {string} [language] - Optional language code (e.g., "en" or "de").
     */
    constructor(language) {
        // Determine language from browser if not provided
        this.language = language || this._detectBrowserLanguage();
        this.translations = {};
    }

    /**
     * Detects the user's preferred language from the browser.
     * Only the primary language code is used (e.g., "en" from "en-US").
     * @returns {string} The detected language code, defaults to "en" if not available.
     */
    _detectBrowserLanguage() {
        if (navigator.language) {
            return navigator.language.split('-')[0].toLowerCase();
        }
        if (navigator.languages && navigator.languages.length > 0) {
            return navigator.languages[0].split('-')[0].toLowerCase();
        }
        return "en";
    }

    /**
     * Registers translation values for a specific language and module.
     * Ensures existing translations are preserved and extended.
     *
     * @param {string} lang - Language code (e.g. "en")
     * @param {string} module - Namespace/module name (e.g. "webexpress.webui")
     * @param {object} values - Key-value map of translations
     */
    register(lang, module, values) {
        this.translations[lang] = this.translations[lang] || {};
        this.translations[lang][module] = Object.assign(
            {},
            this.translations[lang][module] || {},
            values
        );
    }

    /**
     * Sets the current language for translations.
     * @param {string} language - The language code (e.g., "en" or "de").
     */
    setLanguage(language) {
        this.language = language;
    }

    /**
     * Retrieves the translation for the specified key.
     * Supports optional module prefix (e.g. 'webexpress.webui:calendar.may').
     * Falls back to English if the key is not found in the current language.
     * Returns the key itself if no translation is available.
     *
     * @param {string} key - The translation key to look up.
     * @returns {string}
     */
    translate(key) {
        const lang = this.language;
        const fallback = "en";
        let module = null;
        let localKey = key;

        // Extract namespace prefix if present
        if (key.includes(":")) {
            const split = key.split(":");
            module = split[0];
            localKey = split[1];
        }

        // Attempt module-prefixed lookup
        if (module && this.translations[lang]?.[module]?.[localKey]) {
            return this.translations[lang][module][localKey];
        }

        if (this.translations[lang]?.[key]) {
            return this.translations[lang][key];
        }

        if (module && this.translations[fallback]?.[module]?.[localKey]) {
            return this.translations[fallback][module][localKey];
        }

        if (this.translations[fallback]?.[key]) {
            return this.translations[fallback][key];
        }

        return key;
    }
}

/**
 * This class handles the registration and retrieval of syntax configurations for different programming languages.
 * Each language can have its own set of keywords, types, operators, and regex rules for syntax highlighting.
 */
webexpress.webui.Syntax = new class {
    constructor() {
        // initialize the syntax object to store language-specific configurations
        this.syntax = {};
    }

    /**
     * Registers syntax values for a specific language and alias.
     *
     * @param {string} language - Language code (e.g., "csharp").
     * @param {string} alias - Alias for the language (e.g., "c#").
     * @param {object|function} syntax - Syntax highlighting configuration or function.
     */
    register(language, alias, syntax) {
        if (!language || !syntax) {
            return; // ensure both language and regex are provided
        }

        // store language-specific syntax configurations in syntax object
        this.syntax[language] = syntax || {};
        
        // optional: Store under alias if provided
        if (alias) {
            this.syntax[alias] = syntax || {};
        }
    }

    /**
     * Retrieves the syntax configuration for a specific language.
     *
     * @param {string} language - The language code (e.g., "csharp").
     * @returns {object|null} The syntax configuration for the language, or null if not registered.
     */
    get(language) {
        if (!language) {
            // ensure language parameter is provided
            return null;
        }

        // return the syntax configuration for the given language or null if not found
        return this.syntax[language] || null;
    }
};

/**
 * Stores panel definitions by key, optionally scoped via a modalId property on the panel object.
 * A "panel definition" is a plain object that may contain metadata and render/onShow/onSubmit hooks.
 */
webexpress.webui.DialogPanels = new class {
    constructor() {
        /** @type {{[key: string]: Array<object>}} internal registry */
        this._panels = {};
    }

    /**
     * Registers one or multiple panels by modal key. Multiple panels per key are supported.
     * Optional modal scoping can be expressed by setting `modalId` on the panel object itself.
     *
     * @param {string} modalKey - unique panel key used for lookup/autoload (e.g., data-key).
     * @param {object} panel - panel definition.
     * @returns {this} the registry instance for chaining.
     */
    register(modalKey, panel) {
        // validate inputs
        if (typeof modalKey !== "string" || modalKey.trim() === "") {
            return this;
        }
        if (!panel || typeof panel !== "object") {
            return this;
        }

        // ensure storage for key
        if (!Array.isArray(this._panels[modalKey])) {
            this._panels[modalKey] = [];
        }

        // store shallow copy to avoid external mutation
        const copy = Object.assign({}, panel);
        this._panels[modalKey].push(copy);

        return this;
    }

    /**
     * Retrieves all panels registered under a key.
     *
     * @param {string} modalKey - panel key.
     * @returns {Array<object>} array of panel definitions (shallow-copied entries).
     */
    get(modalKey) {
        // validate key
        if (typeof modalKey !== "string" || modalKey.trim() === "") {
            return [];
        }

        // return shallow copies to keep registry immutable from outside
        if (Array.isArray(this._panels[modalKey])) {
            return this._panels[modalKey].map((p) => {
                return Object.assign({}, p);
            });
        } else {
            return [];
        }
    }

    /**
     * Unregisters all panels by key.
     *
     * @param {string} modalKey - panel key.
     * @returns {void}
     */
    unregister(modalKey) {
        // validate key
        if (typeof modalKey !== "string" || modalKey.trim() === "") {
            return;
        }

        // remove key bucket when present
        if (Object.prototype.hasOwnProperty.call(this._panels, modalKey)) {
            delete this._panels[modalKey];
        }
    }

    /**
     * Clears the entire registry. useful for tests and full resets.
     * @returns {void}
     */
    clear() {
        this._panels = {};
    }
};

/**
 * Central registry for table cell templates (renderers).
 * Stores renderer functions and their default options by type key.
 */
webexpress.webui.TableTemplates = new class {
    constructor() {
        /** @type {{[key: string]: {fn: Function, options: Object}}} internal registry */
        this._templates = {};
    }

    /**
     * Registers a renderer function for a specific type.
     * Overwrites existing renderers if the same type is registered again.
     * @param {string} type - unique template key (e.g., "date", "move", "currency").
     * @param {Function} rendererFn - function(val, cell, row, opts) => Node|String.
     * @param {object} [defaultOptions={}] - optional default options merged with column options.
     * @returns {this} the registry instance for chaining.
     */
    register(type, rendererFn, defaultOptions = {}) {
        // validate inputs
        if (typeof type !== "string" || type.trim() === "") {
            return this;
        }
        if (typeof rendererFn !== "function") {
            console.error(`TableTemplates: renderer for type '${type}' must be a function.`);
            return this;
        }

        // store definition
        this._templates[type] = {
            fn: rendererFn,
            options: typeof defaultOptions === "object" ? defaultOptions : {}
        };

        return this;
    }

    /**
     * Retrieves the renderer definition for a given type.
     * @param {string} type - template key.
     * @returns {{fn: Function, options: Object}|null} the renderer definition or null if not found.
     */
    get(type) {
        // validate key
        if (typeof type !== "string" || type.trim() === "") {
            return null;
        }

        // return the entry if exists
        if (Object.prototype.hasOwnProperty.call(this._templates, type)) {
            return this._templates[type];
        }

        return null;
    }

    /**
     * Checks if a renderer exists for the given type.
     * @param {string} type - template key.
     * @returns {boolean} true if registered.
     */
    has(type) {
        return Object.prototype.hasOwnProperty.call(this._templates, type);
    }

    /**
     * Unregisters a renderer by type.
     * @param {string} type - template key.
     * @returns {void}
     */
    unregister(type) {
        // validate key
        if (typeof type !== "string" || type.trim() === "") {
            return;
        }

        // remove key bucket when present
        if (Object.prototype.hasOwnProperty.call(this._templates, type)) {
            delete this._templates[type];
        }
    }

    /**
     * Clears the entire registry. useful for tests and full resets.
     * @returns {void}
     */
    clear() {
        this._templates = {};
    }
};

/**
 * Base class for Controls.
 * This abstract class provides fundamental functionalities such as initialization, rendering, updating, and destruction.
 */
webexpress.webui.Ctrl = class {
    /**
     * Creates a new instance of the Control class.
     * @param {HTMLElement} element - The DOM element associated with this control.
     */
    constructor(element) {
        if (new.target === webexpress.webui.Ctrl) {
            throw new Error("Control is an abstract class and cannot be instantiated directly.");
        }
        if (!(element instanceof HTMLElement)) {
            throw new Error("Parameter 'element' must be an instance of HTMLElement.");
        }
        this._element = element;
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

    /**
     * Detaches an element from the DOM while preserving its event listeners.
     * Suppresses MutationObserver callbacks during the removal.
     * @param {HTMLElement} element - The element to be detached.
     * @returns {HTMLElement} - The detached element.
     */
    _detachElement(element) {
        if (!element || !element.parentNode) return null;

        element.parentNode.removeChild(element);
        
        return element;
    }

    /**
    * Dispatches a custom event.
    * @param {string} type event type
    * @param {object} detail payload
    */
    _dispatch(type, detail) {
        document.dispatchEvent(new CustomEvent(type, {
            detail: {
                sender: this._element,
                id: this._element?.id,
                ...detail
            },
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Returns the translated text for the specified i18n key.
     * If no translation is configured or the I18N module is unavailable,
     * the fallback text is returned.
     *
     * @param {string} key - The i18n key of the value to translate.
     * @param {string} fallback - Text to use if no translation is found.
     * @returns {string} Translated text or the fallback.
     */
    _i18n(key, fallback) {
        return (webexpress?.webui?.I18N?.translate(key)) ?? fallback;
    }
}

/**
 * Base class for popper Controls.
 */
webexpress.webui.PopperCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Initializes Popper.js for managing the menu box positioning.
     * @param {HTMLElement} container - The container element (searchBox) to position the suggestion box relative to.
     * @param {HTMLElement} dropdownmenu - The menu box element (as HTMLElement, not jQuery).
     */
    _initializePopper(container, dropdownmenu) {
        // Map to track the visibility state of each menu
        this._menuVisibilityMap = this._menuVisibilityMap || new Map();

        // Popper.js instance for positioning
        const popperInstance = Popper.createPopper(container, dropdownmenu, {
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
        document.addEventListener("click", (event) => {
            if (!this._element.contains(event.target)) {
                if (this._menuVisibilityMap.get(dropdownmenu)) {
                    this._menuVisibilityMap.delete(dropdownmenu);
                    // Trigger the DROPDOWN_HIDDEN_EVENT when the suggestion box is hidden
                    document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                        detail: {
                            sender: this._element,
                            id: this._element.id
                        }
                    }));
                }
                // hide menu
                dropdownmenu.style.display = "none";
            }
        });

        // Register the ESC key to close the suggestion menu
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                dropdownmenu.style.display = "none";
                if (this._menuVisibilityMap.get(dropdownmenu)) {
                    this._menuVisibilityMap.delete(dropdownmenu);
                    // Trigger the DROPDOWN_HIDDEN_EVENT when the suggestion box is hidden
                    document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                        detail: {
                            sender: this._element,
                            id: this._element.id
                        }
                    }));
                }
            }
        });

        // Show and hide methods for the dropdownmenu (simulate .on('show')/.on('hide'))
        dropdownmenu.show = () => {
            dropdownmenu.style.display = "flex";
            // Set width to match the element, if needed
            dropdownmenu.style.width = this._element.offsetWidth + "px";
            popperInstance.update();
            this._menuVisibilityMap.set(dropdownmenu, true);
            // Trigger show event
            document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DROPDOWN_SHOW_EVENT, {
                detail: {
                    sender: this._element,
                    id: this._element.id
                }
            }));
        };
        dropdownmenu.hide = () => {
            dropdownmenu.style.display = "none";
            if (this._menuVisibilityMap.get(dropdownmenu)) {
                this._menuVisibilityMap.delete(dropdownmenu);
                document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                    detail: {
                        sender: this._element,
                        id: this._element.id
                    }
                }));
            }
        };

        // Listen for custom 'show' and 'hide' events
        dropdownmenu.addEventListener("show", () => {
            dropdownmenu.show();
        });
        dropdownmenu.addEventListener("hide", () => {
            dropdownmenu.hide();
        });
    }
}

/**
 * A utility class for defining and managing event names within the WebExpress UI framework.
 */
webexpress.webui.Event = class {
    // Event triggered when the visibility of an element changes.
    static CHANGE_VISIBILITY_EVENT = "webexpress.webui.change.visibility";
    // Event triggered when an element is clicked.
    static CLICK_EVENT = "webexpress.webui.click";
    // Event triggered when a filter changes, typically in search or filter controls.
    static CHANGE_FILTER_EVENT = "webexpress.webui.change.filter";
    // Event triggered when a dropdown menu is shown.
    static DROPDOWN_SHOW_EVENT = "webexpress.webui.dropdown.show";
    // Event triggered when a dropdown menu is hidden.
    static DROPDOWN_HIDDEN_EVENT = "webexpress.webui.dropdown.hidden";
    // Event triggered when a favorite changes.
    static CHANGE_FAVORITE_EVENT = "webexpress.webui.change.favorite";
    // Event triggered when columns are reordered in a table control.
    static COLUMN_REORDER_EVENT = "webexpress.webui.table.column.reorder";
    // Event triggered when a search/filter is applied to a column.
    static COLUMN_SEARCH_EVENT = "webexpress.webui.table.column.search"
    // Event triggered when rows are reordered in a table control.
    static ROW_REORDER_EVENT = "webexpress.webui.table.row.reorder";
    // Event triggered when a table is sorted.
    static TABLE_SORT_EVENT = "webexpress.webui.table.sorted";
    // Event triggered when the value of an input or control changes.
    static CHANGE_VALUE_EVENT = "webexpress.webui.change.value";
    // Event triggered when a item is moved.
    static MOVE_EVENT = "webexpress.webui.move";
    // Event triggered when the page changes in a pagination control.
    static CHANGE_PAGE_EVENT = "webexpress.webui.change.page";
    // Event triggered when a modal is shown.
    static MODAL_SHOW_EVENT = "webexpress.webui.modal.show";
    // Event triggered when a modal is hidden.
    static MODAL_HIDE_EVENT = "webexpress.webui.modal.hide";
    // Event triggered when data is requested.
    static DATA_REQUESTED_EVENT = "webexpress.webui.data.requested";
    // Event triggered when data has arrived.
    static DATA_ARRIVED_EVENT = "webexpress.webui.data.arrived";
    // Event triggered when a task starts.
    static TASK_START_EVENT = "webexpress.webui.task.start";
    // Event triggered when a task is updated.
    static TASK_UPDATE_EVENT = "webexpress.webui.task.update";
    // Event triggered when a task is finished.
    static TASK_FINISH_EVENT = "webexpress.webui.task.finish";
    // Event triggered when the size changes.
    static SIZE_CHANGE_EVENT = "webexpress.webui.size.change";
    // Event triggered when an element is hidden.
    static HIDE_EVENT = "webexpress.webui.hide";
    // Event triggered when an element is shown.
    static SHOW_EVENT = "webexpress.webui.show";
    // Event triggered when an element is updated.
    static UPDATED_EVENT = "webexpress.webui.updated";
    // Event triggered when an item is added.
    static ADD_EVENT = "webexpress.webui.add";
    // Event triggered when an item is removed.
    static REMOVE_EVENT = "webexpress.webui.remove";
    // Event triggered when inline editing starts.
    static START_INLINE_EDIT_EVENT = "webexpress.webui.inlineedit.start";
    // Event triggered when inline editing is saved.
    static SAVE_INLINE_EDIT_EVENT = "webexpress.webui.inlineedit.save";
    // Event triggered when inline editing ends (regardless if saved or canceled).
    static END_INLINE_EDIT_EVENT = "webexpress.webui.inlineedit.end";
    // Event triggered when a file is selected.
    static FILE_SELECTED_EVENT = "webexpress.webui.file.selected";
    // Event triggered when a file upload completes successfully.
    static UPLOAD_SUCCESS_EVENT = "webexpress.webui.upload.success";
    // Event triggered when a file upload fails.
    static UPLOAD_ERROR_EVENT = "webexpress.webui.upload.error";
    // Event triggered to indicate upload progress.
    static UPLOAD_PROGRESS_EVENT = "webexpress.webui.upload.progress";
    // Event triggered when a tile search operation is performed.
    static TILE_SEARCH_EVENT = "webexpress.webui.tile.search";
    // Event triggered when tiles are sorted by a specific criterion.
    static TILE_SORT_EVENT = "webexpress.webui.tile.sort";
    // Event triggered when a responsive layout breakpoint changes.
    static BREAKPOINT_CHANGE_EVENT = "webexpress.webui.breakpoint.change";

}