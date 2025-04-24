using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a search control.
    /// </summary>
    public class ControlSearch : Control
    {
        private readonly List<ControlSearchItemSuggestion> _suggestion = [];

        /// <summary>
        /// Returns the collection of suggestion items contained in the control.
        /// </summary>
        public IEnumerable<ControlSearchItemSuggestion> Suggestions => _suggestion;

        /// <summary>
        /// Returns or sets the value of the search input.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Returns or sets the placeholder text displayed in the search input.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Returns or sets the icon displayed in the search control.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the footer control displayed below the search suggestions.
        /// </summary>
        public IControl Footer { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="ControlSearch"/> class.
        /// </summary>
        /// <param name="id">The ID of the control.</param>
        /// <param name="suggestions">The suggestion items to initialize the control with.</param>
        public ControlSearch(string id = null, params ControlSearchItemSuggestion[] suggestions)
            : base(id)
        {
            _suggestion.AddRange(suggestions);
        }

        /// <summary>
        /// Adds the specified suggestion items to the control.
        /// </summary>
        /// <param name="items">The suggestion items to add.</param>
        public void Add(params ControlSearchItemSuggestion[] items)
        {
            _suggestion.AddRange(items);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv
            (
                [.. _suggestion.Select(x =>
                {
                    var div = new HtmlElementTextContentDiv(new HtmlText(x.Label))
                    {
                        Id = x.Id,
                        Class = Css.Concatenate("wx-search-suggestion", x.Css),
                    };

                    if (x.Icon is Icon icon)
                    {
                        div.AddUserAttribute("data-icon", icon.Class);
                    }

                    if (x.Icon is ImageIcon image)
                    {
                        div.AddUserAttribute("data-image", image.Uri?.ToString());
                    }

                    if (x.Favorited)
                    {
                        div.AddUserAttribute("data-favorited", "true");
                    }

                    if (!string.IsNullOrWhiteSpace(x.Css))
                    {
                        div.AddUserAttribute("css", x.Css);
                    }

                    return div;
                })]
            )
            {
                Id = Id,
                Class = "wx-webui-search"
            };

            if (!string.IsNullOrWhiteSpace(Placeholder))
            {
                html.AddUserAttribute("placeholder", I18N.Translate(renderContext, Placeholder));
            }

            return html;
        }
    }
}
