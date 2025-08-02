/**
 * A file list control.
 */
webexpress.webui.FileListCtrl = class extends webexpress.webui.Ctrl {

    /**
     * Constructor for initializing the control.
     * @param {HTMLElement} element - The DOM element for the control.
     */
    constructor(element) {
        super(element);

        // configuration from data attributes
        this._initialFiles = Array.from(element.querySelectorAll(".wx-webui-file")).map(e => ({
            name: e.textContent.trim(),
            uri: e.dataset.fileUri || "#",
            icon: e.dataset.fileIcon || e.dataset.fileImage == null
                ? this._getIconForFilename(e.textContent.trim())
                : null,
            image: e.dataset.fileImage ||null,
            date: e.dataset.fileDate || null,
            size: e.dataset.fileSize || null,
            description: e.dataset.description || null
        }));

        this.files = [];

        // clean up the DOM element
        element.innerHTML = "";
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
     * Returns a Font Awesome icon class based on the file extension.
     * @param {string} filename - The name of the file (e.g., "report.pdf").
     * @returns {string} - The corresponding Font Awesome icon class (e.g., "fas fa-file-pdf").
     */
    _getIconForFilename(filename) {
        const ext = filename.split('.').pop().toLowerCase();

        const iconMap = {
            doc: "fas fa-file-word",
            docx: "fas fa-file-word",
            xls: "fas fa-file-excel",
            xlsx: "fas fa-file-excel",
            csv: "fas fa-file-csv",
            ppt: "fas fa-file-powerpoint",
            pptx: "fas fa-file-powerpoint",
            pdf: "fas fa-file-pdf",
            txt: "fas fa-file-alt",
            jpg: "fas fa-file-image",
            jpeg: "fas fa-file-image",
            png: "fas fa-file-image",
            gif: "fas fa-file-image",
            zip: "fas fa-file-archive",
            rar: "fas fa-file-archive",
            mp3: "fas fa-file-audio",
            wav: "fas fa-file-audio",
            mp4: "fas fa-file-video",
            mov: "fas fa-file-video"
        };

        return iconMap[ext] || "fas fa-file";
    }

    /**
     * Refreshes the tree control by rendering the latest node structure.
     */
    render() {
        const table = document.createElement("table");
        const body = document.createElement("tbody");
        table.className = "table table-hover";
        this._initialFiles.forEach(file => {
            const tr = document.createElement("tr");

            // left: icon + filename
            const left = document.createElement("td");
            const divLeft = document.createElement("div");

            if (file.image) {
                const image = document.createElement("img");
                image.src = file.image;
                divLeft.appendChild(image);
            }

            if (file.icon) {
                const icon = document.createElement("i");
                icon.className = file.icon || "fas fa-file";
                divLeft.appendChild(icon);
            }

            const link = document.createElement("a");
            link.href = file.uri;
            link.textContent = file.name;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "link";
            
            divLeft.appendChild(link);
            left.appendChild(divLeft);

            // middle: description
            const middle = document.createElement("td");
            const divMiddle = document.createElement("div");

            if (file.description) {
                const descIcon = document.createElement("i");
                descIcon.className = "fas fa-info-circle text-muted";
                divMiddle.appendChild(descIcon);
                divMiddle.appendChild(document.createTextNode(file.description));
            }
            
            middle.appendChild(divMiddle);

            // right: szie + date
            const right = document.createElement("td");
            const divRight = document.createElement("div");

            if (file.size) {
                const size = document.createElement("span");
                const sizeIcon = document.createElement("i");
                sizeIcon.className = "fas fa-database text-muted";
                size.appendChild(sizeIcon);
                size.appendChild(document.createTextNode(file.size));
                divRight.appendChild(size);
            }

            if (file.date) {
                const date = document.createElement("span");
                const dateIcon = document.createElement("i");
                dateIcon.className = "fas fa-calendar-alt text-muted";
                date.appendChild(dateIcon);
                date.appendChild(document.createTextNode(file.date));
                divRight.appendChild(date);
            }
            
            right.appendChild(divRight);

            tr.appendChild(left);
            tr.appendChild(middle);
            tr.appendChild(right);
            body.appendChild(tr);
        });
        table.appendChild(body);
        this._storage.appendChild(table);
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-file-list", webexpress.webui.FileListCtrl);