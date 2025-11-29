/**
 * Edit table control (extends base with inline editor and per-cell template support).
 * features:
 * - per column inline editor (data-editable="true") or per-cell template (data-editable="false")
 * - parses editor metadata/templates directly via overridden _parseColumns (early binding)
 * - renders editable cells using fresh template instances; initializes SmartEditCtrl
 * - renders non-editable cells using captured per-cell templates; falls back to cell text
 */
webexpress.webui.EditTableCtrl = class extends webexpress.webui.TableCtrl {

    // captured per-row per-column cell templates (outerHTML strings)
    _rowCellTemplates = new Map(); // pathString -> Map<colIndex, htmlString>

    /**
     * creates a new edit table controller.
     * @param {HTMLElement} element root element
     */
    constructor(element) {
        super(element);
        // bind save listener
        this._bindInlineEditSaveListener();
        // re-render to ensure any late data is applied (safe no-op if not needed)
        this.render();
    }

    /**
     * overrides column parsing to include editor metadata and template html.
     * this is called by the base constructor before the first render, ensuring
     * editable columns are recognized immediately.
     * @param {HTMLElement|null} columnsDiv container element
     * @returns {Array<Object>} column definition objects
     */
    _parseColumns(columnsDiv) {
        if (!columnsDiv) {
            return [];
        }
        const headerColor = columnsDiv.dataset.color || null;
        this._suppressHeaders = columnsDiv.dataset.suppressHeaders === "true";
        if (headerColor) {
            this._head.classList.add(headerColor);
        }
        return Array.from(columnsDiv.children).map((div, idx) => {
            const firstChild = div.children[0] || null;
            return {
                id: div.id || `col_${idx}`,
                index: idx,
                name: div.dataset.objectName || null,
                label: div.dataset.label || "",
                icon: div.dataset.icon || null,
                image: div.dataset.image || null,
                color: div.dataset.color || null,
                width: div.getAttribute("width") ? parseInt(div.getAttribute("width"), 10) || null : null,
                sort: div.dataset.sort || null,
                visible: div.dataset.visible !== "false",
                // editor metadata for edit table
                editable: div.dataset.editable === "true",
                editAction: div.dataset.formAction || null,
                editMethod: div.dataset.formMethod || null,
                // store pristine html for safe cloning
                _editHtml: firstChild ? firstChild.outerHTML : null
            };
        });
    }

    /**
     * overrides row parsing to capture per-cell templates (outerHTML) for non-editable rendering.
     * @param {NodeList|Array} rowsDivs row elements
     * @param {Object|null} parent parent row
     * @returns {Array<Object>} parsed row objects
     */
    _parseRows(rowsDivs, parent = null) {
        const rows = [];
        // clear templates map for fresh parse
        this._rowCellTemplates = new Map();

        const collectPathForRow = (rowObj) => {
            const parts = [];
            let cur = rowObj;
            while (cur) {
                let siblings = null;
                if (cur.parent) {
                    siblings = cur.parent.children || [];
                } else {
                    siblings = rows; // we are building rows progressively
                }
                const idx = siblings.indexOf(cur);
                parts.push(String(Math.max(0, idx)));
                cur = cur.parent || null;
            }
            parts.reverse();
            return parts.join("/");
        };

        const processRowDivs = (rowDivs, currentParent) => {
            for (const div of rowDivs) {
                if (!(div instanceof HTMLElement) || !div.classList.contains("wx-table-row")) {
                    continue;
                }

                let expanded = true;
                if (div.dataset.expanded === "true") {
                    expanded = true;
                } else if (div.dataset.expanded === "false") {
                    expanded = false;
                } else if (div.dataset.collapsed === "true") {
                    expanded = false;
                }

                const r = {
                    id: div.id || null,
                    class: div.className || null,
                    style: div.getAttribute("style") || null,
                    color: div.dataset.color || null,
                    image: div.dataset.image || null,
                    icon: div.dataset.icon || null,
                    uri: div.dataset.uri || div.dataset.url || null,
                    target: div.dataset.target || null,
                    cells: [],
                    options: null,
                    children: [],
                    parent: currentParent,
                    expanded
                };

                if (currentParent) {
                    currentParent.children.push(r);
                } else {
                    rows.push(r);
                }

                const cellTemplateMap = new Map();
                let colIndex = 0;

                for (const child of div.children) {
                    if (!(child instanceof HTMLElement)) {
                        continue;
                    }
                    if (child.classList.contains("wx-table-row")) {
                        continue;
                    }
                    if (child.classList.contains("wx-table-options")) {
                        r.options = this._parseOptions(child);
                        if (r.options && r.options.length) {
                            this._hasOptions = true;
                        }
                        continue;
                    }
                    if (child.classList.contains("wx-table-footer")) {
                        continue;
                    }

                    r.cells.push({
                        id: child.id || null,
                        class: child.className || null,
                        style: child.getAttribute("style") || null,
                        color: child.dataset.color || null,
                        text: child.textContent.trim(),
                        image: child.dataset.image || null,
                        icon: child.dataset.icon || null,
                        uri: child.dataset.uri || child.dataset.url || null,
                        target: child.dataset.target || null,
                        modal: child.dataset.modal || null,
                        objectId: child.dataset.objectId || null
                    });

                    const tpl = child.firstElementChild ? child.firstElementChild.outerHTML : null;
                    if (tpl) {
                        cellTemplateMap.set(colIndex, tpl);
                    }

                    colIndex += 1;
                }

                const path = collectPathForRow(r);
                if (cellTemplateMap.size > 0) {
                    this._rowCellTemplates.set(path, cellTemplateMap);
                }

                const childRowDivs = Array.from(div.children).filter((c) => { return c instanceof HTMLElement && c.classList.contains("wx-table-row"); });
                if (childRowDivs.length) {
                    this._isTree = true;
                    processRowDivs(childRowDivs, r);
                }
            }
        };

        processRowDivs(Array.from(rowsDivs || []), parent || null);
        return parent ? parent.children : rows;
    }

    /**
     * renders a single cell.
     * editable:
     *  - build wrapper with unique id and metadata AND class 'wx-editable'
     *  - inject fresh template instance
     *  - initialize SmartEditCtrl
     * non-editable:
     *  - append captured per-cell template or fallback to text
     * @param {Object} row row object
     * @param {Object} colDef column definition
     * @param {Object} cell cell object
     * @param {boolean} isFirstVisible first visible column flag
     * @returns {Node} rendered node
     */
    _renderCell(row, colDef, cell, isFirstVisible) {
        if (colDef && colDef.editable) {
            const wrap = document.createElement("div");
            // important: add class to trigger smart edit styling/behavior
            wrap.className = "wx-editable";

            const rowPath = this._getRowPath(row);
            wrap.id = `${colDef.id || "col"}__${rowPath}`;
            wrap.setAttribute("data-editable", "true");

            const objectId = cell?.objectId || cell?.id || row?.id || null;
            if (objectId) {
                wrap.setAttribute("data-object-id", objectId);
            }
            if (colDef.name) {
                wrap.setAttribute("data-object-name", colDef.name);
            }
            if (colDef.editAction) {
                wrap.setAttribute("data-form-action", colDef.editAction);
            }
            if (colDef.editMethod) {
                wrap.setAttribute("data-form-method", colDef.editMethod);
            }

            // inject template instance or fallback input
            let templateRoot = null;
            if (colDef._editHtml) {
                wrap.innerHTML = colDef._editHtml;
                templateRoot = wrap.firstElementChild || wrap;
            } else {
                const input = document.createElement("input");
                input.type = "text";
                input.className = "form-control";
                input.name = colDef.id || "value";
                input.value = cell?.text || "";
                templateRoot = input;
                wrap.appendChild(templateRoot);
            }

            this._unhideTemplate(templateRoot);
            this._makeInnerIdsUnique(templateRoot, rowPath);
            this._ensureFieldNames(templateRoot, colDef?.id);
            this._applyValueToTemplateFields(templateRoot, cell?.text || "");

            // initialize SmartEditCtrl if available
            if (webexpress?.webui?.SmartEditCtrl) {
                const smartEditCtrl = new webexpress.webui.SmartEditCtrl(wrap);
                smartEditCtrl.value = cell?.text || "";
            }

            return wrap;
        }

        // non-editable: try per-cell template, else text
        const wrap = document.createElement("div");
        const tplHtml = this._getCellTemplateHtml(row, colDef);
        if (tplHtml) {
            wrap.innerHTML = tplHtml;
            return wrap;
        }
        wrap.appendChild(document.createTextNode(cell?.text || ""));
        return wrap;
    }

    /**
     * returns the path string for a row based on its position in the tree.
     * format: "idx/childIdx/..."
     * @param {Object} row row object
     * @returns {string} path string
     */
    _getRowPath(row) {
        const parts = [];
        let cur = row;
        while (cur) {
            let siblings = null;
            if (cur.parent) {
                siblings = cur.parent.children || [];
            } else {
                siblings = this._rows || [];
            }
            const idx = siblings.indexOf(cur);
            parts.push(String(Math.max(0, idx)));
            cur = cur.parent || null;
        }
        parts.reverse();
        return parts.join("/");
    }

    /**
     * fetches captured per-cell template html by row and column.
     * @param {Object} row row object
     * @param {Object} colDef column definition
     * @returns {string|null} html string or null
     */
    _getCellTemplateHtml(row, colDef) {
        const path = this._getRowPath(row);
        const colIdx = this._colIndexCache?.get(colDef.id);
        if (colIdx == null) {
            return null;
        }
        const map = this._rowCellTemplates.get(path);
        if (!map) {
            return null;
        }
        return map.get(colIdx) || null;
    }

    /**
     * makes inner element ids unique by appending a suffix.
     * @param {HTMLElement} root template root
     * @param {string} suffix unique suffix per row
     */
    _makeInnerIdsUnique(root, suffix) {
        if (!(root instanceof HTMLElement)) {
            return;
        }
        const withId = root.querySelectorAll("[id]");
        withId.forEach((el) => {
            const oldId = el.id;
            if (!oldId) {
                return;
            }
            const newId = `${oldId}__${suffix}`;
            el.id = newId;
            const labels = root.querySelectorAll(`label[for="${oldId}"]`);
            labels.forEach((lb) => { lb.setAttribute("for", newId); });
        });
    }

    /**
     * removes common hidden states on a template root to ensure visibility.
     * @param {HTMLElement} root template root
     */
    _unhideTemplate(root) {
        if (!(root instanceof HTMLElement)) {
            return;
        }
        const hiddenClasses = ["d-none", "visually-hidden", "wx-hidden"];
        hiddenClasses.forEach((cls) => { root.classList.remove(cls); });
        if (root.style && (root.style.display === "none" || root.style.visibility === "hidden")) {
            root.style.display = "";
            root.style.visibility = "";
        }
        root.querySelectorAll(".d-none, .visually-hidden, .wx-hidden").forEach((el) => {
            el.classList.remove("d-none", "visually-hidden", "wx-hidden");
        });
        root.querySelectorAll("[style]").forEach((el) => {
            if (el.style.display === "none") {
                el.style.display = "";
            }
            if (el.style.visibility === "hidden") {
                el.style.visibility = "";
            }
        });
    }

    /**
     * ensures at least one field has a name; applies a fallback name if missing.
     * @param {HTMLElement|Node} root template root
     * @param {string} fallbackName fallback name (e.g., column id)
     */
    _ensureFieldNames(root, fallbackName) {
        if (!(root instanceof HTMLElement)) {
            return;
        }
        const fields = root.querySelectorAll("input, textarea, select");
        let hasName = false;
        fields.forEach((f) => {
            if (f.name && f.name.trim() !== "") {
                hasName = true;
            }
        });
        if (!hasName && fields.length > 0) {
            fields[0].name = fallbackName || "value";
        }
    }

    /**
     * applies a value to common form fields contained in the template root.
     * @param {HTMLElement|Node} root template root
     * @param {string} value new value
     */
    _applyValueToTemplateFields(root, value) {
        if (!(root instanceof HTMLElement)) {
            return;
        }
        const editableSelectors = "input[type=text], input[type=number], input[type=email], input[type=search], input[type=password], input:not([type]), textarea, select";
        const fields = root.querySelectorAll(editableSelectors);
        if (fields.length === 0 && root.matches("input, textarea, select")) {
            this._setFieldValue(root, value);
            return;
        }
        fields.forEach((f) => {
            this._setFieldValue(f, value);
        });
    }

    /**
     * sets the value on a single form field.
     * @param {HTMLElement} field form field
     * @param {string} value value to set
     */
    _setFieldValue(field, value) {
        if (field.tagName === "SELECT") {
            const opt = Array.from(field.options).find((o) => { return o.value === value || o.text === value; });
            if (opt) {
                field.value = opt.value;
            } else {
                if (field.options.length && (field.value === "" || field.value == null)) {
                    field.selectedIndex = 0;
                }
            }
        } else if (field.type === "checkbox" || field.type === "radio") {
            field.checked = !!value && value !== "0" && value !== "false";
        } else {
            field.value = value;
        }
    }

    /**
     * binds listener for SAVE_INLINE_EDIT_EVENT to update row snapshot.
     */
    _bindInlineEditSaveListener() {
        if (!webexpress?.webui?.Event?.SAVE_INLINE_EDIT_EVENT) {
            return;
        }
        document.addEventListener(webexpress.webui.Event.SAVE_INLINE_EDIT_EVENT, (e) => {
            const src = e.detail?.sender instanceof HTMLElement ? e.detail?.sender : null;
            if (!src) {
                return;
            }
            const tbl = src.closest("table");
            if (tbl !== this._table) {
                return;
            }
            const tr = src.closest("tr");
            if (tr && tr._dataRowRef) {
                this._updateRowSnapshotFromDom(tr._dataRowRef);
                if (typeof this._flashRow === "function") {
                    this._flashRow(tr._dataRowRef);
                }
            }
        });
    }

    /**
     * updates snapshot for a single row from its current data state.
     * @param {Object} row row object
     */
    _updateRowSnapshotFromDom(row) {
        const key = this._getRowKey(row);
        if (!key) {
            return;
        }
        const sig = this._computeRowSignature(row);
        this._prevRowState.set(key, sig);
    }
};

// register edit class
webexpress.webui.Controller.registerClass("wx-webui-table-edit", webexpress.webui.EditTableCtrl);