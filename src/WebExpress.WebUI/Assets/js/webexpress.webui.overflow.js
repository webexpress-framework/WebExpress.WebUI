/**
 * Controller that manages horizontal items and moves overflowing items into an overflow menu.
 * Supports items marked with data-overflow="never" (never move), data-overflow="force" (always in overflow) and data-overflow="hide" (hide in overflow).
 * Overflow logic can be enabled/disabled via setAutoDistribute(boolean).
 */
webexpress.webui.OverflowCtrl = class extends webexpress.webui.PopperCtrl {
    /**
     * creates a new overflow controller instance
     * @param {HTMLElement} element root horizontal container
     */
    constructor(element) {
        super(element);

        this._originalElements = Array.from(element.children).filter(function(n) { return n.nodeType === 1; });
        this._items = [];
        this._idSeq = 0;
        this._resizeObserver = null;
        this._openSubmenus = new Set();
        this._submenuPopper = null;

        // configuration flags
        this._cutoffEnabled = (this._element.dataset.overflowCutoff || "").toLowerCase() === "true";
        this._firstOverflowIndex = null;
        // auto distribute flag, can be set via public method
        this._autoDistribute = true;

        this._parseItems();

        element.classList.add("wx-overflow");
        element.innerHTML = "";

        this._buildOverflowDropdown();
        this._initialInsert();

        // only distribute if autoDistribute is enabled
        if (this._autoDistribute) {
            this._distribute();
        }
        this._setupResizeHandling();
        this._setupGlobalListeners();
    }

    /**
     * enables or disables automatic overflow distribution
     * @param {boolean} enabled
     */
    setAutoDistribute(enabled) {
        this._autoDistribute = !!enabled;
        if (this._autoDistribute) {
            this._distribute();
        }
    }

    /**
     * sets up resize handling with debounce, respects autoDistribute flag
     */
    _setupResizeHandling() {
        // debounce helper
        function debounce(fn, delay) {
            let t = null;
            return function() {
                const args = arguments;
                if (t) {
                    clearTimeout(t);
                }
                t = setTimeout(function() { fn.apply(null, args); }, delay);
            };
        }
        const onResize = debounce(() => {
            // only distribute if autoDistribute is enabled
            if (this._autoDistribute) {
                this.reflow();
                if (this._submenuPopper) {
                    this._submenuPopper.update();
                }
            }
        }, 80);

        if (typeof ResizeObserver === "function") {
            this._resizeObserver = new ResizeObserver(onResize);
            this._resizeObserver.observe(this._element);
        } else {
            window.addEventListener("resize", onResize);
        }
    }

    /**
     * public API: handleOverflow is called explicitly by the toolbar controller
     */
    handleOverflow() {
        this._distribute();
    }

    /**
     * public API: restore all items from overflow
     */
    restore() {
        this._restoreVisibleBaseline();
        this._growIfSpace();
        // ensure more button and menu are at the end
        this._element.appendChild(this._moreButton);
        this._element.appendChild(this._menu);
    }

    /**
     * parses direct children into descriptors (supports dropdown extraction)
     */
    _parseItems() {
        const self = this;
        this._originalElements.forEach(function(el, i) {
            const attr = el.dataset.overflow || "";
            const isForce = attr === "force";
            const isNever = attr === "never";
            const isHideOnly = attr === "hide";
            // detect if it is a standard dropdown that can be converted to a submenu
            const isDropdown = el.classList.contains("wx-dropdown") || el.classList.contains("dropdown");
            // ignore custom toolpanels for submenu conversion, keep them as atomic blocks
            const isCustom = el.classList.contains("wx-toolpanel") || el.classList.contains("wx-toolbar-custom");

            let menuStructure = null;
            let buttonContentNodes = [];

            el.removeAttribute("data-overflow");

            // only parse inner menu structure if it is a standard dropdown and NOT a custom complex element
            if (isDropdown && !isCustom) {
                const dropdownMenu = el.querySelector(".dropdown-menu");
                if (dropdownMenu) {
                    const allElements = Array.from(dropdownMenu.querySelectorAll(
                        ".dropdown-header, .dropdown-item, .dropdown-divider"
                    ));
                    menuStructure = allElements.map(function(node) {
                        if (node.classList.contains("dropdown-header")) {
                            return { type: "header", content: node.textContent.trim(), element: node };
                        } else if (node.classList.contains("dropdown-item")) {
                            return { type: "item", content: node.textContent.trim(), element: node };
                        } else if (node.classList.contains("dropdown-divider")) {
                            return { type: "divider", content: null, element: node };
                        }
                    });
                }
                const dropdownButton = el.querySelector("button, .btn, .dropdown-toggle");
                if (dropdownButton) {
                    buttonContentNodes = Array.from(dropdownButton.childNodes).map(function(n) { return n.cloneNode(true); });
                }
            }

            const item = {
                id: "oi-" + (self._idSeq++),
                index: i,
                element: el,
                never: isNever,
                force: isForce,
                hideOnly: isHideOnly,
                submenu: menuStructure,
                submenuLabel: buttonContentNodes,
                submenuInstances: [],
                inOverflowAsTrigger: false
            };
            self._items.push(item);
        });

        this._items.sort(function(a, b) { return a.index - b.index; });
    }

    /**
     * builds overflow trigger and menu and appends at the end of wx-overflow
     */
    _buildOverflowDropdown() {
        this._moreButton = document.createElement("button");
        this._moreButton.type = "button";
        this._moreButton.className = "btn wx-overflow-more";
        this._moreButton.setAttribute("aria-haspopup", "true");
        this._moreButton.setAttribute("aria-expanded", "false");

        const label = this._element.dataset.moreLabel;
        if (label) {
            this._moreButton.textContent = label;
        } else {
            const icon = document.createElement("i");
            icon.className = "fas fa-chevron-down";
            this._moreButton.appendChild(icon);
        }

        this._menu = document.createElement("div");
        this._menu.className = "wx-overflow-menu";
        this._menu.setAttribute("role", "menu");
        this._menu.style.display = "none";

        this._moreButton.addEventListener("click", (event) => {
            const button = event.currentTarget;
            const expanded = button.getAttribute("aria-expanded") === "true";
            if (expanded) {
                this._hideMenu();
            } else {
                this._showMenu();
            }
        });

        this._moreButton.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                e.preventDefault();
                if (this._moreButton.getAttribute("aria-expanded") !== "true") {
                    this._showMenu(() => { this._focusFirstMenuItem(); });
                } else {
                    this._focusFirstMenuItem();
                }
            } else if (e.key === "Escape") {
                this._hideMenu();
            }
        });

        this._menu.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (this._closeTopSubmenu()) {
                    e.preventDefault();
                    return;
                }
                this._hideMenu(true);
                this._moreButton.focus();
            }
        });

        this._element.appendChild(this._moreButton);
        document.body.appendChild(this._menu);
        this._initializePopper(this._moreButton, this._menu);
    }

    /**
     * sets up global listeners for outside click and escape
     */
    _setupGlobalListeners() {
        const self = this;
        document.addEventListener("click", function(e) {
            if (!self._element.contains(e.target)) {
                self._closeAllSubmenus();
                self._hideMenu(true);
                return;
            }
            const inMainMenu = self._menu.contains(e.target);
            const inSubmenuPanel = !!self._element.querySelector(".wx-overflow-subpanel") &&
                Array.from(self._element.querySelectorAll(".wx-overflow-subpanel")).some(function(p) { return p.contains(e.target); });
            const isMoreButton = self._moreButton.contains(e.target);
            
            // check if click is inside a custom element that might be in overflow or main bar
            // and has its own dropdown logic (prevent closing the main overflow menu if interacting with custom item internals)
            const targetEl = e.target;
            const isInsideCustom = targetEl.closest(".wx-toolpanel, .wx-toolbar-custom");
            
            if (!inMainMenu && !inSubmenuPanel && !isMoreButton && !isInsideCustom) {
                self._closeAllSubmenus();
            }
        });
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                self._closeAllSubmenus();
                self._hideMenu(true);
            }
        });
    }

    /**
     * shows overflow menu
     * @param {Function} cb callback
     */
    _showMenu(cb) {
        this._menu.style.display = "flex";
        this._menu.style.flexDirection = "column";
        this._moreButton.setAttribute("aria-expanded", "true");
        if (this._menu.show) {
            this._menu.show();
        }
        if (typeof cb === "function") {
            requestAnimationFrame(cb);
        }
    }

    /**
     * hides overflow menu
     * @param {boolean} suppressFocus suppress focusing the button
     */
    _hideMenu(suppressFocus) {
        this._moreButton.setAttribute("aria-expanded", "false");
        if (this._menu.hide) {
            this._menu.hide();
        } else {
            this._menu.style.display = "none";
        }
        this._closeAllSubmenus();
        if (!suppressFocus) {
            this._moreButton.focus();
        }
    }

    /**
     * focuses first focusable item in overflow menu
     */
    _focusFirstMenuItem() {
        const list = this._collectMenuFocusable();
        if (list.length > 0) {
            list[0].focus();
        }
    }

    /**
     * collects focusable nodes inside the overflow menu
     * @returns {HTMLElement[]} focusable list
     */
    _collectMenuFocusable() {
        const selectors = [
            ".wx-overflow-menu-item > button:not([disabled])",
            ".wx-overflow-menu-item > a",
            ".wx-overflow-submenu .btn",
            ".wx-overflow-menu-item input",
            ".wx-overflow-menu-item select"
        ].join(",");
        return Array.from(this._menu.querySelectorAll(selectors)).filter(function(el) { return el.offsetParent !== null; });
    }

    /**
     * inserts initial items (force go directly to overflow)
     */
    _initialInsert() {
        this._items.forEach((item) => {
            if (item.force) {
                this._representInOverflow(item);
            } else {
                this._element.insertBefore(item.element, this._moreButton);
            }
        });
        if (this._items.some(function(i) { return i.force; })) {
            this._moreButton.style.display = "inline-flex";
        }
    }

    /**
     * public API: triggers distribution
     */
    reflow() {
        this._distribute();
    }

    /**
     * orchestrates distribution (visible vs overflow)
     */
    _distribute() {
        this._restoreVisibleBaseline();
        if (this._items.some(function(i) { return i.force; })) {
            this._moreButton.style.display = "inline-flex";
        }
        this._shrinkUntilFit();
        this._growIfSpace();
        const hasOverflowItems = this._items.some((i) => { return this._isRepresentedInOverflow(i); });
        if (!hasOverflowItems) {
            this._moreButton.style.display = "none";
            this._hideMenu(true);
        } else {
            this._moreButton.style.display = "inline-flex";
        }
        this._element.appendChild(this._moreButton);
        this._element.appendChild(this._menu);
    }

    /**
     * restores baseline by placing all non-represented originals into the visible container
     */
    _restoreVisibleBaseline() {
        const self = this;
        const children = Array.from(this._element.children);
        children.forEach(function(child) {
            if (!child.classList.contains("wx-overflow-more") && !child.classList.contains("wx-overflow-menu")) {
                self._element.removeChild(child);
            }
        });
        this._items.forEach(function(item) {
            if (!item.force && !self._isRepresentedInOverflow(item)) {
                self._element.insertBefore(item.element, self._moreButton);
            }
        });
    }

    /**
     * Moves items to overflow until everything fits.
     * All items (except 'never') right of a hidden/overflowed item must be moved to overflow.
     */
    _shrinkUntilFit() {
        let guard = 1000;
        let moved = false;
        let firstHiddenIdx = null;
        while (this._needsOverflow() && guard > 0) {
            guard--;
            const candidate = this._findLastMovableVisibleItem();
            if (!candidate) {
                break;
            }
            if (candidate.element.parentElement === this._element) {
                this._element.removeChild(candidate.element);
            }
            if (candidate.hideOnly) {
                // do not move to overflow, just hide
            } else {
                this._representInOverflow(candidate);
            }
            moved = true;
            if (firstHiddenIdx === null) {
                firstHiddenIdx = candidate.index;
            }
            if (this._cutoffEnabled && this._firstOverflowIndex === null) {
                this._firstOverflowIndex = candidate.index;
            }
        }
        // move all elements right of the first hidden/overflowed (except 'never') to overflow
        if (firstHiddenIdx !== null) {
            let hideMode = false;
            for (let i = 0; i < this._items.length; i++) {
                const item = this._items[i];
                if (item.force || item.never) {
                    continue;
                }
                if (hideMode) {
                    if (item.element.parentElement === this._element) {
                        this._element.removeChild(item.element);
                    }
                    if (!item.hideOnly && !this._isRepresentedInOverflow(item)) {
                        this._representInOverflow(item);
                    }
                }
                // if item is hidden or in overflow, all right siblings must be hidden/overflowed too
                if (
                    item.hideOnly && item.element.parentElement !== this._element ||
                    !item.hideOnly && this._isRepresentedInOverflow(item)
                ) {
                    hideMode = true;
                }
            }
        }
    }

    /**
     * Moves all trailing items after the first overflowed item, regardless of cutoff flag.
     * this enforces that if the leftmost item is in overflow, all right siblings are also in overflow
     */
    _moveAllTrailingAfterFirstHiddenOrOverflowed() {
        let firstHiddenIdx = null;
        for (let i = 0; i < this._items.length; i++) {
            const item = this._items[i];
            if (
                this._isRepresentedInOverflow(item) ||
                (item.hideOnly && item.element.parentElement !== this._element)
            ) {
                firstHiddenIdx = i;
                break;
            }
        }
        if (firstHiddenIdx === null) {
            return;
        }
        const self = this;
        this._items.forEach(function (item, idx) {
            if (idx > firstHiddenIdx && !item.force && item.element.parentElement === self._element) {
                self._element.removeChild(item.element);
                if (!item.hideOnly) {
                    self._representInOverflow(item);
                }
            }
        });
    }

    /**
     * Attempts to bring items back when space is available (disabled if left neighbor is still hidden).
     */
    _growIfSpace() {
        if (this._cutoffEnabled && this._firstOverflowIndex !== null) {
            return;
        }
        const self = this;
        let allLeftVisible = true;
        for (let i = 0; i < this._items.length; i++) {
            const item = this._items[i];
            if (item.force || item.never) {
                continue;
            }
            if (!allLeftVisible) {
                if (item.element.parentElement === this._element) {
                    this._element.removeChild(item.element);
                }
                if (!item.hideOnly && !this._isRepresentedInOverflow(item)) {
                    self._representInOverflow(item);
                }
                continue;
            }
            if (item.hideOnly && item.element.parentElement !== this._element) {
                self._insertVisibleOrdered(item);
                if (this._needsOverflow()) {
                    if (item.element.parentElement === this._element) {
                        this._element.removeChild(item.element);
                    }
                    allLeftVisible = false;
                    continue;
                }
            }
            if (!item.hideOnly && this._isRepresentedInOverflow(item)) {
                self._removeOverflowRepresentation(item);
                self._insertVisibleOrdered(item);
                if (this._needsOverflow()) {
                    if (item.element.parentElement === this._element) {
                        this._element.removeChild(item.element);
                    }
                    self._representInOverflow(item);
                    allLeftVisible = false;
                    continue;
                }
            }
            if (
                (item.hideOnly && item.element.parentElement !== this._element) ||
                (!item.hideOnly && self._isRepresentedInOverflow(item))
            ) {
                allLeftVisible = false;
            }
        }
        const anyOverflow = this._items.some(function (i) { return self._isRepresentedInOverflow(i); });
        const anyHideOnlyHidden = this._items.some(function (i) { return i.hideOnly && i.element.parentElement !== self._element; });
        if (!anyOverflow && !anyHideOnlyHidden) {
            this._firstOverflowIndex = null;
        }
    }

    /**
     * Inserts item into visible container preserving original ordering.
     * @param {object} item descriptor
     */
    _insertVisibleOrdered(item) {
        const children = Array.from(this._element.children);
        let inserted = false;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child === this._moreButton || child === this._menu) {
                continue;
            }
            const ref = this._items.find(function(it) { return it.element === child; });
            if (ref && ref.index > item.index) {
                this._element.insertBefore(item.element, child);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            this._element.insertBefore(item.element, this._moreButton);
        }
    }

    /**
     * Ordered insertion into overflow menu.
     * @param {HTMLElement} wrapper wrapper node
     * @param {number} index original index
     */
    _insertOverflowOrdered(wrapper, index) {
        wrapper.dataset.originalIndex = String(index);
        const list = Array.from(this._menu.querySelectorAll(".wx-overflow-menu-item"));
        let inserted = false;
        for (let i = 0; i < list.length; i++) {
            const node = list[i];
            const idxAttr = node.dataset.originalIndex;
            if (idxAttr && parseInt(idxAttr, 10) > index) {
                this._menu.insertBefore(wrapper, node);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            this._menu.appendChild(wrapper);
        }
    }

    /**
     * Creates a representation for an item inside the overflow (dropdown trigger or content item).
     * @param {object} item descriptor
     */
    _representInOverflow(item) {
        if (item.submenu) {
            // submenu logic remains same logic as before
            const wrapper = document.createElement("div");
            wrapper.className = "wx-overflow-menu-item";
            wrapper.setAttribute("role", "none");

            const triggerRow = document.createElement("div");
            triggerRow.className = "wx-overflow-submenu";

            const label = document.createElement("span");
            label.className = "wx-link";
            if (item.submenuLabel && item.submenuLabel.length > 0) {
                item.submenuLabel.forEach(function(n) { label.appendChild(n.cloneNode(true)); });
            } else {
                label.textContent = "Submenu";
            }

            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn";
            button.setAttribute("aria-haspopup", "true");
            button.setAttribute("aria-expanded", "false");
            button.dataset.itemId = item.id;
            
            const icon = document.createElement("i");
            icon.className = "fas fa-chevron-right";
            button.appendChild(icon);

            // event listeners for submenu
             label.addEventListener("click", (e) => { e.stopPropagation(); this._openSubmenu(item, button); });
            button.addEventListener("click", (e) => { e.stopPropagation(); this._openSubmenu(item, button); });

            triggerRow.appendChild(label);
            triggerRow.appendChild(button);
            wrapper.appendChild(triggerRow);
            this._insertOverflowOrdered(wrapper, item.index);
            item.inOverflowAsTrigger = true;
            
        } else {
            const wrapper2 = document.createElement("div");
            wrapper2.className = "wx-overflow-menu-item";
            wrapper2.setAttribute("role", "none");

            // check if the element needs a text label in overflow
            const el = item.element;
            const hasVisibleText = el.textContent && el.textContent.trim().length > 0;
            const isIconOnly = el.querySelector("i, img, svg") && !hasVisibleText;
            
            // try to find a fallback text from attributes
            let fallbackText = null;
            if (isIconOnly || !hasVisibleText) {
                fallbackText = el.getAttribute("title") || 
                               el.getAttribute("aria-label") || 
                               el.dataset.label || 
                               el.dataset.originalTitle; // bootstrap tooltips sometimes move title here
            }

            // move the element
            wrapper2.appendChild(item.element);

            if (fallbackText) {
                // create a label specifically for the overflow view
                const textSpan = document.createElement("span");
                textSpan.className = "wx-overflow-fallback-label ms-2"; // add margin-start
                textSpan.textContent = fallbackText;

                wrapper2.appendChild(textSpan);
                item.overflowLabelSpan = textSpan;
                item.originalDisplay = item.element.style.display;
                item.element.style.display = "inline-flex";
            }

            this._insertOverflowOrdered(wrapper2, item.index);
        }
        this._moreButton.style.display = "inline-flex";
    }

    /**
     * Removes overflow representation of an item.
     * @param {object} item descriptor
     */
    _removeOverflowRepresentation(item) {
        if (item.submenu && item.inOverflowAsTrigger) {
            const node = this._findSubmenuTriggerWrapper(item);
            if (node && node.parentElement === this._menu) {
                node.parentElement.removeChild(node);
            }
            item.inOverflowAsTrigger = false;
            this._closeSubmenu(item, null);
        } else {
            const parent = item.element.parentElement;
            
            // remove the fallback label span if we created one
            if (item.overflowLabelSpan) {
                if (item.overflowLabelSpan.parentElement === parent) {
                    parent.removeChild(item.overflowLabelSpan);
                }
                item.overflowLabelSpan = null;
            }
            
            // restore original display style
            if (item.originalDisplay !== undefined) {
                item.element.style.display = item.originalDisplay;
                delete item.originalDisplay;
            }

            if (parent && parent.classList.contains("wx-overflow-menu-item")) {
                parent.parentElement && parent.parentElement.removeChild(parent);
            }
        }
    }

    /**
     * Checks if item is represented in overflow.
     * @param {object} item descriptor
     * @returns {boolean} true if represented
     */
    _isRepresentedInOverflow(item) {
        if (item.submenu) {
            return item.inOverflowAsTrigger === true;
        }
        const p = item.element.parentElement;
        return !!(p && p.classList.contains("wx-overflow-menu-item"));
    }

    /**
     * Finds wrapper for submenu trigger.
     * @param {object} item descriptor
     * @returns {HTMLElement|null} wrapper
     */
    _findSubmenuTriggerWrapper(item) {
        const nodes = this._menu.querySelectorAll(".wx-overflow-menu-item");
        for (let i = 0; i < nodes.length; i++) {
            const trig = nodes[i].querySelector(".btn[data-item-id]");
            if (trig && trig.dataset.itemId === item.id) {
                return nodes[i];
            }
        }
        return null;
    }

    /**
     * Finds the last movable visible item.
     * @returns {object|null} descriptor
     */
    _findLastMovableVisibleItem() {
        for (let i = this._items.length - 1; i >= 0; i--) {
            const item = this._items[i];
            if (item.force || item.never) {
                continue;
            }
            if (item.element.parentElement === this._element) {
                return item;
            }
        }
        return null;
    }

    /**
     * Determines if redistribution is needed.
     * @returns {boolean} need
     */
    _needsOverflow() {
        const container = this._element;
        let tempShown = false;

        if (!this._moreButton) {
            return false;
        }
        if (this._moreButton.style.display === "none") {
            this._moreButton.style.visibility = "hidden";
            this._moreButton.style.display = "inline-flex";
            tempShown = true;
        }

        const moreWidth = this._moreButton.getBoundingClientRect().width;
        const classicalOverflow = container.scrollWidth > container.clientWidth + 0.5;

        let geometricOverlap = false;
        const lastVisibleEl = this._getLastVisibleNonForceItemElement();
        if (lastVisibleEl) {
            const lastRect = lastVisibleEl.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const allowedRight = containerRect.left + container.clientWidth - moreWidth;
            if (lastRect.right > allowedRight - 0.5) {
                geometricOverlap = true;
            }
        }

        const need = classicalOverflow || geometricOverlap;

        if (tempShown && 
            !need && 
            !this._items.some((i) => { return this._isRepresentedInOverflow(i); }) && 
            !this._items.some(function(i) { return i.force; })) {
            this._moreButton.style.display = "none";
            this._moreButton.style.visibility = "";
        } else if (tempShown) {
            this._moreButton.style.visibility = "";
        }

        return need;
    }

    /**
     * Returns last visible movable element.
     * @returns {HTMLElement|null} element
     */
    _getLastVisibleNonForceItemElement() {
        for (let i = this._items.length - 1; i >= 0; i--) {
            const item = this._items[i];
            if (item.force || item.never) {
                continue;
            }
            if (item.element && item.element.parentElement === this._element) {
                return item.element;
            }
        }
        return null;
    }

    /**
     * Opens submenu for a trigger button.
     * @param {HTMLElement} trigger trigger button
     */
    _openSubmenuForTrigger(trigger) {
        const id = trigger.dataset.itemId;
        if (!id) {
            return;
        }
        const item = this._items.find(i => i.id === id);
        if (item) {
            this._openSubmenu(item, trigger, () => this._focusFirstInSubmenu(item));
        }
    }

    /**
     * Opens or toggles submenu panel for a dropdown item.
     * Adds delegation to close on item click.
     * @param {object} item descriptor
     * @param {HTMLElement} trigger trigger element
     * @param {Function} cb callback
     */
    _openSubmenu(item, trigger, cb) {
        const existing = item.submenuInstances.find(inst => inst.trigger === trigger);
        if (existing) {
            this._closeSubmenu(item, trigger);
            return;
        }
        if (!item.submenu) {
            return;
        }
        this._closeAllSubmenus();

        const panel = document.createElement("div");
        panel.classList.add("wx-overflow-menu", "wx-overflow-subpanel");
        panel.setAttribute("role", "menu");
        this._element.appendChild(panel);

        this._prepareSubmenuPanel(panel, item.submenu);

        panel.addEventListener("click", (evt) => {
            const target = evt.target.closest(".wx-overflow-menu-item, .dropdown-item, .wx-overflow-menu-item > a, .wx-overflow-menu-item > button");
            if (target) {
                this._closeSubmenu(item, trigger);
            }
        });

        trigger.setAttribute("aria-expanded", "true");
        const instance = { trigger, panel };
        item.submenuInstances.push(instance);
        this._openSubmenus.add(panel);

        if (!this._submenuPopper) {
            this._submenuPopper = this._initializePopper(trigger, panel);
        } else {
            this._submenuPopper.state.elements.reference = trigger;
            this._submenuPopper.state.elements.popper = panel;
            this._submenuPopper.update();
        }

        if (panel.show) {
            panel.show();
        } else {
            panel.style.display = "flex";
            panel.style.flexDirection = "column";
        }

        panel.addEventListener("keydown", (e) => {
            if (e.key === "Escape" || e.key === "ArrowLeft") {
                e.preventDefault();
                this._closeSubmenu(item, trigger);
                trigger.focus();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                this._focusNextInSubmenu(item, trigger, 1);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                this._focusNextInSubmenu(item, trigger, -1);
            } else if (e.key === "Home") {
                e.preventDefault();
                this._focusFirstInSubmenu(item);
            } else if (e.key === "End") {
                e.preventDefault();
                this._focusLastInSubmenu(item);
            }
        });

        if (typeof cb === "function") {
            requestAnimationFrame(cb);
        }
    }

    /**
     * Populates submenu panel with cloned nodes.
     * Uses distinct class names for submenu context.
     * @param {HTMLElement} panel submenu panel
     * @param {Array} submenus structure list
     */
    _prepareSubmenuPanel(panel, submenus) {
        submenus.forEach(sub => {
            const elem = sub.element.cloneNode(true);
            if (sub.type === "header") {
                elem.classList.add("wx-overflow-submenu-header");
                elem.setAttribute("role", "presentation");
            } else if (sub.type === "item") {
                elem.classList.add("wx-overflow-menu-item");
                elem.setAttribute("role", "menuitem");
                elem.tabIndex = -1;
            } else if (sub.type === "divider") {
                elem.classList.add("wx-overflow-submenu-divider");
                elem.setAttribute("role", "separator");
            }
            panel.appendChild(elem);
        });
    }

    /**
     * Closes submenu(s) for an item.
     * @param {object} item descriptor
     * @param {HTMLElement|null} trigger trigger button or null
     */
    _closeSubmenu(item, trigger) {
        const instances = trigger
            ? item.submenuInstances.filter(inst => inst.trigger === trigger)
            : item.submenuInstances.slice();
        for (const inst of instances) {
            const { panel, trigger: trig } = inst;
            if (panel && panel.parentElement) {
                if (panel.hide) {
                    panel.hide();
                }
                panel.parentElement.removeChild(panel);
            }
            this._openSubmenus.delete(panel);
            trig.setAttribute("aria-expanded", "false");
        }
        item.submenuInstances = item.submenuInstances.filter(inst => !instances.includes(inst));
    }

    /**
     * Closes most recently opened submenu.
     * @returns {boolean} true if closed
     */
    _closeTopSubmenu() {
        if (this._openSubmenus.size === 0) {
            return false;
        }
        const top = Array.from(this._openSubmenus).pop();
        for (const item of this._items) {
            const inst = item.submenuInstances.find(s => s.panel === top);
            if (inst) {
                this._closeSubmenu(item, inst.trigger);
                inst.trigger.focus();
                return true;
            }
        }
        return false;
    }

    /**
     * Closes all open submenus.
     */
    _closeAllSubmenus() {
        for (const item of this._items) {
            if (item.submenuInstances.length > 0) {
                this._closeSubmenu(item, null);
            }
        }
    }

    /**
     * Focuses first focusable element in last opened submenu.
     * @param {object} item descriptor
     */
    _focusFirstInSubmenu(item) {
        const inst = item.submenuInstances[item.submenuInstances.length - 1];
        if (!inst) {
            return;
        }
        const list = this._collectSubmenuFocusable(inst.panel);
        if (list.length > 0) {
            list[0].focus();
        }
    }

    /**
     * Focuses last focusable element in last opened submenu.
     * @param {object} item descriptor
     */
    _focusLastInSubmenu(item) {
        const inst = item.submenuInstances[item.submenuInstances.length - 1];
        if (!inst) {
            return;
        }
        const list = this._collectSubmenuFocusable(inst.panel);
        if (list.length > 0) {
            list[list.length - 1].focus();
        }
    }

    /**
     * Moves focus inside a submenu.
     * @param {object} item descriptor
     * @param {HTMLElement} trigger trigger button
     * @param {number} dir direction
     */
    _focusNextInSubmenu(item, trigger, dir) {
        const inst = item.submenuInstances.find(i => i.trigger === trigger);
        if (!inst) {
            return;
        }
        const list = this._collectSubmenuFocusable(inst.panel);
        if (list.length === 0) {
            return;
        }
        const active = document.activeElement;
        let idx = list.indexOf(active);
        if (idx === -1) {
            idx = dir > 0 ? 0 : list.length - 1;
        } else {
            idx = (idx + dir + list.length) % list.length;
        }
        list[idx].focus();
    }

    /**
     * Collects focusable nodes in a submenu panel.
     * @param {HTMLElement} panel panel
     * @returns {HTMLElement[]} list
     */
    _collectSubmenuFocusable(panel) {
        const selectors = [
            "button:not([disabled])",
            "a[href]",
            "[role='menuitem']",
            "[tabindex]:not([tabindex='-1'])"
        ].join(",");
        return Array.from(panel.querySelectorAll(selectors)).filter(el => el.offsetParent !== null);
    }

    /**
     * Cleans up resources.
     */
    destroy() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._submenuPopper) {
            this._submenuPopper.destroy();
            this._submenuPopper = null;
        }
        this._hideMenu(true);
        this._closeAllSubmenus();
    }
};

// register controller
webexpress.webui.Controller.registerClass("wx-webui-overflow", webexpress.webui.OverflowCtrl);