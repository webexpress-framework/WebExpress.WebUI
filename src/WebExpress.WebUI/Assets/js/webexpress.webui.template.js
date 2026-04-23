/**
 * Template control with model-driven rendering.
 * Supports placeholders, conditions, foreach, nested templates,
 * dynamic attributes, and action/binding mapping.
 */
webexpress.webui.TemplateCtrl = class extends webexpress.webui.Ctrl {

    _template = null;
    _model = {};
    _modelProxy = null;
    _bindings = new Map();
    _hasStructuralRendering = false;

    /**
     * Creates a template control.
     * @param {HTMLElement} element host element.
     */
    constructor(element) {
        super(element);

        this._template = this._resolveTemplate(element);
        if (this._template && this._template.parentNode === element) {
            this._template.remove();
        }

        this._hasStructuralRendering = this._requiresStructuralRendering(this._template);
        this._modelProxy = this._makeObservable(this._parseInitialModel(element), "");

        element.classList.add("wx-template");
        this.render();
    }

    /**
     * Gets the current model proxy.
     * @returns {Object}
     */
    get model() {
        return this._modelProxy;
    }

    /**
     * Sets a new model and re-renders.
     * @param {Object} value model object.
     */
    set model(value) {
        this._modelProxy = this._makeObservable(value ?? {}, "");
        this._onModelChange("");
    }

    /**
     * Replaces model data.
     * @param {Object} data model.
     */
    setData(data) {
        this.model = data ?? {};
    }

    /**
     * Merges partial data into the current model.
     * @param {Object} partial partial model.
     */
    updateData(partial) {
        if (!partial || typeof partial !== "object") {
            return;
        }

        Object.keys(partial).forEach((key) => {
            this._modelProxy[key] = partial[key];
        });
    }

    /**
     * Sets a value by dot path.
     * @param {string} path path to set.
     * @param {any} value value.
     */
    setValue(path, value) {
        if (typeof path !== "string" || path.trim() === "") {
            return;
        }

        const parts = path.split(".").map((x) => x.trim()).filter((x) => x.length > 0);
        if (parts.length === 0) {
            return;
        }

        let current = this._modelProxy;
        for (let i = 0; i < parts.length - 1; i++) {
            if (current[parts[i]] == null || typeof current[parts[i]] !== "object") {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = value;
    }

    /**
     * Renders the template.
     */
    render() {
        if (!(this._template instanceof HTMLTemplateElement)) {
            this._element.replaceChildren();
            return;
        }

        this._bindings.clear();

        const fragment = this._template.content.cloneNode(true);
        this._processChildNodes(fragment, this._createScope(this._modelProxy, -1, null, this._modelProxy), this._modelProxy);

        const nextNodes = Array.from(fragment.childNodes);
        const currentNodes = Array.from(this._element.childNodes);

        if (this._isSameDom(currentNodes, nextNodes)) {
            return;
        }

        this._element.replaceChildren(...nextNodes);
    }

    /**
     * Resolves the template element.
     * @param {HTMLElement} element host element.
     * @returns {HTMLTemplateElement|null}
     */
    _resolveTemplate(element) {
        const selector = element.dataset.template;
        if (selector) {
            const found = this._findTemplate(selector);
            if (found) {
                return found;
            }
        }

        return element.querySelector(":scope > template, template");
    }

    /**
     * Finds template by selector/id/name.
     * @param {string} selector selector/id/name.
     * @returns {HTMLTemplateElement|null}
     */
    _findTemplate(selector) {
        if (!selector) {
            return null;
        }

        if (selector.startsWith("#")) {
            const byId = document.querySelector(selector);
            return byId instanceof HTMLTemplateElement ? byId : null;
        }

        const byId = document.getElementById(selector);
        if (byId instanceof HTMLTemplateElement) {
            return byId;
        }

        const byName = document.querySelector(`template[data-template-name="${selector}"]`);
        return byName instanceof HTMLTemplateElement ? byName : null;
    }

    /**
     * Parses initial model from data-model JSON.
     * @param {HTMLElement} element host element.
     * @returns {Object}
     */
    _parseInitialModel(element) {
        const value = element.dataset.model;
        if (!value) {
            return {};
        }

        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        } catch (e) {
            console.warn("TemplateCtrl: invalid data-model JSON.", e);
        }

        return {};
    }

    /**
     * Wraps object in observable proxy.
     * @param {any} value value.
     * @param {string} path current path.
     * @returns {any}
     */
    _makeObservable(value, path) {
        if (!value || typeof value !== "object") {
            return value;
        }

        if (value.__wxTemplateProxy === true) {
            return value;
        }

        const self = this;
        const proxy = new Proxy(value, {
            get(target, prop) {
                if (prop === "__wxTemplateProxy") {
                    return true;
                }

                const current = target[prop];
                if (current && typeof current === "object" && current.__wxTemplateProxy !== true) {
                    const childPath = self._joinPath(path, prop.toString());
                    target[prop] = self._makeObservable(current, childPath);
                    return target[prop];
                }
                return current;
            },
            set(target, prop, val) {
                const childPath = self._joinPath(path, prop.toString());
                target[prop] = self._makeObservable(val, childPath);
                self._onModelChange(childPath);
                return true;
            },
            deleteProperty(target, prop) {
                if (Object.prototype.hasOwnProperty.call(target, prop)) {
                    delete target[prop];
                    const childPath = self._joinPath(path, prop.toString());
                    self._onModelChange(childPath);
                }
                return true;
            }
        });

        return proxy;
    }

    /**
     * Callback for model changes.
     * @param {string} changedPath changed path.
     */
    _onModelChange(changedPath) {
        if (this._hasStructuralRendering || this._bindings.size === 0 || !changedPath) {
            this.render();
            return;
        }

        this.render();
    }

    /**
     * Returns true if template requires full structural rendering.
     * @param {HTMLTemplateElement|null} template template element.
     * @returns {boolean}
     */
    _requiresStructuralRendering(template) {
        if (!(template instanceof HTMLTemplateElement)) {
            return false;
        }

        const html = template.innerHTML || "";
        if (html.includes("{{")) {
            return true;
        }

        return template.content.querySelector("[data-foreach], [data-if], [data-if-not], [data-if-empty], [data-if-not-empty], [data-template]") !== null;
    }

    /**
     * Processes all child nodes.
     * @param {Node} parent parent node.
     * @param {Object} context context object.
     * @param {Object} root root model.
     */
    _processChildNodes(parent, context, root) {
        const nodes = Array.from(parent.childNodes);
        nodes.forEach((node) => {
            const result = this._processNode(node, context, root);
            if (result === node) {
                return;
            }
            if (result == null) {
                node.remove();
                return;
            }
            node.replaceWith(result);
        });
    }

    /**
     * Processes a single node.
     * @param {Node} node node.
     * @param {Object} context context.
     * @param {Object} root root model.
     * @returns {Node|DocumentFragment|null}
     */
    _processNode(node, context, root) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = this._replacePlaceholders(node.textContent, context, root);
            return node;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return node;
        }

        return this._processElement(node, context, root);
    }

    /**
     * Processes one element.
     * @param {HTMLElement} element element.
     * @param {Object} context context.
     * @param {Object} root root model.
     * @returns {Node|DocumentFragment|null}
     */
    _processElement(element, context, root) {
        if (element.hasAttribute("data-foreach")) {
            return this._processForEach(element, context, root);
        }

        if (!this._evaluateConditions(element, context, root)) {
            return null;
        }

        this._processNestedTemplateReference(element, context, root);
        this._processAction(element, context, root);
        this._processBinding(element, context, root);
        this._processDynamicAttributes(element, context, root);
        this._replaceAttributePlaceholders(element, context, root);

        this._processChildNodes(element, context, root);

        return element;
    }

    /**
     * Processes data-template references.
     * @param {HTMLElement} element element.
     * @param {Object} context context.
     * @param {Object} root root.
     */
    _processNestedTemplateReference(element, context, root) {
        const templateRef = element.getAttribute("data-template");
        if (!templateRef) {
            return;
        }

        const nestedTemplate = this._findTemplate(this._replacePlaceholders(templateRef, context, root));
        if (!(nestedTemplate instanceof HTMLTemplateElement)) {
            return;
        }

        const contextPath = element.getAttribute("data-template-context");
        let scope = context;
        if (contextPath) {
            scope = this._createScope(this._resolveValue(contextPath, context, root), -1, context, root);
        }

        const fragment = nestedTemplate.content.cloneNode(true);
        this._processChildNodes(fragment, scope, root);

        if (element.tagName === "TEMPLATE") {
            element.replaceWith(fragment);
            return;
        }

        element.replaceChildren(...Array.from(fragment.childNodes));
        element.removeAttribute("data-template");
        element.removeAttribute("data-template-context");
    }

    /**
     * Processes foreach rendering.
     * @param {HTMLElement} element element.
     * @param {Object} context context.
     * @param {Object} root root model.
     * @returns {DocumentFragment}
     */
    _processForEach(element, context, root) {
        const path = element.getAttribute("data-foreach");
        const value = this._resolveValue(path, context, root);
        const values = Array.isArray(value) ? value : [];
        const fragment = document.createDocumentFragment();

        values.forEach((item, index) => {
            const itemContext = this._createScope(item, index, context, root);
            if (element.tagName === "TEMPLATE") {
                const tplFragment = element.content.cloneNode(true);
                this._processChildNodes(tplFragment, itemContext, root);
                fragment.append(...Array.from(tplFragment.childNodes));
                return;
            }

            const clone = element.cloneNode(true);
            clone.removeAttribute("data-foreach");
            const processed = this._processElement(clone, itemContext, root);
            if (processed) {
                fragment.append(processed);
            }
        });

        return fragment;
    }

    /**
     * Evaluates condition attributes.
     * @param {HTMLElement} element element.
     * @param {Object} context context.
     * @param {Object} root root model.
     * @returns {boolean}
     */
    _evaluateConditions(element, context, root) {
        if (element.hasAttribute("data-if")) {
            const condition = this._resolveValue(element.getAttribute("data-if"), context, root);
            if (!this._isTruthy(condition)) {
                return false;
            }
        }

        if (element.hasAttribute("data-if-not")) {
            const condition = this._resolveValue(element.getAttribute("data-if-not"), context, root);
            if (this._isTruthy(condition)) {
                return false;
            }
        }

        if (element.hasAttribute("data-if-empty")) {
            const value = this._resolveValue(element.getAttribute("data-if-empty"), context, root);
            if (!this._isEmpty(value)) {
                return false;
            }
        }

        if (element.hasAttribute("data-if-not-empty")) {
            const value = this._resolveValue(element.getAttribute("data-if-not-empty"), context, root);
            if (this._isEmpty(value)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Maps data-action to framework action attributes.
     * @param {HTMLElement} element element.
     * @param {Object} context context.
     * @param {Object} root root model.
     */
    _processAction(element, context, root) {
        const action = element.getAttribute("data-action");
        if (!action) {
            return;
        }

        const actionName = this._replacePlaceholders(action, context, root)?.trim();
        if (actionName) {
            element.setAttribute("data-wx-primary-action", actionName);
        }

        const actionParam = element.getAttribute("data-action-param");
        if (actionParam != null) {
            const value = this._replacePlaceholders(actionParam, context, root);
            if (value) {
                element.setAttribute("data-wx-primary-param", value);
            } else {
                element.removeAttribute("data-wx-primary-param");
            }
        }

        element.removeAttribute("data-action");
        element.removeAttribute("data-action-param");
    }

    /**
     * Registers and applies data-bind values.
     * @param {HTMLElement} element element.
     * @param {Object} context context.
     * @param {Object} root root model.
     */
    _processBinding(element, context, root) {
        const bindAttr = element.getAttribute("data-bind");
        if (!bindAttr) {
            return;
        }

        const binds = bindAttr.split(",").map((x) => x.trim()).filter((x) => x.length > 0);
        binds.forEach((bindPath) => {
            if (!this._bindings.has(bindPath)) {
                this._bindings.set(bindPath, []);
            }
            this._bindings.get(bindPath).push(element);
        });

        if (binds.length === 0) {
            return;
        }

        const value = this._resolveValue(binds[0], context, root);
        this._applyBoundValue(element, value);
    }

    /**
     * Applies dynamic class/style/aria attributes.
     * @param {HTMLElement} element element.
     * @param {Object} context context.
     * @param {Object} root root model.
     */
    _processDynamicAttributes(element, context, root) {
        const attrs = Array.from(element.attributes);
        attrs.forEach((attr) => {
            if (attr.name.startsWith("data-class-")) {
                const className = attr.name.substring("data-class-".length);
                const condition = this._resolveValue(attr.value, context, root);
                if (this._isTruthy(condition)) {
                    element.classList.add(className);
                } else {
                    element.classList.remove(className);
                }
                element.removeAttribute(attr.name);
                return;
            }

            if (attr.name.startsWith("data-style-")) {
                const styleName = attr.name.substring("data-style-".length);
                const styleValue = this._resolveValue(attr.value, context, root);
                if (styleValue === null || styleValue === undefined || styleValue === "") {
                    element.style.removeProperty(styleName);
                } else {
                    element.style.setProperty(styleName, `${styleValue}`);
                }
                element.removeAttribute(attr.name);
                return;
            }

            if (attr.name.startsWith("data-aria-")) {
                const ariaName = attr.name.substring("data-aria-".length);
                const ariaValue = this._resolveValue(attr.value, context, root);
                if (ariaValue === null || ariaValue === undefined || ariaValue === "") {
                    element.removeAttribute(`aria-${ariaName}`);
                } else {
                    element.setAttribute(`aria-${ariaName}`, `${ariaValue}`);
                }
                element.removeAttribute(attr.name);
            }
        });
    }

    /**
     * Replaces placeholders in element attributes.
     * @param {HTMLElement} element element.
     * @param {Object} context context.
     * @param {Object} root root model.
     */
    _replaceAttributePlaceholders(element, context, root) {
        Array.from(element.attributes).forEach((attr) => {
            if (attr.name.startsWith("data-class-") || attr.name.startsWith("data-style-") || attr.name.startsWith("data-aria-")) {
                return;
            }

            if (attr.name === "data-foreach" || attr.name === "data-if" || attr.name === "data-if-not" || attr.name === "data-if-empty" || attr.name === "data-if-not-empty") {
                return;
            }

            if (!attr.value || !attr.value.includes("{{")) {
                return;
            }

            element.setAttribute(attr.name, this._replacePlaceholders(attr.value, context, root));
        });
    }

    /**
     * Applies a binding value to an element.
     * @param {HTMLElement} element element.
     * @param {any} value value.
     */
    _applyBoundValue(element, value) {
        const normalized = value == null ? "" : `${value}`;
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
            element.value = normalized;
            return;
        }

        const bindTarget = element.getAttribute("data-bind-target");
        if (bindTarget) {
            if (normalized === "") {
                element.removeAttribute(bindTarget);
            } else {
                element.setAttribute(bindTarget, normalized);
            }
            return;
        }

        element.textContent = normalized;
    }

    /**
     * Replaces all placeholders in text.
     * @param {string} value text.
     * @param {Object} context context.
     * @param {Object} root root model.
     * @returns {string}
     */
    _replacePlaceholders(value, context, root) {
        if (typeof value !== "string" || value.length === 0) {
            return value;
        }

        return value.replace(/{{\s*([^{}]+)\s*}}/g, (_, expression) => {
            const result = this._resolveValue(expression, context, root);
            return result == null ? "" : `${result}`;
        });
    }

    /**
     * Resolves expression/path in context + root model.
     * @param {string} expression expression.
     * @param {Object} context context.
     * @param {Object} root root model.
     * @returns {any}
     */
    _resolveValue(expression, context, root) {
        const key = `${expression ?? ""}`.trim();
        if (key === "") {
            return null;
        }

        if (key === "true") return true;
        if (key === "false") return false;
        if (key === "null") return null;
        if (key === "undefined") return undefined;
        if (key === "this" || key === ".") return context?.$item ?? context;
        if (key === "$root") return root;
        if (key === "$item") return context?.$item;
        if (key === "$index") return context?.$index;

        if ((key.startsWith("'") && key.endsWith("'")) || (key.startsWith("\"") && key.endsWith("\""))) {
            return key.slice(1, -1);
        }

        const numeric = Number(key);
        if (!Number.isNaN(numeric) && `${numeric}` === key) {
            return numeric;
        }

        if (key.startsWith("$root.")) {
            return this._getPathValue(root, key.substring("$root.".length));
        }

        if (key.startsWith("$item.")) {
            return this._getPathValue(context?.$item, key.substring("$item.".length));
        }

        const contextResult = this._tryGetPathValue(context, key);
        if (contextResult.found) {
            return contextResult.value;
        }

        return this._getPathValue(root, key);
    }

    /**
     * Returns value at path or undefined.
     * @param {Object} obj object.
     * @param {string} path dot path.
     * @returns {any}
     */
    _getPathValue(obj, path) {
        if (!obj || typeof path !== "string" || path.trim() === "") {
            return undefined;
        }

        const parts = path.split(".").map((x) => x.trim()).filter((x) => x.length > 0);
        let current = obj;
        for (const part of parts) {
            if (current == null || typeof current !== "object" || !(part in current)) {
                return undefined;
            }
            current = current[part];
        }
        return current;
    }

    /**
     * Tries to get value and found flag.
     * @param {Object} obj object.
     * @param {string} path path.
     * @returns {{found:boolean, value:any}}
     */
    _tryGetPathValue(obj, path) {
        if (!obj || typeof path !== "string" || path.trim() === "") {
            return { found: false, value: undefined };
        }

        const parts = path.split(".").map((x) => x.trim()).filter((x) => x.length > 0);
        let current = obj;
        for (const part of parts) {
            if (current == null || typeof current !== "object" || !(part in current)) {
                return { found: false, value: undefined };
            }
            current = current[part];
        }
        return { found: true, value: current };
    }

    /**
     * Creates render scope for one item.
     * @param {any} value item value.
     * @param {number} index item index.
     * @param {Object|null} parent parent scope.
     * @param {Object} root root model.
     * @returns {Object}
     */
    _createScope(value, index, parent, root) {
        const scope = {
            $root: root,
            $parent: parent,
            $item: value,
            $index: index,
            value: value
        };

        if (value && typeof value === "object" && !Array.isArray(value)) {
            Object.keys(value).forEach((key) => {
                scope[key] = value[key];
            });
        }

        return scope;
    }

    /**
     * Returns whether value is truthy for template checks.
     * @param {any} value value.
     * @returns {boolean}
     */
    _isTruthy(value) {
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (normalized === "false" || normalized === "0" || normalized === "no") {
                return false;
            }
            if (normalized === "true" || normalized === "1" || normalized === "yes") {
                return true;
            }
        }
        return !!value;
    }

    /**
     * Returns whether value is empty.
     * @param {any} value value.
     * @returns {boolean}
     */
    _isEmpty(value) {
        if (value === null || value === undefined) {
            return true;
        }

        if (typeof value === "string") {
            return value.trim() === "";
        }

        if (Array.isArray(value)) {
            return value.length === 0;
        }

        if (typeof value === "object") {
            return Object.keys(value).length === 0;
        }

        return false;
    }

    /**
     * Compares two node lists by structure/content.
     * @param {Node[]} current current nodes.
     * @param {Node[]} next next nodes.
     * @returns {boolean}
     */
    _isSameDom(current, next) {
        if (current.length !== next.length) {
            return false;
        }

        for (let i = 0; i < current.length; i++) {
            if (!current[i].isEqualNode(next[i])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Builds dot path.
     * @param {string} left left.
     * @param {string} right right.
     * @returns {string}
     */
    _joinPath(left, right) {
        if (!left) return right;
        if (!right) return left;
        return `${left}.${right}`;
    }
};

webexpress.webui.Controller.registerClass("wx-webui-template", webexpress.webui.TemplateCtrl);
