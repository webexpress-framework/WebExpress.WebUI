/**
 * Converts the raw value of the editor into the document it describes.
 *
 * The editor persists its whole working surface, not a document: add-ons keep
 * the card frame with the header that names them, the drag handle and the
 * settings button; tables keep their column resizers; every block that must not
 * be typed into carries contenteditable="false" and is fenced by the empty
 * guard paragraphs the caret needs to get past it. None of that is content - it
 * is the scaffolding that makes the value editable - so the stored value cannot
 * be published as it stands. This class removes the scaffolding and leaves the
 * document, which lets one stored value serve both the editor and the reader
 * instead of forcing a second, hand-maintained representation.
 */
webexpress.webui.ContentFormat = class {

    /**
     * Nodes that exist only so the document can be edited. The last two are
     * defensive: they appear when a whole editor host, rather than its content
     * element, was handed to the reading view.
     */
    static CHROME = "[data-wx-caret], .wx-editor-placeholder, .wx-drop-marker, .wx-col-resizer,"
        + " .wx-addon-drag-handle, .wx-addon-settings-btn, .wx-editor-toolbar, .wx-editor-status";

    /** Attributes that only make sense while the value is being edited. */
    static EDIT_ATTRIBUTES = ["contenteditable", "draggable", "spellcheck", "data-wx-focus-new", "data-wx-caret"];

    /**
     * Converts the raw editor value into a fragment holding the reading view.
     * @param {string} html - The value as the editor stored it.
     * @param {object} [options] - Conversion options. `instruction` keeps the
     *     author's instruction texts, which are dropped by default.
     * @returns {DocumentFragment} The converted content.
     */
    static toFragment(html, options) {
        const keepInstruction = !!(options && options.instruction);
        const source = document.createElement("div");
        source.innerHTML = html || "";

        this._removeChrome(source, keepInstruction);
        this._unwrapBlockAddons(source);
        this._unwrapInlineAddons(source);
        this._adoptTables(source);
        this._stripEditAttributes(source);
        this._dropTypingSpace(source);
        this._hardenLinks(source);

        const fragment = document.createDocumentFragment();
        while (source.firstChild) {
            fragment.appendChild(source.firstChild);
        }

        return fragment;
    }

    /**
     * Returns whether a converted node carries nothing a reader would see.
     * Text alone is not enough to decide: an add-on, an image or a rule is
     * content without contributing a single character.
     * @param {Node} node - The converted fragment or element.
     * @returns {boolean} True when there is nothing to show.
     */
    static isEmpty(node) {
        if (!node) {
            return true;
        }
        if ((node.textContent || "").trim() !== "") {
            return false;
        }
        return !node.querySelector("img, table, hr, .wx-content-addon, .wx-content-inline");
    }

    /**
     * Removes the editing affordances from the tree.
     * @param {HTMLElement} root - The conversion root.
     * @param {boolean} keepInstruction - Whether instruction texts survive.
     */
    static _removeChrome(root, keepInstruction) {
        root.querySelectorAll(this.CHROME).forEach((element) => element.remove());

        if (!keepInstruction) {
            // instruction texts address whoever edits the document, not whoever
            // reads it; the stylesheet only hides them, which still carries them
            // into a copied selection or a text extraction
            root.querySelectorAll(".wx-editor-instruction").forEach((element) => element.remove());
        }
    }

    /**
     * Replaces every block add-on frame with a plain block holding what the
     * add-on renders. The card header is dropped with the frame: it names the
     * add-on for the author and offers its settings, which says nothing about
     * the document.
     * @param {HTMLElement} root - The conversion root.
     */
    static _unwrapBlockAddons(root) {
        root.querySelectorAll(".wx-addon-frame").forEach((frame) => {
            if (!frame.parentNode) {
                return;
            }

            const body = frame.querySelector(".wx-addon-body-container, .wx-addon-body-widget");
            const block = document.createElement("div");
            block.className = "wx-content-addon";
            this._carryConfiguration(frame, block);

            const source = body || frame;
            if (!body) {
                // an add-on saved before the body wrapper existed keeps its
                // content directly in the frame, next to the header
                const header = frame.querySelector(".card-header");
                if (header) {
                    header.remove();
                }
            }

            while (source.firstChild) {
                block.appendChild(source.firstChild);
            }

            frame.parentNode.replaceChild(block, frame);
        });
    }

    /**
     * Replaces every inline add-on frame with a plain span, dropping the drag
     * affordance and the tooltip that names the add-on type.
     * @param {HTMLElement} root - The conversion root.
     */
    static _unwrapInlineAddons(root) {
        root.querySelectorAll(".wx-addon-inline-frame").forEach((frame) => {
            if (!frame.parentNode) {
                return;
            }

            const span = document.createElement("span");
            span.className = "wx-content-inline";
            this._carryConfiguration(frame, span);

            while (frame.firstChild) {
                span.appendChild(frame.firstChild);
            }

            frame.parentNode.replaceChild(span, frame);
        });
    }

    /**
     * Copies the persisted add-on configuration onto the reading element, so a
     * widget that renders itself from those values still finds them.
     * @param {HTMLElement} frame - The add-on frame.
     * @param {HTMLElement} target - The reading element replacing it.
     */
    static _carryConfiguration(frame, target) {
        Array.from(frame.attributes).forEach((attribute) => {
            const name = attribute.name;
            if (name.indexOf("data-") !== 0 || this.EDIT_ATTRIBUTES.indexOf(name) >= 0) {
                return;
            }
            target.setAttribute(name, attribute.value);
        });
    }

    /**
     * Marks the tables of the document as reading tables. The column widths on
     * the colgroup and the inline table layout are kept: they are what the
     * author sized, not editing state.
     * @param {HTMLElement} root - The conversion root.
     */
    static _adoptTables(root) {
        root.querySelectorAll("table").forEach((table) => {
            table.classList.remove("wx-native-table");
            table.classList.add("wx-content-table");
        });

        // the editor positions a header cell only so the absolutely placed
        // resize handle can anchor to it. the handle is gone by now, and the
        // declaration is inline, so no stylesheet could take it back
        root.querySelectorAll("th").forEach((cell) => {
            cell.style.position = "";
        });
    }

    /**
     * Removes the attributes that only serve editing, including any inline
     * event handler that reached the value from outside the editor.
     * @param {HTMLElement} root - The conversion root.
     */
    static _stripEditAttributes(root) {
        root.querySelectorAll("*").forEach((element) => {
            this.EDIT_ATTRIBUTES.forEach((name) => element.removeAttribute(name));

            Array.from(element.attributes).forEach((attribute) => {
                if (/^on/i.test(attribute.name)) {
                    element.removeAttribute(attribute.name);
                }
            });
        });
    }

    /**
     * Drops the empty paragraphs the editor keeps around block level
     * non-editables so the caret can reach past them. An empty paragraph
     * between two paragraphs of text was typed by the author and stays.
     * @param {HTMLElement} root - The conversion root.
     */
    static _dropTypingSpace(root) {
        const isAddon = (element) =>
            !!element && element.classList && element.classList.contains("wx-content-addon");

        Array.from(root.children).forEach((element) => {
            if (!this._isEmptyParagraph(element)) {
                return;
            }

            const previous = element.previousElementSibling;
            const next = element.nextElementSibling;

            if (!previous || !next || isAddon(previous) || isAddon(next)) {
                element.remove();
            }
        });
    }

    /**
     * Returns whether an element is a paragraph without any visible content.
     * @param {HTMLElement} element - The element to test.
     * @returns {boolean} True for an empty paragraph.
     */
    static _isEmptyParagraph(element) {
        if (!element || element.tagName !== "P") {
            return false;
        }
        if ((element.textContent || "").trim() !== "") {
            return false;
        }
        return !element.querySelector("img, table, hr, .wx-content-addon, .wx-content-inline");
    }

    /**
     * Gives every link that opens a new tab the opener protection. The editor's
     * own link dialog writes it, but pasted and imported markup does not.
     * @param {HTMLElement} root - The conversion root.
     */
    static _hardenLinks(root) {
        root.querySelectorAll("a[target=\"_blank\"]").forEach((link) => {
            if (!link.getAttribute("rel")) {
                link.setAttribute("rel", "noopener noreferrer");
            }
        });
    }
};

/**
 * Display-only control that shows content authored with the editor.
 *
 * It is the read side of the editor: SmartEdit shows it while the pencil is
 * untouched, the editor table template shows it in a non-editable column, and a
 * page shows it wherever stored rich text is published. The value is the one the
 * editor stores, so nothing has to be converted or duplicated server-side.
 *
 * The markup arrives base64 encoded, because a browser that lays out the raw
 * value first would show the editing frames, the add-on headers and live
 * contenteditable islands until this control replaces them.
 */
webexpress.webui.ContentCtrl = class extends webexpress.webui.Ctrl {
    _value = "";
    _placeholder = null;
    _instruction = false;

    /**
     * Creates a new instance of the class.
     * @param {HTMLElement} element - The host element carrying the content.
     */
    constructor(element) {
        super(element);

        const encoded = element.getAttribute("data-base64") === "true";
        const raw = (element.innerHTML || "").trim();

        this._placeholder = element.getAttribute("data-placeholder");
        this._instruction = element.getAttribute("data-instruction") === "true";
        this._value = encoded && raw ? this._decode(raw) : raw;

        element.removeAttribute("data-base64");
        element.removeAttribute("data-placeholder");
        element.removeAttribute("data-instruction");
        element.classList.add("wx-content");

        this.render();
    }

    /**
     * Rebuilds the reading view from the current value.
     */
    render() {
        const element = this._element;
        element.innerHTML = "";

        const fragment = webexpress.webui.ContentFormat.toFragment(this._value, { instruction: this._instruction });

        if (webexpress.webui.ContentFormat.isEmpty(fragment)) {
            // without a placeholder an unset value renders nothing at all, so
            // the control takes no room in a surrounding layout
            if (this._placeholder) {
                element.appendChild(this._placeholderView());
            }
            return;
        }

        element.appendChild(fragment);

        // add-ons persist as the markup of a control (a chart, a game board, a
        // date); the reading view is where those controls come to life again
        webexpress.webui.Controller.createInstances(element);
    }

    /**
     * Decodes the transported value. The server encodes utf-8 bytes, while atob
     * answers one character per byte, so the bytes have to be decoded as utf-8
     * again - without that step every umlaut, dash and quotation mark in the
     * prose arrives as mojibake.
     * @param {string} encoded - The base64 payload.
     * @returns {string} The raw editor value.
     */
    _decode(encoded) {
        const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));

        return new TextDecoder().decode(bytes);
    }

    /**
     * Builds the stand-in shown for an unset value.
     * @returns {HTMLElement} The placeholder node.
     */
    _placeholderView() {
        const span = document.createElement("span");
        span.className = "wx-content-placeholder";
        span.textContent = this._placeholder;

        return span;
    }

    /**
     * Gets the content in the raw format the editor stores.
     * @returns {string} The raw content.
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the content in the raw format the editor stores and rebuilds the view.
     * @param {string} value - The raw content.
     */
    set value(value) {
        this._value = value == null ? "" : String(value);
        this.render();
    }

    /**
     * Gets the reading text of the content, for an excerpt, a tooltip or a
     * sort key - the raw value would answer with its markup instead.
     * @returns {string} The text of the reading view.
     */
    get text() {
        return (this._element.textContent || "").trim();
    }
};

// register the class in the controller system
webexpress.webui.Controller.registerClass("wx-webui-content", webexpress.webui.ContentCtrl);
