/**
 * User interface control for the quick filter system.
 * Displays active filters as removable tags and provides an add button.
 */
webexpress.webui.QuickFilterCtrl = class extends webexpress.webui.Ctrl {

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

        // store static buttons on first construct
        this._staticButtonConfigs = Array.from(element.querySelectorAll(".wx-quickfilter-button"))
            .map((btn) => {
                return {
                    id: btn.id,
                    label: btn.textContent,
                    icon: btn.dataset.icon,
                    color: btn.dataset.color,
                    action: btn.dataset.wxPrimaryAction,
                    class: btn.className,
                    size: btn.dataset.size || null,
                    image: btn.dataset.image || null,
                    // action attributes
                    primaryAction: Object.fromEntries(Object.entries(btn.dataset)
                        .filter(([k]) => {
                            return k.startsWith("wxPrimary");
                        })
                        .map(([k, v]) => {
                            return [
                                k.slice(9).replace(/^./, (c) => { return c.toLowerCase(); }),
                                v === "true" ? true : v === "false" ? false : v
                            ];
                        })
                    ),
                    secondaryAction: Object.fromEntries(Object.entries(btn.dataset)
                        .filter(([k]) => {
                            return k.startsWith("wxSecondary");
                        })
                        .map(([k, v]) => {
                            return [
                                k.slice(9).replace(/^./, (c) => { return c.toLowerCase(); }),
                                v === "true" ? true : v === "false" ? false : v
                            ];
                        })
                    )
                };
            });

        this._bindEvents();

        // only render if filters known; otherwise show nothing
        if (typeof this._registry.getActiveFilters === "function") {
            this.render();
        }
    }

    /**
     * Attaches global event listeners to respond to state changes in the filter registry.
     */
    _bindEvents() {
        const eventName = webexpress.webui.Event.CHANGE_FILTER_EVENT;
        document.addEventListener(eventName, () => {
            this.render();
        });
    }

    /**
     * Renders the control showing active filter chips and the add button.
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

        // collect all filter ids represented by static buttons in this control
        const buttonFilterIds = this._staticButtonConfigs
            .map((cfg) => {
                return cfg.id || cfg.primaryAction.target;
            })
            .filter((id) => {
                return !!id;
            });

        // render static filter buttons first
        for (let i = 0; i < this._staticButtonConfigs.length; i++) {
            const btnCfg = this._staticButtonConfigs[i];
            const btnElem = document.createElement("button");
            btnElem.id = btnCfg.id;
            btnElem.className = "wx-quickfilter-btn-chip";
            btnElem.textContent = btnCfg.label;

            // copy primary and secondary action attributes from config to the button element
            for (const [k, v] of Object.entries(btnCfg.primaryAction)) {
                if (v !== null && v !== undefined) {
                    const attributeName = "wxPrimary" + k.charAt(0).toUpperCase() + k.slice(1);
                    btnElem.dataset[attributeName] = v;
                }
            }
            for (const [k, v] of Object.entries(btnCfg.secondaryAction)) {
                if (v !== null && v !== undefined) {
                    const attributeName = "wxSecondary" + k.charAt(0).toUpperCase() + k.slice(1);
                    btnElem.dataset[attributeName] = v;
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

            // mark the button as active if its filter is currently enabled or it acts as a reset for an empty group
            if (isActive) {
                btnElem.classList.add("active");
                btnElem.setAttribute("aria-pressed", "true");
            }

            // instantiate buttonctrl for consistent webexpress behaviour
            webexpress.webui.Controller.createInstanceByClassType("wx-webui-button", btnElem);
            container.appendChild(btnElem);
        }

        // render filter chips after all buttons
        for (let i = 0; i < activeIds.length; i++) {
            const filterId = activeIds[i];
            if (!buttonFilterIds.includes(filterId)) {
                const config = this._registry.getFilterConfig(filterId);
                if (config) {
                    const chip = this._createFilterChip(config);
                    container.appendChild(chip);
                }
            }
        }

        el.appendChild(container);
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