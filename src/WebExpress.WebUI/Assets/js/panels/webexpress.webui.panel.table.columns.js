/**
 * Registers a dynamic columns management panel under the key "table-columns".
 * This panel integrates with ModalSidebarPanel and TableCtrlReorderable.
 */
webexpress.webui.DialogPanels.register("table-columns", {
    id: "table-columns-pane",
    parentId: null,
    title: "Columns",
    iconClass: "fas fa-columns",

    /**
     * Renders the panel UI.
     * @param {HTMLElement} container The container element.
     * @param {Object} modal The modal controller instance.
     */
    render: function (container, modal) {
        let listContainer;
        let searchInput;
        let dragPlaceholder;
        let dragSourceIndex = null;

        /**
         * Filters the column list based on search input.
         */
        const applyFilter = () => {
            const term = (searchInput.value || "").toLowerCase().trim();
            const items = listContainer.querySelectorAll(".wx-col-item");
            items.forEach((it) => {
                const id = it.dataset.columnId || "";
                const label = it.querySelector(".wx-form-check span")?.textContent || "";
                const hay = `${id} ${label}`.toLowerCase();
                if (!term || hay.includes(term)) {
                    it.style.display = "";
                } else {
                    it.style.display = "none";
                }
            });
        };

        /**
         * Builds a single list item for a column.
         * @param {Object} column The column data.
         * @param {number} index The current index.
         * @returns {HTMLElement} The constructed list item.
         */
        const buildListItem = (column, index) => {
            const item = document.createElement("div");
            item.className = "wx-col-item";
            item.dataset.columnId = column.id;
            item.dataset.index = String(index);
            item.draggable = false;

            const line = document.createElement("div");
            line.className = "wx-flex-line";
            line.style.display = "flex";
            line.style.alignItems = "center";
            line.style.gap = "8px";
            line.style.padding = "6px 8px";

            const handle = document.createElement("span");
            handle.className = "wx-col-drag-handle";
            handle.textContent = "⠿";
            handle.title = modal._i18n("webexpress.webui:page.table.columns.drag");
            handle.style.cursor = "grab";
            handle.onmousedown = () => {
                item.draggable = true;
                handle.style.cursor = "grabbing";
            };
            handle.onmouseup = () => {
                item.draggable = false;
                handle.style.cursor = "grab";
            };

            const labelWrap = document.createElement("label");
            labelWrap.className = "wx-form-check";
            labelWrap.style.display = "flex";
            labelWrap.style.alignItems = "center";
            labelWrap.style.gap = "6px";
            labelWrap.style.flex = "1";
            labelWrap.style.margin = "0";
            labelWrap.style.cursor = "pointer";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.className = "form-check-input";
            cb.style.marginTop = "0";
            cb.checked = !!column.visible;
            cb.addEventListener("change", (ev) => {
                ev.preventDefault();
                const cols = (typeof modal.getColumns === "function") ? modal.getColumns() : [];
                const visibleCount = cols.filter((c) => c.visible).length;
                if (!cb.checked && visibleCount <= 1) {
                    cb.checked = true;
                    return;
                }
                if (typeof modal.applyVisibility === "function") {
                    modal.applyVisibility(column.id, cb.checked);
                }
            });

            const lbl = document.createElement("span");
            lbl.textContent = column.label || column.id || modal._i18n("webexpress.webui:page.table.column.default");

            labelWrap.appendChild(cb);
            labelWrap.appendChild(lbl);

            line.appendChild(handle);
            line.appendChild(labelWrap);
            item.appendChild(line);

            item.addEventListener("dragstart", (e) => {
                if (item.getAttribute("draggable") !== "true") {
                    e.preventDefault();
                    return;
                }
                dragSourceIndex = parseInt(item.dataset.index, 10);
                item.classList.add("dragging");
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", item.dataset.columnId);
            });

            item.addEventListener("dragend", () => {
                item.classList.remove("dragging");
                item.draggable = false;
                if (dragPlaceholder && dragPlaceholder.parentNode) {
                    dragPlaceholder.remove();
                }
                const all = listContainer.querySelectorAll(".wx-col-item");
                all.forEach((it, idx) => {
                    it.dataset.index = String(idx);
                });
                dragSourceIndex = null;
            });

            return item;
        };

        /**
         * Renders the full list of columns.
         * @param {string[]} [orderedIds] Optional array of column IDs defining order.
         */
        const renderList = (orderedIds) => {
            if (typeof modal.getColumns !== "function") {
                return;
            }

            const cols = modal.getColumns();
            if (!cols || !cols.length) {
                listContainer.innerHTML = "";
                return;
            }

            let order = orderedIds && orderedIds.length ? orderedIds.slice() : cols.map((c) => c.id);

            listContainer.innerHTML = "";

            order.forEach((id, idx) => {
                const col = cols.find(c => c.id === id);
                if (!col) {
                    return;
                }
                const item = buildListItem(col, idx);
                listContainer.appendChild(item);
            });
            applyFilter();
        };

        /**
         * Initializes drag and drop functionality for the list.
         */
        const initDragAndDrop = () => {
            dragPlaceholder = document.createElement("div");
            dragPlaceholder.className = "wx-col-placeholder";
            dragPlaceholder.style.cssText = "height: 2px; background: var(--bs-primary, #0d6efd); margin: 2px 0;";

            const getItems = () => Array.from(listContainer.querySelectorAll(".wx-col-item"));

            const handleDragOver = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const draggingItem = listContainer.querySelector(".wx-col-item.dragging");
                if (!draggingItem) {
                    return;
                }
                const siblings = getItems().filter((i) => i !== draggingItem);
                let nextSibling = siblings.find((sibling) => {
                    const rect = sibling.getBoundingClientRect();
                    const mid = rect.top + rect.height / 2;
                    return e.clientY < mid;
                });
                if (nextSibling) {
                    listContainer.insertBefore(dragPlaceholder, nextSibling);
                } else {
                    listContainer.appendChild(dragPlaceholder);
                }
            };

            const handleDrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dragSourceIndex === null) {
                    return;
                }
                const allChildren = Array.from(listContainer.children);
                const placeholderIndex = allChildren.indexOf(dragPlaceholder);
                let adjustedIndex = 0;
                for (let i = 0; i < placeholderIndex; i++) {
                    const child = allChildren[i];
                    if (child.classList.contains("wx-col-item") && !child.classList.contains("dragging")) {
                        adjustedIndex++;
                    }
                }
                if (dragSourceIndex !== adjustedIndex) {
                    const ids = getItems().map((it) => it.dataset.columnId);
                    const movedId = ids.splice(dragSourceIndex, 1)[0];
                    ids.splice(adjustedIndex, 0, movedId);
                    if (typeof modal.applyOrder === "function") {
                        modal.applyOrder(ids);
                    }
                    renderList(ids);
                }
            };
            listContainer.addEventListener("dragover", handleDragOver);
            listContainer.addEventListener("drop", handleDrop);
        };

        container.innerHTML = "";

        const searchGrp = document.createElement("div");
        searchGrp.className = "mb-2";
        searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "form-control form-control-sm wx-search";
        searchInput.placeholder = modal._i18n("webexpress.webui:page.table.columns.search");
        const prefill = modal._columnsPrefill && modal._columnsPrefill.filterTerm ? modal._columnsPrefill.filterTerm : "";
        searchInput.value = prefill;
        searchInput.addEventListener("input", applyFilter);
        searchGrp.appendChild(searchInput);
        container.appendChild(searchGrp);

        const desc = document.createElement("div");
        desc.className = "form-text mb-2";
        desc.textContent = modal._i18n("webexpress.webui:page.table.columns.desc");
        container.appendChild(desc);

        listContainer = document.createElement("div");
        listContainer.className = "wx-columns-list";
        container.appendChild(listContainer);

        // deferred init to ensure modal helpers are ready
        setTimeout(() => {
            if (typeof modal.getColumns === "function") {
                renderList();
                initDragAndDrop();
            }
        }, 0);

        if (modal && typeof modal.fitSidePaneToContent === "function") {
            requestAnimationFrame(() => {
                modal.fitSidePaneToContent();
            });
        }
    },

    /**
     * Called when the panel is shown.
     * @param {Object} modal The modal controller instance.
     */
    onShow: function (modal) {
        const content = modal._contentEl || document;
        const search = content.querySelector(".wx-search");
        if (search) {
            search.focus();
            // inline comment: guard against missing select method
            if (typeof search.select === "function") {
                search.select();
            }
        }
        if (modal && typeof modal.fitSidePaneToContent === "function") {
            requestAnimationFrame(() => {
                modal.fitSidePaneToContent();
            });
        }
    },

    /**
     * Called when the panel submits data.
     * @param {Object} modal The modal controller instance.
     * @returns {Object|null} The submission data.
     */
    onSubmit: function (modal) {
        const content = modal._contentEl || document;
        // fixed selector to target items, not search inputs
        const items = content.querySelectorAll(".wx-col-item");
        if (!items.length) {
            return null;
        }

        const ids = Array.from(items).map((it) => it.dataset.columnId);
        if (typeof modal.applyOrder === "function") {
            modal.applyOrder(ids);
        }
        return { order: ids };
    }
});