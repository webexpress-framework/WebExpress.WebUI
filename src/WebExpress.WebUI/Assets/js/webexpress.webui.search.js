/**
 * A field where search commands can be entered.
 * The following events are triggered:
 * - webexpress.webui.change.filter with parameter filter.
 * - webexpress.webui.change.favorite with details on favorite changes.
 */
webexpress.webui.SearchCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element - The DOM element for the search control.
     */
    constructor(element) {
        super(element);

        // Extract attributes and child elements for configuration
        const placeholder = $(element).attr("placeholder") || null;
        const icon = $(element).data("icon") || "fas fa-search";
        const suggestions = this._extractSuggestions($(element));
        const footer = $(element).find(".wx-search-footer").html();

        // Build the search components
        const searchBox = this._createSearchBox();
        const searchIcon = this._createSearchIcon(icon);
        const searchInput = this._createSearchInput(placeholder);
        const searchClear = this._createSearchClearButton(searchInput);
        const suggestionMenu = this._createSuggestionMenu(searchInput, suggestions, footer);

        searchBox
            .append(searchIcon, searchInput, searchClear)
            .addClass("form-control");

        // Append components to the main container
        $(this._element)
            .empty()
            .append(searchBox)
            .addClass("wx-search");

        // Attach the suggestion box using Popper.js
        this._initializePopper(searchBox[0], suggestionMenu);
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
        return $("<div>");
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
     * @param {string} placeholder - The placeholder text for the input field.
     * @returns {jQuery} The search input element.
     */
    _createSearchInput(placeholder) {
        const searchInput = $("<input>")
            .attr({
                type: "text",
                placeholder: placeholder,
                "aria-label": placeholder,
            });

        // Trigger the filter change event on keyup
        searchInput.keyup(() => {
            $(document).trigger(webexpress.webui.Event.CHANGE_FILTER_EVENT, searchInput.val());
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
            searchInput.val("");
            $(document).trigger(webexpress.webui.Event.CHANGE_FILTER_EVENT, "");
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

            // Hide the suggestion box if the input is empty
            if (!query) {
                suggestionMenu.hide();
                return;
            }

            // Separate suggestions into favorited and non-favorited
            const favoritedSuggestions = suggestions.filter((item) => item.favorited);
            const nonFavoritedSuggestions = suggestions.filter((item) => !item.favorited);

            // Function to create a suggestion item
            const createSuggestionItem = (suggestion) => {
                const suggestionItem = $("<li class='dropdown-item'>");
                const suggestionContainer = $("<div>");
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

                // Add a star icon for favoriting
                const favoriteIcon = $("<i>")
                    .addClass(suggestion.favorited ? "fas fa-star text-warning" : "far fa-star text-muted")
                    .css({ cursor: "pointer" })
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

                // Handle click on the suggestion item
                suggestionItem.click(() => {
                    searchInput.val(suggestion.label); // Set the selected suggestion as the input value
                    $(document).trigger(webexpress.webui.Event.CHANGE_FILTER_EVENT, suggestion.label); // Trigger the event
                    suggestionMenu.hide(); // Hide the suggestion box
                    searchInput.focus(); // Refocus the input field
                });

                return suggestionItem;
            };

            // Render favorited suggestions
            favoritedSuggestions
                .filter((item) => item.label.toLowerCase().includes(query))
                .forEach((suggestion) => {
                    suggestionBox.append(createSuggestionItem(suggestion));
                });

            // Add a horizontal separator if there are both favorited and non-favorited suggestions
            if (favoritedSuggestions.length > 0 && nonFavoritedSuggestions.length > 0) {
                suggestionBox.append($("<li>").addClass("dropdown-divider"));
            }

            // Render non-favorited suggestions
            nonFavoritedSuggestions
                .filter((item) => item.label.toLowerCase().includes(query))
                .forEach((suggestion) => {
                    suggestionBox.append(createSuggestionItem(suggestion));
                });

            // Show the suggestion box if there are matches, otherwise hide it
            if (suggestionBox.children().length > 0) {
                const width = $(this._element).width();
                suggestionMenu.width(width);
                suggestionMenu.css("display", "flex").show();
            } else {
                suggestionMenu.hide();
            }
        });

        // Append footer if present
        if (footer) {
            suggestionMenu.append($("<footer>").html(footer));
        }

        return suggestionMenu;
    }

    /**
     * Initializes Popper.js for managing the suggestion box positioning.
     * @param {HTMLElement} container - The container element (searchBox) to position the suggestion box relative to.
     * @param {jQuery} suggestionContainer - The suggestion box element.
     */
    _initializePopper(container, suggestionContainer) {
        $(this._element).append(suggestionContainer);

        Popper.createPopper(container, suggestionContainer[0], {
            placement: "bottom-start",
            modifiers: [
                {
                    name: "offset",
                    options: {
                        offset: [0, 4], // Offset the suggestion box slightly
                    },
                },
                {
                    name: "preventOverflow",
                    options: {
                        boundary: "viewport", // Ensure the suggestion box stays within the viewport
                    },
                },
            ],
        });

        // Hide suggestion box when clicking outside
        $(document).on("click", (event) => {
            if (!$(event.target).closest(this._element).length) {
                suggestionContainer.hide();
            }
        });
    }
};

// Register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-search", webexpress.webui.SearchCtrl);