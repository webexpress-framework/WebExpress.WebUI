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
     * Creates a new instance of the class.
     */
    constructor() {
        this.instanceMap = new Map();
        this.classRegistry = new Map();
        this._wxRegisteredElements = new WeakSet(); // prevent duplicate bindings
        this.observer = new MutationObserver(this.handleMutations.bind(this));
        
        // observe attribute changes
        this.observer.observe(document, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [
                "data-wx-primary-action",
                "data-wx-secondary-action",
                "data-wx-dismiss",
                "data-wx-bind"
            ]
        });
        
        this.overrideCreateElement();
        this.initModalHandler();

        // re-added native fullscreen listeners
        document.addEventListener("fullscreenchange", () => { 
            this._onFullscreenChange(); 
        });
        document.addEventListener("webkitfullscreenchange", () => { 
            this._onFullscreenChange(); 
        });
        document.addEventListener("mozfullscreenchange", () => { 
            this._onFullscreenChange(); 
        });
        document.addEventListener("MSFullscreenChange", () => { 
            this._onFullscreenChange(); 
        });
    }

    /**
     * Initializes modal handling using custom attributes.
     */
    initModalHandler() {
        // wait for domcontentloaded event to ensure dom is ready
        document.addEventListener("DOMContentLoaded", () => {
            const filterPrimaryElements = document.querySelectorAll("[data-wx-primary-action='filter']");
            const filterPrimaryDefs = Array.from(filterPrimaryElements).map(el => ({
                id: el.id,
                name: el.textContent.trim(),
                group: el.dataset.wxPrimaryGroup || null,
                exclusive: el.dataset.wxPrimaryExclusive === "true"
            }));
            if (filterPrimaryDefs.length > 0) {
                webexpress.webui.FilterRegistry.registerFilters(filterPrimaryDefs);
            }
            const filterSecondaryElements = document.querySelectorAll("[data-wx-secondary-action='filter']");
            const filterSecondaryDefs = Array.from(filterSecondaryElements).map(el => ({
                id: el.id,
                name: el.textContent.trim(),
                group: el.dataset.wxSecondaryGroup || null,
                exclusive: el.dataset.wxSecondaryExclusive === "true"
            }));
            if (filterSecondaryDefs.length > 0) {
                webexpress.webui.FilterRegistry.registerFilters(filterSecondaryDefs);
            }
            webexpress.webui.FilterRegistry.init();
            // register both toggle and dismiss elements initially
            document.querySelectorAll("[data-wx-primary-action], [data-wx-secondary-action], [data-wx-dismiss], [data-wx-bind]").forEach((el) => {
                this._registerWxEvents(el);
            });
        });
    }

    /**
     * Registers wx-* click handlers for a single element.
     * This method is invoked during the initial DOM setup as well as for
     * dynamically added elements detected by the MutationObserver.
     * @param {HTMLElement} element - The element for which wx-* event handlers should be registered.
     */
    _registerWxEvents(element) {
        if (this._wxRegisteredElements.has(element)) {
            return; // already bound
        }

        let bound = false;

        // primary actions
        // modal
        if (element.matches("[data-wx-primary-action='modal']")) {
            element.addEventListener("click", () => {
                const target = element.getAttribute("data-wx-primary-target") || null;
                const uri = element.getAttribute("data-wx-primary-uri") || null;
                const size = element.getAttribute("data-wx-primary-size") || null;
                const instance = this.getInstance(target);

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
            });
            bound = true;
        }

        // frame
        if (element.matches("[data-wx-primary-action='frame']")) {
            element.addEventListener("click", () => {
                const target = element.getAttribute("data-wx-primary-target") || null;
                const uri = element.getAttribute("data-wx-primary-uri") || null;
                const instance = this.getInstance(target);

                if (!instance) {
                    // no instance found
                } else if (uri) {
                    instance.uri = uri;
                }
            });
            bound = true;
        }

        // split
        if (element.matches("[data-wx-primary-action='split']")) {
            element.addEventListener("click", () => {
                const target = element.getAttribute("data-wx-primary-target");
                const instance = this.getInstance(target);
                if (instance && typeof instance.toggleSidePane === "function") {
                    instance.toggleSidePane();
                }
            });

            document.addEventListener(webexpress.webui.Event.HIDE_EVENT, (e) => {
                if (e.detail.sender === element) {
                    const target = element.getAttribute("data-wx-primary-target");
                    const instance = this.getInstance(target);
                    if (instance) {
                        instance.collapsed = true;
                    }
                }
            });

            document.addEventListener(webexpress.webui.Event.SHOW_EVENT, (e) => {
                if (e.detail.sender === element) {
                    const target = element.getAttribute("data-wx-primary-target");
                    const instance = this.getInstance(target);
                    if (instance) {
                        instance.collapsed = false;
                    }
                }
            });
            bound = true;
        }
        
        // css fullscreen toggle support
        if (element.matches("[data-wx-primary-action='fullscreen']")) {
            element.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation(); // stop bubbling to prevent parent handlers from closing

                const targetSelector = element.getAttribute("data-wx-primary-target");
                // default to body if no target is specified
                const targetEl = targetSelector ? document.querySelector(targetSelector) : document.body;
                
                if (targetEl) {
                    this.toggleFullscreen(targetEl);
                } else {
                    console.warn("Fullscreen target not found:", targetSelector);
                }
            });
            element.setAttribute("aria-pressed", "false");
            bound = true;
        }

        // native browser fullscreen toggle support
        if (element.matches("[data-wx-primary-action='native-fullscreen']")) {
            element.addEventListener("click", (e) => {
                e.preventDefault();
                const targetSelector = element.getAttribute("data-wx-primary-target") || null;
                const targetEl = targetSelector ? document.querySelector(targetSelector) : document.documentElement;
                
                if (targetEl) {
                    this.toggleNativeFullscreen(targetEl);
                }
            });
            element.setAttribute("aria-pressed", "false");
            bound = true;
        }
        
        // quickfilter actions
        if (element.matches("[data-wx-primary-action='filter']")) {
            element.addEventListener("click", (e) => {
                e.preventDefault();
                webexpress.webui.FilterRegistry.toggle(element.id);
            });
            bound = true;
        }

        // secondary actions
        // modal
        if (element.matches("[data-wx-secondary-action='modal']")) {
            element.addEventListener("dblclick", () => {
                const target = element.getAttribute("data-wx-secondary-target") || null;
                const uri = element.getAttribute("data-wx-secondary-uri") || null;
                const size = element.getAttribute("data-wx-secondary-size") || null;
                const instance = this.getInstance(target);

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
            });
            bound = true;
        }

        // frame
        if (element.matches("[data-wx-secondary-action='frame']")) {
            element.addEventListener("dblclick", () => {
                const target = element.getAttribute("data-wx-secondary-target") || null;
                const uri = element.getAttribute("data-wx-secondary-uri") || null;
                const instance = this.getInstance(target);

                if (!instance) {
                    // no instance found
                } else if (typeof instance.show === "function") {
                    if (uri) {
                        instance.uri = uri;
                    }
                }
            });
            bound = true;
        }

        // split
        if (element.matches("[data-wx-secondary-action='split']")) {
            element.addEventListener("dblclick", () => {
                const target = element.getAttribute("data-wx-secondary-target");
                const instance = this.getInstance(target);
                if (instance && typeof instance.toggleSidePane === "function") {
                    instance.toggleSidePane();
                }
            });

            document.addEventListener(webexpress.webui.Event.HIDE_EVENT, (e) => {
                if (e.detail.sender === element) {
                    const target = element.getAttribute("data-wx-secondary-target");
                    const instance = this.getInstance(target);
                    if (instance) {
                        instance.collapsed = true;
                    }
                }
            });

            document.addEventListener(webexpress.webui.Event.SHOW_EVENT, (e) => {
                if (e.detail.sender === element) {
                    const target = element.getAttribute("data-wx-secondary-target");
                    const instance = this.getInstance(target);
                    if (instance) {
                        instance.collapsed = false;
                    }
                }
            });
            bound = true;
        }

        // css fullscreen toggle support
        if (element.matches("[data-wx-secondary-action='fullscreen']")) {
            element.addEventListener("dblclick", (e) => {
                e.preventDefault();
                e.stopPropagation();

                const targetSelector = element.getAttribute("data-wx-secondary-target");
                const targetEl = targetSelector ? document.querySelector(targetSelector) : document.body;

                if (targetEl) {
                    this.toggleFullscreen(targetEl);
                } else {
                    console.warn("Fullscreen target not found:", targetSelector);
                }
            });
            element.setAttribute("aria-pressed", "false");
            bound = true;
        }

        // native browser fullscreen toggle support
        if (element.matches("[data-wx-secondary-action='native-fullscreen']")) {
            element.addEventListener("dblclick", (e) => {
                e.preventDefault();
                const targetSelector = element.getAttribute("data-wx-secondary-target") || null;
                const targetEl = targetSelector ? document.querySelector(targetSelector) : document.documentElement;

                if (targetEl) {
                    this.toggleNativeFullscreen(targetEl);
                }
            });
            element.setAttribute("aria-pressed", "false");
            bound = true;
        }

        // quickfilter actions
        if (element.matches("[data-wx-secondary-action='filter']")) {
            element.addEventListener("dblclick", (e) => {
                e.preventDefault();
                webexpress.webui.FilterRegistry.toggle(element.id);
            });
            bound = true;
        }

        // dismiss actions
        // css fullscreen dismiss support
        if (element.matches("[data-wx-dismiss='fullscreen']")) {
            element.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                const targetSelector = element.getAttribute("data-wx-target");
                let targetEl = targetSelector ? document.querySelector(targetSelector) : document.querySelector(".wx-fullscreen-active");

                // fallback to closest full screen element
                if (!targetEl) {
                    targetEl = element.closest(".wx-fullscreen-active");
                }

                if (targetEl && this._isCssFullscreenElement(targetEl)) {
                    this.toggleFullscreen(targetEl);
                }
            });
            bound = true;
        }

        // native fullscreen dismiss support
        if (element.matches("[data-wx-dismiss='native-fullscreen']")) {
            element.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._exitNativeFullscreen(); 
            });
            bound = true;
        }

        // bind
        const bindAttr = element.getAttribute("data-wx-bind");
        if (bindAttr) {
            const binds = bindAttr.split(",").map((b) => {
                return b.trim();
            }).filter((b) => {
                return b.length > 0;
            });

            binds.forEach((bindName) => {
                this._registerBind(element, bindName);
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
                // quickfilter
                if (mutation.target.dataset.wxPrimaryAction === "filter") {
                    this._registerQuickfilterElement(mutation.target);
                }
                this._registerWxEvents(mutation.target);
                continue;
            }
            // handle added nodes
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    this.createInstances(node);
                    // quickfilter
                    node.querySelectorAll?.("[data-wx-primary-action='filter']").forEach(el => {
                        this._registerQuickfilterElement(el);
                    });
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
        Array.from(element.children).forEach((child) => {
            try {
                this.createInstances(child);
            } catch (error) {
                console.error("Error creating instances for child element", child, error);
            }
        });

        // register wx events for dynamically added elements
        this._registerWxEvents(element);

        // initialize the element itself if it matches a registered selector
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
        element.querySelectorAll('*').forEach((child) => {
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
            this.createInstances(element);
            return element;
        };
    }

    /**
     * Retrieves an instance based on a CSS selector (ID or class).
     * @param {string} selector - The CSS selector for the DOM element.
     * @param {Function} [ClassConstructor] - (Optional) The constructor of the expected class instance.
     * @returns {Object|null} - The instance associated with the element, or null if not found.
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
     * @returns {Object|null} - The instance associated with the element, or null.
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

    /**
     * Retrieves the closest instance by traversing up the DOM tree from the given element.
     * @param {HTMLElement} element - The starting DOM element.
     * @param {Function} [ClassConstructor] - (Optional) The constructor of the expected class instance.
     * @returns {Object|null} - The closest instance found, or null if none exists.
     */
    getClosestInstance(element, ClassConstructor) {
        let current = element;
        while (current) {
            const instance = this.getInstanceByElement(current, ClassConstructor);
            if (instance) {
                return instance;
            }
            current = current.parentElement;
        }
        return null;
    }
    
    /**
     * Toggles "light" fullscreen state (CSS based) for the provided element.
     * @param {HTMLElement} el - target element to toggle fullscreen for
     */
    toggleFullscreen(el) {
        if (!el) { 
            return; 
        }
        
        const isFullscreen = el.classList.toggle("wx-fullscreen-active");

        if (isFullscreen) {
            document.body.style.overflow = "hidden";
        } else {
            const anyFullscreen = document.querySelector(".wx-fullscreen-active");
            if (!anyFullscreen) {
                document.body.style.overflow = "";
            }
        }

        this._onFullscreenChange(el);
    }

    /**
     * Toggles "native" browser fullscreen for the provided element.
     * @param {HTMLElement} el - target element
     */
    toggleNativeFullscreen(el) {
        if (!el) { 
            return; 
        }
        if (this._isNativeFullscreenElement(el)) {
            this._exitNativeFullscreen();
        } else {
            this._enterNativeFullscreen(el);
        }
    }

    /**
     * Returns whether the provided element is currently in "light" (CSS) fullscreen.
     * @param {HTMLElement} el - element to test
     * @returns {boolean} true when element is fullscreen
     */
    _isCssFullscreenElement(el) {
        return el.classList.contains("wx-fullscreen-active");
    }

    /**
     * Returns whether the provided element is currently the native fullscreen element.
     * @param {HTMLElement} el - element to test
     * @returns {boolean} true when element is native fullscreen
     */
    _isNativeFullscreenElement(el) {
        const fs = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;
        return fs === el;
    }

    /**
     * Requests native fullscreen for an element with vendor fallbacks.
     * @param {HTMLElement} el - target element
     */
    _enterNativeFullscreen(el) {
        if (el.requestFullscreen) {
            el.requestFullscreen().catch(() => { /* ignore user-denied errors */ });
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }
    }

    /**
     * Exits native fullscreen (document-level) with vendor fallbacks.
     */
    _exitNativeFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => { /* ignore */ });
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    /**
     * Handler for global fullscreen change event.
     * @param {HTMLElement} [changedEl] - The element that changed state (for CSS fullscreen)
     */
    _onFullscreenChange(changedEl) {
        const nativeFsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;
        
        document.querySelectorAll("[data-wx-primary-action='fullscreen']").forEach((btn) => {
            const targetSelector = btn.getAttribute("data-wx-primary-target") || null;
            const target = targetSelector ? document.querySelector(targetSelector) : document.documentElement;
            
            const active = target && this._isCssFullscreenElement(target);
            this._updateButtonState(btn, active);
        });

        document.querySelectorAll("[data-wx-primary-action='native-fullscreen']").forEach((btn) => {
            const targetSelector = btn.getAttribute("data-wx-primary-target") || null;
            const target = targetSelector ? document.querySelector(targetSelector) : document.documentElement;
            
            const active = target && (nativeFsEl === target);
            this._updateButtonState(btn, active);
        });

        document.dispatchEvent(new CustomEvent(webexpress.webui.Event.SIZE_CHANGE_EVENT, {
            detail: {
                sender: document,
                fullscreenElement: nativeFsEl || changedEl
            },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Helper to update button visual state (aria, data attr, icons).
     * @param {HTMLElement} btn - The button element
     * @param {boolean} active - Whether the state is active
     */
    _updateButtonState(btn, active) {
        btn.setAttribute("aria-pressed", active ? "true" : "false");
        
        if (active) {
            btn.setAttribute("data-wx-fullscreen-active", "true");
            const icon = btn.querySelector("i");
            if (icon) {
                if (icon.classList.contains("fa-expand")) {
                    icon.classList.replace("fa-expand", "fa-compress");
                    if (btn.title && btn.title.includes("Toggle")) {
                        btn.title = "Exit Fullscreen";
                    }
                }
            }
        } else {
            btn.removeAttribute("data-wx-fullscreen-active");
            const icon = btn.querySelector("i");
            if (icon) {
                if (icon.classList.contains("fa-compress")) {
                    icon.classList.replace("fa-compress", "fa-expand");
                     if (btn.title && btn.title.includes("Exit")) {
                        btn.title = "Toggle Fullscreen";
                    }
                }
            }
        }
    }
    
    /**
     * Registers a single bind type for a given element.
     * @param {HTMLElement} element - The bound DOM element.
     * @param {string} bindName - The bind type identifier.
     */
    _registerBind(element, bindName) {
        const sourceSelector = element.getAttribute(`data-wx-source-${bindName}`) ||
            element.getAttribute("data-wx-source");

        if (sourceSelector) {
            const sourceElement = document.querySelector(sourceSelector);

            if (!sourceElement) {
                console.warn(`Source element not found for bind "${bindName}":`, sourceSelector);
                return;
            }

            if (bindName == "search") {
                sourceElement?.addEventListener(webexpress.webui.Event.CHANGE_FILTER_EVENT, (e) => {
                    const query = e.detail?.value;
                    const searchType = e.detail?.searchType;
                    const instance = this.getInstanceByElement(element);
                    if (typeof instance?.search === "function") {
                        instance.search(query, searchType);
                    }
                });
                return;
            } 
        }

        if (bindName == "filter") {
            document?.addEventListener(webexpress.webui.Event.CHANGE_FILTER_EVENT, (e) => {
                const instance = this.getInstanceByElement(element);
                if (typeof instance?.filter === "function") {
                    instance.filter(webexpress.webui.FilterRegistry.getActiveFilters());
                } else {
                    element.dispatchEvent(new Event("change", { bubbles: true }));
                }
            });
        }
    }
    
    /**
     * Registers a quickfilter definition in the global FilterRegistry based on the given element.
     * Extracts relevant filter properties (id, name, group, exclusive) from the element's data attributes.
     * This function is used in mutation observers to automatically register new quickfilter UI elements.
     * @param {HTMLElement} el - The quickfilter UI element (e.g., button or any filter-triggering element).
     */
    _registerQuickfilterElement(el) {
        // build the filter definition from the element's attributes and text content
        const filterDef = {
            id: el.id,
            name: el.textContent.trim(),
            group: el.dataset.wxPrimaryGroup || null,
            exclusive: el.dataset.wxPrimaryExclusive === "true"
        };
        // register the definition in the global FilterRegistry
        webexpress.webui.FilterRegistry.registerFilters([filterDef]);
    }
};

/**
 * Central registry for managing client-side quick filters.
 * Handles state, enforces group exclusivity, persists to cookies, and notifies observers.
 */
webexpress.webui.FilterRegistry = new class {
    /**
     * Creates a new instance of the class.
     */
    constructor() {
        this._knownFilters = new Map();
        this._activeFilters = new Set();
        this._cookieName = "wx_quickfilters";
        this._saveTimer = null;
        this._debounceTime = 300;
    }

    /**
     * Registers an array of available filters in the system.
     * @param {Array} filters - array of filter definition objects.
     */
    registerFilters(filters) {
        if (Array.isArray(filters)) {
            for (let i = 0; i < filters.length; i++) {
                const f = filters[i];
                if (f && f.id) {
                    this._knownFilters.set(f.id, {
                        id: f.id,
                        name: f.name || f.id,
                        group: f.group || null,
                        exclusive: f.exclusive === true
                    });
                }
            }
        }
    }

    /**
     * Initializes the state from the cookie and broadcasts the initial state.
     */
    init() {
        const savedData = this._readCookie();
        let changed = false;

        if (savedData) {
            const parsedIds = savedData.split(",");
            for (let i = 0; i < parsedIds.length; i++) {
                const id = parsedIds[i].trim();
                // validate against known filters to prevent manipulation
                if (this._knownFilters.has(id)) {
                    this._activeFilters.add(id);
                    document.getElementById(id)?.classList.add("active");
                } else {
                    changed = true;
                }
            }
        }

        // if unknown filters were dropped, update the cookie immediately
        if (changed) {
            this._scheduleCookieSave();
        }

        this._notifyListeners();
    }

    /**
     * Activates a specific filter by its id and enforces group constraints.
     * @param {string} id - the unique identifier of the filter.
     */
    activate(id) {
        if (!this._knownFilters.has(id)) {
            return;
        }

        const filter = this._knownFilters.get(id);

        // enforce exclusive group logic
        if (filter.group && filter.exclusive) {
            const activeArray = Array.from(this._activeFilters);
            for (let i = 0; i < activeArray.length; i++) {
                const activeId = activeArray[i];
                const activeConfig = this._knownFilters.get(activeId);
                
                if (activeConfig && activeConfig.group === filter.group && activeId !== id) {
                    this._activeFilters.delete(activeId);
                    document.getElementById(activeId)?.classList.remove("active");
                }
            }
        }

        if (!this._activeFilters.has(id)) {
            this._activeFilters.add(id);
            this._scheduleCookieSave();
            this._notifyListeners();
            document.getElementById(id)?.classList.add("active");
        }
    }

    /**
     * Deactivates a specific filter by its id.
     * @param {string} id - the unique identifier of the filter.
     */
    deactivate(id) {
        if (this._activeFilters.has(id)) {
            this._activeFilters.delete(id);
            this._scheduleCookieSave();
            this._notifyListeners();
            document.getElementById(id)?.classList.remove("active");
        }
    }

    /**
     * Toggles the state of a specific filter.
     * @param {string} id - the unique identifier of the filter.
     */
    toggle(id) {
        if (this._activeFilters.has(id)) {
            this.deactivate(id);
        } else {
            this.activate(id);
        }
    }

    /**
     * Clears all currently active filters.
     */
    clearAll() {
        if (this._activeFilters.size > 0) {
            this._activeFilters.clear();
            this._scheduleCookieSave();
            this._notifyListeners();
        }
    }

    /**
     * Returns an array of all currently active filter ids.
     * @returns {Array} - list of active filter identifiers.
     */
    getActiveFilters() {
        return Array.from(this._activeFilters);
    }

    /**
     * Returns the configuration details for a given filter id.
     * @param {string} id - the identifier of the filter.
     * @returns {Object|null} - the filter configuration.
     */
    getFilterConfig(id) {
        if (this._knownFilters.has(id)) {
            return this._knownFilters.get(id);
        }
        return null;
    }

    /**
     * Returns all registered filters, grouped or as a flat list.
     * @returns {Array} - list of all known filter configurations.
     */
    getAllKnownFilters() {
        return Array.from(this._knownFilters.values());
    }

    /**
     * Dispatches a custom event to notify components about state changes.
     */
    _notifyListeners() {
        const eventName = webexpress.webui.Event.CHANGE_FILTER_EVENT;
        const payload = {
            activeFilters: this.getActiveFilters()
        };

        const event = new CustomEvent(eventName, { 
            detail: payload,
            bubbles: true 
        });
        document.dispatchEvent(event);
    }

    /**
     * Schedules a debounced write operation to the cookie.
     */
    _scheduleCookieSave() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
        }
        this._saveTimer = setTimeout(() => {
            this._writeCookie();
        }, this._debounceTime);
    }

    /**
     * Serializes the active filters and writes them to a document cookie.
     */
    _writeCookie() {
        const val = encodeURIComponent(Array.from(this._activeFilters).join(","));
        // set cookie valid for 30 days with secure attributes
        const date = new Date();
        date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = this._cookieName + "=" + val + ";" + expires + ";path=/;SameSite=Strict";
    }

    /**
     * Reads and decodes the filter state from the document cookie.
     * @returns {string} - the decoded cookie value or empty string.
     */
    _readCookie() {
        const nameEq = this._cookieName + "=";
        const ca = document.cookie.split(";");
        
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEq) === 0) {
                return decodeURIComponent(c.substring(nameEq.length, c.length));
            }
        }
        return "";
    }
};

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
     * @param {string} key - The translation key to look up.
     * @returns {string}
     */
    translate(key) {
        const lang = this.language;
        const fallback = "en";
        let module = null;
        let localKey = key;

        // extract namespace prefix if present
        if (key.includes(":")) {
            const split = key.split(":");
            module = split[0];
            localKey = split[1];
        }

        // attempt module-prefixed lookup
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
    /**
     * Creates a new instance of the class.
     */
    constructor() {
        // initialize the syntax object to store language-specific configurations
        this.syntax = {};
    }

    /**
     * Registers syntax values for a specific language and alias.
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
 * Registry for editor plugins.
 * Allows decoupling of functionality into separate files.
 */
webexpress.webui.EditorPlugins = new class {
    /**
     * Creates a new instance of the class.
     */
    constructor() {
        this._plugins = [];
    }

    /**
     * Registers a new editor plugin.
     * Supports optional positioning.
     * Overloads:
     * register(name, definition) - Default position (10)
     * register(name, position, definition) - Explicit position
     * @param {string} name - The unique name of the plugin.
     * @param {number|object} arg2 - The position (number) or the definition (object).
     * @param {object} [arg3] - The definition object if arg2 is the position.
     * @returns {this} The registry instance.
     */
    register(name, arg2, arg3) {
        let position = 10; // default priority
        let definition = arg2;

        // check for overload register(name, position, definition)
        if (typeof arg2 === "number") {
            position = arg2;
            definition = arg3;
        }

        if (!name || !definition) return this;

        this._plugins.push({ 
            name: name, 
            position: position,
            definition: definition 
        });

        // ensure plugins are sorted by position
        this._plugins.sort((a, b) => a.position - b.position);

        return this;
    }

    /**
     * Returns all registered plugins sorted by position.
     * @returns {Array<object>} List of plugin definitions.
     */
    getAll() {
        return this._plugins.map((p) => { return p.definition; });
    }
};

/*
 * Registry for editor add-ons.
 * Manages the collection of available add-ons that can be inserted via the editor plugin.
 */
webexpress.webui.EditorAddOns = new class {
    /**
     * Creates a new instance of the class.
     */
    constructor() {
        this._addOns = [];
    }

    /**
     * Registers a new add-on.
     * @param {string} id - Unique identifier for the add-on.
     * @param {object} definition - The add-on definition object.
     * @param {string} definition.label - Display name used in the UI.
     * @param {string} definition.icon - Icon CSS class (e.g., 'fas fa-star').
     * @param {string} [definition.category] - Category group (e.g., 'Widgets', 'Layout'). Defaults to 'General'.
     * @param {string} [definition.type] - Layout type: 'block' (default) or 'inline'.
     * @param {boolean} [definition.isContainer] - If true, the body is editable (for nesting).
     * @param {string} [definition.content] - Static HTML content (used if no renderer is provided).
     * @param {string} [definition.description] - Optional description text shown in the picker.
     * @param {Array<object>} [definition.properties] - Array of property definitions for the settings dialog.
     * @param {Function} [definition.renderer] - Function(data) returning HTML string based on properties.
     * @returns {this} The registry instance for chaining.
     */
    register(id, definition) {
        if (!id || !definition) return this;

        // ensure the ID is included in the definition object for downstream usage
        definition.id = id;

        this._addOns.push({ 
            id: id, 
            definition: definition 
        });
        return this;
    }

    /**
     * Retrieves a specific add-on definition by ID.
     * @param {string} id - The add-on ID.
     * @returns {object|undefined} The add-on definition or undefined if not found.
     */
    get(id) {
        const entry = this._addOns.find(item => item.id === id);
        return entry ? entry.definition : undefined;
    }

    /**
     * Returns all registered add-ons as an array.
     * @returns {Array<object>} List of all add-on definitions.
     */
    getAll() {
        return this._addOns.map((item) => { return item.definition; });
    }

    /**
     * Unregisters an add-on.
     * @param {string} id - The add-on ID to remove.
     * @returns {boolean} True if removed, false otherwise.
     */
    unregister(id) {
        const idx = this._addOns.findIndex(item => item.id === id);
        if (idx !== -1) {
            this._addOns.splice(idx, 1);
            return true;
        }
        return false;
    }

    /**
     * Clears all registered add-ons.
     */
    clear() {
        this._addOns = [];
    }
};

/**
 * Stores panel definitions by key, optionally scoped via a modalId property on the panel object.
 * A "panel definition" is a plain object that may contain metadata and render/onShow/onSubmit hooks.
 */
webexpress.webui.DialogPanels = new class {
    /**
     * Creates a new instance of the class.
     */
    constructor() {
        this._panels = {};
    }

    /**
     * Registers one or multiple panels by modal key. Multiple panels per key are supported.
     * Optional modal scoping can be expressed by setting `modalId` on the panel object itself.
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
 * Registry for dashboard widgets.
 */
webexpress.webui.DashboardWidgets = new class {
    /**
     * Creates a new instance of the registry.
     */
    constructor() {
        this._widgets = {};
    }

    /**
     * Registers a new dashboard widget.
     * @param {string} id - The unique identifier for the widget.
     * @param {object} definition - The widget definition containing render logic.
     * @returns {this} The registry instance for chaining.
     */
    register(id, definition) {
        if (!id || !definition) {
            return this;
        }

        // store a shallow copy of the definition
        this._widgets[id] = Object.assign({ id: id }, definition);

        return this;
    }

    /**
     * Retrieves a widget definition by its id.
     * @param {string} id - The widget id.
     * @returns {object|null} The widget definition or null if not found.
     */
    get(id) {
        if (typeof id !== "string") {
            return null;
        }

        if (Object.prototype.hasOwnProperty.call(this._widgets, id)) {
            return Object.assign({}, this._widgets[id]);
        }

        return null;
    }

    /**
     * Retrieves all registered widgets.
     * @returns {Array<object>} An array of all widget definitions.
     */
    getAll() {
        const result = [];
        for (const key in this._widgets) {
            if (Object.prototype.hasOwnProperty.call(this._widgets, key)) {
                result.push(Object.assign({}, this._widgets[key]));
            }
        }
        return result;
    }
};

/**
 * Central registry for table cell templates (renderers).
 * Stores renderer functions and their default options by type key.
 */
webexpress.webui.TableTemplates = new class {
    /**
     * Creates a new instance of the class.
     */
    constructor() {
        this._templates = {};
    }

    /**
     * Registers a renderer function for a specific type.
     * Overwrites existing renderers if the same type is registered again.
     * @param {string} type - Unique template key (e.g., "date", "move", "currency").
     * @param {Function} rendererFn - function(val, table, row, cell, name, opts) => Node|String.
     * @param {object} [defaultOptions={}] - Optional default options merged with column options.
     * @returns {this} - The registry instance for chaining.
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
        // cleanup code, e.g., for event listeners
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
    * @param {string} type - Event type
    * @param {object} detail - Payload
    */
    _dispatch(type, detail) {
        this._element.dispatchEvent(new CustomEvent(type, {
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
     * @returns {string} - Translated text or the fallback.
     */
    _i18n(key, fallback) {
        if (key) {
            return (webexpress?.webui?.I18N?.translate(key)) ?? fallback;
        }
        return fallback;
    }

    /**
     * Determines whether the component is currently visible in the document.
     * @returns {boolean} - True if the element is visible; otherwise false.
     */
    _isVisible() {
        return this._element && this._element.offsetParent !== null;
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
        // map to track the visibility state of each menu
        this._menuVisibilityMap = this._menuVisibilityMap || new Map();

        // popper.js instance for positioning
        const popperInstance = Popper.createPopper(container, dropdownmenu, {
            placement: "bottom-start",
            modifiers: [
                {
                    name: "offset",
                    options: {
                        offset: [0, 4], // offset the suggestion box slightly
                    },
                },
                {
                    name: "preventOverflow",
                    options: {
                        boundary: "viewport", // ensure the suggestion box stays within the viewport
                    },
                },
            ],
        });

        // hide the suggestion box when clicking outside of it
        document.addEventListener("click", (event) => {
            if (!this._element.contains(event.target)) {
                if (this._menuVisibilityMap.get(dropdownmenu)) {
                    this._menuVisibilityMap.delete(dropdownmenu);
                    // trigger the DROPDOWN_HIDDEN_EVENT when the suggestion box is hidden
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

        // register the ESC key to close the suggestion menu
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                dropdownmenu.style.display = "none";
                if (this._menuVisibilityMap.get(dropdownmenu)) {
                    this._menuVisibilityMap.delete(dropdownmenu);
                    // trigger the DROPDOWN_HIDDEN_EVENT when the suggestion box is hidden
                    document.dispatchEvent(new CustomEvent(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {
                        detail: {
                            sender: this._element,
                            id: this._element.id
                        }
                    }));
                }
            }
        });

        // show and hide methods for the dropdownmenu (simulate .on('show')/.on('hide'))
        dropdownmenu.show = () => {
            dropdownmenu.style.display = "flex";
            // set width to match the element, if needed
            dropdownmenu.style.width = this._element.offsetWidth + "px";
            popperInstance.update();
            this._menuVisibilityMap.set(dropdownmenu, true);
            // trigger show event
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

        // listen for custom 'show' and 'hide' events
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
    // Event triggered when an element is double-clicked.
    static DOUBLE_CLICK_EVENT = "webexpress.webui.dbclick";
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
    // Event triggered when an row is selected.
    static SELECT_ROW_EVENT = "webexpress.webui.table.select.row";
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
    // Event triggered when a WebSocket connection is opened.
    static WS_OPEN_EVENT = "webexpress.webui.websocket.open";
    // Event triggered when a WebSocket receives a message.
    static WS_MESSAGE_EVENT = "webexpress.webui.websocket.message";
    // Event triggered when a WebSocket connection is closed.
    static WS_CLOSE_EVENT = "webexpress.webui.websocket.close";
    // Event triggered when a WebSocket error occurs.
    static WS_ERROR_EVENT = "webexpress.webui.websocket.error";
    // Event triggered when an item is selected.
    static SELECT_ITEM_EVENT = "webexpress.webui.select.item";
    // Event triggered to notify external pagination controls about current page/total.
    static UPDATE_PAGINATION_EVENT = "webexpress.webui.update.pagination";
    // Event triggered when a tab is selected.
    static TAB_SELECTED_EVENT = "webexpress.webui.tab.selected";
}