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

        this._originalElements = Array.from(element.children).filter(n => n.nodeType === 1);
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

        this._visibleContainer = document.createElement("div");
        this._visibleContainer.className = "wx-overflow-visible";
        element.appendChild(this._visibleContainer);

        this._buildOverflowDropdown();
        element.appendChild(this._moreWrapper);

        this._initialInsert();
        this._distribute();
        this._setupResizeHandling();
        this._setupGlobalListeners();
    }

    /**
     * Parses direct children into descriptors (supports dropdown extraction).
     */
    _parseItems() {
        this._originalElements.forEach((el, i) => {
            const attr = el.dataset.overflow || "";
            const isForce = attr === "force";
            const isNever = attr === "never";
            const isDropdown = el.classList.contains("wx-dropdown");

            let menuStructure = null;
            let buttonContentNodes = [];

            if (isDropdown) {
                const dropdownMenu = el.querySelector(".dropdown-menu");
                if (dropdownMenu) {
                    const allElements = Array.from(dropdownMenu.querySelectorAll(
                        ".dropdown-header, .dropdown-item, .dropdown-divider"
                    ));
                    menuStructure = allElements.map(node => {
                        if (node.classList.contains("dropdown-header")) {
                            return { type: "header", content: node.textContent.trim(), element: node };
                        } else if (node.classList.contains("dropdown-item")) {
                            return { type: "item", content: node.textContent.trim(), element: node };
                        } else if (node.classList.contains("dropdown-divider")) {
                            return { type: "divider", content: null, element: node };
                        }
                    });
                }
                const dropdownButton = el.querySelector("button");
                if (dropdownButton) {
                    buttonContentNodes = Array.from(dropdownButton.childNodes).map(n => n.cloneNode(true));
                }
            }

            const item = {
                id: "oi-" + (this._idSeq++),
                index: i,
                element: el,
                never: isNever,
                force: isForce,
                submenu: menuStructure,
                submenuLabel: buttonContentNodes,
                submenuInstances: [],
                inOverflowAsTrigger: false,
                proxyElement: null,
                placeholder: null
            };
            this._items.push(item);
        });

        this._items.sort((a, b) => a.index - b.index);
    }

    /**
     * Builds overflow trigger and menu.
     */
    _buildOverflowDropdown() {
        this._moreWrapper = document.createElement("div");
        this._moreWrapper.className = "wx-overflow-more";
        this._moreWrapper.style.display = "none";

        this._moreButton = document.createElement("button");
        this._moreButton.type = "button";
        this._moreButton.className = "btn";
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

        this._moreButton.addEventListener("click", () => {
            const expanded = this._moreButton.getAttribute("aria-expanded") === "true";
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
                    this._showMenu(() => this._focusFirstMenuItem());
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
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                this._focusNextMenuItem(1);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                this._focusNextMenuItem(-1);
            } else if (e.key === "Home") {
                e.preventDefault();
                this._focusFirstMenuItem();
            } else if (e.key === "End") {
                e.preventDefault();
                this._focusLastMenuItem();
            } else if (e.key === "ArrowRight") {
                const active = document.activeElement;
                if (active && active.classList.contains("btn") && active.dataset.itemId) {
                    e.preventDefault();
                    this._openSubmenuForTrigger(active);
                }
            } else if (e.key === "ArrowLeft") {
                if (this._closeTopSubmenu()) {
                    e.preventDefault();
                }
            }
        });

        this._moreWrapper.appendChild(this._moreButton);
        this._moreWrapper.appendChild(this._menu);
        this._initializePopper(this._moreButton, this._menu);
    }

    /**
     * Sets up global listeners for outside click and escape.
     */
    _setupGlobalListeners() {
        document.addEventListener("click", (e) => {
            if (!this._element.contains(e.target)) {
                this._closeAllSubmenus();
                this._hideMenu(true);
                return;
            }
            const inMainMenu = this._menu.contains(e.target);
            const inSubmenuPanel = !!this._element.querySelector(".wx-overflow-subpanel") &&
                Array.from(this._element.querySelectorAll(".wx-overflow-subpanel")).some(p => p.contains(e.target));
            const isMoreButton = this._moreButton.contains(e.target);
            if (!inMainMenu && !inSubmenuPanel && !isMoreButton) {
                this._closeAllSubmenus();
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this._closeAllSubmenus();
                this._hideMenu(true);
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
    _hideMenu(suppressFocus = false) {
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
        const list = this._collectMenuFocusable();
        if (list.length > 0) {
            list[0].focus();
        }
    }

    /**
     * Focuses last focusable item in overflow menu.
     */
    _focusLastMenuItem() {
        const list = this._collectMenuFocusable();
        if (list.length > 0) {
            list[list.length - 1].focus();
        }
    }

    /**
     * Moves focus among menu items.
     * @param {number} dir direction (1 or -1)
     */
    _focusNextMenuItem(dir) {
        const list = this._collectMenuFocusable();
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
     * Collects focusable nodes inside the overflow menu.
     * @returns {HTMLElement[]} focusable list
     */
    _collectMenuFocusable() {
        const selectors = [
            ".wx-overflow-menu-item > button:not([disabled])",
            ".wx-overflow-menu-item > a",
            ".wx-overflow-submenu .btn"
        ].join(",");
        return Array.from(this._menu.querySelectorAll(selectors)).filter(el => el.offsetParent !== null);
    }

    /**
     * Inserts initial items (force go directly to overflow).
     */
    _initialInsert() {
        for (let item of this._items) {
            if (item.force) {
                this._representInOverflow(item);
            } else {
                this._visibleContainer.appendChild(item.element);
            }
        }
        if (this._items.some(i => i.force)) {
            this._moreWrapper.style.display = "inline-flex";
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
        if (this._items.some(i => i.force)) {
            this._moreWrapper.style.display = "inline-flex";
        }
        this._shrinkUntilFit();
        this._growIfSpace();
        const hasOverflowItems = this._items.some(i => this._isRepresentedInOverflow(i));
        if (!hasOverflowItems) {
            this._moreWrapper.style.display = "none";
            this._hideMenu(true);
        } else {
            this._moreWrapper.style.display = "inline-flex";
        }
    }

    /**
     * Restores baseline by placing all non-represented originals into the visible container.
     */
    _restoreVisibleBaseline() {
        this._visibleContainer.innerHTML = "";
        for (let item of this._items) {
            if (item.force) {
                continue;
            }
            if (!this._isRepresentedInOverflow(item)) {
                this._visibleContainer.appendChild(item.element);
            }
        }
    }

    /**
     * Moves items to overflow until everything fits.
     */
    _shrinkUntilFit() {
        let guard = 1000;
        let moved = false;
        while (this._needsOverflow() && guard > 0) {
            guard--;
            const candidate = this._findLastMovableVisibleItem();
            if (!candidate) {
                break;
            }
            if (candidate.element.parentElement === this._visibleContainer) {
                
                if (!candidate.placeholder) {
                    candidate.placeholder = document.createComment("overflow-placeholder-" + candidate.id);
                }
                this._visibleContainer.insertBefore(candidate.placeholder, candidate.element.nextSibling);
                this._visibleContainer.removeChild(candidate.element);
            }
            this._representInOverflow(candidate);
            moved = true;
            if (this._cutoffEnabled && this._firstOverflowIndex === null) {
                this._firstOverflowIndex = candidate.index;
            }
        }
        if (moved && this._cutoffEnabled) {
            this._moveAllTrailingAfterFirstOverflow();
        }
    }

    /**
     * If cutoff is enabled, move all trailing items.
     */
    _moveAllTrailingAfterFirstOverflow() {
        if (!this._cutoffEnabled || this._firstOverflowIndex === null) {
            return;
        }
        for (let item of this._items) {
            if (item.index > this._firstOverflowIndex && !item.force && !this._isRepresentedInOverflow(item)) {
                if (item.element.parentElement === this._visibleContainer) {
                   if (!item.placeholder) {
                        item.placeholder = document.createComment("overflow-placeholder-" + item.id);
                        this._visibleContainer.insertBefore(item.placeholder, item.element.nextSibling);
                    }
                    this._visibleContainer.removeChild(item.element);
                }
                this._representInOverflow(item);
            }
        }
    }

    /**
     * Attempts to bring items back when space is available (disabled if cutoff enabled and first overflow occurred).
     */
    _growIfSpace() {
        if (this._cutoffEnabled && this._firstOverflowIndex !== null) {
            return;
        }
        const overflowed = this._items
            .filter(i => this._isRepresentedInOverflow(i) && !i.force)
            .sort((a, b) => a.index - b.index);
        for (let item of overflowed) {
            this._removeOverflowRepresentation(item);
            this._insertVisibleOrdered(item);
            if (this._needsOverflow()) {
                if (item.element.parentElement === this._visibleContainer) {
                    this._visibleContainer.removeChild(item.element);
                }
                this._representInOverflow(item);
                break;
            } else {
                if (item.placeholder) {
                    if (item.placeholder.parentNode) {
                        item.placeholder.parentNode.removeChild(item.placeholder);
                    }
                    item.placeholder = null;
                }
            }
        }
        if (!this._items.some(i => this._isRepresentedInOverflow(i))) {
            this._firstOverflowIndex = null;
        }
    }

    /**
     * Inserts item into visible container preserving original ordering.
     * @param {object} item descriptor
     */
    _insertVisibleOrdered(item) {
        const children = Array.from(this._visibleContainer.children);
        let inserted = false;
        for (let child of children) {
            const ref = this._items.find(it => it.element === child);
            if (ref && ref.index > item.index) {
                this._visibleContainer.insertBefore(item.element, child);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            this._visibleContainer.appendChild(item.element);
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
        for (let node of list) {
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
            const wrapper = document.createElement("div");
            wrapper.className = "wx-overflow-menu-item";
            wrapper.setAttribute("role", "none");

            const triggerRow = document.createElement("div");
            triggerRow.className = "wx-overflow-submenu";

            const label = document.createElement("span");
            label.className = "wx-link";
            if (item.submenuLabel && item.submenuLabel.length > 0) {
                item.submenuLabel.forEach(n => label.appendChild(n.cloneNode(true)));
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
                    this._openSubmenu(item, button, () => this._focusFirstInSubmenu(item));
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
            const wrapper = document.createElement("div");
            wrapper.className = "wx-overflow-menu-item";
            wrapper.setAttribute("role", "none");

            wrapper.appendChild(item.element);
            this._insertOverflowOrdered(wrapper, item.index);
        }
        this._moreWrapper.style.display = "inline-flex";
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
        for (let n of nodes) {
            const trig = n.querySelector(".btn[data-item-id]");
            if (trig && trig.dataset.itemId === item.id) {
                return n;
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
            if (item.element.parentElement === this._visibleContainer) {
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

        if (!this._moreWrapper) {
            return false;
        }
        if (this._moreWrapper.style.display === "none") {
            this._moreWrapper.style.visibility = "hidden";
            this._moreWrapper.style.display = "inline-flex";
            tempShown = true;
        }

        const moreWidth = this._moreWrapper.getBoundingClientRect().width;
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

        if (tempShown && !need && !this._items.some(i => this._isRepresentedInOverflow(i)) && !this._items.some(i => i.force)) {
            this._moreWrapper.style.display = "none";
            this._moreWrapper.style.visibility = "";
        } else if (tempShown) {
            this._moreWrapper.style.visibility = "";
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
            if (item.element && item.element.parentElement === this._visibleContainer) {
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
        const debounce = (fn, delay) => {
            let t = null;
            return (...args) => {
                if (t) {
                    clearTimeout(t);
                }
                t = setTimeout(() => fn(...args), delay);
            };
        };
        const onResize = debounce(() => {
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