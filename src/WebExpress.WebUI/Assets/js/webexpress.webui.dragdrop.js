/**
 * One drag-and-drop protocol for the data controls, so that a row of a table, a tile or a list
 * item can be dropped onto a tree node or another row, and every target looks and answers alike.
 *
 * A drag source is an element with data-wx-drag="<id>" and an optional data-wx-drag-kind; the
 * element also needs draggable="true". A drag started on a selected source (aria-selected="true")
 * carries every selected source of its scope - the nearest data-wx-drag-scope ancestor - so a
 * multi-selection moves as one.
 *
 * A drop target is an element with data-wx-drop="<id>" and an optional data-wx-drop-kind. Optional
 * data-wx-drop-accept lists the source kinds the target takes (space separated). A target with
 * data-wx-drop-position="edges" also takes items above and below itself - for sources of its own
 * kind only, the reorder of siblings; data-wx-drop-into="false" leaves only those edges, and
 * data-wx-drop-into="other" leaves only those edges to its own kind while sources of another kind
 * are still dropped into it - a card that is reordered among cards and takes a file onto itself.
 *
 * While a drag is over a target, the cancelable CHECK_EVENT bubbles from it with
 * { sources, origin, target, effect }; a listener that calls preventDefault refuses the target,
 * which is then drawn as refused. A drop on an accepted target dispatches the bubbling DROP_EVENT
 * with the same detail. The origin is the element the drag started on, so a control can tell its
 * own items from those of another control that happen to carry the same ids. The protocol never changes the page itself: the control that owns the data moves it.
 *
 * Only drags the protocol started are handled; the editor and the upload keep their own.
 */
webexpress.webui.DragDrop = class {
    /** The bubbling event of an accepted drop: { sources, target, effect }. */
    static DROP_EVENT = webexpress.webui.Event.DROP_EVENT;

    /** The cancelable event that asks whether a target takes the dragged sources. */
    static CHECK_EVENT = webexpress.webui.Event.DROP_CHECK_EVENT;

    /** The data type the protocol's drags carry, so other drop zones can tell them apart. */
    static TYPE = "application/x-webexpress-items";

    static _drag = null;
    static _target = null;
    static _installed = false;

    /**
     * Installs the document listeners once. The protocol works by delegation, so sources and
     * targets that a control renders later take part without registering.
     */
    static install() {
        if (webexpress.webui.DragDrop._installed || typeof document === "undefined") {
            return;
        }
        webexpress.webui.DragDrop._installed = true;

        const self = webexpress.webui.DragDrop;
        document.addEventListener("dragstart", (e) => self._onDragStart(e));
        document.addEventListener("dragover", (e) => self._onDragOver(e));
        document.addEventListener("dragleave", (e) => self._onDragLeave(e));
        document.addEventListener("drop", (e) => self._onDrop(e));
        document.addEventListener("dragend", () => self._end());
    }

    /**
     * Returns the sources a drag started on an element carries.
     * @param {HTMLElement} element - The dragged source element.
     * @returns {Array<object>} The sources { id, kind }.
     */
    static sourcesOf(element) {
        const one = (el) => ({ id: el.getAttribute("data-wx-drag"), kind: el.getAttribute("data-wx-drag-kind") || null });

        if (element.getAttribute("aria-selected") === "true") {
            const scope = element.closest("[data-wx-drag-scope]");
            if (scope) {
                const selected = Array.from(scope.querySelectorAll("[data-wx-drag][aria-selected=\"true\"]"));
                if (selected.length > 0) {
                    return selected.map(one);
                }
            }
        }

        return [one(element)];
    }

    /**
     * Returns the attributes that make an element of a control a source or a target of the
     * protocol, for a control that renders through virtual nodes.
     * @param {string} id - The id the element stands for.
     * @param {object} options - dragKind to make it a source, dropKind to make it a target.
     * @returns {object} The attributes; empty when the element takes no part.
     */
    static attributes(id, options = {}) {
        const attributes = {};
        if (id === null || id === undefined || id === "") {
            return attributes;
        }
        if (options.dragKind) {
            attributes.draggable = "true";
            attributes["data-wx-drag"] = String(id);
            attributes["data-wx-drag-kind"] = options.dragKind;
        }
        if (options.dropKind) {
            attributes["data-wx-drop"] = String(id);
            attributes["data-wx-drop-kind"] = options.dropKind;
        }
        return attributes;
    }

    /**
     * Sets the attributes of the protocol on an element a control builds by hand.
     * @param {HTMLElement} element - The element.
     * @param {string} id - The id the element stands for.
     * @param {object} options - dragKind and dropKind, as for attributes.
     */
    static decorate(element, id, options = {}) {
        for (const [name, value] of Object.entries(webexpress.webui.DragDrop.attributes(id, options))) {
            element.setAttribute(name, value);
        }
    }

    /**
     * Returns the drag in progress, or null.
     * @returns {object|null} The sources and their origin element.
     */
    static get current() {
        return webexpress.webui.DragDrop._drag;
    }

    /**
     * Starts a drag on a source of the protocol.
     * @param {DragEvent} e - The native event.
     */
    static _onDragStart(e) {
        const element = e.target && e.target.closest ? e.target.closest("[data-wx-drag]") : null;
        if (!element || e.defaultPrevented) {
            return;
        }

        const sources = webexpress.webui.DragDrop.sourcesOf(element);
        webexpress.webui.DragDrop._drag = { sources, origin: element };

        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setData(webexpress.webui.DragDrop.TYPE, JSON.stringify(sources));
            // a plain text copy lets the drag land in a text field as the ids
            e.dataTransfer.setData("text/plain", sources.map((x) => x.id).join(", "));
        }

        for (const source of webexpress.webui.DragDrop._sourceElements(element, sources)) {
            source.classList.add("wx-dragging");
        }
    }

    /**
     * Follows the drag over a target: decides the position, asks the target and draws the answer.
     * @param {DragEvent} e - The native event.
     */
    static _onDragOver(e) {
        const drag = webexpress.webui.DragDrop._drag;
        const element = drag && e.target && e.target.closest ? e.target.closest("[data-wx-drop]") : null;
        if (!element) {
            webexpress.webui.DragDrop._mark(null);
            return;
        }

        const target = webexpress.webui.DragDrop._describe(element, drag.sources, e);
        const effect = webexpress.webui.DragDrop._effect(e);
        const allowed = target !== null && webexpress.webui.DragDrop._check(element, drag, target, effect);

        webexpress.webui.DragDrop._mark(element, allowed ? target.position : "blocked");

        if (allowed) {
            // the default refuses every drop; preventing it is how a target says yes
            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = effect;
            }
        }
    }

    /**
     * Clears the mark of a target the drag left for a place outside of it.
     * @param {DragEvent} e - The native event.
     */
    static _onDragLeave(e) {
        const current = webexpress.webui.DragDrop._target;
        if (current && (!e.relatedTarget || !current.contains(e.relatedTarget))) {
            webexpress.webui.DragDrop._mark(null);
        }
    }

    /**
     * Announces a drop on an accepted target.
     * @param {DragEvent} e - The native event.
     */
    static _onDrop(e) {
        const drag = webexpress.webui.DragDrop._drag;
        const element = drag && e.target && e.target.closest ? e.target.closest("[data-wx-drop]") : null;
        if (!element) {
            return;
        }

        const target = webexpress.webui.DragDrop._describe(element, drag.sources, e);
        const effect = webexpress.webui.DragDrop._effect(e);
        const allowed = target !== null && webexpress.webui.DragDrop._check(element, drag, target, effect);

        e.preventDefault();

        // the drag ends only after its drop was announced: a listener may still ask for the
        // drag in progress, and the origin travels with the detail for those that do not
        try {
            if (allowed) {
                element.dispatchEvent(new CustomEvent(webexpress.webui.DragDrop.DROP_EVENT, {
                    bubbles: true,
                    detail: { sources: drag.sources, origin: drag.origin, target: target, effect: effect }
                }));
            }
        } finally {
            webexpress.webui.DragDrop._end();
        }
    }

    /**
     * Describes a target for the sources over it: its id, kind and the position the drop takes.
     * @param {HTMLElement} element - The target element.
     * @param {Array<object>} sources - The dragged sources.
     * @param {DragEvent} e - The native event, for the pointer position.
     * @returns {object|null} The target, or null when the target takes none of the sources.
     */
    static _describe(element, sources, e) {
        const id = element.getAttribute("data-wx-drop");
        const kind = element.getAttribute("data-wx-drop-kind") || null;
        const accept = (element.getAttribute("data-wx-drop-accept") || "").split(/\s+/).filter((x) => x);
        if (accept.length > 0 && !sources.every((x) => accept.includes(x.kind))) {
            return null;
        }

        // a source is never dropped onto itself
        if (sources.some((x) => x.id === id && x.kind === kind)) {
            return null;
        }

        const ownKind = sources.every((x) => x.kind === kind);
        const intoMode = element.getAttribute("data-wx-drop-into");
        const into = intoMode !== "false" && !(intoMode === "other" && ownKind);
        let position = "into";

        if (element.getAttribute("data-wx-drop-position") === "edges" && ownKind) {
            const rect = element.getBoundingClientRect();
            const offset = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5;
            position = offset < 0.25 ? "above" : (offset > 0.75 ? "below" : "into");
            if (position === "into" && !into) {
                position = offset < 0.5 ? "above" : "below";
            }
        } else if (!into) {
            return null;
        }

        return { id: id, kind: kind, position: position, element: element };
    }

    /**
     * Asks the target's ancestors whether the drop is allowed.
     * @param {HTMLElement} element - The target element.
     * @param {object} drag - The drag in progress: its sources and its origin.
     * @param {object} target - The described target.
     * @param {string} effect - The drop effect.
     * @returns {boolean} False when a listener refused the target.
     */
    static _check(element, drag, target, effect) {
        const event = new CustomEvent(webexpress.webui.DragDrop.CHECK_EVENT, {
            bubbles: true,
            cancelable: true,
            detail: { sources: drag.sources, origin: drag.origin, target: target, effect: effect }
        });
        element.dispatchEvent(event);
        return event.defaultPrevented !== true;
    }

    /**
     * Returns the effect the user asks for: copy with Ctrl (Option on a Mac), otherwise a move.
     * @param {DragEvent} e - The native event.
     * @returns {string} "copy" or "move".
     */
    static _effect(e) {
        return e.ctrlKey || e.altKey ? "copy" : "move";
    }

    /**
     * Draws the state of the target under the pointer with the shared drop marks: an area for
     * into, a line for above and below, the refused area for a target that says no.
     * @param {HTMLElement|null} element - The target, or null to clear.
     * @param {string} [state] - "into", "above", "below" or "blocked".
     */
    static _mark(element, state) {
        const previous = webexpress.webui.DragDrop._target;
        if (previous && previous !== element) {
            previous.classList.remove("wx-drag-over", "wx-drag-blocked");
            previous.removeAttribute("data-wx-drop-at");
        }

        webexpress.webui.DragDrop._target = element;
        if (!element) {
            return;
        }

        element.classList.toggle("wx-drag-over", state === "into");
        element.classList.toggle("wx-drag-blocked", state === "blocked");
        if (state === "above" || state === "below") {
            element.setAttribute("data-wx-drop-at", state);
        } else {
            element.removeAttribute("data-wx-drop-at");
        }
    }

    /**
     * Ends the drag and removes every mark it left.
     */
    static _end() {
        const drag = webexpress.webui.DragDrop._drag;
        if (drag) {
            for (const source of webexpress.webui.DragDrop._sourceElements(drag.origin, drag.sources)) {
                source.classList.remove("wx-dragging");
            }
        }
        webexpress.webui.DragDrop._mark(null);
        webexpress.webui.DragDrop._drag = null;
    }

    /**
     * Returns the elements of the dragged sources, for the dragging mark.
     * @param {HTMLElement} origin - The element the drag started on.
     * @param {Array<object>} sources - The dragged sources.
     * @returns {Array<HTMLElement>} The source elements.
     */
    static _sourceElements(origin, sources) {
        const scope = origin && origin.closest ? origin.closest("[data-wx-drag-scope]") : null;
        if (!scope || sources.length < 2) {
            return origin ? [origin] : [];
        }
        const ids = new Set(sources.map((x) => x.id));
        return Array.from(scope.querySelectorAll("[data-wx-drag]")).filter((x) => ids.has(x.getAttribute("data-wx-drag")));
    }
};

webexpress.webui.DragDrop.install();
