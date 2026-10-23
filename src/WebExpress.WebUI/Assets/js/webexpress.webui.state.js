var webexpress = webexpress || {}
webexpress.webui = webexpress.webui || {}

/**
 * The state container of a control that is given none: an observable object whose
 * patches are shallow merges and whose notifications are batched on a microtask, so
 * several patches in one synchronous turn produce a single render.
 *
 * It has the state contract of webexpress.webapp.ViewState (getState, setState,
 * subscribe, flush), because a WebApp control hands its ViewState to the same render
 * loop. WebUI keeps its own container rather than the ViewState, since the ViewState
 * carries the resources, services and registry of the data concept, which WebUI
 * controls have nothing to do with.
 */
webexpress.webui.LocalState = class {
    /**
     * Creates a state container.
     * @param {object} [state={}] - The initial state, copied shallowly.
     */
    constructor(state) {
        this._state = Object.assign({}, state);
        this._listeners = new Set();
        this._notifyScheduled = false;
    }

    /**
     * Returns the current state object, which must be treated as immutable.
     * @returns {object} The current state.
     */
    getState() {
        return this._state;
    }

    /**
     * Convenience accessor for the current state.
     * @returns {object} The current state.
     */
    get state() {
        return this._state;
    }

    /**
     * Applies a shallow patch to the state. The patch may be an object merged into the
     * current state, or a function that receives the current state and returns such an
     * object. Subscribers are notified once on the next microtask, and only when at
     * least one value actually changed, so a patch that repeats the state renders
     * nothing.
     * @param {object|Function} patch - The patch object or a producer function.
     * @returns {object} The resulting state.
     */
    setState(patch) {
        if (typeof patch === "function") {
            patch = patch(this._state);
        }

        if (!patch || typeof patch !== "object") {
            return this._state;
        }

        let changed = false;
        const next = Object.assign({}, this._state);

        for (const key of Object.keys(patch)) {
            if (!Object.is(next[key], patch[key])) {
                next[key] = patch[key];
                changed = true;
            }
        }

        if (!changed) {
            return this._state;
        }

        this._state = next;
        this._scheduleNotify();

        return this._state;
    }

    /**
     * Subscribes a listener to every state change and returns an unsubscribe function.
     * @param {Function} listener - Called with the new state after a change.
     * @returns {Function} An unsubscribe function.
     */
    subscribe(listener) {
        if (typeof listener !== "function") {
            return () => { };
        }

        this._listeners.add(listener);

        return () => {
            this._listeners.delete(listener);
        };
    }

    /**
     * Forces any pending notification to run synchronously. Intended for tests and
     * deterministic teardown, not for normal operation.
     */
    flush() {
        if (this._notifyScheduled) {
            this._notifyScheduled = false;
            this._notify();
        }
    }

    /**
     * Drops every subscriber and a pending notification.
     */
    destroy() {
        this._listeners.clear();
        this._notifyScheduled = false;
    }

    /**
     * Schedules a single batched notification on the microtask queue.
     */
    _scheduleNotify() {
        if (this._notifyScheduled) {
            return;
        }

        this._notifyScheduled = true;

        const run = () => {
            // a flush in between has already delivered this notification
            if (!this._notifyScheduled) {
                return;
            }
            this._notifyScheduled = false;
            this._notify();
        };

        if (typeof queueMicrotask === "function") {
            queueMicrotask(run);
        } else {
            Promise.resolve().then(run);
        }
    }

    /**
     * Notifies all listeners with the current state. A failing listener does not keep
     * the others from their notification.
     */
    _notify() {
        const snapshot = this._state;
        for (const listener of Array.from(this._listeners)) {
            try {
                listener(snapshot);
            } catch (error) {
                console.error("state listener failed", error);
            }
        }
    }
};

/**
 * A LocalState whose notifications wait for the next animation frame instead of the
 * next microtask. A control whose state changes at pointer or simulation rate - a node
 * dragged across a canvas, a layout that settles - would otherwise render once per
 * event; on a frame it renders once per paint, however many changes the frame saw.
 * flush still renders at once, for a discrete action that wants its result shown
 * before it returns.
 */
webexpress.webui.FrameState = class extends webexpress.webui.LocalState {
    /**
     * Schedules a single batched notification on the next animation frame.
     */
    _scheduleNotify() {
        if (this._notifyScheduled) {
            return;
        }

        this._notifyScheduled = true;

        const run = () => {
            this._frame = null;
            // a flush in between has already delivered this notification
            if (!this._notifyScheduled) {
                return;
            }
            this._notifyScheduled = false;
            this._notify();
        };

        const view = typeof window !== "undefined" ? window : null;
        this._frame = view && typeof view.requestAnimationFrame === "function"
            ? { id: view.requestAnimationFrame(run), cancel: (id) => view.cancelAnimationFrame(id) }
            : { id: setTimeout(run, 16), cancel: (id) => clearTimeout(id) };
    }

    /**
     * Delivers a pending notification at once and gives its frame back.
     */
    flush() {
        this._cancelFrame();
        super.flush();
    }

    /**
     * Drops every subscriber and a pending notification together with its frame.
     */
    destroy() {
        this._cancelFrame();
        super.destroy();
    }

    /**
     * Cancels the frame a pending notification waits for.
     */
    _cancelFrame() {
        if (this._frame) {
            this._frame.cancel(this._frame.id);
            this._frame = null;
        }
    }
};

/**
 * The base of a control whose markup is a function of its state.
 *
 * A subclass implements render(state) and returns a virtual node tree built with
 * webexpress.webui.h, which the keyed reconciler (webexpress.webui.Renderer) patches
 * into the render root; handlers change the state, and every change renders again on
 * the next microtask. Imperative work the tree cannot express, such as focus or
 * measuring, runs in onUpdate against nodes captured through ref. A render may also
 * return a DOM node, which replaces the content of the render root, or nothing, for a
 * control that still updates its DOM itself.
 *
 * The state container is exchangeable. A WebUI control keeps a LocalState; the Data
 * base of WebExpress.WebApp, and a WebApp control that extends a WebUI control, hand in
 * a ViewState, so one render loop serves both. The lifecycle hooks are onMount after
 * the first render, onUpdate after every later one and onUnmount on teardown.
 */
webexpress.webui.StateCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Creates a control for a host element.
     * @param {HTMLElement} element - The host element.
     * @param {object} [options={}] - Optional overrides: state (the initial state of a
     *     LocalState), store (a state container to use instead), renderRoot (the node the
     *     tree is patched into, the host by default).
     */
    constructor(element, options = {}) {
        super(element);

        this._mounted = false;
        this._unsubscribe = null;
        this._renderRoot = options.renderRoot || element;
        this._store = options.store || new webexpress.webui.LocalState(options.state);
        this._viewHandlers = new Map();
    }

    /**
     * Returns the current state.
     * @returns {object} The state.
     */
    get state() {
        return this._store.getState();
    }

    /**
     * Returns the container that holds the state of this control.
     * @returns {object} The LocalState or the ViewState.
     */
    get store() {
        return this._store;
    }

    /**
     * Applies a shallow patch to the state.
     * @param {object|Function} patch - The patch.
     * @returns {object} The resulting state.
     */
    setState(patch) {
        return this._store.setState(patch);
    }

    /**
     * Subscribes to the state, performs the first render and runs onMount. A subclass
     * calls this at the end of its constructor once it has finished its own setup.
     * @returns {this} The control for chaining.
     */
    mount() {
        if (this._mounted) {
            return this;
        }

        this._unsubscribe = this._store.subscribe((state) => this._apply(state));
        this._apply(this._store.getState());
        this._mounted = true;

        if (typeof this.onMount === "function") {
            this.onMount(this._store.getState());
        }

        return this;
    }

    /**
     * Renders the current state again. A host that shows a control after it was hidden
     * (the view switch, a tab) calls update; the base Ctrl would call render without a
     * state, which a render of this form cannot answer.
     */
    update() {
        this._apply(this._store.getState());
    }

    /**
     * Moves the control onto another state container and renders it at once. A WebApp
     * control that joins the ViewState of its region after construction moves there.
     * @param {object} store - The state container: a LocalState or a ViewState.
     */
    _useStore(store) {
        if (store === this._store) {
            return;
        }
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }

        this._store = store;

        if (this._mounted) {
            this._unsubscribe = store.subscribe((state) => this._apply(state));
            this._apply(store.getState());
        }
    }

    /**
     * Returns the listener of one item and one purpose, created on first use. A render
     * would otherwise create every listener anew, and the renderer swaps a listener whose
     * identity changed, on every row at every render. A listener names only the id it
     * serves and looks its item up when it runs, so it never acts on a stale one.
     * @param {string} kind - The purpose of the listener.
     * @param {string} id - The id of the item it serves.
     * @param {function(): function} create - Creates the listener.
     * @returns {function} The listener.
     */
    _handler(kind, id, create) {
        const key = kind + "|" + id;
        let handler = this._viewHandlers.get(key);
        if (!handler) {
            handler = create();
            this._viewHandlers.set(key, handler);
        }
        return handler;
    }

    /**
     * Produces the view of a state. The subclass render method by default; the Data
     * base lets a referenced template win.
     * @param {object} state - The state.
     * @returns {*} A virtual node tree, a DOM node or nothing.
     */
    _viewTree(state) {
        return this.render(state);
    }

    /**
     * Renders a state into the render root and runs onUpdate after every render but the
     * first, which mount follows with onMount.
     * @param {object} state - The state.
     */
    _apply(state) {
        const tree = this._viewTree(state);
        const root = this._renderRoot || this._element;

        if (tree !== undefined && tree !== null) {
            if (typeof Node !== "undefined" && tree instanceof Node) {
                root.replaceChildren(tree);
            } else {
                webexpress.webui.Renderer.patch(root, tree);
            }
        }

        if (this._mounted && typeof this.onUpdate === "function") {
            this.onUpdate(state);
        }
    }

    /**
     * Tears the control down: it stops rendering and runs onUnmount.
     */
    destroy() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }

        if (typeof this.onUnmount === "function") {
            this.onUnmount();
        }

        this._mounted = false;

        super.destroy();
    }
};
