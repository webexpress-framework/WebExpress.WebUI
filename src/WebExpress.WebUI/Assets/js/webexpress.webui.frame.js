/**
 * An inline page embedding controller (iFrame alternative) that loads HTML into a regular div.
 *
 * A load into an empty frame shows a skeleton placeholder while the content is
 * on its way. A load into a frame that already holds content shows none: the
 * outgoing content stays until its replacement is ready, so swapping from one
 * page to the next is a single exchange rather than a flash through an empty
 * frame.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.DATA_REQUESTED_EVENT
 * - webexpress.webui.Event.DATA_ARRIVED_EVENT
 */
webexpress.webui.FrameCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Creates a new controller instance bound to the given element.
     * @param {HTMLElement} element - The host element that will receive the embedded content.
     */
    constructor(element) {
        super(element);

        this._uri = element.getAttribute("data-uri") || "";
        this._selector = element.getAttribute("data-selector") || "body";
        this._autoload = (element.getAttribute("data-autoload") || "true").toLowerCase() !== "false";

        // cleanup data attributes to avoid leaking configuration into the dom
        this._element.removeAttribute("data-uri");
        this._element.removeAttribute("data-selector");
        this._element.removeAttribute("data-autoload");

        this._element.classList.add("wx-frame");

        // autoload content if configured
        if (this._autoload) {
            this.load();
        }
    }

    /**
     * Creates and returns a loading placeholder element.
     * @returns {HTMLElement} The placeholder element.
     */
    _createPlaceholder() {
        // create container div
        const placeholder = document.createElement("div");
        placeholder.classList.add("placeholder-glow");

        // create first placeholder block
        const div1 = document.createElement("div");
        div1.classList.add("placeholder", "col-4", "placeholder-lg");
        placeholder.appendChild(div1);

        // create paragraph element
        const p = document.createElement("p");
        placeholder.appendChild(p);

        // create second placeholder block
        const div2 = document.createElement("div");
        div2.classList.add("placeholder", "col-8");
        placeholder.appendChild(div2);

        // create first span placeholder
        const span1 = document.createElement("span");
        span1.classList.add("placeholder", "col-5", "me-2");
        placeholder.appendChild(span1);

        // create second span placeholder
        const span2 = document.createElement("span");
        span2.classList.add("placeholder", "col-4");
        placeholder.appendChild(span2);

        // create third placeholder block
        const div3 = document.createElement("div");
        div3.classList.add("placeholder", "col-7");
        placeholder.appendChild(div3);

        return placeholder;
    }

    /**
     * Updates the host element's content using the fetched HTML string.
     * @param {string} response - The raw HTML string fetched from the server.
     */
    _update(response) {
        if (!response) {
            this._element.innerHTML = "";
            return;
        }

        // parse the incoming html into a detached document
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, "text/html");

        // pick the requested selector region or fallback to document body
        let source = doc.querySelector(this._selector);
        if (!source) {
            source = doc.body;
        }

        // use document fragment for efficient batch insertion
        const fragment = document.createDocumentFragment();
        const scriptsToExecute = [];

        // move nodes to fragment and collect scripts
        while (source.firstChild) {
            const node = source.firstChild;
            if (node.tagName === "SCRIPT") {
                scriptsToExecute.push(node);
                // remove original script from source
                source.removeChild(node);
            } else {
                fragment.appendChild(node);
            }
        }

        // clear host and append fragment
        this._element.innerHTML = "";
        this._element.appendChild(fragment);

        // execute scripts that were found in the content
        this._executeScripts(scriptsToExecute);
    }

    /**
     * Executes script elements by recreating them, as inserted script tags
     * via innerHTML or appendChild are not executed by the browser automatically.
     * @param {Array<HTMLScriptElement>} scripts - List of script elements to execute.
     */
    _executeScripts(scripts) {
        scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");

            // copy attributes
            Array.from(oldScript.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
            });

            // copy content
            newScript.textContent = oldScript.textContent;

            // append to host to trigger execution
            this._element.appendChild(newScript);

            // optionally remove script tag after execution to keep dom clean
            // this._element.removeChild(newScript);
        });
    }

    /**
     * Renders an error message structure into the host element.
     * @param {Error} error - The error object caught during fetch.
     */
    _renderError(error) {
        this._element.innerHTML = "";

        // the error box is a section: a headline that says what failed, over a body with the
        // detail a reader only wants when they are debugging. the alert supplies the surface,
        // so the section stays flat and draws no guide line inside it
        const errorSection = document.createElement("section");
        errorSection.setAttribute("data-header", this._i18n("webexpress.webui:page.contentNotLoaded.label", "Content could not be loaded."));
        errorSection.setAttribute("data-label-css", "fw-bold");
        errorSection.setAttribute("data-header-icon-css", "wx-icon-light wx-icon-light-triangle-exclamation text-warning");
        errorSection.setAttribute("data-expanded", "false");
        errorSection.setAttribute("data-guide", "false");
        errorSection.setAttribute("data-persist", "false");
        errorSection.className = "mb-2 alert alert-danger wx-section-verbatim";

        // prepare error message
        const messageDiv = document.createElement("div");
        messageDiv.className = "mb-2";
        messageDiv.textContent = this._i18n("webexpress.webui:page.contentNotLoaded.details", "An error occurred while loading external content.");

        // prepare stacktrace if available
        const stackDiv = document.createElement("pre");
        stackDiv.className = "bg-light border rounded p-2 mb-0";
        if (typeof error === "object" && error !== null && error.stack) {
            stackDiv.textContent = error.stack;
        } else {
            stackDiv.textContent = String(error);
        }

        // add message and stacktrace to the section content
        errorSection.appendChild(messageDiv);
        errorSection.appendChild(stackDiv);

        // initialize the SectionCtrl
        new webexpress.webui.SectionCtrl(errorSection);

        // render the error container
        this._element.appendChild(errorSection);
    }

    /**
     * Loads content from the configured URI into the host element.
     * Dispatches DATA_REQUESTED_EVENT before fetching, and DATA_ARRIVED_EVENT after successful update.
     */
    load() {
        // an empty uri is a request to show nothing
        if (!this._uri) {
            this._element.innerHTML = "";
            return;
        }

        // the placeholder only earns its place while there is nothing to look
        // at. Swapping content that is already on screen for a skeleton says
        // nothing the content does not already say and costs a visible flash on
        // every reload, so the outgoing content stays until its replacement is
        // ready and _update() exchanges the two in one step.
        if (!this._element.firstChild) {
            this._element.appendChild(this._createPlaceholder());
        }

        // notify that data fetching starts
        this._dispatch(webexpress.webui.Event.DATA_REQUESTED_EVENT, { uri: this._uri });

        // perform fetch and update
        fetch(this._uri, { credentials: "same-origin" })
            .then((response) => {
                // ensure http ok
                if (!response.ok) {
                    throw new Error("Failed to load content. HTTP status: " + response.status);
                }
                return response.text();
            })
            .then((html) => {
                this._update(html);

                // notify that data has arrived
                this._dispatch(webexpress.webui.Event.DATA_ARRIVED_EVENT, { uri: this._uri, response: html });
            })
            .catch((error) => {
                this._renderError(error);
            });
    }

    /**
     * Refreshes the embedded content by reloading it from the configured URI.
     */
    refresh() {
        this.load();
    }

    /**
     * Returns the currently configured URI.
     * @returns {string} The active URI value.
     */
    get uri() {
        return this._uri;
    }

    /**
     * Updates the internal URI value without triggering a reload.
     * Use this setter when you only want to change the URI.
     * @param {string} value - The new URI to assign.
     */
    set uri(value) {
        // update internal uri and optionally reload
        this._uri = String(value || "");

        this.load();
    }
};

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-frame", webexpress.webui.FrameCtrl);