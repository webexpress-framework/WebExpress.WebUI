/**
 * Controller that manages horizontal items and moves overflowing items into an overflow menu.
 * Supports items marked with data-overflow="never" (never move) and data-overflow="force" (always in overflow).
 */
webexpress.webui.OverflowCtrl = class extends webexpress.webui.PopperCtrl {

    /**
     * @constructor
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

        this._parseItems();

        element.classList.add("wx-overflow");
        element.innerHTML = "";

        this._buildOverflowDropdown();
        this._initialInsert();
        this._distribute();
        this._setupResizeHandling();
        this._setupGlobalListeners();
    }

    /**
     * Parses direct children into descriptors (supports dropdown extraction).
     */
    _parseItems() {
        var self = this;
        this._originalElements.forEach(function(el, i) {
            var attr = el.dataset.overflow || "";
            var isForce = attr === "force";
            var isNever = attr === "never";
            var isHideOnly = attr === "hide"; 
            var isDropdown = el.classList.contains("wx-dropdown");

            var menuStructure = null;
            var buttonContentNodes = [];

            if (isDropdown) {
                var dropdownMenu = el.querySelector(".dropdown-menu");
                if (dropdownMenu) {
                    var allElements = Array.from(dropdownMenu.querySelectorAll(
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
                var dropdownButton = el.querySelector("button");
                if (dropdownButton) {
                    buttonContentNodes = Array.from(dropdownButton.childNodes).map(function(n) { return n.cloneNode(true); });
                }
            }

            var item = {
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
     * Builds overflow trigger and menu and appends at the end of wx-overflow.
     */
    _buildOverflowDropdown() {
        this._moreButton = document.createElement("button");
        this._moreButton.type = "button";
        this._moreButton.className = "btn wx-overflow-more";
        this._moreButton.setAttribute("aria-haspopup", "true");
        this._moreButton.setAttribute("aria-expanded", "false");

        var label = this._element.dataset.moreLabel;
        if (label) {
            this._moreButton.textContent = label;
        } else {
            var icon = document.createElement("i");
            icon.className = "fas fa-chevron-down";
            this._moreButton.appendChild(icon);
        }

        this._menu = document.createElement("div");
        this._menu.className = "wx-overflow-menu";
        this._menu.setAttribute("role", "menu");
        this._menu.style.display = "none";

        this._moreButton.addEventListener("click", (event) => {
            // always use curly braces for control structures
            var button = event.currentTarget;
            var expanded = button.getAttribute("aria-expanded") === "true";
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

        // add the button and menu at the end of wx-overflow
        this._element.appendChild(this._moreButton);
        this._element.appendChild(this._menu);
        this._initializePopper(this._moreButton, this._menu);
    }

    /**
     * Sets up global listeners for outside click and escape.
     */
    _setupGlobalListeners() {
        var self = this;
        document.addEventListener("click", function(e) {
            if (!self._element.contains(e.target)) {
                self._closeAllSubmenus();
                self._hideMenu(true);
                return;
            }
            var inMainMenu = self._menu.contains(e.target);
            var inSubmenuPanel = !!self._element.querySelector(".wx-overflow-subpanel") &&
                Array.from(self._element.querySelectorAll(".wx-overflow-subpanel")).some(function(p) { return p.contains(e.target); });
            var isMoreButton = self._moreButton.contains(e.target);
            if (!inMainMenu && !inSubmenuPanel && !isMoreButton) {
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
     * Shows overflow menu.
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
     * Hides overflow menu.
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
     * Focuses first focusable item in overflow menu.
     */
    _focusFirstMenuItem() {
        var list = this._collectMenuFocusable();
        if (list.length > 0) {
            list[0].focus();
        }
    }

    /**
     * Collects focusable nodes inside the overflow menu.
     * @returns {HTMLElement[]} focusable list
     */
    _collectMenuFocusable() {
        var selectors = [
            ".wx-overflow-menu-item > button:not([disabled])",
            ".wx-overflow-menu-item > a",
            ".wx-overflow-submenu .btn"
        ].join(",");
        return Array.from(this._menu.querySelectorAll(selectors)).filter(function(el) { return el.offsetParent !== null; });
    }

    /**
     * Inserts initial items (force go directly to overflow).
     */
    _initialInsert() {
        var self = this;
        this._items.forEach(function(item) {
            if (item.force) {
                self._representInOverflow(item);
            } else {
                // insert before the overflow button
                self._element.insertBefore(item.element, self._moreButton);
            }
        });
        if (this._items.some(function(i) { return i.force; })) {
            this._moreButton.style.display = "inline-flex";
        }
    }

    /**
     * Public API to trigger distribution.
     */
    reflow() {
        this._distribute();
    }

    /**
     * Orchestrates distribution (visible vs overflow).
     */
    _distribute() {
        this._restoreVisibleBaseline();
        if (this._items.some(function(i) { return i.force; })) {
            this._moreButton.style.display = "inline-flex";
        }
        this._shrinkUntilFit();
        this._growIfSpace();
        var hasOverflowItems = this._items.some((i) => { return this._isRepresentedInOverflow(i); });
        if (!hasOverflowItems) {
            this._moreButton.style.display = "none";
            this._hideMenu(true);
        } else {
            this._moreButton.style.display = "inline-flex";
        }
        // always ensure the more button and menu are at the end
        this._element.appendChild(this._moreButton);
        this._element.appendChild(this._menu);
    }

    /**
     * Restores baseline by placing all non-represented originals into the visible container.
     */
    _restoreVisibleBaseline() {
        var self = this;
        // remove all non-overflow items and append in order before the overflow button
        var children = Array.from(this._element.children);
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
     * ab jetzt: wenn das linkeste ausgeblendet ist, werden alle weiteren rechts davon auch ausgeblendet
     */
    _shrinkUntilFit() {
        var guard = 1000;
        var moved = false;
        var firstHiddenIdx = null;
        // wie bisher: ausblenden bis overflow passt
        while (this._needsOverflow() && guard > 0) {
            guard--;
            var candidate = this._findLastMovableVisibleItem();
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
            // merke dir das erste entfernte element
            if (firstHiddenIdx === null) {
                firstHiddenIdx = candidate.index;
            }
            // cutoff für das erste overflowed item bleibt wie gehabt
            if (this._cutoffEnabled && this._firstOverflowIndex === null) {
                this._firstOverflowIndex = candidate.index;
            }
        }
        // ab hier: alles rechts vom ersten entfernten element ebenfalls entfernen
        if (firstHiddenIdx !== null) {
            for (var i = firstHiddenIdx + 1; i < this._items.length; i++) {
                var item = this._items[i];
                if (item.force || item.never) {
                    continue;
                }
                if (item.element.parentElement === this._element) {
                    this._element.removeChild(item.element);
                }
                if (!item.hideOnly && !this._isRepresentedInOverflow(item)) {
                    this._representInOverflow(item);
                }
            }
        }
    }

    /**
     * Moves all trailing items after the first overflowed item, regardless of cutoff flag.
     * this enforces that if the leftmost item is in overflow, all right siblings are also in overflow
     */
    _moveAllTrailingAfterFirstHiddenOrOverflowed() {
        var firstHiddenIdx = null;
        for (var i = 0; i < this._items.length; i++) {
            var item = this._items[i];
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
        var self = this;
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
        var self = this;
        var allLeftVisible = true;
        for (var i = 0; i < this._items.length; i++) {
            var item = this._items[i];
            if (item.force || item.never) {
                continue;
            }
            // check if left siblings are all visible
            if (!allLeftVisible) {
                // as soon as one item left is not visible, nothing right of it should be (re)inserted
                if (item.element.parentElement === this._element) {
                    this._element.removeChild(item.element);
                }
                if (!item.hideOnly && !this._isRepresentedInOverflow(item)) {
                    this._representInOverflow(item);
                }
                continue;
            }
            // try to restore hideOnly item
            if (item.hideOnly && item.element.parentElement !== this._element) {
                this._insertVisibleOrdered(item);
                if (this._needsOverflow()) {
                    if (item.element.parentElement === this._element) {
                        this._element.removeChild(item.element);
                    }
                    // no further items can be restored, break the loop
                    allLeftVisible = false;
                    continue;
                }
            }
            // try to restore overflowed item
            if (!item.hideOnly && this._isRepresentedInOverflow(item)) {
                this._removeOverflowRepresentation(item);
                this._insertVisibleOrdered(item);
                if (this._needsOverflow()) {
                    if (item.element.parentElement === this._element) {
                        this._element.removeChild(item.element);
                    }
                    this._representInOverflow(item);
                    // no further items can be restored, break the loop
                    allLeftVisible = false;
                    continue;
                }
            }
            // check status for next iteration
            if (
                (item.hideOnly && item.element.parentElement !== this._element) ||
                (!item.hideOnly && this._isRepresentedInOverflow(item))
            ) {
                allLeftVisible = false;
            }
        }
        var anyOverflow = this._items.some(function (i) { return self._isRepresentedInOverflow(i); });
        var anyHideOnlyHidden = this._items.some(function (i) { return i.hideOnly && i.element.parentElement !== self._element; });
        if (!anyOverflow && !anyHideOnlyHidden) {
            this._firstOverflowIndex = null;
        }
    }

    /**
     * Inserts item into visible container preserving original ordering.
     * @param {object} item descriptor
     */
    _insertVisibleOrdered(item) {
        var children = Array.from(this._element.children);
        var inserted = false;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child === this._moreButton || child === this._menu) {
                continue;
            }
            var ref = this._items.find(function(it) { return it.element === child; });
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
        var list = Array.from(this._menu.querySelectorAll(".wx-overflow-menu-item"));
        var inserted = false;
        for (var i = 0; i < list.length; i++) {
            var node = list[i];
            var idxAttr = node.dataset.originalIndex;
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
            var wrapper = document.createElement("div");
            wrapper.className = "wx-overflow-menu-item";
            wrapper.setAttribute("role", "none");

            var triggerRow = document.createElement("div");
            triggerRow.className = "wx-overflow-submenu";

            var label = document.createElement("span");
            label.className = "wx-link";
            if (item.submenuLabel && item.submenuLabel.length > 0) {
                item.submenuLabel.forEach(function(n) { label.appendChild(n.cloneNode(true)); });
            } else {
                label.textContent = "Submenu";
            }

            var button = document.createElement("button");
            button.type = "button";
            button.className = "btn";
            button.setAttribute("aria-haspopup", "true");
            button.setAttribute("aria-expanded", "false");
            button.dataset.itemId = item.id;

            var icon = document.createElement("i");
            icon.className = "fas fa-chevron-right";
            button.appendChild(icon);

            label.addEventListener("click", (e) => {
                e.stopPropagation();
                this._openSubmenu(item, button);
            });
            button.addEventListener("click", (e) => {
                e.stopPropagation();
                this._openSubmenu(item, button);
            });
            button.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
                    e.preventDefault();
                    this._openSubmenu(item, button, () => { this._focusFirstInSubmenu(item); });
                } else if (e.key === "ArrowLeft" || e.key === "Escape") {
                    if (button.getAttribute("aria-expanded") === "true") {
                        e.preventDefault();
                        this._closeSubmenu(item, button);
                        button.focus();
                    }
                }
            });

            triggerRow.appendChild(label);
            triggerRow.appendChild(button);
            wrapper.appendChild(triggerRow);
            this._insertOverflowOrdered(wrapper, item.index);
            item.inOverflowAsTrigger = true;
        } else {
            var wrapper2 = document.createElement("div");
            wrapper2.className = "wx-overflow-menu-item";
            wrapper2.setAttribute("role", "none");

            wrapper2.appendChild(item.element);
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
            var node = this._findSubmenuTriggerWrapper(item);
            if (node && node.parentElement === this._menu) {
                node.parentElement.removeChild(node);
            }
            item.inOverflowAsTrigger = false;
            this._closeSubmenu(item, null);
        } else {
            var parent = item.element.parentElement;
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
        var p = item.element.parentElement;
        return !!(p && p.classList.contains("wx-overflow-menu-item"));
    }

    /**
     * Finds wrapper for submenu trigger.
     * @param {object} item descriptor
     * @returns {HTMLElement|null} wrapper
     */
    _findSubmenuTriggerWrapper(item) {
        var nodes = this._menu.querySelectorAll(".wx-overflow-menu-item");
        for (var i = 0; i < nodes.length; i++) {
            var trig = nodes[i].querySelector(".btn[data-item-id]");
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
        for (var i = this._items.length - 1; i >= 0; i--) {
            var item = this._items[i];
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
        var container = this._element;
        var tempShown = false;

        if (!this._moreButton) {
            return false;
        }
        if (this._moreButton.style.display === "none") {
            this._moreButton.style.visibility = "hidden";
            this._moreButton.style.display = "inline-flex";
            tempShown = true;
        }

        var moreWidth = this._moreButton.getBoundingClientRect().width;
        var classicalOverflow = container.scrollWidth > container.clientWidth + 0.5;

        var geometricOverlap = false;
        var lastVisibleEl = this._getLastVisibleNonForceItemElement();
        if (lastVisibleEl) {
            var lastRect = lastVisibleEl.getBoundingClientRect();
            var containerRect = container.getBoundingClientRect();
            var allowedRight = containerRect.left + container.clientWidth - moreWidth;
            if (lastRect.right > allowedRight - 0.5) {
                geometricOverlap = true;
            }
        }

        var need = classicalOverflow || geometricOverlap;

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
        for (var i = this._items.length - 1; i >= 0; i--) {
            var item = this._items[i];
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

        // delegation: close submenu when a submenu item (or legacy .dropdown-item) is clicked
        panel.addEventListener("click", (evt) => {
            const target = evt.target.closest(".wx-overflow-menu-item, .dropdown-item, .wx-overflow-menu-item > a, .wx-overflow-menu-item > button");
            if (target) {
                this._closeSubmenu(item, trigger);
                // optional: also close main menu; falls nicht gewünscht, Zeile auskommentieren
                // this._hideMenu(true);
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
                elem.classList.add("wx-overflow-submenu-header"); // keep semantic header class
                elem.setAttribute("role", "presentation");
            } else if (sub.type === "item") {
                // ensure consistent clickable class
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
        for (let inst of instances) {
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
        for (let item of this._items) {
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
        for (let item of this._items) {
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
     * Sets up resize handling with debounce.
     */
    _setupResizeHandling() {
        function debounce(fn, delay) {
            var t = null;
            return function() {
                var args = arguments;
                if (t) {
                    clearTimeout(t);
                }
                t = setTimeout(function() { fn.apply(null, args); }, delay);
            };
        }
        var onResize = debounce(() => {
            this.reflow();
            if (this._submenuPopper) {
                this._submenuPopper.update();
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