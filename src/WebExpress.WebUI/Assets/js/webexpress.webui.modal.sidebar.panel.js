/**
 * A modal dialog with a left sidebar tree and a right content panel.
 * - extends ModalCtrl to reuse modal shell, header, body, and footer
 * - uses SplitCtrl for a resizable sidebar/main area
 * - uses TreeCtrl for page navigation
 * - pages can be added via api
 * - auto-loads panels from DialogPanels by a modal "key" (data-key or data-panels-key)
 *   - loads all panels registered under that key
 *   - if a registration carries a modalId, it is only loaded when it matches this modal's id
 * data attributes:
 * - data-key or data-panels-key: registry key used to autoload panels from DialogPanels
 * - data-side-width: initial sidebar width in px (default 280)
 * - data-min-side-width: min sidebar width in px (default 180)
 * - data-submit-id: id of the submit button managed by the base class inside the modal footer
 * - data-validate-active-only: when "true", validate only the currently active pane and ignore hidden panes (default false = validate all pages)
 */
webexpress.webui.ModalSidebarPanel = class extends webexpress.webui.ModalCtrl {
    /**
     * Constructor.
     * @param {HTMLElement} element - Host element with optional modal shell children.
     */
    constructor(element) {
        super(element);

        // read options from data attributes
        this._panelsKey = element.getAttribute("data-key") || element.getAttribute("data-panels-key") || "";
        this._sideWidth = this._parseIntAttr(element.getAttribute("data-side-width"), 280);
        this._minSideWidth = this._parseIntAttr(element.getAttribute("data-min-side-width"), 180);
        this._submitButtonId = element.getAttribute("data-submit-id") || "";
        this._validateActiveOnly = this._parseBoolAttr(element.getAttribute("data-validate-active-only"), false);

        // remove consumed attributes
        element.removeAttribute("data-key");
        element.removeAttribute("data-panels-key");
        element.removeAttribute("data-side-width");
        element.removeAttribute("data-min-side-width");
        element.removeAttribute("data-submit-id");
        element.removeAttribute("data-validate-active-only");

        // internal state
        this._pages = [];
        this._treeModel = [];
        this._treeIndex = new Map();
        this._pendingChildren = new Map();
        this._activePageId = null;
        this._pagePanes = new Map();
        this._hasValidationErrors = false;
        this._singlePaneMode = false;

        // dom refs
        this._splitEl = null;
        this._treeHost = null;
        this._pageHost = null;
        this._validationEl = null;
        this._submitBtn = null;

        // controller refs
        this._splitCtrl = null;
        this._treeCtrl = null;

        // event handler refs
        this._treeClickHandler = null;
        this._treeClickBound = false;
        this._submitClickHandler = null;

        // build body content
        this._buildBodyContent();

        // autoload panels by key
        this._autoloadFromRegistry();

        // apply initial layout mode based on page count
        this._applyLayoutMode();

        // bind modal lifecycle events
        this._bindModalLifecycle();
    }

    /**
     * Adds a page to the panel.
     * @param {SidebarPage & { parentId?: string|null }} page - Page definition.
     * @returns {this}
     */
    addPage(page) {
        if (!page) {
            throw new Error("Page definition is required.");
        }

        const safeId = (page.id && String(page.id).trim() !== "") ? String(page.id) : this._generatePageId(page);
        const safe = Object.assign({
            id: safeId,
            title: page.title || safeId,
            iconClass: page.iconClass || "",
            image: page.image || "",
            parentId: page.parentId || null
        }, page, { id: safeId });

        this._pages.push(safe);

        if (this._pageHost) {
            if (!this._singlePaneMode) {
                this._createTreeNode(safe);
            }
            this._createPagePane(safe, this._pages.length === 1);
            this._renderTree();
            this._applyLayoutMode();
        }

        return this;
    }

    /**
     * Returns the active page definition or null.
     * @returns {SidebarPage|null}
     */
    getActivePage() {
        if (!this._activePageId) {
            return null;
        }

        for (let i = 0; i < this._pages.length; i++) {
            const p = this._pages[i];
            if (p.id === this._activePageId) {
                return p;
            }
        }

        return null;
    }

    /**
     * Programmatically selects a page by id.
     * @param {string} id - Page id.
     * @returns {void}
     */
    selectPage(id) {
        this._selectPageById(id);
    }

    /**
     * Programmatically triggers submit.
     * @returns {void}
     */
    submit() {
        this._handleSubmit();
    }

    /**
     * Fits the side pane to its content using the SplitCtrl.
     * @returns {void}
     */
    fitSidePaneToContent() {
        if (this._splitCtrl && typeof this._splitCtrl.fitSidePaneToContent === "function") {
            this._splitCtrl.fitSidePaneToContent();
        }
    }

    /**
     * Builds the split layout and tree/page hosts inside the modal body.
     * @returns {void}
     * @private
     */
    _buildBodyContent() {
        this._bodyDiv.innerHTML = "";

        const split = document.createElement("div");
        split.className = "wx-webui-split";
        split.id = this._element.id ? (this._element.id + "-split") : ("wx-split-" + Math.random().toString(36).slice(2));
        split.setAttribute("data-orientation", "horizontal");
        split.setAttribute("data-splitter-class", "bg-transparent");
        split.setAttribute("data-min-side", String(this._minSideWidth));
        split.setAttribute("data-size", String(this._sideWidth));

        const sidePane = document.createElement("div");
        sidePane.className = "wx-side-pane";
        const mainPane = document.createElement("div");
        mainPane.className = "wx-main-pane";

        const tree = document.createElement("div");
        tree.id = split.id + "-tree";
        tree.dataset.movable = "false";
        tree.dataset.indicatorLeaf = "false";
        sidePane.appendChild(tree);

        this._pageHost = document.createElement("div");
        this._pageHost.className = "wx-pages m-2";
        mainPane.appendChild(this._pageHost);

        split.appendChild(sidePane);
        split.appendChild(mainPane);
        this._bodyDiv.appendChild(split);

        this._splitEl = split;
        this._treeHost = tree;

        try {
            this._splitCtrl = new window.webexpress.webui.SplitCtrl(split);
        } catch (err) {
            // ignore split init errors
        }
        try {
            this._treeCtrl = new window.webexpress.webui.TreeCtrl(tree);
        } catch (err) {
            // ignore tree init errors
        }

        this._renderTree();
        this._ensureTreeClickSubscription();
    }

    /**
     * Applies layout mode:
     * - one page: hide tree/split and show content only
     * - multiple pages: show split/tree + content
     * @returns {void}
     * @private
     */
    _applyLayoutMode() {
        const shouldSingle = this._pages.length <= 1;

        if (shouldSingle === this._singlePaneMode) {
            return;
        }

        this._singlePaneMode = shouldSingle;

        if (this._singlePaneMode) {
            if (this._splitEl) {
                this._splitEl.style.display = "none";
            }

            if (this._pageHost && this._pageHost.parentElement !== this._bodyDiv) {
                this._bodyDiv.appendChild(this._pageHost);
            }

            this._removeTreeClickSubscription();
        } else {
            if (this._splitEl) {
                this._splitEl.style.display = "";
                const mainPane = this._splitEl.querySelector(".wx-main-pane");
                if (mainPane && this._pageHost && this._pageHost.parentElement !== mainPane) {
                    mainPane.appendChild(this._pageHost);
                }
            }

            this._rebuildTreeModel();
            this._renderTree();
            this._ensureTreeClickSubscription();

            if (this._splitCtrl && typeof this._splitCtrl.fitSidePaneToContent === "function") {
                this._splitCtrl.fitSidePaneToContent();
            }
        }
    }

    /**
     * Rebuilds tree model/index from current pages.
     * @returns {void}
     * @private
     */
    _rebuildTreeModel() {
        this._treeModel = [];
        this._treeIndex = new Map();
        this._pendingChildren = new Map();

        for (let i = 0; i < this._pages.length; i++) {
            this._createTreeNode(this._pages[i]);
        }
    }

    /**
     * Ensures the global tree click subscription is active (idempotent).
     * @returns {void}
     * @private
     */
    _ensureTreeClickSubscription() {
        if (this._treeClickBound) {
            return;
        }

        this._treeClickHandler = (ev) => {
            if (!ev || !ev.detail) {
                return;
            }

            const nodeId = ev.detail.node;
            const sender = ev.detail.sender || ev.detail.source || ev.target || null;

            let isOwnSender = false;
            if (sender === this._treeHost) {
                isOwnSender = true;
            } else if (sender === this._treeCtrl) {
                isOwnSender = true;
            } else if (sender && sender.id && this._treeHost && sender.id === this._treeHost.id) {
                isOwnSender = true;
            } else if (this._treeHost && ev.detail.treeId && ev.detail.treeId === this._treeHost.id) {
                isOwnSender = true;
            }

            if (!nodeId || !isOwnSender) {
                return;
            }

            this._selectPageById(nodeId);
        };

        try {
            document.addEventListener(window.webexpress.webui.Event.CLICK_EVENT, this._treeClickHandler);
            this._treeClickBound = true;
        } catch (err) {
            // ignore event wiring errors
        }
    }

    /**
     * Removes the global tree click subscription if present.
     * @returns {void}
     * @private
     */
    _removeTreeClickSubscription() {
        if (!this._treeClickHandler || !this._treeClickBound) {
            return;
        }
        try {
            document.removeEventListener(window.webexpress.webui.Event.CLICK_EVENT, this._treeClickHandler);
        } catch (err) {
            // ignore event unwiring errors
        }
        this._treeClickHandler = null;
        this._treeClickBound = false;
    }

    /**
     * Binds modal show/hide lifecycle to handle initial selection and cleanup.
     * @returns {void}
     * @private
     */
    _bindModalLifecycle() {
        this._element.addEventListener("shown.bs.modal", () => {
            this._applyLayoutMode();

            this._renderTree();
            if (!this._activePageId && this._pages.length > 0) {
                this._selectPageById(this._pages[0].id);
            } else {
                const p = this.getActivePage();
                if (p && typeof p.onShow === "function") {
                    p.onShow(this);
                }
            }

            this._wireSubmitButton();

            if (!this._singlePaneMode) {
                this._ensureTreeClickSubscription();
                requestAnimationFrame(() => {
                    this.fitSidePaneToContent();
                });
            }
        });

        this._element.addEventListener("hidden.bs.modal", () => {
            this._hideValidation();

            this._removeTreeClickSubscription();

            if (this._submitBtn && this._submitClickHandler) {
                try {
                    this._submitBtn.removeEventListener("click", this._submitClickHandler);
                } catch (err) {
                    // ignore
                }
                this._submitClickHandler = null;
                this._submitBtn = null;
            }
        });
    }

    /**
     * Auto-loads all panels from DialogPanels that match this modal's panels key.
     * @returns {void}
     * @private
     */
    _autoloadFromRegistry() {
        if (!this._panelsKey) {
            return;
        }

        const registry = window.webexpress?.webui?.DialogPanels;
        if (!registry) {
            return;
        }

        const modalId = this._element?.id || null;
        let counter = 0;

        let panelList = null;
        if (typeof registry.get === "function") {
            panelList = registry.get(this._panelsKey) || [];
        } else if (registry._panels && Object.prototype.hasOwnProperty.call(registry._panels, this._panelsKey)) {
            panelList = registry._panels[this._panelsKey] || [];
        } else {
            panelList = [];
        }

        if (!Array.isArray(panelList) || panelList.length === 0) {
            return;
        }

        for (let i = 0; i < panelList.length; i++) {
            const panel = panelList[i];
            if (!panel) {
                continue;
            }

            const hasPanelModalId = Object.prototype.hasOwnProperty.call(panel, "modalId") && panel.modalId != null && String(panel.modalId) !== "";
            if (hasPanelModalId) {
                if (!modalId || String(panel.modalId) !== String(modalId)) {
                    continue;
                }
            }

            const idTaken = (panel.id && this._pages.some((p) => { return p.id === panel.id; })) === true;
            if (!panel.id || String(panel.id).trim() === "" || idTaken) {
                panel.id = this._generatePageId(panel, ++counter);
            }

            this.addPage(panel);
        }
    }

    /**
     * Generates a unique page id based on title or the panels key.
     * @param {SidebarPage} page - Page definition.
     * @param {number} [n] - Optional running number.
     * @returns {string} Generated id.
     * @private
     */
    _generatePageId(page, n) {
        const baseSource = (page && page.title) ? String(page.title) : (this._panelsKey || "page");
        const base = baseSource
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9\-]/g, "");
        const suffix = (typeof n === "number" && !isNaN(n)) ? ("-" + n) : ("-" + (this._pages.length + 1));
        return base + suffix;
    }

    /**
     * Creates a single tree node from a page and inserts it into the model.
     * @param {SidebarPage & { parentId?: string|null }} page - Page definition.
     * @returns {void}
     * @private
     */
    _createTreeNode(page) {
        const node = {
            id: page.id,
            label: page.title || page.id,
            iconOpen: page.iconClass || null,
            iconClose: page.iconClass || null,
            imageOpen: page.image || null,
            imageClose: page.image || null,
            active: false,
            expand: false,
            parent: null,
            children: []
        };

        this._treeIndex.set(node.id, node);

        const pid = page.parentId ? String(page.parentId) : null;
        if (pid && this._treeIndex.has(pid)) {
            const parent = this._treeIndex.get(pid);
            node.parent = parent;
            parent.children.push(node);
            this._expandChain(parent);
        } else {
            this._treeModel.push(node);

            if (pid) {
                const list = this._pendingChildren.get(pid) || [];
                list.push(node);
                this._pendingChildren.set(pid, list);
            }
        }

        const waiting = this._pendingChildren.get(node.id);
        if (Array.isArray(waiting) && waiting.length > 0) {
            for (let i = 0; i < waiting.length; i++) {
                const child = waiting[i];
                this._removeFromRoots(child);
                child.parent = node;
                node.children.push(child);
            }
            this._pendingChildren.delete(node.id);
            node.expand = true;
        }
    }

    /**
     * Removes a node reference from the root list if present.
     * @param {any} node - Node to remove from roots.
     * @returns {void}
     * @private
     */
    _removeFromRoots(node) {
        const idx = this._treeModel.indexOf(node);
        if (idx >= 0) {
            this._treeModel.splice(idx, 1);
        }
    }

    /**
     * Expands all ancestors of the given node id.
     * @param {string} id - Node id to reveal.
     * @returns {void}
     * @private
     */
    _expandAncestors(id) {
        const key = String(id);
        const node = this._treeIndex.get(key);
        if (!node) {
            return;
        }
        this._expandChain(node.parent);
    }

    /**
     * Expands an entire parent chain starting from the given node up to the root.
     * @param {any} startNode - Parent node to start expanding from.
     * @returns {void}
     * @private
     */
    _expandChain(startNode) {
        let p = startNode;
        while (p) {
            p.expand = true;
            p = p.parent;
        }
    }

    /**
     * Renders the tree control based on model.
     * @returns {void}
     * @private
     */
    _renderTree() {
        if (this._singlePaneMode) {
            return;
        }
        if (!this._treeCtrl) {
            return;
        }
        this._treeCtrl.nodes = this._treeModel.slice();
    }

    /**
     * Creates a page pane container and calls render hook.
     * @param {SidebarPage} page - Page definition.
     * @param {boolean} active - Whether pane should be initially visible.
     * @returns {void}
     * @private
     */
    _createPagePane(page, active) {
        const pane = document.createElement("div");
        pane.className = "wx-page-pane";
        pane.dataset.pageId = page.id;
        pane.style.display = active ? "" : "none";
        this._pageHost.appendChild(pane);
        this._pagePanes.set(page.id, pane);

        if (typeof page.render === "function") {
            page.render(pane, this);
        }

        if (active) {
            this._activePageId = page.id;
        }
    }

    /**
     * Recursively marks the active node in the tree model.
     * @param {Array<any>} nodes - Node list to visit.
     * @param {string} id - Active id.
     * @returns {void}
     * @private
     */
    _markActiveRecursive(nodes, id) {
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.active = (n.id === id);
            if (Array.isArray(n.children) && n.children.length > 0) {
                this._markActiveRecursive(n.children, id);
            }
        }
    }

    /**
     * Switches visible page by id and calls onShow.
     * @param {string} id - Page id.
     * @returns {void}
     * @private
     */
    _selectPageById(id) {
        if (!id) {
            return;
        }
        if (!this._pagePanes.has(id)) {
            return;
        }

        if (this._activePageId && this._pagePanes.has(this._activePageId)) {
            const oldPane = this._pagePanes.get(this._activePageId);
            if (oldPane) {
                oldPane.style.display = "none";
            }
        }

        const pane = this._pagePanes.get(id);
        if (pane) {
            pane.style.display = "";
        }
        this._activePageId = id;

        if (!this._singlePaneMode) {
            this._expandAncestors(id);
            this._markActiveRecursive(this._treeModel, id);
            this._renderTree();
        }

        const page = this.getActivePage();
        if (page && typeof page.onShow === "function") {
            page.onShow(this);
        }
    }

    /**
     * Wires the submit button provided by the base class.
     * @returns {void}
     * @private
     */
    _wireSubmitButton() {
        if (!this._submitButtonId) {
            return;
        }

        const btn = document.getElementById(this._submitButtonId);
        if (!btn) {
            return;
        }
        if (!this._element.contains(btn)) {
            return;
        }

        this._submitBtn = btn;

        if (this._submitClickHandler) {
            try {
                this._submitBtn.removeEventListener("click", this._submitClickHandler);
            } catch (err) {
                // ignore
            }
        }

        this._submitClickHandler = () => {
            this._handleSubmit();
        };
        this._submitBtn.addEventListener("click", this._submitClickHandler);
    }

    /**
     * Handles submit: runs validation, shows error alert, calls onSubmit, closes modal on success.
     * @returns {void}
     * @private
     */
    _handleSubmit() {
        const active = this.getActivePage();
        const pagesToValidate = this._validateActiveOnly ? (active ? [active] : []) : this._pages.slice();

        let valid = true;
        let message = "";

        if (pagesToValidate.length === 0) {
            this._hasValidationErrors = false;
            this._hideValidation();
            this._closeModal();
            return;
        }

        for (let i = 0; i < pagesToValidate.length; i++) {
            const page = pagesToValidate[i];
            try {
                if (typeof page.validate === "function") {
                    const res = page.validate(this);
                    if (typeof res === "boolean") {
                        if (!res) {
                            valid = false;
                        }
                    } else if (res && typeof res === "object") {
                        if (res.valid === false) {
                            valid = false;
                            if (!message && typeof res.message === "string") {
                                message = res.message;
                            }
                        }
                    } else if (typeof res === "string") {
                        valid = false;
                        if (!message) {
                            message = res;
                        }
                    }
                }
            } catch (err) {
                valid = false;
                if (!message) {
                    message = (err && err.message) ? String(err.message) : "Validation failed.";
                }
            }

            if (!valid && this._validateActiveOnly) {
                break;
            }
        }

        if (!valid) {
            this._hasValidationErrors = true;
            this._showValidation(message || this._i18n("webexpress.webui:modal.validation.error", "Please correct the highlighted errors."));
            return;
        }

        try {
            if (this._validateActiveOnly) {
                if (active && typeof active.onSubmit === "function") {
                    active.onSubmit(this);
                }
            } else {
                if (active && typeof active.onSubmit === "function") {
                    active.onSubmit(this);
                }
                for (let i = 0; i < this._pages.length; i++) {
                    const p = this._pages[i];
                    if (p !== active && typeof p.onSubmit === "function") {
                        p.onSubmit(this);
                    }
                }
            }
        } catch (err) {
            this._hasValidationErrors = true;
            const msg = (err && err.message) ? String(err.message) : this._i18n("webexpress.webui:modal.submit.failed", "Submit failed.");
            this._showValidation(msg);
            return;
        }

        this._hasValidationErrors = false;
        this._hideValidation();
        this._closeModal();
    }

    /**
     * Closes the modal using base class or Bootstrap fallback.
     * @returns {void}
     * @private
     */
    _closeModal() {
        try {
            if (typeof this.hide === "function") {
                this.hide();
                return;
            }
            if (typeof this.close === "function") {
                this.close();
                return;
            }
        } catch (err) {
            // ignore and try bootstrap fallback
        }

        try {
            const Modal = window.bootstrap && window.bootstrap.Modal ? window.bootstrap.Modal : null;
            if (Modal) {
                const instance = Modal.getOrCreateInstance(this._element);
                if (instance && typeof instance.hide === "function") {
                    instance.hide();
                    return;
                }
            }
        } catch (err) {
            // ignore
        }

        const dismiss = this._element.querySelector("[data-bs-dismiss='modal'], .btn-close");
        if (dismiss && typeof dismiss.click === "function") {
            dismiss.click();
        }
    }

    /**
     * Shows a validation message as a Bootstrap alert above the split control.
     * @param {string} message - Text to display.
     * @returns {void}
     * @private
     */
    _showValidation(message) {
        this._ensureValidationEl();

        if (!this._validationEl) {
            return;
        }

        const textEl = this._validationEl.querySelector(".wx-alert-text");
        if (textEl) {
            textEl.textContent = String(message || "");
        }
        this._validationEl.classList.remove("d-none");
    }

    /**
     * Hides the validation alert.
     * @returns {void}
     * @private
     */
    _hideValidation() {
        if (!this._validationEl) {
            this._hasValidationErrors = false;
            return;
        }
        this._validationEl.classList.add("d-none");
        const textEl = this._validationEl.querySelector(".wx-alert-text");
        if (textEl) {
            textEl.textContent = "";
        }
        this._hasValidationErrors = false;
    }

    /**
     * Ensures there is a Bootstrap alert element inserted above the split control.
     * @returns {void}
     * @private
     */
    _ensureValidationEl() {
        if (this._validationEl && this._validationEl.isConnected) {
            return;
        }

        const alert = document.createElement("div");
        alert.className = "alert alert-danger mb-2 d-none";
        alert.setAttribute("role", "alert");

        const span = document.createElement("span");
        span.className = "wx-alert-text";
        alert.appendChild(span);

        // insert alert above visible content container
        if (this._singlePaneMode) {
            this._bodyDiv.insertBefore(alert, this._bodyDiv.firstChild);
        } else if (this._splitEl && this._splitEl.parentNode) {
            this._splitEl.parentNode.insertBefore(alert, this._splitEl);
        } else {
            this._bodyDiv.insertBefore(alert, this._bodyDiv.firstChild);
        }

        this._validationEl = alert;
    }

    /**
     * Parses integer attribute with fallback.
     * @param {string|null} value - Attribute value.
     * @param {number} fallback - Default value.
     * @returns {number} Parsed integer value.
     * @private
     */
    _parseIntAttr(value, fallback) {
        const n = parseInt(value || "", 10);
        if (isNaN(n)) {
            return fallback;
        }
        return n;
    }

    /**
     * Parses boolean attribute with fallback.
     * Accepts: "true", "1", "yes", "on" as true; "false", "0", "no", "off" as false.
     * @param {string|null} value - Attribute value.
     * @param {boolean} fallback - Default value.
     * @returns {boolean} Parsed boolean value.
     * @private
     */
    _parseBoolAttr(value, fallback) {
        if (value == null || value === "") {
            return fallback;
        }
        const v = String(value).trim().toLowerCase();
        if (v === "true" || v === "1" || v === "yes" || v === "on") {
            return true;
        }
        if (v === "false" || v === "0" || v === "no" || v === "off") {
            return false;
        }
        return fallback;
    }
};

// register control in controller
webexpress.webui.Controller.registerClass("wx-webui-modal-sidebar-panel", webexpress.webui.ModalSidebarPanel);