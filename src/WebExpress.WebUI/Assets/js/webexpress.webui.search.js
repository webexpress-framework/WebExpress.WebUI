/**
 * A field where search commands can be entered.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_FILTER_EVENT
 * - webexpress.webui.Event.CHANGE_FAVORITE_EVENT
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT
 */
webexpress.webui.SearchCtrl = class extends webexpress.webui.PopperCtrl {
    // holds the current search value
    _value = "";

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element for the search control.
     */
    constructor(element) {
        super(element);

        // extract configuration from DOM attributes and children
        const name = element.getAttribute("name");
        const placeholder = element.getAttribute("placeholder") || null;
        const icon = element.dataset.icon || "fas fa-search";
        const suggestions = this._extractSuggestions(element);
        const footerElem = element.querySelector(".wx-search-footer");
        const footer = footerElem ? footerElem.innerHTML : null;
        this._favorited = element.dataset.favorited === "true";
        this._value = element.dataset.value || "";

        // Build the search UI
        this._searchBox = this._createSearchBox();
        this._searchIcon = this._createSearchIcon(icon);
        this._searchInput = this._createSearchInput(name, placeholder);
        this._searchClear = this._createSearchClearButton();
        this._suggestionMenu = this._createSuggestionMenu(suggestions, footer);

        this._searchBox.classList.add("form-control");
        this._searchBox.appendChild(this._searchIcon);
        this._searchBox.appendChild(this._searchInput);
        this._searchBox.appendChild(this._searchClear);

        // clean up DOM and add built elements
        element.removeAttribute("name");
        element.removeAttribute("placeholder");
        element.removeAttribute("data-favorited");
        element.innerHTML = "";
        element.classList.add("wx-search");
        element.appendChild(this._searchBox);
        element.appendChild(this._suggestionMenu);

        // set up popper for the suggestion menu
        this._initializePopper(this._searchBox, this._suggestionMenu);
    }

    /**
     * Extracts suggestions from child <div> elements with the class "wx-search-suggestion".
     * @param {HTMLElement} container - The container element to extract suggestions from.
     * @returns {Array<Object>} An array of suggestion objects.
     */
    _extractSuggestions(container) {
        const suggestions = [];
        container.querySelectorAll("div.wx-search-suggestion").forEach(child => {
            suggestions.push({
                id: child.id || null,
                label: child.textContent.trim(),
                icon: child.dataset.icon || null,
                image: child.dataset.image || null,
                color: child.dataset.color || null,
                favorited: child.dataset.favorited === "true"
            });
        });
        return suggestions;
    }

    /**
     * Creates the search box element.
     * @returns {HTMLElement} The search box element.
     */
    _createSearchBox() {
        const searchBox = document.createElement("div");
        // close suggestion menu if clicked outside
        document.addEventListener("click", (e) => {
            if (!searchBox.contains(e.target) && !this._suggestionMenu.contains(e.target)) {
                this._suggestionMenu.style.display = "none";
                this._triggerDropdownHidden();
            }
        });
        return searchBox;
    }

    /**
     * Creates the search icon element.
     * @param {string} iconClass - The CSS class for the icon.
     * @returns {HTMLElement} The search icon element.
     */
    _createSearchIcon(iconClass) {
        const label = document.createElement("label");
        const icon = document.createElement("i");
        icon.className = iconClass;
        label.appendChild(icon);
        return label;
    }

    /**
     * Creates the search input field.
     * @param {string} name - The name for the input field.
     * @param {string} placeholder - The placeholder text for the input field.
     * @returns {HTMLElement} The search input element.
     */
    _createSearchInput(name, placeholder) {
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        if (name) searchInput.name = name;
        if (placeholder) {
            searchInput.placeholder = placeholder;
            searchInput.setAttribute("aria-label", placeholder);
        }
        searchInput.value = this._value;

        // update value on input
        searchInput.addEventListener("keyup", () => {
            this.value = searchInput.value;
        });
        searchInput.addEventListener("input", () => {
            this._refreshSuggestions();
        });

        return searchInput;
    }

    /**
     * Creates the clear button for the search field.
     * @returns {HTMLElement} The clear button element.
     */
    _createSearchClearButton() {
        const searchClear = document.createElement("span");
        const icon = document.createElement("i");
        icon.className = "fas fa-times";
        searchClear.appendChild(icon);
        searchClear.style.cursor = "pointer";
        searchClear.addEventListener("click", () => {
            this.value = "";
            this._searchInput.focus();
            this._refreshSuggestions();
        });
        return searchClear;
    }

    /**
     * Creates the suggestion dropdown box with a separator for favorited suggestions.
     * @param {Array<Object>} suggestions - An array of suggestion objects.
     * @param {string|null} footer - Footer HTML to display additional information.
     * @returns {HTMLElement} The suggestion container element.
     */
    _createSuggestionMenu(suggestions, footer) {
        const suggestionMenu = document.createElement("div");
        suggestionMenu.className = "dropdown-menu";
        suggestionMenu.style.display = "none";

        const suggestionBox = document.createElement("ul");
        suggestionMenu.appendChild(suggestionBox);

        // store for use in _refreshSuggestions
        this._suggestions = suggestions;
        this._suggestionBox = suggestionBox;

        if (footer) {
            const footerElem = document.createElement("footer");
            footerElem.innerHTML = footer;
            suggestionMenu.appendChild(footerElem);
        }

        // open on focus
        this._searchInput.addEventListener("focus", () => {
            this._refreshSuggestions();
        });

        return suggestionMenu;
    }

    /**
     * Updates the suggestion box based on the current input value.
     */
    _refreshSuggestions() {
        const query = (this._searchInput.value || "").toLowerCase();
        const suggestionBox = this._suggestionBox;
        suggestionBox.innerHTML = "";

        // split suggestions into favorited and non-favorited
        const favoritedSuggestions = this._suggestions.filter(item => item.favorited);
        const nonFavoritedSuggestions = this._suggestions.filter(item => !item.favorited);

        // helper to create a suggestion item
        const createSuggestionItem = (suggestion) => {
            const suggestionItem = document.createElement("li");
            suggestionItem.className = "dropdown-item";
            const container = document.createElement("a");
            container.href = "#";
            // icon or image
            if (suggestion.icon) {
                const icon = document.createElement("i");
                icon.className = suggestion.icon;
                container.appendChild(icon);
            }
            if (suggestion.image) {
                const img = document.createElement("img");
                img.src = suggestion.image;
                container.appendChild(img);
            }
            // label
            const label = document.createElement("span");
            label.textContent = suggestion.label;
            if (suggestion.color) label.className = suggestion.color;
            container.appendChild(label);

            suggestionItem.appendChild(container);

            // star for favoriting
            if (this._favorited) {
                const favoriteIcon = document.createElement("i");
                favoriteIcon.className = suggestion.favorited ? "fas fa-star text-warning" : "far fa-star text-muted";
                favoriteIcon.style.cursor = "pointer";
                favoriteIcon.addEventListener("click", (event) => {
                    event.stopPropagation();
                    suggestion.favorited = !suggestion.favorited;

                    // fire CHANGE_FAVORITE_EVENT
                    this._dispatch(webexpress.webui.Event.CHANGE_FAVORITE_EVENT, {
                        label: suggestion.label,
                        favorited: suggestion.favorited
                    });
                    this._refreshSuggestions();
                });
                suggestionItem.appendChild(favoriteIcon);
            }

            suggestionItem.addEventListener("click", (event) => {
                event.preventDefault();
                this.value = suggestion.label;
                this._suggestionMenu.style.display = "none";
                this._triggerDropdownHidden();
                this._searchInput.focus();
            });
            return suggestionItem;
        };

        // render favorited suggestions always
        favoritedSuggestions.forEach(suggestion => {
            suggestionBox.appendChild(createSuggestionItem(suggestion));
        });

        // separator if both types exist
        if (favoritedSuggestions.length > 0 && nonFavoritedSuggestions.length > 0) {
            const divider = document.createElement("li");
            divider.className = "dropdown-divider";
            suggestionBox.appendChild(divider);
        }

        // render non-favorited suggestions that match query
        nonFavoritedSuggestions
            .filter(item => item.label.toLowerCase().includes(query))
            .forEach(suggestion => {
                suggestionBox.appendChild(createSuggestionItem(suggestion));
            });

        if (suggestionBox.children.length > 0) {
            this._suggestionMenu.style.display = "flex";
            this._triggerDropdownShow();
        } else {
            this._suggestionMenu.style.display = "none";
            this._triggerDropdownHidden();
        }
    }

    /**
     * Triggers the DROPDOWN_SHOW_EVENT.
     */
    _triggerDropdownShow() {
        this._dispatch(webexpress.webui.Event.DROPDOWN_SHOW_EVENT, {});
    }

    /**
     * Triggers the DROPDOWN_HIDDEN_EVENT.
     */
    _triggerDropdownHidden() {
        this._dispatch(webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT, {});
    }

    /**
     * Gets the current value of the search input.
     * @returns {string} The value of the search input field.
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the value of the search input and triggers a filter change event.
     * @param {string} value - The new value to set.
     */
    set value(value) {
        if (this._value !== value) {
            this._value = value;
            this._searchInput.value = value;
            this._dispatch(webexpress.webui.Event.CHANGE_FILTER_EVENT, { value: value });
        }
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-search", webexpress.webui.SearchCtrl);