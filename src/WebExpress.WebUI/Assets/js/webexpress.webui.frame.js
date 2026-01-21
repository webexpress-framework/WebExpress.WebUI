/**
 * An inline page embedding controller (iFrame alternative) that loads HTML into a regular div.
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

        // create the expandable error container using ExpandableCtrl
        const expandableDiv = document.createElement("div");
        expandableDiv.setAttribute("data-header", this._i18n("webexpress.webui:frame.contentNotLoaded.label", "Content could not be loaded."));
        expandableDiv.setAttribute("data-headercss", "fw-bold text-danger");
        expandableDiv.setAttribute("data-icon", "fa-solid fa-triangle-exclamation text-warning me-2");
        expandableDiv.setAttribute("data-expanded", "false");
        expandableDiv.className = "mb-2 alert alert-danger";

        // prepare error message
        const messageDiv = document.createElement("div");
        messageDiv.className = "mb-2";
        messageDiv.textContent = this._i18n("webexpress.webui:frame.contentNotLoaded.details", "An error occurred while loading external content.");
        
        // prepare stacktrace if available
        const stackDiv = document.createElement("pre");
        stackDiv.className = "bg-light border rounded p-2 mb-0";
        if (typeof error === "object" && error !== null && error.stack) {
            stackDiv.textContent = error.stack;
        } else {
            stackDiv.textContent = String(error);
        }

        // add message and stacktrace to expandable content
        expandableDiv.appendChild(messageDiv);
        expandableDiv.appendChild(stackDiv);

        // initialize the ExpandableCtrl
        new webexpress.webui.ExpandableCtrl(expandableDiv);

        // render the expandable error container
        this._element.appendChild(expandableDiv);
    }

    /**
     * Loads content from the configured URI into the host element.
     * Dispatches DATA_REQUESTED_EVENT before fetching, and DATA_ARRIVED_EVENT after successful update.
     */
    load() {
        this._element.innerHTML = "";

        // guard against empty uri
        if (!this._uri) {
            return;
        }

        // show a simple loading placeholder
        const placeholder = this._createPlaceholder();
        this._element.appendChild(placeholder);

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
     * Sets a new URI and optionally reloads the content.
     * @param {string} uri - The new URI to fetch content from.
     * @param {boolean} [reload=true] - When true, triggers an immediate reload.
     */
    setUri(uri, reload = true) {
        // update internal uri and optionally reload
        this._uri = String(uri || "");
        if (reload) {
            this.load();
        }
    }
};

// register the class in the controller registry
webexpress.webui.Controller.registerClass("wx-webui-frame", webexpress.webui.FrameCtrl);