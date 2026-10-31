/** Registers document add-ons through the same model used by editor and reading views. */
(function () {
    const ui = webexpress.webui;
    /**
     * Resolves the document add-on vocabulary.
     * @param {string} key The key suffix.
     * @returns {string} The localized label.
     */
    const t = key => ui.I18N.translate("webexpress.webui:editor.addon.document." + key);
    const tones = ["info", "success", "warning", "danger", "secondary", "primary"];
    const toneProperty = { name: "tone", label: t("tone"), type: "select", default: "info",
        options: tones.map(value => ({ value, label: t(value) })) };
    ui.EditorAddOns.register("callout", {
        label: t("callout"), description: t("callout.description"), icon: "circle-info",
        type: "block", category: t("category"), isContainer: true, bodyClass: "wx-editor-callout",
        properties: [toneProperty, { name: "title", label: t("title"), type: "text", default: "" }],
        content: "<p></p>"
    });
    ui.EditorAddOns.register("status", {
        label: t("status"), description: t("status.description"), icon: "tag",
        type: "inline", category: t("category"),
        properties: [{ name: "text", label: t("text"), type: "text", default: t("status") }, toneProperty],
        /**
         * Formats escaped model properties and restricts CSS variants to known values.
         * @param {object} data The escaped add-on configuration.
         * @returns {string} Safe widget markup.
         */
        renderer: data => `<span class="badge bg-${tones.includes(data.tone) ? data.tone : "secondary"}">${data.text || ""}</span>`
    });
    ui.EditorAddOns.register("toc", {
        label: t("toc"), description: t("toc.description"), icon: "list-ol",
        type: "block", category: t("category"), properties: [],
        /** @returns {string} The controller host shared by both views. */
        renderer: () => '<nav class="wx-document-toc wx-webui-document-toc"></nav>'
    });

    /** Builds a contents list scoped to its document without altering editor model content. */
    ui.DocumentTocCtrl = class extends ui.Ctrl {
        /**
         * Defers root discovery until the controller host has joined its document.
         * @param {HTMLElement} element The add-on host.
         */
        constructor(element) {
            super(element);
            this._onInput = () => this.render();
            this._timer = setTimeout(() => {
                this._root = element.closest(".wx-editor-content") || element.closest(".wx-content");
                this._root?.addEventListener("input", this._onInput);
                this.render();
            }, 0);
        }
        /** Rebuilds entries after document edits using text nodes for heading captions. */
        render() {
            if (!this._root) return;
            const editing = this._root.classList.contains("wx-editor-content");
            const headings = Array.from(this._root.querySelectorAll("h1,h2,h3,h4,h5,h6"))
                .filter(heading => !heading.closest(".wx-document-toc,.wx-editor-frame-toolbar") && heading.textContent.trim());
            this._element.textContent = "";
            this._element.setAttribute("aria-label", t("toc"));
            const title = document.createElement("strong");
            title.textContent = t("toc");
            this._element.appendChild(title);
            const list = document.createElement("ol");
            headings.forEach((heading, index) => {
                const item = document.createElement("li");
                item.style.marginLeft = (Number(heading.tagName.slice(1)) - 1) + "em";
                const caption = document.createElement(editing ? "span" : "a");
                caption.textContent = heading.textContent;
                if (!editing) {
                    if (!heading.id) {
                        let id = "wx-heading-" + index;
                        while (document.getElementById(id)) id += "-";
                        heading.id = id;
                    }
                    caption.setAttribute("href", "#" + encodeURIComponent(heading.id));
                }
                item.appendChild(caption);
                list.appendChild(item);
            });
            if (!headings.length) list.textContent = t("toc.empty");
            this._element.appendChild(list);
        }
        /** Releases the deferred render and document listener when the widget is removed. */
        destroy() {
            clearTimeout(this._timer);
            this._root?.removeEventListener("input", this._onInput);
            super.destroy();
        }
    };
    ui.Controller.registerClass("wx-webui-document-toc", ui.DocumentTocCtrl);
})();
