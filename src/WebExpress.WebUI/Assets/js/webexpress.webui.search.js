/**
 * A field where search commands can be entered.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_FILTER_EVENT
 * - webexpress.webui.Event.CHANGE_FAVORITE_EVENT
 * - webexpress.webui.Event.DROPDOWN_SHOW_EVENT
 * - webexpress.webui.Event.DROPDOWN_HIDDEN_EVENT
 */
webexpress.webui.SearchCtrl = class extends webexpress.webui.PopperCtrl {
    _value = "";

    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element for the search control.
     */
    constructor(element) {
        super(element);

        // Extract attributes and child elements for configuration
        const name = $(element).attr("name");
        const placeholder = $(element).attr("placeholder") || null;
        const icon = $(element).data("icon") || "fas fa-search";
        const suggestions = this._extractSuggestions($(element));
        const footer = $(element).find(".wx-search-footer").html();
        this._favorited = $(element).data("favorited") || false;
        this._value = $(element).data("value") || "";

        // Build the search components
        this._searchBox = this._createSearchBox();
        this._searchIcon = this._createSearchIcon(icon);
        this._searchInput = this._createSearchInput(name, placeholder);
        this._searchClear = this._createSearchClearButton(this._searchInput);
        this._suggestionMenu = this._createSuggestionMenu(this._searchInput, suggestions, footer);

        this._searchBox
            .append(this._searchIcon, this._searchInput, this._searchClear)
            .addClass("form-control");

        // Append components to the main container
        $(this._element)
            .removeAttr("name placeholder data-favorited")
            .empty()
            .append(this._searchBox, this._suggestionMenu)
            .addClass("wx-search");

        // Attach the suggestion box using Popper.js
        this._initializePopper(this._searchBox[0], this._suggestionMenu);
    }

    /**
     * Extracts suggestions from child <div> elements with the class "wx-search-suggestion".
     * @param {jQuery} container - The container element to extract suggestions from.
     * @returns {Array<Object>} An array of suggestion objects.
     */
    _extractSuggestions(container) {
        const suggestions = [];
        container.children("div.wx-search-suggestion").each((_, child) => {
            const $child = $(child);

            suggestions.push({
                id: $child.attr("id") || null,
                label: $child.text().trim(),
                icon: $child.data("icon") || null,
                image: $child.data("image") || null,
                color: $child.data("color") || null,
                favorited: $child.data("favorited") === true,
            });
        });
        return suggestions;
    }

    /**
     * Creates the search box element.
     * @returns {jQuery} The search box element.
     */
    _createSearchBox() {
        const searchBox = $("<div>");

        $(document).click((e) => {
            if (!searchBox[0].contains(e.target) && !this._suggestionMenu[0].contains(e.target)) {
                this._suggestionMenu.trigger("hide").hide();
            }
        });

        return searchBox;
    }

    /**
     * Creates the search icon element.
     * @param {string} iconClass - The CSS class for the icon.
     * @returns {jQuery} The search icon element.
     */
    _createSearchIcon(iconClass) {
        return $("<label>").append($("<i>").addClass(iconClass));
    }

    /**
     * Creates the search input field.
     * @param {string} name - The name for the input field.
     * @param {string} placeholder - The placeholder text for the input field.
     * @returns {jQuery} The search input element.
     */
    _createSearchInput(name, placeholder) {
        const searchInput = $("<input>")
            .attr({
                type: "text",
                name: name,
                placeholder: placeholder,
                "aria-label": placeholder,
            })
            .val(this._value);

        // Trigger the filter change event on keyup
        searchInput.keyup(() => {
            this.value = searchInput.val();
        });

        return searchInput;
    }

    /**
     * Creates the clear button for the search field.
     * @param {jQuery} searchInput - The input element to clear.
     * @returns {jQuery} The clear button element.
     */
    _createSearchClearButton(searchInput) {
        const searchClear = $("<span>").append($("<i>").addClass("fas fa-times"));

        // Clear the input and trigger the filter change event on click
        searchClear.click(() => {
            this.value = "";
        });

        return searchClear;
    }

    /**
     * Creates the suggestion dropdown box with a separator for favorited suggestions.
     * @param {jQuery} searchInput - The input element to bind suggestions to.
     * @param {Array<Object>} suggestions - An array of suggestion objects.
     * @param {jQuery} footer - Footer element to display additional information.
     * @returns {jQuery} The suggestion container element.
     */
    _createSuggestionMenu(searchInput, suggestions, footer) {
        const suggestionBox = $("<ul>");
        const suggestionMenu = $("<div class='dropdown-menu'>").append(suggestionBox);

        // Event listener for input changes in the search field
        searchInput.on("input", () => {
            const query = searchInput.val().toLowerCase();
            suggestionBox.empty();

            // Separate suggestions into favorited and non-favorited
            const favoritedSuggestions = suggestions.filter((item) => item.favorited);
            const nonFavoritedSuggestions = suggestions.filter((item) => !item.favorited);

            // Function to create a suggestion item
            const createSuggestionItem = (suggestion) => {
                const suggestionItem = $("<li class='dropdown-item'>");
                const suggestionContainer = $("<a href='#'>");
                const suggestionLabel = $("<span>")
                    .text(suggestion.label)
                    .addClass(suggestion.color || ""); // Apply color if specified

                // Add icon or image if available
                if (suggestion.icon) {
                    suggestionContainer.append($("<i>").addClass(suggestion.icon));
                }
                if (suggestion.image) {
                    suggestionContainer.append($("<img>").attr("src", suggestion.image));
                }

                // Add label
                suggestionContainer.append(suggestionLabel);

                // Append the suggestionContainer
                suggestionItem.append(suggestionContainer);

                if (this._favorited) {
                    // Add a star icon for favoriting
                    const favoriteIcon = $("<i>")
                        .addClass(suggestion.favorited ? "fas fa-star text-warning" : "far fa-star text-muted")
                        .click((event) => {
                            event.stopPropagation(); // Prevent triggering the suggestion selection
                            suggestion.favorited = !suggestion.favorited; // Toggle favorite status

                            // Trigger the CHANGE_FAVORITE_EVENT
                            $(document).trigger(webexpress.webui.Event.CHANGE_FAVORITE_EVENT, {
                                id: suggestion.id,
                                label: suggestion.label,
                                favorited: suggestion.favorited,
                            });

                            searchInput.trigger("input"); // Refresh the suggestion list
                        });

                    // Append the star icon to the suggestion item
                    suggestionItem.append(favoriteIcon);
                }

                // Handle click on the suggestion item
                suggestionItem.click(() => {
                    this.value = suggestion.label; // Set the selected suggestion as the input value
                    suggestionMenu.trigger("hide").hide(); // Hide the suggestion box
                    searchInput.focus(); // Refocus the input field
                });

                return suggestionItem;
            };

            // Always render favorited suggestions
            favoritedSuggestions.forEach((suggestion) => {
                suggestionBox.append(createSuggestionItem(suggestion));
            });

            // Add a horizontal separator if there are non-favorited suggestions
            if (nonFavoritedSuggestions.length > 0) {
                suggestionBox.append($("<li>").addClass("dropdown-divider"));
            }

            // Render non-favorited suggestions that match the query
            nonFavoritedSuggestions
                .filter((item) => item.label.toLowerCase().includes(query))
                .forEach((suggestion) => {
                    suggestionBox.append(createSuggestionItem(suggestion));
                });

            // Show the suggestion box if there are any suggestions, otherwise hide it
            if (suggestionBox.children().length > 0) {
                suggestionMenu.css("display", "flex").trigger("show");
            }
        });

        // Append footer if present
        if (footer) {
            suggestionMenu.append($("<footer>").html(footer));
        }

        return suggestionMenu;
    }

    /** 
     * Getter method for retrieving the current value of the search input.
     * @returns {string} Returns the value of the search input field
     */
    get value() {
        return this._value;
    }

    /**
     * Setter method for updating the value of the search input and triggers events.
     */
    set value(value) {
        if (this._value !== value) {
            this._value = value;
            this._searchInput.val(value); // Update the search input field with the new value
            // Trigger a custom event to notify about the value change, passing the new value
            $(document).trigger(webexpress.webui.Event.CHANGE_FILTER_EVENT,
                {
                    id: $(this._element).attr("id"),
                    value: value
                });
        }
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-search", webexpress.webui.SearchCtrl);