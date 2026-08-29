/**
 * A file list control.
 *
 * The entries are read once from the server rendered markup and then kept as
 * data, so a host that receives its files from a service can replace them
 * through the files property and have the control redraw itself.
 *
 * An entry that carries a versions array is shown as one row with the earlier
 * versions folded behind it, so a file that was uploaded several times reads as
 * one file rather than as a repeated name.
 */
webexpress.webui.FileListCtrl = class extends webexpress.webui.Ctrl {

    /**
     * Optional hook a host installs to own the description column. It receives
     * the file and returns the node to place there, or null to fall back to the
     * plain text. It exists so a data bound host can offer an inline editor for
     * the description without this control having to know how a description is
     * persisted.
     * @type {?function(object): (HTMLElement|null)}
     */
    descriptionRenderer = null;

    /**
     * Constructor for initializing the control.
     * @param {HTMLElement} element - The DOM element for the control.
     */
    constructor(element) {
        super(element);

        // configuration from data attributes
        this._files = Array.from(element.querySelectorAll(".wx-webui-file")).map(e => ({
            id: e.dataset.fileId || null,
            version: Number(e.dataset.fileVersion) || 0,
            name: e.textContent.trim(),
            uri: e.dataset.fileUri || "#",
            // a file that brings its own glyph keeps it; one that brings an
            // image needs no glyph at all, and the rest are typed by extension
            icon: e.dataset.fileIcon || (e.dataset.fileImage == null
                ? this._getIconForFilename(e.textContent.trim())
                : null),
            image: e.dataset.fileImage || null,
            date: e.dataset.fileDate || null,
            size: e.dataset.fileSize || null,
            description: e.dataset.description || null
        }));

        // clean up the DOM element
        element.innerHTML = "";
        element.removeAttribute("data-file-id");
        element.removeAttribute("data-file-version");
        element.removeAttribute("data-file-icon");
        element.removeAttribute("data-file-image");
        element.removeAttribute("data-file-uri");
        element.removeAttribute("data-file-size");
        element.removeAttribute("data-file-date");
        element.removeAttribute("data-datedescription");
        element.classList.add("wx-file-list");

        this._storage = document.createElement("div");
        this._storage.className = "wx-upload-preview";

        element.appendChild(this._storage);

        this.render();
    }

    /**
     * Returns the files the control shows.
     * @returns {Array<object>} - The files.
     */
    get files() {
        return this._files;
    }

    /**
     * Replaces the files the control shows and redraws it.
     * @param {Array<object>} value - The files.
     */
    set files(value) {
        this._files = Array.isArray(value) ? value : [];

        this.render();
    }

    /**
     * Returns the icon class for a file extension, in the icon theme the page
     * carries. The map is written in the legacy names because that is the
     * vocabulary a caller reads a file glyph in; the icon set derives the light
     * counterpart, so the two sets stay declared in one place.
     * @param {string} filename - The name of the file (e.g., "report.pdf").
     * @returns {string} - The icon class for the active theme.
     */
    _getIconForFilename(filename) {
        const ext = filename.split(".").pop().toLowerCase();

        const iconMap = {
            doc: "file-word",
            docx: "file-word",
            xls: "file-excel",
            xlsx: "file-excel",
            csv: "file-csv",
            ppt: "file-powerpoint",
            pptx: "file-powerpoint",
            pdf: "file-pdf",
            txt: "file",
            jpg: "file-image",
            jpeg: "file-image",
            png: "file-image",
            gif: "file-image",
            zip: "file-zipper",
            rar: "file-zipper",
            mp3: "file-audio",
            wav: "file-audio",
            mp4: "file-video",
            mov: "file-video"
        };

        return webexpress.webui.IconSet.resolve(iconMap[ext] || "file");
    }

    /**
     * Refreshes the tree control by rendering the latest node structure.
     */
    render() {
        // render doubles as the redraw after the files changed, so whatever was
        // drawn before has to go before the new table is built
        while (this._storage.firstChild) {
            this._storage.removeChild(this._storage.firstChild);
        }

        const table = document.createElement("table");
        const body = document.createElement("tbody");
        table.className = "table table-hover";

        for (const file of this._files) {
            const versions = Array.isArray(file.versions) ? file.versions : [];
            const toggle = versions.length > 0 ? this._createVersionToggle(versions.length) : null;

            body.appendChild(this._createRow(file, { toggle: toggle }));

            if (!toggle) {
                continue;
            }

            // the earlier versions are rows of the same table rather than a
            // nested one, so the columns of a version line up with the columns
            // of the file it belongs to
            const versionRows = versions.map(version => {
                const row = this._createRow(version, { version: true });
                row.classList.add("wx-file-version");
                row.style.display = "none";
                body.appendChild(row);

                return row;
            });

            toggle.addEventListener("click", (e) => {
                e.preventDefault();
                this._toggleVersions(toggle, versionRows);
            });
        }

        table.appendChild(body);
        this._storage.appendChild(table);
    }

    /**
     * Builds the button that folds the earlier versions of a file open and shut.
     * @param {number} count - The number of earlier versions.
     * @returns {HTMLElement} - The toggle.
     */
    _createVersionToggle(count) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "wx-file-version-toggle";
        button.setAttribute("aria-expanded", "false");
        button.title = this._i18n("webexpress.webui:filelist.versions", "Earlier versions");

        const icon = document.createElement("i");
        icon.className = this._iconClass("chevron-right");
        button.appendChild(icon);

        const badge = document.createElement("span");
        badge.className = "wx-file-version-count";
        // the count includes the version on the row itself, because that is what
        // a reader counts: how many versions of this file exist
        badge.textContent = String(count + 1);
        button.appendChild(badge);

        return button;
    }

    /**
     * Folds the earlier versions of a file open and shut.
     * @param {HTMLElement} toggle - The toggle that was pressed.
     * @param {Array<HTMLElement>} rows - The rows of the earlier versions.
     */
    _toggleVersions(toggle, rows) {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        const icon = toggle.querySelector("i");

        toggle.setAttribute("aria-expanded", expanded ? "false" : "true");

        if (icon) {
            icon.className = this._iconClass(expanded ? "chevron-right" : "chevron-down");
        }

        for (const row of rows) {
            row.style.display = expanded ? "none" : "";
        }
    }

    /**
     * Builds the row of one file.
     * @param {object} file - The file.
     * @param {object} [options] - toggle: the version toggle to place before the
     *   name; version: whether the row is an earlier version of the file above it.
     * @returns {HTMLElement} - The row.
     */
    _createRow(file, options = {}) {
        const tr = document.createElement("tr");

        // left: version chrome + icon + filename
        const left = document.createElement("td");
        const divLeft = document.createElement("div");

        if (options.toggle) {
            divLeft.appendChild(options.toggle);
        }

        if (options.version && Number.isFinite(Number(file.version))) {
            const label = document.createElement("span");
            label.className = "wx-file-version-label";
            label.textContent = `v${Number(file.version)}`;
            divLeft.appendChild(label);
        }

        if (file.image) {
            const image = document.createElement("img");
            image.src = file.image;
            divLeft.appendChild(image);
        }

        if (file.icon) {
            const icon = document.createElement("i");
            // the class may arrive from the server or from stored data, in
            // either vocabulary; the icon set converts a legacy name and
            // hands a light class straight back, so both end up themed
            icon.className = webexpress.webui.IconSet.resolve(file.icon || "file");
            divLeft.appendChild(icon);
        }

        const link = document.createElement("a");
        link.href = file.uri;
        link.textContent = file.name;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "wx-link";

        divLeft.appendChild(link);
        left.appendChild(divLeft);

        // middle: description
        const middle = document.createElement("td");
        const divMiddle = document.createElement("div");
        // an earlier version is a record of what was, so its description is read
        // rather than edited; only the current version is offered to a host
        const authored = this.descriptionRenderer && !options.version
            ? this.descriptionRenderer(file)
            : null;

        if (authored || file.description) {
            const descIcon = document.createElement("i");
            descIcon.className = `${this._iconClass("circle-info")} text-muted`;
            divMiddle.appendChild(descIcon);
            // an authored cell is shown even for an empty description, so an
            // editor the host installed stays reachable on a file that has
            // no description yet
            divMiddle.appendChild(authored || document.createTextNode(file.description));
        }

        middle.appendChild(divMiddle);

        // right: szie + date
        const right = document.createElement("td");
        const divRight = document.createElement("div");

        if (file.size) {
            const size = document.createElement("span");
            const sizeIcon = document.createElement("i");
            sizeIcon.className = `${this._iconClass("database")} text-muted`;
            size.appendChild(sizeIcon);
            size.appendChild(document.createTextNode(file.size));
            divRight.appendChild(size);
        }

        if (file.date) {
            const date = document.createElement("span");
            const dateIcon = document.createElement("i");
            dateIcon.className = `${this._iconClass("calendar")} text-muted`;
            date.appendChild(dateIcon);
            date.appendChild(document.createTextNode(file.date));
            divRight.appendChild(date);
        }

        right.appendChild(divRight);

        tr.appendChild(left);
        tr.appendChild(middle);
        tr.appendChild(right);

        return tr;
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-file-list", webexpress.webui.FileListCtrl);
