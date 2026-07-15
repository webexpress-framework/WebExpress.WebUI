/**
 * User interface control for the quick filter system.
 * Displays active filters as removable tags and renders the authored filter
 * items - one-click buttons, avatar toggles, single-choice dropdowns and
 * multi-select dropdowns - rebuilding them from the filter registry whenever the
 * active filter set changes. Dropdown options may also be loaded from a remote
 * endpoint through the _fetchOptions hook, which a subclass overrides.
 */
webexpress.webui.QuickFilterCtrl = class extends webexpress.webui.Ctrl {

    // the chip classes a rebuilt item carries, so every item matches the look of
    // a one-click button chip (the button controller adds the same pair)
    static CHIP_CLASS = "wx-quickfilter-btn-chip btn wx-button";

    /**
     * Initializes the quick filter control element.
     * @param {HTMLElement} element - the root element.
     */
    constructor(element) {
        super(element);
        element.classList.add("wx-quickfilter");

        // ensure registry is loaded and available
        this._registry = webexpress.webui.FilterRegistry || null;
        if (!this._registry) {
            throw new Error("QuickFilterCtrl: filterRegistry singleton not found!");
        }

        // the id of the dropdown whose menu is open, preserved across re-renders
        // so a multi-select keeps its menu open while several values are picked
        this._openMenuId = null;

        // capture the authored items in document order so a mixed bar renders
        // exactly as authored; the buttons are also kept in _staticButtonConfigs,
        // because the REST subclass only knows buttons and replaces that list
        this._staticButtonConfigs = [];
        this._items = [];
        for (const child of Array.from(element.children)) {
            const classes = child.classList;
            if (!classes) {
                continue;
            }
            if (classes.contains("wx-quickfilter-button")) {
                const config = this._captureButtonConfig(child);
                this._staticButtonConfigs.push(config);
                this._items.push({ kind: "button", config: config });
            } else if (classes.contains("wx-quickfilter-avatar")) {
                this._items.push({ kind: "avatar", template: child.cloneNode(true) });
            } else if (classes.contains("wx-quickfilter-multiselect")) {
                this._items.push({ kind: "multiselect", template: child.cloneNode(true) });
            } else if (classes.contains("wx-quickfilter-dropdown")) {
                this._items.push({ kind: "dropdown", template: child.cloneNode(true) });
            }
        }

        this._bindEvents();

        // only render if filters known; otherwise show nothing
        if (typeof this._registry.getActiveFilters === "function") {
            this.render();
        }
    }

    /**
     * Captures the configuration of a static one-click filter button, including
     * its primary and secondary action attributes, so the button can be rebuilt
     * on each render.
     * @param {HTMLElement} btn - the authored button element.
     * @returns {Object} the captured button configuration.
     */
    _captureButtonConfig(btn) {
        return {
            id: btn.id,
            label: btn.textContent,
            icon: btn.dataset.icon,
            color: btn.dataset.color,
            colorValue: btn.dataset.colorValue || null,
            action: btn.dataset.wxPrimaryAction,
            class: btn.className,
            size: btn.dataset.size || null,
            image: btn.dataset.image || null,
            badge: btn.dataset.badge || null,
            badgeColor: btn.dataset.badgeColor || null,
            badgeStyle: btn.dataset.badgeStyle || null,
            primaryAction: Object.fromEntries(Object.entries(btn.dataset)
                .filter(([k]) => k.startsWith("wxPrimary"))
                .map(([k, v]) => [k.slice(9).replace(/^./, (c) => c.toLowerCase()), v === "true" ? true : v === "false" ? false : v])),
            secondaryAction: Object.fromEntries(Object.entries(btn.dataset)
                .filter(([k]) => k.startsWith("wxSecondary"))
                .map(([k, v]) => [k.slice(11).replace(/^./, (c) => c.toLowerCase()), v === "true" ? true : v === "false" ? false : v]))
        };
    }

    /**
     * Attaches global event listeners to respond to state changes in the filter
     * registry and to close any open dropdown menu on an outside click.
     */
    _bindEvents() {
        document.addEventListener(webexpress.webui.Event.CHANGE_FILTER_EVENT, () => {
            this.render();
        });
        document.addEventListener("click", () => {
            this._openMenuId = null;
            this._element.querySelectorAll(".wx-quickfilter-dropdown-menu.show")
                .forEach((menu) => menu.classList.remove("show"));
        });
    }

    /**
     * Renders the control showing the authored items and chips for the remaining
     * active filters.
     */
    render() {
        const el = this._element;
        el.innerHTML = "";

        // do not render if registry is not available
        if (!this._registry || typeof this._registry.getActiveFilters !== "function") {
            return;
        }

        const activeIds = this._registry.getActiveFilters();
        const container = document.createElement("div");

        const itemFilterIds = this._renderItems(activeIds, container);

        // render chips for active filters not represented by an item
        for (let i = 0; i < activeIds.length; i++) {
            const filterId = activeIds[i];
            if (!itemFilterIds.includes(filterId)) {
                const config = this._registry.getFilterConfig(filterId);
                if (config) {
                    container.appendChild(this._createFilterChip(config));
                }
            }
        }

        el.appendChild(container);
    }

    /**
     * Renders the authored items into the container and returns the filter ids
     * they represent, so callers can skip them when rendering loose chips.
     * @param {Array} activeIds - the currently active filter ids.
     * @param {HTMLElement} container - the container receiving the items.
     * @returns {Array} the represented filter ids.
     */
    _renderItems(activeIds, container) {
        const itemFilterIds = [];
        for (const item of this._items) {
            if (item.kind === "button") {
                const id = this._renderButtonChip(item.config, activeIds, container);
                if (id) {
                    itemFilterIds.push(id);
                }
            } else if (item.kind === "avatar") {
                itemFilterIds.push(...this._renderAvatar(item.template, activeIds, container));
            } else if (item.kind === "dropdown" || item.kind === "multiselect") {
                itemFilterIds.push(...this._renderDropdown(item.template, activeIds, container, item.kind === "multiselect"));
            }
        }
        return itemFilterIds;
    }

    /**
     * Rebuilds a single one-click filter button as a chip and returns its filter
     * id. A reset button is shown active while its group is empty.
     * @param {Object} btnCfg - the captured button configuration.
     * @param {Array} activeIds - the currently active filter ids.
     * @param {HTMLElement} container - the container receiving the chip.
     * @returns {string|null} the button's filter id.
     */
    _renderButtonChip(btnCfg, activeIds, container) {
        const btnElem = document.createElement("button");
        btnElem.id = btnCfg.id;
        btnElem.className = "wx-quickfilter-btn-chip";
        btnElem.textContent = btnCfg.label;

        // copy primary and secondary action attributes from config to the button
        for (const [k, v] of Object.entries(btnCfg.primaryAction)) {
            if (v !== null && v !== undefined) {
                btnElem.dataset["wxPrimary" + k.charAt(0).toUpperCase() + k.slice(1)] = v;
            }
        }
        for (const [k, v] of Object.entries(btnCfg.secondaryAction)) {
            if (v !== null && v !== undefined) {
                btnElem.dataset["wxSecondary" + k.charAt(0).toUpperCase() + k.slice(1)] = v;
            }
        }

        // map icon, color, size, image as required
        if (btnCfg.icon) {
            btnElem.dataset.icon = btnCfg.icon;
        }
        if (btnCfg.color) {
            btnElem.dataset.color = btnCfg.color;
        }
        if (btnCfg.size) {
            btnElem.dataset.size = btnCfg.size;
        }
        if (btnCfg.image) {
            btnElem.dataset.image = btnCfg.image;
        }

        // check active state and fallback to button config if registry is incomplete
        const filterId = btnCfg.id || btnCfg.primaryAction.target;
        let isActive = activeIds.includes(filterId);
        const filterConfig = this._registry.getFilterConfig(filterId);

        // evaluate reset status considering both registry and button configuration
        const isReset = (filterConfig && filterConfig.reset) || btnCfg.primaryAction.reset;
        const groupName = (filterConfig && filterConfig.group) || btnCfg.primaryAction.group;

        // if it is a reset filter, check if the group is completely empty
        if (isReset && groupName) {
            let groupHasActive = false;
            for (let j = 0; j < activeIds.length; j++) {
                const activeConfig = this._registry.getFilterConfig(activeIds[j]);
                if (activeConfig && activeConfig.group === groupName) {
                    groupHasActive = true;
                    break;
                }
            }
            if (!groupHasActive) {
                isActive = true;
            }
        }

        if (isActive) {
            btnElem.classList.add("active");
            btnElem.setAttribute("aria-pressed", "true");
        }

        // instantiate buttonctrl for consistent webexpress behaviour
        webexpress.webui.Controller.createInstanceByClassType("wx-webui-button", btnElem);

        // a user-defined color feeds the chip accent directly; a system color
        // arrived as a btn-<color> class through data-color and swaps the
        // accent in css
        if (btnCfg.colorValue) {
            btnElem.style.setProperty("--wx-quickfilter-accent", btnCfg.colorValue);
        }

        // appended after the button controller ran, because it rebuilds the
        // chip content and would drop an earlier badge
        this._appendBadge(btnElem, btnCfg.badge, btnCfg.badgeColor, btnCfg.badgeStyle);
        container.appendChild(btnElem);

        return filterId;
    }

    /**
     * Builds the small trailing badge of a chip or option, showing a count or
     * similar short fact next to the label. The color class targets a framework
     * badge color, the style carries a bespoke background.
     * @param {string} badge - the badge text.
     * @param {string|null} [colorCss] - the badge color css class(es).
     * @param {string|null} [colorStyle] - the inline badge style.
     * @returns {HTMLElement} the badge element.
     */
    _createBadge(badge, colorCss, colorStyle) {
        const span = document.createElement("span");
        span.className = "wx-quickfilter-badge";
        if (colorCss) {
            span.classList.add(...String(colorCss).split(/\s+/).filter(Boolean));
        }
        if (colorStyle) {
            span.style.cssText = colorStyle;
        }
        span.textContent = badge;
        return span;
    }

    /**
     * Appends the badge to a chip or option element. Nothing is appended when
     * no badge text is given, so an item without a count stays unchanged.
     * @param {HTMLElement} element - the chip or option element.
     * @param {string|null} badge - the badge text.
     * @param {string|null} [colorCss] - the badge color css class(es).
     * @param {string|null} [colorStyle] - the inline badge style.
     */
    _appendBadge(element, badge, colorCss, colorStyle) {
        if (!badge) {
            return;
        }
        element.appendChild(this._createBadge(badge, colorCss, colorStyle));
    }

    /**
     * Rebuilds an avatar filter toggle from its captured template, drawing the
     * image when one is supplied, otherwise the icon, otherwise the initials on
     * the person's color. The cloned element keeps its data-wx action attributes,
     * so the click is wired to the filter exactly like a button chip.
     * @param {HTMLElement} template - the authored avatar element (cloned).
     * @param {Array} activeIds - the currently active filter ids.
     * @param {HTMLElement} container - the container receiving the avatar.
     * @returns {Array} the avatar's filter id, in an array.
     */
    _renderAvatar(template, activeIds, container) {
        const el = template.cloneNode(true);
        const id = el.id;
        this._registerFromElement(el);

        el.className = "wx-quickfilter-avatar " + webexpress.webui.QuickFilterCtrl.CHIP_CLASS;
        // drop the name text used for registration; the visual replaces it
        el.replaceChildren();

        const bubble = document.createElement("span");
        bubble.className = "wx-quickfilter-avatar-bubble";
        if (el.dataset.image) {
            const img = document.createElement("img");
            img.src = el.dataset.image;
            img.alt = el.dataset.name || "";
            bubble.appendChild(img);
        } else if (el.dataset.icon) {
            bubble.appendChild(webexpress.webui.Icon.create(el.dataset.icon));
            if (el.dataset.color) {
                bubble.style.background = el.dataset.color;
            }
        } else {
            bubble.textContent = el.dataset.initials || (el.dataset.name || "?").slice(0, 2).toUpperCase();
            if (el.dataset.color) {
                bubble.style.background = el.dataset.color;
            }
        }
        el.appendChild(bubble);

        if (el.dataset.name) {
            const name = document.createElement("span");
            name.className = "wx-quickfilter-avatar-name";
            name.textContent = el.dataset.name;
            el.appendChild(name);
            el.title = el.dataset.name;
        }

        if (id && activeIds.includes(id)) {
            el.classList.add("active");
            el.setAttribute("aria-pressed", "true");
        }

        container.appendChild(el);

        return id ? [id] : [];
    }

    /**
     * Rebuilds an option dropdown from its captured template. A single-choice
     * dropdown shows the active option's label and closes on select; a
     * multi-select keeps its menu open and shows the number of active options.
     * Options come from the static children and from any remotely loaded options.
     * @param {HTMLElement} template - the authored dropdown element (cloned).
     * @param {Array} activeIds - the currently active filter ids.
     * @param {HTMLElement} container - the container receiving the dropdown.
     * @param {boolean} multi - whether multiple options may be active at once.
     * @returns {Array} the option filter ids.
     */
    _renderDropdown(template, activeIds, container, multi) {
        const menuId = template.id || "";
        const restUri = template.dataset.restUri;

        const wrap = document.createElement("div");
        wrap.className = (multi ? "wx-quickfilter-multiselect" : "wx-quickfilter-dropdown") + " dropdown";

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = webexpress.webui.QuickFilterCtrl.CHIP_CLASS + " wx-quickfilter-dropdown-toggle";
        if (template.dataset.icon) {
            toggle.appendChild(webexpress.webui.Icon.create(template.dataset.icon));
        }
        const label = document.createElement("span");
        toggle.appendChild(label);
        const caret = webexpress.webui.Icon.create("fas fa-caret-down", "wx-quickfilter-dropdown-caret");
        toggle.appendChild(caret);

        const menu = document.createElement("div");
        menu.className = "wx-quickfilter-dropdown-menu dropdown-menu";
        menu.dataset.menuId = menuId;

        // a REST dropdown gets a search box so huge option sets can be queried on
        // the server instead of loaded in full; typing re-queries and rebuilds the
        // option list in place, keeping the menu open and the box focused
        if (restUri) {
            const searchWrap = document.createElement("div");
            searchWrap.className = "wx-quickfilter-dropdown-search";
            const search = document.createElement("input");
            search.type = "search";
            search.className = "form-control form-control-sm";
            search.placeholder = this._i18n("webexpress.webui:search", "Search");
            search.value = template._searchQuery || "";
            search.addEventListener("click", (e) => e.stopPropagation());
            search.addEventListener("keydown", (e) => e.stopPropagation());
            search.addEventListener("input", () => {
                template._searchQuery = search.value;
                clearTimeout(template._searchTimer);
                template._searchTimer = setTimeout(() => {
                    this._fetchOptions(restUri, template._searchQuery).then((options) => {
                        template._remoteOptions = Array.isArray(options) ? options : [];
                        populate();
                    });
                }, 300);
            });
            searchWrap.appendChild(search);
            menu.appendChild(searchWrap);
        }

        const list = document.createElement("div");
        list.className = "wx-quickfilter-dropdown-list";
        menu.appendChild(list);

        // rebuilds the option list and the toggle from the current options and the
        // live active set; runs on first render and on each search result
        const populate = () => {
            const liveActive = this._registry.getActiveFilters();
            const options = this._dropdownOptions(template);
            list.replaceChildren();

            let activeCount = 0;
            let activeLabel = null;

            for (const option of options) {
                this._registry.registerFilters([option]);

                const isActive = option.id && liveActive.includes(option.id);
                if (isActive) {
                    activeCount++;
                    activeLabel = option.name;
                }

                const item = document.createElement("button");
                item.type = "button";
                // a multi-select shows its selection through the colored checkbox,
                // not a highlighted row, so it carries no active class
                item.className = "dropdown-item" + (!multi && isActive ? " active" : "");

                if (multi) {
                    const check = webexpress.webui.Icon.create(isActive ? "fas fa-check-square" : "far fa-square", "wx-quickfilter-multiselect-check");
                    if (check) {
                        if (isActive) {
                            check.classList.add("wx-checked");
                        }
                        item.appendChild(check);
                    }
                } else if (option.icon) {
                    item.appendChild(webexpress.webui.Icon.create(option.icon));
                }
                item.appendChild(document.createTextNode(" " + (option.name || "")));
                this._appendBadge(item, option.badge, option.badgeColor, option.badgeStyle);

                item.addEventListener("click", (e) => {
                    e.stopPropagation();
                    // keep a multi-select open across the re-render, close a single one
                    this._openMenuId = multi ? menuId : null;
                    if (!multi) {
                        menu.classList.remove("show");
                    }
                    this._registry.toggle(option.id);
                });
                list.appendChild(item);
            }

            const baseText = template.dataset.text || "";
            label.textContent = multi
                ? (template.dataset.icon ? " " : "") + baseText
                : (template.dataset.icon ? " " : "") + (activeLabel || baseText);

            // the multi-select shows its selection count as a badge between the
            // label and the caret; populate re-runs on each search result, so a
            // stale badge is dropped before the fresh count is applied
            const staleBadge = toggle.querySelector(".wx-quickfilter-badge");
            if (staleBadge) {
                staleBadge.remove();
            }
            if (multi && activeCount > 0) {
                toggle.insertBefore(this._createBadge(String(activeCount)), caret);
            }

            toggle.classList.toggle("active", activeCount > 0);
            if (activeCount > 0) {
                toggle.setAttribute("aria-pressed", "true");
            } else {
                toggle.removeAttribute("aria-pressed");
            }
        };

        // load the remote options once; the following full re-render then includes
        // their ids so the active ones are not also shown as loose chips
        if (restUri && !template._optionsLoaded) {
            template._optionsLoaded = true;
            this._fetchOptions(restUri, template._searchQuery || "").then((options) => {
                template._remoteOptions = Array.isArray(options) ? options : [];
                this.render();
            });
        }

        populate();

        toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const willOpen = !menu.classList.contains("show");
            this._element.querySelectorAll(".wx-quickfilter-dropdown-menu.show")
                .forEach((m) => m.classList.remove("show"));
            menu.classList.toggle("show", willOpen);
            this._openMenuId = willOpen ? menuId : null;
            if (willOpen) {
                const input = menu.querySelector(".wx-quickfilter-dropdown-search input");
                if (input) {
                    setTimeout(() => input.focus(), 0);
                }
            }
        });

        // re-open the menu that was open before the re-render
        if (menuId && this._openMenuId === menuId) {
            menu.classList.add("show");
        }

        wrap.appendChild(toggle);
        wrap.appendChild(menu);
        container.appendChild(wrap);

        return this._dropdownOptions(template).map((o) => o.id).filter(Boolean);
    }

    /**
     * Collects the option descriptors of a dropdown from its static children and
     * its remotely loaded options, normalised to the registry's filter shape.
     * @param {HTMLElement} template - the dropdown element.
     * @returns {Array} the option descriptors.
     */
    _dropdownOptions(template) {
        const fromStatic = Array.from(template.querySelectorAll(".wx-quickfilter-dropdown-option")).map((opt) => ({
            id: opt.id,
            name: opt.dataset.text || opt.textContent || opt.id,
            icon: opt.dataset.icon || opt.dataset.image || null,
            badge: opt.dataset.badge || null,
            badgeColor: opt.dataset.badgeColor || null,
            badgeStyle: opt.dataset.badgeStyle || null,
            group: opt.dataset.wxPrimaryGroup || null,
            exclusive: opt.dataset.wxPrimaryExclusive === "true",
            reset: opt.dataset.wxPrimaryReset === "true"
        }));

        // remote options share the dropdown's group (its data-group, or its id as
        // a fallback) so a single-choice REST dropdown is exclusive within it,
        // while a multi-select stays non-exclusive
        const multi = template.classList.contains("wx-quickfilter-multiselect");
        const group = template.dataset.group || template.id || null;
        const fromRemote = (template._remoteOptions || []).map((o) => ({
            id: o.id,
            name: o.name || o.id,
            icon: o.icon || null,
            badge: o.badge != null ? String(o.badge) : null,
            badgeColor: o.badgeColor || null,
            badgeStyle: o.badgeStyle || null,
            group: o.group || group,
            exclusive: o.exclusive === true || !multi,
            reset: o.reset === true
        }));

        return fromStatic.concat(fromRemote);
    }

    /**
     * Loads the dropdown options from a remote endpoint, optionally narrowed by a
     * search query. The base control has no data service and returns nothing; a
     * REST-enabled subclass overrides this to fetch through the service layer.
     * @param {string} uri - the endpoint uri.
     * @param {string} [query] - the search query for large option sets.
     * @returns {Promise<Array>} the loaded option descriptors.
     */
    _fetchOptions(uri, query) {
        return Promise.resolve([]);
    }

    /**
     * Registers the filter a quick-filter element represents in the global
     * registry, so it is known regardless of when the element is added.
     * @param {HTMLElement} el - the filter-trigger element.
     */
    _registerFromElement(el) {
        if (!el || !el.id) {
            return;
        }
        this._registry.registerFilters([{
            id: el.id,
            name: (el.dataset.name || el.dataset.text || el.textContent || el.id).trim(),
            group: el.dataset.wxPrimaryGroup || null,
            exclusive: el.dataset.wxPrimaryExclusive === "true",
            reset: el.dataset.wxPrimaryReset === "true"
        }]);
    }

    /**
     * Creates a single visual chip for an active filter.
     * @param {Object} config - the filter configuration.
     * @returns {HTMLElement} - the constructed chip element.
     */
    _createFilterChip(config) {
        const chip = document.createElement("div");
        // rely on css for padding and exact sizes instead of inline styles
        chip.className = "wx-quickfilter-btn-chip btn wx-button active";

        const label = document.createElement("span");
        label.textContent = config.name;

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn-close btn-close-white";
        removeBtn.setAttribute("aria-label", this._i18n("webexpress.webui:remove", "Remove"));

        // directly invoke the action mechanism via action attribute conventions
        removeBtn.dataset.wxPrimaryAction = "deactivate_quickfilter";
        removeBtn.dataset.wxPrimaryTarget = config.id;

        removeBtn.addEventListener("click", () => {
            this._registry.deactivate(config.id);
        });

        chip.appendChild(label);
        chip.appendChild(removeBtn);

        return chip;
    }
};

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-quickfilter", webexpress.webui.QuickFilterCtrl);
