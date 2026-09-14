/**
 * Imports HTML at the input boundary. Only schema data reaches the editor model.
 */
webexpress.webui.EditorHtml = class {
    /** Escapes configuration in renderer templates before the browser can parse it. */
    static widget(def, data) {
        const safe = {};
        for (const [key, value] of Object.entries(data)) safe[key] = String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        const template = document.createElement("template");
        template.innerHTML = typeof def.renderer === "function" ? def.renderer(safe) : def.content || "";
        const fragment = template.content || template;
        fragment.querySelectorAll("script,iframe,object,embed,svg,math,style,link,meta,base,form").forEach(el => el.remove());
        fragment.querySelectorAll("*").forEach(el => {
            for (const attr of Array.from(el.attributes)) {
                const name = attr.name.toLowerCase();
                if (name.startsWith("on") || name === "srcdoc" || name === "formaction" || name === "action" || name.startsWith("data-wx-primary") || name.startsWith("data-wx-secondary")) el.removeAttribute(attr.name);
                if (["src", "href", "xlink:href"].includes(name) && !webexpress.webui.EditorModel.url(attr.value, name === "src")) el.removeAttribute(attr.name);
                if (name === "style" && /url\s*\(|expression|@import|\\/i.test(attr.value)) el.removeAttribute(attr.name);
            }
        });
        const result = document.createDocumentFragment();
        while (fragment.firstChild) result.appendChild(fragment.firstChild);
        return result;
    }
    /** Parses in an inert template; scripts, controls and event attributes never enter state. */
    static read(html) {
        const Model = webexpress.webui.EditorModel;
        if (typeof html !== "string" || html.length > Model.MAX_TEXT * 4) throw new RangeError("Invalid editor HTML input.");
        const template = document.createElement("template");
        template.innerHTML = html;
        const root = template.content || template;
        let count = 0;
        const read = (node, marks = {}, depth = 0) => {
            if (++count > Model.MAX_NODES || depth > Model.MAX_DEPTH) throw new RangeError("Editor HTML exceeds its structural limit.");
            if (node.nodeType === 3) return [{ type: "text", text: node.textContent, marks: Model.marks(marks) }];
            if (node.nodeType !== 1) return [];
            const tag = node.tagName.toLowerCase();
            if (["script", "style", "iframe", "object", "embed", "svg", "math", "template", "noscript", "input", "textarea", "select", "button", "form", "meta", "link", "base"].includes(tag)) return [];
            if (node.hasAttribute("data-wx-caret") || node.matches(".wx-editor-placeholder,.wx-drop-marker,.wx-col-resizer,.wx-addon-drag-handle,.wx-addon-settings-btn,.wx-editor-toolbar,.wx-editor-status")) return [];
            if (node.matches(".wx-addon-frame,.wx-addon-inline-frame") && node.getAttribute("data-type") === "table") {
                const table = node.querySelector("table");
                return table ? read(table, marks, depth + 1) : [];
            }
            if (node.matches(".wx-addon-frame,.wx-addon-inline-frame")) {
                const name = node.getAttribute("data-addon-id") || "";
                const def = webexpress.webui.EditorAddOns?.get(name);
                if (!def) return [];
                const body = node.querySelector(".wx-addon-body-container");
                const data = {};
                (def.properties ?? []).forEach(prop => {
                    const attribute = "data-" + prop.name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
                    data[prop.name] = node.getAttribute(attribute) ?? "";
                });
                return [Model.node("addon", def.isContainer && body ? Array.from(body.childNodes).flatMap(n => read(n, {}, depth + 1)) : [], { name, data, inline: def.type === "inline", container: !!def.isContainer })];
            }
            const kind = node.matches(".wx-editor-instruction") ? "instruction" : node.matches(".wx-mention") ? "mention" : node.matches(".wx-editor-date,.wx-webui-date,.wx-date") ? "date" : null;
            if (kind) return [Model.node("atom", [], { kind, text: node.textContent, value: node.getAttribute("data-value") || node.getAttribute("data-id") || "", format: node.getAttribute("data-format") || "" })];
            const inherited = { ...marks };
            const mark = { b: "bold", strong: "bold", i: "italic", em: "italic", u: "underline", s: "strikethrough", strike: "strikethrough", sup: "superscript", sub: "subscript", code: "code" }[tag];
            if (mark) inherited[mark] = true;
            if (tag === "a") inherited.link = { href: node.getAttribute("href"), target: node.getAttribute("target") };
            const style = node.style || {};
            if (style.fontWeight === "bold" || Number(style.fontWeight) >= 600) inherited.bold = true;
            if (style.fontStyle === "italic") inherited.italic = true;
            if ((style.textDecoration || style.textDecorationLine || "").includes("underline")) inherited.underline = true;
            if ((style.textDecoration || style.textDecorationLine || "").includes("line-through")) inherited.strikethrough = true;
            for (const [prop, name] of [["color", "color"], ["backgroundColor", "background"], ["fontFamily", "font"], ["fontSize", "size"]]) if (style[prop]) inherited[name] = style[prop];
            if (tag === "img") return [Model.node("image", [], { src: node.getAttribute("src"), alt: node.getAttribute("alt"), width: style.width || node.getAttribute("width"), height: style.height || node.getAttribute("height"), align: style.display === "block" ? style.marginLeft === "auto" ? style.marginRight === "auto" ? "center" : "right" : "left" : "inline", link: inherited.link })];
            if (["br", "hr"].includes(tag)) return [Model.node(tag)];
            const children = Array.from(node.childNodes).flatMap(n => read(n, inherited, depth + 1));
            if (node.matches(".wx-editor-row")) return [Model.node("row", children)];
            if (node.matches(".wx-editor-region")) return [Model.node("region", children, { weight: Number(node.getAttribute("data-weight")) || 1 })];
            const attrs = { align: style.textAlign, dir: node.getAttribute("dir"), indent: Math.round((parseFloat(style.marginLeft) || 0) / 40), background: style.backgroundColor };
            if (["td", "th"].includes(tag)) Object.assign(attrs, { colspan: Number(node.getAttribute("colspan")), rowspan: Number(node.getAttribute("rowspan")), scope: node.getAttribute("scope") });
            if (tag === "ol") attrs.start = Number(node.getAttribute("start"));
            if (tag === "table") attrs.widths = Array.from(node.querySelectorAll("col")).map(col => parseFloat(col.style.width) || 100);
            if (["colgroup", "col"].includes(tag)) return [];
            if (Model.TEXT_BLOCKS.has(tag)) return [Model.node(tag, children.length === 1 && children[0].type === "br" ? [] : children, attrs)];
            if (Model.CONTAINERS.has(tag) && tag !== "doc" && tag !== "addon") return [Model.node(tag, children, attrs)];
            if (["div", "section", "article", "figure", "figcaption"].includes(tag)) {
                return children.every(n => Model.inline(n)) ? [Model.node("p", children, attrs)] : children;
            }
            return children;
        };
        const raw = Array.from(root.childNodes).flatMap(n => read(n));
        const inline = raw.every(n => Model.inline(n));
        const state = Model.validate({ version: Model.VERSION, doc: Model.node("doc", raw) });
        const content = state.doc.children[0].children[0].children;
        return { state, nodes: inline ? content[0].children : raw.some(n => n.type === "row") ? state.doc.children.flatMap(row => row.children.flatMap(region => region.children)) : content };
    }
};

/**
 * Projects model nodes into DOM and maps selection boundaries back to model indices.
 * Rendered wrappers, placeholders and embedded controls are never serialized as content.
 */
webexpress.webui.EditorView = class {
    constructor(editor) { this.editor = editor; this.map = new WeakMap(); this.points = []; }

    /** Rebuilds the projection only after a model transaction has completed. */
    render(state, root, exporting = false) {
        this.map = new WeakMap(); this.points = []; this._regionNumber = 0;
        const fragment = document.createDocumentFragment();
        let pos = 0;
        for (const node of state.doc.children) { fragment.appendChild(this._node(node, pos, exporting)); pos += webexpress.webui.EditorModel.size(node); }
        while (root.firstChild) root.removeChild(root.firstChild);
        root.appendChild(fragment);
        this.map.set(root, { start: 0, end: pos, id: state.doc.id, node: state.doc });
    }

    _node(node, start, exporting) {
        const Model = webexpress.webui.EditorModel, end = start + Model.size(node);
        let element;
        if (node.type === "text") {
            const text = document.createTextNode(node.text);
            element = text;
            const marks = node.marks;
            for (const [key, tag] of [["code", "code"], ["subscript", "sub"], ["superscript", "sup"], ["strikethrough", "s"], ["underline", "u"], ["italic", "em"], ["bold", "strong"]]) if (marks[key]) {
                const wrapper = document.createElement(tag); wrapper.appendChild(element); element = wrapper;
            }
            if (["color", "background", "font", "size"].some(k => marks[k])) {
                const span = document.createElement("span");
                for (const [key, prop] of [["color", "color"], ["background", "backgroundColor"], ["font", "fontFamily"], ["size", "fontSize"]]) if (marks[key]) span.style[prop] = marks[key];
                span.appendChild(element); element = span;
            }
            if (marks.link) element = this._link(element, marks.link);
            const entry = { start, end, node, text };
            for (let n = text; n; n = n.parentNode) { this.map.set(n, entry); if (n === element) break; }
            this.points.push({ start, end, text });
            return element;
        }
        if (node.type === "image") {
            element = document.createElement("img");
            element.setAttribute("src", node.attrs.src); element.setAttribute("alt", node.attrs.alt);
            for (const key of ["width", "height"]) if (node.attrs[key]) element.style[key] = node.attrs[key];
            if (node.attrs.align && node.attrs.align !== "inline") {
                element.style.display = "block";
                element.style.marginLeft = ["center", "right"].includes(node.attrs.align) ? "auto" : "";
                element.style.marginRight = ["center", "left"].includes(node.attrs.align) ? "auto" : "";
            }
            this.map.set(element, { start, end, id: node.id, node });
            if (node.attrs.link) element = this._link(element, node.attrs.link);
        } else if (node.type === "atom") {
            element = document.createElement("span");
            element.className = node.attrs.kind === "mention" ? "wx-mention" : "wx-editor-" + node.attrs.kind;
            element.setAttribute("data-value", node.attrs.value);
            element.setAttribute("data-format", node.attrs.format);
            element.textContent = node.attrs.text;
            element.setAttribute("contenteditable", "false");
        } else if (node.type === "addon") {
            element = this._addon(node, start, exporting);
        } else {
            element = document.createElement(["row", "region"].includes(node.type) ? "div" : node.type);
            const attrs = node.attrs;
            if (node.type === "row") {
                element.className = "wx-editor-row";
                if (!exporting) element.setAttribute("contenteditable", "false");
            }
            if (node.type === "region") {
                element.className = "wx-editor-region";
                element.style.flexGrow = String(attrs.weight || 1);
                element.setAttribute("data-weight", attrs.weight || 1);
                if (!exporting) {
                    element.setAttribute("contenteditable", this.editor?.disabled ? "false" : "true");
                    element.setAttribute("data-wx-editor-owned", "true");
                    element.setAttribute("role", "textbox");
                    element.setAttribute("aria-multiline", "true");
                    element.setAttribute("aria-label", webexpress.webui.I18N.translate("webexpress.webui:editor.region.label"));
                    element.setAttribute("data-region-label", webexpress.webui.I18N.translate("webexpress.webui:editor.region.label") + " " + (++this._regionNumber));
                }
            }
            if (attrs.align) element.style.textAlign = attrs.align;
            if (attrs.dir) element.setAttribute("dir", attrs.dir);
            if (attrs.indent) element.style.marginLeft = attrs.indent * 40 + "px";
            if (attrs.background) element.style.backgroundColor = attrs.background;
            for (const key of ["colspan", "rowspan", "scope", "start"]) if (attrs[key]) element.setAttribute(key, attrs[key]);
            if (node.type === "table") {
                element.className = "table table-striped table-bordered wx-native-table";
                if (attrs.widths?.length) {
                    const cols = document.createElement("colgroup");
                    attrs.widths.forEach(w => { const col = document.createElement("col"); col.style.width = w + "px"; cols.appendChild(col); });
                    element.appendChild(cols);
                }
            }
            let pos = start;
            for (const child of node.children) { element.appendChild(this._node(child, pos, exporting)); pos += Model.size(child); }
            if (Model.TEXT_BLOCKS.has(node.type)) {
                if (!node.children.length || node.children.at(-1).type === "br") {
                    const filler = document.createElement("br");
                    if (!exporting) filler.setAttribute("data-wx-placeholder", "true");
                    element.appendChild(filler);
                }
                this.points.push({ start, end: end - 1, block: element });
            }
        }
        this.map.set(element, { start, end, id: node.id, node });
        if (Model.atomic(node)) this.points.push({ start, end, atom: element });
        return element;
    }

    _link(element, data) {
        const link = document.createElement("a");
        link.setAttribute("href", data.href);
        if (data.target === "_blank") { link.setAttribute("target", "_blank"); link.setAttribute("rel", "noopener noreferrer"); }
        link.appendChild(element);
        return link;
    }

    _addon(node, start, exporting) {
        const def = webexpress.webui.EditorAddOns?.get(node.attrs.name);
        const frame = document.createElement(node.attrs.inline ? "span" : "div");
        frame.className = node.attrs.inline ? "wx-addon-inline-frame" : "wx-addon-frame card my-3 shadow-sm";
        frame.setAttribute("data-addon-id", node.attrs.name);
        frame.setAttribute("contenteditable", "false");
        for (const [key, value] of Object.entries(node.attrs.data)) frame.setAttribute("data-" + key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), value);
        const body = document.createElement(node.attrs.inline ? "span" : "div");
        body.className = "card-body p-2 " + (node.attrs.container ? "wx-addon-body-container" : "wx-addon-body-widget");
        if (node.attrs.container) {
            body.setAttribute("contenteditable", this.editor?.disabled ? "false" : "true");
            body.setAttribute("data-wx-editor-owned", "true");
            let pos = start;
            node.children.forEach(child => { body.appendChild(this._node(child, pos, exporting)); pos += webexpress.webui.EditorModel.size(child); });
            this.map.set(body, { start, end: pos, node });
        } else if (def) {
            // registered renderers are application code; user HTML never becomes a widget
            body.appendChild(webexpress.webui.EditorHtml.widget(def, node.attrs.data));
        }
        if (!exporting && !node.attrs.inline) {
            const header = document.createElement("div"); header.className = "card-header";
            const handle = document.createElement("span"); handle.className = "wx-addon-drag-handle"; handle.textContent = "↕";
            handle.setAttribute("draggable", "true"); header.appendChild(handle);
            const label = document.createElement("span"); label.textContent = def?.label || node.attrs.name; header.appendChild(label);
            if (def?.properties?.length) { const settings = document.createElement("button"); settings.type = "button"; settings.className = "wx-addon-settings-btn"; settings.textContent = "⚙"; header.appendChild(settings); }
            frame.appendChild(header);
        }
        frame.appendChild(body);
        return frame;
    }

    /** Resolves any descendant of a rendered node to its persistent model key. */
    entry(element) {
        for (let node = element; node; node = node.parentNode) {
            const entry = this.map.get(node);
            if (entry) return entry;
        }
        return null;
    }

    /** DOM element offsets are translated through their mapped child boundaries. */
    index(container, offset) {
        const direct = this.map.get(container);
        if (container?.nodeType === 3 && direct?.text) return direct.start + Math.min(offset, direct.end - direct.start);
        const children = Array.from(container?.childNodes ?? []);
        for (let i = offset; i < children.length; i++) {
            const next = this.map.get(children[i]);
            if (next) return next.start;
        }
        for (let i = Math.min(offset, children.length) - 1; i >= 0; i--) {
            const previous = this.map.get(children[i]);
            if (previous) return previous.end;
        }
        if (direct) return direct.start;
        return null;
    }

    /** Keeps backward selections as anchor/focus pairs rather than ordered ranges. */
    selection(root) {
        const selection = window.getSelection();
        if (!selection?.rangeCount) return null;
        const range = selection.getRangeAt(0);
        const anchorNode = selection.anchorNode ?? range.startContainer, focusNode = selection.focusNode ?? range.endContainer;
        if (!root.contains(anchorNode) || !root.contains(focusNode)) return null;
        const anchor = this.index(anchorNode, selection.anchorOffset ?? range.startOffset), focus = this.index(focusNode, selection.focusOffset ?? range.endOffset);
        return anchor === null || focus === null ? null : { anchor, focus };
    }

    point(index) {
        const text = this.points.find(p => p.text && p.start <= index && p.end >= index);
        if (text) return { node: text.text, offset: index - text.start };
        const block = this.points.find(p => p.block && p.start <= index && p.end >= index);
        const atom = this.points.find(p => p.atom && (p.start === index || p.end === index));
        if (atom && (!block || atom.start >= block.start && atom.end <= block.end)) return { node: atom.atom.parentNode, offset: Array.from(atom.atom.parentNode.childNodes).indexOf(atom.atom) + (index === atom.end ? 1 : 0) };
        if (block) return { node: block.block, offset: index === block.start ? 0 : block.block.childNodes.length };
        if (atom) return { node: atom.atom.parentNode, offset: Array.from(atom.atom.parentNode.childNodes).indexOf(atom.atom) + (index === atom.end ? 1 : 0) };
        const last = this.points.filter(p => p.block).at(-1);
        return last ? { node: last.block, offset: last.block.childNodes.length } : { node: this.editor.getEditorElement(), offset: 0 };
    }

    /** Recreates the caret after all view-only plugin decorations have been applied. */
    restore(selection) {
        const a = this.point(selection.anchor), b = this.point(selection.focus), sel = window.getSelection();
        if (!sel) return;
        if (sel.setBaseAndExtent) sel.setBaseAndExtent(a.node, a.offset, b.node, b.offset);
        else {
            const range = document.createRange(), backward = selection.anchor > selection.focus;
            range.setStart(backward ? b.node : a.node, backward ? b.offset : a.offset);
            range.setEnd(backward ? a.node : b.node, backward ? a.offset : b.offset);
            sel.removeAllRanges(); sel.addRange(range);
        }
    }
};
