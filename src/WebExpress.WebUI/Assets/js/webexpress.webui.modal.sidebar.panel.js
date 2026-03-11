/**
 * A modal dialog with a left sidebar tree and a right content panel.
 * - extends ModalCtrl to reuse modal shell, header, body, and footer
 * - uses SplitCtrl for a resizable sidebar/main area
 * - uses TreeCtrl for page navigation
 * - pages can be added via API
 * - auto-loads panels from DialogPanels by a modal "key" (data-key or data-panels-key)
 *   - loads all panels registered under that key
 *   - if a registration carries a modalId, it is only loaded when it matches this modal's id
 * Data attributes:
 * - data-key or data-panels-key: registry key used to autoload panels from DialogPanels
 * - data-side-width: initial sidebar width in px (default 280)
 * - data-min-side-width: min sidebar width in px (default 180)
 * - data-submit-id: id of the submit button managed by the base class inside the modal footer
 * - data-validate-active-only: when "true", validate only the currently active pane and ignore hidden panes (default false = validate all pages)
 */
webexpress.webui.ModalSidebarPanel = class extends webexpress.webui.ModalCtrl {
    /**
     * Constructor
     * @param {HTMLElement} element - host element with optional .wx-modal-header/.wx-modal-content/.wx-modal-footer children (handled by ModalCtrl)
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

        // dom refs
        this._splitEl = null;
        this._treeHost = null;
        this._pageHost = null;
        this._validationEl = null; // bootstrap alert element in body (above split)
        this._submitBtn = null;

        // controller refs
        this._splitCtrl = null;
        this._treeCtrl = null;

        // event handler refs
        this._treeClickHandler = null;
        this._treeClickBound = false; // prevents duplicate bindings
        this._submitClickHandler = null;

        // build body content
        this._buildBodyContent();

        // autoload panels by key
        this._autoloadFromRegistry();

        // bind modal lifecycle events
        this._bindModalLifecycle();
    }

    /**
     * Adds a page to the panel.
     * @param {SidebarPage & { parentId?: string|null }} page - page definition
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

        // create tree node and page pane if controls exist
        if (this._pageHost) {
            this._createTreeNode(safe);
            this._createPagePane(safe, this._pages.length === 1);
            this._renderTree();
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
     * @param {string} id - page id
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
        // clear base content
        this._bodyDiv.innerHTML = "";

        // create split host
        const split = document.createElement("div");
        split.className = "wx-webui-split";
        split.id = this._element.id ? (this._element.id + "-split") : ("wx-split-" + Math.random().toString(36).slice(2));
        split.setAttribute("data-orientation", "horizontal");
        split.setAttribute("data-splitter-class", "bg-transparent");
        split.setAttribute("data-min-side", String(this._minSideWidth));
        split.setAttribute("data-size", String(this._sideWidth));

        // create panes
        const sidePane = document.createElement("div");
        sidePane.className = "wx-side-pane";
        const mainPane = document.createElement("div");
        mainPane.className = "wx-main-pane";

        // tree host
        const tree = document.createElement("div");
        tree.id = split.id + "-tree";
        tree.dataset.movable = "false";
        tree.dataset.indicatorLeaf = "false";
        sidePane.appendChild(tree);

        // pages host
        this._pageHost = document.createElement("div");
        this._pageHost.className = "wx-pages m-2";
        mainPane.appendChild(this._pageHost);

        // assemble
        split.appendChild(sidePane);
        split.appendChild(mainPane);
        this._bodyDiv.appendChild(split);

        // store refs
        this._splitEl = split;
        this._treeHost = tree;

        // init controls
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

        // initial render
        this._renderTree();

        // ensure tree click subscription once
        this._ensureTreeClickSubscription();
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

        // subscribe tree click to switch pages
        this._treeClickHandler = (ev) => {
            // guard against unrelated events
            if (!ev || !ev.detail) {
                return;
            }

            // accept clicks that originate from this tree; be tolerant about sender shape
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
                // some emitters carry an explicit tree id
                isOwnSender = true;
            }

            if (!nodeId || !isOwnSender) {
                return;
            }

            // switch page if pane exists
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
        // on shown, ensure a page is active and call onshow
        this._element.addEventListener("shown.bs.modal", () => {
            this._renderTree();
            if (!this._activePageId && this._pages.length > 0) {
                this._selectPageById(this._pages[0].id);
            } else {
                const p = this.getActivePage();
                if (p && typeof p.onShow === "function") {
                    p.onShow(this);
                }
            }

            // ensure submit button is wired (footer is managed by base class)
            this._wireSubmitButton();

            // ensure tree clicks are subscribed (important after reopen)
            this._ensureTreeClickSubscription();

            // fit after layout
            requestAnimationFrame(() => {
                this.fitSidePaneToContent();
            });
        });

        // on hidden, cleanup listeners and validation
        this._element.addEventListener("hidden.bs.modal", () => {
            this._hideValidation();

            // keep tree subscription strategy flexible: remove to prevent leaks, will be re-added on next shown
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
     * Respects per-panel modalId filters: a panel with modalId is only loaded when it matches this modal's id.
     * @returns {void}
     * @private
     */
    _autoloadFromRegistry() {
        // nothing to do if no key
        if (!this._panelsKey) {
            return;
        }

        const registry = window.webexpress?.webui?.DialogPanels;
        if (!registry) {
            return;
        }

        const modalId = this._element?.id || null;
        let counter = 0;

        // resolve panels from new or legacy api
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

            // apply modalid filter if present
            const hasPanelModalId = Object.prototype.hasOwnProperty.call(panel, "modalId") && panel.modalId != null && String(panel.modalId) !== "";
            if (hasPanelModalId) {
                if (!modalId || String(panel.modalId) !== String(modalId)) {
                    continue;
                }
            }

            // ensure unique id or generate
            const idTaken = (panel.id && this._pages.some((p) => { return p.id === panel.id; })) === true;
            if (!panel.id || String(panel.id).trim() === "" || idTaken) {
                panel.id = this._generatePageId(panel, ++counter);
            }

            this.addPage(panel);
        }
    }

    /**
     * Generates a unique page id based on title or the panels key.
     * @param {SidebarPage} page - page definition
     * @param {number} [n] - optional running number
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
     * Supports hierarchical insertion via page.parentId and expands all ancestors automatically.
     * @param {SidebarPage & { parentId?: string|null }} page - page definition
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

        // index node for lookup
        this._treeIndex.set(node.id, node);

        // insert into model by parentid
        const pid = page.parentId ? String(page.parentId) : null;
        if (pid && this._treeIndex.has(pid)) {
            const parent = /** @type {any} */ (this._treeIndex.get(pid));
            node.parent = parent;
            parent.children.push(node);

            // expand all ancestors so the newly added child becomes visible
            this._expandChain(parent);
        } else {
            this._treeModel.push(node);

            // remember as pending child until parent arrives
            if (pid) {
                const list = this._pendingChildren.get(pid) || [];
                list.push(node);
                this._pendingChildren.set(pid, list);
            }
        }

        // adopt pending children waiting for this node and expand this node to show them
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
     * @param {any} node - the node to remove from roots
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
     * @param {string} id - node id to reveal
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
     * @param {any} startNode - parent node to start expanding from
     * @returns {void}
     * @private
     */
    _expandChain(startNode) {
        let p = startNode;
        while (p) {
            // mark parent expanded
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
        if (!this._treeCtrl) {
            return;
        }
        // pass roots as hierarchical model; treectrl handles children itself
        this._treeCtrl.nodes = this._treeModel.slice();
    }

    /**
     * Creates a page pane container and calls render hook.
     * @param {SidebarPage} page - page definition
     * @param {boolean} active - whether pane should be initially visible
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

        // let page render its content
        if (typeof page.render === "function") {
            page.render(pane, this);
        }

        if (active) {
            this._activePageId = page.id;
        }
    }

    /**
     * Recursively marks the active node in the tree model.
     * @param {Array<any>} nodes - node list to visit
     * @param {string} id - active id
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
     * Expands all parents of the selected node to ensure visibility.
     * @param {string} id - page id
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

        // hide previous pane
        if (this._activePageId && this._pagePanes.has(this._activePageId)) {
            const oldPane = this._pagePanes.get(this._activePageId);
            if (oldPane) {
                oldPane.style.display = "none";
            }
        }

        // show new pane
        const pane = this._pagePanes.get(id);
        if (pane) {
            pane.style.display = "";
        }
        this._activePageId = id;

        // expand all parents so selected node is visible
        this._expandAncestors(id);

        // update active flags in tree model and re-render
        this._markActiveRecursive(this._treeModel, id);
        this._renderTree();

        // call page onshow if provided
        const page = this.getActivePage();
        if (page && typeof page.onShow === "function") {
            page.onShow(this);
        }

        // do not auto-hide validation here; keep alert visible as long as errors exist
    }

    /**
     * Wires the submit button provided by the base class using the id in data-submit-id.
     * @returns {void}
     * @private
     */
    _wireSubmitButton() {
        if (!this._submitButtonId) {
            return;
        }

        // find by global id and ensure it belongs to this modal
        const btn = document.getElementById(this._submitButtonId);
        if (!btn) {
            return;
        }
        if (!this._element.contains(btn)) {
            return;
        }

        this._submitBtn = btn;

        // avoid double binding
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
     * Handles submit: runs validation (active-only or all pages), shows a bootstrap alert on error, calls onSubmit, and closes the modal on success.
     * @returns {void}
     * @private
     */
    _handleSubmit() {
        // compute validation scope
        const active = this.getActivePage();
        const pagesToValidate = this._validateActiveOnly ? (active ? [active] : []) : this._pages.slice();

        // perform validation
        let valid = true;
        let message = "";

        if (pagesToValidate.length === 0) {
            // nothing to validate or submit
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
                            // keep message empty to allow next branches to set it if available
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

            // stop on first error if validating only active, otherwise continue to collect first message
            if (!valid && this._validateActiveOnly) {
                break;
            }
        }

        if (!valid) {
            this._hasValidationErrors = true;
            this._showValidation(message || "Please correct the highlighted errors.");
            return;
        }

        // success: optional per-page submit hook (active page preferred when active-only)
        try {
            if (this._validateActiveOnly) {
                if (active && typeof active.onSubmit === "function") {
                    active.onSubmit(this);
                }
            } else {
                // call onsubmit on active page first if available, then others
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
            const msg = (err && err.message) ? String(err.message) : "Submit failed.";
            this._showValidation(msg);
            return;
        }

        // close modal after successful submit
        this._hasValidationErrors = false;
        this._hideValidation();
        this._closeModal();
    }

    /**
     * Closes the modal using base class or Bootstrap as a fallback.
     * @returns {void}
     * @private
     */
    _closeModal() {
        // prefer a base-class method if available
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

        // bootstrap 5 fallback (if available)
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

        // final fallback: dispatch a click on a dismiss button if present
        const dismiss = this._element.querySelector("[data-bs-dismiss='modal'], .btn-close");
        if (dismiss && typeof dismiss.click === "function") {
            dismiss.click();
        }
    }

    /**
     * Shows a validation message as a Bootstrap alert above the split control.
     * @param {string} message - text to display
     * @returns {void}
     * @private
     */
    _showValidation(message) {
        // ensure alert element exists above the split
        this._ensureValidationEl();

        if (!this._validationEl) {
            return;
        }

        // set message text and show alert
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
        // clear text but keep element for reuse
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

        // insert alert above split control in the body
        if (this._splitEl && this._splitEl.parentNode) {
            this._splitEl.parentNode.insertBefore(alert, this._splitEl);
        } else {
            // fallback: append to body div if split not ready
            this._bodyDiv.insertBefore(alert, this._bodyDiv.firstChild);
        }

        this._validationEl = alert;
    }

    /**
     * Parses integer attribute with fallback.
     * @param {string|null} value - attribute value
     * @param {number} fallback - default value
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
     * accepts: "true", "1", "yes", "on" as true; "false", "0", "no", "off" as false; empty => fallback
     * @param {string|null} value - attribute value
     * @param {boolean} fallback - default value
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