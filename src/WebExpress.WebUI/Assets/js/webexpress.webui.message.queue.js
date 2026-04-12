/**
 * Control for managing a message queue over a WebSocket connection.
 * The following events are triggered:
 * - webexpress.webui.Event.WS_OPEN_EVENT
 * - webexpress.webui.Event.WS_MESSAGE_EVENT
 * - webexpress.webui.Event.WS_CLOSE_EVENT
 * - webexpress.webui.Event.WS_ERROR_EVENT
 */
webexpress.webui.MessageQueueCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element associated with this instance.
     */
    constructor(element) {
        super(element);

        // initialize core properties
        this._status = "offline";
        this._url = element.dataset.uri || null;
        this._queueMax = parseInt(element.dataset.queueMax) || 10;
        this._queue = [];
        this._ws = null;
        this._lastError = null; // stores last error string if any

        // add base CSS classes
        element.classList.add("wx-messagequeue", "messagequeue-indicator");

        // add double-click event listener for reconnect when offline or error
        element.addEventListener("dblclick", (evt) => {
            if (this._status === "offline" || this._status === "error") {
                // set status to connecting, clear error, update UI, and try connecting
                this._status = "connecting";
                this._lastError = null;
                this.update();
                this.connect();
            }
        });

        // render initially
        this.render();

        // connect automatically if a WebSocket URL is provided
        if (this._url) {
            this.connect();
        }
    }

    /**
     * Opens a WebSocket connection to the server.
     */
    connect() {
        if (this._ws) {
            this._ws.close();
        }
        // set status to connecting while establishing the connection
        this._status = "connecting";
        this._lastError = null;
        this.update();

        try {
            this._ws = new WebSocket(this._url);
        } catch (e) {
            // handle synchronous errors (rare for WebSocket constructor)
            this._status = "error";
            this._lastError = e && e.message ? e.message : this._i18n("webexpress.webui:websocket.error", "WebSocket connection error");
            this.update();
            return;
        }

        this._ws.addEventListener("open", (evt) => {
            // update status and inform listeners
            this._status = "online";
            this._lastError = null;
            this.update();
            this._dispatch(webexpress.webui.Event.WS_OPEN_EVENT, { event: evt });
        });

        this._ws.addEventListener("message", (evt) => {
            // enqueue message
            this.enqueue(evt.data);
            this._dispatch(webexpress.webui.Event.WS_MESSAGE_EVENT, { event: evt, data: evt.data });
            this.update();
        });

        this._ws.addEventListener("close", (evt) => {
            // if error occurred during connecting, set error
            if (this._status === "connecting" && this._lastError) {
                this._status = "error";
            } else if (this._status !== "error") {
                this._status = "offline";
                this._lastError = null;
            }
            this.update();
            this._dispatch(webexpress.webui.Event.WS_CLOSE_EVENT, { event: evt });
        });

        this._ws.addEventListener("error", (evt) => {
            // update status and inform listeners in case of error
            this._status = "error";
            this._lastError = evt && evt.message ? evt.message : this._i18n("webexpress.webui:websocket.failed", "WebSocket connection failed");
            this.update();
            this._dispatch(webexpress.webui.Event.WS_ERROR_EVENT, { event: evt });
        });
    }

    /**
     * Enqueues a message in the queue.
     * Removes oldest messages if the queue exceeds its maximum size.
     * @param {string} msg - The new message.
     */
    enqueue(msg) {
        this._queue.push(msg);
        while (this._queue.length > this._queueMax) {
            this._queue.shift();
        }
    }

    /**
     * Closes the current WebSocket connection.
     */
    disconnect() {
        if (this._ws) {
            this._ws.close();
            this._ws = null;
        }
    }

    /**
     * Sends a message via WebSocket.
     * If an object is given, it is sent as JSON.
     * @param {string|Object} message
     */
    send(message) {
        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            if (typeof message === "object") {
                this._ws.send(JSON.stringify(message));
            } else {
                this._ws.send(message);
            }
        }
    }

    /**
     * Returns the current message queue (FIFO).
     * @returns {Array}
     */
    get messages() {
        return this._queue;
    }

    /**
     * Returns the current status.
     * @returns {string}
     */
    get status() {
        return this._status;
    }

    /**
     * Returns the current WebSocket URL.
     * @returns {string|null}
     */
    get wsUrl() {
        return this._url;
    }

    /**
     * Sets a new WebSocket URL and connects automatically if a value is provided.
     * @param {string} value
     */
    set wsUrl(value) {
        this._url = value;
        if (this._url) {
            this.connect();
        }
    }

    /**
     * Sets the maximum queue length and trims the queue if necessary.
     * @param {number} value
     */
    set queueMax(value) {
        this._queueMax = parseInt(value) || 10;
        while (this._queue.length > this._queueMax) {
            this._queue.shift();
        }
        this.update();
    }

    /**
     * Forces a re-render of the control.
     */
    update() {
        this.render();
    }

    /**
     * Renders the control's UI including status indicator and message queue.
     * If status is "error", displays an error indicator and message.
     */
    render() {
        // clear DOM content
        this._element.innerHTML = "";

        // create status indicator (colored LED)
        const statusLight = document.createElement("span");
        statusLight.className = "status-light";
        statusLight.style.display = "inline-block";
        statusLight.style.width = "1em";
        statusLight.style.height = "1em";
        statusLight.style.borderRadius = "50%";
        statusLight.style.marginRight = "0.5em";
        statusLight.style.verticalAlign = "middle";

        let color;
        let statusTextContent = this._status;
        if (this._status === "error") {
            color = "crimson"; // use a "danger" color
            if (this._lastError) {
                // show error message as status
                statusTextContent = `error: ${this._lastError}`;
            }
        } else {
            switch (this._status) {
                case "online": { color = "limegreen"; break; }
                case "connecting": { color = "gold"; break; }
                default: { color = "gray"; }
            }
        }
        statusLight.style.backgroundColor = color;

        // create status text
        const statusText = document.createElement("span");
        statusText.className = "status-text";
        statusText.textContent = statusTextContent;

        // create message queue list
        const msgList = document.createElement("ul");
        msgList.className = "messagequeue-list";
        msgList.style.margin = "0.7em 0 0 0";
        msgList.style.padding = "0";
        msgList.style.listStyle = "none";

        for (let msg of this._queue) {
            const li = document.createElement("li");
            li.style.padding = "0.12em 0";
            // try to pretty-print as JSON if valid, otherwise display as plain string
            try {
                li.textContent = JSON.stringify(JSON.parse(msg), null, 2);
            } catch (e) {
                li.textContent = msg;
            }
            msgList.appendChild(li);
        }

        this._element.appendChild(statusLight);
        this._element.appendChild(statusText);
        this._element.appendChild(msgList);
    }
};

// register the control with the controller
webexpress.webui.Controller.registerClass("wx-webui-message-queue", webexpress.webui.MessageQueueCtrl);