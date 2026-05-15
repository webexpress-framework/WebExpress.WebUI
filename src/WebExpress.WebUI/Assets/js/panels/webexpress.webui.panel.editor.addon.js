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
                tileCtrl: null,
                addons: [],
                submitHandler: null,
                changeHandler: null
            };
        }
        const state = modal._addonState;
        state.addons = webexpress.webui.EditorAddOns.getAll() || [];

        const wrapper = document.createElement("div");
        wrapper.className = "d-flex flex-column h-100 p-3";

        // build toolbar with search and category filter
        const toolbar = document.createElement("div");
        toolbar.className = "d-flex gap-2 mb-3";

        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "form-control wx-addon-search";
        searchInput.placeholder = webexpress.webui.I18N.translate("webexpress.webui:editor.addon.search.placeholder");

        const catSelect = document.createElement("select");
        catSelect.className = "form-select w-auto wx-addon-cat";

        // populate categories
        const categories = new Set();
        state.addons.forEach((a) => {
            categories.add(a.category || "General");
        });

        catSelect.innerHTML = `<option value="all">${webexpress.webui.I18N.translate("webexpress.webui:editor.addon.all.categories")}</option>`;
        Array.from(categories).sort().forEach((cat) => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            catSelect.appendChild(opt);
        });

        toolbar.appendChild(searchInput);
        toolbar.appendChild(catSelect);
        wrapper.appendChild(toolbar);

        // build tile container
        const tileHost = document.createElement("div");
        tileHost.className = "wx-addon-tile-list row g-2 overflow-auto";
        tileHost.dataset.multiselect = "false";
        wrapper.appendChild(tileHost);

        container.appendChild(wrapper);

        // store refs
        state.searchInput = searchInput;
        state.catSelect = catSelect;
        state.tileHost = tileHost;

        // initialize input tile controller
        if (typeof webexpress.webui.InputTileCtrl === "function") {
            state.tileCtrl = new webexpress.webui.InputTileCtrl(tileHost);

            state.tileCtrl.tiles = state.addons.map((addon) => {
                return {
                    id: addon.id,
                    label: addon.label,
                    icon: addon.icon,
                    html: `<div class="d-none search-text">${addon.label} ${addon.description || ""}</div><p class="small text-muted mb-0">${addon.description || ""}</p>`,
                    class: "col-md-6 mb-2 wx-addon-card-wrapper"
                };
            });
        }

        // define filtering logic
        const applyFilter = () => {
            const term = (searchInput.value || "").toLowerCase();
            const cat = catSelect.value;

            const inputs = tileHost.querySelectorAll('input[type="radio"]');
            inputs.forEach((input) => {
                const addonId = input.value;
                const addon = state.addons.find((a) => {
                    return a.id === addonId;
                });
                const col = input.closest(".wx-addon-card-wrapper");

                if (addon && col) {
                    const addonCat = addon.category || "General";
                    const isCatMatch = cat === "all" || addonCat === cat;
                    const textContent = ((addon.label || "") + " " + (addon.description || "")).toLowerCase();
                    const isTextMatch = !term || textContent.includes(term);

                    if (isCatMatch && isTextMatch) {
                        col.classList.remove("d-none");
                    } else {
                        col.classList.add("d-none");
                    }
                }
            });
        };

        searchInput.addEventListener("input", applyFilter);
        catSelect.addEventListener("change", applyFilter);

        // bind scoped change handler once and store reference for cleanup/reuse
        if (!state.changeHandler) {
            state.changeHandler = (e) => {
                if (!e || !e.detail) {
                    return;
                }
                if (e.detail.sender === tileHost || tileHost.contains(e.detail.sender)) {
                    state.selectedId = e.detail.value;
                    const modalRoot = container.closest(".modal") || container.closest(".modal-content") || document;
                    const submitBtn = modalRoot.querySelector(".submit-btn");
                    if (submitBtn) {
                        submitBtn.disabled = !state.selectedId;
                    }
                }
            };
            document.addEventListener(webexpress.webui.Event.CHANGE_VALUE_EVENT, state.changeHandler);
        }

        // double click shortcut to insert
        tileHost.addEventListener("dblclick", (e) => {
            const card = e.target.closest(".wx-tile-card");
            if (card && state.selectedId) {
                const modalRoot = container.closest(".modal") || container.closest(".modal-content") || document;
                const submitBtn = modalRoot.querySelector(".submit-btn");
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        });
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
        if (state.searchInput) {
            state.searchInput.value = "";
        }
        if (state.catSelect) {
            state.catSelect.value = "all";
        }
        if (state.tileCtrl && typeof state.tileCtrl.setValue === "function") {
            state.tileCtrl.setValue(null);
        }

        if (state.searchInput) {
            state.searchInput.dispatchEvent(new Event("input"));
        }

        if (state.tileHost) {
            const modalRoot = state.tileHost.closest(".modal") || state.tileHost.closest(".modal-content") || document;
            const submitBtn = modalRoot.querySelector(".submit-btn");

            if (submitBtn) {
                submitBtn.disabled = true;

                if (state.tileCtrl && state.tileCtrl.value) {
                    state.selectedId = state.tileCtrl.value;
                    submitBtn.disabled = false;
                }

                if (!state.submitHandler) {
                    state.submitHandler = () => {
                        if (state.tileHost.offsetParent === null) {
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

                // prevent duplicate bindings
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
            const modalWrapper = state.tileHost.closest(".modal");
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