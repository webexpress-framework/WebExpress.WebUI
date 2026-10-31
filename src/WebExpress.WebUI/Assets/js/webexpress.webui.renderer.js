var webexpress = webexpress || {}
webexpress.webui = webexpress.webui || {}

/**
 * View renderer, part of the View, State and Service architecture.
 *
 * The renderer belongs to WebUI, because the reconciler form of a view is not tied to
 * data: a WebUI control on webexpress.webui.StateCtrl renders through it as well as a
 * WebApp control on the Data base, whose services and ViewStates stay in WebApp.
 *
 * The renderer turns a lightweight virtual node tree into DOM through a keyed
 * reconciler. It applies the minimal set of mutations, preserves focus by
 * moving existing nodes rather than recreating them, and preserves nested
 * controls through a keep flag that tells the reconciler not to touch the
 * children of a node. The view layer is a pure function of state, so a render
 * never performs input or output.
 *
 * A virtual node is either an element node produced by h, of the shape
 * { tag, props, key, keep, children }, or a text node of the shape { text }.
 * Props support class, style as a string or an object, dataset as an object,
 * on as a map of event name to handler, value and checked for inputs, html as
 * an inner html escape hatch, ref as a callback, key for reconciliation and
 * keep to protect a subtree. adopt places an existing node (a server rendered part,
 * the element of a nested control) into the tree. An svg element and everything below it is created in
 * the SVG namespace, except the content of a foreignObject, which is HTML again.
 */
;(function () {
    "use strict";

    const RESERVED = { key: true, keep: true, ref: true, children: true };
    const SVG_NS = "http://www.w3.org/2000/svg";

    /**
     * Determines the namespace the children of an element are created in.
     * @param {Element} parent - The parent element.
     * @returns {string|null} The SVG namespace inside an svg, null for HTML.
     */
    function childNamespace(parent) {
        return parent && parent.namespaceURI === SVG_NS
            && String(parent.tagName).toLowerCase() !== "foreignobject" ? SVG_NS : null;
    }

    /**
     * Tells whether a node's children come from its html prop. Those children are the
     * markup's, so reconciling them against the (empty) virtual children would remove what
     * the prop put there on every render after the first.
     * @param {object} vnode - The virtual node.
     * @returns {boolean} True when the node carries an html prop.
     */
    function ownsMarkup(vnode) {
        const props = vnode.props || {};
        return (props.html !== undefined && props.html !== null) || (props.innerHTML !== undefined && props.innerHTML !== null);
    }

    /**
     * Tells whether an element lives in the SVG namespace, where className is read only and
     * the class has to be written as an attribute.
     * @param {Element} el - The element.
     * @returns {boolean} True for an SVG element.
     */
    function isSvg(el) {
        return el.namespaceURI === SVG_NS;
    }

    /**
     * Determines whether a virtual node is a text node.
     * @param {object} vnode - The virtual node.
     * @returns {boolean} True for a text node.
     */
    function isText(vnode) {
        return vnode && vnode.text !== undefined && vnode.tag === undefined;
    }

    /**
     * Flattens a children argument into a list of virtual nodes, dropping null,
     * undefined and boolean values and turning primitives into text nodes.
     * @param {*} children - A child or an array of children.
     * @returns {Array<object>} The normalised list of virtual nodes.
     */
    function normalize(children) {
        const out = [];

        const walk = (child) => {
            if (child === null || child === undefined || child === false || child === true) {
                return;
            }
            if (Array.isArray(child)) {
                child.forEach(walk);
                return;
            }
            if (typeof child === "object" && (child.tag !== undefined || child.text !== undefined || child.dom !== undefined)) {
                out.push(child);
                return;
            }
            out.push({ text: String(child) });
        };

        walk(children);

        return out;
    }

    /**
     * Determines whether an existing DOM node has the same type as a virtual
     * node, which is the condition for reusing it instead of recreating it.
     * @param {Node} dom - The existing DOM node.
     * @param {object} vnode - The virtual node.
     * @returns {boolean} True when the types match.
     */
    function sameType(dom, vnode) {
        if (isText(vnode)) {
            return dom.nodeType === 3;
        }
        if (dom.nodeType !== 1) {
            return false;
        }
        // the local name keeps the case of an SVG element (foreignObject) and is lower
        // case for HTML, so it matches the tag of the view without a conversion
        return dom.localName === vnode.tag
            || (!!dom.tagName && dom.tagName.toLowerCase() === String(vnode.tag).toLowerCase());
    }

    /**
     * Tells whether the children of a parent already stand as the virtual nodes ask:
     * as many, in the same order, each of the same type and key, none of them adopted.
     * @param {NodeList} current - The present children.
     * @param {Array<object>} next - The normalised virtual nodes.
     * @returns {boolean} True when every child can be patched where it stands.
     */
    function inPlace(current, next) {
        if (current.length !== next.length) {
            return false;
        }
        for (let i = 0; i < next.length; i++) {
            const vnode = next[i];
            const dom = current[i];
            if (vnode.dom !== undefined || dom._wxadopted || !sameType(dom, vnode)) {
                return false;
            }
            if (!isText(vnode) && (dom._wxkey ?? null) !== (vnode.key ?? null)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Adds, updates and removes event listeners so that the attached set
     * matches the new handler map. Stable handlers are left in place.
     * @param {Element} el - The element.
     * @param {object} newHandlers - A map of event name to handler.
     */
    function updateEvents(el, newHandlers) {
        const attached = el._wxlisteners || (el._wxlisteners = {});
        newHandlers = newHandlers || {};

        for (const type of Object.keys(attached)) {
            if (attached[type] !== newHandlers[type]) {
                el.removeEventListener(type, attached[type]);
                delete attached[type];
            }
        }

        for (const type of Object.keys(newHandlers)) {
            if (typeof newHandlers[type] === "function" && attached[type] !== newHandlers[type]) {
                el.addEventListener(type, newHandlers[type]);
                attached[type] = newHandlers[type];
            }
        }
    }

    /**
     * Applies a single property to an element.
     * @param {Element} el - The element.
     * @param {string} key - The property name.
     * @param {*} value - The new value.
     * @param {*} oldValue - The previous value, used to diff style and dataset.
     */
    function setProp(el, key, value, oldValue) {
        if (key === "class" || key === "className") {
            const className = Array.isArray(value) ? value.filter(Boolean).join(" ") : (value || "");
            if (isSvg(el)) {
                el.setAttribute("class", className);
            } else {
                el.className = className;
            }
        } else if (key === "style") {
            if (typeof value === "string") {
                el.style.cssText = value;
            } else if (value && typeof value === "object") {
                // a custom property (--name) is no member of the style object, it is only
                // reachable through setProperty and removeProperty
                if (oldValue && typeof oldValue === "object") {
                    for (const k of Object.keys(oldValue)) {
                        if (!(k in value)) {
                            if (k.startsWith("--")) {
                                el.style.removeProperty(k);
                            } else {
                                el.style[k] = "";
                            }
                        }
                    }
                }
                const previous = oldValue && typeof oldValue === "object" ? oldValue : null;
                for (const k of Object.keys(value)) {
                    // an unchanged declaration is left alone like an unchanged prop: a write
                    // would invalidate the style of the element on every render
                    if (previous && previous[k] === value[k]) {
                        continue;
                    }
                    if (k.startsWith("--")) {
                        el.style.setProperty(k, value[k]);
                    } else {
                        el.style[k] = value[k];
                    }
                }
            } else {
                el.style.cssText = "";
            }
        } else if (key === "dataset") {
            const next = value || {};
            const previous = (oldValue && typeof oldValue === "object") ? oldValue : {};
            for (const k of Object.keys(previous)) {
                if (!(k in next)) {
                    delete el.dataset[k];
                }
            }
            for (const k of Object.keys(next)) {
                el.dataset[k] = next[k];
            }
        } else if (key === "on") {
            updateEvents(el, value || {});
        } else if (key === "value") {
            el.value = value == null ? "" : value;
        } else if (key === "checked") {
            el.checked = !!value;
        } else if (key === "html" || key === "innerHTML") {
            const html = value == null ? "" : String(value);
            if (el.innerHTML !== html) {
                el.innerHTML = html;
            }
        } else {
            if (value === false || value === null || value === undefined) {
                el.removeAttribute(key);
            } else {
                el.setAttribute(key, value === true ? "" : String(value));
            }
        }
    }

    /**
     * Removes a property that is present in the old props but absent in the new
     * props.
     * @param {Element} el - The element.
     * @param {string} key - The property name.
     * @param {*} oldValue - The previous value.
     */
    function removeProp(el, key, oldValue) {
        if (key === "class" || key === "className") {
            if (isSvg(el)) {
                el.removeAttribute("class");
            } else {
                el.className = "";
            }
        } else if (key === "style") {
            el.style.cssText = "";
        } else if (key === "dataset") {
            const previous = (oldValue && typeof oldValue === "object") ? oldValue : {};
            for (const k of Object.keys(previous)) {
                delete el.dataset[k];
            }
        } else if (key === "on") {
            updateEvents(el, {});
        } else if (key === "value") {
            el.value = "";
        } else if (key === "checked") {
            el.checked = false;
        } else if (key === "html" || key === "innerHTML") {
            el.innerHTML = "";
        } else {
            el.removeAttribute(key);
        }
    }

    /**
     * Tells whether a prop has to wait for the children of its element. A select only takes a
     * value one of its options carries, so its value is applied once the options exist.
     * @param {Element} el - The element.
     * @param {string} key - The property name.
     * @returns {boolean} True for the value of a select.
     */
    function deferred(el, key) {
        return key === "value" && el.tagName && el.tagName.toLowerCase() === "select";
    }

    /**
     * Diffs and applies the props of an element.
     * @param {Element} el - The element.
     * @param {object} oldProps - The previous props.
     * @param {object} newProps - The new props.
     * @param {boolean} [late=false] - True applies only the props that wait for the children.
     */
    function applyProps(el, oldProps, newProps, late = false) {
        oldProps = oldProps || {};
        newProps = newProps || {};

        for (const key of Object.keys(oldProps)) {
            if (RESERVED[key] || key in newProps || deferred(el, key) !== late) {
                continue;
            }
            removeProp(el, key, oldProps[key]);
        }

        for (const key of Object.keys(newProps)) {
            if (RESERVED[key] || deferred(el, key) !== late) {
                continue;
            }
            // an unchanged prop is left alone, so a nested control may decorate the node it
            // lives on (a class, an attribute) without the next render taking it away; value
            // and checked are written every time, because the user changes them in the DOM
            if (key in oldProps && oldProps[key] === newProps[key] && key !== "value" && key !== "checked") {
                continue;
            }
            setProp(el, key, newProps[key], oldProps[key]);
        }
    }

    /**
     * Creates a DOM node from a virtual node, recursing into children unless the
     * node is marked to keep its subtree.
     * @param {object} vnode - The virtual node.
     * @param {string|null} [namespace=null] - The namespace of the parent's children.
     * @returns {Node} The created DOM node.
     */
    function createDom(vnode, namespace = null) {
        if (isText(vnode)) {
            return document.createTextNode(String(vnode.text));
        }
        if (vnode.dom !== undefined) {
            return adoptDom(vnode);
        }

        const el = namespace === SVG_NS || String(vnode.tag).toLowerCase() === "svg"
            ? document.createElementNS(SVG_NS, vnode.tag)
            : document.createElement(vnode.tag);
        el._wxkey = vnode.key;
        el._wxkeep = !!vnode.keep;
        applyProps(el, {}, vnode.props || {});
        el._wxprops = vnode.props || {};

        if (!vnode.keep && !ownsMarkup(vnode)) {
            for (const child of normalize(vnode.children)) {
                el.appendChild(createDom(child, childNamespace(el)));
            }
        }
        applyProps(el, {}, vnode.props || {}, true);

        if (vnode.props && typeof vnode.props.ref === "function") {
            vnode.props.ref(el);
        }

        return el;
    }

    /**
     * Takes an existing node into the tree. Its children belong to whoever made it (the
     * server, a nested control), unless the view describes them, as it does for a server
     * rendered container it adds content to; only the props the view states are reconciled.
     * The node is marked, so the reconciler never reuses it for another virtual node by
     * position.
     * @param {object} vnode - The adopting virtual node { dom, props, children }.
     * @returns {Node} The adopted node.
     */
    function adoptDom(vnode) {
        const dom = vnode.dom;
        const previous = dom._wxprops || {};
        dom._wxadopted = true;
        applyProps(dom, previous, vnode.props || {});
        if (vnode.children !== undefined) {
            reconcile(dom, vnode.children);
        }
        applyProps(dom, previous, vnode.props || {}, true);
        dom._wxprops = vnode.props || {};
        return dom;
    }

    /**
     * Patches an existing DOM node to match a virtual node, replacing it when
     * the types differ. Returns the resulting node, which may be a replacement.
     * @param {Node} dom - The existing DOM node.
     * @param {object} vnode - The virtual node.
     * @returns {Node} The resulting DOM node.
     */
    function patchNode(dom, vnode) {
        if (isText(vnode)) {
            if (dom.nodeType === 3) {
                const text = String(vnode.text);
                if (dom.textContent !== text) {
                    dom.textContent = text;
                }
                return dom;
            }
            const replacement = document.createTextNode(String(vnode.text));
            if (dom.parentNode) {
                dom.parentNode.replaceChild(replacement, dom);
            }
            return replacement;
        }

        if (!sameType(dom, vnode)) {
            const replacement = createDom(vnode, childNamespace(dom.parentNode));
            if (dom.parentNode) {
                dom.parentNode.replaceChild(replacement, dom);
            }
            return replacement;
        }

        const previous = dom._wxprops || {};
        applyProps(dom, previous, vnode.props || {});
        dom._wxprops = vnode.props || {};
        dom._wxkey = vnode.key;
        dom._wxkeep = !!vnode.keep;

        if (!vnode.keep && !ownsMarkup(vnode)) {
            reconcile(dom, vnode.children);
        }
        applyProps(dom, previous, vnode.props || {}, true);

        if (vnode.props && typeof vnode.props.ref === "function") {
            vnode.props.ref(dom);
        }

        return dom;
    }

    /**
     * Reconciles the children of a parent element with a list of virtual nodes
     * using keys where present and position otherwise. Existing nodes are
     * reused and moved rather than recreated, which preserves focus and nested
     * controls.
     * @param {Element} parent - The parent element.
     * @param {*} nextChildren - The new children.
     */
    function reconcile(parent, nextChildren) {
        const next = normalize(nextChildren);

        // most renders change attributes and leave the structure as it was: then every
        // node is patched where it stands, without the bookkeeping a reorder needs
        if (inPlace(parent.childNodes, next)) {
            for (let i = 0; i < next.length; i++) {
                patchNode(parent.childNodes[i], next[i]);
            }
            return;
        }

        const existing = Array.prototype.slice.call(parent.childNodes);
        const keyedOld = new Map();

        for (const node of existing) {
            if (node._wxkey !== null && node._wxkey !== undefined) {
                keyedOld.set(node._wxkey, node);
            }
        }

        const used = new Set();
        const result = [];
        // nodes this pass adopts are claimed up front, so none of them is lent to another
        // virtual node by position before its own turn comes
        const claimed = new Set(next.filter((vnode) => vnode.dom !== undefined).map((vnode) => vnode.dom));

        for (let i = 0; i < next.length; i++) {
            const vnode = next[i];
            let dom = null;

            if (vnode.dom !== undefined) {
                dom = adoptDom(vnode);
                used.add(dom);
            } else if (!isText(vnode) && vnode.key !== null && vnode.key !== undefined && keyedOld.has(vnode.key)) {
                const match = keyedOld.get(vnode.key);
                if (!used.has(match) && sameType(match, vnode)) {
                    dom = patchNode(match, vnode);
                    used.add(match);
                }
            }

            if (dom === null) {
                const candidate = existing[i];
                const candidateReusable = candidate &&
                    !candidate._wxadopted &&
                    !claimed.has(candidate) &&
                    (candidate._wxkey === null || candidate._wxkey === undefined) &&
                    !used.has(candidate) &&
                    sameType(candidate, vnode) &&
                    (isText(vnode) || vnode.key === null || vnode.key === undefined);

                if (candidateReusable) {
                    dom = patchNode(candidate, vnode);
                    used.add(candidate);
                } else {
                    dom = createDom(vnode, childNamespace(parent));
                }
            }

            result.push(dom);
        }

        const resultSet = new Set(result);

        for (const node of existing) {
            if (!resultSet.has(node) && node.parentNode === parent) {
                parent.removeChild(node);
            }
        }

        for (let i = 0; i < result.length; i++) {
            const dom = result[i];
            const current = parent.childNodes[i] || null;
            if (current !== dom) {
                parent.insertBefore(dom, current);
            }
        }
    }

    /**
     * Creates an element virtual node.
     * @param {string} tag - The element tag name.
     * @param {object} [props] - The element props.
     * @param {...*} children - The child nodes.
     * @returns {object} The element virtual node.
     */
    function h(tag, props, ...children) {
        props = props || {};
        return {
            tag: tag,
            props: props,
            key: props.key !== undefined && props.key !== null ? props.key : null,
            keep: !!props.keep,
            children: children
        };
    }

    /**
     * Creates a virtual node that places an existing node into the tree: a server rendered
     * part or the element of a nested control a view did not create. The node keeps its
     * identity; only the given props are reconciled. Its children stay its own, unless the
     * view states them: a control that decorates server markup describes the content of the
     * container it adds to, whose own children it takes over through adopt in turn.
     * @param {Node} node - The existing node.
     * @param {object} [props] - The props the view states for it, such as hidden.
     * @param {*} [children] - The children the view describes for it.
     * @returns {object} The adopting virtual node.
     */
    function adopt(node, props, children) {
        return { dom: node, props: props || {}, children: children };
    }

    /**
     * Patches a container so that its children match the given virtual node or
     * list of virtual nodes. This is the public entry point for the view layer.
     * @param {Element} container - The container element.
     * @param {object|Array<object>} next - The virtual node tree.
     */
    function patch(container, next) {
        reconcile(container, Array.isArray(next) ? next : [next]);
    }

    /**
     * Removes the listeners the renderer attached to a node and to every node below it.
     * A control calls this on teardown, because a node it detaches keeps its listeners,
     * and a host that still holds the node would keep the control alive through them.
     * @param {Node} node - The root of the subtree.
     */
    function release(node) {
        if (!node) {
            return;
        }
        if (node._wxlisteners) {
            updateEvents(node, {});
        }
        const children = node.childNodes ? Array.prototype.slice.call(node.childNodes) : [];
        for (const child of children) {
            release(child);
        }
    }

    webexpress.webui.h = h;
    webexpress.webui.Renderer = {
        h: h,
        adopt: adopt,
        patch: patch,
        release: release,
        normalize: normalize
    };
})();
