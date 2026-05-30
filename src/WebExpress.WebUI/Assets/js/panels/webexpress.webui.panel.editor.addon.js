/**
 * Registers the addon page.
 */
webexpress.webui.DialogPanels.register("editor-addon", {
    id: "editor-addon-page",
    parentId: null,
    title: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.title"),
    iconClass: "fas fa-puzzle-piece",

    /**
     * Renders the unified page ui for add-on selection.
     * @param {HTMLElement} container - Host container for the page.
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     */
    render: function (container, modal) {
        if (!modal._addonState) {
            modal._addonState = {
                selectedId: null,
                addons: [],
                tiles: [],
                currentCat: "all",
                submitHandler: null
            };
        }
        const state = modal._addonState;
        state.addons = webexpress.webui.EditorAddOns.getAll() || [];

        const root = document.createElement("div");
        root.className = "wx-addon-library";

        // left side-pane: category list
        const cats = document.createElement("div");
        cats.className = "wx-addon-cats";
        root.appendChild(cats);

        // right pane: search + tile grid
        const main = document.createElement("div");
        main.className = "wx-addon-main";

        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "form-control wx-addon-search";
        searchInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.addon.search.placeholder");
        main.appendChild(searchInput);

        const grid = document.createElement("div");
        grid.className = "wx-addon-grid";
        main.appendChild(grid);

        root.appendChild(main);
        container.appendChild(root);

        state.searchInput = searchInput;
        state.catsHost = cats;
        state.grid = grid;

        // helper to enable/disable the modal submit button
        const setSubmitEnabled = (enabled) => {
            const modalRoot = container.closest(".modal") || container.closest(".modal-content") || document;
            const submitBtn = modalRoot.querySelector(".submit-btn");
            if (submitBtn) {
                submitBtn.disabled = !enabled;
            }
        };
        state.setSubmitEnabled = setSubmitEnabled;

        // build category list ("All" + sorted unique categories)
        const categories = Array.from(new Set(state.addons.map((a) => a.category || "General"))).sort();
        const allItem = this._createCatItem(webexpress.webui.I18N.translate("webexpress.webui:editor.addon.all.categories"), "all");
        allItem.classList.add("active");
        cats.appendChild(allItem);
        categories.forEach((cat) => {
            cats.appendChild(this._createCatItem(cat, cat));
        });

        // build tiles
        state.tiles = state.addons.map((addon) => {
            const tile = document.createElement("button");
            tile.type = "button";
            tile.className = "wx-addon-tile";
            tile.dataset.id = addon.id;

            const icon = document.createElement("i");
            icon.className = webexpress.webui.IconTheme.resolveFa(addon.icon || "fas fa-puzzle-piece") + " wx-addon-tile-icon";
            tile.appendChild(icon);

            const bodyEl = document.createElement("div");
            bodyEl.className = "wx-addon-tile-body";
            const label = document.createElement("div");
            label.className = "wx-addon-tile-label";
            label.textContent = addon.label || addon.id;
            bodyEl.appendChild(label);
            if (addon.description) {
                const desc = document.createElement("div");
                desc.className = "wx-addon-tile-desc";
                desc.textContent = addon.description;
                bodyEl.appendChild(desc);
            }
            tile.appendChild(bodyEl);

            tile.addEventListener("click", () => {
                state.selectedId = addon.id;
                grid.querySelectorAll(".wx-addon-tile.selected").forEach((t) => t.classList.remove("selected"));
                tile.classList.add("selected");
                setSubmitEnabled(true);
            });
            tile.addEventListener("dblclick", () => {
                state.selectedId = addon.id;
                const modalRoot = container.closest(".modal") || container.closest(".modal-content") || document;
                const submitBtn = modalRoot.querySelector(".submit-btn");
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            });

            grid.appendChild(tile);
            return { el: tile, addon: addon };
        });

        // filtering by category + search term
        const applyFilter = () => {
            const term = (searchInput.value || "").toLowerCase();
            const cat = state.currentCat;
            state.tiles.forEach(({ el, addon }) => {
                const addonCat = addon.category || "General";
                const isCatMatch = cat === "all" || addonCat === cat;
                const text = ((addon.label || "") + " " + (addon.description || "")).toLowerCase();
                const isTextMatch = !term || text.indexOf(term) !== -1;
                el.classList.toggle("d-none", !(isCatMatch && isTextMatch));
            });
        };
        state.applyFilter = applyFilter;

        searchInput.addEventListener("input", applyFilter);

        // category selection (event delegation on the list)
        cats.addEventListener("click", (e) => {
            const item = e.target.closest(".wx-addon-cat-item");
            if (!item) {
                return;
            }
            cats.querySelectorAll(".wx-addon-cat-item.active").forEach((c) => c.classList.remove("active"));
            item.classList.add("active");
            state.currentCat = item.dataset.cat || "all";
            applyFilter();
        });

        applyFilter();
    },

    /**
     * Creates a single category list entry for the side-pane.
     * @param {string} label - Display label.
     * @param {string} value - Category value ("all" or category name).
     * @returns {HTMLElement}
     */
    _createCatItem: function (label, value) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "wx-addon-cat-item";
        item.dataset.cat = value;
        item.textContent = label;
        return item;
    },

    /**
     * Called when the page becomes active.
     * Resets inputs and selection states.
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     */
    onShow: function (modal) {
        if (!modal._addonState) {
            return;
        }

        const state = modal._addonState;

        state.selectedId = null;
        state.currentCat = "all";

        if (state.searchInput) {
            state.searchInput.value = "";
        }
        if (state.grid) {
            state.grid.querySelectorAll(".wx-addon-tile.selected").forEach((t) => t.classList.remove("selected"));
        }
        if (state.catsHost) {
            state.catsHost.querySelectorAll(".wx-addon-cat-item").forEach((c) => {
                c.classList.toggle("active", (c.dataset.cat || "all") === "all");
            });
        }
        if (typeof state.applyFilter === "function") {
            state.applyFilter();
        }
        if (typeof state.setSubmitEnabled === "function") {
            state.setSubmitEnabled(false);
        }

        // wire the submit button (avoid duplicate bindings)
        const host = state.grid || state.searchInput;
        if (host) {
            const modalRoot = host.closest(".modal") || host.closest(".modal-content") || document;
            const submitBtn = modalRoot.querySelector(".submit-btn");
            if (submitBtn) {
                submitBtn.disabled = true;
                if (!state.submitHandler) {
                    state.submitHandler = () => {
                        if (host.offsetParent === null) {
                            return;
                        }
                        const validationResult = this.validate(modal);
                        if (validationResult === true) {
                            this.onSubmit(modal);
                        } else if (validationResult && validationResult.message) {
                            alert(validationResult.message);
                        }
                    };
                }
                submitBtn.removeEventListener("click", state.submitHandler);
                submitBtn.addEventListener("click", state.submitHandler);
            }
        }
    },

    /**
     * Validates current page data.
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     * @returns {true|{valid:false,message:string}}
     */
    validate: function (modal) {
        const state = modal._addonState;
        if (!state || !state.selectedId) {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.error.select") };
        }

        const editor = modal ? modal._editor : null;
        if (!editor) {
            return { valid: false, message: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.error.internal") };
        }

        return true;
    },

    /**
     * Handles submit and delegates the final insertion or property opening to the plugin.
     * @param {webexpress.webui.ModalSidebarPanel} modal - Modal instance.
     */
    onSubmit: function (modal) {
        const state = modal._addonState;
        if (!state || !state.selectedId) {
            return;
        }

        const addon = state.addons.find((a) => {
            return a.id === state.selectedId;
        });
        if (!addon) {
            return;
        }

        // close the selection modal
        if (typeof modal.hide === "function") {
            modal.hide();
        } else if (modal.ctrl && typeof modal.ctrl.hide === "function") {
            modal.ctrl.hide();
        } else {
            const host = state.grid || state.searchInput;
            const modalWrapper = host ? host.closest(".modal") : null;
            if (modalWrapper && typeof bootstrap !== "undefined") {
                const bsModal = bootstrap.Modal.getInstance(modalWrapper);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        }

        // delegate follow-up actions to the plugin reference
        const editor = modal._editor;
        if (editor && editor._addonPlugin) {
            const plugin = editor._addonPlugin;

            // no explicit backup range handling here, editor restores selection by focus lifecycle
            plugin._activeAddonNode = null;

            if (addon.properties && addon.properties.length > 0) {
                plugin._openPropertyDialog(addon);
            } else {
                plugin._insertAddon(addon, {});
            }
        }
    }
});