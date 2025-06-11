/**
 * A split control for resizable container panels.
 * Unterstützte Events:
 * - webexpress.webui.Event.SIZE_CHANGE_EVENT
 * - webexpress.webui.Event.HIDE_EVENT
 * - webexpress.webui.Event.SHOW_EVENT
 */
webexpress.webui.SplitCtrl = class extends webexpress.webui.Ctrl {
    _value = "";

    /**
     * Konstruktor
     * @param {HTMLElement} element - Das DOM-Element für das Split-Control.
     */
    constructor(element) {
        super(element);

        // store the element reference
        this._element = element;

        // read configuration from attributes
        this._orientation = element.getAttribute("data-orientation") === "vertical" ? "vertical" : "horizontal";
        this._maxFirst = parseInt(element.getAttribute("data-max-first"), 10) || 400;

        // build UI elements
        this._container1 = element.querySelector(".container1") || document.createElement("div");
        this._container2 = element.querySelector(".container2") || document.createElement("div");
        this._splitter = document.createElement("div");

        this._container1.classList.add("container1");
        this._container2.classList.add("container2");
        this._splitter.classList.add("splitter");

        // add indicator to splitter
        const indicator = document.createElement("div");
        indicator.classList.add("splitter-indicator");
        this._splitter.appendChild(indicator);

        // clean up DOM and add built elements
        element.removeAttribute("data-orientation");
        element.removeAttribute("data-max-first");
        element.innerHTML = "";

        // switch to implementation classes
        element.classList.remove("wx-webui-split");
        element.classList.add("wx-split");
        if (this._orientation === "vertical") {
            element.classList.add("wx-split-vertical");
        } else {
            element.classList.add("wx-split-horizontal");
        }

        element.appendChild(this._container1);
        element.appendChild(this._splitter);
        element.appendChild(this._container2);

        // set initial size
        this._firstSize = Math.min(this._maxFirst, (this._orientation === "vertical" ? element.clientHeight : element.clientWidth) / 2);
        this._setPaneSizes(this._firstSize);

        // handle splitter drag
        this._splitter.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this._dragging = true;
            document.body.classList.add("wx-split-noselect");

            // mousemove handler
            const onDrag = (ev) => {
                if (!this._dragging) return;
                const rect = this._element.getBoundingClientRect();
                let newSize;
                if (this._orientation === "vertical") {
                    newSize = ev.clientY - rect.top;
                } else {
                    newSize = ev.clientX - rect.left;
                }
                this._setPaneSizes(newSize, true); // true = fire event
            };

            // mouseup handler
            const onStopDrag = () => {
                this._dragging = false;
                document.body.classList.remove("wx-split-noselect");
                window.removeEventListener("mousemove", onDrag);
                window.removeEventListener("mouseup", onStopDrag);
            };

            window.addEventListener("mousemove", onDrag);
            window.addEventListener("mouseup", onStopDrag);
        });

        // handle show/hide events
        element.addEventListener(webexpress.webui.Event.HIDE_EVENT, (e) => {
            element.style.display = "none";
        });
        element.addEventListener(webexpress.webui.Event.SHOW_EVENT, (e) => {
            element.style.display = "";
        });
    }

    // sets the size of both containers
    _setPaneSizes(firstSize, fireEvent = false) {
        this._firstSize = Math.min(this._maxFirst, Math.max(0, firstSize));
        if (this._orientation === "vertical") {
            this._container1.style.height = this._firstSize + "px";
            //this._container1.style.flex = "0 0 " + this._firstSize + "px";
            //this._container2.style.flex = "1 1 0";
            this._container1.style.width = "";
            this._container2.style.width = "";
        } else {
            this._container1.style.width = this._firstSize + "px";
            //this._container1.style.flex = "0 0 " + this._firstSize + "px";
            //this._container2.style.flex = "1 1 0";
            this._container1.style.height = "";
            this._container2.style.height = "";
        }
        // fire size change event if requested
        if (fireEvent) {
            const evt = new CustomEvent(webexpress.webui.Event.SIZE_CHANGE_EVENT, {
                detail: {
                    size: this._firstSize,
                    orientation: this._orientation
                }
            });
            this._element.dispatchEvent(evt);
        }
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-split", webexpress.webui.SplitCtrl);